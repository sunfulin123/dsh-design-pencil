use crate::pen_node_ext::PenNodeExt;
use jian_ops_schema::node::PenNode;

/// Preserve the authored ratio when only one dimension changes. When both
/// dimensions are supplied, width determines the uniformly scaled result.
pub(crate) fn constrained_dimensions(
    node: &PenNode,
    width: Option<f64>,
    height: Option<f64>,
) -> (Option<f64>, Option<f64>) {
    if node.base().lock_aspect_ratio != Some(true) {
        return (width, height);
    }
    let (Some(old_w), Some(old_h)) = (node.width_px(), node.height_px()) else {
        return (width, height);
    };
    if !old_w.is_finite() || !old_h.is_finite() || old_w <= 0.0 || old_h <= 0.0 {
        return (width, height);
    }
    if let Some(w) = width {
        (Some(w), Some(w * old_h / old_w))
    } else if let Some(h) = height {
        (Some(h * old_w / old_h), Some(h))
    } else {
        (None, None)
    }
}
