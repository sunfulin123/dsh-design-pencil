//! Font-family picker paint pass — split out of
//! `property_panel_typography.rs` to keep that module under the
//! 800-line ceiling. Re-exported from the parent as
//! `property_panel_typography::paint_font_picker`.

use super::{
    display_font_family, font_picker_layout, font_picker_layout_at_for_ui, FontPickerEntry,
    FontPickerLayout, FontPickerRow, PAD_X,
};
use crate::theme::Theme;
use crate::widgets::button::paint_button_feedback_wash;
use crate::widgets::icons::{draw_icon, Icon};
use crate::widgets::property_panel_layout::VisibleSections;
use crate::widgets::text_metrics;
use crate::widgets::PaintCx;
use crate::{Point2D, Rect, TextLayout};
use jian_widgets::components::select::SelectState;

pub(super) fn is_active_font_family(active: &str, entry: &str) -> bool {
    active.trim().eq_ignore_ascii_case(entry.trim())
}

/// Paint the dropdown (call as a late overlay, after the sections).
#[allow(clippy::too_many_arguments)]
pub fn paint_font_picker(
    cx: &mut PaintCx<'_>,
    theme: &Theme,
    panel_rect: Rect,
    visible: VisibleSections,
    locale: op_editor_core::Locale,
    entries: &[FontPickerEntry],
    allow_import: bool,
    search: &str,
    state: &SelectState,
    import_hover: bool,
    active_family: &str,
    now_ms: u64,
) {
    if !state.open {
        return;
    }
    let Some(layout) = font_picker_layout(
        panel_rect,
        visible,
        entries,
        allow_import,
        state.scroll.offset,
    ) else {
        return;
    };
    paint_font_picker_layout(
        cx,
        theme,
        locale,
        entries,
        search,
        state,
        import_hover,
        active_family,
        now_ms,
        &layout,
    );
}

/// Paint the same picker against an arbitrary row trigger. Missing-font
/// surfaces use this without depending on PropertyPanel layout internals.
#[allow(clippy::too_many_arguments)]
pub fn paint_font_picker_at(
    cx: &mut PaintCx<'_>,
    theme: &Theme,
    trigger: Rect,
    popup_width: f32,
    bounds: Rect,
    locale: op_editor_core::Locale,
    entries: &[FontPickerEntry],
    allow_import: bool,
    allow_remove: bool,
    search: &str,
    state: &SelectState,
    import_hover: bool,
    active_family: &str,
    now_ms: u64,
) {
    paint_font_picker_at_for_ui(
        cx,
        theme,
        trigger,
        popup_width,
        bounds,
        locale,
        entries,
        allow_import,
        allow_remove,
        search,
        state,
        import_hover,
        active_family,
        now_ms,
        false,
    );
}

/// Density-aware arbitrary-anchor picker paint. Its layout is resolved by the
/// same touch flag used by Settings hit-testing and scroll bounds.
#[allow(clippy::too_many_arguments)]
pub fn paint_font_picker_at_for_ui(
    cx: &mut PaintCx<'_>,
    theme: &Theme,
    trigger: Rect,
    popup_width: f32,
    bounds: Rect,
    locale: op_editor_core::Locale,
    entries: &[FontPickerEntry],
    allow_import: bool,
    allow_remove: bool,
    search: &str,
    state: &SelectState,
    import_hover: bool,
    active_family: &str,
    now_ms: u64,
    touch_controls: bool,
) {
    if !state.open {
        return;
    }
    let layout = font_picker_layout_at_for_ui(
        trigger,
        popup_width,
        bounds,
        entries,
        allow_import,
        allow_remove,
        state.scroll.offset,
        touch_controls,
    );
    paint_font_picker_layout(
        cx,
        theme,
        locale,
        entries,
        search,
        state,
        import_hover,
        active_family,
        now_ms,
        &layout,
    );
}

