use std::io::Write;

use base64::{engine::general_purpose::STANDARD, Engine};
use flate2::{write::DeflateEncoder, Compression};
use jian_ops_schema::node::PenNode;

use super::{
    import_drawio, import_drawio_snapshot, DiagramError, McpTool, ToolErrorCode, ToolOutcome,
};

const MODEL: &str = r#"<mxGraphModel><root>
  <mxCell id="0"/><mxCell id="1" parent="0"/>
  <mxCell id="a" vertex="1" parent="1" value="Café + 雪"><mxGeometry x="20" y="30" width="100" height="60"/></mxCell>
  <mxCell id="b" vertex="1" parent="1" value="Done" style="ellipse;"><mxGeometry x="240" y="30" width="100" height="60"/></mxCell>
  <mxCell id="edge" edge="1" parent="1" source="a" target="b" value="next"><mxGeometry relative="1"/></mxCell>
</root></mxGraphModel>"#;

fn compressed(bytes: &[u8]) -> String {
    let mut encoder = DeflateEncoder::new(Vec::new(), Compression::default());
    encoder.write_all(bytes).unwrap();
    STANDARD.encode(encoder.finish().unwrap())
}

fn envelope(payload: &str) -> String {
    format!("<mxfile><diagram name=\"Flow &amp; Review\">{payload}</diagram></mxfile>")
}

fn encoded_model() -> String {
    let percent_encoded = MODEL
        .bytes()
        .map(|b| format!("%{b:02X}"))
        .collect::<String>();
    compressed(percent_encoded.as_bytes())
}

#[test]
fn compressed_drawio_matches_uncompressed_editable_geometry() {
    let plain = import_drawio(&envelope(MODEL)).unwrap();
    let decoded = import_drawio(&envelope(&encoded_model())).unwrap();
    assert_eq!(decoded.nodes, plain.nodes);
    let PenNode::Frame(frame) = &decoded.nodes[0] else {
        panic!("expected frame")
    };
    assert_eq!(frame.base.name.as_deref(), Some("Flow & Review"));
    let children = frame.children.as_ref().unwrap();
    assert!(children.iter().any(|n| matches!(n, PenNode::Rectangle(_))));
    assert!(children.iter().any(|n| matches!(n, PenNode::Ellipse(_))));
    assert!(children.iter().any(|n| matches!(n, PenNode::Path(_))));
    assert!(serde_json::to_string(&decoded.nodes)
        .unwrap()
        .contains("Café + 雪"));
}

#[test]
fn compressed_drawio_rejects_noncanonical_base64() {
    for payload in ["!", "A", "A===", "TR==", "AA AA", "AAAA\nAAAA", "_AAA"] {
        let error = import_drawio(&envelope(payload)).err().unwrap();
        assert!(matches!(error, DiagramError::DrawioBase64 { .. }));
        let error = error.to_string();
        assert!(error.contains("base64"), "{payload}: {error}");
    }
}

#[test]
fn compressed_drawio_rejects_invalid_truncated_and_trailing_deflate() {
    let valid = STANDARD.decode(encoded_model()).unwrap();
    let mut trailing = valid.clone();
    trailing.push(0);
    for bytes in [
        vec![0x07],
        valid[..valid.len() / 2].to_vec(),
        trailing,
        Vec::new(),
    ] {
        let error = import_drawio(&envelope(&STANDARD.encode(bytes)))
            .err()
            .unwrap()
            .to_string();
        assert!(error.contains("DEFLATE"), "{error}");
    }
}

#[test]
fn compressed_drawio_rejects_bad_percent_sequences_and_invalid_utf8() {
    for payload in ["%", "%0", "%GG", "%3Z"] {
        let error = import_drawio(&envelope(&compressed(payload.as_bytes())))
            .err()
            .unwrap()
            .to_string();
        assert!(error.contains("percent"), "{error}");
    }
    for payload in [b"%FF".as_slice(), b"\xff".as_slice(), b"%C0%AF".as_slice()] {
        let error = import_drawio(&envelope(&compressed(payload)))
            .err()
            .unwrap()
            .to_string();
        assert!(error.contains("UTF-8"), "{error}");
    }
}

