//! Origin-locked embedding-host preference commands.

use super::*;

pub(super) fn handle_ui_scale<C: RepaintContext + 'static>(
    inner: &Rc<RefCell<C>>,
    request_id: String,
    scale: Option<op_editor_core::editor_ui_state::ui_scale::UiScale>,
) {
    let Ok(mut context) = inner.try_borrow_mut() else {
        return;
    };
    if let Some(scale) = scale {
        context
            .host_mut()
            .editor_state_mut()
            .apply(op_editor_core::EditorCommand::SetUiScale {
                percent: scale.percent(),
            });
        context.host_mut().mark_editor_state_dirty();
        let _ = context.repaint();
    }
    post_to_parent(&op_editor_core::bridge_protocol::event_ui_scale(
        &request_id,
        context.host().editor_state().editor_ui.ui_scale,
    ));
}

/// Host locale is a page-lifetime override, not the user's saved preference.
pub(super) fn handle_locale<C: RepaintContext + 'static>(
    inner: &Rc<RefCell<C>>,
    locale: op_editor_core::Locale,
) {
    let Ok(mut context) = inner.try_borrow_mut() else {
        return;
    };
    context
        .host_mut()
        .editor_state_mut()
        .editor_ui
        .set_host_locale_override(Some(locale));
    context.host_mut().mark_editor_state_dirty();
    let _ = context.repaint();
}

/// Host theme is a page-lifetime override, not the user's saved preference.
pub(super) fn handle_theme<C: RepaintContext + 'static>(
    inner: &Rc<RefCell<C>>,
    color_scheme: op_editor_core::ThemeMode,
    palette: std::collections::BTreeMap<String, String>,
) {
    let Ok(mut context) = inner.try_borrow_mut() else {
        return;
    };
    crate::web_settings::theme::set_host_override(
        context.host_mut().editor_state_mut(),
        color_scheme,
    );
    context
        .host_mut()
        .editor_state_mut()
        .editor_ui
        .host_theme_palette = palette;
    context.host_mut().mark_editor_state_dirty();
    let _ = context.repaint();
}
