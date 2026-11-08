//! Figma-style Present viewport math: edge-to-edge fit, zoom never below fit,
//! and scrolling clamped so the screen can never be dragged off the stage.

use super::device::PresentScaleMode;

/// Upper bound of the user zoom factor relative to the fitted scale.
pub const MAX_ZOOM_FACTOR: f32 = 4.0;

/// Scale that makes `content` fit `stage` for `mode` (the zoom floor).
pub fn base_fit_scale(mode: PresentScaleMode, stage: (f32, f32), content: (f32, f32)) -> f32 {
    let cw = content.0.max(1.0);
    let ch = content.1.max(1.0);
    let sx = stage.0.max(1.0) / cw;
    let sy = stage.1.max(1.0) / ch;
    match mode {
        PresentScaleMode::Fit => sx.min(sy),
        PresentScaleMode::FitWidth => sx,
        PresentScaleMode::Fill => sx.max(sy),
        PresentScaleMode::ActualSize => 1.0,
    }
}

/// Clamp a user zoom factor to `[1, MAX_ZOOM_FACTOR]`; non-finite becomes 1.
pub fn clamp_zoom_factor(factor: f32) -> f32 {
    if factor.is_finite() {
        factor.clamp(1.0, MAX_ZOOM_FACTOR)
    } else {
        1.0
    }
}

/// Maximum scroll offset per axis for a scaled screen inside the stage.
pub fn max_scroll(stage: (f32, f32), scaled: (f32, f32)) -> (f32, f32) {
    ((scaled.0 - stage.0).max(0.0), (scaled.1 - stage.1).max(0.0))
}

/// Clamp a scroll offset so the scaled screen always covers the stage edge.
pub fn clamp_scroll(scroll: (f32, f32), stage: (f32, f32), scaled: (f32, f32)) -> (f32, f32) {
    let (mx, my) = max_scroll(stage, scaled);
    let axis = |v: f32, max: f32| {
        if v.is_finite() {
            v.clamp(0.0, max)
        } else {
            0.0
        }
    };
    (axis(scroll.0, mx), axis(scroll.1, my))
}

/// Offset of the screen's top-left from the stage origin. Axes that fit are
/// centred; overflowing axes start at the edge minus the (clamped) scroll.
pub fn screen_offset(stage: (f32, f32), scaled: (f32, f32), scroll: (f32, f32)) -> (f32, f32) {
    let (sx, sy) = clamp_scroll(scroll, stage, scaled);
    let axis = |stage: f32, size: f32, scroll: f32| {
        if size > stage {
            -scroll
        } else {
            (stage - size) / 2.0
        }
    };
    (axis(stage.0, scaled.0, sx), axis(stage.1, scaled.1, sy))
}

/// Resolved Present viewport for one screen.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct PresentViewport {
    pub base_scale: f32,
    pub zoom_factor: f32,
    pub scale: f32,
    pub scroll: (f32, f32),
    /// Screen top-left relative to the stage origin.
    pub offset: (f32, f32),
    /// Scaled screen size in host pixels.
    pub size: (f32, f32),
}

impl PresentViewport {
    pub fn resolve(
        mode: PresentScaleMode,
        stage: (f32, f32),
        content: (f32, f32),
        zoom_factor: f32,
        scroll: (f32, f32),
    ) -> Self {
        let base_scale = base_fit_scale(mode, stage, content);
        let zoom_factor = clamp_zoom_factor(zoom_factor);
        let scale = base_scale * zoom_factor;
        let size = (content.0.max(1.0) * scale, content.1.max(1.0) * scale);
        let scroll = clamp_scroll(scroll, stage, size);
        Self {
            base_scale,
            zoom_factor,
            scale,
            scroll,
            offset: screen_offset(stage, size, scroll),
            size,
        }
    }

    /// Whether the zoom-out control can still shrink the screen.
    pub fn can_zoom_out(&self) -> bool {
        self.zoom_factor > 1.0 + f32::EPSILON
    }

    pub fn can_zoom_in(&self) -> bool {
        self.zoom_factor < MAX_ZOOM_FACTOR - f32::EPSILON
    }
}

