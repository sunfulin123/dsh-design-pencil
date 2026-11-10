//! Serialize selection pushes and retain only the newest pending snapshot.

use crate::live_sync;
use crate::repaint_ctx::RepaintContext;
use std::cell::RefCell;
use std::rc::Rc;

#[derive(Debug, PartialEq, Eq)]
pub(crate) struct SelectionUpdate {
    pub(crate) base: String,
    pub(crate) key: String,
    pub(crate) body: String,
}

#[derive(Default)]
pub(crate) struct SelectionPushQueue {
    busy: bool,
    pending: Option<SelectionUpdate>,
}

impl SelectionPushQueue {
    pub(crate) fn enqueue(&mut self, update: SelectionUpdate) -> Option<SelectionUpdate> {
        if self.busy {
            self.pending = Some(update);
            return None;
        }
        self.busy = true;
        Some(update)
    }

    pub(crate) fn complete(&mut self) -> Option<SelectionUpdate> {
        let next = self.pending.take();
        self.busy = next.is_some();
        next
    }
}

thread_local! {
    static SELECTION_OUTBOX: RefCell<SelectionPushQueue> = RefCell::new(SelectionPushQueue::default());
}

/// POST the selection to the daemon when it changed since the last sample
/// (TS pushes `{selectedIds, activePageId}` debounced 300 ms; this samples on
/// the 400 ms tick). Fire-and-forget like the TS fetch().catch(() => {}).
/// Unaffected by the sync gate (one-way browser → daemon presentation state,
/// not document content).
pub(crate) fn push_selection_if_changed<C: RepaintContext + 'static>(
    inner: &Rc<RefCell<C>>,
    base: &str,
    last_selection_key: &Rc<RefCell<Option<String>>>,
) {
    if crate::render_mode::render_only() {
        return;
    }
    let (key, body) = {
        let Ok(b) = inner.try_borrow() else {
            return;
        };
        let state = b.host().editor_state();
        (
            crate::ui_scale_sync::selection_key(state),
            crate::ui_scale_sync::selection_body(state),
        )
    };
    if last_selection_key
        .try_borrow()
        .map(|last| last.as_deref() == Some(key.as_str()))
        .unwrap_or(true)
    {
        return;
    }
    if let Ok(mut last) = last_selection_key.try_borrow_mut() {
        *last = Some(key.clone());
    } else {
        return;
    }
    crate::vscode_bridge::record_selection(&body);
    let update = SelectionUpdate {
        base: base.to_owned(),
        key,
        body,
    };
    let next = SELECTION_OUTBOX.with(|queue| queue.borrow_mut().enqueue(update));
    if let Some(next) = next {
        send_selection(next, last_selection_key.clone());
    }
}

fn send_selection(update: SelectionUpdate, last_key: Rc<RefCell<Option<String>>>) {
    let key = update.key.clone();
    let callback_key = key.clone();
    let callback_last = last_key.clone();
    let on_response: Rc<dyn Fn(u16, String)> = Rc::new(move |status, _| {
        complete_selection_push(status, &callback_key, callback_last.clone());
    });
    if !live_sync::post_json_with_status(
        &format!("{}/api/mcp/selection", update.base),
        &update.body,
        on_response,
    ) {
        complete_selection_push(0, &key, last_key);
    }
}

fn complete_selection_push(status: u16, key: &str, last_key: Rc<RefCell<Option<String>>>) {
    let next = SELECTION_OUTBOX.with(|queue| queue.borrow_mut().complete());
    if !(200..300).contains(&status) && next.is_none() {
        if let Ok(mut last) = last_key.try_borrow_mut() {
            if last.as_deref() == Some(key) {
                *last = None;
            }
        }
    }
    if let Some(next) = next {
        send_selection(next, last_key);
    }
}

#[cfg(test)]
mod tests {
    use super::{SelectionPushQueue, SelectionUpdate};

    fn update(key: &str) -> SelectionUpdate {
        SelectionUpdate {
            base: "origin".into(),
            key: key.into(),
            body: key.into(),
        }
    }

    #[test]
    fn delayed_pushes_cannot_overwrite_the_newest_selection() {
        let mut queue = SelectionPushQueue::default();
        assert_eq!(queue.enqueue(update("A")), Some(update("A")));
        assert_eq!(queue.enqueue(update("B")), None);
        assert_eq!(queue.enqueue(update("C")), None);
        assert_eq!(queue.complete(), Some(update("C")));
        assert_eq!(queue.complete(), None);
        assert_eq!(queue.enqueue(update("D")), Some(update("D")));
    }
}
