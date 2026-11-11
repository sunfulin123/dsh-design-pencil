//! Conservative, read-only hints for repeated sibling component structures.

use std::collections::{BTreeMap, BTreeSet};

use jian_ops_schema::node::PenNode;
use op_editor_core::{EditorState, PenNodeExt};
use serde_json::{json, Value};

const MAX_CANDIDATE_NODES: usize = 64;
const MAX_EXAMPLES: usize = 8;

#[derive(Default)]
struct Group<'a> {
    nodes: Vec<&'a PenNode>,
    styles: BTreeSet<String>,
}

pub(crate) fn observe(state: &EditorState, scope: Option<&BTreeSet<String>>) -> Vec<Value> {
    let mut candidates = Vec::new();
    let registered: BTreeSet<&str> = state
        .components
        .components
        .iter()
        .map(|item| item.id.as_str())
        .collect();
    for root in state.active_children() {
        visit(root, &registered, scope, &mut candidates);
    }
    candidates
}

fn visit(
    node: &PenNode,
    registered: &BTreeSet<&str>,
    scope: Option<&BTreeSet<String>>,
    out: &mut Vec<Value>,
) {
    if node.base().visible == Some(false)
        || matches!(node, PenNode::Ref(_))
        || registered.contains(node.id_str())
        || matches!(node, PenNode::Frame(frame) if frame.reusable == Some(true))
    {
        return;
    }
    let Some(children) = node.children() else {
        return;
    };
    let mut groups: BTreeMap<String, Group<'_>> = BTreeMap::new();
    for child in children {
        if scope.is_some_and(|ids| !ids.contains(child.id_str())) || !eligible(child, registered) {
            continue;
        }
        let mut budget = MAX_CANDIDATE_NODES;
        if !bounded_subtree(child, &mut budget) {
            continue;
        }
        if let Ok(mut value) = serde_json::to_value(child) {
            let key = structure(&value).to_string();
            normalize(&mut value, true);
            let group = groups.entry(key).or_default();
            group.nodes.push(child);
            group.styles.insert(value.to_string());
        }
    }
    for group in groups.values().filter(|group| group.nodes.len() >= 2) {
        let ids: Vec<_> = group
            .nodes
            .iter()
            .take(MAX_EXAMPLES)
            .map(|child| child.id_str())
            .collect();
        out.push(json!({
            "parentId": node.id_str(), "nodeIds": ids, "count": group.nodes.len(),
            "styleVariantCount": group.styles.len(), "examplesTruncated": group.nodes.len() > MAX_EXAMPLES,
            "reason": "Sibling containers share a small authored structure and layout; styles, content, icons and prototype reactions may differ.",
            "suggestion": "Review semantics, content, state, interactions and overrides before choosing a reusable master and linked instances. Preserve local differences; do not automatically replace nodes."
        }));
    }
    for child in children {
        visit(child, registered, scope, out);
    }
}

fn eligible(node: &PenNode, registered: &BTreeSet<&str>) -> bool {
    node.base().visible != Some(false)
        && matches!(node, PenNode::Frame(_) | PenNode::Group(_))
        && !matches!(node, PenNode::Frame(frame) if frame.reusable == Some(true))
        && !registered.contains(node.id_str())
        && node.children().is_some_and(|children| {
            children.len() >= 2
                || (!children.is_empty()
                    && node.base().role.as_deref().is_some_and(|role| {
                        matches!(
                            role.to_ascii_lowercase().as_str(),
                            "button" | "icon-button" | "link" | "nav-link" | "nav link"
                        )
                    }))
        })
}

fn structure(value: &Value) -> Value {
    let Some(node) = value.as_object() else {
        return Value::Null;
    };
    let mut out = serde_json::Map::new();
    for key in [
        "type", "role", "width", "height", "layout", "gap", "padding",
    ] {
        if let Some(value) = node.get(key) {
            out.insert(key.to_string(), value.clone());
        }
    }
    if let Some(children) = node.get("children").and_then(Value::as_array) {
        out.insert(
            "children".into(),
            Value::Array(children.iter().map(structure).collect()),
        );
    }
    Value::Object(out)
}

fn bounded_subtree(node: &PenNode, remaining: &mut usize) -> bool {
    if *remaining == 0
        || matches!(node, PenNode::Ref(_))
        || matches!(node, PenNode::Frame(frame) if frame.reusable == Some(true))
    {
        return false;
    }
    *remaining -= 1;
    node.children()
        .into_iter()
        .flatten()
        .all(|child| bounded_subtree(child, remaining))
}

fn normalize(value: &mut Value, root: bool) {
    match value {
        Value::Object(object) => {
            for key in ["id", "name", "explain", "reactions"] {
                object.remove(key);
            }
            if object.get("type").and_then(Value::as_str) == Some("text")
                && object.get("content").is_some_and(Value::is_string)
            {
                object.remove("content");
            }
            if root {
                object.remove("x");
                object.remove("y");
            }
            if let Some(children) = object.get_mut("children") {
                normalize(children, false);
            }
        }
        Value::Array(values) => {
            for child in values {
                normalize(child, false);
            }
        }
        _ => {}
    }
}
