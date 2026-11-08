//! Compile component behaviour into the canonical preview state and binding model.

use std::collections::{BTreeMap, BTreeSet};

use jian_ops_schema::component::{
    BehaviourDefinition, BehaviourKind, ComponentBehaviour, ComponentPropertyKind,
    ComponentStateBinding,
};
use jian_ops_schema::{node::PenNode, PenDocument};
use serde_json::{json, Value};

use crate::PenNodeExt;

pub const STATE_KEY: &str = "__componentValue";
pub const STATE_EXPR: &str = "$state.__componentValue";
pub const CONTROL_SUFFIX: &str = "__behaviour_control";

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct BehaviourError(pub String);

impl std::fmt::Display for BehaviourError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(&self.0)
    }
}
impl std::error::Error for BehaviourError {}

pub fn document_nodes(doc: &PenDocument) -> BTreeMap<String, &PenNode> {
    fn walk<'a>(nodes: &'a [PenNode], out: &mut BTreeMap<String, &'a PenNode>) {
        for node in nodes {
            out.insert(node.id_str().to_owned(), node);
            if let Some(children) = node.children() {
                walk(children, out);
            }
        }
    }
    let mut out = BTreeMap::new();
    walk(&doc.children, &mut out);
    for page in doc.pages.iter().flatten() {
        walk(&page.children, &mut out);
    }
    out
}

pub fn definition(node: &PenNode) -> Option<&BehaviourDefinition> {
    match node.base().component_design.as_ref()?.behaviour.as_ref()? {
        ComponentBehaviour::Typed(behaviour) => Some(behaviour),
        ComponentBehaviour::Legacy(_) => None,
    }
}

pub fn behaviour_for_node<'a>(
    doc: &'a PenDocument,
    node: &'a PenNode,
) -> Option<&'a BehaviourDefinition> {
    if let PenNode::Ref(reference) = node {
        let nodes = document_nodes(doc);
        definition(nodes.get(&reference.target)?)
    } else {
        definition(node)
    }
}

