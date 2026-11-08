use std::collections::BTreeMap;

use jian_ops_schema::node::PenNode;
use jian_ops_schema::style::StrokeThickness;
use jian_scene::layout_scene::{NodeKind, SceneNode};
use op_editor_core::command_node::remap_subtree_ids_mapping;
use op_editor_core::{EditorCommand, EditorState, NodeId, PenNodeExt};
use serde::Deserialize;

use super::connector_error::ConnectorError;
use super::{McpTool, ToolErrorCode, ToolOutcome};
use op_html::diagram::model::{Edge, Graph, Shape, Vertex};
use op_html::diagram::nodes;

#[derive(Clone, Copy, Default, Deserialize)]
#[serde(rename_all = "snake_case")]
enum Routing {
    #[default]
    Straight,
    Orthogonal,
}

#[derive(Deserialize)]
#[serde(default, deny_unknown_fields, rename_all = "camelCase")]
struct ConnectorStyle {
    routing: Routing,
    stroke_color: String,
    stroke_width: f32,
    arrow: bool,
}

impl Default for ConnectorStyle {
    fn default() -> Self {
        Self {
            routing: Routing::Straight,
            stroke_color: "#334155".into(),
            stroke_width: 2.0,
            arrow: true,
        }
    }
}

impl ConnectorStyle {
    fn parse(raw: Option<&String>) -> Result<Self, ConnectorError> {
        let style = match raw.map(|s| s.trim()) {
            None | Some("") | Some("straight") => Self::default(),
            Some("orthogonal") => Self {
                routing: Routing::Orthogonal,
                ..Self::default()
            },
            Some(raw) => {
                serde_json::from_str::<Self>(raw).map_err(|e| ConnectorError::InvalidStyle {
                    detail: e.to_string(),
                })?
            }
        };
        if !style.stroke_width.is_finite()
            || style.stroke_width <= 0.0
            || style.stroke_width > 128.0
        {
            return Err(ConnectorError::InvalidStyle {
                detail: "strokeWidth must be positive and at most 128".into(),
            });
        }
        if op_util::hex_color::parse_hex_rgba8(
            &style.stroke_color,
            op_util::hex_color::HexOptions {
                require_hash: true,
                ..Default::default()
            },
        )
        .is_none()
        {
            return Err(ConnectorError::InvalidStyle {
                detail: "strokeColor must be a hex color".into(),
            });
        }
        Ok(style)
    }
}

/// Geometry and id policy come from one active-state snapshot. The paths are
/// explicitly static: canonical PathNode/LineNode have no endpoint-link fields.
/// Authored insertion preserves reported ids or rejects a collision at apply.
pub struct CreateConnector {
    state: EditorState,
    endpoints: BTreeMap<String, Option<Vertex>>,
    page_id: Option<String>,
}

pub fn create_connector_snapshot(state: &EditorState) -> CreateConnector {
    fn collect(nodes: &[SceneNode], transformed: bool, out: &mut BTreeMap<String, Option<Vertex>>) {
        for node in nodes {
            let transformed = transformed
                || node.rotation != 0.0
                || node.flip_x
                || node.flip_y
                || node.opacity <= 0.0
                || node.composite_opacity <= 0.0;
            let bounds = node.bounds;
            let numbers = [
                bounds.origin.x,
                bounds.origin.y,
                bounds.size.x,
                bounds.size.y,
            ];
            let valid = !transformed
                && node.opacity > 0.0
                && numbers.iter().all(|n| n.is_finite())
                && bounds.size.x > 0.0
                && bounds.size.y > 0.0;
            let vertex = valid.then(|| {
                let shape = if matches!(node.kind, NodeKind::Ellipse) {
                    Shape::Ellipse
                } else {
                    Shape::Rectangle
                };
                let mut v = Vertex::new(node.id.clone(), String::new(), shape, true);
                v.x = bounds.origin.x as f64;
                v.y = bounds.origin.y as f64;
                v.width = bounds.size.x as f64;
                v.height = bounds.size.y as f64;
                v
            });
            out.insert(node.id.clone(), vertex);
            collect(&node.children, transformed, out);
        }
    }
    let scene = op_pen_loader::editor_state_to_active_page_layout_scene(state);
    let mut endpoints = BTreeMap::new();
    if let Some(page) = scene.active_page() {
        collect(&page.children, false, &mut endpoints);
    }
    let page_id = state
        .doc
        .pages
        .as_ref()
        .and_then(|pages| pages.get(scene.active_page_index))
        .map(|p| p.id.clone());
    CreateConnector {
        state: state.clone(),
        endpoints,
        page_id,
    }
}

