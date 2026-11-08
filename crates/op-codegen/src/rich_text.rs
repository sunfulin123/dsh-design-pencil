//! Styled text markup shared by the three deterministic design exporters.
use crate::{fmt_num, html_escape};
use jian_ops_schema::node::{TextContent, TextNode};
use jian_ops_schema::style::{FontStyleKind, StyledTextSegment};

pub(crate) fn body(node: &TextNode, jsx: bool) -> String {
    let owned;
    let runs = match &node.content {
        TextContent::Plain(text) => {
            owned = vec![StyledTextSegment {
                text: text.clone(),
                font_family: None,
                font_size: None,
                font_weight: None,
                font_style: None,
                fill: None,
                underline: None,
                strikethrough: None,
                href: None,
            }];
            &owned
        }
        TextContent::Styled(runs) => runs,
    };
    let mut out = String::new();
    for run in runs {
        let style = style(run, node, jsx);
        let tag = if run.href.as_deref().is_some_and(safe_link) {
            "a"
        } else {
            "span"
        };
        let href = if tag == "a" {
            format!(
                " href=\"{}\"",
                html_escape(run.href.as_deref().unwrap_or_default())
            )
        } else {
            String::new()
        };
        let attr = if style.is_empty() {
            String::new()
        } else if jsx {
            format!(" style={{{{{style}}}}}")
        } else {
            format!(" style=\"{}\"", html_escape(&style))
        };
        if !style.is_empty() || !href.is_empty() {
            out.push_str(&format!("<{tag}{href}{attr}>"));
        }
        for (i, line) in run.text.split('\n').enumerate() {
            if i > 0 {
                out.push_str(if jsx { "<br />" } else { "<br>" });
            }
            if jsx && (!matches!(node.content, TextContent::Plain(_)) || line.contains(['{', '}']))
            {
                // JSX text is an expression so authored braces cannot become code.
                out.push_str(&format!(
                    "{{{}}}",
                    serde_json::to_string(line).unwrap_or_default()
                ));
            } else {
                out.push_str(&html_escape(line));
            }
        }
        if !style.is_empty() || !href.is_empty() {
            out.push_str(&format!("</{tag}>"));
        }
    }
    out
}

fn style(run: &StyledTextSegment, node: &TextNode, jsx: bool) -> String {
    let mut props: Vec<(&str, String)> = Vec::new();
    if let Some(size) = run.font_size.filter(|s| s.is_finite() && *s > 0.0) {
        props.push((
            if jsx { "fontSize" } else { "font-size" },
            if jsx {
                fmt_num(size as f64)
            } else {
                format!("{}px", fmt_num(size as f64))
            },
        ));
    }
    if let Some(weight) = run.font_weight {
        props.push((
            if jsx { "fontWeight" } else { "font-weight" },
            weight.to_string(),
        ));
    }
    if let Some(family) = &run.font_family {
        props.push((
            if jsx { "fontFamily" } else { "font-family" },
            serde_json::to_string(family).unwrap_or_default(),
        ));
    }
    if let Some(fill) = &run.fill {
        props.push(("color", if jsx { quoted(fill) } else { fill.clone() }));
    }
    if let Some(font_style) = &run.font_style {
        let value = if matches!(font_style, FontStyleKind::Italic) {
            "italic"
        } else {
            "normal"
        };
        props.push((
            if jsx { "fontStyle" } else { "font-style" },
            if jsx { quoted(value) } else { value.into() },
        ));
    }
    let underline = run.underline.unwrap_or(node.underline.unwrap_or(false));
    let strike = run
        .strikethrough
        .unwrap_or(node.strikethrough.unwrap_or(false));
    if underline || strike || run.underline.is_some() || run.strikethrough.is_some() {
        let value = match (underline, strike) {
            (true, true) => "underline line-through",
            (true, false) => "underline",
            (false, true) => "line-through",
            _ => "none",
        };
        props.push((
            if jsx {
                "textDecoration"
            } else {
                "text-decoration"
            },
            if jsx { quoted(value) } else { value.into() },
        ));
    }
    props
        .into_iter()
        .map(|(key, val)| format!("{key}: {val}"))
        .collect::<Vec<_>>()
        .join(if jsx { ", " } else { "; " })
}

fn quoted(value: &str) -> String {
    serde_json::to_string(value).unwrap_or_default()
}

fn safe_link(href: &str) -> bool {
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
