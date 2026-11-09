use crate::{live_sync, repaint_ctx::RepaintContext};
use op_editor_core::PenNodeExt;
use op_editor_core::{EditorState, ThemeMode};
use serde_json::{json, Value};
use std::cell::{Cell, RefCell};
use std::rc::Rc;

pub(crate) fn apply_editor_control<F>(
    state: &mut EditorState,
    name: &str,
    args: &Value,
    persist: F,
) -> Result<Value, String>
where
    F: FnOnce(&EditorState) -> Result<(), String>,
{
    if name == "set_editor_theme" {
        let theme = match args["theme"].as_str() {
            Some("light") => ThemeMode::Light,
            Some("dark") => ThemeMode::Dark,
            _ => return Err("theme must be light or dark".into()),
        };
        if state.editor_ui.host_theme_override.is_some() {
            return Err("Embedding host locks the effective editor theme".into());
        }
        if args["persist"].as_bool().unwrap_or(false) {
            let mut next = state.clone();
            next.editor_ui.theme_mode = theme;
            next.editor_ui.temporary_theme_override = None;
            persist(&next)?;
            state.editor_ui.theme_mode = theme;
            state.editor_ui.temporary_theme_override = None;
        } else {
            state.editor_ui.temporary_theme_override = Some(theme);
        }
    } else if name != "get_editor_theme" {
        return Err("Unknown editor control request".into());
    }
    let wire = |theme| match theme {
        ThemeMode::Light => "light",
        ThemeMode::Dark => "dark",
    };
    Ok(
        json!({"effective":wire(state.editor_ui.effective_theme_mode()),
        "preference":wire(state.editor_ui.theme_mode),
        "hostOverride":state.editor_ui.host_theme_override.map(wire),"connected":true}),
    )
}

fn report<C: RepaintContext>(inner: &Rc<RefCell<C>>, error: &str) {
    web_sys::console::error_1(&error.into());
    if let Ok(mut context) = inner.try_borrow_mut() {
        let host = context.host_mut();
        if let Some(assets) = host.editor_state_mut().editor_ui.managed_assets.as_mut() {
            assets.error = Some(error.into());
            assets.busy = false;
        }
        host.editor_state_mut().editor_ui.show_toast(
            error,
            vec![],
            op_editor_core::editor_toast::EditorToastLevel::Warn,
            js_sys::Date::now() as u64,
        );
        host.mark_editor_state_dirty();
        let _ = context.repaint();
    }
}

pub(crate) fn note_version_probe<C: RepaintContext + 'static>(
    inner: &Rc<RefCell<C>>,
    base: &str,
    body: &str,
) {
    let Ok(probe) = serde_json::from_str::<Value>(body) else {
        return;
    };
    let Some(revision) = probe["assetsRevision"].as_u64() else {
        return;
    };
    {
        let mut context = inner.borrow_mut();
        let state = context.host_mut().editor_state_mut();
        let assets = state
            .editor_ui
            .managed_assets
            .get_or_insert_with(Default::default);
        if assets.revision == revision && !assets.entries.is_empty() || assets.catalog_pending {
            return;
        }
        assets.catalog_pending = true;
    }
    let inner2 = inner.clone();
    let base2 = base.to_string();
    let callback = Rc::new(move |status, body: String| {
        if let Some(a) = inner2
            .borrow_mut()
            .host_mut()
            .editor_state_mut()
            .editor_ui
            .managed_assets
            .as_mut()
        {
            a.catalog_pending = false;
        }
        let parsed = serde_json::from_str::<Value>(&body);
        let result = parsed.map_err(|e| e.to_string()).and_then(|value| {
            if status != 200 {
                return Err(format!("Asset catalogue failed: {body}"));
            }
            let revision = value["revision"].as_u64().ok_or("Asset revision missing")?;
            let entries = value["assets"]
                .as_array()
                .ok_or("Asset entries missing")?
                .clone();
            let presets: Vec<_> = entries
                .iter()
                .filter(|a| a["kind"] == "theme-preset")
                .filter_map(|a| a["id"].as_str().map(str::to_owned))
                .collect();
            let mut context = inner2.borrow_mut();
            context
                .host_mut()
                .editor_state_mut()
                .editor_ui
                .managed_assets
                .as_mut()
                .ok_or("Managed view disappeared")?
                .install(revision, entries)?;
            context.host_mut().mark_editor_state_dirty();
            context.repaint().map_err(|e| format!("{e:?}"))?;
            drop(context);
            hydrate_presets(&inner2, &base2, revision, presets);
            Ok(())
        });
        if let Err(error) = result {
            report(&inner2, &error);
        }
    });
    if !live_sync::get_with_status(&format!("{base}/api/assets"), callback) {
        if let Some(a) = inner
            .borrow_mut()
            .host_mut()
            .editor_state_mut()
            .editor_ui
            .managed_assets
            .as_mut()
        {
            a.catalog_pending = false;
        }
        report(inner, "Asset catalogue request could not start");
    }
}

