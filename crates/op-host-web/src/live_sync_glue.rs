//! Bidirectional browser ↔ daemon document and selection synchronization.
//!
//! Polls fetch `/api/mcp/document` even when its content version is unchanged:
//! viewport and top-level `uiScale` hints can change without document edits.
//! UI scale applies independently of content/conflict gates. Document swaps
//! still honor `SyncGate`; bootstrap is clean and later external edits undoable.
//! Pushes are debounced, content-hash suppressed and bounded to 2 MiB, with
//! conflicts held until explicit resolution or recoverable session acceptance.
//! Selection is pushed independently; the daemon is the document authority.

use std::cell::{Cell, RefCell};
use std::rc::{Rc, Weak};

use op_editor_core::sync_gate::SyncGate;
use op_editor_core::web_sync::WebSyncClient;

use crate::live_sync;
use crate::live_sync_json::{serialize_sync_document, SyncDocumentJson, SYNC_MAX_BODY_BYTES};
use crate::repaint_ctx::RepaintContext;
use crate::selection_push_queue::push_selection_if_changed;

/// Pull cadence (version probe). TS gets SSE pushes; one tick of latency.
const POLL_INTERVAL_MS: i32 = 200;
/// Push cadence — TS `PUSH_DEBOUNCE_MS` (use-mcp-sync.ts:6).
const PUSH_INTERVAL_MS: i32 = 2000;
#[cfg(test)]
#[path = "ui_scale_handshake_tests.rs"]
mod ui_scale_handshake_tests;

/// Shared sync state: the gate deciding pull/push eligibility, the wire-level
/// client (version/hash bookkeeping), and the push single-flight latch. Built
/// once in `mount_ck` and handed to both this module's ticks and the
/// postMessage bridge, so both sides observe and mutate the exact same
/// `SyncGate` instance (a v1 defect — the bridge couldn't reach a local
/// Editor metadata can require a push without advancing the content revision.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct PushReasons {
    content: bool,
    editor_meta: bool,
}

impl PushReasons {
    fn any(self) -> bool {
        self.content || self.editor_meta
    }
}

fn push_reasons(
    sync: &SyncController,
    pair: (u64, u64),
    active_page_index: usize,
    preserve_authored_geometry: bool,
    viewport: op_editor_core::Viewport,
) -> PushReasons {
    PushReasons {
        content: sync.gate.needs_push(pair),
        editor_meta: sync.gate.is_synced(pair)
            && (sync
                .client
                .editor_meta_needs_push(active_page_index, preserve_authored_geometry)
                || sync.client.viewport_needs_push(viewport)),
    }
}

/// Wire the bidirectional sync loops onto the mounted shell. Called once from
/// `mount_ck`; both intervals run for the page lifetime. `sync` is shared with
/// the postMessage bridge — this module only ever borrows it for the duration
/// of a single decision, never across an await/callback boundary.
pub(crate) fn start<C: RepaintContext + 'static>(inner: &Rc<RefCell<C>>, sync: SharedSync) {
    ACTIVE_SYNC.with(|slot| *slot.borrow_mut() = Some(Rc::downgrade(&sync)));
    let base = crate::daemon_base::daemon_base();
    // One-shot: learn whether this daemon is the document's sole sequencer,
    // which decides whether a sync conflict may auto-resolve.
    probe_serve_mode(&base, inner);
    // One document fetch / one push at a time; ticks observing an in-flight
    // request skip (the TS hook queues at most one — same effective shape).
    // `fetch_busy` stays a plain Cell (pull-side, local to this module);
    // `push_busy` moved onto the shared controller so the bridge can also
    // observe it.
    let fetch_busy = Rc::new(Cell::new(false));
    let oversize_warned = Rc::new(Cell::new(false));
    // `None` forces a selection re-push on the next tick (used after a doc
    // apply, which resets daemon-side selection). Seeded with the current key
    // so mount does not push an initial no-op selection (TS pushes selection
    // only on change).
    let last_selection_key = Rc::new(RefCell::new(Some(crate::ui_scale_sync::selection_key(
        inner.borrow().host().editor_state(),
    ))));
    ACTIVE_SELECTION_KEY.with(|slot| *slot.borrow_mut() = Some(last_selection_key.clone()));
    ACTIVE_BASE_URL.with(|slot| *slot.borrow_mut() = Some(base.clone()));
    ACTIVE_OVERSIZE_WARNED.with(|slot| *slot.borrow_mut() = Some(oversize_warned.clone()));

    // ---- pull + selection tick ----
    {
        let inner = inner.clone();
        let sync = sync.clone();
        let base = base.clone();
        let fetch_busy = fetch_busy.clone();
        let last_selection_key = last_selection_key.clone();
        let tick: Rc<dyn Fn()> = Rc::new(move || {
            poll_version(&inner, &base, &sync, &fetch_busy, &last_selection_key);
            push_selection_if_changed(&inner, &base, &last_selection_key);
        });
        let _ = live_sync::start_interval(POLL_INTERVAL_MS, tick);
    }

    // ---- document push tick ----
    {
        let inner = inner.clone();
        let sync = sync.clone();
        let tick: Rc<dyn Fn()> = Rc::new(move || {
            push_document_if_changed(&inner, &base, &sync, &oversize_warned);
        });
        let _ = live_sync::start_interval(PUSH_INTERVAL_MS, tick);
    }
    crate::managed_assets_sync::start(inner, &crate::daemon_base::daemon_base(), sync);
}

