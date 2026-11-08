//! Exact instance-override addressing and component-property bindings,
//! end to end through `convert_node`.
//!
//! Contracts ported from open-pencil
//! `packages/fig/tests/instance-overrides/{addressing,stale-path}.test.ts`
//! and `bindings/interpret.test.ts`: segments match a record's `guid` or
//! `overrideKey`; a path never searches inside a nested instance; ambiguous or
//! missing segments change nothing and are counted; component defaults are
//! replaced by instance assignments; explicit overrides beat bindings; outer
//! assignments routed to one nested instance never leak to its siblings.

use super::tests::{fresh_ctx, obj};
use super::*;
use crate::instance::take_override_diagnostics;
use op_editor_core::PenNodeExt;

fn guid(sid: u32, lid: u32) -> FigValue {
    obj(vec![
        ("sessionID", FigValue::Uint(sid)),
        ("localID", FigValue::Uint(lid)),
    ])
}

fn size(x: f32, y: f32) -> FigValue {
    obj(vec![("x", FigValue::Float(x)), ("y", FigValue::Float(y))])
}

fn path(guids: Vec<FigValue>) -> FigValue {
    obj(vec![("guids", FigValue::Array(guids))])
}

fn text(characters: &str) -> FigValue {
    obj(vec![("characters", FigValue::Str(characters.into()))])
}

fn node(fields: Vec<(&str, FigValue)>, children: Vec<TreeNode>) -> TreeNode {
    TreeNode {
        figma: obj(fields),
        children,
    }
}

fn label(lid: u32, key: u32, characters: &str, refs: Option<FigValue>) -> TreeNode {
    let mut fields = vec![
        ("type", FigValue::Str("TEXT".into())),
        ("guid", guid(1, lid)),
        ("overrideKey", guid(8, key)),
        ("name", FigValue::Str(format!("Label {lid}"))),
        ("size", size(80.0, 20.0)),
        ("fontSize", FigValue::Float(14.0)),
        ("textData", text(characters)),
    ];
    if let Some(refs) = refs {
        fields.push(("componentPropRefs", refs));
    }
    node(fields, vec![])
}

fn prop_ref(def: u32, field: &str) -> FigValue {
    obj(vec![
        ("defID", guid(70, def)),
        ("componentPropNodeField", FigValue::Str(field.into())),
    ])
}

/// Component C (1:1): one text label addressed by override key 8:2.
fn component_c(extra: Vec<TreeNode>, defs: Option<FigValue>) -> TreeNode {
    let mut children = vec![label(
        2,
        2,
        "Default",
        Some(FigValue::Array(vec![prop_ref(1, "TEXT_DATA")])),
    )];
    children.extend(extra);
    let mut fields = vec![
        ("type", FigValue::Str("SYMBOL".into())),
        ("guid", guid(1, 1)),
        ("name", FigValue::Str("C".into())),
        ("size", size(100.0, 40.0)),
    ];
    if let Some(defs) = defs {
        fields.push(("componentPropDefs", defs));
    }
    node(fields, children)
}

fn instance_of(symbol: FigValue, lid: u32, key: u32, extra: Vec<(&str, FigValue)>) -> TreeNode {
    let mut fields = vec![
        ("type", FigValue::Str("INSTANCE".into())),
        ("guid", guid(2, lid)),
        ("overrideKey", guid(6, key)),
        ("name", FigValue::Str(format!("Instance {lid}"))),
        ("size", size(100.0, 40.0)),
        ("symbolData", obj(vec![("symbolID", symbol)])),
    ];
    fields.extend(extra);
    node(fields, vec![])
}

/// Outer component O (3:1) holding two copies of C, keys 6:1 and 6:2.
fn component_o() -> TreeNode {
    node(
        vec![
            ("type", FigValue::Str("SYMBOL".into())),
            ("guid", guid(3, 1)),
            ("name", FigValue::Str("O".into())),
            ("size", size(100.0, 80.0)),
        ],
        vec![
            instance_of(guid(1, 1), 1, 1, vec![]),
            instance_of(guid(1, 1), 2, 2, vec![]),
        ],
    )
}

