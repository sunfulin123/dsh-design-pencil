//! Shared geometry helpers for the web widget host.

use super::WidgetHost;
use op_editor_ui::widgets::host_canvas_geometry as canvas_geometry;
use op_editor_ui::widgets::host_overlay_geometry as overlay_geometry;
use op_editor_ui::widgets::{Toolbar, TopBar};
use op_editor_ui::{Point2D, Rect};

impl WidgetHost {
    pub(in crate::widget_host) fn sync_responsive_viewport(&mut self, width: f32, height: f32) {
        let class = op_editor_core::size_class::size_class(width, height);
        let ui = &mut self.editor_state.editor_ui;
        if ui.size_class == class {
            return;
        }
        if class.is_compact() {
            self.responsive_sidebar = Some(ui.sidebar_open);
            ui.sidebar_open = false;
            #[cfg(feature = "canvaskit")]
            {
                self.preview_browser.list_open = false;
            }
        } else if let Some(open) = self.responsive_sidebar.take() {
            ui.sidebar_open = open;
        }
        ui.size_class = class;
    }

    pub(in crate::widget_host) fn top_bar(&self) -> TopBar {
        TopBar::for_editor_ui(&self.editor_state.editor_ui).with_traffic_controls(false)
    }

    pub(in crate::widget_host) fn top_bar_rect(&self, viewport_w: f32) -> Rect {
        overlay_geometry::top_bar_rect(viewport_w)
    }

    /// Canvas region (logical px, viewport-relative). The math is
    /// single-sourced with the native host — see the coordinate invariant
    /// in `op_editor_ui::widgets::host_canvas_geometry`.
    pub(in crate::widget_host) fn canvas_region(
        &self,
        viewport_w: f32,
        viewport_h: f32,
    ) -> (f32, f32, f32, f32) {
        if self.editor_state.editor_ui.preview.mode {
            return (0.0, 0.0, viewport_w.max(0.0), viewport_h.max(0.0));
        }
        canvas_geometry::canvas_region(&self.editor_state, viewport_w, viewport_h)
    }

    pub(in crate::widget_host) fn over_canvas(
        &self,
        x: f32,
        y: f32,
        viewport_w: f32,
        viewport_h: f32,
    ) -> bool {
        let (left, top, width, height) = self.canvas_region(viewport_w, viewport_h);
        Rect::xywh(left, top, width, height).contains(Point2D::new(x, y))
    }

    /// `(anchor, viewport)` for the top-bar import dropdown — mirrors
    /// the native host so both chromes clamp the popup identically.
    /// `(anchor, viewport)` for the top-bar import dropdown — shared with
    /// the native host so both chromes clamp the popup identically.
    pub(in crate::widget_host) fn import_menu_anchor(
        &self,
        viewport_w: f32,
        viewport_h: f32,
    ) -> (Rect, Rect) {
        overlay_geometry::import_menu_anchor(&self.editor_state, viewport_w, viewport_h)
    }

    /// Close the import dropdown and clear its hover row.
    /// Close the import dropdown and clear its hover row.
    pub(in crate::widget_host) fn close_import_menu(&mut self) {
        overlay_geometry::close_import_menu(&mut self.editor_state);
    }

    pub(in crate::widget_host) fn locale_picker_rect(&self, viewport_w: f32) -> Rect {
        overlay_geometry::locale_picker_rect(&self.editor_state, viewport_w)
    }

    /// The rail rect the LAYERS tree gets — the whole rail, less the
    /// slides tab row when this document shows one. Every layer-tree
    /// caller goes through here, so the tab row can never shift the
    /// painted rows out from under their own click targets.
    pub(in crate::widget_host) fn layer_panel_rect(&self, viewport_h: f32) -> Rect {
        self.layers_content_rect(viewport_h)
    }

    pub(in crate::widget_host) fn toolbar_rect(&mut self, _viewport_w: f32) -> Rect {
        self.refresh_layout_scene();
        canvas_geometry::toolbar_rect_for(&self.editor_state)
    }

