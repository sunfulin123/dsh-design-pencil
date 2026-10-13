use super::WidgetHost;
use op_editor_core::ThemeMode;

#[derive(Default)]
struct PanelPaintCapture {
    fills: Vec<(op_editor_ui::Rect, op_editor_ui::Color)>,
    texts: Vec<String>,
}

impl op_editor_ui::RenderBackend for PanelPaintCapture {
    fn begin_frame(&mut self) {}
    fn end_frame(&mut self) {}
    fn fill_rect(&mut self, rect: op_editor_ui::Rect, color: op_editor_ui::Color) {
        self.fills.push((rect, color));
    }
    fn stroke_rect(&mut self, _: op_editor_ui::Rect, _: op_editor_ui::Color, _: f32) {}
    fn draw_text(&mut self, layout: &op_editor_ui::TextLayout, _: op_editor_ui::Point2D) {
        self.texts
            .extend(layout.runs().iter().map(|run| run.content.clone()));
    }
    fn clip_rect(&mut self, _: op_editor_ui::Rect) {}
    fn stroke_line(
        &mut self,
        _: op_editor_ui::Point2D,
        _: op_editor_ui::Point2D,
        _: op_editor_ui::Color,
        _: f32,
    ) {
    }
    fn fill_round_rect(&mut self, _: op_editor_ui::Rect, _: f32, _: op_editor_ui::Color) {}
    fn stroke_round_rect(&mut self, _: op_editor_ui::Rect, _: f32, _: op_editor_ui::Color, _: f32) {
    }
    fn stroke_svg_path(
        &mut self,
        _: &str,
        _: op_editor_ui::Point2D,
        _: f32,
        _: op_editor_ui::Color,
        _: f32,
    ) {
    }
    fn save(&mut self) {}
    fn restore(&mut self) {}
    fn translate(&mut self, _: op_editor_ui::Point2D) {}
    fn resize(&mut self, _: u32, _: u32) {}
    fn dpi_scale(&self) -> f32 {
        1.0
    }
}

#[test]
fn managed_toolbar_hover_names_the_active_tool() {
    let mut host = WidgetHost::new();
    host.editor_state.editor_ui.embed = op_editor_core::EmbedHost::VsCode;
    host.editor_state
        .editor_ui
        .set_host_theme_override(Some(ThemeMode::Light));
    host.editor_state.editor_ui.toolbar_hover = Some(op_editor_core::ToolbarHover::Tool(
        op_editor_core::Tool::Select,
    ));
    let mut capture = PanelPaintCapture::default();
    host.paint_dyn(&mut capture, 1200.0, 800.0);
    let label = op_editor_ui::widgets::editor_state_ext::translate(
        &host.editor_state.editor_ui,
        "toolbar.select",
    );
    assert!(
        capture.texts.iter().any(|text| text == label),
        "active tools must also show a tooltip"
    );
}

#[test]
fn managed_panel_edges_are_borderless_and_cast_only_side_shadows() {
    use op_editor_ui::widgets::{host_canvas_geometry, TOP_BAR_HEIGHT};
    for mode in [ThemeMode::Light, ThemeMode::Dark] {
        for width in [800.0, 1200.0] {
            let mut host = WidgetHost::new();
            let document = jian_ops_schema::load_str(r#"{"version":"1.0.0","children":[{"type":"rectangle","id":"selected","width":100,"height":100}]}"#).unwrap().value;
            host.editor_state = op_editor_core::EditorState::from_document(document);
            host.editor_state
                .set_single_selection(op_editor_core::NodeId::new("selected"));
            host.editor_state.editor_ui.embed = op_editor_core::EmbedHost::VsCode;
            host.editor_state.editor_ui.sidebar_open = true;
            host.editor_state
                .editor_ui
                .set_host_theme_override(Some(mode));
            let (left, _, canvas_width, _) = host.canvas_region(width, 700.0);
            let property =
                host_canvas_geometry::property_panel_rect(&host.editor_state, width, 700.0);
            let mut capture = PanelPaintCapture::default();
            host.paint_dyn(&mut capture, width, 700.0);
            for boundary in [left - 1.0, property.origin.x] {
                let point = op_editor_ui::Point2D::new(boundary + 0.5, 100.0);
                let color = capture
                    .fills
                    .iter()
                    .rev()
                    .find(|(rect, color)| rect.contains(point) && color.a == 1.0)
                    .map(|(_, color)| *color);
                assert_eq!(
                    color,
                    Some(host.theme.card),
                    "panel edge must not retain a border"
                );
            }
            for top_x in [10.0, width - 10.0] {
                let point = op_editor_ui::Point2D::new(top_x, TOP_BAR_HEIGHT - 0.5);
                let color = capture
                    .fills
                    .iter()
                    .rev()
                    .find(|(rect, color)| rect.contains(point) && color.a == 1.0)
                    .map(|(_, color)| *color);
                assert_eq!(
                    color,
                    Some(host.theme.border),
                    "top bar must retain its bottom divider"
                );
            }
            assert!(
                !capture
                    .fills
                    .iter()
                    .any(|(rect, color)| rect.origin.y >= TOP_BAR_HEIGHT - 1.0
                        && rect.origin.y < TOP_BAR_HEIGHT + 6.0
                        && rect.size.x == width
                        && color.a > 0.0
                        && color.a < 1.0),
                "top bar must not cast a horizontal shadow"
            );
            for shadow_x in [left, left + canvas_width - 1.0] {
                assert!(
                    capture
                        .fills
                        .iter()
                        .any(|(rect, color)| rect.origin.x == shadow_x
                            && rect.origin.y == TOP_BAR_HEIGHT
                            && rect.size.x == 1.0
                            && color.a > 0.0
                            && color.a < 0.2),
                    "missing canvas-facing shadow at {shadow_x}"
                );
            }
        }
    }
}

#[test]
fn theme_cache_follows_editor_theme_mode() {
    let mut host = WidgetHost::new();

    host.editor_state.editor_ui.theme_mode = ThemeMode::Light;
    host.sync_theme_from_editor();
    assert!(
        host.theme.background.r > 0.9,
        "light mode should refresh the host theme cache"
    );

    host.editor_state.editor_ui.theme_mode = ThemeMode::Dark;
    host.sync_theme_from_editor();
    assert!(
        host.theme.background.r < 0.1,
        "dark mode should refresh the host theme cache"
    );
}

#[test]
fn theme_cache_follows_transient_host_override_without_mutating_preference() {
    let mut host = WidgetHost::new();
    host.editor_state.editor_ui.theme_mode = ThemeMode::Light;
    host.editor_state
        .editor_ui
        .set_host_theme_override(Some(ThemeMode::Dark));

    host.sync_theme_from_editor();

    assert!(host.theme.background.r < 0.1);
    assert_eq!(host.editor_state.editor_ui.theme_mode, ThemeMode::Light);
}
