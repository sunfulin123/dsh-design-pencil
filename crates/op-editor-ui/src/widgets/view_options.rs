use jian_widgets::centered_text_baseline_y;
use op_editor_core::editor_ui_state::ui_scale::UiScale;
use op_editor_core::EditorState;

use super::editor_state_ext::{theme_for, translate};
use super::text_metrics::{centered_text_x, fit_chrome};
use super::{LayoutBox, LayoutCx, PaintCx, Widget, WidgetId};
use crate::{Point2D, Rect, TextLayout, Theme};

pub const VIEW_OPTIONS_ID: u64 = 6001;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum ViewOption {
    Fit,
    Scale(u16),
    RecoverDrafts,
    ImportDiagram,
}

pub struct ViewOptions {
    theme: Theme,
    scale: u16,
    focus: usize,
    pub hover: Option<usize>,
    label: String,
    scale_label: String,
    fit_label: String,
    recovery_label: Option<String>,
    diagram_import: bool,
    diagram_label: String,
}

impl ViewOptions {
    pub fn for_editor(state: &EditorState) -> Self {
        let ui = &state.editor_ui;
        Self {
            theme: theme_for(ui),
            scale: ui.ui_scale.percent(),
            focus: ui.view_options_focus.min(
                4 + usize::from(ui.draft_recovery_supported)
                    + usize::from(ui.diagram_import_supported),
            ),
            hover: None,
            label: translate(ui, "statusbar.viewOptions").into(),
            scale_label: translate(ui, "statusbar.interfaceScale").into(),
            fit_label: translate(ui, "preview.fit").into(),
            recovery_label: ui
                .draft_recovery_supported
                .then(|| translate(ui, "drafts.title").into()),
            diagram_import: ui.diagram_import_supported,
            diagram_label: translate(ui, "diagram.import").into(),
        }
    }

    pub fn rect_at(anchor: Option<Rect>, width: f32, height: f32) -> Rect {
        let w = (width - 16.0).clamp(0.0, 240.0);
        let anchor = anchor.unwrap_or(Rect::xywh(width - 8.0, height - 8.0, 0.0, 0.0));
        Rect::xywh(
            (anchor.origin.x + anchor.size.x - w).clamp(8.0, (width - w - 8.0).max(8.0)),
            (anchor.origin.y - 132.0).clamp(8.0, (height - 132.0).max(8.0)),
            w,
            124.0,
        )
    }

    pub fn option(index: usize) -> Option<ViewOption> {
        if index == 0 {
            Some(ViewOption::Fit)
        } else if index == 5 {
            Some(ViewOption::RecoverDrafts)
        } else {
            UiScale::SUPPORTED
                .get(index - 1)
                .copied()
                .map(ViewOption::Scale)
        }
    }

    pub fn option_for(&self, index: usize) -> Option<ViewOption> {
        if self.diagram_import && index == 5 {
            Some(ViewOption::ImportDiagram)
        } else if self.diagram_import && index == 6 && self.recovery_label.is_some() {
            Some(ViewOption::RecoverDrafts)
        } else {
            Self::option(index)
        }
    }

    pub fn option_count(&self) -> usize {
        5 + usize::from(self.recovery_label.is_some()) + usize::from(self.diagram_import)
    }

    fn button(rect: Rect, index: usize) -> Rect {
        if index == 0 || index >= 5 {
            return Rect::xywh(
                rect.origin.x + 12.0,
                rect.origin.y
                    + if index == 0 {
                        12.0
                    } else {
                        132.0 + (index - 5) as f32 * 48.0
                    },
                rect.size.x - 24.0,
                28.0,
            );
        }
        let w = ((rect.size.x - 36.0) / 4.0).max(0.0);
        Rect::xywh(
            rect.origin.x + 12.0 + (index - 1) as f32 * (w + 4.0),
            rect.origin.y + 82.0,
            w,
            30.0,
        )
    }

    pub fn control_at(rect: Rect, point: Point2D) -> Option<usize> {
        (0..(5 + ((rect.size.y - 124.0) / 48.0).round() as usize))
            .find(|index| Self::button(rect, *index).contains(point))
    }

    pub fn rect_for(&self, anchor: Option<Rect>, width: f32, height: f32) -> Rect {
        let mut rect = Self::rect_at(anchor, width, height);
        let extra = (self.option_count() - 5) as f32 * 48.0;
        rect.origin.y = (rect.origin.y - extra).max(8.0);
        rect.size.y += extra;
        rect
    }
}

impl Widget for ViewOptions {
    fn id(&self) -> WidgetId {
        WidgetId::new(VIEW_OPTIONS_ID)
    }

