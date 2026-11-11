/** HTML quality diagnostics; adapted from the original Synapse HTML skill. */
import { basename } from 'node:path';

export function plainText(html) {
  return html.replace(/<[^>]*>/g, ' ')
    .replace(/&middot;|&#0?183;|&#x0?b7;/gi, '·').replace(/&bull;|&#8226;|&#x2022;/gi, '•').replace(/&mdash;|&#8212;|&#x2014;/gi, '\u2014').replace(/&ndash;|&#8211;|&#x2013;/gi, '\u2013')
    .replace(/&rarr;|&#8594;|&#x2192;|&xrarr;|&#10230;/gi, '\u2192').replace(/&raquo;|&#187;|&#xbb;/gi, '\u00bb').replace(/&rsaquo;|&#8250;|&#x203a;/gi, '\u203a')
    .replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&rsquo;|&lsquo;|&#8217;|&#8216;|&#x2019;|&#x2018;/gi, '\u2019').replace(/&rdquo;|&ldquo;|&#8220;|&#8221;/gi, '"')
    .replace(/&#\d+;|&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ').trim();
}

export function innerOf(doc, idx) {
  const open = doc.tags[idx];
  if (open.close || open.selfClosing) return null;
  let depth = 1;
  for (let i = idx + 1; i < doc.tags.length; i++) {
    const t = doc.tags[i];
    if (t.selfClosing) continue;
    if (t.close) { depth--; if (depth === 0) return { inner: doc.src.slice(open.end, t.pos), endPos: t.pos }; }
    else depth++;
  }
  return { inner: doc.src.slice(open.end), endPos: doc.src.length };
}

export function parseNum(s) { const v = parseFloat(s); return Number.isNaN(v) ? null : v; }

export function parseColor(raw) {
  if (!raw) return null;
  const v = raw.trim().toLowerCase();
  if (v === 'white') return { r: 1, g: 1, b: 1, alpha: 1 };
  if (v === 'black') return { r: 0, g: 0, b: 0, alpha: 1 };
  if (v === 'transparent') return { r: 0, g: 0, b: 0, alpha: 0 };
  let m;
  if ((m = /^#([0-9a-f]{3,8})$/.exec(v))) {
    const h = m[1];
    if (h.length === 3 || h.length === 4) {
      const r = parseInt(h[0] + h[0], 16) / 255, g = parseInt(h[1] + h[1], 16) / 255, b = parseInt(h[2] + h[2], 16) / 255;
      const a = h.length === 4 ? parseInt(h[3] + h[3], 16) / 255 : 1;
      return { r, g, b, alpha: a };
    }
    if (h.length === 6 || h.length === 8) {
      const r = parseInt(h.slice(0, 2), 16) / 255, g = parseInt(h.slice(2, 4), 16) / 255, b = parseInt(h.slice(4, 6), 16) / 255;
      const a = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
      return { r, g, b, alpha: a };
    }
    return null;
  }
  if ((m = /^rgba?\(([^)]+)\)$/.exec(v))) {
    const parts = m[1].split('/');
    const nums = parts[0].split(/[\s,]+/).filter(Boolean);
    if (nums.length < 3) return null;
    const chan = (s) => s.endsWith('%') ? parseNum(s) / 100 : parseNum(s) / 255;
    let alpha = 1;
    if (parts[1] != null) alpha = parts[1].trim().endsWith('%') ? parseNum(parts[1]) / 100 : parseNum(parts[1]);
    else if (nums.length === 4) alpha = nums[3].endsWith('%') ? parseNum(nums[3]) / 100 : parseNum(nums[3]);
    const [r, g, b] = nums.slice(0, 3).map(chan);
    if ([r, g, b].some((x) => x == null)) return null;
    return { r, g, b, alpha: alpha ?? 1 };
  }
  if ((m = /^hsla?\(([^)]+)\)$/.exec(v))) {
    const parts = m[1].split('/');
    const nums = parts[0].split(/[\s,]+/).filter(Boolean);
    if (nums.length < 3) return null;
    const h = parseNum(nums[0]);
    const s = parseNum(nums[1]) / 100, l = parseNum(nums[2]) / 100;
    let alpha = 1;
    if (parts[1] != null) alpha = parts[1].trim().endsWith('%') ? parseNum(parts[1]) / 100 : parseNum(parts[1]);
    else if (nums.length === 4) alpha = nums[3].endsWith('%') ? parseNum(nums[3]) / 100 : parseNum(nums[3]);
    if ([h, s, l].some((x) => x == null)) return null;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const hp = ((h % 360) + 360) % 360 / 60;
    const x = c * (1 - Math.abs((hp % 2) - 1));
    let rgb = [0, 0, 0];
    if (hp < 1) rgb = [c, x, 0]; else if (hp < 2) rgb = [x, c, 0];
    else if (hp < 3) rgb = [0, c, x]; else if (hp < 4) rgb = [0, x, c];
    else if (hp < 5) rgb = [x, 0, c]; else rgb = [c, 0, x];
    const mAdd = l - c / 2;
    return { r: rgb[0] + mAdd, g: rgb[1] + mAdd, b: rgb[2] + mAdd, alpha: alpha ?? 1 };
  }
  if ((m = /^oklch\(([^)]+)\)$/.exec(v))) {
    const parts = m[1].split('/');
    const nums = parts[0].split(/\s+/).filter(Boolean);
    if (nums.length < 3) return null;
    let L = parseNum(nums[0]);
    if (nums[0].endsWith('%')) L = L / 100;
    const C = parseNum(nums[1]);
    let H = nums[2] === 'none' ? 0 : parseNum(nums[2]);
    let alpha = 1;
    if (parts[1] != null) alpha = parts[1].trim().endsWith('%') ? parseNum(parts[1]) / 100 : parseNum(parts[1]);
    if (L == null || C == null || H == null) return null;
    const rgb = oklchToSrgb(L, C, H);
    return { ...rgb, alpha: alpha ?? 1, okl: { L, C, H } };
  }
  return null;
}

export function oklchToSrgb(L, C, H) {
  const hr = (H * Math.PI) / 180;
  const a = C * Math.cos(hr), b = C * Math.sin(hr);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  const l = l_ ** 3, mm = m_ ** 3, s = s_ ** 3;
  const lin = [
    4.0767416621 * l - 3.3077115913 * mm + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * mm - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * mm + 1.7076147010 * s,
  ].map((c) => Math.min(1, Math.max(0, c)));
  const enc = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
  return { r: enc(lin[0]), g: enc(lin[1]), b: enc(lin[2]) };
}

export function srgbToOklch(col) {
  const dec = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const r = dec(col.r), g = dec(col.g), b = dec(col.b);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s;
  const b2 = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s;
  const C = Math.sqrt(a * a + b2 * b2);
  let H = (Math.atan2(b2, a) * 180) / Math.PI;
  if (H < 0) H += 360;
  return { L, C, H };
}

export function luminance(col) {
  const dec = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * dec(col.r) + 0.7152 * dec(col.g) + 0.0722 * dec(col.b);
}

export function contrastRatio(a, b) {
  const la = luminance(a), lb = luminance(b);
  const hi = Math.max(la, lb), lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}

export const TOKEN_SEL = /^(?:html|:root)?(?:\[data-(?:theme|mode|scheme)[^\]]*\]|:root|:not\([^)]*\))*$/i;

