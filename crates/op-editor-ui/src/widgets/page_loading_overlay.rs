//! Canvas loading cover shown while a heavy page is being prepared.
//!
//! Switching to a page with many layers (component instances expand into
//! large subtrees) blocks for the layout rebuild. The host paints this cover
//! over the canvas for one frame first, so the switch reads as "loading"
//! instead of a frozen editor showing the previous page.

use crate::theme::Theme;
use crate::widgets::text_metrics;
use crate::widgets::PaintCx;
use crate::{Point2D, Rect, TextLayout};
use jian_ops_schema::node::PenNode;
use op_editor_core::editor_ui_state::Locale;
use op_editor_core::pen_node_ext::PenNodeExt;

/// Estimated layers that make a page switch noticeably slow.
const HEAVY_PAGE_LAYERS: usize = 2_000;
/// A component instance expands into its component's subtree; this is a
/// conservative stand-in for that subtree's size.
const LAYERS_PER_INSTANCE: usize = 40;

/// Whether preparing `roots` is slow enough to warrant the loading cover.
/// Stops counting as soon as the threshold is reached.
pub fn page_load_is_heavy(roots: &[PenNode]) -> bool {
    fn count(nodes: &[PenNode], total: &mut usize) -> bool {
        for node in nodes {
            *total += if matches!(node, PenNode::Ref(_)) {
                LAYERS_PER_INSTANCE
            } else {
                1
            };
            if *total >= HEAVY_PAGE_LAYERS {
                return true;
            }
            if let Some(children) = node.children() {
                if count(children, total) {
                    return true;
                }
            }
        }
        false
    }
    count(roots, &mut 0)
}

pub struct PageLoadingOverlay {
    pub theme: Theme,
    pub locale: Locale,
}

impl PageLoadingOverlay {
    pub fn label(&self) -> &'static str {
        op_i18n::translate(self.locale, "canvas.pageLoading")
    }

    /// Cover `canvas` with the canvas surface and a centred status pill.
    pub fn paint(&self, cx: &mut PaintCx<'_>, canvas: Rect, now_ms: u64) {
        cx.backend.fill_rect(canvas, self.theme.canvas_surface);
        let label = self.label();
        let font_size = 13.0;
        let text_w = text_metrics::measure_chrome(cx.backend, label, font_size);
        let dot_r = 3.0;
        let dots_w = 3.0 * dot_r * 2.0 + 2.0 * 6.0;
        let pill_w = 20.0 + dots_w + 10.0 + text_w + 20.0;
        let pill_h = 40.0;
        let pill = Rect {
            origin: Point2D::new(
                canvas.origin.x + (canvas.size.x - pill_w) / 2.0,
                canvas.origin.y + (canvas.size.y - pill_h) / 2.0,
            ),
            size: Point2D::new(pill_w, pill_h),
        };
        cx.backend
            .fill_round_rect(pill, pill_h / 2.0, self.theme.card);
        cx.backend
            .stroke_round_rect(pill, pill_h / 2.0, self.theme.border, 1.0);
        let active = ((now_ms / 250) % 3) as usize;
        let dots_y = pill.origin.y + pill_h / 2.0 - dot_r;
        for i in 0..3 {
            let x = pill.origin.x + 20.0 + i as f32 * (dot_r * 2.0 + 6.0);
            let color = if i == active {
                self.theme.primary
            } else {
                self.theme.muted_foreground
            };
            cx.backend.fill_oval(
                Rect {
                    origin: Point2D::new(x, dots_y),
                    size: Point2D::new(dot_r * 2.0, dot_r * 2.0),
                },
                color,
            );
        }
        let layout = TextLayout::single_run(
            label,
            "system-ui",
            font_size,
            self.theme.foreground.to_jian(),
            Point2D::new(0.0, 0.0),
        );
        let text_x = pill.origin.x + 20.0 + dots_w + 10.0;
        let baseline = jian_widgets::centered_text_baseline_y(pill, font_size);
        cx.backend
            .draw_text(&layout, Point2D::new(text_x, baseline));
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn page(json: serde_json::Value) -> Vec<PenNode> {
        serde_json::from_value(json).expect("nodes")
    }

    #[test]
    fn small_pages_switch_without_a_cover() {
        let nodes = page(serde_json::json!([
            {"type": "frame", "id": "a", "children": [{"type": "text", "id": "t", "content": "Hi"}]},
            {"type": "ref", "id": "r", "ref": "c"}
        ]));
        assert!(!page_load_is_heavy(&nodes));
    }

    #[test]
    fn pages_with_many_layers_or_instances_get_the_cover() {
        let frames: Vec<serde_json::Value> = (0..HEAVY_PAGE_LAYERS)
            .map(|i| serde_json::json!({"type": "frame", "id": format!("f{i}")}))
            .collect();
        assert!(page_load_is_heavy(&page(serde_json::Value::Array(frames))));
        let instances: Vec<serde_json::Value> = (0..HEAVY_PAGE_LAYERS / LAYERS_PER_INSTANCE)
            .map(|i| serde_json::json!({"type": "ref", "id": format!("r{i}"), "ref": "c"}))
            .collect();
        assert!(page_load_is_heavy(&page(serde_json::Value::Array(
            instances
        ))));
    }

    #[test]
    fn the_cover_label_is_localized() {
        let overlay = |locale| PageLoadingOverlay {
            theme: Theme::default(),
            locale,
        };
        assert_eq!(overlay(Locale::ZhCn).label(), "正在加载页面…");
        assert_eq!(overlay(Locale::EnUs).label(), "Loading page…");
    }
}
