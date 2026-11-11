/** HTML quality diagnostics; adapted from the original Synapse HTML skill. */
import { baseSelector, fontSizePxOf, maskedProse } from './sloplint-accessibility-checks.mjs';
import { innerOf, isTokenRule, plainText, resolveVars, trunc } from './sloplint-color.mjs';
import { capsRatio } from './sloplint-content-checks.mjs';
import { ancestorMap, getAttr } from './sloplint-jsx.mjs';
import {
  HEADING_SEL, declValue, fontPxOf, mergedDeclsBySelector, report,
  styleFor, trackingEmOf,
} from './sloplint-report.mjs';

export const LABEL67 = /label|caption|meta|eyebrow|kicker|tag\b|badge|chip|small|folio|footnote|legend|\bth\b|thead|figcaption|overline|dateline|byline|credit|note\b|\bnav\b|menu|link|pill|status|unit|smallcaps|count|placard/i;

export const CONTROL67 = /btn|button|cta|\.sign\b|plate|control/i;

export const EXEMPT67_NAME = /^(wordmark|marquee|ticker|logo|brand|abbr|logo-?(mark|type|text)|brand-?(mark|name|type))$/i;

export const EXEMPT67_PART = /(^|[-_])(wordmark|marquee|ticker|logotype|logo|brand)([-_]|$)|(^|[-_])(slab|nav|site|head|header|masthead|bar)[-_]+mark([-_]|$)/i;

export const exemptName67 = (n) => !!n && (EXEMPT67_NAME.test(n.split('--')[0].split('__').pop()) || EXEMPT67_PART.test(n));

export const SCROLLER67 = /(^|[-_])(marquee|ticker)([-_]|$)/i;

export function exempt67(sel) {
  return sel.split(',').some((part) => {
    const comps = baseSelector(part).split(/[\s>+~]+/).filter(Boolean);
    const comp = comps[comps.length - 1] || '';
    const names = (comp.match(/\.[a-zA-Z_][\w-]*/g) || []).map((c) => c.slice(1));
    names.push((/^[a-zA-Z][\w-]*/.exec(comp) || [''])[0]);
    if (names.some(exemptName67)) return true;
    return comps.slice(0, -1).some((c) => (c.match(/\.[a-zA-Z_][\w-]*/g) || []).some((x) => SCROLLER67.test(x.slice(1))));
  });
}

export function inherited67(bySel, sel, prop) {
  const base = baseSelector(sel);
  let best = null, bestLen = 0;
  for (const o of bySel) {
    if (/:hover|:focus|:active/.test(o.selector) || (o.media && /max-width/i.test(o.media))) continue;
    for (const part of o.selector.split(',')) {
      const ob = baseSelector(part);
      if (!ob || ob === base || ob.length <= bestLen || !base.startsWith(ob) || !/[\s>+~]/.test(base[ob.length] || '')) continue;
      const d = o.decls.filter((x) => x.prop === prop).pop();
      if (d) { best = d.value; bestLen = ob.length; }
    }
  }
  return best;
}

export const isSmallCaps67 = (prop, v) => (/^font-variant(-caps)?$/.test(prop) && /\b(all-)?(small|petite)-caps\b/.test(v))
  || (prop === 'font-feature-settings' && /\b(smcp|c2sc)\b/.test(v));

