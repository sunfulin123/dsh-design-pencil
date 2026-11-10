use super::*;
use jian_ops_schema::style::FontStyleKind;
use op_editor_core::text_design::{
    markdown_to_node, styled_range, MarkdownOptions, ParagraphStyle, TextRangeStyle,
};
use op_editor_core::text_design_command::TextDesignSnapshot;
use op_editor_core::{EditorCommand, NodeId};

pub(crate) fn dispatch(state: &mut EditorState, action: &A, now_ms: u64) {
    if matches!(action, A::ToggleTextAdvanced) {
        state.ui.text_inspector.expanded = !state.ui.text_inspector.expanded;
        return;
    }
    let authored_blocked = std::mem::take(&mut state.ui.text_inspector.authored_blocked);
    if authored_blocked || !TextInspectorDraft::editable(state) {
        warn(
            state,
            op_i18n::translate(state.editor_ui.locale, "textInspector.selectHint").to_owned(),
            now_ms,
        );
        return;
    }
    // Direct dispatch (as well as pointer blur) must first retain the live form input.
    if matches!(state.ui.property_focus, Some(PropertyFocus::TextDesign(_))) {
        super::super::property_panel_commit::commit_property_focus(state);
    }
    state.ui.text_inspector = TextInspectorDraft::for_state(state);
    let draft = &mut state.ui.text_inspector;
    match action {
        A::CycleTextRangeFlag(i) => {
            let flag = match i {
                0 => &mut draft.italic,
                1 => &mut draft.underline,
                2 => &mut draft.strike,
                _ => return,
            };
            *flag = match flag {
                None => Some(true),
                Some(true) => Some(false),
                Some(false) => None,
            };
            return;
        }
        A::ToggleTextRangeClearLink => {
            draft.clear_link = !draft.clear_link;
            return;
        }
        A::SetTextParagraphList(i) if *i < 3 => {
            draft.list = *i;
            return;
        }
        A::SetTextTruncation(lines) if *lines <= 3 => {
            let id = state.selection.anchor.clone();
            if !matches!(
                state.selected_node(),
                Some(jian_ops_schema::node::PenNode::Text(_))
            ) {
                warn(
                    state,
                    op_i18n::translate(state.editor_ui.locale, "textInspector.selectHint").into(),
                    now_ms,
                );
                return;
            }
            let enabled = *lines > 0;
            let patch = serde_json::json!({
                "textTruncation": if enabled { "ending" } else { "none" },
                "maxLines": enabled.then_some(*lines),
            });
            if state.apply(EditorCommand::Batch {
                commands: vec![EditorCommand::PatchNodeData {
                    node_id: id,
                    patch_json: patch.to_string(),
                    page_id: None,
                }],
            }) {
                state.ui.text_inspector.truncation_lines = enabled.then_some(*lines as u32);
            } else {
                warn(
                    state,
                    op_i18n::translate(state.editor_ui.locale, "textInspector.applyFailed").into(),
                    now_ms,
                );
            }
            return;
        }
        _ => {}
    }
    let result = prepare(state, action);
    match result {
        Ok(command) => {
            // The core Batch command owns the single atomic undo entry.
            if state.apply(command) {
                if state
                    .editor_ui
                    .editor_toast
                    .as_ref()
                    .is_some_and(|toast| toast.i18n_key == "layerMenu.designError")
                {
                    state.editor_ui.dismiss_toast();
                }
            } else {
                warn(
                    state,
                    op_i18n::translate(state.editor_ui.locale, "textInspector.applyFailed")
                        .to_owned(),
                    now_ms,
                );
            }
        }
        Err(reason) => warn(state, reason, now_ms),
    }
}

fn warn(state: &mut EditorState, reason: String, now_ms: u64) {
    state.editor_ui.show_toast(
        "layerMenu.designError",
        vec![("reason".into(), reason)],
        op_editor_core::editor_toast::EditorToastLevel::Warn,
        now_ms,
    );
}

fn prepare(state: &EditorState, action: &A) -> Result<EditorCommand, String> {
    let draft = &state.ui.text_inspector;
    let snapshot = TextDesignSnapshot::new(state);
    let id = state.selection.anchor.as_str();
    let values = &draft.values;
    let number_error =
        || op_i18n::translate(state.editor_ui.locale, "textInspector.invalidNumber").to_owned();
    let float = |i: usize| -> Result<Option<f64>, String> {
        if values[i].trim().is_empty() {
            return Ok(None);
        }
        values[i]
            .trim()
            .parse::<f64>()
            .map(Some)
            .map_err(|_| number_error())
    };
    let integer = |i: usize| -> Result<usize, String> {
        values[i].trim().parse().map_err(|_| number_error())
    };
    let node = match action {
        A::ApplyTextMarkdown => markdown_to_node(
            &values[0],
            &snapshot.markdown_template(id)?,
            &MarkdownOptions::default(),
        )?,
        A::ApplyTextRange => {
            let text = snapshot.text(id)?;
            let style = TextRangeStyle {
                font_family: (!values[12].trim().is_empty()).then(|| values[12].trim().into()),
                font_size: float(3)?.map(|v| v as f32),
                font_weight: if values[4].trim().is_empty() {
                    None
                } else {
                    Some(u32::try_from(integer(4)?).map_err(|_| number_error())?)
                },
                font_style: draft.italic.map(|v| {
                    if v {
                        FontStyleKind::Italic
                    } else {
                        FontStyleKind::Normal
                    }
                }),
                fill: (!values[5].trim().is_empty()).then(|| values[5].trim().into()),
                href: if draft.clear_link {
                    Some(String::new())
                } else {
                    (!values[6].trim().is_empty()).then(|| values[6].trim().into())
                },
                underline: draft.underline,
                strikethrough: draft.strike,
            };
            let (start, end) = if let Some(range) = &state.ui.text_selection {
                if range.node_id.as_str() != id
                    || range.page_index != state.ui.active_page_index
                    || op_editor_core::text_design::plain_text(&text.content) != range.text
                {
                    return Err("Text changed; select it again".into());
                }
                (range.start, range.end)
            } else {
                (integer(1)?, integer(2)?)
            };
            let content = styled_range(&text.content, start, end, &style)?;
            return Ok(EditorCommand::Batch {
                commands: vec![EditorCommand::PatchNodeData {
                    node_id: NodeId::new(text.base.id),
                    patch_json: serde_json::json!({"content":content}).to_string(),
                    page_id: None,
                }],
            });
        }
        A::ApplyTextParagraph => snapshot.paragraph_node(
            id,
            &ParagraphStyle {
                indent: float(7)?.unwrap_or(0.0),
                space_before: float(8)?.unwrap_or(0.0),
                space_after: float(9)?.unwrap_or(0.0),
                number: u32::try_from(integer(10)?).map_err(|_| number_error())?,
                list: [None, Some("bullet".into()), Some("ordered".into())][draft.list].clone(),
                line_height: float(11)?,
                ..Default::default()
            },
        )?,
        _ => {
            return Err(
                op_i18n::translate(state.editor_ui.locale, "textInspector.applyFailed").into(),
            );
        }
    };
    snapshot.patch_tree(node).map(|(command, _)| command)
}
