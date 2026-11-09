use crate::theme::Theme;
use crate::widgets::text_input_backend::BaselineAdjustingBackend;
use crate::widgets::PaintCx;
use crate::Rect;
use jian_core::text_input::TextInputState;
use jian_widgets::components::text_input::TextInputView;
use jian_widgets::Tokens;

#[allow(clippy::too_many_arguments)]
pub(crate) fn paint_text_input_view_value(
    cx: &mut PaintCx<'_>,
    theme: &Theme,
    input: &TextInputState,
    rect: Rect,
    font_size: f32,
    pad_x: f32,
    text_baseline_y: f32,
    now_ms: u64,
) {
    // The "_value" variant always reads as focused with no placeholder — it
    // backs property-panel fields that only render while focused.
    paint_text_input_view(
        cx,
        theme,
        input,
        rect,
        font_size,
        pad_x,
        text_baseline_y,
        now_ms,
        "",
        true,
    );
}

/// Render a `TextInputView` for `input` inside `rect`, baselining the run at
/// `text_baseline_y`. Unlike `_value`, this exposes `placeholder` (drawn muted
/// when the buffer is empty) and `focused` (caret blinks only when true) — so
/// it serves search / filter boxes that must look right whether or not they
/// hold focus, on one unified caret implementation.
#[allow(clippy::too_many_arguments)]
pub(crate) fn paint_text_input_view(
    cx: &mut PaintCx<'_>,
    theme: &Theme,
    input: &TextInputState,
    rect: Rect,
    font_size: f32,
    pad_x: f32,
    text_baseline_y: f32,
    now_ms: u64,
    placeholder: &str,
    focused: bool,
) {
    let left_pad = (2.0 - pad_x.max(0.0)).max(0.0);
    let resolved_pad_x = pad_x.max(0.0) + left_pad;
    let visual_center_y = text_baseline_y - 4.0;
    let view_rect = Rect {
        origin: crate::Point2D::new(
            rect.origin.x - left_pad,
            visual_center_y - rect.size.y / 2.0,
        ),
        size: crate::Point2D::new(rect.size.x + left_pad, rect.size.y),
    };
    let view = TextInputView {
        state: input,
        placeholder,
        focused,
        font_size,
        now_ms,
        pad_x: resolved_pad_x,
        baseline_delta_y: 0.0,
        mask: None,
    };
    let text_top_y = view_rect.origin.y + (view_rect.size.y - font_size) / 2.0;
    let mut backend = BaselineAdjustingBackend {
        inner: cx.backend,
        baseline_delta_y: text_baseline_y - text_top_y,
    };
    view.paint(&mut backend, view_rect, &tokens_from_theme(theme));
}

#[allow(clippy::too_many_arguments)]
pub(crate) fn paint_single_line_input_value(
    cx: &mut PaintCx<'_>,
    theme: &Theme,
    rect: Rect,
    value: &str,
    font_size: f32,
    baseline_y: f32,
    focused: bool,
    caret: Option<usize>,
    select_all: bool,
    input: Option<&TextInputState>,
    now_ms: u64,
) {
    if let (true, Some(input)) = (focused, input) {
        paint_text_input_view_value(cx, theme, input, rect, font_size, 0.0, baseline_y, now_ms);
        return;
    }
    cx.backend.save();
    cx.backend.clip_rect(Rect {
        origin: rect.origin,
        size: crate::Point2D::new(rect.size.x + 2.0, rect.size.y),
    });
    if focused && select_all && !value.is_empty() {
        crate::widgets::text_selection::paint_single_line_selection(
            cx,
            theme,
            value,
            rect.origin.x,
            baseline_y,
            font_size,
            rect.origin.x + rect.size.x,
        );
    }
    let display_val = if focused {
        std::borrow::Cow::Borrowed(value)
    } else {
        std::borrow::Cow::Owned(crate::widgets::text_metrics::fit_chrome(
            cx.backend,
            value,
            rect.size.x,
            font_size,
        ))
    };
    let text_color = if focused {
        theme.secondary_foreground
    } else {
        theme.foreground
    };
    let value_layout = crate::TextLayout::single_run(
        &display_val,
        "system-ui",
        font_size,
        text_color.to_jian(),
        crate::Point2D::new(0.0, 0.0),
    );
    cx.backend.draw_text(
        &value_layout,
        crate::Point2D::new(rect.origin.x, baseline_y),
    );
    if let Some(pos) = caret {
        let safe_pos = jian_core::text_input::prev_char_boundary(value, pos.min(value.len()));
        let value_w =
            crate::widgets::text_metrics::measure_chrome(cx.backend, &value[..safe_pos], font_size);
        let caret_h = font_size + 3.0;
        let caret_y = (baseline_y - 4.0) - caret_h / 2.0;
        let caret_x = (rect.origin.x + value_w).min(rect.origin.x + rect.size.x);
        cx.backend.fill_rect(
            Rect {
                origin: crate::Point2D::new(caret_x, caret_y),
                size: crate::Point2D::new(1.5, caret_h),
            },
            theme.secondary_foreground,
        );
    }
    cx.backend.restore();
}

