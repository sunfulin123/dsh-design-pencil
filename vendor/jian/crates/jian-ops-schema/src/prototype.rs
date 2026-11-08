//! Figma-compatible prototype schema types (`Reaction`, `Trigger`,
//! `PrototypeAction`, `PrototypeTransition`, `OverflowDirection`,
//! `PrototypeScrollBehavior`, `OverlaySettings`, `PagePrototype`).
//!
//! Mirrors `@figma/plugin-typings` and Figma's Kiwi binary schema so `.fig`
//! files, Figma REST imports, and AI MCP tools share one canonical model.

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, schemars::JsonSchema)]
#[cfg_attr(feature = "export-ts", derive(ts_rs::TS))]
#[cfg_attr(feature = "export-ts", ts(export, export_to = "ops.ts"))]
#[serde(rename_all = "camelCase")]
pub struct Reaction {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub trigger: Option<Trigger>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub actions: Vec<PrototypeAction>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, schemars::JsonSchema)]
#[cfg_attr(feature = "export-ts", derive(ts_rs::TS))]
#[cfg_attr(feature = "export-ts", ts(export, export_to = "ops.ts"))]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum TriggerType {
    OnClick,
    OnHover,
    OnPress,
    #[serde(alias = "DRAG")]
    OnDrag,
    #[serde(alias = "AFTER_DELAY")]
    AfterTimeout,
    #[serde(alias = "MOUSE_IN")]
    MouseEnter,
    #[serde(alias = "MOUSE_OUT")]
    MouseLeave,
    MouseUp,
    MouseDown,
    OnKeyDown,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, schemars::JsonSchema)]
#[cfg_attr(feature = "export-ts", derive(ts_rs::TS))]
#[cfg_attr(feature = "export-ts", ts(export, export_to = "ops.ts"))]
#[serde(rename_all = "camelCase")]
pub struct Trigger {
    #[serde(rename = "type")]
    pub kind: TriggerType,
    /// Seconds before `AFTER_TIMEOUT` fires.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub timeout: Option<f64>,
    /// Seconds before `MOUSE_ENTER` / `MOUSE_LEAVE` / `MOUSE_DOWN` / `MOUSE_UP` fires.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub delay: Option<f64>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub key_codes: Vec<u32>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub device: Option<String>,
}

impl Trigger {
    pub fn on_click() -> Self {
        Self {
            kind: TriggerType::OnClick,
            timeout: None,
            delay: None,
            key_codes: Vec::new(),
            device: None,
        }
    }

    pub fn on_hover() -> Self {
        Self {
            kind: TriggerType::OnHover,
            timeout: None,
            delay: None,
            key_codes: Vec::new(),
            device: None,
        }
    }

    pub fn on_press() -> Self {
        Self {
            kind: TriggerType::OnPress,
            timeout: None,
            delay: None,
            key_codes: Vec::new(),
            device: None,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, schemars::JsonSchema)]
#[cfg_attr(feature = "export-ts", derive(ts_rs::TS))]
#[cfg_attr(feature = "export-ts", ts(export, export_to = "ops.ts"))]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ActionType {
    #[serde(alias = "INTERNAL_NODE")]
    Node,
    Back,
    Close,
    #[serde(alias = "OPEN_URL")]
    Url,
    SetVariable,
    SetVariableMode,
    Conditional,
    /// Authoring shorthands accepted as `type` directly and normalized via
    /// [`PrototypeAction::effective_navigation`].
    Navigate,
    Overlay,
    #[serde(alias = "SWAP_OVERLAY")]
    Swap,
    #[serde(alias = "SWAP_STATE")]
    ChangeTo,
    ScrollTo,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, schemars::JsonSchema)]
