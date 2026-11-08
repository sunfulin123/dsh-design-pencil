//! Keep Figma component/instance linkage in `.fig` imports.
//!
//! Every page-level instance is first expanded exactly (the ground truth the
//! canvas must show). When linkage is enabled, the instance's component is
//! converted once into a `reusable` frame on a dedicated "Components" page and
//! the instance becomes a `ref` whose `descendants` record the difference
//! between that component and the exact expansion. Before a `ref` is kept it is
//! re-expanded with the editor's own resolver ([`resolve_refs_for_canvas_roots`])
//! and compared with the exact expansion; any difference keeps the expanded
//! frame instead, so linkage never changes what is rendered.
//!
//! Component layers carry `figmaNodeId` `I<component id>;<layer key>`; a `ref`
//! child maps back to its REST id by swapping that prefix for the instance id.

use crate::common::ConversionContext;
use crate::tree::TreeNode;
use jian_ops_schema::document::PenDocument;
use jian_ops_schema::node::{PenNode, RefNode};
use jian_ops_schema::page::PenPage;
use jian_ops_schema::sizing::SizingBehavior;
use op_editor_core::ref_resolve::resolve_refs_for_canvas_roots;
use op_editor_core::PenNodeExt;
use serde_json::{Map, Value};
use std::collections::BTreeMap;

/// Keys never written into `descendants`: identity, structure, provenance.
const IDENTITY_KEYS: &[&str] = &["id", "type", "children", "reusable", "figmaNodeId"];

/// Width of a row of laid-out components on the Components page.
const COMPONENTS_ROW_WIDTH: f64 = 6000.0;
const COMPONENTS_GAP: f64 = 120.0;

struct Component {
    /// `None` when the component could not be converted for linkage.
    node: Option<PenNode>,
    linked: usize,
}

/// Linkage state for one document conversion.
#[derive(Default)]
pub struct Linkage {
    components: BTreeMap<String, Component>,
    order: Vec<String>,
    linked: usize,
    expanded: BTreeMap<&'static str, usize>,
}

impl Linkage {
    fn keep_expanded(&mut self, reason: &'static str) {
        *self.expanded.entry(reason).or_default() += 1;
    }

    /// One summary warning; empty when no instance was considered.
    pub fn summary(&self) -> Option<String> {
        let kept: usize = self.expanded.values().sum();
        if self.linked + kept == 0 {
            return None;
        }
        let used = self.components.values().filter(|c| c.linked > 0).count();
        let reasons = self
            .expanded
            .iter()
            .map(|(reason, count)| format!("{count} {reason}"))
            .collect::<Vec<_>>()
            .join(", ");
        Some(if kept == 0 {
            format!(
                "Component linkage: {} instances linked to {used} components",
                self.linked
            )
        } else {
            format!(
                "Component linkage: {} instances linked to {used} components; {kept} kept as expanded copies ({reasons})",
                self.linked
            )
        })
    }

    /// The "Components" page holding every component a kept `ref` targets.
    pub fn into_page(self) -> Option<PenPage> {
        let mut children = Vec::new();
        let (mut x, mut y, mut row_height) = (0.0_f64, 0.0_f64, 0.0_f64);
        for guid in &self.order {
            let Some(Component {
                node: Some(node),
                linked,
            }) = self.components.get(guid)
            else {
                continue;
            };
            if *linked == 0 {
                continue;
            }
            let mut node = node.clone();
            let (w, h) = size_of(&node);
            if x > 0.0 && x + w > COMPONENTS_ROW_WIDTH {
                x = 0.0;
                y += row_height + COMPONENTS_GAP;
                row_height = 0.0;
            }
            let base = node.base_mut();
            base.x = Some(x);
            base.y = Some(y);
            x += w + COMPONENTS_GAP;
            row_height = row_height.max(h);
            children.push(node);
        }
        (!children.is_empty()).then(|| PenPage {
            id: "figma-components".into(),
            name: "Components".into(),
            children,
            theme: None,
            background_color: None,
            state: None,
            lifecycle: None,
        })
    }
}

