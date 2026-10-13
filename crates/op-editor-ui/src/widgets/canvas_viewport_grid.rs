//! Dotted canvas grid painter for [`super::canvas_viewport::CanvasViewport`].
//!
//! Kept separate from the viewport widget so the hot grid path can
//! evolve without pushing `canvas_viewport.rs` over the 800-line cap.

use crate::theme::Theme;
use crate::widgets::PaintCx;
use crate::{Color, Point2D, Rect};
use op_editor_core::Viewport as DocViewport;

const GRID_SPACING: f32 = 32.0;

fn pixel_grid_positions(origin: f32, length: f32, pan: f32, zoom: f32, dpi: f32) -> Vec<f32> {
    if !origin.is_finite()
        || !length.is_finite()
        || !pan.is_finite()
        || !zoom.is_finite()
        || !dpi.is_finite()
        || length <= 0.0
        || dpi <= 0.0
        || zoom * dpi < 8.0
    {
        return Vec::new();
    }
    let first = (-pan / zoom).ceil();
    let count = (length / zoom).ceil() as usize + 1;
    (0..count)
        .map(|index| origin + pan + (first + index as f32) * zoom)
        .map(|position| ((position * dpi).floor() + 0.5) / dpi)
        .filter(|position| *position >= origin && *position < origin + length)
        .collect()
}

pub(super) fn paint_pixel_grid(cx: &mut PaintCx<'_>, rect: Rect, viewport: &DocViewport) {
    let dpi = cx.backend.dpi_scale();
    let color = Color {
        r: 0.5,
        g: 0.5,
        b: 0.5,
        a: 0.3,
    };
    for position in pixel_grid_positions(
        rect.origin.x,
        rect.size.x,
        viewport.pan_x,
        viewport.zoom,
        dpi,
    ) {
        cx.backend.stroke_line(
            Point2D::new(position, rect.origin.y),
            Point2D::new(position, rect.origin.y + rect.size.y),
            color,
            1.0 / dpi,
        );
    }
    for position in pixel_grid_positions(
        rect.origin.y,
        rect.size.y,
        viewport.pan_y,
        viewport.zoom,
        dpi,
    ) {
        cx.backend.stroke_line(
            Point2D::new(rect.origin.x, position),
            Point2D::new(rect.origin.x + rect.size.x, position),
            color,
            1.0 / dpi,
        );
    }
}

#[derive(Clone, Copy)]
struct GridMetrics {
    step: f32,
    origin_x: f32,
    origin_y: f32,
    dot_radius: f32,
    color: Color,
}

/// Paint a dotted grid across the canvas widget rect. The grid is
/// drawn in canvas-local coordinates and offset by `viewport.pan`
/// so it scrolls with the document content. Dots get sparser as
/// zoom decreases (skipping every other dot at low zoom) so they
/// stay visually airy.
pub(super) fn paint_grid(cx: &mut PaintCx<'_>, rect: Rect, viewport: &DocViewport, theme: &Theme) {
    let metrics = grid_metrics(rect, viewport, theme);
    let count = grid_dot_count_from_metrics(rect, metrics);
    let mut centers = Vec::with_capacity(count);
    let mut y = metrics.origin_y - metrics.step;
    while y < rect.origin.y + rect.size.y + metrics.step {
        let mut x = metrics.origin_x - metrics.step;
        while x < rect.origin.x + rect.size.x + metrics.step {
            centers.push(Point2D::new(x, y));
            x += metrics.step;
        }
        y += metrics.step;
    }
    cx.backend
        .fill_dots(&centers, metrics.dot_radius, metrics.color);
}

#[cfg(test)]
pub(crate) fn grid_dot_count(rect: Rect, viewport: &DocViewport) -> usize {
    grid_dot_count_from_metrics(rect, grid_metrics(rect, viewport, &Theme::light()))
}

fn grid_dot_count_from_metrics(rect: Rect, metrics: GridMetrics) -> usize {
    let cols = axis_dot_count(
        metrics.origin_x - metrics.step,
        rect.origin.x + rect.size.x + metrics.step,
        metrics.step,
    );
    let rows = axis_dot_count(
        metrics.origin_y - metrics.step,
        rect.origin.y + rect.size.y + metrics.step,
        metrics.step,
    );
    cols.saturating_mul(rows)
}

fn axis_dot_count(first: f32, limit: f32, step: f32) -> usize {
    if step <= 0.0 || limit <= first {
        return 0;
    }
    ((limit - first) / step).ceil() as usize
}

fn grid_metrics(rect: Rect, viewport: &DocViewport, theme: &Theme) -> GridMetrics {
    let zoom = viewport.zoom.max(0.0001);
    let mut step = GRID_SPACING * zoom;
    while step < 8.0 {
        step *= 2.0;
    }
    let dot_size = (1.5 * zoom.sqrt()).clamp(1.0, 2.5);
    GridMetrics {
        step,
        origin_x: rect.origin.x + viewport.pan_x.rem_euclid(step),
        origin_y: rect.origin.y + viewport.pan_y.rem_euclid(step),
        dot_radius: dot_size / 2.0,
        color: Color {
            r: theme.border.r,
            g: theme.border.g,
            b: theme.border.b,
            a: theme.border.a * 0.28,
        },
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn pixel_grid_threshold_uses_device_scale_and_aligns_panned_pixels() {
        assert!(pixel_grid_positions(10.25, 32.0, -1.75, 7.99, 1.0).is_empty());
        assert!(pixel_grid_positions(10.25, 32.0, -1.75, 3.99, 2.0).is_empty());
        assert_eq!(
            pixel_grid_positions(10.25, 32.0, -1.75, 8.0, 1.0),
            vec![16.5, 24.5, 32.5, 40.5]
        );
        assert_eq!(
            pixel_grid_positions(10.25, 16.0, -1.75, 4.0, 2.0),
            vec![12.75, 16.75, 20.75, 24.75]
        );
    }
}
