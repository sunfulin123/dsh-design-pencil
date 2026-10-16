//! Text decoration (italic / underline / strikethrough) and semantics /
//! explain / screen metadata mutators on `EditorState`.

use super::resolve_text_node_mut;
use crate::node_id::NodeId;
use crate::pen_node_ext::PenNodeExt;
use crate::state::EditorState;
use crate::walkers::find_node_mut;
use jian_ops_schema::node::text::FontStyleKind;
use jian_ops_schema::node::PenNode;

impl EditorState {
    /// Toggle italic font style on a Text node (or single-text wrapper).
    pub fn toggle_node_text_italic(&mut self, node_id: &NodeId) -> bool {
        if !node_id.is_real() {
            return false;
        }
        let Some(node) = find_node_mut(self.active_children_mut(), node_id) else {
            return false;
        };
        let Some(t) = resolve_text_node_mut(node) else {
            return false;
        };
        t.font_style = match t.font_style {
            Some(FontStyleKind::Italic) => Some(FontStyleKind::Normal),
            _ => Some(FontStyleKind::Italic),
        };
        self.mark_document_changed();
        true
    }

    /// Toggle underline decoration on a Text node (or single-text wrapper).
    pub fn toggle_node_text_underline(&mut self, node_id: &NodeId) -> bool {
        if !node_id.is_real() {
            return false;
        }
        let Some(node) = find_node_mut(self.active_children_mut(), node_id) else {
            return false;
        };
        let Some(t) = resolve_text_node_mut(node) else {
            return false;
        };
        t.underline = Some(!t.underline.unwrap_or(false));
        self.mark_document_changed();
        true
    }

    /// Toggle strikethrough decoration on a Text node (or single-text wrapper).
    pub fn toggle_node_text_strikethrough(&mut self, node_id: &NodeId) -> bool {
        if !node_id.is_real() {
            return false;
        }
        let Some(node) = find_node_mut(self.active_children_mut(), node_id) else {
            return false;
        };
        let Some(t) = resolve_text_node_mut(node) else {
            return false;
        };
        t.strikethrough = Some(!t.strikethrough.unwrap_or(false));
        self.mark_document_changed();
        true
    }

    /// Set the semantic role (`base.role` and `semantics.role` when matching) on a node.
    pub fn set_node_role_str(&mut self, node_id: &NodeId, role: &str) -> bool {
        if !node_id.is_real() {
            return false;
        }
        let Some(node) = find_node_mut(self.active_children_mut(), node_id) else {
            return false;
        };
        let trimmed = role.trim();
        node.base_mut().role = if trimmed.is_empty() {
            None
        } else {
            Some(trimmed.to_string())
        };
        if let Some(sem_slot) = node_semantics_slot(node) {
            let parsed_role = serde_json::from_value::<jian_ops_schema::semantics::SemanticRole>(
                serde_json::Value::String(trimmed.to_lowercase()),
            )
            .ok();
            if parsed_role.is_some() {
                sem_slot.get_or_insert_with(Default::default).role = parsed_role;
            } else if trimmed.is_empty() {
                if let Some(sem) = sem_slot.as_mut() {
                    sem.role = None;
                }
            }
        }
        self.mark_document_changed();
        true
    }

    /// Set the design explanation / AI description (`base.explain` + `semantics.aiDescription`) on a node.
    pub fn set_node_explain_str(&mut self, node_id: &NodeId, explain: &str) -> bool {
        if !node_id.is_real() {
            return false;
        }
        let Some(node) = find_node_mut(self.active_children_mut(), node_id) else {
            return false;
        };
        let trimmed = explain.trim();
        node.base_mut().explain = if trimmed.is_empty() {
            None
        } else {
            Some(trimmed.to_string())
        };
        if let Some(sem_slot) = node_semantics_slot(node) {
            if trimmed.is_empty() {
                if let Some(sem) = sem_slot.as_mut() {
                    sem.ai_description = None;
                }
            } else {
                sem_slot.get_or_insert_with(Default::default).ai_description =
                    Some(trimmed.to_string());
            }
        }
        self.mark_document_changed();
        true
    }

