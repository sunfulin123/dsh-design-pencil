//! Tests for `detectors::siblings`.
//!
//! Relocated from `siblings.rs` to keep that file under the workspace
//! 800-line ceiling (matching the `*_tests.rs` sibling-test convention).
//! The three test modules below are unchanged — only moved.

use super::siblings::{
    detect_mixed_sibling_corner_radius, detect_mixed_sibling_padding,
    detect_sibling_inconsistencies,
};
use crate::issue::{FixProperty, IssueCategory, IssueSeverity};
use jian_ops_schema::node::PenNode;

#[cfg(test)]
mod sibling_inconsistency_tests {
    use super::*;
    use serde_json::json;

    fn node(value: serde_json::Value) -> PenNode {
        serde_json::from_value(value).expect("fixture must deserialize as PenNode")
    }

    #[test]
    fn flags_strict_height_outlier_among_same_role_frames() {
        // 3 same-role frames; one has a different height.
        let root = node(json!({
            "type": "frame", "id": "root",
            "children": [
                {"type": "frame", "id": "a", "role": "card", "height": 100},
                {"type": "frame", "id": "b", "role": "card", "height": 100},
                {"type": "frame", "id": "c", "role": "card", "height": 140}
            ]
        }));
        let issues = detect_sibling_inconsistencies(&root);
        assert_eq!(issues.len(), 1);
        assert_eq!(issues[0].node_id, "c");
        assert_eq!(issues[0].category, IssueCategory::SiblingInconsistency);
        assert_eq!(issues[0].severity, IssueSeverity::Warning);
        assert_eq!(issues[0].property, FixProperty::Height);
        assert_eq!(issues[0].suggested_value, json!(100));
        assert_eq!(issues[0].current_value, json!(140));
    }

    #[test]
    fn flags_strict_corner_radius_outlier() {
        let root = node(json!({
            "type": "frame", "id": "root",
            "children": [
                {"type": "frame", "id": "a", "role": "card", "cornerRadius": 8},
                {"type": "frame", "id": "b", "role": "card", "cornerRadius": 8},
                {"type": "frame", "id": "c", "role": "card", "cornerRadius": 16}
            ]
        }));
        let issues = detect_sibling_inconsistencies(&root);
        assert_eq!(issues.len(), 1);
        assert_eq!(issues[0].node_id, "c");
        assert_eq!(issues[0].property, FixProperty::CornerRadius);
    }

    #[test]
    fn never_flags_a_two_sibling_group() {
        // Fewer than 3 siblings — never flagged.
        let root = node(json!({
            "type": "frame", "id": "root",
            "children": [
                {"type": "frame", "id": "a", "role": "card", "height": 100},
                {"type": "frame", "id": "b", "role": "card", "height": 140}
            ]
        }));
        assert!(detect_sibling_inconsistencies(&root).is_empty());
    }

    #[test]
    fn does_not_flag_three_way_split() {
        // 1-1-1: no >= 2/3 majority → nothing flagged.
        let root = node(json!({
            "type": "frame", "id": "root",
            "children": [
                {"type": "frame", "id": "a", "role": "card", "height": 100},
                {"type": "frame", "id": "b", "role": "card", "height": 120},
                {"type": "frame", "id": "c", "role": "card", "height": 140}
            ]
        }));
        assert!(detect_sibling_inconsistencies(&root).is_empty());
    }

    #[test]
    fn divider_and_spacer_siblings_are_excluded_from_groups() {
        // 3 cards consistent + 1 divider with a wild height. The divider must
        // not enter any group; the cards stay consistent → no issue.
        let root = node(json!({
            "type": "frame", "id": "root",
            "children": [
                {"type": "frame", "id": "a", "role": "card", "height": 100},
                {"type": "frame", "id": "b", "role": "card", "height": 100},
                {"type": "frame", "id": "c", "role": "card", "height": 100},
                {"type": "frame", "id": "d", "role": "divider", "height": 1},
                {"type": "frame", "id": "e", "role": "spacer", "height": 999}
            ]
        }));
        assert!(detect_sibling_inconsistencies(&root).is_empty());
    }

