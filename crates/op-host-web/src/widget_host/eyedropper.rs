use super::WidgetHost;
use op_editor_core::ui_draft::ColorPickerState;
use op_editor_core::NodeId;
use op_editor_ui::{Color, Point2D, Rect, RenderBackend, TextLayout};

pub(super) struct Eyedropper {
    pub point: Point2D,
    pub confirm: bool,
    generation: u64,
    revision: u64,
    page: usize,
    anchor: NodeId,
    selection: Vec<NodeId>,
    picker: ColorPickerState,
    pixels: Option<Vec<u8>>,
}

impl WidgetHost {
    pub(crate) fn eyedropper_active(&self) -> bool {
        self.eyedropper.is_some()
    }

    pub(super) fn start_eyedropper(&mut self) -> bool {
        self.editor_state.color_picker_blur_hex();
        self.editor_state.color_picker_blur_rgb();
        self.editor_state.color_picker_set_drag(None);
        let Some(picker) = self.editor_state.ui.color_picker.clone() else {
            return false;
        };
        if picker.variable.is_none()
            && !self
                .editor_state
                .is_editable(&self.editor_state.selection.anchor)
        {
            return false;
        }
        let scale = self.editor_state.editor_ui.ui_scale.factor();
        self.eyedropper = Some(Eyedropper {
            point: Point2D::new(self.last_cursor_x * scale, self.last_cursor_y * scale),
            confirm: false,
            generation: self.editor_state.document_generation(),
            revision: self.editor_state.document_revision(),
            page: self.editor_state.ui.active_page_index,
            anchor: self.editor_state.selection.anchor.clone(),
            selection: self.editor_state.selection.set.clone(),
            picker,
            pixels: None,
        });
        self.editor_state.editor_ui.view_options_open = false;
        self.mark_dirty();
        true
    }

    fn validate_eyedropper(&self) -> Result<(), String> {
        let sample = self
            .eyedropper
            .as_ref()
            .ok_or("Color sampling is not active")?;
        let state = &self.editor_state;
        if sample.generation != state.document_generation()
            || sample.revision != state.document_revision()
            || sample.page != state.ui.active_page_index
            || sample.anchor != state.selection.anchor
            || sample.selection != state.selection.set
            || state.ui.color_picker.as_ref() != Some(&sample.picker)
            || (sample.picker.variable.is_none() && !state.is_editable(&sample.anchor))
        {
            return Err("The color target changed; reopen the color picker and retry".into());
        }
        Ok(())
    }

    pub(crate) fn eyedropper_sample_point(
        &mut self,
        width: f32,
        height: f32,
    ) -> Result<Option<(f64, f64)>, String> {
        if self.eyedropper.is_none() {
            return Ok(None);
        }
        self.validate_eyedropper()?;
        if self.editor_state.editor_ui.preview.mode
            || op_editor_core::host_keyboard_transitions::import_modal_blocked_by_overlay(
                &self.editor_state.editor_ui,
            )
        {
            self.eyedropper = None;
            return Ok(None);
        }
        let scale = self.editor_state.editor_ui.ui_scale.factor();
        let (left, top, w, h) = self.canvas_region(width / scale, height / scale);
        let canvas = Rect::xywh(left * scale, top * scale, w * scale, h * scale);
        let sample = self.eyedropper.as_mut().expect("active sampler");
        if !canvas.contains(sample.point) {
            sample.pixels = None;
            if sample.confirm {
                self.eyedropper = None;
            }
            return Ok(None);
        }
        let viewport = self.editor_state.viewport;
        Ok(Some((
            f64::from((sample.point.x - canvas.origin.x - viewport.pan_x) / viewport.zoom),
            f64::from((sample.point.y - canvas.origin.y - viewport.pan_y) / viewport.zoom),
        )))
    }

    pub(crate) fn complete_eyedropper_patch(&mut self, pixels: Vec<u8>) -> Result<(), String> {
        self.validate_eyedropper()?;
        if pixels.len() != 9 * 9 * 4 {
            return Err("CanvasKit returned an invalid magnified RGBA8 region".into());
        }
        let sample = self.eyedropper.as_mut().expect("validated sampler");
        if sample.confirm {
            let offset = 40 * 4;
            let rgb = (
                f32::from(pixels[offset]) / 255.0,
                f32::from(pixels[offset + 1]) / 255.0,
                f32::from(pixels[offset + 2]) / 255.0,
            );
            let (h, s, v) = op_editor_core::color_picker::rgb_to_hsv(rgb);
            self.editor_state.color_picker_set_hsv(h, s, v);
            self.editor_state.close_color_picker();
            self.eyedropper = None;
        } else {
            sample.pixels = Some(pixels);
        }
        self.mark_dirty();
        Ok(())
    }

