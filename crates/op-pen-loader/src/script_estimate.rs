//! Script-aware text estimate for builds without a real shaper (CanvasKit
//! wasm + the Node engine).
//!
//! jian-core's `EstimateBackend` charges every character `0.58 em`, which is
//! right for Latin but under-measures CJK by ~40%: a Han / kana / hangul /
//! full-width character is a square `1 em` cell. Under-measured CJK text
//! hugs too narrow a box, wraps late and — via the flex solver — mis-centres
//! its siblings. This backend keeps the Latin model byte-for-byte and only
//! widens full-width characters.

use jian_core::layout::measure::{MeasureBackend, MeasureRequest, MeasureResult, StyledRun};

/// True for characters drawn in a full-width (`1 em`) cell.
pub(crate) fn is_fullwidth_char(c: char) -> bool {
    matches!(c as u32,
        0x1100..=0x11FF | 0x2E80..=0x303F | 0x3040..=0x33FF | 0x3400..=0x4DBF
        | 0x4E00..=0x9FFF | 0xA960..=0xA97F | 0xAC00..=0xD7FF | 0xF900..=0xFAFF
        | 0xFE30..=0xFE4F | 0xFF00..=0xFF60 | 0xFFE0..=0xFFE6 | 0x20000..=0x3FFFF)
}

#[derive(Debug, Default, Clone, Copy)]
pub(crate) struct ScriptAwareEstimate;

fn latin_ratio(weight: u16) -> f32 {
    if weight >= 700 {
        0.64
    } else if weight >= 600 {
        0.60
    } else {
        0.58
    }
}

fn char_advance(c: char, font_size: f32, ratio: f32) -> f32 {
    if is_fullwidth_char(c) {
        font_size
    } else {
        font_size * ratio
    }
}

/// Per authored line widths (explicit `\n` separated), tracking included.
fn line_widths(runs: &[StyledRun<'_>], font_size: f32, weight: u16) -> Vec<f32> {
    let ratio = latin_ratio(weight);
    let mut lines = vec![0.0_f32];
    for run in runs {
        let spacing = if run.letter_spacing.is_finite() {
            run.letter_spacing
        } else {
            0.0
        };
        for ch in run.text.chars() {
            if ch == '\n' {
                lines.push(0.0);
            } else if let Some(w) = lines.last_mut() {
                *w += char_advance(ch, font_size, ratio) + spacing;
            }
        }
    }
    lines.iter().map(|w| w.max(0.0)).collect()
}

impl MeasureBackend for ScriptAwareEstimate {
    fn measure(&self, req: &MeasureRequest<'_>) -> MeasureResult {
        if req.runs.is_empty() {
            return MeasureResult {
                width: 0.0,
                height: 0.0,
                line_count: 0,
                baseline: 0.0,
            };
        }
        let max_size = req.runs.iter().map(|r| r.font_size).fold(0.0, f32::max);
        let max_weight = req.runs.iter().map(|r| r.font_weight).max().unwrap_or(0);
        let widths = line_widths(req.runs, max_size, max_weight);
        let natural_w = widths.iter().copied().fold(0.0, f32::max);
        let line_mult = if req.line_height > 0.0 {
            req.line_height
        } else {
            1.3
        };
        let explicit_lines = widths.len();
        let (width, lines) = match req.max_width {
            Some(budget) if natural_w > budget + 0.5 && budget > 0.0 => {
                let wrapped: f32 = widths.iter().map(|w| (w / budget).ceil().max(1.0)).sum();
                (budget, wrapped)
            }
            _ => (natural_w, explicit_lines as f32),
        };
        MeasureResult {
            width,
            height: max_size * line_mult * lines,
            line_count: lines.min(f32::from(u16::MAX)) as u16,
            baseline: max_size * 0.8,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use jian_core::layout::measure::{EstimateBackend, FontStyleKind};

    fn run(text: &str, size: f32) -> StyledRun<'_> {
        StyledRun {
            text,
            font_family: None,
            font_size: size,
            font_weight: 400,
            font_style: FontStyleKind::Normal,
            letter_spacing: 0.0,
        }
    }

    fn measure(
        backend: &dyn MeasureBackend,
        text: &str,
        size: f32,
        max_width: Option<f32>,
    ) -> MeasureResult {
        let runs = [run(text, size)];
        backend.measure(&MeasureRequest {
            runs: &runs,
            line_height: 0.0,
            max_width,
        })
    }

    #[test]
    fn cjk_characters_measure_one_em_wide() {
        let r = measure(&ScriptAwareEstimate, "热卖好物推荐", 20.0, None);
        assert_eq!(r.width, 6.0 * 20.0);
    }

    #[test]
    fn latin_matches_the_reference_estimate_exactly() {
        for (text, max) in [
            ("Hello world", None),
            ("Hello\nworld line", None),
            ("Hello world this wraps a lot", Some(60.0)),
        ] {
            let a = measure(&ScriptAwareEstimate, text, 16.0, max);
            let b = measure(&EstimateBackend, text, 16.0, max);
            assert_eq!(
                (a.width, a.height, a.line_count),
                (b.width, b.height, b.line_count)
            );
        }
    }

    #[test]
    fn mixed_text_and_wrapping_count_fullwidth_cells() {
        let r = measure(&ScriptAwareEstimate, "你好ab", 10.0, None);
        assert!((r.width - (20.0 + 2.0 * 5.8)).abs() < 1e-4);
        let wrapped = measure(&ScriptAwareEstimate, "一二三四五六", 10.0, Some(30.0));
        assert_eq!(wrapped.line_count, 2);
    }
}
