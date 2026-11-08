#[path = "../src/shared_styles.rs"]
mod shared_styles;

use jian_ops_schema::style::{SharedStyle, SharedStyleKind};
use op_editor_core::{variables_resolve, EditorCommand, EditorState, NodeId, PenNodeExt};
use serde_json::json;
use shared_styles::{apply_shared_style, SharedStyleOperation};

fn state() -> EditorState {
    EditorState::from_document(
        serde_json::from_value(json!({
            "version":"1.0","children":[
                {"type":"rectangle","id":"a","width":100,"height":50},
                {"type":"text","id":"b","content":"Hello"}
            ],
            "pages":[{"id":"p","name":"Page","children":[
                {"type":"rectangle","id":"c","width":100,"height":50}
            ]}]
        }))
        .unwrap(),
    )
}

fn paint(color: &str) -> SharedStyle {
    SharedStyle {
        name: "Brand".into(),
        kind: SharedStyleKind::Paint,
        properties: serde_json::from_value(json!({"fill":[{"type":"solid","color":color}]}))
            .unwrap(),
        node_ids: vec![],
    }
}

fn node_color(state: &EditorState, page: bool, index: usize) -> serde_json::Value {
    let nodes = if page {
        &state.doc.pages.as_ref().unwrap()[0].children
    } else {
        &state.doc.children
    };
    serde_json::to_value(&nodes[index]).unwrap()["fill"][0]["color"].clone()
}

#[test]
fn styles_update_rendered_authored_properties_across_pages_and_reload() {
    let mut s = state();
    apply_shared_style(
        &mut s,
        SharedStyleOperation::Create {
            id: "brand".into(),
            style: paint("#ff0000"),
        },
    )
    .unwrap();
    apply_shared_style(
        &mut s,
        SharedStyleOperation::Apply {
            id: "brand".into(),
            node_ids: vec!["a".into(), "c".into()],
        },
    )
    .unwrap();
    assert_eq!(node_color(&s, false, 0), "#ff0000");
    assert_eq!(node_color(&s, true, 0), "#ff0000");
    let snapshot = serde_json::to_value(s.snapshot_for_history().doc).unwrap();
    assert_eq!(
        snapshot["sharedStyles"]["brand"]["nodeIds"],
        json!(["a", "c"])
    );
    let mut s = EditorState::from_document(
        serde_json::from_str(&serde_json::to_string(&s.doc).unwrap()).unwrap(),
    );
    apply_shared_style(
        &mut s,
        SharedStyleOperation::Update {
            id: "brand".into(),
            style: paint("#00ff00"),
        },
    )
    .unwrap();
    assert_eq!(node_color(&s, false, 0), "#00ff00");
    assert_eq!(node_color(&s, true, 0), "#00ff00");
    assert!(s.undo());
    assert_eq!(node_color(&s, false, 0), "#ff0000");
    assert!(s.redo());
    assert_eq!(node_color(&s, false, 0), "#00ff00");
}

#[test]
fn detach_preserves_appearance_and_excludes_future_updates() {
    let mut s = state();
    apply_shared_style(
        &mut s,
        SharedStyleOperation::Create {
            id: "brand".into(),
            style: paint("#ff0000"),
        },
    )
    .unwrap();
    apply_shared_style(
        &mut s,
        SharedStyleOperation::Apply {
            id: "brand".into(),
            node_ids: vec!["a".into()],
        },
    )
    .unwrap();
    apply_shared_style(
        &mut s,
        SharedStyleOperation::Detach {
            id: "brand".into(),
            node_ids: vec!["a".into()],
        },
    )
    .unwrap();
    apply_shared_style(
        &mut s,
        SharedStyleOperation::Update {
            id: "brand".into(),
            style: paint("#00ff00"),
        },
    )
    .unwrap();
    assert_eq!(node_color(&s, false, 0), "#ff0000");
}

