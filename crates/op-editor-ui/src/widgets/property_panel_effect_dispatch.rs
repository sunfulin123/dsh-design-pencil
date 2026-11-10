//! State-only effect editing shared by the native and web property panels.

use crate::widgets::PropertyPanelAction;
use op_editor_core::{EditorCommand, EditorState};

pub(super) fn apply(
    state: &mut EditorState,
    action: &PropertyPanelAction,
    radius_drag: &mut Option<usize>,
) {
    match action {
        PropertyPanelAction::SetEffectVisible(index, visible) => {
            let _ = state.set_selected_effect_visible(*index, *visible);
        }
        PropertyPanelAction::RemoveEffect(index) => {
            let _ = state.remove_selected_effect(*index);
        }
        PropertyPanelAction::AdjustEffectParam {
            effect,
            field,
            new_value,
        } => {
            let id = state.selection.anchor.clone();
            if id.is_real() {
                if radius_drag.is_none() {
                    state.commit_history();
                }
                *radius_drag = Some(*effect);
                let _ = state.apply(EditorCommand::SetEffectParam {
                    node_id: id,
                    index: *effect as u32,
                    field: *field,
                    value: *new_value,
                });
            }
        }
        _ => unreachable!("only effect editing actions are dispatched here"),
    }
}
