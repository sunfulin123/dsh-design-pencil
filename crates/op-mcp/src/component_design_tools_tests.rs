use std::collections::BTreeMap;

use super::{component_design_tools::component_design_snapshot, McpTool, ToolOutcome};
use op_editor_core::EditorState;
use serde_json::{json, Value};

fn state() -> EditorState {
    let mut state = EditorState::new();
    state.doc = serde_json::from_value(json!({"version":"0.8.5","children":[
        {"type":"frame","id":"master","reusable":true,"children":[
            {"type":"text","id":"label","content":"Default"},
            {"type":"frame","id":"body","children":[]},
            {"type":"frame","id":"other","children":[]}],
         "componentDesign":{"properties":{
            "Label":{"kind":"text","targetId":"label","default":"Default"},
            "Visible":{"kind":"boolean","targetId":"label","default":true}},
            "slots":{"Body":{"targetId":"body","min":0,"max":2}}}},
        {"type":"ref","id":"instance","ref":"master",
         "componentValues":{"Label":"Custom","Visible":false},
         "descendants":{"body":{"children":[{"type":"rectangle","id":"fill"}]}}},
        {"type":"ref","id":"unvalued","ref":"master",
         "descendants":{"body":{"children":[
            {"type":"rectangle","id":"first"},{"type":"rectangle","id":"second"}]}}}
    ]}))
    .unwrap();
    state
}

fn call(state: &EditorState, name: &'static str, args: Value) -> ToolOutcome {
    let args: BTreeMap<_, _> = args
        .as_object()
        .unwrap()
        .iter()
        .map(|(key, value)| {
            (
                key.clone(),
                value
                    .as_str()
                    .map(str::to_owned)
                    .unwrap_or_else(|| value.to_string()),
            )
        })
        .collect();
    component_design_snapshot(state, name).call(&args)
}

fn apply(state: &mut EditorState, name: &'static str, args: Value) {
    match call(state, name, args) {
        ToolOutcome::OkJsonWithCommand(_, command) => assert!(state.apply(command)),
        other => panic!("expected successful {name}, got {other:?}"),
    }
}

#[test]
fn component_slot_update_and_delete_are_selection_independent_and_undoable() {
    let mut state = state();
    let before = state.doc.clone();
    apply(
        &mut state,
        "update_slot",
        json!({
            "componentId":"master","name":"Body","targetId":"other","min":0,"max":3
        }),
    );
    assert_eq!(
        json!(state.doc)["children"][0]["componentDesign"]["slots"]["Body"],
        json!({"targetId":"other","min":0,"max":3})
    );
    assert_eq!(state.selection_count(), 0);
    assert!(state.apply(op_editor_core::EditorCommand::Undo));
    assert_eq!(state.doc, before);
    apply(
        &mut state,
        "delete_slot",
        json!({"componentId":"master","name":"Body"}),
    );
    let document = json!(state.doc);
    assert!(document["children"][0]["componentDesign"]
        .get("slots")
        .is_none());
    assert_eq!(
        document["children"][1]["descendants"],
        json!(before)["children"][1]["descendants"]
    );
}

#[test]
fn component_slot_contracts_validate_every_instance_without_component_values() {
    let state = state();
    for (name, args) in [
        (
            "update_slot",
            json!({"componentId":"master","name":"Body","targetId":"body","max":1}),
        ),
        (
            "create_slot",
            json!({"componentId":"master","name":"Restricted","targetId":"body","max":1}),
        ),
    ] {
        let before = state.doc.clone();
        let outcome = call(&state, name, args);
        assert!(
            matches!(outcome, ToolOutcome::Err(_, _)),
            "{name}: {outcome:?}"
        );
        assert_eq!(state.doc, before);
    }
}