export function check67(ctx) {
  const bySel = mergedDeclsBySelector(ctx);
  const displayish = (r) => HEADING_SEL.test(r.selector) || /display|title|headline|bill|poster|banner/i.test(r.selector) || r.decls.some((d) => (d.prop === 'font-family' || d.prop === 'font') && /--font-display/.test(d.value)) || (fontSizePxOf(r, ctx) || 0) >= 28;
  const upperDisplay = bySel.some((r) => displayish(r) && !LABEL67.test(r.selector) && r.decls.some((d) => d.prop === 'text-transform' && /uppercase/.test(d.value)));
  const isUpper = (v) => v != null && /uppercase/.test(resolveVars(v, ctx.tokens));
  const seen = new Set();
  for (const r of bySel) {
    if (isTokenRule(r) || exempt67(r.selector) || /::first-letter\s*(,|$)/.test(r.selector)) continue;
    const ownTT = r.decls.filter((d) => d.prop === 'text-transform').pop();
    const ownUpper = ownTT ? isUpper(ownTT.value) : null;
    const ownSmallCaps = r.decls.some((d) => isSmallCaps67(d.prop, resolveVars(d.value, ctx.tokens)));
    const px = fontSizePxOf(r, ctx);
    const ownEm = trackingEmOf(ctx, r.decls, px || 16);
    const ownSignal = ownUpper === true || ownSmallCaps || (ownEm != null && ownEm > 0.03);
    if (!ownSignal) continue;
    const upper = ownUpper != null ? ownUpper : isUpper(inherited67(bySel, r.selector, 'text-transform'));
    const smallCaps = ownSmallCaps || ['font-variant', 'font-variant-caps', 'font-feature-settings'].some((prop) => {
      const v = inherited67(bySel, r.selector, prop);
      return v != null && isSmallCaps67(prop, resolveVars(v, ctx.tokens));
    });
    let em = ownEm;
    if (em == null) {
      const v = inherited67(bySel, r.selector, 'letter-spacing');
      if (v != null) em = trackingEmOf(ctx, [{ prop: 'letter-spacing', value: v }], px || 16);
    }
    const tracked = em != null && em > 0.03;
    const subject = r.selector.split(',').map((p) => baseSelector(p).split(/[\s>+~]+/).filter(Boolean).pop() || '');
    const bigToken = r.decls.some((d) => d.prop === 'font-size' && /--text-(display|section|title)|clamp\(\s*(?:[2-9]|\d{2,})(?:\.\d+)?rem/.test(d.value));
    const labelish = subject.some((s) => LABEL67.test(s)) ? !((px != null && px >= 28) || bigToken)
      : LABEL67.test(r.selector) && !subject.every((s) => /^h[1-6]\b/i.test(s)) && (px == null || px < 20);
    const control = CONTROL67.test(r.selector);
    const heading = HEADING_SEL.test(r.selector) && !labelish;
    if (heading && !control) continue;
    const key = baseSelector(r.selector);
    if (seen.has(key)) continue;
    const small = px != null && px <= 15;
    if (control && !labelish) {
      if (!upper && !smallCaps) { if (!(tracked && small)) continue; }
      else if (upperDisplay && (em == null || em <= 0.045)) continue;
      seen.add(key);
      report(67, 'FAIL', r.file, r.line, upperDisplay ? `${r.selector}: uppercase control tracked ${em}em` : `${r.selector}: uppercase control on a page whose display is not uppercase`, 'Controls follow the display voice: sentence case here, or tracking 0.04em at most where the display itself is uppercase');
      continue;
    }
    const caps = upper || smallCaps;
    if ((caps && (labelish || smallCaps || tracked || small)) || (tracked && (labelish || small))) {
      seen.add(key);
      const what = smallCaps ? 'small caps' : upper ? 'uppercase' : 'letter-spaced';
      report(67, 'FAIL', r.file, r.line, `${r.selector}: ${what}${tracked ? ` tracked ${em}em` : ''}${px != null ? ` at ${Math.round(px)}px` : ''} in a label role`, 'Labels, captions, table heads, nav links and meta are the body face (or the theme\'s label face), a step smaller, sentence case, untracked');
    }
  }
  check67Html(ctx);
}

export const CAPS_TAGS = /^(p|span|small|a|li|div|figcaption|td|th|dt|dd|label|time|cite|strong|b|em|button|summary)$/;

export function check67Html(ctx) {
  for (const doc of ctx.docs) {
    const anc = ancestorMap(doc);
    const seen = new Set();
    for (let i = 0; i < doc.tags.length; i++) {
      const t = doc.tags[i];
      if (t.close || t.selfClosing || !CAPS_TAGS.test(t.name)) continue;
      const cls = getAttr(t.attrs, 'class') || '';
      if (cls.split(/\s+/).some(exemptName67)) continue;
      if ((anc.get(i) || []).some((n) => /^(svg|pre|code|abbr|kbd|samp)$/.test(n))) continue;
      const inner = innerOf(doc, i);
      if (!inner || /<(p|div|ul|ol|h[1-6]|table|section|article|svg|img|abbr|code|kbd)\b/i.test(inner.inner)) continue;
      const text = plainText(inner.inner);
      const letters = text.replace(/[^A-Za-z]/g, '');
      if (letters.length < 5 || capsRatio(text) < 0.95 || /^[A-Z]{2,5}$/.test(text) || /^\(?\s*(CC0|CC BY(-SA|-NC|-ND)*( [0-9.]+)?|PD|GFDL)\b/.test(text)) continue;
      const decls = styleFor(ctx, cls, t.name);
      const px = fontPxOf(ctx, decls);
      const em = trackingEmOf(ctx, decls, px || 16);
      const tracked = em != null && em > 0.03;
      if (!((px != null && px <= 15) || tracked)) continue;
      const key = cls || t.name;
      if (seen.has(key)) continue;
      seen.add(key);
      report(67, 'FAIL', doc.file, t.line, `"${trunc(text, 32)}" typed in capitals${px != null ? ` at ${Math.round(px)}px` : ''}${tracked ? ` tracked ${em}em` : ''} (<${t.name}${cls ? ` class="${trunc(cls, 24)}"` : ''}>)`, 'Sentence case in the body face; capitals survive only as a wordmark or as the display voice');
    }
  }
}

export const ACCENT38 = /(?:^|[\s,])((?:h[1-3]|\.display|\.headline|\.title|[.\w-]*__(?:title|display|headline))[^\s,>+~]*)\s*(?:>|\s)\s*(em|i|b|strong|span|mark|\.[\w-]+)(?::nth-child\([^)]*\))?(?:::?[\w-]+)?\s*$/i;

export const INHERITED38 = /^(inherit|currentcolor|unset|initial|normal)$/i;

export function accentedHeads(ctx) {
  if (ctx._acc38) return ctx._acc38;
  const out = [];
  const seen = new Set();
  for (const r of ctx.rules) {
    if (r.keyframes || isTokenRule(r)) continue;
    const m = ACCENT38.exec(r.selector);
    if (!m) continue;
    const marked = r.decls.some((d) =>
      (/^(color|background|background-color|-webkit-text-stroke|font-weight|text-decoration|text-decoration-color|border-bottom|box-shadow)$/.test(d.prop) && !INHERITED38.test(d.value.trim()))
      || (d.prop === 'font-style' && !INHERITED38.test(d.value.trim())));
    if (!marked || seen.has(r.selector)) continue;
    seen.add(r.selector);
    out.push({ r, head: m[1] });
  }
  const marks = (r) => r.decls.some((d) => (/^(color|background|background-color|-webkit-text-stroke|font-weight|text-decoration|text-decoration-color|border-bottom|box-shadow|font-style)$/.test(d.prop) && !INHERITED38.test(d.value.trim())));
  for (const doc of ctx.docs) {
    for (let i = 0; i < doc.tags.length; i++) {
      const t = doc.tags[i];
      if (t.close || !/^h[1-3]$/.test(t.name)) continue;
      const inner = innerOf(doc, i);
      if (!inner) continue;
      const headLen = plainText(inner.inner).replace(/\s+/g, '').length || 1;
      const spans = [...inner.inner.matchAll(/<(span|em|strong|b|i|mark)\b[^>]*\bclass\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/\1>/gi)];
      const cover = (cls) => spans.filter((x) => x[2].split(/\s+/).includes(cls)).reduce((n, x) => n + plainText(x[3]).replace(/\s+/g, '').length, 0) / headLen;
      for (const m of spans) {
        if (!/[A-Za-z0-9]/.test(plainText(m[3]))) continue;
        for (const cls of m[2].split(/\s+/).filter(Boolean)) {
          if (cover(cls) >= 0.8) continue;
          for (const r of ctx.rules) {
            if (r.keyframes || isTokenRule(r) || seen.has(r.selector)) continue;
            if (!r.selector.split(',').some((part) => !/::?(before|after)\b/.test(part) && baseSelector(part).trim() === `.${cls}`)) continue;
            if (r.decls.some((d) => (d.prop === 'display' && /^(block|flex|grid|table)/.test(d.value.trim())) || (d.prop === 'position' && /absolute|fixed/.test(d.value)))) continue;
            if (!marks(r)) continue;
            const headDecls = styleFor(ctx, getAttr(t.attrs, 'class'), t.name, true);
            const norm = (v) => String(v || '').replace(/\s+/g, ' ').trim().toLowerCase();
            const own = (prop) => declValue(ctx, headDecls, prop) ?? (prop === 'color' ? resolveVars('var(--color-ink)', ctx.tokens) : null);
            const marking = r.decls.filter((d) => /^(color|background|background-color|-webkit-text-stroke|font-weight|text-decoration|text-decoration-color|border-bottom|box-shadow|font-style)$/.test(d.prop) && !INHERITED38.test(d.value.trim()));
            if (marking.length && marking.every((d) => /^(color|font-weight)$/.test(d.prop) && own(d.prop) != null && norm(resolveVars(d.value, ctx.tokens)) === norm(own(d.prop)))) continue;
            seen.add(r.selector);
            out.push({ r, head: t.name });
          }
        }
      }
    }
  }
  ctx._acc38 = out;
  return out;
}

export function accentedWordInHero(ctx) {
  const heads = accentedHeads(ctx);
  if (!heads.length) return true;
  const sels = new Set(heads.map((h) => baseSelector(h.r.selector)));
  if (sels.size > 1) return `the accented word sits on ${sels.size} selectors (${trunc([...sels].join(', '), 48)}); the signature appears once`;
  const { r, head } = heads[0];
  if (/hero/i.test(r.selector) || /^h1\b/i.test(head)) return true;
  const cls = (/\.([\w-]+)/.exec(head) || [])[1];
  if (!cls || !ctx.docs.length) return true;
  let count = 0, aboveFirstH2 = false;
  for (const doc of ctx.docs) {
    let h2Seen = false;
    for (const t of doc.tags) {
      if (t.close) continue;
      if (t.name === 'h2') h2Seen = true;
      if ((getAttr(t.attrs, 'class') || '').split(/\s+/).includes(cls)) { count++; if (!h2Seen) aboveFirstH2 = true; }
    }
  }
  if (count === 1 && aboveFirstH2) return true;
  return count !== 1 ? `.${cls} appears ${count} times in the markup; the signature appears once, in the hero` : `.${cls} sits below the first h2, outside the hero`;
}

export function check38c(ctx) {
  for (const { r } of accentedHeads(ctx)) {
    report('38iii', 'FAIL', r.file, r.line, `accented word inside a heading (${r.selector})`, 'Set the whole head one way: a line break, a second line at a second size, or the whole head in the accent. Guard: the theme names the coloured word as its signature and it appears once on the page, in the hero');
  }
}

export function heroIndexOf(doc, h1Idx) {
  for (let i = h1Idx - 1; i >= 0; i--) {
    const t = doc.tags[i];
    if (t.close || !/^(section|header)$/.test(t.name)) continue;
    const inner = innerOf(doc, i);
    if (inner && inner.endPos > doc.tags[h1Idx].pos) return i;
  }
  return -1;
}

export const wordsOf = (t) => plainText(t).split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w));