#[allow(clippy::too_many_arguments)]
fn paint_font_picker_layout(
    cx: &mut PaintCx<'_>,
    theme: &Theme,
    locale: op_editor_core::Locale,
    entries: &[FontPickerEntry],
    search: &str,
    state: &SelectState,
    import_hover: bool,
    active_family: &str,
    now_ms: u64,
    layout: &FontPickerLayout,
) {
    let touch = layout.touch_controls;
    let body_font = if touch { 15.0 } else { 11.0 };
    let secondary_font = if touch { 14.0 } else { 11.0 };
    let group_font = if touch { 14.0 } else { 9.0 };
    let icon_size = if touch { 16.0 } else { 12.0 };
    cx.backend.fill_round_rect(layout.popup, 8.0, theme.popover);
    cx.backend
        .stroke_round_rect(layout.popup, 8.0, theme.border, 1.0);

    // Search row — Search glyph + draft (or muted placeholder) +
    // steady caret, separated by a hairline (TS border-b).
    let s = layout.search;
    draw_icon(
        cx.backend,
        Icon::Search,
        Point2D::new(
            s.origin.x + if touch { 12.0 } else { 8.0 },
            s.origin.y + (s.size.y - icon_size) / 2.0,
        ),
        icon_size,
        theme.muted_foreground,
        1.5,
    );
    let text_x = s.origin.x + if touch { 38.0 } else { 26.0 };
    let baseline = jian_widgets::centered_text_baseline_y(s, body_font);
    // Draft + placeholder + caret render through the unified jian TextInputView
    // (family-aware caret, no hand-rolled drift). The buffer is rebuilt from the
    // search String each frame; the open picker reads as focused.
    let mut search_input = jian_core::text_input::TextInputState::with_text(search.to_string());
    // Anchor the blink to this frame so the caret stays visible while the
    // picker is open (the buffer is rebuilt each frame).
    search_input.touch(now_ms);
    crate::widgets::property_panel_text_input::paint_text_input_view(
        cx,
        theme,
        &search_input,
        s,
        body_font,
        text_x - s.origin.x,
        baseline,
        now_ms,
        op_i18n::translate(locale, "text.font.search"),
        true,
    );
    cx.backend.fill_rect(
        Rect {
            origin: Point2D::new(s.origin.x, s.origin.y + s.size.y - 1.0),
            size: Point2D::new(s.size.x, 1.0),
        },
        theme.border,
    );

    // Scrolling list — clipped to the viewport.
    cx.backend.save();
    cx.backend.clip_rect(layout.viewport);
    let active = display_font_family(active_family);
    for (row, rect) in &layout.rows {
        // Cull rows fully outside the viewport.
        if rect.origin.y + rect.size.y < layout.viewport.origin.y
            || rect.origin.y > layout.viewport.origin.y + layout.viewport.size.y
        {
            continue;
        }
        match row {
            FontPickerRow::GroupImported
            | FontPickerRow::GroupBundled
            | FontPickerRow::GroupSystem => {
                let label_str = match row {
                    FontPickerRow::GroupImported => {
                        op_i18n::translate(locale, "text.font.imported")
                    }
                    FontPickerRow::GroupBundled => op_i18n::translate(locale, "text.font.bundled"),
                    _ => op_i18n::translate(locale, "text.font.system"),
                };
                let label = TextLayout::single_run(
                    label_str,
                    "system-ui",
                    group_font,
                    (theme.muted_foreground).to_jian(),
                    Point2D::new(0.0, 0.0),
                );
                cx.backend.draw_text(
                    &label,
                    Point2D::new(
                        rect.origin.x + 10.0,
                        jian_widgets::centered_text_baseline_y(*rect, group_font),
                    ),
                );
            }
            FontPickerRow::NoResults => {
                let label_str = op_i18n::translate(locale, "text.font.noResults");
                let label = TextLayout::single_run(
                    label_str,
                    "system-ui",
                    secondary_font,
                    (theme.muted_foreground).to_jian(),
                    Point2D::new(0.0, 0.0),
                );
                let w = text_metrics::measure_chrome(cx.backend, label_str, secondary_font);
                cx.backend.draw_text(
                    &label,
                    Point2D::new(
                        rect.origin.x + (rect.size.x - w) / 2.0,
                        jian_widgets::centered_text_baseline_y(*rect, secondary_font),
                    ),
                );
            }
            FontPickerRow::RemoveEntry(_) => {
                // Small muted "x" centred in its square hit-rect.
                draw_icon(
                    cx.backend,
                    Icon::Close,
                    Point2D::new(
                        rect.origin.x + (rect.size.x - icon_size) / 2.0,
                        rect.origin.y + (rect.size.y - icon_size) / 2.0,
                    ),
                    icon_size,
                    theme.muted_foreground,
                    1.5,
                );
            }
            FontPickerRow::ImportAction => {
                // Hover wash inset like the Entry arm so the row reads
                // identically to entry hover (painted BELOW the hairline
                // + icon + label).
                if import_hover {
                    let row_rect = Rect {
                        origin: Point2D::new(rect.origin.x + 2.0, rect.origin.y + 2.0),
                        size: Point2D::new(rect.size.x - 4.0, rect.size.y - 4.0),
                    };
                    paint_button_feedback_wash(cx.backend, theme, row_rect, 5.0, true, false);
                }
                // Top hairline separating the action from the list.
                cx.backend.fill_rect(
                    Rect {
                        origin: Point2D::new(rect.origin.x, rect.origin.y),
                        size: Point2D::new(rect.size.x, 1.0),
                    },
                    theme.border,
                );
                draw_icon(
                    cx.backend,
                    Icon::Plus,
                    Point2D::new(
                        rect.origin.x + PAD_X,
                        rect.origin.y + (rect.size.y - icon_size) / 2.0,
                    ),
                    icon_size,
                    theme.foreground,
                    1.6,
                );
                let label = TextLayout::single_run(
                    op_i18n::translate(locale, "text.font.importAction"),
                    "system-ui",
                    body_font,
                    (theme.foreground).to_jian(),
                    Point2D::new(0.0, 0.0),
                );
                cx.backend.draw_text(
                    &label,
                    Point2D::new(
                        rect.origin.x + PAD_X + if touch { 24.0 } else { 18.0 },
                        jian_widgets::centered_text_baseline_y(*rect, body_font),
                    ),
                );
            }
            FontPickerRow::Entry(i) => {
                let Some(entry) = entries.get(*i) else {
                    continue;
                };
                let is_active = is_active_font_family(active, &entry.family);
                let row_rect = Rect {
                    origin: Point2D::new(rect.origin.x + 2.0, rect.origin.y),
                    size: Point2D::new(rect.size.x - 4.0, rect.size.y),
                };
                if is_active {
                    cx.backend
                        .fill_round_rect(row_rect, 5.0, theme.row_selected_primary);
                } else if state.hover == Some(*i) || state.pressed == Some(*i) {
                    paint_button_feedback_wash(
                        cx.backend,
                        theme,
                        row_rect,
                        5.0,
                        state.hover == Some(*i),
                        state.pressed == Some(*i),
                    );
                }
                let remove = layout.rows.iter().find_map(|(row, remove)| {
                    matches!(row, FontPickerRow::RemoveEntry(index) if index == i)
                        .then_some(*remove)
                });
                let check_x = is_active.then(|| {
                    remove.map_or_else(
                        || rect.origin.x + rect.size.x - if touch { 30.0 } else { 20.0 },
                        |remove| remove.origin.x - icon_size - 8.0,
                    )
                });
                let text_x = rect.origin.x + 10.0;
                let text_right = check_x
                    .map(|x| x - 10.0)
                    .or_else(|| remove.map(|remove| remove.origin.x - 10.0))
                    .unwrap_or(rect.origin.x + rect.size.x - 10.0);
                let text_w = (text_right - text_x).max(1.0);
                let family = crate::util::ellipsize_to_width(&entry.family, text_w, |text| {
                    cx.backend
                        .measure_text_family(text, body_font, &entry.family)
                });
                // Each row renders in its own family (TS style
                // fontFamily: font.family).
                let label = TextLayout::single_run(
                    &family,
                    &entry.family,
                    body_font,
                    (if is_active {
                        theme.primary
                    } else {
                        theme.foreground
                    })
                    .to_jian(),
                    Point2D::new(0.0, 0.0),
                );
                cx.backend.save();
                cx.backend
                    .clip_rect(Rect::xywh(text_x, rect.origin.y, text_w, rect.size.y));
                cx.backend.draw_text(
                    &label,
                    Point2D::new(
                        text_x,
                        jian_widgets::centered_text_baseline_y(*rect, body_font),
                    ),
                );
                cx.backend.restore();
                if let Some(check_x) = check_x {
                    draw_icon(
                        cx.backend,
                        Icon::Check,
                        Point2D::new(check_x, rect.origin.y + (rect.size.y - icon_size) / 2.0),
                        icon_size,
                        theme.primary,
                        1.6,
                    );
                }
            }
        }
    }
    cx.backend.restore();
}

