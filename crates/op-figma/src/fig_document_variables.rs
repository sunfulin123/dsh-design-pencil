//! Document variables from a `.fig` variable table, Figma-style.
//!
//! Each collection becomes a theme axis (its modes are the axis values, the
//! first the default) plus a `variableCollections` entry. The file keeps the
//! values it was saved with, as Figma does until library updates are
//! accepted. Collections whose key matches a built-in library (Talkdesk
//! Cobalt) are linked to it and their variables take the library's CSS
//! names, so `get_library_updates` can later compare them; everything else
//! keeps its Figma name (`Colors/Primary/9`).

use crate::fig_variables::{
    FigVariable, FigVariableCollection, FigVariableTable, FigVariableType, FigVariableValue,
};
use jian_ops_schema::variable::{
    CollectionVariable, ThemedValue, VariableCollection, VariableDefinition, VariableKind,
    VariableScalar, VariableValue,
};
use op_editor_core::variable_library::{collection_by_key, LibraryCollection, VariableLibrary};
use std::collections::{BTreeMap, HashMap};

/// Variables, theme axes and collections ready for a `PenDocument`, plus
/// the document name of every file variable (by canonical id).
#[derive(Debug, Default, Clone, PartialEq)]
pub struct FigDocumentVariables {
    pub variables: BTreeMap<String, VariableDefinition>,
    pub themes: BTreeMap<String, Vec<String>>,
    pub collections: BTreeMap<String, VariableCollection>,
    pub names: HashMap<String, String>,
    /// Canonical collection id → theme axis, for multi-mode collections.
    pub axes: HashMap<String, String>,
}

impl FigDocumentVariables {
    pub fn is_empty(&self) -> bool {
        self.variables.is_empty()
    }

    /// Move a converted document's variable sections out of it.
    pub fn take_from(doc: &mut jian_ops_schema::PenDocument) -> Self {
        Self {
            variables: doc.variables.take().unwrap_or_default(),
            themes: doc.themes.take().unwrap_or_default(),
            collections: doc.variable_collections.take().unwrap_or_default(),
            ..Self::default()
        }
    }

    /// Fill the document's variable sections; existing entries win.
    pub fn apply_to(self, doc: &mut jian_ops_schema::PenDocument) {
        if self.is_empty() {
            return;
        }
        let vars = doc.variables.get_or_insert_with(BTreeMap::new);
        for (name, definition) in self.variables {
            vars.entry(name).or_insert(definition);
        }
        let themes = doc.themes.get_or_insert_with(BTreeMap::new);
        for (axis, modes) in self.themes {
            themes.entry(axis).or_insert(modes);
        }
        let collections = doc.variable_collections.get_or_insert_with(BTreeMap::new);
        for (name, collection) in self.collections {
            collections.entry(name).or_insert(collection);
        }
    }
}

struct Axis<'a> {
    name: String,
    library: Option<(&'static VariableLibrary, &'static LibraryCollection)>,
    source: &'a FigVariableCollection,
}

fn axes(table: &FigVariableTable) -> HashMap<&str, Axis<'_>> {
    let mut used: HashMap<String, usize> = HashMap::new();
    table
        .collections
        .iter()
        .map(|source| {
            let library = source.key.as_deref().and_then(collection_by_key);
            let base = library.map_or(source.name.clone(), |(_, c)| c.name.clone());
            let seen = used.entry(base.clone()).or_default();
            *seen += 1;
            // A file can hold same-named collections from different libraries.
            let name = if *seen == 1 {
                base
            } else {
                format!("{base} ({seen})")
            };
            (
                source.id.as_str(),
                Axis {
                    name,
                    library,
                    source,
                },
            )
        })
        .collect()
}

fn document_name(
    variable: &FigVariable,
    axis: Option<&Axis>,
    taken: &BTreeMap<String, ()>,
) -> String {
    if let Some((library, collection)) = axis.and_then(|a| a.library) {
        let linked = library
            .by_figma_name(&collection.name, &variable.name)
            .or_else(|| {
                library
                    .variables
                    .values()
                    .find(|v| v.figma_name == variable.name)
            });
        if let Some(linked) = linked {
            return linked.name.clone();
        }
    }
    match axis {
        Some(axis) if taken.contains_key(&variable.name) => {
            format!("{} ({})", variable.name, axis.name)
        }
        _ => variable.name.clone(),
    }
}

