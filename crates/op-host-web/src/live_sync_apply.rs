//! Apply a daemon document while preserving the local view in managed OP editors.

use op_editor_core::bridge_protocol::event_refresh_result;
use op_editor_core::{EditorState, Viewport};

use super::{
    current_pair, live_sync, live_sync_document, serialize_sync_document, Rc, RefCell,
    RepaintContext, SharedSync, SyncController, SyncDocumentJson, ACTIVE_SELECTION_KEY,
};

#[derive(Clone, Copy)]
enum PullMode {
    Poll {
        request_epoch: u64,
        patch: bool,
    },
    Refresh {
        expected: (u64, u64),
        saved_version: Option<u64>,
    },
}

#[derive(PartialEq, Eq)]
enum PullResult {
    Updated,
    Current,
    NeedsFull,
    Blocked,
    Failed,
}

/// Applies a periodic document response. Returns true when a failed patch needs a full fetch.
pub(super) fn apply_document_response<C: RepaintContext + 'static>(
    inner: &Rc<RefCell<C>>,
    body: &str,
    sync: &SharedSync,
    last_selection_key: &Rc<RefCell<Option<String>>>,
    request_epoch: u64,
    patch: bool,
) -> bool {
    apply_pull(
        inner,
        body,
        sync,
        last_selection_key,
        PullMode::Poll {
            request_epoch,
            patch,
        },
    ) == PullResult::NeedsFull
}

/// Fetch once through the existing sync channel. The browser retains authority
/// over unsaved content and checks its document pair again when the reply lands.
pub(crate) fn refresh_canvas<C: RepaintContext + 'static>(
    inner: &Rc<RefCell<C>>,
    sync: &SharedSync,
    request_id: String,
    saved_version: Option<u64>,
) {
    let report = crate::vscode_bridge::post_to_parent;
    let expected = current_pair(&*inner.borrow());
    let reply = |status, pair| report(&event_refresh_result(&request_id, status, pair));
    let blocked = {
        let state = inner.borrow();
        let controller = sync.borrow();
        controller.refresh_busy
            || !refresh_ready(&controller, state.host().editor_state(), saved_version)
    };
    if blocked {
        reply("blocked", expected);
        return;
    }
    let Some(selection_key) = ACTIVE_SELECTION_KEY.with(|slot| slot.borrow().clone()) else {
        reply("failed", expected);
        return;
    };
    sync.borrow_mut().refresh_busy = true;
    let on_response = {
        let inner = inner.clone();
        let sync = sync.clone();
        let request_id = request_id.clone();
        Rc::new(move |status: u16, body: String| {
            let result = if (200..300).contains(&status) {
                apply_pull(
                    &inner,
                    &body,
                    &sync,
                    &selection_key,
                    PullMode::Refresh {
                        expected,
                        saved_version,
                    },
                )
            } else {
                PullResult::Failed
            };
            let pair = current_pair(&*inner.borrow());
            let mark_saved = {
                let mut controller = sync.borrow_mut();
                controller.refresh_busy = false;
                matches!(result, PullResult::Updated | PullResult::Current)
                    && saved_version == Some(controller.client.last_version())
                    && controller.gate.is_synced(pair)
            };
            if mark_saved {
                let mut inner = inner.borrow_mut();
                inner
                    .host_mut()
                    .editor_state_mut()
                    .mark_saved_revision_at(pair.0, pair.1);
                let _ = inner.repaint();
            }
            let status = match result {
                PullResult::Updated => "updated",
                PullResult::Current => "current",
                PullResult::Blocked => "blocked",
                PullResult::Failed | PullResult::NeedsFull => "failed",
            };
            report(&event_refresh_result(&request_id, status, pair));
        })
    };
    let url = format!("{}/api/mcp/document", crate::daemon_base::daemon_base());
    if !live_sync::get_with_status(&url, on_response) {
        sync.borrow_mut().refresh_busy = false;
        reply("failed", expected);
    }
}

fn refresh_ready(
    controller: &SyncController,
    state: &EditorState,
    saved_version: Option<u64>,
) -> bool {
    let pair = (state.document_generation(), state.document_revision());
    // A poll may already have applied the confirmed saved version. That exact
    // version can be acknowledged without treating unsynced user edits as saved.
    let confirmed = saved_version == Some(controller.client.last_version());
    controller.managed_refresh
        && !controller.push_busy
        && controller.client.initialized()
        && (!state.is_dirty() || confirmed)
        && controller.gate.matches_content_baseline(pair)
}

fn local_view(
    state: &EditorState,
    next: &jian_ops_schema::PenDocument,
) -> (Option<usize>, Viewport) {
    let index = match (&state.doc.pages, &next.pages) {
        (Some(current), Some(next)) => current
            .get(state.ui.active_page_index)
            .and_then(|page| next.iter().position(|candidate| candidate.id == page.id)),
        (None, None) => Some(0),
        _ => None,
    };
    (index, state.viewport)
}

