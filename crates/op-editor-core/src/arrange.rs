//! Tidy Up / Pack Horizontal / Pack Vertical — ported from open-pencil's
//! `packages/core/src/editor/alignment/tidy.ts` (Figma semantics).
//!
//! The position math is pure ([`tidy_positions`] / [`pack_positions`]);
//! [`EditorState::arrange_nodes`] resolves the targets, requires them to
//! be free-moving siblings (one shared parent, none flowed by auto
//! layout), and translates each subtree by its delta as one undo step.

use crate::geometry::{aggregate_bounds, DocRect};
use crate::node_id::NodeId;
use crate::state::EditorState;
use crate::walkers::{
    find_node, find_node_mut, find_parent_and_index, is_ancestor_in_set, is_flow_child_of_flex,
    translate_subtree,
};

/// Which arrangement [`EditorState::arrange_nodes`] applies.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ArrangeMode {
    /// Figma's Tidy Up: a single row / column is spaced evenly; a grid
    /// lines up its rows and columns and evens their spacing.
    Tidy,
    /// Edge to edge along x with no gap, in order of left edges.
    PackHorizontal,
    /// Edge to edge along y with no gap, in order of top edges.
    PackVertical,
}

impl ArrangeMode {
    pub fn parse(raw: &str) -> Option<Self> {
        match raw {
            "tidy" => Some(Self::Tidy),
            "pack_h" | "pack_horizontal" => Some(Self::PackHorizontal),
            "pack_v" | "pack_vertical" => Some(Self::PackVertical),
            _ => None,
        }
    }
}

/// A layer's box in its parent's coordinate space.
#[derive(Debug, Clone, PartialEq)]
pub struct PlacedBox {
    pub id: NodeId,
    pub rect: DocRect,
}

#[derive(Clone, Copy, PartialEq, Eq)]
enum Axis {
    Horizontal,
    Vertical,
}

/// A spread this small counts as already lined up.
const ALIGNED_SPREAD: f64 = 1.0;
/// Gaps that differ by no more than this count as already even.
const EVEN_GAPS: f64 = 2.0;

fn start_of(r: &DocRect, axis: Axis) -> f64 {
    match axis {
        Axis::Horizontal => r.x,
        Axis::Vertical => r.y,
    }
}

fn size_of(r: &DocRect, axis: Axis) -> f64 {
    match axis {
        Axis::Horizontal => r.w,
        Axis::Vertical => r.h,
    }
}

fn round_half_up(v: f64) -> f64 {
    (v + 0.5).floor()
}

/// Boxes grouped into bands along `axis` (columns for horizontal, rows
/// for vertical). A box joins a band when its middle lies in the band.
fn bands(boxes: &[PlacedBox], axis: Axis) -> Vec<Vec<usize>> {
    let middle = |i: usize| start_of(&boxes[i].rect, axis) + size_of(&boxes[i].rect, axis) / 2.0;
    let mut order: Vec<usize> = (0..boxes.len()).collect();
    order.sort_by(|a, b| middle(*a).total_cmp(&middle(*b)));
    let mut result: Vec<(Vec<usize>, f64, f64)> = Vec::new();
    for i in order {
        let m = middle(i);
        let min = start_of(&boxes[i].rect, axis);
        let max = min + size_of(&boxes[i].rect, axis);
        if let Some(band) = result.iter_mut().find(|b| m >= b.1 && m <= b.2) {
            band.0.push(i);
            band.1 = band.1.min(min);
            band.2 = band.2.max(max);
        } else {
            result.push((vec![i], min, max));
        }
    }
    result.into_iter().map(|b| b.0).collect()
}

/// Starts that space `sizes` evenly from the first, using the gap the
/// first and last leave (rounded to a whole pixel).
fn even_starts(starts: &[f64], sizes: &[f64]) -> Vec<f64> {
    let last_index = starts.len().saturating_sub(1);
    if last_index < 2 {
        return starts.to_vec();
    }
    let first = starts[0];
    let last = starts[last_index];
    let used: f64 = sizes[..last_index].iter().sum();
    let gap = round_half_up((last - first - used) / last_index as f64);
    let mut cursor = first;
    sizes
        .iter()
        .map(|size| {
            let placed = cursor;
            cursor += size + gap;
            placed
        })
        .collect()
}

