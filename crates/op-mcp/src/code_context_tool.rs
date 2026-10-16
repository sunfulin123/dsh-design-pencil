//! High-fidelity design-to-code context extraction tool (`get_design_code_context`).
//!
//! Returns a single self-contained JSON payload for the currently selected
//! nodes (or explicit `nodeIds`, or the active page's root frames when nothing
//! is selected), including:
//! - Deterministic `designJsx`, `tailwindJsx`, and `htmlCss` reference code
//! - Resolved CSS custom properties (`cssVariables`) and raw `variables` / `themes`
//! - `designMd` specification if present on the document
//! - Full canonical node subtrees (`nodes`) with authored layout, fills, strokes,
//!   effects, typography, and SVG path data

use std::collections::BTreeMap;

use jian_ops_schema::node::PenNode;
use op_codegen::Codegen;
use op_editor_core::pen_node_ext::PenNodeExt;
use op_editor_core::walkers::find_node;
use op_editor_core::{EditorState, NodeId};
use serde_json::{json, Value};

use super::read_nodes::{node_snapshot_value, page_nodes_snapshots, PageNodes};
use super::{McpTool, ToolErrorCode, ToolOutcome};

pub struct GetDesignCodeContext {
    doc: jian_ops_schema::PenDocument,
    pages: Vec<PageNodes>,
    active_page_id: String,
    selected_ids: Vec<String>,
}

impl McpTool for GetDesignCodeContext {
    fn name(&self) -> &str {
        "get_design_code_context"
    }

    fn call(&self, args: &BTreeMap<String, String>) -> ToolOutcome {
        let page_id = args
            .get("pageId")
            .or_else(|| args.get("page_id"))
            .map(String::as_str)
            .unwrap_or(&self.active_page_id);
        let Some(page) = self
            .pages
            .iter()
            .find(|p| p.id == page_id)
            .or_else(|| self.pages.first())
        else {
            return ToolOutcome::Err(
                ToolErrorCode::ToolFailed,
                format!("page not found: {page_id}"),
            );
        };

        let explicit_ids = parse_node_ids_arg(args);
        let target_ids: Vec<String> = match explicit_ids {
            Some(ids) if !ids.is_empty() => ids,
            _ if !self.selected_ids.is_empty() => self.selected_ids.clone(),
            _ => page.roots.iter().map(|n| n.id_str().to_string()).collect(),
        };

        let target_refs: Vec<&PenNode> = if target_ids.is_empty() {
            page.roots.iter().collect()
        } else {
            let mut found = Vec::new();
            for id in &target_ids {
                if let Some(nid) = NodeId::new_opt(id) {
                    if let Some(n) = find_node(&page.roots, &nid) {
                        found.push(n);
                    }
                }
            }
            if found.is_empty() {
                page.roots.iter().collect()
            } else {
                found
            }
        };

        let format_filter = args
            .get("format")
            .map(|s| s.trim().to_ascii_lowercase())
            .unwrap_or_else(|| "all".to_string());

        let design_jsx = if format_filter == "all"
            || format_filter == "design-jsx"
            || format_filter == "design_jsx"
        {
            Some(op_codegen::generate_design_jsx_for_node_refs(
                &self.doc,
                &target_refs,
            ))
        } else {
            None
        };

        let tailwind_jsx = if format_filter == "all"
            || format_filter == "tailwind-jsx"
            || format_filter == "tailwind_jsx"
            || format_filter == "tailwind"
            || format_filter == "react"
        {
            Some(op_codegen::generate_tailwind_jsx_for_node_refs(
                &self.doc,
                &target_refs,
            ))
        } else {
            None
        };

        let html_css = if format_filter == "all"
            || format_filter == "html-css"
            || format_filter == "html_css"
            || format_filter == "html"
        {
            Some(op_codegen::generate_html_css_for_node_refs(
                &self.doc,
                &target_refs,
            ))
        } else {
            None
        };

        let css_variables = op_codegen::CssVariables.generate(&self.doc);
        let nodes_json: Vec<Value> = target_refs
            .iter()
            .map(|node| node_snapshot_value(node, -1))
            .collect();
        let accessibility_tree: Vec<Value> = target_refs
            .iter()
            .map(|node| build_a11y_intent_node(node))
            .collect();

        let payload = json!({
            "activePageId": page.id,
            "targetNodeIds": target_refs.iter().map(|n| n.id_str()).collect::<Vec<_>>(),
            "selectionActive": !self.selected_ids.is_empty(),
            "code": {
                "designJsx": design_jsx,
                "tailwindJsx": tailwind_jsx,
                "htmlCss": html_css,
                "cssVariables": css_variables,
            },
            "accessibilityTree": accessibility_tree,
            "variables": self.doc.variables.as_ref().unwrap_or(&BTreeMap::new()),
            "themes": self.doc.themes.as_ref(),
            "designMd": self.doc.design_md.as_ref(),
            "nodes": nodes_json,
        });

        ToolOutcome::OkJson(
            serde_json::to_string_pretty(&payload).unwrap_or_else(|_| payload.to_string()),
        )
    }
}

