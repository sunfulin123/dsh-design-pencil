use op_editor_core::scene_template_append::template_boards;
use op_editor_core::theme_presets::{parse_preset_file, THEME_PRESET_FILE_VERSION};
use op_editor_core::PenNodeExt;
use serde_json::{json, Value};
use wasm_bindgen::prelude::*;

use crate::{error_reply, js_error, ok_reply, DesignEngine, EditorCommand};

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
        "scene-template" => {
            if !value["document"]["children"].is_array() {
                return Err("template document must contain a children array".into());
            }
            let boards = template_boards(&value["document"].to_string(), "validation")
                .ok_or("invalid template document")?;
            if boards.nodes.is_empty() {
                return Err("template selected page contains no nodes".into());
            }
            value["frames"] = json!(boards.nodes.len());
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
            "scene-template" => op_editor_core::scene_template_catalog::scene_template_catalogue()
                .iter().map(|item| json!({
                    "id":item.id,"name":item.title_fallback,"summary":item.summary_fallback,
                    "category":format!("{:?}",item.scene),"tags":item.tags,"frames":item.frames,
                    "frameWidth":item.frame_width,"frameHeight":item.frame_height,
                    "styleGuide":item.style_guide,"isUser":false,
                    "documentRoute":op_editor_core::scene_template_catalog::scene_template_document_route(&item.id)
                })).collect(),
            "style-guide" => op_ai_skills::style_guide::style_guide_registry().iter()
                .map(|guide| json!({"id":guide.name,"name":guide.name,"tags":guide.tags,
                    "platform":guide.platform.as_str(),"isUser":false,"content":guide.content})).collect(),
            "theme-preset" => op_ai_skills::design_systems::design_system_presets().iter()
                .map(|preset| {
                    let variables: Value = serde_json::from_str(&preset.variables_json)
                        .map_err(js_error)?;
                    let themes: Value = serde_json::from_str(
                        op_ai_skills::design_systems::design_system_themes_json()).map_err(js_error)?;
                    Ok(json!({"id":preset.name,"name":preset.name,"isUser":false,"preset":{
                        "type":"openpencil-theme-preset","version":THEME_PRESET_FILE_VERSION,
                        "name":preset.name,"themes":themes,"variables":variables}}))
                }).collect::<Result<Vec<_>, JsValue>>()?,
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
        let args: Value = serde_json::from_str(args_json).map_err(js_error)?;
        match kind {
            "theme-preset" => {
                let (_, themes, variables) = parse_preset_file(&payload["preset"].to_string())
                    .ok_or_else(|| js_error("invalid theme preset"))?;
                Ok(self.commit_command(
                    json!({"applied":payload["name"]}),
                    EditorCommand::MergeThemePreset { themes, variables },
                ))
            }
            "scene-template" => Ok(self.apply_template(&payload, &args)),
            _ => Ok(error_reply("asset kind is not directly applicable")),
        }
    }
}

impl DesignEngine {
    fn apply_template(&mut self, payload: &Value, args: &Value) -> String {
        let mut next = self.state.clone();
        if args.get("pageId").is_some() && args.get("newPageName").is_some() {
            return error_reply("pageId and newPageName are mutually exclusive");
        }
        if let Some(page_id) = args.get("pageId") {
            let Some(index) = next.doc.pages.as_ref().and_then(|pages| {
                pages
                    .iter()
                    .position(|page| Some(page.id.as_str()) == page_id.as_str())
            }) else {
                return error_reply("unknown pageId");
            };
            if !next.apply(EditorCommand::SetActivePage {
                index: index as u32,
            }) {
                return error_reply("page switch rejected");
            }
        }
        if let Some(name) = args.get("newPageName") {
            let Some(name) = name.as_str().filter(|s| !s.trim().is_empty()) else {
                return error_reply("newPageName must not be empty");
            };
            if !next.apply(EditorCommand::AddPage {
                name: Some(name.into()),
                children: Some(vec![]),
            }) {
                return error_reply("page creation rejected");
            }
        }
        let existing: std::collections::BTreeSet<_> = next
            .active_children()
            .iter()
            .map(|node| node.base().id.clone())
            .collect();
        let id: String = args["id"]
            .as_str()
            .unwrap_or("template")
            .chars()
            .map(|c| {
                if c.is_ascii_alphanumeric() || matches!(c, '_' | '-') {
                    c
                } else {
                    '_'
                }
            })
            .collect();
        let prefix = format!("asset_{id}");
        let mut namespace = prefix.clone();
        let mut suffix = 0;
        while next.doc.variables.as_ref().is_some_and(|vars| {
            vars.keys()
                .any(|key| key.starts_with(&format!("{namespace}--")))
        }) || next.doc.themes.as_ref().is_some_and(|axes| {
            axes.keys()
                .any(|key| key.starts_with(&format!("{namespace}--")))
        }) {
            suffix += 1;
            namespace = format!("{prefix}_{suffix}");
        }
        let Some(boards) = template_boards(&payload["document"].to_string(), &namespace) else {
            return error_reply("invalid template document");
        };
        if !next.append_template_boards(boards) {
            return error_reply("template insertion rejected");
        }
        let ids: Vec<_> = next
            .active_children()
            .iter()
            .map(|n| n.base().id.clone())
            .filter(|id| !existing.contains(id))
            .collect();
        next.history = self.state.history.clone();
        next.history_push_past(self.state.snapshot_for_history());
        let previous = std::mem::replace(&mut self.state, next);
        self.changes.record_commit(previous, &mut self.state);
        ok_reply(
            json!({"nodeIds":ids,"applied":payload["name"],"activePageIndex":self.state.ui.active_page_index}),
        )
    }
}