/// Probe the daemon version; on a newer version fetch + apply the document.
/// Poll preference hints even while content is dirty/conflicted. Content
/// eligibility is checked independently when the document response arrives.
fn poll_version<C: RepaintContext + 'static>(
    inner: &Rc<RefCell<C>>,
    base: &str,
    sync: &SharedSync,
    fetch_busy: &Rc<Cell<bool>>,
    last_selection_key: &Rc<RefCell<Option<String>>>,
) {
    if fetch_busy.get() {
        return;
    }
    let pair = current_pair(&*inner.borrow());
    // Borrow discipline: Rust 2021 extends an `if let` scrutinee's temporary
    // borrow through the whole arm body, so a `borrow_mut()` inside the body
    // below would panic at runtime. Binding the `Option` first lets the
    // `borrow()` temporary drop at the end of THIS statement instead.
    let broken = sync.borrow().gate.accept_window_broken(pair); // borrow ends HERE
    if let Some(v) = broken {
        sync.borrow_mut().gate.note_conflict(v); // observer latch reports; user decides again
    }
    maybe_auto_resolve_conflict_in_session(inner, sync, pair);

    let inner = inner.clone();
    let sync = sync.clone();
    let base_owned = base.to_string();
    let fetch_busy = fetch_busy.clone();
    let last_selection_key = last_selection_key.clone();
    let on_version: Rc<dyn Fn(u16, String)> = Rc::new(move |status: u16, body: String| {
        // A refused credential is the signal that this tab no longer speaks
        // for the account whose document it is showing. Treating it as "no
        // version" — which is what an untyped body read does — is what let the
        // previous account's document sit on screen indefinitely.
        if matches!(status, 401 | 403) {
            note_auth_invalid();
            return;
        }
        if !(200..300).contains(&status) {
            return;
        }
        // The daemon answers both counters here. Hand the collaboration one to
        // its own loop rather than opening a second probe; a `collabSeq` bump
        // must never reach the document fetch below.
        crate::collab_sync::note_version_probe(&body);
        crate::managed_assets_sync::note_version_probe(&inner, &base_owned, &body);
        let Some(version) = WebSyncClient::parse_version_probe(&body) else {
            return; // daemon down / non-JSON error body — retry next tick
        };
        let current_or_newer = sync
            .try_borrow()
            .map(|s| !s.client.initialized() || version >= s.client.last_version())
            .unwrap_or(false);
        if !current_or_newer {
            return;
        }
        // An unchanged version, camera and UI-scale hint would make the full
        // reply a no-op; skip downloading and parsing the (possibly huge)
        // document. A pending local edit forces the pull like the apply path.
        let force_view = inner
            .try_borrow()
            .ok()
            .zip(sync.try_borrow().ok())
            .map(|(host, s)| !s.gate.is_synced(current_pair(&*host)))
            .unwrap_or(true);
        let unchanged = sync
            .try_borrow()
            .map(|s| s.client.probe_skips_document(&body, force_view))
            .unwrap_or(false);
        if unchanged {
            return;
        }
        // Once a paged document is mirrored, ask for the changed pages only;
        // the latch is released when a response lands (or never taken).
        fetch_busy.set(true);
        let patch_since = sync.try_borrow().ok().and_then(|s| {
            let paged = inner
                .try_borrow()
                .is_ok_and(|host| host.host().editor_state().doc.pages.is_some());
            (s.client.initialized() && paged).then(|| s.client.last_version())
        });
        fetch_document(
            &inner,
            &base_owned,
            &sync,
            &fetch_busy,
            &last_selection_key,
            patch_since,
        );
    });
    let _ = live_sync::get_with_status(&format!("{base}/api/mcp/version"), on_version);
}

