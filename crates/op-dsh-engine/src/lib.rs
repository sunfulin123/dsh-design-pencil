//! Headless design operations over the canonical editor state for DSH hosts.

use std::collections::BTreeMap;

use base64::Engine;
use jian_ops_schema::node::PenNode;
use op_editor_core::{EditorCommand, EditorState, NodeId};
use op_mcp::import_common::{
    count_subtree_nodes, import_result_to_outcome, parse_import_placement, parse_viewport_height,
};
use op_mcp::ToolOutcome;
use serde_json::{json, Value};
use wasm_bindgen::prelude::*;

mod tool_catalog;

#[wasm_bindgen]
pub struct DesignEngine {
    state: EditorState,
}

impl Default for DesignEngine {
    fn default() -> Self {
        Self {
            state: EditorState::new(),
        }
    }
}

#[wasm_bindgen]
impl DesignEngine {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self::default()
    }

    pub fn load_document(&mut self, source: &str) -> Result<(), JsValue> {
        let value: Value = serde_json::from_str(source).map_err(js_error)?;
        if !value.get("children").is_some_and(Value::is_array) {
            return Err(JsValue::from_str("Document must contain a children array"));
        }
        let loaded = op_pen_loader::load_canonical(source).map_err(js_error)?;
        let meta = op_pen_loader::extract_editor_meta(source);
        self.state.replace_document(loaded.value);
        op_pen_loader::apply_editor_meta_or_legacy_fallback(&mut self.state, meta);
        Ok(())
    }

    pub fn document_json(&self) -> Result<String, JsValue> {
        let source = serde_json::to_string(&self.state.doc).map_err(js_error)?;
        let mut bytes = Vec::new();
        op_pen_loader::write_source_with_editor_meta(
            &mut bytes,
            &source,
            op_pen_loader::EditorMeta::from_state(&self.state),
        )
        .map_err(js_error)?;
        String::from_utf8(bytes).map_err(js_error)
    }

    pub fn update_editor_meta(&mut self, source: &str) -> Result<(), JsValue> {
        let meta = serde_json::from_str(source).map_err(js_error)?;
        op_pen_loader::apply_editor_meta(&mut self.state, meta);
        Ok(())
    }

    pub fn call_tool(&mut self, name: &str, arguments: &str) -> Result<String, JsValue> {
        let name = name
            .strip_prefix("synapse_")
            .or_else(|| name.strip_prefix("openpencil_"))
            .unwrap_or(name);
        let values: BTreeMap<String, Value> = serde_json::from_str(arguments).map_err(js_error)?;
        let args: BTreeMap<String, String> = values
            .into_iter()
            .map(|(key, value)| {
                let text = match value {
                    Value::String(text) => text,
                    value => value.to_string(),
                };
                (key, text)
            })
            .collect();
        if name == "import_figma" {
            return Ok(self.call_import_figma(&args));
        }
        if name == "finalize_design" {
            return Ok(self.call_finalize_design());
        }
        if name == "get_design_quality" {
            return Ok(self.call_get_design_quality());
        }
        if name == "enrich_images" {
            return Ok(ok_reply(json!({
                "targets": 0,
                "resolved": 0,
                "failed": 0,
                "unresolved": 0,
            })));
        }
        if name == "import_html" && args.contains_key("resourcesJson") {
            return Ok(self.call_import_html_with_resources(&args));
        }
        if name == "import_html_url" {
            if args.contains_key("html") {
                return Ok(self.call_import_html_with_resources(&args));
            }
            return Ok(error_reply("url is required"));
        }
        let Some(tool) = tool_catalog::build_tool(name, &self.state) else {
            return Ok(error_reply(&format!("Unknown tool: {name}")));
        };
        let (value, command) = match tool.call(&args) {
            ToolOutcome::Ok(fields) => (json!(fields), None),
            ToolOutcome::OkWithCommand(fields, command) => (json!(fields), Some(command)),
            ToolOutcome::OkJson(text) => (serde_json::from_str(&text).map_err(js_error)?, None),
            ToolOutcome::OkJsonWithCommand(text, command) => (
                serde_json::from_str(&text).map_err(js_error)?,
                Some(command),
            ),
            ToolOutcome::Err(_, message) => return Ok(error_reply(&message)),
            ToolOutcome::OkImageContent { .. } => {
                return Ok(error_reply("Image content requires the rendering host"));
            }
        };
        if let Some(command) = command {
            return Ok(self.commit_command(value, command));
        }
        Ok(ok_reply(value))
    }

    pub fn tools_json(&self) -> String {
        json!(tool_catalog::schemas()).to_string()
    }

    pub fn convert_html_document(
        source_bytes: &[u8],
        document_name: Option<String>,
        base_url: Option<String>,
        viewport_height: Option<f64>,
        resources_json: Option<String>,
    ) -> Result<String, JsValue> {
        let options = op_html::HtmlImportOptions {
            document_name,
            base_url: base_url
                .or_else(|| Some(format!("{}document.html", op_html::VIRTUAL_PROJECT_ORIGIN))),
            viewport_height,
            ..op_html::HtmlImportOptions::default()
        };
        let imported = if source_bytes.len() >= 4 && source_bytes[0..4] == [0x50, 0x4b, 0x03, 0x04]
        {
            op_html::import_html_zip_document(source_bytes, &options).map_err(js_error)?
        } else {
            let source = op_html::html_encoding::decode_html_bytes(source_bytes);
            let resources = decode_resources_map(resources_json.as_deref()).map_err(js_error)?;
            let fetcher = |url: &str| lookup_resource(&resources, url);
            op_html::import_html_document(source.as_ref(), &options, Some(&fetcher), None)
        };
        if imported.document.children.is_empty() {
            let detail = imported
                .warnings
                .first()
                .map(String::as_str)
                .unwrap_or("input produced no nodes");
            return Err(JsValue::from_str(&format!(
                "no importable content: {detail}"
            )));
        }
        let node_count = count_subtree_nodes(&imported.document.children);
        let document = serde_json::to_value(&imported.document).map_err(js_error)?;
        Ok(json!({
            "ok": true,
            "document": document,
            "nodeCount": node_count,
            "warnings": imported.warnings,
        })
        .to_string())
    }

    pub fn convert_figma_document(bytes: &[u8], file_name: &str) -> Result<String, JsValue> {
        let import =
            op_figma::parse_fig_binary(bytes, file_name, op_figma::FigLayoutMode::Preserve)
                .map_err(|error| JsValue::from_str(&format!("import {file_name:?}: {error}")))?;
        let page_count = import.document.pages.as_ref().map_or(1, Vec::len);
        let node_count: usize = import
            .document
            .pages
            .as_ref()
            .map(|pages| pages.iter().map(|p| count_subtree_nodes(&p.children)).sum())
            .unwrap_or_else(|| count_subtree_nodes(&import.document.children));
        let mut document = serde_json::to_value(&import.document).map_err(js_error)?;
        jian_ops_schema::image_table::externalize_images(&mut document);
        if let Some(obj) = document.as_object_mut() {
            obj.insert(
                "editorMeta".to_string(),
                json!({
                    "activePageIndex": 0,
                    "preserveAuthoredGeometry": true,
                }),
            );
        }
        Ok(json!({
            "ok": true,
            "document": document,
            "pageCount": page_count,
            "nodeCount": node_count,
            "warnings": import.warnings,
        })
        .to_string())
    }

    pub fn snapshot_extractor_script() -> String {
        op_html::snapshot::SNAPSHOT_EXTRACTOR_JS.to_string()
    }

    pub fn convert_snapshot_document(snapshot: &str) -> Result<String, JsValue> {
        let imported =
            op_html::import_snapshot_document(snapshot, &op_html::HtmlImportOptions::default());
        if imported.document.children.is_empty() {
            let detail = imported
                .warnings
                .first()
                .map(String::as_str)
                .unwrap_or("input produced no nodes");
            return Err(JsValue::from_str(&format!(
                "no importable content: {detail}"
            )));
        }
        let node_count = count_subtree_nodes(&imported.document.children);
        let mut document = serde_json::to_value(&imported.document).map_err(js_error)?;
        jian_ops_schema::image_table::externalize_images(&mut document);
        if let Some(obj) = document.as_object_mut() {
            obj.insert(
                "editorMeta".to_string(),
                json!({
                    "activePageIndex": 0,
                    "preserveAuthoredGeometry": true,
                }),
            );
        }
        Ok(json!({
            "ok": true,
            "document": document,
            "nodeCount": node_count,
            "warnings": imported.warnings,
        })
        .to_string())
    }
}