pub fn validate_component_behaviour(
    doc: &PenDocument,
    component_id: &str,
    behaviour: &BehaviourDefinition,
) -> Result<(), BehaviourError> {
    let nodes = document_nodes(doc);
    let fail = |message: &str| BehaviourError(format!("{component_id}: {message}"));
    let master = nodes
        .get(component_id)
        .ok_or_else(|| fail("component not found"))?;
    if !matches!(master, PenNode::Frame(frame) if frame.reusable == Some(true)) {
        return Err(fail("behaviour requires a reusable frame"));
    }
    let design = master
        .base()
        .component_design
        .as_ref()
        .ok_or_else(|| fail("component has no design contract"))?;
    if nodes.iter().any(|(id, node)| {
        let owner = id.as_str() == component_id
            || matches!(node, PenNode::Ref(reference) if reference.target == component_id);
        owner
            && doc
                .state
                .as_ref()
                .is_some_and(|state| state.contains_key(&state_key(id)))
    }) {
        return Err(fail(
            "reserved behaviour application state key is already in use",
        ));
    }
    fn contains_behaviour(
        children: &[PenNode],
        nodes: &BTreeMap<String, &PenNode>,
        seen: &mut BTreeSet<String>,
    ) -> bool {
        children.iter().any(|child| {
            if definition(child).is_some() {
                return true;
            }
            if let PenNode::Ref(reference) = child {
                if seen.insert(reference.target.clone()) {
                    if let Some(target) = nodes.get(&reference.target) {
                        if definition(target).is_some()
                            || target
                                .children()
                                .is_some_and(|children| contains_behaviour(children, nodes, seen))
                        {
                            return true;
                        }
                    }
                }
            }
            child
                .children()
                .is_some_and(|children| contains_behaviour(children, nodes, seen))
        })
    }
    if master
        .children()
        .is_some_and(|children| contains_behaviour(children, &nodes, &mut BTreeSet::new()))
    {
        return Err(fail("nested behaviour owners are not supported"));
    }
    if behaviour.state_bindings.is_empty() {
        return Err(fail(
            "stateBindings must affect at least one property or variant",
        ));
    }
    let values = match behaviour.kind {
        BehaviourKind::Button | BehaviourKind::Switch | BehaviourKind::Checkbox => {
            if !behaviour.default_value.is_boolean() {
                return Err(fail("defaultValue must be boolean"));
            }
            vec![json!(false), json!(true)]
        }
        BehaviourKind::Tabs => {
            let options: BTreeSet<_> = behaviour.options.iter().map(|o| &o.value).collect();
            if options.len() < 2
                || options.len() != behaviour.options.len()
                || options.iter().any(|o| o.trim().is_empty())
                || behaviour.options.iter().any(|o| o.label.trim().is_empty())
                || !behaviour
                    .default_value
                    .as_str()
                    .is_some_and(|v| options.contains(&v.to_owned()))
            {
                return Err(fail(
                    "tabs require distinct labelled options and a matching defaultValue",
                ));
            }
            behaviour.options.iter().map(|o| json!(o.value)).collect()
        }
        BehaviourKind::Slider => {
            let (min, max, step) = (
                behaviour.min.unwrap_or(0.0),
                behaviour.max.unwrap_or(100.0),
                behaviour.step.unwrap_or(1.0),
            );
            let value = behaviour
                .default_value
                .as_f64()
                .ok_or_else(|| fail("slider defaultValue must be numeric"))?;
            if ![min, max, step, value].iter().all(|v| v.is_finite())
                || min >= max
                || step <= 0.0
                || value < min
                || value > max
            {
                return Err(fail(
                    "slider requires min < max, positive step and an in-range defaultValue",
                ));
            }
            Vec::new()
        }
    };
    if behaviour.kind != BehaviourKind::Tabs && !behaviour.options.is_empty() {
        return Err(fail("options are supported only for tabs"));
    }
    if behaviour.kind != BehaviourKind::Slider
        && (behaviour.min.is_some() || behaviour.max.is_some() || behaviour.step.is_some())
    {
        return Err(fail("min/max/step are supported only for sliders"));
    }
    let subtree = PenDocument {
        children: master.children().cloned().unwrap_or_default(),
        pages: None,
        ..doc.clone()
    };
    let descendants = document_nodes(&subtree);
    let mut properties = BTreeSet::new();
    let mut variants = BTreeSet::new();
    for binding in &behaviour.state_bindings {
        match binding {
            ComponentStateBinding::Property {
                property_id,
                values: mapping,
            } => {
                let property = design
                    .properties
                    .get(property_id)
                    .ok_or_else(|| fail("state binding references an unknown propertyId"))?;
                if !properties.insert(property_id) {
                    return Err(fail("duplicate property state binding"));
                }
                let target = descendants
                    .get(&property.target_id)
                    .ok_or_else(|| fail("property target is not a component descendant"))?;
                if property.kind == ComponentPropertyKind::InstanceSwap {
                    return Err(fail(
                        "interactive instance-swap properties are not supported",
                    ));
                }
                if property.kind == ComponentPropertyKind::Text
                    && !matches!(target, PenNode::Text(_))
                {
                    return Err(fail("text property target must be text"));
                }
                if mapping.is_empty() {
                    if property.kind == ComponentPropertyKind::Boolean
                        && !matches!(
                            behaviour.kind,
                            BehaviourKind::Button | BehaviourKind::Switch | BehaviourKind::Checkbox
                        )
                    {
                        return Err(fail(
                            "non-boolean state requires an explicit property values mapping",
                        ));
                    }
                } else if mapping.values().any(|value| !property.accepts(value))
                    || values
                        .iter()
                        .any(|v| !mapping.contains_key(&state_value_key(v)))
                {
                    return Err(fail("property values mapping must cover every state with correctly typed values"));
                }
            }
            ComponentStateBinding::Variant { variant_id, value } => {
                if values.is_empty() || !values.contains(value) {
                    return Err(fail(
                        "variant binding value is outside the behaviour state domain",
                    ));
                }
                if !variants.insert(state_value_key(value)) {
                    return Err(fail("duplicate variant binding value"));
                }
                let variant = nodes
                    .get(variant_id)
                    .ok_or_else(|| fail("unknown variantId"))?;
                let family = |node: &PenNode| {
                    node.base()
                        .component_design
                        .as_ref()
                        .and_then(|d| d.variant_of.as_deref())
                        .unwrap_or(node.id_str())
                        .to_owned()
                };
                if !matches!(variant, PenNode::Frame(f) if f.reusable == Some(true))
                    || family(master) != family(variant)
                {
                    return Err(fail(
                        "variantId must identify a reusable member of the same variant family",
                    ));
                }
            }
        }
    }
    if !variants.is_empty()
        && values
            .iter()
            .any(|v| !variants.contains(&state_value_key(v)))
    {
        return Err(fail("variant state bindings must cover every state"));
    }
    let master_json = serde_json::to_value(master).map_err(|e| fail(&e.to_string()))?;
    if master_json
        .get("state")
        .and_then(|s| s.get(STATE_KEY))
        .is_some()
        || nodes
            .keys()
            .any(|id| id == &format!("{component_id}{CONTROL_SUFFIX}"))
    {
        return Err(fail(
            "component behaviour reserved state or control id is already in use",
        ));
    }
    Ok(())
}