pub fn build_a11y_intent_node(node: &PenNode) -> Value {
    let base = node.base();
    let sem = op_editor_core::command_node_attrs::node_semantics(node);
    let mut obj = serde_json::Map::new();
    let node_type = serde_json::to_value(node)
        .ok()
        .and_then(|v| v.get("type").and_then(|t| t.as_str()).map(str::to_string))
        .unwrap_or_else(|| "node".to_string());
    obj.insert("id".into(), json!(node.id_str()));
    obj.insert("type".into(), json!(node_type));
    if let Some(name) = base.name.as_deref().filter(|s| !s.is_empty()) {
        obj.insert("name".into(), json!(name));
    }
    let role = base.role.clone().or_else(|| {
        sem.and_then(|s| s.role)
            .and_then(|r| serde_json::to_value(r).ok())
            .and_then(|v| v.as_str().map(str::to_string))
    });
    if let Some(role) = role.filter(|s| !s.is_empty()) {
        obj.insert("role".into(), json!(role));
    }
    let explain = base
        .explain
        .clone()
        .or_else(|| sem.and_then(|s| s.ai_description.clone()));
    if let Some(explain) = explain.filter(|s| !s.is_empty()) {
        obj.insert("explain".into(), json!(explain));
    }
    if let Some(label) = sem
        .and_then(|s| s.label.as_deref())
        .filter(|s| !s.is_empty())
    {
        obj.insert("ariaLabel".into(), json!(label));
    }
    if let Some(hint) = sem
        .and_then(|s| s.hint.as_deref())
        .filter(|s| !s.is_empty())
    {
        obj.insert("ariaHint".into(), json!(hint));
    }
    if let Some(ai_name) = sem
        .and_then(|s| s.ai_name.as_deref())
        .filter(|s| !s.is_empty())
    {
        obj.insert("aiName".into(), json!(ai_name));
    }
    if let Some(screen) = node.screen().filter(|s| !s.is_empty()) {
        obj.insert("screen".into(), json!(screen));
    }
    if let Some(events) = node.events() {
        if let Ok(val) = serde_json::to_value(events) {
            if val.as_object().is_some_and(|m| !m.is_empty()) {
                obj.insert("events".into(), val);
            }
        }
    }
    if let Some(t) = op_editor_core::command_node_attrs::resolve_text_node(node) {
        let text = match &t.content {
            jian_ops_schema::node::text::TextContent::Plain(s) => s.clone(),
            jian_ops_schema::node::text::TextContent::Styled(segs) => segs
                .iter()
                .map(|seg| seg.text.as_str())
                .collect::<Vec<_>>()
                .join(""),
        };
        obj.insert("textContent".into(), json!(text));
        if t.base.id != node.id_str() {
            obj.insert("textNodeId".into(), json!(t.base.id));
        }
    }
    let children = match node {
        PenNode::Frame(f) => f.children.as_deref().unwrap_or(&[]),
        PenNode::Group(g) => g.children.as_deref().unwrap_or(&[]),
        _ => &[],
    };
    if !children.is_empty() {
        obj.insert(
            "children".into(),
            Value::Array(children.iter().map(build_a11y_intent_node).collect()),
        );
    }
    Value::Object(obj)
}

pub struct GetAccessibilityTree {
    pages: Vec<PageNodes>,
    active_page_id: String,
    selected_ids: Vec<String>,
}

impl McpTool for GetAccessibilityTree {
    fn name(&self) -> &str {
        "get_accessibility_tree"
    }

