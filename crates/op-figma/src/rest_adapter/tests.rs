//! REST adapter fixtures modelled on real Figma API payloads (a table
//! threshold row and a settings panel) — every numeric field must survive
//! unchanged and every node must land on its Figma bounding box.

use super::*;
use jian_ops_schema::node::container::{LayoutMode, Padding};
use jian_ops_schema::node::text::{TextContent, TextGrowth, TextTruncation};
use jian_ops_schema::sizing::{SizingBehavior, SizingKeyword};
use jian_ops_schema::style::PenFill;
use op_editor_core::PenNodeExt;
use serde_json::json;

fn bbox(x: f64, y: f64, w: f64, h: f64) -> Value {
    json!({"x": x, "y": y, "width": w, "height": h})
}

fn rt(x: f64, y: f64) -> Value {
    json!([[1.0, 0.0, x], [0.0, 1.0, y]])
}

fn solid(r: f64, g: f64, b: f64) -> Value {
    json!({"type": "SOLID", "color": {"r": r, "g": g, "b": b, "a": 1.0}})
}

fn threshold_row() -> Value {
    json!({
        "id": "2499:45468", "name": "Threshold row", "type": "FRAME",
        "absoluteBoundingBox": bbox(5568.0, 11947.0, 450.0, 48.0),
        "relativeTransform": rt(5568.0, 11947.0),
        "size": {"x": 450.0, "y": 48.0},
        "layoutMode": "HORIZONTAL", "itemSpacing": 8.5,
        "paddingLeft": 12.25, "paddingRight": 12.25, "paddingTop": 6.0, "paddingBottom": 6.0,
        "primaryAxisAlignItems": "SPACE_BETWEEN", "counterAxisAlignItems": "CENTER",
        "primaryAxisSizingMode": "FIXED", "counterAxisSizingMode": "AUTO",
        "layoutSizingHorizontal": "FIXED", "layoutSizingVertical": "HUG",
        "clipsContent": true, "cornerRadius": 6.5,
        "fills": [solid(1.0, 1.0, 1.0)],
        "strokes": [solid(0.88, 0.89, 0.9)], "strokeWeight": 1.0, "strokeAlign": "INSIDE",
        "effects": [{"type": "DROP_SHADOW", "visible": true, "radius": 4.0, "spread": 0.0,
            "offset": {"x": 0.0, "y": 1.0}, "color": {"r": 0.0, "g": 0.0, "b": 0.0, "a": 0.08}}],
        "children": [
            {
                "id": "2499:45469", "name": "Channel", "type": "TEXT",
                "absoluteBoundingBox": bbox(5580.25, 11961.0, 36.0, 20.0),
                "relativeTransform": rt(12.25, 14.0), "size": {"x": 36.0, "y": 20.0},
                "characters": "Channel",
                "layoutSizingHorizontal": "FIXED", "layoutSizingVertical": "FIXED",
                "style": {"fontFamily": "Roboto", "fontPostScriptName": "Roboto-Medium",
                    "fontWeight": 500, "fontSize": 14.0, "letterSpacing": 0.1,
                    "lineHeightPx": 20.0, "lineHeightUnit": "PIXELS",
                    "textAlignHorizontal": "LEFT", "textAlignVertical": "CENTER",
                    "textAutoResize": "NONE", "textTruncation": "ENDING", "maxLines": 1},
                "fills": [solid(0.13, 0.13, 0.13)]
            },
            {
                "id": "2499:45470", "name": "Chevron", "type": "VECTOR",
                "absoluteBoundingBox": bbox(5624.25, 11963.0, 16.0, 16.0),
                "relativeTransform": rt(56.25, 16.0), "size": {"x": 16.0, "y": 16.0},
                "fills": [solid(0.4, 0.4, 0.4)],
                "fillGeometry": [{"path": "M2 5L8 11L14 5L12.5 3.5L8 8L3.5 3.5Z", "windingRule": "EVENODD"}]
            },
            {
                "id": "2499:45471", "name": "Value", "type": "TEXT",
                "absoluteBoundingBox": bbox(5648.25, 11961.0, 357.5, 20.0),
                "relativeTransform": rt(80.25, 14.0), "size": {"x": 357.5, "y": 20.0},
                "characters": "Out of adherence",
                "characterStyleOverrides": [1, 1, 1],
                "styleOverrideTable": {"1": {"fontWeight": 700, "fills": [solid(0.86, 0.15, 0.15)]}},
                "layoutGrow": 1.0, "layoutSizingHorizontal": "FILL", "layoutSizingVertical": "HUG",
                "style": {"fontFamily": "Roboto", "fontWeight": 400, "fontSize": 13.0,
                    "lineHeightPx": 18.0, "textAutoResize": "HEIGHT"},
                "fills": [solid(0.2, 0.2, 0.2)]
            },
            {
                "id": "2499:45472", "name": "Badge", "type": "RECTANGLE",
                "absoluteBoundingBox": bbox(5998.0, 11940.0, 24.0, 12.0),
                "relativeTransform": rt(430.0, -7.0), "size": {"x": 24.0, "y": 12.0},
                "layoutPositioning": "ABSOLUTE",
                "constraints": {"horizontal": "RIGHT", "vertical": "TOP"},
                "rectangleCornerRadii": [6.0, 6.0, 0.0, 0.0],
                "fills": [{"type": "GRADIENT_LINEAR",
                    "gradientHandlePositions": [{"x": 0.5, "y": 0.0}, {"x": 0.5, "y": 1.0}, {"x": 0.0, "y": 0.0}],
                    "gradientStops": [
                        {"position": 0.0, "color": {"r": 1.0, "g": 0.0, "b": 0.0, "a": 1.0}},
                        {"position": 1.0, "color": {"r": 0.0, "g": 0.0, "b": 1.0, "a": 1.0}}]}]
            },
            {"id": "2499:45473", "name": "Hidden", "type": "RECTANGLE", "visible": false,
                "absoluteBoundingBox": bbox(5568.0, 11947.0, 10.0, 10.0)}
        ]
    })
}

