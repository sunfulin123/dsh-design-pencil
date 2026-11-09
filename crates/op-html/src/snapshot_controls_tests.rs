//! Native control reconstruction from captured `control` records.

use crate::{import_snapshot, HtmlImportOptions};
use jian_ops_schema::node::container::{CornerRadius, LayoutMode};
use jian_ops_schema::node::PenNode;
use jian_ops_schema::sizing::SizingBehavior;
use jian_ops_schema::style::PenFill;
use serde_json::{json, Value};

fn import_control(tag: &str, rect: [f64; 4], control: Value, children: Value) -> Vec<PenNode> {
    let snapshot = json!({
        "version": 1,
        "root": {
            "kind": "element", "tag": "body",
            "rect": {"x": 0, "y": 0, "w": 400, "h": 200},
            "styles": {"display": "block"},
            "children": [{
                "kind": "element", "tag": tag,
                "rect": {"x": rect[0], "y": rect[1], "w": rect[2], "h": rect[3]},
                "styles": {"display": "inline-block", "padding-top": "0px"},
                "control": control,
                "children": children,
            }],
        },
    });
    let result = import_snapshot(&snapshot.to_string(), &HtmlImportOptions::default());
    let PenNode::Frame(root) = &result.nodes[0] else {
        panic!("root frame")
    };
    let PenNode::Frame(element) = &root.children.as_ref().unwrap()[0] else {
        panic!("control frame")
    };
    assert_eq!(element.container.layout, Some(LayoutMode::None));
    element.children.clone().unwrap_or_default()
}

fn geometry(node: &PenNode) -> (String, f64, f64, f64, f64) {
    let base = match node {
        PenNode::Frame(frame) => &frame.base,
        PenNode::Path(path) => &path.base,
        PenNode::Text(text) => &text.base,
        _ => panic!("unexpected control layer"),
    };
    let size = |value: &Option<SizingBehavior>| match value {
        Some(SizingBehavior::Number(number)) => *number,
        _ => f64::NAN,
    };
    let (w, h) = match node {
        PenNode::Frame(frame) => (size(&frame.container.width), size(&frame.container.height)),
        PenNode::Path(path) => (size(&path.width), size(&path.height)),
        _ => (f64::NAN, f64::NAN),
    };
    (
        base.name.clone().unwrap_or_default(),
        base.x.unwrap_or_default(),
        base.y.unwrap_or_default(),
        w,
        h,
    )
}

fn fill_color(node: &PenNode) -> String {
    let PenNode::Frame(frame) = node else {
        return String::new();
    };
    match frame.container.fill.as_deref() {
        Some([PenFill::Solid(body)]) => body.color.clone(),
        _ => String::new(),
    }
}

#[test]
fn range_becomes_thumb_fill_and_track_at_its_value() {
    let layers = import_control(
        "input",
        [10.0, 36.0, 130.0, 16.0],
        json!({"type": "range", "appearance": "auto", "accentColor": "auto", "min": 0, "max": 100, "value": 50}),
        json!([{"kind": "text", "rect": {"x": 22, "y": 36, "w": 16, "h": 16}, "text": "50", "lines": 1}]),
    );
    let shapes: Vec<_> = layers.iter().map(geometry).collect();
    assert_eq!(
        shapes,
        vec![
            ("Thumb".into(), 57.0, 0.0, 16.0, 16.0),
            ("Fill".into(), 0.0, 4.0, 65.0, 8.0),
            ("Track".into(), 0.0, 4.0, 130.0, 8.0),
        ],
        "front-to-back thumb, fill, track; the value text is gone"
    );
    assert_eq!(fill_color(&layers[0]), "#0075ff");
    assert_eq!(fill_color(&layers[2]), "#efefef");
    let PenNode::Frame(track) = &layers[2] else {
        panic!()
    };
    assert_eq!(
        track.container.corner_radius,
        Some(CornerRadius::Uniform(4.0))
    );
}

