use std::fmt;

use op_html::diagram::DiagramError;

#[derive(Debug)]
pub enum ConnectorError {
    MissingArgument { key: &'static str },
    UnknownEndpoint { id: String },
    UnsupportedGeometry { id: String },
    InvalidStyle { detail: String },
    IdSpaceExhausted,
    Diagram(DiagramError),
}

impl fmt::Display for ConnectorError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::MissingArgument { key } => write!(f, "{key} is required"),
            Self::UnknownEndpoint { id } => {
                write!(f, "endpoint {id:?} has no geometry on the active page")
            }
            Self::UnsupportedGeometry { id } => write!(
                f,
                "endpoint {id:?} has transformed, hidden or invalid geometry"
            ),
            Self::InvalidStyle { detail } => write!(f, "invalid connector style: {detail}"),
            Self::IdSpaceExhausted => write!(f, "document node id space exhausted"),
            Self::Diagram(error) => error.fmt(f),
        }
    }
}

impl std::error::Error for ConnectorError {}

impl From<DiagramError> for ConnectorError {
    fn from(error: DiagramError) -> Self {
        Self::Diagram(error)
    }
}
