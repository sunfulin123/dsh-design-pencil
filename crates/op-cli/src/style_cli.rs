//! Style guide CLI commands.

use serde_json::Value;

use crate::cli_error::CliError;
use crate::command_helpers::flag_value;
use crate::mcp_http_cli::{post, tool_call_body};
use crate::{Command, Flags};









pub(crate) fn map_styles(flags: &Flags, positionals: &[String]) -> Result<Command, CliError> {
    Ok(Command::Styles {
        // `positionals[0]` is the command word; a bare id after it selects one
        // guide and pulls its markdown down with it.
        id: positionals
            .get(1)
            .cloned()
            .or_else(|| flag_value(flags, "id")),
        tag: flag_value(flags, "tag"),
        platform: flag_value(flags, "platform"),
    })
}

pub(crate) fn run_styles(
    port: u16,
    token: &str,
    id: Option<&str>,
    tag: Option<&str>,
    platform: Option<&str>,
) -> Result<String, CliError> {
    let mut arguments = serde_json::Map::new();
    for (key, value) in [("id", id), ("tag", tag), ("platform", platform)] {
        if let Some(value) = value {
            arguments.insert(key.into(), Value::String(value.into()));
        }
    }
    post(
        port,
        token,
        &tool_call_body("list_style_guides", &Value::Object(arguments).to_string()),
    )
}
