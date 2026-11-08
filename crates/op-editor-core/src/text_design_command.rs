//! Transport-free preparation of validated rich-text tree replacements.
use crate::command_node::remap_subtree_ids_mapping_with_allocator;
use crate::id_allocator::SequentialIdAllocator;
use crate::{EditorCommand, EditorState, NodeId, PenNodeExt};
use jian_ops_schema::component::ComponentPropertyKind;
use jian_ops_schema::node::{PenNode, TextNode};
use serde_json::Value;
use std::collections::HashSet;

pub struct TextDesignSnapshot {
    roots: Vec<PenNode>,
    taken: HashSet<NodeId>,
    next_id: Option<u64>,
    text_property_targets: HashSet<String>,
}

impl TextDesignSnapshot {
    pub fn new(state: &EditorState) -> Self {
        let mut text_property_targets = HashSet::new();
        collect_text_property_targets(&state.doc.children, &mut text_property_targets);
        for page in state.doc.pages.iter().flatten() {
            collect_text_property_targets(&page.children, &mut text_property_targets);
        }
        Self {
            roots: state.active_children().to_vec(),
            taken: state.collect_node_ids(),
            next_id: state.next_node_id_seed(),
            text_property_targets,
        }
    }

    pub fn node(&self, id: &str) -> Result<&PenNode, String> {
        crate::walkers::find_node(&self.roots, &NodeId::new(id))
            .ok_or_else(|| format!("node {id:?} does not exist on the active page"))
    }

    pub fn text(&self, id: &str) -> Result<TextNode, String> {
        crate::command_node_attrs::resolve_text_node(self.node(id)?)
            .cloned()
            .ok_or_else(|| {
                "target a Text node or a single-text wrapper; for Markdown, use a paragraph text id"
                    .into()
            })
    }

    /// Rebuild generated paragraph geometry in place, rather than nesting wrappers.
    pub fn paragraph_node(
        &self,
        id: &str,
        style: &crate::text_design::ParagraphStyle,
    ) -> Result<PenNode, String> {
        let node = self.node(id)?;
        let mut text = self.text(id)?;
        if paragraph_body_index(node).is_some() {
            let role = text.base.role.clone();
            text.base = node.base().clone();
            text.base.role = role;
            if let PenNode::Frame(frame) = node {
                text.width = frame.container.width.clone();
            }
        }
        crate::text_design::paragraph_to_node(&text, style)
    }

    pub fn markdown_template(&self, id: &str) -> Result<TextNode, String> {
        let node = self.node(id)?;
        if node.base().role.as_deref() != Some("markdown") {
            if let Some(text) = crate::command_node_attrs::resolve_text_node(node) {
                return Ok(text.clone());
            }
        }
        if !text_only(node) {
            return Err("Markdown replaces only text or text-only frames".into());
        }
        let mut text = first_paragraph(node)
            .or_else(|| first_text(node))
            .cloned()
            .ok_or("text frame has no template paragraph")?;
        if let Some(level) = text
            .base
            .role
            .as_deref()
            .and_then(|r| r.strip_prefix("heading-"))
            .and_then(|level| level.parse::<usize>().ok())
            .filter(|n| (1..=6).contains(n))
        {
            text.font_size = text
                .font_size
                .map(|s| s / [2.0, 1.65, 1.4, 1.2, 1.1, 1.0][level - 1]);
            text.font_weight = None;
        }
        text.base = node.base().clone();
        match node {
            PenNode::Frame(frame) => text.width = frame.container.width.clone(),
            PenNode::Group(group) => text.width = group.container.width.clone(),
            _ => {}
        }
        Ok(text)
    }

    pub fn patch_tree(&self, mut node: PenNode) -> Result<(EditorCommand, Vec<String>), String> {
        let id = NodeId::new(node.id_str());
        if let Some(original) = crate::walkers::find_node(&self.roots, &id) {
            let mut replaced_ids = Vec::new();
            collect_ids(original, &mut replaced_ids);
            // Descendants are reminted; typed component text targets must retain identity.
            if let Some(target) = replaced_ids.iter().find(|target| {
                self.text_property_targets.contains(target.as_str())
                    && (target.as_str() != node.id_str() || !matches!(&node, PenNode::Text(_)))
            }) {
                return Err(format!(
                    "cannot convert or remove component text property target {target:?}; \
                     use a single inline Markdown paragraph or a separate text node for blocks"
                ));
            }
        }
        if let Some(children) = node.children_mut() {
            if !children.is_empty() {
                let next = self.next_id.ok_or("node id space exhausted")?;
                let mut allocator = SequentialIdAllocator::new(next);
                let mut taken = self.taken.clone();
                remap_subtree_ids_mapping_with_allocator(children, &mut allocator, &mut taken)
                    .map_err(|error| error.to_string())?;
            }
        }
        let mut value = serde_json::to_value(&node).map_err(|error| error.to_string())?;
        if let PenNode::Frame(frame) = &node {
            // Shallow patches must clear the former text ink rather than paint a background.
            if frame.container.fill.is_none() {
                value["fill"] = Value::Null;
            }
            if frame.container.effects.is_none() {
                value["effects"] = Value::Null;
            }
        }
        let mut ids = Vec::new();
        collect_ids(&node, &mut ids);
        Ok((
            EditorCommand::Batch {
                commands: vec![EditorCommand::PatchNodeData {
                    node_id: id,
                    patch_json: value.to_string(),
                    page_id: None,
                }],
            },
            ids,
        ))
    }
}

/// Only canonical paragraph wrappers expose a body alongside their list marker.
pub fn paragraph_body_index(node: &PenNode) -> Option<usize> {
    if node.base().role.as_deref() != Some("paragraph-layout") {
        return None;
    }
    let children = node.children()?;
    let index = match children.as_slice() {
        [PenNode::Text(_)] => 0,
        [PenNode::Text(marker), PenNode::Text(_)]
            if marker.base.role.as_deref() == Some("list-marker") =>
        {
            1
        }
        _ => return None,
    };
    Some(index)
}

fn first_text(node: &PenNode) -> Option<&TextNode> {
    match node {
        PenNode::Text(text) => Some(text),
        _ => node.children().and_then(|c| c.iter().find_map(first_text)),
    }
}
fn first_paragraph(node: &PenNode) -> Option<&TextNode> {
    match node {
        PenNode::Text(text) if text.base.role.as_deref() == Some("paragraph") => Some(text),
        _ => node
            .children()
            .and_then(|c| c.iter().find_map(first_paragraph)),
    }
}
fn text_only(node: &PenNode) -> bool {
    matches!(node, PenNode::Text(_))
        || matches!(node, PenNode::Frame(_) | PenNode::Group(_))
            && node
                .children()
                .is_some_and(|c| !c.is_empty() && c.iter().all(text_only))
}
fn collect_ids(node: &PenNode, out: &mut Vec<String>) {
    out.push(node.id_str().into());
    if let Some(children) = node.children() {
        for child in children {
            collect_ids(child, out);
        }
    }
}
fn collect_text_property_targets(nodes: &[PenNode], out: &mut HashSet<String>) {
    for node in nodes {
        if let Some(design) = &node.base().component_design {
            for property in design.properties.values() {
                if property.kind == ComponentPropertyKind::Text {
                    out.insert(property.target_id.clone());
                }
            }
        }
        if let Some(children) = node.children() {
            collect_text_property_targets(children, out);
        }
    }
}
