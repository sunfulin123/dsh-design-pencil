//! Transient Page/frame navigation for browser preview; canonical editor state stays unchanged.

use op_editor_core::prototype::{zoom_about, PresentScaleMode, PresentViewport, PrototypeGraph};
use op_editor_ui::widgets::preview_toolbar::PreviewControl;
use op_editor_ui::Point2D;

use super::WidgetHost;

pub(super) struct PreviewFrameEntry {
    pub page: usize,
    pub page_label: String,
    pub section_name: Option<String>,
    pub id: String,
    pub name: String,
    pub screen: Option<String>,
}

#[derive(Default)]
pub(super) struct PreviewBrowserState {
    pub page: usize,
    pub frames: Vec<PreviewFrameEntry>,
    pub canvas_scene: Option<op_editor_ui::layout_scene::LayoutScene>,
    pub present: bool,
    pub scale_mode: PresentScaleMode,
    /// User zoom relative to the fitted scale; values below 1 mean "fit".
    pub zoom_factor: f32,
    /// Stage scroll offset in host pixels, clamped to the scaled screen.
    pub scroll: Point2D,
    pub list_open: bool,
    pub list_scroll: f32,
    pub hover: Option<PreviewControl>,
    pub pressed: Option<PreviewControl>,
    pub controls_captured: bool,
    pub inspection_position: Option<(f32, Point2D)>,
    pub last_activity_ms: u64,
    pub preferences: PreviewPreferences,
    preferences_loaded: bool,
}

#[derive(Default, serde::Serialize, serde::Deserialize)]
#[serde(default)]
pub(super) struct PreviewPreferences {
    pub scale_mode: Option<PresentScaleMode>,
}

impl WidgetHost {
    pub(super) fn browser_device_kind(&self) -> op_editor_core::PreviewDeviceKind {
        op_editor_core::PreviewDeviceKind::Canvas
    }

    pub(super) fn preview_active_scene_page(
        &self,
    ) -> Option<&op_editor_ui::layout_scene::ScenePage> {
        let page_idx = self.preview_browser.page;
        self.preview_browser
            .canvas_scene
            .as_ref()
            .and_then(|s| s.pages.get(page_idx))
            .filter(|p| !p.children.is_empty())
            .or_else(|| self.layout_scene.pages.get(page_idx))
    }

    pub(super) fn ensure_preview_screen_scene(&mut self, page_index: usize, screen_id: &str) {
        if self.preview_browser.canvas_scene.is_none() {
            let pages = match self
                .editor_state
                .doc
                .pages
                .as_ref()
                .filter(|p| !p.is_empty())
            {
                Some(doc_pages) => doc_pages
                    .iter()
                    .enumerate()
                    .map(|(i, p)| {
                        let children = self
                            .layout_scene
                            .pages
                            .get(i)
                            .filter(|sp| sp.id == p.id)
                            .map(|sp| sp.children.clone())
                            .unwrap_or_default();
                        op_editor_ui::layout_scene::ScenePage {
                            id: p.id.clone(),
                            name: p.name.clone(),
                            children,
                        }
                    })
                    .collect(),
                None => vec![op_editor_ui::layout_scene::ScenePage {
                    id: "page-0".into(),
                    name: "Page 1".into(),
                    children: self
                        .layout_scene
                        .pages
                        .first()
                        .map(|sp| sp.children.clone())
                        .unwrap_or_default(),
                }],
            };
            self.preview_browser.canvas_scene = Some(op_editor_ui::layout_scene::LayoutScene {
                pages,
                active_page_index: page_index,
            });
        }
        let already_built = self
            .preview_browser
            .canvas_scene
            .as_ref()
            .and_then(|s| s.pages.get(page_index))
            .is_some_and(|p| {
                crate::preview_host::paint::find_screen_scene_node(&p.children, screen_id).is_some()
            });
        if already_built {
            return;
        }
        let Some(screen_pen_node) =
            find_screen_pen_node(&self.editor_state.doc, page_index, screen_id)
        else {
            return;
        };
        let mut built = op_pen_loader::editor_state_roots_to_scene_nodes(
            &self.editor_state,
            page_index,
            std::slice::from_ref(&screen_pen_node),
        );
        if let Some(scene) = self.preview_browser.canvas_scene.as_mut() {
            if let Some(page) = scene.pages.get_mut(page_index) {
                page.children.append(&mut built);
            }
        }
    }

