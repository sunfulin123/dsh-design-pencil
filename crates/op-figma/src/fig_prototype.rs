//! Figma `.fig` (Kiwi) and REST prototype metadata mapper.
//!
//! Extracts node-level `reactions`, `overflow_direction`, `scroll_behavior`,
//! `overlay`, `section`, and `flow_starting_point`, plus page-level
//! `PagePrototype` (`flows`, `device`, `background_color`), then resolves
//! Figma GUID targets (`sessionID:localID`) to canonical `PenNode` IDs.

use crate::color::figma_color_to_hex;
use crate::figma_types::FigColor;
use crate::kiwi::FigValue;
use crate::tree::{guid_to_string, TreeNode};
use jian_ops_schema::document::PenDocument;
use jian_ops_schema::node::{PenNode, PenNodeBase};
use jian_ops_schema::prototype::{
    ActionType, DeviceRotation, FlowStartingPoint, OverflowDirection, OverlayBackgroundInteraction,
    OverlayOffset, OverlayPositionType, OverlaySettings, PagePrototype, PrototypeAction,
    PrototypeDeviceKind, PrototypeDeviceSpec, PrototypeScrollBehavior, Reaction,
};
use std::collections::{HashMap, HashSet};

mod kiwi_actions;
use kiwi_actions::{map_kiwi_interactions, map_legacy_node_transition};

/// Sentinel all-ones Kiwi GUID (`u32::MAX:u32::MAX`) meaning "no target node".
pub(super) const UNSET_GUID: &str = "4294967295:4294967295";

/// Synthetic key set by `rest_adapter` carrying raw REST `interactions` JSON.
pub(crate) const REST_REACTIONS_KEY: &str = "dshRestReactions";

/// Populate prototype fields on `base` from a decoded Kiwi (or REST-adapted)
/// node object. Target IDs stay in Figma GUID form until
/// [`resolve_document_prototype`] or [`resolve_nodes_prototype`] rewrites them.
pub(crate) fn apply_node_prototype(figma: &FigValue, base: &mut PenNodeBase) {
    if figma.get_str("type") == Some("SECTION") {
        base.section = Some(true);
    }
    base.overflow_direction = map_overflow_direction(
        figma
            .get_str("scrollDirection")
            .or_else(|| figma.get_str("overflowDirection")),
    );
    base.scroll_behavior = map_scroll_behavior(figma.get_str("scrollBehavior"));
    base.overlay = map_overlay_settings(figma);
    base.flow_starting_point = map_starting_point(figma, &base.id);
    let mut reactions = map_kiwi_interactions(figma);
    if reactions.is_empty() {
        reactions = map_rest_interactions(figma);
    }
    if reactions.is_empty() {
        reactions = map_legacy_node_transition(figma);
    }
    if !reactions.is_empty() {
        base.reactions = Some(reactions);
    }
}

fn map_overflow_direction(raw: Option<&str>) -> Option<OverflowDirection> {
    match raw? {
        "HORIZONTAL" | "HORIZONTAL_SCROLLING" => Some(OverflowDirection::Horizontal),
        "VERTICAL" | "VERTICAL_SCROLLING" => Some(OverflowDirection::Vertical),
        "BOTH" | "HORIZONTAL_AND_VERTICAL_SCROLLING" => Some(OverflowDirection::Both),
        _ => None,
    }
}

fn map_scroll_behavior(raw: Option<&str>) -> Option<PrototypeScrollBehavior> {
    match raw? {
        "FIXED_WHEN_CHILD_OF_SCROLLING_FRAME" | "FIXED" => Some(PrototypeScrollBehavior::Fixed),
        "STICKY_SCROLLS" | "STICKY" => Some(PrototypeScrollBehavior::Sticky),
        _ => None,
    }
}

fn map_overlay_settings(figma: &FigValue) -> Option<OverlaySettings> {
    let pos_raw = figma.get_str("overlayPositionType");
    let bg_int_raw = figma.get_str("overlayBackgroundInteraction");
    let bg_app = figma.get("overlayBackgroundAppearance");
    if pos_raw.is_none() && bg_int_raw.is_none() && bg_app.is_none() {
        return None;
    }
    let position_type = match pos_raw.unwrap_or("CENTER") {
        "TOP_LEFT" => OverlayPositionType::TopLeft,
        "TOP_CENTER" => OverlayPositionType::TopCenter,
        "TOP_RIGHT" => OverlayPositionType::TopRight,
        "BOTTOM_LEFT" => OverlayPositionType::BottomLeft,
        "BOTTOM_CENTER" => OverlayPositionType::BottomCenter,
        "BOTTOM_RIGHT" => OverlayPositionType::BottomRight,
        "MANUAL" => OverlayPositionType::Manual,
        _ => OverlayPositionType::Center,
    };
    let background_interaction = match bg_int_raw {
        Some("CLOSE_ON_CLICK_OUTSIDE") => Some(OverlayBackgroundInteraction::CloseOnClickOutside),
        Some("NONE") => Some(OverlayBackgroundInteraction::None),
        _ => None,
    };
    let background_color = bg_app.and_then(|app| {
        if app.get_str("backgroundType") == Some("SOLID_COLOR") {
            app.get("backgroundColor")
                .and_then(FigColor::from_value)
                .map(|c| figma_color_to_hex(&c))
        } else {
            None
        }
    });
    if position_type == OverlayPositionType::Center
        && background_interaction.is_none()
        && background_color.is_none()
    {
        return None;
    }
    Some(OverlaySettings {
        position_type,
        background_interaction,
        background_color,
    })
}

