//! Figma transition easing curves and screen-level composite transforms.

use super::smart_animate::SmartAnimateLayer;
use jian_ops_schema::prototype::{
    EasingKind, PrototypeEasing, PrototypeTransition, PrototypeTransitionType, TransitionDirection,
};

/// Active transition state evaluated at a timestamp.
#[derive(Debug, Clone, PartialEq)]
pub struct TransitionFrame {
    pub from_screen_id: String,
    pub to_screen_id: String,
    pub kind: PrototypeTransitionType,
    pub direction: Option<TransitionDirection>,
    /// Linear progress `0.0..=1.0`.
    pub progress: f32,
    /// Eased progress (may overshoot slightly for back/spring curves).
    pub eased: f32,
    /// Screen-local translation `(dx, dy)` for the outgoing screen.
    pub from_offset: (f32, f32),
    pub from_opacity: f32,
    /// Screen-local translation `(dx, dy)` for the incoming screen.
    pub to_offset: (f32, f32),
    pub to_opacity: f32,
    /// True when the incoming screen paints on top of the outgoing screen.
    pub to_on_top: bool,
    /// Matched layer interpolations when `kind == SmartAnimate`.
    pub smart_layers: Vec<SmartAnimateLayer>,
}

/// Evaluate a Figma easing curve at normalized time `t` (`0.0..=1.0`).
pub fn eval_easing(easing: Option<&PrototypeEasing>, t: f32) -> f32 {
    let t = t.clamp(0.0, 1.0);
    let Some(easing) = easing else {
        return cubic_bezier(0.42, 0.0, 0.58, 1.0, t);
    };
    match easing.kind {
        EasingKind::Linear => t,
        EasingKind::EaseIn => cubic_bezier(0.42, 0.0, 1.0, 1.0, t),
        EasingKind::EaseOut => cubic_bezier(0.0, 0.0, 0.58, 1.0, t),
        EasingKind::EaseInAndOut => cubic_bezier(0.42, 0.0, 0.58, 1.0, t),
        EasingKind::EaseInBack => cubic_bezier(0.3, -0.05, 0.7, -0.5, t),
        EasingKind::EaseOutBack => cubic_bezier(0.45, 1.45, 0.8, 1.0, t),
        EasingKind::EaseInAndOutBack => cubic_bezier(0.7, -0.4, 0.4, 1.4, t),
        EasingKind::CustomCubicBezier => {
            if let Some([x1, y1, x2, y2]) = easing.bezier {
                cubic_bezier(x1 as f32, y1 as f32, x2 as f32, y2 as f32, t)
            } else {
                cubic_bezier(0.42, 0.0, 0.58, 1.0, t)
            }
        }
        EasingKind::Gentle => damped_spring(t, 0.85, 6.5),
        EasingKind::Quick => damped_spring(t, 0.82, 8.5),
        EasingKind::Bouncy => damped_spring(t, 0.55, 9.5),
        EasingKind::Slow => damped_spring(t, 0.9, 5.0),
        EasingKind::CustomSpring => damped_spring(t, 0.75, 7.5),
    }
}

fn cubic_bezier(x1: f32, y1: f32, x2: f32, y2: f32, t: f32) -> f32 {
    if t <= 0.0 {
        return 0.0;
    }
    if t >= 1.0 {
        return 1.0;
    }
    let sample_x = |u: f32| -> f32 {
        let inv = 1.0 - u;
        3.0 * inv * inv * u * x1 + 3.0 * inv * u * u * x2 + u * u * u
    };
    let sample_dx = |u: f32| -> f32 {
        let inv = 1.0 - u;
        3.0 * inv * inv * x1 + 6.0 * inv * u * (x2 - x1) + 3.0 * u * u * (1.0 - x2)
    };
    let sample_y = |u: f32| -> f32 {
        let inv = 1.0 - u;
        3.0 * inv * inv * u * y1 + 3.0 * inv * u * u * y2 + u * u * u
    };
    let mut u = t;
    for _ in 0..6 {
        let err = sample_x(u) - t;
        if err.abs() < 1e-5 {
            break;
        }
        let d = sample_dx(u);
        if d.abs() < 1e-5 {
            break;
        }
        u = (u - err / d).clamp(0.0, 1.0);
    }
    sample_y(u)
}

