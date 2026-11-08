#[path = "../src/text_design.rs"]
mod text_design;

use jian_ops_schema::node::{PenNode, TextContent, TextNode};
use text_design::*;

fn template() -> TextNode {
    match serde_json::from_str::<PenNode>(
        r#"{"type":"text","id":"t","content":"Hello","fontSize":16,"width":240}"#,
    )
    .unwrap()
    {
        PenNode::Text(text) => text,
        _ => unreachable!(),
    }
}

#[test]
fn unicode_range_styles_split_runs_and_preserve_outside_styles() {
    let mut old = segment("A中🙂Z");
    old.underline = Some(true);
    let content = TextContent::Styled(vec![old]);
    let styled = styled_range(
        &content,
        1,
        3,
        &TextRangeStyle {
            font_weight: Some(700),
            underline: Some(false),
            ..Default::default()
        },
    )
    .unwrap();
    let TextContent::Styled(runs) = styled else {
        panic!("expected runs")
    };
    assert_eq!(
        runs.iter().map(|r| r.text.as_str()).collect::<Vec<_>>(),
        ["A", "中🙂", "Z"]
    );
    assert_eq!(runs[0].underline, Some(true));
    assert_eq!(runs[1].underline, Some(false));
    assert_eq!(runs[1].font_weight, Some(700));
    assert_eq!(runs[2].font_weight, None);
}

#[test]
fn range_styles_validate_bounds_and_values() {
    let content = TextContent::Plain("中🙂".into());
    assert!(styled_range(&content, 0, 3, &TextRangeStyle::default()).is_err());
    assert!(styled_range(&content, 2, 1, &TextRangeStyle::default()).is_err());
    assert!(styled_range(
        &content,
        0,
        1,
        &TextRangeStyle {
            font_size: Some(-1.0),
            ..Default::default()
        }
    )
    .is_err());
}

#[test]
fn markdown_builds_real_heading_paragraph_and_nested_list_layout() {
    let node = markdown_to_node(
        "# Title\n\nHello **bold** and *italic*.\n\n- first\n  - nested\n3. third",
        &template(),
        &MarkdownOptions::default(),
    )
    .unwrap();
    let value = serde_json::to_value(node).unwrap();
    assert_eq!(value["type"], "frame");
    assert_eq!(value["id"], "t");
    assert_eq!(value["layout"], "vertical");
    let children = value["children"].as_array().unwrap();
    assert_eq!(children.len(), 5);
    assert_eq!(children[0]["fontSize"], 32.0);
    assert_eq!(children[0]["fontWeight"], 700);
    assert_eq!(children[1]["content"][1]["text"], "bold");
    assert_eq!(children[1]["content"][1]["fontWeight"], 700);
    assert_eq!(children[2]["layout"], "horizontal");
    assert_eq!(children[2]["children"][0]["content"], "•");
    assert_eq!(children[3]["padding"][3], 24.0);
    assert_eq!(children[4]["children"][0]["content"], "3.");
}

#[test]
fn markdown_links_escapes_code_and_fences_are_real_text() {
    let node = markdown_to_node(
        "A [link](https://example.com) and \\*literal\\* `code`.\n\n```rust\nlet x = 1;\n```",
        &template(),
        &MarkdownOptions::default(),
    )
    .unwrap();
    let value = serde_json::to_value(node).unwrap();
    let runs: Vec<jian_ops_schema::style::StyledTextSegment> =
        serde_json::from_value(value["children"][0]["content"].clone()).unwrap();
    assert_eq!(
        plain_text(&TextContent::Styled(runs.clone())),
        "A link and *literal* code."
    );
    assert!(runs
        .iter()
        .any(|r| r.href.as_deref() == Some("https://example.com") && r.underline == Some(true)));
    assert_eq!(value["children"][1]["fontFamily"], "monospace");
    assert_eq!(value["children"][1]["content"], "let x = 1;");
}

#[test]
fn paragraph_spacing_and_hanging_list_indent_use_layout_not_metadata() {
    let node = paragraph_to_node(
        &template(),
        &ParagraphStyle {
            indent: 20.0,
            space_before: 4.0,
            space_after: 10.0,
            list: Some("ordered".into()),
            number: 7,
            line_height: Some(1.5),
            ..Default::default()
        },
    )
    .unwrap();
    let value = serde_json::to_value(node).unwrap();
    assert_eq!(value["layout"], "horizontal");
    assert_eq!(value["padding"], serde_json::json!([4.0, 0.0, 10.0, 20.0]));
    assert_eq!(value["children"][0]["content"], "7.");
    assert_eq!(value["children"][1]["width"], "fill_container");
    assert_eq!(value["children"][1]["lineHeight"], 1.5);
}

#[test]
fn inline_markdown_preserves_text_identity_geometry_and_node_styles() {
    let node: PenNode = serde_json::from_value(serde_json::json!({
        "type":"text", "id":"label", "content":"Before", "name":"Label",
        "x":12, "y":8, "width":180, "height":32, "rotation":5,
        "fontFamily":"Inter", "fontSize":18, "fontWeight":500,
        "lineHeight":1.6, "textGrowth":"fixed-width-height", "textAlign":"center",
        "fill":[{"type":"solid", "color":"#123456"}]
    }))
    .unwrap();
    let PenNode::Text(template) = &node else {
        unreachable!()
    };
    let mut expected = serde_json::to_value(&node).unwrap();
    expected["content"] = serde_json::json!([{"text":"Default", "fontWeight":700}]);
    let actual = markdown_to_node("**Default**", template, &MarkdownOptions::default()).unwrap();
    assert_eq!(serde_json::to_value(actual).unwrap(), expected);
}

#[test]
fn nested_emphasis_keeps_inner_styles_and_removes_all_delimiters() {
    let node = markdown_to_node(
        "**strong *both*** and *italic **both***",
        &template(),
        &MarkdownOptions::default(),
    )
    .unwrap();
    let value = serde_json::to_value(node).unwrap();
    let runs: Vec<jian_ops_schema::style::StyledTextSegment> =
        serde_json::from_value(value["content"].clone()).unwrap();
    assert_eq!(
        plain_text(&TextContent::Styled(runs.clone())),
        "strong both and italic both"
    );
    let both: Vec<_> = runs.iter().filter(|r| r.text.contains("both")).collect();
    assert_eq!(both.len(), 2);
    assert!(both.iter().all(|r| r.font_weight == Some(700)
        && r.font_style == Some(jian_ops_schema::style::FontStyleKind::Italic)));
}
