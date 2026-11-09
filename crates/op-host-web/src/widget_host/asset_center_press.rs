use op_editor_ui::widgets::press_flow;
use op_editor_ui::Point2D;

use super::WidgetHost;

impl WidgetHost {
    pub(in crate::widget_host) fn dispatch_asset_center_press(
        &mut self,
        x: f32,
        y: f32,
        viewport_width: f32,
        viewport_height: f32,
    ) -> bool {
        let Some(panel_rect) = self.asset_center_panel_rect(viewport_width, viewport_height) else {
            return false;
        };
        let Some(changed) = press_flow::press_asset_center(
            &mut self.editor_state,
            panel_rect,
            Point2D::new(x, y),
            self.now_ms,
        ) else {
            return false;
        };
        self.discard_style_persistence_requests();
        if changed {
            self.mark_dirty();
        }
        true
    }

    /// Turn a picked `DESIGN.md` into a style guide.
    ///
    /// The file drain reads bytes and stops there; this is where they meet the
    /// shared flow — the same one the paste box runs — so a guide picked as a
    /// file and the same guide pasted into the box are the same guide. It
    /// lives here rather than in the drain because `widget_host` is the only
    /// module on this host allowed to reach the widget layer at all.
    ///
    /// `fallback_name` is used only when the document names nothing; the
    /// caller passes the file stem, so an unnamed guide is still called after
    /// the file the user went and found.
    pub(crate) fn import_picked_style_guide(&mut self, markdown: &str, fallback_name: &str) {
        press_flow::import_style_guide_text(&mut self.editor_state, markdown, fallback_name);
        // Managed imports use the scoped asset queue; discard only legacy
        // native persistence requests on this browser host.
        self.editor_state
            .editor_ui
            .asset_center
            .take_pending_style_persist();
        self.mark_dirty();
    }

    /// Report a picked file whose bytes did not survive the read.
    pub(crate) fn report_unreadable_style_import(&mut self) {
        press_flow::fail_style_import_unreadable(&mut self.editor_state);
        self.mark_dirty();
    }

    /// Drop the persist / delete requests the shared import flow raises.
    ///
    /// Managed requests live in EditorUiState::managed_assets and are drained
    /// by the Node sync bridge. Unmanaged imports retain the memory-only
    /// registry behavior; their native disk requests cannot be handled here.
    fn discard_style_persistence_requests(&mut self) {
        let center = &mut self.editor_state.editor_ui.asset_center;
        center.take_pending_style_persist();
        center.take_pending_style_delete();
        // Managed deletes use their own queue, not this native-disk request.
        // `pending_file_pick` is deliberately NOT drained here. It is the one
        // style-import request this host can honour, and the mount's post-press
        // drain opens the browser file dialog with it — taking it here would
        // make the "choose file" button do nothing.
    }
}

#[cfg(test)]
mod tests {
    use super::WidgetHost;

    const OCHRE: &str =
        "---\nname: Studio Ochre\n---\n\n# Studio Ochre\n\nWarm ochre. Accent #C77D3A.\n";

    /// A picked file lands on the shared flow: registered, pinned, box closed
    /// — the same three things a paste produces. The persist request the flow
    /// raises is dropped, because this host has nowhere to write it.
    #[test]
    fn a_picked_file_registers_and_pins_through_the_shared_flow() {
        let mut host = WidgetHost::new();
        host.editor_state.editor_ui.asset_center.import.open = true;
        host.import_picked_style_guide(OCHRE, "Studio Ochre");

        assert_eq!(
            host.editor_state.editor_ui.pinned_style_guide.as_deref(),
            Some("user:studio-ochre")
        );
        assert!(!host.editor_state.editor_ui.asset_center.import.open);
        assert!(host
            .editor_state
            .editor_ui
            .asset_center
            .take_pending_style_persist()
            .is_empty());
    }

    /// A press on "choose file" must survive the press handler. It is the one
    /// style-import request this host can honour, and draining it alongside
    /// the persist / delete pair is exactly how the button did nothing.
    #[test]
    fn a_file_pick_request_survives_the_press_drain() {
        let mut host = WidgetHost::new();
        host.editor_state
            .editor_ui
            .asset_center
            .request_style_import_file();
        host.discard_style_persistence_requests();

        assert!(host
            .editor_state
            .editor_ui
            .asset_center
            .take_pending_style_import_file());
    }

    #[test]
    fn an_unreadable_file_reports_in_the_box() {
        let mut host = WidgetHost::new();
        host.editor_state.editor_ui.asset_center.import.open = true;
        host.report_unreadable_style_import();

        assert!(host.editor_state.editor_ui.asset_center.import.open);
        assert_eq!(
            host.editor_state.editor_ui.asset_center.import.error_key,
            Some("assetCenter.style.importNotText")
        );
    }
}
