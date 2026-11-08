//! SVG path-geometry validation shared by `set_vector_path` and `batch_design`,
//! so no MCP write can persist path data the renderer cannot parse.

use jian_ops_schema::node::PenNode;
use op_editor_core::EditorCommand;
use serde_json::Value;

/// Validates SVG path data: parseable and starting with a move command.
pub(crate) fn validate_path_data(d: &str) -> Result<(), String> {
    let segments: Vec<_> = svgtypes::PathParser::from(d)
        .collect::<Result<_, _>>()
        .map_err(|err| format!("invalid SVG path: {err}"))?;
    match segments.first() {
        Some(svgtypes::PathSegment::MoveTo { .. }) => Ok(()),
        Some(_) => Err("d must start with a move command".into()),
        None => Err("d must contain a path".into()),
    }
}

pub(crate) fn validate_fill_rule(rule: &str) -> Result<(), String> {
    if matches!(rule, "nonzero" | "evenodd") {
        Ok(())
    } else {
        Err("fillRule must be nonzero or evenodd".into())
    }
}

fn validate_value(value: &Value) -> Result<(), String> {
    match value {
        Value::Object(map) => {
            if map.get("type").and_then(Value::as_str) == Some("path") {
                if let Some(d) = map.get("d").and_then(Value::as_str) {
                    validate_path_data(d)
                        .map_err(|err| format!("path {}: {err}", node_label(map)))?;
                }
            }
            map.get("children").map_or(Ok(()), validate_value)
        }
        Value::Array(items) => items.iter().try_for_each(validate_value),
        _ => Ok(()),
    }
}

fn node_label(map: &serde_json::Map<String, Value>) -> String {
    map.get("name")
        .or_else(|| map.get("id"))
        .and_then(Value::as_str)
        .unwrap_or("node")
        .to_owned()
}

fn validate_nodes(nodes: &[PenNode]) -> Result<(), String> {
    let value = serde_json::to_value(nodes).map_err(|err| err.to_string())?;
    validate_value(&value)
}

fn validate_patch(patch_json: &str) -> Result<(), String> {
    let Ok(Value::Object(patch)) = serde_json::from_str::<Value>(patch_json) else {
        return Ok(());
    };
    if let Some(d) = patch.get("d").and_then(Value::as_str) {
        validate_path_data(d)?;
    }
    if let Some(rule) = patch.get("fillRule").and_then(Value::as_str) {
        validate_fill_rule(rule)?;
    }
    Ok(())
}

/// Rejects a command whose inserted/replaced/patched paths carry invalid geometry.
pub(crate) fn validate_command_paths(command: &EditorCommand) -> Result<(), String> {
    match command {
        EditorCommand::InsertSubtree { nodes, .. }
        | EditorCommand::InsertAuthoredSubtree { nodes, .. }
        | EditorCommand::InsertAuthoredSubtreePreservingRoots { nodes, .. } => {
            validate_nodes(nodes)
        }
        EditorCommand::ReplaceSubtree { node, .. } => {
            validate_nodes(std::slice::from_ref(node.as_ref()))
        }
        EditorCommand::PatchNodeData { patch_json, .. } => validate_patch(patch_json),
        EditorCommand::Batch { commands } => commands.iter().try_for_each(validate_command_paths),
        _ => Ok(()),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn path_data_must_parse_and_start_with_a_move() {
        assert!(validate_path_data("M0 0 L10 10 Z").is_ok());
        assert!(validate_path_data("m1 1 c 1 1 2 2 3 3").is_ok());
        assert!(validate_path_data("not a path").is_err());
        assert!(validate_path_data("L10 10").is_err());
        assert!(validate_path_data("").is_err());
    }

    #[test]
    fn nested_paths_and_patches_are_checked() {
        let bad = serde_json::json!([{"type":"frame","children":[
            {"type":"path","name":"Icon","d":"oops"}]}]);
        assert!(validate_value(&bad).unwrap_err().contains("Icon"));
        assert!(validate_patch(r#"{"d":"M0 0 L1 1","fillRule":"evenodd"}"#).is_ok());
        assert!(validate_patch(r#"{"fillRule":"sideways"}"#).is_err());
        assert!(validate_patch(r#"{"d":"Z"}"#).is_err());
        assert!(validate_patch(r#"{"width":10}"#).is_ok());
    }
}
