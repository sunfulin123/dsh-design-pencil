//! Input and paint adapter for managed browser preview controls.

use super::WidgetHost;
use op_editor_ui::widgets::preview_toolbar::{
    PreviewControl, PreviewNavigationRow, PreviewToolbar,
};
use op_editor_ui::{Point2D, Rect};

impl WidgetHost {
    fn with_preview_toolbar<Result>(
        &self,
        action: impl FnOnce(&PreviewToolbar<'_>) -> Result,
    ) -> Result {
        let locale = self.editor_state.editor_ui.effective_locale();
        let current = self
            .preview
            .as_ref()
            .and_then(|session| session.framed_root())
            .map(|root| root.0);
        let active: Vec<_> = self
            .preview_browser
            .frames
            .iter()
            .filter(|frame| frame.page == self.preview_browser.page)
            .collect();
        let index = active
            .iter()
            .position(|frame| Some(&frame.id) == current.as_ref())
            .unwrap_or(0);
        let counter = format!("{} / {}", index + 1, active.len());
        let mut rows = Vec::new();
        let mut last_page = None;
        for (index, frame) in self.preview_browser.frames.iter().enumerate() {
            if last_page != Some(frame.page) {
                rows.push(PreviewNavigationRow {
                    label: &frame.page_label,
                    frame: None,
                    selected: false,
                });
                last_page = Some(frame.page);
            }
            rows.push(PreviewNavigationRow {
                label: &frame.name,
                frame: Some(index),
                selected: frame.page == self.preview_browser.page
                    && Some(&frame.id) == current.as_ref(),
            });
        }
        action(&PreviewToolbar {
            locale,
            counter: &counter,
            present: self.preview_browser.present,
            zoom_percent: (self.preview_screen_scale() * 100.0).round().max(1.0) as u32,
            list_open: self.preview_browser.list_open,
            hover: self.preview_browser.hover,
            can_go_back: index > 0,
            can_go_forward: index + 1 < active.len(),
            rows: &rows,
            list_scroll: self.preview_browser.list_scroll,
        })
    }

    pub(super) fn preview_controls_visible(&self) -> bool {
        !self.preview_browser.present
            || self.preview_browser.list_open
            || self.preview_browser.hover.is_some()
            || self
                .now_ms
                .saturating_sub(self.preview_browser.last_activity_ms)
                < 2000
    }

    pub(super) fn preview_stage_press(&mut self, x: f32, y: f32) -> bool {
        if self.preview_browser.present {
            return false;
        }
        let point = Point2D::new(x, y);
        self.preview_browser.pan_capture = Some((point, self.preview_browser.pan));
        self.preview_surface_capture = None;
        true
    }

    fn preview_screen_scale(&self) -> f32 {
        self.preview_browser.zoom.unwrap_or_else(|| {
            let Some(frame) = self.preview_device_frame.as_ref() else {
                return 1.0;
            };
            if !self.preview_browser.present {
                return frame.fit;
            }
            let size = self.preview_screen_size();
            frame.frame.size.x / size.0.max(1.0)
        })
    }

    pub(super) fn preview_controls_wake_deadline_ms(&self) -> Option<u64> {
        let deadline = self.preview_browser.last_activity_ms.saturating_add(2000);
        (self.managed_preview_active()
            && self.preview_browser.present
            && !self.preview_browser.list_open
            && self.preview_browser.hover.is_none()
            && self.now_ms < deadline)
            .then_some(deadline)
    }

    pub(super) fn paint_preview_browser_controls(
        &mut self,
        backend: &mut dyn op_editor_ui::RenderBackend,
        canvas: Rect,
    ) {
        if !self.preview_controls_visible() {
            return;
        }
        self.with_preview_toolbar(|toolbar| {
            toolbar.paint(
                &mut op_editor_ui::widgets::PaintCx { backend },
                canvas,
                &self.theme,
            )
        });
    }

    pub(super) fn preview_controls_press(
        &mut self,
        x: f32,
        y: f32,
        width: f32,
        height: f32,
    ) -> bool {
        if !self.managed_preview_active() {
            return false;
        }
        let visible = self.preview_controls_visible();
        self.preview_browser.last_activity_ms = self.now_ms;
        self.mark_dirty();
        if !visible {
            return false;
        }
        let canvas = self.preview_canvas_rect(width, height);
        let point = Point2D::new(x, y);
        let hit = self.with_preview_toolbar(|toolbar| toolbar.hit_test(canvas, point));
        let inside = hit.is_some()
            || !self.preview_browser.present && PreviewToolbar::zoom_rect(canvas).contains(point)
            || y < canvas.origin.y + PreviewToolbar::header_height(canvas)
            || self.preview_browser.list_open && PreviewToolbar::list_rect(canvas).contains(point)
            || (x - canvas.origin.x - canvas.size.x / 2.0).abs() < 88.0
                && y > canvas.origin.y + canvas.size.y
                    - if canvas.size.x < 600.0 { 88.0 } else { 48.0 };
        if inside {
            self.preview_browser.pressed = hit;
            self.preview_browser.hover = hit;
            self.preview_browser.controls_captured = true;
        }
        inside
    }

    pub(super) fn preview_controls_hover(
        &mut self,
        x: f32,
        y: f32,
        width: f32,
        height: f32,
    ) -> bool {
        if !self.managed_preview_active() {
            return false;
        }
        let was_visible = self.preview_controls_visible();
        self.preview_browser.last_activity_ms = self.now_ms;
        if let Some((start, pan)) = self.preview_browser.pan_capture {
            self.preview_pan_to(Point2D::new(pan.x + x - start.x, pan.y + y - start.y));
            return true;
        }
        let canvas = self.preview_canvas_rect(width, height);
        let hit = self.with_preview_toolbar(|toolbar| toolbar.hit_test(canvas, Point2D::new(x, y)));
        if self.preview_browser.hover != hit || !was_visible {
            self.preview_browser.hover = hit;
            self.mark_dirty();
        }
        hit.is_some()
            || self.preview_browser.controls_captured
            || self.preview_browser.list_open
                && PreviewToolbar::list_rect(canvas).contains(Point2D::new(x, y))
    }

    pub(super) fn preview_controls_release(&mut self) -> bool {
        if self.preview_browser.pan_capture.take().is_some() {
            // Repaint at full quality now that fast_interaction pan ended.
            self.mark_dirty();
            return true;
        }
        if !std::mem::take(&mut self.preview_browser.controls_captured) {
            return false;
        }
        let pressed = self.preview_browser.pressed.take();
        if pressed != self.preview_browser.hover {
            return true;
        }
        if let Some(control) = pressed {
            self.activate_preview_control(control);
        }
        self.mark_dirty();
        true
    }

    fn activate_preview_control(&mut self, control: PreviewControl) {
        match control {
            PreviewControl::List => {
                self.preview_browser.list_open = !self.preview_browser.list_open;
                self.recompute_device_frame(self.last_viewport_w, self.last_viewport_h);
            }
            PreviewControl::ZoomButton(button) => match button {
                op_editor_core::StatusBarButton::Search => self.preview_set_zoom(None),
                op_editor_core::StatusBarButton::ZoomOut => {
                    self.preview_zoom_by(-110.0);
                }
                op_editor_core::StatusBarButton::ZoomIn => {
                    self.preview_zoom_by(110.0);
                }
                _ => {}
            },
            PreviewControl::Present => self.set_preview_presentation(!self.preview_browser.present),
            PreviewControl::Exit => self.finish_exit_teardown(),
            PreviewControl::Previous => {
                self.preview_navigation_step(-1);
            }
            PreviewControl::Next => {
                self.preview_navigation_step(1);
            }
            PreviewControl::Frame(index) => {
                if let Some(frame) = self.preview_browser.frames.get(index) {
                    let (page, id) = (frame.page, frame.id.clone());
                    self.preview_go_to_frame(page, &id);
                }
            }
        }
    }

    pub(super) fn set_preview_presentation(&mut self, present: bool) {
        if self.preview_browser.present == present {
            return;
        }
        if present {
            self.preview_browser.inspection_position = Some((
                self.preview_browser.zoom,
                self.preview_browser.pan,
                self.preview_scroll_y,
            ));
        }
        self.preview_browser.present = present;
        self.preview_browser.list_open = false;
        if present {
            self.preview_browser.pan = Point2D::new(0.0, 0.0);
            self.preview_browser.zoom = None;
        }
        self.initialize_device_preview(self.last_viewport_w, self.last_viewport_h);
        if !present {
            if let Some((zoom, pan, scroll)) = self.preview_browser.inspection_position.take() {
                self.preview_browser.zoom = zoom;
                self.preview_browser.pan = pan;
                self.preview_scroll_y = scroll;
                self.recompute_device_frame(self.last_viewport_w, self.last_viewport_h);
            }
        }
        self.mark_dirty();
    }

    pub(crate) fn preview_zoom_by(&mut self, delta: f32) -> bool {
        if !self.managed_preview_active() {
            return false;
        }
        let current = self.preview_screen_scale();
        self.preview_set_zoom(Some(current * (delta * 0.002).exp()));
        true
    }

    pub(crate) fn preview_zoom_shortcut(&mut self, key: &str) -> bool {
        if !self.managed_preview_active() {
            return false;
        }
        match key {
            "+" | "=" => {
                self.preview_zoom_by(110.0);
            }
            "-" => {
                self.preview_zoom_by(-110.0);
            }
            "0" => self.preview_set_zoom(None),
            _ => return false,
        }
        true
    }

    pub(super) fn preview_scroll_by(&mut self, x: f32, y: f32, dx: f32, dy: f32) -> bool {
        let canvas = self.preview_canvas_rect(self.last_viewport_w, self.last_viewport_h);
        let point = Point2D::new(x, y);
        if self.preview_browser.list_open && PreviewToolbar::list_rect(canvas).contains(point) {
            let count = self.with_preview_toolbar(|toolbar| toolbar.rows.len());
            let max =
                (count as f32 * 30.0 + 16.0 - PreviewToolbar::list_rect(canvas).size.y).max(0.0);
            self.preview_browser.list_scroll =
                (self.preview_browser.list_scroll - dy).clamp(0.0, max);
            self.mark_dirty();
            return true;
        }
        let pan = self.preview_browser.pan;
        self.preview_pan_to(Point2D::new(pan.x + dx, pan.y + dy));
        true
    }

    fn preview_pan_to(&mut self, pan: Point2D) {
        self.preview_browser.pan = pan;
        self.recompute_device_frame(self.last_viewport_w, self.last_viewport_h);
        self.mark_dirty();
    }
}
