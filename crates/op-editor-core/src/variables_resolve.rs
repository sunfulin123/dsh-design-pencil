//! Render-time `$variable` resolution — the canonical port of
//! `pen-core/src/variables/resolve.ts` (resolveNodeForCanvas) and
//! `pen-core/src/variables/replace-refs.ts` (replaceVariableRefsInTree).
//!
//! The scene builder calls [`resolve_document_for_canvas`] before the
//! jian layout pass so every `$token` in the tree — solid fill /
//! gradient-stop / stroke / shadow colours, opacity / gap / padding
//! expressions, font-weight keywords, and `$text` content — lands as
//! a concrete value the painters and the flex solver can consume.
//! Tokens missing from the document's variable table fall back to the
//! built-in semantic palette ([`DEFAULT_PALETTE_FALLBACK`]) so AI
//! "system mode" output renders sensibly on un-seeded documents (TS
//! spec §5.3).
//!
//! Stays wasm-clean: plain data walks over `jian_ops_schema` types.
//! Numeric fields also accept bounded `calc(...)` arithmetic. Aliases and
//! formulas resolve through this same variable resolver, and persisted node
//! `theme` overrides inherit through the tree. Authored expressions never
//! become destructively materialized during a render.
//!
//! ### Module layout
//!
//! This file is the spine: the resolver walks themselves. Two chunks
//! live in sibling submodules (per the 800-line-per-file ceiling) and
//! are re-exported here, so every existing `variables_resolve::*`
//! import path still resolves:
//!
//! - `palette` — the generated [`DEFAULT_PALETTE_FALLBACK`] table
//! - `replace` — [`replace_variable_refs_in_tree`] and its walk

mod evaluation;
mod palette;
mod reference_rewrite;
mod replace;
pub(crate) use evaluation::is_formula_identifier_byte;
pub use evaluation::{evaluate_formula, is_formula, VariableResolveError};
pub use reference_rewrite::rewrite_variable_scalar;
#[cfg(test)]
mod tests;

pub(crate) use palette::{FallbackValue, DEFAULT_PALETTE_FALLBACK, LEGACY_PALETTE_FALLBACK};
use replace::node_container_mut;
pub use replace::replace_variable_refs_in_tree;

use std::collections::BTreeMap;

use jian_ops_schema::node::base::NumberOrExpression;
use jian_ops_schema::node::container::Padding;
use jian_ops_schema::node::text::{FontWeight, TextContent};
use jian_ops_schema::node::PenNode;
use jian_ops_schema::style::{PenEffect, PenFill};
use jian_ops_schema::variable::{VariableDefinition, VariableScalar, VariableValue};
use jian_ops_schema::PenDocument;

use crate::fills::{node_effects_opt_mut, node_fills_opt_mut, node_stroke_mut};
use crate::pen_node_ext::PenNodeExt;

type Vars = BTreeMap<String, VariableDefinition>;
type Theme = BTreeMap<String, String>;

/// True when `value` is a `$variable` reference string.
pub fn is_variable_ref(value: &str) -> bool {
    value.starts_with('$') && value.len() > 1
}

/// Default theme map: first value per axis (TS `getDefaultTheme`).
pub fn default_theme(themes: Option<&BTreeMap<String, Vec<String>>>) -> Theme {
    let mut out = Theme::new();
    if let Some(themes) = themes {
        for (axis, values) in themes {
            if let Some(first) = values.first() {
                out.insert(axis.clone(), first.clone());
            }
        }
    }
    out
}

/// The theme map the renderer resolves against: the document's
/// default theme (first value per axis) with the user's transient
/// axis selections layered on top. Guarantees every axis has a value
/// even right after load, when the editor's `active_theme` is empty —
/// the fix for the "fully-themed value lists resolve to None until
/// the user picks an axis" gap.
pub fn effective_theme(doc: &PenDocument, active: &Theme) -> Theme {
    let mut theme = default_theme(doc.themes.as_ref());
    if let Some(overrides) = &doc.theme {
        theme.extend(overrides.clone());
    }
    for (axis, value) in active {
        theme.insert(axis.clone(), value.clone());
    }
    theme
}

