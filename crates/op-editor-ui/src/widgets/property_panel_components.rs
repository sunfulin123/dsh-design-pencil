//! Component authoring, using the same form rows and input lifecycle as the inspector.
//!
//! The Properties / Slots / Variants / Behaviour tabs appear for an authored
//! reusable frame or Ref. Click a definition to load its persisted values, then
//! Apply; instance properties also support Reset. Slots copy selected authored
//! nodes into the instance override, without moving or modifying those sources.
//! Variant creation registers an existing frame; instance variant rows swap
//! within the same family. All writes are validated before an atomic undo entry.
//!
//! Behaviour bindings accept comma-separated property IDs (identity), explicit
//! `property:state=value|state=value` mappings, or `state->variantId` entries.
//! Tabs use `value=label` options. Limits, defaults and bindings remain typed;
//! the existing core Behaviour validator reports unsupported combinations.
use super::property_panel_inputs::{
    paint_input_with_prefix_focused_state, paint_section_label, PAD_X,
};
use super::property_panel_sections::EditContext;
use super::{PaintCx, PropertyPanelAction};
use crate::{theme::Theme, Point2D, Rect, TextLayout};
use jian_ops_schema::component::{ComponentDesign, ComponentPropertyKind};
use op_editor_core::component_inspector_draft::ComponentInspectorDraft;
use op_editor_core::{EditorState, Locale, NodeId, PenNodeExt, PropertyFocus};

#[path = "property_panel_components_ops.rs"]
mod ops;
pub(crate) use ops::dispatch;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ComponentInspectorAction {
    Tab(usize),
    PropertyKind,
    BehaviourKind,
    Disabled,
    LoadProperty(String),
    LoadSlot(String),
    SaveProperty,
    DeleteProperty,
    InstanceValue,
    SaveSlot,
    DeleteSlot,
    FillSlot,
    CreateVariant,
    SwapVariant(String),
    SaveBehaviour,
    RemoveBehaviour,
    Target(String),
    CopyChild(String),
    VariantFrame(String),
    ResetInstanceValue,
}

impl ComponentInspectorAction {
    pub fn mutates_document(&self) -> bool {
        !matches!(
            self,
            Self::Tab(_)
                | Self::PropertyKind
                | Self::BehaviourKind
                | Self::Disabled
                | Self::LoadProperty(_)
                | Self::LoadSlot(_)
        ) && !matches!(
            self,
            Self::Target(_) | Self::CopyChild(_) | Self::VariantFrame(_)
        )
    }
}

#[derive(Debug, Clone)]
pub struct ComponentInspector {
    pub draft: ComponentInspectorDraft,
    pub design: ComponentDesign,
    pub instance: bool,
    pub master_id: String,
    pub variants: Vec<(String, String)>,
    pub error: Option<String>,
    pub targets: Vec<(String, String, usize)>,
    pub copy_sources: Vec<(String, String)>,
    pub frames: Vec<(String, String)>,
}

