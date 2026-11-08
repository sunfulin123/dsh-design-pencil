use super::*;
use crate::layout_scene::NodeKind;

const T: f32 = TILE_PX as f32;

/// A canvas exactly 2×2 tiles big at zoom 1, offset in the window.
fn view(pan_x: f32, pan_y: f32, zoom: f32) -> TileView {
    TileView {
        canvas: Rect::xywh(100.0, 40.0, T * 1.6, T * 1.2),
        pan: Point2D::new(pan_x, pan_y),
        zoom,
    }
}

#[test]
fn levels_and_cells_cover_the_view() {
    assert_eq!(pow2_at_least(0.7), 1.0);
    assert_eq!(pow2_at_least(1.0), 1.0);
    assert_eq!(pow2_at_least(1.4), 2.0);
    assert_eq!(pow2_at_least(0.1), 0.125);
    assert_eq!(
        overview_scale(Rect::xywh(0.0, 0.0, 15000.0, 20000.0)),
        1.0 / 16.0
    );
    assert_eq!(overview_scale(Rect::xywh(0.0, 0.0, 300.0, 200.0)), 1.0);
    let keys = cells(1.0, Rect::xywh(-10.0, 0.0, T * 2.0 + 6.0, T));
    assert_eq!(
        keys.iter().map(|k| (k.tx, k.ty)).collect::<Vec<_>>(),
        vec![(-1, 0), (0, 0), (1, 0)]
    );
    assert_eq!(
        TileKey {
            level: 0.5f32.to_bits(),
            tx: 1,
            ty: -1
        }
        .doc_rect(),
        Rect::xywh(T * 2.0, -T * 2.0, T * 2.0, T * 2.0)
    );
}

#[test]
fn ready_tiles_draw_where_their_document_area_is() {
    let v = view(-T, 0.0, 1.0);
    let plan = plan_composite(&v, 1.0, &[1.0], |_| TileSlot::Ready {
        id: 7,
        stale: false,
    });
    assert!(plan.complete);
    assert!(plan.missing.is_empty());
    let first = plan
        .draws
        .iter()
        .find(|d| d.key.tx == 1 && d.key.ty == 0)
        .unwrap();
    assert_eq!(first.dst, Rect::xywh(100.0, 40.0, T, T));
    assert_eq!(first.src, Rect::xywh(0.0, 0.0, T, T));
}

#[test]
fn missing_tiles_fall_back_to_the_nearest_complete_level() {
    let v = view(0.0, 0.0, 1.0);
    let coarse = 0.25f32.to_bits();
    let plan = plan_composite(&v, 1.0, &[1.0, 0.25, 0.0625], |key| {
        if key.level == coarse {
            TileSlot::Ready {
                id: 3,
                stale: false,
            }
        } else {
            TileSlot::Missing
        }
    });
    assert!(plan.complete, "the coarse level covers every hole");
    assert_eq!(plan.missing.len(), 4, "the view spans 2x2 tiles");
    assert!(plan.draws.iter().all(|d| d.id == 3));
    // Tile (0,0) at 1x is the top-left quarter of coarse tile (0,0).
    let piece = plan
        .draws
        .iter()
        .find(|d| d.dst.origin == Point2D::new(100.0, 40.0))
        .unwrap();
    assert_eq!(piece.src, Rect::xywh(0.0, 0.0, T / 4.0, T / 4.0));
    assert_eq!(
        plan.missing[0],
        TileKey {
            level: 1f32.to_bits(),
            tx: 0,
            ty: 0
        },
        "centre first"
    );
}

#[test]
fn uncovered_holes_are_reported_and_empty_tiles_count_as_covered() {
    let v = view(0.0, 0.0, 1.0);
    let plan = plan_composite(&v, 1.0, &[1.0], |_| TileSlot::Missing);
    assert!(!plan.complete);
    let plan = plan_composite(&v, 1.0, &[1.0], |_| TileSlot::Empty);
    assert!(plan.complete && plan.draws.is_empty() && plan.missing.is_empty());
}

#[test]
fn stale_tiles_still_draw_and_ring_tiles_are_prefetched() {
    let v = view(0.0, 0.0, 1.0);
    let plan = plan_composite(&v, 1.0, &[1.0], |key| {
        if key.tx >= 0 && key.tx < 2 && key.ty >= 0 && key.ty < 2 {
            TileSlot::Ready {
                id: 1,
                stale: key.tx == 1,
            }
        } else {
            TileSlot::Missing
        }
    });
    assert!(plan.complete);
    assert_eq!(plan.stale.len(), 2);
    assert_eq!(
        plan.prefetch.len(),
        32,
        "the two-tile ring around a 2x2 view"
    );
}

fn node(id: &str, x: f32, children: Vec<SceneNode>) -> SceneNode {
    let mut n = SceneNode::leaf(id, NodeKind::Rect);
    n.bounds = Rect::xywh(x, 0.0, 10.0, 10.0);
    n.children = children;
    n
}

#[test]
fn diff_reports_only_changed_subtrees() {
    let tree = || {
        vec![
            node(
                "a",
                0.0,
                vec![node("a1", 0.0, vec![]), node("a2", 100.0, vec![])],
            ),
            node("b", 500.0, vec![]),
        ]
    };
    let mut old = tree();
    let mut new = tree();
    assert!(changed_regions(&mut old, &mut new, 0.0).is_empty());
    new[0].children[1].bounds.origin.x = 120.0;
    let rects = changed_regions(&mut old, &mut new, 2.0);
    assert_eq!(
        rects,
        vec![
            Rect::xywh(98.0, -2.0, 14.0, 14.0),
            Rect::xywh(118.0, -2.0, 14.0, 14.0)
        ]
    );
    assert_eq!(old, tree(), "diffing restores children");
    let mut grown = tree();
    grown.push(node("c", 900.0, vec![]));
    let rects = changed_regions(&mut tree(), &mut grown, 0.0);
    assert_eq!(rects, vec![Rect::xywh(900.0, 0.0, 10.0, 10.0)]);
}
