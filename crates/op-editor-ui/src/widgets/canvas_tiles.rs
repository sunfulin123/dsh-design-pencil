//! Tile geometry and compositing plans for the cached canvas renderer.
//!
//! The design canvas is rasterized into fixed-size device-pixel tiles per
//! zoom level (the approach of Figma's tile-based renderer and Chromium's
//! compositor). Pan and zoom then only draw retained tiles; missing tiles are
//! filled from the closest other level that covers them, so the canvas never
//! shows a hole while rasterization catches up a few tiles per frame.

use crate::layout_scene::SceneNode;
use crate::{Point2D, Rect};

/// Tile edge in device pixels.
pub const TILE_PX: u32 = 256;
/// Tiles around the view rasterized ahead of a pan.
const PREFETCH_RING: u32 = 2;
/// Overview tiles render the whole page within about this many pixels.
const OVERVIEW_PX: f32 = 2048.0;
const MIN_SCALE: f32 = 1.0 / 4096.0;
const MAX_POW2_SCALE: f32 = 64.0;

/// One tile: `level` is the f32 bit pattern of its doc→device scale.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub struct TileKey {
    pub level: u32,
    pub tx: i32,
    pub ty: i32,
}

impl TileKey {
    pub fn scale(self) -> f32 {
        f32::from_bits(self.level)
    }

    /// Document-space area this tile covers.
    pub fn doc_rect(self) -> Rect {
        let size = tile_doc_size(self.scale());
        Rect::xywh(self.tx as f32 * size, self.ty as f32 * size, size, size)
    }
}

pub fn tile_doc_size(scale: f32) -> f32 {
    TILE_PX as f32 / scale
}

/// Smallest power of two at or above `device_scale` (crisp when shown).
pub fn pow2_at_least(device_scale: f32) -> f32 {
    let scale = device_scale.clamp(MIN_SCALE, MAX_POW2_SCALE);
    2f32.powi(scale.log2().ceil() as i32)
}

/// Power-of-two scale that fits `content` into the overview budget.
pub fn overview_scale(content: Rect) -> f32 {
    let side = content.size.x.abs().max(content.size.y.abs()).max(1.0);
    2f32.powi((OVERVIEW_PX / side).log2().floor() as i32)
        .clamp(MIN_SCALE, 1.0)
}

/// Every tile of `scale` intersecting `doc` (empty for empty rects).
pub fn cells(scale: f32, doc: Rect) -> Vec<TileKey> {
    let valid = scale > 0.0 && doc.size.x > 0.0 && doc.size.y > 0.0;
    if !valid {
        return Vec::new();
    }
    let size = tile_doc_size(scale);
    let x0 = (doc.origin.x / size).floor() as i32;
    let y0 = (doc.origin.y / size).floor() as i32;
    let x1 = ((doc.origin.x + doc.size.x) / size).ceil() as i32;
    let y1 = ((doc.origin.y + doc.size.y) / size).ceil() as i32;
    let level = scale.to_bits();
    let mut out = Vec::with_capacity(((x1 - x0).max(0) * (y1 - y0).max(0)) as usize);
    for ty in y0..y1 {
        for tx in x0..x1 {
            out.push(TileKey { level, tx, ty });
        }
    }
    out
}

pub fn intersect(a: Rect, b: Rect) -> Option<Rect> {
    let l = a.origin.x.max(b.origin.x);
    let t = a.origin.y.max(b.origin.y);
    let r = (a.origin.x + a.size.x).min(b.origin.x + b.size.x);
    let btm = (a.origin.y + a.size.y).min(b.origin.y + b.size.y);
    (r > l && btm > t).then(|| Rect::xywh(l, t, r - l, btm - t))
}

pub fn union(a: Rect, b: Rect) -> Rect {
    let l = a.origin.x.min(b.origin.x);
    let t = a.origin.y.min(b.origin.y);
    let r = (a.origin.x + a.size.x).max(b.origin.x + b.size.x);
    let btm = (a.origin.y + a.size.y).max(b.origin.y + b.size.y);
    Rect::xywh(l, t, r - l, btm - t)
}

