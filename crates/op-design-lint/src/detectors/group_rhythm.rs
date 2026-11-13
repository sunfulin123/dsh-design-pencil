//! Report-only spacing leads for two relationships that a single global gap
//! cannot express:
//!
//! - sibling groups whose headings do not share one indent or one
//!   heading-to-content distance, and
//! - badge-like elements that touch or cross the edge of their container.
//!
//! Both are `Info`: a lead to weigh against the rendered design, never an
//! instruction. A status dot on an avatar corner or a deliberately different
//! group can be correct.

use jian_ops_schema::node::base::NumberOrExpression;
use jian_ops_schema::node::container::{ContainerProps, LayoutMode, Padding};
use jian_ops_schema::node::{PenNode, TextContent};
use serde_json::{json, Value};

use crate::issue::{FixProperty, Issue, IssueCategory, IssueSeverity};
use crate::node_util::{
    children, first_fill_color, has_stroke, is_node_visible, node_id, node_name, node_x, node_y,
    numeric_height, numeric_width, role,
};

/// Below this a difference is rounding, not a second spacing rule.
const SPACING_EPSILON: f64 = 0.5;
/// A badge closer to an edge than this reads as touching it.
const MIN_EDGE_INSET: f64 = 4.0;
/// Small anchors (an avatar, an icon button) carry corner dots by convention.
const MIN_BADGE_HOST_SIDE: f64 = 48.0;
const MAX_BADGE_SIDE: f64 = 32.0;
const HEADING_SEARCH_DEPTH: usize = 2;
const ASCII_BADGE_TOKENS: [&str; 4] = ["badge", "counter", "unread", "pill"];
const CJK_BADGE_WORDS: [&str; 3] = ["角标", "徽标", "未读"];

/// Find sibling groups with inconsistent heading rhythm under `root`.
pub fn detect_sibling_group_rhythm(root: &PenNode) -> Vec<Issue> {
    let mut issues = Vec::new();
    walk_group_rhythm(root, &mut issues);
    issues
}

/// Find badge-like elements that touch or cross their container edge under `root`.
pub fn detect_badge_edge_inset(root: &PenNode) -> Vec<Issue> {
    let mut issues = Vec::new();
    walk_badge_inset(root, &mut issues);
    issues
}

fn container(node: &PenNode) -> Option<&ContainerProps> {
    match node {
        PenNode::Frame(n) => Some(&n.container),
        PenNode::Group(n) => Some(&n.container),
        PenNode::Rectangle(n) => Some(&n.container),
        _ => None,
    }
}

/// `[top, right, bottom, left]`; an expression-valued padding is unknown.
fn padding_edges(props: &ContainerProps) -> Option<[f64; 4]> {
    match props.padding.as_ref() {
        None => Some([0.0; 4]),
        Some(Padding::Uniform(v)) => Some([*v; 4]),
        Some(Padding::XY([v, h])) => Some([*v, *h, *v, *h]),
        Some(Padding::LtrB(edges)) => Some(*edges),
        Some(Padding::Expression(_)) => None,
    }
}

fn numeric_gap(props: &ContainerProps) -> Option<f64> {
    match props.gap.as_ref() {
        None => Some(0.0),
        Some(NumberOrExpression::Number(value)) => Some(*value),
        Some(NumberOrExpression::Expression(_)) => None,
    }
}

fn has_text(node: &PenNode) -> bool {
    match node {
        PenNode::Text(text) => match &text.content {
            TextContent::Plain(value) => !value.trim().is_empty(),
            TextContent::Styled(segments) => segments.iter().any(|s| !s.text.trim().is_empty()),
        },
        _ => false,
    }
}

struct HeadingRhythm {
    /// Distance from the group's left edge to its heading text.
    indent: f64,
    /// Distance from the heading block to the content it introduces.
    gap: f64,
}

