use op_editor_core::theme_presets::{parse_preset_file, THEME_PRESET_FILE_VERSION};
use serde_json::{json, Value};
use std::collections::HashMap;
use std::sync::OnceLock;
use wasm_bindgen::prelude::*;

use crate::{error_reply, js_error, DesignEngine, EditorCommand};

fn builtin_style_category(id: &str) -> Option<&'static str> {
    if id == "talkdesk-cobalt" {
        return Some("enterprise");
    }
    static CATEGORIES: OnceLock<HashMap<String, String>> = OnceLock::new();
    CATEGORIES
        .get_or_init(|| {
            let Some(dir) = op_ai_skills::style_guides_dir() else {
                return HashMap::new();
            };
            let Some(text) = dir
                .get_file(dir.path().join("manifest.json"))
                .and_then(|file| file.contents_utf8())
            else {
                return HashMap::new();
            };
            let Ok(Value::Array(entries)) = serde_json::from_str::<Value>(text) else {
                return HashMap::new();
            };
            entries
                .into_iter()
                .filter_map(|entry| {
                    Some((
                        entry["id"].as_str()?.to_owned(),
                        entry["category"].as_str()?.to_owned(),
                    ))
                })
                .collect()
        })
        .get(id)
        .map(String::as_str)
}

pub fn validate(kind: &str, payload: &str) -> Result<Value, String> {
    let mut value: Value = serde_json::from_str(payload).map_err(|e| e.to_string())?;
    let name = value["name"]
        .as_str()
        .filter(|name| !name.trim().is_empty())
        .ok_or("asset name is required")?
        .trim()
        .to_string();
    match kind {
        "style-guide" => {
            let raw = value["markdown"].as_str().ok_or("markdown is required")?;
            let guide = op_ai_skills::style_guide::parse_design_md(raw, &name)
                .map_err(|e| e.to_string())?;
            value["tags"] = json!(guide.tags);
            value["platform"] = json!(guide.platform.as_str());
            value["swatches"] = json!(guide.swatches);
            value["importedName"] = json!(guide.name);
        }
        "theme-preset" => {
            if value["preset"]["version"] != THEME_PRESET_FILE_VERSION {
                return Err("unsupported theme preset version".into());
            }
            parse_preset_file(&value["preset"].to_string()).ok_or("invalid theme preset")?;
        }
        _ => return Err(format!("unknown asset kind: {kind}")),
    }
    value["name"] = json!(name);
    Ok(value)
}

#[wasm_bindgen]
impl DesignEngine {
    pub fn builtin_assets_json(&self, kind: &str) -> Result<String, JsValue> {
        let entries: Vec<Value> = match kind {
            "style-guide" => op_ai_skills::style_guide::style_guide_registry()
                .iter()
                .map(|guide| {
                    let preview = op_ai_skills::style_guide::style_guide_card(&guide.name);
                    let swatches = preview
                        .as_ref()
                        .map(|card| card.swatches.as_slice())
                        .unwrap_or_default();
                    let summary = preview
                        .as_ref()
                        .and_then(|card| card.description.as_deref());
                    json!({"id":guide.name,"name":guide.display_name(),"tags":guide.tags,
                    "platform":guide.platform.as_str(),"isUser":false,"content":guide.content,
                    "swatches":swatches,"summary":summary,"category":builtin_style_category(&guide.name)})
                })
                .collect(),
            "theme-preset" => op_ai_skills::design_systems::design_system_presets()
                .iter()
                .map(|preset| {
                    let variables: Value =
                        serde_json::from_str(&preset.variables_json).map_err(js_error)?;
                    let themes: Value = serde_json::from_str(
                        op_ai_skills::design_systems::design_system_themes_json(),
                    )
                    .map_err(js_error)?;
                    Ok(
                        json!({"id":preset.name,"name":preset.name,"isUser":false,"preset":{
                        "type":"openpencil-theme-preset","version":THEME_PRESET_FILE_VERSION,
                        "name":preset.name,"themes":themes,"variables":variables}}),
                    )
                })
                .collect::<Result<Vec<_>, JsValue>>()?,
            _ => return Err(js_error(format!("unknown asset kind: {kind}"))),
        };
        Ok(json!(entries).to_string())
    }

    pub fn validate_asset_json(&self, kind: &str, payload_json: &str) -> Result<String, JsValue> {
        validate(kind, payload_json)
            .map(|v| v.to_string())
            .map_err(js_error)
    }

    pub fn apply_asset_json(
        &mut self,
        kind: &str,
        payload_json: &str,
        args_json: &str,
    ) -> Result<String, JsValue> {
        let payload = match validate(kind, payload_json) {
            Ok(payload) => payload,
            Err(error) => return Ok(error_reply(&error)),
        };
        let _: Value = serde_json::from_str(args_json).map_err(js_error)?;
        match kind {
            "theme-preset" => {
                let (_, themes, variables) = parse_preset_file(&payload["preset"].to_string())
                    .ok_or_else(|| js_error("invalid theme preset"))?;
                Ok(self.commit_command(
                    json!({"applied":payload["name"]}),
                    EditorCommand::MergeThemePreset { themes, variables },
                ))
            }
            _ => Ok(error_reply("asset kind is not directly applicable")),
        }
    }
}
