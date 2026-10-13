//! Per-shape section tests — the Polygon side count and the Ellipse
//! arc inputs that only paint for their own node kind.
//!
//! Split out of `property_panel_tests.rs` to keep both files under
//! the openpencil 800-line cap.

use crate::widgets::property_panel::PropertyPanel;
use crate::widgets::property_panel_sections as sections;
use crate::widgets::property_panel_test_support::{state_from, visible_for};
use crate::{Point2D, Rect};
use op_editor_core::NodeId;

#[test]
fn position_alignment_separates_horizontal_and_vertical_controls() {
    use crate::widgets::PropertyPanelAction;
    use op_editor_core::AlignAction;
    let mut state = state_from(
        r##"{"version":"1.0.0","children":[
        {"type":"frame","id":"parent","width":200,"height":120,"layout":"none","children":[
        {"type":"rectangle","id":"child","x":80,"y":50,"width":40,"height":20}]}]}"##,
    );
    state.set_single_selection(NodeId::new("child"));
    let panel = PropertyPanel::for_selection(&state).unwrap();
    let rect = Rect::xywh(0.0, 0.0, 280.0, 1200.0);
    let actions = sections::action_button_rects(
        rect,
        visible_for(&panel),
        &panel.snapshot.effects,
        &panel.snapshot.fills,
        &panel.snapshot.interactions,
    );
    let action_rect = |action| {
        actions
            .iter()
            .find_map(|(candidate, rect)| {
                (*candidate == PropertyPanelAction::AlignSelection(action)).then_some(*rect)
            })
            .unwrap()
    };
    let horizontal = action_rect(AlignAction::Left);
    let vertical = action_rect(AlignAction::Top);
    assert_eq!(vertical.origin.y - horizontal.origin.y, 36.0);
    for (row, alignment, distribution) in [
        (horizontal, AlignAction::CenterH, AlignAction::DistributeH),
        (vertical, AlignAction::CenterV, AlignAction::DistributeV),
    ] {
        assert_eq!(action_rect(distribution).origin.y, row.origin.y);
        let target = action_rect(alignment);
        assert_eq!(
            panel.hit_test_action(
                rect,
                Point2D::new(
                    target.origin.x + target.size.x / 2.0,
                    target.origin.y + target.size.y / 2.0,
                )
            ),
            Some(PropertyPanelAction::AlignSelection(alignment))
        );
    }
    let mut backend = crate::widgets::property_panel_test_support::CountingBackend::default();
    crate::widgets::Widget::paint(
        &panel,
        &mut crate::widgets::PaintCx {
            backend: &mut backend,
        },
        rect,
    );
    for key in ["text.horizontal", "text.vertical"] {
        assert!(backend
            .texts
            .iter()
            .any(|text| text == op_i18n::translate(panel.locale, key)));
    }
}

#[test]
fn position_alignment_reflects_initial_geometry_and_remains_active_after_commands() {
    use op_editor_core::AlignAction;
    let mut state = state_from(
        r##"{"version":"1.0.0","children":[
        {"type":"frame","id":"parent","x":500,"y":300,"width":200,"height":120,"layout":"none","children":[
        {"type":"rectangle","id":"centered","x":80,"y":50,"width":40,"height":20},
        {"type":"rectangle","id":"corner","x":0,"y":0,"width":40,"height":20}]}]}"##,
    );
    state.set_single_selection(NodeId::new("centered"));
    assert_eq!(
        PropertyPanel::for_selection(&state)
            .unwrap()
            .alignment_active,
        [false, true, false, false, true, false, false, false]
    );
    for action in [AlignAction::Right, AlignAction::Bottom] {
        assert!(state.align_selected(action));
    }
    assert_eq!(
        PropertyPanel::for_selection(&state)
            .unwrap()
            .alignment_active,
        [false, false, true, false, false, true, false, false]
    );
    state.set_single_selection(NodeId::new("corner"));
    assert_eq!(
        PropertyPanel::for_selection(&state)
            .unwrap()
            .alignment_active,
        [true, false, false, true, false, false, false, false]
    );
    state.set_single_selection(NodeId::new("centered"));
    assert_eq!(
        PropertyPanel::for_selection(&state)
            .unwrap()
            .alignment_active,
        [false, false, true, false, false, true, false, false]
    );
}

#[test]
fn position_alignment_tracks_multiple_nodes_and_uniform_distribution() {
    use op_editor_core::AlignAction;
    let mut state = state_from(
        r##"{"version":"1.0.0","children":[
        {"type":"rectangle","id":"first","x":10,"y":20,"width":30,"height":40},
        {"type":"rectangle","id":"second","x":100,"y":80,"width":50,"height":60},
        {"type":"rectangle","id":"third","x":230,"y":190,"width":70,"height":20}]}"##,
    );
    state.set_single_selection(NodeId::new("first"));
    assert_eq!(
        PropertyPanel::for_selection(&state)
            .unwrap()
            .alignment_active,
        [false; 8]
    );
    state.toggle_selection(NodeId::new("second"));
    state.toggle_selection(NodeId::new("third"));
    assert!(
        !PropertyPanel::for_selection(&state)
            .unwrap()
            .alignment_active[6]
    );
    assert!(state.align_selected(AlignAction::DistributeH));
    assert!(
        PropertyPanel::for_selection(&state)
            .unwrap()
            .alignment_active[6]
    );
    assert!(state.align_selected(AlignAction::Left));
    let panel = PropertyPanel::for_selection(&state).unwrap();
    assert!(panel.alignment_active[0]);
    assert!(!panel.alignment_active[1]);
    assert!(!panel.alignment_active[2]);
}

