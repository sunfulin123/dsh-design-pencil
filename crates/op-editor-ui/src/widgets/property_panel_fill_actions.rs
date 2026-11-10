//! Fill action hit geometry.
use super::*;

/// Push the Fill section's action rects (header "+", per-fill type
/// dropdown / × / colour-swatch + gradient-stop /
/// image-popover affordances) starting at `*y`'s row, returning the y
/// just past the section's trailing 12 px gap (the caller adds the
/// `SECTION_GAP`). Split out of `action_button_rects_with_fill_picker`
/// for the 800-line cap; the y-walk mirrors `paint_one_fill`.
pub(crate) fn push_fill_action_rects(
    out: &mut Vec<(PropertyPanelAction, Rect)>,
    panel_rect: Rect,
    visible: VisibleSections,
    fills: &[FillSummary],
    mut y: f32,
) -> f32 {
    let x0 = panel_rect.origin.x;
    let w = panel_rect.size.x;
    let usable_w = w - PAD_X * 2.0;
    // Header "+" appends a fill (TS-style stacked list).
    out.push((
        PropertyPanelAction::AddFill,
        crate::widgets::property_panel_inputs::section_add_target(x0, y, w, visible.touch_controls),
    ));
    if visible.path_fill_rule.is_some() {
        for (rule, rect) in crate::widgets::property_panel_fill::fill_rule_segment_rects(x0, y, w) {
            out.push((PropertyPanelAction::SetFillRule(rule), rect));
        }
    }
    y += SECTION_HEADER_HEIGHT;
    let primary_stop_count = visible.gradient_stop_count;
    // One row per fill — mirror `paint_one_fill`'s y-walk.
    for (fi, fill) in fills.iter().enumerate() {
        let is_primary = fi == 0;
        let fill_type = fill.fill_type;
        // Head row: type dropdown + opacity + adjacent reorder / remove controls.
        let head = fill_head_rects(x0, y, w, visible.touch_controls);
        let dropdown_rect = head.dropdown;
        out.push((PropertyPanelAction::ToggleFillTypePicker(fi), dropdown_rect));
        if fi > 0 {
            out.push((
                PropertyPanelAction::MoveFill {
                    from: fi,
                    to: fi - 1,
                },
                head.move_up,
            ));
        }
        if fi + 1 < fills.len() {
            out.push((
                PropertyPanelAction::MoveFill {
                    from: fi,
                    to: fi + 1,
                },
                head.move_down,
            ));
        }
        out.push((PropertyPanelAction::RemoveFill(fi), head.remove));
        y += INPUT_HEIGHT + 6.0; // head row
                                 // Body action rects, keyed off this fill's type.
        match fill_type {
            FillType::Solid => {
                // Solid body: leading swatch opens the colour picker
                // (the hex-input focus hit-test runs after this, so a
                // swatch click opens the picker instead of focusing).
                if is_primary {
                    let show_var = visible.color_variable_count > 0 || visible.fill_variable_bound;
                    let variable_w = if show_var {
                        COLOR_VARIABLE_BUTTON_W + COLOR_VARIABLE_GAP
                    } else {
                        0.0
                    };
                    let hex_w = usable_w - variable_w;
                    if !visible.fill_variable_bound {
                        out.push((
                            PropertyPanelAction::OpenColorPicker(op_editor_core::ColorTarget::Fill),
                            Rect {
                                origin: Point2D::new(x0 + PAD_X, y),
                                size: Point2D::new(
                                    crate::widgets::property_panel_inputs::color_swatch_action_width(
                                        visible.touch_controls,
                                    ),
                                    INPUT_HEIGHT,
                                ),
                            },
                        ));
                    }
                    if show_var {
                        let var_rect = Rect {
                            origin: Point2D::new(x0 + PAD_X + hex_w + COLOR_VARIABLE_GAP, y),
                            size: Point2D::new(COLOR_VARIABLE_BUTTON_W, INPUT_HEIGHT),
                        };
                        out.push((
                            PropertyPanelAction::ToggleColorVariablePicker(
                                op_editor_core::ColorTarget::Fill,
                            ),
                            var_rect,
                        ));
                    }
                } else {
                    // Non-primary solid: swatch opens a picker bound to
                    // THIS fill (no colour-variable button — the variable
                    // subsystem keys off the primary fill).
                    out.push((
                        PropertyPanelAction::OpenFillColorPicker(fi),
                        Rect {
                            origin: Point2D::new(x0 + PAD_X, y),
                            size: Point2D::new(
                                crate::widgets::property_panel_inputs::color_swatch_action_width(
                                    visible.touch_controls,
                                ),
                                INPUT_HEIGHT,
                            ),
                        },
                    ));
                }
            }
            // Gradient / image bodies key off the primary fill, so only
            // the primary fill emits their action rects (the non-primary
            // head row's dropdown is enough to retype it).
            FillType::Image if is_primary => {
                out.push((
                    PropertyPanelAction::ToggleImageFillPopover,
                    Rect {
                        origin: Point2D::new(x0 + PAD_X, y),
                        size: Point2D::new(usable_w, INPUT_HEIGHT),
                    },
                ));
            }
            FillType::LinearGradient | FillType::RadialGradient if is_primary => {
                let mut stop_y = y;
                if fill_type == FillType::LinearGradient {
                    stop_y += INPUT_HEIGHT + 6.0; // Angle row above the stops header.
                }
                out.push((
                    PropertyPanelAction::AddGradientStop,
                    crate::widgets::property_panel_inputs::section_add_target(
                        x0,
                        stop_y,
                        w,
                        visible.touch_controls,
                    ),
                ));
                stop_y += SECTION_HEADER_HEIGHT; // 色标 header
                for index in 0..visible.gradient_stop_count {
                    out.push((
                        PropertyPanelAction::OpenColorPicker(
                            op_editor_core::ColorTarget::GradientStop(index),
                        ),
                        Rect {
                            origin: Point2D::new(x0 + PAD_X, stop_y),
                            size: Point2D::new(
                                crate::widgets::property_panel_inputs::color_swatch_action_width(
                                    visible.touch_controls,
                                ),
                                INPUT_HEIGHT,
                            ),
                        },
                    ));
                    if visible.gradient_stop_count > 2 {
                        out.push((
                            PropertyPanelAction::RemoveGradientStop(index),
                            Rect {
                                origin: Point2D::new(x0 + w - PAD_X - 22.0, stop_y),
                                size: Point2D::new(28.0, INPUT_HEIGHT),
                            },
                        ));
                    }
                    stop_y += INPUT_HEIGHT + 4.0;
                }
            }
            // Mesh emits no body action rects (per-vertex editing deferred).
            FillType::LinearGradient
            | FillType::RadialGradient
            | FillType::MeshGradient
            | FillType::Shader
            | FillType::Image => {}
        }
        let blend_y = y + crate::widgets::property_panel_fill::fill_content_body_height(
            fill_type,
            is_primary,
            primary_stop_count,
        );
        out.push((
            PropertyPanelAction::ToggleCompositingPicker(
                crate::widgets::property_panel_action::CompositingTarget::FillBlend(fi),
            ),
            crate::widgets::property_panel_compositing::fill_trigger_rect(x0, blend_y, w),
        ));
        y += fill_row_body_height(fill_type, is_primary, primary_stop_count);
    }
    y + 12.0 // trailing gap before the divider
}
