use super::*;

fn engine() -> DesignEngine {
    let mut engine = DesignEngine::new();
    engine
        .load_document(
            r#"{"version":"0.8.5","children":[
        {"type":"frame","id":"button","reusable":true,"width":100,"height":40,"children":[
            {"type":"text","id":"label","content":"Default"},
            {"type":"frame","id":"icon-slot","width":20,"height":20}]},
        {"type":"ref","id":"instance","ref":"button","x":200}
    ]}"#,
        )
        .unwrap();
    engine
}

fn call(engine: &mut DesignEngine, name: &str, args: Value) -> Value {
    serde_json::from_str(&engine.call_tool(name, &args.to_string()).unwrap()).unwrap()
}

#[test]
fn component_properties_render_instance_values_without_changing_the_master() {
    let mut engine = engine();
    let result = call(
        &mut engine,
        "add_component_property",
        json!({
            "componentId":"button","name":"Label","kind":"text","targetId":"label","default":"Default"
        }),
    );
    assert_eq!(result["isError"], false, "{result}");
    let before = engine.document_json().unwrap();
    let result = call(
        &mut engine,
        "set_instance_properties",
        json!({
            "instanceId":"instance","properties":{"Label":"Custom"}
        }),
    );
    assert_eq!(result["isError"], false, "{result}");
    let doc: jian_ops_schema::PenDocument =
        serde_json::from_str(&engine.document_json().unwrap()).unwrap();
    let resolved = op_editor_core::ref_resolve::resolve_refs_for_canvas(&doc);
    let resolved = serde_json::to_value(resolved).unwrap();
    assert_eq!(resolved["children"][1]["children"][0]["content"], "Custom");
    assert_eq!(resolved["children"][0]["children"][0]["content"], "Default");
    assert_eq!(call(&mut engine, "undo", json!({}))["isError"], false);
    assert_eq!(engine.document_json().unwrap(), before);
}

#[test]
fn instance_property_type_errors_are_atomic() {
    let mut engine = engine();
    let added = call(
        &mut engine,
        "add_component_property",
        json!({
            "componentId":"button","name":"Label","kind":"text","targetId":"label","default":"Default"
        }),
    );
    assert_eq!(added["isError"], false, "{added}");
    let before = engine.document_json().unwrap();
    let result = call(
        &mut engine,
        "set_instance_properties",
        json!({
            "instanceId":"instance","properties":{"Label":42}
        }),
    );
    assert_eq!(result["isError"], true, "{result}");
    assert_eq!(engine.document_json().unwrap(), before);
}

#[test]
fn slots_render_fill_and_keep_master_content_independent() {
    let mut engine = engine();
    let result = call(
        &mut engine,
        "create_slot",
        json!({
            "componentId":"button","name":"Icon","targetId":"icon-slot","max":1
        }),
    );
    assert_eq!(result["isError"], false, "{result}");
    let result = call(
        &mut engine,
        "fill_slot",
        json!({
            "instanceId":"instance","slot":"Icon",
            "nodes":[{"type":"rectangle","id":"inserted-icon","width":16,"height":16}]
        }),
    );
    assert_eq!(result["isError"], false, "{result}");
    let doc: jian_ops_schema::PenDocument =
        serde_json::from_str(&engine.document_json().unwrap()).unwrap();
    let resolved =
        serde_json::to_value(op_editor_core::ref_resolve::resolve_refs_for_canvas(&doc)).unwrap();
    assert_eq!(
        resolved["children"][1]["children"][1]["children"][0]["type"],
        "rectangle"
    );
    assert!(resolved["children"][0]["children"][1]["children"]
        .as_array()
        .is_none_or(Vec::is_empty));
}

#[test]
fn component_root_cannot_be_a_descendant_slot() {
    let mut engine = engine();
    let before = engine.document_json().unwrap();
    let result = call(
        &mut engine,
        "create_slot",
        json!({
            "componentId":"button","name":"Body","targetId":"button"
        }),
    );
    assert_eq!(result["isError"], true, "{result}");
    assert_eq!(engine.document_json().unwrap(), before);
}

