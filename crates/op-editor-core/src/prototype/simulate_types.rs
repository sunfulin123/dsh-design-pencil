//! Serializable prototype simulation inputs and results.

use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::BTreeMap;

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum SimulateStep {
    Click {
        #[serde(default, alias = "nodeId")]
        node_id: Option<String>,
        #[serde(default)]
        x: Option<f32>,
        #[serde(default)]
        y: Option<f32>,
    },
    Hover {
        #[serde(alias = "nodeId")]
        node_id: String,
    },
    KeyDown {
        #[serde(alias = "keyCode")]
        key_code: u32,
    },
    Wait {
        ms: u64,
    },
    Back,
    Restart,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SimulateReport {
    pub start_screen_id: String,
    pub current_screen_id: String,
    pub visited_screens: Vec<String>,
    pub overlays: Vec<String>,
    pub variant_overrides: BTreeMap<String, String>,
    pub variable_overrides: BTreeMap<String, Value>,
    pub opened_urls: Vec<String>,
}
