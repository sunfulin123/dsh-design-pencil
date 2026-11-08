use super::property_panel_commit::{commit_property_focus, property_focus_initial};
use super::property_panel_components::{self as inspector, ComponentInspectorAction as A};
use super::property_panel_dispatch::{
    apply_instance_lifecycle_action_at, InstanceLifecycleOutcome,
};
use super::{PropertyPanel, PropertyPanelAction};
use crate::{Point2D, Rect};
use jian_ops_schema::node::PenNode;
use op_editor_core::{ComponentLibrary, EditorState, NodeId, PenNodeExt, PropertyFocus};
use serde_json::json;

fn state(id: &str) -> EditorState {
    let mut state = EditorState::sample();
    state.doc.pages = None;
    state.doc.children = serde_json::from_value(json!([
        {"type":"frame","id":"master","name":"Button","reusable":true,
         "children":[{"type":"text","id":"label","content":"Hello"},
            {"type":"frame","id":"content","children":[]}]},
        {"type":"ref","id":"instance","ref":"master"},
        {"type":"frame","id":"variant","children":[{"type":"text","id":"other-label","content":"Pressed"}]},
        {"type":"text","id":"child","content":"Slot content"}
    ])).unwrap();
    state.components = ComponentLibrary::from_document(&state.doc);
    select(&mut state, id);
    state
}

fn select(state: &mut EditorState, id: &str) {
    state.selection.anchor = NodeId::new(id);
    state.selection.set = vec![NodeId::new(id)];
}

fn input(state: &mut EditorState, index: usize, value: &str) {
    let panel = PropertyPanel::for_selection(state).unwrap();
    let bounds = panel
        .component_inspector_rect(Rect::xywh(0.0, 0.0, 280.0, 10000.0))
        .unwrap();
    let model = panel.component_inspector.as_ref().unwrap();
    let (_, rect) = inspector::inputs(model, panel.locale, bounds)
        .into_iter()
        .find(|(focus, _)| *focus == PropertyFocus::ComponentDesign(index))
        .expect("visible form field");
    let focus = panel
        .hit_test(
            Rect::xywh(0.0, 0.0, 280.0, 10000.0),
            rect.origin + Point2D::new(4.0, 4.0),
        )
        .unwrap();
    assert_eq!(focus, PropertyFocus::ComponentDesign(index));
    let _seed = property_focus_initial(focus, &panel);
    state.ui.property_focus = Some(focus);
    state.ui.property_input.set_text(value);
    assert!(commit_property_focus(state));
}

fn click(state: &mut EditorState, expected: A) {
    let panel = PropertyPanel::for_selection(state).unwrap();
    let rect = Rect::xywh(0.0, 0.0, 280.0, 10000.0);
    let bounds = panel.component_inspector_rect(rect).unwrap();
    let model = panel.component_inspector.as_ref().unwrap();
    let action = PropertyPanelAction::ComponentInspector(expected);
    let (_, hit) = inspector::actions(model, panel.locale, bounds)
        .into_iter()
        .find(|(candidate, _)| candidate == &action)
        .expect("visible form action");
    let actual = panel
        .hit_test_action(rect, hit.origin + Point2D::new(4.0, 4.0))
        .unwrap();
    assert_eq!(actual, action);
    assert!(matches!(
        apply_instance_lifecycle_action_at(state, &actual, 10_000),
        InstanceLifecycleOutcome::Handled { .. }
    ));
}

fn define_boolean(state: &mut EditorState) {
    click(state, A::PropertyKind);
    input(state, 0, "checked");
    input(state, 1, "label");
    input(state, 2, "false");
    click(state, A::SaveProperty);
    assert_eq!(state.ui.design_reject, None);
}

#[test]
fn component_inspector_property_click_input_dispatch_and_atomic_undo() {
    let mut state = state("master");
    let before = state.doc.clone();
    input(&mut state, 0, "Label");
    input(&mut state, 1, "label");
    input(&mut state, 2, "中文🙂");
    click(&mut state, A::SaveProperty);
    assert_eq!(state.ui.design_reject, None);
    let property = &state
        .selected_node()
        .unwrap()
        .base()
        .component_design
        .as_ref()
        .unwrap()
        .properties["Label"];
    assert_eq!(property.default, "中文🙂");
    click(&mut state, A::SaveProperty);
    click(&mut state, A::LoadProperty("Label".into()));
    assert_eq!(state.ui.component_inspector.values[2], "中文🙂");
    assert!(state.undo());
    assert_eq!(state.doc, before);
    assert!(!state.history.can_undo());
}

