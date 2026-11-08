//! Talkdesk Cobalt, parsed from the verbatim `TALKDESK-VARIABLES.md` that
//! documents every CSS custom property of the production theme.
//!
//! Kept: Colors 2.0 primitives (solid, alpha, supporting), semantic roles,
//! text/surface/overlay/illustration tokens, typography, spacing, radius and
//! border width, opacity and z-index. Dropped, as the source instructs:
//! legacy 100–900 scales and the `.cobalt--27_0_0-1` overrides, workspace and
//! configuration values, `initial` placeholders, percentages and multi-layer
//! shadows (which are effect styles, not variables). A variable whose alias
//! target was dropped is dropped too, so every kept alias resolves.

use super::{cobalt_figma_name, LibraryCollection, LibraryVariable, VariableLibrary};
use jian_ops_schema::variable::{
    ThemedValue, VariableDefinition, VariableKind, VariableScalar, VariableValue,
};
use std::collections::BTreeMap;

const SOURCE: &str = include_str!("../../libraries/talkdesk-cobalt/TALKDESK-VARIABLES.md");
/// Theme version the source documents.
const VERSION: &str = "4.1.6";
pub(super) const PRIMITIVES: &str = "Color scheme (Primitives)";
pub(super) const THEME: &str = "Theme";
const LIGHT: &str = "Light";
const DARK: &str = "Dark";
const THEME_MODE: &str = "Talkdesk Theme";
/// Figma library keys of the two published collections.
const PRIMITIVES_KEY: &str = "ac9d7e4f4849181843d10839395415fff97524bf";
const THEME_KEY: &str = "41e63b1b4d7828889d69218999519d12dd769d25";
const KEPT_SECTIONS: &[&str] = &[
    "1.1", "1.2", "1.3", "2.", "3.1", "3.2", "3.3", "3.4", "4.", "5.", "6.", "7.1", "7.3",
];

#[derive(Debug, Clone, PartialEq)]
enum Cell {
    Alias(String),
    Literal(VariableKind, VariableScalar),
}

fn hex(raw: &str) -> Option<String> {
    let digits = raw.strip_prefix('#')?;
    if !digits.chars().all(|c| c.is_ascii_hexdigit()) {
        return None;
    }
    let expanded = match digits.len() {
        3 | 4 => digits.chars().flat_map(|c| [c, c]).collect(),
        6 | 8 => digits.to_string(),
        _ => return None,
    };
    Some(format!("#{}", expanded.to_ascii_uppercase()))
}

fn byte(value: f64) -> u8 {
    (value.clamp(0.0, 1.0) * 255.0).round() as u8
}

/// `hsla( 210deg, 20%, 15.6%, 50% )` / `rgba(0, 0, 0, 0.05)` → `#RRGGBBAA`.
fn functional_color(raw: &str) -> Option<String> {
    let (name, args) = raw.split_once('(')?;
    let parts: Vec<f64> = args
        .trim_end_matches(')')
        .split(',')
        .map(|p| {
            p.trim()
                .trim_end_matches("deg")
                .trim_end_matches('%')
                .parse()
        })
        .collect::<Result<_, _>>()
        .ok()?;
    let [a, b, c, alpha] = parts[..] else {
        return None;
    };
    let (r, g, bl, alpha) = match name.trim() {
        "rgba" => (a / 255.0, b / 255.0, c / 255.0, alpha),
        "hsla" => {
            let (h, s, l) = (a / 360.0, b / 100.0, c / 100.0);
            let q = if l < 0.5 {
                l * (1.0 + s)
            } else {
                l + s - l * s
            };
            let p = 2.0 * l - q;
            let channel = |mut t: f64| {
                t = t.rem_euclid(1.0);
                if t < 1.0 / 6.0 {
                    p + (q - p) * 6.0 * t
                } else if t < 0.5 {
                    q
                } else if t < 2.0 / 3.0 {
                    p + (q - p) * (2.0 / 3.0 - t) * 6.0
                } else {
                    p
                }
            };
            (
                channel(h + 1.0 / 3.0),
                channel(h),
                channel(h - 1.0 / 3.0),
                alpha / 100.0,
            )
        }
        _ => return None,
    };
    Some(format!(
        "#{:02X}{:02X}{:02X}{:02X}",
        byte(r),
        byte(g),
        byte(bl),
        byte(alpha)
    ))
}

fn literal(raw: &str) -> Option<Cell> {
    let color = |hex: String| Some(Cell::Literal(VariableKind::Color, VariableScalar::Str(hex)));
    if let Some(value) = hex(raw) {
        return color(value);
    }
    if raw.starts_with("hsla(") || raw.starts_with("rgba(") {
        return color(functional_color(raw)?);
    }
    let number = raw.strip_suffix("px").unwrap_or(raw);
    if let Ok(value) = number.parse::<f64>() {
        return Some(Cell::Literal(
            VariableKind::Number,
            VariableScalar::Num(value),
        ));
    }
    if raw == "initial" || raw.ends_with('%') {
        return None;
    }
    // Font family names and stacks; a lone quoted name loses its quotes.
    if let Some(name) = raw
        .strip_prefix('"')
        .and_then(|s| s.strip_suffix('"'))
        .filter(|s| !s.contains('"'))
    {
        return Some(Cell::Literal(
            VariableKind::String,
            VariableScalar::Str(name.into()),
        ));
    }
    // Space-separated values without commas are shadow offsets, not tokens.
    if raw.contains(' ') && !raw.contains(',') {
        return None;
    }
    Some(Cell::Literal(
        VariableKind::String,
        VariableScalar::Str(raw.into()),
    ))
}