fn map_starting_point(figma: &FigValue, node_id: &str) -> Option<FlowStartingPoint> {
    let sp = figma.get("prototypeStartingPoint")?;
    let name = sp.get_str("name")?.trim();
    if name.is_empty() {
        return None;
    }
    let description = sp
        .get_str("description")
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .map(str::to_string);
    Some(FlowStartingPoint {
        node_id: node_id.to_string(),
        name: name.to_string(),
        description,
    })
}

fn map_rest_interactions(figma: &FigValue) -> Vec<Reaction> {
    let Some(json_str) = figma.get_str(REST_REACTIONS_KEY) else {
        return Vec::new();
    };
    serde_json::from_str::<Vec<Reaction>>(json_str)
        .unwrap_or_default()
        .into_iter()
        .filter(|r| !r.actions.is_empty())
        .collect()
}

pub(crate) fn has_visual_overrides(figma: &FigValue) -> bool {
    !crate::instance::own_assignments(figma).is_empty()
        || figma
            .get("symbolData")
            .and_then(|s| s.get_array("symbolOverrides"))
            .is_some_and(|ovs| {
                ovs.iter().any(|ov| {
                    ov.get_array("fillPaints").is_some_and(|p| !p.is_empty())
                        || ov.get_array("strokePaints").is_some_and(|p| !p.is_empty())
                        || ov.get("arcData").is_some()
                        || ov.get("textData").is_some()
                        || ov.get("fontSize").is_some()
                        || ov.get("overriddenSymbolID").is_some()
                        || ov
                            .get_array("prototypeInteractions")
                            .is_some_and(|interactions| !interactions.is_empty())
                        || ov
                            .get_array("componentPropAssignments")
                            .is_some_and(|assignments| !assignments.is_empty())
                })
            })
}

pub(crate) fn extract_canvas_prototype(page: &TreeNode) -> PagePrototype {
    let mut proto = PagePrototype::default();
    if let Some(dev) = page.figma.get("prototypeDevice") {
        let kind = match dev.get_str("type").unwrap_or("NONE") {
            "PRESET" => PrototypeDeviceKind::Preset,
            "CUSTOM" => PrototypeDeviceKind::Custom,
            "PRESENTATION" => PrototypeDeviceKind::Presentation,
            _ => PrototypeDeviceKind::None,
        };
        if kind != PrototypeDeviceKind::None {
            let size = dev.get("size").and_then(|s| {
                Some(OverlayOffset {
                    x: s.get_f64("x")?,
                    y: s.get_f64("y")?,
                })
            });
            let rotation = match dev.get_str("rotation") {
                Some("CCW_90" | "90_CCW") => Some(DeviceRotation::Ccw90),
                Some("NONE") => Some(DeviceRotation::None),
                _ => None,
            };
            proto.device = Some(PrototypeDeviceSpec {
                kind,
                size,
                preset_identifier: dev.get_str("presetIdentifier").map(str::to_string),
                rotation,
            });
        }
    }
    if let Some(bg) = page
        .figma
        .get("prototypeBackgroundColor")
        .and_then(FigColor::from_value)
    {
        proto.background_color = Some(figma_color_to_hex(&bg));
    }
    if let Some(start_guid) = page
        .figma
        .get("prototypeStartNodeID")
        .and_then(guid_to_string)
        .filter(|g| !g.is_empty() && g != UNSET_GUID)
    {
        proto.flows.push(FlowStartingPoint {
            node_id: start_guid,
            name: "Flow 1".to_string(),
            description: None,
        });
    }
    proto
}

