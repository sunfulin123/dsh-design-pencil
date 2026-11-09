//! Native form controls drawn as editable layers.
//!
//! The DOM snapshot only sees a control's box; its track, thumb, check and
//! chevron are painted by the browser's theme engine. The capture attaches a
//! `control` record (type, value range, checked, accent colour, appearance)
//! and this module rebuilds those parts with Chromium's default light-theme
//! metrics, so a slider imports as a track + fill + thumb a designer can edit
//! instead of a box holding its value as text.

use jian_ops_schema::node::base::PenNodeBase;
use jian_ops_schema::node::container::{ContainerProps, CornerRadius, LayoutMode};
use jian_ops_schema::node::path::PathNode;
use jian_ops_schema::node::{FrameNode, PenNode};
use jian_ops_schema::sizing::SizingBehavior;
use jian_ops_schema::style::{PenStroke, StrokeAlign, StrokeCap, StrokeJoin, StrokeThickness};
use serde_json::{Map, Value};

use super::{solid_fill, Rect, SnapshotCtx};
use crate::color::parse_css_color;

const DEFAULT_ACCENT: &str = "#0075ff";
const TRACK_FILL: &str = "#efefef";
const TRACK_BORDER: &str = "#b2b2b2";
const CONTROL_BORDER: &str = "#767676";
const TRACK_HEIGHT: f64 = 8.0;
const THUMB_SIZE: f64 = 16.0;
/// Chromium's checkbox / radio box edge; glyph geometry scales from it.
const TOGGLE_EDGE: f64 = 13.0;

struct Control<'a> {
    kind: &'a str,
    accent: String,
    color: String,
    value: Option<f64>,
    min: f64,
    max: f64,
    checked: bool,
}

impl<'a> Control<'a> {
    fn read(record: &'a Map<String, Value>) -> Option<Self> {
        let kind = record.get("type")?.as_str()?;
        let appearance = record
            .get("appearance")
            .and_then(Value::as_str)
            .unwrap_or("auto");
        let native = match kind {
            "range" => matches!(appearance, "auto" | "slider-horizontal"),
            "checkbox" | "radio" | "progress" => appearance == "auto" || appearance == kind,
            "select" => matches!(appearance, "auto" | "menulist" | "menulist-button"),
            _ => false,
        };
        if !native {
            return None;
        }
        let disabled = record.get("disabled").and_then(Value::as_bool) == Some(true);
        let accent = record
            .get("accentColor")
            .and_then(Value::as_str)
            .filter(|value| *value != "auto")
            .and_then(parse_css_color)
            .unwrap_or_else(|| DEFAULT_ACCENT.into());
        let number = |key: &str| record.get(key).and_then(Value::as_f64);
        Some(Self {
            kind,
            accent: if disabled { "#a8a8a8".into() } else { accent },
            color: record
                .get("color")
                .and_then(Value::as_str)
                .and_then(parse_css_color)
                .unwrap_or_else(|| "#000000".into()),
            value: number("value"),
            min: number("min").unwrap_or(0.0),
            max: number("max").unwrap_or(100.0),
            checked: record.get("checked").and_then(Value::as_bool) == Some(true),
        })
    }

    fn fraction(&self) -> f64 {
        let span = self.max - self.min;
        match self.value {
            Some(value) if span > 0.0 && value.is_finite() => {
                ((value - self.min) / span).clamp(0.0, 1.0)
            }
            _ => 0.0,
        }
    }
}

/// Chromium borders a filled track halfway between the accent and the
/// neutral control border.
fn filled_border(accent: &str) -> String {
    let channel =
        |hex: &str, index: usize| u8::from_str_radix(&hex[1 + index * 2..3 + index * 2], 16).ok();
    let mixed: Option<Vec<u8>> = (0..3)
        .map(|index| Some(((channel(accent, index)? as u16 + 0x76) / 2) as u8))
        .collect();
    match mixed {
        Some(rgb) if accent.len() >= 7 => format!("#{:02x}{:02x}{:02x}", rgb[0], rgb[1], rgb[2]),
        _ => CONTROL_BORDER.into(),
    }
}

