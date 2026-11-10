//! Bridge startup-coordination helpers: iframe detection and awaiting the
//! host's `init` (with the 2 s direct-open fallback).
//!
//! Split out of the `vscode_bridge` spine to keep it under the 800-line cap;
//! re-exported there so the mount call sites keep their paths.

use std::cell::RefCell;
use std::rc::Rc;

use js_sys::{Object, Promise};
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;

use crate::live_sync;

use super::{
    helpers::{post_to_parent, read_triple},
    INIT_RESOLVER, LATE_INIT_HOOK,
};
use crate::repaint_ctx::RepaintContext;
use op_editor_core::bridge_protocol::event_ready;

/// True when the page runs inside a frame (`window.self != window.top`) — the
/// VS Code webview case, where `mount_ck` awaits the host's `init` before it
/// bootstraps the daemon services.
pub(crate) fn in_iframe(window: &web_sys::Window) -> bool {
    let self_win = window.self_();
    // `top`/`parent` return a cross-origin-accessible WindowProxy; an identity
    // compare never touches a property so it can't throw. Check both so a host
    // that shadows one (some webview shells) is still detected.
    let differs = |other: Result<Option<web_sys::Window>, JsValue>| {
        other
            .ok()
            .flatten()
            .map(|w| !Object::is(self_win.as_ref(), w.as_ref()))
            .unwrap_or(false)
    };
    differs(window.top()) || differs(window.parent())
}

/// Await the host's `init` (which resolves the promise from the message
/// handler) or a `timeout_ms` fallback, whichever comes first. On timeout the
/// caller proceeds as a direct open (no token). Returns after the promise
/// settles; check [`live_sync::bridge_token`] to learn which path won.
pub(crate) async fn await_init(window: &web_sys::Window, timeout_ms: i32) {
    // The early listener may have buffered the host's `init` and `install`
    // replays it synchronously BEFORE this runs: with the token already
    // stored there is nothing to await, and waiting would burn the whole 2 s
    // fallback after the init had in fact landed.
    if live_sync::bridge_token().is_some() {
        return;
    }
    let window = window.clone();
    let promise = Promise::new(&mut |resolve, _reject| {
        INIT_RESOLVER.with(|r| *r.borrow_mut() = Some(resolve.clone()));
        // Timeout fallback: resolve the same promise so the await unblocks even
        // if no host is listening (standalone browser tab, or a slow host).
        let resolve_timeout = resolve.clone();
        let cb = Closure::once_into_js(move || {
            let _ = resolve_timeout.call0(&JsValue::NULL);
        });
        let _ = window
            .set_timeout_with_callback_and_timeout_and_arguments_0(cb.unchecked_ref(), timeout_ms);
    });
    let _ = wasm_bindgen_futures::JsFuture::from(promise).await;
    // Drop the resolver so a late `init` doesn't try to settle a done promise.
    INIT_RESOLVER.with(|r| *r.borrow_mut() = None);
    if live_sync::bridge_token().is_none() {
        web_sys::console::warn_1(&JsValue::from_str(
            "[op-bridge] init not received before timeout; proceeding as direct open",
        ));
    }
}

/// Register the one-shot late-init recovery hook (see [`LATE_INIT_HOOK`]).
/// `canvaskit`'s fallback bootstrap calls this ONLY after its unmanaged
/// sync-reset has completed, so the recovery reset the hook later triggers
/// cannot interleave with the fallback reset. Overwrites any prior hook (only
/// one bootstrap ever registers).
pub(crate) fn register_late_init_hook<F: Fn() + 'static>(hook: F) {
    LATE_INIT_HOOK.with(|h| *h.borrow_mut() = Some(Box::new(hook)));
}

/// Post the managed `ready` reply with the current `(generation, revision)` so
/// the host learns the starter document's identity before it sends
/// `open-document`. Called from `canvaskit`'s managed bootstrap ONLY after the
/// sync-reset has completed (see [`handle_init`]). `ready` is a
/// request/response-style reply — not one of the three edge/state events the
/// tick observer owns — so a direct post here keeps single-point edge
/// discipline intact while ordering `ready` strictly after the reset.
pub(crate) fn emit_ready<C: RepaintContext + 'static>(inner: &Rc<RefCell<C>>) {
    let (gen, rev, _) = read_triple(inner).unwrap_or((0, 0, false));
    post_to_parent(&event_ready(gen, rev));
}
