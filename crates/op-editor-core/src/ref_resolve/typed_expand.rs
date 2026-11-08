//! Typed instance expansion: the JSON route ([`super::expand_ref`]) without
//! serializing, cloning and re-parsing the whole component subtree per
//! instance.
//!
//! The component subtree is cloned as typed nodes; only the instance root and
//! the descendants named in `descendants` round-trip through JSON to merge
//! their partial overrides, with exactly the JSON route's rules (top-level
//! overrides, instance props over component props, component type, name
//! fallback, `refId__childId` ids, override `children` replacing a subtree).
//! Whenever that equivalence is not guaranteed — instance-supplied slot
//! content, or a merge that fails to parse — this returns `None` and the
//! caller takes the JSON route, so results never diverge.

use super::{apply_top_level_overrides, instance_child_virtual_id};
use crate::pen_node_ext::PenNodeExt;
use jian_ops_schema::node::PenNode;
use serde_json::{Map, Value};

/// Detach a container's children, keeping `None` distinct from empty.
fn take_children(node: &mut PenNode) -> Option<Vec<PenNode>> {
    match node {
        PenNode::Frame(n) => n.children.take(),
        PenNode::Group(n) => n.children.take(),
        PenNode::Rectangle(n) => n.children.take(),
        PenNode::Tabs(n) => n.children.take(),
        PenNode::Ref(n) => n.children.take(),
        _ => None,
    }
}

fn put_children(node: &mut PenNode, children: Option<Vec<PenNode>>) {
    match node {
        PenNode::Frame(n) => n.children = children,
        PenNode::Group(n) => n.children = children,
        PenNode::Rectangle(n) => n.children = children,
        PenNode::Tabs(n) => n.children = children,
        PenNode::Ref(n) => n.children = children,
        _ => {}
    }
}

fn object(node: &PenNode) -> Option<Map<String, Value>> {
    match serde_json::to_value(node).ok()? {
        Value::Object(map) => Some(map),
        _ => None,
    }
}

/// Expand `ref_node` against `component` (nested refs are left for the
/// caller). `None` means "use the JSON route".
pub(super) fn expand_ref_typed(ref_node: &PenNode, component: &PenNode) -> Option<PenNode> {
    let mut root = component.clone();
    let component_children = take_children(&mut root);
    let component_map = object(&root)?;
    let mut ref_value = serde_json::to_value(ref_node).ok()?;
    crate::component_properties::apply_values(ref_node, component, &mut ref_value);
    let Value::Object(ref_map) = ref_value else {
        return None;
    };

    let has_component_children = component_children.as_ref().is_some_and(|c| !c.is_empty());
    if !has_component_children && ref_map.get("children").is_some_and(Value::is_array) {
        // Instance-supplied slot content: rare, keep the JSON route.
        return None;
    }

    let mut merged = component_map.clone();
    apply_top_level_overrides(&mut merged, &ref_map);
    for (key, value) in &ref_map {
        if matches!(key.as_str(), "type" | "ref" | "descendants" | "children") {
            continue;
        }
        if !value.is_null() {
            merged.insert(key.clone(), value.clone());
        }
    }
    if let Some(kind) = component_map.get("type") {
        merged.insert("type".into(), kind.clone());
    }
    if merged.get("name").is_none_or(Value::is_null) {
        if let Some(name) = component_map.get("name") {
            merged.insert("name".into(), name.clone());
        }
    }
    merged.remove("reusable");
    merged.remove("componentDesign");
    merged.remove("componentValues");
    let mut expanded: PenNode = serde_json::from_value(Value::Object(merged)).ok()?;

    let ref_id = ref_map
        .get("id")
        .and_then(Value::as_str)
        .unwrap_or_default();
    let overrides = ref_map.get("descendants").and_then(Value::as_object);
    let children = if has_component_children {
        let mut remapped = Vec::new();
        for child in component_children.unwrap_or_default() {
            remapped.push(remap(child, ref_id, overrides)?);
        }
        Some(remapped)
    } else {
        component_children
    };
    put_children(&mut expanded, children);
    Some(expanded)
}

/// Typed `remap_ids`: apply this node's override (by its original id), move
/// it into the instance id space, then recurse with the same override map.
fn remap(
    mut node: PenNode,
    ref_id: &str,
    overrides: Option<&Map<String, Value>>,
) -> Option<PenNode> {
    let original = node.base().id.clone();
    let mut children = take_children(&mut node);
    if let Some(over) = overrides
        .and_then(|all| all.get(&original))
        .and_then(Value::as_object)
    {
        // Only the node itself round-trips; an override `children` replaces
        // the subtree, otherwise the original typed children are kept.
        let mut map = object(&node)?;
        for (key, value) in over {
            map.insert(key.clone(), value.clone());
        }
        node = serde_json::from_value(Value::Object(map)).ok()?;
        if over.contains_key("children") {
            children = take_children(&mut node);
        }
    }
    node.base_mut().id = instance_child_virtual_id(ref_id, &original);
    let children = match children {
        Some(kids) => {
            let mut remapped = Vec::with_capacity(kids.len());
            for kid in kids {
                remapped.push(remap(kid, ref_id, overrides)?);
            }
            Some(remapped)
        }
        None => None,
    };
    put_children(&mut node, children);
    Some(node)
}
