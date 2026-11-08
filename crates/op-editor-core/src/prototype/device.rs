//! Figma Present device presets, zoom modes, and stage/screen transform math.

use jian_ops_schema::prototype::{DeviceRotation, PrototypeDeviceKind, PrototypeDeviceSpec};
use serde::{Deserialize, Serialize};

/// Figma Present zoom/scaling options.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum PresentScaleMode {
    /// Fit – scale down or up to fit stage (`Z`).
    #[default]
    Fit,
    /// Fit width – fill horizontal stage width (`W`).
    FitWidth,
    /// Fill – cover stage (`F`).
    Fill,
    /// 100% – actual pixel size (`1`).
    ActualSize,
}

impl PresentScaleMode {
    pub fn label(self) -> &'static str {
        match self {
            Self::Fit => "Fit",
            Self::FitWidth => "Fit width",
            Self::Fill => "Fill",
            Self::ActualSize => "100%",
        }
    }

    pub fn next(self) -> Self {
        match self {
            Self::Fit => Self::FitWidth,
            Self::FitWidth => Self::Fill,
            Self::Fill => Self::ActualSize,
            Self::ActualSize => Self::Fit,
        }
    }
}

/// Resolved presentation geometry for the active screen inside `stage`.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct PresentFrameGeometry {
    /// Outer device bezel rect in host screen coordinates (equals `screen_rect`
    /// when no device frame is shown).
    pub bezel_rect: (f32, f32, f32, f32),
    /// Inner screen viewport rect in host screen coordinates.
    pub screen_rect: (f32, f32, f32, f32),
    /// Authored screen rect `(x, y, w, h)` in document/page coordinates.
    pub authored_rect: (f32, f32, f32, f32),
    /// Scale factor from authored screen pixels to host pixels.
    pub scale: f32,
    /// Corner radius of the device bezel in host pixels.
    pub bezel_radius: f32,
    /// Whether a physical device bezel should be painted around `screen_rect`.
    pub show_bezel: bool,
}

impl PresentFrameGeometry {
    /// Map a host pointer `(sx, sy)` into screen-local coordinates `(0..w, 0..h)`.
    pub fn host_to_screen_local(&self, sx: f32, sy: f32) -> (f32, f32) {
        let (rx, ry, _, _) = self.screen_rect;
        let s = self.scale.max(0.001);
        ((sx - rx) / s, (sy - ry) / s)
    }

    /// Map a host pointer `(sx, sy)` into document page coordinates.
    pub fn host_to_page(&self, sx: f32, sy: f32) -> (f32, f32) {
        let (lx, ly) = self.host_to_screen_local(sx, sy);
        (self.authored_rect.0 + lx, self.authored_rect.1 + ly)
    }

    /// Map a screen-local rect `(lx, ly, w, h)` to host coordinates.
    pub fn screen_local_to_host(&self, lx: f32, ly: f32, w: f32, h: f32) -> (f32, f32, f32, f32) {
        let (rx, ry, _, _) = self.screen_rect;
        let s = self.scale;
        (rx + lx * s, ry + ly * s, w * s, h * s)
    }

    pub fn contains_host_point(&self, sx: f32, sy: f32) -> bool {
        let (rx, ry, rw, rh) = self.screen_rect;
        sx >= rx && sx <= rx + rw && sy >= ry && sy <= ry + rh
    }
}

/// Resolve preset size `(width, height)` for known Figma `presetIdentifier`s.
pub fn preset_device_size(preset_id: &str) -> Option<(f32, f32)> {
    let upper = preset_id.to_ascii_uppercase();
    if upper.contains("IPHONE_16_PRO_MAX") || upper.contains("IPHONE_15_PRO_MAX") {
        Some((430.0, 932.0))
    } else if upper.contains("IPHONE_16")
        || upper.contains("IPHONE_15")
        || upper.contains("IPHONE_14_PRO")
    {
        Some((393.0, 852.0))
    } else if upper.contains("IPHONE") || upper.contains("ANDROID") {
        Some((390.0, 844.0))
    } else if upper.contains("IPAD_PRO_12") || upper.contains("IPAD_PRO_13") {
        Some((1024.0, 1366.0))
    } else if upper.contains("IPAD") || upper.contains("SURFACE") {
        Some((834.0, 1194.0))
    } else if upper.contains("MACBOOK_PRO_16") {
        Some((1728.0, 1117.0))
    } else if upper.contains("MACBOOK") {
        Some((1440.0, 900.0))
    } else if upper.contains("DESKTOP") || upper.contains("PRESENTATION") {
        Some((1920.0, 1080.0))
    } else {
        None
    }
}

