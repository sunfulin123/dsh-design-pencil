use crate::user_scene_templates::UserSceneTemplate;
use serde_json::{json, Value};
use std::collections::{BTreeSet, VecDeque};
use std::sync::Arc;

#[derive(Debug, Clone, Default, PartialEq)]
pub struct ManagedAssets {
    pub revision: u64,
    pub entries: Vec<Value>,
    pub templates: Vec<Arc<UserSceneTemplate>>,
    pub pending: VecDeque<(String, Value)>,
    pub busy: bool,
    pub catalog_pending: bool,
    pub error: Option<String>,
}

impl ManagedAssets {
    pub fn install(&mut self, revision: u64, entries: Vec<Value>) -> Result<(), String> {
        let mut ids = BTreeSet::new();
        let mut templates = Vec::new();
        for item in &entries {
            let id = item["id"]
                .as_str()
                .filter(|s| !s.is_empty())
                .ok_or("asset id missing")?;
            let name = item["name"]
                .as_str()
                .filter(|s| !s.trim().is_empty())
                .ok_or("asset name missing")?;
            let kind = item["kind"].as_str().ok_or("asset kind missing")?;
            if !["style-guide", "scene-template", "theme-preset"].contains(&kind)
                || !ids.insert((kind, id))
            {
                return Err("invalid or duplicate asset kind/id".into());
            }
            if id.starts_with("user:") && kind == "scene-template" {
                templates.push(Arc::new(UserSceneTemplate {
                    id: id.into(),
                    name: name.into(),
                    frames: item["frames"]
                        .as_u64()
                        .and_then(|v| v.try_into().ok())
                        .unwrap_or(1),
                    frame_width: item["frameWidth"]
                        .as_u64()
                        .and_then(|v| v.try_into().ok())
                        .unwrap_or(300),
                    frame_height: item["frameHeight"]
                        .as_u64()
                        .and_then(|v| v.try_into().ok())
                        .unwrap_or(200),
                    document: String::new(),
                    preview_jpeg: Vec::new(),
                }));
            }
        }
        self.revision = revision;
        self.entries = entries;
        self.templates = templates;
        Ok(())
    }

    pub fn queue(&mut self, name: &str, args: Value) -> bool {
        if self.busy || !self.pending.is_empty() {
            self.error = Some("An asset operation is already in progress".into());
            return false;
        }
        self.error = None;
        self.pending.push_back((name.into(), args));
        true
    }

    pub fn delete(&mut self, kind: &str, id: &str) -> bool {
        self.queue(
            &format!("delete_{kind}"),
            json!({"id":id,"expectedRevision":self.revision}),
        )
    }
}
