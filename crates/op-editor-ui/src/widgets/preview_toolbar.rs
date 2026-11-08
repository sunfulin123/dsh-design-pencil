//! Managed preview controls with shared responsive paint and hit-test geometry.

use crate::widgets::icons::{draw_icon, Icon};
use crate::widgets::{text_metrics, PaintCx};
use crate::{Point2D, Rect, TextLayout, Theme};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PreviewControl {
    List,
    Restart,
    ScaleMode,
    Present,
    Exit,
    Previous,
    Next,
    Frame(usize),
    Flow(usize),
    ZoomButton(op_editor_core::StatusBarButton),
}

pub struct PreviewNavigationRow<'a> {
    pub label: &'a str,
    pub frame: Option<usize>,
    pub flow: Option<usize>,
    pub selected: bool,
}

pub struct PreviewToolbar<'a> {
    pub locale: op_i18n::Locale,
    pub title: &'a str,
    pub scale_label: &'a str,
    pub counter: &'a str,
    pub present: bool,
    pub zoom_percent: u32,
    pub can_zoom_out: bool,
    pub can_zoom_in: bool,
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

    /// Fixed bottom bar holding navigation and zoom outside the stage.
    /// Narrow canvases stack navigation above the zoom pill.
    pub fn bottom_bar_height(canvas: Rect) -> f32 {
        if canvas.size.x < 600.0 {
            96.0
        } else {
            56.0
        }
    }

    pub fn bottom_bar_rect(canvas: Rect) -> Rect {
        let h = Self::bottom_bar_height(canvas).min(canvas.size.y);
        Rect::xywh(
            canvas.origin.x,
            canvas.origin.y + canvas.size.y - h,
            canvas.size.x,
            h,
        )
    }

    pub fn control_rects(canvas: Rect) -> Vec<(PreviewControl, Rect)> {
        let left = canvas.origin.x;
        let top = canvas.origin.y;
        let width = canvas.size.x;
        let mut rects = vec![
            (
                PreviewControl::List,
                Rect::xywh(left + 8.0, top + 8.0, 32.0, 32.0),
            ),
            (
                PreviewControl::Restart,
                Rect::xywh(left + width - 112.0, top + 8.0, 32.0, 32.0),
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
        ];
        if width >= 480.0 {
            rects.push((
                PreviewControl::ScaleMode,
                Rect::xywh(left + width - 188.0, top + 10.0, 68.0, 28.0),
            ));
        }
        rects
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
        bar.theme = *theme;
        bar.show_pixel_grid = false;
        bar.disabled = [
            (!self.can_zoom_out).then_some(op_editor_core::StatusBarButton::ZoomOut),
            (!self.can_zoom_in).then_some(op_editor_core::StatusBarButton::ZoomIn),
        ];
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
                        self.rows.get(index as usize).and_then(|row| {
                            row.flow
                                .map(PreviewControl::Flow)
                                .or_else(|| row.frame.map(PreviewControl::Frame))
                        })
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
        if !self.title.is_empty() && canvas.size.x >= 520.0 {
            Self::center_label(
                cx,
                self.title,
                Rect::xywh(
                    canvas.origin.x + 48.0,
                    canvas.origin.y + 8.0,
                    (canvas.size.x - 248.0).max(80.0),
                    32.0,
                ),
                theme.foreground,
            );
        }
        let navigation = Rect::xywh(
            canvas.origin.x + canvas.size.x / 2.0 - 88.0,
            canvas.origin.y + canvas.size.y - if canvas.size.x < 600.0 { 88.0 } else { 48.0 },
            176.0,
            40.0,
        );
        if self.present {
            cx.backend.fill_round_rect(navigation, 4.0, theme.card);
            cx.backend
                .stroke_round_rect(navigation, 4.0, theme.border, 1.0);
        } else {
            let bar = Self::bottom_bar_rect(canvas);
            cx.backend.fill_rect(bar, theme.card);
            cx.backend.fill_rect(
                Rect::xywh(bar.origin.x, bar.origin.y, bar.size.x, 1.0),
                theme.border,
            );
        }
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
            if control == PreviewControl::ScaleMode {
                cx.backend.stroke_round_rect(rect, 4.0, theme.border, 1.0);
                Self::center_label(cx, self.scale_label, rect, theme.muted_foreground);
                continue;
            }
            let ink = if enabled {
                theme.muted_foreground
            } else {
                theme.border
            };
            let icon = match control {
                PreviewControl::List => Some(Icon::PanelLeft),
                PreviewControl::Restart => Some(Icon::RefreshCw),
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
                let row_ctrl = row
                    .flow
                    .map(PreviewControl::Flow)
                    .or_else(|| row.frame.map(PreviewControl::Frame));
                if row_ctrl == self.hover && row_ctrl.is_some() {
                    cx.backend.fill_round_rect(bounds, 4.0, theme.muted);
                }
                let inset = if row_ctrl.is_some() { 16.0 } else { 0.0 };
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
            title: "",
            scale_label: "Fit",
            counter: "1 / 2",
            present: false,
            zoom_percent: 100,
            can_zoom_out: false,
            can_zoom_in: true,
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
        toolbar.present = false;
        let canvas = Rect::xywh(0.0, 0.0, 1024.0, 768.0);
        let zoom = PreviewToolbar::zoom_rect(canvas);
        let hits = |toolbar: &PreviewToolbar<'_>, button| {
            (0..zoom.size.x as i32).any(|dx| {
                let point =
                    Point2D::new(zoom.origin.x + dx as f32, zoom.origin.y + zoom.size.y / 2.0);
                toolbar.zoom_bar(&Theme::dark()).control_at(zoom, point) == Some(button)
            })
        };
        assert!(!hits(&toolbar, op_editor_core::StatusBarButton::ZoomOut));
        assert!(hits(&toolbar, op_editor_core::StatusBarButton::ZoomIn));
        toolbar.can_zoom_out = true;
        assert!(hits(&toolbar, op_editor_core::StatusBarButton::ZoomOut));
    }

    #[test]
    fn bottom_bar_contains_navigation_and_zoom() {
        for width in [320.0, 744.0, 1224.0] {
            let canvas = Rect::xywh(0.0, 0.0, width, 768.0);
            let bar = PreviewToolbar::bottom_bar_rect(canvas);
            let zoom = PreviewToolbar::zoom_rect(canvas);
            assert!(zoom.origin.y >= bar.origin.y);
            for (control, rect) in PreviewToolbar::control_rects(canvas) {
                if matches!(control, PreviewControl::Previous | PreviewControl::Next) {
                    assert!(rect.origin.y >= bar.origin.y);
                    assert!(rect.origin.y + rect.size.y <= 768.0);
                }
            }
        }
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