/// Resolve Figma GUIDs in node reactions and page flows against converted
/// `PenNode`s, pruning dangling or internal-only symbol targets.
pub(crate) fn resolve_document_prototype(doc: &mut PenDocument, figma_pages: &[&TreeNode]) {
    let mut figma_to_pen: HashMap<String, String> = HashMap::new();
    let mut valid_pen_ids: HashSet<String> = HashSet::new();
    if let Some(pages) = doc.pages.as_ref() {
        for page in pages {
            index_nodes(&page.children, &mut figma_to_pen, &mut valid_pen_ids);
        }
    }
    index_nodes(&doc.children, &mut figma_to_pen, &mut valid_pen_ids);

    let mut doc_proto = doc.prototype.take().unwrap_or_default();
    if let Some(pages) = doc.pages.as_mut() {
        for (i, page) in pages.iter_mut().enumerate() {
            let mut page_flows = Vec::new();
            rewrite_nodes(
                &mut page.children,
                &figma_to_pen,
                &valid_pen_ids,
                &mut page_flows,
            );
            let mut p_proto = figma_pages
                .get(i)
                .map(|fp| extract_canvas_prototype(fp))
                .unwrap_or_default();
            for flow in &mut p_proto.flows {
                if let Some(mapped) = figma_to_pen.get(&flow.node_id) {
                    flow.node_id = mapped.clone();
                }
            }
            p_proto.flows.retain(|f| valid_pen_ids.contains(&f.node_id));
            for flow in page_flows {
                if !p_proto.flows.iter().any(|f| f.node_id == flow.node_id) {
                    p_proto.flows.push(flow);
                }
            }
            if i == 0 {
                if doc_proto.device.is_none() {
                    doc_proto.device = p_proto.device.clone();
                }
                if doc_proto.background_color.is_none() {
                    doc_proto.background_color = p_proto.background_color.clone();
                }
            }
            for flow in &p_proto.flows {
                if !doc_proto.flows.iter().any(|f| f.node_id == flow.node_id) {
                    doc_proto.flows.push(flow.clone());
                }
            }
            if !p_proto.is_empty() {
                doc_proto.pages.insert(page.id.clone(), p_proto);
            }
        }
    } else {
        let mut flows = Vec::new();
        rewrite_nodes(&mut doc.children, &figma_to_pen, &valid_pen_ids, &mut flows);
        for flow in flows {
            if !doc_proto.flows.iter().any(|f| f.node_id == flow.node_id) {
                doc_proto.flows.push(flow);
            }
        }
    }
    if !doc_proto.is_empty() {
        doc.prototype = Some(doc_proto);
    }
}

pub(crate) fn resolve_nodes_prototype(nodes: &mut [PenNode]) {
    let mut figma_to_pen: HashMap<String, String> = HashMap::new();
    let mut valid_pen_ids: HashSet<String> = HashSet::new();
    index_nodes(nodes, &mut figma_to_pen, &mut valid_pen_ids);
    let mut flows = Vec::new();
    rewrite_nodes(nodes, &figma_to_pen, &valid_pen_ids, &mut flows);
}

fn index_nodes(
    nodes: &[PenNode],
    figma_to_pen: &mut HashMap<String, String>,
    valid_pen_ids: &mut HashSet<String>,
) {
    for node in nodes {
        let base = node.node_base();
        valid_pen_ids.insert(base.id.clone());
        if let Some(fid) = base.figma_node_id.as_ref() {
            figma_to_pen
                .entry(fid.clone())
                .or_insert_with(|| base.id.clone());
        }
        if let Some(children) = node.children_ref() {
            index_nodes(children, figma_to_pen, valid_pen_ids);
        }
    }
}

fn rewrite_nodes(
    nodes: &mut [PenNode],
    figma_to_pen: &HashMap<String, String>,
    valid_pen_ids: &HashSet<String>,
    flows: &mut Vec<FlowStartingPoint>,
) {
    for node in nodes {
        let base = node.node_base_mut();
        let pen_id = base.id.clone();
        if let Some(sp) = base.flow_starting_point.as_mut() {
            sp.node_id = pen_id;
            flows.push(sp.clone());
        }
        if let Some(mut reactions) = base.reactions.take() {
            for reaction in &mut reactions {
                rewrite_actions(&mut reaction.actions, figma_to_pen, valid_pen_ids);
            }
            reactions.retain(|r| !r.actions.is_empty());
            if !reactions.is_empty() {
                base.reactions = Some(reactions);
            }
        }
        if let Some(children) = node.children_mut_slice() {
            rewrite_nodes(children, figma_to_pen, valid_pen_ids, flows);
        }
    }
}

fn rewrite_actions(
    actions: &mut Vec<PrototypeAction>,
    figma_to_pen: &HashMap<String, String>,
    valid_pen_ids: &HashSet<String>,
) {
    actions.retain_mut(|act| {
        for block in &mut act.conditional_blocks {
            rewrite_actions(&mut block.actions, figma_to_pen, valid_pen_ids);
        }
        act.conditional_blocks.retain(|b| !b.actions.is_empty());
        if act.kind == ActionType::Conditional {
            return !act.conditional_blocks.is_empty();
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
            let Some(dst) = act.destination_id.as_ref() else {
                return false;
            };
            if let Some(mapped) = figma_to_pen.get(dst) {
                act.destination_id = Some(mapped.clone());
                return true;
            }
            return valid_pen_ids.contains(dst);
        }
        true
    });
}

#[cfg(test)]
#[path = "fig_prototype_tests.rs"]
mod tests;
