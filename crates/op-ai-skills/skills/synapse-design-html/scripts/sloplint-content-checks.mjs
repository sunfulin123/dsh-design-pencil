/** HTML quality diagnostics; adapted from the original Synapse HTML skill. */
import { maskedProse } from './sloplint-accessibility-checks.mjs';
import {
  firstFamily, innerOf, isTokenRule, parseColor, plainText,
  pxOf, resolveVars, trunc,
} from './sloplint-color.mjs';
import { ancestorMap, directChildren, getAttr } from './sloplint-jsx.mjs';
import {
  GENERIC_FAMILIES, HEADING_SEL, declValue, fontPxOf, mergedDeclsBySelector,
  report, styleFor, trackingEmOf,
} from './sloplint-report.mjs';

export function check42(ctx) {
  for (const doc of ctx.docs) {
    const navIdx = doc.tags.findIndex((t) => !t.close && (t.name === 'nav' || (t.name === 'header' && /banner|nav/i.test(t.attrs))));
    if (navIdx === -1) continue;
    const inner = innerOf(doc, navIdx);
    if (!inner) continue;
    const links = (inner.inner.match(/<a\b/gi) || []).length;
    const navTag = doc.tags[navIdx];
    const navCls = (getAttr(navTag.attrs, 'class') || '').split(/\s+/)[0];
    const hairline = ctx.rules.some((r) => (navCls && r.selector.includes(navCls) || /(^|[\s,])(nav|header)\b/.test(r.selector))
      && r.decls.some((d) => /^border(-bottom)?$/.test(d.prop) && /\b1px\b/.test(d.value)));
    const hasCta = /btn|cta|button/i.test(inner.inner);
    if (links >= 4 && links <= 6 && hairline && hasCta) {
      report(42, 'WARN', doc.file, navTag.line, `default nav shape: ${links} links + CTA + 1px hairline`, 'Give the nav a shape of its own (layout.md, navs)');
    }
  }
}

export function check42Footer(ctx) {
  for (const doc of ctx.docs) {
    const idx = doc.tags.findIndex((t) => !t.close && t.name === 'footer');
    if (idx === -1) continue;
    const inner = innerOf(doc, idx);
    if (!inner) continue;
    const uls = (inner.inner.match(/<ul\b/gi) || []).length;

    const fourEqualCol = ctx.rules.some((r) => /footer/i.test(r.selector) && r.decls.some((d) =>
      d.prop === 'grid-template-columns'
      && (/repeat\(\s*4\s*,/.test(d.value)
        || /^(1fr|minmax\([^)]*\))(\s+(1fr|minmax\([^)]*\))){3,}$/.test(d.value.trim()))));

    let linkGroups = 0;
    const colRe = /<(ul|div|p|nav)\b[^>]*class\s*=\s*"[^"]*(col|column|links|group)[^"]*"[^>]*>([\s\S]*?)<\/\1>/gi;
    let cm;
    while ((cm = colRe.exec(inner.inner))) {
      if ((cm[3].match(/<a\b/gi) || []).length >= 3) linkGroups++;
    }
    for (const um of inner.inner.matchAll(/<ul\b[^>]*>([\s\S]*?)<\/ul>/gi)) {
      if ((um[1].match(/<a\b/gi) || []).length >= 3) linkGroups++;
    }
    if (uls >= 4 || (fourEqualCol && linkGroups >= 3)) {
      report(42, 'WARN', doc.file, doc.tags[idx].line, `default footer shape: ${uls >= 4 ? uls + ' link columns' : '4 equal columns of links'}`, 'Decide the footer and name it in the stamp, or build another shape');
    }
  }
}

export function check46(ctx) {
  const shapes = [
    /\b\d+(\.\d+)?\s*[x×]\s*faster\b/i,
    /trusted by [\d,.]+\s*\+?/i,
    /\b99\.9+\s*%/,
    /\b[\d,]{4,}\s*\+\s*(teams|users|customers|developers|companies|creators)\b/i,
    /\b\d+(\.\d+)?\s*%\s*(faster|uptime|conversion|accuracy|retention|growth|fewer|less|more)\b/i,
    /\+\s*\d+(\.\d+)?\s*%\s*(conversion|growth|revenue|retention)\b/i,
    /\bsaves?\s+\d+\s+hours?\b/i,
  ];
  for (const doc of ctx.docs) {
    const prose = maskedProse(doc);
    const lines = new Set();
    for (const re of shapes) {
      const m = re.exec(prose);
      if (!m) continue;
      const line = doc.lineOf(m.index);
      if (lines.has(line)) continue;
      lines.add(line);
      report('46a', 'WARN', doc.file, line, `metric "${m[0].trim()}": verify the user supplied this number`, 'Confirm the metric or drop the slot');
    }
  }
}

