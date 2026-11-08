//! Variables from a design.md YAML frontmatter token block (`colors`,
//! `rounded`, `spacing`). A `dark-<name>` colour is the Dark mode value of
//! `<name>`, so the pair becomes one variable themed on the `Mode` axis
//! instead of two unrelated variables.

use jian_ops_schema::variable::{
    ThemedValue, VariableDefinition, VariableKind, VariableScalar, VariableValue,
};
use std::collections::BTreeMap;

pub(crate) const MODE_AXIS: &str = "Mode";

/// `(top-level key, child key, value)` for each frontmatter child entry.
fn frontmatter_entries(raw: &str) -> Vec<(String, String, String)> {
    let mut lines = raw.lines();
    if lines.next().map(str::trim) != Some("---") {
        return Vec::new();
    }
    let mut out = Vec::new();
    let mut section = String::new();
    for line in lines {
        if line.trim() == "---" {
            break;
        }
        let content = line.split(" #").next().unwrap_or("").trim_end();
        if content.trim_start().starts_with('#') || content.trim().is_empty() {
            continue;
        }
        let indent = content.len() - content.trim_start().len();
        let Some((key, value)) = content.trim().split_once(':') else {
            continue;
        };
        if indent == 0 {
            section = key.trim().to_string();
        } else if indent == 2 {
            let value = value.trim().trim_matches(|c| c == '"' || c == '\'');
            if !value.is_empty() {
                out.push((section.clone(), key.trim().to_string(), value.to_string()));
            }
        }
    }
    out
}

fn hex(value: &str) -> Option<String> {
    let digits = value.strip_prefix('#')?;
    let valid = matches!(digits.len(), 3 | 6 | 8) && digits.chars().all(|c| c.is_ascii_hexdigit());
    valid.then(|| format!("#{}", digits.to_ascii_uppercase()))
}

fn pixels(value: &str) -> Option<f64> {
    value
        .strip_suffix("px")
        .unwrap_or(value)
        .trim()
        .parse()
        .ok()
}

fn themed(light: VariableScalar, dark: VariableScalar) -> VariableValue {
    let mode = |name: &str| Some(BTreeMap::from([(MODE_AXIS.to_string(), name.to_string())]));
    VariableValue::Themed(vec![
        ThemedValue {
            value: light,
            theme: mode("Light"),
        },
        ThemedValue {
            value: dark,
            theme: mode("Dark"),
        },
    ])
}

/// Variables for the frontmatter tokens, and whether any are Light/Dark
/// themed. Empty when the markdown has no token block.
pub(crate) fn frontmatter_token_variables(
    raw: &str,
) -> (BTreeMap<String, VariableDefinition>, bool) {
    let entries = frontmatter_entries(raw);
    let mut light = BTreeMap::new();
    let mut dark = BTreeMap::new();
    let mut out = BTreeMap::new();
    for (section, key, value) in &entries {
        match section.as_str() {
            "colors" => {
                let Some(hex) = hex(value) else { continue };
                match key.strip_prefix("dark-") {
                    Some(base) => dark.insert(base.to_string(), hex),
                    None => light.insert(key.clone(), hex),
                };
            }
            "rounded" | "spacing" => {
                let Some(px) = pixels(value) else { continue };
                let name = format!("--{section}-{key}");
                let value = VariableValue::Scalar(VariableScalar::Num(px));
                out.insert(
                    name,
                    VariableDefinition {
                        kind: VariableKind::Number,
                        value,
                    },
                );
            }
            _ => {}
        }
    }
    let mut has_dark = false;
    for (name, light_hex) in light {
        let value = match dark.remove(&name) {
            Some(dark_hex) => {
                has_dark = true;
                themed(
                    VariableScalar::Str(light_hex),
                    VariableScalar::Str(dark_hex),
                )
            }
            None => VariableValue::Scalar(VariableScalar::Str(light_hex)),
        };
        out.insert(
            format!("--{name}"),
            VariableDefinition {
                kind: VariableKind::Color,
                value,
            },
        );
    }
    // A dark value without a light one is still the Dark mode of `name`.
    for (name, dark_hex) in dark {
        has_dark = true;
        let value = themed(
            VariableScalar::Str(dark_hex.clone()),
            VariableScalar::Str(dark_hex),
        );
        out.insert(
            format!("--{name}"),
            VariableDefinition {
                kind: VariableKind::Color,
                value,
            },
        );
    }
    (out, has_dark)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn dark_pairs_merge_and_scales_become_numbers() {
        let raw = "---\nname: X\ncolors:\n  # comment\n  red-1: \"#fffcfc\"\n  dark-red-1: \"#201817\"\n  white: '#FFF'\nrounded:\n  small: \"8px\"\n  circular: \"50%\"\nspacing:\n  nano: 4px # inline\n---\n# Body\n- Accent #123456";
        let (vars, has_dark) = frontmatter_token_variables(raw);
        assert!(has_dark);
        assert_eq!(
            vars["--red-1"].value,
            themed(
                VariableScalar::Str("#FFFCFC".into()),
                VariableScalar::Str("#201817".into())
            )
        );
        assert!(!vars.contains_key("--dark-red-1"));
        assert_eq!(
            vars["--white"].value,
            VariableValue::Scalar(VariableScalar::Str("#FFF".into()))
        );
        assert_eq!(
            vars["--rounded-small"].value,
            VariableValue::Scalar(VariableScalar::Num(8.0))
        );
        assert!(!vars.contains_key("--rounded-circular"));
        assert_eq!(
            vars["--spacing-nano"].value,
            VariableValue::Scalar(VariableScalar::Num(4.0))
        );
    }

    #[test]
    fn a_real_design_md_syncs_as_mode_themed_variables() {
        let raw = include_str!("../../libraries/talkdesk-cobalt/DESIGN.md");
        let mut state = crate::EditorState::new();
        let count = state.sync_design_md_to_variables(&crate::design_md::parse_design_md(raw));
        let vars = state.doc.variables.as_ref().unwrap();
        assert_eq!(count, vars.len());
        assert!(vars.keys().all(|name| !name.starts_with("--dark-")));
        assert!(matches!(vars["--purple-9"].value, VariableValue::Themed(_)));
        assert!(vars.contains_key("--spacing-small") && vars.contains_key("--rounded-pill"));
        assert_eq!(
            state.doc.themes.as_ref().unwrap()[MODE_AXIS],
            ["Light", "Dark"]
        );
    }

    #[test]
    fn markdown_without_frontmatter_has_no_tokens() {
        assert!(
            frontmatter_token_variables("# Title\n## Colors\n- Red #FF0000")
                .0
                .is_empty()
        );
    }
}
