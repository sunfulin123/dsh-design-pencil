//! Scene-content entry points for the tile renderer: rasterize one tile, and
//! collect the hover / selection hits the chrome needs without drawing when
//! retained tiles already show the content.

use super::canvas_overlay_transform::OverlayTransform;
use super::canvas_viewport_paint::{paint_scene_nodes_with_options_hiding, PaintNodeHits};
use super::PaintCx;
use crate::layout_scene::SceneNode;
#[cfg(test)]
use crate::{Color, RenderBackend, TextLayout};
use crate::{Point2D, Rect};

/// Paints the page content (no editor chrome) the same way the live canvas
/// does, at `zoom` with `origin` as the document origin on the target.
pub fn paint_tile_content(
    cx: &mut PaintCx<'_>,
    roots: &[SceneNode],
    origin: Point2D,
    zoom: f32,
    cull: Rect,
) {
    let _ = paint_scene_nodes_with_options_hiding(
        cx, roots, origin, zoom, None, cull, None, None, None, None, None, 0, None, None, None,
        false,
    );
}

/// Overlay geometry for the hovered, selected and pen nodes, computed along
/// each node's ancestor path (no tree walk): the same rects and flip /
/// rotation chains the live paint walk reports, for nodes it would reach.
pub(crate) fn collect_hits<'a>(
    roots: &'a [SceneNode],
    origin: Point2D,
    zoom: f32,
    hovered: Option<&str>,
    selected: Option<&str>,
    pen: Option<&str>,
) -> PaintNodeHits<'a> {
    let mut hits = PaintNodeHits::default();
    let screen = |node: &SceneNode| -> Option<Rect> {
        let b = node.aggregate_bounds();
        (b.size.x > 0.0 && b.size.y > 0.0).then(|| {
            Rect::xywh(
                origin.x + b.origin.x * zoom,
                origin.y + b.origin.y * zoom,
                b.size.x * zoom,
                b.size.y * zoom,
            )
        })
    };
    let chain_with = |chain: &[OverlayTransform], node: &SceneNode| -> Vec<OverlayTransform> {
        let mut chain = chain.to_vec();
        chain.extend(own_transform(node, origin, zoom));
        chain
    };
    if let Some((node, chain)) = hovered.and_then(|id| find_path(roots, id, origin, zoom)) {
        if let Some(rect) = screen(node) {
            hits.hover_rect = Some(rect);
            hits.hover_transforms = chain.clone();
        }
        // Back-to-front, the order the paint walk reports them in.
        for child in node
            .visible_children()
            .iter()
            .rev()
            .filter(|child| !child.hidden)
        {
            if let Some(rect) = screen(child) {
                hits.hover_child_rects
                    .push((rect, chain_with(&chain, child)));
            }
        }
    }
    if let Some((node, chain)) = selected.and_then(|id| find_path(roots, id, origin, zoom)) {
        hits.selected_node = Some(node);
        hits.selected_transforms = chain;
    }
    hits.pen_node = pen
        .and_then(|id| find_path(roots, id, origin, zoom))
        .map(|(node, _)| node);
    hits
}

/// The flip / rotation a node's paint applies around its own centre.
fn own_transform(node: &SceneNode, origin: Point2D, zoom: f32) -> Option<OverlayTransform> {
    let rotated = node.rotation.abs() > f32::EPSILON;
    if !(node.flip_x || node.flip_y || rotated) {
        return None;
    }
    let b = node.aggregate_bounds();
    Some(OverlayTransform {
        rotation: node.rotation,
        flip_x: node.flip_x,
        flip_y: node.flip_y,
        pivot: Point2D::new(
            origin.x + (b.origin.x + b.size.x / 2.0) * zoom,
            origin.y + (b.origin.y + b.size.y / 2.0) * zoom,
        ),
    })
}

/// The visible node `id` and the transform chain (root first, including the
/// node's own) active where it paints.
fn find_path<'a>(
    nodes: &'a [SceneNode],
    id: &str,
    origin: Point2D,
    zoom: f32,
) -> Option<(&'a SceneNode, Vec<OverlayTransform>)> {
    for node in nodes.iter().filter(|node| !node.hidden) {
        if node.id == id {
            return Some((
                node,
                own_transform(node, origin, zoom).into_iter().collect(),
            ));
        }
        if let Some((found, mut chain)) = find_path(node.visible_children(), id, origin, zoom) {
            if let Some(own) = own_transform(node, origin, zoom) {
                chain.insert(0, own);
            }
            return Some((found, chain));
        }
    }
    None
}

#[cfg(test)]
#[path = "canvas_tile_paint_tests.rs"]
mod tests;

/// Accepts every draw call and does nothing.
#[cfg(test)]
struct DiscardPainter {
    dpi_scale: f32,
}

#[cfg(test)]
impl RenderBackend for DiscardPainter {
    fn begin_frame(&mut self) {}
    fn end_frame(&mut self) {}
    fn fill_rect(&mut self, _: Rect, _: Color) {}
    fn stroke_rect(&mut self, _: Rect, _: Color, _: f32) {}
    fn draw_text(&mut self, _: &TextLayout, _: Point2D) {}
    fn clip_rect(&mut self, _: Rect) {}
    fn stroke_line(&mut self, _: Point2D, _: Point2D, _: Color, _: f32) {}
    fn fill_round_rect(&mut self, _: Rect, _: f32, _: Color) {}
    fn stroke_round_rect(&mut self, _: Rect, _: f32, _: Color, _: f32) {}
    fn stroke_svg_path(&mut self, _: &str, _: Point2D, _: f32, _: Color, _: f32) {}
    fn save(&mut self) {}
    fn restore(&mut self) {}
    fn translate(&mut self, _: Point2D) {}
    fn resize(&mut self, _: u32, _: u32) {}
    fn dpi_scale(&self) -> f32 {
        self.dpi_scale
    }
}
