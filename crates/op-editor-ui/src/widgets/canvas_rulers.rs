use crate::theme::Theme;
use crate::{Color, Point2D, Rect, RenderBackend, TextLayout};
use op_editor_core::Viewport;

pub const RULER_SIZE: f32 = 24.0;

pub fn enabled(state: &op_editor_core::EditorState) -> bool {
    state.editor_ui.embed == op_editor_core::EmbedHost::VsCode
        && state.editor_ui.host_theme_override.is_some()
        && !state.editor_ui.touch_chrome()
}

pub fn contains(canvas: Rect, point: Point2D) -> bool {
    canvas.contains(point)
        && (point.x < canvas.origin.x + RULER_SIZE || point.y < canvas.origin.y + RULER_SIZE)
}

pub fn selection_bounds(
    scene: &crate::layout_scene::LayoutScene,
    ids: &[String],
    overlay: Option<&super::CanvasNodeDragOverlay>,
) -> Option<Rect> {
    fn visit(
        node: &crate::layout_scene::SceneNode,
        ids: &[String],
        overlay: Option<&super::CanvasNodeDragOverlay>,
        transforms: &mut Vec<super::canvas_overlay_transform::OverlayTransform>,
        bounds: &mut crate::scene_bounds::BoundsAcc,
    ) {
        let rect = node.aggregate_bounds();
        transforms.push(super::canvas_overlay_transform::OverlayTransform {
            rotation: node.rotation,
            flip_x: node.flip_x,
            flip_y: node.flip_y,
            pivot: Point2D::new(
                rect.origin.x + rect.size.x / 2.0,
                rect.origin.y + rect.size.y / 2.0,
            ),
        });
        if ids.contains(&node.id) {
            let drag = overlay.filter(|drag| drag.node_id == node.id);
            for (horizontal, vertical) in [(0.0, 0.0), (1.0, 0.0), (1.0, 1.0), (0.0, 1.0)] {
                let mut point = Point2D::new(
                    rect.origin.x + horizontal * rect.size.x,
                    rect.origin.y + vertical * rect.size.y,
                );
                for transform in transforms.iter().rev() {
                    point = super::canvas_viewport::rotate_point(
                        point,
                        transform.pivot,
                        transform.rotation,
                    );
                    if transform.flip_x {
                        point.x = transform.pivot.x * 2.0 - point.x;
                    }
                    if transform.flip_y {
                        point.y = transform.pivot.y * 2.0 - point.y;
                    }
                }
                if let Some(drag) = drag {
                    point.x += drag.target_origin_doc.x - rect.origin.x;
                    point.y += drag.target_origin_doc.y - rect.origin.y;
                }
                bounds.add(point.x, point.y, point.x, point.y);
            }
        }
        for child in &node.children {
            visit(child, ids, overlay, transforms, bounds);
        }
        transforms.pop();
    }
    let mut bounds = crate::scene_bounds::BoundsAcc::new();
    if let Some(page) = scene.active_page() {
        for node in &page.children {
            visit(node, ids, overlay, &mut Vec::new(), &mut bounds);
        }
    }
    bounds.into_rect()
}

fn tick_step(zoom: f32) -> f32 {
    let target = 80.0 / zoom;
    let magnitude = 10.0_f32.powf(target.log10().floor());
    [1.0, 2.0, 5.0, 10.0]
        .into_iter()
        .find(|factor| magnitude * factor >= target)
        .unwrap_or(10.0)
        * magnitude
}

fn axis_ticks(pan: f32, zoom: f32, length: f32) -> Vec<(f32, f32)> {
    if !pan.is_finite() || !zoom.is_finite() || zoom <= 0.0 || !length.is_finite() || length <= 0.0
    {
        return Vec::new();
    }
    let step = tick_step(zoom);
    if !step.is_finite() || step <= 0.0 {
        return Vec::new();
    }
    let first = ((RULER_SIZE - pan) / zoom / step).ceil() * step;
    (0..((length / (step * zoom)).ceil() as usize + 2).min(512))
        .map(|index| {
            let value = first + index as f32 * step;
            (value, pan + value * zoom)
        })
        .filter(|(_, position)| *position >= RULER_SIZE && *position <= length)
        .collect()
}

