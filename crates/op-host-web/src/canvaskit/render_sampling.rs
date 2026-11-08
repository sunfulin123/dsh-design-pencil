use std::cell::RefCell;
use std::rc::Rc;

use op_editor_ui::RenderBackend;
use serde::Deserialize;
use serde_json::{json, Value};
use wasm_bindgen::JsCast;

use super::inner::CkInner;
use crate::live_sync_glue::SharedSync;

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct SampleArgs {
    x: Option<f64>,
    y: Option<f64>,
    #[serde(rename = "nodeId")]
    node_id: Option<String>,
}

impl CkInner {
    pub(super) fn sync_eyedropper_cursor(&mut self) -> Result<(), wasm_bindgen::JsValue> {
        let style = self.canvas.style();
        match (
            self.host.eyedropper_active(),
            self.cursor_before_eyedropper.as_ref(),
        ) {
            (true, None) => {
                let previous = style.get_property_value("cursor")?;
                style.set_property("cursor", "crosshair")?;
                self.cursor_before_eyedropper = Some(previous);
            }
            (false, Some(previous)) => {
                style.set_property("cursor", previous)?;
                self.cursor_before_eyedropper = None;
            }
            _ => {}
        }
        Ok(())
    }

    fn read_design_pixels(
        &mut self,
        args: &SampleArgs,
        radius: u32,
    ) -> Result<(f64, f64, Vec<u8>), String> {
        let point = match (args.x, args.y, args.node_id.as_deref()) {
            (Some(x), Some(y), None) => Some((x, y)),
            (None, None, Some(id)) if !id.trim().is_empty() => None,
            _ => {
                return Err("Provide either finite document-space x/y or a nonempty nodeId".into())
            }
        };
        if op_editor_ui::image_runtime::has_pending_decodes() {
            return Err("Wait for design images to finish decoding and retry".into());
        }
        let (width, height) = self.backend.logical_size();
        self.backend.begin_frame();
        self.backend.ck.clear(0.0, 0.0, 0.0, 0.0);
        let sample = self.host.paint_color_sample(
            &mut self.backend,
            width,
            height,
            point,
            args.node_id.as_deref(),
        );
        self.backend.end_frame();
        let result = sample.and_then(|(x, y, screen)| {
            if op_editor_ui::image_runtime::has_pending_decodes() {
                return Err("Wait for design images to finish decoding and retry".into());
            }
            let pixel_x = (screen.x * self.backend.dpr).floor() as u32;
            let pixel_y = (screen.y * self.backend.dpr).floor() as u32;
            let rgba = self
                .backend
                .ck
                .sample_region(pixel_x, pixel_y, radius)
                .map_err(|error| {
                    error
                        .as_string()
                        .or_else(|| {
                            error
                                .dyn_ref::<js_sys::Error>()
                                .map(|error| String::from(error.message()))
                        })
                        .unwrap_or_else(|| format!("CanvasKit pixel read failed: {error:?}"))
                })?
                .to_vec();
            if rgba.len() != ((radius * 2 + 1).pow(2) * 4) as usize {
                return Err("CanvasKit returned an invalid RGBA8 region".into());
            }
            Ok((x, y, rgba))
        });
        result
    }

    fn sample_design_pixel(&mut self, args: &SampleArgs) -> Result<Value, String> {
        let result = self.read_design_pixels(args, 0).map(|(x, y, rgba)| {
            let mut value = json!({ "x": x, "y": y, "rgba": rgba });
            if let Some(id) = &args.node_id {
                value["nodeId"] = json!(id);
            }
            value
        });
        // Restore the editor in this same JS task, before the browser composites.
        let (width, height) = self.backend.logical_size();
        self.backend.begin_frame();
        self.host.paint_dyn(&mut self.backend, width, height);
        self.backend.end_frame();
        result
    }

    pub(super) fn refresh_eyedropper(&mut self) {
        let (width, height) = self.backend.logical_size();
        let point = match self.host.eyedropper_sample_point(width, height) {
            Ok(Some(point)) => point,
            Ok(None) => return,
            Err(error) => {
                self.host.fail_eyedropper(error);
                return;
            }
        };
        if self.host.layout_transition_active()
            || op_editor_ui::image_runtime::has_pending_decodes()
        {
            return;
        }
        let args = SampleArgs {
            x: Some(point.0),
            y: Some(point.1),
            node_id: None,
        };
        match self.read_design_pixels(&args, 4) {
            Ok((_, _, pixels)) => {
                if let Err(error) = self.host.complete_eyedropper_patch(pixels) {
                    self.host.fail_eyedropper(error);
                }
            }
            Err(_) if op_editor_ui::image_runtime::has_pending_decodes() => {}
            Err(error) => self.host.fail_eyedropper(error),
        }
    }
}

pub(super) fn start(inner: &Rc<RefCell<CkInner>>, sync: SharedSync) {
    super::render_queue::start(
        inner,
        sync,
        "/api/mcp/color-samples",
        "Color sampling",
        |inner, args| {
            Some(
                serde_json::from_value::<SampleArgs>(args.clone())
                    .map_err(|error| format!("Invalid color sampling arguments: {error}"))
                    .and_then(|args| inner.sample_design_pixel(&args)),
            )
        },
    );
}
