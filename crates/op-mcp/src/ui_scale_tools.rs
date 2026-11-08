//! App-level interface sizing, independent of document geometry and history.

use std::collections::BTreeMap;

use op_editor_core::editor_ui_state::ui_scale::UiScale;
use op_editor_core::{EditorCommand, EditorState};
use serde_json::json;

use crate::{McpTool, ToolErrorCode, ToolOutcome};

pub struct GetUiScale(UiScale);
pub struct SetUiScale(UiScale);

pub fn get_ui_scale_snapshot(state: &EditorState) -> GetUiScale {
    GetUiScale(state.editor_ui.ui_scale)
}

pub fn set_ui_scale_snapshot(state: &EditorState) -> SetUiScale {
    SetUiScale(state.editor_ui.ui_scale)
}

fn result(scale: UiScale) -> String {
    json!({"scale": scale.percent(), "supportedScales": UiScale::SUPPORTED}).to_string()
}

impl McpTool for GetUiScale {
    fn name(&self) -> &str {
        "get_ui_scale"
    }

    fn call(&self, args: &BTreeMap<String, String>) -> ToolOutcome {
        if !args.is_empty() {
            return ToolOutcome::Err(
                ToolErrorCode::InvalidArgument,
                "get_ui_scale takes no arguments".into(),
            );
        }
        ToolOutcome::OkJson(result(self.0))
    }
}

impl McpTool for SetUiScale {
    fn name(&self) -> &str {
        "set_ui_scale"
    }

    fn call(&self, args: &BTreeMap<String, String>) -> ToolOutcome {
        let scale = (args.len() == 1)
            .then(|| args.get("scale"))
            .flatten()
            .and_then(|raw| raw.parse::<u16>().ok())
            .and_then(UiScale::from_percent);
        let Some(scale) = scale else {
            return ToolOutcome::Err(
                ToolErrorCode::InvalidArgument,
                "scale must be one of 100, 110, 125, 150; no extra arguments".into(),
            );
        };
        if self.0 == scale {
            return ToolOutcome::OkJson(result(scale));
        }
        ToolOutcome::OkJsonWithCommand(
            result(scale),
            EditorCommand::SetUiScale {
                percent: scale.percent(),
            },
        )
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{McpTool, ToolErrorCode, ToolOutcome};
    use op_editor_core::{EditorCommand, EditorState};
    use std::collections::BTreeMap;

    #[test]
    fn supported_scales_round_trip_without_document_camera_or_history_changes() {
        let mut state = EditorState::new();
        let doc = serde_json::to_string(&state.doc).unwrap();
        let camera = state.viewport;
        let revision = state.document_revision();
        for percent in [100, 110, 125, 150] {
            let args = BTreeMap::from([("scale".into(), percent.to_string())]);
            let reply = match set_ui_scale_snapshot(&state).call(&args) {
                ToolOutcome::OkJsonWithCommand(reply, command) => {
                    assert!(state.apply(command));
                    reply
                }
                ToolOutcome::OkJson(reply) => reply,
                _ => panic!("supported scale rejected"),
            };
            assert_eq!(
                serde_json::from_str::<serde_json::Value>(&reply).unwrap()["scale"],
                percent
            );
            let ToolOutcome::OkJson(reply) = get_ui_scale_snapshot(&state).call(&BTreeMap::new())
            else {
                panic!("get_ui_scale failed");
            };
            assert_eq!(
                serde_json::from_str::<serde_json::Value>(&reply).unwrap()["scale"],
                percent
            );
            assert_eq!(serde_json::to_string(&state.doc).unwrap(), doc);
            assert_eq!(state.viewport, camera);
            assert_eq!(state.document_revision(), revision);
            assert!(!state.is_dirty());
            assert!(!state.apply(EditorCommand::Undo));
        }
    }

    #[test]
    fn rejects_missing_unsupported_and_extra_arguments() {
        let state = EditorState::new();
        for raw in [
            "90", "120", "200", "1.25", "125.0", "\"125\"", "null", "NaN", "-100",
        ] {
            assert!(
                matches!(
                    set_ui_scale_snapshot(&state)
                        .call(&BTreeMap::from([("scale".into(), raw.into())])),
                    ToolOutcome::Err(ToolErrorCode::InvalidArgument, _)
                ),
                "{raw}"
            );
        }
        assert!(matches!(
            set_ui_scale_snapshot(&state).call(&BTreeMap::new()),
            ToolOutcome::Err(ToolErrorCode::InvalidArgument, _)
        ));
        let extra = BTreeMap::from([("scale".into(), "125".into()), ("zoom".into(), "2".into())]);
        assert!(matches!(
            set_ui_scale_snapshot(&state).call(&extra),
            ToolOutcome::Err(ToolErrorCode::InvalidArgument, _)
        ));
        assert!(matches!(
            get_ui_scale_snapshot(&state).call(&extra),
            ToolOutcome::Err(ToolErrorCode::InvalidArgument, _)
        ));
        assert!(!EditorState::new().apply(EditorCommand::SetUiScale { percent: 120 }));
    }
}
