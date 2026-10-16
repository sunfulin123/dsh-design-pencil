//! Text-specific property section for the native right panel.

use crate::theme::Theme;
use crate::util::format_panel_number;
use crate::widgets::icons::{draw_icon, Icon};
use crate::widgets::property_panel::{
    FontWeightChoice, NodeSnapshot, PropertyPanelAction, TextAlignValue, TextGrowthValue,
    TextVerticalAlignValue,
};
use crate::widgets::property_panel_inputs::{
    paint_input_with_icon_focused_state, paint_input_with_prefix_focused_state,
    paint_section_divider, paint_section_label, INPUT_HEIGHT, INPUT_RADIUS, PAD_X, SECTION_GAP,
    SECTION_HEADER_HEIGHT,
};
use crate::widgets::property_panel_sections::EditContext;
use crate::widgets::property_panel_typography::display_font_family;
use crate::widgets::text_metrics;
use crate::widgets::PaintCx;
use crate::{Point2D, Rect, TextLayout};
use op_editor_core::PropertyFocus;

const FAMILY_ROW_GAP: f32 = 6.0;
const CONTENT_ROW_GAP: f32 = 8.0;
const FORMAT_ROW_GAP: f32 = 6.0;
const COPY_BTN_W: f32 = 28.0;
const COPY_BTN_GAP: f32 = 6.0;
const ALIGN_LABEL_H: f32 = 18.0;
const BUTTON_H: f32 = 28.0;
const TOUCH_BUTTON_H: f32 = 30.0;
/// Height of the small 行高 / 字间距 caption row painted above the
/// line-height / letter-spacing inputs (TS `text-[9px]` label row).
const LH_LS_LABEL_H: f32 = 14.0;

pub(crate) fn text_button_height(touch_controls: bool) -> f32 {
    if touch_controls {
        TOUCH_BUTTON_H
    } else {
        BUTTON_H
    }
}

pub(crate) fn text_layout_block_height(touch_controls: bool) -> f32 {
    SECTION_HEADER_HEIGHT + text_button_height(touch_controls) + 12.0
}

pub fn text_section_height(touch_controls: bool) -> f32 {
    let button_h = text_button_height(touch_controls);
    text_layout_block_height(touch_controls)
        + SECTION_HEADER_HEIGHT
        + INPUT_HEIGHT
        + CONTENT_ROW_GAP
        + INPUT_HEIGHT
        + FAMILY_ROW_GAP
        + INPUT_HEIGHT
        + FORMAT_ROW_GAP
        + button_h
        + 6.0
        + LH_LS_LABEL_H
        + INPUT_HEIGHT
        + 8.0
        + ALIGN_LABEL_H
        + button_h
        + 6.0
        + ALIGN_LABEL_H
        + button_h
        + 12.0
}

pub fn push_text_input_rects(
    rects: &mut Vec<(PropertyFocus, Rect)>,
    x0: f32,
    y: f32,
    usable_w: f32,
    touch_controls: bool,
) {
    let button_h = text_button_height(touch_controls);
    let half_w = (usable_w - 8.0) / 2.0;
    let content_y = y + text_layout_block_height(touch_controls) + SECTION_HEADER_HEIGHT;
    let content_w = (usable_w - COPY_BTN_W - COPY_BTN_GAP).max(40.0);
    rects.push((
        PropertyFocus::TextContent,
        Rect {
            origin: Point2D::new(x0 + PAD_X, content_y),
            size: Point2D::new(content_w, INPUT_HEIGHT),
        },
    ));
    let mut y = content_y + INPUT_HEIGHT + CONTENT_ROW_GAP + INPUT_HEIGHT + FAMILY_ROW_GAP;
    // Weight (left half) is now a dropdown (a ToggleFontWeightPicker
    // action rect), not a focusable input — only Font Size remains here.
    rects.push((
        PropertyFocus::FontSize,
        Rect {
            origin: Point2D::new(x0 + PAD_X + half_w + 8.0, y),
            size: Point2D::new(half_w, INPUT_HEIGHT),
        },
    ));
    // Skip formatting toolbar row + LH/LS caption row.
    y += INPUT_HEIGHT + FORMAT_ROW_GAP + button_h + 6.0 + LH_LS_LABEL_H;
    rects.push((
        PropertyFocus::LineHeight,
        Rect {
            origin: Point2D::new(x0 + PAD_X, y),
            size: Point2D::new(half_w, INPUT_HEIGHT),
        },
    ));
    rects.push((
        PropertyFocus::LetterSpacing,
        Rect {
            origin: Point2D::new(x0 + PAD_X + half_w + 8.0, y),
            size: Point2D::new(half_w, INPUT_HEIGHT),
        },
    ));
}

