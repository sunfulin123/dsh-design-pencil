//! Thin native dispatch arm for the shared Scene Template Center press flow.

use op_editor_ui::widgets::press_flow;
use op_editor_ui::Point2D;

use super::WidgetHostNative;

impl WidgetHostNative {
    pub(in crate::widget_host) fn dispatch_asset_center_press(
        &mut self,
        x: f32,
        y: f32,
        viewport_width: f32,
        viewport_height: f32,
    ) -> bool {
        let Some(panel_rect) = self.asset_center_panel_rect(viewport_width, viewport_height)
        else {
            return false;
        };
        let Some(changed) = press_flow::press_asset_center(
            &mut self.editor_state,
            panel_rect,
            Point2D::new(x, y),
            self.now_ms,
        ) else {
            return false;
        };
        if changed {
            self.mark_dirty();
        }
        true
    }
}

#[cfg(test)]
#[path = "asset_center_generate_tests.rs"]
mod asset_center_generate_tests;
