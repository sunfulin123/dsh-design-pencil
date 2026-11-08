use std::collections::{BTreeMap, BTreeSet};

use crate::{McpTool, ToolErrorCode, ToolOutcome};
use op_editor_core::{design_lint::DesignLintSnapshot, EditorState};
use serde_json::json;

pub struct FixLintIssues {
    snapshot: DesignLintSnapshot,
}

pub fn fix_lint_issues_snapshot(state: &EditorState) -> FixLintIssues {
    FixLintIssues {
        snapshot: DesignLintSnapshot::new(state),
    }
}

impl McpTool for FixLintIssues {
    fn name(&self) -> &str {
        "fix_lint_issues"
    }

    fn call(&self, args: &BTreeMap<String, String>) -> ToolOutcome {
        let selected: Option<BTreeSet<String>> = match args.get("issueIds") {
            Some(raw) => match serde_json::from_str(raw) {
                Ok(ids) => Some(ids),
                Err(err) => {
                    return ToolOutcome::Err(
                        ToolErrorCode::InvalidArgument,
                        format!("issueIds must be a JSON array: {err}"),
                    );
                }
            },
            None if args.get("all").is_some_and(|all| all == "true") => None,
            None => {
                return ToolOutcome::Err(
                    ToolErrorCode::MissingArgument,
                    "provide issueIds or all:true".into(),
                );
            }
        };
        match self.snapshot.prepare(selected.as_ref()) {
            Err(error) => ToolOutcome::Err(ToolErrorCode::InvalidArgument, error),
            Ok((Some(command), report)) => ToolOutcome::OkJsonWithCommand(
                json!({"fixed":report.total,"byCategory":report.by_category}).to_string(),
                command,
            ),
            Ok((None, _)) => {
                let issues: Vec<_> = self
                    .snapshot
                    .issues
                    .iter()
                    .filter(|issue| {
                        selected.as_ref().is_none_or(|ids| {
                            ids.contains(&op_editor_core::design_lint::issue_id(issue))
                        })
                    })
                    .collect();
                ToolOutcome::OkJson(json!({"fixed":0,"remaining":issues,
                    "message":"No safe automatic fixes; author or restructure these nodes explicitly"}).to_string())
            }
        }
    }
}
