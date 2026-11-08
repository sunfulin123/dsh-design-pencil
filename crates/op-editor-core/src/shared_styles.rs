//! Shared styles write canonical authored node data; the renderer needs no
//! parallel style resolver. Membership and definitions live in the document.
//! Updates replace all style-owned properties (removed keys reset to null).
//! Applying a style detaches previous styles of the same kind. Deleting or
//! detaching leaves the node's current authored appearance intact. Virtual
//! instance children are deliberately rejected rather than mutated indirectly.

use crate::variables_resolve::{effective_theme, resolve_variable_ref_checked};
use crate::{EditorCommand, EditorState, NodeId, PenNodeExt};
use jian_ops_schema::node::PenNode;
use jian_ops_schema::style::{SharedStyle, SharedStyleKind};
use serde_json::{Map, Value};
use std::collections::{BTreeMap, BTreeSet};
use std::fmt;

#[derive(Debug, Clone, PartialEq)]
pub enum SharedStyleOperation {
    Create { id: String, style: SharedStyle },
    Update { id: String, style: SharedStyle },
    Apply { id: String, node_ids: Vec<String> },
    Detach { id: String, node_ids: Vec<String> },
    Delete { id: String },
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum SharedStyleError {
    NotFound(String),
    InvalidStyle(String),
    InvalidTarget(String),
    DuplicateId(String),
}

impl fmt::Display for SharedStyleError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::NotFound(id) => write!(f, "shared style {id:?} does not exist"),
            Self::InvalidStyle(reason) => write!(f, "invalid shared style: {reason}"),
            Self::InvalidTarget(id) => write!(f, "node {id:?} is missing, locked, or incompatible"),
            Self::DuplicateId(id) => write!(f, "duplicate id {id:?}"),
        }
    }
}

impl std::error::Error for SharedStyleError {}

fn permitted(kind: SharedStyleKind, key: &str) -> bool {
    match kind {
        SharedStyleKind::Paint => matches!(key, "fill" | "stroke"),
        SharedStyleKind::Effect => key == "effects",
        SharedStyleKind::Text => matches!(
            key,
            "fontFamily"
                | "fontSize"
                | "fontWeight"
                | "fontStyle"
                | "underline"
                | "strikethrough"
                | "lineHeight"
                | "letterSpacing"
                | "textAlign"
                | "textAlignVertical"
                | "textGrowth"
        ),
    }
}

fn same_value(left: &Value, right: &Value) -> bool {
    match (left, right) {
        (Value::Number(a), Value::Number(b)) => a.as_f64() == b.as_f64(),
        (Value::Array(a), Value::Array(b)) => {
            a.len() == b.len() && a.iter().zip(b).all(|(a, b)| same_value(a, b))
        }
        (Value::Object(a), Value::Object(b)) => {
            a.len() == b.len()
                && a.iter()
                    .all(|(k, v)| b.get(k).is_some_and(|b| same_value(v, b)))
        }
        _ => left == right,
    }
}

fn validate_values(value: &Value, key: &str) -> Result<(), SharedStyleError> {
    if matches!(key, "radius" | "blur") && value.as_f64().is_some_and(|n| !n.is_finite() || n < 0.0)
    {
        return Err(SharedStyleError::InvalidStyle(format!(
            "{key} must be nonnegative"
        )));
    }
    match value {
        Value::String(s) if s.starts_with('$') => {
            if !matches!(key, "color" | "fontWeight") {
                return Err(SharedStyleError::InvalidStyle(format!(
                    "variable binding is not rendered for {key}"
                )));
            }
        }
        Value::String(s) if key == "color" => {
            if !s.strip_prefix('#').is_some_and(|hex| {
                matches!(hex.len(), 3 | 6 | 8) && hex.bytes().all(|c| c.is_ascii_hexdigit())
            }) {
                return Err(SharedStyleError::InvalidStyle(format!(
                    "invalid hex color {s:?}"
                )));
            }
        }
        Value::Array(values) => {
            for value in values {
                validate_values(value, key)?;
            }
        }
        Value::Object(values) => {
            for (key, value) in values {
                validate_values(value, key)?;
            }
        }
        _ => {}
    }
    Ok(())
}

