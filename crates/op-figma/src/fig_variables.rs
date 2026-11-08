//! Figma variable collections, modes, variables and aliases from a decoded
//! `.fig`, kept as data instead of baked into paints.
//!
//! A file carries its own local collections plus every library collection it
//! consumes, often at several published versions. Library records are
//! identified by `key` + `version`; references (`variableSetID`, `alias`) use
//! either a local `guid` or an `assetRef {key, version}`. Only the newest
//! version of each library collection/variable is kept, matching what Figma
//! shows as the current library state of the file.

use crate::kiwi::FigValue;
use crate::tree::guid_to_string;
use std::collections::BTreeMap;

/// Figma's resolved variable type.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum FigVariableType {
    Color,
    Float,
    String,
    Boolean,
}

/// One mode value: a concrete scalar or an alias to another variable id.
#[derive(Debug, Clone, PartialEq)]
pub enum FigVariableValue {
    /// `#RRGGBBAA`, upper case.
    Color(String),
    Number(f64),
    Text(String),
    Bool(bool),
    /// Canonical id of the aliased variable (see [`FigVariable::id`]).
    Alias(String),
}

/// A variable collection (`VARIABLE_SET`).
#[derive(Debug, Clone, PartialEq)]
pub struct FigVariableCollection {
    /// Canonical id: `key:<key>` for library collections, else the guid.
    pub id: String,
    pub name: String,
    pub key: Option<String>,
    pub version: Option<String>,
    /// True when the collection comes from a library (`sourceLibraryKey`).
    pub library: bool,
    /// `(mode id, mode name)` in Figma order; the first is the default.
    pub modes: Vec<(String, String)>,
}

/// A variable with its per-mode values.
#[derive(Debug, Clone, PartialEq)]
pub struct FigVariable {
    /// Canonical id: `key:<key>` for library variables, else the guid.
    pub id: String,
    /// Figma name; `/` separates groups (`Basic/Basic 300`).
    pub name: String,
    pub collection_id: String,
    pub kind: FigVariableType,
    pub key: Option<String>,
    pub version: Option<String>,
    /// `(mode id, value)` for every mode that defines a value.
    pub values: Vec<(String, FigVariableValue)>,
}

/// Every collection and variable of one file, newest library versions only.
#[derive(Debug, Clone, Default, PartialEq)]
pub struct FigVariableTable {
    pub collections: Vec<FigVariableCollection>,
    pub variables: Vec<FigVariable>,
}

impl FigVariableTable {
    pub fn is_empty(&self) -> bool {
        self.variables.is_empty()
    }

    pub fn collection(&self, id: &str) -> Option<&FigVariableCollection> {
        self.collections.iter().find(|c| c.id == id)
    }

    pub fn variable(&self, id: &str) -> Option<&FigVariable> {
        self.variables.iter().find(|v| v.id == id)
    }
}

/// Compare Figma `"<a>:<b>"` publish versions numerically.
fn version_rank(version: Option<&str>) -> (u64, u64) {
    let Some((a, b)) = version.and_then(|v| v.split_once(':')) else {
        return (0, 0);
    };
    (a.parse().unwrap_or(0), b.parse().unwrap_or(0))
}

fn canonical_id(node: &FigValue) -> Option<String> {
    match node.get_str("key") {
        Some(key) => Some(format!("key:{key}")),
        None => node.get("guid").and_then(guid_to_string),
    }
}

/// `{guid}` or `{assetRef:{key}}` reference → canonical id.
fn reference_id(reference: &FigValue) -> Option<String> {
    if let Some(guid) = reference.get("guid").and_then(guid_to_string) {
        return Some(guid);
    }
    reference
        .get("assetRef")
        .and_then(|asset| asset.get_str("key"))
        .map(|key| format!("key:{key}"))
}

fn channel(color: &FigValue, name: &str) -> u8 {
    let value = color.get_f64(name).unwrap_or(1.0).clamp(0.0, 1.0);
    (value * 255.0).round() as u8
}

fn color_hex(color: &FigValue) -> String {
    format!(
        "#{:02X}{:02X}{:02X}{:02X}",
        channel(color, "r"),
        channel(color, "g"),
        channel(color, "b"),
        channel(color, "a")
    )
}

