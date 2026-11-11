//! Report limited token evidence without treating local styling as an error.

use std::collections::{BTreeMap, BTreeSet};

use jian_ops_schema::node::{ContainerProps, NumberOrExpression, Padding, PenNode};
use jian_ops_schema::style::PenFill;
use jian_ops_schema::variable::{VariableKind, VariableScalar};
use op_editor_core::variables_resolve::{effective_theme, resolve_variable_ref_checked};
use op_editor_core::{EditorState, PenNodeExt};
use serde_json::{json, Value};

type Theme = BTreeMap<String, String>;
type ResolvedTokens = Vec<(String, VariableKind, VariableScalar)>;

pub(crate) fn observe(state: &EditorState, scope: Option<&BTreeSet<String>>) -> Vec<Value> {
    let mut theme = effective_theme(&state.doc, &state.ui.variables.active_theme);
    if let Some(overrides) = state.doc.pages.as_ref().and_then(|pages| {
        pages
            .get(
                state
                    .ui
                    .active_page_index
                    .min(pages.len().saturating_sub(1)),
            )
            .and_then(|page| page.theme.as_ref())
    }) {
        theme.extend(overrides.clone());
    }
    let mut audit = Audit {
        state,
        scope,
        tokens: BTreeMap::new(),
        observations: Vec::new(),
    };
    for node in state.active_children() {
        audit.visit(node, &theme);
    }
    audit.observations
}

struct Audit<'a> {
    state: &'a EditorState,
    scope: Option<&'a BTreeSet<String>>,
    tokens: BTreeMap<Theme, ResolvedTokens>,
    observations: Vec<Value>,
}

impl Audit<'_> {
    fn visit(&mut self, node: &PenNode, inherited: &Theme) {
        let mut theme = inherited.clone();
        if let Some(overrides) = &node.base().theme {
            theme.extend(overrides.clone());
        }
        if self.scope.is_none_or(|ids| ids.contains(node.id_str())) {
            match node {
                PenNode::Text(text) => {
                    if let Some(size) = text.font_size {
                        self.number(node, "fontSize", size, &theme);
                    }
                    self.fills(node, text.fill.as_deref(), &theme);
                }
                PenNode::Frame(frame) => self.container(node, &frame.container, &theme),
                PenNode::Group(group) => self.container(node, &group.container, &theme),
                PenNode::Rectangle(rectangle) => self.container(node, &rectangle.container, &theme),
                PenNode::Ref(reference) => {
                    for id in reference.descendants.iter().flat_map(|items| items.keys()) {
                        self.observations.push(json!({
                            "nodeId": node.id_str(), "property": format!("descendants.{id}"),
                            "status": "local-override", "severity": "info",
                            "evidence": "The component instance contains a local descendant override.",
                            "suggestion": "Preserve the override unless the user asks to change it or restore inheritance.",
                        }));
                    }
                }
                _ => {}
            }
        }
        for child in node.children().into_iter().flatten() {
            self.visit(child, &theme);
        }
    }

    fn container(&mut self, node: &PenNode, container: &ContainerProps, theme: &Theme) {
        if let Some(NumberOrExpression::Number(gap)) = &container.gap {
            self.number(node, "gap", *gap, theme);
        }
        match &container.padding {
            Some(Padding::Uniform(value)) => self.number(node, "padding", *value, theme),
            Some(Padding::XY(values)) => {
                for (i, value) in values.iter().enumerate() {
                    self.number(node, &format!("padding.{i}"), *value, theme);
                }
            }
            Some(Padding::LtrB(values)) => {
                for (i, value) in values.iter().enumerate() {
                    self.number(node, &format!("padding.{i}"), *value, theme);
                }
            }
            _ => {}
        }
        self.fills(node, container.fill.as_deref(), theme);
    }

    fn number(&mut self, node: &PenNode, property: &str, value: f64, theme: &Theme) {
        self.literal(
            node,
            property,
            VariableKind::Number,
            VariableScalar::Num(value),
            theme,
        );
    }

    fn fills(&mut self, node: &PenNode, fills: Option<&[PenFill]>, theme: &Theme) {
        for (index, fill) in fills.into_iter().flatten().enumerate() {
            if let PenFill::Solid(solid) = fill {
                if solid.color.starts_with('$') {
                    continue;
                }
                self.literal(
                    node,
                    &format!("fill.{index}.color"),
                    VariableKind::Color,
                    VariableScalar::Str(solid.color.clone()),
                    theme,
                );
            }
        }
    }

    fn literal(
        &mut self,
        node: &PenNode,
        property: &str,
        kind: VariableKind,
        value: VariableScalar,
        theme: &Theme,
    ) {
        if node
            .base()
            .variable_bindings
            .as_ref()
            .is_some_and(|bindings| {
                bindings.contains_key(property)
                    || bindings.contains_key(property.split('.').next().unwrap_or(property))
            })
        {
            return;
        }
        let variables = self.state.doc.variables.as_ref();
        let tokens = self.tokens.entry(theme.clone()).or_insert_with(|| {
            variables
                .into_iter()
                .flat_map(|items| items.iter())
                .filter_map(|(name, definition)| {
                    resolve_variable_ref_checked(&format!("${name}"), variables, theme)
                        .ok()
                        .map(|resolved| (name.clone(), definition.kind.clone(), resolved))
                })
                .collect()
        });
        let candidates: Vec<_> = tokens
            .iter()
            .filter(|(_, candidate_kind, candidate)| {
                *candidate_kind == kind && same_literal(candidate, &value)
            })
            .take(16)
            .map(|(name, _, _)| name.clone())
            .collect();
        let matched = !candidates.is_empty();
        self.observations.push(json!({
            "nodeId": node.id_str(), "property": property,
            "status": if matched { "unbound-match" } else { "indeterminate" }, "severity": "info",
            "evidence": if matched { "An unbound literal equals one or more active document variable values; matching values do not prove the same semantic role." }
                        else { "No equal active document variable value was found; the intended token or local override cannot be determined." },
            "suggestion": if matched { "Review the candidate tokens and bind one only if its role matches the design." }
                          else { "Review the selected style and preserve intentional local values." },
            "candidates": candidates,
        }));
    }
}

fn same_literal(a: &VariableScalar, b: &VariableScalar) -> bool {
    match (a, b) {
        (VariableScalar::Num(a), VariableScalar::Num(b)) => a == b,
        (VariableScalar::Str(a), VariableScalar::Str(b)) => a.eq_ignore_ascii_case(b),
        _ => false,
    }
}
