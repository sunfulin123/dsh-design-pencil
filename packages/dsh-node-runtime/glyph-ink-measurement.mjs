/** Pixel-contrast glyph ink bounds and reliability diagnostics. */

function sampleUniformBackgroundColor(image, bounds) {
  const { rx0, ry0, rx1, ry1 } = bounds;
  const borderSamples = [];
  const pushPixel = (px, py) => {
    const idx = (py * image.width + px) * 4;
    borderSamples.push([image.rgba[idx], image.rgba[idx + 1], image.rgba[idx + 2]]);
  };
  for (let px = rx0; px < rx1; px += 1) {
    pushPixel(px, ry0);
    pushPixel(px, ry1 - 1);
  }
  for (let py = ry0 + 1; py < ry1 - 1; py += 1) {
    pushPixel(rx0, py);
    pushPixel(rx1 - 1, py);
  }
  if (borderSamples.length === 0) return { ok: false, reason: 'insufficient border samples' };
  const buckets = new Map();
  for (const [r, g, b] of borderSamples) {
    const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
    const cur = buckets.get(key) ?? { count: 0, rSum: 0, gSum: 0, bSum: 0 };
    cur.count += 1;
    cur.rSum += r;
    cur.gSum += g;
    cur.bSum += b;
    buckets.set(key, cur);
  }
  let best = { count: 0, rSum: 0, gSum: 0, bSum: 0 };
  for (const entry of buckets.values()) {
    if (entry.count > best.count) best = entry;
  }
  const bgR = Math.round(best.rSum / best.count);
  const bgG = Math.round(best.gSum / best.count);
  const bgB = Math.round(best.bSum / best.count);
  let matchingBorder = 0;
  for (const [r, g, b] of borderSamples) {
    if (Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB) <= 36) matchingBorder += 1;
  }
  if (matchingBorder / borderSamples.length < 0.65) {
    return { ok: false, reason: 'background around text is non-uniform (gradient, image, or overlapping border)' };
  }
  return { ok: true, bgR, bgG, bgB };
}

function scanVerticalInkBounds(image, textBoxInImagePx, scale, bg) {
  const scanX0 = Math.max(0, Math.floor(textBoxInImagePx.x));
  const scanX1 = Math.min(image.width, Math.ceil(textBoxInImagePx.x + textBoxInImagePx.width));
  const padY = Math.round(4 * scale);
  const scanY0 = Math.max(0, Math.floor(textBoxInImagePx.y - padY));
  const scanY1 = Math.min(image.height, Math.ceil(textBoxInImagePx.y + textBoxInImagePx.height + padY));
  let minY = scanY1;
  let maxY = -1;
  for (let py = scanY0; py < scanY1; py += 1) {
    for (let px = scanX0; px < scanX1; px += 1) {
      const idx = (py * image.width + px) * 4;
      const diff = Math.abs(image.rgba[idx] - bg.bgR)
        + Math.abs(image.rgba[idx + 1] - bg.bgG)
        + Math.abs(image.rgba[idx + 2] - bg.bgB);
      if (diff >= 42) {
        if (py < minY) minY = py;
        if (py > maxY) maxY = py;
      }
    }
  }
  return maxY >= minY ? { minY, maxY } : undefined;
}

/**
 * Describe where the glyph ink sits. The result is a measurement, never an
 * instruction: whether text should be centred in a reference depends on the
 * layout, which the caller knows and the pixels do not.
 */
function buildInkDiagnosis(refOffset, refLabel, topGapInTextBoxPx, bottomGapInTextBoxPx) {
  if (Math.abs(refOffset) <= 0.5) {
    return `Glyph ink is centred in ${refLabel} (offset ${refOffset}px <= 0.5px).`;
  }
  const dir = refOffset < 0 ? 'above' : 'below';
  return `Glyph ink centre is ${Math.abs(refOffset)}px ${dir} the vertical centre of ${refLabel} (topGap=${topGapInTextBoxPx}px, bottomGap=${bottomGapInTextBoxPx}px inside text box). This is a measurement: correct it only if this text is meant to be optically centred in ${refLabel}.`;
}