#[cfg_attr(feature = "export-ts", derive(ts_rs::TS))]
#[cfg_attr(feature = "export-ts", ts(export, export_to = "ops.ts"))]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum PrototypeNavigation {
    Navigate,
    #[serde(alias = "SWAP_OVERLAY")]
    Swap,
    Overlay,
    ScrollTo,
    #[serde(alias = "SWAP_STATE")]
    ChangeTo,
}

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize, schemars::JsonSchema)]
#[cfg_attr(feature = "export-ts", derive(ts_rs::TS))]
#[cfg_attr(feature = "export-ts", ts(export, export_to = "ops.ts"))]
pub struct OverlayOffset {
    pub x: f64,
    pub y: f64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, schemars::JsonSchema)]
#[cfg_attr(feature = "export-ts", derive(ts_rs::TS))]
#[cfg_attr(feature = "export-ts", ts(export, export_to = "ops.ts"))]
#[serde(rename_all = "camelCase")]
pub struct ConditionalBlock {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub condition: Option<String>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub actions: Vec<PrototypeAction>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, schemars::JsonSchema)]
#[cfg_attr(feature = "export-ts", derive(ts_rs::TS))]
#[cfg_attr(feature = "export-ts", ts(export, export_to = "ops.ts"))]
#[serde(rename_all = "camelCase")]
pub struct PrototypeAction {
    #[serde(rename = "type")]
    pub kind: ActionType,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub destination_id: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub navigation: Option<PrototypeNavigation>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub transition: Option<PrototypeTransition>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub preserve_scroll_position: Option<bool>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub reset_scroll_position: Option<bool>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub reset_video_position: Option<bool>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub reset_interactive_components: Option<bool>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub overlay_relative_position: Option<OverlayOffset>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub url: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub open_in_new_tab: Option<bool>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub variable_id: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub variable_value: Option<serde_json::Value>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub variable_collection_id: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub variable_mode_id: Option<String>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub conditional_blocks: Vec<ConditionalBlock>,
}

impl PrototypeAction {
    pub fn navigate(destination_id: impl Into<String>) -> Self {
        Self::node_nav(destination_id.into(), PrototypeNavigation::Navigate, None)
    }

    pub fn node_nav(
        destination_id: String,
        navigation: PrototypeNavigation,
        transition: Option<PrototypeTransition>,
    ) -> Self {
        Self {
            kind: ActionType::Node,
            destination_id: Some(destination_id),
            navigation: Some(navigation),
            transition,
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

    /// Resolve `navigation` whether the caller wrote Figma's canonical
    /// `{"type":"NODE","navigation":"NAVIGATE"}` or the shorthand
    /// `{"type":"NAVIGATE"}`.
    pub fn effective_navigation(&self) -> Option<PrototypeNavigation> {
        self.navigation.or(match self.kind {
            ActionType::Navigate => Some(PrototypeNavigation::Navigate),
            ActionType::Overlay => Some(PrototypeNavigation::Overlay),
            ActionType::Swap => Some(PrototypeNavigation::Swap),
            ActionType::ChangeTo => Some(PrototypeNavigation::ChangeTo),
            ActionType::ScrollTo => Some(PrototypeNavigation::ScrollTo),
            ActionType::Node => Some(PrototypeNavigation::Navigate),
            _ => None,
        })
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, schemars::JsonSchema)]
#[cfg_attr(feature = "export-ts", derive(ts_rs::TS))]
#[cfg_attr(feature = "export-ts", ts(export, export_to = "ops.ts"))]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum PrototypeTransitionType {
    #[serde(alias = "INSTANT_TRANSITION")]
    Instant,
    #[serde(alias = "FADE")]
    Dissolve,
    #[serde(alias = "MAGIC_MOVE")]
    SmartAnimate,
    ScrollAnimate,
    MoveIn,
    MoveOut,
    Push,
    SlideIn,
    SlideOut,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, schemars::JsonSchema)]
#[cfg_attr(feature = "export-ts", derive(ts_rs::TS))]
#[cfg_attr(feature = "export-ts", ts(export, export_to = "ops.ts"))]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum TransitionDirection {
    Left,
    Right,
    Top,
    Bottom,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, schemars::JsonSchema)]
