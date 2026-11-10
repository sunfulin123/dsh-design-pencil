//! Classify user image sources for asset warnings.

/// TS `isLocalAssetPath` (document-assets.ts:22-28): everything that
/// is not a `data:` / `http(s):` / `blob:` URL or a same-origin
/// runtime route is a file-system asset path.
pub fn is_local_asset_path(path: &str) -> bool {
    let t = path.trim();
    if t.is_empty() {
        return false;
    }
    let lower = t.to_ascii_lowercase();
    if lower.starts_with("data:")
        || lower.starts_with("http:")
        || lower.starts_with("https:")
        || lower.starts_with("blob:")
    {
        return false;
    }
    // Same-origin runtime endpoints, not fs paths (TS
    // SAME_ORIGIN_ROUTE_RE).
    if t.starts_with("/api/") || t.starts_with("/_/") {
        return false;
    }
    true
}
