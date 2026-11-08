//! Host glue for the tile renderer: chooses tiles or a live walk for the
//! canvas region, keeps the tile cache in step with scene rebuilds, and
//! rasterizes queued tiles after each presented frame.

use op_editor_ui::layout_scene::LayoutScene;
use op_editor_ui::widgets::canvas_tiles::{changed_regions, pow2_at_least, TileView};
use op_editor_ui::widgets::{CanvasViewport, PaintCx, Widget};
use op_editor_ui::{Point2D, Rect, RenderBackend};

use super::canvas_tiles::EFFECT_MARGIN;
use super::WidgetHost;

/// Raster budgets per frame (ms): idle, and idle while visible tiles are
/// still missing or stale. Mid-gesture nothing is rasterized unless the view
/// is uncovered: one slow tile would stall the frame.
const IDLE_BUDGET_MS: f64 = 6.0;
const GESTURE_BUDGET_MS: f64 = 3.0;
/// Device pixels per document unit above which tiles are cheap to raster.
const CHEAP_TILE_SCALE: f32 = 0.5;
const BACKLOG_BUDGET_MS: f64 = 10.0;

impl WidgetHost {
    /// Host states that change the painted content every frame.
    fn live_content_required(&self) -> bool {
        self.node_drag.is_some()
            || self.handle_drag.is_some()
            || self.create_drag.is_some()
            || self.path_anchor_drag.is_some()
            || self.image_crop_drag.is_some()
            || self.image_adjustment_drag.is_some()
            || self.effect_radius_drag.is_some()
    }

    /// Paints the design canvas: the loading cover, retained tiles plus
    /// live chrome, or (while tiles are unavailable) a live scene walk.
    pub(in crate::widget_host) fn paint_canvas_region(
        &mut self,
        backend: &mut dyn RenderBackend,
        canvas_rect: Rect,
        page_loading_cover: bool,
    ) {
        if page_loading_cover {
            self.paint_page_loading_cover(backend, canvas_rect);
            return;
        }
        let in_gesture = self.observe_camera();
        let mut transition_scene = None;
        if let Some(transition) = self.layout_transition.as_ref() {
            if transition.is_active(self.now_ms) {
                let mut scene = self.layout_scene.clone();
                transition.apply_to_scene(&mut scene, self.now_ms);
                transition_scene = Some(scene);
            }
        }
        let tiles_allowed = transition_scene.is_none() && !self.live_content_required();
        if tiles_allowed {
            self.ensure_tiles_owner();
        }
        let fast_interaction = self.canvas_fast_interaction_active() || in_gesture;
        let node_drag_active = self.node_drag.as_ref().is_some_and(|drag| drag.moved);
        let node_drag_overlay = self.node_drag_overlay_for_paint();
        let viewport = self.editor_state.viewport;
        let device_per_px = backend.dpi_scale() * self.ui_scale_active.max(1.0);
        let device_scale = viewport.zoom * device_per_px;
        let target = if self.viewport_gesture.zooming() {
            pow2_at_least(device_scale)
        } else {
            device_scale
        };
        let view = TileView {
            canvas: canvas_rect,
            pan: Point2D::new(viewport.pan_x, viewport.pan_y),
            zoom: viewport.zoom,
        };
        let epoch = op_editor_ui::raster_epoch::current();

        let use_tiles = tiles_allowed && self.canvas_tiles.supported();
        let tiles = &mut self.canvas_tiles;
        let perf = &mut self.frame_perf;
        let mut layer = move |cx: &mut PaintCx<'_>, _rect: Rect| {
            perf.mark("canvas-bg");
            tiles.note_raster_epoch(epoch);
            let drawn = tiles.composite(cx, view, target);
            perf.mark("tiles");
            drawn
        };
        let canvas_scene = transition_scene.as_ref().unwrap_or(&self.layout_scene);
        let mut canvas = CanvasViewport::from_editor(&self.editor_state, canvas_scene);
        canvas.now_ms = self.now_ms;
        canvas.fast_interaction = fast_interaction;
        canvas.set_node_drag_active(node_drag_active);
        canvas.set_node_drag_overlay(node_drag_overlay);
        if use_tiles && canvas.content_is_static() {
            canvas.content_layer.set(Some(&mut layer));
        }
        canvas.paint(&mut PaintCx { backend }, canvas_rect);
    }

    /// Re-homes the tile cache when the scene belongs to another document
    /// or page than the tiles do.
    fn ensure_tiles_owner(&mut self) {
        let owner = (
            self.editor_state.document_generation(),
            self.layout_scene.active_page_index,
        );
        if self.canvas_tiles.owner() == Some(owner) {
            return;
        }
        if let Some(page) = self.layout_scene.active_page() {
            self.canvas_tiles.reset(owner.0, owner.1, page);
        }
    }

    /// Updates retained tiles for a freshly installed scene: diff against the
    /// replaced scene of the same page when there is one, otherwise redraw
    /// (same page) or drop (another page or document) every tile.
    pub(in crate::widget_host) fn sync_tiles_after_scene(&mut self, replaced: Option<LayoutScene>) {
        let generation = self.editor_state.document_generation();
        let index = self.layout_scene.active_page_index;
        let Some(page) = self.layout_scene.pages.get_mut(index) else {
            return;
        };
        if self.canvas_tiles.owner() != Some((generation, index)) {
            self.canvas_tiles.reset(generation, index, page);
            return;
        }
        let regions = replaced.and_then(|mut old| {
            let old_page = old.pages.get_mut(index)?;
            Some(changed_regions(
                &mut old_page.children,
                &mut page.children,
                EFFECT_MARGIN,
            ))
        });
        self.canvas_tiles.set_content(page);
        match regions {
            Some(regions) => self.canvas_tiles.invalidate(&regions),
            None => self.canvas_tiles.invalidate_all(),
        }
    }

    /// Whether the last composite queued tiles to rasterize.
    pub(crate) fn canvas_tiles_pending(&self) -> bool {
        self.canvas_tiles.has_work()
    }

    /// Rasterizes the tiles the previous frame queued. Returns whether
    /// more remain (the caller schedules another frame).
    pub(crate) fn raster_canvas_tiles(&mut self, backend: &mut dyn RenderBackend) -> bool {
        if !self.canvas_tiles.has_work()
            || self.canvas_tiles.owner()
                != Some((
                    self.editor_state.document_generation(),
                    self.layout_scene.active_page_index,
                ))
        {
            return false;
        }
        let Some(page) = self.layout_scene.active_page() else {
            return false;
        };
        let budget = if self.viewport_gesture.active() {
            // Mid-gesture, a slow tile would stall the frame. Zoomed in, a
            // tile covers little of the document and rasterizes quickly, so
            // keep sharpening; zoomed out, show fallback levels until the
            // camera settles.
            if self.canvas_tiles.last_target >= CHEAP_TILE_SCALE {
                GESTURE_BUDGET_MS
            } else {
                0.0
            }
        } else if self.canvas_tiles.visible_backlog > 0 {
            BACKLOG_BUDGET_MS
        } else {
            IDLE_BUDGET_MS
        };
        self.canvas_tiles
            .raster(backend, page, budget, super::frame_perf::clock_ms)
    }
}
