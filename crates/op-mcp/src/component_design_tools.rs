use std::collections::BTreeMap;

use jian_ops_schema::component::{ComponentProperty, ComponentPropertyKind, ComponentSlot};
use jian_ops_schema::node::PenNode;
use op_editor_core::{EditorCommand, EditorState, NodeId, PenNodeExt};
use serde_json::{json, Value};

use crate::{McpTool, ToolErrorCode, ToolOutcome};

struct NodeSnapshot {
    node: PenNode,
    page_id: Option<String>,
    editable: bool,
}

pub struct ComponentDesignTool {
    name: &'static str,
    nodes: BTreeMap<String, NodeSnapshot>,
    document: jian_ops_schema::PenDocument,
}

pub fn component_design_snapshot(state: &EditorState, name: &'static str) -> ComponentDesignTool {
    fn walk(
        nodes: &[PenNode],
        page_id: Option<&str>,
        editable: bool,
        out: &mut BTreeMap<String, NodeSnapshot>,
    ) {
        for node in nodes {
            let editable = editable
                && node.base().visible.unwrap_or(true)
                && !node.base().locked.unwrap_or(false);
            out.insert(
                node.id_str().into(),
                NodeSnapshot {
                    node: node.clone(),
                    page_id: page_id.map(str::to_owned),
                    editable,
                },
            );
            if let Some(children) = node.children() {
                walk(children, page_id, editable, out);
            }
        }
    }
    let mut nodes = BTreeMap::new();
    walk(&state.doc.children, None, true, &mut nodes);
    if let Some(pages) = &state.doc.pages {
        for page in pages {
            walk(&page.children, Some(&page.id), true, &mut nodes);
        }
    }
    ComponentDesignTool {
        name,
        nodes,
        document: state.doc.clone(),
    }
}

type Validation<T> = Result<T, String>;

impl ComponentDesignTool {
    fn node(&self, id: &str) -> Validation<&NodeSnapshot> {
        self.nodes
            .get(id)
            .ok_or_else(|| format!("node {id} not found"))
    }

    fn master(&self, id: &str) -> Validation<&NodeSnapshot> {
        let node = self.node(id)?;
        if !matches!(&node.node, PenNode::Frame(frame) if frame.reusable == Some(true)) {
            return Err(format!("{id} must be a reusable frame"));
        }
        Ok(node)
    }

    fn write(&self, id: &str, patch: Value) -> Validation<ToolOutcome> {
        let target = self.node(id)?;
        if !target.editable {
            return Err(format!(
                "node {id} is hidden, locked or inside a locked ancestor"
            ));
        }
        if matches!(
            self.name,
            "create_slot" | "update_slot" | "delete_slot" | "reset_instance_properties"
        ) {
            let mut state = EditorState::new();
            state.doc = self.document.clone();
            // The shared form validator needs a selection; automation targets its
            // explicit id in a private snapshot, never the user's UI selection.
            state.set_single_selection(NodeId::new(id));
            let command =
                op_editor_core::component_authoring::prepare_patch(&state, id, patch.clone())
                    .map_err(|error| error.to_string())?;
            let mut candidate = json!(target.node);
            candidate
                .as_object_mut()
                .ok_or("invalid node snapshot")?
                .extend(patch.as_object().ok_or("patch must be an object")?.clone());
            let candidate: PenNode = serde_json::from_value(candidate)
                .map_err(|error| format!("invalid component update: {error}"))?;
            if candidate == target.node {
                return Ok(ToolOutcome::OkJson(
                    json!({"nodeId":id,"updated":patch}).to_string(),
                ));
            }
            return Ok(ToolOutcome::OkJsonWithCommand(
                json!({"nodeId":id,"updated":patch}).to_string(),
                command,
            ));
        }
        if let Some(reference) = patch.get("ref").and_then(Value::as_str) {
            self.validate_reference_target(id, reference)?;
        }
        let mut validated = json!(target.node);
        let object = validated.as_object_mut().ok_or("invalid node snapshot")?;
        let patch_object = patch.as_object().ok_or("patch must be an object")?;
        object.extend(patch_object.clone());
        serde_json::from_value::<PenNode>(validated)
            .map_err(|err| format!("invalid component update: {err}"))?;
        Ok(ToolOutcome::OkJsonWithCommand(
            json!({"nodeId":id,"updated":patch}).to_string(),
            EditorCommand::PatchNodeData {
                node_id: NodeId::new(id),
                patch_json: patch.to_string(),
                page_id: target.page_id.clone(),
            },
        ))
    }

