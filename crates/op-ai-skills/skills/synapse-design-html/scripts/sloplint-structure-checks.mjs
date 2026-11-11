/** HTML quality diagnostics; adapted from the original Synapse HTML skill. */
import {
  contrastRatio, famKey, firstFamily, innerOf, isTokenRule,
  parseColor, plainText, pxOf, resolveVars, srgbToOklch,
  trunc,
} from './sloplint-color.mjs';
import { getAttr, hasAttr } from './sloplint-jsx.mjs';
import { stripComments } from './sloplint-markup.mjs';
import { GENERIC_FAMILIES, HEADING_SEL, mergedDeclsBySelector, report, selectorIsInteractive } from './sloplint-report.mjs';
import { twGroup } from './sloplint-tailwind-checks.mjs';

export function check24a(ctx) {
  const spaceVals = new Map();
  for (const [k, v] of Object.entries(ctx.tokens)) {
    if (!k.startsWith('--space-')) continue;
    const px = pxOf(resolveVars(v, ctx.tokens));
    if (px != null && px > 0) spaceVals.set(px, k);
  }
  if (!spaceVals.size) return;
  const props = /^(padding|margin|gap|row-gap|column-gap)(-[a-z]+)?$/;
  const counts = new Map();
  for (const r of ctx.rules) {
    if (r.keyframes || isTokenRule(r)) continue;
    for (const d of r.decls) {
      if (!props.test(d.prop)) continue;
      const raw = d.value.replace(/var\([^)]*\)/g, ' ');
      for (const m of raw.matchAll(/(?<![\w.-])(-?\d+(?:\.\d+)?)(px|rem)\b/g)) {
        const px = Math.abs(pxOf(m[1] + m[2]) ?? 0);
        if (!px || !spaceVals.has(px)) continue;
        const n = (counts.get(r.file) || 0) + 1;
        counts.set(r.file, n);
        if (n <= 8) report('24a', 'FAIL', r.file, d.line, `${d.prop}: ${trunc(d.value, 28)} on ${trunc(r.selector, 32)} where ${spaceVals.get(px)} exists`, `Use var(${spaceVals.get(px)})`);
        break;
      }
    }
  }
  for (const [file, n] of counts) if (n > 8) report('24a', 'FAIL', file, 1, `+${n - 8} more raw spacing lengths with a matching --space-* token in this file`, 'Use the tokens');
}

