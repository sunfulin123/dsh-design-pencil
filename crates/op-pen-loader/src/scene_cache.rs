//! Skip the layout-scene rebuild when its inputs are unchanged.
//!
//! [`editor_state_to_active_page_layout_scene`](crate::editor_state_to_active_page_layout_scene)
//! is a pure function of just the document, the authored-geometry latch, the
//! active page index, and the resolved variable table (which folds the active
//! theme and the transient fill / stroke ref caches). It drops every other piece
//! of editor state — selection, hover, chat, viewport, history. Yet the host
//! marks the scene dirty on nearly every interaction: hover (each mouse-move),
//! scroll / zoom, selection / marquee, caret + uncommitted-text drafts (each
//! keystroke), UI toggles, and streamed chat / codegen deltas.
//!
//! This cache holds compact identities for those inputs and skips the rebuild
//! when they still match. Document identity is the editor's
//! `(document_generation, document_revision)` pair, so a UI-only refresh is
//! `O(variables)` rather than cloning and comparing the entire node tree.

use jian_scene::layout_scene::LayoutScene;
use op_editor_core::scene_vars::VariableTable;
use std::collections::VecDeque;

/// Scenes of recently left pages kept for an instant switch back.
const RETAINED_PAGE_SCENES: usize = 3;

/// The inputs of the last layout-scene build, retained so an unchanged refresh
/// can skip the (taffy + reshape) rebuild.
#[derive(Default)]
pub struct SceneBuildCache {
    last: Option<BuiltInputs>,
    /// Scenes the host replaced, with the inputs they were built for. Only
    /// entries for the current document revision are kept.
    retained: VecDeque<(BuiltInputs, LayoutScene)>,
    /// The same-page scene the last refresh replaced because the document
    /// changed; offered once to the host (see [`Self::take_replaced`]).
    replaced: Option<LayoutScene>,
}

/// Every value `editor_state_to_active_page_layout_scene` reads off the
/// `EditorState`:
/// the document, the authored-geometry latch (preview toggles it, changing the
/// layout mode), the active page index, and the resolved variable table — which
/// folds the active theme plus the transient fill / stroke ref caches, i.e. all
/// the non-doc resolution inputs. Everything else on the state (selection /
/// chat / hover / viewport) is dropped by the builder.
#[derive(Clone, PartialEq)]
struct BuiltInputs {
    document_generation: u64,
    document_revision: u64,
    preserve_authored_geometry: bool,
    active_page_index: usize,
    var_table: VariableTable,
    /// Font-registry generation the scene was laid out against. A runtime
    /// font import/removal advances it without touching the document, so it
    /// must gate the rebuild — otherwise an already-open document keeps its
    /// stale (fallback-font) layout after an import.
    font_generation: u64,
}

impl SceneBuildCache {
    pub fn new() -> Self {
        Self::default()
    }

    fn inputs(state: &op_editor_core::EditorState) -> BuiltInputs {
        BuiltInputs {
            document_generation: state.document_generation(),
            document_revision: state.document_revision(),
            preserve_authored_geometry: state.editor_ui.preserve_authored_geometry,
            active_page_index: state.ui.active_page_index,
            var_table: crate::editor_state_var_table(state),
            font_generation: crate::current_font_generation(),
        }
    }

    /// Whether `state`'s scene is current or retained, i.e. a refresh would
    /// not need a (possibly slow) rebuild.
    pub fn has_scene_for(&self, state: &op_editor_core::EditorState) -> bool {
        let inputs = Self::inputs(state);
        self.last.as_ref() == Some(&inputs)
            || self
                .retained
                .iter()
                .any(|(retained, _)| *retained == inputs)
    }