/// Resolve viewport size `(w, h)` and whether a bezel applies for `device` and `screen_size`.
pub fn resolve_device_viewport(
    device: Option<&PrototypeDeviceSpec>,
    screen_size: (f32, f32),
    enable_bezel: bool,
) -> ((f32, f32), bool) {
    let sw = screen_size.0.max(1.0);
    let sh = screen_size.1.max(1.0);
    let Some(dev) = device else {
        return ((sw, sh), false);
    };
    if dev.kind == PrototypeDeviceKind::None {
        return ((sw, sh), false);
    }
    let base = dev
        .size
        .map(|s| (s.x as f32, s.y as f32))
        .filter(|(w, h)| *w > 1.0 && *h > 1.0)
        .or_else(|| {
            dev.preset_identifier
                .as_deref()
                .and_then(preset_device_size)
        })
        .unwrap_or((sw, sh));
    let rotated = if dev.rotation == Some(DeviceRotation::Ccw90) {
        (base.1, base.0)
    } else {
        base
    };
    let show_bezel = enable_bezel
        && matches!(
            dev.kind,
            PrototypeDeviceKind::Preset | PrototypeDeviceKind::Custom
        );
    (rotated, show_bezel)
}

/// Compute the stage placement for a screen with optional device bezel,
/// scale mode, explicit zoom override, and pan offset.
pub fn compute_present_geometry(
    stage: (f32, f32, f32, f32),
    authored_rect: (f32, f32, f32, f32),
    device: Option<&PrototypeDeviceSpec>,
    enable_bezel: bool,
    scale_mode: PresentScaleMode,
    zoom_override: Option<f32>,
    pan: (f32, f32),
) -> PresentFrameGeometry {
    let (sx, sy, sw, sh) = (stage.0, stage.1, stage.2.max(1.0), stage.3.max(1.0));
    let aw = authored_rect.2.max(1.0);
    let ah = authored_rect.3.max(1.0);
    let ((vw, vh), show_bezel) = resolve_device_viewport(device, (aw, ah), enable_bezel);
    let pad = if show_bezel { 16.0 } else { 0.0 };
    let total_w = vw + pad * 2.0;
    let total_h = vh + pad * 2.0;

    let base_scale = match scale_mode {
        PresentScaleMode::Fit => (sw / total_w).min(sh / total_h),
        PresentScaleMode::FitWidth => sw / total_w,
        PresentScaleMode::Fill => (sw / total_w).max(sh / total_h),
        PresentScaleMode::ActualSize => 1.0,
    };
    let scale = zoom_override
        .filter(|z| z.is_finite() && *z > 0.0)
        .unwrap_or(base_scale)
        .clamp(0.05, 8.0);

    let scaled_w = vw * scale;
    let scaled_h = vh * scale;
    let screen_x = sx + (sw - scaled_w) * 0.5 + pan.0;
    let screen_y = match scale_mode {
        PresentScaleMode::FitWidth if scaled_h > sh => sy + pan.1,
        _ => sy + (sh - scaled_h) * 0.5 + pan.1,
    };
    let bezel_pad = pad * scale;
    let bezel_rect = (
        screen_x - bezel_pad,
        screen_y - bezel_pad,
        scaled_w + bezel_pad * 2.0,
        scaled_h + bezel_pad * 2.0,
    );
    let bezel_radius = if show_bezel { 36.0 * scale } else { 0.0 };
    PresentFrameGeometry {
        bezel_rect,
        screen_rect: (screen_x, screen_y, scaled_w, scaled_h),
        authored_rect: (authored_rect.0, authored_rect.1, vw, vh),
        scale,
        bezel_radius,
        show_bezel,
    }
}
