//! REST node properties → kiwi-shaped [`FigValue`] fields consumed by the
//! binary importer's mappers (`mappers.rs`, `common.rs`, converters).

use super::geometry::Affine;
use crate::kiwi::FigValue;
use serde_json::Value;
use std::collections::BTreeSet;

pub(super) type Fields = Vec<(std::sync::Arc<str>, FigValue)>;

pub(super) fn obj(pairs: Vec<(&str, FigValue)>) -> FigValue {
    FigValue::Object(pairs.into_iter().map(|(k, v)| (k.into(), v)).collect())
}

pub(super) fn num(v: f64) -> FigValue {
    FigValue::Float(v as f32)
}

pub(super) fn text(v: &str) -> FigValue {
    FigValue::Str(v.to_string())
}

pub(super) fn put(fields: &mut Fields, key: &str, value: FigValue) {
    fields.push((key.into(), value));
}

pub(super) fn f64_of(node: &Value, key: &str) -> Option<f64> {
    node.get(key)
        .and_then(Value::as_f64)
        .filter(|v| v.is_finite())
}

pub(super) fn str_of<'a>(node: &'a Value, key: &str) -> Option<&'a str> {
    node.get(key).and_then(Value::as_str)
}

fn copy_num(fields: &mut Fields, node: &Value, from: &str, to: &str) {
    if let Some(v) = f64_of(node, from) {
        put(fields, to, num(v));
    }
}

fn copy_str(fields: &mut Fields, node: &Value, from: &str, to: &str) {
    if let Some(v) = str_of(node, from) {
        put(fields, to, text(v));
    }
}

fn color(value: &Value) -> Option<FigValue> {
    let n = |k: &str| value.get(k).and_then(Value::as_f64).unwrap_or(0.0);
    value.is_object().then(|| {
        obj(vec![
            ("r", num(n("r"))),
            ("g", num(n("g"))),
            ("b", num(n("b"))),
            (
                "a",
                num(value.get("a").and_then(Value::as_f64).unwrap_or(1.0)),
            ),
        ])
    })
}

/// Gradient handles (normalized node space) → the kiwi paint transform,
/// which maps node space onto gradient space where the gradient runs from
/// `(0, 0.5)` to `(1, 0.5)` and the width handle sits at `(0, 1)`.
fn gradient_transform(handles: &[Value]) -> Option<Affine> {
    let point = |i: usize| -> Option<(f64, f64)> {
        let p = handles.get(i)?;
        Some((p.get("x")?.as_f64()?, p.get("y")?.as_f64()?))
    };
    let (h0, h1) = (point(0)?, point(1)?);
    let h2 = point(2).unwrap_or((h0.0 - (h1.1 - h0.1) / 2.0, h0.1 + (h1.0 - h0.0) / 2.0));
    let col1 = (2.0 * (h2.0 - h0.0), 2.0 * (h2.1 - h0.1));
    let to_node = Affine {
        m00: h1.0 - h0.0,
        m01: col1.0,
        m02: h0.0 - 0.5 * col1.0,
        m10: h1.1 - h0.1,
        m11: col1.1,
        m12: h0.1 - 0.5 * col1.1,
    };
    to_node.inverse()
}

/// Lower-case hex bytes of a REST `imageRef` (a SHA-1 hex string). The
/// binary mapper renders `image.hash` as `__hash:<hex>`, so the Node host can
/// map each placeholder back to its `imageRef` for the image-fills endpoint.
pub(super) fn image_hash_bytes(image_ref: &str) -> Vec<u8> {
    let s = image_ref.trim();
    let valid =
        s.len().is_multiple_of(2) && !s.is_empty() && s.bytes().all(|b| b.is_ascii_hexdigit());
    if valid {
        (0..s.len())
            .step_by(2)
            .map(|i| u8::from_str_radix(&s[i..i + 2], 16).unwrap_or(0))
            .collect()
    } else {
        s.as_bytes().to_vec()
    }
}

#[cfg(test)]
pub(super) fn hash_hex(bytes: &[u8]) -> String {
    bytes.iter().map(|b| format!("{b:02x}")).collect()
}

