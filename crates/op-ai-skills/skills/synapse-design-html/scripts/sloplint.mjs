#!/usr/bin/env node
/** HTML quality diagnostics; adapted from the original Synapse HTML skill. */
import {
  check62, check63, check64, check65, checkF1,
  checkF15, checkF16, checkF2, checkF3, checkF4,
  checkF5, checkF6, checkF7, checkF8, checkF9,
} from './sloplint-accessibility-checks.mjs';
import { buildTokens, isTokenRule, rel, trunc } from './sloplint-color.mjs';
import {
  check42, check42Footer, check46, check47, check48,
  check49, check50, check50Wrap, check53, check54,
  check55, check56, checkCopyTell,
} from './sloplint-content-checks.mjs';
import {
  check19Tells, check38c, check42TwoButton, check47Placeholders, check58Static,
  check67, check68, check69, check70,
} from './sloplint-detail-checks.mjs';
import { scriptSelectors, takeInventory, unionWiring } from './sloplint-inventory.mjs';
import { getAttr, parseDoc } from './sloplint-jsx.mjs';
import { collectFiles, parseCss, stripComments } from './sloplint-markup.mjs';
import {
  ANSWERED, APPSCREEN, DISMISSED, GRADE_RANK, LAYOUT_KEPT,
  VERBATIM, WAIVED, applyWaivers, findings, gateSortKey,
  report, setWaiverState,
} from './sloplint-report.mjs';
import {
  check24a, check25, check26, check27, check28,
  check30, check33, check34, check37, check38a,
  check39, check40_41,
} from './sloplint-structure-checks.mjs';
import {
  check76, checkComponentText, checkF21, checkF22, checkF23,
  checkF24, checkTailwind, twGroup,
} from './sloplint-tailwind-checks.mjs';
import { check11Lift, check15Fade, check29Glow, check65Tailwind, checkF7Pills } from './sloplint-tailwind-parse.mjs';
import {
  check1, check10, check10Motion, check11, check12,
  check15, check17, check18, check19, check2,
  check20, check22, check23, check24, check3,
  check3Stripe, check4, check6a, check7,
} from './sloplint-visual-checks.mjs';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';

/* sloplint: Hallmark's mechanical gate checker. Zero dependencies, Node 18+. Gate ids and tiers: references/review/hallmark-gates.md (if present). */

export const GENRES = ['editorial', 'modern-minimal', 'atmospheric', 'playful'];

export const args = process.argv.slice(2);

export const opts = { genre: null, scope: 'page', json: false, render: false, tier: null, stage: 'page', before: false, kept: false, urls: [], paths: [] };

for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--genre') { opts.genre = args[++i]; }
  else if (a === '--scope') { opts.scope = args[++i]; }
  else if (a === '--json') { opts.json = true; }
  else if (a === '--render') { opts.render = true; }
  else if (a === '--before') { opts.before = true; }
  else if (a === '--kept') { opts.kept = true; }
  else if (a === '--tier') { opts.tier = args[++i]; }
  else if (a === '--stage') { opts.stage = args[++i]; }
  else if (a === '--url') { opts.urls.push(args[++i]); opts.render = true; }
  else if (a === '--help' || a === '-h') { usage(); process.exit(0); }
  else if (a.startsWith('--')) { console.error(`unknown flag ${a}`); usage(); process.exit(2); }
  else opts.paths.push(a);
}

export function usage() {
  console.error('usage: node sloplint.mjs <file-or-dir ...> [--genre editorial|modern-minimal|atmospheric|playful] [--scope page|component|app] [--stage hero|page] [--json] [--render] [--url http://localhost:3000] [--tier floor] [--before | --kept]');
  console.error('--before records the page in .synapse/html-design; --kept checks the redesign against that record');
  console.error('reads .html and .css, plus .jsx .tsx .vue .svelte .astro (Tailwind class strings, cn/clsx/cva calls); skips node_modules, dist, build, coverage and dot folders');
}

if (!opts.paths.length && !opts.urls.length) { usage(); process.exit(2); }

if (!['hero', 'page'].includes(opts.stage)) { console.error('--stage must be hero or page'); process.exit(2); }

