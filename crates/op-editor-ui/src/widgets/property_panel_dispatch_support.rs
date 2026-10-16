//! Support half of the shared PropertyPanel dispatch (split out of
//! `property_panel_dispatch.rs` for the 800-line cap): the Code-panel
//! action state machine, the effect-parameter focus seed, and the
//! font / colour-variable resolution helpers. Re-exported from
//! `property_panel_dispatch` so hosts see a single module path.

use op_editor_core::EditorState;

use crate::widgets::property_panel_action::CodegenAction;
use crate::widgets::PropertyPanel;

/// Seed the effect-parameter draft after the host committed any pending
/// property / variable-row edit. Re-reads the live value off the panel
/// snapshot, because that commit may have moved it.
pub fn focus_effect_param(
    state: &mut EditorState,
    effect: usize,
    field: op_editor_core::EffectField,
    value: f32,
    now_ms: u64,
) {
    let value = effect_param_snapshot_value(state, effect, field).unwrap_or(value);
    let initial = if value.fract() == 0.0 {
        format!("{}", value as i64)
    } else {
        format!("{value}")
    };
    let ui = &mut state.ui;
    ui.property_input.set_text(initial.clone());
    ui.property_input.touch(now_ms);
    ui.property_input_draft = initial;
    ui.property_caret_pos = ui.property_input.caret();
    ui.property_caret_anchor_ms = now_ms;
    ui.property_draft_select_all = false;
    state.editor_ui.effect_param_focus =
        Some(op_editor_core::editor_ui_state::EffectParamFocus { effect, field });
}

/// Platform work a Code-panel action still needs after
/// [`apply_codegen_action`] ran its state half.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum CodegenFollowUp {
    None,
    /// The framework changed — drop any live code-selection drag.
    FrameworkChanged,
    /// Push the generated code onto the platform clipboard.
    Copy(String),
    /// Write the generated code out (native: pending flag drained by
    /// the desktop export pass; web: browser download).
    Download,
    /// Build + save the live AI structure bundle.
    ExportBundle,
}