export const CHROME_47 = [
  ['47a', /(browser|window|mac|osx)[-_]?(bar|chrome|dots|controls)|traffic[-_]?light|title[-_]?bar|window[-_]?(dots|buttons)|url[-_]?(bar|pill)/i],
  ['47b', /phone[-_]?(frame|mock(up)?)|device[-_]?frame|\bnotch\b|terminal[-_]?(chrome|frame|bar|dots|header)|(ide|editor)[-_]?(chrome|frame)|(browser|window)[-_]?frame/i],
];

export function check47(ctx) {
  for (const [gate, re] of CHROME_47) {
    for (const doc of ctx.docs) {
      for (const t of doc.tags) {
        if (t.close) continue;
        const cls = getAttr(t.attrs, 'class');
        const m = cls ? re.exec(cls) : null;
        if (m) { report(gate, 'FAIL', doc.file, t.line, `re-drawn chrome class "${m[0]}" (class="${trunc(cls, 32)}")`, 'Use a real screenshot in a figure'); break; }
      }
    }
    for (const r of ctx.rules) {
      const m = re.exec(r.selector);
      if (m) {
        report(gate, 'FAIL', r.file, r.line, `re-drawn chrome selector ${r.selector}`, 'Use a real screenshot in a figure');
        break;
      }
    }
  }
}

export function check48(ctx) {
  const colorLit = /#[0-9a-fA-F]{3,8}\b|(?<![\w-])rgba?\(|(?<![\w-])hsla?\(|(?<![\w-])oklch\(/;
  for (const [prop, val] of Object.entries(ctx.tokens)) {
    if (/^--(font|color)-/.test(prop) && /FILL ME/i.test(val)) {
      const tr = ctx.rules.find((r) => isTokenRule(r) && r.decls.some((d) => d.prop === prop));
      report(48, 'FAIL', tr ? tr.file : ctx.cssFiles[0]?.file || ctx.docs[0]?.file, tr ? tr.decls.find((d) => d.prop === prop)?.line : 1, `${prop} is still the scaffold placeholder "FILL ME"`, prop.startsWith('--font-') ? 'Fill the face from the theme tokens (scaffold) or fonts.md on a custom run before building' : 'Fill the colour from the theme tokens (scaffold) or direction.md on a custom run before building');
    }
  }
  for (const r of ctx.rules) {
    if (isTokenRule(r)) continue;
    for (const d of r.decls) {
      if (d.prop === 'font-family') {
        const v = d.value;
        if (/FILL ME/i.test(resolveVars(v, ctx.tokens))) {
          report(48, 'FAIL', r.file, d.line, `font-family on ${r.selector} resolves to the placeholder "FILL ME"`, 'Fill the face from the theme tokens (scaffold) or fonts.md on a custom run before building');
          continue;
        }
        if (!v.includes('var(')) {
          const fam = firstFamily(v);
          if (!GENERIC_FAMILIES.has(fam)) {
            report(48, 'FAIL', r.file, d.line, `font-family literal "${trunc(v, 36)}" on ${r.selector}`, 'Lift the value into the token block');
          }
        }
        continue;
      }
      if (!colorLit.test(d.value)) continue;
      const re = /#[0-9a-fA-F]{3,8}\b|oklch\([^)]*\)|rgba?\([^)]*\)|hsla?\([^)]*\)/g;
      let m;
      while ((m = re.exec(d.value))) {
        const c = parseColor(m[0]);
        if (!c) continue;
        if (c.alpha === 0) continue;
        const isOklch = m[0].toLowerCase().startsWith('oklch');
        const ev = `${isOklch ? 'oklch' : 'colour'} literal ${trunc(m[0], 30)} outside tokens (${d.prop} on ${trunc(r.selector, 30)})`;
        report(48, 'FAIL', r.file, d.line, ev, 'Lift the value into the token block');
      }
    }
  }
  for (const doc of ctx.docs) {
    const re = /style\s*=\s*"([^"]*)"/gi;
    let m;
    while ((m = re.exec(doc.src))) {
      const lit = /#[0-9a-fA-F]{3,8}\b|oklch\([^)]*\)|rgba?\([^)]*\)|hsla?\([^)]*\)/.exec(m[1]);
      if (lit && parseColor(lit[0])) {
        const ev = `inline-style colour literal ${trunc(lit[0], 30)}`;
        report(48, 'FAIL', doc.file, doc.lineOf(m.index), ev, 'Lift the value into the token block');
      }
    }
  }
}

