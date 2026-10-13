//! Transient Page/frame navigation for browser preview; canonical editor state stays unchanged.

use op_editor_core::frame_presets::{find_device_for_width, DEVICE_PRESETS};
use op_editor_core::PenNodeExt;
use op_editor_ui::widgets::preview_toolbar::{PreviewControl, PreviewMenu};
use op_editor_ui::Point2D;

use super::WidgetHost;

pub(super) const DESKTOP_SIZES: [(f32, f32); 3] =
    [(1280.0, 800.0), (1440.0, 900.0), (1920.0, 1080.0)];

pub(super) struct PreviewFrameEntry {
    pub page: usize,
    pub page_label: String,
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
    pub view: Option<op_editor_core::PreviewDeviceKind>,
    pub device: Option<usize>,
    pub device_label_width: f32,
    pub desktop_size: Option<usize>,
    pub zoom: Option<f32>,
    pub pan: Point2D,
    pub list_open: bool,
    pub menu: Option<PreviewMenu>,
    pub menu_scroll: f32,
    pub list_scroll: f32,
    pub hover: Option<PreviewControl>,
    pub pressed: Option<PreviewControl>,
    pub controls_captured: bool,
    pub pan_capture: Option<(Point2D, Point2D)>,
    pub inspection_position: Option<(Option<f32>, Point2D, f32)>,
    pub view_positions: [Option<(Option<f32>, Point2D, f32)>; 3],
    pub last_activity_ms: u64,
    pub preferences: PreviewPreferences,
    preferences_loaded: bool,
}

#[derive(Default, serde::Serialize, serde::Deserialize)]
#[serde(default)]
pub(super) struct PreviewPreferences {
    pub devices: std::collections::BTreeMap<String, Option<String>>,
    pub landscape: bool,
    pub zoom: Option<f32>,
}

impl WidgetHost {
    pub(super) fn browser_device_kind(&self) -> op_editor_core::PreviewDeviceKind {
        use op_editor_core::PreviewDeviceKind;
        if self.preview_browser.present {
            return PreviewDeviceKind::Canvas;
        }
        self.preview_browser
            .view
            .unwrap_or(PreviewDeviceKind::Desktop)
    }

    pub(super) fn browser_frame_geometry(
        &self,
        canvas: op_editor_ui::Rect,
        root: op_editor_ui::Rect,
        nav: Option<op_editor_ui::Rect>,
        status: Option<op_editor_ui::Rect>,
    ) -> op_preview_core::device_frame::DeviceFrame {
        let size = if !self.preview_browser.present
            && self.browser_device_kind() == op_editor_core::PreviewDeviceKind::Canvas
        {
            (root.size.x, root.size.y)
        } else {
            self.preview_screen_size()
        };
        op_preview_core::device_frame::compute_presentation_geometry(
            self.browser_device_kind(),
            self.preview_stage_rect(canvas),
            root,
            size,
            self.preview_browser.zoom,
            self.preview_browser.pan,
            nav,
            status,
        )
    }

    pub(super) fn preview_screen_size(&self) -> (f32, f32) {
        if !self.preview_browser.present
            && self.browser_device_kind() == op_editor_core::PreviewDeviceKind::Desktop
        {
            if let Some(size) = self
                .preview_browser
                .desktop_size
                .and_then(|index| DESKTOP_SIZES.get(index))
            {
                return *size;
            }
        }
        self.preview_browser
            .device
            .filter(|_| {
                !self.preview_browser.present
                    && self.browser_device_kind() == op_editor_core::PreviewDeviceKind::Phone
            })
            .map(|index| DEVICE_PRESETS[index].size(self.preview_browser.preferences.landscape))
            .unwrap_or_else(|| {
                self.preview
                    .as_ref()
                    .and_then(|session| session.framed_root())
                    .map(|(_, root)| (root.size.x, root.size.y))
                    .unwrap_or((1.0, 1.0))
            })
    }

    pub(super) fn paint_preview_canvas(
        &mut self,
        backend: &mut dyn op_editor_ui::RenderBackend,
        canvas: op_editor_ui::Rect,
    ) {
        let Some(page) = self
            .preview_browser
            .canvas_scene
            .as_ref()
            .and_then(|scene| scene.pages.get(self.preview_browser.page))
        else {
            return;
        };
        let Some(frame) = self.preview_device_frame.as_ref() else {
            return;
        };
        op_editor_ui::widgets::paint_scene_page_without_video_badge(
            &mut op_editor_ui::widgets::PaintCx { backend },
            page,
            frame.content_origin,
            frame.fit,
            canvas,
        );
    }

    pub(super) fn preview_canvas_bounds(&self) -> Option<op_editor_ui::Rect> {
        let page = self
            .preview_browser
            .canvas_scene
            .as_ref()?
            .pages
            .get(self.preview_browser.page)?;
        let mut bounds = op_editor_ui::scene_bounds::BoundsAcc::new();
        for node in page.children.iter().filter(|node| !node.hidden) {
            let rect = node.bounds;
            if rect.origin.is_finite()
                && rect.size.is_finite()
                && rect.size.x > 0.0
                && rect.size.y > 0.0
            {
                bounds.add(
                    rect.origin.x,
                    rect.origin.y,
                    rect.origin.x + rect.size.x,
                    rect.origin.y + rect.size.y,
                );
            }
        }
        bounds.into_rect()
    }

