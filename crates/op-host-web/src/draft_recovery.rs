use std::cell::RefCell;
use std::rc::Rc;

use serde_json::json;
use wasm_bindgen::{prelude::*, JsCast};

use crate::repaint_ctx::RepaintContext;

#[wasm_bindgen(module = "/src/draft_recovery.js")]
extern "C" {
    #[wasm_bindgen(js_name = openDraftRecovery, catch)]
    fn open_dialog(config: &str, version: &js_sys::Function) -> Result<(), JsValue>;
}

fn css(color: op_editor_ui::Color) -> String {
    format!(
        "rgba({},{},{},{})",
        (color.r * 255.0).round(),
        (color.g * 255.0).round(),
        (color.b * 255.0).round(),
        color.a
    )
}

pub(crate) fn open<C: RepaintContext + 'static>(inner: &Rc<RefCell<C>>) {
    crate::live_sync_glue::flush_document_if_changed(inner);
    let config = {
        let b = inner.borrow();
        let ui = &b.host().editor_state().editor_ui;
        let theme = op_editor_ui::widgets::editor_state_ext::theme_for(ui);
        let locale = ui.effective_locale();
        let t = |key| op_i18n::translate(locale, key);
        json!({
            "base": crate::daemon_base::daemon_base(),
            "token": crate::live_sync::bridge_token(),
            "locale": locale.code(), "scale": ui.ui_scale.factor(),
            "colors": {
                "surface":css(theme.popover), "text":css(theme.foreground),
                "muted":css(theme.muted_foreground), "border":css(theme.border),
                "input":css(theme.background), "hover":css(theme.accent),
                "accent":css(theme.primary), "accentText":css(theme.primary_foreground),
                "error":css(theme.destructive), "ring":css(theme.ring),
            },
            "labels":{
                "title":t("drafts.title"), "notice":t("drafts.notice"),
                "create":t("drafts.create"), "label":t("drafts.label"),
                "empty":t("drafts.empty"), "restoreConfirm":t("drafts.restoreConfirm"),
                "deleteConfirm":t("drafts.deleteConfirm"), "syncError":t("drafts.syncError"),
                "refresh":t("drafts.refresh"), "failed":t("drafts.failed"),
                "loading":t("drafts.loading"), "autosave":t("drafts.autosave"),
                "checkpoint":t("drafts.checkpoint"), "pre-restore":t("drafts.backup"),
                "close":t("common.close"), "cancel":t("common.cancel"),
                "delete":t("common.delete"), "restore":t("ai.restore"),
            }
        })
        .to_string()
    };
    let weak = Rc::downgrade(inner);
    let version = Closure::<dyn Fn() -> JsValue>::new(move || {
        let Some(inner) = weak.upgrade() else {
            return JsValue::UNDEFINED;
        };
        let b = inner.borrow();
        crate::live_sync_glue::daemon_synced_version(b.host().editor_state())
            .map(|v| JsValue::from_f64(v as f64))
            .unwrap_or(JsValue::UNDEFINED)
    })
    .into_js_value();
    if let Err(error) = open_dialog(&config, version.unchecked_ref()) {
        let mut b = inner.borrow_mut();
        b.host_mut().editor_state_mut().editor_ui.show_toast(
            "drafts.failed",
            vec![("message".into(), format!("{error:?}"))],
            op_editor_core::editor_toast::EditorToastLevel::Warn,
            crate::listener::now_ms_perf(),
        );
        b.host_mut().mark_editor_state_dirty();
        crate::repaint_coalescer::request();
    }
}
