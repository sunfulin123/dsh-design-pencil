//! DTCG/W3C token interchange for the renderer's color and numeric variables.
//! Pixel dimensions normalize to document pixels; unsupported units and
//! composite token kinds return errors rather than becoming inert metadata.

use crate::variables_resolve::{resolve_themed_value, resolve_variable_ref_checked};
use jian_ops_schema::variable::{VariableDefinition, VariableKind, VariableScalar, VariableValue};
use serde_json::{Map, Value};
use std::collections::BTreeMap;
use std::fmt;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TokenError {
    InvalidGroup(String),
    UnsupportedType { path: String, kind: String },
    InvalidValue { path: String, reason: String },
}
impl fmt::Display for TokenError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::InvalidGroup(path) => write!(f, "invalid token group at {path:?}"),
            Self::UnsupportedType { path, kind } => {
                write!(f, "unsupported token type {kind:?} at {path:?}")
            }
            Self::InvalidValue { path, reason } => write!(f, "invalid token {path:?}: {reason}"),
        }
    }
}
impl std::error::Error for TokenError {}

fn invalid(path: &str, reason: impl Into<String>) -> TokenError {
    TokenError::InvalidValue {
        path: path.into(),
        reason: reason.into(),
    }
}

fn rgba(hex: &str) -> Option<[u8; 4]> {
    let hex = hex.strip_prefix('#')?;
    let expanded;
    let hex = if hex.len() == 3 || hex.len() == 4 {
        expanded = hex.chars().flat_map(|c| [c, c]).collect::<String>();
        &expanded
    } else {
        hex
    };
    if hex.len() != 6 && hex.len() != 8 {
        return None;
    }
    if !hex.is_ascii() {
        return None;
    }
    let mut out = [0, 0, 0, 255];
    for (i, item) in out.iter_mut().enumerate().take(hex.len() / 2) {
        *item = u8::from_str_radix(&hex[i * 2..i * 2 + 2], 16).ok()?;
    }
    Some(out)
}

fn color_scalar(value: &Value, path: &str) -> Result<VariableScalar, TokenError> {
    let channels = if let Some(hex) = value.as_str() {
        rgba(hex).ok_or_else(|| invalid(path, "expected a hexadecimal color"))?
    } else {
        let object = value
            .as_object()
            .ok_or_else(|| invalid(path, "expected an sRGB color object"))?;
        if object.get("colorSpace").and_then(Value::as_str) != Some("srgb") {
            return Err(invalid(path, "only srgb colors are supported"));
        }
        let components = object
            .get("components")
            .and_then(Value::as_array)
            .filter(|c| c.len() == 3)
            .ok_or_else(|| invalid(path, "expected three sRGB components"))?;
        let mut channels = [0, 0, 0, 255];
        for (i, value) in components.iter().enumerate() {
            let component = value
                .as_f64()
                .filter(|n| n.is_finite() && (0.0..=1.0).contains(n))
                .ok_or_else(|| invalid(path, "sRGB components must be numbers from 0 to 1"))?;
            channels[i] = (component * 255.0).round() as u8;
        }
        if let Some(alpha) = object.get("alpha") {
            channels[3] = (alpha
                .as_f64()
                .filter(|n| n.is_finite() && (0.0..=1.0).contains(n))
                .ok_or_else(|| invalid(path, "alpha must be from 0 to 1"))?
                * 255.0)
                .round() as u8;
        }
        channels
    };
    let [r, g, b, a] = channels;
    Ok(VariableScalar::Str(if a == 255 {
        format!("#{r:02x}{g:02x}{b:02x}")
    } else {
        format!("#{r:02x}{g:02x}{b:02x}{a:02x}")
    }))
}

