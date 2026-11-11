use super::*;
use crate::{EditorState, NodeId};
use serde_json::json;

fn state() -> EditorState {
    let mut state = EditorState::sample();
    state.doc.pages = None;
    state.doc.children = vec![serde_json::from_value(json!({
        "type":"frame","id":"root","children":[
            {"type":"path","id":"a"},{"type":"path","id":"b"}
        ]
    }))
    .unwrap()];
    state
}

#[test]
fn shared_lint_fixes_both_nodes_with_one_undo() {
    let mut state = state();
    let before = state.doc.clone();
    let snapshot = DesignLintSnapshot::new(&state);
    assert_eq!(snapshot.issues.len(), 2);
    let (command, report) = snapshot.prepare(None).unwrap();
    assert_eq!(report.total, 2);
    assert!(state.apply(command.unwrap()));
    assert!(DesignLintSnapshot::new(&state).issues.is_empty());
    assert!(state.undo());
    assert_eq!(state.doc, before);
    assert!(!state.history.can_undo());
}

#[test]
fn shared_lint_rejects_stale_ids_and_locked_nodes_without_mutation() {
    let mut state = state();
    assert!(DesignLintSnapshot::new(&state)
        .prepare(Some(&["stale".into()].into_iter().collect()))
        .unwrap_err()
        .contains("stale"));
    state.apply(crate::EditorCommand::SetNodeFlag {
        node_id: NodeId::new("a"),
        flag: crate::NodeFlag::Locked,
        value: true,
    });
    let locked = state.doc.clone();
    assert!(DesignLintSnapshot::new(&state)
        .prepare(None)
        .unwrap_err()
        .contains("locked"));
    assert_eq!(state.doc, locked);
    assert!(!state.history.can_undo());
}

#[test]
fn shared_lint_rejects_children_of_locked_or_hidden_ancestors() {
    for hidden in [false, true] {
        let mut state = state();
        let root = state.doc.children[0].base_mut();
        if hidden {
            root.visible = Some(false);
        } else {
            root.locked = Some(true);
        }
        let before = state.doc.clone();
        let snapshot = DesignLintSnapshot::new(&state);
        assert_eq!(snapshot.issues.len(), 2);
        assert!(snapshot.prepare(None).is_err());
        assert_eq!(state.doc, before);
        assert!(!state.history.can_undo());
    }
}

#[test]
fn advisory_on_locked_node_does_not_block_other_fixable_nodes() {
    let mut state = state();
    state.doc.children = vec![serde_json::from_value(json!({
        "type":"frame","id":"root","children":[
            {"type":"path","id":"broken"},
            {"type":"frame","id":"a","role":"button","cornerRadius":4},
            {"type":"frame","id":"b","role":"button","cornerRadius":4},
            {"type":"frame","id":"c","role":"button","cornerRadius":8,"locked":true}
        ]
    }))
    .unwrap()];
    let before = state.doc.clone();
    let snapshot = DesignLintSnapshot::new(&state);
    assert!(snapshot.issues.iter().any(|issue| issue.node_id == "c"));
    let (command, report) = snapshot.prepare(None).unwrap();
    assert_eq!(report.total, 1);
    assert!(state.apply(command.unwrap()));
    assert!(state.undo());
    assert_eq!(state.doc, before);
}
