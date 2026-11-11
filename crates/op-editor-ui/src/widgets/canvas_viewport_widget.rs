//! Static composite-widget visuals for the OP **design** canvas.
//!
//! Widget nodes (switch / checkbox / slider / progress / select /
//! radio_group / text_input / text_area / number_input / tabs) load
//! onto the canvas as degraded `rect` / `text` / `frame` scene nodes
//! (`op-pen-loader`'s adapter), but carry their real props in
//! [`SceneWidget`](crate::layout_scene::SceneWidget). This module paints
//! the recognizable static visual (track + knob, box + check, chevron,
//! bar, …) on the non-interactive design surface, mirroring jian-core's
//! `render/scene.rs::emit_widget_visual` (which the preview/runtime
//! path uses to draw the live widget).
//!
//! Everything paints in **world** coordinates: the per-kind painter in
//! `canvas_viewport_paint.rs` hands us the already-zoom-scaled
//! `world_rect`, and we scale every internal metric (track height,
//! knob diameter, stroke width, font size) by `zoom` so the visual
//! tracks the node across viewport zoom.

use super::canvas_viewport_widget_helpers::{
    authored_radius_or, authored_widget_visual, draw_clipped_label, draw_label, lerp_jian_color,
    paint_chevron, range_fraction, rect_parts, ui_color,
};
pub(crate) use super::canvas_viewport_widget_helpers::{option_label, text_field_display_text};
use crate::layout_scene::{SceneNode, SceneWidget};
use crate::widgets::PaintCx;
use crate::{Point2D, Rect};
use jian_core::render::widget_style::AuthoredWidgetVisual;

/// Base horizontal text padding inside an input (doc px, pre-zoom).
pub(crate) const INPUT_PAD_X: f32 = 8.0;
/// Leading/trailing icon glyph box inside an input (doc px, pre-zoom).
pub(crate) const INPUT_ICON_BOX: f32 = 20.0;

/// Left inset for an input's text/caret (doc px, pre-zoom). Single
/// source of truth shared by the design canvas (`paint_text_field`) and
/// the preview caret (`op_host_native::preview::paint_focus_caret`), so
/// the caret always lands where the painted text starts. Mirrors jian's
/// `scene::input_left_inset`. A leading icon reserves `PAD + ICON + PAD`.
pub fn widget_text_inset_left(w: &SceneWidget) -> f32 {
    if w.leading_icon.is_some() {
        INPUT_PAD_X + INPUT_ICON_BOX + INPUT_PAD_X
    } else {
        INPUT_PAD_X
    }
}

/// Paint the static visual for a widget scene node, in world coords.
///
/// `world_rect` is the node's already-zoom-scaled screen rect; `zoom`
/// scales internal metrics. Returns `true` when the widget kind was
/// recognized + painted (so the caller skips the bare fill/stroke);
/// `false` for an unknown kind (caller falls back to the plain rect).
pub(crate) fn paint_widget_visual(
    cx: &mut PaintCx<'_>,
    node: &SceneNode,
    world_rect: Rect,
    zoom: f32,
) -> bool {
    let Some(w) = node.widget.as_ref() else {
        return false;
    };
    if world_rect.size.x <= 0.0 || world_rect.size.y <= 0.0 {
        return false;
    }
    let visual = authored_widget_visual(node);
    match w.kind.as_str() {
        "switch" => paint_switch(cx, node, w, &visual, world_rect, zoom),
        "checkbox" => paint_checkbox(cx, node, w, &visual, world_rect, zoom),
        "slider" => paint_slider(cx, node, w, &visual, world_rect, zoom),
        "progress" => paint_progress(cx, node, w, &visual, world_rect, zoom),
        "select" => paint_select(cx, node, w, &visual, world_rect, zoom),
        "radio_group" => paint_radio_group(cx, node, w, &visual, world_rect, zoom),
        "text_input" | "text_area" | "number_input" => {
            paint_text_field(cx, node, w, &visual, world_rect, zoom)
        }
        "tabs" => paint_tabs(cx, node, w, &visual, world_rect, zoom),
        _ => return false,
    }
    true
}