#[allow(clippy::too_many_arguments)]
pub fn paint_font_weight_picker(
    cx: &mut PaintCx<'_>,
    theme: &Theme,
    panel_rect: Rect,
    visible: VisibleSections,
    locale: op_editor_core::Locale,
    active_weight: u16,
    hover: Option<usize>,
    pressed: Option<usize>,
) {
    use crate::widgets::property_panel::{FontWeightChoice, PropertyPanelAction};
    let Some((pop, rows)) = font_weight_picker_layout(panel_rect, visible) else {
        return;
    };
    cx.backend.fill_round_rect(pop, 8.0, theme.popover);
    cx.backend.stroke_round_rect(pop, 8.0, theme.border, 1.0);
    let active = FontWeightChoice::nearest(active_weight);
    for (i, (action, row)) in rows.into_iter().enumerate() {
        let PropertyPanelAction::SetFontWeight(choice) = action else {
            continue;
        };
        let is_active = choice == active;
        if is_active {
            cx.backend
                .fill_round_rect(row, 6.0, theme.row_selected_primary);
        } else if hover == Some(i) || pressed == Some(i) {
            paint_button_feedback_wash(
                cx.backend,
                theme,
                row,
                6.0,
                hover == Some(i),
                pressed == Some(i),
            );
        }
        let row_label = format!(
            "{}  {}",
            choice.numeric_label(),
            op_i18n::translate(locale, choice.label_key())
        );
        let label = TextLayout::single_run(
            &row_label,
            "system-ui",
            12.0,
            (if is_active {
                theme.primary
            } else {
                theme.foreground
            })
            .to_jian(),
            Point2D::new(0.0, 0.0),
        );
        cx.backend.draw_text(
            &label,
            Point2D::new(row.origin.x + 10.0, row.origin.y + 19.0),
        );
        if is_active {
            draw_icon(
                cx.backend,
                Icon::Check,
                Point2D::new(row.origin.x + row.size.x - 22.0, row.origin.y + 7.0),
                14.0,
                theme.primary,
                1.6,
            );
        }
    }
}

