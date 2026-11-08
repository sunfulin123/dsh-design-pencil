//! Figma REST import: converts a `GET /v1/files/:key/nodes` response with
//! the shared op-figma mapper and inserts it as one undoable step. Hosts
//! call it as the internal `import_figma_rest` tool after fetching (and
//! possibly chunking) the REST payload; it is not part of the AI catalog.

use std::collections::BTreeMap;

use jian_ops_schema::document::PenDocument;
use jian_ops_schema::node::PenNode;
use op_editor_core::{NodeId, PenNodeExt};
use op_figma::rest_adapter::{convert_rest_response, RestImportOptions};
use op_figma::FigLayoutMode;
use op_mcp::import_common::parse_import_placement;
use serde_json::{json, Value};

use crate::{error_reply, DesignEngine};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
impl DesignEngine {
    pub fn convert_figma_rest_nodes(source: &str, options: &str) -> Result<String, JsValue> {
        let body: Value = serde_json::from_str(source).map_err(crate::js_error)?;
        let opts: Value = serde_json::from_str(options).map_err(crate::js_error)?;
        let result = convert_rest_response(
            &body,
            &RestImportOptions {
                layout_mode: if opts["layout"] == "semantic" {
                    FigLayoutMode::OpenPencil
                } else {
                    FigLayoutMode::Preserve
                },
                origin: if opts["keepCoordinates"] == true {
                    None
                } else {
                    Some((0.0, 0.0))
                },
                ..Default::default()
            },
        );
        Ok(json!({
            "nodes": result.nodes, "bounds": result.bounds, "sourceBounds": result.source_bounds,
            "warnings": result.warnings, "imageRefs": result.image_refs, "nodeCount": result.node_count,
            "fonts": result.fonts.iter().map(|f| json!({"family": f.family, "weight": f.weight, "italic": f.italic})).collect::<Vec<_>>(),
        }).to_string())
    }
}

/// Gap between existing page content and an import placed beside it.
const DROP_GAP: f64 = 100.0;

/// Right edge / top of the numeric-sized top-level content of a page.
fn content_extent(nodes: &[PenNode]) -> Option<(f64, f64)> {
    nodes
        .iter()
        .filter_map(|n| {
            let b = n.base();
            Some((b.x? + n.width_px().unwrap_or(0.0), b.y?))
        })
        .reduce(|(r, t), (r2, t2)| (r.max(r2), t.min(t2)))
}

fn rewrite_image_urls(
    nodes: &mut [PenNode],
    urls: &BTreeMap<String, String>,
) -> Result<(), String> {
    if urls.is_empty() {
        return Ok(());
    }
    for node in nodes.iter_mut() {
        let mut value =
            serde_json::to_value(&*node).map_err(|e| format!("Serialize imported node: {e}"))?;
        if rewrite_value(&mut value, urls) {
            *node = serde_json::from_value(value)
                .map_err(|e| format!("Resolve imported image: {e}"))?;
        }
    }
    Ok(())
}

fn rewrite_value(value: &mut Value, urls: &BTreeMap<String, String>) -> bool {
    match value {
        Value::String(s) => {
            let Some(hex) = s.strip_prefix("__hash:") else {
                return false;
            };
            match urls.get(&hex.to_ascii_lowercase()) {
                Some(url) => {
                    *s = url.clone();
                    true
                }
                None => false,
            }
        }
        Value::Array(items) => items
            .iter_mut()
            .fold(false, |hit, v| rewrite_value(v, urls) | hit),
        Value::Object(map) => map
            .values_mut()
            .fold(false, |hit, v| rewrite_value(v, urls) | hit),
        _ => false,
    }
}

