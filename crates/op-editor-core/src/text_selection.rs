//! A text range retained when the property panel takes keyboard focus.
use crate::text_design::{plain_text, styled_range, TextRangeStyle};
use crate::{EditorCommand, EditorState, NodeId};
use jian_ops_schema::node::{PenNode, TextContent};

#[path = "text_selection_summary.rs"]
mod summary;
pub use summary::TextSelectionStyle;

#[derive(Debug, Clone, Copy)]
pub enum TextSelectionFlag {
    Bold,
    Italic,
    Underline,
    Strikethrough,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TextSelection {
    pub node_id: NodeId,
    pub page_index: usize,
    pub text: String,
    pub start: usize,
    pub end: usize,
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_support::{state_with, text};

    #[test]
    fn retained_range_styles_only_selected_unicode_text_and_undoes() {
        let mut state = state_with(vec![text(
            "t",
            "Label",
            0.0,
            0.0,
            200.0,
            40.0,
            "购买🙂商品",
        )]);
        state.set_single_selection(NodeId::new("t"));
        let before = state.doc.clone();
        assert!(state.start_text_edit(NodeId::new("t")));
        assert!(state.text_edit_select_range("购买".len(), "购买🙂".len(), 1));
        state.retain_text_selection();
        assert!(state.text_edit_commit());
        let style = TextRangeStyle {
            fill: Some("#ff0000".into()),
            ..Default::default()
        };
        state.apply_text_selection_style(&style).unwrap().unwrap();
        let PenNode::Text(node) = &state.doc.children[0] else {
            panic!("text")
        };
        let TextContent::Styled(runs) = &node.content else {
            panic!("styled")
        };
        assert_eq!(runs[0].text, "购买");
        assert_eq!(runs[1].text, "🙂");
        assert_eq!(runs[1].fill.as_deref(), Some("#ff0000"));
        assert_eq!(runs[2].text, "商品");
        assert!(state.undo());
        assert_eq!(state.doc, before);
    }

    #[test]
    fn retained_range_rejects_changed_content_without_editing_the_node() {
        let mut state = state_with(vec![text("t", "Label", 0.0, 0.0, 200.0, 40.0, "Hello")]);
        state.set_single_selection(NodeId::new("t"));
        assert!(state.start_text_edit(NodeId::new("t")));
        assert!(state.text_edit_select_range(0, 2, 1));
        state.retain_text_selection();
        state.text_edit_commit();
        let PenNode::Text(node) = &mut state.doc.children[0] else {
            panic!("text")
        };
        node.content = TextContent::Plain("Changed".into());
        let before = state.doc.clone();
        assert!(state
            .apply_text_selection_style(&TextRangeStyle {
                font_size: Some(18.0),
                ..Default::default()
            })
            .unwrap()
            .is_err());
        assert_eq!(state.doc, before);
        assert!(state.ui.text_selection.is_none());
    }

    #[test]
    fn text_selection_reports_mixed_values_and_toggles_only_its_range() {
        let mut state = state_with(vec![serde_json::from_value(serde_json::json!({
            "type":"text", "id":"t", "fontSize":16,
            "content":[{"text":"A","fontSize":12},{"text":"中","fontSize":24}, {"text":"Z"}]
        }))
        .unwrap()]);
        state.set_single_selection(NodeId::new("t"));
        assert!(state.start_text_edit(NodeId::new("t")));
        assert!(state.text_edit_select_range(0, "A中".len(), 1));
        state.retain_text_selection();
        state.text_edit_commit();
        assert_eq!(state.selected_text_style().unwrap().size, None);
        state
            .toggle_text_selection_flag(TextSelectionFlag::Bold)
            .unwrap()
            .unwrap();
        let style = state.selected_text_style().unwrap();
        assert_eq!(style.weight, Some(700));
        assert_eq!(style.size, None);
        let PenNode::Text(node) = &state.doc.children[0] else {
            panic!("text")
        };
        let TextContent::Styled(runs) = &node.content else {
            panic!("styled")
        };
        assert_eq!(runs.last().unwrap().font_weight, None);
    }

    #[test]
    fn empty_styled_caret_can_toggle_format_for_new_text() {
        let mut state = state_with(vec![serde_json::from_value(serde_json::json!({
            "type": "text", "id": "t", "fontSize": 18,
            "content": [{"text": "原文", "underline": true}]
        }))
        .unwrap()]);
        state.set_single_selection(NodeId::new("t"));
        assert!(state.start_text_edit(NodeId::new("t")));
        assert!(state.text_edit_select_all_now(1));
        assert!(state.text_edit_backspace(2));
        let PenNode::Text(node) = &state.doc.children[0] else {
            panic!("text")
        };
        assert!(matches!(&node.content, TextContent::Styled(runs) if runs.is_empty()));
        state.retain_text_selection();
        assert!(state.text_edit_commit());
        let style = state
            .selected_text_style()
            .expect("empty caret has base style");
        assert_eq!(style.size, Some(18.0));
        assert_eq!(style.weight, Some(400));
        state
            .toggle_text_selection_flag(TextSelectionFlag::Bold)
            .unwrap()
            .unwrap();
        state
            .toggle_text_selection_flag(TextSelectionFlag::Underline)
            .unwrap()
            .unwrap();
        assert!(state.start_text_edit(NodeId::new("t")));
        assert!(state.text_edit_insert("新🙂", 10));
        let PenNode::Text(node) = &state.doc.children[0] else {
            panic!("text")
        };
        let TextContent::Styled(runs) = &node.content else {
            panic!("styled")
        };
        assert_eq!(runs[0].text, "新🙂");
        assert_eq!(runs[0].font_weight, Some(700));
        assert_eq!(runs[0].underline, Some(true));
        assert!(state.undo());
    }
}

impl EditorState {
    /// Capture only an active non-empty selection, in Unicode scalar offsets.
    pub fn retain_text_selection(&mut self) {
        self.ui.text_selection = self.current_text_selection();
        self.ui.text_insertion = if self.ui.text_selection.is_none() {
            self.current_text_insertion()
        } else {
            None
        };
    }

