//! Fill section sizing shared by the panel geometry walkers.
use super::*;

/// Total vertical space the Fill section consumes: the section header
/// plus one row per fill (head row + body), plus the 12 px trailing
/// gap painted before the divider. `primary_stop_count` sizes the
/// primary fill's gradient body (the gradient-stop editor keys off the
/// primary fill). Mirrors the y-walk in `paint_fill_section`.
pub fn fills_section_height(fills: &[FillSummary], primary_stop_count: usize) -> f32 {
    let rows: f32 = fills
        .iter()
        .enumerate()
        .map(|(i, f)| fill_row_height(f.fill_type, i == 0, primary_stop_count))
        .sum();
    SECTION_HEADER_HEIGHT + rows + 12.0
}

/// Height of the body that follows the head row in the Fill
/// section, per fill type. Used by every layout walker so the
/// y-offset of sections after Fill stays aligned with paint when
/// the user flips fill types.
pub fn fill_body_height(fill_type: FillType) -> f32 {
    // Legacy 2-stop assumption — kept for callers that don't yet
    // thread `stop_count`. Prefer `fill_body_height_with_stops`.
    fill_body_height_with_stops(fill_type, 2)
}

/// Stop-aware variant — accounts for the actual number of gradient
/// stops so adding / removing a stop reflows the panel correctly.
pub fn fill_body_height_with_stops(fill_type: FillType, stop_count: usize) -> f32 {
    let stops = stop_count;
    let stops_block = SECTION_HEADER_HEIGHT
        + stops as f32 * (INPUT_HEIGHT + 4.0)
        + if stops == 0 { 0.0 } else { 2.0 };
    match fill_type {
        FillType::Solid => INPUT_HEIGHT + 6.0,
        FillType::LinearGradient => INPUT_HEIGHT + 6.0 + stops_block + 6.0,
        FillType::RadialGradient => stops_block + 6.0,
        // Mesh + Shader show head-row only (per-vertex editing / shader
        // authoring deferred — shader is render-only in v1) — no body
        // block, so they contribute nothing past the head row.
        FillType::MeshGradient | FillType::Shader => 0.0,
        FillType::Image => INPUT_HEIGHT + 6.0,
    }
}