fn frame_children(node: &PenNode) -> &[PenNode] {
    match node {
        PenNode::Frame(f) => f.children.as_deref().unwrap_or(&[]),
        other => panic!("expected frame, got {other:?}"),
    }
}

fn find<'a>(nodes: &'a [PenNode], name: &str) -> &'a PenNode {
    nodes
        .iter()
        .find(|n| n.base().name.as_deref() == Some(name))
        .unwrap_or_else(|| panic!("missing {name}"))
}

fn close(a: f64, b: f64) {
    assert!((a - b).abs() <= 0.01, "{a} != {b}");
}

#[test]
fn threshold_row_preserves_geometry_and_numbers_exactly() {
    let result = convert_rest_nodes(&[threshold_row()], &RestImportOptions::default());
    assert_eq!(result.node_count, 5, "hidden node is skipped");
    assert_eq!(result.source_bounds, Some([5568.0, 11947.0, 450.0, 48.0]));
    assert_eq!(result.bounds, Some([0.0, 0.0, 450.0, 48.0]));
    let PenNode::Frame(row) = &result.nodes[0] else {
        panic!("row is a frame")
    };
    assert_eq!((row.base.x, row.base.y), (Some(0.0), Some(0.0)));
    assert_eq!(row.container.width, Some(SizingBehavior::Number(450.0)));
    assert_eq!(row.container.layout, Some(LayoutMode::Horizontal));
    assert_eq!(row.container.padding, Some(Padding::XY([6.0, 12.25])));
    assert_eq!(row.container.clip_content, Some(true));
    let kids = frame_children(&result.nodes[0]);
    // Topmost-first order: the last REST child comes first.
    assert_eq!(kids[0].base().name.as_deref(), Some("Badge"));

    let PenNode::Text(channel) = find(kids, "Channel") else {
        panic!("text")
    };
    close(channel.base.x.unwrap(), 12.25);
    close(channel.base.y.unwrap(), 14.0);
    assert_eq!(channel.text_truncation, Some(TextTruncation::Ending));
    assert_eq!(channel.max_lines, Some(1));
    assert_eq!(channel.text_growth, Some(TextGrowth::FixedWidthHeight));
    assert_eq!(channel.font_size, Some(14.0));
    assert_eq!(channel.font_family.as_deref(), Some("Roboto"));
    assert!(matches!(
        channel.font_weight,
        Some(jian_ops_schema::node::FontWeight::Number(500))
    ));
    close(channel.line_height.unwrap() * 14.0, 20.0);
    close(channel.letter_spacing.unwrap(), 0.1);

    let PenNode::Path(chevron) = find(kids, "Chevron") else {
        panic!("path")
    };
    let d = chevron.d.as_deref().unwrap_or_default();
    assert!(d.starts_with("M2 5 L8 11"), "{d}");
    assert!(chevron.fill_rule.is_some(), "EVENODD maps to evenodd");

    let PenNode::Text(value) = find(kids, "Value") else {
        panic!("text")
    };
    let TextContent::Styled(runs) = &value.content else {
        panic!("styled runs: {:?}", value.content)
    };
    assert_eq!(runs[0].text, "Out");
    assert_eq!(runs[0].font_weight, Some(700));
    assert_eq!(runs[1].text, " of adherence");

    let PenNode::Rectangle(badge) = find(kids, "Badge") else {
        panic!("rect")
    };
    close(badge.base.x.unwrap(), 430.0);
    close(badge.base.y.unwrap(), -7.0);
    let Some(PenFill::LinearGradient(g)) = badge.container.fill.as_ref().and_then(|f| f.first())
    else {
        panic!("gradient")
    };
    assert_eq!(g.angle, Some(180.0), "top → bottom");
}

