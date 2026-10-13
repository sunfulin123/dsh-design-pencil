//! CanvasKit preview hover forwarding coverage.

#![cfg(all(test, feature = "canvaskit"))]

use super::WidgetHost;
use op_editor_core::EditorState;
use op_editor_ui::Point2D;
use std::collections::BTreeMap;

const VIEWPORT_W: f32 = 1000.0;
const VIEWPORT_H: f32 = 700.0;

fn document() -> jian_ops_schema::PenDocument {
    jian_ops_schema::load_str(
        r##"{
            "version":"1.1","formatVersion":"1.1","id":"hover",
            "app":{"name":"hover","version":"1","id":"hover"},
            "children":[{
                "type":"switch","id":"preview-switch","x":32,"y":24,
                "width":44,"height":24
            }]
        }"##,
    )
    .expect("web hover fixture parses")
    .value
}

fn screen_at(host: &WidgetHost, doc_x: f32, doc_y: f32) -> Point2D {
    let (canvas_x, canvas_y, _, _) = host.canvas_region(VIEWPORT_W, VIEWPORT_H);
    let viewport = host.editor_state.viewport;
    Point2D::new(
        canvas_x + viewport.pan_x + doc_x * viewport.zoom,
        canvas_y + viewport.pan_y + doc_y * viewport.zoom,
    )
}

#[test]
fn bare_web_cursor_move_sets_preview_session_hover() {
    let mut host = WidgetHost::new();
    host.editor_state = EditorState::from_document(document());
    host.editor_state.editor_ui.preview.mode = true;
    host.editor_state_dirty = true;
    host.last_viewport_w = VIEWPORT_W;
    host.last_viewport_h = VIEWPORT_H;
    let active_theme = BTreeMap::new();
    host.preview = Some(
        op_preview_core::PreviewSession::enter(
            &host.editor_state.doc,
            (VIEWPORT_W, VIEWPORT_H),
            &active_theme,
            0,
            false,
            false,
            jian_core::layout::measure::default_backend(),
            0,
        )
        .expect("web preview session"),
    );
    host.set_preview_device(
        op_editor_core::PreviewDeviceKind::Canvas,
        VIEWPORT_W,
        VIEWPORT_H,
    );
    host.editor_state_dirty = false;

    let point = screen_at(&host, 40.0, 36.0);
    assert!(host.apply_cursor_move(point.x, point.y));
    assert!(
        host.editor_state_dirty,
        "hover enter must request a repaint"
    );
    assert_eq!(
        host.preview
            .as_ref()
            .expect("preview session")
            .interaction()
            .hovered_node(),
        Some("preview-switch")
    );

    let empty = screen_at(&host, 160.0, 120.0);
    host.editor_state_dirty = false;
    let _ = host.apply_cursor_move(empty.x, empty.y);
    assert!(
        host.editor_state_dirty,
        "hover leave must request a repaint"
    );
    assert_eq!(
        host.preview.as_ref().unwrap().interaction().hovered_node(),
        None,
        "moving within the preview to a dead canvas area clears hover"
    );
}

fn preview_host() -> WidgetHost {
    let mut host = WidgetHost::new();
    host.editor_state = EditorState::from_document(document());
    host.editor_state.editor_ui.preview.mode = true;
    host.preview = Some(
        op_preview_core::PreviewSession::enter(
            &host.editor_state.doc,
            (VIEWPORT_W, VIEWPORT_H),
            &BTreeMap::new(),
            0,
            false,
            false,
            jian_core::layout::measure::default_backend(),
            0,
        )
        .unwrap(),
    );
    host
}

fn navigation_host() -> WidgetHost {
    let doc = jian_ops_schema::load_str(
        r#"{"version":"1.1","pages":[
        {"id":"page-a","name":"Page A","children":[
            {"type":"frame","id":"later","name":"Later","x":900,"y":200,"width":390,"height":1200},
            {"type":"frame","id":"earlier","name":"Earlier","x":0,"y":0,"width":640,"height":360},
            {"type":"frame","id":"hidden","visible":false,"width":100,"height":100}
        ]},
        {"id":"page-b","name":"Page B","children":[
            {"type":"frame","id":"other","name":"Other","width":400,"height":700}
        ]}
    ]}"#,
    )
    .unwrap()
    .value;
    let mut host = WidgetHost::new();
    host.editor_state = EditorState::from_document(doc);
    host.editor_state.selection.anchor = op_editor_core::NodeId::new("later");
    host.editor_state.viewport.pan_x = -9000.0;
    host.preview = Some(
        op_preview_core::PreviewSession::enter(
            &host.editor_state.doc,
            (VIEWPORT_W, VIEWPORT_H),
            &BTreeMap::new(),
            0,
            false,
            false,
            jian_core::layout::measure::default_backend(),
            0,
        )
        .unwrap(),
    );
    host.invalidate_layout_scene();
    host
}

