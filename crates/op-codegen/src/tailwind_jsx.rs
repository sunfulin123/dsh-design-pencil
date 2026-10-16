//! `Tailwind JSX` deterministic generator — ports OpenPencil's `@open-pencil/dom-css`
//! Tailwind JSX export onto canonical `PenDocument` / `PenNode` trees.
//!
//! Emits semantic JSX (`<div>`, `<p>`, `<header>`, `<nav>`, `<main>`, `<section>`,
//! `<article>`, `<footer>`, `<button>`, `<img>`, `<svg>`, etc.) with accurate
//! Tailwind CSS v4 utility classes (`flex`, `flex-col`, `gap-[...]`, `p-[...]`,
//! `bg-[...]`, `text-[...]`, `rounded-[...]`, `border`, `shadow-[...]`, etc.)
//! and `data-name` attributes matching `open-pencil`.

use crate::design_jsx::resolve_target_nodes;
use crate::{fmt_num, html_escape, node_children, node_hidden, root_nodes, Codegen};
use jian_ops_schema::node::text::FontStyleKind;
use jian_ops_schema::node::{
    AlignItems, CornerRadius, FontWeight, ImageFitMode, JustifyContent, LayoutMode,
    NumberOrExpression, Padding, PenNode, TextAlign, TextContent,
};
use jian_ops_schema::sizing::{SizingBehavior, SizingKeyword};
use jian_ops_schema::style::{PenEffect, PenFill, StrokeThickness};
use jian_ops_schema::PenDocument;
use op_editor_core::pen_node_ext::PenNodeExt;

/// Deterministic `Tailwind JSX` generator.
pub struct TailwindJsx;

impl Codegen for TailwindJsx {
    fn target_label(&self) -> &'static str {
        "tailwind-jsx"
    }

    fn generate(&self, doc: &PenDocument) -> String {
        generate_tailwind_jsx_for_nodes(doc, root_nodes(doc))
    }
}

/// Generate `Tailwind JSX` for an explicit slice of `PenNode`s.
pub fn generate_tailwind_jsx_for_nodes(doc: &PenDocument, nodes: &[PenNode]) -> String {
    let refs: Vec<&PenNode> = nodes.iter().collect();
    generate_tailwind_jsx_for_node_refs(doc, &refs)
}

/// Generate `Tailwind JSX` for selected node IDs (or active page roots when empty).
pub fn generate_tailwind_jsx_selection(
    doc: &PenDocument,
    page_roots: &[PenNode],
    selected_ids: &[String],
) -> String {
    let targets = resolve_target_nodes(page_roots, selected_ids);
    generate_tailwind_jsx_for_node_refs(doc, &targets)
}

