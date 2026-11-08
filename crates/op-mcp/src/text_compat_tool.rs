use std::collections::BTreeMap;

use op_editor_core::EditorState;

use crate::{McpTool, ToolErrorCode, ToolOutcome};

pub struct SetNodeTextWithMarkdown {
    markdown: Box<dyn McpTool>,
}

pub fn set_node_text_compat_snapshot(state: &EditorState) -> SetNodeTextWithMarkdown {
    SetNodeTextWithMarkdown {
        markdown: Box::new(crate::text_design_tools::set_text_markdown_snapshot(state)),
    }
}

impl McpTool for SetNodeTextWithMarkdown {
    fn name(&self) -> &str {
        "set_node_text"
    }

    fn call(&self, args: &BTreeMap<String, String>) -> ToolOutcome {
        match args.get("markdown").map(String::as_str) {
            None | Some("false") => crate::set_node_text_snapshot().call(args),
            Some("true") => {
                let Some(text) = args.get("text") else {
                    return ToolOutcome::Err(
                        ToolErrorCode::MissingArgument,
                        "text is required".into(),
                    );
                };
                let mut mapped = args.clone();
                mapped.insert("markdown".into(), text.clone());
                self.markdown.call(&mapped)
            }
            _ => ToolOutcome::Err(
                ToolErrorCode::InvalidArgument,
                "markdown must be a boolean".into(),
            ),
        }
    }
}
