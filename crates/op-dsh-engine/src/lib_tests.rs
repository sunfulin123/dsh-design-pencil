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
fn unlabelled_peer_lint_is_review_only_but_manual_correction_is_undoable() {
    let mut engine = DesignEngine::new();
    let item = |id: &str, radius: i32| {
        json!({"type":"frame","id":id,
        "layout":"horizontal","height":44,"cornerRadius":radius,"children":[
            {"type":"text","id":format!("{id}-icon"),"content":"•"},
            {"type":"text","id":format!("{id}-label"),"content":id}
        ]})
    };
    engine
        .load_document(
            &json!({"version":"1.0","children":[
                {"type":"frame","id":"root","children":[item("a",4),item("b",4),item("c",8)]}
            ]})
            .to_string(),
        )
        .unwrap();
    let before = engine.document_json().unwrap();
    let lint: Value = serde_json::from_str(
        &engine
            .call_tool(
                "lint_document",
                r#"{"rules":["sibling-inconsistency","mixed-sibling-corner-radius"]}"#,
            )
            .unwrap(),
    )
    .unwrap();
    let candidate = lint["structuredContent"]["issues"]
        .as_array()
        .unwrap()
        .iter()
        .find(|issue| issue["nodeId"] == "c" && issue["property"] == "cornerRadius")
        .unwrap();
    let fix: Value = serde_json::from_str(
        &engine
            .call_tool(
                "fix_lint_issues",
                &json!({"issueIds":[candidate["issueId"]]}).to_string(),
            )
            .unwrap(),
    )
    .unwrap();
    assert_eq!(
        fix["structuredContent"]["fixed"], 0,
        "heuristic findings require review"
    );
    assert_eq!(engine.document_json().unwrap(), before);
    let update: Value = serde_json::from_str(
        &engine
            .call_tool("update_node", r#"{"nodeId":"c","data":{"cornerRadius":4}}"#)
            .unwrap(),
    )
    .unwrap();
    assert_eq!(update["isError"], false, "{update}");
    let after: Value = serde_json::from_str(
        &engine
            .call_tool(
                "lint_document",
                r#"{"rules":["sibling-inconsistency","mixed-sibling-corner-radius"]}"#,
            )
            .unwrap(),
    )
    .unwrap();
    assert!(!after["structuredContent"]["issues"]
        .as_array()
        .unwrap()
        .iter()
        .any(|issue| issue["nodeId"] == "c"));
    engine.call_tool("undo", "{}").unwrap();
    assert_eq!(engine.document_json().unwrap(), before);
}

#[test]
fn labelled_peer_lint_requires_review_before_restyling() {
    let mut engine = DesignEngine::new();
    engine
        .load_document(
            r##"{"version":"1.0","children":[{"type":"frame","id":"root","children":[
        {"type":"frame","id":"a","role":"button","cornerRadius":4},
        {"type":"frame","id":"b","role":"button","cornerRadius":4},
        {"type":"frame","id":"c","role":"button","cornerRadius":8}
    ]}]}"##,
        )
        .unwrap();
    let before = engine.document_json().unwrap();
    let lint: Value = serde_json::from_str(
        &engine
            .call_tool("lint_document", r#"{"rules":["sibling-inconsistency"]}"#)
            .unwrap(),
    )
    .unwrap();
    let issue = &lint["structuredContent"]["issues"][0];
    assert_eq!(issue["severity"], "warning");
    assert_eq!(issue["autoFixEligible"], false);
    let fix: Value = serde_json::from_str(
        &engine
            .call_tool(
                "fix_lint_issues",
                &json!({"issueIds":[issue["issueId"]]}).to_string(),
            )
            .unwrap(),
    )
    .unwrap();
    assert_eq!(
        fix["structuredContent"]["fixed"], 0,
        "a role alone does not prove the visual variant is accidental"
    );
    assert_eq!(engine.document_json().unwrap(), before);
}

