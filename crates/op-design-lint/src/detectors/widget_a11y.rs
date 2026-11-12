//! Widget accessibility detector (Phase E5). Flags writable text inputs
//! (`text_input` / `text_area`) that carry NEITHER a `placeholder` NOR a
//! `semantics.label` — an input with no visible or programmatic label is an
//! a11y problem (screen readers announce it as an unnamed edit field).

use jian_ops_schema::node::container::LayoutMode;
use jian_ops_schema::node::{Padding, PenNode};
use jian_ops_schema::semantics::SemanticsMeta;

use crate::issue::{FixProperty, Issue, IssueCategory, IssueSeverity};
use crate::node_util::{
    children, first_fill_color, has_stroke, json_number, node_id, padding, raw_padding_value,
};

/// Flags every `text_input` / `text_area` whose `placeholder` is missing or
/// empty AND whose `semantics.label` is missing or empty. A non-empty value
/// in either field clears the warning — one accessible name is enough.
pub fn detect_unlabeled_inputs(root: &PenNode) -> Vec<Issue> {
    let mut issues = Vec::new();
    walk_unlabeled_inputs(root, &mut issues);
    issues
}

/// Detect password inputs that would expose their contents while typing.
pub fn detect_insecure_password_inputs(root: &PenNode) -> Vec<Issue> {
    let mut issues = Vec::new();
    walk_password_inputs(root, &mut issues);
    issues
}

fn walk_password_inputs(node: &PenNode, issues: &mut Vec<Issue>) {
    if let PenNode::TextInput(input) = node {
        let secret_role = input.base.role.as_deref().is_some_and(|role| {
            matches!(
                role.trim().to_ascii_lowercase().as_str(),
                "password" | "password-input" | "secret" | "secret-input"
            )
        });
        let reveal_icon = input.trailing_icon.as_deref().is_some_and(|icon| {
            matches!(icon.trim().to_ascii_lowercase().as_str(), "eye" | "eye-off")
        });
        let masked_sample = [input.placeholder.as_deref(), input.value.as_deref()]
            .into_iter()
            .flatten()
            .any(is_mask_glyph_run);
        if (secret_role || reveal_icon || masked_sample) && input.secure != Some(true) {
            issues.push(Issue {
                node_id: node_id(node).to_string(),
                category: IssueCategory::WidgetA11y,
                severity: IssueSeverity::Error,
                property: FixProperty::None,
                current_value: serde_json::Value::Null,
                suggested_value: serde_json::Value::Null,
                reason: "password text input must explicitly set secure to true".to_string(),
            });
        }
    }
    for child in children(node) {
        walk_password_inputs(child, issues);
    }
}

fn is_mask_glyph_run(text: &str) -> bool {
    let trimmed = text.trim();
    if trimmed.is_empty() {
        return false;
    }
    let mut glyph_count = 0usize;
    for ch in trimmed.chars() {
        if matches!(ch, '•' | '●' | '⚫' | '✱' | '*' | '·') {
            glyph_count += 1;
        } else if !ch.is_whitespace() {
            return false;
        }
    }
    glyph_count >= 4
}

fn walk_unlabeled_inputs(node: &PenNode, issues: &mut Vec<Issue>) {
    // Only the two writable text-entry kinds carry both `placeholder` and
    // `semantics` in a way that makes "unlabeled" meaningful.
    let fields = match node {
        PenNode::TextInput(n) => Some((n.placeholder.as_deref(), n.semantics.as_ref())),
        PenNode::TextArea(n) => Some((n.placeholder.as_deref(), n.semantics.as_ref())),
        _ => None,
    };
    if let Some((placeholder, semantics)) = fields {
        if !has_placeholder(placeholder) && !has_label(semantics) {
            issues.push(Issue {
                node_id: node_id(node).to_string(),
                category: IssueCategory::WidgetA11y,
                severity: IssueSeverity::Warning,
                property: FixProperty::Label,
                current_value: serde_json::Value::Null,
                suggested_value: serde_json::Value::Null,
                reason: "input has no placeholder or accessible label".to_string(),
            });
        }
    }
    for child in children(node) {
        walk_unlabeled_inputs(child, issues);
    }
}

/// Detect horizontal frame-built dropdown/select triggers whose trailing
/// chevron sits flush against the right border (`paddingRight < 8px`).
pub fn detect_cramped_dropdown_chevrons(root: &PenNode) -> Vec<Issue> {
    let mut issues = Vec::new();
    walk_cramped_dropdown_chevrons(root, &mut issues);
    issues
}

