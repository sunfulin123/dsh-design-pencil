//! Root auto-placement, in-batch `Ref` target/descendant resolution, and
//! virtual instance-child (`inst__child` / `inst/child`) update routing for
//! `batch_design`.

use std::collections::BTreeMap;

use jian_ops_schema::node::PenNode;
use jian_ops_schema::sizing::SizingBehavior;
use op_editor_core::{NodeId, PenNodeExt};
use serde_json::{Map, Value};

use super::batch_program::{ProgramCtx, Result};
use super::batch_program_error::ProgramError;
use super::batch_program_resolve::{lookup_id, resolve_ref};
use super::EditorCommand;

const SCREEN_GAP_X: f64 = 120.0;
const REUSABLE_GAP_X: f64 = 60.0;
const REUSABLE_ROW_GAP_Y: f64 = 160.0;
const DEFAULT_REUSABLE_Y: f64 = -320.0;
const FALLBACK_FRAME_W: f64 = 1200.0;
const FALLBACK_FRAME_H: f64 = 240.0;

fn estimated_size(node: &PenNode) -> (f64, f64) {
    match node {
        PenNode::Frame(f) => {
            let w = match f.container.width.as_ref() {
                Some(SizingBehavior::Number(n)) if *n > 0.0 => *n,
                _ => {
                    if f.reusable == Some(true) {
                        320.0
                    } else {
                        FALLBACK_FRAME_W
                    }
                }
            };
            let h = match f.container.height.as_ref() {
                Some(SizingBehavior::Number(n)) if *n > 0.0 => *n,
                _ => FALLBACK_FRAME_H,
            };
            (w, h)
        }
        _ => (
            node.width_px().unwrap_or(320.0),
            node.height_px().unwrap_or(FALLBACK_FRAME_H),
        ),
    }
}

/// Auto-place a top-level `Frame` when neither `x` nor `y` was authored:
/// screens flow left-to-right with `120px` spacing; reusable masters sit on a
/// dedicated row above the screens so components never collide with artboards.
pub(crate) fn auto_place_root_frame(node: &mut PenNode, ctx: &ProgramCtx) {
    if !matches!(node, PenNode::Frame(_)) || node.base().x.is_some() || node.base().y.is_some() {
        return;
    }
    let live_roots: Vec<&PenNode> = ctx
        .sim
        .active_children()
        .iter()
        .filter(|r| {
            r.base().visible != Some(false)
                && !ctx
                    .replaceable_empty_root_ids
                    .iter()
                    .any(|id| id == r.id_str())
        })
        .collect();

    let is_reusable = matches!(node, PenNode::Frame(f) if f.reusable == Some(true));
    if is_reusable {
        let masters: Vec<&PenNode> = live_roots
            .iter()
            .copied()
            .filter(|r| matches!(r, PenNode::Frame(f) if f.reusable == Some(true)))
            .collect();
        if let Some(first) = masters.first() {
            let max_right = masters
                .iter()
                .map(|r| r.base().x.unwrap_or(0.0) + estimated_size(r).0)
                .fold(f64::NEG_INFINITY, f64::max);
            node.base_mut().x = Some(max_right + REUSABLE_GAP_X);
            node.base_mut().y = Some(first.base().y.unwrap_or(DEFAULT_REUSABLE_Y));
            return;
        }
        let screens: Vec<&PenNode> = live_roots
            .iter()
            .copied()
            .filter(|r| !matches!(r, PenNode::Frame(f) if f.reusable == Some(true)))
            .collect();
        if !screens.is_empty() {
            let min_x = screens
                .iter()
                .map(|r| r.base().x.unwrap_or(0.0))
                .fold(f64::INFINITY, f64::min);
            let min_y = screens
                .iter()
                .map(|r| r.base().y.unwrap_or(0.0))
                .fold(f64::INFINITY, f64::min);
            let (_, node_h) = estimated_size(node);
            node.base_mut().x = Some(min_x);
            node.base_mut().y = Some(min_y - node_h - REUSABLE_ROW_GAP_Y);
        } else {
            node.base_mut().x = Some(0.0);
            node.base_mut().y = Some(DEFAULT_REUSABLE_Y);
        }
        return;
    }

    let screens: Vec<&PenNode> = live_roots
        .iter()
        .copied()
        .filter(|r| !matches!(r, PenNode::Frame(f) if f.reusable == Some(true)))
        .collect();
    if let Some(first) = screens.first() {
        let max_right = screens
            .iter()
            .map(|r| r.base().x.unwrap_or(0.0) + estimated_size(r).0)
            .fold(f64::NEG_INFINITY, f64::max);
        node.base_mut().x = Some(max_right + SCREEN_GAP_X);
        node.base_mut().y = Some(first.base().y.unwrap_or(0.0));
        return;
    }

    let masters: Vec<&PenNode> = live_roots
        .iter()
        .copied()
        .filter(|r| matches!(r, PenNode::Frame(f) if f.reusable == Some(true)))
        .collect();
    if masters.is_empty() {
        node.base_mut().x = Some(0.0);
        node.base_mut().y = Some(0.0);
    } else {
        let max_bottom = masters
            .iter()
            .map(|r| r.base().y.unwrap_or(DEFAULT_REUSABLE_Y) + estimated_size(r).1)
            .fold(f64::NEG_INFINITY, f64::max);
        node.base_mut().x = Some(0.0);
        node.base_mut().y = Some(if max_bottom <= -40.0 {
            0.0
        } else {
            max_bottom + REUSABLE_ROW_GAP_Y
        });
    }
}

