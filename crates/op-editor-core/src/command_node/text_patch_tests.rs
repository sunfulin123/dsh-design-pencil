use super::*;
use crate::test_support::{frame, rect, text};

#[test]
fn invalid_inner_text_rejects_outer_patch_without_mutating_document() {
    let mut state = EditorState::default();
    state.doc.children = vec![frame(
        "wrapper",
        "Original",
        0.0,
        0.0,
        200.0,
        40.0,
        vec![text("label", "Label", 0.0, 0.0, 200.0, 40.0, "Hello")],
    )];
    let before = state.doc.clone();
    assert!(!state.cmd_patch_node_data(
        &NodeId::new("wrapper"),
        r#"{"name":"Changed","fontSize":"invalid"}"#,
    ));
    assert_eq!(state.doc, before);
}

#[test]
fn valid_outer_and_inner_text_patch_applies_together() {
    let mut state = EditorState::default();
    state.doc.children = vec![frame(
        "wrapper",
        "Original",
        0.0,
        0.0,
        200.0,
        40.0,
        vec![text("label", "Label", 0.0, 0.0, 200.0, 40.0, "Hello")],
    )];
    assert!(state.cmd_patch_node_data(
        &NodeId::new("wrapper"),
        r#"{"name":"Changed","fontSize":24,"content":"World"}"#,
    ));
    assert_eq!(
        state.doc.children[0].base().name.as_deref(),
        Some("Changed")
    );
    let inner = crate::command_node_attrs::resolve_text_node(&state.doc.children[0]).unwrap();
    assert_eq!(inner.font_size, Some(24.0));
    assert_eq!(
        inner.content,
        jian_ops_schema::node::TextContent::Plain("World".into())
    );
}

#[test]
fn replacement_subtree_id_collision_rejects_entire_patch() {
    let mut state = EditorState::default();
    state.doc.children = vec![
        text("t", "Text", 0.0, 0.0, 200.0, 40.0, "Hello"),
        rect("n1", "Existing", 0.0, 0.0, 10.0, 10.0),
    ];
    let before = state.doc.clone();
    assert!(!state.cmd_patch_node_data(
        &NodeId::new("t"),
        r#"{"type":"frame","name":"Markdown","children":[{"type":"text","id":"n1","content":"Collision"}]}"#,
    ));
    assert_eq!(state.doc, before);
}
