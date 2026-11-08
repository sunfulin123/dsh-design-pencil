//! Device preference hints carried outside the authored document.

use op_editor_core::editor_ui_state::ui_scale::UiScale;
use op_editor_core::{EditorCommand, EditorState};
use serde::Deserialize;

#[derive(Default)]
pub(crate) struct UiScalePull {}

#[derive(Default)]
pub(crate) struct UiScaleUpdate {
    pub needs_ack: bool,
    pub visual_changed: bool,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct Envelope {
    version: u64,
    #[serde(default)]
    ui_scale: Option<serde_json::Value>,
}

pub(crate) fn selection_key(state: &EditorState) -> String {
    format!(
        "ui-scale:{}|{}",
        state.editor_ui.ui_scale.percent(),
        op_editor_core::web_sync::selection_sync_key(state)
    )
}

pub(crate) fn selection_body(state: &EditorState) -> String {
    let mut body: serde_json::Value =
        serde_json::from_str(&op_editor_core::web_sync::selection_push_body(state))
            .expect("selection serializer produces valid JSON");
    body["uiScale"] = serde_json::json!(state.editor_ui.ui_scale.percent());
    body.to_string()
}

impl UiScalePull {
    /// Every valid hint needs acknowledgement, including no-ops and repeated
    /// percentages. Missing/null never resets the device choice. The daemon
    /// keeps a hint pending until acknowledged, so percentage-based deduplication
    /// cannot distinguish a retry from a new identical command.
    pub(crate) fn apply(
        &mut self,
        state: &mut EditorState,
        body: &str,
        minimum_version: u64,
    ) -> UiScaleUpdate {
        let Ok(envelope) = serde_json::from_str::<Envelope>(body) else {
            return UiScaleUpdate::default();
        };
        if envelope.version < minimum_version {
            return UiScaleUpdate::default();
        }
        let Some(value) = envelope.ui_scale else {
            return UiScaleUpdate::default();
        };
        let Some(scale) = value
            .as_u64()
            .and_then(|value| u16::try_from(value).ok())
            .and_then(UiScale::from_percent)
        else {
            return UiScaleUpdate::default();
        };
        UiScaleUpdate {
            needs_ack: true,
            visual_changed: state.apply(EditorCommand::SetUiScale {
                percent: scale.percent(),
            }),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use op_editor_core::{EditorCommand, EditorState};

    #[test]
    fn metadata_only_polls_apply_scale_without_content_version_or_undo() {
        let mut state = EditorState::new();
        let mut pull = UiScalePull::default();
        let document = serde_json::to_string(&state.doc).unwrap();
        let camera = state.viewport;
        for scale in [100, 110, 125, 150] {
            let body = format!(r#"{{"version":7,"document":{{"children":[]}},"uiScale":{scale}}}"#);
            pull.apply(&mut state, &body, 7);
            assert_eq!(state.editor_ui.ui_scale.percent(), scale);
            assert_eq!(serde_json::to_string(&state.doc).unwrap(), document);
            assert_eq!(state.viewport, camera);
            assert_eq!(state.document_revision(), 0);
            assert!(!state.is_dirty());
            assert!(!state.apply(EditorCommand::Undo));
            let repeated = pull.apply(&mut state, &body, 7);
            assert!(repeated.needs_ack);
            assert!(!repeated.visual_changed);
        }
    }

    #[test]
    fn absent_invalid_and_cleared_hints_preserve_device_scale() {
        let mut state = EditorState::new();
        state.apply(EditorCommand::SetUiScale { percent: 125 });
        let mut pull = UiScalePull::default();
        for body in [
            r#"{"version":7,"uiScale":120}"#,
            r#"{"version":7,"uiScale":"150"}"#,
            r#"{"version":7,"uiScale":150.0}"#,
            r#"{"version":7,"uiScale":null}"#,
            r#"{"version":7}"#,
            r#"{"version":6,"uiScale":150}"#,
            r#"{"uiScale":150}"#,
        ] {
            let update = pull.apply(&mut state, body, 7);
            assert!(!update.needs_ack);
            assert!(!update.visual_changed);
            assert_eq!(state.editor_ui.ui_scale.percent(), 125);
        }
        assert!(
            pull.apply(&mut state, r#"{"version":7,"uiScale":150}"#, 7)
                .visual_changed
        );
        assert!(
            !pull
                .apply(&mut state, r#"{"version":7,"uiScale":null}"#, 7)
                .needs_ack
        );
        assert_eq!(state.editor_ui.ui_scale.percent(), 150);
        assert!(
            pull.apply(&mut state, r#"{"version":7,"uiScale":100}"#, 7)
                .visual_changed
        );
    }

    #[test]
    fn selection_transport_reports_live_scale_and_republishes_changes() {
        let mut state = EditorState::new();
        let previous = selection_key(&state);
        state.apply(EditorCommand::SetUiScale { percent: 125 });
        assert_ne!(selection_key(&state), previous);
        let body: serde_json::Value = serde_json::from_str(&selection_body(&state)).unwrap();
        assert_eq!(body["uiScale"], 125);
        assert!(body["selectedIds"].is_array());
        assert!(body.get("document").is_none());
    }

    #[test]
    fn changing_scale_leaves_existing_dirty_undo_history_intact() {
        let mut state = EditorState::new();
        let before = state.snapshot_for_history();
        assert!(state.apply(EditorCommand::InsertNode {
            kind: "rect".into(),
            name: "authored".into(),
            x: 10,
            y: 20,
            width: 80,
            height: 60,
            fill_hex: None,
            target_parent: op_editor_core::NodeId::NONE,
            page_id: None,
        }));
        state.history_push_past(before);
        let revision = state.document_revision();
        let document = serde_json::to_string(&state.doc).unwrap();
        let mut pull = UiScalePull::default();
        assert!(
            pull.apply(&mut state, r#"{"version":7,"uiScale":150}"#, 7)
                .visual_changed
        );
        assert_eq!(state.document_revision(), revision);
        assert_eq!(serde_json::to_string(&state.doc).unwrap(), document);
        assert!(state.is_dirty());
        assert!(state.apply(EditorCommand::Undo));
        assert!(state.doc.children.is_empty());
        assert_eq!(state.editor_ui.ui_scale.percent(), 150);
    }
}
