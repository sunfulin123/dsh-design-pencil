//! The typed expansion must produce exactly what the JSON route produces.

use super::{resolve_refs_for_canvas, with_json_expansion};
use jian_ops_schema::document::PenDocument;

fn both_routes(doc: &PenDocument) -> (serde_json::Value, serde_json::Value) {
    let typed = serde_json::to_value(resolve_refs_for_canvas(doc)).unwrap();
    let json = with_json_expansion(|| serde_json::to_value(resolve_refs_for_canvas(doc)).unwrap());
    (typed, json)
}

fn doc(value: serde_json::Value) -> PenDocument {
    serde_json::from_value(value).expect("document")
}

#[test]
fn typed_and_json_expansion_agree_on_overrides_nesting_and_slots() {
    let doc = doc(serde_json::json!({
        "version": "1.0.0",
        "children": [],
        "pages": [
            {"id": "components", "name": "Components", "children": [
                {"type": "frame", "id": "badge", "reusable": true, "width": 40, "height": 20,
                 "fill": [{"type": "solid", "color": "#ff0000"}],
                 "children": [{"type": "text", "id": "badge-label", "content": "New"}]},
                {"type": "frame", "id": "card", "name": "Card", "reusable": true, "width": 200, "height": 100,
                 "layout": "vertical", "gap": 8,
                 "children": [
                    {"type": "text", "id": "title", "content": "Title", "fontFamily": "Inter"},
                    {"type": "frame", "id": "row", "children": [
                        {"type": "rectangle", "id": "dot", "width": 4, "height": 4},
                        {"type": "ref", "id": "nested", "ref": "badge"}
                    ]},
                    {"type": "frame", "id": "slot-area", "width": 50, "height": 10}
                 ]},
                {"type": "frame", "id": "shell", "reusable": true, "width": 80, "height": 80}
            ]},
            {"id": "canvas", "name": "Canvas", "children": [
                {"type": "ref", "id": "plain", "ref": "card", "x": 10, "y": 20},
                {"type": "ref", "id": "edited", "ref": "card", "x": 300, "name": "Edited",
                 "descendants": {
                    "card": {"fill": [{"type": "solid", "color": "#00ff00"}]},
                    "title": {"content": "Changed", "fontFamily": "Roboto"},
                    "dot": {"visible": false},
                    "slot-area": {"children": [{"type": "text", "id": "slotted", "content": "Inserted"}]}
                 }},
                {"type": "frame", "id": "wrapper", "children": [{"type": "ref", "id": "inner", "ref": "card"}]},
                {"type": "ref", "id": "slot-instance", "ref": "shell",
                 "children": [{"type": "text", "id": "own", "content": "Own content"}]},
                {"type": "ref", "id": "missing", "ref": "nope"}
            ]}
        ]
    }));
    let (typed, json) = both_routes(&doc);
    assert_eq!(typed, json);
    let text = typed.to_string();
    assert!(text.contains("Changed") && text.contains("Inserted") && text.contains("Own content"));
}

#[test]
fn common_instances_take_the_typed_route() {
    let component: jian_ops_schema::node::PenNode = serde_json::from_value(serde_json::json!({
        "type": "frame", "id": "card", "reusable": true,
        "children": [{"type": "text", "id": "t", "content": "A"}]
    }))
    .unwrap();
    let instance: jian_ops_schema::node::PenNode = serde_json::from_value(serde_json::json!({
        "type": "ref", "id": "i", "ref": "card", "descendants": {"t": {"content": "B"}}
    }))
    .unwrap();
    let expanded = super::typed_expand::expand_ref_typed(&instance, &component)
        .expect("plain instances with overrides do not need the JSON route");
    let value = serde_json::to_value(expanded).unwrap();
    assert_eq!(value["children"][0]["id"], "i__t");
    assert_eq!(value["children"][0]["content"], "B");
}

/// Opt-in differential + timing on a large real document (`DSH_REAL_DOC`):
/// `cargo test -p op-editor-core --release --lib typed_expansion_real_document -- --ignored --nocapture`
#[test]
#[ignore = "needs DSH_REAL_DOC"]
fn typed_expansion_real_document() {
    let Ok(path) = std::env::var("DSH_REAL_DOC") else {
        return;
    };
    let value: serde_json::Value =
        serde_json::from_str(&std::fs::read_to_string(path).expect("read")).expect("json");
    let doc: PenDocument =
        serde_json::from_value(value.get("document").cloned().unwrap_or(value)).expect("doc");
    let pages = doc.pages.as_ref().map_or(0, Vec::len);
    let (mut typed_ms, mut json_ms) = (0u128, 0u128);
    for index in 0..pages {
        let roots = &doc.pages.as_ref().unwrap()[index].children;
        let started = std::time::Instant::now();
        let typed = super::resolve_refs_for_canvas_roots(roots, &doc);
        typed_ms += started.elapsed().as_millis();
        let started = std::time::Instant::now();
        let json = with_json_expansion(|| super::resolve_refs_for_canvas_roots(roots, &doc));
        json_ms += started.elapsed().as_millis();
        assert_eq!(
            serde_json::to_value(&typed).unwrap(),
            serde_json::to_value(&json).unwrap(),
            "page {index} differs between routes"
        );
    }
    println!("PROBE pages={pages} typed_ms={typed_ms} json_ms={json_ms}");
}
