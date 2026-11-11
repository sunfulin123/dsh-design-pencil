//! Figma-compatible prototype playback state machine.

use super::behaviour::PropertyOverrideValue;
use super::graph::{HotspotEntry, PrototypeFlow, PrototypeGraph, PrototypeScreen};
pub use super::simulate_types::{SimulateReport, SimulateStep};
use super::smart_animate::SmartAnimateLayer;
use super::transition::{compute_transition_frame, TransitionFrame};
use crate::PenNodeExt;
use jian_ops_schema::node::PenNode;
use jian_ops_schema::prototype::{
    OverflowDirection, OverlayPositionType, PrototypeAction, PrototypeTransition, TriggerType,
};
use jian_ops_schema::PenDocument;
use serde_json::Value;
use std::collections::{BTreeMap, HashMap};

/// Duration (ms) for blue hotspot hint flashes when clicking a non-interactive area.
pub const HOTSPOT_FLASH_MS: u64 = 650;

#[derive(Debug, Clone, PartialEq)]
pub struct OverlayInstance {
    pub screen_id: String,
    pub position_type: OverlayPositionType,
    pub offset: (f32, f32),
    pub close_on_click_outside: bool,
    pub background_color: Option<String>,
}

#[derive(Debug, Clone)]
pub struct HistoryEntry {
    pub screen_id: String,
    pub overlays: Vec<OverlayInstance>,
    pub scroll_offsets: HashMap<String, (f32, f32)>,
    pub transition: Option<PrototypeTransition>,
}

#[derive(Debug, Clone)]
pub(super) struct ActiveTransition {
    pub from_screen_id: String,
    pub to_screen_id: String,
    pub transition: PrototypeTransition,
    pub started_ms: u64,
    pub duration_ms: u64,
    pub smart_layers: Vec<SmartAnimateLayer>,
}

#[derive(Debug, Clone)]
pub(super) struct PendingTimer {
    pub screen_id: String,
    pub fire_at_ms: u64,
    pub actions: Vec<PrototypeAction>,
}

#[derive(Debug, Clone)]
pub struct PrototypePlayer {
    pub graph: PrototypeGraph,
    pub entry_screen_id: String,
    pub current_screen_id: String,
    pub active_flow_index: Option<usize>,
    pub history: Vec<HistoryEntry>,
    pub overlays: Vec<OverlayInstance>,
    pub scroll_offsets: HashMap<String, (f32, f32)>,
    pub variant_overrides: HashMap<String, String>,
    pub property_overrides: HashMap<String, PropertyOverrideValue>,
    pub behaviour_states: HashMap<String, Value>,
    pub variable_overrides: BTreeMap<String, Value>,
    pub theme_overrides: BTreeMap<String, String>,
    pub hovered_node_id: Option<String>,
    pub pressed_node_id: Option<String>,
    pub hotspot_flash_until_ms: Option<u64>,
    pub opened_urls: Vec<String>,
    pub now_ms: u64,
    pub(super) active_transition: Option<ActiveTransition>,
    pub(super) pending_timers: Vec<PendingTimer>,
    pub(super) screen_nodes: HashMap<String, PenNode>,
}

impl PrototypePlayer {
    pub fn enter(
        doc: &PenDocument,
        active_page_index: usize,
        selected_node_id: Option<&str>,
        viewport_center: (f32, f32),
        now_ms: u64,
    ) -> Option<Self> {
        let graph = PrototypeGraph::from_document(doc);
        let entry_screen_id = graph.resolve_entry_screen(
            active_page_index,
            selected_node_id,
            doc,
            viewport_center,
        )?;
        let active_flow_index = graph
            .flows
            .iter()
            .position(|f| f.node_id == entry_screen_id)
            .or_else(|| {
                let page_idx = graph.screen(&entry_screen_id)?.page_index;
                graph.flows.iter().position(|f| f.page_index == page_idx)
            });

        let mut screen_nodes = HashMap::new();
        collect_screen_nodes(doc, &mut screen_nodes);

        let mut player = Self {
            graph,
            entry_screen_id: entry_screen_id.clone(),
            current_screen_id: entry_screen_id,
            active_flow_index,
            history: Vec::new(),
            overlays: Vec::new(),
            scroll_offsets: HashMap::new(),
            variant_overrides: HashMap::new(),
            property_overrides: HashMap::new(),
            behaviour_states: HashMap::new(),
            variable_overrides: BTreeMap::new(),
            theme_overrides: BTreeMap::new(),
            hovered_node_id: None,
            pressed_node_id: None,
            hotspot_flash_until_ms: None,
            opened_urls: Vec::new(),
            now_ms,
            active_transition: None,
            pending_timers: Vec::new(),
            screen_nodes,
        };
        player.reset_interactive_components();
        player.arm_after_timeout_triggers(now_ms);
        Some(player)
    }

