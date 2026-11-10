//! Font-weight picker action geometry.
use super::{text_layout_block_height, CONTENT_ROW_GAP, FAMILY_ROW_GAP};
use crate::widgets::property_panel::{FontWeightChoice, PropertyPanelAction};
use crate::widgets::property_panel_inputs::{INPUT_HEIGHT, PAD_X, SECTION_HEADER_HEIGHT};
use crate::{Point2D, Rect};

/// Dropdown rows for the weight picker — opens below the left-half
/// weight trigger of the weight/size row.
pub fn font_weight_picker_action_rects(
    x0: f32,
    y: f32,
    usable_w: f32,
    touch_controls: bool,
) -> Vec<(PropertyPanelAction, Rect)> {
    // Full-width rows so the "number + name" labels (e.g. "800 Extra
    // Bold") fit; the trigger sits on the left half but a dropdown may
    // be wider than its trigger.
    let weight_y = y
        + text_layout_block_height(touch_controls)
        + SECTION_HEADER_HEIGHT
        + INPUT_HEIGHT
        + CONTENT_ROW_GAP
        + INPUT_HEIGHT
        + FAMILY_ROW_GAP
        + INPUT_HEIGHT
        + 4.0;
    FontWeightChoice::ALL
        .into_iter()
        .enumerate()
        .map(|(i, choice)| {
            (
                PropertyPanelAction::SetFontWeight(choice),
                Rect {
                    origin: Point2D::new(x0 + PAD_X, weight_y + i as f32 * 28.0),
                    size: Point2D::new(usable_w, 28.0),
                },
            )
        })
        .collect()
}
