//! Effect parameter draft lifecycle.
use super::*;

/// Commit a pending effect-parameter edit (the Effects section's
/// editable value box). Parses the shared draft and writes it via
/// `SetEffectParam`; a non-numeric draft is discarded. Returns `true`
/// when a focus was taken, i.e. the host should mark dirty.
pub fn commit_effect_param_focus(state: &mut EditorState) -> bool {
    let Some(focus) = state.editor_ui.effect_param_focus.take() else {
        return false;
    };
    state.ui.property_draft_select_all = false;
    let draft = state.ui.property_input.text().to_owned();
    state.ui.property_input.set_text("");
    state.ui.property_input_draft.clear();
    state.ui.property_caret_pos = 0;
    if let Ok(value) = draft.trim().parse::<f32>() {
        if value.is_finite() {
            let id = state.selection.anchor.clone();
            if id.is_real() {
                // Instance-write redirect (GAP #10) — see
                // `apply_property_action` for the choke-point note.
                let instance_scope = state.begin_instance_write_for_anchor();
                state.commit_history();
                let _ = state.apply(op_editor_core::EditorCommand::SetEffectParam {
                    node_id: id,
                    index: focus.effect as u32,
                    field: focus.field,
                    value,
                });
                if let Some(scope) = instance_scope {
                    state.finish_instance_write(scope);
                }
            }
        }
    }
    true
}

/// Drop an effect-parameter draft without applying it.
///
/// Collaboration gates use this after a role/phase change so a draft that was
/// focused while editable cannot commit after the session becomes read-only.
pub fn discard_effect_param_focus(state: &mut EditorState) -> bool {
    if state.editor_ui.effect_param_focus.take().is_none() {
        return false;
    }
    clear_property_draft(state);
    true
}
