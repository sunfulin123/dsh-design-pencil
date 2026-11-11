//! Compatibility loading for complete daemon documents.

pub(super) fn load_compatible(
    document: &serde_json::Value,
) -> Result<jian_ops_schema::PenDocument, String> {
    op_pen_loader::load_canonical(&document.to_string())
        .map(|loaded| loaded.value)
        .map_err(|error| error.to_string())
}
