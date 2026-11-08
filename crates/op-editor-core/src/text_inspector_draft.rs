//! Local text-inspector form values; editing these never edits the document.
use crate::text_design::plain_text;
use crate::EditorState;

pub const FIELD_COUNT: usize = 13;

#[derive(Debug, Clone, PartialEq)]
pub struct TextInspectorDraft {
    /// Captured by action routing before a host opens its instance-write scope.
    pub authored_blocked: bool,
    pub target: String,
    /// Markdown, start, end, size, weight, fill, link, indent, before, after,
    /// list start number, unitless paragraph line height, range font family.
    pub values: [String; FIELD_COUNT],
    pub italic: Option<bool>,
    pub underline: Option<bool>,
    pub strike: Option<bool>,
    pub clear_link: bool,
    pub list: usize,
    pub truncation_lines: Option<u32>,
}

impl Default for TextInspectorDraft {
    fn default() -> Self {
        Self {
            authored_blocked: false,
            target: String::new(),
            values: std::array::from_fn(|i| match i {
                1 | 7 | 8 | 9 => "0".into(),
                10 => "1".into(),
                _ => String::new(),
            }),
            italic: None,
            underline: None,
            strike: None,
            clear_link: false,
            list: 0,
            truncation_lines: None,
        }
    }
}

impl TextInspectorDraft {
    pub fn editable(state: &EditorState) -> bool {
        let editable = state.selection_count() == 1
            && state.is_editable(&state.selection.anchor)
            && state.is_subtree_unlocked(&state.selection.anchor)
            && state.instance_write_virtual_anchor.is_none()
            && state
                .selected_node()
                .is_some_and(|node| !matches!(node, jian_ops_schema::node::PenNode::Ref(_)));
        if !editable {
            return false;
        }
        let mut id = state.selection.anchor.clone();
        while let Some((Some(parent), _)) =
            crate::walkers::find_parent_and_index(state.active_children(), &id)
        {
            if !state.is_editable(&parent) {
                return false;
            }
            id = parent;
        }
        true
    }

    pub fn for_state(state: &EditorState) -> Self {
        let id = state.selection.anchor.as_str();
        if state.ui.text_inspector.target == id {
            return state.ui.text_inspector.clone();
        }
        let mut draft = Self {
            target: id.into(),
            ..Self::default()
        };
        if let Some(text) = state
            .selected_node()
            .and_then(crate::command_node_attrs::resolve_text_node)
        {
            let content = plain_text(&text.content);
            draft.values[2] = content.chars().count().to_string();
            draft.values[0] = content;
            draft.truncation_lines = text.truncates().then(|| text.max_lines.unwrap_or(1));
        }
        if let Some(node @ jian_ops_schema::node::PenNode::Frame(frame)) = state.selected_node() {
            if let Some(body_index) = crate::text_design_command::paragraph_body_index(node) {
                use jian_ops_schema::node::container::Padding;
                let padding = match frame.container.padding.as_ref() {
                    Some(Padding::Uniform(v)) => [*v; 4],
                    Some(Padding::XY(v)) => [v[0], v[1], v[0], v[1]],
                    Some(Padding::LtrB(v)) => *v,
                    _ => [0.0; 4],
                };
                for (field, value) in [(7, padding[3]), (8, padding[0]), (9, padding[2])] {
                    draft.values[field] = value.to_string();
                }
                if body_index == 1 {
                    let marker = crate::command_node_attrs::resolve_text_node(
                        &frame.children.as_ref().unwrap()[0],
                    )
                    .unwrap();
                    let marker = plain_text(&marker.content);
                    if let Some(number) = marker.strip_suffix('.') {
                        draft.list = 2;
                        draft.values[10] = number.into();
                    } else {
                        draft.list = 1;
                    }
                }
                if let Some(height) = crate::command_node_attrs::resolve_text_node(node)
                    .and_then(|text| text.line_height)
                {
                    draft.values[11] = height.to_string();
                }
            }
        }
        draft
    }
}