impl ComponentInspector {
    pub fn for_state(state: &EditorState) -> Option<Self> {
        if state.selection_count() != 1 || !state.selection.anchor.is_real() {
            return None;
        }
        let selected = state.selected_node()?;
        let (master, instance) = match selected {
            jian_ops_schema::node::PenNode::Ref(reference) => (
                state
                    .components
                    .resolved_root(&state.doc, &NodeId::new(&reference.target))?,
                true,
            ),
            jian_ops_schema::node::PenNode::Frame(frame) if frame.reusable == Some(true) => {
                (selected, false)
            }
            _ => return None,
        };
        let design = master.base().component_design.clone().unwrap_or_default();
        let family = design.variant_of.as_deref().unwrap_or(master.id_str());
        let variants = op_editor_core::component_behaviour::document_nodes(&state.doc)
            .values()
            .filter(|node| {
                node.id_str() == family
                    || node
                        .base()
                        .component_design
                        .as_ref()
                        .is_some_and(|design| design.variant_of.as_deref() == Some(family))
            })
            .map(|node| {
                let values = node
                    .base()
                    .component_design
                    .as_ref()
                    .map(|design| {
                        design
                            .variant_values
                            .iter()
                            .map(|(axis, value)| format!("{axis}={value}"))
                            .collect::<Vec<_>>()
                            .join(", ")
                    })
                    .unwrap_or_default();
                (
                    node.id_str().into(),
                    format!(
                        "{} · {}",
                        node.base().name.as_deref().unwrap_or(node.id_str()),
                        values
                    ),
                )
            })
            .collect();
        fn targets(node: &jian_ops_schema::node::PenNode, out: &mut Vec<(String, String, usize)>) {
            let kind = match node {
                jian_ops_schema::node::PenNode::Text(_) => 0,
                jian_ops_schema::node::PenNode::Ref(_) => 2,
                _ if node.children().is_some() => 3,
                _ => 1,
            };
            out.push((
                node.id_str().into(),
                node.base()
                    .name
                    .clone()
                    .unwrap_or_else(|| node.id_str().into()),
                kind,
            ));
            for child in node.children().into_iter().flatten() {
                targets(child, out);
            }
        }
        let mut target_options = Vec::new();
        targets(master, &mut target_options);
        let roots: Vec<_> = state
            .doc
            .children
            .iter()
            .chain(
                state
                    .doc
                    .pages
                    .iter()
                    .flatten()
                    .flat_map(|page| page.children.iter()),
            )
            .filter(|node| node.id_str() != selected.id_str() && node.id_str() != master.id_str())
            .collect();
        let label = |node: &&jian_ops_schema::node::PenNode| {
            (
                node.id_str().to_owned(),
                node.base()
                    .name
                    .clone()
                    .unwrap_or_else(|| node.id_str().into()),
            )
        };
        let frames = roots
            .iter()
            .filter(|node| matches!(node, jian_ops_schema::node::PenNode::Frame(_)))
            .map(label)
            .collect();
        let copy_sources = roots.iter().map(label).collect();
        Some(Self {
            draft: ComponentInspectorDraft::for_state(state),
            design,
            instance,
            master_id: master.id_str().into(),
            variants,
            error: state.ui.design_reject.clone(),
            targets: target_options,
            copy_sources,
            frames,
        })
    }
}

