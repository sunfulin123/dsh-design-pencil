//! Retained canvas tiles: the cache, per-frame compositing, budgeted
//! rasterization and invalidation (geometry lives in
//! `op_editor_ui::widgets::canvas_tiles`).
//!
//! Every frame draws only retained tiles; tiles a frame needs but lacks are
//! filled from another zoom level (at worst the always-kept page overview)
//! and queued. After the frame is presented, queued tiles are rasterized
//! within a time budget, so pan and zoom never wait on scene painting and
//! never show an empty canvas.

use std::collections::HashMap;

use op_editor_ui::layout_scene::ScenePage;
use op_editor_ui::widgets::canvas_tile_paint::paint_tile_content;
use op_editor_ui::widgets::canvas_tiles::{self as geo, TileKey, TileSlot, TileView, TILE_PX};
use op_editor_ui::widgets::PaintCx;
use op_editor_ui::{Point2D, Rect, RenderBackend};

/// Retained tiles (each 256 KiB of GPU memory at 256×256 RGBA).
const MAX_TILES: usize = 600;
/// Document units added around content for effects painting outside it.
pub(crate) const EFFECT_MARGIN: f32 = 96.0;

struct Entry {
    id: u32,
    stale: bool,
    used: u64,
    /// Rasterized while images were still decoding (placeholders drawn).
    provisional: bool,
}

#[derive(Default)]
pub(crate) struct CanvasTiles {
    /// The backend cannot rasterize tiles; always paint live.
    unsupported: bool,
    /// (document generation, page index) the tiles belong to.
    owner: Option<(u64, usize)>,
    entries: HashMap<TileKey, Entry>,
    /// Inflated visual bounds of the page roots; tiles outside are empty.
    content: Vec<Rect>,
    content_bounds: Option<Rect>,
    overview: Option<f32>,
    queue: Vec<TileKey>,
    drops: Vec<u32>,
    frame: u64,
    raster_epoch: (u64, u64),
    /// Visible tiles still missing or stale after the last composite.
    pub(crate) visible_backlog: usize,
    /// The last composite could not cover the view (the frame painted live).
    incomplete: bool,
    /// Target scale of the last composite.
    pub(crate) last_target: f32,
}

impl CanvasTiles {
    pub(crate) fn supported(&self) -> bool {
        !self.unsupported
    }

    /// Always paint live (`?tiles=0`).
    pub(crate) fn disable(&mut self) {
        self.unsupported = true;
    }

    pub(crate) fn owner(&self) -> Option<(u64, usize)> {
        self.owner
    }

    /// Drops every tile and adopts `page` of document `generation`.
    pub(crate) fn reset(&mut self, generation: u64, page_index: usize, page: &ScenePage) {
        self.drops
            .extend(self.entries.drain().map(|(_, entry)| entry.id));
        self.queue.clear();
        self.owner = Some((generation, page_index));
        self.set_content(page);
    }

    pub(crate) fn set_content(&mut self, page: &ScenePage) {
        self.content = page
            .children
            .iter()
            .filter(|node| !node.hidden)
            .map(|node| {
                geo::inflate(
                    geo::union(node.visual_bounds(), node.aggregate_bounds()),
                    EFFECT_MARGIN,
                )
            })
            .filter(|rect| rect.size.x > 0.0 && rect.size.y > 0.0)
            .collect();
        self.content_bounds = self.content.iter().copied().reduce(geo::union);
        self.overview = self.content_bounds.map(geo::overview_scale);
    }

    /// Marks tiles touching any of `regions` (document space) for redraw;
    /// they keep showing their old pixels until replaced.
    pub(crate) fn invalidate(&mut self, regions: &[Rect]) {
        if regions.is_empty() {
            return;
        }
        for (key, entry) in &mut self.entries {
            let cell = key.doc_rect();
            if regions
                .iter()
                .any(|region| geo::intersect(cell, *region).is_some())
            {
                entry.stale = true;
            }
        }
    }

    pub(crate) fn invalidate_all(&mut self) {
        for entry in self.entries.values_mut() {
            entry.stale = true;
        }
    }

    /// Reacts to out-of-band raster changes: a decoded image redraws the
    /// tiles that drew placeholders, a registered font redraws everything.
    pub(crate) fn note_raster_epoch(&mut self, epoch: (u64, u64)) {
        let (images, fonts) = epoch;
        if fonts != self.raster_epoch.1 {
            self.invalidate_all();
        } else if images != self.raster_epoch.0 {
            for entry in self.entries.values_mut() {
                if entry.provisional {
                    entry.stale = true;
                }
            }
        }
        self.raster_epoch = epoch;
    }

    fn slot(&self, key: TileKey) -> TileSlot {
        let cell = key.doc_rect();
        if !self
            .content
            .iter()
            .any(|rect| geo::intersect(cell, *rect).is_some())
        {
            return TileSlot::Empty;
        }
        match self.entries.get(&key) {
            Some(entry) => TileSlot::Ready {
                id: entry.id,
                stale: entry.stale,
            },
            None => TileSlot::Missing,
        }
    }

    fn levels(&self) -> Vec<f32> {
        let mut levels: Vec<u32> = self.entries.keys().map(|key| key.level).collect();
        levels.sort_unstable();
        levels.dedup();
        levels.into_iter().map(f32::from_bits).collect()
    }