fn gaps_even(starts: &[f64], sizes: &[f64]) -> bool {
    let gaps: Vec<f64> = (1..starts.len())
        .map(|i| starts[i] - starts[i - 1] - sizes[i - 1])
        .collect();
    if gaps.len() < 2 {
        return true;
    }
    let max = gaps.iter().cloned().fold(f64::MIN, f64::max);
    let min = gaps.iter().cloned().fold(f64::MAX, f64::min);
    max - min <= EVEN_GAPS
}

fn set_axis(placed: &mut [(f64, f64)], i: usize, axis: Axis, value: f64) {
    match axis {
        Axis::Horizontal => placed[i].0 = value,
        Axis::Vertical => placed[i].1 = value,
    }
}

fn spread_line(boxes: &[PlacedBox], axis: Axis, placed: &mut [(f64, f64)]) {
    let mut line: Vec<usize> = (0..boxes.len()).collect();
    line.sort_by(|a, b| {
        start_of(&boxes[*a].rect, axis).total_cmp(&start_of(&boxes[*b].rect, axis))
    });
    let starts: Vec<f64> = line
        .iter()
        .map(|&i| start_of(&boxes[i].rect, axis))
        .collect();
    let sizes: Vec<f64> = line
        .iter()
        .map(|&i| size_of(&boxes[i].rect, axis))
        .collect();
    let spaced = even_starts(&starts, &sizes);
    for (k, &i) in line.iter().enumerate() {
        set_axis(placed, i, axis, spaced[k]);
    }
}

fn align_bands(boxes: &[PlacedBox], groups: &[Vec<usize>], axis: Axis, placed: &mut [(f64, f64)]) {
    let midranges: Vec<Option<f64>> = groups
        .iter()
        .map(|g| {
            let values = g.iter().map(|&i| start_of(&boxes[i].rect, axis));
            let min = values.clone().fold(f64::MAX, f64::min);
            let max = values.fold(f64::MIN, f64::max);
            (max - min > ALIGNED_SPREAD).then(|| round_half_up((min + max) / 2.0))
        })
        .collect();
    let starts: Vec<f64> = groups
        .iter()
        .zip(&midranges)
        .map(|(g, m)| m.unwrap_or_else(|| start_of(&boxes[g[0]].rect, axis)))
        .collect();
    let sizes: Vec<f64> = groups
        .iter()
        .map(|g| {
            g.iter()
                .map(|&i| size_of(&boxes[i].rect, axis))
                .fold(0.0, f64::max)
        })
        .collect();
    let respaced = !gaps_even(&starts, &sizes);
    let targets = if respaced {
        even_starts(&starts, &sizes)
    } else {
        starts
    };
    for (gi, group) in groups.iter().enumerate() {
        // A band already lined up, with spacing already even, stays put.
        if midranges[gi].is_none() && !respaced {
            continue;
        }
        for &i in group {
            set_axis(placed, i, axis, targets[gi]);
        }
    }
}

/// Figma's Tidy Up target origin for every box, in input order.
pub fn tidy_positions(boxes: &[PlacedBox]) -> Vec<(f64, f64)> {
    let mut placed: Vec<(f64, f64)> = boxes.iter().map(|b| (b.rect.x, b.rect.y)).collect();
    if boxes.len() < 2 {
        return placed;
    }
    let rows = bands(boxes, Axis::Vertical);
    let columns = bands(boxes, Axis::Horizontal);
    if rows.len() == 1 {
        spread_line(boxes, Axis::Horizontal, &mut placed);
    } else if columns.len() == 1 {
        spread_line(boxes, Axis::Vertical, &mut placed);
    } else {
        align_bands(boxes, &columns, Axis::Horizontal, &mut placed);
        align_bands(boxes, &rows, Axis::Vertical, &mut placed);
    }
    placed
}

