/** HTML quality diagnostics; adapted from the original Synapse HTML skill. */
import {
  innerOf, parseColor, plainText, rel, resolveVars,
  srgbToOklch, trunc,
} from './sloplint-color.mjs';
import { EYEBROW_ANNOUNCE, EYEBROW_BLOCKY, monoIsMaterial } from './sloplint-content-checks.mjs';
import { directChildren, getAttr, hasAttr } from './sloplint-jsx.mjs';
import { findings, report } from './sloplint-report.mjs';
import {
  COLOR_RE, TW_BLUE, TW_GREY, TW_PINK, TW_PURPLE,
  TW_ROOT, TW_SHADE, lengthPx, splitTop, twFrame,
  twHue, twInfo, twTokens, twTokensOf,
} from './sloplint-tailwind-parse.mjs';
import { bannedGradient } from './sloplint-visual-checks.mjs';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export function twGroup(ctx) {
  if (ctx._tw) return ctx._tw;
  const tw = { items: [], variants: new Set(), caret: false, scrollbar: false, motion: null, upperDisplay: false };
  ctx._tw = tw;
  const add = (it) => {
    const f = it.info;
    tw.items.push(it);
    if (f.caret) tw.caret = true;
    if (f.scrollbar) tw.scrollbar = true;
    if (!tw.motion && (f.animate || (f.transition && f.transform))) tw.motion = it;
    if (/^h[12]$/.test(it.name) && f.upper) tw.upperDisplay = true;
  };
  for (const doc of ctx.docs) {
    const stack = [];
    for (let i = 0; i < doc.tags.length; i++) {
      const t = doc.tags[i];
      if (t.close) { stack.pop(); continue; }
      const parent = stack.length ? stack[stack.length - 1] : TW_ROOT;
      const toks = twTokensOf(doc, t);
      const info = toks.length ? twInfo(ctx, toks, tw) : null;
      const frame = twFrame(parent, t, info, toks);
      if (info) add({ doc, idx: i, name: t.name, attrs: t.attrs, line: t.line, toks, info, frame });
      if (!t.selfClosing) stack.push(frame);
    }
    for (let c = 0; c < doc.comps.length; c++) {
      const t = doc.comps[c];
      if (t.close) continue;
      const toks = twTokensOf(doc, t);
      if (!toks.length) continue;
      const info = twInfo(ctx, toks, tw);
      add({ doc, idx: -1, comp: c, name: t.name, attrs: t.attrs, line: t.line, toks, info, frame: twFrame(TW_ROOT, t, info, toks) });
    }
    for (const v of doc.virtuals || []) {
      const info = twInfo(ctx, v.toks, tw);
      add({ doc, idx: -1, virtual: true, name: v.name, attrs: '', line: doc.lineOf(v.pos), toks: v.toks, info, frame: twFrame(TW_ROOT, { name: v.name, attrs: '' }, info, v.toks) });
    }
  }
  return tw;
}

export function twWhere(it) {
  return it.virtual ? `${it.name}() class string` : `<${it.name} class="${trunc(it.toks.join(' '), 32)}">`;
}

export function compInner(doc, c) {
  const open = doc.comps[c];
  if (open.selfClosing) return '';
  let depth = 1;
  for (let i = c + 1; i < doc.comps.length; i++) {
    const t = doc.comps[i];
    if (t.name !== open.name || t.selfClosing) continue;
    if (!t.close) depth++;
    else if (--depth === 0) return doc.src.slice(open.end, t.pos);
  }
  return '';
}

export function twPlain(doc, html) {
  let s = html;
  if (doc.kind !== 'html' && doc.kind !== 'jsx') for (let k = 0; k < 3 && /\{[^{}]*\}/.test(s); k++) s = s.replace(/\{[^{}]*\}/g, ' ');
  return plainText(s);
}

