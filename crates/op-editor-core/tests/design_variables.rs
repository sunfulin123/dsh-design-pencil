use op_editor_core::variables_resolve::{resolve_document_for_canvas, roots_have_tokens};
use serde_json::json;

#[test]
fn aliases_formulas_and_inherited_node_modes_render_after_reload() {
    let doc: jian_ops_schema::PenDocument = serde_json::from_value(json!({
        "version":"1.0","themes":{"Mode":["Light","Dark"]},
        "variables":{
            "surface":{"type":"color","value":[
                {"theme":{"Mode":"Light"},"value":"#ffffff"},
                {"theme":{"Mode":"Dark"},"value":"#000000"}]},
            "alias":{"type":"color","value":"$surface"},
            "space":{"type":"number","value":4},
            "space2":{"type":"number","value":"calc($space * 2)"}},
        "children":[{"type":"frame","id":"f","theme":{"Mode":"Dark"},
            "gap":"calc($space2 + 2)","children":[
            {"type":"rectangle","id":"r","width":20,"height":20,"fill":[{"type":"solid","color":"$alias"}]}
        ]}]
    })).unwrap();
    let doc: jian_ops_schema::PenDocument =
        serde_json::from_str(&serde_json::to_string(&doc).unwrap()).unwrap();
    assert!(roots_have_tokens(&doc.children));
    let resolved = resolve_document_for_canvas(&doc, &Default::default());
    let value = serde_json::to_value(resolved).unwrap();
    assert_eq!(value["children"][0]["gap"].as_f64(), Some(10.0));
    assert_eq!(
        value["children"][0]["children"][0]["fill"][0]["color"],
        "#000000"
    );
    let authored = serde_json::to_value(doc).unwrap();
    assert_eq!(authored["children"][0]["gap"], "calc($space2 + 2)");
}

#[test]
fn formula_only_roots_are_detected() {
    let nodes: Vec<jian_ops_schema::node::PenNode> = serde_json::from_value(
        json!([{"type":"frame","id":"f","gap":"calc(2 * 3)","children":[]}]),
    )
    .unwrap();
    assert!(roots_have_tokens(&nodes));
}

#[test]
fn checked_formula_errors_are_explicit_and_bounded() {
    use op_editor_core::variables_resolve::{
        evaluate_formula, resolve_variable_ref_checked, VariableResolveError,
    };
    let mut missing = |name: &str| Err(VariableResolveError::Missing(name.into()));
    assert_eq!(
        evaluate_formula("calc(1 / 0)", &mut missing),
        Err(VariableResolveError::NonFinite)
    );
    assert!(matches!(
        evaluate_formula("calc(2 + alert(1))", &mut missing),
        Err(VariableResolveError::InvalidFormula(_))
    ));
    assert_eq!(
        evaluate_formula("calc(2 * (3 + 4) - 1e1)", &mut missing),
        Ok(4.0)
    );
    let vars = serde_json::from_value(json!({
        "a":{"type":"number","value":"calc($b + 1)"},
        "b":{"type":"number","value":"$a"}
    }))
    .unwrap();
    assert!(matches!(
        resolve_variable_ref_checked("$a", Some(&vars), &Default::default()),
        Err(VariableResolveError::Cycle(_))
    ));
}

#[test]
fn renaming_and_deleting_formula_inputs_keep_rendered_values() {
    let mut state = op_editor_core::EditorState::from_document(
        serde_json::from_value(json!({
            "version":"1.0","variables":{
                "space":{"type":"number","value":4},
                "double":{"type":"number","value":"calc($space * 2)"}
            },
            "children":[{"type":"frame","id":"f","gap":"calc($space + $double)","children":[]}]
        }))
        .unwrap(),
    );
    assert!(state.apply(op_editor_core::EditorCommand::RenameVariable {
        old_name: "space".into(),
        new_name: "unit".into()
    }));
    let rendered = resolve_document_for_canvas(&state.doc, &Default::default());
    assert_eq!(
        serde_json::to_value(rendered).unwrap()["children"][0]["gap"].as_f64(),
        Some(12.0)
    );
    assert!(state.apply(op_editor_core::EditorCommand::DeleteVariable {
        name: "unit".into()
    }));
    let rendered = resolve_document_for_canvas(&state.doc, &Default::default());
    assert_eq!(
        serde_json::to_value(rendered).unwrap()["children"][0]["gap"].as_f64(),
        Some(12.0)
    );
}
