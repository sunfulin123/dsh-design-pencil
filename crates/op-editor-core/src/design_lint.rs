//! Shared diagnostic snapshots for inspector and MCP authoring.
use crate::{EditorCommand, EditorState, NodeId, PenNodeExt};
use jian_ops_schema::{node::PenNode, PenDocument};
use op_design_lint::{apply_fixes, detect_all, FixProperty, FixReport, Issue};
use serde_json::{json, Value};
use std::collections::BTreeSet;

pub fn issue_id(issue: &Issue) -> String {
    format!(
        "{}:{}:{}:{}",
        issue.node_id,
        json!(issue.category)
            .as_str()
            .expect("lint category is a string"),
        issue.property.wire_str(),
        issue.current_value
    )
}

pub struct DesignLintSnapshot {
    document: PenDocument,
    pub issues: Vec<Issue>,
    editable: BTreeSet<String>,
}

impl DesignLintSnapshot {
    pub fn new(state: &EditorState) -> Self {
        let mut document = state.doc.clone();
        document.pages = None;
        document.children = state.active_children().to_vec();
        let issues: Vec<Issue> = document
            .children
            .iter()
            .flat_map(|root| detect_all(root, &document))
            .collect();
        let editable = issues
            .iter()
            .filter(|issue| {
                let id = NodeId::new(&issue.node_id);
                let mut current = id.clone();
                loop {
                    if !state.is_editable(&current) {
                        return false;
                    }
                    match crate::walkers::find_parent_and_index(state.active_children(), &current) {
                        Some((Some(parent), _)) => current = parent,
                        Some((None, _)) => break,
                        None => return false,
                    }
                }
                issue.property != FixProperty::Remove || state.is_subtree_unlocked(&id)
            })
            .map(issue_id)
            .collect();
        Self {
            document,
            issues,
            editable,
        }
    }

    pub fn prepare(
        &self,
        selected: Option<&BTreeSet<String>>,
    ) -> Result<(Option<EditorCommand>, FixReport), String> {
        if let Some(selected) = selected {
            let known: BTreeSet<_> = self.issues.iter().map(issue_id).collect();
            if let Some(unknown) = selected.iter().find(|id| !known.contains(*id)) {
                return Err(format!(
                    "lint issue {unknown} is stale or not on the active page; lint again"
                ));
            }
        }
        let issues: Vec<_> = self
            .issues
            .iter()
            .filter(|issue| selected.is_none_or(|ids| ids.contains(&issue_id(issue))))
            .cloned()
            .collect();
        if let Some(issue) = issues
            .iter()
            .find(|issue| !self.editable.contains(&issue_id(issue)))
        {
            return Err(format!("node {} is locked or not editable", issue.node_id));
        }
        let mut after = self.document.clone();
        let report = apply_fixes(&mut after, &issues);
        let mut commands = Vec::new();
        collect_fixes(&self.document.children, &after.children, &mut commands);
        Ok((
            (!commands.is_empty()).then_some(EditorCommand::Batch { commands }),
            report,
        ))
    }
}

fn collect_fixes(before: &[PenNode], after: &[PenNode], commands: &mut Vec<EditorCommand>) {
    for node in before {
        let Some(updated) = after
            .iter()
            .find(|updated| updated.id_str() == node.id_str())
        else {
            commands.push(EditorCommand::DeleteNode {
                node_id: NodeId::new(node.id_str()),
                page_id: None,
            });
            continue;
        };
        if updated == node {
            continue;
        }
        let old = json!(node);
        let new = json!(updated);
        let mut patch = serde_json::Map::new();
        if let (Some(old), Some(new)) = (old.as_object(), new.as_object()) {
            for key in old.keys().chain(new.keys()) {
                if !matches!(key.as_str(), "id" | "type" | "children")
                    && old.get(key) != new.get(key)
                {
                    patch.insert(key.clone(), new.get(key).cloned().unwrap_or(Value::Null));
                }
            }
        }
        if !patch.is_empty() {
            commands.push(EditorCommand::PatchNodeData {
                node_id: NodeId::new(node.id_str()),
                patch_json: Value::Object(patch).to_string(),
                page_id: None,
            });
        }
        collect_fixes(
            node.children().map(Vec::as_slice).unwrap_or_default(),
            updated.children().map(Vec::as_slice).unwrap_or_default(),
            commands,
        );
    }
}

#[cfg(test)]
#[path = "design_lint_tests.rs"]
mod tests;