export function twText(it) {
  if (it.text == null) {
    let inner = '';
    if (it.idx >= 0) inner = innerOf(it.doc, it.idx)?.inner || '';
    else if (it.comp != null) inner = compInner(it.doc, it.comp);
    it.text = twPlain(it.doc, inner);
  }
  return it.text;
}

export function closeIndex(doc, idx) {
  if (doc.tags[idx].selfClosing) return idx;
  let depth = 1;
  for (let i = idx + 1; i < doc.tags.length; i++) {
    const t = doc.tags[i];
    if (t.selfClosing) continue;
    if (!t.close) depth++;
    else if (--depth === 0) return i;
  }
  return doc.tags.length - 1;
}

export function twGradient(ctx, f) {
  if (!f.stops.length || (!f.grad && f.stops.length < 2)) return null;
  const names = f.stops.filter((s) => s.pal).map((s) => s.pal);
  let banned = null;
  for (const a of names) {
    if (!TW_PURPLE.test(a)) continue;
    if (names.some((x) => x !== a && TW_BLUE.test(x))) { banned = 'purple-to-blue'; break; }
    if (names.some((x) => x !== a && TW_PINK.test(x))) { banned = 'purple-to-pink'; break; }
  }
  if (!banned) banned = bannedGradient(f.stops.map((s) => s.hue).filter((h) => h != null), { tokens: twTokens(ctx) });
  return { banned, text: f.clip && f.clear, list: f.stops.map((s) => s.tok).join(' ') };
}

export function twGlow(ctx, f) {
  const tokens = twTokens(ctx);
  for (const s of f.shadows) {
    for (const part of splitTop(resolveVars(s.v.replace(/_/g, ' '), tokens))) {
      const cm = COLOR_RE.exec(part);
      const lens = (cm ? part.replace(cm[0], ' ') : part).replace(/\binset\b/, ' ').trim().split(/\s+/).filter(Boolean).map(lengthPx);
      if (lens.length < 3 || lens[0] !== 0 || lens[1] !== 0 || lens[2] == null || lens[2] < 8) continue;
      let chroma = 0;
      if (cm) {
        const c = parseColor(cm[0]);
        if (c && c.alpha > 0.05) chroma = (c.okl || srgbToOklch(c)).C;
      } else if (f.shadowCol) {
        const name = f.shadowCol.replace(/\/\S*$/, '');
        const pm = TW_SHADE.exec(name);
        const tv = tokens[`--color-${name}`];
        chroma = pm ? (TW_GREY.test(pm[1]) ? 0 : 0.2) : tv ? (twHue(parseColor(resolveVars(tv, tokens).trim())) != null ? 0.2 : 0) : 0;
      }
      if (chroma > 0.04) return `glow: ${s.tok}${cm ? '' : ` with shadow-${f.shadowCol}`}`;
    }
  }
  return null;
}