    pub(crate) fn managed_preview_active(&self) -> bool {
        self.preview.is_some() && !self.preview_browser.frames.is_empty()
    }

    pub(super) fn preview_stage_rect(&self, canvas: op_editor_ui::Rect) -> op_editor_ui::Rect {
        if self.preview_browser.present {
            return canvas;
        }
        let top = op_editor_ui::widgets::preview_toolbar::PreviewToolbar::header_height(canvas);
        let left = if self.preview_browser.list_open && canvas.size.x >= 600.0 {
            232.0
        } else {
            0.0
        };
        op_editor_ui::Rect::xywh(
            canvas.origin.x + left + 24.0,
            canvas.origin.y + top + 20.0,
            (canvas.size.x - left - 48.0).max(1.0),
            (canvas.size.y - top - 84.0).max(1.0),
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
        let mut frames = Vec::new();
        let mut entry_target = None;
        let active_page = self.editor_state.ui.active_page_index;
        let selected = self.editor_state.selection.anchor.as_str();
        fn contains(node: &jian_ops_schema::node::PenNode, id: &str) -> bool {
            node.id_str() == id
                || node
                    .children()
                    .is_some_and(|children| children.iter().any(|node| contains(node, id)))
        }
        let mut collect =
            |page: usize, label: &str, children: &[jian_ops_schema::node::PenNode]| {
                let mut roots: Vec<_> = children
                    .iter()
                    .filter(|node| {
                        matches!(node, jian_ops_schema::node::PenNode::Frame(_))
                            && node.base().visible != Some(false)
                            && node
                                .width_px()
                                .is_none_or(|width| width.is_finite() && width > 0.0)
                            && node
                                .height_px()
                                .is_none_or(|height| height.is_finite() && height > 0.0)
                            && node.base().x.is_none_or(f64::is_finite)
                            && node.base().y.is_none_or(f64::is_finite)
                    })
                    .collect();
                roots.sort_by(|first, second| {
                    first
                        .base()
                        .y
                        .unwrap_or(0.0)
                        .total_cmp(&second.base().y.unwrap_or(0.0))
                        .then_with(|| {
                            first
                                .base()
                                .x
                                .unwrap_or(0.0)
                                .total_cmp(&second.base().x.unwrap_or(0.0))
                        })
                });
                if page == active_page {
                    let nearest = roots.iter().min_by(|first, second| {
                        let distance = |node: &jian_ops_schema::node::PenNode| {
                            let delta_x = node.base().x.unwrap_or(0.0)
                                + f64::from(node.width_px().unwrap_or(0.0)) / 2.0
                                - f64::from(center.x);
                            let delta_y = node.base().y.unwrap_or(0.0)
                                + f64::from(node.height_px().unwrap_or(0.0)) / 2.0
                                - f64::from(center.y);
                            delta_x * delta_x + delta_y * delta_y
                        };
                        distance(first).total_cmp(&distance(second))
                    });
                    entry_target = roots
                        .iter()
                        .find(|node| contains(node, selected))
                        .or(nearest)
                        .map(|node| (node.id_str().to_owned(), node.screen().map(str::to_owned)));
                }
                frames.extend(roots.into_iter().map(|node| {
                    PreviewFrameEntry {
                        page,
                        page_label: label.into(),
                        id: node.id_str().into(),
                        name: node
                            .base()
                            .name
                            .clone()
                            .unwrap_or_else(|| node.id_str().into()),
                        screen: node.screen().map(str::to_owned),
                    }
                }));
            };
        match self
            .editor_state
            .doc
            .pages
            .as_ref()
            .filter(|pages| !pages.is_empty())
        {
            Some(pages) => {
                for (index, page) in pages.iter().enumerate() {
                    collect(index, &page.name, &page.children);
                }
            }
            None => collect(
                0,
                self.editor_state.doc.name.as_deref().unwrap_or("Page 1"),
                &self.editor_state.doc.children,
            ),
        }
        let Some(session) = self.preview.as_mut() else {
            return false;
        };
        if session.is_app_mode() {
            if let Some((id, route)) = entry_target {
                if let Some(route) = route {
                    session.navigate_to_screen(&route);
                    session.reconcile(self.now_ms);
                }
                if !session.select_preview_frame(&id) {
                    self.reject_empty_preview();
                    return false;
                }
            } else {
                self.reject_empty_preview();
                return false;
            }
        } else if !session.select_preview_root(Some(selected), center) {
            self.reject_empty_preview();
            return false;
        }
        self.preview_browser.page = self.editor_state.ui.active_page_index;
        self.preview_browser.frames = frames;
        self.preview_editor_viewport = Some(viewport);
        self.preview_browser.canvas_scene = Some(op_pen_loader::editor_state_to_layout_scene(
            &self.editor_state,
        ));
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
        self.preview_browser.zoom = if self.preview_browser.present {
            None
        } else {
            self.preview_browser
                .preferences
                .zoom
                .filter(|zoom| zoom.is_finite() && *zoom >= 0.05 && *zoom <= 8.0)
        };
        self.preview_browser.menu = None;
        self.preview_browser.list_scroll = 0.0;
        self.preview_browser.pan = Point2D::new(0.0, 0.0);
        self.preview_browser.view_positions = [None; 3];
        self.preview_browser.last_activity_ms = self.now_ms;
        self.refresh_preview_device();
        self.preview_browser.view = Some(
            if self
                .preview_browser
                .device
                .is_some_and(|index| DEVICE_PRESETS[index].phone)
            {
                op_editor_core::PreviewDeviceKind::Phone
            } else {
                op_editor_core::PreviewDeviceKind::Desktop
            },
        );
        true
    }

    fn preview_width_key(&self) -> Option<String> {
        self.preview
            .as_ref()?
            .framed_root()
            .map(|(_, rect)| format!("{:.3}", rect.size.x))
    }

    pub(super) fn refresh_preview_device(&mut self) {
        let previous = self.preview_browser.device;
        let width = self
            .preview
            .as_ref()
            .and_then(|session| session.framed_root())
            .map(|(_, rect)| rect.size.x);
        self.preview_browser.device = match self
            .preview_width_key()
            .and_then(|key| self.preview_browser.preferences.devices.get(&key))
        {
            Some(id) => id
                .as_ref()
                .and_then(|id| DEVICE_PRESETS.iter().position(|preset| preset.id == id)),
            None => width.and_then(find_device_for_width),
        };
        if self.browser_device_kind() == op_editor_core::PreviewDeviceKind::Phone
            && !self
                .preview_browser
                .device
                .is_some_and(|index| DEVICE_PRESETS[index].phone)
        {
            self.preview_browser.device = previous
                .filter(|index| DEVICE_PRESETS[*index].phone)
                .or_else(|| DEVICE_PRESETS.iter().position(|preset| preset.phone));
        }
    }

    pub(super) fn preview_pick_device(&mut self, device: Option<usize>) {
        if device.is_some_and(|index| index >= DEVICE_PRESETS.len()) {
            return;
        }
        self.preview_browser.device = device;
        if let Some(key) = self.preview_width_key() {
            self.preview_browser
                .preferences
                .devices
                .insert(key, device.map(|index| DEVICE_PRESETS[index].id.into()));
        }
        self.preview_scroll_y = 0.0;
        self.preview_browser.pan = Point2D::new(0.0, 0.0);
        self.save_preview_preferences();
        self.initialize_device_preview(self.last_viewport_w, self.last_viewport_h);
        self.mark_dirty();
    }

    pub(super) fn preview_set_zoom(&mut self, zoom: Option<f32>) {
        self.preview_browser.zoom = zoom
            .filter(|value| value.is_finite())
            .map(|value| value.clamp(0.05, 8.0));
        if !self.preview_browser.present {
            self.preview_browser.preferences.zoom = self.preview_browser.zoom;
            self.save_preview_preferences();
        }
        if zoom.is_none() {
            self.preview_browser.pan = Point2D::new(0.0, 0.0);
        }
        self.recompute_device_frame(self.last_viewport_w, self.last_viewport_h);
        self.mark_dirty();
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
        } else if page != self.preview_browser.page {
            let next = if let Some(op_ck) = self.op_ck.as_ref() {
                crate::preview_host::enter_preview(
                    &self.editor_state.doc,
                    (self.last_viewport_w, self.last_viewport_h),
                    &self.editor_state.ui.variables.active_theme,
                    page,
                    op_ck,
                    self.preview_browser.present,
                    self.now_ms,
                )
            } else {
                #[cfg(test)]
                {
                    op_preview_core::PreviewSession::enter(
                        &self.editor_state.doc,
                        (self.last_viewport_w, self.last_viewport_h),
                        &self.editor_state.ui.variables.active_theme,
                        page,
                        false,
                        self.preview_browser.present,
                        jian_core::layout::measure::default_backend(),
                        self.now_ms,
                    )
                }
                #[cfg(not(test))]
                {
                    return false;
                }
            };
            let Ok(mut next) = next else {
                return false;
            };
            if !next.select_preview_frame(id) {
                return false;
            }
            next.begin_lifecycle(self.now_ms);
            self.preview = Some(next);
        }
        if let Some(session) = self.preview.as_mut() {
            if !session.select_preview_frame(id) {
                return false;
            }
        }
        self.preview_browser.page = page;
        self.preview_browser.pan = Point2D::new(0.0, 0.0);
        self.preview_scroll_y = 0.0;
        self.preview_surface_capture = None;
        self.preview_pressed_pids.clear();
        self.preview_last_doc_by_pid.clear();
        self.on_preview_screen_switched(self.last_viewport_w, self.last_viewport_h);
        self.mark_dirty();
        true
    }
}