#[test]
fn invalid_target_batch_and_wrong_kind_are_atomic() {
    let mut s = state();
    apply_shared_style(
        &mut s,
        SharedStyleOperation::Create {
            id: "brand".into(),
            style: paint("#ff0000"),
        },
    )
    .unwrap();
    let before = s.doc.clone();
    assert!(apply_shared_style(
        &mut s,
        SharedStyleOperation::Apply {
            id: "brand".into(),
            node_ids: vec!["a".into(), "missing".into()]
        }
    )
    .is_err());
    assert_eq!(s.doc, before);
    let mut invalid = paint("#ff0000");
    invalid
        .properties
        .insert("content".into(), json!("overwrite"));
    assert!(apply_shared_style(
        &mut s,
        SharedStyleOperation::Update {
            id: "brand".into(),
            style: invalid
        }
    )
    .is_err());
    assert_eq!(s.doc, before);
}

#[test]
fn effect_and_text_styles_materialize_into_renderer_fields() {
    let mut s = state();
    for (id, kind, props, target) in [
        (
            "type",
            SharedStyleKind::Text,
            json!({"fontSize":32,"fontFamily":"Inter","fontWeight":700}),
            "b",
        ),
        (
            "shadow",
            SharedStyleKind::Effect,
            json!({"effects":[{"type":"blur","radius":8}]}),
            "a",
        ),
    ] {
        let style = SharedStyle {
            name: id.into(),
            kind,
            properties: serde_json::from_value(props).unwrap(),
            node_ids: vec![],
        };
        apply_shared_style(
            &mut s,
            SharedStyleOperation::Create {
                id: id.into(),
                style,
            },
        )
        .unwrap();
        apply_shared_style(
            &mut s,
            SharedStyleOperation::Apply {
                id: id.into(),
                node_ids: vec![target.into()],
            },
        )
        .unwrap();
    }
    let doc = serde_json::to_value(&s.doc).unwrap();
    assert_eq!(doc["children"][1]["fontSize"].as_f64(), Some(32.0));
    assert_eq!(
        doc["children"][0]["effects"][0]["radius"].as_f64(),
        Some(8.0)
    );
}

#[test]
fn deletion_detaches_without_destroying_rendered_nodes() {
    let mut s = state();
    apply_shared_style(
        &mut s,
        SharedStyleOperation::Create {
            id: "brand".into(),
            style: paint("#ff0000"),
        },
    )
    .unwrap();
    apply_shared_style(
        &mut s,
        SharedStyleOperation::Apply {
            id: "brand".into(),
            node_ids: vec!["a".into()],
        },
    )
    .unwrap();
    apply_shared_style(&mut s, SharedStyleOperation::Delete { id: "brand".into() }).unwrap();
    assert!(s.doc.shared_styles.is_none());
    assert_eq!(node_color(&s, false, 0), "#ff0000");
    assert!(s.undo());
    assert_eq!(
        s.doc.shared_styles.as_ref().unwrap()["brand"].node_ids,
        vec!["a"]
    );
}

#[test]
fn invalid_colors_and_unrenderable_style_bindings_are_rejected() {
    let mut s = state();
    assert!(apply_shared_style(
        &mut s,
        SharedStyleOperation::Create {
            id: "bad".into(),
            style: paint("garbage")
        }
    )
    .is_err());
    let mut text = paint("#ffffff");
    text.kind = SharedStyleKind::Text;
    text.properties = serde_json::from_value(json!({"fontFamily":"$family"})).unwrap();
    assert!(apply_shared_style(
        &mut s,
        SharedStyleOperation::Create {
            id: "bad".into(),
            style: text
        }
    )
    .is_err());
}