/// A titled group: a vertical stack that opens with a heading and has content
/// after it. The heading may sit directly in the group or lead a header row.
fn heading_rhythm(group: &PenNode) -> Option<HeadingRhythm> {
    let props = container(group)?;
    if props.layout != Some(LayoutMode::Vertical) {
        return None;
    }
    let kids: Vec<&PenNode> = children(group)
        .iter()
        .filter(|kid| is_node_visible(kid))
        .collect();
    if kids.len() < 2 {
        return None;
    }
    let mut indent = padding_edges(props)?[3];
    let mut lead = kids[0];
    for _ in 0..HEADING_SEARCH_DEPTH {
        if has_text(lead) {
            return Some(HeadingRhythm {
                indent,
                gap: numeric_gap(props)?,
            });
        }
        let header = container(lead)?;
        if header.layout == Some(LayoutMode::None) {
            return None;
        }
        indent += padding_edges(header)?[3];
        if header.layout == Some(LayoutMode::Horizontal)
            && children(lead)
                .iter()
                .any(|kid| is_node_visible(kid) && has_text(kid))
        {
            return Some(HeadingRhythm {
                indent,
                gap: numeric_gap(props)?,
            });
        }
        lead = children(lead).iter().find(|kid| is_node_visible(kid))?;
    }
    has_text(lead).then_some(HeadingRhythm {
        indent,
        gap: numeric_gap(props)?,
    })
}

/// The value most siblings use; ties keep the first one seen, so the earliest
/// group is treated as the reference.
fn prevailing(values: &[f64]) -> f64 {
    let mut best = (values[0], 0usize);
    for candidate in values {
        let count = values
            .iter()
            .filter(|value| (*value - candidate).abs() <= SPACING_EPSILON)
            .count();
        if count > best.1 {
            best = (*candidate, count);
        }
    }
    best.0
}

fn walk_group_rhythm(node: &PenNode, issues: &mut Vec<Issue>) {
    // Only vertically stacked siblings form titled group sequences; children of
    // a horizontal split view (e.g. `[Sidebar, MainPane]`) are distinct panes.
    if container(node).is_some_and(|props| props.layout == Some(LayoutMode::Vertical)) {
        let mut by_role: std::collections::BTreeMap<String, Vec<(&PenNode, HeadingRhythm)>> =
            std::collections::BTreeMap::new();
        for kid in children(node).iter().filter(|kid| is_node_visible(kid)) {
            if let Some(rhythm) = heading_rhythm(kid) {
                let role_key = role(kid).map(str::to_ascii_lowercase).unwrap_or_default();
                by_role.entry(role_key).or_default().push((kid, rhythm));
            }
        }
        for titled in by_role.values() {
            if titled.len() < 2 {
                continue;
            }
            let indents: Vec<f64> = titled.iter().map(|(_, rhythm)| rhythm.indent).collect();
            let gaps: Vec<f64> = titled.iter().map(|(_, rhythm)| rhythm.gap).collect();
            let indent = prevailing(&indents);
            let gap = prevailing(&gaps);
            for (group, rhythm) in titled {
                if (rhythm.indent - indent).abs() > SPACING_EPSILON {
                    issues.push(rhythm_issue(
                        group,
                        FixProperty::Padding,
                        rhythm.indent,
                        indent,
                        "heading indent",
                    ));
                }
                if (rhythm.gap - gap).abs() > SPACING_EPSILON {
                    issues.push(rhythm_issue(
                        group,
                        FixProperty::Layout,
                        rhythm.gap,
                        gap,
                        "heading-to-content distance",
                    ));
                }
            }
        }
    }
    for child in children(node) {
        walk_group_rhythm(child, issues);
    }
}

fn rhythm_issue(
    group: &PenNode,
    property: FixProperty,
    current: f64,
    sibling: f64,
    what: &str,
) -> Issue {
    Issue {
        node_id: node_id(group).to_string(),
        category: IssueCategory::SiblingGroupRhythm,
        severity: IssueSeverity::Info,
        property,
        current_value: json!(current),
        suggested_value: Value::Null,
        reason: format!(
            "Group {what} is {current}px while its sibling groups use {sibling}px. \
             Sibling groups normally share one {what}; align them or keep the \
             difference only if it has a stated purpose."
        ),
    }
}

