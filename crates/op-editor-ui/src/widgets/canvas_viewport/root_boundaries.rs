//! Editor-only outlines for unselected top-level design roots.

use crate::layout_scene::{NodeKind, SceneNode};
use crate::widgets::PaintCx;
use crate::{Color, Point2D, Rect};

pub(super) fn paint(
    cx: &mut PaintCx<'_>,
    nodes: &[SceneNode],
    selected: &[String],
    device_frame_pair: Option<&(String, String)>,
    origin: Point2D,
    zoom: f32,
) {
    const BORDER: Color = Color {
        r: 0.68,
        g: 0.68,
        b: 0.68,
        a: 0.8,
    };
    for node in nodes {
        if node.hidden
            || device_frame_pair.is_some_and(|(frame, page)| &node.id == frame || &node.id == page)
            || !matches!(node.kind, NodeKind::Frame | NodeKind::Group)
            || selected.iter().any(|id| id == &node.id)
        {
            continue;
        }
        let bounds = if node.kind == NodeKind::Group {
            node.aggregate_bounds()
        } else {
            node.bounds
        };
        if bounds.size.x <= 0.0 || bounds.size.y <= 0.0 {
            continue;
        }
        let screen = Rect::xywh(
            origin.x + bounds.origin.x * zoom,
            origin.y + bounds.origin.y * zoom,
            bounds.size.x * zoom,
            bounds.size.y * zoom,
        );
        let transformed = node.flip_x || node.flip_y || node.rotation.abs() > f32::EPSILON;
        if transformed {
            let aggregate = node.aggregate_bounds();
            let pivot = Point2D::new(
                origin.x + (aggregate.origin.x + aggregate.size.x / 2.0) * zoom,
                origin.y + (aggregate.origin.y + aggregate.size.y / 2.0) * zoom,
            );
            cx.backend.save();
            if node.flip_x || node.flip_y {
                cx.backend.scale(
                    Point2D::new(
                        if node.flip_x { -1.0 } else { 1.0 },
                        if node.flip_y { -1.0 } else { 1.0 },
                    ),
                    pivot,
                );
            }
            if node.rotation.abs() > f32::EPSILON {
                cx.backend.rotate(node.rotation, pivot);
            }
        }
        cx.backend.stroke_rect(screen, BORDER, 1.0);
        if transformed {
            cx.backend.restore();
        }
    }
}
