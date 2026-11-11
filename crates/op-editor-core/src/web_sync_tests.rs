use super::*;

#[test]
fn first_pull_uses_the_host_compatibility_loader_only_for_noncanonical_documents() {
    let body = r##"{"document":{"version":"1.0.0","children":[
        {"type":"frame","id":"master","reusable":true,"width":160,"height":48,"fill":"#ff0000"},
        {"type":"frame","id":"screen","x":220,"width":400,"height":300,"fill":"#0000ff"}
    ]},"version":0,"activePageIndex":0,"preserveAuthoredGeometry":false,"viewport":null,"metadataOnlyPush":true}"##;
    let mut client = WebSyncClient::new();
    let applied = client
        .sync_with_view_state_force_with_loader(
            body,
            false,
            |document| {
                let mut canonical = document.clone();
                for node in canonical["children"].as_array_mut().unwrap() {
                    let color = node["fill"].take();
                    node["fill"] = serde_json::json!([{ "type": "solid", "color": color }]);
                }
                serde_json::from_value(canonical).map_err(|error| error.to_string())
            },
            |next| {
                assert_eq!(next.document.children.len(), 2);
                true
            },
        )
        .unwrap();
    assert!(applied);
    assert!(client.initialized());
    assert_eq!(client.last_version(), 0);
    let canonical = r#"{"document":{"version":"1.0","children":[]},"version":1}"#;
    assert!(client
        .sync_with_view_state_force_with_loader(
            canonical,
            false,
            |_| { panic!("canonical documents must not require the compatibility loader") },
            |_| true
        )
        .unwrap());
    let mut rejected = WebSyncClient::new();
    assert!(rejected
        .sync_with_view_state_force_with_loader(
            body,
            false,
            |_| Err("invalid compatibility data".to_string()),
            |_| panic!("a failed load must never be applied"),
        )
        .is_err());
    assert!(!rejected.initialized());
}

const V3: &str = r#"{"document":{"version":"1.0","children":[]},"version":3}"#;

#[test]
fn next_document_offers_the_first_response() {
    let c = WebSyncClient::new();
    assert!(matches!(c.next_document(V3), Ok(Some((_, 3)))));
    // Read-only: not committed until mark_applied.
    assert_eq!(c.applied_version(), 0);
}

#[test]
fn mark_applied_then_skips_equal_or_older_versions() {
    let mut c = WebSyncClient::new();
    assert!(c.next_document(V3).expect("ok").is_some());
    c.mark_applied(3);
    // Same version → nothing newer.
    assert!(c.next_document(V3).expect("ok").is_none());
    // Older version → nothing newer.
    let older = r#"{"document":{"version":"1.0","children":[]},"version":2}"#;
    assert!(c.next_document(older).expect("ok").is_none());
    assert_eq!(c.applied_version(), 3);
}

#[test]
fn next_document_offers_a_newer_version_after_commit() {
    let mut c = WebSyncClient::new();
    c.mark_applied(3);
    let newer = r#"{"document":{"version":"1.0","children":[]},"version":5}"#;
    assert!(matches!(c.next_document(newer), Ok(Some((_, 5)))));
}

#[test]
fn uncommitted_version_is_re_offered_so_a_failed_repaint_is_not_lost() {
    // Decide-then-commit: if the caller does NOT mark_applied (e.g. repaint
    // failed), the same newer version must still be offered next poll.
    let c = WebSyncClient::new();
    assert!(c.next_document(V3).expect("ok").is_some());
    // No mark_applied → still offered.
    assert!(c.next_document(V3).expect("ok").is_some());
}

#[test]
fn sync_commits_only_on_apply_success_and_never_stale() {
    let mut c = WebSyncClient::new();
    // apply succeeds → commits exactly the applied version (3).
    let mut applied_version = None;
    assert!(c
        .sync(V3, |_doc, v| {
            applied_version = Some(v);
            true
        })
        .expect("ok"));
    assert_eq!(applied_version, Some(3));
    assert_eq!(c.applied_version(), 3);
    // nothing newer → apply callback not invoked.
    let mut called = false;
    assert!(!c
        .sync(V3, |_d, _v| {
            called = true;
            true
        })
        .expect("ok"));
    assert!(!called);
    // newer, but apply (repaint) FAILS → NOT committed (stays 3), retried.
    let v5 = r#"{"document":{"version":"1.0","children":[]},"version":5}"#;
    assert!(!c.sync(v5, |_d, _v| false).expect("ok"));
    assert_eq!(c.applied_version(), 3);
    // retry succeeds → commits 5.
    assert!(c.sync(v5, |_d, _v| true).expect("ok"));
    assert_eq!(c.applied_version(), 5);
}

#[test]
fn metadata_aware_sync_applies_preserve_mode_before_committing_version() {
    let mut c = WebSyncClient::new();
    let body = r#"{"document":{"version":"1.0","children":[]},"version":8,"preserveAuthoredGeometry":true}"#;
    let mut applied = None;
    assert!(c
        .sync_with_metadata(body, |_doc, version, preserve| {
            applied = Some((version, preserve));
            true
        })
        .expect("valid response"));
    assert_eq!(applied, Some((8, true)));
    assert_eq!(c.applied_version(), 8);
}