#[test]
fn component_inspector_instance_value_is_not_redirected_and_undo_preserves_master() {
    let mut state = state("master");
    define_boolean(&mut state);
    select(&mut state, "instance");
    let before = state.doc.clone();
    click(&mut state, A::LoadProperty("checked".into()));
    input(&mut state, 2, "true");
    click(&mut state, A::InstanceValue);
    assert_eq!(state.ui.design_reject, None);
    assert_eq!(
        state
            .selected_node()
            .unwrap()
            .base()
            .component_values
            .as_ref()
            .unwrap()["checked"],
        true
    );
    let master = state
        .doc
        .children
        .iter()
        .find(|node| node.id_str() == "master")
        .unwrap();
    assert_eq!(
        master.base().component_design.as_ref().unwrap().properties["checked"].default,
        false
    );
    assert!(state.undo());
    assert_eq!(state.doc, before);
    input(&mut state, 2, "true");
    click(&mut state, A::InstanceValue);
    click(&mut state, A::ResetInstanceValue);
    assert!(state
        .selected_node()
        .unwrap()
        .base()
        .component_values
        .as_ref()
        .unwrap()
        .is_empty());
    assert!(state.undo());
    assert_eq!(
        state
            .selected_node()
            .unwrap()
            .base()
            .component_values
            .as_ref()
            .unwrap()["checked"],
        true
    );
}

#[test]
fn component_inspector_slots_author_limits_fill_readback_and_reject_atomically() {
    let mut state = state("master");
    click(&mut state, A::Tab(1));
    input(&mut state, 3, "body");
    input(&mut state, 4, "content");
    input(&mut state, 5, "1");
    input(&mut state, 6, "1");
    click(&mut state, A::SaveSlot);
    assert_eq!(state.ui.design_reject, None);
    select(&mut state, "instance");
    click(&mut state, A::Tab(1));
    click(&mut state, A::LoadSlot("body".into()));
    let before = state.doc.clone();
    input(&mut state, 7, "");
    click(&mut state, A::FillSlot);
    assert!(state
        .ui
        .design_reject
        .as_deref()
        .unwrap()
        .contains("at least 1"));
    assert_eq!(state.doc, before);
    input(&mut state, 7, "child");
    click(&mut state, A::FillSlot);
    assert_eq!(state.ui.design_reject, None);
    let PenNode::Ref(reference) = state.selected_node().unwrap() else {
        panic!()
    };
    assert_eq!(
        reference.descendants.as_ref().unwrap()["content"]["children"][0]["id"],
        "child"
    );
    click(&mut state, A::LoadSlot("body".into()));
    assert_eq!(state.ui.component_inspector.values[7], "child");
    assert!(state.undo());
    assert_eq!(state.doc, before);
}

#[test]
fn component_inspector_rejects_slot_limit_changes_without_property_overrides() {
    let mut state = state("master");
    click(&mut state, A::Tab(1));
    input(&mut state, 3, "body");
    input(&mut state, 4, "content");
    input(&mut state, 5, "0");
    input(&mut state, 6, "1");
    click(&mut state, A::SaveSlot);
    assert_eq!(state.ui.design_reject, None);
    select(&mut state, "instance");
    click(&mut state, A::Tab(1));
    click(&mut state, A::LoadSlot("body".into()));
    input(&mut state, 7, "child");
    click(&mut state, A::FillSlot);
    assert_eq!(state.ui.design_reject, None);
    assert!(state
        .selected_node()
        .unwrap()
        .base()
        .component_values
        .is_none());
    select(&mut state, "master");
    click(&mut state, A::Tab(1));
    click(&mut state, A::LoadSlot("body".into()));
    input(&mut state, 6, "0");
    let before = state.doc.clone();
    click(&mut state, A::SaveSlot);
    assert!(state
        .ui
        .design_reject
        .as_deref()
        .is_some_and(|error| error.contains("at most 0")));
    assert_eq!(state.doc, before);
    assert!(state.undo());
    select(&mut state, "instance");
    let PenNode::Ref(reference) = state.selected_node().unwrap() else {
        panic!()
    };
    assert!(reference
        .descendants
        .as_ref()
        .is_none_or(|overrides| !overrides.contains_key("content")));
}