fn hydrate_presets<C: RepaintContext + 'static>(
    inner: &Rc<RefCell<C>>,
    base: &str,
    revision: u64,
    ids: Vec<String>,
) {
    let batch = Rc::new(RefCell::new(vec![None; ids.len()]));
    let failed = Rc::new(Cell::new(false));
    if ids.is_empty() {
        inner
            .borrow_mut()
            .host_mut()
            .editor_state_mut()
            .theme_presets
            .clear();
    }
    for (index, id) in ids.into_iter().enumerate() {
        let inner = inner.clone();
        let report_inner = inner.clone();
        let batch = batch.clone();
        let failed = failed.clone();
        let start_failed = failed.clone();
        let url = format!(
            "{base}/api/assets/theme-preset/{}",
            js_sys::encode_uri_component(&id)
        );
        let callback = Rc::new(move |status, raw: String| {
            if failed.get() {
                return;
            }
            let result = serde_json::from_str::<Value>(&raw)
                .map_err(|e| e.to_string())
                .and_then(|value| {
                    if status != 200 {
                        return Err(format!("Theme preset read failed: {raw}"));
                    }
                    let (name, themes, variables) =
                        op_editor_core::theme_presets::parse_preset_file(
                            &value["payload"]["preset"].to_string(),
                        )
                        .ok_or("Invalid saved preset")?;
                    batch.borrow_mut()[index] = Some(op_editor_core::theme_presets::ThemePreset {
                        id: id.clone(),
                        name,
                        themes,
                        variables,
                        created_at: 0,
                    });
                    let Some(presets) = batch.borrow().iter().cloned().collect::<Option<Vec<_>>>()
                    else {
                        return Ok(());
                    };
                    let mut context = inner.borrow_mut();
                    let state = context.host_mut().editor_state_mut();
                    if state
                        .editor_ui
                        .managed_assets
                        .as_ref()
                        .is_none_or(|a| a.revision != revision)
                    {
                        return Ok(());
                    }
                    state.theme_presets = presets;
                    context.host_mut().mark_editor_state_dirty();
                    context.repaint().map_err(|e| format!("{e:?}"))?;
                    Ok(())
                });
            if let Err(error) = result {
                failed.set(true);
                report(&inner, &error);
            }
        });
        if !live_sync::get_with_status(&url, callback) {
            start_failed.set(true);
            report(&report_inner, "Theme preset request could not start");
        }
    }
}

pub(crate) fn start<C: RepaintContext + 'static>(
    inner: &Rc<RefCell<C>>,
    base: &str,
    sync: crate::live_sync_glue::SharedSync,
) {
    let client = format!(
        "editor-{}-{}",
        js_sys::Date::now() as u64,
        (js_sys::Math::random() * 1e9) as u64
    );
    let inner = inner.clone();
    let base = base.to_string();
    let control_busy = Rc::new(Cell::new(false));
    let last_error = RefCell::new(None::<String>);
    let tick = Rc::new(move || {
        if crate::render_mode::render_only()
            || inner
                .borrow()
                .host()
                .editor_state()
                .editor_ui
                .managed_assets
                .is_none()
        {
            return;
        }
        let error = inner
            .borrow()
            .host()
            .editor_state()
            .editor_ui
            .managed_assets
            .as_ref()
            .and_then(|a| a.error.clone());
        if error != *last_error.borrow() {
            *last_error.borrow_mut() = error.clone();
            if let Some(error) = error {
                report(&inner, &error);
            }
        }
        drain_action(&inner, &base, &sync);
        if control_busy.replace(true) {
            return;
        }
        let inner2 = inner.clone();
        let client2 = client.clone();
        let url = format!("{base}/api/mcp/editor-control?client={client}");
        let url2 = url.clone();
        let busy = control_busy.clone();
        let callback = Rc::new(move |status, raw: String| {
            busy.set(false);
            let Ok(value) = serde_json::from_str::<Value>(&raw) else {
                report(&inner2, "Invalid editor control response");
                return;
            };
            if status != 200 {
                report(&inner2, &format!("Editor control failed: {raw}"));
                return;
            }
            let Some(requests) = value["requests"].as_array() else {
                report(&inner2, "Editor control requests missing");
                return;
            };
            for request in requests {
                let outcome = {
                    let mut context = inner2.borrow_mut();
                    let result = apply_editor_control(
                        context.host_mut().editor_state_mut(),
                        request["name"].as_str().unwrap_or(""),
                        &request["args"],
                        |next| {
                            crate::web_settings::theme::save_if_changed(next)
                                .map(|_| ())
                                .map_err(|e| e.to_string())
                        },
                    );
                    if result.is_ok() {
                        context.host_mut().mark_editor_state_dirty();
                        context.repaint().map_err(|e| format!("{e:?}")).and(result)
                    } else {
                        result
                    }
                };
                let mut ack = json!({"id":request["id"],"client":client2});
                match outcome {
                    Ok(value) => ack["value"] = value,
                    Err(error) => ack["error"] = json!(error),
                }
                let ack_inner = inner2.clone();
                let ack_callback = Rc::new(move |status, body: String| {
                    if status != 200 {
                        report(
                            &ack_inner,
                            &format!("Editor acknowledgement failed: {body}"),
                        );
                    }
                });
                if !live_sync::post_json_with_status(&url2, &ack.to_string(), ack_callback) {
                    report(&inner2, "Editor acknowledgement could not start");
                }
            }
        });
        if !live_sync::get_with_status(&url, callback) {
            control_busy.set(false);
            report(&inner, "Editor control request could not start");
        }
    });
    if let Err(error) = live_sync::start_interval(200, tick) {
        web_sys::console::error_1(&error);
    }
}

