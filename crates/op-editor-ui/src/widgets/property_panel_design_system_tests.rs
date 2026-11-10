use super::property_panel_commit::{commit_property_focus, property_focus_initial};
use super::property_panel_dispatch::{apply_property_action, PropertyActionContext};
use super::{PropertyPanel, PropertyPanelAction as A};
use crate::{Point2D, Rect};
use op_editor_core::design_system_inspector_draft::DesignSystemAction as D;
use op_editor_core::{EditorState, NodeId, PropertyFocus};
use serde_json::json;

fn state() -> EditorState {
    let mut state = EditorState::sample();
    state.doc.pages = None;
    state.doc.children = vec![serde_json::from_value(json!({
        "type":"rectangle","id":"a","fill":[{"type":"solid","color":"#ff0000"}]
    }))
    .unwrap()];
    state.selection.set = vec![NodeId::new("a")];
    state.selection.anchor = NodeId::new("a");
    state
}

fn dispatch(state: &mut EditorState, action: D) {
    apply_property_action(
        state,
        &A::DesignSystem(action),
        PropertyActionContext {
            now_ms: 10,
            resolved_sizing_fallback: None,
            image_adjustment_drag: &mut None,
            effect_radius_drag: &mut None,
        },
    );
}

fn input(state: &mut EditorState, index: usize, value: &str) {
    state.ui.property_focus = Some(PropertyFocus::DesignSystem(index));
    state.ui.property_input.set_text(value);
    assert!(commit_property_focus(state));
}

#[test]
fn design_system_inspector_inputs_and_capture_use_one_undo() {
    let mut state = state();
    let before = state.doc.clone();
    input(&mut state, 0, "brand");
    input(&mut state, 1, "Brand");
    let panel = PropertyPanel::for_selection(&state).unwrap();
    assert_eq!(
        property_focus_initial(PropertyFocus::DesignSystem(0), &panel),
        "brand"
    );
    assert!(!state.history.can_undo());
    dispatch(&mut state, D::CaptureStyle);
    assert_eq!(
        state.doc.shared_styles.as_ref().unwrap()["brand"].node_ids,
        ["a"]
    );
    assert!(state.undo());
    assert_eq!(state.doc, before);
    assert!(!state.history.can_undo());
}

#[test]
fn design_system_inspector_invalid_input_warns_without_undo() {
    let mut state = state();
    let before = state.doc.clone();
    input(&mut state, 7, "not json");
    dispatch(&mut state, D::ImportTokens);
    assert_eq!(state.doc, before);
    assert!(!state.history.can_undo());
    assert!(state.editor_ui.visible_toast(10).is_some());
}

#[test]
fn design_system_inspector_token_export_reads_back_into_textarea_without_history() {
    let mut state = state();
    state.doc.variables = Some(
        serde_json::from_value(json!({
            "spacing":{"type":"number","value":8}
        }))
        .unwrap(),
    );
    dispatch(&mut state, D::ExportTokens);
    let panel = PropertyPanel::for_selection(&state).unwrap();
    let json: serde_json::Value = serde_json::from_str(&property_focus_initial(
        PropertyFocus::DesignSystem(7),
        &panel,
    ))
    .unwrap();
    assert_eq!(json["spacing"]["$value"], 8.0);
    assert!(!state.history.can_undo());
}

#[test]
fn design_system_inspector_capture_is_reachable_through_scrolled_hit_testing() {
    let mut state = state();
    dispatch(&mut state, D::ToggleAdvanced);
    input(&mut state, 0, "brand");
    input(&mut state, 1, "Brand");
    let rect = Rect::xywh(0.0, 0.0, 280.0, 460.0);
    let reachable = (0..4000).step_by(32).any(|offset| {
        state.editor_ui.property_panel_scroll.offset = offset as f32;
        let panel = PropertyPanel::for_selection(&state).unwrap();
        (40..450).step_by(8).any(|y| {
            panel.hit_test_action(rect, Point2D::new(100.0, y as f32))
                == Some(A::DesignSystem(D::CreateStyle))
        })
    });
    assert!(
        reachable,
        "shared style capture must be reachable in the real inspector"
    );
}

