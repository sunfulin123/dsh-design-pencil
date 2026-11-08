//! The per-editor sync controller and the identity pairs every gating
//! decision is keyed on.
//!
//! Split out of `live_sync_glue.rs` at the 800-line cap — pure code motion.

use std::cell::RefCell;
use std::rc::{Rc, Weak};

use op_editor_core::sync_gate::SyncGate;
use op_editor_core::web_sync::WebSyncClient;

use crate::repaint_ctx::RepaintContext;

use super::ACTIVE_SYNC;

/// Shared sync state for one mounted editor.
///
/// The gate and the client must see the same document identity, so they live
/// in one struct rather than as two independently-owned pieces.
pub(crate) struct SyncController {
    pub gate: SyncGate,
    pub client: WebSyncClient,
    pub push_busy: bool,
    pub ui_scale_pull: crate::ui_scale_sync::UiScalePull,
    /// A document identity already measured above the periodic push limit.
    /// WASM linear memory does not shrink after a giant temporary JSON string,
    /// so do not rebuild the same oversized snapshot every two seconds.
    pub(super) oversize_identity: Option<(u64, u64, u64)>,
}

impl SyncController {
    pub(crate) fn new() -> Self {
        Self {
            gate: SyncGate::default(),
            client: WebSyncClient::new(),
            push_busy: false,
            ui_scale_pull: Default::default(),
            oversize_identity: None,
        }
    }

    fn save_version(&self) -> Option<u64> {
        (self.client.initialized() && !self.gate.open_pending() && self.gate.conflict().is_none())
            .then(|| self.client.last_version())
    }

    pub(crate) fn sampling_ready(
        &self,
        version: u64,
        pair: (u64, u64),
        active_page_index: usize,
        preserve_authored_geometry: bool,
    ) -> bool {
        // A render-only mirror never pushes, so local camera / page metadata
        // that differs from the daemon must not hold captures back.
        let meta_settled = crate::render_mode::render_only()
            || !self
                .client
                .editor_meta_needs_push(active_page_index, preserve_authored_geometry);
        self.client.initialized()
            && self.client.last_version() == version
            && !self.push_busy
            && self.gate.is_synced(pair)
            && meta_settled
    }

    pub(crate) fn document_pull_ready(
        &self,
        pair: (u64, u64),
        viewport: op_editor_core::Viewport,
        request_epoch: u64,
    ) -> bool {
        !self.push_busy
            && self.client.viewport_epoch() == request_epoch
            && self.gate.pull_allowed(pair)
            && (crate::render_mode::render_only()
                || !self.gate.is_synced(pair)
                || !self.client.viewport_needs_push(viewport))
    }
}

pub(crate) type SharedSync = Rc<RefCell<SyncController>>;

pub(crate) fn daemon_save_version() -> Option<u64> {
    ACTIVE_SYNC.with(|slot| {
        let sync = slot.borrow().as_ref().and_then(Weak::upgrade)?;
        let version = sync.try_borrow().ok()?.save_version();
        version
    })
}

pub(crate) fn daemon_synced_version(state: &op_editor_core::EditorState) -> Option<u64> {
    ACTIVE_SYNC.with(|slot| {
        let sync = slot.borrow().as_ref().and_then(Weak::upgrade)?;
        let sync = sync.try_borrow().ok()?;
        let version = sync.client.last_version();
        (sync.sampling_ready(
            version,
            (state.document_generation(), state.document_revision()),
            state.ui.active_page_index,
            state.editor_ui.preserve_authored_geometry,
        ) && !sync.client.viewport_needs_push(state.viewport))
        .then_some(version)
    })
}

/// Commit a successful daemon Save as a sync acknowledgement.
///
/// The daemon has already installed exactly the saved snapshot. Recording its
/// version prevents the next probe from downloading and replacing the same
/// potentially huge document, while the snapshot pair reopens the pull gate.
/// A later local edit still differs from this pair and remains eligible for a
/// normal push (or another explicit Save for oversized documents).
pub(crate) fn acknowledge_daemon_save(
    version: u64,
    generation: u64,
    revision: u64,
    active_page_index: usize,
    preserve_authored_geometry: bool,
    viewport: op_editor_core::Viewport,
) {
    ACTIVE_SYNC.with(|slot| {
        let Some(sync) = slot.borrow().as_ref().and_then(Weak::upgrade) else {
            return;
        };
        let mut sync = sync.borrow_mut();
        sync.client.mark_applied(version);
        sync.client
            .note_applied_snapshot_without_hash(active_page_index, preserve_authored_geometry);
        sync.client.note_applied_viewport(viewport);
        sync.gate.note_synced(generation, revision);
    });
}

/// The document-identity pair every gating decision is keyed on. Read fresh
/// from the live editor state at each decision point — never cached — so an
/// edit that lands between a tick firing and its async response landing is
/// always observed.
pub(super) fn current_pair<C: RepaintContext>(b: &C) -> (u64, u64) {
    let s = b.host().editor_state();
    (s.document_generation(), s.document_revision())
}

pub(super) fn current_oversize_identity<C: RepaintContext>(b: &C) -> (u64, u64, u64) {
    let host = b.host();
    let state = host.editor_state();
    let doc = state;
    (
        host.document_epoch(),
        doc.document_generation(),
        doc.document_revision(),
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn sampling_rejects_stale_content_unacknowledged_page_changes_and_inflight_pushes() {
        let mut sync = SyncController::new();
        assert!(!sync.sampling_ready(42, (3, 5), 0, false));
        sync.client.mark_applied(42);
        sync.client.note_applied_editor_meta(0, false);
        sync.gate.note_synced(3, 5);
        assert!(sync.sampling_ready(42, (3, 5), 0, false));
        assert!(!sync.sampling_ready(41, (3, 5), 0, false));
        assert!(!sync.sampling_ready(42, (3, 6), 0, false));
        assert!(!sync.sampling_ready(42, (3, 5), 1, false));
        assert!(!sync.sampling_ready(42, (3, 5), 0, true));
        sync.push_busy = true;
        assert!(!sync.sampling_ready(42, (3, 5), 0, false));
        sync.push_busy = false;
        sync.gate.note_conflict(43);
        assert!(!sync.sampling_ready(42, (3, 5), 0, false));
    }

    #[test]
    fn render_only_mirrors_sample_despite_unpushed_local_metadata() {
        let mut sync = SyncController::new();
        sync.client.mark_applied(42);
        sync.client.note_applied_editor_meta(0, false);
        sync.gate.note_synced(3, 5);
        // The headless mirror framed another page locally and cannot push it.
        assert!(!sync.sampling_ready(42, (3, 5), 1, false));
        crate::render_mode::set_render_only(true);
        assert!(sync.sampling_ready(42, (3, 5), 1, false));
        assert!(
            !sync.sampling_ready(41, (3, 5), 1, false),
            "content must still match"
        );
        crate::render_mode::set_render_only(false);
    }

    #[test]
    fn daemon_save_version_requires_an_initialized_unconflicted_document() {
        let mut sync = SyncController::new();
        assert_eq!(sync.save_version(), None);
        sync.client.mark_applied(42);
        sync.gate.note_synced(3, 5);
        assert_eq!(sync.save_version(), Some(42));
        sync.gate.note_open_pending(4);
        assert_eq!(sync.save_version(), None);
        sync.gate.note_synced(4, 0);
        assert_eq!(sync.save_version(), Some(42));
        sync.gate.note_conflict(43);
        assert_eq!(sync.save_version(), None);
    }
}
