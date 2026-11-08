//! Figma REST import tools. The network work (chunked fetching, image
//! downloads, Figma renders) runs in the Node host, which intercepts these
//! names; the document engine only exposes their contracts and explains
//! that a host is required instead of failing with a generic error.

use std::collections::BTreeMap;

use serde_json::{json, Value};

use crate::{McpTool, ToolErrorCode, ToolOutcome};

/// Tools the Node host implements; the standalone engine rejects them.
pub const HOST_ONLY_TOOLS: &[&str] = &[
    "inspect_figma_node",
    "get_figma_import_status",
    "list_figma_import_jobs",
    "cancel_figma_import",
    "resume_figma_import",
    "compare_figma_fidelity",
];

fn job_id() -> Value {
    json!({"type": "string", "minLength": 1, "description": "Job id returned by import_figma."})
}

fn token() -> Value {
    json!({"type": "string", "description": "Figma Personal Access Token; defaults to FIGMA_TOKEN / FIGMA_ACCESS_TOKEN. Never stored."})
}

pub fn schemas() -> Vec<Value> {
    vec![
        json!({
            "name": "import_figma",
            "description": "Import Figma designs. figma.com links (url, with or without node-id) run as a chunked, resumable job: the parent frame is inserted first, then each child board is fetched and inserted separately (oversized boards are split automatically), so parent links with many boards no longer time out. mode:\"auto\" (default) waits up to waitMs and returns the finished result or {jobId,status:\"running\",progress}; poll get_figma_import_status until status is succeeded/partial/failed, then resume_figma_import for failed boards. Content is inserted (never replaces the document) beside existing content or at x/y/parent/pageId; coordinates are normalized so it is visible. layout:\"preserve\" (default) keeps Figma geometry exactly; \"semantic\" maps Hug/Fill/auto layout to responsive sizing. Text truncation, max lines, fonts, images, vectors, rotation and flips are imported. Errors carry codes: FIGMA_AUTH, FIGMA_NOT_FOUND, FIGMA_RATE_LIMITED, FIGMA_TIMEOUT, FIGMA_NODE_TOO_LARGE, FIGMA_IMPORT_LIMIT, FIGMA_FILE_CHANGED. Local .fig files: figPath or bytesBase64; importing a .fig into an empty document keeps component/instance linkage (used components on a \"Components\" page, page-level instances as refs that are verified to render identically, otherwise kept expanded), while REST links and inserts into existing documents import expanded copies.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "url": {"type": "string", "description": "figma.com design/file link (node-id optional) or a direct .fig URL."},
                    "nodeIds": {"type": "string", "description": "Comma-separated node ids (1:2 or 1-2) to import instead of the link's node."},
                    "mode": {"type": "string", "enum": ["auto", "sync", "async"], "default": "auto"},
                    "waitMs": {"type": "integer", "minimum": 0, "maximum": 55000, "default": 25000},
                    "layout": {"type": "string", "enum": ["preserve", "semantic"], "default": "preserve"},
                    "fetchFonts": {"type": "boolean", "default": true},
                    "figmaToken": token(),
                    "figPath": {"type": "string"},
                    "bytesBase64": {"type": "string"},
                    "fileName": {"type": "string"},
                    "x": {"type": "string"},
                    "y": {"type": "string"},
                    "parent": {"type": "string"},
                    "pageId": {"type": "string"}
                },
                "required": [],
                "additionalProperties": false
            }
        }),
        json!({
            "name": "inspect_figma_node",
            "description": "Read-only outline of a Figma link/node (names, types, sizes, child counts) to plan an import: see how many boards a parent holds or pick a nodeIds subset. depth 1-3.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "url": {"type": "string", "minLength": 1},
                    "nodeId": {"type": "string"},
                    "depth": {"type": "integer", "minimum": 1, "maximum": 3, "default": 1},
                    "figmaToken": token()
                },
                "required": ["url"],
                "additionalProperties": false
            }
        }),
        json!({
            "name": "get_figma_import_status",
            "description": "Status and progress of a Figma import job: {status: queued|running|succeeded|partial|failed|cancelled|interrupted, progress:{total,done,failed,current}, failed:[{nodeId,name,code,message,retryable}], rootIds, bounds, fonts, warnings}. waitMs (≤55000) waits for progress before answering.",
            "inputSchema": {
                "type": "object",
                "properties": {"jobId": job_id(), "waitMs": {"type": "integer", "minimum": 0, "maximum": 55000}},
                "required": ["jobId"],
                "additionalProperties": false
            }
        }),
        json!({
            "name": "list_figma_import_jobs",
            "description": "Recent Figma import jobs (newest first), including ones from earlier host sessions that can be resumed.",
            "inputSchema": {"type": "object", "properties": {}, "required": [], "additionalProperties": false}
        }),
        json!({
            "name": "cancel_figma_import",
            "description": "Cancel a running Figma import job. Boards already inserted stay (undo removes them); resume_figma_import continues later.",
            "inputSchema": {
                "type": "object",
                "properties": {"jobId": job_id()},
                "required": ["jobId"],
                "additionalProperties": false
            }
        }),
        json!({
            "name": "resume_figma_import",
            "description": "Resume a partial, failed, cancelled or interrupted Figma import: completed boards are skipped (cached), failed ones are retried into the same parent. force:true continues even if the Figma file changed since the job started.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "jobId": job_id(),
                    "figmaToken": token(),
                    "mode": {"type": "string", "enum": ["auto", "sync", "async"], "default": "auto"},
                    "force": {"type": "boolean", "default": false}
                },
                "required": ["jobId"],
                "additionalProperties": false
            }
        }),
        json!({
            "name": "compare_figma_fidelity",
            "description": "Verify an imported design against Figma: renders the Figma node (official /v1/images) and the imported node (get_screenshot) at the same scale, reports the differing-pixel ratio, hot regions mapped to node names, structural deltas (box position/size per layer, matched by the preserved figmaNodeId), and text parity (visible Figma texts missing from or extra in the import). verified requires pixels within 1%, no structural deltas and exact text parity. Fix the reported nodes, then compare again. Needs the Node host; the pixel diff also needs the open editor (otherwise only structure is compared).",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "url": {"type": "string", "minLength": 1, "description": "figma.com link whose node-id is the source node."},
                    "nodeId": {"type": "string", "description": "Imported root node id in this document (rootIds from the import)."},
                    "scale": {"type": "number", "minimum": 0.5, "maximum": 2, "default": 1},
                    "tolerance": {"type": "integer", "minimum": 0, "maximum": 64, "default": 8},
                    "figmaToken": token()
                },
                "required": ["url", "nodeId"],
                "additionalProperties": false
            }
        }),
    ]
}

/// Engine stand-in for a host-only Figma tool.
pub struct HostOnlyFigmaTool(pub &'static str);

impl McpTool for HostOnlyFigmaTool {
    fn name(&self) -> &str {
        self.0
    }

    fn call(&self, _args: &BTreeMap<String, String>) -> ToolOutcome {
        ToolOutcome::Err(
            ToolErrorCode::ToolFailed,
            format!(
                "{} needs the Node host (network access to the Figma API); it cannot run in the standalone document engine",
                self.0
            ),
        )
    }
}

/// Engine stand-in lookup for [`HOST_ONLY_TOOLS`].
pub fn host_only_tool(name: &str) -> Option<HostOnlyFigmaTool> {
    HOST_ONLY_TOOLS
        .iter()
        .find(|tool| **tool == name)
        .map(|tool| HostOnlyFigmaTool(tool))
}