#[test]
fn semantic_mode_keeps_hug_fill_and_absolute_children() {
    let options = RestImportOptions {
        layout_mode: FigLayoutMode::OpenPencil,
        ..RestImportOptions::default()
    };
    let result = convert_rest_nodes(&[threshold_row()], &options);
    let PenNode::Frame(row) = &result.nodes[0] else {
        panic!()
    };
    assert_eq!(
        row.container.height,
        Some(SizingBehavior::Keyword(SizingKeyword::FitContent))
    );
    let kids = frame_children(&result.nodes[0]);
    let PenNode::Text(value) = find(kids, "Value") else {
        panic!()
    };
    assert_eq!(
        value.width,
        Some(SizingBehavior::Keyword(SizingKeyword::FillContainer))
    );
    let badge = find(kids, "Badge");
    assert_eq!(badge.base().x, Some(430.0), "absolute child keeps its x");
    assert!(badge.base().constraints.is_some());
    let flow = find(kids, "Channel");
    assert_eq!(
        flow.base().x,
        None,
        "flow children are positioned by layout"
    );
}

#[test]
fn rotated_flipped_image_and_font_inventory() {
    let root = json!({
        "id": "1:1", "name": "Card", "type": "FRAME",
        "absoluteBoundingBox": bbox(100.0, 200.0, 300.0, 200.0),
        "relativeTransform": rt(100.0, 200.0), "size": {"x": 300.0, "y": 200.0},
        "children": [
            {"id": "1:2", "name": "Rotated", "type": "RECTANGLE",
             "absoluteBoundingBox": bbox(150.0, 220.0, 20.0, 100.0),
             "relativeTransform": [[0.0, -1.0, 70.0], [1.0, 0.0, 20.0]],
             "size": {"x": 100.0, "y": 20.0}, "fills": [solid(0.0, 0.0, 0.0)]},
            {"id": "1:3", "name": "Mirrored", "type": "RECTANGLE",
             "absoluteBoundingBox": bbox(200.0, 300.0, 40.0, 10.0),
             "relativeTransform": [[-1.0, 0.0, 140.0], [0.0, 1.0, 100.0]],
             "size": {"x": 40.0, "y": 10.0}, "fills": [solid(0.0, 0.0, 0.0)]},
            {"id": "1:4", "name": "Photo", "type": "RECTANGLE",
             "absoluteBoundingBox": bbox(110.0, 210.0, 50.0, 50.0),
             "relativeTransform": rt(10.0, 10.0), "size": {"x": 50.0, "y": 50.0},
             "fills": [{"type": "IMAGE", "imageRef": "ABCDEF0123", "scaleMode": "FILL"}]}
        ]
    });
    let result = convert_rest_nodes(&[root], &RestImportOptions::default());
    assert_eq!(result.image_refs, vec!["ABCDEF0123".to_string()]);
    let kids = frame_children(&result.nodes[0]);
    let rotated = find(kids, "Rotated").base();
    assert_eq!(rotated.rotation, Some(90.0));
    // The rotated box centre (60, 70 relative) must be preserved.
    close(rotated.x.unwrap() + 50.0, 60.0);
    close(rotated.y.unwrap() + 10.0, 70.0);
    let mirrored = find(kids, "Mirrored").base();
    assert_eq!(mirrored.flip_x, Some(true));
    close(mirrored.x.unwrap(), 100.0);
    let PenNode::Rectangle(photo) = find(kids, "Photo") else {
        panic!()
    };
    let Some(PenFill::Image(img)) = photo.container.fill.as_ref().and_then(|f| f.first()) else {
        panic!("image fill")
    };
    assert_eq!(img.url.to_string(), "__hash:abcdef0123");

    let fonts = convert_rest_nodes(&[threshold_row()], &RestImportOptions::default()).fonts;
    let faces: Vec<(String, u32)> = fonts.iter().map(|f| (f.family.clone(), f.weight)).collect();
    assert!(faces.contains(&("Roboto".into(), 500)));
    assert!(faces.contains(&("Roboto".into(), 400)));
    assert!(
        faces.contains(&("Roboto".into(), 700)),
        "override faces are inventoried"
    );
}