    pub(crate) fn fail_eyedropper(&mut self, message: String) {
        self.eyedropper = None;
        self.editor_state.editor_ui.show_toast(
            "colorPicker.sampleError",
            vec![("message".into(), message)],
            op_editor_core::editor_toast::EditorToastLevel::Warn,
            self.now_ms,
        );
        self.mark_dirty();
    }

    pub(crate) fn eyedropper_key(&mut self, key: &str, is_mod: bool) -> bool {
        if self.eyedropper.is_none() {
            return false;
        }
        if key == "Escape" || is_mod {
            self.eyedropper = None;
            self.mark_dirty();
        } else if key == "Enter" {
            self.eyedropper.as_mut().expect("active sampler").confirm = true;
            self.mark_dirty();
        }
        !is_mod
    }

    pub(super) fn eyedropper_pointer(&mut self, x: f32, y: f32, confirm: bool) -> bool {
        let Some(sample) = self.eyedropper.as_mut() else {
            return false;
        };
        let scale = self.editor_state.editor_ui.ui_scale.factor();
        sample.point = Point2D::new(x * scale, y * scale);
        sample.confirm |= confirm;
        sample.pixels = None;
        self.clear_hover_below_topmost_panel();
        self.mark_dirty();
        true
    }

    pub(super) fn paint_eyedropper(
        &self,
        backend: &mut dyn RenderBackend,
        width: f32,
        height: f32,
    ) {
        let Some(sample) = self.eyedropper.as_ref() else {
            return;
        };
        let Some(pixels) = sample.pixels.as_ref() else {
            return;
        };
        let scale = self.editor_state.editor_ui.ui_scale.factor();
        let x = (sample.point.x / scale + 18.0).clamp(8.0, (width - 96.0).max(8.0));
        let y = (sample.point.y / scale + 18.0).clamp(8.0, (height - 124.0).max(8.0));
        let rect = Rect::xywh(x, y, 88.0, 116.0);
        backend.fill_round_rect(rect, 6.0, self.theme.popover);
        backend.stroke_round_rect(rect, 6.0, self.theme.border, 1.0);
        for row in 0..9 {
            for col in 0..9 {
                let i = (row * 9 + col) * 4;
                let cell = Rect::xywh(
                    x + 8.0 + col as f32 * 8.0,
                    y + 8.0 + row as f32 * 8.0,
                    8.0,
                    8.0,
                );
                backend.fill_rect(
                    cell,
                    if (row + col) % 2 == 0 {
                        self.theme.muted
                    } else {
                        self.theme.border
                    },
                );
                backend.fill_rect(
                    cell,
                    Color {
                        r: f32::from(pixels[i]) / 255.0,
                        g: f32::from(pixels[i + 1]) / 255.0,
                        b: f32::from(pixels[i + 2]) / 255.0,
                        a: f32::from(pixels[i + 3]) / 255.0,
                    },
                );
            }
        }
        backend.stroke_rect(
            Rect::xywh(x + 39.0, y + 39.0, 10.0, 10.0),
            self.theme.popover,
            3.0,
        );
        backend.stroke_rect(
            Rect::xywh(x + 39.0, y + 39.0, 10.0, 10.0),
            self.theme.foreground,
            1.0,
        );
        for (text, baseline) in [
            (
                format!("#{:02x}{:02x}{:02x}", pixels[160], pixels[161], pixels[162]),
                94.0,
            ),
            (
                format!(
                    "Esc - {}",
                    op_i18n::translate(self.editor_state.editor_ui.locale, "common.cancel")
                ),
                109.0,
            ),
        ] {
            let text = op_editor_ui::widgets::text_metrics::fit_chrome(backend, &text, 72.0, 10.0);
            backend.draw_text(
                &TextLayout::single_run(
                    &text,
                    "system-ui",
                    10.0,
                    self.theme.foreground.to_jian(),
                    Point2D::ZERO,
                ),
                Point2D::new(x + 8.0, y + baseline),
            );
        }
    }
}
