//! Action execution, overlay management, transition activation, timer arming,
//! and interactive-component state evaluation for [`PrototypePlayer`].

use super::graph::HotspotEntry;
use super::player::{
    ActiveTransition, HistoryEntry, OverlayInstance, PendingTimer, PrototypePlayer, SimulateReport,
    SimulateStep,
};
use super::smart_animate::match_smart_animate_layers;
use jian_ops_schema::prototype::{
    ActionType, OverlayBackgroundInteraction, OverlayOffset, OverlayPositionType, PrototypeAction,
    PrototypeNavigation, PrototypeTransition, PrototypeTransitionType, TriggerType,
};
use serde_json::Value;

impl PrototypePlayer {
    pub fn simulate(&mut self, steps: &[SimulateStep]) -> SimulateReport {
        let start_screen_id = self.current_screen_id.clone();
        let mut visited_screens = vec![start_screen_id.clone()];
        let mut now = self.now_ms;
        for step in steps {
            now += 16;
            match step {
                SimulateStep::Click { node_id, x, y } => {
                    if let Some(id) = node_id {
                        self.click_node(id, now);
                    } else if let (Some(px), Some(py)) = (x, y) {
                        self.pointer_down(*px, *py, now);
                        self.pointer_up(*px, *py, now + 8);
                    }
                }
                SimulateStep::Hover { node_id } => {
                    self.fire_node_trigger(node_id, TriggerType::OnHover, now);
                    self.update_behaviour_hover_press(node_id, true);
                }
                SimulateStep::KeyDown { key_code } => {
                    self.key_down(*key_code, now);
                }
                SimulateStep::Wait { ms } => {
                    now += *ms;
                    self.tick(now);
                }
                SimulateStep::Back => {
                    self.back(now);
                }
                SimulateStep::Restart => {
                    self.restart(now);
                }
            }
            if visited_screens.last() != Some(&self.current_screen_id) {
                visited_screens.push(self.current_screen_id.clone());
            }
        }
        SimulateReport {
            start_screen_id,
            current_screen_id: self.current_screen_id.clone(),
            visited_screens,
            overlays: self.overlays.iter().map(|o| o.screen_id.clone()).collect(),
            variant_overrides: self
                .variant_overrides
                .iter()
                .map(|(k, v)| (k.clone(), v.clone()))
                .collect(),
            variable_overrides: self.variable_overrides.clone(),
            opened_urls: self.opened_urls.clone(),
        }
    }

    pub(super) fn hit_hotspot(&self, lx: f32, ly: f32) -> Option<&HotspotEntry> {
        // Deepest/topmost hotspot wins (reverse DFS order when collected).
        self.active_hotspots().iter().rev().find(|h| {
            let (x, y, w, h_px) = h.local_rect;
            w > 0.0 && h_px > 0.0 && lx >= x && lx <= x + w && ly >= y && ly <= y + h_px
        })
    }

    pub(super) fn fire_node_trigger(
        &mut self,
        node_id: &str,
        kind: TriggerType,
        now_ms: u64,
    ) -> bool {
        let Some(hotspot) = self
            .active_hotspots()
            .iter()
            .find(|h| h.node_id == node_id)
            .cloned()
        else {
            return false;
        };
        let mut changed = false;
        for r in &hotspot.reactions {
            if r.trigger.as_ref().map(|t| t.kind) == Some(kind) {
                changed |= self.execute_actions(Some(node_id), &r.actions, now_ms);
            }
        }
        changed
    }

