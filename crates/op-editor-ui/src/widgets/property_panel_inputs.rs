//! Shared paint primitives for the property-panel sections —
//! section headers, dividers, the various input pills, and the
//! standalone `format_color_hex` helper.
//!
//! Pulled out of `property_panel_sections.rs` to keep that file
//! under the 800-line workspace ceiling. Every helper is callable
//! from any section paint module via `super::property_panel_inputs::*`.

use crate::theme::Theme;
use crate::widgets::icons::{draw_icon, Icon};
use crate::widgets::text_metrics;
use crate::widgets::PaintCx;
use crate::{Color, Point2D, Rect, TextLayout};
use jian_core::text_input::TextInputState;

pub(crate) use crate::widgets::property_panel_text_input::paint_text_input_view_value;

pub const PAD_X: f32 = 16.0;
pub const SECTION_GAP: f32 = 8.0;
pub const ROW_HEIGHT: f32 = 28.0;
pub const INPUT_HEIGHT: f32 = 30.0;
pub const SIZE_CHECK_ROW_HEIGHT: f32 = 22.0;
pub const TOUCH_SIZE_CHECK_ROW_HEIGHT: f32 = 30.0;
pub const SIZE_CHECK_BOX_SIZE: f32 = 16.0;
pub const TOUCH_SIZE_CHECK_BOX_SIZE: f32 = 14.0;

pub const fn size_check_row_height(touch_controls: bool) -> f32 {
    if touch_controls {
        TOUCH_SIZE_CHECK_ROW_HEIGHT
    } else {
        SIZE_CHECK_ROW_HEIGHT
    }
}

pub const fn size_check_box_size(touch_controls: bool) -> f32 {
    if touch_controls {
        TOUCH_SIZE_CHECK_BOX_SIZE
    } else {
        SIZE_CHECK_BOX_SIZE
    }
}

pub const fn size_check_label_offset(touch_controls: bool) -> f32 {
    size_check_box_size(touch_controls) + 6.0
}
pub const INPUT_RADIUS: f32 = 8.0;
pub const COLOR_VARIABLE_BUTTON_W: f32 = 28.0;
pub const COLOR_VARIABLE_GAP: f32 = 6.0;
pub const SECTION_HEADER_HEIGHT: f32 = 24.0;
pub const TOUCH_ACTION_TARGET: f32 = 30.0;
pub const COLOR_SWATCH_ACTION_WIDTH: f32 = 28.0;
pub const TAB_HEIGHT: f32 = 36.0;
pub const HEADER_HEIGHT: f32 = 30.0;

/// Hit geometry for the trailing "+" affordance in section headers.
///
/// Touch panels are painted through a 1.47 density transform, so a 30-point
/// logical target resolves to a 44.1-point physical target while the glyph
/// remains visually compact.
pub fn section_add_target(x: f32, y: f32, width: f32, touch_controls: bool) -> Rect {
    if touch_controls {
        Rect::xywh(
            x + width - PAD_X - 22.0,
            y + (SECTION_HEADER_HEIGHT - TOUCH_ACTION_TARGET) / 2.0,
            TOUCH_ACTION_TARGET,
            TOUCH_ACTION_TARGET,
        )
    } else {
        Rect::xywh(x + width - PAD_X - 22.0, y, 28.0, SECTION_HEADER_HEIGHT)
    }
}

/// Width of the invisible colour-swatch action strip at the start of colour
/// inputs. The painted 16-point swatch stays unchanged; touch only grows the
/// surrounding action strip to the 30 logical points that scale to 44.1pt.
pub const fn color_swatch_action_width(touch_controls: bool) -> f32 {
    if touch_controls {
        TOUCH_ACTION_TARGET
    } else {
        COLOR_SWATCH_ACTION_WIDTH
    }
}

/// "Create component" button metrics — shared by `paint_create_component`
/// and every layout walker so paint ↔ hit-test ↔ section offsets stay in
/// lockstep. The button + its icon are kept compact (icon size below).
pub const CREATE_COMPONENT_PAD_TOP: f32 = 8.0;
pub const CREATE_COMPONENT_BTN_H: f32 = 30.0;
pub const CREATE_COMPONENT_PAD_BOTTOM: f32 = 12.0;
pub const CREATE_COMPONENT_ICON: f32 = 14.0;
/// Gap between the instance variant's two rows (Go to component /
/// Detach instance) and between the button and component description textarea.
pub const CREATE_COMPONENT_ROW_GAP: f32 = 6.0;
pub const COMPONENT_DESC_HEIGHT: f32 = 58.0;
/// Total vertical space the create-component block consumes (includes the
/// component description textarea).
pub const CREATE_COMPONENT_BLOCK_H: f32 = CREATE_COMPONENT_PAD_TOP
    + CREATE_COMPONENT_BTN_H
    + CREATE_COMPONENT_ROW_GAP
    + COMPONENT_DESC_HEIGHT
    + CREATE_COMPONENT_PAD_BOTTOM;

