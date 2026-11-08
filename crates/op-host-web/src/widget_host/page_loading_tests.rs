use super::WidgetHost;
use op_editor_core::Locale;
use op_editor_ui::{Color, Point2D, Rect, RenderBackend, TextLayout};

#[derive(Default)]
struct TextCaptureBackend {
    texts: Vec<String>,
}

impl RenderBackend for TextCaptureBackend {
    fn begin_frame(&mut self) {}
    fn end_frame(&mut self) {}
    fn fill_rect(&mut self, _: Rect, _: Color) {}
    fn stroke_rect(&mut self, _: Rect, _: Color, _: f32) {}
    fn draw_text(&mut self, layout: &TextLayout, _: Point2D) {
        self.texts
            .extend(layout.runs().iter().map(|run| run.content.clone()));
    }
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
}

fn host_with_pages(heavy_layers: usize) -> WidgetHost {
    let heavy: Vec<serde_json::Value> = (0..heavy_layers)
        .map(|i| serde_json::json!({"type": "rectangle", "id": format!("r{i}"), "width": 4, "height": 4}))
        .collect();
    let doc = serde_json::from_value(serde_json::json!({
        "version": "1.0.0",
        "children": [],
        "pages": [
            {"id": "small", "name": "Small", "children": [{"type": "rectangle", "id": "s", "width": 4, "height": 4}]},
            {"id": "big", "name": "Big", "children": [{"type": "frame", "id": "board", "width": 400, "height": 400, "children": heavy}]}
        ]
    }))
    .expect("document");
    let mut host = WidgetHost::new();
    host.editor_state = op_editor_core::EditorState::from_document(doc);
    host.editor_state.editor_ui.locale = Locale::ZhCn;
    host.scene_cache.invalidate();
    host.mark_editor_state_dirty();
    host.paint_editor(&mut TextCaptureBackend::default(), 1200.0, 800.0);
    host
}

fn switch_and_paint(host: &mut WidgetHost, page: usize) -> Vec<String> {
    host.editor_state.ui.active_page_index = page;
    host.mark_editor_state_dirty();
    let mut backend = TextCaptureBackend::default();
    host.paint_editor(&mut backend, 1200.0, 800.0);
    backend.texts
}

#[test]
fn switching_to_a_heavy_page_paints_the_cover_before_rebuilding() {
    let mut host = host_with_pages(2_500);
    assert_eq!(host.scene_page_index, 0);

    let first = switch_and_paint(&mut host, 1);
    assert!(first.iter().any(|t| t == "正在加载页面…"), "{first:?}");
    assert_eq!(
        host.scene_page_index, 0,
        "the rebuild waits for the next frame"
    );

    let second = {
        let mut backend = TextCaptureBackend::default();
        host.paint_editor(&mut backend, 1200.0, 800.0);
        backend.texts
    };
    assert!(!second.iter().any(|t| t == "正在加载页面…"), "{second:?}");
    assert_eq!(
        host.scene_page_index, 1,
        "the following frame builds the page"
    );
}

#[test]
fn switching_to_a_light_page_rebuilds_immediately_without_a_cover() {
    let mut host = host_with_pages(2_500);
    switch_and_paint(&mut host, 1);
    switch_and_paint(&mut host, 1);
    let texts = switch_and_paint(&mut host, 0);
    assert!(!texts.iter().any(|t| t == "正在加载页面…"), "{texts:?}");
    assert_eq!(host.scene_page_index, 0);
}

#[test]
fn a_page_click_returns_without_building_then_covers_then_builds_and_fits() {
    let mut host = host_with_pages(2_500);
    let camera_before = host.editor_state.viewport;

    // The click: switch + deferred fit. No scene work may happen here.
    assert!(host.editor_state.set_active_page(1));
    host.fit_active_page_after_switch(1200.0, 800.0);
    assert_eq!(
        host.scene_page_index, 0,
        "the click handler must not build the page"
    );

    // A hover hit-test between the click and the next frame also waits.
    host.refresh_layout_scene();
    assert_eq!(
        host.scene_page_index, 0,
        "input paths must not build before the cover"
    );

    let mut first = TextCaptureBackend::default();
    host.paint_editor(&mut first, 1200.0, 800.0);
    assert!(
        first.texts.iter().any(|t| t == "正在加载页面…"),
        "{:?}",
        first.texts
    );
    assert_eq!(host.scene_page_index, 0);
    assert_eq!(
        host.editor_state.viewport, camera_before,
        "fit waits for the scene"
    );

    let mut second = TextCaptureBackend::default();
    host.paint_editor(&mut second, 1200.0, 800.0);
    assert_eq!(
        host.scene_page_index, 1,
        "the following frame builds the page"
    );
    assert!(host.pending_page_fit.is_none(), "the deferred fit ran");
    assert_ne!(
        host.editor_state.viewport, camera_before,
        "the camera framed the new page"
    );
    assert!(!second.texts.iter().any(|t| t == "正在加载页面…"));
}

