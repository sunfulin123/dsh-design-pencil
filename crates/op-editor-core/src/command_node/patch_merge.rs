//! Deep-merge helpers for `cmd_patch_node_data`, including `Ref.descendants`
//! override merging, explicit `null` field clearing, and `inst__child`
//! virtual-anchor routing.

use crate::node_id::NodeId;
use crate::pen_node_ext::PenNodeExt;
use crate::walkers;
use jian_ops_schema::node::PenNode;
use jian_ops_schema::PenDocument;
use serde_json::{Map, Value};

/// Resolve either an authored node id or a virtual `<refId>__<childId>`
/// instance-child anchor into `(target_node_id, effective_patch_map)`.
///
/// When `node_id` names a virtual instance child, the patch is wrapped into a
/// `descendants[child_id]` override targeting the owning `Ref` node so callers
/// can run `U("inst__child", { content: "Hi" })` directly.
pub(super) fn resolve_patch_target(
    active_children: &[PenNode],
    doc: &PenDocument,
    node_id: &NodeId,
    patch: Map<String, Value>,
) -> Option<(NodeId, Map<String, Value>)> {
    if walkers::find_node(active_children, node_id).is_some() {
        return Some((node_id.clone(), patch));
    }
    let (ref_id, child_id) = crate::split_instance_child_anchor(node_id, doc)?;
    walkers::find_node(active_children, &ref_id)?;
    let mut child_patch = patch;
    child_patch.remove("id");
    child_patch.remove("type");
    let mut descendants = Map::new();
    descendants.insert(child_id.as_str().to_owned(), Value::Object(child_patch));
    let mut wrapped = Map::new();
    wrapped.insert("descendants".to_owned(), Value::Object(descendants));
    Some((ref_id, wrapped))
}

/// Build the patched replacement `PenNode` from `current`, `outer_patch`, and
/// `text_patch`, preserving sibling `descendants` overrides on `PenNode::Ref`
/// and clearing optional fields set to `null`.
pub(super) fn build_patched_replacement(
    current: &PenNode,
    outer_patch: Map<String, Value>,
    text_patch: Map<String, Value>,
) -> Option<PenNode> {
    let mut replacement = current.clone();
    if !outer_patch.is_empty() {
        let mut value = serde_json::to_value(current).ok()?;
        let obj = value.as_object_mut()?;
        apply_outer_patch_fields(matches!(current, PenNode::Ref(_)), obj, outer_patch);
        let candidate: PenNode = serde_json::from_value(value).ok()?;
        if candidate.base().id.is_empty() {
            return None;
        }
        replacement = candidate;
    }
    if !text_patch.is_empty() {
        let inner = crate::command_node_attrs::resolve_text_node_mut(&mut replacement)?;
        let mut value = serde_json::to_value(&*inner).ok()?;
        let obj = value.as_object_mut()?;
        for (key, val) in text_patch {
            if val.is_null() {
                obj.remove(&key);
            } else {
                obj.insert(key, val);
            }
        }
        *inner = serde_json::from_value(value).ok()?;
    }
    Some(replacement)
}

/// Apply `outer_patch` onto serialized `obj`, preserving sibling `descendants`
/// overrides on `PenNode::Ref` and clearing optional fields set to `null`.
fn apply_outer_patch_fields(
    is_ref: bool,
    obj: &mut Map<String, Value>,
    outer_patch: Map<String, Value>,
) {
    for (key, val) in outer_patch {
        if is_ref && key == "descendants" {
            merge_ref_descendants_field(obj, val);
            continue;
        }
        if val.is_null() {
            obj.remove(&key);
        } else {
            obj.insert(key, val);
        }
    }
}

fn merge_ref_descendants_field(obj: &mut Map<String, Value>, incoming: Value) {
    match incoming {
        Value::Null => {
            obj.remove("descendants");
        }
        Value::Object(patch_desc) => {
            let existing = obj
                .entry("descendants".to_owned())
                .or_insert_with(|| Value::Object(Map::new()));
            if !existing.is_object() {
                *existing = Value::Object(Map::new());
            }
            let Some(existing_map) = existing.as_object_mut() else {
                return;
            };
            for (child_id, child_val) in patch_desc {
                match child_val {
                    Value::Null => {
                        existing_map.remove(&child_id);
                    }
                    Value::Object(child_fields) => {
                        let slot = existing_map
                            .entry(child_id)
                            .or_insert_with(|| Value::Object(Map::new()));
                        if !slot.is_object() {
                            *slot = Value::Object(Map::new());
                        }
                        if let Some(slot_obj) = slot.as_object_mut() {
                            for (field_key, field_val) in child_fields {
                                if field_val.is_null() {
                                    slot_obj.remove(&field_key);
                                } else {
                                    slot_obj.insert(field_key, field_val);
                                }
                            }
                        }
                    }
                    other => {
                        existing_map.insert(child_id, other);
                    }
                }
            }
        }
        other => {
            obj.insert("descendants".to_owned(), other);
        }
    }
}