fn scalar(value: &FigVariableValue, names: &HashMap<String, String>) -> Option<VariableScalar> {
    Some(match value {
        FigVariableValue::Color(hex) => VariableScalar::Str(
            hex.strip_suffix("FF")
                .filter(|h| h.len() == 7)
                .unwrap_or(hex)
                .to_string(),
        ),
        FigVariableValue::Number(n) => VariableScalar::Num(*n),
        FigVariableValue::Text(text) => VariableScalar::Str(text.clone()),
        FigVariableValue::Bool(b) => VariableScalar::Bool(*b),
        FigVariableValue::Alias(id) => VariableScalar::Str(format!("${}", names.get(id)?)),
    })
}

fn kind(kind: FigVariableType) -> VariableKind {
    match kind {
        FigVariableType::Color => VariableKind::Color,
        FigVariableType::Float => VariableKind::Number,
        FigVariableType::String => VariableKind::String,
        FigVariableType::Boolean => VariableKind::Boolean,
    }
}

fn definition(
    variable: &FigVariable,
    axis: &Axis,
    names: &HashMap<String, String>,
) -> Option<VariableDefinition> {
    let modes = &axis.source.modes;
    let value = if modes.len() <= 1 {
        let (_, raw) = variable.values.first()?;
        VariableValue::Scalar(scalar(raw, names)?)
    } else {
        let mut themed = Vec::new();
        for (mode_id, mode_name) in modes {
            let Some((_, raw)) = variable.values.iter().find(|(id, _)| id == mode_id) else {
                continue;
            };
            themed.push(ThemedValue {
                value: scalar(raw, names)?,
                theme: Some(BTreeMap::from([(axis.name.clone(), mode_name.clone())])),
            });
        }
        if themed.is_empty() {
            return None;
        }
        VariableValue::Themed(themed)
    };
    Some(VariableDefinition {
        kind: kind(variable.kind),
        value,
    })
}

/// Build the document variable sections for one file's variable table.
pub fn fig_document_variables(table: &FigVariableTable) -> FigDocumentVariables {
    let axes = axes(table);
    let mut out = FigDocumentVariables::default();
    let mut taken = BTreeMap::new();
    for variable in &table.variables {
        let name = document_name(variable, axes.get(variable.collection_id.as_str()), &taken);
        taken.insert(name.clone(), ());
        out.names.insert(variable.id.clone(), name);
    }
    for variable in &table.variables {
        let (Some(axis), Some(name)) = (
            axes.get(variable.collection_id.as_str()),
            out.names.get(&variable.id),
        ) else {
            continue;
        };
        let Some(definition) = definition(variable, axis, &out.names) else {
            continue;
        };
        if axis.source.modes.len() > 1 {
            out.axes.insert(axis.source.id.clone(), axis.name.clone());
            out.themes
                .entry(axis.name.clone())
                .or_insert_with(|| axis.source.modes.iter().map(|(_, m)| m.clone()).collect());
        }
        let collection =
            out.collections
                .entry(axis.name.clone())
                .or_insert_with(|| VariableCollection {
                    library: axis.library.map(|(library, _)| library.id.clone()),
                    key: axis.source.key.clone(),
                    version: axis.source.version.clone(),
                    variables: BTreeMap::new(),
                });
        collection.variables.insert(
            name.clone(),
            CollectionVariable {
                name: variable.name.clone(),
                key: variable.key.clone(),
            },
        );
        out.variables.insert(name.clone(), definition);
    }
    drop_dangling_aliases(&mut out);
    out
}

fn alias_targets(definition: &VariableDefinition) -> Vec<&str> {
    let scalars: Vec<&VariableScalar> = match &definition.value {
        VariableValue::Scalar(scalar) => vec![scalar],
        VariableValue::Themed(entries) => entries.iter().map(|e| &e.value).collect(),
    };
    scalars
        .into_iter()
        .filter_map(|s| match s {
            VariableScalar::Str(text) => text.strip_prefix('$'),
            _ => None,
        })
        .collect()
}

/// Remove variables whose alias chain reaches a variable the file lacks.
fn drop_dangling_aliases(out: &mut FigDocumentVariables) {
    loop {
        let dangling: Vec<String> = out
            .variables
            .iter()
            .filter(|(_, d)| {
                alias_targets(d)
                    .iter()
                    .any(|t| !out.variables.contains_key(*t))
            })
            .map(|(name, _)| name.clone())
            .collect();
        if dangling.is_empty() {
            break;
        }
        for name in dangling {
            out.variables.remove(&name);
            for collection in out.collections.values_mut() {
                collection.variables.remove(&name);
            }
        }
    }
    out.collections.retain(|_, c| !c.variables.is_empty());
    out.names.retain(|_, name| out.variables.contains_key(name));
}

#[cfg(test)]
#[path = "fig_document_variables_tests.rs"]
mod tests;
