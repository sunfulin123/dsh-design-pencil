//! Figma-compatible prototype MCP tools (`get_prototype`, `set_prototype`,
//! `set_reactions`, `set_scroll_behavior`, `simulate_prototype`).

use jian_ops_schema::node::PenNode;
use jian_ops_schema::prototype::{
    ActionType, FlowStartingPoint, OverflowDirection, OverlaySettings, PagePrototype,
    PrototypeAction, PrototypeDeviceSpec, PrototypeScrollBehavior, Reaction,
};
use jian_ops_schema::PenDocument;
use op_editor_core::prototype::{PrototypeGraph, PrototypePlayer, SimulateStep};
use serde_json::{json, Value};
use std::collections::{BTreeMap, HashSet};

use crate::{error_reply, ok_reply, DesignEngine};

pub(crate) fn schemas() -> Vec<Value> {
    vec![
        json!({
            "name": "get_prototype",
            "description": "Inspect the document's Figma-compatible prototype graph (flows, screens, device, backgroundColor, and node reactions/scroll settings).",
            "inputSchema": {
                "type": "object",
                "additionalProperties": false,
                "required": [],
                "properties": {
                    "nodeId": {"type": "string"},
                    "nodeIds": {"type": "array", "items": {"type": "string"}}
                }
            }
        }),
        json!({
            "name": "set_prototype",
            "description": "Set document/page prototype flows (starting screens), device preset, or prototype background color in one undo step.",
            "inputSchema": {
                "type": "object",
                "additionalProperties": false,
                "required": [],
                "properties": {
                    "flows": {"type": "array", "items": {"type": "object"}},
                    "device": {"type": "object"},
                    "backgroundColor": {"type": "string"}
                }
            }
        }),
        json!({
            "name": "set_reactions",
            "description": "Set or clear Figma-compatible prototype reactions on one node (`nodeId` + `reactions`) or a batch (`entries: [{nodeId, reactions}]`) in one undo step. Validates that all target node IDs exist.",
            "inputSchema": {
                "type": "object",
                "additionalProperties": false,
                "required": [],
                "properties": {
                    "nodeId": {"type": "string"},
                    "reactions": {"type": "array", "items": {"type": "object"}},
                    "entries": {"type": "array", "items": {"type": "object"}}
                }
            }
        }),
        json!({
            "name": "set_scroll_behavior",
            "description": "Configure frame overflow scrolling (`NONE`, `HORIZONTAL`, `VERTICAL`, `BOTH`), child scroll behavior (`SCROLLS`, `FIXED`, `STICKY`), overlay settings, or `section` marker on one or more nodes in one undo step.",
            "inputSchema": {
                "type": "object",
                "additionalProperties": false,
                "required": ["nodeId"],
                "properties": {
                    "nodeId": {"type": "string"},
                    "overflowDirection": {"type": "string"},
                    "scrollBehavior": {"type": "string"},
                    "overlay": {"type": "object"},
                    "section": {"type": "boolean"}
                }
            }
        }),
        json!({
            "name": "simulate_prototype",
            "description": "Headlessly simulate prototype interactions (click, hover, key_down, wait, back, restart) and return visited screens, active overlays, variant overrides, and variable changes.",
            "inputSchema": {
                "type": "object",
                "additionalProperties": false,
                "required": [],
                "properties": {
                    "startNodeId": {"type": "string"},
                    "flowIndex": {"type": "integer", "minimum": 0},
                    "steps": {"type": "array", "items": {"type": "object"}}
                }
            }
        }),
    ]
}

struct ReactionEntry {
    node_id: String,
    reactions: Vec<Reaction>,
}

fn parse_reaction_entries(raw: &str) -> Result<Vec<ReactionEntry>, String> {
    let items: Vec<Value> = serde_json::from_str(raw).map_err(|e| e.to_string())?;
    let mut out = Vec::with_capacity(items.len());
    for item in items {
        let node_id = item
            .get("nodeId")
            .or_else(|| item.get("node_id"))
            .and_then(Value::as_str)
            .map(str::trim)
            .filter(|s| !s.is_empty())
            .ok_or_else(|| "each entry requires nodeId".to_string())?
            .to_string();
        let reactions = match item.get("reactions") {
            Some(v) if !v.is_null() => {
                serde_json::from_value(v.clone()).map_err(|e| e.to_string())?
            }
            _ => Vec::new(),
        };
        out.push(ReactionEntry { node_id, reactions });
    }
    Ok(out)
}

