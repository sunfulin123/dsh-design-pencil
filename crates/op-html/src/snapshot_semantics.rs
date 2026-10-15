//! Semantic role inference, layer naming, Lucide icon lifting, and design
//! variable extraction for browser-rendered HTML snapshots.

use std::collections::BTreeMap;

use jian_ops_schema::node::base::PenNodeBase;
use jian_ops_schema::node::icon_font::IconFontNode;
use jian_ops_schema::node::text::TextContent;
use jian_ops_schema::node::PenNode;
use jian_ops_schema::sizing::SizingBehavior;
use jian_ops_schema::style::PenFill;
use jian_ops_schema::variable::{VariableDefinition, VariableKind, VariableScalar, VariableValue};
use serde_json::{Map, Value};

use crate::color::parse_css_color;

fn attr_str<'a>(object: &'a Map<String, Value>, key: &str) -> Option<&'a str> {
    object
        .get("attrs")
        .and_then(Value::as_object)
        .and_then(|attrs| attrs.get(key))
        .and_then(Value::as_str)
        .map(str::trim)
        .filter(|s| !s.is_empty())
}

/// Infer a canonical `.op` semantic role (`navbar`, `hero`, `card`, `button`,
/// `input`, `badge`, `footer`, `section`, etc.) from HTML tag and attributes.
pub(crate) fn infer_semantic_role(object: &Map<String, Value>) -> Option<String> {
    if let Some(role) = attr_str(object, "role") {
        let lower = role.to_ascii_lowercase();
        match lower.as_str() {
            "navigation" | "menubar" => return Some("navbar".into()),
            "banner" => return Some("navbar".into()),
            "contentinfo" => return Some("footer".into()),
            "button" | "tab" | "menuitem" => return Some("button".into()),
            "textbox" | "searchbox" | "combobox" => return Some("input".into()),
            "region" | "main" => return Some("section".into()),
            _ => {}
        }
    }
    let tag = object
        .get("tag")
        .and_then(Value::as_str)
        .unwrap_or("")
        .to_ascii_lowercase();
    let cls = attr_str(object, "class").unwrap_or("").to_ascii_lowercase();
    match tag.as_str() {
        "nav" | "header" => return Some("navbar".into()),
        "footer" => return Some("footer".into()),
        "button" => return Some("button".into()),
        "input" | "textarea" | "select" => return Some("input".into()),
        "section" | "main" | "article" => {
            if cls.contains("hero") || cls.contains("banner") {
                return Some("hero".into());
            }
            return Some("section".into());
        }
        "aside" => return Some("sidebar".into()),
        "table" => return Some("table".into()),
        _ => {}
    }
    if cls.contains("navbar") || cls.contains("topbar") || cls.contains("site-header") {
        return Some("navbar".into());
    }
    if cls.contains("hero") {
        return Some("hero".into());
    }
    if cls.contains("card") || cls.contains("tile") {
        return Some("card".into());
    }
    if cls.contains("btn") || cls.contains("button") || cls.contains("cta") {
        return Some("button".into());
    }
    if cls.contains("badge") || cls.contains("chip") || cls.contains("pill") || cls.contains("tag")
    {
        return Some("badge".into());
    }
    if cls.contains("footer") {
        return Some("footer".into());
    }
    None
}

fn clean_semantic_class_token(classes: &str) -> Option<String> {
    const NOISE_PREFIXES: &[&str] = &[
        "flex",
        "grid",
        "block",
        "inline",
        "hidden",
        "relative",
        "absolute",
        "fixed",
        "sticky",
        "w-",
        "h-",
        "min-",
        "max-",
        "p-",
        "px-",
        "py-",
        "pt-",
        "pr-",
        "pb-",
        "pl-",
        "m-",
        "mx-",
        "my-",
        "mt-",
        "mr-",
        "mb-",
        "ml-",
        "gap-",
        "space-",
        "text-",
        "font-",
        "bg-",
        "border",
        "rounded",
        "shadow",
        "items-",
        "justify-",
        "self-",
        "col-",
        "row-",
        "z-",
        "opacity-",
        "overflow-",
        "transition",
        "duration-",
        "ease-",
        "hover:",
        "focus:",
        "dark:",
        "sm:",
        "md:",
        "lg:",
        "xl:",
        "2xl:",
        "lucide",
        "fa-",
        "fas",
        "far",
        "fab",
        "css-",
        "sc-",
        "jsx-",
        "svelte-",
    ];
    for raw in classes.split_whitespace() {
        let token = raw.trim();
        if token.len() < 3 || token.len() > 36 {
            continue;
        }
        let lower = token.to_ascii_lowercase();
        if NOISE_PREFIXES.iter().any(|p| lower.starts_with(p)) {
            continue;
        }
        if lower.chars().filter(|c| c.is_ascii_digit()).count() > 2 {
            continue;
        }
        let words: Vec<String> = token
            .split(['-', '_'])
            .filter(|part| !part.is_empty())
            .map(|part| {
                let mut chars = part.chars();
                match chars.next() {
                    Some(first) => first.to_uppercase().collect::<String>() + chars.as_str(),
                    None => String::new(),
                }
            })
            .collect();
        if !words.is_empty() {
            return Some(words.join(" "));
        }
    }
    None
}

