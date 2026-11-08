use super::WidgetHost;
use op_editor_core::{EditorCommand, NodeId, Viewport};
use op_editor_ui::{Color, Point2D, Rect, RenderBackend, TextLayout};

fn scaled_host(percent: u16) -> WidgetHost {
    let mut host = WidgetHost::new();
    let doc = jian_ops_schema::load_str(
        r##"{"version":"1.0.0","children":[{"type":"rectangle","id":"box","x":100,"y":100,"width":80,"height":60,"fill":[{"type":"solid","color":"#ff0000"}]}]}"##,
    ).unwrap().value;
    host.editor_state = op_editor_core::EditorState::from_document(doc);
    host.editor_state
        .apply(EditorCommand::SetUiScale { percent });
    host.mark_dirty();
    host
}

#[test]
fn percentage_menu_changes_interface_scale_without_camera_content_or_history_changes() {
    for percent in [100, 110, 125, 150] {
        let mut host = scaled_host(percent);
        host.editor_state.editor_ui.locale = op_editor_core::Locale::EnUs;
        let width = 1440.0;
        let height = 900.0;
        host.paint_dyn(&mut Capture::default(), width, height);
        let scale = percent as f32 / 100.0;
        let bar = host.status_bar_rect(width / scale, height / scale).unwrap();
        let document = host.editor_state.doc.clone();
        let camera = host.editor_state.viewport;
        let history = host.editor_state.history.past.len();
        host.apply_press(
            (bar.origin.x + 88.0) * scale,
            (bar.origin.y + 16.0) * scale,
            width,
            height,
        );
        host.apply_release_with_viewport(width, height);
        let mut painted = Capture::default();
        host.paint_dyn(&mut painted, width, height);
        assert!(
            painted.texts.iter().any(|text| text == "Interface scale"),
            "the zoom percentage must open reachable view controls"
        );
        let menu_x = (bar.origin.x + bar.size.x - 240.0).max(8.0);
        let menu_y = (bar.origin.y - 132.0).max(8.0);
        host.apply_press(
            (menu_x + 202.0) * scale,
            (menu_y + 98.0) * scale,
            width,
            height,
        );
        assert_eq!(host.editor_state.editor_ui.ui_scale.percent(), 150);
        assert_eq!(host.editor_state.doc, document);
        assert_eq!(host.editor_state.viewport, camera);
        assert_eq!(host.editor_state.history.past.len(), history);
    }
}

#[test]
fn view_menu_keyboard_selects_every_scale_at_desktop_and_mobile_sizes() {
    for (width, height) in [(1440.0, 900.0), (390.0, 844.0)] {
        for initial in [100, 110, 125, 150] {
            for (index, target) in [100, 110, 125, 150].into_iter().enumerate() {
                let mut host = scaled_host(initial);
                host.paint_dyn(&mut Capture::default(), width, height);
                let document = host.editor_state.doc.clone();
                let camera = host.editor_state.viewport;
                let revision = host.editor_state.document_revision();
                assert!(host.view_options_key("0", true, false, true));
                assert!(host.editor_state.editor_ui.view_options_open);
                host.view_options_key("Home", false, false, false);
                for _ in 0..=index {
                    host.view_options_key("ArrowRight", false, false, false);
                }
                host.view_options_key("Enter", false, false, false);
                assert_eq!(host.editor_state.editor_ui.ui_scale.percent(), target);
                assert!(!host.editor_state.editor_ui.view_options_open);
                assert_eq!(host.editor_state.doc, document);
                assert_eq!(host.editor_state.viewport, camera);
                assert_eq!(host.editor_state.document_revision(), revision);
                assert!(!host.editor_state.apply(EditorCommand::Undo));
            }
        }
    }
}

#[test]
fn view_menu_keyboard_cancels_and_defers_to_modals_and_command_shortcuts() {
    let mut host = scaled_host(125);
    host.paint_dyn(&mut Capture::default(), 1440.0, 900.0);
    host.view_options_key("0", true, false, true);
    host.view_options_key("End", false, false, false);
    assert_eq!(host.editor_state.editor_ui.view_options_focus, 4);
    host.view_options_key("Tab", false, true, false);
    assert_eq!(host.editor_state.editor_ui.view_options_focus, 3);
    assert!(host.view_options_key("Escape", false, false, false));
    assert!(!host.editor_state.editor_ui.view_options_open);
    assert_eq!(host.editor_state.editor_ui.ui_scale.percent(), 125);
    host.view_options_key("0", true, false, true);
    assert!(!host.view_options_key("z", false, false, true));
    assert!(!host.editor_state.editor_ui.view_options_open);
    host.view_options_key("0", true, false, true);
    host.editor_state.editor_ui.agent_settings_open = true;
    assert!(!host.view_options_key("Enter", false, false, false));
    assert!(!host.editor_state.editor_ui.view_options_open);
    host.view_options_key("0", true, false, true);
    assert!(!host.editor_state.editor_ui.view_options_open);
}