impl DesignEngine {
    pub(crate) fn call_prototype_tool(
        &mut self,
        name: &str,
        args: &BTreeMap<String, String>,
    ) -> Option<String> {
        Some(match name {
            "get_prototype" => self.get_prototype_reply(args),
            "set_prototype" => self.set_prototype_reply(args),
            "set_reactions" => self.set_reactions_reply(args),
            "set_scroll_behavior" => self.set_scroll_behavior_reply(args),
            "simulate_prototype" => self.simulate_prototype_reply(args),
            _ => return None,
        })
    }

    fn get_prototype_reply(&self, args: &BTreeMap<String, String>) -> String {
        let graph = PrototypeGraph::from_document(&self.state.doc);
        let mut requested: HashSet<String> = HashSet::new();
        if let Some(id) = args.get("nodeId").filter(|s| !s.trim().is_empty()) {
            requested.insert(id.trim().to_string());
        }
        if let Some(raw) = args.get("nodeIds") {
            if let Ok(list) = serde_json::from_str::<Vec<String>>(raw) {
                requested.extend(list);
            }
        }
        let mut nodes = Vec::new();
        collect_node_proto_summaries(&self.state.doc, &requested, &mut nodes);
        ok_reply(json!({
            "flows": graph.flows.iter().map(|f| json!({
                "pageIndex": f.page_index,
                "nodeId": f.node_id,
                "name": f.name,
                "description": f.description,
            })).collect::<Vec<_>>(),
            "screens": graph.screens.iter().map(|s| json!({
                "pageIndex": s.page_index,
                "id": s.id,
                "name": s.name,
                "sectionId": s.section_id,
                "sectionName": s.section_name,
                "bounds": {"x": s.bounds.0, "y": s.bounds.1, "width": s.bounds.2, "height": s.bounds.3},
                "overflowDirection": s.overflow_direction,
            })).collect::<Vec<_>>(),
            "device": graph.device,
            "backgroundColor": graph.background_color,
            "nodes": nodes,
        }))
    }

    fn set_prototype_reply(&mut self, args: &BTreeMap<String, String>) -> String {
        let valid_ids = collect_all_ids(&self.state.doc);
        let flows: Option<Vec<FlowStartingPoint>> = match args.get("flows") {
            Some(raw) => match serde_json::from_str(raw) {
                Ok(parsed) => Some(parsed),
                Err(e) => return error_reply(&format!("invalid flows: {e}")),
            },
            None => None,
        };
        if let Some(ref fl) = flows {
            for f in fl {
                if !valid_ids.contains(&f.node_id) {
                    return error_reply(&format!("flow target node not found: {}", f.node_id));
                }
            }
        }
        let device: Option<Option<PrototypeDeviceSpec>> = match args.get("device") {
            Some(raw) if raw.trim().is_empty() || raw.trim() == "null" => Some(None),
            Some(raw) => match serde_json::from_str(raw) {
                Ok(parsed) => Some(Some(parsed)),
                Err(e) => return error_reply(&format!("invalid device: {e}")),
            },
            None => None,
        };
        let bg = args.get("backgroundColor").map(|s| {
            let trimmed = s.trim();
            (!trimmed.is_empty()).then(|| trimmed.to_string())
        });
        if flows.is_none() && device.is_none() && bg.is_none() {
            return error_reply("at least one of flows, device, or backgroundColor is required");
        }
        self.mutate_doc_once(|doc| {
            let mut proto = doc.prototype.take().unwrap_or_else(PagePrototype::default);
            if let Some(fl) = flows {
                sync_flow_starting_points(doc, &fl);
                proto.flows = fl;
            }
            if let Some(dev) = device {
                proto.device = dev;
            }
            if let Some(bg_val) = bg {
                proto.background_color = bg_val;
            }
            doc.prototype = (!proto.is_empty()).then_some(proto);
            json!({ "updated": true })
        })
    }

    fn set_reactions_reply(&mut self, args: &BTreeMap<String, String>) -> String {
        let mut entries: Vec<ReactionEntry> = Vec::new();
        if let Some(raw_entries) = args.get("entries") {
            match parse_reaction_entries(raw_entries) {
                Ok(list) => entries.extend(list),
                Err(e) => return error_reply(&format!("invalid entries: {e}")),
            }
        }
        if let Some(node_id) = args.get("nodeId").filter(|s| !s.trim().is_empty()) {
            let reactions: Vec<Reaction> = match args.get("reactions") {
                Some(raw) if !raw.trim().is_empty() => match serde_json::from_str(raw) {
                    Ok(list) => list,
                    Err(e) => return error_reply(&format!("invalid reactions: {e}")),
                },
                _ => Vec::new(),
            };
            entries.push(ReactionEntry {
                node_id: node_id.trim().to_string(),
                reactions,
            });
        }
        if entries.is_empty() {
            return error_reply("nodeId or entries is required");
        }
        let valid_ids = collect_all_ids(&self.state.doc);
        for entry in &entries {
            if !valid_ids.contains(&entry.node_id) {
                return error_reply(&format!("node not found: {}", entry.node_id));
            }
            for r in &entry.reactions {
                if let Err(msg) = validate_actions(&r.actions, &valid_ids) {
                    return error_reply(&msg);
                }
            }
        }
        let count = entries.len();
        self.mutate_doc_once(|doc| {
            for entry in entries {
                set_node_reactions(doc, &entry.node_id, entry.reactions);
            }
            json!({ "updated": count })
        })
    }

