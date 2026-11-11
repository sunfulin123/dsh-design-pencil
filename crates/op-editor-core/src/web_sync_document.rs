//! Full-document decoding and metadata for web synchronization.

use jian_ops_schema::PenDocument;

use super::{WebSyncClient, WebSyncDocument, WebSyncError};

#[derive(Debug, Default, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct WireEditorMeta {
    #[serde(default, alias = "active_page_index")]
    active_page_index: Option<usize>,
    #[serde(default, alias = "preserve_authored_geometry")]
    preserve_authored_geometry: Option<bool>,
    #[serde(default, deserialize_with = "crate::Viewport::deserialize_optional")]
    viewport: Option<crate::Viewport>,
}

impl WebSyncClient {
    pub(super) fn next_document_with_view_force(
        &self,
        body: &str,
        force: bool,
    ) -> Result<Option<WebSyncDocument>, WebSyncError> {
        self.next_document_with_view_force_using(body, force, |_, error| {
            Err(WebSyncError::DocumentParse(error.to_string()))
        })
    }

    pub(super) fn next_document_with_view_force_using(
        &self,
        body: &str,
        force: bool,
        fallback: impl FnOnce(
            &serde_json::Value,
            serde_json::Error,
        ) -> Result<PenDocument, WebSyncError>,
    ) -> Result<Option<WebSyncDocument>, WebSyncError> {
        let value: serde_json::Value =
            serde_json::from_str(body).map_err(|e| WebSyncError::ResponseParse(e.to_string()))?;
        let document = value.get("document").ok_or(WebSyncError::MissingDocument)?;
        self.next_document_from_value(&value, document.get("editorMeta"), force, || {
            match serde_json::from_value(document.clone()) {
                Ok(canonical) => Ok(canonical),
                Err(error) => fallback(document, error),
            }
        })
    }

    /// Shared tail of a document pull: staleness check, wrapper metadata,
    /// and `build_document` only when the reply is newer than what was applied.
    pub(crate) fn next_document_from_value(
        &self,
        value: &serde_json::Value,
        editor_meta: Option<&serde_json::Value>,
        force: bool,
        build_document: impl FnOnce() -> Result<PenDocument, WebSyncError>,
    ) -> Result<Option<WebSyncDocument>, WebSyncError> {
        let version = value
            .get("version")
            .and_then(serde_json::Value::as_u64)
            .ok_or(WebSyncError::MissingVersion)?;
        if self.initialized && version < self.applied_version {
            return Ok(None);
        }
        let nested_meta = editor_meta
            .and_then(|meta| serde_json::from_value::<WireEditorMeta>(meta.clone()).ok())
            .unwrap_or_default();
        let viewport = value
            .get("viewport")
            .map(|value| crate::Viewport::deserialize_optional(value).ok().flatten())
            .unwrap_or(nested_meta.viewport);
        let viewport_changed = viewport != self.applied_viewport;
        if self.initialized && version == self.applied_version && !viewport_changed && !force {
            return Ok(None);
        }
        let active_page_index = value
            .get("activePageIndex")
            .and_then(serde_json::Value::as_u64)
            .and_then(|index| usize::try_from(index).ok())
            .or(nested_meta.active_page_index)
            .unwrap_or(0);
        let preserve_authored_geometry = value
            .get("preserveAuthoredGeometry")
            .and_then(serde_json::Value::as_bool)
            .or(nested_meta.preserve_authored_geometry)
            .unwrap_or(false);
        let doc = build_document()?;
        let scenario = value
            .get("scenario")
            .and_then(serde_json::Value::as_str)
            .and_then(|name| std::str::FromStr::from_str(name).ok());
        Ok(Some(WebSyncDocument {
            document: doc,
            version,
            active_page_index,
            preserve_authored_geometry,
            scenario,
            viewport,
            viewport_changed,
            metadata_only_push: value.get("metadataOnlyPush").and_then(|v| v.as_bool())
                == Some(true),
        }))
    }
}