    /// Per-button hover wash on the floating toolbar. Mirrors
    /// `op_host_native::widget_host::geometry::update_toolbar_hover`.
    /// Returns `true` if the hover state changed.
    pub(in crate::widget_host) fn update_toolbar_hover(&mut self, x: f32, y: f32) -> bool {
        let rect = self.toolbar_rect(self.last_viewport_w);
        let toolbar = Toolbar::for_editor(&self.editor_state);
        let new_hover = toolbar
            .hit_test(rect, Point2D::new(x, y))
            .map(op_editor_ui::widgets::editor_state_ext::toolbar_hover);
        if new_hover != self.editor_state.editor_ui.toolbar_hover {
            self.editor_state.editor_ui.toolbar_hover = new_hover;
            self.mark_dirty();
            true
        } else {
            false
        }
    }

    /// Anchor / bezier-handle hit-test for the selected Path node.
    /// The math is shared with the native host — see
    /// `op_editor_ui::widgets::host_canvas_geometry::path_anchor_hit`.
    pub(in crate::widget_host) fn path_anchor_hit(
        &self,
        x: f32,
        y: f32,
        viewport_w: f32,
        viewport_h: f32,
    ) -> Option<(String, usize, super::AnchorDragTarget)> {
        canvas_geometry::path_anchor_hit(
            &self.editor_state,
            &self.layout_scene,
            x,
            y,
            viewport_w,
            viewport_h,
        )
    }
}

#[cfg(test)]
mod responsive_tests {
    use super::*;

    #[test]
    fn compact_sidebar_stays_open_only_after_an_explicit_toggle() {
        let mut host = WidgetHost::new();
        host.editor_state.editor_ui.sidebar_open = true;
        #[cfg(feature = "canvaskit")]
        {
            host.preview_browser.list_open = true;
        }
        host.sync_responsive_viewport(390.0, 844.0);
        assert!(!host.editor_state.editor_ui.sidebar_open);
        #[cfg(feature = "canvaskit")]
        {
            assert!(!host.preview_browser.list_open);
            host.preview_browser.list_open = true;
        }
        host.editor_state.editor_ui.sidebar_open = true;
        host.sync_responsive_viewport(390.0, 844.0);
        host.sync_responsive_viewport(320.0, 568.0);
        assert!(host.editor_state.editor_ui.sidebar_open);
        #[cfg(feature = "canvaskit")]
        {
            assert!(host.preview_browser.list_open);
        }
        host.editor_state.editor_ui.sidebar_open = false;
        host.sync_responsive_viewport(411.0, 838.0);
        assert!(!host.editor_state.editor_ui.sidebar_open);
        host.sync_responsive_viewport(1440.0, 900.0);
        assert!(host.editor_state.editor_ui.sidebar_open);
        host.sync_responsive_viewport(390.0, 844.0);
        assert!(!host.editor_state.editor_ui.sidebar_open);
    }

    #[test]
    fn shrinking_and_expanding_preserve_sidebar_preferences_document_and_camera() {
        for open in [false, true] {
            let mut host = WidgetHost::new();
            host.editor_state.editor_ui.sidebar_open = open;
            let document = serde_json::to_string(&host.editor_state.doc).unwrap();
            let camera = host.editor_state.viewport;
            host.sync_responsive_viewport(390.0, 844.0);
            assert!(host.editor_state.editor_ui.size_class.is_compact());
            assert!(!host.editor_state.editor_ui.sidebar_open);
            host.sync_responsive_viewport(320.0, 568.0);
            host.sync_responsive_viewport(744.0, 768.0);
            assert!(host.editor_state.editor_ui.size_class.is_medium());
            assert_eq!(host.editor_state.editor_ui.sidebar_open, open);
            host.sync_responsive_viewport(1440.0, 900.0);
            assert!(host.editor_state.editor_ui.size_class.is_expanded());
            assert_eq!(host.editor_state.editor_ui.sidebar_open, open);
            assert_eq!(
                serde_json::to_string(&host.editor_state.doc).unwrap(),
                document
            );
            assert_eq!(host.editor_state.viewport, camera);
        }
    }
}
