/** HTML quality diagnostics; adapted from the original Synapse HTML skill. */
import { baseSelector } from './sloplint-accessibility-checks.mjs';
import {
  firstFamily, isTokenRule, parseColor, pxOf, resolveVars,
  srgbToOklch, trunc,
} from './sloplint-color.mjs';
import { EYEBROW_ANCESTOR_SKIP } from './sloplint-content-checks.mjs';
import { getAttr } from './sloplint-jsx.mjs';
import { braceEnd, clsLits, cutGlued } from './sloplint-markup.mjs';
import { GENERIC_FAMILIES, mergedDeclsBySelector, report } from './sloplint-report.mjs';

export const TAILWIND_HEX = /#(0f172a|1e293b|6366f1|8b5cf6|3b82f6|f8fafc|64748b)\b/i;

export function check65Tailwind(ctx) {
  for (const r of ctx.rules) {
    if (!isTokenRule(r) || r.selector === '@font-face') continue;
    for (const d of r.decls) {
      const m = TAILWIND_HEX.exec(d.value);
      if (m) report(74, 'WARN', r.file, d.line, `default Tailwind palette ${m[0]} on ${d.prop}`, 'Mix the colour for this page in OKLCH; a stock swatch is the AI look');
    }
  }
}

export function splitTop(v) {
  const out = [];
  let depth = 0, cur = '';
  for (const ch of v) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) { out.push(cur); cur = ''; } else cur += ch;
  }
  if (cur.trim()) out.push(cur);
  return out;
}

export const COLOR_RE = /#[0-9a-fA-F]{3,8}\b|oklch\([^)]*\)|rgba?\([^)]*\)|hsla?\([^)]*\)|color-mix\((?:[^()]|\([^()]*\))*\)|\b(white|black|transparent)\b/i;

export const lengthPx = (x) => (x === '0' ? 0 : pxOf(x));

