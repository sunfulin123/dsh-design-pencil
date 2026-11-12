/** OpenPencil solid paint, stroke, corner, and text property decoding. */

function isObjectRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseRgbaHex(raw) {
  if (typeof raw !== 'string') return undefined;
  const hex = raw.trim().replace(/^#/u, '');
  if (/^[0-9a-f]{3}$/iu.test(hex)) {
    return [
      Number.parseInt(hex[0] + hex[0], 16),
      Number.parseInt(hex[1] + hex[1], 16),
      Number.parseInt(hex[2] + hex[2], 16),
      255,
    ];
  }
  if (/^[0-9a-f]{6}$/iu.test(hex)) {
    return [
      Number.parseInt(hex.slice(0, 2), 16),
      Number.parseInt(hex.slice(2, 4), 16),
      Number.parseInt(hex.slice(4, 6), 16),
      255,
    ];
  }
  if (/^[0-9a-f]{8}$/iu.test(hex)) {
    return [
      Number.parseInt(hex.slice(0, 2), 16),
      Number.parseInt(hex.slice(2, 4), 16),
      Number.parseInt(hex.slice(4, 6), 16),
      Number.parseInt(hex.slice(6, 8), 16),
    ];
  }
  return undefined;
}

function resolveVarColor(raw, variables) {
  if (typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  if (!trimmed.startsWith('$')) return trimmed;
  const entry = variables?.[trimmed.slice(1)] ?? variables?.[trimmed];
  if (typeof entry === 'string') return entry;
  if (!isObjectRecord(entry)) return undefined;
  if (typeof entry.value === 'string') return entry.value;
  const first = Array.isArray(entry.value) ? entry.value.at(0) : undefined;
  return isObjectRecord(first) && typeof first.value === 'string' ? first.value : undefined;
}

function parseSingleFillEntry(first, variables) {
  if (typeof first.type === 'string' && first.type !== 'solid') return { kind: 'complex' };
  const rgba = parseRgbaHex(resolveVarColor(first.color, variables));
  if (rgba === undefined) return { kind: 'complex' };
  const opacity = typeof first.opacity === 'number' && Number.isFinite(first.opacity)
    ? Math.max(0, Math.min(1, first.opacity))
    : 1;
  return { kind: 'solid', rgba: [rgba[0], rgba[1], rgba[2], Math.round(rgba[3] * opacity)] };
}

export function extractSolidFillRgba(fill, variables) {
  if (fill === undefined || fill === null || (Array.isArray(fill) && fill.length === 0)) {
    return { kind: 'none' };
  }
  if (typeof fill === 'string') {
    const rgba = parseRgbaHex(resolveVarColor(fill, variables));
    return rgba ? { kind: 'solid', rgba } : { kind: 'complex' };
  }
  const items = Array.isArray(fill) ? fill : [fill];
  const visible = items.filter(
    (item) => isObjectRecord(item) && item.visible !== false && item.enabled !== false,
  );
  if (visible.length === 0) return { kind: 'none' };
  return visible.length === 1 ? parseSingleFillEntry(visible[0], variables) : { kind: 'complex' };
}

export function extractStrokeInfo(stroke, variables) {
  if (!isObjectRecord(stroke)) return undefined;
  const thickness = typeof stroke.thickness === 'number' && Number.isFinite(stroke.thickness)
    ? stroke.thickness
    : typeof stroke.width === 'number' && Number.isFinite(stroke.width)
      ? stroke.width
      : 1;
  if (thickness <= 0) return undefined;
  const resolved = extractSolidFillRgba(stroke.fill ?? stroke.color, variables);
  return resolved.kind === 'solid' ? { rgba: resolved.rgba, width: thickness } : undefined;
}

export function extractCornerRadius(raw) {
  if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) return raw;
  if (Array.isArray(raw) && typeof raw[0] === 'number' && Number.isFinite(raw[0]) && raw[0] > 0) {
    return raw[0];
  }
  return 0;
}

export function extractPlainText(node) {
  if (typeof node.content === 'string') return node.content;
  if (Array.isArray(node.content)) {
    return node.content
      .map((seg) => (isObjectRecord(seg) && typeof seg.text === 'string' ? seg.text : ''))
      .join('');
  }
  return typeof node.text === 'string' ? node.text : '';
}
