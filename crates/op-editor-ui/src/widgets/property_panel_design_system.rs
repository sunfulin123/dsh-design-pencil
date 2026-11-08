//! Shared-style, binding, token and diagnostic controls in the incumbent inspector.
use super::property_panel_inputs::{
    paint_input_with_prefix_focused_state, paint_section_label, PAD_X, SECTION_GAP,
};
use super::property_panel_sections::EditContext;
use super::{PaintCx, PropertyPanelAction as A};
use crate::{theme::Theme, Point2D, Rect, TextLayout};
use op_editor_core::design_system_inspector_draft::{
    DesignSystemAction as D, DesignSystemInspectorDraft,
};
use op_editor_core::{EditorState, Locale, PropertyFocus};

pub const HEIGHT: f32 = 1104.0;
const FIELD_KEYS: [&str; 8] = [
    "designSystem.styleId",
    "common.name",
    "designSystem.variable",
    "designSystem.property",
    "designSystem.formula",
    "designSystem.collection",
    "designSystem.mode",
    "designSystem.tokens",
];

fn field_rects(x: f32, y: f32, w: f32) -> Vec<(usize, Rect)> {
    [
        (0, 24.0),
        (1, 60.0),
        (2, 276.0),
        (3, 312.0),
        (4, 384.0),
        (5, 544.0),
        (6, 580.0),
        (7, 704.0),
    ]
    .into_iter()
    .map(|(i, offset)| {
        (
            i,
            Rect::xywh(x, y + offset, w, if i == 7 { 78.0 } else { 28.0 }),
        )
    })
    .collect()
}

pub fn push_input_rects(out: &mut Vec<(PropertyFocus, Rect)>, x: f32, y: f32, w: f32) {
    out.extend(
        field_rects(x + PAD_X, y, w)
            .into_iter()
            .map(|(i, r)| (PropertyFocus::DesignSystem(i), r)),
    );
}

pub fn action_rects(x: f32, y: f32, w: f32) -> Vec<(A, Rect)> {
    let x = x + PAD_X;
    let mut out = Vec::new();
    for (offset, actions) in [
        (96.0, vec![D::Kind(0), D::Kind(1), D::Kind(2)]),
        (132.0, vec![D::BrowseStyle(false), D::BrowseStyle(true)]),
        (168.0, vec![D::CaptureStyle]),
        (204.0, vec![D::ApplyStyle, D::DetachStyle, D::DeleteStyle]),
        (348.0, vec![D::Bind, D::Unbind]),
        (420.0, vec![D::SetFormula]),
        (508.0, vec![D::Scope(0), D::Scope(1), D::Scope(2)]),
        (616.0, vec![D::SetMode]),
        (790.0, vec![D::ImportTokens, D::ExportTokens]),
        (834.0, vec![D::Lint, D::FixLint]),
        (900.0, vec![D::BrowseFinding(false), D::BrowseFinding(true)]),
        (1058.0, vec![D::FixFinding]),
    ] {
        let count = actions.len() as f32;
        let cell = (w - 4.0 * (count - 1.0)) / count;
        out.extend(actions.into_iter().enumerate().map(|(i, action)| {
            (
                A::DesignSystem(action),
                Rect::xywh(x + i as f32 * (cell + 4.0), y + offset, cell, 28.0),
            )
        }));
    }
    out
}

pub fn is_action(action: &A) -> bool {
    matches!(action, A::DesignSystem(_))
}

pub(crate) fn dispatch(state: &mut EditorState, action: &A, now_ms: u64) {
    let A::DesignSystem(action) = *action else {
        return;
    };
    let blocked = std::mem::take(&mut state.ui.design_system_inspector.authored_blocked);
    if matches!(
        state.ui.property_focus,
        Some(PropertyFocus::DesignSystem(_))
    ) {
        super::property_panel_commit::commit_property_focus(state);
    }
    let node_action = matches!(
        action,
        D::CaptureStyle | D::ApplyStyle | D::DetachStyle | D::Bind | D::Unbind
    ) || matches!(action, D::SetMode)
        && state.ui.design_system_inspector.scope == 0;
    let result = if node_action
        && (blocked
            || !op_editor_core::text_inspector_draft::TextInspectorDraft::editable(state)
            || state
                .selected_node()
                .is_some_and(|node| matches!(node, jian_ops_schema::node::PenNode::Ref(_))))
    {
        Err(op_i18n::translate(state.editor_ui.locale, "textInspector.selectHint").into())
    } else {
        let before = state.doc.clone();
        let result = op_editor_core::design_system_inspector_draft::execute(state, action);
        if result.is_ok() {
            let key = if before != state.doc {
                "designSystem.applied"
            } else if matches!(action, D::FixLint | D::FixFinding)
                && !state.ui.design_system_inspector.lint_ids.is_empty()
            {
                "designSystem.manualFix"
            } else {
                ""
            };
            state.ui.design_system_inspector.status = if key.is_empty() {
                String::new()
            } else {
                op_i18n::translate(state.editor_ui.locale, key).into()
            };
        }
        result
    };
    if let Err(reason) = result {
        state.editor_ui.show_toast(
            "layerMenu.designError",
            vec![("reason".into(), reason)],
            op_editor_core::editor_toast::EditorToastLevel::Warn,
            now_ms,
        );
    }
}

