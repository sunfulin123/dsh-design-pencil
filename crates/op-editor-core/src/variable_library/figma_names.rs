//! Figma display paths for Talkdesk Cobalt variables.
//!
//! The Cobalt Figma library names variables by group path
//! (`Colors/Purple/purple-9`, `Colors/Primary/9`, `Spacing inset/Small`) while
//! code uses the CSS custom property (`--purple-9`). This maps the CSS name to
//! the Figma path observed in the published library so a `.fig` import can
//! link its library variables to the built-in ones by path.

const FAMILIES: &[&str] = &[
    "red", "orange", "yellow", "green", "teal", "blue", "purple", "midnight", "gray", "neutral",
];
const ROLES: &[&str] = &[
    "primary",
    "secondary",
    "info",
    "success",
    "warning",
    "error",
];

fn capitalize(word: &str) -> String {
    let mut chars = word.chars();
    match chars.next() {
        Some(first) => format!("{}{}", first.to_ascii_uppercase(), chars.as_str()),
        None => String::new(),
    }
}

/// Scale steps: `small` → `Small`, `xsmall` → `XSmall`, `xgiga` → `XGiga`.
fn step(word: &str) -> String {
    match word.strip_prefix('x') {
        Some(rest) if ["small", "large", "mega", "giga", "tera"].contains(&rest) => {
            format!("X{}", capitalize(rest))
        }
        _ => capitalize(word),
    }
}

/// `gradient-start` → `Gradient start`.
fn title(words: &str) -> String {
    capitalize(&words.replace('-', " "))
}

/// Figma display path for a Cobalt CSS variable name (`--purple-9`).
pub fn cobalt_figma_name(css: &str) -> String {
    let name = css.trim_start_matches("--");
    for family in FAMILIES {
        if let Some(rest) = name.strip_prefix(family).and_then(|r| r.strip_prefix('-')) {
            return format!("Colors/{}/{family}-{rest}", capitalize(family));
        }
    }
    for role in ROLES {
        if let Some(rest) = name.strip_prefix(role).and_then(|r| r.strip_prefix('-')) {
            return format!("Colors/{}/{rest}", capitalize(role));
        }
    }
    if let Some(rest) = name.strip_prefix("text-") {
        return format!("Colors/Text/{}", title(rest));
    }
    if let Some(rest) = name.strip_prefix("illustration-") {
        return format!("Colors/Illustrations/{}", title(rest));
    }
    if name.starts_with("surface-") {
        return format!("Surfaces/{name}");
    }
    if let Some(rest) = name.strip_prefix("opacity-") {
        return match rest {
            "active" | "hover" | "disabled" => format!("Opacity/Interaction states/{}", step(rest)),
            _ => format!("Opacity/{}", step(rest)),
        };
    }
    if let Some(rest) = name.strip_prefix("font-family") {
        let rest = rest.trim_start_matches('-');
        return match rest {
            "" => "Typography/Font family/Stack".into(),
            _ => format!("Typography/Font family/{}", title(rest)),
        };
    }
    for (prefix, group) in [
        ("spacing-inset-", "Spacing inset"),
        ("spacing-", "Spacing (between elements)"),
        ("border-radius-", "Border radius"),
        ("border-width-", "Border width"),
        ("font-size-", "Typography/Font size"),
        ("font-weight-", "Typography/Font weight"),
        ("line-height-", "Typography/Line height"),
        ("z-index-", "Z-index"),
        ("base-spacing-", "Spacing/Base"),
        ("overlay-", "Overlays"),
    ] {
        if let Some(rest) = name.strip_prefix(prefix) {
            return format!("{group}/{}", step(rest));
        }
    }
    if name == "color-background" {
        return name.to_string();
    }
    format!("Other/{name}")
}

#[cfg(test)]
mod tests {
    use super::cobalt_figma_name as figma;

    #[test]
    fn matches_the_published_library_paths() {
        assert_eq!(figma("--purple-9"), "Colors/Purple/purple-9");
        assert_eq!(figma("--neutral-a11"), "Colors/Neutral/neutral-a11");
        assert_eq!(figma("--blue-contrast"), "Colors/Blue/blue-contrast");
        assert_eq!(figma("--primary-9"), "Colors/Primary/9");
        assert_eq!(figma("--secondary-a3"), "Colors/Secondary/a3");
        assert_eq!(figma("--error-contrast"), "Colors/Error/contrast");
        assert_eq!(figma("--text-default"), "Colors/Text/Default");
        assert_eq!(
            figma("--illustration-gradient-start"),
            "Colors/Illustrations/Gradient start"
        );
        assert_eq!(
            figma("--surface-elevation-1"),
            "Surfaces/surface-elevation-1"
        );
        assert_eq!(figma("--spacing-small"), "Spacing (between elements)/Small");
        assert_eq!(figma("--spacing-xgiga"), "Spacing (between elements)/XGiga");
        assert_eq!(figma("--spacing-inset-micro"), "Spacing inset/Micro");
        assert_eq!(figma("--border-radius-xsmall"), "Border radius/XSmall");
        assert_eq!(figma("--border-width-hairline"), "Border width/Hairline");
        assert_eq!(
            figma("--opacity-active"),
            "Opacity/Interaction states/Active"
        );
        assert_eq!(figma("--opacity-opaque"), "Opacity/Opaque");
        assert_eq!(
            figma("--font-family-base-mono"),
            "Typography/Font family/Base mono"
        );
        assert_eq!(figma("--color-background"), "color-background");
    }
}
