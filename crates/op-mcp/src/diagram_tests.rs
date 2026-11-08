use std::collections::BTreeMap;

use jian_ops_schema::node::PenNode;
use op_editor_core::EditorCommand;

use super::*;

fn children(result: &op_html::HtmlImportResult) -> &[PenNode] {
    let PenNode::Frame(frame) = &result.nodes[0] else {
        panic!("expected diagram frame")
    };
    frame.children.as_deref().unwrap()
}

#[test]
fn flowchart_creates_editable_shapes_labels_and_connector_paths() {
    let result = import_mermaid("flowchart TD\nA[Start] -->|yes| B{Ready?}\nB --> C(End)").unwrap();
    let nodes = children(&result);
    assert_eq!(
        nodes
            .iter()
            .filter(|n| matches!(n, PenNode::Text(_)))
            .count(),
        4
    );
    let paths: Vec<_> = nodes
        .iter()
        .filter_map(|n| match n {
            PenNode::Path(p)
                if p.base
                    .name
                    .as_deref()
                    .is_some_and(|s| s.starts_with("Connector")) =>
            {
                Some(p)
            }
            _ => None,
        })
        .collect();
    assert_eq!(paths.len(), 2);
    assert!(paths.iter().all(|p| p.anchors.as_ref().unwrap().len() >= 2));
    let shapes: Vec<_> = nodes
        .iter()
        .filter(|n| !matches!(n, PenNode::Text(_)))
        .collect();
    assert!(shapes.len() >= 5);
    serde_json::to_string(&result.nodes).unwrap();
}

#[test]
fn direction_changes_layout_and_cycles_terminate() {
    let td = import_mermaid("graph TD; A --> B; B --> A; C --> D").unwrap();
    let lr = import_mermaid("graph LR; A --> B; B --> A; C --> D").unwrap();
    assert_ne!(
        serde_json::to_value(td.nodes).unwrap(),
        serde_json::to_value(lr.nodes).unwrap()
    );
}

#[test]
fn unsupported_mermaid_is_rejected_without_partial_import() {
    for source in [
        "sequenceDiagram\nAlice->>Bob: hello",
        "graph TD\nA --> B\nsubgraph X\nC\nend",
        "graph TD\nA --> B\nstyle A fill:red",
        "graph TD\nA & B --> C",
        "graph TD\nA -.-> B",
    ] {
        assert!(import_mermaid(source).is_err(), "{source}");
    }
}

#[test]
fn drawio_preserves_geometry_and_maps_edges() {
    let xml = r##"<mxfile><diagram name="Page"><mxGraphModel><root>
        <mxCell id="0"/><mxCell id="1" parent="0"/>
        <mxCell id="a" value="A &amp; B" vertex="1" parent="1" style="rounded=1;fillColor=#eeeeee;">
          <mxGeometry x="20" y="30" width="120" height="60" as="geometry"/>
        </mxCell>
        <mxCell id="b" value="Done" vertex="1" parent="1" style="ellipse;">
          <mxGeometry x="240" y="30" width="80" height="60" as="geometry"/>
        </mxCell>
        <mxCell id="e" value="next" edge="1" parent="1" source="a" target="b">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>
    </root></mxGraphModel></diagram></mxfile>"##;
    let result = import_drawio(xml).unwrap();
    let value = serde_json::to_value(&result.nodes).unwrap();
    let serialized = value.to_string();
    assert!(serialized.contains("A & B"));
    assert!(children(&result)
        .iter()
        .any(|n| matches!(n, PenNode::Ellipse(_))));
    assert!(children(&result)
        .iter()
        .any(|n| matches!(n, PenNode::Path(_))));
}

#[test]
fn drawio_rejects_malformed_compressed_unknown_and_dangling_input() {
    for xml in [
        "<mxGraphModel><root>",
        "<mxfile><diagram>compressed_payload</diagram></mxfile>",
        r#"<mxGraphModel><root><mxCell id="a" vertex="1" style="shape=cylinder;"><mxGeometry width="20" height="20"/></mxCell></root></mxGraphModel>"#,
        r#"<mxGraphModel><root><mxCell id="e" edge="1" source="missing" target="absent"/></root></mxGraphModel>"#,
    ] {
        assert!(import_drawio(xml).is_err(), "{xml}");
    }
}

#[test]
fn tool_uses_shared_placement_and_insert_subtree_outcome() {
    let args = BTreeMap::from([
        ("mermaid".into(), "graph TD; A --> B".into()),
        ("x".into(), "123".into()),
        ("pageId".into(), "page-2".into()),
    ]);
    let ToolOutcome::OkWithCommand(output, EditorCommand::InsertSubtree { nodes, page_id, .. }) =
        import_mermaid_snapshot().call(&args)
    else {
        panic!("expected insert subtree")
    };
    assert_eq!(output["wrote"], "true");
    assert_eq!(page_id.as_deref(), Some("page-2"));
    let PenNode::Frame(frame) = &nodes[0] else {
        panic!("expected frame")
    };
    assert_eq!(frame.base.x, Some(123.0));
    assert!(matches!(
        import_drawio_snapshot().call(&BTreeMap::new()),
        ToolOutcome::Err(ToolErrorCode::MissingArgument, _)
    ));
}

