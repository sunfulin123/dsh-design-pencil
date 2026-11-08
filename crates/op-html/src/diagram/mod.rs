//! Shared, bounded Mermaid flowchart and draw.io importers.
//! Nodes and connectors are editable; connector geometry is static, not live.

mod drawio;
mod drawio_decode;
mod error;
mod layout;
mod mermaid;
#[doc(hidden)]
pub mod model;
#[doc(hidden)]
pub mod nodes;

pub use drawio_decode::{
    MAX_DRAWIO_COMPRESSED_BYTES, MAX_DRAWIO_EXPANDED_BYTES, MAX_DRAWIO_SOURCE_BYTES,
};
pub use error::DiagramError;

pub fn import_mermaid(source: &str) -> Result<crate::HtmlImportResult, DiagramError> {
    let mut graph = mermaid::parse(source)?;
    layout::layout(&mut graph);
    nodes::render(&graph)
}

pub fn import_drawio(source: &str) -> Result<crate::HtmlImportResult, DiagramError> {
    nodes::render(&drawio::parse(source)?)
}

#[cfg(test)]
mod stacking_tests;