/// Pick the concrete scalar from a themed list for the given theme
/// Prefer the most specific matching selector, then an unthemed default,
/// then the first entry. Unrelated axes do not suppress a selector match.
pub fn resolve_themed_value<'a>(
    values: &'a [jian_ops_schema::variable::ThemedValue],
    theme: &Theme,
) -> Option<&'a VariableScalar> {
    let mut best = None;
    let mut specificity = 0;
    for value in values {
        if let Some(t) = &value.theme {
            if !t.is_empty()
                && t.iter()
                    .all(|(axis, expected)| theme.get(axis) == Some(expected))
                && (best.is_none() || t.len() > specificity)
            {
                best = Some(&value.value);
                specificity = t.len();
            }
        }
    }
    best.or_else(|| {
        values
            .iter()
            .find(|v| v.theme.is_none())
            .or_else(|| values.first())
            .map(|v| &v.value)
    })
}

/// Whether the built-in semantic palette (shadcn dictionary, or the
/// legacy `color-*` compat table) can answer `name` on its own — a
/// reference the document's own table does not define is not
/// necessarily broken. Callers that repair broken references ask this
/// first.
pub fn has_palette_fallback(name: &str) -> bool {
    palette_fallback(name).is_some()
}

/// Look a token up in the fallback tables: the shadcn dictionary
/// first, then the legacy `color-*` compat table.
fn palette_fallback(name: &str) -> Option<&'static FallbackValue> {
    let find = |table: &'static [(&'static str, FallbackValue)]| {
        table
            .iter()
            .find(|(token, _)| *token == name)
            .map(|(_, value)| value)
    };
    find(DEFAULT_PALETTE_FALLBACK).or_else(|| find(LEGACY_PALETTE_FALLBACK))
}

/// Materialize a fallback entry for the active theme (Light/Dark pair
/// keyed off `Mode`, single value, or number).
fn fallback_scalar(fallback: &FallbackValue, theme: &Theme) -> VariableScalar {
    match fallback {
        FallbackValue::Single(hex) => VariableScalar::Str((*hex).to_string()),
        FallbackValue::Num(n) => VariableScalar::Num(*n),
        FallbackValue::LightDark { light, dark } => {
            let mode = theme.get("Mode").map(String::as_str).unwrap_or("Light");
            let hex = if mode == "Dark" { dark } else { light };
            VariableScalar::Str((*hex).to_string())
        }
    }
}

/// Resolve a single `$name` reference to its concrete scalar
/// (TS `resolveVariableRef`). Unknown tokens consult the built-in
/// semantic palette. Alias chains and numeric formulas share a bounded
/// recursion guard; malformed, cyclic and incompatible values resolve to None.
pub fn resolve_variable_ref(
    reference: &str,
    vars: Option<&Vars>,
    theme: &Theme,
) -> Option<VariableScalar> {
    resolve_variable_ref_checked(reference, vars, theme).ok()
}

/// Typed resolver used by token import and formula/binding validation.
pub fn resolve_variable_ref_checked(
    reference: &str,
    vars: Option<&Vars>,
    theme: &Theme,
) -> Result<VariableScalar, VariableResolveError> {
    resolve_reference(reference, vars, theme, &mut Vec::new())
}

