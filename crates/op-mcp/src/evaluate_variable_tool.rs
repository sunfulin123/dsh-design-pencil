use std::collections::BTreeMap;

use jian_ops_schema::variable::VariableDefinition;
use op_editor_core::{variables_resolve, EditorState};
use serde_json::json;

use crate::{McpTool, ToolErrorCode, ToolOutcome};

pub struct EvaluateVariable {
    variables: BTreeMap<String, VariableDefinition>,
    themes: BTreeMap<String, Vec<String>>,
    active: BTreeMap<String, String>,
}

pub fn evaluate_variable_snapshot(state: &EditorState) -> EvaluateVariable {
    EvaluateVariable {
        variables: state.doc.variables.clone().unwrap_or_default(),
        themes: state.doc.themes.clone().unwrap_or_default(),
        active: variables_resolve::effective_theme(&state.doc, &state.ui.variables.active_theme),
    }
}

impl McpTool for EvaluateVariable {
    fn name(&self) -> &str {
        "evaluate_variable"
    }

    fn call(&self, args: &BTreeMap<String, String>) -> ToolOutcome {
        let Some(id) = args.get("id").filter(|id| !id.trim().is_empty()) else {
            return ToolOutcome::Err(ToolErrorCode::MissingArgument, "id is required".into());
        };
        let mut active = self.active.clone();
        if let Some(raw) = args.get("modes") {
            let modes: BTreeMap<String, String> = match serde_json::from_str(raw) {
                Ok(modes) => modes,
                Err(err) => {
                    return ToolOutcome::Err(
                        ToolErrorCode::InvalidArgument,
                        format!("invalid modes: {err}"),
                    )
                }
            };
            for (axis, value) in modes {
                if !self
                    .themes
                    .get(&axis)
                    .is_some_and(|values| values.contains(&value))
                {
                    return ToolOutcome::Err(
                        ToolErrorCode::InvalidArgument,
                        format!("unknown theme axis/value: {axis}={value}"),
                    );
                }
                active.insert(axis, value);
            }
        }
        let reference = if id.starts_with('$') {
            id.clone()
        } else {
            format!("${id}")
        };
        match variables_resolve::resolve_variable_ref_checked(
            &reference,
            Some(&self.variables),
            &active,
        ) {
            Ok(value) => {
                ToolOutcome::OkJson(json!({"id":id,"value":value,"modes":active}).to_string())
            }
            Err(err) => ToolOutcome::Err(
                ToolErrorCode::InvalidArgument,
                format!("cannot evaluate {id}: {err}"),
            ),
        }
    }
}
