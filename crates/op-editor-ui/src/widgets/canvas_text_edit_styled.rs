//! Widths for mixed-style text use the same run attributes as the painter.
use super::TextEditLayout;
use crate::RenderBackend;

pub(super) fn advance(
    layout: &TextEditLayout,
    backend: &mut dyn RenderBackend,
    line_index: usize,
    local_end: usize,
) -> f32 {
    let line = &layout.lines[line_index];
    let line_start = layout.line_starts[line_index];
    let end = line_start + local_end.min(line.len());
    let mut cursor = line_start;
    let mut width = 0.0;
    let mut count = 0usize;
    while cursor < end {
        let run = layout
            .runs
            .iter()
            .find(|run| run.start <= cursor && cursor < run.end);
        let next = run
            .map_or_else(
                || {
                    layout
                        .runs
                        .iter()
                        .filter(|run| run.start > cursor)
                        .map(|run| run.start)
                        .min()
                        .unwrap_or(end)
                },
                |run| run.end,
            )
            .min(end);
        if next <= cursor {
            break;
        }
        let slice = &line[cursor - line_start..next - line_start];
        let family = run
            .and_then(|run| run.font_family.as_deref())
            .unwrap_or(&layout.family);
        let size = run
            .filter(|run| run.font_size > 0.0)
            .map_or(layout.font_size, |run| run.font_size * layout.run_scale);
        let weight = run
            .filter(|run| run.font_weight > 0)
            .map_or(layout.weight, |run| run.font_weight);
        let italic = run.map_or(layout.italic, |run| run.italic);
        width += backend.measure_text_family_styled(slice, size, family, weight, italic);
        count += slice.chars().count();
        cursor = next;
    }
    if count > 0 {
        width += (count - 1) as f32 * layout.letter_spacing;
        if local_end < line.len() {
            width += layout.letter_spacing;
        }
    }
    width
}
