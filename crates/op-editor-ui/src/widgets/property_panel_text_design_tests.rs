use super::property_panel_commit::{commit_property_focus, property_focus_initial};
use super::property_panel_dispatch::{apply_property_action, PropertyActionContext};
use super::{PropertyPanel, PropertyPanelAction};
use crate::{Point2D, Rect};
use jian_ops_schema::node::{PenNode, TextContent};
use op_editor_core::{EditorState, NodeId, PenNodeExt, PropertyFocus};

fn state() -> EditorState {
    let mut state = EditorState::sample();
    state.doc.children = vec![serde_json::from_str::<PenNode>(
        r#"{"type":"text","id":"t","content":"A中🙂Z","fontSize":16,"width":240}"#,
    )
    .unwrap()];
    state.selection.set = vec![NodeId::new("t")];
    state.selection.anchor = NodeId::new("t");
    state
}

fn dispatch(state: &mut EditorState, action: PropertyPanelAction) {
    apply_property_action(
        state,
        &action,
        PropertyActionContext {
            now_ms: 10,
            resolved_sizing_fallback: None,
            image_adjustment_drag: &mut None,
            effect_radius_drag: &mut None,
        },
    );
}

#[test]
fn truncation_controls_preserve_text_and_are_undoable() {
    let mut state = state();
    dispatch(&mut state, PropertyPanelAction::SetTextTruncation(2));
    let node = serde_json::to_value(state.selected_node().unwrap()).unwrap();
    assert_eq!(node["textTruncation"], "ending");
    assert_eq!(node["maxLines"], 2);
    assert_eq!(node["content"], "A中🙂Z");
    assert!(state.apply(op_editor_core::EditorCommand::Undo));
    assert!(serde_json::to_value(state.selected_node().unwrap())
        .unwrap()
        .get("textTruncation")
        .is_none());
}

fn draft(state: &mut EditorState, index: usize, value: &str) {
    state.ui.property_focus = Some(PropertyFocus::TextDesign(index));
    state.ui.property_input.set_text(value);
    assert!(commit_property_focus(state));
}

#[test]
fn text_design_list_reselection_reads_layout_and_incumbent_content_input_edits_body() {
    let mut state = state();
    draft(&mut state, 7, "24");
    draft(&mut state, 8, "8");
    draft(&mut state, 11, "1.5");
    dispatch(&mut state, PropertyPanelAction::SetTextParagraphList(2));
    dispatch(&mut state, PropertyPanelAction::ApplyTextParagraph);
    state.ui.text_inspector = Default::default();
    let panel = PropertyPanel::for_selection(&state).unwrap();
    assert_eq!(panel.text_inspector.list, 2);
    assert_eq!(
        property_focus_initial(PropertyFocus::TextDesign(7), &panel),
        "24"
    );
    assert_eq!(
        property_focus_initial(PropertyFocus::TextDesign(8), &panel),
        "8"
    );
    assert_eq!(
        property_focus_initial(PropertyFocus::TextDesign(11), &panel),
        "1.5"
    );
    state.ui.property_focus = Some(PropertyFocus::TextContent);
    state.ui.property_input.set_text("新🙂");
    commit_property_focus(&mut state);
    let value = serde_json::to_value(state.selected_node().unwrap()).unwrap();
    assert_eq!(value["children"][0]["content"], "1.");
    assert_eq!(value["children"][1]["content"], "新🙂");
}

#[test]
fn text_design_list_remains_inspectable_and_reapplication_replaces_layout_not_nests() {
    let mut state = state();
    let before = state.doc.clone();
    draft(&mut state, 7, "24");
    dispatch(&mut state, PropertyPanelAction::SetTextParagraphList(2));
    dispatch(&mut state, PropertyPanelAction::ApplyTextParagraph);
    let panel = PropertyPanel::for_selection(&state).unwrap();
    assert!(
        panel.snapshot.text.is_some(),
        "list body must remain inspectable"
    );
    draft(&mut state, 7, "10");
    dispatch(&mut state, PropertyPanelAction::SetTextParagraphList(0));
    dispatch(&mut state, PropertyPanelAction::ApplyTextParagraph);
    let value = serde_json::to_value(state.selected_node().unwrap()).unwrap();
    assert_eq!(value["id"], "t");
    assert_eq!(value["padding"][3], 10.0);
    assert_eq!(value["children"].as_array().unwrap().len(), 1);
    assert_eq!(value["children"][0]["type"], "text");
    assert!(state.undo());
    assert!(state.undo());
    assert_eq!(state.doc, before);
    assert!(!state.history.can_undo());
}

