//! Transient, selection-scoped component authoring form.

use crate::{EditorState, PenNodeExt};

#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct ComponentInspectorDraft {
    pub anchor: String,
    pub tab: usize,
    pub property_kind: usize,
    pub behaviour_kind: usize,
    pub disabled: bool,
    pub values: [String; 18],
}

impl ComponentInspectorDraft {
    pub fn for_state(state: &EditorState) -> Self {
        let id = state.selection.anchor.as_str();
        if state.ui.component_inspector.anchor == id {
            return state.ui.component_inspector.clone();
        }
        let mut draft = Self {
            anchor: id.into(),
            ..Self::default()
        };
        draft.values[5] = "0".into();
        draft.values[12] = "false".into();
        let master = state.selected_node().and_then(|node| match node {
            jian_ops_schema::node::PenNode::Ref(reference) => state
                .components
                .resolved_root(&state.doc, &crate::NodeId::new(&reference.target)),
            _ => Some(node),
        });
        if let Some(behaviour) = master.and_then(crate::component_behaviour::definition) {
            use jian_ops_schema::component::{BehaviourKind as K, ComponentStateBinding as B};
            draft.behaviour_kind = match behaviour.kind {
                K::Button => 0,
                K::Switch => 1,
                K::Checkbox => 2,
                K::Tabs => 3,
                K::Slider => 4,
            };
            draft.values[12] = behaviour
                .default_value
                .as_str()
                .map(str::to_owned)
                .unwrap_or_else(|| behaviour.default_value.to_string());
            let display = |value: &serde_json::Value| {
                value
                    .as_str()
                    .map(str::to_owned)
                    .unwrap_or_else(|| value.to_string())
            };
            draft.values[13] = behaviour
                .state_bindings
                .iter()
                .map(|binding| match binding {
                    B::Property {
                        property_id,
                        values,
                    } if values.is_empty() => property_id.clone(),
                    B::Property {
                        property_id,
                        values,
                    } => format!(
                        "{property_id}:{}",
                        values
                            .iter()
                            .map(|(key, value)| format!("{key}={}", display(value)))
                            .collect::<Vec<_>>()
                            .join("|")
                    ),
                    B::Variant { variant_id, value } => format!("{}->{variant_id}", display(value)),
                })
                .collect::<Vec<_>>()
                .join(", ");
            draft.values[14] = behaviour
                .options
                .iter()
                .map(|option| format!("{}={}", option.value, option.label))
                .collect::<Vec<_>>()
                .join(", ");
            for (index, value) in [
                (15, behaviour.min),
                (16, behaviour.max),
                (17, behaviour.step),
            ] {
                draft.values[index] = value.map(|v| v.to_string()).unwrap_or_default();
            }
            draft.disabled = behaviour.disabled;
        }
        if let Some(node) = master {
            draft.values[1] = node
                .children()
                .and_then(|children| children.first())
                .map(|node| node.id_str().to_owned())
                .unwrap_or_default();
        }
        draft
    }
}