/// Opt-in timing on a large real document (`DSH_REAL_DOC`, no data in repo):
/// `cargo test -p op-host-web --release --lib --features canvaskit real_page_switch_timing -- --ignored --nocapture`
#[test]
#[ignore = "needs DSH_REAL_DOC"]
fn real_page_switch_timing() {
    let Ok(path) = std::env::var("DSH_REAL_DOC") else {
        return;
    };
    let value: serde_json::Value =
        serde_json::from_str(&std::fs::read_to_string(path).expect("read")).expect("json");
    let doc = serde_json::from_value(value.get("document").cloned().unwrap_or(value)).expect("doc");
    let mut host = WidgetHost::new();
    host.editor_state = op_editor_core::EditorState::from_document(doc);
    host.scene_cache.invalidate();
    host.mark_editor_state_dirty();
    host.paint_editor(&mut TextCaptureBackend::default(), 1440.0, 900.0);
    let page: usize = std::env::var("DSH_PROBE_PAGE")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(5);
    let started = std::time::Instant::now();
    host.editor_state.set_active_page(page);
    host.fit_active_page_after_switch(1440.0, 900.0);
    let click_ms = started.elapsed().as_millis();
    let started = std::time::Instant::now();
    let mut cover = TextCaptureBackend::default();
    host.paint_editor(&mut cover, 1440.0, 900.0);
    let cover_ms = started.elapsed().as_millis();
    let covered = cover
        .texts
        .iter()
        .any(|t| t == "正在加载页面…" || t == "Loading page…");
    let started = std::time::Instant::now();
    host.paint_editor(&mut TextCaptureBackend::default(), 1440.0, 900.0);
    let build_ms = started.elapsed().as_millis();
    let started = std::time::Instant::now();
    host.mark_editor_state_dirty();
    host.paint_editor(&mut TextCaptureBackend::default(), 1440.0, 900.0);
    let steady_ms = started.elapsed().as_millis();
    println!("PROBE page={page} click_ms={click_ms} cover_frame_ms={cover_ms} covered={covered} build_frame_ms={build_ms} steady_frame_ms={steady_ms}");
    // Back to the first page, then return: the retained scene makes it instant.
    host.editor_state.set_active_page(0);
    host.fit_active_page_after_switch(1440.0, 900.0);
    host.paint_editor(&mut TextCaptureBackend::default(), 1440.0, 900.0);
    host.paint_editor(&mut TextCaptureBackend::default(), 1440.0, 900.0);
    let started = std::time::Instant::now();
    host.editor_state.set_active_page(page);
    host.fit_active_page_after_switch(1440.0, 900.0);
    let mut back = TextCaptureBackend::default();
    host.paint_editor(&mut back, 1440.0, 900.0);
    let covered_again = back
        .texts
        .iter()
        .any(|t| t == "正在加载页面…" || t == "Loading page…");
    println!(
        "PROBE page={page} switch_back_frame_ms={} covered_again={covered_again}",
        started.elapsed().as_millis()
    );
}

#[test]
fn an_offscreen_check_during_a_deferred_build_fits_once_the_scene_exists() {
    let mut host = host_with_pages(10);
    let mut backend = TextCaptureBackend::default();
    host.paint_editor(&mut backend, 1200.0, 800.0);
    host.last_viewport_w = 1200.0;
    host.last_viewport_h = 800.0;
    // A saved camera far from every node, applied while the scene is stale.
    host.editor_state.viewport.pan_x = -90_000.0;
    host.editor_state.viewport.pan_y = -90_000.0;
    host.editor_state_dirty = true;
    host.page_cover_frame = true;
    assert!(
        !host.fit_if_content_offscreen(),
        "no scene yet: nothing to fit against"
    );
    assert!(host.pending_offscreen_fit);
    host.page_cover_frame = false;
    host.paint_editor(&mut backend, 1200.0, 800.0);
    assert!(!host.pending_offscreen_fit);
    assert!(
        host.editor_state.viewport.pan_x > -10_000.0,
        "the camera was framed on content"
    );
}
