//! MCP tools for design operations ported from open-pencil (see
//! `op_editor_core::DesignCommand`). Every tool takes explicit node ids so
//! an agent can act without first changing the selection.

use std::collections::BTreeMap;

use op_editor_core::{ArrangeMode, DesignCommand, NodeId};

use super::{EditorCommand, McpTool, ToolErrorCode, ToolOutcome};

/// Parse `nodeIds` / `node_ids` as a JSON string array or a
/// comma-separated list. Absent or empty → empty vec.
#[allow(clippy::result_large_err)]
pub(crate) fn parse_id_list(args: &BTreeMap<String, String>) -> Result<Vec<NodeId>, ToolOutcome> {
    let Some(raw) = args.get("nodeIds").or_else(|| args.get("node_ids")) else {
        return Ok(Vec::new());
    };
    let trimmed = raw.trim();
    let ids: Vec<String> = if trimmed.starts_with('[') {
        serde_json::from_str(trimmed).map_err(|e| {
            ToolOutcome::Err(
                ToolErrorCode::InvalidArgument,
                format!("nodeIds must be a JSON string array: {e}"),
            )
        })?
    } else {
        trimmed.split(',').map(|s| s.trim().to_string()).collect()
    };
    Ok(ids
        .into_iter()
        .filter(|id| !id.is_empty())
        .map(NodeId::new)
        .collect())
}

/// `arrange_nodes` — Figma's Tidy Up / Pack Horizontal / Pack Vertical on
/// 2+ free-moving siblings (explicit `nodeIds`, else the selection).
pub struct ArrangeNodes;

impl McpTool for ArrangeNodes {
    fn name(&self) -> &str {
        "arrange_nodes"
    }
    fn call(&self, args: &BTreeMap<String, String>) -> ToolOutcome {
        let Some(raw_mode) = args.get("mode") else {
            return ToolOutcome::Err(
                ToolErrorCode::MissingArgument,
                "mode is required (one of \"tidy\", \"pack_h\", \"pack_v\")".into(),
            );
        };
        let Some(mode) = ArrangeMode::parse(raw_mode) else {
            return ToolOutcome::Err(
                ToolErrorCode::InvalidArgument,
                format!("mode must be one of \"tidy\", \"pack_h\", \"pack_v\", got {raw_mode:?}"),
            );
        };
        let node_ids = match parse_id_list(args) {
            Ok(ids) => ids,
            Err(e) => return e,
        };
        if node_ids.len() == 1 {
            return ToolOutcome::Err(
                ToolErrorCode::InvalidArgument,
                "arrange_nodes needs at least two sibling nodes".into(),
            );
        }
        let mut out = BTreeMap::new();
        out.insert("wrote".into(), "true".into());
        out.insert("mode".into(), raw_mode.clone());
        ToolOutcome::OkWithCommand(
            out,
            EditorCommand::Design(DesignCommand::ArrangeNodes { node_ids, mode }),
        )
    }
}

pub fn arrange_nodes_snapshot() -> ArrangeNodes {
    ArrangeNodes
}

#[cfg(test)]
#[path = "design_tools_tests.rs"]
mod tests;
