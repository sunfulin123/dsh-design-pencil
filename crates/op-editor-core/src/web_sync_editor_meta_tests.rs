use super::WebSyncClient;

const V3: &str = r#"{"document":{"version":"1.0","children":[]},"version":3}"#;

#[test]
fn camera_push_captures_fractional_view_and_acknowledges_only_that_view() {
    use crate::Viewport;
    let mut client = WebSyncClient::new();
    let camera = Viewport {
        pan_x: 20.25,
        pan_y: -10.125,
        zoom: 1.25,
    };
    assert!(!client.viewport_needs_push(camera));
    client.sync(V3, |_, _| true).unwrap();
    assert!(!client.metadata_only_push_supported());
    client.note_applied_snapshot(r#"{"children":[]}"#);
    assert!(client.viewport_needs_push(camera));
    let body: serde_json::Value = serde_json::from_str(&client.wrap_view_state_push(
        r#"{"children":[]}"#,
        0,
        false,
        true,
        camera,
    ))
    .unwrap();
    assert_eq!(
        body["baseViewport"],
        serde_json::json!({"panX":0,"panY":0,"zoom":1})
    );
    assert_eq!(body["viewport"], serde_json::to_value(camera).unwrap());
    assert_eq!(body["metadataOnly"], true);
    assert_eq!(body["baseVersion"], 3);
    client.note_applied_viewport(camera);
    assert!(!client.viewport_needs_push(camera));
    assert!(!client.should_push(r#"{"children":[]}"#));
    assert!(client.viewport_needs_push(Viewport {
        pan_x: 21.5,
        ..camera
    }));
    assert!(client.viewport_needs_push(Viewport::IDENTITY));
    let response = r#"{"document":{"version":"1.0","children":[]},"version":3,"viewport":{"panX":20.25,"panY":-10.125,"zoom":1.25},"metadataOnlyPush":true}"#;
    assert!(!client
        .sync_with_view_state(response, |_| panic!("no echo"))
        .unwrap());
    assert!(client
        .sync_with_view_state_force(response, true, |_| true)
        .unwrap());
    assert!(client.metadata_only_push_supported());
}

#[test]
fn pull_merges_each_top_level_field_over_nested_metadata() {
    let client = WebSyncClient::new();
    let nested = client
        .next_document_with_metadata(
            r#"{"document":{"version":"1.0","children":[],"editorMeta":{"activePageIndex":4,"preserveAuthoredGeometry":true}},"version":3}"#,
        )
        .expect("valid response")
        .expect("first version");
    assert_eq!(nested.version, 3);
    assert_eq!(nested.active_page_index, 4);
    assert!(nested.preserve_authored_geometry);

    let active_override = client
        .next_document_with_metadata(
            r#"{"document":{"version":"1.0","children":[],"editorMeta":{"activePageIndex":4,"preserveAuthoredGeometry":true}},"version":3,"activePageIndex":2}"#,
        )
        .expect("valid response")
        .expect("first version");
    assert_eq!(active_override.active_page_index, 2);
    assert!(
        active_override.preserve_authored_geometry,
        "an active-page override must not discard nested geometry mode"
    );

    let preserve_override = client
        .next_document_with_metadata(
            r#"{"document":{"version":"1.0","children":[],"editorMeta":{"activePageIndex":4,"preserveAuthoredGeometry":true}},"version":3,"preserveAuthoredGeometry":false}"#,
        )
        .expect("valid response")
        .expect("first version");
    assert_eq!(preserve_override.active_page_index, 4);
    assert!(!preserve_override.preserve_authored_geometry);

    let legacy = client
        .next_document_with_metadata(V3)
        .expect("legacy response stays valid")
        .expect("first version");
    assert_eq!(legacy.active_page_index, 0);
    assert!(!legacy.preserve_authored_geometry);

    let malformed_optional = client
        .next_document_with_metadata(
            r#"{"document":{"version":"1.0","children":[],"editorMeta":{"activePageIndex":5,"preserveAuthoredGeometry":true}},"version":3,"activePageIndex":"bad","preserveAuthoredGeometry":"yes"}"#,
        )
        .expect("invalid optional metadata does not reject the document")
        .expect("first version");
    assert_eq!(malformed_optional.active_page_index, 5);
    assert!(malformed_optional.preserve_authored_geometry);
}

#[test]
fn sync_applies_active_page_and_geometry_as_one_version() {
    let mut client = WebSyncClient::new();
    let body = r#"{"document":{"version":"1.0","children":[],"editorMeta":{"activePageIndex":6,"preserveAuthoredGeometry":true}},"version":8,"activePageIndex":3}"#;
    let mut applied = None;
    assert!(client
        .sync_with_editor_meta(body, |_doc, version, page, preserve, _scenario| {
            applied = Some((version, page, preserve));
            true
        })
        .expect("valid response"));
    assert_eq!(applied, Some((8, 3, true)));
    assert_eq!(client.applied_version(), 8);
}

#[test]
fn baseline_detects_each_editor_meta_change_and_suppresses_own_echo() {
    let mut client = WebSyncClient::new();
    assert!(client.sync(V3, |_d, _v| true).expect("initial sync"));
    let doc = r#"{"version":"1.0","children":[]}"#;
    client.note_applied_snapshot_with_editor_meta(doc, 2, true);
    assert!(!client.editor_meta_needs_push(2, true));
    assert!(client.editor_meta_needs_push(3, true));
    assert!(!client.should_push_with_editor_meta(doc, 2, true));
    assert!(client.should_push_with_editor_meta(doc, 3, true));
    assert!(client.should_push_with_editor_meta(doc, 2, false));

    client.mark_pushed_with_editor_meta(doc, 3, false, 4);
    assert_eq!(client.applied_version(), 4);
    assert!(!client.should_push_with_editor_meta(doc, 3, false));
    let own_echo = r#"{"document":{"version":"1.0","children":[]},"version":4,"activePageIndex":3,"preserveAuthoredGeometry":false}"#;
    assert!(
        client
            .next_document_with_metadata(own_echo)
            .expect("valid echo")
            .is_none(),
        "a metadata-only push acknowledgement must suppress a full-document echo apply"
    );
}

#[test]
fn push_adds_active_page_and_preserve_mode() {
    let doc = r#"{"version":"1.0","children":[]}"#;
    let body = WebSyncClient::wrap_push_body_with_base_and_editor_meta(doc, 7, 3, true);
    let value: serde_json::Value = serde_json::from_str(&body).expect("push json");
    assert_eq!(value["baseVersion"], 7);
    assert_eq!(value["activePageIndex"], 3);
    assert_eq!(value["preserveAuthoredGeometry"], true);

    let metadata_only =
        WebSyncClient::wrap_push_body_with_base_editor_meta_and_mode(doc, 7, 4, false, true);
    let value: serde_json::Value = serde_json::from_str(&metadata_only).expect("push json");
    assert_eq!(value["metadataOnly"], true);
    assert_eq!(value["activePageIndex"], 4);
}
#[test]
fn same_version_saved_view_change_is_not_lost_by_sync() {
    let mut client = super::WebSyncClient::new();
    let initial = r#"{"version":1,"document":{"version":"0.8.0","children":[]}}"#;
    assert!(client.sync(initial, |_, _| true).unwrap());
    let moved = r#"{"version":1,"document":{"version":"0.8.0","children":[],"editorMeta":{"viewport":{"panX":123.25,"panY":-45.5,"zoom":1.25}}}}"#;
    assert!(
        client.next_document_with_metadata(moved).unwrap().is_some(),
        "view-only metadata can change without advancing the content version"
    );
}

#[test]
fn saved_view_sync_restores_resets_and_baselines_without_echo_or_history() {
    let mut client = super::WebSyncClient::new();
    let mut state = crate::EditorState::new();
    let doc = serde_json::to_value(&state.doc).unwrap();
    let mut response = serde_json::json!({
        "version": 1,
        "document": doc,
        "viewport": {"panX": 123.25, "panY": -45.5, "zoom": 1.25}
    });
    let mut apply = |next: super::WebSyncDocument| {
        assert_eq!(next.document, state.doc);
        if next.viewport_changed {
            state.viewport = next.viewport.unwrap_or(crate::Viewport::IDENTITY);
        }
        true
    };
    let saved = response.to_string();
    assert!(client.sync_with_view_state(&saved, &mut apply).unwrap());
    assert!(!client.sync_with_view_state(&saved, &mut apply).unwrap());
    response.as_object_mut().unwrap().remove("viewport");
    let reset = response.to_string();
    assert!(client.sync_with_view_state(&reset, &mut apply).unwrap());
    assert!(!client.sync_with_view_state(&reset, &mut apply).unwrap());
    assert_eq!(state.viewport, crate::Viewport::IDENTITY);
    assert!(!state.is_dirty());
    assert!(!state.history.can_undo());
}

#[test]
fn nested_saved_view_is_validated_and_failed_apply_is_retried() {
    let mut client = super::WebSyncClient::new();
    let body = r#"{"version":1,"document":{"version":"0.8.0","children":[],"editorMeta":{"viewport":{"pan_x":12.5,"pan_y":-4.25,"zoom":100}}}}"#;
    let next = client.next_document_with_metadata(body).unwrap().unwrap();
    assert_eq!(
        next.viewport.unwrap(),
        crate::Viewport {
            pan_x: 12.5,
            pan_y: -4.25,
            zoom: crate::Viewport::MAX_ZOOM,
        }
    );
    assert!(!client.sync_with_view_state(body, |_| false).unwrap());
    assert!(client.sync_with_view_state(body, |_| true).unwrap());
    assert!(client.next_document_with_metadata(body).unwrap().is_none());
}
