use std::collections::{BTreeMap, BTreeSet};

use jian_ops_schema::node::PenNode;
use jian_ops_schema::PenDocument;
use op_design_lint::{detect_all, Issue, IssueCategory, IssueSeverity};
use op_editor_core::{EditorState, PenNodeExt};

use super::{McpTool, ToolErrorCode, ToolOutcome};

/// Default and maximum number of issues returned per page.
const DEFAULT_LIMIT: usize = 50;
const MAX_LIMIT: usize = 500;

pub struct LintDocument {
    doc: PenDocument,
    revision: u64,
}

fn arg_flag(args: &BTreeMap<String, String>, key: &str) -> bool {
    args.get(key)
        .is_some_and(|value| matches!(value.trim().trim_matches('"'), "true" | "1"))
}

fn find_in<'a>(node: &'a PenNode, id: &str) -> Option<&'a PenNode> {
    if node.id_str() == id {
        return Some(node);
    }
    node.children()?.iter().find_map(|child| find_in(child, id))
}

fn subtree_ids(node: &PenNode, out: &mut BTreeSet<String>) {
    out.insert(node.id_str().to_string());
    if let Some(children) = node.children() {
        for child in children {
            subtree_ids(child, out);
        }
    }
}

fn wire_name<T: serde::Serialize>(value: &T) -> String {
    serde_json::to_value(value)
        .ok()
        .and_then(|value| value.as_str().map(str::to_string))
        .unwrap_or_default()
}

impl LintDocument {
    fn roots(&self) -> Vec<&PenNode> {
        let mut roots: Vec<&PenNode> = self
            .doc
            .pages
            .iter()
            .flatten()
            .flat_map(|page| page.children.iter())
            .collect();
        roots.extend(self.doc.children.iter());
        roots
    }

    /// Top-level root index holding `id` plus the ids of `id`'s subtree.
    fn scope_of(&self, roots: &[&PenNode], id: &str) -> Option<(usize, BTreeSet<String>)> {
        roots.iter().enumerate().find_map(|(index, root)| {
            let node = find_in(root, id)?;
            let mut ids = BTreeSet::new();
            subtree_ids(node, &mut ids);
            Some((index, ids))
        })
    }
}

impl McpTool for LintDocument {
    fn name(&self) -> &str {
        "lint_document"
    }