    pub fn empty(doc: &PenDocument, now_ms: u64) -> Self {
        Self {
            graph: PrototypeGraph::from_document(doc),
            entry_screen_id: String::new(),
            current_screen_id: String::new(),
            active_flow_index: None,
            history: Vec::new(),
            overlays: Vec::new(),
            scroll_offsets: HashMap::new(),
            variant_overrides: HashMap::new(),
            property_overrides: HashMap::new(),
            behaviour_states: HashMap::new(),
            variable_overrides: BTreeMap::new(),
            theme_overrides: BTreeMap::new(),
            hovered_node_id: None,
            pressed_node_id: None,
            hotspot_flash_until_ms: None,
            opened_urls: Vec::new(),
            now_ms,
            active_transition: None,
            pending_timers: Vec::new(),
            screen_nodes: HashMap::new(),
        }
    }

    pub fn current_screen(&self) -> Option<&PrototypeScreen> {
        self.graph.screen(&self.current_screen_id)
    }

    pub fn current_page_index(&self) -> usize {
        self.current_screen().map_or(0, |s| s.page_index)
    }

    pub fn screens(&self) -> &[PrototypeScreen] {
        &self.graph.screens
    }

    pub fn flows(&self) -> &[PrototypeFlow] {
        &self.graph.flows
    }

    pub fn can_go_back(&self) -> bool {
        !self.overlays.is_empty() || !self.history.is_empty()
    }

    pub fn active_hotspots(&self) -> &[HotspotEntry] {
        let top_id = self
            .overlays
            .last()
            .map(|o| o.screen_id.as_str())
            .unwrap_or(&self.current_screen_id);
        self.graph
            .hotspots_by_screen
            .get(top_id)
            .map(Vec::as_slice)
            .unwrap_or(&[])
    }

    pub fn is_animating(&self, now_ms: u64) -> bool {
        self.active_transition
            .as_ref()
            .is_some_and(|t| now_ms < t.started_ms.saturating_add(t.duration_ms))
            || self
                .hotspot_flash_until_ms
                .is_some_and(|until| now_ms < until)
            || self.pending_timers.iter().any(|t| now_ms <= t.fire_at_ms)
    }

    pub fn current_transition_frame(&self, now_ms: u64) -> Option<TransitionFrame> {
        let active = self.active_transition.as_ref()?;
        let elapsed = now_ms.saturating_sub(active.started_ms);
        if elapsed >= active.duration_ms || active.duration_ms == 0 {
            return None;
        }
        let progress = (elapsed as f32 / active.duration_ms as f32).clamp(0.0, 1.0);
        let size = self
            .current_screen()
            .map(|s| (s.bounds.2, s.bounds.3))
            .unwrap_or((390.0, 844.0));
        Some(compute_transition_frame(
            &active.from_screen_id,
            &active.to_screen_id,
            size,
            &active.transition,
            progress,
            active.smart_layers.clone(),
        ))
    }

    pub fn tick(&mut self, now_ms: u64) -> bool {
        self.now_ms = now_ms;
        let mut changed = false;
        if let Some(active) = self.active_transition.as_ref() {
            if now_ms >= active.started_ms.saturating_add(active.duration_ms) {
                self.active_transition = None;
                changed = true;
            } else {
                changed = true;
            }
        }
        if let Some(until) = self.hotspot_flash_until_ms {
            if now_ms >= until {
                self.hotspot_flash_until_ms = None;
                changed = true;
            }
        }
        let mut due = Vec::new();
        self.pending_timers.retain(|t| {
            if t.screen_id != self.current_screen_id {
                false
            } else if now_ms >= t.fire_at_ms {
                due.push(t.actions.clone());
                false
            } else {
                true
            }
        });
        for actions in due {
            if self.execute_actions(None, &actions, now_ms) {
                changed = true;
            }
        }
        changed
    }

