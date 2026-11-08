use op_editor_core::{variables_resolve, EditorState};
use op_mcp::design_token_tools::{export_design_tokens_snapshot, import_design_tokens_snapshot};
use op_mcp::design_variable_tools::{
    bind_variable_snapshot, detach_variable_snapshot, set_variable_mode_snapshot,
};
use op_mcp::shared_style_tools::{
    apply_shared_style_snapshot, create_shared_style_snapshot, detach_shared_style_snapshot,
    get_shared_styles_snapshot, update_shared_style_snapshot,
};
use op_mcp::{McpTool, ToolOutcome};
use serde_json::json;
use std::collections::BTreeMap;

fn args(pairs: &[(&str, &str)]) -> BTreeMap<String, String> {
    pairs
        .iter()
        .map(|(k, v)| (k.to_string(), v.to_string()))
        .collect()
}

fn apply(state: &mut EditorState, tool: &dyn McpTool, input: &BTreeMap<String, String>) {
    let ToolOutcome::OkWithCommand(_, command) = tool.call(input) else {
        panic!(
            "tool {} did not return a command: {:?}",
            tool.name(),
            tool.call(input)
        );
    };
    assert!(state.apply(command));
}

fn fixture() -> EditorState {
    EditorState::from_document(
        serde_json::from_value(json!({
            "version":"1.0","themes":{"Mode":["Light","Dark"]},
            "children":[{"type":"frame","id":"f","children":[]}]
        }))
        .unwrap(),
    )
}

#[test]
fn style_tools_materialize_persisted_properties_and_detach() {
    let mut state = fixture();
    let style=json!({"name":"Brand","kind":"paint","properties":{"fill":[{"type":"solid","color":"#ff0000"}]},"nodeIds":[]}).to_string();
    apply(
        &mut state,
        &create_shared_style_snapshot(&fixture()),
        &args(&[("id", "brand"), ("style", &style)]),
    );
    let tool = apply_shared_style_snapshot(&state);
    apply(
        &mut state,
        &tool,
        &args(&[("id", "brand"), ("nodeIds", r#"["f"]"#)]),
    );
    assert!(state.is_dirty());
    let mut state = EditorState::from_document(
        serde_json::from_str(&serde_json::to_string(&state.doc).unwrap()).unwrap(),
    );
    let changed = style.replace("#ff0000", "#00ff00");
    let tool = update_shared_style_snapshot(&state);
    apply(
        &mut state,
        &tool,
        &args(&[("id", "brand"), ("style", &changed)]),
    );
    assert_eq!(
        serde_json::to_value(&state.doc).unwrap()["children"][0]["fill"][0]["color"],
        "#00ff00"
    );
    let tool = detach_shared_style_snapshot(&state);
    apply(
        &mut state,
        &tool,
        &args(&[("id", "brand"), ("nodeIds", r#"["f"]"#)]),
    );
    let ToolOutcome::Ok(output) = get_shared_styles_snapshot(&state).call(&BTreeMap::new()) else {
        panic!("list failed")
    };
    let styles: serde_json::Value = serde_json::from_str(&output["styles"]).unwrap();
    assert_eq!(styles["brand"]["nodeIds"], json!([]));
}

#[test]
fn token_binding_mode_tools_render_and_roundtrip() {
    let mut state = fixture();
    let tokens =
        json!({"brand":{"$type":"color","$value":{"colorSpace":"srgb","components":[1,0,0]}}})
            .to_string();
    let tool = import_design_tokens_snapshot(&state);
    apply(&mut state, &tool, &args(&[("tokens", &tokens)]));
    let tool = bind_variable_snapshot(&state);
    apply(
        &mut state,
        &tool,
        &args(&[
            ("nodeIds", r#"["f"]"#),
            ("property", "fill"),
            ("variable", "brand"),
        ]),
    );
    let tool = set_variable_mode_snapshot(&state);
    apply(
        &mut state,
        &tool,
        &args(&[("nodeIds", r#"["f"]"#), ("modes", r#"{"Mode":"Dark"}"#)]),
    );
    let doc = variables_resolve::resolve_document_for_canvas(&state.doc, &Default::default());
    assert_eq!(
        serde_json::to_value(doc).unwrap()["children"][0]["fill"][0]["color"],
        "#ff0000"
    );
    let ToolOutcome::Ok(output) = export_design_tokens_snapshot(&state).call(&BTreeMap::new())
    else {
        panic!("export failed")
    };
    assert!(output["tokens"].contains("srgb"));
    let tool = detach_variable_snapshot(&state);
    apply(
        &mut state,
        &tool,
        &args(&[("nodeIds", r#"["f"]"#), ("property", "fill")]),
    );
    assert_eq!(
        serde_json::to_value(&state.doc).unwrap()["children"][0]["fill"][0]["color"],
        "#ff0000"
    );
}

#[test]
fn malformed_and_unrenderable_requests_never_emit_write_commands() {
    let state = fixture();
    for outcome in [
        import_design_tokens_snapshot(&state).call(&args(&[("tokens", "{")])),
        create_shared_style_snapshot(&state).call(&BTreeMap::new()),
        apply_shared_style_snapshot(&state)
            .call(&args(&[("id", "missing"), ("nodeIds", r#"["f"]"#)])),
        bind_variable_snapshot(&state).call(&args(&[
            ("nodeIds", r#"["f"]"#),
            ("property", "fontSize"),
            ("variable", "x"),
        ])),
        set_variable_mode_snapshot(&state).call(&args(&[
            ("nodeIds", r#"["f"]"#),
            ("modes", r#"{"Mode":"unknown"}"#),
        ])),
    ] {
        assert!(matches!(outcome, ToolOutcome::Err(..)));
    }
}
