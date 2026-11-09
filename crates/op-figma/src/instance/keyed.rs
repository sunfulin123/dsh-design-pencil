//! Exact instance-override addressing by `guid` or `overrideKey`.
//!
//! Ported from open-pencil `packages/fig/src/instance-overrides/source-index.ts`
//! (`recordMatches`, `findStaticSegment`, `resolvesInSourceComponent`): a
//! `guidPath` segment names exactly one record among the component's static
//! descendants. The search passes through ordinary containers but never into
//! a nested instance — the remaining segments are forwarded to that instance,
//! which resolves them against its own component. A leading segment naming the
//! component root itself is skipped. Ambiguous or missing segments are counted
//! diagnostics instead of positional guesses.
//!
//! Modern `.fig` files address almost every override through `overrideKey`
//! (a stable per-layer key shared by all copies of a component), so the legacy
//! virtual-GUID heuristics in the parent module only run for files without it.

use super::apply::{apply_to_node, collect_nested_entries, mark_derived_branches};
use super::guid_path_key;
use crate::common::InstanceResize;
use crate::kiwi::FigValue;
use crate::tree::{guid_to_string, TreeNode};
use std::cell::Cell;
use std::collections::{HashMap, HashSet};

/// Kiwi's all-ones GUID names no node (a layer without an override key).
const UNSET_KEY: &str = "4294967295:4294967295";

thread_local! {
    static UNRESOLVED: Cell<usize> = const { Cell::new(0) };
    static AMBIGUOUS: Cell<usize> = const { Cell::new(0) };
    static STALE_CACHE: Cell<usize> = const { Cell::new(0) };
}

/// Take and reset the per-thread count of `(unresolved, ambiguous)` authored
/// override paths seen since the previous call. Unplaceable derived-layout
/// cache entries are counted separately ([`take_stale_cache_count`]).
pub(crate) fn take_override_diagnostics() -> (usize, usize) {
    (
        UNRESOLVED.with(|c| c.replace(0)),
        AMBIGUOUS.with(|c| c.replace(0)),
    )
}

/// Take and reset the count of derived-layout cache entries whose layer no
/// longer exists (Figma keeps stale caches; they carry no authored content).
pub(crate) fn take_stale_cache_count() -> usize {
    STALE_CACHE.with(|c| c.replace(0))
}

/// True for an INSTANCE record: its subtree is a boundary for path search.
pub(super) fn is_instance_record(figma: &FigValue) -> bool {
    figma.get_str("type") == Some("INSTANCE")
        || figma
            .get("symbolData")
            .and_then(|data| data.get("symbolID"))
            .is_some()
}

pub(super) fn override_key(figma: &FigValue) -> Option<String> {
    figma
        .get("overrideKey")
        .and_then(guid_to_string)
        .filter(|key| key != UNSET_KEY)
}

/// Outcome of looking up one path segment.
#[derive(Debug, PartialEq, Eq)]
pub(super) enum Lookup {
    Found(String),
    Ambiguous,
    Missing,
}

/// Segment index over one component's static descendants.
pub(super) struct KeyedIndex {
    keys: HashMap<String, Vec<String>>,
    root_keys: HashSet<String>,
    /// Whether any static descendant carries an `overrideKey`.
    pub(super) uses_override_keys: bool,
}

impl KeyedIndex {
    pub(super) fn build(symbol: &TreeNode) -> Self {
        let mut index = KeyedIndex {
            keys: HashMap::new(),
            root_keys: HashSet::new(),
            uses_override_keys: false,
        };
        if let Some(guid) = symbol.figma.get("guid").and_then(guid_to_string) {
            index.root_keys.insert(guid);
        }
        if let Some(key) = override_key(&symbol.figma) {
            index.root_keys.insert(key);
        }
        for child in &symbol.children {
            index.add(child);
        }
        index
    }