/// Fetches and applies the daemon document: the pages changed since
/// `patch_since` when given (falling back to a full fetch if the patch
/// cannot be applied), otherwise the whole document. Releases `fetch_busy`.
fn fetch_document<C: RepaintContext + 'static>(
    inner: &Rc<RefCell<C>>,
    base: &str,
    sync: &SharedSync,
    fetch_busy: &Rc<Cell<bool>>,
    last_selection_key: &Rc<RefCell<Option<String>>>,
    patch_since: Option<u64>,
) {
    let request_epoch = sync.borrow().client.viewport_epoch();
    let url = match patch_since {
        Some(since) => format!("{base}/api/mcp/document/changes?since={since}"),
        None => format!("{base}/api/mcp/document"),
    };
    let on_doc: Rc<dyn Fn(String)> = {
        let inner = inner.clone();
        let base = base.to_string();
        let sync = sync.clone();
        let fetch_busy = fetch_busy.clone();
        let last_selection_key = last_selection_key.clone();
        Rc::new(move |doc_body: String| {
            let needs_full = apply_document_response(
                &inner,
                &doc_body,
                &sync,
                &last_selection_key,
                request_epoch,
                patch_since.is_some(),
            );
            if needs_full {
                fetch_document(&inner, &base, &sync, &fetch_busy, &last_selection_key, None);
            } else {
                fetch_busy.set(false);
            }
        })
    };
    if !live_sync::get(&url, on_doc) {
        fetch_busy.set(false);
    }
}

/// Auto-resolve a latched push conflict, but only inside a live session.
///
/// A conflict closes both the pull and the push gate and is cleared by exactly
/// two things, neither reachable from this tick: the VS Code host's explicit
/// `resolve-conflict`, and a successful re-push. A plain browser tab has
/// neither, so a single 409 wedges live sync for the rest of the page's life.
///
/// Auto-accepting the remote is only safe when the *server* is the authority
/// and the user's dropped work is recoverable — which is exactly what an
/// `Active` collaboration session provides:
///
/// * the daemon's document is the sequenced truth every peer already sees, so
///   there is nothing for this tab to "win" by holding its copy back;
/// * the runtime projects a rejected local edit into
///   `collab.discarded_edit`, and the panel offers to replay it, so accepting
///   the remote does not silently destroy the edit that lost.
///
/// Outside a session neither holds — the daemon is a peer, not an authority,
/// and nothing preserves the losing edit — so the latch stays and the existing
/// explicit-resolution semantics are untouched. That is the difference between
/// recovering automatically and quietly overwriting a user's unpushed work.
fn maybe_auto_resolve_conflict_in_session<C: RepaintContext + 'static>(
    inner: &Rc<RefCell<C>>,
    sync: &SharedSync,
    pair: (u64, u64),
) {
    let has_conflict = sync.borrow().gate.conflict().is_some();
    let phase = inner
        .try_borrow()
        .map(|context| context.host().editor_state().editor_ui.collab.phase)
        .unwrap_or(op_editor_core::CollabConnectionPhase::Idle);
    if !host_auto_resolve_is_safe(has_conflict, phase, server_is_authoritative()) {
        return;
    }
    // Accepting the remote overwrites whatever this tab had not yet pushed.
    // Undo is the primary way back (the apply is undoable); this stash is the
    // belt-and-braces copy plus the notice that tells the user any of it
    // happened. It must run BEFORE the resolve, while the local document is
    // still the one on screen.
    if !live_sync_conflict::preserve_local_document(inner, crate::collab_sync::now_ms()) {
        // No backup taken, so nothing is accepted. Better to converge one tick
        // later than to overwrite unpushed work with no way back.
        return;
    }
    // Re-opens the pull for THIS pair only; the resolving pull's apply calls
    // `note_synced`, which is what finally clears the baseline and reopens the
    // push side too.
    if let Ok(mut sync) = sync.try_borrow_mut() {
        sync.gate.resolve_accept_remote(pair);
    }
}

