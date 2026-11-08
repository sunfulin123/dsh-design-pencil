//! Affine geometry for REST nodes.
//!
//! The REST API returns `relativeTransform` (parent-relative 2×3 matrix),
//! `size` (pre-transform width/height) and `absoluteBoundingBox` (the
//! axis-aligned box of the transformed node in page space). The linear part
//! is composed from `relativeTransform`; the translation is then solved so
//! the transformed box lands exactly on `absoluteBoundingBox`. That keeps
//! positions exact even where Figma's group-relative conventions differ from
//! the binary format, and is what the kiwi `transform` is rebuilt from.

use crate::kiwi::FigValue;
use serde_json::Value;

/// `x' = m00·x + m01·y + m02`, `y' = m10·x + m11·y + m12`.
#[derive(Debug, Clone, Copy, PartialEq)]
pub(crate) struct Affine {
    pub m00: f64,
    pub m01: f64,
    pub m02: f64,
    pub m10: f64,
    pub m11: f64,
    pub m12: f64,
}

impl Affine {
    pub const IDENTITY: Affine = Affine {
        m00: 1.0,
        m01: 0.0,
        m02: 0.0,
        m10: 0.0,
        m11: 1.0,
        m12: 0.0,
    };

    /// Parse a REST `[[m00, m01, m02], [m10, m11, m12]]` matrix.
    pub fn from_rest(value: Option<&Value>) -> Option<Affine> {
        let rows = value?.as_array()?;
        let row = |i: usize| -> Option<[f64; 3]> {
            let r = rows.get(i)?.as_array()?;
            let n = |j: usize| r.get(j).and_then(Value::as_f64).filter(|v| v.is_finite());
            Some([n(0)?, n(1)?, n(2)?])
        };
        let (r0, r1) = (row(0)?, row(1)?);
        Some(Affine {
            m00: r0[0],
            m01: r0[1],
            m02: r0[2],
            m10: r1[0],
            m11: r1[1],
            m12: r1[2],
        })
    }

    pub fn linear(self) -> Affine {
        Affine {
            m02: 0.0,
            m12: 0.0,
            ..self
        }
    }

    /// `self ∘ other` — apply `other` first.
    pub fn then_after(self, other: Affine) -> Affine {
        Affine {
            m00: self.m00 * other.m00 + self.m01 * other.m10,
            m01: self.m00 * other.m01 + self.m01 * other.m11,
            m02: self.m00 * other.m02 + self.m01 * other.m12 + self.m02,
            m10: self.m10 * other.m00 + self.m11 * other.m10,
            m11: self.m10 * other.m01 + self.m11 * other.m11,
            m12: self.m10 * other.m02 + self.m11 * other.m12 + self.m12,
        }
    }

    pub fn inverse(self) -> Option<Affine> {
        let det = self.m00 * self.m11 - self.m01 * self.m10;
        if det.abs() < 1e-12 || !det.is_finite() {
            return None;
        }
        let inv = 1.0 / det;
        let m00 = self.m11 * inv;
        let m01 = -self.m01 * inv;
        let m10 = -self.m10 * inv;
        let m11 = self.m00 * inv;
        Some(Affine {
            m00,
            m01,
            m02: -(m00 * self.m02 + m01 * self.m12),
            m10,
            m11,
            m12: -(m10 * self.m02 + m11 * self.m12),
        })
    }

    pub fn apply(self, x: f64, y: f64) -> (f64, f64) {
        (
            self.m00 * x + self.m01 * y + self.m02,
            self.m10 * x + self.m11 * y + self.m12,
        )
    }

    /// Top-left of the axis-aligned box of the `w × h` rect under `self`.
    pub fn aabb_min(self, w: f64, h: f64) -> (f64, f64) {
        [(0.0, 0.0), (w, 0.0), (0.0, h), (w, h)]
            .into_iter()
            .map(|(x, y)| self.apply(x, y))
            .fold((f64::INFINITY, f64::INFINITY), |(mx, my), (x, y)| {
                (mx.min(x), my.min(y))
            })
    }

    /// Kiwi `{ m00 … m12 }` object.
    pub fn to_fig(self) -> FigValue {
        FigValue::Object(
            [
                ("m00", self.m00),
                ("m01", self.m01),
                ("m02", self.m02),
                ("m10", self.m10),
                ("m11", self.m11),
                ("m12", self.m12),
            ]
            .into_iter()
            .map(|(k, v)| (k.into(), FigValue::Float(v as f32)))
            .collect(),
        )
    }
}

