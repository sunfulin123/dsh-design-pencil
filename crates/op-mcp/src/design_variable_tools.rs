//! Persisted variable bindings and collection mode overrides at every scope.

use crate::{McpTool, ToolErrorCode, ToolOutcome};
use op_editor_core::design_bindings::{
    variable_binding_command, variable_mode_command, variable_mode_info,
    variable_scope_mode_command, VariableModeScope,
};
use op_editor_core::EditorState;
use std::collections::BTreeMap;

#[derive(Clone, Copy)]
enum Action {
    Bind,
    Detach,
    Mode,
    GetMode,
}
pub struct DesignVariableTool {
    state: EditorState,
    action: Action,
}
pub fn bind_variable_snapshot(state: &EditorState) -> DesignVariableTool {
    DesignVariableTool {
        state: state.clone(),
        action: Action::Bind,
    }
}
pub fn detach_variable_snapshot(state: &EditorState) -> DesignVariableTool {
    DesignVariableTool {
        state: state.clone(),
        action: Action::Detach,
    }
}
pub fn set_variable_mode_snapshot(state: &EditorState) -> DesignVariableTool {
    DesignVariableTool {
        state: state.clone(),
        action: Action::Mode,
    }
}
pub fn get_variable_mode_snapshot(state: &EditorState) -> DesignVariableTool {
    DesignVariableTool {
        state: state.clone(),
        action: Action::GetMode,
    }
}

#[allow(clippy::result_large_err)]
fn scope(
    state: &EditorState,
    args: &BTreeMap<String, String>,
) -> Result<VariableModeScope, ToolOutcome> {
    match args.get("scope").map(String::as_str).unwrap_or("node") {
        "global" => Ok(VariableModeScope::Global),
        "page" => {
            let id = args
                .get("pageId")
                .cloned()
                .or_else(|| {
                    state
                        .doc
                        .pages
                        .as_ref()
                        .and_then(|pages| pages.get(state.ui.active_page_index))
                        .map(|p| p.id.clone())
                })
                .ok_or_else(|| {
                    ToolOutcome::Err(
                        ToolErrorCode::MissingArgument,
                        "pageId is required for a document without pages".into(),
                    )
                })?;
            Ok(VariableModeScope::Page(id))
        }
        "node" => args
            .get("nodeId")
            .cloned()
            .map(VariableModeScope::Node)
            .ok_or_else(|| {
                ToolOutcome::Err(
                    ToolErrorCode::MissingArgument,
                    "nodeId is required for introspection".into(),
                )
            }),
        other => Err(ToolOutcome::Err(
            ToolErrorCode::InvalidArgument,
            format!("invalid scope {other:?}"),
        )),
    }
}

