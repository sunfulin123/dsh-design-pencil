//! Text capture tests for `widgets::property_panel`.

use super::property_panel::PropertyPanel;
use super::property_panel_text_input::paint_text_input_view_value;
use crate::theme::Theme;
use crate::widgets::{PaintCx, Widget};
use crate::{Color, Point2D, Rect, TextLayout};
use jian_core::text_input::TextInputState;
use op_editor_core::{EditorState, Locale, PropertyFocus, PropertyTab};

#[derive(Default)]
struct TextCaptureBackend {
    texts: Vec<String>,
    origins: Vec<(String, Point2D)>,
}

#[derive(Default)]
struct RoundFillBackend {
    fills: Vec<(Rect, f32, Color)>,
}

impl crate::RenderBackend for TextCaptureBackend {
    fn begin_frame(&mut self) {}
    fn end_frame(&mut self) {}
    fn fill_rect(&mut self, _: Rect, _: Color) {}
    fn stroke_rect(&mut self, _: Rect, _: Color, _: f32) {}
    fn draw_text(&mut self, layout: &TextLayout, origin: Point2D) {
        if let Some(run) = layout.runs().first() {
            self.texts.push(run.content.clone());
            self.origins.push((run.content.clone(), origin));
        }
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

impl crate::RenderBackend for RoundFillBackend {
    fn begin_frame(&mut self) {}
    fn end_frame(&mut self) {}
    fn fill_rect(&mut self, _: Rect, _: Color) {}
    fn stroke_rect(&mut self, _: Rect, _: Color, _: f32) {}
    fn draw_text(&mut self, _: &TextLayout, _: Point2D) {}
    fn clip_rect(&mut self, _: Rect) {}
    fn stroke_line(&mut self, _: Point2D, _: Point2D, _: Color, _: f32) {}
    fn fill_round_rect(&mut self, rect: Rect, radius: f32, color: Color) {
        self.fills.push((rect, radius, color));
    }
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

fn color_close(a: Color, b: Color) -> bool {
    (a.r - b.r).abs() < 1e-6
        && (a.g - b.g).abs() < 1e-6
        && (a.b - b.b).abs() < 1e-6
        && (a.a - b.a).abs() < 1e-6
}

#[test]
fn focused_property_field_paints_text_input_state() {
    let mut state = EditorState::sample();
    state.ui.position_advanced = true;
    state.ui.property_focus = Some(PropertyFocus::PositionX);
    state.ui.property_input.set_text("1234");
    state.ui.property_input.set_caret("1234".len(), 0);
    let panel = PropertyPanel::for_selection_at(&state, 0).expect("sample doc has a selection");
    let mut backend = TextCaptureBackend::default();
    let mut cx = PaintCx {
        backend: &mut backend,
    };
    panel.paint(
        &mut cx,
        Rect {
            origin: Point2D::new(0.0, 0.0),
            size: Point2D::new(280.0, 700.0),
        },
    );

    assert!(
        backend.texts.iter().any(|text| text == "1234"),
        "focused property field should paint from TextInputState"
    );
}

#[test]
fn focused_property_text_input_preserves_zero_horizontal_padding() {
    let input = TextInputState::with_text("1234");
    let mut backend = TextCaptureBackend::default();
    let mut cx = PaintCx {
        backend: &mut backend,
    };
    let rect = Rect {
        origin: Point2D::new(42.0, 10.0),
        size: Point2D::new(80.0, 28.0),
    };

    paint_text_input_view_value(&mut cx, &Theme::dark(), &input, rect, 12.0, 0.0, 24.0, 0);

    let (_, origin) = backend
        .origins
        .iter()
        .find(|(text, _)| text == "1234")
        .expect("input text should paint");
    assert!(
        (origin.x - rect.origin.x).abs() < 0.01,
        "zero-padding property input should paint at x={}, got {}",
        rect.origin.x,
        origin.x
    );
}

#[derive(Default)]
struct FullInputCaptureBackend {
    texts: Vec<(String, Point2D, crate::Color)>,
    fills: Vec<(Rect, Color)>,
    clips: Vec<Rect>,
    clip_stack: Vec<Option<Rect>>,
    active_clip: Option<Rect>,
    fill_clips: Vec<(Rect, Color, Option<Rect>)>,
}

impl crate::RenderBackend for FullInputCaptureBackend {
    fn begin_frame(&mut self) {}
    fn end_frame(&mut self) {}
    fn fill_rect(&mut self, rect: Rect, color: Color) {
        self.fills.push((rect, color));
        self.fill_clips.push((rect, color, self.active_clip));
    }
    fn stroke_rect(&mut self, _: Rect, _: Color, _: f32) {}
    fn draw_text(&mut self, layout: &TextLayout, origin: Point2D) {
        if let Some(run) = layout.runs().first() {
            let c = run.color;
            let color = Color {
                r: f32::from(c.r()) / 255.0,
                g: f32::from(c.g()) / 255.0,
                b: f32::from(c.b()) / 255.0,
                a: f32::from(c.a()) / 255.0,
            };
            self.texts.push((
                run.content.clone(),
                Point2D::new(origin.x + run.origin.x, origin.y + run.origin.y),
                color,
            ));
        }
    }
    fn clip_rect(&mut self, rect: Rect) {
        self.clips.push(rect);
        self.active_clip = Some(match self.active_clip {
            Some(prev) => {
                let x0 = prev.origin.x.max(rect.origin.x);
                let y0 = prev.origin.y.max(rect.origin.y);
                let x1 = (prev.origin.x + prev.size.x).min(rect.origin.x + rect.size.x);
                let y1 = (prev.origin.y + prev.size.y).min(rect.origin.y + rect.size.y);
                Rect::xywh(x0, y0, (x1 - x0).max(0.0), (y1 - y0).max(0.0))
            }
            None => rect,
        });
    }
    fn stroke_line(&mut self, _: Point2D, _: Point2D, _: Color, _: f32) {}
    fn fill_round_rect(&mut self, _: Rect, _: f32, _: Color) {}
    fn stroke_round_rect(&mut self, _: Rect, _: f32, _: Color, _: f32) {}
    fn stroke_svg_path(&mut self, _: &str, _: Point2D, _: f32, _: Color, _: f32) {}
    fn save(&mut self) {
        self.clip_stack.push(self.active_clip);
    }
    fn restore(&mut self) {
        self.active_clip = self.clip_stack.pop().flatten();
    }
    fn translate(&mut self, _: Point2D) {}
    fn resize(&mut self, _: u32, _: u32) {}
    fn dpi_scale(&self) -> f32 {
        1.0
    }
}

#[test]
fn focused_textarea_aligns_caret_with_text_line_for_standard_and_tall_boxes() {
    use super::property_panel_text_input::{paint_textarea_with_label, TEXTAREA_HEIGHT};

    for (box_h, text) in [(TEXTAREA_HEIGHT, "SKU: AETH-02-TI"), (78.0, "233432")] {
        let mut input = TextInputState::with_text(text.to_string());
        input.set_caret(text.len(), 0);
        let theme = Theme::managed(true);
        let mut backend = FullInputCaptureBackend::default();
        let mut cx = PaintCx {
            backend: &mut backend,
        };
        let rect = Rect::xywh(16.0, 40.0, 248.0, box_h);

        paint_textarea_with_label(
            &mut cx,
            &theme,
            rect,
            "Label",
            text,
            "",
            true,
            Some(text.len()),
            false,
            Some(&input),
            0,
        );

        let (_, text_origin, _) = backend
            .texts
            .iter()
            .find(|(content, _, _)| content == text)
            .unwrap_or_else(|| panic!("expected textarea text {text:?} to paint"));
        let (caret_rect, caret_color, active_clip) = backend
            .fill_clips
            .iter()
            .find(|(r, _, _)| (r.size.x - 1.5).abs() < 0.01 && r.size.y >= 12.0)
            .copied()
            .unwrap_or_else(|| panic!("expected focused textarea caret for box_h={box_h}"));

        // Text baseline is `text_origin.y`; for 11px text its visual center is ~`baseline - 4.0`.
        let text_visual_center_y = text_origin.y - 4.0;
        let caret_center_y = caret_rect.origin.y + caret_rect.size.y / 2.0;
        assert!(
            (caret_center_y - text_visual_center_y).abs() <= 2.0,
            "box_h={box_h}: caret center y ({caret_center_y}) drifted from text visual center y ({text_visual_center_y})"
        );
        assert!(
            color_close(caret_color, theme.secondary_foreground),
            "focused textarea caret in managed theme must use high-contrast secondary_foreground"
        );
        if let Some(clip) = active_clip {
            assert!(
                caret_rect.origin.x >= clip.origin.x - 0.01
                    && caret_rect.origin.x + caret_rect.size.x
                        <= clip.origin.x + clip.size.x + 0.01,
                "caret {caret_rect:?} must not be clipped by {clip:?}"
            );
        }
    }
}

#[test]
fn focused_textarea_wraps_long_text_and_keeps_caret_unclipped() {
    use super::property_panel_text_input::{paint_textarea_with_label, TEXTAREA_HEIGHT};

    let long_text = "Features」，保持内边距、间距与子元素对齐还原";
    let mut input = TextInputState::with_text(long_text.to_string());
    input.set_caret(long_text.len(), 0);
    let theme = Theme::managed(true);
    let mut backend = FullInputCaptureBackend::default();
    let mut cx = PaintCx {
        backend: &mut backend,
    };
    let rect = Rect::xywh(16.0, 40.0, 248.0, TEXTAREA_HEIGHT);

    paint_textarea_with_label(
        &mut cx,
        &theme,
        rect,
        "组件说明",
        long_text,
        "",
        true,
        Some(long_text.len()),
        false,
        Some(&input),
        0,
    );

    // Must wrap into at least 2 content lines (plus 1 label run), and the first
    // content line must stay left-aligned at `rect.origin.x + 10.0` instead of
    // scrolling horizontally off the left edge.
    let content_runs: Vec<_> = backend
        .texts
        .iter()
        .filter(|(content, _, _)| content != "组件说明")
        .collect();
    assert!(
        content_runs.len() >= 2,
        "focused textarea should wrap long content into multiple lines, got {content_runs:?}"
    );
    assert!(
        content_runs[0].0.starts_with("Features"),
        "first wrapped line should preserve leading text instead of horizontal-scrolling it out: {:?}",
        content_runs[0].0
    );
    assert!(
        (content_runs[0].1.x - (rect.origin.x + 10.0)).abs() < 0.01,
        "first wrapped line should start at content_x"
    );

    let (caret_rect, _, active_clip) = backend
        .fill_clips
        .iter()
        .find(|(r, _, _)| (r.size.x - 1.5).abs() < 0.01 && r.size.y >= 12.0)
        .copied()
        .expect("focused textarea should paint a caret on the wrapped line");
    let clip = active_clip.expect("textarea content is clipped");
    assert!(
        caret_rect.origin.x + caret_rect.size.x <= clip.origin.x + clip.size.x + 0.01,
        "textarea caret {caret_rect:?} was clipped by {clip:?}"
    );
}

#[test]
fn overflowing_fill_and_stroke_variable_inputs_truncate_with_ellipsis() {
    use super::property_panel_fill_body::paint_fill_solid_body;
    use super::property_panel_sections::EditContext;
    use super::property_panel_stroke::paint_stroke_section;
    use super::property_panel_test_support::state_from;

    let mut state = state_from(
        r##"{ "version": "1.0.0", "children": [
              {"type":"rectangle","id":"rect","name":"Rect",
               "x":0,"y":0,"width":100,"height":100,
               "fill":[{"type":"solid","color":"#3b82f6"}],
               "stroke":{"thickness":1,"fill":[{"type":"solid","color":"#3b82f6"}]}}
        ]}"##,
    );
    state.set_single_selection(op_editor_core::NodeId::new("rect"));
    let panel = PropertyPanel::for_selection(&state).expect("panel");
    let empty_input = TextInputState::default();
    let edit = EditContext {
        focus: None,
        draft: "",
        input: &empty_input,
        caret: 0,
        select_all: false,
        now_ms: 0,
    };
    let theme = Theme::managed(true);
    let var_name = "asset_knowledge-carousel--c-accent";

    let mut fill_backend = FullInputCaptureBackend::default();
    {
        let mut cx = PaintCx {
            backend: &mut fill_backend,
        };
        paint_fill_solid_body(
            &mut cx,
            &theme,
            &edit,
            0,
            Color::WHITE,
            Some(var_name),
            None,
            true,
            0.0,
            0.0,
            280.0,
        );
    }
    let (fill_text, fill_origin, _) = fill_backend
        .texts
        .first()
        .cloned()
        .expect("fill solid body should draw variable name");
    assert!(
        fill_text.ends_with('…'),
        "long fill variable ref must truncate with ellipsis, got {fill_text:?}"
    );
    let fill_w = crate::widgets::text_metrics::measure_chrome(&mut fill_backend, &fill_text, 12.0);
    // Input box ends before the variable button at `280 - 16 - (28 + 6) = 230`.
    assert!(
        fill_origin.x + fill_w <= 230.0,
        "fill variable text {fill_text:?} overflowed input box: right={}",
        fill_origin.x + fill_w
    );

    let mut stroke_backend = FullInputCaptureBackend::default();
    {
        let mut cx = PaintCx {
            backend: &mut stroke_backend,
        };
        paint_stroke_section(
            &mut cx,
            &theme,
            &panel.snapshot,
            &edit,
            &panel.labels,
            Some(var_name),
            true,
            0.0,
            0.0,
            280.0,
            op_editor_core::PaddingEditMode::Single,
        );
    }
    let (stroke_text, _, _) = stroke_backend
        .texts
        .iter()
        .find(|(t, _, _)| t.starts_with('$'))
        .expect("stroke section should draw variable name");
    assert!(
        stroke_text.ends_with('…'),
        "long stroke variable ref must truncate with ellipsis, got {stroke_text:?}"
    );
}

#[test]
fn single_line_inputs_truncate_overflow_and_keep_focused_caret_aligned_and_unclipped() {
    use super::icons::Icon;
    use super::property_panel_inputs::{
        paint_input_with_icon_focused_state, paint_input_with_suffix_focused_state,
    };

    let theme = Theme::managed(true);
    let rect = Rect::xywh(16.0, 40.0, 90.0, 30.0);
    let long_value = "12345678901234567890";

    // 1. Unfocused suffix and icon inputs truncate overflowing values with `…`.
    for is_icon in [false, true] {
        let mut backend = FullInputCaptureBackend::default();
        let mut cx = PaintCx {
            backend: &mut backend,
        };
        if is_icon {
            paint_input_with_icon_focused_state(
                &mut cx,
                &theme,
                rect,
                Icon::RotateCw,
                long_value,
                Some("°"),
                false,
                None,
                false,
                None,
                0,
            );
        } else {
            paint_input_with_suffix_focused_state(
                &mut cx, &theme, rect, long_value, "%", false, None, false, None, 0,
            );
        }
        let (drawn_val, _, _) = backend.texts.first().expect("input should draw value text");
        assert!(
            drawn_val.ends_with('…'),
            "unfocused input (is_icon={is_icon}) must truncate overflowing value with ellipsis, got {drawn_val:?}"
        );
    }

    // 2. Focused single-line input with overflowing text keeps caret inside clip rect
    // and vertically aligned with non-centered `text_baseline_y`.
    let mut input = TextInputState::with_text(long_value.to_string());
    input.set_caret(long_value.len(), 0);
    let mut backend = FullInputCaptureBackend::default();
    let mut cx = PaintCx {
        backend: &mut backend,
    };
    let custom_rect = Rect::xywh(20.0, 50.0, 80.0, 46.0);
    let custom_baseline_y = 63.0;
    paint_text_input_view_value(
        &mut cx,
        &theme,
        &input,
        custom_rect,
        12.0,
        0.0,
        custom_baseline_y,
        0,
    );

    let (caret_rect, caret_color, active_clip) = backend
        .fill_clips
        .iter()
        .find(|(r, _, _)| (r.size.x - 1.5).abs() < 0.01 && r.size.y >= 12.0)
        .copied()
        .expect("focused single-line input should paint caret");
    let caret_center_y = caret_rect.origin.y + caret_rect.size.y / 2.0;
    assert!(
        (caret_center_y - (custom_baseline_y - 4.0)).abs() <= 1.0,
        "caret center y ({caret_center_y}) must align with text visual center ({})",
        custom_baseline_y - 4.0
    );
    assert!(
        color_close(caret_color, theme.secondary_foreground),
        "caret must use high-contrast secondary_foreground"
    );
    let clip = active_clip.expect("focused input must clip");
    assert!(
        caret_rect.origin.x + caret_rect.size.x <= clip.origin.x + clip.size.x + 0.01,
        "overflowing single-line caret {caret_rect:?} must not be clipped by {clip:?}"
    );
}

#[test]
fn code_tab_idle_body_uses_editor_locale() {
    let mut state = EditorState::sample();
    state.editor_ui.locale = Locale::ZhCn;
    state.editor_ui.property_tab = PropertyTab::Code;
    let panel = PropertyPanel::for_selection(&state).expect("sample doc has a selection");
    let rect = Rect {
        origin: Point2D::new(0.0, 0.0),
        size: Point2D::new(460.0, 700.0),
    };
    let mut backend = TextCaptureBackend::default();
    {
        let mut cx = PaintCx {
            backend: &mut backend,
        };
        panel.paint(&mut cx, rect);
    }
    let drawn = backend.texts.join("\n");
    assert!(drawn.contains("代码"));
    assert!(drawn.contains("Design JSX"));
    assert!(!drawn.contains("复制"));
    assert!(!drawn.contains("保存"));
    assert!(!drawn.contains("1 node selected"));
}

#[test]
fn pressed_font_weight_picker_row_uses_shared_feedback() {
    let theme = Theme::dark();
    let panel_rect = Rect {
        origin: Point2D::new(0.0, 0.0),
        size: Point2D::new(280.0, 700.0),
    };
    let visible = crate::widgets::property_panel_layout::VisibleSections {
        create_component: false,
        flex_layout: false,
        size_options: false,
        text: true,
        icon: false,
        ..crate::widgets::property_panel_layout::VisibleSections::ALL
    };
    let rows = crate::widgets::property_panel_text::font_weight_picker_action_rects(
        panel_rect.origin.x,
        crate::widgets::property_panel_text::text_section_top(panel_rect, visible).unwrap(),
        panel_rect.size.x - crate::widgets::property_panel_inputs::PAD_X * 2.0,
        visible.touch_controls,
    );
    let expected_row = rows[0].1;
    let expected = theme.button_hover.with_alpha(theme.button_hover.a * 1.8);
    let mut backend = RoundFillBackend::default();
    let mut cx = PaintCx {
        backend: &mut backend,
    };

    crate::widgets::property_panel_text::paint_font_weight_picker(
        &mut cx,
        &theme,
        panel_rect,
        visible,
        Locale::EnUs,
        400,
        None,
        Some(0),
    );

    assert!(
        backend.fills.iter().any(|(fill, radius, color)| {
            *fill == expected_row && (*radius - 6.0).abs() < 0.01 && color_close(*color, expected)
        }),
        "pressed font-weight picker row should paint the shared pressed feedback token"
    );
}
