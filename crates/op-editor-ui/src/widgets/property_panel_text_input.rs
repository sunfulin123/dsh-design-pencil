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
    let resolved_pad_x = if pad_x <= 0.0 { f32::EPSILON } else { pad_x };
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
    let text_top_y = rect.origin.y + (rect.size.y - font_size) / 2.0;
    let mut backend = BaselineAdjustingBackend {
        inner: cx.backend,
        baseline_delta_y: text_baseline_y - text_top_y,
    };
    view.paint(&mut backend, rect, &tokens_from_theme(theme));
}

fn tokens_from_theme(theme: &Theme) -> Tokens {
    crate::widgets::button::tokens_from_theme(theme)
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
    _caret: Option<usize>,
    _select_all: bool,
    input: Option<&TextInputState>,
    now_ms: u64,
) {
    use crate::widgets::property_panel_inputs::INPUT_RADIUS;
    use crate::widgets::text_metrics;
    use crate::{Point2D, TextLayout};

    cx.backend.fill_round_rect(rect, INPUT_RADIUS, theme.muted);
    if focused {
        cx.backend
            .stroke_round_rect(rect, INPUT_RADIUS, theme.primary, 1.5);
    } else {
        cx.backend
            .stroke_round_rect(rect, INPUT_RADIUS, theme.border, 1.0);
    }
    let label_layout = TextLayout::single_run(
        label,
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
    let content_x = rect.origin.x + 10.0;
    let content_y = rect.origin.y + 20.0;
    let avail_w = (rect.size.x - 20.0).max(16.0);
    let content_h = (rect.size.y - 24.0).max(16.0);
    if let (true, Some(input)) = (focused, input) {
        paint_text_input_view_value(
            cx,
            theme,
            input,
            Rect {
                origin: Point2D::new(content_x, content_y),
                size: Point2D::new(avail_w, content_h),
            },
            11.0,
            0.0,
            content_y + 13.0,
            now_ms,
        );
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
    let max_lines = (((rect.size.y - 22.0) / 15.0).floor() as usize).max(1);
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