    fn set_scroll_behavior_reply(&mut self, args: &BTreeMap<String, String>) -> String {
        let Some(node_id) = args
            .get("nodeId")
            .map(|s| s.trim())
            .filter(|s| !s.is_empty())
        else {
            return error_reply("nodeId is required");
        };
        let valid_ids = collect_all_ids(&self.state.doc);
        if !valid_ids.contains(node_id) {
            return error_reply(&format!("node not found: {node_id}"));
        }
        let overflow = match args.get("overflowDirection") {
            Some(raw) => match parse_json_or_upper(raw).and_then(|v| {
                serde_json::from_value::<OverflowDirection>(v).map_err(|e| e.to_string())
            }) {
                Ok(v) => Some(v),
                Err(e) => return error_reply(&format!("invalid overflowDirection: {e}")),
            },
            None => None,
        };
        let scroll = match args.get("scrollBehavior") {
            Some(raw) => match parse_json_or_upper(raw).and_then(|v| {
                serde_json::from_value::<PrototypeScrollBehavior>(v).map_err(|e| e.to_string())
            }) {
                Ok(v) => Some(v),
                Err(e) => return error_reply(&format!("invalid scrollBehavior: {e}")),
            },
            None => None,
        };
        let overlay = match args.get("overlay") {
            Some(raw) if raw.trim().is_empty() || raw.trim() == "null" => Some(None),
            Some(raw) => match serde_json::from_str::<OverlaySettings>(raw) {
                Ok(v) => Some(Some(v)),
                Err(e) => return error_reply(&format!("invalid overlay: {e}")),
            },
            None => None,
        };
        let section = args.get("section").and_then(|s| s.parse::<bool>().ok());
        if overflow.is_none() && scroll.is_none() && overlay.is_none() && section.is_none() {
            return error_reply(
                "at least one of overflowDirection, scrollBehavior, overlay, or section is required",
            );
        }
        let target_id = node_id.to_string();
        self.mutate_doc_once(|doc| {
            update_node_base(doc, &target_id, |base| {
                if let Some(ov) = overflow {
                    base.overflow_direction = (ov != OverflowDirection::None).then_some(ov);
                }
                if let Some(sb) = scroll {
                    base.scroll_behavior = (sb != PrototypeScrollBehavior::Scrolls).then_some(sb);
                }
                if let Some(ov_settings) = &overlay {
                    base.overlay = ov_settings.clone();
                }
                if let Some(sec) = section {
                    base.section = sec.then_some(true);
                }
            });
            json!({ "nodeId": target_id, "updated": true })
        })
    }

    fn simulate_prototype_reply(&self, args: &BTreeMap<String, String>) -> String {
        let start_node = args
            .get("startNodeId")
            .map(String::as_str)
            .filter(|s| !s.trim().is_empty());
        let steps: Vec<SimulateStep> = match args.get("steps") {
            Some(raw) if !raw.trim().is_empty() => match serde_json::from_str(raw) {
                Ok(s) => s,
                Err(e) => return error_reply(&format!("invalid steps: {e}")),
            },
            _ => Vec::new(),
        };
        let Some(mut player) = PrototypePlayer::enter(
            &self.state.doc,
            self.state.ui.active_page_index,
            start_node,
            (0.0, 0.0),
            0,
        ) else {
            return error_reply("no prototype screens found in document");
        };
        if let Some(flow_idx) = args.get("flowIndex").and_then(|s| s.parse::<usize>().ok()) {
            if !player.select_flow(flow_idx, 0) {
                return error_reply(&format!("flowIndex {flow_idx} out of range"));
            }
        }
        let report = player.simulate(&steps);
        ok_reply(serde_json::to_value(report).unwrap_or_else(|_| json!({})))
    }

    fn mutate_doc_once(&mut self, f: impl FnOnce(&mut PenDocument) -> Value) -> String {
        let mut next = self.state.clone();
        let payload = f(&mut next.doc);
        if next.doc != self.state.doc {
            next.history_push_past(self.state.snapshot_for_history());
            let previous = std::mem::replace(&mut self.state, next);
            self.changes.record_commit(previous, &mut self.state);
        }
        ok_reply(payload)
    }
}

