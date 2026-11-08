//! Shared component-authoring validation for form and automation entry points.
use std::collections::{BTreeMap, BTreeSet};

use crate::{
    component_behaviour::{document_nodes, validate_component_behaviour},
    EditorCommand, EditorState, NodeId, PenNodeExt,
};
use jian_ops_schema::{
    component::{ComponentProperty, ComponentPropertyKind, ComponentSlot},
    node::PenNode,
};
use serde_json::{json, Value};

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ComponentAuthoringError(pub String);
impl std::fmt::Display for ComponentAuthoringError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(&self.0)
    }
}
impl std::error::Error for ComponentAuthoringError {}

pub fn descendant<'a>(node: &'a PenNode, id: &str) -> Option<&'a PenNode> {
    if node.id_str() == id {
        return Some(node);
    }
    node.children()?
        .iter()
        .find_map(|child| descendant(child, id))
}

pub fn validate_property_target(
    property: &ComponentProperty,
    master: &PenNode,
) -> Result<(), ComponentAuthoringError> {
    let target = descendant(master, &property.target_id)
        .ok_or_else(|| ComponentAuthoringError("targetId must belong to the component".into()))?;
    let error = match property.kind {
        ComponentPropertyKind::Text if !matches!(target, PenNode::Text(_)) => {
            Some("text property requires a text target")
        }
        ComponentPropertyKind::InstanceSwap if !matches!(target, PenNode::Ref(_)) => {
            Some("instance-swap property requires a Ref target")
        }
        _ => None,
    };
    match error {
        Some(error) => Err(ComponentAuthoringError(error.into())),
        None => Ok(()),
    }
}

pub fn validate_slot(
    slot: &ComponentSlot,
    master: &PenNode,
) -> Result<(), ComponentAuthoringError> {
    if slot.target_id == master.id_str() {
        return Err(ComponentAuthoringError(
            "slot target must be a descendant container, not the component root".into(),
        ));
    }
    if !matches!(
        descendant(master, &slot.target_id),
        Some(PenNode::Frame(_) | PenNode::Group(_) | PenNode::Rectangle(_))
    ) {
        return Err(ComponentAuthoringError(
            "slot target must be a descendant container".into(),
        ));
    }
    if slot.max.is_some_and(|max| max < slot.min) {
        return Err(ComponentAuthoringError(
            "slot maximum must be at least its minimum".into(),
        ));
    }
    Ok(())
}

pub fn validate_reference_target(
    nodes: &BTreeMap<String, &PenNode>,
    source: &str,
    target: &str,
) -> Result<(), ComponentAuthoringError> {
    let target_node = nodes
        .get(target)
        .ok_or_else(|| ComponentAuthoringError(format!("node {target} not found")))?;
    if !matches!(target_node, PenNode::Frame(frame) if frame.reusable == Some(true)) {
        return Err(ComponentAuthoringError(format!(
            "{target} must be a reusable frame"
        )));
    }
    let mut pending = vec![*target_node];
    let mut seen = BTreeSet::new();
    while let Some(node) = pending.pop() {
        if node.id_str() == source {
            return Err(ComponentAuthoringError(format!(
                "component reference to {target} would create a cycle"
            )));
        }
        if !seen.insert(node.id_str()) {
            continue;
        }
        if let PenNode::Ref(reference) = node {
            pending.push(nodes.get(&reference.target).ok_or_else(|| {
                ComponentAuthoringError(format!("node {} not found", reference.target))
            })?);
        }
        if let Some(children) = node.children() {
            pending.extend(children);
        }
    }
    Ok(())
}

pub fn validate_slot_content(
    slot: &ComponentSlot,
    children: &[PenNode],
    nodes: &BTreeMap<String, &PenNode>,
    instance_id: &str,
    master_id: &str,
) -> Result<(), ComponentAuthoringError> {
    if children.len() < slot.min || slot.max.is_some_and(|max| children.len() > max) {
        return Err(ComponentAuthoringError(format!(
            "slot requires at least {} and at most {} children",
            slot.min,
            slot.max.map(|n| n.to_string()).unwrap_or("∞".into())
        )));
    }
    let mut ids = BTreeSet::new();
    let mut pending: Vec<_> = children.iter().collect();
    while let Some(node) = pending.pop() {
        let id = node.id_str();
        if id.trim().is_empty() || !ids.insert(id) {
            return Err(ComponentAuthoringError(
                "slot children must have distinct nonempty ids".into(),
            ));
        }
        if id == instance_id || id == master_id {
            return Err(ComponentAuthoringError(
                "slot content must not contain its owner".into(),
            ));
        }
        if let PenNode::Ref(reference) = node {
            validate_reference_target(nodes, master_id, &reference.target)?;
        }
        if let Some(children) = node.children() {
            pending.extend(children);
        }
    }
    Ok(())
}

