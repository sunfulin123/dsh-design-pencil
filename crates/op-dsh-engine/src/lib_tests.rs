//! End-to-end engine checks: a tool call goes through the catalog, the
//! command applies, and rejections carry an actionable reason.

use super::*;

fn engine_with_row() -> DesignEngine {
    let mut engine = DesignEngine::new();
    let rect = |id: &str, x: f64| json!({"id": id, "type": "rectangle", "name": id, "x": x, "y": 0.0, "width": 100.0, "height": 70.0});
    let doc = json!({
        "version": "1.0.0",
        "children": [
            rect("a", 0.0),
            rect("b", 150.0),
            rect("c", 320.0),
            {"id": "f", "type": "frame", "name": "f", "x": 600.0, "y": 0.0, "width": 200.0, "height": 200.0,
             "children": [rect("d", 10.0)]}
        ]
    });
    engine.load_document(&doc.to_string()).ok().unwrap();
    engine
}

fn node_x(engine: &DesignEngine, id: &str) -> f64 {
    let doc: Value = serde_json::from_str(&engine.document_json().ok().unwrap()).unwrap();
    fn find(nodes: &Value, id: &str) -> Option<f64> {
        nodes.as_array()?.iter().find_map(|n| {
            if n["id"] == id {
                n["x"].as_f64()
            } else {
                find(&n["children"], id)
            }
        })
    }
    find(&doc["children"], id).unwrap()
}

#[test]
fn document_recovery_retains_history_and_exposes_native_revision_anchors() {
    let mut engine = engine_with_row();
    engine
        .call_tool(
            "arrange_nodes",
            r#"{"mode":"tidy","nodeIds":["a","b","c"]}"#,
        )
        .unwrap();
    let mut recovered: Value = serde_json::from_str(&engine.document_json().unwrap()).unwrap();
    recovered["children"][0]["x"] = json!(999.0);
    engine.restore_document(&recovered.to_string()).unwrap();
    assert_eq!(node_x(&engine, "a"), 999.0);
    let history: Value = serde_json::from_str(&engine.document_history_json()).unwrap();
    assert_eq!(history["past"].as_array().unwrap().len(), 2);
    engine.call_tool("undo", "{}").unwrap();
    assert_eq!(node_x(&engine, "a"), 0.0);
    assert_eq!(node_x(&engine, "b"), 160.0);
    engine.call_tool("undo", "{}").unwrap();
    assert_eq!(node_x(&engine, "b"), 150.0);
    engine.call_tool("redo", "{}").unwrap();
    engine.call_tool("redo", "{}").unwrap();
    assert_eq!(node_x(&engine, "a"), 999.0);
}

#[test]
fn draft_factories_explicitly_require_the_persistent_host_without_editing() {
    let mut engine = engine_with_row();
    let before = engine.document_json().unwrap();
    for name in [
        "list_drafts",
        "create_draft",
        "restore_draft",
        "delete_draft",
    ] {
        let reply: Value = serde_json::from_str(&engine.call_tool(name, "{}").unwrap()).unwrap();
        assert_eq!(reply["isError"], true);
        assert!(reply["content"][0]["text"]
            .as_str()
            .unwrap()
            .contains("requires the live Node host"));
        assert_eq!(engine.document_json().unwrap(), before);
    }
}