pub fn generate_tailwind_jsx_for_node_refs(doc: &PenDocument, nodes: &[&PenNode]) -> String {
    let mut blocks = Vec::new();
    for node in nodes {
        let mut out = String::new();
        emit_tailwind_jsx_node(doc, node, None, 0, &mut out);
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

pub(crate) fn semantic_html_tag(node: &PenNode) -> &'static str {
    if matches!(node, PenNode::Text(_)) {
        return "p";
    }
    if matches!(node, PenNode::Image(_)) {
        return "img";
    }
    if matches!(
        node,
        PenNode::Path(_) | PenNode::IconFont(_) | PenNode::Polygon(_) | PenNode::Line(_)
    ) {
        return "svg";
    }
    match node.base().role.as_deref() {
        Some("navbar" | "header") => "header",
        Some("nav-links" | "navigation" | "sidebar" | "bottom-nav" | "tab-bar") => "nav",
        Some("nav-link") => "a",
        Some("button" | "icon-button" | "cta" | "chip" | "pill" | "badge-button") => "button",
        Some("section" | "hero" | "feature-grid" | "pricing" | "cta-section" | "faq") => "section",
        Some("card" | "stat-card" | "pricing-card" | "testimonial-card") => "article",
        Some("footer") => "footer",
        Some("main") => "main",
        Some("aside") => "aside",
        _ => "div",
    }
}

fn color_token_or_arbitrary(raw: &str, prefix: &str) -> String {
    let t = raw.trim();
    if let Some(var_name) = t.strip_prefix('$') {
        let css_var = if var_name.starts_with("--") {
            var_name.to_string()
        } else {
            format!("--{var_name}")
        };
        return format!("{prefix}-[var({css_var})]");
    }
    format!("{prefix}-[{}]", t.replace(' ', "_"))
}

fn px_utility(prefix: &str, v: f64) -> String {
    if v.abs() < f64::EPSILON {
        return format!("{prefix}-0");
    }
    format!("{prefix}-[{}px]", fmt_num(v))
}

fn push_sizing_classes(
    classes: &mut Vec<String>,
    width: &Option<SizingBehavior>,
    height: &Option<SizingBehavior>,
    parent: Option<&PenNode>,
    is_text: bool,
) {
    let parent_layout = parent.and_then(|p| match p {
        PenNode::Frame(f) => f.container.layout.clone(),
        PenNode::Group(g) => g.container.layout.clone(),
        PenNode::Rectangle(r) => r.container.layout.clone(),
        _ => None,
    });
    match width {
        Some(SizingBehavior::Keyword(SizingKeyword::FillContainer)) => {
            if matches!(parent_layout, Some(LayoutMode::Horizontal)) {
                classes.push("flex-1".into());
                classes.push("min-w-0".into());
            } else {
                classes.push("w-full".into());
            }
        }
        Some(SizingBehavior::Keyword(SizingKeyword::FitContent)) => {
            if !is_text {
                classes.push("w-fit".into());
            }
        }
        Some(SizingBehavior::Number(w)) if *w > 0.0 => {
            classes.push(px_utility("w", *w));
        }
        Some(SizingBehavior::Expression(expr)) => {
            classes.push(color_token_or_arbitrary(expr, "w"));
        }
        _ => {}
    }

    match height {
        Some(SizingBehavior::Keyword(SizingKeyword::FillContainer)) => {
            if matches!(parent_layout, Some(LayoutMode::Vertical)) {
                classes.push("flex-1".into());
                classes.push("min-h-0".into());
            } else {
                classes.push("h-full".into());
            }
        }
        Some(SizingBehavior::Keyword(SizingKeyword::FitContent)) => {
            if !is_text {
                classes.push("h-fit".into());
            }
        }
        Some(SizingBehavior::Number(h)) if *h > 0.0 => {
            classes.push(px_utility("h", *h));
        }
        Some(SizingBehavior::Expression(expr)) => {
            classes.push(color_token_or_arbitrary(expr, "h"));
        }
        _ => {}
    }
}

fn push_padding_classes(classes: &mut Vec<String>, padding: &Option<Padding>) {
    match padding {
        Some(Padding::Uniform(v)) if *v > 0.0 => {
            classes.push(px_utility("p", *v));
        }
        Some(Padding::XY([py, px])) => {
            if *py > 0.0 && (*py - *px).abs() < f64::EPSILON {
                classes.push(px_utility("p", *py));
            } else {
                if *py > 0.0 {
                    classes.push(px_utility("py", *py));
                }
                if *px > 0.0 {
                    classes.push(px_utility("px", *px));
                }
            }
        }
        Some(Padding::LtrB([pt, pr, pb, pl])) => {
            if (*pt - *pr).abs() < f64::EPSILON
                && (*pr - *pb).abs() < f64::EPSILON
                && (*pb - *pl).abs() < f64::EPSILON
            {
                if *pt > 0.0 {
                    classes.push(px_utility("p", *pt));
                }
            } else if (*pt - *pb).abs() < f64::EPSILON && (*pl - *pr).abs() < f64::EPSILON {
                if *pt > 0.0 {
                    classes.push(px_utility("py", *pt));
                }
                if *pl > 0.0 {
                    classes.push(px_utility("px", *pl));
                }
            } else {
                if *pt > 0.0 {
                    classes.push(px_utility("pt", *pt));
                }
                if *pr > 0.0 {
                    classes.push(px_utility("pr", *pr));
                }
                if *pb > 0.0 {
                    classes.push(px_utility("pb", *pb));
                }
                if *pl > 0.0 {
                    classes.push(px_utility("pl", *pl));
                }
            }
        }
        Some(Padding::Expression(expr)) => {
            classes.push(color_token_or_arbitrary(expr, "p"));
        }
        _ => {}
    }
}

fn push_corner_classes(classes: &mut Vec<String>, radius: &Option<CornerRadius>) {
    match radius {
        Some(CornerRadius::Uniform(r)) if *r > 0.0 => {
            if *r >= 999.0 {
                classes.push("rounded-full".into());
            } else {
                classes.push(px_utility("rounded", *r));
            }
        }
        Some(CornerRadius::PerCorner([tl, tr, br, bl])) => {
            if (*tl - *tr).abs() < f64::EPSILON
                && (*tr - *br).abs() < f64::EPSILON
                && (*br - *bl).abs() < f64::EPSILON
            {
                if *tl > 0.0 {
                    classes.push(px_utility("rounded", *tl));
                }
            } else {
                if *tl > 0.0 {
                    classes.push(px_utility("rounded-tl", *tl));
                }
                if *tr > 0.0 {
                    classes.push(px_utility("rounded-tr", *tr));
                }
                if *br > 0.0 {
                    classes.push(px_utility("rounded-br", *br));
                }
                if *bl > 0.0 {
                    classes.push(px_utility("rounded-bl", *bl));
                }
            }
        }
        _ => {}
    }
}

fn push_fill_classes(classes: &mut Vec<String>, fills: Option<&Vec<PenFill>>, is_text: bool) {
    let Some(fills) = fills else {
        return;
    };
    let prefix = if is_text { "text" } else { "bg" };
    for fill in fills {
        match fill {
            PenFill::Solid(s) => {
                classes.push(color_token_or_arbitrary(&s.color, prefix));
                return;
            }
            PenFill::LinearGradient(g) => {
                let stops: Vec<String> = g
                    .stops
                    .iter()
                    .map(|st| {
                        format!(
                            "{}_{}%",
                            st.color.replace(' ', ""),
                            fmt_num((st.offset * 100.0) as f64)
                        )
                    })
                    .collect();
                let deg = g.angle.unwrap_or(180.0) as f64;
                classes.push(format!(
                    "bg-[linear-gradient({}deg,{})]",
                    fmt_num(deg),
                    stops.join(",")
                ));
                return;
            }
            _ => {}
        }
    }
}

fn push_stroke_classes(
    classes: &mut Vec<String>,
    stroke: Option<&jian_ops_schema::style::PenStroke>,
) {
    let Some(stroke) = stroke else {
        return;
    };
    match &stroke.thickness {
        StrokeThickness::Uniform(w) if *w > 0.0 => {
            if (*w - 1.0).abs() < f32::EPSILON {
                classes.push("border".into());
            } else {
                classes.push(px_utility("border", *w as f64));
            }
        }
        StrokeThickness::PerSide([t, r, b, l]) => {
            if *t > 0.0 {
                classes.push(px_utility("border-t", *t as f64));
            }
            if *r > 0.0 {
                classes.push(px_utility("border-r", *r as f64));
            }
            if *b > 0.0 {
                classes.push(px_utility("border-b", *b as f64));
            }
            if *l > 0.0 {
                classes.push(px_utility("border-l", *l as f64));
            }
        }
        StrokeThickness::Sided(s) => {
            if let Some(t) = s.top.filter(|v| *v > 0.0) {
                classes.push(px_utility("border-t", t as f64));
            }
            if let Some(r) = s.right.filter(|v| *v > 0.0) {
                classes.push(px_utility("border-r", r as f64));
            }
            if let Some(b) = s.bottom.filter(|v| *v > 0.0) {
                classes.push(px_utility("border-b", b as f64));
            }
            if let Some(l) = s.left.filter(|v| *v > 0.0) {
                classes.push(px_utility("border-l", l as f64));
            }
        }
        _ => return,
    }
    if let Some(fills) = stroke.fill.as_ref() {
        for f in fills {
            if let PenFill::Solid(s) = f {
                classes.push(color_token_or_arbitrary(&s.color, "border"));
                break;
            }
        }
    }
}

fn push_effect_classes(classes: &mut Vec<String>, effects: Option<&Vec<PenEffect>>) {
    let Some(effects) = effects else {
        return;
    };
    for effect in effects {
        match effect {
            PenEffect::Shadow(s) if s.visible != Some(false) => {
                let inset = if s.inner == Some(true) { "inset_" } else { "" };
                let color = s.color.replace(' ', "");
                classes.push(format!(
                    "shadow-[{}{}px_{}px_{}px_{}px_{}]",
                    inset,
                    fmt_num(s.offset_x as f64),
                    fmt_num(s.offset_y as f64),
                    fmt_num(s.blur as f64),
                    fmt_num(s.spread as f64),
                    color
                ));
            }
            PenEffect::Blur(b) if b.visible != Some(false) && b.radius > 0.0 => {
                classes.push(format!("blur-[{}px]", fmt_num(b.radius as f64)));
            }
            PenEffect::BackgroundBlur(b) if b.visible != Some(false) && b.radius > 0.0 => {
                classes.push(format!("backdrop-blur-[{}px]", fmt_num(b.radius as f64)));
            }
            _ => {}
        }
    }
}

fn push_container_tailwind(
    classes: &mut Vec<String>,
    container: &jian_ops_schema::node::ContainerProps,
    has_children: bool,
    parent: Option<&PenNode>,
) {
    match container.layout {
        Some(LayoutMode::Horizontal) => {
            classes.push("flex".into());
            classes.push("flex-row".into());
        }
        Some(LayoutMode::Vertical) => {
            classes.push("flex".into());
            classes.push("flex-col".into());
        }
        _ => {
            if has_children {
                classes.push("relative".into());
            }
        }
    }
    push_sizing_classes(classes, &container.width, &container.height, parent, false);
    if let Some(min_w) = container.limits.min_width {
        classes.push(px_utility("min-w", min_w));
    }
    if let Some(max_w) = container.limits.max_width {
        classes.push(px_utility("max-w", max_w));
    }
    if let Some(min_h) = container.limits.min_height {
        classes.push(px_utility("min-h", min_h));
    }
    if let Some(max_h) = container.limits.max_height {
        classes.push(px_utility("max-h", max_h));
    }
    match &container.gap {
        Some(NumberOrExpression::Number(g)) if *g > 0.0 => {
            classes.push(px_utility("gap", *g));
        }
        Some(NumberOrExpression::Expression(expr)) => {
            classes.push(color_token_or_arbitrary(expr, "gap"));
        }
        _ => {}
    }
    push_padding_classes(classes, &container.padding);
    match container.justify_content {
        Some(JustifyContent::Center) => classes.push("justify-center".into()),
        Some(JustifyContent::End) => classes.push("justify-end".into()),
        Some(JustifyContent::SpaceBetween) => classes.push("justify-between".into()),
        Some(JustifyContent::SpaceAround) => classes.push("justify-around".into()),
        _ => {}
    }
    match container.align_items {
        Some(AlignItems::Start) => classes.push("items-start".into()),
        Some(AlignItems::Center) => classes.push("items-center".into()),
        Some(AlignItems::End) => classes.push("items-end".into()),
        Some(AlignItems::Stretch) => classes.push("items-stretch".into()),
        None => {}
    }
    push_fill_classes(classes, container.fill.as_ref(), false);
    push_stroke_classes(classes, container.stroke.as_ref());
    push_corner_classes(classes, &container.corner_radius);
    if container.clip_content == Some(true) {
        classes.push("overflow-hidden".into());
    }
    push_effect_classes(classes, container.effects.as_ref());
}

fn emit_tailwind_jsx_node(
    doc: &PenDocument,
    node: &PenNode,
    parent: Option<&PenNode>,
    depth: usize,
    out: &mut String,
) {
    if node_hidden(node) {
        return;
    }
    let indent = "  ".repeat(depth);
    let base = node.base();
    let mut classes: Vec<String> = Vec::new();

    let placed_absolutely = parent.is_some_and(|p| !p.is_auto_layout_container());
    if placed_absolutely {
        classes.push("absolute".into());
        classes.push(px_utility("left", base.x.unwrap_or(0.0)));
        classes.push(px_utility("top", base.y.unwrap_or(0.0)));
    }
    if let Some(rot) = base.rotation.filter(|v| v.abs() > f64::EPSILON) {
        classes.push(format!("rotate-[{}deg]", fmt_num(rot)));
    }
    if let Some(NumberOrExpression::Number(op)) = base.opacity {
        if (op - 1.0).abs() > f64::EPSILON {
            classes.push(format!("opacity-[{}]", fmt_num(op)));
        }
    }

    let mut data_name = base
        .name
        .as_deref()
        .filter(|n| !n.trim().is_empty())
        .map(|n| format!(" data-name=\"{}\"", html_escape(n)))
        .unwrap_or_default();
    if let Some(a11y_label) = op_editor_core::command_node_attrs::node_semantics(node)
        .and_then(|s| s.label.as_deref())
        .filter(|l| !l.trim().is_empty())
    {
        data_name.push_str(&format!(" aria-label=\"{}\"", html_escape(a11y_label)));
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
        out.push_str(&format!(
            "{indent}{{/* @design-note: {} */}}\n",
            explain.replace("*/", "* /")
        ));
    }

    let children = node_children(node);
    match node {
        PenNode::Frame(n) => {
            push_container_tailwind(&mut classes, &n.container, !children.is_empty(), parent)
        }
        PenNode::Group(n) => {
            push_container_tailwind(&mut classes, &n.container, !children.is_empty(), parent)
        }
        PenNode::Rectangle(n) => {
            push_container_tailwind(&mut classes, &n.container, !children.is_empty(), parent)
        }
        PenNode::Ellipse(n) => {
            push_sizing_classes(&mut classes, &n.width, &n.height, parent, false);
            classes.push("rounded-full".into());
            push_fill_classes(&mut classes, n.fill.as_ref(), false);
            push_stroke_classes(&mut classes, n.stroke.as_ref());
            push_effect_classes(&mut classes, n.effects.as_ref());
        }
        PenNode::Image(n) => {
            push_sizing_classes(&mut classes, &n.width, &n.height, parent, false);
            push_corner_classes(&mut classes, &n.corner_radius);
            match n.object_fit {
                Some(ImageFitMode::Fit) => classes.push("object-contain".into()),
                Some(ImageFitMode::Tile) => classes.push("object-none".into()),
                _ => classes.push("object-cover".into()),
            }
            let cls_attr = if classes.is_empty() {
                String::new()
            } else {
                format!(" className=\"{}\"", classes.join(" "))
            };
            let alt = base.name.as_deref().unwrap_or_default();
            out.push_str(&format!(
                "{indent}<img{data_name} src=\"{}\" alt=\"{}\"{cls_attr} />\n",
                html_escape(n.src.as_ref()),
                html_escape(alt),
            ));
            return;
        }
        PenNode::IconFont(n) => {
            push_sizing_classes(&mut classes, &n.width, &n.height, parent, false);
            push_fill_classes(&mut classes, n.fill.as_ref(), true);
            let cls_attr = if classes.is_empty() {
                String::new()
            } else {
                format!(" className=\"{}\"", classes.join(" "))
            };
            out.push_str(&format!(
                "{indent}<span{data_name} data-icon=\"{}\"{cls_attr} aria-hidden=\"true\" />\n",
                html_escape(&n.icon_font_name),
            ));
            return;
        }
        PenNode::Path(n) => {
            let w = node.width_px().unwrap_or(24.0);
            let h = node.height_px().unwrap_or(24.0);
            push_sizing_classes(&mut classes, &n.width, &n.height, parent, false);
            let cls_attr = if classes.is_empty() {
                String::new()
            } else {
                format!(" className=\"{}\"", classes.join(" "))
            };
            let fill_color = n
                .fill
                .as_ref()
                .and_then(|fills| {
                    fills.iter().find_map(|f| match f {
                        PenFill::Solid(s) => Some(s.color.as_str()),
                        _ => None,
                    })
                })
                .unwrap_or("currentColor");
            let d = n.d.as_deref().unwrap_or_default();
            out.push_str(&format!(
                "{indent}<svg{data_name} viewBox=\"0 0 {} {}\" fill=\"none\"{cls_attr}>\n{indent}  <path d=\"{}\" fill=\"{}\" />\n{indent}</svg>\n",
                fmt_num(w),
                fmt_num(h),
                html_escape(d),
                html_escape(fill_color),
            ));
            return;
        }
        PenNode::Text(n) => {
            push_sizing_classes(&mut classes, &n.width, &n.height, parent, true);
            if let Some(font) = n.font_family.as_deref() {
                let primary = font.split(',').next().unwrap_or(font).trim();
                if !primary.is_empty() && !primary.eq_ignore_ascii_case("system-ui") {
                    classes.push(format!("font-['{}']", primary.replace(' ', "_")));
                }
            }
            if let Some(size) = n.font_size {
                classes.push(px_utility("text", size));
            }
            match &n.font_weight {
                Some(FontWeight::Number(w)) => match *w {
                    100 => classes.push("font-thin".into()),
                    200 => classes.push("font-extralight".into()),
                    300 => classes.push("font-light".into()),
                    400 => {}
                    500 => classes.push("font-medium".into()),
                    600 => classes.push("font-semibold".into()),
                    700 => classes.push("font-bold".into()),
                    800 => classes.push("font-extrabold".into()),
                    900 => classes.push("font-black".into()),
                    other => classes.push(format!("font-[{other}]")),
                },
                Some(FontWeight::Keyword(k)) => match k.as_str() {
                    "medium" => classes.push("font-medium".into()),
                    "semibold" | "semi-bold" => classes.push("font-semibold".into()),
                    "bold" => classes.push("font-bold".into()),
                    _ => {}
                },
                None => {}
            }
            if matches!(n.font_style, Some(FontStyleKind::Italic)) {
                classes.push("italic".into());
            }
            if let Some(lh) = n.line_height {
                classes.push(format!("leading-[{}]", fmt_num(lh)));
            }
            if let Some(ls) = n.letter_spacing.filter(|v| v.abs() > f64::EPSILON) {
                classes.push(format!("tracking-[{}px]", fmt_num(ls)));
            }
            match n.text_align {
                Some(TextAlign::Center) => classes.push("text-center".into()),
                Some(TextAlign::Right) => classes.push("text-right".into()),
                Some(TextAlign::Justify) => classes.push("text-justify".into()),
                _ => {}
            }
            push_fill_classes(&mut classes, n.fill.as_ref(), true);

            let cls_attr = if classes.is_empty() {
                String::new()
            } else {
                format!(" className=\"{}\"", classes.join(" "))
            };
            let content = match &n.content {
                TextContent::Plain(s) => html_escape(s),
                TextContent::Styled(segs) => segs
                    .iter()
                    .map(|seg| html_escape(&seg.text))
                    .collect::<String>(),
            };
            out.push_str(&format!("{indent}<p{data_name}{cls_attr}>{content}</p>\n"));
            return;
        }
        _ => {
            if let Some(w) = node.width_px() {
                classes.push(px_utility("w", w));
            }
            if let Some(h) = node.height_px() {
                classes.push(px_utility("h", h));
            }
        }
    }

    let tag = semantic_html_tag(node);
    let cls_attr = if classes.is_empty() {
        String::new()
    } else {
        format!(" className=\"{}\"", classes.join(" "))
    };
    if children.is_empty() {
        out.push_str(&format!("{indent}<{tag}{data_name}{cls_attr} />\n"));
    } else {
        out.push_str(&format!("{indent}<{tag}{data_name}{cls_attr}>\n"));
        for child in children {
            emit_tailwind_jsx_node(doc, child, Some(node), depth + 1, out);
        }
        out.push_str(&format!("{indent}</{tag}>\n"));
    }
}
