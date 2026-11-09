//! Discoverable contracts for the HTML import and fidelity tools that the
//! managed Node host answers by rendering pages in a real browser.

use serde_json::{json, Value};

/// Tools only a managed host can run (they drive Chromium and the renderer).
pub fn is_host_tool(name: &str) -> bool {
    name == "compare_html_fidelity"
}

/// Browser-render arguments shared by `import_html` and `import_html_url`.
fn render_properties() -> Value {
    json!({
        "viewportWidth": {"type": "string", "description": "Layout width in CSS pixels (default 1440)."},
        "viewportHeight": {"type": "string", "description": "Initial viewport height (default 900); the full page height is captured."},
        "viewports": {"description": "Import one board per width, side by side, e.g. [1440, 768, 390] (max 4).", "oneOf": [{"type": "array", "items": {"type": "number"}, "maxItems": 4}, {"type": "string"}]},
        "renderMode": {"type": "string", "enum": ["auto", "browser", "static"], "description": "auto (default) renders in headless Chrome and falls back to the static CSS importer with a warning; browser fails instead; static skips the browser."},
        "readyExpression": {"type": "string", "description": "JS expression polled until truthy before capture, e.g. window.__ready === true."},
        "waitMs": {"type": "number", "minimum": 0, "maximum": 30000, "description": "Extra settle time after load."},
        "timeoutMs": {"type": "number", "minimum": 5000, "maximum": 120000},
        "fetchFonts": {"type": "boolean", "description": "Register the page's web fonts with the canvas renderer (default true)."}
    })
}

fn merged(mut base: Value, extra: Value) -> Value {
    if let (Some(base), Value::Object(extra)) = (base.as_object_mut(), extra) {
        base.extend(extra);
    }
    base
}

/// Properties of `import_html`, which the tool catalog macro registers.
pub fn import_html_properties() -> Value {
    merged(
        json!({
            "html": {"type": "string"},
            "htmlPath": {"type": "string"},
            "x": {"type": "string"},
            "y": {"type": "string"},
            "parent": {"type": "string"},
            "pageId": {"type": "string"}
        }),
        render_properties(),
    )
}

/// Replace the catalog's placeholder `import_html` properties.
pub fn patch_import_html(list: &mut [Value]) {
    if let Some(schema) = list
        .iter_mut()
        .find(|schema| schema["name"] == "import_html")
    {
        schema["inputSchema"]["properties"] = import_html_properties();
    }
}

pub fn schemas() -> Vec<Value> {
    vec![
        json!({
            "name": "import_html_url",
            "description": "Render an HTTP(S) page in headless Chrome and import its computed DOM/CSS (scripts, web fonts, canvas pixels) into canonical design nodes; falls back to fetching static HTML/CSS when no browser is available. Check renderMode and warnings in the result.",
            "inputSchema": {
                "type": "object",
                "properties": merged(json!({
                    "url": {"type": "string"},
                    "x": {"type": "string"},
                    "y": {"type": "string"},
                    "parent": {"type": "string"},
                    "pageId": {"type": "string"}
                }), render_properties()),
                "required": ["url"],
                "additionalProperties": false
            }
        }),
        json!({
            "name": "compare_html_fidelity",
            "description": "Render the HTML source in headless Chrome and compare it with an imported board rendered by CanvasKit: pixel mismatch ratio, per-200px band ratios, hottest regions with the layers there, and visible-text coverage. Read-only; verified is true only for a close match.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "nodeId": {"type": "string", "minLength": 1},
                    "html": {"type": "string"},
                    "htmlPath": {"type": "string"},
                    "url": {"type": "string"},
                    "viewportWidth": {"type": "number", "description": "Defaults to the board width."},
                    "viewportHeight": {"type": "number"},
                    "readyExpression": {"type": "string"},
                    "waitMs": {"type": "number", "minimum": 0, "maximum": 30000},
                    "timeoutMs": {"type": "number", "minimum": 5000, "maximum": 120000},
                    "tolerance": {"type": "integer", "minimum": 0, "maximum": 96, "description": "Per-channel tolerance (default 24)."}
                },
                "required": ["nodeId"],
                "additionalProperties": false
            }
        }),
    ]
}
