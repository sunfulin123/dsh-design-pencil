//! Screen-level snapshot caching, transition compositing, overlay rendering,
//! and hotspot hints for web Present mode.

use super::device_frame::PinnedPaint;
use super::PreviewSession;
use jian_ops_schema::prototype::OverlayPositionType;
use op_editor_core::prototype::PropertyOverrideValue;
use op_editor_ui::layout_scene::{SceneNode, ScenePage};
use op_editor_ui::widgets::canvas_tile_paint::paint_tile_content;
use op_editor_ui::widgets::PaintCx;
use op_editor_ui::{Color, Point2D, Rect, RenderBackend};
use std::cell::RefCell;
use std::collections::HashMap;

const MAX_SCREEN_SNAPSHOTS: usize = 12;

#[derive(Debug, Clone, PartialEq, Eq, Hash)]
struct SnapshotKey {
    screen_id: String,
    px_w: u32,
    px_h: u32,
    state_rev: u64,
}

#[derive(Default)]
pub(crate) struct ScreenSnapshotCache {
    entries: HashMap<SnapshotKey, (u32, u64)>,
    drops: Vec<u32>,
    tick: u64,
}

impl ScreenSnapshotCache {
    pub fn invalidate_all(&mut self) {
        for (_, (id, _)) in self.entries.drain() {
            self.drops.push(id);
        }
    }

    fn flush_drops(&mut self, backend: &mut dyn RenderBackend) {
        for id in self.drops.drain(..) {
            backend.drop_tile(id);
        }
    }
}

thread_local! {
    static SNAPSHOT_CACHE: RefCell<ScreenSnapshotCache> = RefCell::new(ScreenSnapshotCache::default());
}

pub fn invalidate_preview_snapshots() {
    SNAPSHOT_CACHE.with(|c| c.borrow_mut().invalidate_all());
}

impl PreviewSession {
    pub fn paint_scene(
        &self,
        backend: &mut dyn RenderBackend,
        page: Option<&ScenePage>,
        canvas: Rect,
        pan: (f32, f32),
        zoom: f32,
        _now_ms: u64,
    ) {
        let Some(page) = page else {
            return;
        };
        let origin = Point2D::new(canvas.origin.x + pan.0, canvas.origin.y + pan.1);
        op_editor_ui::widgets::paint_scene_page_without_video_badge(
            &mut PaintCx { backend },
            page,
            origin,
            zoom,
            canvas,
        );
    }