    pub(super) fn browser_frame_geometry(
        &self,
        canvas: op_editor_ui::Rect,
        root: op_editor_ui::Rect,
        nav: Option<op_editor_ui::Rect>,
        status: Option<op_editor_ui::Rect>,
    ) -> crate::preview_host::device_frame::DeviceFrame {
        let stage = self.preview_stage_rect(canvas);
        let size = (root.size.x.max(1.0), root.size.y.max(1.0));
        let vp = self.preview_viewport_for(stage, size);
        let frame_rect = op_editor_ui::Rect::xywh(
            stage.origin.x + vp.offset.0,
            stage.origin.y + vp.offset.1,
            vp.size.0,
            vp.size.1,
        );
        crate::preview_host::device_frame::compute_presentation_geometry(
            self.browser_device_kind(),
            frame_rect,
            root,
            size,
            nav,
            status,
        )
    }

    pub(super) fn preview_viewport_for(
        &self,
        stage: op_editor_ui::Rect,
        screen: (f32, f32),
    ) -> PresentViewport {
        PresentViewport::resolve(
            self.preview_browser.scale_mode,
            (stage.size.x, stage.size.y),
            screen,
            self.preview_browser.zoom_factor,
            (self.preview_browser.scroll.x, self.preview_browser.scroll.y),
        )
    }

    pub(super) fn preview_viewport(&self) -> PresentViewport {
        let canvas = self.preview_canvas_rect(self.last_viewport_w, self.last_viewport_h);
        self.preview_viewport_for(self.preview_stage_rect(canvas), self.preview_screen_size())
    }

    /// Zoom to the absolute fit-relative `factor` anchored at a host point,
    /// never below the fitted scale.
    pub(super) fn preview_zoom_to(&mut self, factor: f32, anchor: Option<Point2D>) {
        let canvas = self.preview_canvas_rect(self.last_viewport_w, self.last_viewport_h);
        let stage = self.preview_stage_rect(canvas);
        let local = anchor
            .filter(|p| stage.contains(*p))
            .map_or((stage.size.x / 2.0, stage.size.y / 2.0), |p| {
                (p.x - stage.origin.x, p.y - stage.origin.y)
            });
        let (zoom_factor, scroll) = zoom_about(
            self.preview_browser.scale_mode,
            (stage.size.x, stage.size.y),
            self.preview_screen_size(),
            (
                self.preview_browser.zoom_factor,
                (self.preview_browser.scroll.x, self.preview_browser.scroll.y),
            ),
            factor,
            local,
        );
        self.preview_browser.zoom_factor = zoom_factor;
        self.preview_browser.scroll = Point2D::new(scroll.0, scroll.1);
        self.recompute_device_frame(self.last_viewport_w, self.last_viewport_h);
        self.mark_dirty();
    }

    /// Back to the fitted scale with the screen scrolled to its top-left.
    pub(super) fn preview_reset_view(&mut self) {
        self.preview_browser.zoom_factor = 1.0;
        self.preview_browser.scroll = Point2D::new(0.0, 0.0);
    }

    /// Clip to the stage and fill it with the prototype background
    /// (page override, then document, then Figma's dark default).
    pub(super) fn paint_preview_stage_backdrop(
        &self,
        backend: &mut dyn op_editor_ui::RenderBackend,
        canvas: op_editor_ui::Rect,
    ) {
        let stage = self.preview_stage_rect(canvas);
        backend.clip_rect(stage);
        let doc = &self.editor_state.doc;
        let page_id = doc
            .pages
            .as_ref()
            .and_then(|pages| pages.get(self.preview_browser.page))
            .map(|page| page.id.as_str());
        let color = doc
            .prototype
            .as_ref()
            .and_then(|proto| {
                page_id
                    .and_then(|id| proto.pages.get(id))
                    .and_then(|page| page.background_color.as_deref())
                    .or(proto.background_color.as_deref())
            })
            .and_then(crate::preview_host::paint::parse_hex_color)
            .unwrap_or(op_editor_ui::Color {
                r: 0.118,
                g: 0.118,
                b: 0.118,
                a: 1.0,
            });
        backend.fill_rect(stage, color);
    }