export function isTokenRule(rule) {
  if (rule.selector === '@font-face' || rule.selector === '@theme' || basename(rule.file).toLowerCase() === 'tokens.css') return true;
  return rule.selector.split(',').every((p) => { const t = p.trim(); return t && TOKEN_SEL.test(t); });
}

export function buildTokens(rules) {
  const tokens = {};
  for (const r of rules) {
    if (!isTokenRule(r)) continue;
    for (const d of r.decls) if (d.prop.startsWith('--')) tokens[d.prop] = d.value;
  }
  return tokens;
}

export function resolveVars(value, tokens, local = null, depth = 0) {
  if (!value || depth > 5 || !value.includes('var(')) return value;
  const out = value.replace(/var\(\s*(--[\w-]+)\s*(?:,\s*([^()]*(?:\([^()]*\)[^()]*)*))?\)/g, (m0, name, fb) => {
    const v = (local && local[name] != null) ? local[name] : tokens[name];
    if (v != null) return v;
    if (fb != null) return fb.trim();
    return m0;
  });
  if (out === value) return out;
  return resolveVars(out, tokens, local, depth + 1);
}

// A family's identity ignores spaces, hyphens and underscores, so "GeistSans" and "Geist Sans" are one face

export const famKey = (f) => String(f || '').replace(/[\s_-]+/g, '');

export function firstFamily(value) {
  const first = value.split(',')[0].trim().replace(/^['"]|['"]$/g, '').toLowerCase();
  return first;
}

export function pxOf(value) {
  const m = /^(-?\d+(?:\.\d+)?)(px|rem|em)$/.exec(value.trim());
  if (!m) return null;
  const n = parseFloat(m[1]);
  return m[2] === 'px' ? n : n * 16;
}

export const rel = (f) => f.startsWith(process.cwd()) ? f.slice(process.cwd().length + 1) : f;

export const trunc = (s, n = 72) => (s.length > n ? s.slice(0, n - 1) + '…' : s);