fn first_short_text_label(children: &[PenNode]) -> Option<String> {
    for child in children {
        match child {
            PenNode::Text(text) => {
                let raw = match &text.content {
                    TextContent::Plain(s) => s.trim().to_string(),
                    TextContent::Styled(segs) => segs
                        .iter()
                        .map(|s| s.text.as_str())
                        .collect::<String>()
                        .trim()
                        .to_string(),
                };
                if !raw.is_empty() && raw.chars().count() <= 24 {
                    return Some(raw);
                }
            }
            PenNode::Frame(frame) => {
                if let Some(kids) = frame.children.as_deref() {
                    if let Some(found) = first_short_text_label(kids) {
                        return Some(found);
                    }
                }
            }
            _ => {}
        }
    }
    None
}

/// Infer a human-friendly layer name when the snapshot carries semantic
/// attributes (`aria-label`, `id`, semantic class, or button/link label).
/// Falls back to the raw HTML `tag` when no semantic metadata is present so
/// existing bare-DOM unit tests keep their exact tag names.
pub(crate) fn infer_layer_name(
    object: &Map<String, Value>,
    root_name: Option<&str>,
    children: &[PenNode],
) -> Option<String> {
    if let Some(root) = root_name {
        return Some(root.to_string());
    }
    let tag = object.get("tag").and_then(Value::as_str);
    let has_attrs = object
        .get("attrs")
        .and_then(Value::as_object)
        .is_some_and(|a| !a.is_empty());
    if !has_attrs {
        return tag.map(str::to_string);
    }
    if let Some(aria) = attr_str(object, "aria-label") {
        return Some(aria.to_string());
    }
    if let Some(id) = attr_str(object, "id") {
        return Some(id.to_string());
    }
    if matches!(tag, Some("button" | "a")) {
        if let Some(label) = first_short_text_label(children) {
            let prefix = if tag == Some("button") {
                "Button"
            } else {
                "Link"
            };
            return Some(format!("{prefix}: {label}"));
        }
    }
    if let Some(cls) = attr_str(object, "class") {
        if let Some(cleaned) = clean_semantic_class_token(cls) {
            return Some(cleaned);
        }
    }
    tag.map(str::to_string)
}

/// Detect whether a captured `<svg>` or icon element explicitly declares a
/// Lucide icon name via `data-lucide="search"` or `class="lucide lucide-search"`.
pub(crate) fn extract_lucide_icon_name(object: &Map<String, Value>) -> Option<String> {
    if let Some(direct) = attr_str(object, "data-lucide") {
        let cleaned = direct.trim().to_ascii_lowercase();
        if !cleaned.is_empty() {
            return Some(cleaned);
        }
    }
    let cls = attr_str(object, "class")?;
    for token in cls.split_whitespace() {
        if let Some(rest) = token.strip_prefix("lucide-") {
            let name = rest.trim().to_ascii_lowercase();
            if !name.is_empty() && name != "icon" {
                return Some(name);
            }
        }
    }
    None
}

/// Convert an explicitly marked Lucide `<svg>` in a snapshot into a native
/// editable `PenNode::IconFont`.
pub(crate) fn try_map_lucide_icon(
    object: &Map<String, Value>,
    base: PenNodeBase,
    width: f64,
    height: f64,
    styles: &BTreeMap<String, String>,
) -> Option<PenNode> {
    let icon_name = extract_lucide_icon_name(object)?;
    if !(8.0..=96.0).contains(&width) || !(8.0..=96.0).contains(&height) {
        return None;
    }
    let color = object
        .get("fill")
        .and_then(Value::as_str)
        .and_then(parse_css_color)
        .or_else(|| styles.get("color").and_then(|c| parse_css_color(c)))
        .unwrap_or_else(|| "#111827".to_string());
    let mut base = base;
    if base.name.as_deref() == Some("svg") || base.name.is_none() {
        base.name = Some(format!("Icon ({icon_name})"));
    }
    Some(PenNode::IconFont(IconFontNode {
        base,
        limits: Default::default(),
        width: Some(SizingBehavior::Number(width.round().max(12.0))),
        height: Some(SizingBehavior::Number(height.round().max(12.0))),
        icon_font_name: icon_name,
        icon_font_family: Some("lucide".to_string()),
        fill: Some(vec![super::solid_fill(color)]),
        stroke: None,
        state: None,
        bindings: None,
        events: None,
        lifecycle: None,
        semantics: None,
        gestures: None,
        route: None,
    }))
}