#[test]
fn nodes_response_and_origin_none_keep_page_coordinates() {
    let body = json!({"nodes": {"2499:45468": {"document": threshold_row()}}});
    let options = RestImportOptions {
        origin: None,
        ..RestImportOptions::default()
    };
    let result = convert_rest_response(&body, &options);
    assert_eq!(result.nodes[0].base().x, Some(5568.0));
    assert_eq!(result.bounds, result.source_bounds);
}

/// Port of the retired JS `mapFigmaNode` fidelity fixture.
#[test]
fn hero_section_fills_strokes_effects_and_rich_text() {
    let hero = json!({
        "type": "FRAME", "name": "Hero Section",
        "absoluteBoundingBox": bbox(100.0, 50.0, 800.0, 400.0),
        "layoutMode": "HORIZONTAL", "primaryAxisAlignItems": "SPACE_BETWEEN",
        "counterAxisAlignItems": "CENTER", "itemSpacing": 24.0,
        "paddingTop": 32.0, "paddingRight": 40.0, "paddingBottom": 32.0, "paddingLeft": 40.0,
        "rectangleCornerRadii": [12.0, 12.0, 0.0, 0.0], "clipsContent": true,
        "fills": [
            {"type": "GRADIENT_LINEAR",
             "gradientHandlePositions": [{"x": 0.0, "y": 0.0}, {"x": 1.0, "y": 0.0}],
             "gradientStops": [
                {"position": 0.0, "color": {"r": 0.1, "g": 0.2, "b": 0.9, "a": 1.0}},
                {"position": 1.0, "color": {"r": 0.5, "g": 0.1, "b": 0.8, "a": 1.0}}]},
            {"type": "IMAGE", "imageRef": "img_hero_bg", "scaleMode": "FIT"}
        ],
        "strokes": [{"type": "SOLID", "color": {"r": 1.0, "g": 1.0, "b": 1.0, "a": 0.5}}],
        "individualStrokeWeights": {"top": 1.0, "right": 0.0, "bottom": 2.0, "left": 0.0},
        "effects": [{"type": "DROP_SHADOW", "radius": 16.0, "spread": 2.0,
            "offset": {"x": 0.0, "y": 8.0}, "color": {"r": 0.0, "g": 0.0, "b": 0.0, "a": 0.25}}],
        "children": [
            {"type": "VECTOR", "name": "Brand Icon",
             "absoluteBoundingBox": bbox(140.0, 180.0, 24.0, 24.0),
             "fillGeometry": [{"path": "M0 0L24 12L0 24Z", "windingRule": "EVENODD"}],
             "fills": [solid(1.0, 0.5, 0.0)]},
            {"type": "TEXT", "name": "Headline",
             "absoluteBoundingBox": bbox(200.0, 160.0, 360.0, 48.0),
             "characters": "Hello World",
             "style": {"fontFamily": "Plus Jakarta Sans", "fontSize": 36.0, "fontWeight": 700,
                "textAutoResize": "WIDTH_AND_HEIGHT"},
             "characterStyleOverrides": [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1],
             "styleOverrideTable": {"1": {"fontWeight": 800, "italic": true,
                "fills": [solid(0.2, 0.8, 0.4)]}}}
        ]
    });
    let result = convert_rest_nodes(&[hero], &RestImportOptions::default());
    let PenNode::Frame(frame) = &result.nodes[0] else {
        panic!()
    };
    assert_eq!(frame.container.layout, Some(LayoutMode::Horizontal));
    assert_eq!(
        frame.container.justify_content,
        Some(jian_ops_schema::node::container::JustifyContent::SpaceBetween)
    );
    assert_eq!(
        frame.container.corner_radius,
        Some(jian_ops_schema::node::container::CornerRadius::PerCorner([
            12.0, 12.0, 0.0, 0.0
        ]))
    );
    let fills = frame.container.fill.as_ref().unwrap();
    assert!(matches!(fills[0], PenFill::LinearGradient(_)));
    assert!(matches!(fills[1], PenFill::Image(_)));
    assert_eq!(result.image_refs, vec!["img_hero_bg".to_string()]);
    let stroke = frame.container.stroke.as_ref().unwrap();
    assert_eq!(
        stroke.thickness,
        jian_ops_schema::style::StrokeThickness::PerSide([1.0, 0.0, 2.0, 0.0])
    );
    let Some(jian_ops_schema::style::PenEffect::Shadow(shadow)) =
        frame.container.effects.as_ref().and_then(|e| e.first())
    else {
        panic!("shadow")
    };
    assert_eq!(
        (shadow.blur, shadow.spread, shadow.offset_y),
        (16.0, 2.0, 8.0)
    );
    let kids = frame_children(&result.nodes[0]);
    let PenNode::Path(icon) = find(kids, "Brand Icon") else {
        panic!()
    };
    assert_eq!(icon.d.as_deref(), Some("M0 0 L24 12 L0 24 Z"));
    let PenNode::Text(headline) = find(kids, "Headline") else {
        panic!()
    };
    let TextContent::Styled(runs) = &headline.content else {
        panic!("{:?}", headline.content)
    };
    let world = runs.iter().find(|r| r.text == "World").expect("World run");
    assert_eq!(world.font_weight, Some(800));
    assert_eq!(
        world.font_style,
        Some(jian_ops_schema::style::FontStyleKind::Italic)
    );
}

