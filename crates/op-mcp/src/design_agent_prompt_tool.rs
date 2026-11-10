//! Read-only MCP access to the versioned OP design skill.
//!
//! Focused references remain available through `get_design_prompt`. Managed
//! hosts can add the selected style from their authoritative asset store.

use std::collections::BTreeMap;

use op_ai_skills::synapse_op_design;

use super::{McpTool, ToolErrorCode, ToolOutcome};

pub struct GetDesignAgentPrompt;

impl McpTool for GetDesignAgentPrompt {
    fn name(&self) -> &str {
        "get_design_agent_prompt"
    }

    fn call(&self, args: &BTreeMap<String, String>) -> ToolOutcome {
        if args.contains_key("styleId")
            || args.contains_key("expectedRevision")
            || args.contains_key("useDocumentStyle")
        {
            return ToolOutcome::Err(
                ToolErrorCode::InvalidArgument,
                "Style assembly requires a managed Node host".into(),
            );
        }
        match args.get("userMessage").map(String::as_str).map(str::trim) {
            Some(message) if !message.is_empty() => (),
            _ => {
                return ToolOutcome::Err(
                    ToolErrorCode::MissingArgument,
                    "userMessage is required".into(),
                )
            }
        }
        let (screenshots, verify_name) = match args
            .get("verifyProtocol")
            .map(String::as_str)
            .map(str::trim)
            .filter(|value| !value.is_empty())
            .unwrap_or("screenshot")
        {
            "screenshot" => (true, "screenshot"),
            "layout" => (false, "layout"),
            other => {
                return ToolOutcome::Err(
                    ToolErrorCode::InvalidArgument,
                    format!("verifyProtocol must be \"screenshot\" or \"layout\", got {other:?}"),
                )
            }
        };
        let mode = args.get("mode").map(String::as_str).unwrap_or("full");
        let Some(prompt) = synapse_op_design::prompt(mode, screenshots) else {
            return ToolOutcome::Err(
                ToolErrorCode::InvalidArgument,
                "mode must be bootstrap, local or full".into(),
            );
        };
        let result = serde_json::json!({
            "version": synapse_op_design::VERSION,
            "prompt": prompt,
            "verifyProtocol": verify_name,
            "resources": ["op-design-direction", "op-design-composition", "op-design-review"],
        });
        ToolOutcome::OkJson(result.to_string())
    }
}

pub fn get_design_agent_prompt_snapshot() -> GetDesignAgentPrompt {
    GetDesignAgentPrompt
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn task_message_uses_op_skill_and_defaults_to_screenshot() {
        let args = BTreeMap::from([(
            "userMessage".to_string(),
            "Design an analytics dashboard with a client table".to_string(),
        )]);
        let ToolOutcome::OkJson(json) = get_design_agent_prompt_snapshot().call(&args) else {
            panic!("expected nested JSON prompt result");
        };
        let value: serde_json::Value = serde_json::from_str(&json).expect("prompt JSON");
        assert_eq!(value["verifyProtocol"], "screenshot");
        assert_eq!(value["version"], synapse_op_design::VERSION);
        assert!(value["prompt"]
            .as_str()
            .unwrap()
            .contains("three-layer context funnel"));
        assert!(value["prompt"]
            .as_str()
            .unwrap()
            .contains("preselected recommendation is not consent"));
    }

    #[test]
    fn layout_protocol_removes_screenshot_requirement() {
        let args = BTreeMap::from([
            (
                "userMessage".to_string(),
                "Design a mobile form".to_string(),
            ),
            ("verifyProtocol".to_string(), "layout".to_string()),
        ]);
        let ToolOutcome::OkJson(json) = get_design_agent_prompt_snapshot().call(&args) else {
            panic!("expected nested JSON prompt result");
        };
        let value: serde_json::Value = serde_json::from_str(&json).expect("prompt JSON");
        assert_eq!(value["verifyProtocol"], "layout");
        let prompt = value["prompt"].as_str().expect("prompt string");
        assert!(prompt.contains("This host cannot render screenshots"));
        assert!(prompt.contains("report visual verification as unavailable"));
    }

    #[test]
    fn rejects_missing_message_and_unknown_protocol() {
        assert!(matches!(
            get_design_agent_prompt_snapshot().call(&BTreeMap::new()),
            ToolOutcome::Err(ToolErrorCode::MissingArgument, _)
        ));
        let args = BTreeMap::from([
            ("userMessage".to_string(), "Design a page".to_string()),
            ("verifyProtocol".to_string(), "video".to_string()),
        ]);
        assert!(matches!(
            get_design_agent_prompt_snapshot().call(&args),
            ToolOutcome::Err(ToolErrorCode::InvalidArgument, _)
        ));
        let args = BTreeMap::from([
            ("userMessage".to_string(), "Design a page".to_string()),
            ("mode".to_string(), "unexpected".to_string()),
        ]);
        assert!(matches!(
            get_design_agent_prompt_snapshot().call(&args),
            ToolOutcome::Err(ToolErrorCode::InvalidArgument, _)
        ));
    }
}