#[test]
fn position_panel_exposes_alignment_for_single_and_multiple_selection() {
    let mut state = state_from(
        r##"{"version":"1.0.0","children":[
        {"type":"rectangle","id":"first","x":10,"y":20,"width":30,"height":40},
        {"type":"rectangle","id":"second","x":100,"y":80,"width":30,"height":40},
        {"type":"rectangle","id":"third","x":230,"y":190,"width":30,"height":40}
    ]}"##,
    );
    state.set_single_selection(NodeId::new("first"));
    let rect = Rect::xywh(0.0, 0.0, 280.0, 1200.0);
    for count in [1, 2, 3] {
        if count == 2 {
            state.toggle_selection(NodeId::new("second"));
        }
        if count == 3 {
            state.toggle_selection(NodeId::new("third"));
        }
        let mut panel = PropertyPanel::for_selection(&state).unwrap();
        let visible = visible_for(&panel);
        let component_height = if visible.create_component {
            crate::widgets::property_panel_inputs::create_component_block_height(
                visible.component_button,
            )
        } else {
            0.0
        };
        let point = Point2D::new(
            122.0,
            crate::widgets::property_panel_inputs::TAB_HEIGHT
                + crate::widgets::property_panel_inputs::HEADER_HEIGHT
                + component_height
                + crate::widgets::property_panel_inputs::SECTION_HEADER_HEIGHT
                + 15.0,
        );
        assert_eq!(
            panel.hit_test_action(rect, point),
            (count >= 2).then_some(crate::widgets::PropertyPanelAction::AlignSelection(
                op_editor_core::AlignAction::Left
            ))
        );
        let distribute = Point2D::new(245.0, point.y);
        assert_eq!(
            panel.hit_test_action(rect, distribute),
            (count == 3).then_some(crate::widgets::PropertyPanelAction::AlignSelection(
                op_editor_core::AlignAction::DistributeH
            ))
        );
        assert_eq!(
            panel.hit_test_action(rect, Point2D::new(point.x, point.y + 36.0)),
            (count >= 2).then_some(crate::widgets::PropertyPanelAction::AlignSelection(
                op_editor_core::AlignAction::Top
            ))
        );
        assert!(panel.hit_test(rect, point).is_none());
        panel.action_hover = panel.action_hover_index(rect, point);
        if count == 1 {
            assert!(panel.action_hover.is_none());
            continue;
        }
        assert!(panel.action_hover.is_some());
        let mut backend = crate::widgets::property_panel_test_support::CountingBackend::default();
        crate::widgets::Widget::paint(
            &panel,
            &mut crate::widgets::PaintCx {
                backend: &mut backend,
            },
            rect,
        );
        assert!(backend.texts.iter().any(|text| text
            == crate::widgets::align_toolbar::action_label(
                op_editor_core::AlignAction::Left,
                panel.locale,
            )));
    }
}

#[test]
fn polygon_selection_exposes_sides_layer_input() {
    let mut state = state_from(
        r##"{ "version": "1.0.0", "children": [
              {"type":"polygon","id":"poly","name":"Hex",
               "x":40,"y":40,"width":120,"height":120,
               "polygonCount":6}
        ]}"##,
    );
    state.set_single_selection(NodeId::new("poly"));
    let panel = PropertyPanel::for_selection(&state).expect("polygon panel");

    assert_eq!(panel.snapshot.polygon_sides, Some(6));

    let rect = Rect {
        origin: Point2D::new(0.0, 0.0),
        size: Point2D::new(280.0, 1200.0),
    };
    let sides_rect = sections::editable_input_rects(
        rect,
        visible_for(&panel),
        &panel.snapshot.fills,
        &panel.snapshot.effects,
    )
    .into_iter()
    .find(|(focus, _)| *focus == op_editor_core::PropertyFocus::PolygonSides)
    .map(|(_, r)| r)
    .expect("polygon side input rect");
    let center = Point2D::new(
        sides_rect.origin.x + sides_rect.size.x / 2.0,
        sides_rect.origin.y + sides_rect.size.y / 2.0,
    );
    assert_eq!(
        panel.hit_test(rect, center),
        Some(op_editor_core::PropertyFocus::PolygonSides)
    );
}

#[test]
fn ellipse_selection_exposes_arc_layer_inputs() {
    let mut state = state_from(
        r##"{ "version": "1.0.0", "children": [
              {"type":"ellipse","id":"ell","name":"Arc",
               "x":40,"y":40,"width":120,"height":100,
               "startAngle":30,"sweepAngle":270,"innerRadius":0.25}
        ]}"##,
    );
    state.set_single_selection(NodeId::new("ell"));
    let panel = PropertyPanel::for_selection(&state).expect("ellipse panel");

    let arc = panel.snapshot.ellipse_arc.expect("ellipse arc snapshot");
    assert_eq!(arc.start_deg, 30.0);
    assert_eq!(arc.sweep_deg, 270.0);
    assert_eq!(arc.inner_percent, 25.0);

    let rect = Rect {
        origin: Point2D::new(0.0, 0.0),
        size: Point2D::new(280.0, 1200.0),
    };
    let rects = sections::editable_input_rects(
        rect,
        visible_for(&panel),
        &panel.snapshot.fills,
        &panel.snapshot.effects,
    );
    for focus in [
        op_editor_core::PropertyFocus::EllipseStart,
        op_editor_core::PropertyFocus::EllipseSweep,
        op_editor_core::PropertyFocus::EllipseInnerRadius,
    ] {
        let target = rects
            .iter()
            .find(|(f, _)| *f == focus)
            .map(|(_, r)| *r)
            .expect("ellipse arc input rect");
        let center = Point2D::new(
            target.origin.x + target.size.x / 2.0,
            target.origin.y + target.size.y / 2.0,
        );
        assert_eq!(panel.hit_test(rect, center), Some(focus));
    }
}
