//! SVG path data (as returned by the Figma REST `fillGeometry` /
//! `strokeGeometry` `path` field) → the binary opcode command stream that
//! [`crate::vector_decoder::decode_figma_path_blob`] reads. Encoding into the
//! `.fig` blob format lets REST geometry reuse the exact decoder, fill-rule
//! and instance-scaling logic of the binary importer.

const CMD_CLOSE: u8 = 0x00;
const CMD_MOVE: u8 = 0x01;
const CMD_LINE: u8 = 0x02;
const CMD_QUAD: u8 = 0x03;
const CMD_CUBIC: u8 = 0x04;

struct Tokens<'a> {
    bytes: &'a [u8],
    pos: usize,
}

impl Tokens<'_> {
    fn skip_separators(&mut self) {
        while self.pos < self.bytes.len()
            && matches!(self.bytes[self.pos], b' ' | b',' | b'\n' | b'\r' | b'\t')
        {
            self.pos += 1;
        }
    }

    fn at_end(&mut self) -> bool {
        self.skip_separators();
        self.pos >= self.bytes.len()
    }

    fn command(&mut self) -> Option<u8> {
        self.skip_separators();
        let c = *self.bytes.get(self.pos)?;
        if c.is_ascii_alphabetic() && !matches!(c, b'e' | b'E') {
            self.pos += 1;
            Some(c)
        } else {
            None
        }
    }

    fn number(&mut self) -> Option<f64> {
        self.skip_separators();
        let start = self.pos;
        let mut seen_dot = false;
        let mut seen_exp = false;
        if matches!(self.bytes.get(self.pos), Some(b'+' | b'-')) {
            self.pos += 1;
        }
        while let Some(&c) = self.bytes.get(self.pos) {
            match c {
                b'0'..=b'9' => self.pos += 1,
                b'.' if !seen_dot && !seen_exp => {
                    seen_dot = true;
                    self.pos += 1;
                }
                b'e' | b'E' if !seen_exp && self.pos > start => {
                    seen_exp = true;
                    self.pos += 1;
                    if matches!(self.bytes.get(self.pos), Some(b'+' | b'-')) {
                        self.pos += 1;
                    }
                }
                _ => break,
            }
        }
        std::str::from_utf8(&self.bytes[start..self.pos])
            .ok()?
            .parse::<f64>()
            .ok()
            .filter(|v| v.is_finite())
    }
}

fn push(blob: &mut Vec<u8>, cmd: u8, coords: &[f64]) {
    blob.push(cmd);
    for v in coords {
        blob.extend_from_slice(&(*v as f32).to_le_bytes());
    }
}