fn paint(value: &Value, image_refs: &mut BTreeSet<String>) -> Option<FigValue> {
    let ty = str_of(value, "type")?;
    let mut p: Fields = Vec::new();
    put(&mut p, "type", text(ty));
    if value.get("visible").and_then(Value::as_bool) == Some(false) {
        put(&mut p, "visible", FigValue::Bool(false));
    }
    copy_num(&mut p, value, "opacity", "opacity");
    if let Some(mode) = str_of(value, "blendMode").filter(|m| *m != "NORMAL") {
        put(&mut p, "blendMode", text(mode));
    }
    match ty {
        "SOLID" => put(&mut p, "color", color(value.get("color")?)?),
        "GRADIENT_LINEAR" | "GRADIENT_RADIAL" | "GRADIENT_ANGULAR" | "GRADIENT_DIAMOND" => {
            let stops = value.get("gradientStops")?.as_array()?;
            let mapped = stops
                .iter()
                .filter_map(|s| {
                    Some(obj(vec![
                        ("color", color(s.get("color")?)?),
                        ("position", num(s.get("position")?.as_f64()?)),
                    ]))
                })
                .collect();
            put(&mut p, "stops", FigValue::Array(mapped));
            if let Some(m) = value
                .get("gradientHandlePositions")
                .and_then(Value::as_array)
                .and_then(|h| gradient_transform(h))
            {
                put(&mut p, "transform", m.to_fig());
            }
        }
        "IMAGE" => {
            let image_ref = str_of(value, "imageRef").filter(|r| !r.trim().is_empty())?;
            image_refs.insert(image_ref.trim().to_string());
            put(
                &mut p,
                "image",
                obj(vec![("hash", FigValue::Bytes(image_hash_bytes(image_ref)))]),
            );
            copy_str(&mut p, value, "scaleMode", "imageScaleMode");
            copy_num(&mut p, value, "scalingFactor", "scale");
            if let Some(m) = Affine::from_rest(value.get("imageTransform")) {
                put(&mut p, "transform", m.to_fig());
            }
            if let Some(filters) = value.get("filters").filter(|f| f.is_object()) {
                let mut f: Fields = Vec::new();
                for key in [
                    "exposure",
                    "contrast",
                    "saturation",
                    "temperature",
                    "tint",
                    "highlights",
                    "shadows",
                ] {
                    copy_num(&mut f, filters, key, key);
                }
                put(&mut p, "paintFilter", FigValue::Object(f));
            }
        }
        _ => return None,
    }
    Some(FigValue::Object(p))
}

pub(super) fn paints(value: Option<&Value>, image_refs: &mut BTreeSet<String>) -> Option<FigValue> {
    let list = value?.as_array()?;
    Some(FigValue::Array(
        list.iter().filter_map(|v| paint(v, image_refs)).collect(),
    ))
}

fn effect(value: &Value) -> Option<FigValue> {
    let ty = match str_of(value, "type")? {
        "LAYER_BLUR" => "FOREGROUND_BLUR",
        other => other,
    };
    let mut e: Fields = Vec::new();
    put(&mut e, "type", text(ty));
    if value.get("visible").and_then(Value::as_bool) == Some(false) {
        put(&mut e, "visible", FigValue::Bool(false));
    }
    copy_num(&mut e, value, "radius", "radius");
    copy_num(&mut e, value, "spread", "spread");
    if let Some(c) = value.get("color").and_then(color) {
        put(&mut e, "color", c);
    }
    if let Some(offset) = value.get("offset") {
        let n = |k: &str| offset.get(k).and_then(Value::as_f64).unwrap_or(0.0);
        put(
            &mut e,
            "offset",
            obj(vec![("x", num(n("x"))), ("y", num(n("y")))]),
        );
    }
    Some(FigValue::Object(e))
}