#[test]
fn connector_label_is_centered_on_segment_not_on_target() {
    let result = import_mermaid("graph LR; A -->|label| B").unwrap();
    let labels: Vec<_> = children(&result)
        .iter()
        .filter_map(|n| match n {
            PenNode::Text(t) => Some(t),
            _ => None,
        })
        .collect();
    let label = labels
        .iter()
        .find(|t| t.base.id == "diagram_edge_label_0")
        .unwrap();
    assert_eq!(label.base.x, Some(154.0));
}

#[test]
fn common_drawio_orthogonal_edges_route_as_editable_bends() {
    let xml = r#"<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/>
        <mxCell id="a" value="A" vertex="1" parent="1"><mxGeometry x="0" y="0" width="80" height="40"/></mxCell>
        <mxCell id="b" value="B" vertex="1" parent="1"><mxGeometry x="240" y="120" width="80" height="40"/></mxCell>
        <mxCell id="e" edge="1" parent="1" source="a" target="b" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;"><mxGeometry relative="1" as="geometry"/></mxCell>
    </root></mxGraphModel>"#;
    let result = import_drawio(xml).unwrap();
    let edge = children(&result)
        .iter()
        .find_map(|n| match n {
            PenNode::Path(p) if p.base.id == "diagram_edge_0" => Some(p),
            _ => None,
        })
        .unwrap();
    let anchors = edge.anchors.as_ref().unwrap();
    assert!(anchors.len() >= 3);
    assert!(anchors
        .windows(2)
        .all(|p| p[0].x == p[1].x || p[0].y == p[1].y));
}

#[test]
fn inline_comments_do_not_drop_flowchart_connections() {
    let result = import_mermaid("flowchart TD\nA[Start] --> B[Finish] %% comment").unwrap();
    assert!(children(&result)
        .iter()
        .any(|n| matches!(n, PenNode::Path(p) if p.base.id == "diagram_edge_0")));
}

#[test]
fn source_local_ids_are_remapped_by_existing_insert_subtree_allocator() {
    let mut state = op_editor_core::EditorState::default();
    let args = BTreeMap::from([("mermaid".into(), "graph TD; A --> B".into())]);
    for _ in 0..2 {
        let ToolOutcome::OkWithCommand(_, command) = import_mermaid_snapshot().call(&args) else {
            panic!("expected command")
        };
        assert!(state.apply(command));
    }

    let ids: Vec<_> = state
        .doc
        .children
        .iter()
        .flat_map(|node| {
            let PenNode::Frame(f) = node else {
                panic!("expected root")
            };
            std::iter::once(f.base.id.clone())
                .chain(f.children.as_ref().unwrap().iter().map(|n| match n {
                    PenNode::Path(p) => p.base.id.clone(),
                    PenNode::Rectangle(p) => p.base.id.clone(),
                    PenNode::Text(p) => p.base.id.clone(),
                    _ => panic!("unexpected node"),
                }))
                .collect::<Vec<_>>()
        })
        .collect();
    assert_eq!(
        ids.iter().collect::<std::collections::BTreeSet<_>>().len(),
        ids.len()
    );
    assert!(ids.iter().all(|id| !id.starts_with("diagram_")));
}

#[test]
fn unsupported_drawio_geometry_is_not_silently_discarded() {
    for xml in [
        r#"<mxGraphModel><root><mxCell id="a" vertex="1"><mxGeometry width="20" height="20"/><mxPoint x="2" y="4"/></mxCell></root></mxGraphModel>"#,
        r#"<mxGraphModel><root><mxCell id="a" vertex="1"><mxGeometry width="20" height="20"/><mxGeometry width="30" height="30"/></mxCell></root></mxGraphModel>"#,
        r#"<mxGraphModel><root><mxCell id="a" vertex="1"><mxGeometry width="20" height="20"/></mxCell><mxCell id="e" edge="1" source="a" target="a"><mxGeometry relative="1" x="0.25" y="-10"/></mxCell></root></mxGraphModel>"#,
    ] {
        assert!(import_drawio(xml).is_err(), "{xml}");
    }
}

#[test]
fn canonical_source_and_parent_id_aliases_are_accepted() {
    let args = BTreeMap::from([
        ("source".into(), "graph LR; A --> B".into()),
        ("parentId".into(), "frame-1".into()),
    ]);
    let ToolOutcome::OkWithCommand(_, EditorCommand::InsertSubtree { parent_id, .. }) =
        import_mermaid_snapshot().call(&args)
    else {
        panic!("source alias must import")
    };
    assert_eq!(parent_id.as_str(), "frame-1");
}
