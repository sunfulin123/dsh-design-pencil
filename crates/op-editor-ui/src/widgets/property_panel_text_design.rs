//! Advanced text controls in the incumbent inspector's field/button vocabulary.
use super::property_panel_inputs::{
    paint_input_with_prefix_focused_state, paint_section_label, PAD_X, SECTION_GAP,
};
use super::property_panel_sections::EditContext;
use super::property_panel_text_input::paint_textarea_with_label;
use super::{PaintCx, PropertyPanelAction as A};
use crate::{theme::Theme, Point2D, Rect, TextLayout};
use op_editor_core::text_inspector_draft::TextInspectorDraft;
use op_editor_core::{EditorState, Locale, PropertyFocus};

#[path = "property_panel_text_design_ops.rs"]
mod ops;
pub(crate) use ops::dispatch;

pub const HEIGHT: f32 = 512.0;
const HEADER_HEIGHT: f32 = 36.0;

pub fn height(expanded: bool) -> f32 {
    HEADER_HEIGHT + if expanded { HEIGHT } else { 0.0 }
}
const FIELD_KEYS: [&str; 13] = [
    "textInspector.markdown",
    "textInspector.start",
    "textInspector.end",
    "textInspector.size",
    "textInspector.weight",
    "textInspector.fill",
    "textInspector.link",
    "textInspector.indent",
    "textInspector.before",
    "textInspector.after",
    "textInspector.number",
    "textInspector.lineHeight",
    "designMd.font",
];

fn field_rects(x: f32, y: f32, w: f32) -> Vec<(usize, Rect)> {
    let half = (w - 8.0) / 2.0;
    let mut fields = vec![
        (0, Rect::xywh(x, y + 24.0, w, 58.0)),
        (6, Rect::xywh(x, y + 152.0, w, 28.0)),
    ];
    for (row_y, a, b) in [(296.0, 7, 10), (332.0, 8, 9)] {
        fields.push((a, Rect::xywh(x, y + row_y, half, 28.0)));
        fields.push((b, Rect::xywh(x + half + 8.0, y + row_y, half, 28.0)));
    }
    fields.push((11, Rect::xywh(x, y + 368.0, w, 28.0)));
    fields
}

pub fn push_input_rects(
    out: &mut Vec<(PropertyFocus, Rect)>,
    x: f32,
    y: f32,
    w: f32,
    expanded: bool,
) {
    if !expanded {
        return;
    }
    out.extend(
        field_rects(x + PAD_X, y + HEADER_HEIGHT, w)
            .into_iter()
            .map(|(i, r)| (PropertyFocus::TextDesign(i), r)),
    );
}

pub fn action_rects(x: f32, y: f32, w: f32, expanded: bool) -> Vec<(A, Rect)> {
    let mut out = vec![(
        A::ToggleTextAdvanced,
        Rect::xywh(x, y, w + PAD_X * 2.0, HEADER_HEIGHT),
    )];
    if !expanded {
        return out;
    }
    let y = y + HEADER_HEIGHT;
    let x = x + PAD_X;
    out.extend([
        (A::ApplyTextMarkdown, Rect::xywh(x, y + 90.0, w, 28.0)),
        (
            A::ToggleTextRangeClearLink,
            Rect::xywh(x, y + 188.0, (w - 4.0) / 2.0, 28.0),
        ),
        (
            A::ApplyTextRange,
            Rect::xywh(x + (w + 4.0) / 2.0, y + 188.0, (w - 4.0) / 2.0, 28.0),
        ),
        (A::ApplyTextParagraph, Rect::xywh(x, y + 412.0, w, 28.0)),
    ]);
    for i in 0..3 {
        out.push((
            A::SetTextParagraphList(i),
            Rect::xywh(x + i as f32 * w / 3.0, y + 260.0, w / 3.0, 28.0),
        ));
    }
    for i in 0..4 {
        out.push((
            A::SetTextTruncation(i),
            Rect::xywh(x + i as f32 * w / 4.0, y + 476.0, w / 4.0, 28.0),
        ));
    }
    out
}

pub fn is_action(action: &A) -> bool {
    matches!(
        action,
        A::ApplyTextMarkdown
            | A::ApplyTextRange
            | A::ApplyTextParagraph
            | A::CycleTextRangeFlag(_)
            | A::ToggleTextRangeClearLink
            | A::SetTextParagraphList(_)
            | A::SetTextTruncation(_)
    )
}

