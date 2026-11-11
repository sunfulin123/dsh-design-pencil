//! Native design-quality inspection and bounded findings.

use serde_json::json;

use crate::{
    quality_reuse, quality_tokens, quality_variables,
    replies::{error_reply, ok_reply},
    touch_target_quality, DesignEngine,
};

impl DesignEngine {
    pub(crate) fn call_get_design_quality(
        &self,
        args: &std::collections::BTreeMap<String, String>,
    ) -> String {
        use op_design_lint::IssueCategory;

        let limit = match args.get("limit").map(|raw| raw.trim().trim_matches('"')) {
            None | Some("") => 30,
            Some(raw) => match raw.parse::<usize>() {
                Ok(limit) if (1..=500).contains(&limit) => limit,
                _ => return error_reply("limit must be an integer between 1 and 500"),
            },
        };
        let target_offset = match args
            .get("touchTargetOffset")
            .map(|raw| raw.trim().trim_matches('"'))
        {
            None | Some("") => 0,
            Some(raw) => match raw.parse::<usize>() {
                Ok(offset) => offset,
                Err(_) => return error_reply("touchTargetOffset must be a non-negative integer"),
            },
        };
        let scope = args
            .get("rootId")
            .map(|raw| raw.trim().trim_matches('"'))
            .filter(|raw| !raw.is_empty());
        let mut scoped_ids = std::collections::BTreeSet::new();
        let mut roots: Vec<&jian_ops_schema::node::PenNode> = Vec::new();
        for root in self.state.active_children() {
            match scope {
                None => roots.push(root),
                Some(id) => {
                    if let Some(node) = op_editor_core::walkers::find_node(
                        std::slice::from_ref(root),
                        &op_editor_core::NodeId::new(id),
                    ) {
                        collect_quality_scope(node, &mut scoped_ids);
                        roots.push(root);
                    }
                }
            }
        }
        if let (Some(id), true) = (scope, roots.is_empty()) {
            return error_reply(&format!("rootId not found on the active page: {id}"));
        }

        let mut geometry_issues = Vec::new();
        let mut layout_issues = Vec::new();
        let mut contrast_issues = Vec::new();
        let mut icon_issues = Vec::new();
        let mut structure_issues = Vec::new();
        let mut empty_shells = Vec::new();
        let mut intent_questions = Vec::new();
        let mut findings = Vec::new();

        for root in roots {
            for issue in op_design_lint::detect_all(root, &self.state.doc) {
                if scope.is_some() && !scoped_ids.contains(&issue.node_id) {
                    continue;
                }
                findings.push(json!({
                    "nodeId": issue.node_id,
                    "category": quality_category(issue.category),
                    "detector": issue.category,
                    "severity": issue.severity,
                    "evidence": issue.reason,
                    "suggestion": if issue.suggested_value.is_null() {
                        "Inspect the issue and choose a correction appropriate to the selected design."
                    } else {
                        "Review the suggested value in the context of the selected design."
                    },
                    "property": issue.property,
                    "currentValue": issue.current_value,
                    "suggestedValue": issue.suggested_value,
                }));
                let detail = format!("{}: {}", issue.node_id, issue.reason);
                match issue.category {
                    IssueCategory::MixedSiblingCornerRadius
                    | IssueCategory::SiblingInconsistency
                    | IssueCategory::TextCornerRadius
                    | IssueCategory::UnexpectedRotation => geometry_issues.push(detail),
                    IssueCategory::MixedSiblingPadding
                    | IssueCategory::EdgeSectionPadding
                    | IssueCategory::StackedHorizontalPadding
                    | IssueCategory::TextExplicitHeight
                    | IssueCategory::TopAnchoredBars
                    | IssueCategory::NoBaselineBars
                    | IssueCategory::AbsolutePositioningShare => layout_issues.push(detail),
                    IssueCategory::TextBgContrast => contrast_issues.push(json!({
                        "nodeId": issue.node_id,
                        "reason": issue.reason,
                        "currentValue": issue.current_value,
                        "suggestedValue": issue.suggested_value,
                    })),
                    IssueCategory::EmptyPath => icon_issues.push(detail),
                    IssueCategory::EmptyFilledPanel | IssueCategory::InvisibleContainer => {
                        empty_shells.push(detail);
                    }
                    IssueCategory::SlopPurpleGlowGradient
                    | IssueCategory::SlopThreeCardFeatureRow
                    | IssueCategory::SlopRoundedCardWall => intent_questions.push(detail),
                    IssueCategory::RedundantWrapper
                    | IssueCategory::ExcessiveNestingDepth
                    | IssueCategory::ExcessiveFrameEffects
                    | IssueCategory::TextEffect
                    | IssueCategory::TextStroke
                    | IssueCategory::WidgetA11y
                    | IssueCategory::ShaderBudget
                    | IssueCategory::ShaderInvalid
                    | IssueCategory::MotionBudget => structure_issues.push(detail),
                }
            }
        }

        let mut nav_issues =
            match touch_target_quality::check(&self.state, scope.map(|_| &scoped_ids)) {
                Ok(issues) => issues,
                Err(message) => return error_reply(&message),
            };

        let mut variable_issues = quality_variables::check(&self.state, scope.map(|_| &scoped_ids));
        let mut token_observations =
            quality_tokens::observe(&self.state, scope.map(|_| &scoped_ids));
        let mut reuse_candidates = quality_reuse::observe(&self.state, scope.map(|_| &scoped_ids));
        for issue in &variable_issues {
            findings.push(json!({
                "nodeId": issue["nodeId"], "category": "variables", "severity": issue["severity"],
                "evidence": issue["reason"], "suggestion": issue["suggestion"],
                "property": issue["property"], "reference": issue["reference"],
            }));
        }

        for issue in &nav_issues {
            findings.push(json!({
                "nodeId": issue["nodeId"],
                "category": "touchTargets",
                "severity": "warning",
                "evidence": issue["reason"],
                "suggestion": "Review the target size for its platform and verify the resulting layout.",
                "suggestedPatch": issue["suggestedPatch"],
            }));
        }

        let counts = json!({
            "geometryIssues": geometry_issues.len(),
            "layoutIssues": layout_issues.len(),
            "contrastIssues": contrast_issues.len(),
            "iconIssues": icon_issues.len(),
            "structureIssues": structure_issues.len(),
            "emptyShells": empty_shells.len(),
            "intentQuestions": intent_questions.len(),
            "navIssues": nav_issues.len(),
            "variableIssues": variable_issues.len(),
            "tokenObservations": token_observations.len(),
            "componentReuseCandidates": reuse_candidates.len(),
        });
        let token_observations_truncated = token_observations.len() > limit;
        let reuse_candidates_truncated = reuse_candidates.len() > limit;
        let target_total = nav_issues.len();
        let target_end = target_offset.saturating_add(limit).min(target_total);
        let target_next_offset = (target_end < target_total).then_some(target_end);
        let truncated = [
            geometry_issues.len(),
            layout_issues.len(),
            contrast_issues.len(),
            icon_issues.len(),
            structure_issues.len(),
            empty_shells.len(),
            intent_questions.len(),
            nav_issues.len(),
            variable_issues.len(),
            findings.len(),
        ]
        .iter()
        .any(|len| *len > limit);
        geometry_issues.truncate(limit);
        layout_issues.truncate(limit);
        contrast_issues.truncate(limit);
        icon_issues.truncate(limit);
        structure_issues.truncate(limit);
        empty_shells.truncate(limit);
        intent_questions.truncate(limit);
        nav_issues = nav_issues
            .into_iter()
            .skip(target_offset)
            .take(limit)
            .collect();
        variable_issues.truncate(limit);
        token_observations.truncate(limit);
        reuse_candidates.truncate(limit);
        findings.truncate(limit);
        ok_reply(json!({
            "counts": counts,
            "truncated": truncated,
            "tokenObservationsTruncated": token_observations_truncated,
            "componentReuseCandidatesTruncated": reuse_candidates_truncated,
            "touchTargetsNextOffset": target_next_offset,
            "geometryIssues": geometry_issues,
            "layoutIssues": layout_issues,
            "contrastIssues": contrast_issues,
            "iconIssues": icon_issues,
            "structureIssues": structure_issues,
            "emptyShells": empty_shells,
            "intentQuestions": intent_questions,
            "variableIssues": variable_issues,
            "tokenObservations": token_observations,
            "componentReuseCandidates": reuse_candidates,
            "imageSlots": [],
            "navIssues": nav_issues,
            "findings": findings,
            "coverage": {
                "geometry": {"status": "checked", "reason": "Selected geometry heuristics only; a clean result is not a complete visual review."},
                "layout": {"status": "checked", "reason": "Selected layout heuristics only; inspect the rendered layout as well."},
                "icons": {"status": "checked", "reason": "Detects empty paths, not icon correctness or meaning."},
                "structure": {"status": "checked", "reason": "Selected structure and widget-label heuristics only."},
                "touchTargets": {"status": "checked", "reason": "A 44px recommendation for interactive frame/rectangle roles or click/press prototype actions, including linked refs inheriting their master's role or reaction. Other node types and inferred interactions are not covered. Results are sorted by smallest dimension and can be paged with touchTargetOffset; inspect clipping, overlap and actual behavior. This is not a WCAG compliance determination."},
                "componentReuse": {"status": "indeterminate", "reason": "Reports repeated small sibling structures with matching authored layout. Styles may differ, and it cannot infer shared semantics, behavior, desired variants or every reuse opportunity."},
                "contrast": {"status": "indeterminate", "reason": "The heuristic cannot reliably determine all rendered backgrounds, alpha, image fills, gradients, or non-default modes. Inspect actual rendered contrast."},
                "variables": {"status": "indeterminate", "reason": "Checks typed variableBindings in the active inherited mode only; inline references, other modes, unbound values, and token conformity are not comprehensively checked."},
                "tokens": {"status": "indeterminate", "reason": "Compares selected literal text sizes, spacing and solid fills to active document variables by value, and reports component descendant overrides; matching values do not establish semantic intent or compliance. Other properties, modes, and freeform DESIGN prose are not comprehensively checked."},
                "imageSlots": {"status": "unsupported", "reason": "Image slot completeness is not checked by this tool."},
                "visualReview": {"status": "unsupported", "reason": "This tool does not inspect a rendered screenshot."},
                "interaction": {"status": "unsupported", "reason": "Keyboard and prototype interaction are not executed by this tool."},
            },
        }))
    }
}

fn quality_category(category: op_design_lint::IssueCategory) -> &'static str {
    use op_design_lint::IssueCategory::*;
    match category {
        MixedSiblingCornerRadius | SiblingInconsistency | TextCornerRadius | UnexpectedRotation => {
            "geometry"
        }
        MixedSiblingPadding
        | EdgeSectionPadding
        | StackedHorizontalPadding
        | TextExplicitHeight
        | TopAnchoredBars
        | NoBaselineBars
        | AbsolutePositioningShare => "layout",
        TextBgContrast => "contrast",
        EmptyPath => "icons",
        EmptyFilledPanel | InvisibleContainer => "emptyShells",
        SlopPurpleGlowGradient | SlopThreeCardFeatureRow | SlopRoundedCardWall => "intentQuestions",
        _ => "structure",
    }
}

fn collect_quality_scope(
    node: &jian_ops_schema::node::PenNode,
    out: &mut std::collections::BTreeSet<String>,
) {
    use op_editor_core::PenNodeExt;
    out.insert(node.id_str().to_string());
    if let Some(children) = node.children() {
        for child in children {
            collect_quality_scope(child, out);
        }
    }
}
