//! Resolve variable-bound paint colors.
//!
//! A `.fig` paint bound to a color variable (`colorVar.value.alias`) keeps a
//! cached `color` that Figma only refreshes when the file is re-saved against
//! the library; in real files a large share of these caches are stale (often
//! plain white). Figma renders the variable's value instead: the mode chosen
//! by the nearest ancestor's `variableModeBySetMap` for the variable's
//! collection, otherwise the collection's first (default) mode, following
//! alias chains. This module rewrites each bound paint's `color` to that value
//! (keeping the cached alpha, as open-pencil does) so every downstream mapper
//! reads the rendered color.
//!
//! Variables and collections are addressed by local `guid` or by library
//! `assetRef {key, version}`. A file keeps several versions of one library
//! variable (with different values), so a reference resolves to the exact
//! version it cites, falling back to the key alone.

use crate::kiwi::FigValue;
use crate::tree::{guid_to_string, TreeNode};
use std::collections::HashMap;

/// Lookup keys a library record is published under: exact version and key.
fn asset_keys(node: &FigValue) -> Vec<String> {
    let Some(key) = node.get_str("key") else {
        return Vec::new();
    };
    let mut keys = Vec::with_capacity(2);
    if let Some(version) = node.get_str("version") {
        keys.push(format!("key:{key}@{version}"));
    }
    keys.push(format!("key:{key}"));
    keys
}

/// Collection id → chosen mode id, innermost assignment last.
pub(crate) type ModeScope = Vec<(String, String)>;

/// Variables and collections of one decoded file.
#[derive(Debug, Default)]
pub(crate) struct VariableIndex {
    variables: HashMap<String, FigValue>,
    /// Collection reference (guid or key) → canonical collection guid.
    set_ids: HashMap<String, String>,
    /// Canonical collection guid → default mode id.
    default_modes: HashMap<String, String>,
}

impl VariableIndex {
    pub(crate) fn from_node_changes(nodes: &[FigValue]) -> Self {
        let mut index = Self::default();
        for node in nodes {
            let Some(guid) = node.get("guid").and_then(guid_to_string) else {
                continue;
            };
            match node.get_str("type") {
                Some("VARIABLE") => {
                    for asset in asset_keys(node) {
                        index.variables.entry(asset).or_insert_with(|| node.clone());
                    }
                    index.variables.insert(guid, node.clone());
                }
                Some("VARIABLE_SET") => {
                    for asset in asset_keys(node) {
                        index.set_ids.entry(asset).or_insert_with(|| guid.clone());
                    }
                    index.set_ids.insert(guid.clone(), guid.clone());
                    if let Some(mode) = node
                        .get_array("variableSetModes")
                        .and_then(|modes| modes.first())
                        .and_then(|mode| mode.get("id"))
                        .and_then(guid_to_string)
                    {
                        index.default_modes.insert(guid, mode);
                    }
                }
                _ => {}
            }
        }
        index
    }

    pub(crate) fn is_empty(&self) -> bool {
        self.variables.is_empty()
    }

    /// `{guid}` or `{assetRef:{key, version}}` → lookup keys, most exact first.
    fn reference_keys(reference: &FigValue) -> Vec<String> {
        if let Some(guid) = reference.get("guid").and_then(guid_to_string) {
            return vec![guid];
        }
        let Some(asset) = reference.get("assetRef") else {
            return Vec::new();
        };
        let Some(key) = asset.get_str("key") else {
            return Vec::new();
        };
        let mut keys = Vec::with_capacity(2);
        if let Some(version) = asset.get_str("version") {
            keys.push(format!("key:{key}@{version}"));
        }
        keys.push(format!("key:{key}"));
        keys
    }

    fn set_of(&self, reference: &FigValue) -> Option<&String> {
        Self::reference_keys(reference)
            .iter()
            .find_map(|key| self.set_ids.get(key))
    }

    fn variable(&self, reference: &FigValue) -> Option<&FigValue> {
        Self::reference_keys(reference)
            .iter()
            .find_map(|key| self.variables.get(key))
    }

    /// Append the explicit modes a node assigns to the scope.
    pub(crate) fn push_modes(&self, figma: &FigValue, scope: &mut ModeScope) -> usize {
        let Some(entries) = figma
            .get("variableModeBySetMap")
            .and_then(|map| map.get_array("entries"))
        else {
            return 0;
        };
        let mut pushed = 0;
        for entry in entries {
            let (Some(set), Some(mode)) = (
                entry.get("variableSetID").and_then(|id| self.set_of(id)),
                entry.get("variableModeID").and_then(guid_to_string),
            ) else {
                continue;
            };
            scope.push((set.clone(), mode));
            pushed += 1;
        }
        pushed
    }

    fn mode_for(&self, set: &str, scope: &ModeScope) -> Option<String> {
        scope
            .iter()
            .rev()
            .find(|(candidate, _)| candidate == set)
            .map(|(_, mode)| mode.clone())
            .or_else(|| self.default_modes.get(set).cloned())
    }

