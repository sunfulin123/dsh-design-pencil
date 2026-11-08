use std::collections::BTreeMap;

use jian_ops_schema::node::PenNode;
use op_editor_core::{EditorCommand, EditorState};
use serde_json::json;

use super::{create_connector_snapshot, McpTool, ToolErrorCode, ToolOutcome};

fn fixture() -> EditorState {
    let mut state = EditorState::new();
    state.doc.children = serde_json::from_value(json!([
        {"type":"frame","id":"parent","x":100,"y":50,"width":400,"height":200,"layout":"none","children":[
            {"type":"rectangle","id":"a","x":20,"y":30,"width":80,"height":40},
            {"type":"ellipse","id":"b","x":220,"y":30,"width":80,"height":40}
        ]}
    ])).unwrap();
    state
}

#[test]
fn connector_label_is_in_front_but_primary_id_still_identifies_the_path() {
    let state = fixture();
    let args = BTreeMap::from([
        ("fromId".into(), "a".into()),
        ("toId".into(), "b".into()),
        ("label".into(), "next".into()),
    ]);
    let ToolOutcome::OkWithCommand(result, EditorCommand::InsertAuthoredSubtree { nodes, .. }) =
        create_connector_snapshot(&state).call(&args)
    else {
        panic!("expected connector")
    };
    let label = nodes
        .iter()
        .position(|node| matches!(node, PenNode::Text(_)))
        .unwrap();
    let path = nodes
        .iter()
        .position(|node| matches!(node, PenNode::Path(_)))
        .unwrap();
    assert!(label < path, "canonical children are front-to-back");
    let PenNode::Path(path) = &nodes[path] else {
        unreachable!()
    };
    assert_eq!(result["nodeId"], path.base.id);
}

#[test]
fn connector_uses_resolved_nested_geometry_and_returns_actual_authored_ids() {
    let mut state = fixture();
    let tool = create_connector_snapshot(&state);
    let args = BTreeMap::from([("fromId".into(), "a".into()), ("toId".into(), "b".into())]);
    let ToolOutcome::OkWithCommand(result, command) = tool.call(&args) else {
        panic!("expected connector command")
    };
    assert_eq!(result["binding"], "static");
    assert_eq!(result["liveFollow"], "false");
    let ids: Vec<String> = serde_json::from_str(&result["nodeIds"]).unwrap();
    assert_eq!(ids[0], result["nodeId"]);
    assert!(state.apply(command));
    let connector = state
        .doc
        .children
        .iter()
        .find_map(|n| match n {
            PenNode::Path(p) if p.base.id == ids[0] => Some(p),
            _ => None,
        })
        .unwrap();
    assert_eq!(connector.base.x, Some(200.0));
    assert_eq!(connector.base.y, Some(100.0));
    assert_eq!(connector.anchors.as_ref().unwrap()[0].x, 0.0);
    for id in &ids {
        assert!(state.doc.children.iter().any(|n| match n {
            PenNode::Path(p) => &p.base.id == id,
            _ => false,
        }));
    }
}

#[test]
fn connector_style_controls_bends_color_width_and_arrow() {
    let mut state = fixture();
    let PenNode::Frame(parent) = &mut state.doc.children[0] else {
        panic!()
    };
    let PenNode::Ellipse(target) = &mut parent.children.as_mut().unwrap()[1] else {
        panic!()
    };
    target.base.y = Some(100.0);
    let args = BTreeMap::from([
        ("fromId".into(), "a".into()),
        ("toId".into(), "b".into()),
        (
            "style".into(),
            r##"{"routing":"orthogonal","strokeColor":"#ff0000","strokeWidth":3,"arrow":false}"##
                .into(),
        ),
    ]);
    let ToolOutcome::OkWithCommand(result, EditorCommand::InsertAuthoredSubtree { nodes, .. }) =
        create_connector_snapshot(&state).call(&args)
    else {
        panic!("expected authored connector")
    };
    assert_eq!(
        serde_json::from_str::<Vec<String>>(&result["nodeIds"])
            .unwrap()
            .len(),
        1
    );
    let PenNode::Path(path) = &nodes[0] else {
        panic!("expected path")
    };
    let anchors = path.anchors.as_ref().unwrap();
    assert!(anchors.len() >= 3);
    assert!(anchors
        .windows(2)
        .all(|a| a[0].x == a[1].x || a[0].y == a[1].y));
    let value = serde_json::to_value(path).unwrap();
    assert_eq!(value["stroke"]["thickness"].as_f64(), Some(3.0));
    assert_eq!(value["stroke"]["fill"][0]["color"], "#ff0000");
}

