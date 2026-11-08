use std::collections::BTreeMap;

use serde_json::{json, Value};

use crate::{McpTool, ToolErrorCode, ToolOutcome};

/// Default and hard caps for the longest output edge, in pixels.
pub const DEFAULT_MAX_SIZE: u32 = 1600;
pub const HARD_MAX_SIZE: u32 = 4096;

pub struct GetScreenshot;

pub fn schema() -> Value {
    json!({
        "name": "get_screenshot",
        "description": "Render the actual CanvasKit design output as a PNG image so you can visually verify a design (overlap, clipping, contrast, alignment, hierarchy). Omit nodeId to capture the first visible board on the active page, pass a screen/frame/node id (on any page) to capture its rendered bounds (siblings overlapping that region are included), or pass \"page\" for the whole active page. Excludes editor chrome, grid and selection; changes no document state. The Node host renders in a hidden headless browser when no editor is open; structuredContent.renderer reports canvaskit-headless, canvaskit-editor or approximate (no browser available: text shaping and effects are simplified). If it errors, fall back to snapshot_layout and get_design_quality instead of guessing.",
        "inputSchema": {
            "type": "object",
            "additionalProperties": false,
            "required": [],
            "properties": {
                "nodeId": {"type": "string", "minLength": 1},
                "scale": {"type": "number", "minimum": 0.25, "maximum": 4, "default": 1},
                "maxSize": {"type": "integer", "minimum": 64, "maximum": HARD_MAX_SIZE, "default": DEFAULT_MAX_SIZE},
                "background": {"type": "string", "enum": ["canvas", "transparent"], "default": "canvas"}
            }
        }
    })
}

impl McpTool for GetScreenshot {
    fn name(&self) -> &str {
        "get_screenshot"
    }

    fn call(&self, _args: &BTreeMap<String, String>) -> ToolOutcome {
        // The Node transport awaits the renderer; the document engine must not fabricate images.
        ToolOutcome::Err(
            ToolErrorCode::ToolFailed,
            "get_screenshot requires the live Node host and a synchronized CanvasKit editor; it cannot run in the standalone document engine. Use snapshot_layout and get_design_quality instead".into(),
        )
    }
}
