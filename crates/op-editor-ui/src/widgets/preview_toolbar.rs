//! Managed preview controls with shared responsive paint and hit-test geometry.

use crate::widgets::icons::{draw_icon, Icon};
use crate::widgets::{text_metrics, PaintCx};
use crate::{Point2D, Rect, TextLayout, Theme};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PreviewControl {
    List,
    Present,
    Exit,
    Previous,
    Next,
    Frame(usize),
    ZoomButton(op_editor_core::StatusBarButton),
}

pub struct PreviewNavigationRow<'a> {
    pub label: &'a str,
    pub frame: Option<usize>,
    pub selected: bool,
}

pub struct PreviewToolbar<'a> {
    pub locale: op_i18n::Locale,
    pub counter: &'a str,
    pub present: bool,
    pub zoom_percent: u32,
    pub list_open: bool,
    pub hover: Option<PreviewControl>,
    pub can_go_back: bool,
    pub can_go_forward: bool,
    pub rows: &'a [PreviewNavigationRow<'a>],
    pub list_scroll: f32,
}

impl PreviewToolbar<'_> {
    pub fn header_height(_canvas: Rect) -> f32 {
        48.0
    }

    pub fn control_rects(canvas: Rect) -> Vec<(PreviewControl, Rect)> {
        let left = canvas.origin.x;
        let top = canvas.origin.y;
        let width = canvas.size.x;
        vec![
            (
                PreviewControl::List,
                Rect::xywh(left + 8.0, top + 8.0, 32.0, 32.0),
            ),
            (
                PreviewControl::Present,
                Rect::xywh(left + width - 76.0, top + 8.0, 32.0, 32.0),
            ),
            (
                PreviewControl::Exit,
                Rect::xywh(left + width - 40.0, top + 8.0, 32.0, 32.0),
            ),
            (
                PreviewControl::Previous,
                Rect::xywh(
                    left + width / 2.0 - 80.0,
                    top + canvas.size.y - if width < 600.0 { 84.0 } else { 44.0 },
                    32.0,
                    32.0,
                ),
            ),
            (
                PreviewControl::Next,
                Rect::xywh(
                    left + width / 2.0 + 48.0,
                    top + canvas.size.y - if width < 600.0 { 84.0 } else { 44.0 },
                    32.0,
                    32.0,
                ),
            ),
        ]
    }

    pub fn zoom_rect(canvas: Rect) -> Rect {
        Rect::xywh(
            canvas.origin.x + canvas.size.x - 156.0,
            canvas.origin.y + canvas.size.y - 44.0,
            144.0,
            32.0,
        )
    }

    fn visible_control(&self, control: PreviewControl) -> bool {
        if self.present {
            return matches!(
                control,
                PreviewControl::Present
                    | PreviewControl::Exit
                    | PreviewControl::Previous
                    | PreviewControl::Next
            );
        }
        true
    }

    fn zoom_bar(&self, theme: &Theme) -> crate::widgets::StatusBar {
        let mut bar = crate::widgets::StatusBar::with_zoom(self.zoom_percent);
        bar.theme = theme.clone();
        bar.show_pixel_grid = false;
        bar.hover = match self.hover {
            Some(PreviewControl::ZoomButton(button)) => Some(button),
            _ => None,
        };
        bar
    }

    pub fn list_rect(canvas: Rect) -> Rect {
        let top = Self::header_height(canvas);
        Rect::xywh(
            canvas.origin.x,
            canvas.origin.y + top,
            232.0_f32.min(canvas.size.x - 64.0),
            (canvas.size.y - top).max(0.0),
        )
    }

    pub fn hit_test(&self, canvas: Rect, point: Point2D) -> Option<PreviewControl> {
        if !self.present {
            if let Some(button) = self
                .zoom_bar(&Theme::dark())
                .control_at(Self::zoom_rect(canvas), point)
            {
                return Some(PreviewControl::ZoomButton(button));
            }
        }
        if let Some((kind, _)) = Self::control_rects(canvas)
            .into_iter()
            .find(|(control, rect)| self.visible_control(*control) && rect.contains(point))
        {
            return Some(kind);
        }
        if self.list_open {
            let rect = Self::list_rect(canvas);
            if rect.contains(point) {
                let index = ((point.y - rect.origin.y - 8.0 + self.list_scroll) / 30.0).floor();
                return (index >= 0.0)
                    .then(|| {
                        self.rows
                            .get(index as usize)
                            .and_then(|row| row.frame.map(PreviewControl::Frame))
                    })
                    .flatten();
            }
        }
        None
    }

    pub fn paint(&self, cx: &mut PaintCx<'_>, canvas: Rect, theme: &Theme) {
        cx.backend.fill_rect(
            Rect::xywh(
                canvas.origin.x,
                canvas.origin.y,
                canvas.size.x,
                Self::header_height(canvas),
            ),
            theme.card,
        );
        let navigation = Rect::xywh(
            canvas.origin.x + canvas.size.x / 2.0 - 88.0,
            canvas.origin.y + canvas.size.y - if canvas.size.x < 600.0 { 88.0 } else { 48.0 },
            176.0,
            40.0,
        );
        cx.backend.fill_round_rect(navigation, 4.0, theme.card);
        cx.backend
            .stroke_round_rect(navigation, 4.0, theme.border, 1.0);
        for (control, rect) in Self::control_rects(canvas) {
            if !self.visible_control(control) {
                continue;
            }
            let enabled = match control {
                PreviewControl::Previous => self.can_go_back,
                PreviewControl::Next => self.can_go_forward,
                _ => true,
            };
            if self.hover == Some(control) && enabled {
                cx.backend.fill_round_rect(rect, 4.0, theme.muted);
            }
            let ink = if enabled {
                theme.muted_foreground
            } else {
                theme.border
            };
            let icon = match control {
                PreviewControl::List => Some(Icon::PanelLeft),
                PreviewControl::Exit => Some(Icon::Close),
                PreviewControl::Present => Some(Icon::Maximize),
                PreviewControl::Previous => Some(Icon::ChevronRight),
                PreviewControl::Next => Some(Icon::ChevronRight),
                _ => None,
            };
            if let Some(icon) = icon {
                cx.backend.save();
                if control == PreviewControl::Previous {
                    cx.backend
                        .translate(Point2D::new(rect.origin.x + rect.size.x, rect.origin.y));
                    cx.backend
                        .scale(Point2D::new(-1.0, 1.0), Point2D::new(0.0, 0.0));
                    draw_icon(cx.backend, icon, Point2D::new(8.0, 8.0), 16.0, ink, 1.5);
                } else {
                    draw_icon(
                        cx.backend,
                        icon,
                        Point2D::new(rect.origin.x + 8.0, rect.origin.y + 8.0),
                        16.0,
                        ink,
                        1.5,
                    );
                }
                cx.backend.restore();
            }
        }
        if !self.present {
            use crate::widgets::Widget;
            self.zoom_bar(theme).paint(cx, Self::zoom_rect(canvas));
        }
        Self::center_label(
            cx,
            self.counter,
            Rect::xywh(
                canvas.origin.x + canvas.size.x / 2.0 - 40.0,
                canvas.origin.y + canvas.size.y - if canvas.size.x < 600.0 { 84.0 } else { 44.0 },
                80.0,
                32.0,
            ),
            theme.muted_foreground,
        );
        if self.list_open {
            let rect = Self::list_rect(canvas);
            cx.backend.fill_rect(rect, theme.card);
            cx.backend.save();
            cx.backend.clip_rect(rect);
            for (index, row) in self.rows.iter().enumerate() {
                let bounds = Rect::xywh(
                    rect.origin.x + 8.0,
                    rect.origin.y + 8.0 + index as f32 * 30.0 - self.list_scroll,
                    rect.size.x - 16.0,
                    30.0,
                );
                if row.selected {
                    cx.backend.fill_round_rect(bounds, 4.0, theme.accent);
                }
                if row.frame.map(PreviewControl::Frame) == self.hover && row.frame.is_some() {
                    cx.backend.fill_round_rect(bounds, 4.0, theme.muted);
                }
                let inset = if row.frame.is_some() { 16.0 } else { 0.0 };
                Self::label(
                    cx,
                    row.label,
                    Rect::xywh(
                        bounds.origin.x + 8.0 + inset,
                        bounds.origin.y,
                        bounds.size.x - inset - 16.0,
                        bounds.size.y,
                    ),
                    if row.selected {
                        theme.primary
                    } else {
                        theme.muted_foreground
                    },
                );
            }
            cx.backend.restore();
        }
        if let Some(control) = self.hover {
            let key = match control {
                PreviewControl::List => Some("preview.list"),
                PreviewControl::Present => Some(if self.present {
                    "preview.mode.preview"
                } else {
                    "preview.mode.present"
                }),
                PreviewControl::Exit => Some("tooltip.topbar.exitPreview"),
                PreviewControl::Previous => Some("preview.previous"),
                PreviewControl::Next => Some("preview.next"),
                _ => None,
            };
            if let Some(key) = key {
                let anchor = Self::control_rects(canvas)
                    .into_iter()
                    .find(|(kind, _)| *kind == control)
                    .unwrap()
                    .1;
                let placement =
                    if matches!(control, PreviewControl::Previous | PreviewControl::Next) {
                        crate::widgets::tooltip::TooltipPlacement::Above
                    } else {
                        crate::widgets::tooltip::TooltipPlacement::Below
                    };
                crate::widgets::tooltip::paint_tooltip(
                    cx,
                    theme,
                    anchor,
                    op_i18n::translate(self.locale, key),
                    None,
                    placement,
                    Some((canvas.origin.x + 4.0, canvas.origin.x + canvas.size.x - 4.0)),
                );
            }
        }
    }

    fn center_label(cx: &mut PaintCx<'_>, text: &str, rect: Rect, color: crate::Color) {
        let width = text_metrics::measure_chrome(cx.backend, text, 12.0).min(rect.size.x);
        Self::label(
            cx,
            text,
            Rect::xywh(
                rect.origin.x + (rect.size.x - width) / 2.0,
                rect.origin.y,
                width,
                rect.size.y,
            ),
            color,
        );
    }

    fn label(cx: &mut PaintCx<'_>, text: &str, rect: Rect, color: crate::Color) {
        let mut label = text.to_owned();
        if text_metrics::measure_chrome(cx.backend, &label, 12.0) > rect.size.x {
            while !label.is_empty()
                && text_metrics::measure_chrome(cx.backend, &(label.clone() + "..."), 12.0)
                    > rect.size.x
            {
                label.pop();
            }
            label.push_str("...");
        }
        let layout = TextLayout::single_run(
            &label,
            "system-ui",
            12.0,
            color.to_jian(),
            Point2D::new(0.0, 0.0),
        );
        cx.backend.draw_text(
            &layout,
            Point2D::new(rect.origin.x, rect.origin.y + rect.size.y / 2.0 + 4.0),
        );
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::Rect;

    #[test]
    fn zoom_is_at_bottom_right_and_present_hides_chrome_controls() {
        for width in [320.0, 744.0, 1224.0] {
            let canvas = Rect::xywh(0.0, 0.0, width, 768.0);
            let zoom = PreviewToolbar::zoom_rect(canvas);
            assert_eq!(zoom.origin.x + zoom.size.x, width - 12.0);
            assert_eq!(zoom.origin.y + zoom.size.y, 756.0);
        }
        let mut toolbar = PreviewToolbar {
            locale: op_i18n::Locale::EnUs,
            counter: "1 / 2",
            present: false,
            zoom_percent: 100,
            list_open: false,
            hover: None,
            can_go_back: false,
            can_go_forward: true,
            rows: &[],
            list_scroll: 0.0,
        };
        assert!(toolbar.visible_control(PreviewControl::List));
        toolbar.present = true;
        assert!(!toolbar.visible_control(PreviewControl::List));
        assert!(toolbar.visible_control(PreviewControl::Present));
        assert!(toolbar.visible_control(PreviewControl::Exit));
    }

    #[test]
    fn preview_toolbar_controls_do_not_overlap_or_escape_mobile_and_desktop() {
        for width in [320.0, 390.0, 744.0, 1024.0, 1440.0] {
            let canvas = Rect::xywh(0.0, 0.0, width, 800.0);
            let controls = PreviewToolbar::control_rects(canvas);
            for (index, (_, rect)) in controls.iter().enumerate() {
                assert!(rect.origin.x >= 0.0 && rect.origin.x + rect.size.x <= width);
                for (_, other) in controls.iter().skip(index + 1) {
                    assert!(
                        rect.origin.x + rect.size.x <= other.origin.x
                            || other.origin.x + other.size.x <= rect.origin.x
                            || rect.origin.y + rect.size.y <= other.origin.y
                            || other.origin.y + other.size.y <= rect.origin.y
                    );
                }
            }
        }
    }
}
