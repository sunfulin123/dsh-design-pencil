//! `Design JSX` deterministic generator — ports OpenPencil's `@open-pencil/design-jsx`
//! export format onto canonical `PenDocument` / `PenNode` trees.
//!
//! Emits `<Frame>`, `<Rectangle>`, `<Ellipse>`, `<Text>`, `<Line>`, `<Polygon>`,
//! `<Path>`, `<Image>`, `<Icon>`, `<Group>`, `<Component>`, or `<Use>` elements
//! with concise layout (`flex="row"|"col"`, `gap`, `p`/`px`/`py`/`pt`…, `justify`,
//! `items`), sizing (`w`, `h`, `"fill"`), appearance (`bg`, `stroke`, `strokeWidth`,
//! `rounded`, `opacity`, `rotate`, `overflow="hidden"`, `shadow`, `blur`), and
//! typography (`size`, `weight`, `font`, `color`, `leading`, `tracking`, `textAlign`).

use crate::{fmt_num, html_escape, node_children, node_hidden, root_nodes, Codegen};
use jian_ops_schema::node::text::FontStyleKind;
use jian_ops_schema::node::{
    AlignItems, CornerRadius, FontWeight, JustifyContent, LayoutMode, NumberOrExpression, Padding,
    PenNode, TextAlign, TextContent,
};
use jian_ops_schema::sizing::{SizingBehavior, SizingKeyword};
use jian_ops_schema::style::{PenEffect, PenFill, StrokeThickness};
use jian_ops_schema::PenDocument;
use op_editor_core::pen_node_ext::PenNodeExt;

/// Deterministic `Design JSX` generator.
pub struct DesignJsx;

impl Codegen for DesignJsx {
    fn target_label(&self) -> &'static str {
        "design-jsx"
    }

    fn generate(&self, doc: &PenDocument) -> String {
        generate_design_jsx_for_nodes(doc, root_nodes(doc))
    }
}

/// Generate `Design JSX` for an explicit slice of root/selected `PenNode`s.
pub fn generate_design_jsx_for_nodes(doc: &PenDocument, nodes: &[PenNode]) -> String {
    let refs: Vec<&PenNode> = nodes.iter().collect();
    generate_design_jsx_for_node_refs(doc, &refs)
}

/// Generate `Design JSX` for the selected node IDs on the active page (or the
/// active page's root children when `selected_ids` is empty).
pub fn generate_design_jsx_selection(
    doc: &PenDocument,
    page_roots: &[PenNode],
    selected_ids: &[String],
) -> String {
    let targets = resolve_target_nodes(page_roots, selected_ids);
    generate_design_jsx_for_node_refs(doc, &targets)
}

pub(crate) fn resolve_target_nodes<'a>(
    page_roots: &'a [PenNode],
    selected_ids: &[String],
) -> Vec<&'a PenNode> {
    if selected_ids.is_empty() {
        return page_roots.iter().collect();
    }
    let mut found = Vec::new();
    for id in selected_ids {
        let node_id = op_editor_core::NodeId::new(id.clone());
        if let Some(node) = op_editor_core::walkers::find_node(page_roots, &node_id) {
            found.push(node);
        }
    }
    if found.is_empty() {
        page_roots.iter().collect()
    } else {
        found
    }
}

pub fn generate_design_jsx_for_node_refs(_doc: &PenDocument, nodes: &[&PenNode]) -> String {
    let mut blocks = Vec::new();
    for node in nodes {
        let mut out = String::new();
        emit_design_jsx_node(_doc, node, None, 0, &mut out);
        let trimmed = out.trim_end();
        if !trimmed.is_empty() {
            blocks.push(trimmed.to_string());
        }
    }
    if blocks.is_empty() {
        return String::new();
    }
    let mut result = blocks.join("\n\n");
    result.push('\n');
    result
}

