//! Headless design operations over the canonical editor state for DSH hosts.

use std::collections::BTreeMap;

use op_editor_core::{EditorCommand, EditorState};
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
        let values: BTreeMap<String, Value> = serde_json::from_str(arguments).map_err(js_error)?;
        let args = values
            .into_iter()
            .map(|(key, value)| {
                let text = match value {
                    Value::String(text) => text,
                    value => value.to_string(),
                };
                (key, text)
            })
            .collect();
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
            let mut next = self.state.clone();
            if !apply_command(&mut next, command) {
                return Ok(error_reply("Design command was rejected"));
            }
            if next.doc != self.state.doc && next.history.past == self.state.history.past {
                next.history_push_past(self.state.snapshot_for_history());
            }
            self.state = next;
        }
        Ok(json!({
            "isError": false,
            "content": [{ "type": "text", "text": value.to_string() }],
            "structuredContent": value,
        })
        .to_string())
    }

    pub fn tools_json(&self) -> String {
        json!(tool_catalog::schemas()).to_string()
    }
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
