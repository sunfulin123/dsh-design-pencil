//! Bringing library variables into a document the way Figma does: only what
//! is used, with the aliases it depends on, never overwriting document
//! values, and with library changes offered as explicit updates.

use super::{find_variable, library, LibraryVariable};
use jian_ops_schema::variable::{
    CollectionVariable, VariableCollection, VariableDefinition, VariableScalar, VariableValue,
};
use jian_ops_schema::PenDocument;
use std::collections::{BTreeMap, BTreeSet};

/// A document variable whose linked library now publishes another value.
#[derive(Debug, Clone, PartialEq)]
pub struct LibraryUpdate {
    pub name: String,
    pub library: String,
    pub collection: String,
    pub current: VariableDefinition,
    pub latest: VariableDefinition,
}

/// Library variable names mentioned in `text` (`$--primary-9`, `--gray-6`)
/// that the document does not define yet.
pub fn referenced_library_names(doc: &PenDocument, text: &str) -> BTreeSet<String> {
    let bytes = text.as_bytes();
    let mut out = BTreeSet::new();
    let mut i = 0;
    while let Some(offset) = text[i..].find("--") {
        let start = i + offset;
        let mut end = start + 2;
        while end < bytes.len() && (bytes[end].is_ascii_alphanumeric() || bytes[end] == b'-') {
            end += 1;
        }
        let name = &text[start..end];
        let defined = doc
            .variables
            .as_ref()
            .is_some_and(|vars| vars.contains_key(name));
        if name.len() > 2 && !defined && find_variable(name).is_some() {
            out.insert(name.to_string());
        }
        i = end.max(start + 2);
    }
    out
}

fn alias_targets(definition: &VariableDefinition) -> Vec<String> {
    let scalars: Vec<&VariableScalar> = match &definition.value {
        VariableValue::Scalar(scalar) => vec![scalar],
        VariableValue::Themed(entries) => entries.iter().map(|e| &e.value).collect(),
    };
    scalars
        .into_iter()
        .filter_map(|scalar| match scalar {
            VariableScalar::Str(text) => text.strip_prefix('$').map(str::to_string),
            _ => None,
        })
        .collect()
}

/// Every library variable `names` reach through aliases, `names` included.
fn closure(names: impl IntoIterator<Item = String>) -> Vec<&'static LibraryVariable> {
    let mut seen = BTreeSet::new();
    let mut pending: Vec<String> = names.into_iter().collect();
    let mut out = Vec::new();
    while let Some(name) = pending.pop() {
        if !seen.insert(name.clone()) {
            continue;
        }
        if let Some((_, variable)) = find_variable(&name) {
            pending.extend(alias_targets(&variable.definition));
            out.push(variable);
        }
    }
    out
}

fn ensure_collection<'a>(
    doc: &'a mut PenDocument,
    library_id: &str,
    collection: &str,
) -> &'a mut VariableCollection {
    let library = library(library_id);
    let source = library.and_then(|l| l.collection(collection));
    if let Some(source) = source {
        let modes = doc
            .themes
            .get_or_insert_with(BTreeMap::new)
            .entry(collection.to_string())
            .or_default();
        for mode in &source.modes {
            if !modes.contains(mode) {
                modes.push(mode.clone());
            }
        }
    }
    doc.variable_collections
        .get_or_insert_with(BTreeMap::new)
        .entry(collection.to_string())
        .or_insert_with(|| VariableCollection {
            library: Some(library_id.to_string()),
            key: source.and_then(|s| s.key.clone()),
            version: library.map(|l| l.version.clone()),
            variables: BTreeMap::new(),
        })
}

/// Import `names` and their alias closure. Variables the document already
/// defines are kept as they are. Returns the names that were added.
pub fn import_library_variables(
    doc: &mut PenDocument,
    names: impl IntoIterator<Item = String>,
) -> Vec<String> {
    let mut added = Vec::new();
    for variable in closure(names) {
        if doc
            .variables
            .as_ref()
            .is_some_and(|vars| vars.contains_key(&variable.name))
        {
            continue;
        }
        let Some((library, _)) = find_variable(&variable.name) else {
            continue;
        };
        ensure_collection(doc, &library.id, &variable.collection)
            .variables
            .insert(
                variable.name.clone(),
                CollectionVariable {
                    name: variable.figma_name.clone(),
                    key: None,
                },
            );
        doc.variables
            .get_or_insert_with(BTreeMap::new)
            .insert(variable.name.clone(), variable.definition.clone());
        added.push(variable.name.clone());
    }
    added.sort();
    added
}

/// Linked document variables whose library value differs from the document.
pub fn library_updates(doc: &PenDocument) -> Vec<LibraryUpdate> {
    let (Some(collections), Some(vars)) = (&doc.variable_collections, &doc.variables) else {
        return Vec::new();
    };
    let mut out = Vec::new();
    for (collection, meta) in collections {
        let Some(library) = meta.library.as_deref().and_then(library) else {
            continue;
        };
        for name in meta.variables.keys() {
            let (Some(current), Some(latest)) = (vars.get(name), library.variables.get(name))
            else {
                continue;
            };
            if *current != latest.definition {
                out.push(LibraryUpdate {
                    name: name.clone(),
                    library: library.id.clone(),
                    collection: collection.clone(),
                    current: current.clone(),
                    latest: latest.definition.clone(),
                });
            }
        }
    }
    out
}

/// Accept library updates (all when `names` is `None`). New alias targets an
/// update introduces are imported too. Returns the accepted names.
pub fn accept_library_updates(doc: &mut PenDocument, names: Option<&[String]>) -> Vec<String> {
    let updates: Vec<LibraryUpdate> = library_updates(doc)
        .into_iter()
        .filter(|u| names.is_none_or(|names| names.contains(&u.name)))
        .collect();
    let mut accepted = Vec::new();
    for update in updates {
        let targets = alias_targets(&update.latest);
        doc.variables
            .get_or_insert_with(BTreeMap::new)
            .insert(update.name.clone(), update.latest);
        import_library_variables(doc, targets);
        if let (Some(meta), Some(library)) = (
            doc.variable_collections
                .as_mut()
                .and_then(|c| c.get_mut(&update.collection)),
            library(&update.library),
        ) {
            meta.version = Some(library.version.clone());
        }
        accepted.push(update.name);
    }
    accepted
}

/// Keep collection membership in step with a variable rename (`Some(new)`)
/// or delete (`None`). A renamed library variable is detached from its
/// library collection (its name no longer matches the library's) and stays
/// a plain document variable; local collections keep the renamed member.
pub fn rename_collection_member(doc: &mut PenDocument, old: &str, new: Option<&str>) {
    let Some(collections) = doc.variable_collections.as_mut() else {
        return;
    };
    for meta in collections.values_mut() {
        let Some(member) = meta.variables.remove(old) else {
            continue;
        };
        if let (Some(new), None) = (new, meta.library.as_ref()) {
            meta.variables.insert(
                new.to_string(),
                CollectionVariable {
                    name: new.to_string(),
                    key: member.key,
                },
            );
        }
    }
    collections.retain(|_, meta| !(meta.library.is_some() && meta.variables.is_empty()));
    if collections.is_empty() {
        doc.variable_collections = None;
    }
}
