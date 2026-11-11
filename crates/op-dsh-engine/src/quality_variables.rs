//! Inspect explicitly authored typed variable bindings without changing the document.

use std::collections::{BTreeMap, BTreeSet};

use jian_ops_schema::node::PenNode;
use jian_ops_schema::variable::VariableScalar;
use op_editor_core::variables_resolve::{effective_theme, resolve_variable_ref_checked};
use op_editor_core::{EditorState, PenNodeExt};
use serde_json::{json, Value};

pub(crate) fn check(state: &EditorState, scope: Option<&BTreeSet<String>>) -> Vec<Value> {
    let mut theme = effective_theme(&state.doc, &state.ui.variables.active_theme);
    if let Some(overrides) = state.doc.pages.as_ref().and_then(|pages| {
        pages
            .get(
                state
                    .ui
                    .active_page_index
                    .min(pages.len().saturating_sub(1)),
            )
            .and_then(|page| page.theme.as_ref())
    }) {
        theme.extend(overrides.clone());
    }
    let mut issues = Vec::new();
    for root in state.active_children() {
        inspect(root, state, scope, &theme, &mut issues);
    }
    issues
}

fn inspect(
    node: &PenNode,
    state: &EditorState,
    scope: Option<&BTreeSet<String>>,
    inherited: &BTreeMap<String, String>,
    issues: &mut Vec<Value>,
) {
    let mut theme = inherited.clone();
    if let Some(overrides) = &node.base().theme {
        theme.extend(overrides.clone());
    }
    if scope.is_none_or(|ids| ids.contains(node.id_str())) {
        for (property, reference) in node.base().variable_bindings.iter().flatten() {
            let Some(kind) = expected_kind(property) else {
                continue;
            };
            let problem =
                match resolve_variable_ref_checked(reference, state.doc.variables.as_ref(), &theme)
                {
                    Err(error) => Some(error.to_string()),
                    Ok(value) if !matches_kind(&value, kind) => {
                        Some(format!("value is incompatible with {property}"))
                    }
                    Ok(_) => None,
                };
            if let Some(problem) = problem {
                issues.push(json!({
                    "nodeId": node.id_str(), "property": property, "reference": reference,
                    "severity": "error", "reason": problem,
                    "suggestion": "Inspect the variable and active mode, then repair or detach this binding.",
                }));
            }
        }
    }
    for child in node.children().into_iter().flatten() {
        inspect(child, state, scope, &theme, issues);
    }
}

fn expected_kind(property: &str) -> Option<&'static str> {
    match property {
        "fontSize" | "lineHeight" | "letterSpacing" => Some("number"),
        "fontFamily" | "fontStyle" | "textAlign" | "textAlignVertical" => Some("string"),
        "visible" | "enabled" | "underline" | "strikethrough" => Some("boolean"),
        _ => {
            let parts: Vec<_> = property.split('.').collect();
            if parts.len() != 3 || parts[0] != "effects" || parts[1].parse::<usize>().is_err() {
                return None;
            }
            match parts[2] {
                "visible" | "inner" => Some("boolean"),
                "blur" | "offsetX" | "offsetY" | "radius" => Some("number"),
                "color" => Some("string"),
                _ => None,
            }
        }
    }
}

fn matches_kind(value: &VariableScalar, kind: &str) -> bool {
    matches!(
        (value, kind),
        (VariableScalar::Num(_), "number")
            | (VariableScalar::Str(_), "string")
            | (VariableScalar::Bool(_), "boolean")
    )
}