fn contains_child_id(node: &PenNode, target_id: &str) -> bool {
    let Some(children) = node.children() else {
        return false;
    };
    children
        .iter()
        .any(|c| c.id_str() == target_id || contains_child_id(c, target_id))
}

/// Resolve in-batch `Ref.target` bindings/aliases and authored `descendants`
/// child keys before remapping and emitting an inserted subtree.
pub(crate) fn resolve_inserted_refs(node: &mut PenNode, ctx: &ProgramCtx) {
    if let PenNode::Ref(reference) = node {
        let resolved_target = lookup_id(&resolve_ref(&reference.target, &ctx.bindings), &ctx.alias);
        reference.target = resolved_target;
        let master = op_editor_core::walkers::find_node(
            ctx.sim.active_children(),
            &NodeId::new(&reference.target),
        );
        if let Some(descendants) = reference.descendants.as_mut() {
            let old = std::mem::take(descendants);
            let mut remapped = BTreeMap::new();
            for (key, val) in old {
                let mapped_key = match master {
                    Some(comp) if contains_child_id(comp, &key) => key,
                    Some(comp) => match ctx.alias.get(&key) {
                        Some(aliased) if contains_child_id(comp, aliased) => aliased.clone(),
                        _ => key,
                    },
                    None => ctx.alias.get(&key).cloned().unwrap_or(key),
                };
                remapped.insert(mapped_key, val);
            }
            *descendants = remapped;
        }
    }
    if let Some(children) = node.children_mut() {
        for child in children {
            resolve_inserted_refs(child, ctx);
        }
    }
}

/// Resolve `U("inst__child", patch)` or `U("inst/child", patch)` (including
/// QuickJS binding prefixes like `"b3__label"` and aliased child ids) into a
/// `PatchNodeData` command targeting the virtual `refId__childId` anchor.
pub(crate) fn try_instance_child_update(
    path: &str,
    value: &Value,
    ctx: &ProgramCtx,
) -> Option<Result<EditorCommand>> {
    let candidates: Vec<(String, String)> = if path.contains("__") {
        path.as_bytes()
            .windows(2)
            .enumerate()
            .filter_map(|(idx, pair)| (pair == b"__").then_some(idx))
            .map(|idx| (path[..idx].to_string(), path[idx + 2..].to_string()))
            .collect()
    } else if let Some((left, right)) = path.split_once('/') {
        if right.contains('/') {
            Vec::new()
        } else {
            vec![(left.to_string(), right.to_string())]
        }
    } else {
        Vec::new()
    };

    for (raw_inst, raw_child) in candidates {
        let inst_id = lookup_id(&resolve_ref(&raw_inst, &ctx.bindings), &ctx.alias);
        for child_candidate in [raw_child.clone(), lookup_id(&raw_child, &ctx.alias)] {
            let anchor = NodeId::new(format!("{inst_id}__{child_candidate}"));
            if op_editor_core::split_instance_child_anchor(&anchor, &ctx.sim.doc).is_some() {
                let Some(obj) = value.as_object() else {
                    return Some(Err(ProgramError::Syntax(
                        "U() update JSON must be an object".into(),
                    )));
                };
                if obj.is_empty() {
                    return Some(Err(ProgramError::Rejected(
                        "U() must set at least one supported field".into(),
                    )));
                }
                let mut patch = Value::Object(Map::from_iter(
                    obj.iter().map(|(k, v)| (k.clone(), v.clone())),
                ));
                super::batch_design::normalize_patch_shape(&mut patch);
                return Some(Ok(EditorCommand::PatchNodeData {
                    node_id: anchor,
                    patch_json: patch.to_string(),
                    page_id: ctx.page_id.clone(),
                }));
            }
        }
    }
    None
}

pub(crate) fn delete_superseded_draft(
    binding: &str,
    parent: Option<&str>,
    node: &PenNode,
    ctx: &mut ProgramCtx,
) {
    let Some(new_name) = node.base().name.as_deref().filter(|n| !n.is_empty()) else {
        return;
    };
    let Some(prev_id) = ctx.bindings.get(binding).cloned() else {
        return;
    };
    let parent_id = parent.map(|p| lookup_id(p, &ctx.alias));
    let Some((prev, prev_parent)) =
        find_node_with_parent(ctx.sim.active_children(), &prev_id, None)
    else {
        return;
    };
    let same_shape = std::mem::discriminant(prev) == std::mem::discriminant(node)
        && prev.base().name.as_deref() == Some(new_name);
    if !same_shape || prev_parent != parent_id.as_deref() {
        return;
    }
    let del = EditorCommand::DeleteNode {
        node_id: NodeId::new(&prev_id),
        page_id: ctx.page_id.clone(),
    };
    if ctx.sim.apply(del.clone()) {
        ctx.commands.push(del);
    }
}

fn find_node_with_parent<'a>(
    nodes: &'a [PenNode],
    id: &str,
    parent: Option<&'a str>,
) -> Option<(&'a PenNode, Option<&'a str>)> {
    for n in nodes {
        if n.id_str() == id {
            return Some((n, parent));
        }
        if let Some(children) = n.children() {
            if let Some(hit) = find_node_with_parent(children, id, Some(n.id_str())) {
                return Some(hit);
            }
        }
    }
    None
}
