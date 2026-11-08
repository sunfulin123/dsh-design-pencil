use super::*;
use crate::layout_scene::NodeKind;

fn node(id: &str, kind: NodeKind, rect: Rect, children: Vec<SceneNode>) -> SceneNode {
    let mut n = SceneNode::leaf(id, kind);
    n.bounds = rect;
    n.children = children;
    n
}

fn scene() -> Vec<SceneNode> {
    let mut rotated = node(
        "rotated",
        NodeKind::Frame,
        Rect::xywh(100.0, 100.0, 200.0, 120.0),
        vec![
            node(
                "inner",
                NodeKind::Rect,
                Rect::xywh(120.0, 110.0, 40.0, 30.0),
                vec![],
            ),
            {
                let mut flipped = node(
                    "flipped",
                    NodeKind::Frame,
                    Rect::xywh(180.0, 150.0, 60.0, 40.0),
                    vec![node(
                        "deep",
                        NodeKind::Rect,
                        Rect::xywh(190.0, 160.0, 10.0, 10.0),
                        vec![],
                    )],
                );
                flipped.flip_x = true;
                flipped
            },
            {
                let mut hidden = node(
                    "ghost",
                    NodeKind::Rect,
                    Rect::xywh(130.0, 190.0, 20.0, 20.0),
                    vec![],
                );
                hidden.hidden = true;
                hidden
            },
        ],
    );
    rotated.rotation = 30.0;
    vec![
        rotated,
        node(
            "plain",
            NodeKind::Frame,
            Rect::xywh(500.0, 0.0, 100.0, 100.0),
            vec![node(
                "leaf",
                NodeKind::Rect,
                Rect::xywh(510.0, 10.0, 20.0, 20.0),
                vec![],
            )],
        ),
    ]
}

/// The live paint walk's hits, as the reference.
fn walked<'a>(
    roots: &'a [SceneNode],
    origin: Point2D,
    zoom: f32,
    hovered: Option<&'a str>,
    selected: Option<&'a str>,
) -> PaintNodeHits<'a> {
    let mut painter = DiscardPainter { dpi_scale: 1.0 };
    paint_scene_nodes_with_options_hiding(
        &mut PaintCx {
            backend: &mut painter,
        },
        roots,
        origin,
        zoom,
        None,
        Rect::xywh(-1e6, -1e6, 2e6, 2e6),
        None,
        hovered,
        selected,
        None,
        None,
        0,
        None,
        None,
        None,
        false,
    )
}

#[test]
fn direct_hits_match_the_paint_walk() {
    let roots = scene();
    let origin = Point2D::new(37.0, -12.0);
    for zoom in [0.5, 1.0, 2.5] {
        for hovered in [
            "rotated", "inner", "flipped", "deep", "plain", "leaf", "ghost", "missing",
        ] {
            for selected in [None, Some("deep"), Some("leaf"), Some("flipped")] {
                let expected = walked(&roots, origin, zoom, Some(hovered), selected);
                let actual = collect_hits(&roots, origin, zoom, Some(hovered), selected, None);
                let ctx = format!("hovered={hovered} selected={selected:?} zoom={zoom}");
                assert_eq!(actual.hover_rect, expected.hover_rect, "{ctx}");
                assert_eq!(actual.hover_transforms, expected.hover_transforms, "{ctx}");
                assert_eq!(
                    actual.hover_child_rects, expected.hover_child_rects,
                    "{ctx}"
                );
                assert_eq!(
                    actual.selected_node.map(|n| n.id.as_str()),
                    expected.selected_node.map(|n| n.id.as_str()),
                    "{ctx}"
                );
                assert_eq!(
                    actual.selected_transforms, expected.selected_transforms,
                    "{ctx}"
                );
            }
        }
    }
}