#[test]
fn compressed_drawio_caps_compressed_and_expanded_bytes() {
    let oversized_compressed = STANDARD.encode(vec![0u8; 1024 * 1024 + 1]);
    let error = import_drawio(&envelope(&oversized_compressed))
        .err()
        .unwrap();
    assert!(matches!(
        error,
        DiagramError::DrawioByteLimit {
            stage: "compressed input",
            limit: 1_048_576
        }
    ));
    let error = error.to_string();
    assert!(
        error.contains("compressed") && error.contains("limit"),
        "{error}"
    );
    let bomb = compressed(&vec![b' '; 8 * 1024 * 1024 + 1]);
    let error = import_drawio(&envelope(&bomb)).err().unwrap();
    assert!(matches!(
        error,
        DiagramError::DrawioByteLimit {
            stage: "expanded payload",
            limit: 8_388_608
        }
    ));
    let error = error.to_string();
    assert!(
        error.contains("expanded") && error.contains("limit"),
        "{error}"
    );
}

#[test]
fn drawio_rejects_all_multi_diagram_ambiguity_before_decoding() {
    for source in [
        format!(
            "<mxfile><diagram>{MODEL}</diagram><diagram>{}</diagram></mxfile>",
            encoded_model()
        ),
        format!(
            "<mxfile><diagram>{}</diagram><diagram>{}</diagram></mxfile>",
            encoded_model(),
            encoded_model()
        ),
        format!("<mxfile><diagram>{MODEL}</diagram><diagram/></mxfile>"),
        format!("<mxfile><diagram>{MODEL}</diagram>{MODEL}</mxfile>"),
    ] {
        let error = import_drawio(&source).err().unwrap().to_string();
        assert!(
            error.contains("multiple") || error.contains("ambiguous"),
            "{error}"
        );
    }
}

#[test]
fn compressed_drawio_rejects_decoded_non_model_and_unsupported_geometry() {
    for source in ["<mxfile/>", "<mxGraphModel><root><mxCell id=\"a\" vertex=\"1\" style=\"shape=cylinder;\"><mxGeometry width=\"20\" height=\"20\"/></mxCell></root></mxGraphModel>"] {
        assert!(import_drawio(&envelope(&compressed(source.as_bytes()))).is_err());
    }
}

#[test]
fn compressed_drawio_uri_decoding_preserves_literal_plus_and_unicode() {
    let plain = import_drawio(&envelope(MODEL)).unwrap();
    let decoded = import_drawio(&envelope(&compressed(MODEL.as_bytes()))).unwrap();
    assert_eq!(decoded.nodes, plain.nodes);
}

#[test]
fn drawio_xml_source_is_bounded_before_xml_parsing() {
    let oversized = " ".repeat(8 * 1024 * 1024 + 1);
    let error = import_drawio(&oversized).err().unwrap().to_string();
    assert!(
        error.contains("source") && error.contains("limit"),
        "{error}"
    );
}

#[test]
fn compressed_drawio_public_tool_applies_geometry_and_rejects_bad_payload_atomically() {
    let mut args = std::collections::BTreeMap::from([
        ("xml".into(), envelope(&encoded_model())),
        ("x".into(), "123".into()),
    ]);
    let ToolOutcome::OkWithCommand(_, command) = import_drawio_snapshot().call(&args) else {
        panic!("expected subtree command")
    };
    let mut state = op_editor_core::EditorState::new();
    assert!(state.apply(command));
    let PenNode::Frame(frame) = &state.doc.children[0] else {
        panic!("expected editable diagram")
    };
    assert_eq!(frame.base.x, Some(123.0));
    let before = state.doc.clone();
    args.insert("xml".into(), envelope("!"));
    assert!(matches!(
        import_drawio_snapshot().call(&args),
        ToolOutcome::Err(ToolErrorCode::InvalidArgument, _)
    ));
    assert_eq!(state.doc, before);
}

#[test]
fn compressed_drawio_limits_are_inclusive() {
    let at_compressed_limit = STANDARD.encode(vec![0u8; 1024 * 1024]);
    assert!(matches!(
        import_drawio(&envelope(&at_compressed_limit)),
        Err(DiagramError::DrawioDeflate { .. })
    ));
    let at_expanded_limit = compressed(&vec![b' '; 8 * 1024 * 1024]);
    assert!(matches!(
        import_drawio(&envelope(&at_expanded_limit)),
        Err(DiagramError::Syntax { .. })
    ));
}
