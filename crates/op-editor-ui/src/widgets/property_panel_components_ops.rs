use super::*;
use jian_ops_schema::component::{
    BehaviourDefinition, BehaviourKind, BehaviourOption, ComponentBehaviour, ComponentProperty,
    ComponentSlot, ComponentStateBinding,
};
use jian_ops_schema::node::PenNode;
use op_editor_core::component_authoring::{prepare_patch, ComponentAuthoringError as Error};
use serde_json::{json, Value};
use std::collections::{BTreeMap, BTreeSet};

pub(crate) fn dispatch(state: &mut EditorState, action: &ComponentInspectorAction, now_ms: u64) {
    if matches!(
        state.ui.property_focus,
        Some(PropertyFocus::ComponentDesign(_))
    ) {
        super::super::property_panel_commit::commit_property_focus(state);
    }
    let Some(model) = ComponentInspector::for_state(state) else {
        reject(
            state,
            "select one authored component or instance".into(),
            now_ms,
        );
        return;
    };
    state.ui.component_inspector = model.draft.clone();
    use ComponentInspectorAction as A;
    let draft = &mut state.ui.component_inspector;
    match action {
        A::Tab(tab) if *tab < 4 => {
            draft.tab = *tab;
            return;
        }
        A::PropertyKind => {
            draft.property_kind = (draft.property_kind + 1) % 3;
            return;
        }
        A::BehaviourKind => {
            draft.behaviour_kind = (draft.behaviour_kind + 1) % 5;
            return;
        }
        A::Disabled => {
            draft.disabled = !draft.disabled;
            return;
        }
        A::Target(id) => {
            draft.values[if draft.tab == 1 { 4 } else { 1 }] = id.clone();
            return;
        }
        A::CopyChild(id) => {
            let mut ids: Vec<_> = comma_values(&draft.values[7]).map(str::to_owned).collect();
            if ids.contains(id) {
                ids.retain(|candidate| candidate != id);
            } else {
                ids.push(id.clone());
            }
            draft.values[7] = ids.join(", ");
            return;
        }
        A::VariantFrame(id) => {
            draft.values[8] = id.clone();
            draft.values[9] = model
                .frames
                .iter()
                .find(|(target, _)| target == id)
                .map(|(_, label)| label.clone())
                .unwrap_or_default();
            return;
        }
        A::LoadProperty(name) => {
            if let Some(property) = model.design.properties.get(name) {
                draft.values[0] = name.clone();
                draft.values[1] = property.target_id.clone();
                draft.property_kind = match property.kind {
                    ComponentPropertyKind::Text => 0,
                    ComponentPropertyKind::Boolean => 1,
                    ComponentPropertyKind::InstanceSwap => 2,
                };
                let value = state
                    .selected_node()
                    .and_then(|node| node.base().component_values.as_ref())
                    .and_then(|values| values.get(name))
                    .unwrap_or(&property.default);
                state.ui.component_inspector.values[2] = string_value(value);
            }
            return;
        }
        A::LoadSlot(name) => {
            if let Some(slot) = model.design.slots.get(name) {
                draft.values[3] = name.clone();
                draft.values[4] = slot.target_id.clone();
                draft.values[5] = slot.min.to_string();
                draft.values[6] = slot.max.map(|n| n.to_string()).unwrap_or_default();
                if let Some(PenNode::Ref(reference)) = state.selected_node() {
                    let children = reference
                        .descendants
                        .as_ref()
                        .and_then(|overrides| overrides.get(&slot.target_id))
                        .and_then(|patch| patch.get("children"))
                        .and_then(Value::as_array);
                    state.ui.component_inspector.values[7] = children
                        .into_iter()
                        .flatten()
                        .filter_map(|node| node.get("id").and_then(Value::as_str))
                        .collect::<Vec<_>>()
                        .join(", ");
                }
            }
            return;
        }
        _ => {}
    }
    match prepare(state, &model, action) {
        Ok(command) => {
            state.ui.design_reject = None;
            if !state.apply(command) && state.ui.design_reject.is_none() {
                // Applying an unchanged form is intentionally a history-free no-op.
                return;
            }
            if let Some(error) = state.ui.design_reject.clone() {
                reject(state, error, now_ms);
            }
        }
        Err(error) => reject(state, error.to_string(), now_ms),
    }
}

fn string_value(value: &Value) -> String {
    value
        .as_str()
        .map(str::to_owned)
        .unwrap_or_else(|| value.to_string())
}

fn reject(state: &mut EditorState, reason: String, now_ms: u64) {
    state.ui.design_reject = Some(reason.clone());
    state.editor_ui.show_toast(
        "layerMenu.designError",
        vec![("reason".into(), reason)],
        op_editor_core::editor_toast::EditorToastLevel::Warn,
        now_ms,
    );
}

