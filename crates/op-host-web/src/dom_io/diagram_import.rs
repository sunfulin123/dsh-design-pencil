use super::browser_files::open_file_picker_with_error;
use super::{read_file, InnerRc, ReadMode};
use crate::repaint_ctx::RepaintContext;
use crate::widget_host::diagram_import::{DIAGRAM_FILE_ACCEPT, MAX_DIAGRAM_FILE_BYTES};

pub(super) fn import_diagram<C: RepaintContext + 'static>(inner: &InnerRc<C>) {
    let inner = inner.clone();
    let failed = inner.clone();
    open_file_picker_with_error(
        DIAGRAM_FILE_ACCEPT,
        Box::new(move |file| {
            let name = file.name();
            if file.size() > MAX_DIAGRAM_FILE_BYTES as f64 {
                fail(
                    &inner,
                    format!("Diagram exceeds the {MAX_DIAGRAM_FILE_BYTES}-byte import limit"),
                );
                return;
            }
            let (document, page) = {
                let b = inner.borrow();
                let state = b.host().editor_state();
                (b.host().document_epoch(), state.ui.active_page_index)
            };
            read_file(
                file,
                ReadMode::Text,
                Box::new(move |value| {
                    let mut b = inner.borrow_mut();
                    let state = b.host().editor_state();
                    if b.host().document_epoch() != document || state.ui.active_page_index != page {
                        b.host_mut().fail_diagram_import(
                            "Document or page changed while reading; import again".into(),
                        );
                    } else if let Some(source) = value.as_string() {
                        let (width, height) = b.viewport_size();
                        b.host_mut()
                            .import_diagram_file(&name, &source, width, height);
                    } else {
                        b.host_mut()
                            .fail_diagram_import("Could not read the selected diagram file".into());
                    }
                    let _ = b.repaint();
                }),
            );
        }),
        Box::new(move |_| {
            fail(&failed, "Could not open the diagram file picker".into());
        }),
    );
}

fn fail<C: RepaintContext>(inner: &InnerRc<C>, message: String) {
    let mut b = inner.borrow_mut();
    b.host_mut().fail_diagram_import(message);
    let _ = b.repaint();
}