/// Apply a document response. UI hints always force acknowledgement, including
/// unchanged scales and dirty content; only visual changes require repaint.
/// Applies a pulled document (or page patch). Returns `true` when a page
/// patch could not be applied and the caller must fetch the full document.
fn apply_document_response<C: RepaintContext + 'static>(
    inner: &Rc<RefCell<C>>,
    body: &str,
    sync: &SharedSync,
    last_selection_key: &Rc<RefCell<Option<String>>>,
    request_epoch: u64,
    patch: bool,
) -> bool {
    if patch && !body.contains("\"full\":false") {
        return true;
    }
    let Ok(mut inner_mut) = inner.try_borrow_mut() else {
        return false;
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
    // Apply-time re-check: a local edit may have landed while the fetch was
    // in flight; re-read the CURRENT pair and re-run `pull_allowed` before
    // taking any mutable borrow of the controller. Borrow ends at the end of
    // this statement (plain `if`, not `if let` — the condition's temporary
    // does not extend into the body).
    if !sync.borrow().document_pull_ready(
        current_pair(inner_ref),
        inner_ref.host().editor_state().viewport,
        request_epoch,
    ) {
        return false; // a local edit landed while the fetch was in flight — abort apply
    }
    let force_view = !sync.borrow().gate.is_synced(current_pair(inner_ref));
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
    let applied = sync
        .try_borrow_mut()
        .ok()
        .and_then(|mut s| {
            let apply_next = |next: op_editor_core::web_sync::WebSyncDocument| {
                let host = inner_ref.host_mut();
                let previous_selection = host.capture_sync_selection();
                let content_changed = host.editor_state().doc != next.document;
                // A daemon-authored camera (saved or set_viewport) wins;
                // otherwise unseen new content is framed below.
                let explicit_view = next.viewport_changed && next.viewport.is_some();
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
                        active_page_index: next.active_page_index,
                        preserve_authored_geometry: next.preserve_authored_geometry,
                        scenario,
                        pinned_style_guide,
                        viewport: (next.viewport_changed || force_view)
                            .then(|| next.viewport.unwrap_or(op_editor_core::Viewport::IDENTITY)),
                    },
                );
                host.mark_editor_state_dirty();
                // The mount-time pull also re-checks a saved camera: one
                // left between boards would otherwise open on nothing.
                if content_changed && (!explicit_view || !undoable) {
                    host.fit_if_content_offscreen();
                }
                if content_changed && undoable {
                    host.restore_sync_selection(previous_selection);
                }
                inner_ref.repaint().is_ok()
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
        })
        .unwrap_or(false);
    if applied {
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
    needs_full
}

/// Serialize + conditionally push the local document. Content changes are
/// gated by `SyncGate::needs_push`; the two editor-metadata fields have their
/// own baseline because page switching intentionally leaves the content
/// revision unchanged. Both paths honor the conflict latch and bootstrap
/// authority. `take_doc_sync_dirty` remains only a cheap hint.
fn push_document_if_changed<C: RepaintContext + 'static>(
    inner: &Rc<RefCell<C>>,
    base: &str,
    sync: &SharedSync,
    oversize_warned: &Rc<Cell<bool>>,
) {
    if crate::render_mode::render_only() {
        return;
    }
    let busy = sync.borrow().push_busy;
    if busy {
        return;
    }
    let (pair, doc_json, active_page_index, preserve_authored_geometry, viewport, reasons) = {
        let Ok(mut b) = inner.try_borrow_mut() else {
            return;
        };
        // Consume the hint — NEVER a gate. A false positive here just costs
        // one wasted `needs_push` check below; a false negative would be
        // caught by the gate anyway since it reads the live pair directly.
        let _ = b.host_mut().take_doc_sync_dirty();
        let pair = current_pair(&*b);
        let state = b.host().editor_state();
        let active_page_index = state.ui.active_page_index;
        let preserve_authored_geometry = state.editor_ui.preserve_authored_geometry;
        let viewport = state.viewport;
        let reasons = push_reasons(
            &sync.borrow(),
            pair,
            active_page_index,
            preserve_authored_geometry,
            viewport,
        );
        if !reasons.any() {
            return;
        }
        let oversize_identity = current_oversize_identity(&*b);
        let compact_metadata =
            !reasons.content && sync.borrow().client.metadata_only_push_supported();
        if !compact_metadata && sync.borrow().oversize_identity == Some(oversize_identity) {
            return;
        }
        let json = if compact_metadata {
            r#"{"children":[]}"#.to_owned()
        } else {
            match serialize_sync_document(&b.host().editor_state().doc) {
                SyncDocumentJson::Ready(json) => json,
                SyncDocumentJson::Oversize => {
                    sync.borrow_mut().oversize_identity = Some(oversize_identity);
                    if !oversize_warned.replace(true) {
                        web_sys::console::warn_1(
                            &format!(
                                "[mcp-sync] Skip oversized document push: > {:.2}MiB",
                                SYNC_MAX_BODY_BYTES as f64 / (1024.0 * 1024.0)
                            )
                            .into(),
                        );
                    }
                    return;
                }
                SyncDocumentJson::Failed => return,
            }
        };
        (
            pair,
            json,
            active_page_index,
            preserve_authored_geometry,
            viewport,
            reasons,
        )
    };

    let should_push = if reasons.content {
        sync.borrow().client.should_push_with_editor_meta(
            &doc_json,
            active_page_index,
            preserve_authored_geometry,
        ) || sync.borrow().client.viewport_needs_push(viewport)
    } else {
        // A daemon Save acknowledgement intentionally leaves the large typed
        // document hash unknown. A metadata-only page switch must be decided
        // from the scalar baseline, not mistaken for a content change.
        reasons.editor_meta
    };
    // The daemon refused this tab's credential. Whatever is on screen belongs
    // to whoever was signed in before, so pushing it now would write one
    // account's work into whichever tenant the new credential resolves to.
    // Held until the identity reset rebuilds the tab.
    if auth_is_invalid() {
        return;
    }
    // An active collaboration session cannot sequence a node id this browser
    // minted from its local counter. Hold the push rather than fork the shared
    // document; the next pull replaces the local node with the daemon's copy.
    if crate::collab_sync::push_blocked_by_session(inner.borrow().host().editor_state()) {
        return;
    }
    if !should_push {
        // Bytes already match the daemon baseline (e.g. a generation-only
        // replace — same content, new generation): no push to send, but the
        // baseline MUST advance directly or `needs_push` stays true forever,
        // the hash check keeps skipping the push, and the pull gate never
        // reopens (deadlock).
        let mut sync = sync.borrow_mut();
        sync.oversize_identity = None;
        sync.gate.note_synced(pair.0, pair.1);
        return;
    }
    if !SyncGate::periodic_push_allowed(doc_json.len()) {
        // TS warns once per oversize streak and skips the push; baseline
        // stays put (the uncapped snapshot channel is the fallback path).
        let warned = oversize_warned.get();
        if !warned {
            oversize_warned.set(true);
            web_sys::console::warn_1(
                &format!(
                    "[mcp-sync] Skip oversized document push: {:.2}MiB > {:.2}MiB",
                    doc_json.len() as f64 / (1024.0 * 1024.0),
                    SYNC_MAX_BODY_BYTES as f64 / (1024.0 * 1024.0)
                )
                .into(),
            );
        }
        sync.borrow_mut().oversize_identity = Some(current_oversize_identity(&*inner.borrow()));
        return;
    }
    sync.borrow_mut().oversize_identity = None;
    oversize_warned.set(false);
    let body = sync.borrow().client.wrap_view_state_push(
        &doc_json,
        active_page_index,
        preserve_authored_geometry,
        !reasons.content,
        viewport,
    );
    sync.borrow_mut().push_busy = true;
    let sync_done = sync.clone();
    // The pair captured AT SERIALIZATION TIME (above), not whatever the
    // current pair is when the response lands — an edit landing while this
    // push is in flight must keep reporting `needs_push`.
    let pushed_pair = pair;
    let on_response: Rc<dyn Fn(String)> = Rc::new(move |resp: String| {
        sync_done.borrow_mut().push_busy = false;
        // Conflict check first: a rejected push must never fall through to
        // the success branch's `note_synced` (which would wrongly reopen
        // the pull gate on rejected bytes).
        let conflict_version = WebSyncClient::parse_push_conflict(&resp);
        if let Some(server_v) = conflict_version {
            sync_done.borrow_mut().gate.note_conflict(server_v);
            return;
        }
        let accepted_version = WebSyncClient::parse_push_response(&resp);
        if let Some(version) = accepted_version {
            let mut s = sync_done.borrow_mut();
            if reasons.content {
                s.client.mark_pushed_with_editor_meta(
                    &doc_json,
                    active_page_index,
                    preserve_authored_geometry,
                    version,
                );
            } else {
                s.client.mark_applied(version);
                s.client
                    .note_applied_editor_meta(active_page_index, preserve_authored_geometry);
            }
            s.client.note_applied_viewport(viewport);
            s.gate.note_synced(pushed_pair.0, pushed_pair.1);
        }
        if accepted_version.is_none() {
            web_sys::console::warn_1(&"[mcp-sync] Document or viewport push was not acknowledged; changes remain pending".into());
        }
    });
    if !live_sync::post_json(
        &format!("{base}/api/mcp/document"),
        &body,
        Some(on_response),
    ) {
        sync.borrow_mut().push_busy = false;
    }
}