    #[test]
    fn loose_pass_flags_singleton_role_corner_radius_outlier_as_info() {
        // 3 frames, each a unique role — strict groups are all singletons.
        // The loose pass groups them by type and flags the cornerRadius
        // outlier with `info` severity.
        let root = node(json!({
            "type": "frame", "id": "root",
            "children": [
                {"type": "frame", "id": "hero", "role": "hero", "cornerRadius": 12},
                {"type": "frame", "id": "feat", "role": "features", "cornerRadius": 12},
                {"type": "frame", "id": "cta", "role": "cta", "cornerRadius": 24}
            ]
        }));
        let issues = detect_sibling_inconsistencies(&root);
        assert_eq!(issues.len(), 1);
        assert_eq!(issues[0].node_id, "cta");
        assert_eq!(issues[0].property, FixProperty::CornerRadius);
        assert_eq!(issues[0].severity, IssueSeverity::Info);
    }

    #[test]
    fn dedup_keeps_strict_pass_when_both_passes_match() {
        // 3 same-role frames with a cornerRadius outlier: caught by the strict
        // pass (warning) AND the loose pass (info). Dedup keeps the strict one.
        let root = node(json!({
            "type": "frame", "id": "root",
            "children": [
                {"type": "frame", "id": "a", "role": "card", "cornerRadius": 8},
                {"type": "frame", "id": "b", "role": "card", "cornerRadius": 8},
                {"type": "frame", "id": "c", "role": "card", "cornerRadius": 16}
            ]
        }));
        let issues = detect_sibling_inconsistencies(&root);
        // Exactly one issue for node `c` — the strict-pass `warning`, not a
        // duplicate `info`.
        assert_eq!(issues.len(), 1);
        assert_eq!(issues[0].node_id, "c");
        assert_eq!(issues[0].severity, IssueSeverity::Warning);
    }

    #[test]
    fn text_siblings_check_font_size() {
        let root = node(json!({
            "type": "frame", "id": "root",
            "children": [
                {"type": "text", "id": "a", "role": "label", "content": "x", "fontSize": 14},
                {"type": "text", "id": "b", "role": "label", "content": "y", "fontSize": 14},
                {"type": "text", "id": "c", "role": "label", "content": "z", "fontSize": 18}
            ]
        }));
        let issues = detect_sibling_inconsistencies(&root);
        assert_eq!(issues.len(), 1);
        assert_eq!(issues[0].node_id, "c");
        assert_eq!(issues[0].property, FixProperty::FontSize);
    }
}

#[cfg(test)]
mod mixed_corner_radius_tests {
    use super::*;
    use serde_json::json;

    fn node(value: serde_json::Value) -> PenNode {
        serde_json::from_value(value).expect("fixture must deserialize as PenNode")
    }

    #[test]
    fn flags_corner_radius_outlier_against_modal() {
        let root = node(json!({
            "type": "frame", "id": "root",
            "children": [
                {"type": "frame", "id": "a", "role": "card", "cornerRadius": 8},
                {"type": "frame", "id": "b", "role": "card", "cornerRadius": 8},
                {"type": "frame", "id": "c", "role": "card", "cornerRadius": 12}
            ]
        }));
        let issues = detect_mixed_sibling_corner_radius(&root);
        assert_eq!(issues.len(), 1);
        assert_eq!(issues[0].node_id, "c");
        assert_eq!(issues[0].category, IssueCategory::MixedSiblingCornerRadius);
        assert_eq!(issues[0].property, FixProperty::CornerRadius);
        assert_eq!(issues[0].severity, IssueSeverity::Warning);
        assert_eq!(issues[0].current_value, json!(12));
        assert_eq!(issues[0].suggested_value, json!(8));
    }