#[test]
fn phone_preview_navigation_keeps_a_rotatable_device() {
    use op_editor_core::PreviewDeviceKind;
    let mut host = navigation_host();
    host.last_viewport_w = VIEWPORT_W;
    host.last_viewport_h = VIEWPORT_H;
    host.initialize_preview_browser(VIEWPORT_W, VIEWPORT_H);
    host.editor_state.editor_ui.enter_preview();
    host.initialize_device_preview(VIEWPORT_W, VIEWPORT_H);
    assert!(host.preview_go_to_frame(1, "other"));
    assert_eq!(host.browser_device_kind(), PreviewDeviceKind::Phone);
    assert!(host.preview_browser.device.is_some());
    let portrait = host.preview_screen_size();
    host.preview_browser.preferences.landscape = true;
    let landscape = host.preview_screen_size();
    assert_eq!(landscape, (portrait.1, portrait.0));
}

#[test]
fn preview_canvas_fit_keeps_all_page_frames_visible() {
    let mut host = navigation_host();
    host.last_viewport_w = VIEWPORT_W;
    host.last_viewport_h = VIEWPORT_H;
    host.initialize_preview_browser(VIEWPORT_W, VIEWPORT_H);
    host.editor_state.editor_ui.enter_preview();
    host.preview_browser.view = Some(op_editor_core::PreviewDeviceKind::Canvas);
    host.initialize_device_preview(VIEWPORT_W, VIEWPORT_H);
    let stage = host.preview_stage_rect(host.preview_canvas_rect(VIEWPORT_W, VIEWPORT_H));
    let frame = host.preview_device_frame.as_ref().unwrap();
    for id in ["earlier", "later"] {
        let bounds = host.preview_browser.canvas_scene.as_ref().unwrap().pages[0]
            .find(id)
            .unwrap()
            .bounds;
        let origin = frame.content_origin + bounds.origin * frame.fit;
        let end = origin + bounds.size * frame.fit;
        assert!(origin.x >= stage.origin.x && origin.y >= stage.origin.y);
        assert!(end.x <= stage.origin.x + stage.size.x && end.y <= stage.origin.y + stage.size.y);
    }
}

#[test]
fn preview_mode_switch_restores_each_inspection_position() {
    use op_editor_ui::widgets::preview_toolbar::{PreviewControl, PreviewToolbar};
    let mut host = navigation_host();
    host.last_viewport_w = VIEWPORT_W;
    host.last_viewport_h = VIEWPORT_H;
    host.initialize_preview_browser(VIEWPORT_W, VIEWPORT_H);
    host.editor_state.editor_ui.enter_preview();
    host.initialize_device_preview(VIEWPORT_W, VIEWPORT_H);
    host.preview_browser.pan = Point2D::new(80.0, 40.0);
    host.preview_set_zoom(Some(1.5));
    assert_eq!(host.preview_browser.pan, Point2D::new(80.0, 40.0));
    let canvas = host.preview_canvas_rect(VIEWPORT_W, VIEWPORT_H);
    for control in [PreviewControl::Canvas, PreviewControl::Phone] {
        let rect = PreviewToolbar::control_rects(canvas)
            .into_iter()
            .find(|entry| entry.0 == control)
            .unwrap()
            .1;
        host.preview_controls_press(
            rect.origin.x + 8.0,
            rect.origin.y + 8.0,
            VIEWPORT_W,
            VIEWPORT_H,
        );
        host.preview_controls_release();
    }
    assert_eq!(host.preview_browser.pan, Point2D::new(80.0, 40.0));
    assert_eq!(host.preview_browser.zoom, Some(1.5));
}