    pub(super) fn preview_screen_size(&self) -> (f32, f32) {
        self.preview
            .as_ref()
            .and_then(|session| session.framed_root())
            .map(|(_, root)| (root.size.x, root.size.y))
            .unwrap_or((1.0, 1.0))
    }

    pub(crate) fn managed_preview_active(&self) -> bool {
        self.preview.is_some() && !self.preview_browser.frames.is_empty()
    }

    pub(super) fn preview_stage_rect(&self, canvas: op_editor_ui::Rect) -> op_editor_ui::Rect {
        if self.preview_browser.present {
            return canvas;
        }
        use op_editor_ui::widgets::preview_toolbar::PreviewToolbar;
        let top = PreviewToolbar::header_height(canvas);
        let bottom = PreviewToolbar::bottom_bar_height(canvas);
        let left = if self.preview_browser.list_open && canvas.size.x >= 600.0 {
            232.0
        } else {
            0.0
        };
        op_editor_ui::Rect::xywh(
            canvas.origin.x + left,
            canvas.origin.y + top,
            (canvas.size.x - left).max(1.0),
            (canvas.size.y - top - bottom).max(1.0),
        )
    }

    pub(super) fn initialize_preview_browser(&mut self, canvas_w: f32, canvas_h: f32) -> bool {
        let viewport = self
            .preview_editor_viewport
            .unwrap_or(self.editor_state.viewport);
        let center = Point2D::new(
            (canvas_w / 2.0 - viewport.pan_x) / viewport.zoom,
            (canvas_h / 2.0 - viewport.pan_y) / viewport.zoom,
        );
        let active_page = self.editor_state.ui.active_page_index;
        let selected = self.editor_state.selection.anchor.as_str();
        let graph = PrototypeGraph::from_document(&self.editor_state.doc);
        if graph.screens.is_empty() {
            self.reject_empty_preview();
            return false;
        }
        let Some(entry_id) = graph.resolve_entry_screen(
            active_page,
            (!selected.is_empty()).then_some(selected),
            &self.editor_state.doc,
            (center.x, center.y),
        ) else {
            self.reject_empty_preview();
            return false;
        };
        let entry_page = graph
            .screen(&entry_id)
            .map_or(active_page, |s| s.page_index);
        let frames: Vec<PreviewFrameEntry> = graph
            .screens
            .iter()
            .map(|s| PreviewFrameEntry {
                page: s.page_index,
                page_label: s.page_label.clone(),
                section_name: s.section_name.clone(),
                id: s.id.clone(),
                name: s.name.clone(),
                screen: s.route.clone(),
            })
            .collect();

        let Some(session) = self.preview.as_mut() else {
            return false;
        };
        if !session.select_preview_frame(&entry_id) {
            self.reject_empty_preview();
            return false;
        }
        session.player.entry_screen_id = entry_id.clone();

        self.preview_browser.page = entry_page;
        self.preview_browser.frames = frames;
        self.preview_editor_viewport = Some(viewport);
        self.preview_browser.canvas_scene = None;
        self.ensure_preview_screen_scene(entry_page, &entry_id);
        if !self.preview_browser.preferences_loaded {
            #[cfg(target_arch = "wasm32")]
            if let Some(preferences) = web_sys::window()
                .and_then(|window| window.local_storage().ok().flatten())
                .and_then(|storage| {
                    storage
                        .get_item("dsh-pencil.preview.preferences.v1")
                        .ok()
                        .flatten()
                })
                .and_then(|value| serde_json::from_str::<PreviewPreferences>(&value).ok())
            {
                self.preview_browser.preferences = preferences;
            }
            self.preview_browser.preferences_loaded = true;
        }
        self.preview_browser.scale_mode = self
            .preview_browser
            .preferences
            .scale_mode
            .unwrap_or(PresentScaleMode::FitWidth);
        self.preview_browser.list_scroll = 0.0;
        self.preview_reset_view();
        self.preview_browser.last_activity_ms = self.now_ms;
        true
    }

