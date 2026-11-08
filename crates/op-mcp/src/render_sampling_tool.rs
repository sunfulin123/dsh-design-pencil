use std::collections::BTreeMap;

use serde_json::{json, Value};

use crate::{McpTool, ToolErrorCode, ToolOutcome};

pub struct SampleColor;

pub fn schema() -> Value {
    json!({
        "name": "sample_color",
        "description": "Read the actual CanvasKit-composited color at document-space x/y or a visible node's rendered center. Requires an open synchronized Node-hosted editor; excludes editor chrome/grid/selection. Returns RGBA8 and hex without modifying content. Move offscreen targets into view first.",
        "inputSchema": {
            "type": "object",
            "additionalProperties": false,
            "required": [],
            "properties": {
                "x": {"type": "number"},
                "y": {"type": "number"},
                "nodeId": {"type": "string", "minLength": 1}
            },
            "oneOf": [
                {"required": ["x", "y"], "not": {"required": ["nodeId"]}},
                {"required": ["nodeId"], "not": {"anyOf": [
                    {"required": ["x"]}, {"required": ["y"]}
                ]}}
            ]
        }
    })
}

impl McpTool for SampleColor {
    fn name(&self) -> &str {
        "sample_color"
    }

    fn call(&self, _args: &BTreeMap<String, String>) -> ToolOutcome {
        // The Node transport awaits the renderer; the document engine must not guess pixels.
        ToolOutcome::Err(
            ToolErrorCode::ToolFailed,
            "sample_color requires the live Node host and a synchronized CanvasKit editor; it cannot run in the standalone document engine".into(),
        )
    }
}