#[test]
fn component_inspector_variant_creation_and_swap_use_family_and_one_undo() {
    let mut state = state("master");
    click(&mut state, A::Tab(2));
    for (index, value) in [
        (8, "variant"),
        (9, "Pressed"),
        (10, "state"),
        (11, "pressed"),
    ] {
        input(&mut state, index, value);
    }
    let original = state.doc.clone();
    click(&mut state, A::CreateVariant);
    assert_eq!(state.ui.design_reject, None);
    select(&mut state, "instance");
    click(&mut state, A::Tab(2));
    let before = state.doc.clone();
    click(&mut state, A::SwapVariant("variant".into()));
    assert_eq!(state.ui.design_reject, None);
    let PenNode::Ref(reference) = state.selected_node().unwrap() else {
        panic!()
    };
    assert_eq!(reference.target, "variant");
    assert!(state.undo());
    assert_eq!(state.doc, before);
    assert!(state.undo());
    assert_eq!(state.doc, original);
}

#[test]
fn component_inspector_behaviour_configuration_readback_validation_and_undo() {
    let mut state = state("master");
    define_boolean(&mut state);
    click(&mut state, A::Tab(3));
    click(&mut state, A::BehaviourKind);
    input(&mut state, 12, "false");
    input(&mut state, 13, "checked");
    let before = state.doc.clone();
    click(&mut state, A::SaveBehaviour);
    assert_eq!(state.ui.design_reject, None);
    state.ui.component_inspector = Default::default();
    let panel = PropertyPanel::for_selection(&state).unwrap();
    let model = panel.component_inspector.unwrap();
    assert_eq!(model.draft.behaviour_kind, 1);
    assert_eq!(model.draft.values[13], "checked");
    let behaviour =
        op_editor_core::component_behaviour::definition(state.selected_node().unwrap()).unwrap();
    assert_eq!(
        behaviour.kind,
        jian_ops_schema::component::BehaviourKind::Switch
    );
    assert!(state.undo());
    assert_eq!(state.doc, before);
    click(&mut state, A::Tab(3));
    input(&mut state, 13, "missing");
    click(&mut state, A::SaveBehaviour);
    assert!(state
        .ui
        .design_reject
        .as_deref()
        .unwrap()
        .contains("unknown component property"));
    assert_eq!(state.doc, before);
}

#[test]
fn component_inspector_locked_target_and_wrong_property_type_surface_design_reject() {
    let mut state = state("master");
    input(&mut state, 0, "bad");
    input(&mut state, 1, "content");
    input(&mut state, 2, "text");
    let before = state.doc.clone();
    click(&mut state, A::SaveProperty);
    assert!(state
        .ui
        .design_reject
        .as_deref()
        .unwrap()
        .contains("text target"));
    assert_eq!(state.doc, before);
    state.doc.children[0].base_mut().locked = Some(true);
    input(&mut state, 1, "label");
    click(&mut state, A::SaveProperty);
    assert!(state
        .ui
        .design_reject
        .as_deref()
        .unwrap()
        .contains("locked"));
    assert!(!state.history.can_undo());
}

#[test]
fn component_inspector_scroll_bounds_and_hidden_sections_do_not_dispatch() {
    let state = state("master");
    let mut panel = PropertyPanel::for_selection(&state).unwrap();
    let rect = Rect::xywh(0.0, 0.0, 280.0, 400.0);
    let unscrolled = panel.component_inspector_rect(rect).unwrap();
    panel.scroll = unscrolled.origin.y + unscrolled.size.y - rect.size.y;
    let bounds = panel.component_inspector_rect(rect).unwrap();
    let model = panel.component_inspector.as_ref().unwrap();
    let (_, button) = inspector::actions(model, panel.locale, bounds)
        .into_iter()
        .find(|(action, _)| *action == PropertyPanelAction::ComponentInspector(A::SaveProperty))
        .unwrap();
    assert_eq!(
        panel.hit_test_action(rect, button.origin + Point2D::new(2.0, 2.0)),
        Some(PropertyPanelAction::ComponentInspector(A::SaveProperty))
    );
    panel.tab = op_editor_core::PropertyTab::Code;
    assert!(!matches!(
        panel.hit_test_action(rect, button.origin + Point2D::new(2.0, 2.0)),
        Some(PropertyPanelAction::ComponentInspector(_))
    ));
}