/// Switch: authored active / inactive track plus a contrast-derived knob.
fn paint_switch(
    cx: &mut PaintCx<'_>,
    node: &SceneNode,
    w: &SceneWidget,
    visual: &AuthoredWidgetVisual,
    r: Rect,
    zoom: f32,
) {
    let on = w.checked.unwrap_or(false);
    let p = w
        .toggle_progress
        .unwrap_or(if on { 1.0 } else { 0.0 })
        .clamp(0.0, 1.0);
    let (x, y, ww, h) = rect_parts(r);
    let track = lerp_jian_color(visual.inactive, visual.active, p);
    let foreground = lerp_jian_color(visual.inactive_foreground, visual.active_foreground, p);
    let radius = authored_radius_or(node, w, h / 2.0, zoom);
    cx.backend.fill_round_rect(r, radius, ui_color(track));
    let pad = 2.0;
    let d = (h - pad * 2.0).max(2.0);
    let off_x = x + pad;
    let on_x = x + ww - d - pad;
    let kx = off_x + (on_x - off_x) * p;
    cx.backend
        .fill_round_rect(Rect::xywh(kx, y + pad, d, d), d / 2.0, ui_color(foreground));
}

/// Checkbox: authored active fill with a contrast-derived check when on,
/// authored inactive outline when off.
fn paint_checkbox(
    cx: &mut PaintCx<'_>,
    node: &SceneNode,
    w: &SceneWidget,
    visual: &AuthoredWidgetVisual,
    r: Rect,
    zoom: f32,
) {
    let on = w.checked.unwrap_or(false);
    let (x, y, ww, h) = rect_parts(r);
    let label = w.label.as_deref().filter(|label| !label.is_empty());
    // A labelled checkbox's authored width is the whole interactive control,
    // not the box alone. Keep legacy label-less documents unchanged, while a
    // labelled control gets a square box and an in-bounds label region.
    let box_rect = if label.is_some() {
        let side = ww.min(h);
        Rect::xywh(x, y + (h - side) / 2.0, side, side)
    } else {
        r
    };
    let (box_x, box_y, box_w, box_h) = rect_parts(box_rect);
    let radius = authored_radius_or(node, w, 2.0 * zoom, zoom);
    let stroke_w = node.stroke.map(|s| s.width).unwrap_or(1.5) * zoom;
    if on {
        cx.backend
            .fill_round_rect(box_rect, radius, ui_color(visual.active));
    }
    cx.backend
        .stroke_round_rect(box_rect, radius, ui_color(visual.inactive), stroke_w);
    if on {
        // White check (✓) as a 3-point polyline, fractions matching the
        // jian-core visual: (0.24,0.52) → (0.42,0.70) → (0.76,0.30).
        let p0 = Point2D::new(box_x + box_w * 0.24, box_y + box_h * 0.52);
        let p1 = Point2D::new(box_x + box_w * 0.42, box_y + box_h * 0.70);
        let p2 = Point2D::new(box_x + box_w * 0.76, box_y + box_h * 0.30);
        let cw = (2.0 * zoom).max(1.0);
        let check = ui_color(visual.active_foreground);
        cx.backend.stroke_line(p0, p1, check, cw);
        cx.backend.stroke_line(p1, p2, check, cw);
    }
    if let Some(label) = label {
        let fs = 14.0 * zoom;
        let label_x = box_x + box_w + 8.0 * zoom;
        draw_clipped_label(
            cx,
            label,
            ui_color(visual.label_foreground),
            Rect::xywh(label_x, y, (x + ww - label_x).max(0.0), h),
            fs,
        );
    }
}

