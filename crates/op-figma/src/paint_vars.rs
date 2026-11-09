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
use std::collections::{BTreeMap, HashMap};

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
    /// Collection guid → (theme axis, mode id → mode name).
    set_axes: HashMap<String, (String, HashMap<String, String>)>,
    /// The file's variables as document variables.
    pub(crate) document: crate::fig_document_variables::FigDocumentVariables,
}

fn rgb_hex((r, g, b): (f64, f64, f64)) -> String {
    let channel = |v: f64| (v.clamp(0.0, 1.0) * 255.0).round() as u8;
    format!("#{:02X}{:02X}{:02X}", channel(r), channel(g), channel(b))
}

/// Synthetic paint field naming the document variable a paint is bound to.
pub(crate) const BOUND_VARIABLE: &str = "__dshVariable";

#[cfg(test)]
thread_local! {
    /// Fidelity probes convert once baked and once bound to compare them.
    pub(crate) static BAKE_ONLY: std::cell::Cell<bool> = const { std::cell::Cell::new(false) };
}

/// `key:<key>` for library records, else the guid (see `fig_variables`).
fn canonical_id(node: &FigValue) -> Option<String> {
    match node.get_str("key") {
        Some(key) => Some(format!("key:{key}")),
        None => node.get("guid").and_then(guid_to_string),
    }
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
        let table = crate::fig_variables::variables_from_node_changes(nodes);
        index.document = crate::fig_document_variables::fig_document_variables(&table);
        for node in nodes
            .iter()
            .filter(|n| n.get_str("type") == Some("VARIABLE_SET"))
        {
            let (Some(guid), Some(canonical)) = (
                node.get("guid").and_then(guid_to_string),
                canonical_id(node),
            ) else {
                continue;
            };
            let (Some(axis), Some(collection)) = (
                index.document.axes.get(&canonical),
                table.collection(&canonical),
            ) else {
                continue;
            };
            let modes = collection.modes.iter().cloned().collect();
            index.set_axes.insert(guid, (axis.clone(), modes));
        }
        index
    }

    /// Document theme overrides for explicit Figma modes (innermost wins).
    pub(crate) fn theme_for(&self, modes: &[(String, String)]) -> BTreeMap<String, String> {
        let mut theme = BTreeMap::new();
        for (set, mode) in modes {
            if let Some((axis, names)) = self.set_axes.get(set) {
                if let Some(name) = names.get(mode) {
                    theme.insert(axis.clone(), name.clone());
                }
            }
        }
        theme
    }

    /// `#RRGGBB` a document variable resolves to under `theme` (default mode
    /// for unset axes), following aliases.
    fn document_hex(
        &self,
        name: &str,
        theme: &BTreeMap<String, String>,
        depth: u8,
    ) -> Option<String> {
        use jian_ops_schema::variable::{VariableScalar, VariableValue};
        if depth > 16 {
            return None;
        }
        let scalar = match &self.document.variables.get(name)?.value {
            VariableValue::Scalar(scalar) => scalar,
            VariableValue::Themed(entries) => {
                let matches = |entry: &&jian_ops_schema::variable::ThemedValue| {
                    entry.theme.as_ref().is_some_and(|t| {
                        t.iter()
                            .all(|(axis, mode)| theme.get(axis).is_none_or(|m| m == mode))
                            && t.keys().all(|axis| theme.contains_key(axis))
                    })
                };
                &entries
                    .iter()
                    .find(matches)
                    .or_else(|| entries.first())?
                    .value
            }
        };
        let VariableScalar::Str(text) = scalar else {
            return None;
        };
        match text.strip_prefix('$') {
            Some(target) => self.document_hex(target, theme, depth + 1),
            None => Some(text.get(..7)?.to_ascii_uppercase()),
        }
    }

    /// Record explicit Figma modes as the node's theme overrides, so
    /// variable-bound values resolve in the mode Figma rendered them in.
    pub(crate) fn set_mode_theme(
        &self,
        node: &mut jian_ops_schema::node::PenNode,
        modes: &[(String, String)],
    ) {
        let theme = self.theme_for(modes);
        if theme.is_empty() {
            return;
        }
        let base = crate::layout_positioning::base_mut(node);
        let current = base.theme.get_or_insert_with(Default::default);
        for (axis, mode) in theme {
            current.entry(axis).or_insert(mode);
        }
    }

    /// Resolve an instance expansion: component layers render in the
    /// instance's mode scope, the component's own modes then the instance's.
    pub(crate) fn resolve_instance(
        &self,
        outer: &ModeScope,
        [component, instance]: [&FigValue; 2],
        merged: &mut FigValue,
        children: &mut [TreeNode],
    ) {
        if self.is_empty() {
            return;
        }
        let mut scope = outer.clone();
        self.push_modes(component, &mut scope);
        self.push_modes(instance, &mut scope);
        self.resolve_value(merged, &scope);
        for child in children {
            self.resolve_tree(child, &mut scope);
        }
    }

    /// A component's own modes apply to each expansion of it.
    pub(crate) fn set_component_theme(
        &self,
        node: &mut jian_ops_schema::node::PenNode,
        component: &FigValue,
    ) {
        let mut modes = Vec::new();
        self.push_modes(component, &mut modes);
        self.set_mode_theme(node, &modes);
    }

    /// Document variable name of an alias reference, when the file defines it.
    fn bound_name(&self, alias: &FigValue) -> Option<String> {
        #[cfg(test)]
        if BAKE_ONLY.with(std::cell::Cell::get) {
            return None;
        }
        let id = canonical_id(self.variable(alias)?)?;
        let name = self.document.names.get(&id)?;
        self.document
            .variables
            .contains_key(name)
            .then(|| name.clone())
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

    /// Resolve an alias to `(r, g, b, a)` in the given scope.
    fn resolve(
        &self,
        alias: &FigValue,
        scope: &ModeScope,
        depth: u8,
    ) -> Option<(f64, f64, f64, f64)> {
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
                color.get_f64("a").unwrap_or(1.0),
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
                let alias = value
                    .get("colorVar")
                    .and_then(|var| var.get("value"))
                    .and_then(|var| var.get("alias"))
                    .cloned();
                let rgba = alias
                    .as_ref()
                    .and_then(|alias| self.resolve(alias, scope, 0));
                let mut bound_to_doc_var = false;
                if let (Some(alias), Some((r, g, b, _))) = (alias.as_ref(), rgba) {
                    // A paint citing an older library version can render a
                    // value the document (newest version) cannot; bake it.
                    // Instance expansion re-resolves in another scope, so an
                    // earlier binding is replaced, never kept stale.
                    let theme = self.theme_for(scope);
                    let name = self.bound_name(alias).filter(|name| {
                        self.document_hex(name, &theme, 0).as_deref()
                            == Some(rgb_hex((r, g, b)).as_str())
                    });
                    bound_to_doc_var = name.is_some();
                    if name.is_some() || value.get(BOUND_VARIABLE).is_some() {
                        value.set(
                            BOUND_VARIABLE,
                            FigValue::Str(name.unwrap_or_default().into()),
                        );
                    }
                }
                if let Some((r, g, b, var_alpha)) = rgba {
                    let is_paint = value.get_str("type").is_some();
                    let alpha = if is_paint {
                        1.0
                    } else {
                        value
                            .get("color")
                            .and_then(|color| color.get_f64("a"))
                            .unwrap_or(var_alpha)
                    };
                    value.set(
                        "color",
                        FigValue::Object(vec![
                            ("r".into(), FigValue::Float(r as f32)),
                            ("g".into(), FigValue::Float(g as f32)),
                            ("b".into(), FigValue::Float(b as f32)),
                            ("a".into(), FigValue::Float(alpha as f32)),
                        ]),
                    );
                    if is_paint {
                        // A Figma color variable defines both RGB and alpha for
                        // the paint. Clear any stale pre-binding `opacity` (or
                        // duplicate cached variable alpha when bound to `$var`).
                        if let FigValue::Object(pairs) = value {
                            pairs.retain(|(k, _)| k.as_ref() != "opacity");
                        }
                        if !bound_to_doc_var && (var_alpha - 1.0).abs() > 1e-4 {
                            value.set("opacity", FigValue::Float(var_alpha as f32));
                        }
                    }
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
    fn bound_paints_keep_their_variable_and_explicit_modes_become_themes() {
        let mode = |id: u32, name: &str| {
            obj(vec![
                ("id", guid(1, id)),
                ("name", FigValue::Str(name.into())),
            ])
        };
        let index = VariableIndex::from_node_changes(&[
            obj(vec![
                ("guid", guid(1, 1)),
                ("type", FigValue::Str("VARIABLE_SET".into())),
                ("name", FigValue::Str("Colors".into())),
                (
                    "variableSetModes",
                    FigValue::Array(vec![mode(2, "Light"), mode(3, "Dark")]),
                ),
            ]),
            obj(vec![
                ("guid", guid(2, 1)),
                ("type", FigValue::Str("VARIABLE".into())),
                ("name", FigValue::Str("Gray".into())),
                ("variableResolvedType", FigValue::Str("COLOR".into())),
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
        ]);
        assert_eq!(index.document.themes["Colors"], ["Light", "Dark"]);
        let mut paint = FigValue::Array(vec![bound_paint(obj(vec![("guid", guid(2, 1))]))]);
        index.resolve_value(&mut paint, &Vec::new());
        let fills = crate::mappers::map_figma_fills(paint.as_array()).unwrap();
        let jian_ops_schema::style::PenFill::Solid(solid) = &fills[0] else {
            panic!("solid fill expected");
        };
        assert_eq!(solid.color, "$Gray");
        let theme = index.theme_for(&[("1:1".to_string(), "1:3".to_string())]);
        assert_eq!(
            theme,
            BTreeMap::from([("Colors".to_string(), "Dark".to_string())])
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

    #[test]
    fn variable_bound_paints_replace_stale_paint_opacity_with_variable_alpha() {
        let mode = obj(vec![
            ("id", guid(1, 2)),
            ("name", FigValue::Str("Light".into())),
        ]);
        let rgba = |r: f32, g: f32, b: f32, a: f32| {
            obj(vec![
                ("r", FigValue::Float(r)),
                ("g", FigValue::Float(g)),
                ("b", FigValue::Float(b)),
                ("a", FigValue::Float(a)),
            ])
        };
        let index = VariableIndex::from_node_changes(&[
            obj(vec![
                ("guid", guid(1, 1)),
                ("type", FigValue::Str("VARIABLE_SET".into())),
                ("name", FigValue::Str("Colors".into())),
                ("variableSetModes", FigValue::Array(vec![mode])),
            ]),
            obj(vec![
                ("guid", guid(2, 1)),
                ("type", FigValue::Str("VARIABLE".into())),
                ("name", FigValue::Str("Gray4".into())),
                ("variableResolvedType", FigValue::Str("COLOR".into())),
                ("variableSetID", obj(vec![("guid", guid(1, 1))])),
                (
                    "variableDataValues",
                    obj(vec![(
                        "entries",
                        FigValue::Array(vec![entry(
                            guid(1, 2),
                            obj(vec![("colorValue", rgba(0.9, 0.9, 0.9, 1.0))]),
                        )]),
                    )]),
                ),
            ]),
            obj(vec![
                ("guid", guid(2, 2)),
                ("type", FigValue::Str("VARIABLE".into())),
                ("name", FigValue::Str("GrayA8".into())),
                ("variableResolvedType", FigValue::Str("COLOR".into())),
                ("variableSetID", obj(vec![("guid", guid(1, 1))])),
                (
                    "variableDataValues",
                    obj(vec![(
                        "entries",
                        FigValue::Array(vec![entry(
                            guid(1, 2),
                            obj(vec![("colorValue", rgba(0.0, 0.1, 0.2, 0.25))]),
                        )]),
                    )]),
                ),
            ]),
        ]);
        // Stale pre-binding opacity (0.6 on Gauge track Ellipse 2) must not
        // dim an opaque variable ($Gray4), and a translucent variable ($GrayA8)
        // must not carry a duplicate paint opacity that squares its alpha.
        let mut stale_opaque = bound_paint(obj(vec![("guid", guid(2, 1))]));
        stale_opaque.set("opacity", FigValue::Float(0.6));
        let mut cached_translucent = bound_paint(obj(vec![("guid", guid(2, 2))]));
        cached_translucent.set("opacity", FigValue::Float(0.25));
        let mut paints = FigValue::Array(vec![stale_opaque, cached_translucent]);
        index.resolve_value(&mut paints, &Vec::new());
        let fills = crate::mappers::map_figma_fills(paints.as_array()).unwrap();
        let jian_ops_schema::style::PenFill::Solid(first) = &fills[0] else {
            panic!("solid fill expected");
        };
        let jian_ops_schema::style::PenFill::Solid(second) = &fills[1] else {
            panic!("solid fill expected");
        };
        assert_eq!(first.color, "$Gray4");
        assert_eq!(first.opacity, None);
        assert_eq!(second.color, "$GrayA8");
        assert_eq!(second.opacity, None);
    }
}
