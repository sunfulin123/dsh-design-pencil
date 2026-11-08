use super::*;

/// Produce a display-only prefix. Byte offsets before the ellipsis remain
/// identical to the authored text, so rich-run styles keep their meaning.
pub(super) fn display_node(backend: &mut dyn RenderBackend, node: &SceneNode) -> Option<SceneNode> {
    let text = node.text.as_deref()?;
    if !node.text_truncation || text.is_empty() || node.bounds.size.x <= 0.0 {
        return None;
    }
    let (layout, baselines) = layout::styled_layout(backend, node);
    let height_limit = baselines
        .iter()
        .position(|baseline| *baseline > node.bounds.size.y)
        .unwrap_or(baselines.len())
        .max(1);
    let limit = node
        .max_lines
        .map_or(height_limit, |n| (n.max(1) as usize).min(height_limit));
    let visible = layout.lines.len().min(limit).max(1);
    let start = layout.line_starts[visible - 1];
    let end = start + layout.lines[visible - 1].len();
    let family = if node.font_family.is_empty() {
        "system-ui"
    } else {
        &node.font_family
    };
    let width = node.bounds.size.x;
    let measure = |backend: &mut dyn RenderBackend, end| {
        measure_line_slices(
            backend,
            node,
            text,
            start,
            end,
            layout.font_size,
            layout.weight,
            Color::BLACK,
            family,
            layout.letter_spacing,
        )
    };
    if visible == layout.lines.len() && measure(backend, end) <= width {
        return None;
    }
    let mut cut = end;
    loop {
        let run = node
            .text_runs
            .iter()
            .find(|r| r.start < cut && cut <= r.end);
        let style = resolved_slice_style(node, layout.font_size, layout.weight, Color::BLACK, run);
        let ellipsis = backend.measure_text_family_styled(
            "…",
            style.font_size,
            slice_family(family, run),
            style.weight,
            style.italic,
        );
        if cut <= start || measure(backend, cut) + ellipsis + layout.letter_spacing <= width {
            break;
        }
        cut = prev_char_boundary(text, cut - 1);
    }
    // Remove trailing whitespace before the ellipsis, keeping UTF-8 boundaries.
    while cut > start
        && text[..cut]
            .chars()
            .next_back()
            .is_some_and(char::is_whitespace)
    {
        cut = prev_char_boundary(text, cut - 1);
    }
    let mut out = node.clone();
    out.text = Some(format!("{}…", &text[..cut]));
    out.text_truncation = false;
    out.text_runs.retain(|run| run.start < cut);
    for run in &mut out.text_runs {
        if run.end >= cut {
            run.end = cut + "…".len();
        }
    }
    Some(out)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::layout_scene::NodeKind;
    use crate::widgets::test_capture_backend::CaptureBackend;

    #[test]
    fn truncation_is_display_only_and_never_splits_utf8() {
        let mut backend = CaptureBackend::default();
        let mut node = SceneNode::leaf("t", NodeKind::Text);
        node.text = Some("Channel 中文".into());
        node.font_size = 14.0;
        node.bounds = Rect::xywh(0.0, 0.0, 36.0, 20.0);
        node.text_wrap = true;
        node.text_truncation = true;
        node.max_lines = Some(1);
        let displayed = display_node(&mut backend, &node).expect("truncated");
        assert!(displayed.text.as_deref().unwrap().ends_with('…'));
        assert_eq!(node.text.as_deref(), Some("Channel 中文"));
        node.bounds.size.x = 1000.0;
        assert!(display_node(&mut backend, &node).is_none());
    }
}