fn resolve_reference(
    reference: &str,
    vars: Option<&Vars>,
    theme: &Theme,
    stack: &mut Vec<String>,
) -> Result<VariableScalar, VariableResolveError> {
    let name = reference
        .strip_prefix('$')
        .filter(|s| !s.is_empty())
        .ok_or_else(|| VariableResolveError::Missing(reference.into()))?;
    if stack.len() >= 64 {
        return Err(VariableResolveError::DepthLimit);
    }
    if stack.iter().any(|s| s == name) {
        return Err(VariableResolveError::Cycle(name.into()));
    }
    let def = vars.and_then(|v| v.get(name));
    let Some(def) = def else {
        let fallback =
            palette_fallback(name).ok_or_else(|| VariableResolveError::Missing(name.into()))?;
        return Ok(fallback_scalar(fallback, theme));
    };
    let scalar = match &def.value {
        VariableValue::Scalar(s) => s,
        VariableValue::Themed(entries) => resolve_themed_value(entries, theme)
            .ok_or_else(|| VariableResolveError::Missing(name.into()))?,
    };
    stack.push(name.into());
    let result = match scalar {
        VariableScalar::Str(s) if is_variable_ref(s) => resolve_reference(s, vars, theme, stack),
        VariableScalar::Str(s)
            if is_formula(s) && def.kind == jian_ops_schema::variable::VariableKind::Number =>
        {
            evaluate_formula(s, &mut |reference| match resolve_reference(
                reference, vars, theme, stack,
            )? {
                VariableScalar::Num(value) => Ok(value),
                _ => Err(VariableResolveError::TypeMismatch(reference.into())),
            })
            .map(VariableScalar::Num)
        }
        VariableScalar::Num(n) if !n.is_finite() => Err(VariableResolveError::NonFinite),
        other => Ok(other.clone()),
    };
    stack.pop();
    let value = result?;
    use jian_ops_schema::variable::VariableKind as K;
    if !matches!(
        (&def.kind, &value),
        (K::Number, VariableScalar::Num(_))
            | (K::Boolean, VariableScalar::Bool(_))
            | (K::String | K::Color, VariableScalar::Str(_))
    ) {
        return Err(VariableResolveError::TypeMismatch(name.into()));
    }
    Ok(value)
}

fn resolve_numeric_expression(expression: &str, vars: Option<&Vars>, theme: &Theme) -> Option<f64> {
    if is_formula(expression) {
        evaluate_formula(
            expression,
            &mut |reference| match resolve_variable_ref_checked(reference, vars, theme)? {
                VariableScalar::Num(value) => Ok(value),
                _ => Err(VariableResolveError::TypeMismatch(reference.into())),
            },
        )
        .ok()
    } else {
        resolve_numeric_ref(expression, vars, theme)
    }
}

/// Resolve a colour string that may be a `$ref`; non-refs pass
/// through unchanged (TS `resolveColorRef`).
pub fn resolve_color_ref(color: &str, vars: Option<&Vars>, theme: &Theme) -> Option<String> {
    if !is_variable_ref(color) {
        return Some(color.to_string());
    }
    match resolve_variable_ref(color, vars, theme)? {
        VariableScalar::Str(s) => Some(s),
        _ => None,
    }
}

/// Resolve a numeric `$ref` to f64 (TS `resolveNumericRef`).
pub fn resolve_numeric_ref(reference: &str, vars: Option<&Vars>, theme: &Theme) -> Option<f64> {
    match resolve_variable_ref(reference, vars, theme)? {
        VariableScalar::Num(n) => Some(n),
        _ => None,
    }
}

fn resolve_fill(fill: &mut PenFill, vars: Option<&Vars>, theme: &Theme) -> bool {
    let mut changed = false;
    let fix = |color: &mut String| {
        if is_variable_ref(color) {
            // TS falls back to #000000 for an unresolvable fill ref.
            *color = resolve_color_ref(color, vars, theme).unwrap_or_else(|| "#000000".into());
            true
        } else {
            false
        }
    };
    match fill {
        PenFill::Solid(body) => changed |= fix(&mut body.color),
        PenFill::LinearGradient(body) => {
            for stop in &mut body.stops {
                changed |= fix(&mut stop.color);
            }
        }
        PenFill::RadialGradient(body) => {
            for stop in &mut body.stops {
                changed |= fix(&mut stop.color);
            }
        }
        _ => {}
    }
    changed
}

fn resolve_number_or_expression(
    value: &mut NumberOrExpression,
    vars: Option<&Vars>,
    theme: &Theme,
    fallback: f64,
) -> bool {
    if let NumberOrExpression::Expression(expr) = value {
        if is_variable_ref(expr) || is_formula(expr) {
            let resolved = resolve_numeric_expression(expr, vars, theme).unwrap_or(fallback);
            *value = NumberOrExpression::Number(resolved);
            return true;
        }
    }
    false
}