/// Scan an imported node tree for recurring solid colors and synthesize a
/// clean `PenDocument.variables` token map (Mimic AI design-system token
/// extraction pattern). Node fills remain concrete hex strings so existing
/// color assertions never break, while the document's Variables panel is
/// pre-populated with the page's design palette.
pub(crate) fn extract_design_variables(
    roots: &[PenNode],
) -> Option<BTreeMap<String, VariableDefinition>> {
    let mut bg_counts: BTreeMap<String, usize> = BTreeMap::new();
    let mut text_counts: BTreeMap<String, usize> = BTreeMap::new();
    let mut border_counts: BTreeMap<String, usize> = BTreeMap::new();

    fn record_fills(fills: Option<&[PenFill]>, table: &mut BTreeMap<String, usize>) {
        let Some(fills) = fills else { return };
        for fill in fills {
            if let PenFill::Solid(solid) = fill {
                let c = solid.color.trim().to_ascii_lowercase();
                if c.starts_with('#') && (c.len() == 7 || c.len() == 9) {
                    *table.entry(c).or_insert(0) += 1;
                }
            }
        }
    }

    fn walk(
        node: &PenNode,
        bg: &mut BTreeMap<String, usize>,
        text: &mut BTreeMap<String, usize>,
        border: &mut BTreeMap<String, usize>,
    ) {
        match node {
            PenNode::Frame(f) => {
                record_fills(f.container.fill.as_deref(), bg);
                if let Some(stroke) = &f.container.stroke {
                    record_fills(stroke.fill.as_deref(), border);
                }
                if let Some(kids) = f.children.as_deref() {
                    for kid in kids {
                        walk(kid, bg, text, border);
                    }
                }
            }
            PenNode::Rectangle(r) => {
                record_fills(r.container.fill.as_deref(), bg);
                if let Some(stroke) = &r.container.stroke {
                    record_fills(stroke.fill.as_deref(), border);
                }
            }
            PenNode::Text(t) => {
                record_fills(t.fill.as_deref(), text);
            }
            PenNode::Path(p) => {
                record_fills(p.fill.as_deref(), text);
            }
            PenNode::IconFont(i) => {
                record_fills(i.fill.as_deref(), text);
            }
            _ => {}
        }
    }

    for root in roots {
        walk(root, &mut bg_counts, &mut text_counts, &mut border_counts);
    }

    fn top_colors(counts: &BTreeMap<String, usize>, limit: usize) -> Vec<String> {
        let mut pairs: Vec<(&String, &usize)> = counts.iter().collect();
        pairs.sort_by(|a, b| b.1.cmp(a.1).then_with(|| a.0.cmp(b.0)));
        pairs
            .into_iter()
            .take(limit)
            .map(|(color, _)| color.clone())
            .collect()
    }

    let mut vars = BTreeMap::new();
    let bg_names = [
        "--bg-canvas",
        "--bg-surface",
        "--bg-elevated",
        "--bg-accent",
    ];
    for (idx, color) in top_colors(&bg_counts, bg_names.len())
        .into_iter()
        .enumerate()
    {
        vars.insert(
            bg_names[idx].to_string(),
            VariableDefinition {
                kind: VariableKind::Color,
                value: VariableValue::Scalar(VariableScalar::Str(color)),
            },
        );
    }
    let text_names = ["--text-primary", "--text-secondary", "--text-muted"];
    for (idx, color) in top_colors(&text_counts, text_names.len())
        .into_iter()
        .enumerate()
    {
        vars.insert(
            text_names[idx].to_string(),
            VariableDefinition {
                kind: VariableKind::Color,
                value: VariableValue::Scalar(VariableScalar::Str(color)),
            },
        );
    }
    let border_names = ["--border-default", "--border-subtle"];
    for (idx, color) in top_colors(&border_counts, border_names.len())
        .into_iter()
        .enumerate()
    {
        vars.insert(
            border_names[idx].to_string(),
            VariableDefinition {
                kind: VariableKind::Color,
                value: VariableValue::Scalar(VariableScalar::Str(color)),
            },
        );
    }

    (!vars.is_empty()).then_some(vars)
}
