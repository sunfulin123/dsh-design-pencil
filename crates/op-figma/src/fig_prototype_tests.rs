use super::*;
use crate::figma_types::FigmaDecodedFile;
use crate::node_mapper::figma_all_pages_to_pen_document;
use crate::rest_adapter::{convert_rest_nodes, RestImportOptions};
use crate::FigLayoutMode;
use jian_ops_schema::prototype::PrototypeTransitionType;
use op_editor_core::pen_node_ext::PenNodeExt;
use serde_json::json;

fn guid_val(session: u32, local: u32) -> FigValue {
    FigValue::Object(vec![
        ("sessionID".into(), FigValue::Uint(session)),
        ("localID".into(), FigValue::Uint(local)),
    ])
}

fn obj(pairs: Vec<(&str, FigValue)>) -> FigValue {
    FigValue::Object(pairs.into_iter().map(|(k, v)| (k.into(), v)).collect())
}

#[test]
fn kiwi_section_flows_reactions_and_override_interactions_import_and_resolve_ids() {
    let decoded = FigmaDecodedFile {
        node_changes: vec![
            obj(vec![
                ("guid", guid_val(0, 0)),
                ("type", FigValue::Str("DOCUMENT".into())),
            ]),
            obj(vec![
                ("guid", guid_val(0, 1)),
                ("type", FigValue::Str("CANVAS".into())),
                ("name", FigValue::Str("Page 1".into())),
                (
                    "parentIndex",
                    obj(vec![
                        ("guid", guid_val(0, 0)),
                        ("position", FigValue::Str("!".into())),
                    ]),
                ),
                (
                    "prototypeDevice",
                    obj(vec![
                        ("type", FigValue::Str("PRESET".into())),
                        ("presetIdentifier", FigValue::Str("IPHONE_15".into())),
                        (
                            "size",
                            obj(vec![
                                ("x", FigValue::Float(393.0)),
                                ("y", FigValue::Float(852.0)),
                            ]),
                        ),
                    ]),
                ),
            ]),
            // A SECTION container on Page 1
            obj(vec![
                ("guid", guid_val(1, 10)),
                ("type", FigValue::Str("SECTION".into())),
                ("name", FigValue::Str("Main Section".into())),
                (
                    "parentIndex",
                    obj(vec![
                        ("guid", guid_val(0, 1)),
                        ("position", FigValue::Str("!".into())),
                    ]),
                ),
                (
                    "size",
                    obj(vec![
                        ("x", FigValue::Float(1000.0)),
                        ("y", FigValue::Float(900.0)),
                    ]),
                ),
            ]),
            // Screen 1 inside SECTION with prototypeStartingPoint + click -> Screen 2
            obj(vec![
                ("guid", guid_val(1, 11)),
                ("type", FigValue::Str("FRAME".into())),
                ("name", FigValue::Str("Screen 1".into())),
                ("scrollDirection", FigValue::Str("VERTICAL".into())),
                (
                    "prototypeStartingPoint",
                    obj(vec![
                        ("name", FigValue::Str("Play".into())),
                        ("description", FigValue::Str("Entry".into())),
                    ]),
                ),
                (
                    "prototypeInteractions",
                    FigValue::Array(vec![obj(vec![
                        (
                            "event",
                            obj(vec![("interactionType", FigValue::Str("ON_CLICK".into()))]),
                        ),
                        (
                            "actions",
                            FigValue::Array(vec![
                                obj(vec![
                                    ("connectionType", FigValue::Str("INTERNAL_NODE".into())),
                                    ("navigationType", FigValue::Str("NAVIGATE".into())),
                                    ("transitionNodeID", guid_val(1, 12)),
                                    ("transitionType", FigValue::Str("SMART_ANIMATE".into())),
                                    ("transitionDuration", FigValue::Float(0.3)),
                                    ("easingType", FigValue::Str("INOUT_CUBIC".into())),
                                ]),
                                // Dangling action to unset GUID should be pruned
                                obj(vec![
                                    ("connectionType", FigValue::Str("INTERNAL_NODE".into())),
                                    ("navigationType", FigValue::Str("NAVIGATE".into())),
                                    ("transitionNodeID", guid_val(u32::MAX, u32::MAX)),
                                ]),
                            ]),
                        ),
                    ])]),
                ),
                (
                    "parentIndex",
                    obj(vec![
                        ("guid", guid_val(1, 10)),
                        ("position", FigValue::Str("!".into())),
                    ]),
                ),
                (
                    "size",
                    obj(vec![
                        ("x", FigValue::Float(393.0)),
                        ("y", FigValue::Float(852.0)),
                    ]),
                ),
            ]),
            // Screen 2 inside SECTION
            obj(vec![
                ("guid", guid_val(1, 12)),
                ("type", FigValue::Str("FRAME".into())),
                ("name", FigValue::Str("Screen 2".into())),
                (
                    "parentIndex",
                    obj(vec![
                        ("guid", guid_val(1, 10)),
                        ("position", FigValue::Str("\"".into())),
                    ]),
                ),
                (
                    "size",
                    obj(vec![
                        ("x", FigValue::Float(393.0)),
                        ("y", FigValue::Float(852.0)),
                    ]),
                ),
            ]),
        ],
        blobs: Vec::new(),
        image_files: Default::default(),
    };
    let result = figma_all_pages_to_pen_document(decoded, "ProtoTest", FigLayoutMode::Preserve);
    let page = &result.document.pages.as_ref().unwrap()[0];
    let section = &page.children[0];
    assert_eq!(section.base().section, Some(true));
    let children = section.children_ref().unwrap();
    let screen1 = children
        .iter()
        .find(|n| n.base().name.as_deref() == Some("Screen 1"))
        .expect("Screen 1");
    let screen2 = children
        .iter()
        .find(|n| n.base().name.as_deref() == Some("Screen 2"))
        .expect("Screen 2");
    assert_eq!(
        screen1.base().overflow_direction,
        Some(OverflowDirection::Vertical)
    );
    let sp = screen1.base().flow_starting_point.as_ref().expect("flow");
    assert_eq!(sp.name, "Play");
    assert_eq!(sp.node_id, screen1.base().id);
    let reactions = screen1.base().reactions.as_ref().expect("reactions");
    assert_eq!(reactions.len(), 1);
    assert_eq!(reactions[0].actions.len(), 1, "unset target must be pruned");
    assert_eq!(
        reactions[0].actions[0].destination_id.as_deref(),
        Some(screen2.base().id.as_str())
    );
    assert_eq!(
        reactions[0].actions[0].transition.as_ref().unwrap().kind,
        PrototypeTransitionType::SmartAnimate
    );
    let doc_proto = result.document.prototype.as_ref().expect("doc prototype");
    assert_eq!(doc_proto.flows.len(), 1);
    assert_eq!(doc_proto.flows[0].node_id, screen1.base().id);
    assert_eq!(
        doc_proto
            .device
            .as_ref()
            .and_then(|d| d.preset_identifier.as_deref()),
        Some("IPHONE_15")
    );
}

