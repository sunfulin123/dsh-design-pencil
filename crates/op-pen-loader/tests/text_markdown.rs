#[path = "../../op-editor-core/src/text_design.rs"]
pub mod text_design;

use jian_ops_schema::node::{PenNode, TextNode};
use op_editor_core::EditorState;
use text_design::{markdown_to_node, MarkdownOptions};

fn template() -> TextNode {
    let node: PenNode =
        serde_json::from_str(r#"{"type":"text","id":"t","content":"","width":240,"fontSize":16}"#)
            .unwrap();
    match node {
        PenNode::Text(text) => text,
        _ => unreachable!(),
    }
}

#[test]
fn markdown_layout_has_measured_paragraphs_styled_runs_and_hanging_indentation() {
    let mut state = EditorState::default();
    state.doc.children = vec![markdown_to_node(
        "# Heading\n\n- A **bold** item with enough words to wrap around onto another line\n  - *nested* item",
        &template(), &MarkdownOptions::default(),
    ).unwrap()];
    let scene = op_pen_loader::editor_state_to_layout_scene(&state);
    let root = &scene.pages[0].children[0];
    let heading = &root.children[0];
    let first = &root.children[1];
    let nested = &root.children[2];
    assert_eq!(heading.text.as_deref(), Some("Heading"));
    assert_eq!(heading.font_weight, 700);
    assert_eq!(heading.font_size, 32.0);
    assert!(first.bounds.origin.y >= heading.bounds.origin.y + heading.bounds.size.y + 8.0);
    assert_eq!(first.children[0].text.as_deref(), Some("•"));
    assert!(first.children[1].bounds.origin.x > first.children[0].bounds.origin.x);
    assert!(first.children[1].bounds.size.y > 16.0 * 1.4);
    assert!(first.children[1]
        .text_runs
        .iter()
        .any(|r| r.font_weight == 700));
    assert!(nested.children[0].bounds.origin.x > first.children[0].bounds.origin.x);
    assert!(nested.children[1].text_runs.iter().any(|r| r.italic));
}
