use std::collections::BTreeMap;

use jian_ops_schema::node::{PenNode, TextContent};
use op_editor_core::PenNodeExt;
use op_html::{import_html, HtmlImportOptions};
use serde_json::json;

use crate::import_common::{import_result_to_outcome, parse_import_placement};
use crate::{EditorCommand, McpTool, ToolErrorCode, ToolOutcome};

pub struct PasteHtml;

impl McpTool for PasteHtml {
    fn name(&self) -> &str {
        "paste_html"
    }

    fn call(&self, args: &BTreeMap<String, String>) -> ToolOutcome {
        let Some(html) = args.get("html").filter(|html| !html.trim().is_empty()) else {
            return ToolOutcome::Err(
                ToolErrorCode::MissingArgument,
                "nonempty html is required".into(),
            );
        };
        let mode = args.get("mode").map(String::as_str).unwrap_or("layers");
        if !matches!(mode, "text" | "layers") {
            return ToolOutcome::Err(
                ToolErrorCode::InvalidArgument,
                "mode must be text or layers".into(),
            );
        }
        let placement = match parse_import_placement(args) {
            Ok(placement) => placement,
            Err((code, message)) => return ToolOutcome::Err(code, message),
        };
        let result = import_html(html, &HtmlImportOptions::default());
        if mode == "layers" {
            return import_result_to_outcome(result, placement);
        }
        let mut paragraphs = Vec::new();
        collect_text(&result.nodes, &mut paragraphs);
        let content = paragraphs.join("\n");
        if content.trim().is_empty() {
            return ToolOutcome::Err(
                ToolErrorCode::InvalidArgument,
                "HTML contains no visible text".into(),
            );
        }
        let node: PenNode = match serde_json::from_value(json!({
            "id":"html-paste-text","type":"text","content":content,
            "x":placement.x,"y":placement.y,"fontSize":16,"textGrowth":"auto"
        })) {
            Ok(node) => node,
            Err(err) => {
                return ToolOutcome::Err(
                    ToolErrorCode::ToolFailed,
                    format!("cannot construct text node: {err}"),
                )
            }
        };
        ToolOutcome::OkJsonWithCommand(
            json!({"mode":mode,"text":content,"warnings":result.warnings,"nodeCount":1})
                .to_string(),
            EditorCommand::InsertSubtree {
                nodes: vec![node],
                parent_id: placement.parent_id,
                page_id: placement.page_id,
            },
        )
    }
}

fn collect_text(nodes: &[PenNode], paragraphs: &mut Vec<String>) {
    for node in nodes {
        if let PenNode::Text(text) = node {
            paragraphs.push(match &text.content {
                TextContent::Plain(value) => value.clone(),
                TextContent::Styled(ranges) => {
                    ranges.iter().map(|range| range.text.as_str()).collect()
                }
            });
        }
        if let Some(children) = node.children() {
            collect_text(children, paragraphs);
        }
    }
}
