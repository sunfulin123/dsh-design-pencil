//! Transaction regression tests for `U()` sizing updates in mixed programs.

use std::collections::BTreeMap;

use op_editor_core::{EditorCommand, NodeId};

use super::batch_design_snapshot;
use super::test_fixtures::sample;
use super::{McpTool, ToolOutcome};

#[test]
fn batch_program_transaction_applies_sizing_keywords() {
    let mut state = sample();
    let tool = batch_design_snapshot(&state);
    let mut args = BTreeMap::new();
    args.insert(
        "operations".into(),
        concat!(
            "U(\"n10\", {\"x\":48})\n",
            "U(\"n10\", {\"width\":\"fill_container\",\"height\":\"fit_content\"})"
        )
        .into(),
    );

    let ToolOutcome::OkJsonWithCommand(json, command) = tool.call(&args) else {
        panic!("successful transaction must emit a command");
    };
    let envelope: serde_json::Value = serde_json::from_str(&json).expect("result envelope");
    assert!(envelope.get("errors").is_none(), "{envelope}");
    let EditorCommand::Batch { commands } = &command else {
        panic!("two updates must remain one atomic batch, got {command:?}");
    };
    assert!(matches!(commands[0], EditorCommand::UpdateNode { .. }));
    assert!(matches!(commands[1], EditorCommand::PatchNodeData { .. }));

    assert!(state.apply(command), "complete transaction must apply");
    let node = op_editor_core::walkers::find_node(state.active_children(), &NodeId::new("n10"))
        .expect("updated frame");
    let value = serde_json::to_value(node).expect("updated node json");
    assert_eq!(value["x"].as_f64(), Some(48.0));
    assert_eq!(value["width"], "fill_container");
    assert_eq!(value["height"], "fit_content");
}

#[test]
fn batch_program_transaction_applies_token_only_fill_patch() {
    let mut state = sample();
    let tool = batch_design_snapshot(&state);
    let mut args = BTreeMap::new();
    args.insert(
        "operations".into(),
        concat!(
            "U(\"n10\", {\"x\":48})\n",
            "U(\"n10\", {\"fill\":[{\"type\":\"solid\",\"color\":\"$--primary\"}]})"
        )
        .into(),
    );

    let ToolOutcome::OkJsonWithCommand(json, command) = tool.call(&args) else {
        panic!("successful transaction must emit a command");
    };
    let envelope: serde_json::Value = serde_json::from_str(&json).expect("result envelope");
    assert!(envelope.get("errors").is_none(), "{envelope}");
    let EditorCommand::Batch { commands } = &command else {
        panic!("two updates must remain one atomic batch, got {command:?}");
    };
    assert!(matches!(commands[0], EditorCommand::UpdateNode { .. }));
    assert!(matches!(commands[1], EditorCommand::PatchNodeData { .. }));

    assert!(state.apply(command), "complete transaction must apply");
    let node = op_editor_core::walkers::find_node(state.active_children(), &NodeId::new("n10"))
        .expect("updated frame");
    let value = serde_json::to_value(node).expect("updated node json");
    assert_eq!(value["x"].as_f64(), Some(48.0));
    assert_eq!(value["fill"][0]["color"], "$--primary");
}

#[test]
fn batch_program_merges_ref_descendants_and_supports_inst_child_and_stroke_null() {
    let mut state = op_editor_core::EditorState::new();
    let tool = batch_design_snapshot(&state);
    let mut args = BTreeMap::new();
    args.insert(
        "operations".into(),
        concat!(
            "master=I(null, {\"type\":\"frame\",\"name\":\"Component/Msg\",\"reusable\":true,\"width\":360,\"height\":\"fit_content\",\"layout\":\"horizontal\",\"justifyContent\":\"space_between\",\"clipContent\":true,\"stroke\":{\"bottom\":1,\"color\":\"#E5E7EB\"},\"children\":[{\"id\":\"sender\",\"type\":\"text\",\"content\":\"Sender\"},{\"id\":\"body\",\"type\":\"text\",\"content\":\"Default\"},{\"id\":\"badge\",\"type\":\"frame\",\"width\":20,\"height\":20}]})\n",
            "s1=I(null, {\"type\":\"frame\",\"name\":\"Chat 1\",\"width\":1440,\"height\":900,\"layout\":\"vertical\"})\n",
            "s2=I(null, {\"type\":\"frame\",\"name\":\"Chat 2\",\"width\":1440,\"height\":900,\"layout\":\"vertical\"})\n",
            "s3=C(s1, null, {\"name\":\"Chat 3\"})\n",
            "inst=I(s1, {\"type\":\"ref\",\"ref\":\"master\",\"descendants\":{\"sender\":{\"content\":\"Ada\"},\"body\":{\"content\":\"Preserved message copy\"}}})\n",
            "U(inst, {\"descendants\":{\"badge\":{\"visible\":false,\"fill\":\"#EF4444\"}}})\n",
            "U(inst+\"__sender\", {\"content\":\"Ada Lovelace\"})\n",
            "U(master, {\"stroke\":null})"
        )
        .into(),
    );

    let (json, command) = match tool.call(&args) {
        ToolOutcome::OkJsonWithCommand(json, command) => (json, command),
        other => panic!("batch program must succeed, got {other:?}"),
    };
    let envelope: serde_json::Value = serde_json::from_str(&json).expect("envelope");
    assert!(envelope.get("errors").is_none(), "{envelope}");
    assert!(state.apply(command), "batch command must apply");

    let roots = state.active_children();
    let s1 = roots
        .iter()
        .find(|n| op_editor_core::PenNodeExt::base(*n).name.as_deref() == Some("Chat 1"))
        .expect("s1");
    let s2 = roots
        .iter()
        .find(|n| op_editor_core::PenNodeExt::base(*n).name.as_deref() == Some("Chat 2"))
        .expect("s2");
    let s3 = roots
        .iter()
        .find(|n| op_editor_core::PenNodeExt::base(*n).name.as_deref() == Some("Chat 3"))
        .expect("s3");
    assert_eq!(op_editor_core::PenNodeExt::base(s1).x, Some(0.0));
    assert_eq!(op_editor_core::PenNodeExt::base(s2).x, Some(1560.0));
    assert_eq!(op_editor_core::PenNodeExt::base(s3).x, Some(3120.0));

    let master = roots
        .iter()
        .find(|n| op_editor_core::PenNodeExt::base(*n).name.as_deref() == Some("Component/Msg"))
        .expect("master");
    let master_json = serde_json::to_value(master).expect("master json");
    assert!(
        master_json.get("stroke").is_none() || master_json["stroke"].is_null(),
        "stroke: null must clear stroke: {master_json}"
    );

    let expanded = op_editor_core::ref_resolve::resolve_refs_for_canvas(&state.doc);
    let expanded_json = serde_json::to_value(&expanded).expect("expanded json");
    let text_dump = expanded_json.to_string();
    assert!(
        text_dump.contains("Preserved message copy"),
        "existing descendants override must be preserved on U(inst, {{descendants}}): {text_dump}"
    );
    assert!(
        text_dump.contains("Ada Lovelace"),
        "U(inst__child) must update child override: {text_dump}"
    );
}