impl McpTool for DesignVariableTool {
    fn name(&self) -> &str {
        match self.action {
            Action::Bind => "bind_variable",
            Action::Detach => "detach_variable",
            Action::Mode => "set_variable_mode",
            Action::GetMode => "get_variable_mode",
        }
    }
    fn call(&self, args: &BTreeMap<String, String>) -> ToolOutcome {
        if matches!(self.action, Action::GetMode) {
            let scope = match scope(&self.state, args) {
                Ok(scope) => scope,
                Err(e) => return e,
            };
            return match variable_mode_info(&self.state, scope) {
                Ok(info) => ToolOutcome::OkJson(
                    serde_json::json!({
                        "explicit":info.explicit,"resolved":info.resolved,
                        "collections":self.state.doc.themes.clone().unwrap_or_default()
                    })
                    .to_string(),
                ),
                Err(error) => ToolOutcome::Err(ToolErrorCode::InvalidArgument, error.to_string()),
            };
        }
        let mode_scope = matches!(self.action, Action::Mode)
            && args.get("scope").is_some_and(|scope| scope != "node");
        let ids: Vec<String> = if mode_scope {
            Vec::new()
        } else {
            let Some(raw) = args.get("nodeIds") else {
                return ToolOutcome::Err(
                    ToolErrorCode::MissingArgument,
                    "nodeIds JSON array is required".into(),
                );
            };
            match serde_json::from_str(raw) {
                Ok(ids) => ids,
                Err(e) => {
                    return ToolOutcome::Err(
                        ToolErrorCode::InvalidArgument,
                        format!("invalid nodeIds: {e}"),
                    )
                }
            }
        };
        let planned = if matches!(self.action, Action::Mode) {
            let Some(raw) = args.get("modes") else {
                return ToolOutcome::Err(
                    ToolErrorCode::MissingArgument,
                    "modes JSON object is required".into(),
                );
            };
            let modes = match serde_json::from_str(raw) {
                Ok(modes) => modes,
                Err(e) => {
                    return ToolOutcome::Err(
                        ToolErrorCode::InvalidArgument,
                        format!("invalid modes: {e}"),
                    )
                }
            };
            if mode_scope {
                let scope = match scope(&self.state, args) {
                    Ok(scope) => scope,
                    Err(e) => return e,
                };
                variable_scope_mode_command(&self.state, scope, &modes)
            } else {
                variable_mode_command(&self.state, &ids, &modes)
            }
        } else {
            let Some(property) = args.get("property") else {
                return ToolOutcome::Err(
                    ToolErrorCode::MissingArgument,
                    "property is required".into(),
                );
            };
            let variable = if matches!(self.action, Action::Bind) {
                let Some(name) = args.get("variable") else {
                    return ToolOutcome::Err(
                        ToolErrorCode::MissingArgument,
                        "variable is required".into(),
                    );
                };
                Some(name.as_str())
            } else {
                None
            };
            variable_binding_command(&self.state, &ids, property, variable)
        };
        match planned {
            Ok(command) => ToolOutcome::OkWithCommand(
                BTreeMap::from([("wrote".into(), "true".into())]),
                command,
            ),
            Err(error) => ToolOutcome::Err(ToolErrorCode::InvalidArgument, error.to_string()),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn concrete_bindings_reach_active_and_full_scene_and_codegen() {
        let mut state = EditorState::from_document(serde_json::from_value(json!({
            "version":"1", "themes":{"Mode":["Light","Dark"]},
            "theme":{"Mode":"Dark"},
            "variables":{
                "size":{"type":"number","value":[
                    {"value":12,"theme":{"Mode":"Light"}},
                    {"value":24,"theme":{"Mode":"Dark"}}]},
                "show":{"type":"boolean","value":false},
                "ink":{"type":"color","value":"#123456"}
            },
            "pages":[{"id":"p","name":"Page","theme":{"Mode":"Light"},"children":[{
                "type":"text","id":"t","content":"Hi","fontSize":10,
                "fill":[{"type":"solid","color":"$ink"}],
                "effects":[{"type":"shadow","color":"#123456","offsetX":1,"offsetY":2,"blur":3,"spread":0},
                    {"type":"blur","radius":2},{"type":"background_blur","radius":3}]
            }]}]
        })).unwrap());
        for (property, variable) in [
            ("visible", "show"),
            ("fontSize", "size"),
            ("effects.0.blur", "size"),
            ("effects.0.offsetY", "size"),
            ("effects.1.radius", "size"),
            ("effects.2.radius", "size"),
        ] {
            let args = BTreeMap::from([
                ("nodeIds".into(), r#"["t"]"#.into()),
                ("property".into(), property.into()),
                ("variable".into(), variable.into()),
            ]);
            let ToolOutcome::OkWithCommand(_, command) = bind_variable_snapshot(&state).call(&args)
            else {
                panic!("binding failed: {property}")
            };
            assert!(state.apply(command));
        }
        let active = op_pen_loader::editor_state_to_active_page_layout_scene(&state);
        let full = op_pen_loader::editor_state_to_layout_scene(&state);
        assert_eq!(active, full);
        let node = &active.pages[0].children[0];
        assert!(node.hidden);
        assert_eq!(node.font_size, 12.0);
        assert!(node.effects.iter().any(|effect| matches!(effect,
            jian_scene::layout_scene::Effect::DropShadow(shadow) if shadow.blur == 12.0 && shadow.offset_y == 12.0)));
        assert!(node.effects.iter().any(|effect| matches!(effect,
            jian_scene::layout_scene::Effect::Blur(blur) if blur.radius == 12.0)));
        assert!(node.effects.iter().any(|effect| matches!(effect,
            jian_scene::layout_scene::Effect::BackgroundBlur { radius } if *radius == 12.0)));
        let ToolOutcome::OkJson(raw) = crate::code_export_tools::export_code_snapshot(&state)
            .call(&BTreeMap::from([("format".into(), "html-css".into())]))
        else {
            panic!("export failed")
        };
        let result: serde_json::Value = serde_json::from_str(&raw).unwrap();
        let code = result["code"].as_str().unwrap();
        assert!(!code.contains("Hi"), "{code}");
        state
            .doc
            .variables
            .as_mut()
            .unwrap()
            .get_mut("show")
            .unwrap()
            .value = jian_ops_schema::variable::VariableValue::Scalar(
            jian_ops_schema::variable::VariableScalar::Bool(true),
        );
        let ToolOutcome::OkJson(raw) = crate::code_export_tools::export_code_snapshot(&state)
            .call(&BTreeMap::from([("format".into(), "html-css".into())]))
        else {
            panic!("export failed")
        };
        let result: serde_json::Value = serde_json::from_str(&raw).unwrap();
        let code = result["code"].as_str().unwrap();
        assert!(code.contains("12px"), "{code}");
        assert!(code.contains("Hi"), "{code}");
        assert!(code.contains("var(--ink)"), "{code}");
    }

    #[test]
    fn global_page_and_get_modes_are_command_backed_and_inherited() {
        let mut state = EditorState::from_document(serde_json::from_value(json!({
            "version":"1","themes":{"Mode":["Light","Dark"]},
            "pages":[{"id":"p","name":"Page","children":[{"type":"text","id":"t","content":"Hi"}]}]
        })).unwrap());
        for scope in ["global", "page"] {
            let tool = set_variable_mode_snapshot(&state);
            let result = tool.call(&BTreeMap::from([
                ("scope".into(), scope.into()),
                ("modes".into(), r#"{"Mode":"Dark"}"#.into()),
            ]));
            let ToolOutcome::OkWithCommand(_, command) = result else {
                panic!("expected command")
            };
            assert!(state.apply(command));
        }
        let tool = get_variable_mode_snapshot(&state);
        let ToolOutcome::OkJson(raw) = tool.call(&BTreeMap::from([("nodeId".into(), "t".into())]))
        else {
            panic!("expected JSON")
        };
        let info: serde_json::Value = serde_json::from_str(&raw).unwrap();
        assert_eq!(info["resolved"]["Mode"], "Dark");
        assert_eq!(info["explicit"], json!({}));
        assert_eq!(info["collections"]["Mode"], json!(["Light", "Dark"]));
        assert!(matches!(
            set_variable_mode_snapshot(&state).call(&BTreeMap::from([
                ("scope".into(), "global".into()),
                ("modes".into(), r#"{"Mode":"missing"}"#.into())
            ])),
            ToolOutcome::Err(ToolErrorCode::InvalidArgument, _)
        ));
    }
}
