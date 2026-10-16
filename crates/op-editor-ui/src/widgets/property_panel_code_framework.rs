//! Framework selector geometry, paint, and hit-test helpers for the Code
//! panel. Kept separate because the selector is a self-contained horizontal
//! scrolling control shared by native and web hosts.

use super::action_hovered;
use crate::theme::Theme;
use crate::widgets::property_panel_inputs::{PAD_X, SECTION_GAP, TAB_HEIGHT};
use crate::widgets::PaintCx;
use crate::{Point2D, Rect};
use op_editor_core::codegen::{CodegenHover, CodegenPhase, CodegenState, Framework};

const CHIP_HEIGHT: f32 = 28.0;
pub(super) const TOUCH_TARGET_SIZE: f32 = 34.0;
const CHIP_PAD_X: f32 = 10.0;
const CHIP_FONT_SIZE: f32 = 12.0;
const CHIP_GAP: f32 = 4.0;
pub(super) const CHEVRON_ZONE_W: f32 = 18.0;
const CHIP_TOP_PAD: f32 = 8.0;
const CHIP_DIVIDER_GAP: f32 = 8.0;
const DROPDOWN_ROW_H: f32 = 28.0;

#[derive(Clone, Copy)]
struct FrameworkStripMetrics {
    chip_height: f32,
    chip_min_width: f32,
    chevron_width: f32,
}

fn strip_metrics(touch_controls: bool) -> FrameworkStripMetrics {
    if touch_controls {
        FrameworkStripMetrics {
            chip_height: TOUCH_TARGET_SIZE,
            chip_min_width: TOUCH_TARGET_SIZE,
            chevron_width: TOUCH_TARGET_SIZE,
        }
    } else {
        FrameworkStripMetrics {
            chip_height: CHIP_HEIGHT,
            chip_min_width: 0.0,
            chevron_width: CHEVRON_ZONE_W,
        }
    }
}

fn framework_tab_label(fw: Framework) -> &'static str {
    match fw {
        Framework::React => "Design JSX",
        Framework::Vue => "Tailwind JSX",
        Framework::Svelte => "Svelte",
        Framework::Html => "HTML/CSS",
        Framework::Flutter => "Flutter",
        Framework::SwiftUi => "SwiftUI",
        Framework::Compose => "Compose",
        Framework::ReactNative => "RN",
    }
}

fn chip_label_width(label: &str) -> f32 {
    label.chars().fold(0.0, |width, ch| {
        width
            + if ch.is_ascii() {
                CHIP_FONT_SIZE * 0.55
            } else {
                CHIP_FONT_SIZE
            }
    })
}

fn framework_row_width(touch_controls: bool) -> f32 {
    let metrics = strip_metrics(touch_controls);
    Framework::ALL
        .iter()
        .enumerate()
        .map(|(index, framework)| {
            let gap = if index == 0 { 0.0 } else { CHIP_GAP };
            let width = chip_label_width(framework_tab_label(*framework)) + CHIP_PAD_X * 2.0;
            gap + width.max(metrics.chip_min_width)
        })
        .sum()
}

fn framework_overflows(width: f32, touch_controls: bool) -> bool {
    framework_row_width(touch_controls) > (width - PAD_X * 2.0).max(0.0)
}

pub fn framework_row_overflow(width: f32) -> f32 {
    framework_row_overflow_for(width, false)
}

pub(crate) fn framework_row_overflow_for(width: f32, touch_controls: bool) -> f32 {
    let metrics = strip_metrics(touch_controls);
    let usable = (width - PAD_X * 2.0).max(0.0);
    let row_width = framework_row_width(touch_controls);
    if row_width <= usable {
        return 0.0;
    }
    (row_width - (usable - 2.0 * metrics.chevron_width)).max(0.0)
}

pub fn framework_row_band(panel_top: f32) -> (f32, f32) {
    framework_row_band_for(panel_top, false)
}

pub(crate) fn framework_row_band_for(panel_top: f32, touch_controls: bool) -> (f32, f32) {
    let metrics = strip_metrics(touch_controls);
    let top = panel_top + TAB_HEIGHT + CHIP_TOP_PAD;
    (top, top + metrics.chip_height)
}

