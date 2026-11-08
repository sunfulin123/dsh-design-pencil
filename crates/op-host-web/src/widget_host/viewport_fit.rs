//! Active-page viewport fitting shared by page-navigation entry points.

use super::WidgetHost;
use op_editor_core::Viewport;
use op_editor_ui::Rect;

/// Whether no part of `content` (document space) is inside the visible
/// `canvas_w × canvas_h` canvas under `view`.
pub(crate) fn content_fully_offscreen(
    view: Viewport,
    content: Rect,
    canvas_w: f32,
    canvas_h: f32,
) -> bool {
    if canvas_w <= 0.0 || canvas_h <= 0.0 || view.zoom <= 0.0 {
        return false;
    }
    let left = content.origin.x * view.zoom + view.pan_x;
    let top = content.origin.y * view.zoom + view.pan_y;
    let right = left + content.size.x.max(0.0) * view.zoom;
    let bottom = top + content.size.y.max(0.0) * view.zoom;
    right <= 0.0 || bottom <= 0.0 || left >= canvas_w || top >= canvas_h
}

/// Whether none of the top-level `nodes` (document space) is visible, i.e.
/// the camera sits in empty space even if it is inside the content's union.
pub(crate) fn all_nodes_offscreen(
    view: Viewport,
    nodes: impl IntoIterator<Item = Rect>,
    canvas_w: f32,
    canvas_h: f32,
) -> bool {
    let mut any = false;
    for node in nodes {
        any = true;
        if !content_fully_offscreen(view, node, canvas_w, canvas_h) {
            return false;
        }
    }
    any && canvas_w > 0.0 && canvas_h > 0.0 && view.zoom > 0.0
}

impl WidgetHost {
    /// Rebuild the newly-active page scene before deriving its fit. Page
    /// navigation must use this helper instead of calling `zoom_to_fit`
    /// immediately after mutating `editor_state`, otherwise the lazy scene
    /// gate can still expose the previously painted page's bounds.
    pub(in crate::widget_host) fn fit_active_page_after_switch(
        &mut self,
        viewport_w: f32,
        viewport_h: f32,
    ) {
        // Fitting needs the new page's scene; building it here would block
        // the click. The paint pass fits right after the (deferred) build.
        self.pending_page_fit = Some((viewport_w, viewport_h));
        self.mark_dirty();
        #[cfg(feature = "canvaskit")]
        crate::repaint_coalescer::request();
    }

    /// Frame the active page when it has content but none of it is
    /// visible — e.g. an import that kept Figma page coordinates, an AI
    /// write far from the camera, or a restored camera that sits in the
    /// empty space between boards. A partially visible page keeps its
    /// camera so routine edits never jump the view. Returns whether the
    /// camera moved.
    pub(crate) fn fit_if_content_offscreen(&mut self) -> bool {
        let (vw, vh) = (self.last_viewport_w, self.last_viewport_h);
        if vw <= 0.0 || vh <= 0.0 {
            return false;
        }
        self.refresh_layout_scene();
        if self.editor_state_dirty
            || self.layout_scene.active_page_index != self.editor_state.ui.active_page_index
        {
            // A heavy page builds behind the loading cover; check once it exists.
            self.pending_offscreen_fit = true;
            return false;
        }
        self.pending_offscreen_fit = false;
        let Some(bounds) = self.layout_scene.content_bounds() else {
            return false;
        };
        let (_, _, width, height) = self.canvas_region(vw, vh);
        let tops = self
            .layout_scene
            .active_page()
            .map(|page| {
                page.children
                    .iter()
                    .map(|node| node.aggregate_bounds())
                    .collect::<Vec<_>>()
            })
            .unwrap_or_default();
        if !all_nodes_offscreen(self.editor_state.viewport, tops, width, height) {
            return false;
        }
        self.fit_camera_layout(bounds, width, height, 64.0);
        self.mark_dirty();
        true
    }
}

#[cfg(test)]
mod tests {
    use super::{all_nodes_offscreen, content_fully_offscreen};
    use op_editor_core::Viewport;
    use op_editor_ui::{Point2D, Rect};

    fn rect(x: f32, y: f32, w: f32, h: f32) -> Rect {
        Rect {
            origin: Point2D::new(x, y),
            size: Point2D::new(w, h),
        }
    }

    #[test]
    fn far_away_imports_are_offscreen_but_partial_overlap_is_not() {
        let view = Viewport::IDENTITY;
        assert!(content_fully_offscreen(
            view,
            rect(5568.0, 11947.0, 450.0, 1222.0),
            1200.0,
            800.0
        ));
        assert!(!content_fully_offscreen(
            view,
            rect(1100.0, 700.0, 450.0, 400.0),
            1200.0,
            800.0
        ));
        assert!(content_fully_offscreen(
            view,
            rect(-500.0, 0.0, 400.0, 100.0),
            1200.0,
            800.0
        ));
        let zoomed_out = Viewport {
            zoom: 0.05,
            ..Viewport::IDENTITY
        };
        assert!(!content_fully_offscreen(
            zoomed_out,
            rect(5568.0, 11947.0, 450.0, 1222.0),
            1200.0,
            800.0
        ));
        assert!(!content_fully_offscreen(
            view,
            rect(0.0, 0.0, 10.0, 10.0),
            0.0,
            800.0
        ));
    }

    #[test]
    fn a_camera_between_boards_counts_as_offscreen() {
        let view = Viewport::IDENTITY;
        let boards = [
            rect(-2000.0, 0.0, 500.0, 500.0),
            rect(3000.0, 0.0, 500.0, 500.0),
        ];
        // The union spans the viewport, yet neither board is visible.
        assert!(all_nodes_offscreen(view, boards, 1200.0, 800.0));
        let visible = [
            rect(-2000.0, 0.0, 500.0, 500.0),
            rect(1000.0, 100.0, 500.0, 500.0),
        ];
        assert!(!all_nodes_offscreen(view, visible, 1200.0, 800.0));
        assert!(
            !all_nodes_offscreen(view, [], 1200.0, 800.0),
            "empty pages keep their camera"
        );
    }
}