#[test]
fn advisory_peer_padding_does_not_hide_independent_edge_padding_fix() {
    let mut engine = DesignEngine::new();
    let section = |id: &str, padding: i32| {
        json!({
            "type":"frame", "id":id, "layout":"vertical", "width":"fill_container",
            "height":100, "padding":padding,
            "children":[{"type":"text","id":format!("{id}-label"),"content":id}]
        })
    };
    let document = json!({"version":"0.8.5","children":[{
        "type":"frame","id":"screen","width":390,"height":844,"layout":"vertical",
        "children":[section("a",24),section("b",24),section("c",0)]
    }]});
    engine.load_document(&document.to_string()).unwrap();
    let before = engine.document_json().unwrap();
    let lint: Value = serde_json::from_str(
        &engine
            .call_tool("lint_document", r#"{"rootId":"screen"}"#)
            .unwrap(),
    )
    .unwrap();
    let issues = lint["structuredContent"]["issues"].as_array().unwrap();
    assert!(issues.iter().any(|i| i["nodeId"] == "c"
        && i["category"] == "mixed-sibling-padding"
        && i["autoFixEligible"] == false));
    assert!(
        issues.iter().any(|i| i["nodeId"] == "c"
            && i["category"] == "edge-section-padding"
            && i["autoFixEligible"] == true),
        "an advisory must not hide an independent actionable finding: {lint}"
    );
    let filtered: Value = serde_json::from_str(
        &engine
            .call_tool(
                "lint_document",
                r#"{"rootId":"screen","rules":["edge-section-padding"]}"#,
            )
            .unwrap(),
    )
    .unwrap();
    assert_eq!(filtered["structuredContent"]["count"], 1);
    let fixed: Value = serde_json::from_str(
        &engine
            .call_tool("fix_lint_issues", r#"{"all":true}"#)
            .unwrap(),
    )
    .unwrap();
    assert_eq!(fixed["structuredContent"]["fixed"], 1);
    let after: Value = serde_json::from_str(&engine.document_json().unwrap()).unwrap();
    assert_eq!(
        after["children"][0]["children"][2]["padding"],
        json!([0.0, 24.0, 0.0, 24.0])
    );
    engine.call_tool("undo", "{}").unwrap();
    assert_eq!(engine.document_json().unwrap(), before);
}

#[test]
fn independent_advisories_for_the_same_property_remain_discoverable() {
    let mut engine = DesignEngine::new();
    let section = |id: &str, padding: i32| {
        json!({
            "type":"frame", "id":id, "layout":"vertical", "width":"fill_container",
            "height":100, "padding":padding,
            "children":[{"type":"text","id":format!("{id}-label"),"content":id}]
        })
    };
    let document = json!({"version":"0.8.5","children":[{
        "type":"frame","id":"screen","width":390,"height":844,"layout":"vertical","padding":24,
        "children":[section("a",8),section("b",8),section("c",16)]
    }]});
    engine.load_document(&document.to_string()).unwrap();
    let lint: Value = serde_json::from_str(
        &engine
            .call_tool("lint_document", r#"{"rootId":"screen"}"#)
            .unwrap(),
    )
    .unwrap();
    let issues = lint["structuredContent"]["issues"].as_array().unwrap();
    for category in ["mixed-sibling-padding", "stacked-horizontal-padding"] {
        assert!(
            issues.iter().any(|i| i["nodeId"] == "c"
                && i["category"] == category
                && i["autoFixEligible"] == false),
            "missing independent {category}: {lint}"
        );
    }
    let filtered: Value = serde_json::from_str(
        &engine
            .call_tool(
                "lint_document",
                r#"{"rootId":"screen","rules":["stacked-horizontal-padding"]}"#,
            )
            .unwrap(),
    )
    .unwrap();
    assert!(filtered["structuredContent"]["issues"]
        .as_array()
        .unwrap()
        .iter()
        .any(|i| i["nodeId"] == "c"));
}

#[test]
fn independent_shader_faults_survive_same_property_advisories_with_unique_ids() {
    let mut engine = DesignEngine::new();
    let document = json!({"version":"0.8.5","children":[{
        "type":"frame","id":"board","width":1000,"height":1000,"children":[{
            "type":"frame","id":"panel","width":200,"height":200,"fill":[
                {"type":"solid","color":"#ff0000"},
                {"type":"shader","preset":"unknown","uniforms":{"alpha":[1],"beta":[2]}}
            ]
        }]
    }]});
    engine.load_document(&document.to_string()).unwrap();
    let lint: Value = serde_json::from_str(
        &engine
            .call_tool("lint_document", r#"{"rootId":"board","limit":100}"#)
            .unwrap(),
    )
    .unwrap();
    let issues = lint["structuredContent"]["issues"].as_array().unwrap();
    assert!(issues
        .iter()
        .any(|i| i["nodeId"] == "panel" && i["category"] == "empty-filled-panel"));
    let shaders: Vec<_> = issues
        .iter()
        .filter(|i| i["nodeId"] == "panel" && i["category"] == "shader-invalid")
        .collect();
    assert_eq!(
        shaders.len(),
        3,
        "independent shader faults must not disappear: {lint}"
    );
    let ids: std::collections::BTreeSet<_> = shaders
        .iter()
        .map(|i| i["issueId"].as_str().unwrap())
        .collect();
    assert_eq!(
        ids.len(),
        shaders.len(),
        "each distinct shader fault needs a unique issue ID"
    );
    let alpha = shaders
        .iter()
        .find(|i| i["reason"].as_str().unwrap().contains("`alpha`"))
        .unwrap();
    let selected: Value = serde_json::from_str(
        &engine
            .call_tool(
                "fix_lint_issues",
                &json!({"issueIds":[alpha["issueId"]]}).to_string(),
            )
            .unwrap(),
    )
    .unwrap();
    assert_eq!(
        selected["structuredContent"]["remaining"]
            .as_array()
            .unwrap()
            .len(),
        1,
        "an issue ID must not select other shader faults"
    );
    let filtered: Value = serde_json::from_str(
        &engine
            .call_tool(
                "lint_document",
                r#"{"rootId":"board","rules":["shader-invalid"]}"#,
            )
            .unwrap(),
    )
    .unwrap();
    assert_eq!(filtered["structuredContent"]["count"], 3);
}

#[test]
fn peer_radius_findings_keep_different_comparison_groups_and_suggestions() {
    let mut engine = DesignEngine::new();
    let mut children: Vec<_> = [4, 4, 4, 8, 8].into_iter().enumerate().map(|(index, radius)| {
        json!({"type":"frame","id":format!("button{index}"),"role":"button","cornerRadius":radius})
    }).collect();
    children.extend((0..12).map(
        |index| json!({"type":"frame","id":format!("tag{index}"),"role":"tag","cornerRadius":16}),
    ));
    engine.load_document(&json!({"version":"0.8.5","children":[{"type":"frame","id":"board","children":children}]}).to_string()).unwrap();
    let lint: Value = serde_json::from_str(
        &engine
            .call_tool("lint_document", r#"{"rootId":"board","limit":100}"#)
            .unwrap(),
    )
    .unwrap();
    let issues = lint["structuredContent"]["issues"].as_array().unwrap();
    assert!(issues.iter().any(|i| i["nodeId"] == "button3"
        && i["category"] == "sibling-inconsistency"
        && i["severity"] == "info"
        && i["suggestedValue"] == 16));
    assert!(
        issues.iter().any(|i| i["nodeId"] == "button3"
            && i["category"] == "mixed-sibling-corner-radius"
            && i["severity"] == "warning"
            && i["suggestedValue"] == 4),
        "same-role warning must not be hidden by a different loose comparison: {lint}"
    );
    let filtered: Value = serde_json::from_str(
        &engine
            .call_tool(
                "lint_document",
                r#"{"rootId":"board","rules":["mixed-sibling-corner-radius"],"limit":100}"#,
            )
            .unwrap(),
    )
    .unwrap();
    assert!(filtered["structuredContent"]["issues"]
        .as_array()
        .unwrap()
        .iter()
        .any(|i| i["nodeId"] == "button3"));
}

#[test]
fn null_suggestions_are_not_eligible_or_allowed_to_block_real_repairs() {
    let mut engine = DesignEngine::new();
    let bar = |id: &str, x: i32, height: i32, locked: bool| {
        json!({
            "type":"rectangle","id":id,"x":x,"y":500,"width":80,"height":height,
            "locked":locked,"fill":[{"type":"solid","color":"#ff0000"}]
        })
    };
    let document = json!({"version":"0.8.5","children":[{
        "type":"frame","id":"chart","width":1920,"height":1080,"children":[
            bar("a",100,200,true),bar("b",250,250,false),bar("c",400,300,false),
            {"type":"text","id":"title","content":"Chart","fontSize":16,"height":40}
        ]
    }]});
    engine.load_document(&document.to_string()).unwrap();
    let before = engine.document_json().unwrap();
    let lint: Value = serde_json::from_str(
        &engine
            .call_tool("lint_document", r#"{"rules":["top-anchored-bars"]}"#)
            .unwrap(),
    )
    .unwrap();
    let issues = lint["structuredContent"]["issues"].as_array().unwrap();
    assert_eq!(issues.len(), 3);
    assert!(
        issues
            .iter()
            .all(|i| i["suggestedValue"].is_null() && i["autoFixEligible"] == false),
        "a missing numeric target cannot be auto-fixed: {lint}"
    );
    let fixed: Value = serde_json::from_str(
        &engine
            .call_tool("fix_lint_issues", r#"{"all":true}"#)
            .unwrap(),
    )
    .unwrap();
    assert_eq!(fixed["isError"], false, "{fixed}");
    assert_eq!(fixed["structuredContent"]["fixed"], 1);
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

#[test]
fn design_quality_distinguishes_coverage_and_exposes_actionable_findings() {
    let mut engine = DesignEngine::new();
    engine
        .load_document(
            &json!({"version":"1.0.0","children":[
                {"type":"frame","id":"board","width":200,"height":120,"children":[
                    {"type":"path","id":"empty"},
                    {"type":"frame","id":"button","role":"button","width":20,"height":20}
                ]}
            ]})
            .to_string(),
        )
        .unwrap();
    let before = engine.document_json().unwrap();
    let response: Value = serde_json::from_str(
        &engine
            .call_tool("get_design_quality", r#"{"rootId":"board"}"#)
            .unwrap(),
    )
    .unwrap();
    let quality = &response["structuredContent"];
    assert_eq!(quality["coverage"]["icons"]["status"], "checked");
    assert_eq!(quality["coverage"]["variables"]["status"], "indeterminate");
    assert_eq!(quality["coverage"]["imageSlots"]["status"], "unsupported");
    assert_eq!(quality["coverage"]["contrast"]["status"], "indeterminate");
    assert!(quality["coverage"]["variables"]["reason"]
        .as_str()
        .is_some());
    let findings = quality["findings"].as_array().unwrap();
    let icon = findings
        .iter()
        .find(|issue| issue["nodeId"] == "empty")
        .unwrap();
    assert_eq!(icon["category"], "icons");
    assert!(icon["evidence"].as_str().is_some());
    assert!(icon["severity"].is_string());
    assert!(icon["suggestion"].is_string());
    assert_eq!(engine.document_json().unwrap(), before);
}

#[test]
fn design_quality_reports_unresolved_typed_variable_bindings_in_scope() {
    let mut engine = DesignEngine::new();
    engine.load_document(&json!({"version":"1.0.0", "variables": {
        "body-size":{"type":"number","value":16}
    }, "children":[
        {"type":"frame","id":"board","width":400,"height":200,"children":[
            {"type":"text","id":"good","content":"Valid","variableBindings":{"fontSize":"$body-size"}},
            {"type":"text","id":"bad","content":"Missing","variableBindings":{"fontSize":"$missing-size"}}
        ]},
        {"type":"text","id":"outside","content":"Other","variableBindings":{"fontSize":"$other-missing"}}
    ]}).to_string()).unwrap();
    let before = engine.document_json().unwrap();
    let response: Value = serde_json::from_str(
        &engine
            .call_tool("get_design_quality", r#"{"rootId":"board"}"#)
            .unwrap(),
    )
    .unwrap();
    let quality = &response["structuredContent"];
    let issues = quality["variableIssues"].as_array().unwrap();
    assert_eq!(issues.len(), 1);
    assert_eq!(issues[0]["nodeId"], "bad");
    assert_eq!(issues[0]["property"], "fontSize");
    assert_eq!(issues[0]["reference"], "$missing-size");
    assert!(quality["findings"]
        .as_array()
        .unwrap()
        .iter()
        .any(|issue| issue["nodeId"] == "bad" && issue["category"] == "variables"));
    assert_eq!(engine.document_json().unwrap(), before);
}

#[test]
fn design_quality_distinguishes_unbound_values_overrides_and_uncertainty() {
    let mut engine = DesignEngine::new();
    engine.load_document(&json!({"version":"1.0.0", "variables": {
        "body-size":{"type":"number","value":16},
        "space-small":{"type":"number","value":8},
        "brand":{"type":"color","value":"#6633CC"}
    }, "children":[{"type":"frame","id":"board","width":400,"height":200,
        "gap":8,"fill":"#6633CC","children":[
            {"type":"text","id":"same","content":"Matches","fontSize":16},
            {"type":"text","id":"unknown","content":"Unknown","fontSize":17},
            {"type":"text","id":"bound","content":"Bound","fontSize":16,"variableBindings":{"fontSize":"$body-size"}},
            {"type":"ref","id":"instance","ref":"component","descendants":{"label":{"fontSize":14}}}
        ]}]}).to_string()).unwrap();
    let before = engine.document_json().unwrap();
    let reply: Value = serde_json::from_str(
        &engine
            .call_tool("get_design_quality", r#"{"rootId":"board"}"#)
            .unwrap(),
    )
    .unwrap();
    let items = reply["structuredContent"]["tokenObservations"]
        .as_array()
        .unwrap();
    let has = |node: &str, property: &str, status: &str| {
        items.iter().any(|item| {
            item["nodeId"] == node && item["property"] == property && item["status"] == status
        })
    };
    assert!(has("board", "gap", "unbound-match"));
    assert!(has("board", "fill.0.color", "unbound-match"));
    assert!(has("same", "fontSize", "unbound-match"));
    assert!(has("unknown", "fontSize", "indeterminate"));
    assert!(has("instance", "descendants.label", "local-override"));
    assert!(!items
        .iter()
        .any(|item| item["nodeId"] == "bound" && item["property"] == "fontSize"));
    assert_eq!(engine.document_json().unwrap(), before);
}

#[test]
fn design_quality_token_matches_use_the_inherited_variable_mode() {
    let mut engine = DesignEngine::new();
    engine
        .load_document(
            &json!({"version":"1.0.0", "themes":{"Mode":["Light","Dark"]},
            "variables":{"brand":{"type":"color","value":[
                {"value":"#111111","theme":{"Mode":"Light"}},
                {"value":"#eeeeee","theme":{"Mode":"Dark"}}
            ]}}, "children":[{"type":"frame","id":"dark","width":200,"height":100,
                "theme":{"Mode":"Dark"}, "children":[
                    {"type":"rectangle","id":"match","width":20,"height":20,"fill":"#EEEEEE"},
                    {"type":"rectangle","id":"other","width":20,"height":20,"fill":"#111111"}
                ]}]})
            .to_string(),
        )
        .unwrap();
    let reply: Value =
        serde_json::from_str(&engine.call_tool("get_design_quality", "{}").unwrap()).unwrap();
    let items = reply["structuredContent"]["tokenObservations"]
        .as_array()
        .unwrap();
    assert!(items
        .iter()
        .any(|item| item["nodeId"] == "match" && item["status"] == "unbound-match"));
    assert!(items
        .iter()
        .any(|item| item["nodeId"] == "other" && item["status"] == "indeterminate"));
}

#[test]
fn design_quality_reports_observation_truncation_separately_from_issues() {
    let mut engine = DesignEngine::new();
    engine
        .load_document(
            &json!({"version":"1.0.0", "children":[
                {"type":"frame","id":"board","width":400,"height":200,"children":[
                    {"type":"text","id":"first","content":"A","fontSize":16},
                    {"type":"text","id":"second","content":"B","fontSize":16}
                ]}
            ]})
            .to_string(),
        )
        .unwrap();
    let reply: Value = serde_json::from_str(
        &engine
            .call_tool("get_design_quality", r#"{"limit":1}"#)
            .unwrap(),
    )
    .unwrap();
    let quality = &reply["structuredContent"];
    assert_eq!(
        quality["truncated"], false,
        "non-issue observations must not imply missing diagnostics"
    );
    assert_eq!(quality["tokenObservationsTruncated"], true);
    assert_eq!(quality["tokenObservations"].as_array().unwrap().len(), 1);
    assert_eq!(quality["counts"]["tokenObservations"], 2);
}

#[test]
fn batch_design_catalog_distinguishes_flat_descriptors_from_editable_subtrees() {
    let schemas = tool_catalog::schemas();
    let batch = schemas
        .iter()
        .find(|item| item["name"] == "batch_design")
        .unwrap();
    let node_description = batch["inputSchema"]["properties"]["nodes_json"]["description"]
        .as_str()
        .unwrap();
    assert!(node_description.contains("flat"));
    assert!(node_description.contains("kind"));
    assert!(node_description.contains("insert_node"));
    assert!(batch["inputSchema"]["properties"]["script"]["description"]
        .as_str()
        .unwrap()
        .contains("I("));
}

#[test]
fn guidelines_catalog_requires_the_topic_its_runtime_requires() {
    let schemas = tool_catalog::schemas();
    let guidelines = schemas
        .iter()
        .find(|item| item["name"] == "get_guidelines")
        .unwrap();
    assert!(guidelines["inputSchema"]["required"]
        .as_array()
        .unwrap()
        .iter()
        .any(|entry| entry == "topic"));
    let mut engine = DesignEngine::new();
    let reply: Value = serde_json::from_str(
        &engine
            .call_tool("get_guidelines", r#"{"topic":"web-app"}"#)
            .unwrap(),
    )
    .unwrap();
    assert_eq!(reply["isError"], false, "{reply}");
}

#[test]
fn design_quality_checks_actual_touch_target_geometry_and_preserves_fit_content() {
    let mut engine = DesignEngine::new();
    engine.load_document(&json!({"version":"1.0.0","children":[{"type":"frame","id":"page",
        "width":800,"height":600,"layout":"vertical","children":[
            {"type":"frame","id":"short","role":"nav link","width":"fit_content","height":44,
             "layout":"horizontal","padding":[0,4],"children":[{"type":"text","id":"short-label","content":"i","fontSize":16}]},
            {"type":"frame","id":"wide","role":"nav link","width":44,"height":44,
             "layout":"horizontal","padding":[0,16],"children":[{"type":"text","id":"wide-label","content":"Menu","fontSize":16}]}
        ]}]}).to_string()).unwrap();
    let quality = |engine: &mut DesignEngine| -> Value {
        serde_json::from_str::<Value>(&engine.call_tool("get_design_quality", "{}").unwrap())
            .unwrap()["structuredContent"]
            .clone()
    };
    let issues = quality(&mut engine)["navIssues"]
        .as_array()
        .unwrap()
        .clone();
    assert_eq!(
        issues.len(),
        1,
        "only the actually undersized link should be reported"
    );
    assert_eq!(issues[0]["nodeId"], "short");
    assert!(issues[0]["suggestedPatch"]["padding"].is_array());
    assert!(issues[0]["reason"]
        .as_str()
        .unwrap()
        .contains("fit_content"));
    let _ = engine
        .call_tool(
            "update_node",
            &json!({"nodeId":"short","data":issues[0]["suggestedPatch"]}).to_string(),
        )
        .unwrap();
    assert!(quality(&mut engine)["navIssues"]
        .as_array()
        .unwrap()
        .is_empty());
    assert!(engine.document_json().unwrap().contains("fit_content"));
    let _ = engine.call_tool("undo", "{}").unwrap();
    assert_eq!(
        quality(&mut engine)["navIssues"].as_array().unwrap().len(),
        1
    );
}

#[test]
fn design_quality_provides_an_effective_fix_for_responsive_targets() {
    let mut engine = DesignEngine::new();
    engine.load_document(&json!({"version":"1.2","formatVersion":"1.2","responsive":true,"children":[{"type":"frame","id":"page",
        "width":800,"height":600,"layout":"vertical","children":[{"type":"frame","id":"short","role":"button",
        "width":"fit_content","height":44,"layout":"horizontal","padding":[0,4],"children":[
            {"type":"text","id":"label","content":"i","fontSize":16}
        ]}]}]}).to_string()).unwrap();
    let quality = |engine: &mut DesignEngine| -> Value {
        serde_json::from_str::<Value>(&engine.call_tool("get_design_quality", "{}").unwrap())
            .unwrap()["structuredContent"]
            .clone()
    };
    let issues = quality(&mut engine)["navIssues"]
        .as_array()
        .unwrap()
        .clone();
    assert_eq!(issues.len(), 1);
    assert!(issues[0]["suggestedPatch"]["padding"].is_array());
    let _ = engine
        .call_tool(
            "update_node",
            &json!({"nodeId":"short","data":issues[0]["suggestedPatch"]}).to_string(),
        )
        .unwrap();
    assert!(quality(&mut engine)["navIssues"]
        .as_array()
        .unwrap()
        .is_empty());
    assert!(engine.document_json().unwrap().contains("fit_content"));
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

fn tool(engine: &mut DesignEngine, name: &str, args: Value) -> Value {
    let reply: Value =
        serde_json::from_str(&engine.call_tool(name, &args.to_string()).ok().unwrap()).unwrap();
    assert_eq!(reply["isError"], false, "{name}: {reply}");
    reply["structuredContent"].clone()
}

fn layout_boxes(engine: &mut DesignEngine) -> Vec<(String, f64, f64, f64, f64)> {
    fn walk(nodes: &Value, out: &mut Vec<(String, f64, f64, f64, f64)>) {
        for node in nodes.as_array().into_iter().flatten() {
            let number = |key: &str| node[key].as_f64().unwrap_or(f64::NAN);
            out.push((
                node["name"].as_str().unwrap_or_default().to_string(),
                number("x"),
                number("y"),
                number("width"),
                number("height"),
            ));
            walk(&node["children"], out);
        }
    }
    let layout = tool(engine, "snapshot_layout", json!({"maxDepth": 20}));
    let mut out = Vec::new();
    walk(&layout["layout"], &mut out);
    out
}

/// The static CSS importer emits Hug/Fill sizing and auto-layout flow. An
/// import into an empty document used to switch on authored-geometry mode,
/// which skips that layout pass and stacked every flex item at x=0 with
/// zero height.
#[test]
fn static_html_import_into_an_empty_document_keeps_the_layout_pass() {
    let mut engine = DesignEngine::new();
    let html = r#"<!doctype html><html><head><style>
        body{margin:0;width:1440px;height:300px}
        .row{display:flex;width:1440px;height:68px;padding:0 24px;align-items:center;
             justify-content:space-between;box-sizing:border-box}
        .row span{width:200px;font-size:18px}
    </style></head><body><div class="row"><span>Brand</span><span>Shop</span><span>Bag</span></div></body></html>"#;
    tool(&mut engine, "import_html", json!({"html": html}));
    let doc: Value = serde_json::from_str(&engine.document_json().ok().unwrap()).unwrap();
    assert_ne!(doc["editorMeta"]["preserveAuthoredGeometry"], true);
    let spans: Vec<_> = layout_boxes(&mut engine)
        .into_iter()
        .filter(|node| node.0 == "span")
        .collect();
    let xs: Vec<f64> = spans.iter().map(|span| span.1).collect();
    assert_eq!(xs, [24.0, 620.0, 1216.0], "space-between row: {spans:?}");
    assert!(
        spans.iter().all(|span| span.4 > 10.0),
        "text gives each span height: {spans:?}"
    );
}

#[test]
fn geometry_complete_import_into_an_empty_document_keeps_authored_geometry() {
    let mut engine = DesignEngine::new();
    let snapshot = json!({"version": 1, "root": {
        "kind": "element", "tag": "body", "rect": {"x": 0, "y": 0, "w": 300, "h": 100},
        "children": [{"kind": "element", "tag": "div", "rect": {"x": 10, "y": 10, "w": 80, "h": 40},
            "styles": {"background-color": "rgb(255, 0, 0)"}, "children": []}]}});
    tool(
        &mut engine,
        "import_web_snapshot",
        json!({"snapshot": snapshot.to_string()}),
    );
    let doc: Value = serde_json::from_str(&engine.document_json().ok().unwrap()).unwrap();
    assert_eq!(doc["editorMeta"]["preserveAuthoredGeometry"], true);
}
