use super::*;
use op_editor_core::{EditorState, Locale};

#[test]
fn managed_settings_do_not_restore_or_migrate_provider_credentials() {
    let mut state = EditorState::new();
    state.editor_ui.embed = op_editor_core::EmbedHost::VsCode;
    let before = fingerprint(&state);
    let load = load_into_with(
        &mut state,
        Some(
            r#"{"version":1,"locale":"ja","builtin_agents":[{"id":"private","api_key":"private-key"}]}"#,
        ),
        None,
        |_, _| panic!("managed runtime must not migrate stored settings"),
    );
    assert_eq!(fingerprint(&state), before);
    assert!(!load.loaded);
    assert!(!load.write_pending);
    assert!(load.initial_settings_fingerprint(&state).is_none());
    assert!(load.initial_fingerprint(&state).write_disabled);
    let mut settings_before = fingerprint(&state);
    let mut credentials_before = credential_fingerprint(&state);
    state.editor_ui.locale = Locale::Ja;
    state.editor_ui.agent_settings.openverse_client_id = "managed-provider".into();
    state.editor_ui.agent_settings.openverse_client_secret = "private-key".into();
    assert!(!save_if_changed_with(&state, &mut settings_before, |_| {
        panic!("managed runtime must not persist settings")
    }));
    assert!(
        save_credentials_if_changed_with(&state, &mut credentials_before, |_, _| panic!(
            "managed runtime must not persist credentials"
        ),)
        .is_none()
    );
}
