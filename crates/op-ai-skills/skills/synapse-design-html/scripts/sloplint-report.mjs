/** HTML quality diagnostics; adapted from the original Synapse HTML skill. */
import {
  famKey, firstFamily, pxOf, rel, resolveVars,
  trunc,
} from './sloplint-color.mjs';
import { monoIsMaterial } from './sloplint-content-checks.mjs';
import { accentedWordInHero } from './sloplint-detail-checks.mjs';
import { twGradient, twGroup, twWhere } from './sloplint-tailwind-checks.mjs';
import { gradientHues, gradientTextRules } from './sloplint-visual-checks.mjs';
import { opts } from './sloplint.mjs';

export const PAGE_ONLY = new Set(['3', '8', '9', '25', '28', '32', '34', '42', '44', '46b', '47b', '47c', '49', '50', '54', '55', '56', '58', '59', '65', '66', '68', '69', '71', '77', '78', '79', '80', '81', '82', '83', 'F7', 'F8', 'F15', 'F16', 'F20']);

export const gateNumber = (id) => (/^(\d{1,2})/.exec(String(id)) || [])[1] || null;

export const pageOnly = (id) => PAGE_ONLY.has(String(id)) || PAGE_ONLY.has(gateNumber(id));

export const APP_SKIP = new Set(['1', '6', '8', '9', '32', '42', '44', '46b', '58', '59', '66', '68', '77', '78', '79', '81', '82', '83', '85', 'F8', 'F15', 'F20']);

export const appSkip = (id) => APP_SKIP.has(String(id)) || APP_SKIP.has(gateNumber(id));

export const TIERS = new Map(Object.entries({
  '2': 'floor', '4': 'floor', '10': 'floor', '15': 'floor', '17': 'floor', '18': 'floor', '19': 'floor',
  '20': 'floor', '26': 'floor', '27': 'floor', '28': 'floor', '30': 'floor', '33': 'floor', '34': 'floor',
  '39': 'floor', '40': 'floor', '41': 'floor', '46': 'floor', '48': 'floor', '49': 'floor', '50': 'floor',
  '53': 'floor', '54': 'floor', '56': 'floor', '58': 'floor', '62': 'floor', '63': 'floor', '67': 'floor', '70': 'floor',
  '1': 'reflex', '3': 'reflex', '6': 'reflex', '7': 'reflex', '8': 'reflex', '9': 'reflex', '11': 'reflex',
  '12': 'reflex', '16': 'reflex', '22': 'reflex', '23': 'reflex', '24': 'reflex', '25': 'reflex', '29': 'reflex',
  '37': 'reflex', '38': 'reflex', '42': 'reflex', '44': 'reflex', '47': 'reflex', '55': 'reflex', '59': 'reflex',
  '64': 'reflex', '65': 'reflex', '66': 'reflex', '68': 'reflex', '69': 'reflex',
  '32': 'ledger',
  '2a': 'floor', '2b': 'reflex', '6a': 'floor', '6b': 'reflex', '7a': 'floor', '7b': 'reflex',
  '10a': 'floor', '10b': 'reflex', '24a': 'floor', '24b': 'reflex', '26a': 'floor', '26b': 'reflex',
  '28a': 'floor', '28b': 'reflex', '30a': 'floor', '30b': 'reflex', '38i': 'floor', '38ii': 'reflex', '38iii': 'reflex',
  '39a': 'floor', '39b': 'reflex', '44a': 'reflex', '44b': 'floor', '44c': 'reflex', '44d': 'floor',
  '46a': 'floor', '46b': 'reflex', '47a': 'floor', '47b': 'reflex', '47c': 'reflex', '49a': 'floor', '49b': 'reflex',
  '55a': 'floor', '55b': 'reflex', '71': 'reflex', '72': 'reflex', '73': 'floor', '74': 'reflex', '75': 'reflex', '76': 'floor',
  '77': 'reflex', '78': 'reflex', '79': 'reflex', '80': 'reflex', '81': 'reflex', '82': 'reflex', '83': 'reflex', '84': 'reflex', '85': 'reflex',
}));

export const HERO_SKIP = new Set(['8', '9', '32', '59', '76', '77', '78', 'F8', 'F15']);

export function baseGate(id) {
  const s = String(id).trim();
  if (/^F\d+$/i.test(s)) return s.toUpperCase();
  const m = /^(\d{1,2}(?:i{1,3}|[a-z])?)/.exec(s);
  return m ? m[1] : s;
}