#[test]
fn text_design_range_dispatch_uses_scalar_offsets_and_one_undo() {
    let mut state = state();
    let before = state.doc.clone();
    draft(&mut state, 1, "1");
    draft(&mut state, 2, "3");
    draft(&mut state, 4, "700");
    draft(&mut state, 12, "Georgia");
    assert!(
        !state.history.can_undo(),
        "draft edits must not create history"
    );
    dispatch(&mut state, PropertyPanelAction::ApplyTextRange);
    let PenNode::Text(text) = state.selected_node().unwrap() else {
        panic!()
    };
    let TextContent::Styled(runs) = &text.content else {
        panic!()
    };
    assert_eq!(runs[1].text, "中🙂");
    assert_eq!(runs[1].font_weight, Some(700));
    assert_eq!(runs[1].font_family.as_deref(), Some("Georgia"));
    assert!(state.undo());
    assert_eq!(state.doc, before);
}

#[test]
fn text_design_markdown_and_paragraph_dispatch_are_atomic() {
    for (action, field, value) in [
        (
            PropertyPanelAction::ApplyTextMarkdown,
            0,
            "# 标题\n\n**Hello**",
        ),
        (PropertyPanelAction::ApplyTextParagraph, 7, "24"),
    ] {
        let mut state = state();
        let before = state.doc.clone();
        draft(&mut state, field, value);
        dispatch(&mut state, action);
        assert!(matches!(state.selected_node(), Some(PenNode::Frame(_))));
        assert!(state.undo());
        assert_eq!(state.doc, before);
    }
}

#[test]
fn text_design_invalid_locked_and_multiple_targets_do_not_write() {
    for case in 0..3 {
        let mut state = state();
        draft(&mut state, 2, "99");
        if case == 1 {
            state.doc.children[0].base_mut().locked = Some(true);
        } else if case == 2 {
            state.selection.set.push(NodeId::new("other"));
        }
        let before = state.doc.clone();
        dispatch(&mut state, PropertyPanelAction::ApplyTextRange);
        assert_eq!(state.doc, before);
        assert!(!state.history.can_undo());
        assert!(state.editor_ui.editor_toast.is_some());
    }
}

#[test]
fn text_design_controls_are_hit_reachable_after_scrolling_and_seed_drafts() {
    let state = state();
    let panel = PropertyPanel::for_selection(&state).unwrap();
    let rect = Rect {
        origin: Point2D::new(0.0, 0.0),
        size: Point2D::new(280.0, 4000.0),
    };
    let actions = [
        PropertyPanelAction::ApplyTextMarkdown,
        PropertyPanelAction::ApplyTextRange,
        PropertyPanelAction::ApplyTextParagraph,
    ];
    for expected in actions {
        let found = (40..2500).any(|y| {
            panel.hit_test_action(rect, Point2D::new(100.0, y as f32)) == Some(expected.clone())
        });
        assert!(found, "missing reachable {expected:?}");
    }
    let focus = PropertyFocus::TextDesign(2);
    assert_eq!(property_focus_initial(focus, &panel), "4");
    assert!((40..2500).any(|y| panel.hit_test(rect, Point2D::new(215.0, y as f32)) == Some(focus)));
}

#[test]
fn text_design_host_route_rejects_component_instance_before_redirect_with_fresh_toast() {
    let mut state = state();
    state.doc.children = serde_json::from_value(serde_json::json!([
        {"type":"text", "id":"master", "reusable":true, "content":"Original"},
        {"type":"ref", "id":"t", "ref":"master"}
    ]))
    .unwrap();
    let before = state.doc.clone();
    let action = PropertyPanelAction::ApplyTextMarkdown;
    super::property_panel_dispatch::apply_instance_lifecycle_action(&mut state, &action);
    let scope = state.begin_instance_write_for_anchor();
    assert!(scope.is_some());
    apply_property_action(
        &mut state,
        &action,
        PropertyActionContext {
            now_ms: 100_000,
            resolved_sizing_fallback: None,
            image_adjustment_drag: &mut None,
            effect_radius_drag: &mut None,
        },
    );
    state.finish_instance_write(scope.unwrap());
    assert_eq!(state.doc, before);
    assert!(!state.history.can_undo());
    assert!(state.editor_ui.visible_toast(100_001).is_some());
}

#[test]
fn text_design_scrolled_control_hit_dispatches_markdown_and_undoes() {
    let mut state = state();
    draft(&mut state, 0, "**中🙂**");
    let before = state.doc.clone();
    let rect = Rect::xywh(0.0, 0.0, 280.0, 460.0);
    state.editor_ui.property_panel_scroll.offset = 640.0;
    let panel = PropertyPanel::for_selection(&state).unwrap();
    let action = (40..450)
        .find_map(|y| {
            panel
                .hit_test_action(rect, Point2D::new(100.0, y as f32))
                .filter(|action| *action == PropertyPanelAction::ApplyTextMarkdown)
        })
        .expect("Markdown button must be reachable through the panel viewport");
    dispatch(&mut state, action);
    let PenNode::Text(text) = state.selected_node().unwrap() else {
        panic!()
    };
    let TextContent::Styled(runs) = &text.content else {
        panic!()
    };
    assert_eq!(runs[0].text, "中🙂");
    assert_eq!(runs[0].font_weight, Some(700));
    assert!(state.undo());
    assert_eq!(state.doc, before);
}

