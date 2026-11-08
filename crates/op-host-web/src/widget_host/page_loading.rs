//! Loading cover for switches to heavy pages.
//!
//! Building a page's render scene blocks the main thread; for a page with
//! many layers that is seconds. The first frame after such a switch paints a
//! loading cover over the canvas and defers the rebuild to the next frame, so
//! the switch shows "loading" instead of a frozen previous page.

use super::WidgetHost;
use op_editor_ui::widgets::editor_state_ext::theme_for;
use op_editor_ui::widgets::page_loading_overlay::{page_load_is_heavy, PageLoadingOverlay};
use op_editor_ui::widgets::PaintCx;
use op_editor_ui::{Rect, RenderBackend};

impl WidgetHost {
    /// The active page changed to a heavy page whose cover has not been
    /// painted yet: every scene rebuild waits for that cover frame.
    pub(in crate::widget_host) fn page_switch_awaits_cover(&self) -> bool {
        let target = self.editor_state.ui.active_page_index;
        target != self.scene_page_index
            && self.page_loading_cover != Some(target)
            && !self.scene_cache.has_scene_for(&self.editor_state)
            && page_load_is_heavy(self.editor_state.active_children())
    }

    /// Decide this frame's scene work: `true` paints the loading cover and
    /// skips the rebuild (scheduling the next frame to do it); `false`
    /// rebuilds the scene as usual.
    pub(in crate::widget_host) fn cover_page_switch_this_frame(&mut self) -> bool {
        self.page_cover_frame = false;
        let target = self.editor_state.ui.active_page_index;
        let cover = self.editor_state_dirty && self.page_switch_awaits_cover();
        if cover {
            self.page_loading_cover = Some(target);
            self.page_cover_frame = true;
            #[cfg(feature = "canvaskit")]
            crate::repaint_coalescer::request();
        } else if target == self.scene_page_index {
            self.page_loading_cover = None;
        }
        cover
    }

    /// Apply a page switch's deferred "fit to content" once its scene exists.
    pub(in crate::widget_host) fn apply_pending_page_fit(&mut self) {
        if self.page_cover_frame || self.editor_state.ui.active_page_index != self.scene_page_index
        {
            return;
        }
        if let Some((width, height)) = self.pending_page_fit.take() {
            self.zoom_to_fit(width, height);
        }
        if self.pending_offscreen_fit && !self.editor_state_dirty {
            self.fit_if_content_offscreen();
        }
    }

    pub(in crate::widget_host) fn paint_page_loading_cover(
        &self,
        backend: &mut dyn RenderBackend,
        canvas: Rect,
    ) {
        let overlay = PageLoadingOverlay {
            theme: theme_for(&self.editor_state.editor_ui),
            locale: self.editor_state.editor_ui.effective_locale(),
        };
        let mut cx = PaintCx { backend };
        overlay.paint(&mut cx, canvas, self.now_ms);
    }
}
