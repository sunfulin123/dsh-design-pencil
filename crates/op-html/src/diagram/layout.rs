use std::collections::VecDeque;

use super::model::{Direction, Graph};

/// Breadth-first layers break cycles at their first visited vertex; disconnected
/// components share layers and occupy distinct cross-axis slots.
pub(super) fn layout(graph: &mut Graph) {
    let count = graph.vertices.len();
    let mut adjacency = vec![Vec::new(); count];
    let mut incoming = vec![0; count];
    for edge in &graph.edges {
        let from = graph
            .vertices
            .iter()
            .position(|v| v.id == edge.source)
            .unwrap();
        let to = graph
            .vertices
            .iter()
            .position(|v| v.id == edge.target)
            .unwrap();
        adjacency[from].push(to);
        incoming[to] += 1;
    }
    let mut ranks = vec![None; count];
    let mut queue = VecDeque::new();
    for (index, degree) in incoming.iter().enumerate() {
        if *degree == 0 {
            ranks[index] = Some(0);
            queue.push_back(index);
        }
    }
    loop {
        while let Some(index) = queue.pop_front() {
            for &target in &adjacency[index] {
                if ranks[target].is_none() {
                    ranks[target] = Some(ranks[index].unwrap() + 1);
                    queue.push_back(target);
                }
            }
        }
        let Some(index) = ranks.iter().position(Option::is_none) else {
            break;
        };
        ranks[index] = Some(0);
        queue.push_back(index);
    }
    let max_rank = ranks.iter().flatten().copied().max().unwrap_or(0);
    let mut slots = vec![0; max_rank + 1];
    for (vertex, rank) in graph.vertices.iter_mut().zip(ranks) {
        let rank = rank.unwrap();
        let cross = slots[rank] as f64 * 220.0 + 24.0;
        slots[rank] += 1;
        let forward = rank as f64 * 240.0 + 24.0;
        let reverse = (max_rank - rank) as f64 * 240.0 + 24.0;
        (vertex.x, vertex.y) = match graph.direction {
            Direction::Down => (cross, forward),
            Direction::Up => (cross, reverse),
            Direction::Right => (forward, cross),
            Direction::Left => (reverse, cross),
        };
    }
}
