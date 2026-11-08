//! Shared daemon polling loop for renderer-backed MCP requests.
//!
//! The Node host queues requests (color samples, screenshots) that only the
//! live CanvasKit editor can answer. This loop polls a queue endpoint, runs
//! each request whose document version matches the synchronized editor, and
//! posts the reply back.

use std::cell::{Cell, RefCell};
use std::rc::Rc;

use serde::Deserialize;
use serde_json::{json, Value};

use super::inner::CkInner;
use crate::live_sync_glue::SharedSync;

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct PendingRequests {
    requests: Vec<RenderRequest>,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct RenderRequest {
    id: String,
    version: u64,
    args: Value,
}

/// Answers one request. `None` leaves it queued for a later tick (e.g. while
/// images are still decoding); the host times it out if it never becomes ready.
pub(super) type RenderHandler = fn(&mut CkInner, &Value) -> Option<Result<Value, String>>;

pub(super) fn start(
    inner: &Rc<RefCell<CkInner>>,
    sync: SharedSync,
    path: &'static str,
    label: &'static str,
    handler: RenderHandler,
) {
    let weak = Rc::downgrade(inner);
    let busy = Rc::new(Cell::new(false));
    let disabled = Rc::new(Cell::new(false));
    let url = format!(
        "{}{path}?client={}",
        crate::daemon_base::daemon_base(),
        crate::render_mode::render_client()
    );
    let tick: Rc<dyn Fn()> = Rc::new(move || {
        if disabled.get() || busy.replace(true) {
            return;
        }
        let Some(inner) = weak.upgrade() else {
            busy.set(false);
            disabled.set(true);
            return;
        };
        let busy_for_response = busy.clone();
        let disabled = disabled.clone();
        let sync = sync.clone();
        let post_url = url.clone();
        let started = crate::live_sync::get_with_status(
            &url,
            Rc::new(move |status, body| {
                if status == 404 || status == 405 {
                    disabled.set(true);
                    busy_for_response.set(false);
                    return;
                }
                if status != 200 {
                    warn(&format!("{label} request poll failed (HTTP {status})"));
                    busy_for_response.set(false);
                    return;
                }
                let pending = match serde_json::from_str::<PendingRequests>(&body) {
                    Ok(pending) => pending,
                    Err(error) => {
                        warn(&format!("Invalid {label} request queue: {error}"));
                        busy_for_response.set(false);
                        return;
                    }
                };
                let replies: Vec<_> = pending
                    .requests
                    .into_iter()
                    .filter_map(|request| {
                        let mut inner = inner.borrow_mut();
                        let state = inner.host.editor_state();
                        if !sync.borrow().sampling_ready(
                            request.version,
                            (state.document_generation(), state.document_revision()),
                            state.ui.active_page_index,
                            state.editor_ui.preserve_authored_geometry,
                        ) {
                            return None;
                        }
                        let mut response = match handler(&mut inner, &request.args)? {
                            Ok(response) => response,
                            Err(error) => json!({ "error": error }),
                        };
                        response["id"] = json!(request.id);
                        response["version"] = json!(request.version);
                        Some(response.to_string())
                    })
                    .collect();
                if replies.is_empty() {
                    busy_for_response.set(false);
                    return;
                }
                let remaining = Rc::new(Cell::new(replies.len()));
                for body in replies {
                    let remaining_for_reply = remaining.clone();
                    let busy_for_reply = busy_for_response.clone();
                    let started = crate::live_sync::post_json_with_status(
                        &post_url,
                        &body,
                        Rc::new(move |status, body| {
                            if status != 200 {
                                warn(&format!(
                                    "{label} reply was rejected (HTTP {status}): {body}"
                                ));
                            }
                            finish_reply(&remaining_for_reply, &busy_for_reply);
                        }),
                    );
                    if !started {
                        warn(&format!("{label} reply could not be sent"));
                        finish_reply(&remaining, &busy_for_response);
                    }
                }
            }),
        );
        if !started {
            warn(&format!("{label} request poll could not start"));
            busy.set(false);
        }
    });
    if let Err(error) = crate::live_sync::start_interval(200, tick) {
        warn(&format!("{label} renderer could not start: {error:?}"));
    }
}

fn finish_reply(remaining: &Cell<usize>, busy: &Cell<bool>) {
    let count = remaining.get() - 1;
    remaining.set(count);
    if count == 0 {
        busy.set(false);
    }
}

pub(super) fn warn(message: &str) {
    web_sys::console::warn_1(&wasm_bindgen::JsValue::from_str(message));
}
