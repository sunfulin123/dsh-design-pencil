//! Document-only screenshot rendering for the `get_screenshot` MCP tool.

use super::WidgetHost;
use op_editor_ui::layout_scene::{LayoutScene, SceneNode};
use op_editor_ui::widgets::scene_paint_options::{paint_scene_page_with, PaintSceneOptions};
use op_editor_ui::widgets::{CanvasViewport, PaintCx};
use op_editor_ui::{Point2D, Rect, RenderBackend};

/// Document-space padding around a whole-page capture.
const PAGE_MARGIN: f32 = 16.0;

/// Output geometry of one capture: document `origin` maps to pixel (0, 0).
#[derive(Debug, Clone, PartialEq)]
pub(crate) struct ScreenshotPlan {
    pub origin: Point2D,
    pub width: u32,
    pub height: u32,
    pub scale: f32,
    pub only_root: Option<String>,
    /// Resolved capture target (`None` for a whole page).
    pub target_id: Option<String>,
    /// Paint from the off-screen page scene built for this capture.
    pub off_page: bool,
}

/// `nodeId` value that captures the whole active page.
pub(crate) const PAGE_TARGET: &str = "page";

/// Fits `bounds` at `scale`, shrinking the scale so the longest edge stays
/// within `max_size` pixels.
pub(crate) fn plan_capture(
    bounds: Rect,
    scale: f32,
    max_size: u32,
) -> Result<(u32, u32, f32), String> {
    let (w, h) = (bounds.size.x, bounds.size.y);
    if !(w.is_finite() && h.is_finite() && w > 0.0 && h > 0.0) {
        return Err("Screenshot target has no rendered area".into());
    }
    if !(scale.is_finite() && scale > 0.0) || max_size == 0 {
        return Err("Screenshot scale and maxSize must be positive".into());
    }
    let longest = w.max(h);
    let scale = scale.min(max_size as f32 / longest);
    let width = ((w * scale).ceil() as u32).clamp(1, max_size);
    let height = ((h * scale).ceil() as u32).clamp(1, max_size);
    Ok((width, height, scale))
}

fn visible(nodes: &[SceneNode], id: &str) -> bool {
    nodes
        .iter()
        .any(|node| !node.hidden && (node.id == id || visible(node.visible_children(), id)))
}

/// Resolves the capture region: a node's rendered bounds; without a node,
/// the first visible board (what an agent just designed); for
/// [`PAGE_TARGET`], the union of all visible page roots plus a margin.
/// A nested node normally includes whatever overlaps its bounds; `isolate`
/// paints only its subtree, like a Figma node export.
pub(crate) fn capture_target(
    scene: &LayoutScene,
    node_id: Option<&str>,
    isolate: bool,
) -> Result<(Rect, Option<String>), String> {
    let page = scene
        .active_page()
        .ok_or("There is no active design page to capture")?;
    let first_board = page
        .children
        .iter()
        .find(|node| !node.hidden)
        .map(|node| node.id.clone());
    let node_id = match node_id {
        Some(PAGE_TARGET) => None,
        Some(id) => Some(id.to_owned()),
        None => Some(first_board.ok_or("The active page has no visible content to capture")?),
    };
    match node_id.as_deref() {
        Some(id) => {
            if !visible(&page.children, id) {
                return Err(format!("Node {id} is not visible on the active page"));
            }
            let bounds = op_editor_ui::widgets::canvas_rulers::selection_bounds(
                scene,
                &[id.to_owned()],
                None,
            )
            .ok_or("Screenshot node has no rendered bounds")?;
            let is_root = page.children.iter().any(|node| node.id == id);
            Ok((bounds, (isolate || is_root).then(|| id.to_owned())))
        }
        None => {
            let roots: Vec<String> = page
                .children
                .iter()
                .filter(|node| !node.hidden)
                .map(|node| node.id.clone())
                .collect();
            let bounds =
                op_editor_ui::widgets::canvas_rulers::selection_bounds(scene, &roots, None)
                    .ok_or("The active page has no visible content to capture")?;
            Ok((
                Rect::xywh(
                    bounds.origin.x - PAGE_MARGIN,
                    bounds.origin.y - PAGE_MARGIN,
                    bounds.size.x + PAGE_MARGIN * 2.0,
                    bounds.size.y + PAGE_MARGIN * 2.0,
                ),
                None,
            ))
        }
    }
}