    #[test]
    fn active_nav_pill_not_flattened_to_square_siblings() {
        // The desktop's pre-validator runs this lint AFTER apply_tree_heuristics
        // rounds the active nav tab to a 999 pill. Among its square (cr=0)
        // inactive siblings the modal is 0, so without a pill guard the lint
        // would "fix" the 999 back to 0 — exactly the active-nav-tab-reset-to-
        // square bug. A pill radius (>= 40) is intentional and must be left alone.
        let root = node(json!({
            "type": "frame", "id": "row", "layout": "horizontal",
            "children": [
                {"type": "frame", "id": "home", "cornerRadius": 999,
                 "fill": [{"type": "solid", "color": "#F97316"}]},
                {"type": "frame", "id": "orders", "cornerRadius": 0},
                {"type": "frame", "id": "profile", "cornerRadius": 0}
            ]
        }));
        let issues = detect_mixed_sibling_corner_radius(&root);
        assert!(
            !issues.iter().any(|i| i.node_id == "home"),
            "active pill nav tab (999) must NOT be flagged to flatten to its square siblings, got {issues:?}"
        );
    }

    #[test]
    fn ignores_three_way_split_without_modal() {
        let root = node(json!({
            "type": "frame", "id": "root",
            "children": [
                {"type": "frame", "id": "a", "role": "card", "cornerRadius": 8},
                {"type": "frame", "id": "b", "role": "card", "cornerRadius": 12},
                {"type": "frame", "id": "c", "role": "card", "cornerRadius": 16}
            ]
        }));
        assert!(detect_mixed_sibling_corner_radius(&root).is_empty());
    }

    #[test]
    fn ignores_two_sibling_group() {
        let root = node(json!({
            "type": "frame", "id": "root",
            "children": [
                {"type": "frame", "id": "a", "role": "card", "cornerRadius": 8},
                {"type": "frame", "id": "b", "role": "card", "cornerRadius": 12}
            ]
        }));
        assert!(detect_mixed_sibling_corner_radius(&root).is_empty());
    }

    #[test]
    fn ignores_all_equal_group() {
        let root = node(json!({
            "type": "frame", "id": "root",
            "children": [
                {"type": "frame", "id": "a", "role": "card", "cornerRadius": 8},
                {"type": "frame", "id": "b", "role": "card", "cornerRadius": 8},
                {"type": "frame", "id": "c", "role": "card", "cornerRadius": 8}
            ]
        }));
        assert!(detect_mixed_sibling_corner_radius(&root).is_empty());
    }
}

#[cfg(test)]
mod mixed_padding_tests {
    use super::*;
    use serde_json::json;

    fn node(value: serde_json::Value) -> PenNode {
        serde_json::from_value(value).expect("fixture must deserialize as PenNode")
    }

    #[test]
    fn flags_padding_outlier_with_shorthand_normalised_modal() {
        // `16` and `[16,16,16,16]` normalise equal; `20` is the outlier.
        let root = node(json!({
            "type": "frame", "id": "root",
            "children": [
                {"type": "frame", "id": "a", "role": "card", "padding": 16},
                {"type": "frame", "id": "b", "role": "card", "padding": [16, 16, 16, 16]},
                {"type": "frame", "id": "c", "role": "card", "padding": 20}
            ]
        }));
        let issues = detect_mixed_sibling_padding(&root);
        assert_eq!(issues.len(), 1);
        assert_eq!(issues[0].node_id, "c");
        assert_eq!(issues[0].category, IssueCategory::MixedSiblingPadding);
        assert_eq!(issues[0].property, FixProperty::Padding);
        assert_eq!(issues[0].severity, IssueSeverity::Warning);
        // All four sides equal → suggested as a single number.
        assert_eq!(issues[0].suggested_value, json!(16));
    }