fn has_badge_label(label: &str) -> bool {
    if CJK_BADGE_WORDS.iter().any(|word| label.contains(word)) {
        return true;
    }
    // Split both punctuation/whitespace and camelCase boundaries so "UnreadBadge"
    // matches "unread"/"badge" while "Account" or "Pillow" never match.
    let mut token = String::new();
    let flush = |tok: &mut String| -> bool {
        if tok.is_empty() {
            return false;
        }
        let lower = tok.to_ascii_lowercase();
        tok.clear();
        ASCII_BADGE_TOKENS.contains(&lower.as_str())
    };
    for ch in label.chars() {
        if !ch.is_ascii_alphanumeric() {
            if flush(&mut token) {
                return true;
            }
            continue;
        }
        if ch.is_ascii_uppercase() && !token.is_empty() && flush(&mut token) {
            return true;
        }
        token.push(ch);
    }
    flush(&mut token)
}

fn looks_like_badge(node: &PenNode) -> bool {
    let explicit_badge_role = role(node).is_some_and(|r| r.eq_ignore_ascii_case("badge"));
    let named = explicit_badge_role
        || [role(node), node_name(node)]
            .into_iter()
            .flatten()
            .any(has_badge_label);
    if !named {
        return false;
    }
    // A name alone is weak evidence; require an explicit compact dimension unless
    // the node explicitly declares `role: "badge"`.
    match (numeric_width(node), numeric_height(node)) {
        (Some(width), Some(height)) => width.max(height) <= MAX_BADGE_SIDE,
        (Some(side), None) | (None, Some(side)) => side <= MAX_BADGE_SIDE,
        (None, None) => explicit_badge_role,
    }
}

fn is_painted(node: &PenNode, props: &ContainerProps) -> bool {
    first_fill_color(node).is_some() || has_stroke(node) || props.clip_content == Some(true)
}

fn walk_badge_inset(node: &PenNode, issues: &mut Vec<Issue>) {
    if let Some(props) = container(node) {
        let kids: Vec<&PenNode> = children(node)
            .iter()
            .filter(|kid| is_node_visible(kid))
            .collect();
        match props.layout {
            Some(LayoutMode::Horizontal) | Some(LayoutMode::Vertical) => {
                check_flow_badges(node, props, &kids, issues);
            }
            _ => check_absolute_badges(node, &kids, issues),
        }
    }
    for child in children(node) {
        walk_badge_inset(child, issues);
    }
}

/// In a flow container an edge child touches the edge exactly when the padding
/// on that side is missing. Only a painted container has a visible edge.
fn check_flow_badges(
    host: &PenNode,
    props: &ContainerProps,
    kids: &[&PenNode],
    issues: &mut Vec<Issue>,
) {
    if !is_painted(host, props) || kids.len() < 2 {
        return;
    }
    let Some([top, right, bottom, left]) = padding_edges(props) else {
        return;
    };
    let horizontal = props.layout == Some(LayoutMode::Horizontal);
    let (leading, trailing) = if horizontal {
        (left, right)
    } else {
        (top, bottom)
    };
    let last = kids.len() - 1;
    for (index, kid) in kids.iter().enumerate() {
        if !looks_like_badge(kid) {
            continue;
        }
        let inset = match index {
            0 => leading,
            _ if index == last => trailing,
            _ => continue,
        };
        if inset < MIN_EDGE_INSET {
            issues.push(badge_issue(kid, host, inset));
        }
    }
}

/// In an absolutely positioned container the inset is measured directly.
fn check_absolute_badges(host: &PenNode, kids: &[&PenNode], issues: &mut Vec<Issue>) {
    let (Some(host_width), Some(host_height)) = (numeric_width(host), numeric_height(host)) else {
        return;
    };
    if host_width.min(host_height) < MIN_BADGE_HOST_SIDE {
        return;
    }
    for kid in kids {
        if !looks_like_badge(kid) {
            continue;
        }
        let (Some(x), Some(y), Some(width), Some(height)) = (
            node_x(kid),
            node_y(kid),
            numeric_width(kid),
            numeric_height(kid),
        ) else {
            continue;
        };
        let inset = [x, y, host_width - (x + width), host_height - (y + height)]
            .into_iter()
            .fold(f64::INFINITY, f64::min);
        if inset < MIN_EDGE_INSET {
            issues.push(badge_issue(kid, host, inset));
        }
    }
}

