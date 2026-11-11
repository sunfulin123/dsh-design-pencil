//! Figma-compatible prototype graph, player, transitions, Smart Animate,
//! interactive component derivation, and Present device geometry.

pub mod actions;
pub mod behaviour;
pub mod device;
pub mod graph;
pub mod player;
pub mod simulate_types;
pub mod smart_animate;
pub mod transition;
pub mod viewport;

#[cfg(test)]
mod tests;

pub use behaviour::{InteractiveComponentEntry, PropertyOverrideValue};
pub use device::{
    compute_present_geometry, preset_device_size, resolve_device_viewport, PresentFrameGeometry,
    PresentScaleMode,
};
pub use graph::{HotspotEntry, PrototypeFlow, PrototypeGraph, PrototypeScreen};
pub use player::{HistoryEntry, OverlayInstance, PrototypePlayer, SimulateReport, SimulateStep};
pub use smart_animate::{match_smart_animate_layers, LayerPose, SmartAnimateLayer};
pub use transition::{compute_transition_frame, eval_easing, TransitionFrame};
pub use viewport::{zoom_about, PresentViewport, MAX_ZOOM_FACTOR};
