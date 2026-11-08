//! `import_figma_rest`: REST payload → inserted, undoable subtree.

use super::*;

fn raw(engine: &mut DesignEngine, name: &str, args: Value) -> Value {
    serde_json::from_str(&engine.call_tool(name, &args.to_string()).unwrap()).unwrap()
}

fn call(engine: &mut DesignEngine, name: &str, args: Value) -> Value {
    let result = raw(engine, name, args);
    assert_eq!(result["isError"], false, "{name}: {result}");
    result["structuredContent"].clone()
}

fn doc(engine: &DesignEngine) -> Value {
    serde_json::from_str(&engine.document_json().unwrap()).unwrap()
}

fn panel(id: &str, x: f64, y: f64) -> Value {
    json!({
        "id": id, "name": format!("Panel {id}"), "type": "FRAME",
        "absoluteBoundingBox": {"x": x, "y": y, "width": 200.0, "height": 120.0},
        "relativeTransform": [[1.0, 0.0, x], [0.0, 1.0, y]],
        "size": {"x": 200.0, "y": 120.0},
        "fills": [{"type": "IMAGE", "imageRef": "abc123", "scaleMode": "FILL"}],
        "children": [{
            "id": format!("{id}1"), "name": "Label", "type": "TEXT", "characters": "Channel",
            "absoluteBoundingBox": {"x": x + 8.0, "y": y + 8.0, "width": 36.0, "height": 20.0},
            "relativeTransform": [[1.0, 0.0, 8.0], [0.0, 1.0, 8.0]],
            "size": {"x": 36.0, "y": 20.0},
            "style": {"fontFamily": "Roboto", "fontWeight": 500, "fontSize": 14.0,
                "lineHeightPx": 20.0, "textTruncation": "ENDING", "textAutoResize": "NONE"}
        }]
    })
}

fn body(nodes: &[Value]) -> String {
    let map: serde_json::Map<String, Value> = nodes
        .iter()
        .map(|n| {
            (
                n["id"].as_str().unwrap().to_string(),
                json!({"document": n}),
            )
        })
        .collect();
    json!({"nodes": map}).to_string()
}

#[test]
fn empty_document_import_lands_at_origin_and_reports_inventory() {
    let mut engine = DesignEngine::new();
    let out = call(
        &mut engine,
        "import_figma_rest",
        json!({
            "restJson": body(&[panel("10:1", 5568.0, 11947.0)]),
            "imageUrlsJson": json!({"abc123": "data:image/png;base64,AAAA"}).to_string(),
        }),
    );
    assert_eq!(out["bounds"], json!([0.0, 0.0, 200.0, 120.0]));
    assert_eq!(out["sourceBounds"], json!([5568.0, 11947.0, 200.0, 120.0]));
    assert_eq!(out["nodeCount"], 2);
    assert_eq!(out["rootIds"].as_array().unwrap().len(), 1);
    assert_eq!(out["unresolvedImageRefs"], json!([]));
    assert_eq!(out["fonts"][0]["family"], "Roboto");
    assert_eq!(out["fonts"][0]["weight"], 500);
    let d = doc(&engine);
    let root = &d["children"][0];
    assert_eq!(
        (root["x"].as_f64(), root["y"].as_f64()),
        (Some(0.0), Some(0.0))
    );
    assert_eq!(root["fill"][0]["url"], "data:image/png;base64,AAAA");
    assert_eq!(root["children"][0]["textTruncation"], "ending");
    assert_eq!(d["editorMeta"]["preserveAuthoredGeometry"], true);
}

#[test]
fn import_into_a_non_empty_page_inserts_beside_existing_content_and_undoes() {
    let mut engine = DesignEngine::new();
    engine
        .load_document(
            r#"{"version":"0.8.5","children":[{"type":"frame","id":"mine","name":"Mine","x":0,"y":40,"width":300,"height":200}]}"#,
        )
        .unwrap();
    let out = call(
        &mut engine,
        "import_figma_rest",
        json!({"restJson": body(&[panel("10:1", 5568.0, 11947.0)]), "pageId": "0"}),
    );
    assert_eq!(out["bounds"], json!([400.0, 40.0, 200.0, 120.0]));
    assert_eq!(out["unresolvedImageRefs"], json!(["abc123"]));
    let d = doc(&engine);
    assert_eq!(
        d["children"].as_array().unwrap().len(),
        2,
        "existing content kept"
    );
    call(&mut engine, "undo", json!({}));
    assert_eq!(doc(&engine)["children"].as_array().unwrap().len(), 1);
}

#[test]
fn chunks_insert_under_a_parent_at_relative_positions() {
    let mut engine = DesignEngine::new();
    let parent = json!({
        "id": "1:1", "name": "Board", "type": "FRAME",
        "absoluteBoundingBox": {"x": 1000.0, "y": 1000.0, "width": 900.0, "height": 600.0},
        "relativeTransform": [[1.0, 0.0, 1000.0], [0.0, 1.0, 1000.0]],
        "size": {"x": 900.0, "y": 600.0}
    });
    let shell = call(
        &mut engine,
        "import_figma_rest",
        json!({"restJson": body(&[parent])}),
    );
    let parent_id = shell["rootIds"][0].as_str().unwrap().to_string();
    let child = call(
        &mut engine,
        "import_figma_rest",
        json!({"restJson": body(&[panel("2:1", 1300.0, 1200.0)]), "parent": parent_id, "x": 300, "y": 200}),
    );
    assert_eq!(child["bounds"], json!([300.0, 200.0, 200.0, 120.0]));
    let d = doc(&engine);
    let kids = d["children"][0]["children"].as_array().unwrap();
    assert_eq!(kids.len(), 1);
    assert_eq!(
        (kids[0]["x"].as_f64(), kids[0]["y"].as_f64()),
        (Some(300.0), Some(200.0))
    );
}

