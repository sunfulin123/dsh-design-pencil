//! Detect content that is declared but cannot become visible: instance
//! overrides that miss every node of their component, instances whose
//! component is gone, and text that resolves to nothing.
//!
//! A gap produced by one of these is a missing-content defect, not spacing,
//! so every finding is an `Error`. None is auto-fixable: the intended copy or
//! override target has to be authored.

use std::collections::{BTreeMap, BTreeSet};

use jian_ops_schema::component::{ComponentDesign, ComponentPropertyKind};
use jian_ops_schema::node::{PenNode, TextContent, TextNode};
use jian_ops_schema::PenDocument;
use serde_json::{json, Value};

use crate::issue::{FixProperty, Issue, IssueCategory, IssueSeverity};
use crate::node_util::{children, is_node_visible, node_id};

/// Find instance overrides and text nodes under `root` that leave declared
/// content invisible. Component lookups use the whole `doc`.
pub fn detect_content_visibility(root: &PenNode, doc: &PenDocument) -> Vec<Issue> {
    let components = ComponentIndex::new(doc);
    let mut issues = Vec::new();
    let inherited_targets = BTreeSet::new();
    walk(root, &components, &inherited_targets, &mut issues);
    issues
}

struct ComponentIndex<'a> {
    nodes: BTreeMap<&'a str, &'a PenNode>,
}

impl<'a> ComponentIndex<'a> {
    fn new(doc: &'a PenDocument) -> Self {
        let mut nodes = BTreeMap::new();
        for page in doc.pages.iter().flatten() {
            index_nodes(&page.children, &mut nodes);
        }
        index_nodes(&doc.children, &mut nodes);
        Self { nodes }
    }

    /// Ids a flat `descendants` override key may address: the component itself
    /// and its own authored subtree. `op_editor_core::ref_resolve::remap_ids`
    /// runs before nested `Ref` children expand, so inner nodes of a nested
    /// component are not reachable from an outer `Ref`'s flat `descendants` map.
    fn addressable_ids(&self, target: &'a str) -> Option<BTreeSet<&'a str>> {
        let component = *self.nodes.get(target)?;
        let mut ids = BTreeSet::new();
        let mut stack = vec![component];
        while let Some(node) = stack.pop() {
            ids.insert(node_id(node));
            stack.extend(children(node));
        }
        Some(ids)
    }

    fn component_design(&self, target: &'a str) -> Option<&'a ComponentDesign> {
        let component = *self.nodes.get(target)?;
        node_component_design(component)
    }
}

fn index_nodes<'a>(nodes: &'a [PenNode], out: &mut BTreeMap<&'a str, &'a PenNode>) {
    for node in nodes {
        out.entry(node_id(node)).or_insert(node);
        index_nodes(children(node), out);
    }
}

fn node_component_design(node: &PenNode) -> Option<&ComponentDesign> {
    match node {
        PenNode::Frame(n) => n.base.component_design.as_ref(),
        PenNode::Group(n) => n.base.component_design.as_ref(),
        PenNode::Rectangle(n) => n.base.component_design.as_ref(),
        _ => None,
    }
}

fn text_property_targets<'a>(
    node: &'a PenNode,
    inherited: &BTreeSet<&'a str>,
) -> Option<BTreeSet<&'a str>> {
    let design = node_component_design(node)?;
    let mut next = inherited.clone();
    let mut added = false;
    for prop in design.properties.values() {
        if prop.kind == ComponentPropertyKind::Text
            && prop.default.as_str().is_some_and(|s| !s.trim().is_empty())
        {
            next.insert(prop.target_id.as_str());
            added = true;
        }
    }
    added.then_some(next)
}

fn has_content_binding(text: &TextNode) -> bool {
    text.bindings
        .as_ref()
        .is_some_and(|bindings| bindings.contains_key("content"))
        || text
            .base
            .variable_bindings
            .as_ref()
            .is_some_and(|bindings| bindings.contains_key("content"))
}

fn walk<'a>(
    node: &'a PenNode,
    components: &ComponentIndex<'_>,
    property_text_targets: &BTreeSet<&'a str>,
    issues: &mut Vec<Issue>,
) {
    if !is_node_visible(node) {
        return;
    }
    let owned_targets = text_property_targets(node, property_text_targets);
    let active_targets = owned_targets.as_ref().unwrap_or(property_text_targets);
    match node {
        PenNode::Ref(instance) => check_instance(
            node_id(node),
            instance.target.as_str(),
            instance.descendants.as_ref(),
            instance.base.component_values.as_ref(),
            components,
            issues,
        ),
        PenNode::Text(text)
            if is_blank(&text.content)
                && !active_targets.contains(node_id(node))
                && !has_content_binding(text) =>
        {
            issues.push(issue(
                node_id(node),
                json!(""),
                "Text node has no content, so nothing renders where copy is expected; \
                 author the intended text or remove the node."
                    .to_string(),
            ));
        }
        _ => {}
    }
    for child in children(node) {
        walk(child, components, active_targets, issues);
    }
}

