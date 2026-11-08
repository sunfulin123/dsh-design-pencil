use super::text_paragraph::{flow_text, frame};
use super::text_range::push_segment;
use super::{
    segment, MarkdownOptions, ParagraphStyle, PenNode, TextContent, TextDesignResult, TextNode,
};
use jian_ops_schema::node::FontWeight;
use jian_ops_schema::sizing::SizingBehavior;
use jian_ops_schema::style::{FontStyleKind, StyledTextSegment};

/// Parse Markdown into canonical text and auto-layout nodes. One ordinary
/// paragraph preserves the template Text; blocks become editable layout nodes.
pub fn markdown_to_node(
    markdown: &str,
    template: &TextNode,
    options: &MarkdownOptions,
) -> TextDesignResult<PenNode> {
    if !options.width.is_finite() || options.width <= 0.0 {
        return Err("width must be finite and positive".into());
    }
    for value in [options.paragraph_spacing, options.list_indent] {
        if !value.is_finite() || value < 0.0 {
            return Err("Markdown spacing and indentation must be finite and non-negative".into());
        }
    }
    let normalized = markdown.replace("\r\n", "\n").replace('\r', "\n");
    let lines: Vec<&str> = normalized.lines().collect();
    let mut children = Vec::new();
    let mut i = 0;
    while i < lines.len() {
        let line = lines[i];
        if line.trim().is_empty() {
            i += 1;
            continue;
        }
        let id = format!("{}__p{}", template.base.id, children.len());
        let mut text = flow_text(template, &id);
        text.base.role = Some("paragraph".into());
        text.line_height = Some(template.layout_line_height_multiplier().unwrap_or(1.4));
        let trimmed = line.trim_start();
        if let Some(fence) = fence_marker(trimmed) {
            i += 1;
            let mut code = Vec::new();
            while i < lines.len() && !lines[i].trim_start().starts_with(&fence) {
                code.push(lines[i]);
                i += 1;
            }
            if i < lines.len() {
                i += 1;
            }
            text.font_family = Some("monospace".into());
            text.base.role = Some("code-block".into());
            text.content = TextContent::Plain(code.join("\n"));
            children.push(PenNode::Text(text));
            continue;
        }
        if let Some((level, body)) = heading(trimmed) {
            text.base.role = Some(format!("heading-{level}"));
            text.font_size = Some(
                template.font_size.unwrap_or(16.0) * [2.0, 1.65, 1.4, 1.2, 1.1, 1.0][level - 1],
            );
            text.font_weight = Some(FontWeight::Number(700));
            text.content = inline_content(body);
            children.push(PenNode::Text(text));
            i += 1;
            continue;
        }
        if let Some((marker, body, indent)) = list_item(line) {
            text.content = inline_content(body);
            let (list, number) = match marker.parse::<u32>() {
                Ok(number) => ("ordered", number),
                Err(_) => ("bullet", 1),
            };
            children.push(super::paragraph_to_node(
                &text,
                &ParagraphStyle {
                    list: Some(list.into()),
                    number,
                    indent: (indent / 2) as f64 * options.list_indent,
                    ..Default::default()
                },
            )?);
            i += 1;
            continue;
        }
        if let Some(body) = trimmed.strip_prefix('>') {
            text.content = inline_content(body.trim_start());
            let mut quote = super::paragraph_to_node(
                &text,
                &ParagraphStyle {
                    list: Some("bullet".into()),
                    ..Default::default()
                },
            )?;
            if let PenNode::Frame(row) = &mut quote {
                if let Some(PenNode::Text(marker)) =
                    row.children.as_mut().and_then(|c| c.first_mut())
                {
                    marker.content = TextContent::Plain("│".into());
                }
            }
            children.push(quote);
            i += 1;
            continue;
        }
        let mut paragraph = String::new();
        loop {
            let current = lines[i];
            let hard_break = current.ends_with("  ") || current.ends_with('\\');
            paragraph.push_str(if hard_break {
                current.trim_end().trim_end_matches('\\')
            } else {
                current.trim()
            });
            i += 1;
            if i >= lines.len() || lines[i].trim().is_empty() || starts_block(lines[i]) {
                break;
            }
            paragraph.push(if hard_break { '\n' } else { ' ' });
        }
        text.content = inline_content(&paragraph);
        children.push(PenNode::Text(text));
    }
    if let [PenNode::Text(paragraph)] = children.as_slice() {
        if paragraph.base.role.as_deref() == Some("paragraph") {
            let mut text = template.clone();
            text.content = paragraph.content.clone();
            return Ok(PenNode::Text(text));
        }
    }
    let mut base = template.base.clone();
    base.role = Some("markdown".into());
    frame(
        base,
        children,
        template
            .width
            .clone()
            .unwrap_or(SizingBehavior::Number(options.width)),
        "vertical",
        options.paragraph_spacing,
        [0.0; 4],
    )
}

fn heading(line: &str) -> Option<(usize, &str)> {
    let level = line.bytes().take_while(|b| *b == b'#').count();
    if !(1..=6).contains(&level) || !line.as_bytes().get(level)?.is_ascii_whitespace() {
        return None;
    }
    Some((level, line[level..].trim()))
}

fn fence_marker(line: &str) -> Option<String> {
    let first = line.as_bytes().first().copied()?;
    if first != b'`' && first != b'~' {
        return None;
    }
    let count = line.bytes().take_while(|b| *b == first).count();
    (count >= 3).then(|| line[..count].to_owned())
}

