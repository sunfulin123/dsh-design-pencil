use crate::HtmlImportResult;
use jian_ops_schema::node::PenNode;
use serde_json::{json, Value};

use super::error::{syntax, DiagramError};
use super::model::{Edge, Graph, Shape, Vertex};

fn node(value: Value) -> Result<PenNode, DiagramError> {
    serde_json::from_value(value).map_err(|e| syntax(format!("canonical node: {e}")))
}

fn fill(color: &str) -> Value {
    if color == "none" {
        json!([])
    } else {
        json!([{"type":"solid","color":color}])
    }
}

fn stroke(color: &str) -> Value {
    json!({"thickness":2,"fill":fill(color),"cap":"round","join":"round"})
}

pub fn render_edges(graph: &Graph) -> Result<Vec<PenNode>, DiagramError> {
    let mut nodes = Vec::new();
    let mut labels = Vec::new();
    for (index, edge) in graph.edges.iter().enumerate() {
        let source = graph.vertices.iter().find(|v| v.id == edge.source).unwrap();
        let target = graph.vertices.iter().find(|v| v.id == edge.target).unwrap();
        let points = route(source, target, edge);
        nodes.push(path(
            &format!("diagram_edge_{index}"),
            &format!("Connector {} → {}", edge.source, edge.target),
            &points,
            &edge.stroke,
        )?);
        if edge.arrow {
            let end = points[points.len() - 1];
            let previous = points
                .iter()
                .rev()
                .skip(1)
                .find(|p| **p != end)
                .copied()
                .unwrap_or((end.0 - 1.0, end.1));
            let angle = (end.1 - previous.1).atan2(end.0 - previous.0);
            let (dx, dy) = (angle.cos() * 10.0, angle.sin() * 10.0);
            let arrow = [
                (end.0 - dx - dy * 0.5, end.1 - dy + dx * 0.5),
                end,
                (end.0 - dx + dy * 0.5, end.1 - dy - dx * 0.5),
            ];
            nodes.push(path(
                &format!("diagram_arrow_{index}"),
                "Arrowhead",
                &arrow,
                &edge.stroke,
            )?);
        }
        if !edge.label.is_empty() {
            let midpoint = midpoint(&points);
            labels.push(text(
                &format!("diagram_edge_label_{index}"),
                &edge.label,
                midpoint.0 - 70.0,
                midpoint.1 - 24.0,
                140.0,
                24.0,
                "#0f172a",
                14.0,
            )?);
        }
    }
    labels.extend(nodes);
    Ok(labels)
}

pub(super) fn render(graph: &Graph) -> Result<HtmlImportResult, DiagramError> {
    let (mut nodes, connectors): (Vec<_>, Vec<_>) = render_edges(graph)?
        .into_iter()
        .partition(|node| matches!(node, PenNode::Text(_)));
    let mut shapes = Vec::with_capacity(graph.vertices.len());
    for (index, vertex) in graph.vertices.iter().enumerate() {
        let id = format!("diagram_shape_{index}");
        let mut value = json!({
            "type":"rectangle","id":id,"name":vertex.label,
            "x":vertex.x,"y":vertex.y,"width":vertex.width,"height":vertex.height,
            "fill":fill(&vertex.fill),"stroke":stroke(&vertex.stroke)
        });
        match vertex.shape {
            Shape::Rectangle => {}
            Shape::Rounded => {
                value["cornerRadius"] = json!(16);
            }
            Shape::Ellipse => {
                value["type"] = json!("ellipse");
            }
            Shape::Diamond => {
                value["type"] = json!("path");
                value["closed"] = json!(true);
                value["d"] = json!(format!(
                    "M {} 0 L {} {} L {} {} L 0 {} Z",
                    vertex.width / 2.0,
                    vertex.width,
                    vertex.height / 2.0,
                    vertex.width / 2.0,
                    vertex.height,
                    vertex.height / 2.0
                ));
                value["anchors"] = json!([
                    {"x":vertex.width/2.0,"y":0,"handleIn":null,"handleOut":null},
                    {"x":vertex.width,"y":vertex.height/2.0,"handleIn":null,"handleOut":null},
                    {"x":vertex.width/2.0,"y":vertex.height,"handleIn":null,"handleOut":null},
                    {"x":0,"y":vertex.height/2.0,"handleIn":null,"handleOut":null}
                ]);
            }
        }
        shapes.push(node(value)?);
        nodes.push(text(
            &format!("diagram_label_{index}"),
            &vertex.label,
            vertex.x + 12.0,
            vertex.y + 8.0,
            (vertex.width - 24.0).max(1.0),
            (vertex.height - 16.0).max(1.0),
            &vertex.color,
            vertex.font_size,
        )?);
    }
    // Canonical children are front-to-back, not painter append order.
    // All labels sit above shapes; connector strokes stay behind shapes.
    nodes.extend(shapes);
    nodes.extend(connectors);
    // Source-local ids above are deliberately not document ids. InsertSubtree
    // remaps the entire tree through the editor's shared/collaboration allocator.
    let width = graph
        .vertices
        .iter()
        .map(|v| v.x + v.width)
        .fold(0.0, f64::max)
        + 48.0;
    let height = graph
        .vertices
        .iter()
        .map(|v| v.y + v.height)
        .fold(0.0, f64::max)
        + 48.0;
    let frame = node(json!({
        "type":"frame","id":"diagram_root","name":graph.name,
        "x":0,"y":0,"width":width,"height":height,"layout":"none",
        "clipContent":false,"children":nodes
    }))?;
    Ok(HtmlImportResult::new(vec![frame], Vec::new()))
}