export function check49(ctx) {
  const nowrapSelectors = ctx.rules.filter((r) => r.decls.some((d) => d.prop === 'white-space' && /nowrap/.test(d.value)));
  const covered = (cls, tag) => nowrapSelectors.some((r) =>
    (cls && cls.split(/\s+/).some((c) => c && r.selector.includes('.' + c))) || new RegExp(`(^|[\\s,>+~])${tag}\\b`).test(r.selector));
  for (const doc of ctx.docs) {
    for (let i = 0; i < doc.tags.length; i++) {
      const t = doc.tags[i];
      if (t.close || t.selfClosing) continue;
      const cls = getAttr(t.attrs, 'class') || '';
      const clickable = t.name === 'button' || (t.name === 'a' && /btn|cta|button|nav/i.test(cls))
        || (/(^|\s)(btn|button)(\s|$|__|--)/i.test(cls) && !/^(section|header|footer|main|article|aside|nav|form|ul|ol)$/.test(t.name));
      if (!clickable) continue;
      const inner = innerOf(doc, i);
      if (!inner) continue;
      const label = inner.inner.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      if (label.length > 24 && !covered(cls, t.name)) {
        report(49, 'WARN', doc.file, t.line, `long clickable label "${trunc(label, 36)}" without nowrap`, 'Shorten the label or set nowrap');
      }
    }
  }
}

export function check50(ctx) {
  for (const r of ctx.rules) {
    for (const d of r.decls) {
      if (d.prop !== 'grid-template-columns') continue;
      let flat = resolveVars(d.value, ctx.tokens);
      for (let k = 0; k < 4 && /\((?:[^()]*)\)/.test(flat); k++) flat = flat.replace(/(calc|min|max|clamp|var|fit-content)\(([^()]*)\)/g, 'X');
      flat = flat.replace(/minmax\([^()]*\)/g, 'MM');
      const bare = /(?<![\w.-])\d*\.?\d+fr\b/.exec(flat);
      if (!bare) continue;
      const classes = (r.selector.match(/\.[a-zA-Z][\w-]*/g) || []).map((c) => c.slice(1));
      let hit = null;
      for (const doc of ctx.docs) {
        for (let i = 0; i < doc.tags.length; i++) {
          const t = doc.tags[i];
          if (t.close || t.selfClosing) continue;
          const cls = getAttr(t.attrs, 'class') || '';
          if (!classes.some((c) => cls.split(/\s+/).includes(c))) continue;
          const inner = innerOf(doc, i);
          if (inner && /<(img|picture|video)\b/i.test(inner.inner)) { hit = { doc, t }; break; }
        }
        if (hit) break;
      }
      if (hit) {
        report(50, 'FAIL', r.file, d.line, `bare ${bare[0]} track holds images (${r.selector})`, 'Use minmax(0, 1fr) for image tracks');
      }
    }
  }
}