#[test]
fn component_inspector_target_choices_slot_sources_and_variant_frame_choices_seed_forms() {
    let mut state = state("master");
    click(&mut state, A::Target("label".into()));
    assert_eq!(state.ui.component_inspector.values[1], "label");
    click(&mut state, A::Tab(1));
    click(&mut state, A::Target("content".into()));
    assert_eq!(state.ui.component_inspector.values[4], "content");
    click(&mut state, A::Tab(2));
    click(&mut state, A::VariantFrame("variant".into()));
    assert_eq!(state.ui.component_inspector.values[8], "variant");
    assert_eq!(state.ui.component_inspector.values[9], "variant");
    click(&mut state, A::Tab(1));
    input(&mut state, 3, "body");
    input(&mut state, 5, "0");
    click(&mut state, A::SaveSlot);
    select(&mut state, "instance");
    click(&mut state, A::Tab(1));
    click(&mut state, A::LoadSlot("body".into()));
    click(&mut state, A::CopyChild("child".into()));
    assert_eq!(state.ui.component_inspector.values[7], "child");
    click(&mut state, A::CopyChild("child".into()));
    assert_eq!(state.ui.component_inspector.values[7], "");
    assert!(
        state.history.can_undo(),
        "only slot creation writes history"
    );
}

#[test]
fn component_inspector_behaviour_mapping_and_slider_readback_preserve_typed_contract() {
    let mut state = state("master");
    input(&mut state, 0, "caption");
    input(&mut state, 1, "label");
    input(&mut state, 2, "0");
    click(&mut state, A::SaveProperty);
    click(&mut state, A::Tab(3));
    input(&mut state, 12, "false");
    input(&mut state, 13, "caption:false=Idle|true=Active");
    click(&mut state, A::SaveBehaviour);
    assert_eq!(state.ui.design_reject, None);
    state.ui.component_inspector = Default::default();
    let model = PropertyPanel::for_selection(&state)
        .unwrap()
        .component_inspector
        .unwrap();
    assert_eq!(model.draft.values[13], "caption:false=Idle|true=Active");
    click(&mut state, A::Tab(3));
    for _ in 0..4 {
        click(&mut state, A::BehaviourKind);
    }
    for (index, value) in [
        (12, "25"),
        (13, "caption"),
        (15, "0"),
        (16, "100"),
        (17, "5"),
    ] {
        input(&mut state, index, value);
    }
    click(&mut state, A::SaveBehaviour);
    assert_eq!(state.ui.design_reject, None);
    let behaviour =
        op_editor_core::component_behaviour::definition(state.selected_node().unwrap()).unwrap();
    assert_eq!(behaviour.default_value, 25.0);
    assert_eq!(behaviour.step, Some(5.0));
    state.ui.component_inspector = Default::default();
    let model = PropertyPanel::for_selection(&state)
        .unwrap()
        .component_inspector
        .unwrap();
    assert_eq!(model.draft.behaviour_kind, 4);
    assert_eq!(model.draft.values[12], "25.0");
    assert_eq!(model.draft.values[17], "5");
}
#[test]
fn component_inspector_platform_free_paint_exposes_actions_and_current_definitions() {
    use super::property_panel_test_support::CountingBackend;
    use super::{PaintCx, Widget};
    let mut state = state("master");
    state.editor_ui.locale = op_editor_core::Locale::EnUs;
    define_boolean(&mut state);
    for (tab, text) in [
        (0, "checked"),
        (1, "Save slot"),
        (2, "Create variant"),
        (3, "Save Behaviour"),
    ] {
        click(&mut state, A::Tab(tab));
        let panel = PropertyPanel::for_selection(&state).unwrap();
        let mut backend = CountingBackend::default();
        panel.paint(
            &mut PaintCx {
                backend: &mut backend,
            },
            Rect::xywh(0.0, 0.0, 280.0, 10000.0),
        );
        assert!(
            backend.texts.iter().any(|label| label.contains(text)),
            "component tab {tab} must paint {text}"
        );
        assert!(backend
            .texts
            .iter()
            .any(|label| label.contains("Component authoring")));
    }
}