#[test]
fn connector_rejects_missing_unknown_transformed_and_invalid_styles() {
    let state = fixture();
    let tool = create_connector_snapshot(&state);
    assert!(matches!(
        tool.call(&BTreeMap::new()),
        ToolOutcome::Err(ToolErrorCode::MissingArgument, _)
    ));
    let mut args = BTreeMap::from([
        ("fromId".into(), "a".into()),
        ("toId".into(), "missing".into()),
    ]);
    assert!(matches!(tool.call(&args), ToolOutcome::Err(_, _)));
    args.insert("toId".into(), "b".into());
    for style in [
        r#"{"routing":"curved"}"#,
        r#"{"strokeWidth":-1}"#,
        r#"{"ignored":true}"#,
    ] {
        args.insert("style".into(), style.into());
        assert!(matches!(
            tool.call(&args),
            ToolOutcome::Err(ToolErrorCode::InvalidArgument, _)
        ));
    }
    let mut transformed = fixture();
    let PenNode::Frame(parent) = &mut transformed.doc.children[0] else {
        panic!()
    };
    parent.base.rotation = Some(45.0);
    args.remove("style");
    assert!(matches!(
        create_connector_snapshot(&transformed).call(&args),
        ToolOutcome::Err(ToolErrorCode::InvalidArgument, _)
    ));
}

#[test]
fn stale_connector_ids_fail_apply_instead_of_reporting_wrong_ids() {
    let mut state = fixture();
    let tool = create_connector_snapshot(&state);
    let args = BTreeMap::from([("fromId".into(), "a".into()), ("toId".into(), "b".into())]);
    let ToolOutcome::OkWithCommand(_, first) = tool.call(&args) else {
        panic!()
    };
    let ToolOutcome::OkWithCommand(_, second) = tool.call(&args) else {
        panic!()
    };
    assert!(state.apply(first));
    assert!(!state.apply(second));
}

#[test]
fn connector_is_active_page_scoped_and_preserves_snapshotted_page_on_apply() {
    let mut state = fixture();
    state.doc.pages = Some(
        serde_json::from_value(json!([
            {"id":"page-one","name":"First","children":[
                {"type":"rectangle","id":"inactive","x":0,"y":0,"width":30,"height":30}
            ]},
            {"id":"page-two","name":"Second","children":state.doc.children}
        ]))
        .unwrap(),
    );
    state.doc.children.clear();
    state.ui.active_page_index = 1;
    let tool = create_connector_snapshot(&state);
    let mut args = BTreeMap::from([
        ("fromId".into(), "a".into()),
        ("toId".into(), "inactive".into()),
    ]);
    assert!(matches!(
        tool.call(&args),
        ToolOutcome::Err(ToolErrorCode::InvalidArgument, _)
    ));
    args.insert("toId".into(), "b".into());
    let ToolOutcome::OkWithCommand(result, command) = tool.call(&args) else {
        panic!("expected connector")
    };
    let EditorCommand::InsertAuthoredSubtree { page_id, .. } = &command else {
        panic!()
    };
    assert_eq!(page_id.as_deref(), Some("page-two"));
    state.ui.active_page_index = 0;
    assert!(state.apply(command));
    let pages = state.doc.pages.as_ref().unwrap();
    assert!(!pages[0]
        .children
        .iter()
        .any(|n| matches!(n, PenNode::Path(p) if p.base.id == result["nodeId"])));
    assert!(pages[1]
        .children
        .iter()
        .any(|n| matches!(n, PenNode::Path(p) if p.base.id == result["nodeId"])));
}
