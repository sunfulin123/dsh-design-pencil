/** CanvasKit scene traversal, text baseline placement, and vector painting. */

import {
  extractCornerRadius,
  extractPlainText,
  extractSolidFillRgba,
  extractStrokeInfo,
} from './visual-evidence-styles.mjs';

function resolveTypefaceForFamily(env, familyStack) {
  for (const part of familyStack.split(',')) {
    const clean = part.trim().replace(/^["']|["']$/gu, '').toLowerCase();
    if (!clean) continue;
    const bundled = env.bundledByFamily.get(clean);
    if (bundled !== undefined) return bundled;
  }
  return env.interTypeface;
}

function isCjkCodePoint(cp) {
  return (cp >= 0x2e80 && cp <= 0x9fff)
    || (cp >= 0xac00 && cp <= 0xd7a3)
    || (cp >= 0xff00 && cp <= 0xffef)
    || (cp >= 0x3000 && cp <= 0x30ff);
}

function primaryGlyphIds(env, primaryTf, fontSize, text) {
  if (primaryTf === null) return null;
  const font = new env.CK.Font(primaryTf, fontSize);
  try {
    const ids = font.getGlyphIDs(text);
    return ids.length === Array.from(text).length ? ids : null;
  } catch {
    return null;
  } finally {
    font.delete();
  }
}

function splitTextSegments(env, primaryTf, fontSize, text) {
  const chars = Array.from(text);
  if (chars.length === 0) return [];
  const glyphIds = primaryGlyphIds(env, primaryTf, fontSize, text);
  const segments = [];
  let current = '';
  let currentCjk = null;
  for (let i = 0; i < chars.length; i += 1) {
    const ch = chars[i];
    const cp = ch.codePointAt(0) ?? 0;
    const uncovered = glyphIds ? glyphIds[i] === 0 : isCjkCodePoint(cp);
    const useCjk = uncovered && env.cjkTypeface !== null;
    if (currentCjk === null) {
      currentCjk = useCjk;
      current = ch;
    } else if (currentCjk === useCjk) {
      current += ch;
    } else {
      segments.push({ text: current, useCjk: currentCjk });
      current = ch;
      currentCjk = useCjk;
    }
  }
  if (current.length > 0 && currentCjk !== null) {
    segments.push({ text: current, useCjk: currentCjk });
  }
  return segments;
}

function fontMetrics(env, typeface, fontSize) {
  const font = new env.CK.Font(typeface, fontSize);
  try {
    const metrics = font.getMetrics?.();
    const ascent = metrics?.ascent;
    const descent = metrics?.descent;
    return {
      ascent: typeof ascent === 'number' && Number.isFinite(ascent) ? -ascent : 0,
      descent: typeof descent === 'number' && Number.isFinite(descent) ? descent : 0,
    };
  } finally {
    font.delete();
  }
}

function computeBaselineOffset(env, text, style, lineHeight) {
  const { primaryTf, fontSize } = style;
  const metrics = fontMetrics(env, primaryTf ?? env.cjkTypeface, fontSize);
  const primaryAscent = metrics.ascent > 0 ? metrics.ascent : fontSize * 0.8;
  const primaryDescent = metrics.descent > 0 ? metrics.descent : fontSize * 0.2;
  if (!(lineHeight > 0)) return primaryAscent;
  let ascent = primaryAscent;
  let descent = primaryDescent;
  for (const seg of splitTextSegments(env, primaryTf, fontSize, text || 'M')) {
    const tf = seg.useCjk ? env.cjkTypeface : primaryTf;
    if (!tf) continue;
    const segmentMetrics = fontMetrics(env, tf, fontSize);
    ascent = Math.max(ascent, segmentMetrics.ascent);
    descent = Math.max(descent, segmentMetrics.descent);
  }
  const naturalHeight = ascent + descent;
  const targetHeight = fontSize * lineHeight;
  const baseline = ascent + (targetHeight - naturalHeight) / 2;
  return Number.isFinite(baseline) && baseline > 0 ? baseline : primaryAscent;
}

function measureAndDrawTextLine(env, line, style, target) {
  const { primaryTf, fontSize, italic } = style;
  const x = target?.x ?? 0;
  let cx = x;
  for (const seg of splitTextSegments(env, primaryTf, fontSize, line)) {
    const tf = (seg.useCjk ? env.cjkTypeface : primaryTf) ?? env.interTypeface ?? env.cjkTypeface;
    if (!tf) continue;
    const font = new env.CK.Font(tf, fontSize);
    try {
      if (italic) font.setSkewX(-0.25);
      if (target !== undefined) {
        target.canvas.drawText(seg.text, cx, target.baselineY, target.paint, font);
      }
      const ids = font.getGlyphIDs(seg.text);
      const widths = font.getGlyphWidths(ids);
      let adv = 0;
      for (let i = 0; i < widths.length; i += 1) adv += widths[i];
      cx += adv;
    } finally {
      font.delete();
    }
  }
  return cx - x;
}

function textLineX(item, lineWidth, alignment) {
  if (alignment === 'center') return item.x + Math.max(0, item.width - lineWidth) / 2;
  if (alignment === 'right') return item.x + Math.max(0, item.width - lineWidth);
  return item.x;
}

function textBlockOffset(item, blockHeight, alignment) {
  if (alignment === 'top') return 0;
  if (alignment === 'bottom') return item.height - blockHeight;
  return (item.height - blockHeight) / 2;
}

function drawTextBlock(env, item, style, target) {
  const { node, text, canvas, paint } = target;
  const lines = text.split('\n');
  const lineHeight = typeof node.lineHeight === 'number' && node.lineHeight > 0 && node.lineHeight <= 4
    ? node.lineHeight : 0;
  const firstBaseline = computeBaselineOffset(env, lines[0] ?? 'M', style, lineHeight);
  const lineStep = style.fontSize * (lineHeight > 0 ? lineHeight : 1.2);
  const verticalAlign = node.textAlignVertical === 'top' || node.textAlignVertical === 'bottom'
    ? node.textAlignVertical : 'middle';
  const blockOffset = textBlockOffset(item, lineStep * lines.length, verticalAlign);
  for (const [index, line] of lines.entries()) {
    if (!line) continue;
    const width = measureAndDrawTextLine(env, line, style);
    const cjkInk = /[\u1100-\u11ff\u2e80-\u303f\u3040-\u33ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7ff\uf900-\ufaff\ufe30-\ufe4f\uff00-\uffef]/u.test(line);
    const inkCenter = (cjkInk ? 0.375 : 0.34) * style.fontSize;
    const baselineY = item.y + blockOffset + index * lineStep
      + (verticalAlign === 'middle' ? lineStep / 2 + inkCenter : firstBaseline);
    measureAndDrawTextLine(env, line, style, {
      canvas,
      paint,
      x: textLineX(item, width, node.textAlign),
      baselineY,
    });
  }
}

export function paintTextNode(env, canvas, item, props) {
  const { node, fill } = props;
  const text = extractPlainText(node);
  if (text.length === 0 || !(item.width > 0 && item.height > 0)) return;
  const family = typeof node.fontFamily === 'string' && node.fontFamily.trim()
    ? node.fontFamily : 'Inter, system-ui, sans-serif';
  const style = {
    primaryTf: resolveTypefaceForFamily(env, family),
    fontSize: typeof node.fontSize === 'number' && node.fontSize > 0 ? node.fontSize : 16,
    italic: node.fontStyle === 'italic',
  };
  const weight = typeof node.fontWeight === 'number' ? node.fontWeight
    : typeof node.fontWeight === 'string' ? Number.parseInt(node.fontWeight, 10) || 400 : 400;
  const rgba = fill.kind === 'solid' ? fill.rgba : [20, 20, 20, 255];
  const paint = new env.CK.Paint();
  try {
    paint.setAntiAlias(true);
    paint.setColor(env.CK.Color4f(rgba[0] / 255, rgba[1] / 255, rgba[2] / 255, rgba[3] / 255));
    if (weight >= 600 && env.CK.PaintStyle.StrokeAndFill !== undefined) {
      paint.setStyle(env.CK.PaintStyle.StrokeAndFill);
      paint.setStrokeWidth(style.fontSize * 0.04);
    } else {
      paint.setStyle(env.CK.PaintStyle.Fill);
    }
    drawTextBlock(env, item, style, { canvas, paint, node, text });
  } finally {
    paint.delete();
  }
}

/** Reject visible scene content whose pixels this painter cannot reproduce. */
export function canPaintSceneExactly(item, trees) {
  const node = trees.docNodesById.get(item.id) ?? {};
  if (node.visible === false) return true;
  const kind = typeof node.type === 'string' ? node.type : item.type;
  if (kind === 'image' || (node.opacity !== undefined && node.opacity !== 1)) return false;
  if (extractSolidFillRgba(node.fill, trees.variables).kind === 'complex') return false;
  return (item.children ?? []).every((child) => canPaintSceneExactly(child, trees));
}

function setPaintColor(env, paint, rgba) {
  paint.setAntiAlias(true);
  paint.setColor(env.CK.Color4f(rgba[0] / 255, rgba[1] / 255, rgba[2] / 255, rgba[3] / 255));
}

function paintShape(env, canvas, shape, color) {
  const paint = new env.CK.Paint();
  try {
    setPaintColor(env, paint, color.rgba);
    paint.setStyle(color.strokeWidth === undefined ? env.CK.PaintStyle.Fill : env.CK.PaintStyle.Stroke);
    if (color.strokeWidth !== undefined) paint.setStrokeWidth(color.strokeWidth);
    if (shape.kind === 'ellipse') canvas.drawOval(shape.rect, paint);
    else if (shape.radius > 0.5) canvas.drawRRect(env.CK.RRectXY(shape.rect, shape.radius, shape.radius), paint);
    else canvas.drawRect(shape.rect, paint);
  } finally {
    paint.delete();
  }
}

function paintIcon(env, canvas, item, props) {
  if (!(item.width > 0 && item.height > 0)) return;
  const rawName = props.node.iconFontName ?? props.node.text;
  const iconName = typeof rawName === 'string' ? rawName.trim() : '';
  const pathD = env.lucidePaths.get(iconName) ?? env.lucidePaths.get(`lucide:${iconName}`);
  if (!pathD || !env.CK.Path.MakeFromSVGString) return;
  const path = env.CK.Path.MakeFromSVGString(pathD);
  if (path === null) return;
  const paint = new env.CK.Paint();
  try {
    setPaintColor(env, paint, props.fill.kind === 'solid' ? props.fill.rgba : [30, 30, 30, 255]);
    paint.setStyle(env.CK.PaintStyle.Stroke);
    paint.setStrokeWidth(Math.max(1.25, (Math.min(item.width, item.height) / 24) * 2));
    paint.setStrokeCap(env.CK.StrokeCap.Round);
    paint.setStrokeJoin(env.CK.StrokeJoin.Round);
    path.transform([item.width / 24, 0, item.x, 0, item.height / 24, item.y, 0, 0, 1]);
    canvas.drawPath(path, paint);
  } finally {
    paint.delete();
    path.delete();
  }
}

function paintLine(env, canvas, item, props) {
  const paint = new env.CK.Paint();
  try {
    const rgba = props.stroke?.rgba ?? (props.fill.kind === 'solid' ? props.fill.rgba : [0, 0, 0, 255]);
    setPaintColor(env, paint, rgba);
    paint.setStyle(env.CK.PaintStyle.Stroke);
    paint.setStrokeWidth(props.stroke?.width ?? 1.5);
    canvas.drawLine(item.x, item.y, item.x + item.width, item.y + item.height, paint);
  } finally {
    paint.delete();
  }
}

function paintContainer(env, canvas, item, props) {
  const { node, kind, trees } = props;
  const radius = extractCornerRadius(node.cornerRadius);
  const rect = env.CK.LTRBRect(item.x, item.y, item.x + item.width, item.y + item.height);
  const shape = { rect, radius, kind };
  const hasArea = item.width > 0 && item.height > 0;
  const fill = extractSolidFillRgba(node.fill, trees.variables);
  if (hasArea && fill.kind === 'solid') paintShape(env, canvas, shape, { rgba: fill.rgba });
  const children = item.children ?? [];
  const clips = node.clipContent === true && children.length > 0;
  if (clips) {
    canvas.save();
    if (radius > 0.5) canvas.clipRRect(env.CK.RRectXY(rect, radius, radius), env.CK.ClipOp.Intersect, true);
    else canvas.clipRect(rect, env.CK.ClipOp.Intersect, true);
  }
  try {
    for (const child of children) paintSceneNode(env, canvas, child, trees);
  } finally {
    if (clips) canvas.restore();
  }
  const stroke = extractStrokeInfo(node.stroke, trees.variables);
  if (hasArea && stroke !== undefined) paintShape(env, canvas, shape, { rgba: stroke.rgba, strokeWidth: stroke.width });
}

export function paintSceneNode(env, canvas, item, trees) {
  const node = trees.docNodesById.get(item.id) ?? {};
  if (node.visible === false) return;
  const kind = typeof node.type === 'string' ? node.type : (item.type ?? 'frame');
  const fill = extractSolidFillRgba(node.fill, trees.variables);
  switch (kind) {
    case 'text':
      paintTextNode(env, canvas, item, { node, fill });
      return;
    case 'icon_font':
      paintIcon(env, canvas, item, { node, fill });
      return;
    case 'line':
      paintLine(env, canvas, item, { fill, stroke: extractStrokeInfo(node.stroke, trees.variables) });
      return;
    default:
      paintContainer(env, canvas, item, { node, kind, trees });
  }
}