    fn run(&self, args: &BTreeMap<String, String>) -> Validation<ToolOutcome> {
        let allowed: Option<&[&str]> = match self.name {
            "create_slot" | "update_slot" => {
                Some(&["componentId", "name", "targetId", "min", "max"])
            }
            "delete_slot" => Some(&["componentId", "name"]),
            "reset_instance_properties" => Some(&["instanceId", "properties"]),
            _ => None,
        };
        if let Some(allowed) = allowed {
            if let Some(key) = args.keys().find(|key| !allowed.contains(&key.as_str())) {
                return Err(format!("unknown argument {key}"));
            }
        }
        match self.name {
            "create_variant" => {
                let component_id = required(args, "componentId")?;
                let master = self.master(component_id)?;
                let family = master
                    .node
                    .base()
                    .component_design
                    .as_ref()
                    .and_then(|design| design.variant_of.as_deref())
                    .unwrap_or(component_id);
                let id = required(args, "nodeId")?;
                let target = self.node(id)?;
                if id == family || !matches!(target.node, PenNode::Frame(_)) {
                    return Err("nodeId must be a distinct authored frame".into());
                }
                let values: BTreeMap<String, String> = parse(args, "values")?;
                if values.is_empty() {
                    return Err("a variant requires at least one axis/value".into());
                }
                if self.nodes.values().any(|node| {
                    node.node
                        .base()
                        .component_design
                        .as_ref()
                        .is_some_and(|design| {
                            design.variant_of.as_deref() == Some(family)
                                && design.variant_values == values
                        })
                }) {
                    return Err("a variant with these axis values already exists".into());
                }
                let mut design = target
                    .node
                    .base()
                    .component_design
                    .clone()
                    .unwrap_or_default();
                design.variant_of = Some(family.into());
                design.variant_values = values;
                self.write(
                    id,
                    json!({
                        "reusable":true,"name":required(args,"name")?,"componentDesign":design
                    }),
                )
            }
            "list_variants" => {
                let id = required(args, "componentId")?;
                let master = self.master(id)?;
                let family = master
                    .node
                    .base()
                    .component_design
                    .as_ref()
                    .and_then(|design| design.variant_of.as_deref())
                    .unwrap_or(id);
                let variants: Vec<Value> = self.nodes.values().filter_map(|node| {
                    let design = node.node.base().component_design.as_ref()?;
                    (design.variant_of.as_deref() == Some(family)).then(|| json!({
                        "id":node.node.id_str(),"name":node.node.base().name,"values":design.variant_values
                    }))
                }).collect();
                Ok(ToolOutcome::OkJson(
                    json!({"componentId":family,"variants":variants}).to_string(),
                ))
            }
            "set_instance_variant" => {
                let id = required(args, "instanceId")?;
                let instance = self.node(id)?;
                let PenNode::Ref(reference) = &instance.node else {
                    return Err("instanceId must be a Ref node".into());
                };
                let original = self.master(&reference.target)?;
                let family = original
                    .node
                    .base()
                    .component_design
                    .as_ref()
                    .and_then(|design| design.variant_of.as_deref())
                    .unwrap_or(&reference.target);
                let variant_id = required(args, "variantId")?;
                let variant = self.master(variant_id)?;
                if variant_id != family
                    && variant
                        .node
                        .base()
                        .component_design
                        .as_ref()
                        .is_none_or(|design| design.variant_of.as_deref() != Some(family))
                {
                    return Err("variantId must belong to the instance's component family".into());
                }
                self.write(
                    id,
                    json!({"ref":variant_id,"descendants":null,"componentValues":null}),
                )
            }
            "reset_instance_properties" => {
                let id = required(args, "instanceId")?;
                let instance = self.node(id)?;
                let PenNode::Ref(reference) = &instance.node else {
                    return Err("instanceId must be a Ref node".into());
                };
                let master = self.master(&reference.target)?;
                let mut values = instance
                    .node
                    .base()
                    .component_values
                    .clone()
                    .unwrap_or_default();
                if args.contains_key("properties") {
                    let properties: Vec<String> = parse(args, "properties")?;
                    for name in properties {
                        if !master
                            .node
                            .base()
                            .component_design
                            .as_ref()
                            .is_some_and(|design| design.properties.contains_key(&name))
                        {
                            return Err(format!("unknown component property {name}"));
                        }
                        values.remove(&name);
                    }
                } else {
                    values.clear();
                }
                self.write(
                    id,
                    json!({"componentValues":if values.is_empty() {
                        Value::Null
                    } else {
                        json!(values)
                    }}),
                )
            }
            "set_instance_properties" => {
                let id = required(args, "instanceId")?;
                let instance = self.node(id)?;
                let PenNode::Ref(reference) = &instance.node else {
                    return Err("instanceId must be a Ref node".into());
                };
                let master = self.master(&reference.target)?;
                let properties: BTreeMap<String, Value> = parse(args, "properties")?;
                let mut values = instance
                    .node
                    .base()
                    .component_values
                    .clone()
                    .unwrap_or_default();
                for (name, value) in properties {
                    let property = master
                        .node
                        .base()
                        .component_design
                        .as_ref()
                        .and_then(|design| design.properties.get(&name))
                        .ok_or_else(|| format!("unknown component property {name}"))?;
                    if !property.accepts(&value) {
                        return Err(format!("invalid value for property {name}"));
                    }
                    self.validate_property_target(property, &master.node)?;
                    if property.kind == ComponentPropertyKind::InstanceSwap {
                        let target_id = value
                            .as_str()
                            .ok_or("swap property requires a component id")?;
                        self.master(target_id)?;
                        self.validate_reference_target(&property.target_id, target_id)?;
                    }
                    values.insert(name, value);
                }
                self.write(id, json!({"componentValues":values}))
            }
            "swap_instance" => {
                let id = required(args, "instanceId")?;
                if !matches!(self.node(id)?.node, PenNode::Ref(_)) {
                    return Err("instanceId must be a Ref node".into());
                }
                let master_id = required(args, "componentId")?;
                self.master(master_id)?;
                self.write(
                    id,
                    json!({"ref":master_id,"descendants":null,"componentValues":null}),
                )
            }
            "fill_slot" => {
                let id = required(args, "instanceId")?;
                let instance = self.node(id)?;
                let PenNode::Ref(reference) = &instance.node else {
                    return Err("instanceId must be a Ref node".into());
                };
                let master = self.master(&reference.target)?;
                let name = required(args, "slot")?;
                let slot = master
                    .node
                    .base()
                    .component_design
                    .as_ref()
                    .and_then(|design| design.slots.get(name))
                    .ok_or_else(|| format!("unknown slot {name}"))?;
                if slot.target_id == master.node.id_str() {
                    return Err(
                        "slot target must be a descendant container, not the component root".into(),
                    );
                }
                let nodes: Vec<PenNode> = parse(args, "nodes")?;
                let document_nodes = self
                    .nodes
                    .iter()
                    .map(|(id, snapshot)| (id.clone(), &snapshot.node))
                    .collect();
                op_editor_core::component_authoring::validate_slot_content(
                    slot,
                    &nodes,
                    &document_nodes,
                    id,
                    master.node.id_str(),
                )
                .map_err(|error| error.to_string())?;
                let mut overrides = reference.descendants.clone().unwrap_or_default();
                let patch = overrides
                    .entry(slot.target_id.clone())
                    .or_insert_with(|| json!({}));
                patch
                    .as_object_mut()
                    .ok_or("slot override must be an object")?
                    .insert("children".into(), json!(nodes));
                self.write(id, json!({"descendants":overrides}))
            }
            _ => self.master_operation(args),
        }
    }

