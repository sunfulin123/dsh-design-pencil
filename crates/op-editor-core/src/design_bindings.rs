//! Variable bindings are authored `$references` in existing renderer fields.
//! Mode overrides use the persisted node `theme` map and inherit down the tree.
//! Tools target the active page, matching ordinary PatchNodeData operations.
//! Supported properties: fill, stroke, opacity, gap, padding, fontWeight and
//! content. Concrete visibility and text fields (`fontSize`, `fontFamily`,
//! `fontStyle`, `lineHeight`, `letterSpacing`, alignments and decorations) retain
//! references in `variableBindings`. Effect paths use `effects.N.FIELD`: shadow
//! color, blur, offsetX/Y, inner and visibility; layer/backdrop blur radius and
//! visibility. Shadow spread and geometry remain unsupported by the renderer.
//! Empty mode maps clear overrides; `auto` clears one collection/axis.
//! Resolution order: defaults → global → transient preview → page → ancestors.

mod extensions;
mod modes;
pub use extensions::{resolve_concrete_bindings, resolve_document_bindings};
pub(crate) use modes::apply_scope_modes;
pub use modes::{
    page_theme, variable_mode_info, variable_scope_mode_command, VariableModeInfo,
    VariableModeScope,
};

use crate::variables_resolve::{resolve_document_for_canvas, resolve_variable_ref_checked};
use crate::{EditorCommand, EditorState, NodeId, PenNodeExt};
use jian_ops_schema::node::PenNode;
use jian_ops_schema::variable::VariableKind;
use serde_json::{Map, Value};
use std::collections::BTreeMap;
use std::fmt;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum VariableBindingError {
    InvalidProperty(String),
    InvalidVariable(String),
    InvalidTarget(String),
    InvalidMode(String),
    InvalidPatch(String),
}
impl fmt::Display for VariableBindingError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::InvalidProperty(s) => write!(f, "unsupported variable binding property {s:?}"),
            Self::InvalidVariable(s) => write!(f, "invalid variable: {s}"),
            Self::InvalidTarget(s) => write!(f, "node {s:?} is missing, locked, or incompatible"),
            Self::InvalidMode(s) => write!(f, "invalid mode: {s}"),
            Self::InvalidPatch(s) => write!(f, "invalid authored patch: {s}"),
        }
    }
}
impl std::error::Error for VariableBindingError {}

fn find<'a>(nodes: &'a [PenNode], id: &str) -> Option<&'a PenNode> {
    for node in nodes {
        if node.base().id == id {
            return Some(node);
        }
        if let Some(children) = node.children() {
            if let Some(node) = find(children, id) {
                return Some(node);
            }
        }
    }
    None
}

fn node_theme(
    nodes: &[PenNode],
    id: &str,
    inherited: &BTreeMap<String, String>,
) -> Option<BTreeMap<String, String>> {
    for node in nodes {
        let mut theme = inherited.clone();
        if let Some(overrides) = &node.base().theme {
            theme.extend(overrides.clone());
        }
        if node.base().id == id {
            return Some(theme);
        }
        if let Some(children) = node.children() {
            if let Some(theme) = node_theme(children, id, &theme) {
                return Some(theme);
            }
        }
    }
    None
}

fn same_value(left: &Value, right: &Value) -> bool {
    match (left, right) {
        (Value::Number(a), Value::Number(b)) => a.as_f64() == b.as_f64(),
        (Value::Array(a), Value::Array(b)) => {
            a.len() == b.len() && a.iter().zip(b).all(|(a, b)| same_value(a, b))
        }
        (Value::Object(a), Value::Object(b)) => {
            a.len() == b.len()
                && a.iter()
                    .all(|(k, v)| b.get(k).is_some_and(|b| same_value(v, b)))
        }
        _ => left == right,
    }
}