#[test]
fn arrange_nodes_tool_moves_nodes_and_is_listed() {
    let mut engine = engine_with_row();
    let reply = engine
        .call_tool(
            "arrange_nodes",
            r#"{"mode":"tidy","nodeIds":["a","b","c"]}"#,
        )
        .ok()
        .unwrap();
    assert!(reply.contains(r#""isError":false"#), "{reply}");
    assert_eq!(node_x(&engine, "b"), 160.0);
    assert!(engine.tools_json().contains(r#""name":"arrange_nodes""#));
}

#[test]
fn arrange_nodes_tool_reports_why_it_refused() {
    let mut engine = engine_with_row();
    let reply = engine
        .call_tool(
            "synapse_arrange_nodes",
            r#"{"mode":"pack_h","nodeIds":["a","d"]}"#,
        )
        .ok()
        .unwrap();
    assert!(reply.contains("nodes must share one parent"), "{reply}");
}

#[test]
fn lint_fixes_use_reported_ids_and_undo_as_one_step() {
    let mut engine = DesignEngine::new();
    engine
        .load_document(
            r##"{"version":"0.8.5","children":[
        {"type":"frame","id":"root","width":200,"height":100,"children":[
        {"type":"text","id":"t","content":"Hello","fontSize":16,"rotation":22}
        ]}]}"##,
        )
        .unwrap();
    let before = engine.document_json().unwrap();
    let report: Value = serde_json::from_str(
        &engine
            .call_tool("lint_document", r#"{"rules":["unexpected-rotation"]}"#)
            .unwrap(),
    )
    .unwrap();
    let issues = report["structuredContent"]["issues"].as_array().unwrap();
    assert_eq!(issues.len(), 1);
    assert!(issues[0]["issueId"].is_string());
    let args = json!({"issueIds":[issues[0]["issueId"].clone()]});
    let fixed: Value = serde_json::from_str(
        &engine
            .call_tool("fix_lint_issues", &args.to_string())
            .unwrap(),
    )
    .unwrap();
    assert_eq!(fixed["isError"], false, "{fixed}");
    let doc: Value = serde_json::from_str(&engine.document_json().unwrap()).unwrap();
    assert_eq!(
        doc["children"][0]["children"][0]["rotation"].as_f64(),
        Some(0.0)
    );
    engine.call_tool("undo", "{}").unwrap();
    assert_eq!(engine.document_json().unwrap(), before);
}

#[test]
fn tool_search_discovers_registered_design_capabilities() {
    let mut engine = DesignEngine::new();
    let result: serde_json::Value = serde_json::from_str(
        &engine
            .call_tool("tool_search", r#"{"query":"component","limit":30}"#)
            .unwrap(),
    )
    .unwrap();
    assert_eq!(result["isError"], false, "{result}");
    let schemas = result["structuredContent"]["tools"].as_array().unwrap();
    assert!(schemas
        .iter()
        .any(|schema| schema["name"] == "set_instance_properties"));
    assert!(schemas.iter().any(|schema| schema["name"] == "create_slot"));
}

#[test]
fn evaluates_formula_variables_and_rejects_unknown_modes() {
    let mut engine = DesignEngine::new();
    engine.load_document(r#"{"version":"0.8.5","children":[],"themes":{"Mode":["Light","Dark"]},
        "variables":{"space":{"type":"number","value":8},"double":{"type":"number","value":"calc($space * 2)"}}}"#).unwrap();
    let result: serde_json::Value = serde_json::from_str(
        &engine
            .call_tool("evaluate_variable", r#"{"id":"double"}"#)
            .unwrap(),
    )
    .unwrap();
    assert_eq!(result["isError"], false, "{result}");
    assert_eq!(result["structuredContent"]["value"].as_f64(), Some(16.0));
    let result: serde_json::Value = serde_json::from_str(
        &engine
            .call_tool(
                "evaluate_variable",
                r#"{"id":"double","modes":{"Mode":"Missing"}}"#,
            )
            .unwrap(),
    )
    .unwrap();
    assert_eq!(result["isError"], true);
}

#[test]
fn viewport_schema_uses_the_backend_zoom_parameter() {
    let mut engine = DesignEngine::new();
    let tools: Vec<Value> = serde_json::from_str(&engine.tools_json()).unwrap();
    let tool = tools
        .iter()
        .find(|tool| tool["name"] == "set_viewport")
        .unwrap();
    assert!(tool["inputSchema"]["properties"]["zoom_percent"].is_object());
    assert!(tool["inputSchema"]["properties"]["zoom"].is_null());
    let result: Value = serde_json::from_str(
        &engine
            .call_tool(
                "set_viewport",
                r#"{"pan_x":"123","pan_y":"-45","zoom_percent":"125"}"#,
            )
            .unwrap(),
    )
    .unwrap();
    assert_eq!(result["isError"], false, "{result}");
    let view: Value =
        serde_json::from_str(&engine.call_tool("get_viewport", "{}").unwrap()).unwrap();
    assert_eq!(view["structuredContent"]["zoom_percent"], "125");
}

#[test]
fn document_fingerprint_tracks_every_document_json_change() {
    let mut engine = engine_with_row();
    let calls: [(&str, Value, bool); 8] = [
        ("get_node", json!({"node_id": "a"}), false),
        ("list_pages", json!({}), false),
        ("snapshot_layout", json!({"maxDepth": 3}), false),
        (
            "update_node",
            json!({"nodeId": "a", "data": {"x": 40}}),
            true,
        ),
        (
            "set_viewport",
            json!({"pan_x": "12", "pan_y": "4", "zoom_percent": "150"}),
            true,
        ),
        ("undo", json!({}), true),
        ("redo", json!({}), true),
        ("add_page", json!({"name": "Second"}), true),
    ];
    for (name, args, mutates) in calls {
        let before_fp = engine.document_fingerprint();
        let before_doc = engine.document_json().ok().unwrap();
        let reply = engine.call_tool(name, &args.to_string()).ok().unwrap();
        assert!(!reply.contains("\"isError\":true"), "{name}: {reply}");
        let after_doc = engine.document_json().ok().unwrap();
        assert_eq!(before_doc != after_doc, mutates, "{name} document change");
        assert_eq!(
            before_fp != engine.document_fingerprint(),
            mutates,
            "{name} fingerprint must move exactly when document_json does"
        );
    }
}

#[test]
fn editor_meta_json_matches_the_embedded_document_meta() {
    let mut engine = engine_with_row();
    engine
        .call_tool(
            "set_viewport",
            &json!({"pan_x": "30", "pan_y": "-8", "zoom_percent": "125"}).to_string(),
        )
        .ok()
        .unwrap();
    let doc: Value = serde_json::from_str(&engine.document_json().ok().unwrap()).unwrap();
    let meta: Value = serde_json::from_str(&engine.editor_meta_json()).unwrap();
    assert_eq!(doc["editorMeta"], meta);
}

#[test]
fn design_quality_is_scoped_and_bounded() {
    let mut engine = DesignEngine::new();
    let empties: Vec<Value> = (0..40)
        .map(|i| json!({"id": format!("e{i}"), "type": "path"}))
        .collect();
    let doc = json!({"version": "1.0.0", "children": [
        {"id": "board", "type": "frame", "x": 0, "y": 0, "width": 400, "height": 400, "children": empties},
        {"id": "other", "type": "frame", "x": 600, "y": 0, "width": 100, "height": 100,
         "children": [{"id": "lonely", "type": "path"}]}
    ]});
    engine.load_document(&doc.to_string()).ok().unwrap();
    let reply: Value =
        serde_json::from_str(&engine.call_tool("get_design_quality", "{}").ok().unwrap()).unwrap();
    let value = &reply["structuredContent"];
    assert_eq!(value["counts"]["iconIssues"], 41);
    assert_eq!(value["iconIssues"].as_array().unwrap().len(), 30);
    assert_eq!(value["truncated"], true);
    let scoped: Value = serde_json::from_str(
        &engine
            .call_tool(
                "get_design_quality",
                &json!({"rootId": "other", "limit": 5}).to_string(),
            )
            .ok()
            .unwrap(),
    )
    .unwrap();
    assert_eq!(scoped["structuredContent"]["counts"]["iconIssues"], 1);
    assert_eq!(scoped["structuredContent"]["truncated"], false);
}

fn two_page_engine() -> DesignEngine {
    let mut engine = DesignEngine::new();
    let doc = json!({"version": "1.0.0", "children": [], "pages": [
        {"id": "p1", "name": "One", "children": [{"id": "a", "type": "rectangle", "x": 0, "y": 0, "width": 10, "height": 10}]},
        {"id": "p2", "name": "Two", "children": [{"id": "b", "type": "rectangle", "x": 0, "y": 0, "width": 10, "height": 10}]}
    ]});
    engine.load_document(&doc.to_string()).ok().unwrap();
    let _ = engine.take_document_changes();
    engine
}

fn changes(engine: &mut DesignEngine) -> Value {
    serde_json::from_str(&engine.take_document_changes()).unwrap()
}

#[test]
fn document_changes_name_the_edited_pages_only() {
    let mut engine = two_page_engine();
    assert_eq!(changes(&mut engine), json!({"full": false, "pages": []}));
    engine
        .call_tool(
            "update_node",
            &json!({"nodeId": "b", "data": {"width": 40}, "pageId": "p2"}).to_string(),
        )
        .ok()
        .unwrap();
    assert_eq!(
        changes(&mut engine),
        json!({"full": false, "pages": ["p2"]})
    );
    assert_eq!(
        changes(&mut engine),
        json!({"full": false, "pages": []}),
        "reports reset"
    );
    engine
        .call_tool(
            "update_node",
            &json!({"nodeId": "a", "data": {"width": 40}, "pageId": "p1"}).to_string(),
        )
        .ok()
        .unwrap();
    engine
        .call_tool(
            "update_node",
            &json!({"nodeId": "b", "data": {"height": 40}, "pageId": "p2"}).to_string(),
        )
        .ok()
        .unwrap();
    assert_eq!(
        changes(&mut engine),
        json!({"full": false, "pages": ["p1", "p2"]}),
        "changes accumulate"
    );
}

#[test]
fn untracked_or_structural_changes_require_a_full_resync() {
    let mut engine = two_page_engine();
    engine
        .call_tool(
            "update_node",
            &json!({"nodeId": "a", "data": {"width": 40}, "pageId": "p1"}).to_string(),
        )
        .ok()
        .unwrap();
    let _ = changes(&mut engine);
    engine.call_tool("undo", "{}").ok().unwrap();
    assert_eq!(
        changes(&mut engine),
        json!({"full": false, "pages": ["p1"]}),
        "undo is a tracked command"
    );
    engine
        .call_tool("add_page", &json!({"name": "Three"}).to_string())
        .ok()
        .unwrap();
    assert_eq!(changes(&mut engine)["full"], true, "the page list changed");
    let doc = engine.document_json().ok().unwrap();
    engine.restore_document(&doc).ok().unwrap();
    assert_eq!(changes(&mut engine)["full"], true, "document replacement");
}