/// Component / instance accent colours — TS `text-purple-400`
/// (#a855f7) for components, `#9281f7` for instances.
pub const COMPONENT_ACCENT: Color = Color {
    r: 0xA8 as f32 / 255.0,
    g: 0x55 as f32 / 255.0,
    b: 0xF7 as f32 / 255.0,
    a: 1.0,
};
pub const INSTANCE_ACCENT: Color = Color {
    r: 0x92 as f32 / 255.0,
    g: 0x81 as f32 / 255.0,
    b: 0xF7 as f32 / 255.0,
    a: 1.0,
};

/// Vertical space the create-component block consumes for the given
/// button variant — the instance variant stacks a second row. Paint
/// + BOTH layout walkers must read this so y-offsets never drift.
pub fn create_component_block_height(
    state: crate::widgets::property_panel_visibility::ComponentButtonState,
) -> f32 {
    use crate::widgets::property_panel_visibility::ComponentButtonState as S;
    match state {
        S::Create | S::DetachComponent => CREATE_COMPONENT_BLOCK_H,
        S::Instance {
            component_count,
            picker_open,
        } => {
            let swap_rows =
                usize::from(component_count > 0) + if picker_open { component_count } else { 0 };
            CREATE_COMPONENT_BLOCK_H
                + (1 + swap_rows) as f32 * (CREATE_COMPONENT_BTN_H + CREATE_COMPONENT_ROW_GAP)
        }
    }
}

pub fn paint_section_label(
    cx: &mut PaintCx<'_>,
    theme: &Theme,
    label: &str,
    x: f32,
    y: f32,
    _w: f32,
) -> f32 {
    let label_layout = TextLayout::single_run(
        label,
        "system-ui",
        12.0,
        (theme.secondary_foreground).to_jian(),
        Point2D::new(0.0, 0.0),
    )
    .with_font_weight(600);
    cx.backend
        .draw_text(&label_layout, Point2D::new(x + PAD_X, y + 16.0));
    y + SECTION_HEADER_HEIGHT
}

pub fn paint_section_label_with_add(
    cx: &mut PaintCx<'_>,
    theme: &Theme,
    label: &str,
    x: f32,
    y: f32,
    width: f32,
) -> f32 {
    let next_y = paint_section_label(cx, theme, label, x, y, width);
    draw_icon(
        cx.backend,
        Icon::Plus,
        Point2D::new(x + width - PAD_X - 14.0, y + 6.0),
        14.0,
        theme.muted_foreground,
        1.4,
    );
    next_y
}

pub fn paint_section_divider(cx: &mut PaintCx<'_>, theme: &Theme, x: f32, y: f32, width: f32) {
    jian_widgets::components::separator::Separator {
        orientation: jian_widgets::components::separator::Orientation::Horizontal,
        thickness: 1.0,
    }
    .paint(
        cx.backend,
        Rect {
            origin: Point2D::new(x, y),
            size: Point2D::new(width, 1.0),
        },
        theme.border,
    );
}

pub fn paint_input_with_prefix(
    cx: &mut PaintCx<'_>,
    theme: &Theme,
    rect: Rect,
    prefix: &str,
    value: &str,
) {
    paint_input_with_prefix_focused(cx, theme, rect, prefix, value, false, None, false);
}

/// `paint_input_with_prefix` with explicit focus + caret toggle.
#[allow(clippy::too_many_arguments)]
pub fn paint_input_with_prefix_focused(
    cx: &mut PaintCx<'_>,
    theme: &Theme,
    rect: Rect,
    prefix: &str,
    value: &str,
    focused: bool,
    caret: Option<usize>,
    select_all: bool,
) {
    paint_input_with_prefix_focused_state(
        cx, theme, rect, prefix, value, focused, caret, select_all, None, 0,
    );
}

