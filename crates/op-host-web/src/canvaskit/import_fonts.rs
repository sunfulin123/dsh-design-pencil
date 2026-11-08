//! Discover font faces downloaded by Figma import jobs and register them in
//! both CanvasKit and the browser shaping path.

use super::inner::CkInner;
use serde::Deserialize;
use std::cell::RefCell;
use std::collections::HashSet;
use std::rc::Rc;
use wasm_bindgen::JsValue;

#[derive(Deserialize)]
struct Manifest {
    faces: Vec<Face>,
}
#[derive(Deserialize)]
struct Face {
    id: String,
    family: String,
    weight: u32,
    italic: bool,
    path: String,
}

pub(super) fn start(inner: &Rc<RefCell<CkInner>>) {
    let weak = Rc::downgrade(inner);
    let loaded = Rc::new(RefCell::new(HashSet::<String>::new()));
    let tick: Rc<dyn Fn()> = Rc::new(move || {
        let Some(inner) = weak.upgrade() else { return };
        let loaded = loaded.clone();
        let url = crate::daemon_base::daemon_url("/api/fonts/manifest");
        crate::live_sync::get_with_status(
            &url,
            Rc::new(move |status, body| {
                if status != 200 {
                    return;
                }
                let manifest = match serde_json::from_str::<Manifest>(&body) {
                    Ok(m) => m,
                    Err(e) => {
                        web_sys::console::warn_1(&JsValue::from_str(&format!(
                            "Invalid import font manifest: {e}"
                        )));
                        return;
                    }
                };
                for face in manifest.faces {
                    if !face.path.starts_with("/api/fonts/")
                        || !loaded.borrow_mut().insert(face.id.clone())
                    {
                        continue;
                    }
                    let inner = inner.clone();
                    let loaded = loaded.clone();
                    let url = crate::daemon_base::daemon_url(&face.path);
                    crate::web_asset_fetch::fetch_bytes(&url, move |result| {
                        let result = result.map_err(|e| format!("{e:?}")).and_then(|bytes| {
                            let mut inner = inner.borrow_mut();
                            if !inner.backend.ck.register_font_face(
                                &face.family,
                                face.weight,
                                face.italic,
                                &bytes,
                            ) {
                                return Err("CanvasKit rejected the font face".into());
                            }
                            inner
                                .host
                                .editor_state_mut()
                                .editor_ui
                                .imported_font_families =
                                std::sync::Arc::new(inner.backend.imported_family_list());
                            inner.host.refresh_missing_fonts_prompt();
                            inner.host.mark_editor_state_dirty();
                            inner.host.invalidate_layout_scene();
                            inner.repaint();
                            Ok(())
                        });
                        if let Err(error) = result {
                            loaded.borrow_mut().remove(&face.id);
                            web_sys::console::warn_1(&JsValue::from_str(&format!(
                                "Import font {} failed: {error}",
                                face.family
                            )));
                        }
                    });
                }
            }),
        );
    });
    tick();
    if let Err(error) = crate::live_sync::start_interval(1500, tick) {
        web_sys::console::warn_1(&error);
    }
}