if (opts.urls.some((u) => !/^https?:\/\//.test(u || ''))) { console.error('--url takes an http or https address'); process.exit(2); }

if (opts.genre && !GENRES.includes(opts.genre)) {
  console.error(`--genre must be one of: ${GENRES.join(', ')}`); process.exit(2);
}

if (!['page', 'component', 'app'].includes(opts.scope)) {
  console.error('--scope must be page, component or app'); process.exit(2);
}

if (opts.before && opts.kept) { console.error('--before records and --kept compares; pass one'); process.exit(2); }

export const CHECKS = [check1, check2, check3, check3Stripe, check4, check6a, check7, check10, check10Motion, check11,
  check12, check15, check17, check18, check19, check20, check22, check23, check24, check24a,
  check25, check26, check27, check28, check30, check33, check34, check37, check38a,
  check39, check40_41, check42, check42Footer, check46, check47, check48, check49,
  check50, check50Wrap, check53, check54, check55, check56, checkCopyTell, check62, check63, check64, check65, check67, check38c,
  check19Tells, check58Static, check68, check69, check70, check42TwoButton, check47Placeholders, check65Tailwind, check29Glow, check11Lift, check15Fade,
  checkF1, checkF2, checkF3, checkF4, checkF5, checkF6, checkF7, checkF7Pills, checkF8, checkF9, checkF15, checkF16, checkF21, checkF22, checkF23, checkF24, check76,
  checkTailwind, checkComponentText];

export const files = opts.paths.length ? collectFiles(opts.paths) : [];

if (!files.length && !opts.urls.length) { console.error('sloplint: no .html, .css, .jsx, .tsx, .vue, .svelte or .astro files found'); process.exit(2); }

export const groups = new Map();

for (const f of files) {
  const dir = dirname(f);
  if (!groups.has(dir)) groups.set(dir, { css: [], html: [] });
  const g = groups.get(dir);
  if (extname(f).toLowerCase() === '.css') g.css.push(f);
  else g.html.push(f);
}

export const localRef = (href) => href && !/^(?:[a-z]+:|\/\/)/i.test(href) ? href.split(/[?#]/)[0] : null;

export function importsOf(css, from) {
  const out = [];
  for (const m of stripComments(css).matchAll(/@import\s+(?:url\(\s*)?["']?([^"')\s;]+)["']?\s*\)?/gi)) {
    const ref = localRef(m[1]);
    if (ref) out.push(resolve(from, ref));
  }
  return out;
}

export function linksOf(doc, from) {
  const out = [];
  for (const t of doc.tags) {
    if (t.close || t.name !== 'link' || !/stylesheet/i.test(getAttr(t.attrs, 'rel') || '')) continue;
    const ref = localRef(getAttr(t.attrs, 'href'));
    if (ref) out.push(resolve(from, ref));
  }
  return out;
}

export const projectRoots = new Map();

export function projectRoot(dir) {
  if (projectRoots.has(dir)) return projectRoots.get(dir);
  const up = dirname(dir);
  const root = existsSync(join(dir, 'package.json')) ? dir : up === dir ? null : projectRoot(up);
  projectRoots.set(dir, root);
  return root;
}

export function shareProjects(contexts) {
  const byRoot = new Map();
  for (const [dir, ctx] of contexts) {
    const root = projectRoot(dir);
    if (!root) continue;
    if (!byRoot.has(root)) byRoot.set(root, []);
    byRoot.get(root).push(ctx);
  }
  for (const list of byRoot.values()) {
    const parts = list.filter((c) => !c.cssFiles.length && c.docs.length && c.docs.every((d) => d.kind !== 'html'));
    if (!parts.length || parts.length === list.length) continue;
    const tokens = {};
    const shared = { focus: false, active: false, disabled: false, prm: false, once: new Set() };
    for (const c of list) {
      Object.assign(tokens, c.tokens);
      const tv = twGroup(c).variants;
      const sel = (re) => c.rules.some((r) => re.test(r.selector));
      shared.focus = shared.focus || sel(/:focus/) || [...tv].some((v) => v.startsWith('focus'));
      shared.active = shared.active || sel(/:active/) || tv.has('active');
      shared.disabled = shared.disabled || sel(/:disabled|\[disabled\]|aria-disabled/) || tv.has('disabled') || tv.has('aria-disabled');
      shared.prm = shared.prm || /prefers-reduced-motion/i.test(stripComments(c.allCss)) || tv.has('motion-reduce') || tv.has('motion-safe');
    }
    for (const c of list) c.shared = shared;
    const stamped = list.find((c) => !parts.includes(c) && /Hallmark\s*·/.test(c.stampText));
    for (const c of parts) {
      if (stamped && !/Hallmark\s*·/.test(c.stampText)) c.stampText = `${c.stampText}\n${stamped.stampText}`;
      c.twTok = { ...tokens, ...c.tokens };
      c._tw = null;
    }
  }
}

export const waiversByKey = new Map();

export const postureByFile = {};

export const heroPostureByFile = {};

export const photoShapeByFile = {};

export const jobByFile = {};

export const contexts = [];

export const parsedDocs = new Map();

export const docOf = (f) => {
  if (parsedDocs.has(f)) return parsedDocs.get(f);
  let doc = null;
  try { doc = parseDoc(f, readFileSync(f, 'utf8')); } catch (e) { console.error(`sloplint: skipped ${rel(f)}, it could not be parsed (${e.message})`); }
  parsedDocs.set(f, doc);
  return doc;
};

export function buildContext(key, cssList, docList) {
  const cssFiles = [];
  const rules = [];
  const docs = [];
  const inGroup = new Set([...cssList, ...docList.map((d) => d.file)]);
  const pending = [];
  for (const f of cssList) {
    const raw = readFileSync(f, 'utf8');
    cssFiles.push({ file: f, raw });
    rules.push(...parseCss(raw, f));
    pending.push(...importsOf(raw, dirname(f)));
  }
  for (const doc of docList) {
    docs.push(doc);
    for (const st of doc.styles) {
      rules.push(...parseCss(st.css, doc.file, st.lineOffset));
      pending.push(...importsOf(st.css, dirname(doc.file)));
    }
    pending.push(...linksOf(doc, dirname(doc.file)));
  }
  const reached = new Set();
  while (pending.length) {
    const p = pending.shift();
    if (inGroup.has(p) || extname(p).toLowerCase() !== '.css' || !existsSync(p)) continue;
    inGroup.add(p);
    reached.add(p);
    let raw;
    try { raw = readFileSync(p, 'utf8'); } catch { continue; }
    cssFiles.push({ file: p, raw, attached: true });
    rules.push(...parseCss(raw, p));
    pending.push(...importsOf(raw, dirname(p)));
  }
  const head40 = (t) => t.split('\n').slice(0, 40).join('\n');
  const stampText = [
    ...cssFiles.map((c) => head40(c.raw)),
    ...docs.flatMap((d) => d.styles.map((st) => head40(st.css))),
  ].join('\n');
  const posture = (/posture:\s*(restrained|committed|full-palette|drenched)/i.exec(stampText)?.[1] || 'restrained').toLowerCase();
  // a custom page designs its own hero: 44a and 44c read it as free
  const heroPosture = /theme:\s*custom\b/i.test(stampText) ? 'custom' : (/hero:\s*(settled|banner|poster|ledge|corridor|stage|counter|index)\b/i.exec(stampText)?.[1] || '').toLowerCase();
  const photoShape = /shape:\s*(photographic|portfolio)/i.test(stampText);
  const job = ((/\bjob:\s*([a-z][a-z /-]*)/i.exec(stampText) || [])[1] || '').trim().toLowerCase();
  for (const d of docs) { postureByFile[d.file] = posture; heroPostureByFile[d.file] = heroPosture; photoShapeByFile[d.file] = photoShape; jobByFile[d.file] = job; }
  const allCss = cssFiles.map((c) => c.raw).join('\n') + '\n'
    + docs.map((d) => d.styles.map((st) => st.css).join('\n')).join('\n');
  const tokensOnly = !docs.length && rules.length > 0 && rules.every(isTokenRule);
  contexts.push([key, { rules, tokens: buildTokens(rules), docs, cssFiles, genre: opts.genre, stampText, allCss, posture, tokensOnly }]);
  return reached;
}

for (const [dir, g] of groups) {
  const docs = g.html.map(docOf).filter(Boolean);
  const pages = docs.filter((d) => d.kind === 'html');
  const parts = docs.filter((d) => d.kind !== 'html');
  if (!pages.length) { buildContext(dir, g.css, parts); continue; }
  const used = new Set();
  for (const page of pages) {
    const linked = new Set();
    const queue = [...linksOf(page, dirname(page.file)), ...page.styles.flatMap((st) => importsOf(st.css, dirname(page.file)))];
    while (queue.length) {
      const q = queue.shift();
      if (linked.has(q) || !existsSync(q) || extname(q).toLowerCase() !== '.css') continue;
      linked.add(q);
      try { queue.push(...importsOf(readFileSync(q, 'utf8'), dirname(q))); } catch {}
    }
    const own = pages.length === 1 ? g.css : g.css.filter((c) => linked.has(c));
    own.forEach((c) => used.add(c));
    for (const c of linked) used.add(c);
    buildContext(page.file, own, [page]);
  }
  const rest = g.css.filter((c) => !used.has(c));
  if (rest.length || parts.length) buildContext(dir, rest, parts);
}

shareProjects(contexts);

for (const [key, ctx] of contexts) {
  applyWaivers(ctx, key);
  waiversByKey.set(key, { WAIVED, ANSWERED, DISMISSED, VERBATIM, APPSCREEN, LAYOUT_KEPT });
  for (const check of CHECKS) {
    try { check(ctx); } catch (e) {
      console.error(`sloplint: internal error in ${check.name} for ${rel(key)}: ${e.message}`);
    }
  }
}

export let renderNotRun = null;

export let domInventories = {};

if (opts.render) {
  const isShell = (f) => { try { const x = readFileSync(f, 'utf8'); return /<script\b[^>]*type\s*=\s*["']module["'][^>]*\bsrc\s*=\s*["'][^"']+\.(?:tsx?|jsx?|mjs|vue|svelte)["']/i.test(x); } catch { return false; } };
  const htmlFiles = files.filter((f) => extname(f).toLowerCase() === '.html' && !(opts.urls.length && isShell(f)));
  if (!htmlFiles.length && !opts.urls.length) renderNotRun = 'no HTML page to render; pass --url for a running dev server';
  else try {
    const mod = await import(new URL('./sloplint-render.mjs', import.meta.url).href);
    const extra = await mod.renderCheck([...htmlFiles, ...opts.urls], { genre: opts.genre, postureByFile, heroPostureByFile, photoShapeByFile, jobByFile, stage: opts.stage, selectors: opts.before || opts.kept ? Object.fromEntries([...new Set(contexts.flatMap(([, c]) => c.docs))].filter((d) => d.kind === 'html').map((d) => [d.file, scriptSelectors(d)])) : {}, scope: opts.scope === 'app' || [...waiversByKey.values()].some((x) => x.APPSCREEN) ? 'app' : opts.scope, before: opts.before });
    domInventories = extra.inventories || {};
    const allWaivers = { WAIVED: new Set([...waiversByKey.values()].flatMap((x) => [...x.WAIVED])), ANSWERED: new Set([...waiversByKey.values()].flatMap((x) => [...x.ANSWERED])), DISMISSED: new Set([...waiversByKey.values()].flatMap((x) => [...(x.DISMISSED || [])])), VERBATIM: [...waiversByKey.values()].some((x) => x.VERBATIM), APPSCREEN: [...waiversByKey.values()].some((x) => x.APPSCREEN), LAYOUT_KEPT: [...waiversByKey.values()].map((x) => x.LAYOUT_KEPT).find(Boolean) || false };
    for (const f of extra) {
      const w = /^https?:/.test(f.file) ? allWaivers : (waiversByKey.get(f.file) || waiversByKey.get(dirname(f.file)));
      setWaiverState(w);
      report(f.gate, f.grade === 'REFLEX' ? 'FAIL' : f.grade, f.file, f.line, f.evidence, f.fix);
    }
    for (const x of extra.failed || []) { setWaiverState(null); report('render', 'FAIL', x.file, 1, `the page did not render (${trunc(x.message, 60)}); its render gates did not run`, 'Fix the page or the URL and rerun; an unrendered page is never a pass'); }
    if (extra.notRun) renderNotRun = extra.notRun;
  } catch (e) {
    renderNotRun = e.message;
  }
}

export const SNAP = join(process.env.SYNAPSE_DESIGN_TASK_DIR || join(process.cwd(), '.synapse', 'html-design'), 'review', 'before.json');

export let keptLine = null;

if (opts.kept) {
  let was = null;
  try { was = JSON.parse(readFileSync(SNAP, 'utf8')); } catch {}
  setWaiverState(null);
  if (!was) report('kept', 'FAIL', SNAP, 1, 'no before record here; --kept has nothing to compare against', 'Run sloplint with --before from this folder before the redesign starts');
  else {
    const now = takeInventory();
    const outside = Object.keys(was.files || {}).filter((f) => !(f in now.files) && existsSync(resolve(f)));
    if (was.files) was.wiring = unionWiring(Object.entries(was.files).filter(([f]) => !outside.includes(f)).map(([, w]) => w));
    const stamps = contexts.map(([, c]) => c.stampText).join('\n');
    for (const m of stamps.matchAll(/\/\*\s*Hallmark\s*·\s*(dropped|reworded)\s+([^·*]+?)\s*·\s*([^*]+?)\s*\*\//gi)) if (m[2].trim() && m[3].trim().length < 12) report('kept', 'WARN', SNAP, 1, `${m[1]} ${trunc(m[2].trim(), 40)} is not on the record: its reason is under 12 characters`, 'Say why in a clause');
    const allowed = [...stamps.matchAll(/\/\*\s*Hallmark\s*·\s*(dropped|reworded)\s+([^·*]+?)\s*·\s*([^*]+?)\s*\*\//gi)].filter((m) => m[3].trim().length >= 12).flatMap((m) => (m[1].toLowerCase() === 'reworded' ? [...m[2].matchAll(/"([^"]+)"/g)].map((q) => q[1]) : m[2].split(',')).map((t) => t.trim().replace(/^[`"']|[`"']$/g, '').toLowerCase()).filter(Boolean));
    const acked = {};
    const gone = (a, b, cat) => (a || []).filter((x) => {
      if ((b || []).includes(x)) return false;
      if (allowed.some((t) => x.toLowerCase() === t || (t.length >= 4 && x.toLowerCase().includes(t)))) { if (cat) (acked[cat] ||= new Set()).add(x); return false; }
      return true;
    });
    const fieldsGone = (b, a, where) => {
      const named = (b || []).filter((x) => !x.startsWith('unnamed '));
      const spare = (a || []).length - named.filter((x) => (a || []).includes(x)).length;
      const short = Math.max(0, (b || []).length - named.length - spare);
      return [...gone(named, a, 'fields'), ...(short ? [`${short} field${short > 1 ? 's' : ''} with no name${where}`] : [])];
    };
    const hard = { links: new Set(), fields: new Set(), forms: new Set(), handlers: new Set(), 'test hooks': new Set(), scripts: new Set() };
    const soft = { headings: new Set(), figures: new Set(), images: new Set(), ids: new Set() };
    const total = { links: new Set(was.wiring.links), fields: new Set(was.wiring.fields), handlers: new Set(was.wiring.handlers), 'test hooks': new Set(was.wiring.hooks), headings: new Set(), figures: new Set() };
    for (const x of gone(was.wiring.links, now.wiring.links, 'links')) hard.links.add(x);
    for (const x of gone(was.wiring.fields, now.wiring.fields, 'fields')) hard.fields.add(x);
    for (const x of gone(was.wiring.handlers, now.wiring.handlers, 'handlers')) hard.handlers.add(x);
    for (const x of gone(was.wiring.hooks, now.wiring.hooks, 'test hooks')) hard['test hooks'].add(x);
    for (const x of gone(was.wiring.ids, now.wiring.ids)) soft.ids.add(x);
    for (const [f, w] of Object.entries(was.files || {})) if (now.files[f]) for (const x of gone(w.scripts, now.files[f].scripts)) hard.scripts.add(`${x} on ${f}`);
    const skipped = [];
    let wordsWas = 0, wordsNow = 0;
    for (const [k, b] of Object.entries(was.pages || {})) {
      const a = now.pages[k];
      if (!a) { skipped.push(k); continue; }
      for (const x of b.links || []) total.links.add(x);
      for (const x of b.fields || []) total.fields.add(x);
      for (const x of b.headings || []) total.headings.add(x);
      for (const x of b.figures || []) total.figures.add(x);
      for (const x of gone(b.links, [...a.links, ...now.wiring.links], 'links')) hard.links.add(x);
      for (const x of fieldsGone(b.fields, a.fields, ` on ${k}`)) hard.fields.add(x);
      for (const x of gone(b.actions, a.actions)) hard.forms.add(x);
      for (const x of gone(b.headings, a.headings, 'headings')) soft.headings.add(x);
      for (const x of gone(b.figures, a.figures, 'figures')) soft.figures.add(x);
      for (const x of gone(b.images, a.images)) soft.images.add(x);
      wordsWas += b.words || 0; wordsNow += a.words || 0;
    }
    const list = (set, n = 8) => { const a = [...set]; return a.slice(0, n).map((x) => trunc(x, 48)).join(', ') + (a.length > n ? ` and ${a.length - n} more` : ''); };
    const fix = 'Restore each one, or record it in the stamp: /* Hallmark · dropped <item>, <item> · <the reason> */';
    total['script hooks'] = new Set(); hard['script hooks'] = new Set();
    for (const [f, h] of Object.entries(was.scripts || {})) {
      if (outside.includes(f)) continue;
      const n = now.scripts[f];
      const both = n && h.dom && n.dom;
      const had = both ? h.dom : h.hooked;
      for (const x of had) total['script hooks'].add(`${f} ${x}`);
      const unhooked = n ? had.filter((x) => n.queried.includes(x) && !(both ? n.dom : n.hooked).includes(x)) : [];
      for (const x of unhooked) hard['script hooks'].add(`${f} ${x}`);
    }
    const guard = contexts.some(([, c]) => c.rules.some((r) => /\[hidden\]/.test(r.selector) && r.decls.some((d) => d.prop === 'display' && /none/.test(d.value))));
    if (!guard && Object.values(now.scripts).some((h) => h.hides)) report('kept', 'FAIL', SNAP, 1, 'a script hides elements with the hidden attribute and no rule pins it, so any display rule shows them again', 'Add [hidden] { display: none !important; } to the stylesheet');
    for (const [k, b] of Object.entries(was.pages || {})) {
      const a = now.pages[k];
      if (!a) continue;
      for (const bf of b.forms || []) {
        const af = (a.forms || []).find((x) => x.key === bf.key) || (a.forms || []).find((x) => x.attrs.join() === bf.attrs.join());
        if (!af) { if (!allowed.includes(bf.key.toLowerCase())) hard.forms.add(`the form ${bf.key} on ${k}`); continue; }
        for (const x of fieldsGone(bf.fields, af.fields, '')) hard.fields.add(`${x} in ${bf.key} on ${k}`);
        for (const x of bf.hidden) if (!af.hidden.includes(x)) hard.fields.add(`hidden ${x} in ${bf.key} on ${k}`);
        for (const x of bf.attrs) if (!af.attrs.includes(x)) hard.forms.add(`${x} on ${bf.key} (${k})`);
        if (bf.submits && !af.submits) hard.forms.add(`a submit control in ${bf.key} (${k})`);
        for (const x of bf.controls || []) if (!(af.controls || []).includes(x) && !(!x.includes('[name=') && (af.controls || []).some((y) => y.startsWith(`${x}[name=`))) && !allowed.some((t) => x.toLowerCase().includes(t) && t.length >= 4)) hard.forms.add(`${x} in ${bf.key} (${k})`);
      }
    }
    for (const x of hard.fields) if ([...hard.fields].some((y) => y.startsWith(`${x} in `))) hard.fields.delete(x);
    for (const [k, set] of Object.entries(hard)) if (set.size) report('kept', 'FAIL', SNAP, 1, k === 'script hooks' ? `a script still queries what its page no longer has: ${list(set)}` : k === 'forms' ? `a form lost what it had before: ${list(set)}` : `${k} the page had before and no longer has: ${list(set)}`, k === 'script hooks' ? 'Keep the ids, classes and attributes scripts query, or change the script with the markup' : fix);
    for (const [k, set] of Object.entries(soft)) if (set.size) report('kept', 'WARN', SNAP, 1, `${k} gone or reworded since the before record: ${list(set)}`, 'Restore it, or record it in the stamp: /* Hallmark · reworded "<old>" to "<new>" · <the gate that named it> */ or dropped <item> · <the reason>');
    if (wordsWas > 80 && wordsNow < wordsWas * 0.6) report('kept', 'WARN', SNAP, 1, `the pages hold ${wordsNow} words where they held ${wordsWas}`, 'Check that no section of content was dropped');
    if (skipped.length) report('kept', 'WARN', SNAP, 1, `not compared, because this run did not render them: ${list(skipped, 4)}`, 'Render the same pages or URLs the before record holds');
    if (outside.length) report('kept', 'WARN', SNAP, 1, `not compared, because this run did not read them: ${list(outside, 4)}`, 'Run --kept on the same target as --before');
    const lostOf = (k) => (hard[k] || soft[k]).size;
    keptLine = { parts: ['links', 'fields', 'handlers', 'test hooks', 'script hooks', 'headings', 'figures'].filter((k) => total[k].size).map((k) => { const d = acked[k] ? acked[k].size : 0; return `${k} ${Math.max(0, total[k].size - lostOf(k) - d)}/${total[k].size}${d ? ` (${d} dropped on record)` : ''}`; }), was: was.summary || null };
  }
}

export const seen = new Set();

export const tierOk = (f) => !opts.tier || (opts.tier === 'floor' ? (f.tier === 'floor' && f.grade === 'FAIL') : f.tier === opts.tier);

export const unique = findings.filter((f) => {
  if (!tierOk(f)) return false;
  const k = `${f.gate}|${f.grade}|${f.file}|${f.line}|${f.evidence}`;
  if (seen.has(k)) return false;
  seen.add(k);
  return true;
});

unique.sort((a, b) => {
  const ra = GRADE_RANK[a.grade] ?? 9, rb = GRADE_RANK[b.grade] ?? 9;
  if (ra !== rb) return ra - rb;
  const ga = gateSortKey(a.gate), gb = gateSortKey(b.gate);
  if (ga !== gb) return ga - gb;
  if (a.file !== b.file) return a.file < b.file ? -1 : 1;
  return a.line - b.line;
});

export const count = (g) => unique.filter((f) => f.grade === g).length;

export const fails = count('FAIL');

export const reflex = count('REFLEX');

export const warns = count('WARN');

export const waived = count('WAIVED');

export const rejected = count('WAIVER');

export const answered = count('ANSWERED');

export const dismissed = count('DISMISSED');

export const notes = count('NOTE');

export const tally = [`${fails} FAIL`];

if (reflex) tally.push(`${reflex} REFLEX`);

tally.push(`${warns} WARN`);

if (waived) tally.push(`${waived} WAIVED`);

if (rejected) tally.push(`${rejected} REJECTED`);

if (answered) tally.push(`${answered} ANSWERED`);

if (dismissed) tally.push(`${dismissed} DISMISSED`);

if (notes) tally.push(`${notes} NOTE`);

export let beforeLine = null;

if (opts.before) {
  const inv = takeInventory();
  mkdirSync(dirname(SNAP), { recursive: true });
  writeFileSync(SNAP, JSON.stringify({ v: 1, at: new Date().toISOString(), scope: opts.scope, summary: { fails, reflex, warns }, ...inv }, null, 1) + '\n');
  beforeLine = `before: recorded ${new Set([...inv.wiring.links, ...Object.values(inv.pages).flatMap((p) => p.links)]).size} links, ${new Set([...inv.wiring.fields, ...Object.values(inv.pages).flatMap((p) => p.fields)]).size} fields, ${inv.wiring.handlers.length} handlers, ${inv.wiring.hooks.length} test hooks, ${new Set(Object.values(inv.scripts).flatMap((h) => h.hooked)).size} script hooks${Object.keys(inv.pages).length ? ` and ${Object.keys(inv.pages).length} rendered page(s)` : ''} in ${rel(SNAP)}; --kept checks a redesign against it`;
}

export const keptNote = keptLine ? `kept: ${keptLine.parts.join(', ') || 'nothing recorded'}${keptLine.was ? `; before ${keptLine.was.fails} FAIL, ${keptLine.was.reflex} REFLEX, now ${fails} FAIL, ${reflex} REFLEX` : ''}` : null;

export let compareNote = null;

if (opts.kept && opts.render && !renderNotRun) {
  try {
    const mod = await import(new URL('./sloplint-render.mjs', import.meta.url).href);
    const made = mod.writeCompare([...files.filter((f) => extname(f).toLowerCase() === '.html'), ...opts.urls], keptNote ? keptNote.replace(/^kept: /, 'Kept: ').replace(/; before (\d+) FAIL, (\d+) REFLEX, now (\d+) FAIL, (\d+) REFLEX/, '. Floor findings: $1 before, $3 now. Reflex findings: $2 before, $4 now') + '.' : null);
    if (made.length) compareNote = `compare: ${made.map(rel).join(', ')} shows before and after side by side`;
  } catch {}
}

export const scopeNote = `${files.length} file(s)${opts.urls.length ? ` and ${opts.urls.length} URL(s)` : ''}${opts.stage === 'hero' ? ' (hero stage)' : ''}`;

export const renderNote = opts.render ? (renderNotRun ? `render tier not run: ${renderNotRun}` : null) : null;

if (opts.json) {
  console.log(JSON.stringify({
    summary: { fails, reflex, warns, waived, rejected, answered, dismissed, notes, files: files.length, render: opts.render ? (renderNotRun ? `not run: ${renderNotRun}` : 'ran') : 'off', ...(keptNote ? { kept: keptNote } : {}), ...(beforeLine ? { before: beforeLine } : {}) },
    findings: unique,
  }, null, 2));
} else {
  if (!unique.length) console.log(`sloplint: clean. 0 FAIL, 0 REFLEX, 0 WARN across ${scopeNote}.`);
  else if (opts.before) {
    const by = new Map();
    for (const f of unique) { const k = `${f.grade} ${f.gate}`; if (!by.has(k)) by.set(k, []); by.get(k).push(f); }
    for (const [k, list] of by) console.log(`  ${k}${list.length > 1 ? ` x${list.length}` : ''} ${list.slice(0, 2).map((f) => `${f.file}:${f.line} ${trunc(f.evidence, 64)}`).join('; ')} | fix: ${list[0].fix}`);
    const every = join(dirname(SNAP), 'before.txt');
    mkdirSync(dirname(SNAP), { recursive: true });
    const ignore = join(dirname(SNAP), '.gitignore');
    if (!existsSync(ignore)) writeFileSync(ignore, 'shots/\nbefore/\nbefore.json\nbefore.txt\ncompare.html\n');
    writeFileSync(every, unique.map((f) => `${f.grade} ${f.gate} ${f.file}:${f.line} ${f.evidence} | fix: ${f.fix}`).join('\n') + '\n');
    console.log(`sloplint: ${tally.join(', ')} across ${scopeNote}, grouped by gate; every line is in ${rel(every)}.`);
  } else {
    const byFile = new Map();
    for (const f of unique) { if (!byFile.has(f.file)) byFile.set(f.file, []); byFile.get(f.file).push(f); }
    const told = new Set();
    for (const [file, list] of byFile) {
      console.log(file);
      for (const f of list) {
        const key = `${f.gate}|${f.fix}`;
        const fix = f.grade !== 'WAIVED' && f.grade !== 'ANSWERED' && f.grade !== 'DISMISSED' && !told.has(key) ? ` | fix: ${f.fix}` : '';
        told.add(key);
        console.log(`  ${f.grade} ${f.gate} :${f.line} ${f.evidence}${fix}`);
      }
    }
    console.log(`sloplint: ${tally.join(', ')} across ${scopeNote}.`);
  }
  if (renderNote) console.log(renderNote);
  if (keptNote) console.log(keptNote);
  if (compareNote) console.log(compareNote);
  if (beforeLine) console.log(beforeLine);
}

export const exitCode = !opts.before && (fails > 0 || reflex > 0) ? 1 : 0;

if (process.stdout.writableLength) process.stdout.once('drain', () => process.exit(exitCode)); else process.exit(exitCode);