    fn call(&self, args: &BTreeMap<String, String>) -> ToolOutcome {
        let page_id = args
            .get("pageId")
            .or_else(|| args.get("page_id"))
            .map(String::as_str)
            .unwrap_or(&self.active_page_id);
        let Some(page) = self
            .pages
            .iter()
            .find(|p| p.id == page_id)
            .or_else(|| self.pages.first())
        else {
            return ToolOutcome::Err(
                ToolErrorCode::ToolFailed,
                format!("page not found: {page_id}"),
            );
        };
        let explicit_ids = parse_node_ids_arg(args);
        let target_ids: Vec<String> = match explicit_ids {
            Some(ids) if !ids.is_empty() => ids,
            _ if !self.selected_ids.is_empty() => self.selected_ids.clone(),
            _ => page.roots.iter().map(|n| n.id_str().to_string()).collect(),
        };
        let target_refs: Vec<&PenNode> = if target_ids.is_empty() {
            page.roots.iter().collect()
        } else {
            let mut found = Vec::new();
            for id in &target_ids {
                if let Some(nid) = NodeId::new_opt(id) {
                    if let Some(n) = find_node(&page.roots, &nid) {
                        found.push(n);
                    }
                }
            }
            if found.is_empty() {
                page.roots.iter().collect()
            } else {
                found
            }
        };
        let tree: Vec<Value> = target_refs
            .iter()
            .map(|n| build_a11y_intent_node(n))
            .collect();
        let payload = json!({
            "activePageId": page.id,
            "targetNodeIds": target_refs.iter().map(|n| n.id_str()).collect::<Vec<_>>(),
            "accessibilityTree": tree,
        });
        ToolOutcome::OkJson(
            serde_json::to_string_pretty(&payload).unwrap_or_else(|_| payload.to_string()),
        )
    }
}

pub fn get_accessibility_tree_snapshot(state: &EditorState) -> GetAccessibilityTree {
    let (pages, active_page_id) = page_nodes_snapshots(state);
    let selected_ids = state
        .selection
        .set
        .iter()
        .filter(|id| id.is_real())
        .map(|id| id.as_str().to_string())
        .collect();
    GetAccessibilityTree {
        pages,
        active_page_id,
        selected_ids,
    }
}

pub struct SetNodeSemantics;

impl McpTool for SetNodeSemantics {
    fn name(&self) -> &str {
        "set_node_semantics"
    }

    fn call(&self, args: &BTreeMap<String, String>) -> ToolOutcome {
        let Some(raw_id) = args
            .get("nodeId")
            .or_else(|| args.get("node_id"))
            .map(|s| s.trim())
            .filter(|s| !s.is_empty())
        else {
            return ToolOutcome::Err(ToolErrorCode::MissingArgument, "node_id is required".into());
        };
        let node_id = NodeId::new(raw_id.to_string());
        let mut patch = serde_json::Map::new();
        if let Some(role) = args.get("role") {
            let trimmed = role.trim();
            patch.insert(
                "role".into(),
                if trimmed.is_empty() {
                    Value::Null
                } else {
                    json!(trimmed)
                },
            );
        }
        if let Some(explain) = args.get("explain").or_else(|| args.get("description")) {
            let trimmed = explain.trim();
            patch.insert(
                "explain".into(),
                if trimmed.is_empty() {
                    Value::Null
                } else {
                    json!(trimmed)
                },
            );
        }
        if let Some(screen) = args.get("screen") {
            let trimmed = screen.trim();
            patch.insert(
                "screen".into(),
                if trimmed.is_empty() {
                    Value::Null
                } else {
                    json!(trimmed)
                },
            );
        }
        let mut sem_obj = serde_json::Map::new();
        if let Some(label) = args
            .get("a11yLabel")
            .or_else(|| args.get("a11y_label"))
            .or_else(|| args.get("ariaLabel"))
        {
            let trimmed = label.trim();
            if !trimmed.is_empty() {
                sem_obj.insert("label".into(), json!(trimmed));
            }
        }
        if let Some(hint) = args.get("a11yHint").or_else(|| args.get("a11y_hint")) {
            let trimmed = hint.trim();
            if !trimmed.is_empty() {
                sem_obj.insert("hint".into(), json!(trimmed));
            }
        }
        if let Some(ai_name) = args.get("aiName").or_else(|| args.get("ai_name")) {
            let trimmed = ai_name.trim();
            if !trimmed.is_empty() {
                sem_obj.insert("aiName".into(), json!(trimmed));
            }
        }
        if let Some(ai_desc) = args
            .get("aiDescription")
            .or_else(|| args.get("ai_description"))
            .or_else(|| args.get("explain"))
        {
            let trimmed = ai_desc.trim();
            if !trimmed.is_empty() {
                sem_obj.insert("aiDescription".into(), json!(trimmed));
            }
        }
        if !sem_obj.is_empty() {
            patch.insert("semantics".into(), Value::Object(sem_obj));
        }
        if let Some(on_tap) = args.get("onTap").or_else(|| args.get("on_tap")) {
            let trimmed = on_tap.trim();
            if trimmed == "pop" || trimmed == "back" {
                patch.insert("events".into(), json!({"onTap": [{"pop": null}]}));
            } else if !trimmed.is_empty() {
                let body = serde_json::to_string(trimmed).unwrap_or_default();
                patch.insert("events".into(), json!({"onTap": [{"replace": body}]}));
            }
        }
        if patch.is_empty() {
            return ToolOutcome::Err(
                ToolErrorCode::MissingArgument,
                "at least one of role, explain, a11yLabel, a11yHint, aiName, aiDescription, screen, or onTap is required".into(),
            );
        }
        let mut out = BTreeMap::new();
        out.insert("wrote".into(), "true".into());
        ToolOutcome::OkWithCommand(
            out,
            op_editor_core::EditorCommand::PatchNodeData {
                node_id,
                patch_json: Value::Object(patch).to_string(),
                page_id: args.get("pageId").or_else(|| args.get("page_id")).cloned(),
            },
        )
    }
}

