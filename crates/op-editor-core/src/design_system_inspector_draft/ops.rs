use super::{DesignSystemAction as A, DesignSystemInspectorDraft};
use crate::design_bindings::{
    variable_binding_command, variable_scope_mode_command, VariableModeScope,
};
use crate::design_lint::{issue_id, DesignLintSnapshot};
use crate::shared_styles::{validate_shared_style, SharedStyleOperation};
use crate::variables_resolve::{effective_theme, is_formula, resolve_variable_ref_checked};
use crate::{DesignCommand, EditorCommand, EditorState};
use jian_ops_schema::style::{SharedStyle, SharedStyleKind};
use jian_ops_schema::variable::{VariableDefinition, VariableKind, VariableScalar, VariableValue};
use serde_json::Value;
use std::collections::BTreeMap;

fn style_command(operation: SharedStyleOperation) -> EditorCommand {
    EditorCommand::Design(DesignCommand::SharedStyle { operation })
}

fn selected_ids(state: &EditorState) -> Vec<String> {
    state
        .selection
        .set
        .iter()
        .map(|id| id.as_str().to_owned())
        .collect()
}

fn capture_style(
    state: &EditorState,
    draft: &DesignSystemInspectorDraft,
) -> Result<EditorCommand, String> {
    let node = state
        .selected_node()
        .ok_or("Select a node to capture a style")?;
    let value = serde_json::to_value(node).map_err(|error| error.to_string())?;
    let keys: &[&str] = match draft.kind {
        SharedStyleKind::Paint => &["fill", "stroke"],
        SharedStyleKind::Effect => &["effects"],
        SharedStyleKind::Text => &[
            "fontFamily",
            "fontSize",
            "fontWeight",
            "fontStyle",
            "underline",
            "strikethrough",
            "lineHeight",
            "letterSpacing",
            "textAlign",
            "textAlignVertical",
            "textGrowth",
        ],
    };
    let properties = keys
        .iter()
        .filter_map(|key| {
            value
                .get(*key)
                .filter(|value| !value.is_null())
                .map(|value| ((*key).into(), value.clone()))
        })
        .collect();
    let id = draft.values[0].trim().to_owned();
    let style = SharedStyle {
        name: draft.values[1].trim().into(),
        kind: draft.kind,
        properties,
        node_ids: Vec::new(),
    };
    validate_shared_style(&style).map_err(|error| error.to_string())?;
    if state
        .doc
        .shared_styles
        .as_ref()
        .is_some_and(|styles| styles.contains_key(&id))
    {
        Ok(style_command(SharedStyleOperation::Update { id, style }))
    } else {
        if id.is_empty() {
            return Err("Enter a shared style ID".into());
        }
        Ok(EditorCommand::Batch {
            commands: vec![
                style_command(SharedStyleOperation::Create {
                    id: id.clone(),
                    style,
                }),
                style_command(SharedStyleOperation::Apply {
                    id,
                    node_ids: selected_ids(state),
                }),
            ],
        })
    }
}

fn formula_command(
    state: &EditorState,
    draft: &DesignSystemInspectorDraft,
) -> Result<EditorCommand, String> {
    let name = draft.values[2].trim().trim_start_matches('$');
    let formula = draft.values[4].trim();
    if name.is_empty() || name.contains(char::is_whitespace) || name.contains(['$', '{', '}']) {
        return Err("Enter a valid variable name".into());
    }
    if !is_formula(formula) {
        return Err("Enter an arithmetic formula, for example calc($spacing * 2)".into());
    }
    let mut variables = state.doc.variables.clone().unwrap_or_default();
    if variables
        .get(name)
        .is_some_and(|variable| variable.kind != VariableKind::Number)
    {
        return Err("A formula requires a numeric variable".into());
    }
    variables.insert(
        name.into(),
        VariableDefinition {
            kind: VariableKind::Number,
            value: VariableValue::Scalar(VariableScalar::Str(formula.into())),
        },
    );
    let theme = effective_theme(&state.doc, &state.ui.variables.active_theme);
    for key in variables.keys() {
        resolve_variable_ref_checked(&format!("${key}"), Some(&variables), &theme)
            .map_err(|error| error.to_string())?;
    }
    Ok(EditorCommand::Batch {
        commands: vec![EditorCommand::SetVariables {
            variables,
            replace: true,
        }],
    })
}