    fn add(&mut self, node: &TreeNode) {
        let Some(guid) = node.figma.get("guid").and_then(guid_to_string) else {
            return;
        };
        self.keys
            .entry(guid.clone())
            .or_default()
            .push(guid.clone());
        if let Some(key) = override_key(&node.figma) {
            self.uses_override_keys = true;
            if key != guid {
                self.keys.entry(key).or_default().push(guid.clone());
            }
        }
        if is_instance_record(&node.figma) {
            return;
        }
        for child in &node.children {
            self.add(child);
        }
    }

    pub(super) fn is_root(&self, segment: &str) -> bool {
        self.root_keys.contains(segment)
    }

    pub(super) fn lookup(&self, segment: &str) -> Lookup {
        match self.keys.get(segment).map(Vec::as_slice) {
            Some([only]) => Lookup::Found(only.clone()),
            Some(many) if many.len() > 1 => {
                // One record matched by both guid and its own key is unique.
                let unique: HashSet<&String> = many.iter().collect();
                if unique.len() == 1 {
                    Lookup::Found(many[0].clone())
                } else {
                    Lookup::Ambiguous
                }
            }
            _ => Lookup::Missing,
        }
    }
}

fn path_guids(entry: &FigValue) -> Option<Vec<FigValue>> {
    entry
        .get("guidPath")?
        .get_array("guids")
        .map(<[FigValue]>::to_vec)
}

/// Drop a leading segment that names the component root itself.
fn without_root_head(entry: &FigValue, index: &KeyedIndex) -> Option<FigValue> {
    let guids = path_guids(entry)?;
    let head = guids.first().and_then(guid_to_string)?;
    if !index.is_root(&head) {
        return Some(entry.clone());
    }
    if guids.len() == 1 {
        // A root claim configures the instance node itself, whose record
        // already carries its own resolved fields.
        return None;
    }
    let mut copy = entry.clone();
    let mut path = FigValue::Object(Vec::new());
    path.set("guids", FigValue::Array(guids[1..].to_vec()));
    copy.set("guidPath", path);
    Some(copy)
}

/// Merge `later` into `earlier`; fields of `later` win.
fn merge_fields(earlier: &mut FigValue, later: &FigValue) {
    let FigValue::Object(pairs) = later else {
        return;
    };
    for (key, value) in pairs {
        if key.as_ref() == "guidPath" {
            continue;
        }
        if key.as_ref() == "componentPropAssignments" {
            let mut merged = earlier
                .get_array(key)
                .map(<[FigValue]>::to_vec)
                .unwrap_or_default();
            super::bindings::merge_assignments(&mut merged, value.as_array().unwrap_or(&[]));
            earlier.set(key, FigValue::Array(merged));
            continue;
        }
        earlier.set(key, value.clone());
    }
}

/// Index entries by normalized path key, merging repeated keys in order.
fn keyed_entries(
    entries: &[FigValue],
    index: &KeyedIndex,
) -> (Vec<String>, HashMap<String, FigValue>) {
    let mut order = Vec::new();
    let mut map: HashMap<String, FigValue> = HashMap::new();
    for entry in entries {
        let Some(entry) = without_root_head(entry, index) else {
            continue;
        };
        let Some(pk) = guid_path_key(&entry) else {
            continue;
        };
        match map.get_mut(&pk) {
            Some(existing) => merge_fields(existing, &entry),
            None => {
                order.push(pk.clone());
                map.insert(pk, entry);
            }
        }
    }
    (order, map)
}

