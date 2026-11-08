//! In-place `$variable` reference rewriting across a node tree — used
//! when a variable is renamed or deleted.

use super::*;

/// Replace every `$old` token in the tree with `$new` (rename) or
/// its resolved concrete value (`new == None`, delete) — the TS
/// `replaceVariableRefsInTree` walk. Numeric refs that fail to
/// resolve keep the dangling token (TS keeps `val` likewise).
pub fn replace_variable_refs_in_tree(
    nodes: &mut [PenNode],
    old: &str,
    new: Option<&str>,
    vars: Option<&Vars>,
    theme: &Theme,
) {
    let token = format!("${old}");
    for node in nodes {
        replace_in_node(node, &token, new, vars, theme);
    }
}

fn replace_color(
    value: &mut String,
    token: &str,
    new: Option<&str>,
    vars: Option<&Vars>,
    theme: &Theme,
) {
    if value != token {
        return;
    }
    match new {
        Some(new) => *value = format!("${new}"),
        None => {
            if let Some(VariableScalar::Str(resolved)) = resolve_variable_ref(token, vars, theme) {
                *value = resolved;
            }
        }
    }
}

fn replace_in_node(
    node: &mut PenNode,
    token: &str,
    new: Option<&str>,
    vars: Option<&Vars>,
    theme: &Theme,
) {
    let mut local_theme;
    let theme = if let Some(overrides) = &node.base().theme {
        local_theme = theme.clone();
        local_theme.extend(overrides.clone());
        &local_theme
    } else {
        theme
    };
    if node
        .base()
        .variable_bindings
        .as_ref()
        .is_some_and(|bindings| bindings.values().any(|reference| reference == token))
    {
        if let Some(name) = new {
            if let Some(bindings) = node.base_mut().variable_bindings.as_mut() {
                for reference in bindings.values_mut() {
                    if reference == token {
                        *reference = format!("${name}");
                    }
                }
            }
        } else {
            // Materialize only the removed variable's fields, not unrelated bindings.
            let retained = node.base_mut().variable_bindings.take().unwrap_or_default();
            node.base_mut().variable_bindings = Some(
                retained
                    .iter()
                    .filter(|(_, reference)| *reference == token)
                    .map(|(property, reference)| (property.clone(), reference.clone()))
                    .collect(),
            );
            crate::design_bindings::resolve_concrete_bindings(node, vars, theme);
            let retained: std::collections::BTreeMap<_, _> = retained
                .into_iter()
                .filter(|(_, reference)| reference != token)
                .collect();
            node.base_mut().variable_bindings = if retained.is_empty() {
                None
            } else {
                Some(retained)
            };
        }
    }
    // Opacity / gap / padding expressions.
    let replace_expr = |value: &mut NumberOrExpression| {
        if let NumberOrExpression::Expression(expr) = value {
            if let Some(rewritten) = rewrite_variable_scalar(
                &VariableScalar::Str(expr.clone()),
                &token[1..],
                new,
                vars,
                theme,
            ) {
                match rewritten {
                    VariableScalar::Str(text) => *expr = text,
                    VariableScalar::Num(n) => *value = NumberOrExpression::Number(n),
                    _ => {}
                }
            }
        }
    };
    if let Some(opacity) = node.base_mut().opacity.as_mut() {
        replace_expr(opacity);
    }
    if let Some(container) = node_container_mut(node) {
        if let Some(gap) = container.gap.as_mut() {
            replace_expr(gap);
        }
        if let Some(Padding::Expression(expr)) = container.padding.as_mut() {
            if let Some(rewritten) = rewrite_variable_scalar(
                &VariableScalar::Str(expr.clone()),
                &token[1..],
                new,
                vars,
                theme,
            ) {
                match rewritten {
                    VariableScalar::Str(text) => *expr = text,
                    VariableScalar::Num(n) => container.padding = Some(Padding::Uniform(n)),
                    _ => {}
                }
            }
        }
    }
    // Fills + stroke fills + shadow colours.
    if let Some(fills) = node_fills_opt_mut(node) {
        for fill in fills {
            replace_in_fill(fill, token, new, vars, theme);
        }
    }
    if let Some(stroke) = node_stroke_mut(node) {
        if let Some(stroke) = stroke.as_mut() {
            if let Some(fills) = stroke.fill.as_mut() {
                for fill in fills {
                    replace_in_fill(fill, token, new, vars, theme);
                }
            }
        }
    }
    if let Some(effects) = node_effects_opt_mut(node) {
        for effect in effects {
            if let PenEffect::Shadow(body) = effect {
                replace_color(&mut body.color, token, new, vars, theme);
            }
        }
    }
    // Text content + styled segment fills.
    if let PenNode::Text(text) = node {
        if let Some(FontWeight::Keyword(keyword)) = &text.font_weight {
            if keyword == token {
                text.font_weight = match new {
                    Some(name) => Some(FontWeight::Keyword(format!("${name}"))),
                    None => resolve_numeric_ref(token, vars, theme)
                        .map(|n| FontWeight::Number(n.round().clamp(1.0, 1000.0) as u32)),
                };
            }
        }
        match &mut text.content {
            TextContent::Plain(content) => {
                if content == token {
                    match new {
                        Some(new) => *content = format!("${new}"),
                        None => {
                            if let Some(VariableScalar::Str(resolved)) =
                                resolve_variable_ref(token, vars, theme)
                            {
                                *content = resolved;
                            }
                        }
                    }
                }
            }
            TextContent::Styled(segments) => {
                for segment in segments {
                    if let Some(fill) = segment.fill.as_mut() {
                        replace_color(fill, token, new, vars, theme);
                    }
                }
            }
        }
    }
    if let Some(children) = node.children_mut() {
        for child in children {
            replace_in_node(child, token, new, vars, theme);
        }
    }
}

fn replace_in_fill(
    fill: &mut PenFill,
    token: &str,
    new: Option<&str>,
    vars: Option<&Vars>,
    theme: &Theme,
) {
    match fill {
        PenFill::Solid(body) => replace_color(&mut body.color, token, new, vars, theme),
        PenFill::LinearGradient(body) => {
            for stop in &mut body.stops {
                replace_color(&mut stop.color, token, new, vars, theme);
            }
        }
        PenFill::RadialGradient(body) => {
            for stop in &mut body.stops {
                replace_color(&mut stop.color, token, new, vars, theme);
            }
        }
        _ => {}
    }
}

/// Shared mutable access to the `ContainerProps` of the variants
/// that carry one (Frame / Group / Rectangle).
pub(super) fn node_container_mut(
    node: &mut PenNode,
) -> Option<&mut jian_ops_schema::node::container::ContainerProps> {
    match node {
        PenNode::Frame(n) => Some(&mut n.container),
        PenNode::Group(n) => Some(&mut n.container),
        PenNode::Rectangle(n) => Some(&mut n.container),
        _ => None,
    }
}