fn tokens_from_theme(theme: &Theme) -> Tokens {
    let mut tokens = crate::widgets::button::tokens_from_theme(theme);
    tokens.foreground = theme.secondary_foreground;
    tokens
}

pub(crate) fn paint_text_dropdown_trigger(
    cx: &mut PaintCx<'_>,
    theme: &Theme,
    rect: Rect,
    label: &str,
    family: &str,
) {
    use crate::widgets::icons::{draw_icon, Icon};
    use crate::widgets::property_panel_inputs::INPUT_RADIUS;
    use crate::widgets::text_metrics;
    use crate::{Point2D, TextLayout};

    cx.backend.fill_round_rect(rect, INPUT_RADIUS, theme.muted);
    cx.backend
        .stroke_round_rect(rect, INPUT_RADIUS, theme.border, 1.0);
    let fitted = text_metrics::fit_in_family(
        cx.backend,
        label,
        (rect.size.x - 32.0).max(16.0),
        12.0,
        family,
    );
    let layout = TextLayout::single_run(
        &fitted,
        family,
        12.0,
        (theme.foreground).to_jian(),
        Point2D::new(0.0, 0.0),
    );
    cx.backend.draw_text(
        &layout,
        Point2D::new(rect.origin.x + 10.0, rect.origin.y + 19.0),
    );
    draw_icon(
        cx.backend,
        Icon::ChevronDown,
        Point2D::new(rect.origin.x + rect.size.x - 18.0, rect.origin.y + 8.0),
        14.0,
        theme.muted_foreground,
        1.5,
    );
}

pub const TEXTAREA_HEIGHT: f32 = 58.0;

