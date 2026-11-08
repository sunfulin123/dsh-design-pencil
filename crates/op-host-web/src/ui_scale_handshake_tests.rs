use super::*;
use crate::widget_host::WidgetHost;
use op_editor_core::{EditorCommand, Viewport};
use wasm_bindgen::JsValue;

struct TestContext {
    host: WidgetHost,
    repaints: usize,
}

impl RepaintContext for TestContext {
    fn host(&self) -> &WidgetHost {
        &self.host
    }
    fn host_mut(&mut self) -> &mut WidgetHost {
        &mut self.host
    }
    fn viewport_size(&self) -> (f32, f32) {
        (1440.0, 900.0)
    }
    fn register_system_font(&mut self, _: &str, _: &[u8]) -> bool {
        false
    }
    fn register_imported_font(&mut self, _: &str, _: &[u8]) -> bool {
        false
    }
    fn register_imported_font_from_bytes(&mut self, _: &[u8]) -> Option<String> {
        None
    }
    fn imported_family_list(&self) -> Vec<String> {
        Vec::new()
    }
    fn remove_imported_font(&mut self, _: &str) {}
    fn repaint(&mut self) -> Result<(), JsValue> {
        self.repaints += 1;
        Ok(())
    }
}

#[test]
fn matching_ui_scale_hint_forces_ack_on_every_same_version_receipt() {
    let mut host = WidgetHost::new();
    host.editor_state_mut()
        .apply(EditorCommand::SetUiScale { percent: 125 });
    host.editor_state_mut().viewport = Viewport {
        pan_x: 123.456,
        pan_y: -98.765,
        zoom: 0.777,
    };
    let state = host.editor_state();
    let document = state.doc.clone();
    let camera = state.viewport;
    let history = state.history.past.clone();
    let future = state.history.future.clone();
    let revision = state.document_revision();
    let generation = state.document_generation();
    let dirty = state.is_dirty();
    let key = crate::ui_scale_sync::selection_key(state);
    let body = serde_json::json!({"document":document,"version":7,"uiScale":125}).to_string();
    let inner = Rc::new(RefCell::new(TestContext { host, repaints: 0 }));
    let sync = Rc::new(RefCell::new(SyncController::new()));
    sync.borrow_mut().client.mark_applied(7);
    sync.borrow_mut().gate.note_synced(generation, revision);
    let last_key = Rc::new(RefCell::new(Some(key.clone())));

    // Each pending command must be acknowledged, even if a null/cleared GET
    // never arrived between two identical host requests.
    for _ in 0..2 {
        let epoch = sync.borrow().client.viewport_epoch();
        apply_document_response(&inner, &body, &sync, &last_key, epoch, false);
        assert!(
            last_key.borrow().is_none(),
            "valid no-op hint must force a selection acknowledgement"
        );
        let context = inner.borrow();
        let state = context.host.editor_state();
        assert_eq!(
            context.repaints, 0,
            "an acknowledgement alone needs no repaint"
        );
        assert_eq!(state.doc, document);
        assert_eq!(state.viewport, camera);
        assert_eq!(state.history.past, history);
        assert_eq!(state.history.future, future);
        assert_eq!(state.document_revision(), revision);
        assert_eq!(state.document_generation(), generation);
        assert_eq!(state.is_dirty(), dirty);
        assert_eq!(state.editor_ui.ui_scale.percent(), 125);
        assert_eq!(sync.borrow().client.last_version(), 7);
        *last_key.borrow_mut() = Some(key.clone());
    }
}

#[test]
fn repeated_same_scale_request_without_null_get_reapplies_after_user_change() {
    let mut host = WidgetHost::new();
    host.editor_state_mut()
        .apply(EditorCommand::SetUiScale { percent: 125 });
    let body = serde_json::json!({"document":host.editor_state().doc,"version":7,"uiScale":125})
        .to_string();
    let inner = Rc::new(RefCell::new(TestContext { host, repaints: 0 }));
    let sync = Rc::new(RefCell::new(SyncController::new()));
    sync.borrow_mut().client.mark_applied(7);
    let state = inner.borrow();
    sync.borrow_mut().gate.note_synced(
        state.host.editor_state().document_generation(),
        state.host.editor_state().document_revision(),
    );
    drop(state);
    let last_key = Rc::new(RefCell::new(None));
    let epoch = sync.borrow().client.viewport_epoch();
    apply_document_response(&inner, &body, &sync, &last_key, epoch, false);
    inner
        .borrow_mut()
        .host
        .editor_state_mut()
        .apply(EditorCommand::SetUiScale { percent: 150 });
    *last_key.borrow_mut() = Some(crate::ui_scale_sync::selection_key(
        inner.borrow().host.editor_state(),
    ));
    let epoch = sync.borrow().client.viewport_epoch();
    apply_document_response(&inner, &body, &sync, &last_key, epoch, false);
    assert!(last_key.borrow().is_none());
    assert_eq!(
        inner
            .borrow()
            .host
            .editor_state()
            .editor_ui
            .ui_scale
            .percent(),
        125
    );
    assert_eq!(inner.borrow().repaints, 1);
}

#[test]
fn viewport_pull_preserves_new_local_camera_and_applies_remote_view_without_undo() {
    let mut host = WidgetHost::new();
    host.editor_state_mut().viewport = Viewport::IDENTITY;
    let state = host.editor_state();
    let pair = (state.document_generation(), state.document_revision());
    let doc = state.doc.clone();
    let history = state.history.past.clone();
    let dirty = state.is_dirty();
    let inner = Rc::new(RefCell::new(TestContext { host, repaints: 0 }));
    let sync = Rc::new(RefCell::new(SyncController::new()));
    sync.borrow_mut().client.mark_applied(7);
    sync.borrow_mut().gate.note_synced(pair.0, pair.1);
    let key = Rc::new(RefCell::new(None));
    let local = Viewport {
        pan_x: 20.25,
        pan_y: -10.125,
        zoom: 1.25,
    };
    let remote = Viewport {
        pan_x: -15.75,
        pan_y: 21.5,
        zoom: 2.0,
    };
    let response = serde_json::json!({
        "document": doc, "version": 7, "viewport": remote, "metadataOnlyPush": true,
    })
    .to_string();
    inner.borrow_mut().host.editor_state_mut().viewport = local;
    let old_epoch = sync.borrow().client.viewport_epoch();
    apply_document_response(&inner, &response, &sync, &key, old_epoch, false);
    assert_eq!(inner.borrow().host.editor_state().viewport, local);
    sync.borrow_mut().client.note_applied_viewport(local);
    apply_document_response(&inner, &response, &sync, &key, old_epoch, false);
    assert_eq!(inner.borrow().host.editor_state().viewport, local);
    let epoch = sync.borrow().client.viewport_epoch();
    apply_document_response(&inner, &response, &sync, &key, epoch, false);
    let context = inner.borrow();
    let state = context.host.editor_state();
    assert_eq!(state.viewport, remote);
    assert_eq!(state.doc, doc);
    assert_eq!(state.history.past, history);
    assert_eq!(
        (state.document_generation(), state.document_revision()),
        pair
    );
    assert_eq!(state.is_dirty(), dirty);
    assert_eq!(context.repaints, 1);
    assert!(sync.borrow().client.metadata_only_push_supported());
}