/// State-backed variant used while a property input is focused.
/// Non-focused call sites pass `None` and retain the static paint path.
#[allow(clippy::too_many_arguments)]
pub fn paint_input_with_prefix_focused_state(
    cx: &mut PaintCx<'_>,
    theme: &Theme,
    rect: Rect,
    prefix: &str,
    value: &str,
    focused: bool,
    caret: Option<usize>,
    select_all: bool,
    input: Option<&TextInputState>,
    now_ms: u64,
) {
    paint_input_with_prefix_and_placeholder(
        cx, theme, rect, prefix, value, "", focused, caret, select_all, input, now_ms,
    );
}

#[allow(clippy::too_many_arguments)]
pub fn paint_input_with_prefix_and_placeholder(
    cx: &mut PaintCx<'_>,
    theme: &Theme,
    rect: Rect,
    prefix: &str,
    value: &str,
    placeholder: &str,
    focused: bool,
    caret: Option<usize>,
    select_all: bool,
    input: Option<&TextInputState>,
    now_ms: u64,
) {
    cx.backend.fill_round_rect(rect, INPUT_RADIUS, theme.muted);
    if focused {
        cx.backend
            .stroke_round_rect(rect, INPUT_RADIUS, theme.primary, 1.5);
    } else {
        cx.backend
            .stroke_round_rect(rect, INPUT_RADIUS, theme.border, 1.0);
    }
    let prefix_layout = TextLayout::single_run(
        prefix,
        "system-ui",
        12.0,
        (theme.muted_foreground).to_jian(),
        Point2D::new(0.0, 0.0),
    );
    cx.backend.draw_text(
        &prefix_layout,
        Point2D::new(
            rect.origin.x + 10.0,
            rect.origin.y + rect.size.y / 2.0 + 4.0,
        ),
    );
    let prefix_w = text_metrics::measure_chrome(cx.backend, prefix, 12.0);
    let value_x = rect.origin.x + 10.0 + prefix_w + 8.0;
    let baseline_y = rect.origin.y + rect.size.y / 2.0 + 4.0;
    let avail_w = (rect.origin.x + rect.size.x - 8.0 - value_x).max(0.0);
    if let (true, Some(input)) = (focused, input) {
        paint_text_input_view_value(
            cx,
            theme,
            input,
            Rect {
                origin: Point2D::new(value_x, rect.origin.y),
                size: Point2D::new(avail_w, rect.size.y),
            },
            12.0,
            0.0,
            baseline_y,
            now_ms,
        );
        return;
    }
    if focused && select_all && !value.is_empty() {
        crate::widgets::text_selection::paint_single_line_selection(
            cx,
            theme,
            value,
            value_x,
            baseline_y,
            12.0,
            rect.origin.x + rect.size.x - 8.0,
        );
    }
    if value.is_empty() && !focused && !placeholder.is_empty() {
        let fitted = text_metrics::fit_chrome(cx.backend, placeholder, avail_w, 11.0);
        let placeholder_layout = TextLayout::single_run(
            &fitted,
            "system-ui",
            11.0,
            (theme.muted_foreground).to_jian(),
            Point2D::new(0.0, 0.0),
        );
        cx.backend
            .draw_text(&placeholder_layout, Point2D::new(value_x, baseline_y));
    } else {
        let display_val = if focused {
            std::borrow::Cow::Borrowed(value)
        } else {
            std::borrow::Cow::Owned(text_metrics::fit_chrome(cx.backend, value, avail_w, 12.0))
        };
        let value_layout = TextLayout::single_run(
            &display_val,
            "system-ui",
            12.0,
            (theme.foreground).to_jian(),
            Point2D::new(0.0, 0.0),
        );
        cx.backend
            .draw_text(&value_layout, Point2D::new(value_x, baseline_y));
    }
    if let Some(pos) = caret {
        let value_w =
            text_metrics::measure_chrome(cx.backend, &value[..pos.min(value.len())], 12.0);
        cx.backend.fill_rect(
            Rect {
                origin: Point2D::new(value_x + value_w, rect.origin.y + 6.0),
                size: Point2D::new(1.5, rect.size.y - 12.0),
            },
            theme.foreground,
        );
    }
}

pub use crate::widgets::property_panel_text_input::{paint_textarea_with_label, TEXTAREA_HEIGHT};

#[allow(dead_code)]
pub fn paint_input_with_suffix(
    cx: &mut PaintCx<'_>,
    theme: &Theme,
    rect: Rect,
    value: &str,
    unit: &str,
) {
    paint_input_with_suffix_focused(cx, theme, rect, value, unit, false, None, false);
}

