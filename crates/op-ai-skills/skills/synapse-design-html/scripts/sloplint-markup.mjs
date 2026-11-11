/** HTML quality diagnostics; adapted from the original Synapse HTML skill. */
import { readdirSync, realpathSync, statSync } from 'node:fs';
import { basename, extname, join, resolve } from 'node:path';

export const DOC_EXT = new Set(['.html', '.jsx', '.tsx', '.vue', '.svelte', '.astro']);

export const BUILD_DIRS = new Set(['dist', 'build', 'coverage']);

export function collectFiles(paths) {
  const files = [];
  const seen = new Set();
  const visit = (p, top) => {
    const abs = resolve(p);
    let st;
    let real;
    try { st = statSync(abs); real = realpathSync(abs); } catch { console.error(`sloplint: cannot read ${p}`); if (top) process.exit(2); return; }
    if (st.isDirectory()) {
      const base = basename(abs);
      if (base === 'node_modules' || (!top && (base.startsWith('.') || BUILD_DIRS.has(base)))) return;
    }
    if (seen.has(real)) return;
    seen.add(real);
    if (st.isDirectory()) {
      for (const e of readdirSync(abs)) visit(join(abs, e), false);
    } else {
      const ext = extname(abs).toLowerCase();
      if (ext === '.css' || DOC_EXT.has(ext)) files.push(abs);
    }
  };
  for (const p of paths) visit(p, true);
  return files;
}

export function stripComments(src) {
  let out = '';
  let i = 0;
  while (i < src.length) {
    if (src[i] === '/' && src[i + 1] === '*') {
      const end = src.indexOf('*/', i + 2);
      const stop = end === -1 ? src.length : end + 2;
      out += src.slice(i, stop).replace(/[^\n]/g, ' ');
      i = stop;
    } else if (src[i] === '"' || src[i] === "'") {
      const q = src[i]; let j = i + 1;
      while (j < src.length && src[j] !== q) { if (src[j] === '\\') j++; j++; }
      out += src.slice(i, Math.min(j + 1, src.length)); i = j + 1;
    } else { out += src[i]; i++; }
  }
  return out;
}

export function parseCss(source, file, lineOffset = 0) {
  const src = stripComments(source);
  const nl = [];
  for (let i = 0; i < src.length; i++) if (src[i] === '\n') nl.push(i);
  const lineOf = (pos) => {
    let lo = 0, hi = nl.length;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (nl[mid] < pos) lo = mid + 1; else hi = mid; }
    return lo + 1 + lineOffset;
  };
  const rules = [];
  const flatBody = (s, e) => {
    const out = src.slice(s, e).split('');
    let depth = 0, edge = -1;
    for (let i = 0; i < out.length; i++) {
      const c = out[i];
      if (c === '{') {
        if (depth === 0) for (let k = edge + 1; k < i; k++) if (out[k] !== '\n') out[k] = ' ';
        depth++; out[i] = ' ';
      } else if (c === '}') {
        depth = Math.max(0, depth - 1); out[i] = ' ';
        if (depth === 0) edge = i;
      } else if (depth > 0) { if (c !== '\n') out[i] = ' '; }
      else if (c === ';') edge = i;
    }
    return out.join('');
  };
  const nestSel = (sel, parent) => {
    const p = parent.includes(',') ? `:is(${parent})` : parent;
    return sel.split(/,(?![^(]*\))/).map((part) => part.includes('&') ? part.trim().replace(/&/g, p) : `${p} ${part.trim()}`).join(', ');
  };
  const makeRule = (selector, s, e, media, keyframes) => {
    const body = flatBody(s, e);
    const decls = [];
    let off = 0;
    for (const part of body.split(';')) {
      const idx = part.indexOf(':');
      if (idx > 0) {
        const prop = part.slice(0, idx).trim().toLowerCase();
        const value = part.slice(idx + 1).trim().replace(/!important\s*$/i, '').trim();
        if (prop && value && /^-{0,2}[a-z]/.test(prop) && !/[{}]/.test(prop)) {
          decls.push({ prop, value, line: lineOf(s + off + idx) });
        }
      }
      off += part.length + 1;
    }
    return { selector, decls, media: media || null, keyframes: keyframes || null, file, line: lineOf(s) };
  };
  const walk = (start, end, media, keyframes, parent = null) => {
    let i = start;
    while (i < end) {
      while (i < end && /[\s;]/.test(src[i])) i++;
      if (i >= end) break;
      let j = i;
      while (j < end && src[j] !== '{' && src[j] !== '}' && src[j] !== ';') j++;
      if (j >= end) break;
      if (src[j] === '}' || src[j] === ';') { i = j + 1; continue; }
      const selector = src.slice(i, j).trim().replace(/\s+/g, ' ');
      const blockStart = j + 1;
      let depth = 1, k = blockStart;
      while (k < end && depth > 0) {
        if (src[k] === '{') depth++;
        else if (src[k] === '}') depth--;
        k++;
      }
      const blockEnd = Math.max(blockStart, k - 1);
      if (selector.startsWith('@')) {
        if (/^@(media|supports|layer|container|scope)/i.test(selector)) {
          const q = /^@media/i.test(selector) ? selector.replace(/^@media/i, '').trim() : media;
          if (parent) rules.push(makeRule(parent, blockStart, blockEnd, q, keyframes));
          walk(blockStart, blockEnd, q, keyframes, parent);
        } else if (/^@(-webkit-)?keyframes/i.test(selector)) {
          const name = selector.replace(/^@(-webkit-)?keyframes/i, '').trim();
          walk(blockStart, blockEnd, media, name || 'anon');
        } else if (/^@font-face/i.test(selector)) {
          rules.push(makeRule('@font-face', blockStart, blockEnd, media, null));
        } else if (/^@theme\b/i.test(selector)) {
          rules.push(makeRule('@theme', blockStart, blockEnd, media, null));
          walk(blockStart, blockEnd, media, keyframes);
        }
      } else {
        const sel = parent && !keyframes ? nestSel(selector, parent) : selector;
        rules.push(makeRule(sel, blockStart, blockEnd, media, keyframes));
        if (!keyframes && src.slice(blockStart, blockEnd).includes('{')) walk(blockStart, blockEnd, media, keyframes, sel);
      }
      i = k;
    }
  };
  walk(0, src.length, null, null);
  return rules;
}