export function check29Glow(ctx) {
  const seen = new Set();
  const once = (key, file, line, ev, fix) => { if (seen.has(key)) return; seen.add(key); report(29, 'WARN', file, line, ev, fix); };
  for (const r of mergedDeclsBySelector(ctx)) {
    if (isTokenRule(r)) continue;
    const local = {};
    for (const d of r.decls) if (d.prop.startsWith('--')) local[d.prop] = d.value;
    const bf = r.decls.find((d) => /^(-webkit-)?backdrop-filter$/.test(d.prop) && /blur\(/i.test(d.value));
    if (bf) {
      const bgD = r.decls.filter((d) => /^background(-color)?$/.test(d.prop)).pop();
      const rv = bgD ? resolveVars(bgD.value, ctx.tokens, local).trim() : '';
      const c = parseColor(rv);
      const mixed = /color-mix\([^)]*\b(white|black|--color-(paper|ink))\b[^)]*\btransparent\b/i.test(rv);
      const nearWhite = c && c.r > 0.85 && c.g > 0.85 && c.b > 0.85;
      const nearBlack = c && c.r < 0.15 && c.g < 0.15 && c.b < 0.15;
      if ((c && c.alpha < 0.95 && (nearWhite || nearBlack)) || (!c && mixed)) {
        once('glass:' + r.selector, r.file, bf.line, `glass panel: backdrop-filter blur over a translucent ${nearBlack ? 'black' : 'white'} on ${trunc(r.selector, 36)}`, 'Solid or grained surface; elevation by lightness');
      }
    }
    for (const d of r.decls) {
      if (d.prop !== 'box-shadow') continue;
      for (const part of splitTop(resolveVars(d.value, ctx.tokens, local))) {
        const cm = COLOR_RE.exec(part);
        if (!cm) continue;
        const c = parseColor(cm[0]);
        if (!c || c.alpha <= 0.05) continue;
        const ok = c.okl || srgbToOklch(c);
        if (ok.C <= 0.04) continue;
        const lens = part.replace(cm[0], ' ').replace(/\binset\b/, ' ').trim().split(/\s+/).filter(Boolean).map(lengthPx);
        if (lens.length >= 3 && lens[0] === 0 && lens[1] === 0 && lens[2] != null && lens[2] > 20) {
          once('glow:' + r.selector, r.file, d.line, `chromatic zero-offset glow (blur ${Math.round(lens[2])}px) on ${trunc(r.selector, 36)}`, 'Shadows carry offset and blur in a neutral; colour is not depth');
          break;
        }
      }
    }
    if (/::(before|after)/.test(r.selector) && r.decls.some((d) => d.prop === 'position' && /absolute|fixed/.test(d.value))) {
      const f = r.decls.find((d) => d.prop === 'filter' && /blur\(\s*(\d+(?:\.\d+)?)px/i.test(d.value));
      const n = f ? parseFloat(/blur\(\s*(\d+(?:\.\d+)?)px/i.exec(f.value)[1]) : 0;
      if (n > 40) once('orb:' + r.selector, r.file, f.line, `blurred orb: filter blur(${n}px) on the positioned ${trunc(r.selector, 36)}`, 'Delete the wash; a surface is paper or ground, not a light show');
    }
  }
}

export function check11Lift(ctx) {
  const lifts = new Map();
  for (const r of mergedDeclsBySelector(ctx)) {
    if (!/:hover/.test(r.selector)) continue;
    const t = r.decls.find((d) => (d.prop === 'transform' && /translateY\(\s*-\s*\d/.test(resolveVars(d.value, ctx.tokens))) || (d.prop === 'translate' && /^0(px)?\s+-\d/.test(resolveVars(d.value, ctx.tokens))));
    const sh = r.decls.find((d) => d.prop === 'box-shadow');
    if (t && sh) for (const part of r.selector.split(',')) lifts.set(baseSelector(part), { r, t });
  }
  if (lifts.size < 3) return;
  const third = [...lifts.values()][2];
  report(11, 'WARN', third.r.file, third.t.line, `the hover lift (translateY plus shadow) on ${lifts.size} selectors (${trunc([...lifts.keys()].slice(0, 3).join(', '), 44)})`, 'One signal per element; the same lift on every card is the template');
}

export function check15Fade(ctx) {
  const focusProps = new Map();
  for (const r of ctx.rules) {
    if (!/:focus-visible/.test(r.selector)) continue;
    for (const part of r.selector.split(',')) {
      if (!/:focus-visible/.test(part)) continue;
      const base = baseSelector(part).replace(/^\*$/, '');
      const set = focusProps.get(base) || new Set();
      for (const d of r.decls) {
        if (d.prop === 'box-shadow') set.add('box-shadow');
        if (d.prop.startsWith('outline')) set.add('outline');
      }
      focusProps.set(base, set);
    }
  }
  if (!focusProps.size) return;
  const global = focusProps.get('') || new Set();
  for (const r of ctx.rules) {
    if (r.keyframes || /:focus|:hover|:active/.test(r.selector)) continue;
    for (const d of r.decls) {
      if (d.prop !== 'transition' && d.prop !== 'transition-property') continue;
      for (const prop of ['box-shadow', 'outline']) {
        if (!new RegExp(`(^|[\\s,])${prop}(-[a-z]+)?\\b`).test(d.value)) continue;
        const own = r.selector.split(',').some((p) => (focusProps.get(baseSelector(p)) || new Set()).has(prop));
        if (global.has(prop) || own) {
          report(15, 'FAIL', r.file, d.line, `${trunc(r.selector, 32)} transitions ${prop} while :focus-visible sets it (the ring fades in)`, 'Rings appear instantly: transition the hover property only, or draw the ring with a property that is not transitioned');
          break;
        }
      }
    }
  }
}

export function checkF7Pills(ctx) {
  const CONTROLISH = /btn|button|cta|input|select|textarea|switch|toggle|control|chip|pill|tag|badge|status/i;
  const sels = new Set();
  let where = null;
  for (const r of mergedDeclsBySelector(ctx)) {
    if (isTokenRule(r)) continue;
    const d = r.decls.filter((x) => x.prop === 'border-radius').pop();
    if (!d) continue;
    if (!/^(9999px|999px|50rem)$/.test(resolveVars(d.value, ctx.tokens).trim())) continue;
    for (const part of r.selector.split(',')) {
      const b = baseSelector(part);
      if (!b || CONTROLISH.test(b)) continue;
      sels.add(b);
      where = where || { r, d };
    }
  }
  if (sels.size >= 5) report('F7', 'WARN', where.r.file, where.d.line, `the pill radius on ${sels.size} non-control selectors (${trunc([...sels].slice(0, 4).join(', '), 48)})`, 'Pills are for controls; boxes and media take the card radius');
}

export const TW_SIZE = { xs: 12, sm: 14, base: 16, lg: 18, xl: 20, '2xl': 24, '3xl': 30, '4xl': 36, '5xl': 48, '6xl': 60, '7xl': 72, '8xl': 96, '9xl': 128 };

export const TW_TRACK = { tighter: -0.05, tight: -0.025, normal: 0, wide: 0.025, wider: 0.05, widest: 0.1 };

export const TW_HUE = { red: 25, orange: 47, amber: 70, yellow: 86, lime: 131, green: 150, emerald: 163, teal: 183, cyan: 215, sky: 237, blue: 260, indigo: 277, violet: 293, purple: 304, fuchsia: 322, pink: 354, rose: 16 };

export const TW_COLOURS = 'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose';

export const TW_PAL = new RegExp(`^(?:bg|text|border(?:-[xytrblse])?|ring(?:-offset)?|outline|decoration|divide|from|via|to|fill|stroke|shadow|accent|caret|placeholder|inset-shadow|inset-ring|drop-shadow)-(?:${TW_COLOURS})-(?:50|[1-9]00|950)(?:\\/(?:\\d{1,3}|\\[[^\\]]*\\]))?$`);

export const TW_SHADE = new RegExp(`^(${TW_COLOURS})-(?:50|[1-9]00|950)(?:\\/\\S*)?$`);

export const TW_ACCENT = /^text-(?:red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:500|600|700)(?:\/\S*)?$/;

export const TW_PURPLE = /^(?:purple|violet|fuchsia|indigo)$/;

export const TW_BLUE = /^(?:blue|sky|cyan|indigo)$/;

export const TW_PINK = /^(?:pink|rose)$/;

export const TW_GREY = /^(?:slate|gray|zinc|neutral|stone)$/;

export const TW_NONFILL = /^bg-(?:none|transparent|inherit|current|fixed|local|scroll|cover|contain|auto|center|top|bottom|left|right|no-repeat|repeat(?:-[\w-]+)?|(?:left|right|top|bottom)-(?:top|bottom|left|right)|clip-[\w-]+|origin-[\w-]+|blend-[\w-]+|gradient-to-[\w-]+|(?:linear|radial|conic)(?:-.*)?|size-.*|position-.*|\[(?:url|length|position|size|image|(?:repeating-)?(?:linear|radial|conic)-gradient)[^\]]*\].*)$/;

export const TW_GLASS = /^bg-(?:white|black|(?:slate|gray|zinc|neutral|stone)-(?:50|100|900|950)|paper|ink|background|foreground)\/(\d{1,2}|\[(?:0?\.\d+|\d{1,2}%)\])$/;

export const TW_MONO = /mono|courier|jetbrains|plex mono|geist mono|commit|fira code|space mono|dm mono|roboto mono|source code|silkscreen/i;

export const TW_LOGO = /logo|brand|wordmark/i;

export const TW_ROOT = { size: null, em: null, upper: false, caps: false, noLabel: false, code: false, eyeSkip: false, inOl: false, logo: false, logoSelf: false };

export const TW_PARSED = new Map();

export function twParse(tok) {
  let p = TW_PARSED.get(tok);
  if (p) return p;
  const variants = [];
  let depth = 0, cur = '';
  for (const ch of tok) {
    if (ch === '[' || ch === '(') depth++;
    else if ((ch === ']' || ch === ')') && depth > 0) depth--;
    if (ch === ':' && depth === 0) { variants.push(cur); cur = ''; } else cur += ch;
  }
  let base = cur;
  if (base.startsWith('!')) base = base.slice(1);
  if (base.endsWith('!')) base = base.slice(0, -1);
  const neg = base.length > 1 && base.startsWith('-');
  if (neg) base = base.slice(1);
  p = { variants: variants.map((v) => v.replace(/^(?:group|peer)-/, '').replace(/\/[\w-]+$/, '')), base, neg };
  TW_PARSED.set(tok, p);
  return p;
}

export const twTokens = (ctx) => ctx.twTok || ctx.tokens;

export const twValue = (tok, v) => resolveVars(v, tok).trim().replace(/^(-?)\./, '$10.');

export function twSize(ctx, b) {
  const tok = twTokens(ctx);
  let m = /^text-(xs|sm|base|lg|[2-9]?xl)(?:\/\S+)?$/.exec(b);
  if (m) return TW_SIZE[m[1]];
  m = /^text-(?:\[(?:length:)?([^\]]+)\]|\((?:length:)?(--[\w-]+)\))(?:\/\S+)?$/.exec(b);
  let v = m ? (m[1] ? m[1].replace(/_/g, ' ') : `var(${m[2]})`) : null;
  if (!m) {
    m = /^text-([a-z][\w-]*?)(?:\/\S+)?$/.exec(b);
    v = m && tok[`--text-${m[1]}`];
  }
  if (!v) return null;
  const r = twValue(tok, v);
  const cl = /^clamp\(\s*([^,]+),/.exec(r);
  return pxOf(cl ? twValue(tok, cl[1]) : r);
}

export function twTrack(ctx, b, neg) {
  const tok = twTokens(ctx);
  let m = /^tracking-(tighter|tight|normal|wide|wider|widest)$/.exec(b);
  let v = null;
  if (m) v = `${TW_TRACK[m[1]]}em`;
  else if ((m = /^tracking-(?:\[([^\]]+)\]|\((--[\w-]+)\))$/.exec(b))) v = m[1] ? m[1].replace(/_/g, ' ') : `var(${m[2]})`;
  else if ((m = /^tracking-([a-z][\w-]*)$/.exec(b)) && tok[`--tracking-${m[1]}`]) v = tok[`--tracking-${m[1]}`];
  if (v == null) return null;
  const r = twValue(tok, v);
  const e = /^(-?\d*\.?\d+)em$/.exec(r);
  const px = e ? null : pxOf(r);
  if (!e && px == null) return null;
  const out = e ? parseFloat(e[1]) : px;
  return e ? { em: neg ? -out : out } : { px: neg ? -out : out };
}

export const twHue = (c) => {
  if (!c || c.alpha <= 0.05) return null;
  const ok = c.okl || srgbToOklch(c);
  return ok.C > 0.04 ? ok.H : null;
};

export function twStop(ctx, v, tok) {
  if (/^\[?-?\d*\.?\d+%\]?$/.test(v)) return null;
  const tokens = twTokens(ctx);
  const pm = TW_SHADE.exec(v);
  if (pm) return { tok, kind: 'palette', pal: pm[1], hue: TW_GREY.test(pm[1]) ? null : TW_HUE[pm[1]] };
  if (/^(?:white|black|transparent|current|inherit)(?:\/\S*)?$/.test(v)) return { tok, kind: 'plain', hue: null };
  if (v.startsWith('(')) return { tok, kind: 'token', hue: twHue(parseColor(twValue(tokens, `var${v.replace(/\/\S*$/, '').replace(/^\((?:color:)?/, '(')}`))) };
  if (v.startsWith('[')) {
    const inner = v.slice(1, v.lastIndexOf(']')).replace(/_/g, ' ');
    return { tok, kind: /var\(/.test(inner) ? 'token' : 'literal', hue: twHue(parseColor(twValue(tokens, inner))) };
  }
  const tv = tokens[`--color-${v.replace(/\/\S*$/, '')}`];
  return { tok, kind: 'token', hue: tv ? twHue(parseColor(twValue(tokens, tv))) : null };
}

export function twFamily(v) {
  if (/var\(/.test(v)) return null;
  const named = v.replace(/^family-name:/, '');
  if (named === v && !/^['"]/.test(v) && /^(?:\d|weight:|number:)/.test(v)) return null;
  const fam = firstFamily(named.replace(/_/g, ' '));
  return !fam || GENERIC_FAMILIES.has(fam) ? null : fam;
}

export function twLiterals(b, tok, f) {
  for (const m of b.matchAll(/\[([^\]]+)\]/g)) {
    const v = m[1].replace(/url\([^)]*\)/gi, ' ').replace(/_/g, ' ');
    const fam = /^font-family:(.+)$/.exec(v);
    if (fam && !/var\(/.test(fam[1]) && !GENERIC_FAMILIES.has(firstFamily(fam[1]))) f.font = f.font || tok;
    for (const c of v.matchAll(TW_COLOR_LIT)) {
      const col = parseColor(c[0]);
      if (col && col.alpha > 0) f.colours.push({ tok, oklch: /^oklch/i.test(c[0]) });
    }
  }
}

export const TW_COLOR_LIT = /#[0-9a-fA-F]{3,8}\b|oklch\([^)]*\)|rgba?\([^)]*\)|hsla?\([^)]*\)/g;

export function twInfo(ctx, toks, tw) {
  const f = {
    upper: false, normalCase: false, caps: false, size: null, em: null, mono: false, accent: null,
    tAll: null, bounce: null, overshoot: null, hScale: null, hRotate: null, grad: false, stops: [], clip: false, clear: false,
    bblur: null, glass: null, blur: 0, blurTok: null, pos: null, fill: false, shadows: [], shadowCol: null, vh: null,
    oxHidden: null, oxClip: false, colours: [], font: null, pal: [], rounded: false, cols3: false, animate: null,
    transform: false, transition: false, caret: false, scrollbar: false, hero: false, padded: false,
  };
  let sizeV = null;
  const tracks = [];
  for (const tok of toks) {
    if (tok.includes('__')) continue;
    const p = twParse(tok);
    const b = p.base;
    if (!b) continue;
    const plain = !p.variants.length;
    for (const v of p.variants) tw.variants.add(v);
    const hover = p.variants.includes('hover');
    if (TW_PAL.test(b)) f.pal.push(b.replace(/\/.*$/, ''));
    if (b.includes('[')) twLiterals(b, tok, f);
    if (/hero/i.test(b)) f.hero = true;
    if (b === 'uppercase') { f.upper = true; continue; }
    if (b === 'normal-case') { if (plain) f.normalCase = true; continue; }
    if (b === 'small-caps' || /^\[font-variant(?:-caps)?:[^\]]*(?:small|petite)-caps/.test(b) || /^\[font-feature-settings:[^\]]*(?:smcp|c2sc)/.test(b)) { f.caps = true; continue; }
    if (b.startsWith('text-')) {
      const px = twSize(ctx, b);
      if (px != null) {
        if (plain) f.size = px; else sizeV = sizeV == null ? px : Math.min(sizeV, px);
        continue;
      }
      if (b === 'text-transparent') { f.clear = true; continue; }
      if (TW_ACCENT.test(b)) f.accent = f.accent || tok;
      continue;
    }
    if (b.startsWith('tracking-')) {
      const r = twTrack(ctx, b, p.neg);
      if (r) tracks.push({ r, plain });
      continue;
    }
    if (b === 'font-mono') { f.mono = true; continue; }
    if (b.startsWith('font-')) {
      const arb = /^font-\[(.+)\]$/.exec(b);
      const fam = arb ? twFamily(arb[1]) : null;
      if (fam) { f.font = f.font || tok; if (TW_MONO.test(fam)) f.mono = true; }
      const named = !arb && /^font-([a-z][\w-]*)$/.exec(b);
      const tv = named && twTokens(ctx)[`--font-${named[1]}`];
      if (tv && /mono|courier|code/i.test(firstFamily(resolveVars(tv, twTokens(ctx))))) f.mono = true;
      continue;
    }
    if (b === 'transition-all' || /^transition-\[[^\]]*\b(?:all|width|height|top|left|right|bottom|inset)\b/.test(b) || /^\[transition(?:-property)?:[^\]]*\b(?:all|width|height|top|left)\b/.test(b)) {
      f.tAll = f.tAll || tok; f.transition = true;
      continue;
    }
    if (/^transition(?:-transform)?$/.test(b)) { f.transition = true; if (b !== 'transition') f.transform = true; continue; }
    if (b.startsWith('animate-')) {
      if (b !== 'animate-none') f.animate = f.animate || tok;
      if (b === 'animate-bounce') f.bounce = f.bounce || tok;
      continue;
    }
    const ez = /^ease-\[cubic-bezier\(([^)]*)\)\]$/.exec(b);
    if (ez) {
      const n = ez[1].split(/[,_\s]+/).filter(Boolean).map(Number);
      if (n.length === 4 && [n[1], n[3]].some((y) => y > 1.05 || y < -0.05)) f.overshoot = f.overshoot || tok;
      continue;
    }
    if (/^(?:scale|translate|rotate|skew)-/.test(b)) {
      f.transform = true;
      if (hover && b.startsWith('scale-') && !/^scale-(?:[xy]-)?100$/.test(b)) f.hScale = f.hScale || tok;
      if (hover && b.startsWith('rotate-') && b !== 'rotate-0') f.hRotate = f.hRotate || tok;
      continue;
    }
    if (/^bg-(?:gradient-to-|linear-|radial|conic)|^bg-\[(?:repeating-)?(?:linear|radial|conic)-gradient/.test(b) || /^\[background(?:-image)?:[^\]]*gradient\(/.test(b)) f.grad = true;
    const st = /^(?:from|via|to)-(.+)$/.exec(b);
    if (st) { const s = twStop(ctx, st[1], tok); if (s) f.stops.push(s); continue; }
    if (b === 'bg-clip-text' || /^\[(?:-webkit-)?background-clip:text\]$/.test(b)) { f.clip = true; continue; }
    if (b === '[-webkit-text-fill-color:transparent]') { f.clear = true; continue; }
    if (/^backdrop-blur(?:-|$)/.test(b) || /^\[(?:-webkit-)?backdrop-filter:[^\]]*blur/.test(b)) { f.bblur = f.bblur || tok; continue; }
    const bl = /^blur-(?:(2xl|3xl)|\[(\d*\.?\d+)(px|rem)\])$/.exec(b);
    if (bl) {
      const px = bl[1] ? (bl[1] === '2xl' ? 40 : 64) : parseFloat(bl[2]) * (bl[3] === 'rem' ? 16 : 1);
      if (px > f.blur) { f.blur = px; f.blurTok = tok; }
      continue;
    }
    if (b === 'absolute' || b === 'fixed') { f.pos = f.pos || b; continue; }
    if (b.startsWith('bg-')) {
      const gm = TW_GLASS.exec(b);
      if (gm) {
        const v = gm[1].replace(/^\[|\]$/g, '');
        const a = v.endsWith('%') ? parseFloat(v) / 100 : v.includes('.') ? parseFloat(v) : parseFloat(v) / 100;
        if (a < 0.95) f.glass = f.glass || tok;
      }
      if (!TW_NONFILL.test(b)) f.fill = true;
      continue;
    }
    if (b.startsWith('shadow-')) {
      const sm = /^shadow-\[(.+)\]$/.exec(b);
      if (sm) f.shadows.push({ v: sm[1], tok });
      else if (!/^shadow-(?:2xs|xs|sm|md|lg|xl|2xl|inner|none)$/.test(b)) f.shadowCol = f.shadowCol || b.slice(7);
      continue;
    }
    if (/^(?:min-)?h-(?:screen|\[[^\]]*\d\s*vh[^\]]*\])$/.test(b)) { f.vh = f.vh || tok; continue; }
    if (b === 'overflow-x-hidden') { f.oxHidden = f.oxHidden || tok; continue; }
    if (b === 'overflow-x-clip' || b === 'overflow-clip') { f.oxClip = true; continue; }
    if (/^rounded(?:-|$)/.test(b)) { if (b !== 'rounded-none') f.rounded = true; continue; }
    if (b === 'grid-cols-3') { f.cols3 = true; continue; }
    if (/^p[xytrblse]?-/.test(b)) { f.padded = true; continue; }
    if (b.startsWith('caret-')) { f.caret = true; continue; }
    if (b.startsWith('scrollbar') || b.startsWith('[scrollbar-')) f.scrollbar = true;
  }
  if (f.size == null) f.size = sizeV;
  let emV = null;
  for (const { r, plain } of tracks) {
    const em = r.em != null ? r.em : r.px / (f.size || 16);
    if (plain) f.em = em; else emV = emV == null ? em : Math.max(emV, em);
  }
  if (f.em == null) f.em = emV;
  return f;
}

export const TW_CLASS_ATTR = /(?:^|\s)(class|className|:class|v-bind:class|x-bind:class|class:list)\s*=\s*/g;

export function twInterp(val) {
  const parts = [];
  let i = 0, seg = '', after = false;
  while (i < val.length) {
    if (val[i] === '{') {
      parts.push(cutGlued(seg, after, true));
      const e = braceEnd(val, i);
      parts.push(clsLits(val.slice(i + 1, e)).join(' '));
      i = e + 1; seg = ''; after = true;
      continue;
    }
    seg += val[i++];
  }
  parts.push(cutGlued(seg, after, false));
  return parts.join(' ').split(/\s+/).filter(Boolean);
}

export function twTokensOf(doc, t) {
  if (doc.classAt) return doc.classAt.get(t.pos) || [];
  const tag = (doc.raw || doc.src).slice(t.pos, t.end);
  if (!tag.includes('class')) return [];
  const out = [];
  for (const m of tag.matchAll(TW_CLASS_ATTR)) {
    const i = m.index + m[0].length;
    const q = tag[i];
    let val, dyn = m[1] !== 'class' && m[1] !== 'className';
    if (q === '"' || q === "'") { const e = tag.indexOf(q, i + 1); val = tag.slice(i + 1, e < 0 ? tag.length : e); }
    else if (q === '{') { val = tag.slice(i + 1, braceEnd(tag, i)); dyn = true; }
    else val = (/^[^\s>]*/.exec(tag.slice(i)) || [''])[0];
    if (dyn) out.push(...clsLits(val));
    else if (val.includes('{')) out.push(...twInterp(val));
    else out.push(...val.split(/\s+/));
  }
  for (const d of tag.matchAll(/(?:^|\s)class:(?!list\b)([\w-]+)/g)) out.push(d[1]);
  return out.filter(Boolean);
}

export function twFrame(parent, t, f, toks) {
  const logo = toks.some((x) => TW_LOGO.test(x)) || TW_LOGO.test(getAttr(t.attrs, 'aria-label') || '');
  return {
    size: f && f.size != null ? f.size : parent.size,
    em: f && f.em != null ? f.em : parent.em,
    upper: f ? f.upper || (!f.normalCase && parent.upper) : parent.upper,
    caps: (f && f.caps) || parent.caps,
    noLabel: parent.noLabel || /^(?:svg|pre|code|abbr|kbd|samp)$/.test(t.name),
    code: parent.code || /^(?:pre|code|kbd|samp)$/.test(t.name),
    eyeSkip: parent.eyeSkip || EYEBROW_ANCESTOR_SKIP.test(t.name),
    inOl: parent.inOl || t.name === 'ol',
    logo: parent.logo || (t.name === 'a' && logo),
    logoSelf: logo,
  };
}