#[allow(clippy::too_many_arguments)]
pub fn paint_input_with_suffix_focused(
    cx: &mut PaintCx<'_>,
    theme: &Theme,
    rect: Rect,
    value: &str,
    unit: &str,
    focused: bool,
    caret: Option<usize>,
    select_all: bool,
) {
    paint_input_with_suffix_focused_state(
        cx, theme, rect, value, unit, focused, caret, select_all, None, 0,
    );
}

#[allow(clippy::too_many_arguments)]
pub fn paint_input_with_suffix_focused_state(
    cx: &mut PaintCx<'_>,
    theme: &Theme,
    rect: Rect,
    value: &str,
    unit: &str,
    focused: bool,
    caret: Option<usize>,
    select_all: bool,
    input: Option<&TextInputState>,
    now_ms: u64,
) {
    cx.backend.fill_round_rect(rect, INPUT_RADIUS, theme.muted);
    if focused {
        cx.backend
            .stroke_round_rect(rect, INPUT_RADIUS, theme.primary, 1.5);
    } else {
        cx.backend
            .stroke_round_rect(rect, INPUT_RADIUS, theme.border, 1.0);
    }
    let value_x = rect.origin.x + 10.0;
    // Centre the text vertically in the box: for the standard 30px input
    // this is +19 (unchanged); for the compact 20px gap row it becomes
    // +14 so the value isn't pinned to the bottom.
    let baseline_y = rect.origin.y + rect.size.y / 2.0 + 4.0;
    if let (true, Some(input)) = (focused, input) {
        paint_text_input_view_value(
            cx,
            theme,
            input,
            Rect {
                origin: Point2D::new(value_x, rect.origin.y),
                size: Point2D::new((rect.size.x - 28.0).max(0.0), rect.size.y),
            },
            12.0,
            0.0,
            baseline_y,
            now_ms,
        );
    } else {
        if focused && select_all && !value.is_empty() {
            crate::widgets::text_selection::paint_single_line_selection(
                cx,
                theme,
                value,
                value_x,
                baseline_y,
                12.0,
                rect.origin.x + rect.size.x - 18.0,
            );
        }
        let value_layout = TextLayout::single_run(
            value,
            "system-ui",
            12.0,
            (theme.foreground).to_jian(),
            Point2D::new(0.0, 0.0),
        );
        cx.backend
            .draw_text(&value_layout, Point2D::new(value_x, baseline_y));
        if let Some(pos) = caret {
            let value_w =
                text_metrics::measure_chrome(cx.backend, &value[..pos.min(value.len())], 12.0);
            cx.backend.fill_rect(
                Rect {
                    origin: Point2D::new(value_x + value_w, rect.origin.y + 6.0),
                    size: Point2D::new(1.5, rect.size.y - 12.0),
                },
                theme.foreground,
            );
        }
    }
    let unit_layout = TextLayout::single_run(
        unit,
        "system-ui",
        12.0,
        (theme.muted_foreground).to_jian(),
        Point2D::new(0.0, 0.0),
    );
    cx.backend.draw_text(
        &unit_layout,
        Point2D::new(rect.origin.x + rect.size.x - 14.0, baseline_y),
    );
}

#[allow(dead_code)]
pub fn paint_input_with_icon(
    cx: &mut PaintCx<'_>,
    theme: &Theme,
    rect: Rect,
    icon: Icon,
    value: &str,
    unit: Option<&str>,
) {
    paint_input_with_icon_focused(cx, theme, rect, icon, value, unit, false, None, false);
}

// Paint-context + geometry args threaded through; a struct adds no gain.
#[allow(clippy::too_many_arguments)]
pub fn paint_input_with_icon_focused(
    cx: &mut PaintCx<'_>,
    theme: &Theme,
    rect: Rect,
    icon: Icon,
    value: &str,
    unit: Option<&str>,
    focused: bool,
    caret: Option<usize>,
    select_all: bool,
) {
    paint_input_with_icon_focused_state(
        cx, theme, rect, icon, value, unit, focused, caret, select_all, None, 0,
    );
}

