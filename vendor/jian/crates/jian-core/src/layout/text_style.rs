use super::measure::FontStyleKind;

pub(super) fn resolve_weight(w: Option<&jian_ops_schema::node::FontWeight>) -> u16 {
    use jian_ops_schema::node::text::FontWeight;
    match w {
        Some(FontWeight::Number(n)) => *n as u16,
        Some(FontWeight::Keyword(s)) => {
            if let Ok(n) = s.parse::<u16>() {
                return n;
            }
            match s.as_str() {
                "bold" => 700,
                "semibold" | "semi-bold" | "demibold" => 600,
                "medium" => 500,
                "normal" | "regular" => 400,
                "light" => 300,
                "extralight" | "extra-light" | "ultralight" | "ultra-light" => 200,
                "thin" | "hairline" => 100,
                "black" | "heavy" => 900,
                "extrabold" | "extra-bold" | "ultrabold" | "ultra-bold" => 800,
                _ => 400,
            }
        }
        None => 400,
    }
}

pub(super) fn resolve_style(s: Option<&jian_ops_schema::node::TextFontStyle>) -> FontStyleKind {
    match s {
        Some(jian_ops_schema::node::TextFontStyle::Italic) => FontStyleKind::Italic,
        _ => FontStyleKind::Normal,
    }
}
