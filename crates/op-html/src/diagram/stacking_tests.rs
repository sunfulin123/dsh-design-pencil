use super::{import_drawio, import_mermaid};
use crate::HtmlImportResult;
use jian_ops_schema::node::PenNode;

fn assert_canonical_front_to_back(result: HtmlImportResult) {
    let PenNode::Frame(frame) = &result.nodes[0] else {
        panic!("diagram frame")
    };
    let children = frame.children.as_deref().unwrap();
    let values: Vec<_> = children
        .iter()
        .map(|node| serde_json::to_value(node).unwrap())
        .collect();
    let index = |id: &str| values.iter().position(|node| node["id"] == id).unwrap();
    let label_a = index("diagram_label_0");
    let label_b = index("diagram_label_1");
    let shape_a = index("diagram_shape_0");
    let shape_b = index("diagram_shape_1");
    let edge_label = index("diagram_edge_label_0");
    let edge = index("diagram_edge_0");
    let arrow = index("diagram_arrow_0");
    // Canonical arrays are front-to-back: painters traverse them in reverse.
    for label in [label_a, label_b, edge_label] {
        assert!(
            label < shape_a && label < shape_b,
            "labels must be above all backing shapes"
        );
        assert!(
            label < edge && label < arrow,
            "labels must be above connector geometry"
        );
        assert_eq!(values[label]["fontSize"].as_f64(), Some(14.0));
        assert_eq!(values[label]["textAlign"], "center");
        assert_eq!(values[label]["textAlignVertical"], "middle");
    }
    for shape in [shape_a, shape_b] {
        assert!(
            shape < edge && shape < arrow,
            "connector geometry must remain behind shapes"
        );
    }
}

#[test]
fn mermaid_labels_shapes_and_connectors_follow_canonical_front_to_back_order() {
    assert_canonical_front_to_back(
        import_mermaid("graph LR\nA[Start] -->|next| B[Finish]").unwrap(),
    );
}

#[test]
fn drawio_labels_shapes_and_connectors_follow_canonical_front_to_back_order() {
    let xml = r#"<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/>
      <mxCell id="a" parent="1" vertex="1" value="Start"><mxGeometry x="24" y="24" width="160" height="80"/></mxCell>
      <mxCell id="b" parent="1" vertex="1" value="Finish"><mxGeometry x="300" y="24" width="160" height="80"/></mxCell>
      <mxCell id="edge" parent="1" edge="1" source="a" target="b" value="next"><mxGeometry relative="1"/></mxCell>
    </root></mxGraphModel>"#;
    assert_canonical_front_to_back(import_drawio(xml).unwrap());
}
