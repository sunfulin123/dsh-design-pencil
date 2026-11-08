//! Executes the design-prompt examples through the real MCP surface so the
//! guidance in `op_mcp::design_prompt` cannot drift from tool behaviour.

use super::*;

fn raw(engine: &mut DesignEngine, name: &str, args: Value) -> Value {
    serde_json::from_str(&engine.call_tool(name, &args.to_string()).unwrap()).unwrap()
}

fn call(engine: &mut DesignEngine, name: &str, args: Value) -> Value {
    let result = raw(engine, name, args);
    assert_eq!(result["isError"], false, "{name}: {result}");
    result["structuredContent"].clone()
}

fn engine(children: &str) -> DesignEngine {
    let mut engine = DesignEngine::new();
    engine
        .load_document(&format!(r#"{{"version":"0.8.5","children":{children}}}"#))
        .unwrap();
    engine
}

fn doc(engine: &DesignEngine) -> Value {
    serde_json::from_str(&engine.document_json().unwrap()).unwrap()
}

fn find<'a>(node: &'a Value, name: &str) -> Option<&'a Value> {
    if node["name"] == name {
        return Some(node);
    }
    node["children"]
        .as_array()
        .into_iter()
        .flatten()
        .find_map(|child| find(child, name))
}

fn find_in_doc(doc: &Value, name: &str) -> Value {
    doc["children"]
        .as_array()
        .unwrap()
        .iter()
        .find_map(|node| find(node, name))
        .unwrap_or_else(|| panic!("{name} missing in {doc}"))
        .clone()
}

