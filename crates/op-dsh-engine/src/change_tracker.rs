//! Page-level change tracking for incremental document sync.
//!
//! Hosts that mirror the document (the browser editor) can fetch only the
//! pages a burst of tool calls changed instead of the whole document. Every
//! `commit_command` records which pages differ between the old and new
//! document; any document change that did not come through a recorded
//! commit (undo, imports, whole-document replacement) breaks the revision
//! chain, and the next report then asks for a full resync.

use std::collections::BTreeSet;

use op_editor_core::EditorState;
use serde_json::json;

type Stamp = (u64, u64);

fn stamp(state: &EditorState) -> Stamp {
    (state.document_generation(), state.document_revision())
}

pub(crate) struct ChangeTracker {
    /// Document stamp after the last recorded commit (or the last report).
    cursor: Stamp,
    pages: BTreeSet<String>,
    full: bool,
}

impl ChangeTracker {
    pub(crate) fn new(state: &EditorState) -> Self {
        Self {
            cursor: stamp(state),
            pages: BTreeSet::new(),
            full: false,
        }
    }

    /// Records one committed command. `prev` is the replaced state (owned so
    /// its pages can be moved out for the non-page comparison).
    pub(crate) fn record_commit(&mut self, mut prev: EditorState, next: &mut EditorState) {
        if stamp(&prev) != self.cursor {
            self.full = true;
        }
        self.cursor = stamp(next);
        if self.full || prev.doc == next.doc {
            return;
        }
        let prev_pages = prev.doc.pages.take();
        let next_pages = next.doc.pages.take();
        let rest_changed = prev.doc != next.doc;
        match (&prev_pages, &next_pages) {
            (Some(before), Some(after))
                if !rest_changed
                    && before.len() == after.len()
                    && before.iter().zip(after).all(|(a, b)| a.id == b.id) =>
            {
                for (a, b) in before.iter().zip(after) {
                    if a != b {
                        self.pages.insert(b.id.clone());
                    }
                }
            }
            _ => self.full = true,
        }
        next.doc.pages = next_pages;
    }

    /// Reports and resets the changes since the previous report:
    /// `{"full": bool, "pages": [ids]}`.
    pub(crate) fn take(&mut self, state: &EditorState) -> serde_json::Value {
        let full = self.full || stamp(state) != self.cursor;
        let pages: Vec<String> = std::mem::take(&mut self.pages).into_iter().collect();
        self.full = false;
        self.cursor = stamp(state);
        json!({ "full": full, "pages": if full { Vec::new() } else { pages } })
    }
}
