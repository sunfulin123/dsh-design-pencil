//! Hierarchy-hover tests — dashed focus outline plus dashed hints on direct visible children only.
//!
//! Split out of `canvas_viewport_tests.rs` to keep every file under
//! the repository's 800-line cap. Shared fixtures (`RecordingBackend`,
//! scene builders, transform-replay helpers) stay in that spine.

use super::*;

#[test]
fn hover_focus_and_only_direct_visible_children_are_dashed() {
    let _guard = crate::agent_indicator_test_support::lock();
    op_editor_core::agent_indicators::clear();
    let scene = hover_hierarchy_scene();
    let mut state = EditorState::new();
    state.editor_ui.canvas_hover_node = Some(op_editor_core::NodeId::new("focus"));
    let viewport = CanvasViewport::from_editor(&state, &scene);
    let mut backend = RecordingBackend::default();
    {
        let mut cx = PaintCx {
            backend: &mut backend,
        };
        viewport.paint(&mut cx, Rect::xywh(0.0, 0.0, 300.0, 240.0));
    }

    // The focus outline is dashed (d5df5872), so no solid hover rect paints.
    assert!(
        backend
            .stroke_rects
            .iter()
            .all(|(_, color)| *color != HOVER_OUTLINE_COLOR),
        "the hierarchy focus outline should be dashed, not solid"
    );

    let focus = Rect::xywh(10.0, 10.0, 220.0, 180.0);
    let direct_a = Rect::xywh(30.0, 40.0, 48.0, 32.0);
    let direct_b = Rect::xywh(100.0, 40.0, 80.0, 100.0);
    let hover_lines: Vec<(Point2D, Point2D)> = backend
        .stroke_lines
        .iter()
        .filter_map(|(from, to, color)| (*color == HOVER_OUTLINE_COLOR).then_some((*from, *to)))
        .collect();
    for (rect, what) in [
        (focus, "focus"),
        (direct_a, "direct-a"),
        (direct_b, "direct-b"),
    ] {
        assert!(
            hover_lines
                .iter()
                .any(|(from, to)| line_lies_on_rect_edge(*from, *to, rect)),
            "{what} should paint a dashed hover outline"
        );
    }
    assert!(
        hover_lines.iter().all(|(from, to)| {
            line_lies_on_rect_edge(*from, *to, focus)
                || line_lies_on_rect_edge(*from, *to, direct_a)
                || line_lies_on_rect_edge(*from, *to, direct_b)
        }),
        "hidden direct children and visible grandchildren must not receive hierarchy hints"
    );
}

#[test]
fn selected_hover_focus_keeps_child_hints_selection_handles_and_dimensions() {
    let _guard = crate::agent_indicator_test_support::lock();
    op_editor_core::agent_indicators::clear();
    let scene = hover_hierarchy_scene();
    let mut state = EditorState::new();
    state.doc.children = vec![named_frame_node("focus", "Focus")];
    state.set_single_selection(op_editor_core::NodeId::new("focus"));
    state.editor_ui.canvas_hover_node = Some(op_editor_core::NodeId::new("focus"));
    let mut viewport = CanvasViewport::from_editor(&state, &scene);
    viewport.selection_label = Some("220 × 180".into());
    assert_eq!(
        viewport.hovered.as_deref(),
        Some("focus"),
        "selected nodes must remain eligible as hierarchy hover focus"
    );

    let mut backend = RecordingBackend::default();
    {
        let mut cx = PaintCx {
            backend: &mut backend,
        };
        viewport.paint(&mut cx, Rect::xywh(0.0, 0.0, 300.0, 240.0));
    }

    assert!(
        backend
            .stroke_rects
            .iter()
            .all(|(_, color)| *color != HOVER_OUTLINE_COLOR),
        "a selected focus should not duplicate its solid outline"
    );
    assert!(
        backend
            .stroke_lines
            .iter()
            .any(|(_, _, color)| *color == HOVER_OUTLINE_COLOR),
        "a selected focus should still expose dashed direct-child hints"
    );
    assert!(
        backend
            .stroke_colors
            .iter()
            .filter(|color| **color == viewport.theme.primary)
            .count()
            >= 8,
        "single selection handles should still paint above hierarchy hover"
    );
    assert!(
        backend.texts.iter().any(|text| text == "220 × 180"),
        "the selected dimensions capsule should remain visible"
    );
}
