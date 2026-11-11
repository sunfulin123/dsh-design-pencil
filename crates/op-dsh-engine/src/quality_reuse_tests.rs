use super::*;

fn call(engine: &mut DesignEngine, name: &str, args: Value) -> Value {
    serde_json::from_str(&engine.call_tool(name, &args.to_string()).unwrap()).unwrap()
}

#[test]
fn repeated_siblings_are_advisory_reuse_candidates_without_mutation() {
    let mut engine = DesignEngine::new();
    engine.load_document(&json!({"version":"1.0", "children":[
        {"type":"frame","id":"board","width":500,"height":300,"layout":"vertical","children":[
            {"type":"frame","id":"a","name":"First","role":"button","width":100,"height":44,"layout":"horizontal","fill":"#ffffff","children":[{"type":"text","id":"ta","content":"Save"}]},
            {"type":"frame","id":"b","name":"Second","role":"button","width":100,"height":44,"layout":"horizontal","fill":"#ffffff","children":[{"type":"text","id":"tb","content":"Cancel"}]},
            {"type":"frame","id":"c","role":"button","width":100,"height":44,"layout":"horizontal","fill":"#000000","children":[{"type":"text","id":"tc","content":"Delete"}]},
            {"type":"frame","id":"hidden","visible":false,"width":100,"height":44,"children":[{"type":"text","id":"th","content":"Hidden"}]}
        ]}
    ]}).to_string()).unwrap();
    let before = engine.document_json().unwrap();
    let result = call(&mut engine, "get_design_quality", json!({"rootId":"board"}));
    assert_eq!(result["isError"], false, "{result}");
    let candidates = result["structuredContent"]["componentReuseCandidates"]
        .as_array()
        .unwrap();
    assert!(
        candidates
            .iter()
            .any(|candidate| candidate["parentId"] == "board"
                && candidate["nodeIds"] == json!(["a", "b", "c"])
                && candidate["count"] == 3
                && candidate["styleVariantCount"] == 2),
        "{candidates:?}"
    );
    assert!(!candidates
        .iter()
        .any(|candidate| candidate["nodeIds"].to_string().contains("hidden")));
    assert_eq!(engine.document_json().unwrap(), before);
    let isolated = call(&mut engine, "get_design_quality", json!({"rootId":"a"}));
    assert_eq!(
        isolated["structuredContent"]["componentReuseCandidates"],
        json!([])
    );
}

#[test]
fn target_findings_are_ranked_and_paginated_for_follow_up_repairs() {
    let mut engine = DesignEngine::new();
    engine.load_document(&json!({"version":"1.0","children":[{"type":"frame","id":"board","width":300,"height":300,"layout":"vertical","children":[
        {"type":"frame","id":"medium","name":"Medium","role":"button","width":80,"height":36},
        {"type":"frame","id":"tiny","name":"Tiny","role":"button","width":12,"height":12},
        {"type":"frame","id":"small","role":"button","width":80,"height":30}
    ]}]}).to_string()).unwrap();
    let before = engine.document_json().unwrap();
    let first = call(
        &mut engine,
        "get_design_quality",
        json!({"rootId":"board","limit":1}),
    );
    let value = &first["structuredContent"];
    assert_eq!(value["counts"]["navIssues"], 3);
    assert_eq!(value["navIssues"][0]["nodeId"], "tiny");
    assert_eq!(value["navIssues"][0]["role"], "button");
    assert_eq!(value["touchTargetsNextOffset"], 1);
    let next = call(
        &mut engine,
        "get_design_quality",
        json!({"rootId":"board","limit":1,"touchTargetOffset":1}),
    );
    assert_ne!(next["structuredContent"]["navIssues"][0]["nodeId"], "tiny");
    assert_eq!(next["structuredContent"]["touchTargetsNextOffset"], 2);
    assert_eq!(engine.document_json().unwrap(), before);
    let bad = call(
        &mut engine,
        "get_design_quality",
        json!({"touchTargetOffset":-1}),
    );
    assert_eq!(bad["isError"], true);
}