fn check_instance(
    instance_id: &str,
    target: &str,
    overrides: Option<&BTreeMap<String, Value>>,
    component_values: Option<&BTreeMap<String, Value>>,
    components: &ComponentIndex<'_>,
    issues: &mut Vec<Issue>,
) {
    let Some(addressable) = components.addressable_ids(target) else {
        issues.push(issue(
            instance_id,
            json!(target),
            format!(
                "Instance references component \"{target}\", which does not exist; \
                 the instance renders nothing."
            ),
        ));
        return;
    };
    for (key, value) in overrides.into_iter().flatten() {
        // Path-style keys address nested instances; their resolution is not
        // modelled here, so they are left to rendered-content checks.
        if key.contains('/') {
            continue;
        }
        if !addressable.contains(key.as_str()) {
            issues.push(issue(
                instance_id,
                json!(key),
                format!(
                    "Instance override \"{key}\" matches no node of component \"{target}\", \
                     so the override is ignored and the component's own content shows \
                     instead; read the component's direct descendant ids and use one of them."
                ),
            ));
        } else if overrides_blank_content(value) {
            issues.push(issue(
                instance_id,
                json!(key),
                format!(
                    "Instance override \"{key}\" sets empty text content, so nothing \
                     renders where copy is expected."
                ),
            ));
        }
    }
    if let Some(values) = component_values {
        let design = components.component_design(target);
        for (name, value) in values {
            match design.and_then(|d| d.properties.get(name)) {
                None => issues.push(issue(
                    instance_id,
                    json!(name),
                    format!(
                        "Instance property \"{name}\" matches no property of component \
                         \"{target}\", so the value is ignored."
                    ),
                )),
                Some(prop)
                    if prop.kind == ComponentPropertyKind::Text
                        && value.as_str().is_some_and(|s| s.trim().is_empty()) =>
                {
                    issues.push(issue(
                        instance_id,
                        json!(name),
                        format!(
                            "Instance property \"{name}\" sets empty text content, so nothing \
                             renders where copy is expected."
                        ),
                    ));
                }
                Some(_) => {}
            }
        }
    }
}

fn overrides_blank_content(value: &Value) -> bool {
    match value.get("content") {
        Some(Value::String(text)) => text.trim().is_empty(),
        Some(Value::Array(segments)) => segments.iter().all(|segment| {
            segment
                .get("text")
                .and_then(Value::as_str)
                .is_none_or(|text| text.trim().is_empty())
        }),
        _ => false,
    }
}

fn is_blank(content: &TextContent) -> bool {
    match content {
        TextContent::Plain(text) => text.trim().is_empty(),
        TextContent::Styled(segments) => segments
            .iter()
            .all(|segment| segment.text.trim().is_empty()),
    }
}

