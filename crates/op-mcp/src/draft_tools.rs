use std::collections::BTreeMap;

use serde_json::{json, Value};

use crate::{McpTool, ToolErrorCode, ToolOutcome};

pub struct HostDraftTool(pub &'static str);

pub fn schemas() -> Vec<Value> {
    let id = json!({"type":"string","format":"uuid","minLength":36,"maxLength":36});
    [
        ("list_drafts", "List persistent recovery snapshots for the parent-bound document. Returns metadata only; never restores automatically.", json!({}), json!([])),
        ("create_draft", "Create a persistent named recovery checkpoint without editing the live document or saving the bound file.", json!({"label":{"type":"string","minLength":1,"maxLength":160}}), json!([])),
        ("restore_draft", "Restore a persistent recovery snapshot as one undoable edit, preserving previous undo history. Writes a protective backup first; does not save the bound file. Optional baseVersion rejects stale callers.", json!({"id":id,"baseVersion":{"type":"integer","minimum":0}}), json!(["id"])),
        ("delete_draft", "Discard a recovery snapshot by opaque ID without editing the document or saving the bound file.", json!({"id":id}), json!(["id"])),
    ]
    .into_iter()
    .map(|(name, description, properties, required)| json!({
        "name":name, "description":description,
        "inputSchema":{"type":"object","properties":properties,"required":required,"additionalProperties":false}
    }))
    .collect()
}

impl McpTool for HostDraftTool {
    fn name(&self) -> &str {
        self.0
    }

    fn call(&self, _args: &BTreeMap<String, String>) -> ToolOutcome {
        ToolOutcome::Err(
            ToolErrorCode::ToolFailed,
            format!(
                "{} requires the live Node host with a parent-bound document file",
                self.0
            ),
        )
    }
}
