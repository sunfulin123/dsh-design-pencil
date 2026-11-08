use crate::{Codegen, DesignJsx, HtmlCss, TailwindJsx};
use jian_ops_schema::{node::PenNode, PenDocument};

#[test]
fn deterministic_exports_preserve_inline_styles_links_and_newlines() {
    let node: PenNode = serde_json::from_str(r##"{
        "type":"text","id":"t","content":[
          {"text":"Bold <&>","fontWeight":700,"fontSize":24,"fill":"#ff0000"},
          {"text":"\nLink","fontStyle":"italic","underline":true,"href":"https://example.com/?a=1&b=2"},
          {"text":" gone","strikethrough":true}
        ]
    }"##).unwrap();
    let doc: PenDocument =
        serde_json::from_value(serde_json::json!({"version":"1.0.0","children":[node]})).unwrap();
    let html = HtmlCss.generate(&doc);
    assert!(html.contains("font-weight: 700"), "{html}");
    assert!(html.contains("font-size: 24px"), "{html}");
    assert!(html.contains("color: #ff0000"), "{html}");
    assert!(html.contains("font-style: italic"), "{html}");
    assert!(html.contains("text-decoration: underline"), "{html}");
    assert!(html.contains("text-decoration: line-through"), "{html}");
    assert!(
        html.contains("href=\"https://example.com/?a=1&amp;b=2\""),
        "{html}"
    );
    assert!(html.contains("Bold &lt;&amp;&gt;"), "{html}");
    assert!(html.contains("<br"), "{html}");
    for jsx in [DesignJsx.generate(&doc), TailwindJsx.generate(&doc)] {
        assert!(jsx.contains("fontWeight: 700"), "{jsx}");
        assert!(jsx.contains("fontSize: 24"), "{jsx}");
        assert!(jsx.contains("fontStyle: \"italic\""), "{jsx}");
        assert!(
            jsx.contains("href=\"https://example.com/?a=1&amp;b=2\""),
            "{jsx}"
        );
        assert!(jsx.contains("<br"), "{jsx}");
        assert!(jsx.contains("{\"Bold <&>\"}"), "{jsx}");
    }
}

#[test]
fn unsafe_link_schemes_are_not_emitted_as_executable_links() {
    let node: PenNode = serde_json::from_str(
        r#"{
        "type":"text","id":"t","content":[
          {"text":"not a script","href":"JaVaScRiPt:alert(1)"}
        ]
    }"#,
    )
    .unwrap();
    let doc: PenDocument =
        serde_json::from_value(serde_json::json!({"version":"1.0.0","children":[node]})).unwrap();
    for code in [
        HtmlCss.generate(&doc),
        DesignJsx.generate(&doc),
        TailwindJsx.generate(&doc),
    ] {
        assert!(!code.contains("href="), "{code}");
        assert!(code.contains("not a script"), "{code}");
    }
}