/// `imageUrlsJson` maps Figma `imageRef` → resolved URL; keys are matched
/// against the lower-hex `__hash:` placeholders the mapper emits.
fn parse_image_urls(raw: Option<&String>) -> Result<BTreeMap<String, String>, String> {
    let Some(raw) = raw.filter(|r| !r.trim().is_empty()) else {
        return Ok(BTreeMap::new());
    };
    let map: BTreeMap<String, String> =
        serde_json::from_str(raw).map_err(|e| format!("invalid imageUrlsJson: {e}"))?;
    Ok(map
        .into_iter()
        .map(|(image_ref, url)| {
            let raw = image_ref.trim();
            let hex = if raw.len().is_multiple_of(2) && raw.bytes().all(|b| b.is_ascii_hexdigit()) {
                raw.to_ascii_lowercase()
            } else {
                raw.bytes().map(|b| format!("{b:02x}")).collect()
            };
            (hex, url)
        })
        .collect())
}

/// Translate top-level nodes so the union of their numeric boxes starts at
/// `origin`, keeping their relative placement (used by `.fig` imports).
pub(crate) fn translate_roots(nodes: &mut [PenNode], origin: (f64, f64)) {
    let Some((min_x, min_y)) = nodes
        .iter()
        .filter_map(|n| Some((n.base().x?, n.base().y?)))
        .reduce(|(ax, ay), (bx, by)| (ax.min(bx), ay.min(by)))
    else {
        return;
    };
    let (dx, dy) = (origin.0 - min_x, origin.1 - min_y);
    for node in nodes {
        let base = node.base_mut();
        if let (Some(x), Some(y)) = (base.x, base.y) {
            base.x = Some(x + dx);
            base.y = Some(y + dy);
        }
    }
}

pub(crate) fn normalize_document_roots(doc: &mut PenDocument) {
    translate_roots(&mut doc.children, (0.0, 0.0));
    for page in doc.pages.iter_mut().flatten() {
        translate_roots(&mut page.children, (0.0, 0.0));
    }
}

/// Resolve a page id (or legacy numeric index) to its index.
fn page_index(doc: &PenDocument, page: &str) -> Option<usize> {
    let Some(pages) = doc.pages.as_ref() else {
        return (page == "0").then_some(0);
    };
    pages
        .iter()
        .position(|p| p.id == page)
        .or_else(|| page.parse::<usize>().ok().filter(|i| *i < pages.len()))
}

impl DesignEngine {
    /// Insert as one undo step without the generation-only "replace an
    /// empty root frame" swap: an import must never consume an existing
    /// board. Colliding ids are reallocated.
    pub(crate) fn insert_preserving_roots(
        &mut self,
        nodes: Vec<PenNode>,
        parent: &NodeId,
        page: Option<&str>,
        was_empty: bool,
        semantic: bool,
        variables: op_figma::fig_document_variables::FigDocumentVariables,
    ) -> Option<Vec<String>> {
        let target = match page {
            Some(page) => Some(page_index(&self.state.doc, page)?),
            None => None,
        };
        let previous = self.state.snapshot_for_history();
        let original_page = self.state.ui.active_page_index;
        if let Some(index) = target {
            self.state.ui.active_page_index = index;
        }
        let roots = self.state.insert_subtree_preserving_roots(nodes, parent);
        self.state.ui.active_page_index = original_page;
        let roots = roots?;
        variables.apply_to(&mut self.state.doc);
        if was_empty {
            op_pen_loader::apply_editor_meta(
                &mut self.state,
                op_pen_loader::EditorMeta {
                    active_page_index: 0,
                    preserve_authored_geometry: !semantic,
                    scenario: None,
                    pinned_style_guide: None,
                    viewport: None,
                },
            );
        }
        self.state.history_push_past(previous);
        Some(roots)
    }

    /// Where an import's top-left lands: explicit `x`/`y` (relative to the
    /// parent when one is given), else beside the active page's content.
    pub(crate) fn drop_origin(
        &self,
        args: &BTreeMap<String, String>,
        placement: &op_mcp::import_common::ImportPlacement,
    ) -> (f64, f64) {
        let explicit_xy = args.contains_key("x") || args.contains_key("y");
        if explicit_xy || placement.parent_id.is_real() {
            return (
                args.get("x")
                    .and_then(|v| v.parse().ok())
                    .unwrap_or(placement.x as f64),
                args.get("y")
                    .and_then(|v| v.parse().ok())
                    .unwrap_or(placement.y as f64),
            );
        }
        let target = placement
            .page_id
            .as_deref()
            .and_then(|id| page_index(&self.state.doc, id))
            .and_then(|index| self.state.doc.pages.as_ref()?.get(index))
            .map(|page| page.children.as_slice())
            .unwrap_or_else(|| self.state.active_children());
        content_extent(target)
            .map(|(right, top)| (right + DROP_GAP, top))
            .unwrap_or((0.0, 0.0))
    }

