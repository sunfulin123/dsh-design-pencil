//! Browser renderer for the `get_screenshot` MCP tool.

use std::cell::RefCell;
use std::rc::Rc;

use base64::Engine as _;
use serde::Deserialize;
use serde_json::{json, Value};
use wasm_bindgen::JsCast;

use super::inner::CkInner;
use crate::live_sync_glue::SharedSync;

#[derive(Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
struct ScreenshotArgs {
    node_id: Option<String>,
    scale: f32,
    max_size: u32,
    background: String,
    #[serde(default)]
    isolate: bool,
}

fn js_error(error: wasm_bindgen::JsValue) -> String {
    error
        .as_string()
        .or_else(|| {
            error
                .dyn_ref::<js_sys::Error>()
                .map(|error| String::from(error.message()))
        })
        .unwrap_or_else(|| format!("CanvasKit capture failed: {error:?}"))
}

impl CkInner {
    fn capture_screenshot(&mut self, args: &ScreenshotArgs) -> Result<Value, String> {
        let canvas_background = match args.background.as_str() {
            "canvas" => true,
            "transparent" => false,
            other => return Err(format!("Unsupported screenshot background {other}")),
        };
        if !(0.25..=4.0).contains(&args.scale) || !(64..=4096).contains(&args.max_size) {
            return Err("Screenshot scale or maxSize is out of range".into());
        }
        let plan = self.host.prepare_screenshot(
            args.node_id.as_deref(),
            args.scale,
            args.max_size,
            args.isolate,
        )?;
        self.backend
            .ck
            .begin_offscreen(plan.width, plan.height)
            .map_err(js_error)?;
        // Paint in output pixels: skip the backend's DPR frame scale.
        self.backend.ck.begin_frame();
        let painted = self
            .host
            .paint_screenshot(&mut self.backend, &plan, canvas_background);
        self.backend.ck.end_frame();
        if let Err(error) = painted {
            self.backend.ck.abort_offscreen();
            return Err(error);
        }
        let png = self
            .backend
            .ck
            .end_offscreen_png()
            .map_err(js_error)?
            .to_vec();
        Ok(json!({
            "nodeId": args.node_id,
            "targetId": plan.target_id,
            "width": plan.width,
            "height": plan.height,
            "scale": plan.scale,
            "png": base64::engine::general_purpose::STANDARD.encode(png),
        }))
    }
}

pub(super) fn start(inner: &Rc<RefCell<CkInner>>, sync: SharedSync) {
    super::render_queue::start(
        inner,
        sync,
        "/api/mcp/screenshots",
        "Screenshot",
        |inner, args| {
            // Retry on a later tick instead of capturing half-decoded images.
            if op_editor_ui::image_runtime::has_pending_decodes() {
                return None;
            }
            let result = serde_json::from_value::<ScreenshotArgs>(args.clone())
                .map_err(|error| format!("Invalid screenshot arguments: {error}"))
                .and_then(|args| inner.capture_screenshot(&args));
            if op_editor_ui::image_runtime::has_pending_decodes() {
                return None;
            }
            Some(result)
        },
    );
}
