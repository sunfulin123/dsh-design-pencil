//! Kiwi `PrototypeInteraction`, `PrototypeEvent`, `PrototypeAction`, and
//! `TransitionType` / `EasingType` mappers.

use super::UNSET_GUID;
use crate::kiwi::FigValue;
use crate::tree::guid_to_string;
use jian_ops_schema::prototype::{
    ActionType, ConditionalBlock, EasingKind, OverlayOffset, PrototypeAction, PrototypeEasing,
    PrototypeNavigation, PrototypeTransition, PrototypeTransitionType, Reaction,
    TransitionDirection, Trigger, TriggerType,
};

pub(super) fn map_kiwi_interactions(figma: &FigValue) -> Vec<Reaction> {
    let Some(items) = figma.get_array("prototypeInteractions") else {
        return Vec::new();
    };
    items
        .iter()
        .filter(|item| item.get_bool("isDeleted") != Some(true))
        .filter_map(|item| {
            let trigger = item.get("event").and_then(map_kiwi_trigger)?;
            let actions: Vec<PrototypeAction> = item
                .get_array("actions")
                .unwrap_or(&[])
                .iter()
                .filter_map(map_kiwi_action)
                .collect();
            (!actions.is_empty()).then_some(Reaction {
                trigger: Some(trigger),
                actions,
            })
        })
        .collect()
}

pub(super) fn map_legacy_node_transition(figma: &FigValue) -> Vec<Reaction> {
    let dst = figma
        .get("transitionNodeID")
        .and_then(guid_to_string)
        .or_else(|| figma.get_str("transitionNodeID").map(str::to_string));
    let Some(dst) = dst.filter(|d| !d.is_empty() && d != UNSET_GUID) else {
        return Vec::new();
    };
    let transition = map_kiwi_transition(figma);
    vec![Reaction {
        trigger: Some(Trigger::on_click()),
        actions: vec![PrototypeAction::node_nav(
            dst,
            PrototypeNavigation::Navigate,
            transition,
        )],
    }]
}

fn map_kiwi_trigger(event: &FigValue) -> Option<Trigger> {
    let kind = match event.get_str("interactionType")? {
        "ON_CLICK" => TriggerType::OnClick,
        "ON_HOVER" => TriggerType::OnHover,
        "ON_PRESS" => TriggerType::OnPress,
        "DRAG" | "ON_DRAG" => TriggerType::OnDrag,
        "AFTER_TIMEOUT" => TriggerType::AfterTimeout,
        "MOUSE_IN" | "MOUSE_ENTER" => TriggerType::MouseEnter,
        "MOUSE_OUT" | "MOUSE_LEAVE" => TriggerType::MouseLeave,
        "MOUSE_UP" => TriggerType::MouseUp,
        "MOUSE_DOWN" => TriggerType::MouseDown,
        "ON_KEY_DOWN" => TriggerType::OnKeyDown,
        _ => return None,
    };
    let timeout = (kind == TriggerType::AfterTimeout)
        .then(|| {
            event
                .get_f64("transitionTimeout")
                .or_else(|| event.get_f64("interactionDuration"))
        })
        .flatten()
        .filter(|v| v.is_finite() && *v >= 0.0);
    let delay = matches!(
        kind,
        TriggerType::MouseEnter
            | TriggerType::MouseLeave
            | TriggerType::MouseUp
            | TriggerType::MouseDown
    )
    .then(|| {
        event
            .get_f64("interactionDuration")
            .or_else(|| event.get_f64("transitionTimeout"))
    })
    .flatten()
    .filter(|v| v.is_finite() && *v > 0.0);
    let (key_codes, device) = match event.get("keyTrigger") {
        Some(kt) => {
            let codes = kt
                .get_array("keyCodes")
                .unwrap_or(&[])
                .iter()
                .filter_map(|v| v.as_f64().map(|n| n as u32))
                .collect();
            let dev = kt.get_str("triggerDevice").map(str::to_string);
            (codes, dev)
        }
        None => (Vec::new(), None),
    };
    Some(Trigger {
        kind,
        timeout,
        delay,
        key_codes,
        device,
    })
}