fn prepare(
    state: &EditorState,
    model: &ComponentInspector,
    action: &ComponentInspectorAction,
) -> Result<op_editor_core::EditorCommand, Error> {
    use ComponentInspectorAction as A;
    let fail = |reason: &str| Error(reason.into());
    let draft = &state.ui.component_inspector;
    let v = &draft.values;
    let required = |index: usize| -> Result<&str, Error> {
        let value = v[index].trim();
        if value.is_empty() {
            Err(fail("complete all required component fields"))
        } else {
            Ok(value)
        }
    };
    let number = |index: usize| {
        v[index]
            .trim()
            .parse::<usize>()
            .map_err(|_| fail("slot limits must be nonnegative integers"))
    };
    let selected_id = state.selection.anchor.as_str();
    let mut design = model.design.clone();
    let mut target = selected_id.to_owned();
    let patch = match action {
        A::SaveProperty if !model.instance => {
            let kind = property_kind(draft.property_kind);
            let property = ComponentProperty {
                default: typed_value(&v[2], &kind)?,
                kind,
                target_id: required(1)?.into(),
            };
            design.properties.insert(required(0)?.into(), property);
            json!({"componentDesign":design})
        }
        A::DeleteProperty if !model.instance => {
            if design.properties.remove(required(0)?).is_none() {
                return Err(fail("unknown component property"));
            }
            json!({"componentDesign":design})
        }
        A::InstanceValue | A::ResetInstanceValue if model.instance => {
            let name = required(0)?;
            let property = design
                .properties
                .get(name)
                .ok_or_else(|| fail("unknown component property"))?;
            let mut values = state
                .selected_node()
                .and_then(|node| node.base().component_values.clone())
                .unwrap_or_default();
            if matches!(action, A::ResetInstanceValue) {
                values.remove(name);
            } else {
                values.insert(name.into(), typed_value(&v[2], &property.kind)?);
            }
            json!({"componentValues":values})
        }
        A::SaveSlot if !model.instance => {
            let slot = ComponentSlot {
                target_id: required(4)?.into(),
                min: number(5)?,
                max: if v[6].trim().is_empty() {
                    None
                } else {
                    Some(number(6)?)
                },
            };
            design.slots.insert(required(3)?.into(), slot);
            json!({"componentDesign":design})
        }
        A::DeleteSlot if !model.instance => {
            if design.slots.remove(required(3)?).is_none() {
                return Err(fail("unknown slot"));
            }
            json!({"componentDesign":design})
        }
        A::FillSlot if model.instance => {
            let slot = design
                .slots
                .get(required(3)?)
                .ok_or_else(|| fail("unknown slot"))?;
            let PenNode::Ref(reference) = state
                .selected_node()
                .ok_or_else(|| fail("instance not found"))?
            else {
                return Err(fail("select an instance"));
            };
            let nodes = op_editor_core::component_behaviour::document_nodes(&state.doc);
            let mut ids = BTreeSet::new();
            let children = comma_values(&v[7])
                .map(|id| {
                    if !ids.insert(id) {
                        return Err(fail("slot children must have distinct ids"));
                    }
                    nodes
                        .get(id)
                        .map(|node| (*node).clone())
                        .ok_or_else(|| fail("slot child node not found"))
                })
                .collect::<Result<Vec<_>, _>>()?;
            op_editor_core::component_authoring::validate_slot_content(
                slot,
                &children,
                &nodes,
                selected_id,
                &model.master_id,
            )?;
            let mut overrides = reference.descendants.clone().unwrap_or_default();
            let entry = overrides
                .entry(slot.target_id.clone())
                .or_insert_with(|| json!({}));
            entry
                .as_object_mut()
                .ok_or_else(|| fail("slot override must be an object"))?
                .insert("children".into(), json!(children));
            json!({"descendants":overrides})
        }
        A::CreateVariant if !model.instance => {
            target = required(8)?.into();
            let nodes = op_editor_core::component_behaviour::document_nodes(&state.doc);
            let node = nodes
                .get(&target)
                .ok_or_else(|| fail("variant frame not found"))?;
            let family = design.variant_of.as_deref().unwrap_or(&model.master_id);
            if target == family || !matches!(node, PenNode::Frame(_)) {
                return Err(fail("variant must be a distinct authored frame"));
            }
            let axes: Vec<_> = comma_values(required(10)?).collect();
            let values: Vec<_> = comma_values(required(11)?).collect();
            if axes.len() != values.len() || axes.is_empty() {
                return Err(fail("each variant axis needs a value"));
            }
            let values: BTreeMap<String, String> = axes
                .into_iter()
                .zip(values)
                .map(|(key, value)| (key.into(), value.into()))
                .collect();
            if nodes.values().any(|node| {
                node.base().component_design.as_ref().is_some_and(|d| {
                    d.variant_of.as_deref() == Some(family) && d.variant_values == values
                })
            }) {
                return Err(fail("a variant with these axis values already exists"));
            }
            let mut variant = node.base().component_design.clone().unwrap_or_default();
            variant.variant_of = Some(family.into());
            variant.variant_values = values;
            json!({"reusable":true,"name":required(9)?,"componentDesign":variant})
        }
        A::SwapVariant(id) if model.instance => {
            if !model.variants.iter().any(|(target, _)| target == id) {
                return Err(fail("variant must belong to the instance component family"));
            }
            json!({"ref":id,"descendants":null,"componentValues":null})
        }
        A::SaveBehaviour if !model.instance => {
            design.behaviour = Some(ComponentBehaviour::Typed(behaviour(draft, &design)?));
            json!({"componentDesign":design})
        }
        A::RemoveBehaviour if !model.instance => {
            design.behaviour = None;
            json!({"componentDesign":design})
        }
        _ => {
            return Err(fail(
                "this component operation is unavailable for the selection",
            ));
        }
    };
    prepare_patch(state, &target, patch)
}