#[test]
fn clickable_prototype_targets_are_checked_without_a_role_but_hover_only_is_not() {
    let mut engine = DesignEngine::new();
    engine.load_document(&json!({"version":"1.0","children":[{"type":"frame","id":"board","width":300,"height":300,"children":[
        {"type":"frame","id":"click","width":20,"height":20,"reactions":[{"trigger":{"type":"ON_CLICK"},"actions":[{"type":"BACK"}]}]},
        {"type":"frame","id":"hover","width":20,"height":20,"reactions":[{"trigger":{"type":"ON_HOVER"},"actions":[{"type":"BACK"}]}]}
    ]}]}).to_string()).unwrap();
    let result = call(&mut engine, "get_design_quality", json!({"rootId":"board"}));
    let issues = result["structuredContent"]["navIssues"].as_array().unwrap();
    assert_eq!(issues.len(), 1, "{issues:?}");
    assert_eq!(issues[0]["nodeId"], "click");
    assert_eq!(issues[0]["role"], "prototype click");
}

#[test]
fn linked_component_target_is_reported_without_suggesting_a_global_master_edit() {
    let mut engine = DesignEngine::new();
    engine.load_document(&json!({"version":"1.0","children":[{"type":"frame","id":"board","width":300,"height":300,"children":[
        {"type":"frame","id":"master","reusable":true,"role":"button","width":80,"height":30,"children":[{"type":"text","id":"label","content":"OK"}]},
        {"type":"ref","id":"instance","ref":"master","x":100}
    ]}]}).to_string()).unwrap();
    let result = call(
        &mut engine,
        "get_design_quality",
        json!({"rootId":"instance"}),
    );
    assert_eq!(result["isError"], false, "{result}");
    let issues = result["structuredContent"]["navIssues"].as_array().unwrap();
    assert_eq!(issues.len(), 1, "{issues:?}");
    assert_eq!(issues[0]["nodeId"], "instance");
    assert_eq!(issues[0]["componentId"], "master");
    assert_eq!(issues[0]["patchAvailable"], false);
}

#[test]
fn linked_instances_inherit_master_changes_and_keep_local_text_overrides() {
    let mut engine = DesignEngine::new();
    engine.load_document(&json!({"version":"1.0","children":[{"type":"frame","id":"board","width":500,"height":300,"children":[
        {"type":"frame","id":"button","name":"Button","width":100,"height":44,"fill":"#ffffff","children":[{"type":"text","id":"label","content":"Save"}]}
    ]}]}).to_string()).unwrap();
    assert_eq!(
        call(
            &mut engine,
            "create_component",
            json!({"node_id":"button","name":"Button"})
        )["isError"],
        false
    );
    assert_eq!(
        call(
            &mut engine,
            "add_component_property",
            json!({"componentId":"button","name":"Label","kind":"text","targetId":"label","default":"Save"})
        )["isError"],
        false
    );
    let insert = call(
        &mut engine,
        "insert_node",
        json!({"parent":"board","data":{"type":"ref","ref":"button","name":"Instance"}}),
    );
    assert_eq!(insert["isError"], false, "{insert}");
    let doc: Value = serde_json::from_str(&engine.document_json().unwrap()).unwrap();
    let instance = doc["children"][0]["children"]
        .as_array()
        .unwrap()
        .iter()
        .find(|node| node["type"] == "ref")
        .unwrap()["id"]
        .as_str()
        .unwrap()
        .to_string();
    assert_eq!(
        call(
            &mut engine,
            "set_instance_properties",
            json!({"instanceId":instance,"properties":{"Label":"Cancel"}})
        )["isError"],
        false
    );
    let before = engine.document_json().unwrap();
    assert_eq!(
        call(
            &mut engine,
            "update_node",
            json!({"nodeId":"button","data":{"fill":"#123456"}})
        )["isError"],
        false
    );
    let doc: jian_ops_schema::PenDocument =
        serde_json::from_str(&engine.document_json().unwrap()).unwrap();
    let resolved =
        serde_json::to_value(op_editor_core::ref_resolve::resolve_refs_for_canvas(&doc)).unwrap();
    let children = resolved["children"][0]["children"].as_array().unwrap();
    assert_eq!(children[1]["children"][0]["content"], "Cancel");
    assert_eq!(children[0]["fill"], children[1]["fill"]);
    assert_eq!(call(&mut engine, "undo", json!({}))["isError"], false);
    assert_eq!(engine.document_json().unwrap(), before);
}