fn tag_for_node(node: &PenNode) -> &'static str {
    match node {
        PenNode::Frame(f) => {
            if f.reusable == Some(true) {
                "Component"
            } else {
                "Frame"
            }
        }
        PenNode::Group(_) => "Group",
        PenNode::Rectangle(_) => "Rectangle",
        PenNode::Ellipse(_) => "Ellipse",
        PenNode::Line(_) => "Line",
        PenNode::Polygon(_) => "Polygon",
        PenNode::Path(_) => "Path",
        PenNode::Text(_) => "Text",
        PenNode::Image(_) => "Image",
        PenNode::IconFont(_) => "Icon",
        PenNode::Ref(_) => "Use",
        PenNode::TextInput(_) => "TextInput",
        PenNode::TextArea(_) => "TextArea",
        PenNode::Select(_) => "Select",
        PenNode::Switch(_) => "Switch",
        PenNode::Checkbox(_) => "Checkbox",
        PenNode::Slider(_) => "Slider",
        PenNode::RadioGroup(_) => "RadioGroup",
        PenNode::NumberInput(_) => "NumberInput",
        PenNode::Progress(_) => "Progress",
        PenNode::Tabs(_) => "Tabs",
    }
}

fn parent_is_flex(parent: Option<&PenNode>) -> bool {
    let Some(p) = parent else {
        return false;
    };
    p.is_auto_layout_container()
}

fn format_jsx_str(val: &str) -> String {
    format!("\"{}\"", html_escape(val))
}

fn format_jsx_num(val: f64) -> String {
    format!("{{{}}}", fmt_num(val))
}

fn push_sizing_prop(props: &mut Vec<(String, String)>, key: &str, sizing: &Option<SizingBehavior>) {
    match sizing {
        Some(SizingBehavior::Number(n)) if *n > 0.0 => {
            props.push((key.to_string(), format_jsx_num(*n)));
        }
        Some(SizingBehavior::Keyword(SizingKeyword::FillContainer)) => {
            props.push((key.to_string(), "\"fill\"".to_string()));
        }
        Some(SizingBehavior::Keyword(SizingKeyword::FitContent)) => {
            props.push((key.to_string(), "\"hug\"".to_string()));
        }
        Some(SizingBehavior::Expression(expr)) => {
            props.push((key.to_string(), format_jsx_str(expr)));
        }
        _ => {}
    }
}

fn push_padding_props(props: &mut Vec<(String, String)>, padding: &Option<Padding>) {
    match padding {
        Some(Padding::Uniform(v)) if *v > 0.0 => {
            props.push(("p".into(), format_jsx_num(*v)));
        }
        Some(Padding::XY([py, px])) => {
            if *py > 0.0 && (*py - *px).abs() < f64::EPSILON {
                props.push(("p".into(), format_jsx_num(*py)));
            } else {
                if *py > 0.0 {
                    props.push(("py".into(), format_jsx_num(*py)));
                }
                if *px > 0.0 {
                    props.push(("px".into(), format_jsx_num(*px)));
                }
            }
        }
        Some(Padding::LtrB([pt, pr, pb, pl])) => {
            if (*pt - *pr).abs() < f64::EPSILON
                && (*pr - *pb).abs() < f64::EPSILON
                && (*pb - *pl).abs() < f64::EPSILON
            {
                if *pt > 0.0 {
                    props.push(("p".into(), format_jsx_num(*pt)));
                }
            } else if (*pt - *pb).abs() < f64::EPSILON && (*pl - *pr).abs() < f64::EPSILON {
                if *pt > 0.0 {
                    props.push(("py".into(), format_jsx_num(*pt)));
                }
                if *pl > 0.0 {
                    props.push(("px".into(), format_jsx_num(*pl)));
                }
            } else {
                if *pt > 0.0 {
                    props.push(("pt".into(), format_jsx_num(*pt)));
                }
                if *pr > 0.0 {
                    props.push(("pr".into(), format_jsx_num(*pr)));
                }
                if *pb > 0.0 {
                    props.push(("pb".into(), format_jsx_num(*pb)));
                }
                if *pl > 0.0 {
                    props.push(("pl".into(), format_jsx_num(*pl)));
                }
            }
        }
        Some(Padding::Expression(expr)) => {
            props.push(("p".into(), format_jsx_str(expr)));
        }
        _ => {}
    }
}