    /// Set the accessibility label (`semantics.label` / `aria-label`) on a node.
    pub fn set_node_a11y_label_str(&mut self, node_id: &NodeId, label: &str) -> bool {
        if !node_id.is_real() {
            return false;
        }
        let Some(node) = find_node_mut(self.active_children_mut(), node_id) else {
            return false;
        };
        let Some(sem_slot) = node_semantics_slot(node) else {
            return false;
        };
        let trimmed = label.trim();
        if trimmed.is_empty() {
            if let Some(sem) = sem_slot.as_mut() {
                sem.label = None;
            }
        } else {
            sem_slot.get_or_insert_with(Default::default).label = Some(trimmed.to_string());
        }
        self.mark_document_changed();
        true
    }

    /// Set the screen route path (`screen`) on a top-level Frame node.
    pub fn set_node_screen_str(&mut self, node_id: &NodeId, screen: &str) -> bool {
        if !node_id.is_real() {
            return false;
        }
        let Some(PenNode::Frame(f)) = find_node_mut(self.active_children_mut(), node_id) else {
            return false;
        };
        let trimmed = screen.trim();
        f.screen = if trimmed.is_empty() {
            None
        } else {
            Some(trimmed.to_string())
        };
        self.mark_document_changed();
        true
    }
}

pub fn node_semantics(node: &PenNode) -> Option<&jian_ops_schema::semantics::SemanticsMeta> {
    match node {
        PenNode::Frame(n) => n.semantics.as_ref(),
        PenNode::Group(n) => n.semantics.as_ref(),
        PenNode::Rectangle(n) => n.semantics.as_ref(),
        PenNode::Ellipse(n) => n.semantics.as_ref(),
        PenNode::Polygon(n) => n.semantics.as_ref(),
        PenNode::Line(n) => n.semantics.as_ref(),
        PenNode::Path(n) => n.semantics.as_ref(),
        PenNode::Text(n) => n.semantics.as_ref(),
        PenNode::Image(n) => n.semantics.as_ref(),
        PenNode::IconFont(n) => n.semantics.as_ref(),
        PenNode::TextInput(n) => n.semantics.as_ref(),
        PenNode::TextArea(n) => n.semantics.as_ref(),
        PenNode::NumberInput(n) => n.semantics.as_ref(),
        PenNode::Select(n) => n.semantics.as_ref(),
        PenNode::RadioGroup(n) => n.semantics.as_ref(),
        PenNode::Switch(n) => n.semantics.as_ref(),
        PenNode::Checkbox(n) => n.semantics.as_ref(),
        PenNode::Slider(n) => n.semantics.as_ref(),
        PenNode::Progress(n) => n.semantics.as_ref(),
        PenNode::Tabs(n) => n.semantics.as_ref(),
        PenNode::Ref(n) => n.semantics.as_ref(),
    }
}

pub(crate) fn node_semantics_slot(
    node: &mut PenNode,
) -> Option<&mut Option<jian_ops_schema::semantics::SemanticsMeta>> {
    match node {
        PenNode::Frame(n) => Some(&mut n.semantics),
        PenNode::Group(n) => Some(&mut n.semantics),
        PenNode::Rectangle(n) => Some(&mut n.semantics),
        PenNode::Ellipse(n) => Some(&mut n.semantics),
        PenNode::Polygon(n) => Some(&mut n.semantics),
        PenNode::Line(n) => Some(&mut n.semantics),
        PenNode::Path(n) => Some(&mut n.semantics),
        PenNode::Text(n) => Some(&mut n.semantics),
        PenNode::Image(n) => Some(&mut n.semantics),
        PenNode::IconFont(n) => Some(&mut n.semantics),
        PenNode::TextInput(n) => Some(&mut n.semantics),
        PenNode::TextArea(n) => Some(&mut n.semantics),
        PenNode::NumberInput(n) => Some(&mut n.semantics),
        PenNode::Select(n) => Some(&mut n.semantics),
        PenNode::RadioGroup(n) => Some(&mut n.semantics),
        PenNode::Switch(n) => Some(&mut n.semantics),
        PenNode::Checkbox(n) => Some(&mut n.semantics),
        PenNode::Slider(n) => Some(&mut n.semantics),
        PenNode::Progress(n) => Some(&mut n.semantics),
        PenNode::Tabs(n) => Some(&mut n.semantics),
        PenNode::Ref(n) => Some(&mut n.semantics),
    }
}
