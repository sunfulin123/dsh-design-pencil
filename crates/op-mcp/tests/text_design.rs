// The caller owns crate-spine integration. Exercise the new modules against
// real editor/MCP types without editing that shared spine in this worker.
extern crate op_editor_core as real_core;
extern crate self as op_editor_core;

pub use op_mcp::{EditorCommand, McpTool, ToolErrorCode, ToolOutcome};
pub use real_core::{
    command_node, command_node_attrs, id_allocator, text_design, text_design_command, walkers,
    EditorState, NodeId, PenNodeExt,
};

#[path = "../src/text_design_tools.rs"]
pub mod text_design_tools;
