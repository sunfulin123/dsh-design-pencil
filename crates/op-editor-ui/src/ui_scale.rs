//! Root chrome coordinates. A scale is not a document or camera zoom.

use op_editor_core::editor_ui_state::ui_scale::UiScale;
use op_editor_core::Viewport;

#[derive(Clone, Copy)]
pub struct UiScaleSpace(pub UiScale);

impl UiScaleSpace {
    pub fn camera_to_layout(self, camera: Viewport) -> Viewport {
        let scale = self.0.factor();
        Viewport {
            pan_x: camera.pan_x / scale,
            pan_y: camera.pan_y / scale,
            zoom: camera.zoom / scale,
        }
    }

    pub fn camera_to_css(self, camera: Viewport) -> Viewport {
        let scale = self.0.factor();
        Viewport {
            pan_x: camera.pan_x * scale,
            pan_y: camera.pan_y * scale,
            zoom: camera.zoom * scale,
        }
    }
}
