/** HTML quality diagnostics; adapted from the original Synapse HTML skill. */
import { baseSelector, maskedProse } from './sloplint-accessibility-checks.mjs';
import {
  famKey, firstFamily, innerOf, isTokenRule, parseColor,
  pxOf, resolveVars, srgbToOklch, trunc,
} from './sloplint-color.mjs';
import { getAttr } from './sloplint-jsx.mjs';
import { HEADING_SEL, mergedDeclsBySelector, report } from './sloplint-report.mjs';

export function check1(ctx) {
  const banned = new Set(['inter', 'roboto', 'open sans', 'poppins', 'lato', 'system-ui', '-apple-system', 'arial', 'helvetica', 'helvetica neue', 'segoe ui']);
  const seen = new Set();
  const flag = (fam, file, line, where) => {
    if ([...banned].some((b) => famKey(b) === famKey(fam)) && !seen.has(fam + where)) {
      seen.add(fam + where);
      report(1, 'FAIL', file, line, `display font "${fam}" (${where})`, 'Pick a display face from the typography catalog');
    }
  };
  for (const [prop, val] of Object.entries(ctx.tokens)) {
    if (/^--font-(display|heading|title|hero)/.test(prop)) {
      const tr = ctx.rules.find((r) => isTokenRule(r) && r.decls.some((d) => d.prop === prop));
      flag(firstFamily(resolveVars(val, ctx.tokens)), tr ? tr.file : ctx.rules[0]?.file || '?', tr ? tr.decls.find((d) => d.prop === prop)?.line : 1, prop);
    }
  }
  for (const r of ctx.rules) {
    if (isTokenRule(r) || !HEADING_SEL.test(r.selector)) continue;
    for (const d of r.decls) {
      if (d.prop === 'font-family') flag(firstFamily(resolveVars(d.value, ctx.tokens)), r.file, d.line, r.selector);
    }
  }
}

export const hueIn = (h, lo, hi) => (lo <= hi ? h >= lo && h <= hi : h >= lo || h <= hi);

export function gradientHues(value, ctx) {
  const resolved = resolveVars(value, ctx.tokens);
  const stops = [];
  const colRe = /#[0-9a-fA-F]{3,8}\b|oklch\([^)]*\)|rgba?\([^)]*\)|hsla?\([^)]*\)/g;
  let cm;
  while ((cm = colRe.exec(resolved))) {
    const c = parseColor(cm[0]);
    if (c && c.alpha > 0.05) {
      const ok = c.okl || srgbToOklch(c);
      if (ok.C > 0.04) stops.push(ok.H);
    }
  }
  return stops;
}

export function paperIsDark(ctx) {
  const p = parseColor(resolveVars(ctx.tokens['--color-paper'] || '', ctx.tokens));
  return !!p && (p.okl || srgbToOklch(p)).L < 0.4;
}

export function bannedGradient(stops, ctx) {
  const purple = stops.some((h) => hueIn(h, 265, 330));
  const blue = stops.some((h) => hueIn(h, 200, 264));
  const pink = stops.some((h) => hueIn(h, 331, 25));
  const cyan = stops.some((h) => hueIn(h, 170, 230));
  if (purple && blue) return 'purple-to-blue';
  if (purple && pink) return 'purple-to-pink';
  if (cyan && paperIsDark(ctx)) return 'cyan-on-dark';
  return null;
}

