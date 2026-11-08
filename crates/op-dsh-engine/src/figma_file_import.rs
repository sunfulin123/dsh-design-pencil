//! `import_figma` for `.fig` bytes: replaces an empty document (keeping
//! component linkage) or inserts the first page beside existing content,
//! carrying the file's variables, collections and modes along.

use base64::Engine;
use jian_ops_schema::node::PenNode;
use op_editor_core::NodeId;
use op_mcp::import_common::{count_subtree_nodes, parse_import_placement};
use serde_json::json;
use std::collections::BTreeMap;

use crate::{error_reply, figma_rest_import, ok_reply, DesignEngine};

impl DesignEngine {
    pub(crate) fn call_import_figma(&mut self, args: &BTreeMap<String, String>) -> String {
        let Some(b64) = args
            .get("bytesBase64")
            .or_else(|| args.get("bytes_base64"))
            .or_else(|| args.get("bytesB64"))
            .filter(|v| !v.trim().is_empty())
        else {
            if args.get("url").is_some_and(|url| !url.trim().is_empty()) {
                return error_reply(
                    "import_figma url links are fetched by the Node host (network access); the standalone engine accepts figPath (via the host) or bytesBase64",
                );
            }
            return error_reply("figPath, url, or bytesBase64 is required");
        };
        let bytes = match base64::engine::general_purpose::STANDARD.decode(b64.trim()) {
            Ok(bytes) => bytes,
            Err(error) => return error_reply(&format!("invalid bytesBase64: {error}")),
        };
        let file_name = args
            .get("fileName")
            .or_else(|| args.get("file_name"))
            .map(String::as_str)
            .unwrap_or("Figma Import");
        let placement = match parse_import_placement(args) {
            Ok(placement) => placement,
            Err((_, message)) => return error_reply(&message),
        };
        let doc_is_empty = self.state.doc.children.is_empty()
            && self
                .state
                .doc
                .pages
                .as_ref()
                .is_none_or(|pages| pages.iter().all(|p| p.children.is_empty()));
        let replaces_document =
            doc_is_empty && placement.parent_id == NodeId::NONE && placement.page_id.is_none();
        let layout_mode = if replaces_document {
            op_figma::FigLayoutMode::Preserve
        } else {
            op_figma::FigLayoutMode::OpenPencil
        };
        // Linkage adds a Components page that `ref`s point at; an insert keeps
        // only the first page, so it must import exact expansions instead.
        let parsed = if replaces_document {
            op_figma::parse_fig_binary_linked(&bytes, file_name, layout_mode)
        } else {
            op_figma::parse_fig_binary(&bytes, file_name, layout_mode)
        };
        let mut import = match parsed {
            Ok(import) => import,
            Err(error) => return error_reply(&format!("failed to parse Figma file: {error}")),
        };
        let page_count = import.document.pages.as_ref().map_or(1, Vec::len);
        let node_count: usize = import
            .document
            .pages
            .as_ref()
            .map(|pages| pages.iter().map(|p| count_subtree_nodes(&p.children)).sum())
            .unwrap_or_else(|| count_subtree_nodes(&import.document.children));
        if replaces_document {
            figma_rest_import::normalize_document_roots(&mut import.document);
            let previous = self.state.snapshot_for_history();
            self.state.replace_document(import.document);
            op_pen_loader::apply_editor_meta(
                &mut self.state,
                op_pen_loader::EditorMeta {
                    active_page_index: 0,
                    preserve_authored_geometry: true,
                    scenario: None,
                    pinned_style_guide: None,
                    viewport: None,
                },
            );
            self.state.history_push_past(previous);
            let value = json!({
                "wrote": "true",
                "pageCount": page_count,
                "nodeCount": node_count,
                "warnings": import.warnings,
            });
            return ok_reply(value);
        }
        let variables =
            op_figma::fig_document_variables::FigDocumentVariables::take_from(&mut import.document);
        let mut nodes: Vec<PenNode> = import
            .document
            .pages
            .and_then(|pages| pages.into_iter().next().map(|page| page.children))
            .unwrap_or(import.document.children);
        if nodes.is_empty() {
            return error_reply("Figma file contains no importable nodes");
        }
        figma_rest_import::translate_roots(&mut nodes, self.drop_origin(args, &placement));
        let value = json!({
            "wrote": "true",
            "pageCount": page_count,
            "nodeCount": count_subtree_nodes(&nodes),
            "warnings": import.warnings,
        });
        match self.insert_preserving_roots(
            nodes,
            &placement.parent_id,
            placement.page_id.as_deref(),
            false,
            layout_mode == op_figma::FigLayoutMode::OpenPencil,
            variables,
        ) {
            Some(_) => ok_reply(value),
            None => error_reply(
                "Figma import could not be inserted: the parent is missing or not a container",
            ),
        }
    }
}