    fn call(&self, args: &BTreeMap<String, String>) -> ToolOutcome {
        let roots = self.roots();
        let mut scoped_roots = BTreeSet::new();
        let allowed = match args
            .get("nodeId")
            .or_else(|| args.get("rootId"))
            .map(|value| value.trim())
        {
            None | Some("") => None,
            Some(node_id) => match self.scope_of(&roots, node_id) {
                Some((root, ids)) => {
                    scoped_roots.insert(root);
                    Some(ids)
                }
                None => {
                    return ToolOutcome::Err(
                        ToolErrorCode::InvalidArgument,
                        format!("nodeId not found: {node_id}"),
                    );
                }
            },
        };
        let allowed = if let Some(raw) = args.get("nodeIds") {
            let ids: Vec<String> = match serde_json::from_str(raw) {
                Ok(ids) => ids,
                Err(err) => {
                    return ToolOutcome::Err(
                        ToolErrorCode::InvalidArgument,
                        format!("nodeIds must be an array: {err}"),
                    );
                }
            };
            let mut union = BTreeSet::new();
            let mut union_roots = BTreeSet::new();
            for id in ids {
                let Some((root, ids)) = self.scope_of(&roots, &id) else {
                    return ToolOutcome::Err(
                        ToolErrorCode::InvalidArgument,
                        format!("nodeId not found: {id}"),
                    );
                };
                union_roots.insert(root);
                union.extend(ids);
            }
            Some(match allowed {
                Some(previous) => {
                    scoped_roots.retain(|root| union_roots.contains(root));
                    previous.intersection(&union).cloned().collect()
                }
                None => {
                    scoped_roots = union_roots;
                    union
                }
            })
        } else {
            allowed
        };
        let rules: Option<Vec<IssueCategory>> = match args.get("rules") {
            Some(raw) => match serde_json::from_str(raw) {
                Ok(rules) => Some(rules),
                Err(err) => {
                    return ToolOutcome::Err(
                        ToolErrorCode::InvalidArgument,
                        format!("rules must be an array of known lint categories: {err}"),
                    );
                }
            },
            None => None,
        };
        let severity: Option<IssueSeverity> = match args.get("severity") {
            None => None,
            Some(raw) => {
                let name = raw.trim().trim_matches('"');
                match serde_json::from_value(serde_json::Value::String(name.to_string())) {
                    Ok(severity) => Some(severity),
                    Err(_) => {
                        return ToolOutcome::Err(
                            ToolErrorCode::InvalidArgument,
                            "severity must be error, warning or info".into(),
                        );
                    }
                }
            }
        };
        let limit = match args
            .get("limit")
            .map(|raw| raw.trim().trim_matches('"').parse::<usize>())
        {
            None => DEFAULT_LIMIT,
            Some(Ok(limit)) if (1..=MAX_LIMIT).contains(&limit) => limit,
            Some(_) => {
                return ToolOutcome::Err(
                    ToolErrorCode::InvalidArgument,
                    format!("limit must be an integer between 1 and {MAX_LIMIT}"),
                );
            }
        };
        let offset = match args.get("cursor").map(|raw| raw.trim().trim_matches('"')) {
            None | Some("") => 0,
            Some(cursor) => match cursor.split_once(':').and_then(|(rev, offset)| {
                Some((rev.parse::<u64>().ok()?, offset.parse::<usize>().ok()?))
            }) {
                Some((revision, offset)) if revision == self.revision => offset,
                Some(_) => {
                    return ToolOutcome::Err(
                        ToolErrorCode::InvalidArgument,
                        "cursor is stale: the document changed; run lint_document again".into(),
                    );
                }
                None => {
                    return ToolOutcome::Err(
                        ToolErrorCode::InvalidArgument,
                        "cursor is malformed; pass nextCursor from a previous reply".into(),
                    );
                }
            },
        };

        // Detectors see each board whole (sibling/parent context), so a
        // scoped lint runs on the boards holding the scope and then filters.
        let mut issues: Vec<Issue> = Vec::new();
        for (index, root) in roots.iter().enumerate() {
            if allowed.is_some() && !scoped_roots.contains(&index) {
                continue;
            }
            issues.extend(detect_all(root, &self.doc));
        }
        let issues: Vec<Issue> = issues
            .into_iter()
            .filter(|issue| {
                allowed
                    .as_ref()
                    .is_none_or(|ids| ids.contains(&issue.node_id))
            })
            .filter(|issue| {
                rules
                    .as_ref()
                    .is_none_or(|rules| rules.contains(&issue.category))
            })
            .filter(|issue| severity.is_none_or(|severity| issue.severity == severity))
            .collect();
        let mut by_category: BTreeMap<String, usize> = BTreeMap::new();
        let mut by_severity: BTreeMap<String, usize> = BTreeMap::new();
        for issue in &issues {
            *by_category.entry(wire_name(&issue.category)).or_default() += 1;
            *by_severity.entry(wire_name(&issue.severity)).or_default() += 1;
        }
        let total = issues.len();
        let page: Vec<serde_json::Value> = if arg_flag(args, "summaryOnly") {
            Vec::new()
        } else {
            issues
                .iter()
                .skip(offset)
                .take(limit)
                .map(|issue| {
                    let mut value = serde_json::json!(issue);
                    value["issueId"] = serde_json::json!(issue_id(issue));
                    value
                })
                .collect()
        };
        let end = offset + page.len();
        let next_cursor =
            (!page.is_empty() && end < total).then(|| format!("{}:{end}", self.revision));
        ToolOutcome::OkJson(
            serde_json::json!({
                "count": total,
                "returned": page.len(),
                "byCategory": by_category,
                "bySeverity": by_severity,
                "issues": page,
                "nextCursor": next_cursor,
            })
            .to_string(),
        )
    }
}

pub(crate) fn issue_id(issue: &Issue) -> String {
    op_editor_core::design_lint::issue_id(issue)
}

pub fn lint_document_snapshot(state: &EditorState) -> LintDocument {
    LintDocument {
        doc: state.doc.clone(),
        revision: state.document_revision(),
    }
}
