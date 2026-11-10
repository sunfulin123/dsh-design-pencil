//! Transient formatting at a caret retained while the inspector has focus.
use crate::text_design::{plain_text, styled_range, TextRangeStyle};
use crate::{EditorState, NodeId};
use jian_core::text_input::TextInputState;
use jian_ops_schema::node::PenNode;

#[derive(Debug, Clone, PartialEq)]
pub struct TextInsertion {
    pub node_id: NodeId,
    pub page_index: usize,
    pub text: String,
    /// Byte offset, always at a UTF-8 boundary.
    pub offset: usize,
    pub style: TextRangeStyle,
}

impl EditorState {
    pub fn current_text_insertion(&self) -> Option<TextInsertion> {
        let candidate = if let Some(id) = &self.ui.text_editing {
            let input = &self.ui.text_edit_input;
            if self
                .text_edit_effective_selection(input.text().len())
                .is_some()
                || input.composition().is_some()
            {
                return None;
            }
            let text = input.text().to_owned();
            let offset = input.caret();
            let style = self
                .ui
                .text_insertion
                .as_ref()
                .filter(|old| {
                    old.node_id == *id
                        && old.page_index == self.ui.active_page_index
                        && old.text == text
                        && old.offset == offset
                })
                .map(|old| old.style.clone())
                .unwrap_or_default();
            TextInsertion {
                node_id: id.clone(),
                page_index: self.ui.active_page_index,
                text,
                offset,
                style,
            }
        } else {
            self.ui.text_insertion.clone()?
        };
        if self.selection_count() != 1
            || self.selection.anchor != candidate.node_id
            || candidate.page_index != self.ui.active_page_index
            || !self.is_editable(&candidate.node_id)
            || !self.is_subtree_unlocked(&candidate.node_id)
            || !candidate.text.is_char_boundary(candidate.offset)
        {
            return None;
        }
        match crate::walkers::find_node(self.active_children(), &candidate.node_id) {
            Some(PenNode::Text(node)) if plain_text(&node.content) == candidate.text => {
                Some(candidate)
            }
            _ => None,
        }
    }

    pub fn retain_text_insertion(&mut self) {
        self.ui.text_insertion = self.current_text_insertion();
    }

    pub fn insert_at_retained_caret(&mut self, text: &str) -> Option<Result<(), String>> {
        self.ui.text_insertion.as_ref()?;
        let Some(caret) = self.current_text_insertion() else {
            self.ui.text_insertion = None;
            return Some(Err("Text changed; select it again".into()));
        };
        if text.is_empty() {
            return Some(Ok(()));
        }
        let success = self.start_text_edit(caret.node_id) && self.text_edit_insert(text, 1);
        self.text_edit_commit();
        Some(if success {
            Ok(())
        } else {
            Err("Could not insert text".into())
        })
    }

    pub(crate) fn set_text_insertion_style(
        &mut self,
        update: &TextRangeStyle,
    ) -> Option<Result<(), String>> {
        self.ui.text_insertion.as_ref()?;
        let Some(mut insertion) = self.current_text_insertion() else {
            self.ui.text_insertion = None;
            return Some(Err("Text changed; select it again".into()));
        };
        let Some(PenNode::Text(node)) =
            crate::walkers::find_node(self.active_children(), &insertion.node_id)
        else {
            return Some(Err("Text is no longer available".into()));
        };
        if let Err(error) = styled_range(&node.content, 0, 0, update) {
            return Some(Err(error));
        }
        macro_rules! merge {
            ($($field:ident),*) => { $(if update.$field.is_some() { insertion.style.$field = update.$field.clone(); })* };
        }
        merge!(
            font_family,
            font_size,
            font_weight,
            font_style,
            fill,
            underline,
            strikethrough,
            href
        );
        self.ui.text_insertion = Some(insertion);
        Some(Ok(()))
    }

