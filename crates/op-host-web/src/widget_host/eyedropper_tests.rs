use super::WidgetHost;
use op_editor_core::ui_draft::ColorTarget;
use op_editor_core::{EditorCommand, NodeId};
use op_editor_ui::Point2D;

fn host() -> WidgetHost {
    let mut host = WidgetHost::new();
    host.editor_state.doc.children = vec![serde_json::from_str(
        r##"{"type":"rectangle","id":"target","width":120,"height":80,"fill":[{"type":"solid","color":"#ff000080"}]}"##,
    )
    .unwrap()];
    host.editor_state.selection.set = vec![NodeId::new("target")];
    host.editor_state.selection.anchor = NodeId::new("target");
    host.editor_state
        .open_color_picker(ColorTarget::Fill, 120.0);
    host
}

fn patch(color: [u8; 4]) -> Vec<u8> {
    color.repeat(81)
}

#[test]
fn rendered_eyedropper_applies_only_on_confirmation_and_preserves_alpha_in_one_undo() {
    let mut host = host();
    let original = host.editor_state.doc.clone();
    assert!(host.start_eyedropper());
    host.complete_eyedropper_patch(patch([34, 197, 94, 255]))
        .unwrap();
    assert_eq!(host.editor_state.doc, original);
    assert!(!host.editor_state.history.can_undo());
    host.eyedropper.as_mut().unwrap().confirm = true;
    host.complete_eyedropper_patch(patch([34, 197, 94, 255]))
        .unwrap();
    let node = serde_json::to_value(host.editor_state.selected_node().unwrap()).unwrap();
    assert_eq!(node["fill"][0]["color"], "#22c55e80");
    assert!(host.editor_state.ui.color_picker.is_none());
    assert!(host.eyedropper.is_none());
    assert!(host.editor_state.apply(EditorCommand::Undo));
    assert_eq!(host.editor_state.doc, original);
    assert!(!host.editor_state.history.can_undo());
}

#[test]
fn eyedropper_cancellation_and_stale_target_never_apply_a_sample() {
    let mut host = host();
    let original = host.editor_state.doc.clone();
    host.start_eyedropper();
    assert!(host.eyedropper_key("Escape", false));
    assert!(host.eyedropper.is_none());
    assert_eq!(host.editor_state.doc, original);
    assert!(host.editor_state.ui.color_picker.is_some());
    host.start_eyedropper();
    host.editor_state.selection.anchor = NodeId::new("missing");
    assert!(host
        .complete_eyedropper_patch(patch([0, 0, 0, 255]))
        .is_err());
    assert_eq!(host.editor_state.doc, original);
    assert!(!host.editor_state.history.can_undo());
}

#[test]
fn eyedropper_maps_css_pointer_to_document_and_rejects_malformed_pixels() {
    let mut host = host();
    host.editor_state
        .apply(EditorCommand::SetUiScale { percent: 150 });
    host.editor_state.viewport.pan_x = 20.5;
    host.editor_state.viewport.pan_y = -10.25;
    host.editor_state.viewport.zoom = 1.25;
    host.start_eyedropper();
    host.eyedropper.as_mut().unwrap().point = Point2D::new(505.5, 174.75);
    assert_eq!(
        host.eyedropper_sample_point(1440.0, 900.0).unwrap(),
        Some((100.0, 100.0))
    );
    assert!(host.complete_eyedropper_patch(vec![0; 4]).is_err());
    assert!(!host.editor_state.history.can_undo());
}

#[test]
fn eyedropper_button_and_pointer_capture_use_the_scaled_painted_geometry() {
    use op_editor_ui::widgets::color_picker::{ColorPicker, ColorPickerHit};
    let mut host = host();
    host.editor_state
        .apply(EditorCommand::SetUiScale { percent: 150 });
    let picker = ColorPicker::for_state(
        &host.editor_state,
        host.editor_state.ui.color_picker.clone().unwrap(),
    );
    let rect = picker.rect(1440.0 / 1.5, 900.0 / 1.5);
    let point = (0..rect.size.y as u32)
        .find_map(|y| {
            (0..rect.size.x as u32).find_map(|x| {
                let point = rect.origin + Point2D::new(x as f32 + 0.5, y as f32 + 0.5);
                (picker.hit_test(rect, point) == Some(ColorPickerHit::Eyedropper)).then_some(point)
            })
        })
        .unwrap();
    host.apply_press(point.x * 1.5, point.y * 1.5, 1440.0, 900.0);
    host.apply_release_with_viewport(1440.0, 900.0);
    assert!(host.eyedropper_active());
    host.apply_cursor_move(500.0, 200.0);
    assert_eq!(
        host.eyedropper.as_ref().unwrap().point,
        Point2D::new(500.0, 200.0)
    );
    host.apply_press(500.0, 200.0, 1440.0, 900.0);
    assert!(host.eyedropper.as_ref().unwrap().confirm);
    assert!(!host.editor_state.history.can_undo());
}

