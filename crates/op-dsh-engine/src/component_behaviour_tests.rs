use super::*;
use std::rc::Rc;

fn call(engine: &mut DesignEngine, name: &str, args: Value) -> Value {
    serde_json::from_str(&engine.call_tool(name, &args.to_string()).unwrap()).unwrap()
}

#[test]
fn active_behaviour_tools_drive_preview_exports_history_and_reopen() {
    let mut engine = DesignEngine::new();
    engine
        .load_document(
            r#"{"version":"0.8.5","children":[
            {"type":"frame","id":"board","width":500,"height":300,"children":[
                {"type":"frame","id":"toggle","reusable":true,"width":120,"height":40,"children":[
                    {"type":"rectangle","id":"indicator","width":20,"height":20,"hidden":true}
                ]},
                {"type":"ref","id":"instance","ref":"toggle","x":150,"width":120,"height":40}
            ]}]}"#,
        )
        .unwrap();
    let result = call(
        &mut engine,
        "add_component_property",
        json!({"componentId":"toggle","name":"checked","kind":"boolean",
            "targetId":"indicator","default":false}),
    );
    assert_eq!(result["isError"], false, "{result}");
    let before = engine.document_json().unwrap();
    let behaviour = json!({
        "kind":"checkbox","defaultValue":false,
        "stateBindings":[{"type":"property","propertyId":"checked"}]
    });
    let result = call(
        &mut engine,
        "set_component_behaviour",
        json!({"componentId":"toggle","behaviour":behaviour}),
    );
    assert_eq!(result["isError"], false, "{result}");
    let saved = engine.document_json().unwrap();
    let inspected = call(
        &mut engine,
        "get_component_behaviour",
        json!({"componentId":"toggle"}),
    );
    assert_eq!(inspected["structuredContent"]["behaviour"], behaviour);
    assert_eq!(inspected["structuredContent"]["executable"], true);
    let discovery = call(&mut engine, "tool_search", json!({"query":"behaviour"}));
    let setter_schema = discovery["structuredContent"]["tools"]
        .as_array()
        .unwrap()
        .iter()
        .find(|tool| tool["name"] == "set_component_behaviour")
        .expect("behaviour setter must be discoverable");
    assert_eq!(
        setter_schema["inputSchema"]["properties"]["behaviour"],
        op_mcp::component_behaviour_tools::behaviour_input_schema()
    );

    assert_eq!(call(&mut engine, "undo", json!({}))["isError"], false);
    assert_eq!(engine.document_json().unwrap(), before);
    assert_eq!(call(&mut engine, "redo", json!({}))["isError"], false);
    assert_eq!(engine.document_json().unwrap(), saved);
    let mut reopened = DesignEngine::new();
    reopened.load_document(&saved).unwrap();
    assert_eq!(
        call(
            &mut reopened,
            "get_component_behaviour",
            json!({"componentId":"toggle"})
        )["structuredContent"],
        inspected["structuredContent"]
    );

    let doc: jian_ops_schema::PenDocument = serde_json::from_str(&saved).unwrap();
    let mut preview = op_preview_core::PreviewSession::enter(
        &doc,
        (500.0, 400.0),
        &Default::default(),
        0,
        true,
        true,
        Rc::new(jian_core::layout::measure::EstimateBackend),
        0,
    )
    .unwrap();
    preview.dispatch_pointer_phase_at(175.0, 20.0, jian_core::gesture::PointerPhase::Down, 1);
    preview.dispatch_pointer_phase_at(175.0, 20.0, jian_core::gesture::PointerPhase::Up, 20);
    let scene = preview.preview_scene_for_test();
    let page = scene.active_page().unwrap();
    assert!(!page.find("instance__indicator").unwrap().hidden);
    assert!(page.find("indicator").unwrap().hidden);
    assert_eq!(engine.document_json().unwrap(), saved);
    let html = op_codegen::generate_html_css_for_nodes(&doc, &doc.children);
    assert!(html.contains("role=\"checkbox\""));
    assert!(html.contains("aria-checked=\"false\""));
    assert!(html.contains("addEventListener('click'"));
    assert!(html.contains("node.hidden"));
    let exported = call(
        &mut engine,
        "export_code",
        json!({"format":"html-css","nodeIds":["board"]}),
    );
    assert_eq!(exported["isError"], false, "{exported}");
    assert_eq!(exported["structuredContent"]["code"], html);
    let react = op_codegen::generate_tailwind_jsx_for_nodes(&doc, &doc.children);
    assert!(react.contains("useState(false)"));
    assert!(react.contains("aria-checked={value}"));
    assert!(react.contains("onClick={() => setValue(!value)}"));
    assert!(react.contains("value &&"));
    let exported = call(
        &mut engine,
        "export_code",
        json!({"format":"tailwind-jsx","nodeIds":["board"]}),
    );
    assert_eq!(exported["isError"], false, "{exported}");
    assert_eq!(exported["structuredContent"]["code"], react);
    assert_eq!(engine.document_json().unwrap(), saved);

    let rejected = call(
        &mut engine,
        "set_component_behaviour",
        json!({"componentId":"toggle","behaviour":{"kind":"checkbox",
            "stateBindings":[{"type":"property","propertyId":"missing"}]}}),
    );
    assert_eq!(rejected["isError"], true, "{rejected}");
    assert_eq!(engine.document_json().unwrap(), saved);
}
