//! MCP authoring of typed component behaviour.
//!
//! `get_component_behaviour({componentId})` returns the persisted contract and
//! an `executable` flag (legacy string labels are readable but not executable).
//! `set_component_behaviour({componentId, behaviour})` accepts an object or null
//! and returns one `PatchNodeData` command; the host's normal command transaction
//! supplies undo/redo and persistence. Raw string arguments are not JSON-quoted.
//!
//! Example `behaviour` object:
//! ```json
//! {
//!   "kind": "switch",
//!   "defaultValue": false,
//!   "stateBindings": [{"type":"property","propertyId":"checked"}]
//! }
//! ```
//! `propertyId` is a key in `componentDesign.properties`, not a guessed label or
//! a node name. Boolean properties drive visibility; text properties drive real
//! text content. Optional `values` maps state keys to typed property values.
//! Variant bindings use `{type:"variant",variantId:"actual-master-id",value:true}`
//! and must cover the entire boolean/tab state domain within one variant family.
//! Tabs require distinct `{value,label}` options; sliders accept finite min/max/
//! positive step (defaults 0/100/1). Button's boolean cell is momentary pressed
//! state, not a toggle; pointer release/cancel restores its rest appearance.
//!
//! Preview lowers these contracts into the existing native input widgets and
//! runtime state/binding overlay. HTML/HTML-CSS and React/Tailwind-JSX export
//! actual state handlers and ARIA, not data-only metadata. Interactive instance
//! swaps and behaviour nested inside another behaviour owner are not supported.

use std::collections::BTreeMap;

use jian_ops_schema::component::{BehaviourDefinition, ComponentBehaviour, ComponentDesign};
use jian_ops_schema::{node::PenNode, PenDocument};
use op_editor_core::component_behaviour::{document_nodes, validate_component_behaviour};
use op_editor_core::{EditorCommand, EditorState, NodeId, PenNodeExt};
use serde_json::{json, Value};

use crate::{McpTool, ToolErrorCode, ToolOutcome};

pub struct ComponentBehaviourTool {
    name: &'static str,
    document: PenDocument,
    editable: BTreeMap<String, (bool, Option<String>)>,
}

pub fn component_behaviour_snapshot(
    state: &EditorState,
    name: &'static str,
) -> ComponentBehaviourTool {
    fn walk(
        nodes: &[PenNode],
        parent_editable: bool,
        page: Option<&str>,
        out: &mut BTreeMap<String, (bool, Option<String>)>,
    ) {
        for node in nodes {
            let editable = parent_editable
                && node.base().visible != Some(false)
                && node.base().locked != Some(true);
            out.insert(
                node.id_str().to_owned(),
                (editable, page.map(str::to_owned)),
            );
            if let Some(children) = node.children() {
                walk(children, editable, page, out);
            }
        }
    }
    let mut editable = BTreeMap::new();
    walk(&state.doc.children, true, None, &mut editable);
    for page in state.doc.pages.iter().flatten() {
        walk(&page.children, true, Some(&page.id), &mut editable);
    }
    ComponentBehaviourTool {
        name,
        document: state.doc.clone(),
        editable,
    }
}

impl McpTool for ComponentBehaviourTool {
    fn name(&self) -> &str {
        self.name
    }

