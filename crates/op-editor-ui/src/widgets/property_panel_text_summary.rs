//! Text property labels resolve against a selected range when present.
use super::{display_font_family, FontWeightChoice};
use crate::util::format_panel_number;
use crate::widgets::property_panel_snapshot::TextSummary;
use op_editor_core::text_inspector_draft::TextInspectorDraft;
use op_editor_core::Locale;

pub(super) fn family<'a>(
    text: &'a TextSummary,
    inspector: &'a TextInspectorDraft,
    locale: Locale,
) -> &'a str {
    match &inspector.selection_style {
        Some(style) => style
            .family
            .as_deref()
            .map(display_font_family)
            .unwrap_or(op_i18n::translate(locale, "textInspector.mixed")),
        None => display_font_family(&text.font_family),
    }
}

pub(super) fn weight(
    text: &TextSummary,
    inspector: &TextInspectorDraft,
    locale: Locale,
) -> &'static str {
    let weight = inspector
        .selection_style
        .as_ref()
        .map_or(Some(text.font_weight), |style| {
            style.weight.map(|weight| weight as u16)
        });
    weight
        .map(|weight| op_i18n::translate(locale, FontWeightChoice::nearest(weight).label_key()))
        .unwrap_or(op_i18n::translate(locale, "textInspector.mixed"))
}

pub(super) fn size(text: &TextSummary, inspector: &TextInspectorDraft, locale: Locale) -> String {
    inspector
        .selection_style
        .as_ref()
        .map_or(Some(text.font_size), |style| style.size)
        .map(format_panel_number)
        .unwrap_or_else(|| op_i18n::translate(locale, "textInspector.mixed").to_owned())
}
