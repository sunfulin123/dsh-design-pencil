//! Editable-input rect walker for the property panel.
//!
//! Split from `property_panel_layout.rs` so the action-rect walker
//! and input-rect walker stay under the repository file-size cap.

use crate::widgets::property_panel::{EffectSummary, FillSummary, PropertyPanelAction};
use crate::widgets::property_panel_fill::{fill_head_rects, fill_row_body_height};
use crate::widgets::property_panel_inputs::{
    COLOR_VARIABLE_BUTTON_W, COLOR_VARIABLE_GAP, HEADER_HEIGHT, INPUT_HEIGHT, PAD_X, SECTION_GAP,
    SECTION_HEADER_HEIGHT, TAB_HEIGHT,
};
use crate::widgets::property_panel_layout::VisibleSections;
use crate::widgets::property_panel_stroke::stroke_side_input_rects;
use crate::{Point2D, Rect};
use op_editor_core::{FillType, PropertyFocus};

#[path = "property_panel_input_gradient.rs"]
mod gradient_inputs;
use gradient_inputs::push_gradient_stop_rects;

/// On-screen rects of every editable input. Same y walk as
/// `action_button_rects` so paint + hit-test stay aligned.
pub fn editable_input_rects(
    panel_rect: Rect,
    visible: VisibleSections,
    fills: &[FillSummary],
    effects: &[EffectSummary],
) -> Vec<(PropertyFocus, Rect)> {
    let x0 = panel_rect.origin.x;
    let w = panel_rect.size.x;
    let usable_w = w - PAD_X * 2.0;
    let half_w = (usable_w - 8.0) / 2.0;

    let mut y = panel_rect.origin.y;
    y += TAB_HEIGHT;
    let header_name_rect = Rect {
        origin: Point2D::new(x0 + PAD_X, y + 3.0),
        size: Point2D::new((usable_w - 116.0).max(40.0), INPUT_HEIGHT),
    };
    let mut rects = vec![(PropertyFocus::NodeName, header_name_rect)];
    y += HEADER_HEIGHT;
    if visible.create_component {
        rects.push((
            PropertyFocus::ComponentDescription,
            crate::widgets::property_panel_instance::component_description_rect(
                x0,
                y,
                w,
                visible.component_button,
            ),
        ));
        // Variant-aware: the instance pair adds a second button row.
        y += crate::widgets::property_panel_inputs::create_component_block_height(
            visible.component_button,
        );
    }
    y += SECTION_HEADER_HEIGHT;
    y += crate::widgets::align_toolbar::POSITION_ACTION_HEIGHT;
    if visible.position_advanced {
        let x_rect = Rect {
            origin: Point2D::new(x0 + PAD_X, y),
            size: Point2D::new(half_w, INPUT_HEIGHT),
        };
        let y_rect = Rect {
            origin: Point2D::new(x0 + PAD_X + half_w + 8.0, y),
            size: Point2D::new(half_w, INPUT_HEIGHT),
        };
        y += INPUT_HEIGHT + 6.0;
        rects.extend([
            (PropertyFocus::PositionX, x_rect),
            (PropertyFocus::PositionY, y_rect),
        ]);
    }
    let rotation_rect = Rect {
        origin: Point2D::new(x0 + PAD_X, y),
        size: Point2D::new(half_w, INPUT_HEIGHT),
    };
    let per_corner_expanded =
        visible.corner_radius && visible.corner_per_corner && visible.corner_expand;
    let radius_rect =
        (visible.corner_radius && !per_corner_expanded).then_some(if visible.corner_per_corner {
            crate::widgets::property_panel_corner::uniform_and_toggle_rects(x0, y, w).0
        } else {
            Rect {
                origin: Point2D::new(x0 + PAD_X + half_w + 8.0, y),
                size: Point2D::new(half_w, INPUT_HEIGHT),
            }
        });
    if visible.position_advanced {
        rects.push((PropertyFocus::Rotation, rotation_rect));
    }
    if visible.position_advanced || visible.corner_radius {
        y += INPUT_HEIGHT;
    }
    if let Some(radius_rect) = radius_rect {
        rects.push((PropertyFocus::PositionR, radius_rect));
    }
    if per_corner_expanded {
        rects.extend(crate::widgets::property_panel_corner::input_rects(x0, y, w));
        y += crate::widgets::property_panel_corner::CORNER_GRID_EXTRA_HEIGHT;
    }
    y += 12.0;
    y += SECTION_GAP;
    if visible.flex_layout {
        crate::widgets::property_panel_flex::push_flex_input_rects(
            &mut rects,
            x0,
            y,
            w,
            visible.flex_layout_mode,
            visible.layout_justify,
            visible.padding_edit_mode,
            visible.touch_controls,
        );
        y += crate::widgets::property_panel_flex::flex_section_height(
            visible.flex_layout_mode,
            visible.padding_edit_mode,
            visible.touch_controls,
        );
    }
    if visible.size_options {
        y += SECTION_HEADER_HEIGHT;
        rects.push((
            PropertyFocus::SizeW,
            Rect {
                origin: Point2D::new(x0 + PAD_X, y),
                size: Point2D::new(half_w, INPUT_HEIGHT),
            },
        ));
        rects.push((
            PropertyFocus::SizeH,
            Rect {
                origin: Point2D::new(x0 + PAD_X + half_w + 8.0, y),
                size: Point2D::new(half_w, INPUT_HEIGHT),
            },
        ));
        y += INPUT_HEIGHT + 10.0;
        let check_h =
            crate::widgets::property_panel_inputs::size_check_row_height(visible.touch_controls);
        y += check_h * if visible.clip_content { 3.0 } else { 2.0 };
        y += 12.0;
        y += SECTION_GAP;
    }
    if visible.icon {
        y += crate::widgets::property_panel_icon::icon_section_height();
    }
    if visible.text {
        crate::widgets::property_panel_text::push_text_input_rects(
            &mut rects,
            x0,
            y,
            usable_w,
            visible.touch_controls,
            visible.text_advanced,
        );
        y += crate::widgets::property_panel_text::text_section_height(
            visible.touch_controls,
            visible.text_advanced,
        );
        y += SECTION_GAP;
    }
    if let Some(kind) = visible.widget {
        crate::widgets::property_panel_widget::push_widget_input_rects(
            &mut rects, kind, x0, y, usable_w,
        );
        y += crate::widgets::property_panel_widget::widget_section_height(kind);
        y += SECTION_GAP;
    }
    if visible.image {
        y += crate::widgets::property_panel_image_node::image_section_height_with_video(
            visible.image_warning,
            visible.video,
        );
        y += SECTION_GAP;
    }
    if visible.video {
        crate::widgets::property_panel_video::push_video_input_rects(&mut rects, x0, y, w);
        y += crate::widgets::property_panel_video::video_section_height();
    }
    if visible.opacity {
        y += SECTION_HEADER_HEIGHT;
        rects.push((
            PropertyFocus::Opacity,
            Rect {
                origin: Point2D::new(x0 + PAD_X, y),
                size: Point2D::new(
                    crate::widgets::property_panel_layer::opacity_input_width(
                        w,
                        visible.polygon_sides,
                        visible.touch_controls,
                    ),
                    INPUT_HEIGHT,
                ),
            },
        ));
        if visible.polygon_sides {
            rects.push((
                PropertyFocus::PolygonSides,
                Rect {
                    origin: Point2D::new(x0 + PAD_X + half_w + 8.0, y),
                    size: Point2D::new(half_w, INPUT_HEIGHT),
                },
            ));
        }
        y += INPUT_HEIGHT;
        if visible.ellipse_arc {
            y += 6.0;
            let col_w = (usable_w - 12.0) / 3.0;
            let focuses = [
                PropertyFocus::EllipseStart,
                PropertyFocus::EllipseSweep,
                PropertyFocus::EllipseInnerRadius,
            ];
            for (i, focus) in focuses.into_iter().enumerate() {
                rects.push((
                    focus,
                    Rect {
                        origin: Point2D::new(x0 + PAD_X + i as f32 * (col_w + 6.0), y),
                        size: Point2D::new(col_w, INPUT_HEIGHT),
                    },
                ));
            }
            y += INPUT_HEIGHT;
        }
        if visible.compositing {
            y += crate::widgets::property_panel_compositing::COMPOSITING_ROW_HEIGHT;
        }
        y += 12.0;
        y += SECTION_GAP;
    }
    if visible.fill {
        y += SECTION_HEADER_HEIGHT;
        let primary_stop_count = visible.gradient_stop_count;
        for (fi, fill) in fills.iter().enumerate() {
            let is_primary = fi == 0;
            let fill_type = fill.fill_type;
            // Head row: per-fill opacity input (the `%` box).
            rects.push((
                PropertyFocus::FillOpacity(fi),
                fill_head_rects(x0, y, w, visible.touch_controls).opacity,
            ));
            y += INPUT_HEIGHT + 6.0;
            match fill_type {
                FillType::Solid => {
                    let show_var = is_primary
                        && (visible.color_variable_count > 0 || visible.fill_variable_bound);
                    let variable_w = if show_var {
                        COLOR_VARIABLE_BUTTON_W + COLOR_VARIABLE_GAP
                    } else {
                        0.0
                    };
                    // A variable-bound primary fill paints a `$name` chip,
                    // not an editable hex input.
                    if !(is_primary && visible.fill_variable_bound) {
                        rects.push((
                            PropertyFocus::FillHex(fi),
                            Rect {
                                origin: Point2D::new(x0 + PAD_X, y),
                                size: Point2D::new(usable_w - variable_w, INPUT_HEIGHT),
                            },
                        ));
                    }
                }
                // Gradient / image bodies only paint editable inputs for
                // the primary fill (they key off `fills[0]`).
                FillType::LinearGradient if is_primary => {
                    rects.push((
                        PropertyFocus::GradientAngle,
                        Rect {
                            origin: Point2D::new(x0 + PAD_X, y),
                            size: Point2D::new(usable_w, INPUT_HEIGHT),
                        },
                    ));
                    let mut stop_y = y + INPUT_HEIGHT + 6.0 + SECTION_HEADER_HEIGHT;
                    push_gradient_stop_rects(
                        &mut rects,
                        x0,
                        &mut stop_y,
                        usable_w,
                        visible.gradient_stop_count,
                    );
                }
                FillType::RadialGradient if is_primary => {
                    let mut stop_y = y + SECTION_HEADER_HEIGHT;
                    push_gradient_stop_rects(
                        &mut rects,
                        x0,
                        &mut stop_y,
                        usable_w,
                        visible.gradient_stop_count,
                    );
                }
                // Mesh has no editable inputs (per-vertex editing deferred).
                FillType::LinearGradient
                | FillType::RadialGradient
                | FillType::MeshGradient
                | FillType::Shader
                | FillType::Image => {}
            }
            y += fill_row_body_height(fill_type, is_primary, primary_stop_count);
        }
        y += 12.0;
        y += SECTION_GAP;
    }
    if visible.stroke {
        y += SECTION_HEADER_HEIGHT;
        let show_var = visible.color_variable_count > 0 || visible.stroke_variable_bound;
        let variable_w = if show_var {
            COLOR_VARIABLE_BUTTON_W + COLOR_VARIABLE_GAP
        } else {
            0.0
        };
        // Inline width only in Single mode (Axis/Individual use the per-side
        // grid); must match paint_stroke_main_row so the hit rects don't
        // linger where the width is no longer painted.
        let inline = visible.stroke_edit_mode == op_editor_core::PaddingEditMode::Single;
        let stroke_width_w = if inline { 60.0 } else { 0.0 };
        let stroke_width_gap = if inline { 8.0 } else { 0.0 };
        let stroke_hex_w = usable_w - stroke_width_w - stroke_width_gap - variable_w;
        if !visible.stroke_variable_bound {
            rects.push((
                PropertyFocus::StrokeHex,
                Rect {
                    origin: Point2D::new(x0 + PAD_X, y),
                    size: Point2D::new(stroke_hex_w, INPUT_HEIGHT),
                },
            ));
        }
        if inline {
            rects.push((
                PropertyFocus::StrokeWidth,
                Rect {
                    origin: Point2D::new(x0 + PAD_X + stroke_hex_w + variable_w + 8.0, y),
                    size: Point2D::new(stroke_width_w, INPUT_HEIGHT),
                },
            ));
        }
        rects.extend(stroke_side_input_rects(x0, y, w, visible.stroke_edit_mode));
        y += crate::widgets::property_panel_stroke::stroke_section_body_height(
            visible.stroke_edit_mode,
        );
        y += SECTION_GAP;
    }
    if visible.effects {
        y += SECTION_HEADER_HEIGHT;
        for (index, _) in effects.iter().enumerate() {
            let row = crate::widgets::property_panel_effects::effect_row_rects(
                x0,
                y,
                w,
                visible.touch_controls,
            );
            rects.push((PropertyFocus::EffectRadius(index), row.value));
            y += crate::widgets::property_panel_effects::EFFECT_ROW_HEIGHT
                + crate::widgets::property_panel_effects::EFFECT_ROW_GAP;
        }
        if effects.is_empty() {
            y += 8.0;
        }
        y += SECTION_GAP;
    }
    if visible.interactions {
        let dummy = crate::widgets::property_panel_interactions::InteractionSummary {
            screen: visible.has_screen.then(String::new),
            on_tap: Vec::new(),
        };
        crate::widgets::property_panel_interactions::push_interaction_input_rects(
            &mut rects, &dummy, x0, y, w,
        );
    }
    rects
}

#[path = "property_panel_fill_actions.rs"]
mod fill_actions;
pub(crate) use fill_actions::push_fill_action_rects;
