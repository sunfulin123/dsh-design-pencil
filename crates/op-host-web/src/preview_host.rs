//! Figma-compatible zero-relayout web Present session backed by
//! [`op_editor_core::prototype::PrototypePlayer`].
//!
//! Replaces `op-preview-core` (`jian_core::Runtime` + `serde_json` round-trip +
//! Taffy relayout) so entering Present mode is O(screens) and reuses the
//! editor's existing `LayoutScene` with GPU screen snapshot caching.

pub mod device_frame;
pub mod paint;

pub use device_frame::{lerp_color, ModeTransition, ModeTransitionKind, PinnedPaint};
pub use paint::invalidate_preview_snapshots;

use jian_core::gesture::pointer::{Modifiers, PointerKind, PointerPhase};
use jian_ops_schema::node::PenNode;
use jian_ops_schema::PenDocument;
use op_editor_core::prototype::PrototypePlayer;
use op_editor_core::PenNodeExt;
use op_editor_ui::{Color, Point2D, Rect};
use std::cell::Cell;
use std::collections::BTreeMap;
use std::rc::Rc;

#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct PreviewInteractionState {
    hovered_node: Option<String>,
}

impl PreviewInteractionState {
    pub fn hovered_node(&self) -> Option<&str> {
        self.hovered_node.as_deref()
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub struct ReconcileOutcome {
    pub repaint: bool,
    pub switched: bool,
}

#[derive(Debug, Clone)]
struct BareWidgetBounds {
    id: String,
    rect: Rect,
}

pub struct PreviewSession {
    pub player: PrototypePlayer,
    warnings: Vec<String>,
    interaction: PreviewInteractionState,
    pending_route: Cell<Option<String>>,
    last_reconciled_screen: String,
    pub(crate) state_revision: u64,
    bare_widgets: Vec<BareWidgetBounds>,
}

impl PreviewSession {
    #[allow(clippy::too_many_arguments)]
    pub fn enter(
        doc: &PenDocument,
        _canvas_size: (f32, f32),
        _active_theme: &BTreeMap<String, String>,
        active_page_index: usize,
        _preserve_authored_geometry: bool,
        _presenting: bool,
        _measure: Rc<dyn jian_core::layout::measure::MeasureBackend>,
        now_ms: u64,
    ) -> Result<Self, String> {
        Self::enter_fast(doc, active_page_index, now_ms)
    }

    pub fn enter_fast(
        doc: &PenDocument,
        active_page_index: usize,
        now_ms: u64,
    ) -> Result<Self, String> {
        let player = PrototypePlayer::enter(doc, active_page_index, None, (0.0, 0.0), now_ms)
            .unwrap_or_else(|| PrototypePlayer::empty(doc, now_ms));
        let last_reconciled_screen = player.current_screen_id.clone();
        let bare_widgets = collect_bare_widgets(doc, active_page_index);
        Ok(Self {
            player,
            warnings: Vec::new(),
            interaction: PreviewInteractionState::default(),
            pending_route: Cell::new(None),
            last_reconciled_screen,
            state_revision: 1,
            bare_widgets,
        })
    }

    pub fn warnings(&self) -> &[String] {
        &self.warnings
    }

    pub fn set_now_ms(&mut self, now_ms: u64) {
        self.player.now_ms = now_ms;
    }

    pub fn resize(&mut self, _canvas_size: (f32, f32)) {}

    pub fn pump(&mut self, now_ms: u64) -> bool {
        let changed = self.player.tick(now_ms);
        if changed {
            self.state_revision = self.state_revision.wrapping_add(1);
        }
        changed
    }

    pub fn reconcile(&mut self, now_ms: u64) -> ReconcileOutcome {
        if let Some(route) = self.pending_route.take() {
            if let Some(screen) = self
                .player
                .screens()
                .iter()
                .find(|s| s.route.as_deref() == Some(route.as_str()) || s.id == route)
            {
                let id = screen.id.clone();
                self.player.go_to_screen(&id, now_ms);
                self.state_revision = self.state_revision.wrapping_add(1);
            }
        }
        let switched = self.player.current_screen_id != self.last_reconciled_screen;
        if switched {
            self.last_reconciled_screen = self.player.current_screen_id.clone();
        }
        ReconcileOutcome {
            repaint: switched || self.player.is_animating(now_ms),
            switched,
        }
    }

    pub fn framed_root(&self) -> Option<(String, Rect)> {
        let screen = self.player.current_screen()?;
        Some((
            screen.id.clone(),
            Rect::xywh(
                screen.bounds.0,
                screen.bounds.1,
                screen.bounds.2,
                screen.bounds.3,
            ),
        ))
    }

    pub fn framed_root_fill(&self) -> Option<Color> {
        None
    }

    pub fn select_preview_frame(&mut self, id: &str) -> bool {
        if self.player.graph.screen(id).is_none() {
            return false;
        }
        self.player.current_screen_id = id.to_string();
        self.player.overlays.clear();
        self.last_reconciled_screen = id.to_string();
        self.state_revision = self.state_revision.wrapping_add(1);
        true
    }

    pub fn is_app_mode(&self) -> bool {
        !self.player.flows().is_empty() || self.player.screens().iter().any(|s| s.route.is_some())
    }

    pub fn navigate_to_screen(&self, route_or_id: &str) {
        self.pending_route.set(Some(route_or_id.to_string()));
    }

    pub fn screen_switcher_entries(&self) -> Vec<(String, String)> {
        if !self.player.flows().is_empty() {
            return self
                .player
                .flows()
                .iter()
                .map(|f| (f.node_id.clone(), f.name.clone()))
                .collect();
        }
        self.player
            .screens()
            .iter()
            .filter_map(|s| Some((s.route.clone()?, s.name.clone())))
            .collect()
    }

    pub fn current_screen_index(&self) -> Option<usize> {
        let entries = self.screen_switcher_entries();
        entries.iter().position(|(key, _)| {
            *key == self.player.current_screen_id
                || self
                    .player
                    .current_screen()
                    .and_then(|s| s.route.as_deref())
                    == Some(key.as_str())
        })
    }

    pub fn begin_lifecycle(&mut self, _now_ms: u64) {}

    pub fn next_wake_deadline_ms(&self) -> Option<u64> {
        self.player
            .is_animating(self.player.now_ms)
            .then_some(self.player.now_ms.saturating_add(16))
    }

    pub fn transition_active(&self) -> bool {
        self.player.is_animating(self.player.now_ms)
    }

    pub fn can_pop(&self) -> bool {
        self.player.can_go_back()
    }

    pub fn pop_screen(&self) {
        if let Some(prev) = self.player.history.last() {
            self.pending_route.set(Some(prev.screen_id.clone()));
        }
    }

    pub fn pinned_nav_candidate(&self, _is_phone: bool) -> Option<(String, Rect)> {
        None
    }

    pub fn pinned_status_bar_candidate(&self, _is_phone: bool) -> Option<(String, Rect)> {
        None
    }

    pub fn root_scene_rect(&self, board_id: &str) -> Option<Rect> {
        self.player
            .graph
            .screen(board_id)
            .map(|s| Rect::xywh(s.bounds.0, s.bounds.1, s.bounds.2, s.bounds.3))
    }

    pub fn interaction(&self) -> &PreviewInteractionState {
        &self.interaction
    }

    pub fn clear_hover(&mut self) -> bool {
        let had = self.interaction.hovered_node.take().is_some()
            || self.player.hovered_node_id.take().is_some();
        if had {
            self.state_revision = self.state_revision.wrapping_add(1);
        }
        had
    }

    pub fn dispatch_pointer_for_id_at(
        &mut self,
        _pid: u32,
        _kind: PointerKind,
        doc_x: f32,
        doc_y: f32,
        phase: PointerPhase,
        now_ms: u64,
    ) -> bool {
        let (lx, ly) = match self.player.current_screen() {
            Some(screen) => (doc_x - screen.bounds.0, doc_y - screen.bounds.1),
            None => (doc_x, doc_y),
        };
        let changed = match phase {
            PointerPhase::Hover | PointerPhase::Move => {
                let mut c = self.player.pointer_move(lx, ly, now_ms);
                let mut hovered = self.player.hovered_node_id.clone();
                if hovered.is_none() {
                    hovered = self
                        .bare_widgets
                        .iter()
                        .find(|w| w.rect.contains(Point2D::new(doc_x, doc_y)))
                        .map(|w| w.id.clone());
                }
                if self.interaction.hovered_node != hovered {
                    self.interaction.hovered_node = hovered;
                    c = true;
                }
                c
            }
            PointerPhase::Down => self.player.pointer_down(lx, ly, now_ms),
            PointerPhase::Up => self.player.pointer_up(lx, ly, now_ms),
            PointerPhase::Cancel => false,
        };
        if changed {
            self.state_revision = self.state_revision.wrapping_add(1);
        }
        changed
    }

    pub fn cancel_pointer(&mut self, _pid: u32, _now_ms: u64) {
        self.player.pressed_node_id = None;
    }

    pub fn dispatch_text(&mut self, _text: &str) -> bool {
        false
    }

    pub fn focus_next(&mut self) {}

    pub fn focus_previous(&mut self) {}

    pub fn dispatch_key(&mut self, key: &str, _mods: Modifiers) -> bool {
        let now = self.player.now_ms;
        let changed = match key {
            "r" | "R" => self.player.restart(now),
            "Backspace" => self.player.back(now),
            _ => false,
        };
        if changed {
            self.state_revision = self.state_revision.wrapping_add(1);
        }
        changed
    }
}

pub fn enter_preview(
    doc: &PenDocument,
    _canvas_size: (f32, f32),
    _active_theme: &BTreeMap<String, String>,
    active_page_index: usize,
    _op_ck: &crate::canvaskit::OpCk,
    _presenting: bool,
    now_ms: u64,
) -> Result<PreviewSession, String> {
    PreviewSession::enter_fast(doc, active_page_index, now_ms)
}

fn collect_bare_widgets(doc: &PenDocument, active_page_index: usize) -> Vec<BareWidgetBounds> {
    let roots: &[PenNode] = match doc.pages.as_ref().filter(|p| !p.is_empty()) {
        Some(pages) => &pages[active_page_index.min(pages.len().saturating_sub(1))].children,
        None => &doc.children,
    };
    roots
        .iter()
        .filter(|n| !matches!(n, PenNode::Frame(_)) && n.base().visible != Some(false))
        .map(|n| BareWidgetBounds {
            id: n.id_str().to_string(),
            rect: Rect::xywh(
                n.base().x.unwrap_or(0.0) as f32,
                n.base().y.unwrap_or(0.0) as f32,
                n.width_px().unwrap_or(44.0) as f32,
                n.height_px().unwrap_or(24.0) as f32,
            ),
        })
        .collect()
}
