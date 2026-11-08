use jian_ops_schema::component::ComponentDesign;
use op_editor_core::component_behaviour::compile_component_behaviour;
use serde_json::json;

fn doc() -> jian_ops_schema::PenDocument {
    serde_json::from_value(json!({
        "version":"1.0", "children":[{
            "type":"frame","id":"toggle","width":120,"height":40,"reusable":true,
            "componentDesign":{
                "properties":{"checked":{"kind":"boolean","targetId":"indicator","default":false}},
                "behaviour":{"kind":"switch","defaultValue":false,
                    "stateBindings":[{"type":"property","propertyId":"checked"}]}
            },
            "children":[{"type":"rectangle","id":"indicator","width":20,"height":20}]
        },{"type":"ref","id":"instance","ref":"toggle","x":150,"width":120,"height":40}]
    }))
    .unwrap()
}

#[test]
fn component_behaviour_accepts_typed_contract() {
    let value = json!({"behaviour":{
        "kind":"switch","defaultValue":false,
        "stateBindings":[{"type":"property","propertyId":"checked"}]
    }});
    let design = serde_json::from_value::<ComponentDesign>(value.clone())
        .expect("typed component behaviour");
    assert_eq!(serde_json::to_value(design).unwrap(), value);
}

#[test]
fn component_behaviour_compiles_real_state_binding_and_independent_instances() {
    let original = doc();
    let compiled = compile_component_behaviour(&original).unwrap();
    assert_eq!(
        serde_json::to_value(&original).unwrap()["children"][0].get("state"),
        None
    );
    let resolved = op_editor_core::ref_resolve::resolve_refs_for_canvas(&compiled);
    let value = serde_json::to_value(resolved).unwrap();
    let master_key = op_editor_core::component_behaviour::state_key("toggle");
    let instance_key = op_editor_core::component_behaviour::state_key("instance");
    assert_eq!(value["state"][&master_key]["default"], false);
    assert_eq!(
        value["children"][0]["children"][0]["children"][0]["bindings"]["visible"],
        format!("$state.{master_key}")
    );
    assert_eq!(value["state"][&instance_key]["default"], false);
    assert_eq!(
        value["children"][1]["children"][0]["children"][0]["id"],
        "instance__indicator"
    );
    let document: jian_ops_schema::PenDocument = serde_json::from_value(value).unwrap();
    let controls = serde_json::to_value(
        op_editor_core::component_behaviour::document_nodes(&document)
            ["instance__toggle__behaviour_control"],
    )
    .unwrap();
    assert_eq!(controls["type"], "switch");
    assert_eq!(
        controls["bindings"]["bind:value"],
        format!("$state.{instance_key}")
    );
}

#[test]
fn component_behaviour_preview_click_changes_authored_visual_state_without_mutating_document() {
    use op_editor_core::prototype::{PropertyOverrideValue, PrototypePlayer};
    let mut document = doc();
    document.children = vec![serde_json::from_value(json!({
        "type":"frame","id":"board","width":400,"height":200,"layout":"none",
        "children":document.children
    }))
    .unwrap()];
    let before = serde_json::to_value(&document).unwrap();
    let mut player = PrototypePlayer::enter(&document, 0, None, (0.0, 0.0), 0).unwrap();
    assert_eq!(
        player.property_overrides.get("instance__indicator"),
        Some(&PropertyOverrideValue::Visible(false))
    );
    assert!(player.pointer_down(175.0, 20.0, 1));
    assert!(player.pointer_up(175.0, 20.0, 20));
    assert_eq!(
        player.property_overrides.get("instance__indicator"),
        Some(&PropertyOverrideValue::Visible(true))
    );
    assert_eq!(
        player.property_overrides.get("indicator"),
        Some(&PropertyOverrideValue::Visible(false))
    );
    assert_eq!(serde_json::to_value(&document).unwrap(), before);
}

