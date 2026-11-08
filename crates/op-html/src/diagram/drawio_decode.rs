use base64::{engine::general_purpose::STANDARD, Engine};
use flate2::{Decompress, FlushDecompress, Status};

use super::error::DiagramError;

pub const MAX_DRAWIO_COMPRESSED_BYTES: usize = 1024 * 1024;
/// Caps the inflated URI-encoded payload before percent decoding. The resulting
/// XML cannot be larger, so the same bound also protects its UTF-8 bytes.
pub const MAX_DRAWIO_EXPANDED_BYTES: usize = 8 * 1024 * 1024;
pub const MAX_DRAWIO_SOURCE_BYTES: usize = MAX_DRAWIO_EXPANDED_BYTES;

pub(super) fn decode(payload: &str) -> Result<String, DiagramError> {
    let payload = payload.trim_matches(|c| matches!(c, ' ' | '\t' | '\r' | '\n'));
    if payload.len() > MAX_DRAWIO_COMPRESSED_BYTES.div_ceil(3) * 4 {
        return Err(byte_limit("compressed input", MAX_DRAWIO_COMPRESSED_BYTES));
    }
    let compressed = STANDARD
        .decode(payload)
        .map_err(|error| DiagramError::DrawioBase64 {
            detail: error.to_string(),
        })?;
    if compressed.len() > MAX_DRAWIO_COMPRESSED_BYTES {
        return Err(byte_limit("compressed input", MAX_DRAWIO_COMPRESSED_BYTES));
    }
    let expanded = inflate(&compressed)?;
    let mut decoded = Vec::with_capacity(expanded.len());
    let mut offset = 0;
    while offset < expanded.len() {
        if expanded[offset] == b'%' {
            let pair = expanded
                .get(offset + 1..offset + 3)
                .and_then(|pair| {
                    let high = (pair[0] as char).to_digit(16)?;
                    let low = (pair[1] as char).to_digit(16)?;
                    Some((high * 16 + low) as u8)
                })
                .ok_or(DiagramError::DrawioPercent { offset })?;
            decoded.push(pair);
            offset += 3;
        } else {
            // This is URI decoding, not form decoding: a literal '+' stays '+'.
            decoded.push(expanded[offset]);
            offset += 1;
        }
    }
    String::from_utf8(decoded).map_err(|error| DiagramError::DrawioUtf8 {
        offset: error.utf8_error().valid_up_to(),
    })
}

fn inflate(compressed: &[u8]) -> Result<Vec<u8>, DiagramError> {
    let mut decoder = Decompress::new(false);
    let mut expanded = Vec::new();
    let mut input_offset = 0;
    let mut chunk = [0u8; 8192];
    loop {
        let before_in = decoder.total_in();
        let before_out = decoder.total_out();
        // One sentinel byte detects overflow without allocating an unbounded
        // decompression buffer, including when output ends exactly at the cap.
        let available = (MAX_DRAWIO_EXPANDED_BYTES + 1 - expanded.len()).min(chunk.len());
        let status = decoder
            .decompress(
                &compressed[input_offset..],
                &mut chunk[..available],
                FlushDecompress::None,
            )
            .map_err(|error| DiagramError::DrawioDeflate {
                detail: error.to_string(),
            })?;
        let consumed = (decoder.total_in() - before_in) as usize;
        let produced = (decoder.total_out() - before_out) as usize;
        input_offset += consumed;
        if produced > MAX_DRAWIO_EXPANDED_BYTES - expanded.len() {
            return Err(byte_limit("expanded payload", MAX_DRAWIO_EXPANDED_BYTES));
        }
        expanded.extend_from_slice(&chunk[..produced]);
        if status == Status::StreamEnd {
            if input_offset != compressed.len() {
                return Err(DiagramError::DrawioDeflate {
                    detail: "trailing bytes after raw stream".into(),
                });
            }
            return Ok(expanded);
        }
        if consumed == 0 && produced == 0 {
            return Err(DiagramError::DrawioDeflate {
                detail: "truncated or empty raw stream".into(),
            });
        }
    }
}

pub(super) fn byte_limit(stage: &'static str, limit: usize) -> DiagramError {
    DiagramError::DrawioByteLimit { stage, limit }
}