/// Resolve and apply overrides by exact addressing. Every head segment is
/// looked up among the static descendants; misses are counted, not guessed.
pub(super) fn apply_keyed(
    symbol_node: &TreeNode,
    overrides: &[FigValue],
    derived: &[FigValue],
    scale: InstanceResize,
    index: &KeyedIndex,
) -> Vec<TreeNode> {
    let (override_order, override_entries) = keyed_entries(overrides, index);
    let (derived_order, derived_entries) = keyed_entries(derived, index);

    let mut node_override: HashMap<String, FigValue> = HashMap::new();
    let mut node_derived: HashMap<String, FigValue> = HashMap::new();
    let mut pk_to_node_guid: HashMap<String, String> = HashMap::new();
    let mut resolve = |pk: &str, cache: bool| -> Option<String> {
        let head = pk.split('/').next().unwrap_or(pk);
        if let Some(found) = pk_to_node_guid.get(head) {
            return Some(found.clone());
        }
        match index.lookup(head) {
            Lookup::Found(guid) => {
                pk_to_node_guid.insert(head.to_string(), guid.clone());
                Some(guid)
            }
            Lookup::Ambiguous | Lookup::Missing if cache => {
                STALE_CACHE.with(|c| c.set(c.get() + 1));
                None
            }
            Lookup::Ambiguous => {
                AMBIGUOUS.with(|c| c.set(c.get() + 1));
                None
            }
            Lookup::Missing => {
                UNRESOLVED.with(|c| c.set(c.get() + 1));
                None
            }
        }
    };
    for pk in &derived_order {
        if let Some(guid) = resolve(pk, true) {
            if !pk.contains('/') {
                node_derived.insert(guid, derived_entries[pk].clone());
            }
        }
    }
    for pk in &override_order {
        if let Some(guid) = resolve(pk, false) {
            if !pk.contains('/') {
                let entry = &override_entries[pk];
                match node_override.get_mut(&guid) {
                    Some(existing) => merge_fields(existing, entry),
                    None => {
                        node_override.insert(guid, entry.clone());
                    }
                }
            }
        }
    }

    let override_refs: HashMap<String, &FigValue> = override_entries
        .iter()
        .map(|(k, v)| (k.clone(), v))
        .collect();
    let derived_refs: HashMap<String, &FigValue> = derived_entries
        .iter()
        .map(|(k, v)| (k.clone(), v))
        .collect();
    let resolved_order = |order: &[String]| -> Vec<String> {
        order
            .iter()
            .filter(|pk| {
                let head = pk.split('/').next().unwrap_or(pk);
                pk_to_node_guid.contains_key(head)
            })
            .cloned()
            .collect()
    };
    let nested_override = collect_nested_entries(
        &resolved_order(&override_order),
        &override_refs,
        &pk_to_node_guid,
    );
    let nested_derived = collect_nested_entries(
        &resolved_order(&derived_order),
        &derived_refs,
        &pk_to_node_guid,
    );

    let mut derived_branch: HashSet<String> = HashSet::new();
    mark_derived_branches(symbol_node, &node_derived, &mut derived_branch);
    symbol_node
        .children
        .iter()
        .cloned()
        .map(|child| {
            apply_to_node(
                child,
                &node_override,
                &node_derived,
                &nested_override,
                &nested_derived,
                &derived_branch,
                scale,
            )
        })
        .collect()
}

/// Give each expanded layer its Figma REST id: `I<instance path>;<layer key>`,
/// where the key is the layer's `overrideKey` (its guid when it has none).
/// Nested instances stop the walk; their own expansion continues the path
/// (matching Figma REST ids, which add a segment only per nested instance).
pub(crate) fn tag_instance_source_ids(instance: &FigValue, children: &mut [TreeNode]) {
    let own = instance
        .get_str(crate::common::SOURCE_ID_KEY)
        .map(str::to_string)
        .or_else(|| instance.get("guid").and_then(guid_to_string));
    let Some(own) = own else {
        return;
    };
    let prefix = own.strip_prefix('I').unwrap_or(&own).to_string();
    for child in children {
        tag_layer(child, &prefix);
    }
}

fn tag_layer(node: &mut TreeNode, prefix: &str) {
    let key = override_key(&node.figma).or_else(|| node.figma.get("guid").and_then(guid_to_string));
    let Some(key) = key else {
        return;
    };
    let id = format!("I{prefix};{key}");
    node.figma
        .set(crate::common::SOURCE_ID_KEY, FigValue::Str(id));
    // Path segments grow only at nested instances; ordinary containers pass
    // the same instance prefix to their children.
    if is_instance_record(&node.figma) {
        return;
    }
    for child in &mut node.children {
        tag_layer(child, prefix);
    }
}
