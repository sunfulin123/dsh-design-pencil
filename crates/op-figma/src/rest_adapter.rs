//! Figma REST API → canonical `PenNode`s.
//!
//! `GET /v1/files/:key/nodes?ids=…&geometry=paths` returns a JSON node tree
//! whose fields mirror (with different names) the binary `.fig` node
//! changes. Rather than keep a second mapper, this adapter rebuilds each REST
//! node as a kiwi-shaped [`TreeNode`] and runs the binary importer's
//! converters on it, so sizing (Hug/Fill/grow), absolute positioning, text
//! case / truncation, masks, booleans and vector decoding behave identically
//! for `.fig` files, clipboard pastes and REST imports.

mod fields;
mod geometry;
mod path_blob;
#[cfg(test)]
#[allow(clippy::approx_constant)]
mod tests;
mod text;

use crate::common::{ConversionContext, FigLayoutMode};
use crate::converters::convert_node;
use crate::figma_types::BlobOrString;
use crate::kiwi::FigValue;
use crate::tree::{collect_components, collect_symbol_tree, TreeNode};
use fields::{f64_of, num, obj, put, str_of, text as fig_text, Fields};
use geometry::{absolute_transform, node_size, Affine, Bounds};
use jian_ops_schema::node::PenNode;
use serde_json::Value;
use std::collections::{BTreeSet, HashMap};

pub use text::RestFontFace;

/// Conversion options for [`convert_rest_nodes`].
#[derive(Debug, Clone, Copy)]
pub struct RestImportOptions {
    pub layout_mode: FigLayoutMode,
    /// Where the top-left of the union of the roots' bounding boxes should
    /// land. `None` keeps Figma's page coordinates.
    pub origin: Option<(f64, f64)>,
    /// Source (Figma page) point that lands on `origin` instead of the
    /// roots' own top-left — lets separately imported chunks share one
    /// translation.
    pub source_anchor: Option<(f64, f64)>,
}

impl Default for RestImportOptions {
    fn default() -> Self {
        RestImportOptions {
            layout_mode: FigLayoutMode::Preserve,
            origin: Some((0.0, 0.0)),
            source_anchor: None,
        }
    }
}

/// Outcome of a REST conversion.
#[derive(Debug, Clone)]
pub struct RestImportResult {
    pub nodes: Vec<PenNode>,
    pub warnings: Vec<String>,
    /// Every `imageRef` used; image paints carry `__hash:<lower-hex ref>`.
    pub image_refs: Vec<String>,
    pub fonts: Vec<RestFontFace>,
    /// Union of the roots' Figma `absoluteBoundingBox` as `[x, y, w, h]`.
    pub source_bounds: Option<[f64; 4]>,
    /// Same box after the `origin` shift, i.e. where the nodes landed.
    pub bounds: Option<[f64; 4]>,
    pub node_count: usize,
}

/// Hidden layers are skipped. Fully transparent ones are kept: Figma still
/// lays them out, and they stay editable.
fn is_visible(node: &Value) -> bool {
    node.get("visible").and_then(Value::as_bool) != Some(false)
}

fn kiwi_type(rest: &str) -> &str {
    match rest {
        "COMPONENT" => "SYMBOL",
        // Instances arrive fully expanded and component sets are plain
        // containers, so both import as frames.
        "INSTANCE" | "COMPONENT_SET" => "FRAME",
        other => other,
    }
}

fn guid(id: &str) -> Option<FigValue> {
    let (session, local) = id.split_once(':')?;
    Some(obj(vec![
        ("sessionID", FigValue::Uint(session.parse().ok()?)),
        ("localID", FigValue::Uint(local.parse().ok()?)),
    ]))
}

struct Builder {
    blobs: Vec<BlobOrString>,
    warnings: Vec<String>,
    image_refs: BTreeSet<String>,
    fonts: BTreeSet<RestFontFace>,
    count: usize,
    shift: (f64, f64),
}

impl Builder {
    fn geometry(&mut self, node: &Value, key: &str, out: &str, f: &mut Fields) {
        let Some(list) = node.get(key).and_then(Value::as_array) else {
            return;
        };
        let mut entries = Vec::new();
        for g in list {
            let Some(path) = str_of(g, "path") else {
                continue;
            };
            let Some(blob) = path_blob::encode_svg_path(path) else {
                self.warnings.push(format!(
                    "Unsupported vector path on {:?}",
                    str_of(node, "name").unwrap_or("")
                ));
                continue;
            };
            self.blobs.push(BlobOrString::Bytes(blob));
            let rule = if str_of(g, "windingRule") == Some("EVENODD") {
                "ODD"
            } else {
                "NONZERO"
            };
            entries.push(obj(vec![
                ("windingRule", fig_text(rule)),
                ("commandsBlob", num((self.blobs.len() - 1) as f64)),
            ]));
        }
        put(f, out, FigValue::Array(entries));
    }

