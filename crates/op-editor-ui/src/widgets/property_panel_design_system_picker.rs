//! Inline design-system pickers share the inspector's normal scroll and clipping.
use super::{DesignSystemInspectorDraft, D};
use crate::theme::Theme;
use crate::widgets::{PaintCx, PropertyPanelAction as A};
use crate::{Point2D, Rect, TextLayout};
use op_editor_core::Locale;

const ROW_HEIGHT: f32 = 28.0;
const OFFSETS: [f32; 3] = [24.0, 544.0, 580.0];

fn choices(
    draft: &DesignSystemInspectorDraft,
    picker: usize,
    locale: Locale,
) -> Vec<(Option<D>, String)> {
    let t = |key| op_i18n::translate(locale, key).to_owned();
    match picker {
        0 if draft.styles.is_empty() => vec![(None, t("designSystem.noStyles"))],
        0 => draft
            .styles
            .iter()
            .enumerate()
            .map(|(i, (id, name))| {
                let duplicate = draft
                    .styles
                    .iter()
                    .filter(|(_, other)| other == name)
                    .count()
                    > 1;
                (
                    Some(D::LoadStyle(i)),
                    if duplicate {
                        format!("{name} · {id}")
                    } else {
                        name.clone()
                    },
                )
            })
            .collect(),
        1 if draft.collections.is_empty() => vec![(None, t("designSystem.noCollections"))],
        1 => draft
            .collections
            .iter()
            .enumerate()
            .map(|(i, (name, _))| (Some(D::SelectCollection(i)), name.clone()))
            .collect(),
        2 => match draft
            .collections
            .iter()
            .find(|(name, _)| name == draft.values[5].trim())
        {
            Some((_, modes)) if !modes.is_empty() => {
                std::iter::once((Some(D::SelectMode(0)), t("designSystem.followParent")))
                    .chain(
                        modes
                            .iter()
                            .enumerate()
                            .map(|(i, mode)| (Some(D::SelectMode(i + 1)), mode.clone())),
                    )
                    .collect()
            }
            Some(_) => vec![(None, t("designSystem.singleMode"))],
            None => vec![(None, t("designSystem.chooseCollection"))],
        },
        _ => Vec::new(),
    }
}

pub(super) fn extra(draft: &DesignSystemInspectorDraft) -> f32 {
    draft.picker.map_or(0.0, |picker| {
        choices(draft, picker, Locale::EnUs).len() as f32 * ROW_HEIGHT
    })
}

pub(super) fn shift(offset: f32, draft: &DesignSystemInspectorDraft) -> f32 {
    offset
        + draft
            .picker
            .filter(|i| *i < OFFSETS.len() && offset > OFFSETS[*i])
            .map_or(0.0, |_| extra(draft))
}

pub(super) fn actions(
    x: f32,
    y: f32,
    w: f32,
    draft: &DesignSystemInspectorDraft,
) -> Vec<(A, Rect)> {
    let mut out = Vec::new();
    for (i, offset) in OFFSETS.into_iter().enumerate() {
        out.push((
            A::DesignSystem(D::TogglePicker(i)),
            Rect::xywh(x, y + shift(offset, draft), w, ROW_HEIGHT),
        ));
    }
    if let Some(picker) = draft.picker.filter(|i| *i < OFFSETS.len()) {
        let top = y + OFFSETS[picker] + ROW_HEIGHT;
        for (i, (action, _)) in choices(draft, picker, Locale::EnUs).into_iter().enumerate() {
            if let Some(action) = action {
                out.push((
                    A::DesignSystem(action),
                    Rect::xywh(x, top + i as f32 * ROW_HEIGHT, w, ROW_HEIGHT),
                ));
            }
        }
    }
    out
}