fn damped_spring(t: f32, zeta: f32, omega: f32) -> f32 {
    if t <= 0.0 {
        return 0.0;
    }
    if t >= 1.0 {
        return 1.0;
    }
    let decay = (-zeta * omega * t).exp();
    let wd = omega * (1.0 - zeta * zeta).max(0.01).sqrt();
    1.0 - decay * ((wd * t).cos() + (zeta * omega / wd) * (wd * t).sin())
}

fn direction_vector(dir: Option<TransitionDirection>, w: f32, h: f32) -> (f32, f32) {
    match dir.unwrap_or(TransitionDirection::Left) {
        // "LEFT" in Figma Move/Push/Slide means incoming screen moves toward Left
        // (entering from the right edge `+w`).
        TransitionDirection::Left => (w, 0.0),
        TransitionDirection::Right => (-w, 0.0),
        TransitionDirection::Top => (0.0, h),
        TransitionDirection::Bottom => (0.0, -h),
    }
}

/// Compute the composite transition frame for two screens of size `(w, h)`.
pub fn compute_transition_frame(
    from_screen_id: &str,
    to_screen_id: &str,
    screen_size: (f32, f32),
    transition: &PrototypeTransition,
    progress: f32,
    smart_layers: Vec<SmartAnimateLayer>,
) -> TransitionFrame {
    let progress = progress.clamp(0.0, 1.0);
    let eased = eval_easing(transition.easing.as_ref(), progress);
    let (w, h) = (screen_size.0.max(1.0), screen_size.1.max(1.0));
    let (vx, vy) = direction_vector(transition.direction, w, h);

    let (from_offset, from_opacity, to_offset, to_opacity, to_on_top) = match transition.kind {
        PrototypeTransitionType::Instant => ((0.0, 0.0), 0.0, (0.0, 0.0), 1.0, true),
        PrototypeTransitionType::Dissolve | PrototypeTransitionType::ScrollAnimate => {
            ((0.0, 0.0), 1.0, (0.0, 0.0), eased.clamp(0.0, 1.0), true)
        }
        PrototypeTransitionType::SmartAnimate => (
            (0.0, 0.0),
            (1.0 - eased).clamp(0.0, 1.0),
            (0.0, 0.0),
            eased.clamp(0.0, 1.0),
            true,
        ),
        PrototypeTransitionType::MoveIn => (
            (0.0, 0.0),
            1.0,
            (vx * (1.0 - eased), vy * (1.0 - eased)),
            1.0,
            true,
        ),
        PrototypeTransitionType::MoveOut => {
            ((-vx * eased, -vy * eased), 1.0, (0.0, 0.0), 1.0, false)
        }
        PrototypeTransitionType::Push => (
            (-vx * eased, -vy * eased),
            1.0,
            (vx * (1.0 - eased), vy * (1.0 - eased)),
            1.0,
            true,
        ),
        PrototypeTransitionType::SlideIn => (
            (-vx * 0.3 * eased, -vy * 0.3 * eased),
            (1.0 - 0.5 * eased).clamp(0.0, 1.0),
            (vx * (1.0 - eased), vy * (1.0 - eased)),
            1.0,
            true,
        ),
        PrototypeTransitionType::SlideOut => (
            (-vx * eased, -vy * eased),
            1.0,
            (vx * 0.3 * (1.0 - eased), vy * 0.3 * (1.0 - eased)),
            (0.5 + 0.5 * eased).clamp(0.0, 1.0),
            false,
        ),
    };

    let interpolated_layers = smart_layers
        .into_iter()
        .map(|layer| layer.at(eased))
        .collect();

    TransitionFrame {
        from_screen_id: from_screen_id.to_string(),
        to_screen_id: to_screen_id.to_string(),
        kind: transition.kind,
        direction: transition.direction,
        progress,
        eased,
        from_offset,
        from_opacity,
        to_offset,
        to_opacity,
        to_on_top,
        smart_layers: interpolated_layers,
    }
}
