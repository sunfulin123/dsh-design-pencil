//! Geometry, color, and text helpers for [`super::canvas_viewport_widget`].

use crate::layout_scene::{SceneNode, SceneWidget};
use crate::widgets::PaintCx;
use crate::{Color, Point2D, Rect, TextLayout};
use jian_core::render::widget_style::{
    resolve_authored_widget_visual, with_visual_opacity, AuthoredWidgetVisual,
};
use std::borrow::Cow;

pub(super) fn authored_widget_visual(node: &SceneNode) -> AuthoredWidgetVisual {
    let mut visual = resolve_authored_widget_visual(
        node.fill.map(Color::to_jian),
        node.stroke.map(|stroke| stroke.color.to_jian()),
    );
    // Scene fill/stroke alpha already contains direct-paint node opacity. Only
    // contrast-derived internal colours need it folded in here; applying it to
    // `active`/`inactive`/`surface`/`border` again would square translucency.
    if node.fill.is_none() {
        visual.active = with_visual_opacity(visual.active, node.opacity);
        if node.stroke.is_none() {
            visual.inactive = with_visual_opacity(visual.inactive, node.opacity);
        }
    }
    visual.active_foreground = with_visual_opacity(visual.active_foreground, node.opacity);
    visual.inactive_foreground = with_visual_opacity(visual.inactive_foreground, node.opacity);
    visual.foreground = with_visual_opacity(visual.foreground, node.opacity);
    visual.muted_foreground = with_visual_opacity(visual.muted_foreground, node.opacity);
    visual.label_foreground = with_visual_opacity(visual.label_foreground, node.opacity);
    visual.muted_label_foreground =
        with_visual_opacity(visual.muted_label_foreground, node.opacity);
    visual
}

pub(super) fn ui_color(color: jian_core::scene::Color) -> Color {
    Color::rgba_u8(
        color.r(),
        color.g(),
        color.b(),
        f32::from(color.a()) / 255.0,
    )
}

fn lerp_u8(from: u8, to: u8, t: f32) -> u8 {
    (f32::from(from) + (f32::from(to) - f32::from(from)) * t)
        .round()
        .clamp(0.0, 255.0) as u8
}

pub(super) fn lerp_jian_color(
    from: jian_core::scene::Color,
    to: jian_core::scene::Color,
    t: f32,
) -> jian_core::scene::Color {
    let t = t.clamp(0.0, 1.0);
    jian_core::scene::Color::rgba(
        lerp_u8(from.r(), to.r(), t),
        lerp_u8(from.g(), to.g(), t),
        lerp_u8(from.b(), to.b(), t),
        lerp_u8(from.a(), to.a(), t),
    )
}

/// Draw a down chevron (`v`) centred at `(cx_px, cy_px)` on the leading
/// point — a 3-point polyline matching the jian-core select chevron.
pub(super) fn paint_chevron(cx: &mut PaintCx<'_>, cx_px: f32, cy_px: f32, color: Color, zoom: f32) {
    let cw = 9.0 * zoom;
    let p0 = Point2D::new(cx_px, cy_px - cw * 0.22);
    let p1 = Point2D::new(cx_px + cw / 2.0, cy_px + cw * 0.33);
    let p2 = Point2D::new(cx_px + cw, cy_px - cw * 0.22);
    let width = 1.5 * zoom;
    cx.backend.stroke_line(p0, p1, color, width);
    cx.backend.stroke_line(p1, p2, color, width);
}

/// Draw a single-run, left-aligned label at `(x, top_y)` in world coords.
pub(super) fn draw_label(
    cx: &mut PaintCx<'_>,
    text: &str,
    color: Color,
    x: f32,
    top_y: f32,
    font_size: f32,
) {
    let layout = TextLayout::single_run(text, "", font_size, color.to_jian(), Point2D::ZERO);
    cx.backend
        .draw_text(&layout, Point2D::new(x, top_y + font_size * 0.8));
}

pub(super) fn draw_clipped_label(
    cx: &mut PaintCx<'_>,
    text: &str,
    color: Color,
    bounds: Rect,
    fs: f32,
) {
    if bounds.size.x > 0.0 {
        cx.backend.save();
        cx.backend.clip_rect(bounds);
        draw_label(
            cx,
            text,
            color,
            bounds.origin.x,
            bounds.origin.y + (bounds.size.y - fs) / 2.0,
            fs,
        );
        cx.backend.restore();
    }
}

pub(super) fn rect_parts(r: Rect) -> (f32, f32, f32, f32) {
    (r.origin.x, r.origin.y, r.size.x, r.size.y)
}

pub(super) fn authored_radius_or(
    node: &SceneNode,
    widget: &SceneWidget,
    fallback_world: f32,
    zoom: f32,
) -> f32 {
    if widget.corner_radius_authored {
        node.corner_radius.max(0.0) * zoom
    } else {
        fallback_world
    }
}

pub(super) fn range_fraction(value: Option<f32>, min: f32, max: f32) -> f32 {
    let v = value.unwrap_or(min);
    if max > min {
        ((v - min) / (max - min)).clamp(0.0, 1.0)
    } else {
        0.0
    }
}

pub(crate) fn option_label<'a>(w: &'a SceneWidget, value: &str) -> Option<&'a str> {
    w.options.iter().find(|o| o.value == value).map(|o| {
        if o.label.is_empty() {
            o.value.as_str()
        } else {
            o.label.as_str()
        }
    })
}

pub(crate) fn text_field_display_text(w: &SceneWidget) -> Option<(Cow<'_, str>, bool)> {
    let value = match w.value_str.as_deref() {
        Some(text) => (!text.is_empty()).then_some(Cow::Borrowed(text)),
        None if w.kind == "number_input" => w
            .value_num
            .map(format_number)
            .filter(|text| !text.is_empty())
            .map(Cow::Owned),
        None => None,
    };
    match value {
        Some(text) => Some((text, false)),
        None => w
            .placeholder
            .as_deref()
            .filter(|text| !text.is_empty())
            .map(|text| (Cow::Borrowed(text), true)),
    }
}

fn format_number(v: f32) -> String {
    if v.fract().abs() < f32::EPSILON {
        format!("{}", v as i64)
    } else {
        format!("{v}")
    }
}
