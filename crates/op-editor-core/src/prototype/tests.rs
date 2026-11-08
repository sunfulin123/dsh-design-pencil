use super::*;
use jian_ops_schema::prototype::{PrototypeTransitionType, TransitionDirection};
use jian_ops_schema::PenDocument;
use serde_json::json;

fn parse_doc(value: serde_json::Value) -> PenDocument {
    serde_json::from_value(value).expect("valid PenDocument")
}

#[test]
fn section_expansion_and_entry_priority_match_figma() {
    let doc = parse_doc(json!({
        "version": "1.0",
        "children": [
            {
                "type": "frame",
                "id": "sec1",
                "name": "Checkout Section",
                "section": true,
                "x": 100.0,
                "y": 50.0,
                "width": 1200.0,
                "height": 900.0,
                "children": [
                    {
                        "type": "frame",
                        "id": "screen_b",
                        "name": "Payment",
                        "x": 500.0,
                        "y": 0.0,
                        "width": 390.0,
                        "height": 844.0,
                        "flowStartingPoint": {
                            "nodeId": "screen_b",
                            "name": "Payment Flow"
                        }
                    },
                    {
                        "type": "frame",
                        "id": "screen_a",
                        "name": "Cart",
                        "x": 0.0,
                        "y": 0.0,
                        "width": 390.0,
                        "height": 844.0,
                        "children": [
                            {"type": "rectangle", "id": "btn_in_a", "x": 10.0, "y": 10.0, "width": 80.0, "height": 32.0}
                        ]
                    }
                ]
            }
        ]
    }));

    // 1. Without selection, flow starting point ("screen_b") wins over reading order ("screen_a")
    let player = PrototypePlayer::enter(&doc, 0, None, (0.0, 0.0), 0).expect("enter");
    assert_eq!(player.screens().len(), 2);
    assert_eq!(player.screens()[0].id, "screen_a");
    assert_eq!(player.screens()[1].id, "screen_b");
    assert_eq!(player.current_screen_id, "screen_b");

    // 2. With a descendant inside "screen_a" selected, "screen_a" wins
    let player_sel =
        PrototypePlayer::enter(&doc, 0, Some("btn_in_a"), (0.0, 0.0), 0).expect("enter");
    assert_eq!(player_sel.current_screen_id, "screen_a");
}

#[test]
fn navigate_overlay_swap_back_smart_animate_and_timeout_work_end_to_end() {
    let doc = parse_doc(json!({
        "version": "1.0",
        "children": [
            {
                "type": "frame",
                "id": "s1",
                "name": "Home",
                "x": 0.0,
                "y": 0.0,
                "width": 390.0,
                "height": 844.0,
                "children": [
                    {
                        "type": "rectangle",
                        "id": "hero_card",
                        "name": "Hero",
                        "x": 20.0,
                        "y": 40.0,
                        "width": 350.0,
                        "height": 180.0,
                        "reactions": [{
                            "trigger": {"type": "ON_CLICK"},
                            "actions": [{
                                "type": "NODE",
                                "destinationId": "s2",
                                "navigation": "NAVIGATE",
                                "transition": {
                                    "type": "SMART_ANIMATE",
                                    "duration": 0.3,
                                    "direction": "LEFT",
                                    "easing": {"type": "EASE_IN_AND_OUT"}
                                }
                            }]
                        }]
                    },
                    {
                        "type": "rectangle",
                        "id": "open_modal",
                        "name": "Open Modal",
                        "x": 20.0,
                        "y": 260.0,
                        "width": 120.0,
                        "height": 40.0,
                        "reactions": [{
                            "trigger": {"type": "ON_CLICK"},
                            "actions": [{
                                "type": "OVERLAY",
                                "destinationId": "modal_1"
                            }]
                        }]
                    }
                ]
            },
            {
                "type": "frame",
                "id": "s2",
                "name": "Details",
                "x": 450.0,
                "y": 0.0,
                "width": 390.0,
                "height": 844.0,
                "reactions": [{
                    "trigger": {"type": "AFTER_TIMEOUT", "timeout": 0.5},
                    "actions": [{"type": "SET_VARIABLE", "variableId": "--visited", "variableValue": true}]
                }],
                "children": [
                    {
                        "type": "rectangle",
                        "id": "hero_card_2",
                        "name": "Hero",
                        "x": 0.0,
                        "y": 0.0,
                        "width": 390.0,
                        "height": 320.0
                    }
                ]
            },
            {
                "type": "frame",
                "id": "modal_1",
                "name": "Modal",
                "x": 900.0,
                "y": 0.0,
                "width": 300.0,
                "height": 200.0,
                "overlay": {
                    "positionType": "CENTER",
                    "backgroundInteraction": "CLOSE_ON_CLICK_OUTSIDE"
                }
            }
        ]
    }));

    let mut player = PrototypePlayer::enter(&doc, 0, Some("s1"), (0.0, 0.0), 100).unwrap();
    // Open overlay and close by clicking outside
    assert!(player.click_node("open_modal", 110));
    assert_eq!(player.overlays.len(), 1);
    assert_eq!(player.overlays[0].screen_id, "modal_1");
    assert!(player.pointer_up(5.0, 5.0, 120));
    assert!(player.overlays.is_empty());

    // Click hero_card -> Navigate to s2 with Smart Animate
    assert!(player.pointer_down(40.0, 60.0, 200));
    assert!(player.pointer_up(40.0, 60.0, 210));
    assert_eq!(player.current_screen_id, "s2");

    let tf = player
        .current_transition_frame(360)
        .expect("mid-transition at 150ms");
    assert_eq!(tf.kind, PrototypeTransitionType::SmartAnimate);
    assert_eq!(tf.smart_layers.len(), 1);
    assert_eq!(tf.smart_layers[0].path_key, "Hero");
    assert!(tf.smart_layers[0].current.rect.3 > 180.0 && tf.smart_layers[0].current.rect.3 < 320.0);

    // Tick past 500ms timeout on s2 -> sets variable `--visited`
    player.tick(800);
    assert_eq!(
        player.variable_overrides.get("--visited"),
        Some(&json!(true))
    );

    // Back reverses direction and returns to s1
    assert!(player.back(850));
    assert_eq!(player.current_screen_id, "s1");
    let back_tf = player.current_transition_frame(900).unwrap();
    assert_eq!(back_tf.direction, Some(TransitionDirection::Right));
}