#[test]
fn creates_variant_from_an_authored_frame_and_switches_instance() {
    let mut engine = engine();
    let inserted = call(
        &mut engine,
        "batch_design",
        json!({
            "operations": "v=I(\"document\", {\"type\":\"frame\",\"name\":\"Pressed\",\"width\":90,\"height\":32})"
        }),
    );
    assert_eq!(inserted["isError"], false, "{inserted}");
    let document: Value = serde_json::from_str(&engine.document_json().unwrap()).unwrap();
    let variant_id = document["children"].as_array().unwrap().last().unwrap()["id"]
        .as_str()
        .unwrap();
    let result = call(
        &mut engine,
        "create_variant",
        json!({
            "componentId":"button","nodeId":variant_id,"name":"Pressed","values":{"State":"Pressed"}
        }),
    );
    assert_eq!(result["isError"], false, "{result}");
    let result = call(
        &mut engine,
        "set_instance_variant",
        json!({
            "instanceId":"instance","variantId":variant_id
        }),
    );
    assert_eq!(result["isError"], false, "{result}");
    let document: Value = serde_json::from_str(&engine.document_json().unwrap()).unwrap();
    assert_eq!(document["children"][1]["ref"], variant_id);
}

#[test]
fn cyclic_instance_swaps_and_duplicate_slot_ids_are_rejected_atomically() {
    let mut engine = engine();
    engine
        .load_document(
            r#"{"version":"0.8.5","children":[
        {"type":"frame","id":"master","reusable":true,"children":[
            {"type":"ref","id":"nested","ref":"other"}]},
        {"type":"frame","id":"other","reusable":true}
    ]}"#,
        )
        .unwrap();
    let before = engine.document_json().unwrap();
    let result = call(
        &mut engine,
        "swap_instance",
        json!({
            "instanceId":"nested","componentId":"master"
        }),
    );
    assert_eq!(result["isError"], true, "{result}");
    assert_eq!(engine.document_json().unwrap(), before);

    let mut engine = self::engine();
    assert_eq!(
        call(
            &mut engine,
            "create_slot",
            json!({
                "componentId":"button","name":"Icon","targetId":"icon-slot"
            })
        )["isError"],
        false
    );
    let before = engine.document_json().unwrap();
    let result = call(
        &mut engine,
        "fill_slot",
        json!({
            "instanceId":"instance","slot":"Icon","nodes":[
                {"type":"rectangle","id":"duplicate"},
                {"type":"rectangle","id":"duplicate"}
            ]
        }),
    );
    assert_eq!(result["isError"], true, "{result}");
    assert_eq!(engine.document_json().unwrap(), before);
}

#[test]
fn component_inspector_tools_are_discoverable_strict_and_survive_save_reopen() {
    let mut engine = engine();
    let tools: Value = serde_json::from_str(&engine.tools_json()).unwrap();
    for name in ["update_slot", "delete_slot", "reset_instance_properties"] {
        let tool = tools
            .as_array()
            .unwrap()
            .iter()
            .find(|tool| tool["name"] == name)
            .unwrap_or_else(|| panic!("missing tool {name}"));
        assert_eq!(tool["inputSchema"]["additionalProperties"], false);
        let search = call(&mut engine, "tool_search", json!({"query":name}));
        assert_eq!(search["isError"], false, "{search}");
        let found: Value =
            serde_json::from_str(search["content"][0]["text"].as_str().unwrap()).unwrap();
        assert_eq!(found["tools"][0]["name"], name);
    }
    for name in ["create_slot", "update_slot"] {
        let tool = tools
            .as_array()
            .unwrap()
            .iter()
            .find(|tool| tool["name"] == name)
            .unwrap();
        for limit in ["min", "max"] {
            assert_eq!(tool["inputSchema"]["properties"][limit]["type"], "integer");
            assert_eq!(tool["inputSchema"]["properties"][limit]["minimum"], 0);
        }
    }
    for (name, args) in [
        (
            "create_slot",
            json!({"componentId":"button","name":"Icon","targetId":"icon-slot","max":2}),
        ),
        (
            "update_slot",
            json!({"componentId":"button","name":"Icon","targetId":"icon-slot","min":0,"max":1}),
        ),
        (
            "add_component_property",
            json!({
                "componentId":"button","name":"Label","kind":"text","targetId":"label","default":"Default"
            }),
        ),
        (
            "set_instance_properties",
            json!({"instanceId":"instance","properties":{"Label":"Custom"}}),
        ),
    ] {
        let result = call(&mut engine, name, args);
        assert_eq!(result["isError"], false, "{name}: {result}");
    }
    let before_reset = engine.document_json().unwrap();
    assert_eq!(
        call(
            &mut engine,
            "reset_instance_properties",
            json!({"instanceId":"instance"})
        )["isError"],
        false
    );
    let saved = engine.document_json().unwrap();
    let mut reopened = DesignEngine::new();
    reopened.load_document(&saved).unwrap();
    let doc: Value = serde_json::from_str(&reopened.document_json().unwrap()).unwrap();
    assert!(doc["children"][1].get("componentValues").is_none());
    assert_eq!(
        doc["children"][0]["componentDesign"]["slots"]["Icon"]["max"],
        1
    );
    assert_eq!(call(&mut engine, "undo", json!({}))["isError"], false);
    assert_eq!(engine.document_json().unwrap(), before_reset);
    let before_delete = reopened.document_json().unwrap();
    assert_eq!(
        call(
            &mut reopened,
            "delete_slot",
            json!({"componentId":"button","name":"Icon"})
        )["isError"],
        false
    );
    let deleted = reopened.document_json().unwrap();
    engine.load_document(&deleted).unwrap();
    let doc: Value = serde_json::from_str(&engine.document_json().unwrap()).unwrap();
    assert!(doc["children"][0]["componentDesign"].get("slots").is_none());
    assert_eq!(call(&mut reopened, "undo", json!({}))["isError"], false);
    assert_eq!(reopened.document_json().unwrap(), before_delete);
}

