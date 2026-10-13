//! Input and paint adapter for managed browser preview controls.

use super::preview_browser::DESKTOP_SIZES;
use super::WidgetHost;
use op_editor_core::frame_presets::DEVICE_PRESETS;
use op_editor_ui::widgets::preview_toolbar::{
    PreviewControl, PreviewMenu, PreviewNavigationRow, PreviewToolbar,
};
use op_editor_ui::{Point2D, Rect};

impl WidgetHost {
    fn with_preview_toolbar<Result>(
        &self,
        action: impl FnOnce(&PreviewToolbar<'_>) -> Result,
    ) -> Result {
        let locale = self.editor_state.editor_ui.effective_locale();
        let no_frame = op_i18n::translate(locale, "preview.noFrame");
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
        let device = self
            .preview_browser
            .device
            .filter(|_| !self.preview_browser.present)
            .map(|index| DEVICE_PRESETS[index].name)
            .unwrap_or(no_frame);
        let size = self.preview_screen_size();
        let desktop_label = format!("{:.0} x {:.0}", size.0, size.1);
        let device = if self.browser_device_kind() == op_editor_core::PreviewDeviceKind::Phone {
            device
        } else {
            &desktop_label
        };
        let choices = match self.preview_browser.menu {
            Some(PreviewMenu::Device) => {
                if self.browser_device_kind() == op_editor_core::PreviewDeviceKind::Desktop {
                    let root_size = self
                        .preview
                        .as_ref()
                        .and_then(|session| session.framed_root())
                        .map(|(_, root)| root.size)
                        .unwrap_or(Point2D::new(0.0, 0.0));
                    let mut choices = vec![(
                        PreviewControl::DesktopOption(None),
                        format!("{:.0} x {:.0}", root_size.x, root_size.y),
                        self.preview_browser.desktop_size.is_none(),
                    )];
                    choices.extend(DESKTOP_SIZES.iter().enumerate().map(|(index, size)| {
                        (
                            PreviewControl::DesktopOption(Some(index)),
                            format!("{:.0} x {:.0}", size.0, size.1),
                            self.preview_browser.desktop_size == Some(index),
                        )
                    }));
                    choices
                } else {
                    DEVICE_PRESETS
                        .iter()
                        .enumerate()
                        .filter(|(_, preset)| preset.phone)
                        .map(|(index, preset)| {
                            (
                                PreviewControl::DeviceOption(Some(index)),
                                format!(
                                    "{}  {:.0} x {:.0}",
                                    preset.name, preset.width, preset.height
                                ),
                                self.preview_browser.device == Some(index),
                            )
                        })
                        .collect()
                }
            }
            None => Vec::new(),
        };
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
            device_label: device,
            device_label_width: self.preview_browser.device_label_width,
            counter: &counter,
            present: self.preview_browser.present,
            view: self.browser_device_kind(),
            zoom_percent: (self.preview_screen_scale() * 100.0).round().max(1.0) as u32,
            list_open: self.preview_browser.list_open,
            hover: self.preview_browser.hover,
            can_go_back: index > 0,
            can_go_forward: index + 1 < active.len(),
            menu: self.preview_browser.menu,
            menu_scroll: self.preview_browser.menu_scroll,
            choices: &choices,
            rows: &rows,
            list_scroll: self.preview_browser.list_scroll,
        })
    }

    pub(super) fn preview_controls_visible(&self) -> bool {
        !self.preview_browser.present
            || self.preview_browser.list_open
            || self.preview_browser.menu.is_some()
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
        let inside = self
            .preview_device_frame
            .as_ref()
            .is_some_and(|frame| frame.frame.contains(point));
        if self.space_pan
            || !inside
            || self.browser_device_kind() == op_editor_core::PreviewDeviceKind::Canvas
        {
            self.preview_browser.pan_capture = Some((point, self.preview_browser.pan));
            self.preview_surface_capture = None;
            return true;
        }
        false
    }

    fn preview_screen_scale(&self) -> f32 {
        self.preview_browser.zoom.unwrap_or_else(|| {
            let Some(frame) = self.preview_device_frame.as_ref() else {
                return 1.0;
            };
            if self.browser_device_kind() == op_editor_core::PreviewDeviceKind::Canvas
                && !self.preview_browser.present
            {
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
            && self.preview_browser.menu.is_none()
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
        self.preview_browser.device_label_width = self.with_preview_toolbar(|toolbar| {
            op_editor_ui::widgets::text_metrics::measure_chrome(backend, toolbar.device_label, 12.0)
        });
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
            || self.preview_browser.menu.is_some()
            || (x - canvas.origin.x - canvas.size.x / 2.0).abs() < 88.0
                && y > canvas.origin.y + canvas.size.y
                    - if canvas.size.x < 600.0 { 88.0 } else { 48.0 };
        if inside {
            if self.preview_browser.menu.is_some() && hit.is_none() {
                self.preview_browser.menu = None;
            }
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
        self.preview_browser.last_activity_ms = self.now_ms;
        if let Some((start, pan)) = self.preview_browser.pan_capture {
            self.preview_pan_to(Point2D::new(pan.x + x - start.x, pan.y + y - start.y));
            return true;
        }
        let canvas = self.preview_canvas_rect(width, height);
        let hit = self.with_preview_toolbar(|toolbar| toolbar.hit_test(canvas, Point2D::new(x, y)));
        self.preview_browser.hover = hit;
        self.mark_dirty();
        hit.is_some()
            || self.preview_browser.controls_captured
            || self.preview_browser.list_open
                && PreviewToolbar::list_rect(canvas).contains(Point2D::new(x, y))
    }

    pub(super) fn preview_controls_release(&mut self) -> bool {
        if self.preview_browser.pan_capture.take().is_some() {
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
            PreviewControl::Device => {
                let menu = PreviewMenu::Device;
                self.preview_browser.menu = if self.preview_browser.menu == Some(menu) {
                    None
                } else {
                    Some(menu)
                };
                self.preview_browser.menu_scroll = 0.0;
            }
            PreviewControl::Rotate => {
                self.preview_browser.preferences.landscape =
                    !self.preview_browser.preferences.landscape;
                self.preview_scroll_y = 0.0;
                self.preview_browser.pan = Point2D::new(0.0, 0.0);
                self.save_preview_preferences();
                self.recompute_device_frame(self.last_viewport_w, self.last_viewport_h);
            }
            PreviewControl::Canvas | PreviewControl::Desktop | PreviewControl::Phone => {
                let view = match control {
                    PreviewControl::Canvas => op_editor_core::PreviewDeviceKind::Canvas,
                    PreviewControl::Desktop => op_editor_core::PreviewDeviceKind::Desktop,
                    _ => op_editor_core::PreviewDeviceKind::Phone,
                };
                let previous = self.browser_device_kind() as usize;
                self.preview_browser.view_positions[previous] = Some((
                    self.preview_browser.zoom,
                    self.preview_browser.pan,
                    self.preview_scroll_y,
                ));
                self.preview_browser.view = Some(view);
                if control == PreviewControl::Phone
                    && !self
                        .preview_browser
                        .device
                        .is_some_and(|index| DEVICE_PRESETS[index].phone)
                {
                    self.preview_browser.device = Some(
                        DEVICE_PRESETS
                            .iter()
                            .position(|preset| preset.phone)
                            .unwrap(),
                    );
                }
                self.preview_browser.menu = None;
                let (zoom, pan, scroll) = self.preview_browser.view_positions[view as usize]
                    .unwrap_or((None, Point2D::new(0.0, 0.0), 0.0));
                self.preview_browser.zoom = zoom;
                self.preview_browser.pan = pan;
                self.initialize_device_preview(self.last_viewport_w, self.last_viewport_h);
                self.preview_scroll_y = scroll;
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
            PreviewControl::DeviceOption(device) => {
                self.preview_browser.menu = None;
                self.preview_pick_device(device);
            }
            PreviewControl::DesktopOption(size) => {
                if size.is_some_and(|index| index >= DESKTOP_SIZES.len()) {
                    return;
                }
                self.preview_browser.desktop_size = size;
                self.preview_browser.menu = None;
                self.preview_scroll_y = 0.0;
                self.preview_browser.pan = Point2D::new(0.0, 0.0);
                self.initialize_device_preview(self.last_viewport_w, self.last_viewport_h);
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
        self.preview_browser.menu = None;
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
        if let Some(menu) = self.preview_browser.menu {
            let count = self.with_preview_toolbar(|toolbar| toolbar.choices.len());
            let rect = PreviewToolbar::menu_rect(canvas, menu, count);
            if rect.contains(point) {
                let max = (count as f32 * 28.0 + 8.0 - rect.size.y).max(0.0);
                self.preview_browser.menu_scroll =
                    (self.preview_browser.menu_scroll - dy).clamp(0.0, max);
                self.mark_dirty();
                return true;
            }
        }
        if self.preview_browser.list_open && PreviewToolbar::list_rect(canvas).contains(point) {
            let count = self.with_preview_toolbar(|toolbar| toolbar.rows.len());
            let max =
                (count as f32 * 30.0 + 16.0 - PreviewToolbar::list_rect(canvas).size.y).max(0.0);
            self.preview_browser.list_scroll =
                (self.preview_browser.list_scroll - dy).clamp(0.0, max);
            self.mark_dirty();
            return true;
        }
        if self.browser_device_kind() != op_editor_core::PreviewDeviceKind::Canvas
            && self
                .preview_device_frame
                .as_ref()
                .is_some_and(|frame| frame.frame.contains(point))
        {
            self.apply_device_scroll(dy);
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