fn map_kiwi_action(act: &FigValue) -> Option<PrototypeAction> {
    let conn = act.get_str("connectionType").unwrap_or("INTERNAL_NODE");
    match conn {
        "NONE" => None,
        "BACK" => Some(simple_action(ActionType::Back)),
        "CLOSE" => Some(simple_action(ActionType::Close)),
        "URL" => {
            let url = act.get_str("connectionURL")?.trim();
            if url.is_empty() {
                return None;
            }
            let mut out = simple_action(ActionType::Url);
            out.url = Some(url.to_string());
            out.open_in_new_tab = act.get_bool("openUrlInNewTab");
            Some(out)
        }
        "SET_VARIABLE" => {
            let var_id = act
                .get("targetVariable")
                .and_then(|tv| tv.get("id"))
                .and_then(guid_to_string)
                .or_else(|| act.get("targetVariableID").and_then(guid_to_string))?;
            if var_id == UNSET_GUID {
                return None;
            }
            let mut out = simple_action(ActionType::SetVariable);
            out.variable_id = Some(var_id);
            Some(out)
        }
        "SET_VARIABLE_MODE" => {
            let col_id = act
                .get_str("targetVariableSetKey")
                .map(str::to_string)
                .or_else(|| {
                    act.get("targetVariableSetID")
                        .and_then(|v| v.get("guid"))
                        .and_then(guid_to_string)
                });
            let mode_id = act.get("targetVariableModeID").and_then(guid_to_string);
            let mut out = simple_action(ActionType::SetVariableMode);
            out.variable_collection_id = col_id;
            out.variable_mode_id = mode_id;
            Some(out)
        }
        "CONDITIONAL" => {
            let blocks: Vec<ConditionalBlock> = act
                .get_array("conditionalActions")
                .unwrap_or(&[])
                .iter()
                .map(|b| ConditionalBlock {
                    condition: None,
                    actions: b
                        .get_array("actions")
                        .unwrap_or(&[])
                        .iter()
                        .filter_map(map_kiwi_action)
                        .collect(),
                })
                .filter(|b| !b.actions.is_empty())
                .collect();
            (!blocks.is_empty()).then(|| {
                let mut out = simple_action(ActionType::Conditional);
                out.conditional_blocks = blocks;
                out
            })
        }
        "INTERNAL_NODE" => {
            let dst = act.get("transitionNodeID").and_then(guid_to_string)?;
            if dst.is_empty() || dst == UNSET_GUID {
                return None;
            }
            let navigation = match act.get_str("navigationType").unwrap_or("NAVIGATE") {
                "OVERLAY" => PrototypeNavigation::Overlay,
                "SWAP" => PrototypeNavigation::Swap,
                "SWAP_STATE" | "CHANGE_TO" => PrototypeNavigation::ChangeTo,
                "SCROLL_TO" => PrototypeNavigation::ScrollTo,
                _ => PrototypeNavigation::Navigate,
            };
            let transition = map_kiwi_transition(act);
            let overlay_relative_position = act.get("overlayRelativePosition").and_then(|v| {
                Some(OverlayOffset {
                    x: v.get_f64("x")?,
                    y: v.get_f64("y")?,
                })
            });
            Some(PrototypeAction {
                kind: ActionType::Node,
                destination_id: Some(dst),
                navigation: Some(navigation),
                transition,
                preserve_scroll_position: act.get_bool("transitionPreserveScroll"),
                reset_scroll_position: act.get_bool("transitionResetScrollPosition"),
                reset_video_position: act.get_bool("transitionResetVideoPosition"),
                reset_interactive_components: act.get_bool("transitionResetInteractiveComponents"),
                overlay_relative_position,
                url: None,
                open_in_new_tab: None,
                variable_id: None,
                variable_value: None,
                variable_collection_id: None,
                variable_mode_id: None,
                conditional_blocks: Vec::new(),
            })
        }
        _ => None,
    }
}

fn map_kiwi_transition(act: &FigValue) -> Option<PrototypeTransition> {
    let raw_ty = act.get_str("transitionType");
    let smart = act.get_bool("transitionShouldSmartAnimate") == Some(true);
    if raw_ty.is_none() && !smart {
        return None;
    }
    let (mut kind, direction) = parse_transition_type(raw_ty.unwrap_or("INSTANT_TRANSITION"));
    if smart && kind == PrototypeTransitionType::Instant {
        kind = PrototypeTransitionType::SmartAnimate;
    }
    let duration = act
        .get_f64("transitionDuration")
        .filter(|d| d.is_finite() && *d >= 0.0);
    let easing = act
        .get_str("easingType")
        .map(|et| parse_easing(et, act.get_array("easingFunction")));
    Some(PrototypeTransition {
        kind,
        direction,
        duration,
        easing,
        match_layers: smart.then_some(true),
    })
}