fn validate_references(
    value: &Value,
    key: &str,
    state: &EditorState,
    theme: &BTreeMap<String, String>,
) -> Result<(), SharedStyleError> {
    match value {
        Value::String(s) if s.starts_with('$') => {
            let resolved = resolve_variable_ref_checked(s, state.doc.variables.as_ref(), theme)
                .map_err(|e| SharedStyleError::InvalidStyle(e.to_string()))?;
            if key == "color" {
                if let jian_ops_schema::variable::VariableScalar::Str(color) = &resolved {
                    validate_values(&Value::String(color.clone()), "color")?;
                }
            }
            if !matches!(
                (key, resolved),
                ("color", jian_ops_schema::variable::VariableScalar::Str(_))
                    | (
                        "fontWeight",
                        jian_ops_schema::variable::VariableScalar::Num(_)
                    )
            ) {
                return Err(SharedStyleError::InvalidStyle(format!(
                    "incompatible variable {s} for {key}"
                )));
            }
        }
        Value::Array(values) => {
            for value in values {
                validate_references(value, key, state, theme)?;
            }
        }
        Value::Object(values) => {
            for (key, value) in values {
                validate_references(value, key, state, theme)?;
            }
        }
        _ => {}
    }
    Ok(())
}

fn inherited_theme(
    nodes: &[PenNode],
    id: &str,
    parent: &BTreeMap<String, String>,
) -> Option<BTreeMap<String, String>> {
    for node in nodes {
        let mut theme = parent.clone();
        if let Some(overrides) = &node.base().theme {
            theme.extend(overrides.clone());
        }
        if node.base().id == id {
            return Some(theme);
        }
        if let Some(children) = node.children() {
            if let Some(theme) = inherited_theme(children, id, &theme) {
                return Some(theme);
            }
        }
    }
    None
}

/// Validate against the same canonical node schema that accepts authored
/// patches, with a closed property set preventing unrelated node mutations.
pub fn validate_shared_style(style: &SharedStyle) -> Result<(), SharedStyleError> {
    if style.name.trim().is_empty() || style.properties.is_empty() {
        return Err(SharedStyleError::InvalidStyle(
            "name and properties must not be empty".into(),
        ));
    }
    for (key, value) in &style.properties {
        if !permitted(style.kind, key) {
            return Err(SharedStyleError::InvalidStyle(format!(
                "{key:?} is not a {:?} property",
                style.kind
            )));
        }
        validate_values(value, key)?;
        if key == "fontSize" && value.as_f64().is_some_and(|v| !v.is_finite() || v <= 0.0) {
            return Err(SharedStyleError::InvalidStyle(format!(
                "{key} must be positive"
            )));
        }
        if key == "lineHeight"
            && value.as_f64().is_some_and(|v| {
                jian_ops_schema::node::text::canonical_line_height_multiplier(Some(v)).is_none()
            })
        {
            return Err(SharedStyleError::InvalidStyle(
                "lineHeight must be a unitless multiplier in (0, 4]".into(),
            ));
        }
    }
    let mut probe = serde_json::json!({"type":"rectangle","id":"style-probe","width":1,"height":1});
    if style.kind == SharedStyleKind::Text {
        probe = serde_json::json!({"type":"text","id":"style-probe","content":""});
    }
    for (key, value) in &style.properties {
        probe[key] = value.clone();
    }
    serde_json::from_value::<PenNode>(probe)
        .map_err(|e| SharedStyleError::InvalidStyle(e.to_string()))?;
    Ok(())
}

#[derive(Clone)]
struct Target {
    page: Option<usize>,
    node: PenNode,
}

fn targets(state: &EditorState) -> Result<BTreeMap<String, Target>, SharedStyleError> {
    fn walk(
        nodes: &[PenNode],
        page: Option<usize>,
        out: &mut BTreeMap<String, Target>,
    ) -> Result<(), SharedStyleError> {
        for node in nodes {
            let id = node.base().id.clone();
            if out
                .insert(
                    id.clone(),
                    Target {
                        page,
                        node: node.clone(),
                    },
                )
                .is_some()
            {
                return Err(SharedStyleError::DuplicateId(id));
            }
            if let Some(children) = node.children() {
                walk(children, page, out)?;
            }
        }
        Ok(())
    }
    let mut out = BTreeMap::new();
    walk(&state.doc.children, None, &mut out)?;
    if let Some(pages) = &state.doc.pages {
        for (i, page) in pages.iter().enumerate() {
            walk(&page.children, Some(i), &mut out)?;
        }
    }
    Ok(out)
}

