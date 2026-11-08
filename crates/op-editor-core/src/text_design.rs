//! Rich text operations on the existing styled-segment and auto-layout model.
//!
//! A single inline Markdown paragraph preserves the original Text node.
//! Block Markdown lowers to an editable vertical frame: ordinary text children
//! for headings/paragraphs/code, horizontal marker/body rows for lists and quotes.
//! No Markdown-only renderer, document variant or metadata-backed layout exists.
//! Generated paragraph frames use the `paragraph-layout` role: inspectors can
//! edit their text body and rebuild spacing/list geometry without nesting frames.
//! Supported inline syntax: bold, italic, strikethrough, code, escaped punctuation
//! and links. Block syntax: ATX headings, paragraphs, hard breaks, ordered and
//! unordered lists (two-space indentation), quotes and fenced code. Tables,
//! embedded HTML/images and full CommonMark delimiter rules are not supported.
//!
//! Range offsets count Unicode scalar values. Supported range overrides are
//! family, size, weight, italic/normal, hex fill, underline, strike and safe
//! hyperlinks. Families and mixed-size wrapping survive the paint scene.
use jian_ops_schema::node::{PenNode, TextContent, TextNode};
use jian_ops_schema::style::{FontStyleKind, StyledTextSegment};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct TextRangeStyle {
    pub font_family: Option<String>,
    pub font_size: Option<f32>,
    pub font_weight: Option<u32>,
    pub font_style: Option<FontStyleKind>,
    pub fill: Option<String>,
    pub underline: Option<bool>,
    pub strikethrough: Option<bool>,
    pub href: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ParagraphStyle {
    pub line_height: Option<f64>,
    pub text_align: Option<jian_ops_schema::node::TextAlign>,
    #[serde(default)]
    pub indent: f64,
    #[serde(default)]
    pub space_before: f64,
    #[serde(default)]
    pub space_after: f64,
    pub list: Option<String>,
    #[serde(default = "one")]
    pub number: u32,
}

fn one() -> u32 {
    1
}

impl Default for ParagraphStyle {
    fn default() -> Self {
        Self {
            line_height: None,
            text_align: None,
            indent: 0.0,
            space_before: 0.0,
            space_after: 0.0,
            list: None,
            number: 1,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct MarkdownOptions {
    #[serde(default = "default_width")]
    pub width: f64,
    #[serde(default = "default_gap")]
    pub paragraph_spacing: f64,
    #[serde(default = "default_indent")]
    pub list_indent: f64,
}

fn default_width() -> f64 {
    400.0
}
fn default_gap() -> f64 {
    8.0
}
fn default_indent() -> f64 {
    24.0
}
impl Default for MarkdownOptions {
    fn default() -> Self {
        Self {
            width: default_width(),
            paragraph_spacing: default_gap(),
            list_indent: default_indent(),
        }
    }
}

pub type TextDesignResult<T> = Result<T, String>;

#[path = "text_markdown.rs"]
mod text_markdown;
#[path = "text_paragraph.rs"]
mod text_paragraph;
#[path = "text_range.rs"]
mod text_range;

pub use text_markdown::markdown_to_node;
pub use text_paragraph::paragraph_to_node;
pub use text_range::{safe_link, styled_range};

pub fn plain_text(content: &TextContent) -> String {
    match content {
        TextContent::Plain(text) => text.clone(),
        TextContent::Styled(runs) => runs.iter().map(|r| r.text.as_str()).collect(),
    }
}

pub fn segment(text: &str) -> StyledTextSegment {
    StyledTextSegment {
        text: text.into(),
        font_family: None,
        font_size: None,
        font_weight: None,
        font_style: None,
        fill: None,
        underline: None,
        strikethrough: None,
        href: None,
    }
}
