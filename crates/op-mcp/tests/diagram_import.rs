use std::collections::BTreeMap;

use jian_ops_schema::node::PenNode;
use op_editor_core::EditorState;
use op_mcp::diagram_tools::{create_connector_snapshot, import_mermaid_snapshot};
use op_mcp::{McpTool, ToolOutcome};

#[test]
fn public_import_and_connector_tools_apply_with_exact_reported_ids() {
    let mut state = EditorState::new();
    let args = BTreeMap::from([("source".into(), "graph LR; A --> B".into())]);
    let ToolOutcome::OkWithCommand(_, command) = import_mermaid_snapshot().call(&args) else {
        panic!("expected import command")
    };
    assert!(state.apply(command));
    let PenNode::Frame(frame) = &state.doc.children[0] else {
        panic!("expected diagram")
    };
    let ids: Vec<_> = frame
        .children
        .as_ref()
        .unwrap()
        .iter()
        .filter_map(|n| match n {
            PenNode::Rectangle(r) => Some(r.base.id.clone()),
            _ => None,
        })
        .collect();
    let args = BTreeMap::from([
        ("fromId".into(), ids[0].clone()),
        ("toId".into(), ids[1].clone()),
        ("style".into(), "orthogonal".into()),
    ]);
    let ToolOutcome::OkWithCommand(result, command) = create_connector_snapshot(&state).call(&args)
    else {
        panic!("expected connector command")
    };
    assert!(state.apply(command));
    assert_eq!(result["binding"], "static");
    assert!(state
        .doc
        .children
        .iter()
        .any(|n| matches!(n, PenNode::Path(p) if p.base.id == result["nodeId"])));
}