pub(super) fn paint(
    cx: &mut PaintCx<'_>,
    theme: &Theme,
    locale: Locale,
    x: f32,
    y: f32,
    w: f32,
    draft: &DesignSystemInspectorDraft,
) {
    let t = |key| op_i18n::translate(locale, key);
    let style = draft
        .styles
        .iter()
        .find(|(id, _)| id == draft.values[0].trim())
        .map(|(_, name)| name.as_str())
        .unwrap_or(t("designSystem.chooseStyle"));
    let collection = if draft.values[5].is_empty() {
        t("designSystem.chooseCollection")
    } else {
        &draft.values[5]
    };
    let mode = if draft
        .collections
        .iter()
        .any(|(name, modes)| name == &draft.values[5] && modes.is_empty())
    {
        t("designSystem.singleMode")
    } else if draft.values[6].is_empty() || draft.values[6] == "auto" {
        t("designSystem.followParent")
    } else {
        &draft.values[6]
    };
    for (i, label) in [style, collection, mode].into_iter().enumerate() {
        let rect = Rect::xywh(x, y + shift(OFFSETS[i], draft), w, ROW_HEIGHT);
        paint_row(cx, theme, rect, label, true);
    }
    if let Some(picker) = draft.picker.filter(|i| *i < OFFSETS.len()) {
        let top = y + OFFSETS[picker] + ROW_HEIGHT;
        for (i, (_, label)) in choices(draft, picker, locale).iter().enumerate() {
            paint_row(
                cx,
                theme,
                Rect::xywh(x, top + i as f32 * ROW_HEIGHT, w, ROW_HEIGHT),
                label,
                false,
            );
        }
    }
}

pub(super) fn paint_row(
    cx: &mut PaintCx<'_>,
    theme: &Theme,
    rect: Rect,
    label: &str,
    trigger: bool,
) {
    cx.backend.fill_round_rect(rect, 4.0, theme.muted);
    cx.backend.stroke_round_rect(rect, 4.0, theme.border, 1.0);
    let label = super::super::text_metrics::fit_chrome(cx.backend, label, rect.size.x - 24.0, 10.0);
    cx.backend.draw_text(
        &TextLayout::single_run(
            &label,
            "system-ui",
            10.0,
            theme.foreground.to_jian(),
            Point2D::new(0.0, 0.0),
        ),
        Point2D::new(
            rect.origin.x + 8.0,
            jian_widgets::centered_text_baseline_y(rect, 10.0),
        ),
    );
    if trigger {
        cx.backend.draw_text(
            &TextLayout::single_run(
                "⌄",
                "system-ui",
                12.0,
                theme.muted_foreground.to_jian(),
                Point2D::new(0.0, 0.0),
            ),
            Point2D::new(
                rect.origin.x + rect.size.x - 16.0,
                jian_widgets::centered_text_baseline_y(rect, 12.0),
            ),
        );
    }
}

#[allow(clippy::too_many_arguments)]
pub(super) fn paint_style_id(
    cx: &mut PaintCx<'_>,
    theme: &Theme,
    locale: Locale,
    draft: &DesignSystemInspectorDraft,
    x: f32,
    y: f32,
    w: f32,
) {
    if draft.styles.iter().any(|(id, _)| id == &draft.values[0]) {
        let row_y = y + shift(204.0, draft);
        let label = format!("ID: {}", draft.values[0]);
        let label =
            crate::widgets::text_metrics::fit_chrome(cx.backend, &label, (w - 66.0).max(0.0), 10.0);
        cx.backend.draw_text(
            &TextLayout::single_run(
                &label,
                "system-ui",
                10.0,
                theme.muted_foreground.to_jian(),
                Point2D::new(0.0, 0.0),
            ),
            Point2D::new(x + super::PAD_X, row_y + 18.0),
        );
        paint_row(
            cx,
            theme,
            Rect::xywh(x + super::PAD_X + w - 58.0, row_y, 58.0, 28.0),
            op_i18n::translate(locale, "common.copy"),
            false,
        );
    }
}