pub(super) fn visual(node: &Value, f: &mut Fields, image_refs: &mut BTreeSet<String>) {
    if let Some(p) = paints(node.get("fills"), image_refs) {
        put(f, "fillPaints", p);
    }
    if let Some(p) = paints(node.get("background"), image_refs) {
        put(f, "backgroundPaints", p);
    }
    if let Some(p) = paints(node.get("strokes"), image_refs) {
        put(f, "strokePaints", p);
    }
    if let Some(list) = node.get("effects").and_then(Value::as_array) {
        put(
            f,
            "effects",
            FigValue::Array(list.iter().filter_map(effect).collect()),
        );
    }
    copy_num(f, node, "strokeWeight", "strokeWeight");
    copy_str(f, node, "strokeAlign", "strokeAlign");
    copy_str(f, node, "strokeJoin", "strokeJoin");
    copy_str(f, node, "strokeCap", "strokeCap");
    if let Some(dashes) = node.get("strokeDashes").and_then(Value::as_array) {
        let values = dashes.iter().filter_map(Value::as_f64).map(num).collect();
        put(f, "dashPattern", FigValue::Array(values));
    }
    if let Some(w) = node
        .get("individualStrokeWeights")
        .filter(|w| w.is_object())
    {
        put(f, "borderStrokeWeightsIndependent", FigValue::Bool(true));
        for (from, to) in [
            ("top", "borderTopWeight"),
            ("right", "borderRightWeight"),
            ("bottom", "borderBottomWeight"),
            ("left", "borderLeftWeight"),
        ] {
            put(f, to, num(f64_of(w, from).unwrap_or(0.0)));
        }
    }
    copy_num(f, node, "cornerRadius", "cornerRadius");
    copy_num(f, node, "cornerSmoothing", "cornerSmoothing");
    if let Some(radii) = node.get("rectangleCornerRadii").and_then(Value::as_array) {
        let r = |i: usize| radii.get(i).and_then(Value::as_f64).unwrap_or(0.0);
        put(f, "rectangleCornerRadiiIndependent", FigValue::Bool(true));
        put(f, "rectangleTopLeftCornerRadius", num(r(0)));
        put(f, "rectangleTopRightCornerRadius", num(r(1)));
        put(f, "rectangleBottomRightCornerRadius", num(r(2)));
        put(f, "rectangleBottomLeftCornerRadius", num(r(3)));
    }
    if let Some(mode) =
        str_of(node, "blendMode").filter(|m| !matches!(*m, "PASS_THROUGH" | "NORMAL"))
    {
        put(f, "blendMode", text(mode));
    }
    if node.get("isMask").and_then(Value::as_bool) == Some(true) {
        put(f, "mask", FigValue::Bool(true));
        copy_str(f, node, "maskType", "maskType");
    }
}

fn sizing_keyword(mode: Option<&str>) -> Option<&'static str> {
    match mode {
        Some("AUTO") => Some("RESIZE_TO_FIT"),
        Some("FIXED") => Some("FIXED"),
        _ => None,
    }
}

