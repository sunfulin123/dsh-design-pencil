//! Figma-style interactive component state derivation for `ComponentBehaviour`.
//!
//! Maps authored `BehaviourDefinition`s (`Button`, `Switch`, `Checkbox`, `Tabs`,
//! `Slider`) into variant overrides (`CHANGE_TO`) and property overrides
//! (`hidden` / `text` on expanded instance descendants) without `jian_core::Runtime`.

use crate::component_behaviour::{definition, document_nodes, state_value_key};
use crate::PenNodeExt;
use jian_ops_schema::component::{
    BehaviourDefinition, BehaviourKind, ComponentProperty, ComponentPropertyKind,
    ComponentStateBinding,
};
use jian_ops_schema::node::PenNode;
use jian_ops_schema::prototype::{
    ActionType, PrototypeAction, PrototypeNavigation, Reaction, Trigger,
};
use jian_ops_schema::PenDocument;
use serde_json::{json, Value};
use std::collections::{BTreeMap, HashMap};

#[derive(Debug, Clone, PartialEq)]
pub struct InteractiveComponentEntry {
    pub owner_id: String,
    pub master_id: String,
    pub is_ref: bool,
    pub behaviour: BehaviourDefinition,
    pub properties: BTreeMap<String, ComponentProperty>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum PropertyOverrideValue {
    Visible(bool),
    Text(String),
}

/// Index all interactive component owners (reusable masters and their `Ref`
/// instances) across `doc`.
pub fn collect_interactive_components(
    doc: &PenDocument,
) -> HashMap<String, InteractiveComponentEntry> {
    let all_nodes = document_nodes(doc);
    let mut out = HashMap::new();
    for (id, node) in &all_nodes {
        let (master_id, is_ref, master_node) = match node {
            PenNode::Ref(r) => {
                let Some(master) = all_nodes.get(&r.target).copied() else {
                    continue;
                };
                (r.target.clone(), true, master)
            }
            _ => (id.clone(), false, *node),
        };
        let Some(behaviour) = definition(master_node).cloned() else {
            continue;
        };
        if behaviour.disabled {
            continue;
        }
        let properties = master_node
            .base()
            .component_design
            .as_ref()
            .map(|d| d.properties.clone())
            .unwrap_or_default();
        out.insert(
            id.clone(),
            InteractiveComponentEntry {
                owner_id: id.clone(),
                master_id,
                is_ref,
                behaviour,
                properties,
            },
        );
    }
    out
}

impl InteractiveComponentEntry {
    pub fn next_click_value(&self, current: &Value, rel_x: Option<f32>) -> Option<Value> {
        match self.behaviour.kind {
            BehaviourKind::Switch | BehaviourKind::Checkbox => {
                Some(json!(!current.as_bool().unwrap_or(false)))
            }
            BehaviourKind::Button => None,
            BehaviourKind::Tabs => {
                let n = self.behaviour.options.len();
                if n == 0 {
                    return None;
                }
                if let Some(rx) = rel_x.filter(|x| x.is_finite() && *x >= 0.0 && *x <= 1.0) {
                    let idx = ((rx * n as f32).floor() as usize).min(n - 1);
                    return Some(json!(self.behaviour.options[idx].value));
                }
                let cur = current.as_str().unwrap_or_default();
                let pos = self
                    .behaviour
                    .options
                    .iter()
                    .position(|o| o.value == cur)
                    .unwrap_or(0);
                Some(json!(self.behaviour.options[(pos + 1) % n].value))
            }
            BehaviourKind::Slider => {
                let min = self.behaviour.min.unwrap_or(0.0);
                let max = self.behaviour.max.unwrap_or(100.0);
                let step = self.behaviour.step.unwrap_or(1.0).max(1e-6);
                let cur = current.as_f64().unwrap_or(min);
                let next = if cur + step > max + 1e-9 {
                    min
                } else {
                    (cur + step).min(max)
                };
                if next.fract().abs() < 1e-9 {
                    Some(json!(next.round() as i64))
                } else {
                    Some(json!(next))
                }
            }
        }
    }