#[allow(clippy::too_many_arguments)]
fn text(
    id: &str,
    label: &str,
    x: f64,
    y: f64,
    width: f64,
    height: f64,
    color: &str,
    size: f64,
) -> Result<PenNode, DiagramError> {
    node(json!({"type":"text","id":id,"name":label,"content":label,
        "x":x,"y":y,"width":width,"height":height,"fontSize":size,
        "textAlign":"center","textAlignVertical":"middle",
        "textGrowth":"fixed-width-height","fill":fill(color)}))
}

fn path(id: &str, name: &str, points: &[(f64, f64)], color: &str) -> Result<PenNode, DiagramError> {
    let x = points.iter().map(|p| p.0).fold(f64::INFINITY, f64::min);
    let y = points.iter().map(|p| p.1).fold(f64::INFINITY, f64::min);
    let width = points.iter().map(|p| p.0 - x).fold(0.0, f64::max).max(1.0);
    let height = points.iter().map(|p| p.1 - y).fold(0.0, f64::max).max(1.0);
    let anchors: Vec<_> = points
        .iter()
        .map(|p| {
            json!({
                "x":p.0-x,"y":p.1-y,"handleIn":null,"handleOut":null,"pointType":"corner"
            })
        })
        .collect();
    let d = points
        .iter()
        .enumerate()
        .map(|(i, p)| format!("{} {} {}", if i == 0 { "M" } else { "L" }, p.0 - x, p.1 - y))
        .collect::<Vec<_>>()
        .join(" ");
    node(json!({"type":"path","id":id,"name":name,"x":x,"y":y,
        "width":width,"height":height,"closed":false,"d":d,
        "anchors":anchors,"fill":[],"stroke":stroke(color)}))
}

fn center(v: &Vertex) -> (f64, f64) {
    (v.x + v.width / 2.0, v.y + v.height / 2.0)
}

fn dock(v: &Vertex, toward: (f64, f64)) -> (f64, f64) {
    let c = center(v);
    let (dx, dy) = (toward.0 - c.0, toward.1 - c.1);
    let (nx, ny) = (dx / (v.width / 2.0), dy / (v.height / 2.0));
    let divisor = match v.shape {
        Shape::Ellipse => (nx * nx + ny * ny).sqrt(),
        Shape::Diamond => nx.abs() + ny.abs(),
        _ => nx.abs().max(ny.abs()),
    };
    if divisor < 1e-9 {
        (c.0 + v.width / 2.0, c.1)
    } else {
        (c.0 + dx / divisor, c.1 + dy / divisor)
    }
}

fn route(source: &Vertex, target: &Vertex, edge: &Edge) -> Vec<(f64, f64)> {
    if source.id == target.id && edge.waypoints.is_empty() {
        return vec![
            (source.x + source.width, source.y + source.height / 2.0),
            (
                source.x + source.width + 32.0,
                source.y + source.height / 2.0,
            ),
            (source.x + source.width + 32.0, source.y - 24.0),
            (source.x + source.width / 2.0, source.y - 24.0),
            (source.x + source.width / 2.0, source.y),
        ];
    }
    if edge.orthogonal && edge.waypoints.is_empty() {
        let a = center(source);
        let b = center(target);
        let horizontal = (a.0 - b.0).abs() >= (a.1 - b.1).abs();
        let (start, end, first, second) = if horizontal {
            let start = dock(source, (b.0, a.1));
            let end = dock(target, (a.0, b.1));
            let x = (start.0 + end.0) / 2.0;
            (start, end, (x, start.1), (x, end.1))
        } else {
            let start = dock(source, (a.0, b.1));
            let end = dock(target, (b.0, a.1));
            let y = (start.1 + end.1) / 2.0;
            (start, end, (start.0, y), (end.0, y))
        };
        let mut points = vec![start, first, second, end];
        points.dedup();
        return points;
    }
    let first = edge.waypoints.first().copied().unwrap_or(center(target));
    let last = edge.waypoints.last().copied().unwrap_or(center(source));
    let start = dock(source, first);
    let end = dock(target, last);
    let mut points = vec![start];
    points.extend_from_slice(&edge.waypoints);
    points.push(end);
    points.dedup();
    if points.len() < 2 {
        points.push((end.0 + 1.0, end.1));
    }
    points
}

fn midpoint(points: &[(f64, f64)]) -> (f64, f64) {
    let length = |a: (f64, f64), b: (f64, f64)| (b.0 - a.0).hypot(b.1 - a.1);
    let total: f64 = points.windows(2).map(|p| length(p[0], p[1])).sum();
    let mut remaining = total / 2.0;
    for p in points.windows(2) {
        let distance = length(p[0], p[1]);
        if distance >= remaining && distance > 0.0 {
            let t = remaining / distance;
            return (
                p[0].0 + (p[1].0 - p[0].0) * t,
                p[0].1 + (p[1].1 - p[0].1) * t,
            );
        }
        remaining -= distance;
    }
    points[0]
}
