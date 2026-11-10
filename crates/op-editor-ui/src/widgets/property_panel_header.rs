//! The object header and visibility controls.
use super::*;

pub fn paint_node_header(
    cx: &mut PaintCx<'_>,
    theme: &Theme,
    snapshot: &NodeSnapshot,
    edit: &EditContext<'_>,
    locale: op_editor_core::Locale,
    x: f32,
    y: f32,
    w: f32,
) -> f32 {
    // Show the node's name so the header matches the LayerPanel
    // row; fall back to the kind label for an unnamed node.
    let fallback_title = if snapshot.name.is_empty() {
        snapshot.kind.as_str()
    } else {
        snapshot.name.as_str()
    };
    let title = edit.value_for(PropertyFocus::NodeName, fallback_title);
    // Component / instance badging — TS tints the header purple and
    // prefixes a Diamond glyph (property-panel.tsx:182-187).
    let (title_color, badge) = if snapshot.is_reusable {
        (COMPONENT_ACCENT, true)
    } else if snapshot.is_instance {
        (INSTANCE_ACCENT, true)
    } else {
        (theme.secondary_foreground, false)
    };
    let mut text_x = x + PAD_X;
    if badge {
        draw_icon(
            cx.backend,
            Icon::Diamond,
            Point2D::new(text_x, y + 11.0),
            12.0,
            title_color,
            1.4,
        );
        text_x += 18.0;
    }
    let actions_w = if snapshot.can_preview_screen {
        112.0
    } else {
        52.0
    };
    let name_rect = Rect {
        origin: Point2D::new(text_x, y + 3.0),
        size: Point2D::new(
            (w - PAD_X * 2.0 - actions_w - (text_x - (x + PAD_X))).max(40.0),
            INPUT_HEIGHT,
        ),
    };
    let name_focused = edit.focus == Some(PropertyFocus::NodeName);
    if name_focused {
        cx.backend.fill_round_rect(name_rect, 4.0, theme.muted);
        cx.backend
            .stroke_round_rect(name_rect, 4.0, theme.primary, 1.0);
    }
    cx.backend.save();
    cx.backend.clip_rect(name_rect);
    if !name_focused
        || !edit.paint_input_view_at(
            cx,
            theme,
            PropertyFocus::NodeName,
            name_rect,
            13.0,
            4.0,
            y + 21.0,
        )
    {
        let max_text_w = (name_rect.size.x - 8.0).max(16.0);
        let fitted_title =
            crate::widgets::text_metrics::fit_chrome(cx.backend, title, max_text_w, 13.0);
        let label = TextLayout::single_run(
            &fitted_title,
            "system-ui",
            13.0,
            (title_color).to_jian(),
            Point2D::new(0.0, 0.0),
        )
        .with_font_weight(600);
        cx.backend.draw_text(
            &label,
            Point2D::new(text_x + if name_focused { 4.0 } else { 0.0 }, y + 21.0),
        );
    }
    cx.backend.restore();
    let right_x = x + w - PAD_X;
    if snapshot.can_preview_screen {
        let label = if matches!(
            locale,
            op_editor_core::Locale::ZhCn | op_editor_core::Locale::ZhTw
        ) {
            if snapshot.preview_as_screen {
                "预览 ✓"
            } else {
                "预览 −"
            }
        } else if snapshot.preview_as_screen {
            "Preview ✓"
        } else {
            "Preview −"
        };
        let text = TextLayout::single_run(
            label,
            "system-ui",
            11.0,
            if snapshot.preview_as_screen {
                theme.primary.to_jian()
            } else {
                theme.muted_foreground.to_jian()
            },
            Point2D::ZERO,
        );
        cx.backend
            .draw_text(&text, Point2D::new(right_x - 108.0, y + 20.0));
    }
    let lock_icon = if snapshot.locked {
        Icon::Lock
    } else {
        Icon::LockOpen
    };
    let eye_icon = if snapshot.visible {
        Icon::Eye
    } else {
        Icon::EyeOff
    };
    draw_icon(
        cx.backend,
        eye_icon,
        Point2D::new(right_x - 42.0, y + 10.0),
        14.0,
        if snapshot.visible {
            theme.muted_foreground
        } else {
            theme.primary
        },
        1.5,
    );
    draw_icon(
        cx.backend,
        lock_icon,
        Point2D::new(right_x - 18.0, y + 10.0),
        14.0,
        if snapshot.locked {
            theme.primary
        } else {
            theme.muted_foreground
        },
        1.5,
    );
    y + HEADER_HEIGHT
}