/// `{x, y, width, height}` from a REST bounding box.
#[derive(Debug, Clone, Copy, PartialEq)]
pub(crate) struct Bounds {
    pub x: f64,
    pub y: f64,
    pub w: f64,
    pub h: f64,
}

impl Bounds {
    pub fn from_rest(value: Option<&Value>) -> Option<Bounds> {
        let v = value?;
        let n = |k: &str| v.get(k).and_then(Value::as_f64).filter(|n| n.is_finite());
        Some(Bounds {
            x: n("x")?,
            y: n("y")?,
            w: n("width").unwrap_or(0.0).max(0.0),
            h: n("height").unwrap_or(0.0).max(0.0),
        })
    }

    pub fn union(self, other: Bounds) -> Bounds {
        let x = self.x.min(other.x);
        let y = self.y.min(other.y);
        Bounds {
            x,
            y,
            w: (self.x + self.w).max(other.x + other.w) - x,
            h: (self.y + self.h).max(other.y + other.h) - y,
        }
    }
}

/// Pre-transform size: REST `size`, else the bounding box.
pub(crate) fn node_size(node: &Value, abs: Option<Bounds>) -> (f64, f64) {
    let size = node.get("size");
    let n = |k: &str| {
        size.and_then(|s| s.get(k))
            .and_then(Value::as_f64)
            .filter(|v| v.is_finite() && *v >= 0.0)
    };
    match (n("x"), n("y")) {
        (Some(w), Some(h)) => (w, h),
        _ => abs.map(|b| (b.w, b.h)).unwrap_or((0.0, 0.0)),
    }
}

/// Absolute (page-space, already shifted) transform of a node.
///
/// `base_linear` is the linear part of the space `relativeTransform` is
/// expressed in; `parent_abs` is the fallback when the node has no
/// bounding box (hidden or degenerate nodes).
pub(crate) fn absolute_transform(
    node: &Value,
    base_linear: Affine,
    parent_abs: Affine,
    shift: (f64, f64),
) -> Affine {
    let rel = Affine::from_rest(node.get("relativeTransform"));
    let abs_box = Bounds::from_rest(node.get("absoluteBoundingBox"));
    let linear = base_linear.then_after(rel.unwrap_or(Affine::IDENTITY).linear());
    let (w, h) = node_size(node, abs_box);
    match abs_box {
        Some(b) => {
            let (min_x, min_y) = linear.aabb_min(w, h);
            Affine {
                m02: b.x - shift.0 - min_x,
                m12: b.y - shift.1 - min_y,
                ..linear
            }
        }
        None => parent_abs.then_after(rel.unwrap_or(Affine::IDENTITY)),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn inverse_round_trips() {
        let m = Affine {
            m00: 0.0,
            m01: -2.0,
            m02: 5.0,
            m10: 1.0,
            m11: 0.0,
            m12: -3.0,
        };
        let id = m.then_after(m.inverse().unwrap());
        for (a, b) in [
            (id.m00, 1.0),
            (id.m01, 0.0),
            (id.m02, 0.0),
            (id.m10, 0.0),
            (id.m11, 1.0),
            (id.m12, 0.0),
        ] {
            assert!((a - b).abs() < 1e-12);
        }
    }

    #[test]
    fn rotated_node_translation_matches_its_bounding_box() {
        // 100×20 rotated 90° clockwise: AABB is 20×100.
        let node = json!({
            "relativeTransform": [[0.0, -1.0, 999.0], [1.0, 0.0, 999.0]],
            "size": {"x": 100.0, "y": 20.0},
            "absoluteBoundingBox": {"x": 500.0, "y": 300.0, "width": 20.0, "height": 100.0},
        });
        let abs = absolute_transform(&node, Affine::IDENTITY, Affine::IDENTITY, (400.0, 200.0));
        assert_eq!(abs.aabb_min(100.0, 20.0), (100.0, 100.0));
        assert_eq!((abs.m00, abs.m01, abs.m10, abs.m11), (0.0, -1.0, 1.0, 0.0));
    }

    #[test]
    fn flipped_node_keeps_negative_determinant() {
        let node = json!({
            "relativeTransform": [[-1.0, 0.0, 40.0], [0.0, 1.0, 0.0]],
            "size": {"x": 40.0, "y": 10.0},
            "absoluteBoundingBox": {"x": 0.0, "y": 0.0, "width": 40.0, "height": 10.0},
        });
        let abs = absolute_transform(&node, Affine::IDENTITY, Affine::IDENTITY, (0.0, 0.0));
        assert_eq!((abs.m00, abs.m02), (-1.0, 40.0));
    }
}
