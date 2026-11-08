//! Mounted-editor UI scale hooks and device-local persistence.

use std::cell::RefCell;
use std::rc::{Rc, Weak};

use op_editor_core::editor_ui_state::ui_scale::UiScale;
use op_editor_core::{EditorCommand, EditorState};
use wasm_bindgen::prelude::*;

use super::inner::CkInner;

const STORAGE_KEY: &str = "openpencil-rust-web-ui-scale";

thread_local! {
    static MOUNTED: RefCell<Weak<RefCell<CkInner>>> = RefCell::new(Weak::new());
    static SAVED: RefCell<Option<UiScale>> = const { RefCell::new(None) };
}

fn parse_scale(percent: f64) -> Option<UiScale> {
    UiScale::SUPPORTED
        .into_iter()
        .find(|value| f64::from(*value) == percent)
        .and_then(UiScale::from_percent)
}

fn parse_saved_scale(raw: Option<&str>) -> UiScale {
    raw.and_then(|raw| raw.parse::<u16>().ok())
        .and_then(UiScale::from_percent)
        .unwrap_or_default()
}

pub(super) fn restore(state: &mut EditorState) {
    let raw = web_sys::window()
        .and_then(|window| window.local_storage().ok().flatten())
        .and_then(|storage| storage.get_item(STORAGE_KEY).ok().flatten());
    let scale = parse_saved_scale(raw.as_deref());
    state.editor_ui.ui_scale = scale;
    SAVED.with(|saved| *saved.borrow_mut() = Some(scale));
}

pub(super) fn save(state: &EditorState) {
    let scale = state.editor_ui.ui_scale;
    if SAVED.with(|saved| *saved.borrow() == Some(scale)) {
        return;
    }
    if let Some(storage) =
        web_sys::window().and_then(|window| window.local_storage().ok().flatten())
    {
        if storage
            .set_item(STORAGE_KEY, &scale.percent().to_string())
            .is_ok()
        {
            SAVED.with(|saved| *saved.borrow_mut() = Some(scale));
        }
    }
}

pub(super) fn install(inner: &Rc<RefCell<CkInner>>) {
    MOUNTED.with(|mounted| *mounted.borrow_mut() = Rc::downgrade(inner));
}

fn mounted() -> Result<Rc<RefCell<CkInner>>, JsValue> {
    MOUNTED
        .with(|mounted| mounted.borrow().upgrade())
        .ok_or_else(|| JsValue::from_str("Editor is not mounted"))
}

/// Returns the mounted editor's interface percentage, not its canvas zoom.
#[wasm_bindgen]
pub fn get_ui_scale() -> Result<u16, JsValue> {
    let inner = mounted()?;
    let inner = inner
        .try_borrow()
        .map_err(|_| JsValue::from_str("Editor is busy"))?;
    Ok(inner.host.editor_state().editor_ui.ui_scale.percent())
}

/// Changes actual chrome layout/paint/input without rewriting the document.
#[wasm_bindgen]
pub fn set_ui_scale(percent: f64) -> Result<u16, JsValue> {
    let scale = parse_scale(percent)
        .ok_or_else(|| JsValue::from_str("scale must be one of 100, 110, 125, 150"))?;
    let inner = mounted()?;
    let mut inner = inner
        .try_borrow_mut()
        .map_err(|_| JsValue::from_str("Editor is busy"))?;
    inner
        .host
        .editor_state_mut()
        .apply(EditorCommand::SetUiScale {
            percent: scale.percent(),
        });
    inner.host.mark_editor_state_dirty();
    save(inner.host.editor_state());
    crate::repaint_coalescer::request();
    Ok(scale.percent())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn settings_restore_only_supported_integer_percentages() {
        for percent in [100, 110, 125, 150] {
            assert_eq!(
                parse_saved_scale(Some(&percent.to_string())).percent(),
                percent
            );
            assert_eq!(parse_scale(percent as f64).unwrap().percent(), percent);
        }
        for raw in [
            None,
            Some("null"),
            Some("\"125\""),
            Some("125.0"),
            Some("120"),
            Some("200"),
        ] {
            assert_eq!(parse_saved_scale(raw).percent(), 100);
        }
        for value in [0.0, 90.0, 120.0, 125.5, 200.0, f64::NAN, f64::INFINITY] {
            assert!(parse_scale(value).is_none());
        }
    }
}
