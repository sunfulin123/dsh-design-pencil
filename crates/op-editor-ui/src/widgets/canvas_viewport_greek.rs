//! Text greeking: when text renders only a couple of device pixels tall,
//! shaping and drawing every glyph costs far more than it shows. Such text
//! is painted as faint bars, one per line, like other design tools do when
//! zoomed out.

use crate::layout_scene::SceneNode;
use crate::{Color, Rect};

/// Glyph height (device pixels) below which text is greeked.
const GREEK_BELOW_DEVICE_PX: f32 = 3.0;
const LINE_HEIGHT_FACTOR: f32 = 1.2;
const MAX_BARS: usize = 64;

pub(crate) fn should_greek(font_size: f32, zoom: f32, dpi_scale: f32) -> bool {
    font_size > 0.0 && font_size * zoom * dpi_scale < GREEK_BELOW_DEVICE_PX
}

/// One bar per text line inside `world_rect`, each about half a line tall.
pub(crate) fn greek_bars(world_rect: Rect, font_px: f32) -> Vec<Rect> {
    let line = (font_px * LINE_HEIGHT_FACTOR).max(0.5);
    let height = world_rect.size.y.abs();
    let width = world_rect.size.x.abs();
    if width <= 0.0 || height <= 0.0 {
        return Vec::new();
    }
    let lines = ((height / line).floor() as usize).clamp(1, MAX_BARS);
    let bar = (line * 0.5).min(height);
    (0..lines)
        .map(|index| {
            Rect::xywh(
                world_rect.origin.x,
                world_rect.origin.y + index as f32 * line + (line - bar) / 2.0,
                width,
                bar,
            )
        })
        .collect()
}

pub(crate) fn paint_greeked_text(
    cx: &mut super::PaintCx<'_>,
    node: &SceneNode,
    world_rect: Rect,
    zoom: f32,
) {
    let ink = node
        .text_runs
        .first()
        .and_then(|run| run.fill)
        .or(node.fill)
        .unwrap_or(Color {
            r: 0.08,
            g: 0.08,
            b: 0.08,
            a: 1.0,
        });
    let bar = Color {
        a: ink.a * 0.35,
        ..ink
    };
    for rect in greek_bars(world_rect, node.font_size * zoom) {
        cx.backend.fill_rect(rect, bar);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn only_tiny_text_is_greeked() {
        assert!(
            should_greek(12.0, 0.1, 2.0),
            "12px at 10% on a 2x display is 2.4 device px"
        );
        assert!(!should_greek(12.0, 0.25, 2.0));
        assert!(!should_greek(12.0, 1.0, 1.0));
        assert!(!should_greek(0.0, 0.1, 1.0));
    }

    #[test]
    fn bars_follow_lines_and_stay_inside_the_box() {
        let rect = Rect::xywh(10.0, 20.0, 50.0, 6.0);
        let bars = greek_bars(rect, 1.25);
        assert_eq!(bars.len(), 4);
        for bar in &bars {
            assert!(bar.origin.y >= 20.0 && bar.origin.y + bar.size.y <= 26.0 + 1e-4);
            assert_eq!(bar.size.x, 50.0);
        }
        assert_eq!(greek_bars(Rect::xywh(0.0, 0.0, 10.0, 0.4), 2.0).len(), 1);
        assert!(greek_bars(Rect::xywh(0.0, 0.0, 0.0, 10.0), 2.0).is_empty());
    }
}