    /// Style the inserted characters inside the typing history transaction.
    pub(crate) fn apply_text_insertion(
        &mut self,
        id: &NodeId,
        before: &TextInputState,
        after: &TextInputState,
    ) -> bool {
        let Some(insertion) = self.ui.text_insertion.take() else {
            return true;
        };
        if insertion.node_id != *id
            || insertion.page_index != self.ui.active_page_index
            || insertion.text != before.text()
            || insertion.offset != before.caret()
            || before.highlight_range().is_some_and(|(a, b)| a != b)
        {
            return true;
        }
        let start = before.text()[..insertion.offset].chars().count();
        let end = start
            + after.text()[insertion.offset..after.caret()]
                .chars()
                .count();
        if end == start {
            return true;
        }
        let Some(PenNode::Text(node)) =
            crate::walkers::find_node_mut(self.active_children_mut(), id)
        else {
            return false;
        };
        match styled_range(&node.content, start, end, &insertion.style) {
            Ok(content) => {
                node.content = content;
                true
            }
            Err(_) => false,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_support::{state_with, text};
    use jian_ops_schema::node::TextContent;

    fn caret_fixture() -> EditorState {
        let mut state = state_with(vec![text("t", "Title", 0.0, 0.0, 200.0, 40.0, "A中Z")]);
        state.set_single_selection(NodeId::new("t"));
        assert!(state.start_text_edit(NodeId::new("t")));
        assert!(state.text_edit_set_caret(1, false, 1));
        state.retain_text_selection();
        assert!(state.text_edit_commit());
        state
    }

    #[test]
    fn pending_style_affects_only_subsequent_input_and_is_undoable() {
        let mut state = caret_fixture();
        let original = state.doc.clone();
        state
            .apply_text_selection_style(&TextRangeStyle {
                font_size: Some(24.0),
                underline: Some(true),
                ..Default::default()
            })
            .unwrap()
            .unwrap();
        assert_eq!(state.doc, original);
        assert_eq!(state.selected_text_style().unwrap().size, Some(24.0));
        assert!(state.start_text_edit(NodeId::new("t")));
        assert_eq!(state.ui.text_edit_input.caret(), 1);
        assert!(state.text_edit_insert("🙂", 20));
        let PenNode::Text(node) = &state.doc.children[0] else {
            panic!("text")
        };
        let TextContent::Styled(runs) = &node.content else {
            panic!("styled")
        };
        assert_eq!(
            runs.iter().map(|run| run.text.as_str()).collect::<Vec<_>>(),
            ["A", "🙂", "中Z"]
        );
        assert_eq!(runs[1].font_size, Some(24.0));
        assert_eq!(runs[1].underline, Some(true));
        assert_eq!(runs[0].font_size, None);
        assert_eq!(runs[2].font_size, None);
        assert!(state.undo());
        assert_eq!(state.doc, original);
    }

    #[test]
    fn pending_style_is_applied_to_ime_input_and_caret_moves_invalidate_it() {
        let mut state = caret_fixture();
        state
            .apply_text_selection_style(&TextRangeStyle {
                fill: Some("#ff0000".into()),
                ..Default::default()
            })
            .unwrap()
            .unwrap();
        assert!(state.start_text_edit(NodeId::new("t")));
        assert!(state.text_edit_set_composition("文", "文".len(), 10));
        assert!(state.text_edit_commit_composition(20));
        let PenNode::Text(node) = &state.doc.children[0] else {
            panic!("text")
        };
        let TextContent::Styled(runs) = &node.content else {
            panic!("styled")
        };
        assert_eq!(runs[1].text, "文");
        assert_eq!(runs[1].fill.as_deref(), Some("#ff0000"));

        let mut moved = caret_fixture();
        moved
            .apply_text_selection_style(&TextRangeStyle {
                fill: Some("#ff0000".into()),
                ..Default::default()
            })
            .unwrap()
            .unwrap();
        assert!(moved.start_text_edit(NodeId::new("t")));
        assert!(moved.text_edit_set_caret(0, false, 20));
        assert!(moved.text_edit_insert("B", 30));
        let PenNode::Text(node) = &moved.doc.children[0] else {
            panic!("text")
        };
        assert!(matches!(&node.content, TextContent::Plain(value) if value == "BA中Z"));
    }
}
