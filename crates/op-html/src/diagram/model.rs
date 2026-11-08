use super::error::{syntax, DiagramError};

#[derive(Clone, Copy, Debug, PartialEq)]
pub enum Shape {
    Rectangle,
    Rounded,
    Ellipse,
    Diamond,
}

#[derive(Clone, Debug)]
pub struct Vertex {
    pub id: String,
    pub label: String,
    pub shape: Shape,
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
    pub fill: String,
    pub stroke: String,
    pub color: String,
    pub font_size: f64,
    pub explicit: bool,
}

impl Vertex {
    pub fn new(id: String, label: String, shape: Shape, explicit: bool) -> Self {
        Self {
            id,
            label,
            shape,
            explicit,
            x: 0.0,
            y: 0.0,
            width: 160.0,
            height: 80.0,
            fill: "#f1f5f9".into(),
            stroke: "#334155".into(),
            color: "#0f172a".into(),
            font_size: 14.0,
        }
    }
}

pub struct Edge {
    pub source: String,
    pub target: String,
    pub label: String,
    pub arrow: bool,
    pub orthogonal: bool,
    pub stroke: String,
    pub waypoints: Vec<(f64, f64)>,
}

#[derive(Clone, Copy)]
pub enum Direction {
    Down,
    Up,
    Right,
    Left,
}

pub struct Graph {
    pub name: String,
    pub vertices: Vec<Vertex>,
    pub edges: Vec<Edge>,
    pub direction: Direction,
}

impl Graph {
    pub fn new(name: &str) -> Self {
        Self {
            name: name.into(),
            vertices: Vec::new(),
            edges: Vec::new(),
            direction: Direction::Down,
        }
    }

    pub fn vertex(&mut self, vertex: Vertex) -> Result<(), DiagramError> {
        if let Some(old) = self.vertices.iter_mut().find(|v| v.id == vertex.id) {
            if vertex.explicit {
                if old.explicit && (old.label != vertex.label || old.shape != vertex.shape) {
                    return Err(syntax(format!(
                        "conflicting vertex definition {:?}",
                        vertex.id
                    )));
                }
                *old = vertex;
            }
        } else {
            self.vertices.push(vertex);
        }
        self.check_limits()
    }

    pub fn check_limits(&self) -> Result<(), DiagramError> {
        if self.vertices.len() > 512 || self.edges.len() > 2048 {
            Err(DiagramError::LimitExceeded)
        } else {
            Ok(())
        }
    }

    pub fn validate(&self) -> Result<(), DiagramError> {
        self.check_limits()?;
        if self.vertices.is_empty() {
            return Err(DiagramError::Empty);
        }
        for edge in &self.edges {
            for id in [&edge.source, &edge.target] {
                if !self.vertices.iter().any(|v| &v.id == id) {
                    return Err(DiagramError::UnknownNode { id: id.clone() });
                }
            }
        }
        Ok(())
    }
}
