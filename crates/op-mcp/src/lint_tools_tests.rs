use std::collections::BTreeMap;

use crate::{lint_document_snapshot, McpTool, ToolErrorCode, ToolOutcome};
use jian_ops_schema::node::PenNode;
use jian_ops_schema::page::PenPage;
use serde_json::json;

fn node(value: serde_json::Value) -> PenNode {
    serde_json::from_value(value).expect("fixture must deserialize as PenNode")
}

fn issue_node_ids(value: &serde_json::Value) -> Vec<String> {
    value["issues"]
        .as_array()
        .expect("issues must be an array")
        .iter()
        .map(|issue| issue["nodeId"].as_str().unwrap().to_string())
        .collect()
}

#[test]
fn lint_document_returns_issue_array() {
    let root = node(json!({
        "type": "frame",
        "id": "root",
        "children": [
            {"type": "path", "id": "empty"}
        ]
    }));
    let state = crate::test_fixtures::state_with(vec![root]);
    let tool = lint_document_snapshot(&state);

    match tool.call(&BTreeMap::new()) {
        ToolOutcome::OkJson(json) => {
            let value: serde_json::Value = serde_json::from_str(&json).unwrap();
            assert_eq!(value["count"], 1);
            assert_eq!(issue_node_ids(&value), vec!["empty"]);
        }
        other => panic!("expected OkJson, got {other:?}"),
    }
}

#[test]
fn lint_document_filters_to_node_subtree() {
    let root = node(json!({
        "type": "frame",
        "id": "root",
        "children": [
            {
                "type": "frame",
                "id": "left",
                "children": [{"type": "path", "id": "empty-left"}]
            },
            {
                "type": "frame",
                "id": "right",
                "children": [{"type": "path", "id": "empty-right"}]
            }
        ]
    }));
    let state = crate::test_fixtures::state_with(vec![root]);
    let tool = lint_document_snapshot(&state);
    let mut args = BTreeMap::new();
    args.insert("nodeId".into(), "left".into());

    match tool.call(&args) {
        ToolOutcome::OkJson(json) => {
            let value: serde_json::Value = serde_json::from_str(&json).unwrap();
            assert_eq!(value["count"], 1);
            assert_eq!(issue_node_ids(&value), vec!["empty-left"]);
        }
        other => panic!("expected OkJson, got {other:?}"),
    }
}

#[test]
fn lint_document_filters_to_component_master_on_non_active_page() {
    let master = node(json!({
        "type": "frame",
        "id": "button-master",
        "children": [
            {"type": "path", "id": "empty-path"}
        ]
    }));
    let mut state = crate::test_fixtures::state_with(vec![]);
    state.doc.pages = Some(vec![
        PenPage {
            id: "p1".into(),
            theme: None,
            name: "Page 1".into(),
            children: Vec::new(),
            background_color: None,
            state: None,
            lifecycle: None,
        },
        PenPage {
            id: "components".into(),
            theme: None,
            name: "Components".into(),
            children: vec![master],
            background_color: None,
            state: None,
            lifecycle: None,
        },
    ]);
    state.ui.active_page_index = 0;
    let tool = lint_document_snapshot(&state);
    let mut args = BTreeMap::new();
    args.insert("nodeId".into(), "button-master".into());

    match tool.call(&args) {
        ToolOutcome::OkJson(json) => {
            let value: serde_json::Value = serde_json::from_str(&json).unwrap();
            assert_eq!(value["count"], 1);
            assert_eq!(issue_node_ids(&value), vec!["empty-path"]);
        }
        other => panic!("expected OkJson, got {other:?}"),
    }
}

#[test]
fn lint_document_rejects_unknown_node_filter() {
    let state = crate::test_fixtures::state_with(vec![]);
    let tool = lint_document_snapshot(&state);
    let mut args = BTreeMap::new();
    args.insert("nodeId".into(), "missing".into());

    match tool.call(&args) {
        ToolOutcome::Err(ToolErrorCode::InvalidArgument, msg) => {
            assert!(msg.contains("nodeId not found"));
        }
        other => panic!("expected InvalidArgument, got {other:?}"),
    }
}