/// One value cell: "`#fff`", "`#fff` → `--name`", "`14px` → `--name`".
fn cell(raw: &str) -> Option<Cell> {
    if let Some((_, target)) = raw.split_once('→') {
        let target = target.trim().trim_matches('`');
        return target
            .starts_with("--")
            .then(|| Cell::Alias(target.to_string()));
    }
    literal(raw.trim().strip_prefix('`')?.strip_suffix('`')?)
}

struct Row {
    name: String,
    light: Cell,
    dark: Cell,
    primitive: bool,
}

fn rows() -> Vec<Row> {
    let mut out = Vec::new();
    let mut section = "";
    for line in SOURCE.lines() {
        if let Some(heading) = line.strip_prefix("## ") {
            section = heading.split_whitespace().next().unwrap_or("");
            continue;
        }
        if !KEPT_SECTIONS.contains(&section) || !line.starts_with("| `--") {
            continue;
        }
        let cells: Vec<&str> = line.split('|').map(str::trim).collect();
        let (Some(name), Some(light), Some(dark)) = (cells.get(1), cells.get(3), cells.get(4))
        else {
            continue;
        };
        let (Some(light), Some(dark)) = (cell(light), cell(dark)) else {
            continue;
        };
        let primitive = section.starts_with("1.") || light != dark;
        out.push(Row {
            name: name.trim_matches('`').to_string(),
            light,
            dark,
            primitive,
        });
    }
    out
}

fn scalar(cell: &Cell) -> VariableScalar {
    match cell {
        Cell::Alias(target) => VariableScalar::Str(format!("${target}")),
        Cell::Literal(_, value) => value.clone(),
    }
}

/// Kind of a cell, following aliases through the parsed rows.
fn kind(cell: &Cell, rows: &BTreeMap<String, &Row>, depth: u8) -> Option<VariableKind> {
    match cell {
        Cell::Literal(kind, _) => Some(kind.clone()),
        Cell::Alias(target) if depth < 32 => kind(&rows.get(target)?.light, rows, depth + 1),
        Cell::Alias(_) => None,
    }
}

fn aliases(row: &Row) -> impl Iterator<Item = &String> {
    [&row.light, &row.dark].into_iter().filter_map(|c| match c {
        Cell::Alias(target) => Some(target),
        Cell::Literal(..) => None,
    })
}

fn themed(axis: &str, light: &Cell, dark: &Cell) -> VariableValue {
    let entry = |mode: &str, cell: &Cell| ThemedValue {
        value: scalar(cell),
        theme: Some(BTreeMap::from([(axis.to_string(), mode.to_string())])),
    };
    VariableValue::Themed(vec![entry(LIGHT, light), entry(DARK, dark)])
}

pub(super) fn talkdesk_cobalt() -> VariableLibrary {
    let parsed = rows();
    let mut kept: BTreeMap<String, &Row> = parsed.iter().map(|r| (r.name.clone(), r)).collect();
    // Drop rows whose alias targets were not kept, until stable.
    loop {
        let missing: Vec<String> = kept
            .values()
            .filter(|row| aliases(row).any(|t| !kept.contains_key(t)))
            .map(|row| row.name.clone())
            .collect();
        if missing.is_empty() {
            break;
        }
        for name in missing {
            kept.remove(&name);
        }
    }
    let mut variables = BTreeMap::new();
    for (name, row) in &kept {
        let Some(kind) = kind(&row.light, &kept, 0) else {
            continue;
        };
        let (collection, value) = if row.primitive {
            (PRIMITIVES, themed(PRIMITIVES, &row.light, &row.dark))
        } else {
            (THEME, VariableValue::Scalar(scalar(&row.light)))
        };
        variables.insert(
            name.clone(),
            LibraryVariable {
                name: name.clone(),
                figma_name: cobalt_figma_name(name),
                collection: collection.to_string(),
                definition: VariableDefinition { kind, value },
            },
        );
    }
    VariableLibrary {
        id: super::PREFERRED_LIBRARY_ID.to_string(),
        name: "Talkdesk Cobalt".to_string(),
        version: VERSION.to_string(),
        collections: vec![
            LibraryCollection {
                name: PRIMITIVES.to_string(),
                key: Some(PRIMITIVES_KEY.to_string()),
                modes: vec![LIGHT.to_string(), DARK.to_string()],
            },
            LibraryCollection {
                name: THEME.to_string(),
                key: Some(THEME_KEY.to_string()),
                modes: vec![THEME_MODE.to_string()],
            },
        ],
        variables,
    }
}