    pub fn hover_or_press_value(&self, active: bool) -> Option<Value> {
        (self.behaviour.kind == BehaviourKind::Button).then_some(json!(active))
    }

    pub fn evaluate_bindings(
        &self,
        state_val: &Value,
        variant_overrides: &mut HashMap<String, String>,
        property_overrides: &mut HashMap<String, PropertyOverrideValue>,
    ) {
        let key = state_value_key(state_val);
        for binding in &self.behaviour.state_bindings {
            match binding {
                ComponentStateBinding::Variant { variant_id, value } => {
                    if state_value_key(value) == key {
                        variant_overrides.insert(self.owner_id.clone(), variant_id.clone());
                    }
                }
                ComponentStateBinding::Property {
                    property_id,
                    values,
                } => {
                    let Some(prop) = self.properties.get(property_id) else {
                        continue;
                    };
                    let resolved = values.get(&key).unwrap_or(state_val);
                    let target_node_id = if self.is_ref {
                        format!("{}__{}", self.owner_id, prop.target_id)
                    } else {
                        prop.target_id.clone()
                    };
                    match prop.kind {
                        ComponentPropertyKind::Boolean => {
                            if let Some(b) = resolved.as_bool() {
                                property_overrides
                                    .insert(target_node_id, PropertyOverrideValue::Visible(b));
                            }
                        }
                        ComponentPropertyKind::Text => {
                            let text = resolved
                                .as_str()
                                .map(str::to_owned)
                                .unwrap_or_else(|| state_value_key(resolved));
                            property_overrides
                                .insert(target_node_id, PropertyOverrideValue::Text(text));
                        }
                        ComponentPropertyKind::InstanceSwap => {}
                    }
                }
            }
        }
    }
}

pub fn derive_legacy_on_tap(
    node: &PenNode,
    route_to_screen: &HashMap<String, String>,
) -> Vec<Reaction> {
    let Some(list) = node.events().and_then(|e| e.on_tap.as_ref()) else {
        return Vec::new();
    };
    let mut actions = Vec::new();
    for act in list {
        let map = &act.0;
        let ty = map.get("type").and_then(|v| v.as_str()).unwrap_or("");
        let nav_target = if ty == "navigate" {
            map.get("to").and_then(|v| v.as_str())
        } else {
            map.get("navigate")
                .or_else(|| map.get("push"))
                .or_else(|| map.get("replace"))
                .and_then(|v| v.as_str().or_else(|| v.get("to").and_then(|t| t.as_str())))
        };
        if let Some(raw_to) = nav_target {
            let unquoted =
                serde_json::from_str::<String>(raw_to).unwrap_or_else(|_| raw_to.to_string());
            let to = unquoted.trim();
            if !to.is_empty() {
                let dst = route_to_screen
                    .get(to)
                    .cloned()
                    .unwrap_or_else(|| to.to_string());
                actions.push(PrototypeAction::node_nav(
                    dst,
                    PrototypeNavigation::Navigate,
                    None,
                ));
            }
        } else if ty == "back" || ty == "pop" || map.contains_key("back") || map.contains_key("pop")
        {
            actions.push(PrototypeAction {
                kind: ActionType::Back,
                destination_id: None,
                navigation: None,
                transition: None,
                preserve_scroll_position: None,
                reset_scroll_position: None,
                reset_video_position: None,
                reset_interactive_components: None,
                overlay_relative_position: None,
                url: None,
                open_in_new_tab: None,
                variable_id: None,
                variable_value: None,
                variable_collection_id: None,
                variable_mode_id: None,
                conditional_blocks: Vec::new(),
            });
        }
    }
    if actions.is_empty() {
        Vec::new()
    } else {
        vec![Reaction {
            trigger: Some(Trigger::on_click()),
            actions,
        }]
    }
}