function computeInkMetricsFromScan(scan, params) {
  const { textBoxInImagePx, scale, parentBoxInDocPx, textBoxInDocPx } = params;
  const roundHalf = (val) => Math.round(val * 2) / 2;
  const boxTopPx = textBoxInImagePx.y / scale;
  const boxHeightDoc = textBoxInDocPx?.height ?? (textBoxInImagePx.height / scale);
  const inkTopDoc = scan.minY / scale;
  const inkBottomDoc = (scan.maxY + 1) / scale;
  const topInTextBoxPx = roundHalf(inkTopDoc - boxTopPx);
  const bottomInTextBoxPx = roundHalf(inkBottomDoc - boxTopPx);
  const inkHeightPx = roundHalf(inkBottomDoc - inkTopDoc);
  const topGapInTextBoxPx = roundHalf(topInTextBoxPx);
  const bottomGapInTextBoxPx = roundHalf(boxHeightDoc - bottomInTextBoxPx);
  const inkCenterInBox = (topInTextBoxPx + bottomInTextBoxPx) / 2;
  const inkCenterOffsetInTextBoxPx = roundHalf(inkCenterInBox - boxHeightDoc / 2);
  const inkCenterOffsetInParentPx = parentBoxInDocPx !== undefined && textBoxInDocPx !== undefined
    ? roundHalf((textBoxInDocPx.y + inkCenterInBox) - (parentBoxInDocPx.y + parentBoxInDocPx.height / 2))
    : undefined;
  // Text stacked with siblings (one line of a two-line title, a label above a
  // value) is not meant to sit at its parent's centre, so the parent is not a
  // meaningful reference for it.
  const parentIsReference = inkCenterOffsetInParentPx !== undefined && params.stackedInParent !== true;
  const refOffset = parentIsReference ? inkCenterOffsetInParentPx : inkCenterOffsetInTextBoxPx;
  const refLabel = parentIsReference ? 'parent container' : 'its own text box';
  return {
    topInTextBoxPx,
    bottomInTextBoxPx,
    inkHeightPx,
    topGapInTextBoxPx,
    bottomGapInTextBoxPx,
    inkCenterOffsetInTextBoxPx,
    ...(inkCenterOffsetInParentPx === undefined ? {} : { inkCenterOffsetInParentPx }),
    ...(params.stackedInParent === true ? { stackedInParent: true } : {}),
    diagnosis: buildInkDiagnosis(refOffset, refLabel, topGapInTextBoxPx, bottomGapInTextBoxPx),
  };
}

/** Measure true glyph ink bounds within a cropped RGBA buffer. */
export function measureGlyphInkInRgba(image, textBoxInImagePx, scale, parentBoxInDocPx, textBoxInDocPx, stackedInParent = false) {
  const padPx = Math.max(2, Math.round(6 * scale));
  const rx0 = Math.max(0, Math.floor(textBoxInImagePx.x - padPx));
  const ry0 = Math.max(0, Math.floor(textBoxInImagePx.y - padPx));
  const rx1 = Math.min(image.width, Math.ceil(textBoxInImagePx.x + textBoxInImagePx.width + padPx));
  const ry1 = Math.min(image.height, Math.ceil(textBoxInImagePx.y + textBoxInImagePx.height + padPx));
  if (rx1 - rx0 < 4 || ry1 - ry0 < 4) {
    return { reliable: false, unreliableReason: 'text bounding box is outside rendered image bounds' };
  }
  const bg = sampleUniformBackgroundColor(image, { rx0, ry0, rx1, ry1 });
  if (!bg.ok) return { reliable: false, unreliableReason: bg.reason };
  const scan = scanVerticalInkBounds(image, textBoxInImagePx, scale, bg);
  if (scan === undefined) {
    return { reliable: false, unreliableReason: 'no visible glyph ink contrast detected against background' };
  }
  return {
    reliable: true,
    ink: computeInkMetricsFromScan(scan, { textBoxInImagePx, scale, parentBoxInDocPx, textBoxInDocPx, stackedInParent }),
  };
}
