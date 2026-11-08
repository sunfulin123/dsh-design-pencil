use std::io::{self, Write};

pub(super) const SYNC_MAX_BODY_BYTES: usize = 2 * 1024 * 1024;
pub(super) enum SyncDocumentJson {
    Ready(String),
    Oversize,
    Failed,
}

struct CappedJsonWriter {
    bytes: Vec<u8>,
    exceeded: bool,
}

impl Write for CappedJsonWriter {
    fn write(&mut self, bytes: &[u8]) -> io::Result<usize> {
        if self.bytes.len().saturating_add(bytes.len()) > SYNC_MAX_BODY_BYTES {
            self.exceeded = true;
            return Err(io::Error::new(
                io::ErrorKind::FileTooLarge,
                "sync document exceeds limit",
            ));
        }
        self.bytes.extend_from_slice(bytes);
        Ok(bytes.len())
    }
    fn flush(&mut self) -> io::Result<()> {
        Ok(())
    }
}

pub(super) fn serialize_sync_document(doc: &op_editor_core::PenDocument) -> SyncDocumentJson {
    let mut writer = CappedJsonWriter {
        bytes: Vec::new(),
        exceeded: false,
    };
    if serde_json::to_writer(&mut writer, doc).is_err() {
        return if writer.exceeded {
            SyncDocumentJson::Oversize
        } else {
            SyncDocumentJson::Failed
        };
    }

    match String::from_utf8(writer.bytes) {
        Ok(json) => SyncDocumentJson::Ready(json),
        Err(_) => SyncDocumentJson::Failed,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn capped_writer_accepts_exact_limit_then_rejects_another_byte() {
        let mut writer = CappedJsonWriter {
            bytes: Vec::new(),
            exceeded: false,
        };
        writer
            .write_all(&vec![b'x'; SYNC_MAX_BODY_BYTES])
            .expect("exact cap");
        assert_eq!(writer.bytes.len(), SYNC_MAX_BODY_BYTES);
        assert!(writer.write_all(b"x").is_err());
        assert!(writer.exceeded);
        assert_eq!(writer.bytes.len(), SYNC_MAX_BODY_BYTES);
    }
}
