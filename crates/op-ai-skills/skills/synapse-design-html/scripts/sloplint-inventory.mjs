/** HTML quality diagnostics; adapted from the original Synapse HTML skill. */
import { rel } from './sloplint-color.mjs';
import { contexts, domInventories } from './sloplint.mjs';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

export const squash = (t) => t.replace(/\s+/g, ' ').trim();

export const escRe = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function wiringOf(src) {
  const body = src.replace(/<!--[\s\S]*?-->/g, '');
  const w = { handlers: [], links: [], fields: [], hooks: [], ids: [], scripts: [] };
  const val = String.raw`("[^"]*"|'[^']*'|\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\})`;
  for (const m of body.matchAll(new RegExp(String.raw`(?<![\w-])(on[A-Z]\w*|on:[\w|]+|@[a-z][\w.:-]*|v-on:[\w.:-]+|on(?:click|submit|change|input|keydown|keyup|blur|focus))\s*=\s*` + val, 'g'))) w.handlers.push(`${m[1]}=${squash(m[2])}`);
  for (const m of body.matchAll(new RegExp(String.raw`(?<![\w:-])(?:href|to|action)\s*=\s*` + val, 'g'))) {
    const tag = (/<([A-Za-z][\w.-]*)[^<]*$/.exec(body.slice(Math.max(0, m.index - 600), m.index)) || [])[1] || '';
    if (/^(link|base|use|image|script|style)$/.test(tag)) continue;
    const v = squash(m[1]).replace(/^["']|["']$/g, '').replace(/^\.\//, '');
    if (v && v !== '#') w.links.push(v);
  }
  for (const m of body.matchAll(/(?<![\w-])name\s*=\s*["']([^"']+)["']/g)) {
    const tag = (/<([A-Za-z][\w.-]*)[^<]*$/.exec(body.slice(Math.max(0, m.index - 600), m.index)) || [])[1] || '';
    if (!/^(meta|slot|iframe|param|a|map|object|link)$/i.test(tag)) w.fields.push(m[1]);
  }
  for (const m of body.matchAll(/\bregister\(\s*["']([\w.-]+)["']/g)) w.fields.push(m[1]);
  for (const m of body.matchAll(new RegExp(String.raw`\bdata-(?:testid|test|cy|qa|track[\w-]*|analytics[\w-]*|event[\w-]*|gtm[\w-]*)\s*=\s*` + val, 'g'))) w.hooks.push(squash(m[1]).replace(/^["']|["']$/g, ''));
  for (const m of body.matchAll(/(?<![\w-])id\s*=\s*["']([^"'{}\s]+)["']/g)) w.ids.push(m[1]);
  for (const m of body.matchAll(/<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi)) w.scripts.push(m[1].split('?')[0].replace(/^\.\//, ''));
  return w;
}

export function scriptText(doc) {
  const raw = doc.raw || doc.src;
  let js = [...raw.matchAll(/<script\b(?![^>]*\bsrc\s*=)(?![^>]*application\/(?:ld\+)?json)[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]).join('\n');
  for (const m of raw.matchAll(/<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi)) {
    if (/^(?:https?:)?\/\//.test(m[1])) continue;
    try { js += '\n' + readFileSync(resolve(dirname(doc.file), m[1].split('?')[0]), 'utf8'); } catch {}
  }
  return js;
}

export function scriptSelectors(doc) {
  const js = scriptText(doc);
  const sels = new Set();
  for (const m of js.matchAll(/getElementById\(\s*["'`]([\w-]+)["'`]/g)) sels.add('#' + m[1]);
  for (const m of js.matchAll(/(?:querySelector(?:All)?|closest|matches)\(\s*(["'`])((?:(?!\1)[^\\\n])+)\1/g)) if (!m[2].includes('${')) sels.add(m[2].trim());
  return [...sels].sort();
}

export function scriptHooks(doc) {
  const markup = (doc.raw || doc.src).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  const has = (tok) => tok[0] === '#' ? new RegExp(`(?<![\\w-])id\\s*=\\s*["']${escRe(tok.slice(1))}["']`).test(markup)
    : tok[0] === '.' ? new RegExp(`(?<![\\w-])class\\s*=\\s*["'][^"']*(?<![\\w-])${escRe(tok.slice(1))}(?![\\w-])`).test(markup)
      : markup.includes(tok.slice(1));
  const queried = scriptSelectors(doc);
  const tokens = (sel) => [...sel.matchAll(/#[\w-]+|\.[A-Za-z_][\w-]*|\[data-[\w-]+/g)].map((t) => t[0]);
  return { queried, hooked: queried.filter((sel) => { const t = tokens(sel); return t.length > 0 && t.every(has); }) };
}

export function takeInventory() {
  const docs = [...new Set(contexts.flatMap(([, c]) => c.docs))];
  const byFile = {};
  for (const d of docs) { const w = wiringOf(d.raw || d.src); byFile[rel(d.file)] = Object.fromEntries(Object.entries(w).map(([k, v]) => [k, [...new Set(v)].sort()])); }
  const pages = {};
  for (const [file, inv] of Object.entries(domInventories)) if (inv) pages[/^https?:/.test(file) ? file : rel(file)] = inv;
  const scripts = {};
  for (const d of docs) if (d.kind === 'html') {
    const h = scriptHooks(d);
    const dom = domInventories[d.file];
    if (dom && Array.isArray(dom.hooked)) h.dom = dom.hooked;
    h.hides = /\.hidden\s*=|["'`]hidden["'`]/.test(scriptText(d));
    if (h.queried.length || h.hides) scripts[rel(d.file)] = h;
  }
  return { files: byFile, wiring: unionWiring(Object.values(byFile)), scripts, pages };
}

export function unionWiring(list) {
  const u = { handlers: new Set(), links: new Set(), fields: new Set(), hooks: new Set(), ids: new Set() };
  for (const w of list) for (const k of Object.keys(u)) for (const v of w[k] || []) u[k].add(v);
  return Object.fromEntries(Object.entries(u).map(([k, v]) => [k, [...v].sort()]));
}
