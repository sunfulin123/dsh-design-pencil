use std::collections::BTreeMap;

use op_mcp::{McpTool, ToolErrorCode, ToolOutcome};
use serde_json::{json, Value};

pub struct ToolSearch {
    schemas: Vec<Value>,
}

impl ToolSearch {
    pub fn new(schemas: Vec<Value>) -> Self {
        Self { schemas }
    }
}

impl McpTool for ToolSearch {
    fn name(&self) -> &str {
        "tool_search"
    }

    fn call(&self, args: &BTreeMap<String, String>) -> ToolOutcome {
        let Some(query) = args
            .get("query")
            .map(|query| query.trim().to_lowercase())
            .filter(|query| !query.is_empty())
        else {
            return ToolOutcome::Err(
                ToolErrorCode::MissingArgument,
                "query must contain a search term".into(),
            );
        };
        let limit = match args.get("limit") {
            None => 10,
            Some(raw) => match raw.parse::<usize>() {
                Ok(limit @ 1..=50) => limit,
                _ => {
                    return ToolOutcome::Err(
                        ToolErrorCode::InvalidArgument,
                        "limit must be an integer from 1 to 50".into(),
                    )
                }
            },
        };
        let terms = query.split_whitespace().collect::<Vec<_>>();
        let mut matched = Vec::new();
        for schema in &self.schemas {
            let Some(name) = schema["name"].as_str() else {
                continue;
            };
            let description = schema["description"]
                .as_str()
                .unwrap_or_default()
                .to_lowercase();
            let score = usize::from(name == query) * 100
                + terms
                    .iter()
                    .map(|term| {
                        usize::from(name.contains(*term)) * 3
                            + usize::from(description.contains(*term))
                    })
                    .sum::<usize>();
            if score > 0 {
                matched.push((score, name, schema));
            }
        }
        matched.sort_by(|a, b| b.0.cmp(&a.0).then_with(|| a.1.cmp(b.1)));
        let total = matched.len();
        let tools = matched
            .into_iter()
            .take(limit)
            .map(|(_, _, schema)| schema)
            .collect::<Vec<_>>();
        ToolOutcome::OkJson(json!({"query":query,"total":total,"tools":tools}).to_string())
    }
}
