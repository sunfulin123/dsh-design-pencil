//! Variable library tools — the Figma library flow over MCP.
//!
//! Library variables enter a document when a tool call uses them: the call's
//! arguments are scanned for library names (`$--primary-9`, `--gray-6`) and
//! those variables, with their alias closure, are imported into the working
//! copy the tool runs against, inside the same undo step. Explicit tools list
//! libraries, import chosen variables, and review/accept library updates.

use op_editor_core::variable_library::{
    self, accept_library_updates, import_library_variables, library_updates,
    referenced_library_names, PREFERRED_LIBRARY_ID,
};
use op_editor_core::EditorState;
use serde_json::{json, Value};
use std::collections::BTreeMap;

use crate::{error_reply, ok_reply, DesignEngine};

#[path = "prototype_simulation.rs"]
mod prototype_simulation;
#[path = "prototype_tools.rs"]
pub(crate) mod prototype_tools;

const LIBRARY: &str = "Built-in library id; defaults to talkdesk-cobalt.";

pub(crate) fn schemas() -> Vec<Value> {
    let names = json!({"type":"array","items":{"type":"string"},"minItems":1});
    vec![
        json!({"name":"list_libraries","description":"List built-in variable libraries (Figma team-library model). Talkdesk Cobalt is first and the default: reference its variables directly, e.g. fill \"$--primary-9\", and they are imported into the document with their aliases on first use.",
            "inputSchema":{"type":"object","properties":{},"required":[],"additionalProperties":false}}),
        json!({"name":"list_library_variables","description":"List a library's variables with collection, Figma group path, type and value; filter by collection, group prefix or name query. Values that are aliases show the target ($--purple-9).",
            "inputSchema":{"type":"object","additionalProperties":false,"required":[],"properties":{
                "library":{"type":"string","description":LIBRARY},"collection":{"type":"string"},
                "group":{"type":"string","description":"Figma group path prefix, e.g. Colors/Primary"},
                "query":{"type":"string"},"offset":{"type":"integer","minimum":0},
                "limit":{"type":"integer","minimum":1,"maximum":500}}}}),
        json!({"name":"import_library_variables","description":"Import library variables (and the variables their aliases reach) into the document in one undo step. Existing document variables are never overwritten.",
            "inputSchema":{"type":"object","additionalProperties":false,"required":["names"],"properties":{"names":names}}}),
        json!({"name":"get_library_updates","description":"List linked document variables whose library value differs from the document (Figma \"library updates\"). Nothing changes until accept_library_updates.",
            "inputSchema":{"type":"object","properties":{},"required":[],"additionalProperties":false}}),
        json!({"name":"accept_library_updates","description":"Accept library updates in one undo step: all, or only `names`.",
            "inputSchema":{"type":"object","additionalProperties":false,"required":[],"properties":{"names":names}}}),
    ]
    .into_iter()
    .chain(prototype_tools::schemas())
    .collect()
}

fn names_arg(args: &BTreeMap<String, String>) -> Result<Option<Vec<String>>, String> {
    args.get("names")
        .map(|raw| {
            serde_json::from_str(raw).map_err(|e| format!("names must be a string array: {e}"))
        })
        .transpose()
}

fn variable_entry(variable: &variable_library::LibraryVariable) -> Value {
    json!({
        "name": variable.name,
        "figmaName": variable.figma_name,
        "collection": variable.collection,
        "type": variable.definition.kind,
        "value": variable.definition.value,
    })
}