export function tierOf(gate) {
  const exact = TIERS.get(String(gate).trim());
  if (exact) return exact;
  const b = baseGate(gate);
  if (/^F\d+$/.test(b)) return 'finish';
  return TIERS.get(b) || 'floor';
}

export function fontFamilyCount(ctx) {
  const fams = new Set();
  for (const [prop, val] of Object.entries(ctx.tokens || {})) {
    if (prop.startsWith('--font-')) fams.add(famKey(firstFamily(resolveVars(val, ctx.tokens))));
  }
  return fams.size;
}

export const GUARDS = {
  '1': (ctx) => fontFamilyCount(ctx) >= 2 || 'fewer than two font families are declared',
  '2b': (ctx) => {
    for (const { r, grad } of gradientTextRules(ctx)) {
      if (!grad) return `${r.selector} clips text to a background that is not a gradient ramp`;
      if (/#[0-9a-f]{3,8}\b|oklch\(|rgba?\(|hsla?\(/i.test(grad.value)) return `${r.selector}: the ramp stops are literals, not tokens`;
      const hues = gradientHues(grad.value, ctx);
      if (hues.length >= 2 && Math.max(...hues) - Math.min(...hues) > 40) return `${r.selector}: ramp spans ${Math.round(Math.max(...hues) - Math.min(...hues))} degrees of hue`;
    }
    for (const it of twGroup(ctx).items) {
      const g = twGradient(ctx, it.info);
      if (!g || !g.text) continue;
      if (it.info.stops.some((s) => s.kind !== 'token')) return `${twWhere(it)}: the ramp stops are palette or literal classes, not tokens`;
      const hues = it.info.stops.map((s) => s.hue).filter((h) => h != null);
      if (hues.length >= 2 && Math.max(...hues) - Math.min(...hues) > 40) return `${twWhere(it)}: ramp spans ${Math.round(Math.max(...hues) - Math.min(...hues))} degrees of hue`;
    }
    return true;
  },
  '7': (ctx) => /surface:\s*absolute/i.test(ctx.stampText) || 'the stamp does not declare surface: absolute',
  '23': (ctx) => /posture:\s*(restrained|committed|full-palette|drenched)/i.test(ctx.stampText)
    || 'the stamp declares no colour posture',
  '37': (ctx) => fontFamilyCount(ctx) <= 4 || 'five or more families is past the backstop',
  '26b': (ctx) => !ctx.docs.some((d) => d.tags.some((t) => !t.close && /aria-disabled/i.test(t.attrs))) || 'aria-disabled appears in the markup',
  '38': () => 'name the clause: 38ii (italic display) or 38iii (accented word)',
  '38ii': (ctx) => /font-synthesis\s*:\s*none/i.test(ctx.allCss) || 'font-synthesis: none is not declared',
  '38iii': (ctx) => accentedWordInHero(ctx),
  '42': (ctx) => (/(^|[·*])\s*nav:\s*\S/im.test(ctx.stampText) && /(^|[·*])\s*footer:\s*\S/im.test(ctx.stampText)) || 'the stamp has no nav: and footer: fields naming the chrome',
  '64': (ctx) => monoIsMaterial(ctx) || 'none of --font-display, --font-body or --font-outlier is a monospace face',
  '65': (ctx) => /by request|pinned|user named/i.test(ctx.stampText) || 'the stamp does not say the theme was asked for by name',
  '44': (ctx) => /(^|[·*])\s*hero:\s*\S/im.test(ctx.stampText) || 'the stamp names no hero: posture',
};

export const WAIVER_MAX = 3;

export const WAIVER_FILLER = /\b(a|an|the|is|it|this|that|was|are|and|but|so|very|just|really|here|quite|more|most)\b/gi;

export const WAIVER_BOILERPLATE_PHRASES = [
  'design choice', 'design decision', 'intentionally', 'intentional', 'by design',
  'looks better', 'for the aesthetic', 'aesthetic', 'necessary here', 'necessary',
  'the prompt requires it', 'prompt requires', 'the brief requires it', 'brief requires', 'on purpose', 'deliberate', 'deliberately',
  'it works', 'works better', 'needed', 'required', 'fine', 'ok', 'okay',
];

export function reasonIsBoilerplate(reason) {
  let r = reason.toLowerCase();
  for (const p of WAIVER_BOILERPLATE_PHRASES) r = r.split(p).join(' ');
  r = r.replace(WAIVER_FILLER, ' ').replace(/[^a-z0-9]+/g, ' ').trim();
  return r.length < 12;
}

export let WAIVED = new Set();

export let ANSWERED = new Set();

export let DISMISSED = new Set();

export let VERBATIM = false;

export let APPSCREEN = false;

export let LAYOUT_KEPT = false;

export function setWaiverState(value) {
  WAIVED = value?.WAIVED || new Set();
  ANSWERED = value?.ANSWERED || new Set();
  DISMISSED = value?.DISMISSED || new Set();
  VERBATIM = !!value?.VERBATIM;
  APPSCREEN = !!value?.APPSCREEN;
  LAYOUT_KEPT = value?.LAYOUT_KEPT || false;
}

export const STRUCTURAL = new Set(['6b', '8', '9', '32', '42', '44a', '44c', '58', '77', '79']);

export const SPACING = new Set(['24b', '59', '78']);

export const COPY_GATES = new Set(['19', '58', '69']);

export const findings = [];

export function report(gate, grade, file, line, evidence, fix) {
  const g = String(gate);
  if (opts.before && g === '20') return;
  if (opts.scope === 'component' && pageOnly(g)) return;
  if ((opts.scope === 'app' || APPSCREEN) && appSkip(g)) return;
  if (opts.stage === 'hero' && HERO_SKIP.has(String(g))) return;
  const tier = tierOf(g);
  const b = baseGate(g);
  const waived = WAIVED.has(b) || WAIVED.has(gateNumber(b));
  if (VERBATIM && COPY_GATES.has(gateNumber(b)) && (grade === 'FAIL' || grade === 'WARN')) grade = 'NOTE';
  const owned = LAYOUT_KEPT === 'full' ? gateNumber(b) === '58' : STRUCTURAL.has(b) || STRUCTURAL.has(gateNumber(b)) || (LAYOUT_KEPT === 'polish' && SPACING.has(b));
  if (LAYOUT_KEPT && owned && grade !== 'NOTE') grade = 'NOTE';
  if (grade === 'FAIL') {
    if (tier === 'ledger') grade = 'NOTE';
    else if (tier === 'reflex') grade = waived ? 'WAIVED' : 'REFLEX';
  }
  if (tier === 'finish' && grade !== 'FAIL' && ANSWERED.has(b)) grade = 'ANSWERED';
  if (grade === 'WARN' && (DISMISSED.has(b) || DISMISSED.has(gateNumber(b)))) grade = 'DISMISSED';
  if (grade === 'WARN' && tier === 'reflex' && waived) grade = 'WAIVED';
  findings.push({ gate: g, grade, tier, file: rel(file), line: line || 1, evidence: trunc(String(evidence), g === 'kept' ? 400 : 120), fix });
}

export function applyWaivers(ctx, dir) {
  WAIVED = new Set(); ANSWERED = new Set(); DISMISSED = new Set();
  VERBATIM = /\bcopy:\s*verbatim\b/i.test(ctx.stampText);
  APPSCREEN = /\bshape:\s*app screen\b/i.test(ctx.stampText);
  LAYOUT_KEPT = (/\bredesign:\s*(polish|restyle|full)\b/i.exec(ctx.stampText) || [])[1]?.toLowerCase() || false;
  const re = /\/\*\s*Hallmark\s*·\s*waive\s+(\d{1,2}[a-z]{0,3}|F\d+)\s*·\s*([^·*]+?)\s*·\s*([^*]+?)\s*\*\//gi;
  const claims = [...ctx.stampText.matchAll(re)].map((m) => ({
    id: m[1], evidence: m[2].trim(), reason: m[3].trim(), raw: m[0],
  }));

  const wellFormed = new Set(claims.map((c) => c.raw));
  const malformed = [...ctx.stampText.matchAll(/\/\*[^*]*Hallmark[^*]*·\s*waive\b[^*]*\*\//gi)]
    .map((m) => m[0]).filter((raw) => !wellFormed.has(raw));
  const reasons = new Map();
  for (const c of claims) {
    const key = c.reason.toLowerCase();
    reasons.set(key, (reasons.get(key) || 0) + 1);
  }

  const pageWords = new Set(
    (ctx.stampText.replace(/\/\*\s*Hallmark\s*·\s*(?:waive|answered|dismissed)\b[^*]*\*\//gi, ' ') + ' ' + ctx.docs.map((d) => d.text).join(' '))
      .toLowerCase().match(/[a-z]{4,}/g) || []
  );
  const file = ctx.cssFiles[0]?.file || ctx.docs[0]?.file || dir;
  const rejectAt = (c, why) =>
    findings.push({
      gate: baseGate(c.id), grade: 'WAIVER', tier: tierOf(c.id), file: rel(file), line: 1,
      evidence: trunc(`waiver on ${c.id} REJECTED (${why})`),
      fix: 'Fix the gate, or satisfy the guard and say why in the page\'s own words',
    });

  for (const raw of malformed) {
    findings.push({
      gate: 'waive', grade: 'WAIVER', tier: 'reflex', file: rel(file), line: 1,
      evidence: trunc(`malformed waiver, ignored: ${raw.replace(/\s+/g, ' ')}`),
      fix: 'Three · -separated fields: /* Hallmark · waive <gate> · <guard evidence> · <reason> */',
    });
  }
  for (const c of claims) {
    const b = baseGate(c.id);
    const tier = tierOf(c.id);
    if (tier !== 'reflex') {
      rejectAt(c, tier === 'ledger' ? 'a Ledger note is bookkeeping, nothing to waive'
        : tier === 'finish' ? 'Finish findings are answered, not waived'
        : 'Floor is never waivable');
      continue;
    }
    if (/^\d+$/.test(c.id) && [...TIERS.keys()].some((k) => k !== c.id && gateNumber(k) === c.id)) { rejectAt(c, `name the clause (${[...TIERS.keys()].filter((k) => k !== c.id && gateNumber(k) === c.id).join(' or ')})`); continue; }
    if (WAIVED.has(b)) { rejectAt(c, 'one waiver per gate'); continue; }
    if (c.reason.length < 24) { rejectAt(c, 'reason under 24 characters'); continue; }
    if (reasonIsBoilerplate(c.reason)) { rejectAt(c, 'boilerplate reason'); continue; }
    if (reasons.get(c.reason.toLowerCase()) > 1) { rejectAt(c, 'reason reused on another waiver'); continue; }
    const words = c.reason.toLowerCase().match(/[a-z]{4,}/g) || [];
    if (!words.some((w) => pageWords.has(w))) { rejectAt(c, 'reason shares no word with the page'); continue; }
    const guard = GUARDS[b] || GUARDS[gateNumber(b)];
    const verdict = guard ? guard(ctx) : true;
    if (verdict !== true) { rejectAt(c, `guard: ${verdict}`); continue; }
    WAIVED.add(b);
  }

  if (WAIVED.size > WAIVER_MAX) {
    findings.push({
      gate: 'waive', grade: 'NOTE', tier: 'ledger', file: rel(file), line: 1,
      evidence: trunc(`${WAIVED.size} reflex gates waived (${[...WAIVED].join(', ')}): that is a house style, not a set of exceptions`),
      fix: 'Lock it into a design.md so later pages inherit it instead of re-arguing it',
    });
  }

  const ansRe = /\/\*\s*Hallmark\s*·\s*answered\s+(\d{1,2}[a-z]{0,3}|F\d+)\s*·\s*([^*]+?)\s*\*\//gi;
  for (const m of ctx.stampText.matchAll(ansRe)) {
    const id = baseGate(m[1]);
    const reason = m[2].trim();
    const bad = tierOf(id) !== 'finish' ? 'only Finish findings are answered; Reflex is waived and Floor is fixed'
      : reason.length < 24 ? 'reason under 24 characters'
      : reasonIsBoilerplate(reason) ? 'boilerplate reason' : null;
    if (bad) {
      findings.push({
        gate: id, grade: 'WAIVER', tier: tierOf(id), file: rel(file), line: 1,
        evidence: trunc(`answer on ${m[1]} REJECTED (${bad})`),
        fix: 'Two · -separated fields: /* Hallmark · answered <check> · <reason> */',
      });
      continue;
    }
    ANSWERED.add(id);
  }

  const disRe = /\/\*\s*Hallmark\s*·\s*dismissed\s+(\d{1,2}[a-z]{0,3}|F\d+)\s*·\s*([^*]+?)\s*\*\//gi;
  for (const m of ctx.stampText.matchAll(disRe)) {
    const reason = m[2].trim();
    const bad = reason.length < 24 ? 'reason under 24 characters' : reasonIsBoilerplate(reason) ? 'boilerplate reason' : null;
    if (bad) {
      findings.push({ gate: baseGate(m[1]), grade: 'WAIVER', tier: tierOf(m[1]), file: rel(file), line: 1, evidence: trunc(`dismissal of ${m[1]} REJECTED (${bad})`), fix: 'Two · -separated fields: /* Hallmark · dismissed <gate> · <what you checked and why the warning is wrong here> */' });
      continue;
    }
    DISMISSED.add(baseGate(m[1]));
  }
}

export const GRADE_RANK = { FAIL: 0, REFLEX: 1, WAIVER: 2, WARN: 3, WAIVED: 4, ANSWERED: 5, DISMISSED: 6, NOTE: 7 };

export function gateSortKey(g) {
  const f = /^F(\d+)$/.exec(g);
  if (f) return 900 + Number(f[1]);
  const n = parseFloat(g);
  return Number.isNaN(n) ? 999 : n;
}

export function selectorIsInteractive(sel) {
  return /(^|[\s,>+~(])(a|button|input|select|textarea|summary)\b|\.(btn|button|cta|link|tab|chip|control)/i.test(sel);
}

export const HEADING_SEL = /(^|[\s,>+~(])h[1-6]\b|__title|__display|__headline|hero__(title|display|headline|h\d)|wordmark|masthead|display/i;

export const GENERIC_FAMILIES = new Set(['serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui', 'ui-monospace', 'ui-serif', 'ui-sans-serif', 'ui-rounded', 'math', 'emoji', 'fangsong', 'inherit', 'initial', 'unset']);

export function mergedDeclsBySelector(ctx) {
  if (ctx._merged) return ctx._merged;
  const map = new Map();
  for (const r of ctx.rules) {
    if (r.keyframes || r.selector === '@font-face') continue;
    const key = r.selector + '@@' + (r.media || '');
    if (!map.has(key)) map.set(key, { selector: r.selector, media: r.media, decls: [], file: r.file, line: r.line });
    map.get(key).decls.push(...r.decls);
  }
  ctx._merged = [...map.values()];
  return ctx._merged;
}

export function styleIndex(ctx) {
  if (ctx._styleIdx) return ctx._styleIdx;
  const entries = [];
  for (const r of ctx.rules) {
    if (r.keyframes || r.selector === '@font-face') continue;
    if (r.media && /max-width/i.test(r.media)) continue;
    for (const part of r.selector.split(',')) {
      const compound = part.trim().split(/[\s>+~]+/).filter(Boolean).pop();
      if (!compound) continue;
      const cleaned = compound.replace(/::?[a-z-]+(\([^)]*\))?/gi, '').replace(/\[[^\]]*\]/g, '');
      const classes = (cleaned.match(/\.[a-zA-Z_][\w-]*/g) || []).map((c) => c.slice(1));
      const tagM = /^([a-zA-Z][\w-]*)/.exec(cleaned);
      const tag = tagM ? tagM[1].toLowerCase() : null;
      if (!classes.length && !tag) continue;
      entries.push({ classes, tag, decls: r.decls, state: /:(hover|active|focus|focus-visible|focus-within|disabled|checked|visited|target)\b|::?(before|after|marker|placeholder|selection|backdrop)\b/i.test(compound) });
    }
  }
  ctx._styleIdx = entries;
  return entries;
}

export function styleFor(ctx, classAttr, tagName, restingOnly = false) {
  const have = new Set(String(classAttr || '').split(/\s+/).filter(Boolean));
  const decls = [];
  for (const e of styleIndex(ctx)) {
    if (restingOnly && e.state) continue;
    if (e.tag && e.tag !== tagName) continue;
    if (!e.classes.every((c) => have.has(c))) continue;
    decls.push(...e.decls);
  }
  return decls;
}

export function declValue(ctx, decls, prop) {
  let v = null;
  for (const d of decls) if (d.prop === prop) v = d.value;
  return v == null ? null : resolveVars(v, ctx.tokens);
}

export function fontPxOf(ctx, decls) {
  const v = declValue(ctx, decls, 'font-size');
  if (!v) return null;
  const clamped = /clamp\(\s*([^,]+),/.exec(v);
  return pxOf(clamped ? clamped[1].trim() : v);
}

export function trackingEmOf(ctx, decls, fontPx) {
  const v = declValue(ctx, decls, 'letter-spacing');
  if (!v) return null;
  const m = /^(-?\d*\.?\d+)em$/.exec(v.trim());
  if (m) return parseFloat(m[1]);
  const px = pxOf(v);
  if (px == null || !fontPx) return null;
  return px / fontPx;
}
