//! Selection changes and transient inspector state.
use crate::node_id::NodeId;
use crate::pen_node_ext::PenNodeExt;
use crate::selection::SelectionState;
use crate::state::EditorState;

impl EditorState {
    // --- Selection ---------------------------------------------------

    /// Replace the selection with `id` + anchor on it. A NONE id
    /// clears the selection. Idempotent.
    pub fn set_single_selection(&mut self, id: NodeId) {
        let next = if id.is_real() {
            SelectionState {
                anchor: id.clone(),
                set: vec![id],
            }
        } else {
            SelectionState::empty()
        };
        if self.selection != next {
            self.ui.text_insertion = None;
            self.editor_ui.image_panel.close_popovers();
            self.editor_ui.image_crop_editing = None;
            self.selection = next;
        }
    }

    /// Shift-click semantics: toggle `id` in / out of the set,
    /// keeping the anchor invariant (anchor == last entry).
    pub fn toggle_selection(&mut self, id: NodeId) {
        if !id.is_real() {
            return;
        }
        self.ui.text_insertion = None;
        self.editor_ui.image_panel.close_popovers();
        self.editor_ui.image_crop_editing = None;
        if let Some(pos) = self.selection.set.iter().position(|n| *n == id) {
            self.selection.set.remove(pos);
            self.selection.anchor = self.selection.set.last().cloned().unwrap_or(NodeId::NONE);
        } else {
            self.selection.anchor = id.clone();
            self.selection.set.push(id);
        }
    }

    /// Clear both anchor + set. Idempotent.
    pub fn clear_selection(&mut self) {
        self.ui.text_insertion = None;
        if !self.selection.is_empty() {
            self.editor_ui.image_panel.close_popovers();
        }
        self.editor_ui.image_crop_editing = None;
        self.selection = SelectionState::empty();
    }

    /// Alias for [`EditorState::clear_selection`] — Escape's last
    /// tier in the editor host.
    pub fn deselect_all(&mut self) {
        self.clear_selection();
    }

    /// Select every top-level node on the active page. Anchor is the
    /// last node. False when the page has no children.
    pub fn select_all_top_level(&mut self) -> bool {
        let ids: Vec<NodeId> = self
            .active_children()
            .iter()
            .filter_map(|n| NodeId::new_opt(n.id_str()))
            .collect();
        if ids.is_empty() {
            return false;
        }
        let next_anchor = ids.last().cloned().unwrap_or(NodeId::NONE);
        if self.selection.anchor != next_anchor || self.selection.set != ids {
            self.ui.text_insertion = None;
            self.editor_ui.image_panel.close_popovers();
        }
        self.selection.anchor = next_anchor;
        self.selection.set = ids;
        true
    }
}