    #[allow(clippy::too_many_arguments)]
    pub fn paint_framed_animated(
        &self,
        backend: &mut dyn RenderBackend,
        page: Option<&ScenePage>,
        root_id: &str,
        content_clip: Rect,
        content_origin: Point2D,
        fit: f32,
        pinned_paint: Option<&PinnedPaint>,
        pinned_top_paint: Option<&PinnedPaint>,
        now_ms: u64,
    ) {
        let Some(page) = page else {
            return;
        };
        backend.save();
        backend.clip_rect(content_clip);

        if let Some(tf) = self.player.current_transition_frame(now_ms) {
            let paint_one = |backend: &mut dyn RenderBackend,
                             screen_id: &str,
                             offset: (f32, f32),
                             _opacity: f32| {
                if let Some(node) = find_screen_scene_node(&page.children, screen_id) {
                    let node = self.apply_overrides_to_node(node, &page.children);
                    let origin = Point2D::new(
                        content_clip.origin.x + (offset.0 - node.bounds.origin.x) * fit,
                        content_clip.origin.y + (offset.1 - node.bounds.origin.y) * fit,
                    );
                    paint_single_screen(
                        backend,
                        &node,
                        content_clip,
                        origin,
                        fit,
                        self.state_revision,
                    );
                }
            };
            if tf.to_on_top {
                paint_one(backend, &tf.from_screen_id, tf.from_offset, tf.from_opacity);
                paint_one(backend, &tf.to_screen_id, tf.to_offset, tf.to_opacity);
            } else {
                paint_one(backend, &tf.to_screen_id, tf.to_offset, tf.to_opacity);
                paint_one(backend, &tf.from_screen_id, tf.from_offset, tf.from_opacity);
            }
        } else if let Some(node) = find_screen_scene_node(&page.children, root_id) {
            let node = self.apply_overrides_to_node(node, &page.children);
            paint_single_screen(
                backend,
                &node,
                content_clip,
                content_origin,
                fit,
                self.state_revision,
            );
        }

        // Paint active overlays on top of the screen
        for overlay in &self.player.overlays {
            if let Some(ov_node) = find_screen_scene_node(&page.children, &overlay.screen_id) {
                let backdrop = overlay
                    .background_color
                    .as_deref()
                    .and_then(parse_hex_color)
                    .unwrap_or(Color {
                        r: 0.0,
                        g: 0.0,
                        b: 0.0,
                        a: 0.35,
                    });
                backend.fill_rect(content_clip, backdrop);
                let ow = ov_node.bounds.size.x * fit;
                let oh = ov_node.bounds.size.y * fit;
                let (ox, oy) = resolve_overlay_origin(
                    content_clip,
                    (ow, oh),
                    overlay.position_type,
                    (overlay.offset.0 * fit, overlay.offset.1 * fit),
                );
                let ov_rect = Rect::xywh(ox, oy, ow, oh);
                let ov_origin = Point2D::new(
                    ox - ov_node.bounds.origin.x * fit,
                    oy - ov_node.bounds.origin.y * fit,
                );
                let node = self.apply_overrides_to_node(ov_node, &page.children);
                paint_single_screen(backend, &node, ov_rect, ov_origin, fit, self.state_revision);
            }
        }

        // Paint Figma-style blue hotspot hint flash when clicking outside hotspots
        if self
            .player
            .hotspot_flash_until_ms
            .is_some_and(|until| now_ms < until)
        {
            for h in self.player.active_hotspots() {
                let (lx, ly, lw, lh) = h.local_rect;
                let rect = Rect::xywh(
                    content_clip.origin.x + lx * fit,
                    content_clip.origin.y + ly * fit,
                    lw * fit,
                    lh * fit,
                );
                backend.fill_round_rect(
                    rect,
                    4.0,
                    Color {
                        r: 0.09,
                        g: 0.63,
                        b: 0.98,
                        a: 0.22,
                    },
                );
                backend.stroke_round_rect(
                    rect,
                    4.0,
                    Color {
                        r: 0.09,
                        g: 0.63,
                        b: 0.98,
                        a: 0.85,
                    },
                    1.5,
                );
            }
        }

        backend.restore();

        for pinned in [pinned_paint, pinned_top_paint].into_iter().flatten() {
            if let Some(p_node) = find_screen_scene_node(&page.children, &pinned.node_id) {
                backend.save();
                backend.clip_rect(pinned.strip_clip);
                let origin = Point2D::new(
                    pinned.paint_origin.x - pinned.nav_scene_origin.x * fit,
                    pinned.paint_origin.y - pinned.nav_scene_origin.y * fit,
                );
                paint_tile_content(
                    &mut PaintCx { backend },
                    std::slice::from_ref(p_node),
                    origin,
                    fit,
                    pinned.strip_clip,
                );
                backend.restore();
            }
        }
    }

    fn apply_overrides_to_node(&self, node: &SceneNode, page_roots: &[SceneNode]) -> SceneNode {
        if self.player.property_overrides.is_empty() && self.player.variant_overrides.is_empty() {
            return node.clone();
        }
        let mut cloned = node.clone();
        apply_node_overrides(
            &mut cloned,
            &self.player.property_overrides,
            &self.player.variant_overrides,
            page_roots,
        );
        cloned
    }
}

fn apply_node_overrides(
    node: &mut SceneNode,
    prop_overrides: &HashMap<String, PropertyOverrideValue>,
    variant_overrides: &HashMap<String, String>,
    page_roots: &[SceneNode],
) {
    if let Some(target_variant_id) = variant_overrides.get(&node.id) {
        if target_variant_id != &node.id {
            if let Some(replacement) = find_screen_scene_node(page_roots, target_variant_id) {
                let bounds = node.bounds;
                let id = node.id.clone();
                let dx = bounds.origin.x - replacement.bounds.origin.x;
                let dy = bounds.origin.y - replacement.bounds.origin.y;
                *node = replacement.clone();
                node.id = id;
                shift_scene_subtree(node, dx, dy);
            }
        }
    }
    if let Some(ov) = prop_overrides.get(&node.id) {
        match ov {
            PropertyOverrideValue::Visible(vis) => node.hidden = !*vis,
            PropertyOverrideValue::Text(text) => node.text = Some(text.clone()),
        }
    }
    for child in &mut node.children {
        apply_node_overrides(child, prop_overrides, variant_overrides, page_roots);
    }
}

fn shift_scene_subtree(node: &mut SceneNode, dx: f32, dy: f32) {
    node.bounds.origin.x += dx;
    node.bounds.origin.y += dy;
    for child in &mut node.children {
        shift_scene_subtree(child, dx, dy);
    }
}