#[test]
fn component_slot_update_rejects_incompatible_fills_and_bad_limits_atomically() {
    let mut engine = engine();
    assert_eq!(
        call(
            &mut engine,
            "create_slot",
            json!({
                "componentId":"button","name":"Icon","targetId":"icon-slot","max":2
            })
        )["isError"],
        false
    );
    assert_eq!(
        call(
            &mut engine,
            "fill_slot",
            json!({
                "instanceId":"instance","slot":"Icon","nodes":[
                    {"type":"rectangle","id":"first"},{"type":"rectangle","id":"second"}
                ]
            })
        )["isError"],
        false
    );
    let before = engine.document_json().unwrap();
    let history = engine.document_history_json();
    for (name, args) in [
        (
            "update_slot",
            json!({"componentId":"button","name":"Icon","targetId":"icon-slot","max":1}),
        ),
        (
            "create_slot",
            json!({"componentId":"button","name":"Icon","targetId":"icon-slot"}),
        ),
        (
            "create_slot",
            json!({"componentId":"button","name":"Strict","targetId":"icon-slot","max":1}),
        ),
        (
            "update_slot",
            json!({"componentId":"button","name":"Unknown","targetId":"icon-slot"}),
        ),
        (
            "delete_slot",
            json!({"componentId":"button","name":"Unknown"}),
        ),
        (
            "update_slot",
            json!({"componentId":"button","name":"Icon","targetId":"icon-slot","max":-1}),
        ),
        (
            "update_slot",
            json!({"componentId":"button","name":"Icon","targetId":"icon-slot","min":1.5}),
        ),
        (
            "update_slot",
            json!({"componentId":"button","name":"Icon","targetId":"icon-slot","min":3,"max":2}),
        ),
        (
            "update_slot",
            json!({"componentId":"button","name":"Icon","targetId":"icon-slot","unexpected":true}),
        ),
    ] {
        let result = call(&mut engine, name, args);
        assert_eq!(result["isError"], true, "{name}: {result}");
        assert_eq!(engine.document_json().unwrap(), before);
        assert_eq!(engine.document_history_json(), history);
    }
    assert_eq!(
        call(
            &mut engine,
            "delete_slot",
            json!({"componentId":"button","name":"Icon"})
        )["isError"],
        false
    );
    let saved = engine.document_json().unwrap();
    let mut reopened = DesignEngine::new();
    reopened.load_document(&saved).unwrap();
    let doc: Value = serde_json::from_str(&reopened.document_json().unwrap()).unwrap();
    assert_eq!(
        doc["children"][1]["descendants"]["icon-slot"]["children"]
            .as_array()
            .unwrap()
            .len(),
        2
    );
}
