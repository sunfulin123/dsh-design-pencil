//! Location of the text section for its floating controls.
use super::*;

pub(crate) fn text_section_top(panel_rect: Rect, visible: VisibleSections) -> Option<f32> {
    if !visible.text {
        return None;
    }
    Some(sections_top_before_text(panel_rect, visible))
}

pub(crate) fn sections_top_before_text(panel_rect: Rect, visible: VisibleSections) -> f32 {
    use crate::widgets::property_panel_inputs::{INPUT_HEIGHT, SECTION_GAP, SECTION_HEADER_HEIGHT};
    let mut y = panel_rect.origin.y;
    y += crate::widgets::property_panel_inputs::TAB_HEIGHT;
    y += crate::widgets::property_panel_inputs::HEADER_HEIGHT;
    if visible.create_component {
        y += crate::widgets::property_panel_inputs::CREATE_COMPONENT_BLOCK_H;
    }
    y += SECTION_HEADER_HEIGHT;
    y += crate::widgets::align_toolbar::POSITION_ACTION_HEIGHT;
    if visible.position_advanced {
        y += INPUT_HEIGHT + 6.0;
    }
    if visible.position_advanced || visible.corner_radius {
        y += INPUT_HEIGHT;
    }
    if visible.corner_radius && visible.corner_per_corner && visible.corner_expand {
        y += crate::widgets::property_panel_corner::CORNER_GRID_EXTRA_HEIGHT;
    }
    y += 12.0;
    y += SECTION_GAP;
    if visible.flex_layout {
        y += crate::widgets::property_panel_flex::flex_section_height(
            visible.flex_layout_mode,
            visible.padding_edit_mode,
            visible.touch_controls,
        );
    }
    if visible.size_options {
        y += SECTION_HEADER_HEIGHT;
        y += INPUT_HEIGHT + 10.0;
        y += crate::widgets::property_panel_inputs::size_check_row_height(visible.touch_controls)
            * if visible.clip_content { 3.0 } else { 2.0 };
        y += 12.0 + SECTION_GAP;
    }
    if visible.icon {
        y += crate::widgets::property_panel_icon::icon_section_height();
    }
    y
}
