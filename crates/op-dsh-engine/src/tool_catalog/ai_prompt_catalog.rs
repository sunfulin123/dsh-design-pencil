use op_mcp::McpTool;
use serde_json::{json, Value};

pub(super) fn build_tool(name: &str) -> Option<Box<dyn McpTool>> {
    (name == "get_design_agent_prompt")
        .then(|| Box::new(op_mcp::get_design_agent_prompt_snapshot()) as Box<dyn McpTool>)
}

pub(super) fn schemas() -> Vec<Value> {
    vec![json!({
        "name": "get_design_agent_prompt",
        "description": "Read versioned OP design guidance and optionally assemble a selected style in the managed host.",
        "inputSchema": {
            "type": "object",
            "additionalProperties": false,
            "required": ["userMessage"],
            "properties": {
                "userMessage": {"type": "string", "minLength": 1},
                "verifyProtocol": {"type": "string", "enum": ["screenshot", "layout"]},
                "mode": {"type": "string", "enum": ["bootstrap", "local", "full"]},
                "styleId": {"type": "string", "minLength": 1},
                "expectedRevision": {"type": "integer", "minimum": 0},
                "useDocumentStyle": {"type": "boolean"}
            }
        }
    })]
}