    fn validate_property_target(
        &self,
        property: &ComponentProperty,
        master: &PenNode,
    ) -> Validation<()> {
        op_editor_core::component_authoring::validate_property_target(property, master)
            .map_err(|error| error.to_string())
    }

    fn validate_reference_target(&self, source: &str, target: &str) -> Validation<()> {
        let nodes = self
            .nodes
            .iter()
            .map(|(id, snapshot)| (id.clone(), &snapshot.node))
            .collect();
        op_editor_core::component_authoring::validate_reference_target(&nodes, source, target)
            .map_err(|error| error.to_string())
    }

    fn master_operation(&self, args: &BTreeMap<String, String>) -> Validation<ToolOutcome> {
        let id = required(args, "componentId")?;
        let master = self.master(id)?;
        let mut design = master
            .node
            .base()
            .component_design
            .clone()
            .unwrap_or_default();
        if self.name == "list_slots" {
            return Ok(ToolOutcome::OkJson(
                json!({"componentId":id,"slots":design.slots}).to_string(),
            ));
        }
        if self.name == "get_component_properties" {
            return Ok(ToolOutcome::OkJson(
                json!({"componentId":id,"properties":design.properties}).to_string(),
            ));
        }
        let name = required(args, "name")?;
        match self.name {
            "add_component_property" | "update_component_property" => {
                let exists = design.properties.contains_key(name);
                if (self.name == "add_component_property" && exists)
                    || (self.name == "update_component_property" && !exists)
                {
                    return Err(format!(
                        "property {name} {} already",
                        if exists { "exists" } else { "does not exist" }
                    ));
                }
                let kind: ComponentPropertyKind =
                    serde_json::from_value(json!(required(args, "kind")?))
                        .map_err(|err| err.to_string())?;
                let default = if kind == ComponentPropertyKind::Boolean {
                    parse(args, "default")?
                } else {
                    Value::String(required(args, "default")?.into())
                };
                let property = ComponentProperty {
                    kind,
                    target_id: required(args, "targetId")?.into(),
                    default,
                };
                if !property.accepts(&property.default) {
                    return Err("default does not match the property kind".into());
                }
                self.validate_property_target(&property, &master.node)?;
                if property.kind == ComponentPropertyKind::InstanceSwap {
                    let target_id = property
                        .default
                        .as_str()
                        .ok_or("swap default must be a component id")?;
                    self.master(target_id)?;
                    self.validate_reference_target(&property.target_id, target_id)?;
                }
                if self.nodes.values().any(|snapshot| matches!(&snapshot.node, PenNode::Ref(reference)
                    if reference.target == id && snapshot.node.base().component_values.as_ref()
                        .and_then(|values| values.get(name)).is_some_and(|value| !property.accepts(value)))) {
                    return Err(format!("property {name} has incompatible existing instance values"));
                }
                design.properties.insert(name.into(), property);
            }
            "delete_component_property" => {
                if design.properties.remove(name).is_none() {
                    return Err(format!("unknown property {name}"));
                }
            }
            "delete_slot" => {
                if design.slots.remove(name).is_none() {
                    return Err(format!("unknown slot {name}"));
                }
            }
            "create_slot" | "update_slot" => {
                let exists = design.slots.contains_key(name);
                if self.name == "create_slot" && exists {
                    return Err(format!("slot {name} already exists"));
                }
                if self.name == "update_slot" && !exists {
                    return Err(format!("unknown slot {name}"));
                }
                let target_id = required(args, "targetId")?;
                let min: usize = args
                    .get("min")
                    .map(|raw| raw.parse())
                    .transpose()
                    .map_err(|err| format!("invalid min: {err}"))?
                    .unwrap_or(0);
                let max: Option<usize> = args
                    .get("max")
                    .map(|raw| raw.parse())
                    .transpose()
                    .map_err(|err| format!("invalid max: {err}"))?;
                let slot = ComponentSlot {
                    target_id: target_id.into(),
                    min,
                    max,
                };
                op_editor_core::component_authoring::validate_slot(&slot, &master.node)
                    .map_err(|error| error.to_string())?;
                design.slots.insert(name.into(), slot);
            }
            _ => return Err(format!("unsupported component operation {}", self.name)),
        }
        self.write(id, json!({"componentDesign":design}))
    }
}

fn required<'a>(args: &'a BTreeMap<String, String>, key: &str) -> Validation<&'a str> {
    args.get(key)
        .map(String::as_str)
        .filter(|value| !value.trim().is_empty())
        .ok_or_else(|| format!("{key} is required"))
}

fn parse<T: serde::de::DeserializeOwned>(
    args: &BTreeMap<String, String>,
    key: &str,
) -> Validation<T> {
    let raw = required(args, key)?;
    serde_json::from_str(raw).map_err(|err| format!("invalid {key}: {err}"))
}

impl McpTool for ComponentDesignTool {
    fn name(&self) -> &str {
        self.name
    }
    fn call(&self, args: &BTreeMap<String, String>) -> ToolOutcome {
        match self.run(args) {
            Ok(outcome) => outcome,
            Err(message) => ToolOutcome::Err(ToolErrorCode::InvalidArgument, message),
        }
    }
}
