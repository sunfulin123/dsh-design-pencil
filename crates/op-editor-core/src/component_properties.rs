use jian_ops_schema::node::PenNode;
use serde_json::{Map, Value};

use crate::PenNodeExt;

/// Resolve defaults and instance values using the existing descendant override
/// mechanism, before both render expansion and detach materialization.
pub(crate) fn apply_values(reference: &PenNode, master: &PenNode, value: &mut Value) {
    let Some(design) = &master.base().component_design else {
        return;
    };
    let Some(object) = value.as_object_mut() else {
        return;
    };
    let overrides = object
        .entry("descendants")
        .or_insert_with(|| Value::Object(Map::new()));
    let Some(overrides) = overrides.as_object_mut() else {
        return;
    };
    for (name, property) in &design.properties {
        let selected = reference
            .base()
            .component_values
            .as_ref()
            .and_then(|values| values.get(name));
        let value = selected.unwrap_or(&property.default);
        if !property.accepts(value) {
            continue;
        }
        let patch = overrides
            .entry(property.target_id.clone())
            .or_insert_with(|| Value::Object(Map::new()));
        if let Some(patch) = patch.as_object_mut() {
            // Explicit instance property values win; ordinary inspector
            // overrides still take precedence over a property's default.
            if selected.is_some() || !patch.contains_key(property.field()) {
                patch.insert(property.field().into(), value.clone());
            }
        }
    }
}