fn placed(symbol: FigValue, overrides: Vec<FigValue>, extra: Vec<(&str, FigValue)>) -> TreeNode {
    let mut symbol_data = vec![("symbolID", symbol)];
    if !overrides.is_empty() {
        symbol_data.push(("symbolOverrides", FigValue::Array(overrides)));
    }
    let mut fields = vec![
        ("type", FigValue::Str("INSTANCE".into())),
        ("guid", guid(4, 1)),
        ("name", FigValue::Str("Placed".into())),
        ("size", size(100.0, 80.0)),
        ("symbolData", obj(symbol_data)),
    ];
    fields.extend(extra);
    node(fields, vec![])
}

fn override_entry(guids: Vec<FigValue>, extra: Vec<(&str, FigValue)>) -> FigValue {
    let mut pairs = vec![("guidPath", path(guids))];
    pairs.extend(extra);
    obj(pairs)
}

/// Text contents in document order of the converted subtree.
fn texts(converted: &PenNode) -> Vec<String> {
    fn walk(value: &serde_json::Value, out: &mut Vec<String>) {
        match value {
            serde_json::Value::Object(map) => {
                if map.get("type").and_then(|t| t.as_str()) == Some("text") {
                    match map.get("content") {
                        Some(serde_json::Value::String(s)) => out.push(s.clone()),
                        Some(other) => out.push(other.to_string()),
                        None => {}
                    }
                }
                if let Some(children) = map.get("children") {
                    walk(children, out);
                }
            }
            serde_json::Value::Array(items) => items.iter().for_each(|item| walk(item, out)),
            _ => {}
        }
    }
    let mut out = Vec::new();
    walk(&serde_json::to_value(converted).unwrap(), &mut out);
    out
}

fn convert_with(symbols: &[&TreeNode], instance: &TreeNode) -> (Vec<String>, usize) {
    take_override_diagnostics();
    let mut ctx = fresh_ctx();
    for symbol in symbols {
        let key = symbol.figma.get("guid").and_then(guid_to_string).unwrap();
        ctx.symbol_tree.insert(key, symbol);
    }
    let converted = convert_node(instance, None, &mut ctx).expect("instance converts");
    let (missing, ambiguous) = take_override_diagnostics();
    // Fixture children are listed in converted (document) order.
    (texts(&converted), missing + ambiguous)
}

#[test]
fn override_key_targets_the_second_occurrence_without_touching_its_sibling() {
    let c = component_c(vec![], None);
    let o = component_o();
    let instance = placed(
        guid(3, 1),
        vec![
            override_entry(
                vec![guid(6, 2), guid(8, 2)],
                vec![("textData", text("Second"))],
            ),
            // A root claim configures the placed instance itself.
            override_entry(vec![guid(3, 1)], vec![("opacity", FigValue::Float(0.5))]),
        ],
        vec![],
    );
    let (texts, diagnostics) = convert_with(&[&c, &o], &instance);
    assert_eq!(texts, ["Default", "Second"]);
    assert_eq!(diagnostics, 0);
}

#[test]
fn a_path_never_searches_inside_a_nested_instance() {
    let c = component_c(vec![], None);
    let o = component_o();
    // 8:2 lives inside the nested copies, not among O's static descendants.
    let instance = placed(
        guid(3, 1),
        vec![override_entry(
            vec![guid(8, 2)],
            vec![("textData", text("Leaked"))],
        )],
        vec![],
    );
    let (texts, diagnostics) = convert_with(&[&c, &o], &instance);
    assert_eq!(texts, ["Default", "Default"]);
    assert_eq!(diagnostics, 1, "missing segment is reported, not guessed");
}

#[test]
fn ambiguous_override_keys_change_nothing_and_are_reported() {
    let twin = label(3, 2, "Twin", None);
    let c = component_c(vec![twin], None);
    let instance = placed(
        guid(1, 1),
        vec![override_entry(
            vec![guid(8, 2)],
            vec![("textData", text("Chosen"))],
        )],
        vec![],
    );
    let (texts, diagnostics) = convert_with(&[&c], &instance);
    assert!(!texts.iter().any(|t| t == "Chosen"), "{texts:?}");
    assert_eq!(diagnostics, 1);
}