export function check50Wrap(ctx) {
  const wrapCovered = (cls, tag) => ctx.rules.some((r) => {
    const has = r.decls.some((d) =>
      (d.prop === 'overflow-wrap' && /anywhere|break-word/.test(d.value))
      || (d.prop === 'word-break' && /break-word|break-all/.test(d.value))
      || (d.prop === 'hyphens' && /auto/.test(d.value)));
    if (!has) return false;
    if (/^\*|:where\(|html|body/.test(r.selector)) return true;
    return (cls && cls.split(/\s+/).some((c) => c && r.selector.includes('.' + c)))
      || new RegExp(`(^|[\\s,>+~])${tag}\\b`).test(r.selector);
  });
  for (const doc of ctx.docs) {
    for (let i = 0; i < doc.tags.length; i++) {
      const t = doc.tags[i];
      if (t.close || t.selfClosing) continue;
      const cls = getAttr(t.attrs, 'class') || '';
      const displayish = /^h[12]$/.test(t.name) || /hero__(title|display)|section__title|__display/.test(cls);
      if (!displayish) continue;
      const inner = innerOf(doc, i);
      if (!inner) continue;
      const textContent = inner.inner.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      let risky = null;
      for (const word of textContent.split(' ')) {
        for (const seg of word.split('-')) {
          if (seg.replace(/[^\w]/g, '').length >= 16) { risky = word; break; }
        }
        if (risky) break;
      }
      if (risky && !wrapCovered(cls, t.name)) {
        report(50, 'FAIL', doc.file, t.line, `display header word "${trunc(risky, 30)}" with no overflow-wrap`, 'Add overflow-wrap: break-word and min-width: 0');
      }
    }
  }
}

export function check53(ctx) {
  const radios = ctx.rules.filter((r) => /input\[type=["']?radio["']?\]|\.(radio|tab-input|tab-radio)\b/i.test(r.selector));
  for (const r of radios) {
    const abs = r.decls.some((d) => d.prop === 'position' && /absolute|fixed/.test(d.value));
    const topZero = r.decls.some((d) => d.prop === 'top' && /^0(px|rem)?$/.test(d.value.trim()));
    if (abs && topZero) {
      const guarded = ctx.docs.some((doc) => /preventScroll/.test(doc.scripts));
      if (!guarded) {
        report(53, 'FAIL', r.file, r.line, `radio tabs at position:absolute top:0 (${r.selector}), no JS guard`, 'Keep radios in flow or add a JS guard');
      }
    }
  }
}

export const EYEBROW_CONTAINER = /^(div|header|footer|section|article|aside|hgroup|li|main|figure|a|body|blockquote)$/;

export const EYEBROW_SKIP_TAGS = /^(figcaption|label|legend|caption|th|dt|summary|option|code|kbd|button|select|nav|time)$/;

export const EYEBROW_ANCESTOR_SKIP = /^(form|fieldset|table|thead|tbody|nav|menu|dl|select|figcaption|label|button)$/;

export const EYEBROW_BLOCKY = /<(p|ul|ol|hr|h[1-6]|img|table|figure|section|article|blockquote|form|dl)\b/i;

export const EYEBROW_CLASS = /\b(eyebrow|kicker|overline|superhead|suphead|rubric|strap(line)?|pre-?(title|head(ing)?)|section-?label|num-?label|chapter|ordinal|topic|category|dept)\b|__(num|label|tag|kicker|chip|badge|meta|index|caps|micro)\b|\b(tag|chip|badge|meta|caps|micro|label|index)\b/i;

export const EYEBROW_ANNOUNCE = /^(features?|benefits?|introducing|new|how it works?|the (process|tour)|our (process|story|work|team|approach|values?)|why (us|choose|we)|pricing|plans?|faq|questions?|testimonials?|reviews?|trusted by|as seen in|what we do|about( us)?|services?|solutions?|use cases?|get started|contact|team|work|projects?|gallery|blog|news|resources?|examples?|overview)$/i;

export function capsRatio(s) {
  const letters = s.replace(/[^A-Za-z]/g, '');
  if (!letters) return 0;
  return (letters.match(/[A-Z]/g) || []).length / letters.length;
}

export function eyebrowHeadingBearing(ctx, B, aPx) {
  if (/^h[1-6]$/.test(B.name)) return true;
  if (/<h[1-6][\s>]/i.test(B.html)) return true;

  const cls = getAttr(B.open, 'class') || '';
  if (!/__(title|display|head(line)?|h\d)\b|hero__/i.test(cls)) return false;
  const bPx = fontPxOf(ctx, styleFor(ctx, cls, B.name));
  return bPx != null && aPx != null && bPx >= 1.5 * aPx;
}

export function eyebrowHit(ctx, A, B, inOrderedList) {
  if (EYEBROW_SKIP_TAGS.test(A.name)) return null;
  if (/(^|\s)for\s*=/i.test(A.open)) return null;
  if (/role\s*=\s*["']status|aria-live|aria-current|aria-hidden\s*=\s*["']true/i.test(A.open)) return null;
  const inner = A.html.slice(A.open.length);
  if (EYEBROW_BLOCKY.test(inner) || /<br\b/i.test(inner)) return null;
  if (/<time\b[^>]*\sdatetime\s*=/i.test(A.html)) return null;
  if (/<img\b[^>]*\salt\s*=\s*["'][^"']+/i.test(A.html)) return null;

  const ownHref = A.name === 'a' ? getAttr(A.open, 'href') : null;
  if (ownHref && !/^#?$/.test(ownHref.trim())) return null;
  const innerHref = /<a\b[^>]*\shref\s*=\s*["']([^"']*)["']/i.exec(inner);
  if (innerHref && !/^#?$/.test(innerHref[1].trim())) return null;

  const text = plainText(A.html);
  if (!text) return null;
  const words = text.split(/[\s·/|\u2014\u2013]+/).filter(Boolean);
  if (words.length > 7 || text.length > 56) return null;
  if (/[\w/-]+\.[a-z]{1,4}$/i.test(text)) return null;

  if (/^[\d.,]+\s*(?:[%°+]|[a-z]{1,3})$/i.test(text)) return null;
  const stripped = text.replace(/^\s*(?:no\.?\s*)?\d{1,3}(?:\s*[·./\u2014\u2013-]\s*|\s+|$)/i, '').trim();
  if ((stripped.match(/\d/g) || []).length >= 2) return null;

  if (inOrderedList && stripped && !EYEBROW_ANNOUNCE.test(stripped)) return null;

  const cls = getAttr(A.open, 'class') || '';
  const aDecls = styleFor(ctx, cls, A.name);

  const pos = declValue(ctx, aDecls, 'position');
  if (pos && /absolute|fixed/.test(pos)) return null;
  const aPx = fontPxOf(ctx, aDecls);
  if (!eyebrowHeadingBearing(ctx, B, aPx)) return null;

  if (EYEBROW_CLASS.test(cls)) return { text };
  let signals = 0;
  const tt = declValue(ctx, aDecls, 'text-transform');
  if ((tt && /uppercase/.test(tt)) || (capsRatio(text) >= 0.6 && /[A-Z]/.test(text))) signals++;
  const tr = trackingEmOf(ctx, aDecls, aPx || 16);
  if (tr != null && tr >= 0.04) signals++;
  if (aPx != null && aPx <= 15) signals++;
  const ff = declValue(ctx, aDecls, 'font-family');
  if (ff && /mono|--font-label/i.test(ff)) signals++;
  const fv = declValue(ctx, aDecls, 'font-variant-caps');
  if (fv && /small-caps/.test(fv)) signals++;
  if (signals >= 2) return { text };
  if (EYEBROW_ANNOUNCE.test(stripped)) return { text };
  return null;
}

export function check54(ctx) {
  for (const doc of ctx.docs) {
    const anc = ancestorMap(doc);
    for (let i = 0; i < doc.tags.length; i++) {
      const t = doc.tags[i];
      if (t.close || t.selfClosing || !EYEBROW_CONTAINER.test(t.name)) continue;
      const ancestors = anc.get(i) || [];
      if (ancestors.some((n) => EYEBROW_ANCESTOR_SKIP.test(n))) continue;
      const inOl = ancestors.includes('ol');
      const kids = directChildren(doc, i);
      for (let k = 0; k < kids.length - 1; k++) {
        const A = kids[k];
        let B = null;
        for (let j = k + 1; j < Math.min(kids.length, k + 3); j++) {
          const c = kids[j];
          if (c.name === 'hr' || /aria-hidden\s*=\s*["']true/i.test(c.open)) continue;
          B = c; break;
        }
        if (!B) continue;
        const hit = eyebrowHit(ctx, A, B, inOl);
        if (hit) {
          report(54, 'FAIL', doc.file, doc.tags[A.idx]?.line || t.line,
            `eyebrow "${trunc(hit.text, 32)}" before <${B.name}>`,
            'Cut it; the heading already says this (craft.md § 7 has twelve other openings)');
          break;
        }
      }
    }
  }
  check54Unheaded(ctx);
}

export function check54Unheaded(ctx) {
  for (const doc of ctx.docs) {
    for (let i = 0; i < doc.tags.length; i++) {
      const t = doc.tags[i];
      if (t.close || t.selfClosing || !/^(section|article)$/.test(t.name)) continue;
      const labelledBy = getAttr(t.attrs, 'aria-labelledby');
      if (!labelledBy) continue;
      const body = innerOf(doc, i);
      if (!body || /<h[1-6][\s>]/i.test(body.inner)) continue;
      const idRe = new RegExp(`<([a-z][\\w-]*)\\b[^>]*\\sid\\s*=\\s*["']${labelledBy.split(/\s+/)[0]}["'][^>]*>`, 'i');
      const m = idRe.exec(body.inner);
      if (!m || /^h[1-6]$/i.test(m[1])) continue;
      report(54, 'WARN', doc.file, doc.lineOf(body.endPos - body.inner.length + m.index),
        `section labelled by <${m[1].toLowerCase()}> with no heading element`,
        'Promote it to <h2>; a label doing heading duty should be a heading');
    }
  }
}

export function check55(ctx) {
  const bySel = mergedDeclsBySelector(ctx);
  for (const r of bySel) {
    const upper = r.decls.find((d) => d.prop === 'text-transform' && /uppercase/.test(d.value));
    if (!upper) continue;
    const displayish = HEADING_SEL.test(r.selector);
    const lhD = r.decls.find((d) => d.prop === 'line-height');
    if (!lhD) continue;
    const lh = parseFloat(resolveVars(lhD.value, ctx.tokens));
    if (Number.isNaN(lh) || lh >= 1.02) continue;
    const bigType = r.decls.some((d) => d.prop === 'font-size' && (pxOf(resolveVars(d.value, ctx.tokens)) ?? 0) >= 28);
    if (!displayish && !bigType) continue;
    const nowrap = r.decls.some((d) => d.prop === 'white-space' && /nowrap/.test(d.value));
    if (!nowrap && lh >= 1.0) continue;
    report(nowrap ? '55b' : '55a', 'FAIL', r.file, lhD.line, `uppercase + line-height ${lh} on ${r.selector} (cap collision)`, nowrap ? 'A single-line caps lockup holds 1.02 or more' : 'Line-height 1.0 minimum for caps heads that can wrap');
  }
}

export function check56(ctx) {
  const bySel = mergedDeclsBySelector(ctx);
  const sticky = [];
  for (const r of bySel) {
    const isSticky = r.decls.some((d) => d.prop === 'position' && /sticky/.test(d.value));
    const topZero = r.decls.some((d) => d.prop === 'top' && /^(0|0px|0rem|-1px)$/.test(resolveVars(d.value, ctx.tokens).trim()));
    if (isSticky && topZero) sticky.push(r);
  }
  if (sticky.length >= 2) {
    const sels = sticky.map((r) => r.selector).join(' + ');
    report(56, 'FAIL', sticky[1].file, sticky[1].line, `two sticky top:0 elements: ${trunc(sels, 52)}`, 'Offset the second sticky by banner height');
  }
}

export function checkCopyTell(ctx) {
  for (const doc of ctx.docs) {
    const prose = maskedProse(doc);
    const m = /\w\s--\s\w|[\u2014\u2013]|&mdash;|&ndash;|&#8212;|&#8211;/.exec(prose);
    if (m) report(19, 'FAIL', doc.file, doc.lineOf(m.index), `dash "${m[0]}" in copy`, 'A comma, a colon, a full stop or parentheses; never a dash');
    const seenBuzz = new Set();
    for (const buzz of prose.matchAll(new RegExp(/\b(seamless(ly)?|robust|empower(s|ing)?|supercharge[sd]?|best[- ]in[- ]class|industry[- ]leading|mission[- ]critical|future[- ]proof(ed)?|unleash(es|ed|ing)?|elevate[sd]?|effortless(ly)?|unlock(s|ing)?|next[- ]generation|world[- ]class|cutting[- ]edge|streamline[sd]?|revolutioni[sz]e[sd]?|game[- ]chang(er|ing)|enterprise[- ]grade|quietly (trusted|in use)|built for the modern|in today's)\b/.source, 'gi'))) {
      const word = buzz[0].toLowerCase();
      if (seenBuzz.has(word) || seenBuzz.size >= 8) continue;
      seenBuzz.add(word);
      report(19, 'FAIL', doc.file, doc.lineOf(buzz.index), `buzzword "${buzz[0]}"`, 'Say what the product does, in its own nouns');
    }
    const cadence = prose.match(/(^|[.!?]\s+)(not|no)\s+[a-z][^.!?\n]{0,40}[.]\s+(just|only|a|an)?\s*[a-z][^.!?\n]{0,40}[.]/gi) || [];
    if (cadence.length >= 3) report(19, 'FAIL', doc.file, doc.lineOf(prose.indexOf(cadence[0].trim()) || 0), `rebuttal cadence repeated ${cadence.length} times ("${trunc(cadence[0].trim(), 40)}")`, 'Once is voice; three times is a tic');
  }
}

export function monoIsMaterial(ctx) {
  const mono = (v) => v && /mono|code|courier|silkscreen|jetbrains|plex mono|geist mono|commit|fira code|space mono|dm mono|roboto mono|source code|ibm plex mono|press start|vt323|share tech/i.test(firstFamily(resolveVars(v, ctx.tokens)));
  return mono(ctx.tokens['--font-display']) || mono(ctx.tokens['--font-body']) || mono(ctx.tokens['--font-outlier']);
}
