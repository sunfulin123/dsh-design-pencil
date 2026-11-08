use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::BTreeMap;

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, schemars::JsonSchema)]
#[cfg_attr(feature = "export-ts", derive(ts_rs::TS))]
#[serde(rename_all = "kebab-case")]
pub enum ComponentPropertyKind {
    Text,
    Boolean,
    InstanceSwap,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, schemars::JsonSchema)]
#[cfg_attr(feature = "export-ts", derive(ts_rs::TS))]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ComponentProperty {
    pub kind: ComponentPropertyKind,
    pub target_id: String,
    pub default: Value,
}

impl ComponentProperty {
    pub fn accepts(&self, value: &Value) -> bool {
        match self.kind {
            ComponentPropertyKind::Boolean => value.is_boolean(),
            ComponentPropertyKind::Text | ComponentPropertyKind::InstanceSwap => value.is_string(),
        }
    }

    pub fn field(&self) -> &'static str {
        match self.kind {
            ComponentPropertyKind::Text => "content",
            ComponentPropertyKind::Boolean => "visible",
            ComponentPropertyKind::InstanceSwap => "ref",
        }
    }
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, schemars::JsonSchema)]
#[cfg_attr(feature = "export-ts", derive(ts_rs::TS))]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ComponentSlot {
    pub target_id: String,
    #[serde(default)]
    pub min: usize,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub max: Option<usize>,
}

/// Authoring definitions live on reusable masters; values live on Ref nodes.
#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize, schemars::JsonSchema)]
#[cfg_attr(feature = "export-ts", derive(ts_rs::TS))]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ComponentDesign {
    #[serde(default, skip_serializing_if = "BTreeMap::is_empty")]
    pub properties: BTreeMap<String, ComponentProperty>,
    #[serde(default, skip_serializing_if = "BTreeMap::is_empty")]
    pub slots: BTreeMap<String, ComponentSlot>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub variant_of: Option<String>,
    #[serde(default, skip_serializing_if = "BTreeMap::is_empty")]
    pub variant_values: BTreeMap<String, String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub behaviour: Option<ComponentBehaviour>,
}

/// Old string labels remain readable, but only the typed contract is executable.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, schemars::JsonSchema)]
#[cfg_attr(feature = "export-ts", derive(ts_rs::TS))]
#[serde(untagged)]
pub enum ComponentBehaviour {
    Typed(BehaviourDefinition),
    Legacy(String),
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, schemars::JsonSchema)]
#[cfg_attr(feature = "export-ts", derive(ts_rs::TS))]
#[serde(rename_all = "lowercase")]
pub enum BehaviourKind {
    Button,
    Switch,
    Checkbox,
    Tabs,
    Slider,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, schemars::JsonSchema)]
#[cfg_attr(feature = "export-ts", derive(ts_rs::TS))]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct BehaviourOption {
    pub value: String,
    pub label: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, schemars::JsonSchema)]
#[cfg_attr(feature = "export-ts", derive(ts_rs::TS))]
#[serde(tag = "type", rename_all = "camelCase", deny_unknown_fields)]
pub enum ComponentStateBinding {
    Property {
        #[serde(rename = "propertyId")]
        property_id: String,
        /// Optional state-value → property-value mapping. Omitted means identity.
        #[serde(default, skip_serializing_if = "BTreeMap::is_empty")]
        values: BTreeMap<String, Value>,
    },
    Variant {
        #[serde(rename = "variantId")]
        variant_id: String,
        value: Value,
    },
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, schemars::JsonSchema)]
#[cfg_attr(feature = "export-ts", derive(ts_rs::TS))]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct BehaviourDefinition {
    pub kind: BehaviourKind,
    pub default_value: Value,
    pub state_bindings: Vec<ComponentStateBinding>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub options: Vec<BehaviourOption>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub min: Option<f64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub max: Option<f64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub step: Option<f64>,
    #[serde(default, skip_serializing_if = "std::ops::Not::not")]
    pub disabled: bool,
}

#[cfg(test)]
mod behaviour_tests {
    use super::*;

    #[test]
    fn component_behaviour_accepts_typed_contract_and_preserves_legacy_strings() {
        let typed = serde_json::json!({
            "behaviour": {
                "kind": "switch", "defaultValue": false,
                "stateBindings": [{"type":"property","propertyId":"checked"}]
            }
        });
        let design = serde_json::from_value::<ComponentDesign>(typed.clone())
            .expect("typed component behaviour");
        assert_eq!(serde_json::to_value(design).unwrap(), typed);
        for value in [
            serde_json::json!({}),
            serde_json::json!({"behaviour":"switch"}),
        ] {
            let design: ComponentDesign = serde_json::from_value(value.clone()).unwrap();
            assert_eq!(serde_json::to_value(design).unwrap(), value);
        }
    }
}