fn walk_cramped_dropdown_chevrons(node: &PenNode, issues: &mut Vec<Issue>) {
    if let PenNode::Frame(frame) = node {
        let kids = children(node);
        let is_horizontal = frame.container.layout == Some(LayoutMode::Horizontal);
        let has_box = has_stroke(node) || first_fill_color(node).is_some();
        let has_leading_text = kids
            .iter()
            .take(kids.len().saturating_sub(1))
            .any(contains_text_node);
        let has_trailing_chevron = kids.last().is_some_and(is_down_chevron_icon);
        if is_horizontal && has_box && kids.len() >= 2 && has_leading_text && has_trailing_chevron {
            let pad = padding(node);
            if let Some(right) = numeric_padding_right(pad) {
                if right < 8.0 {
                    let top = numeric_padding_side(pad, 0);
                    let bottom = numeric_padding_side(pad, 2);
                    let left = numeric_padding_side(pad, 3).max(12.0);
                    issues.push(Issue {
                        node_id: node_id(node).to_string(),
                        category: IssueCategory::WidgetA11y,
                        severity: IssueSeverity::Warning,
                        property: FixProperty::Padding,
                        current_value: raw_padding_value(pad),
                        suggested_value: serde_json::Value::Array(vec![
                            json_number(top),
                            json_number(12.0),
                            json_number(bottom),
                            json_number(left),
                        ]),
                        reason: format!(
                            "dropdown/select trigger right padding is {}px (< 8px), gluing the trailing chevron to the right border; use 12px-16px horizontal padding",
                            right.round() as i64
                        ),
                    });
                }
            }
        }
    }
    for child in children(node) {
        walk_cramped_dropdown_chevrons(child, issues);
    }
}

fn contains_text_node(node: &PenNode) -> bool {
    matches!(node, PenNode::Text(_)) || children(node).iter().any(contains_text_node)
}

fn is_down_chevron_icon(node: &PenNode) -> bool {
    match node {
        PenNode::IconFont(icon) => {
            let lower = icon.icon_font_name.trim().to_ascii_lowercase();
            lower.contains("chevron-down")
                || lower.contains("chevrons-up-down")
                || lower.contains("caret-down")
                || lower == "arrow-drop-down"
        }
        _ => false,
    }
}

fn numeric_padding_right(pad: Option<&Padding>) -> Option<f64> {
    match pad {
        Some(Padding::LtrB(p)) => Some(p[1]),
        Some(Padding::XY([_, h])) => Some(*h),
        Some(Padding::Uniform(v)) => Some(*v),
        None => Some(0.0),
        Some(Padding::Expression(_)) => None,
    }
}

fn numeric_padding_side(pad: Option<&Padding>, side: usize) -> f64 {
    match pad {
        Some(Padding::LtrB(p)) => p[side],
        Some(Padding::XY([v, h])) => {
            if side % 2 == 0 {
                *v
            } else {
                *h
            }
        }
        Some(Padding::Uniform(v)) => *v,
        Some(Padding::Expression(_)) | None => 0.0,
    }
}

/// True when a placeholder string is present and not empty (whitespace-only
/// counts as empty — it provides no accessible name).
fn has_placeholder(placeholder: Option<&str>) -> bool {
    placeholder.is_some_and(|p| !p.trim().is_empty())
}