fn patch_target(
    state: &mut EditorState,
    target: &Target,
    id: &str,
    patch: &Map<String, Value>,
) -> Result<(), SharedStyleError> {
    let original_page = state.ui.active_page_index;
    let legacy_pages = if target.page.is_none() {
        state.doc.pages.take()
    } else {
        None
    };
    if let Some(page) = target.page {
        state.ui.active_page_index = page;
    }
    let node_id = NodeId::new(id);
    let changed = state.is_editable(&node_id)
        && state.apply(EditorCommand::PatchNodeData {
            node_id,
            patch_json: Value::Object(patch.clone()).to_string(),
            page_id: None,
        });
    if target.page.is_none() {
        state.doc.pages = legacy_pages;
    }
    state.ui.active_page_index = original_page;
    if !changed {
        return Err(SharedStyleError::InvalidTarget(id.into()));
    }
    Ok(())
}

/// Remove memberships whose authored node IDs no longer exist, across roots
/// and all pages. Returns the number of removed membership entries.
///
/// This deliberately creates no history entry or revision. Call after successful
/// structural removals/replacements, inside the mutation's existing undo
/// transaction, so undo restores nodes and memberships together.
pub fn prune_missing_shared_style_members(document: &mut jian_ops_schema::PenDocument) -> usize {
    if document.shared_styles.is_none() {
        return 0;
    }
    fn collect<'a>(nodes: &'a [PenNode], live: &mut BTreeSet<&'a str>) {
        for node in nodes {
            live.insert(node.base().id.as_str());
            if let Some(children) = node.children() {
                collect(children, live);
            }
        }
    }
    let mut live = BTreeSet::new();
    collect(&document.children, &mut live);
    if let Some(pages) = &document.pages {
        for page in pages {
            collect(&page.children, &mut live);
        }
    }
    let mut removed = 0;
    if let Some(styles) = document.shared_styles.as_mut() {
        for style in styles.values_mut() {
            let before = style.node_ids.len();
            style.node_ids.retain(|id| live.contains(id.as_str()));
            removed += before - style.node_ids.len();
        }
    }
    removed
}

