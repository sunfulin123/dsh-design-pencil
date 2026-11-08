use super::*;
use serde_json::{json, Value};

fn call(engine: &mut DesignEngine, name: &str, args: Value) -> Value {
    let mut flat = BTreeMap::new();
    if let Some(obj) = args.as_object() {
        for (k, v) in obj {
            let s = match v {
                Value::String(s) => s.clone(),
                other => other.to_string(),
            };
            flat.insert(k.clone(), s);
        }
    }
    serde_json::from_str(
        &engine
            .call_tool(name, &serde_json::to_string(&flat).unwrap())
            .unwrap(),
    )
    .unwrap()
}

#[test]
fn prototype_tools_set_flows_reactions_scroll_and_simulate_with_single_step_undo() {
    let mut engine = DesignEngine::new();
    engine
        .load_document(
            r#"{
                "version": "1.0",
                "children": [
                    {
                        "type": "frame",
                        "id": "home",
                        "name": "Home",
                        "x": 0,
                        "y": 0,
                        "width": 390,
                        "height": 844,
                        "children": [
                            {"type": "rectangle", "id": "cta", "name": "CTA", "x": 20, "y": 40, "width": 120, "height": 44}
                        ]
                    },
                    {
                        "type": "frame",
                        "id": "detail",
                        "name": "Detail",
                        "x": 450,
                        "y": 0,
                        "width": 390,
                        "height": 844
                    }
                ]
            }"#,
        )
        .unwrap();

    // 1. Discover prototype tools via tool_search
    let search = call(&mut engine, "tool_search", json!({"query": "prototype"}));
    let names: Vec<&str> = search["structuredContent"]["tools"]
        .as_array()
        .unwrap()
        .iter()
        .filter_map(|t| t["name"].as_str())
        .collect();
    assert!(names.contains(&"set_prototype"));
    assert!(names.contains(&"set_reactions"));
    assert!(names.contains(&"simulate_prototype"));

    // 2. Reject missing destinationId
    let bad = call(
        &mut engine,
        "set_reactions",
        json!({
            "nodeId": "cta",
            "reactions": [{"trigger": {"type": "ON_CLICK"}, "actions": [{"type": "NAVIGATE", "destinationId": "missing"}]}]
        }),
    );
    assert_eq!(bad["isError"], true);

    // 3. Set prototype flow & device
    let before_flow = engine.document_json().unwrap();
    let res = call(
        &mut engine,
        "set_prototype",
        json!({
            "flows": [{"nodeId": "home", "name": "Main Flow"}],
            "device": {"type": "PRESET", "presetIdentifier": "IPHONE_15"}
        }),
    );
    assert_eq!(res["isError"], false, "{res}");
    assert_eq!(call(&mut engine, "undo", json!({}))["isError"], false);
    assert_eq!(engine.document_json().unwrap(), before_flow);
    assert_eq!(call(&mut engine, "redo", json!({}))["isError"], false);

    // 4. Set reactions on CTA -> detail
    let res = call(
        &mut engine,
        "set_reactions",
        json!({
            "nodeId": "cta",
            "reactions": [{
                "trigger": {"type": "ON_CLICK"},
                "actions": [{
                    "type": "NODE",
                    "destinationId": "detail",
                    "navigation": "NAVIGATE",
                    "transition": {"type": "SMART_ANIMATE", "duration": 0.3}
                }]
            }]
        }),
    );
    assert_eq!(res["isError"], false, "{res}");

    // 5. Set scroll behavior on home
    let res = call(
        &mut engine,
        "set_scroll_behavior",
        json!({"nodeId": "home", "overflowDirection": "VERTICAL"}),
    );
    assert_eq!(res["isError"], false, "{res}");

    // 6. Inspect with get_prototype
    let proto = call(&mut engine, "get_prototype", json!({}));
    assert_eq!(proto["isError"], false);
    assert_eq!(proto["structuredContent"]["flows"][0]["name"], "Main Flow");

    // 7. Simulate prototype click on CTA -> navigates to detail
    let sim = call(
        &mut engine,
        "simulate_prototype",
        json!({
            "steps": [{"type": "click", "node_id": "cta"}]
        }),
    );
    assert_eq!(sim["isError"], false, "{sim}");
    assert_eq!(sim["structuredContent"]["startScreenId"], "home");
    assert_eq!(sim["structuredContent"]["currentScreenId"], "detail");
    assert_eq!(
        sim["structuredContent"]["visitedScreens"],
        json!(["home", "detail"])
    );
}