export const TELLS19 = [
  [/\bwhether you'?re\b/i, 'filler opener'],
  [/\bwe'?ve got you covered\b/i, 'cliche'],
  [/\bsay goodbye to\b/i, 'cliche'],
  [/\bno credit card required\b/i, 'template line'],
  [/\beverything you need to\b/i, 'cliche'],
  [/\ball in one place\b/i, 'cliche'],
  [/\blorem ipsum\b/i, 'placeholder text'],
  [/\ball rights reserved\b/i, 'template footer line'],
  [/\bmade with\s*(?:♥|❤|\u{1f9e1}|\u{1f49b}|\u{1f49a}|\u{1f499}|\u{1f49c}|\u{1f5a4}|\u{1f90d}|&hearts;|&#9829;|&#10084;|<3)/iu, 'made with a heart'],
];

export function check19Tells(ctx) {
  for (const doc of ctx.docs) {
    const prose = maskedProse(doc);
    const lines = new Set();
    const tell = (idx, what, text) => {
      const line = doc.lineOf(idx);
      if (lines.has(line)) return;
      lines.add(line);
      report(19, what === 'template footer line' ? 'WARN' : 'FAIL', doc.file, line, `${what}: "${trunc(text, 40)}"`, what === 'template footer line' ? 'A stock line with no legal effect; cut it unless the owner wants it' : 'Say what the product does, in its own nouns');
    };
    for (const [re, what] of TELLS19) {
      const m = re.exec(prose);
      if (m) tell(m.index, what, m[0]);
    }
    const stock = [];
    for (let i = 0; i < doc.tags.length; i++) {
      const t = doc.tags[i];
      if (t.close || t.name !== 'a') continue;
      const label = plainText(innerOf(doc, i)?.inner || '').replace(/[\u2192\u203a\u00bb]|->/g, '').trim();
      if (/^(learn more|read more|find out more|click here|more info|see more)$/i.test(label)) stock.push({ t, label });
    }
    if (stock.length >= 2) report(19, 'WARN', doc.file, stock[0].t.line, `stock link label "${stock[0].label}" x${stock.length}`, 'Say where each link goes: the thing it opens, in its own noun');
    for (let i = 0; i < doc.tags.length; i++) {
      const t = doc.tags[i];
      if (t.close || !/^h[1-6]$/.test(t.name)) continue;
      const text = plainText(innerOf(doc, i)?.inner || '');
      if (/^Meet\s+[A-Z][\w-]*[.!]?$/.test(text)) tell(t.pos, 'the "Meet <Name>" heading', text);
      else if (/^[A-Z][a-z]+\.\s+[A-Z][a-z]+\.\s+[A-Z][a-z]+\.$/.test(text)) tell(t.pos, 'the three-word triad heading', text);
    }
  }
}

export function check58Static(ctx) {
  for (const doc of ctx.docs) {
    const h1 = doc.tags.findIndex((t) => !t.close && t.name === 'h1');
    if (h1 >= 0) {
      const words = wordsOf(innerOf(doc, h1)?.inner || '');
      if (words.length > 7) report(58, 'WARN', doc.file, doc.tags[h1].line, `h1 runs ${words.length} words ("${trunc(words.join(' '), 40)}")`, 'Seven words or fewer, 50 characters or fewer');
      const heroIdx = heroIndexOf(doc, h1);
      const hero = heroIdx >= 0 ? innerOf(doc, heroIdx) : null;
      if (hero) {
        for (let i = h1 + 1; i < doc.tags.length && doc.tags[i].pos < hero.endPos; i++) {
          const t = doc.tags[i];
          if (t.close || t.name !== 'p') continue;
          const pw = wordsOf(innerOf(doc, i)?.inner || '');
          if (pw.length > 12) report(58, 'WARN', doc.file, t.line, `hero paragraph runs ${pw.length} words`, 'One sentence, twelve words or fewer');
          break;
        }
      }
    }
    const sections = doc.tags.filter((t) => !t.close && t.name === 'section').length;
    const fullPage = sections >= 5 || doc.tags.some((t) => !t.close && t.name === 'footer');
    if (!fullPage || doc.kind !== 'html') continue;
    const countWords = (t) => t.split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length;
    let hiddenWords = 0, hiddenEnd = -1;
    for (let i = 0; i < doc.tags.length; i++) {
      const t = doc.tags[i];
      if (t.close || t.selfClosing || t.pos < hiddenEnd) continue;
      const cls = getAttr(t.attrs, 'class') || '';
      if (!(/(^|\s)(sr-only|visually-hidden|screen-reader-text|skip|skip-link)(\s|$)/i.test(cls) || /aria-hidden\s*=\s*["']?true/i.test(t.attrs) || /(^|\s)hidden(\s|=|$)/i.test(t.attrs) || /(^|\s)data-credits(\s|=|$)/i.test(t.attrs))) continue;
      const inner = innerOf(doc, i);
      if (!inner) continue;
      hiddenWords += countWords(plainText(inner.inner));
      hiddenEnd = inner.endPos;
    }
    const total = countWords(doc.text) - hiddenWords;
    if (total > 450) report(58, 'WARN', doc.file, 1, `${total} visible words on the page (450 at most)`, 'Cut copy: one idea per screen, sections become objects');
  }
}

export const SECOND_CTA = /^(learn more|see how it works|watch (the )?demo|get started|book a demo)$/i;

export function check42TwoButton(ctx) {
  for (const doc of ctx.docs) {
    const h1 = doc.tags.findIndex((t) => !t.close && t.name === 'h1');
    if (h1 < 0) continue;
    const heroIdx = heroIndexOf(doc, h1);
    const hero = heroIdx >= 0 ? innerOf(doc, heroIdx) : null;
    if (!hero) continue;
    const anc = ancestorMap(doc);
    const controls = [];
    for (let i = heroIdx + 1; i < doc.tags.length && doc.tags[i].pos < hero.endPos; i++) {
      const t = doc.tags[i];
      if (t.close || t.selfClosing || !(t.name === 'button' || t.name === 'a')) continue;
      const cls = getAttr(t.attrs, 'class') || '';
      if (t.name === 'a' && !/btn|cta|button/i.test(cls)) continue;
      if ((anc.get(i) || []).includes('nav')) continue;
      controls.push({ t, cls, label: plainText(innerOf(doc, i)?.inner || '').trim() });
    }
    if (controls.length < 2) continue;
    const fillOf = (c) => { const decls = styleFor(ctx, c.cls, c.t.name, true); let raw = null; for (const d of decls) if (d.prop === 'background-color' || d.prop === 'background') raw = d.value; if (!raw || /--color-paper\b/.test(raw)) return false; const bg = resolveVars(raw, ctx.tokens); return !/^(none|transparent|inherit|initial|unset)$/i.test(bg.trim()) && !/transparent/i.test(bg) && !/var\(--color-paper/.test(raw); };
    const firstFilled = fillOf(controls[0]);
    if (firstFilled && fillOf(controls[1])) { report('F4', 'WARN', doc.file, controls[1].t.line, `two filled buttons side by side in the hero: "${trunc(controls[0].label, 20)}" and "${trunc(controls[1].label, 20)}"`, 'One filled primary per screen; the second action is outlined or a typographic link'); continue; }
    if (!SECOND_CTA.test(controls[1].label) || !firstFilled) continue;
    report(19, 'WARN', doc.file, controls[1].t.line, `the stock second action in the hero: "${trunc(controls[0].label, 20)}" then "${controls[1].label}"`, 'One action in the hero; the second button is the template speaking');
  }
}

export const PLACEHOLDER_IMG = /placehold\.co|via\.placeholder\.com|source\.unsplash\.com\/random|dummyimage\.com/i;

export function check68(ctx) {
  for (const doc of ctx.docs) {
    if (doc.kind !== 'html') continue;
    const slots = [];
    for (let i = 0; i < doc.tags.length; i++) {
      const t = doc.tags[i];
      if (t.close || !/\bdata-slot\s*=/.test(t.attrs)) continue;
      const inner = t.selfClosing ? null : innerOf(doc, i);
      if (inner && /<img\b[^>]*\bsrc\s*=\s*["'][^"']+["']/i.test(inner.inner)) continue;
      if (inner && (inner.inner.match(/<[a-z][\w-]*\b[^>]*>\s*[^<\s]/gi) || []).length >= 6) continue;
      let hiddenUp = false;
      for (let k = i - 1, d = 0; k >= 0 && !hiddenUp; k--) { const u = doc.tags[k]; if (u.selfClosing) continue; if (u.close) { d++; continue; } if (d > 0) { d--; continue; } if (/(?:^|\s)hidden(?:\s|=|$)/.test(u.attrs)) hiddenUp = true; }
      if (hiddenUp) continue;
      slots.push({ i, t });
    }
    if (slots.length && !ctx.docs.some((d) => d.kind !== 'html') && !/hallmarkSlots/.test(doc.src) && !ctx.docs.some((d) => d !== doc && /hallmarkSlots/.test(d.src))) report('F18', 'WARN', doc.file, slots[0].t.line, `${slots.length} slot${slots.length > 1 ? 's' : ''} and no slot script`, 'Paste the hallmarkSlots script the scaffold printed before </body>, so the user\'s images drop in (imagery.md § 3)');
    if (slots.length > 5) report(68, 'FAIL', doc.file, slots[5].t.line, `${slots.length} empty slots on one page`, 'Two to four slots carry a page; set the rest in type, names and facts in a list or table');
    const byRun = new Map();
    for (const sl of slots) {
      let depth = 0, parentIdx = -1;
      for (let k = sl.i - 1; k >= 0; k--) { const t = doc.tags[k]; if (t.selfClosing) continue; if (t.close) depth++; else if (depth === 0) { parentIdx = k; break; } else depth--; }
      const up = (from) => { let d = 0; for (let k = from - 1; k >= 0; k--) { const t = doc.tags[k]; if (t.selfClosing) continue; if (t.close) d++; else if (d === 0) return k; else d--; } return -1; };
      const gp = parentIdx >= 0 ? up(parentIdx) : -1;
      const ggp = gp >= 0 ? up(gp) : -1;
      for (const key of new Set([parentIdx, gp, ggp])) { if (key < 0) continue; byRun.set(key, (byRun.get(key) || 0) + 1); }
    }
    for (const [key, n] of byRun) if (n >= 4) { report(68, 'FAIL', doc.file, doc.tags[key].line, `${n} empty slots in one row or grid`, 'A set the page has no pictures of is set in type with one slot at most'); break; }
  }
}

export const FACT69 = /(?:[£$€¥]\s?\d[\d,.]*|\d[\d,.]*\s?(?:pm|am|MAD|kg|g|ml|km|mi|miles|%)\b|\b\d{1,2}:\d{2}\b)/gi;

export const REGION69 = /^(section|header|footer|article|aside|nav|form|dialog)$/;

export function check69(ctx) {
  for (const doc of ctx.docs) {
    if (doc.kind !== 'html') continue;
    const bodyAt = doc.tags.findIndex((t) => !t.close && t.name === 'body');
    const stack = [];
    const seen = new Map();
    let uid = 0;
    const regionOf = () => {
      const r = stack.find((e) => REGION69.test(e.name));
      if (r) return r.id;
      const band = stack.find((e, i) => i > 0 && (stack[i - 1].name === 'body' || stack[i - 1].name === 'main') && e.name !== 'main');
      return band ? band.id : 'root';
    };
    for (let i = Math.max(bodyAt, 0); i < doc.tags.length; i++) {
      const t = doc.tags[i];
      if (t.close) { const at = stack.map((e) => e.name).lastIndexOf(t.name); if (at >= 0) stack.length = at; }
      else if (!t.selfClosing) stack.push({ name: t.name, id: uid++ });
      const next = doc.tags[i + 1];
      if (/^(script|style|template|noscript)$/.test(t.name) && !t.close) continue;
      const chunk = doc.masked.slice(t.end, next ? next.pos : doc.masked.length)
        .replace(/&pound;/g, '£').replace(/&euro;/g, '€').replace(/&nbsp;|&#160;/g, ' ');
      if (!chunk.trim()) continue;
      const region = regionOf();
      for (const f of chunk.match(FACT69) || []) {
        const k = f.replace(/\s+/g, '').toLowerCase();
        if (!seen.has(k)) seen.set(k, new Set());
        seen.get(k).add(region);
      }
    }
    const loud = [...seen].map(([k, s]) => [k, s.size]).filter(([, n]) => n >= 4).sort((a, b) => b[1] - a[1]);
    if (loud.length) report(69, 'WARN', doc.file, 1, `the same fact printed in ${loud[0][1]} sections: ${loud.slice(0, 3).map(([k, n]) => `${k} (${n})`).join(', ')}`, 'Say each fact once, where it does work; cut the restatements');
  }
}

export function check70(ctx) {
  const SUCCESS = /\b(sent|thanks|thank you|reserved|booked|on the list|subscribed|in touch|received|confirmed|ordered|chosen|on its way|signed up|all set|you're in|you are in|done)\b/i;
  const NEG = /\b(not|nothing|no|never|isn't|wasn't|didn't|cannot|can't|failed|try again|soon)\b/i;
  for (const doc of ctx.docs) {
    const js = (doc.scripts && typeof doc.scripts === 'string') ? doc.scripts : (doc.src.match(/<script\b[^>]*>([\s\S]*?)<\/script>/gi) || []).join('\n');
    if (!/<form\b|type\s*=\s*["']submit/i.test(doc.src) || !js) continue;
    let m = null;
    for (const x of js.matchAll(/(["'`])((?:(?!\1)[^\\\n]|\\.){4,140})\1/g)) {
      const str = x[2];
      const head = str.trim().split(/\s+/).slice(0, 4).join(' ');
      if (str.trim().split(/\s+/).length >= 2 && SUCCESS.test(head) && !NEG.test(str)) { m = [x[0]]; break; }
    }
    if (!m) continue;
    if (/\bfetch\s*\(|XMLHttpRequest|navigator\.sendBeacon|\.submit\s*\(\s*\)|axios|\$\.ajax/.test(js)) continue;
    report(70, 'WARN', doc.file, doc.lineOf ? doc.lineOf(doc.src.indexOf(m[0]) >= 0 ? doc.src.indexOf(m[0]) : 0) : 1, `a script prints success ("${trunc(m[0].replace(/["'`]/g, ''), 30)}") with no request behind it`, 'No success state until the form posts somewhere; an empty data-endpoint and a handoff note');
  }
}

export function check47Placeholders(ctx) {
  for (const doc of ctx.docs) {
    const m = PLACEHOLDER_IMG.exec(doc.src);
    if (m) report('47c', 'WARN', doc.file, doc.lineOf(m.index), `placeholder image service ${m[0]}`, 'A labelled data-slot in the theme colours, or a real asset');
  }
  for (const c of ctx.cssFiles) {
    const m = PLACEHOLDER_IMG.exec(c.raw);
    if (m) report('47c', 'WARN', c.file, c.raw.slice(0, m.index).split('\n').length, `placeholder image service ${m[0]}`, 'A labelled data-slot in the theme colours, or a real asset');
  }
}
