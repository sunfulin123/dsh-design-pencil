//! Preserve transient selection across daemon-authored document updates.
use super::WidgetHost;
use op_editor_core::{text_insertion::TextInsertion, text_selection::TextSelection, NodeId};

pub(crate) struct SavedSyncSelection {
    nodes: Vec<NodeId>,
    text: Option<TextSelection>,
    insertion: Option<TextInsertion>,
    text_expanded: bool,
    design_expanded: bool,
    position_expanded: bool,
}

impl WidgetHost {
    pub(crate) fn capture_sync_selection(&self) -> SavedSyncSelection {
        let state = &self.editor_state;
        SavedSyncSelection {
            nodes: state.selection.set.clone(),
            text: state.current_text_selection(),
            insertion: state.current_text_insertion(),
            text_expanded: state.ui.text_inspector.expanded,
            design_expanded: state.ui.design_system_inspector.expanded,
            position_expanded: state.ui.position_advanced,
        }
    }

    pub(crate) fn restore_sync_selection(&mut self, previous: SavedSyncSelection) {
        let state = &mut self.editor_state;
        let surviving: Vec<_> = previous
            .nodes
            .into_iter()
            .filter(|id| op_editor_core::walkers::find_node(state.active_children(), id).is_some())
            .collect();
        for id in surviving {
            state.toggle_selection(id);
        }
        state.ui.text_inspector.expanded = previous.text_expanded;
        state.ui.design_system_inspector.expanded = previous.design_expanded;
        state.ui.position_advanced = previous.position_expanded;
        state.ui.text_selection = previous.text;
        state.ui.text_insertion = previous.insertion;
        if (state.ui.text_selection.is_some() && state.current_text_selection().is_none())
            || (state.ui.text_insertion.is_some() && state.current_text_insertion().is_none())
        {
            state.ui.text_selection = None;
            state.ui.text_insertion = None;
            state.editor_ui.show_toast(
                "textInspector.staleSelection",
                Vec::new(),
                op_editor_core::editor_toast::EditorToastLevel::Warn,
                self.now_ms,
            );
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use jian_ops_schema::node::{PenNode, TextContent};

    #[test]
    fn sync_preserves_unchanged_range_and_warns_when_the_text_changes() {
        let mut host = WidgetHost::new();
        host.editor_state.doc.pages = None;
        host.editor_state.doc.children = serde_json::from_value(serde_json::json!([
            {"type":"text", "id":"t", "content":"A中🙂Z"}
        ]))
        .unwrap();
        host.editor_state.set_single_selection(NodeId::new("t"));
        host.editor_state.ui.position_advanced = true;
        assert!(host.editor_state.start_text_edit(NodeId::new("t")));
        assert!(host
            .editor_state
            .text_edit_select_range(1, "A中🙂".len(), 1));
        let old = host.capture_sync_selection();
        let doc = host.editor_state.doc.clone();
        host.editor_state.replace_document_with_undo(doc);
        host.restore_sync_selection(old);
        assert_eq!(host.editor_state.current_text_selection().unwrap().end, 3);
        assert!(host.editor_state.ui.position_advanced);
        let old = host.capture_sync_selection();
        let mut doc = host.editor_state.doc.clone();
        let PenNode::Text(text) = &mut doc.children[0] else {
            panic!("text")
        };
        text.content = TextContent::Plain("Changed".into());
        host.editor_state.replace_document_with_undo(doc);
        host.restore_sync_selection(old);
        assert!(host.editor_state.ui.text_selection.is_none());
        assert_eq!(
            host.editor_state
                .editor_ui
                .visible_toast(0)
                .unwrap()
                .i18n_key,
            "textInspector.staleSelection"
        );
    }
}