#[test]
fn malformed_and_empty_payloads_are_rejected_without_changes() {
    let mut engine = DesignEngine::new();
    let bad = raw(&mut engine, "import_figma_rest", json!({"restJson": "{"}));
    assert_eq!(bad["isError"], true);
    let hidden = json!({"id": "1:2", "type": "FRAME", "visible": false});
    let empty = raw(
        &mut engine,
        "import_figma_rest",
        json!({"restJson": body(&[hidden])}),
    );
    assert_eq!(empty["isError"], true);
    let layout = raw(
        &mut engine,
        "import_figma_rest",
        json!({"restJson": body(&[panel("1:3", 0.0, 0.0)]), "layout": "grid"}),
    );
    assert_eq!(layout["isError"], true);
    assert_eq!(doc(&engine)["children"], json!([]));
}

#[test]
fn chunked_rotated_parent_keeps_child_local_transform_on_an_inactive_page() {
    let child = json!({
        "id":"1:2","name":"Child","type":"RECTANGLE",
        "size":{"x":40,"y":10},
        "relativeTransform":[[1,0,20],[0,1,30]],
        "absoluteBoundingBox":{"x":1060,"y":1020,"width":10,"height":40}
    });
    let parent = json!({
        "id":"1:1","name":"Parent","type":"FRAME","size":{"x":200,"y":100},
        "relativeTransform":[[0,-1,1100],[1,0,1000]],
        "absoluteBoundingBox":{"x":1000,"y":1000,"width":100,"height":200}
    });
    let mut engine = DesignEngine::new();
    engine.load_document(r#"{"version":"1","children":[],"pages":[{"id":"p1","name":"First","children":[]},{"id":"p2","name":"Second","children":[]}]}"#).unwrap();
    let shell = call(
        &mut engine,
        "import_figma_rest",
        json!({
            "restJson": body(std::slice::from_ref(&parent)), "pageId":"p2"
        }),
    );
    call(
        &mut engine,
        "import_figma_rest",
        json!({
            "restJson": body(&[child]), "pageId":"p2", "parent": shell["rootIds"][0],
            "sourceParentsJson": json!([parent]).to_string()
        }),
    );
    let d = doc(&engine);
    let child = &d["pages"][1]["children"][0]["children"][0];
    assert_eq!(
        (child["x"].as_f64(), child["y"].as_f64()),
        (Some(20.0), Some(30.0))
    );
    assert_eq!(
        (child["width"].as_f64(), child["height"].as_f64()),
        (Some(40.0), Some(10.0))
    );
    assert_eq!(d["pages"][0]["children"], json!([]));
}

#[test]
fn semantic_layout_drift_falls_back_to_fixed_geometry() {
    let root = json!({
        "id":"8:1","name":"Drifting","type":"FRAME","layoutMode":"HORIZONTAL",
        "size":{"x":200,"y":100},"relativeTransform":[[1,0,0],[0,1,0]],
        "absoluteBoundingBox":{"x":0,"y":0,"width":200,"height":100},
        "children":[{
            "id":"8:2","name":"Offset","type":"RECTANGLE","size":{"x":20,"y":20},
            "relativeTransform":[[1,0,80],[0,1,40]],
            "absoluteBoundingBox":{"x":80,"y":40,"width":20,"height":20}
        }]
    });
    let mut engine = DesignEngine::new();
    let out = call(
        &mut engine,
        "import_figma_rest",
        json!({"restJson":body(&[root]),"layout":"semantic"}),
    );
    assert!(!out["warnings"].as_array().unwrap().is_empty());
    let d = doc(&engine);
    assert_eq!(d["children"][0]["children"][0]["x"], 80.0);
    assert_eq!(d["children"][0]["children"][0]["y"], 40.0);
}

#[test]
fn figma_job_tools_are_advertised_and_explain_host_requirement_standalone() {
    let schemas = tool_catalog::schemas();
    let names: Vec<&str> = schemas.iter().filter_map(|s| s["name"].as_str()).collect();
    for tool in op_mcp::figma_import_tools::HOST_ONLY_TOOLS {
        assert!(names.contains(tool), "{tool} missing from catalog");
        assert_eq!(names.iter().filter(|n| *n == tool).count(), 1);
        let mut engine = DesignEngine::new();
        let out = raw(
            &mut engine,
            tool,
            json!({"jobId": "x", "url": "https://www.figma.com/design/K/x"}),
        );
        assert_eq!(out["isError"], true, "{tool}");
        assert!(out.to_string().contains("Node host"), "{tool}: {out}");
    }
    let import = schemas
        .iter()
        .find(|s| s["name"] == "import_figma")
        .unwrap();
    for prop in [
        "url",
        "nodeIds",
        "mode",
        "layout",
        "figmaToken",
        "waitMs",
        "x",
        "parent",
    ] {
        assert!(
            import["inputSchema"]["properties"][prop].is_object(),
            "{prop}"
        );
    }
    assert_eq!(names.iter().filter(|n| **n == "import_figma").count(), 1);
    let mut engine = DesignEngine::new();
    let url_only = raw(
        &mut engine,
        "import_figma",
        json!({"url": "https://www.figma.com/design/K/x"}),
    );
    assert!(url_only.to_string().contains("Node host"));
}