fn size_of(node: &PenNode) -> (f64, f64) {
    let value = serde_json::to_value(node).unwrap_or(Value::Null);
    let dim = |key: &str| {
        serde_json::from_value::<SizingBehavior>(value.get(key).cloned().unwrap_or(Value::Null))
            .ok()
            .and_then(|s| match s {
                SizingBehavior::Number(n) => Some(n),
                _ => None,
            })
            .unwrap_or(100.0)
    };
    (dim("width"), dim("height"))
}

/// Replace a page-level instance's exact expansion with a verified `ref`
/// when linkage is enabled; otherwise return the expansion unchanged.
pub(crate) fn link_instance(
    ctx: &mut ConversionContext<'_>,
    component_guid: &str,
    symbol_node: &TreeNode,
    expanded: PenNode,
) -> PenNode {
    let Some(mut linkage) = ctx.linkage.take() else {
        return expanded;
    };
    if !linkage.components.contains_key(component_guid) {
        let node = convert_component_for_linkage(ctx, symbol_node);
        linkage.order.push(component_guid.to_string());
        linkage
            .components
            .insert(component_guid.to_string(), Component { node, linked: 0 });
    }
    let outcome = match linkage.components[component_guid].node.as_ref() {
        None => Err("component could not be converted"),
        Some(component) => build_ref(component, &expanded),
    };
    let result = match outcome {
        Ok(reference) => {
            linkage.linked += 1;
            if let Some(entry) = linkage.components.get_mut(component_guid) {
                entry.linked += 1;
            }
            reference
        }
        Err(reason) => {
            linkage.keep_expanded(reason);
            expanded
        }
    };
    ctx.linkage = Some(linkage);
    result
}

/// Convert the component definition itself, fully expanded, with its layers
/// tagged `I<component id>;<layer key>`.
fn convert_component_for_linkage(
    ctx: &mut ConversionContext<'_>,
    symbol_node: &TreeNode,
) -> Option<PenNode> {
    let mut symbol = symbol_node.clone();
    crate::instance::tag_instance_source_ids(&symbol.figma, &mut symbol.children);
    ctx.expansion_depth += 1;
    let keep_hidden = std::mem::replace(&mut ctx.keep_hidden, true);
    let node = crate::converters::convert_component_node(&symbol, ctx);
    ctx.keep_hidden = keep_hidden;
    ctx.expansion_depth -= 1;
    let mut node = node?;
    let id = ctx.generate_id();
    node.base_mut().id = id;
    Some(node)
}

fn props_diff(component: &Map<String, Value>, expanded: &Map<String, Value>) -> Map<String, Value> {
    let mut out = Map::new();
    for (key, value) in expanded {
        if !IDENTITY_KEYS.contains(&key.as_str()) && component.get(key) != Some(value) {
            out.insert(key.clone(), value.clone());
        }
    }
    for key in component.keys() {
        if !IDENTITY_KEYS.contains(&key.as_str()) && !expanded.contains_key(key) {
            out.insert(key.clone(), Value::Null);
        }
    }
    out
}

fn children_of(value: &Map<String, Value>) -> &[Value] {
    value
        .get("children")
        .and_then(Value::as_array)
        .map(Vec::as_slice)
        .unwrap_or(&[])
}

/// Stable layer key: the `figmaNodeId` path after the owner prefix
/// (`I<owner>;<key path>`), identical for a component layer and the same
/// layer inside any instance of it.
fn layer_key(node: &Value) -> Option<&str> {
    node.get("figmaNodeId")?
        .as_str()?
        .split_once(';')
        .map(|(_, key)| key)
}

fn is_hidden(node: &Value) -> bool {
    node.get("visible") == Some(&Value::Bool(false))
}

/// Pair each component child with the instance child of the same layer key,
/// in order. Component layers the instance does not show pair with `None`.
/// `None` overall when the instance has a layer the component lacks, the
/// order differs, or a pair changes node type.
fn align<'a>(
    component: &'a [Value],
    expanded: &'a [Value],
) -> Option<Vec<(&'a Value, Option<&'a Value>)>> {
    let mut pairs = Vec::with_capacity(component.len());
    let mut next = 0;
    for c in component {
        let key = layer_key(c)?;
        match expanded.get(next) {
            Some(e) if layer_key(e) == Some(key) => {
                if c.get("type") != e.get("type") {
                    return None;
                }
                pairs.push((c, Some(e)));
                next += 1;
            }
            _ => pairs.push((c, None)),
        }
    }
    (next == expanded.len()).then_some(pairs)
}