#[cfg_attr(feature = "export-ts", derive(ts_rs::TS))]
#[cfg_attr(feature = "export-ts", ts(export, export_to = "ops.ts"))]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum EasingKind {
    Linear,
    #[serde(alias = "IN_CUBIC")]
    EaseIn,
    #[serde(alias = "OUT_CUBIC")]
    EaseOut,
    #[serde(alias = "INOUT_CUBIC")]
    EaseInAndOut,
    #[serde(alias = "IN_BACK_CUBIC")]
    EaseInBack,
    #[serde(alias = "OUT_BACK_CUBIC")]
    EaseOutBack,
    #[serde(alias = "INOUT_BACK_CUBIC")]
    EaseInAndOutBack,
    #[serde(alias = "CUSTOM_CUBIC")]
    CustomCubicBezier,
    #[serde(alias = "GENTLE_SPRING")]
    Gentle,
    #[serde(alias = "SPRING", alias = "SPRING_PRESET_ONE")]
    Quick,
    #[serde(alias = "SPRING_PRESET_TWO")]
    Bouncy,
    #[serde(alias = "SPRING_PRESET_THREE")]
    Slow,
    CustomSpring,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, schemars::JsonSchema)]
#[cfg_attr(feature = "export-ts", derive(ts_rs::TS))]
#[cfg_attr(feature = "export-ts", ts(export, export_to = "ops.ts"))]
#[serde(rename_all = "camelCase")]
pub struct PrototypeEasing {
    #[serde(rename = "type")]
    pub kind: EasingKind,
    #[serde(
        default,
        skip_serializing_if = "Option::is_none",
        alias = "easingFunctionCubicBezier"
    )]
    pub bezier: Option<[f64; 4]>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, schemars::JsonSchema)]
#[cfg_attr(feature = "export-ts", derive(ts_rs::TS))]
#[cfg_attr(feature = "export-ts", ts(export, export_to = "ops.ts"))]
#[serde(rename_all = "camelCase")]
pub struct PrototypeTransition {
    #[serde(rename = "type")]
    pub kind: PrototypeTransitionType,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub direction: Option<TransitionDirection>,
    /// Transition duration in seconds (default 0.3).
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub duration: Option<f64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub easing: Option<PrototypeEasing>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub match_layers: Option<bool>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, schemars::JsonSchema)]
#[cfg_attr(feature = "export-ts", derive(ts_rs::TS))]
#[cfg_attr(feature = "export-ts", ts(export, export_to = "ops.ts"))]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum OverflowDirection {
    None,
    #[serde(alias = "HORIZONTAL_SCROLLING")]
    Horizontal,
    #[serde(alias = "VERTICAL_SCROLLING")]
    Vertical,
    #[serde(alias = "HORIZONTAL_AND_VERTICAL_SCROLLING")]
    Both,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, schemars::JsonSchema)]
#[cfg_attr(feature = "export-ts", derive(ts_rs::TS))]
#[cfg_attr(feature = "export-ts", ts(export, export_to = "ops.ts"))]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum PrototypeScrollBehavior {
    Scrolls,
    #[serde(alias = "FIXED_WHEN_CHILD_OF_SCROLLING_FRAME")]
    Fixed,
    #[serde(alias = "STICKY_SCROLLS")]
    Sticky,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, schemars::JsonSchema)]
#[cfg_attr(feature = "export-ts", derive(ts_rs::TS))]
#[cfg_attr(feature = "export-ts", ts(export, export_to = "ops.ts"))]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum OverlayPositionType {
    Center,
    TopLeft,
    TopCenter,
    TopRight,
    BottomLeft,
    BottomCenter,
    BottomRight,
    Manual,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, schemars::JsonSchema)]
#[cfg_attr(feature = "export-ts", derive(ts_rs::TS))]
#[cfg_attr(feature = "export-ts", ts(export, export_to = "ops.ts"))]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum OverlayBackgroundInteraction {
    None,
    CloseOnClickOutside,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, schemars::JsonSchema)]