pub fn inflate(rect: Rect, by: f32) -> Rect {
    Rect::xywh(
        rect.origin.x - by,
        rect.origin.y - by,
        rect.size.x + by * 2.0,
        rect.size.y + by * 2.0,
    )
}

/// Canvas camera: `screen = origin + pan + doc * zoom` in local pixels.
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct TileView {
    pub canvas: Rect,
    pub pan: Point2D,
    pub zoom: f32,
}

impl TileView {
    pub fn to_screen(&self, doc: Rect) -> Rect {
        Rect::xywh(
            self.canvas.origin.x + self.pan.x + doc.origin.x * self.zoom,
            self.canvas.origin.y + self.pan.y + doc.origin.y * self.zoom,
            doc.size.x * self.zoom,
            doc.size.y * self.zoom,
        )
    }

    /// Visible document rectangle.
    pub fn visible_doc(&self) -> Rect {
        let zoom = self.zoom.max(f32::MIN_POSITIVE);
        Rect::xywh(
            -self.pan.x / zoom,
            -self.pan.y / zoom,
            self.canvas.size.x / zoom,
            self.canvas.size.y / zoom,
        )
    }
}

/// What the cache holds for a tile.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum TileSlot {
    Missing,
    /// No content intersects the tile; nothing to draw.
    Empty,
    Ready {
        id: u32,
        stale: bool,
    },
}

#[derive(Clone, Copy, Debug, PartialEq)]
pub struct TileDraw {
    pub id: u32,
    pub key: TileKey,
    /// Source region in tile pixels.
    pub src: Rect,
    /// Destination in local canvas coordinates.
    pub dst: Rect,
}

#[derive(Debug, Default, PartialEq)]
pub struct CompositePlan {
    /// Draw calls in order (fallback pieces appear where their cell is).
    pub draws: Vec<TileDraw>,
    /// Every visible pixel is covered by some retained or empty tile.
    pub complete: bool,
    /// Visible target tiles to rasterize, nearest the centre first.
    pub missing: Vec<TileKey>,
    /// Visible target tiles shown with outdated content.
    pub stale: Vec<TileKey>,
    /// Target tiles in a ring outside the view, worth rasterizing next.
    pub prefetch: Vec<TileKey>,
}

/// Plans one frame: draw `target`-scale tiles over the visible area and
/// fill each missing one from the nearest other level in `levels`.
pub fn plan_composite(
    view: &TileView,
    target: f32,
    levels: &[f32],
    slot: impl Fn(TileKey) -> TileSlot,
) -> CompositePlan {
    let visible = view.visible_doc();
    let mut plan = CompositePlan {
        complete: true,
        ..CompositePlan::default()
    };
    let mut fallbacks: Vec<f32> = levels
        .iter()
        .copied()
        .filter(|level| *level > 0.0 && *level != target)
        .collect();
    fallbacks.sort_by(|a, b| (a / target).ln().abs().total_cmp(&(b / target).ln().abs()));
    let centre = Point2D::new(
        visible.origin.x + visible.size.x / 2.0,
        visible.origin.y + visible.size.y / 2.0,
    );
    for key in cells(target, visible) {
        match slot(key) {
            TileSlot::Empty => {}
            TileSlot::Ready { id, stale } => {
                plan.draws.push(whole_tile(view, key, id));
                if stale {
                    plan.stale.push(key);
                }
            }
            TileSlot::Missing => {
                plan.missing.push(key);
                let cell = key.doc_rect();
                let area = intersect(cell, visible).unwrap_or(cell);
                if !fill_from_fallback(view, area, &fallbacks, &slot, &mut plan.draws) {
                    plan.complete = false;
                }
            }
        }
    }
    let by_distance = |key: &TileKey| {
        let rect = key.doc_rect();
        let dx = rect.origin.x + rect.size.x / 2.0 - centre.x;
        let dy = rect.origin.y + rect.size.y / 2.0 - centre.y;
        dx * dx + dy * dy
    };
    plan.missing
        .sort_by(|a, b| by_distance(a).total_cmp(&by_distance(b)));
    plan.stale
        .sort_by(|a, b| by_distance(a).total_cmp(&by_distance(b)));
    let ring = inflate(visible, tile_doc_size(target) * PREFETCH_RING as f32);
    for key in cells(target, ring) {
        if intersect(key.doc_rect(), visible).is_some() {
            continue;
        }
        if matches!(
            slot(key),
            TileSlot::Missing | TileSlot::Ready { stale: true, .. }
        ) {
            plan.prefetch.push(key);
        }
    }
    plan.prefetch
        .sort_by(|a, b| by_distance(a).total_cmp(&by_distance(b)));
    plan
}

