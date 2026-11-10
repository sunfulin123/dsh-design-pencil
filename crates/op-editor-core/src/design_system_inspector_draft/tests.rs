use super::*;
use crate::{EditorState, NodeId, PenNodeExt};
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

#[test]
fn creating_styles_generates_unique_ids_and_never_updates_a_selected_style() {
    let mut state = state();
    state.ui.design_system_inspector.values[1] = "Brand".into();
    execute(&mut state, DesignSystemAction::CreateStyle).unwrap();
    let first = state.ui.design_system_inspector.values[0].clone();
    assert!(!first.is_empty());
    execute(&mut state, DesignSystemAction::CreateStyle).unwrap();
    let second = state.ui.design_system_inspector.values[0].clone();
    assert_ne!(first, second);
    assert_eq!(state.doc.shared_styles.as_ref().unwrap().len(), 2);
    state.ui.design_system_inspector.values[1] = "Renamed".into();
    execute(&mut state, DesignSystemAction::UpdateStyle).unwrap();
    assert_eq!(
        state.doc.shared_styles.as_ref().unwrap()[&second].name,
        "Renamed"
    );
    assert_eq!(
        state.doc.shared_styles.as_ref().unwrap()[&first].name,
        "Brand"
    );
    assert!(state.undo());
    assert_eq!(
        state.doc.shared_styles.as_ref().unwrap()[&second].name,
        "Brand"
    );
}

#[test]
fn mode_pickers_read_current_collections_and_reject_stale_options() {
    let mut state = state();
    state.doc.themes = Some(
        [("Theme".into(), vec!["Light".into(), "Dark".into()])]
            .into_iter()
            .collect(),
    );
    execute(&mut state, DesignSystemAction::SelectCollection(0)).unwrap();
    assert_eq!(state.ui.design_system_inspector.values[5], "Theme");
    assert_eq!(state.ui.design_system_inspector.values[6], "auto");
    execute(&mut state, DesignSystemAction::SelectMode(2)).unwrap();
    assert_eq!(state.ui.design_system_inspector.values[6], "Dark");
    state.doc.themes = None;
    assert!(execute(&mut state, DesignSystemAction::SelectMode(2)).is_err());
}

#[test]
fn inspector_captures_applies_and_updates_shared_style_with_single_undo() {
    let mut state = state();
    let before = state.doc.clone();
    state.ui.design_system_inspector.values[0] = "brand".into();
    state.ui.design_system_inspector.values[1] = "Brand".into();
    execute(&mut state, DesignSystemAction::CaptureStyle).unwrap();
    assert_eq!(
        state.doc.shared_styles.as_ref().unwrap()["brand"].node_ids,
        ["a"]
    );
    assert!(state.undo());
    assert_eq!(state.doc, before);
    assert!(!state.history.can_undo());
    assert!(state.redo());
    execute(&mut state, DesignSystemAction::DetachStyle).unwrap();
    assert!(state.doc.shared_styles.as_ref().unwrap()["brand"]
        .node_ids
        .is_empty());
    execute(&mut state, DesignSystemAction::ApplyStyle).unwrap();
    assert_eq!(
        state.doc.shared_styles.as_ref().unwrap()["brand"].node_ids,
        ["a"]
    );
    state.ui.design_system_inspector.values[1] = "Renamed".into();
    execute(&mut state, DesignSystemAction::CaptureStyle).unwrap();
    assert_eq!(
        state.doc.shared_styles.as_ref().unwrap()["brand"].name,
        "Renamed"
    );
    execute(&mut state, DesignSystemAction::DeleteStyle).unwrap();
    assert!(state
        .doc
        .shared_styles
        .as_ref()
        .is_none_or(|styles| styles.is_empty()));
}