#[cfg_attr(feature = "export-ts", derive(ts_rs::TS))]
#[cfg_attr(feature = "export-ts", ts(export, export_to = "ops.ts"))]
#[serde(rename_all = "camelCase")]
pub struct OverlaySettings {
    pub position_type: OverlayPositionType,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub background_interaction: Option<OverlayBackgroundInteraction>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub background_color: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, schemars::JsonSchema)]
#[cfg_attr(feature = "export-ts", derive(ts_rs::TS))]
#[cfg_attr(feature = "export-ts", ts(export, export_to = "ops.ts"))]
#[serde(rename_all = "camelCase")]
pub struct FlowStartingPoint {
    pub node_id: String,
    pub name: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, schemars::JsonSchema)]
#[cfg_attr(feature = "export-ts", derive(ts_rs::TS))]
#[cfg_attr(feature = "export-ts", ts(export, export_to = "ops.ts"))]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum PrototypeDeviceKind {
    None,
    Preset,
    Custom,
    Presentation,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, schemars::JsonSchema)]
#[cfg_attr(feature = "export-ts", derive(ts_rs::TS))]
#[cfg_attr(feature = "export-ts", ts(export, export_to = "ops.ts"))]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum DeviceRotation {
    None,
    #[serde(alias = "90_CCW")]
    Ccw90,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, schemars::JsonSchema)]
#[cfg_attr(feature = "export-ts", derive(ts_rs::TS))]
#[cfg_attr(feature = "export-ts", ts(export, export_to = "ops.ts"))]
#[serde(rename_all = "camelCase")]
pub struct PrototypeDeviceSpec {
    #[serde(rename = "type")]
    pub kind: PrototypeDeviceKind,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub size: Option<OverlayOffset>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub preset_identifier: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub rotation: Option<DeviceRotation>,
}

#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize, schemars::JsonSchema)]
#[cfg_attr(feature = "export-ts", derive(ts_rs::TS))]
#[cfg_attr(feature = "export-ts", ts(export, export_to = "ops.ts"))]
#[serde(rename_all = "camelCase")]
pub struct PagePrototype {
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub flows: Vec<FlowStartingPoint>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub device: Option<PrototypeDeviceSpec>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub background_color: Option<String>,
    /// Per-page prototype overrides keyed by page id.
    #[serde(default, skip_serializing_if = "std::collections::BTreeMap::is_empty")]
    pub pages: std::collections::BTreeMap<String, PagePrototype>,
}

impl PagePrototype {
    pub fn is_empty(&self) -> bool {
        self.flows.is_empty()
            && self.device.is_none()
            && self.background_color.is_none()
            && self.pages.is_empty()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::PenDocument;

    #[test]
    fn reaction_and_page_prototype_round_trip_strictly() {
        let json = serde_json::json!({
            "version": "1.0",
            "prototype": {
                "flows": [{"nodeId": "f1", "name": "Main Flow"}],
                "device": {"type": "PRESET", "presetIdentifier": "IPHONE_15", "size": {"x": 393.0, "y": 852.0}}
            },
            "children": [{
                "type": "frame",
                "id": "f1",
                "overflowDirection": "VERTICAL",
                "scrollBehavior": "FIXED",
                "section": true,
                "reactions": [{
                    "trigger": {"type": "ON_CLICK"},
                    "actions": [{
                        "type": "NODE",
                        "destinationId": "f2",
                        "navigation": "NAVIGATE",
                        "transition": {
                            "type": "SMART_ANIMATE",
                            "duration": 0.3,
                            "easing": {"type": "EASE_IN_AND_OUT"}
                        }
                    }]
                }]
            }]
        });
        let doc: PenDocument = serde_json::from_value(json.clone()).expect("strict parse");
        assert_eq!(serde_json::to_value(&doc).unwrap(), json);
        let action = &doc.children[0].node_base().reactions.as_ref().unwrap()[0].actions[0];
        assert_eq!(
            action.effective_navigation(),
            Some(PrototypeNavigation::Navigate)
        );
    }
}
