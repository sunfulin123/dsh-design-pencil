use jian_ops_schema::node::PenNode;
use op_editor_core::command_node_attrs::{
    effective_component_description, effective_node_a11y_label, effective_node_explain,
    effective_node_interaction_desc, enrich_subtree_explain,
};
use serde_json::json;

#[test]
fn inferred_list_metadata_and_saved_explanation_use_english() {
    let mut list: PenNode = serde_json::from_value(json!({
        "type": "frame", "id": "requests", "name": "Request list",
        "role": "list", "layout": "vertical", "children": []
    }))
    .unwrap();

    assert_eq!(
        effective_node_a11y_label(&list, false),
        "List container: Request list"
    );
    assert!(effective_node_interaction_desc(&list, false).starts_with("Browse the list"));
    assert!(effective_component_description(&list, false).starts_with("Request list:"));
    enrich_subtree_explain(&mut list, false);
    let saved = serde_json::to_value(&list).unwrap();
    let note = saved["explain"].as_str().unwrap();
    assert!(note.contains("Vertical flex layout"));
    assert_eq!(effective_node_explain(&list, false), note);
}

#[test]
fn existing_authored_metadata_is_preserved() {
    let mut node: PenNode = serde_json::from_value(json!({
        "type": "frame", "id": "requests", "name": "Request list",
        "explain": "Original design note.",
        "semantics": {"label": "Original label", "hint": "Original action", "aiDescription": "Original component"}
    }))
    .unwrap();

    enrich_subtree_explain(&mut node, false);
    assert_eq!(
        effective_node_explain(&node, false),
        "Original design note."
    );
    assert_eq!(effective_node_a11y_label(&node, false), "Original label");
    assert_eq!(
        effective_node_interaction_desc(&node, false),
        "Original action"
    );
    assert_eq!(
        effective_component_description(&node, false),
        "Original component"
    );
}