    /// Bring `current` up to date with `state`. The replaced scene is retained
    /// so switching back to its page reuses it instead of rebuilding; a
    /// retained scene for the new inputs is moved back in. Returns whether
    /// `current` changed.
    pub fn refresh(
        &mut self,
        state: &op_editor_core::EditorState,
        current: &mut LayoutScene,
    ) -> bool {
        let inputs = Self::inputs(state);
        if self.last.as_ref() == Some(&inputs) {
            return false;
        }
        self.replaced = None;
        if let Some(previous) = self.last.take() {
            let scene = std::mem::take(current);
            let same_revision = previous.document_generation == inputs.document_generation
                && previous.document_revision == inputs.document_revision;
            if same_revision {
                self.retained.push_back((previous, scene));
            } else if previous.document_generation == inputs.document_generation
                && previous.active_page_index == inputs.active_page_index
            {
                self.replaced = Some(scene);
            }
        }
        // Scenes of an older document revision can never be reused.
        self.retained.retain(|(retained, _)| {
            retained.document_generation == inputs.document_generation
                && retained.document_revision == inputs.document_revision
        });
        let reused = self
            .retained
            .iter()
            .position(|(retained, _)| *retained == inputs)
            .and_then(|index| self.retained.remove(index));
        *current = match reused {
            Some((_, scene)) => scene,
            None => crate::editor_state_to_active_page_layout_scene(state),
        };
        while self.retained.len() > RETAINED_PAGE_SCENES {
            self.retained.pop_front();
        }
        self.last = Some(inputs);
        true
    }

    /// The previous scene of the same page when the last [`Self::refresh`]
    /// rebuilt it for a document edit, so retained rasters can be diffed
    /// against the new scene. Returns it at most once.
    pub fn take_replaced(&mut self) -> Option<LayoutScene> {
        self.replaced.take()
    }

    /// Build a fresh [`LayoutScene`] only if the scene-relevant inputs (doc,
    /// active theme, active page) changed since the last build.
    ///
    /// Returns `Some(scene)` when a rebuild happened (the caller installs it),
    /// or `None` when the inputs are identical (the caller keeps its current
    /// scene).
    pub fn maybe_rebuild(&mut self, state: &op_editor_core::EditorState) -> Option<LayoutScene> {
        let inputs = Self::inputs(state);
        if self.last.as_ref() == Some(&inputs) {
            return None;
        }
        let scene = crate::editor_state_to_active_page_layout_scene(state);
        self.last = Some(inputs);
        Some(scene)
    }