fn walk(
    input: &Value,
    path: &str,
    inherited: Option<&str>,
    out: &mut BTreeMap<String, VariableDefinition>,
    depth: usize,
) -> Result<(), TokenError> {
    if depth > 64 {
        return Err(invalid(path, "token nesting exceeds 64"));
    }
    let object = input
        .as_object()
        .ok_or_else(|| TokenError::InvalidGroup(path.into()))?;
    if object.contains_key("$root") || object.contains_key("$ref") {
        return Err(invalid(
            path,
            "group $root/$ref token semantics are not supported",
        ));
    }
    let kind = match object.get("$type") {
        Some(value) => Some(
            value
                .as_str()
                .ok_or_else(|| invalid(path, "$type must be a string"))?,
        ),
        None => inherited,
    };
    if let Some(value) = object.get("$value") {
        if path.is_empty() || object.keys().any(|key| !key.starts_with('$')) {
            return Err(invalid(
                path,
                "tokens must have a name and cannot also contain child tokens",
            ));
        }
        let kind = kind.ok_or_else(|| invalid(path, "missing $type"))?;
        let variable_kind = match kind {
            "color" => VariableKind::Color,
            "number" | "dimension" | "fontWeight" => VariableKind::Number,
            _ => {
                return Err(TokenError::UnsupportedType {
                    path: path.into(),
                    kind: kind.into(),
                })
            }
        };
        let scalar = if let Some(alias) = value
            .as_str()
            .and_then(|s| s.strip_prefix('{'))
            .and_then(|s| s.strip_suffix('}'))
        {
            if alias.is_empty() || alias.contains(['{', '}']) {
                return Err(invalid(path, "malformed alias"));
            }
            VariableScalar::Str(format!("${alias}"))
        } else if kind == "color" {
            color_scalar(value, path)?
        } else if kind == "dimension" {
            let dimension = value
                .as_object()
                .ok_or_else(|| invalid(path, "expected a dimension object"))?;
            if dimension.get("unit").and_then(Value::as_str) != Some("px") {
                return Err(invalid(path, "only px dimensions are supported"));
            }
            VariableScalar::Num(
                dimension
                    .get("value")
                    .and_then(Value::as_f64)
                    .filter(|n| n.is_finite())
                    .ok_or_else(|| invalid(path, "dimension value must be finite"))?,
            )
        } else {
            VariableScalar::Num(
                value
                    .as_f64()
                    .filter(|n| n.is_finite())
                    .ok_or_else(|| invalid(path, "expected a finite number"))?,
            )
        };
        if out
            .insert(
                path.into(),
                VariableDefinition {
                    kind: variable_kind,
                    value: VariableValue::Scalar(scalar),
                },
            )
            .is_some()
        {
            return Err(invalid(path, "duplicate token path"));
        }
        return Ok(());
    }
    for (name, value) in object {
        if name.starts_with('$') {
            continue;
        }
        if name.is_empty() || name.contains(['.', '{', '}', '$']) {
            return Err(invalid(
                path,
                "token names must be nonempty and cannot contain . { } $",
            ));
        }
        let nested = if path.is_empty() {
            name.clone()
        } else {
            format!("{path}.{name}")
        };
        walk(value, &nested, kind, out, depth + 1)?;
    }
    Ok(())
}

pub fn import_w3c_tokens(
    input: &Value,
) -> Result<BTreeMap<String, VariableDefinition>, TokenError> {
    let mut out = BTreeMap::new();
    walk(input, "", None, &mut out, 0)?;
    if out.is_empty() {
        return Err(TokenError::InvalidGroup("no supported tokens found".into()));
    }
    for name in out.keys() {
        resolve_variable_ref_checked(&format!("${name}"), Some(&out), &BTreeMap::new())
            .map_err(|error| invalid(name, error.to_string()))?;
    }
    Ok(out)
}

fn insert_token(root: &mut Map<String, Value>, path: &str, token: Value) -> Result<(), TokenError> {
    let mut pieces = path.splitn(2, '.');
    let name = pieces.next().unwrap_or_default();
    if name.is_empty() || name.contains(['{', '}', '$']) {
        return Err(invalid(path, "invalid token name"));
    }
    if let Some(rest) = pieces.next() {
        let entry = root
            .entry(name)
            .or_insert_with(|| Value::Object(Map::new()));
        let group = entry
            .as_object_mut()
            .filter(|group| !group.contains_key("$value"))
            .ok_or_else(|| invalid(path, "token/group path collision"))?;
        insert_token(group, rest, token)
    } else {
        if root.contains_key(name) {
            return Err(invalid(path, "token/group path collision"));
        }
        root.insert(name.into(), token);
        Ok(())
    }
}

/// Export the requested mode as a standard token set. Aliases stay aliases;
/// formulas are evaluated because DTCG has no arithmetic expression type.
pub fn export_w3c_tokens(
    vars: &BTreeMap<String, VariableDefinition>,
    theme: &BTreeMap<String, String>,
) -> Result<Value, TokenError> {
    let mut output = Map::new();
    for (name, definition) in vars {
        let kind = match definition.kind {
            VariableKind::Color => "color",
            VariableKind::Number => "number",
            _ => {
                return Err(TokenError::UnsupportedType {
                    path: name.clone(),
                    kind: format!("{:?}", definition.kind),
                })
            }
        };
        let resolved = resolve_variable_ref_checked(&format!("${name}"), Some(vars), theme)
            .map_err(|e| invalid(name, e.to_string()))?;
        let raw = match &definition.value {
            VariableValue::Scalar(value) => Some(value),
            VariableValue::Themed(values) => resolve_themed_value(values, theme),
        };
        let value = if let Some(VariableScalar::Str(alias)) =
            raw.filter(|value| matches!(value,VariableScalar::Str(s) if s.starts_with('$')))
        {
            Value::String(format!("{{{}}}", &alias[1..]))
        } else {
            match resolved {
                VariableScalar::Num(number) => serde_json::json!(number),
                VariableScalar::Str(hex) => {
                    let [r, g, b, a] =
                        rgba(&hex).ok_or_else(|| invalid(name, "expected a hex color"))?;
                    serde_json::json!({"colorSpace":"srgb","components":[r as f64/255.0,g as f64/255.0,b as f64/255.0],"alpha":a as f64/255.0})
                }
                _ => return Err(invalid(name, "unsupported scalar")),
            }
        };
        insert_token(
            &mut output,
            name,
            serde_json::json!({"$type":kind,"$value":value}),
        )?;
    }
    Ok(Value::Object(output))
}