/// Slider: authored inactive track + active filled portion (value within
/// min..max) + a contrast-derived knob.
fn paint_slider(
    cx: &mut PaintCx<'_>,
    node: &SceneNode,
    w: &SceneWidget,
    visual: &AuthoredWidgetVisual,
    r: Rect,
    zoom: f32,
) {
    let (x, y, ww, h) = rect_parts(r);
    let frac = range_fraction(w.value_num, w.min.unwrap_or(0.0), w.max.unwrap_or(100.0));
    let track_h = 4.0 * zoom;
    let track_radius = authored_radius_or(node, w, track_h / 2.0, zoom).min(track_h / 2.0);
    let cy = y + h / 2.0;
    cx.backend.fill_round_rect(
        Rect::xywh(x, cy - track_h / 2.0, ww, track_h),
        track_radius,
        ui_color(visual.inactive),
    );
    if frac > 0.0 {
        cx.backend.fill_round_rect(
            Rect::xywh(x, cy - track_h / 2.0, ww * frac, track_h),
            track_radius,
            ui_color(visual.active),
        );
    }
    let d = h.clamp(10.0 * zoom, 16.0 * zoom);
    let kx = (x + ww * frac - d / 2.0).clamp(x, x + ww - d);
    let knob = Rect::xywh(kx, cy - d / 2.0, d, d);
    let knob_color = if frac > 0.0 {
        visual.active_foreground
    } else {
        visual.inactive_foreground
    };
    cx.backend
        .fill_round_rect(knob, d / 2.0, ui_color(knob_color));
    let knob_stroke_width = node.stroke.map(|stroke| stroke.width).unwrap_or(1.0) * zoom;
    if knob_stroke_width > 0.0 {
        cx.backend
            .stroke_round_rect(knob, d / 2.0, ui_color(visual.inactive), knob_stroke_width);
    }
}

/// Progress: authored inactive track + active filled portion (value / max).
fn paint_progress(
    cx: &mut PaintCx<'_>,
    node: &SceneNode,
    w: &SceneWidget,
    visual: &AuthoredWidgetVisual,
    r: Rect,
    zoom: f32,
) {
    let (x, y, ww, h) = rect_parts(r);
    let max = w.max.unwrap_or(100.0);
    let frac = if max > 0.0 {
        (w.value_num.unwrap_or(0.0) / max).clamp(0.0, 1.0)
    } else {
        0.0
    };
    let radius = authored_radius_or(node, w, h / 2.0, zoom);
    cx.backend
        .fill_round_rect(r, radius, ui_color(visual.inactive));
    let (segment_x, segment_width) = if w.indeterminate {
        (x + ww * 0.325, ww * 0.35)
    } else {
        (x, ww * frac)
    };
    if segment_width > 0.0 {
        cx.backend.fill_round_rect(
            Rect::xywh(segment_x, y, segment_width, h),
            radius,
            ui_color(visual.active),
        );
    }
}

/// Select: outlined box + current value / placeholder text + a down
/// chevron on the trailing edge.
fn paint_select(
    cx: &mut PaintCx<'_>,
    node: &SceneNode,
    w: &SceneWidget,
    visual: &AuthoredWidgetVisual,
    r: Rect,
    zoom: f32,
) {
    let (x, y, ww, h) = rect_parts(r);
    let radius = authored_radius_or(node, w, 6.0 * zoom, zoom);
    if let Some(fill) = visual.surface {
        cx.backend.fill_round_rect(r, radius, ui_color(fill));
    }
    if let (Some(border), Some(stroke)) = (visual.border, node.stroke) {
        if stroke.width > 0.0 {
            cx.backend
                .stroke_round_rect(r, radius, ui_color(border), stroke.width * zoom);
        }
    }

    // Current selection (by value) wins; else the placeholder, muted.
    let selected = w
        .value_str
        .as_deref()
        .and_then(|v| option_label(w, v))
        .filter(|s| !s.is_empty());
    let label = match selected {
        Some(text) => Some((text, visual.foreground)),
        None => w
            .placeholder
            .as_deref()
            .filter(|s| !s.is_empty())
            .map(|text| (text, visual.muted_foreground)),
    };
    let chevron_left = x + ww - 22.0 * zoom;
    if let Some((text, color)) = label {
        let label_x = x + 12.0 * zoom;
        draw_clipped_label(
            cx,
            text,
            ui_color(color),
            Rect::xywh(
                label_x,
                y,
                (chevron_left - 8.0 * zoom - label_x).max(0.0),
                h,
            ),
            14.0 * zoom,
        );
    }
    paint_chevron(
        cx,
        chevron_left,
        y + h / 2.0,
        ui_color(visual.muted_foreground),
        zoom,
    );
}