#[test]
fn inspector_formulas_bindings_modes_and_tokens_use_canonical_commands() {
    let mut state = state();
    state.doc.variables = Some(
        serde_json::from_value(json!({
            "accent":{"type":"color","value":"#22c55e"},
            "spacing":{"type":"number","value":8}
        }))
        .unwrap(),
    );
    state.doc.themes = Some(
        [("mode".into(), vec!["light".into(), "dark".into()])]
            .into_iter()
            .collect(),
    );
    state.ui.design_system_inspector.values[2] = "accent".into();
    execute(&mut state, DesignSystemAction::Bind).unwrap();
    assert_eq!(
        serde_json::to_value(state.selected_node().unwrap()).unwrap()["fill"][0]["color"],
        "$accent"
    );
    execute(&mut state, DesignSystemAction::Unbind).unwrap();
    assert_eq!(
        serde_json::to_value(state.selected_node().unwrap()).unwrap()["fill"][0]["color"],
        "#22c55e"
    );
    state.ui.design_system_inspector.values[2] = "double".into();
    state.ui.design_system_inspector.values[4] = "calc($spacing * 2)".into();
    execute(&mut state, DesignSystemAction::SetFormula).unwrap();
    assert_eq!(
        DesignSystemInspectorDraft::for_state(&state).variable_value,
        "16"
    );
    state.ui.design_system_inspector.values[5] = "mode".into();
    state.ui.design_system_inspector.values[6] = "dark".into();
    execute(&mut state, DesignSystemAction::SetMode).unwrap();
    assert_eq!(
        DesignSystemInspectorDraft::for_state(&state).mode_value,
        "dark"
    );
    execute(&mut state, DesignSystemAction::ExportTokens).unwrap();
    let tokens: serde_json::Value =
        serde_json::from_str(&state.ui.design_system_inspector.values[7]).unwrap();
    assert_eq!(tokens["double"]["$value"], 16.0);
    state.ui.design_system_inspector.values[7] =
        json!({"gap":{"$type":"number","$value":24}}).to_string();
    let before = state.doc.clone();
    execute(&mut state, DesignSystemAction::ImportTokens).unwrap();
    assert_eq!(
        state.resolve_variable("gap"),
        Some(&jian_ops_schema::variable::VariableScalar::Num(24.0))
    );
    assert!(state.undo());
    assert_eq!(state.doc, before);
}

#[test]
fn open_mode_picker_rejects_reordered_choices_instead_of_applying_another_mode() {
    let mut state = state();
    state.doc.themes = Some(
        [("mode".into(), vec!["light".into(), "dark".into()])]
            .into_iter()
            .collect(),
    );
    state.ui.design_system_inspector.values[5] = "mode".into();
    execute(&mut state, DesignSystemAction::TogglePicker(2)).unwrap();
    state
        .doc
        .themes
        .as_mut()
        .unwrap()
        .get_mut("mode")
        .unwrap()
        .swap(0, 1);
    let before = state.doc.clone();
    assert!(execute(&mut state, DesignSystemAction::SelectMode(1)).is_err());
    assert!(state.ui.design_system_inspector.picker.is_none());
    assert_eq!(state.doc, before);
}

#[test]
fn quick_mode_switch_is_local_to_the_selected_layer_and_undoable() {
    let mut state = state();
    state.doc.themes = Some(
        [("mode".into(), vec!["light".into(), "dark".into()])]
            .into_iter()
            .collect(),
    );
    let before = state.doc.clone();
    let quick = DesignSystemInspectorDraft::for_state(&state)
        .quick_mode
        .unwrap();
    assert_eq!(quick.current, "light");
    assert!(!quick.explicit);
    execute(&mut state, DesignSystemAction::CycleQuickMode).unwrap();
    let quick = DesignSystemInspectorDraft::for_state(&state)
        .quick_mode
        .unwrap();
    assert_eq!(quick.current, "dark");
    assert!(quick.explicit);
    assert!(state.undo());
    assert_eq!(state.doc, before);
}

#[test]
fn inspector_invalid_formula_tokens_and_stale_lint_preserve_document() {
    let mut state = state();
    let before = state.doc.clone();
    state.ui.design_system_inspector.values[2] = "cycle".into();
    state.ui.design_system_inspector.values[4] = "calc($cycle * 2)".into();
    assert!(execute(&mut state, DesignSystemAction::SetFormula).is_err());
    state.ui.design_system_inspector.values[7] = "{broken".into();
    assert!(execute(&mut state, DesignSystemAction::ImportTokens).is_err());
    state.ui.design_system_inspector.lint_ids = vec!["stale".into()];
    assert!(execute(&mut state, DesignSystemAction::FixLint).is_err());
    assert_eq!(state.doc, before);
    assert!(!state.history.can_undo());
}

#[test]
fn inspector_lint_readback_exposes_each_findings_target_and_reason() {
    let mut state = state();
    state.doc.children = serde_json::from_value(json!([
        {"type":"frame","id":"a","children":[
            {"type":"path","id":"empty-a"},{"type":"path","id":"empty-b"}
        ]}
    ]))
    .unwrap();
    execute(&mut state, DesignSystemAction::Lint).unwrap();
    let draft = &state.ui.design_system_inspector;
    assert_eq!(draft.lint_findings.len(), 2);
    assert_eq!(draft.lint_findings[0].0, "empty-a");
    assert!(!draft.lint_findings[0].1.is_empty());
    execute(&mut state, DesignSystemAction::BrowseFinding(true)).unwrap();
    assert_eq!(state.ui.design_system_inspector.lint_index, 1);
    execute(&mut state, DesignSystemAction::FixFinding).unwrap();
    assert_eq!(state.doc.children[0].children().unwrap().len(), 1);
    assert_eq!(
        state.doc.children[0].children().unwrap()[0].base().id,
        "empty-a"
    );
    assert!(state.undo());
    assert_eq!(state.doc.children[0].children().unwrap().len(), 2);
}
