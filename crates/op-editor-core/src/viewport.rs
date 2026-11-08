//! Infinite-canvas pan + zoom state.
//!
//! Ported from `openpencil-shell-core::document::Viewport`. Pan is in
//! canvas-local px; zoom is a multiplier. `Point2D` is the crate's
//! `glam::Vec2` alias (the same one `render_backend.rs` uses), so the
//! coordinate math stays consistent across the editor-core layer.

use crate::render_backend::{Point2D, Rect};

/// Pan + zoom state. Pan = canvas-local px; zoom = multiplier.
#[derive(Debug, Clone, Copy, PartialEq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Viewport {
    pub pan_x: f32,
    pub pan_y: f32,
    pub zoom: f32,
}

impl Viewport {
    /// Identity viewport — origin pan, 100% zoom.
    pub const IDENTITY: Viewport = Viewport {
        pan_x: 0.0,
        pan_y: 0.0,
        zoom: 1.0,
    };
    pub const MIN_ZOOM: f32 = 0.1;
    pub const MAX_ZOOM: f32 = 8.0;

    /// Validate saved view hints before they reach renderer coordinate math.
    pub fn validated(self) -> Option<Self> {
        (self.pan_x.is_finite()
            && self.pan_y.is_finite()
            && self.zoom.is_finite()
            && self.zoom > 0.0)
            .then(|| Self {
                zoom: self.zoom.clamp(Self::MIN_ZOOM, Self::MAX_ZOOM),
                ..self
            })
    }