fn font_weight_picker_layout(
    panel_rect: Rect,
    visible: VisibleSections,
) -> Option<(
    Rect,
    Vec<(crate::widgets::property_panel::PropertyPanelAction, Rect)>,
)> {
    let text_y = text_section_top(panel_rect, visible)?;
    let rows = crate::widgets::property_panel_text::font_weight_picker_action_rects(
        panel_rect.origin.x,
        text_y,
        panel_rect.size.x - PAD_X * 2.0,
        visible.touch_controls,
    );
    let first = rows.first().map(|(_, rect)| *rect)?;
    let last = rows.last().map(|(_, rect)| *rect).unwrap_or(first);
    let popup = Rect {
        origin: Point2D::new(first.origin.x, first.origin.y - 6.0),
        size: Point2D::new(
            first.size.x,
            last.origin.y + last.size.y - first.origin.y + 12.0,
        ),
    };
    Some((popup, rows))
}

pub(crate) fn font_weight_picker_rect(panel_rect: Rect, visible: VisibleSections) -> Option<Rect> {
    font_weight_picker_layout(panel_rect, visible).map(|(popup, _)| popup)
}

pub(crate) fn text_section_top(panel_rect: Rect, visible: VisibleSections) -> Option<f32> {
    if !visible.text {
        return None;
    }
    Some(sections_top_before_text(panel_rect, visible))
}

pub(crate) fn sections_top_before_text(panel_rect: Rect, visible: VisibleSections) -> f32 {
    use crate::widgets::property_panel_inputs::{INPUT_HEIGHT, SECTION_GAP, SECTION_HEADER_HEIGHT};
    let mut y = panel_rect.origin.y;
    y += crate::widgets::property_panel_inputs::TAB_HEIGHT;
    y += crate::widgets::property_panel_inputs::HEADER_HEIGHT;
    if visible.create_component {
        y += crate::widgets::property_panel_inputs::CREATE_COMPONENT_BLOCK_H;
    }
    y += SECTION_HEADER_HEIGHT;
    y += INPUT_HEIGHT + 6.0;
    y += INPUT_HEIGHT + 12.0;
    y += SECTION_GAP;
    if visible.flex_layout {
        y += crate::widgets::property_panel_flex::flex_section_height(
            visible.flex_layout_mode,
            visible.padding_edit_mode,
            visible.touch_controls,
        );
    }
    if visible.size_options {
        y += SECTION_HEADER_HEIGHT;
        y += INPUT_HEIGHT + 10.0;
        y += crate::widgets::property_panel_inputs::size_check_row_height(visible.touch_controls)
            * if visible.clip_content { 3.0 } else { 2.0 };
        y += 12.0 + SECTION_GAP;
    }
    if visible.icon {
        y += crate::widgets::property_panel_icon::icon_section_height();
    }
    y
}