fn apply_pull<C: RepaintContext + 'static>(
    inner: &Rc<RefCell<C>>,
    body: &str,
    sync: &SharedSync,
    last_selection_key: &Rc<RefCell<Option<String>>>,
    mode: PullMode,
) -> PullResult {
    let patch = matches!(mode, PullMode::Poll { patch: true, .. });
    if patch && !body.contains("\"full\":false") {
        return PullResult::NeedsFull;
    }
    let Ok(mut inner_mut) = inner.try_borrow_mut() else {
        return PullResult::Blocked;
    };
    let inner_ref = &mut *inner_mut;
    let scale_update = sync
        .try_borrow_mut()
        .map(|mut controller| {
            let version = controller.client.last_version();
            controller
                .ui_scale_pull
                .apply(inner_ref.host_mut().editor_state_mut(), body, version)
        })
        .unwrap_or_default();
    if scale_update.needs_ack {
        *last_selection_key.borrow_mut() = None;
    }
    if scale_update.visual_changed {
        inner_ref.host_mut().mark_editor_state_dirty();
        let _ = inner_ref.repaint();
    }
    let (force_view, keep_local_view) = {
        let controller = sync.borrow();
        let state = inner_ref.host().editor_state();
        let pair = current_pair(inner_ref);
        let allowed = match mode {
            PullMode::Poll { request_epoch, .. } => {
                controller.document_pull_ready(pair, state.viewport, request_epoch)
            }
            PullMode::Refresh {
                expected,
                saved_version,
            } => pair == expected && refresh_ready(&controller, state, saved_version),
        };
        if !allowed {
            return PullResult::Blocked;
        }
        (
            !controller.gate.is_synced(pair),
            controller.managed_refresh && controller.client.initialized(),
        )
    };
    // Captured BEFORE sync() flips it on the first apply: the
    // mount-time pull (starter doc → daemon doc) must NOT become an
    // undo step; every later external apply (AI turn, MCP client) must.
    let undoable = sync
        .try_borrow()
        .map(|s| s.client.initialized())
        .unwrap_or(false);
    // The `WebSyncClient::sync_with_view_state` closure runs while `sync` is held
    // mutably borrowed (via `s` below) — it must never itself touch `sync`;
    // it only touches `inner_ref`, which is a separate RefCell.
    let local = patch.then(|| inner_ref.host().editor_state().doc.clone());
    let mut needs_full = false;
    let mut repaint_failed = false;
    let applied = sync.try_borrow_mut().ok().and_then(|mut s| {
        let applied_version = s.client.last_version();
        let apply_next = |next: op_editor_core::web_sync::WebSyncDocument| {
            let host = inner_ref.host_mut();
            let previous_selection = host.capture_sync_selection();
            let content_changed = host.editor_state().doc != next.document;
            let kept_view =
                keep_local_view.then(|| local_view(host.editor_state(), &next.document));
            let explicit_view = next.viewport_changed && next.viewport.is_some();
            // The daemon also sends intentional MCP viewport and page commands.
            // Preserve the view across a refresh or content replacement, while
            // applying metadata instructions during ordinary same-content pulls.
            let metadata_poll = !content_changed && matches!(mode, PullMode::Poll { .. });
            let kept_viewport = kept_view
                .filter(|_| {
                    !(metadata_poll && next.version == applied_version && next.viewport_changed)
                })
                .map(|view| view.1);
            let kept_page = kept_view
                .filter(|_| !(metadata_poll && next.version != applied_version))
                .and_then(|view| view.0);
            if content_changed {
                host.replace_document_from_sync(next.document, undoable);
            }
            // A daemon new enough to send `scenario` is the
            // authority (the browser boots with `None`, and a deck
            // must present as a deck). An older daemon omits the
            // field — keep whatever the open document already had
            // rather than letting every sync erase its tag.
            let scenario = next.scenario.or(host.editor_state().editor_ui.scenario);
            let pinned_style_guide = host.editor_state().editor_ui.pinned_style_guide.clone();
            op_pen_loader::apply_editor_meta(
                host.editor_state_mut(),
                op_pen_loader::EditorMeta {
                    active_page_index: kept_page.unwrap_or(next.active_page_index),
                    preserve_authored_geometry: next.preserve_authored_geometry,
                    scenario,
                    pinned_style_guide,
                    viewport: kept_viewport.or_else(|| {
                        (next.viewport_changed || force_view)
                            .then(|| next.viewport.unwrap_or(op_editor_core::Viewport::IDENTITY))
                    }),
                },
            );
            host.mark_editor_state_dirty();
            // The mount-time pull also re-checks a saved camera: one
            // left between boards would otherwise open on nothing.
            if content_changed && kept_view.is_none() && (!explicit_view || !undoable) {
                host.fit_if_content_offscreen();
            }
            if content_changed && undoable {
                host.restore_sync_selection(previous_selection);
            }
            repaint_failed = inner_ref.repaint().is_err();
            !repaint_failed
        };
        match local.as_ref() {
            Some(local) => {
                match s
                    .client
                    .sync_page_patch_force(body, local, force_view, apply_next)
                {
                    Ok(op_editor_core::web_sync::PagePatchOutcome::Applied(applied)) => {
                        Some(applied)
                    }
                    _ => {
                        needs_full = true;
                        None
                    }
                }
            }
            None => s
                .client
                .sync_with_view_state_force_with_loader(
                    body,
                    force_view,
                    live_sync_document::load_compatible,
                    apply_next,
                )
                .ok(),
        }
    });
    if applied == Some(true) {
        // Every id in this document came from the daemon, so it is the set an
        // active session will accept a push against. Recording it here is what
        // lets the push gate tell an edited node from an invented one.
        crate::collab_sync::note_daemon_document(inner_ref.host().editor_state());
        // Baseline = OUR serialization of the just-applied document, so the
        // push tick compares apples to apples (serde normalization differs
        // from the daemon's wire bytes).
        let state = inner_ref.host().editor_state();
        let active_page_index = state.ui.active_page_index;
        let preserve_authored_geometry = state.editor_ui.preserve_authored_geometry;
        let serialized = serialize_sync_document(&state.doc);
        if let Ok(mut s) = sync.try_borrow_mut() {
            // Always baseline the two scalar fields. Oversized documents skip
            // their byte hash, but must not look metadata-dirty forever.
            s.client
                .note_applied_editor_meta(active_page_index, preserve_authored_geometry);
            if let SyncDocumentJson::Ready(json) = serialized {
                s.client.note_applied_snapshot_with_editor_meta(
                    &json,
                    active_page_index,
                    preserve_authored_geometry,
                );
            }
        }
        if let Ok(mut last_selection_key) = last_selection_key.try_borrow_mut() {
            *last_selection_key = None;
        }
        // Commit the sync-gate baseline AFTER the apply closure has returned
        // (its mutable borrow above is released) and using the POST-apply pair.
        //
        // An external post-bootstrap apply (`undoable` — an AI turn or an MCP
        // client write) is an UNSAVED daemon-side edit: the tab must read dirty
        // so closing it prompts to save (spec: MCP edits mark the tab dirty).
        // That dirtiness is already established by construction:
        // `replace_document_with_undo` runs `history_push_past`, which bumps the
        // content revision via `mark_document_changed` — so no manual bump is
        // needed here (it would only be a redundant second revision tick).
        // `note_synced` records this post-bump pair as the gate baseline, so the
        // very next push tick sees current == baseline (no spurious echo-push of
        // the just-applied doc back to the daemon) while `is_dirty()` stays true
        // (revision != saved 0). The bootstrap apply (`undoable == false`, the
        // mount-time starter→daemon pull) goes through the plain
        // `replace_document`, which resets revision to 0 and stays clean.
        let post_apply = current_pair(inner_ref);
        sync.borrow_mut()
            .gate
            .note_synced(post_apply.0, post_apply.1);
    }
    if needs_full {
        PullResult::NeedsFull
    } else if repaint_failed || applied.is_none() || (force_view && applied == Some(false)) {
        PullResult::Failed
    } else if applied == Some(true) {
        PullResult::Updated
    } else {
        PullResult::Current
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn refresh_requires_clean_or_exact_confirmed_synced_content() {
        let mut state = EditorState::new();
        let mut controller = SyncController::new();
        controller.managed_refresh = true;
        controller.client.mark_applied(7);
        controller
            .gate
            .note_synced(state.document_generation(), state.document_revision());
        controller.gate.note_conflict(8);
        assert!(refresh_ready(&controller, &state, None));

        state.mark_document_changed();
        assert!(!refresh_ready(&controller, &state, Some(7)));
        controller
            .gate
            .note_synced(state.document_generation(), state.document_revision());
        assert!(!refresh_ready(&controller, &state, None));
        assert!(!refresh_ready(&controller, &state, Some(8)));
        assert!(refresh_ready(&controller, &state, Some(7)));

        controller
            .gate
            .note_open_pending(state.document_generation());
        assert!(!refresh_ready(&controller, &state, Some(7)));
    }

    #[test]
    fn managed_view_keeps_camera_and_tracks_page_identity_after_reordering() {
        let source = r#"{"version":"1.0.0","pages":[{"id":"one","name":"First","children":[]},{"id":"two","name":"Second","children":[]}]}"#;
        let mut state =
            EditorState::from_document(op_pen_loader::load_canonical(source).unwrap().value);
        state.ui.active_page_index = 1;
        state.viewport.pan_x = 321.0;
        let mut next = state.doc.clone();
        next.pages.as_mut().unwrap().swap(0, 1);
        assert_eq!(local_view(&state, &next), (Some(0), state.viewport));
        next.pages.as_mut().unwrap().remove(0);
        assert_eq!(local_view(&state, &next), (None, state.viewport));
    }
}
