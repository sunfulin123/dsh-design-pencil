//! Markdown and range styling tools backed by canonical, undoable node patches.
//! Range offsets are Unicode scalar values. Paragraph/list spacing is real
//! frame padding, and list markers occupy a separate hanging-indent column.
use crate::{EditorCommand, McpTool, ToolErrorCode, ToolOutcome};

#[path = "text_design_schema.rs"]
mod schema;
use jian_ops_schema::node::{PenNode, TextContent, TextNode};
use op_editor_core::text_design::{
    markdown_to_node, plain_text, segment, styled_range, MarkdownOptions, ParagraphStyle,
    TextRangeStyle,
};
use op_editor_core::text_design_command::TextDesignSnapshot;
use op_editor_core::{EditorState, NodeId, PenNodeExt};
pub use schema::text_design_tool_schema;
use serde::de::DeserializeOwned;
use serde_json::{json, Value};
use std::collections::BTreeMap;

struct TextSnapshot {
    shared: TextDesignSnapshot,
}

impl TextSnapshot {
    fn new(state: &EditorState) -> Self {
        Self {
            shared: TextDesignSnapshot::new(state),
        }
    }

    #[allow(clippy::result_large_err)]
    fn node<'a>(&'a self, args: &BTreeMap<String, String>) -> Result<&'a PenNode, ToolOutcome> {
        let id = args
            .get("nodeId")
            .or_else(|| args.get("node_id"))
            .ok_or_else(|| missing("nodeId"))?;
        self.shared.node(id).map_err(invalid)
    }

    #[allow(clippy::result_large_err)]
    fn text(&self, args: &BTreeMap<String, String>) -> Result<TextNode, ToolOutcome> {
        let node = self.node(args)?;
        self.shared.text(node.id_str()).map_err(invalid)
    }

    #[allow(clippy::result_large_err)]
    fn markdown_template(&self, args: &BTreeMap<String, String>) -> Result<TextNode, ToolOutcome> {
        let id = args
            .get("nodeId")
            .or_else(|| args.get("node_id"))
            .ok_or_else(|| missing("nodeId"))?;
        self.shared.markdown_template(id).map_err(invalid)
    }

    fn patch_tree(&self, node: PenNode) -> ToolOutcome {
        let id = node.id_str().to_owned();
        match self.shared.patch_tree(node) {
            Ok((command, ids)) => ToolOutcome::OkJsonWithCommand(
                json!({"wrote":true,"nodeId":id,"nodeIds":ids}).to_string(),
                command,
            ),
            Err(error) => invalid(error),
        }
    }
}

pub struct SetTextContent {
    snapshot: TextSnapshot,
}
pub struct SetTextMarkdown {
    snapshot: TextSnapshot,
}
pub struct SetTextStyle {
    snapshot: TextSnapshot,
}
pub struct GetTextStyle {
    snapshot: TextSnapshot,
}
pub struct SetParagraphStyle {
    snapshot: TextSnapshot,
}

pub fn set_text_content_snapshot(state: &EditorState) -> SetTextContent {
    SetTextContent {
        snapshot: TextSnapshot::new(state),
    }
}
pub fn set_text_markdown_snapshot(state: &EditorState) -> SetTextMarkdown {
    SetTextMarkdown {
        snapshot: TextSnapshot::new(state),
    }
}
pub fn set_text_style_snapshot(state: &EditorState) -> SetTextStyle {
    SetTextStyle {
        snapshot: TextSnapshot::new(state),
    }
}
pub fn get_text_style_snapshot(state: &EditorState) -> GetTextStyle {
    GetTextStyle {
        snapshot: TextSnapshot::new(state),
    }
}
pub fn set_paragraph_style_snapshot(state: &EditorState) -> SetParagraphStyle {
    SetParagraphStyle {
        snapshot: TextSnapshot::new(state),
    }
}

impl McpTool for SetTextContent {
    fn name(&self) -> &str {
        "set_text_content"
    }
    fn call(&self, args: &BTreeMap<String, String>) -> ToolOutcome {
        let Some(content) = args.get("content") else {
            return missing("content");
        };
        match args.get("format").map(String::as_str).unwrap_or("plain") {
            "markdown" => markdown(&self.snapshot, args, content),
            "plain" => {
                let text = match self.snapshot.text(args) {
                    Ok(text) => text,
                    Err(error) => return error,
                };
                patch_content(&text.base.id, TextContent::Plain(content.clone()))
            }
            _ => invalid("format must be plain or markdown"),
        }
    }
}

impl McpTool for SetTextMarkdown {
    fn name(&self) -> &str {
        "set_text_markdown"
    }
    fn call(&self, args: &BTreeMap<String, String>) -> ToolOutcome {
        let Some(content) = args.get("markdown") else {
            return missing("markdown");
        };
        markdown(&self.snapshot, args, content)
    }
}

fn markdown(
    snapshot: &TextSnapshot,
    args: &BTreeMap<String, String>,
    content: &str,
) -> ToolOutcome {
    let template = match snapshot.markdown_template(args) {
        Ok(t) => t,
        Err(error) => return error,
    };
    let options: MarkdownOptions = match optional_json(args, "options") {
        Ok(v) => v,
        Err(e) => return e,
    };
    match markdown_to_node(content, &template, &options) {
        Ok(node) => snapshot.patch_tree(node),
        Err(error) => invalid(error),
    }
}