impl WidgetHost {
    pub(crate) fn prepare_screenshot(
        &mut self,
        node_id: Option<&str>,
        scale: f32,
        max_size: u32,
        isolate: bool,
    ) -> Result<ScreenshotPlan, String> {
        if self.editor_state.editor_ui.preview.mode {
            return Err("Exit preview mode before capturing the design canvas".into());
        }
        self.refresh_layout_scene();
        self.screenshot_scene = None;
        let target = node_id.filter(|id| *id != PAGE_TARGET);
        let on_active_page = target.is_none_or(|id| {
            self.layout_scene
                .active_page()
                .is_some_and(|page| visible(&page.children, id))
        });
        let off_page = !on_active_page;
        if off_page {
            let id = target.unwrap_or_default();
            let page_index = self
                .editor_state
                .doc
                .pages
                .iter()
                .flatten()
                .position(|page| {
                    op_editor_core::walkers::find_node(
                        &page.children,
                        &op_editor_core::NodeId::new(id),
                    )
                    .is_some()
                })
                .ok_or_else(|| format!("Node {id} was not found on any page"))?;
            self.screenshot_scene = Some(op_pen_loader::editor_state_to_page_layout_scene(
                &self.editor_state,
                page_index,
            ));
        }
        let scene = self.screenshot_scene.as_ref().unwrap_or(&self.layout_scene);
        let preferred = if node_id.is_none() {
            use jian_ops_schema::node::PenNode;
            use op_editor_core::PenNodeExt;
            self.editor_state
                .active_children()
                .iter()
                .find(|node| {
                    let permitted = matches!(node, PenNode::Frame(frame)
                    if op_editor_core::prototype::graph::is_valid_screen_frame(frame));
                    permitted
                        && scene
                            .active_page()
                            .is_some_and(|page| visible(&page.children, node.id_str()))
                })
                .map(|node| node.id_str().to_owned())
        } else {
            None
        };
        let capture_node = node_id.or(preferred.as_deref());
        let (bounds, only_root) = capture_target(scene, capture_node, isolate)?;
        let target_id = match capture_node {
            Some(PAGE_TARGET) => None,
            Some(id) => Some(id.to_owned()),
            None => only_root.clone(),
        };
        let (width, height, scale) = plan_capture(bounds, scale, max_size)?;
        Ok(ScreenshotPlan {
            origin: bounds.origin,
            width,
            height,
            scale,
            only_root,
            target_id,
            off_page,
        })
    }

