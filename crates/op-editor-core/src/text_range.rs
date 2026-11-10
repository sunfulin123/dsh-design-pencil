use super::{plain_text, segment, TextContent, TextDesignResult, TextRangeStyle};
use jian_ops_schema::style::StyledTextSegment;

/// Range offsets count Unicode scalar values, not UTF-8 bytes or UTF-16 units.
/// Existing attributes outside the half-open range are never changed.
pub fn styled_range(
    content: &TextContent,
    start: usize,
    end: usize,
    style: &TextRangeStyle,
) -> TextDesignResult<TextContent> {
    validate_style(style)?;
    let text = plain_text(content);
    let mut boundaries: Vec<usize> = text.char_indices().map(|(i, _)| i).collect();
    boundaries.push(text.len());
    if start > end || end >= boundaries.len() {
        return Err("range must satisfy 0 <= start <= end <= text character count".into());
    }
    if start == end {
        return Ok(content.clone());
    }
    let (start, end) = (boundaries[start], boundaries[end]);
    let source = match content {
        TextContent::Plain(text) => vec![segment(text)],
        TextContent::Styled(runs) => runs.clone(),
    };
    let mut result: Vec<StyledTextSegment> = Vec::new();
    let mut offset = 0;
    for run in source {
        let run_end = offset + run.text.len();
        let mut cuts = vec![offset, run_end];
        for boundary in [start, end] {
            if offset < boundary && boundary < run_end {
                cuts.push(boundary);
            }
        }
        cuts.sort_unstable();
        for pair in cuts.windows(2) {
            let (a, b) = (pair[0], pair[1]);
            if a == b {
                continue;
            }
            let mut piece = run.clone();
            piece.text = run.text[a - offset..b - offset].to_owned();
            if a >= start && b <= end {
                apply_style(&mut piece, style);
            }
            push_segment(&mut result, piece);
        }
        offset = run_end;
    }
    Ok(TextContent::Styled(result))
}

pub(crate) fn push_segment(out: &mut Vec<StyledTextSegment>, run: StyledTextSegment) {
    if run.text.is_empty() {
        return;
    }
    if let Some(last) = out.last_mut() {
        if last.font_family == run.font_family
            && last.font_size == run.font_size
            && last.font_weight == run.font_weight
            && last.font_style == run.font_style
            && last.fill == run.fill
            && last.underline == run.underline
            && last.strikethrough == run.strikethrough
            && last.href == run.href
        {
            last.text.push_str(&run.text);
            return;
        }
    }
    out.push(run);
}

pub(super) fn apply_style(run: &mut StyledTextSegment, style: &TextRangeStyle) {
    if let Some(value) = &style.font_family {
        run.font_family = (!value.trim().is_empty()).then(|| value.trim().to_owned());
    }
    if let Some(value) = style.font_size {
        run.font_size = Some(value);
    }
    if let Some(value) = style.font_weight {
        run.font_weight = Some(value);
    }
    if let Some(value) = &style.font_style {
        run.font_style = Some(value.clone());
    }
    if let Some(value) = &style.fill {
        run.fill = Some(value.clone());
    }
    if let Some(value) = style.underline {
        run.underline = Some(value);
    }
    if let Some(value) = style.strikethrough {
        run.strikethrough = Some(value);
    }
    if let Some(value) = &style.href {
        run.href = (!value.is_empty()).then(|| value.clone());
    }
}

fn validate_style(style: &TextRangeStyle) -> TextDesignResult<()> {
    if style
        .font_family
        .as_deref()
        .is_some_and(|family| family.chars().count() > 512 || family.chars().any(char::is_control))
    {
        return Err(
            "fontFamily must contain at most 512 characters and no control characters".into(),
        );
    }
    if style.font_size.is_some_and(|s| !s.is_finite() || s <= 0.0) {
        return Err("fontSize must be finite and positive".into());
    }
    if style.font_weight.is_some_and(|w| !(1..=1000).contains(&w)) {
        return Err("fontWeight must be between 1 and 1000".into());
    }
    if let Some(fill) = &style.fill {
        if op_util::hex_color::parse_hex_rgba8(fill, op_util::hex_color::HexOptions::default())
            .is_none()
        {
            return Err("fill must be a hex color".into());
        }
    }
    if style
        .href
        .as_deref()
        .is_some_and(|href| !href.is_empty() && !safe_link(href))
    {
        return Err("href must be http(s), mailto, a fragment or a relative URL".into());
    }
    Ok(())
}

/// Allow document/navigation links but never script or data schemes.
pub fn safe_link(href: &str) -> bool {
    let href = href.trim();
    if href.is_empty() || href.chars().any(char::is_control) {
        return false;
    }
    match href.split_once(':') {
        Some((scheme, _)) if !scheme.contains(['/', '?', '#']) => matches!(
            scheme.to_ascii_lowercase().as_str(),
            "http" | "https" | "mailto"
        ),
        _ => true,
    }
}