#[test]
fn component_behaviour_tools_validate_real_ids_and_return_one_undoable_command() {
    use op_mcp::component_behaviour_tools::component_behaviour_snapshot;
    use op_mcp::{McpTool, ToolOutcome};
    let mut state = op_editor_core::EditorState::from_document(doc());
    let valid = json!({"kind":"checkbox","defaultValue":true,
        "stateBindings":[{"type":"property","propertyId":"checked"}]});
    let mut args = std::collections::BTreeMap::from([
        ("componentId".into(), "toggle".into()),
        ("behaviour".into(), valid.to_string()),
    ]);
    let before = state.doc.clone();
    let outcome = component_behaviour_snapshot(&state, "set_component_behaviour").call(&args);
    let ToolOutcome::OkJsonWithCommand(_, command) = outcome else {
        panic!("expected command");
    };
    let previous = state.snapshot_for_history();
    assert!(state.apply(command));
    state.history_push_past(previous);
    assert_ne!(state.doc, before);
    assert!(state.apply(op_editor_core::EditorCommand::Undo));
    assert_eq!(state.doc, before);
    args.insert(
        "behaviour".into(),
        json!({"kind":"checkbox","defaultValue":true,
        "stateBindings":[{"type":"property","propertyId":"not-an-id"}]})
        .to_string(),
    );
    assert!(matches!(
        component_behaviour_snapshot(&state, "set_component_behaviour").call(&args),
        ToolOutcome::Err(_, _)
    ));
    assert_eq!(state.doc, before);
}

#[test]
fn component_behaviour_codegen_emits_functional_state_and_aria_instead_of_metadata() {
    let document = doc();
    let html = op_codegen::generate_html_css_for_nodes(&document, &document.children);
    assert!(html.contains("role=\"switch\""));
    assert!(html.contains("aria-checked=\"false\""));
    assert!(html.contains("addEventListener('click'"));
    assert!(html.contains("data-op-visible"));
    assert!(html.contains("node.hidden"));
    let jsx = op_codegen::generate_tailwind_jsx_for_nodes(&document, &document.children);
    assert!(jsx.contains("useState(false)"));
    assert!(jsx.contains("aria-checked={value}"));
    assert!(jsx.contains("onClick={() => setValue(!value)}"));
    assert!(jsx.contains("value &&"));
    assert!(jsx.contains("export default function Design"));
}

fn behaviour_doc(kind: &str, default: serde_json::Value) -> jian_ops_schema::PenDocument {
    let mut value = serde_json::to_value(doc()).unwrap();
    value["children"].as_array_mut().unwrap().truncate(1);
    let master = &mut value["children"][0];
    master["componentDesign"]["behaviour"]["kind"] = json!(kind);
    master["componentDesign"]["behaviour"]["defaultValue"] = default;
    if kind == "slider" || kind == "tabs" {
        master["children"][0] = json!({"type":"text","id":"indicator","content":"initial",
            "width":60,"height":20});
        master["componentDesign"]["properties"]["checked"] =
            json!({"kind":"text","targetId":"indicator","default":"initial"});
    }
    if kind == "tabs" {
        master["componentDesign"]["behaviour"]["options"] = json!([
            {"value":"first","label":"First"},{"value":"second","label":"Second"}
        ]);
    }
    if kind == "slider" {
        master["componentDesign"]["behaviour"]["min"] = json!(0);
        master["componentDesign"]["behaviour"]["max"] = json!(100);
        master["componentDesign"]["behaviour"]["step"] = json!(10);
    }
    serde_json::from_value(value).unwrap()
}

fn preview(document: &jian_ops_schema::PenDocument) -> op_editor_core::prototype::PrototypePlayer {
    op_editor_core::prototype::PrototypePlayer::enter(document, 0, None, (0.0, 0.0), 0).unwrap()
}

