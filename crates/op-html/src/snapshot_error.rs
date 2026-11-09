//! Reasons a browser-snapshot payload is rejected before mapping.

/// A browser-snapshot payload that could not be imported. `import_snapshot`
/// surfaces the `Display` text as the import's single warning, so the
/// rendering must stay byte-identical to the strings this replaced.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum SnapshotError {
    /// Payload exceeds [`super::MAX_SNAPSHOT_BYTES`].
    TooLarge,
    /// The payload is not parseable JSON; carries the serde message
    /// (`serde_json::Error` is neither `Clone` nor `Eq`).
    InvalidJson(String),
    /// The payload parsed but is not a JSON object.
    NotAnObject,
    /// A `version` field that this importer does not understand.
    UnsupportedVersion(u64),
    /// No `version` field at all.
    MissingVersion,
    /// No `root` object.
    MissingRoot,
    /// The root node's `rect` is absent or non-finite.
    InvalidRootRect,
    /// The root element produced no `PenNode`.
    RootConversionFailed,
}

impl std::fmt::Display for SnapshotError {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::TooLarge => formatter.write_str("snapshot JSON exceeds the 48 MiB input limit"),
            Self::InvalidJson(detail) => write!(formatter, "invalid snapshot JSON: {detail}"),
            Self::NotAnObject => formatter.write_str("snapshot JSON must be an object"),
            Self::UnsupportedVersion(version) => {
                write!(
                    formatter,
                    "unsupported snapshot version {version}; expected 1"
                )
            }
            Self::MissingVersion => {
                formatter.write_str("snapshot version is required and must equal 1")
            }
            Self::MissingRoot => formatter.write_str("snapshot root is required"),
            Self::InvalidRootRect => {
                formatter.write_str("snapshot root rect is missing or invalid")
            }
            Self::RootConversionFailed => {
                formatter.write_str("snapshot root could not be converted")
            }
        }
    }
}

impl std::error::Error for SnapshotError {}