pub(super) fn framework_chip_rects(
    x: f32,
    y: f32,
    width: f32,
    scroll: f32,
) -> Vec<(Framework, Rect)> {
    framework_chip_rects_for(x, y, width, scroll, false)
}

pub(super) fn framework_chip_rects_for(
    x: f32,
    y: f32,
    width: f32,
    scroll: f32,
    touch_controls: bool,
) -> Vec<(Framework, Rect)> {
    let metrics = strip_metrics(touch_controls);
    let inset = if framework_overflows(width, touch_controls) {
        metrics.chevron_width
    } else {
        0.0
    };
    let widths: Vec<f32> = Framework::ALL
        .iter()
        .map(|framework| {
            (chip_label_width(framework_tab_label(*framework)) + CHIP_PAD_X * 2.0)
                .max(metrics.chip_min_width)
        })
        .collect();
    let advances: Vec<f32> = widths.iter().map(|width| width + CHIP_GAP).collect();
    let rects = jian_widgets::components::tabs::Tabs::content_rects(
        Point2D::new(x + PAD_X + inset, y),
        &widths,
        &advances,
        metrics.chip_height,
        scroll,
    );
    Framework::ALL.iter().copied().zip(rects).collect()
}

pub(super) fn chips_body_top(y: f32) -> f32 {
    chips_body_top_for(y, false)
}

pub(super) fn chips_body_top_for(y: f32, touch_controls: bool) -> f32 {
    y + strip_metrics(touch_controls).chip_height + CHIP_DIVIDER_GAP + SECTION_GAP
}

pub(super) fn framework_chevron_zones(x: f32, y: f32, width: f32) -> Option<(Rect, Rect)> {
    framework_chevron_zones_for(x, y, width, false)
}

pub(super) fn framework_chevron_zones_for(
    x: f32,
    y: f32,
    width: f32,
    touch_controls: bool,
) -> Option<(Rect, Rect)> {
    if !framework_overflows(width, touch_controls) {
        return None;
    }
    let metrics = strip_metrics(touch_controls);
    let band_left = x + PAD_X;
    let band_right = x + width - PAD_X;
    Some((
        Rect {
            origin: Point2D::new(band_left, y),
            size: Point2D::new(metrics.chevron_width, metrics.chip_height),
        },
        Rect {
            origin: Point2D::new(band_right - metrics.chevron_width, y),
            size: Point2D::new(metrics.chevron_width, metrics.chip_height),
        },
    ))
}

pub fn framework_at(x: f32, y: f32, width: f32, point: Point2D, scroll: f32) -> Option<Framework> {
    framework_at_for_touch(x, y, width, point, scroll, false)
}

pub(crate) fn framework_at_for_touch(
    x: f32,
    y: f32,
    width: f32,
    point: Point2D,
    scroll: f32,
    touch_controls: bool,
) -> Option<Framework> {
    let metrics = strip_metrics(touch_controls);
    let usable = (width - PAD_X * 2.0).max(0.0);
    let inset = if framework_row_overflow_for(width, touch_controls) > 0.0 {
        metrics.chevron_width
    } else {
        0.0
    };
    let band_left = x + PAD_X + inset;
    let band_right = x + PAD_X + usable - inset;
    framework_chip_rects_for(x, y, width, scroll, touch_controls)
        .into_iter()
        .filter(|(_, rect)| rect.origin.x + rect.size.x > band_left && rect.origin.x < band_right)
        .find(|(_, rect)| {
            point.x >= rect.origin.x.max(band_left)
                && point.x <= (rect.origin.x + rect.size.x).min(band_right)
                && point.y >= rect.origin.y
                && point.y <= rect.origin.y + rect.size.y
        })
        .map(|(framework, _)| framework)
}

pub(super) fn framework_dropdown_trigger_rect(
    x: f32,
    y: f32,
    width: f32,
    touch_controls: bool,
) -> Rect {
    let metrics = strip_metrics(touch_controls);
    let usable = (width - PAD_X * 2.0).max(0.0);
    Rect {
        origin: Point2D::new(x + PAD_X, y),
        size: Point2D::new(usable, metrics.chip_height),
    }
}