#[test]
fn scaled_text_inspector_markdown_accepts_real_host_input_and_one_undo() {
    check_text_inspector_host_input(1440.0, 900.0, false);
}

#[test]
fn scaled_touch_text_inspector_uses_its_painted_sheet_for_input_and_actions() {
    check_text_inspector_host_input(390.0, 844.0, true);
}

fn check_text_inspector_host_input(width: f32, height: f32, touch: bool) {
    use op_editor_core::PropertyFocus;
    use op_editor_ui::widgets::{PropertyPanel, PropertyPanelAction};

    let mut host = scaled_host(125);
    host.editor_state.editor_ui.touch = touch;
    host.editor_state.doc.children = vec![serde_json::from_str(
        r#"{"type":"text","id":"title","content":"Design tools","fontSize":28,"width":380,"height":90}"#,
    )
    .unwrap()];
    host.editor_state.selection.set = vec![NodeId::new("title")];
    host.editor_state.selection.anchor = NodeId::new("title");
    host.editor_state.editor_ui.property_panel_scroll.offset = if touch { 960.0 } else { 640.0 };
    host.mark_dirty();
    host.paint_dyn(&mut Capture::default(), width, height);
    let rect = op_editor_ui::widgets::host_canvas_geometry::property_panel_rect(
        &host.editor_state,
        width / 1.25,
        height / 1.25,
    );
    let panel = PropertyPanel::for_selection(&host.editor_state).unwrap();
    let x = rect.origin.x + 100.0;
    let input_y = (rect.origin.y as u32..720)
        .find(|y| {
            panel.hit_test(rect, Point2D::new(x, *y as f32)) == Some(PropertyFocus::TextDesign(0))
        })
        .expect("scrolled Markdown input is reachable") as f32;
    let button_y = (rect.origin.y as u32..720)
        .find(|y| {
            panel.hit_test_action(rect, Point2D::new(x, *y as f32))
                == Some(PropertyPanelAction::ApplyTextMarkdown)
        })
        .expect("scrolled Markdown action is reachable") as f32;
    let original = host.editor_state.doc.clone();
    host.apply_press(x * 1.25, (input_y + 10.0) * 1.25, width, height);
    host.apply_release_with_viewport(width, height);
    assert_eq!(
        host.editor_state.ui.property_focus,
        Some(PropertyFocus::TextDesign(0))
    );
    host.apply_select_all();
    assert!(host.apply_paste_text("**中🙂**"));
    host.apply_press(x * 1.25, (button_y + 10.0) * 1.25, width, height);
    host.apply_release_with_viewport(width, height);
    let jian_ops_schema::node::PenNode::Text(text) = host.editor_state.selected_node().unwrap()
    else {
        panic!("inline Markdown must preserve the text node")
    };
    let jian_ops_schema::node::TextContent::Styled(runs) = &text.content else {
        panic!("Markdown must produce styled text")
    };
    assert_eq!(runs[0].text, "中🙂");
    assert_eq!(runs[0].font_weight, Some(700));
    assert!(host.editor_state.apply(EditorCommand::Undo));
    assert_eq!(host.editor_state.doc, original);
}

#[test]
fn markdown_inspector_preserves_multiline_paste_and_enter_without_editing_the_document() {
    let mut host = scaled_host(125);
    host.editor_state.doc.children = vec![serde_json::from_str(
        r#"{"type":"text","id":"title","content":"Original","width":380}"#,
    )
    .unwrap()];
    host.editor_state.selection.set = vec![NodeId::new("title")];
    host.editor_state.selection.anchor = NodeId::new("title");
    host.editor_state.ui.property_focus = Some(op_editor_core::PropertyFocus::TextDesign(0));
    host.editor_state.ui.property_input.set_text("");
    let original = host.editor_state.doc.clone();
    assert!(host.apply_clipboard_text("# Heading\r\n\r\n- 中🙂\n\t- Nested"));
    assert_eq!(
        host.editor_state.ui.property_input.text(),
        "# Heading\n\n- 中🙂\n\t- Nested"
    );
    assert!(host.apply_send());
    assert!(host.editor_state.ui.property_input.text().ends_with('\n'));
    assert_eq!(
        host.editor_state.ui.property_focus,
        Some(op_editor_core::PropertyFocus::TextDesign(0))
    );
    assert_eq!(host.editor_state.doc, original);
    assert!(!host.editor_state.history.can_undo());
}