/// Encode an SVG path string. Supports absolute and relative
/// M/L/H/V/C/S/Q/T/Z with implicit operand repetition (Figma emits absolute
/// M/L/C/Q/Z). Elliptical arcs never appear in Figma geometry and make the
/// encoding fail. Returns `None` for an empty or malformed path.
pub(crate) fn encode_svg_path(d: &str) -> Option<Vec<u8>> {
    let mut t = Tokens {
        bytes: d.as_bytes(),
        pos: 0,
    };
    let mut blob = Vec::new();
    let (mut cx, mut cy) = (0.0_f64, 0.0_f64);
    let (mut sx, mut sy) = (0.0_f64, 0.0_f64);
    // Last control point for S/T reflection: (x, y, was_cubic).
    let mut last_ctrl: Option<(f64, f64, bool)> = None;
    let mut cmd = t.command()?;
    loop {
        let rel = cmd.is_ascii_lowercase();
        let (ox, oy) = if rel { (cx, cy) } else { (0.0, 0.0) };
        match cmd.to_ascii_uppercase() {
            b'Z' => {
                push(&mut blob, CMD_CLOSE, &[]);
                (cx, cy) = (sx, sy);
                last_ctrl = None;
            }
            b'M' => {
                let (x, y) = (t.number()? + ox, t.number()? + oy);
                push(&mut blob, CMD_MOVE, &[x, y]);
                (cx, cy, sx, sy) = (x, y, x, y);
                last_ctrl = None;
                // Operands repeated after a moveto are implicit linetos.
                cmd = if rel { b'l' } else { b'L' };
            }
            b'L' => {
                let (x, y) = (t.number()? + ox, t.number()? + oy);
                push(&mut blob, CMD_LINE, &[x, y]);
                (cx, cy) = (x, y);
                last_ctrl = None;
            }
            b'H' => {
                let x = t.number()? + ox;
                push(&mut blob, CMD_LINE, &[x, cy]);
                cx = x;
                last_ctrl = None;
            }
            b'V' => {
                let y = t.number()? + oy;
                push(&mut blob, CMD_LINE, &[cx, y]);
                cy = y;
                last_ctrl = None;
            }
            b'C' | b'S' => {
                let (x1, y1) = if cmd.eq_ignore_ascii_case(&b'S') {
                    match last_ctrl {
                        Some((lx, ly, true)) => (2.0 * cx - lx, 2.0 * cy - ly),
                        _ => (cx, cy),
                    }
                } else {
                    (t.number()? + ox, t.number()? + oy)
                };
                let (x2, y2) = (t.number()? + ox, t.number()? + oy);
                let (x, y) = (t.number()? + ox, t.number()? + oy);
                push(&mut blob, CMD_CUBIC, &[x1, y1, x2, y2, x, y]);
                last_ctrl = Some((x2, y2, true));
                (cx, cy) = (x, y);
            }
            b'Q' | b'T' => {
                let (x1, y1) = if cmd.eq_ignore_ascii_case(&b'T') {
                    match last_ctrl {
                        Some((lx, ly, false)) => (2.0 * cx - lx, 2.0 * cy - ly),
                        _ => (cx, cy),
                    }
                } else {
                    (t.number()? + ox, t.number()? + oy)
                };
                let (x, y) = (t.number()? + ox, t.number()? + oy);
                push(&mut blob, CMD_QUAD, &[x1, y1, x, y]);
                last_ctrl = Some((x1, y1, false));
                (cx, cy) = (x, y);
            }
            _ => return None,
        }
        if t.at_end() {
            break;
        }
        if let Some(next) = t.command() {
            cmd = next;
        } else if cmd.eq_ignore_ascii_case(&b'Z') {
            // Bare numbers after a close path are malformed.
            return None;
        }
    }
    (!blob.is_empty()).then_some(blob)
}

#[cfg(test)]
mod tests {
    use super::encode_svg_path;
    use crate::vector_decoder::decode_figma_path_blob;

    fn round_trip(d: &str) -> String {
        decode_figma_path_blob(&encode_svg_path(d).expect("encodes")).expect("decodes")
    }

    #[test]
    fn absolute_figma_paths_round_trip_through_the_binary_decoder() {
        let d = "M0 0L24 0L24 12.5Q24 24 12 24C5.37 24 0 18.63 0 12Z";
        assert_eq!(
            round_trip(d),
            "M0 0 L24 0 L24 12.5 Q24 24 12 24 C5.37 24 0 18.63 0 12 Z"
        );
    }

    #[test]
    fn relative_and_shorthand_commands_resolve_to_absolute_points() {
        assert_eq!(
            round_trip("m10 10 h5 v5 l-5 0 z"),
            "M10 10 L15 10 L15 15 L10 15 Z"
        );
        assert_eq!(round_trip("M0 0 L1 1 2 2"), "M0 0 L1 1 L2 2");
        assert_eq!(round_trip("M0 0 1e1 5"), "M0 0 L10 5");
    }

    #[test]
    fn empty_and_arc_paths_are_rejected() {
        assert!(encode_svg_path("").is_none());
        assert!(encode_svg_path("M0 0 A5 5 0 0 1 10 10").is_none());
    }
}
