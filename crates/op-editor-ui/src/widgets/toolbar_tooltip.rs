use super::editor_state_ext::translate;
use super::tooltip;
use super::{PaintCx, Toolbar};
use crate::Rect;
use op_editor_core::{EditorState, Tool, ToolbarAction, ToolbarHover};

pub fn label(state: &EditorState, hover: ToolbarHover) -> &'static str {
    let key = match hover {
        ToolbarHover::Tool(Tool::Select) => "toolbar.select",
        ToolbarHover::Tool(Tool::Text) => "toolbar.text",
        ToolbarHover::Tool(Tool::Frame) => "toolbar.frame",
        ToolbarHover::Tool(Tool::Hand) => "toolbar.hand",
        ToolbarHover::ShapeSlot => "shapes.shapeTools",
        ToolbarHover::Action(ToolbarAction::Undo) => "toolbar.undo",
        ToolbarHover::Action(ToolbarAction::Redo) => "toolbar.redo",
        ToolbarHover::Action(ToolbarAction::ToggleVariablesPanel) => {
            if state.editor_ui.variables_panel_open {
                "tooltip.toolbar.hideVariables"
            } else {
                "tooltip.toolbar.showVariables"
            }
        }
        ToolbarHover::Action(ToolbarAction::ToggleDesignPanel) => {
            if state.editor_ui.design_md_panel.open {
                "tooltip.toolbar.hideDesign"
            } else {
                "tooltip.toolbar.showDesign"
            }
        }
        _ => return "",
    };
    translate(&state.editor_ui, key)
}

pub fn paint(
    cx: &mut PaintCx<'_>,
    state: &EditorState,
    toolbar: &Toolbar,
    toolbar_rect: Rect,
    width: f32,
    height: f32,
) -> Option<Rect> {
    let hover = toolbar.hover?;
    if toolbar.pressed.is_some()
        || (hover == ToolbarHover::ShapeSlot && state.editor_ui.shape_picker.open)
    {
        return None;
    }
    let anchor = toolbar.hovered_button_rect(toolbar_rect)?;
    let label = label(state, hover);
    if label.is_empty() {
        return None;
    }
    let text_width = tooltip::tooltip_width(cx, label, None);
    let x = (anchor.origin.x + anchor.size.x + tooltip::TOOLTIP_ANCHOR_GAP).min(
        (width - text_width - tooltip::TOOLTIP_VIEWPORT_INSET).max(tooltip::TOOLTIP_VIEWPORT_INSET),
    );
    let y = (anchor.origin.y + (anchor.size.y - tooltip::TOOLTIP_HEIGHT) / 2.0).clamp(
        tooltip::TOOLTIP_VIEWPORT_INSET,
        (height - tooltip::TOOLTIP_HEIGHT - tooltip::TOOLTIP_VIEWPORT_INSET)
            .max(tooltip::TOOLTIP_VIEWPORT_INSET),
    );
    let rect = Rect::xywh(x, y, text_width, tooltip::TOOLTIP_HEIGHT);
    tooltip::paint_tooltip_frame(
        cx,
        &toolbar.theme,
        rect,
        label,
        None,
        jian_widgets::centered_text_baseline_y(rect, tooltip::TOOLTIP_FONT_SIZE),
    );
    Some(rect)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::widgets::test_capture_backend::CaptureBackend;

    #[test]
    fn every_toolbar_button_has_a_translated_label_and_matching_anchor() {
        let mut state = EditorState::new();
        let hits = [
            ToolbarHover::Tool(Tool::Select),
            ToolbarHover::ShapeSlot,
            ToolbarHover::Tool(Tool::Text),
            ToolbarHover::Tool(Tool::Frame),
            ToolbarHover::Tool(Tool::Hand),
            ToolbarHover::Action(ToolbarAction::Undo),
            ToolbarHover::Action(ToolbarAction::Redo),
            ToolbarHover::Action(ToolbarAction::ToggleVariablesPanel),
            ToolbarHover::Action(ToolbarAction::ToggleDesignPanel),
        ];
        let toolbar_rect = Rect::xywh(36.0, 76.0, 44.0, 500.0);
        for hover in hits {
            state.editor_ui.toolbar_hover = Some(hover);
            let toolbar = Toolbar::for_editor(&state);
            let anchor = toolbar.hovered_button_rect(toolbar_rect).unwrap();
            let hit = toolbar
                .hit_test(
                    toolbar_rect,
                    crate::Point2D::new(anchor.origin.x + 16.0, anchor.origin.y + 16.0),
                )
                .unwrap();
            assert_eq!(super::super::editor_state_ext::toolbar_hover(hit), hover);
            let text = label(&state, hover);
            assert!(
                !text.is_empty()
                    && !text.starts_with("toolbar.")
                    && !text.starts_with("tooltip.")
                    && !text.starts_with("shapes.")
            );
            let mut backend = CaptureBackend::default();
            let rect = paint(
                &mut PaintCx {
                    backend: &mut backend,
                },
                &state,
                &toolbar,
                toolbar_rect,
                600.0,
                800.0,
            )
            .unwrap();
            assert!(rect.origin.x >= anchor.origin.x + anchor.size.x);
            assert!(rect.origin.x + rect.size.x <= 596.0);
            assert!(backend.texts.iter().any(|(painted, _)| painted == text));
        }
        let hover = ToolbarHover::Action(ToolbarAction::ToggleVariablesPanel);
        let closed = label(&state, hover);
        state.editor_ui.variables_panel_open = true;
        assert_ne!(closed, label(&state, hover));
        let hover = ToolbarHover::Action(ToolbarAction::ToggleDesignPanel);
        let closed = label(&state, hover);
        state.editor_ui.design_md_panel.open = true;
        assert_ne!(closed, label(&state, hover));
    }

    #[test]
    fn tooltip_is_hidden_without_hover_or_while_shape_menu_is_open() {
        let mut state = EditorState::new();
        let mut backend = CaptureBackend::default();
        let rect = Rect::xywh(0.0, 0.0, 44.0, 500.0);
        assert!(paint(
            &mut PaintCx {
                backend: &mut backend
            },
            &state,
            &Toolbar::for_editor(&state),
            rect,
            600.0,
            800.0
        )
        .is_none());
        state.editor_ui.toolbar_hover = Some(ToolbarHover::ShapeSlot);
        state.editor_ui.shape_picker.open = true;
        assert!(paint(
            &mut PaintCx {
                backend: &mut backend
            },
            &state,
            &Toolbar::for_editor(&state),
            rect,
            600.0,
            800.0
        )
        .is_none());
    }
}
