/** HTML quality diagnostics; adapted from the original Synapse HTML skill. */
import { FRONTMATTER, braceEnd, clsLits, parseHtml, templateMask } from './sloplint-markup.mjs';
import { extname } from 'node:path';

export const JS_EXPR_KW = new Set(['return', 'yield', 'await', 'case', 'default', 'else', 'do', 'throw', 'typeof', 'void', 'delete', 'in', 'of', 'new', 'instanceof']);

export const CLASS_FNS = new Set(['cn', 'clsx', 'classNames', 'classnames', 'twMerge', 'twJoin', 'cva', 'cx', 'tv']);

export function jsxPseudo(src) {
  const n = src.length;
  const out = Array.from({ length: n });
  for (let k = 0; k < n; k++) out[k] = src[k] === '\n' ? '\n' : ' ';
  const classes = [];
  const calls = [];
  let hi = 0, fails = 0, inClass = 0, depth = 0;
  const blank = (a, b) => { for (let k = a; k < b && k < n; k++) out[k] = src[k] === '\n' ? '\n' : ' '; };
  const paint = (a, b) => { for (let k = a; k < b && k < n; k++) out[k] = src[k]; if (b > hi) hi = b; };
  const write = (a, b, text) => {
    blank(a, b);
    let k = a;
    for (const ch of text) { while (k < b && src[k] === '\n') k++; if (k >= b) break; out[k++] = ch; }
    if (b > hi) hi = b;
  };
  const ws = (i) => { while (i < n && /\s/.test(src[i])) i++; return i; };
  const gap = (i) => {
    for (;;) {
      i = ws(i);
      if (src[i] === '/' && src[i + 1] === '*') { const e = src.indexOf('*/', i + 2); if (e < 0) return n; i = e + 2; continue; }
      if (src[i] === '/' && src[i + 1] === '/') { const e = src.indexOf('\n', i); if (e < 0) return n; i = e; continue; }
      return i;
    }
  };
  const strEnd = (i) => {
    const q = src[i];
    let j = i + 1;
    while (j < n && src[j] !== q && src[j] !== '\n') { if (src[j] === '\\') j++; j++; }
    return Math.min(j + 1, n);
  };
  const tplEnd = (i) => {
    let j = i + 1;
    while (j < n && src[j] !== '`') {
      if (src[j] === '\\') { j += 2; continue; }
      if (src[j] === '$' && src[j + 1] === '{') { j = js(j + 2, true) + 1; continue; }
      j++;
    }
    return Math.min(j + 1, n);
  };
  const reEnd = (i) => {
    let j = i + 1, set = false;
    while (j < n && src[j] !== '\n') {
      const c = src[j];
      if (c === '\\') { j += 2; continue; }
      if (c === '[') set = true;
      else if (c === ']') set = false;
      else if (c === '/' && !set) { j++; while (j < n && /[a-z]/i.test(src[j])) j++; return j; }
      j++;
    }
    return -1;
  };
  function js(i, stop) {
    if (depth > 200) return stop ? Math.min(braceEnd(src, i - 1), n) : n;
    depth++;
    const r = jsScan(i, stop);
    depth--;
    return r;
  }
  function jsScan(i, stop) {
    let level = 0, val = false;
    while (i < n) {
      const c = src[i];
      if (c === ' ' || c === '\n' || c === '\t' || c === '\r') { i++; continue; }
      if (c === '/' && src[i + 1] === '/') { const e = src.indexOf('\n', i); i = e < 0 ? n : e; continue; }
      if (c === '/' && src[i + 1] === '*') { const e = src.indexOf('*/', i + 2); i = e < 0 ? n : e + 2; continue; }
      if (c === '"' || c === "'") { i = strEnd(i); val = true; continue; }
      if (c === '`') { i = tplEnd(i); val = true; continue; }
      if (c === '{') { level++; i++; val = false; continue; }
      if (c === '}') { if (stop && level === 0) return i; level--; i++; val = true; continue; }
      if (c === ')' || c === ']') { i++; val = true; continue; }
      if (c === '<' && !val && fails < 500 && /[A-Za-z_$>]/.test(src[i + 1] || '')) {
        const e = el(i);
        if (e > 0) { i = e; val = true; continue; }
        fails++;
      }
      if (c === '/' && !val) { const e = reEnd(i); if (e > 0) { i = e; val = true; continue; } }
      if (/[A-Za-z_$]/.test(c)) {
        let j = i + 1;
        while (j < n && /[\w$]/.test(src[j])) j++;
        const w = src.slice(i, j);
        val = !JS_EXPR_KW.has(w);
        if (!inClass && CLASS_FNS.has(w) && src[i - 1] !== '.' && src[ws(j)] === '(') calls.push(i);
        i = j;
        continue;
      }
      if (c >= '0' && c <= '9') { let j = i + 1; while (j < n && /[\w.]/.test(src[j])) j++; i = j; val = true; continue; }
      i++;
      val = false;
    }
    return n;
  }
  function el(start) {
    if (depth > 200) return -1;
    const mc = classes.length, mk = calls.length;
    depth++;
    const e = tag(start);
    depth--;
    if (e < 0) { blank(start, Math.max(hi, start + 1)); hi = start; classes.length = mc; calls.length = mk; }
    return e;
  }
  function tag(start) {
    let i = start + 1;
    if (src[i] === '>') return kids(i + 1, '');
    let j = i;
    while (j < n && /[\w$.:-]/.test(src[j])) j++;
    const name = src.slice(i, j);
    paint(start, j);
    i = j;
    let cls = null;
    for (;;) {
      i = gap(i);
      if (i >= n) return -1;
      const c = src[i];
      if (c === '/' && src[i + 1] === '>') { paint(i, i + 2); if (cls) classes.push([start, cls]); return i + 2; }
      if (c === '>') { paint(i, i + 1); i++; break; }
      if (c === '{') { const e = js(i + 1, true); if (e >= n) return -1; blank(i, e + 1); i = e + 1; continue; }
      if (!/[A-Za-z_$]/.test(c)) return -1;
      let k = i + 1;
      while (k < n && /[\w$:.-]/.test(src[k])) k++;
      const attr = src.slice(i, k);
      let v = ws(k);
      if (src[v] !== '=') { paint(i, k); i = k; continue; }
      v = ws(v + 1);
      const q = src[v];
      const isCls = attr === 'className' || attr === 'class';
      let e;
      if (q === '"' || q === "'") {
        e = src.indexOf(q, v + 1);
        if (e < 0) return -1;
        if (isCls) cls = (cls || []).concat(src.slice(v + 1, e).split(/\s+/).filter(Boolean));
        else paint(i, e + 1);
      } else if (q === '{') {
        if (isCls) inClass++;
        e = js(v + 1, true);
        if (isCls) inClass--;
        if (e >= n) return -1;
        if (isCls) cls = (cls || []).concat(clsLits(src.slice(v + 1, e)));
        else { paint(i, v); write(v, e + 1, '"' + src.slice(v + 1, e).replace(/[^\w$.\-/:#@]+/g, ' ') + '"'); }
      } else if (q === '<') {
        e = el(v) - 1;
        if (e < 0) return -1;
        blank(i, e + 1);
      } else return -1;
      if (isCls && cls) write(i, e + 1, 'class="' + cls.join(' ').replace(/"/g, "'").replace(/[<>]/g, ' ') + '"');
      i = e + 1;
    }
    if (cls) classes.push([start, cls]);
    return kids(i, name);
  }
  function kids(i, name) {
    while (i < n) {
      const c = src[i];
      if (c === '{') { const e = js(i + 1, true); if (e >= n) return -1; i = e + 1; continue; }
      if (c === '<') {
        if (src[i + 1] === '/') {
          const k = ws(i + 2);
          let j = k;
          while (j < n && /[\w$.:-]/.test(src[j])) j++;
          const e = ws(j);
          if (src[e] !== '>' || src.slice(k, j) !== name) return -1;
          if (name) paint(i, e + 1);
          return e + 1;
        }
        if (/[A-Za-z_$>]/.test(src[i + 1] || '')) { const e = el(i); if (e > 0) { i = e; continue; } }
        i++;
        continue;
      }
      out[i] = c;
      if (i >= hi) hi = i + 1;
      i++;
    }
    return -1;
  }
  js(0, false);
  return { pseudo: out.join(''), classAt: new Map(classes), calls };
}

export function classCalls(src, sites) {
  const out = [];
  let last = -1;
  for (const pos of [...sites].sort((a, b) => a - b)) {
    if (pos < last) continue;
    const open = src.indexOf('(', pos);
    if (open < 0) continue;
    let depth = 0, i = open;
    for (; i < src.length; i++) {
      const c = src[i];
      if (c === '/' && src[i + 1] === '/') { const e = src.indexOf('\n', i); i = e < 0 ? src.length : e; continue; }
      if (c === '/' && src[i + 1] === '*') { const e = src.indexOf('*/', i + 2); i = e < 0 ? src.length : e + 1; continue; }
      if (c === '"' || c === "'" || c === '`') { i++; while (i < src.length && src[i] !== c) { if (src[i] === '\\') i++; i++; } continue; }
      if (c === '(') depth++;
      else if (c === ')' && --depth === 0) break;
    }
    last = i;
    const toks = clsLits(src.slice(open + 1, i));
    if (toks.length) out.push({ pos, name: /^[\w$]+/.exec(src.slice(pos))[0], toks });
  }
  return out;
}

export function scriptSites(src, kind) {
  const ranges = [];
  for (const m of src.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) ranges.push([m.index + m[0].length - m[1].length - 9, m.index + m[0].length - 9]);
  const fm = kind === 'astro' ? FRONTMATTER.exec(src) : null;
  if (fm) ranges.push([0, fm[0].length]);
  const sites = [];
  for (const [a, b] of ranges) {
    for (const m of src.slice(a, b).matchAll(/(?<![\w$.])(?:cn|clsx|classNames|classnames|twMerge|twJoin|cva|cx|tv)\s*\(/g)) sites.push(a + m.index);
  }
  return sites;
}

export function parseDoc(file, raw) {
  const ext = extname(file).toLowerCase();
  if (ext === '.jsx' || ext === '.tsx') {
    const j = jsxPseudo(raw);
    const doc = parseHtml(file, j.pseudo, 'jsx');
    doc.styles = [];
    doc.scripts = raw;
    doc.classAt = j.classAt;
    doc.virtuals = classCalls(raw, j.calls);
    doc.raw = raw;
    return doc;
  }
  const kind = ext === '.html' ? 'html' : ext.slice(1);
  const doc = parseHtml(file, templateMask(raw, kind), kind);
  doc.raw = raw;
  doc.virtuals = kind === 'html' ? [] : classCalls(raw, scriptSites(raw, kind));
  return doc;
}

export function getAttr(attrStr, name) {
  const re = new RegExp(`(?:^|\\s)${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>/]+))`, 'i');
  const m = re.exec(attrStr);
  if (!m) return null;
  return m[2] ?? m[3] ?? m[4] ?? '';
}

export function hasAttr(attrStr, name) {
  return new RegExp(`(?:^|\\s)${name}(?=[\\s=/]|$)`, 'i').test(attrStr);
}

export function directChildren(doc, idx) {
  const open = doc.tags[idx];
  if (open.close || open.selfClosing) return [];
  const children = [];
  let depth = 1;
  let childStart = -1, childOpen = null, childIdx = -1;
  for (let i = idx + 1; i < doc.tags.length; i++) {
    const t = doc.tags[i];
    if (t.close) {
      depth--;
      if (depth === 0) break;
      if (depth === 1 && childOpen) {
        children.push({ name: childOpen.name, open: doc.src.slice(childOpen.pos, childOpen.end), html: doc.src.slice(childStart, t.end), idx: childIdx });
        childOpen = null;
      }
      continue;
    }
    if (depth === 1) {
      if (t.selfClosing) {
        children.push({ name: t.name, open: doc.src.slice(t.pos, t.end), html: doc.src.slice(t.pos, t.end), idx: i });
      } else {
        childStart = t.pos; childOpen = t; childIdx = i;
      }
    }
    if (!t.selfClosing) depth++;
  }
  return children;
}

export function ancestorMap(doc) {
  if (doc._anc) return doc._anc;
  const map = new Map();
  const stack = [];
  for (let i = 0; i < doc.tags.length; i++) {
    const t = doc.tags[i];
    if (t.close) { stack.pop(); continue; }
    map.set(i, stack.slice());
    if (!t.selfClosing) stack.push(t.name);
  }
  doc._anc = map;
  return map;
}