export function shortProse(ctx, sel) {
  const cls = [...sel.matchAll(/\.([\w-]+)/g)].map((m) => m[1]).pop();
  if (!cls) return false;
  const texts = [];
  for (const doc of ctx.docs) for (const m of doc.src.matchAll(new RegExp(`<(\\w+)[^>]*class="[^"]*\\b${cls}\\b[^"]*"[^>]*>([\\s\\S]*?)</\\1>`, 'g'))) {
    for (const p of (/^p$/i.test(m[1]) ? [m[2]] : m[2].match(/<p\b[^>]*>[\s\S]*?<\/p>/g) || [])) texts.push(p.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
  }
  return texts.length > 0 && texts.every((t) => t.length <= 200 && (t.match(/[.!?](?:\s|$)/g) || []).length <= 2);
}

export function check25(ctx) {
  const proseish = /(^|[\s,>+~(])p\b|lede|prose|copy|__body|__text|__desc|paragraph/i;
  for (const r of ctx.rules) {
    if (!proseish.test(r.selector) || HEADING_SEL.test(r.selector)) continue;
    for (const d of r.decls) {
      if (d.prop !== 'max-width') continue;
      const m = /^([\d.]+)ch$/.exec(resolveVars(d.value, ctx.tokens).trim());
      if (m) {
        const ch = parseFloat(m[1]);
        const floor = /lede|hero|caption|figcaption|__line|__sub|subhead|tagline/i.test(r.selector) || shortProse(ctx, r.selector) ? 28 : 45;
        if (ch < floor || ch > 75) {
          report(25, 'WARN', r.file, d.line, `measure ${ch}ch on ${r.selector} (${floor}-75ch range)`, 'Set prose measure between 45 and 75ch; a one-sentence lede or caption from 28ch');
        }
      }
    }
  }
}

export function check26(ctx) {
  const hasInteractive = ctx.docs.some((doc) => /<(a|button|input|select|textarea)\b|role\s*=\s*["']button/i.test(doc.src))
    || ctx.rules.some((r) => selectorIsInteractive(r.selector));
  if (!hasInteractive) return;
  const has = (pseudo) => ctx.rules.some((r) => r.selector.includes(pseudo));
  const tv = twGroup(ctx).variants;
  const shared = ctx.shared || {};
  const once = (key) => !shared.once || (!shared.once.has(key) && !!shared.once.add(key));
  const file = ctx.cssFiles[0]?.file || ctx.docs[0]?.file || '?';
  if (!has(':focus-visible') && !has(':focus') && !shared.focus && ![...tv].some((v) => /^focus(?:-visible|-within)?$/.test(v)) && once('26a')) {
    report('26a', 'FAIL', file, 1, 'no :focus-visible styling anywhere', 'A focus ring at 3:1 or better, instant');
  }
  if (!has(':active') && !shared.active && !tv.has('active') && once('26b:active')) {
    report('26b', 'FAIL', file, 1, 'no :active styling anywhere', 'All eight states; guard: not a form control, no aria-disabled anywhere');
  }
  const hasFormish = ctx.docs.some((doc) => /<(button|input|select|textarea)\b/i.test(doc.src));
  if (hasFormish && !has(':disabled') && !shared.disabled && !tv.has('disabled') && !tv.has('aria-disabled') && !ctx.rules.some((r) => /\[disabled\]|aria-disabled/.test(r.selector)) && once('26b:disabled')) {
    report('26b', 'FAIL', file, 1, 'no :disabled styling anywhere', 'All eight states; guard: not a form control, no aria-disabled anywhere');
  }
}

export function check27(ctx) {
  const tw = twGroup(ctx);
  const moves = (r) => r.decls.some((d) => /^(transform|translate|scale|rotate)$/.test(d.prop) && !/^none\b/.test(d.value.trim()));
  const hasMotion = ctx.rules.some((r) => r.keyframes)
    || ctx.rules.some((r) => r.decls.some((d) => d.prop.startsWith('transition') && /transform/.test(d.value)))
    || (ctx.rules.some((r) => r.decls.some((d) => d.prop.startsWith('transition') && /(^|[\s,])all\b/.test(d.value))) && ctx.rules.some((r) => /:(hover|active|focus)/.test(r.selector) && moves(r)));
  if (!hasMotion && !tw.motion) return;
  const hasPRM = ctx.rules.some((r) => r.media && /prefers-reduced-motion/i.test(r.media))
    || ctx.cssFiles.some((f) => /prefers-reduced-motion/i.test(stripComments(f.raw)))
    || ctx.docs.some((doc) => doc.styles.some((s) => /prefers-reduced-motion/i.test(stripComments(s.css))))
    || tw.variants.has('motion-reduce') || tw.variants.has('motion-safe') || !!ctx.shared?.prm;
  if (!hasPRM && ctx.shared) {
    if (ctx.shared.once.has('27')) return;
    ctx.shared.once.add('27');
  }
  if (!hasPRM && !hasMotion) {
    const m = tw.motion;
    report(27, 'FAIL', m.doc.file, m.line, `motion utilities (${m.info.animate || 'a transition on a transform'}) with no motion-reduce: or motion-safe: variant anywhere`, 'Add motion-reduce: fallbacks, or put the motion behind motion-safe:');
  } else if (!hasPRM) {
    const kf = ctx.rules.find((r) => r.keyframes);
    const file = kf ? kf.file : (ctx.cssFiles[0]?.file || ctx.docs[0]?.file || '?');
    report(27, 'FAIL', file, kf ? kf.line : 1, 'motion present, no prefers-reduced-motion block', 'Add a prefers-reduced-motion fallback');
  }
}

export function check28(ctx) {
  for (const doc of ctx.docs) {
    let firstMedia = true, seenH1 = false, heroPassed = false;
    for (const t of doc.tags) {
      if (t.close) { if (seenH1 && (t.name === 'section' || t.name === 'header')) heroPassed = true; continue; }
      if (t.name === 'h1') seenH1 = true;
      if (t.name === 'video') {
        if (hasAttr(t.attrs, 'autoplay') && !hasAttr(t.attrs, 'muted')) {
          report('28a', 'FAIL', doc.file, t.line, 'autoplay video without muted', 'autoplay muted loop playsinline, with poster');
        }
        if (!getAttr(t.attrs, 'poster')) {
          report('28b', 'FAIL', doc.file, t.line, 'video without poster', 'Add a poster frame; guard: below the fold and not the LCP');
        }
        if ((getAttr(t.attrs, 'loading') || '').toLowerCase() === 'lazy' && firstMedia) {
          report('28a', 'WARN', doc.file, t.line, 'lazy-loaded hero video', 'Never lazy on the LCP video; preload its poster with fetchpriority=high');
        }
        firstMedia = false;
      }
      if (t.name === 'img') {
        if (firstMedia && !heroPassed && (getAttr(t.attrs, 'loading') || '').toLowerCase() === 'lazy') {
          report('28a', 'WARN', doc.file, t.line, 'lazy-loaded first image (likely LCP)', 'fetchpriority=high on the LCP element');
        }
        firstMedia = false;
      }
    }
  }
}

export function check30(ctx) {
  const EMOJI = /(?![©®™‼⁉←-⇿])\p{Extended_Pictographic}/u;
  const GLYPH = /(?![©®™‼⁉←-⇿✓-✖])(?:\p{Emoji_Presentation}|\p{Extended_Pictographic}️)/u;
  for (const doc of ctx.docs) {
    const lines = new Set();
    let n = 0;
    const flag = (line, what) => { if (lines.has(line) || n >= 8) return; lines.add(line); n++; report('30a', 'FAIL', doc.file, line, what, 'One icon library, a custom SVG, or the word alone'); };
    for (let i = 0; i < doc.tags.length; i++) {
      const t = doc.tags[i];
      if (t.close || t.selfClosing) continue;
      const cls = getAttr(t.attrs, 'class') || '';
      const iconish = /icon|card|step|tier|feature|value|prop|badge/i.test(cls);
      const inner = innerOf(doc, i);
      if (!inner) continue;
      const content = inner.inner.replace(/<[^>]*>/g, '').trim();
      if (content && content.length <= 4 && EMOJI.test(content) && (iconish || !/<[a-z]/.test(inner.inner))) {
        lines.add(doc.lineOf(t.end + inner.inner.search(EMOJI)));
        report('30a', 'FAIL', doc.file, t.line, `emoji icon "${content}" in <${t.name} class="${trunc(cls, 28)}">`, 'One icon library or custom SVG');
        continue;
      }
      if (!/^(h[1-6]|button|a|label|th|summary|option|legend|dt)$/.test(t.name) || /<(p|div|ul|ol|table|section)\b/i.test(inner.inner)) continue;
      const text = plainText(inner.inner);
      const at = inner.inner.search(GLYPH);
      if (!text || at < 0) continue;
      const line = doc.lineOf(t.end + at);
      flag(line, `emoji in <${t.name}> "${trunc(text, 32)}"`);
    }
    const raw = doc.raw || doc.src;
    const body = doc.kind === 'html' ? doc.masked : raw;
    const lineAt = (text, pos) => text.slice(0, pos).split('\n').length;
    for (const m of body.matchAll(/>\s*((?:\p{Emoji_Presentation}|\p{Extended_Pictographic}️)[^<>{}\n]{0,40})/gu)) flag(lineAt(body, m.index + m[0].length - m[1].length), `text opens with an emoji: "${trunc(m[1].trim(), 32)}"`);
    for (const m of raw.matchAll(/placeholder\s*=\s*["']([^"']*)["']/g)) if (GLYPH.test(m[1])) flag(lineAt(raw, m.index), `emoji in a placeholder "${trunc(m[1], 28)}"`);
    if (doc.kind !== 'html') for (const m of raw.matchAll(/(["'`])\s*((?:(?:\p{Emoji_Presentation}|\p{Extended_Pictographic}️?)‍?){1,3})\s*\1/gu)) flag(lineAt(raw, m.index), `emoji passed as an icon: ${m[2]}`);
  }
  const libs = new Map([
    ['material', /material-icons|material-symbols/i],
    ['heroicons', /heroicon/i],
    ['lucide', /lucide/i],
    ['phosphor', /phosphor|\bph-(?:bold|fill|light|duotone|[a-z]+-[a-z]+)/i],
    ['font-awesome', /font-?awesome|\bfa-(solid|regular|brands|light)\b/i],
    ['feather', /feather-icons|\bfeather\b/i],
    ['tabler', /tabler-icons/i],
    ['bootstrap-icons', /bootstrap-icons|\bbi-[a-z]/i],
  ]);
  const found = new Set();
  const hay = ctx.docs.map((d) => d.src).join('\n') + ctx.cssFiles.map((f) => f.raw).join('\n');
  for (const [name, re] of libs) if (re.test(hay)) found.add(name);
  if (found.size >= 2) {
    report('30b', 'WARN', ctx.docs[0]?.file || ctx.cssFiles[0]?.file, 1, `icon libraries mixed: ${[...found].join(' + ')}`, 'One icon library per page; guard: the second is a brand mark in at most two slots');
  }
}

export function check33(ctx) {
  const labeledAttrs = (a) => hasAttr(a, 'aria-hidden') || getAttr(a, 'aria-label') != null
    || getAttr(a, 'aria-labelledby') != null
    || ['img', 'presentation', 'none'].includes((getAttr(a, 'role') || '').toLowerCase());
  for (const doc of ctx.docs) {
    const stack = [];
    for (const t of doc.tags) {
      if (t.close) {
        for (let i = stack.length - 1; i >= 0; i--) {
          if (stack[i].name === t.name) { stack.splice(i); break; }
        }
        continue;
      }
      if (t.name === 'svg' || t.name === 'canvas') {
        const ancestorLabeled = stack.some((s) => s.labeled);
        const titled = t.name === 'svg' && !t.selfClosing && /<title\b[^>]*>\s*\S/i.test(innerOf(doc, doc.tags.indexOf(t))?.inner || '');
        if (!labeledAttrs(t.attrs) && !ancestorLabeled && !titled) {
          report(33, 'FAIL', doc.file, t.line, `<${t.name}> without aria-hidden or aria-label`, 'Add aria-hidden or an aria-label');
        }
      }
      if (!t.selfClosing) stack.push({ name: t.name, labeled: labeledAttrs(t.attrs) });
    }
  }
}

export function check34(ctx) {
  const clipped = new Set();
  let hidden = null;
  for (const r of ctx.rules) {
    if (!/(^|[\s,])(html|body)\b/.test(r.selector)) continue;
    const targets = r.selector.split(',').map((p) => (/^\s*(html|body)\s*$/.exec(p) || [])[1]).filter(Boolean);
    for (const d of r.decls) {
      if (d.prop === 'overflow-x' || d.prop === 'overflow') {
        if (/\bclip\b/.test(d.value)) for (const t of targets) clipped.add(t);
        else if (/\bhidden\b/.test(d.value)) hidden = { file: r.file, line: d.line, sel: r.selector };
      }
    }
  }
  const hiddenUtil = [];
  for (const it of twGroup(ctx).items) {
    if (it.idx < 0 || !/^(html|body)$/.test(it.name)) continue;
    if (it.info.oxClip) clipped.add(it.name);
    if (it.info.oxHidden) hiddenUtil.push(it);
  }
  for (const it of hiddenUtil) report(34, 'FAIL', it.doc.file, it.line, `${it.info.oxHidden} on <${it.name}> (breaks sticky)`, 'overflow-x-clip on both html and body, never hidden');
  const shell = (d) => d.kind === 'html' && !d.styles.length && /<script\b[^>]*type\s*=\s*["']module["'][^>]*\bsrc\s*=\s*["'][^"']+\.(?:tsx?|jsx?|mjs|vue|svelte)["']/i.test(d.raw || d.src) && ![...(d.raw || d.src).matchAll(/<link\b[^>]*>/gi)].some((m) => /rel\s*=\s*["']stylesheet/i.test(m[0]) && !/href\s*=\s*["']https?:/i.test(m[0]));
  const pageish = ctx.docs.some((d) => (d.kind === 'html' && !shell(d)) || (d.kind !== 'html' && d.tags.some((t) => !t.close && (t.name === 'html' || t.name === 'body'))));
  const file = ctx.cssFiles[0]?.file || ctx.docs[0]?.file;
  const both = clipped.has('html') && clipped.has('body');
  if (!both && hidden) {
    report(34, 'FAIL', hidden.file, hidden.line, `overflow-x: hidden on ${hidden.sel} (breaks sticky)`, 'Use overflow-x: clip on both html and body, never hidden');
  } else if (!both && file && ctx.docs.length && pageish && !hiddenUtil.length) {
    const where = clipped.size ? `overflow-x: clip on ${[...clipped][0]} only` : 'no overflow-x: clip on html and body';
    report(34, 'FAIL', file, 1, where, 'overflow-x: clip on both html and body');
  }
  for (const r of ctx.rules) {
    for (const d of r.decls) {
      if (/^(width|min-width)$/.test(d.prop) && /(^|[^\w.-])100vw\b/.test(d.value)) {
        report(34, 'FAIL', r.file, d.line, `${d.prop}: ${trunc(d.value, 28)} on ${r.selector} (scrollbar overflow)`, 'width: 100% with container padding');
      }
    }
  }
}

export function check37(ctx) {
  const families = new Map();
  const generic = GENERIC_FAMILIES;
  for (const r of ctx.rules) {
    if (r.selector === '@font-face') continue;
    for (const d of r.decls) {
      if (d.prop !== 'font-family' && !d.prop.startsWith('--font-')) continue;
      if (d.prop.startsWith('--font-') && !isTokenRule(r)) continue;
      const fam = firstFamily(resolveVars(d.value, ctx.tokens));
      if (!fam || generic.has(fam) || fam.startsWith('var(')) continue;
      if (![...families.keys()].some((k) => famKey(k) === famKey(fam))) families.set(fam, { file: r.file, line: d.line });
    }
  }
  if (families.size > 3) {
    const list = [...families.keys()].join(', ');
    const first = [...families.values()][3];
    report(37, 'FAIL', first.file, first.line, `${families.size} font families: ${trunc(list, 56)}`, 'Drop the extra family; three is the ceiling');
  }
}

export function check38a(ctx) {
  for (const r of ctx.rules) {
    if (!HEADING_SEL.test(r.selector)) continue;
    for (const d of r.decls) {
      if (d.prop === 'font-style' && /italic|oblique/.test(d.value)) {
        report('38ii', 'FAIL', r.file, d.line, `italic display type on ${r.selector}`, 'Roman headers; emphasis via weight or accent');
      }
    }
  }

  const normSel = ctx.rules.filter((r) => /(^|[\s,>+~])(em|i)\b/.test(r.selector)
    && r.decls.some((d) => d.prop === 'font-style' && /normal/.test(d.value))).flatMap((r) => r.selector.split(',').map((x) => x.trim()));
  const normalised = (level, classes) => normSel.some((sel) => /^(em|i)$/.test(sel) || new RegExp(`(^|[\\s,>+~])h${level}\\b`).test(sel) || classes.some((c) => sel.includes('.' + c)));
  for (const doc of ctx.docs) {
    const re = /<h([1-6])\b([^>]*)>([\s\S]*?)<\/h\1>/gi;
    let m;
    while ((m = re.exec(doc.src))) {
      const classes = ((/class\s*=\s*["']([^"']*)["']/i.exec(m[2]) || [])[1] || '').split(/\s+/).filter(Boolean);
      if (/<(em|i)\b/i.test(m[3]) && !normalised(m[1], classes)) {
        report('38i', 'FAIL', doc.file, doc.lineOf(m.index), `<em>/<i> inside <h${m[1]}>`, 'Roman headers; emphasis via weight or accent');
      }
    }
  }
}

export function check39(ctx) {
  const hasInputs = ctx.docs.some((doc) => /<(input|textarea|select)\b/i.test(doc.src))
    || ctx.rules.some((r) => /(^|[\s,>+~])(input|textarea|select)\b/.test(r.selector));
  if (!hasInputs) return;
  const inputSel = /(^|[\s,>+~])(input|textarea|select)\b|__input|__field|\.(input|field)\b/;
  const widthOf = (v) => { const m = /(\d+(?:\.\d+)?)px/.exec(v); return m ? parseFloat(m[1]) : null; };
  let baseW = null;
  for (const r of ctx.rules) {
    if (!inputSel.test(r.selector) || /:hover|:focus|:active|:disabled|\[|:checked/.test(r.selector)) {
      continue;
    }
    for (const d of r.decls) {
      if (d.prop === 'border' || d.prop === 'border-width') {
        const w = widthOf(d.value);
        if (w != null && baseW == null) baseW = w;
      }
    }
  }
  for (const r of ctx.rules) {
    if (!inputSel.test(r.selector)) continue;
    const stateful = /:hover|:focus|\.is-error|\[aria-invalid/.test(r.selector);
    if (!stateful) continue;
    for (const d of r.decls) {
      if (d.prop === 'border' || d.prop === 'border-width') {
        const w = widthOf(d.value);
        if (w != null && baseW != null && w !== baseW) {
          report('39a', 'FAIL', r.file, d.line, `border-width ${baseW}px -> ${w}px on ${r.selector} (layout shift)`, 'Keep border-width constant; move state to outline');
        }
      }
    }
    if (/:focus/.test(r.selector)) {
      const setsBorder = r.decls.some((d) => /^border(-color)?$/.test(d.prop));
      const setsOutline = r.decls.some((d) => d.prop.startsWith('outline'));
      if (setsBorder && !setsOutline) {
        report('39a', 'FAIL', r.file, r.line, `focus state via border on ${r.selector}`, 'Focus ring via outline, not border');
      }
    }
  }
  for (const r of ctx.rules) {
    if (!/:disabled|\[disabled\]/.test(r.selector)) continue;
    const hasOpacity = r.decls.some((d) => d.prop === 'opacity');
    const hasCursor = r.decls.some((d) => d.prop === 'cursor' && /not-allowed/.test(d.value));
    if (hasOpacity && !hasCursor) {
      report('39a', 'FAIL', r.file, r.line, `disabled via opacity alone on ${r.selector}`, 'Three disabled channels: fill, ink and cursor, plus the disabled attribute');
    }
  }
}

export function check40_41(ctx) {
  const bySel = mergedDeclsBySelector(ctx);
  const resolveColor = (value, local) => {
    const resolved = resolveVars(value, ctx.tokens, local).trim();
    return parseColor(resolved);
  };
  for (const r of bySel) {
    const local = {};
    for (const d of r.decls) if (d.prop.startsWith('--')) local[d.prop] = d.value;
    const colorD = r.decls.find((d) => d.prop === 'color');
    const bgD = r.decls.find((d) => d.prop === 'background-color')
      || r.decls.find((d) => d.prop === 'background' && !/gradient|url\(/i.test(d.value));
    if (colorD && bgD && !/::selection|::placeholder|::-moz/.test(r.selector)) {
      const fg = resolveColor(colorD.value, local);
      const bg = resolveColor(bgD.value, local);
      if (fg && bg && fg.alpha >= 1 && bg.alpha >= 1) {
        const sizeD = r.decls.find((d) => d.prop === 'font-size');
        const weightD = r.decls.find((d) => d.prop === 'font-weight');
        const sizePx = sizeD ? pxOf(resolveVars(sizeD.value, ctx.tokens, local)) : null;
        const weight = weightD ? parseInt(weightD.value, 10) || 400 : 400;
        const large = (sizePx != null && sizePx >= 24) || (sizePx != null && sizePx >= 18 && weight >= 700);
        const threshold = large ? 3.0 : 4.5;
        const ratio = contrastRatio(fg, bg);
        if (ratio < threshold - 0.05) {
          report(40, 'WARN', r.file, colorD.line, `${ratio.toFixed(2)}:1 < ${threshold}:1 on ${r.selector}`, 'Raise the contrast to threshold');
        }
        const okFg = srgbToOklch(fg), okBg = srgbToOklch(bg);
        const btnish = /btn|button|cta|pill|chip/i.test(r.selector);
        if (btnish && Math.abs(okFg.L - okBg.L) < 0.05 && Math.abs(okFg.C - okBg.C) < 0.05) {
          report(41, 'WARN', r.file, colorD.line, `button text ~ button fill on ${r.selector} (dL ${Math.abs(okFg.L - okBg.L).toFixed(3)})`, 'Use accent-ink or paper for the label');
        }
      }
    }
    const faceProp = Object.keys(local).find((k) => /(face|fill|bg)$/.test(k));
    const inkProp = Object.keys(local).find((k) => /(ink|text)$/.test(k));
    if (faceProp && inkProp) {
      const face = resolveColor(local[faceProp], local);
      const ink = resolveColor(local[inkProp], local);
      if (face && ink && face.alpha >= 1 && ink.alpha >= 1) {
        const a = srgbToOklch(face), b = srgbToOklch(ink);
        if (Math.abs(a.L - b.L) < 0.05 && Math.abs(a.C - b.C) < 0.05) {
          report(41, 'WARN', r.file, r.line, `${inkProp} ~ ${faceProp} on ${r.selector}`, 'Use accent-ink or paper for the label');
        }
      }
    }
  }
  if (ctx.tokens['--color-accent'] && !ctx.tokens['--color-accent-ink']) {
    const used = ctx.rules.some((r) => !isTokenRule(r) && r.decls.some((d) =>
      /^background(-color)?$/.test(d.prop) && /var\(\s*--color-accent\s*[),]/.test(d.value)));
    if (used) {
      const file = ctx.cssFiles[0]?.file || ctx.docs[0]?.file;
      report(41, 'WARN', file, 1, 'accent fills a surface but --color-accent-ink is undefined', 'Define and apply --color-accent-ink');
    }
  } else if (ctx.tokens['--color-accent'] && ctx.tokens['--color-accent-ink']) {
    const a = parseColor(resolveVars(ctx.tokens['--color-accent'], ctx.tokens));
    const i = parseColor(resolveVars(ctx.tokens['--color-accent-ink'], ctx.tokens));
    if (a && i && contrastRatio(a, i) < 4.45) {
      const file = ctx.cssFiles[0]?.file || ctx.docs[0]?.file;
      report(41, 'WARN', file, 1, `accent-ink vs accent only ${contrastRatio(a, i).toFixed(2)}:1`, 'Accent-ink needs 4.5:1 against accent');
    }
  }
  const sectionish = /section|panel|hero|footer|band|block|col\b|__col|card|cta|dark|invert/i;
  for (const r of bySel) {
    if (!sectionish.test(r.selector) || /:hover|:focus|:active|::|@font-face/.test(r.selector)) continue;
    const local = {};
    for (const d of r.decls) if (d.prop.startsWith('--')) local[d.prop] = d.value;
    const bgD = r.decls.find((d) => d.prop === 'background-color')
      || r.decls.find((d) => d.prop === 'background' && !/gradient|url\(/i.test(d.value));
    if (!bgD) continue;
    const bg = resolveColor(bgD.value, local);
    if (!bg || bg.alpha < 1) continue;
    const okl = srgbToOklch(bg);
    if (okl.L < 0.5) {
      const hasColor = r.decls.some((d) => d.prop === 'color');
      if (!hasColor) {
        report(41, 'WARN', r.file, bgD.line, `dark surface (L ${(okl.L * 100).toFixed(0)}%) on ${r.selector} sets no text colour`, 'Swap text to paper in the same rule');
      }
    }
  }
}