fn issue(node_id: &str, current_value: Value, reason: String) -> Issue {
    Issue {
        node_id: node_id.to_string(),
        category: IssueCategory::ContentNotVisible,
        severity: IssueSeverity::Error,
        property: FixProperty::None,
        current_value,
        suggested_value: Value::Null,
        reason,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn doc(value: Value) -> PenDocument {
        serde_json::from_value(value).expect("fixture must deserialize as PenDocument")
    }

    fn channel_doc(overrides: Value) -> PenDocument {
        doc(json!({
            "version": "1.0.0",
            "children": [
                {"type": "frame", "id": "row", "name": "Channel Row", "reusable": true,
                 "children": [
                    {"type": "text", "id": "label", "content": "Channel"},
                    {"type": "frame", "id": "badge", "children": [
                        {"type": "text", "id": "count", "content": "0"}
                    ]}
                 ]},
                {"type": "frame", "id": "screen", "children": [
                    {"type": "ref", "id": "general", "ref": "row", "descendants": overrides}
                ]}
            ]
        }))
    }

    fn reasons(document: &PenDocument) -> Vec<String> {
        detect_content_visibility(&document.children[1], document)
            .into_iter()
            .map(|found| {
                assert_eq!(found.severity, IssueSeverity::Error);
                assert!(!found.can_auto_fix());
                format!("{}: {}", found.node_id, found.reason)
            })
            .collect()
    }

    #[test]
    fn overrides_that_hit_component_nodes_are_clean() {
        let document = channel_doc(json!({
            "label": {"content": "general"},
            "count": {"content": "12"},
            "row": {"opacity": 0.5}
        }));
        assert!(reasons(&document).is_empty());
    }

    #[test]
    fn override_key_missing_from_component_is_reported() {
        let document = channel_doc(json!({"title": {"content": "general"}}));
        let found = reasons(&document);
        assert_eq!(found.len(), 1, "{found:?}");
        assert!(found[0].starts_with("general: Instance override \"title\""));
    }

    #[test]
    fn override_that_blanks_text_is_reported() {
        let document = channel_doc(json!({"label": {"content": "  "}}));
        let found = reasons(&document);
        assert_eq!(found.len(), 1, "{found:?}");
        assert!(found[0].contains("sets empty text content"));
    }

    #[test]
    fn instance_of_missing_component_is_reported() {
        let document = doc(json!({
            "version": "1.0.0",
            "children": [
                {"type": "frame", "id": "other"},
                {"type": "frame", "id": "screen", "children": [
                    {"type": "ref", "id": "orphan", "ref": "gone"}
                ]}
            ]
        }));
        let found = reasons(&document);
        assert_eq!(found.len(), 1, "{found:?}");
        assert!(found[0].contains("does not exist"));
    }

    #[test]
    fn blank_text_is_reported_and_real_text_is_not() {
        let document = doc(json!({
            "version": "1.0.0",
            "children": [
                {"type": "frame", "id": "other"},
                {"type": "frame", "id": "screen", "children": [
                    {"type": "text", "id": "empty", "content": ""},
                    {"type": "text", "id": "filled", "content": "general"}
                ]}
            ]
        }));
        let found = reasons(&document);
        assert_eq!(found.len(), 1, "{found:?}");
        assert!(found[0].starts_with("empty: Text node has no content"));
    }

    #[test]
    fn override_targeting_inner_node_of_nested_component_is_reported() {
        // `op_editor_core::ref_resolve::remap_ids` runs before nested `Ref`s expand,
        // so a flat override targeting `"pill-text"` on `"item"` is silently ignored
        // at render time and must be flagged.
        let document = doc(json!({
            "version": "1.0.0",
            "children": [
                {"type": "frame", "id": "pill", "reusable": true, "children": [
                    {"type": "text", "id": "pill-text", "content": "New"}
                ]},
                {"type": "frame", "id": "screen", "children": [
                    {"type": "ref", "id": "item", "ref": "card",
                     "descendants": {"pill-text": {"content": "Beta"}}}
                ]},
                {"type": "frame", "id": "card", "reusable": true, "children": [
                    {"type": "ref", "id": "card-pill", "ref": "pill"}
                ]}
            ]
        }));
        let found = reasons(&document);
        assert_eq!(found.len(), 1, "{found:?}");
        assert!(found[0].contains("matches no node of component \"card\""));
    }

    #[test]
    fn hidden_nodes_and_bound_or_property_backed_text_are_clean_while_blank_values_report() {
        let document = doc(json!({
            "version": "1.0.0",
            "children": [
                {
                    "type": "frame", "id": "master", "reusable": true,
                    "componentDesign": {
                        "properties": {
                            "title": {"kind": "text", "targetId": "master-txt", "default": "General"}
                        }
                    },
                    "children": [
                        {"type": "text", "id": "master-txt", "content": ""}
                    ]
                },
                {
                    "type": "frame", "id": "screen",
                    "children": [
                        {"type": "text", "id": "hidden-empty", "content": "", "visible": false},
                        {"type": "text", "id": "bound-empty", "content": "", "variableBindings": {"content": "$--title"}},
                        {"type": "ref", "id": "ok-inst", "ref": "master", "componentValues": {"title": "Support"}},
                        {"type": "ref", "id": "blank-inst", "ref": "master", "componentValues": {"title": "  "}},
                        {"type": "ref", "id": "unknown-prop", "ref": "master", "componentValues": {"subtitle": "Hi"}}
                    ]
                }
            ]
        }));
        assert!(
            detect_content_visibility(&document.children[0], &document).is_empty(),
            "master template text backed by a non-empty component property default must not block"
        );
        let found = reasons(&document);
        assert_eq!(found.len(), 2, "{found:?}");
        assert!(found[0].starts_with("blank-inst: Instance property \"title\" sets empty text"));
        assert!(found[1]
            .starts_with("unknown-prop: Instance property \"subtitle\" matches no property"));
    }
}
