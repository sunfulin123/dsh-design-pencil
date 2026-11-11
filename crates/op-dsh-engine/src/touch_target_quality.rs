//! Report undersized interactive frames using resolved layout rather than authored widths.

use std::collections::{BTreeMap, BTreeSet};

use jian_ops_schema::node::{
    container::{ContainerProps, Padding},
    PenNode,
};
use jian_ops_schema::prototype::TriggerType;
use jian_ops_schema::sizing::{SizingBehavior, SizingKeyword};
use op_editor_core::{EditorState, PenNodeExt};
use op_mcp::{McpTool, ToolOutcome};
use serde_json::{json, Value};

const MIN_TARGET: f64 = 44.0;

struct Target {
    container: Option<ContainerProps>,
    name: Option<String>,
    role: String,
    parent_id: Option<String>,
    component_id: Option<String>,
}

pub(crate) fn check(
    state: &EditorState,
    scope: Option<&BTreeSet<String>>,
) -> Result<Vec<Value>, String> {
    let mut targets = BTreeMap::new();
    let document_nodes = op_editor_core::component_behaviour::document_nodes(&state.doc);
    for root in state.active_children() {
        collect_targets(root, None, scope, &document_nodes, &mut targets);
    }
    if targets.is_empty() {
        return Ok(Vec::new());
    }
    let args = BTreeMap::from([("maxDepth".to_string(), "128".to_string())]);
    let layout = match op_mcp::snapshot_layout_snapshot(state).call(&args) {
        ToolOutcome::OkJson(value) => serde_json::from_str::<Value>(&value)
            .map_err(|_| "Unable to parse the touch-target layout snapshot".to_string())?,
        ToolOutcome::Err(_, message) => {
            return Err(format!("Unable to inspect touch targets: {message}"))
        }
        _ => return Err("Unable to inspect touch targets: unexpected layout response".into()),
    };
    let mut findings = Vec::new();
    inspect_layout(&layout["layout"], &targets, &mut findings);
    findings.sort_by(|a, b| {
        let smallest = |value: &Value| {
            value["width"]
                .as_f64()
                .unwrap_or(f64::INFINITY)
                .min(value["height"].as_f64().unwrap_or(f64::INFINITY))
        };
        smallest(a)
            .total_cmp(&smallest(b))
            .then_with(|| a["nodeId"].as_str().cmp(&b["nodeId"].as_str()))
    });
    Ok(findings)
}

fn collect_targets(
    node: &PenNode,
    parent_id: Option<&str>,
    scope: Option<&BTreeSet<String>>,
    document_nodes: &BTreeMap<String, &PenNode>,
    targets: &mut BTreeMap<String, Target>,
) {
    let base = node.base();
    if base.visible == Some(false) {
        return;
    }
    let master = match node {
        PenNode::Ref(reference) => document_nodes.get(&reference.target).copied(),
        _ => None,
    };
    let mut role = base
        .role
        .as_ref()
        .or_else(|| master.and_then(|node| node.base().role.as_ref()))
        .map(String::as_str)
        .unwrap_or("")
        .trim()
        .to_ascii_lowercase();
    let click_trigger = base
        .reactions
        .as_ref()
        .or_else(|| master.and_then(|node| node.base().reactions.as_ref()))
        .is_some_and(|reactions| {
            reactions.iter().any(|reaction| {
                !reaction.actions.is_empty()
                    && reaction.trigger.as_ref().is_some_and(|trigger| {
                        matches!(trigger.kind, TriggerType::OnClick | TriggerType::OnPress)
                    })
            })
        });
    let named_role = matches!(
        role.as_str(),
        "button" | "icon-button" | "nav-link" | "nav link" | "link"
    );
    if !named_role && click_trigger {
        role = "prototype click".into();
    }
    if (named_role || click_trigger) && scope.is_none_or(|ids| ids.contains(&base.id)) {
        let (container, component_id) = match node {
            PenNode::Frame(frame) => (Some(frame.container.clone()), None),
            PenNode::Rectangle(rectangle) => (Some(rectangle.container.clone()), None),
            PenNode::Ref(reference) if master.is_some() => (None, Some(reference.target.clone())),
            _ => (None, None),
        };
        if container.is_some() || component_id.is_some() {
            targets.insert(
                base.id.clone(),
                Target {
                    container,
                    name: base.name.clone(),
                    role,
                    component_id,
                    parent_id: parent_id.map(str::to_owned),
                },
            );
        }
    }
    for child in node.children().into_iter().flatten() {
        collect_targets(child, Some(&base.id), scope, document_nodes, targets);
    }
}

fn inspect_layout(value: &Value, targets: &BTreeMap<String, Target>, findings: &mut Vec<Value>) {
    let Some(nodes) = value.as_array() else {
        return;
    };
    for node in nodes {
        let id = node["id"].as_str().unwrap_or("");
        let width = node["width"].as_f64();
        let height = node["height"].as_f64();
        if let Some(target) = targets.get(id) {
            if let (Some(width), Some(height)) = (width, height) {
                let mut patch = serde_json::Map::new();
                if width.is_finite()
                    && height.is_finite()
                    && (width < MIN_TARGET || height < MIN_TARGET)
                {
                    if let Some(container) = &target.container {
                        size_patch(container, width, height, &mut patch);
                    }
                    let reason = if target.component_id.is_some() {
                        "Linked component target is smaller than 44px. Inspect this instance and its master; a shared master edit affects other instances. Verify the resulting layout."
                    } else {
                        "Interactive target is smaller than 44px; increase padding for fit_content or enlarge the available space. Verify the resulting layout."
                    };
                    findings.push(json!({"nodeId":id,"name":target.name,"role":target.role,
                        "parentId":target.parent_id,"componentId":target.component_id,"width":width,"height":height,
                        "priority":if width.min(height) < 24.0 {"high"} else {"review"},
                        "patchAvailable":!patch.is_empty(),
                        "reason":reason,
                        "suggestedPatch":patch}));
                }
            }
        }
        inspect_layout(&node["children"], targets, findings);
    }
}

fn size_patch(
    container: &ContainerProps,
    width: f64,
    height: f64,
    patch: &mut serde_json::Map<String, Value>,
) {
    let mut padding = match container.padding.as_ref() {
        Some(Padding::Uniform(value)) => Some([*value; 4]),
        Some(Padding::XY([vertical, horizontal])) => {
            Some([*vertical, *horizontal, *vertical, *horizontal])
        }
        Some(Padding::LtrB(values)) => Some(*values),
        Some(Padding::Expression(_)) => None,
        None => Some([0.0; 4]),
    };
    let mut padding_changed = false;
    for (size, authored, dimension, indices) in [
        (width, &container.width, "width", (1, 3)),
        (height, &container.height, "height", (0, 2)),
    ] {
        if size >= MIN_TARGET {
            continue;
        }
        match authored {
            Some(SizingBehavior::Keyword(SizingKeyword::FitContent)) | None => {
                let extra = ((MIN_TARGET - size) / 2.0).ceil();
                if let Some(values) = &mut padding {
                    values[indices.0] += extra;
                    values[indices.1] += extra;
                    padding_changed = true;
                }
            }
            Some(SizingBehavior::Number(_)) => {
                patch.insert(dimension.into(), json!(44));
            }
            _ => {}
        }
    }
    if padding_changed {
        patch.insert("padding".into(), json!(padding));
    }
}
