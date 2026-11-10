//! Native design-quality inspection and bounded findings.

use serde_json::json;

use crate::{
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

        for root in roots {
            for issue in op_design_lint::detect_all(root, &self.state.doc) {
                if scope.is_some() && !scoped_ids.contains(&issue.node_id) {
                    continue;
                }
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

        let counts = json!({
            "geometryIssues": geometry_issues.len(),
            "layoutIssues": layout_issues.len(),
            "contrastIssues": contrast_issues.len(),
            "iconIssues": icon_issues.len(),
            "structureIssues": structure_issues.len(),
            "emptyShells": empty_shells.len(),
            "intentQuestions": intent_questions.len(),
            "navIssues": nav_issues.len(),
        });
        let truncated = [
            geometry_issues.len(),
            layout_issues.len(),
            contrast_issues.len(),
            icon_issues.len(),
            structure_issues.len(),
            empty_shells.len(),
            intent_questions.len(),
            nav_issues.len(),
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
        nav_issues.truncate(limit);
        ok_reply(json!({
            "counts": counts,
            "truncated": truncated,
            "geometryIssues": geometry_issues,
            "layoutIssues": layout_issues,
            "contrastIssues": contrast_issues,
            "iconIssues": icon_issues,
            "structureIssues": structure_issues,
            "emptyShells": empty_shells,
            "intentQuestions": intent_questions,
            "variableIssues": [],
            "imageSlots": [],
            "navIssues": nav_issues,
        }))
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