/// Atomically validate, materialize and persist one style operation. This is
/// called by the host's DesignCommand arm, which preserves command metadata.
pub fn apply_shared_style(
    state: &mut EditorState,
    operation: SharedStyleOperation,
) -> Result<bool, SharedStyleError> {
    let mut styles = state.doc.shared_styles.clone().unwrap_or_default();
    let mut draft = state.clone();
    let mut writes: Vec<(String, SharedStyle, Vec<String>)> = Vec::new();
    match operation {
        SharedStyleOperation::Create { id, mut style } => {
            if id.trim().is_empty() || id != id.trim() {
                return Err(SharedStyleError::InvalidStyle(
                    "id must be a nonempty trimmed string".into(),
                ));
            }
            if styles.contains_key(&id) {
                return Err(SharedStyleError::DuplicateId(id));
            }
            validate_shared_style(&style)?;
            if !style.node_ids.is_empty() {
                return Err(SharedStyleError::InvalidStyle(
                    "create definitions first, then apply to nodes".into(),
                ));
            }
            style.node_ids.clear();
            styles.insert(id, style);
        }
        SharedStyleOperation::Update { id, mut style } => {
            validate_shared_style(&style)?;
            let old = styles
                .get(&id)
                .ok_or_else(|| SharedStyleError::NotFound(id.clone()))?;
            if old.kind != style.kind {
                return Err(SharedStyleError::InvalidStyle(
                    "cannot change a shared style's kind".into(),
                ));
            }
            let original_members = old.node_ids.clone();
            let old_keys = old.properties.keys().cloned().collect();
            prune_missing_shared_style_members(&mut draft.doc);
            styles = draft.doc.shared_styles.clone().unwrap_or_default();
            let live_members = &styles
                .get(&id)
                .ok_or_else(|| SharedStyleError::NotFound(id.clone()))?
                .node_ids;
            if !style.node_ids.is_empty()
                && style.node_ids != original_members
                && &style.node_ids != live_members
            {
                return Err(SharedStyleError::InvalidStyle(
                    "use apply/detach to change style membership".into(),
                ));
            }
            style.node_ids = live_members.clone();
            writes.push((id.clone(), style.clone(), old_keys));
            styles.insert(id, style);
        }
        SharedStyleOperation::Apply { id, node_ids } => {
            if node_ids.is_empty() {
                return Err(SharedStyleError::InvalidStyle(
                    "nodeIds must not be empty".into(),
                ));
            }
            let mut style = styles
                .get(&id)
                .ok_or_else(|| SharedStyleError::NotFound(id.clone()))?
                .clone();
            validate_shared_style(&style)?;
            let unique: BTreeSet<_> = node_ids.into_iter().collect();
            for target in &unique {
                let previous_keys: Vec<_> = styles
                    .values()
                    .filter(|s| s.kind == style.kind && s.node_ids.contains(target))
                    .flat_map(|s| s.properties.keys().cloned())
                    .collect();
                let mut one = style.clone();
                one.node_ids = vec![target.clone()];
                writes.push((id.clone(), one, previous_keys));
            }
            for existing in styles.values_mut() {
                if existing.kind == style.kind {
                    existing.node_ids.retain(|id| !unique.contains(id));
                }
            }
            style.node_ids.retain(|id| !unique.contains(id));
            style.node_ids.extend(unique);
            styles.insert(id, style);
        }
        SharedStyleOperation::Detach { id, node_ids } => {
            let style = styles
                .get_mut(&id)
                .ok_or_else(|| SharedStyleError::NotFound(id.clone()))?;
            if node_ids.is_empty() || node_ids.iter().any(|node| !style.node_ids.contains(node)) {
                return Err(SharedStyleError::InvalidStyle(
                    "every detach target must be linked to the style".into(),
                ));
            }
            style.node_ids.retain(|node| !node_ids.contains(node));
        }
        SharedStyleOperation::Delete { id } => {
            if styles.remove(&id).is_none() {
                return Err(SharedStyleError::NotFound(id));
            }
        }
    }
    if !writes.is_empty() {
        let lookup = targets(state)?;
        for (_, style, old_keys) in writes {
            let mut patch = Map::new();
            for key in old_keys {
                patch.insert(key, Value::Null);
            }
            patch.extend(style.properties.clone());
            for id in &style.node_ids {
                let target = lookup
                    .get(id)
                    .ok_or_else(|| SharedStyleError::InvalidTarget(id.clone()))?;
                if target.node.base().locked == Some(true)
                    || matches!(target.node, PenNode::Ref(_))
                    || (style.kind == SharedStyleKind::Text
                        && !matches!(target.node, PenNode::Text(_)))
                {
                    return Err(SharedStyleError::InvalidTarget(id.clone()));
                }
                let roots = match target.page {
                    Some(page) => {
                        &state
                            .doc
                            .pages
                            .as_ref()
                            .ok_or_else(|| SharedStyleError::InvalidTarget(id.clone()))?[page]
                            .children
                    }
                    None => &state.doc.children,
                };
                let theme = inherited_theme(
                    roots,
                    id,
                    &effective_theme(&state.doc, &state.ui.variables.active_theme),
                )
                .ok_or_else(|| SharedStyleError::InvalidTarget(id.clone()))?;
                for (key, value) in &patch {
                    validate_references(value, key, state, &theme)?;
                }
                let before = serde_json::to_value(&target.node)
                    .map_err(|e| SharedStyleError::InvalidStyle(e.to_string()))?;
                if patch
                    .iter()
                    .all(|(key, value)| same_value(before.get(key).unwrap_or(&Value::Null), value))
                {
                    continue;
                }
                patch_target(&mut draft, target, id, &patch)?;
                // PatchNodeData is permissive for unknown fields; ensure the
                // selected node kind actually persisted every style property.
                let after = targets(&draft)?
                    .remove(id)
                    .ok_or_else(|| SharedStyleError::InvalidTarget(id.clone()))?;
                let actual = serde_json::to_value(after.node)
                    .map_err(|e| SharedStyleError::InvalidStyle(e.to_string()))?;
                if patch
                    .iter()
                    .any(|(key, value)| !same_value(actual.get(key).unwrap_or(&Value::Null), value))
                {
                    return Err(SharedStyleError::InvalidTarget(id.clone()));
                }
            }
        }
    }
    draft.doc.shared_styles = if styles.is_empty() {
        None
    } else {
        Some(styles)
    };
    if draft.doc == state.doc {
        return Ok(false);
    }
    state.commit_history();
    state.doc = draft.doc;
    state.components = draft.components;
    state.mark_document_changed();
    Ok(true)
}