#[test]
fn preview_modes_and_blank_drag_preserve_document_and_camera() {
    use op_editor_core::PreviewDeviceKind;
    use op_editor_ui::widgets::preview_toolbar::{PreviewControl, PreviewToolbar};
    let mut host = navigation_host();
    host.last_viewport_w = VIEWPORT_W;
    host.last_viewport_h = VIEWPORT_H;
    assert!(host.initialize_preview_browser(VIEWPORT_W, VIEWPORT_H));
    host.editor_state.editor_ui.enter_preview();
    host.initialize_device_preview(VIEWPORT_W, VIEWPORT_H);
    let camera = host.editor_state.viewport;
    let document = host.editor_state.doc.clone();
    let canvas = host.preview_canvas_rect(VIEWPORT_W, VIEWPORT_H);
    for (control, kind) in [
        (PreviewControl::Desktop, PreviewDeviceKind::Desktop),
        (PreviewControl::Canvas, PreviewDeviceKind::Canvas),
        (PreviewControl::Phone, PreviewDeviceKind::Phone),
    ] {
        let rect = PreviewToolbar::control_rects(canvas)
            .into_iter()
            .find(|entry| entry.0 == control)
            .unwrap()
            .1;
        assert!(host.preview_controls_press(
            rect.origin.x + 8.0,
            rect.origin.y + 8.0,
            VIEWPORT_W,
            VIEWPORT_H
        ));
        host.preview_controls_release();
        assert_eq!(host.browser_device_kind(), kind);
    }
    assert!(host.apply_press(8.0, 140.0, VIEWPORT_W, VIEWPORT_H));
    host.preview_controls_hover(88.0, 180.0, VIEWPORT_W, VIEWPORT_H);
    assert_eq!(host.preview_browser.pan, Point2D::new(80.0, 40.0));
    host.preview_controls_release();
    host.set_space_pan(true);
    let frame = host.preview_device_frame.as_ref().unwrap().frame;
    assert!(host.apply_press(
        frame.origin.x + 20.0,
        frame.origin.y + 20.0,
        VIEWPORT_W,
        VIEWPORT_H
    ));
    assert!(host.preview_browser.pan_capture.is_some());
    host.preview_controls_release();
    host.set_space_pan(false);
    assert_eq!(host.editor_state.doc, document);
    assert_eq!(host.editor_state.viewport, camera);
}

#[test]
fn preview_wrapper_can_pan_at_fit_and_returns_from_present() {
    let mut host = navigation_host();
    host.last_viewport_w = VIEWPORT_W;
    host.last_viewport_h = VIEWPORT_H;
    assert!(host.initialize_preview_browser(VIEWPORT_W, VIEWPORT_H));
    host.editor_state.editor_ui.enter_preview();
    host.initialize_device_preview(VIEWPORT_W, VIEWPORT_H);
    let camera = host.editor_state.viewport;
    let document = host.editor_state.doc.clone();
    host.preview_browser.pan_capture = Some((Point2D::new(20.0, 100.0), Point2D::new(0.0, 0.0)));
    assert!(host.preview_controls_hover(100.0, 140.0, VIEWPORT_W, VIEWPORT_H));
    assert_eq!(host.preview_browser.pan, Point2D::new(80.0, 40.0));
    host.preview_controls_release();
    host.set_preview_presentation(true);
    host.set_preview_presentation(false);
    assert_eq!(host.preview_browser.pan, Point2D::new(80.0, 40.0));
    assert_eq!(host.editor_state.viewport, camera);
    assert_eq!(host.editor_state.doc, document);
}

#[test]
fn preview_navigation_starts_selected_and_clamps_in_reading_order() {
    let mut host = navigation_host();
    assert!(host.initialize_preview_browser(VIEWPORT_W, VIEWPORT_H));
    assert_eq!(
        host.preview.as_ref().unwrap().framed_root().unwrap().0,
        "later"
    );
    assert!(!host.preview_navigation_step(1));
    assert!(host.preview_navigation_step(-1));
    assert_eq!(
        host.preview.as_ref().unwrap().framed_root().unwrap().0,
        "earlier"
    );
    assert!(!host.preview_navigation_step(-1));
}

#[test]
fn managed_preview_zoom_and_device_changes_leave_editor_camera_unchanged() {
    let mut host = navigation_host();
    let camera = host.editor_state.viewport;
    let before = host.editor_state.doc.clone();
    host.last_viewport_w = VIEWPORT_W;
    host.last_viewport_h = VIEWPORT_H;
    assert!(host.initialize_preview_browser(VIEWPORT_W, VIEWPORT_H));
    host.editor_state.editor_ui.enter_preview();
    host.initialize_device_preview(VIEWPORT_W, VIEWPORT_H);
    host.preview_set_zoom(Some(2.0));
    assert_eq!(
        host.preview_device_frame.as_ref().unwrap().frame.size.x,
        780.0
    );
    host.preview_pick_device(None);
    assert_eq!(
        host.preview_device_frame.as_ref().unwrap().frame.size.x,
        780.0
    );
    assert_eq!(host.editor_state.viewport, camera);
    assert_eq!(host.editor_state.doc, before);
}