#[test]
fn next_document_rejects_malformed_responses() {
    let c = WebSyncClient::new();
    assert!(c.next_document("not json").is_err());
    // Missing version.
    assert!(c
        .next_document(r#"{"document":{"version":"1.0","children":[]}}"#)
        .is_err());
    // Missing document on a first (would-apply) response.
    assert!(c.next_document(r#"{"version":1}"#).is_err());
}

#[test]
fn build_push_body_wraps_the_document() {
    let doc: PenDocument = serde_json::from_str(r#"{"version":"1.0","children":[]}"#).expect("doc");
    let body = WebSyncClient::build_push_body(&doc).expect("body");
    assert!(body.starts_with(r#"{"document":"#), "{body}");
    assert!(body.contains(r#""version":"1.0""#), "{body}");
    // Round-trips back through the daemon's request parser shape.
    let value: serde_json::Value = serde_json::from_str(&body).expect("valid json");
    assert!(value.get("document").is_some());
    // The wrap helper produces the identical body from the same JSON.
    let doc_json = serde_json::to_string(&doc).expect("doc json");
    assert_eq!(WebSyncClient::wrap_push_body(&doc_json), body);
}

#[test]
fn version_probe_gates_the_document_fetch() {
    let mut c = WebSyncClient::new();
    // First sync: any version (even 0) warrants a fetch.
    assert!(c.wants_version(0));
    c.mark_applied(3);
    assert!(!c.wants_version(2));
    assert!(!c.wants_version(3));
    assert!(c.wants_version(4));
    // Probe body parsing.
    assert_eq!(
        WebSyncClient::parse_version_probe(r#"{"version":7}"#),
        Some(7)
    );
    assert_eq!(WebSyncClient::parse_version_probe(r#"{"ok":false}"#), None);
    assert_eq!(WebSyncClient::parse_version_probe("not json"), None);
}

#[test]
fn push_is_gated_on_first_sync_and_content_change() {
    let mut c = WebSyncClient::new();
    let starter = r#"{"version":"1.0","children":[]}"#;
    // Before the first daemon apply the browser must NOT push its
    // boot-time starter document over the daemon's post-reset authority.
    assert!(!c.initialized());
    assert!(!c.should_push(starter));
    // Apply the daemon doc, note its local serialization as baseline.
    assert!(c.sync(V3, |_d, _v| true).expect("ok"));
    c.note_applied_snapshot(starter);
    // Unchanged content → no push (the echo-suppression core).
    assert!(!c.should_push(starter));
    // A real local edit changes the serialization → push.
    let edited = r#"{"version":"1.0","children":[{"id":"n1"}]}"#;
    assert!(c.should_push(edited));
}

#[test]
fn bootstrap_push_is_disabled_before_the_first_daemon_apply() {
    let mut c = WebSyncClient::new();
    let starter = r#"{"version":"1.0","children":[]}"#;
    let edited = r#"{"version":"1.0","children":[{"id":"n1"}]}"#;

    assert!(!c.should_bootstrap_push(starter, starter));
    assert!(!c.should_bootstrap_push(edited, starter));

    c.mark_pushed(edited, 1);
    assert!(!c.should_bootstrap_push(edited, starter));
}

#[test]
fn mark_pushed_commits_baseline_and_version_so_echo_is_skipped() {
    let mut c = WebSyncClient::new();
    assert!(c.sync(V3, |_d, _v| true).expect("ok"));
    let edited = r#"{"version":"1.0","children":[{"id":"n1"}]}"#;
    assert!(c.should_push(edited));
    // Daemon accepted the push as version 4.
    c.mark_pushed(edited, 4);
    assert_eq!(c.applied_version(), 4);
    // Neither the content nor the version is re-offered (no echo).
    assert!(!c.should_push(edited));
    assert!(!c.wants_version(4));
    let echo = r#"{"document":{"version":"1.0","children":[]},"version":4}"#;
    assert!(c.next_document(echo).expect("ok").is_none());
    // A later external version still syncs.
    assert!(c.wants_version(5));
}

#[test]
fn push_response_parses_only_the_ok_shape() {
    assert_eq!(
        WebSyncClient::parse_push_response(r#"{"ok":true,"version":9}"#),
        Some(9)
    );
    assert_eq!(
        WebSyncClient::parse_push_response(r#"{"ok":false,"error":"x"}"#),
        None
    );
    assert_eq!(WebSyncClient::parse_push_response(r#"{"version":9}"#), None);
    assert_eq!(WebSyncClient::parse_push_response(""), None);
}

#[test]
fn push_body_with_base_and_conflict_roundtrip() {
    let body = WebSyncClient::wrap_push_body_with_base(r#"{"pages":[]}"#, 7);
    assert!(body.contains(r#""baseVersion":7"#));
    assert_eq!(
        WebSyncClient::parse_push_conflict(
            r#"{"ok":false,"error":"version-conflict","version":12}"#
        ),
        Some(12)
    );
    assert_eq!(
        WebSyncClient::parse_push_conflict(r#"{"ok":true,"version":9}"#),
        None
    );
}

#[test]
fn metadata_aware_push_adds_preserve_mode_without_changing_legacy_helpers() {
    let doc = r#"{"version":"1.0","children":[]}"#;
    let preserved = WebSyncClient::wrap_push_body_with_base_and_preserve(doc, 7, true);
    let value: serde_json::Value = serde_json::from_str(&preserved).expect("push json");
    assert_eq!(value["baseVersion"], 7);
    assert_eq!(value["preserveAuthoredGeometry"], true);

    let legacy = WebSyncClient::wrap_push_body_with_base(doc, 7);
    let legacy_value: serde_json::Value = serde_json::from_str(&legacy).expect("legacy json");
    assert!(legacy_value.get("preserveAuthoredGeometry").is_none());
}

#[test]
fn selection_key_and_body_track_ids_and_active_page() {
    let mut state = crate::EditorState::new();
    let key_empty = selection_sync_key(&state);
    assert_eq!(key_empty, "sel:|page:");
    state.doc.children = vec![];
    state.selection.set = vec![crate::NodeId::new("n1"), crate::NodeId::new("n2")];
    state.selection.anchor = crate::NodeId::new("n2");
    let key = selection_sync_key(&state);
    assert_eq!(key, "sel:n1,n2|page:");
    assert_ne!(key, key_empty);
    // Body matches the TS selection.post.ts renderer shape.
    let body: serde_json::Value = serde_json::from_str(&selection_push_body(&state)).expect("json");
    assert_eq!(body["selectedIds"], serde_json::json!(["n1", "n2"]));
    assert_eq!(body["activePageId"], serde_json::Value::Null);
}

#[test]
fn selection_body_carries_the_active_page_id() {
    let doc: PenDocument = serde_json::from_str(
        r#"{"version":"1.0","children":[],"pages":[
            {"id":"p1","name":"One","children":[]},
            {"id":"p2","name":"Two","children":[]}
        ]}"#,
    )
    .expect("doc");
    let mut state = crate::EditorState::from_document(doc);
    assert!(selection_sync_key(&state).ends_with("|page:p1"));
    assert!(state.set_active_page(1));
    assert!(selection_sync_key(&state).ends_with("|page:p2"));
    let body: serde_json::Value = serde_json::from_str(&selection_push_body(&state)).expect("json");
    assert_eq!(body["activePageId"], "p2");
}

fn applied_client(version: u64, viewport: Option<crate::Viewport>) -> WebSyncClient {
    let mut c = WebSyncClient::new();
    c.mark_applied(version);
    if let Some(viewport) = viewport {
        c.note_applied_viewport(viewport);
    }
    c
}

#[test]
fn an_unchanged_probe_skips_the_document_download() {
    let view = crate::Viewport {
        pan_x: 10.0,
        pan_y: -4.5,
        zoom: 0.5,
    };
    let c = applied_client(7, Some(view));
    let probe = r#"{"version":7,"viewport":{"panX":10,"panY":-4.5,"zoom":0.5},"uiScale":null}"#;
    assert!(c.probe_skips_document(probe, false));
    // Identity camera is stored as `None`; a null probe viewport matches it.
    let identity = applied_client(7, None);
    assert!(identity.probe_skips_document(r#"{"version":7,"viewport":null,"uiScale":null}"#, false));
}

#[test]
fn a_probe_requests_the_document_whenever_the_full_reply_could_matter() {
    let view = crate::Viewport {
        pan_x: 10.0,
        pan_y: -4.5,
        zoom: 0.5,
    };
    let c = applied_client(7, Some(view));
    let same = r#"{"version":7,"viewport":{"panX":10,"panY":-4.5,"zoom":0.5},"uiScale":null}"#;
    for (probe, why) in [
        (
            r#"{"version":8,"viewport":{"panX":10,"panY":-4.5,"zoom":0.5},"uiScale":null}"#,
            "newer content",
        ),
        (
            r#"{"version":7,"viewport":{"panX":11,"panY":-4.5,"zoom":0.5},"uiScale":null}"#,
            "daemon camera moved",
        ),
        (
            r#"{"version":7,"viewport":{"panX":10,"panY":-4.5,"zoom":0.5},"uiScale":125}"#,
            "pending UI scale hint",
        ),
        (r#"{"version":7}"#, "older daemon without probe metadata"),
        ("not json", "unreadable probe"),
    ] {
        assert!(!c.probe_skips_document(probe, false), "{why}");
    }
    assert!(
        !c.probe_skips_document(same, true),
        "a forced view pull still fetches"
    );
    assert!(
        !WebSyncClient::new().probe_skips_document(same, false),
        "the first pull always fetches"
    );
}