    #[test]
    fn flags_padding_outlier_with_xy_modal() {
        // `[8,16]` (XY) normalises to `[8,16,8,16]`; `[8,20]` is the outlier.
        let root = node(json!({
            "type": "frame", "id": "root",
            "children": [
                {"type": "frame", "id": "a", "role": "card", "padding": [8, 16]},
                {"type": "frame", "id": "b", "role": "card", "padding": [8, 16]},
                {"type": "frame", "id": "c", "role": "card", "padding": [8, 20]}
            ]
        }));
        let issues = detect_mixed_sibling_padding(&root);
        assert_eq!(issues.len(), 1);
        assert_eq!(issues[0].node_id, "c");
        // Sides differ → suggested as a 4-element array.
        assert_eq!(issues[0].suggested_value, json!([8, 16, 8, 16]));
    }

    #[test]
    fn ignores_three_way_padding_split() {
        let root = node(json!({
            "type": "frame", "id": "root",
            "children": [
                {"type": "frame", "id": "a", "role": "card", "padding": 8},
                {"type": "frame", "id": "b", "role": "card", "padding": 16},
                {"type": "frame", "id": "c", "role": "card", "padding": 24}
            ]
        }));
        assert!(detect_mixed_sibling_padding(&root).is_empty());
    }

    #[test]
    fn ignores_coloured_full_bleed_section_when_matching_sibling_padding() {
        let root = node(json!({
            "type": "frame", "id": "root", "width": 375, "height": 812,
            "layout": "vertical",
            "children": [
                {"type": "frame", "id": "status", "role": "status-bar"},
                {
                    "type": "frame", "id": "map", "padding": [0, 0],
                    "children": [{
                        "type": "frame", "id": "map-placeholder",
                        "width": "fill_container",
                        "fill": [{"type": "solid", "color": "#223344"}]
                    }]
                },
                {"type": "frame", "id": "section-a", "padding": [0, 24, 0, 24]},
                {"type": "frame", "id": "section-b", "padding": [0, 24, 0, 24]},
                {"type": "frame", "id": "section-c", "padding": [0, 24, 0, 24]}
            ]
        }));

        assert!(detect_mixed_sibling_padding(&root).is_empty());
    }

    #[test]
    fn ignores_full_bleed_section_whose_media_sits_in_a_transparent_none_stack() {
        // The shape the orchestrator's hero-bleed pass leaves behind: a
        // transparent overlay stack that spans the width, holding the map
        // placeholder plus controls; the section itself has no padding.
        let root = node(json!({
            "type": "frame", "id": "root", "width": 375, "height": 812,
            "layout": "vertical",
            "children": [
                {"type": "frame", "id": "status", "role": "status-bar"},
                {
                    "type": "frame", "id": "map", "padding": [0, 0],
                    "children": [{
                        "type": "frame", "id": "stack", "layout": "none",
                        "width": "fill_container", "height": 280,
                        "children": [
                            {"type": "frame", "id": "recenter", "width": "fill_container",
                             "fill": [{"type": "solid", "color": "#ffffff"}]},
                            {"type": "ellipse", "id": "dot", "width": 14, "x": 169},
                            {"type": "frame", "id": "map-placeholder",
                             "width": "fill_container", "x": 0,
                             "fill": [{"type": "solid", "color": "#223344"}]}
                        ]
                    }]
                },
                {"type": "frame", "id": "section-a", "padding": [0, 24, 0, 24]},
                {"type": "frame", "id": "section-b", "padding": [0, 24, 0, 24]},
                {"type": "frame", "id": "section-c", "padding": [0, 24, 0, 24]}
            ]
        }));

        assert!(detect_mixed_sibling_padding(&root).is_empty());
    }