#[derive(Clone)]
enum Row {
    Label(String),
    Input(usize, &'static str),
    Button(ComponentInspectorAction, String),
}

fn rows(model: &ComponentInspector, locale: Locale) -> Vec<Row> {
    use ComponentInspectorAction as A;
    let t = |key| op_i18n::translate(locale, key).to_owned();
    let button = |action, key| Row::Button(action, t(key));
    let mut rows = vec![Row::Label(format!(
        "{} · {}",
        t("componentInspector.title"),
        model.master_id
    ))];
    for (i, key) in [
        "componentInspector.properties",
        "componentInspector.slots",
        "componentInspector.variants",
        "componentInspector.behaviour",
    ]
    .into_iter()
    .enumerate()
    {
        rows.push(Row::Button(
            A::Tab(i),
            format!(
                "{} {}",
                if model.draft.tab == i { "●" } else { "○" },
                t(key)
            ),
        ));
    }
    match model.draft.tab {
        0 => {
            for (name, property) in &model.design.properties {
                rows.push(Row::Button(
                    A::LoadProperty(name.clone()),
                    format!(
                        "{name} · {} → {}",
                        kind_name(property.kind.clone(), locale),
                        property.target_id
                    ),
                ));
            }
            rows.push(Row::Input(0, "componentInspector.name"));
            if !model.instance {
                rows.push(Row::Button(
                    A::PropertyKind,
                    kind_name(property_kind(model.draft.property_kind), locale).into(),
                ));
                rows.push(Row::Input(1, "componentInspector.target"));
                for (id, label, kind) in &model.targets {
                    if model.draft.property_kind == 1 || *kind == model.draft.property_kind {
                        rows.push(Row::Button(
                            A::Target(id.clone()),
                            format!("↳ {label} · {id}"),
                        ));
                    }
                }
            }
            rows.push(Row::Input(
                2,
                if model.instance {
                    "componentInspector.value"
                } else {
                    "componentInspector.default"
                },
            ));
            rows.push(button(
                if model.instance {
                    A::InstanceValue
                } else {
                    A::SaveProperty
                },
                "componentInspector.applyProperty",
            ));
            if model.instance {
                rows.push(button(
                    A::ResetInstanceValue,
                    "componentInspector.resetValue",
                ));
            }
            if !model.instance {
                rows.push(button(
                    A::DeleteProperty,
                    "componentInspector.deleteProperty",
                ));
            }
        }
        1 => {
            for (name, slot) in &model.design.slots {
                rows.push(Row::Button(
                    A::LoadSlot(name.clone()),
                    format!(
                        "{name} → {} · {}…{}",
                        slot.target_id,
                        slot.min,
                        slot.max.map(|n| n.to_string()).unwrap_or("∞".into())
                    ),
                ));
            }
            rows.push(Row::Input(3, "componentInspector.slotName"));
            if model.instance {
                rows.push(Row::Label(t("componentInspector.childrenHint")));
                rows.push(Row::Input(7, "componentInspector.children"));
                for (id, label) in &model.copy_sources {
                    rows.push(Row::Button(
                        A::CopyChild(id.clone()),
                        format!("+ {label} · {id}"),
                    ));
                }
                rows.push(button(A::FillSlot, "componentInspector.fillSlot"));
            } else {
                rows.push(Row::Input(4, "componentInspector.target"));
                for (id, label, kind) in &model.targets {
                    if *kind == 3 && id != &model.master_id {
                        rows.push(Row::Button(
                            A::Target(id.clone()),
                            format!("↳ {label} · {id}"),
                        ));
                    }
                }
                rows.extend([
                    Row::Input(5, "componentInspector.minimum"),
                    Row::Input(6, "componentInspector.maximum"),
                    button(A::SaveSlot, "componentInspector.saveSlot"),
                    button(A::DeleteSlot, "componentInspector.deleteSlot"),
                ]);
            }
        }
        2 => {
            for (id, label) in &model.variants {
                rows.push(if model.instance {
                    Row::Button(A::SwapVariant(id.clone()), label.clone())
                } else {
                    Row::Label(label.clone())
                });
            }
            if !model.instance {
                rows.extend([
                    Row::Label(t("componentInspector.variantHint")),
                    Row::Input(8, "componentInspector.frame"),
                    Row::Input(9, "componentInspector.name"),
                    Row::Input(10, "componentInspector.axis"),
                    Row::Input(11, "componentInspector.value"),
                    button(A::CreateVariant, "componentInspector.createVariant"),
                ]);
                for (id, label) in &model.frames {
                    rows.push(Row::Button(
                        A::VariantFrame(id.clone()),
                        format!("↳ {label} · {id}"),
                    ));
                }
            }
        }
        _ => {
            if let Some(behaviour) = &model.design.behaviour {
                rows.push(Row::Label(match behaviour {
                    jian_ops_schema::component::ComponentBehaviour::Typed(b) => format!(
                        "{:?} · {} · {} {}",
                        b.kind,
                        b.default_value,
                        b.state_bindings.len(),
                        t("componentInspector.bindings")
                    ),
                    jian_ops_schema::component::ComponentBehaviour::Legacy(label) => {
                        format!("{}: {label}", t("componentInspector.legacy"))
                    }
                }));
                if let jian_ops_schema::component::ComponentBehaviour::Typed(b) = behaviour {
                    for binding in &b.state_bindings {
                        rows.push(Row::Label(match binding {
                            jian_ops_schema::component::ComponentStateBinding::Property {
                                property_id,
                                values,
                            } => format!(
                                "{property_id} · {}",
                                values
                                    .iter()
                                    .map(|(k, v)| format!("{k}→{v}"))
                                    .collect::<Vec<_>>()
                                    .join(", ")
                            ),
                            jian_ops_schema::component::ComponentStateBinding::Variant {
                                variant_id,
                                value,
                            } => format!("{value} → {variant_id}"),
                        }));
                    }
                }
            }
            if !model.instance {
                rows.push(Row::Button(
                    A::BehaviourKind,
                    behaviour_name(model.draft.behaviour_kind, locale).into(),
                ));
                rows.push(Row::Input(12, "componentInspector.default"));
                rows.push(Row::Label(t("componentInspector.bindingHint")));
                rows.push(Row::Input(13, "componentInspector.bindings"));
                if model.draft.behaviour_kind == 3 {
                    rows.push(Row::Input(14, "componentInspector.options"));
                }
                if model.draft.behaviour_kind == 4 {
                    rows.extend([
                        Row::Input(15, "componentInspector.minimum"),
                        Row::Input(16, "componentInspector.maximum"),
                        Row::Input(17, "componentInspector.step"),
                    ]);
                }
                rows.push(Row::Button(
                    A::Disabled,
                    format!(
                        "{} {}",
                        if model.draft.disabled { "☑" } else { "☐" },
                        t("componentInspector.disabled")
                    ),
                ));
                rows.push(button(A::SaveBehaviour, "componentInspector.saveBehaviour"));
                rows.push(button(
                    A::RemoveBehaviour,
                    "componentInspector.removeBehaviour",
                ));
            }
        }
    }
    if let Some(error) = &model.error {
        rows.push(Row::Label(error.clone()));
    }
    rows
}

pub fn property_kind(index: usize) -> ComponentPropertyKind {
    [
        ComponentPropertyKind::Text,
        ComponentPropertyKind::Boolean,
        ComponentPropertyKind::InstanceSwap,
    ][index % 3]
        .clone()
}

fn kind_name(kind: ComponentPropertyKind, locale: Locale) -> &'static str {
    op_i18n::translate(
        locale,
        match kind {
            ComponentPropertyKind::Text => "componentInspector.text",
            ComponentPropertyKind::Boolean => "componentInspector.boolean",
            ComponentPropertyKind::InstanceSwap => "componentInspector.swap",
        },
    )
}