    pub(super) fn execute_actions(
        &mut self,
        source_node_id: Option<&str>,
        actions: &[PrototypeAction],
        now_ms: u64,
    ) -> bool {
        let mut changed = false;
        for act in actions {
            match act.kind {
                ActionType::Back => {
                    changed |= self.back(now_ms);
                }
                ActionType::Close => {
                    changed |= self.close_top_overlay();
                }
                ActionType::Url => {
                    if let Some(url) = act.url.as_ref().filter(|u| !u.trim().is_empty()) {
                        self.opened_urls.push(url.clone());
                        changed = true;
                    }
                }
                ActionType::SetVariable => {
                    if let Some(var_id) = act.variable_id.as_ref() {
                        let val = act.variable_value.clone().unwrap_or(Value::Bool(true));
                        self.variable_overrides.insert(var_id.clone(), val);
                        changed = true;
                    }
                }
                ActionType::SetVariableMode => {
                    if let (Some(col), Some(mode)) = (
                        act.variable_collection_id.as_ref(),
                        act.variable_mode_id.as_ref(),
                    ) {
                        self.theme_overrides.insert(col.clone(), mode.clone());
                        changed = true;
                    }
                }
                ActionType::Conditional => {
                    if let Some(first) = act.conditional_blocks.first() {
                        changed |= self.execute_actions(source_node_id, &first.actions, now_ms);
                    }
                }
                ActionType::Node
                | ActionType::Navigate
                | ActionType::Overlay
                | ActionType::Swap
                | ActionType::ChangeTo
                | ActionType::ScrollTo => {
                    changed |= self.execute_node_action(source_node_id, act, now_ms);
                }
            }
        }
        changed
    }

    fn execute_node_action(
        &mut self,
        source_node_id: Option<&str>,
        act: &PrototypeAction,
        now_ms: u64,
    ) -> bool {
        let Some(dst) = act.destination_id.as_deref() else {
            return false;
        };
        match act
            .effective_navigation()
            .unwrap_or(PrototypeNavigation::Navigate)
        {
            PrototypeNavigation::Navigate => {
                if self.graph.screen(dst).is_none() || dst == self.current_screen_id {
                    return false;
                }
                let from_id = self.current_screen_id.clone();
                self.history.push(HistoryEntry {
                    screen_id: from_id.clone(),
                    overlays: self.overlays.clone(),
                    scroll_offsets: self.scroll_offsets.clone(),
                    transition: act.transition.clone(),
                });
                self.current_screen_id = dst.to_string();
                self.overlays.clear();
                if act.preserve_scroll_position != Some(true)
                    || act.reset_scroll_position == Some(true)
                {
                    self.scroll_offsets.remove(dst);
                }
                if act.reset_interactive_components == Some(true) {
                    self.reset_interactive_components();
                }
                if let Some(trans) = act.transition.as_ref() {
                    self.start_transition(&from_id, dst, trans, now_ms);
                } else {
                    self.active_transition = None;
                }
                self.arm_after_timeout_triggers(now_ms);
                true
            }
            PrototypeNavigation::Overlay | PrototypeNavigation::Swap => {
                let overlay_inst = self.build_overlay_instance(dst, act.overlay_relative_position);
                if act.effective_navigation() == Some(PrototypeNavigation::Swap)
                    && !self.overlays.is_empty()
                {
                    self.overlays.pop();
                }
                self.overlays.push(overlay_inst);
                true
            }
            PrototypeNavigation::ChangeTo => {
                let owner = source_node_id.unwrap_or(&self.current_screen_id);
                self.variant_overrides
                    .insert(owner.to_string(), dst.to_string());
                true
            }
            PrototypeNavigation::ScrollTo => {
                if let Some(hotspot) = self.active_hotspots().iter().find(|h| h.node_id == dst) {
                    let (tx, ty, _, _) = hotspot.local_rect;
                    self.scroll_offsets
                        .insert(self.current_screen_id.clone(), (tx.max(0.0), ty.max(0.0)));
                    return true;
                }
                false
            }
        }
    }

    fn build_overlay_instance(&self, dst: &str, rel_pos: Option<OverlayOffset>) -> OverlayInstance {
        let settings = self.graph.screen(dst).and_then(|s| s.overlay.as_ref());
        let position_type = settings
            .map(|s| s.position_type)
            .unwrap_or(OverlayPositionType::Center);
        let close_on_click_outside = settings
            .and_then(|s| s.background_interaction)
            .map(|b| b == OverlayBackgroundInteraction::CloseOnClickOutside)
            .unwrap_or(true);
        let background_color = settings.and_then(|s| s.background_color.clone());
        let offset = rel_pos.map_or((0.0, 0.0), |o| (o.x as f32, o.y as f32));
        OverlayInstance {
            screen_id: dst.to_string(),
            position_type,
            offset,
            close_on_click_outside,
            background_color,
        }
    }