    fn layout(&self, _cx: &LayoutCx) -> LayoutBox {
        LayoutBox {
            rect: Rect::xywh(
                0.0,
                0.0,
                240.0,
                124.0 + (self.option_count() - 5) as f32 * 48.0,
            ),
        }
    }

    fn paint(&self, cx: &mut PaintCx<'_>, rect: Rect) {
        cx.backend.fill_round_rect(rect, 8.0, self.theme.popover);
        cx.backend
            .stroke_round_rect(rect, 8.0, self.theme.border, 1.0);
        cx.backend.fill_rect(
            Rect::xywh(
                rect.origin.x + 12.0,
                rect.origin.y + 48.0,
                (rect.size.x - 24.0).max(0.0),
                1.0,
            ),
            self.theme.border,
        );
        let label = fit_chrome(
            cx.backend,
            &self.scale_label,
            (rect.size.x - 24.0).max(0.0),
            11.0,
        );
        cx.backend.draw_text(
            &TextLayout::single_run(
                &label,
                "system-ui",
                11.0,
                self.theme.foreground.to_jian(),
                Point2D::ZERO,
            ),
            Point2D::new(rect.origin.x + 12.0, rect.origin.y + 71.0),
        );
        if self.option_count() > 5 {
            cx.backend.fill_rect(
                Rect::xywh(
                    rect.origin.x + 12.0,
                    rect.origin.y + 122.0,
                    (rect.size.x - 24.0).max(0.0),
                    1.0,
                ),
                self.theme.border,
            );
        }
        for index in 0..self.option_count() {
            let button = Self::button(rect, index);
            let option = self.option_for(index).expect("fixed view option index");
            let selected = option == ViewOption::Scale(self.scale);
            let color = if selected {
                cx.backend.fill_round_rect(button, 4.0, self.theme.primary);
                self.theme.primary_foreground
            } else {
                super::button::paint_ghost_button_feedback(
                    cx.backend,
                    &self.theme,
                    button,
                    self.hover == Some(index),
                    false,
                );
                self.theme.foreground
            };
            if self.focus == index {
                cx.backend
                    .stroke_round_rect(button, 4.0, self.theme.ring, 1.0);
            }
            let text = match option {
                ViewOption::Fit => self.fit_label.clone(),
                ViewOption::Scale(scale) => format!("{scale}%"),
                ViewOption::ImportDiagram => self.diagram_label.clone(),
                ViewOption::RecoverDrafts => self
                    .recovery_label
                    .as_ref()
                    .expect("available recovery label")
                    .clone(),
            };
            let text = fit_chrome(cx.backend, &text, (button.size.x - 4.0).max(0.0), 12.0);
            let x = centered_text_x(cx.backend, &text, 12.0, button);
            cx.backend.draw_text(
                &TextLayout::single_run(&text, "system-ui", 12.0, color.to_jian(), Point2D::ZERO),
                Point2D::new(x, centered_text_baseline_y(button, 12.0)),
            );
        }
    }

    fn access_node(&self) -> accesskit::Node {
        let mut node = accesskit::Node::new(accesskit::Role::Group);
        let mut label = format!(
            "{}. {}: {}%. {}",
            self.label, self.scale_label, self.scale, self.fit_label
        );
        if let Some(recovery) = &self.recovery_label {
            label.push_str(". ");
            label.push_str(recovery);
        }
        if self.diagram_import {
            label.push_str(". ");
            label.push_str(&self.diagram_label);
        }
        node.set_label(label);
        node
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use op_editor_core::Locale;

    #[test]
    fn diagram_import_label_and_accessibility_localize_without_geometry_changes() {
        let mut state = EditorState::starter();
        state.editor_ui.diagram_import_supported = true;
        state.editor_ui.draft_recovery_supported = true;
        state.editor_ui.locale = Locale::EnUs;
        let english = ViewOptions::for_editor(&state);
        state.editor_ui.locale = Locale::ZhCn;
        let chinese = ViewOptions::for_editor(&state);
        assert_eq!(english.diagram_label, "Import Mermaid / draw.io…");
        assert_eq!(chinese.diagram_label, "导入 Mermaid / draw.io…");
        assert!(chinese
            .access_node()
            .label()
            .unwrap()
            .contains("导入 Mermaid / draw.io…"));
        let anchor = Some(Rect::xywh(1100.0, 850.0, 200.0, 32.0));
        assert_eq!(
            english.rect_for(anchor, 1440.0, 900.0),
            chinese.rect_for(anchor, 1440.0, 900.0),
        );
    }
}