/// Record overrides for `component` → `expanded` (same type) under the
/// component layer's id; a structural difference replaces its children.
fn diff_node(component: &Value, expanded: Option<&Value>, out: &mut Map<String, Value>) {
    let Value::Object(c) = component else {
        return;
    };
    let Some(Value::Object(e)) = expanded else {
        // The instance does not show this layer.
        if !is_hidden(component) {
            if let Some(id) = c.get("id").and_then(Value::as_str) {
                out.insert(id.to_string(), serde_json::json!({ "visible": false }));
            }
        }
        return;
    };
    let mut overrides = props_diff(c, e);
    let (cc, ec) = (children_of(c), children_of(e));
    match align(cc, ec) {
        Some(pairs) => {
            for (child_c, child_e) in pairs {
                diff_node(child_c, child_e, out);
            }
        }
        None => {
            overrides.insert("children".into(), Value::Array(ec.to_vec()));
        }
    }
    if overrides.is_empty() {
        return;
    }
    if let Some(id) = c.get("id").and_then(Value::as_str) {
        out.insert(id.to_string(), Value::Object(overrides));
    }
}

/// Canonical form for equivalence: ids, provenance and invisible subtrees
/// (which neither paint nor, in preserved geometry, move siblings) removed.
fn normalized(node: &PenNode) -> Value {
    fn strip(value: &mut Value) {
        match value {
            Value::Object(map) => {
                map.remove("id");
                map.remove("figmaNodeId");
                if let Some(Value::Array(children)) = map.get_mut("children") {
                    children.retain(|child| !is_hidden(child));
                    if children.is_empty() {
                        map.remove("children");
                    }
                }
                map.values_mut().for_each(strip);
            }
            Value::Array(items) => items.iter_mut().for_each(strip),
            _ => {}
        }
    }
    let mut value = serde_json::to_value(node).unwrap_or(Value::Null);
    strip(&mut value);
    value
}

/// Build a `ref` reproducing `expanded` from `component`, verified by
/// re-expansion through the editor's resolver.
pub(crate) fn build_ref(component: &PenNode, expanded: &PenNode) -> Result<PenNode, &'static str> {
    let c = serde_json::to_value(component).map_err(|_| "serialization failed")?;
    let e = serde_json::to_value(expanded).map_err(|_| "serialization failed")?;
    if c.get("type") != e.get("type") {
        return Err("root type differs from its component");
    }
    let (Value::Object(cm), Value::Object(em)) = (&c, &e) else {
        return Err("serialization failed");
    };
    let Some(pairs) = align(children_of(cm), children_of(em)) else {
        return Err("top-level layers differ from the component");
    };
    let target = component.base().id.clone();
    let mut descendants = Map::new();
    let root = props_diff(cm, em);
    for (child_c, child_e) in pairs {
        diff_node(child_c, child_e, &mut descendants);
    }
    if !root.is_empty() {
        descendants.insert(target.clone(), Value::Object(root));
    }
    let reference = PenNode::Ref(RefNode {
        base: expanded.base().clone(),
        target,
        descendants: (!descendants.is_empty()).then(|| descendants.into_iter().collect()),
        children: None,
        state: None,
        bindings: None,
        events: None,
        lifecycle: None,
        semantics: None,
        gestures: None,
        route: None,
    });
    let lookup = PenDocument {
        children: vec![component.clone()],
        ..crate::node_mapper::empty_document("linkage")
    };
    let resolved = resolve_refs_for_canvas_roots(std::slice::from_ref(&reference), &lookup);
    match resolved.first() {
        Some(node) if normalized(node) == normalized(expanded) => Ok(reference),
        _ => Err("re-expansion did not reproduce the instance"),
    }
}
