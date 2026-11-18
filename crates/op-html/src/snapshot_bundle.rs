//! Browser script shared with the Chrome extension capture bundle.

/// Self-contained browser script. Keep the source order in sync with the extension bundler.
pub const SNAPSHOT_EXTRACTOR_JS: &str = concat!(
    include_str!("../assets/snapshot-extractor.js"),
    include_str!("../assets/snapshot-extractor-decorations.js"),
);