#[test]
fn text_style_line_height_above_renderer_range_is_atomic_error() {
    let mut s = state();
    let mut style = SharedStyle {
        name: "Body".into(),
        kind: SharedStyleKind::Text,
        properties: serde_json::from_value(json!({"fontSize":20,"lineHeight":1.5})).unwrap(),
        node_ids: vec![],
    };
    apply_shared_style(
        &mut s,
        SharedStyleOperation::Create {
            id: "body".into(),
            style: style.clone(),
        },
    )
    .unwrap();
    apply_shared_style(
        &mut s,
        SharedStyleOperation::Apply {
            id: "body".into(),
            node_ids: vec!["b".into()],
        },
    )
    .unwrap();
    let before = s.clone();
    for value in [4.01, 17.0] {
        style.properties.insert("lineHeight".into(), json!(value));
        assert!(matches!(
            apply_shared_style(
                &mut s,
                SharedStyleOperation::Update {
                    id: "body".into(),
                    style: style.clone(),
                },
            ),
            Err(shared_styles::SharedStyleError::InvalidStyle(_))
        ));
        assert_eq!(s.doc, before.doc);
        assert_eq!(s.revision, before.revision);
    }
    style.properties.insert("lineHeight".into(), json!(4.0));
    assert!(apply_shared_style(
        &mut s,
        SharedStyleOperation::Update {
            id: "body".into(),
            style,
        },
    )
    .unwrap());
    assert_eq!(
        serde_json::to_value(&s.doc).unwrap()["children"][1]["lineHeight"].as_f64(),
        Some(4.0)
    );
}

fn linked_pair() -> EditorState {
    let mut s = state();
    s.doc.pages = None;
    apply_shared_style(
        &mut s,
        SharedStyleOperation::Create {
            id: "brand".into(),
            style: paint("#ff0000"),
        },
    )
    .unwrap();
    apply_shared_style(
        &mut s,
        SharedStyleOperation::Apply {
            id: "brand".into(),
            node_ids: vec!["a".into(), "b".into()],
        },
    )
    .unwrap();
    s
}

#[test]
fn pruning_deleted_members_shares_the_deletion_undo_transaction() {
    let mut s = linked_pair();
    let original = s.doc.clone();
    let snapshot = s.snapshot_for_history();
    let history_len = s.history.past.len();
    assert!(s.apply(EditorCommand::DeleteNode {
        node_id: NodeId::new("a"),
        page_id: None,
    }));
    let deletion_revision = s.revision;
    shared_styles::prune_missing_shared_style_members(&mut s.doc);
    assert_eq!(s.history.past.len(), history_len);
    assert_eq!(s.revision, deletion_revision);
    s.history_push_past(snapshot);
    assert_eq!(
        s.doc.shared_styles.as_ref().unwrap()["brand"].node_ids,
        vec!["b"]
    );
    apply_shared_style(
        &mut s,
        SharedStyleOperation::Update {
            id: "brand".into(),
            style: paint("#00ff00"),
        },
    )
    .unwrap();
    assert_eq!(node_color(&s, false, 0), "#00ff00");
    assert!(s.undo());
    assert_eq!(node_color(&s, false, 0), "#ff0000");
    assert_eq!(
        s.doc.shared_styles.as_ref().unwrap()["brand"].node_ids,
        vec!["b"]
    );
    assert!(s.undo());
    assert_eq!(s.doc, original);
    assert!(s.redo());
    assert_eq!(
        s.doc.shared_styles.as_ref().unwrap()["brand"].node_ids,
        vec!["b"]
    );
}

#[test]
fn updating_saved_style_prunes_missing_members_and_undo_restores_saved_state() {
    let mut s = linked_pair();
    assert!(s.apply(EditorCommand::DeleteNode {
        node_id: NodeId::new("a"),
        page_id: None,
    }));
    s.doc
        .shared_styles
        .as_mut()
        .unwrap()
        .get_mut("brand")
        .unwrap()
        .node_ids = vec!["a".into(), "b".into()];
    let mut s = EditorState::from_document(
        serde_json::from_str(&serde_json::to_string(&s.doc).unwrap()).unwrap(),
    );
    let stale = s.doc.clone();
    let mut style = s.doc.shared_styles.as_ref().unwrap()["brand"].clone();
    style.properties = paint("#00ff00").properties;
    apply_shared_style(
        &mut s,
        SharedStyleOperation::Update {
            id: "brand".into(),
            style,
        },
    )
    .unwrap();
    assert_eq!(node_color(&s, false, 0), "#00ff00");
    assert_eq!(
        s.doc.shared_styles.as_ref().unwrap()["brand"].node_ids,
        vec!["b"]
    );
    let saved = serde_json::to_value(&s.doc).unwrap();
    assert_eq!(saved["sharedStyles"]["brand"]["nodeIds"], json!(["b"]));
    assert!(s.undo());
    assert_eq!(s.doc, stale);
    assert!(s.redo());
    assert_eq!(
        s.doc.shared_styles.as_ref().unwrap()["brand"].node_ids,
        vec!["b"]
    );
}

