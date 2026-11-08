use std::collections::BTreeMap;

use roxmltree::Node;

use super::drawio_decode::{self, MAX_DRAWIO_SOURCE_BYTES};
use super::error::{syntax, unsupported, DiagramError};
use super::model::{Edge, Graph, Shape, Vertex};

pub(super) fn parse(source: &str) -> Result<Graph, DiagramError> {
    if source.len() > MAX_DRAWIO_SOURCE_BYTES {
        return Err(drawio_decode::byte_limit(
            "XML source",
            MAX_DRAWIO_SOURCE_BYTES,
        ));
    }
    let document = roxmltree::Document::parse(source).map_err(|e| syntax(e.to_string()))?;
    let root = document.root_element();
    if root.has_tag_name("mxGraphModel") {
        return parse_model(root, None);
    }
    if !root.has_tag_name("mxfile") {
        return Err(unsupported("expected mxfile or mxGraphModel XML"));
    }
    let children: Vec<_> = root.children().filter(Node::is_element).collect();
    if children.len() != 1 {
        return Err(unsupported(
            "multiple or ambiguous draw.io diagrams; provide exactly one diagram",
        ));
    }
    let diagram = children[0];
    if diagram.has_tag_name("mxGraphModel") {
        return parse_model(diagram, None);
    }
    if !diagram.has_tag_name("diagram") {
        return Err(unsupported("expected one diagram inside mxfile"));
    }
    let elements: Vec<_> = diagram.children().filter(Node::is_element).collect();
    let name = diagram.attribute("name");
    let payload: String = diagram
        .children()
        .filter(Node::is_text)
        .filter_map(|n| n.text())
        .collect();
    if !elements.is_empty() {
        if elements.len() != 1
            || !elements[0].has_tag_name("mxGraphModel")
            || !payload.trim().is_empty()
        {
            return Err(unsupported("multiple or ambiguous diagram contents"));
        }
        return parse_model(elements[0], name);
    }
    let decoded = drawio_decode::decode(&payload)?;
    let decoded = roxmltree::Document::parse(&decoded).map_err(|e| syntax(e.to_string()))?;
    if !decoded.root_element().has_tag_name("mxGraphModel") {
        return Err(unsupported(
            "compressed diagram must decode to one mxGraphModel",
        ));
    }
    parse_model(decoded.root_element(), name)
}

