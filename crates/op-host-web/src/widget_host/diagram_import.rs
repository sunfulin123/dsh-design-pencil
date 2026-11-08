use super::WidgetHost;
use op_editor_core::{EditorCommand, NodeId, PenNodeExt};

/// Bound the browser read before FileReader allocates the source.
pub(crate) const MAX_DIAGRAM_FILE_BYTES: usize = op_html::diagram::MAX_DRAWIO_SOURCE_BYTES;
pub(crate) const DIAGRAM_FILE_ACCEPT: &str = ".mmd,.mermaid,.drawio,.xml";

impl WidgetHost {
    pub(crate) fn take_diagram_import_request(&mut self) -> bool {
        std::mem::take(&mut self.diagram_import_requested)
    }

    /// The picker is explicit opt-in: ordinary text paste remains unchanged.
    pub(crate) fn import_diagram_file(
        &mut self,
        name: &str,
        source: &str,
        width: f32,
        height: f32,
    ) -> bool {
        let result = if source.len() > MAX_DIAGRAM_FILE_BYTES {
            Err(format!(
                "Diagram exceeds the {MAX_DIAGRAM_FILE_BYTES}-byte import limit"
            ))
        } else {
            let extension = name.rsplit('.').next().unwrap_or("").to_ascii_lowercase();
            match extension.as_str() {
                "mmd" | "mermaid" => op_html::diagram::import_mermaid(source),
                "drawio" | "xml" => op_html::diagram::import_drawio(source),
                _ => {
                    self.fail_diagram_import(
                        "Choose a .mmd, .mermaid, .drawio or .xml file".into(),
                    );
                    return false;
                }
            }
            .map_err(|error| error.to_string())
        };
        let mut imported = match result {
            Ok(imported) => imported,
            Err(error) => {
                self.fail_diagram_import(error);
                return false;
            }
        };
        let centre = op_editor_ui::widgets::host_canvas_geometry::canvas_centre_doc_point(
            &self.editor_state,
            width / self.editor_state.editor_ui.ui_scale.factor(),
            height / self.editor_state.editor_ui.ui_scale.factor(),
        );
        if let Some(root) = imported.nodes.first_mut() {
            let bounds = op_editor_core::own_bounds(root);
            root.base_mut().x = Some(centre.x as f64 - bounds.w / 2.0);
            root.base_mut().y = Some(centre.y as f64 - bounds.h / 2.0);
        }
        let mut taken = self.editor_state.collect_node_ids();
        let mut nodes = Vec::with_capacity(imported.nodes.len());
        for node in &imported.nodes {
            let cloned = if let Some(allocator) = self.collab_id_allocator.as_mut() {
                op_editor_core::walkers::deep_clone_with_allocator(node, allocator, &mut taken)
            } else {
                Ok(op_editor_core::walkers::deep_clone_with_new_ids(
                    node,
                    &mut self.next_node_id,
                    &mut taken,
                ))
            };
            match cloned {
                Ok(node) => nodes.push(node),
                Err(error) => {
                    self.fail_diagram_import(error.to_string());
                    return false;
                }
            }
        }
        let selection = nodes
            .first()
            .map(|node| NodeId::new(node.base().id.clone()));
        // The generation-oriented InsertSubtree consumes any empty root frame.
        // An explicit file import must instead preserve every existing board.
        let changed =
            self.editor_state
                .apply(EditorCommand::InsertAuthoredSubtreePreservingRoots {
                    nodes,
                    parent_id: NodeId::NONE,
                    page_id: None,
                });
        if !changed {
            self.fail_diagram_import("The editor could not insert this diagram".into());
            return false;
        }
        if let Some(selection) = selection {
            self.editor_state.set_single_selection(selection);
        }
        self.mark_dirty();
        self.refresh_missing_fonts_after_document_change();
        true
    }

    pub(crate) fn fail_diagram_import(&mut self, message: String) {
        self.editor_state.editor_ui.show_toast(
            "diagram.importFailed",
            vec![("message".into(), message)],
            op_editor_core::editor_toast::EditorToastLevel::Warn,
            self.now_ms,
        );
        self.mark_dirty();
    }
}