    pub(crate) fn call_import_figma_rest(&mut self, args: &BTreeMap<String, String>) -> String {
        let Some(raw) = args.get("restJson").filter(|v| !v.trim().is_empty()) else {
            return error_reply("restJson is required");
        };
        let body: Value = match serde_json::from_str(raw) {
            Ok(body) => body,
            Err(error) => return error_reply(&format!("invalid restJson: {error}")),
        };
        let mut placement_args = args.clone();
        for key in ["x", "y"] {
            if let Some(raw) = placement_args.remove(key) {
                if !raw.parse::<f64>().ok().is_some_and(f64::is_finite) {
                    return error_reply(&format!("{key}: expected a finite number"));
                }
            }
        }
        let placement = match parse_import_placement(&placement_args) {
            Ok(placement) => placement,
            Err((_, message)) => return error_reply(&message),
        };
        let image_urls = match parse_image_urls(args.get("imageUrlsJson")) {
            Ok(map) => map,
            Err(message) => return error_reply(&message),
        };
        let was_empty = self.state.doc.children.is_empty()
            && self
                .state
                .doc
                .pages
                .as_ref()
                .is_none_or(|pages| pages.iter().all(|p| p.children.is_empty()));
        let semantic = match args.get("layout").map(String::as_str) {
            None | Some("") | Some("preserve") => false,
            Some("semantic") => true,
            Some(other) => {
                return error_reply(&format!(
                    "layout: expected \"preserve\" or \"semantic\", got {other:?}"
                ))
            }
        };
        let origin = if args.get("keepCoordinates").map(String::as_str) == Some("true") {
            None
        } else {
            Some(self.drop_origin(args, &placement))
        };
        let num = |key: &str| {
            args.get(key)
                .and_then(|v| v.trim().parse::<f64>().ok())
                .filter(|v| v.is_finite())
        };
        let source_anchor = match (num("sourceOriginX"), num("sourceOriginY")) {
            (Some(x), Some(y)) => Some((x, y)),
            (None, None) => None,
            _ => return error_reply("sourceOriginX and sourceOriginY must be given together"),
        };
        let options = RestImportOptions {
            layout_mode: if semantic {
                FigLayoutMode::OpenPencil
            } else {
                FigLayoutMode::Preserve
            },
            origin,
            source_anchor,
        };
        let parents: Vec<Value> = match args.get("sourceParentsJson") {
            Some(raw) => match serde_json::from_str(raw) {
                Ok(parents) => parents,
                Err(error) => return error_reply(&format!("Invalid sourceParentsJson: {error}")),
            },
            None => Vec::new(),
        };
        let mut contextual_body = body.clone();
        if !parents.is_empty() {
            let Some(entries) = body.get("nodes").and_then(Value::as_object) else {
                return error_reply("Contextual import requires a nodes response");
            };
            let mut children = entries
                .values()
                .filter_map(|entry| entry.get("document").cloned())
                .collect::<Vec<_>>();
            for parent in parents.iter().rev() {
                let mut shell = parent.clone();
                shell["children"] = json!(children);
                children = vec![shell];
            }
            contextual_body = json!({"nodes": {"context": {"document": children[0]}}});
        }
        let context_options = RestImportOptions {
            layout_mode: if parents.is_empty() {
                options.layout_mode
            } else {
                FigLayoutMode::Preserve
            },
            ..options
        };
        let mut result = convert_rest_response(&contextual_body, &context_options);
        if !parents.is_empty() {
            for _ in &parents {
                let Some(root) = result.nodes.first_mut() else {
                    return error_reply("Source parent context contains no convertible frame");
                };
                result.nodes = root.children_mut().map(std::mem::take).unwrap_or_default();
            }
            result.node_count = op_mcp::import_common::count_subtree_nodes(&result.nodes);
            result.bounds = None;
            result.source_bounds = None;
        }
        if semantic && parents.is_empty() {
            let preserve = convert_rest_response(
                &body,
                &RestImportOptions {
                    layout_mode: FigLayoutMode::Preserve,
                    ..options
                },
            );
            let boxes = |nodes: &[PenNode], authored: bool| {
                let mut state = op_editor_core::EditorState::new();
                state.doc = self.state.doc.clone();
                state.doc.pages = None;
                state.doc.children = nodes.to_vec();
                state.editor_ui.preserve_authored_geometry = authored;
                let scene = op_pen_loader::editor_state_to_layout_scene(&state);
                let mut out = BTreeMap::new();
                let mut pending = scene
                    .pages
                    .iter()
                    .flat_map(|p| p.children.iter())
                    .collect::<Vec<_>>();
                while let Some(node) = pending.pop() {
                    out.insert(
                        node.id.clone(),
                        [
                            node.bounds.origin.x,
                            node.bounds.origin.y,
                            node.bounds.size.x,
                            node.bounds.size.y,
                        ],
                    );
                    pending.extend(node.children.iter());
                }
                out
            };
            let expected = boxes(&preserve.nodes, true);
            let actual = boxes(&result.nodes, false);
            for (root, fixed) in result.nodes.iter_mut().zip(preserve.nodes) {
                let mut stack = vec![&*root];
                let mut drift = false;
                while let Some(node) = stack.pop() {
                    if let Some(children) = node.children() {
                        stack.extend(children.iter());
                    }
                    let id = node.id_str();
                    match (expected.get(id), actual.get(id)) {
                        (Some(a), Some(b))
                            if a.iter().zip(b).all(|(a, b)| (a - b).abs() <= 0.5) => {}
                        _ => drift = true,
                    }
                }
                if drift || (!was_empty && self.state.editor_ui.preserve_authored_geometry) {
                    result.warnings.push(format!(
                        "Kept fixed geometry for {:?}: semantic layout did not match within 0.5px or the destination preserves authored geometry",
                        root.base().name.as_deref().unwrap_or(root.id_str())
                    ));
                    *root = fixed;
                }
            }
        }
        if result.nodes.is_empty() {
            return error_reply("Figma response contains no importable (visible) nodes");
        }
        if let Err(message) = rewrite_image_urls(&mut result.nodes, &image_urls) {
            return error_reply(&message);
        }
        let parent_label =
            (placement.parent_id != NodeId::NONE).then(|| placement.parent_id.to_string());
        let Some(root_ids) = self.insert_preserving_roots(
            result.nodes,
            &placement.parent_id,
            placement.page_id.as_deref(),
            was_empty,
            semantic,
            Default::default(),
        ) else {
            return error_reply(
                "Figma import could not be inserted: the parent is missing or not a container",
            );
        };
        let unresolved: Vec<&String> = result
            .image_refs
            .iter()
            .filter(|r| {
                let key = r.to_ascii_lowercase();
                !image_urls.contains_key(&key)
                    && !image_urls
                        .contains_key(&r.bytes().map(|b| format!("{b:02x}")).collect::<String>())
            })
            .collect();
        crate::ok_reply(json!({
            "wrote": "true",
            "nodeCount": result.node_count,
            "rootIds": root_ids,
            "parentId": parent_label,
            "bounds": result.bounds,
            "sourceBounds": result.source_bounds,
            "layout": if semantic { "semantic" } else { "preserve" },
            "imageRefs": result.image_refs,
            "unresolvedImageRefs": unresolved,
            "fonts": result.fonts.iter().map(|f| json!({
                "family": f.family,
                "weight": f.weight,
                "italic": f.italic,
                "postscript": f.postscript,
            })).collect::<Vec<_>>(),
            "warnings": result.warnings,
        }))
    }
}
