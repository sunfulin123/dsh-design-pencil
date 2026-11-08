//! Concrete renderer fields keep references separately from their fallback values.
use super::{command, find, node_theme, VariableBindingError};
use crate::variables_resolve::{resolve_variable_ref_checked, VariableResolveError};
use crate::{EditorState, NodeId, PenNodeExt};
use jian_ops_schema::node::PenNode;
use jian_ops_schema::variable::{VariableKind, VariableScalar};
use serde_json::{Map, Value};
use std::collections::BTreeMap;

pub(super) fn extension_kind(property: &str) -> Option<VariableKind> {
    match property {
        "visible" | "enabled" | "underline" | "strikethrough" => Some(VariableKind::Boolean),
        "fontFamily" | "fontStyle" | "textAlign" | "textAlignVertical" => {
            Some(VariableKind::String)
        }
        "fontSize" | "lineHeight" | "letterSpacing" => Some(VariableKind::Number),
        _ => {
            let parts: Vec<_> = property.split('.').collect();
            if parts.len() != 3 || parts[0] != "effects" || parts[1].parse::<usize>().is_err() {
                return None;
            }
            match parts[2] {
                "color" => Some(VariableKind::Color),
                "visible" | "inner" => Some(VariableKind::Boolean),
                "blur" | "offsetX" | "offsetY" | "radius" => Some(VariableKind::Number),
                _ => None,
            }
        }
    }
}

fn parent_mut<'a>(
    value: &'a mut Value,
    property: &str,
) -> Option<(&'a mut Map<String, Value>, String)> {
    let mut parts = property.split('.').peekable();
    let mut current = value;
    while let Some(part) = parts.next() {
        if parts.peek().is_none() {
            return Some((current.as_object_mut()?, part.into()));
        }
        current = if current.is_array() {
            current.get_mut(part.parse::<usize>().ok()?)?
        } else {
            current.get_mut(part)?
        };
    }
    None
}

fn compatible(node: &PenNode, property: &str, authored: &Value) -> bool {
    if extension_kind(property).is_none() {
        return false;
    }
    if property == "visible" || property == "enabled" {
        return true;
    }
    if !property.starts_with("effects.") {
        return matches!(node, PenNode::Text(_));
    }
    let parts: Vec<_> = property.split('.').collect();
    let Some(effect) = parts
        .get(1)
        .and_then(|n| n.parse::<usize>().ok())
        .and_then(|n| authored.get("effects")?.get(n))
    else {
        return false;
    };
    match effect["type"].as_str() {
        Some("shadow") => matches!(
            parts[2],
            "color" | "blur" | "offsetX" | "offsetY" | "visible" | "inner"
        ),
        Some("blur" | "background_blur") => matches!(parts[2], "radius" | "visible"),
        _ => false,
    }
}

fn scalar_value(property: &str, scalar: VariableScalar) -> Result<Value, VariableBindingError> {
    let kind = extension_kind(property)
        .ok_or_else(|| VariableBindingError::InvalidProperty(property.into()))?;
    let invalid =
        || VariableBindingError::InvalidVariable(format!("value is incompatible with {property}"));
    match (kind, scalar) {
        (VariableKind::Boolean, VariableScalar::Bool(v)) => Ok(Value::Bool(v)),
        (VariableKind::Number, VariableScalar::Num(v)) => {
            let valid = v.is_finite()
                && match property {
                    "fontSize" => v > 0.0 && v <= f32::MAX as f64,
                    "lineHeight" => v > 0.0 && v <= 4.0,
                    _ if property.ends_with(".blur") || property.ends_with(".radius") => {
                        v >= 0.0 && v <= f32::MAX as f64
                    }
                    _ if property.starts_with("effects.") => v.abs() <= f32::MAX as f64,
                    _ => v.abs() <= f32::MAX as f64,
                };
            if valid {
                Ok(serde_json::json!(v))
            } else {
                Err(invalid())
            }
        }
        (VariableKind::Color, VariableScalar::Str(v))
            if op_util::hex_color::parse_hex_rgba8(
                &v,
                op_util::hex_color::HexOptions {
                    require_hash: true,
                    ..Default::default()
                },
            )
            .is_some() =>
        {
            Ok(Value::String(v))
        }
        (VariableKind::String, VariableScalar::Str(v)) => {
            let valid = match property {
                "fontFamily" => !v.trim().is_empty(),
                "fontStyle" => matches!(v.as_str(), "normal" | "italic"),
                "textAlign" => matches!(v.as_str(), "left" | "center" | "right" | "justify"),
                "textAlignVertical" => matches!(v.as_str(), "top" | "middle" | "bottom"),
                _ => false,
            };
            if valid {
                Ok(Value::String(v))
            } else {
                Err(invalid())
            }
        }
        _ => Err(invalid()),
    }
}

