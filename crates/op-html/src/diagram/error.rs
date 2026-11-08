use std::fmt;

#[derive(Debug, Clone, PartialEq)]
pub enum DiagramError {
    Empty,
    Syntax { detail: String },
    Unsupported { feature: String },
    UnknownNode { id: String },
    LimitExceeded,
    DrawioBase64 { detail: String },
    DrawioDeflate { detail: String },
    DrawioPercent { offset: usize },
    DrawioUtf8 { offset: usize },
    DrawioByteLimit { stage: &'static str, limit: usize },
}

impl fmt::Display for DiagramError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Empty => write!(f, "diagram contains no vertices"),
            Self::Syntax { detail } => write!(f, "invalid diagram: {detail}"),
            Self::Unsupported { feature } => write!(f, "unsupported diagram syntax: {feature}"),
            Self::UnknownNode { id } => write!(f, "connector references unknown vertex {id:?}"),
            Self::LimitExceeded => write!(f, "diagram exceeds 512 vertices or 2048 edges"),
            Self::DrawioBase64 { detail } => write!(f, "invalid draw.io base64: {detail}"),
            Self::DrawioDeflate { detail } => write!(f, "invalid draw.io raw DEFLATE: {detail}"),
            Self::DrawioPercent { offset } => {
                write!(f, "invalid draw.io percent escape at byte {offset}")
            }
            Self::DrawioUtf8 { offset } => {
                write!(f, "invalid draw.io UTF-8 at decoded byte {offset}")
            }
            Self::DrawioByteLimit { stage, limit } => {
                write!(f, "draw.io {stage} exceeds byte limit {limit}")
            }
        }
    }
}

impl std::error::Error for DiagramError {}

pub(super) fn syntax(detail: impl Into<String>) -> DiagramError {
    DiagramError::Syntax {
        detail: detail.into(),
    }
}

pub(super) fn unsupported(feature: impl Into<String>) -> DiagramError {
    DiagramError::Unsupported {
        feature: feature.into(),
    }
}