#[cfg(test)]
#[path = "live_sync_glue_tests.rs"]
mod tests;

thread_local! {
    /// Raised when the daemon answered a sync request 401/403.
    ///
    /// A tab whose credential stopped being accepted must stop pushing: the
    /// document on screen belongs to whoever WAS signed in, and pushing it
    /// after a switch would write one account's work into another's tenant.
    /// Cleared by [`clear_auth_invalid`], which the identity reset calls once
    /// the tab has been rebuilt for the new account.
    pub(super) static AUTH_INVALID: std::cell::Cell<bool> = const { std::cell::Cell::new(false) };

    /// The mounted editor's sync controller, exposed weakly so File → Save can
    /// consume the daemon's returned version without creating an ownership
    /// cycle or threading sync state through every DOM file-action callback.
    pub(super) static ACTIVE_SYNC: RefCell<Option<Weak<RefCell<SyncController>>>> = const { RefCell::new(None) };
    static ACTIVE_SELECTION_KEY: RefCell<Option<Rc<RefCell<Option<String>>>>> = const { RefCell::new(None) };
    static ACTIVE_BASE_URL: RefCell<Option<String>> = const { RefCell::new(None) };
    static ACTIVE_OVERSIZE_WARNED: RefCell<Option<Rc<Cell<bool>>>> = const { RefCell::new(None) };
}

