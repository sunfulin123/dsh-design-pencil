//! Deferred canvas text hit-testing uses the actual paint backend's font measurements.
use super::WidgetHost;
use op_editor_ui::widgets::canvas_text_edit::text_edit_layout;
use op_editor_ui::{Point2D, Rect, RenderBackend};

#[derive(Debug, Clone)]
pub(super) struct TextEditPointer {
    node_id: String,
    start: Point2D,
    current: Point2D,
    released: bool,
}

impl WidgetHost {
    pub(super) fn apply_design_text_selection_drag(&mut self, x: f32, y: f32) -> bool {
        self.move_text_edit_pointer(x, y) || self.apply_image_input_selection_drag_cursor_move(x, y)
    }

    fn text_doc_point(&self, x: f32, y: f32, w: f32, h: f32) -> Option<Point2D> {
        let (left, top, width, height) = self.canvas_region(w, h);
        if !Rect::xywh(left, top, width, height).contains(Point2D::new(x, y)) {
            return None;
        }
        let view = self.editor_state.viewport;
        Some(Point2D::new(
            (x - left - view.pan_x) / view.zoom,
            (y - top - view.pan_y) / view.zoom,
        ))
    }

    pub(super) fn start_text_edit_pointer(&mut self, x: f32, y: f32, w: f32, h: f32) -> bool {
        if self.over_topmost_panel(x, y, w, h) {
            return false;
        }
        let Some(id) = self.editor_state.ui.text_editing.as_ref() else {
            return false;
        };
        let Some(point) = self.text_doc_point(x, y, w, h) else {
            return false;
        };
        let Some(node) = self
            .layout_scene
            .active_page()
            .and_then(|page| page.find(id.as_str()))
        else {
            return false;
        };
        if !node.bounds.contains(point) {
            return false;
        }
        self.text_edit_pointer = Some(TextEditPointer {
            node_id: id.as_str().into(),
            start: point,
            current: point,
            released: false,
        });
        self.mark_dirty();
        true
    }

    pub(super) fn move_text_edit_pointer(&mut self, x: f32, y: f32) -> bool {
        if self.text_edit_pointer.is_none() {
            return false;
        }
        let view = self.editor_state.viewport;
        let (left, top, _, _) = self.canvas_region(self.last_viewport_w, self.last_viewport_h);
        let point = Point2D::new(
            (x - left - view.pan_x) / view.zoom,
            (y - top - view.pan_y) / view.zoom,
        );
        if let Some(drag) = self.text_edit_pointer.as_mut() {
            drag.current = point;
        }
        self.mark_dirty();
        true
    }

    pub(super) fn release_text_edit_pointer(&mut self) -> bool {
        let Some(pointer) = self.text_edit_pointer.as_mut() else {
            return false;
        };
        pointer.released = true;
        self.mark_dirty();
        true
    }

    pub(super) fn prepare_text_edit_paint(&mut self, backend: &mut dyn RenderBackend) {
        self.refresh_layout_scene();
        self.apply_pending_page_fit();
        let Some(pointer) = self.text_edit_pointer.clone() else {
            return;
        };
        let active = self
            .editor_state
            .ui
            .text_editing
            .as_ref()
            .is_some_and(|id| id.as_str() == pointer.node_id);
        let node = self
            .layout_scene
            .active_page()
            .and_then(|page| page.find(&pointer.node_id));
        if active {
            if let Some(node) = node {
                let layout = text_edit_layout(backend, node);
                let start = layout.offset_at_point(backend, pointer.start);
                let end = layout.offset_at_point(backend, pointer.current);
                self.editor_state
                    .text_edit_select_range(start, end, self.now_ms);
            }
        }
        if pointer.released || !active {
            self.text_edit_pointer = None;
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use op_editor_core::{NodeId, Viewport};
    use op_editor_ui::{Color, TextLayout};

    struct Backend;
    impl RenderBackend for Backend {
        fn begin_frame(&mut self) {}
        fn end_frame(&mut self) {}
        fn fill_rect(&mut self, _: Rect, _: Color) {}
        fn stroke_rect(&mut self, _: Rect, _: Color, _: f32) {}
        fn draw_text(&mut self, _: &TextLayout, _: Point2D) {}
        fn clip_rect(&mut self, _: Rect) {}
        fn stroke_line(&mut self, _: Point2D, _: Point2D, _: Color, _: f32) {}
        fn fill_round_rect(&mut self, _: Rect, _: f32, _: Color) {}
        fn stroke_round_rect(&mut self, _: Rect, _: f32, _: Color, _: f32) {}
        fn stroke_svg_path(&mut self, _: &str, _: Point2D, _: f32, _: Color, _: f32) {}
        fn save(&mut self) {}
        fn restore(&mut self) {}
        fn translate(&mut self, _: Point2D) {}
        fn resize(&mut self, _: u32, _: u32) {}
        fn dpi_scale(&self) -> f32 {
            1.0
        }
        fn measure_text_family(&mut self, text: &str, _: f32, _: &str) -> f32 {
            text.chars().count() as f32 * 10.0
        }
        fn measure_text_family_styled(
            &mut self,
            text: &str,
            _: f32,
            _: &str,
            _: u16,
            _: bool,
        ) -> f32 {
            text.chars().count() as f32 * 10.0
        }
    }

    #[test]
    fn dragging_canvas_text_retains_unicode_selection_on_panel_press() {
        let mut host = WidgetHost::new();
        host.editor_state.doc.pages = None;
        host.editor_state.doc.children = serde_json::from_value(serde_json::json!([
            {"type":"text", "id":"t", "content":"A中🙂Z", "x":30, "y":30, "width":200, "height":40, "fontSize":16}
        ])).unwrap();
        host.editor_state.mark_document_changed();
        host.editor_state_dirty = true;
        host.editor_state.set_single_selection(NodeId::new("t"));
        host.editor_state.viewport = Viewport::IDENTITY;
        assert!(host.editor_state.start_text_edit(NodeId::new("t")));
        host.last_viewport_w = 1200.0;
        host.last_viewport_h = 800.0;
        host.refresh_layout_scene();
        let (left, top, _, _) = host.canvas_region(1200.0, 800.0);
        assert!(host.start_text_edit_pointer(left + 40.0, top + 35.0, 1200.0, 800.0));
        assert!(host.move_text_edit_pointer(left + 60.0, top + 35.0));
        assert!(host.release_text_edit_pointer());
        host.prepare_text_edit_paint(&mut Backend);
        assert_eq!(
            host.editor_state.ui.text_edit_input.highlight_range(),
            Some((1, "A中🙂".len()))
        );
        let x = 1200.0 - host.editor_state.editor_ui.property_panel_width + 8.0;
        host.press_layout(x, 100.0, 1200.0, 800.0);
        let range = host
            .editor_state
            .ui
            .text_selection
            .as_ref()
            .expect("retained range");
        assert_eq!((range.start, range.end), (1, 3));
    }
}
