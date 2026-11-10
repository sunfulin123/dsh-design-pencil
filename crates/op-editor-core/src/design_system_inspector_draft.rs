//! Transient design-system form state, separate from authored document data.
use crate::EditorState;
use jian_ops_schema::style::SharedStyleKind;

mod ops;
pub use ops::execute;
#[cfg(test)]
mod tests;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum DesignSystemAction {
    ToggleAdvanced,
    TogglePicker(usize),
    SelectCollection(usize),
    SelectMode(usize),
    CycleQuickMode,
    Kind(usize),
    Scope(usize),
    LoadStyle(usize),
    BrowseStyle(bool),
    CaptureStyle,
    CreateStyle,
    UpdateStyle,
    ApplyStyle,
    DetachStyle,
    DeleteStyle,
    Bind,
    Unbind,
    SetMode,
    SetFormula,
    ImportTokens,
    ExportTokens,
    Lint,
    FixLint,
    BrowseFinding(bool),
    FixFinding,
}

pub const FIELD_COUNT: usize = 8;

#[derive(Debug, Clone, PartialEq)]
pub struct DesignSystemInspectorDraft {
    /// Session-only expansion state; it is never part of the document.
    pub expanded: bool,
    /// Open picker: shared style, collection, or mode.
    pub picker: Option<usize>,
    pub collections: Vec<(String, Vec<String>)>,
    /// Visible inherited binding and the selected layer's switchable mode.
    pub binding_summary: Option<String>,
    pub quick_mode: Option<QuickMode>,
    pub authored_blocked: bool,
    pub target: String,
    /// Style id/name, variable name/property/formula, collection/mode, tokens.
    pub values: [String; FIELD_COUNT],
    pub kind: SharedStyleKind,
    /// Node, active page, or document.
    pub scope: usize,
    pub status: String,
    pub lint_ids: Vec<String>,
    pub lint_findings: Vec<(String, String)>,
    pub lint_index: usize,
    pub styles: Vec<(String, String)>,
    pub variable_value: String,
    pub mode_value: String,
}

#[derive(Debug, Clone, PartialEq)]
pub struct QuickMode {
    pub collection: String,
    pub current: String,
    pub modes: Vec<String>,
    pub explicit: bool,
}

impl Default for DesignSystemInspectorDraft {
    fn default() -> Self {
        Self {
            expanded: false,
            picker: None,
            collections: Vec::new(),
            binding_summary: None,
            quick_mode: None,
            authored_blocked: false,
            target: String::new(),
            values: std::array::from_fn(|i| match i {
                3 => "fill".into(),
                6 => "auto".into(),
                _ => String::new(),
            }),
            kind: SharedStyleKind::Paint,
            scope: 0,
            status: String::new(),
            lint_ids: Vec::new(),
            lint_findings: Vec::new(),
            lint_index: 0,
            styles: Vec::new(),
            variable_value: String::new(),
            mode_value: String::new(),
        }
    }
}

impl DesignSystemInspectorDraft {
    pub fn for_state(state: &EditorState) -> Self {
        let mut draft = state.ui.design_system_inspector.clone();
        let target = state.selection.anchor.as_str();
        if draft.target != target {
            draft.target = target.into();
            draft.status.clear();
            draft.lint_ids.clear();
            draft.lint_findings.clear();
            draft.lint_index = 0;
        }
        draft.styles = state
            .doc
            .shared_styles
            .as_ref()
            .into_iter()
            .flat_map(|styles| {
                styles
                    .iter()
                    .map(|(id, style)| (id.clone(), style.name.clone()))
            })
            .collect();
        draft.collections = state
            .doc
            .themes
            .as_ref()
            .into_iter()
            .flat_map(|themes| {
                themes
                    .iter()
                    .map(|(name, modes)| (name.clone(), modes.clone()))
            })
            .collect();
        if let Some(collections) = &state.doc.variable_collections {
            for name in collections.keys() {
                if !draft
                    .collections
                    .iter()
                    .any(|(existing, _)| existing == name)
                {
                    draft.collections.push((name.clone(), Vec::new()));
                }
            }
            draft.collections.sort_by(|a, b| a.0.cmp(&b.0));
        }
        draft.binding_summary = state
            .selected_node()
            .and_then(crate::fills::first_solid_fill_hex)
            .filter(|value| value.starts_with('$'))
            .map(str::to_owned);
        let node_mode = crate::design_bindings::variable_mode_info(
            state,
            crate::design_bindings::VariableModeScope::Node(target.into()),
        )
        .ok();
        draft.quick_mode = node_mode.and_then(|info| {
            draft.collections.iter().find_map(|(name, modes)| {
                if modes.len() < 2 {
                    return None;
                }
                let current = info
                    .resolved
                    .get(name)
                    .filter(|mode| modes.contains(mode))
                    .cloned()
                    .unwrap_or_else(|| modes[0].clone());
                Some(QuickMode {
                    collection: name.clone(),
                    current,
                    modes: modes.clone(),
                    explicit: info.explicit.contains_key(name),
                })
            })
        });
        let variable = draft.values[2].trim().trim_start_matches('$');
        draft.variable_value = if variable.is_empty() {
            String::new()
        } else {
            let theme = crate::variables_resolve::effective_theme(
                &state.doc,
                &state.ui.variables.active_theme,
            );
            match crate::variables_resolve::resolve_variable_ref_checked(
                &format!("${variable}"),
                state.doc.variables.as_ref(),
                &theme,
            ) {
                Ok(value) => match value {
                    jian_ops_schema::variable::VariableScalar::Str(value) => value.clone(),
                    jian_ops_schema::variable::VariableScalar::Num(value) => value.to_string(),
                    jian_ops_schema::variable::VariableScalar::Bool(value) => value.to_string(),
                },
                Err(error) => error.to_string(),
            }
        };
        let scope = match draft.scope {
            0 => Some(crate::design_bindings::VariableModeScope::Node(
                target.into(),
            )),
            1 => state
                .doc
                .pages
                .as_ref()
                .and_then(|pages| pages.get(state.ui.active_page_index))
                .map(|page| crate::design_bindings::VariableModeScope::Page(page.id.clone())),
            _ => Some(crate::design_bindings::VariableModeScope::Global),
        };
        draft.mode_value = scope
            .and_then(|scope| crate::design_bindings::variable_mode_info(state, scope).ok())
            .and_then(|info| info.resolved.get(draft.values[5].trim()).cloned())
            .unwrap_or_default();
        draft
    }
}
