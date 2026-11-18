//! VS Code bridge document snapshot with separate sync and disk representations.
//!
//! Live sync hashes the typed `PenDocument` bytes plus editor metadata as
//! separate fields. The extension's on-disk snapshot embeds the same metadata
//! into `editorMeta`. Keeping those representations separate prevents the
//! bridge from poisoning the periodic-sync baseline with differently shaped
//! JSON and triggering a redundant whole-document push.

use std::{cell::RefCell, rc::Rc};

use op_editor_core::bridge_protocol::{
    event_managed_save_snapshot_result, event_recovery_snapshot_result, event_snapshot_conflict,
    event_snapshot_result,
};
use op_editor_core::web_sync::WebSyncClient;
use op_editor_core::EditorState;
use op_pen_loader::EditorMeta;

use super::helpers::{
    acquire_push_busy, post_to_parent, release_push_busy, schedule_once, snapshot_state,
};
use super::{live_sync, RepaintContext, SharedSync, PUSH_BUSY_RETRY_MS};
use crate::live_sync_glue::SyncController;

#[derive(Clone)]
pub(super) struct BridgeDocumentSnapshot {
    pair: (u64, u64),
    dirty: bool,
    document_json: Rc<str>,
    editor_meta: EditorMeta,
}

impl BridgeDocumentSnapshot {
    pub(super) fn capture(state: &EditorState) -> Option<Self> {
        Some(Self {
            pair: (state.document_generation(), state.document_revision()),
            dirty: state.is_dirty(),
            document_json: serde_json::to_string(&state.doc).ok()?.into(),
            editor_meta: EditorMeta::from_state(state),
        })
    }

    pub(super) fn pair(&self) -> (u64, u64) {
        self.pair
    }

    pub(super) fn push_body(&self, base_version: u64) -> String {
        let mut document = Vec::new();
        op_pen_loader::write_source_with_editor_meta(
            &mut document,
            self.document_json.as_ref(),
            self.editor_meta.clone(),
        )
        .expect("snapshot document and editor metadata are valid JSON");
        let document = std::str::from_utf8(&document).expect("JSON serialization is UTF-8");
        WebSyncClient::wrap_push_body_with_base_and_editor_meta(
            document,
            base_version,
            self.editor_meta.active_page_index,
            self.editor_meta.preserve_authored_geometry,
        )
    }

    pub(super) fn mark_pushed(&self, client: &mut WebSyncClient, version: u64) {
        client.mark_pushed_with_editor_meta(
            self.document_json.as_ref(),
            self.editor_meta.active_page_index,
            self.editor_meta.preserve_authored_geometry,
            version,
        );
    }

    fn save_result(&self, request_id: &str, daemon_version: Option<u64>) -> String {
        let (generation, revision) = self.pair;
        let json = self.externalized_json();
        match daemon_version {
            Some(version) => {
                event_managed_save_snapshot_result(request_id, &json, generation, revision, version)
            }
            None => event_snapshot_result(request_id, &json, generation, revision),
        }
    }

    pub(super) fn externalized_json(&self) -> String {
        crate::document_json::externalize_for_disk(
            self.document_json.as_ref(),
            self.editor_meta.clone(),
        )
    }
}

enum SnapshotAction {
    Reply(String),
    Push(BridgeDocumentSnapshot, Option<u64>),
}

/// Recovery reads the exact local canvas without resolving conflicts or updating the daemon.
/// Other purposes use the existing conflict gate and serialize any needed push.
fn snapshot_action(
    purpose: &str,
    request_id: &str,
    sync: Option<&SyncController>,
    capture: impl FnOnce() -> Option<BridgeDocumentSnapshot>,
) -> Option<SnapshotAction> {
    let sync = sync.filter(|_| purpose != "recovery");
    if let Some(server_version) = sync.and_then(|s| s.gate.conflict()) {
        return Some(SnapshotAction::Reply(event_snapshot_conflict(
            request_id,
            server_version,
        )));
    }

    let snapshot = capture()?;
    let (generation, revision) = snapshot.pair();
    let managed_version = sync
        .filter(|s| purpose == "save" && s.managed_refresh && s.client.initialized())
        .map(|s| s.client.last_version());
    if sync.is_some_and(|s| s.gate.needs_push((generation, revision))) {
        return Some(SnapshotAction::Push(snapshot, managed_version));
    }
    let reply = if purpose == "recovery" {
        event_recovery_snapshot_result(
            request_id,
            &snapshot.externalized_json(),
            generation,
            revision,
            snapshot.dirty,
        )
    } else {
        let confirmed_version = managed_version
            .filter(|_| sync.is_some_and(|s| s.gate.is_synced((generation, revision))));
        snapshot.save_result(request_id, confirmed_version)
    };
    Some(SnapshotAction::Reply(reply))
}

