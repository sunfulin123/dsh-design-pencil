use super::WidgetHost;
use op_editor_core::EditorCommand;
use op_editor_ui::widgets::file_menu::FileMenu;

#[test]
fn embedded_editors_expose_recovery_through_the_view_menu_keyboard_route() {
    let mut host = WidgetHost::new();
    host.editor_state.editor_ui.embed = op_editor_core::EmbedHost::VsCode;
    host.editor_state.editor_ui.draft_recovery_supported = true;
    assert!(host.view_options_key("0", true, false, true));
    assert!(host.view_options_key("End", false, false, false));
    assert!(host.view_options_key("Enter", false, false, false));
    assert!(host.take_draft_recovery_request());
    assert!(!host.editor_state.editor_ui.view_options_open);
    assert_eq!(host.editor_state.editor_ui.ui_scale.percent(), 100);
    assert!(!host.editor_state.history.can_undo());
}

#[test]
fn recovery_menu_requests_host_ui_without_changing_content_at_supported_scales() {
    for (width, height) in [(1440.0, 900.0), (390.0, 844.0)] {
        for percent in [100, 110, 125, 150] {
            let mut host = WidgetHost::new();
            host.editor_state
                .apply(EditorCommand::SetUiScale { percent });
            let scale = percent as f32 / 100.0;
            host.editor_state.editor_ui.draft_recovery_supported = true;
            host.editor_state.editor_ui.file_menu_open = true;
            let original = host.editor_state.doc.clone();
            let revision = host.editor_state.document_revision();
            let menu = FileMenu::from_editor_ui(&host.editor_state.editor_ui, 0);
            let anchor = host
                .top_bar()
                .file_menu_rect_for(host.top_bar_rect(width / scale));
            let rect = menu.rect_at(anchor);
            host.apply_press(
                (rect.origin.x + 30.0) * scale,
                (rect.origin.y + rect.size.y - 21.0) * scale,
                width,
                height,
            );
            assert!(host.take_draft_recovery_request(), "{width}/{percent}");
            assert!(!host.take_draft_recovery_request());
            assert!(!host.editor_state.editor_ui.file_menu_open);
            assert_eq!(host.editor_state.doc, original);
            assert_eq!(host.editor_state.document_revision(), revision);
            assert!(!host.editor_state.history.can_undo());
        }
    }
}