pub(crate) fn find_screen_scene_node<'a>(
    nodes: &'a [SceneNode],
    id: &str,
) -> Option<&'a SceneNode> {
    for node in nodes {
        if node.id == id {
            return Some(node);
        }
        if let Some(found) = find_screen_scene_node(&node.children, id) {
            return Some(found);
        }
    }
    None
}

const MAX_SNAPSHOT_DIMENSION: u32 = 4096;

fn paint_single_screen(
    backend: &mut dyn RenderBackend,
    screen_node: &SceneNode,
    clip_rect: Rect,
    origin: Point2D,
    fit: f32,
    state_rev: u64,
) {
    let aligned_x = (origin.x + screen_node.bounds.origin.x * fit - clip_rect.origin.x).abs() < 1.0;
    let aligned_y = (origin.y + screen_node.bounds.origin.y * fit - clip_rect.origin.y).abs() < 1.0;
    let dpr = backend.dpi_scale().clamp(1.0, 3.0);
    let ideal_w = (clip_rect.size.x * dpr).round();
    let ideal_h = (clip_rect.size.y * dpr).round();
    let fits_snapshot_tile = ideal_w >= 16.0
        && ideal_h >= 16.0
        && ideal_w <= MAX_SNAPSHOT_DIMENSION as f32
        && ideal_h <= MAX_SNAPSHOT_DIMENSION as f32;

    if aligned_x && aligned_y && fits_snapshot_tile && fit <= 2.5 {
        let px_w = ideal_w as u32;
        let px_h = ideal_h as u32;
        let key = SnapshotKey {
            screen_id: screen_node.id.clone(),
            px_w,
            px_h,
            state_rev,
        };
        let drew_cached = SNAPSHOT_CACHE.with(|cell| {
            let mut cache = cell.borrow_mut();
            cache.flush_drops(backend);
            cache.tick = cache.tick.wrapping_add(1);
            let tick = cache.tick;
            if let Some((tile_id, used)) = cache.entries.get_mut(&key) {
                *used = tick;
                let tid = *tile_id;
                let src = Rect::xywh(0.0, 0.0, px_w as f32, px_h as f32);
                let lost = backend.draw_tiles(&[(tid, src, clip_rect)]);
                if lost.is_empty() {
                    return true;
                }
                cache.entries.clear();
            }
            if backend.begin_tile(px_w, px_h) {
                let raster_fit = fit * dpr;
                let local_origin = Point2D::new(
                    -screen_node.bounds.origin.x * raster_fit,
                    -screen_node.bounds.origin.y * raster_fit,
                );
                let local_cull = Rect::xywh(0.0, 0.0, px_w as f32, px_h as f32);
                paint_tile_content(
                    &mut PaintCx { backend },
                    std::slice::from_ref(screen_node),
                    local_origin,
                    raster_fit,
                    local_cull,
                );
                let tid = backend.end_tile();
                if tid != 0 {
                    while cache.entries.len() >= MAX_SCREEN_SNAPSHOTS {
                        let Some(oldest) = cache
                            .entries
                            .iter()
                            .min_by_key(|(_, (_, u))| *u)
                            .map(|(k, _)| k.clone())
                        else {
                            break;
                        };
                        if let Some((old_id, _)) = cache.entries.remove(&oldest) {
                            backend.drop_tile(old_id);
                        }
                    }
                    cache.entries.insert(key, (tid, tick));
                    let src = Rect::xywh(0.0, 0.0, px_w as f32, px_h as f32);
                    if backend.draw_tiles(&[(tid, src, clip_rect)]).is_empty() {
                        return true;
                    }
                }
            }
            false
        });
        if drew_cached {
            return;
        }
    }

    paint_tile_content(
        &mut PaintCx { backend },
        std::slice::from_ref(screen_node),
        origin,
        fit,
        clip_rect,
    );
}

fn resolve_overlay_origin(
    stage: Rect,
    size: (f32, f32),
    pos: OverlayPositionType,
    offset: (f32, f32),
) -> (f32, f32) {
    let (sx, sy, sw, sh) = (stage.origin.x, stage.origin.y, stage.size.x, stage.size.y);
    let (ow, oh) = size;
    match pos {
        OverlayPositionType::Center => (sx + (sw - ow) * 0.5, sy + (sh - oh) * 0.5),
        OverlayPositionType::TopLeft => (sx, sy),
        OverlayPositionType::TopCenter => (sx + (sw - ow) * 0.5, sy),
        OverlayPositionType::TopRight => (sx + sw - ow, sy),
        OverlayPositionType::BottomLeft => (sx, sy + sh - oh),
        OverlayPositionType::BottomCenter => (sx + (sw - ow) * 0.5, sy + sh - oh),
        OverlayPositionType::BottomRight => (sx + sw - ow, sy + sh - oh),
        OverlayPositionType::Manual => (sx + offset.0, sy + offset.1),
    }
}