pub fn state_value_key(value: &Value) -> String {
    value
        .as_str()
        .map(str::to_owned)
        .unwrap_or_else(|| value.to_string())
}

pub fn property_expression(
    property: &jian_ops_schema::component::ComponentProperty,
    mapping: &BTreeMap<String, Value>,
    kind: BehaviourKind,
) -> String {
    if mapping.is_empty() {
        return if property.kind == ComponentPropertyKind::Text {
            format!("\"\" + {STATE_EXPR}")
        } else {
            STATE_EXPR.to_owned()
        };
    }
    mapping
        .iter()
        .rev()
        .fold(property.default.to_string(), |fallback, (key, value)| {
            // State keys are strings for tabs and JSON primitives for boolean/numeric controls.
            let literal = match serde_json::from_str::<Value>(key) {
                _ if kind == BehaviourKind::Tabs => json!(key),
                Ok(value) if value.is_boolean() || value.is_number() => value,
                _ => json!(key),
            };
            format!("{STATE_EXPR} == {literal} ? {value} : ({fallback})")
        })
}

/// Lower into ordinary state, bindings and native input widgets before the
/// existing reference resolver runs. The authored document is never mutated.
pub fn compile_component_behaviour(doc: &PenDocument) -> Result<PenDocument, BehaviourError> {
    let nodes = document_nodes(doc);
    if !nodes.values().any(|node| definition(node).is_some()) {
        return Ok(doc.clone());
    }
    for (id, node) in &nodes {
        if let Some(behaviour) = definition(node) {
            validate_component_behaviour(doc, id, behaviour)?;
        }
    }
    let mut compiled = doc.clone();
    fn walk(nodes: &mut [PenNode], source: &PenDocument) -> Result<(), BehaviourError> {
        for node in nodes {
            if let Some(behaviour) = definition(node).cloned() {
                *node = compile_master(source, node, &behaviour)?;
            } else if let Some(children) = node.children_mut() {
                walk(children, source)?;
            }
        }
        Ok(())
    }
    walk(&mut compiled.children, doc)?;
    for page in compiled.pages.iter_mut().flatten() {
        walk(&mut page.children, doc)?;
    }
    // The existing resolver owns ref expansion and virtual ids. Hoist each
    // expanded owner's private cell only AFTER it assigns those ids, so two
    // instances never share state and no binding needs a new scope resolver.
    let resolved = crate::ref_resolve::resolve_refs_for_canvas(&compiled);
    let mut value = serde_json::to_value(resolved).map_err(|e| BehaviourError(e.to_string()))?;
    let mut state = value
        .get("state")
        .and_then(Value::as_object)
        .cloned()
        .unwrap_or_default();
    fn hoist(
        node: &mut Value,
        state: &mut serde_json::Map<String, Value>,
    ) -> Result<(), BehaviourError> {
        if let Some(entry) = node
            .get_mut("state")
            .and_then(Value::as_object_mut)
            .and_then(|s| s.remove(STATE_KEY))
        {
            let id = node["id"].as_str().unwrap_or_default();
            let key = state_key(id);
            if state.contains_key(&key) {
                return Err(BehaviourError(format!(
                    "{id}: reserved behaviour state key {key} is already in use"
                )));
            }
            state.insert(key.clone(), entry);
            fn rewrite(node: &mut Value, replacement: &str) {
                if let Some(bindings) = node.get_mut("bindings").and_then(Value::as_object_mut) {
                    for expression in bindings.values_mut() {
                        if let Some(text) = expression.as_str() {
                            *expression = json!(text.replace(STATE_EXPR, replacement));
                        }
                    }
                }
                fn rewrite_actions(value: &mut Value, replacement: &str) {
                    match value {
                        Value::String(text) => *text = text.replace(STATE_EXPR, replacement),
                        Value::Array(items) => {
                            for item in items {
                                rewrite_actions(item, replacement);
                            }
                        }
                        Value::Object(object) => {
                            let old = std::mem::take(object);
                            for (key, mut value) in old {
                                rewrite_actions(&mut value, replacement);
                                object.insert(key.replace(STATE_EXPR, replacement), value);
                            }
                        }
                        _ => {}
                    }
                }
                if let Some(events) = node.get_mut("events") {
                    rewrite_actions(events, replacement);
                }
                if let Some(children) = node.get_mut("children").and_then(Value::as_array_mut) {
                    for child in children {
                        if child.get("state").and_then(|s| s.get(STATE_KEY)).is_none() {
                            rewrite(child, replacement);
                        }
                    }
                }
            }
            rewrite(node, &format!("$state.{key}"));
        }
        if let Some(children) = node.get_mut("children").and_then(Value::as_array_mut) {
            for child in children {
                hoist(child, state)?;
            }
        }
        Ok(())
    }
    if let Some(children) = value.get_mut("children").and_then(Value::as_array_mut) {
        for node in children {
            hoist(node, &mut state)?;
        }
    }
    if let Some(pages) = value.get_mut("pages").and_then(Value::as_array_mut) {
        for page in pages {
            if let Some(children) = page.get_mut("children").and_then(Value::as_array_mut) {
                for node in children {
                    hoist(node, &mut state)?;
                }
            }
        }
    }
    value["state"] = json!(state);
    serde_json::from_value(value).map_err(|e| BehaviourError(e.to_string()))
}