/// Zoom to `new_factor` keeping the content point under `anchor` (relative to
/// the stage origin) fixed. Returns `(zoom_factor, scroll)` after clamping.
pub fn zoom_about(
    mode: PresentScaleMode,
    stage: (f32, f32),
    content: (f32, f32),
    current: (f32, (f32, f32)),
    new_factor: f32,
    anchor: (f32, f32),
) -> (f32, (f32, f32)) {
    let old = PresentViewport::resolve(mode, stage, content, current.0, current.1);
    let factor = clamp_zoom_factor(new_factor);
    let new_scale = old.base_scale * factor;
    let px = (anchor.0 - old.offset.0) / old.scale;
    let py = (anchor.1 - old.offset.1) / old.scale;
    let size = (
        content.0.max(1.0) * new_scale,
        content.1.max(1.0) * new_scale,
    );
    let scroll = clamp_scroll(
        (px * new_scale - anchor.0, py * new_scale - anchor.1),
        stage,
        size,
    );
    (factor, scroll)
}

#[cfg(test)]
mod tests {
    use super::*;

    const STAGE: (f32, f32) = (1280.0, 704.0);
    const BOARD: (f32, f32) = (1440.0, 1080.0);

    #[test]
    fn fit_width_fills_stage_edge_to_edge_and_scrolls_vertically() {
        let vp =
            PresentViewport::resolve(PresentScaleMode::FitWidth, STAGE, BOARD, 1.0, (0.0, 0.0));
        assert_eq!(vp.offset, (0.0, 0.0));
        assert!((vp.size.0 - STAGE.0).abs() < 0.01);
        assert!(vp.size.1 > STAGE.1);
        let bottom =
            PresentViewport::resolve(PresentScaleMode::FitWidth, STAGE, BOARD, 1.0, (0.0, 9e9));
        assert!((bottom.offset.1 + bottom.size.1 - STAGE.1).abs() < 0.01);
        assert_eq!(bottom.scroll.0, 0.0);
    }

    #[test]
    fn zoom_never_shrinks_below_fit_or_exceeds_max() {
        let small =
            PresentViewport::resolve(PresentScaleMode::FitWidth, STAGE, BOARD, 0.2, (0.0, 0.0));
        assert_eq!(small.zoom_factor, 1.0);
        assert!(!small.can_zoom_out());
        let big = PresentViewport::resolve(PresentScaleMode::Fit, STAGE, BOARD, 99.0, (0.0, 0.0));
        assert_eq!(big.zoom_factor, MAX_ZOOM_FACTOR);
        assert!(!big.can_zoom_in());
        assert_eq!(clamp_zoom_factor(f32::NAN), 1.0);
    }

    #[test]
    fn fitting_axis_is_centred_and_cannot_scroll() {
        let vp = PresentViewport::resolve(PresentScaleMode::Fit, STAGE, BOARD, 1.0, (50.0, 50.0));
        assert_eq!(vp.scroll, (0.0, 0.0));
        assert!((vp.offset.1).abs() < 0.01);
        assert!(vp.offset.0 > 0.0);
        assert!((vp.offset.0 * 2.0 + vp.size.0 - STAGE.0).abs() < 0.01);
    }

    #[test]
    fn scroll_is_clamped_so_content_never_leaves_stage() {
        let vp = PresentViewport::resolve(PresentScaleMode::Fill, STAGE, BOARD, 2.0, (-100.0, 1e6));
        assert!(vp.offset.0 <= 0.0 && vp.offset.1 <= 0.0);
        assert!(vp.offset.0 + vp.size.0 >= STAGE.0 - 0.01);
        assert!((vp.offset.1 + vp.size.1 - STAGE.1).abs() < 0.01);
    }

    #[test]
    fn zoom_about_keeps_anchor_point_fixed() {
        let mode = PresentScaleMode::FitWidth;
        let anchor = (400.0, 300.0);
        let before = PresentViewport::resolve(mode, STAGE, BOARD, 1.0, (0.0, 100.0));
        let content_pt = (
            (anchor.0 - before.offset.0) / before.scale,
            (anchor.1 - before.offset.1) / before.scale,
        );
        let (factor, scroll) = zoom_about(mode, STAGE, BOARD, (1.0, (0.0, 100.0)), 2.0, anchor);
        let after = PresentViewport::resolve(mode, STAGE, BOARD, factor, scroll);
        let screen_x = after.offset.0 + content_pt.0 * after.scale;
        let screen_y = after.offset.1 + content_pt.1 * after.scale;
        assert!((screen_x - anchor.0).abs() < 0.5);
        assert!((screen_y - anchor.1).abs() < 0.5);
        let (back, _) = zoom_about(mode, STAGE, BOARD, (factor, scroll), 0.1, anchor);
        assert_eq!(back, 1.0);
    }
}
