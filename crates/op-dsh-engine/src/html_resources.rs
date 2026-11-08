//! Resource maps the Node host passes with HTML imports.

use base64::Engine;
use std::collections::BTreeMap;

pub(crate) fn decode_resources_map(raw: Option<&str>) -> Result<BTreeMap<String, Vec<u8>>, String> {
    let Some(raw) = raw.filter(|s| !s.trim().is_empty()) else {
        return Ok(BTreeMap::new());
    };
    let encoded: BTreeMap<String, String> =
        serde_json::from_str(raw).map_err(|e| format!("invalid resourcesJson: {e}"))?;
    let mut out = BTreeMap::new();
    for (key, value) in encoded {
        let bytes = base64::engine::general_purpose::STANDARD
            .decode(value.trim())
            .map_err(|e| format!("invalid resource base64 for {key}: {e}"))?;
        out.insert(key, bytes);
    }
    Ok(out)
}

pub(crate) fn lookup_resource(resources: &BTreeMap<String, Vec<u8>>, url: &str) -> Option<Vec<u8>> {
    if let Some(bytes) = resources.get(url) {
        return Some(bytes.clone());
    }
    let stripped = url
        .strip_prefix(op_html::VIRTUAL_PROJECT_ORIGIN)
        .unwrap_or(url)
        .split(['?', '#'])
        .next()?
        .trim_start_matches('/');
    resources.get(stripped).cloned()
}
