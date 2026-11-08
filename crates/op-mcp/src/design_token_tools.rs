//! DTCG token import/export backed by canonical variables and render resolution.

use crate::{EditorCommand, McpTool, ToolErrorCode, ToolOutcome};
use op_editor_core::design_tokens::{export_w3c_tokens, import_w3c_tokens};
use op_editor_core::variables_resolve::effective_theme;
use op_editor_core::EditorState;
use std::collections::BTreeMap;

pub struct ImportDesignTokens {
    state: EditorState,
}
pub fn import_design_tokens_snapshot(state: &EditorState) -> ImportDesignTokens {
    ImportDesignTokens {
        state: state.clone(),
    }
}

impl McpTool for ImportDesignTokens {
    fn name(&self) -> &str {
        "import_design_tokens"
    }
    fn call(&self, args: &BTreeMap<String, String>) -> ToolOutcome {
        let Some(raw) = args.get("tokens") else {
            return ToolOutcome::Err(
                ToolErrorCode::MissingArgument,
                "tokens JSON is required".into(),
            );
        };
        let value = match serde_json::from_str(raw) {
            Ok(value) => value,
            Err(e) => {
                return ToolOutcome::Err(
                    ToolErrorCode::InvalidArgument,
                    format!("invalid tokens JSON: {e}"),
                )
            }
        };
        let variables = match import_w3c_tokens(&value) {
            Ok(variables) => variables,
            Err(e) => return ToolOutcome::Err(ToolErrorCode::InvalidArgument, e.to_string()),
        };
        let replace = match args.get("replace").map(String::as_str) {
            None | Some("false") => false,
            Some("true") => true,
            Some(_) => {
                return ToolOutcome::Err(
                    ToolErrorCode::InvalidArgument,
                    "replace must be true or false".into(),
                )
            }
        };
        if let Some(existing) = &self.state.doc.variables {
            for (name, definition) in &variables {
                if existing
                    .get(name)
                    .is_some_and(|old| old.kind != definition.kind)
                {
                    return ToolOutcome::Err(
                        ToolErrorCode::InvalidArgument,
                        format!("import would change the type of variable {name:?}"),
                    );
                }
            }
            if replace {
                fn references(value: &serde_json::Value, name: &str) -> bool {
                    match value {
                        serde_json::Value::String(text) => {
                            op_editor_core::variables_resolve::rewrite_variable_scalar(
                                &jian_ops_schema::variable::VariableScalar::Str(text.clone()),
                                name,
                                Some("replacement-probe"),
                                None,
                                &BTreeMap::new(),
                            )
                            .is_some()
                        }
                        serde_json::Value::Array(values) => {
                            values.iter().any(|value| references(value, name))
                        }
                        serde_json::Value::Object(values) => {
                            values.values().any(|value| references(value, name))
                        }
                        _ => false,
                    }
                }
                let authored = serde_json::json!({
                    "children":self.state.doc.children,
                    "pages":self.state.doc.pages,
                    "sharedStyles":self.state.doc.shared_styles,
                });
                for name in existing
                    .keys()
                    .filter(|name| !variables.contains_key(*name))
                {
                    if references(&authored, name) {
                        return ToolOutcome::Err(
                            ToolErrorCode::InvalidArgument,
                            format!(
                                "replace would remove bound variable {name:?}; detach it first"
                            ),
                        );
                    }
                }
            }
        }
        ToolOutcome::OkWithCommand(
            BTreeMap::from([("count".into(), variables.len().to_string())]),
            EditorCommand::SetVariables { variables, replace },
        )
    }
}

pub struct ExportDesignTokens {
    state: EditorState,
}
pub fn export_design_tokens_snapshot(state: &EditorState) -> ExportDesignTokens {
    ExportDesignTokens {
        state: state.clone(),
    }
}

impl McpTool for ExportDesignTokens {
    fn name(&self) -> &str {
        "export_design_tokens"
    }
    fn call(&self, args: &BTreeMap<String, String>) -> ToolOutcome {
        let mut theme = effective_theme(&self.state.doc, &self.state.ui.variables.active_theme);
        if let Some(raw) = args.get("modes") {
            let overrides: BTreeMap<String, String> = match serde_json::from_str(raw) {
                Ok(value) => value,
                Err(e) => {
                    return ToolOutcome::Err(
                        ToolErrorCode::InvalidArgument,
                        format!("invalid modes: {e}"),
                    )
                }
            };
            for (axis, value) in overrides {
                if !self
                    .state
                    .doc
                    .themes
                    .as_ref()
                    .and_then(|t| t.get(&axis))
                    .is_some_and(|values| values.contains(&value))
                {
                    return ToolOutcome::Err(
                        ToolErrorCode::InvalidArgument,
                        format!("unknown mode {axis}={value}"),
                    );
                }
                theme.insert(axis, value);
            }
        }
        let vars = self.state.doc.variables.clone().unwrap_or_default();
        match export_w3c_tokens(&vars, &theme) {
            Ok(tokens) => ToolOutcome::Ok(BTreeMap::from([("tokens".into(), tokens.to_string())])),
            Err(e) => ToolOutcome::Err(ToolErrorCode::InvalidArgument, e.to_string()),
        }
    }
}