pub fn text_action_rects(
    x0: f32,
    y: f32,
    usable_w: f32,
    touch_controls: bool,
) -> Vec<(PropertyPanelAction, Rect)> {
    let mut out = Vec::new();
    let button_h = text_button_height(touch_controls);
    let layout_block_h = text_layout_block_height(touch_controls);
    // Continuous even cells — matches the jian ToggleGroup paint (no gaps).
    let growth_w = usable_w / 3.0;
    let growth_y = y + SECTION_HEADER_HEIGHT;
    let growth_actions = [
        (
            PropertyPanelAction::SetTextGrowth(TextGrowthValue::Auto),
            0_usize,
        ),
        (
            PropertyPanelAction::SetTextGrowth(TextGrowthValue::FixedWidth),
            1_usize,
        ),
        (
            PropertyPanelAction::SetTextGrowth(TextGrowthValue::FixedWidthHeight),
            2_usize,
        ),
    ];
    for (action, i) in growth_actions {
        out.push((
            action,
            Rect {
                origin: Point2D::new(x0 + PAD_X + i as f32 * growth_w, growth_y),
                size: Point2D::new(growth_w, button_h),
            },
        ));
    }
    let content_y = y + layout_block_h + SECTION_HEADER_HEIGHT;
    let content_w = (usable_w - COPY_BTN_W - COPY_BTN_GAP).max(40.0);
    out.push((
        PropertyPanelAction::CopyTextContent,
        Rect {
            origin: Point2D::new(x0 + PAD_X + content_w + COPY_BTN_GAP, content_y),
            size: Point2D::new(COPY_BTN_W, INPUT_HEIGHT),
        },
    ));
    let family_y = content_y + INPUT_HEIGHT + CONTENT_ROW_GAP;
    out.push((
        PropertyPanelAction::ToggleFontFamilyPicker,
        Rect {
            origin: Point2D::new(x0 + PAD_X, family_y),
            size: Point2D::new(usable_w, INPUT_HEIGHT),
        },
    ));
    // Weight dropdown trigger — left half of the weight/size row.
    let weight_row_y = family_y + INPUT_HEIGHT + FAMILY_ROW_GAP;
    let weight_half_w = (usable_w - 8.0) / 2.0;
    out.push((
        PropertyPanelAction::ToggleFontWeightPicker,
        Rect {
            origin: Point2D::new(x0 + PAD_X, weight_row_y),
            size: Point2D::new(weight_half_w, INPUT_HEIGHT),
        },
    ));
    // Formatting toolbar row (Bold, Italic, Underline, Strikethrough).
    let format_y = weight_row_y + INPUT_HEIGHT + FORMAT_ROW_GAP;
    let fmt_w = usable_w / 4.0;
    for (action, i) in [
        (PropertyPanelAction::ToggleTextBold, 0_usize),
        (PropertyPanelAction::ToggleTextItalic, 1_usize),
        (PropertyPanelAction::ToggleTextUnderline, 2_usize),
        (PropertyPanelAction::ToggleTextStrikethrough, 3_usize),
    ] {
        out.push((
            action,
            Rect {
                origin: Point2D::new(x0 + PAD_X + i as f32 * fmt_w, format_y),
                size: Point2D::new(fmt_w, button_h),
            },
        ));
    }
    let mut y = format_y + button_h + 6.0 + LH_LS_LABEL_H + INPUT_HEIGHT + 8.0 + ALIGN_LABEL_H;
    let h_buttons = [
        (PropertyPanelAction::SetTextAlign(TextAlignValue::Left), 0),
        (PropertyPanelAction::SetTextAlign(TextAlignValue::Center), 1),
        (PropertyPanelAction::SetTextAlign(TextAlignValue::Right), 2),
        (
            PropertyPanelAction::SetTextAlign(TextAlignValue::Justify),
            3,
        ),
    ];
    let h_w = usable_w / 4.0;
    for (action, i) in h_buttons {
        out.push((
            action,
            Rect {
                origin: Point2D::new(x0 + PAD_X + i as f32 * h_w, y),
                size: Point2D::new(h_w, button_h),
            },
        ));
    }
    y += button_h + 6.0 + ALIGN_LABEL_H;
    let v_buttons = [
        (
            PropertyPanelAction::SetTextVerticalAlign(TextVerticalAlignValue::Top),
            0,
        ),
        (
            PropertyPanelAction::SetTextVerticalAlign(TextVerticalAlignValue::Middle),
            1,
        ),
        (
            PropertyPanelAction::SetTextVerticalAlign(TextVerticalAlignValue::Bottom),
            2,
        ),
    ];
    let v_w = usable_w / 3.0;
    for (action, i) in v_buttons {
        out.push((
            action,
            Rect {
                origin: Point2D::new(x0 + PAD_X + i as f32 * v_w, y),
                size: Point2D::new(v_w, button_h),
            },
        ));
    }
    out
}

