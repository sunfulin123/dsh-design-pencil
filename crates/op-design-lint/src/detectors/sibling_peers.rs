//! Conservative peer grouping for advisory sibling comparisons.
use jian_ops_schema::node::{base::PenNodeBase, container::ContainerProps, PenNode};
use jian_ops_schema::sizing::SizingBehavior;

use crate::node_util::{children, is_node_visible, node_kind_str, role};

fn container(node: &PenNode) -> Option<(&PenNodeBase, &ContainerProps, bool)> {
    match node {
        PenNode::Frame(n) => Some((
            &n.base,
            &n.container,
            n.reusable == Some(true)
                || n.events.is_some()
                || n.bindings.is_some()
                || n.state.is_some()
                || n.semantics.is_some()
                || n.gestures.is_some()
                || n.route.is_some(),
        )),
        PenNode::Group(n) => Some((
            &n.base,
            &n.container,
            n.events.is_some()
                || n.bindings.is_some()
                || n.state.is_some()
                || n.semantics.is_some()
                || n.gestures.is_some()
                || n.route.is_some(),
        )),
        PenNode::Rectangle(n) => Some((
            &n.base,
            &n.container,
            n.events.is_some()
                || n.bindings.is_some()
                || n.state.is_some()
                || n.semantics.is_some()
                || n.gestures.is_some()
                || n.route.is_some(),
        )),
        _ => None,
    }
}

fn is_unpainted_spacer(node: &PenNode) -> bool {
    let Some((base, props, interactive)) = container(node) else {
        return false;
    };
    !interactive
        && role(node).is_none_or(|r| r.trim().is_empty())
        && children(node).is_empty()
        && props.fill.as_ref().is_none_or(Vec::is_empty)
        && props.stroke.is_none()
        && props.effects.as_ref().is_none_or(Vec::is_empty)
        && base.reactions.as_ref().is_none_or(Vec::is_empty)
        && base.component_design.is_none()
        && base.component_values.is_none()
        && base.mask_type.is_none()
        && base.animations.is_none()
        && (is_tiny_size(props.width.as_ref()) || is_tiny_size(props.height.as_ref()))
}

fn is_tiny_size(size: Option<&SizingBehavior>) -> bool {
    matches!(size, Some(SizingBehavior::Number(n)) if n.is_finite() && (0.0..=1.0).contains(n))
}

/// Identical child kinds/layout are a useful hint, not proof of semantic equivalence.
pub(super) fn peer_key(node: &PenNode, respect_role: bool) -> Option<String> {
    let role = role(node).unwrap_or("").trim().to_ascii_lowercase();
    if !is_node_visible(node)
        || matches!(role.as_str(), "spacer" | "divider")
        || is_unpainted_spacer(node)
    {
        return None;
    }
    let kind = node_kind_str(node);
    if respect_role && !role.is_empty() {
        return Some(format!("{kind}:role:{role}"));
    }
    let layout = container(node)
        .map(|(_, c, _)| format!("{:?}", c.layout))
        .unwrap_or_default();
    let child_kinds = children(node)
        .iter()
        .map(node_kind_str)
        .collect::<Vec<_>>()
        .join(",");
    Some(format!("{kind}:structure:{layout}:{child_kinds}"))
}

pub(super) fn has_explicit_role(node: &PenNode) -> bool {
    role(node).is_some_and(|r| !r.trim().is_empty())
}