#[allow(clippy::too_many_arguments)]
pub fn paint(
    cx: &mut PaintCx<'_>,
    theme: &Theme,
    edit: &EditContext<'_>,
    locale: Locale,
    draft: &DesignSystemInspectorDraft,
    _enabled: bool,
    x: f32,
    y: f32,
    width: f32,
) -> f32 {
    let t = |key| op_i18n::translate(locale, key);
    let w = width - PAD_X * 2.0;
    for (offset, key) in [
        (0.0, "designSystem.styles"),
        (248.0, "designSystem.bindings"),
        (480.0, "designSystem.modes"),
        (676.0, "designSystem.tokens"),
    ] {
        paint_section_label(cx, theme, t(key), x, y + offset, width);
    }
    for (i, rect) in field_rects(x + PAD_X, y, w) {
        let focus = PropertyFocus::DesignSystem(i);
        let value = edit.value_for(focus, &draft.values[i]);
        if i == 7 {
            super::property_panel_text_input::paint_textarea_with_label(
                cx,
                theme,
                rect,
                t(FIELD_KEYS[i]),
                value,
                "",
                edit.focus == Some(focus),
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
                edit.focus == Some(focus),
                edit.caret_at(focus),
                edit.select_all_at(focus),
                edit.input_at(focus),
                edit.now_ms,
            );
        }
    }
    for (action, rect) in action_rects(x, y, w) {
        let A::DesignSystem(action) = action else {
            continue;
        };
        let (key, active) = match action {
            D::Kind(i) => (
                [
                    "designSystem.paint",
                    "designSystem.text",
                    "designSystem.effect",
                ][i],
                draft.kind
                    == [
                        jian_ops_schema::style::SharedStyleKind::Paint,
                        jian_ops_schema::style::SharedStyleKind::Text,
                        jian_ops_schema::style::SharedStyleKind::Effect,
                    ][i],
            ),
            D::Scope(i) => (
                [
                    "designSystem.node",
                    "designSystem.page",
                    "designSystem.document",
                ][i],
                draft.scope == i,
            ),
            D::BrowseStyle(next) => (
                if next {
                    "designSystem.nextStyle"
                } else {
                    "designSystem.previousStyle"
                },
                false,
            ),
            D::CaptureStyle => ("designSystem.capture", false),
            D::ApplyStyle => ("designSystem.apply", false),
            D::DetachStyle => ("designSystem.detach", false),
            D::DeleteStyle => ("common.delete", false),
            D::Bind => ("designSystem.bind", false),
            D::Unbind => ("designSystem.unbind", false),
            D::SetFormula => ("designSystem.saveFormula", false),
            D::SetMode => ("designSystem.setMode", false),
            D::ImportTokens => ("common.import", false),
            D::ExportTokens => ("common.export", false),
            D::Lint => ("designSystem.lint", false),
            D::FixLint => ("designSystem.fix", false),
            D::FixFinding => ("designSystem.fixFinding", false),
            D::BrowseFinding(next) => (
                if next {
                    "designSystem.nextFinding"
                } else {
                    "designSystem.previousFinding"
                },
                false,
            ),
            D::LoadStyle(_) => continue,
        };
        cx.backend
            .fill_round_rect(rect, 4.0, if active { theme.accent } else { theme.muted });
        cx.backend.stroke_round_rect(rect, 4.0, theme.border, 1.0);
        let label = super::text_metrics::fit_chrome(cx.backend, t(key), rect.size.x - 12.0, 10.0);
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
                jian_widgets::centered_text_baseline_y(rect, 10.0),
            ),
        );
    }
    if let Some((id, reason)) = draft.lint_findings.get(draft.lint_index) {
        let text = format!(
            "{} / {} · {id}: {reason}",
            draft.lint_index + 1,
            draft.lint_findings.len()
        );
        let mut lines = vec![String::new()];
        for ch in text.chars() {
            let line = lines.last_mut().expect("at least one diagnostic line");
            let candidate = format!("{line}{ch}");
            if !line.is_empty()
                && super::text_metrics::measure_chrome(cx.backend, &candidate, 10.0) > w
            {
                lines.push(ch.to_string());
            } else {
                line.push(ch);
            }
        }
        for (i, line) in lines.iter().take(7).enumerate() {
            let line = if i == 6 && lines.len() > 7 {
                format!("{line}…")
            } else {
                line.clone()
            };
            let line = super::text_metrics::fit_chrome(cx.backend, &line, w, 10.0);
            cx.backend.draw_text(
                &TextLayout::single_run(
                    &line,
                    "system-ui",
                    10.0,
                    theme.foreground.to_jian(),
                    Point2D::new(0.0, 0.0),
                ),
                Point2D::new(x + PAD_X, y + 946.0 + i as f32 * 14.0),
            );
        }
    }
    for (offset, label) in [
        (
            466.0,
            format!("{}: {}", t("designSystem.resolved"), draft.variable_value),
        ),
        (
            662.0,
            format!("{}: {}", t("designSystem.resolved"), draft.mode_value),
        ),
        (
            882.0,
            format!(
                "{}: {}  {}",
                t("designSystem.issues"),
                draft.lint_ids.len(),
                draft.status
            ),
        ),
    ] {
        let label = super::text_metrics::fit_chrome(cx.backend, &label, w, 10.0);
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
    super::property_panel_inputs::paint_section_divider(cx, theme, x, y + HEIGHT, width);
    y + HEIGHT + SECTION_GAP
}
