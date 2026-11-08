use op_editor_core::design_bindings::{
    variable_binding_command, variable_mode_command, variable_mode_info,
    variable_scope_mode_command, VariableModeScope,
};
use op_editor_core::history_snapshot::SharedDoc;
use op_editor_core::{variables_resolve, EditorCommand, EditorState};
use serde_json::{json, Value};
use std::collections::BTreeMap;

fn fixture() -> EditorState {
    EditorState::from_document(serde_json::from_value(json!({
        "version":"1.0", "themes":{"Mode":["Light","Dark"],"Density":["Normal","Compact"]},
        "variables":{
            "show":{"type":"boolean","value":false},
            "size":{"type":"number","value":[
                {"value":12,"theme":{"Mode":"Light"}},
                {"value":24,"theme":{"Mode":"Dark"}}]},
            "face":{"type":"string","value":"Inter"},
            "color":{"type":"color","value":"#123456"},
            "bad":{"type":"number","value":-1},
            "line":{"type":"number","value":1.5}
        },
        "pages":[{"id":"p1","name":"One","children":[{
            "type":"frame","id":"f","children":[{
                "type":"text","id":"t","content":"Hello",
                "effects":[{"type":"shadow","color":"#000000","offsetX":0,"offsetY":1,"blur":4,"spread":0},
                    {"type":"blur","radius":2}]
            }]
        }]},{"id":"p2","name":"Two","children":[{"type":"text","id":"u","content":"Other"}]}]
    })).unwrap())
}
fn modes(value: &str) -> BTreeMap<String, String> {
    BTreeMap::from([("Mode".into(), value.into())])
}
fn bind(s: &mut EditorState, property: &str, name: &str) {
    assert!(s.apply(variable_binding_command(s, &["t".into()], property, Some(name)).unwrap()));
}
fn rendered(s: &EditorState) -> Value {
    serde_json::to_value(variables_resolve::resolve_document_for_canvas(
        &s.doc,
        &s.ui.variables.active_theme,
    ))
    .unwrap()
}
#[test]
fn extensions_materialize_actual_renderer_fields_and_detach() {
    let mut s = fixture();
    for (property, name) in [
        ("visible", "show"),
        ("fontSize", "size"),
        ("fontFamily", "face"),
        ("lineHeight", "line"),
        ("effects.0.blur", "size"),
        ("effects.0.offsetX", "size"),
        ("effects.0.color", "color"),
        ("effects.1.radius", "size"),
    ] {
        bind(&mut s, property, name);
    }
    assert!(s.apply(EditorCommand::Undo));
    assert_eq!(
        rendered(&s)["pages"][0]["children"][0]["children"][0]["effects"][1]["radius"],
        2.0
    );
    assert!(s.apply(EditorCommand::Redo));
    assert!(variables_resolve::document_has_tokens(&s.doc));
    let v = rendered(&s);
    let t = &v["pages"][0]["children"][0]["children"][0];
    assert_eq!(t["visible"], false);
    assert_eq!(t["fontSize"], 12.0);
    assert_eq!(t["fontFamily"], "Inter");
    assert_eq!(t["lineHeight"], 1.5);
    assert_eq!(t["effects"][0]["blur"], 12.0);
    assert_eq!(t["effects"][0]["offsetX"], 12.0);
    assert_eq!(t["effects"][0]["color"], "#123456");
    assert_eq!(t["effects"][1]["radius"], 12.0);
    assert!(s.apply(variable_binding_command(&s, &["t".into()], "fontSize", None).unwrap()));
    assert!(
        s.doc.pages.as_ref().unwrap()[0].children[0] != fixture().doc.pages.unwrap()[0].children[0]
    );
    let authored = serde_json::to_value(&s.doc).unwrap();
    assert_eq!(
        authored["pages"][0]["children"][0]["children"][0]["fontSize"],
        12.0
    );
}
#[test]
fn page_global_node_modes_inherit_auto_save_reopen_and_undo() {
    let mut s = fixture();
    bind(&mut s, "fontSize", "size");
    assert!(s.apply(
        variable_scope_mode_command(&s, VariableModeScope::Global, &modes("Dark")).unwrap()
    ));
    assert_eq!(
        rendered(&s)["pages"][0]["children"][0]["children"][0]["fontSize"],
        24.0
    );
    assert!(s.apply(
        variable_scope_mode_command(&s, VariableModeScope::Page("p1".into()), &modes("Light"))
            .unwrap()
    ));
    assert!(s.apply(variable_mode_command(&s, &["f".into()], &modes("Dark")).unwrap()));
    assert_eq!(
        variable_mode_info(&s, VariableModeScope::Node("t".into()))
            .unwrap()
            .resolved["Mode"],
        "Dark"
    );
    assert!(s.apply(variable_mode_command(&s, &["f".into()], &modes("auto")).unwrap()));
    assert_eq!(
        rendered(&s)["pages"][0]["children"][0]["children"][0]["fontSize"],
        12.0
    );
    let s2 = EditorState::from_document(
        serde_json::from_str(&serde_json::to_string(&s.doc).unwrap()).unwrap(),
    );
    assert_eq!(rendered(&s2), rendered(&s));
    let shared = SharedDoc::capture(&s.doc, None);
    assert_eq!(
        serde_json::to_value(&shared).unwrap(),
        serde_json::to_value(&s.doc).unwrap()
    );
    assert_eq!(shared.materialize(), s.doc);
    assert!(s.apply(EditorCommand::Undo));
    assert_eq!(
        rendered(&s)["pages"][0]["children"][0]["children"][0]["fontSize"],
        24.0
    );
    assert!(s.apply(EditorCommand::Redo));
    assert_eq!(rendered(&s), rendered(&s2));
    assert!(s.apply(
        variable_scope_mode_command(&s, VariableModeScope::Page("p1".into()), &BTreeMap::new())
            .unwrap()
    ));
    assert_eq!(
        rendered(&s)["pages"][0]["children"][0]["children"][0]["fontSize"],
        24.0
    );
}
#[test]
fn invalid_unknown_incompatible_targets_reject_atomically() {
    let s = fixture();
    let before = serde_json::to_value(&s.doc).unwrap();
    for (property, name) in [
        ("visible", "size"),
        ("fontSize", "show"),
        ("fontSize", "bad"),
        ("lineHeight", "size"),
        ("effects.9.blur", "size"),
        ("effects.0.unknown", "size"),
        ("effects.0.spread", "size"),
        ("effects.1.color", "color"),
        ("fontFamily", "missing"),
        ("unknown", "size"),
    ] {
        assert!(
            variable_binding_command(&s, &["t".into()], property, Some(name)).is_err(),
            "{property}"
        );
    }
    assert!(
        variable_binding_command(&s, &["t".into(), "f".into()], "fontSize", Some("size")).is_err()
    );
    assert!(variable_scope_mode_command(&s, VariableModeScope::Global, &modes("unknown")).is_err());
    assert!(variable_scope_mode_command(
        &s,
        VariableModeScope::Page("missing".into()),
        &modes("Dark")
    )
    .is_err());
    assert_eq!(serde_json::to_value(&s.doc).unwrap(), before);
}