fn push_corner_radius_props(props: &mut Vec<(String, String)>, radius: &Option<CornerRadius>) {
    match radius {
        Some(CornerRadius::Uniform(r)) if *r > 0.0 => {
            props.push(("rounded".into(), format_jsx_num(*r)));
        }
        Some(CornerRadius::PerCorner([tl, tr, br, bl])) => {
            if (*tl - *tr).abs() < f64::EPSILON
                && (*tr - *br).abs() < f64::EPSILON
                && (*br - *bl).abs() < f64::EPSILON
            {
                if *tl > 0.0 {
                    props.push(("rounded".into(), format_jsx_num(*tl)));
                }
            } else {
                if *tl > 0.0 {
                    props.push(("roundedTL".into(), format_jsx_num(*tl)));
                }
                if *tr > 0.0 {
                    props.push(("roundedTR".into(), format_jsx_num(*tr)));
                }
                if *br > 0.0 {
                    props.push(("roundedBR".into(), format_jsx_num(*br)));
                }
                if *bl > 0.0 {
                    props.push(("roundedBL".into(), format_jsx_num(*bl)));
                }
            }
        }
        _ => {}
    }
}

fn push_fill_props(props: &mut Vec<(String, String)>, key: &str, fills: Option<&Vec<PenFill>>) {
    let Some(fills) = fills else {
        return;
    };
    for fill in fills {
        match fill {
            PenFill::Solid(s) => {
                props.push((key.to_string(), format_jsx_str(&s.color)));
                return;
            }
            PenFill::LinearGradient(g) => {
                let stops: Vec<String> = g
                    .stops
                    .iter()
                    .map(|st| format!("{} {}%", st.color, fmt_num((st.offset * 100.0) as f64)))
                    .collect();
                let deg = g.angle.unwrap_or(180.0) as f64;
                props.push((
                    key.to_string(),
                    format_jsx_str(&format!(
                        "linear-gradient({}deg, {})",
                        fmt_num(deg),
                        stops.join(", ")
                    )),
                ));
                return;
            }
            PenFill::RadialGradient(g) => {
                let stops: Vec<String> = g
                    .stops
                    .iter()
                    .map(|st| format!("{} {}%", st.color, fmt_num((st.offset * 100.0) as f64)))
                    .collect();
                props.push((
                    key.to_string(),
                    format_jsx_str(&format!("radial-gradient({})", stops.join(", "))),
                ));
                return;
            }
            PenFill::Image(img) => {
                props.push(("bgImage".to_string(), format_jsx_str(img.url.as_ref())));
                return;
            }
            _ => {}
        }
    }
}

fn push_stroke_props(
    props: &mut Vec<(String, String)>,
    stroke: Option<&jian_ops_schema::style::PenStroke>,
) {
    let Some(stroke) = stroke else {
        return;
    };
    if let Some(fills) = stroke.fill.as_ref() {
        for f in fills {
            if let PenFill::Solid(s) = f {
                props.push(("stroke".into(), format_jsx_str(&s.color)));
                break;
            }
        }
    }
    match &stroke.thickness {
        StrokeThickness::Uniform(w) if *w > 0.0 => {
            props.push(("strokeWidth".into(), format_jsx_num(*w as f64)));
        }
        StrokeThickness::PerSide([t, r, b, l]) => {
            if *t > 0.0 {
                props.push(("strokeTop".into(), format_jsx_num(*t as f64)));
            }
            if *r > 0.0 {
                props.push(("strokeRight".into(), format_jsx_num(*r as f64)));
            }
            if *b > 0.0 {
                props.push(("strokeBottom".into(), format_jsx_num(*b as f64)));
            }
            if *l > 0.0 {
                props.push(("strokeLeft".into(), format_jsx_num(*l as f64)));
            }
        }
        StrokeThickness::Sided(s) => {
            if let Some(t) = s.top.filter(|v| *v > 0.0) {
                props.push(("strokeTop".into(), format_jsx_num(t as f64)));
            }
            if let Some(r) = s.right.filter(|v| *v > 0.0) {
                props.push(("strokeRight".into(), format_jsx_num(r as f64)));
            }
            if let Some(b) = s.bottom.filter(|v| *v > 0.0) {
                props.push(("strokeBottom".into(), format_jsx_num(b as f64)));
            }
            if let Some(l) = s.left.filter(|v| *v > 0.0) {
                props.push(("strokeLeft".into(), format_jsx_num(l as f64)));
            }
        }
        _ => {}
    }
}

