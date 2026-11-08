//! Component-property bindings for one instance expansion.
//!
//! Ported from open-pencil `packages/fig/src/instance-overrides/bindings/properties.ts`
//! (`componentBindings`, `instanceBindings`, `bindSourceProperties`): a
//! component's `componentPropDefs[].initialValue` are the defaults, the
//! instance's `componentPropAssignments` replace them by `defID`, and every
//! static descendant whose `componentPropRefs` names a bound definition takes
//! the value into the referenced field (`VISIBLE`, `TEXT_DATA`,
//! `OVERRIDDEN_SYMBOL_ID`). Variable-bound assignments use the resolved value
//! Figma caches beside the alias.
//!
//! The bound values become synthetic override entries placed BEFORE the
//! authored `symbolOverrides`, so an explicit override of the same field
//! still wins (open-pencil binds source records first, then applies layers).

use super::keyed::{is_instance_record, KeyedIndex};
use crate::kiwi::FigValue;
use crate::tree::{guid_to_string, TreeNode};

/// Concrete assignment value, or `None` when it carries nothing usable.
fn assignment_value(assignment: &FigValue) -> Option<FigValue> {
    let usable = |value: &FigValue| {
        ["boolValue", "textValue", "guidValue", "textDataValue"]
            .iter()
            .any(|key| value.get(key).is_some())
    };
    if let Some(value) = assignment.get("value").filter(|v| usable(v)) {
        return Some(value.clone());
    }
    let variable = assignment.get("varValue")?.get("value")?;
    if let Some(guid) = variable.get("symbolIdValue").and_then(|v| v.get("guid")) {
        return Some(FigValue::Object(vec![("guidValue".into(), guid.clone())]));
    }
    for key in ["boolValue", "textValue", "textDataValue"] {
        if let Some(value) = variable.get(key) {
            return Some(FigValue::Object(vec![(key.into(), value.clone())]));
        }
    }
    None
}

/// Read an instance's own assignments (top level or inside `symbolData`).
pub(crate) fn own_assignments(instance: &FigValue) -> Vec<FigValue> {
    let mut out: Vec<FigValue> = Vec::new();
    if let Some(list) = instance
        .get("symbolData")
        .and_then(|data| data.get_array("componentPropAssignments"))
    {
        merge_assignments(&mut out, list);
    }
    if let Some(list) = instance.get_array("componentPropAssignments") {
        merge_assignments(&mut out, list);
    }
    out
}

/// Merge `later` assignments into `out`; a repeated `defID` is replaced.
pub(crate) fn merge_assignments(out: &mut Vec<FigValue>, later: &[FigValue]) {
    for assignment in later {
        let id = assignment.get("defID").and_then(guid_to_string);
        let slot = id.as_ref().and_then(|id| {
            out.iter()
                .position(|e| e.get("defID").and_then(guid_to_string).as_ref() == Some(id))
        });
        match slot {
            Some(i) => out[i] = assignment.clone(),
            None => out.push(assignment.clone()),
        }
    }
}

/// Defaults from the component, replaced by the instance's assignments.
fn bindings(symbol: &FigValue, assignments: &[FigValue]) -> Vec<(String, FigValue)> {
    let mut out: Vec<(String, FigValue)> = Vec::new();
    for def in symbol.get_array("componentPropDefs").unwrap_or(&[]) {
        let (Some(id), Some(value)) = (
            def.get("id").and_then(guid_to_string),
            def.get("initialValue"),
        ) else {
            continue;
        };
        out.push((id, value.clone()));
    }
    for assignment in assignments {
        let (Some(id), Some(value)) = (
            assignment.get("defID").and_then(guid_to_string),
            assignment_value(assignment),
        ) else {
            continue;
        };
        match out.iter_mut().find(|(existing, _)| *existing == id) {
            Some(slot) => slot.1 = value,
            None => out.push((id, value)),
        }
    }
    out
}

