//! Gradient stop input geometry.
use crate::widgets::property_panel_inputs::{INPUT_HEIGHT, PAD_X};
use crate::{Point2D, Rect};
use op_editor_core::PropertyFocus;

/// Emit `(GradientStopHex, rect)` + `(GradientStopOffset, rect)`
/// pairs for `stop_count` rows starting at `*y`, advancing `y` past
/// the last row. Geometry mirrors `paint_fill_gradient_body`'s row
/// layout so click targets land on the boxes the user sees.
pub(super) fn push_gradient_stop_rects(
    rects: &mut Vec<(PropertyFocus, Rect)>,
    x0: f32,
    y: &mut f32,
    usable_w: f32,
    stop_count: usize,
) {
    let pct_w = 56.0;
    let remove_w = if stop_count > 2 { 26.0 } else { 0.0 };
    let remove_gap = if stop_count > 2 { 6.0 } else { 0.0 };
    let hex_w = usable_w - pct_w - 8.0 - remove_w - remove_gap;
    for index in 0..stop_count {
        rects.push((
            PropertyFocus::GradientStopHex(index),
            Rect {
                origin: Point2D::new(x0 + PAD_X, *y),
                size: Point2D::new(hex_w, INPUT_HEIGHT),
            },
        ));
        rects.push((
            PropertyFocus::GradientStopOffset(index),
            Rect {
                origin: Point2D::new(x0 + PAD_X + hex_w + 8.0, *y),
                size: Point2D::new(pct_w, INPUT_HEIGHT),
            },
        ));
        *y += INPUT_HEIGHT + 4.0;
    }
}