pub fn state_key(owner_id: &str) -> String {
    format!(
        "__component_{}",
        owner_id
            .bytes()
            .map(|b| format!("{b:02x}"))
            .collect::<String>()
    )
}

fn compile_master(
    doc: &PenDocument,
    master: &PenNode,
    behaviour: &BehaviourDefinition,
) -> Result<PenNode, BehaviourError> {
    let err = |e: serde_json::Error| BehaviourError(e.to_string());
    let mut outer = serde_json::to_value(master).map_err(err)?;
    let mut visual = outer.clone();
    let id = master.id_str();
    let mut children = Vec::new();
    let lookup = document_nodes(doc);
    for binding in &behaviour.state_bindings {
        if let ComponentStateBinding::Variant { variant_id, value } = binding {
            let variant = lookup[variant_id];
            let mut variant = serde_json::to_value(variant).map_err(err)?;
            let prefix = format!("{id}__behaviour_variant_{}", children.len());
            rekey(&mut variant, &prefix);
            strip_owner(&mut variant);
            variant["bindings"]["visible"] = json!(format!("{STATE_EXPR} == {value}"));
            children.push(variant);
        }
    }
    if children.is_empty() {
        strip_owner(&mut visual);
        visual["id"] = json!(format!("{id}__behaviour_visual"));
        children.push(visual);
    }
    let design = master.base().component_design.as_ref().unwrap();
    for binding in &behaviour.state_bindings {
        if let ComponentStateBinding::Property {
            property_id,
            values,
        } = binding
        {
            let property = &design.properties[property_id];
            for child in &mut children {
                bind_property(
                    child,
                    &property.target_id,
                    property.field(),
                    &property_expression(property, values, behaviour.kind),
                );
            }
        }
    }
    let control_kind = match behaviour.kind {
        BehaviourKind::Button => "frame",
        BehaviourKind::Switch => "switch",
        BehaviourKind::Checkbox => "checkbox",
        BehaviourKind::Tabs => "tabs",
        BehaviourKind::Slider => "slider",
    };
    let mut control = json!({
        "type":control_kind,"id":format!("{id}{CONTROL_SUFFIX}"),
        "x":0,"y":0,"width":outer.get("width").cloned().unwrap_or(json!("fill_container")),
        "height":outer.get("height").cloned().unwrap_or(json!("fill_container")),
        "opacity":0,"enabled":!behaviour.disabled,
        "bindings":{"bind:value":STATE_EXPR}
    });
    match behaviour.kind {
        BehaviourKind::Button => {
            control.as_object_mut().unwrap().remove("bindings");
            control["semantics"] = json!({"role":"button"});
            control["events"] = json!({
                "onPressStart":[{"set":{STATE_EXPR:"true"}}],
                "onPressEnd":[{"set":{STATE_EXPR:"false"}}],
                "onPressCancel":[{"set":{STATE_EXPR:"false"}}],
                "onKey":[{"if":{"expr":"$event.key == \"Enter\" || $event.key == \" \" || $event.key == \"Space\"",
                    "then":[{"set":{STATE_EXPR:"true"}},{"delay":{"ms":80}},
                        {"set":{STATE_EXPR:"false"}}]}}]
            });
        }
        BehaviourKind::Switch | BehaviourKind::Checkbox => {
            control["checked"] = behaviour.default_value.clone();
        }
        BehaviourKind::Tabs => {
            control["value"] = behaviour.default_value.clone();
            control["tabs"] = serde_json::to_value(&behaviour.options).map_err(err)?;
        }
        BehaviourKind::Slider => {
            control["value"] = behaviour.default_value.clone();
            control["min"] = json!(behaviour.min.unwrap_or(0.0));
            control["max"] = json!(behaviour.max.unwrap_or(100.0));
            control["step"] = json!(behaviour.step.unwrap_or(1.0));
        }
    }
    if !behaviour.disabled {
        fn depth(node: &Value) -> usize {
            1 + node
                .get("children")
                .and_then(Value::as_array)
                .into_iter()
                .flatten()
                .map(depth)
                .max()
                .unwrap_or(0)
        }
        // jian's hit index prioritizes depth before sibling paint order.
        // Put the transparent native input deeper than every visual layer,
        // otherwise a label/thumb can swallow its pointer stream.
        let visual_depth = children.iter().map(depth).max().unwrap_or(1);
        for level in 0..visual_depth {
            control = json!({"type":"frame","id":format!("{id}__behaviour_hit_{level}{CONTROL_SUFFIX}"),
                "x":0,"y":0,"width":outer.get("width").cloned().unwrap_or(json!("fill_container")),
                "height":outer.get("height").cloned().unwrap_or(json!("fill_container")),
                "layout":"none","children":[control]});
        }
        children.push(control);
    }
    let state_type = match behaviour.kind {
        BehaviourKind::Tabs => "string",
        BehaviourKind::Slider => "number",
        _ => "bool",
    };
    outer["state"][STATE_KEY] = json!({"type":state_type,"default":behaviour.default_value});
    outer["layout"] = json!("none");
    for key in [
        "fill",
        "stroke",
        "effects",
        "padding",
        "gap",
        "cornerRadius",
        "clipContent",
    ] {
        outer.as_object_mut().unwrap().remove(key);
    }
    outer["children"] = json!(children);
    // Keep properties/slots for the canonical instance override pass. Only the
    // executable declaration is consumed, making compilation idempotent.
    outer["componentDesign"]
        .as_object_mut()
        .unwrap()
        .remove("behaviour");
    serde_json::from_value(outer).map_err(err)
}

fn strip_owner(node: &mut Value) {
    for key in [
        "componentDesign",
        "reusable",
        "state",
        "events",
        "screen",
        "route",
    ] {
        node.as_object_mut().unwrap().remove(key);
    }
    node["x"] = json!(0);
    node["y"] = json!(0);
}

fn rekey(node: &mut Value, prefix: &str) {
    if let Some(id) = node.get("id").and_then(Value::as_str) {
        node["id"] = json!(format!("{prefix}__{id}"));
    }
    if let Some(children) = node.get_mut("children").and_then(Value::as_array_mut) {
        for child in children {
            rekey(child, prefix);
        }
    }
}

fn bind_property(node: &mut Value, target: &str, field: &str, expression: &str) {
    if node
        .get("id")
        .and_then(Value::as_str)
        .is_some_and(|id| id == target || id.ends_with(&format!("__{target}")))
    {
        node["bindings"][field] = json!(expression);
    }
    if let Some(children) = node.get_mut("children").and_then(Value::as_array_mut) {
        for child in children {
            bind_property(child, target, field, expression);
        }
    }
}