export const VOID_TAGS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);

export const HTML_NAMES = new Set(('a abbr address area article aside audio b base bdi bdo blockquote body br button canvas caption cite code col colgroup data datalist dd del details dfn dialog div dl dt em embed fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 head header hgroup hr html i iframe img input ins kbd label legend li link main map mark menu meta meter nav noscript object ol optgroup option output p param picture pre progress q rp rt ruby s samp script search section select slot small source span strong style sub summary sup svg table tbody td template textarea tfoot th thead time title tr track u ul var video wbr').split(' '));

export function parseHtml(file, src, kind = 'html') {
  const nl = [];
  for (let i = 0; i < src.length; i++) if (src[i] === '\n') nl.push(i);
  const lineOf = (pos) => {
    let lo = 0, hi = nl.length;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (nl[mid] < pos) lo = mid + 1; else hi = mid; }
    return lo + 1;
  };
  const styles = [];
  const styleRe = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
  let m;
  while ((m = styleRe.exec(src))) {
    styles.push({ css: m[1], lineOffset: lineOf(m.index) - 1 });
  }
  let scripts = '';
  const scriptRe = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  while ((m = scriptRe.exec(src))) scripts += m[1] + '\n';

  const pad = (t) => t.replace(/[^\n]/g, ' ');
  const masked = src
    .replace(/<!--[\s\S]*?-->/g, pad)
    .replace(/(<(script|style)\b[^>]*>)([\s\S]*?)(<\/\2\s*>)/gi, (m0, open, tag, body, close) => open + pad(body) + close);
  const tags = [];
  const comps = [];
  const tagRe = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:"[^"]*"|'[^']*'|[^>"'])*)>/g;
  while ((m = tagRe.exec(masked))) {
    if (kind !== 'html' && !HTML_NAMES.has(m[2])) {
      comps.push({ close: m[1] === '/', name: m[2], attrs: m[3] || '', pos: m.index, end: m.index + m[0].length, selfClosing: /\/\s*$/.test(m[3] || ''), line: lineOf(m.index) });
      continue;
    }
    tags.push({
      close: m[1] === '/', name: m[2].toLowerCase(), attrs: m[3] || '',
      pos: m.index, end: m.index + m[0].length,
      selfClosing: /\/\s*$/.test(m[3] || '') || VOID_TAGS.has(m[2].toLowerCase()),
      line: lineOf(m.index),
    });
  }
  const noScript = src.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');
  const text = noScript.replace(/<[^>]*>/g, ' ')
    .replace(/&quot;|&#0?34;/g, '"').replace(/&#0?39;|&apos;/g, "'")
    .replace(/&hellip;|&#8230;/g, '\u2026').replace(/&mdash;|&#8212;|&#x2014;/gi, '\u2014').replace(/&ndash;|&#8211;|&#x2013;/gi, '\u2013')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ').replace(/[ \t]+/g, ' ');
  return { file, src, masked, styles, scripts, tags, text, lineOf, kind, comps };
}

export function braceEnd(s, j) {
  let depth = 0;
  for (let i = j; i < s.length; i++) {
    const c = s[i];
    if (c === '"' || c === "'" || c === '`') {
      i++;
      while (i < s.length && s[i] !== c) { if (s[i] === '\\') i++; i++; }
      continue;
    }
    if (c === '{') depth++;
    else if (c === '}' && --depth === 0) return i;
  }
  return s.length;
}

export const FRONTMATTER = /^\s*---[^\n]*\n[\s\S]*?\n---/;

export function templateMask(src, kind) {
  const n = src.length;
  let out = null;
  const put = (k, ch) => { if (!out) out = src.split(''); out[k] = ch; };
  const blank = (a, b) => { for (let k = a; k < b; k++) if (src[k] !== '\n' && src[k] !== ' ') put(k, ' '); };
  const lower = src.toLowerCase();
  const braces = kind === 'svelte' || kind === 'astro';
  let i = 0;
  if (kind === 'astro') {
    const fm = FRONTMATTER.exec(src);
    if (fm) { blank(0, fm[0].length); i = fm[0].length; }
  }
  while (i < n) {
    const lt = src.indexOf('<', i);
    if (lt < 0) break;
    if (src.startsWith('<!--', lt)) { const e = src.indexOf('-->', lt + 4); i = e < 0 ? n : e + 3; continue; }
    if (!/[A-Za-z]/.test(src[lt + 1] || '')) { i = lt + 1; continue; }
    let j = lt + 1;
    while (j < n && /[\w:.-]/.test(src[j])) j++;
    const name = lower.slice(lt + 1, j);
    while (j < n && src[j] !== '>') {
      const c = src[j];
      if (c === '"' || c === "'") {
        let e = src.indexOf(c, j + 1);
        if (e < 0) e = n;
        for (let k = j + 1; k < e; k++) if (src[k] === '<' || src[k] === '>') put(k, ' ');
        j = e + 1;
        continue;
      }
      if (c === '{' && braces) { const e = braceEnd(src, j); blank(j + 1, e); j = e + 1; continue; }
      j++;
    }
    i = j + 1;
    if (name === 'script' || name === 'style' || name === 'textarea') {
      const e = lower.indexOf('</' + name, i);
      i = e < 0 ? n : e;
    }
  }
  return out ? out.join('') : src;
}

export const cutGlued = (seg, after, before) => {
  let s = seg;
  if (after) s = s.replace(/^\S+/, '');
  if (before) s = s.replace(/\S+$/, '');
  return s;
};

export function clsLits(s, level = 0) {
  if (level > 20) return [];
  const parts = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === '/' && s[i + 1] === '/') { const e = s.indexOf('\n', i); i = e < 0 ? s.length : e; continue; }
    if (c === '/' && s[i + 1] === '*') { const e = s.indexOf('*/', i + 2); i = e < 0 ? s.length : e + 2; continue; }
    if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < s.length && s[j] !== c && s[j] !== '\n') { if (s[j] === '\\') j++; j++; }
      parts.push(s.slice(i + 1, j));
      i = j + 1;
      continue;
    }
    if (c === '`') {
      let j = i + 1, seg = '', after = false;
      while (j < s.length && s[j] !== '`') {
        if (s[j] === '\\') { seg += s[j + 1] || ''; j += 2; continue; }
        if (s[j] === '$' && s[j + 1] === '{') {
          parts.push(cutGlued(seg, after, true));
          const e = braceEnd(s, j + 1);
          parts.push(clsLits(s.slice(j + 2, e), level + 1).join(' '));
          j = e + 1; seg = ''; after = true;
          continue;
        }
        seg += s[j]; j++;
      }
      parts.push(cutGlued(seg, after, false));
      i = j + 1;
      continue;
    }
    i++;
  }
  return parts.join(' ').split(/\s+/).filter(Boolean);
}