#[test]
fn component_inspector_rejects_recursive_slot_copy_and_incompatible_live_property_values() {
    let mut state = state("master");
    define_boolean(&mut state);
    select(&mut state, "instance");
    click(&mut state, A::LoadProperty("checked".into()));
    input(&mut state, 2, "true");
    click(&mut state, A::InstanceValue);
    select(&mut state, "master");
    click(&mut state, A::LoadProperty("checked".into()));
    // Boolean -> instance swap -> text must not invalidate an existing boolean value.
    click(&mut state, A::PropertyKind);
    click(&mut state, A::PropertyKind);
    input(&mut state, 2, "text");
    let before = state.doc.clone();
    click(&mut state, A::SaveProperty);
    assert!(state
        .ui
        .design_reject
        .as_deref()
        .unwrap()
        .contains("invalid component property value"));
    assert_eq!(state.doc, before);
    click(&mut state, A::Tab(1));
    input(&mut state, 3, "body");
    input(&mut state, 4, "content");
    input(&mut state, 5, "0");
    click(&mut state, A::SaveSlot);
    select(&mut state, "instance");
    click(&mut state, A::Tab(1));
    click(&mut state, A::LoadSlot("body".into()));
    input(&mut state, 7, "instance");
    let before = state.doc.clone();
    click(&mut state, A::FillSlot);
    assert!(state.ui.design_reject.as_deref().unwrap().contains("owner"));
    assert_eq!(state.doc, before);
}

#[test]
fn component_inspector_variant_behaviour_readback_and_locked_ancestor_guards() {
    let mut state = state("master");
    click(&mut state, A::Tab(2));
    for (index, value) in [
        (8, "variant"),
        (9, "Pressed"),
        (10, "state"),
        (11, "pressed"),
    ] {
        input(&mut state, index, value);
    }
    click(&mut state, A::CreateVariant);
    click(&mut state, A::Tab(3));
    input(&mut state, 12, "false");
    input(&mut state, 13, "false->master, true->variant");
    click(&mut state, A::SaveBehaviour);
    assert_eq!(state.ui.design_reject, None);
    state.ui.component_inspector = Default::default();
    let model = PropertyPanel::for_selection(&state)
        .unwrap()
        .component_inspector
        .unwrap();
    assert_eq!(model.draft.values[13], "false->master, true->variant");
    let master = state.doc.children.remove(0);
    let parent: PenNode = serde_json::from_value(json!({
        "type":"frame","id":"locked-parent","locked":true,"children":[master]
    }))
    .unwrap();
    state.doc.children.insert(0, parent);
    state.components = ComponentLibrary::from_document(&state.doc);
    let before = state.doc.clone();
    click(&mut state, A::Tab(3));
    click(&mut state, A::RemoveBehaviour);
    assert!(state
        .ui
        .design_reject
        .as_deref()
        .unwrap()
        .contains("locked"));
    let toast = state.editor_ui.editor_toast.as_ref().unwrap();
    assert_eq!(toast.shown_at_ms, 10_000);
    assert!(toast.is_visible(10_001));
    assert_eq!(state.doc, before);
}

#[test]
fn component_inspector_preserves_export_popover_dispatch_and_hover() {
    let state = state("master");
    let mut panel = PropertyPanel::for_selection(&state).unwrap();
    panel.export_format_picker_open = true;
    let rect = Rect::xywh(0.0, 0.0, 280.0, 10000.0);
    let actions = panel.body_action_rects(rect);
    let mut options = 0;
    for (action, hit) in &actions {
        if !matches!(action, PropertyPanelAction::SetExportFormat(_)) {
            continue;
        }
        let point = hit.origin + hit.size / 2.0;
        options += 1;
        assert_eq!(panel.hit_test_action(rect, point), Some(action.clone()));
        let hover = panel.action_hover_index(rect, point).unwrap();
        assert_eq!(&actions[hover].0, action);
    }
    assert_eq!(options, 4);
}
