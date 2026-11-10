//! Effects section geometry shared by layout walkers.
use super::{EffectSummary, EFFECT_ROW_GAP, EFFECT_ROW_HEIGHT, SECTION_HEADER_HEIGHT};

/// Total vertical space the Effects section consumes: the section
/// header plus one block per effect (or an 8 px filler when the node
/// has none). Paint (`paint_effects_section`) and the action-rect
/// walker both consult this so their y-math can never drift.
pub fn effects_section_height(effects: &[EffectSummary]) -> f32 {
    SECTION_HEADER_HEIGHT
        + if effects.is_empty() {
            8.0
        } else {
            effects.len() as f32 * (EFFECT_ROW_HEIGHT + EFFECT_ROW_GAP)
        }
}
