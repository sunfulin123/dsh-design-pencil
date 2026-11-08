use std::collections::BTreeMap;

use serde_json::{json, Map, Value};

use crate::{EditorCommand, EditorState, NodeId, PenNodeExt};

pub const APPEARANCE_FIELDS: &[&str] = &[
    "fill",
    "stroke",
    "effects",
    "opacity",
    "blendMode",
    "cornerRadius",
    "fontFamily",
    "fontSize",
    "fontWeight",
    "fontStyle",
    "underline",
    "strikethrough",
    "letterSpacing",
    "lineHeight",
    "textAlign",
    "textAlignVertical",
];

pub fn appearance_patch(node: &Value, properties: &BTreeMap<String, Value>) -> Map<String, Value> {
    properties
        .iter()
        .filter(|(key, _)| {
            let typography = key.starts_with("font")
                || key.starts_with("text")
                || matches!(
                    key.as_str(),
                    "underline" | "strikethrough" | "lineHeight" | "letterSpacing"
                );
            APPEARANCE_FIELDS.contains(&key.as_str()) && (!typography || node["type"] == "text")
        })
        .map(|(key, value)| (key.clone(), value.clone()))
        .collect()
}

impl EditorState {
    pub fn can_edit_appearance(&self, id: &NodeId) -> bool {
        let mut current = id.clone();
        loop {
            if !self.is_editable(&current) {
                return false;
            }
            match crate::walkers::find_parent_and_index(self.active_children(), &current) {
                Some((Some(parent), _)) => current = parent,
                Some((None, _)) => return true,
                None => return false,
            }
        }
    }

    pub fn copy_node_appearance(&mut self, id: &NodeId) -> bool {
        let Some(node) = crate::walkers::find_node(self.active_children(), id) else {
            self.ui.design_reject = Some(format!("node {id} not found"));
            return false;
        };
        let node = json!(node);
        let properties = APPEARANCE_FIELDS
            .iter()
            .map(|key| {
                (
                    (*key).into(),
                    node.get(*key).cloned().unwrap_or(Value::Null),
                )
            })
            .collect();
        self.ui.appearance_clipboard = Some(properties);
        self.ui.design_reject = None;
        true
    }

    pub fn paste_node_appearance(&mut self, ids: &[NodeId]) -> bool {
        self.ui.design_reject = None;
        let Some(properties) = &self.ui.appearance_clipboard else {
            self.ui.design_reject = Some("copy appearance properties first".into());
            return false;
        };
        if ids.is_empty() {
            self.ui.design_reject = Some("select at least one target".into());
            return false;
        }
        let mut commands = Vec::new();
        for id in ids {
            let Some(node) = crate::walkers::find_node(self.active_children(), id)
                .filter(|_| self.can_edit_appearance(id))
            else {
                self.ui.design_reject = Some(format!("node {id} is missing, hidden or locked"));
                return false;
            };
            let patch = appearance_patch(&json!(node), properties);
            let mut validated = json!(node);
            if let Some(object) = validated.as_object_mut() {
                object.extend(patch.clone());
            }
            if let Err(err) = serde_json::from_value::<jian_ops_schema::node::PenNode>(validated) {
                self.ui.design_reject =
                    Some(format!("invalid appearance on {}: {err}", node.id_str()));
                return false;
            }
            commands.push(EditorCommand::PatchNodeData {
                node_id: id.clone(),
                patch_json: Value::Object(patch).to_string(),
                page_id: None,
            });
        }
        self.apply(EditorCommand::Batch { commands })
    }
}
