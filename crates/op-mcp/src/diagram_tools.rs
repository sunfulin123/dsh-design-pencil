//! Editable diagram imports. Only the documented flowchart/XML subset is
//! accepted; unsupported constructs fail atomically instead of losing content.
//! `source` aliases the existing `mermaid`/`xml` input arguments.
//!
//! Mermaid: `graph`/`flowchart` TD/TB/BT/LR/RL; identifiers, rectangle `[text]`,
//! rounded `(text)`/`([text])`, ellipse `((text))`, diamond `{text}`, chains of
//! `-->`/`---`, `|label|`, quoted plain labels, standalone vertices and inline
//! `%%` comments. A deterministic layered layout handles branches, disconnected
//! components and cycles. Subgraphs, styling/classes, other edge operators,
//! directives and HTML/escaped labels are rejected.
//!
//! draw.io: one `mxGraphModel` (bare or inside `mxfile/diagram`),
//! flat cells on anonymous layers, absolute vertex geometry, the same four
//! shapes, hex colors, font size, bound straight/orthogonal edges and explicit
//! waypoint arrays. Compressed diagram text uses strict standard base64, raw
//! DEFLATE, then strict percent/UTF-8 decoding. Limits are 1 MiB compressed and
//! 8 MiB inflated URI text/XML source. Named layers, groups, multiple pages, HTML
//! labels, relative vertices and unsupported styles fail with `DiagramError`.
//! Arrows are editable open path arrowheads. Other explicit arrow styles fail.
//!
//! Both tools use the standard x/y/parent/pageId placement arguments and
//! InsertSubtree's shared ID remapping. Shape, text, connector and arrowhead
//! are distinct editable nodes. Connections are imported geometry, not live
//! bindings: moving a shape does not automatically reroute its connector.
//!
//! `create_connector_snapshot(state)` implements `create_connector(fromId,
//! toId, style?)` against resolved active-page layout geometry. `style` is
//! `straight`/`orthogonal`, or an object with `routing`, `strokeColor`,
//! `strokeWidth`, and `arrow`. The optional `label` is plain editable text.
//! Results return exact `nodeId`/`nodeIds`, `binding=static`, `liveFollow=false`,
//! and `endpointMode=layout-bounds`. Paths insert on the snapshotted page root;
//! ellipse terminals dock on the ellipse, other terminals on their layout box.
//! Transformed ancestors/endpoints are rejected, and stale id collisions reject
//! command application rather than silently remapping the reported ids.
use std::collections::BTreeMap;

use op_html::HtmlImportResult;

use super::import_common::{import_result_to_outcome, parse_import_placement};
use super::{McpTool, ToolErrorCode, ToolOutcome};

#[path = "diagram_connector.rs"]
mod connector;
#[path = "diagram_connector_error.rs"]
mod connector_error;
pub use connector::{create_connector_snapshot, CreateConnector};
pub use connector_error::ConnectorError;
pub use op_html::diagram::{
    import_drawio, import_mermaid, DiagramError, MAX_DRAWIO_COMPRESSED_BYTES,
    MAX_DRAWIO_EXPANDED_BYTES, MAX_DRAWIO_SOURCE_BYTES,
};

fn call(
    args: &BTreeMap<String, String>,
    key: &str,
    importer: fn(&str) -> Result<HtmlImportResult, DiagramError>,
) -> ToolOutcome {
    let Some(source) = args.get(key).or_else(|| args.get("source")) else {
        return ToolOutcome::Err(ToolErrorCode::MissingArgument, format!("{key} is required"));
    };
    let placement = match parse_import_placement(args) {
        Ok(value) => value,
        Err((code, message)) => return ToolOutcome::Err(code, message),
    };
    match importer(source) {
        Ok(result) => import_result_to_outcome(result, placement),
        Err(error) => ToolOutcome::Err(ToolErrorCode::InvalidArgument, error.to_string()),
    }
}

pub struct ImportMermaid;
impl McpTool for ImportMermaid {
    fn name(&self) -> &str {
        "import_mermaid"
    }
    fn call(&self, args: &BTreeMap<String, String>) -> ToolOutcome {
        call(args, "mermaid", import_mermaid)
    }
}

pub struct ImportDrawio;
impl McpTool for ImportDrawio {
    fn name(&self) -> &str {
        "import_drawio"
    }
    fn call(&self, args: &BTreeMap<String, String>) -> ToolOutcome {
        call(args, "xml", import_drawio)
    }
}

pub fn import_mermaid_snapshot() -> ImportMermaid {
    ImportMermaid
}
pub fn import_drawio_snapshot() -> ImportDrawio {
    ImportDrawio
}

#[cfg(test)]
#[path = "diagram_tests.rs"]
mod tests;

#[cfg(test)]
#[path = "diagram_connector_tests.rs"]
mod connector_tests;

#[cfg(test)]
#[path = "diagram_drawio_decode_tests.rs"]
mod drawio_decode_tests;
