use super::*;
use op_editor_core::Viewport;

fn minimal_document() -> op_editor_core::PenDocument {
    serde_json::from_str(r#"{"version":"1.0","children":[]}"#)
        .expect("minimal document should deserialize")
}

#[test]
fn capped_serializer_matches_regular_json_for_small_documents() {
    let doc = minimal_document();
    let expected = serde_json::to_string(&doc).expect("regular serialization should succeed");
    match serialize_sync_document(&doc) {
        SyncDocumentJson::Ready(actual) => assert_eq!(actual, expected),
        SyncDocumentJson::Oversize => panic!("small document should fit under the cap"),
        SyncDocumentJson::Failed => panic!("small document should serialize"),
    }
}

#[test]
fn capped_serializer_stops_oversized_documents_at_the_limit() {
    let mut doc = minimal_document();
    doc.name = Some("x".repeat(SYNC_MAX_BODY_BYTES));
    assert!(matches!(
        serialize_sync_document(&doc),
        SyncDocumentJson::Oversize
    ));
}

#[test]
fn page_and_camera_changes_are_push_due_without_a_revision_change() {
    let mut sync = SyncController::new();
    let pair = (7, 11);
    sync.gate.note_synced(pair.0, pair.1);
    sync.client.mark_applied(3);
    sync.client.note_applied_snapshot_without_hash(0, true);
    let identity = Viewport::IDENTITY;
    let camera = Viewport {
        pan_x: 20.25,
        pan_y: -10.125,
        zoom: 1.25,
    };
    assert!(!push_reasons(&sync, pair, 0, true, identity).any());
    assert!(push_reasons(&sync, pair, 1, true, identity).editor_meta);
    assert!(push_reasons(&sync, pair, 0, true, camera).editor_meta);
    assert!(!push_reasons(&sync, pair, 0, true, camera).content);
    sync.client.note_applied_viewport(camera);
    assert!(!push_reasons(&sync, pair, 0, true, camera).any());
    let newer = Viewport {
        pan_x: 21.5,
        ..camera
    };
    assert!(push_reasons(&sync, pair, 0, true, newer).editor_meta);
    sync.gate.note_conflict(4);
    assert!(!push_reasons(&sync, pair, 1, true, newer).any());
}

#[test]
fn pulls_cannot_overwrite_a_local_camera_or_cross_a_push_acknowledgement() {
    let mut sync = SyncController::new();
    let pair = (7, 11);
    sync.gate.note_synced(pair.0, pair.1);
    sync.client.mark_applied(3);
    let identity = Viewport::IDENTITY;
    let camera = Viewport {
        pan_x: 20.25,
        pan_y: -10.125,
        zoom: 1.25,
    };
    let epoch = sync.client.viewport_epoch();
    assert!(sync.document_pull_ready(pair, identity, epoch));
    assert!(!sync.document_pull_ready(pair, camera, epoch));
    sync.push_busy = true;
    assert!(!sync.document_pull_ready(pair, identity, epoch));
    sync.push_busy = false;
    sync.client.note_applied_viewport(camera);
    assert!(!sync.document_pull_ready(pair, camera, epoch));
    let epoch = sync.client.viewport_epoch();
    assert!(sync.document_pull_ready(pair, camera, epoch));
    sync.gate.note_conflict(3);
    assert!(!sync.document_pull_ready(pair, identity, epoch));
    sync.gate.resolve_accept_remote(pair);
    assert!(sync.document_pull_ready(pair, identity, epoch));
}