fn text_and_visibility_defs() -> FigValue {
    FigValue::Array(vec![
        obj(vec![
            ("id", guid(70, 1)),
            ("initialValue", obj(vec![("textValue", text("Default"))])),
        ]),
        obj(vec![
            ("id", guid(70, 2)),
            (
                "initialValue",
                obj(vec![("boolValue", FigValue::Bool(true))]),
            ),
        ]),
    ])
}

fn icon_bound_to_visibility() -> TreeNode {
    label(
        4,
        4,
        "Icon",
        Some(FigValue::Array(vec![prop_ref(2, "VISIBLE")])),
    )
}

fn assignment(def: u32, value: FigValue) -> FigValue {
    obj(vec![("defID", guid(70, def)), ("value", value)])
}

#[test]
fn instance_assignments_replace_component_defaults() {
    let c = component_c(
        vec![icon_bound_to_visibility()],
        Some(text_and_visibility_defs()),
    );
    let instance = placed(
        guid(1, 1),
        vec![],
        vec![(
            "componentPropAssignments",
            FigValue::Array(vec![
                assignment(1, obj(vec![("textValue", text("Dashboard Example"))])),
                assignment(2, obj(vec![("boolValue", FigValue::Bool(false))])),
            ]),
        )],
    );
    let (texts, _) = convert_with(&[&c], &instance);
    assert_eq!(texts, ["Dashboard Example"], "text bound, icon hidden");
}

#[test]
fn unassigned_properties_keep_component_defaults() {
    let c = component_c(
        vec![icon_bound_to_visibility()],
        Some(text_and_visibility_defs()),
    );
    let instance = placed(guid(1, 1), vec![], vec![]);
    let (texts, _) = convert_with(&[&c], &instance);
    assert_eq!(texts, ["Default", "Icon"]);
}

#[test]
fn an_explicit_override_wins_over_a_bound_property() {
    let c = component_c(vec![], Some(text_and_visibility_defs()));
    let instance = placed(
        guid(1, 1),
        vec![override_entry(
            vec![guid(8, 2)],
            vec![("textData", text("Explicit"))],
        )],
        vec![(
            "componentPropAssignments",
            FigValue::Array(vec![assignment(1, obj(vec![("textValue", text("Bound"))]))]),
        )],
    );
    let (texts, _) = convert_with(&[&c], &instance);
    assert_eq!(texts, ["Explicit"]);
}

#[test]
fn variable_bound_assignments_use_the_cached_value() {
    let c = component_c(vec![], Some(text_and_visibility_defs()));
    let variable = obj(vec![
        ("defID", guid(70, 1)),
        (
            "varValue",
            obj(vec![(
                "value",
                obj(vec![("textDataValue", text("From variable"))]),
            )]),
        ),
    ]);
    let instance = placed(
        guid(1, 1),
        vec![],
        vec![("componentPropAssignments", FigValue::Array(vec![variable]))],
    );
    let (texts, _) = convert_with(&[&c], &instance);
    assert_eq!(texts, ["From variable"]);
}

#[test]
fn outer_assignments_reach_one_nested_instance_without_leaking() {
    let c = component_c(vec![], Some(text_and_visibility_defs()));
    let o = component_o();
    let instance = placed(
        guid(3, 1),
        vec![override_entry(
            vec![guid(6, 2)],
            vec![(
                "componentPropAssignments",
                FigValue::Array(vec![assignment(
                    1,
                    obj(vec![("textValue", text("Second only"))]),
                )]),
            )],
        )],
        vec![],
    );
    let (texts, diagnostics) = convert_with(&[&c, &o], &instance);
    assert_eq!(texts, ["Default", "Second only"]);
    assert_eq!(diagnostics, 0);
}

#[test]
fn expanded_layers_carry_figma_rest_ids() {
    let c = component_c(vec![], None);
    let o = component_o();
    let instance = placed(guid(3, 1), vec![], vec![]);
    let mut ctx = fresh_ctx();
    ctx.symbol_tree.insert("1:1".into(), &c);
    ctx.symbol_tree.insert("3:1".into(), &o);
    let converted = convert_node(&instance, None, &mut ctx).unwrap();
    let mut ids = Vec::new();
    fn walk(value: &serde_json::Value, out: &mut Vec<String>) {
        if let Some(id) = value.get("figmaNodeId").and_then(|v| v.as_str()) {
            out.push(id.to_string());
        }
        if let Some(children) = value.get("children").and_then(|c| c.as_array()) {
            children.iter().for_each(|c| walk(c, out));
        }
    }
    walk(&serde_json::to_value(&converted).unwrap(), &mut ids);
    // Segments grow only at nested instances, keyed by `overrideKey`.
    assert_eq!(
        ids,
        [
            "4:1",
            "I4:1;6:1",
            "I4:1;6:1;8:2",
            "I4:1;6:2",
            "I4:1;6:2;8:2"
        ]
    );
}