#[allow(clippy::too_many_arguments)]
pub fn paint_textarea_with_label(
    cx: &mut PaintCx<'_>,
    theme: &Theme,
    rect: Rect,
    label: &str,
    value: &str,
    placeholder: &str,
    focused: bool,
    caret: Option<usize>,
    select_all: bool,
    input: Option<&TextInputState>,
    now_ms: u64,
) {
    use crate::widgets::property_panel_inputs::INPUT_RADIUS;
    use crate::{Point2D, TextLayout};
    use jian_widgets::components::text_area::TextArea;

    cx.backend.fill_round_rect(rect, INPUT_RADIUS, theme.muted);
    if focused {
        cx.backend
            .stroke_round_rect(rect, INPUT_RADIUS, theme.primary, 1.5);
    } else {
        cx.backend
            .stroke_round_rect(rect, INPUT_RADIUS, theme.border, 1.0);
    }
    let content_x = rect.origin.x + 10.0;
    let content_y = rect.origin.y + 20.0;
    let avail_w = (rect.size.x - 20.0).max(16.0);
    let content_h = (rect.size.y - 24.0).max(16.0);
    let fitted_label = crate::widgets::text_metrics::fit_chrome(cx.backend, label, avail_w, 10.0);
    let label_layout = TextLayout::single_run(
        &fitted_label,
        "system-ui",
        10.0,
        (theme.muted_foreground).to_jian(),
        Point2D::new(0.0, 0.0),
    )
    .with_font_weight(500);
    cx.backend.draw_text(
        &label_layout,
        Point2D::new(rect.origin.x + 10.0, rect.origin.y + 15.0),
    );
    let max_lines = (((rect.size.y - 22.0) / 15.0).floor() as usize).max(1);
    if focused {
        let fallback_input;
        let active_input = if let Some(input) = input {
            input
        } else {
            let mut s = TextInputState::with_text(value.to_owned());
            if select_all && !value.is_empty() {
                s.select_all();
            } else if let Some(pos) = caret {
                let safe = jian_core::text_input::prev_char_boundary(value, pos.min(value.len()));
                s.set_caret(safe, 0);
            }
            s.touch(now_ms);
            fallback_input = s;
            &fallback_input
        };
        let area = TextArea {
            state: active_input,
            placeholder: "",
            focused: true,
            font_size: 11.0,
            now_ms,
            pad_x: 2.0,
            max_visible_lines: max_lines,
        };
        let area_rect = Rect {
            origin: Point2D::new(content_x - 2.0, content_y - 3.0),
            size: Point2D::new(avail_w + 4.0, content_h + 4.0),
        };
        let mut backend = BaselineAdjustingBackend {
            inner: cx.backend,
            baseline_delta_y: 11.0,
        };
        area.paint(&mut backend, area_rect, &tokens_from_theme(theme));
        return;
    }
    let display = if value.trim().is_empty() {
        placeholder
    } else {
        value.trim()
    };
    let color = if value.trim().is_empty() {
        theme.muted_foreground
    } else {
        theme.foreground
    };
    let lines = wrap_textarea_lines(cx.backend, display, avail_w, 11.0, max_lines);
    cx.backend.save();
    cx.backend.clip_rect(Rect {
        origin: Point2D::new(content_x, content_y),
        size: Point2D::new(avail_w, content_h),
    });
    for (idx, line) in lines.iter().enumerate() {
        let layout = TextLayout::single_run(
            line,
            "system-ui",
            11.0,
            color.to_jian(),
            Point2D::new(0.0, 0.0),
        );
        cx.backend.draw_text(
            &layout,
            Point2D::new(content_x, content_y + 12.0 + idx as f32 * 15.0),
        );
    }
    cx.backend.restore();
}

fn wrap_textarea_lines(
    backend: &mut dyn crate::RenderBackend,
    text: &str,
    max_width: f32,
    font_size: f32,
    max_lines: usize,
) -> Vec<String> {
    use crate::widgets::text_metrics;
    let mut lines = Vec::new();
    let mut current = String::new();
    let mut chars = text.chars().peekable();
    while let Some(ch) = chars.next() {
        if ch == '\n' {
            lines.push(std::mem::take(&mut current));
            if lines.len() >= max_lines {
                break;
            }
            continue;
        }
        current.push(ch);
        let w = text_metrics::measure_chrome(backend, &current, font_size);
        if w > max_width && current.chars().count() > 1 {
            if lines.len() + 1 == max_lines {
                let rest: String = std::iter::once(ch).chain(chars).collect();
                current.pop();
                let combined = format!("{current}{rest}");
                lines.push(text_metrics::fit_chrome(
                    backend, &combined, max_width, font_size,
                ));
                current.clear();
                break;
            } else {
                let last = current.pop().unwrap();
                lines.push(std::mem::take(&mut current));
                current.push(last);
            }
        }
    }
    if !current.is_empty() && lines.len() < max_lines {
        lines.push(current);
    }
    lines
}