    pub fn current_text_selection(&self) -> Option<TextSelection> {
        if self.ui.text_editing.is_some() {
            return self.ui.text_editing.as_ref().and_then(|id| {
                let text = self.text_edit_content()?;
                let (start, end) = self.text_edit_effective_selection(text.len())?;
                Some(TextSelection {
                    node_id: id.clone(),
                    page_index: self.ui.active_page_index,
                    text: text.to_owned(),
                    start: text.get(..start)?.chars().count(),
                    end: text.get(..end)?.chars().count(),
                })
            });
        }
        let range = self.ui.text_selection.as_ref()?;
        if self.selection_count() != 1
            || self.selection.anchor != range.node_id
            || self.ui.active_page_index != range.page_index
        {
            return None;
        }
        match crate::walkers::find_node(self.active_children(), &range.node_id) {
            Some(PenNode::Text(node)) if plain_text(&node.content) == range.text => {
                Some(range.clone())
            }
            _ => None,
        }
    }

    /// Replace only the retained range while keeping its surrounding rich runs.
    pub fn replace_selected_text(&mut self, replacement: &str) -> Option<Result<(), String>> {
        let retained = self.ui.text_selection.as_ref()?;
        let range = match self.current_text_selection() {
            Some(range)
                if self.is_editable(&range.node_id) && self.is_subtree_unlocked(&range.node_id) =>
            {
                range
            }
            _ => return Some(Err("Text changed; select it again".into())),
        };
        if retained
            .text
            .chars()
            .skip(range.start)
            .take(range.end - range.start)
            .collect::<String>()
            == replacement
        {
            return Some(Ok(()));
        }
        let byte_at = |index| {
            range
                .text
                .char_indices()
                .nth(index)
                .map_or(range.text.len(), |(byte, _)| byte)
        };
        let mut before = jian_core::text_input::TextInputState::with_text(&range.text);
        before.set_caret(byte_at(range.start), 0);
        before.drag_to(byte_at(range.end), 0);
        let mut after = before.clone();
        after.insert_str(replacement, 0);
        let content = match crate::walkers::find_node(self.active_children(), &range.node_id) {
            Some(PenNode::Text(text)) => {
                crate::text_edit::replace_styled_input(&text.content, &before, &after)
            }
            _ => None,
        };
        let Some(content) = content else {
            return Some(Err("Could not replace selected text".into()));
        };
        let command = EditorCommand::Batch {
            commands: vec![EditorCommand::PatchNodeData {
                node_id: range.node_id.clone(),
                patch_json: serde_json::json!({"content":content}).to_string(),
                page_id: None,
            }],
        };
        if !self.apply(command) {
            return Some(Err("Could not replace selected text".into()));
        }
        self.ui.text_selection = (!replacement.is_empty()).then(|| TextSelection {
            text: after.text().to_owned(),
            end: range.start + replacement.chars().count(),
            ..range
        });
        Some(Ok(()))
    }