#[test]
fn source_anchor_places_chunks_relative_to_a_shared_point() {
    let options = RestImportOptions {
        origin: Some((400.0, 40.0)),
        source_anchor: Some((5000.0, 11900.0)),
        ..RestImportOptions::default()
    };
    let result = convert_rest_nodes(&[threshold_row()], &options);
    assert_eq!(result.bounds, Some([968.0, 87.0, 450.0, 48.0]));
}

#[test]
fn first_on_top_stacking_maps_to_item_reverse_z_index() {
    let card = json!({
        "id": "9:1", "name": "Widget", "type": "FRAME",
        "absoluteBoundingBox": bbox(0.0, 0.0, 200.0, 100.0),
        "relativeTransform": rt(0.0, 0.0), "size": {"x": 200.0, "y": 100.0},
        "layoutMode": "VERTICAL", "itemReverseZIndex": true,
        "children": []
    });
    let plain = json!({
        "id": "9:2", "name": "Plain", "type": "FRAME",
        "absoluteBoundingBox": bbox(0.0, 200.0, 200.0, 100.0),
        "relativeTransform": rt(0.0, 200.0), "size": {"x": 200.0, "y": 100.0},
        "layoutMode": "VERTICAL", "itemReverseZIndex": false,
        "children": []
    });
    let result = convert_rest_nodes(&[card, plain], &RestImportOptions::default());
    let flag = |name: &str| match find(&result.nodes, name) {
        PenNode::Frame(f) => f.container.item_reverse_z_index,
        other => panic!("expected frame, got {other:?}"),
    };
    assert_eq!(flag("Widget"), Some(true));
    assert_eq!(flag("Plain"), None);
    assert_eq!(
        find(&result.nodes, "Widget")
            .base()
            .figma_node_id
            .as_deref(),
        Some("9:1"),
        "REST ids are kept for verification"
    );
}

#[test]
fn reverse_stacking_flag_follows_the_stored_child_order() {
    // OpenPencil mode stores auto-layout children in flow order, where
    // children[0] (Figma's bottom-most) already paints in front.
    let frame = |id: &str, name: &str, reverse: bool| {
        json!({
            "id": id, "name": name, "type": "FRAME",
            "absoluteBoundingBox": bbox(0.0, 0.0, 200.0, 100.0),
            "relativeTransform": rt(0.0, 0.0), "size": {"x": 200.0, "y": 100.0},
            "layoutMode": "VERTICAL", "itemReverseZIndex": reverse,
            "children": [
                {"id": format!("{id}1"), "name": "A", "type": "RECTANGLE",
                 "absoluteBoundingBox": bbox(0.0, 0.0, 10.0, 10.0), "relativeTransform": rt(0.0, 0.0)},
                {"id": format!("{id}2"), "name": "B", "type": "RECTANGLE",
                 "absoluteBoundingBox": bbox(0.0, 10.0, 10.0, 10.0), "relativeTransform": rt(0.0, 10.0)}
            ]
        })
    };
    let options = RestImportOptions {
        layout_mode: FigLayoutMode::OpenPencil,
        ..RestImportOptions::default()
    };
    let result = convert_rest_nodes(
        &[
            frame("7:1", "Default", false),
            frame("7:2", "FirstOnTop", true),
        ],
        &options,
    );
    let flag = |name: &str| match find(&result.nodes, name) {
        PenNode::Frame(f) => f.container.item_reverse_z_index,
        other => panic!("expected frame, got {other:?}"),
    };
    assert_eq!(
        flag("Default"),
        Some(true),
        "flow order needs Figma's last-on-top"
    );
    assert_eq!(
        flag("FirstOnTop"),
        None,
        "flow order already puts the first child on top"
    );
}