fn parse_value(value: &FigValue, guid_ids: &BTreeMap<String, String>) -> Option<FigVariableValue> {
    if let Some(alias) = value.get("alias") {
        let id = reference_id(alias)?;
        return Some(FigVariableValue::Alias(
            guid_ids.get(&id).cloned().unwrap_or(id),
        ));
    }
    if let Some(color) = value.get("colorValue") {
        return Some(FigVariableValue::Color(color_hex(color)));
    }
    if let Some(number) = value.get_f64("floatValue") {
        return Some(FigVariableValue::Number(number));
    }
    if let Some(text) = value.get_str("textValue") {
        return Some(FigVariableValue::Text(text.to_string()));
    }
    value.get_bool("boolValue").map(FigVariableValue::Bool)
}

fn parse_type(node: &FigValue) -> Option<FigVariableType> {
    match node.get_str("variableResolvedType")? {
        "COLOR" => Some(FigVariableType::Color),
        "FLOAT" => Some(FigVariableType::Float),
        "STRING" => Some(FigVariableType::String),
        "BOOLEAN" => Some(FigVariableType::Boolean),
        _ => None,
    }
}

fn parse_collection(node: &FigValue, id: String) -> FigVariableCollection {
    let modes = node
        .get_array("variableSetModes")
        .unwrap_or(&[])
        .iter()
        .filter_map(|mode| {
            Some((
                mode.get("id").and_then(guid_to_string)?,
                mode.get_str("name").unwrap_or("Mode").to_string(),
            ))
        })
        .collect();
    FigVariableCollection {
        id,
        name: node.get_str("name").unwrap_or("Collection").to_string(),
        key: node.get_str("key").map(str::to_string),
        version: node.get_str("version").map(str::to_string),
        library: node.get_str("sourceLibraryKey").is_some(),
        modes,
    }
}

/// Keep the newest version per canonical id.
fn newest<'a>(nodes: impl Iterator<Item = &'a FigValue>) -> BTreeMap<String, &'a FigValue> {
    let mut out: BTreeMap<String, &FigValue> = BTreeMap::new();
    for node in nodes {
        let Some(id) = canonical_id(node) else {
            continue;
        };
        let newer = out.get(&id).is_none_or(|held| {
            version_rank(node.get_str("version")) > version_rank(held.get_str("version"))
        });
        if newer {
            out.insert(id, node);
        }
    }
    out
}

/// Extract the variable table from decoded node changes.
pub(crate) fn variables_from_node_changes(nodes: &[FigValue]) -> FigVariableTable {
    let of_type = |kind: &'static str| {
        nodes
            .iter()
            .filter(move |node| node.get_str("type") == Some(kind))
    };
    let sets = newest(of_type("VARIABLE_SET"));
    let vars = newest(of_type("VARIABLE"));
    // Local guid → canonical id, so aliases and set references written by
    // guid resolve to the same id as their keyed library record.
    let mut guid_ids = BTreeMap::new();
    for node in of_type("VARIABLE_SET").chain(of_type("VARIABLE")) {
        if let (Some(guid), Some(id)) = (
            node.get("guid").and_then(guid_to_string),
            canonical_id(node),
        ) {
            guid_ids.insert(guid, id);
        }
    }
    let collections: Vec<_> = sets
        .into_iter()
        .map(|(id, node)| parse_collection(node, id))
        .collect();
    let variables = vars
        .into_iter()
        .filter_map(|(id, node)| {
            let set = reference_id(node.get("variableSetID")?)?;
            let collection_id = guid_ids.get(&set).cloned().unwrap_or(set);
            let values = node
                .get("variableDataValues")
                .and_then(|values| values.get_array("entries"))
                .unwrap_or(&[])
                .iter()
                .filter_map(|entry| {
                    let mode = entry.get("modeID").and_then(guid_to_string)?;
                    let value = entry.get("variableData")?.get("value")?;
                    Some((mode, parse_value(value, &guid_ids)?))
                })
                .collect();
            Some(FigVariable {
                id,
                name: node.get_str("name")?.to_string(),
                collection_id,
                kind: parse_type(node)?,
                key: node.get_str("key").map(str::to_string),
                version: node.get_str("version").map(str::to_string),
                values,
            })
        })
        .collect();
    FigVariableTable {
        collections,
        variables,
    }
}

/// Decode a binary `.fig` and return its variable table.
pub fn read_fig_variables(bytes: &[u8]) -> Result<FigVariableTable, crate::FigParseError> {
    if crate::detect_kind(bytes) != crate::FigFileKind::Binary {
        return Err(crate::FigParseError::UnknownFormat);
    }
    let decoded = crate::figma_types::parse_fig_file(bytes)
        .map_err(|e| crate::FigParseError::Binary(e.to_string()))?;
    Ok(variables_from_node_changes(&decoded.node_changes))
}

#[cfg(test)]
#[path = "fig_variables_tests.rs"]
mod tests;
