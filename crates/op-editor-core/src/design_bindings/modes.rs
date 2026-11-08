//! Collection axes use the existing `themes` schema at every persisted scope.
use super::{find, node_theme, variable_mode_command, VariableBindingError};
use crate::variables_resolve::effective_theme;
use crate::{DesignCommand, EditorCommand, EditorState, PenNodeExt};
use std::collections::BTreeMap;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum VariableModeScope {
    Global,
    Page(String),
    Node(String),
}

#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize)]
pub struct VariableModeInfo {
    pub explicit: BTreeMap<String, String>,
    pub resolved: BTreeMap<String, String>,
}

pub(super) fn validate_modes(
    state: &EditorState,
    modes: &BTreeMap<String, String>,
) -> Result<(), VariableBindingError> {
    for (axis, value) in modes {
        let values = state
            .doc
            .themes
            .as_ref()
            .and_then(|themes| themes.get(axis))
            .ok_or_else(|| {
                VariableBindingError::InvalidMode(format!("unknown collection {axis}"))
            })?;
        if value != "auto" && !values.contains(value) {
            return Err(VariableBindingError::InvalidMode(format!(
                "unknown {axis}={value}"
            )));
        }
    }
    Ok(())
}

pub(super) fn update_modes(
    previous: Option<&BTreeMap<String, String>>,
    modes: &BTreeMap<String, String>,
) -> BTreeMap<String, String> {
    let mut next = if modes.is_empty() {
        BTreeMap::new()
    } else {
        previous.cloned().unwrap_or_default()
    };
    for (axis, value) in modes {
        if value == "auto" {
            next.remove(axis);
        } else {
            next.insert(axis.clone(), value.clone());
        }
    }
    next
}

pub fn page_theme(
    state: &EditorState,
    page_id: &str,
) -> Result<BTreeMap<String, String>, VariableBindingError> {
    let mut theme = effective_theme(&state.doc, &state.ui.variables.active_theme);
    let page = state
        .doc
        .pages
        .as_ref()
        .and_then(|pages| pages.iter().find(|p| p.id == page_id))
        .ok_or_else(|| VariableBindingError::InvalidTarget(page_id.into()))?;
    if let Some(overrides) = &page.theme {
        theme.extend(overrides.clone());
    }
    Ok(theme)
}

pub(super) fn active_page_theme(state: &EditorState) -> BTreeMap<String, String> {
    let mut theme = effective_theme(&state.doc, &state.ui.variables.active_theme);
    if let Some(overrides) = state
        .doc
        .pages
        .as_ref()
        .and_then(|pages| {
            pages.get(
                state
                    .ui
                    .active_page_index
                    .min(pages.len().saturating_sub(1)),
            )
        })
        .and_then(|p| p.theme.as_ref())
    {
        theme.extend(overrides.clone());
    }
    theme
}

pub fn variable_mode_info(
    state: &EditorState,
    scope: VariableModeScope,
) -> Result<VariableModeInfo, VariableBindingError> {
    let (explicit, resolved) = match scope {
        VariableModeScope::Global => (
            state.doc.theme.clone().unwrap_or_default(),
            effective_theme(&state.doc, &state.ui.variables.active_theme),
        ),
        VariableModeScope::Page(id) => {
            let page = state
                .doc
                .pages
                .as_ref()
                .and_then(|pages| pages.iter().find(|p| p.id == id))
                .ok_or_else(|| VariableBindingError::InvalidTarget(id.clone()))?;
            (
                page.theme.clone().unwrap_or_default(),
                page_theme(state, &id)?,
            )
        }
        VariableModeScope::Node(id) => {
            let node = find(state.active_children(), &id)
                .ok_or_else(|| VariableBindingError::InvalidTarget(id.clone()))?;
            (
                node.base().theme.clone().unwrap_or_default(),
                node_theme(state.active_children(), &id, &active_page_theme(state))
                    .ok_or_else(|| VariableBindingError::InvalidTarget(id.clone()))?,
            )
        }
    };
    Ok(VariableModeInfo { explicit, resolved })
}

pub fn variable_scope_mode_command(
    state: &EditorState,
    scope: VariableModeScope,
    modes: &BTreeMap<String, String>,
) -> Result<EditorCommand, VariableBindingError> {
    validate_modes(state, modes)?;
    if let VariableModeScope::Node(id) = &scope {
        return variable_mode_command(state, std::slice::from_ref(id), modes);
    }
    variable_mode_info(state, scope.clone())?;
    Ok(EditorCommand::Design(DesignCommand::VariableModes {
        scope,
        modes: modes.clone(),
    }))
}

pub(crate) fn apply_scope_modes(
    state: &mut EditorState,
    scope: VariableModeScope,
    modes: BTreeMap<String, String>,
) -> Result<bool, VariableBindingError> {
    if matches!(scope, VariableModeScope::Node(_)) {
        return Err(VariableBindingError::InvalidMode(
            "use node patch command".into(),
        ));
    }
    let _ = variable_scope_mode_command(state, scope.clone(), &modes)?;
    let info = variable_mode_info(state, scope.clone())?;
    let next = update_modes(Some(&info.explicit), &modes);
    if next == info.explicit {
        return Ok(false);
    }
    state.commit_history();
    match scope {
        VariableModeScope::Global => {
            state.doc.theme = if next.is_empty() { None } else { Some(next) }
        }
        VariableModeScope::Page(id) => {
            let page = state
                .doc
                .pages
                .as_mut()
                .and_then(|pages| pages.iter_mut().find(|p| p.id == id))
                .ok_or_else(|| VariableBindingError::InvalidTarget(id.clone()))?;
            page.theme = if next.is_empty() { None } else { Some(next) };
        }
        VariableModeScope::Node(_) => {
            return Err(VariableBindingError::InvalidMode(
                "use node patch command".into(),
            ))
        }
    }
    state.mark_document_changed();
    Ok(true)
}
