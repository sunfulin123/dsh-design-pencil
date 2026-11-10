//! Fill-type selection and its overlay.
use super::*;

/// Display label for a fill-type variant (Solid / Gradient /
/// Image), localised against `locale` via the `fill.*` keys.
pub fn fill_type_label(
    locale: op_editor_core::Locale,
    t: op_editor_core::FillType,
) -> &'static str {
    use op_editor_core::FillType;
    let key = match t {
        FillType::Solid => "fill.solid",
        FillType::LinearGradient => "fill.linear",
        FillType::RadialGradient => "fill.radial",
        // No dedicated TS-generated `fill.mesh` key yet; the translate
        // fallback yields the key literal, which is acceptable until the
        // deferred per-vertex mesh editor UI lands.
        FillType::MeshGradient => "fill.mesh",
        // No dedicated TS-generated `fill.shader` key yet; the translate
        // fallback yields the key literal, acceptable for the render-only
        // head-row label (v1 ships no shader authoring UI).
        FillType::Shader => "fill.shader",
        FillType::Image => "fill.image",
    };
    op_i18n::translate(locale, key)
}

/// Paint the fill-type picker overlay (4 rows). Called by
/// `PropertyPanel::paint` AFTER all other sections have painted
/// so the dropdown overlays them.
#[allow(clippy::too_many_arguments)]
pub fn paint_fill_type_picker(
    cx: &mut PaintCx<'_>,
    theme: &Theme,
    action_rect: Rect,
    viewport: Rect,
    state: &SelectState,
    active: op_editor_core::FillType,
    locale: op_editor_core::Locale,
) {
    let picker_rect = fill_type_picker_rect(action_rect, viewport);
    let items: Vec<SelectItem<'static>> = FILL_TYPES
        .iter()
        .map(|t| SelectItem {
            label: fill_type_label(locale, *t),
            selected: *t == active,
            disabled: false,
        })
        .collect();
    let select = Select {
        state,
        items: &items,
    };
    select.paint(
        cx.backend,
        popup_anchor(picker_rect),
        picker_rect,
        &tokens_from_theme(theme),
    );
}