#[test]
fn rest_adapter_maps_section_overflow_scroll_behavior_flows_and_reactions() {
    let canvas = json!({
        "id": "0:1",
        "type": "CANVAS",
        "name": "Page 1",
        "flowStartingPoints": [{"nodeId": "1:2", "name": "Checkout Flow"}],
        "children": [
            {
                "id": "1:1",
                "type": "SECTION",
                "name": "Checkout Section",
                "absoluteBoundingBox": {"x": 0.0, "y": 0.0, "width": 900.0, "height": 600.0},
                "children": [
                    {
                        "id": "1:2",
                        "type": "FRAME",
                        "name": "Cart",
                        "overflowDirection": "VERTICAL_SCROLLING",
                        "absoluteBoundingBox": {"x": 0.0, "y": 0.0, "width": 390.0, "height": 844.0},
                        "children": [
                            {
                                "id": "1:4",
                                "type": "FRAME",
                                "name": "Sticky Header",
                                "scrollBehavior": "STICKY_SCROLLS",
                                "absoluteBoundingBox": {"x": 0.0, "y": 0.0, "width": 390.0, "height": 56.0},
                                "interactions": [{
                                    "trigger": {"type": "ON_CLICK"},
                                    "actions": [{
                                        "type": "NODE",
                                        "destinationId": "1:3",
                                        "navigation": "NAVIGATE",
                                        "transition": {"type": "DISSOLVE", "duration": 0.25, "easing": {"type": "EASE_OUT"}}
                                    }]
                                }]
                            }
                        ]
                    },
                    {
                        "id": "1:3",
                        "type": "FRAME",
                        "name": "Payment",
                        "absoluteBoundingBox": {"x": 450.0, "y": 0.0, "width": 390.0, "height": 844.0}
                    }
                ]
            }
        ]
    });
    let res = convert_rest_nodes(&[canvas], &RestImportOptions::default());
    assert_eq!(res.nodes.len(), 1);
    let section = &res.nodes[0];
    assert_eq!(section.base().section, Some(true));
    let section_kids = op_editor_core::pen_node_ext::PenNodeExt::children(section).unwrap();
    // REST children are reversed to topmost-first: Payment is index 0, Cart is index 1
    let payment = &section_kids[0];
    let cart = &section_kids[1];
    assert_eq!(
        cart.base().overflow_direction,
        Some(OverflowDirection::Vertical)
    );
    assert_eq!(
        cart.base()
            .flow_starting_point
            .as_ref()
            .map(|f| f.name.as_str()),
        Some("Checkout Flow")
    );
    let header = &op_editor_core::pen_node_ext::PenNodeExt::children(cart).unwrap()[0];
    assert_eq!(
        header.base().scroll_behavior,
        Some(PrototypeScrollBehavior::Sticky)
    );
    let dst = header.base().reactions.as_ref().unwrap()[0].actions[0]
        .destination_id
        .as_deref();
    assert_eq!(dst, Some(payment.base().id.as_str()));
}
