use super::WidgetHost;
use op_editor_ui::layout_scene::{LayoutScene, SceneNode};
use op_editor_ui::widgets::scene_paint_options::{paint_scene_page_with, PaintSceneOptions};
use op_editor_ui::widgets::{CanvasViewport, PaintCx};
use op_editor_ui::{Point2D, Rect, RenderBackend};

fn node_sample_point(scene: &LayoutScene, id: &str) -> Result<(f64, f64), String> {
    fn visible(nodes: &[SceneNode], id: &str) -> bool {
        nodes
            .iter()
            .any(|node| !node.hidden && (node.id == id || visible(node.visible_children(), id)))
    }
    let page = scene
        .active_page()
        .ok_or("There is no active design page")?;
    if !visible(&page.children, id) {
        return Err("Sample node is not visible on the active page".into());
    }
    let bounds =
        op_editor_ui::widgets::canvas_rulers::selection_bounds(scene, &[id.to_owned()], None)
            .ok_or("Sample node has no rendered bounds")?;
    Ok((
        f64::from(bounds.origin.x + bounds.size.x * 0.5),
        f64::from(bounds.origin.y + bounds.size.y * 0.5),
    ))
}

fn sample_screen_point(
    point: (f64, f64),
    canvas: Rect,
    viewport: op_editor_core::Viewport,
) -> Result<Point2D, String> {
    let (x, y) = (point.0 as f32, point.1 as f32);
    let screen = Point2D::new(
        canvas.origin.x + viewport.pan_x + x * viewport.zoom,
        canvas.origin.y + viewport.pan_y + y * viewport.zoom,
    );
    if !x.is_finite() || !y.is_finite() || !screen.x.is_finite() || !screen.y.is_finite() {
        return Err("Sample coordinates exceed the renderer's finite range".into());
    }
    if screen.x < canvas.origin.x
        || screen.y < canvas.origin.y
        || screen.x >= canvas.origin.x + canvas.size.x
        || screen.y >= canvas.origin.y + canvas.size.y
    {
        return Err(
            "Sample point is outside the visible design canvas; adjust the viewport and retry"
                .into(),
        );
    }
    Ok(screen)
}

impl WidgetHost {
    pub(crate) fn paint_color_sample(
        &mut self,
        backend: &mut dyn RenderBackend,
        width: f32,
        height: f32,
        point: Option<(f64, f64)>,
        node_id: Option<&str>,
    ) -> Result<(f64, f64, Point2D), String> {
        if self.editor_state.editor_ui.preview.mode {
            return Err("Exit preview mode before sampling the design canvas".into());
        }
        if self.layout_transition_active() {
            return Err("Wait for the canvas layout transition to finish before sampling".into());
        }
        self.refresh_layout_scene();
        let page = self
            .layout_scene
            .active_page()
            .ok_or("There is no active design page to sample")?;
        let point = match (point, node_id) {
            (Some(point), None) => point,
            (None, Some(id)) => node_sample_point(&self.layout_scene, id)?,
            _ => return Err("Provide either document-space x/y or nodeId".into()),
        };
        let scale = self.editor_state.editor_ui.ui_scale.factor();
        let (left, top, w, h) = self.canvas_region(width / scale, height / scale);
        let canvas = Rect::xywh(left * scale, top * scale, w * scale, h * scale);
        let viewport = self.editor_state.viewport;
        let screen = sample_screen_point(point, canvas, viewport)?;
        let background =
            CanvasViewport::from_editor(&self.editor_state, &self.layout_scene).canvas_background;
        backend.save();
        backend.clip_rect(canvas);
        backend.fill_rect(canvas, background);
        paint_scene_page_with(
            &mut PaintCx { backend },
            page,
            Point2D::new(
                canvas.origin.x + viewport.pan_x,
                canvas.origin.y + viewport.pan_y,
            ),
            viewport.zoom,
            canvas,
            PaintSceneOptions {
                only_root: None,
                skip_node: None,
            },
        );
        backend.restore();
        Ok((point.0, point.1, screen))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn node_centers_inherit_rendered_rotation_flips_and_ancestor_visibility() {
        use op_editor_ui::layout_scene::{NodeKind, ScenePage};

        let mut root = SceneNode::leaf("root", NodeKind::Frame);
        root.bounds = Rect::xywh(0.0, 0.0, 100.0, 100.0);
        root.rotation = std::f32::consts::FRAC_PI_2;
        let mut child = SceneNode::leaf("child", NodeKind::Rect);
        child.bounds = Rect::xywh(10.0, 40.0, 20.0, 20.0);
        root.children.push(child);
        let mut scene = LayoutScene {
            active_page_index: 0,
            pages: vec![ScenePage {
                id: "p".into(),
                name: "Page".into(),
                children: vec![root],
            }],
        };
        let (x, y) = node_sample_point(&scene, "child").unwrap();
        assert!((x - 50.0).abs() < 0.001);
        assert!((y - 20.0).abs() < 0.001);
        scene.pages[0].children[0].rotation = 0.0;
        scene.pages[0].children[0].flip_x = true;
        assert_eq!(node_sample_point(&scene, "child").unwrap(), (80.0, 50.0));
        scene.pages[0].children[0].hidden = true;
        assert!(node_sample_point(&scene, "child").is_err());
        assert!(node_sample_point(&scene, "missing").is_err());
    }

    #[test]
    fn sample_mapping_scales_only_chrome_not_camera_or_document_geometry() {
        let viewport = op_editor_core::Viewport {
            pan_x: 123.5,
            pan_y: -45.25,
            zoom: 1.25,
        };
        let point = sample_screen_point(
            (100.0, 100.0),
            Rect::xywh(360.0, 60.0, 920.0, 810.0),
            viewport,
        )
        .unwrap();
        assert_eq!(point, Point2D::new(608.5, 139.75));
    }

    #[test]
    fn sampler_rejects_nonfinite_and_offscreen_points_instead_of_sampling_chrome() {
        let canvas = Rect::xywh(240.0, 40.0, 800.0, 600.0);
        for point in [(f64::NAN, 1.0), (1e300, 1.0), (-1.0, 1.0), (800.0, 1.0)] {
            assert!(sample_screen_point(point, canvas, Default::default()).is_err());
        }
        assert_eq!(
            sample_screen_point((0.0, 0.0), canvas, Default::default()).unwrap(),
            Point2D::new(240.0, 40.0)
        );
    }
}