fn stroke(color: &str, width: f64, align: StrokeAlign) -> PenStroke {
    PenStroke {
        thickness: StrokeThickness::Uniform(width as f32),
        align: Some(align),
        join: Some(StrokeJoin::Round),
        cap: Some(StrokeCap::Round),
        dash_pattern: None,
        dash_offset: None,
        fill: Some(vec![solid_fill(color.into())]),
    }
}

struct Layers<'c, 'o> {
    ctx: &'c mut SnapshotCtx<'o>,
    origin: Rect,
    nodes: Vec<PenNode>,
}

impl Layers<'_, '_> {
    fn base(&mut self, name: &str, x: f64, y: f64, w: f64, h: f64) -> Option<(PenNodeBase, Rect)> {
        let id = self.ctx.allocate_id()?;
        let rect = Rect {
            x: self.origin.x + x,
            y: self.origin.y + y,
            w: w.max(0.0),
            h: h.max(0.0),
        };
        Some((
            self.ctx
                .base(id, Some(name.into()), rect, Some(self.origin)),
            rect,
        ))
    }

    /// Push a filled box; layers are pushed front to back.
    fn shape(
        &mut self,
        name: &str,
        (x, y, w, h): (f64, f64, f64, f64),
        radius: f64,
        fill: &str,
        border: Option<&str>,
    ) {
        let Some((base, rect)) = self.base(name, x, y, w, h) else {
            return;
        };
        let container = ContainerProps {
            width: Some(SizingBehavior::Number(rect.w)),
            height: Some(SizingBehavior::Number(rect.h)),
            layout: Some(LayoutMode::None),
            corner_radius: (radius > 0.0).then_some(CornerRadius::Uniform(radius)),
            fill: Some(vec![solid_fill(fill.into())]),
            stroke: border.map(|color| stroke(color, 1.0, StrokeAlign::Inside)),
            ..ContainerProps::default()
        };
        self.nodes.push(PenNode::Frame(FrameNode {
            base,
            container,
            breakpoint: None,
            children: Some(Vec::new()),
            image_search_query: None,
            reusable: None,
            slot: None,
            state: None,
            bindings: None,
            events: None,
            lifecycle: None,
            semantics: None,
            gestures: None,
            route: None,
            screen: None,
        }));
    }

    /// Push an open stroked polyline whose path data spans its own box.
    fn glyph(
        &mut self,
        name: &str,
        (x, y, w, h): (f64, f64, f64, f64),
        data: String,
        color: &str,
        width: f64,
    ) {
        let Some((base, rect)) = self.base(name, x, y, w, h) else {
            return;
        };
        self.nodes.push(PenNode::Path(PathNode {
            base,
            icon_id: None,
            d: Some(data),
            anchors: None,
            closed: Some(false),
            fill_rule: None,
            mask: None,
            width: Some(SizingBehavior::Number(rect.w)),
            height: Some(SizingBehavior::Number(rect.h)),
            limits: Default::default(),
            fill: None,
            stroke: Some(stroke(color, width, StrokeAlign::Center)),
            effects: None,
            state: None,
            bindings: None,
            events: None,
            lifecycle: None,
            semantics: None,
            gestures: None,
            route: None,
        }));
    }
}

fn track(layers: &mut Layers, control: &Control, w: f64, h: f64, filled: f64, thumb: bool) {
    let track_h = TRACK_HEIGHT.min(h);
    let top = (h - track_h) / 2.0;
    if thumb {
        let size = THUMB_SIZE.min(h).min(w);
        let center = size / 2.0 + (w - size) * control.fraction();
        layers.shape(
            "Thumb",
            (center - size / 2.0, (h - size) / 2.0, size, size),
            size / 2.0,
            &control.accent,
            None,
        );
    }
    if filled > 0.0 {
        let border = filled_border(&control.accent);
        layers.shape(
            "Fill",
            (0.0, top, filled.min(w), track_h),
            track_h / 2.0,
            &control.accent,
            Some(&border),
        );
    }
    layers.shape(
        "Track",
        (0.0, top, w, track_h),
        track_h / 2.0,
        TRACK_FILL,
        Some(TRACK_BORDER),
    );
}