/// Dropdown rows for the weight picker — opens below the left-half
/// weight trigger of the weight/size row.
pub fn font_weight_picker_action_rects(
    x0: f32,
    y: f32,
    usable_w: f32,
    touch_controls: bool,
) -> Vec<(PropertyPanelAction, Rect)> {
    // Full-width rows so the "number + name" labels (e.g. "800 Extra
    // Bold") fit; the trigger sits on the left half but a dropdown may
    // be wider than its trigger.
    let weight_y = y
        + text_layout_block_height(touch_controls)
        + SECTION_HEADER_HEIGHT
        + INPUT_HEIGHT
        + CONTENT_ROW_GAP
        + INPUT_HEIGHT
        + FAMILY_ROW_GAP
        + INPUT_HEIGHT
        + 4.0;
    FontWeightChoice::ALL
        .into_iter()
        .enumerate()
        .map(|(i, choice)| {
            (
                PropertyPanelAction::SetFontWeight(choice),
                Rect {
                    origin: Point2D::new(x0 + PAD_X, weight_y + i as f32 * 28.0),
                    size: Point2D::new(usable_w, 28.0),
                },
            )
        })
        .collect()
}

#[allow(clippy::too_many_arguments)]
pub fn paint_text_section(
    cx: &mut PaintCx<'_>,
    theme: &Theme,
    snapshot: &NodeSnapshot,
    edit: &EditContext<'_>,
    locale: op_editor_core::Locale,
    touch_controls: bool,
    x: f32,
    y: f32,
    width: f32,
) -> f32 {
    let Some(text) = snapshot.text.as_ref() else {
        return y;
    };
    let mut y = paint_section_label(
        cx,
        theme,
        op_i18n::translate(locale, "textLayout.title"),
        x,
        y,
        width,
    );
    y = paint_text_growth_row(cx, theme, locale, x, y, width, text.growth, touch_controls);
    y += 12.0;
    let mut y = paint_section_label(
        cx,
        theme,
        op_i18n::translate(locale, "text.typography"),
        x,
        y,
        width,
    );
    let usable_w = width - PAD_X * 2.0;
    // Content edit input + Copy text button row.
    let content_w = (usable_w - COPY_BTN_W - COPY_BTN_GAP).max(40.0);
    let content_rect = Rect {
        origin: Point2D::new(x + PAD_X, y),
        size: Point2D::new(content_w, INPUT_HEIGHT),
    };
    paint_input_with_prefix_focused_state(
        cx,
        theme,
        content_rect,
        "T",
        edit.value_for(PropertyFocus::TextContent, &text.content),
        edit.focus == Some(PropertyFocus::TextContent),
        edit.caret_at(PropertyFocus::TextContent),
        edit.select_all_at(PropertyFocus::TextContent),
        edit.input_at(PropertyFocus::TextContent),
        edit.now_ms,
    );
    let copy_rect = Rect {
        origin: Point2D::new(x + PAD_X + content_w + COPY_BTN_GAP, y),
        size: Point2D::new(COPY_BTN_W, INPUT_HEIGHT),
    };
    cx.backend
        .fill_round_rect(copy_rect, INPUT_RADIUS, theme.muted);
    draw_icon(
        cx.backend,
        Icon::Copy,
        Point2D::new(
            copy_rect.origin.x + (copy_rect.size.x - 14.0) / 2.0,
            copy_rect.origin.y + (copy_rect.size.y - 14.0) / 2.0,
        ),
        14.0,
        theme.foreground,
        1.5,
    );
    y += INPUT_HEIGHT + CONTENT_ROW_GAP;

    let family_rect = Rect {
        origin: Point2D::new(x + PAD_X, y),
        size: Point2D::new(usable_w, INPUT_HEIGHT),
    };
    cx.backend
        .fill_round_rect(family_rect, INPUT_RADIUS, theme.muted);
    // The trigger shows the first family of the stack, painted in
    // that family (TS trigger: `style={{ fontFamily: value }}` +
    // `displayName(value)`).
    let family_name = display_font_family(&text.font_family);
    let family = TextLayout::single_run(
        family_name,
        family_name,
        12.0,
        (theme.foreground).to_jian(),
        Point2D::new(0.0, 0.0),
    );
    cx.backend.draw_text(
        &family,
        Point2D::new(family_rect.origin.x + 10.0, family_rect.origin.y + 19.0),
    );
    draw_icon(
        cx.backend,
        Icon::ChevronDown,
        Point2D::new(
            family_rect.origin.x + family_rect.size.x - 18.0,
            family_rect.origin.y + 8.0,
        ),
        14.0,
        theme.muted_foreground,
        1.5,
    );
    y += INPUT_HEIGHT + FAMILY_ROW_GAP;

    let half_w = (usable_w - 8.0) / 2.0;
    // Weight dropdown trigger — named weight (粗体 / 常规 / …) + chevron,
    // mirroring the font-family trigger (TS Select parity).
    let weight_rect = Rect {
        origin: Point2D::new(x + PAD_X, y),
        size: Point2D::new(half_w, INPUT_HEIGHT),
    };
    cx.backend
        .fill_round_rect(weight_rect, INPUT_RADIUS, theme.muted);
    let weight_label = op_i18n::translate(
        locale,
        FontWeightChoice::nearest(text.font_weight).label_key(),
    );
    let weight_text = TextLayout::single_run(
        weight_label,
        "system-ui",
        12.0,
        (theme.foreground).to_jian(),
        Point2D::new(0.0, 0.0),
    );
    cx.backend.draw_text(
        &weight_text,
        Point2D::new(weight_rect.origin.x + 10.0, weight_rect.origin.y + 19.0),
    );
    draw_icon(
        cx.backend,
        Icon::ChevronDown,
        Point2D::new(
            weight_rect.origin.x + weight_rect.size.x - 18.0,
            weight_rect.origin.y + 8.0,
        ),
        14.0,
        theme.muted_foreground,
        1.5,
    );
    let font_size = format_panel_number(text.font_size);
    paint_input_with_prefix_focused_state(
        cx,
        theme,
        Rect {
            origin: Point2D::new(x + PAD_X + half_w + 8.0, y),
            size: Point2D::new(half_w, INPUT_HEIGHT),
        },
        "S",
        edit.value_for(PropertyFocus::FontSize, &font_size),
        edit.focus == Some(PropertyFocus::FontSize),
        edit.caret_at(PropertyFocus::FontSize),
        edit.select_all_at(PropertyFocus::FontSize),
        edit.input_at(PropertyFocus::FontSize),
        edit.now_ms,
    );
    y += INPUT_HEIGHT + FORMAT_ROW_GAP;

    // Formatting toolbar row: Bold (B), Italic (I), Underline (U), Strikethrough (S).
    let button_h = text_button_height(touch_controls);
    let fmt_w = usable_w / 4.0;
    let fmt_track = Rect {
        origin: Point2D::new(x + PAD_X, y),
        size: Point2D::new(usable_w, button_h),
    };
    cx.backend
        .fill_round_rect(fmt_track, INPUT_RADIUS, theme.muted);
    for (i, (icon, is_on)) in [
        (Icon::Bold, text.font_weight >= 600),
        (Icon::Italic, text.italic),
        (Icon::Underline, text.underline),
        (Icon::Strikethrough, text.strikethrough),
    ]
    .into_iter()
    .enumerate()
    {
        let cell = Rect {
            origin: Point2D::new(x + PAD_X + i as f32 * fmt_w + 2.0, y + 2.0),
            size: Point2D::new((fmt_w - 4.0).max(0.0), (button_h - 4.0).max(0.0)),
        };
        if is_on {
            cx.backend.fill_round_rect(cell, 4.0, theme.background);
        }
        draw_icon(
            cx.backend,
            icon,
            Point2D::new(
                cell.origin.x + (cell.size.x - 14.0) / 2.0,
                cell.origin.y + (cell.size.y - 14.0) / 2.0,
            ),
            14.0,
            if is_on {
                theme.primary
            } else {
                theme.muted_foreground
            },
            1.6,
        );
    }
    y += button_h + 6.0;

    // Caption row — 行高 (left) / 字间距 (right), small muted labels
    // above the inputs (TS `text-[9px] justify-between`).
    let caption_color = (theme.muted_foreground).to_jian();
    let lh_caption = TextLayout::single_run(
        op_i18n::translate(locale, "text.lineHeight"),
        "system-ui",
        9.0,
        caption_color,
        Point2D::new(0.0, 0.0),
    );
    cx.backend
        .draw_text(&lh_caption, Point2D::new(x + PAD_X + 2.0, y + 10.0));
    let ls_label = op_i18n::translate(locale, "text.letterSpacing");
    let ls_caption = TextLayout::single_run(
        ls_label,
        "system-ui",
        9.0,
        caption_color,
        Point2D::new(0.0, 0.0),
    );
    let ls_caption_w = text_metrics::measure_chrome(cx.backend, ls_label, 9.0);
    cx.backend.draw_text(
        &ls_caption,
        Point2D::new(x + width - PAD_X - 2.0 - ls_caption_w, y + 10.0),
    );
    y += LH_LS_LABEL_H;

    // Line-height — icon prefix + value + `%` suffix (TS NumberInput
    // with `icon={LineHeightIcon}` + `suffix="%"`).
    let line_height = format_panel_number(text.line_height_percent);
    paint_input_with_icon_focused_state(
        cx,
        theme,
        Rect {
            origin: Point2D::new(x + PAD_X, y),
            size: Point2D::new(half_w, INPUT_HEIGHT),
        },
        Icon::LineHeight,
        edit.value_for(PropertyFocus::LineHeight, &line_height),
        Some("%"),
        edit.focus == Some(PropertyFocus::LineHeight),
        edit.caret_at(PropertyFocus::LineHeight),
        edit.select_all_at(PropertyFocus::LineHeight),
        edit.input_at(PropertyFocus::LineHeight),
        edit.now_ms,
    );
    // Letter-spacing — `|A|` text prefix (TS NumberInput `label="|A|"`).
    let letter_spacing = format_panel_number(text.letter_spacing);
    paint_input_with_prefix_focused_state(
        cx,
        theme,
        Rect {
            origin: Point2D::new(x + PAD_X + half_w + 8.0, y),
            size: Point2D::new(half_w, INPUT_HEIGHT),
        },
        "|A|",
        edit.value_for(PropertyFocus::LetterSpacing, &letter_spacing),
        edit.focus == Some(PropertyFocus::LetterSpacing),
        edit.caret_at(PropertyFocus::LetterSpacing),
        edit.select_all_at(PropertyFocus::LetterSpacing),
        edit.input_at(PropertyFocus::LetterSpacing),
        edit.now_ms,
    );
    y += INPUT_HEIGHT + 8.0;

    y = paint_horizontal_align_row(cx, theme, locale, x, y, width, text.align, touch_controls);
    y = paint_vertical_align_row(
        cx,
        theme,
        locale,
        x,
        y + 6.0,
        width,
        text.vertical_align,
        touch_controls,
    );
    y += 12.0;
    paint_section_divider(cx, theme, x, y, width);
    y + SECTION_GAP
}