#[test]
fn component_behaviour_keyboard_changes_all_supported_kinds_and_disabled_controls_do_not_change() {
    use op_editor_core::prototype::PropertyOverrideValue;
    for kind in ["switch", "checkbox"] {
        let document = behaviour_doc(kind, json!(false));
        let mut player = preview(&document);
        player.click_node("toggle", 10);
        assert_eq!(
            player.property_overrides.get("indicator"),
            Some(&PropertyOverrideValue::Visible(true)),
            "{kind} click must change visible authored state"
        );
        let mut disabled = serde_json::to_value(document).unwrap();
        disabled["children"][0]["componentDesign"]["behaviour"]["disabled"] = json!(true);
        let mut player = preview(&serde_json::from_value(disabled).unwrap());
        assert!(!player.click_node("toggle", 10));
        assert!(player.property_overrides.get("indicator").is_none());
    }
    for (kind, initial, expected) in [
        ("slider", json!(10), "20"),
        ("tabs", json!("first"), "second"),
    ] {
        let document = behaviour_doc(kind, initial);
        let mut player = preview(&document);
        player.click_node("toggle", 10);
        assert_eq!(
            player.property_overrides.get("indicator"),
            Some(&PropertyOverrideValue::Text(expected.to_string())),
            "{kind} click must change actual authored text"
        );
        let html = op_codegen::generate_html_css_for_nodes(&document, &document.children);
        let jsx = op_codegen::generate_tailwind_jsx_for_nodes(&document, &document.children);
        if kind == "slider" {
            assert!(html.contains("aria-valuenow=") && html.contains("addEventListener('input'"));
            assert!(jsx.contains("onChange={event => setValue(Number(event.target.value))}"));
        } else {
            assert!(html.contains("role=\"tab\"") && html.contains("role=\"tabpanel\""));
            assert!(jsx.contains("aria-selected={value ===") && jsx.contains("onKeyDown="));
        }
    }
}

#[test]
fn component_behaviour_pointer_selects_tabs_and_drags_slider() {
    use op_editor_core::prototype::PropertyOverrideValue;
    for (kind, initial, x, expected) in [
        ("tabs", json!("first"), 90.0, "second"),
        ("slider", json!(10), 60.0, "20"),
    ] {
        let document = behaviour_doc(kind, initial);
        let mut player = preview(&document);
        player.pointer_down(x, 15.0, 1);
        player.pointer_up(x, 15.0, 20);
        assert_eq!(
            player.property_overrides.get("indicator"),
            Some(&PropertyOverrideValue::Text(expected.to_string())),
            "{kind} pointer must change actual authored text"
        );
    }
}

#[test]
fn component_behaviour_button_is_momentary_not_a_toggle() {
    use op_editor_core::prototype::PropertyOverrideValue;
    let document = behaviour_doc("button", json!(false));
    let mut player = preview(&document);
    player.pointer_down(20.0, 15.0, 1);
    assert_eq!(
        player.property_overrides.get("indicator"),
        Some(&PropertyOverrideValue::Visible(true))
    );
    player.pointer_up(20.0, 15.0, 20);
    assert_eq!(
        player.property_overrides.get("indicator"),
        Some(&PropertyOverrideValue::Visible(false))
    );
}

#[test]
fn component_behaviour_variants_switch_real_subtrees_and_reject_unrelated_ids() {
    let mut value = serde_json::to_value(behaviour_doc("button", json!(false))).unwrap();
    let mut alternate = value["children"][0].clone();
    alternate["id"] = json!("active");
    alternate["componentDesign"] = json!({"variantOf":"toggle"});
    alternate["children"][0]["id"] = json!("active-indicator");
    value["children"].as_array_mut().unwrap().push(alternate);
    value["children"][0]["componentDesign"]["behaviour"]["stateBindings"] = json!([
        {"type":"variant","variantId":"toggle","value":false},
        {"type":"variant","variantId":"active","value":true}
    ]);
    let document: jian_ops_schema::PenDocument = serde_json::from_value(value.clone()).unwrap();
    let mut player = preview(&document);
    assert_eq!(
        player.variant_overrides.get("toggle").map(String::as_str),
        Some("toggle")
    );
    player.pointer_down(20.0, 15.0, 10);
    assert_eq!(
        player.variant_overrides.get("toggle").map(String::as_str),
        Some("active")
    );
    value["children"][1]["componentDesign"]["variantOf"] = json!("another-family");
    assert!(compile_component_behaviour(&serde_json::from_value(value).unwrap()).is_err());
}

