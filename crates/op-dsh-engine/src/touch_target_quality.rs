//! Report undersized interactive frames using resolved layout rather than authored widths.

use std::collections::{BTreeMap, BTreeSet};

use jian_ops_schema::node::{
    container::{ContainerProps, Padding},
    PenNode,
};
use jian_ops_schema::sizing::{SizingBehavior, SizingKeyword};
use op_editor_core::{EditorState, PenNodeExt};
use op_mcp::{McpTool, ToolOutcome};
use serde_json::{json, Value};

const MIN_TARGET: f64 = 44.0;

pub(crate) fn check(
    state: &EditorState,
    scope: Option<&BTreeSet<String>>,
) -> Result<Vec<Value>, String> {
    let mut targets = BTreeMap::new();
    for root in state.active_children() {
        collect_targets(root, scope, &mut targets);
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
    Ok(findings)
}

fn collect_targets(
    node: &PenNode,
    scope: Option<&BTreeSet<String>>,
    targets: &mut BTreeMap<String, ContainerProps>,
) {
    let base = node.base();
    if base.visible == Some(false) {
        return;
    }
    let role = base
        .role
        .as_deref()
        .unwrap_or("")
        .trim()
        .to_ascii_lowercase();
    if matches!(
        role.as_str(),
        "button" | "icon-button" | "nav-link" | "nav link" | "link"
    ) && scope.is_none_or(|ids| ids.contains(&base.id))
    {
        let container = match node {
            PenNode::Frame(frame) => Some(&frame.container),
            PenNode::Rectangle(rectangle) => Some(&rectangle.container),
            _ => None,
        };
        if let Some(container) = container {
            targets.insert(base.id.clone(), container.clone());
        }
    }
    for child in node.children().into_iter().flatten() {
        collect_targets(child, scope, targets);
    }
}

fn inspect_layout(
    value: &Value,
    targets: &BTreeMap<String, ContainerProps>,
    findings: &mut Vec<Value>,
) {
    let Some(nodes) = value.as_array() else {
        return;
    };
    for node in nodes {
        let id = node["id"].as_str().unwrap_or("");
        let width = node["width"].as_f64();
        let height = node["height"].as_f64();
        if let Some(container) = targets.get(id) {
            if let (Some(width), Some(height)) = (width, height) {
                let mut patch = serde_json::Map::new();
                if width.is_finite()
                    && height.is_finite()
                    && (width < MIN_TARGET || height < MIN_TARGET)
                {
                    size_patch(container, width, height, &mut patch);
                    let reason = "Interactive target is smaller than 44px; increase padding for fit_content or enlarge the available space. Verify the resulting layout.";
                    findings.push(json!({"nodeId":id,"width":width,"height":height,
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