#[test]
fn transparent_layers_import_while_hidden_layers_are_skipped() {
    // A tab's inactive underline is opacity 0 yet still sized by its stack.
    let root = json!({
        "id": "1:1", "name": "Tab", "type": "FRAME", "layoutMode": "VERTICAL",
        "absoluteBoundingBox": bbox(0.0, 0.0, 45.0, 36.0),
        "relativeTransform": rt(0.0, 0.0), "size": {"x": 45.0, "y": 36.0},
        "children": [
            {"id": "1:2", "name": "underline", "type": "RECTANGLE", "opacity": 0.0,
                "fills": [solid(0.1, 0.1, 0.1)], "layoutAlign": "STRETCH",
                "absoluteBoundingBox": bbox(0.0, 32.0, 45.0, 4.0),
                "relativeTransform": rt(0.0, 32.0), "size": {"x": 45.0, "y": 4.0}},
            {"id": "1:3", "name": "Hidden", "type": "RECTANGLE", "visible": false,
                "absoluteBoundingBox": bbox(0.0, 0.0, 10.0, 10.0),
                "relativeTransform": rt(0.0, 0.0), "size": {"x": 10.0, "y": 10.0}}
        ]
    });
    let result = convert_rest_nodes(&[root], &RestImportOptions::default());
    let kids = frame_children(&result.nodes[0]);
    let underline = find(kids, "underline");
    assert!(matches!(
        underline.base().opacity,
        Some(jian_ops_schema::node::base::NumberOrExpression::Number(o)) if o == 0.0
    ));
    assert!(kids
        .iter()
        .all(|n| n.base().name.as_deref() != Some("Hidden")));
}

#[test]
fn mirrored_group_children_do_not_inherit_a_duplicate_flip() {
    // Figma REST `relativeTransform` is parent-relative even inside a GROUP.
    // Treating group children as container-relative flipped them a second time,
    // inverting the diagonal mask on the 67 donut chart (`1817:36855`).
    let root = json!({
        "id": "1:1", "name": "Card", "type": "FRAME",
        "absoluteBoundingBox": bbox(1656.0, 444.0, 81.5, 81.0),
        "relativeTransform": rt(1656.0, 444.0), "size": {"x": 81.5, "y": 81.0},
        "children": [{
            "id": "1:2", "name": "Group 2", "type": "GROUP",
            "absoluteBoundingBox": bbox(1656.0, 444.0, 81.5, 81.0),
            "relativeTransform": [[-1.0, 0.0, 81.5], [0.0, 1.0, 0.0]],
            "size": {"x": 81.5, "y": 81.0},
            "children": [
                {"id": "1:3", "name": "Mask", "type": "RECTANGLE",
                 "absoluteBoundingBox": bbox(1656.0, 444.0, 81.5, 81.0),
                 "relativeTransform": rt(0.0, 0.0), "size": {"x": 81.5, "y": 81.0}},
                {"id": "1:4", "name": "Oval", "type": "ELLIPSE",
                 "absoluteBoundingBox": bbox(1656.0, 444.0, 163.0, 162.0),
                 "relativeTransform": rt(-81.5, 0.0), "size": {"x": 163.0, "y": 162.0}}
            ]
        }]
    });
    let result = convert_rest_nodes(&[root], &RestImportOptions::default());
    let PenNode::Group(group) = &frame_children(&result.nodes[0])[0] else {
        panic!("expected group");
    };
    assert_eq!(group.base.flip_x, Some(true));
    let kids = group.children.as_deref().unwrap();
    let mask = find(kids, "Mask").base();
    assert_eq!(mask.flip_x, None);
    close(mask.x.unwrap(), 0.0);
    let oval = find(kids, "Oval").base();
    assert_eq!(oval.flip_x, None);
    close(oval.x.unwrap(), -81.5);
}