impl DesignEngine {
    fn call_import_html_with_resources(&mut self, args: &BTreeMap<String, String>) -> String {
        let Some(html) = args.get("html") else {
            return error_reply("html or htmlPath is required");
        };
        if html.trim().is_empty() {
            return error_reply("html must not be empty");
        }
        let placement = match parse_import_placement(args) {
            Ok(placement) => placement,
            Err((_, message)) => return error_reply(&message),
        };
        let viewport_height = match parse_viewport_height(args) {
            Ok(value) => value,
            Err((_, message)) => return error_reply(&message),
        };
        let resources = match decode_resources_map(args.get("resourcesJson").map(String::as_str)) {
            Ok(map) => map,
            Err(error) => return error_reply(&error),
        };
        let fetcher = |url: &str| lookup_resource(&resources, url);
        let options = op_html::HtmlImportOptions {
            base_url: args
                .get("baseUrl")
                .cloned()
                .or_else(|| Some(format!("{}document.html", op_html::VIRTUAL_PROJECT_ORIGIN))),
            document_name: args.get("documentName").cloned(),
            viewport_height,
            ..op_html::HtmlImportOptions::default()
        };
        let result = op_html::import_html_with_resources(html, &options, Some(&fetcher), None);
        match import_result_to_outcome(result, placement) {
            ToolOutcome::OkWithCommand(mut fields, command) => {
                if let Some(source_url) = args.get("sourceUrl") {
                    fields.insert("sourceUrl".to_string(), source_url.clone());
                }
                self.commit_command(json!(fields), command)
            }
            ToolOutcome::Err(_, message) => error_reply(&message),
            _ => error_reply("Unexpected import_html outcome"),
        }
    }

