use super::*;
use op_editor_core::PenNodeExt;

fn state() -> EditorState {
    let mut state = EditorState::default();
    state.doc.children = vec![serde_json::from_str(
        r#"{"type":"text","id":"t","content":"A中🙂Z","fontSize":16,"width":240}"#,
    )
    .unwrap()];
    state
}

fn args(pairs: &[(&str, &str)]) -> BTreeMap<String, String> {
    pairs
        .iter()
        .map(|(k, v)| (k.to_string(), v.to_string()))
        .collect()
}

fn apply(state: &mut EditorState, outcome: ToolOutcome) {
    match outcome {
        ToolOutcome::OkJsonWithCommand(_, command) => {
            assert!(state.apply(command));
        }
        _ => panic!("expected write command, got {outcome:?}"),
    }
}

#[test]
fn mcp_range_style_roundtrip_preserves_text_and_supports_undo() {
    let mut state = state();
    let outcome = set_text_style_snapshot(&state).call(&args(&[
        ("nodeId", "t"),
        ("start", "1"),
        ("end", "3"),
        (
            "style",
            r#"{"fontFamily":"Georgia","fontWeight":700,"underline":true}"#,
        ),
    ]));
    apply(&mut state, outcome);
    let ToolOutcome::OkJson(json) = get_text_style_snapshot(&state).call(&args(&[
        ("nodeId", "t"),
        ("start", "1"),
        ("end", "3"),
    ])) else {
        panic!("expected JSON");
    };
    let json: serde_json::Value = serde_json::from_str(&json).unwrap();
    assert_eq!(json["text"], "中🙂");
    assert_eq!(json["runs"][0]["fontWeight"], 700);
    assert_eq!(json["runs"][0]["fontFamily"], "Georgia");
    let schema = text_design_tool_schema("set_text_style").unwrap();
    assert_eq!(
        schema["properties"]["style"]["properties"]["fontFamily"]["type"],
        "string"
    );
    state.apply(EditorCommand::Undo);
    assert_eq!(state.doc.children[0].base().id, "t");
    let PenNode::Text(text) = &state.doc.children[0] else {
        panic!("expected text")
    };
    assert_eq!(text.content, TextContent::Plain("A中🙂Z".into()));
}

#[test]
fn markdown_tool_produces_editable_canonical_nodes_with_unique_ids() {
    let mut state = state();
    let outcome = set_text_markdown_snapshot(&state).call(&args(&[
        ("nodeId", "t"),
        ("markdown", "# Hello\n\n- **bold**\n- world"),
    ]));
    apply(&mut state, outcome);
    let PenNode::Frame(frame) = &state.doc.children[0] else {
        panic!("expected frame")
    };
    assert_eq!(frame.base.id, "t");
    assert_eq!(frame.children.as_ref().unwrap().len(), 3);
    let mut seen = std::collections::HashSet::new();
    assert!(op_editor_core::walkers::find_duplicate(state.active_children(), &mut seen).is_none());
}