fn list_item(line: &str) -> Option<(&str, &str, usize)> {
    let trimmed = line.trim_start();
    let indent = line.len() - trimmed.len();
    if matches!(trimmed.as_bytes().first(), Some(b'-' | b'+' | b'*'))
        && trimmed
            .as_bytes()
            .get(1)
            .is_some_and(u8::is_ascii_whitespace)
    {
        return Some(("", trimmed[2..].trim_start(), indent));
    }
    let digits = trimmed.bytes().take_while(u8::is_ascii_digit).count();
    if digits > 0
        && digits <= 9
        && matches!(trimmed.as_bytes().get(digits), Some(b'.' | b')'))
        && trimmed
            .as_bytes()
            .get(digits + 1)
            .is_some_and(u8::is_ascii_whitespace)
    {
        return Some((
            &trimmed[..digits],
            trimmed[digits + 2..].trim_start(),
            indent,
        ));
    }
    None
}

fn starts_block(line: &str) -> bool {
    let trimmed = line.trim_start();
    heading(trimmed).is_some()
        || fence_marker(trimmed).is_some()
        || list_item(line).is_some()
        || trimmed.starts_with('>')
}

fn inline_content(input: &str) -> TextContent {
    let mut runs = Vec::new();
    parse_inline(input, &segment(""), &mut runs, 0);
    if runs.len() == 1 && runs[0] == segment(&runs[0].text) {
        TextContent::Plain(runs.remove(0).text)
    } else {
        TextContent::Styled(runs)
    }
}

fn append(out: &mut Vec<StyledTextSegment>, style: &StyledTextSegment, text: &str) {
    let mut run = style.clone();
    run.text = text.into();
    push_segment(out, run);
}

fn parse_inline(
    input: &str,
    style: &StyledTextSegment,
    out: &mut Vec<StyledTextSegment>,
    depth: usize,
) {
    if depth >= 16 {
        append(out, style, input);
        return;
    }
    let mut i = 0;
    while i < input.len() {
        let rest = &input[i..];
        if let Some(escaped) = rest.strip_prefix('\\').and_then(|s| s.chars().next()) {
            if escaped.is_ascii_punctuation() {
                append(out, style, &rest[1..1 + escaped.len_utf8()]);
                i += 1 + escaped.len_utf8();
                continue;
            }
        }
        if rest.starts_with('[') {
            if let Some(close) = rest.find("](") {
                if let Some(end) = link_end(&rest[close + 2..]) {
                    let href = rest[close + 2..close + 2 + end].trim();
                    if super::safe_link(href) {
                        let mut link_style = style.clone();
                        link_style.href = Some(href.into());
                        link_style.underline = Some(true);
                        link_style.fill = Some("#2563eb".into());
                        parse_inline(&rest[1..close], &link_style, out, depth + 1);
                        i += close + 3 + end;
                        continue;
                    }
                }
            }
        }
        if rest.starts_with('`') {
            let count = rest.bytes().take_while(|b| *b == b'`').count();
            let delimiter = &rest[..count];
            if let Some(end) = rest[count..].find(delimiter) {
                let mut code_style = style.clone();
                code_style.font_weight = Some(500);
                append(out, &code_style, &rest[count..count + end]);
                i += count * 2 + end;
                continue;
            }
        }
        let mut matched = false;
        for delimiter in ["***", "___", "**", "__", "~~", "*", "_"] {
            if !rest.starts_with(delimiter) {
                continue;
            }
            if delimiter.starts_with('_')
                && i > 0
                && input[..i]
                    .chars()
                    .next_back()
                    .is_some_and(char::is_alphanumeric)
            {
                continue;
            }
            let n = delimiter.len();
            if rest[n..].chars().next().is_some_and(char::is_whitespace) {
                continue;
            }
            let Some(end) = closing_emphasis(&rest[n..], delimiter) else {
                continue;
            };
            if end == 0 {
                continue;
            }
            let mut nested = style.clone();
            match delimiter {
                "***" | "___" => {
                    nested.font_weight = Some(700);
                    nested.font_style = Some(FontStyleKind::Italic);
                }
                "**" | "__" => nested.font_weight = Some(700),
                "~~" => nested.strikethrough = Some(true),
                _ => nested.font_style = Some(FontStyleKind::Italic),
            }
            parse_inline(&rest[n..n + end], &nested, out, depth + 1);
            i += n * 2 + end;
            matched = true;
            break;
        }
        if matched {
            continue;
        }
        let ch = rest.chars().next().expect("non-empty");
        append(out, style, &rest[..ch.len_utf8()]);
        i += ch.len_utf8();
    }
}

fn closing_emphasis(input: &str, delimiter: &str) -> Option<usize> {
    let marker = delimiter.as_bytes()[0];
    let size = delimiter.len();
    let mut i = 0;
    while i < input.len() {
        if input.as_bytes()[i] == b'\\' {
            i += 1;
            if let Some(ch) = input[i..].chars().next() {
                i += ch.len_utf8();
            }
            continue;
        }
        if input.as_bytes()[i] == marker {
            let count = input[i..].bytes().take_while(|b| *b == marker).count();
            let closes = count >= size && (size != 1 || count % 2 == 1);
            if closes
                && i > 0
                && !input[..i]
                    .chars()
                    .next_back()
                    .is_some_and(char::is_whitespace)
            {
                return Some(i + count - size);
            }
            i += count;
        } else {
            i += input[i..].chars().next()?.len_utf8();
        }
    }
    None
}

fn link_end(input: &str) -> Option<usize> {
    let mut nesting = 0usize;
    for (i, ch) in input.char_indices() {
        match ch {
            '(' => nesting += 1,
            ')' if nesting == 0 => return Some(i),
            ')' => nesting -= 1,
            _ => {}
        }
    }
    None
}