#[test]
fn component_slot_invalid_arguments_never_emit_mutations() {
    let state = state();
    for name in ["create_slot", "update_slot"] {
        let slot_name = if name == "create_slot" { "New" } else { "Body" };
        for invalid in [
            json!({"min":-1}),
            json!({"max":1.5}),
            json!({"max":true}),
            json!({"min":3,"max":2}),
            json!({"targetId":"label"}),
            json!({"targetId":"master"}),
            json!({"targetId":"missing"}),
        ] {
            let mut args = json!({"componentId":"master","name":slot_name,"targetId":"body"});
            args.as_object_mut()
                .unwrap()
                .extend(invalid.as_object().unwrap().clone());
            let outcome = call(&state, name, args);
            assert!(
                matches!(outcome, ToolOutcome::Err(_, _)),
                "{name}: {outcome:?}"
            );
        }
    }
    for (name, args) in [
        (
            "create_slot",
            json!({"componentId":"master","name":"Body","targetId":"body"}),
        ),
        (
            "update_slot",
            json!({"componentId":"master","name":"Unknown","targetId":"body"}),
        ),
        (
            "delete_slot",
            json!({"componentId":"master","name":"Unknown"}),
        ),
    ] {
        assert!(matches!(call(&state, name, args), ToolOutcome::Err(_, _)));
    }
}

#[test]
fn component_instance_reset_preserves_other_overrides_and_can_reset_all() {
    let mut state = state();
    let before = json!(state.doc);
    apply(
        &mut state,
        "reset_instance_properties",
        json!({"instanceId":"instance","properties":["Label"]}),
    );
    assert_eq!(
        json!(state.doc)["children"][1]["componentValues"],
        json!({"Visible":false})
    );
    assert_eq!(
        json!(state.doc)["children"][1]["descendants"],
        before["children"][1]["descendants"]
    );
    apply(
        &mut state,
        "reset_instance_properties",
        json!({"instanceId":"instance"}),
    );
    assert!(json!(state.doc)["children"][1]
        .get("componentValues")
        .is_none());
    assert_eq!(state.selection_count(), 0);
}

#[test]
fn component_instance_reset_rejects_bad_names_and_types_atomically() {
    let state = state();
    for args in [
        json!({"instanceId":"master"}),
        json!({"instanceId":"missing"}),
        json!({"instanceId":"instance","properties":["Label","Unknown"]}),
        json!({"instanceId":"instance","properties":[true]}),
        json!({"instanceId":"instance","properties":null}),
        json!({"instanceId":"instance","properties":"Label"}),
        json!({"instanceId":"instance","unexpected":true}),
    ] {
        assert!(matches!(
            call(&state, "reset_instance_properties", args),
            ToolOutcome::Err(_, _)
        ));
    }
}

#[test]
fn component_inspector_noops_succeed_without_a_command_or_history_entry() {
    let state = state();
    for (name, args) in [
        (
            "reset_instance_properties",
            json!({"instanceId":"instance","properties":[]}),
        ),
        (
            "reset_instance_properties",
            json!({"instanceId":"unvalued"}),
        ),
        (
            "update_slot",
            json!({"componentId":"master","name":"Body","targetId":"body","max":2}),
        ),
    ] {
        let outcome = call(&state, name, args);
        assert!(
            matches!(outcome, ToolOutcome::OkJson(_)),
            "{name}: {outcome:?}"
        );
    }
}

#[test]
fn component_inspector_mutations_reject_locked_ancestors_on_other_pages() {
    let mut state = state();
    let children = std::mem::take(&mut state.doc.children);
    state.doc.pages = Some(
        serde_json::from_value(json!([{
            "id":"other-page","name":"Other",
            "children":[{"type":"frame","id":"locked","locked":true,"children":children}]
        }]))
        .unwrap(),
    );
    state.set_single_selection(op_editor_core::NodeId::new("locked"));
    let before = state.doc.clone();
    for (name, args) in [
        (
            "update_slot",
            json!({"componentId":"master","name":"Body","targetId":"other"}),
        ),
        ("delete_slot", json!({"componentId":"master","name":"Body"})),
        (
            "reset_instance_properties",
            json!({"instanceId":"instance"}),
        ),
    ] {
        let outcome = call(&state, name, args);
        assert!(
            matches!(outcome, ToolOutcome::Err(_, _)),
            "{name}: {outcome:?}"
        );
        assert_eq!(state.doc, before);
    }
}