export function gradientTextRules(ctx) {
  const out = [];
  for (const r of mergedDeclsBySelector(ctx)) {
    const clip = r.decls.find((d) => /background-clip/.test(d.prop) && /\btext\b/i.test(d.value));
    if (!clip) continue;
    const grad = r.decls.find((d) => /^background(-image)?$/.test(d.prop) && /gradient\(/i.test(d.value));
    const transparent = r.decls.find((d) => (d.prop === 'color' || d.prop === '-webkit-text-fill-color') && /transparent/i.test(d.value));
    if (grad || transparent) out.push({ r, clip, grad });
  }
  return out;
}

export function withoutPatterns(value) {
  let out = '', i = 0;
  const re = /repeating-(?:linear|radial|conic)-gradient\(/gi;
  let m;
  while ((m = re.exec(value))) {
    out += value.slice(i, m.index);
    let depth = 1, k = m.index + m[0].length;
    while (k < value.length && depth > 0) { if (value[k] === '(') depth++; else if (value[k] === ')') depth--; k++; }
    i = k; re.lastIndex = k;
  }
  return out + value.slice(i);
}

export function check2(ctx) {
  const textRules = new Set();
  for (const { r, clip, grad } of gradientTextRules(ctx)) {
    textRules.add(r.selector);
    const banned = grad ? bannedGradient(gradientHues(grad.value, ctx), ctx) : null;
    if (banned) report('2a', 'FAIL', r.file, clip.line, `${banned} gradient text on ${r.selector}`, 'One anchor hue, solid ink');
    else report('2b', 'FAIL', r.file, clip.line, `gradient text on ${r.selector}`, 'Solid ink; weight or a display face. Guard: a single-hue ramp from two tokens with 40 and 41 passing');
  }
  for (const r of ctx.rules) {
    if (textRules.has(r.selector)) continue;
    for (const d of r.decls) {
      if (!/gradient\(/i.test(d.value)) continue;
      const washes = withoutPatterns(d.value);
      if (!/gradient\(/i.test(washes)) continue;
      const banned = bannedGradient(gradientHues(washes, ctx), ctx);
      if (banned) report('2a', 'FAIL', r.file, d.line, `${banned} gradient on ${r.selector}`, 'One anchor hue; drop the gradient');
    }
  }
}

export function check3(ctx) {
  for (const r of ctx.rules) {
    for (const d of r.decls) {
      if (d.prop !== 'grid-template-columns') continue;
      const v = resolveVars(d.value, ctx.tokens).trim();
      if (/^repeat\(\s*3\s*,\s*(minmax\(\s*0(px)?\s*,\s*1fr\s*\)|1fr)\s*\)$/.test(v)
        || /^(1fr|minmax\(\s*0(px)?\s*,\s*1fr\s*\))(\s+(1fr|minmax\(\s*0(px)?\s*,\s*1fr\s*\))){2}$/.test(v)) {

        const classes = (r.selector.match(/\.[a-zA-Z][\w-]*/g) || []).map((c) => c.slice(1));
        let iconTiles = !ctx.docs.length && !classes.length;
        for (const doc of ctx.docs) {
          for (let i = 0; i < doc.tags.length; i++) {
            const t = doc.tags[i];
            if (t.close || t.selfClosing) continue;
            const cls = getAttr(t.attrs, 'class') || '';
            if (!classes.some((c) => cls.split(/\s+/).includes(c))) continue;
            const inner = innerOf(doc, i);
            if (inner && (/class\s*=\s*["'][^"']*icon/i.test(inner.inner) || /<svg\b/i.test(inner.inner)) && /<h[2-6]\b/i.test(inner.inner)) {
              iconTiles = true;
            }
          }
        }
        if (iconTiles) {
          report(3, 'WARN', r.file, d.line, `3 equal icon-tile columns on ${r.selector}`, 'Vary column widths or drop the icon tiles');
        }
      }
    }
  }
}

export function check4(ctx) {

  const cardWord = /(^|-)card(--[\w-]+)?$/i;
  const containerish = /(grid|list|rail|row|wrap|deck|group|stack|container|section|scroller|track)/i;
  for (const doc of ctx.docs) {
    const stack = [];
    for (const t of doc.tags) {
      if (t.close) {
        for (let i = stack.length - 1; i >= 0; i--) {
          if (stack[i].name === t.name) { stack.splice(i); break; }
        }
        continue;
      }
      if (t.selfClosing) continue;
      const cls = getAttr(t.attrs, 'class') || '';
      const isCard = cls.split(/\s+/).some((c) => { const base = c.split('--')[0]; return base && cardWord.test(base) && !containerish.test(base); });
      if (isCard && stack.some((s) => s.isCard)) {
        report(4, 'FAIL', doc.file, t.line, `card nested in card: class="${trunc(cls, 40)}"`, 'Keep one containment layer');
      }
      stack.push({ name: t.name, isCard });
    }
  }
}

export function check3Stripe(ctx) {
  for (const r of ctx.rules) {
    for (const d of r.decls) {
      if (!/^border-(left|right|inline-start|inline-end)$/.test(d.prop)) continue;
      const m = /(\d+(?:\.\d+)?)px/.exec(d.value);
      if (m && parseFloat(m[1]) >= 3 && !/transparent|none/i.test(d.value)) {
        report(3, 'WARN', r.file, d.line, `side stripe ${d.prop}: ${trunc(d.value, 32)} on ${r.selector}`, 'Hairline all round, none, or an accent square');
      }
    }
  }
}

export function heroClasses(ctx) {
  const out = new Set();
  for (const doc of ctx.docs) {
    const h1 = doc.tags.findIndex((t) => !t.close && t.name === 'h1');
    if (h1 < 0) continue;
    for (let i = h1 - 1; i >= 0; i--) {
      const t = doc.tags[i];
      if (t.close || !/^(section|header)$/.test(t.name)) continue;
      for (const c of (getAttr(t.attrs, 'class') || '').split(/\s+/)) if (c) out.add(c);
      break;
    }
  }
  return out;
}

export function check6a(ctx) {
  const heroCls = heroClasses(ctx);
  const isHero = (sel) => /hero/i.test(sel) || [...heroCls].some((c) => sel.includes('.' + c));
  const seen = new Set();
  for (const r of ctx.rules) {
    if (r.keyframes || isTokenRule(r) || !isHero(r.selector)) continue;
    for (const d of r.decls) {
      if (!/^(min-)?height$/.test(d.prop)) continue;
      const v = resolveVars(d.value, ctx.tokens);
      if (!/\d\s*vh\b/i.test(v) || seen.has(r.selector)) continue;
      seen.add(r.selector);
      report('6a', 'FAIL', r.file, d.line, `hero sized in vh: ${d.prop}: ${trunc(v, 24)} on ${r.selector}`, 'dvh or svh');
    }
  }
}

export function check7(ctx) {
  const props = /^(color|background|background-color|border-color|outline-color)$|^--color-/;
  for (const r of ctx.rules) {
    if (r.selector === '@font-face') continue;
    for (const d of r.decls) {
      if (!props.test(d.prop)) continue;
      const resolved = resolveVars(d.value, ctx.tokens).trim();
      const c = parseColor(resolved);
      if (!c || c.alpha < 1) continue;
      const isWhite = c.r > 0.999 && c.g > 0.999 && c.b > 0.999;
      const isBlack = c.r < 0.001 && c.g < 0.001 && c.b < 0.001;
      if (isWhite && ctx.genre === 'modern-minimal') continue;
      if (isWhite || isBlack) {

        const viaToken = d.prop.startsWith('--') || /var\(/.test(d.value);
        report(viaToken ? '7b' : '7a', 'FAIL', r.file, d.line, `pure ${isBlack ? '#000' : '#fff'}: ${d.prop}: ${trunc(d.value, 28)} (${r.selector})`, 'Tint the base toward the anchor hue');
      }
    }
  }
}

export function check10(ctx) {
  for (const r of ctx.rules) {
    for (const d of r.decls) {
      if (d.prop === 'transition' && /(^|,)\s*all[\s,]|^all$|^all\s/.test(d.value.trim())) {
        report('10a', 'FAIL', r.file, d.line, `transition: all on ${r.selector}`, 'List the transitioned properties explicitly');
      }
      if (d.prop === 'transition-property' && /\ball\b/.test(d.value)) {
        report('10a', 'FAIL', r.file, d.line, `transition-property: all on ${r.selector}`, 'List the transitioned properties explicitly');
      }
    }
  }
}

export function check11(ctx) {
  const byScale = new Map();
  for (const r of ctx.rules) {
    if (!/:hover/.test(r.selector)) continue;
    for (const d of r.decls) {
      if (d.prop !== 'transform') continue;
      const m = /scale\(\s*([\d.]+)\s*\)/.exec(d.value);
      if (m && parseFloat(m[1]) !== 1) {
        const k = m[1];
        if (!byScale.has(k)) byScale.set(k, []);
        byScale.get(k).push({ sel: r.selector, file: r.file, line: d.line });
      }
    }
  }
  for (const [k, list] of byScale) {
    const distinct = new Set(list.map((x) => x.sel));
    if (distinct.size >= 2) {
      report(11, 'WARN', list[0].file, list[0].line, `hover scale(${k}) on ${distinct.size} selectors`, 'One hover signal per element');
    }
  }
  for (const r of ctx.rules) {
    if (!/:hover/.test(r.selector) || !/(^|[\s>+~,])(img|picture|figure|video)\b|__(img|image|photo|thumb|cover)\b|\.(img|image|photo|thumb|cover)\b/i.test(r.selector)) continue;
    const t = r.decls.find((d) => d.prop === 'transform' && /scale|rotate/.test(d.value));
    if (t) report(11, 'WARN', r.file, t.line, `image transforms on hover (${r.selector})`, 'Imagery sits still; give the container the feedback');
  }
}

export function check12(ctx) {
  const uiSel = /:hover|:active|:focus|\b(btn|button|modal|dialog|tooltip|dropdown|menu|popover|toast|tab|input|select|switch|toggle|accordion)\b/i;
  const playful = ctx.genre === 'playful' || /genre:\s*playful/.test(ctx.stampText || '');
  const declared = playful && /--ease-spring/.test(Object.keys(ctx.tokens).join(' '));
  const springHome = (r) => /primary|cta|press|character|mascot|hero__btn|btn--solid|btn--main/i.test(r.selector);
  const springSels = new Set();
  for (const r of ctx.rules) {
    if (!uiSel.test(r.selector)) continue;
    for (const d of r.decls) {
      if (!/transition|animation/.test(d.prop)) continue;
      if (declared && /var\(--ease-spring\)/.test(d.value) && springHome(r) && (springSels.add(baseSelector(r.selector).split(':')[0]), springSels.size <= 2)) continue;
      const re = /cubic-bezier\(\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\)/g;
      let m;
      while ((m = re.exec(resolveVars(d.value, ctx.tokens)))) {
        const y1 = parseFloat(m[2]), y2 = parseFloat(m[4]);
        if (y1 > 1.05 || y2 > 1.05 || y1 < -0.05 || y2 < -0.05) {
          report(12, 'FAIL', r.file, d.line, `overshoot easing ${m[0]} on ${r.selector}`, 'Use exponential ease-out on UI state changes');
        }
      }
    }
  }
}

export function check10Motion(ctx) {
  const hardRe = /(?<![\w-])(width|height|top|left|right|bottom|inset(?:-[a-z-]+)?|flex-basis|grid-template-columns)(?![\w-])/;
  const softRe = /(?<![\w-])(margin(?:-[a-z]+)?|padding(?:-[a-z]+)?)(?![\w-])/;
  const a11ySel = /skip|sr-only|visually-hidden/i;
  for (const r of ctx.rules) {
    if (a11ySel.test(r.selector)) continue;
    if (r.keyframes) {
      for (const d of r.decls) {
        if (/^(min|max)-/.test(d.prop)) continue;
        if (hardRe.test(d.prop)) {
          report('10a', 'FAIL', r.file, d.line, `@keyframes ${r.keyframes} animates ${d.prop}`, 'Animate transform or opacity instead');
        } else if (softRe.test(d.prop)) {
          report('10b', 'WARN', r.file, d.line, `@keyframes ${r.keyframes} animates ${d.prop}`, 'Animate transform or opacity instead');
        }
      }
      continue;
    }
    for (const d of r.decls) {
      if (d.prop === 'transition' || d.prop === 'transition-property') {
        const hard = hardRe.exec(d.value);
        const soft = softRe.exec(d.value);
        if (hard) {
          report('10a', 'FAIL', r.file, d.line, `transitioning ${hard[1]} on ${r.selector}`, 'Animate transform or opacity instead');
        } else if (soft) {
          report('10b', 'WARN', r.file, d.line, `transitioning ${soft[1]} on ${r.selector}`, 'Animate transform or opacity instead');
        }
      }
    }
  }
}

export function check15(ctx) {
  for (const r of ctx.rules) {
    if (!/:focus(-visible|-within)?\b/.test(r.selector)) continue;
    const withinOnly = !/:focus(-visible)?(?![\w-])/.test(r.selector);
    for (const d of r.decls) {
      if (d.prop === 'transition' && (withinOnly ? /outline|box-shadow|\ball\b/ : /outline|box-shadow|opacity|\ball\b/).test(d.value)) {
        report(15, 'FAIL', r.file, d.line, `focus ring transition on ${r.selector}`, 'Remove the transition; rings appear instantly');
      }
    }
  }
}

export function check17(ctx) {
  const tips = ctx.rules.filter((r) => /tooltip|tip\b/i.test(r.selector));
  const delayed = (r) => r.decls.find((d) => /^transition(-delay)?$/.test(d.prop) && /(\d{3,})ms|([1-9][\d.]*)s\b/.test(d.value));
  const hover = tips.filter((r) => /:hover/.test(r.selector)).map(delayed).find(Boolean);
  const focus = tips.filter((r) => /:focus/.test(r.selector)).map(delayed).find(Boolean);
  if (hover && focus) {
    report(17, 'WARN', tips[0].file, focus.line, 'tooltip focus delay matches hover delay', 'Hover delay 800-1000ms; focus delay 0');
  }
}

export function check18(ctx) {
  const autoish = /carousel|marquee|ticker|rotate|slider|scroll|auto/i;
  const paused = ctx.rules.some((r) => /:hover|:focus|\[data-loop\]/.test(r.selector) && r.decls.some((d) => d.prop === 'animation-play-state' && /paused/.test(d.value)));
  for (const r of ctx.rules) {
    if (r.keyframes || !autoish.test(r.selector)) continue;
    for (const d of r.decls) {
      if (/^animation(-iteration-count)?$/.test(d.prop) && /\binfinite\b/.test(d.value) && !paused) {
        report(18, 'WARN', r.file, d.line, `infinite animation on ${r.selector} with no pause state`, 'Pause on hover and focus');
      }
    }
  }
}

export function check19(ctx) {
  for (const doc of ctx.docs) {
    const t = maskedProse(doc);
    const patterns = [
      [/\b(jane doe|john smith|john doe|example user)\b/i, 'placeholder name'],
      [/\bAcme\b/, 'startup cliche name'],
      [/\bNexus\b/, 'startup cliche name'],
    ];
    const title = (/<title\b[^>]*>([^<]*)<\/title>/i.exec(doc.src) || [])[1] || '';
    for (const [re, label] of patterns) {
      const m = re.exec(t);
      if (!m) continue;
      if (label === 'startup cliche name' && (re.test(title) || (t.match(new RegExp(re.source, 'g')) || []).length >= 3)) continue;
      report(19, 'FAIL', doc.file, doc.lineOf(m.index), `${label}: "${m[0]}"`, 'Use plausible audience-fitting names');
    }
  }
}

export function check20(ctx) {
  if (ctx.tokensOnly) return;
  const stamped = (src) => {
    const lines = src.split('\n').map((l) => l.trim()).filter(Boolean);
    let i = 0;
    while (i < lines.length && /^@charset\b/i.test(lines[i])) i++;
    return i < lines.length && /^\/\*\s*Hallmark/.test(lines[i]);
  };
  let ok = false;
  const cssSources = [];
  for (const f of ctx.cssFiles) cssSources.push(f.raw);
  for (const doc of ctx.docs) for (const s of doc.styles) cssSources.push(s.css);
  for (const s of cssSources) if (stamped(s)) { ok = true; break; }
  const pageCss = ctx.cssFiles.length || ctx.docs.some((d) => d.kind === 'html' && d.styles.length);
  if (!ok && cssSources.length && pageCss) {
    const where = ctx.cssFiles[0]?.file || ctx.docs[0]?.file;
    report(20, 'FAIL', where, 1, 'no Hallmark stamp on the first non-empty line of any CSS', 'The stamp comment is line 1 of the CSS; only @charset may precede it');
  }
}

export function check22(ctx) {
  if (ctx.genre === 'modern-minimal') return;
  const MASK_PROPS = /(^|-)mask(-image|-composite|-mode)?$|^filter$|^backdrop-filter$/;
  for (const r of ctx.rules) {
    for (const d of r.decls) {
      if (MASK_PROPS.test(d.prop)) continue;
      const re = /oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+[\d.]+(?:deg)?\s*(?:\/\s*([\d.]+%?))?\s*\)/g;
      let m;
      while ((m = re.exec(d.value))) {
        const chroma = parseFloat(m[2]);
        const alpha = m[3] ? (m[3].endsWith('%') ? parseFloat(m[3]) / 100 : parseFloat(m[3])) : 1;
        if (chroma === 0 && alpha >= 1) {
          report(22, 'FAIL', r.file, d.line, `zero-chroma ${m[0]} (${d.prop} on ${r.selector})`, 'Give neutrals at least 0.005 chroma');
        }
      }
    }
  }
}

export function check23(ctx) {
  if (ctx.posture === 'drenched') return;
  const ACC = /var\(\s*--color-accent(?:-2)?\s*[,)]/;
  const SURFACE = /(^|[\s,>~+])(body|html|main|section|header|footer|aside)(\b|$)|\bhero\b|__hero|banner|\bstrip\b|\bband\b/i;
  const big = (r) => r.decls.some((d) =>
    (/^(min-)?height$/.test(d.prop) && (parseFloat((/([\d.]+)\s*(vh|dvh|svh)/.exec(d.value) || [])[1] || 0) >= 40 || (pxOf(d.value) ?? 0) >= 320)) ||
    (d.prop === 'inset' && /^0(px)?(\s|$)/.test(d.value.trim())));
  for (const r of ctx.rules) {
    if (isTokenRule(r) || r.keyframes) continue;
    for (const d of r.decls) {
      if (!/^background(-color|-image)?$/.test(d.prop) || !ACC.test(d.value)) continue;
      if (/\/\s*0?\.[0-2]\d*/.test(d.value)) continue;
      if (ctx.genre === 'atmospheric' && /radial-gradient/i.test(d.value)) continue;
      if (SURFACE.test(r.selector) || big(r)) {
        report(23, 'WARN', r.file, d.line,
          `accent background on viewport-scale rule "${trunc(r.selector, 44)}"`,
          'Accent stays <= 5% of a viewport; large fills belong to paper/field tokens or a declared posture in the stamp');
      }
    }
    const col = r.decls.find((d) => d.prop === 'color' && ACC.test(d.value));
    const fsDecl = r.decls.find((d) => d.prop === 'font-size');
    if (col && fsDecl) {
      const rv = resolveVars(fsDecl.value, ctx.tokens);
      const clampMax = /,\s*([^,()]+)\)\s*$/.exec(rv);
      const maxPx = pxOf(rv) ?? (clampMax ? pxOf(clampMax[1].trim()) : null);
      if ((maxPx != null && maxPx >= 48) || /--text-display\b/.test(fsDecl.value)) {
        report(23, 'WARN', r.file, col.line,
          `display-size text set in accent on "${trunc(r.selector, 44)}"`,
          'Accent marks emphasis; set display type in ink and keep accent for small signals');
      }
    }
  }
}

export function check24(ctx) {
  const props = /^(padding|margin|gap|row-gap|column-gap)(-[a-z]+)?$/;
  for (const r of ctx.rules) {
    for (const d of r.decls) {
      if (!props.test(d.prop)) continue;
      const re = /(-?\d+(?:\.\d+)?)px/g;
      let m;
      while ((m = re.exec(d.value))) {
        const v = Math.abs(parseFloat(m[1]));
        if (v > 2 && (v % 4 !== 0 || !Number.isInteger(v))) {
          report('24b', 'FAIL', r.file, d.line, `${d.prop}: ${trunc(d.value, 28)} (off the 4px scale) on ${r.selector}`, 'Use the 4px spacing scale');
        }
      }
    }
  }
}