    fn prepare_text_selection_style(
        &mut self,
        style: &TextRangeStyle,
    ) -> Option<Result<(NodeId, TextContent), String>> {
        let range = self.ui.text_selection.clone()?;
        if self.selection_count() != 1
            || self.selection.anchor != range.node_id
            || self.ui.active_page_index != range.page_index
            || !self.is_editable(&range.node_id)
            || !self.is_subtree_unlocked(&range.node_id)
        {
            self.ui.text_selection = None;
            return Some(Err("Text selection is no longer available".into()));
        }
        let content = match crate::walkers::find_node(self.active_children(), &range.node_id) {
            Some(PenNode::Text(node)) if plain_text(&node.content) == range.text => {
                node.content.clone()
            }
            _ => {
                self.ui.text_selection = None;
                return Some(Err("Text changed; select it again".into()));
            }
        };
        let content = match styled_range(&content, range.start, range.end, style) {
            Ok(content) => content,
            Err(error) => return Some(Err(error)),
        };
        Some(Ok((range.node_id, content)))
    }

    /// `None` means no retained range; `Some` never falls back to changing the whole node.
    pub fn apply_text_selection_style(
        &mut self,
        style: &TextRangeStyle,
    ) -> Option<Result<(), String>> {
        if let Some(result) = self.set_text_insertion_style(style) {
            return Some(result);
        }
        let (node_id, content) = match self.prepare_text_selection_style(style)? {
            Ok(prepared) => prepared,
            Err(error) => return Some(Err(error)),
        };
        if matches!(crate::walkers::find_node(self.active_children(), &node_id), Some(PenNode::Text(node)) if node.content == content)
        {
            return Some(Ok(()));
        }
        let command = EditorCommand::Batch {
            commands: vec![EditorCommand::PatchNodeData {
                node_id,
                patch_json: serde_json::json!({"content": content}).to_string(),
                page_id: None,
            }],
        };
        Some(if self.apply(command) {
            Ok(())
        } else {
            Err("Could not apply text style".into())
        })
    }

    /// Apply a live colour preview; the picker owns the single undo snapshot.
    pub fn preview_text_selection_style(
        &mut self,
        style: &TextRangeStyle,
    ) -> Option<Result<(), String>> {
        if let Some(result) = self.set_text_insertion_style(style) {
            return Some(result);
        }
        let (id, content) = match self.prepare_text_selection_style(style)? {
            Ok(prepared) => prepared,
            Err(error) => return Some(Err(error)),
        };
        let Some(PenNode::Text(node)) =
            crate::walkers::find_node_mut(self.active_children_mut(), &id)
        else {
            return Some(Err("Text selection is no longer available".into()));
        };
        if node.content == content {
            return Some(Ok(()));
        }
        node.content = content;
        self.mark_document_changed();
        Some(Ok(()))
    }