fn whole_tile(view: &TileView, key: TileKey, id: u32) -> TileDraw {
    let px = TILE_PX as f32;
    TileDraw {
        id,
        key,
        src: Rect::xywh(0.0, 0.0, px, px),
        dst: view.to_screen(key.doc_rect()),
    }
}

/// Draws `area` from the first level whose tiles all exist (stale or empty
/// count). Returns false when no level covers it.
fn fill_from_fallback(
    view: &TileView,
    area: Rect,
    fallbacks: &[f32],
    slot: &impl Fn(TileKey) -> TileSlot,
    draws: &mut Vec<TileDraw>,
) -> bool {
    'levels: for &level in fallbacks {
        let keys = cells(level, area);
        let mut pieces = Vec::with_capacity(keys.len());
        for key in keys {
            match slot(key) {
                TileSlot::Missing => continue 'levels,
                TileSlot::Empty => {}
                TileSlot::Ready { id, .. } => {
                    let cell = key.doc_rect();
                    let Some(part) = intersect(cell, area) else {
                        continue;
                    };
                    let scale = key.scale();
                    pieces.push(TileDraw {
                        id,
                        key,
                        src: Rect::xywh(
                            (part.origin.x - cell.origin.x) * scale,
                            (part.origin.y - cell.origin.y) * scale,
                            part.size.x * scale,
                            part.size.y * scale,
                        ),
                        dst: view.to_screen(part),
                    });
                }
            }
        }
        draws.extend(pieces);
        return true;
    }
    false
}

/// Paint-affecting regions (document space) that differ between two
/// versions of a page's roots. Unchanged subtrees are skipped; a changed
/// node reports its old and new visual bounds, grown by `margin` for
/// effects (shadows, strokes, blur) that paint outside them.
pub fn changed_regions(old: &mut [SceneNode], new: &mut [SceneNode], margin: f32) -> Vec<Rect> {
    let mut out = Vec::new();
    diff_siblings(old, new, margin, &mut out);
    out
}

fn region(node: &SceneNode, margin: f32) -> Option<Rect> {
    let bounds = union(node.visual_bounds(), node.aggregate_bounds());
    (bounds.size.x > 0.0 || bounds.size.y > 0.0).then(|| inflate(bounds, margin))
}

fn diff_siblings(old: &mut [SceneNode], new: &mut [SceneNode], margin: f32, out: &mut Vec<Rect>) {
    let same_ids = old.len() == new.len() && old.iter().zip(new.iter()).all(|(a, b)| a.id == b.id);
    if same_ids {
        for (a, b) in old.iter_mut().zip(new.iter_mut()) {
            diff_node(a, b, margin, out);
        }
        return;
    }
    // Inserted, removed or reordered siblings: repaint every sibling that is
    // not identical at the same position.
    for (index, node) in new.iter().enumerate() {
        if old.get(index) != Some(node) {
            out.extend(region(node, margin));
        }
    }
    for (index, node) in old.iter().enumerate() {
        if new.get(index) != Some(node) {
            out.extend(region(node, margin));
        }
    }
}

fn diff_node(old: &mut SceneNode, new: &mut SceneNode, margin: f32, out: &mut Vec<Rect>) {
    if old == new {
        return;
    }
    let old_children = std::mem::take(&mut old.children);
    let new_children = std::mem::take(&mut new.children);
    let own_changed = old != new;
    old.children = old_children;
    new.children = new_children;
    if own_changed {
        out.extend(region(old, margin));
        out.extend(region(new, margin));
        return;
    }
    diff_siblings(&mut old.children, &mut new.children, margin, out);
}

#[cfg(test)]
#[path = "canvas_tiles_tests.rs"]
mod tests;
