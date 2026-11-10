//! Text formatting actions for the current layer or selected text range.
use crate::widgets::property_panel_dispatch::PropertyActionOutcome;
use crate::widgets::property_panel_layout_ops as layout_ops;
use crate::widgets::PropertyPanelAction as A;
use op_editor_core::EditorState;

pub(super) fn apply(state: &mut EditorState, action: &A) -> PropertyActionOutcome {
    match action {
        A::ToggleTextBold => {
            if state
                .toggle_text_selection_flag(op_editor_core::text_selection::TextSelectionFlag::Bold)
                .is_some()
            {
                return PropertyActionOutcome::Handled;
            }
            let sel = state.selection.anchor.clone();
            if sel.is_real() {
                let current_weight = state
                    .selected_node()
                    .and_then(op_editor_core::command_node_attrs::resolve_text_node)
                    .and_then(|t| match t.font_weight.as_ref() {
                        Some(jian_ops_schema::node::text::FontWeight::Number(n)) => Some(*n as u16),
                        Some(jian_ops_schema::node::text::FontWeight::Keyword(s))
                            if s == "bold" || s == "semibold" =>
                        {
                            Some(700)
                        }
                        _ => None,
                    })
                    .unwrap_or(400);
                let next_weight = if current_weight >= 600 { 400 } else { 700 };
                layout_ops::set_selected_font_weight(state, next_weight);
            }
            PropertyActionOutcome::Handled
        }
        A::ToggleTextItalic => {
            if state
                .toggle_text_selection_flag(
                    op_editor_core::text_selection::TextSelectionFlag::Italic,
                )
                .is_some()
            {
                return PropertyActionOutcome::Handled;
            }
            let sel = state.selection.anchor.clone();
            if sel.is_real() {
                state.commit_history();
                let _ = state.toggle_node_text_italic(&sel);
            }
            PropertyActionOutcome::Handled
        }
        A::ToggleTextUnderline => {
            if state
                .toggle_text_selection_flag(
                    op_editor_core::text_selection::TextSelectionFlag::Underline,
                )
                .is_some()
            {
                return PropertyActionOutcome::Handled;
            }
            let sel = state.selection.anchor.clone();
            if sel.is_real() {
                state.commit_history();
                let _ = state.toggle_node_text_underline(&sel);
            }
            PropertyActionOutcome::Handled
        }
        A::ToggleTextStrikethrough => {
            if state
                .toggle_text_selection_flag(
                    op_editor_core::text_selection::TextSelectionFlag::Strikethrough,
                )
                .is_some()
            {
                return PropertyActionOutcome::Handled;
            }
            let sel = state.selection.anchor.clone();
            if sel.is_real() {
                state.commit_history();
                let _ = state.toggle_node_text_strikethrough(&sel);
            }
            PropertyActionOutcome::Handled
        }
        _ => PropertyActionOutcome::Handled,
    }
}
