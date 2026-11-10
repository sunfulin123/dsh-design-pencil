//! Text alignment controls.
use super::*;

#[allow(clippy::too_many_arguments)]
pub(super) fn paint_horizontal_align_row(
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
pub(super) fn paint_vertical_align_row(
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

#[allow(clippy::too_many_arguments)]
pub(super) fn paint_text_growth_row(
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