fn project_bounds(canvas: Rect, viewport: &Viewport, bounds: Rect) -> Rect {
    Rect::xywh(
        canvas.origin.x + viewport.pan_x + bounds.origin.x * viewport.zoom,
        canvas.origin.y + viewport.pan_y + bounds.origin.y * viewport.zoom,
        bounds.size.x * viewport.zoom,
        bounds.size.y * viewport.zoom,
    )
}

pub fn paint(
    backend: &mut dyn RenderBackend,
    theme: &Theme,
    canvas: Rect,
    viewport: &Viewport,
    selection: Option<Rect>,
) {
    if canvas.size.x <= RULER_SIZE
        || canvas.size.y <= RULER_SIZE
        || !viewport.zoom.is_finite()
        || viewport.zoom <= 0.0
    {
        return;
    }
    let projection = selection.map(|bounds| project_bounds(canvas, viewport, bounds));
    backend.save();
    backend.clip_rect(canvas);
    for horizontal in [true, false] {
        let strip = if horizontal {
            Rect::xywh(
                canvas.origin.x + RULER_SIZE,
                canvas.origin.y,
                canvas.size.x - RULER_SIZE,
                RULER_SIZE,
            )
        } else {
            Rect::xywh(
                canvas.origin.x,
                canvas.origin.y + RULER_SIZE,
                RULER_SIZE,
                canvas.size.y - RULER_SIZE,
            )
        };
        backend.save();
        backend.clip_rect(strip);
        backend.fill_rect(strip, theme.card);
        let length = if horizontal {
            canvas.size.x
        } else {
            canvas.size.y
        };
        let pan = if horizontal {
            viewport.pan_x
        } else {
            viewport.pan_y
        };
        if let Some(projected) = projection {
            let wash = if horizontal {
                Rect::xywh(
                    projected.origin.x,
                    canvas.origin.y,
                    projected.size.x,
                    RULER_SIZE,
                )
            } else {
                Rect::xywh(
                    canvas.origin.x,
                    projected.origin.y,
                    RULER_SIZE,
                    projected.size.y,
                )
            };
            backend.fill_rect(wash, theme.primary.with_alpha(0.22));
        }
        let major = tick_step(viewport.zoom);
        let minor = major / 10.0;
        if viewport.zoom.is_finite()
            && viewport.zoom > 0.0
            && pan.is_finite()
            && minor.is_finite()
            && minor > 0.0
        {
            let first = ((RULER_SIZE - pan) / viewport.zoom / minor).ceil() * minor;
            for index in 0..((length / (minor * viewport.zoom)).ceil() as usize + 2).min(2048) {
                let value = first + index as f32 * minor;
                let position = pan + value * viewport.zoom;
                if position > length {
                    break;
                }
                let tick = if horizontal {
                    Rect::xywh(
                        canvas.origin.x + position,
                        canvas.origin.y + RULER_SIZE - 5.0,
                        1.0,
                        5.0,
                    )
                } else {
                    Rect::xywh(
                        canvas.origin.x + RULER_SIZE - 5.0,
                        canvas.origin.y + position,
                        5.0,
                        1.0,
                    )
                };
                backend.fill_rect(tick, theme.muted_foreground.with_alpha(0.55));
            }
        }
        for (value, position) in axis_ticks(pan, viewport.zoom, length) {
            let origin = if horizontal {
                Point2D::new(canvas.origin.x + position + 3.0, canvas.origin.y + 3.0)
            } else {
                Point2D::new(canvas.origin.x + 21.0, canvas.origin.y + position + 3.0)
            };
            draw_label(
                backend,
                &format!("{value:.0}"),
                origin,
                theme.muted_foreground,
                !horizontal,
                None,
            );
        }
        if let (Some(bounds), Some(projected)) = (selection, projection) {
            let (start, end, value_start, value_end) = if horizontal {
                (
                    projected.origin.x,
                    projected.origin.x + projected.size.x,
                    bounds.origin.x,
                    bounds.origin.x + bounds.size.x,
                )
            } else {
                (
                    projected.origin.y,
                    projected.origin.y + projected.size.y,
                    bounds.origin.y,
                    bounds.origin.y + bounds.size.y,
                )
            };
            let start_label = format!("{value_start:.0}");
            let end_label = format!("{value_end:.0}");
            let minimum_gap = backend.measure_text(&start_label, 10.0)
                + backend.measure_text(&end_label, 10.0)
                + 20.0;
            let endpoints = if end - start < minimum_gap {
                vec![(start, format!("{value_start:.0} / {value_end:.0}"))]
            } else {
                vec![(start, start_label), (end, end_label)]
            };
            for (position, label) in endpoints {
                let base = if horizontal {
                    canvas.origin.x
                } else {
                    canvas.origin.y
                };
                if position < base + RULER_SIZE || position > base + length {
                    continue;
                }
                let text_width = backend.measure_text(&label, 10.0) + 8.0;
                let bounded = position.clamp(
                    base + RULER_SIZE,
                    (base + length - text_width).max(base + RULER_SIZE),
                );
                let origin = if horizontal {
                    Point2D::new(bounded, canvas.origin.y + 3.0)
                } else {
                    Point2D::new(canvas.origin.x + 21.0, bounded)
                };
                draw_label(
                    backend,
                    &label,
                    origin,
                    theme.primary_foreground,
                    !horizontal,
                    Some(theme.primary),
                );
            }
        }
        backend.restore();
    }
    backend.fill_rect(
        Rect::xywh(canvas.origin.x, canvas.origin.y, RULER_SIZE, RULER_SIZE),
        theme.card,
    );
    backend.fill_rect(
        Rect::xywh(
            canvas.origin.x,
            canvas.origin.y + RULER_SIZE - 1.0,
            canvas.size.x,
            1.0,
        ),
        theme.border,
    );
    backend.fill_rect(
        Rect::xywh(
            canvas.origin.x + RULER_SIZE - 1.0,
            canvas.origin.y,
            1.0,
            canvas.size.y,
        ),
        theme.border,
    );
    backend.restore();
}