impl McpTool for SetTextStyle {
    fn name(&self) -> &str {
        "set_text_style"
    }
    fn call(&self, args: &BTreeMap<String, String>) -> ToolOutcome {
        let text = match self.snapshot.text(args) {
            Ok(t) => t,
            Err(e) => return e,
        };
        let Some(raw) = args.get("style") else {
            return missing("style");
        };
        let style: TextRangeStyle = match parse_json(raw, "style") {
            Ok(v) => v,
            Err(e) => return e,
        };
        let length = plain_text(&text.content).chars().count();
        let (start, end) = match range(args, length) {
            Ok(v) => v,
            Err(e) => return e,
        };
        match styled_range(&text.content, start, end, &style) {
            Ok(content) => patch_content(&text.base.id, content),
            Err(error) => invalid(error),
        }
    }
}

impl McpTool for GetTextStyle {
    fn name(&self) -> &str {
        "get_text_style"
    }
    fn call(&self, args: &BTreeMap<String, String>) -> ToolOutcome {
        let text = match self.snapshot.text(args) {
            Ok(t) => t,
            Err(e) => return e,
        };
        let flat = plain_text(&text.content);
        let length = flat.chars().count();
        let (start, end) = match range(args, length) {
            Ok(v) => v,
            Err(e) => return e,
        };
        let source = match &text.content {
            TextContent::Plain(text) => vec![segment(text)],
            TextContent::Styled(runs) => runs.clone(),
        };
        let mut offset = 0;
        let mut runs = Vec::<Value>::new();
        for mut run in source {
            let run_end = offset + run.text.chars().count();
            let (a, b) = (offset.max(start), run_end.min(end));
            if a < b {
                run.text = run.text.chars().skip(a - offset).take(b - a).collect();
                let mut value = serde_json::to_value(run).unwrap_or(Value::Null);
                value["start"] = json!(a);
                value["end"] = json!(b);
                runs.push(value);
            }
            offset = run_end;
        }
        ToolOutcome::OkJson(json!({
            "nodeId":text.base.id,"text":flat.chars().skip(start).take(end-start).collect::<String>(),
            "length":length,"start":start,"end":end,"offsetUnit":"unicode-scalar","runs":runs,
            "fontFamily":text.font_family,"fontSize":text.font_size,"fontWeight":text.font_weight,
            "fontStyle":text.font_style,"underline":text.underline,"strikethrough":text.strikethrough,
            "lineHeight":text.line_height,"textAlign":text.text_align
        }).to_string())
    }
}

impl McpTool for SetParagraphStyle {
    fn name(&self) -> &str {
        "set_paragraph_style"
    }
    fn call(&self, args: &BTreeMap<String, String>) -> ToolOutcome {
        if let Err(error) = self.snapshot.text(args) {
            return error;
        }
        let Some(raw) = args.get("style") else {
            return missing("style");
        };
        let style: ParagraphStyle = match parse_json(raw, "style") {
            Ok(v) => v,
            Err(e) => return e,
        };
        let id = args.get("nodeId").or_else(|| args.get("node_id")).unwrap();
        match self.snapshot.shared.paragraph_node(id, &style) {
            Ok(node) => self.snapshot.patch_tree(node),
            Err(error) => invalid(error),
        }
    }
}

fn patch_content(id: &str, content: TextContent) -> ToolOutcome {
    ToolOutcome::OkJsonWithCommand(
        json!({"wrote":true,"nodeId":id}).to_string(),
        EditorCommand::Batch {
            commands: vec![EditorCommand::PatchNodeData {
                node_id: NodeId::new(id),
                patch_json: json!({"content":content}).to_string(),
                page_id: None,
            }],
        },
    )
}

#[allow(clippy::result_large_err)]
fn range(args: &BTreeMap<String, String>, length: usize) -> Result<(usize, usize), ToolOutcome> {
    let parse = |key: &str, default| -> Result<usize, ToolOutcome> {
        args.get(key)
            .map(|raw| {
                raw.parse()
                    .map_err(|_| invalid(format!("{key} must be a non-negative integer")))
            })
            .unwrap_or(Ok(default))
    };
    let (start, end) = (parse("start", 0)?, parse("end", length)?);
    if start > end || end > length {
        return Err(invalid(
            "range must satisfy 0 <= start <= end <= character count",
        ));
    }
    Ok((start, end))
}

#[allow(clippy::result_large_err)]
fn optional_json<T: DeserializeOwned + Default>(
    args: &BTreeMap<String, String>,
    key: &str,
) -> Result<T, ToolOutcome> {
    args.get(key)
        .map(|raw| parse_json(raw, key))
        .unwrap_or_else(|| Ok(T::default()))
}
#[allow(clippy::result_large_err)]
fn parse_json<T: DeserializeOwned>(raw: &str, key: &str) -> Result<T, ToolOutcome> {
    serde_json::from_str(raw)
        .map_err(|e| invalid(format!("{key} must be a valid JSON object: {e}")))
}
fn missing(key: &str) -> ToolOutcome {
    ToolOutcome::Err(ToolErrorCode::MissingArgument, format!("{key} is required"))
}
fn invalid(message: impl Into<String>) -> ToolOutcome {
    ToolOutcome::Err(ToolErrorCode::InvalidArgument, message.into())
}

#[cfg(test)]
#[path = "text_design_tools_tests.rs"]
mod tests;
