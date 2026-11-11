//! Immediate selection synchronization helpers.

use std::cell::RefCell;
use std::rc::Rc;

use super::{push_selection_if_changed, RepaintContext, ACTIVE_BASE_URL, ACTIVE_SELECTION_KEY};

/// Immediately push the current selection to the daemon if it changed since
/// the last push, eliminating the poll-interval delay after a canvas or layer click.
pub(crate) fn flush_selection_if_changed<C: RepaintContext + 'static>(inner: &Rc<RefCell<C>>) {
    let key_cell = ACTIVE_SELECTION_KEY.with(|slot| slot.borrow().clone());
    let base = ACTIVE_BASE_URL.with(|slot| slot.borrow().clone());
    if let (Some(last_selection_key), Some(base)) = (key_cell, base) {
        push_selection_if_changed(inner, &base, &last_selection_key);
    }
}

/// Force the next selection flush to re-push even if the selection key matches.
pub(crate) fn mark_selection_dirty() {
    ACTIVE_SELECTION_KEY.with(|slot| {
        if let Some(cell) = slot.borrow().as_ref() {
            if let Ok(mut last) = cell.try_borrow_mut() {
                *last = None;
            }
        }
    });
}