fn push_effect_props(props: &mut Vec<(String, String)>, effects: Option<&Vec<PenEffect>>) {
    let Some(effects) = effects else {
        return;
    };
    for effect in effects {
        match effect {
            PenEffect::Shadow(s) if s.visible != Some(false) => {
                let prefix = if s.inner == Some(true) { "inset " } else { "" };
                let val = format!(
                    "{}{}px {}px {}px {}px {}",
                    prefix,
                    fmt_num(s.offset_x as f64),
                    fmt_num(s.offset_y as f64),
                    fmt_num(s.blur as f64),
                    fmt_num(s.spread as f64),
                    s.color
                );
                props.push(("shadow".into(), format_jsx_str(&val)));
            }
            PenEffect::Blur(b) if b.visible != Some(false) && b.radius > 0.0 => {
                props.push(("blur".into(), format_jsx_num(b.radius as f64)));
            }
            PenEffect::BackgroundBlur(b) if b.visible != Some(false) && b.radius > 0.0 => {
                props.push(("backdropBlur".into(), format_jsx_num(b.radius as f64)));
            }
            _ => {}
        }
    }
}

fn push_container_props(
    props: &mut Vec<(String, String)>,
    container: &jian_ops_schema::node::ContainerProps,
) {
    match container.layout {
        Some(LayoutMode::Horizontal) => props.push(("flex".into(), "\"row\"".into())),
        Some(LayoutMode::Vertical) => props.push(("flex".into(), "\"col\"".into())),
        _ => {}
    }
    push_sizing_prop(props, "w", &container.width);
    push_sizing_prop(props, "h", &container.height);
    if let Some(min_w) = container.limits.min_width {
        props.push(("minW".into(), format_jsx_num(min_w)));
    }
    if let Some(max_w) = container.limits.max_width {
        props.push(("maxW".into(), format_jsx_num(max_w)));
    }
    if let Some(min_h) = container.limits.min_height {
        props.push(("minH".into(), format_jsx_num(min_h)));
    }
    if let Some(max_h) = container.limits.max_height {
        props.push(("maxH".into(), format_jsx_num(max_h)));
    }
    match &container.gap {
        Some(NumberOrExpression::Number(g)) if *g > 0.0 => {
            props.push(("gap".into(), format_jsx_num(*g)));
        }
        Some(NumberOrExpression::Expression(expr)) => {
            props.push(("gap".into(), format_jsx_str(expr)));
        }
        _ => {}
    }
    push_padding_props(props, &container.padding);
    match container.justify_content {
        Some(JustifyContent::Center) => props.push(("justify".into(), "\"center\"".into())),
        Some(JustifyContent::End) => props.push(("justify".into(), "\"end\"".into())),
        Some(JustifyContent::SpaceBetween) => props.push(("justify".into(), "\"between\"".into())),
        Some(JustifyContent::SpaceAround) => props.push(("justify".into(), "\"around\"".into())),
        _ => {}
    }
    match container.align_items {
        Some(AlignItems::Center) => props.push(("items".into(), "\"center\"".into())),
        Some(AlignItems::End) => props.push(("items".into(), "\"end\"".into())),
        Some(AlignItems::Stretch) => props.push(("items".into(), "\"stretch\"".into())),
        _ => {}
    }
    push_fill_props(props, "bg", container.fill.as_ref());
    push_stroke_props(props, container.stroke.as_ref());
    push_corner_radius_props(props, &container.corner_radius);
    if container.clip_content == Some(true) {
        props.push(("overflow".into(), "\"hidden\"".into()));
    }
    push_effect_props(props, container.effects.as_ref());
}

