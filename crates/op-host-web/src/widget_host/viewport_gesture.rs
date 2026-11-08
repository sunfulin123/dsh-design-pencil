//! Pan / zoom gesture tracking.
//!
//! A gesture lasts until the camera has been still for [`SETTLE_MS`]. While
//! it runs, per-frame work that does not depend on the camera (inspector,
//! accessibility mirror) is reused, and the tile renderer draws power-of-two
//! zoom levels; once the camera settles it rasterizes the exact zoom so
//! text is pixel-crisp.

use std::rc::Rc;

use op_editor_ui::widgets::PropertyPanel;

use super::WidgetHost;

/// Camera stillness after which a gesture is over.
pub(crate) const SETTLE_MS: u64 = 120;

#[derive(Clone, Copy, Debug, PartialEq)]
pub(crate) struct Camera {
    pub pan_x: f32,
    pub pan_y: f32,
    pub zoom: f32,
}

#[derive(Default)]
pub(crate) struct ViewportGesture {
    last_camera: Option<Camera>,
    last_change_ms: Option<u64>,
    last_zoom_change_ms: Option<u64>,
    /// Bumped by every `mark_dirty`; inspector reuse is keyed on it.
    pub(crate) content_epoch: u64,
    active: bool,
    zooming: bool,
    /// Property panel reused across gesture frames: (epoch, scene generation).
    panel: Option<(u64, u64, Rc<PropertyPanel>)>,
}

impl ViewportGesture {
    /// Records this frame's camera; returns whether a gesture is in progress.
    pub(crate) fn observe(&mut self, camera: Camera, now_ms: u64) -> bool {
        if let Some(last) = self.last_camera {
            if last != camera {
                self.last_change_ms = Some(now_ms);
            }
            if last.zoom != camera.zoom {
                self.last_zoom_change_ms = Some(now_ms);
            }
        }
        self.last_camera = Some(camera);
        let recent = |at: Option<u64>| at.is_some_and(|t| now_ms.saturating_sub(t) < SETTLE_MS);
        self.active = recent(self.last_change_ms);
        self.zooming = recent(self.last_zoom_change_ms);
        self.active
    }

    /// True while the camera is still moving.
    pub(crate) fn active(&self) -> bool {
        self.active
    }

    /// True while the zoom is still changing.
    pub(crate) fn zooming(&self) -> bool {
        self.zooming
    }
}

impl WidgetHost {
    /// The inspector for this frame. Camera-only gesture frames reuse the
    /// previous build when no content or scene change happened since; the
    /// settle frame always rebuilds, so nothing stays stale past a gesture.
    pub(in crate::widget_host) fn property_panel_for_frame(&mut self) -> Option<Rc<PropertyPanel>> {
        let epoch = self.viewport_gesture.content_epoch;
        let generation = self.scene_generation;
        if self.viewport_gesture.active {
            if let Some((e, g, panel)) = &self.viewport_gesture.panel {
                if *e == epoch && *g == generation {
                    return Some(Rc::clone(panel));
                }
            }
        }
        let panel = PropertyPanel::for_selection_at_with_scene(
            &self.editor_state,
            &self.layout_scene,
            self.now_ms,
        )
        .map(Rc::new);
        self.viewport_gesture.panel = panel.clone().map(|panel| (epoch, generation, panel));
        panel
    }

    pub(in crate::widget_host) fn observe_camera(&mut self) -> bool {
        let viewport = self.editor_state.viewport;
        let camera = Camera {
            pan_x: viewport.pan_x,
            pan_y: viewport.pan_y,
            zoom: viewport.zoom,
        };
        let active = self.viewport_gesture.observe(camera, self.now_ms);
        if active {
            // Keep frames coming until the camera settles so the settle-frame
            // work (inspector, exact-zoom tiles) runs without another event.
            #[cfg(feature = "canvaskit")]
            crate::repaint_coalescer::request();
        }
        active
    }
}

#[cfg(test)]
#[path = "viewport_gesture_tests.rs"]
mod tests;