fn bound_text(value: &FigValue) -> Option<String> {
    match value.get("textValue") {
        Some(FigValue::Str(text)) => return Some(text.to_string()),
        Some(text) => {
            if let Some(chars) = text.get_str("characters") {
                return Some(chars.to_string());
            }
        }
        None => {}
    }
    value
        .get("textDataValue")
        .and_then(|data| data.get_str("characters"))
        .map(str::to_string)
}

/// The record's `textData` with only its characters replaced. Per-character
/// style ids and cached line metrics describe the old string, so they are
/// dropped when the text actually changes; the node-level style remains.
fn replaced_text_data(node: &FigValue, text: &str) -> FigValue {
    let mut data = node
        .get("textData")
        .cloned()
        .unwrap_or(FigValue::Object(Vec::new()));
    if data.get_str("characters") != Some(text) {
        if let FigValue::Object(pairs) = &mut data {
            pairs.retain(|(key, _)| !matches!(key.as_ref(), "characterStyleIDs" | "lines"));
        }
    }
    data.set("characters", FigValue::Str(text.into()));
    data
}

fn path_to(guid: &FigValue) -> FigValue {
    FigValue::Object(vec![("guids".into(), FigValue::Array(vec![guid.clone()]))])
}

/// Synthetic override entries for every bound field of a static descendant.
fn bound_entries(node: &TreeNode, bound: &[(String, FigValue)], out: &mut Vec<FigValue>) {
    let figma = &node.figma;
    if let (Some(guid), Some(refs)) = (figma.get("guid"), figma.get_array("componentPropRefs")) {
        let mut fields: Vec<(String, FigValue)> = Vec::new();
        for reference in refs {
            if reference.get_bool("isDeleted") == Some(true) {
                continue;
            }
            let Some(def) = reference.get("defID").and_then(guid_to_string) else {
                continue;
            };
            let Some((_, value)) = bound.iter().find(|(id, _)| *id == def) else {
                continue;
            };
            match reference.get_str("componentPropNodeField") {
                Some("VISIBLE") => {
                    if let Some(visible) = value.get_bool("boolValue") {
                        fields.push(("visible".into(), FigValue::Bool(visible)));
                    }
                }
                Some("TEXT_DATA") => {
                    if let Some(text) = bound_text(value) {
                        fields.push(("textData".into(), replaced_text_data(figma, &text)));
                    }
                }
                Some("OVERRIDDEN_SYMBOL_ID") => {
                    if let Some(target) = value.get("guidValue") {
                        fields.push(("overriddenSymbolID".into(), target.clone()));
                    }
                }
                _ => {}
            }
        }
        if !fields.is_empty() {
            let mut entry = vec![("guidPath".into(), path_to(guid))];
            entry.extend(fields.into_iter().map(|(k, v)| (k.into(), v)));
            out.push(FigValue::Object(entry));
        }
    }
    if is_instance_record(figma) {
        return;
    }
    for child in &node.children {
        bound_entries(child, bound, out);
    }
}

/// Prefix `overrides` with the instance's component-property values. Only
/// files that address overrides by `overrideKey` take this path; legacy files
/// keep their existing heuristic resolution untouched.
pub(crate) fn with_property_bindings(
    instance: &FigValue,
    symbol: &TreeNode,
    overrides: Option<Vec<FigValue>>,
) -> Option<Vec<FigValue>> {
    if !KeyedIndex::build(symbol).uses_override_keys {
        return overrides;
    }
    let bound = bindings(&symbol.figma, &own_assignments(instance));
    if bound.is_empty() {
        return overrides;
    }
    let mut synthetic = Vec::new();
    for child in &symbol.children {
        bound_entries(child, &bound, &mut synthetic);
    }
    if synthetic.is_empty() {
        return overrides;
    }
    synthetic.extend(overrides.unwrap_or_default());
    Some(synthetic)
}