    /// Resolve an alias to `(r, g, b)` in the given scope.
    fn resolve(&self, alias: &FigValue, scope: &ModeScope, depth: u8) -> Option<(f64, f64, f64)> {
        if depth > 16 {
            return None;
        }
        let variable = self.variable(alias)?;
        let entries = variable
            .get("variableDataValues")
            .and_then(|values| values.get_array("entries"))?;
        let mode = variable
            .get("variableSetID")
            .and_then(|id| self.set_of(id))
            .and_then(|set| self.mode_for(set, scope));
        let entry = mode
            .and_then(|mode| {
                entries.iter().find(|entry| {
                    entry.get("modeID").and_then(guid_to_string).as_deref() == Some(mode.as_str())
                })
            })
            .or_else(|| entries.first())?;
        let value = entry.get("variableData")?.get("value")?;
        if let Some(color) = value.get("colorValue") {
            return Some((
                color.get_f64("r")?,
                color.get_f64("g")?,
                color.get_f64("b")?,
            ));
        }
        self.resolve(value.get("alias")?, scope, depth + 1)
    }

    /// Rewrite every variable-bound `color` inside one node's own fields
    /// (paints, effects, style overrides, instance override entries).
    pub(crate) fn resolve_value(&self, value: &mut FigValue, scope: &ModeScope) {
        match value {
            FigValue::Array(items) => items
                .iter_mut()
                .for_each(|item| self.resolve_value(item, scope)),
            FigValue::Object(_) => {
                if let Some(rgb) = value
                    .get("colorVar")
                    .and_then(|var| var.get("value"))
                    .and_then(|var| var.get("alias"))
                    .and_then(|alias| self.resolve(alias, scope, 0))
                {
                    let alpha = value
                        .get("color")
                        .and_then(|color| color.get_f64("a"))
                        .unwrap_or(1.0);
                    value.set(
                        "color",
                        FigValue::Object(vec![
                            ("r".into(), FigValue::Float(rgb.0 as f32)),
                            ("g".into(), FigValue::Float(rgb.1 as f32)),
                            ("b".into(), FigValue::Float(rgb.2 as f32)),
                            ("a".into(), FigValue::Float(alpha as f32)),
                        ]),
                    );
                }
                if let FigValue::Object(pairs) = value {
                    for (key, child) in pairs.iter_mut() {
                        if key.as_ref() != "colorVar" {
                            self.resolve_value(child, scope);
                        }
                    }
                }
            }
            _ => {}
        }
    }

    /// Resolve a whole subtree; each node's explicit modes scope its subtree.
    pub(crate) fn resolve_tree(&self, node: &mut TreeNode, scope: &mut ModeScope) {
        let pushed = self.push_modes(&node.figma, scope);
        self.resolve_value(&mut node.figma, scope);
        for child in &mut node.children {
            self.resolve_tree(child, scope);
        }
        scope.truncate(scope.len() - pushed);
    }
}

