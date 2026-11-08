//! Built-in variable libraries — the Figma team-library model for variables.
//!
//! A library publishes collections (each with ordered modes) and variables.
//! Documents never receive a whole library up front: a variable enters a
//! document only when something uses it, together with every variable its
//! aliases reach, and the document records which library collection it came
//! from ([`jian_ops_schema::variable::VariableCollection`]). Values already in
//! a document are never overwritten by a library; newer library values are
//! offered as updates the caller must accept.
//!
//! Each collection is a theme axis named after the Figma collection, so the
//! existing mode resolution (document, page and node `theme` overrides)
//! applies unchanged.

mod cobalt;
mod figma_names;
mod import;

pub use figma_names::cobalt_figma_name;
pub use import::{
    accept_library_updates, import_library_variables, library_updates, referenced_library_names,
    rename_collection_member, LibraryUpdate,
};

use jian_ops_schema::variable::VariableDefinition;
use std::collections::BTreeMap;
use std::sync::OnceLock;

/// Id of the default, first-listed library.
pub const PREFERRED_LIBRARY_ID: &str = "talkdesk-cobalt";

/// One collection of a library.
#[derive(Debug, Clone, PartialEq)]
pub struct LibraryCollection {
    /// Collection name; also the document theme axis name.
    pub name: String,
    /// Figma library key of the collection, for linking imported files.
    pub key: Option<String>,
    /// Ordered mode names; the first is the default.
    pub modes: Vec<String>,
}

/// One library variable.
#[derive(Debug, Clone, PartialEq)]
pub struct LibraryVariable {
    /// Document variable name (CSS code syntax without `var()`).
    pub name: String,
    /// Figma display path; `/` separates groups.
    pub figma_name: String,
    pub collection: String,
    pub definition: VariableDefinition,
}

/// A published variable library.
#[derive(Debug, Clone, PartialEq)]
pub struct VariableLibrary {
    pub id: String,
    pub name: String,
    pub version: String,
    pub collections: Vec<LibraryCollection>,
    pub variables: BTreeMap<String, LibraryVariable>,
}

impl VariableLibrary {
    pub fn collection(&self, name: &str) -> Option<&LibraryCollection> {
        self.collections.iter().find(|c| c.name == name)
    }

    /// Library variable by its Figma path within one collection.
    pub fn by_figma_name(&self, collection: &str, figma_name: &str) -> Option<&LibraryVariable> {
        self.variables
            .values()
            .find(|v| v.collection == collection && v.figma_name == figma_name)
    }
}

/// Every built-in library, preferred first.
pub fn libraries() -> &'static [VariableLibrary] {
    static LIBRARIES: OnceLock<Vec<VariableLibrary>> = OnceLock::new();
    LIBRARIES.get_or_init(|| vec![cobalt::talkdesk_cobalt()])
}

pub fn library(id: &str) -> Option<&'static VariableLibrary> {
    libraries().iter().find(|library| library.id == id)
}

/// The library collection carrying a Figma collection key.
pub fn collection_by_key(
    key: &str,
) -> Option<(&'static VariableLibrary, &'static LibraryCollection)> {
    libraries().iter().find_map(|library| {
        library
            .collections
            .iter()
            .find(|c| c.key.as_deref() == Some(key))
            .map(|c| (library, c))
    })
}

/// The first enabled library defining `name`.
pub fn find_variable(name: &str) -> Option<(&'static VariableLibrary, &'static LibraryVariable)> {
    libraries()
        .iter()
        .find_map(|library| library.variables.get(name).map(|v| (library, v)))
}

#[cfg(test)]
#[path = "variable_library_tests.rs"]
mod tests;