/// Radio group: per option an authored active circle with a contrast-derived
/// inner dot when selected, authored inactive outline when not.
fn paint_radio_group(
    cx: &mut PaintCx<'_>,
    node: &SceneNode,
    w: &SceneWidget,
    visual: &AuthoredWidgetVisual,
    r: Rect,
    zoom: f32,
) {
    if w.options.is_empty() {
        return;
    }
    let (x, y, ww, h) = rect_parts(r);
    let selected = w.value_str.as_deref();
    let n = w.options.len().max(1);
    let row_h = (h / n as f32).clamp(0.0, 28.0 * zoom);
    let d = 14.0 * zoom;
    let fs = 14.0 * zoom;
    let stroke_width = node.stroke.map(|stroke| stroke.width).unwrap_or(1.5) * zoom;
    for (i, opt) in w.options.iter().enumerate() {
        let on = selected == Some(opt.value.as_str());
        let ry = y + i as f32 * row_h + (row_h - d) / 2.0;
        let circle = Rect::xywh(x + 2.0 * zoom, ry, d, d);
        if on {
            cx.backend
                .fill_round_rect(circle, d / 2.0, ui_color(visual.active));
        }
        cx.backend
            .stroke_round_rect(circle, d / 2.0, ui_color(visual.inactive), stroke_width);
        if on {
            let inner = d * 0.4;
            cx.backend.fill_round_rect(
                Rect::xywh(
                    x + 2.0 * zoom + (d - inner) / 2.0,
                    ry + (d - inner) / 2.0,
                    inner,
                    inner,
                ),
                inner / 2.0,
                ui_color(visual.active_foreground),
            );
        }
        let label = if opt.label.is_empty() {
            opt.value.as_str()
        } else {
            opt.label.as_str()
        };
        let lx = x + 2.0 * zoom + d + 8.0 * zoom;
        let _ = ww;
        draw_label(
            cx,
            label,
            ui_color(visual.label_foreground),
            lx,
            ry + (d - fs) / 2.0,
            fs,
        );
    }
}

/// Text input / textarea / number input: authored box + contrast-derived value
/// text or, when empty, the shared muted foreground.
fn paint_text_field(
    cx: &mut PaintCx<'_>,
    node: &SceneNode,
    w: &SceneWidget,
    visual: &AuthoredWidgetVisual,
    r: Rect,
    zoom: f32,
) {
    let (x, y, ww, h) = rect_parts(r);
    // Respect the authored box style. Explicit square `cornerRadius: 0` stays
    // square, while older documents that omitted the field retain the 6px
    // intrinsic input radius. No fill means no box; no stroke means no border.
    let radius = authored_radius_or(node, w, 6.0 * zoom, zoom);
    if let Some(fill) = visual.surface {
        cx.backend.fill_round_rect(r, radius, ui_color(fill));
    }
    if let (Some(border), Some(stroke)) = (visual.border, node.stroke) {
        if stroke.width > 0.0 {
            cx.backend
                .stroke_round_rect(r, radius, ui_color(border), stroke.width * zoom);
        }
    }

    // Leading / trailing lucide glyphs at the content edges, vertically
    // centred. The text inset (`widget_text_inset_left`) reserves room
    // for the leading icon so the value/placeholder never overlaps it.
    let icon = INPUT_ICON_BOX * zoom;
    let iy = y + (h - icon) / 2.0;
    if let Some(name) = w.leading_icon.as_deref() {
        crate::widgets::icons::paint_icon_font_node(
            cx.backend,
            "",
            name,
            Rect::xywh(x + INPUT_PAD_X * zoom, iy, icon, icon),
            Some(ui_color(visual.muted_foreground)),
        );
    }
    if let Some(name) = w.trailing_icon.as_deref() {
        crate::widgets::icons::paint_icon_font_node(
            cx.backend,
            "",
            name,
            Rect::xywh(
                x + ww - (INPUT_PAD_X + INPUT_ICON_BOX) * zoom,
                iy,
                icon,
                icon,
            ),
            Some(ui_color(visual.muted_foreground)),
        );
    }

    if let Some((text, is_placeholder)) = text_field_display_text(w) {
        let color = ui_color(if is_placeholder {
            visual.muted_foreground
        } else {
            visual.foreground
        });
        let fs = 14.0 * zoom;
        // text_area top-aligns; single-line inputs vertically centre.
        let ty = if w.kind == "text_area" {
            y + 8.0 * zoom
        } else {
            y + (h - fs) / 2.0
        };
        draw_label(
            cx,
            text.as_ref(),
            color,
            x + widget_text_inset_left(w) * zoom,
            ty,
            fs,
        );
    }
}

