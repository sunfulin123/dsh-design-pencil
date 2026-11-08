//! Value labels for variables-panel cells, including Figma-style alias
//! pills: the resolved swatch and `→ name` instead of the raw `$name`.

use super::paint::paint_text;
use crate::theme::Theme;
use crate::widgets::PaintCx;
use crate::{Color, Point2D, Rect};
use jian_ops_schema::variable::VariableScalar;

const SWATCH: f32 = 18.0;

pub(super) fn is_alias(scalar: &VariableScalar) -> bool {
    matches!(scalar, VariableScalar::Str(text) if text.starts_with('$'))
}

/// An alias cell: resolved colour swatch (when it is a colour) and the
/// target name in a muted pill, as Figma shows aliased values.
pub(super) fn paint_alias_cell(
    cx: &mut PaintCx<'_>,
    theme: Theme,
    origin: Point2D,
    alias: &str,
    resolved: Option<&VariableScalar>,
) {
    let mut x = origin.x;
    if let Some(color) = resolved.and_then(scalar_as_color) {
        let swatch = Rect {
            origin,
            size: Point2D::new(SWATCH, SWATCH),
        };
        cx.backend.fill_round_rect(swatch, 3.0, color);
        cx.backend.stroke_round_rect(swatch, 3.0, theme.border, 1.0);
        x += SWATCH + 8.0;
    }
    let label = format!("→ {}", alias.trim_start_matches('$'));
    let pill = Rect {
        origin: Point2D::new(x - 4.0, origin.y - 1.0),
        size: Point2D::new(label.chars().count() as f32 * 6.6 + 8.0, 20.0),
    };
    cx.backend.fill_round_rect(pill, 4.0, theme.muted);
    paint_text(cx, &label, 12.0, theme.foreground, x, origin.y + 14.0);
}

pub(super) fn scalar_as_color(s: &VariableScalar) -> Option<Color> {
    let hex = match s {
        VariableScalar::Str(hex) => hex,
        _ => return None,
    };
    let (r, g, b) = op_editor_core::color_picker::parse_hex_rgb(hex)?;
    Some(Color { r, g, b, a: 1.0 })
}

/// Alpha channel of a `#rrggbbaa` hex as 0-100 (TS
/// `variable-row.tsx getOpacityForTheme`); `None` for non-9-char
/// strings → caller falls back to 100.
pub(super) fn scalar_alpha_percent(s: &VariableScalar) -> Option<u32> {
    let VariableScalar::Str(hex) = s else {
        return None;
    };
    if !hex.starts_with('#') || hex.len() != 9 {
        return None;
    }
    let alpha = u8::from_str_radix(&hex[7..9], 16).ok()?;
    Some(((alpha as f32 / 255.0) * 100.0).round() as u32)
}

pub(super) fn scalar_hex_label(s: &VariableScalar) -> Option<String> {
    let VariableScalar::Str(hex) = s else {
        return None;
    };
    if hex.starts_with('#') && hex.len() >= 7 {
        Some(hex[..7].to_string())
    } else {
        Some(hex.clone())
    }
}

pub(super) fn scalar_to_label(s: &VariableScalar) -> String {
    match s {
        VariableScalar::Str(s) => s.clone(),
        VariableScalar::Num(n) => format!("{n}"),
        VariableScalar::Bool(b) => if *b { "true" } else { "false" }.to_string(),
    }
}
