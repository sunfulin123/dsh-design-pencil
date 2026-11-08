//! Page-level incremental pulls (`GET /api/mcp/document/changes?since=N`).
//!
//! Instead of the whole document, the daemon sends only the pages changed
//! since the version this client applied. The client rebuilds the next
//! document from its own copy plus those pages and then applies it through
//! the same path as a full pull, so undo, metadata and camera handling stay
//! identical. Anything it cannot verify falls back to a full pull.

use jian_ops_schema::page::PenPage;
use jian_ops_schema::PenDocument;

use super::{WebSyncClient, WebSyncError};

/// Result of offering a page patch to the client.
#[derive(Debug, PartialEq, Eq)]
pub enum PagePatchOutcome {
    /// The patch cannot be applied safely; fetch the whole document.
    NeedsFull,
    /// The patch was handled; `true` when a newer document was applied.
    Applied(bool),
}

impl WebSyncClient {
    /// Builds the next document from `local` plus the changed pages in
    /// `body` and applies it like [`sync_with_view_state_force`]. The patch
    /// must describe changes since exactly the version this client applied,
    /// and the page list must match `local` page for page.
    ///
    /// [`sync_with_view_state_force`]: WebSyncClient::sync_with_view_state_force
    pub fn sync_page_patch_force<F>(
        &mut self,
        body: &str,
        local: &PenDocument,
        force: bool,
        apply: F,
    ) -> Result<PagePatchOutcome, WebSyncError>
    where
        F: FnOnce(super::WebSyncDocument) -> bool,
    {
        let value: serde_json::Value =
            serde_json::from_str(body).map_err(|e| WebSyncError::ResponseParse(e.to_string()))?;
        if !self.initialized
            || value.get("full").and_then(serde_json::Value::as_bool) != Some(false)
            || value.get("since").and_then(serde_json::Value::as_u64) != Some(self.applied_version)
        {
            return Ok(PagePatchOutcome::NeedsFull);
        }
        let Some(local_pages) = local.pages.as_ref() else {
            return Ok(PagePatchOutcome::NeedsFull);
        };
        let remote_ids: Option<Vec<&str>> = value
            .get("pageIds")
            .and_then(serde_json::Value::as_array)
            .map(|ids| ids.iter().filter_map(serde_json::Value::as_str).collect());
        let same_pages = remote_ids.is_some_and(|ids| {
            ids.len() == local_pages.len()
                && ids.iter().zip(local_pages).all(|(id, page)| *id == page.id)
        });
        if !same_pages {
            return Ok(PagePatchOutcome::NeedsFull);
        }
        let mut changed: Vec<PenPage> = Vec::new();
        for page in value
            .get("pages")
            .and_then(serde_json::Value::as_array)
            .into_iter()
            .flatten()
        {
            let page: PenPage = serde_json::from_value(page.clone())
                .map_err(|e| WebSyncError::DocumentParse(e.to_string()))?;
            if !local_pages.iter().any(|local| local.id == page.id) {
                return Ok(PagePatchOutcome::NeedsFull);
            }
            changed.push(page);
        }
        let next = self.next_document_from_value(&value, value.get("editorMeta"), force, || {
            let mut doc = local.clone();
            if let Some(pages) = doc.pages.as_mut() {
                for page in changed {
                    if let Some(slot) = pages.iter_mut().find(|slot| slot.id == page.id) {
                        *slot = page;
                    }
                }
            }
            Ok(doc)
        })?;
        self.commit_next_document(next, apply)
            .map(PagePatchOutcome::Applied)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn local() -> PenDocument {
        serde_json::from_value(json!({"version": "1.0.0", "children": [], "pages": [
            {"id": "p1", "name": "One", "children": [{"type": "rectangle", "id": "a", "width": 10, "height": 10}]},
            {"id": "p2", "name": "Two", "children": [{"type": "rectangle", "id": "b", "width": 10, "height": 10}]}
        ]}))
        .unwrap()
    }

    fn client_at(version: u64) -> WebSyncClient {
        let mut client = WebSyncClient::new();
        client.mark_applied(version);
        client
    }

    fn patch(since: u64, version: u64, ids: &[&str], pages: serde_json::Value) -> String {
        json!({"full": false, "since": since, "version": version, "pageIds": ids, "pages": pages,
               "activePageIndex": 0, "editorMeta": null})
        .to_string()
    }

    #[test]
    fn a_page_patch_replaces_only_the_changed_page() {
        let mut client = client_at(4);
        let body = patch(
            4,
            5,
            &["p1", "p2"],
            json!([
                {"id": "p2", "name": "Two", "children": [{"type": "rectangle", "id": "b", "width": 99, "height": 10}]}
            ]),
        );
        let mut applied = None;
        let outcome = client
            .sync_page_patch_force(&body, &local(), false, |next| {
                applied = Some(next);
                true
            })
            .unwrap();
        assert_eq!(outcome, PagePatchOutcome::Applied(true));
        let next = applied.unwrap();
        assert_eq!(next.version, 5);
        let pages = next.document.pages.unwrap();
        assert_eq!(
            pages[0],
            local().pages.unwrap()[0],
            "untouched pages are kept"
        );
        assert_eq!(
            serde_json::to_value(&pages[1].children[0]).unwrap()["width"],
            99.0
        );
        assert_eq!(client.last_version(), 5);
    }

    #[test]
    fn mismatched_patches_fall_back_to_a_full_pull() {
        let never = |_: super::super::WebSyncDocument| -> bool { panic!("must not apply") };
        let pages = json!([]);
        let cases = [
            (client_at(3), patch(4, 5, &["p1", "p2"], pages.clone())),
            (client_at(4), patch(4, 5, &["p2", "p1"], pages.clone())),
            (client_at(4), patch(4, 5, &["p1"], pages.clone())),
            (
                client_at(4),
                json!({"full": true, "version": 5}).to_string(),
            ),
            (
                client_at(4),
                patch(
                    4,
                    5,
                    &["p1", "p2"],
                    json!([{"id": "p9", "name": "X", "children": []}]),
                ),
            ),
            (
                WebSyncClient::new(),
                patch(0, 5, &["p1", "p2"], pages.clone()),
            ),
        ];
        for (mut client, body) in cases {
            assert_eq!(
                client
                    .sync_page_patch_force(&body, &local(), false, never)
                    .unwrap(),
                PagePatchOutcome::NeedsFull,
                "{body}"
            );
        }
    }
}