/// True when `semantics.label` is present and not empty.
fn has_label(semantics: Option<&SemanticsMeta>) -> bool {
    semantics.is_some_and(|s| s.label.as_deref().is_some_and(|l| !l.trim().is_empty()))
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    /// Deserialize a JSON value into a `PenNode` — doubles as a schema
    /// round-trip check for every fixture.
    fn node(value: serde_json::Value) -> PenNode {
        serde_json::from_value(value).expect("fixture must deserialize as PenNode")
    }

    #[test]
    fn flags_text_input_with_neither_placeholder_nor_label() {
        let root = node(json!({"type": "text_input", "id": "i1"}));
        let issues = detect_unlabeled_inputs(&root);
        assert_eq!(issues.len(), 1);
        assert_eq!(issues[0].node_id, "i1");
        assert_eq!(issues[0].category, IssueCategory::WidgetA11y);
        assert_eq!(issues[0].severity, IssueSeverity::Warning);
        assert_eq!(issues[0].property, FixProperty::Label);
        assert_eq!(
            issues[0].reason,
            "input has no placeholder or accessible label"
        );
    }

    #[test]
    fn ignores_text_input_with_placeholder() {
        let root = node(json!({
            "type": "text_input", "id": "i1", "placeholder": "Search…"
        }));
        assert!(detect_unlabeled_inputs(&root).is_empty());
    }

    #[test]
    fn ignores_text_input_with_semantics_label() {
        let root = node(json!({
            "type": "text_input", "id": "i1",
            "semantics": {"label": "Email address"}
        }));
        assert!(detect_unlabeled_inputs(&root).is_empty());
    }

    #[test]
    fn flags_text_area_with_neither() {
        let root = node(json!({"type": "text_area", "id": "ta1"}));
        let issues = detect_unlabeled_inputs(&root);
        assert_eq!(issues.len(), 1);
        assert_eq!(issues[0].node_id, "ta1");
        assert_eq!(issues[0].category, IssueCategory::WidgetA11y);
    }

    #[test]
    fn treats_empty_and_whitespace_placeholder_as_unlabeled() {
        let empty = node(json!({"type": "text_input", "id": "i1", "placeholder": ""}));
        assert_eq!(detect_unlabeled_inputs(&empty).len(), 1);

        let blank = node(json!({"type": "text_input", "id": "i2", "placeholder": "   "}));
        assert_eq!(detect_unlabeled_inputs(&blank).len(), 1);
    }

    #[test]
    fn ignores_non_input_kinds() {
        let text = node(json!({"type": "text", "id": "t1", "content": "hi"}));
        assert!(detect_unlabeled_inputs(&text).is_empty());

        let frame = node(json!({"type": "frame", "id": "f1"}));
        assert!(detect_unlabeled_inputs(&frame).is_empty());
    }

    #[test]
    fn walks_nested_inputs() {
        let root = node(json!({
            "type": "frame", "id": "root",
            "children": [
                {"type": "frame", "id": "inner", "children": [
                    {"type": "text_input", "id": "deep"}
                ]}
            ]
        }));
        let issues = detect_unlabeled_inputs(&root);
        assert_eq!(issues.len(), 1);
        assert_eq!(issues[0].node_id, "deep");
    }

    #[test]
    fn password_inputs_require_secure_entry() {
        let root = node(json!({
            "type": "frame", "id": "root", "children": [
                {"type": "text_input", "id": "unsafe-role", "role": "password", "name": "パスワード"},
                {"type": "text_input", "id": "unsafe-mask", "name": "Mot de passe", "placeholder": "••••••••"},
                {"type": "text_input", "id": "unsafe-icon", "name": "비밀번호", "trailingIcon": "eye"},
                {"type": "text_input", "id": "safe", "role": "password", "placeholder": "••••••••", "secure": true},
                {"type": "text_input", "id": "ordinary", "name": "Email", "placeholder": "user@example.com"}
            ]
        }));
        let issues = detect_insecure_password_inputs(&root);
        assert_eq!(
            issues
                .iter()
                .map(|i| i.node_id.as_str())
                .collect::<Vec<_>>(),
            vec!["unsafe-role", "unsafe-mask", "unsafe-icon"]
        );
        assert!(issues.iter().all(|i| i.severity == IssueSeverity::Error));
    }

    #[test]
    fn cramped_dropdown_chevron_flags_zero_or_tiny_right_padding() {
        let root = node(json!({
            "type": "frame",
            "id": "root",
            "children": [
                {
                    "type": "frame",
                    "id": "bad-select",
                    "layout": "horizontal",
                    "padding": [0, 2, 0, 12],
                    "stroke": { "thickness": 1, "fill": [{ "type": "solid", "color": "#D6DADD" }] },
                    "children": [
                        { "type": "text", "id": "lbl", "content": "常规数据态（6 条示例客户）" },
                        { "type": "icon_font", "id": "ic", "iconFontName": "chevron-down", "width": 16, "height": 16 }
                    ]
                },
                {
                    "type": "frame",
                    "id": "good-select",
                    "layout": "horizontal",
                    "padding": [0, 12],
                    "stroke": { "thickness": 1, "fill": [{ "type": "solid", "color": "#D6DADD" }] },
                    "children": [
                        { "type": "text", "id": "lbl2", "content": "常规数据态（6 条示例客户）" },
                        { "type": "icon_font", "id": "ic2", "iconFontName": "chevron-down", "width": 16, "height": 16 }
                    ]
                }
            ]
        }));
        let issues = detect_cramped_dropdown_chevrons(&root);
        assert_eq!(issues.len(), 1);
        assert_eq!(issues[0].node_id, "bad-select");
        assert_eq!(issues[0].severity, IssueSeverity::Warning);
        assert_eq!(issues[0].property, FixProperty::Padding);
        assert_eq!(issues[0].suggested_value, json!([0, 12, 0, 12]));
    }
}
