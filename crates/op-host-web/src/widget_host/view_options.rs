use super::WidgetHost;
use op_editor_core::{host_keyboard_transitions, EditorCommand};
use op_editor_ui::widgets::view_options::{ViewOption, ViewOptions};
use op_editor_ui::widgets::{PaintCx, StatusBar, Widget};
use op_editor_ui::{Point2D, Rect, RenderBackend};

impl WidgetHost {
    pub(in crate::widget_host) fn reconcile_view_options(&mut self) {
        if self.editor_state.editor_ui.view_options_open
            && host_keyboard_transitions::import_modal_blocked_by_overlay(
                &self.editor_state.editor_ui,
            )
        {
            self.editor_state.editor_ui.view_options_open = false;
            self.mark_dirty();
        }
    }

    fn view_options_rect(&self, width: f32, height: f32) -> Rect {
        ViewOptions::for_editor(&self.editor_state).rect_for(
            self.status_bar_rect(width, height),
            width,
            height,
        )
    }

    fn open_view_options(&mut self) {
        self.blur_text_inputs_on_blank_press();
        let ui = &mut self.editor_state.editor_ui;
        ui.view_options_open = true;
        ui.statusbar_view_hover = false;
        ui.view_options_focus = op_editor_core::editor_ui_state::ui_scale::UiScale::SUPPORTED
            .iter()
            .position(|scale| *scale == ui.ui_scale.percent())
            .expect("supported interface scale")
            + 1;
        self.mark_dirty();
    }

    pub(in crate::widget_host) fn press_view_options(
        &mut self,
        x: f32,
        y: f32,
        width: f32,
        height: f32,
    ) -> Option<bool> {
        let point = Point2D::new(x, y);
        if self.editor_state.editor_ui.view_options_open {
            let rect = self.view_options_rect(width, height);
            if let Some(index) = ViewOptions::control_at(rect, point) {
                self.apply_view_option(index, width, height);
            } else {
                self.editor_state.editor_ui.view_options_open = false;
                self.mark_dirty();
            }
            return Some(true);
        }
        let bar = StatusBar::for_editor(&self.editor_state);
        if self
            .status_bar_rect(width, height)
            .is_some_and(|rect| bar.percentage_rect(rect).contains(point))
        {
            self.open_view_options();
            return Some(true);
        }
        None
    }

    fn apply_view_option(&mut self, index: usize, width: f32, height: f32) {
        match ViewOptions::for_editor(&self.editor_state)
            .option_for(index)
            .expect("validated view option index")
        {
            ViewOption::Fit => self.zoom_to_fit(width, height),
            ViewOption::Scale(percent) => {
                self.editor_state
                    .apply(EditorCommand::SetUiScale { percent });
            }
            ViewOption::RecoverDrafts => {
                if self.editor_state.editor_ui.draft_recovery_supported {
                    self.draft_recovery_requested = true;
                }
            }
            ViewOption::ImportDiagram => {
                if self.editor_state.editor_ui.diagram_import_supported {
                    self.diagram_import_requested = true;
                }
            }
        }
        self.editor_state.editor_ui.view_options_open = false;
        self.mark_dirty();
    }

    pub(crate) fn view_options_key(
        &mut self,
        key: &str,
        shortcut: bool,
        shift: bool,
        is_mod: bool,
    ) -> bool {
        self.reconcile_view_options();
        if shortcut {
            if self.editor_state.editor_ui.view_options_open {
                self.editor_state.editor_ui.view_options_open = false;
                self.mark_dirty();
            } else if !self.input_active()
                && !host_keyboard_transitions::import_modal_blocked_by_overlay(
                    &self.editor_state.editor_ui,
                )
            {
                self.open_view_options();
            }
            return true;
        }
        if !self.editor_state.editor_ui.view_options_open {
            return false;
        }
        if key == "Escape" || is_mod {
            self.editor_state.editor_ui.view_options_open = false;
            self.mark_dirty();
            return !is_mod;
        }
        let count = ViewOptions::for_editor(&self.editor_state).option_count();
        let focus = self
            .editor_state
            .editor_ui
            .view_options_focus
            .min(count - 1);
        match key {
            "Enter" | " " => {
                self.with_ui_scale(|host, _| {
                    host.apply_view_option(focus, host.last_viewport_w, host.last_viewport_h)
                });
            }
            "ArrowRight" | "ArrowDown" | "Tab" if !shift => {
                self.editor_state.editor_ui.view_options_focus = (focus + 1) % count;
            }
            "ArrowLeft" | "ArrowUp" | "Tab" => {
                self.editor_state.editor_ui.view_options_focus = (focus + count - 1) % count;
            }
            "Home" => self.editor_state.editor_ui.view_options_focus = 0,
            "End" => self.editor_state.editor_ui.view_options_focus = count - 1,
            _ => {}
        }
        self.mark_dirty();
        true
    }

    pub(in crate::widget_host) fn paint_view_options(
        &self,
        backend: &mut dyn RenderBackend,
        width: f32,
        height: f32,
    ) {
        if !self.editor_state.editor_ui.view_options_open {
            return;
        }
        let rect = self.view_options_rect(width, height);
        let mut menu = ViewOptions::for_editor(&self.editor_state);
        menu.hover =
            ViewOptions::control_at(rect, Point2D::new(self.last_cursor_x, self.last_cursor_y));
        menu.paint(&mut PaintCx { backend }, rect);
    }

    pub(in crate::widget_host) fn hover_view_options(
        &mut self,
        previous: Point2D,
        point: Point2D,
    ) -> Option<bool> {
        self.reconcile_view_options();
        if !self.editor_state.editor_ui.view_options_open {
            return None;
        }
        let rect = self.view_options_rect(self.last_viewport_w, self.last_viewport_h);
        let changed =
            ViewOptions::control_at(rect, previous) != ViewOptions::control_at(rect, point);
        let cleared = self.clear_hover_below_topmost_panel();
        if changed || cleared {
            self.mark_dirty();
        }
        Some(changed || cleared)
    }
}