pub fn execute(state: &mut EditorState, action: A) -> Result<(), String> {
    state.ui.design_system_inspector = DesignSystemInspectorDraft::for_state(state);
    let draft = state.ui.design_system_inspector.clone();
    let command = match action {
        A::Kind(index) => {
            state.ui.design_system_inspector.kind = *[
                SharedStyleKind::Paint,
                SharedStyleKind::Text,
                SharedStyleKind::Effect,
            ]
            .get(index)
            .ok_or("Unknown style kind")?;
            return Ok(());
        }
        A::Scope(index) => {
            if index > 2 {
                return Err("Unknown variable mode scope".into());
            }
            state.ui.design_system_inspector.scope = index;
            return Ok(());
        }
        A::LoadStyle(index) => {
            let (id, _) = draft
                .styles
                .get(index)
                .ok_or("Shared style is no longer available")?;
            let style = state
                .doc
                .shared_styles
                .as_ref()
                .and_then(|styles| styles.get(id))
                .ok_or("Shared style is no longer available")?;
            let draft = &mut state.ui.design_system_inspector;
            draft.values[0] = id.clone();
            draft.values[1] = style.name.clone();
            draft.kind = style.kind;
            return Ok(());
        }
        A::BrowseStyle(next) => {
            let count = draft.styles.len();
            if count == 0 {
                return Err("No shared styles yet; capture one from a selected node".into());
            }
            let index = draft
                .styles
                .iter()
                .position(|(id, _)| id == draft.values[0].trim())
                .map(|index| {
                    if next {
                        (index + 1) % count
                    } else {
                        (index + count - 1) % count
                    }
                })
                .unwrap_or(0);
            return execute(state, A::LoadStyle(index));
        }
        A::CaptureStyle => capture_style(state, &draft)?,
        A::ApplyStyle => style_command(SharedStyleOperation::Apply {
            id: draft.values[0].trim().into(),
            node_ids: selected_ids(state),
        }),
        A::DetachStyle => style_command(SharedStyleOperation::Detach {
            id: draft.values[0].trim().into(),
            node_ids: selected_ids(state),
        }),
        A::DeleteStyle => style_command(SharedStyleOperation::Delete {
            id: draft.values[0].trim().into(),
        }),
        A::Bind | A::Unbind => variable_binding_command(
            state,
            &selected_ids(state),
            draft.values[3].trim(),
            matches!(action, A::Bind).then_some(draft.values[2].trim().trim_start_matches('$')),
        )
        .map_err(|error| error.to_string())?,
        A::SetMode => {
            let scope = match draft.scope {
                0 => VariableModeScope::Node(state.selection.anchor.as_str().into()),
                1 => VariableModeScope::Page(
                    state
                        .doc
                        .pages
                        .as_ref()
                        .and_then(|pages| pages.get(state.ui.active_page_index))
                        .ok_or("This document has no pages; use document scope")?
                        .id
                        .clone(),
                ),
                _ => VariableModeScope::Global,
            };
            variable_scope_mode_command(
                state,
                scope,
                &BTreeMap::from([(draft.values[5].trim().into(), draft.values[6].trim().into())]),
            )
            .map_err(|error| error.to_string())?
        }
        A::SetFormula => formula_command(state, &draft)?,
        A::ImportTokens => {
            let value: Value =
                serde_json::from_str(&draft.values[7]).map_err(|error| error.to_string())?;
            let variables = crate::design_tokens::import_w3c_tokens(&value)
                .map_err(|error| error.to_string())?;
            let mut merged = state.doc.variables.clone().unwrap_or_default();
            merged.extend(variables.clone());
            let theme = effective_theme(&state.doc, &state.ui.variables.active_theme);
            for name in merged.keys() {
                resolve_variable_ref_checked(&format!("${name}"), Some(&merged), &theme)
                    .map_err(|error| error.to_string())?;
            }
            EditorCommand::Batch {
                commands: vec![EditorCommand::SetVariables {
                    variables,
                    replace: false,
                }],
            }
        }
        A::ExportTokens => {
            let theme = effective_theme(&state.doc, &state.ui.variables.active_theme);
            let value = crate::design_tokens::export_w3c_tokens(
                &state.doc.variables.clone().unwrap_or_default(),
                &theme,
            )
            .map_err(|error| error.to_string())?;
            state.ui.design_system_inspector.values[7] =
                serde_json::to_string_pretty(&value).map_err(|error| error.to_string())?;
            return Ok(());
        }
        A::BrowseFinding(next) => {
            let count = draft.lint_findings.len();
            if count > 0 {
                state.ui.design_system_inspector.lint_index = if next {
                    (draft.lint_index + 1) % count
                } else {
                    (draft.lint_index + count - 1) % count
                };
            }
            return Ok(());
        }
        A::Lint => {
            refresh_lint(state);
            return Ok(());
        }
        A::FixLint | A::FixFinding => {
            let ids = if action == A::FixFinding {
                draft
                    .lint_ids
                    .get(draft.lint_index)
                    .cloned()
                    .into_iter()
                    .collect()
            } else {
                draft.lint_ids.iter().cloned().collect()
            };
            let (command, _) = DesignLintSnapshot::new(state).prepare(Some(&ids))?;
            if let Some(command) = command {
                if !state.apply(command) {
                    return Err("Could not apply lint repairs".into());
                }
            }
            refresh_lint(state);
            return Ok(());
        }
    };
    state.ui.design_reject = None;
    state.apply(command);
    if let Some(reason) = state.ui.design_reject.take() {
        return Err(reason);
    }
    Ok(())
}

fn refresh_lint(state: &mut EditorState) {
    let snapshot = DesignLintSnapshot::new(state);
    state.ui.design_system_inspector.lint_ids = snapshot.issues.iter().map(issue_id).collect();
    state.ui.design_system_inspector.lint_findings = snapshot
        .issues
        .into_iter()
        .map(|issue| (issue.node_id, issue.reason))
        .collect();
    state.ui.design_system_inspector.lint_index = state.ui.design_system_inspector.lint_index.min(
        state
            .ui
            .design_system_inspector
            .lint_findings
            .len()
            .saturating_sub(1),
    );
}
