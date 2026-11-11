//! Discoverable contract for the native design-quality tool.

use serde_json::{json, Value};

pub(super) fn schema() -> Value {
    json!({
        "name": "get_design_quality",
        "description": "Run non-destructive quality diagnostics over the active page or rootId subtree. Each list holds at most limit entries; counts are full totals. Review navIssues for measured interactive targets and page through them using touchTargetsNextOffset as touchTargetOffset; validate each suggestedPatch in context and retest. componentReuseCandidates are advisory repeated structures, not automatic replacements. coverage identifies limitations. Diagnostics do not certify accessibility or replace screenshot review.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "rootId": {"type": "string"},
                "limit": {"type": "integer", "minimum": 1, "maximum": 500},
                "touchTargetOffset": {"type": "integer", "minimum": 0, "description": "Offset into the size-ranked navIssues list; use touchTargetsNextOffset from the previous result. Restart at zero after any document mutation."}
            },
            "required": [],
            "additionalProperties": false
        }
    })
}
