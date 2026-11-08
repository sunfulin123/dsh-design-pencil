use super::{ParagraphStyle, PenNode, TextContent, TextDesignResult, TextNode};
use jian_ops_schema::node::{PenNodeBase, TextAlignVertical, TextGrowth};
use jian_ops_schema::sizing::{SizingBehavior, SizingKeyword};

/// Paragraph/list geometry is represented by ordinary auto-layout frames.
/// Markers occupy their own column, so wrapped lines have a hanging indent.
pub fn paragraph_to_node(template: &TextNode, style: &ParagraphStyle) -> TextDesignResult<PenNode> {
    for value in [style.indent, style.space_before, style.space_after] {
        if !value.is_finite() || value < 0.0 {
            return Err("paragraph indentation and spacing must be finite and non-negative".into());
        }
    }
    if style
        .line_height
        .is_some_and(|v| !v.is_finite() || v <= 0.0 || v > 4.0)
    {
        return Err("lineHeight must be a unitless multiplier in (0,4]".into());
    }
    let marker = match style.list.as_deref() {
        None | Some("none") => None,
        Some("bullet") => Some("•".to_owned()),
        Some("ordered") if style.number > 0 => Some(format!("{}.", style.number)),
        _ => return Err("list must be none, bullet or ordered (positive number)".into()),
    };
    let mut text = template.clone();
    if let Some(value) = style.line_height {
        text.line_height = Some(value);
    }
    if let Some(value) = &style.text_align {
        text.text_align = Some(value.clone());
    }
    if marker.is_none()
        && style.indent == 0.0
        && style.space_before == 0.0
        && style.space_after == 0.0
    {
        return Ok(PenNode::Text(text));
    }
    let mut children = Vec::new();
    if let Some(marker) = marker {
        let mut label = flow_text(&text, &format!("{}__marker", template.base.id));
        label.base.role = Some("list-marker".into());
        let marker_width =
            text.font_size.unwrap_or(16.0) * (marker.chars().count() as f64 * 0.65 + 0.8);
        label.width = Some(SizingBehavior::Number(marker_width));
        label.content = TextContent::Plain(marker);
        children.push(PenNode::Text(label));
    }
    children.push(PenNode::Text(flow_text(
        &text,
        &format!("{}__text", template.base.id),
    )));
    let width = template
        .width
        .clone()
        .unwrap_or(SizingBehavior::Number(400.0));
    let mut base = template.base.clone();
    base.role = Some("paragraph-layout".into());
    frame(
        base,
        children,
        width,
        "horizontal",
        0.0,
        [style.space_before, 0.0, style.space_after, style.indent],
    )
}

pub(super) fn flow_text(template: &TextNode, id: &str) -> TextNode {
    let mut text = template.clone();
    text.base = PenNodeBase {
        id: id.into(),
        name: template.base.name.clone(),
        role: template.base.role.clone(),
        ..Default::default()
    };
    text.width = Some(SizingBehavior::Keyword(SizingKeyword::FillContainer));
    text.height = Some(SizingBehavior::Keyword(SizingKeyword::FitContent));
    text.text_growth = Some(TextGrowth::FixedWidth);
    text.text_align_vertical = Some(TextAlignVertical::Top);
    text
}

pub(super) fn frame(
    base: PenNodeBase,
    children: Vec<PenNode>,
    width: SizingBehavior,
    layout: &str,
    gap: f64,
    padding: [f64; 4],
) -> TextDesignResult<PenNode> {
    let mut value = serde_json::to_value(base).map_err(|e| e.to_string())?;
    let obj = value.as_object_mut().ok_or("invalid node base")?;
    for (key, val) in [
        ("type", serde_json::json!("frame")),
        ("width", serde_json::json!(width)),
        ("height", serde_json::json!("fit_content")),
        ("layout", serde_json::json!(layout)),
        ("gap", serde_json::json!(gap)),
        ("padding", serde_json::json!(padding)),
        ("alignItems", serde_json::json!("start")),
        ("children", serde_json::json!(children)),
    ] {
        obj.insert(key.into(), val);
    }
    serde_json::from_value(value).map_err(|e| e.to_string())
}
