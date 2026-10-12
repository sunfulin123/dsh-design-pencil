use super::WidgetHost;

#[test]
fn maximizing_pinned_chat_keeps_its_column_geometry() {
    let mut host = WidgetHost::new();
    host.editor_state.editor_ui.enter_chat_tab();
    let before = host
        .ai_chat_rect(1200.0, 800.0)
        .expect("pinned chat visible");
    host.editor_state.chat.maximized = true;
    let after = host
        .ai_chat_rect(1200.0, 800.0)
        .expect("pinned chat still visible");
    assert_eq!(
        after, before,
        "the retired floating maximize flag cannot move the rail"
    );
    assert_eq!(after.origin.x, 0.0);
    assert_eq!(after.size.x, host.editor_state.editor_ui.layer_panel_width);
}

#[test]
fn vscode_embed_has_no_chat_rect() {
    let mut host = WidgetHost::new();
    host.editor_state.editor_ui.embed = op_editor_core::EmbedHost::VsCode;
    assert!(host.ai_chat_rect(1600.0, 1000.0).is_none());
}

#[test]
#[cfg(feature = "canvaskit")]
fn managed_new_and_open_keep_host_theme_and_hide_native_agent() {
    for mode in [op_editor_core::ThemeMode::Light, op_editor_core::ThemeMode::Dark] {
        let mut host = WidgetHost::new();
        host.editor_state.editor_ui.embed = op_editor_core::EmbedHost::VsCode;
        host.editor_state.editor_ui.set_host_theme_override(Some(mode));
        host.editor_state.editor_ui.host_theme_palette =
            [("primary".into(), "#336699".into())].into();
        let palette = host.editor_state.editor_ui.host_theme_palette.clone();
        let mut fresh = op_editor_core::EditorState::starter();
        crate::file_actions::preserve_app_preferences(&host.editor_state, &mut fresh);
        host.replace_editor_state(fresh);
        assert!(host.ai_chat_rect(1600.0, 1000.0).is_none());
        assert_eq!(host.editor_state.editor_ui.effective_theme_mode(), mode);
        assert_eq!(host.editor_state.editor_ui.host_theme_palette, palette);

        let opened = crate::file_actions::ingest_op_source(
            r#"{"version":"1.0","children":[]}"#,
            &host.editor_state,
        ).unwrap();
        host.install_ingested_state(opened.state);
        assert!(host.ai_chat_rect(1600.0, 1000.0).is_none());
        assert_eq!(host.editor_state.editor_ui.effective_theme_mode(), mode);
        assert_eq!(host.editor_state.editor_ui.host_theme_palette, palette);
    }
}

#[test]
fn ai_chat_collapse_click_stays_expanded_while_streaming_like_ts() {
    let mut host = WidgetHost::new();
    host.editor_state
        .chat
        .messages
        .push(op_editor_core::ChatMessage::assistant_streaming());
    let viewport_w = 1200.0;
    let viewport_h = 800.0;
    let rect = host
        .ai_chat_rect(viewport_w, viewport_h)
        .expect("chat panel visible");

    assert!(host.apply_click(
        rect.origin.x + 18.0,
        rect.origin.y + 16.0,
        viewport_w,
        viewport_h
    ));

    assert!(
        !host.editor_state.chat.is_minimized(),
        "TS immediately reopens a minimized chat while a response is streaming"
    );
}
