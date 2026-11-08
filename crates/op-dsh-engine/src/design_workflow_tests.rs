use super::*;

fn call(engine: &mut DesignEngine, name: &str, args: Value) -> Value {
    let result: Value =
        serde_json::from_str(&engine.call_tool(name, &args.to_string()).unwrap()).unwrap();
    assert_eq!(result["isError"], false, "{name}: {result}");
    result["structuredContent"].clone()
}

#[test]
fn mcp_design_workflow_survives_save_and_reopen() {
    let mut engine = DesignEngine::new();
    engine
        .load_document(
            r#"{"version":"0.8.5","children":[
              {"type":"frame","id":"button","width":120,"height":40,"children":[
                {"type":"text","id":"label","content":"Default","rotation":22}]},
              {"type":"ref","id":"instance","ref":"button","x":200},
              {"type":"rectangle","id":"a","x":0,"y":150,"width":40,"height":40},
              {"type":"rectangle","id":"b","x":100,"y":150,"width":40,"height":40}
            ]}"#,
        )
        .unwrap();
    call(
        &mut engine,
        "create_style",
        json!({
            "id":"brand","style":{"name":"Brand","kind":"paint",
            "properties":{"fill":[{"type":"solid","color":"#ff0000"}]}}
        }),
    );
    call(
        &mut engine,
        "apply_style",
        json!({"id":"brand","nodeIds":["button","a"]}),
    );
    call(
        &mut engine,
        "import_design_tokens",
        json!({
            "tokens":{"space":{"$type":"number","$value":16}}
        }),
    );
    call(
        &mut engine,
        "bind_variable",
        json!({
            "nodeIds":["button"],"property":"padding","variable":"space"
        }),
    );
    call(
        &mut engine,
        "create_component",
        json!({"node_id":"button","name":"Button"}),
    );
    call(
        &mut engine,
        "add_component_property",
        json!({
            "componentId":"button","name":"Label","kind":"text",
            "targetId":"label","default":"Default"
        }),
    );
    call(
        &mut engine,
        "set_instance_properties",
        json!({
            "instanceId":"instance","properties":{"Label":"Continue"}
        }),
    );
    call(
        &mut engine,
        "set_text_markdown",
        json!({"nodeId":"label","markdown":"**Default**"}),
    );
    let lint = call(
        &mut engine,
        "lint_document",
        json!({"rules":["unexpected-rotation"]}),
    );
    let issues = lint["issues"].as_array().unwrap();
    assert_eq!(issues.len(), 1);
    call(
        &mut engine,
        "fix_lint_issues",
        json!({"issueIds":[issues[0]["issueId"]]}),
    );
    call(
        &mut engine,
        "arrange_nodes",
        json!({"nodeIds":["a","b"],"mode":"pack_h"}),
    );
    let clean = call(
        &mut engine,
        "lint_document",
        json!({"rules":["unexpected-rotation"]}),
    );
    assert_eq!(clean["issues"].as_array().unwrap().len(), 0);
    let exported = call(&mut engine, "export_design_tokens", json!({}));
    assert!(exported.to_string().contains("space"));

    let saved = engine.document_json().unwrap();
    let mut reopened = DesignEngine::new();
    reopened.load_document(&saved).unwrap();
    assert_eq!(reopened.document_json().unwrap(), saved);
    assert_eq!(
        call(&mut reopened, "export_design_tokens", json!({})),
        exported
    );
    let doc: jian_ops_schema::PenDocument = serde_json::from_str(&saved).unwrap();
    let resolved =
        serde_json::to_value(op_editor_core::ref_resolve::resolve_refs_for_canvas(&doc)).unwrap();
    assert_eq!(
        resolved["children"][1]["children"][0]["content"], "Continue",
        "{resolved}"
    );
    assert_eq!(resolved["children"][3]["x"].as_f64(), Some(40.0));
    call(
        &mut reopened,
        "update_style",
        json!({
            "id":"brand","style":{"name":"Brand","kind":"paint",
            "properties":{"fill":[{"type":"solid","color":"#00ff00"}]}}
        }),
    );
    let after: Value = serde_json::from_str(&reopened.document_json().unwrap()).unwrap();
    assert_eq!(after["children"][0]["fill"][0]["color"], "#00ff00");
    assert_eq!(after["children"][2]["fill"][0]["color"], "#00ff00");
}

#[test]
fn diagram_tools_are_active_editable_and_reversible() {
    let mut engine = DesignEngine::new();
    engine
        .load_document(r#"{"version":"0.8.5","children":[]}"#)
        .unwrap();
    let empty = engine.document_json().unwrap();
    call(
        &mut engine,
        "import_mermaid",
        json!({
            "source":"flowchart LR\nA[Input] --> B[Output]"
        }),
    );
    let document = engine.document_json().unwrap();
    assert!(document.contains("\"type\":\"path\""), "{document}");
    assert!(document.contains("\"type\":\"text\""), "{document}");
    call(&mut engine, "undo", json!({}));
    assert_eq!(engine.document_json().unwrap(), empty);

    call(
        &mut engine,
        "import_drawio",
        json!({
            "xml":r#"<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/>
          <mxCell id="a" value="Input" vertex="1" parent="1">
            <mxGeometry x="0" y="0" width="100" height="50" as="geometry"/>
          </mxCell></root></mxGraphModel>"#
        }),
    );
    assert!(engine.document_json().unwrap().contains("Input"));
    call(&mut engine, "undo", json!({}));
    assert_eq!(engine.document_json().unwrap(), empty);

    engine
        .load_document(
            r#"{"version":"0.8.5","children":[
        {"type":"rectangle","id":"a","width":40,"height":40},
        {"type":"rectangle","id":"b","x":100,"width":40,"height":40}
    ]}"#,
        )
        .unwrap();
    let before = engine.document_json().unwrap();
    let created = call(
        &mut engine,
        "create_connector",
        json!({
            "fromId":"a","toId":"b","label":"Next","style":{"routing":"orthogonal","arrow":true}
        }),
    );
    assert_eq!(created["binding"], "static");
    assert_eq!(created["liveFollow"], "false");
    assert!(engine
        .document_json()
        .unwrap()
        .contains("\"type\":\"path\""));
    call(&mut engine, "undo", json!({}));
    assert_eq!(engine.document_json().unwrap(), before);
}

#[test]
fn styled_node_deletion_prunes_membership_and_undo_restores_it() {
    let mut engine = DesignEngine::new();
    engine
        .load_document(
            r#"{"version":"0.8.5","children":[
        {"type":"rectangle","id":"a"},{"type":"rectangle","id":"b"}
    ]}"#,
        )
        .unwrap();
    call(
        &mut engine,
        "create_style",
        json!({
            "id":"brand","style":{"name":"Brand","kind":"paint",
                "properties":{"fill":[{"type":"solid","color":"#ff0000"}]}}
        }),
    );
    call(
        &mut engine,
        "apply_style",
        json!({"id":"brand","nodeIds":["a","b"]}),
    );
    let before = engine.document_json().unwrap();
    call(&mut engine, "delete_node", json!({"node_id":"a"}));
    let after: Value = serde_json::from_str(&engine.document_json().unwrap()).unwrap();
    assert_eq!(after["sharedStyles"]["brand"]["nodeIds"], json!(["b"]));
    call(&mut engine, "undo", json!({}));
    assert_eq!(engine.document_json().unwrap(), before);
}