#[test]
fn design_system_advanced_is_collapsed_and_toggle_is_session_only() {
    let mut state = state();
    let before = state.doc.clone();
    let collapsed = PropertyPanel::for_selection(&state).unwrap();
    let rect = Rect::xywh(0.0, 0.0, 280.0, 460.0);
    let collapsed_height = collapsed.content_height(rect);
    assert!(!state.ui.design_system_inspector.expanded);
    dispatch(&mut state, D::ToggleAdvanced);
    let expanded = PropertyPanel::for_selection(&state).unwrap();
    assert!(expanded.content_height(rect) > collapsed_height + 1000.0);
    assert_eq!(state.doc, before);
    assert!(!state.history.can_undo());
    dispatch(&mut state, D::ToggleAdvanced);
    assert_eq!(
        PropertyPanel::for_selection(&state)
            .unwrap()
            .content_height(rect),
        collapsed_height
    );
}

#[test]
fn coordinates_are_collapsed_but_alignment_and_radius_stay_reachable() {
    let mut state = state();
    let doc = state.doc.clone();
    let rect = Rect::xywh(0.0, 0.0, 280.0, 800.0);
    let panel = PropertyPanel::for_selection(&state).unwrap();
    let inputs = super::property_panel_sections::editable_input_rects(
        rect,
        panel.visible_sections(),
        &panel.snapshot.fills,
        &panel.snapshot.effects,
    );
    assert!(!inputs
        .iter()
        .any(|(focus, _)| *focus == PropertyFocus::PositionX));
    assert!(inputs
        .iter()
        .any(|(focus, _)| *focus == PropertyFocus::PositionR));
    let before = panel.content_height(rect);
    apply_property_action(
        &mut state,
        &A::TogglePositionAdvanced,
        PropertyActionContext {
            now_ms: 10,
            resolved_sizing_fallback: None,
            image_adjustment_drag: &mut None,
            effect_radius_drag: &mut None,
        },
    );
    let expanded = PropertyPanel::for_selection(&state).unwrap();
    let inputs = super::property_panel_sections::editable_input_rects(
        rect,
        expanded.visible_sections(),
        &expanded.snapshot.fills,
        &expanded.snapshot.effects,
    );
    assert!(inputs
        .iter()
        .any(|(focus, _)| *focus == PropertyFocus::PositionX));
    assert!(inputs
        .iter()
        .any(|(focus, _)| *focus == PropertyFocus::Rotation));
    assert!(expanded.content_height(rect) > before);
    assert_eq!(state.doc, doc);
    assert!(!state.history.can_undo());
}

#[test]
fn inherited_mode_is_reachable_without_opening_the_design_system_form() {
    let mut state = state();
    state.doc.themes = Some(
        [("theme".into(), vec!["light".into(), "dark".into()])]
            .into_iter()
            .collect(),
    );
    let rect = Rect::xywh(0.0, 0.0, 280.0, 460.0);
    let mut found = None;
    for offset in (0..4000).step_by(24) {
        state.editor_ui.property_panel_scroll.offset = offset as f32;
        let panel = PropertyPanel::for_selection(&state).unwrap();
        for y in (40..450).step_by(4) {
            let point = Point2D::new(140.0, y as f32);
            if panel.hit_test_action(rect, point) == Some(A::DesignSystem(D::CycleQuickMode)) {
                found = Some(point);
                break;
            }
        }
        if found.is_some() {
            break;
        }
    }
    assert!(
        found.is_some(),
        "quick mode remains reachable through the scrolled panel"
    );
    assert!(!state.ui.design_system_inspector.expanded);
    dispatch(&mut state, D::CycleQuickMode);
    assert_eq!(
        op_editor_core::design_system_inspector_draft::DesignSystemInspectorDraft::for_state(
            &state
        )
        .quick_mode
        .unwrap()
        .current,
        "dark"
    );
}

#[test]
fn design_system_inspector_browsing_is_local_collaboration_ui() {
    for action in [D::BrowseStyle(true), D::BrowseFinding(true)] {
        assert_eq!(
            super::property_panel_collab::collab_gate_action(&A::DesignSystem(action)),
            op_editor_core::CollabGateAction::LocalUi
        );
    }
}