    /// Forget the cached inputs so the next [`maybe_rebuild`](Self::maybe_rebuild)
    /// always rebuilds. Call when the host installs a scene through a path that
    /// bypasses this cache. Whole-state replacement paths must also call this:
    /// a fresh state may restart at the same generation/revision pair as the
    /// document it replaced even though its contents differ.
    pub fn invalidate(&mut self) {
        self.last = None;
        self.retained.clear();
        self.replaced = None;
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use op_editor_core::EditorState;

    fn state_with_rect(x: f64) -> EditorState {
        let doc = jian_ops_schema::load_str(&format!(
            r#"{{"version":"1.0.0","children":[
              {{"type":"rectangle","id":"r","name":"r","x":{x},"y":0,"width":40,"height":20}}
            ]}}"#
        ))
        .expect("fixture parses")
        .value;
        EditorState::from_document(doc)
    }

    #[test]
    fn first_build_returns_a_scene_then_unchanged_refreshes_are_skipped() {
        let mut cache = SceneBuildCache::new();
        let state = state_with_rect(0.0);

        assert!(
            cache.maybe_rebuild(&state).is_some(),
            "first build must produce a scene"
        );
        assert!(
            cache.maybe_rebuild(&state).is_none(),
            "an identical refresh must skip the rebuild"
        );
        assert!(
            cache.maybe_rebuild(&state).is_none(),
            "still skipped on repeat"
        );
    }

    #[test]
    fn a_document_change_forces_a_rebuild() {
        let mut cache = SceneBuildCache::new();
        let a = state_with_rect(0.0);
        let mut b = state_with_rect(100.0); // node moved → different doc
        b.mark_document_changed();

        assert!(cache.maybe_rebuild(&a).is_some());
        assert!(cache.maybe_rebuild(&a).is_none());
        assert!(
            cache.maybe_rebuild(&b).is_some(),
            "a moved node must rebuild the scene"
        );
        assert!(cache.maybe_rebuild(&b).is_none());
    }

    #[test]
    fn active_page_and_theme_changes_force_a_rebuild() {
        let mut cache = SceneBuildCache::new();
        let mut state = state_with_rect(0.0);
        assert!(cache.maybe_rebuild(&state).is_some());
        assert!(cache.maybe_rebuild(&state).is_none());

        state.ui.active_page_index = state.ui.active_page_index.wrapping_add(1);
        assert!(
            cache.maybe_rebuild(&state).is_some(),
            "an active-page switch must rebuild"
        );

        state.ui.active_page_index = state.ui.active_page_index.wrapping_sub(1);
        let _ = cache.maybe_rebuild(&state);
        state
            .ui
            .variables
            .active_theme
            .insert("mode".to_string(), "dark".to_string());
        assert!(
            cache.maybe_rebuild(&state).is_some(),
            "an active-theme change must rebuild (it re-resolves token fills)"
        );
    }

    #[test]
    fn toggling_preserve_authored_geometry_forces_a_rebuild() {
        // Preview mode flips `preserve_authored_geometry`, which switches the
        // layout-resolution path — so it must rebuild even though the document,
        // theme, and page are unchanged.
        let mut cache = SceneBuildCache::new();
        let mut state = state_with_rect(0.0);
        assert!(cache.maybe_rebuild(&state).is_some());
        assert!(cache.maybe_rebuild(&state).is_none());

        state.editor_ui.preserve_authored_geometry = !state.editor_ui.preserve_authored_geometry;
        assert!(
            cache.maybe_rebuild(&state).is_some(),
            "toggling preserve_authored_geometry must rebuild the scene"
        );
    }

    #[test]
    fn a_document_edit_hands_back_the_replaced_scene_once() {
        let mut cache = SceneBuildCache::new();
        let mut state = state_with_rect(0.0);
        let mut scene = LayoutScene::default();
        assert!(cache.refresh(&state, &mut scene));
        assert!(
            cache.take_replaced().is_none(),
            "nothing replaced on first build"
        );
        state.mark_document_changed();
        assert!(cache.refresh(&state, &mut scene));
        assert!(cache.take_replaced().is_some());
        assert!(cache.take_replaced().is_none());
    }

    #[test]
    fn invalidate_forces_the_next_build() {
        let mut cache = SceneBuildCache::new();
        let state = state_with_rect(0.0);
        assert!(cache.maybe_rebuild(&state).is_some());
        assert!(cache.maybe_rebuild(&state).is_none());
        cache.invalidate();
        assert!(
            cache.maybe_rebuild(&state).is_some(),
            "invalidate must force the next rebuild"
        );
    }

    fn two_page_state() -> EditorState {
        let doc = jian_ops_schema::load_str(
            r#"{"version":"1.0.0","children":[],"pages":[
              {"id":"a","name":"A","children":[{"type":"rectangle","id":"r","x":0,"y":0,"width":4,"height":4}]},
              {"id":"b","name":"B","children":[{"type":"rectangle","id":"s","x":9,"y":0,"width":4,"height":4}]}
            ]}"#,
        )
        .expect("fixture parses")
        .value;
        EditorState::from_document(doc)
    }

    #[test]
    fn switching_back_reuses_the_retained_page_scene() {
        let mut cache = SceneBuildCache::new();
        let mut state = two_page_state();
        let mut scene = LayoutScene::default();
        assert!(cache.refresh(&state, &mut scene));
        let page_a = scene.clone();

        state.ui.active_page_index = 1;
        assert!(!cache.has_scene_for(&state), "page B was never built");
        assert!(cache.refresh(&state, &mut scene));
        assert_ne!(scene, page_a);

        state.ui.active_page_index = 0;
        assert!(cache.has_scene_for(&state), "page A was retained");
        assert!(cache.refresh(&state, &mut scene));
        assert_eq!(scene, page_a, "switching back moves the retained scene in");
        assert!(!cache.refresh(&state, &mut scene), "then it is current");
    }

    #[test]
    fn a_document_edit_discards_retained_scenes() {
        let mut cache = SceneBuildCache::new();
        let mut state = two_page_state();
        let mut scene = LayoutScene::default();
        cache.refresh(&state, &mut scene);
        state.ui.active_page_index = 1;
        cache.refresh(&state, &mut scene);
        state.mark_document_changed();
        cache.refresh(&state, &mut scene);
        state.ui.active_page_index = 0;
        assert!(
            !cache.has_scene_for(&state),
            "an edited document needs a fresh scene"
        );
    }
}
