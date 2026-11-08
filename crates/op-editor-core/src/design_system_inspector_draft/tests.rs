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