/// Tabs: the same authored segmented control used by Jian preview/runtime.
/// The panel area (children) is painted by the caller's normal child
/// recursion; we only add the bar.
fn paint_tabs(
    cx: &mut PaintCx<'_>,
    node: &SceneNode,
    w: &SceneWidget,
    visual: &AuthoredWidgetVisual,
    r: Rect,
    zoom: f32,
) {
    let (x, y, ww, h) = rect_parts(r);
    if w.options.is_empty() {
        return;
    }
    let bar_h = h.min(32.0 * zoom);
    let bar = Rect::xywh(x, y, ww, bar_h);
    let bar_radius = authored_radius_or(node, w, 6.0 * zoom, zoom);
    cx.backend
        .fill_round_rect(bar, bar_radius, ui_color(visual.inactive));
    // `width > 0.0` gate, same as select / text_field: Skia reads a 0-width
    // stroke as a hairline, not as a no-op, so an authored `thickness: 0`
    // would still outline the bar.
    if let Some(stroke) = node.stroke.filter(|stroke| stroke.width > 0.0) {
        cx.backend.stroke_round_rect(
            bar,
            bar_radius,
            ui_color(visual.border.unwrap_or(visual.inactive)),
            stroke.width * zoom,
        );
    }
    let active = super::canvas_viewport_paint::tabs_active_index(w);
    let n = w.options.len().max(1);
    let tab_w = ww / n as f32;
    let inset = (2.0 * zoom).min(bar_h / 4.0);
    let active_h = (bar_h - inset * 2.0).max(0.0);
    let active_w = (tab_w - inset * 2.0).max(0.0);
    if active_w > 0.0 && active_h > 0.0 {
        cx.backend.fill_round_rect(
            Rect::xywh(
                x + active as f32 * tab_w + inset,
                y + inset,
                active_w,
                active_h,
            ),
            active_h.min(active_w) / 2.0,
            ui_color(visual.active),
        );
    }
    let fs = 14.0 * zoom;
    for (i, opt) in w.options.iter().enumerate() {
        let tx = x + i as f32 * tab_w;
        let on = i == active;
        let label = if opt.label.is_empty() {
            opt.value.as_str()
        } else {
            opt.label.as_str()
        };
        let color = if on {
            ui_color(visual.active_foreground)
        } else {
            ui_color(visual.muted_label_foreground)
        };
        let label_w = cx.backend.measure_text_weighted(label, fs, 400);
        draw_label(
            cx,
            label,
            color,
            tx + (tab_w - label_w).max(0.0) / 2.0,
            y + (bar_h - fs) / 2.0,
            fs,
        );
    }
}

#[cfg(test)]
#[path = "canvas_viewport_widget_tests.rs"]
mod tests;