fn toggle(layers: &mut Layers, control: &Control, w: f64, h: f64) {
    let edge = w.min(h);
    let scale = edge / TOGGLE_EDGE;
    let (x, y) = ((w - edge) / 2.0, (h - edge) / 2.0);
    if control.kind == "radio" {
        if control.checked {
            let dot = 7.5 * scale;
            layers.shape(
                "Dot",
                (x + (edge - dot) / 2.0, y + (edge - dot) / 2.0, dot, dot),
                dot / 2.0,
                &control.accent,
                None,
            );
        }
        let ring = if control.checked {
            control.accent.as_str()
        } else {
            CONTROL_BORDER
        };
        layers.shape(
            "Radio",
            (x, y, edge, edge),
            edge / 2.0,
            "#ffffff",
            Some(ring),
        );
    } else if control.checked {
        let data = format!(
            "M0 {:.3} L{:.3} {:.3} L{:.3} 0",
            2.0 * scale,
            2.5 * scale,
            4.5 * scale,
            7.0 * scale
        );
        layers.glyph(
            "Check",
            (x + 3.0 * scale, y + 4.5 * scale, 7.0 * scale, 4.5 * scale),
            data,
            "#ffffff",
            1.75 * scale,
        );
        layers.shape(
            "Checkbox",
            (x, y, edge, edge),
            2.0 * scale,
            &control.accent,
            None,
        );
    } else {
        layers.shape(
            "Checkbox",
            (x, y, edge, edge),
            2.0 * scale,
            "#ffffff",
            Some(CONTROL_BORDER),
        );
    }
}

/// Rebuild a captured native control's parts in place of its snapshot
/// children. Returns the element's children unchanged for everything else.
pub(super) fn apply(
    ctx: &mut SnapshotCtx,
    object: &Map<String, Value>,
    rect: Rect,
    container: &mut ContainerProps,
    children: Vec<PenNode>,
) -> Vec<PenNode> {
    let Some(control) = object
        .get("control")
        .and_then(Value::as_object)
        .and_then(Control::read)
    else {
        return children;
    };
    let mut layers = Layers {
        ctx,
        origin: rect,
        nodes: Vec::new(),
    };
    let (w, h) = (rect.w, rect.h);
    match control.kind {
        "select" => {
            let (glyph_w, glyph_h) = (7.0, 4.0);
            let data = format!(
                "M0 0 L{:.3} {:.3} L{:.3} 0",
                glyph_w / 2.0,
                glyph_h,
                glyph_w
            );
            layers.glyph(
                "Chevron",
                (w - 5.0 - glyph_w, (h - glyph_h) / 2.0, glyph_w, glyph_h),
                data,
                &control.color,
                1.5,
            );
            let mut nodes = layers.nodes;
            nodes.extend(children);
            return nodes;
        }
        "range" => {
            let size = THUMB_SIZE.min(h).min(w);
            track(
                &mut layers,
                &control,
                w,
                h,
                size / 2.0 + (w - size) * control.fraction(),
                true,
            );
        }
        "progress" => {
            let filled = if control.value.is_some() {
                w * control.fraction()
            } else {
                0.0
            };
            track(&mut layers, &control, w, h, filled, false);
        }
        _ => toggle(&mut layers, &control, w, h),
    }
    container.layout = Some(LayoutMode::None);
    container.padding = None;
    container.gap = None;
    container.justify_content = None;
    container.align_items = None;
    layers.nodes
}

#[cfg(test)]
#[path = "snapshot_controls_tests.rs"]
mod tests;