// Paint-context + geometry args threaded through; a struct adds no gain.
#[allow(clippy::too_many_arguments)]
pub fn paint_input_with_icon_focused_state(
    cx: &mut PaintCx<'_>,
    theme: &Theme,
    rect: Rect,
    icon: Icon,
    value: &str,
    unit: Option<&str>,
    focused: bool,
    caret: Option<usize>,
    select_all: bool,
    input: Option<&TextInputState>,
    now_ms: u64,
) {
    cx.backend.fill_round_rect(rect, INPUT_RADIUS, theme.muted);
    if focused {
        cx.backend
            .stroke_round_rect(rect, INPUT_RADIUS, theme.primary, 1.5);
    } else {
        cx.backend
            .stroke_round_rect(rect, INPUT_RADIUS, theme.border, 1.0);
    }
    // Icon at 10 px from the left edge — matches the prefix-text
    // inputs (X / Y / W / H), so a row of mixed icon + prefix
    // inputs reads as a single column. Vertically centred in the
    // 30-tall row: `(30 - 14) / 2 == 8`.
    draw_icon(
        cx.backend,
        icon,
        Point2D::new(rect.origin.x + 10.0, rect.origin.y + 8.0),
        14.0,
        theme.muted_foreground,
        1.4,
    );
    let value_x = rect.origin.x + 30.0;
    let baseline_y = rect.origin.y + 19.0;
    let unit_reserved_w = if unit.is_some() { 22.0 } else { 8.0 };
    if let (true, Some(input)) = (focused, input) {
        paint_text_input_view_value(
            cx,
            theme,
            input,
            Rect {
                origin: Point2D::new(value_x, rect.origin.y),
                size: Point2D::new(
                    (rect.origin.x + rect.size.x - unit_reserved_w - value_x).max(0.0),
                    rect.size.y,
                ),
            },
            12.0,
            0.0,
            baseline_y,
            now_ms,
        );
    } else {
        if focused && select_all && !value.is_empty() {
            crate::widgets::text_selection::paint_single_line_selection(
                cx,
                theme,
                value,
                value_x,
                baseline_y,
                12.0,
                rect.origin.x + rect.size.x - 18.0,
            );
        }
        let value_layout = TextLayout::single_run(
            value,
            "system-ui",
            12.0,
            (theme.foreground).to_jian(),
            Point2D::new(0.0, 0.0),
        );
        cx.backend
            .draw_text(&value_layout, Point2D::new(value_x, baseline_y));
        if let Some(pos) = caret {
            let caret_w =
                text_metrics::measure_chrome(cx.backend, &value[..pos.min(value.len())], 12.0);
            cx.backend.fill_rect(
                Rect {
                    origin: Point2D::new(value_x + caret_w, rect.origin.y + 6.0),
                    size: Point2D::new(1.5, rect.size.y - 12.0),
                },
                theme.foreground,
            );
        }
    }
    if let Some(u) = unit {
        // Unit pinned to the box's right edge — keeps the icon
        // input visually consistent with the suffix-only inputs
        // ("100 %" etc.) where the unit also anchors right.
        let unit_layout = TextLayout::single_run(
            u,
            "system-ui",
            12.0,
            (theme.muted_foreground).to_jian(),
            Point2D::new(0.0, 0.0),
        );
        cx.backend.draw_text(
            &unit_layout,
            Point2D::new(rect.origin.x + rect.size.x - 14.0, baseline_y),
        );
    }
}

#[allow(dead_code)]
pub fn paint_dropdown(cx: &mut PaintCx<'_>, theme: &Theme, rect: Rect, value: &str) {
    cx.backend.fill_round_rect(rect, INPUT_RADIUS, theme.muted);
    cx.backend
        .stroke_round_rect(rect, INPUT_RADIUS, theme.border, 1.0);
    let max_w = (rect.size.x - 36.0).max(16.0);
    let fitted = text_metrics::fit_chrome(cx.backend, value, max_w, 12.0);
    let value_layout = TextLayout::single_run(
        &fitted,
        "system-ui",
        12.0,
        (theme.foreground).to_jian(),
        Point2D::new(0.0, 0.0),
    );
    cx.backend.draw_text(
        &value_layout,
        Point2D::new(rect.origin.x + 10.0, rect.origin.y + 19.0),
    );
    draw_icon(
        cx.backend,
        Icon::ChevronDown,
        Point2D::new(rect.origin.x + rect.size.x - 22.0, rect.origin.y + 7.0),
        16.0,
        theme.muted_foreground,
        1.4,
    );
}

/// Re-export of the shared `#RRGGBB` formatter under the historical
/// property-panel name so existing call sites stay unchanged.
pub use crate::util::color_to_hex as format_color_hex;