    /// Paints the plan's region into a `width`×`height` target at (0, 0),
    /// without editor chrome, grid or selection.
    pub(crate) fn paint_screenshot(
        &mut self,
        backend: &mut dyn RenderBackend,
        plan: &ScreenshotPlan,
        canvas_background: bool,
    ) -> Result<(), String> {
        let off_page_scene = if plan.off_page {
            self.screenshot_scene.take()
        } else {
            None
        };
        let scene = off_page_scene.as_ref().unwrap_or(&self.layout_scene);
        let page = scene
            .active_page()
            .ok_or("There is no active design page to capture")?;
        let target = Rect::xywh(0.0, 0.0, plan.width as f32, plan.height as f32);
        backend.save();
        backend.clip_rect(target);
        if canvas_background {
            let background = CanvasViewport::from_editor(&self.editor_state, &self.layout_scene)
                .canvas_background;
            backend.fill_rect(target, background);
        }
        paint_scene_page_with(
            &mut PaintCx { backend },
            page,
            Point2D::new(-plan.origin.x * plan.scale, -plan.origin.y * plan.scale),
            plan.scale,
            target,
            PaintSceneOptions {
                only_root: plan.only_root.as_deref(),
                skip_node: None,
            },
        );
        backend.restore();
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use op_editor_ui::layout_scene::{NodeKind, ScenePage};

    fn scene() -> LayoutScene {
        let mut screen = SceneNode::leaf("screen", NodeKind::Frame);
        screen.bounds = Rect::xywh(100.0, 50.0, 400.0, 200.0);
        let mut child = SceneNode::leaf("child", NodeKind::Rect);
        // Scene bounds are absolute page coordinates.
        child.bounds = Rect::xywh(110.0, 70.0, 40.0, 30.0);
        screen.children.push(child);
        let mut hidden = SceneNode::leaf("hidden", NodeKind::Rect);
        hidden.bounds = Rect::xywh(5000.0, 5000.0, 10.0, 10.0);
        hidden.hidden = true;
        LayoutScene {
            active_page_index: 0,
            pages: vec![ScenePage {
                id: "p".into(),
                name: "Page".into(),
                children: vec![screen, hidden],
            }],
        }
    }

    #[test]
    fn plan_scales_and_caps_the_longest_edge() {
        let bounds = Rect::xywh(0.0, 0.0, 400.0, 200.0);
        assert_eq!(plan_capture(bounds, 2.0, 1600).unwrap(), (800, 400, 2.0));
        assert_eq!(plan_capture(bounds, 2.0, 200).unwrap(), (200, 100, 0.5));
        assert_eq!(
            plan_capture(Rect::xywh(0.0, 0.0, 0.2, 0.2), 1.0, 64).unwrap(),
            (1, 1, 1.0)
        );
        assert!(plan_capture(Rect::xywh(0.0, 0.0, 0.0, 10.0), 1.0, 64).is_err());
        assert!(plan_capture(bounds, f32::NAN, 64).is_err());
    }

    #[test]
    fn root_nodes_capture_in_isolation_and_nested_nodes_use_rendered_bounds() {
        let scene = scene();
        let (bounds, only_root) = capture_target(&scene, Some("screen"), false).unwrap();
        assert_eq!(bounds, Rect::xywh(100.0, 50.0, 400.0, 200.0));
        assert_eq!(only_root.as_deref(), Some("screen"));
        let (bounds, only_root) = capture_target(&scene, Some("child"), false).unwrap();
        assert_eq!(bounds, Rect::xywh(110.0, 70.0, 40.0, 30.0));
        assert_eq!(only_root, None);
    }

    #[test]
    fn isolated_nested_captures_paint_only_their_subtree_like_figma_exports() {
        let (bounds, only_root) = capture_target(&scene(), Some("child"), true).unwrap();
        assert_eq!(bounds, Rect::xywh(110.0, 70.0, 40.0, 30.0));
        assert_eq!(only_root.as_deref(), Some("child"));
        let (_, page) = capture_target(&scene(), Some(PAGE_TARGET), true).unwrap();
        assert_eq!(
            page, None,
            "a page capture has no single subtree to isolate"
        );
    }

    #[test]
    fn default_capture_is_the_first_visible_board() {
        let (bounds, only_root) = capture_target(&scene(), None, false).unwrap();
        assert_eq!(bounds, Rect::xywh(100.0, 50.0, 400.0, 200.0));
        assert_eq!(only_root.as_deref(), Some("screen"));
    }

    #[test]
    fn default_capture_prefers_screen_to_component_master_but_explicit_target_works() {
        let mut host = WidgetHost::new();
        let doc = jian_ops_schema::load_str(
            r#"{"version":"1.0.0","children":[
            {"type":"frame","id":"master","reusable":true,"width":200,"height":50},
            {"type":"frame","id":"screen","x":300,"width":800,"height":600}
        ]}"#,
        )
        .unwrap()
        .value;
        host.editor_state = op_editor_core::EditorState::from_document(doc);
        host.editor_state_dirty = true;
        assert_eq!(
            host.prepare_screenshot(None, 1.0, 1600, false)
                .unwrap()
                .target_id
                .as_deref(),
            Some("screen")
        );
        assert_eq!(
            host.prepare_screenshot(Some("master"), 1.0, 1600, false)
                .unwrap()
                .target_id
                .as_deref(),
            Some("master")
        );
    }

    #[test]
    fn default_capture_falls_back_when_only_a_component_master_exists() {
        let doc = jian_ops_schema::load_str(
            r#"{"version":"1.0.0","children":[
            {"type":"frame","id":"master","reusable":true,"width":200,"height":50}
        ]}"#,
        )
        .unwrap()
        .value;
        let mut host = WidgetHost::new();
        host.editor_state = op_editor_core::EditorState::from_document(doc);
        host.editor_state_dirty = true;
        assert_eq!(
            host.prepare_screenshot(None, 1.0, 1600, false)
                .unwrap()
                .target_id
                .as_deref(),
            Some("master")
        );
    }

    #[test]
    fn page_capture_skips_hidden_roots_and_adds_margin() {
        let (bounds, only_root) = capture_target(&scene(), Some(PAGE_TARGET), false).unwrap();
        assert_eq!(bounds, Rect::xywh(84.0, 34.0, 432.0, 232.0));
        assert_eq!(only_root, None);
    }

    #[test]
    fn hidden_missing_and_empty_targets_fail_explicitly() {
        assert!(capture_target(&scene(), Some("hidden"), false).is_err());
        assert!(capture_target(&scene(), Some("missing"), false).is_err());
        let empty = LayoutScene {
            active_page_index: 0,
            pages: vec![ScenePage {
                id: "p".into(),
                name: "Page".into(),
                children: vec![],
            }],
        };
        assert!(capture_target(&empty, None, false).is_err());
        assert!(capture_target(&empty, Some(PAGE_TARGET), false).is_err());
    }

    #[test]
    fn nodes_on_other_pages_capture_from_their_own_scene() {
        let mut host = WidgetHost::new();
        let doc = jian_ops_schema::load_str(
            r#"{"version":"1.0.0","children":[],"pages":[
                {"id":"p1","name":"One","children":[
                    {"type":"rectangle","id":"near","x":0,"y":0,"width":100,"height":100}]},
                {"id":"p2","name":"Two","children":[
                    {"type":"frame","id":"far","x":40,"y":30,"width":300,"height":200,"children":[]}]}
            ]}"#,
        )
        .expect("fixture parses")
        .value;
        host.editor_state = op_editor_core::EditorState::from_document(doc);
        host.editor_state_dirty = true;
        let plan = host
            .prepare_screenshot(Some("far"), 1.0, 1600, false)
            .expect("off-page capture");
        assert!(plan.off_page);
        assert_eq!(plan.target_id.as_deref(), Some("far"));
        assert_eq!((plan.width, plan.height), (300, 200));
        assert_eq!(
            host.editor_state.ui.active_page_index, 0,
            "the editor stays on its page"
        );
        let default = host
            .prepare_screenshot(None, 1.0, 1600, false)
            .expect("default capture");
        assert!(!default.off_page);
        assert_eq!(default.target_id.as_deref(), Some("near"));
        assert!(host
            .prepare_screenshot(Some("missing"), 1.0, 1600, false)
            .is_err());
    }
}