#[test]
fn geometry_example_authors_ring_icon_path_and_mirror_in_one_atomic_batch() {
    let mut engine = engine("[]");
    let before = engine.document_json().unwrap();
    call(
        &mut engine,
        "batch_design",
        json!({"operations": r##"card=I(null, {"type":"frame","name":"Stats","width":320,"height":200})
ring=I(card, {"type":"ellipse","name":"Progress Ring","x":16,"y":16,"width":120,"height":120,"innerRadius":0.7,"startAngle":-90,"sweepAngle":270,"fill":"#2563eb"})
icon=I(card, {"type":"path","name":"Check Icon","x":160,"y":16,"width":24,"height":24,"d":"M4 12 L10 18 L20 6","fillRule":"evenodd"})
arrow=I(card, {"type":"path","name":"Arrow Mirrored","x":200,"y":16,"width":24,"height":24,"d":"M0 12 L24 12 M14 2 L24 12 L14 22","flipX":true})"##}),
    );
    let saved = engine.document_json().unwrap();
    let after = doc(&engine);
    let ring = find_in_doc(&after, "Progress Ring");
    assert_eq!(ring["innerRadius"].as_f64(), Some(0.7));
    assert_eq!(ring["sweepAngle"].as_f64(), Some(270.0));
    let icon = find_in_doc(&after, "Check Icon");
    assert_eq!(icon["d"], "M4 12 L10 18 L20 6");
    assert_eq!(icon["fillRule"], "evenodd");
    assert_eq!(find_in_doc(&after, "Arrow Mirrored")["flipX"], true);

    let mut reopened = DesignEngine::new();
    reopened.load_document(&saved).unwrap();
    assert_eq!(reopened.document_json().unwrap(), saved);

    call(&mut engine, "undo", json!({}));
    assert_eq!(engine.document_json().unwrap(), before);
    call(&mut engine, "redo", json!({}));
    assert_eq!(engine.document_json().unwrap(), saved);
}

#[test]
fn element_guide_operations_example_builds_a_tree_without_a_script_engine() {
    let mut engine = engine("[]");
    let script = raw(
        &mut engine,
        "batch_design",
        json!({"script":"I(null, {type:\"frame\"})"}),
    );
    // Feature unification can enable QuickJS natively; the wasm engine never has it.
    assert_eq!(script["isError"], !op_mcp::SCRIPT_ENABLED, "{script}");
    call(
        &mut engine,
        "batch_design",
        json!({"operations": r##"root=I(null, {"type":"frame","name":"Page","width":1200,"height":800,"layout":"vertical","gap":24,"fill":"#ffffff"})
hero=I(root, {"type":"frame","name":"Hero","width":"fill_container","height":360,"layout":"vertical","gap":16})
title=I(hero, {"type":"text","name":"Headline","content":"Welcome Back","width":"fill_container","height":64,"fontSize":48,"fontWeight":700})"##}),
    );
    let after = doc(&engine);
    assert_eq!(find_in_doc(&after, "Headline")["content"], "Welcome Back");
    assert_eq!(find_in_doc(&after, "Page")["children"][0]["name"], "Hero");
}

#[test]
fn malformed_path_geometry_rejects_the_whole_batch() {
    let mut engine = engine("[]");
    let before = engine.document_json().unwrap();
    for (d, rule) in [
        ("not a path", "nonzero"),
        ("L10 10", "nonzero"),
        ("M0 0 L10 10", "sideways"),
    ] {
        let operations = format!(
            r#"root=I(null, {{"type":"frame","name":"Root","width":100,"height":100}})
bad=I(root, {{"type":"path","name":"Bad","width":10,"height":10,"d":"{d}","fillRule":"{rule}"}})"#
        );
        let result = raw(
            &mut engine,
            "batch_design",
            json!({ "operations": operations }),
        );
        let rejected = result["isError"] == true || result["structuredContent"]["applied"] == false;
        assert!(rejected, "{d} / {rule}: {result}");
        assert_eq!(engine.document_json().unwrap(), before, "{d} / {rule}");
    }
}

#[test]
fn formula_scale_example_binds_and_evaluates_through_the_renderer_solver() {
    let mut engine =
        engine(r#"[{"type":"frame","id":"stack","width":200,"height":200,"layout":"vertical"}]"#);
    call(
        &mut engine,
        "set_variables",
        json!({"variables":{
            "space-base":{"type":"number","value":8},
            "space-lg":{"type":"number","value":"calc($space-base * 2)"},
            "font-body":{"type":"number","value":16},
            "font-h1":{"type":"number","value":"calc($font-body * 2)"}
        }}),
    );
    assert_eq!(
        call(&mut engine, "evaluate_variable", json!({"id":"space-lg"}))["value"].as_f64(),
        Some(16.0)
    );
    assert_eq!(
        call(&mut engine, "evaluate_variable", json!({"id":"font-h1"}))["value"].as_f64(),
        Some(32.0)
    );
    call(
        &mut engine,
        "bind_variable",
        json!({"nodeIds":["stack"],"property":"gap","variable":"space-lg"}),
    );
    assert_eq!(doc(&engine)["children"][0]["gap"], "$space-lg");
    call(
        &mut engine,
        "set_variables",
        json!({"variables":{"space-base":{"type":"number","value":10}}}),
    );
    assert_eq!(
        call(&mut engine, "evaluate_variable", json!({"id":"space-lg"}))["value"].as_f64(),
        Some(20.0)
    );
}

#[test]
fn behaviour_example_makes_a_switch_component_interactive() {
    let mut engine = engine(
        r#"[{"type":"frame","id":"switch","width":52,"height":32,"children":[
            {"type":"ellipse","id":"thumb-on","x":24,"y":4,"width":24,"height":24,"hidden":true}
        ]}]"#,
    );
    call(
        &mut engine,
        "create_component",
        json!({"node_id":"switch","name":"Switch"}),
    );
    call(
        &mut engine,
        "add_component_property",
        json!({"componentId":"switch","name":"checked","kind":"boolean",
            "targetId":"thumb-on","default":false}),
    );
    call(
        &mut engine,
        "set_component_behaviour",
        json!({"componentId":"switch","behaviour":{"kind":"switch","defaultValue":false,
            "stateBindings":[{"type":"property","propertyId":"checked"}]}}),
    );
    let inspected = call(
        &mut engine,
        "get_component_behaviour",
        json!({"componentId":"switch"}),
    );
    assert_eq!(inspected["executable"], true, "{inspected}");
    let html = call(
        &mut engine,
        "export_code",
        json!({"format":"html-css","nodeIds":["switch"]}),
    );
    assert!(html.to_string().contains("switch"), "{html}");
}

#[test]
fn responsive_example_creates_three_breakpoint_screens() {
    let mut engine = engine("[]");
    for (key, width, height) in [
        ("dashboard-large", 1440, 900),
        ("dashboard-medium", 1024, 768),
        ("dashboard-small", 390, 844),
    ] {
        let node = json!({"type":"frame","id":key,"name":key,"width":width,"height":height,"layout":"vertical"});
        call(
            &mut engine,
            "upsert_screen",
            json!({"key":key,"node_json":node.to_string()}),
        );
    }
    let after = doc(&engine);
    let widths: Vec<_> = after["children"]
        .as_array()
        .unwrap()
        .iter()
        .map(|node| node["width"].as_f64().unwrap())
        .collect();
    assert_eq!(widths, vec![1440.0, 1024.0, 390.0], "{after}");
}

#[test]
fn prompt_documents_every_executed_example() {
    let prompt = raw(&mut engine("[]"), "get_design_prompt", json!({}));
    let text = prompt.to_string().replace("\\\"", "\"");
    for needle in [
        "innerRadius",
        "fillRule",
        "flipX",
        "calc($space-base * 2)",
        "bind_variable",
        "evaluate_variable",
        r#""kind":"switch""#,
        ">=1280",
        "768-1279",
        "<768",
        "upsert_screen",
        "get_screenshot",
    ] {
        assert!(text.contains(needle), "design prompt must mention {needle}");
    }
}