    pub fn restart(&mut self, now_ms: u64) -> bool {
        self.now_ms = now_ms;
        self.current_screen_id = self.entry_screen_id.clone();
        self.history.clear();
        self.overlays.clear();
        self.scroll_offsets.clear();
        self.active_transition = None;
        self.hovered_node_id = None;
        self.pressed_node_id = None;
        self.hotspot_flash_until_ms = None;
        self.reset_interactive_components();
        self.arm_after_timeout_triggers(now_ms);
        true
    }

    pub fn select_flow(&mut self, flow_index: usize, now_ms: u64) -> bool {
        let Some(flow) = self.graph.flows.get(flow_index) else {
            return false;
        };
        self.active_flow_index = Some(flow_index);
        self.entry_screen_id = flow.node_id.clone();
        self.restart(now_ms)
    }

    pub fn go_to_screen(&mut self, screen_id: &str, now_ms: u64) -> bool {
        if self.graph.screen(screen_id).is_none() {
            return false;
        }
        if self.current_screen_id == screen_id && self.overlays.is_empty() {
            return false;
        }
        self.now_ms = now_ms;
        self.current_screen_id = screen_id.to_string();
        self.overlays.clear();
        self.active_transition = None;
        self.arm_after_timeout_triggers(now_ms);
        true
    }

    pub fn step_screen(&mut self, delta: i32, now_ms: u64) -> bool {
        let Some(idx) = self
            .graph
            .screens
            .iter()
            .position(|s| s.id == self.current_screen_id)
        else {
            return false;
        };
        let next =
            (idx as i64 + i64::from(delta)).clamp(0, self.graph.screens.len() as i64 - 1) as usize;
        if next == idx {
            return false;
        }
        let target_id = self.graph.screens[next].id.clone();
        self.go_to_screen(&target_id, now_ms)
    }

    pub fn back(&mut self, now_ms: u64) -> bool {
        self.now_ms = now_ms;
        if !self.overlays.is_empty() {
            self.overlays.pop();
            return true;
        }
        let Some(prev) = self.history.pop() else {
            return false;
        };
        let from_id = self.current_screen_id.clone();
        self.current_screen_id = prev.screen_id.clone();
        self.overlays = prev.overlays;
        self.scroll_offsets = prev.scroll_offsets;
        if let Some(mut trans) = prev.transition {
            trans.direction = trans.direction.map(reverse_direction);
            self.start_transition(&from_id, &prev.screen_id, &trans, now_ms);
        } else {
            self.active_transition = None;
        }
        self.arm_after_timeout_triggers(now_ms);
        true
    }

    pub fn close_top_overlay(&mut self) -> bool {
        self.overlays.pop().is_some()
    }

    pub fn scroll_by(&mut self, dx: f32, dy: f32) -> bool {
        let Some(screen) = self.current_screen() else {
            return false;
        };
        let dir = screen.overflow_direction;
        if dir == OverflowDirection::None {
            return false;
        }
        let id = screen.id.clone();
        let entry = self.scroll_offsets.entry(id).or_insert((0.0, 0.0));
        let mut changed = false;
        if matches!(dir, OverflowDirection::Horizontal | OverflowDirection::Both) && dx.abs() > 0.01
        {
            entry.0 = (entry.0 + dx).max(0.0);
            changed = true;
        }
        if matches!(dir, OverflowDirection::Vertical | OverflowDirection::Both) && dy.abs() > 0.01 {
            entry.1 = (entry.1 + dy).max(0.0);
            changed = true;
        }
        changed
    }

    /// Hit-test and dispatch pointer move in screen-local coordinates `(lx, ly)`.
    pub fn pointer_move(&mut self, lx: f32, ly: f32, now_ms: u64) -> bool {
        self.now_ms = now_ms;
        let scroll = self.current_scroll_offset();
        let hit = self
            .hit_hotspot(lx + scroll.0, ly + scroll.1)
            .map(|h| h.node_id.clone());
        if hit == self.hovered_node_id {
            return false;
        }
        let prev = self.hovered_node_id.take();
        self.hovered_node_id = hit.clone();
        let mut changed = true;
        if let Some(prev_id) = prev {
            self.fire_node_trigger(&prev_id, TriggerType::MouseLeave, now_ms);
            self.update_behaviour_hover_press(&prev_id, false);
        }
        if let Some(new_id) = hit {
            self.fire_node_trigger(&new_id, TriggerType::MouseEnter, now_ms);
            self.fire_node_trigger(&new_id, TriggerType::OnHover, now_ms);
            self.update_behaviour_hover_press(&new_id, true);
            changed = true;
        }
        changed
    }