#[test]
fn accent_color_and_bounds_follow_the_control() {
    let layers = import_control(
        "input",
        [0.0, 0.0, 116.0, 16.0],
        json!({"type": "range", "accentColor": "rgb(194, 65, 12)", "min": 10, "max": 20, "value": 40}),
        json!([]),
    );
    assert_eq!(fill_color(&layers[0]), "#c2410c");
    assert_eq!(
        geometry(&layers[0]).1,
        100.0,
        "values above max pin the thumb to the end"
    );
}

#[test]
fn checkbox_and_radio_draw_their_checked_state() {
    let checked = import_control(
        "input",
        [5.0, 5.0, 13.0, 13.0],
        json!({"type": "checkbox", "appearance": "auto", "checked": true}),
        json!([{"kind": "text", "rect": {"x": 5, "y": 5, "w": 13, "h": 13}, "text": "on", "lines": 1}]),
    );
    let names: Vec<_> = checked.iter().map(|node| geometry(node).0).collect();
    assert_eq!(names, ["Check", "Checkbox"], "no stray 'on' value text");
    assert!(
        matches!(&checked[0], PenNode::Path(path) if path.stroke.is_some() && path.fill.is_none())
    );
    assert_eq!(fill_color(&checked[1]), "#0075ff");

    let unchecked = import_control(
        "input",
        [0.0, 0.0, 13.0, 13.0],
        json!({"type": "checkbox"}),
        json!([]),
    );
    assert_eq!(unchecked.len(), 1);
    assert_eq!(fill_color(&unchecked[0]), "#ffffff");

    let radio = import_control(
        "input",
        [0.0, 0.0, 13.0, 13.0],
        json!({"type": "radio", "checked": true, "accentColor": "#10b981"}),
        json!([]),
    );
    let shapes: Vec<_> = radio.iter().map(geometry).collect();
    assert_eq!(shapes[0], ("Dot".into(), 2.75, 2.75, 7.5, 7.5));
    assert_eq!(shapes[1], ("Radio".into(), 0.0, 0.0, 13.0, 13.0));
}

#[test]
fn progress_fills_by_value_and_indeterminate_shows_only_the_track() {
    let progress = import_control(
        "progress",
        [0.0, 0.0, 160.0, 16.0],
        json!({"type": "progress", "min": 0, "max": 1, "value": 0.4}),
        json!([]),
    );
    let shapes: Vec<_> = progress.iter().map(geometry).collect();
    assert_eq!(shapes[0], ("Fill".into(), 0.0, 4.0, 64.0, 8.0));
    assert_eq!(shapes[1].0, "Track");
    let indeterminate = import_control(
        "progress",
        [0.0, 0.0, 160.0, 16.0],
        json!({"type": "progress", "max": 1, "value": null}),
        json!([]),
    );
    assert_eq!(indeterminate.len(), 1);
}

#[test]
fn select_keeps_its_text_and_gains_a_chevron() {
    let layers = import_control(
        "select",
        [0.0, 0.0, 145.0, 19.0],
        json!({"type": "select", "appearance": "auto", "color": "rgb(0, 0, 0)"}),
        json!([{"kind": "text", "rect": {"x": 4, "y": 1, "w": 120, "h": 17}, "text": "Featured", "lines": 1}]),
    );
    assert_eq!(layers.len(), 2);
    assert_eq!(
        geometry(&layers[0]),
        ("Chevron".into(), 133.0, 7.5, 7.0, 4.0)
    );
    assert!(matches!(layers[1], PenNode::Text(_)));
}

#[test]
fn author_styled_controls_keep_the_captured_box() {
    let snapshot = json!({
        "version": 1,
        "root": {"kind": "element", "tag": "body", "rect": {"x": 0, "y": 0, "w": 200, "h": 40},
            "children": [{"kind": "element", "tag": "input", "rect": {"x": 0, "y": 0, "w": 100, "h": 20},
                "control": {"type": "range", "appearance": "none", "value": 5},
                "children": []}]},
    });
    let result = import_snapshot(&snapshot.to_string(), &HtmlImportOptions::default());
    let PenNode::Frame(root) = &result.nodes[0] else {
        panic!()
    };
    let PenNode::Frame(input) = &root.children.as_ref().unwrap()[0] else {
        panic!()
    };
    assert!(input.children.as_ref().is_none_or(Vec::is_empty));
}