/// Resolve every `$variable` reference in `node` (and its subtree)
/// in place — the TS `resolveNodeForCanvas` walk. Returns whether
/// anything changed.
pub fn resolve_node_for_canvas(node: &mut PenNode, vars: Option<&Vars>, theme: &Theme) -> bool {
    let mut local_theme;
    let theme = if let Some(overrides) = &node.base().theme {
        local_theme = theme.clone();
        local_theme.extend(overrides.clone());
        &local_theme
    } else {
        theme
    };
    let mut changed = crate::design_bindings::resolve_concrete_bindings(node, vars, theme);

    // Opacity — `NumberOrExpression` on the shared base.
    if let Some(opacity) = node.base_mut().opacity.as_mut() {
        changed |= resolve_number_or_expression(opacity, vars, theme, 1.0);
    }

    // Container gap + padding (Frame / Group / Rectangle).
    if let Some(container) = node_container_mut(node) {
        if let Some(gap) = container.gap.as_mut() {
            changed |= resolve_number_or_expression(gap, vars, theme, 0.0);
        }
        if let Some(Padding::Expression(expr)) = container.padding.as_ref() {
            if is_variable_ref(expr) || is_formula(expr) {
                let resolved = resolve_numeric_expression(expr, vars, theme).unwrap_or(0.0);
                container.padding = Some(Padding::Uniform(resolved));
                changed = true;
            }
        }
    }

    // Fills — solid colours + gradient stops.
    if let Some(fills) = node_fills_opt_mut(node) {
        for fill in fills {
            changed |= resolve_fill(fill, vars, theme);
        }
    }

    // Stroke fill colours (thickness stays — the schema carries it
    // as concrete numbers only; a `$ref` thickness cannot round-trip
    // through `jian_ops_schema` today).
    if let Some(stroke_slot) = node_stroke_mut(node) {
        if let Some(stroke) = stroke_slot.as_mut() {
            if let Some(fills) = stroke.fill.as_mut() {
                for fill in fills {
                    changed |= resolve_fill(fill, vars, theme);
                }
            }
        }
    }

    // Effects — shadow colour (`offset/blur/spread` are concrete f32
    // in the schema; numeric effect refs land with the schema bump).
    if let Some(effects) = node_effects_opt_mut(node) {
        for effect in effects {
            if let PenEffect::Shadow(body) = effect {
                if is_variable_ref(&body.color) {
                    body.color = resolve_color_ref(&body.color, vars, theme)
                        .unwrap_or_else(|| "#000000".into());
                    changed = true;
                }
            }
        }
    }

    // Text — `$token` content, `$ref` font-weight keyword, styled
    // segment fills.
    if let PenNode::Text(text) = node {
        match &mut text.content {
            TextContent::Plain(content) => {
                if is_variable_ref(content) {
                    if let Some(VariableScalar::Str(resolved)) =
                        resolve_variable_ref(content, vars, theme)
                    {
                        *content = resolved;
                        changed = true;
                    }
                }
            }
            TextContent::Styled(segments) => {
                for segment in segments {
                    if let Some(fill) = segment.fill.as_mut() {
                        if is_variable_ref(fill) {
                            *fill = resolve_color_ref(fill, vars, theme)
                                .unwrap_or_else(|| "#000000".into());
                            changed = true;
                        }
                    }
                }
            }
        }
        if let Some(FontWeight::Keyword(keyword)) = text.font_weight.as_ref() {
            if is_variable_ref(keyword) {
                if let Some(weight) = resolve_numeric_ref(keyword, vars, theme) {
                    text.font_weight = Some(FontWeight::Number(weight.round().max(1.0) as u32));
                    changed = true;
                }
            }
        }
    }

    // Recurse.
    if let Some(children) = node.children_mut() {
        for child in children {
            changed |= resolve_node_for_canvas(child, vars, theme);
        }
    }
    changed
}