/// Auto layout (container side) and layout participation (child side).
/// `parent_layout` is the parent's REST `layoutMode`.
pub(super) fn layout(node: &Value, parent_layout: Option<&str>, f: &mut Fields) {
    let mode = str_of(node, "layoutMode").filter(|m| matches!(*m, "HORIZONTAL" | "VERTICAL"));
    if let Some(mode) = mode {
        put(f, "stackMode", text(mode));
        copy_num(f, node, "itemSpacing", "stackSpacing");
        put(
            f,
            "stackHorizontalPadding",
            num(f64_of(node, "paddingLeft").unwrap_or(0.0)),
        );
        put(
            f,
            "stackPaddingRight",
            num(f64_of(node, "paddingRight").unwrap_or(0.0)),
        );
        put(
            f,
            "stackVerticalPadding",
            num(f64_of(node, "paddingTop").unwrap_or(0.0)),
        );
        put(
            f,
            "stackPaddingBottom",
            num(f64_of(node, "paddingBottom").unwrap_or(0.0)),
        );
        let primary = match str_of(node, "primaryAxisAlignItems") {
            Some("SPACE_BETWEEN") => Some("SPACE_EVENLY"),
            Some(v @ ("MIN" | "CENTER" | "MAX")) => Some(v),
            _ => None,
        };
        if let Some(v) = primary {
            put(f, "stackPrimaryAlignItems", text(v));
        }
        if let Some(v) = str_of(node, "counterAxisAlignItems") {
            put(f, "stackCounterAlignItems", text(v));
        }
        let (mut primary_sizing, mut counter_sizing) = (
            sizing_keyword(str_of(node, "primaryAxisSizingMode")),
            sizing_keyword(str_of(node, "counterAxisSizingMode")),
        );
        // Newer `layoutSizing*` values are authoritative when present.
        let (h, v) = (
            str_of(node, "layoutSizingHorizontal"),
            str_of(node, "layoutSizingVertical"),
        );
        let (primary_axis, counter_axis) = if mode == "HORIZONTAL" { (h, v) } else { (v, h) };
        match primary_axis {
            Some("HUG") => primary_sizing = Some("RESIZE_TO_FIT"),
            Some("FIXED" | "FILL") => primary_sizing = Some("FIXED"),
            _ => {}
        }
        match counter_axis {
            Some("HUG") => counter_sizing = Some("RESIZE_TO_FIT"),
            Some("FIXED" | "FILL") => counter_sizing = Some("FIXED"),
            _ => {}
        }
        if let Some(v) = primary_sizing {
            put(f, "stackPrimarySizing", text(v));
        }
        if let Some(v) = counter_sizing {
            put(f, "stackCounterSizing", text(v));
        }
    }
    let in_flow = matches!(parent_layout, Some("HORIZONTAL" | "VERTICAL"));
    if str_of(node, "layoutPositioning") == Some("ABSOLUTE") {
        put(f, "stackPositioning", text("ABSOLUTE"));
    } else if in_flow {
        let (h, v) = (
            str_of(node, "layoutSizingHorizontal"),
            str_of(node, "layoutSizingVertical"),
        );
        let (primary_axis, counter_axis) = if parent_layout == Some("HORIZONTAL") {
            (h, v)
        } else {
            (v, h)
        };
        let grows = primary_axis == Some("FILL")
            || (primary_axis.is_none() && f64_of(node, "layoutGrow") == Some(1.0));
        if grows {
            put(f, "stackChildPrimaryGrow", num(1.0));
        }
        let stretches = counter_axis == Some("FILL")
            || (counter_axis.is_none() && str_of(node, "layoutAlign") == Some("STRETCH"));
        if stretches {
            put(f, "stackChildAlignSelf", text("STRETCH"));
        }
    }
    for key in ["minWidth", "maxWidth", "minHeight", "maxHeight"] {
        copy_num(f, node, key, key);
    }
    if let Some(c) = node.get("constraints") {
        fn map(v: Option<&str>) -> Option<&str> {
            match v {
                Some("LEFT" | "TOP") => Some("MIN"),
                Some("RIGHT" | "BOTTOM") => Some("MAX"),
                Some("LEFT_RIGHT" | "TOP_BOTTOM") => Some("STRETCH"),
                Some(v @ ("CENTER" | "SCALE")) => Some(v),
                _ => None,
            }
        }
        if let Some(v) = map(str_of(c, "horizontal")) {
            put(f, "horizontalConstraint", text(v));
        }
        if let Some(v) = map(str_of(c, "vertical")) {
            put(f, "verticalConstraint", text(v));
        }
    }
    if let Some(clips) = node.get("clipsContent").and_then(Value::as_bool) {
        put(f, "frameMaskDisabled", FigValue::Bool(!clips));
    }
    if node.get("itemReverseZIndex").and_then(Value::as_bool) == Some(true) {
        put(f, "stackReverseZIndex", FigValue::Bool(true));
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn horizontal_gradient_handles_give_identity_transform() {
        let handles: Vec<Value> =
            serde_json::from_str(r#"[{"x":0,"y":0.5},{"x":1,"y":0.5},{"x":0,"y":1}]"#).unwrap();
        let m = gradient_transform(&handles).unwrap();
        for (a, b) in [
            (m.m00, 1.0),
            (m.m01, 0.0),
            (m.m10, 0.0),
            (m.m11, 1.0),
            (m.m02, 0.0),
            (m.m12, 0.0),
        ] {
            assert!((a - b).abs() < 1e-9, "{m:?}");
        }
    }

    #[test]
    fn image_refs_hex_decode_round_trip() {
        let r = "0a1B2c3d";
        assert_eq!(hash_hex(&image_hash_bytes(r)), "0a1b2c3d");
    }
}