#[test]
fn component_behaviour_and_legacy_on_tap_work_without_jian_runtime() {
    let doc = parse_doc(json!({
        "version": "1.0",
        "children": [
            {
                "type": "frame",
                "id": "board",
                "name": "Main",
                "screen": "/",
                "x": 0.0,
                "y": 0.0,
                "width": 500.0,
                "height": 300.0,
                "children": [
                    {
                        "type": "frame",
                        "id": "toggle",
                        "reusable": true,
                        "x": 0.0,
                        "y": 0.0,
                        "width": 120.0,
                        "height": 40.0,
                        "componentDesign": {
                            "properties": {
                                "checked": {
                                    "kind": "boolean",
                                    "targetId": "indicator",
                                    "default": false
                                }
                            },
                            "behaviour": {
                                "kind": "checkbox",
                                "defaultValue": false,
                                "stateBindings": [{"type": "property", "propertyId": "checked"}]
                            }
                        },
                        "children": [
                            {"type": "rectangle", "id": "indicator", "width": 20.0, "height": 20.0, "visible": false}
                        ]
                    },
                    {
                        "type": "ref",
                        "id": "instance",
                        "ref": "toggle",
                        "x": 150.0,
                        "y": 10.0,
                        "width": 120.0,
                        "height": 40.0
                    },
                    {
                        "type": "frame",
                        "id": "legacy_btn",
                        "x": 10.0,
                        "y": 100.0,
                        "width": 100.0,
                        "height": 40.0,
                        "events": {
                            "onTap": [{"type": "navigate", "to": "/next"}]
                        }
                    }
                ]
            },
            {
                "type": "frame",
                "id": "board_2",
                "name": "Next",
                "screen": "/next",
                "x": 600.0,
                "y": 0.0,
                "width": 500.0,
                "height": 300.0
            }
        ]
    }));

    let mut player = PrototypePlayer::enter(&doc, 0, None, (0.0, 0.0), 0).unwrap();
    assert_eq!(
        player.property_overrides.get("instance__indicator"),
        Some(&PropertyOverrideValue::Visible(false))
    );
    // Click instance at (175, 20)
    player.pointer_down(175.0, 20.0, 10);
    player.pointer_up(175.0, 20.0, 20);
    assert_eq!(
        player.property_overrides.get("instance__indicator"),
        Some(&PropertyOverrideValue::Visible(true))
    );
    assert_eq!(
        player.property_overrides.get("indicator"),
        Some(&PropertyOverrideValue::Visible(false))
    );

    // Click legacy onTap button -> navigates to board_2
    let report = player.simulate(&[SimulateStep::Click {
        node_id: Some("legacy_btn".into()),
        x: None,
        y: None,
    }]);
    assert_eq!(report.current_screen_id, "board_2");
    assert_eq!(report.visited_screens, vec!["board", "board_2"]);
}
