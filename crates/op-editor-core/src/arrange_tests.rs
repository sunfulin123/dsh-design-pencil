//! Golden values ported from open-pencil's `tidy.test.ts`, which records
//! what Figma's Arrange › Tidy Up / Pack did to the same rectangles.

use super::*;
use crate::pen_node_ext::PenNodeExt;
use crate::test_support::{frame, rect, state_with};
use jian_ops_schema::node::PenNode;

fn boxes(at: &[(f64, f64)]) -> Vec<PlacedBox> {
    at.iter()
        .enumerate()
        .map(|(i, &(x, y))| PlacedBox {
            id: NodeId::new(format!("b{i}")),
            rect: DocRect {
                x,
                y,
                w: 100.0,
                h: 70.0,
            },
        })
        .collect()
}

fn tidy(at: &[(f64, f64)]) -> Vec<(f64, f64)> {
    tidy_positions(&boxes(at))
}

#[test]
fn tidy_spaces_single_row_from_first_box() {
    assert_eq!(
        tidy(&[(0.0, 0.0), (150.0, 10.0), (400.0, -5.0), (520.0, 8.0)]),
        vec![(0.0, 0.0), (173.0, 10.0), (346.0, -5.0), (519.0, 8.0)]
    );
    assert_eq!(
        tidy(&[(0.0, 0.0), (150.0, 0.0), (320.0, 0.0)]),
        vec![(0.0, 0.0), (160.0, 0.0), (320.0, 0.0)]
    );
}

#[test]
fn tidy_spaces_single_column() {
    assert_eq!(
        tidy(&[(0.0, 0.0), (0.0, 120.0), (0.0, 260.0)]),
        vec![(0.0, 0.0), (0.0, 130.0), (0.0, 260.0)]
    );
}

#[test]
fn tidy_lines_grid_up_at_midrange_rounding_half_up() {
    assert_eq!(
        tidy(&[(10.0, 0.0), (150.0, 0.0), (0.0, 120.0), (150.0, 120.0)]),
        vec![(5.0, 0.0), (150.0, 0.0), (5.0, 120.0), (150.0, 120.0)]
    );
    assert_eq!(
        tidy(&[(0.0, 0.0), (150.0, 0.0), (0.0, 120.0), (153.0, 120.0)]),
        vec![(0.0, 0.0), (152.0, 0.0), (0.0, 120.0), (152.0, 120.0)]
    );
}

#[test]
fn tidy_leaves_one_pixel_spread_alone() {
    let at = [(0.0, 0.0), (150.0, 0.0), (0.0, 120.0), (151.0, 120.0)];
    assert_eq!(tidy(&at), at.to_vec());
}

#[test]
fn tidy_evens_grid_gaps_when_they_differ() {
    assert_eq!(
        tidy(&[
            (0.0, 0.0),
            (170.0, 0.0),
            (330.0, 0.0),
            (8.0, 140.0),
            (160.0, 140.0),
            (345.0, 140.0)
        ]),
        vec![
            (4.0, 0.0),
            (171.0, 0.0),
            (338.0, 0.0),
            (4.0, 140.0),
            (171.0, 140.0),
            (338.0, 140.0)
        ]
    );
}

#[test]
fn pack_places_edge_to_edge_in_order() {
    let placed = pack_positions(&boxes(&[(300.0, 5.0), (0.0, 0.0), (120.0, 9.0)]), true);
    assert_eq!(placed, vec![(200.0, 5.0), (0.0, 0.0), (100.0, 9.0)]);
    let placed = pack_positions(&boxes(&[(0.0, 200.0), (4.0, 0.0)]), false);
    assert_eq!(placed, vec![(0.0, 70.0), (4.0, 0.0)]);
}

fn row_state() -> EditorState {
    let roots: Vec<PenNode> = [0.0, 150.0, 320.0]
        .iter()
        .enumerate()
        .map(|(i, &x)| rect(&format!("n{}", 10 + i), "r", x, 0.0, 100.0, 70.0))
        .collect();
    state_with(roots)
}

fn x_of(s: &EditorState, id: &str) -> f64 {
    find_node(s.active_children(), &NodeId::new(id))
        .unwrap()
        .base()
        .x
        .unwrap()
}

#[test]
fn arrange_nodes_by_explicit_ids_is_one_undo_step() {
    let mut s = row_state();
    let ids: Vec<NodeId> = ["n10", "n11", "n12"]
        .iter()
        .map(|i| NodeId::new(*i))
        .collect();
    assert!(s.arrange_nodes(&ids, ArrangeMode::Tidy));
    assert_eq!(x_of(&s, "n11"), 160.0);
    assert_eq!(s.history.past.len(), 1);
    // Already tidy: no motion, no history.
    assert!(!s.arrange_nodes(&ids, ArrangeMode::Tidy));
    assert_eq!(s.history.past.len(), 1);
}

#[test]
fn arrange_nodes_falls_back_to_selection() {
    let mut s = row_state();
    s.selection.set = vec![NodeId::new("n11"), NodeId::new("n12")];
    assert!(s.arrange_nodes(&[], ArrangeMode::PackHorizontal));
    assert_eq!(x_of(&s, "n12"), 250.0);
    assert_eq!(x_of(&s, "n10"), 0.0);
}

#[test]
fn arrange_rejects_mixed_parents_and_single_node() {
    let child = rect("n20", "c", 10.0, 10.0, 20.0, 20.0);
    let mut s = state_with(vec![
        frame("n10", "f", 0.0, 0.0, 200.0, 200.0, vec![child]),
        rect("n11", "r", 300.0, 0.0, 20.0, 20.0),
    ]);
    let mixed = [NodeId::new("n20"), NodeId::new("n11")];
    assert!(!s.arrange_nodes(&mixed, ArrangeMode::Tidy));
    assert_eq!(
        s.ui.design_reject.as_deref(),
        Some("nodes must share one parent")
    );
    assert!(!s.arrange_nodes(&[NodeId::new("n11")], ArrangeMode::Tidy));
    assert!(s.arrange_targets(&[NodeId::new("zz")]).is_err());
}

#[test]
fn arrange_mode_parses_wire_names() {
    assert_eq!(ArrangeMode::parse("tidy"), Some(ArrangeMode::Tidy));
    assert_eq!(
        ArrangeMode::parse("pack_h"),
        Some(ArrangeMode::PackHorizontal)
    );
    assert_eq!(
        ArrangeMode::parse("pack_vertical"),
        Some(ArrangeMode::PackVertical)
    );
    assert_eq!(ArrangeMode::parse("grid"), None);
}
