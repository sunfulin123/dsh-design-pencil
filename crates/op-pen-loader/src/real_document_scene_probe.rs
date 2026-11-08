//! Opt-in timing probe for scene builds on a large real document supplied
//! locally (no design data in the repository):
//!
//! ```text
//! DSH_REAL_DOC=/path/doc.json cargo test -p op-pen-loader --release --lib \
//!   real_document_scene_probe -- --ignored --nocapture
//! ```

#[test]
#[ignore = "needs DSH_REAL_DOC"]
fn real_document_scene_probe() {
    let Ok(path) = std::env::var("DSH_REAL_DOC") else {
        return;
    };
    let raw = std::fs::read_to_string(path).expect("read document");
    let value: serde_json::Value = serde_json::from_str(&raw).expect("json");
    let document = value.get("document").cloned().unwrap_or(value);
    let started = std::time::Instant::now();
    let doc: jian_ops_schema::PenDocument = serde_json::from_value(document).expect("document");
    let preserve =
        document_value_preserves_geometry(&raw) || std::env::var("DSH_PROBE_PRESERVE").is_ok();
    let mut state = op_editor_core::EditorState::from_document(doc);
    // Match the editor: imported Figma documents keep authored geometry.
    state.editor_ui.preserve_authored_geometry = preserve;
    println!("PROBE load_ms={}", started.elapsed().as_millis());
    let pages = state.doc.pages.as_ref().map_or(1, Vec::len);
    let only: Option<usize> = std::env::var("DSH_PROBE_PAGE")
        .ok()
        .and_then(|v| v.parse().ok());
    let repeat: usize = std::env::var("DSH_PROBE_REPEAT")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(1);
    let indices: Vec<usize> = match only {
        Some(index) => std::iter::repeat_n(index, repeat).collect(),
        None => (0..pages).collect(),
    };
    for index in indices {
        state.ui.active_page_index = index;
        let refs_started = std::time::Instant::now();
        let expanded = op_editor_core::ref_resolve::resolve_refs_for_canvas_roots(
            state.active_children(),
            &state.doc,
        );
        let refs_ms = refs_started.elapsed().as_millis();
        drop(expanded);
        let started = std::time::Instant::now();
        let scene = crate::editor_state_to_active_page_layout_scene(&state);
        let elapsed = started.elapsed().as_millis();
        let roots = scene
            .pages
            .get(scene.active_page_index)
            .map_or(0, |page| page.children.len());
        if elapsed >= 50 {
            println!("PROBE page={index} scene_ms={elapsed} refs_only_ms={refs_ms} roots={roots}");
        }
    }
}

fn document_value_preserves_geometry(raw: &str) -> bool {
    let value: serde_json::Value = serde_json::from_str(raw).unwrap_or_default();
    let document = value.get("document").unwrap_or(&value);
    document
        .pointer("/editorMeta/preserveAuthoredGeometry")
        .and_then(serde_json::Value::as_bool)
        .unwrap_or(false)
}
