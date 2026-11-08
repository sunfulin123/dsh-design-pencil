//! Snapshot-backed tools for persisted shared appearance styles.

use crate::{EditorCommand, McpTool, ToolErrorCode, ToolOutcome};
use jian_ops_schema::style::SharedStyle;
use op_editor_core::shared_styles::{apply_shared_style, SharedStyleOperation};
use op_editor_core::{DesignCommand, EditorState};
use std::collections::BTreeMap;

#[derive(Clone, Copy)]
enum Action {
    Create,
    Update,
    Apply,
    Detach,
    Delete,
    List,
}

pub struct SharedStyleTool {
    state: EditorState,
    action: Action,
}

fn snapshot(state: &EditorState, action: Action) -> SharedStyleTool {
    SharedStyleTool {
        state: state.clone(),
        action,
    }
}

pub fn create_shared_style_snapshot(state: &EditorState) -> SharedStyleTool {
    snapshot(state, Action::Create)
}
pub fn update_shared_style_snapshot(state: &EditorState) -> SharedStyleTool {
    snapshot(state, Action::Update)
}
pub fn apply_shared_style_snapshot(state: &EditorState) -> SharedStyleTool {
    snapshot(state, Action::Apply)
}
pub fn detach_shared_style_snapshot(state: &EditorState) -> SharedStyleTool {
    snapshot(state, Action::Detach)
}
pub fn delete_shared_style_snapshot(state: &EditorState) -> SharedStyleTool {
    snapshot(state, Action::Delete)
}
pub fn get_shared_styles_snapshot(state: &EditorState) -> SharedStyleTool {
    snapshot(state, Action::List)
}

fn error(code: ToolErrorCode, message: impl Into<String>) -> ToolOutcome {
    ToolOutcome::Err(code, message.into())
}

impl SharedStyleTool {
    #[allow(clippy::result_large_err)]
    fn operation(
        &self,
        args: &BTreeMap<String, String>,
    ) -> Result<SharedStyleOperation, ToolOutcome> {
        let id = args
            .get("id")
            .filter(|id| !id.trim().is_empty())
            .ok_or_else(|| error(ToolErrorCode::MissingArgument, "id is required"))?
            .clone();
        let style = || -> Result<SharedStyle, ToolOutcome> {
            let value = args
                .get("style")
                .ok_or_else(|| error(ToolErrorCode::MissingArgument, "style JSON is required"))?;
            serde_json::from_str(value).map_err(|e| {
                error(
                    ToolErrorCode::InvalidArgument,
                    format!("invalid style JSON: {e}"),
                )
            })
        };
        let ids = || -> Result<Vec<String>, ToolOutcome> {
            let raw = args.get("nodeIds").ok_or_else(|| {
                error(
                    ToolErrorCode::MissingArgument,
                    "nodeIds JSON array is required",
                )
            })?;
            let ids: Vec<String> = serde_json::from_str(raw).map_err(|e| {
                error(
                    ToolErrorCode::InvalidArgument,
                    format!("invalid nodeIds: {e}"),
                )
            })?;
            if ids.is_empty() || ids.iter().any(|id| id.trim().is_empty()) {
                return Err(error(
                    ToolErrorCode::InvalidArgument,
                    "nodeIds must contain nonempty node ids",
                ));
            }
            Ok(ids)
        };
        Ok(match self.action {
            Action::Create => SharedStyleOperation::Create {
                id,
                style: style()?,
            },
            Action::Update => SharedStyleOperation::Update {
                id,
                style: style()?,
            },
            Action::Apply => SharedStyleOperation::Apply {
                id,
                node_ids: ids()?,
            },
            Action::Detach => SharedStyleOperation::Detach {
                id,
                node_ids: ids()?,
            },
            Action::Delete => SharedStyleOperation::Delete { id },
            Action::List => {
                return Err(error(
                    ToolErrorCode::InvalidArgument,
                    "list is not a write operation",
                ))
            }
        })
    }
}

impl McpTool for SharedStyleTool {
    fn name(&self) -> &str {
        match self.action {
            Action::Create => "create_shared_style",
            Action::Update => "update_shared_style",
            Action::Apply => "apply_shared_style",
            Action::Detach => "detach_shared_style",
            Action::Delete => "delete_shared_style",
            Action::List => "get_shared_styles",
        }
    }
    fn call(&self, args: &BTreeMap<String, String>) -> ToolOutcome {
        if matches!(self.action, Action::List) {
            return match serde_json::to_string(
                &self.state.doc.shared_styles.clone().unwrap_or_default(),
            ) {
                Ok(styles) => ToolOutcome::Ok(BTreeMap::from([("styles".into(), styles)])),
                Err(e) => error(ToolErrorCode::ToolFailed, e.to_string()),
            };
        }
        let operation = match self.operation(args) {
            Ok(op) => op,
            Err(e) => return e,
        };
        let mut draft = self.state.clone();
        match apply_shared_style(&mut draft, operation.clone()) {
            Ok(false) => ToolOutcome::Ok(BTreeMap::from([("wrote".into(), "false".into())])),
            Ok(true) => ToolOutcome::OkWithCommand(
                BTreeMap::from([("wrote".into(), "true".into())]),
                EditorCommand::Design(DesignCommand::SharedStyle { operation }),
            ),
            Err(e) => error(ToolErrorCode::InvalidArgument, e.to_string()),
        }
    }
}