/// Code-panel action state half. `SelectFramework` / `Generate` /
/// `Regenerate` / `Cancel` / framework scrolling are pure
/// `editor_state.codegen`; the IO arms come back as a follow-up.
pub fn apply_codegen_action(
    state: &mut EditorState,
    action: &CodegenAction,
    now_ms: u64,
) -> CodegenFollowUp {
    if !state.editor_ui.code_property_tab_available() {
        return CodegenFollowUp::None;
    }
    use op_editor_core::codegen::CodegenPhase;
    let property_panel_width = state.editor_ui.property_panel_width;
    let density = PropertyPanel::for_selection(state);
    let logical_property_panel_width = density.as_ref().map_or(property_panel_width, |panel| {
        panel.logical_length(property_panel_width)
    });
    let cg = &mut state.codegen;
    match action {
        CodegenAction::ToggleFrameworkPicker => {
            cg.framework_picker_open = !cg.framework_picker_open;
            cg.framework_hover = None;
            CodegenFollowUp::None
        }
        CodegenAction::SelectFramework(fw) => {
            cg.framework_picker_open = false;
            if cg.select_framework(*fw) {
                let target_ids: Vec<String> = if !state.selection.set.is_empty() {
                    state
                        .selection
                        .set
                        .iter()
                        .map(|id| id.as_str().to_string())
                        .collect()
                } else {
                    state
                        .active_children()
                        .iter()
                        .map(|n| op_editor_core::PenNodeExt::id_str(n).to_string())
                        .collect()
                };
                let generated = op_codegen::generate_for_format(
                    &state.doc,
                    state.active_children(),
                    &target_ids,
                    fw.as_wire(),
                );
                state.codegen.code = generated;
                state.codegen.selection_snapshot = target_ids;
                state.codegen.phase = CodegenPhase::Complete;
                state.codegen.code_scroll.offset = 0.0;
                state.codegen.code_h_scroll.offset = 0.0;
                return CodegenFollowUp::FrameworkChanged;
            }
            CodegenFollowUp::None
        }
        CodegenAction::Generate | CodegenAction::Regenerate => {
            let target_ids: Vec<String> = if !state.selection.set.is_empty() {
                state
                    .selection
                    .set
                    .iter()
                    .map(|id| id.as_str().to_string())
                    .collect()
            } else {
                state
                    .active_children()
                    .iter()
                    .map(|n| op_editor_core::PenNodeExt::id_str(n).to_string())
                    .collect()
            };
            let fw = state.codegen.framework;
            let generated = op_codegen::generate_for_format(
                &state.doc,
                state.active_children(),
                &target_ids,
                fw.as_wire(),
            );
            let cg = &mut state.codegen;
            cg.pending_generate = false;
            cg.pending_regenerate = false;
            cg.phase = CodegenPhase::Complete;
            cg.error = None;
            cg.code = generated;
            cg.selection_snapshot = target_ids;
            cg.code_scroll.offset = 0.0;
            cg.code_selection = None;
            CodegenFollowUp::None
        }
        CodegenAction::Cancel => {
            cg.pending_generate = false;
            cg.pending_regenerate = false;
            cg.pending_cancel = true;
            cg.phase = if cg.code.is_empty() {
                CodegenPhase::Idle
            } else {
                CodegenPhase::Complete
            };
            CodegenFollowUp::None
        }
        CodegenAction::Copy => {
            let code = if cg.code.is_empty() {
                let target_ids: Vec<String> = if !state.selection.set.is_empty() {
                    state
                        .selection
                        .set
                        .iter()
                        .map(|id| id.as_str().to_string())
                        .collect()
                } else {
                    state
                        .active_children()
                        .iter()
                        .map(|n| op_editor_core::PenNodeExt::id_str(n).to_string())
                        .collect()
                };
                let fw = state.codegen.framework;
                op_codegen::generate_for_format(
                    &state.doc,
                    state.active_children(),
                    &target_ids,
                    fw.as_wire(),
                )
            } else {
                cg.code.clone()
            };
            state.codegen.copied_at = Some(now_ms);
            CodegenFollowUp::Copy(code)
        }
        CodegenAction::Download => CodegenFollowUp::Download,
        CodegenAction::ExportBundle => CodegenFollowUp::ExportBundle,
        CodegenAction::ScrollFrameworksLeft | CodegenAction::ScrollFrameworksRight => {
            let logical_max = crate::widgets::property_panel_code::framework_row_overflow(
                logical_property_panel_width,
            );
            let max = density
                .as_ref()
                .map_or(logical_max, |panel| panel.physical_length(logical_max));
            let step = density
                .as_ref()
                .map_or(100.0, |panel| panel.physical_length(100.0));
            let delta = if matches!(action, CodegenAction::ScrollFrameworksLeft) {
                -step
            } else {
                step
            };
            cg.framework_scroll.scroll_by(delta, max, 0.0);
            CodegenFollowUp::None
        }
    }
}

/// Resolve a `SetFontFamilyIndex` / `RemoveImportedFont` index against
/// the SAME entries list the picker painted / hit-tested (imported +
/// bundled + system lists filtered by the live search).
pub(crate) fn font_picker_family_at(state: &EditorState, index: usize) -> Option<String> {
    let ui = &state.editor_ui;
    crate::widgets::property_panel_typography::font_picker_entries(
        &ui.imported_font_families,
        &ui.bundled_font_families,
        &ui.system_font_families,
        &ui.font_picker_search,
    )
    .get(index)
    .map(|entry| entry.family.to_string())
}

fn effect_param_snapshot_value(
    state: &EditorState,
    effect: usize,
    field: op_editor_core::EffectField,
) -> Option<f32> {
    PropertyPanel::for_selection(state)?
        .snapshot
        .effects
        .get(effect)
        .map(|summary| summary.param_value(field))
}

/// The name of colour variable `index` in document order.
pub fn color_variable_name_at(state: &EditorState, index: usize) -> Option<String> {
    state
        .doc
        .variables
        .as_ref()?
        .iter()
        .filter(|(_, def)| matches!(def.kind, jian_ops_schema::variable::VariableKind::Color))
        .nth(index)
        .map(|(name, _)| name.clone())
}

/// Translate the panel's `ColorTarget` into the `ui_draft` one the
/// colour-picker state machine uses.
pub fn color_target(t: op_editor_core::ColorTarget) -> op_editor_core::ui_draft::ColorTarget {
    match t {
        op_editor_core::ColorTarget::Fill => op_editor_core::ui_draft::ColorTarget::Fill,
        op_editor_core::ColorTarget::Stroke => op_editor_core::ui_draft::ColorTarget::Stroke,
        op_editor_core::ColorTarget::GradientStop(i) => {
            op_editor_core::ui_draft::ColorTarget::GradientStop(i)
        }
        op_editor_core::ColorTarget::EffectColor(i) => {
            op_editor_core::ui_draft::ColorTarget::EffectColor(i)
        }
    }
}