fn convert_linked(
    symbols: &[&TreeNode],
    instance: &TreeNode,
) -> (PenNode, crate::linkage::Linkage) {
    let mut ctx = fresh_ctx();
    ctx.layout_mode = FigLayoutMode::Preserve;
    ctx.linkage = Some(crate::linkage::Linkage::default());
    for symbol in symbols {
        let key = symbol.figma.get("guid").and_then(guid_to_string).unwrap();
        ctx.symbol_tree.insert(key, symbol);
    }
    let node = convert_node(instance, None, &mut ctx).expect("instance converts");
    (node, ctx.linkage.take().unwrap())
}

#[test]
fn linked_instances_become_verified_refs_with_property_overrides() {
    let c = component_c(
        vec![icon_bound_to_visibility()],
        Some(text_and_visibility_defs()),
    );
    let instance = placed(
        guid(1, 1),
        vec![],
        vec![(
            "componentPropAssignments",
            FigValue::Array(vec![
                assignment(1, obj(vec![("textValue", text("Linked text"))])),
                assignment(2, obj(vec![("boolValue", FigValue::Bool(false))])),
            ]),
        )],
    );
    let (node, linkage) = convert_linked(&[&c], &instance);
    let PenNode::Ref(reference) = &node else {
        panic!("expected a ref, got {node:?}");
    };
    let descendants = reference.descendants.as_ref().expect("overrides recorded");
    let values: Vec<String> = descendants.values().map(|v| v.to_string()).collect();
    assert!(
        values.iter().any(|v| v.contains("Linked text")),
        "{values:?}"
    );
    assert!(
        values.iter().any(|v| v.contains("\"visible\":false")),
        "{values:?}"
    );
    let page = linkage.into_page().expect("components page");
    assert_eq!(page.children.len(), 1);
    assert_eq!(page.children[0].base().id, reference.target);
}

#[test]
fn linkage_is_off_unless_requested_and_nested_instances_stay_expanded() {
    let c = component_c(vec![], None);
    let o = component_o();
    let instance = placed(guid(3, 1), vec![], vec![]);
    let (node, linkage) = convert_linked(&[&c, &o], &instance);
    assert!(matches!(node, PenNode::Ref(_)), "page-level instance links");
    let page = linkage.into_page().unwrap();
    let json = serde_json::to_string(&page.children[0]).unwrap();
    assert!(
        !json.contains("\"ref\""),
        "component keeps nested instances expanded"
    );

    let mut ctx = fresh_ctx();
    ctx.symbol_tree.insert("1:1".into(), &c);
    let plain = convert_node(&placed(guid(1, 1), vec![], vec![]), None, &mut ctx).unwrap();
    assert!(
        !matches!(plain, PenNode::Ref(_)),
        "no linkage without opt-in"
    );
}

#[test]
fn a_ref_that_cannot_reproduce_the_instance_stays_expanded() {
    let component = PenNode::Frame(
        serde_json::from_value(serde_json::json!({
            "type": "frame", "id": "comp", "width": 10, "height": 10,
            "children": [{"type": "text", "id": "t", "content": "A", "figmaNodeId": "I1:1;8:2"}]
        }))
        .unwrap(),
    );
    // A layer the component does not have at the top level cannot be
    // expressed by `descendants`.
    let expanded = PenNode::Frame(
        serde_json::from_value(serde_json::json!({
            "type": "frame", "id": "inst", "width": 10, "height": 10,
            "children": [{"type": "text", "id": "x", "content": "B", "figmaNodeId": "I4:1;9:9"}]
        }))
        .unwrap(),
    );
    assert!(crate::linkage::build_ref(&component, &expanded).is_err());
}
