//! O(screens) prototype graph builder: screen discovery (including Figma
//! `SECTION` child expansion), flows, hotspots, and legacy `onTap`/`screen`
//! compatibility.

use super::behaviour::{
    collect_interactive_components, derive_legacy_on_tap, InteractiveComponentEntry,
};
use crate::PenNodeExt;
use jian_ops_schema::node::{FrameNode, PenNode};
use jian_ops_schema::prototype::{
    FlowStartingPoint, OverflowDirection, OverlaySettings, PrototypeDeviceSpec, Reaction,
};
use jian_ops_schema::PenDocument;
use std::collections::HashMap;

#[derive(Debug, Clone, PartialEq)]
pub struct PrototypeScreen {
    pub page_index: usize,
    pub page_id: String,
    pub page_label: String,
    pub id: String,
    pub name: String,
    pub section_id: Option<String>,
    pub section_name: Option<String>,
    /// Authored `(x, y, width, height)` in page coordinates.
    pub bounds: (f32, f32, f32, f32),
    pub overflow_direction: OverflowDirection,
    pub overlay: Option<OverlaySettings>,
    pub route: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct PrototypeFlow {
    pub page_index: usize,
    pub node_id: String,
    pub name: String,
    pub description: Option<String>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct HotspotEntry {
    pub node_id: String,
    pub screen_id: String,
    /// Screen-local `(x, y, width, height)`.
    pub local_rect: (f32, f32, f32, f32),
    pub reactions: Vec<Reaction>,
    pub behaviour_owner: Option<String>,
}

#[derive(Debug, Clone, Default)]
pub struct PrototypeGraph {
    pub screens: Vec<PrototypeScreen>,
    pub flows: Vec<PrototypeFlow>,
    pub hotspots_by_screen: HashMap<String, Vec<HotspotEntry>>,
    pub interactive_components: HashMap<String, InteractiveComponentEntry>,
    pub device: Option<PrototypeDeviceSpec>,
    pub background_color: Option<String>,
}

impl PrototypeGraph {
    pub fn from_document(doc: &PenDocument) -> Self {
        let interactive_components = collect_interactive_components(doc);
        let mut screens = Vec::new();
        let mut flows = Vec::new();
        let mut route_to_screen: HashMap<String, String> = HashMap::new();
        let mut screen_roots: HashMap<String, (PenNode, (f32, f32))> = HashMap::new();

        let mut visit_page =
            |page_idx: usize, page_id: &str, page_label: &str, children: &[PenNode]| {
                let mut page_screens = Vec::new();
                for node in children {
                    let PenNode::Frame(frame) = node else {
                        continue;
                    };
                    if !is_valid_container_frame(frame) {
                        continue;
                    }
                    if frame.base.section == Some(true) {
                        let sx = frame.base.x.unwrap_or(0.0) as f32;
                        let sy = frame.base.y.unwrap_or(0.0) as f32;
                        let sec_id = Some(frame.base.id.clone());
                        let sec_name = frame
                            .base
                            .name
                            .clone()
                            .or_else(|| Some(frame.base.id.clone()));
                        let kids = frame.children.as_deref().unwrap_or(&[]);
                        let has_full = kids.iter().any(|c| {
                            matches!(c, PenNode::Frame(cf) if is_valid_screen_frame(cf))
                                && (c.width_px().unwrap_or(0.0) >= 100.0
                                    || c.height_px().unwrap_or(0.0) >= 100.0)
                        });
                        for child in kids {
                            let PenNode::Frame(cf) = child else {
                                continue;
                            };
                            if !is_valid_screen_frame(cf) {
                                continue;
                            }
                            if has_full
                                && cf.base.flow_starting_point.is_none()
                                && cf.screen.is_none()
                                && child.width_px().unwrap_or(390.0) < 100.0
                                && child.height_px().unwrap_or(844.0) < 100.0
                            {
                                continue;
                            }
                            let (entry, origin) = build_screen_entry(
                                page_idx,
                                page_id,
                                page_label,
                                cf,
                                (sx, sy),
                                sec_id.clone(),
                                sec_name.clone(),
                            );
                            record_flow_and_route(
                                cf,
                                page_idx,
                                &entry,
                                &mut flows,
                                &mut route_to_screen,
                            );
                            screen_roots.insert(entry.id.clone(), (child.clone(), origin));
                            page_screens.push(entry);
                        }
                    } else if is_valid_screen_frame(frame) {
                        let (entry, origin) = build_screen_entry(
                            page_idx,
                            page_id,
                            page_label,
                            frame,
                            (0.0, 0.0),
                            None,
                            None,
                        );
                        record_flow_and_route(
                            frame,
                            page_idx,
                            &entry,
                            &mut flows,
                            &mut route_to_screen,
                        );
                        screen_roots.insert(entry.id.clone(), (node.clone(), origin));
                        page_screens.push(entry);
                    }
                }
                page_screens.sort_by(|a, b| {
                    a.bounds
                        .1
                        .total_cmp(&b.bounds.1)
                        .then_with(|| a.bounds.0.total_cmp(&b.bounds.0))
                });
                screens.extend(page_screens);
            };

        match doc.pages.as_ref().filter(|p| !p.is_empty()) {
            Some(pages) => {
                let has_non_comp = pages.iter().any(|p| {
                    p.name != crate::page_mutators::COMPONENTS_PAGE_NAME && !p.children.is_empty()
                });
                for (idx, page) in pages.iter().enumerate() {
                    if has_non_comp && page.name == crate::page_mutators::COMPONENTS_PAGE_NAME {
                        continue;
                    }
                    visit_page(idx, &page.id, &page.name, &page.children);
                }
            }
            None => visit_page(
                0,
                "page-0",
                doc.name.as_deref().unwrap_or("Page 1"),
                &doc.children,
            ),
        }

        if let Some(proto) = doc.prototype.as_ref() {
            merge_declared_flows(&proto.flows, &screens, &mut flows);
            for (page_id, p_proto) in &proto.pages {
                let page_idx = screens
                    .iter()
                    .find(|s| s.page_id == *page_id)
                    .map(|s| s.page_index)
                    .unwrap_or(0);
                for f in &p_proto.flows {
                    if screens.iter().any(|s| s.id == f.node_id)
                        && !flows.iter().any(|existing| existing.node_id == f.node_id)
                    {
                        flows.push(PrototypeFlow {
                            page_index: page_idx,
                            node_id: f.node_id.clone(),
                            name: f.name.clone(),
                            description: f.description.clone(),
                        });
                    }
                }
            }
        }

        let all_nodes = crate::component_behaviour::document_nodes(doc);
        let master_sizes: HashMap<String, (f32, f32)> = all_nodes
            .iter()
            .map(|(id, n)| {
                (
                    id.clone(),
                    (
                        n.width_px().unwrap_or(0.0) as f32,
                        n.height_px().unwrap_or(0.0) as f32,
                    ),
                )
            })
            .collect();
        let mut hotspots_by_screen = HashMap::new();
        for screen in &screens {
            if let Some((root_node, _)) = screen_roots.get(&screen.id) {
                let mut hotspots = Vec::new();
                collect_hotspots(
                    root_node,
                    &screen.id,
                    (0.0, 0.0),
                    true,
                    &route_to_screen,
                    &interactive_components,
                    &master_sizes,
                    &mut hotspots,
                );
                hotspots_by_screen.insert(screen.id.clone(), hotspots);
            }
        }

        let device = doc.prototype.as_ref().and_then(|p| p.device.clone());
        let background_color = doc
            .prototype
            .as_ref()
            .and_then(|p| p.background_color.clone());

        Self {
            screens,
            flows,
            hotspots_by_screen,
            interactive_components,
            device,
            background_color,
        }
    }

    pub fn screen(&self, id: &str) -> Option<&PrototypeScreen> {
        self.screens.iter().find(|s| s.id == id)
    }

    pub fn resolve_entry_screen(
        &self,
        active_page_index: usize,
        selected_node_id: Option<&str>,
        doc: &PenDocument,
        viewport_center: (f32, f32),
    ) -> Option<String> {
        if self.screens.is_empty() {
            return None;
        }
        if let Some(sel) = selected_node_id.filter(|s| !s.is_empty()) {
            if let Some(screen) = self
                .screens
                .iter()
                .find(|s| s.id == sel || screen_contains_node(doc, &s.id, sel))
            {
                return Some(screen.id.clone());
            }
        }
        if let Some(flow) = self
            .flows
            .iter()
            .find(|f| f.page_index == active_page_index)
        {
            return Some(flow.node_id.clone());
        }
        let page_screens: Vec<&PrototypeScreen> = self
            .screens
            .iter()
            .filter(|s| s.page_index == active_page_index)
            .collect();
        if !page_screens.is_empty() {
            let nearest = page_screens.iter().min_by(|a, b| {
                let dist = |s: &PrototypeScreen| {
                    let cx = s.bounds.0 + s.bounds.2 * 0.5 - viewport_center.0;
                    let cy = s.bounds.1 + s.bounds.3 * 0.5 - viewport_center.1;
                    cx * cx + cy * cy
                };
                dist(a).total_cmp(&dist(b))
            });
            if let Some(s) = nearest {
                return Some(s.id.clone());
            }
        }
        if let Some(flow) = self.flows.first() {
            return Some(flow.node_id.clone());
        }
        self.screens.first().map(|s| s.id.clone())
    }
}

fn is_valid_container_frame(frame: &FrameNode) -> bool {
    frame.base.visible != Some(false)
        && frame.base.x.is_none_or(f64::is_finite)
        && frame.base.y.is_none_or(f64::is_finite)
}

/// Whether an authored frame is eligible to appear as a standalone preview screen.
pub fn is_valid_screen_frame(frame: &FrameNode) -> bool {
    is_valid_container_frame(frame)
        && frame.base.preview_as_screen != Some(false)
        && (frame.reusable != Some(true)
            || frame.base.preview_as_screen == Some(true)
            || frame.base.flow_starting_point.is_some())
        && !is_legacy_device_decoration(frame)
}

/// Older generated device shells were persisted before preview eligibility existed.
fn is_legacy_device_decoration(frame: &FrameNode) -> bool {
    frame.base.id == "synapse-device-frame"
        && frame.base.locked == Some(true)
        && matches!(
            frame.base.name.as_deref(),
            Some("Synapse Device Frame · Browser" | "Synapse Device Frame · Phone")
        )
}

fn build_screen_entry(
    page_index: usize,
    page_id: &str,
    page_label: &str,
    frame: &FrameNode,
    parent_origin: (f32, f32),
    section_id: Option<String>,
    section_name: Option<String>,
) -> (PrototypeScreen, (f32, f32)) {
    let node = PenNode::Frame(frame.clone());
    let lx = frame.base.x.unwrap_or(0.0) as f32;
    let ly = frame.base.y.unwrap_or(0.0) as f32;
    let x = parent_origin.0 + lx;
    let y = parent_origin.1 + ly;
    let w = node.width_px().unwrap_or(390.0).max(1.0) as f32;
    let h = node.height_px().unwrap_or(844.0).max(1.0) as f32;
    let entry = PrototypeScreen {
        page_index,
        page_id: page_id.to_string(),
        page_label: page_label.to_string(),
        id: frame.base.id.clone(),
        name: frame
            .base
            .name
            .clone()
            .unwrap_or_else(|| frame.base.id.clone()),
        section_id,
        section_name,
        bounds: (x, y, w, h),
        overflow_direction: frame
            .base
            .overflow_direction
            .unwrap_or(OverflowDirection::None),
        overlay: frame.base.overlay.clone(),
        route: frame.screen.clone(),
    };
    (entry, (x, y))
}

fn record_flow_and_route(
    frame: &FrameNode,
    page_index: usize,
    entry: &PrototypeScreen,
    flows: &mut Vec<PrototypeFlow>,
    route_to_screen: &mut HashMap<String, String>,
) {
    if let Some(route) = frame.screen.as_ref() {
        route_to_screen.insert(route.clone(), entry.id.clone());
        if route == "/" && !flows.iter().any(|f| f.node_id == entry.id) {
            flows.push(PrototypeFlow {
                page_index,
                node_id: entry.id.clone(),
                name: entry.name.clone(),
                description: None,
            });
        }
    }
    if let Some(sp) = frame.base.flow_starting_point.as_ref() {
        if !flows.iter().any(|f| f.node_id == entry.id) {
            flows.push(PrototypeFlow {
                page_index,
                node_id: entry.id.clone(),
                name: sp.name.clone(),
                description: sp.description.clone(),
            });
        }
    }
}

fn merge_declared_flows(
    declared: &[FlowStartingPoint],
    screens: &[PrototypeScreen],
    flows: &mut Vec<PrototypeFlow>,
) {
    for f in declared {
        if let Some(screen) = screens.iter().find(|s| s.id == f.node_id) {
            if let Some(existing) = flows.iter_mut().find(|e| e.node_id == f.node_id) {
                existing.name = f.name.clone();
                existing.description = f.description.clone();
            } else {
                flows.push(PrototypeFlow {
                    page_index: screen.page_index,
                    node_id: f.node_id.clone(),
                    name: f.name.clone(),
                    description: f.description.clone(),
                });
            }
        }
    }
}

fn collect_hotspots(
    node: &PenNode,
    screen_id: &str,
    local_offset: (f32, f32),
    is_screen_root: bool,
    route_to_screen: &HashMap<String, String>,
    interactive_components: &HashMap<String, InteractiveComponentEntry>,
    master_sizes: &HashMap<String, (f32, f32)>,
    out: &mut Vec<HotspotEntry>,
) {
    let base = node.base();
    if base.visible == Some(false) {
        return;
    }
    let (x, y) = if is_screen_root {
        (0.0, 0.0)
    } else {
        (
            local_offset.0 + base.x.unwrap_or(0.0) as f32,
            local_offset.1 + base.y.unwrap_or(0.0) as f32,
        )
    };
    let (mut w, mut h) = (
        node.width_px().unwrap_or(0.0) as f32,
        node.height_px().unwrap_or(0.0) as f32,
    );
    if let PenNode::Ref(r) = node {
        if let Some((mw, mh)) = master_sizes.get(&r.target).copied() {
            if w <= 0.0 {
                w = mw;
            }
            if h <= 0.0 {
                h = mh;
            }
        }
    }

    let mut reactions = base.reactions.clone().unwrap_or_default();
    reactions.extend(derive_legacy_on_tap(node, route_to_screen));
    let behaviour_owner = interactive_components
        .contains_key(&base.id)
        .then(|| base.id.clone());

    if !reactions.is_empty() || behaviour_owner.is_some() {
        out.push(HotspotEntry {
            node_id: base.id.clone(),
            screen_id: screen_id.to_string(),
            local_rect: (x, y, w, h),
            reactions,
            behaviour_owner,
        });
    }
    if let Some(children) = node.children() {
        for child in children {
            collect_hotspots(
                child,
                screen_id,
                (x, y),
                false,
                route_to_screen,
                interactive_components,
                master_sizes,
                out,
            );
        }
    }
}

fn screen_contains_node(doc: &PenDocument, screen_id: &str, target_id: &str) -> bool {
    fn contains(node: &PenNode, id: &str) -> bool {
        node.id_str() == id
            || node
                .children()
                .is_some_and(|kids| kids.iter().any(|c| contains(c, id)))
    }
    fn find_screen<'a>(nodes: &'a [PenNode], screen_id: &str) -> Option<&'a PenNode> {
        for n in nodes {
            if n.id_str() == screen_id {
                return Some(n);
            }
            if n.base().section == Some(true) {
                if let Some(found) = n.children().and_then(|k| find_screen(k, screen_id)) {
                    return Some(found);
                }
            }
        }
        None
    }
    doc.pages
        .iter()
        .flatten()
        .find_map(|p| find_screen(&p.children, screen_id))
        .or_else(|| find_screen(&doc.children, screen_id))
        .is_some_and(|s| contains(s, target_id))
}