fn badge_issue(badge: &PenNode, host: &PenNode, inset: f64) -> Issue {
    let relation = if inset < 0.0 {
        "extends past"
    } else {
        "touches"
    };
    Issue {
        node_id: node_id(badge).to_string(),
        category: IssueCategory::BadgeEdgeInset,
        severity: IssueSeverity::Info,
        property: FixProperty::Padding,
        current_value: json!(inset),
        suggested_value: Value::Null,
        reason: format!(
            "Badge-like element {relation} the edge of \"{}\" (inset {inset}px). \
             Keep a clear inset of at least {MIN_EDGE_INSET}px unless overlapping \
             the corner is intended, as for a status dot on an avatar.",
            node_id(host)
        ),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn node(value: Value) -> PenNode {
        serde_json::from_value(value).expect("fixture must deserialize as PenNode")
    }

    fn group(id: &str, padding: Value, gap: f64) -> Value {
        json!({
            "type": "frame", "id": id, "layout": "vertical", "padding": padding, "gap": gap,
            "children": [
                {"type": "text", "id": format!("{id}-title"), "content": "Channels"},
                {"type": "frame", "id": format!("{id}-list"), "layout": "vertical"}
            ]
        })
    }

    fn sidebar(groups: Vec<Value>) -> PenNode {
        node(json!({"type": "frame", "id": "sidebar", "layout": "vertical", "children": groups}))
    }

    #[test]
    fn matching_sibling_groups_are_clean() {
        let root = sidebar(vec![
            group("channels", json!([8, 12]), 8.0),
            group("direct", json!([8, 12]), 8.0),
            group("apps", json!([8, 12]), 8.0),
        ]);
        assert!(detect_sibling_group_rhythm(&root).is_empty());
    }

    #[test]
    fn group_with_different_heading_indent_is_reported() {
        let root = sidebar(vec![
            group("channels", json!([8, 12]), 8.0),
            group("direct", json!([8, 20]), 8.0),
            group("apps", json!([8, 12]), 8.0),
        ]);
        let issues = detect_sibling_group_rhythm(&root);
        assert_eq!(issues.len(), 1, "{issues:?}");
        assert_eq!(issues[0].node_id, "direct");
        assert_eq!(issues[0].severity, IssueSeverity::Info);
        assert!(issues[0].reason.contains("heading indent is 20px"));
        assert!(!issues[0].can_auto_fix());
    }

    #[test]
    fn group_with_different_heading_distance_is_reported() {
        let root = sidebar(vec![
            group("channels", json!(12), 4.0),
            group("direct", json!(12), 16.0),
        ]);
        let issues = detect_sibling_group_rhythm(&root);
        assert_eq!(issues.len(), 1, "{issues:?}");
        assert_eq!(issues[0].node_id, "direct");
        assert!(issues[0]
            .reason
            .contains("heading-to-content distance is 16px"));
    }

    #[test]
    fn heading_inside_a_header_row_counts_its_own_padding() {
        let with_header = |id: &str, header_padding: f64| {
            json!({
                "type": "frame", "id": id, "layout": "vertical", "padding": 0, "gap": 8,
                "children": [
                    {"type": "frame", "id": format!("{id}-header"), "layout": "horizontal",
                     "padding": [0, header_padding],
                     "children": [{"type": "text", "id": format!("{id}-title"), "content": "Direct"}]},
                    {"type": "frame", "id": format!("{id}-list"), "layout": "vertical"}
                ]
            })
        };
        let root = sidebar(vec![
            with_header("a", 12.0),
            with_header("b", 12.0),
            with_header("c", 4.0),
        ]);
        let issues = detect_sibling_group_rhythm(&root);
        assert_eq!(issues.len(), 1, "{issues:?}");
        assert_eq!(issues[0].node_id, "c");
    }

    #[test]
    fn untitled_or_unknown_spacing_groups_are_ignored() {
        let root = sidebar(vec![
            group("channels", json!(12), 8.0),
            json!({"type": "frame", "id": "list", "layout": "vertical", "padding": 40,
                   "children": [{"type": "frame", "id": "row"}, {"type": "frame", "id": "row2"}]}),
            group("tokens", json!("$--space-3"), 8.0),
        ]);
        assert!(detect_sibling_group_rhythm(&root).is_empty());
    }

    fn row(padding: Value) -> PenNode {
        node(json!({
            "type": "frame", "id": "row", "layout": "horizontal", "padding": padding,
            "fill": [{"type": "solid", "color": "#FFFFFF"}],
            "children": [
                {"type": "text", "id": "name", "content": "general"},
                {"type": "frame", "id": "unread", "name": "Unread Badge", "width": 20, "height": 18,
                 "children": [{"type": "text", "id": "n", "content": "3"}]}
            ]
        }))
    }

    #[test]
    fn trailing_badge_in_an_unpadded_painted_row_is_reported() {
        let issues = detect_badge_edge_inset(&row(json!([6, 0, 6, 12])));
        assert_eq!(issues.len(), 1, "{issues:?}");
        assert_eq!(issues[0].node_id, "unread");
        assert!(issues[0].reason.contains("touches the edge of \"row\""));
        assert!(detect_badge_edge_inset(&row(json!([6, 12]))).is_empty());
    }

    #[test]
    fn absolute_badge_crossing_a_card_edge_is_reported_but_avatar_dot_is_not() {
        let card = node(json!({
            "type": "frame", "id": "card", "layout": "none", "width": 240, "height": 120,
            "children": [{"type": "frame", "id": "count", "role": "badge",
                          "x": 228, "y": -6, "width": 20, "height": 20}]
        }));
        let issues = detect_badge_edge_inset(&card);
        assert_eq!(issues.len(), 1, "{issues:?}");
        assert!(issues[0].reason.contains("extends past"));

        let avatar = node(json!({
            "type": "frame", "id": "avatar", "layout": "none", "width": 32, "height": 32,
            "children": [{"type": "ellipse", "id": "online", "name": "Status Dot",
                          "x": 24, "y": 24, "width": 10, "height": 10}]
        }));
        assert!(detect_badge_edge_inset(&avatar).is_empty());
    }

    #[test]
    fn horizontal_panes_and_non_badge_substrings_are_not_misreported_while_icon_headers_work() {
        let workspace = node(json!({
            "type": "frame", "id": "workspace", "layout": "horizontal",
            "children": [
                group("sidebar-pane", json!(12), 8.0),
                group("main-pane", json!(24), 16.0)
            ]
        }));
        assert!(
            detect_sibling_group_rhythm(&workspace).is_empty(),
            "side-by-side panes in a horizontal workspace are not sibling groups"
        );

        let with_chevron = |id: &str, pad: f64| {
            json!({
                "type": "frame", "id": id, "layout": "vertical", "padding": 0, "gap": 6,
                "children": [
                    {"type": "frame", "id": format!("{id}-hdr"), "layout": "horizontal", "padding": [0, pad],
                     "children": [
                        {"type": "icon_font", "id": format!("{id}-ico"), "iconFontName": "chevron-down", "width": 14, "height": 14},
                        {"type": "text", "id": format!("{id}-txt"), "content": "Channels"}
                     ]},
                    {"type": "frame", "id": format!("{id}-list"), "layout": "vertical"}
                ]
            })
        };
        let chevron_groups = sidebar(vec![with_chevron("g1", 12.0), with_chevron("g2", 20.0)]);
        assert_eq!(detect_sibling_group_rhythm(&chevron_groups).len(), 1);

        let account_row = node(json!({
            "type": "frame", "id": "row", "layout": "horizontal", "padding": 0,
            "fill": [{"type": "solid", "color": "#FFFFFF"}],
            "children": [
                {"type": "text", "id": "lbl", "name": "Account", "content": "Account"},
                {"type": "frame", "id": "unread-section", "name": "Unread Messages", "layout": "vertical"}
            ]
        }));
        assert!(
            detect_badge_edge_inset(&account_row).is_empty(),
            "substring 'Account' and unsized fit_content frames must not be flagged as badges"
        );
    }
}