pub(super) fn extension_binding_command(
    state: &EditorState,
    ids: &[String],
    property: &str,
    variable: Option<&str>,
) -> Result<crate::EditorCommand, VariableBindingError> {
    let expected = extension_kind(property)
        .ok_or_else(|| VariableBindingError::InvalidProperty(property.into()))?;
    let reference = variable.map(|v| format!("${}", v.strip_prefix('$').unwrap_or(v)));
    if let Some(reference) = &reference {
        if !state
            .doc
            .variables
            .as_ref()
            .and_then(|vars| vars.get(&reference[1..]))
            .is_some_and(|def| def.kind == expected)
        {
            return Err(VariableBindingError::InvalidVariable(reference.clone()));
        }
    }
    let inherited = super::modes::active_page_theme(state);
    let mut patches = Vec::new();
    for id in ids {
        let node = find(state.active_children(), id)
            .ok_or_else(|| VariableBindingError::InvalidTarget(id.clone()))?;
        let mut value = serde_json::to_value(node)
            .map_err(|e| VariableBindingError::InvalidPatch(e.to_string()))?;
        if !state.is_editable(&NodeId::new(id))
            || matches!(node, PenNode::Ref(_))
            || !compatible(node, property, &value)
        {
            return Err(VariableBindingError::InvalidTarget(id.clone()));
        }
        let theme = node_theme(state.active_children(), id, &inherited)
            .ok_or_else(|| VariableBindingError::InvalidTarget(id.clone()))?;
        let mut bindings = node.base().variable_bindings.clone().unwrap_or_default();
        let bound = reference
            .as_ref()
            .or_else(|| bindings.get(property))
            .ok_or_else(|| {
                VariableBindingError::InvalidPatch(format!("{id}.{property} is not bound"))
            })?;
        let scalar = resolve_variable_ref_checked(bound, state.doc.variables.as_ref(), &theme)
            .map_err(|e| VariableBindingError::InvalidVariable(e.to_string()))?;
        let concrete = scalar_value(property, scalar)?;
        let mut patch = Map::new();
        if let Some(reference) = &reference {
            bindings.insert(property.into(), reference.clone());
        } else {
            let (parent, key) = parent_mut(&mut value, property)
                .ok_or_else(|| VariableBindingError::InvalidTarget(id.clone()))?;
            parent.insert(key, concrete);
            bindings.remove(property);
            let root = property.split('.').next().unwrap();
            patch.insert(root.into(), value[root].clone());
        }
        patch.insert("variableBindings".into(), serde_json::json!(bindings));
        patches.push((id.clone(), patch));
    }
    command(state, patches)
}

/// Resolve only recognized compatible bindings, preserving authored fallback fields on errors.
pub fn resolve_concrete_bindings(
    node: &mut PenNode,
    vars: Option<&BTreeMap<String, jian_ops_schema::variable::VariableDefinition>>,
    theme: &BTreeMap<String, String>,
) -> bool {
    let Some(bindings) = node.base().variable_bindings.as_ref() else {
        return false;
    };
    if bindings.is_empty() {
        return false;
    }
    let Ok(mut value) = serde_json::to_value(&*node) else {
        return false;
    };
    let mut changed = false;
    for (property, reference) in bindings {
        if !compatible(node, property, &value) {
            continue;
        }
        let concrete = resolve_variable_ref_checked(reference, vars, theme).and_then(|scalar| {
            scalar_value(property, scalar)
                .map_err(|_| VariableResolveError::TypeMismatch(reference.clone()))
        });
        if let Ok(concrete) = concrete {
            if let Some((parent, key)) = parent_mut(&mut value, property) {
                parent.insert(key, concrete);
                changed = true;
            }
        }
    }
    if changed {
        if let Ok(resolved) = serde_json::from_value(value) {
            *node = resolved;
            return true;
        }
    }
    false
}

/// Prepare concrete-only bindings for exporters without losing authored CSS tokens.
pub fn resolve_document_bindings(
    doc: &jian_ops_schema::PenDocument,
    active: &BTreeMap<String, String>,
) -> jian_ops_schema::PenDocument {
    fn walk(
        nodes: &mut [PenNode],
        vars: Option<&BTreeMap<String, jian_ops_schema::variable::VariableDefinition>>,
        inherited: &BTreeMap<String, String>,
    ) {
        for node in nodes {
            let mut theme = inherited.clone();
            if let Some(overrides) = &node.base().theme {
                theme.extend(overrides.clone());
            }
            resolve_concrete_bindings(node, vars, &theme);
            if let Some(children) = node.children_mut() {
                walk(children, vars, &theme);
            }
        }
    }
    let theme = crate::variables_resolve::effective_theme(doc, active);
    let mut resolved = doc.clone();
    walk(&mut resolved.children, doc.variables.as_ref(), &theme);
    if let Some(pages) = resolved.pages.as_mut() {
        for page in pages {
            let mut page_theme = theme.clone();
            if let Some(overrides) = &page.theme {
                page_theme.extend(overrides.clone());
            }
            walk(&mut page.children, doc.variables.as_ref(), &page_theme);
        }
    }
    resolved
}