fn comma_values(value: &str) -> impl Iterator<Item = &str> {
    value
        .split(',')
        .map(str::trim)
        .filter(|value| !value.is_empty())
}

fn typed_value(value: &str, kind: &ComponentPropertyKind) -> Result<Value, Error> {
    if *kind == ComponentPropertyKind::Boolean {
        value
            .trim()
            .parse::<bool>()
            .map(Value::Bool)
            .map_err(|_| Error("boolean values must be true or false".into()))
    } else {
        Ok(Value::String(value.into()))
    }
}

fn behaviour(
    draft: &ComponentInspectorDraft,
    design: &ComponentDesign,
) -> Result<BehaviourDefinition, Error> {
    let v = &draft.values;
    let kind = [
        BehaviourKind::Button,
        BehaviourKind::Switch,
        BehaviourKind::Checkbox,
        BehaviourKind::Tabs,
        BehaviourKind::Slider,
    ][draft.behaviour_kind % 5];
    let state_value = |raw: &str| -> Result<Value, Error> {
        match kind {
            BehaviourKind::Tabs => Ok(json!(raw)),
            BehaviourKind::Slider => raw
                .parse::<f64>()
                .ok()
                .filter(|n| n.is_finite())
                .map(|value| json!(value))
                .ok_or_else(|| Error("slider values must be finite numbers".into())),
            _ => typed_value(raw, &ComponentPropertyKind::Boolean),
        }
    };
    let bindings = comma_values(&v[13])
        .map(|raw| {
            if let Some((value, variant)) = raw.split_once("->") {
                return Ok(ComponentStateBinding::Variant {
                    variant_id: variant.trim().into(),
                    value: state_value(value.trim())?,
                });
            }
            let (id, mapping) = raw.split_once(':').unwrap_or((raw, ""));
            let property = design
                .properties
                .get(id.trim())
                .ok_or_else(|| Error(format!("unknown component property {}", id.trim())))?;
            let mut values = BTreeMap::new();
            for pair in mapping.split('|').filter(|value| !value.is_empty()) {
                let (key, value) = pair
                    .split_once('=')
                    .ok_or_else(|| Error("bindings use property:state=value|state=value".into()))?;
                values.insert(
                    key.trim().into(),
                    typed_value(value.trim(), &property.kind)?,
                );
            }
            Ok(ComponentStateBinding::Property {
                property_id: id.trim().into(),
                values,
            })
        })
        .collect::<Result<Vec<_>, Error>>()?;
    let number = |index: usize| -> Result<Option<f64>, Error> {
        if v[index].trim().is_empty() {
            return Ok(None);
        }
        v[index]
            .trim()
            .parse::<f64>()
            .ok()
            .filter(|n| n.is_finite())
            .map(Some)
            .ok_or_else(|| Error("Behaviour range values must be finite numbers".into()))
    };
    Ok(BehaviourDefinition {
        kind,
        default_value: state_value(v[12].trim())?,
        state_bindings: bindings,
        options: if kind == BehaviourKind::Tabs {
            comma_values(&v[14])
                .map(|raw| {
                    let (value, label) = raw.split_once('=').unwrap_or((raw, raw));
                    BehaviourOption {
                        value: value.trim().into(),
                        label: label.trim().into(),
                    }
                })
                .collect()
        } else {
            Vec::new()
        },
        min: if kind == BehaviourKind::Slider {
            number(15)?
        } else {
            None
        },
        max: if kind == BehaviourKind::Slider {
            number(16)?
        } else {
            None
        },
        step: if kind == BehaviourKind::Slider {
            number(17)?
        } else {
            None
        },
        disabled: draft.disabled,
    })
}