fn parse_json_or_upper(raw: &str) -> Result<Value, String> {
    let trimmed = raw.trim();
    Ok(serde_json::from_str::<Value>(trimmed)
        .unwrap_or_else(|_| Value::String(trimmed.to_ascii_uppercase())))
}

fn validate_actions(
    actions: &[PrototypeAction],
    valid_ids: &HashSet<String>,
) -> Result<(), String> {
    for act in actions {
        for block in &act.conditional_blocks {
            validate_actions(&block.actions, valid_ids)?;
        }
        if matches!(
            act.kind,
            ActionType::Node
                | ActionType::Navigate
                | ActionType::Overlay
                | ActionType::Swap
                | ActionType::ChangeTo
                | ActionType::ScrollTo
        ) {
            let Some(dst) = act.destination_id.as_deref().filter(|s| !s.is_empty()) else {
                return Err("navigation action requires destinationId".to_string());
            };
            if !valid_ids.contains(dst) {
                return Err(format!("destinationId not found in document: {dst}"));
            }
        }
    }
    Ok(())
}

fn collect_all_ids(doc: &PenDocument) -> HashSet<String> {
    let mut ids = HashSet::new();
    fn walk(nodes: &[PenNode], ids: &mut HashSet<String>) {
        for n in nodes {
            ids.insert(n.node_base().id.clone());
            if let Some(kids) = n.children_ref() {
                walk(kids, ids);
            }
        }
    }
    walk(&doc.children, &mut ids);
    for p in doc.pages.iter().flatten() {
        walk(&p.children, &mut ids);
    }
    ids
}

fn collect_node_proto_summaries(
    doc: &PenDocument,
    requested: &HashSet<String>,
    out: &mut Vec<Value>,
) {
    fn walk(nodes: &[PenNode], requested: &HashSet<String>, out: &mut Vec<Value>) {
        for n in nodes {
            let b = n.node_base();
            let has_proto = b.reactions.is_some()
                || b.overflow_direction.is_some()
                || b.scroll_behavior.is_some()
                || b.overlay.is_some()
                || b.flow_starting_point.is_some()
                || b.section == Some(true);
            if if requested.is_empty() {
                has_proto
            } else {
                requested.contains(&b.id)
            } {
                out.push(json!({
                    "nodeId": b.id,
                    "name": b.name,
                    "reactions": b.reactions,
                    "overflowDirection": b.overflow_direction,
                    "scrollBehavior": b.scroll_behavior,
                    "overlay": b.overlay,
                    "section": b.section,
                    "flowStartingPoint": b.flow_starting_point,
                }));
            }
            if let Some(kids) = n.children_ref() {
                walk(kids, requested, out);
            }
        }
    }
    walk(&doc.children, requested, out);
    for p in doc.pages.iter().flatten() {
        walk(&p.children, requested, out);
    }
}

fn update_node_base(
    doc: &mut PenDocument,
    node_id: &str,
    mut f: impl FnMut(&mut jian_ops_schema::node::PenNodeBase),
) {
    fn walk(
        nodes: &mut [PenNode],
        node_id: &str,
        f: &mut impl FnMut(&mut jian_ops_schema::node::PenNodeBase),
    ) -> bool {
        for n in nodes {
            if n.node_base().id == node_id {
                f(n.node_base_mut());
                return true;
            }
            if let Some(kids) = n.children_mut_slice() {
                if walk(kids, node_id, f) {
                    return true;
                }
            }
        }
        false
    }
    if !walk(&mut doc.children, node_id, &mut f) {
        for p in doc.pages.iter_mut().flatten() {
            if walk(&mut p.children, node_id, &mut f) {
                break;
            }
        }
    }
}

fn set_node_reactions(doc: &mut PenDocument, node_id: &str, reactions: Vec<Reaction>) {
    update_node_base(doc, node_id, |base| {
        base.reactions = (!reactions.is_empty()).then(|| reactions.clone());
    });
}

fn sync_flow_starting_points(doc: &mut PenDocument, flows: &[FlowStartingPoint]) {
    fn clear_all(nodes: &mut [PenNode]) {
        for n in nodes {
            n.node_base_mut().flow_starting_point = None;
            if let Some(kids) = n.children_mut_slice() {
                clear_all(kids);
            }
        }
    }
    clear_all(&mut doc.children);
    for p in doc.pages.iter_mut().flatten() {
        clear_all(&mut p.children);
    }
    for flow in flows {
        update_node_base(doc, &flow.node_id, |base| {
            base.flow_starting_point = Some(flow.clone());
        });
    }
}

#[cfg(test)]
#[path = "prototype_tests.rs"]
mod tests;