#[test]
fn scaled_chrome_hit_test_and_canvas_geometry_use_the_same_units() {
    for percent in [100, 110, 125, 150] {
        let mut host = scaled_host(percent);
        let scale = percent as f32 / 100.0;
        let mut backend = Capture::default();
        host.paint_dyn(&mut backend, 1440.0, 900.0);
        assert!(backend.texts.iter().any(|text| text == "100%"));
        assert!((host.last_viewport_w * scale - 1440.0).abs() < 0.01);
        // The authored rectangle is still 80×60 screen pixels at 100% canvas zoom.
        assert!(backend.fills.iter().any(|(rect, color)| color.r == 1.0
            && color.g == 0.0
            && (rect.size.x - 80.0).abs() < 0.01
            && (rect.size.y - 60.0).abs() < 0.01));
        // A click at the scaled rail/canvas offset hits the authored node.
        let (left, top, _, _) =
            host.with_ui_scale(|host, _| host.canvas_region(1440.0 / scale, 900.0 / scale));
        host.apply_press(left * scale + 120.0, top * scale + 120.0, 1440.0, 900.0);
        assert!(host.editor_state.selection.contains(&NodeId::new("box")));
        host.apply_release_with_viewport(1440.0, 900.0);
        let rect = backend.fills.iter().find(|(r, c)| {
            r.origin.x == 0.0
                && r.origin.y == 0.0
                && (r.size.y - op_editor_ui::widgets::TOP_BAR_HEIGHT * scale).abs() < 0.01
                && *c == host.theme.background
        });
        assert!(rect.is_some(), "top bar paint must grow with chrome");
        assert_eq!(host.editor_state.viewport, Viewport::IDENTITY);
    }
}

#[test]
fn scaled_shape_drags_author_screen_sized_geometry_not_chrome_units() {
    for percent in [110, 125, 150] {
        let mut host = scaled_host(percent);
        host.editor_state.active_children_mut().clear();
        host.editor_state.tool = op_editor_core::Tool::Frame;
        host.mark_dirty();
        host.paint_dyn(&mut Capture::default(), 1440.0, 900.0);
        let scale = percent as f32 / 100.0;
        let (left, top, _, _) =
            host.with_ui_scale(|host, _| host.canvas_region(1440.0 / scale, 900.0 / scale));
        host.apply_press(left * scale + 100.0, top * scale + 100.0, 1440.0, 900.0);
        host.apply_cursor_move(left * scale + 260.0, top * scale + 190.0);
        host.apply_release_with_viewport(1440.0, 900.0);
        let node = host.editor_state.active_children().first().unwrap();
        let bounds = op_editor_core::own_bounds(node);
        for (actual, expected) in [
            (bounds.x, 100.0),
            (bounds.y, 100.0),
            (bounds.w, 160.0),
            (bounds.h, 90.0),
        ] {
            assert!(
                (actual - expected).abs() < 0.01,
                "{actual} != {expected} at {percent}%"
            );
        }
    }
}

#[test]
fn scaled_topbar_controls_hit_their_painted_targets() {
    for percent in [100, 110, 125, 150] {
        let mut host = scaled_host(percent);
        let scale = percent as f32 / 100.0;
        host.paint_dyn(&mut Capture::default(), 1440.0, 900.0);
        let rect = host
            .top_bar()
            .button_rect(
                host.top_bar_rect(1440.0 / scale),
                op_editor_core::TopBarButton::ToggleSidebar,
            )
            .unwrap();
        let center = (rect.origin + rect.size / 2.0) * scale;
        host.apply_cursor_move(center.x, center.y);
        assert_eq!(
            host.editor_state.editor_ui.topbar_button_hover,
            Some(op_editor_core::TopBarButton::ToggleSidebar)
        );
        let open = host.editor_state.editor_ui.sidebar_open;
        host.apply_press(center.x, center.y, 1440.0, 900.0);
        host.apply_release_with_viewport(1440.0, 900.0);
        assert_ne!(host.editor_state.editor_ui.sidebar_open, open);
    }
}

