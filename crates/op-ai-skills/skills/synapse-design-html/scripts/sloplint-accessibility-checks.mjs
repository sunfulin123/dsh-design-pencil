/** HTML quality diagnostics; adapted from the original Synapse HTML skill. */
import {
  firstFamily, innerOf, isTokenRule, parseColor, plainText,
  pxOf, resolveVars, srgbToOklch, trunc,
} from './sloplint-color.mjs';
import { monoIsMaterial } from './sloplint-content-checks.mjs';
import { getAttr } from './sloplint-jsx.mjs';
import { HEADING_SEL, mergedDeclsBySelector, report } from './sloplint-report.mjs';
import { twGroup } from './sloplint-tailwind-checks.mjs';

export const HIDE_OK = /tooltip|popover|menu|dropdown|modal|dialog|toast|overlay|backdrop|sheet|drawer|panel|:hover|:focus|:checked|:target|\[open|\[aria-(?:expanded|selected|current|pressed)|::before|::after|\.is-|\[hidden|\[aria-hidden|sr-only|visually-hidden|skip|placeholder|::marker|\[data-slot/i;

export function startingStyleText(css) {
  let out = '';
  for (const m of css.matchAll(/@starting-style\s*\{/gi)) {
    let depth = 1, k = m.index + m[0].length;
    while (k < css.length && depth > 0) { if (css[k] === '{') depth++; else if (css[k] === '}') depth--; k++; }
    out += css.slice(m.index, k) + ' ';
    const open = css.lastIndexOf('{', m.index - 1), close = css.lastIndexOf('}', m.index - 1);
    if (open > close) out += css.slice(Math.max(close + 1, 0), open) + ' ';
  }
  return out;
}

export function check62(ctx) {
  const starting = startingStyleText(ctx.allCss);
  const jsScoped = (sel) => /(^|[\s,])(html|body)?\.js\b|\[data-js|\.no-js|html\.has-js/i.test(sel);
  const animatedNames = new Map();
  for (const r of ctx.rules) if (r.keyframes) {
    const arr = animatedNames.get(r.keyframes) || [];
    arr.push(r); animatedNames.set(r.keyframes, arr);
  }
  const animatesVisible = (name) => (animatedNames.get(name) || []).some((r) => /to|100%/.test(r.selector) && r.decls.some((d) => d.prop === 'opacity' && parseFloat(d.value) === 1));
  const seen = new Set();
  for (const r of ctx.rules) {
    if (r.keyframes || (r.media && /\bprint\b/i.test(r.media)) || r.selector === '@font-face') continue;
    const hidden = r.decls.find((d) => (d.prop === 'opacity' && parseFloat(resolveVars(d.value, ctx.tokens)) === 0) || (d.prop === 'visibility' && /hidden/.test(d.value)));
    if (!hidden) continue;
    if (HIDE_OK.test(r.selector.replace(/:not\([^)]*\)/g, '')) || jsScoped(r.selector) || (starting && starting.includes(r.selector))) continue;
    const revealish = /reveal|fade|animate|aos|in-view|inview|appear|enter|rise|slide|stagger|observe|lazy/i.test(r.selector) || r.decls.some((d) => d.prop === 'transform' && /translate|scale/.test(d.value));
    if (!revealish) continue;
    const anim = r.decls.find((d) => d.prop === 'animation' || d.prop === 'animation-name');
    const animName = anim ? anim.value.split(/\s+/).find((w) => animatedNames.has(w)) : null;
    if (animName && animatesVisible(animName)) continue;
    const key = r.selector;
    if (seen.has(key)) continue; seen.add(key);
    report(62, 'FAIL', r.file, hidden.line, `${r.selector} is hidden at rest (${hidden.prop}: ${hidden.value}) and depends on a script to appear`, 'Visible by default: scope the hidden state under a .js class the script adds, or animate from visible with @starting-style');
  }
}

export const TEXT_TAGS = new Set(['p', 'span', 'li', 'small', 'a', 'div', 'figcaption', 'td', 'th', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'time', 'dd', 'dt', 'cite', 'strong', 'em', 'b', 'label', 'button', 'summary']);

export function check63(ctx) {
  for (const doc of ctx.docs) {
    const dotLines = new Set(); const arrowLines = new Set(); let dotCount = 0;
    const tickerRanges = [];
    for (let i = 0; i < doc.tags.length; i++) {
      const t = doc.tags[i];
      if (t.close || t.selfClosing || !/marquee|ticker|tape|crawl/i.test(getAttr(t.attrs, 'class') || '')) continue;
      const inner = innerOf(doc, i);
      if (inner) tickerRanges.push([t.pos, inner.endPos]);
    }
    for (let i = 0; i < doc.tags.length; i++) {
      const t = doc.tags[i];
      if (t.close || t.selfClosing || !TEXT_TAGS.has(t.name)) continue;
      const cls = getAttr(t.attrs, 'class') || '';
      if (/marquee|ticker|tape|crawl/i.test(cls) || tickerRanges.some(([a, b]) => t.pos > a && t.pos < b)) continue;
      const inner = innerOf(doc, i);
      if (!inner) continue;
      if (/<(p|div|li|section|article|ul|ol|table)\b/i.test(inner.inner)) continue;
      const text = plainText(inner.inner);
      if (!text) continue;
      const dots = (text.match(/\s[·•]\s/g) || []).length;
      if (dots >= 2 && !dotLines.has(t.line)) { dotLines.add(t.line); report(63, 'FAIL', doc.file, t.line, `middle-dot meta string "${trunc(text, 50)}"`, 'Line breaks, columns or hairlines; one dot in a byline at most'); }
      if ((t.name === 'a' || t.name === 'button') && /(\u2192|->|\u203a|\u00bb|\u27f6)\s*$/.test(text) && !arrowLines.has(t.line)) { arrowLines.add(t.line); report(63, 'FAIL', doc.file, t.line, `arrow glued to the label "${trunc(text, 40)}"`, 'A verb as the label; the link already says it goes somewhere'); }
      if (/^[A-Z]{3,}\s+-\s+\S/.test(text) && text.length < 60) report(63, 'FAIL', doc.file, t.line, `WORD - fragment label "${trunc(text, 40)}"`, 'Say the thing as a sentence or a heading');
    }
    for (let i = 0; i < doc.tags.length; i++) {
      const t = doc.tags[i];
      if (t.close || !/^(span|i|b|em|s)$/.test(t.name)) continue;
      const cls = getAttr(t.attrs, 'class') || '';
      if (!/(^|\s)(dot|status-dot|indicator|bullet|pip|blip)(\s|$|__|-)/i.test(cls)) continue;
      if (/aria-live|role\s*=\s*"status"/i.test(t.attrs)) continue;
      const inner = innerOf(doc, i);
      if (inner && plainText(inner.inner)) continue;
      dotCount++;
      if (dotCount === 3) report(63, 'FAIL', doc.file, t.line, `decorative status dots (${cls.trim()}) repeated across the page`, 'Delete them; a dot means live state, and only where it is one');
    }
  }
}

export function check64(ctx) {
  if (monoIsMaterial(ctx)) return;
  const monoFam = (v) => /mono|courier|jetbrains|plex mono|geist mono|commit|fira code|space mono|dm mono|roboto mono|source code|silkscreen/i.test(firstFamily(resolveVars(v, ctx.tokens)));
  const LABELISH = /label|caption|meta|eyebrow|kicker|tag\b|badge|chip|small|folio|footnote|legend|\bth\b|thead|figcaption|overline|dateline|byline|credit|note\b/i;
  const DATAISH = /code|pre\b|kbd|samp|num|figure|stat|price|value|data|tabular|counter|timer|clock|coord|amount|total|score|version|hash|\bid\b|sku|time|date|hour|utc|eta|lot\b|edition|ref\b|dimension|measure|reading|plate-?no|tag-?no|url|uri\b|path|endpoint|command|cmd|snippet|install/i;
  const seen = new Set();
  for (const r of ctx.rules) {
    if (r.keyframes || r.selector === '@font-face' || isTokenRule(r)) continue;
    if (!LABELISH.test(r.selector) || DATAISH.test(r.selector)) continue;
    const fam = r.decls.find((d) => d.prop === 'font-family' || (d.prop === 'font' && /var\(--font|mono/i.test(d.value)));
    if (!fam) continue;
    const raw = fam.prop === 'font' ? (/var\(--font-[\w-]+\)/.exec(fam.value) || [fam.value])[0] : fam.value;
    if (!monoFam(raw)) continue;
    const key = baseSelector(r.selector);
    if (seen.has(key)) continue; seen.add(key);
    report(64, 'FAIL', r.file, fam.line, `monospace label voice on ${r.selector}`, 'Labels in the body face, a step smaller, sentence case; mono only for code and figures');
  }
}

export function check65(ctx) {
  const paper = parseColor(resolveVars(ctx.tokens['--color-paper'] || '', ctx.tokens));
  const accent = parseColor(resolveVars(ctx.tokens['--color-accent'] || '', ctx.tokens));
  if (!paper || !accent) return;
  const p = paper.okl || srgbToOklch(paper); const a = accent.okl || srgbToOklch(accent);
  const cream = p.L >= 0.9 && p.C >= 0.006 && p.H >= 55 && p.H <= 105;
  const clay = a.C >= 0.08 && a.H >= 15 && a.H <= 55;
  const disp = firstFamily(resolveVars(ctx.tokens['--font-display'] || '', ctx.tokens));
  const hcSerif = /bodoni|didot|didone|playfair|fraunces|instrument serif|cormorant|dm serif|libre caslon display|abril|prata|gloock|newsreader|editorial new|gt sectra|canela|freight|yeseva|rozha|boska|melodrama/i.test(disp);
  const catalogTheme = /theme:\s*(?!custom\b)[A-Z][\w-]*\s*\((?:deal|by request)/.test(ctx.stampText);
  if (cream && clay && hcSerif && !catalogTheme) report(65, 'FAIL', ctx.cssFiles[0]?.file || ctx.docs[0]?.file, 1, `the named look: cream paper (L ${Math.round(p.L * 100)}%, hue ${Math.round(p.H)}) + ${disp} + a clay accent (hue ${Math.round(a.H)})`, 'Move one axis, the accent first; or stamp the theme as asked for by name');
}

export function checkF15(ctx) {
  const widths = new Map();
  for (const r of ctx.rules) {
    if (r.keyframes || r.media || !/container|wrap|inner|shell|content|section|page|main/i.test(r.selector)) continue;
    for (const d of r.decls) if (d.prop === 'max-width') { const px = maxPxIn(resolveVars(d.value, ctx.tokens)); if (px && px >= 900) widths.set(px, r.selector); }
  }
  if (widths.size > 1) report('F15', 'WARN', ctx.cssFiles[0]?.file || ctx.docs[0]?.file, 1, `${widths.size} container widths on one page (${[...widths.keys()].join(', ')}px)`, 'One container width, applied by the same two-element pattern in every section');
  const gaps = new Map();
  for (const r of ctx.rules) {
    if (r.keyframes || r.media || /hero|masthead|fold|\b(?:app|ui|demo|sample|screen|product|mock|device|console|editor|window)(?:\b|__|--)|\[data-slot/i.test(r.selector)) continue;
    const cols = r.decls.find((d) => d.prop === 'grid-template-columns' && trackCount(d.value) > 1 && !/^repeat\(\s*auto/.test(d.value.trim()));
    if (!cols) continue;
    const gap = r.decls.find((d) => /^(gap|column-gap)$/.test(d.prop));
    if (gap) { const v = resolveVars(gap.value, ctx.tokens).split(/\s+/).pop(); const px = maxPxIn(v); if (px != null && px >= 24) gaps.set(v, r.selector); }
  }
  if (gaps.size > 2) report('F15', 'WARN', ctx.cssFiles[0]?.file || ctx.docs[0]?.file, 1, `${gaps.size} different column gaps across multi-column sections (${[...gaps.keys()].join(', ')})`, 'One column gap for every multi-column section');
}

export function trackCount(v) {
  const t = v.replace(/\[[^\]]*\]/g, ' ').trim();
  const rep = /^repeat\(\s*(\d+)/.exec(t);
  if (rep) return Number(rep[1]);
  let depth = 0, n = 0, inTok = false;
  for (const ch of t) {
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    if (depth === 0 && /\s/.test(ch)) inTok = false;
    else if (!inTok) { inTok = true; n++; }
  }
  return n;
}

export function checkF16(ctx) {
  if (ctx.tokensOnly || !ctx.tokens['--color-accent']) return;
  const tw = twGroup(ctx);
  const missing = [];
  if (!/::selection/.test(ctx.allCss) && !tw.variants.has('selection')) missing.push('::selection');
  if (!/scrollbar-color|::-webkit-scrollbar/.test(ctx.allCss) && !tw.scrollbar) missing.push('scrollbar-color');
  const hasInputs = ctx.docs.some((d) => /<(input|textarea)\b/i.test(d.src));
  if (hasInputs && !/caret-color/.test(ctx.allCss) && !tw.caret) missing.push('caret-color');
  if (missing.length) report('F16', 'WARN', ctx.cssFiles[0]?.file || ctx.docs[0]?.file, 1, `browser surfaces unthemed: ${missing.join(', ')}`, 'Theme the parts you did not draw from the palette');
}

export const proseRun = (run, pad) => {
  let r = run;
  for (let k = 0; k < 3 && /\{[^{}]*\}/.test(r); k++) r = r.replace(/\{[^{}]*\}/g, pad);
  return /[;=(){}]|\breturn\b/.test(r) ? pad(r) : r;
};

export function maskedProse(doc) {
  if (doc._prose == null) {
    const pad = (m) => m.replace(/[^\n]/g, ' ');
    const src = doc.kind && doc.kind !== 'html' ? doc.src.replace(/(^|>)([^<>]*)(?=<|$)/g, (m0, a, run) => a + proseRun(run, pad)) : doc.src;
    doc._prose = src
      .replace(/<(script|style|pre|code|kbd|samp|textarea)\b[^>]*>[\s\S]*?<\/\1>/gi, pad)
      .replace(/<!--[\s\S]*?-->/g, pad)
      .replace(/<[^>]*>/g, pad);
  }
  return doc._prose;
}

export function maxPxIn(value) {
  let best = null;
  for (const m of String(value).matchAll(/(-?\d+(?:\.\d+)?)(px|rem|em)/g)) {
    const px = m[2] === 'px' ? parseFloat(m[1]) : parseFloat(m[1]) * 16;
    if (best == null || px > best) best = px;
  }
  return best;
}

export function baseSelector(sel) {
  return sel.replace(/::?[a-z-]+(\([^)]*\))?/gi, '').replace(/\s+/g, ' ').trim();
}

export function checkF1(ctx) {
  const dq = /(?:"|&quot;|&#0?34;)(?=[A-Za-z])|[A-Za-z](?:"|&quot;|&#0?34;)/g;
  const ap = /[A-Za-z](?:'|&#0?39;|&apos;)(?=[A-Za-z])/g;
  for (const doc of ctx.docs) {
    const prose = maskedProse(doc);
    const hits = [...prose.matchAll(dq), ...prose.matchAll(ap)].sort((a, b) => a.index - b.index);
    if (!hits.length) continue;
    const around = prose.slice(Math.max(0, hits[0].index - 16), hits[0].index + 16).replace(/\s+/g, ' ').trim();
    report('F1', 'WARN', doc.file, doc.lineOf(hits[0].index),
      `straight quote in prose x${hits.length} (first: ${trunc(around, 40)})`, 'Use typographic quotes: \u201C \u201D \u2019');
  }
}

export function checkF2(ctx) {
  for (const doc of ctx.docs) {
    const prose = maskedProse(doc);
    const hits = [...prose.matchAll(/\.{3,}/g)];
    if (!hits.length) continue;
    report('F2', 'WARN', doc.file, doc.lineOf(hits[0].index),
      `three-period ellipsis in prose x${hits.length}`, 'Use a true ellipsis character (\u2026)');
  }
}

export function checkF3(ctx) {
  const H12 = /(^|[\s,>+~(])h[12]\b/i;
  const targets = [];
  let satisfied = false;
  for (const r of mergedDeclsBySelector(ctx)) {
    const isH12 = H12.test(r.selector);
    const isDisplayClass = HEADING_SEL.test(r.selector)
      && r.decls.some((d) => d.prop === 'font-size' && (maxPxIn(resolveVars(d.value, ctx.tokens)) ?? 0) >= 40);
    if (!isH12 && !isDisplayClass) continue;
    targets.push(r);
    if (r.decls.some((d) => /^text-wrap(-style)?$/.test(d.prop) && /balance/.test(d.value))) satisfied = true;
  }
  if (targets.length && !satisfied) {
    report('F3', 'WARN', targets[0].file, targets[0].line,
      `no text-wrap: balance on any display head (${targets.length} head rule(s), e.g. ${trunc(targets[0].selector, 32)})`,
      'Add text-wrap: balance to h1/h2-level heads');
  }
}

export function checkF4(ctx) {
  const BTN = /\b(btn|button|cta)\b|__(btn|button|cta)\b/i;
  const filled = new Map();
  for (const r of mergedDeclsBySelector(ctx)) {
    if (isTokenRule(r) || /:hover|:active|:focus|:disabled|\.is-|\[disabled/i.test(r.selector)) continue;
    const first = baseSelector(r.selector.split(',')[0]);
    if (!BTN.test(first)) continue;
    for (const d of r.decls) {
      if (!/^background(-color)?$/.test(d.prop)) continue;
      const rv = resolveVars(d.value, ctx.tokens);
      if (/transparent|none/i.test(rv)) continue;
      if (/var\(\s*--color-(?!paper|rule|muted|focus)[\w-]+/.test(d.value) && !filled.has(first)) filled.set(first, { r, d });
    }
  }
  if (filled.size >= 2) {
    const sels = [...filled.keys()];
    const second = filled.get(sels[1]);
    report('F4', 'WARN', second.r.file, second.d.line,
      `${filled.size} filled primary-button recipes: ${trunc(sels.join(' + '), 52)}`,
      'One filled primary per page; demote the rest to outline/quiet variants');
  }
}

export function checkF5(ctx) {
  for (const r of mergedDeclsBySelector(ctx)) {
    if (isTokenRule(r) || !/icon|\bico\b/i.test(r.selector)) continue;
    const radius = r.decls.find((d) => d.prop === 'border-radius');
    if (!radius) continue;
    const rv = resolveVars(radius.value, ctx.tokens);
    const pct = /(\d+(?:\.\d+)?)%/.exec(rv);
    const round = (pct && parseFloat(pct[1]) >= 50) || ((maxPxIn(rv) ?? 0) >= 999);
    if (!round) continue;
    const bg = r.decls.find((d) => /^background(-color)?$/.test(d.prop)
      && !/^(none|transparent)$/i.test(resolveVars(d.value, ctx.tokens).trim()));
    if (!bg) continue;
    const small = r.decls.some((d) => (d.prop === 'width' || d.prop === 'height')
      && (pxOf(resolveVars(d.value, ctx.tokens)) ?? 999) <= 64);
    if (small) {
      report('F5', 'WARN', r.file, bg.line, `icon-in-coloured-circle coin: ${trunc(r.selector, 40)}`,
        'Drop the tinted coin; set the icon at text size in currentColor');
    }
  }
}

export function checkF6(ctx) {
  const NUM_SEL = /\b(stat(?!ement)|price|table|figure|count|num)[\w-]*/i;
  const hasTnum = (r) => r.decls.some((d) => d.prop === 'font-variant-numeric'
    || (d.prop === 'font-feature-settings' && /tnum/.test(d.value)));
  if (ctx.rules.some((r) => /^(html|body|:root)\b/i.test(r.selector.trim()) && hasTnum(r))) return;
  const bySel = mergedDeclsBySelector(ctx);
  const covered = new Set(bySel.filter(hasTnum).map((r) => baseSelector(r.selector)));
  const warned = new Set();
  for (const r of bySel) {
    if (isTokenRule(r) || !NUM_SEL.test(r.selector)) continue;
    const base = baseSelector(r.selector);
    if (warned.has(base) || covered.has(base)) continue;
    const fs2 = r.decls.find((d) => d.prop === 'font-size');
    if (!fs2 || (maxPxIn(resolveVars(fs2.value, ctx.tokens)) ?? 0) < 24) continue;
    warned.add(base);
    report('F6', 'WARN', r.file, fs2.line,
      `numeric selector ${trunc(base, 36)} at display size without tabular figures`,
      'Add font-variant-numeric: tabular-nums');
  }
}

export function checkF7(ctx) {
  const byKey = new Map();
  for (const r of mergedDeclsBySelector(ctx)) {
    if (isTokenRule(r) || /::(before|after)/.test(r.selector)) continue;
    const get = (re) => {
      const d = r.decls.filter((x) => re.test(x.prop)).pop();
      return d ? resolveVars(d.value, ctx.tokens).replace(/\s+/g, ' ').trim() : '';
    };
    const border = get(/^border$/)
      || [get(/^border-width$/), get(/^border-style$/), get(/^border-color$/)].filter(Boolean).join(' ');
    const radius = get(/^border-radius$/);
    const surface = get(/^background(-color)?$/) || '';
    const shadow = get(/^box-shadow$/);
    if (!radius || (!border && !surface && !shadow)) continue;
    const key = [border, radius, surface, shadow].join(' | ');
    if (!byKey.has(key)) byKey.set(key, { sels: new Set(), r });
    for (const part of r.selector.split(',')) byKey.get(key).sels.add(baseSelector(part));
  }
  for (const v of byKey.values()) {
    if (v.sels.size >= 6) {
      report('F7', 'WARN', v.r.file, v.r.line,
        `same container recipe on ${v.sels.size} selectors (${trunc([...v.sels].slice(0, 4).join(', '), 48)}...)`,
        'Vary weight, radius, or fill by role; not every box is the same box');
    }
  }
}

export function checkF8(ctx) {
  const famOf = (sel) => {
    const m = /\.([a-z][\w-]*)/i.exec(sel) || /(^|[\s>+~])([a-z][\w-]*)/i.exec(sel);
    const name = m ? (m[1] || m[2]) : sel;
    return name.split('__')[0].split('--')[0].toLowerCase();
  };
  const NAVISH = /^(nav|header|topbar|masthead|banner)$/;
  const timeline = new Map(), sticky = new Map(), animated = new Set();
  for (const r of ctx.rules) {
    if (r.keyframes || isTokenRule(r)) continue;
    for (const d of r.decls) {
      if (d.prop === 'animation-timeline' && !/^(none|auto)$/i.test(d.value.trim())
        && !timeline.has(famOf(r.selector))) timeline.set(famOf(r.selector), { r, d });
      if (d.prop === 'animation' || d.prop === 'animation-name') animated.add(famOf(r.selector));
      if (d.prop === 'position' && /sticky/i.test(d.value)) sticky.set(famOf(r.selector), { r, d });
    }
  }
  const families = new Map(timeline);
  for (const [fam, v] of sticky) {
    if (!families.has(fam) && animated.has(fam) && !NAVISH.test(fam)) families.set(fam, v);
  }
  if (families.size > 1) {
    const names = [...families.keys()];
    const second = families.get(names[1]);
    report('F8', 'WARN', second.r.file, second.d.line,
      `${families.size} scroll-choreography patterns on one page (${trunc(names.join(', '), 44)})`,
      'Budget is one scroll pattern per page (scroll-choreography.md); cut the rest');
  }
}

export function checkF9(ctx) {
  const FAKE = /(i\.pravatar\.cc|pravatar\.cc|api\.dicebear\.com|dicebear\.com|randomuser\.me|thispersondoesnotexist\.com|ui-avatars\.com)/i;
  const UNSPLASH = /https?:\/\/[^"'()\s]*unsplash\.com[^"'()\s]*/gi;
  const PERSONY = /person|face|portrait|people|headshot/i;
  const scan = (text, file, lineAt) => {
    const f = FAKE.exec(text);
    if (f) report('F9', 'FAIL', file, lineAt(f.index), `fake-human avatar service ${f[1]}`,
      'Drop the face, or use the real person\'s own photo; a generated stranger is fabricated social proof');
    for (const m of text.matchAll(UNSPLASH)) {
      if (PERSONY.test(m[0])) report('F9', 'WARN', file, lineAt(m.index),
        `stock person-keyword URL ${trunc(m[0], 44)}`,
        'Faces as social proof need real people; a stock face is a stranger');
    }
  };
  for (const doc of ctx.docs) scan(doc.src, doc.file, (i) => doc.lineOf(i));
  for (const c of ctx.cssFiles) scan(c.raw, c.file, (i) => c.raw.slice(0, i).split('\n').length);
}

export function fontSizePxOf(r, ctx) {
  const fs = r.decls.find((d) => d.prop === 'font-size');
  if (fs) return pxOf(resolveVars(fs.value, ctx.tokens));
  const f = r.decls.find((d) => d.prop === 'font');
  if (!f) return null;
  const m = /(?:^|\s)(\d+(?:\.\d+)?(?:px|rem|em))(?:\/[\d.]+(?:px|rem|em)?)?\s/.exec(resolveVars(f.value, ctx.tokens) + ' ');
  return m ? pxOf(m[1]) : null;
}
