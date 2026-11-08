use super::*;
use crate::widgets::canvas_text_edit::{
    ink_center_above_baseline, is_cjk_char, TextEditLayout, MIN_SHRINK_SCALE,
};
use std::ops::Range;

pub(super) fn styled_layout(
    backend: &mut dyn RenderBackend,
    node: &SceneNode,
) -> (TextEditLayout, Vec<f32>) {
    let text = node.text.as_deref().unwrap_or("");
    let mut font_size = if node.font_size > 0.0 {
        node.font_size
    } else {
        13.0
    };
    let weight = if node.font_weight > 0 {
        node.font_weight
    } else {
        400
    };
    let line_height = if node.line_height > 0.0 {
        node.line_height
    } else {
        1.2
    };
    let mut letter_spacing = if node.letter_spacing.is_finite() {
        node.letter_spacing
    } else {
        0.0
    };
    let family = if node.font_family.trim().is_empty() {
        "system-ui"
    } else {
        &node.font_family
    };
    let wrap_width = node.text_wrap.then(|| {
        let width = node.bounds.size.x;
        if node.text_truncation {
            width
        } else {
            width + (width * 0.05).ceil().min((font_size * 0.5).ceil())
        }
    });
    let ranges = wrapped_ranges(text, wrap_width, |range| {
        measure_line_slices(
            backend,
            node,
            text,
            range.start,
            range.end,
            font_size,
            weight,
            Color::BLACK,
            family,
            letter_spacing,
        )
    });
    if !node.text_wrap && !node.text_truncation && node.bounds.size.x > 0.0 {
        let widest = ranges
            .iter()
            .map(|range| {
                measure_line_slices(
                    backend,
                    node,
                    text,
                    range.start,
                    range.end,
                    font_size,
                    weight,
                    Color::BLACK,
                    family,
                    letter_spacing,
                )
            })
            .fold(0.0_f32, f32::max);
        if widest > node.bounds.size.x {
            let scale = (node.bounds.size.x / widest).clamp(MIN_SHRINK_SCALE, 1.0);
            font_size *= scale;
            letter_spacing *= scale;
        }
    }
    let mut baselines = Vec::with_capacity(ranges.len());
    let mut block_height = 0.0;
    for range in &ranges {
        let mut ascent = 0.0_f32;
        let mut descent = 0.0_f32;
        let mut largest = 0.0_f32;
        let mut metrics = |start, end, run: Option<usize>| {
            let run = run.map(|i| &node.text_runs[i]);
            let style = resolved_slice_style(node, font_size, weight, Color::BLACK, run);
            let baseline = backend.text_first_baseline(&TextBaselineRequest {
                text: &text[start..end],
                font_family: slice_family(family, run),
                font_size: style.font_size,
                font_weight: style.weight,
                italic: style.italic,
                line_height,
            });
            ascent = ascent.max(baseline);
            descent = descent.max((style.font_size * line_height - baseline).max(0.0));
            largest = largest.max(style.font_size);
        };
        if range.is_empty() {
            metrics(range.start, range.end, None);
        } else {
            for_each_slice_range(&node.text_runs, range.start, range.end, &mut metrics);
        }
        let height = ascent + descent;
        let baseline = if node.text_vertical_align == SceneTextVerticalAlign::Middle {
            height / 2.0 + ink_center_above_baseline(&text[range.clone()], largest)
        } else {
            ascent
        };
        baselines.push(block_height + baseline);
        block_height += height;
    }
    let v_offset = if node.bounds.size.y <= 0.0 {
        0.0
    } else {
        match node.text_vertical_align {
            SceneTextVerticalAlign::Top => 0.0,
            SceneTextVerticalAlign::Middle => (node.bounds.size.y - block_height) / 2.0,
            SceneTextVerticalAlign::Bottom => node.bounds.size.y - block_height,
        }
    };
    (
        TextEditLayout {
            lines: ranges
                .iter()
                .map(|range| text[range.clone()].to_owned())
                .collect(),
            line_starts: ranges.iter().map(|range| range.start).collect(),
            font_size,
            weight,
            line_h: font_size * line_height,
            letter_spacing,
            align_width: wrap_width.unwrap_or(node.bounds.size.x),
            origin: Point2D::new(node.bounds.origin.x, node.bounds.origin.y + v_offset),
            text_align: node.text_align,
            v_align: node.text_vertical_align,
            v_offset,
        },
        baselines,
    )
}

fn wrapped_ranges(
    text: &str,
    width: Option<f32>,
    mut measure: impl FnMut(Range<usize>) -> f32,
) -> Vec<Range<usize>> {
    let mut lines = Vec::new();
    let mut start = 0;
    for paragraph in text.split('\n') {
        let end = start + paragraph.len();
        if width.is_none_or(|width| width <= 0.0 || measure(start..end) <= width) {
            lines.push(start..end);
        } else {
            let max_width = width.unwrap_or_default();
            let mut cursor = start;
            let mut line_start = start;
            while cursor < end {
                let ch = text[cursor..end]
                    .chars()
                    .next()
                    .expect("nonempty character range");
                let mut next = cursor + ch.len_utf8();
                if ch != ' ' && !is_cjk_char(ch) {
                    for ch in text[next..end].chars() {
                        if ch == ' ' || is_cjk_char(ch) {
                            break;
                        }
                        next += ch.len_utf8();
                    }
                }
                if line_start < cursor && measure(line_start..next) > max_width {
                    lines.push(line_start..cursor);
                    line_start = if ch == ' ' { next } else { cursor };
                }
                cursor = next;
            }
            if line_start < end {
                lines.push(line_start..end);
            }
        }
        start = end + 1;
    }
    lines
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn wrap_ranges_keep_unicode_byte_boundaries_and_empty_paragraphs() {
        let text = "中🙂文\n\n文中\n";
        let ranges = wrapped_ranges(text, Some(2.0), |r| text[r].chars().count() as f32);
        let lines: Vec<_> = ranges.iter().map(|r| &text[r.clone()]).collect();
        assert_eq!(lines, vec!["中🙂", "文", "", "文中", ""]);
        assert_eq!(ranges[1].start, "中🙂".len());
    }

    #[test]
    fn long_words_and_zero_width_keep_existing_canvas_wrap_policy() {
        let text = "longword x";
        let lines = wrapped_ranges(text, Some(2.0), |r| r.len() as f32);
        assert_eq!(
            lines.iter().map(|r| &text[r.clone()]).collect::<Vec<_>>(),
            vec!["longword", "x"]
        );
        assert_eq!(
            wrapped_ranges(text, Some(0.0), |_| 100.0),
            vec![0..text.len()]
        );
    }
}
