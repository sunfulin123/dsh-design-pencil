//! Bounded canvas-selection history for binding a chat submission to its target.

use super::helpers::post_to_parent;
use crate::repaint_ctx::RepaintContext;
use std::cell::RefCell;
use std::collections::VecDeque;
use std::rc::Rc;

const MAX_SNAPSHOTS: usize = 256;
const MAX_HISTORY_BYTES: usize = 8 * 1024 * 1024;

#[derive(Default)]
pub(super) struct SelectionHistory {
    snapshots: VecDeque<(f64, String)>,
    bytes: usize,
    clock_went_backwards: bool,
}

impl SelectionHistory {
    pub(super) fn record(&mut self, at: f64, selection: String) {
        if self
            .snapshots
            .back()
            .is_some_and(|(previous, _)| at < *previous)
        {
            self.clock_went_backwards = true;
        }
        if self
            .snapshots
            .back()
            .is_some_and(|(_, value)| value == &selection)
        {
            return;
        }
        self.bytes += selection.len();
        self.snapshots.push_back((at, selection));
        while self.snapshots.len() > MAX_SNAPSHOTS || self.bytes > MAX_HISTORY_BYTES {
            if let Some((_, removed)) = self.snapshots.pop_front() {
                self.bytes -= removed.len();
            }
        }
    }

    pub(super) fn before(&self, at: f64, current: &str) -> Option<&str> {
        if self.clock_went_backwards
            || self
                .snapshots
                .back()
                .is_none_or(|(_, value)| value != current)
            || self.snapshots.iter().any(|(timestamp, _)| *timestamp == at)
        {
            return None;
        }
        self.snapshots
            .iter()
            .rev()
            .find(|(timestamp, _)| *timestamp < at)
            .map(|(_, value)| value.as_str())
    }
}

thread_local! {
    static SELECTION_HISTORY: RefCell<SelectionHistory> = RefCell::new(SelectionHistory::default());
}

/// Record the editor state synchronously at the event that changed selection.
pub(crate) fn record_selection(body: &str) {
    SELECTION_HISTORY.with(|history| {
        history
            .borrow_mut()
            .record(js_sys::Date::now(), body.to_owned())
    });
}

pub(super) fn capture_selection<C: RepaintContext + 'static>(
    inner: &Rc<RefCell<C>>,
    request_id: String,
    before: f64,
) {
    let current = inner
        .try_borrow()
        .ok()
        .map(|b| crate::ui_scale_sync::selection_body(b.host().editor_state()));
    let selection = current.and_then(|current| {
        SELECTION_HISTORY.with(|history| {
            history
                .borrow()
                .before(before, &current)
                .and_then(|value| serde_json::from_str::<serde_json::Value>(value).ok())
        })
    });
    post_to_parent(&serde_json::json!({ "type": "op-bridge/capture-selection-result", "requestId": request_id, "selection": selection }).to_string());
}

#[cfg(test)]
mod tests {
    use super::SelectionHistory;

    #[test]
    fn captures_the_selection_at_submission_even_after_a_later_change() {
        let mut history = SelectionHistory::default();
        history.record(10.0, "A".into());
        history.record(20.0, "B".into());
        history.record(40.0, "C".into());
        assert_eq!(history.before(30.0, "C"), Some("B"));
        assert_eq!(history.before(20.0, "C"), None);
        assert_eq!(history.before(30.0, "unknown"), None);
        assert_eq!(history.before(5.0, "C"), None);
    }

    #[test]
    fn does_not_guess_after_old_history_is_evicted() {
        let mut history = SelectionHistory::default();
        for i in 0..300 {
            history.record(f64::from(i), i.to_string());
        }
        assert_eq!(history.before(1.0, "299"), None);
        assert_eq!(history.before(299.5, "299"), Some("299"));
    }

    #[test]
    fn clock_rollback_and_oversized_snapshots_never_retarget() {
        let mut history = SelectionHistory::default();
        history.record(100.0, "A".into());
        history.record(90.0, "B".into());
        assert_eq!(history.before(110.0, "B"), None);
        let mut history = SelectionHistory::default();
        history.record(1.0, "x".repeat(super::MAX_HISTORY_BYTES + 1));
        assert_eq!(history.before(2.0, "x"), None);
    }
}