pub(crate) fn parse_hex_color(hex: &str) -> Option<Color> {
    let s = hex.trim().trim_start_matches('#');
    let byte = |i: usize| u8::from_str_radix(s.get(i..i + 2)?, 16).ok();
    match s.len() {
        6 => Some(Color {
            r: f32::from(byte(0)?) / 255.0,
            g: f32::from(byte(2)?) / 255.0,
            b: f32::from(byte(4)?) / 255.0,
            a: 1.0,
        }),
        8 => Some(Color {
            r: f32::from(byte(0)?) / 255.0,
            g: f32::from(byte(2)?) / 255.0,
            b: f32::from(byte(4)?) / 255.0,
            a: f32::from(byte(6)?) / 255.0,
        }),
        _ => None,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use op_editor_ui::layout_scene::NodeKind;
    use op_editor_ui::TextLayout;

    #[derive(Default)]
    struct SnapshotProbeBackend {
        dpr: f32,
        tiles_begun: Vec<(u32, u32)>,
        filled_rects: Vec<Rect>,
    }

    impl RenderBackend for SnapshotProbeBackend {
        fn begin_frame(&mut self) {}
        fn end_frame(&mut self) {}
        fn fill_rect(&mut self, rect: Rect, _: Color) {
            self.filled_rects.push(rect);
        }
        fn stroke_rect(&mut self, _: Rect, _: Color, _: f32) {}
        fn draw_text(&mut self, _: &TextLayout, _: Point2D) {}
        fn clip_rect(&mut self, _: Rect) {}
        fn stroke_line(&mut self, _: Point2D, _: Point2D, _: Color, _: f32) {}
        fn fill_round_rect(&mut self, rect: Rect, _: f32, _: Color) {
            self.filled_rects.push(rect);
        }
        fn stroke_round_rect(&mut self, _: Rect, _: f32, _: Color, _: f32) {}
        fn stroke_svg_path(&mut self, _: &str, _: Point2D, _: f32, _: Color, _: f32) {}
        fn save(&mut self) {}
        fn restore(&mut self) {}
        fn translate(&mut self, _: Point2D) {}
        fn resize(&mut self, _: u32, _: u32) {}
        fn dpi_scale(&self) -> f32 {
            self.dpr
        }
        fn begin_tile(&mut self, w: u32, h: u32) -> bool {
            self.tiles_begun.push((w, h));
            true
        }
        fn end_tile(&mut self) -> u32 {
            1
        }
        fn draw_tile(&mut self, _: u32, _: Rect, _: Rect) -> bool {
            true
        }
    }

    #[test]
    fn tall_screen_exceeding_4096_device_px_paints_directly_without_stretching_snapshot_tile() {
        invalidate_preview_snapshots();
        let mut root = SceneNode::leaf("tall-screen", NodeKind::Frame);
        root.bounds = Rect::xywh(0.0, 0.0, 1440.0, 3370.0);
        root.fill = Some(Color::WHITE);
        let mut footer = SceneNode::leaf("footer", NodeKind::Rect);
        footer.bounds = Rect::xywh(0.0, 3200.0, 1440.0, 170.0);
        footer.fill = Some(Color::BLACK);
        root.children.push(footer);

        let fit = 0.866;
        let clip_rect = Rect::xywh(16.0, 66.0, 1440.0 * fit, 3370.0 * fit);
        let mut backend = SnapshotProbeBackend {
            dpr: 2.0,
            ..Default::default()
        };

        paint_single_screen(&mut backend, &root, clip_rect, clip_rect.origin, fit, 1);

        assert!(
            backend.tiles_begun.is_empty(),
            "screens taller than 4096 device px must bypass the single-tile snapshot cache"
        );
        assert!(
            backend
                .filled_rects
                .iter()
                .any(|r| (r.origin.y - (clip_rect.origin.y + 3200.0 * fit)).abs() < 1.0),
            "bottom footer beyond 4096 device px must paint at its unstretched y coordinate"
        );
    }
}
