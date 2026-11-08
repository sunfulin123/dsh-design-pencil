use std::collections::{BTreeMap, BTreeSet};

use op_editor_core::{DesignCommand, EditorCommand, EditorState, NodeId};
use serde_json::{json, Value};

use crate::design_tools::parse_id_list;
use crate::{McpTool, ToolErrorCode, ToolOutcome};
use op_editor_core::appearance::{appearance_patch, APPEARANCE_FIELDS};

pub struct CopyProperties {
    nodes: BTreeMap<String, Value>,
}

pub struct PasteProperties {
    nodes: BTreeMap<String, Value>,
    clipboard: Option<BTreeMap<String, Value>>,
    editable: BTreeSet<String>,
}

pub struct SetVectorPath {
    nodes: BTreeMap<String, Value>,
    editable: BTreeSet<String>,
}

fn node_snapshot(state: &EditorState) -> BTreeMap<String, Value> {
    fn walk(nodes: &[jian_ops_schema::node::PenNode], out: &mut BTreeMap<String, Value>) {
        use op_editor_core::pen_node_ext::PenNodeExt;
        for node in nodes {
            out.insert(node.id_str().into(), json!(node));
            if let Some(children) = node.children() {
                walk(children, out);
            }
        }
    }
    let mut out = BTreeMap::new();
    walk(state.active_children(), &mut out);
    out
}

pub fn copy_properties_snapshot(state: &EditorState) -> CopyProperties {
    CopyProperties {
        nodes: node_snapshot(state),
    }
}

pub fn paste_properties_snapshot(state: &EditorState) -> PasteProperties {
    let nodes = node_snapshot(state);
    let editable = nodes
        .keys()
        .filter(|id| state.can_edit_appearance(&NodeId::new(id.as_str())))
        .cloned()
        .collect();
    PasteProperties {
        nodes,
        clipboard: state.ui.appearance_clipboard.clone(),
        editable,
    }
}

pub fn set_vector_path_snapshot(state: &EditorState) -> SetVectorPath {
    let nodes = node_snapshot(state);
    let editable = nodes
        .keys()
        .filter(|id| state.can_edit_appearance(&NodeId::new(id.as_str())))
        .cloned()
        .collect();
    SetVectorPath { nodes, editable }
}

fn error(message: impl Into<String>) -> ToolOutcome {
    ToolOutcome::Err(ToolErrorCode::InvalidArgument, message.into())
}

impl McpTool for CopyProperties {
    fn name(&self) -> &str {
        "copy_properties"
    }

    fn call(&self, args: &BTreeMap<String, String>) -> ToolOutcome {
        let Some(id) = args.get("sourceId").or_else(|| args.get("source_id")) else {
            return error("sourceId is required");
        };
        let Some(node) = self.nodes.get(id).and_then(Value::as_object) else {
            return error(format!("source node {id} is not on the active page"));
        };
        let fields: Vec<String> = match args.get("props") {
            Some(raw) => match serde_json::from_str(raw) {
                Ok(fields) => fields,
                Err(err) => {
                    return error(format!("props must be an array of property names: {err}"))
                }
            },
            None => APPEARANCE_FIELDS.iter().map(|s| (*s).into()).collect(),
        };
        if fields
            .iter()
            .any(|key| !APPEARANCE_FIELDS.contains(&key.as_str()))
        {
            return error("props contains a non-appearance property");
        }
        let properties: BTreeMap<String, Value> = fields
            .into_iter()
            .map(|key| {
                let value = node.get(&key).cloned().unwrap_or(Value::Null);
                (key, value)
            })
            .collect();
        ToolOutcome::OkJsonWithCommand(
            json!({"sourceId":id,"properties":properties}).to_string(),
            EditorCommand::Design(DesignCommand::CopyProperties { properties }),
        )
    }
}

impl McpTool for PasteProperties {
    fn name(&self) -> &str {
        "paste_properties"
    }

    fn call(&self, args: &BTreeMap<String, String>) -> ToolOutcome {
        let ids = match parse_id_list(args) {
            Ok(ids) if !ids.is_empty() => ids,
            Ok(_) => return error("nodeIds must contain at least one target"),
            Err(err) => return err,
        };
        let properties = match args.get("properties") {
            Some(raw) => match serde_json::from_str::<BTreeMap<String, Value>>(raw) {
                Ok(props) => props,
                Err(err) => return error(format!("properties must be an object: {err}")),
            },
            None => match &self.clipboard {
                Some(props) => props.clone(),
                None => {
                    return error("copy_properties must be called first, or provide properties")
                }
            },
        };
        if properties
            .keys()
            .any(|key| !APPEARANCE_FIELDS.contains(&key.as_str()))
        {
            return error("properties contains a non-appearance property");
        }
        let mut commands = Vec::new();
        for id in &ids {
            if !self.editable.contains(id.as_str()) {
                return error(format!(
                    "target node {id} is missing, locked or not editable"
                ));
            }
            let Some(node) = self.nodes.get(id.as_str()) else {
                return error(format!("target node {id} is not on the active page"));
            };
            let mut replacement = node.clone();
            let Some(object) = replacement.as_object_mut() else {
                return error("target must be an object");
            };
            let patch = appearance_patch(node, &properties);
            object.extend(patch.clone());
            if let Err(err) = serde_json::from_value::<jian_ops_schema::node::PenNode>(replacement)
            {
                return error(format!("invalid appearance for {id}: {err}"));
            }
            commands.push(EditorCommand::PatchNodeData {
                node_id: id.clone(),
                patch_json: Value::Object(patch).to_string(),
                page_id: None,
            });
        }
        ToolOutcome::OkJsonWithCommand(
            json!({"nodeIds":ids.iter().map(NodeId::as_str).collect::<Vec<_>>(),"properties":properties}).to_string(),
            EditorCommand::Batch { commands },
        )
    }
}

impl McpTool for SetVectorPath {
    fn name(&self) -> &str {
        "set_vector_path"
    }

    fn call(&self, args: &BTreeMap<String, String>) -> ToolOutcome {
        let Some(id) = args.get("nodeId").or_else(|| args.get("node_id")) else {
            return error("nodeId is required");
        };
        if !self
            .nodes
            .get(id)
            .is_some_and(|node| node["type"] == "path")
        {
            return error("nodeId must refer to a path on the active page");
        }
        if !self.editable.contains(id) {
            return error(format!("path node {id} is locked or not editable"));
        }
        let Some(d) = args.get("d") else {
            return error("d is required");
        };
        if let Err(message) = crate::path_geometry::validate_path_data(d) {
            return error(message);
        }
        let rule = args
            .get("fillRule")
            .map(String::as_str)
            .unwrap_or("nonzero");
        if let Err(message) = crate::path_geometry::validate_fill_rule(rule) {
            return error(message);
        }
        ToolOutcome::OkJsonWithCommand(
            json!({"nodeId":id,"d":d,"fillRule":rule}).to_string(),
            EditorCommand::PatchNodeData {
                node_id: NodeId::new(id),
                patch_json: json!({"d":d,"fillRule":rule,"anchors":null,"closed":null}).to_string(),
                page_id: None,
            },
        )
    }
}