/// Figma's Pack target origin for every box, in input order: edge to
/// edge with no gap from the first box along the axis.
pub fn pack_positions(boxes: &[PlacedBox], horizontal: bool) -> Vec<(f64, f64)> {
    let axis = if horizontal {
        Axis::Horizontal
    } else {
        Axis::Vertical
    };
    let mut placed: Vec<(f64, f64)> = boxes.iter().map(|b| (b.rect.x, b.rect.y)).collect();
    let mut line: Vec<usize> = (0..boxes.len()).collect();
    line.sort_by(|a, b| {
        start_of(&boxes[*a].rect, axis).total_cmp(&start_of(&boxes[*b].rect, axis))
    });
    let mut cursor = line
        .first()
        .map_or(0.0, |&i| start_of(&boxes[i].rect, axis));
    for i in line {
        set_axis(&mut placed, i, axis, cursor);
        cursor += size_of(&boxes[i].rect, axis);
    }
    placed
}

impl EditorState {
    /// The boxes [`Self::arrange_nodes`] would move: explicit ids, or the
    /// selection when `ids` is empty. Requires 2+ editable, free-moving
    /// siblings under one parent; the error says which rule failed.
    pub fn arrange_targets(&self, ids: &[NodeId]) -> Result<Vec<PlacedBox>, String> {
        let children = self.active_children();
        let source: Vec<NodeId> = if ids.is_empty() {
            self.selection.set.to_vec()
        } else {
            ids.to_vec()
        };
        let mut parent: Option<Option<NodeId>> = None;
        let mut boxes = Vec::new();
        for id in &source {
            let Some(node) = find_node(children, id) else {
                return Err(format!("node {id} is not on the active page"));
            };
            if !self.is_editable(id) || is_ancestor_in_set(children, id, &source) {
                continue;
            }
            if is_flow_child_of_flex(children, id) {
                return Err(format!(
                    "node {id} is positioned by its auto-layout parent; change the parent's gap instead"
                ));
            }
            let p = find_parent_and_index(children, id).map(|(p, _)| p);
            match &parent {
                None => parent = Some(p.flatten()),
                Some(existing) if *existing != p.flatten() => {
                    return Err("nodes must share one parent".into());
                }
                Some(_) => {}
            }
            boxes.push(PlacedBox {
                id: id.clone(),
                rect: aggregate_bounds(node),
            });
        }
        if boxes.len() < 2 {
            return Err("arrange needs at least two editable sibling nodes".into());
        }
        Ok(boxes)
    }

    /// Apply Tidy Up / Pack to `ids` (or the selection when empty).
    /// Returns true when at least one node moved; one undo step.
    pub fn arrange_nodes(&mut self, ids: &[NodeId], mode: ArrangeMode) -> bool {
        let boxes = match self.arrange_targets(ids) {
            Ok(boxes) => boxes,
            Err(reason) => {
                self.ui.design_reject = Some(reason);
                return false;
            }
        };
        let targets = match mode {
            ArrangeMode::Tidy => tidy_positions(&boxes),
            ArrangeMode::PackHorizontal => pack_positions(&boxes, true),
            ArrangeMode::PackVertical => pack_positions(&boxes, false),
        };
        let deltas: Vec<(NodeId, f64, f64)> = boxes
            .iter()
            .zip(targets)
            .map(|(b, (x, y))| (b.id.clone(), x - b.rect.x, y - b.rect.y))
            .filter(|(_, dx, dy)| *dx != 0.0 || *dy != 0.0)
            .collect();
        if deltas.is_empty() {
            self.ui.design_reject = Some("nodes are already arranged".into());
            return false;
        }
        let pre = self.snapshot_for_history();
        let children = self.active_children_mut();
        for (id, dx, dy) in &deltas {
            if let Some(node) = find_node_mut(children, id) {
                translate_subtree(node, *dx, *dy);
            }
        }
        self.history_push_past(pre);
        true
    }
}

#[cfg(test)]
#[path = "arrange_tests.rs"]
mod tests;