#[test]
fn rename_and_delete_preserve_concrete_bindings_with_page_modes() {
    let mut s = fixture();
    bind(&mut s, "fontSize", "size");
    bind(&mut s, "effects.0.blur", "size");
    bind(&mut s, "lineHeight", "line");
    assert!(s.apply(
        variable_scope_mode_command(&s, VariableModeScope::Page("p1".into()), &modes("Dark"))
            .unwrap()
    ));
    assert!(s.apply(EditorCommand::RenameVariable {
        old_name: "size".into(),
        new_name: "renamed".into()
    }));
    let v = serde_json::to_value(&s.doc).unwrap();
    assert_eq!(
        v["pages"][0]["children"][0]["children"][0]["variableBindings"]["fontSize"],
        "$renamed"
    );
    assert_eq!(
        rendered(&s)["pages"][0]["children"][0]["children"][0]["fontSize"],
        24.0
    );
    assert!(s.apply(EditorCommand::DeleteVariable {
        name: "renamed".into()
    }));
    let t = &serde_json::to_value(&s.doc).unwrap()["pages"][0]["children"][0]["children"][0];
    assert_eq!(t["fontSize"], 24.0);
    assert_eq!(t["effects"][0]["blur"], 24.0);
    assert_eq!(t["variableBindings"], json!({"lineHeight":"$line"}));
}

#[test]
fn screen_projection_preserves_page_and_global_modes() {
    let doc = serde_json::from_value(json!({
        "version":"1","themes":{"Mode":["Light","Dark"]},"theme":{"Mode":"Dark"},
        "variables":{"size":{"type":"number","value":[
            {"value":12,"theme":{"Mode":"Light"}},
            {"value":24,"theme":{"Mode":"Dark"}}]}},
        "pages":[{"id":"p","name":"Page","theme":{"Mode":"Light"},"children":[{
            "type":"frame","id":"screen","screen":"/","children":[{
                "type":"text","id":"t","content":"Hi","variableBindings":{"fontSize":"$size"}
            }]
        }]}]
    }))
    .unwrap();
    let (projected, _) = jian_ops_schema::screen_projection::project_screens(&doc);
    let (projected, _) = projected.unwrap();
    assert_eq!(projected.theme, doc.theme);
    assert_eq!(
        projected.pages.as_ref().unwrap()[0].theme,
        doc.pages.as_ref().unwrap()[0].theme
    );
    let rendered = serde_json::to_value(variables_resolve::resolve_document_for_canvas(
        &projected,
        &BTreeMap::new(),
    ))
    .unwrap();
    assert_eq!(
        rendered["pages"][0]["children"][0]["children"][0]["fontSize"],
        12.0
    );
}