fn emit_design_jsx_node(
    doc: &PenDocument,
    node: &PenNode,
    parent: Option<&PenNode>,
    depth: usize,
    out: &mut String,
) {
    let indent = "  ".repeat(depth);
    let tag = tag_for_node(node);
    let base = node.base();
    let mut props: Vec<(String, String)> = Vec::new();

    if let Some(name) = base.name.as_deref().filter(|n| !n.trim().is_empty()) {
        props.push(("name".into(), format_jsx_str(name)));
    }
    if let Some(role) = base.role.as_deref().filter(|r| !r.trim().is_empty()) {
        props.push(("role".into(), format_jsx_str(role)));
    }
    if let Some(explain) = base
        .explain
        .as_deref()
        .or_else(|| {
            op_editor_core::command_node_attrs::node_semantics(node)
                .and_then(|s| s.ai_description.as_deref())
        })
        .filter(|e| !e.trim().is_empty())
    {
        props.push(("explain".into(), format_jsx_str(explain)));
    }
    if let Some(a11y_label) = op_editor_core::command_node_attrs::node_semantics(node)
        .and_then(|s| s.label.as_deref())
        .filter(|l| !l.trim().is_empty())
    {
        props.push(("ariaLabel".into(), format_jsx_str(a11y_label)));
    }
    if let Some(screen) = node.screen().filter(|s| !s.trim().is_empty()) {
        props.push(("screen".into(), format_jsx_str(screen)));
    }
    if node_hidden(node) {
        props.push(("visible".into(), "{false}".into()));
    }
    if !parent_is_flex(parent) {
        if let Some(x) = base.x.filter(|v| v.abs() > f64::EPSILON) {
            props.push(("x".into(), format_jsx_num(x)));
        }
        if let Some(y) = base.y.filter(|v| v.abs() > f64::EPSILON) {
            props.push(("y".into(), format_jsx_num(y)));
        }
    }
    if let Some(rot) = base.rotation.filter(|v| v.abs() > f64::EPSILON) {
        props.push(("rotate".into(), format_jsx_num(rot)));
    }
    match &base.opacity {
        Some(NumberOrExpression::Number(op)) if (*op - 1.0).abs() > f64::EPSILON => {
            props.push(("opacity".into(), format_jsx_num(*op)));
        }
        Some(NumberOrExpression::Expression(expr)) => {
            props.push(("opacity".into(), format_jsx_str(expr)));
        }
        _ => {}
    }

    match node {
        PenNode::Frame(n) => push_container_props(&mut props, &n.container),
        PenNode::Group(n) => push_container_props(&mut props, &n.container),
        PenNode::Rectangle(n) => push_container_props(&mut props, &n.container),
        PenNode::Ellipse(n) => {
            push_sizing_prop(&mut props, "w", &n.width);
            push_sizing_prop(&mut props, "h", &n.height);
            push_fill_props(&mut props, "bg", n.fill.as_ref());
            push_stroke_props(&mut props, n.stroke.as_ref());
            push_effect_props(&mut props, n.effects.as_ref());
        }
        PenNode::Polygon(n) => {
            push_sizing_prop(&mut props, "w", &n.width);
            push_sizing_prop(&mut props, "h", &n.height);
            if n.polygon_count > 0 {
                props.push(("points".into(), format_jsx_num(n.polygon_count as f64)));
            }
            push_fill_props(&mut props, "bg", n.fill.as_ref());
            push_stroke_props(&mut props, n.stroke.as_ref());
        }
        PenNode::Line(n) => {
            if let Some(x2) = n.x2 {
                props.push(("x2".into(), format_jsx_num(x2)));
            }
            if let Some(y2) = n.y2 {
                props.push(("y2".into(), format_jsx_num(y2)));
            }
            push_stroke_props(&mut props, n.stroke.as_ref());
        }
        PenNode::Path(n) => {
            push_sizing_prop(&mut props, "w", &n.width);
            push_sizing_prop(&mut props, "h", &n.height);
            if let Some(icon_id) = n.icon_id.as_deref() {
                props.push(("icon".into(), format_jsx_str(icon_id)));
            }
            if let Some(d) = n.d.as_deref() {
                props.push(("d".into(), format_jsx_str(d)));
            }
            push_fill_props(&mut props, "fill", n.fill.as_ref());
            push_stroke_props(&mut props, n.stroke.as_ref());
        }
        PenNode::IconFont(n) => {
            props.push(("name".into(), format_jsx_str(&n.icon_font_name)));
            push_sizing_prop(&mut props, "w", &n.width);
            push_sizing_prop(&mut props, "h", &n.height);
            push_fill_props(&mut props, "color", n.fill.as_ref());
        }
        PenNode::Image(n) => {
            props.push(("src".into(), format_jsx_str(n.src.as_ref())));
            push_sizing_prop(&mut props, "w", &n.width);
            push_sizing_prop(&mut props, "h", &n.height);
            push_corner_radius_props(&mut props, &n.corner_radius);
        }
        PenNode::Ref(n) => {
            props.push(("of".into(), format_jsx_str(&n.target)));
            if let Some(w) = node.width_px() {
                props.push(("w".into(), format_jsx_num(w)));
            }
            if let Some(h) = node.height_px() {
                props.push(("h".into(), format_jsx_num(h)));
            }
        }
        PenNode::Text(n) => {
            push_sizing_prop(&mut props, "w", &n.width);
            push_sizing_prop(&mut props, "h", &n.height);
            if let Some(font) = n.font_family.as_deref() {
                props.push(("font".into(), format_jsx_str(font)));
            }
            if let Some(size) = n.font_size {
                props.push(("size".into(), format_jsx_num(size)));
            }
            match &n.font_weight {
                Some(FontWeight::Number(w)) if *w != 400 => {
                    props.push(("weight".into(), format_jsx_num(*w as f64)));
                }
                Some(FontWeight::Keyword(k)) if k != "normal" && k != "regular" => {
                    props.push(("weight".into(), format_jsx_str(k)));
                }
                _ => {}
            }
            if matches!(n.font_style, Some(FontStyleKind::Italic)) {
                props.push(("italic".into(), "{true}".into()));
            }
            if let Some(lh) = n.line_height {
                props.push(("leading".into(), format_jsx_num(lh)));
            }
            if let Some(ls) = n.letter_spacing.filter(|v| v.abs() > f64::EPSILON) {
                props.push(("tracking".into(), format_jsx_num(ls)));
            }
            match n.text_align {
                Some(TextAlign::Center) => props.push(("textAlign".into(), "\"center\"".into())),
                Some(TextAlign::Right) => props.push(("textAlign".into(), "\"right\"".into())),
                Some(TextAlign::Justify) => props.push(("textAlign".into(), "\"justify\"".into())),
                _ => {}
            }
            push_fill_props(&mut props, "color", n.fill.as_ref());
        }
        _ => {
            if let Some(w) = node.width_px() {
                props.push(("w".into(), format_jsx_num(w)));
            }
            if let Some(h) = node.height_px() {
                props.push(("h".into(), format_jsx_num(h)));
            }
        }
    }

    let attr_str = if props.is_empty() {
        String::new()
    } else {
        let joined: Vec<String> = props.into_iter().map(|(k, v)| format!("{k}={v}")).collect();
        format!(" {}", joined.join(" "))
    };

    if let PenNode::Text(text_node) = node {
        let content = match &text_node.content {
            TextContent::Plain(s) => html_escape(s),
            TextContent::Styled(segs) => segs
                .iter()
                .map(|seg| html_escape(&seg.text))
                .collect::<String>(),
        };
        if content.is_empty() {
            out.push_str(&format!("{indent}<{tag}{attr_str} />\n"));
        } else {
            out.push_str(&format!("{indent}<{tag}{attr_str}>{content}</{tag}>\n"));
        }
        return;
    }

    let children = node_children(node);
    if children.is_empty() {
        out.push_str(&format!("{indent}<{tag}{attr_str} />\n"));
    } else {
        out.push_str(&format!("{indent}<{tag}{attr_str}>\n"));
        for child in children {
            emit_design_jsx_node(doc, child, Some(node), depth + 1, out);
        }
        out.push_str(&format!("{indent}</{tag}>\n"));
    }
}