pub use crate::widgets::property_panel_typography::paint_font_weight_picker;
pub(crate) use crate::widgets::property_panel_typography::{
    font_weight_picker_rect, sections_top_before_text, text_section_top,
};

#[allow(clippy::too_many_arguments)]
fn paint_text_growth_row(
    cx: &mut PaintCx<'_>,
    theme: &Theme,
    locale: op_editor_core::Locale,
    x: f32,
    y: f32,
    width: f32,
    active: TextGrowthValue,
    touch_controls: bool,
) -> f32 {
    let usable_w = width - PAD_X * 2.0;
    let specs = [
        (TextGrowthValue::Auto, "textLayout.autoWidth"),
        (TextGrowthValue::FixedWidth, "textLayout.autoHeight"),
        (TextGrowthValue::FixedWidthHeight, "textLayout.fixed"),
    ];
    let labels: Vec<&str> = specs
        .iter()
        .map(|(_, key)| op_i18n::translate(locale, key))
        .collect();
    let active_idx = specs.iter().position(|(v, _)| *v == active).unwrap_or(0);
    jian_widgets::components::toggle_group::ToggleGroup {
        options: &labels,
        icons: None,
        active: active_idx,
        hover: None,
        font_size: 10.0,
    }
    .paint(
        cx.backend,
        Rect {
            origin: Point2D::new(x + PAD_X, y),
            size: Point2D::new(usable_w, text_button_height(touch_controls)),
        },
        &crate::widgets::button::tokens_from_theme(theme),
    );
    y + text_button_height(touch_controls)
}