/// Prepare the existing undoable patch command, checking the complete resulting
/// contract before any document mutation (including Behaviour dependencies).
pub fn prepare_patch(
    state: &EditorState,
    id: &str,
    patch: Value,
) -> Result<EditorCommand, ComponentAuthoringError> {
    let fail = |reason: &str| ComponentAuthoringError(reason.into());
    if state.selection_count() != 1 || !state.selection.anchor.is_real() {
        return Err(fail("select one authored component or instance"));
    }
    fn editable(nodes: &[PenNode], id: &str, allowed: bool) -> Option<bool> {
        nodes.iter().find_map(|node| {
            let allowed = allowed
                && node.base().visible.unwrap_or(true)
                && !node.base().locked.unwrap_or(false);
            if node.id_str() == id {
                Some(allowed)
            } else {
                node.children()
                    .and_then(|children| editable(children, id, allowed))
            }
        })
    }
    let is_editable = |id: &str| {
        editable(&state.doc.children, id, true).or_else(|| {
            state
                .doc
                .pages
                .iter()
                .flatten()
                .find_map(|page| editable(&page.children, id, true))
        }) == Some(true)
    };
    if !is_editable(id) || !is_editable(state.selection.anchor.as_str()) {
        return Err(fail(
            "component target is missing, hidden, locked or inside a locked ancestor",
        ));
    }
    let mut candidate = state.doc.clone();
    let page_id = if let Some(pages) = candidate.pages.as_mut() {
        pages
            .iter()
            .find(|page| {
                page.children
                    .iter()
                    .any(|node| descendant(node, id).is_some())
            })
            .map(|page| page.id.clone())
    } else {
        None
    };
    fn patch_node(
        nodes: &mut [PenNode],
        id: &str,
        patch: &Value,
    ) -> Result<bool, ComponentAuthoringError> {
        for node in nodes {
            if node.id_str() == id {
                let mut value = json!(node);
                value
                    .as_object_mut()
                    .unwrap()
                    .extend(patch.as_object().unwrap().clone());
                *node = serde_json::from_value(value)
                    .map_err(|error| ComponentAuthoringError(error.to_string()))?;
                return Ok(true);
            }
            if let Some(children) = node.children_mut() {
                if patch_node(children, id, patch)? {
                    return Ok(true);
                }
            }
        }
        Ok(false)
    }
    if !patch.is_object() {
        return Err(fail("component patch must be an object"));
    }
    let mut found = patch_node(&mut candidate.children, id, &patch)?;
    if !found {
        for page in candidate.pages.iter_mut().flatten() {
            if patch_node(&mut page.children, id, &patch)? {
                found = true;
                break;
            }
        }
    }
    if !found {
        return Err(fail("component target not found"));
    }
    let nodes = document_nodes(&candidate);
    for node in nodes.values().filter(|node| node.id_str() == id) {
        if let Some(design) = &node.base().component_design {
            for property in design.properties.values() {
                validate_property_target(property, node)?;
                if !property.accepts(&property.default) {
                    return Err(fail("default does not match the property kind"));
                }
                if property.kind == ComponentPropertyKind::InstanceSwap {
                    validate_reference_target(
                        &nodes,
                        &property.target_id,
                        property.default.as_str().unwrap_or_default(),
                    )?;
                }
            }
            for slot in design.slots.values() {
                validate_slot(slot, node)?;
            }
            if let Some(behaviour) = crate::component_behaviour::definition(node) {
                validate_component_behaviour(&candidate, node.id_str(), behaviour)
                    .map_err(|error| ComponentAuthoringError(error.to_string()))?;
            }
        }
    }
    for node in nodes.values().filter(|node| {
        node.id_str() == id || matches!(node, PenNode::Ref(reference) if reference.target == id)
    }) {
        if let PenNode::Ref(reference) = node {
            validate_reference_target(&nodes, node.id_str(), &reference.target)?;
            let master = nodes[&reference.target];
            for (name, value) in node.base().component_values.iter().flatten() {
                let property = master
                    .base()
                    .component_design
                    .as_ref()
                    .and_then(|design| design.properties.get(name))
                    .ok_or_else(|| {
                        ComponentAuthoringError(format!("unknown component property {name}"))
                    })?;
                if !property.accepts(value) {
                    return Err(fail("invalid component property value"));
                }
                if property.kind == ComponentPropertyKind::InstanceSwap {
                    validate_reference_target(
                        &nodes,
                        &property.target_id,
                        value.as_str().unwrap_or_default(),
                    )?;
                }
            }
            for slot in master
                .base()
                .component_design
                .iter()
                .flat_map(|design| design.slots.values())
            {
                if let Some(children) = reference
                    .descendants
                    .as_ref()
                    .and_then(|overrides| overrides.get(&slot.target_id))
                    .and_then(|patch| patch.get("children"))
                {
                    let children: Vec<PenNode> = serde_json::from_value(children.clone())
                        .map_err(|error| ComponentAuthoringError(error.to_string()))?;
                    validate_slot_content(slot, &children, &nodes, node.id_str(), master.id_str())?;
                }
            }
        }
    }
    if candidate == state.doc {
        return Ok(EditorCommand::Batch {
            commands: Vec::new(),
        });
    }
    Ok(EditorCommand::Batch {
        commands: vec![EditorCommand::PatchNodeData {
            node_id: NodeId::new(id),
            patch_json: patch.to_string(),
            page_id,
        }],
    })
}
