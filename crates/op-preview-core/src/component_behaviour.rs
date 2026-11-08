use std::collections::BTreeMap;

use jian_ops_schema::PenDocument;

use crate::error::PreviewEnterError;

/// Prepare behaviour before the existing ref/token passes so native input,
/// bindings and the painted document share one resolved identity space.
pub(super) fn prepare(
    doc: &PenDocument,
    active_theme: &BTreeMap<String, String>,
) -> Result<PenDocument, PreviewEnterError> {
    let mut prepared = op_editor_core::component_behaviour::compile_component_behaviour(doc)
        .map_err(|error| PreviewEnterError::Parse(error.to_string()))?;
    if op_editor_core::ref_resolve::document_has_refs(&prepared) {
        prepared = op_editor_core::ref_resolve::resolve_refs_for_canvas(&prepared);
    }
    if op_editor_core::variables_resolve::document_has_tokens(&prepared) {
        prepared =
            op_editor_core::variables_resolve::resolve_document_for_canvas(&prepared, active_theme);
    }
    Ok(prepared)
}