    #[test]
    fn ignores_image_full_bleed_section_when_matching_sibling_padding() {
        let root = node(json!({
            "type": "frame", "id": "root", "width": 375, "height": 812,
            "layout": "vertical",
            "children": [
                {"type": "frame", "id": "status", "role": "status-bar"},
                {
                    "type": "frame", "id": "hero", "padding": [0, 0],
                    "children": [{
                        "type": "image", "id": "hero-image",
                        "width": "fill_container", "src": "hero.png"
                    }]
                },
                {"type": "frame", "id": "section-a", "padding": [0, 24, 0, 24]},
                {"type": "frame", "id": "section-b", "padding": [0, 24, 0, 24]},
                {"type": "frame", "id": "section-c", "padding": [0, 24, 0, 24]}
            ]
        }));

        assert!(detect_mixed_sibling_padding(&root).is_empty());
    }

    #[test]
    fn current_value_normalizes_integral_padding_to_json_integer() {
        // jian deserializes JSON `20` into `Padding`'s f64 fields; the
        // `current_value` must serialize back as the integer `20`, not the
        // float `20.0` — `serde_json::Value` does NOT treat 20.0 == 20.

        // Uniform-number outlier → current_value is a JSON integer.
        let uniform = node(json!({
            "type": "frame", "id": "root",
            "children": [
                {"type": "frame", "id": "a", "role": "card", "padding": 16},
                {"type": "frame", "id": "b", "role": "card", "padding": 16},
                {"type": "frame", "id": "c", "role": "card", "padding": 20}
            ]
        }));
        let issues = detect_mixed_sibling_padding(&uniform);
        assert_eq!(issues.len(), 1);
        assert_eq!(issues[0].current_value, json!(20));

        // Array-form outlier → current_value is an integer 4-array (the
        // sibling carried an explicit `[8,20,8,20]`).
        let array = node(json!({
            "type": "frame", "id": "root",
            "children": [
                {"type": "frame", "id": "a", "role": "card", "padding": [8, 16, 8, 16]},
                {"type": "frame", "id": "b", "role": "card", "padding": [8, 16, 8, 16]},
                {"type": "frame", "id": "c", "role": "card", "padding": [8, 20, 8, 20]}
            ]
        }));
        let issues = detect_mixed_sibling_padding(&array);
        assert_eq!(issues.len(), 1);
        assert_eq!(issues[0].current_value, json!([8, 20, 8, 20]));
    }
}

#[cfg(test)]
mod semantic_peer_tests {
    use super::*;
    use serde_json::json;

    fn node(value: serde_json::Value) -> PenNode {
        serde_json::from_value(value).expect("valid node")
    }

    fn nav_item(id: &str, height: i32, radius: i32) -> serde_json::Value {
        json!({"type":"frame", "id":id, "layout":"horizontal", "width":"fill_container",
        "height":height, "cornerRadius":radius, "children":[
            {"type":"text","id":format!("{id}-icon"),"content":"•"},
            {"type":"text","id":format!("{id}-label"),"content":id}
        ]})
    }

    #[test]
    fn unrelated_spacers_and_avatar_are_not_compared_with_controls_or_fields() {
        let field = |id: &str| {
            json!({"type":"frame","id":id,"layout":"vertical",
            "height":"fit_content", "children":[
                {"type":"text","id":format!("{id}-label"),"content":"Label"},
                {"type":"text","id":format!("{id}-value"),"content":"Value"}
            ]})
        };
        let root = node(json!({"type":"frame","id":"screen","children":[
            {"type":"frame","id":"navigation","layout":"vertical","children":[
                {"type":"frame","id":"gap","width":1,"height":28},
                nav_item("one",44,4),nav_item("two",44,4),nav_item("three",44,4),
                nav_item("four",44,4),nav_item("five",44,4),
                {"type":"frame","id":"flex-gap","width":1,"height":"fill_container"}
            ]},
            {"type":"frame","id":"details","layout":"vertical","children":[
                {"type":"frame","id":"avatar","layout":"horizontal","width":48,"height":48,
                    "cornerRadius":999,"children":[{"type":"text","id":"initial","content":"A"}]},
                field("email"),field("phone"),field("owner")
            ]}
        ]}));
        let findings = detect_sibling_inconsistencies(&root);
        assert!(
            findings.is_empty(),
            "unrelated objects are not peers: {findings:?}"
        );
        let radii = detect_mixed_sibling_corner_radius(&root);
        assert!(
            radii.is_empty(),
            "spacers have no visible corners: {radii:?}"
        );
    }

