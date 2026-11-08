use std::collections::{BTreeMap, BTreeSet};

use jian_ops_schema::node::PenNode;
use jian_ops_schema::PenDocument;
use op_editor_core::{EditorState, PenNodeExt};
use serde_json::json;

use crate::{McpTool, ToolErrorCode, ToolOutcome};

pub struct ExportCode {
    document: PenDocument,
    roots: Vec<PenNode>,
    ids: BTreeSet<String>,
}

pub fn export_code_snapshot(state: &EditorState) -> ExportCode {
    fn collect(nodes: &[PenNode], ids: &mut BTreeSet<String>) {
        for node in nodes {
            ids.insert(node.id_str().to_owned());
            if let Some(children) = node.children() {
                collect(children, ids);
            }
        }
    }
    let mut resolved = state.clone();
    resolved.doc = op_editor_core::design_bindings::resolve_document_bindings(
        &state.doc,
        &state.ui.variables.active_theme,
    );
    let roots = resolved.active_children().to_vec();
    let mut ids = BTreeSet::new();
    collect(&roots, &mut ids);
    ExportCode {
        document: resolved.doc,
        roots,
        ids,
    }
}

impl McpTool for ExportCode {
    fn name(&self) -> &str {
        "export_code"
    }

    fn call(&self, args: &BTreeMap<String, String>) -> ToolOutcome {
        let error = |message: String| ToolOutcome::Err(ToolErrorCode::InvalidArgument, message);
        if let Some(key) = args
            .keys()
            .find(|key| !matches!(key.as_str(), "format" | "nodeIds"))
        {
            return error(format!("unsupported export argument {key}"));
        }
        let Some(format) = args.get("format") else {
            return error("format is required".into());
        };
        if !matches!(format.as_str(), "html-css" | "tailwind-jsx" | "design-jsx") {
            return error("format must be html-css, tailwind-jsx or design-jsx".into());
        }
        let ids = if let Some(raw_ids) = args.get("nodeIds") {
            match serde_json::from_str::<Vec<String>>(raw_ids) {
                Ok(ids) if !ids.is_empty() && ids.iter().all(|id| !id.trim().is_empty()) => {
                    if ids.iter().collect::<BTreeSet<_>>().len() != ids.len() {
                        return error("nodeIds must contain unique targets".into());
                    }
                    ids
                }
                _ => return error("nodeIds must be a nonempty array of nonempty strings".into()),
            }
        } else {
            self.roots
                .iter()
                .map(|node| node.id_str().to_owned())
                .collect::<Vec<_>>()
        };
        for id in &ids {
            if !self.ids.contains(id) {
                return error(format!("node {id} not found on the active page"));
            }
        }
        let code = op_codegen::generate_for_format(&self.document, &self.roots, &ids, format);
        ToolOutcome::OkJson(json!({"format":format,"nodeIds":ids,"code":code}).to_string())
    }
}