fn draw_label(
    backend: &mut dyn RenderBackend,
    label: &str,
    origin: Point2D,
    color: Color,
    vertical: bool,
    highlight: Option<Color>,
) {
    backend.save();
    if vertical {
        backend.rotate(std::f32::consts::FRAC_PI_2, origin);
    }
    if let Some(background) = highlight {
        let width = backend.measure_text(label, 10.0) + 8.0;
        backend.fill_round_rect(Rect::xywh(origin.x, origin.y, width, 18.0), 3.0, background);
    }
    let text = TextLayout::single_run(
        label,
        "system-ui",
        10.0,
        jian_core::scene::Color::rgba(
            (color.r * 255.0) as u8,
            (color.g * 255.0) as u8,
            (color.b * 255.0) as u8,
            255,
        ),
        Point2D::new(0.0, 0.0),
    );
    backend.draw_text(
        &text,
        Point2D::new(
            origin.x + if highlight.is_some() { 4.0 } else { 0.0 },
            origin.y + 12.0,
        ),
    );
    backend.restore();
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn ruler_scene_bounds_union_rotated_selection_and_follow_overlay() {
        use crate::layout_scene::{LayoutScene, NodeKind, SceneNode, ScenePage};
        let mut node = SceneNode::leaf("selected", NodeKind::Rect);
        node.bounds = Rect::xywh(100.0, 100.0, 100.0, 50.0);
        node.rotation = std::f32::consts::FRAC_PI_2;
        let mut other = SceneNode::leaf("other", NodeKind::Rect);
        other.bounds = Rect::xywh(300.0, 200.0, 40.0, 40.0);
        let scene = LayoutScene {
            pages: vec![ScenePage {
                id: "page".into(),
                name: "Page".into(),
                children: vec![node, other],
            }],
            active_page_index: 0,
        };
        let ids = vec!["selected".to_string()];
        let bounds = selection_bounds(&scene, &ids, None).unwrap();
        assert!((bounds.origin.x - 125.0).abs() < 0.01);
        assert!((bounds.origin.y - 75.0).abs() < 0.01);
        assert!((bounds.size.x - 50.0).abs() < 0.01);
        let overlay = super::super::CanvasNodeDragOverlay {
            node_id: "selected".into(),
            target_origin_doc: Point2D::new(140.0, 120.0),
        };
        let moved = selection_bounds(&scene, &ids, Some(&overlay)).unwrap();
        assert!((moved.origin.x - 165.0).abs() < 0.01);
        let union = selection_bounds(&scene, &["selected".into(), "other".into()], None).unwrap();
        assert!((union.size.x - 215.0).abs() < 0.01);
        assert!((union.size.y - 165.0).abs() < 0.01);
        assert!(selection_bounds(&scene, &[], None).is_none());
    }

    #[test]
    fn ruler_paints_two_bands_and_coordinate_tags() {
        let theme = Theme::light();
        let mut backend = super::super::test_capture_backend::CaptureBackend::default();
        paint(
            &mut backend,
            &theme,
            Rect::xywh(0.0, 0.0, 600.0, 500.0),
            &Viewport::default(),
            Some(Rect::xywh(100.0, 80.0, 200.0, 160.0)),
        );
        let bands = backend
            .rect_fills
            .iter()
            .filter(|(_, color)| *color == theme.primary.with_alpha(0.22))
            .collect::<Vec<_>>();
        assert_eq!(bands.len(), 2);
        assert_eq!(bands[0].0, Rect::xywh(100.0, 0.0, 200.0, RULER_SIZE));
        assert_eq!(bands[1].0, Rect::xywh(0.0, 80.0, RULER_SIZE, 160.0));
        assert_eq!(backend.round_fills.len(), 4);
        assert!(contains(
            Rect::xywh(0.0, 0.0, 600.0, 500.0),
            Point2D::new(150.0, 10.0)
        ));
        assert!(!contains(
            Rect::xywh(0.0, 0.0, 600.0, 500.0),
            Point2D::new(150.0, 100.0)
        ));
    }

    #[test]
    fn ruler_ticks_adapt_to_zoom_and_negative_coordinates() {
        assert_eq!(tick_step(1.0), 100.0);
        assert_eq!(tick_step(0.1), 1000.0);
        assert_eq!(tick_step(10.0), 10.0);
        let ticks = axis_ticks(125.0, 1.0, 600.0);
        assert!(ticks
            .iter()
            .any(|(value, position)| *value == -100.0 && *position == 25.0));
        assert!(ticks
            .iter()
            .any(|(value, position)| *value == 0.0 && *position == 125.0));
        assert!(axis_ticks(0.0, 0.0, 600.0).is_empty());
    }

    #[test]
    fn ruler_selection_projection_tracks_drag_pan_and_zoom() {
        let viewport = Viewport {
            pan_x: 50.0,
            pan_y: -20.0,
            zoom: 2.0,
        };
        let canvas = Rect::xywh(240.0, 40.0, 700.0, 600.0);
        let bounds = Rect::xywh(-10.0, 30.0, 100.0, 50.0);
        assert_eq!(
            project_bounds(canvas, &viewport, bounds),
            Rect::xywh(270.0, 80.0, 200.0, 100.0)
        );
        let moved = Rect::xywh(20.0, 50.0, 100.0, 50.0);
        assert_eq!(
            project_bounds(canvas, &viewport, moved).origin,
            Point2D::new(330.0, 120.0)
        );
    }
}