    fn build(
        &mut self,
        node: &Value,
        parent: Option<&Value>,
        parent_abs: Affine,
    ) -> Option<TreeNode> {
        if !is_visible(node) {
            return None;
        }
        let rest_type = str_of(node, "type")?;
        if rest_type == "INSTANCE" {
            self.warnings.push(format!(
                "Instance {:?} imported as an expanded frame; component linkage is not retained by REST import",
                str_of(node, "name").unwrap_or("")
            ));
        }
        if str_of(node, "layoutWrap") == Some("WRAP") {
            self.warnings.push(format!(
                "Wrapped auto layout on {:?} keeps authored positions; wrap semantics are not supported",
                str_of(node, "name").unwrap_or("")
            ));
        }
        self.count += 1;
        let abs = absolute_transform(node, parent_abs.linear(), parent_abs, self.shift);
        let local = parent_abs
            .inverse()
            .unwrap_or(Affine::IDENTITY)
            .then_after(abs);
        let (w, h) = node_size(node, Bounds::from_rest(node.get("absoluteBoundingBox")));

        let mut f: Fields = Vec::new();
        if let Some(g) = str_of(node, "id").and_then(guid) {
            put(&mut f, "guid", g);
        }
        if let Some(id) = str_of(node, "id") {
            put(&mut f, crate::common::SOURCE_ID_KEY, fig_text(id));
        }
        put(&mut f, "type", fig_text(kiwi_type(rest_type)));
        if let Some(name) = str_of(node, "name") {
            put(&mut f, "name", fig_text(name));
        }
        if let Some(o) = f64_of(node, "opacity").filter(|o| *o < 1.0) {
            put(&mut f, "opacity", num(o));
        }
        if node.get("locked").and_then(Value::as_bool) == Some(true) {
            put(&mut f, "locked", FigValue::Bool(true));
        }
        put(&mut f, "size", obj(vec![("x", num(w)), ("y", num(h))]));
        put(&mut f, "transform", local.to_fig());
        fields::visual(node, &mut f, &mut self.image_refs);
        fields::layout(node, parent.and_then(|p| str_of(p, "layoutMode")), &mut f);
        match rest_type {
            "TEXT" => text::text_fields(node, &mut f, &mut self.image_refs, &mut self.fonts),
            "VECTOR" | "STAR" | "REGULAR_POLYGON" | "BOOLEAN_OPERATION" => {
                self.geometry(node, "fillGeometry", "fillGeometry", &mut f);
                self.geometry(node, "strokeGeometry", "strokeGeometry", &mut f);
                if let Some(op) = str_of(node, "booleanOperation") {
                    put(&mut f, "booleanOperation", fig_text(op));
                }
            }
            "ELLIPSE" => {
                if let Some(arc) = node.get("arcData") {
                    let n = |k: &str| num(f64_of(arc, k).unwrap_or(0.0));
                    put(
                        &mut f,
                        "arcData",
                        obj(vec![
                            ("startingAngle", n("startingAngle")),
                            ("endingAngle", n("endingAngle")),
                            ("innerRadius", n("innerRadius")),
                        ]),
                    );
                }
            }
            _ => {}
        }

        // REST lists children bottom-most first; the binary tree (and the
        // canonical document) keeps the topmost layer first.
        let children = node
            .get("children")
            .and_then(Value::as_array)
            .map(|kids| {
                kids.iter()
                    .rev()
                    .filter_map(|c| self.build(c, Some(node), abs))
                    .collect()
            })
            .unwrap_or_default();
        Some(TreeNode {
            figma: FigValue::Object(f),
            children,
        })
    }
}