    /// Read optional editor metadata without allocating a JSON subtree.
    /// Invalid hints are ignored, not errors that prevent opening a document.
    pub fn deserialize_optional<'de, D: serde::Deserializer<'de>>(
        deserializer: D,
    ) -> Result<Option<Self>, D::Error> {
        use serde::de::{IgnoredAny, MapAccess, SeqAccess, Visitor};

        struct Number(Option<f32>);
        impl<'de> serde::Deserialize<'de> for Number {
            fn deserialize<D: serde::Deserializer<'de>>(d: D) -> Result<Self, D::Error> {
                d.deserialize_any(NumberVisitor)
            }
        }
        struct NumberVisitor;
        impl<'de> Visitor<'de> for NumberVisitor {
            type Value = Number;
            fn expecting(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
                f.write_str("a finite coordinate")
            }
            fn visit_f64<E: serde::de::Error>(self, n: f64) -> Result<Number, E> {
                Ok(Number(Some(n as f32)))
            }
            fn visit_i64<E: serde::de::Error>(self, n: i64) -> Result<Number, E> {
                self.visit_f64(n as f64)
            }
            fn visit_u64<E: serde::de::Error>(self, n: u64) -> Result<Number, E> {
                self.visit_f64(n as f64)
            }
            fn visit_bool<E: serde::de::Error>(self, _: bool) -> Result<Number, E> {
                Ok(Number(None))
            }
            fn visit_str<E: serde::de::Error>(self, _: &str) -> Result<Number, E> {
                Ok(Number(None))
            }
            fn visit_unit<E: serde::de::Error>(self) -> Result<Number, E> {
                Ok(Number(None))
            }
            fn visit_seq<A: SeqAccess<'de>>(self, mut a: A) -> Result<Number, A::Error> {
                while a.next_element::<IgnoredAny>()?.is_some() {}
                Ok(Number(None))
            }
            fn visit_map<A: MapAccess<'de>>(self, mut a: A) -> Result<Number, A::Error> {
                while a.next_entry::<IgnoredAny, IgnoredAny>()?.is_some() {}
                Ok(Number(None))
            }
        }

        #[derive(serde::Deserialize)]
        #[serde(field_identifier)]
        enum Field {
            #[serde(rename = "panX", alias = "pan_x")]
            PanX,
            #[serde(rename = "panY", alias = "pan_y")]
            PanY,
            #[serde(rename = "zoom")]
            Zoom,
            #[serde(other)]
            Other,
        }
        struct ViewVisitor;
        impl<'de> Visitor<'de> for ViewVisitor {
            type Value = Option<Viewport>;
            fn expecting(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
                f.write_str("an optional saved viewport")
            }
            fn visit_map<A: MapAccess<'de>>(self, mut a: A) -> Result<Self::Value, A::Error> {
                let (mut pan_x, mut pan_y, mut zoom) = (None, None, None);
                while let Some(field) = a.next_key::<Field>()? {
                    match field {
                        Field::PanX => pan_x = a.next_value::<Number>()?.0,
                        Field::PanY => pan_y = a.next_value::<Number>()?.0,
                        Field::Zoom => zoom = a.next_value::<Number>()?.0,
                        Field::Other => {
                            a.next_value::<IgnoredAny>()?;
                        }
                    }
                }
                Ok(pan_x
                    .zip(pan_y)
                    .zip(zoom)
                    .and_then(|((pan_x, pan_y), zoom)| Viewport { pan_x, pan_y, zoom }.validated()))
            }
            fn visit_seq<A: SeqAccess<'de>>(self, mut a: A) -> Result<Self::Value, A::Error> {
                while a.next_element::<IgnoredAny>()?.is_some() {}
                Ok(None)
            }
            fn visit_unit<E: serde::de::Error>(self) -> Result<Self::Value, E> {
                Ok(None)
            }
            fn visit_bool<E: serde::de::Error>(self, _: bool) -> Result<Self::Value, E> {
                Ok(None)
            }
            fn visit_str<E: serde::de::Error>(self, _: &str) -> Result<Self::Value, E> {
                Ok(None)
            }
            fn visit_f64<E: serde::de::Error>(self, _: f64) -> Result<Self::Value, E> {
                Ok(None)
            }
            fn visit_i64<E: serde::de::Error>(self, _: i64) -> Result<Self::Value, E> {
                Ok(None)
            }
            fn visit_u64<E: serde::de::Error>(self, _: u64) -> Result<Self::Value, E> {
                Ok(None)
            }
        }
        deserializer.deserialize_any(ViewVisitor)
    }

    /// Wheel zoom anchored at `cursor` (canvas-local).
    pub fn zoom_at(&mut self, cursor: Point2D, delta: f32) {
        let prev_zoom = self.zoom;
        let factor = (delta * 0.0015).exp();
        let new_zoom = (prev_zoom * factor).clamp(Self::MIN_ZOOM, Self::MAX_ZOOM);
        // Recover the document-space point at cursor BEFORE zoom, then
        // re-anchor pan so it stays at cursor AFTER zoom.
        let doc_x = (cursor.x - self.pan_x) / prev_zoom;
        let doc_y = (cursor.y - self.pan_y) / prev_zoom;
        self.zoom = new_zoom;
        self.pan_x = cursor.x - doc_x * new_zoom;
        self.pan_y = cursor.y - doc_y * new_zoom;
    }

    /// Fit `content` (document-space AABB) centred within a
    /// `canvas_w` × `canvas_h` viewport, leaving `padding` px on each
    /// side. Zoom is clamped to `[MIN_ZOOM, MAX_ZOOM]`; pan re-anchors
    /// the content centre to the canvas centre. No-op for an empty
    /// content rect or a degenerate canvas.
    pub fn fit_to(&mut self, content: Rect, canvas_w: f32, canvas_h: f32, padding: f32) {
        self.fit_to_with_max_zoom(content, canvas_w, canvas_h, padding, Self::MAX_ZOOM);
    }

    pub fn fit_to_with_max_zoom(
        &mut self,
        content: Rect,
        canvas_w: f32,
        canvas_h: f32,
        padding: f32,
        max_zoom: f32,
    ) {
        if content.size.x <= 0.0 || content.size.y <= 0.0 || canvas_w <= 0.0 || canvas_h <= 0.0 {
            return;
        }
        let avail_w = (canvas_w - 2.0 * padding).max(1.0);
        let avail_h = (canvas_h - 2.0 * padding).max(1.0);
        let zoom = (avail_w / content.size.x)
            .min(avail_h / content.size.y)
            .clamp(
                Self::MIN_ZOOM,
                max_zoom.clamp(Self::MIN_ZOOM, Self::MAX_ZOOM),
            );
        let cc_x = content.origin.x + content.size.x / 2.0;
        let cc_y = content.origin.y + content.size.y / 2.0;
        self.zoom = zoom;
        self.pan_x = canvas_w / 2.0 - cc_x * zoom;
        self.pan_y = canvas_h / 2.0 - cc_y * zoom;
    }

    /// Translate the pan origin by `(dx, dy)` canvas-local px.
    pub fn pan(&mut self, dx: f32, dy: f32) {
        self.pan_x += dx;
        self.pan_y += dy;
    }

    /// Canvas-local → document space.
    pub fn to_document(&self, p: Point2D) -> Point2D {
        Point2D::new(
            (p.x - self.pan_x) / self.zoom,
            (p.y - self.pan_y) / self.zoom,
        )
    }
}

