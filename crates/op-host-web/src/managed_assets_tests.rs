use op_editor_core::EditorState;
use serde_json::json;

#[test]
fn managed_asset_cards_are_state_scoped_and_never_publish_to_global_registries() {
    let mut a = EditorState::new();
    let mut b = EditorState::new();
    a.editor_ui.managed_assets = Some(Default::default());
    b.editor_ui.managed_assets = Some(Default::default());
    a.editor_ui.managed_assets.as_mut().unwrap().install(1, vec![
        json!({"id":"user:guide","kind":"style-guide","name":"Scoped style","tags":["warm"],"platform":"webapp","swatches":["#123456"]}),
        json!({"id":"user:template","kind":"scene-template","name":"Scoped board","frames":1}),
    ]).unwrap();
    assert_eq!(
        op_editor_ui::widgets::asset_center_style_cards::cards_for_editor(&a, "Scoped").len(),
        1
    );
    assert_eq!(
        op_editor_ui::widgets::asset_center_style_cards::cards_for_editor(&b, "Scoped").len(),
        0
    );
    assert_eq!(
        a.editor_ui.managed_assets.as_ref().unwrap().templates.len(),
        1
    );
    assert_eq!(
        b.editor_ui.managed_assets.as_ref().unwrap().templates.len(),
        0
    );
    assert_eq!(
        op_editor_ui::widgets::asset_center_style_cards::cards_for_editor(
            &EditorState::new(),
            "Scoped"
        )
        .len(),
        0
    );
}

#[test]
fn managed_style_import_waits_for_persistence_instead_of_editing_or_registering_early() {
    let mut state = EditorState::new();
    state.editor_ui.managed_assets = Some(Default::default());
    let before = state.doc.clone();
    op_editor_ui::widgets::press_flow::import_style_guide_text(
        &mut state,
        "# Managed style\n\nAccent #123456.",
        "Managed",
    );
    assert_eq!(state.doc, before);
    let pending = state
        .editor_ui
        .managed_assets
        .as_mut()
        .unwrap()
        .pending
        .pop_front()
        .unwrap();
    assert_eq!(pending.0, "import_design_md");
    assert_eq!(pending.1["markdown"], "# Managed style\n\nAccent #123456.");
}

#[test]
fn malformed_asset_catalog_never_replaces_the_last_known_good_view() {
    let mut view = op_editor_core::managed_assets::ManagedAssets::default();
    view.install(
        1,
        vec![json!({"id":"user:a","kind":"style-guide","name":"Good"})],
    )
    .unwrap();
    assert!(view
        .install(2, vec![json!({"id":"user:bad","name":"Missing kind"})])
        .is_err());
    assert_eq!(view.revision, 1);
    assert_eq!(view.entries.len(), 1);
}

#[test]
fn temporary_editor_theme_keeps_device_preference_and_document_history() {
    let mut state = EditorState::new();
    state.editor_ui.theme_mode = op_editor_core::ThemeMode::Light;
    let document = state.doc.clone();
    let history = state.history.clone();
    let result = crate::managed_assets_sync::apply_editor_control(
        &mut state,
        "set_editor_theme",
        &json!({"theme":"dark"}),
        |_| panic!("temporary changes must never persist"),
    )
    .unwrap();
    assert_eq!(result["effective"], "dark");
    assert_eq!(result["preference"], "light");
    assert_eq!(state.doc, document);
    assert_eq!(state.history.past, history.past);
    assert_eq!(state.history.future, history.future);
    state
        .editor_ui
        .set_host_theme_override(Some(op_editor_core::ThemeMode::Light));
    assert!(crate::managed_assets_sync::apply_editor_control(
        &mut state,
        "set_editor_theme",
        &json!({"theme":"dark","persist":true}),
        |_| panic!("host locked changes must never persist"),
    )
    .is_err());
    assert_eq!(state.editor_ui.theme_mode, op_editor_core::ThemeMode::Light);
}

#[test]
fn managed_preset_save_and_delete_wait_for_persistence_without_changing_the_local_list() {
    let mut state = EditorState::new();
    state.editor_ui.managed_assets = Some(Default::default());
    assert!(state.save_theme_preset("Brand", 1));
    assert!(state.theme_presets.is_empty());
    let action = state
        .editor_ui
        .managed_assets
        .as_mut()
        .unwrap()
        .pending
        .pop_front()
        .unwrap();
    assert_eq!(action.0, "save_theme_preset");
    assert!(state.delete_theme_preset("user:brand"));
    let action = state
        .editor_ui
        .managed_assets
        .as_mut()
        .unwrap()
        .pending
        .pop_front()
        .unwrap();
    assert_eq!(action.0, "delete_theme_preset");
    assert_eq!(state.revision, 0);
}