pub(super) fn handle_snapshot<C: RepaintContext + 'static>(
    inner: &Rc<RefCell<C>>,
    sync: &SharedSync,
    purpose: &str,
    request_id: String,
) {
    let action = {
        let sync = sync.try_borrow().ok();
        snapshot_action(purpose, &request_id, sync.as_deref(), || {
            snapshot_state(inner)
        })
    };
    match action {
        Some(SnapshotAction::Reply(reply)) => post_to_parent(&reply),
        Some(SnapshotAction::Push(snapshot, base)) => {
            drive_snapshot_push(
                sync.clone(),
                crate::daemon_base::daemon_base(),
                request_id,
                snapshot,
                base,
            );
        }
        None => {}
    }
}

/// Acquire `push_busy` (waiting via self-reschedule), then push the snapshot.
fn drive_snapshot_push(
    sync: SharedSync,
    base: String,
    request_id: String,
    snapshot: BridgeDocumentSnapshot,
    save_base: Option<u64>,
) {
    // A periodic push may have installed this exact snapshot while it waited.
    // In that case the now-synced version is the save acknowledgement.
    let accepted = {
        let state = sync.borrow();
        (save_base.is_some() && state.gate.is_synced(snapshot.pair()))
            .then(|| state.client.last_version())
    };
    if let Some(version) = accepted {
        post_to_parent(&snapshot.save_result(&request_id, Some(version)));
        return;
    }
    if !acquire_push_busy(&sync) {
        schedule_once(PUSH_BUSY_RETRY_MS, move || {
            drive_snapshot_push(sync, base, request_id, snapshot, save_base)
        });
        return;
    }
    snapshot_push_attempt(sync, base, request_id, snapshot, save_base);
}

/// Snapshot-channel push against the established daemon baseline. Confirm → `mark_pushed` + `note_synced` + `snapshot-result`.
/// Conflict → `note_conflict` (observer will report `sync-conflict`) +
/// `snapshot-conflict` reply.
fn snapshot_push_attempt(
    sync: SharedSync,
    base: String,
    request_id: String,
    snapshot: BridgeDocumentSnapshot,
    save_base: Option<u64>,
) {
    // A managed save must retain the version from capture time. Renewing it
    // while waiting behind another push could overwrite a later daemon edit.
    let base_version = save_base.unwrap_or_else(|| sync.borrow().client.last_version());
    let push_body = snapshot.push_body(base_version);
    let doc_url = format!("{base}/api/mcp/document");
    let on_resp: Rc<dyn Fn(String)> = {
        let sync = sync.clone();
        Rc::new(move |resp: String| {
            if let Some(server_v) = WebSyncClient::parse_push_conflict(&resp) {
                if let Ok(mut s) = sync.try_borrow_mut() {
                    s.gate.note_conflict(server_v);
                    s.push_busy = false;
                }
                post_to_parent(&event_snapshot_conflict(&request_id, server_v));
                return;
            }
            if let Some(version) = WebSyncClient::parse_push_response(&resp) {
                let pair = snapshot.pair();
                if let Ok(mut s) = sync.try_borrow_mut() {
                    snapshot.mark_pushed(&mut s.client, version);
                    s.gate.note_synced(pair.0, pair.1);
                    s.push_busy = false;
                }
                post_to_parent(&snapshot.save_result(&request_id, save_base.map(|_| version)));
                return;
            }
            release_push_busy(&sync);
        })
    };
    if !live_sync::post_json(&doc_url, &push_body, Some(on_resp)) {
        release_push_busy(&sync);
    }
}