    #[test]
    fn unlabelled_structural_peers_remain_reviewable_without_automatic_restyle() {
        let root = node(json!({"type":"frame","id":"screen","children":[
            nav_item("one",44,4),nav_item("two",44,4),nav_item("three",28,8)
        ]}));
        let findings = detect_sibling_inconsistencies(&root);
        assert!(findings
            .iter()
            .any(|i| i.node_id == "three" && i.property == FixProperty::Height));
        assert!(findings
            .iter()
            .any(|i| i.node_id == "three" && i.property == FixProperty::CornerRadius));
        assert!(
            findings.iter().all(|i| i.severity == IssueSeverity::Info),
            "unlabelled peers need review: {findings:?}"
        );
        let radii = detect_mixed_sibling_corner_radius(&root);
        assert_eq!(radii[0].severity, IssueSeverity::Info);
    }

    #[test]
    fn thin_reusable_nodes_are_not_assumed_to_be_spacers() {
        let reusable = |id, radius| {
            json!({"type":"frame","id":id,"reusable":true,
            "width":1,"height":30,"cornerRadius":radius})
        };
        let root = node(json!({"type":"frame","id":"root","children":[
            reusable("one",4),reusable("two",4),reusable("three",8)
        ]}));
        assert!(detect_mixed_sibling_corner_radius(&root)
            .iter()
            .any(|i| i.node_id == "three"));
    }

    #[test]
    fn hidden_siblings_do_not_create_visual_outliers() {
        let root = node(json!({"type":"frame","id":"root","children":[
            {"type":"frame","id":"one","role":"button","cornerRadius":4},
            {"type":"frame","id":"two","role":"button","cornerRadius":4},
            {"type":"frame","id":"hidden","role":"button","cornerRadius":8,"visible":false}
        ]}));
        assert!(detect_mixed_sibling_corner_radius(&root).is_empty());
    }

    #[test]
    fn zero_sized_unpainted_spacers_are_not_compared_with_visible_peers() {
        for (width, height) in [(0, 28), (28, 0)] {
            let root = node(json!({"type":"frame","id":"root","children":[
                {"type":"frame","id":"one","width":100,"height":44,"fill":[{"type":"solid","color":"#cccccc"}],"cornerRadius":8},
                {"type":"frame","id":"two","width":100,"height":44,"fill":[{"type":"solid","color":"#cccccc"}],"cornerRadius":8},
                {"type":"frame","id":"gap","width":width,"height":height}
            ]}));
            let mut issues = detect_sibling_inconsistencies(&root);
            issues.extend(detect_mixed_sibling_corner_radius(&root));
            assert!(
                issues.iter().all(|i| i.node_id != "gap"),
                "zero-sized spacer: {issues:?}"
            );
        }
    }

    #[test]
    fn hidden_ancestor_suppresses_all_sibling_comparisons_in_its_subtree() {
        let root = node(json!({"type":"frame","id":"root","children":[
            {"type":"frame","id":"hidden","visible":false,"children":[
                {"type":"frame","id":"one","role":"button","height":44,"cornerRadius":4,"padding":8},
                {"type":"frame","id":"two","role":"button","height":44,"cornerRadius":4,"padding":8},
                {"type":"frame","id":"three","role":"button","height":28,"cornerRadius":8,"padding":16}
            ]}
        ]}));
        assert!(detect_sibling_inconsistencies(&root).is_empty());
        assert!(detect_mixed_sibling_corner_radius(&root).is_empty());
        assert!(detect_mixed_sibling_padding(&root).is_empty());
    }
}
