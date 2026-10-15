//! Geometry-verified Auto-Layout inference for browser-rendered HTML snapshots.
//!
//! Combines `olliethedev/html-to-figma`'s CSS-flex-to-AutoLayout mapping with
//! strict bounding-box collinearity and non-overlap verification against the
//! browser's real `getBoundingClientRect` coordinates. When the children's
//! actual rendered boxes form a clean horizontal row or vertical stack without
//! overlaps, the container is upgraded to `LayoutMode::Horizontal` or
//! `LayoutMode::Vertical` with inferred `gap`, `padding`, `justify_content`,
//! and `align_items` while preserving each child's exact `x, y` fallback.

use std::collections::BTreeMap;

use jian_ops_schema::node::base::NumberOrExpression;
use jian_ops_schema::node::container::{
    AlignItems, ContainerProps, JustifyContent, LayoutMode, Padding,
};
use serde_json::{Map, Value};

use super::{parse_px, Rect};

const OVERLAP_TOLERANCE_PX: f64 = 1.5;

fn child_is_out_of_flow(child: &Map<String, Value>) -> bool {
    let pos = child
        .get("styles")
        .and_then(Value::as_object)
        .and_then(|s| s.get("position"))
        .and_then(Value::as_str)
        .unwrap_or("static");
    matches!(pos, "absolute" | "fixed")
}

fn child_has_explicit_z_index(child: &Map<String, Value>) -> bool {
    child
        .get("styles")
        .and_then(Value::as_object)
        .and_then(|s| s.get("z-index"))
        .and_then(Value::as_str)
        .is_some_and(|z| z != "auto" && !z.is_empty())
}

/// Apply verified Auto-Layout properties (`layout`, `gap`, `padding`,
/// `justify_content`, `align_items`) to `container` when the element's CSS
/// styles and its children's rendered rectangles agree on a clean flow.
pub(crate) fn apply_verified_snapshot_auto_layout(
    object: &Map<String, Value>,
    styles: &BTreeMap<String, String>,
    parent_rect: Rect,
    container: &mut ContainerProps,
) {
    let raw_children = match object.get("children").and_then(Value::as_array) {
        Some(list) if !list.is_empty() => list,
        _ => return,
    };

    let display = styles.get("display").map(String::as_str).unwrap_or("block");
    let has_explicit_layout_styles = styles.contains_key("display")
        || styles.contains_key("flex-direction")
        || styles.contains_key("gap")
        || styles.contains_key("row-gap")
        || styles.contains_key("column-gap")
        || styles.contains_key("justify-content")
        || styles.contains_key("align-items")
        || styles.contains_key("padding-top")
        || styles.contains_key("padding-left");

    // Preserve backward-compatible `LayoutMode::None` on minimal synthetic v1
    // test fixtures that carry no layout styles at all.
    if !has_explicit_layout_styles {
        return;
    }

    // Collect in-flow child rects; bail out if any child is out-of-flow or carries
    // an explicit z-index stack override so paint-order tricks stay untouched.
    let mut child_rects = Vec::with_capacity(raw_children.len());
    for item in raw_children {
        let Some(child_obj) = item.as_object() else {
            return;
        };
        if child_is_out_of_flow(child_obj) || child_has_explicit_z_index(child_obj) {
            return;
        }
        let Some(r) = Rect::from_node(child_obj) else {
            return;
        };
        if r.w < 0.5 || r.h < 0.5 {
            continue;
        }
        child_rects.push(r);
    }

    if child_rects.is_empty() {
        return;
    }

    let is_flex = matches!(display, "flex" | "inline-flex");
    let flex_dir = styles
        .get("flex-direction")
        .map(String::as_str)
        .unwrap_or("row");

    let mode = if child_rects.len() == 1 {
        if is_flex && flex_dir.starts_with("row") {
            Some(LayoutMode::Horizontal)
        } else if is_flex || matches!(display, "grid" | "inline-grid" | "block" | "flow-root") {
            Some(LayoutMode::Vertical)
        } else {
            None
        }
    } else if is_monotonic_horizontal(&child_rects) {
        Some(LayoutMode::Horizontal)
    } else if is_monotonic_vertical(&child_rects) {
        Some(LayoutMode::Vertical)
    } else {
        None
    };

    let Some(layout_mode) = mode else {
        return;
    };

    container.layout = Some(layout_mode.clone());
    container.padding = infer_padding(styles, parent_rect, &child_rects);
    container.gap = infer_gap(styles, &layout_mode, &child_rects).map(NumberOrExpression::Number);
    container.justify_content = infer_justify_content(styles);
    container.align_items = infer_align_items(styles, parent_rect, &layout_mode, &child_rects);
}

/// Returns `true` when `apply_verified_snapshot_auto_layout` promoted this
/// container to `Horizontal` or `Vertical`, meaning its children must stay in
/// natural DOM flow order (left-to-right or top-to-bottom) rather than being
/// reversed into front-to-back paint order.
pub(crate) fn is_flow_auto_layout(container: &ContainerProps) -> bool {
    matches!(
        container.layout,
        Some(LayoutMode::Horizontal | LayoutMode::Vertical)
    )
}