    pub fn toggle_text_selection_flag(
        &mut self,
        flag: TextSelectionFlag,
    ) -> Option<Result<(), String>> {
        if self.ui.text_insertion.is_some() {
            let Some(current) = self.selected_text_style() else {
                self.ui.text_insertion = None;
                return Some(Err("Text changed; select it again".into()));
            };
            let mut style = TextRangeStyle::default();
            match flag {
                TextSelectionFlag::Bold => {
                    style.font_weight = Some(if current.weight.unwrap_or(400) >= 600 {
                        400
                    } else {
                        700
                    })
                }
                TextSelectionFlag::Italic => {
                    style.font_style = Some(if current.italic.unwrap_or(false) {
                        jian_ops_schema::style::FontStyleKind::Normal
                    } else {
                        jian_ops_schema::style::FontStyleKind::Italic
                    })
                }
                TextSelectionFlag::Underline => {
                    style.underline = Some(!current.underline.unwrap_or(false))
                }
                TextSelectionFlag::Strikethrough => {
                    style.strikethrough = Some(!current.strikethrough.unwrap_or(false))
                }
            }
            return self.set_text_insertion_style(&style);
        }
        let range = self.ui.text_selection.clone()?;
        let Some(PenNode::Text(node)) =
            crate::walkers::find_node(self.active_children(), &range.node_id)
        else {
            return Some(Err("Text selection is no longer available".into()));
        };
        if plain_text(&node.content) != range.text || self.selection.anchor != range.node_id {
            self.ui.text_selection = None;
            return Some(Err("Text changed; select it again".into()));
        }
        let default_bold = match &node.font_weight {
            Some(jian_ops_schema::node::text::FontWeight::Number(value)) => *value >= 600,
            Some(jian_ops_schema::node::text::FontWeight::Keyword(value)) => {
                value == "bold" || value == "semibold"
            }
            None => false,
        };
        let default_italic = matches!(
            node.font_style,
            Some(jian_ops_schema::node::text::FontStyleKind::Italic)
        );
        let mut offset = 0usize;
        let runs = match &node.content {
            TextContent::Plain(text) => vec![crate::text_design::segment(text)],
            TextContent::Styled(runs) => runs.clone(),
        };
        let all_on = runs
            .iter()
            .filter_map(|run| {
                let end = offset + run.text.chars().count();
                let intersects = offset < range.end && end > range.start;
                offset = end;
                intersects.then(|| match flag {
                    TextSelectionFlag::Bold => {
                        run.font_weight.map_or(default_bold, |weight| weight >= 600)
                    }
                    TextSelectionFlag::Italic => {
                        run.font_style.as_ref().map_or(default_italic, |style| {
                            matches!(style, jian_ops_schema::style::FontStyleKind::Italic)
                        })
                    }
                    TextSelectionFlag::Underline => {
                        run.underline.unwrap_or(node.underline.unwrap_or(false))
                    }
                    TextSelectionFlag::Strikethrough => run
                        .strikethrough
                        .unwrap_or(node.strikethrough.unwrap_or(false)),
                })
            })
            .all(|on| on);
        let mut style = TextRangeStyle::default();
        match flag {
            TextSelectionFlag::Bold => style.font_weight = Some(if all_on { 400 } else { 700 }),
            TextSelectionFlag::Italic => {
                style.font_style = Some(if all_on {
                    jian_ops_schema::style::FontStyleKind::Normal
                } else {
                    jian_ops_schema::style::FontStyleKind::Italic
                })
            }
            TextSelectionFlag::Underline => style.underline = Some(!all_on),
            TextSelectionFlag::Strikethrough => style.strikethrough = Some(!all_on),
        }
        self.apply_text_selection_style(&style)
    }
}