fn parse_transition_type(raw: &str) -> (PrototypeTransitionType, Option<TransitionDirection>) {
    use PrototypeTransitionType::*;
    use TransitionDirection::*;
    match raw {
        "DISSOLVE" | "FADE" => (Dissolve, None),
        "SMART_ANIMATE" | "MAGIC_MOVE" => (SmartAnimate, None),
        "SCROLL_ANIMATE" => (ScrollAnimate, None),
        "SLIDE_FROM_LEFT" => (SlideIn, Some(Left)),
        "SLIDE_FROM_RIGHT" => (SlideIn, Some(Right)),
        "SLIDE_FROM_TOP" => (SlideIn, Some(Top)),
        "SLIDE_FROM_BOTTOM" => (SlideIn, Some(Bottom)),
        "SLIDE_OUT_TO_LEFT" => (SlideOut, Some(Left)),
        "SLIDE_OUT_TO_RIGHT" => (SlideOut, Some(Right)),
        "SLIDE_OUT_TO_TOP" => (SlideOut, Some(Top)),
        "SLIDE_OUT_TO_BOTTOM" => (SlideOut, Some(Bottom)),
        "PUSH_FROM_LEFT" => (Push, Some(Left)),
        "PUSH_FROM_RIGHT" => (Push, Some(Right)),
        "PUSH_FROM_TOP" => (Push, Some(Top)),
        "PUSH_FROM_BOTTOM" => (Push, Some(Bottom)),
        "MOVE_FROM_LEFT" => (MoveIn, Some(Left)),
        "MOVE_FROM_RIGHT" => (MoveIn, Some(Right)),
        "MOVE_FROM_TOP" => (MoveIn, Some(Top)),
        "MOVE_FROM_BOTTOM" => (MoveIn, Some(Bottom)),
        "MOVE_OUT_TO_LEFT" => (MoveOut, Some(Left)),
        "MOVE_OUT_TO_RIGHT" => (MoveOut, Some(Right)),
        "MOVE_OUT_TO_TOP" => (MoveOut, Some(Top)),
        "MOVE_OUT_TO_BOTTOM" => (MoveOut, Some(Bottom)),
        _ => (Instant, None),
    }
}

fn parse_easing(et: &str, bezier_arr: Option<&[FigValue]>) -> PrototypeEasing {
    let kind = match et {
        "IN_CUBIC" | "EASE_IN" => EasingKind::EaseIn,
        "OUT_CUBIC" | "EASE_OUT" => EasingKind::EaseOut,
        "INOUT_CUBIC" | "EASE_IN_AND_OUT" => EasingKind::EaseInAndOut,
        "IN_BACK_CUBIC" | "EASE_IN_BACK" => EasingKind::EaseInBack,
        "OUT_BACK_CUBIC" | "EASE_OUT_BACK" => EasingKind::EaseOutBack,
        "INOUT_BACK_CUBIC" | "EASE_IN_AND_OUT_BACK" => EasingKind::EaseInAndOutBack,
        "CUSTOM_CUBIC" | "CUSTOM_CUBIC_BEZIER" => EasingKind::CustomCubicBezier,
        "GENTLE_SPRING" | "GENTLE" => EasingKind::Gentle,
        "SPRING" | "SPRING_PRESET_ONE" | "QUICK" => EasingKind::Quick,
        "SPRING_PRESET_TWO" | "BOUNCY" => EasingKind::Bouncy,
        "SPRING_PRESET_THREE" | "SLOW" => EasingKind::Slow,
        "CUSTOM_SPRING" => EasingKind::CustomSpring,
        _ => EasingKind::Linear,
    };
    let bezier = bezier_arr.and_then(|arr| {
        (arr.len() >= 4).then(|| {
            Some([
                arr[0].as_f64()?,
                arr[1].as_f64()?,
                arr[2].as_f64()?,
                arr[3].as_f64()?,
            ])
        })?
    });
    PrototypeEasing { kind, bezier }
}

fn simple_action(kind: ActionType) -> PrototypeAction {
    PrototypeAction {
        kind,
        destination_id: None,
        navigation: None,
        transition: None,
        preserve_scroll_position: None,
        reset_scroll_position: None,
        reset_video_position: None,
        reset_interactive_components: None,
        overlay_relative_position: None,
        url: None,
        open_in_new_tab: None,
        variable_id: None,
        variable_value: None,
        variable_collection_id: None,
        variable_mode_id: None,
        conditional_blocks: Vec::new(),
    }
}