/// Immediately push the current document to the daemon if it changed since
/// the last push, eliminating the 2000ms debounce when a style guide or
/// `design.md` is imported or pinned.
pub(crate) fn flush_document_if_changed<C: RepaintContext + 'static>(inner: &Rc<RefCell<C>>) {
    let sync = ACTIVE_SYNC.with(|slot| slot.borrow().as_ref().and_then(Weak::upgrade));
    let base = ACTIVE_BASE_URL.with(|slot| slot.borrow().clone());
    let oversize_warned = ACTIVE_OVERSIZE_WARNED.with(|slot| slot.borrow().clone());
    if let (Some(sync), Some(base), Some(oversize_warned)) = (sync, base, oversize_warned) {
        push_document_if_changed(inner, &base, &sync, &oversize_warned);
    }
}

pub(crate) use op_editor_ui::widgets::press_flow::sync_style_guide_from_design_md;

#[path = "live_sync_selection.rs"]
mod live_sync_selection;
pub(crate) use live_sync_selection::{flush_selection_if_changed, mark_selection_dirty};

#[path = "live_sync_controller.rs"]
mod live_sync_controller;
#[path = "live_sync_document.rs"]
mod live_sync_document;
pub(crate) use live_sync_controller::{
    acknowledge_daemon_save, daemon_save_version, daemon_synced_version, SharedSync, SyncController,
};
// Spine-local: the two identity pairs every gating decision here is keyed on.
use live_sync_controller::{current_oversize_identity, current_pair};

#[path = "live_sync_conflict.rs"]
mod live_sync_conflict;
#[path = "live_sync_identity.rs"]
mod live_sync_identity;
pub(crate) use live_sync_identity::{auth_is_invalid, note_auth_invalid, reset_for_new_identity};
// Only the latch's own test lifts it; the reset clears it internally.
use live_sync_conflict::{host_auto_resolve_is_safe, probe_serve_mode, server_is_authoritative};
#[cfg(test)]
pub(crate) use live_sync_identity::clear_auth_invalid;
// Lives here rather than beside `lib.rs`'s modules because the two paths it
// drives are private submodules of this spine.
#[cfg(test)]
#[path = "live_sync_toast_tests.rs"]
mod live_sync_toast_tests;