/// Result of [`apply_instance_lifecycle_action`].
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum InstanceLifecycleOutcome {
    Ignored,
    Handled {
        page_switched: bool,
        select: Option<op_editor_core::NodeId>,
    },
}

pub fn updates_document(action: &crate::widgets::PropertyPanelAction) -> bool {
    use crate::widgets::PropertyPanelAction;
    matches!(
        action,
        PropertyPanelAction::SetNodeBlendMode(_)
            | PropertyPanelAction::SetNodeMaskType(_)
            | PropertyPanelAction::SetFillBlendMode { .. }
            | PropertyPanelAction::AddFill
            | PropertyPanelAction::RemoveFill(_)
            | PropertyPanelAction::SetFillType { .. }
            | PropertyPanelAction::SetImageFillMode(_)
            | PropertyPanelAction::ClearPageBackground
    )
}

pub fn compositing_picker_target(
    target: crate::widgets::property_panel_action::CompositingTarget,
) -> op_editor_core::CompositingPickerTarget {
    use crate::widgets::property_panel_action::CompositingTarget;
    match target {
        CompositingTarget::NodeBlend => op_editor_core::CompositingPickerTarget::NodeBlend,
        CompositingTarget::NodeMask => op_editor_core::CompositingPickerTarget::NodeMask,
        CompositingTarget::FillBlend(index) => {
            op_editor_core::CompositingPickerTarget::FillBlend(index)
        }
    }
}

pub fn apply_instance_lifecycle_action(
    state: &mut EditorState,
    action: &crate::widgets::PropertyPanelAction,
) -> InstanceLifecycleOutcome {
    use crate::widgets::PropertyPanelAction as A;
    use op_editor_core::NodeId;
    match action {
        A::GoToComponent => {
            let mut page_switched = false;
            let mut select = None;
            if let Some(jian_ops_schema::node::PenNode::Ref(reference)) = state.selected_node() {
                let master = NodeId::new(reference.target.clone());
                if let Some(pages) = state.doc.pages.as_ref() {
                    let target_page = pages.iter().position(|page| {
                        op_editor_core::walkers::find_node(&page.children, &master).is_some()
                    });
                    if let Some(index) = target_page {
                        if index != state.ui.active_page_index {
                            let _ = state.set_active_page(index);
                            page_switched = true;
                        }
                    }
                }
                select = Some(master);
            }
            InstanceLifecycleOutcome::Handled {
                page_switched,
                select,
            }
        }
        A::DetachInstance | A::DetachComponent => {
            let id = state.selection.anchor.clone();
            if id.is_real() {
                let _ = state.detach_component(&id);
            }
            InstanceLifecycleOutcome::Handled {
                page_switched: false,
                select: None,
            }
        }
        A::ToggleInstanceComponentPicker => {
            let anchor = state.selection.anchor.as_str().to_string();
            state.editor_ui.toggle_instance_component_picker(&anchor);
            state.editor_ui.close_fill_type_picker();
            state.editor_ui.close_compositing_picker();
            InstanceLifecycleOutcome::Handled {
                page_switched: false,
                select: None,
            }
        }
        A::SetInstanceComponent(component_id) => {
            let instance_id = state.selection.anchor.clone();
            let component_id = NodeId::new(component_id.clone());
            let _ = state.set_instance_component(&instance_id, &component_id);
            state.editor_ui.close_instance_component_picker();
            InstanceLifecycleOutcome::Handled {
                page_switched: false,
                select: None,
            }
        }
        _ => InstanceLifecycleOutcome::Ignored,
    }
}