    pub(super) fn start_transition(
        &mut self,
        from_id: &str,
        to_id: &str,
        trans: &PrototypeTransition,
        now_ms: u64,
    ) {
        if trans.kind == PrototypeTransitionType::Instant {
            self.active_transition = None;
            return;
        }
        let duration_ms =
            ((trans.duration.unwrap_or(0.3).clamp(0.0, 10.0)) * 1000.0).round() as u64;
        if duration_ms == 0 {
            self.active_transition = None;
            return;
        }
        let mut effective = trans.clone();
        let mut smart_layers = Vec::new();
        if effective.kind == PrototypeTransitionType::SmartAnimate {
            match (self.screen_nodes.get(from_id), self.screen_nodes.get(to_id)) {
                (Some(from_node), Some(to_node)) => {
                    if let Some(matched) = match_smart_animate_layers(from_node, to_node) {
                        smart_layers = matched;
                    } else {
                        effective.kind = PrototypeTransitionType::Dissolve;
                    }
                }
                _ => effective.kind = PrototypeTransitionType::Dissolve,
            }
        }
        self.active_transition = Some(ActiveTransition {
            from_screen_id: from_id.to_string(),
            to_screen_id: to_id.to_string(),
            transition: effective,
            started_ms: now_ms,
            duration_ms,
            smart_layers,
        });
    }

    pub(super) fn arm_after_timeout_triggers(&mut self, now_ms: u64) {
        self.pending_timers.clear();
        let screen_id = self.current_screen_id.clone();
        let Some(hotspots) = self.graph.hotspots_by_screen.get(&screen_id) else {
            return;
        };
        for h in hotspots {
            for r in &h.reactions {
                if let Some(trig) = r.trigger.as_ref() {
                    if trig.kind == TriggerType::AfterTimeout {
                        let ms = ((trig.timeout.unwrap_or(0.8).max(0.0)) * 1000.0).round() as u64;
                        self.pending_timers.push(PendingTimer {
                            screen_id: screen_id.clone(),
                            fire_at_ms: now_ms.saturating_add(ms),
                            actions: r.actions.clone(),
                        });
                    }
                }
            }
        }
    }

    pub(super) fn reset_interactive_components(&mut self) {
        self.behaviour_states.clear();
        self.variant_overrides.clear();
        self.property_overrides.clear();
        let entries: Vec<_> = self
            .graph
            .interactive_components
            .values()
            .cloned()
            .collect();
        for entry in entries {
            let val = entry.behaviour.default_value.clone();
            entry.evaluate_bindings(
                &val,
                &mut self.variant_overrides,
                &mut self.property_overrides,
            );
            self.behaviour_states.insert(entry.owner_id, val);
        }
    }

    pub(super) fn click_behaviour(&mut self, owner_id: &str, rel_x: Option<f32>) -> bool {
        let Some(entry) = self.graph.interactive_components.get(owner_id).cloned() else {
            return false;
        };
        let cur = self
            .behaviour_states
            .get(owner_id)
            .cloned()
            .unwrap_or_else(|| entry.behaviour.default_value.clone());
        let Some(next) = entry.next_click_value(&cur, rel_x) else {
            return false;
        };
        entry.evaluate_bindings(
            &next,
            &mut self.variant_overrides,
            &mut self.property_overrides,
        );
        self.behaviour_states.insert(owner_id.to_string(), next);
        true
    }

    pub(super) fn update_behaviour_hover_press(&mut self, owner_id: &str, active: bool) -> bool {
        let Some(entry) = self.graph.interactive_components.get(owner_id).cloned() else {
            return false;
        };
        let Some(next) = entry.hover_or_press_value(active) else {
            return false;
        };
        entry.evaluate_bindings(
            &next,
            &mut self.variant_overrides,
            &mut self.property_overrides,
        );
        self.behaviour_states.insert(owner_id.to_string(), next);
        true
    }
}