#[test]
fn text_design_range_form_styles_only_requested_attributes_and_rejects_bad_links() {
    let mut state = state();
    draft(&mut state, 1, "1");
    draft(&mut state, 2, "3");
    draft(&mut state, 3, "24");
    draft(&mut state, 5, "#FF0000");
    draft(&mut state, 6, "javascript:alert(1)");
    let before = state.doc.clone();
    dispatch(&mut state, PropertyPanelAction::ApplyTextRange);
    assert_eq!(state.doc, before);
    assert!(!state.history.can_undo());
    draft(&mut state, 6, "https://example.com");
    dispatch(&mut state, PropertyPanelAction::CycleTextRangeFlag(0));
    dispatch(&mut state, PropertyPanelAction::CycleTextRangeFlag(1));
    dispatch(&mut state, PropertyPanelAction::CycleTextRangeFlag(2));
    dispatch(&mut state, PropertyPanelAction::ApplyTextRange);
    let PenNode::Text(text) = state.selected_node().unwrap() else {
        panic!()
    };
    let TextContent::Styled(runs) = &text.content else {
        panic!()
    };
    let run = &runs[1];
    assert_eq!(run.text, "中🙂");
    assert_eq!(run.font_size, Some(24.0));
    assert_eq!(run.fill.as_deref(), Some("#FF0000"));
    assert_eq!(run.href.as_deref(), Some("https://example.com"));
    assert_eq!(run.underline, Some(true));
    assert_eq!(run.strikethrough, Some(true));
    assert_eq!(
        run.font_style,
        Some(jian_ops_schema::style::FontStyleKind::Italic)
    );
    assert_eq!(runs[0].font_size, None);
    assert!(state.undo());
    assert_eq!(state.doc, before);
}

#[test]
fn text_design_paragraph_form_produces_real_list_padding_and_line_height() {
    let mut state = state();
    draft(&mut state, 7, "24");
    draft(&mut state, 8, "8");
    draft(&mut state, 9, "12");
    draft(&mut state, 10, "3");
    draft(&mut state, 11, "1.5");
    dispatch(&mut state, PropertyPanelAction::SetTextParagraphList(2));
    dispatch(&mut state, PropertyPanelAction::ApplyTextParagraph);
    let value = serde_json::to_value(state.selected_node().unwrap()).unwrap();
    assert_eq!(value["padding"], serde_json::json!([8.0, 0.0, 12.0, 24.0]));
    assert_eq!(value["children"][0]["content"], "3.");
    assert_eq!(value["children"][1]["content"], "A中🙂Z");
    assert_eq!(value["children"][1]["lineHeight"], 1.5);
}

#[test]
fn text_design_component_text_target_allows_inline_but_rejects_blocks() {
    for (markdown, allowed) in [("**中🙂**", true), ("# Heading\n\nParagraph", false)] {
        let mut state = state();
        state.doc.children = serde_json::from_value(serde_json::json!([{
            "type":"frame", "id":"component", "reusable":true,
            "componentDesign":{"properties":{
                "Label":{"kind":"text", "targetId":"t", "default":"A中🙂Z"}
            }},
            "children":[{"type":"text", "id":"t", "content":"A中🙂Z"}]
        }]))
        .unwrap();
        draft(&mut state, 0, markdown);
        let before = state.doc.clone();
        dispatch(&mut state, PropertyPanelAction::ApplyTextMarkdown);
        assert_eq!(state.doc != before, allowed);
        assert_eq!(state.history.can_undo(), allowed);
        if !allowed {
            assert!(state.editor_ui.editor_toast.is_some());
        }
    }
}

#[test]
fn text_design_drafts_reset_for_new_selection_and_disabled_controls_are_inert() {
    let mut state = state();
    draft(&mut state, 4, "700");
    state.doc.children.push(
        serde_json::from_str::<PenNode>(r#"{"type":"text","id":"other","content":"另一🙂"}"#)
            .unwrap(),
    );
    state.selection.set = vec![NodeId::new("other")];
    state.selection.anchor = NodeId::new("other");
    let panel = PropertyPanel::for_selection(&state).unwrap();
    assert_eq!(
        property_focus_initial(PropertyFocus::TextDesign(2), &panel),
        "3"
    );
    assert_eq!(
        property_focus_initial(PropertyFocus::TextDesign(4), &panel),
        ""
    );
    assert!(PropertyFocus::TextDesign(0).is_free_text());
    state.doc.children[1].base_mut().locked = Some(true);
    let panel = PropertyPanel::for_selection(&state).unwrap();
    let rect = Rect::xywh(0.0, 0.0, 280.0, 4000.0);
    for y in 40..2500 {
        assert!(!matches!(
            panel.hit_test(rect, Point2D::new(215.0, y as f32)),
            Some(PropertyFocus::TextDesign(_))
        ));
        assert!(!panel
            .hit_test_action(rect, Point2D::new(100.0, y as f32))
            .is_some_and(|a| super::property_panel_text_design::is_action(&a)));
    }
}