#[test]
fn eyedropper_rejects_newly_locked_targets_and_same_color_does_not_add_undo() {
    let mut host = host();
    host.start_eyedropper();
    host.editor_state.toggle_node_locked(&NodeId::new("target"));
    let locked = host.editor_state.doc.clone();
    assert!(host
        .complete_eyedropper_patch(patch([0, 0, 0, 255]))
        .is_err());
    assert_eq!(host.editor_state.doc, locked);
    host.editor_state.toggle_node_locked(&NodeId::new("target"));
    host.eyedropper_key("Escape", false);
    host.start_eyedropper();
    host.eyedropper_key("Enter", false);
    host.complete_eyedropper_patch(patch([255, 0, 0, 255]))
        .unwrap();
    assert!(!host.editor_state.history.can_undo());
}

#[test]
fn eyedropper_opens_from_the_inspector_fill_swatch() {
    use op_editor_ui::widgets::color_picker::{ColorPicker, ColorPickerHit};
    use op_editor_ui::widgets::property_panel::{PropertyPanel, PropertyPanelAction};
    let mut host = host();
    host.editor_state.close_color_picker();
    host.editor_state
        .apply(EditorCommand::SetUiScale { percent: 125 });
    host.editor_state.editor_ui.property_panel_scroll.offset = 320.0;
    let rect = op_editor_ui::widgets::host_canvas_geometry::property_panel_rect(
        &host.editor_state,
        1440.0 / 1.25,
        900.0 / 1.25,
    );
    let panel = PropertyPanel::for_selection(&host.editor_state).unwrap();
    let x = rect.origin.x + 20.0;
    let y = (rect.origin.y as u32..720)
        .find(|y| {
            panel.hit_test_action(rect, Point2D::new(x, *y as f32))
                == Some(PropertyPanelAction::OpenColorPicker(ColorTarget::Fill))
        })
        .expect("fill swatch is reachable") as f32
        + 5.0;
    host.apply_press(x * 1.25, y * 1.25, 1440.0, 900.0);
    host.apply_release_with_viewport(1440.0, 900.0);
    let picker = ColorPicker::for_state(
        &host.editor_state,
        host.editor_state.ui.color_picker.clone().unwrap(),
    );
    let rect = picker.rect(1440.0 / 1.25, 900.0 / 1.25);
    let point = rect.origin + Point2D::new(18.0, 198.0);
    assert_eq!(
        picker.hit_test(rect, point),
        Some(ColorPickerHit::Eyedropper)
    );
    host.apply_press(point.x * 1.25, point.y * 1.25, 1440.0, 900.0);
    host.apply_release_with_viewport(1440.0, 900.0);
    assert!(host.eyedropper_active());
}

#[test]
fn eyedropper_groups_indexed_fill_gradient_effect_and_variable_targets() {
    use jian_ops_schema::variable::{VariableKind, VariableScalar};
    for kind in ["indexed-fill", "stroke", "gradient", "effect", "variable"] {
        let mut host = host();
        host.editor_state.close_color_picker();
        match kind {
            "indexed-fill" => {
                host.editor_state.doc.children[0] = serde_json::from_str(
                    r##"{"type":"rectangle","id":"target","width":120,"height":80,"fill":[{"type":"solid","color":"#000000"},{"type":"solid","color":"#ff000080"}]}"##,
                ).unwrap();
                assert!(host
                    .editor_state
                    .open_color_picker_for_fill(ColorTarget::Fill, 1, 120.0));
            }
            "gradient" => {
                assert!(host
                    .editor_state
                    .set_selected_fill_type(op_editor_core::FillType::LinearGradient));
                assert!(host
                    .editor_state
                    .open_color_picker(ColorTarget::GradientStop(0), 120.0));
            }
            "stroke" => {
                assert!(host.editor_state.set_selected_color(false, "#ff000080"));
                assert!(host
                    .editor_state
                    .open_color_picker(ColorTarget::Stroke, 120.0));
            }
            "effect" => {
                assert!(host.editor_state.add_drop_shadow_to_selected());
                assert!(host
                    .editor_state
                    .open_color_picker(ColorTarget::EffectColor(0), 120.0));
            }
            "variable" => {
                assert!(host.editor_state.create_variable(
                    "brand",
                    VariableKind::Color,
                    VariableScalar::Str("#ff000080".into())
                ));
                assert!(host
                    .editor_state
                    .open_color_picker_for_variable("brand", 120.0));
            }
            _ => unreachable!(),
        }
        let original = host.editor_state.doc.clone();
        let depth = host.editor_state.history.past.len();
        assert!(host.start_eyedropper(), "{kind}");
        assert!(host.eyedropper_key("Enter", false));
        host.complete_eyedropper_patch(patch([34, 197, 94, 255]))
            .unwrap();
        assert_ne!(
            host.editor_state.doc, original,
            "{kind} must update its target"
        );
        if matches!(kind, "indexed-fill" | "stroke" | "variable") {
            assert!(
                serde_json::to_string(&host.editor_state.doc)
                    .unwrap()
                    .contains("#22c55e80"),
                "{kind} must preserve authored alpha"
            );
        }
        assert_eq!(
            host.editor_state.history.past.len(),
            depth + 1,
            "{kind} needs one undo entry"
        );
        assert!(host.editor_state.apply(EditorCommand::Undo));
        assert_eq!(host.editor_state.doc, original, "{kind}");
        assert_eq!(host.editor_state.history.past.len(), depth, "{kind}");
        assert!(host.editor_state.apply(EditorCommand::Redo));
        assert_ne!(host.editor_state.doc, original, "{kind}");
    }
}