fn drain_action<C: RepaintContext + 'static>(
    inner: &Rc<RefCell<C>>,
    base: &str,
    sync: &crate::live_sync_glue::SharedSync,
) {
    let (name, args, generation) = {
        let mut context = inner.borrow_mut();
        let state = context.host_mut().editor_state_mut();
        let generation = state.document_generation();
        let pair = (generation, state.revision);
        let Some(assets) = state.editor_ui.managed_assets.as_mut() else {
            return;
        };
        if assets.busy {
            return;
        }
        let Some((name, args)) = assets.pending.pop_front() else {
            return;
        };
        if ["save_theme_preset", "load_theme_preset"].contains(&name.as_str())
            && !sync.borrow().gate.is_synced(pair)
        {
            assets.error =
                Some("Synchronize the current design before applying or saving an asset".into());
            return;
        }
        assets.busy = true;
        (name, args, generation)
    };
    let request = json!({"name":name,"arguments":args});
    let inner2 = inner.clone();
    let callback = Rc::new(move |status, raw: String| {
        let result = serde_json::from_str::<Value>(&raw)
            .map_err(|e| e.to_string())
            .and_then(|reply| {
                if status != 200 || reply["isError"] == true {
                    return Err(format!("Asset operation failed: {raw}"));
                }
                let mut context = inner2.borrow_mut();
                let state = context.host_mut().editor_state_mut();
                if let Some(assets) = state.editor_ui.managed_assets.as_mut() {
                    assets.busy = false;
                }
                if state.document_generation() != generation {
                    return Ok(());
                }
                let value = &reply["structuredContent"];
                if name == "get_style_guide" || name == "import_design_md" {
                    let (id, markdown) = if name == "get_style_guide" {
                        (value["id"].as_str(), value["content"].as_str())
                    } else {
                        (
                            value["asset"]["id"].as_str(),
                            value["asset"]["payload"]["markdown"].as_str(),
                        )
                    };
                    let markdown = markdown.ok_or("Style receipt omitted Markdown")?;
                    let snap = state.snapshot_for_history();
                    let spec = op_editor_core::parse_design_md(markdown);
                    state.sync_design_md_to_variables(&spec);
                    state.doc.design_md = Some(spec);
                    state.history_push_past(snap);
                    state.editor_ui.pinned_style_guide = id.map(str::to_owned);
                    state.editor_ui.close_asset_center_style_import();
                } else if name == "delete_style_guide"
                    && state.editor_ui.pinned_style_guide.as_deref() == args["id"].as_str()
                {
                    state.editor_ui.clear_pinned_style_guide();
                }
                context.host_mut().mark_editor_state_dirty();
                context.repaint().map_err(|e| format!("{e:?}"))?;
                Ok(())
            });
        if let Err(error) = result {
            report(&inner2, &error);
        }
    });
    if !live_sync::post_json_with_status(
        &format!("{base}/api/assets/tools"),
        &request.to_string(),
        callback,
    ) {
        report(inner, "Asset operation request could not start");
    }
}
