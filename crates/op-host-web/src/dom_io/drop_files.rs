use super::*;

/// Route dropped files through the same ingestion as the file menu and picker.
pub(super) fn handle_drop_event<C: RepaintContext + 'static>(
    inner: &InnerRc<C>,
    evt: &web_sys::DragEvent,
) {
    if inner.borrow().host().editor_state().editor_ui.preview.mode {
        evt.prevent_default();
        return;
    }
    let Some(dt) = evt.data_transfer() else {
        return;
    };
    let inner_for_directory = inner.clone();
    let directory_generation = Rc::new(std::cell::Cell::new(0));
    let directory_generation_cb = directory_generation.clone();
    if drop_entries::read_dropped_directory_project(
        &dt,
        Box::new(move |result| {
            let generation = directory_generation_cb.get();
            match result {
                Ok(files) => {
                    let inner_for_finish = inner_for_directory.clone();
                    html_directory_session::start(
                        files,
                        document_import_activity(
                            &inner_for_directory,
                            generation,
                            ImportSource::Html,
                        ),
                        Box::new(move |result| {
                            finish_html_import(&inner_for_finish, generation, result);
                        }),
                    );
                }
                Err(error) => {
                    finish_html_import(&inner_for_directory, generation, Err(error));
                }
            }
        }),
    ) {
        directory_generation.set(begin_html_document_import(inner));
        return;
    }
    let Some(files) = dt.files() else {
        return;
    };
    let mut dropped = Vec::with_capacity(files.length() as usize);
    for index in 0..files.length() {
        if let Some(file) = files.get(index) {
            dropped.push(file);
        }
    }
    if dropped.is_empty() {
        return;
    }
    let kinds: Vec<_> = dropped
        .iter()
        .map(|file| file_actions::drop_kind(&file.name()))
        .collect();
    match file_actions::drop_batch_plan(&kinds) {
        DropBatchPlan::Individual => {
            for file in dropped {
                route_dropped_file(inner, file);
            }
        }
        DropBatchPlan::HtmlProject
        | DropBatchPlan::HtmlZip
        | DropBatchPlan::InvalidHtmlMix
        | DropBatchPlan::InvalidZipMix => import_html_batch(inner, dropped),
    }
}

pub(super) fn route_dropped_file<C: RepaintContext + 'static>(
    inner: &InnerRc<C>,
    file: web_sys::File,
) {
    let name = file.name();
    match file_actions::drop_kind(&name) {
        DropKind::Document => read_open_document_file(inner, file),
        DropKind::Figma => ingest_figma_file(inner, file),
        DropKind::Html | DropKind::Zip => import_html_batch(inner, vec![file]),
        DropKind::HtmlResource => {
            console_warn(&format!(
                "[drop] HTML resource must be dropped together with an HTML page: {name}"
            ));
        }
        DropKind::Svg => {
            let inner2 = inner.clone();
            read_file(
                file,
                ReadMode::Text,
                Box::new(move |value| match value.as_string() {
                    Some(svg) => insert_svg(&inner2, &svg, &name),
                    None => console_error("[import-svg] dropped file read produced no text"),
                }),
            );
        }
        DropKind::Image => {
            let inner2 = inner.clone();
            read_file(
                file,
                ReadMode::DataUrl,
                Box::new(move |value| match value.as_string() {
                    Some(url) => insert_image(&inner2, &url, &name),
                    None => console_error("[import-image] dropped file read produced no data URL"),
                }),
            );
        }
        DropKind::Unsupported => {
            console_warn(&format!("[drop] unsupported file type: {name}"));
        }
    }
}
