//! Device-frame presentation geometry and transition helpers for web Present mode.

use op_editor_core::PreviewDeviceKind;
use op_editor_ui::{Color, Point2D, Rect};

#[derive(Debug, Clone)]
pub struct PinnedGeom {
    pub node_id: String,
    pub node_scene: Rect,
    pub strip: Rect,
    pub paint_origin: Point2D,
}

#[derive(Debug, Clone)]
pub struct PinnedPaint {
    pub node_id: String,
    pub strip_clip: Rect,
    pub paint_origin: Point2D,
    pub nav_scene_origin: Point2D,
}

#[derive(Debug, Clone)]
pub struct DeviceFrame {
    pub kind: PreviewDeviceKind,
    pub frame: Rect,
    pub fit: f32,
    pub content_origin: Point2D,
    pub pinned: Option<PinnedGeom>,
    pub pinned_top: Option<PinnedGeom>,
    pub nav_top: f32,
    pub content_span_x: (f32, f32),
    pub viewport_h: f32,
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub enum PreviewSurface {
    Scrolled { scroll_y: f32 },
    Pinned,
    PinnedTop,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ModeTransitionKind {
    Enter,
    Exit,
}

#[derive(Debug, Clone)]
pub struct ModeTransition {
    kind: ModeTransitionKind,
    source: Option<Rect>,
    settled: Rect,
    started_ms: u64,
}

impl ModeTransition {
    const DURATION_MS: u64 = 220;

    pub fn start(
        kind: ModeTransitionKind,
        source: Option<Rect>,
        settled: Rect,
        now_ms: u64,
    ) -> Self {
        Self {
            kind,
            source,
            settled,
            started_ms: now_ms,
        }
    }

    pub fn kind(&self) -> ModeTransitionKind {
        self.kind
    }

    pub fn is_active(&self, now_ms: u64) -> bool {
        self.source.is_some() && now_ms < self.started_ms.saturating_add(Self::DURATION_MS)
    }

    pub fn progress(&self, now_ms: u64) -> f32 {
        let elapsed = now_ms.saturating_sub(self.started_ms);
        (elapsed as f32 / Self::DURATION_MS as f32).clamp(0.0, 1.0)
    }

    pub fn chrome_blend(&self, now_ms: u64) -> f32 {
        let t = self.progress(now_ms);
        match self.kind {
            ModeTransitionKind::Enter => t,
            ModeTransitionKind::Exit => 1.0 - t,
        }
    }

    pub fn canvas_rect_for_frame(&self, now_ms: u64) -> Rect {
        let Some(src) = self.source else {
            return self.settled;
        };
        let t = self.chrome_blend(now_ms);
        let lerp = |a: f32, b: f32| a + (b - a) * t;
        Rect::xywh(
            lerp(src.origin.x, self.settled.origin.x),
            lerp(src.origin.y, self.settled.origin.y),
            lerp(src.size.x, self.settled.size.x).max(1.0),
            lerp(src.size.y, self.settled.size.y).max(1.0),
        )
    }
}

pub fn lerp_color(a: Color, b: Color, t: f32) -> Color {
    let t = t.clamp(0.0, 1.0);
    let l = |x: f32, y: f32| x + (y - x) * t;
    Color {
        r: l(a.r, b.r),
        g: l(a.g, b.g),
        b: l(a.b, b.b),
        a: l(a.a, b.a),
    }
}

pub fn device_surface_at(
    frame: &DeviceFrame,
    screen: Point2D,
    scroll_y: f32,
) -> Option<PreviewSurface> {
    let frame_rect = frame.frame;
    let inside = screen.x >= frame_rect.origin.x
        && screen.x <= frame_rect.origin.x + frame_rect.size.x
        && screen.y >= frame_rect.origin.y
        && screen.y <= frame_rect.origin.y + frame_rect.size.y;
    if !inside || screen.x < frame.content_span_x.0 || screen.x > frame.content_span_x.1 {
        return None;
    }
    if strip_band_contains(&frame.pinned, screen) {
        return pinned_surface_or_dead_zone(
            frame.pinned.as_ref()?,
            frame.fit,
            screen,
            PreviewSurface::Pinned,
        );
    }
    if strip_band_contains(&frame.pinned_top, screen) {
        return pinned_surface_or_dead_zone(
            frame.pinned_top.as_ref()?,
            frame.fit,
            screen,
            PreviewSurface::PinnedTop,
        );
    }
    Some(PreviewSurface::Scrolled { scroll_y })
}

fn strip_band_contains(pinned: &Option<PinnedGeom>, screen: Point2D) -> bool {
    let Some(pinned) = pinned else {
        return false;
    };
    let strip = pinned.strip;
    screen.y >= strip.origin.y
        && screen.y <= strip.origin.y + strip.size.y
        && screen.x >= strip.origin.x
        && screen.x <= strip.origin.x + strip.size.x
}

fn pinned_surface_or_dead_zone(
    pinned: &PinnedGeom,
    fit: f32,
    screen: Point2D,
    surface: PreviewSurface,
) -> Option<PreviewSurface> {
    let left = pinned.paint_origin.x;
    let right = left + pinned.node_scene.size.x * fit;
    (screen.x >= left && screen.x <= right).then_some(surface)
}

pub fn device_scene_point(
    frame: &DeviceFrame,
    surface: &PreviewSurface,
    screen: Point2D,
) -> Option<Point2D> {
    let through = |pinned: &PinnedGeom| {
        Point2D::new(
            pinned.node_scene.origin.x + (screen.x - pinned.paint_origin.x) / frame.fit,
            pinned.node_scene.origin.y + (screen.y - pinned.paint_origin.y) / frame.fit,
        )
    };
    match surface {
        PreviewSurface::Pinned => frame.pinned.as_ref().map(through),
        PreviewSurface::PinnedTop => frame.pinned_top.as_ref().map(through),
        PreviewSurface::Scrolled { scroll_y } => Some(Point2D::new(
            (screen.x - frame.content_origin.x) / frame.fit,
            (screen.y - frame.content_origin.y) / frame.fit + scroll_y,
        )),
    }
}

pub fn frame_size(kind: PreviewDeviceKind) -> (f32, f32) {
    match kind {
        PreviewDeviceKind::Phone => (390.0, 844.0),
        PreviewDeviceKind::Desktop | PreviewDeviceKind::Canvas => (1440.0, 900.0),
    }
}

pub fn frame_radius(kind: PreviewDeviceKind) -> f32 {
    match kind {
        PreviewDeviceKind::Phone => 24.0,
        PreviewDeviceKind::Desktop | PreviewDeviceKind::Canvas => 8.0,
    }
}

pub fn infer_kind_for_width(root_w: Option<f32>) -> PreviewDeviceKind {
    match root_w {
        Some(w) if w <= 500.0 => PreviewDeviceKind::Phone,
        _ => PreviewDeviceKind::Desktop,
    }
}

pub fn compute_frame_geometry(
    kind: PreviewDeviceKind,
    canvas: Rect,
    root_scene: Rect,
    nav_scene: Option<Rect>,
    status_scene: Option<Rect>,
) -> DeviceFrame {
    let (frame_w, frame_h) = frame_size(kind);
    let fit = (canvas.size.x / frame_w)
        .min(canvas.size.y / frame_h)
        .min(1.0);
    geometry_for_size(
        kind,
        canvas,
        root_scene,
        nav_scene,
        status_scene,
        (frame_w, frame_h),
        (fit, fit),
    )
}

/// Geometry for a screen already placed at `frame_rect` (host pixels) by the
/// Present viewport; the frame is never re-centred or offset here.
pub fn compute_presentation_geometry(
    kind: PreviewDeviceKind,
    frame_rect: Rect,
    root_scene: Rect,
    screen_size: (f32, f32),
    nav_scene: Option<Rect>,
    status_scene: Option<Rect>,
) -> DeviceFrame {
    let screen_scale = (frame_rect.size.x / screen_size.0.max(1.0)).max(0.0001);
    let content_scale = screen_scale * screen_size.0 / root_scene.size.x.max(1.0);
    geometry_for_size(
        kind,
        frame_rect,
        root_scene,
        nav_scene,
        status_scene,
        screen_size,
        (screen_scale, content_scale),
    )
}

fn geometry_for_size(
    kind: PreviewDeviceKind,
    canvas: Rect,
    root_scene: Rect,
    nav_scene: Option<Rect>,
    status_scene: Option<Rect>,
    screen_size: (f32, f32),
    scales: (f32, f32),
) -> DeviceFrame {
    let (frame_w, frame_h) = screen_size;
    let (screen_scale, fit) = scales;
    let frame = Rect {
        origin: Point2D::new(
            canvas.origin.x + (canvas.size.x - frame_w * screen_scale) / 2.0,
            canvas.origin.y + ((canvas.size.y - frame_h * screen_scale) / 2.0).max(0.0),
        ),
        size: Point2D::new(frame_w * screen_scale, frame_h * screen_scale),
    };
    let content_origin = Point2D::new(
        frame.origin.x + (frame.size.x - root_scene.size.x * fit) / 2.0 - root_scene.origin.x * fit,
        frame.origin.y - root_scene.origin.y * fit,
    );
    let content_h = nav_scene.map_or(root_scene.size.y, |nav| {
        root_scene
            .size
            .y
            .max(nav.origin.y + nav.size.y - root_scene.origin.y)
    });
    let pinned = nav_scene.map(|nav| {
        let strip = Rect {
            origin: Point2D::new(
                frame.origin.x,
                frame.origin.y + frame.size.y - nav.size.y * fit,
            ),
            size: Point2D::new(frame.size.x, nav.size.y * fit),
        };
        PinnedGeom {
            node_id: String::new(),
            node_scene: nav,
            strip,
            paint_origin: Point2D::new(content_origin.x + nav.origin.x * fit, strip.origin.y),
        }
    });
    let pinned_top = status_scene.map(|status| {
        let strip = Rect {
            origin: frame.origin,
            size: Point2D::new(frame.size.x, status.size.y * fit),
        };
        PinnedGeom {
            node_id: String::new(),
            node_scene: status,
            strip,
            paint_origin: Point2D::new(content_origin.x + status.origin.x * fit, strip.origin.y),
        }
    });
    let status_h = pinned_top.as_ref().map_or(0.0, |p| p.node_scene.size.y);
    let (nav_top, viewport_h) = match &pinned {
        Some(pinned) => {
            let nav_h = pinned.node_scene.size.y;
            (
                (pinned.node_scene.origin.y - root_scene.origin.y).max(0.0),
                frame_h * screen_scale / fit - nav_h - status_h,
            )
        }
        None => (content_h, frame_h * screen_scale / fit - status_h),
    };
    let content_span_x = (
        content_origin.x + root_scene.origin.x * fit,
        content_origin.x + (root_scene.origin.x + root_scene.size.x) * fit,
    );
    DeviceFrame {
        kind,
        frame,
        fit,
        content_origin,
        pinned,
        pinned_top,
        nav_top,
        content_span_x,
        viewport_h,
    }
}

pub fn scroll_max(frame: &DeviceFrame) -> f32 {
    (frame.nav_top - frame.viewport_h).max(0.0)
}

pub fn paint_corner_notches(
    backend: &mut dyn op_editor_ui::RenderBackend,
    frame: Rect,
    radius: f32,
    mask: Color,
) {
    let half = radius / 2.0;
    let inflated = Rect {
        origin: Point2D::new(frame.origin.x - half, frame.origin.y - half),
        size: Point2D::new(frame.size.x + radius, frame.size.y + radius),
    };
    backend.stroke_round_rect(inflated, radius + half, mask, radius);
}
