//! REST `TEXT` nodes → kiwi text fields (`textData`, `fontName`, metrics).

use super::fields::{f64_of, num, obj, paints, put, str_of, text, Fields};
use crate::kiwi::FigValue;
use serde_json::Value;
use std::collections::BTreeSet;

/// One font face a converted document needs, for fetching / registration.
#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct RestFontFace {
    pub family: String,
    pub weight: u32,
    pub italic: bool,
    pub postscript: Option<String>,
}

fn weight_name(weight: u32) -> &'static str {
    match weight {
        0..=149 => "Thin",
        150..=249 => "ExtraLight",
        250..=349 => "Light",
        350..=449 => "Regular",
        450..=549 => "Medium",
        550..=649 => "SemiBold",
        650..=749 => "Bold",
        750..=849 => "ExtraBold",
        _ => "Black",
    }
}

/// Kiwi `fontName.style` ("SemiBold Italic") synthesized from the numeric
/// REST weight, which is more reliable than localized style names.
fn style_name(weight: u32, italic: bool) -> String {
    match (weight_name(weight), italic) {
        ("Regular", true) => "Italic".to_string(),
        (name, true) => format!("{name} Italic"),
        (name, false) => name.to_string(),
    }
}

fn weight_of(style: &Value) -> Option<u32> {
    f64_of(style, "fontWeight")
        .filter(|w| *w > 0.0)
        .map(|w| w.round() as u32)
}

fn italic_of(style: &Value) -> bool {
    style.get("italic").and_then(Value::as_bool) == Some(true)
}

fn font_name(
    family: Option<&str>,
    weight: u32,
    italic: bool,
    postscript: Option<&str>,
) -> FigValue {
    let mut pairs = vec![("style", text(&style_name(weight, italic)))];
    if let Some(family) = family {
        pairs.push(("family", text(family)));
    }
    if let Some(ps) = postscript.filter(|p| !p.is_empty()) {
        pairs.push(("postscript", text(ps)));
    }
    obj(pairs)
}

fn decoration(style: &Value) -> Option<&str> {
    str_of(style, "textDecoration").filter(|d| matches!(*d, "UNDERLINE" | "STRIKETHROUGH"))
}

/// Per-run overrides: kiwi indexes `styleOverrideTable` by style id, so the
/// table is laid out densely with `table[id]` holding the override.
fn override_table(
    table: &serde_json::Map<String, Value>,
    base_family: Option<&str>,
    base_weight: u32,
    base_italic: bool,
    image_refs: &mut BTreeSet<String>,
    fonts: &mut BTreeSet<RestFontFace>,
) -> FigValue {
    let max_id = table
        .keys()
        .filter_map(|k| k.parse::<usize>().ok())
        .max()
        .unwrap_or(0);
    let mut entries = vec![FigValue::Object(Vec::new()); max_id + 1];
    for (key, style) in table {
        let Ok(id) = key.parse::<usize>() else {
            continue;
        };
        let mut e: Fields = Vec::new();
        let family = str_of(style, "fontFamily");
        let weight = weight_of(style);
        let italic = style.get("italic").and_then(Value::as_bool);
        if family.is_some() || weight.is_some() || italic.is_some() {
            let w = weight.unwrap_or(base_weight);
            let i = italic.unwrap_or(base_italic);
            put(
                &mut e,
                "fontName",
                font_name(family, w, i, str_of(style, "fontPostScriptName")),
            );
            if let Some(family) = family.or(base_family) {
                fonts.insert(RestFontFace {
                    family: family.to_string(),
                    weight: w,
                    italic: i,
                    postscript: str_of(style, "fontPostScriptName").map(str::to_string),
                });
            }
        }
        if let Some(size) = f64_of(style, "fontSize") {
            put(&mut e, "fontSize", num(size));
        }
        if let Some(d) = decoration(style) {
            put(&mut e, "textDecoration", text(d));
        }
        if let Some(p) = paints(style.get("fills"), image_refs) {
            put(&mut e, "fillPaints", p);
        }
        put(&mut e, "styleID", num(id as f64));
        entries[id] = FigValue::Object(e);
    }
    FigValue::Array(entries)
}

pub(super) fn text_fields(
    node: &Value,
    f: &mut Fields,
    image_refs: &mut BTreeSet<String>,
    fonts: &mut BTreeSet<RestFontFace>,
) {
    let empty = Value::Object(Default::default());
    let style = node.get("style").unwrap_or(&empty);
    let family = str_of(style, "fontFamily");
    let weight = weight_of(style).unwrap_or(400);
    let italic = italic_of(style);
    let postscript = str_of(style, "fontPostScriptName");
    put(f, "fontName", font_name(family, weight, italic, postscript));
    if let Some(family) = family {
        fonts.insert(RestFontFace {
            family: family.to_string(),
            weight,
            italic,
            postscript: postscript.map(str::to_string),
        });
    }
    let font_size = f64_of(style, "fontSize").unwrap_or(12.0);
    put(f, "fontSize", num(font_size));
    // `lineHeightPx` is Figma's resolved line box for every unit (including
    // Auto), so it reproduces the authored leading exactly.
    if let Some(px) = f64_of(style, "lineHeightPx").filter(|v| *v > 0.0) {
        put(
            f,
            "lineHeight",
            obj(vec![("value", num(px)), ("units", text("PIXELS"))]),
        );
    }
    if let Some(ls) = f64_of(style, "letterSpacing") {
        put(
            f,
            "letterSpacing",
            obj(vec![("value", num(ls)), ("units", text("PIXELS"))]),
        );
    }
    for key in ["textAlignHorizontal", "textAlignVertical", "textCase"] {
        if let Some(v) = str_of(style, key) {
            put(f, key, text(v));
        }
    }
    if let Some(d) = decoration(style) {
        put(f, "textDecoration", text(d));
    }
    put(
        f,
        "textAutoResize",
        text(str_of(style, "textAutoResize").unwrap_or("NONE")),
    );
    if let Some(t) = str_of(style, "textTruncation") {
        put(f, "textTruncation", text(t));
    }
    if let Some(n) = f64_of(style, "maxLines") {
        put(f, "maxLines", num(n));
    }
    let characters = str_of(node, "characters").unwrap_or("");
    let mut data: Vec<(&str, FigValue)> = vec![("characters", text(characters))];
    let overrides = node
        .get("characterStyleOverrides")
        .and_then(Value::as_array)
        .filter(|o| !o.is_empty());
    let table = node
        .get("styleOverrideTable")
        .and_then(Value::as_object)
        .filter(|t| !t.is_empty());
    if let (Some(overrides), Some(table)) = (overrides, table) {
        // REST trims trailing zeros; kiwi expects one id per UTF-16 unit.
        let units = characters.encode_utf16().count();
        let ids = (0..units)
            .map(|i| num(overrides.get(i).and_then(Value::as_f64).unwrap_or(0.0)))
            .collect();
        data.push(("characterStyleIDs", FigValue::Array(ids)));
        data.push((
            "styleOverrideTable",
            override_table(table, family, weight, italic, image_refs, fonts),
        ));
    }
    put(f, "textData", obj(data));
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn style_names_follow_numeric_weight() {
        assert_eq!(style_name(500, false), "Medium");
        assert_eq!(style_name(400, true), "Italic");
        assert_eq!(style_name(600, true), "SemiBold Italic");
    }
}