fn validate_references(
    value: &Value,
    state: &EditorState,
    theme: &BTreeMap<String, String>,
) -> Result<(), VariableBindingError> {
    match value {
        Value::String(reference) if reference.starts_with('$') => {
            resolve_variable_ref_checked(reference, state.doc.variables.as_ref(), theme)
                .map_err(|e| VariableBindingError::InvalidVariable(e.to_string()))?;
        }
        Value::String(expression) if crate::variables_resolve::is_formula(expression) => {
            crate::variables_resolve::evaluate_formula(expression, &mut |reference| {
                match resolve_variable_ref_checked(reference, state.doc.variables.as_ref(), theme)?
                {
                    jian_ops_schema::variable::VariableScalar::Num(value) => Ok(value),
                    _ => Err(
                        crate::variables_resolve::VariableResolveError::TypeMismatch(
                            reference.into(),
                        ),
                    ),
                }
            })
            .map_err(|e| VariableBindingError::InvalidVariable(e.to_string()))?;
        }
        Value::Array(values) => {
            for value in values {
                validate_references(value, state, theme)?;
            }
        }
        Value::Object(values) => {
            for value in values.values() {
                validate_references(value, state, theme)?;
            }
        }
        _ => {}
    }
    Ok(())
}

fn primary_fill(value: &mut Value, color: &str) -> Result<(), VariableBindingError> {
    if value.is_null() {
        *value = Value::Array(vec![]);
    }
    let fills = value
        .as_array_mut()
        .ok_or_else(|| VariableBindingError::InvalidPatch("fill is not an array".into()))?;
    if let Some(solid) = fills.iter_mut().find(|fill| fill["type"] == "solid") {
        solid["color"] = Value::String(color.into());
    } else {
        fills.push(serde_json::json!({"type":"solid","color":color}));
    }
    Ok(())
}

fn contains_reference(value: &Value) -> bool {
    match value {
        Value::String(s) => s.starts_with('$') || crate::variables_resolve::is_formula(s),
        Value::Array(values) => values.iter().any(contains_reference),
        Value::Object(values) => values.values().any(contains_reference),
        _ => false,
    }
}

fn command(
    state: &EditorState,
    patches: Vec<(String, Map<String, Value>)>,
) -> Result<EditorCommand, VariableBindingError> {
    if patches.is_empty() {
        return Err(VariableBindingError::InvalidTarget(
            "nodeIds must not be empty".into(),
        ));
    }
    let page_id = state
        .doc
        .pages
        .as_ref()
        .map(|_| state.ui.active_page_index.to_string());
    let commands: Vec<_> = patches
        .iter()
        .map(|(id, patch)| EditorCommand::PatchNodeData {
            node_id: NodeId::new(id),
            patch_json: Value::Object(patch.clone()).to_string(),
            page_id: page_id.clone(),
        })
        .collect();
    // Raw node patches do not own history; a batch gives even one binding an undo entry.
    let cmd = EditorCommand::Batch { commands };
    let mut draft = state.clone();
    if !draft.apply(cmd.clone()) {
        return Err(VariableBindingError::InvalidPatch(
            "node schema rejected the patch".into(),
        ));
    }
    for (id, patch) in patches {
        let actual = serde_json::to_value(
            find(draft.active_children(), &id)
                .ok_or_else(|| VariableBindingError::InvalidTarget(id.clone()))?,
        )
        .map_err(|e| VariableBindingError::InvalidPatch(e.to_string()))?;
        for (key, value) in patch {
            if !same_value(actual.get(&key).unwrap_or(&Value::Null), &value) {
                return Err(VariableBindingError::InvalidTarget(id));
            }
        }
    }
    Ok(cmd)
}

