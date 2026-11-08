use super::*;

fn engine() -> DesignEngine {
    let mut engine = DesignEngine::new();
    engine
        .load_document(
            r##"{"version":"0.8.5","children":[
              {"type":"rectangle","id":"source","width":100,"height":50,
               "fill":[{"type":"solid","color":"#123456"}],"opacity":0.6},
              {"type":"rectangle","id":"target","x":200,"width":20,"height":20},
              {"type":"path","id":"vector","width":100,"height":100,"d":"M0 0 L10 10"}
            ]}"##,
        )
        .unwrap();
    engine
}

fn call(engine: &mut DesignEngine, name: &str, args: Value) -> Value {
    serde_json::from_str(&engine.call_tool(name, &args.to_string()).unwrap()).unwrap()
}

fn document(engine: &DesignEngine) -> Value {
    serde_json::from_str(&engine.document_json().unwrap()).unwrap()
}

#[test]
fn copies_appearance_without_identity_or_position_and_undoes_once() {
    let mut engine = engine();
    let before = document(&engine);
    let copied = call(&mut engine, "copy_properties", json!({"sourceId":"source"}));
    assert_eq!(copied["isError"], false, "{copied}");
    let pasted = call(
        &mut engine,
        "paste_properties",
        json!({"nodeIds":["target"]}),
    );
    assert_eq!(pasted["isError"], false, "{pasted}");
    let after = document(&engine);
    assert_eq!(after["children"][1]["fill"], before["children"][0]["fill"]);
    assert_eq!(after["children"][1]["opacity"], 0.6);
    assert_eq!(after["children"][1]["id"], "target");
    assert_eq!(after["children"][1]["x"].as_f64(), Some(200.0));
    assert_eq!(after["children"][1]["width"].as_f64(), Some(20.0));
    assert_eq!(call(&mut engine, "undo", json!({}))["isError"], false);
    assert_eq!(document(&engine), before);
}

#[test]
fn invalid_property_target_rejects_the_whole_batch() {
    let mut engine = engine();
    let before = document(&engine);
    call(&mut engine, "copy_properties", json!({"sourceId":"source"}));
    let pasted = call(
        &mut engine,
        "paste_properties",
        json!({"nodeIds":["target","missing"]}),
    );
    assert_eq!(pasted["isError"], true);
    assert_eq!(document(&engine), before);
}

#[test]
fn vector_path_replaces_old_geometry_and_is_reversible() {
    let mut engine = engine();
    let before = document(&engine);
    let reply = call(
        &mut engine,
        "set_vector_path",
        json!({"nodeId":"vector","d":"M0 0 L80 0 L80 80 Z","fillRule":"evenodd"}),
    );
    assert_eq!(reply["isError"], false, "{reply}");
    let after = document(&engine);
    assert_eq!(after["children"][2]["d"], "M0 0 L80 0 L80 80 Z");
    assert_eq!(after["children"][2]["fillRule"], "evenodd");
    assert_eq!(call(&mut engine, "undo", json!({}))["isError"], false);
    assert_eq!(document(&engine), before);
}

#[test]
fn rejects_malformed_svg_paths_without_changes() {
    let mut engine = engine();
    let before = document(&engine);
    let reply = call(
        &mut engine,
        "set_vector_path",
        json!({"nodeId":"vector","d":"M invalid"}),
    );
    assert_eq!(reply["isError"], true);
    assert_eq!(document(&engine), before);
}

#[test]
fn aspect_lock_persists_and_width_update_preserves_ratio() {
    let mut engine = engine();
    let lock = call(
        &mut engine,
        "update_node",
        json!({"nodeId":"source","data":{"lockAspectRatio":true}}),
    );
    assert_eq!(lock["isError"], false, "{lock}");
    assert_eq!(document(&engine)["children"][0]["lockAspectRatio"], true);
    let resize = call(
        &mut engine,
        "update_node",
        json!({"nodeId":"source","data":{"width":200}}),
    );
    assert_eq!(resize["isError"], false, "{resize}");
    assert_eq!(
        document(&engine)["children"][0]["height"].as_f64(),
        Some(100.0)
    );
}

#[test]
fn pasting_plain_appearance_clears_previous_effects() {
    let mut engine = engine();
    call(
        &mut engine,
        "update_node",
        json!({
            "nodeId":"target","data":{"opacity":0.2,"cornerRadius":12}
        }),
    );
    call(&mut engine, "copy_properties", json!({"sourceId":"vector"}));
    let result = call(
        &mut engine,
        "paste_properties",
        json!({"nodeIds":["target"]}),
    );
    assert_eq!(result["isError"], false, "{result}");
    let target = &document(&engine)["children"][1];
    assert!(target["opacity"].is_null());
    assert!(target["cornerRadius"].is_null());
}

#[test]
fn locked_targets_reject_all_appearance_changes() {
    let mut engine = engine();
    call(
        &mut engine,
        "update_node",
        json!({"nodeId":"target","data":{"locked":true}}),
    );
    let before = document(&engine);
    assert_eq!(before["children"][1]["locked"], true);
    let result = call(
        &mut engine,
        "paste_properties",
        json!({
            "nodeIds":["source","target"],"properties":{"opacity":0.1}
        }),
    );
    assert_eq!(result["isError"], true, "{result}");
    assert_eq!(document(&engine), before);
}

#[test]
fn appearance_and_paths_honor_locked_ancestors() {
    let mut engine = engine();
    engine
        .load_document(
            r#"{"version":"0.8.5","children":[
        {"type":"frame","id":"locked","locked":true,"children":[
            {"type":"path","id":"child","d":"M0 0 L10 10"}]}
    ]}"#,
        )
        .unwrap();
    let before = document(&engine);
    for (name, args) in [
        (
            "paste_properties",
            json!({"nodeIds":["child"],"properties":{"opacity":0.1}}),
        ),
        (
            "set_vector_path",
            json!({"nodeId":"child","d":"M0 0 L20 20"}),
        ),
    ] {
        let result = call(&mut engine, name, args);
        assert_eq!(result["isError"], true, "{result}");
        assert_eq!(document(&engine), before);
    }
}

#[test]
fn html_paste_modes_produce_text_or_editable_layers() {
    let mut engine = engine();
    let result = call(
        &mut engine,
        "paste_html",
        json!({
            "html":"<p>Hello <b>world</b></p><p>Second</p>","mode":"text","x":"300"
        }),
    );
    assert_eq!(result["isError"], false, "{result}");
    let after_text = document(&engine);
    let text = after_text["children"].as_array().unwrap().last().unwrap();
    assert_eq!(text["type"], "text");
    assert!(text["content"].as_str().unwrap().contains("Hello"));
    assert!(text["content"].as_str().unwrap().contains("world"));
    assert_eq!(text["x"].as_f64(), Some(300.0));
    let result = call(
        &mut engine,
        "paste_html",
        json!({
            "html":"<p>Hello</p>","mode":"layers"
        }),
    );
    assert_eq!(result["isError"], false, "{result}");
    assert_eq!(
        document(&engine)["children"]
            .as_array()
            .unwrap()
            .last()
            .unwrap()["type"],
        "frame"
    );
}
