//! Preview video placement for the CanvasKit DOM media layer.
//!
//! The preview session owns scene-space video metadata. This host module only
//! maps those node rects through the active Canvas, slideshow, or device-frame
//! presentation so `video_overlay` can reconcile CSS positions after paint.

use super::WidgetHost;
use crate::video_overlay::{scene_video_rect, PreviewVideoOverlay, VideoOverlayPlacement};
use op_editor_ui::layout_scene::SceneNode;
use op_editor_ui::Point2D;

impl WidgetHost {
    /// Build the current preview video placements in logical host-screen
    /// coordinates. A missing preview session intentionally returns an empty
    /// list, which removes any stale DOM videos on the next repaint.
    pub(crate) fn preview_video_overlay_placements(
        &self,
        viewport_w: f32,
        viewport_h: f32,
    ) -> Vec<VideoOverlayPlacement> {
        let Some(session) = self.preview.as_ref() else {
            return Vec::new();
        };

        if self.device_mode_active() {
            return self.device_video_placements(session);
        }

        let canvas = self.preview_canvas_rect(viewport_w, viewport_h);
        let viewport = self.editor_state.viewport;
        let origin = Point2D::new(
            canvas.origin.x + viewport.pan_x,
            canvas.origin.y + viewport.pan_y,
        );
        let root = if self.preview_slideshow_active() {
            self.editor_state
                .preview_slideshow()
                .and_then(|slideshow| slideshow.current_board())
        } else {
            None
        };
        self.collect_scene_videos(root)
            .into_iter()
            .map(|video| VideoOverlayPlacement {
                node_id: video.node_id.clone(),
                screen_rect: scene_video_rect(video.scene_rect, origin, viewport.zoom),
                video,
            })
            .collect()
    }

    fn device_video_placements(
        &self,
        session: &crate::preview_host::PreviewSession,
    ) -> Vec<VideoOverlayPlacement> {
        let Some(frame) = self.preview_device_frame.as_ref() else {
            return Vec::new();
        };
        let Some((root_id, _)) = session.framed_root() else {
            return Vec::new();
        };
        self.collect_scene_videos(Some(root_id.as_str()))
            .into_iter()
            .map(|video| VideoOverlayPlacement {
                node_id: video.node_id.clone(),
                screen_rect: scene_video_rect(
                    video.scene_rect,
                    Point2D::new(
                        frame.content_origin.x,
                        frame.content_origin.y - self.preview_scroll_y * frame.fit,
                    ),
                    frame.fit,
                ),
                video,
            })
            .collect()
    }

    fn collect_scene_videos(&self, root_id: Option<&str>) -> Vec<PreviewVideoOverlay> {
        let Some(page) = self.preview_active_scene_page() else {
            return Vec::new();
        };
        let mut out = Vec::new();
        fn walk(nodes: &[SceneNode], out: &mut Vec<PreviewVideoOverlay>) {
            for n in nodes {
                if n.hidden {
                    continue;
                }
                if let Some(video) = n.video.as_ref() {
                    out.push(PreviewVideoOverlay {
                        node_id: n.id.clone(),
                        scene_rect: n.bounds,
                        poster: n.image_src.as_ref().map(|s| s.to_string()),
                        video: video.clone(),
                    });
                }
                walk(&n.children, out);
            }
        }
        if let Some(id) = root_id {
            if let Some(root) =
                crate::preview_host::paint::find_screen_scene_node(&page.children, id)
            {
                walk(std::slice::from_ref(root), &mut out);
            }
        } else {
            walk(&page.children, &mut out);
        }
        out
    }
}