impl Default for Viewport {
    fn default() -> Self {
        Self::IDENTITY
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn identity_is_default() {
        assert_eq!(Viewport::default(), Viewport::IDENTITY);
    }

    #[test]
    fn pan_accumulates() {
        let mut v = Viewport::IDENTITY;
        v.pan(10.0, -5.0);
        v.pan(2.0, 3.0);
        assert_eq!(v.pan_x, 12.0);
        assert_eq!(v.pan_y, -2.0);
    }

    #[test]
    fn fit_to_centers_and_scales_content() {
        // 100×50 content at (200,300); 400×400 canvas, 20 px padding.
        // avail = 360×360 → zoom = min(3.6, 7.2) = 3.6. Content centre
        // (250,325) re-anchors to the canvas centre (200,200).
        let mut v = Viewport::IDENTITY;
        let content = Rect {
            origin: Point2D::new(200.0, 300.0),
            size: Point2D::new(100.0, 50.0),
        };
        v.fit_to(content, 400.0, 400.0, 20.0);
        assert!((v.zoom - 3.6).abs() < 1e-3, "zoom {}", v.zoom);
        assert!((v.pan_x + 700.0).abs() < 1e-2, "pan_x {}", v.pan_x);
        assert!((v.pan_y + 970.0).abs() < 1e-2, "pan_y {}", v.pan_y);
        // The content centre maps onto the canvas centre.
        assert!((v.pan_x + 250.0 * v.zoom - 200.0).abs() < 1e-2);
        assert!((v.pan_y + 325.0 * v.zoom - 200.0).abs() < 1e-2);
    }

    #[test]
    fn fit_to_with_max_zoom_caps_content_fit() {
        let mut v = Viewport::IDENTITY;
        let content = Rect {
            origin: Point2D::new(100.0, 50.0),
            size: Point2D::new(200.0, 100.0),
        };

        v.fit_to_with_max_zoom(content, 1000.0, 800.0, 100.0, 2.0);

        assert_eq!(v.zoom, 2.0);
        assert!((v.pan_x - 100.0).abs() < 1e-2, "pan_x {}", v.pan_x);
        assert!((v.pan_y - 200.0).abs() < 1e-2, "pan_y {}", v.pan_y);
    }

    #[test]
    fn fit_to_ignores_empty_content() {
        let mut v = Viewport::IDENTITY;
        v.fit_to(
            Rect {
                origin: Point2D::ZERO,
                size: Point2D::ZERO,
            },
            400.0,
            400.0,
            20.0,
        );
        assert_eq!(v, Viewport::IDENTITY);
    }

    #[test]
    fn zoom_clamps_to_range() {
        let mut v = Viewport::IDENTITY;
        v.zoom_at(Point2D::ZERO, 100_000.0);
        assert!(v.zoom <= Viewport::MAX_ZOOM);
        v.zoom_at(Point2D::ZERO, -100_000.0);
        assert!(v.zoom >= Viewport::MIN_ZOOM);
    }
}