    fn call_import_figma(&mut self, args: &BTreeMap<String, String>) -> String {
        let Some(b64) = args
            .get("bytesBase64")
            .or_else(|| args.get("bytes_base64"))
            .or_else(|| args.get("bytesB64"))
            .filter(|v| !v.trim().is_empty())
        else {
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
        let layout_mode =
            if doc_is_empty && placement.parent_id == NodeId::NONE && placement.page_id.is_none() {
                op_figma::FigLayoutMode::Preserve
            } else {
                op_figma::FigLayoutMode::OpenPencil
            };
        let import = match op_figma::parse_fig_binary(&bytes, file_name, layout_mode) {
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
        if doc_is_empty && placement.parent_id == NodeId::NONE && placement.page_id.is_none() {
            let previous = self.state.snapshot_for_history();
            self.state.replace_document(import.document);
            op_pen_loader::apply_editor_meta(
                &mut self.state,
                op_pen_loader::EditorMeta {
                    active_page_index: 0,
                    preserve_authored_geometry: true,
                    scenario: None,
                    pinned_style_guide: None,
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
        let mut nodes: Vec<PenNode> = import
            .document
            .pages
            .and_then(|pages| pages.into_iter().next().map(|page| page.children))
            .unwrap_or(import.document.children);
        if nodes.is_empty() {
            return error_reply("Figma file contains no importable nodes");
        }
        if placement.x != 0 || placement.y != 0 {
            if let Some(PenNode::Frame(frame)) = nodes.first_mut() {
                frame.base.x = Some(placement.x as f64);
                frame.base.y = Some(placement.y as f64);
            }
        }
        let value = json!({
            "wrote": "true",
            "pageCount": page_count,
            "nodeCount": count_subtree_nodes(&nodes),
            "warnings": import.warnings,
        });
        self.commit_command(
            value,
            EditorCommand::InsertSubtree {
                nodes,
                parent_id: placement.parent_id,
                page_id: placement.page_id,
            },
        )
    }

    fn call_finalize_design(&mut self) -> String {
        let previous = self.state.snapshot_for_history();
        let mut repairs = 0usize;
        let mut records = Vec::new();
        let mut changed = false;
        let roots_count = self.state.active_children().len();
        for root in self.state.active_children_mut() {
            let before = root.clone();
            let fixes = op_editor_core::command_refine::refine_child_subtree(root);
            if !fixes.is_empty() && *root != before {
                changed = true;
                repairs += fixes.len();
                for fix in fixes {
                    records.push(json!({
                        "pass": "refine_child_subtree",
                        "category": "layout",
                        "nodeId": fix.node_id,
                        "nodeName": fix.node_name,
                        "detail": fix.fix,
                    }));
                }
            }
        }
        if changed {
            self.state.history_push_past(previous);
        }
        let value = json!({
            "roots": roots_count,
            "repairs": repairs,
            "records": records,
            "advisories": [],
            "informational": [],
            "complete": true,
            "summary": if repairs == 0 {
                "No repairs needed".to_string()
            } else {
                format!("Applied {repairs} deterministic layout repair(s)")
            },
        });
        ok_reply(value)
    }

    fn call_get_design_quality(&self) -> String {
        ok_reply(json!({
            "geometryIssues": [],
            "layoutIssues": [],
            "contrastIssues": [],
            "iconIssues": [],
            "structureIssues": [],
            "emptyShells": [],
            "intentQuestions": [],
            "variableIssues": [],
            "imageSlots": [],
            "navIssues": [],
        }))
    }

    fn commit_command(&mut self, value: Value, command: EditorCommand) -> String {
        let was_empty = self.state.doc.children.is_empty()
            && self
                .state
                .doc
                .pages
                .as_ref()
                .is_none_or(|pages| pages.iter().all(|p| p.children.is_empty()));
        let is_import = matches!(command, EditorCommand::InsertSubtree { .. });
        let mut next = self.state.clone();
        if !apply_command(&mut next, command) {
            return error_reply("Design command was rejected");
        }
        if was_empty && is_import {
            op_pen_loader::apply_editor_meta(
                &mut next,
                op_pen_loader::EditorMeta {
                    active_page_index: 0,
                    preserve_authored_geometry: true,
                    scenario: None,
                    pinned_style_guide: None,
                },
            );
        }
        if next.doc != self.state.doc && next.history.past == self.state.history.past {
            next.history_push_past(self.state.snapshot_for_history());
        }
        self.state = next;
        ok_reply(value)
    }
}

fn decode_resources_map(raw: Option<&str>) -> Result<BTreeMap<String, Vec<u8>>, String> {
    let Some(raw) = raw.filter(|s| !s.trim().is_empty()) else {
        return Ok(BTreeMap::new());
    };
    let encoded: BTreeMap<String, String> =
        serde_json::from_str(raw).map_err(|e| format!("invalid resourcesJson: {e}"))?;
    let mut out = BTreeMap::new();
    for (key, value) in encoded {
        let bytes = base64::engine::general_purpose::STANDARD
            .decode(value.trim())
            .map_err(|e| format!("invalid resource base64 for {key}: {e}"))?;
        out.insert(key, bytes);
    }
    Ok(out)
}

fn lookup_resource(resources: &BTreeMap<String, Vec<u8>>, url: &str) -> Option<Vec<u8>> {
    if let Some(bytes) = resources.get(url) {
        return Some(bytes.clone());
    }
    let stripped = url
        .strip_prefix(op_html::VIRTUAL_PROJECT_ORIGIN)
        .unwrap_or(url)
        .split(['?', '#'])
        .next()?
        .trim_start_matches('/');
    resources.get(stripped).cloned()
}

fn ok_reply(value: Value) -> String {
    json!({
        "isError": false,
        "content": [{ "type": "text", "text": value.to_string() }],
        "structuredContent": value,
    })
    .to_string()
}

fn apply_command(state: &mut EditorState, command: EditorCommand) -> bool {
    state.apply(command)
}

fn error_reply(message: &str) -> String {
    json!({ "isError": true, "content": [{ "type": "text", "text": message }] }).to_string()
}

fn js_error(error: impl std::fmt::Display) -> JsValue {
    JsValue::from_str(&error.to_string())
}
