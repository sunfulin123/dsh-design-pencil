//! Input contract and validation for prototype simulation.

use op_editor_core::prototype::SimulateStep;
use serde_json::{json, Value};

pub(super) fn schema() -> Value {
    json!({
        "name": "simulate_prototype",
        "description": "Simulate prototype interactions and inspect visitedScreens/currentScreenId. For example, steps:[{type:'click',nodeId:'button-id'}]; a successful call alone does not imply navigation occurred.",
        "inputSchema": {
            "type": "object", "additionalProperties": false, "required": [],
            "properties": {
                "startNodeId": {"type": "string"},
                "flowIndex": {"type": "integer", "minimum": 0},
                "steps": {"type": "array", "items": {
                    "type": "object", "required": ["type"], "additionalProperties": false,
                    "properties": {
                        "type": {"type": "string", "enum": ["click", "hover", "key_down", "wait", "back", "restart"]},
                        "nodeId": {"type": "string"}, "node_id": {"type": "string"},
                        "x": {"type": "number"}, "y": {"type": "number"},
                        "keyCode": {"type": "integer"}, "key_code": {"type": "integer"},
                        "ms": {"type": "integer", "minimum": 0}
                    }
                }}
            }
        }
    })
}

pub(super) fn parse_steps(raw: Option<&String>) -> Result<Vec<SimulateStep>, String> {
    let Some(raw) = raw.filter(|value| !value.trim().is_empty()) else {
        return Ok(Vec::new());
    };
    let steps: Vec<SimulateStep> = serde_json::from_str(raw).map_err(|error| {
        format!("invalid steps: {error}; use e.g. {{type:'click',nodeId:'button-id'}}")
    })?;
    for (index, step) in steps.iter().enumerate() {
        let invalid = match step {
            SimulateStep::Click { node_id, x, y } => match node_id {
                Some(id) => id.trim().is_empty(),
                None => x.is_none() || y.is_none(),
            },
            SimulateStep::Hover { node_id } => node_id.trim().is_empty(),
            _ => false,
        };
        if invalid {
            return Err(format!(
                "step {index} needs a nonempty nodeId (or both x and y for a click)"
            ));
        }
    }
    Ok(steps)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn step_aliases_and_coordinate_clicks_work_but_incomplete_targets_fail() {
        let input = r#"[{"type":"click","x":0,"y":3},{"type":"hover","nodeId":"link"},{"type":"key_down","keyCode":13}]"#.to_string();
        let parsed = parse_steps(Some(&input)).unwrap();
        assert!(matches!(
            parsed[0],
            SimulateStep::Click { x: Some(0.0), .. }
        ));
        assert!(matches!(&parsed[1], SimulateStep::Hover { node_id } if node_id == "link"));
        assert!(matches!(parsed[2], SimulateStep::KeyDown { key_code: 13 }));
        for raw in [
            r#"[{"type":"click","x":0}]"#,
            r#"[{"type":"click","nodeId":""}]"#,
        ] {
            assert!(parse_steps(Some(&raw.to_string())).is_err(), "{raw}");
        }
    }
}