pub fn variable_binding_command(
    state: &EditorState,
    ids: &[String],
    property: &str,
    variable: Option<&str>,
) -> Result<EditorCommand, VariableBindingError> {
    if extensions::extension_kind(property).is_some() {
        return extensions::extension_binding_command(state, ids, property, variable);
    }
    let expected = match property {
        "fill" | "stroke" => VariableKind::Color,
        "opacity" | "gap" | "padding" | "fontWeight" => VariableKind::Number,
        "content" => VariableKind::String,
        _ => return Err(VariableBindingError::InvalidProperty(property.into())),
    };
    let variable = variable.map(|s| s.strip_prefix('$').unwrap_or(s));
    if let Some(name) = variable {
        let definition = state
            .doc
            .variables
            .as_ref()
            .and_then(|vars| vars.get(name))
            .ok_or_else(|| VariableBindingError::InvalidVariable(name.into()))?;
        if definition.kind != expected {
            return Err(VariableBindingError::InvalidVariable(format!(
                "{name:?} must have type {expected:?}"
            )));
        }
        resolve_variable_ref_checked(
            &format!("${name}"),
            state.doc.variables.as_ref(),
            &modes::active_page_theme(state),
        )
        .map_err(|e| VariableBindingError::InvalidVariable(e.to_string()))?;
    }
    let resolved = if variable.is_none() {
        let mut copy = state.clone();
        copy.doc = resolve_document_for_canvas(&state.doc, &state.ui.variables.active_theme);
        Some(copy)
    } else {
        None
    };
    let mut patches = Vec::new();
    for id in ids {
        let node = find(state.active_children(), id)
            .ok_or_else(|| VariableBindingError::InvalidTarget(id.clone()))?;
        if !state.is_editable(&NodeId::new(id)) || matches!(node, PenNode::Ref(_)) {
            return Err(VariableBindingError::InvalidTarget(id.clone()));
        }
        if matches!(property, "fontWeight" | "content") && !matches!(node, PenNode::Text(_)) {
            return Err(VariableBindingError::InvalidTarget(id.clone()));
        }
        let authored = serde_json::to_value(node)
            .map_err(|e| VariableBindingError::InvalidPatch(e.to_string()))?;
        let mut value = authored.get(property).cloned().unwrap_or(Value::Null);
        let theme = node_theme(
            state.active_children(),
            id,
            &modes::active_page_theme(state),
        )
        .ok_or_else(|| VariableBindingError::InvalidTarget(id.clone()))?;
        if let Some(name) = variable {
            let reference = format!("${name}");
            validate_references(&Value::String(reference.clone()), state, &theme)?;
            let scalar =
                resolve_variable_ref_checked(&reference, state.doc.variables.as_ref(), &theme)
                    .map_err(|e| VariableBindingError::InvalidVariable(e.to_string()))?;
            match (&expected, &scalar) {
                (VariableKind::Color, jian_ops_schema::variable::VariableScalar::Str(color)) => {
                    if !color.strip_prefix('#').is_some_and(|hex| {
                        matches!(hex.len(), 3 | 6 | 8) && hex.bytes().all(|c| c.is_ascii_hexdigit())
                    }) {
                        return Err(VariableBindingError::InvalidVariable(format!(
                            "{name} is not a renderable hex color"
                        )));
                    }
                }
                (VariableKind::Number, jian_ops_schema::variable::VariableScalar::Num(value))
                    if (property == "opacity" && !(0.0..=1.0).contains(value))
                        || (property == "fontWeight" && !(1.0..=1000.0).contains(value)) =>
                {
                    return Err(VariableBindingError::InvalidVariable(format!(
                        "{name} is out of range for {property}"
                    )));
                }
                _ => {}
            }
            match property {
                "fill" => primary_fill(&mut value, &reference)?,
                "stroke" => {
                    if value.is_null() {
                        value = serde_json::json!({"thickness":1,"fill":[]});
                    }
                    primary_fill(&mut value["fill"], &reference)?;
                }
                _ => value = Value::String(reference),
            }
        } else {
            if !contains_reference(&value) {
                return Err(VariableBindingError::InvalidPatch(format!(
                    "{id}.{property} is not bound"
                )));
            }
            validate_references(&value, state, &theme)?;
            let concrete = find(resolved.as_ref().unwrap().active_children(), id)
                .ok_or_else(|| VariableBindingError::InvalidTarget(id.clone()))?;
            value = serde_json::to_value(concrete)
                .map_err(|e| VariableBindingError::InvalidPatch(e.to_string()))?
                .get(property)
                .cloned()
                .unwrap_or(Value::Null);
            if contains_reference(&value) {
                return Err(VariableBindingError::InvalidVariable(format!(
                    "{id}.{property} could not be resolved"
                )));
            }
        }
        patches.push((id.clone(), Map::from_iter([(property.into(), value)])));
    }
    command(state, patches)
}

pub fn variable_mode_command(
    state: &EditorState,
    ids: &[String],
    modes: &BTreeMap<String, String>,
) -> Result<EditorCommand, VariableBindingError> {
    modes::validate_modes(state, modes)?;
    let mut patches = Vec::new();
    for id in ids {
        let node = find(state.active_children(), id)
            .ok_or_else(|| VariableBindingError::InvalidTarget(id.clone()))?;
        if !state.is_editable(&NodeId::new(id)) {
            return Err(VariableBindingError::InvalidTarget(id.clone()));
        }
        let theme = modes::update_modes(node.base().theme.as_ref(), modes);
        patches.push((
            id.clone(),
            Map::from_iter([("theme".into(), serde_json::json!(theme))]),
        ));
    }
    command(state, patches)
}