/// True when a canvas-root list contains any `$token` that
/// [`resolve_node_for_canvas`] would resolve.
///
/// This page-scoped detector lets render hosts prepare only the active page
/// instead of scanning and cloning every inactive page on a page switch.
pub fn roots_have_tokens(nodes: &[PenNode]) -> bool {
    fn fill_has_token(fill: &PenFill) -> bool {
        match fill {
            PenFill::Solid(body) => is_variable_ref(&body.color),
            PenFill::LinearGradient(body) => body.stops.iter().any(|s| is_variable_ref(&s.color)),
            PenFill::RadialGradient(body) => body.stops.iter().any(|s| is_variable_ref(&s.color)),
            _ => false,
        }
    }
    fn expr_has_token(value: &NumberOrExpression) -> bool {
        matches!(value, NumberOrExpression::Expression(e) if is_variable_ref(e) || is_formula(e))
    }
    fn container_has_token(container: &jian_ops_schema::node::container::ContainerProps) -> bool {
        container.gap.as_ref().is_some_and(expr_has_token)
            || matches!(&container.padding, Some(Padding::Expression(e)) if is_variable_ref(e) || is_formula(e))
    }
    fn node_has_token(node: &PenNode) -> bool {
        let base = crate::pen_node_ext::PenNodeExt::base(node);
        if base
            .variable_bindings
            .as_ref()
            .is_some_and(|bindings| !bindings.is_empty())
        {
            return true;
        }
        if base.opacity.as_ref().is_some_and(expr_has_token) {
            return true;
        }
        if let Some(fills) = crate::fills::node_fills(node) {
            if fills.iter().any(fill_has_token) {
                return true;
            }
        }
        if crate::fills::node_stroke_fills(node)
            .is_some_and(|fills| fills.iter().any(fill_has_token))
        {
            return true;
        }
        for effect in crate::fills::node_effects(node) {
            if let PenEffect::Shadow(body) = effect {
                if is_variable_ref(&body.color) {
                    return true;
                }
            }
        }
        let container_token = match node {
            PenNode::Frame(n) => container_has_token(&n.container),
            PenNode::Group(n) => container_has_token(&n.container),
            PenNode::Rectangle(n) => container_has_token(&n.container),
            _ => false,
        };
        if container_token {
            return true;
        }
        if let PenNode::Text(text) = node {
            let content_token = match &text.content {
                TextContent::Plain(content) => is_variable_ref(content),
                TextContent::Styled(segments) => segments
                    .iter()
                    .any(|s| s.fill.as_deref().is_some_and(is_variable_ref)),
            };
            if content_token
                || matches!(&text.font_weight, Some(FontWeight::Keyword(k)) if is_variable_ref(k))
            {
                return true;
            }
        }
        crate::pen_node_ext::PenNodeExt::children(node)
            .is_some_and(|children| children.iter().any(node_has_token))
    }
    nodes.iter().any(node_has_token)
}

/// True when any `$token` exists anywhere `resolve_node_for_canvas`
/// would look — the scene builder's early-out so token-free documents
/// (the common case) skip the resolution pass's full-tree clone.
pub fn document_has_tokens(doc: &PenDocument) -> bool {
    doc.pages
        .as_ref()
        .is_some_and(|pages| pages.iter().any(|p| roots_have_tokens(&p.children)))
        || roots_have_tokens(&doc.children)
}

/// Resolve `$token`s in one canvas-root list against the variable and theme
/// metadata in the whole document. Unlike [`resolve_document_for_canvas`],
/// this does not clone or walk inactive pages.
pub fn resolve_roots_for_canvas(nodes: &mut [PenNode], doc: &PenDocument, active: &Theme) {
    let theme = effective_theme(doc, active);
    let vars = doc.variables.as_ref();
    for node in nodes {
        resolve_node_for_canvas(node, vars, &theme);
    }
}

/// Clone `doc` with every `$variable` reference resolved against the
/// document's variable table under `active` (merged over the default
/// theme). The scene builder feeds the resolved clone to the layout +
/// paint pipeline so loaded documents render their `$refs` without
/// any transient editor cache.
pub fn resolve_document_for_canvas(doc: &PenDocument, active: &Theme) -> PenDocument {
    let theme = effective_theme(doc, active);
    let mut resolved = doc.clone();
    let vars = doc.variables.as_ref();
    if let Some(pages) = resolved.pages.as_mut() {
        for page in pages {
            let mut page_theme = theme.clone();
            if let Some(overrides) = &page.theme {
                page_theme.extend(overrides.clone());
            }
            for node in &mut page.children {
                resolve_node_for_canvas(node, vars, &page_theme);
            }
        }
    }
    for node in &mut resolved.children {
        resolve_node_for_canvas(node, vars, &theme);
    }
    resolved
}
