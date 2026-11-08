use super::WidgetHost;
use op_editor_core::{EditorCommand, EmbedHost};
use op_editor_ui::widgets::view_options::{ViewOption, ViewOptions};

const DRAWIO: &str = r#"<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/><mxCell id="a" parent="1" vertex="1" value="Hello"><mxGeometry x="10" y="20" width="100" height="60"/></mxCell></root></mxGraphModel>"#;
const COMPRESSED_DRAWIO: &str = "<mxfile><diagram>jVBBCgMhDHxN7lahH7Db7aWPEAxV0LoE27q/r10ji5RCD4FkJjMZAkrHMpNZ3DVZDKAmUJpSyq2LRWMIIIW3oE4gpagF8vyDPWysWAzhPf8jMN8C9ngiZSwjZMIDG3KpNumDsu2MKWKmtW51TTss1jZyDvHyNru+wZhDf3N8/TjkrQ1H7uP+mo0bPvcG</diagram></mxfile>";

#[test]
fn diagram_picker_is_reachable_in_managed_embed_via_view_menu_keyboard() {
    let mut host = WidgetHost::new();
    host.editor_state.editor_ui.embed = EmbedHost::VsCode;
    host.editor_state.editor_ui.diagram_import_supported = true;
    assert!(host.view_options_key("0", true, false, true));
    assert!(host.view_options_key("End", false, false, false));
    assert!(host.view_options_key("Enter", false, false, false));
    assert!(host.take_diagram_import_request());
    assert!(!host.take_diagram_import_request());
    assert!(!host.editor_state.editor_ui.view_options_open);
    assert!(!host.editor_state.history.can_undo());
    let menu = ViewOptions::for_editor(&host.editor_state);
    assert_eq!(menu.option_for(5), Some(ViewOption::ImportDiagram));
    host.editor_state.editor_ui.draft_recovery_supported = true;
    let menu = ViewOptions::for_editor(&host.editor_state);
    assert_eq!(menu.option_count(), 7);
    assert_eq!(menu.option_for(6), Some(ViewOption::RecoverDrafts));
}

#[test]
fn diagram_picker_pointer_route_is_reachable_at_mobile_and_desktop_scales() {
    for (width, height) in [(390.0, 844.0), (1440.0, 900.0)] {
        for percent in [100, 150] {
            for recovery in [false, true] {
                let mut host = WidgetHost::new();
                host.editor_state.editor_ui.embed = EmbedHost::VsCode;
                host.editor_state.editor_ui.diagram_import_supported = true;
                host.editor_state.editor_ui.draft_recovery_supported = recovery;
                host.editor_state
                    .apply(EditorCommand::SetUiScale { percent });
                host.editor_state.editor_ui.view_options_open = true;
                let scale = percent as f32 / 100.0;
                let menu = ViewOptions::for_editor(&host.editor_state);
                let rect = menu.rect_for(
                    host.status_bar_rect(width / scale, height / scale),
                    width / scale,
                    height / scale,
                );
                host.apply_press(
                    (rect.origin.x + 30.0) * scale,
                    (rect.origin.y + 145.0) * scale,
                    width,
                    height,
                );
                assert!(
                    host.take_diagram_import_request(),
                    "{width}/{percent}/{recovery}"
                );
                assert!(!host.take_draft_recovery_request());
                assert!(!host.editor_state.history.can_undo());
            }
        }
    }
}

#[test]
fn actual_diagram_file_route_inserts_editable_content_with_single_undo_redo() {
    for (name, source) in [
        ("flow.mmd", "flowchart LR\nA[Start] --> B{Ready?}"),
        ("flow.MERMAID", "graph TD\nA --> B"),
        ("flow.drawio", DRAWIO),
        ("flow.XML", DRAWIO),
        ("compressed.drawio", COMPRESSED_DRAWIO),
    ] {
        let mut host = WidgetHost::new();
        let original = host.editor_state.doc.clone();
        let count = host.editor_state.active_children().len();
        assert!(
            host.import_diagram_file(name, source, 1440.0, 900.0),
            "{name}"
        );
        let imported = host.editor_state.doc.clone();
        assert_eq!(host.editor_state.active_children().len(), count + 1);
        assert!(host.editor_state.apply(EditorCommand::Undo));
        assert_eq!(host.editor_state.doc, original);
        assert!(!host.editor_state.history.can_undo());
        assert!(host.editor_state.apply(EditorCommand::Redo));
        assert_eq!(host.editor_state.doc, imported);
    }
}

#[test]
fn invalid_unsupported_oversize_or_non_diagram_file_is_atomic_and_shows_error() {
    let oversized = "x".repeat(super::diagram_import::MAX_DIAGRAM_FILE_BYTES + 1);
    for (name, source) in [
        ("bad.mmd", "sequenceDiagram\nAlice->>Bob: hello"),
        ("bad.drawio", "<mxfile>"),
        ("ordinary.txt", "hello world"),
        ("huge.xml", oversized.as_str()),
    ] {
        let mut host = WidgetHost::new();
        let original = host.editor_state.doc.clone();
        assert!(!host.import_diagram_file(name, source, 1440.0, 900.0));
        assert_eq!(host.editor_state.doc, original);
        assert!(!host.editor_state.history.can_undo());
        let toast = host
            .editor_state
            .editor_ui
            .visible_toast(host.now_ms)
            .unwrap();
        assert_eq!(toast.i18n_key, "diagram.importFailed");
        assert!(!toast.args[0].1.is_empty());
        host.editor_state.editor_ui.locale = op_editor_core::Locale::ZhCn;
        let notice = op_editor_ui::widgets::editor_toast::EditorToast::for_editor(
            &host.editor_state,
            host.now_ms,
        )
        .unwrap();
        assert!(notice.message().starts_with("图表导入失败："));
    }
}

#[test]
fn repeated_diagram_import_remaps_ids_and_preserves_existing_empty_boards() {
    let mut host = WidgetHost::new();
    let starter = host.editor_state.active_children()[0].clone();
    assert!(host.import_diagram_file("flow.mmd", "graph TD\nA --> B", 1440.0, 900.0));
    let once = host.editor_state.doc.clone();
    assert!(host.import_diagram_file("flow.mmd", "graph TD\nA --> B", 1440.0, 900.0));
    assert!(host.editor_state.find_duplicate_id().is_none());
    assert_eq!(host.editor_state.active_children().len(), 3);
    assert_eq!(host.editor_state.active_children()[0], starter);
    assert!(host.editor_state.apply(EditorCommand::Undo));
    assert_eq!(host.editor_state.doc, once);
}