    fn overview_cells(&self) -> Vec<TileKey> {
        match (self.overview, self.content_bounds) {
            (Some(scale), Some(bounds)) => geo::cells(scale, bounds),
            _ => Vec::new(),
        }
    }

    /// Draws the content from retained tiles. Returns false (drawing
    /// nothing) when some visible area has no tile at any level yet; the
    /// caller then paints live while the queue fills the gaps.
    pub(crate) fn composite(&mut self, cx: &mut PaintCx<'_>, view: TileView, target: f32) -> bool {
        for id in self.drops.drain(..) {
            cx.backend.drop_tile(id);
        }
        if self.unsupported || self.owner.is_none() {
            return false;
        }
        self.frame += 1;
        let plan = geo::plan_composite(&view, target, &self.levels(), |key| self.slot(key));
        self.visible_backlog = plan.missing.len() + plan.stale.len();
        self.incomplete = !plan.complete;
        self.last_target = target;
        let mut queue: Vec<TileKey> = self
            .overview_cells()
            .into_iter()
            .filter(|key| self.slot(*key) == TileSlot::Missing)
            .collect();
        queue.extend(plan.missing.iter().copied());
        queue.extend(plan.stale.iter().copied());
        queue.extend(plan.prefetch.iter().copied());
        queue.extend(
            self.overview_cells()
                .into_iter()
                .filter(|key| matches!(self.slot(*key), TileSlot::Ready { stale: true, .. })),
        );
        let mut seen = std::collections::HashSet::new();
        queue.retain(|key| seen.insert(*key));
        self.queue = queue;
        if !plan.complete {
            return false;
        }
        let batch: Vec<(u32, Rect, Rect)> = plan
            .draws
            .iter()
            .map(|draw| (draw.id, draw.src, draw.dst))
            .collect();
        let lost = cx.backend.draw_tiles(&batch);
        if !lost.is_empty() {
            // The backend dropped its images (surface rebuilt on resize, or
            // context loss): forget them all so they are redrawn.
            self.entries.clear();
            // Re-plan: nothing is retained now, so this queues the view and
            // reports it uncovered (the frame paints live meanwhile).
            return self.composite(cx, view, target);
        }
        for draw in &plan.draws {
            if let Some(entry) = self.entries.get_mut(&draw.key) {
                entry.used = self.frame;
            }
        }
        true
    }

    pub(crate) fn has_work(&self) -> bool {
        !self.queue.is_empty() && !self.unsupported
    }

    /// Rasterizes queued tiles from `page` until `budget_ms` is spent (at
    /// least one per call). A zero budget defers the work unless the view is
    /// uncovered. Returns whether work remains.
    pub(crate) fn raster(
        &mut self,
        backend: &mut dyn RenderBackend,
        page: &ScenePage,
        budget_ms: f64,
        clock: impl Fn() -> f64,
    ) -> bool {
        for id in self.drops.drain(..) {
            backend.drop_tile(id);
        }
        if self.unsupported {
            self.queue.clear();
            return false;
        }
        if budget_ms <= 0.0 && !self.incomplete {
            return !self.queue.is_empty();
        }
        let started = clock();
        let mut done = 0;
        let queue = std::mem::take(&mut self.queue);
        let mut rest = Vec::new();
        for key in queue {
            if done > 0 && clock() - started >= budget_ms {
                rest.push(key);
                continue;
            }
            match self.slot(key) {
                TileSlot::Empty | TileSlot::Ready { stale: false, .. } => continue,
                _ => {}
            }
            let Some(id) = raster_tile(backend, page, key) else {
                self.unsupported = true;
                self.queue.clear();
                return false;
            };
            done += 1;
            let entry = Entry {
                id,
                stale: false,
                used: self.frame,
                provisional: op_editor_ui::image_runtime::has_pending_decodes(),
            };
            if let Some(old) = self.entries.insert(key, entry) {
                backend.drop_tile(old.id);
            }
        }
        self.queue = rest;
        self.evict(backend);
        !self.queue.is_empty()
    }

    fn evict(&mut self, backend: &mut dyn RenderBackend) {
        let overview = self.overview.map(f32::to_bits);
        while self.entries.len() > MAX_TILES {
            let victim = self
                .entries
                .iter()
                .filter(|(key, entry)| Some(key.level) != overview && entry.used < self.frame)
                .min_by_key(|(_, entry)| entry.used)
                .map(|(key, _)| *key);
            let Some(key) = victim else { break };
            if let Some(entry) = self.entries.remove(&key) {
                backend.drop_tile(entry.id);
            }
        }
    }
}

/// Paints one tile; `None` when the backend cannot rasterize tiles.
fn raster_tile(backend: &mut dyn RenderBackend, page: &ScenePage, key: TileKey) -> Option<u32> {
    if !backend.begin_tile(TILE_PX, TILE_PX) {
        return None;
    }
    let scale = key.scale();
    let cell = key.doc_rect();
    let px = TILE_PX as f32;
    backend.clip_rect(Rect::xywh(0.0, 0.0, px, px));
    paint_tile_content(
        &mut PaintCx {
            backend: &mut *backend,
        },
        &page.children,
        Point2D::new(-cell.origin.x * scale, -cell.origin.y * scale),
        scale,
        Rect::xywh(-2.0, -2.0, px + 4.0, px + 4.0),
    );
    let id = backend.end_tile();
    (id != 0).then_some(id)
}

#[cfg(test)]
#[path = "canvas_tiles_tests.rs"]
mod tests;
