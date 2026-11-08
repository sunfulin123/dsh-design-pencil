//! Editor-state scene builders.
//!
//! The full builder remains available for export, MCP, and preview consumers.
//! Interactive hosts use the active-page builder so inactive pages do not pay
//! ref/token expansion, layout, payload, or scene-allocation costs.

use jian_scene::layout_scene::{LayoutScene, ScenePage};
use op_editor_core::scene_vars::VariableTable;

use crate::editor_state_var_table;
use crate::payload::DocPayload;

/// Build a paint-only [`LayoutScene`] from every page in an editor state.
pub fn editor_state_to_layout_scene(state: &op_editor_core::EditorState) -> LayoutScene {
    let mut prepared = std::borrow::Cow::Borrowed(&state.doc);
    if op_editor_core::ref_resolve::document_has_refs(&prepared) {
        prepared = std::borrow::Cow::Owned(op_editor_core::ref_resolve::resolve_refs_for_canvas(
            &prepared,
        ));
    }
    if op_editor_core::variables_resolve::document_has_tokens(&prepared) {
        prepared = std::borrow::Cow::Owned(
            op_editor_core::variables_resolve::resolve_document_for_canvas(
                &prepared,
                &state.ui.variables.active_theme,
            ),
        );
    }
    let payload: DocPayload = if state.editor_ui.preserve_authored_geometry {
        crate::adapter::pen_document_to_payload_preserving_geometry(&prepared).payload
    } else {
        crate::adapter::pen_document_to_payload(&prepared).payload
    };
    let var_table: VariableTable = editor_state_var_table(state);

    LayoutScene {
        pages: payload
            .pages
            .iter()
            .map(|page| ScenePage {
                id: page.id.clone(),
                name: page.name.clone(),
                children: page
                    .children
                    .iter()
                    .map(|node| crate::layout_scene::node_payload_to_scene(node, &var_table, 1.0))
                    .collect(),
            })
            .collect(),
        active_page_index: state
            .ui
            .active_page_index
            .min(payload.pages.len().saturating_sub(1)),
    }
}

/// Build the interactive editor scene for only the active page.
///
/// Page metadata stays in document order and `active_page_index` keeps its
/// canonical index, but inactive [`ScenePage`] entries have no render children.
pub fn editor_state_to_active_page_layout_scene(
    state: &op_editor_core::EditorState,
) -> LayoutScene {
    editor_state_to_page_layout_scene(state, state.ui.active_page_index)
}

/// Build the editor scene for page `page_index` only (clamped to the last
/// page), e.g. to capture a page that is not on screen.
pub fn editor_state_to_page_layout_scene(
    state: &op_editor_core::EditorState,
    page_index: usize,
) -> LayoutScene {
    let (mut pages, active_page_index, roots): (
        Vec<ScenePage>,
        usize,
        &[jian_ops_schema::node::PenNode],
    ) = if let Some(doc_pages) = state.doc.pages.as_ref() {
        if doc_pages.is_empty() {
            return LayoutScene::default();
        }
        let active_page_index = page_index.min(doc_pages.len().saturating_sub(1));
        let pages = doc_pages
            .iter()
            .map(|page| ScenePage {
                id: page.id.clone(),
                name: page.name.clone(),
                children: Vec::new(),
            })
            .collect();
        (
            pages,
            active_page_index,
            &doc_pages[active_page_index].children,
        )
    } else {
        let (id, name) = if state.doc.children.is_empty() {
            ("n1".to_string(), "Page 1".to_string())
        } else {
            (
                "page-1".to_string(),
                state.doc.name.as_deref().unwrap_or("Page 1").to_string(),
            )
        };
        (
            vec![ScenePage {
                id,
                name,
                children: Vec::new(),
            }],
            0,
            state.doc.children.as_slice(),
        )
    };

    let active_meta = &pages[active_page_index];
    pages[active_page_index].children = build_roots_scene(
        state,
        active_page_index,
        &active_meta.id,
        &active_meta.name,
        roots,
    );

    LayoutScene {
        pages,
        active_page_index,
    }
}

/// Convert an explicit slice of roots (such as a single prototype screen frame)
/// on `page_index` into [`jian_scene::layout_scene::SceneNode`]s without laying
/// out the rest of the page.
pub fn editor_state_roots_to_scene_nodes(
    state: &op_editor_core::EditorState,
    page_index: usize,
    roots: &[jian_ops_schema::node::PenNode],
) -> Vec<jian_scene::layout_scene::SceneNode> {
    build_roots_scene(state, page_index, "preview-page", "Preview", roots)
}

fn build_roots_scene(
    state: &op_editor_core::EditorState,
    active_page_index: usize,
    page_id: &str,
    page_name: &str,
    roots: &[jian_ops_schema::node::PenNode],
) -> Vec<jian_scene::layout_scene::SceneNode> {
    let mut prepared = std::borrow::Cow::Borrowed(roots);
    if op_editor_core::ref_resolve::roots_have_refs(prepared.as_ref()) {
        prepared = std::borrow::Cow::Owned(if state.document_revision() == 0 {
            op_editor_core::ref_resolve::resolve_refs_for_canvas_roots_with_components(
                prepared.as_ref(),
                &state.components,
                &state.doc,
            )
        } else {
            op_editor_core::ref_resolve::resolve_refs_for_canvas_roots(
                prepared.as_ref(),
                &state.doc,
            )
        });
    }
    if op_editor_core::variables_resolve::roots_have_tokens(prepared.as_ref()) {
        let mut owned = prepared.into_owned();
        let mut active_theme = state.ui.variables.active_theme.clone();
        if let Some(theme) = state
            .doc
            .pages
            .as_ref()
            .and_then(|pages| pages.get(active_page_index))
            .and_then(|page| page.theme.as_ref())
        {
            active_theme.extend(theme.clone());
        }
        op_editor_core::variables_resolve::resolve_roots_for_canvas(
            &mut owned,
            &state.doc,
            &active_theme,
        );
        prepared = std::borrow::Cow::Owned(owned);
    }

    let payload = crate::adapter::pen_roots_to_page_payload(
        page_id,
        page_name,
        prepared.as_ref(),
        active_page_index,
        state.editor_ui.preserve_authored_geometry,
    );
    let var_table = editor_state_var_table(state);
    payload
        .children
        .iter()
        .map(|node| crate::layout_scene::node_payload_to_scene(node, &var_table, 1.0))
        .collect()
}
