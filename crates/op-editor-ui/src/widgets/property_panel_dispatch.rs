//! Shared PropertyPanel action dispatch.
//!
//! `apply_property_action` used to exist as two ~500-line near-verbatim
//! copies (`op-host-native/src/widget_host/property_dispatch.rs` and its
//! `op-host-web` twin). Every arm that only writes `EditorState` lives
//! here now; the hosts keep the platform glue (layout-scene size
//! resolution, file dialogs, clipboard, font enumeration, crop-edit
//! entry) and drive it through the returned outcome / follow-up.
//!
//! Ordering contract the hosts must preserve, in this order:
//!   1. commit the image-fill tile-scale draft,
//!   2. snapshot for history when [`updates_document`],
//!   3. [`apply_instance_lifecycle_action`] (acts on the REAL Ref node,
//!      so it runs BEFORE the instance-write redirect),
//!   4. resolve the Fill/Hug pixel fallback off the real layout scene,
//!   5. `begin_instance_write_for_anchor()`,
//!   6. [`apply_property_action`] + the host's own `HostOwned` match,
//!   7. `finish_instance_write` / history push / `mark_dirty`.

use op_editor_core::EditorState;

use crate::widgets::property_panel_layout_ops as layout_ops;
use crate::widgets::PropertyPanelAction;

// The Code-panel action half, the effect-param focus seed and the
// font / colour resolution helpers live in a sibling module (800-line
// cap); re-exported so both hosts keep one `property_panel_dispatch::`
// entry point.
pub use crate::widgets::property_panel_dispatch_support::{
    apply_codegen_action, apply_instance_lifecycle_action, color_target, color_variable_name_at,
    compositing_picker_target, focus_effect_param, updates_document, CodegenFollowUp,
    InstanceLifecycleOutcome,
};
use crate::widgets::property_panel_dispatch_support::{
    apply_node_text_and_interaction_action, font_picker_family_at,
};

/// Platform work the shared dispatcher cannot do itself.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PropertyActionFollowUp {
    /// Enter image-crop editing for the selected node.
    EnterImageCropEdit,
    /// Leave image-crop editing.
    ExitImageCropEdit,
    /// Enumerate installed font families before the picker paints.
    /// Native resolves this synchronously (the TS app requests Local
    /// Font Access inside the click gesture for the same reason); the
    /// web host drains its own permission flow after the press and
    /// ignores it.
    EnsureSystemFontsLoaded,
    /// Copy the selected node's text content to the platform clipboard.
    CopyTextContent,
}

/// What [`apply_property_action`] did with an action.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PropertyActionOutcome {
    /// Fully applied against `EditorState`.
    Handled,
    /// Applied, but the host must still run this platform follow-up.
    FollowUp(PropertyActionFollowUp),
    /// Platform-owned — the caller's own match handles it.
    HostOwned,
}

/// Host-owned state the shared arms need to touch. Built inline at the
/// call site so the borrows stay disjoint from `&mut EditorState`.
pub struct PropertyActionContext<'a> {
    pub now_ms: u64,
    /// Fill/Hug pixel size read off the real layout scene BEFORE the
    /// instance-write redirect swapped in a merged display node.
    pub resolved_sizing_fallback: Option<f64>,
    pub image_adjustment_drag: &'a mut Option<op_editor_core::ImageAdjustmentField>,
    pub effect_radius_drag: &'a mut Option<usize>,
}

pub use crate::widgets::property_panel_collab::collab_gate_action;