#[allow(clippy::too_many_arguments)]
fn paint_horizontal_align_row(
    cx: &mut PaintCx<'_>,
    theme: &Theme,
    locale: op_editor_core::Locale,
    x: f32,
    y: f32,
    width: f32,
    active: TextAlignValue,
    touch_controls: bool,
) -> f32 {
    paint_align_row(
        cx,
        theme,
        locale,
        x,
        y,
        width,
        "text.horizontal",
        &H_ALIGN_SPECS,
        active,
        touch_controls,
    )
}

#[allow(clippy::too_many_arguments)]
fn paint_vertical_align_row(
    cx: &mut PaintCx<'_>,
    theme: &Theme,
    locale: op_editor_core::Locale,
    x: f32,
    y: f32,
    width: f32,
    active: TextVerticalAlignValue,
    touch_controls: bool,
) -> f32 {
    paint_align_row(
        cx,
        theme,
        locale,
        x,
        y,
        width,
        "text.vertical",
        &V_ALIGN_SPECS,
        active,
        touch_controls,
    )
}

#[allow(clippy::too_many_arguments)]
fn paint_align_row<T: Copy + PartialEq>(
    cx: &mut PaintCx<'_>,
    theme: &Theme,
    locale: op_editor_core::Locale,
    x: f32,
    y: f32,
    width: f32,
    label_key: &'static str,
    specs: &[AlignButtonSpec<T>],
    active: T,
    touch_controls: bool,
) -> f32 {
    let label = TextLayout::single_run(
        op_i18n::translate(locale, label_key),
        "system-ui",
        11.0,
        (theme.muted_foreground).to_jian(),
        Point2D::new(0.0, 0.0),
    );
    cx.backend
        .draw_text(&label, Point2D::new(x + PAD_X, y + 13.0));
    let y = y + ALIGN_LABEL_H;
    let usable_w = width - PAD_X * 2.0;
    // Icon-only segmented control via jian ToggleGroup; font_size 12 yields a
    // 16px icon (font + 4), matching the previous hand-rolled cells.
    let empty_labels: Vec<&str> = specs.iter().map(|_| "").collect();
    let icon_paths: Vec<&[&str]> = specs.iter().map(|s| s.icon.paths()).collect();
    let active_idx = specs.iter().position(|s| s.value == active).unwrap_or(0);
    jian_widgets::components::toggle_group::ToggleGroup {
        options: &empty_labels,
        icons: Some(&icon_paths),
        active: active_idx,
        hover: None,
        font_size: 12.0,
    }
    .paint(
        cx.backend,
        Rect {
            origin: Point2D::new(x + PAD_X, y),
            size: Point2D::new(usable_w, text_button_height(touch_controls)),
        },
        &crate::widgets::button::tokens_from_theme(theme),
    );
    y + text_button_height(touch_controls)
}

#[derive(Clone, Copy)]
struct AlignButtonSpec<T> {
    value: T,
    icon: Icon,
}

const H_ALIGN_SPECS: [AlignButtonSpec<TextAlignValue>; 4] = [
    AlignButtonSpec {
        value: TextAlignValue::Left,
        icon: Icon::AlignLeft,
    },
    AlignButtonSpec {
        value: TextAlignValue::Center,
        icon: Icon::AlignCenterH,
    },
    AlignButtonSpec {
        value: TextAlignValue::Right,
        icon: Icon::AlignRight,
    },
    AlignButtonSpec {
        value: TextAlignValue::Justify,
        icon: Icon::AlignCenterH,
    },
];

const V_ALIGN_SPECS: [AlignButtonSpec<TextVerticalAlignValue>; 3] = [
    AlignButtonSpec {
        value: TextVerticalAlignValue::Top,
        icon: Icon::AlignTop,
    },
    AlignButtonSpec {
        value: TextVerticalAlignValue::Middle,
        icon: Icon::AlignCenterV,
    },
    AlignButtonSpec {
        value: TextVerticalAlignValue::Bottom,
        icon: Icon::AlignBottom,
    },
];