fn is_monotonic_horizontal(rects: &[Rect]) -> bool {
    for pair in rects.windows(2) {
        let a = pair[0];
        let b = pair[1];
        // Next item must start at or after the previous item's right edge (within tolerance)
        if b.x < a.x + a.w - OVERLAP_TOLERANCE_PX {
            return false;
        }
        // Items in a horizontal row must share vertical overlap (same visual band)
        let v_overlap = (a.y + a.h).min(b.y + b.h) - a.y.max(b.y);
        let min_h = a.h.min(b.h);
        if min_h > 0.0 && v_overlap < -OVERLAP_TOLERANCE_PX {
            return false;
        }
    }
    true
}

fn is_monotonic_vertical(rects: &[Rect]) -> bool {
    for pair in rects.windows(2) {
        let a = pair[0];
        let b = pair[1];
        if b.y < a.y + a.h - OVERLAP_TOLERANCE_PX {
            return false;
        }
    }
    true
}

fn infer_padding(
    styles: &BTreeMap<String, String>,
    parent: Rect,
    children: &[Rect],
) -> Option<Padding> {
    let css_t = styles.get("padding-top").and_then(|v| parse_px(v));
    let css_r = styles.get("padding-right").and_then(|v| parse_px(v));
    let css_b = styles.get("padding-bottom").and_then(|v| parse_px(v));
    let css_l = styles.get("padding-left").and_then(|v| parse_px(v));

    let (top, right, bottom, left) =
        if css_t.is_some() || css_r.is_some() || css_b.is_some() || css_l.is_some() {
            (
                css_t.unwrap_or(0.0).max(0.0).round(),
                css_r.unwrap_or(0.0).max(0.0).round(),
                css_b.unwrap_or(0.0).max(0.0).round(),
                css_l.unwrap_or(0.0).max(0.0).round(),
            )
        } else if !children.is_empty() {
            let min_x = children.iter().map(|r| r.x).fold(f64::INFINITY, f64::min);
            let min_y = children.iter().map(|r| r.y).fold(f64::INFINITY, f64::min);
            let max_r = children
                .iter()
                .map(|r| r.x + r.w)
                .fold(f64::NEG_INFINITY, f64::max);
            let max_b = children
                .iter()
                .map(|r| r.y + r.h)
                .fold(f64::NEG_INFINITY, f64::max);
            (
                (min_y - parent.y).max(0.0).round(),
                (parent.x + parent.w - max_r).max(0.0).round(),
                (parent.y + parent.h - max_b).max(0.0).round(),
                (min_x - parent.x).max(0.0).round(),
            )
        } else {
            return None;
        };

    if top == 0.0 && right == 0.0 && bottom == 0.0 && left == 0.0 {
        return None;
    }
    if (top - right).abs() < 0.5 && (right - bottom).abs() < 0.5 && (bottom - left).abs() < 0.5 {
        return Some(Padding::Uniform(top));
    }
    if (top - bottom).abs() < 0.5 && (left - right).abs() < 0.5 {
        return Some(Padding::XY([top, left]));
    }
    Some(Padding::LtrB([top, right, bottom, left]))
}

fn infer_gap(
    styles: &BTreeMap<String, String>,
    mode: &LayoutMode,
    children: &[Rect],
) -> Option<f64> {
    let specific_key = match mode {
        LayoutMode::Horizontal => "column-gap",
        LayoutMode::Vertical => "row-gap",
        LayoutMode::None => return None,
    };
    if let Some(css_gap) = styles
        .get(specific_key)
        .or_else(|| styles.get("gap"))
        .and_then(|v| v.split_whitespace().next())
        .and_then(parse_px)
        .filter(|g| *g > 0.0)
    {
        return Some(css_gap.round());
    }
    if children.len() < 2 {
        return None;
    }
    let mut gaps: Vec<f64> = children
        .windows(2)
        .map(|pair| match mode {
            LayoutMode::Horizontal => (pair[1].x - (pair[0].x + pair[0].w)).max(0.0),
            LayoutMode::Vertical => (pair[1].y - (pair[0].y + pair[0].h)).max(0.0),
            LayoutMode::None => 0.0,
        })
        .collect();
    gaps.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
    let median = gaps[gaps.len() / 2].round();
    (median > 0.0).then_some(median)
}

fn infer_justify_content(styles: &BTreeMap<String, String>) -> Option<JustifyContent> {
    match styles.get("justify-content").map(String::as_str)? {
        "flex-start" | "start" | "left" => Some(JustifyContent::Start),
        "center" => Some(JustifyContent::Center),
        "flex-end" | "end" | "right" => Some(JustifyContent::End),
        "space-between" => Some(JustifyContent::SpaceBetween),
        "space-around" | "space-evenly" => Some(JustifyContent::SpaceAround),
        _ => None,
    }
}

fn infer_align_items(
    styles: &BTreeMap<String, String>,
    parent: Rect,
    mode: &LayoutMode,
    children: &[Rect],
) -> Option<AlignItems> {
    if let Some(raw) = styles.get("align-items").map(String::as_str) {
        match raw {
            "flex-start" | "start" | "self-start" => return Some(AlignItems::Start),
            "center" => return Some(AlignItems::Center),
            "flex-end" | "end" | "self-end" => return Some(AlignItems::End),
            _ => {}
        }
    }
    if matches!(mode, LayoutMode::Horizontal) && children.len() >= 2 {
        let parent_cy = parent.y + parent.h / 2.0;
        let all_centered = children
            .iter()
            .all(|r| ((r.y + r.h / 2.0) - parent_cy).abs() <= 3.0);
        if all_centered {
            return Some(AlignItems::Center);
        }
    }
    None
}
