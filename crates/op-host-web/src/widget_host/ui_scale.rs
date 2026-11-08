//! CSS-pixel public entry points into the scaled chrome coordinate space.

use super::WidgetHost;
use op_editor_ui::ui_scale::UiScaleSpace;
use op_editor_ui::{Point2D, RenderBackend};

impl WidgetHost {
    /// Layout and hit-testing share one root transform. Only the camera's
    /// temporary projection is inverse-scaled; authored nodes never change.
    pub(in crate::widget_host) fn with_ui_scale<R>(
        &mut self,
        action: impl FnOnce(&mut Self, f32) -> R,
    ) -> R {
        if self.ui_scale_active != 0.0 || self.editor_state.editor_ui.preview.mode {
            return action(self, 1.0);
        }
        let space = UiScaleSpace(self.editor_state.editor_ui.ui_scale);
        let scale = space.0.factor();
        let original = self.editor_state.viewport;
        let layout_camera = space.camera_to_layout(original);
        self.editor_state.viewport = layout_camera;
        self.ui_scale_active = scale;
        let result = action(self, scale);
        #[cfg(feature = "canvaskit")]
        if self.editor_state.editor_ui.preview.mode {
            if let Some(camera) = self.preview_editor_viewport.as_mut() {
                *camera = space.camera_to_css(*camera);
            }
        }
        // Preserve the exact camera bits on paint/hover/no-op, avoiding drift
        // from repeated divide/multiply at 110% and 125%.
        self.editor_state.viewport = if self.editor_state.viewport == layout_camera {
            original
        } else {
            space.camera_to_css(self.editor_state.viewport)
        };
        self.ui_scale_active = 0.0;
        result
    }

    pub fn paint_dyn(&mut self, backend: &mut dyn RenderBackend, w: f32, h: f32) {
        #[cfg(feature = "canvaskit")]
        self.settle_mode_transition();
        self.with_ui_scale(|host, scale| {
            backend.save();
            backend.scale(Point2D::splat(scale), Point2D::ZERO);
            host.last_viewport_w = w / scale;
            host.last_viewport_h = h / scale;
            host.paint_editor(backend, w / scale, h / scale);
            backend.restore();
        });
    }

    pub fn apply_press(&mut self, x: f32, y: f32, w: f32, h: f32) -> bool {
        self.with_ui_scale(|host, s| host.press_layout(x / s, y / s, w / s, h / s))
    }

    pub fn apply_right_press(&mut self, x: f32, y: f32, w: f32, h: f32) -> bool {
        self.with_ui_scale(|host, s| host.right_press_layout(x / s, y / s, w / s, h / s))
    }

    pub fn apply_click(&mut self, x: f32, y: f32, w: f32, h: f32) -> bool {
        self.with_ui_scale(|host, s| host.click_layout(x / s, y / s, w / s, h / s))
    }

    pub fn apply_cursor_move(&mut self, x: f32, y: f32) -> bool {
        self.with_ui_scale(|host, s| host.cursor_move_layout(x / s, y / s))
    }

    pub fn apply_key(&mut self, event: &op_editor_ui::KeyEvent) -> bool {
        self.with_ui_scale(|host, _| host.key_layout(event))
    }

    pub fn apply_release(&mut self) -> bool {
        self.with_ui_scale(|host, _| host.release_without_viewport_layout())
    }

    #[cfg(feature = "canvaskit")]
    pub fn fit_content_to_viewport(&mut self, w: f32, h: f32) {
        self.with_ui_scale(|host, s| host.zoom_to_fit(w / s, h / s));
    }

    #[cfg(feature = "canvaskit")]
    pub fn paste_figma_nodes(
        &mut self,
        nodes: Vec<jian_ops_schema::node::PenNode>,
        w: f32,
        h: f32,
    ) -> bool {
        self.with_ui_scale(|host, s| host.paste_figma_nodes_layout(nodes, w / s, h / s))
    }

    pub fn apply_release_with_viewport(&mut self, w: f32, h: f32) -> bool {
        self.with_ui_scale(|host, s| host.release_layout(w / s, h / s))
    }

    pub(crate) fn apply_wheel_with_canvas_delta(
        &mut self,
        x: f32,
        y: f32,
        dy: f32,
        zoom_delta: f32,
        w: f32,
        h: f32,
    ) -> bool {
        self.with_ui_scale(|host, s| {
            host.wheel_layout(x / s, y / s, dy / s, zoom_delta, w / s, h / s)
        })
    }

    pub fn apply_pan_gesture(&mut self, x: f32, y: f32, dx: f32, dy: f32, w: f32, h: f32) -> bool {
        self.with_ui_scale(|host, s| {
            host.pan_gesture_layout(x / s, y / s, dx / s, dy / s, w / s, h / s)
        })
    }

    pub fn apply_pan_press(&mut self, x: f32, y: f32, w: f32, h: f32) -> bool {
        self.with_ui_scale(|host, s| host.pan_press_layout(x / s, y / s, w / s, h / s))
    }

    /// Keep the shared viewport's zoom limits and sensitivity in CSS units.
    pub(in crate::widget_host) fn zoom_at_layout(&mut self, cursor: Point2D, delta: f32) {
        let scale = self.ui_scale_active.max(1.0);
        let space = UiScaleSpace(self.editor_state.editor_ui.ui_scale);
        if scale == 1.0 {
            self.editor_state.viewport.zoom_at(cursor, delta);
        } else {
            let mut camera = space.camera_to_css(self.editor_state.viewport);
            camera.zoom_at(cursor * scale, delta);
            self.editor_state.viewport = space.camera_to_layout(camera);
        }
    }

    pub(in crate::widget_host) fn fit_camera_layout(
        &mut self,
        bounds: op_editor_ui::Rect,
        width: f32,
        height: f32,
        padding: f32,
    ) {
        let scale = self.ui_scale_active.max(1.0);
        let space = UiScaleSpace(self.editor_state.editor_ui.ui_scale);
        let mut camera = if scale == 1.0 {
            self.editor_state.viewport
        } else {
            space.camera_to_css(self.editor_state.viewport)
        };
        camera.fit_to_with_max_zoom(bounds, width * scale, height * scale, padding, 1.0);
        self.editor_state.viewport = if scale == 1.0 {
            camera
        } else {
            space.camera_to_layout(camera)
        };
    }
}