    fn call(&self, args: &BTreeMap<String, String>) -> ToolOutcome {
        let Some(id) = args.get("componentId").filter(|s| !s.trim().is_empty()) else {
            return ToolOutcome::Err(
                ToolErrorCode::MissingArgument,
                "componentId is required".into(),
            );
        };
        let nodes = document_nodes(&self.document);
        let Some(node) = nodes.get(id) else {
            return ToolOutcome::Err(
                ToolErrorCode::InvalidArgument,
                format!("component {id} not found"),
            );
        };
        if !matches!(node, PenNode::Frame(frame) if frame.reusable == Some(true)) {
            return ToolOutcome::Err(
                ToolErrorCode::InvalidArgument,
                "componentId must identify a reusable frame".into(),
            );
        }
        let mut design = node.base().component_design.clone().unwrap_or_default();
        if self.name == "get_component_behaviour" {
            let validation_error = match &design.behaviour {
                Some(ComponentBehaviour::Typed(behaviour)) => {
                    validate_component_behaviour(&self.document, id, behaviour)
                        .err()
                        .map(|error| error.to_string())
                }
                _ => None,
            };
            return ToolOutcome::OkJson(
                json!({
                    "componentId":id, "behaviour":design.behaviour,
                    "executable":matches!(design.behaviour, Some(ComponentBehaviour::Typed(_)))
                        && validation_error.is_none(),
                    "validationError":validation_error
                })
                .to_string(),
            );
        }
        if self.name != "set_component_behaviour" {
            return ToolOutcome::Err(
                ToolErrorCode::InvalidArgument,
                "unknown behaviour operation".into(),
            );
        }
        let Some(source) = args.get("behaviour") else {
            return ToolOutcome::Err(
                ToolErrorCode::MissingArgument,
                "behaviour object or null is required".into(),
            );
        };
        let definition: Option<BehaviourDefinition> = match serde_json::from_str(source) {
            Ok(value) => value,
            Err(error) => {
                return ToolOutcome::Err(
                    ToolErrorCode::InvalidArgument,
                    format!("invalid typed behaviour: {error}"),
                )
            }
        };
        if let Some(behaviour) = &definition {
            let mut candidate = self.document.clone();
            // A new component need not already have componentDesign metadata.
            if node.base().component_design.is_none() {
                fn install(nodes: &mut [PenNode], id: &str) {
                    for node in nodes {
                        if node.id_str() == id {
                            node.base_mut().component_design = Some(ComponentDesign::default());
                        }
                        if let Some(children) = node.children_mut() {
                            install(children, id);
                        }
                    }
                }
                install(&mut candidate.children, id);
                for page in candidate.pages.iter_mut().flatten() {
                    install(&mut page.children, id);
                }
            }
            if let Err(error) = validate_component_behaviour(&candidate, id, behaviour) {
                return ToolOutcome::Err(ToolErrorCode::InvalidArgument, error.to_string());
            }
        }
        let (editable, page_id) = &self.editable[id];
        if !editable {
            return ToolOutcome::Err(
                ToolErrorCode::InvalidArgument,
                "component is hidden, locked or inside a locked ancestor".into(),
            );
        }
        design.behaviour = definition.map(ComponentBehaviour::Typed);
        let patch = json!({"componentDesign":design});
        ToolOutcome::OkJsonWithCommand(
            json!({"componentId":id,"behaviour":patch["componentDesign"]["behaviour"]}).to_string(),
            EditorCommand::PatchNodeData {
                node_id: NodeId::new(id),
                page_id: page_id.clone(),
                patch_json: patch.to_string(),
            },
        )
    }
}

/// Shared discoverable JSON contract. Unsupported kinds cannot be advertised.
pub fn behaviour_input_schema() -> Value {
    json!({
        "type":["object","null"], "additionalProperties":false,
        "properties":{
            "kind":{"type":"string","enum":["button","switch","checkbox","tabs","slider"]},
            "defaultValue":{"type":["boolean","string","number"]},
            "disabled":{"type":"boolean"},
            "min":{"type":"number"},"max":{"type":"number"},"step":{"type":"number","exclusiveMinimum":0},
            "options":{"type":"array","items":{"type":"object","additionalProperties":false,
                "properties":{"value":{"type":"string"},"label":{"type":"string"}},
                "required":["value","label"]}},
            "stateBindings":{"type":"array","minItems":1,"items":{"oneOf":[
                {"type":"object","additionalProperties":false,
                    "properties":{"type":{"const":"property"},"propertyId":{"type":"string"},
                        "values":{"type":"object","additionalProperties":true}},
                    "required":["type","propertyId"]},
                {"type":"object","additionalProperties":false,
                    "properties":{"type":{"const":"variant"},"variantId":{"type":"string"},
                        "value":{"type":["boolean","string"]}},
                    "required":["type","variantId","value"]}
            ]}}
        },
        "required":["kind","defaultValue","stateBindings"]
    })
}
