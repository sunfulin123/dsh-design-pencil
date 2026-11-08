//! Figma-style collections in the variables panel: every collection is a
//! tab (multi-mode collections are theme axes; single-mode ones get one
//! "Default" column), a tab lists only its collection's members, and alias
//! values carry what they resolve to in each mode column.

use super::paint::paint_text;
use super::{VarRow, VariablesPanel, FOOTER_HEIGHT, PAD_X};
use crate::widgets::PaintCx;
use crate::{Point2D, Rect};
use jian_ops_schema::variable::{VariableScalar, VariableValue};
use op_editor_core::host_variables_transitions::UNGROUPED_VARIABLES_TAB;
use op_editor_core::variables_resolve::{effective_theme, resolve_variable_ref};
use op_editor_core::EditorState;

impl VariablesPanel {
    pub(super) fn variant_scalar_for<'a>(
        &self,
        var: &'a VarRow,
        axis: &str,
        value: &str,
    ) -> Option<&'a VariableScalar> {
        match &var.value {
            VariableValue::Scalar(s) => Some(s),
            VariableValue::Themed(entries) => entries
                .iter()
                .find(|entry| {
                    entry
                        .theme
                        .as_ref()
                        .and_then(|theme| theme.get(axis))
                        .is_some_and(|v| v == value)
                })
                .map(|entry| &entry.value)
                .or_else(|| {
                    entries
                        .iter()
                        .find(|entry| entry.theme.is_none())
                        .map(|entry| &entry.value)
                })
                .or_else(|| entries.first().map(|entry| &entry.value)),
        }
    }
}

impl VariablesPanel {
    fn library_updates_label(&self) -> String {
        crate::i18n::translate_with(
            self.locale,
            "variables.libraryUpdates",
            &[("count", &self.library_updates.to_string())],
        )
    }

    /// Footer-right "N library updates · Accept", when any are pending.
    pub(super) fn library_updates_rect(&self, rect: Rect) -> Option<Rect> {
        if self.library_updates == 0 {
            return None;
        }
        // Hit-testing has no text backend, so estimate 13 px glyphs: wide
        // (CJK) characters take a full em, others a bit over half.
        let width: f32 = self
            .library_updates_label()
            .chars()
            .map(|c| if c as u32 >= 0x2E80 { 13.0 } else { 7.4 })
            .sum::<f32>()
            + 24.0;
        let height = 28.0;
        Some(Rect {
            origin: Point2D::new(
                rect.origin.x + rect.size.x - PAD_X - width,
                rect.origin.y + rect.size.y - FOOTER_HEIGHT + (FOOTER_HEIGHT - height) / 2.0,
            ),
            size: Point2D::new(width, height),
        })
    }
}

pub(super) fn paint_library_updates(panel: &VariablesPanel, cx: &mut PaintCx<'_>, rect: Rect) {
    let Some(button) = panel.library_updates_rect(rect) else {
        return;
    };
    cx.backend.fill_round_rect(button, 8.0, panel.theme.primary);
    let label = panel.library_updates_label();
    let y = button.origin.y + button.size.y / 2.0 + 5.0;
    paint_text(
        cx,
        &label,
        13.0,
        panel.theme.primary_foreground,
        button.origin.x + 12.0,
        y,
    );
}

/// Append a tab for each collection that is not already a theme axis, and
/// the ungrouped tab when variables outside every collection would
/// otherwise have no tab.
pub(super) fn add_collection_tabs(state: &EditorState, themes: &mut Vec<(String, Vec<String>)>) {
    let Some(collections) = state
        .doc
        .variable_collections
        .as_ref()
        .filter(|c| !c.is_empty())
    else {
        return;
    };
    for name in collections.keys() {
        if !themes.iter().any(|(axis, _)| axis == name) {
            themes.push((name.clone(), vec!["Default".to_string()]));
        }
    }
    let ungrouped = state
        .doc
        .variables
        .iter()
        .flat_map(|v| v.keys())
        .any(|name| !collections.values().any(|c| c.variables.contains_key(name)));
    if ungrouped
        && themes
            .iter()
            .all(|(axis, _)| collections.contains_key(axis))
    {
        themes.push((
            UNGROUPED_VARIABLES_TAB.to_string(),
            vec!["Default".to_string()],
        ));
    }
}

/// Rows of the active tab, with alias values resolved per mode column. A
/// collection tab lists its members; any other tab lists the variables that
/// belong to no collection. Documents without collections list everything.
pub(super) fn tab_rows(
    state: &EditorState,
    axis: Option<&str>,
    themes: &[(String, Vec<String>)],
    rows: Vec<VarRow>,
) -> Vec<VarRow> {
    let collections = state.doc.variable_collections.as_ref();
    let member = |name: &str| -> bool {
        let Some(collections) = collections.filter(|c| !c.is_empty()) else {
            return true;
        };
        match axis.and_then(|axis| collections.get(axis)) {
            Some(collection) => collection.variables.contains_key(name),
            None => !collections.values().any(|c| c.variables.contains_key(name)),
        }
    };
    let modes: &[String] = axis
        .and_then(|axis| themes.iter().find(|(name, _)| name == axis))
        .map_or(&[], |(_, modes)| modes.as_slice());
    let base = effective_theme(&state.doc, &state.ui.variables.active_theme);
    rows.into_iter()
        .filter(|row| member(&row.name))
        .map(|mut row| {
            row.alias_resolved = modes
                .iter()
                .map(|mode| {
                    let reference = mode_scalar(&row.value, axis?, mode)?;
                    let mut theme = base.clone();
                    theme.insert(axis?.to_string(), mode.clone());
                    resolve_variable_ref(reference, state.doc.variables.as_ref(), &theme)
                })
                .collect();
            row
        })
        .collect()
}

/// The alias text (`$name`) a value holds in one mode, if it is an alias.
fn mode_scalar<'a>(value: &'a VariableValue, axis: &str, mode: &str) -> Option<&'a str> {
    let scalar = match value {
        VariableValue::Scalar(scalar) => scalar,
        VariableValue::Themed(entries) => {
            &entries
                .iter()
                .find(|e| {
                    e.theme
                        .as_ref()
                        .and_then(|t| t.get(axis))
                        .is_some_and(|m| m == mode)
                })
                .or_else(|| entries.first())?
                .value
        }
    };
    match scalar {
        VariableScalar::Str(text) if text.starts_with('$') => Some(text),
        _ => None,
    }
}

#[cfg(test)]
#[path = "collections_tests.rs"]
mod tests;