/// Build the owned tree with variable-bound paint colors resolved, returning
/// the variable index for instance expansion to re-resolve in each
/// instance's own mode scope.
pub(crate) fn build_resolved_tree(
    node_changes: Vec<FigValue>,
) -> (Option<TreeNode>, std::rc::Rc<VariableIndex>) {
    let variables = VariableIndex::from_node_changes(&node_changes);
    let mut tree = crate::tree::build_tree_owned(node_changes);
    if let Some(tree) = tree.as_mut().filter(|_| !variables.is_empty()) {
        variables.resolve_tree(tree, &mut Vec::new());
    }
    (tree, std::rc::Rc::new(variables))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn obj(pairs: Vec<(&str, FigValue)>) -> FigValue {
        FigValue::Object(pairs.into_iter().map(|(k, v)| (k.into(), v)).collect())
    }
    fn guid(sid: u32, lid: u32) -> FigValue {
        obj(vec![
            ("sessionID", FigValue::Uint(sid)),
            ("localID", FigValue::Uint(lid)),
        ])
    }
    fn rgb(r: f32, g: f32, b: f32) -> FigValue {
        obj(vec![
            ("r", FigValue::Float(r)),
            ("g", FigValue::Float(g)),
            ("b", FigValue::Float(b)),
            ("a", FigValue::Float(1.0)),
        ])
    }
    fn entry(mode: FigValue, value: FigValue) -> FigValue {
        obj(vec![
            ("modeID", mode),
            ("variableData", obj(vec![("value", value)])),
        ])
    }

    /// Collection 1:1 (modes Light 1:2, Dark 1:3); `gray` by key, `text` aliases `gray`.
    fn index() -> VariableIndex {
        VariableIndex::from_node_changes(&[
            obj(vec![
                ("guid", guid(1, 1)),
                ("type", FigValue::Str("VARIABLE_SET".into())),
                ("key", FigValue::Str("setkey".into())),
                (
                    "variableSetModes",
                    FigValue::Array(vec![
                        obj(vec![("id", guid(1, 2))]),
                        obj(vec![("id", guid(1, 3))]),
                    ]),
                ),
            ]),
            obj(vec![
                ("guid", guid(2, 1)),
                ("type", FigValue::Str("VARIABLE".into())),
                ("key", FigValue::Str("gray".into())),
                ("variableSetID", obj(vec![("guid", guid(1, 1))])),
                (
                    "variableDataValues",
                    obj(vec![(
                        "entries",
                        FigValue::Array(vec![
                            entry(guid(1, 2), obj(vec![("colorValue", rgb(0.4, 0.4, 0.4))])),
                            entry(guid(1, 3), obj(vec![("colorValue", rgb(0.9, 0.9, 0.9))])),
                        ]),
                    )]),
                ),
            ]),
            obj(vec![
                ("guid", guid(2, 2)),
                ("type", FigValue::Str("VARIABLE".into())),
                (
                    "variableSetID",
                    obj(vec![(
                        "assetRef",
                        obj(vec![("key", FigValue::Str("setkey".into()))]),
                    )]),
                ),
                (
                    "variableDataValues",
                    obj(vec![(
                        "entries",
                        FigValue::Array(vec![entry(
                            guid(1, 2),
                            obj(vec![(
                                "alias",
                                obj(vec![(
                                    "assetRef",
                                    obj(vec![("key", FigValue::Str("gray".into()))]),
                                )]),
                            )]),
                        )]),
                    )]),
                ),
            ]),
        ])
    }

    fn bound_paint(alias: FigValue) -> FigValue {
        obj(vec![
            ("type", FigValue::Str("SOLID".into())),
            ("color", rgb(1.0, 1.0, 1.0)),
            (
                "colorVar",
                obj(vec![("value", obj(vec![("alias", alias)]))]),
            ),
        ])
    }

    fn color_of(node: &TreeNode) -> f64 {
        node.figma.get_array("fillPaints").unwrap()[0]
            .get("color")
            .unwrap()
            .get_f64("r")
            .unwrap()
    }

    #[test]
    fn stale_cached_colors_resolve_through_aliases_in_the_default_mode() {
        let index = index();
        let mut node = TreeNode {
            figma: obj(vec![(
                "fillPaints",
                FigValue::Array(vec![bound_paint(obj(vec![("guid", guid(2, 2))]))]),
            )]),
            children: vec![],
        };
        index.resolve_tree(&mut node, &mut Vec::new());
        assert!(
            (color_of(&node) - 0.4).abs() < 1e-6,
            "white cache replaced by the variable value"
        );
    }

    #[test]
    fn an_ancestor_mode_selects_the_variable_value_for_its_subtree() {
        let index = index();
        let dark = obj(vec![(
            "entries",
            FigValue::Array(vec![obj(vec![
                (
                    "variableSetID",
                    obj(vec![(
                        "assetRef",
                        obj(vec![("key", FigValue::Str("setkey".into()))]),
                    )]),
                ),
                ("variableModeID", guid(1, 3)),
            ])]),
        )]);
        let leaf = TreeNode {
            figma: obj(vec![(
                "fillPaints",
                FigValue::Array(vec![bound_paint(obj(vec![(
                    "assetRef",
                    obj(vec![("key", FigValue::Str("gray".into()))]),
                )]))]),
            )]),
            children: vec![],
        };
        let mut root = TreeNode {
            figma: obj(vec![("variableModeBySetMap", dark)]),
            children: vec![leaf.clone()],
        };
        index.resolve_tree(&mut root, &mut Vec::new());
        assert!(
            (color_of(&root.children[0]) - 0.9).abs() < 1e-6,
            "dark mode value"
        );
        let mut outside = leaf;
        index.resolve_tree(&mut outside, &mut Vec::new());
        assert!(
            (color_of(&outside) - 0.4).abs() < 1e-6,
            "scope ends with the subtree"
        );
    }

    #[test]
    fn a_reference_resolves_the_library_version_it_cites() {
        let variable = |sid: u32, version: &str, value: f32| {
            obj(vec![
                ("guid", guid(9, sid)),
                ("type", FigValue::Str("VARIABLE".into())),
                ("key", FigValue::Str("lib".into())),
                ("version", FigValue::Str(version.into())),
                (
                    "variableDataValues",
                    obj(vec![(
                        "entries",
                        FigValue::Array(vec![entry(
                            guid(1, 2),
                            obj(vec![("colorValue", rgb(value, value, value))]),
                        )]),
                    )]),
                ),
            ])
        };
        let index =
            VariableIndex::from_node_changes(&[variable(1, "1:1", 1.0), variable(2, "2:2", 0.1)]);
        let cite = |version: &str| {
            bound_paint(obj(vec![(
                "assetRef",
                obj(vec![
                    ("key", FigValue::Str("lib".into())),
                    ("version", FigValue::Str(version.into())),
                ]),
            )]))
        };
        for (version, want) in [("2:2", 0.1), ("1:1", 1.0), ("9:9", 1.0)] {
            let mut node = TreeNode {
                figma: obj(vec![("fillPaints", FigValue::Array(vec![cite(version)]))]),
                children: vec![],
            };
            index.resolve_tree(&mut node, &mut Vec::new());
            assert!((color_of(&node) - want).abs() < 1e-6, "version {version}");
        }
    }
}
