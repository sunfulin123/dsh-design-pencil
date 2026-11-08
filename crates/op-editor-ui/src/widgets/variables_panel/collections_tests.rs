use super::super::VariablesPanel;
use jian_ops_schema::variable::{VariableKind, VariableScalar};
use op_editor_core::host_variables_transitions::{
    add_variable, select_variable_axis, UNGROUPED_VARIABLES_TAB,
};
use op_editor_core::variable_library::import_library_variables;
use op_editor_core::EditorState;

fn cobalt_state() -> EditorState {
    let mut state = EditorState::new();
    import_library_variables(&mut state.doc, ["--primary-9".to_string()]);
    assert!(state.create_variable(
        "brand",
        VariableKind::Color,
        VariableScalar::Str("#123456".into())
    ));
    state
}

fn names(panel: &VariablesPanel) -> Vec<&str> {
    panel.rows.iter().map(|row| row.name.as_str()).collect()
}

#[test]
fn every_collection_is_a_tab_listing_only_its_members() {
    let mut state = cobalt_state();
    let panel = VariablesPanel::for_editor(&state);
    assert_eq!(
        panel.theme_tab_labels(),
        [
            "Color scheme (Primitives)",
            "Theme",
            UNGROUPED_VARIABLES_TAB
        ]
    );
    assert_eq!(names(&panel), ["--purple-9"]);

    select_variable_axis(&mut state, "Theme".into());
    let panel = VariablesPanel::for_editor(&state);
    assert_eq!(names(&panel), ["--primary-9"]);
    assert_eq!(
        panel.rows[0].alias_resolved,
        [Some(VariableScalar::Str("#5405BD".into()))],
        "alias shows what it resolves to"
    );

    select_variable_axis(&mut state, UNGROUPED_VARIABLES_TAB.into());
    assert_eq!(names(&VariablesPanel::for_editor(&state)), ["brand"]);
}

#[test]
fn alias_columns_resolve_in_their_own_mode() {
    let mut state = EditorState::new();
    import_library_variables(&mut state.doc, ["--text-default".to_string()]);
    let primitives = "Color scheme (Primitives)";
    state.doc.variables.as_mut().unwrap().insert(
        "probe".into(),
        jian_ops_schema::variable::VariableDefinition {
            kind: VariableKind::Color,
            value: jian_ops_schema::variable::VariableValue::Scalar(VariableScalar::Str(
                "$--gray-12".into(),
            )),
        },
    );
    state
        .doc
        .variable_collections
        .as_mut()
        .unwrap()
        .get_mut(primitives)
        .unwrap()
        .variables
        .insert("probe".into(), Default::default());
    let panel = VariablesPanel::for_editor(&state);
    let probe = panel.rows.iter().find(|r| r.name == "probe").unwrap();
    assert_eq!(
        probe.alias_resolved,
        [
            Some(VariableScalar::Str("#1D2123".into())),
            Some(VariableScalar::Str("#DEE2E5".into()))
        ]
    );
}

#[test]
fn adding_on_a_collection_tab_keeps_the_tab_and_joins_local_collections() {
    let mut state = cobalt_state();
    select_variable_axis(&mut state, UNGROUPED_VARIABLES_TAB.into());
    add_variable(
        &mut state,
        "color",
        VariableKind::Color,
        VariableScalar::Str("#000000".into()),
        0,
    );
    assert_eq!(
        state.editor_ui.variables_current_axis.as_deref(),
        Some(UNGROUPED_VARIABLES_TAB)
    );
    assert_eq!(names(&VariablesPanel::for_editor(&state)).len(), 2);
}

#[test]
fn pending_library_updates_offer_one_accept_action() {
    use super::super::{VariablesPanelHit, VARIABLES_PANEL_DEFAULT_HEIGHT, VARIABLES_PANEL_WIDTH};
    use crate::{Point2D, Rect};
    let mut state = cobalt_state();
    let rect = Rect {
        origin: Point2D::new(0.0, 0.0),
        size: Point2D::new(VARIABLES_PANEL_WIDTH, VARIABLES_PANEL_DEFAULT_HEIGHT),
    };
    assert!(VariablesPanel::for_editor(&state)
        .library_updates_rect(rect)
        .is_none());
    state
        .doc
        .variables
        .as_mut()
        .unwrap()
        .get_mut("--purple-9")
        .unwrap()
        .value =
        jian_ops_schema::variable::VariableValue::Scalar(VariableScalar::Str("#000000".into()));
    let panel = VariablesPanel::for_editor(&state);
    let button = panel.library_updates_rect(rect).expect("updates pending");
    let center = Point2D::new(
        button.origin.x + button.size.x / 2.0,
        button.origin.y + button.size.y / 2.0,
    );
    assert_eq!(
        panel.hit_test(rect, center),
        Some(VariablesPanelHit::AcceptLibraryUpdates)
    );
    assert!(op_editor_core::host_variables_transitions::accept_all_library_updates(&mut state));
    assert_eq!(VariablesPanel::for_editor(&state).library_updates, 0);
    assert!(state.undo());
    assert_eq!(VariablesPanel::for_editor(&state).library_updates, 1);
}