#[test]
fn managed_preview_trackpad_scroll_never_pans_editor_camera() {
    let mut host = navigation_host();
    let camera = host.editor_state.viewport;
    host.last_viewport_w = VIEWPORT_W;
    host.last_viewport_h = VIEWPORT_H;
    assert!(host.initialize_preview_browser(VIEWPORT_W, VIEWPORT_H));
    host.editor_state.editor_ui.enter_preview();
    host.initialize_device_preview(VIEWPORT_W, VIEWPORT_H);
    assert!(host.apply_pan_gesture(500.0, 300.0, 0.0, -40.0, VIEWPORT_W, VIEWPORT_H));
    assert!(host.preview_scroll_y > 0.0);
    assert_eq!(host.editor_state.viewport, camera);
}

#[test]
fn present_navigates_an_ordinary_document_without_deck_metadata() {
    let mut host = navigation_host();
    assert!(host.initialize_preview_browser(VIEWPORT_W, VIEWPORT_H));
    host.preview_browser.present = true;
    assert!(host.preview_slideshow_active());
    assert!(host.preview_slideshow_step(-1));
    assert!(!host.preview_slideshow_step(-1));
}

#[test]
fn preview_toolbar_opens_device_menu_and_switches_present_without_edits() {
    use op_editor_ui::widgets::preview_toolbar::{PreviewControl, PreviewMenu, PreviewToolbar};
    let mut host = navigation_host();
    host.last_viewport_w = VIEWPORT_W;
    host.last_viewport_h = VIEWPORT_H;
    assert!(host.initialize_preview_browser(VIEWPORT_W, VIEWPORT_H));
    host.editor_state.editor_ui.enter_preview();
    host.initialize_device_preview(VIEWPORT_W, VIEWPORT_H);
    let before = host.editor_state.doc.clone();
    let canvas = host.preview_canvas_rect(VIEWPORT_W, VIEWPORT_H);
    let mut click = |control| {
        let rect = PreviewToolbar::control_rects(canvas)
            .into_iter()
            .find(|entry| entry.0 == control)
            .unwrap()
            .1;
        assert!(host.preview_controls_press(
            rect.origin.x + 8.0,
            rect.origin.y + 8.0,
            VIEWPORT_W,
            VIEWPORT_H
        ));
        assert!(host.preview_controls_release());
    };
    click(PreviewControl::Device);
    assert_eq!(host.preview_browser.menu, Some(PreviewMenu::Device));
    host.preview_browser.menu = None;
    let rect = PreviewToolbar::control_rects(canvas)
        .into_iter()
        .find(|entry| entry.0 == PreviewControl::Present)
        .unwrap()
        .1;
    assert!(host.preview_controls_press(
        rect.origin.x + 8.0,
        rect.origin.y + 8.0,
        VIEWPORT_W,
        VIEWPORT_H
    ));
    assert!(host.preview_controls_release());
    assert!(host.preview_browser.present);
    assert_eq!(host.preview_browser.zoom, None);
    assert_eq!(host.editor_state.doc, before);
}

#[test]
fn preview_cross_page_navigation_keeps_editor_page_and_document() {
    let mut host = navigation_host();
    let before = host.editor_state.doc.clone();
    assert!(host.initialize_preview_browser(VIEWPORT_W, VIEWPORT_H));
    assert!(host.preview_go_to_frame(1, "other"));
    assert_eq!(
        host.preview.as_ref().unwrap().framed_root().unwrap().0,
        "other"
    );
    assert_eq!(host.editor_state.ui.active_page_index, 0);
    assert_eq!(host.editor_state.doc, before);
    host.finish_exit_teardown();
    assert_eq!(host.editor_state.viewport.pan_x, -9000.0);
}

#[test]
fn preview_exit_restores_editor_camera_without_document_changes() {
    let mut host = preview_host();
    let original = op_editor_core::Viewport {
        pan_x: -8000.0,
        pan_y: 9000.0,
        zoom: 0.3,
    };
    host.preview_editor_viewport = Some(original);
    host.editor_state.viewport = op_editor_core::Viewport::IDENTITY;
    let before = host.editor_state.doc.clone();
    host.finish_exit_teardown();
    assert_eq!(host.editor_state.viewport, original);
    assert_eq!(host.editor_state.doc, before);
    assert!(host.preview_editor_viewport.is_none());
}