#[test]
#[ignore = "requires Node; run with --include-ignored for export syntax validation"]
fn component_behaviour_html_scripts_parse_without_eval_or_literal_script_termination() {
    use std::io::Write;
    use std::process::{Command, Stdio};
    for kind in ["button", "switch", "checkbox", "tabs", "slider"] {
        let default = match kind {
            "slider" => json!(10),
            "tabs" => json!("first"),
            _ => json!(false),
        };
        let document = behaviour_doc(kind, default);
        let html = op_codegen::generate_html_css_for_nodes(&document, &document.children);
        let script = html
            .split("<script>")
            .nth(1)
            .unwrap()
            .split("</script>")
            .next()
            .unwrap();
        assert!(!script.contains("eval("));
        let mut child = Command::new("node")
            .arg("--check")
            .stdin(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .expect("node syntax validation");
        child
            .stdin
            .take()
            .unwrap()
            .write_all(script.as_bytes())
            .unwrap();
        let output = child.wait_with_output().unwrap();
        assert!(
            output.status.success(),
            "{kind}: {}",
            String::from_utf8_lossy(&output.stderr)
        );
    }
}

#[test]
fn component_behaviour_preserves_unbound_instance_properties_and_rejects_reserved_state_collision()
{
    let mut value = serde_json::to_value(doc()).unwrap();
    value["children"][0]["componentDesign"]["properties"]["label"] =
        json!({"kind":"text","targetId":"label","default":"Default"});
    value["children"][0]["children"]
        .as_array_mut()
        .unwrap()
        .push(json!({"type":"text","id":"label","content":"Default"}));
    value["children"][1]["componentValues"] = json!({"label":"Instance"});
    let document: jian_ops_schema::PenDocument = serde_json::from_value(value.clone()).unwrap();
    let compiled = compile_component_behaviour(&document).unwrap();
    let node = op_editor_core::component_behaviour::document_nodes(&compiled)["instance__label"];
    let jian_ops_schema::node::PenNode::Text(label) = node else {
        panic!("text property target");
    };
    assert_eq!(
        serde_json::to_value(&label.content).unwrap(),
        json!("Instance")
    );
    let key = op_editor_core::component_behaviour::state_key("instance");
    value["state"][&key] = json!({"type":"bool","default":true});
    assert!(
        compile_component_behaviour(&serde_json::from_value(value).unwrap()).is_err(),
        "behaviour must not overwrite an existing application state cell"
    );
}

#[test]
#[ignore = "requires Node and packages TypeScript; run with --include-ignored"]
fn component_behaviour_generated_react_is_valid_tsx() {
    use std::io::Write;
    use std::process::{Command, Stdio};
    for kind in ["button", "switch", "checkbox", "tabs", "slider"] {
        let default = match kind {
            "slider" => json!(10),
            "tabs" => json!("first"),
            _ => json!(false),
        };
        let document = behaviour_doc(kind, default);
        let jsx = op_codegen::generate_tailwind_jsx_for_nodes(&document, &document.children);
        let program = r#"
                const ts=require(require.resolve('typescript',{paths:['./packages']}));
                let source='';process.stdin.on('data',d=>source+=d);process.stdin.on('end',()=>{
                const result=ts.transpileModule(source,{fileName:'component.tsx',
                    reportDiagnostics:true,compilerOptions:{jsx:ts.JsxEmit.ReactJSX}});
                const errors=(result.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error);
                if(errors.length){console.error(errors.map(d=>ts.flattenDiagnosticMessageText(d.messageText,' ')));process.exit(1);}
                });
            "#;
        let mut child = Command::new("node")
            .args(["-e", program])
            .current_dir(
                std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
                    .ancestors()
                    .find(|path| path.join("packages/package.json").is_file())
                    .unwrap(),
            )
            .stdin(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .unwrap();
        child
            .stdin
            .take()
            .unwrap()
            .write_all(jsx.as_bytes())
            .unwrap();
        let output = child.wait_with_output().unwrap();
        assert!(
            output.status.success(),
            "{kind}: {}",
            String::from_utf8_lossy(&output.stderr)
        );
    }
}