    pub(super) fn save_preview_preferences(&self) {
        #[cfg(target_arch = "wasm32")]
        if let (Some(storage), Ok(value)) = (
            web_sys::window().and_then(|window| window.local_storage().ok().flatten()),
            serde_json::to_string(&self.preview_browser.preferences),
        ) {
            let _ = storage.set_item("dsh-pencil.preview.preferences.v1", &value);
        }
    }

    pub(super) fn reject_empty_preview(&mut self) {
        self.editor_state.editor_ui.preview.mode = false;
        self.editor_state.editor_ui.show_toast(
            "preview.emptyPage",
            Vec::new(),
            op_editor_core::editor_toast::EditorToastLevel::Info,
            self.now_ms,
        );
        self.mark_dirty();
    }

    pub fn preview_navigation_step(&mut self, delta: i32) -> bool {
        let Some(current) = self
            .preview
            .as_ref()
            .and_then(|session| session.framed_root())
            .map(|root| root.0)
        else {
            return false;
        };
        let frames: Vec<_> = self
            .preview_browser
            .frames
            .iter()
            .filter(|frame| frame.page == self.preview_browser.page)
            .collect();
        let Some(index) = frames.iter().position(|frame| frame.id == current) else {
            return false;
        };
        let next = (index as i64 + i64::from(delta)).clamp(0, frames.len() as i64 - 1) as usize;
        if next == index {
            return false;
        }
        let page = frames[next].page;
        let id = frames[next].id.clone();
        self.preview_go_to_frame(page, &id)
    }

    pub(super) fn preview_go_to_frame(&mut self, page: usize, id: &str) -> bool {
        let Some(entry) = self
            .preview_browser
            .frames
            .iter()
            .find(|frame| frame.page == page && frame.id == id)
        else {
            return false;
        };
        let route = entry.screen.clone();
        let app_mode = self
            .preview
            .as_ref()
            .is_some_and(|session| session.is_app_mode());
        if let Some(route) = route.filter(|_| app_mode) {
            let session = self.preview.as_mut().expect("checked app session");
            session.set_now_ms(self.now_ms);
            session.navigate_to_screen(&route);
            session.reconcile(self.now_ms);
        }
        self.ensure_preview_screen_scene(page, id);
        if let Some(session) = self.preview.as_mut() {
            if !session.select_preview_frame(id) {
                return false;
            }
        }
        self.preview_browser.page = page;
        self.preview_reset_view();
        self.preview_scroll_y = 0.0;
        self.preview_surface_capture = None;
        self.preview_pressed_pids.clear();
        self.preview_last_doc_by_pid.clear();
        self.on_preview_screen_switched(self.last_viewport_w, self.last_viewport_h);
        self.mark_dirty();
        true
    }
}

fn find_screen_pen_node(
    doc: &jian_ops_schema::PenDocument,
    page_index: usize,
    screen_id: &str,
) -> Option<jian_ops_schema::node::PenNode> {
    let roots = match doc.pages.as_ref().filter(|p| !p.is_empty()) {
        Some(pages) => &pages.get(page_index)?.children,
        None => &doc.children,
    };
    for node in roots {
        if node.node_base().id == screen_id {
            return Some(node.clone());
        }
        if node.node_base().section == Some(true) {
            let sx = node.node_base().x.unwrap_or(0.0);
            let sy = node.node_base().y.unwrap_or(0.0);
            for child in node.children_ref().unwrap_or(&[]) {
                if child.node_base().id == screen_id {
                    let mut cloned = child.clone();
                    let base = cloned.node_base_mut();
                    base.x = Some(sx + base.x.unwrap_or(0.0));
                    base.y = Some(sy + base.y.unwrap_or(0.0));
                    return Some(cloned);
                }
            }
        }
    }
    None
}