/// `save-committed`: mark the reported revision saved. A stale generation
/// (the host acked a save for a document already replaced) returns `false` and
/// is silently dropped. The resulting dirty-flag flip is reported by the
/// observer as `dirty-changed`, not here.
pub(super) fn handle_save_committed<C: RepaintContext + 'static>(
    inner: &Rc<RefCell<C>>,
    generation: u64,
    revision: u64,
) {
    let Ok(mut b) = inner.try_borrow_mut() else {
        return;
    };
    let _ = b
        .host_mut()
        .editor_state_mut()
        .mark_saved_revision_at(generation, revision);
    let _ = b.repaint();
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn conflicted_recovery_returns_current_browser_bytes_without_clearing_the_conflict() {
        let doc = op_pen_loader::load_canonical(
            r#"{"version":"1.0.0","children":[{"type":"rectangle","id":"local","name":"Local edit","width":40,"height":20}]}"#,
        )
        .expect("document")
        .value;
        let mut state = EditorState::from_document(doc);
        state.mark_document_changed();
        let pair = (state.document_generation(), state.document_revision());
        let mut sync = SyncController::new();
        sync.gate.note_conflict(17);

        for (purpose, expected_type) in [
            ("recovery", "op-bridge/snapshot-result"),
            ("save", "op-bridge/snapshot-conflict"),
            ("backup", "op-bridge/snapshot-conflict"),
        ] {
            let request = serde_json::json!({
                "type": "op-bridge/snapshot",
                "purpose": purpose,
                "requestId": "request-1",
            });
            let Some(op_editor_core::bridge_protocol::BridgeInbound::Snapshot {
                purpose,
                request_id,
            }) = op_editor_core::bridge_protocol::BridgeInbound::parse(&request.to_string())
            else {
                panic!("snapshot request must parse");
            };
            let action = snapshot_action(&purpose, &request_id, Some(&sync), || {
                assert_eq!(purpose, "recovery", "a conflicted save must not capture");
                BridgeDocumentSnapshot::capture(&state)
            })
            .expect("direct response");
            let SnapshotAction::Reply(reply) = action else {
                panic!("a conflicted snapshot must not push");
            };
            let reply: serde_json::Value = serde_json::from_str(&reply).unwrap();
            assert_eq!(reply["type"], expected_type);
            assert_eq!(reply["requestId"], "request-1");
            if purpose == "recovery" {
                assert_eq!(reply["generation"], pair.0);
                assert_eq!(reply["revision"], pair.1);
                assert_eq!(reply["dirty"], true);
                let doc: serde_json::Value =
                    serde_json::from_str(reply["docJson"].as_str().unwrap()).unwrap();
                assert_eq!(doc["children"][0]["id"], "local");
            } else {
                assert_eq!(reply["serverVersion"], 17);
            }
            assert_eq!(sync.gate.conflict(), Some(17));
        }
    }

    #[test]
    fn recovery_does_not_use_the_save_push_channel() {
        let state = EditorState::new();
        let mut sync = SyncController::new();
        sync.gate
            .note_synced(state.document_generation() + 1, state.document_revision());
        let capture = || BridgeDocumentSnapshot::capture(&state);
        assert!(matches!(
            snapshot_action("save", "save-request", Some(&sync), capture),
            Some(SnapshotAction::Push(_, None))
        ));
        assert!(matches!(
            snapshot_action("recovery", "recover-request", Some(&sync), capture),
            Some(SnapshotAction::Reply(_))
        ));
    }

    #[test]
    fn managed_save_reports_the_daemon_version_of_its_captured_revision() {
        let mut state = EditorState::new();
        let mut sync = SyncController::new();
        sync.managed_refresh = true;
        sync.client.mark_applied(7);
        sync.gate
            .note_synced(state.document_generation(), state.document_revision());
        let capture = || BridgeDocumentSnapshot::capture(&state);
        let Some(SnapshotAction::Reply(reply)) =
            snapshot_action("save", "save-request", Some(&sync), capture)
        else {
            panic!("synced save must reply directly");
        };
        assert_eq!(
            serde_json::from_str::<serde_json::Value>(&reply).unwrap()["daemonVersion"],
            7
        );
        state.mark_document_changed();
        let capture = || BridgeDocumentSnapshot::capture(&state);
        assert!(matches!(
            snapshot_action("save", "save-request", Some(&sync), capture),
            Some(SnapshotAction::Push(_, Some(7)))
        ));
    }

    #[test]
    fn sync_baseline_uses_typed_bytes_while_disk_snapshot_embeds_metadata() {
        let doc = op_pen_loader::load_canonical(
            r#"{"version":"1.0.0","children":[],"pages":[
              {"id":"p1","name":"One","children":[]},
              {"id":"p2","name":"Two","children":[]},
              {"id":"p3","name":"Three","children":[]}
            ]}"#,
        )
        .expect("document")
        .value;
        let mut state = EditorState::from_document(doc);
        assert!(state.set_active_page(2));
        state.editor_ui.preserve_authored_geometry = true;
        let snapshot = BridgeDocumentSnapshot::capture(&state).expect("snapshot");
        let mut client = WebSyncClient::new();

        snapshot.mark_pushed(&mut client, 7);

        assert_eq!(client.last_version(), 7);
        assert!(!client.should_push_with_editor_meta(snapshot.document_json.as_ref(), 2, true));
        assert_eq!(
            op_pen_loader::extract_editor_meta(&snapshot.externalized_json()),
            Some(EditorMeta {
                active_page_index: 2,
                preserve_authored_geometry: true,
                scenario: None,
                pinned_style_guide: None,
                viewport: None,
            })
        );
    }

    #[test]
    fn saved_view_survives_bridge_disk_and_daemon_snapshot_paths() {
        let mut state = EditorState::new();
        state.viewport.pan_x = 123.25;
        state.viewport.pan_y = -45.5;
        state.viewport.zoom = 1.25;
        let snapshot = BridgeDocumentSnapshot::capture(&state).unwrap();
        let pushed: serde_json::Value = serde_json::from_str(&snapshot.push_body(1)).unwrap();
        for source in [snapshot.externalized_json(), pushed["document"].to_string()] {
            let meta = op_pen_loader::extract_editor_meta(&source).unwrap();
            assert_eq!(meta.viewport, Some(state.viewport));
        }
        assert_eq!(
            snapshot.pair(),
            (state.document_generation(), state.document_revision())
        );
        assert!(!state.is_dirty());
        assert!(!state.history.can_undo());
    }
}
