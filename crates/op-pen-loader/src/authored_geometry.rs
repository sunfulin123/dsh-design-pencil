use std::collections::BTreeMap;

use jian_ops_schema::node::base::PenNodeBase;
use jian_ops_schema::node::text::TextNode;
use jian_ops_schema::node::PenNode;
use jian_ops_schema::sizing::{SizeLimits, SizingBehavior};

pub fn rects_for_roots(roots: &[PenNode]) -> BTreeMap<String, [f32; 4]> {
    let mut out = BTreeMap::new();
    for root in roots {
        collect_rect(root, 0.0, 0.0, &mut out);
    }
    out
}

fn collect_rect(
    node: &PenNode,
    parent_x: f32,
    parent_y: f32,
    out: &mut BTreeMap<String, [f32; 4]>,
) {
    let base = base_of(node);
    let x = parent_x + base.x.unwrap_or(0.0) as f32;
    let y = parent_y + base.y.unwrap_or(0.0) as f32;
    let (w, h) = size_of(node);
    out.insert(base.id.clone(), [x, y, w, h]);
    for child in children_of(node) {
        collect_rect(child, x, y, out);
    }
}

fn size_of(node: &PenNode) -> (f32, f32) {
    match node {
        PenNode::Frame(n) => {
            numeric_size(&n.container.width, &n.container.height, &n.container.limits)
        }
        PenNode::Group(n) => {
            numeric_size(&n.container.width, &n.container.height, &n.container.limits)
        }
        PenNode::Rectangle(n) => {
            numeric_size(&n.container.width, &n.container.height, &n.container.limits)
        }
        PenNode::Ellipse(n) => numeric_size(&n.width, &n.height, &n.limits),
        PenNode::Polygon(n) => numeric_size(&n.width, &n.height, &n.limits),
        PenNode::Path(n) => numeric_size(&n.width, &n.height, &n.limits),
        PenNode::Text(n) => text_size(n),
        PenNode::TextInput(n) => numeric_size(&n.width, &n.height, &n.limits),
        PenNode::TextArea(n) => numeric_size(&n.width, &n.height, &n.limits),
        PenNode::Select(n) => numeric_size(&n.width, &n.height, &n.limits),
        PenNode::Switch(n) => numeric_size(&n.width, &n.height, &n.limits),
        PenNode::Checkbox(n) => numeric_size(&n.width, &n.height, &n.limits),
        PenNode::Slider(n) => numeric_size(&n.width, &n.height, &n.limits),
        PenNode::RadioGroup(n) => numeric_size(&n.width, &n.height, &n.limits),
        PenNode::NumberInput(n) => numeric_size(&n.width, &n.height, &n.limits),
        PenNode::Progress(n) => numeric_size(&n.width, &n.height, &n.limits),
        PenNode::Tabs(n) => numeric_size(&n.width, &n.height, &n.limits),
        PenNode::Image(n) => numeric_size(&n.width, &n.height, &n.limits),
        PenNode::IconFont(n) => numeric_size(&n.width, &n.height, &n.limits),
        PenNode::Line(_) => (f32::NAN, f32::NAN),
        PenNode::Ref(_) => (0.0, 0.0),
    }
}

fn text_size(n: &TextNode) -> (f32, f32) {
    let (mut w, mut h) = numeric_size(&n.width, &n.height, &n.limits);
    if w > 0.0 && h > 0.0 {
        return (w, h);
    }
    let text: String = match &n.content {
        jian_ops_schema::node::text::TextContent::Plain(s) => s.clone(),
        jian_ops_schema::node::text::TextContent::Styled(segs) => {
            segs.iter().map(|seg| seg.text.as_str()).collect()
        }
    };
    if text.is_empty() {
        return (w, h);
    }
    let fs = n.font_size.unwrap_or(13.0).max(1.0) as f32;
    let lh = n.layout_line_height_multiplier().unwrap_or(1.2).max(1.0) as f32;
    let line_h = fs * lh;
    let max_chars = text
        .lines()
        .map(|line| line.chars().count())
        .max()
        .unwrap_or(1)
        .max(1) as f32;
    let natural_w = max_chars * fs * 0.65;
    if w <= 0.0 {
        w = natural_w;
    }
    if h <= 0.0 {
        let lines = if w > 0.0 && natural_w > w {
            (natural_w / w).ceil().max(1.0)
        } else {
            text.lines().count().max(1) as f32
        };
        h = lines * line_h;
    }
    (w, h)
}

fn numeric_size(
    w: &Option<SizingBehavior>,
    h: &Option<SizingBehavior>,
    limits: &SizeLimits,
) -> (f32, f32) {
    (
        numeric_or_min(w, limits.min_width),
        numeric_or_min(h, limits.min_height),
    )
}

fn numeric_or_min(value: &Option<SizingBehavior>, min: Option<f64>) -> f32 {
    let min = min.filter(|v| v.is_finite() && *v > 0.0).unwrap_or(0.0) as f32;
    numeric(value).max(min)
}

fn numeric(value: &Option<SizingBehavior>) -> f32 {
    match value {
        Some(SizingBehavior::Number(n)) => *n as f32,
        _ => 0.0,
    }
}

fn children_of(node: &PenNode) -> &[PenNode] {
    match node {
        PenNode::Frame(n) => n.children.as_deref().unwrap_or(&[]),
        PenNode::Group(n) => n.children.as_deref().unwrap_or(&[]),
        PenNode::Rectangle(n) => n.children.as_deref().unwrap_or(&[]),
        PenNode::Tabs(n) => n.children.as_deref().unwrap_or(&[]),
        PenNode::Ref(n) => n.children.as_deref().unwrap_or(&[]),
        _ => &[],
    }
}

fn base_of(node: &PenNode) -> &PenNodeBase {
    match node {
        PenNode::Frame(n) => &n.base,
        PenNode::Group(n) => &n.base,
        PenNode::Rectangle(n) => &n.base,
        PenNode::Ellipse(n) => &n.base,
        PenNode::Line(n) => &n.base,
        PenNode::Polygon(n) => &n.base,
        PenNode::Path(n) => &n.base,
        PenNode::Text(n) => &n.base,
        PenNode::TextInput(n) => &n.base,
        PenNode::TextArea(n) => &n.base,
        PenNode::Select(n) => &n.base,
        PenNode::Switch(n) => &n.base,
        PenNode::Checkbox(n) => &n.base,
        PenNode::Slider(n) => &n.base,
        PenNode::RadioGroup(n) => &n.base,
        PenNode::NumberInput(n) => &n.base,
        PenNode::Progress(n) => &n.base,
        PenNode::Tabs(n) => &n.base,
        PenNode::Image(n) => &n.base,
        PenNode::IconFont(n) => &n.base,
        PenNode::Ref(n) => &n.base,
    }
}