#[allow(clippy::too_many_arguments)]
pub fn paint(
    cx: &mut PaintCx<'_>,
    theme: &Theme,
    edit: &EditContext<'_>,
    locale: Locale,
    draft: &TextInspectorDraft,
    enabled: bool,
    x: f32,
    y: f32,
    width: f32,
) -> f32 {
    let t = |key| op_i18n::translate(locale, key);
    let w = width - PAD_X * 2.0;
    paint_section_label(cx, theme, t("designSystem.advancedText"), x, y, width);
    let indicator = if draft.expanded { "−" } else { "+" };
    cx.backend.draw_text(
        &TextLayout::single_run(
            indicator,
            "system-ui",
            14.0,
            theme.foreground.to_jian(),
            Point2D::new(0.0, 0.0),
        ),
        Point2D::new(x + width - PAD_X - 12.0, y + 20.0),
    );
    if !draft.expanded {
        super::property_panel_inputs::paint_section_divider(cx, theme, x, y + HEADER_HEIGHT, width);
        return y + HEADER_HEIGHT;
    }
    let y = y + HEADER_HEIGHT;
    let mut muted = *theme;
    if !enabled {
        muted.foreground = theme.muted_foreground;
        muted.primary = theme.muted_foreground;
    }
    let theme = &muted;
    for (offset, key) in [
        (0.0, "textInspector.markdown"),
        (128.0, "textInspector.link"),
        (232.0, "textInspector.paragraph"),
        (448.0, "textInspector.truncation"),
    ] {
        paint_section_label(cx, theme, t(key), x, y + offset, width);
    }
    for (offset, key) in [(226.0, "textInspector.selectCharacters")] {
        let label = if enabled {
            t(key)
        } else {
            t("textInspector.selectHint")
        };
        let label = super::text_metrics::fit_chrome(cx.backend, label, w, 10.0);
        cx.backend.draw_text(
            &TextLayout::single_run(
                &label,
                "system-ui",
                10.0,
                theme.muted_foreground.to_jian(),
                Point2D::new(0.0, 0.0),
            ),
            Point2D::new(x + PAD_X, y + offset),
        );
    }
    for (i, rect) in field_rects(x + PAD_X, y, w) {
        let focus = PropertyFocus::TextDesign(i);
        let value = edit.value_for(focus, &draft.values[i]);
        if i == 0 {
            paint_textarea_with_label(
                cx,
                theme,
                rect,
                t(FIELD_KEYS[i]),
                value,
                "",
                enabled && edit.focus == Some(focus),
                edit.caret_at(focus),
                edit.select_all_at(focus),
                edit.input_at(focus),
                edit.now_ms,
            );
        } else {
            paint_input_with_prefix_focused_state(
                cx,
                theme,
                rect,
                t(FIELD_KEYS[i]),
                value,
                enabled && edit.focus == Some(focus),
                edit.caret_at(focus),
                edit.select_all_at(focus),
                edit.input_at(focus),
                edit.now_ms,
            );
        }
    }
    for (action, rect) in action_rects(x, y - HEADER_HEIGHT, w, draft.expanded) {
        let (label, active, status) = match action {
            A::ApplyTextMarkdown => (t("textInspector.applyMarkdown").into(), false, None),
            A::ApplyTextRange => (t("textInspector.applyRange").into(), false, None),
            A::ApplyTextParagraph => (t("textInspector.applyParagraph").into(), false, None),
            A::SetTextTruncation(i) => (
                if i == 0 {
                    t("textInspector.off").to_owned()
                } else {
                    i.to_string()
                },
                draft.truncation_lines == (i > 0).then_some(i as u32),
                None,
            ),
            A::ToggleTextRangeClearLink => {
                (t("textInspector.clearLink").into(), draft.clear_link, None)
            }
            A::CycleTextRangeFlag(i) => {
                let key = [
                    "textInspector.italic",
                    "textInspector.underline",
                    "textInspector.strike",
                ][i];
                let flag = [draft.italic, draft.underline, draft.strike][i];
                let status = match flag {
                    None => "textInspector.keep",
                    Some(true) => "textInspector.on",
                    Some(false) => "textInspector.off",
                };
                (t(key).to_owned(), flag.is_some(), Some(t(status)))
            }
            A::SetTextParagraphList(i) => (
                t([
                    "textInspector.noList",
                    "textInspector.bullet",
                    "textInspector.ordered",
                ][i])
                .into(),
                draft.list == i,
                None,
            ),
            A::ToggleTextAdvanced => continue,
            _ => unreachable!(),
        };
        cx.backend
            .fill_round_rect(rect, 4.0, if active { theme.accent } else { theme.muted });
        cx.backend.stroke_round_rect(rect, 4.0, theme.border, 1.0);
        let label = super::text_metrics::fit_chrome(cx.backend, &label, rect.size.x - 12.0, 10.0);
        let label_w = super::text_metrics::measure_chrome(cx.backend, &label, 10.0);
        cx.backend.draw_text(
            &TextLayout::single_run(
                &label,
                "system-ui",
                10.0,
                theme.foreground.to_jian(),
                Point2D::new(0.0, 0.0),
            ),
            Point2D::new(
                rect.origin.x + (rect.size.x - label_w) / 2.0,
                rect.origin.y + if status.is_some() { 12.0 } else { 18.0 },
            ),
        );
        if let Some(status) = status {
            let status =
                super::text_metrics::fit_chrome(cx.backend, status, rect.size.x - 12.0, 9.0);
            let status_w = super::text_metrics::measure_chrome(cx.backend, &status, 9.0);
            cx.backend.draw_text(
                &TextLayout::single_run(
                    &status,
                    "system-ui",
                    9.0,
                    theme.muted_foreground.to_jian(),
                    Point2D::new(0.0, 0.0),
                ),
                Point2D::new(
                    rect.origin.x + (rect.size.x - status_w) / 2.0,
                    rect.origin.y + 24.0,
                ),
            );
        }
    }
    super::property_panel_inputs::paint_section_divider(cx, theme, x, y + HEIGHT, width);
    y + HEIGHT + SECTION_GAP
}
