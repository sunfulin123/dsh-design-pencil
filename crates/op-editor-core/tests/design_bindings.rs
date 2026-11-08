use op_editor_core::design_bindings::{variable_binding_command, variable_mode_command};
use op_editor_core::{variables_resolve, EditorState};
use serde_json::json;

#[test]
fn bindings_modes_and_detach_survive_reload_and_render() {
    let mut s = EditorState::from_document(
        serde_json::from_value(json!({
            "version":"1.0","themes":{"Mode":["Light","Dark"]},
            "variables":{"surface":{"type":"color","value":[
                {"value":"#ffffff","theme":{"Mode":"Light"}},
                {"value":"#000000","theme":{"Mode":"Dark"}}]},"space":{"type":"number","value":8}},
            "children":[{"type":"frame","id":"f","children":[]}]
        }))
        .unwrap(),
    );
    assert!(s.apply(variable_binding_command(&s, &["f".into()], "fill", Some("surface")).unwrap()));
    assert!(s.apply(variable_binding_command(&s, &["f".into()], "gap", Some("space")).unwrap()));
    assert!(s.apply(
        variable_mode_command(
            &s,
            &["f".into()],
            &std::collections::BTreeMap::from([("Mode".into(), "Dark".into())])
        )
        .unwrap()
    ));
    let mut s = EditorState::from_document(
        serde_json::from_str(&serde_json::to_string(&s.doc).unwrap()).unwrap(),
    );
    let rendered = variables_resolve::resolve_document_for_canvas(&s.doc, &Default::default());
    let value = serde_json::to_value(rendered).unwrap();
    assert_eq!(value["children"][0]["fill"][0]["color"], "#000000");
    assert_eq!(value["children"][0]["gap"].as_f64(), Some(8.0));
    assert!(s.apply(variable_binding_command(&s, &["f".into()], "fill", None).unwrap()));
    s.doc.variables.as_mut().unwrap().remove("surface");
    assert_eq!(
        serde_json::to_value(&s.doc).unwrap()["children"][0]["fill"][0]["color"],
        "#000000"
    );
}

#[test]
fn unsupported_binding_and_invalid_mode_are_typed_errors() {
    let s = EditorState::new();
    assert!(variable_binding_command(&s, &["missing".into()], "strokeWidth", Some("x")).is_err());
    assert!(variable_mode_command(
        &s,
        &["missing".into()],
        &std::collections::BTreeMap::from([("Mode".into(), "Dark".into())])
    )
    .is_err());
}
