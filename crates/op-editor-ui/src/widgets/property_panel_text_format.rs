//! Formatting controls display mixed range values without treating them as off.
use super::{text_button_height, Icon, INPUT_RADIUS, PAD_X};
use crate::theme::Theme;
use crate::widgets::icons::draw_icon;
use crate::widgets::property_panel_snapshot::TextSummary;
use crate::widgets::{text_metrics, PaintCx};
use crate::{Point2D, Rect, TextLayout};
use op_editor_core::text_inspector_draft::TextInspectorDraft;
use op_editor_core::Locale;

#[allow(clippy::too_many_arguments)]
pub(super) fn paint(
    cx: &mut PaintCx<'_>,
    theme: &Theme,
    text: &TextSummary,
    inspector: &TextInspectorDraft,
    locale: Locale,
    x: f32,
    y: f32,
    usable_w: f32,
    touch_controls: bool,
) -> f32 {
    let button_h = text_button_height(touch_controls);
    let width = usable_w / 4.0;
    let track = Rect::xywh(x + PAD_X, y, usable_w, button_h);
    cx.backend.fill_round_rect(track, INPUT_RADIUS, theme.muted);
    cx.backend
        .stroke_round_rect(track, INPUT_RADIUS, theme.border, 1.0);
    let style = inspector.selection_style.as_ref();
    let states = [
        (
            Icon::Bold,
            style.map_or(Some(text.font_weight >= 600), |s| {
                s.weight.map(|w| w >= 600)
            }),
        ),
        (Icon::Italic, style.map_or(Some(text.italic), |s| s.italic)),
        (
            Icon::Underline,
            style.map_or(Some(text.underline), |s| s.underline),
        ),
        (
            Icon::Strikethrough,
            style.map_or(Some(text.strikethrough), |s| s.strikethrough),
        ),
    ];
    for (i, (icon, state)) in states.into_iter().enumerate() {
        let cell = Rect::xywh(
            x + PAD_X + i as f32 * width + 2.0,
            y + 2.0,
            (width - 4.0).max(0.0),
            (button_h - 4.0).max(0.0),
        );
        if state == Some(true) {
            cx.backend.fill_round_rect(cell, 4.0, theme.background);
        }
        let label = op_i18n::translate(locale, "textInspector.mixed");
        let label_w = if state.is_none() {
            text_metrics::measure_chrome(cx.backend, label, 8.0)
        } else {
            0.0
        };
        let group_w = if label_w > 0.0 && label_w + 17.0 <= cell.size.x {
            17.0 + label_w
        } else {
            14.0
        };
        let left = cell.origin.x + (cell.size.x - group_w) / 2.0;
        draw_icon(
            cx.backend,
            icon,
            Point2D::new(left, cell.origin.y + (cell.size.y - 14.0) / 2.0),
            14.0,
            if state == Some(true) {
                theme.primary
            } else {
                theme.muted_foreground
            },
            1.6,
        );
        if group_w > 14.0 {
            let layout = TextLayout::single_run(
                label,
                "system-ui",
                8.0,
                theme.muted_foreground.to_jian(),
                Point2D::new(0.0, 0.0),
            );
            cx.backend.draw_text(
                &layout,
                Point2D::new(left + 17.0, cell.origin.y + cell.size.y / 2.0 + 3.0),
            );
        } else if state.is_none() {
            cx.backend.fill_rect(
                Rect::xywh(
                    cell.origin.x + cell.size.x - 6.0,
                    cell.origin.y + 3.0,
                    4.0,
                    1.5,
                ),
                theme.muted_foreground,
            );
        }
    }
    y + button_h + 6.0
}