pub(super) fn framework_dropdown_option_rects(
    x: f32,
    y: f32,
    width: f32,
    touch_controls: bool,
) -> Vec<(Framework, Rect)> {
    let trigger = framework_dropdown_trigger_rect(x, y, width, touch_controls);
    let row_h = if touch_controls {
        TOUCH_TARGET_SIZE
    } else {
        DROPDOWN_ROW_H
    };
    let popup_top = trigger.origin.y + trigger.size.y + 4.0;
    Framework::ALL
        .iter()
        .copied()
        .enumerate()
        .map(|(index, fw)| {
            (
                fw,
                Rect {
                    origin: Point2D::new(trigger.origin.x, popup_top + index as f32 * row_h),
                    size: Point2D::new(trigger.size.x, row_h),
                },
            )
        })
        .collect()
}

pub(super) fn paint_framework_chips(
    cx: &mut PaintCx<'_>,
    theme: &Theme,
    state: &CodegenState,
    x: f32,
    y: f32,
    width: f32,
) -> f32 {
    paint_framework_chips_for(cx, theme, state, x, y, width, false)
}

pub(super) fn paint_framework_chips_for(
    cx: &mut PaintCx<'_>,
    theme: &Theme,
    state: &CodegenState,
    x: f32,
    y: f32,
    width: f32,
    touch_controls: bool,
) -> f32 {
    let trigger = framework_dropdown_trigger_rect(x, y, width, touch_controls);
    let tokens = crate::widgets::button::tokens_from_theme(theme);
    let interactive = !matches!(state.phase, CodegenPhase::Generating);
    jian_widgets::components::select_trigger::SelectTrigger {
        icon_paths: None,
        label: framework_tab_label(state.framework),
        placeholder: "",
        hovered: interactive
            && (action_hovered(state, CodegenHover::FrameworkTrigger)
                || state.framework_picker_open),
        pressed: false,
        enabled: interactive,
        font_size: CHIP_FONT_SIZE,
        bordered: true,
    }
    .paint(cx.backend, trigger, &tokens);

    chips_body_top_for(y, touch_controls)
}

pub(super) fn paint_framework_dropdown_overlay(
    cx: &mut PaintCx<'_>,
    theme: &Theme,
    state: &CodegenState,
    x: f32,
    y: f32,
    width: f32,
    touch_controls: bool,
) {
    if !state.framework_picker_open {
        return;
    }
    let options = framework_dropdown_option_rects(x, y, width, touch_controls);
    let Some((_, first)) = options.first() else {
        return;
    };
    let Some((_, last)) = options.last() else {
        return;
    };
    let popup = Rect {
        origin: Point2D::new(first.origin.x, first.origin.y - 4.0),
        size: Point2D::new(
            first.size.x,
            (last.origin.y + last.size.y - first.origin.y) + 8.0,
        ),
    };
    let tokens = crate::widgets::button::tokens_from_theme(theme);
    cx.backend.fill_round_rect(popup, 6.0, tokens.popover);
    cx.backend.stroke_round_rect(popup, 6.0, tokens.border, 1.0);
    for (fw, row_rect) in options {
        let is_selected = fw == state.framework;
        let is_hovered = state.framework_hover == Some(fw);
        if is_hovered {
            cx.backend.fill_rect(row_rect, tokens.button_hover);
        } else if is_selected {
            cx.backend.fill_rect(row_rect, tokens.row_selected_primary);
        }
        if is_selected {
            cx.backend.stroke_svg_path(
                "M20 6 9 17l-5-5",
                Point2D::new(
                    row_rect.origin.x + 8.0,
                    row_rect.origin.y + (row_rect.size.y - 14.0) / 2.0,
                ),
                14.0,
                tokens.primary,
                1.75,
            );
        }
        let color = if is_selected {
            tokens.primary
        } else {
            tokens.popover_foreground
        };
        let layout = crate::TextLayout::single_run(
            framework_tab_label(fw),
            "Inter",
            CHIP_FONT_SIZE,
            color.to_jian(),
            Point2D::new(0.0, 0.0),
        );
        cx.backend.draw_text(
            &layout,
            Point2D::new(
                row_rect.origin.x + 28.0,
                jian_widgets::centered_text_baseline_y(row_rect, CHIP_FONT_SIZE),
            ),
        );
    }
}