#[test]
fn range_font_family_clears_to_inheritance_and_rejects_control_characters() {
    let mut state = state();
    for family in ["Georgia", ""] {
        let style = serde_json::json!({"fontFamily":family}).to_string();
        let outcome =
            set_text_style_snapshot(&state).call(&args(&[("nodeId", "t"), ("style", &style)]));
        apply(&mut state, outcome);
        let value = serde_json::to_value(&state.doc.children[0]).unwrap();
        if family.is_empty() {
            assert!(value["content"][0].get("fontFamily").is_none());
        } else {
            assert_eq!(value["content"][0]["fontFamily"], family);
        }
    }
    let before = state.doc.clone();
    assert!(matches!(
        set_text_style_snapshot(&state).call(&args(&[
            ("nodeId", "t"),
            ("style", r#"{"fontFamily":"bad\nfamily"}"#),
        ])),
        ToolOutcome::Err(ToolErrorCode::InvalidArgument, _)
    ));
    assert_eq!(state.doc, before);
}

#[test]
fn malformed_style_and_wrong_target_return_errors_without_commands() {
    let state = state();
    assert!(matches!(
        set_text_style_snapshot(&state).call(&args(&[
            ("nodeId", "t"),
            ("start", "0"),
            ("end", "2"),
            ("style", r#"{"fontSize":-1}"#),
        ])),
        ToolOutcome::Err(ToolErrorCode::InvalidArgument, _)
    ));
    assert!(matches!(
        set_text_style_snapshot(&state).call(&args(&[("nodeId", "missing"), ("style", "{}"),])),
        ToolOutcome::Err(_, _)
    ));
}

#[test]
fn paragraph_tool_reapplies_generated_list_without_nesting_and_keeps_body_addressable() {
    let mut state = state();
    for style in [
        r#"{"indent":24,"list":"ordered","number":3}"#,
        r#"{"indent":6,"spaceAfter":8,"list":"none"}"#,
    ] {
        let outcome =
            set_paragraph_style_snapshot(&state).call(&args(&[("nodeId", "t"), ("style", style)]));
        apply(&mut state, outcome);
        assert!(matches!(
            get_text_style_snapshot(&state).call(&args(&[("nodeId", "t")])),
            ToolOutcome::OkJson(_)
        ));
    }
    let value = serde_json::to_value(&state.doc.children[0]).unwrap();
    assert_eq!(value["id"], "t");
    assert_eq!(value["padding"][3], 6.0);
    assert_eq!(value["children"].as_array().unwrap().len(), 1);
    assert_eq!(value["children"][0]["type"], "text");
}

#[test]
fn paragraph_tool_changes_real_list_spacing_and_line_height() {
    let mut state = state();
    let outcome = set_paragraph_style_snapshot(&state).call(&args(&[
        ("nodeId", "t"),
        (
            "style",
            r#"{"indent":18,"spaceAfter":8,"lineHeight":1.5,"list":"bullet"}"#,
        ),
    ]));
    apply(&mut state, outcome);
    let value = serde_json::to_value(&state.doc.children[0]).unwrap();
    assert_eq!(value["padding"][3], 18.0);
    assert_eq!(value["children"][0]["content"], "•");
    assert_eq!(value["children"][1]["lineHeight"], 1.5);
}

#[test]
fn markdown_reaches_real_scene_layout_and_html_export() {
    use op_codegen::Codegen;
    let mut state = state();
    let outcome = set_text_markdown_snapshot(&state).call(&args(&[
        ("nodeId","t"),
        ("markdown","# Heading\n\n- A **bold** item with enough text to wrap around onto another line\n  - *nested* item"),
    ]));
    apply(&mut state, outcome);
    let scene = op_pen_loader::editor_state_to_layout_scene(&state);
    let root = &scene.pages[0].children[0];
    let heading = &root.children[0];
    let first_row = &root.children[1];
    let nested_row = &root.children[2];
    assert_eq!(heading.text.as_deref(), Some("Heading"));
    assert_eq!(heading.font_weight, 700);
    assert_eq!(heading.font_size, 32.0);
    assert!(first_row.bounds.origin.y > heading.bounds.origin.y);
    assert_eq!(first_row.children[0].text.as_deref(), Some("•"));
    assert!(first_row.children[1].bounds.origin.x > first_row.children[0].bounds.origin.x);
    assert!(first_row.children[1].bounds.size.y > 16.0 * 1.4);
    assert!(first_row.children[1]
        .text_runs
        .iter()
        .any(|r| r.font_weight == 700));
    assert!(nested_row.children[0].bounds.origin.x > first_row.children[0].bounds.origin.x);
    assert!(
        nested_row.children[1].italic || nested_row.children[1].text_runs.iter().any(|r| r.italic)
    );
    let html = op_codegen::HtmlCss.generate(&state.doc);
    assert!(html.contains("display: flex"), "{html}");
    assert!(html.contains("flex-direction: column"), "{html}");
    assert!(html.contains("font-weight: 700"), "{html}");
    assert!(html.contains("font-style: italic"), "{html}");
}

#[test]
fn plain_content_and_repeated_markdown_updates_preserve_root_id() {
    let mut state = state();
    let outcome = set_text_content_snapshot(&state)
        .call(&args(&[("nodeId", "t"), ("content", "Plain replacement")]));
    apply(&mut state, outcome);
    for markdown in ["# First\n\nParagraph", "# Second\n\nUpdated"] {
        let outcome = set_text_markdown_snapshot(&state)
            .call(&args(&[("nodeId", "t"), ("markdown", markdown)]));
        apply(&mut state, outcome);
        assert_eq!(state.doc.children[0].id_str(), "t");
    }
    let scene = op_pen_loader::editor_state_to_layout_scene(&state);
    assert_eq!(
        scene.pages[0].children[0].children[0].text.as_deref(),
        Some("Second")
    );
    assert_eq!(
        scene.pages[0].children[0].children[1].text.as_deref(),
        Some("Updated")
    );
}

#[test]
fn markdown_replacement_keeps_text_ink_out_of_wrapper_background() {
    let mut state = state();
    state.doc.children[0] = serde_json::from_str(
        r##"{"type":"text","id":"t","content":"Old","fontSize":16,"width":240,
             "fill":[{"type":"solid","color":"#112233"}]}"##,
    )
    .unwrap();
    let outcome =
        set_text_markdown_snapshot(&state).call(&args(&[("nodeId", "t"), ("markdown", "# New")]));
    apply(&mut state, outcome);
    let PenNode::Frame(root) = &state.doc.children[0] else {
        panic!("expected frame")
    };
    assert!(root.container.fill.is_none());
    let PenNode::Text(text) = &root.children.as_ref().unwrap()[0] else {
        panic!("expected text")
    };
    assert!(text.fill.is_some());
}

#[test]
fn repeated_heading_markdown_does_not_multiply_font_size() {
    let mut state = state();
    for markdown in ["# First", "# Second", "# Third"] {
        let outcome = set_text_markdown_snapshot(&state)
            .call(&args(&[("nodeId", "t"), ("markdown", markdown)]));
        apply(&mut state, outcome);
        let PenNode::Frame(root) = &state.doc.children[0] else {
            panic!("expected frame")
        };
        let PenNode::Text(text) = &root.children.as_ref().unwrap()[0] else {
            panic!("expected text")
        };
        assert_eq!(text.font_size, Some(32.0));
    }
}

#[test]
fn stale_markdown_snapshot_collision_rejects_batch_atomically() {
    let mut state = state();
    let tool = set_text_markdown_snapshot(&state);
    state.doc.children.push(
        serde_json::from_str(r#"{"type":"rectangle","id":"n1","width":10,"height":10}"#).unwrap(),
    );
    let before = state.doc.clone();
    let ToolOutcome::OkJsonWithCommand(_, command) =
        tool.call(&args(&[("nodeId", "t"), ("markdown", "# Heading")]))
    else {
        panic!("expected batch")
    };
    assert!(!state.apply(command));
    assert_eq!(state.doc, before);
}

fn component_text_state() -> EditorState {
    let mut state = EditorState::default();
    state.doc.children = serde_json::from_value(json!([
        {
            "type":"frame", "id":"button", "reusable":true,
            "width":200, "height":48,
            "componentDesign":{"properties":{
                "Label":{"kind":"text", "targetId":"label", "default":"Default"}
            }},
            "children":[{
                "type":"text", "id":"label", "content":"Default",
                "x":12, "y":8, "width":180, "height":32, "fontSize":18
            }]
        },
        {"type":"ref", "id":"instance", "ref":"button", "x":240,
         "componentValues":{"Label":"Continue"}}
    ]))
    .unwrap();
    state
}

#[test]
fn inline_markdown_preserves_component_text_target_and_instance_value() {
    for target in ["label", "button"] {
        let mut state = component_text_state();
        let before = state.doc.clone();
        let outcome = set_text_markdown_snapshot(&state)
            .call(&args(&[("nodeId", target), ("markdown", "**Default**")]));
        apply(&mut state, outcome);
        let label =
            op_editor_core::walkers::find_node(state.active_children(), &NodeId::new("label"))
                .unwrap();
        let PenNode::Text(label) = label else {
            panic!("component text property target must remain Text")
        };
        let TextContent::Styled(runs) = &label.content else {
            panic!("expected styled inline content")
        };
        assert_eq!(runs[0].text, "Default");
        assert_eq!(runs[0].font_weight, Some(700));
        let scene = op_pen_loader::editor_state_to_layout_scene(&state);
        assert_eq!(
            scene.pages[0].children[1].children[0].text.as_deref(),
            Some("Continue")
        );
        assert!(state.apply(EditorCommand::Undo));
        assert_eq!(state.doc, before);
    }
}

#[test]
fn block_markdown_rejects_component_text_target_without_changes() {
    let state = component_text_state();
    let before = state.doc.clone();
    for target in ["label", "button"] {
        for markdown in ["# Default", "First\n\nSecond", "- Default"] {
            for outcome in [
                set_text_markdown_snapshot(&state)
                    .call(&args(&[("nodeId", target), ("markdown", markdown)])),
                set_text_content_snapshot(&state).call(&args(&[
                    ("nodeId", target),
                    ("content", markdown),
                    ("format", "markdown"),
                ])),
            ] {
                let ToolOutcome::Err(ToolErrorCode::InvalidArgument, message) = outcome else {
                    panic!("block conversion must reject a component text target: {outcome:?}")
                };
                assert!(message.contains("component") && message.contains("label"));
                assert_eq!(state.doc, before);
            }
        }
    }
    let scene = op_pen_loader::editor_state_to_layout_scene(&state);
    assert_eq!(
        scene.pages[0].children[1].children[0].text.as_deref(),
        Some("Continue")
    );
}

#[test]
fn markdown_container_replacement_cannot_remove_component_text_target() {
    let mut state = component_text_state();
    state.doc.children[0].children_mut().unwrap().push(
        serde_json::from_value(json!({
            "type":"text", "id":"shortcut", "content":"Enter"
        }))
        .unwrap(),
    );
    let before = state.doc.clone();
    for markdown in ["**Default**", "# Default"] {
        assert!(matches!(
            set_text_markdown_snapshot(&state)
                .call(&args(&[("nodeId", "button"), ("markdown", markdown)])),
            ToolOutcome::Err(ToolErrorCode::InvalidArgument, _)
        ));
        assert_eq!(state.doc, before);
    }
}