pub fn set_node_semantics_snapshot() -> SetNodeSemantics {
    SetNodeSemantics
}

fn parse_node_ids_arg(args: &BTreeMap<String, String>) -> Option<Vec<String>> {
    let raw = args
        .get("nodeIds")
        .or_else(|| args.get("node_ids"))
        .or_else(|| args.get("ids"))?;
    let trimmed = raw.trim();
    if trimmed.is_empty() {
        return None;
    }
    if trimmed.starts_with('[') {
        if let Ok(parsed) = serde_json::from_str::<Vec<String>>(trimmed) {
            return Some(parsed);
        }
    }
    Some(
        trimmed
            .split(',')
            .map(str::trim)
            .filter(|s| !s.is_empty())
            .map(str::to_string)
            .collect(),
    )
}

pub fn get_design_code_context_snapshot(state: &EditorState) -> GetDesignCodeContext {
    let (pages, active_page_id) = page_nodes_snapshots(state);
    let selected_ids = state
        .selection
        .set
        .iter()
        .filter(|id| id.is_real())
        .map(|id| id.as_str().to_string())
        .collect();
    GetDesignCodeContext {
        doc: state.doc.clone(),
        pages,
        active_page_id,
        selected_ids,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn code_context_returns_all_three_deterministic_formats_and_nodes() {
        let doc = jian_ops_schema::load_str(
            r##"{
              "version":"1.0",
              "variables":{"--accent":{"type":"color","value":"#2563eb"}},
              "children":[
                {"type":"frame","id":"hero","name":"Hero","role":"section","layout":"vertical","gap":16,"padding":[24,32],"width":640,"height":"fit_content","fill":[{"type":"solid","color":"$--accent"}],
                 "children":[
                   {"type":"text","id":"headline","name":"Headline","content":"Pixel Perfect","fontSize":32,"fontWeight":700,"fill":[{"type":"solid","color":"#ffffff"}]}
                 ]}
              ]
            }"##,
        )
        .expect("parse fixture")
        .value;
        let state = EditorState::from_document(doc);
        let tool = get_design_code_context_snapshot(&state);
        let ToolOutcome::OkJson(raw) = tool.call(&BTreeMap::new()) else {
            panic!("expected OkJson");
        };
        let parsed: Value = serde_json::from_str(&raw).expect("valid json");
        assert_eq!(parsed["targetNodeIds"], json!(["hero"]));
        assert!(parsed["code"]["designJsx"]
            .as_str()
            .unwrap()
            .contains("<Frame name=\"Hero\""));
        assert!(parsed["code"]["tailwindJsx"]
            .as_str()
            .unwrap()
            .contains("<section data-name=\"Hero\""));
        assert!(parsed["code"]["htmlCss"]
            .as_str()
            .unwrap()
            .contains("display: flex; flex-direction: column"));
        assert!(parsed["code"]["cssVariables"]
            .as_str()
            .unwrap()
            .contains("--accent: #2563eb;"));
    }
}