fn list_variables(args: &BTreeMap<String, String>) -> String {
    let id = args
        .get("library")
        .map_or(PREFERRED_LIBRARY_ID, String::as_str);
    let Some(library) = variable_library::library(id) else {
        return error_reply(&format!("unknown library {id:?}"));
    };
    let query = args.get("query").map(|q| q.to_lowercase());
    let matches: Vec<Value> = library
        .variables
        .values()
        .filter(|v| args.get("collection").is_none_or(|c| &v.collection == c))
        .filter(|v| {
            args.get("group")
                .is_none_or(|g| v.figma_name.starts_with(g.as_str()))
        })
        .filter(|v| {
            query.as_deref().is_none_or(|q| {
                v.name.to_lowercase().contains(q) || v.figma_name.to_lowercase().contains(q)
            })
        })
        .map(variable_entry)
        .collect();
    let offset = args
        .get("offset")
        .and_then(|o| o.parse().ok())
        .unwrap_or(0usize);
    let limit = args
        .get("limit")
        .and_then(|l| l.parse().ok())
        .unwrap_or(100usize);
    let next = (offset + limit < matches.len()).then_some(offset + limit);
    ok_reply(json!({
        "library": library.id, "version": library.version, "count": matches.len(),
        "nextOffset": next,
        "variables": matches.into_iter().skip(offset).take(limit).collect::<Vec<_>>(),
    }))
}

fn list_libraries() -> String {
    let libraries: Vec<Value> = variable_library::libraries()
        .iter()
        .map(|library| {
            json!({
                "id": library.id, "name": library.name, "version": library.version,
                "preferred": library.id == PREFERRED_LIBRARY_ID,
                "collections": library.collections.iter().map(|c| json!({
                    "name": c.name, "modes": c.modes,
                    "variableCount": library.variables.values().filter(|v| v.collection == c.name).count(),
                })).collect::<Vec<_>>(),
            })
        })
        .collect();
    ok_reply(json!({ "libraries": libraries }))
}

/// A working copy with the library variables `arguments` mention, or `None`
/// when the call uses none.
pub(crate) fn with_referenced_imports(
    state: &EditorState,
    tool_name: &str,
    arguments: &str,
) -> Option<EditorState> {
    if tool_name == "set_design_md" {
        return None;
    }
    let names = referenced_library_names(&state.doc, arguments);
    if names.is_empty() {
        return None;
    }
    let mut next = state.clone();
    import_library_variables(&mut next.doc, names);
    Some(next)
}

impl DesignEngine {
    /// Library tools, or `None` for any other tool name.
    pub(crate) fn call_library_tool(
        &mut self,
        name: &str,
        args: &BTreeMap<String, String>,
    ) -> Option<String> {
        Some(match name {
            "list_libraries" => list_libraries(),
            "list_library_variables" => list_variables(args),
            "get_library_updates" => {
                let updates: Vec<Value> = library_updates(&self.state.doc)
                    .into_iter()
                    .map(|u| {
                        json!({"name":u.name,"library":u.library,"collection":u.collection,
                        "current":u.current.value,"latest":u.latest.value})
                    })
                    .collect();
                ok_reply(json!({ "count": updates.len(), "updates": updates }))
            }
            "import_library_variables" => match names_arg(args) {
                Ok(Some(names)) => self.mutate_library(|doc| import_library_variables(doc, names)),
                Ok(None) => error_reply("names is required"),
                Err(e) => error_reply(&e),
            },
            "accept_library_updates" => match names_arg(args) {
                Ok(names) => {
                    self.mutate_library(|doc| accept_library_updates(doc, names.as_deref()))
                }
                Err(e) => error_reply(&e),
            },
            "apply_design_system" if args.get("name").map(String::as_str) == Some("cobalt") => {
                let all: Vec<String> = variable_library::library(PREFERRED_LIBRARY_ID)
                    .map(|l| l.variables.keys().cloned().collect())
                    .unwrap_or_default();
                self.mutate_library(|doc| import_library_variables(doc, all))
            }
            _ => return self.call_prototype_tool(name, args),
        })
    }

    fn mutate_library(
        &mut self,
        change: impl FnOnce(&mut jian_ops_schema::PenDocument) -> Vec<String>,
    ) -> String {
        let mut next = self.state.clone();
        let changed = change(&mut next.doc);
        if !changed.is_empty() {
            next.history_push_past(self.state.snapshot_for_history());
            let previous = std::mem::replace(&mut self.state, next);
            self.changes.record_commit(previous, &mut self.state);
        }
        ok_reply(json!({ "count": changed.len(), "variables": changed }))
    }
}