fn tab_label_width(label: &str) -> f32 {
    label
        .chars()
        .map(|c| if c.is_ascii() { 7.0 } else { 13.0 })
        .sum()
}

pub fn tab_strip_rects(
    labels: &crate::widgets::property_panel_sections::PropertyLabels,
    x: f32,
    y: f32,
    show_interact: bool,
    show_code: bool,
    touch_controls: bool,
) -> Vec<(op_editor_core::PropertyTab, Rect)> {
    use op_editor_core::PropertyTab;
    let pad = 14.0;
    let tab_height = if touch_controls { 30.0 } else { 26.0 };
    let tab_y = y + (TAB_HEIGHT - tab_height) / 2.0;
    let mut cursor_x = x + pad;
    let mut rects = Vec::with_capacity(3);
    let design_w = (tab_label_width(labels.tab_design) + 24.0).max(48.0);
    rects.push((
        PropertyTab::Design,
        Rect {
            origin: Point2D::new(cursor_x, tab_y),
            size: Point2D::new(design_w, tab_height),
        },
    ));
    cursor_x += design_w + 6.0;
    if show_interact {
        let interact_w = (tab_label_width(labels.tab_interact) + 24.0).max(48.0);
        rects.push((
            PropertyTab::Interact,
            Rect {
                origin: Point2D::new(cursor_x, tab_y),
                size: Point2D::new(interact_w, tab_height),
            },
        ));
        cursor_x += interact_w + 6.0;
    }
    if show_code {
        let code_w = (tab_label_width(labels.tab_code) + 24.0).max(48.0);
        rects.push((
            PropertyTab::Code,
            Rect {
                origin: Point2D::new(cursor_x, tab_y),
                size: Point2D::new(code_w, tab_height),
            },
        ));
    }
    rects
}

pub fn tab_strip_hit(
    labels: &crate::widgets::property_panel_sections::PropertyLabels,
    x: f32,
    y: f32,
    point: Point2D,
    show_interact: bool,
    show_code: bool,
    touch_controls: bool,
) -> Option<op_editor_core::PropertyTab> {
    tab_strip_rects(labels, x, y, show_interact, show_code, touch_controls)
        .into_iter()
        .find(|(_, rect)| rect.contains(point))
        .map(|(tab, _)| tab)
}

pub fn paint_tab_strip(
    cx: &mut PaintCx<'_>,
    theme: &Theme,
    labels: &crate::widgets::property_panel_sections::PropertyLabels,
    state: crate::widgets::property_panel_sections::TabStripState,
    x: f32,
    y: f32,
    width: f32,
) -> f32 {
    use op_editor_core::PropertyTab;
    let active = state.active;
    let hover = state.hover;
    let label_for = |tab: PropertyTab| -> &'static str {
        match tab {
            PropertyTab::Design => labels.tab_design,
            PropertyTab::Interact => labels.tab_interact,
            PropertyTab::Code => labels.tab_code,
        }
    };
    for (tab, rect) in tab_strip_rects(
        labels,
        x,
        y,
        state.show_interact,
        state.show_code,
        state.touch_controls,
    ) {
        let is_active = tab == active;
        let is_hovered = hover == Some(tab) && !is_active;
        if is_hovered {
            cx.backend.fill_round_rect(rect, 4.0, theme.button_hover);
        }
        if is_active {
            cx.backend.fill_round_rect(
                Rect::xywh(
                    rect.origin.x + 8.0,
                    y + TAB_HEIGHT - 2.0,
                    (rect.size.x - 16.0).max(0.0),
                    2.0,
                ),
                1.0,
                theme.primary,
            );
        }
        let color = if is_active {
            theme.primary
        } else if is_hovered {
            theme.foreground
        } else {
            theme.muted_foreground
        };
        let label = TextLayout::single_run(
            label_for(tab),
            "system-ui",
            13.0,
            (color).to_jian(),
            Point2D::new(0.0, 0.0),
        )
        .with_font_weight(if is_active { 500 } else { 400 });
        cx.backend.draw_text(
            &label,
            Point2D::new(
                rect.origin.x + 12.0,
                jian_widgets::centered_text_baseline_y(rect, 13.0),
            ),
        );
    }
    cx.backend.fill_rect(
        Rect {
            origin: Point2D::new(x, y + TAB_HEIGHT - 1.0),
            size: Point2D::new(width, 1.0),
        },
        theme.border,
    );
    y + TAB_HEIGHT
}