/// Convert REST node JSON values (the `document` of each `nodes` entry, or
/// any subtree) into canonical nodes. Roots keep their relative placement;
/// the group is translated so its bounding box starts at `options.origin`.
pub fn convert_rest_nodes(roots: &[Value], options: &RestImportOptions) -> RestImportResult {
    // A CANVAS (page) root contributes its children.
    let flattened: Vec<&Value> = roots
        .iter()
        .flat_map(|root| match str_of(root, "type") {
            Some("CANVAS" | "DOCUMENT") => root
                .get("children")
                .and_then(Value::as_array)
                .map(|c| c.iter().collect())
                .unwrap_or_default(),
            _ => vec![root],
        })
        .filter(|n| is_visible(n))
        .collect();
    let source = flattened
        .iter()
        .filter_map(|n| Bounds::from_rest(n.get("absoluteBoundingBox")))
        .reduce(Bounds::union);
    let anchor = options.source_anchor.or(source.map(|b| (b.x, b.y)));
    let shift = match (options.origin, anchor) {
        (Some((ox, oy)), Some((ax, ay))) => (ax - ox, ay - oy),
        _ => (0.0, 0.0),
    };
    let mut builder = Builder {
        blobs: Vec::new(),
        warnings: Vec::new(),
        image_refs: BTreeSet::new(),
        fonts: BTreeSet::new(),
        count: 0,
        shift,
    };
    // Roots are page children in Figma; the first listed is bottom-most.
    let trees: Vec<TreeNode> = flattened
        .iter()
        .rev()
        .filter_map(|n| builder.build(n, None, Affine::IDENTITY))
        .collect();

    let mut component_map: HashMap<String, String> = HashMap::new();
    let mut symbol_tree: HashMap<String, &TreeNode> = HashMap::new();
    let mut counter: u32 = 1;
    for tree in &trees {
        collect_components(tree, &mut component_map, &mut counter);
        collect_symbol_tree(tree, &mut symbol_tree);
    }
    let mut ctx = ConversionContext {
        component_map,
        symbol_tree,
        warnings: std::mem::take(&mut builder.warnings),
        id_counter: counter,
        blobs: std::mem::take(&mut builder.blobs),
        layout_mode: options.layout_mode,
        instance_assignments: HashMap::new(),
        instance_expansions: Default::default(),
        linkage: None,
        expansion_depth: 0,
        keep_hidden: false,
        variables: Default::default(),
        mode_scope: Vec::new(),
    };
    let mut nodes: Vec<PenNode> = trees
        .iter()
        .filter_map(|tree| convert_node(tree, None, &mut ctx))
        .collect();
    for root in roots {
        if let Some(flows) = root.get("flowStartingPoints").and_then(Value::as_array) {
            for flow in flows {
                let Some(node_id) = str_of(flow, "nodeId") else {
                    continue;
                };
                let name = str_of(flow, "name").unwrap_or("Flow 1").to_string();
                attach_rest_flow(&mut nodes, node_id, &name);
            }
        }
    }
    crate::fig_prototype::resolve_nodes_prototype(&mut nodes);
    let to_array = |b: Bounds| [b.x, b.y, b.w, b.h];
    RestImportResult {
        nodes,
        warnings: ctx.warnings,
        image_refs: builder.image_refs.into_iter().collect(),
        fonts: builder.fonts.into_iter().collect(),
        source_bounds: source.map(to_array),
        bounds: source.map(|b| {
            to_array(Bounds {
                x: b.x - shift.0,
                y: b.y - shift.1,
                ..b
            })
        }),
        node_count: builder.count,
    }
}

/// Parse a `GET /v1/files/:key/nodes` (or `/files/:key`) response body and
/// convert every returned document subtree.
pub fn convert_rest_response(body: &Value, options: &RestImportOptions) -> RestImportResult {
    let roots: Vec<Value> = if let Some(nodes) = body.get("nodes").and_then(Value::as_object) {
        nodes
            .values()
            .filter_map(|entry| entry.get("document").cloned())
            .collect()
    } else if let Some(doc) = body.get("document") {
        vec![doc.clone()]
    } else {
        vec![body.clone()]
    };
    convert_rest_nodes(&roots, options)
}

fn attach_rest_flow(nodes: &mut [PenNode], figma_node_id: &str, name: &str) -> bool {
    for node in nodes {
        let base = node.node_base_mut();
        if base.figma_node_id.as_deref() == Some(figma_node_id) {
            base.flow_starting_point = Some(jian_ops_schema::prototype::FlowStartingPoint {
                node_id: base.id.clone(),
                name: name.to_string(),
                description: None,
            });
            return true;
        }
        if let Some(children) = node.children_mut_slice() {
            if attach_rest_flow(children, figma_node_id, name) {
                return true;
            }
        }
    }
    false
}