export function twDataText(s) {
  const t = s.trim();
  const letters = (t.match(/[A-Za-z]/g) || []).length;
  const digits = (t.match(/\d/g) || []).length;
  if (digits >= letters) return true;
  if (/^v?\d+(?:\.\d+)+/.test(t) || /[⌘⌥⇧⌃⎋↵]|^(?:ctrl|cmd|alt|shift|option)\s*[+-]/i.test(t)) return true;
  if (/[{}();=<>]|^\$\s|^(?:npm|npx|pnpm|yarn|bun|git|curl|cd|ls|brew|pip|docker|node) |^--?[a-z]|[\w-]+\.[a-z][a-z0-9]{0,3}$|^[#.]?[a-z]+(?:[-_][a-z0-9]+)+$|^[a-z]+[A-Z]\w*$|^\/[\w/.-]*$|^https?:/.test(t)) return true;
  return digits > 0 && /^(?:\d{1,2}:\d{2}|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d)/i.test(t);
}

export function tw67(it, tw) {
  const f = it.info, fr = it.frame;
  if (!(f.upper || f.caps || (f.em != null && f.em > 0.03))) return null;
  if (fr.logo || fr.logoSelf || fr.noLabel) return null;
  const size = fr.size, em = fr.em;
  if ((size != null && size >= 24) || (size == null && /^h[1-6]$/.test(it.name))) return null;
  const caps = fr.upper || fr.caps;
  const small = size != null && size <= 15;
  const tracked = em != null && em > 0.03;
  const control = /^(?:button|input)$/.test(it.name) || /(?:button|btn|cta)$/i.test(it.name) || (it.name === 'a' && f.fill && f.padded) || /role\s*=\s*["']?button/i.test(it.attrs);
  if (tw.upperDisplay && control && (em == null || em <= 0.04)) return null;
  if (!((caps && (small || tracked)) || (tracked && small))) return null;
  return { what: fr.caps ? 'small caps' : fr.upper ? 'uppercase' : 'letter-spaced', size, em: tracked ? Math.round(em * 1000) / 1000 : null };
}

export function tw54(it) {
  const f = it.info, fr = it.frame, doc = it.doc;
  if (it.idx < 0 || !/^(?:p|span|div|small)$/.test(it.name) || fr.eyeSkip) return null;
  if (!(f.upper || (f.em != null && f.em > 0.03) || f.accent)) return null;
  if (fr.size == null || fr.size > 14) return null;
  const t = doc.tags[it.idx];
  if (/role\s*=\s*["']?status|aria-live|aria-current|aria-hidden\s*=\s*["']?true/i.test(t.attrs)) return null;
  const c = closeIndex(doc, it.idx);
  const nx = doc.tags[c + 1];
  if (!nx || nx.close || !/^h[1-3]$/.test(nx.name)) return null;
  const inner = c > it.idx ? doc.src.slice(t.end, doc.tags[c].pos) : '';
  if (EYEBROW_BLOCKY.test(inner) || /<br\b|<time\b/i.test(inner)) return null;
  const href = /<a\b[^>]*\shref\s*=\s*["']([^"']*)["']/i.exec(inner);
  if (href && !/^#?$/.test(href[1].trim())) return null;
  const text = twPlain(doc, inner);
  const signal =[f.upper ? 'uppercase' : null, f.em != null && f.em > 0.03 ? `tracked ${Math.round(f.em * 1000) / 1000}em` : null, f.accent].filter(Boolean).join(', ');
  if (!text) return doc.kind !== 'html' && c > it.idx && (doc.raw || '').slice(t.end, doc.tags[c].pos).includes('{') ? { text: '', next: nx.name, signal } : null;
  const words = text.split(/[\s·/|\u2014\u2013]+/).filter(Boolean);
  if (words.length > 7 || text.length > 56 || /[\w/-]+\.[a-z]{1,4}$/i.test(text)) return null;
  const stripped = text.replace(/^\s*(?:no\.?\s*)?\d{1,3}(?:\s*[·./\u2014\u2013-]\s*|\s+|$)/i, '').trim();
  if ((stripped.match(/\d/g) || []).length >= 2) return null;
  if (fr.inOl && stripped && !EYEBROW_ANNOUNCE.test(stripped)) return null;
  return { text, next: nx.name, signal };
}

export function twTiles(it, byIdx) {
  const doc = it.doc;
  let tiles = 0;
  for (const k of directChildren(doc, it.idx)) {
    if (!/<h3\b/i.test(k.html)) continue;
    const end = closeIndex(doc, k.idx);
    for (let j = k.idx + 1; j < end; j++) {
      const t = doc.tags[j];
      if (t.close) continue;
      if (/^h[1-6]$/.test(t.name)) break;
      const ti = byIdx.get(j);
      if (!ti || !ti.info.rounded || !ti.info.fill) continue;
      const inner = innerOf(doc, j);
      if (inner && /<svg\b|<[A-Z][\w.]*Icon\b|<Icon\b|<i\b[^>]*class/.test(inner.inner) && !twPlain(doc, inner.inner)) { tiles++; break; }
    }
  }
  return tiles;
}

export function checkTailwind(ctx) {
  const tw = twGroup(ctx);
  if (!tw.items.length) return;
  const had = (gate, doc, line) => findings.some((x) => x.gate === gate && x.file === rel(doc.file) && x.line === line);
  const monoOk = monoIsMaterial({ tokens: twTokens(ctx) });
  const byDoc = new Map();
  for (const it of tw.items) {
    if (!byDoc.has(it.doc)) byDoc.set(it.doc, []);
    byDoc.get(it.doc).push(it);
    const { doc, info: f } = it;
    const at = (gate, grade, ev, fix) => report(gate, grade, doc.file, it.line, ev, fix);
    const where = twWhere(it);
    if (f.tAll) at('10a', 'FAIL', `${f.tAll} on ${where}`, 'Name the properties: transition-colors, transition-opacity or transition-transform');
    if (f.bounce || f.overshoot) at(12, 'FAIL', `${f.bounce ? 'bounce' : 'overshoot easing'} ${f.bounce || f.overshoot} on ${where}`, 'Exponential ease-out on UI state; no bounce or overshoot');
    const g = twGradient(ctx, f);
    if (g && g.banned) at('2a', 'FAIL', `${g.banned} gradient${g.text ? ' text' : ''} (${g.list}) on ${where}`, 'One anchor hue, solid ink');
    else if (g && g.text) at('2b', 'FAIL', `gradient text (${g.list}) on ${where}`, 'Solid ink; weight or a display face. Guard: a single-hue ramp from two tokens with 40 and 41 passing');
    const g29 = f.bblur && f.glass ? `glass: ${f.bblur} over ${f.glass}`
      : f.blur >= 40 && f.pos && (f.fill || f.grad || f.stops.length) ? `blurred orb: ${f.blurTok} on a filled ${f.pos} element`
        : twGlow(ctx, f);
    if (g29) at(29, 'WARN', `${g29} on ${where}`, 'Solid or grained surface; elevation by lightness, shadows with offset and blur');
    if (f.colours.length || f.font) {
      const what = [f.colours.length ? `colour literal ${f.colours[0].tok}` : null, f.font ? `font-family literal ${f.font}` : null].filter(Boolean).join(' and ');
      at(48, f.font || f.colours.some((c) => !c.oklch) ? 'FAIL' : 'WARN', `${what} in a class on ${where}`, 'Lift the value into the token block (@theme or :root) and use its utility name');
    }
    if ((f.hScale || f.hRotate) && /^(?:img|picture|image)$/i.test(it.name)) at(11, 'WARN', `${f.hScale || f.hRotate} on ${where}: the image moves on hover`, 'Imagery sits still; give the container the feedback');
    const t67 = tw67(it, tw);
    if (t67 && !had('67', doc, it.line)) {
      const text = it.virtual ? '' : twText(it);
      at(67, 'FAIL', `${text ? `"${trunc(text, 24)}" ` : ''}${t67.what}${t67.size != null ? ` at ${t67.size}px` : ''}${t67.em != null ? ` tracked ${t67.em}em` : ''} on ${where}`, 'Sentence case in the body face, a step smaller, untracked: drop uppercase and the tracking-* class');
    }
    const e54 = tw54(it);
    if (e54 && !had('54', doc, it.line)) {
      at(54, 'FAIL', `eyebrow ${e54.text ? `"${trunc(e54.text, 24)}" ` : ''}before <${e54.next}> (${e54.signal} at ${it.frame.size}px)`, 'Cut it; open the section another way (craft.md, Opening a section)');
    }
    if (!monoOk && f.mono && !it.virtual && !it.frame.code && !/^(?:code|pre|kbd|samp|time|var)$/.test(it.name) && it.frame.size != null && it.frame.size <= 14) {
      const text = twText(it);
      if (/[A-Za-z]/.test(text) && !twDataText(text)) at(64, 'FAIL', `font-mono on "${trunc(text, 24)}" at ${it.frame.size}px (${where})`, 'Labels in the body face at a smaller size and normal case; font-mono only for code and figures');
    }
  }
  for (const [doc, list] of byDoc) {
    const pal = new Map();
    let palAt = null;
    for (const it of list) for (const p of it.info.pal) if (!pal.has(p)) { pal.set(p, it); if (pal.size === 5) palAt = it; }
    if (palAt) report(74, 'WARN', doc.file, palAt.line, `default palette instead of theme tokens: ${pal.size} distinct palette classes (${[...pal.keys()].slice(0, 4).join(' ')})`, 'Extend the Tailwind theme with the Hallmark tokens and use those names');
    const scaled = list.filter((it) => it.info.hScale);
    if (scaled.length >= 3) report(11, 'WARN', doc.file, scaled[2].line, `hover scale on ${scaled.length} elements in this file (${scaled.slice(0, 3).map((it) => it.info.hScale).join(', ')})`, 'One hover signal per element; not every card grows');
    const first = new Set(['section', 'header'].map((n) => doc.tags.findIndex((t) => !t.close && t.name === n)).filter((x) => x >= 0));
    const byIdx = new Map();
    for (const it of list) if (it.idx >= 0) byIdx.set(it.idx, it);
    for (const it of list) {
      if (it.info.vh && !it.virtual && (first.has(it.idx) || it.info.hero)) report('6a', 'FAIL', doc.file, it.line, `hero sized in vh: ${it.info.vh} on ${twWhere(it)}`, 'min-h-dvh or min-h-svh');
      if (it.info.cols3 && it.idx >= 0) {
        const n = twTiles(it, byIdx);
        if (n >= 3) report(3, 'WARN', doc.file, it.line, `icon-tile row: ${n} children of ${twWhere(it)} open on an icon in a rounded filled tile above an h3`, 'Vary column widths or drop the icon tiles');
      }
    }
  }
}

export const EMOJI_ICON = /(?![©®™‼⁉←-⇿])\p{Extended_Pictographic}/u;

export function checkComponentText(ctx) {
  for (const doc of ctx.docs) {
    for (let c = 0; c < doc.comps.length; c++) {
      const t = doc.comps[c];
      if (t.close || t.selfClosing) continue;
      const inner = compInner(doc, c);
      if (!inner || /<(?:p|div|li|section|article|ul|ol|table)\b/i.test(inner)) continue;
      const text = twPlain(doc, inner);
      if (!text) continue;
      if (/(?:link|button|btn|cta)$/i.test(t.name) && /(→|->|›|»|⟶)\s*$/.test(text)) report(63, 'FAIL', doc.file, t.line, `arrow glued to the label "${trunc(text, 40)}" (<${t.name}>)`, 'A verb as the label; the link already says it goes somewhere');
      if ((text.match(/\s[·•]\s/g) || []).length >= 2) report(63, 'FAIL', doc.file, t.line, `middle-dot meta string "${trunc(text, 50)}"`, 'Line breaks, columns or hairlines; one dot in a byline at most');
      if (text.length <= 4 && EMOJI_ICON.test(text)) report('30a', 'FAIL', doc.file, t.line, `emoji icon "${text}" in <${t.name}>`, 'One icon library or custom SVG');
    }
  }
}

export function checkF21(ctx) {
  for (const doc of ctx.docs) {
    if (doc.kind !== 'html') continue;
    let prev = 0;
    for (const m of doc.src.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi)) {
      const level = Number(m[1]);
      if (prev && level > prev + 1) {
        report('F21', 'WARN', doc.file, doc.lineOf(m.index), `h${prev} is followed by h${level} ("${trunc(m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(), 32)}")`, 'Step heading levels one at a time; size a head with CSS, never with its level');
        break;
      }
      prev = level;
    }
  }
}

export function checkF22(ctx) {
  for (const r of ctx.rules) {
    const j = r.decls.find((d) => d.prop === 'text-align' && /^justify\b/.test(d.value.trim()));
    if (j && !r.decls.some((d) => d.prop === 'hyphens' && /auto/.test(d.value))) { report('F22', 'WARN', r.file, j.line, `justified text without hyphenation on ${r.selector}`, 'Set it left, or add hyphens: auto'); return; }
  }
  for (const doc of ctx.docs) {
    const m = /class(?:Name)?\s*=\s*["'][^"']*(?<![\w-])text-justify(?![\w-])/.exec(doc.src);
    if (m && !/(?<![\w-])hyphens-auto(?![\w-])/.test(doc.src)) { report('F22', 'WARN', doc.file, doc.lineOf(m.index), 'justified text without hyphenation (text-justify)', 'Set it left, or add hyphens-auto'); return; }
  }
}

export function checkF23(ctx) {
  for (const doc of ctx.docs) {
    if (doc.kind !== 'html' || !/<html\b/i.test(doc.src)) continue;
    const missing = [];
    const html = /<html\b([^>]*)>/i.exec(doc.src);
    if (!html || !getAttr(html[1], 'lang')) missing.push('lang on <html>');
    if (!/<title\b[^>]*>\s*[^<\s][^<]*<\/title>/i.test(doc.src)) missing.push('a <title>');
    if (!/<meta\b[^>]*\bname\s*=\s*["']description["'][^>]*>/i.test(doc.src)) missing.push('a meta description');
    if (missing.length) report('F23', 'WARN', doc.file, 1, `the document lacks ${missing.join(', ')}`, 'Name the language, title the page in its own words, and describe it in one sentence for link previews');
  }
}

export function checkF24(ctx) {
  const wide = (value) => resolveVars(value, ctx.tokens).split(/,(?![^(]*\))/).some((layer) => {
    if (/\binset\b/.test(layer)) return false;
    const len = [...layer.replace(/(?:oklch|oklab|rgba?|hsla?|color|color-mix)\([^)]*\)/g, '').matchAll(/(-?\d*\.?\d+)(px|rem|em)?(?=\s|$)/g)].map((m) => parseFloat(m[1]) * (m[2] === 'rem' || m[2] === 'em' ? 16 : 1));
    return len.length >= 3 && len[2] + Math.min(0, len[3] || 0) >= 24;
  });
  for (const r of ctx.rules) {
    const sh = r.decls.find((d) => d.prop === 'box-shadow' && d.value.trim() !== 'none');
    if (!sh || !wide(sh.value)) continue;
    const edge = r.decls.find((d) => /^border(?:-(?:top|right|bottom|left|inline|block)(?:-(?:start|end))?)?$/.test(d.prop) && /(?:^|\s)(?:1px|0\.5px|thin|var\(--rule-hair\))(?:\s|$)/.test(d.value) && !/\b(?:none|transparent)\b/.test(d.value));
    if (edge) { report('F24', 'WARN', r.file, sh.line, `a hairline border under a wide soft shadow on ${r.selector}`, 'Commit to one: a defined edge, or elevation by shadow'); return; }
  }
  for (const doc of ctx.docs) {
    const m = /class(?:Name)?\s*=\s*["'][^"']*(?<![\w:-])border(?![\w-])[^"']*(?<![\w:-])shadow-(?:xl|2xl)(?![\w-])|class(?:Name)?\s*=\s*["'][^"']*(?<![\w:-])shadow-(?:xl|2xl)(?![\w-])[^"']*(?<![\w:-])border(?![\w-])/.exec(doc.raw || doc.src);
    if (m) { report('F24', 'WARN', doc.file, doc.lineOf ? doc.lineOf(m.index) : 1, 'a hairline border under a wide soft shadow (border with shadow-xl or shadow-2xl)', 'Commit to one: a defined edge, or elevation by shadow'); return; }
  }
}

export let LIBRARY = null;

export function library() {
  if (LIBRARY) return LIBRARY;
  LIBRARY = new Map();
  const dir = dirname(fileURLToPath(import.meta.url));
  const pFile = existsSync(join(dir, '../data/photos.json')) ? join(dir, '../data/photos.json') : join(dir, 'photos.json');
  try { for (const p of JSON.parse(readFileSync(pFile, 'utf8')).photos) { LIBRARY.set(p.file.split('/').pop(), p); LIBRARY.set(savedName(p.id), p); } } catch { /* no library */ }
  return LIBRARY;
}

// theme.mjs photos --save names a file after its title; match that name back to the library entry.

export const savedName = (id) => id.replace(/\.[a-z]+$/i, '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || `photo-${createHash('sha1').update(id).digest('hex').slice(0, 10)}`;

export const SAVED = /([a-z0-9-]+)-(?:960|1280|1920)\.jpg/g;

export const COMMONS = /upload\.wikimedia\.org\/wikipedia\/commons\/(?:thumb\/)?[0-9a-f]\/[0-9a-f]{2}\/([^/"'\s)?]+)/g;

export const STOCK = /(?:images|plus)\.unsplash\.com\/(premium_photo|photo)-[\w-]+|images\.pexels\.com\/photos\/\d+|cdn\.pixabay\.com\/photo\//g;

export function check76(ctx) {
  const lib = library();
  const text = ctx.docs.filter((d) => d.kind === 'html').map((d) => d.src).join('\n');
  const credited = (p) => /^(CC0|Public domain|PD)/i.test(p.license) || text.includes(p.page) || text.includes(p.page.replace(/^https:/, '')) || text.includes(p.author);
  const seen = new Set();
  for (const doc of ctx.docs) {
    let stock = 0, plus = 0;
    for (const m of doc.src.matchAll(STOCK)) {
      if (m[1] === 'premium_photo') { if (!plus++) report('76', 'FAIL', doc.file, doc.lineOf(m.index), 'an Unsplash+ photo, which needs a paid licence', 'Use a library photograph (theme.mjs photos) or the user\'s own'); }
      else if (!stock++) report('76', 'WARN', doc.file, doc.lineOf(m.index), 'a photo hotlinked from a stock site, whose terms bar images picked by an AI tool', 'Use a library photograph (theme.mjs photos) or the user\'s own; dismiss only if the user supplied this one');
    }
    for (const m of doc.src.matchAll(COMMONS)) {
      const name = m[1].replace(/^\d+px-/, '');
      if (seen.has(name)) continue;
      seen.add(name);
      const p = lib.get(name);
      if (!p) { if (lib.size) report('76', 'WARN', doc.file, doc.lineOf(m.index), `a Commons file that is not in the library (${trunc(decodeURIComponent(name), 40)})`, 'Pick photographs with theme.mjs photos, or check its licence and credit it by hand'); }
      else if (!credited(p)) report('76', 'FAIL', doc.file, doc.lineOf(m.index), `a library photo with no credit on the page (${trunc(p.author, 30)}, ${p.license})`, 'Add its printed credit to the footer\'s Photographs line (imagery.md § 2)');
    }
    for (const m of doc.src.matchAll(SAVED)) {
      const p = lib.get(m[1]);
      if (!p || seen.has(m[1])) continue;
      seen.add(m[1]);
      if (!credited(p)) report('76', 'FAIL', doc.file, doc.lineOf(m.index), `a library photo with no credit on the page (${trunc(p.author, 30)}, ${p.license})`, 'Add its printed credit to the footer\'s Photographs line (imagery.md § 2)');
    }
    if (doc.kind !== 'html') continue;
    for (const m of doc.src.matchAll(/<img\b([^>]*)>/gi)) {
      const src = getAttr(m[1], 'src');
      if ((src == null || !src.trim() || src.trim() === '#') && !getAttr(m[1], 'srcset') && !hasAttr(m[1], 'data-src')) { report('76', 'FAIL', doc.file, doc.lineOf(m.index), 'an <img> with no source', 'Give it the real image, make it a data-slot placeholder, or remove it'); break; }
    }
  }
}