#[test]
fn preview_without_frames_shows_an_explicit_hint() {
    let mut host = preview_host();
    assert!(!host.initialize_preview_browser(VIEWPORT_W, VIEWPORT_H));
    assert_eq!(
        host.editor_state
            .editor_ui
            .visible_toast(0)
            .unwrap()
            .i18n_key,
        "preview.emptyPage"
    );
    assert!(!host.editor_state.editor_ui.preview.mode);
}

#[test]
fn present_controls_schedule_one_idle_hide_and_wake_on_pointer_motion() {
    let mut host = navigation_host();
    assert!(host.initialize_preview_browser(VIEWPORT_W, VIEWPORT_H));
    host.set_preview_presentation(true);
    assert_eq!(host.preview_controls_wake_deadline_ms(), Some(2000));
    host.set_now_ms(2000);
    assert!(!host.preview_controls_visible());
    assert_eq!(host.preview_controls_wake_deadline_ms(), None);
    host.preview_controls_hover(500.0, 300.0, VIEWPORT_W, VIEWPORT_H);
    assert!(host.preview_controls_visible());
    assert_eq!(host.preview_controls_wake_deadline_ms(), Some(4000));
}

#[test]
fn routed_preview_starts_selected_screen_and_navigates_without_editor_edits() {
    let doc = jian_ops_schema::load_str(
        r#"{"version":"1.1","children":[
        {"type":"frame","id":"home","screen":"/home","width":390,"height":844},
        {"type":"frame","id":"detail","screen":"/detail","x":500,"width":390,"height":844}
    ]}"#,
    )
    .unwrap()
    .value;
    let mut host = WidgetHost::new();
    host.editor_state = EditorState::from_document(doc.clone());
    host.editor_state.selection.anchor = op_editor_core::NodeId::new("detail");
    host.preview = Some(
        op_preview_core::PreviewSession::enter(
            &doc,
            (VIEWPORT_W, VIEWPORT_H),
            &BTreeMap::new(),
            0,
            false,
            false,
            jian_core::layout::measure::default_backend(),
            0,
        )
        .unwrap(),
    );
    assert!(host.initialize_preview_browser(VIEWPORT_W, VIEWPORT_H));
    assert_eq!(
        host.preview.as_ref().unwrap().framed_root().unwrap().0,
        "detail"
    );
    assert!(host.preview_navigation_step(-1));
    assert_eq!(
        host.preview.as_ref().unwrap().framed_root().unwrap().0,
        "home"
    );
    assert!(host.preview_navigation_step(1));
    assert_eq!(
        host.preview.as_ref().unwrap().framed_root().unwrap().0,
        "detail"
    );
    assert_eq!(host.editor_state.doc, doc);
}

#[test]
fn preview_owns_full_viewport_without_editor_rails() {
    let host = preview_host();
    assert_eq!(
        host.canvas_region(VIEWPORT_W, VIEWPORT_H),
        (0.0, 0.0, VIEWPORT_W, VIEWPORT_H)
    );
}

#[test]
fn preview_pointer_cannot_activate_hidden_editor_controls() {
    let mut host = preview_host();
    host.editor_state.tool = op_editor_core::Tool::Rect;
    let before = host.editor_state.doc.clone();
    let _ = host.apply_press(274.0, 194.0, VIEWPORT_W, VIEWPORT_H);
    assert_eq!(host.editor_state.tool, op_editor_core::Tool::Rect);
    let _ = host.apply_right_press(80.0, 160.0, VIEWPORT_W, VIEWPORT_H);
    assert!(host.editor_state.editor_ui.layer_context_menu.is_none());
    assert_eq!(host.editor_state.doc, before);
    assert!(host.create_drag.is_none());
    assert!(host.node_drag.is_none());
}

#[test]
fn preview_device_buttons_switch_without_editing_document() {
    let mut host = preview_host();
    let before = host.editor_state.doc.clone();
    let canvas = host.preview_canvas_rect(VIEWPORT_W, VIEWPORT_H);
    for (device, rect) in op_editor_ui::widgets::PreviewDeviceSwitcher::segment_rects(canvas) {
        let point = Point2D::new(
            rect.origin.x + rect.size.x / 2.0,
            rect.origin.y + rect.size.y / 2.0,
        );
        assert!(host.apply_press(point.x, point.y, VIEWPORT_W, VIEWPORT_H));
        assert!(host.apply_release_with_viewport(VIEWPORT_W, VIEWPORT_H));
        assert_eq!(host.editor_state.editor_ui.preview.device, Some(device));
        assert_eq!(host.editor_state.doc, before);
    }
}