pub(crate) fn apply_node_text_and_interaction_action(
    state: &mut EditorState,
    action: &crate::widgets::PropertyPanelAction,
) -> crate::widgets::property_panel_dispatch::PropertyActionOutcome {
    use crate::widgets::property_panel_dispatch::{
        PropertyActionFollowUp as F, PropertyActionOutcome,
    };
    use crate::widgets::property_panel_layout_ops as layout_ops;
    use crate::widgets::PropertyPanelAction as A;
    use op_editor_core::PenNodeExt;
    match action {
        A::ToggleInteractionMenu => {
            let ui = &mut state.editor_ui;
            ui.toggle_interaction_menu();
            ui.close_fill_type_picker();
            ui.image_fill_popover_open = false;
            ui.close_font_picker();
            ui.font_weight_picker_open = false;
            ui.export_scale_picker_open = false;
            ui.export_format_picker_open = false;
            ui.close_color_variable_picker();
            PropertyActionOutcome::Handled
        }
        A::SetInteractionNavigate { path } => {
            let node_id = state.selection.anchor.clone();
            if node_id.is_real() {
                state.commit_history();
                let patch_json =
                    crate::widgets::property_panel_interactions::navigate_patch_json(path.as_str());
                let _ = state.apply(op_editor_core::EditorCommand::PatchNodeData {
                    node_id,
                    patch_json,
                    page_id: None,
                });
            }
            state.editor_ui.close_interaction_menu();
            PropertyActionOutcome::Handled
        }
        A::SetInteractionPop => {
            let node_id = state.selection.anchor.clone();
            if node_id.is_real() {
                state.commit_history();
                let _ = state.apply(op_editor_core::EditorCommand::PatchNodeData {
                    node_id,
                    patch_json: crate::widgets::property_panel_interactions::POP_PATCH_JSON
                        .to_string(),
                    page_id: None,
                });
            }
            state.editor_ui.close_interaction_menu();
            PropertyActionOutcome::Handled
        }
        A::RemoveInteraction => {
            let node_id = state.selection.anchor.clone();
            if node_id.is_real() {
                let mut handlers = state
                    .selected_node()
                    .and_then(|n| n.events().cloned())
                    .unwrap_or_default();
                handlers.on_tap = None;
                let patch_json = if handlers == jian_ops_schema::events::EventHandlers::default() {
                    r#"{"events":null}"#.to_string()
                } else {
                    let value = serde_json::to_value(&handlers).unwrap_or(serde_json::Value::Null);
                    format!(r#"{{"events":{value}}}"#)
                };
                state.commit_history();
                let _ = state.apply(op_editor_core::EditorCommand::PatchNodeData {
                    node_id,
                    patch_json,
                    page_id: None,
                });
            }
            state.editor_ui.close_interaction_menu();
            PropertyActionOutcome::Handled
        }
        A::CopyTextContent => PropertyActionOutcome::FollowUp(F::CopyTextContent),
        A::ToggleTextBold => {
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
            let sel = state.selection.anchor.clone();
            if sel.is_real() {
                state.commit_history();
                let _ = state.toggle_node_text_italic(&sel);
            }
            PropertyActionOutcome::Handled
        }
        A::ToggleTextUnderline => {
            let sel = state.selection.anchor.clone();
            if sel.is_real() {
                state.commit_history();
                let _ = state.toggle_node_text_underline(&sel);
            }
            PropertyActionOutcome::Handled
        }
        A::ToggleTextStrikethrough => {
            let sel = state.selection.anchor.clone();
            if sel.is_real() {
                state.commit_history();
                let _ = state.toggle_node_text_strikethrough(&sel);
            }
            PropertyActionOutcome::Handled
        }
        A::ToggleNodeVisible => {
            let sel = state.selection.anchor.clone();
            if sel.is_real() {
                let hidden = state
                    .selected_node()
                    .is_some_and(|n| n.base().visible == Some(false));
                state.commit_history();
                let _ = state.apply(op_editor_core::EditorCommand::SetNodeFlag {
                    node_id: sel,
                    flag: op_editor_core::NodeFlag::Hidden,
                    value: !hidden,
                });
            }
            PropertyActionOutcome::Handled
        }
        A::ToggleNodeLocked => {
            let sel = state.selection.anchor.clone();
            if sel.is_real() {
                let locked = state
                    .selected_node()
                    .is_some_and(|n| n.base().locked == Some(true));
                state.commit_history();
                let _ = state.apply(op_editor_core::EditorCommand::SetNodeFlag {
                    node_id: sel,
                    flag: op_editor_core::NodeFlag::Locked,
                    value: !locked,
                });
            }
            PropertyActionOutcome::Handled
        }
        _ => PropertyActionOutcome::Handled,
    }
}