/// Apply the editor-state half of a PropertyPanel action.
pub fn apply_property_action(
    state: &mut EditorState,
    action: &PropertyPanelAction,
    ctx: PropertyActionContext<'_>,
) -> PropertyActionOutcome {
    use PropertyActionFollowUp as F;
    use PropertyActionOutcome::{FollowUp, Handled, HostOwned};
    use PropertyPanelAction as A;
    match action {
        // Dispatched by `apply_instance_lifecycle_action` before the
        // instance-write scope opened; unreachable here.
        A::GoToComponent
        | A::DetachInstance
        | A::DetachComponent
        | A::ToggleInstanceComponentPicker
        | A::SetInstanceComponent(_) => Handled,
        // Set the active PropertyPanel tab without allowing direct action
        // dispatch to reopen Code in a Compact layout. Returns whether the stored
        // value changed.
        A::SetPropertyTab(tab) => {
            if state.editor_ui.set_property_tab(*tab)
                && matches!(
                    state.editor_ui.effective_property_tab(),
                    op_editor_core::PropertyTab::Code
                )
            {
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
                state.codegen.code = op_codegen::generate_for_format(
                    &state.doc,
                    state.active_children(),
                    &target_ids,
                    fw.as_wire(),
                );
                state.codegen.selection_snapshot = target_ids;
                state.codegen.phase = op_editor_core::codegen::CodegenPhase::Complete;
            }
            Handled
        }
        A::ToggleCompositingPicker(target) => {
            state
                .editor_ui
                .toggle_compositing_picker(compositing_picker_target(*target));
            Handled
        }
        A::SetNodeBlendMode(mode) => {
            let _ = state.set_selected_node_blend_mode(mode.clone());
            state.editor_ui.close_compositing_picker();
            Handled
        }
        A::SetNodeMaskType(mask_type) => {
            let _ = state.set_selected_node_mask_type(*mask_type);
            state.editor_ui.close_compositing_picker();
            Handled
        }
        A::SetFillBlendMode { index, mode } => {
            let _ = state.set_selected_fill_blend_mode(*index, mode.clone());
            state.editor_ui.close_compositing_picker();
            Handled
        }
        A::ClearPageBackground => {
            let _ = state.set_active_page_background_color(None);
            Handled
        }
        A::ToggleCornerExpand => {
            state.editor_ui.toggle_corner_expand();
            Handled
        }
        A::SetFillRule(rule) => {
            let _ = state.set_selected_fill_rule(*rule);
            Handled
        }
        A::AlignSelection(action) => {
            state.align_selected(*action);
            Handled
        }
        A::SetFlexLayout(mode) => {
            layout_ops::set_selected_layout_mode(state, *mode);
            Handled
        }
        A::ToggleSizeFillWidth => {
            layout_ops::toggle_selected_sizing(
                state,
                true,
                jian_ops_schema::sizing::SizingKeyword::FillContainer,
                ctx.resolved_sizing_fallback,
            );
            Handled
        }
        A::ToggleSizeFillHeight => {
            layout_ops::toggle_selected_sizing(
                state,
                false,
                jian_ops_schema::sizing::SizingKeyword::FillContainer,
                ctx.resolved_sizing_fallback,
            );
            Handled
        }
        A::ToggleSizeHugWidth => {
            layout_ops::toggle_selected_sizing(
                state,
                true,
                jian_ops_schema::sizing::SizingKeyword::FitContent,
                ctx.resolved_sizing_fallback,
            );
            Handled
        }
        A::ToggleSizeHugHeight => {
            layout_ops::toggle_selected_sizing(
                state,
                false,
                jian_ops_schema::sizing::SizingKeyword::FitContent,
                ctx.resolved_sizing_fallback,
            );
            Handled
        }
        A::ToggleSizeClipContent => {
            layout_ops::toggle_selected_clip_content(state);
            Handled
        }
        A::SetLayoutAlign(value) => {
            layout_ops::set_selected_layout_align(state, *value);
            Handled
        }
        A::SetLayoutJustify(value) => {
            layout_ops::set_selected_layout_justify(state, *value);
            Handled
        }
        A::SetLayoutAlignment { justify, align } => {
            layout_ops::set_selected_layout_alignment(state, *justify, *align);
            Handled
        }
        A::CreateComponent => {
            let id = state.selection.anchor.clone();
            if id.is_real() {
                let _ = state.create_component_from_node_name(&id);
            }
            Handled
        }
        A::ToggleFillTypePicker(index) => {
            let ui = &mut state.editor_ui;
            ui.toggle_fill_type_picker_for(*index);
            ui.image_fill_popover_open = false;
            ui.close_font_picker();
            ui.font_weight_picker_open = false;
            ui.close_color_variable_picker();
            Handled
        }
        A::SetFillType { index, fill_type } => {
            state.set_selected_fill_type_at(*index, *fill_type);
            let ui = &mut state.editor_ui;
            ui.close_fill_type_picker();
            ui.image_fill_popover_open = false;
            ui.close_color_variable_picker();
            Handled
        }
        A::AddFill => {
            let _ = state.add_selected_fill();
            Handled
        }
        A::MoveFill { from, to } => {
            let _ = state.move_selected_fill(*from, *to);
            Handled
        }
        A::RemoveFill(index) => {
            let _ = state.remove_selected_fill(*index);
            let ui = &mut state.editor_ui;
            ui.close_fill_type_picker();
            ui.image_fill_popover_open = false;
            ui.close_color_variable_picker();
            Handled
        }
        A::AddGradientStop => {
            let _ = state.add_selected_gradient_stop();
            Handled
        }
        A::RemoveGradientStop(index) => {
            let _ = state.remove_selected_gradient_stop(*index);
            Handled
        }
        A::ToggleImageFillPopover => {
            let ui = &mut state.editor_ui;
            ui.image_fill_popover_open = !ui.image_fill_popover_open;
            ui.close_fill_type_picker();
            ui.close_font_picker();
            ui.font_weight_picker_open = false;
            ui.export_scale_picker_open = false;
            ui.export_format_picker_open = false;
            ui.close_color_variable_picker();
            if ui.image_fill_popover_open {
                FollowUp(F::EnterImageCropEdit)
            } else {
                Handled
            }
        }
        A::CloseImageFillPopover => {
            state.editor_ui.image_fill_popover_open = false;
            Handled
        }
        A::SetImageFillMode(mode) => {
            let _ = state.set_selected_image_fill_mode(*mode);
            if *mode == op_editor_core::ImageFillMode::Crop {
                FollowUp(F::EnterImageCropEdit)
            } else {
                FollowUp(F::ExitImageCropEdit)
            }
        }
        A::SetImageAdjustment { field, value } => {
            *ctx.image_adjustment_drag = Some(*field);
            let _ = state.set_selected_image_adjustment(*field, *value);
            Handled
        }
        A::ResetImageAdjustments => {
            *ctx.image_adjustment_drag = None;
            let _ = state.reset_selected_image_adjustments();
            Handled
        }
        A::OpenSelectedIconPicker => {
            // Property-panel icon section → replace-selection picker.
            let ui = &mut state.editor_ui;
            ui.open_icon_picker(true);
            ui.close_fill_type_picker();
            ui.image_fill_popover_open = false;
            ui.close_font_picker();
            ui.font_weight_picker_open = false;
            ui.export_scale_picker_open = false;
            ui.export_format_picker_open = false;
            ui.close_color_variable_picker();
            Handled
        }
        A::SetTextAlign(value) => {
            layout_ops::set_selected_text_align(state, *value);
            Handled
        }
        A::SetTextVerticalAlign(value) => {
            layout_ops::set_selected_text_vertical_align(state, *value);
            Handled
        }
        A::SetTextGrowth(value) => {
            layout_ops::set_selected_text_growth(state, *value);
            Handled
        }
        A::ToggleFontFamilyPicker => {
            let opening = !state.editor_ui.font_picker.open;
            let ui = &mut state.editor_ui;
            ui.toggle_font_picker();
            ui.font_weight_picker_open = false;
            ui.close_fill_type_picker();
            ui.image_fill_popover_open = false;
            ui.export_scale_picker_open = false;
            ui.export_format_picker_open = false;
            ui.close_color_variable_picker();
            if opening {
                FollowUp(F::EnsureSystemFontsLoaded)
            } else {
                Handled
            }
        }
        A::SetFontFamilyIndex(index) => {
            if let Some(family) = font_picker_family_at(state, *index) {
                layout_ops::set_selected_text_font_family(state, &family);
            }
            state.editor_ui.close_font_picker();
            Handled
        }
        A::ImportFont => {
            // Raise a pending request; each host drains it (native pops
            // the file dialog + registers with FontStore, web opens the
            // hidden file input + persists to IndexedDB). Keep the
            // picker open so the new family appears once it lands.
            state.editor_ui.pending_font_import = true;
            Handled
        }
        A::RemoveImportedFont(index) => {
            // Resolve the family against the SAME entries list the
            // picker painted / hit-tested, then hand it to the host
            // drain to drop from the registry + store.
            if let Some(family) = font_picker_family_at(state, *index) {
                state.editor_ui.pending_font_remove = Some(family);
            }
            Handled
        }
        A::RelinkImage => {
            state.editor_ui.pending_file_action =
                Some(op_editor_core::editor_ui_state::FileAction::RelinkImage);
            Handled
        }
        A::AddVideo => {
            let _ = state.add_selected_video();
            Handled
        }
        A::RemoveVideo => {
            let _ = state.remove_selected_video();
            Handled
        }
        A::ToggleVideoAutoplay
        | A::ToggleVideoLoop
        | A::ToggleVideoMuted
        | A::ToggleVideoHoldLastFrame
        | A::ToggleVideoClickToReplay => {
            if let Some(field) = crate::widgets::property_panel_video::playback_field(action) {
                let current = state.selected_video().is_some_and(|video| match field {
                    op_editor_core::VideoPlaybackField::Autoplay => video.autoplay,
                    op_editor_core::VideoPlaybackField::Loop => video.r#loop,
                    op_editor_core::VideoPlaybackField::Muted => video.muted,
                    op_editor_core::VideoPlaybackField::HoldLastFrame => video.hold_last_frame,
                    op_editor_core::VideoPlaybackField::ClickToReplay => video.click_to_replay,
                });
                let _ = state.set_selected_video_playback(field, !current);
            }
            Handled
        }
        A::ToggleFontWeightPicker => {
            let ui = &mut state.editor_ui;
            ui.font_weight_picker_open = !ui.font_weight_picker_open;
            ui.font_weight_picker_hover = None;
            ui.close_font_picker();
            ui.close_fill_type_picker();
            ui.image_fill_popover_open = false;
            ui.export_scale_picker_open = false;
            ui.export_format_picker_open = false;
            ui.close_color_variable_picker();
            Handled
        }
        A::SetFontWeight(choice) => {
            layout_ops::set_selected_font_weight(state, choice.value());
            state.editor_ui.font_weight_picker_open = false;
            state.editor_ui.font_weight_picker_hover = None;
            Handled
        }
        A::TogglePaddingModePopover => {
            let ui = &mut state.editor_ui;
            ui.padding_mode_popover_open = !ui.padding_mode_popover_open;
            ui.padding_mode_popover_hover = None;
            ui.stroke_mode_popover_open = false;
            ui.stroke_mode_popover_hover = None;
            ui.font_weight_picker_open = false;
            ui.close_font_picker();
            ui.close_fill_type_picker();
            ui.image_fill_popover_open = false;
            ui.export_scale_picker_open = false;
            ui.export_format_picker_open = false;
            ui.close_color_variable_picker();
            Handled
        }
        A::SetPaddingMode(mode) => {
            // Scope the pin to the node it was set for so it can't leak
            // into the next selection.
            let anchor = state.selection.anchor.as_str().to_string();
            state.editor_ui.padding_edit_mode = Some(*mode);
            state.editor_ui.padding_edit_mode_anchor = anchor;
            state.editor_ui.padding_mode_popover_open = false;
            state.editor_ui.padding_mode_popover_hover = None;
            state.commit_history();
            let _ = state.set_selected_padding_mode_shape(*mode);
            Handled
        }
        A::ToggleStrokeModePopover => {
            let ui = &mut state.editor_ui;
            ui.stroke_mode_popover_open = !ui.stroke_mode_popover_open;
            ui.stroke_mode_popover_hover = None;
            ui.padding_mode_popover_open = false;
            ui.padding_mode_popover_hover = None;
            ui.font_weight_picker_open = false;
            ui.close_font_picker();
            ui.close_fill_type_picker();
            ui.image_fill_popover_open = false;
            ui.export_scale_picker_open = false;
            ui.export_format_picker_open = false;
            ui.close_color_variable_picker();
            Handled
        }
        A::SetStrokeMode(mode) => {
            let anchor = state.selection.anchor.as_str().to_string();
            state.editor_ui.stroke_edit_mode = Some(*mode);
            state.editor_ui.stroke_edit_mode_anchor = anchor;
            state.editor_ui.stroke_mode_popover_open = false;
            state.editor_ui.stroke_mode_popover_hover = None;
            state.commit_history();
            let _ = state.set_selected_stroke_mode_shape(*mode);
            Handled
        }
        A::OpenColorPicker(target) => {
            // Fallback anchor when called outside the press path.
            state.editor_ui.close_color_variable_picker();
            let _ = state.open_color_picker(color_target(*target), 0.0);
            Handled
        }
        A::OpenFillColorPicker(index) => {
            // Fallback anchor when called outside the press path.
            state.editor_ui.close_color_variable_picker();
            let _ = state.open_color_picker_for_fill(
                op_editor_core::ui_draft::ColorTarget::Fill,
                *index,
                0.0,
            );
            Handled
        }
        A::ToggleColorVariablePicker(target) => {
            let target = color_target(*target);
            let ui = &mut state.editor_ui;
            let reopening = ui.property_color_variable_picker_open != Some(target);
            // Each open starts at the top of the list, un-hovered.
            ui.close_color_variable_picker();
            if reopening {
                ui.property_color_variable_picker_open = Some(target);
            }
            ui.close_fill_type_picker();
            ui.image_fill_popover_open = false;
            ui.close_font_picker();
            ui.font_weight_picker_open = false;
            ui.export_scale_picker_open = false;
            ui.export_format_picker_open = false;
            Handled
        }
        A::BindColorVariable { target, index } => {
            if let Some(name) = color_variable_name_at(state, *index) {
                state.commit_history();
                let _ = state.bind_selected_color_variable(color_target(*target), &name);
            }
            state.editor_ui.close_color_variable_picker();
            Handled
        }
        A::UnbindColorVariable(target) => {
            state.commit_history();
            let _ = state.unbind_selected_color_variable(color_target(*target));
            state.editor_ui.close_color_variable_picker();
            Handled
        }
        A::ToggleExportScalePicker => {
            let ui = &mut state.editor_ui;
            ui.export_scale_picker_open = !ui.export_scale_picker_open;
            ui.export_format_picker_open = false;
            ui.close_font_picker();
            ui.font_weight_picker_open = false;
            ui.export_picker_hover = None;
            ui.close_color_variable_picker();
            Handled
        }
        A::ToggleExportFormatPicker => {
            let ui = &mut state.editor_ui;
            ui.export_format_picker_open = !ui.export_format_picker_open;
            ui.export_scale_picker_open = false;
            ui.close_font_picker();
            ui.font_weight_picker_open = false;
            ui.export_picker_hover = None;
            ui.close_color_variable_picker();
            Handled
        }
        A::SetExportScale(scale) => {
            let ui = &mut state.editor_ui;
            ui.export_scale = *scale;
            ui.export_scale_picker_open = false;
            ui.export_picker_hover = None;
            Handled
        }
        A::SetExportFormat(format) => {
            let ui = &mut state.editor_ui;
            if format.is_implemented() {
                ui.export_format = *format;
            }
            ui.export_format_picker_open = false;
            ui.export_picker_hover = None;
            Handled
        }
        A::ExportImageNow => {
            state.editor_ui.pending_file_action =
                Some(op_editor_core::editor_ui_state::FileAction::ExportImageConfirm);
            Handled
        }
        A::ToggleEffectAddPicker => {
            state.editor_ui.toggle_effect_add_picker();
            Handled
        }
        A::AddEffect(kind) => {
            use crate::widgets::property_panel_snapshot::EffectKind;
            match kind {
                EffectKind::Shadow => {
                    state.add_drop_shadow_to_selected();
                }
                EffectKind::LayerBlur => {
                    state.add_layer_blur_to_selected();
                }
                EffectKind::BackgroundBlur => {
                    state.add_background_blur_to_selected();
                }
            }
            state.editor_ui.close_effect_add_picker();
            Handled
        }
        A::SetEffectVisible(index, visible) => {
            let _ = state.set_selected_effect_visible(*index, *visible);
            Handled
        }
        A::RemoveEffect(index) => {
            let _ = state.remove_selected_effect(*index);
            Handled
        }
        A::AdjustEffectParam {
            effect,
            field,
            new_value,
        } => {
            let id = state.selection.anchor.clone();
            if id.is_real() {
                if ctx.effect_radius_drag.is_none() {
                    state.commit_history();
                }
                *ctx.effect_radius_drag = Some(*effect);
                let _ = state.apply(op_editor_core::EditorCommand::SetEffectParam {
                    node_id: id,
                    index: *effect as u32,
                    field: *field,
                    value: *new_value,
                });
            }
            Handled
        }
        // The seeding half is shared (`focus_effect_param`), but the
        // host has to commit any pending property / variable-row draft
        // first — those commits live host-side.
        A::FocusEffectParam { .. } => HostOwned,
        A::MatchImageAspectRatio => HostOwned,
        A::OpenEffectColorPicker(index) => {
            let _ = state.open_color_picker(
                op_editor_core::ui_draft::ColorTarget::EffectColor(*index),
                0.0,
            );
            Handled
        }
        A::ToggleWidgetChecked(new_value) => {
            state.commit_history();
            let _ = state.set_selected_widget_checked(*new_value);
            Handled
        }
        A::PickFillImage => {
            // Queue the file picker — each host drains this flag once
            // the event handler released the host borrow and writes the
            // chosen image into the selected node's primary fill.
            state.editor_ui.pending_file_action =
                Some(op_editor_core::editor_ui_state::FileAction::PickFillImage);
            Handled
        }
        A::ToggleInteractionMenu
        | A::SetInteractionNavigate { .. }
        | A::SetInteractionPop
        | A::RemoveInteraction
        | A::CopyTextContent
        | A::ToggleTextBold
        | A::ToggleTextItalic
        | A::ToggleTextUnderline
        | A::ToggleTextStrikethrough
        | A::ToggleNodeVisible
        | A::ToggleNodeLocked => apply_node_text_and_interaction_action(state, action),
        // Image Search / Generate popovers ride host-owned selection
        // drag + input-blur glue.
        A::ToggleImageSearchPopover
        | A::ToggleImageGeneratePopover
        | A::RunImageSearch
        | A::SelectImageSearchResult(_)
        | A::RunImageGenerate
        | A::ApplyGeneratedImage
        | A::RetryImageGenerate
        | A::OpenImageGenSettings => HostOwned,
        // Clipboard / download / bundle export are platform IO. Compact touch
        // layouts do not expose the Code panel, so direct action dispatch is
        // inert there as well as through paint / hit-testing.
        A::Codegen(_) if !state.editor_ui.code_property_tab_available() => Handled,
        A::Codegen(_) => HostOwned,
    }
}
