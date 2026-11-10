//! Out-of-rail inspector popovers.
use super::*;

impl PropertyPanel {
    /// Paint inspector overlays that are allowed to extend out of the
    /// right rail. Hosts call this late in their composition pass so
    /// the image-fill / search / generate popovers sit above floating
    /// canvas controls.
    pub fn paint_overlays(&self, cx: &mut PaintCx<'_>, rect: Rect) {
        if self.page_only {
            return;
        }
        let caps = self.capabilities();
        if !(caps.fill || caps.image) {
            return;
        }
        // The Code tab paints no Design sections — none of the
        // Design-anchored popovers may float over it.
        if matches!(self.tab, op_editor_core::PropertyTab::Code) {
            return;
        }
        let rect = self.begin_density_paint(cx.backend, rect);
        let scroll = self.effective_scroll(rect);
        let scrolled = Rect {
            origin: Point2D::new(rect.origin.x, rect.origin.y - scroll),
            size: rect.size,
        };
        if self.image_fill_popover_open {
            let edit_ctx = sections::EditContext {
                focus: self.focus,
                draft: self.draft.as_str(),
                input: &self.input,
                caret: self.caret_pos,
                select_all: self.select_all,
                now_ms: self.now_ms,
            };
            sections::paint_image_fill_popover(
                cx,
                &self.theme,
                scrolled,
                self.visible_sections(),
                &self.snapshot,
                &edit_ctx,
                self.locale,
            );
        }
        if caps.image && self.image_panel.search_open {
            crate::widgets::property_panel_image_popovers::paint_search_popover(
                cx,
                &self.theme,
                scrolled,
                self.visible_sections(),
                &self.image_panel,
                self.locale,
                self.now_ms,
            );
        }
        if caps.image && self.image_panel.generate_open {
            crate::widgets::property_panel_image_popovers::paint_generate_popover(
                cx,
                &self.theme,
                scrolled,
                self.visible_sections(),
                &self.image_panel,
                self.image_gen_profile.as_ref(),
                self.locale,
                self.now_ms,
            );
        }
        self.end_density_paint(cx.backend);
    }
}
