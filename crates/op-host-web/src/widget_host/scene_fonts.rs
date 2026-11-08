//! Font families the rendered canvas uses, read from the built scene.
//!
//! The scene already holds expanded component instances, so collecting fonts
//! from it needs no second ref expansion — which, done per input event for a
//! freshly switched page, blocked page-row clicks for seconds.

use super::WidgetHost;
use op_editor_ui::layout_scene::SceneNode;

impl WidgetHost {
    /// Identity of the current scene for scene-derived caches.
    pub(crate) fn scene_generation(&self) -> u64 {
        self.scene_generation
    }

    /// Raw font-family stacks of every text in the current scene.
    pub(crate) fn scene_text_font_families(&self) -> Vec<String> {
        fn walk(nodes: &[SceneNode], out: &mut Vec<String>) {
            for node in nodes {
                if node.text.is_some() && !node.font_family.trim().is_empty() {
                    out.push(node.font_family.clone());
                }
                for run in &node.text_runs {
                    if let Some(family) =
                        run.font_family.as_deref().filter(|f| !f.trim().is_empty())
                    {
                        out.push(family.to_string());
                    }
                }
                walk(&node.children, out);
            }
        }
        let mut families = Vec::new();
        if let Some(page) = self.layout_scene.active_page() {
            walk(&page.children, &mut families);
        }
        families.sort();
        families.dedup();
        families
    }

    #[cfg(test)]
    pub(crate) fn refresh_scene_for_tests(&mut self) {
        self.refresh_layout_scene();
    }
}