impl CreateConnector {
    fn endpoint(
        &self,
        args: &BTreeMap<String, String>,
        key: &'static str,
        alias: &'static str,
    ) -> Result<Vertex, ConnectorError> {
        let id = args
            .get(key)
            .or_else(|| args.get(alias))
            .map(|s| s.trim())
            .filter(|s| !s.is_empty())
            .ok_or(ConnectorError::MissingArgument { key })?;
        self.endpoints
            .get(id)
            .ok_or_else(|| ConnectorError::UnknownEndpoint { id: id.into() })?
            .clone()
            .ok_or_else(|| ConnectorError::UnsupportedGeometry { id: id.into() })
    }

    fn outcome(&self, args: &BTreeMap<String, String>) -> Result<ToolOutcome, ConnectorError> {
        let from = self.endpoint(args, "fromId", "from_id")?;
        let to = self.endpoint(args, "toId", "to_id")?;
        let style = ConnectorStyle::parse(args.get("style"))?;
        let mut graph = Graph::new("Connector");
        graph.edges.push(Edge {
            source: from.id.clone(),
            target: to.id.clone(),
            label: args.get("label").cloned().unwrap_or_default(),
            arrow: style.arrow,
            orthogonal: matches!(style.routing, Routing::Orthogonal),
            stroke: style.stroke_color,
            waypoints: Vec::new(),
        });
        let from_id = from.id.clone();
        let to_id = to.id.clone();
        graph.vertices = vec![from, to];
        let mut nodes = nodes::render_edges(&graph)?;
        for node in &mut nodes {
            if let PenNode::Path(path) = node {
                if let Some(stroke) = &mut path.stroke {
                    stroke.thickness = StrokeThickness::Uniform(style.stroke_width);
                }
            }
        }
        let mut seed = self
            .state
            .next_node_id_seed()
            .ok_or(ConnectorError::IdSpaceExhausted)?;
        let mut taken = self.state.collect_node_ids();
        remap_subtree_ids_mapping(&mut nodes, &mut seed, &mut taken)
            .ok_or(ConnectorError::IdSpaceExhausted)?;
        let ids: Vec<_> = nodes.iter().map(|node| node.id_str()).collect();
        let primary_id = nodes
            .iter()
            .find(|node| matches!(node, PenNode::Path(_)))
            .expect("connector always contains its path")
            .id_str();
        let output = BTreeMap::from([
            ("wrote".into(), "true".into()),
            ("nodeId".into(), primary_id.to_string()),
            ("nodeIds".into(), serde_json::json!(ids).to_string()),
            ("fromId".into(), from_id),
            ("toId".into(), to_id),
            ("binding".into(), "static".into()),
            ("liveFollow".into(), "false".into()),
            ("snapshotRevision".into(), self.state.revision.to_string()),
            ("endpointMode".into(), "layout-bounds".into()),
            (
                "routing".into(),
                if matches!(style.routing, Routing::Orthogonal) {
                    "orthogonal"
                } else {
                    "straight"
                }
                .into(),
            ),
        ]);
        Ok(ToolOutcome::OkWithCommand(
            output,
            EditorCommand::InsertAuthoredSubtree {
                nodes,
                parent_id: NodeId::NONE,
                page_id: self.page_id.clone(),
            },
        ))
    }
}

impl McpTool for CreateConnector {
    fn name(&self) -> &str {
        "create_connector"
    }

    fn call(&self, args: &BTreeMap<String, String>) -> ToolOutcome {
        match self.outcome(args) {
            Ok(outcome) => outcome,
            Err(error) => {
                let code = match error {
                    ConnectorError::MissingArgument { .. } => ToolErrorCode::MissingArgument,
                    ConnectorError::IdSpaceExhausted => ToolErrorCode::ToolFailed,
                    _ => ToolErrorCode::InvalidArgument,
                };
                ToolOutcome::Err(code, error.to_string())
            }
        }
    }
}