fn parse_model(model: Node<'_, '_>, name: Option<&str>) -> Result<Graph, DiagramError> {
    if model
        .descendants()
        .filter(|n| n.has_tag_name("mxGraphModel"))
        .count()
        != 1
    {
        return Err(unsupported("multiple or ambiguous mxGraphModel elements"));
    }
    let root = model
        .children()
        .find(|n| n.has_tag_name("root"))
        .ok_or_else(|| syntax("missing mxGraphModel/root"))?;
    let mut graph = Graph::new(name.unwrap_or("draw.io diagram"));
    let mut layers = Vec::new();
    let mut ids = std::collections::BTreeSet::new();
    for cell in root.children().filter(Node::is_element) {
        if !cell.has_tag_name("mxCell") {
            return Err(unsupported(cell.tag_name().name()));
        }
        let id = cell
            .attribute("id")
            .ok_or_else(|| syntax("mxCell missing id"))?;
        if !ids.insert(id) {
            return Err(syntax(format!("duplicate cell {id:?}")));
        }
        if cell.attribute("vertex") != Some("1") && cell.attribute("edge") != Some("1") {
            if cell.attribute("value").is_some() || cell.attribute("style").is_some() {
                return Err(unsupported("named/styled draw.io layers"));
            }
            layers.push(id);
        }
    }
    for cell in root.children().filter(Node::is_element) {
        let id = cell.attribute("id").unwrap();
        let vertex = cell.attribute("vertex") == Some("1");
        let edge = cell.attribute("edge") == Some("1");
        if !vertex && !edge {
            continue;
        }
        if vertex && edge {
            return Err(syntax("cell cannot be both vertex and edge"));
        }
        if cell.attribute("visible") == Some("0") || cell.attribute("collapsed") == Some("1") {
            return Err(unsupported("hidden or collapsed cells"));
        }
        if cell
            .attribute("parent")
            .is_some_and(|p| !layers.contains(&p))
        {
            return Err(unsupported(
                "nested groups, vertex parents or edge label cells",
            ));
        }
        let style = style(cell.attribute("style").unwrap_or(""))?;
        let label = cell.attribute("value").unwrap_or("").to_string();
        if label.contains(['<', '>']) {
            return Err(unsupported("HTML draw.io labels"));
        }
        let geometries: Vec<_> = cell.children().filter(Node::is_element).collect();
        if geometries.len() > 1 || geometries.iter().any(|n| !n.has_tag_name("mxGeometry")) {
            return Err(unsupported(
                "multiple geometry elements or custom cell children",
            ));
        }
        let geometry = geometries.first().copied();
        if vertex {
            let geometry =
                geometry.ok_or_else(|| syntax(format!("vertex {id:?} missing geometry")))?;
            if geometry.attribute("relative") == Some("1") {
                return Err(unsupported("relative vertex geometry"));
            }
            if geometry.children().any(|n| n.is_element()) {
                return Err(unsupported("vertex geometry offsets or alternate bounds"));
            }
            let shape = match style
                .get("shape")
                .map(String::as_str)
                .unwrap_or("rectangle")
            {
                "rectangle" if style.get("rounded").map(String::as_str) == Some("1") => {
                    Shape::Rounded
                }
                "rectangle" => Shape::Rectangle,
                "ellipse" => Shape::Ellipse,
                "rhombus" => Shape::Diamond,
                value => return Err(unsupported(format!("draw.io shape {value:?}"))),
            };
            let mut v = Vertex::new(id.into(), label, shape, true);
            v.x = number(geometry, "x", Some(0.0))?;
            v.y = number(geometry, "y", Some(0.0))?;
            v.width = number(geometry, "width", None)?;
            v.height = number(geometry, "height", None)?;
            if v.width <= 0.0 || v.height <= 0.0 {
                return Err(syntax("vertex dimensions must be positive"));
            }
            for (field, key) in [
                (&mut v.fill, "fillColor"),
                (&mut v.stroke, "strokeColor"),
                (&mut v.color, "fontColor"),
            ] {
                if let Some(color) = style.get(key) {
                    *field = color.clone();
                }
            }
            if let Some(size) = style.get("fontSize") {
                v.font_size = size
                    .parse::<f64>()
                    .ok()
                    .filter(|v| v.is_finite() && *v > 0.0 && *v <= 1000.0)
                    .ok_or_else(|| syntax("invalid fontSize"))?;
            }
            graph.vertex(v)?;
        } else {
            let source = cell
                .attribute("source")
                .ok_or_else(|| unsupported("unbound edge source"))?;
            let target = cell
                .attribute("target")
                .ok_or_else(|| unsupported("unbound edge target"))?;
            let mut waypoints = Vec::new();
            if let Some(geometry) = geometry {
                for key in ["x", "y", "width", "height"] {
                    if geometry.attribute(key).is_some() && number(geometry, key, None)? != 0.0 {
                        return Err(unsupported("edge label position or size geometry"));
                    }
                }
                for child in geometry.children().filter(Node::is_element) {
                    if child.has_tag_name("Array") && child.attribute("as") == Some("points") {
                        for point in child.children().filter(Node::is_element) {
                            if !point.has_tag_name("mxPoint") {
                                return Err(unsupported("non-point edge waypoint"));
                            }
                            waypoints.push((number(point, "x", None)?, number(point, "y", None)?));
                        }
                    } else {
                        return Err(unsupported(
                            "edge label offset or unbound terminal geometry",
                        ));
                    }
                }
            }
            if waypoints.len() > 2048 {
                return Err(DiagramError::LimitExceeded);
            }
            graph.edges.push(Edge {
                source: source.into(),
                target: target.into(),
                label,
                arrow: style.get("endArrow").map(String::as_str) != Some("none"),
                orthogonal: style.get("edgeStyle").map(String::as_str)
                    == Some("orthogonalEdgeStyle"),
                stroke: style
                    .get("strokeColor")
                    .cloned()
                    .unwrap_or_else(|| "#334155".into()),
                waypoints,
            });
            graph.check_limits()?;
        }
    }
    graph.validate()?;
    Ok(graph)
}

fn number(node: Node<'_, '_>, key: &str, default: Option<f64>) -> Result<f64, DiagramError> {
    match node.attribute(key) {
        Some(raw) => raw
            .parse::<f64>()
            .ok()
            .filter(|v| v.is_finite() && v.abs() <= 1_000_000.0)
            .ok_or_else(|| syntax(format!("invalid geometry {key}={raw:?}"))),
        None => default.ok_or_else(|| syntax(format!("missing geometry {key}"))),
    }
}

fn style(raw: &str) -> Result<BTreeMap<String, String>, DiagramError> {
    let mut values = BTreeMap::new();
    for entry in raw.split(';').filter(|s| !s.is_empty()) {
        let (key, value) = if let Some(pair) = entry.split_once('=') {
            pair
        } else if matches!(entry, "ellipse" | "rhombus" | "rectangle") {
            ("shape", entry)
        } else {
            return Err(unsupported(format!("draw.io style {entry:?}")));
        };
        let supported = match key {
            "shape" => matches!(value, "rectangle" | "ellipse" | "rhombus"),
            "rounded" | "html" => matches!(value, "0" | "1"),
            "whiteSpace" => value == "wrap",
            "endArrow" => matches!(value, "none" | "open"),
            "startArrow" => value == "none",
            "fillColor" | "strokeColor" | "fontColor" => {
                value == "none"
                    || op_util::hex_color::parse_hex_rgba8(
                        value,
                        op_util::hex_color::HexOptions::LENIENT,
                    )
                    .is_some()
            }
            "fontSize" => true,
            "edgeStyle" => matches!(value, "none" | "orthogonalEdgeStyle"),
            "orthogonalLoop" => value == "1",
            "jettySize" => value == "auto",
            "strokeWidth" => value == "2",
            "align" => value == "center",
            "verticalAlign" => value == "middle",
            _ => false,
        };
        if !supported {
            return Err(unsupported(format!("draw.io style {key}={value}")));
        }
        values.insert(key.to_string(), value.to_string());
    }
    Ok(values)
}