fn behaviour_name(index: usize, locale: Locale) -> &'static str {
    op_i18n::translate(
        locale,
        [
            "componentInspector.button",
            "componentInspector.switch",
            "componentInspector.checkbox",
            "componentInspector.tabs",
            "componentInspector.slider",
        ][index % 5],
    )
}

const ROW_H: f32 = 34.0;
pub fn height(model: &ComponentInspector, locale: Locale) -> f32 {
    rows(model, locale).len() as f32 * ROW_H + 12.0
}

pub fn inputs(
    model: &ComponentInspector,
    locale: Locale,
    rect: Rect,
) -> Vec<(PropertyFocus, Rect)> {
    rows(model, locale)
        .into_iter()
        .enumerate()
        .filter_map(|(i, row)| match row {
            Row::Input(index, _) => {
                Some((PropertyFocus::ComponentDesign(index), row_rect(rect, i)))
            }
            _ => None,
        })
        .collect()
}

pub fn actions(
    model: &ComponentInspector,
    locale: Locale,
    rect: Rect,
) -> Vec<(PropertyPanelAction, Rect)> {
    rows(model, locale)
        .into_iter()
        .enumerate()
        .filter_map(|(i, row)| match row {
            Row::Button(action, _) => Some((
                PropertyPanelAction::ComponentInspector(action),
                row_rect(rect, i),
            )),
            _ => None,
        })
        .collect()
}

fn row_rect(rect: Rect, index: usize) -> Rect {
    Rect::xywh(
        rect.origin.x + PAD_X,
        rect.origin.y + index as f32 * ROW_H,
        rect.size.x - PAD_X * 2.0,
        28.0,
    )
}

pub fn paint(
    cx: &mut PaintCx<'_>,
    theme: &Theme,
    edit: &EditContext<'_>,
    locale: Locale,
    model: &ComponentInspector,
    rect: Rect,
) {
    for (i, row) in rows(model, locale).into_iter().enumerate() {
        let r = row_rect(rect, i);
        match row {
            Row::Label(label) => {
                paint_section_label(cx, theme, &label, rect.origin.x, r.origin.y, rect.size.x);
            }
            Row::Input(index, key) => {
                let focus = PropertyFocus::ComponentDesign(index);
                let focused = edit.focus == Some(focus);
                paint_input_with_prefix_focused_state(
                    cx,
                    theme,
                    r,
                    op_i18n::translate(locale, key),
                    if focused {
                        edit.draft
                    } else {
                        &model.draft.values[index]
                    },
                    focused,
                    Some(edit.caret),
                    edit.select_all,
                    Some(edit.input),
                    edit.now_ms,
                );
            }
            Row::Button(_, label) => {
                cx.backend.fill_round_rect(r, 4.0, theme.secondary);
                text(cx, theme, r, &label);
            }
        }
    }
}

fn text(cx: &mut PaintCx<'_>, theme: &Theme, rect: Rect, label: &str) {
    let size = 11.0;
    let layout = TextLayout::single_run(
        label,
        "system-ui",
        size,
        theme.foreground.to_jian(),
        Point2D::new(0.0, 0.0),
    );
    cx.backend.draw_text(
        &layout,
        Point2D::new(
            rect.origin.x + 6.0,
            jian_widgets::centered_text_baseline_y(rect, size),
        ),
    );
}