#[test]
fn stale_recovery_does_not_skip_locked_or_incompatible_live_members() {
    for (kind, properties, locked) in [
        (
            "paint",
            json!({"fill":[{"type":"solid","color":"#ff0000"}]}),
            true,
        ),
        ("text", json!({"fontSize":14}), false),
    ] {
        let mut s = EditorState::from_document(
            serde_json::from_value(json!({
                "version":"1.0",
                "children":[{"type":"rectangle","id":"b","width":20,"height":20,"locked":locked}],
                "sharedStyles":{"brand":{
                    "name":"Brand","kind":kind,"properties":properties,"nodeIds":["a","b"]
                }}
            }))
            .unwrap(),
        );
        let before = s.clone();
        let mut style = s.doc.shared_styles.as_ref().unwrap()["brand"].clone();
        style.properties = if kind == "paint" {
            paint("#00ff00").properties
        } else {
            serde_json::from_value(json!({"fontSize":20})).unwrap()
        };
        assert_eq!(
            apply_shared_style(
                &mut s,
                SharedStyleOperation::Update {
                    id: "brand".into(),
                    style,
                },
            ),
            Err(shared_styles::SharedStyleError::InvalidTarget("b".into()))
        );
        assert_eq!(s.doc, before.doc);
        assert_eq!(s.revision, before.revision);
        assert_eq!(s.history.past.len(), before.history.past.len());
    }
}

#[test]
fn pruner_retains_live_locked_and_nested_members_across_pages() {
    let mut document = serde_json::from_value(json!({
        "version":"1.0",
        "children":[{"type":"rectangle","id":"a","width":20,"height":20}],
        "pages":[{"id":"p","name":"Page","children":[
            {"type":"frame","id":"c","children":[
                {"type":"rectangle","id":"b","width":20,"height":20,"locked":true}
            ]}
        ]},{"id":"p2","name":"Inactive Page","children":[
            {"type":"rectangle","id":"d","width":20,"height":20}
        ]}],
        "sharedStyles":{"brand":{
            "name":"Brand","kind":"paint",
            "properties":{"fill":[{"type":"solid","color":"#ff0000"}]},
            "nodeIds":["a","b","c","d","missing"]
        }}
    }))
    .unwrap();
    assert_eq!(
        shared_styles::prune_missing_shared_style_members(&mut document),
        1
    );
    assert_eq!(
        document.shared_styles.as_ref().unwrap()["brand"].node_ids,
        vec!["a", "b", "c", "d"]
    );
    assert_eq!(
        shared_styles::prune_missing_shared_style_members(&mut document),
        0
    );
}

#[test]
fn stale_recovery_accepts_the_already_pruned_membership_payload() {
    let mut s = linked_pair();
    assert!(s.apply(EditorCommand::DeleteNode {
        node_id: NodeId::new("a"),
        page_id: None,
    }));
    s.doc
        .shared_styles
        .as_mut()
        .unwrap()
        .get_mut("brand")
        .unwrap()
        .node_ids = vec!["a".into(), "b".into()];
    let mut style = paint("#00ff00");
    style.node_ids = vec!["b".into()];
    apply_shared_style(
        &mut s,
        SharedStyleOperation::Update {
            id: "brand".into(),
            style,
        },
    )
    .unwrap();
    assert_eq!(node_color(&s, false, 0), "#00ff00");
    assert_eq!(
        s.doc.shared_styles.as_ref().unwrap()["brand"].node_ids,
        vec!["b"]
    );
}
