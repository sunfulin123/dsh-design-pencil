//! Read declared DESIGN.md frontmatter tokens without inventing missing values.
use super::parser::{StyleColors, StyleGuideValues, StyleTypography};
use crate::frontmatter::{split_frontmatter, unquote};

pub(super) fn apply(values: &mut StyleGuideValues, raw: &str) {
    let Some((header, _)) = split_frontmatter(raw) else {
        return;
    };
    let mut section = String::new();
    let mut role = String::new();
    let mut colors = std::collections::BTreeMap::new();
    let mut fonts = std::collections::BTreeMap::new();
    for line in header.lines() {
        let indent = line.len() - line.trim_start().len();
        let Some((key, value)) = line.trim().split_once(':') else {
            continue;
        };
        let value = unquote(value.trim());
        if indent == 0 {
            section = key.to_string();
        } else if indent == 2 {
            role = key.to_string();
            if section == "colors" && op_util::hex_color::parse_hex_rgba8_padded(&value).is_some() {
                colors.insert(key.to_string(), value.to_uppercase());
            }
        } else if section == "typography" && key == "fontFamily" && !value.is_empty() {
            fonts.insert(role.clone(), value);
        }
    }
    let color = |keys: &[&str]| keys.iter().find_map(|key| colors.get(*key).cloned());
    if !colors.is_empty() {
        values.colors = StyleColors {
            background: color(&["canvas", "background", "bg", "page"]),
            surface: color(&["surface", "surface-1", "surface-card", "surface-pearl"]),
            accent: color(&["primary", "accent", "brand"]),
            text_primary: color(&["ink", "text", "text-primary", "foreground"]),
            text_secondary: color(&["body", "text-secondary", "ink-muted"]),
            text_muted: color(&["ink-subtle", "body-muted", "text-muted"]),
            border: color(&["hairline", "border", "divider", "divider-soft"]),
        };
    }
    if !fonts.is_empty() {
        let font = |keys: &[&str]| keys.iter().find_map(|key| fonts.get(*key).cloned());
        values.typography = StyleTypography {
            display_font: font(&[
                "hero-display",
                "display-xl",
                "display-lg",
                "display",
                "heading",
                "headline",
            ]),
            body_font: font(&["body", "body-md", "body-lg", "body-regular"]),
            data_font: font(&["mono", "code", "data"]),
        };
    }
}