fn many_issue_state(count: usize) -> op_editor_core::EditorState {
    let children: Vec<serde_json::Value> = (0..count)
        .map(|index| json!({"type": "path", "id": format!("empty-{index}")}))
        .collect();
    let board = node(json!({"type": "frame", "id": "board", "children": children}));
    let other = node(
        json!({"type": "frame", "id": "other", "children": [{"type": "path", "id": "elsewhere"}]}),
    );
    crate::test_fixtures::state_with(vec![board, other])
}

fn call_json(tool: &dyn McpTool, args: &[(&str, &str)]) -> serde_json::Value {
    let args: BTreeMap<String, String> = args
        .iter()
        .map(|(k, v)| (k.to_string(), v.to_string()))
        .collect();
    match tool.call(&args) {
        ToolOutcome::OkJson(json) => serde_json::from_str(&json).unwrap(),
        other => panic!("expected OkJson, got {other:?}"),
    }
}

#[test]
fn lint_document_pages_with_a_summary_and_cursor() {
    let state = many_issue_state(70);
    let tool = lint_document_snapshot(&state);
    let first = call_json(&tool, &[]);
    assert_eq!(first["count"], 71);
    assert_eq!(first["returned"], 50);
    assert_eq!(first["issues"].as_array().unwrap().len(), 50);
    let category_total: u64 = first["byCategory"]
        .as_object()
        .unwrap()
        .values()
        .map(|v| v.as_u64().unwrap())
        .sum();
    assert_eq!(category_total, 71);
    let cursor = first["nextCursor"]
        .as_str()
        .expect("more issues remain")
        .to_string();
    let second = call_json(&tool, &[("cursor", &cursor)]);
    assert_eq!(second["returned"], 21);
    assert!(second["nextCursor"].is_null());
    let mut ids = issue_node_ids(&first);
    ids.extend(issue_node_ids(&second));
    ids.sort();
    ids.dedup();
    assert_eq!(ids.len(), 71, "pages neither overlap nor skip issues");
}

#[test]
fn lint_document_summary_only_and_scoped_limit() {
    let state = many_issue_state(5);
    let tool = lint_document_snapshot(&state);
    let summary = call_json(&tool, &[("summaryOnly", "true")]);
    assert_eq!(summary["count"], 6);
    assert_eq!(summary["issues"].as_array().unwrap().len(), 0);
    let scoped = call_json(&tool, &[("rootId", "board"), ("limit", "2")]);
    assert_eq!(scoped["count"], 5, "only the board subtree is linted");
    assert_eq!(scoped["returned"], 2);
    assert!(issue_node_ids(&scoped)
        .iter()
        .all(|id| id.starts_with("empty-")));
}

#[test]
fn lint_document_rejects_stale_cursors_and_bad_limits() {
    let state = many_issue_state(60);
    let tool = lint_document_snapshot(&state);
    let cursor = call_json(&tool, &[])["nextCursor"]
        .as_str()
        .unwrap()
        .to_string();
    let mut edited = state.clone();
    edited.mark_document_changed();
    let fresh = lint_document_snapshot(&edited);
    let mut args = BTreeMap::new();
    args.insert("cursor".to_string(), cursor);
    assert!(matches!(
        fresh.call(&args),
        ToolOutcome::Err(ToolErrorCode::InvalidArgument, _)
    ));
    let mut args = BTreeMap::new();
    args.insert("limit".to_string(), "0".to_string());
    assert!(matches!(
        tool.call(&args),
        ToolOutcome::Err(ToolErrorCode::InvalidArgument, _)
    ));
    let mut args = BTreeMap::new();
    args.insert("severity".to_string(), "fatal".to_string());
    assert!(matches!(
        tool.call(&args),
        ToolOutcome::Err(ToolErrorCode::InvalidArgument, _)
    ));
}