#[test]
fn ui_scale_preserves_pan_distance_and_zoom_anchor_in_css_pixels() {
    for percent in [100, 110, 125, 150] {
        let mut host = scaled_host(percent);
        let scale = percent as f32 / 100.0;
        host.apply_pan_gesture(700.0, 400.0, 30.0, -20.0, 1440.0, 900.0);
        assert!((host.editor_state.viewport.pan_x - 30.0).abs() < 0.001);
        assert!((host.editor_state.viewport.pan_y + 20.0).abs() < 0.001);
        let before = host.editor_state.viewport;
        let (left, top, _, _) =
            host.with_ui_scale(|host, _| host.canvas_region(1440.0 / scale, 900.0 / scale));
        let local = Point2D::new(700.0 - left * scale, 400.0 - top * scale);
        let world = (local - Point2D::new(before.pan_x, before.pan_y)) / before.zoom;
        host.apply_wheel(700.0, 400.0, 40.0, 1440.0, 900.0);
        let after = host.editor_state.viewport;
        let world_after = (local - Point2D::new(after.pan_x, after.pan_y)) / after.zoom;
        assert!((world - world_after).length() < 0.001);
        assert!(after.zoom > before.zoom);
        host.editor_state.viewport.zoom = Viewport::MAX_ZOOM;
        host.apply_wheel(700.0, 400.0, 1000.0, 1440.0, 900.0);
        assert_eq!(host.editor_state.viewport.zoom, Viewport::MAX_ZOOM);
    }
}

#[test]
fn repeated_scaled_paint_has_no_document_history_or_camera_side_effects() {
    let mut host = scaled_host(125);
    let doc = serde_json::to_string(&host.editor_state.doc).unwrap();
    let camera = Viewport {
        pan_x: 123.456,
        pan_y: -98.765,
        zoom: 0.777,
    };
    host.editor_state.viewport = camera;
    let revision = host.editor_state.document_revision();
    for _ in 0..10 {
        host.paint_dyn(&mut Capture::default(), 1440.0, 900.0);
        assert_eq!(host.editor_state.viewport, camera);
    }
    assert_eq!(serde_json::to_string(&host.editor_state.doc).unwrap(), doc);
    assert_eq!(host.editor_state.document_revision(), revision);
    assert!(!host.editor_state.apply(EditorCommand::Undo));
}

#[derive(Default)]
struct Capture {
    scale: f32,
    origin: Point2D,
    stack: Vec<(f32, Point2D)>,
    fills: Vec<(Rect, Color)>,
    texts: Vec<String>,
}

impl RenderBackend for Capture {
    fn begin_frame(&mut self) {}
    fn end_frame(&mut self) {}
    fn fill_rect(&mut self, mut rect: Rect, color: Color) {
        let s = if self.scale == 0.0 { 1.0 } else { self.scale };
        rect.origin = rect.origin * s + self.origin;
        rect.size *= s;
        self.fills.push((rect, color));
    }
    fn stroke_rect(&mut self, _: Rect, _: Color, _: f32) {}
    fn draw_text(&mut self, layout: &TextLayout, _: Point2D) {
        self.texts
            .extend(layout.runs().iter().map(|run| run.content.clone()));
    }
    fn clip_rect(&mut self, _: Rect) {}
    fn stroke_line(&mut self, _: Point2D, _: Point2D, _: Color, _: f32) {}
    fn fill_round_rect(&mut self, rect: Rect, _: f32, color: Color) {
        self.fill_rect(rect, color);
    }
    fn stroke_round_rect(&mut self, _: Rect, _: f32, _: Color, _: f32) {}
    fn stroke_svg_path(&mut self, _: &str, _: Point2D, _: f32, _: Color, _: f32) {}
    fn save(&mut self) {
        self.stack.push((self.scale, self.origin));
    }
    fn restore(&mut self) {
        (self.scale, self.origin) = self.stack.pop().unwrap();
    }
    fn translate(&mut self, p: Point2D) {
        self.origin += p * if self.scale == 0.0 { 1.0 } else { self.scale };
    }
    fn scale(&mut self, scale: Point2D, pivot: Point2D) {
        self.translate(pivot);
        self.scale = if self.scale == 0.0 {
            scale.x
        } else {
            self.scale * scale.x
        };
        self.translate(-pivot);
    }
    fn resize(&mut self, _: u32, _: u32) {}
    fn dpi_scale(&self) -> f32 {
        1.0
    }
}
