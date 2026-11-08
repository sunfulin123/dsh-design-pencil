//! Figma Smart Animate layer matching by normalized hierarchy path and
//! property interpolation (`x`, `y`, `width`, `height`, `opacity`, `rotation`).

use crate::PenNodeExt;
use jian_ops_schema::node::{NumberOrExpression, PenNode};
use std::collections::HashMap;

/// Maximum matched layers before Smart Animate degrades gracefully to Dissolve
/// to avoid main-thread stalls on huge screens.
pub const MAX_SMART_ANIMATE_LAYERS: usize = 200;

#[derive(Debug, Clone, PartialEq)]
pub struct LayerPose {
    pub node_id: String,
    pub path_key: String,
    /// Screen-local `(x, y, width, height)`.
    pub rect: (f32, f32, f32, f32),
    pub opacity: f32,
    pub rotation: f32,
}

#[derive(Debug, Clone, PartialEq)]
pub struct SmartAnimateLayer {
    pub path_key: String,
    pub from_node_id: String,
    pub to_node_id: String,
    pub from: LayerPose,
    pub to: LayerPose,
    pub current: LayerPose,
}

impl SmartAnimateLayer {
    pub fn at(mut self, eased: f32) -> Self {
        let lerp = |a: f32, b: f32| a + (b - a) * eased;
        self.current = LayerPose {
            node_id: self.to_node_id.clone(),
            path_key: self.path_key.clone(),
            rect: (
                lerp(self.from.rect.0, self.to.rect.0),
                lerp(self.from.rect.1, self.to.rect.1),
                lerp(self.from.rect.2, self.to.rect.2).max(0.0),
                lerp(self.from.rect.3, self.to.rect.3).max(0.0),
            ),
            opacity: lerp(self.from.opacity, self.to.opacity).clamp(0.0, 1.0),
            rotation: lerp(self.from.rotation, self.to.rotation),
        };
        self
    }
}

/// Collect matched layers between `from_screen` and `to_screen` by their
/// normalized name hierarchy path (`Header/Title`, `Card/Avatar`, etc.).
/// Returns `None` if the screen exceeds [`MAX_SMART_ANIMATE_LAYERS`], signaling
/// the caller to fall back to `Dissolve`.
pub fn match_smart_animate_layers(
    from_screen: &PenNode,
    to_screen: &PenNode,
) -> Option<Vec<SmartAnimateLayer>> {
    let mut from_map: HashMap<String, LayerPose> = HashMap::new();
    let mut from_count = 0usize;
    collect_poses(from_screen, "", (0.0, 0.0), &mut from_map, &mut from_count)?;

    let mut to_map: HashMap<String, LayerPose> = HashMap::new();
    let mut to_count = 0usize;
    collect_poses(to_screen, "", (0.0, 0.0), &mut to_map, &mut to_count)?;

    let mut matches = Vec::new();
    for (path_key, from_pose) in from_map {
        if let Some(to_pose) = to_map.remove(&path_key) {
            matches.push(SmartAnimateLayer {
                path_key,
                from_node_id: from_pose.node_id.clone(),
                to_node_id: to_pose.node_id.clone(),
                current: from_pose.clone(),
                from: from_pose,
                to: to_pose,
            });
            if matches.len() > MAX_SMART_ANIMATE_LAYERS {
                return None;
            }
        }
    }
    Some(matches)
}

fn collect_poses(
    root: &PenNode,
    prefix: &str,
    parent_offset: (f32, f32),
    out: &mut HashMap<String, LayerPose>,
    visited: &mut usize,
) -> Option<()> {
    let children = root.children()?;
    for child in children {
        if child.base().visible == Some(false) {
            continue;
        }
        *visited += 1;
        if *visited > MAX_SMART_ANIMATE_LAYERS * 6 {
            return None;
        }
        let base = child.base();
        let name = base
            .name
            .as_deref()
            .filter(|s| !s.trim().is_empty())
            .unwrap_or(&base.id)
            .trim();
        let path_key = if prefix.is_empty() {
            name.to_string()
        } else {
            format!("{prefix}/{name}")
        };
        let lx = parent_offset.0 + base.x.unwrap_or(0.0) as f32;
        let ly = parent_offset.1 + base.y.unwrap_or(0.0) as f32;
        let w = child.width_px().unwrap_or(0.0) as f32;
        let h = child.height_px().unwrap_or(0.0) as f32;
        let opacity = match base.opacity.as_ref() {
            Some(NumberOrExpression::Number(n)) => (*n as f32).clamp(0.0, 1.0),
            _ => 1.0,
        };
        let rotation = base.rotation.unwrap_or(0.0) as f32;
        out.entry(path_key.clone()).or_insert(LayerPose {
            node_id: base.id.clone(),
            path_key: path_key.clone(),
            rect: (lx, ly, w, h),
            opacity,
            rotation,
        });
        if child.children().is_some() {
            collect_poses(child, &path_key, (lx, ly), out, visited)?;
        }
    }
    Some(())
}
