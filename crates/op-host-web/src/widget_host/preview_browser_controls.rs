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
        let title = active
            .get(index)
            .map(|f| f.name.as_str())
            .unwrap_or("Present");
        let scale_label = self.preview_browser.scale_mode.label();
        let counter = format!("{} / {}", index + 1, active.len());
        let viewport = self.preview_viewport();
        let flows = self
            .preview
            .as_ref()
            .map(|s| s.player.flows())
            .unwrap_or(&[]);
        let active_flow_idx = self
            .preview
            .as_ref()
            .and_then(|s| s.player.active_flow_index);
        let mut rows = Vec::new();
        if !flows.is_empty() {
            rows.push(PreviewNavigationRow {
                label: "Flows",
                frame: None,
                flow: None,
                selected: false,
            });
            for (f_idx, flow) in flows.iter().enumerate() {
                rows.push(PreviewNavigationRow {
                    label: &flow.name,
                    frame: None,
                    flow: Some(f_idx),
                    selected: active_flow_idx == Some(f_idx),
                });
            }
        }
        let mut last_group: Option<(&str, Option<&str>)> = None;
        for (index, frame) in self.preview_browser.frames.iter().enumerate() {
            let group = (frame.page_label.as_str(), frame.section_name.as_deref());
            if last_group != Some(group) {
                rows.push(PreviewNavigationRow {
                    label: frame.section_name.as_deref().unwrap_or(&frame.page_label),
                    frame: None,
                    flow: None,
                    selected: false,
                });
                last_group = Some(group);
            }
            rows.push(PreviewNavigationRow {
                label: &frame.name,
                frame: Some(index),
                flow: None,
                selected: frame.page == self.preview_browser.page
                    && Some(&frame.id) == current.as_ref(),
            });
        }
        action(&PreviewToolbar {
            locale,
            title,
            scale_label,
            counter: &counter,
            present: self.preview_browser.present,
            zoom_percent: (viewport.scale * 100.0).round().max(1.0) as u32,
            can_zoom_out: viewport.can_zoom_out(),
            can_zoom_in: viewport.can_zoom_in(),
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
            || !self.preview_browser.present
                && PreviewToolbar::bottom_bar_rect(canvas).contains(point)
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
            PreviewControl::Restart => {
                if let Some(session) = self.preview.as_mut() {
                    session.player.restart(self.now_ms);
                    let entry = session.player.current_screen_id.clone();
                    let page = session.player.current_page_index();
                    let _ = self.preview_go_to_frame(page, &entry);
                }
            }
            PreviewControl::ScaleMode => {
                self.preview_cycle_scale_mode();
            }
            PreviewControl::Flow(flow_index) => {
                if let Some(session) = self.preview.as_mut() {
                    if session.player.select_flow(flow_index, self.now_ms) {
                        let entry = session.player.current_screen_id.clone();
                        let page = session.player.current_page_index();
                        let _ = self.preview_go_to_frame(page, &entry);
                    }
                }
            }
            PreviewControl::ZoomButton(button) => match button {
                op_editor_core::StatusBarButton::Search => self.preview_fit(),
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
                self.preview_browser.zoom_factor,
                self.preview_browser.scroll,
            ));
        }
        self.preview_browser.present = present;
        self.preview_browser.list_open = false;
        if present {
            self.preview_reset_view();
        }
        self.initialize_device_preview(self.last_viewport_w, self.last_viewport_h);
        if !present {
            if let Some((zoom_factor, scroll)) = self.preview_browser.inspection_position.take() {
                self.preview_browser.zoom_factor = zoom_factor;
                self.preview_browser.scroll = scroll;
                self.recompute_device_frame(self.last_viewport_w, self.last_viewport_h);
            }
        }
        self.mark_dirty();
    }

    /// Multiplicative zoom from a wheel/pinch delta, anchored at `anchor`
    /// (host pixels) or the stage centre.
    pub(crate) fn preview_zoom_by_at(&mut self, delta: f32, anchor: Option<Point2D>) -> bool {
        if !self.managed_preview_active() {
            return false;
        }
        let factor = self.preview_viewport().zoom_factor * (delta * 0.002).exp();
        self.preview_zoom_to(factor, anchor);
        true
    }

    pub(crate) fn preview_zoom_by(&mut self, delta: f32) -> bool {
        self.preview_zoom_by_at(delta, None)
    }

    fn preview_fit(&mut self) {
        self.preview_reset_view();
        self.recompute_device_frame(self.last_viewport_w, self.last_viewport_h);
        self.mark_dirty();
    }

    fn preview_cycle_scale_mode(&mut self) {
        self.preview_browser.scale_mode = self.preview_browser.scale_mode.next();
        self.preview_browser.preferences.scale_mode = Some(self.preview_browser.scale_mode);
        self.save_preview_preferences();
        self.preview_fit();
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
            "0" => self.preview_fit(),
            _ => return false,
        }
        true
    }

    /// Figma Present single-key shortcuts: Space/N next, R restart, Z cycle
    /// the scale mode. Arrow keys are handled by `preview_dispatch_key`.
    pub fn preview_present_shortcut(&mut self, key: &str) -> bool {
        if !self.managed_preview_active() {
            return false;
        }
        match key {
            " " | "n" | "N" => {
                self.preview_navigation_step(1);
            }
            "r" | "R" => self.activate_preview_control(PreviewControl::Restart),
            "z" | "Z" => self.preview_cycle_scale_mode(),
            _ => return false,
        }
        self.preview_browser.last_activity_ms = self.now_ms;
        self.mark_dirty();
        true
    }

    /// Wheel/trackpad scroll: the side list scrolls when hovered; otherwise
    /// the stage scrolls within the scaled screen's bounds (never panned
    /// off the edge, and not at all on axes that already fit).
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
        let before = self.preview_viewport();
        self.preview_browser.scroll = Point2D::new(before.scroll.0 - dx, before.scroll.1 - dy);
        let after = self.preview_viewport();
        self.preview_browser.scroll = Point2D::new(after.scroll.0, after.scroll.1);
        if after.scroll != before.scroll {
            self.recompute_device_frame(self.last_viewport_w, self.last_viewport_h);
            self.mark_dirty();
        }
        true
    }
}
