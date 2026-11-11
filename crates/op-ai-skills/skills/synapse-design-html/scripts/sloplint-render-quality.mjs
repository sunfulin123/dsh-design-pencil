/** HTML browser diagnostics; adapted from the original Synapse HTML skill. */
import { isUrl, renderCheck } from './sloplint-render.mjs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export function observeQuality(scope) {
  const out = [];
  const push = (gate, grade, evidence, fix) => out.push({ gate: String(gate), grade, evidence, fix });
  const vis = (el) => { const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return false; const r = el.getBoundingClientRect(); return r.width > 1 && r.height > 1; };
  const name = (el) => el.tagName.toLowerCase() + (el.classList && el.classList[0] ? '.' + el.classList[0] : '');
  const abs = (r) => ({ top: r.top + scrollY, bottom: r.bottom + scrollY, left: r.left, right: r.right });
  const clear = (c) => /^(transparent|rgba\(0, 0, 0, 0\))$/.test(c);
  const quiet = (el) => !!el.closest('script, style, noscript, [aria-hidden="true"], dialog:not([open])') || !!(el.parentElement && el.parentElement.closest('svg'));
  const all = [...document.body.querySelectorAll('*')].filter((el) => !quiet(el) && vis(el));

  const boxes = [];
  for (const el of all) {
    const media = /^(IMG|svg|CANVAS|VIDEO|PICTURE|IFRAME|INPUT|BUTTON|SELECT|TEXTAREA)$/.test(el.tagName) || el.hasAttribute('data-slot');
    if (!media && ![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
    boxes.push({ el, ...abs(el.getBoundingClientRect()) });
  }
  const overlapX = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 8;
  const crowded = [];
  for (const h of document.querySelectorAll('h2, h3, h4')) {
    if (!vis(h) || quiet(h) || h.closest('nav, footer, table, [data-slot]')) continue;
    let small = false;
    for (let p = h.parentElement; p && p !== document.body; p = p.parentElement) {
      const cs = getComputedStyle(p);
      if (!clear(cs.backgroundColor) || parseFloat(cs.borderTopWidth) > 0 || cs.boxShadow !== 'none') { small = p.getBoundingClientRect().height < 200; break; }
    }
    if (small) continue;
    const hb = abs(h.getBoundingClientRect());
    let above = null, below = null;
    for (const b of boxes) {
      if (h.contains(b.el) || b.el.contains(h) || !overlapX(b, hb)) continue;
      if (b.bottom <= hb.top + 1 && (!above || b.bottom > above.bottom)) above = b;
      if (b.top >= hb.bottom - 1 && (!below || b.top < below.top)) below = b;
    }
    if (!above || !below) continue;
    const up = hb.top - above.bottom, down = below.top - hb.bottom;
    if (down < 6 || down > 160) continue;
    if (up < 0.75 * down && down - up >= 12) crowded.push(`${name(h)} "${(h.innerText || '').trim().slice(0, 18)}" ${Math.round(up)}px over, ${Math.round(down)}px under`);
  }
  if (crowded.length >= 2) push(71, 'REFLEX', `heads nearer what precedes them than what they head: ${crowded.slice(0, 2).join('; ')}`, 'At least twice the space above a head as below it');

  const tight = [];
  for (const el of all) {
    if (tight.length >= 3) break;
    if (/^(SECTION|MAIN|HEADER|FOOTER|NAV|ARTICLE|INPUT|TEXTAREA|SELECT|svg|IMG|TABLE|THEAD|TBODY|TR|TD|TH|PRE|CODE|IFRAME|VIDEO|CANVAS|DIALOG)$/.test(el.tagName) || el.closest('[data-slot], table')) continue;
    const r = el.getBoundingClientRect();
    if (r.width <= 100 || r.height <= 30 || r.width > innerWidth * 0.9) continue;
    const cs = getComputedStyle(el);
    if (cs.display === 'inline') continue;
    if (/auto|scroll/.test(cs.overflowX + cs.overflowY)) continue;
    const bw = ['Top', 'Right', 'Bottom', 'Left'].map((k) => parseFloat(cs[`border${k}Width`]) || 0);
    const inked = (k) => bw[k] >= 1 && !clear(cs[`border${['Top', 'Right', 'Bottom', 'Left'][k]}Color`]);
    let under = 'rgb(255, 255, 255)';
    for (let p = el.parentElement; p; p = p.parentElement) { const c = getComputedStyle(p).backgroundColor; if (!clear(c)) { under = c; break; } }
    const filled = !clear(cs.backgroundColor) && cs.backgroundColor !== under;
    if (!filled && !(inked(1) && inked(3))) continue;
    const sides = ['left', 'right', 'top', 'bottom'];
    let L = Infinity, T = Infinity, Rr = -Infinity, B = -Infinity, fs = parseFloat(cs.fontSize) || 16;
    const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let t = walk.nextNode(); t; t = walk.nextNode()) {
      const host = t.parentElement;
      if (!t.textContent.trim() || !host || host.closest('svg') || !vis(host)) continue;
      let nested = false;
      for (let p = host; p && p !== el; p = p.parentElement) {
        const ps = getComputedStyle(p);
        if (/absolute|fixed/.test(ps.position) || (!clear(ps.backgroundColor) && ps.backgroundColor !== cs.backgroundColor) || (parseFloat(ps.borderTopWidth) >= 1 && parseFloat(ps.borderLeftWidth) >= 1)) { nested = true; break; }
      }
      if (nested) continue;
      const rg = document.createRange(); rg.selectNodeContents(t);
      const hf = parseFloat(getComputedStyle(host).fontSize) || 16; const trim = hf >= 40 ? 0.2 * hf : 0;
      for (const q of rg.getClientRects()) { if (!q.width || !q.height) continue; L = Math.min(L, q.left); T = Math.min(T, q.top + trim); Rr = Math.max(Rr, q.right); B = Math.max(B, q.bottom - trim); fs = parseFloat(getComputedStyle(host).fontSize) || fs; }
    }
    if (L === Infinity) continue;
    const side = Math.max(8, Math.min(0.5 * fs, 24)) - 0.5, end = Math.max(4, Math.min(0.3 * fs, 12)) - 0.5;
    const inset = { left: L - (r.left + bw[3]), right: r.right - bw[1] - Rr, top: T - (r.top + bw[0]), bottom: r.bottom - bw[2] - B };
    const short = Object.entries(inset).filter(([k, v]) => sides.includes(k) && v < (k === 'left' || k === 'right' ? side : end));
    if (short.length) tight.push(`${name(el)} ${short.map(([k, v]) => `${k} ${Math.round(v)}px`).join(', ')}`);
  }
  if (tight.length) push(72, 'REFLEX', `text crowds the edge of its box: ${tight.join('; ')}`, 'Pad the box: max(8px, 0.5em) at the sides, max(4px, 0.3em) above and below');

  const controls = all.filter((el) => (el.tagName === 'BUTTON' || el.getAttribute('role') === 'button' || (el.tagName === 'A' && /btn|button|cta/i.test(String(el.className))) || (el.tagName === 'INPUT' && /^(submit|button|text|email|search|tel|url|password|number)$/.test(el.type))) && !el.closest('nav, header, dialog, [role="dialog"], [data-slot], [role="tablist"]') && (el.tagName === 'INPUT' || (el.innerText || '').trim()));
  const offSize = controls.map((el) => ({ el, h: el.getBoundingClientRect().height })).filter((c) => c.h > 8 && (c.h < (scope === 'app' ? 30 : 42) || c.h > 54));
  if (offSize.length) push('39b', 'REFLEX', `control height outside ${scope === 'app' ? '32 to 52px' : '44 to 52px'}: ${offSize.slice(0, 3).map((c) => `${name(c.el)} ${Math.round(c.h)}px`).join(', ')}`, 'Marketing controls stand 44 to 52px; app UI 32 to 40px with a 44px hit target');

  const long = [];
  for (const el of all) {
    if (long.length >= 2 || el.tagName !== 'P' || el.closest('nav, footer, table, figure, [data-slot]')) continue;
    const t = (el.innerText || '').replace(/\s+/g, ' ').trim();
    if (t.length < 240) continue;
    const cs = getComputedStyle(el);
    const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.4;
    let cols = 1; for (let q = el; q && q !== document.body && cols === 1; q = q.parentElement) { const qc = getComputedStyle(q); if (qc.columnCount !== 'auto' || qc.columnWidth !== 'auto') cols = Math.max(1, Math.round(q.getBoundingClientRect().width / Math.max(1, el.getClientRects()[0]?.width || q.getBoundingClientRect().width))); }
    const lines = Math.round(el.getBoundingClientRect().height / lh) * cols;
    if (lines >= 3 && t.length / lines > 88) long.push(`${name(el)} about ${Math.round(t.length / lines)} characters a line`);
  }
  if (long.length) push(25, 'REFLEX', `running prose set too wide: ${long.join(', ')}`, 'Cap the measure at 45 to 75ch');

  const tiles = all.find((g) => {
    if (g.closest('nav, footer, form, table')) return false;
    const kids = [...g.children].filter(vis);
    if (kids.length < 3 || kids.length > 4) return false;
    const rects = kids.map((k) => k.getBoundingClientRect());
    if (rects.some((r) => Math.abs(r.top - rects[0].top) > 4 || r.width < 160) || Math.max(...rects.map((r) => r.width)) > Math.min(...rects.map((r) => r.width)) * 1.04) return false;
    return kids.every((k) => {
      const head = k.querySelector('h2, h3, h4');
      if (!head) return false;
      const icon = [...k.querySelectorAll('svg, img, [class*="icon"], span, div, i')].find((n) => {
        if (n.contains(head) || head.contains(n)) return false;
        const r = n.getBoundingClientRect();
        const glyph = (n.textContent || '').trim();
        const iconish = n.tagName === 'svg' || n.tagName === 'IMG' || /icon/i.test(String(n.className && n.className.baseVal != null ? n.className.baseVal : n.className)) || (glyph.length > 0 && glyph.length <= 2 && /\p{Extended_Pictographic}/u.test(glyph));
        const media = n.tagName === 'svg' || n.tagName === 'IMG';
        return iconish && r.height > 8 && r.height <= 96 && (!media || r.width <= 96) && r.bottom <= head.getBoundingClientRect().top + 2;
      });
      return !!icon;
    });
  });
  if (tiles) push(3, 'REFLEX', `equal columns of icon-above-heading tiles (${name(tiles)})`, 'Vary the widths, set the icon inline with the heading, or drop the icons');

  const cv = document.createElement('canvas'); cv.width = cv.height = 1;
  const cx = cv.getContext('2d', { willReadFrequently: true });
  const rgb = (s) => { cx.clearRect(0, 0, 1, 1); cx.fillStyle = 'rgba(0, 0, 0, 0)'; cx.fillStyle = s; cx.fillRect(0, 0, 1, 1); const d = cx.getImageData(0, 0, 1, 1).data; return [d[0] / 255, d[1] / 255, d[2] / 255, d[3] / 255]; };
  const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const lum = (c) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
  const ratio = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
  const over = (c, b) => [0, 1, 2].map((i) => c[i] * c[3] + b[i] * (1 - c[3]));
  const bgOf = (n) => { for (; n && n !== document.documentElement; n = n.parentElement) { const c = rgb(getComputedStyle(n).backgroundColor); if (c[3] >= 0.9) return c; } const b = rgb(getComputedStyle(document.body).backgroundColor); return b[3] > 0 ? b : [1, 1, 1, 1]; };
  const weak = [];
  for (const f of all.filter((el) => /^(TEXTAREA|SELECT)$/.test(el.tagName) || (el.tagName === 'INPUT' && /^(text|email|search|tel|url|password|number|date|time)$/.test(el.type)))) {
    const fh = f.getBoundingClientRect().height;
    const around = bgOf(f.parentElement);
    let best = ratio(over(rgb(getComputedStyle(f).backgroundColor), around), around);
    for (let n = f, d = 0; n && d < 3 && n.getBoundingClientRect().height <= fh + 48; n = n.parentElement, d++) {
      const cs = getComputedStyle(n); const back = d ? bgOf(n.parentElement) : around;
      for (const s of ['Top', 'Right', 'Bottom', 'Left']) if (parseFloat(cs[`border${s}Width`]) >= 1 && cs[`border${s}Style`] !== 'none') best = Math.max(best, ratio(over(rgb(cs[`border${s}Color`]), back), back));
      for (const m of (cs.boxShadow || '').matchAll(/((?:rgba?|oklch|oklab|color)\([^)]*\)|#[0-9a-f]{3,8})\s+(-?[\d.]+)px\s+(-?[\d.]+)px\s+([\d.]+)px\s+(-?[\d.]+)px/gi)) if (+m[4] === 0 && (+m[5] >= 1 || Math.abs(+m[3]) >= 1)) best = Math.max(best, ratio(over(rgb(m[1]), back), back));
    }
    if (best < 2.95) weak.push(`${name(f)} ${best.toFixed(2)}:1`);
  }
  if (weak.length) push(40, 'FAIL', `a field's edge is under 3:1 against what surrounds it: ${weak.slice(0, 3).join(', ')}`, 'Draw the field in --color-muted, or fill it a step off the surface it sits on');

  const weights = new Map();
  const strained = [];
  const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let t = tw.nextNode(); t; t = tw.nextNode()) {
    const host = t.parentElement; const txt = t.textContent.trim();
    if (!txt || !host || quiet(host) || host.closest('svg') || !vis(host)) continue;
    const hs = getComputedStyle(host);
    const w = Math.round((parseFloat(hs.fontWeight) || 400) / 100) * 100;
    weights.set(w, (weights.get(w) || 0) + txt.length);
    if (strained.length >= 4 || txt.length < 3 || host.closest('sup, sub, [data-slot], figure svg') || strained.some((x) => x.el === host)) continue;
    const size = parseFloat(hs.fontSize) || 16;
    const prose = !!host.closest('p, li, dd, blockquote') && txt.length > 60 && size < 28;
    const lh = parseFloat(hs.lineHeight);
    if (size < 11 || (prose && size < 12)) strained.push({ el: host, why: `${name(host)} at ${Math.round(size * 10) / 10}px` });
    else if (prose && lh && lh / size < 1.3 && host.getBoundingClientRect().height > lh * 2.2) strained.push({ el: host, why: `${name(host)} leaded ${(lh / size).toFixed(2)}` });
  }
  if (strained.length) push(75, 'REFLEX', `text that strains the eye: ${strained.map((x) => x.why).join(', ')}`, 'Running text 12px or more (16px for body), functional text 11px or more, multi-line prose leaded 1.3 or more');
  const dead = [...document.querySelectorAll('img')].filter((el) => !quiet(el) && el.complete && el.naturalWidth === 0 && (el.currentSrc || el.getAttribute('src')));
  if (dead.length) push(76, 'FAIL', `an image that does not load: ${dead.slice(0, 3).map((el) => (el.getAttribute('src') || '').split('/').pop().slice(0, 40)).join(', ')}`, 'Point it at a file that exists, make it a data-slot placeholder, or remove it');
  const used = [...weights].filter(([, n]) => n >= 30).map(([w]) => w).sort((a, b) => a - b);
  if (used.length > 3) push('F19', 'WARN', `${used.length} font weights in running use (${used.join(', ')})`, 'Three weights at most, display and body together, picked as extremes');

  for (const g of all) {
    const cs = getComputedStyle(g);
    const grid = /grid/.test(cs.display);
    const wrap = /flex/.test(cs.display) && cs.flexWrap === 'wrap' && cs.flexDirection.startsWith('row');
    if ((!grid && !wrap) || g.closest('nav, footer, form')) continue;
    const kids = [...g.children].filter((c) => vis(c) && !/absolute|fixed/.test(getComputedStyle(c).position));
    if (kids.length < 3) continue;
    const rects = kids.map((c) => c.getBoundingClientRect());
    if (grid && Math.max(...rects.map((r) => r.width)) > Math.min(...rects.map((r) => r.width)) * 1.15) continue;
    if (wrap && !kids.every((c) => c.querySelector('img, svg') || /^(IMG|svg)$/.test(c.tagName) || c.getBoundingClientRect().width >= 120)) continue;
    const rows = [];
    for (const r of rects) { const row = rows.find((x) => Math.abs(x.top - r.top) < 4); if (row) row.n++; else rows.push({ top: r.top, n: 1 }); }
    rows.sort((a, b) => a.top - b.top);
    if (rows.length >= 2 && rows[rows.length - 1].n === 1 && rows[rows.length - 2].n >= 2) { push('F20', 'WARN', `${name(g)} leaves one item alone on its last row (${rows.map((x) => x.n).join(' + ')})`, 'Change the count or the columns so the last row is not an orphan'); break; }
  }
  return out;
}

export async function observeOcclusion() {
  const out = [];
  const vis = (el) => { const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return false; const r = el.getBoundingClientRect(); return r.width > 3 && r.height > 3; };
  const pinned = (el) => { for (let p = el; p && p !== document.body; p = p.parentElement) if (/fixed|sticky/.test(getComputedStyle(p).position)) return true; return false; };
  const unseen = (el) => { const cs = getComputedStyle(el); return parseFloat(cs.opacity) < 0.05 || (/^(transparent|rgba\(0, 0, 0, 0\))$/.test(cs.backgroundColor) && cs.backgroundImage === 'none' && !(el.innerText || '').trim() && !/^(IMG|svg|CANVAS|VIDEO|PICTURE)$/.test(el.tagName) && !el.querySelector('img, svg, canvas, video')); };
  const runs = [];
  let total = 0, hidden = 0;
  const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let t = tw.nextNode(); t; t = tw.nextNode()) {
    const host = t.parentElement; const txt = t.textContent.trim();
    if (!txt || !host || host.closest('script, style, noscript, svg, [aria-hidden="true"], nav, header, dialog, [popover], [role="menu"], details:not([open]), [hidden]')) continue;
    if (getComputedStyle(host).display === 'none') continue;
    total += txt.length;
    let gone = false;
    for (let p = host; p && p !== document.body; p = p.parentElement) { const cs = getComputedStyle(p); if (cs.display === 'none') { gone = null; break; } if (cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) gone = true; }
    if (gone === null) { total -= txt.length; continue; }
    if (gone) { hidden += txt.length; continue; }
    if (!host.closest('[data-slot]') && vis(host)) runs.push({ t, host });
  }
  if (total > 500 && hidden > 150 && hidden / total > 0.3) out.push({ gate: '62', grade: 'FAIL', evidence: `${Math.round((100 * hidden) / total)}% of the page's text is still hidden after load`, fix: 'Visible by default: scope the hidden state under a .js class, or show the end state under reduced motion' });
  const bad = [];
  const H = document.documentElement.scrollHeight;
  for (let y = 0; y < H && bad.length < 3; y += Math.max(200, innerHeight - 100)) {
    window.scrollTo(0, y);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    for (const { t, host } of runs) {
      if (bad.length >= 3) break;
      if (pinned(host)) continue;
      const rg = document.createRange(); rg.selectNodeContents(t);
      for (const q of rg.getClientRects()) {
        if (q.width < 6 || q.height < 6) continue;
        const cx = q.left + q.width / 2, cy = q.top + q.height / 2;
        if (cy < 0 || cy >= innerHeight || cx < 0 || cx >= innerWidth) continue;
        const ghost = getComputedStyle(host).pointerEvents === 'none'; if (ghost) host.style.setProperty('pointer-events', 'auto', 'important');
        const top = document.elementFromPoint(cx, cy);
        if (ghost) host.style.removeProperty('pointer-events');
        if (!top || top === host || host.contains(top) || top.contains(host) || pinned(top) || unseen(top)) continue;
        const tr = top.getBoundingClientRect();
        if (!(cx >= tr.left && cx <= tr.right && cy >= tr.top && cy <= tr.bottom)) {
          const clearPseudo = (ps) => /^(none|normal)$/.test(ps.content) || (/^(transparent|rgba\(0, 0, 0, 0\))$/.test(ps.backgroundColor) && ps.backgroundImage === 'none');
          if (clearPseudo(getComputedStyle(top, '::after')) && clearPseudo(getComputedStyle(top, '::before'))) continue;
        }
        bad.push(`${top.tagName.toLowerCase()}${top.classList[0] ? '.' + top.classList[0] : ''} over "${t.textContent.trim().slice(0, 16)}"`);
        break;
      }
    }
  }
  window.scrollTo(0, 0);
  if (bad.length) out.push({ gate: '73', grade: 'FAIL', evidence: `text painted under another element: ${bad.join('; ')}`, fix: 'Give the text its own space, or put it above what covers it on a surface of its own' });
  return out;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const htmls = process.argv.slice(2).filter((p) => p.endsWith('.html'));
  const res = await renderCheck(process.argv.slice(2).filter((p) => isUrl(p)).concat(htmls.map((p) => resolve(process.cwd(), p))));
  console.log(JSON.stringify(res, null, 2));
  process.exit(0);
}
