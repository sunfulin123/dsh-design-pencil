#[path = "../src/design_tokens.rs"]
mod design_tokens;

use design_tokens::{export_w3c_tokens, import_w3c_tokens};
use op_editor_core::variables_resolve;
use serde_json::json;

#[test]
fn standard_color_number_and_alias_tokens_roundtrip_into_renderable_variables() {
    let input = json!({
        "palette":{"$type":"color",
            "brand":{"$value":{"colorSpace":"srgb","components":[1,0,0],"alpha":0.5}},
            "alias":{"$value":"{palette.brand}"}},
        "spacing":{"$type":"number","small":{"$value":4},"large":{"$value":8}}
    });
    let vars = import_w3c_tokens(&input).unwrap();
    let doc: jian_ops_schema::PenDocument = serde_json::from_value(json!({
        "version":"1.0","variables":vars,
        "children":[{"type":"rectangle","id":"r","width":20,"height":20,"fill":[{"type":"solid","color":"$palette.alias"}]}]
    })).unwrap();
    let rendered = variables_resolve::resolve_document_for_canvas(&doc, &Default::default());
    assert_eq!(
        serde_json::to_value(rendered).unwrap()["children"][0]["fill"][0]["color"],
        "#ff000080"
    );
    let exported = export_w3c_tokens(&vars, &Default::default()).unwrap();
    let again = import_w3c_tokens(&exported).unwrap();
    assert_eq!(vars, again);
}

#[test]
fn unsupported_units_types_and_alias_cycles_are_reported_not_dropped() {
    for input in [
        json!({"space":{"$type":"dimension","$value":{"value":1,"unit":"rem"}}}),
        json!({"shadow":{"$type":"shadow","$value":{}}}),
        json!({"a":{"$type":"number","$value":"{b}"},"b":{"$type":"number","$value":"{a}"}}),
        json!({"color":{"$type":"color","$value":{"colorSpace":"display-p3","components":[1,0,0]}}}),
    ] {
        assert!(import_w3c_tokens(&input).is_err(), "{input}");
    }
}
