//! Effective common typography for the current selection, with mixed values omitted.
use super::*;
use jian_ops_schema::node::text::{FontStyleKind as NodeStyle, FontWeight};
use jian_ops_schema::style::FontStyleKind as RunStyle;

#[derive(Debug, Clone, PartialEq)]
pub struct TextSelectionStyle {
    pub family: Option<String>,
    pub size: Option<f32>,
    pub weight: Option<u32>,
    pub italic: Option<bool>,
    pub underline: Option<bool>,
    pub strikethrough: Option<bool>,
    pub fill: Option<String>,
}

fn common<T: Clone + PartialEq>(values: impl Iterator<Item = T>) -> Option<T> {
    let mut values = values;
    let first = values.next()?;
    values.all(|value| value == first).then_some(first)
}

impl EditorState {
    pub fn selected_text_style(&self) -> Option<TextSelectionStyle> {
        let insertion = self.current_text_insertion();
        let range = self.current_text_selection().or_else(|| {
            let caret = insertion.as_ref()?;
            let count = caret.text.chars().count();
            let position = caret.text[..caret.offset].chars().count();
            let start = position.saturating_sub(1).min(count.saturating_sub(1));
            Some(TextSelection {
                node_id: caret.node_id.clone(),
                page_index: caret.page_index,
                text: caret.text.clone(),
                start,
                end: (start + 1).min(count),
            })
        })?;
        let node = crate::walkers::find_node(self.active_children(), &range.node_id)?;
        let PenNode::Text(text) = node else {
            return None;
        };
        if plain_text(&text.content) != range.text {
            return None;
        }
        let base_weight = match text.font_weight.as_ref() {
            Some(FontWeight::Number(weight)) => *weight,
            Some(FontWeight::Keyword(name)) => match name.as_str() {
                "thin" => 100,
                "light" => 300,
                "medium" => 500,
                "semibold" => 600,
                "bold" => 700,
                "black" => 900,
                _ => 400,
            },
            None => 400,
        };
        let base_fill = crate::first_solid_fill_hex(node).map(str::to_owned);
        let source = match &text.content {
            TextContent::Plain(value) => vec![crate::text_design::segment(value)],
            TextContent::Styled(runs) if runs.is_empty() && range.text.is_empty() => {
                vec![crate::text_design::segment("")]
            }
            TextContent::Styled(runs) => runs.clone(),
        };
        let mut offset = 0;
        let runs: Vec<_> = source
            .iter()
            .filter(|run| {
                let end = offset + run.text.chars().count();
                let intersects = (offset < range.end && end > range.start)
                    || (range.text.is_empty() && run.text.is_empty());
                offset = end;
                intersects
            })
            .collect();
        if runs.is_empty() {
            return None;
        }
        let base_family = text.font_family.as_deref().unwrap_or("Inter, sans-serif");
        let base_size = text.font_size.unwrap_or(16.0) as f32;
        let base_italic = matches!(text.font_style, Some(NodeStyle::Italic));
        let mut result = TextSelectionStyle {
            family: common(
                runs.iter()
                    .map(|run| run.font_family.as_deref().unwrap_or(base_family).to_owned()),
            ),
            size: common(runs.iter().map(|run| run.font_size.unwrap_or(base_size))),
            weight: common(
                runs.iter()
                    .map(|run| run.font_weight.unwrap_or(base_weight)),
            ),
            italic: common(runs.iter().map(|run| {
                run.font_style
                    .as_ref()
                    .map_or(base_italic, |style| matches!(style, RunStyle::Italic))
            })),
            underline: common(
                runs.iter()
                    .map(|run| run.underline.unwrap_or(text.underline.unwrap_or(false))),
            ),
            strikethrough: common(runs.iter().map(|run| {
                run.strikethrough
                    .unwrap_or(text.strikethrough.unwrap_or(false))
            })),
            fill: common(
                runs.iter()
                    .map(|run| run.fill.clone().or_else(|| base_fill.clone())),
            )
            .flatten(),
        };
        if let Some(insertion) = insertion {
            let style = insertion.style;
            if let Some(value) = style.font_family {
                result.family = Some(value);
            }
            if let Some(value) = style.font_size {
                result.size = Some(value);
            }
            if let Some(value) = style.font_weight {
                result.weight = Some(value);
            }
            if let Some(value) = style.font_style {
                result.italic = Some(matches!(value, RunStyle::Italic));
            }
            if let Some(value) = style.underline {
                result.underline = Some(value);
            }
            if let Some(value) = style.strikethrough {
                result.strikethrough = Some(value);
            }
            if let Some(value) = style.fill {
                result.fill = Some(value);
            }
        }
        Some(result)
    }
}
