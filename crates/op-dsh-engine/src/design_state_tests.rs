use super::*;

fn call(engine: &mut DesignEngine, name: &str, args: Value) -> Value {
    let result: Value =
        serde_json::from_str(&engine.call_tool(name, &args.to_string()).unwrap()).unwrap();
    assert_eq!(result["isError"], false, "{name}: {result}");
    result["structuredContent"].clone()
}

#[test]
fn ui_scale_changes_neither_document_camera_nor_undo() {
    let mut engine = DesignEngine::new();
    let before = engine.document_json().unwrap();
    let camera = call(&mut engine, "get_viewport", json!({}));
    let history = call(&mut engine, "get_history_depth", json!({}));
    for scale in [100, 110, 125, 150] {
        assert_eq!(
            call(&mut engine, "set_ui_scale", json!({"scale":scale}))["scale"],
            scale
        );
        assert_eq!(call(&mut engine, "get_ui_scale", json!({}))["scale"], scale);
        assert_eq!(engine.document_json().unwrap(), before);
        assert_eq!(call(&mut engine, "get_viewport", json!({})), camera);
        assert_eq!(call(&mut engine, "get_history_depth", json!({})), history);
    }
    let rejected: Value = serde_json::from_str(
        &engine
            .call_tool("set_ui_scale", r#"{"scale":200}"#)
            .unwrap(),
    )
    .unwrap();
    assert_eq!(rejected["isError"], true, "{rejected}");
    assert_eq!(call(&mut engine, "get_ui_scale", json!({}))["scale"], 150);
    assert_eq!(engine.document_json().unwrap(), before);
}

#[test]
fn variable_modes_and_extended_bindings_reach_real_fields_and_survive_reopen() {
    let mut engine = DesignEngine::new();
    engine.load_document(r##"{"version":"0.8.5","children":[],"pages":[
        {"id":"p1","name":"Page","children":[{"type":"text","id":"t","content":"Initial",
            "effects":[{"type":"shadow","offsetX":0,"offsetY":2,"blur":4,"spread":0,"color":"#00000040"},
                       {"type":"blur","radius":2}]}]}],
        "themes":{"Mode":["Light","Dark"]},"variables":{
            "show":{"type":"boolean","value":[{"value":true,"theme":{"Mode":"Light"}},{"value":false,"theme":{"Mode":"Dark"}}]},
            "title":{"type":"string","value":[{"value":"Light title","theme":{"Mode":"Light"}},{"value":"Dark title","theme":{"Mode":"Dark"}}]},
            "radius":{"type":"number","value":9}}}"##).unwrap();
    for (property, variable) in [
        ("visible", "show"),
        ("content", "title"),
        ("effects.0.blur", "radius"),
        ("effects.1.radius", "radius"),
    ] {
        call(
            &mut engine,
            "bind_variable",
            json!({"nodeIds":["t"],"property":property,"variable":variable}),
        );
    }
    call(
        &mut engine,
        "set_variable_mode",
        json!({"scope":"global","modes":{"Mode":"Dark"}}),
    );
    let modes = call(
        &mut engine,
        "get_variable_mode",
        json!({"scope":"node","nodeId":"t"}),
    );
    assert_eq!(modes["resolved"]["Mode"], "Dark");
    let resolved = op_editor_core::variables_resolve::resolve_document_for_canvas(
        &engine.state.doc,
        &engine.state.ui.variables.active_theme,
    );
    let resolved = serde_json::to_value(resolved).unwrap();
    let target = &resolved["pages"][0]["children"][0];
    assert_eq!(target["visible"], false);
    assert_eq!(target["content"], "Dark title");
    assert_eq!(target["effects"][0]["blur"].as_f64(), Some(9.0));
    assert_eq!(target["effects"][1]["radius"].as_f64(), Some(9.0));
    call(
        &mut engine,
        "set_variable_mode",
        json!({"scope":"page","pageId":"p1","modes":{"Mode":"Light"}}),
    );
    assert_eq!(
        call(
            &mut engine,
            "get_variable_mode",
            json!({"scope":"node","nodeId":"t"})
        )["resolved"]["Mode"],
        "Light"
    );
    let light = engine.document_json().unwrap();
    call(
        &mut engine,
        "set_variable_mode",
        json!({"scope":"page","pageId":"p1","modes":{"Mode":"auto"}}),
    );
    let saved = engine.document_json().unwrap();
    call(&mut engine, "undo", json!({}));
    assert_eq!(engine.document_json().unwrap(), light);
    call(&mut engine, "redo", json!({}));
    assert_eq!(engine.document_json().unwrap(), saved);
    let mut reopened = DesignEngine::new();
    reopened.load_document(&saved).unwrap();
    assert_eq!(
        call(
            &mut reopened,
            "get_variable_mode",
            json!({"scope":"node","nodeId":"t"})
        )["resolved"]["Mode"],
        "Dark"
    );
    let rejected: Value = serde_json::from_str(
        &reopened
            .call_tool(
                "bind_variable",
                r#"{"nodeIds":["t"],"property":"visible","variable":"radius"}"#,
            )
            .unwrap(),
    )
    .unwrap();
    assert_eq!(rejected["isError"], true, "{rejected}");
    assert_eq!(reopened.document_json().unwrap(), saved);
}