    pub fn pointer_down(&mut self, lx: f32, ly: f32, now_ms: u64) -> bool {
        self.now_ms = now_ms;
        let scroll = self.current_scroll_offset();
        let Some(hit_id) = self
            .hit_hotspot(lx + scroll.0, ly + scroll.1)
            .map(|h| h.node_id.clone())
        else {
            return false;
        };
        self.pressed_node_id = Some(hit_id.clone());
        self.fire_node_trigger(&hit_id, TriggerType::MouseDown, now_ms);
        self.fire_node_trigger(&hit_id, TriggerType::OnPress, now_ms);
        self.update_behaviour_hover_press(&hit_id, true);
        true
    }

    pub fn pointer_up(&mut self, lx: f32, ly: f32, now_ms: u64) -> bool {
        self.now_ms = now_ms;
        if let Some(pressed_id) = self.pressed_node_id.take() {
            self.fire_node_trigger(&pressed_id, TriggerType::MouseUp, now_ms);
            if self.hovered_node_id.as_deref() != Some(pressed_id.as_str()) {
                self.update_behaviour_hover_press(&pressed_id, false);
            }
        }
        let scroll = self.current_scroll_offset();
        let hit = self.hit_hotspot(lx + scroll.0, ly + scroll.1).cloned();
        let Some(hotspot) = hit else {
            if let Some(top) = self.overlays.last() {
                if top.close_on_click_outside {
                    self.overlays.pop();
                    return true;
                }
            }
            self.hotspot_flash_until_ms = Some(now_ms.saturating_add(HOTSPOT_FLASH_MS));
            return true;
        };
        let rel_x = if hotspot.local_rect.2 > 0.0 {
            Some(((lx + scroll.0 - hotspot.local_rect.0) / hotspot.local_rect.2).clamp(0.0, 1.0))
        } else {
            None
        };
        let mut changed = false;
        if let Some(owner_id) = hotspot.behaviour_owner.as_deref() {
            changed |= self.click_behaviour(owner_id, rel_x);
        }
        changed |= self.fire_node_trigger(&hotspot.node_id, TriggerType::OnClick, now_ms);
        changed
    }

    pub fn click_node(&mut self, node_id: &str, now_ms: u64) -> bool {
        self.now_ms = now_ms;
        let mut changed = false;
        if self.graph.interactive_components.contains_key(node_id) {
            changed |= self.click_behaviour(node_id, None);
        }
        changed |= self.fire_node_trigger(node_id, TriggerType::OnClick, now_ms);
        changed
    }

    pub fn key_down(&mut self, key_code: u32, now_ms: u64) -> bool {
        self.now_ms = now_ms;
        let hotspots: Vec<HotspotEntry> = self.active_hotspots().to_vec();
        let mut changed = false;
        for h in hotspots {
            for r in &h.reactions {
                if let Some(trig) = r.trigger.as_ref() {
                    if trig.kind == TriggerType::OnKeyDown
                        && (trig.key_codes.is_empty() || trig.key_codes.contains(&key_code))
                    {
                        changed |= self.execute_actions(Some(&h.node_id), &r.actions, now_ms);
                    }
                }
            }
        }
        changed
    }

    pub fn current_scroll_offset(&self) -> (f32, f32) {
        self.scroll_offsets
            .get(&self.current_screen_id)
            .copied()
            .unwrap_or((0.0, 0.0))
    }
}

fn reverse_direction(
    dir: jian_ops_schema::prototype::TransitionDirection,
) -> jian_ops_schema::prototype::TransitionDirection {
    use jian_ops_schema::prototype::TransitionDirection::*;
    match dir {
        Left => Right,
        Right => Left,
        Top => Bottom,
        Bottom => Top,
    }
}

fn collect_screen_nodes(doc: &PenDocument, out: &mut HashMap<String, PenNode>) {
    fn walk_top(nodes: &[PenNode], out: &mut HashMap<String, PenNode>) {
        for n in nodes {
            if matches!(n, PenNode::Frame(_)) {
                out.insert(n.id_str().to_string(), n.clone());
                if n.base().section == Some(true) {
                    if let Some(kids) = n.children() {
                        walk_top(kids, out);
                    }
                }
            }
        }
    }
    walk_top(&doc.children, out);
    for page in doc.pages.iter().flatten() {
        walk_top(&page.children, out);
    }
}
