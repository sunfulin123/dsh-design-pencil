use super::error::{syntax, unsupported, DiagramError};
use super::model::{Direction, Edge, Graph, Shape, Vertex};

pub(super) fn parse(source: &str) -> Result<Graph, DiagramError> {
    let statements = statements(source)?;
    let mut iter = statements.into_iter();
    let header = iter.next().ok_or(DiagramError::Empty)?;
    let words: Vec<_> = header.split_whitespace().collect();
    if words.len() != 2 || !matches!(words[0], "flowchart" | "graph") {
        return Err(unsupported(
            "only flowchart/graph with TD, TB, BT, LR or RL direction",
        ));
    }
    let mut graph = Graph::new("Mermaid flowchart");
    graph.direction = match words[1] {
        "TD" | "TB" => Direction::Down,
        "BT" => Direction::Up,
        "LR" => Direction::Right,
        "RL" => Direction::Left,
        value => return Err(unsupported(format!("direction {value:?}"))),
    };
    for statement in iter {
        let mut rest = statement.as_str();
        let mut from = node(&mut rest, &mut graph)?;
        while !rest.trim().is_empty() {
            rest = rest.trim_start();
            let arrow = if let Some(tail) = rest.strip_prefix("-->") {
                rest = tail;
                true
            } else if let Some(tail) = rest.strip_prefix("---") {
                rest = tail;
                false
            } else {
                return Err(unsupported(rest));
            };
            rest = rest.trim_start();
            let label = if let Some(tail) = rest.strip_prefix('|') {
                let end = tail
                    .find('|')
                    .ok_or_else(|| syntax("unclosed edge label"))?;
                rest = &tail[end + 1..];
                plain_label(&tail[..end])?
            } else {
                String::new()
            };
            let to = node(&mut rest, &mut graph)?;
            graph.edges.push(Edge {
                source: from,
                target: to.clone(),
                label,
                arrow,
                orthogonal: false,
                stroke: "#334155".into(),
                waypoints: Vec::new(),
            });
            graph.check_limits()?;
            from = to;
        }
    }
    graph.validate()?;
    Ok(graph)
}

fn statements(source: &str) -> Result<Vec<String>, DiagramError> {
    let mut out = Vec::new();
    let mut current = String::new();
    let mut stack = Vec::new();
    let mut quoted = false;
    let mut edge_label = false;
    for line in source.lines() {
        for (offset, c) in line.char_indices() {
            if !quoted && stack.is_empty() && !edge_label && line[offset..].starts_with("%%") {
                break;
            }
            if c == '"' {
                quoted = !quoted;
            }
            if !quoted {
                match c {
                    '|' if stack.is_empty() => edge_label = !edge_label,
                    '[' | '(' | '{' => stack.push(c),
                    ']' | ')' | '}' => {
                        let expected = match c {
                            ']' => '[',
                            ')' => '(',
                            _ => '{',
                        };
                        if stack.pop() != Some(expected) {
                            return Err(syntax("unbalanced shape delimiters"));
                        }
                    }
                    ';' if stack.is_empty() && !edge_label => {
                        if !current.trim().is_empty() {
                            out.push(current.trim().into());
                        }
                        current.clear();
                        continue;
                    }
                    _ => {}
                }
            }
            current.push(c);
        }
        if stack.is_empty() && !quoted && !edge_label {
            if !current.trim().is_empty() {
                out.push(current.trim().into());
            }
            current.clear();
        } else {
            current.push('\n');
        }
    }
    if !stack.is_empty() || quoted || edge_label {
        return Err(syntax("unclosed shape or quoted label"));
    }
    Ok(out)
}

fn node(rest: &mut &str, graph: &mut Graph) -> Result<String, DiagramError> {
    *rest = rest.trim_start();
    let length = rest
        .bytes()
        .take_while(|c| c.is_ascii_alphanumeric() || *c == b'_')
        .count();
    if length == 0 {
        return Err(unsupported(*rest));
    }
    let id = rest[..length].to_string();
    *rest = &rest[length..];
    if matches!(
        id.as_str(),
        "subgraph" | "end" | "style" | "classDef" | "class" | "click" | "direction" | "linkStyle"
    ) {
        return Err(unsupported(id));
    }
    let forms = [
        ("([", "])", Shape::Rounded),
        ("((", "))", Shape::Ellipse),
        ("[", "]", Shape::Rectangle),
        ("(", ")", Shape::Rounded),
        ("{", "}", Shape::Diamond),
    ];
    let mut label = id.clone();
    let mut shape = Shape::Rectangle;
    let mut explicit = false;
    for (open, close, kind) in forms {
        if let Some(tail) = rest.strip_prefix(open) {
            let mut quoted = false;
            let end = tail
                .char_indices()
                .find_map(|(i, c)| {
                    if c == '"' {
                        quoted = !quoted;
                    }
                    (!quoted && tail[i..].starts_with(close)).then_some(i)
                })
                .ok_or_else(|| syntax("unclosed shape"))?;
            label = plain_label(&tail[..end])?;
            shape = kind;
            explicit = true;
            *rest = &tail[end + close.len()..];
            break;
        }
    }
    graph.vertex(Vertex::new(id.clone(), label, shape, explicit))?;
    Ok(id)
}

fn plain_label(raw: &str) -> Result<String, DiagramError> {
    let raw = raw.trim();
    let raw = raw
        .strip_prefix('"')
        .and_then(|s| s.strip_suffix('"'))
        .unwrap_or(raw);
    if raw.contains(['<', '>', '\\']) {
        return Err(unsupported("HTML or escaped labels"));
    }
    Ok(raw.to_string())
}
