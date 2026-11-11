/** HTML browser diagnostics; adapted from the original Synapse HTML skill. */


export function lineBreaks() {
  const out = [];
  const vis = (el) => { const s = getComputedStyle(el); if (s.display === 'none' || s.visibility === 'hidden' || parseFloat(s.opacity) === 0) return false; const r = el.getBoundingClientRect(); return r.width > 1 && r.height > 1; };
  const lines = (el) => {
    const rows = [];
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let t = w.nextNode(); t; t = w.nextNode()) {
      if (!t.textContent.trim() || t.parentElement.closest('svg, [aria-hidden="true"]')) continue;
      const rg = document.createRange(); rg.selectNodeContents(t);
      for (const q of rg.getClientRects()) {
        if (!q.width || !q.height) continue;
        const row = rows.find((x) => Math.abs(x.mid - (q.top + q.height / 2)) < q.height / 3);
        if (row) { row.l = Math.min(row.l, q.left); row.r = Math.max(row.r, q.right); } else rows.push({ mid: q.top + q.height / 2, l: q.left, r: q.right });
      }
    }
    return rows.sort((a, b) => a.mid - b.mid).map((x) => x.r - x.l);
  };
  const bad = [];
  for (const e of document.querySelectorAll('p, li, blockquote, h1, h2, h3')) {
    if (bad.length >= 3 || !vis(e) || e.closest('nav, footer, svg, pre, code, table, [aria-hidden="true"], [data-slot]') || e.querySelector('br')) continue;
    const text = (e.innerText || '').trim(); const words = text.split(/\s+/).length;
    if (words < 4 || e.getBoundingClientRect().width < 200) continue;
    const cs = getComputedStyle(e); const wrap = `${cs.textWrap || ''} ${cs.textWrapStyle || ''}`;
    if (/flex|grid|table/.test(cs.display) || [...e.children].some((c) => /flex|grid|block|table/.test(getComputedStyle(c).display))) continue;
    const ls = lines(e); if (ls.length < 2) continue;
    const last = ls[ls.length - 1], widest = Math.max(...ls), prev = ls[ls.length - 2];
    const head = /^H[123]$/.test(e.tagName);
    if (head && ls.length <= 3 && !/balance/.test(wrap) && last < prev * 0.35) bad.push(`${e.tagName.toLowerCase()} "${text.replace(/\s+/g, ' ').slice(0, 32)}" ends on a stub`);
    else if (!head && !/pretty|balance/.test(wrap) && !/\s/.test(text.split(/\s+/).slice(-1)[0]) && last < widest * 0.3 && ls.length >= 2 && (e.innerText || '').trim().split('\n').pop().trim().split(/\s+/).length === 1) bad.push(`"${text.replace(/\s+/g, ' ').slice(0, 32)}" leaves one word on its last line`);
  }
  if (bad.length) out.push({ gate: 'F26', grade: 'WARN', evidence: `[${innerWidth}px] ${bad.join('; ')}`, fix: 'text-wrap: balance on heads and pretty on body copy, or rewrite the line; a <br> goes only between phrases and is checked at 375' });
  return out;
}

export function observeSpace(atLaptop, heroOnly, heroPosture, photoShape, job) {
  const freeFold = /^(poster|ledge|banner|custom)$/.test(heroPosture || '');
  const out = [];
  const push = (gate, grade, evidence, fix) => out.push({ gate: String(gate), grade, evidence, fix });
  const vw = window.innerWidth, vh = window.innerHeight;
  const vis = (el) => { const s = getComputedStyle(el); if (s.display === 'none' || s.visibility === 'hidden' || parseFloat(s.opacity) === 0) return false; const r = el.getBoundingClientRect(); return r.width > 1 && r.height > 1; };
  const abs = (el) => { const r = el.getBoundingClientRect(); return { top: r.top + scrollY, bottom: r.bottom + scrollY, left: r.left, right: r.right, w: r.width, h: r.height }; };
  let secs = [...document.querySelectorAll('section, main > div, footer')].filter((s) => vis(s) && s.getBoundingClientRect().height > 40);
  secs = secs.filter((s) => !secs.some((o) => o !== s && o.contains(s)));
  const h1 = document.querySelector('h1');
  const heroish = (el) => /^(SECTION|HEADER)$/.test(el.tagName) || [...el.classList].some((c) => /^hero(-[\w-]+)?$/i.test(c) || /(^|-)hero$/i.test(c));
  let hero = null;
  for (let n = h1; n && n !== document.body; n = n.parentElement) if (heroish(n)) { hero = n; break; }
  hero = hero || [...document.querySelectorAll('section, header, [class]')].find(heroish) || secs[0];
  const heroEnd = hero ? abs(hero).bottom : null;

  let stack = 0, textBox = null, fig = null;
  if (hero && h1) {
    const cta = [...hero.querySelectorAll('a, button')].filter((c) => vis(c) && (c.textContent || '').trim() && !c.closest('nav'))[0];
    const ctaTop = cta ? abs(cta).top : Infinity;
    const texts = [...hero.querySelectorAll('h1, h2, p, small, [class*="sub"], [class*="lede"], [class*="eyebrow"], [class*="kicker"], [class*="label"]')].filter((e) => vis(e) && (e.innerText || '').trim() && !e.closest('nav, svg, table, figure, [data-slot], form, fieldset, label, output, [role="tabpanel"], [role="group"]') && abs(e).top < ctaTop);
    const seen = [];
    for (const e of texts) { if (seen.some((o) => o.contains(e) || e.contains(o))) continue; seen.push(e); }
    stack = seen.length;
    const ink = (el) => { let L = Infinity, T = Infinity, R = -Infinity, B = -Infinity; const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); for (let t = w.nextNode(); t; t = w.nextNode()) { if (!t.textContent.trim() || t.parentElement.closest('svg')) continue; const rg = document.createRange(); rg.selectNodeContents(t); for (const q of rg.getClientRects()) { if (!q.width || !q.height) continue; L = Math.min(L, q.left); T = Math.min(T, q.top); R = Math.max(R, q.right); B = Math.max(B, q.bottom); } } return L === Infinity ? abs(el) : { top: T + scrollY, bottom: B + scrollY, left: L, right: R }; };
    const boxes = [h1, ...seen.filter((e) => Math.abs(abs(e).left - abs(h1).left) < 40)].map(ink);
    textBox = { top: Math.min(...boxes.map((b) => b.top)), bottom: Math.max(...boxes.map((b) => b.bottom), cta ? abs(cta).bottom : 0), left: Math.min(...boxes.map((b) => b.left)), right: Math.max(...boxes.map((b) => b.right)) };
    let bestA = 0;
    const clipped = (el) => { const r = el.getBoundingClientRect(); let L = r.left, T = r.top, R = r.right, B = r.bottom; for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) { const cs = getComputedStyle(p); if (/hidden|clip/.test(`${cs.overflow} ${cs.overflowX} ${cs.overflowY}`)) { const q = p.getBoundingClientRect(); L = Math.max(L, q.left); T = Math.max(T, q.top); R = Math.min(R, q.right); B = Math.min(B, q.bottom); } } R = Math.min(R, vw); return { top: T + scrollY, bottom: B + scrollY, left: L, right: R, w: Math.max(0, R - L), h: Math.max(0, B - T) }; };
    const beside = (b) => b.left >= textBox.right - 40 || b.right <= textBox.left + 40;
    const consider = (e) => {
      if (!vis(e) || e.closest('nav') || e.contains(h1) || seen.some((t) => e.contains(t))) return;
      const b = clipped(e); const a = b.w * b.h;
      if (b.w > 160 && b.h > 120 && a > bestA && b.w < vw * 0.95 && beside(b)) { fig = b; fig.el = e; bestA = a; }
    };
    for (const e of hero.querySelectorAll('svg, canvas, img, figure, video, picture, [data-slot], [class*="fig"], [class*="visual"], [class*="device"], [class*="demo"], [class*="shot"], [class*="illus"], [class*="panel"]')) consider(e);
    if (!fig) {
      const heroBg = getComputedStyle(hero).backgroundColor;
      for (const e of hero.querySelectorAll('div, span, aside, i, b')) {
        const cs = getComputedStyle(e);
        if (cs.backgroundImage !== 'none' || (cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== heroBg) || parseFloat(cs.borderTopWidth) > 0) consider(e);
      }
    }
    if (fig) {
      fig.side = fig.left >= textBox.right - 40 ? 'right' : 'left';
      let lca = h1.parentElement;
      while (lca && !lca.contains(fig.el)) lca = lca.parentElement;
      let col = h1;
      while (col.parentElement && col.parentElement !== lca) col = col.parentElement;
      const cb = abs(col);
      fig.colEdge = fig.side === 'right' ? Math.max(textBox.right, cb.right) : Math.min(textBox.left, cb.left);
    }
  }

  if (atLaptop) {

    const words = [];
    const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = tw.nextNode())) {
      const p = n.parentElement; if (!p || !vis(p) || p.closest('script, style, noscript, svg, [data-slot], [data-credits]')) continue;
      const t = n.textContent.trim(); if (!t) continue;
      const pr = p.getBoundingClientRect(); const c = t.split(/\s+/).filter((w) => /[A-Za-z]{2,}/.test(w)).length; if (c) words.push({ top: pr.top + scrollY, bottom: pr.bottom + scrollY, c });
    }
    const H = document.documentElement.scrollHeight;
    let maxWords = 0, at = 0;
    for (let y = 0; y < H; y += 50) { const w = Math.round(words.reduce((a, x) => { const h = Math.max(1, x.bottom - x.top); const ov = Math.max(0, Math.min(x.bottom, y + 900) - Math.max(x.top, y)); return a + x.c * Math.min(1, ov / h); }, 0)); if (w > maxWords) { maxWords = w; at = y; } }
    if (maxWords > 95) push(58, 'FAIL', `${maxWords} words on one screen (from y=${at})`, 'One idea per screen: cut to about 80 words, make the section an object');
    else if (maxWords > 80) push(58, 'WARN', `${maxWords} words on one screen (from y=${at})`, 'Close to the 80-word screen budget');
    if (stack > 2) push(58, 'FAIL', `hero carries ${stack} text blocks before its actions`, 'Headline, one sentence, actions; delete the rest');

    const clipAbs = (el, stop) => { const r0 = el.getBoundingClientRect(); let T = r0.top, B = r0.bottom; for (let q = el.parentElement; q && q !== document.body; q = q.parentElement) { const cs = getComputedStyle(q); if (/hidden|clip/.test(`${cs.overflow} ${cs.overflowY}`)) { const qr = q.getBoundingClientRect(); T = Math.max(T, qr.top); B = Math.min(B, qr.bottom); } if (q === stop) break; } return { top: T + scrollY, bottom: B + scrollY }; };
    const content = (s) => { let top = Infinity, bottom = -Infinity; for (const c of s.querySelectorAll('*')) { if (!vis(c)) continue; if (!(c.innerText || '').trim() && !/^(SVG|IMG|CANVAS|VIDEO)$/.test(c.tagName) && getComputedStyle(c).backgroundColor === 'rgba(0, 0, 0, 0)') continue; if (c.children.length && ![...c.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && !/^(SVG)$/.test(c.tagName) && getComputedStyle(c).backgroundColor === 'rgba(0, 0, 0, 0)') continue; const b = clipAbs(c, s); if (b.bottom <= b.top) continue; top = Math.min(top, b.top); bottom = Math.max(bottom, b.bottom); } if (top === Infinity) { const b = abs(s); return b; } return { top, bottom }; };
    // a paper is a colour or a painted image (a gradient, a split ground), whichever the nearest box sets
    const paperOf = (el) => { for (let q = el; q; q = q.parentElement) { const cs = getComputedStyle(q), c = cs.backgroundColor; if (/gradient|url\(/.test(cs.backgroundImage)) return `${c}|${cs.backgroundImage}`; if (!/^(transparent|rgba\(0, 0, 0, 0\))$/.test(c)) return c; } return 'none'; };
    const gaps = [], shifts = [];
    for (let i = 0; !heroOnly && i < secs.length - 1; i++) { gaps.push(Math.round(content(secs[i + 1]).top - content(secs[i]).bottom)); shifts.push(paperOf(secs[i]) !== paperOf(secs[i + 1])); }
    const real = gaps.filter((g) => g > -50);
    const short = gaps.filter((g, i) => g > -50 && g < (shifts[i] ? 64 : 112));
    if (real.length) {
      const min = short.length ? Math.min(...short) : Infinity;
      if (short.length) push(59, 'REFLEX', `smallest gap between sections is ${min}px (gaps: ${real.join(', ')})`, '120px or more between sections, by the --section-gap steps');
      else if (real.length > 2 && new Set(real).size === 1) push(59, 'REFLEX', `every section gap is ${min}px`, 'Vary the rhythm across --section-gap-s, --section-gap and --section-gap-l');
    }
    if (!heroOnly && secs.length > 9) push(59, 'WARN', `${secs.length} sections`, 'Six to nine sections a page, hero and footer included; merge or cut');
    else if (!heroOnly && secs.length < 5) push(77, 'WARN', `${secs.length} sections, hero and footer included`, 'A landing strip, not a page: six to nine sections, five on a thin prompt (layout.md § 3)');
    if (!heroOnly) {
      for (const sl of document.querySelectorAll('[data-slot]')) {
        const cs = getComputedStyle(sl);
        if (cs.display === 'none' || cs.visibility === 'hidden' || !sl.getClientRects().length || sl.closest('[hidden]')) continue;
        const r = sl.getBoundingClientRect();
        if (r.width < 40 || r.height < 40) { push('F18', 'WARN', `slot "${sl.getAttribute('data-slot')}" renders at ${Math.round(r.width)} x ${Math.round(r.height)}px`, 'The slot collapsed: give it a width from its track and a real aspect-ratio, never a percentage of a shrink-to-fit parent'); break; }
      }
      for (const e of document.querySelectorAll('p, li, dd, td, th, h2, h3, h4, figcaption, blockquote')) {
        if (!vis(e) || e.closest('nav, svg, [aria-hidden="true"]')) continue;
        const t = (e.innerText || '').trim();
        if (t.length < 24) continue;
        const cs = getComputedStyle(e);
        const fs = parseFloat(cs.fontSize) || 16;
        const lh = parseFloat(cs.lineHeight) || fs * 1.4;
        const r = e.getBoundingClientRect();
        if (r.width < fs * 8 && r.height / lh >= 3.6) { push('F17', 'WARN', `"${t.slice(0, 28)}" squeezed to ${Math.round(r.width)}px wide over ${Math.round(r.height / lh)} lines (${e.tagName.toLowerCase()}${e.classList[0] ? '.' + e.classList[0] : ''})`, 'A grid placement or a span ran wide; give the text its column back'); break; }
      }
    }

    const nameOf = (e) => `${e.tagName.toLowerCase()}${e.getAttribute('data-slot') ? `[data-slot=${e.getAttribute('data-slot')}]` : e.classList[0] ? '.' + e.classList[0] : ''}`;
    const dataish = /chart|graph|plot|spark|map|diagram|logo|wordmark|brand|icon|flag|qr|avatar/i;
    const drawn = [];
    for (const svg of document.querySelectorAll('svg')) {
      if (!vis(svg) || svg.parentElement.closest('svg')) continue;
      const r = svg.getBoundingClientRect();
      if (r.width < 120 || r.height < 120) continue;
      let named = false;
      for (let q = svg; q && q !== document.body && !named; q = q.parentElement) named = dataish.test(`${typeof q.className === 'string' ? q.className : (q.className && q.className.baseVal) || ''} ${q.id || ''} ${q.getAttribute('aria-label') || ''} ${q.getAttribute('data-kind') || ''}`);
      if (named || svg.querySelector('text')) continue;
      const shapes = [...svg.querySelectorAll('path, ellipse, circle, polygon')];
      const curvy = shapes.filter((s) => s.tagName === 'ellipse' || s.tagName === 'circle' && parseFloat(s.getAttribute('r') || 0) > 6 || /[CcQqSsAa]/.test(s.getAttribute('d') || '')).length;
      const fills = new Set(shapes.map((s) => getComputedStyle(s).fill).filter((f) => f && f !== 'none'));
      if (curvy >= 3 || (shapes.length >= 6 && fills.size >= 3)) drawn.push(`${nameOf(svg.parentElement || svg)} (${Math.round(r.width)}x${Math.round(r.height)}, ${shapes.length} shapes)`);
    }
    if (drawn.length) push(80, 'REFLEX', `drawn illustration: ${drawn.slice(0, 3).join('; ')}`, 'A photograph (theme.mjs photos), the product built, or type at scale; SVG is for icons, logos and labelled charts or diagrams (imagery.md § 7)');

    const empty = [];
    const shows = (box) => {
      const b = box.getBoundingClientRect();
      let area = 0;
      for (const m of box.querySelectorAll('img, video, picture, canvas, iframe, svg')) { if (!vis(m) || (m.tagName.toLowerCase() === 'svg' && m.parentElement.closest('svg'))) continue; if (m.tagName === 'IMG' && !(m.getAttribute('src') || m.getAttribute('srcset') || '').trim()) continue; const q = m.getBoundingClientRect(); area += q.width * q.height; if (area >= b.width * b.height * 0.25) return true; }
      const bits = [...box.querySelectorAll('*')].filter((e) => vis(e) && ((e.innerText || '').trim() || /^(INPUT|SELECT|TEXTAREA|BUTTON)$/.test(e.tagName)) && !e.children.length);
      return bits.length >= 4 || (box.innerText || '').trim().length >= 80 || box.matches('[data-kind="product"]') || !!box.closest('[data-kind="product"]');
    };
    for (const sl of document.querySelectorAll('[data-slot]')) { if (!vis(sl) || sl.closest('[hidden]')) continue; const r = sl.getBoundingClientRect(); if (r.width < 160 || r.height < 120) continue; if (!shows(sl)) empty.push(`${nameOf(sl)} ${Math.round(r.width)}x${Math.round(r.height)}`); }
    for (const e of document.querySelectorAll('div, figure, span, i, aside')) {
      if (e.hasAttribute('data-slot') || e.closest('[data-slot]') || !vis(e)) continue;
      const r = e.getBoundingClientRect(); const cs = getComputedStyle(e);
      if (r.width < 300 || r.height < 200 || r.width > vw * 0.9 || !/gradient/.test(cs.backgroundImage) || /url\(/.test(cs.backgroundImage)) continue;
      if ((e.innerText || '').trim().length > 60 || e.querySelector('img, video, canvas, svg, picture, input, table')) continue;
      if (!shows(e)) empty.push(`${nameOf(e)} ${Math.round(r.width)}x${Math.round(r.height)}, a gradient with nothing in it`);
    }
    if (empty.length) push(81, 'REFLEX', `${empty.length} empty picture${empty.length > 1 ? 's' : ''}: ${empty.slice(0, 3).join('; ')}`, 'Put the picture in: the user\'s image, a library photograph (theme.mjs photos) or the product built at full fidelity; the wash is only a loading colour (imagery.md § 3)');

    const marks = [];
    const colourOf = (e) => { const cs = getComputedStyle(e); return e instanceof SVGElement ? `${cs.fill}|${cs.stroke}` : `${cs.backgroundColor}|${cs.borderTopColor}|${cs.color}`; };
    for (const p of document.querySelectorAll('*')) {
      if (p.children.length < 24 || !vis(p)) continue;
      const kids = [...p.children].filter((k) => !/^(defs|title|desc|style|script)$/i.test(k.tagName));
      if (kids.length < 24) continue;
      const small = kids.filter((k) => { const q = k.getBoundingClientRect(); return !(k.textContent || '').trim() && q.width > 0 && q.height > 0 && ((q.width <= 24 && q.height <= 48) || q.width <= 6 || q.height <= 6); });
      if (small.length < 24 || small.length < kids.length * 0.8) continue;
      const tally = new Map(); for (const k of small) { const c = colourOf(k); tally.set(c, (tally.get(c) || 0) + 1); }
      if (Math.max(...tally.values()) < small.length * 0.6 || tally.size > 4) continue;
      const sizes = small.map((k) => { const q = k.getBoundingClientRect(); return Math.round(q.width) * 1000 + Math.round(q.height); });
      const common = Math.max(...[...new Set(sizes)].map((s) => sizes.filter((x) => x === s).length));
      if (common < small.length * 0.7) continue;
      if (marks.some((m) => m.el.contains(p) || p.contains(m.el))) continue;
      marks.push({ el: p, text: `${nameOf(p)} holds ${small.length} identical marks` });
    }
    const ONE_FOR_EACH = /\bone (?:mark|dot|stroke|tick|line|square|bar|cell|pin|block|circle|seed|bead|stripe|notch)s? (?:for|per) (?:each|every)\b/i;
    const ONE_FOR_EACH_BARE = /\bone (?:for|per) (?:each|every)\b/i;
    for (const e of document.querySelectorAll('[aria-label], figcaption, svg title, p, small, span')) {
      if (marks.length >= 2) break;
      const t = `${e.getAttribute('aria-label') || ''} ${(e.textContent || '').length < 160 ? e.textContent : ''}`;
      const counting = ONE_FOR_EACH.test(t) || (ONE_FOR_EACH_BARE.test(t) && (e.matches('figcaption') || (e.getAttribute('aria-label') && e.closest('svg, figure, [role="img"]'))));
      if (counting && !marks.some((m) => m.el.contains(e))) marks.push({ el: e, text: `"${t.trim().slice(0, 60)}"` });
    }
    if (marks.length) push(82, 'REFLEX', `counting device: ${marks.slice(0, 2).map((m) => m.text).join('; ')}`, 'Set the number in type at the size it deserves; never one mark for each thing (imagery.md § 7)');

    if (heroEnd != null) {
      const foot = [...document.querySelectorAll('body footer, [role="contentinfo"]')].filter(vis).pop();
      const docH = foot ? Math.min(document.documentElement.scrollHeight, abs(foot).top) : document.documentElement.scrollHeight, from = Math.max(heroEnd, vh);
      const box = document.querySelector('.container') || document.body;
      const cw = Math.min(box.getBoundingClientRect().width || vw, vw);
      let area = 0, n = 0;
      const seenA = [];
      const add = (el) => { if (!vis(el) || el.closest('footer') || seenA.some((o) => o.contains(el))) return; const b = abs(el); const top = Math.max(b.top, from), bot = Math.min(b.bottom, docH); if (bot - top < 80 || b.w < 160) return; seenA.push(el); area += (bot - top) * Math.min(b.w, cw); n++; };
      for (const m of document.querySelectorAll('img, video')) { if (m.closest('[data-kind="product"], [data-product]')) continue; const nw = m.naturalWidth || m.videoWidth || 0; if (m.tagName === 'IMG' && /\.svg(\?|$)/i.test(m.currentSrc || m.src || '')) continue; if (m.tagName === 'IMG' && nw && nw < 200) continue; add(m); }
      for (const e of document.querySelectorAll('section *, main *')) { const bi = getComputedStyle(e).backgroundImage; if (/url\(/.test(bi) && !/svg|data:image\/svg/i.test(bi)) add(e); }
      const share = area / Math.max(1, (docH - from) * cw);
      if (share > (photoShape ? 0.45 : 0.36) && n >= 3) push(83, 'REFLEX', `photographs cover ${Math.round(share * 100)}% of the page below the hero (${n} pictures${photoShape ? ', a photograph-led shape' : ''})`, 'Balance the page: cut or shrink pictures until they cover a quarter to a third of it, and carry the freed sections in type, figures, the product or a list (imagery.md § 5)');
    }
    if (heroEnd != null && !/subscribe|join|attend|listen|visit|newsletter|waitlist/.test(job || '')) {
      const foot = [...document.querySelectorAll('body footer, [role="contentinfo"]')].filter(vis).pop();
      const before = foot ? secs.filter((x) => x !== foot && abs(x).bottom <= abs(foot).top + 2).pop() : secs[secs.length - 1];
      // a form whose submit books, asks or requests is the job's own action, not a mailing list
      const asks = (f) => { const t = [...f.querySelectorAll('button, input[type=submit]')].map((b) => b.innerText || b.value || '').join(' '); return /\b(book|enquir|inquir|request|contact|walkthrough|demo|quote|reserve|apply|start|create|order|buy|download|try)/i.test(t) && !/newsletter|updates|subscribe|the list|mailing/i.test(t); };
      const signup = (box) => box && [...box.querySelectorAll('form, [role="form"]')].find((f) => { if (asks(f)) return false; const fields = [...f.querySelectorAll('input:not([type=hidden]):not([type=submit]):not([type=checkbox]):not([type=radio]), textarea, select')].filter(vis); return fields.length >= 1 && fields.length <= 2 && fields.some((x) => x.type === 'email' || /e-?mail/i.test(`${x.name} ${x.id} ${x.placeholder} ${x.getAttribute('autocomplete') || ''}`)); });
      const hit = signup(before) || signup(foot);
      if (hit) push(85, 'REFLEX', `the page closes on an email sign-up${job ? ` on a ${job} page` : ' and the stamp names no job'}`, 'End on what the visitor came to do (the booking, the buy box, the download, the next date, the latest issue) or on the last strong section; an email close is for a subscribe or join page, and the stamp says job: (anatomy.md)');
    }

    let heroFoot = null;
    if (hero && !/^(poster|ledge)$/.test(heroPosture || '')) {
      const hb = abs(hero);
      let cTop = Infinity, cBottom = -Infinity;
      for (const c of hero.querySelectorAll('*')) {
        // the site nav is not hero content; a nav lower in the hero (a band of section links) is
        const nv = c.closest('nav');
        if (!vis(c) || (nv && abs(nv).top <= hb.top + 220) || c === hero) continue;
        const cs = getComputedStyle(c);
        const painted = (c.innerText || '').trim() || /^(SVG|IMG|CANVAS|VIDEO|PICTURE)$/.test(c.tagName) || cs.backgroundColor !== 'rgba(0, 0, 0, 0)' || cs.backgroundImage !== 'none' || parseFloat(cs.borderTopWidth) > 0;
        if (!painted || /fixed|sticky/.test(cs.position)) continue;
        const b = abs(c); cTop = Math.min(cTop, b.top); cBottom = Math.max(cBottom, Math.min(b.bottom, hb.bottom));
      }
      let navBottom = hb.top;
      for (const n of document.querySelectorAll('header, nav, [class*="nav"], [class*="bar"]')) { if (!vis(n) || hero.contains(n) && !/fixed|sticky/.test(getComputedStyle(n).position)) continue; const cs = getComputedStyle(n); const b = abs(n); if ((/fixed|sticky/.test(cs.position) || hero.contains(n)) && b.top <= hb.top + 40 && b.bottom < hb.top + 220) navBottom = Math.max(navBottom, b.bottom); }
      const after = secs.find((x) => x !== hero && !hero.contains(x) && abs(x).top >= hb.bottom - 4);
      const bottomEdge = after ? Math.min(content(after).top, hb.bottom + 240) : hb.bottom;
      const topPad = cTop - navBottom, bottomPad = bottomEdge - cBottom;
      if (heroPosture !== 'custom' && isFinite(topPad) && isFinite(bottomPad) && topPad > 24 && bottomPad < topPad - 8) push('44a', 'REFLEX', `hero content sits low: ${Math.round(topPad)}px above it, ${Math.round(bottomPad)}px below`, 'Centre the content in its screen: the space below 1.0 to 1.5 times the space above (a Ledge sits low on purpose; say Ledge in the stamp)');
      heroFoot = { cBottom, navBottom };
    }
    if (heroEnd != null && !freeFold) {
      if (heroEnd > vh + 8) push('44c', 'REFLEX', `hero runs past the 1440x900 fold (hero ends at ${Math.round(heroEnd)}px)`, 'Size the display and the visual so the hero is one screen');
      else if (heroEnd < vh * 0.84 && secs.length > 1) push('44c', 'REFLEX', `hero ends at ${Math.round(heroEnd)}px of a 900px screen`, 'Fill the first screen with the visual or the headline, not with copy');
    }
    if (fig && textBox && !freeFold) {
      const off = Math.round((fig.top + fig.bottom) / 2 - (textBox.top + textBox.bottom) / 2);
      const gap = Math.round(fig.side === 'right' ? fig.left - fig.colEdge : fig.colEdge - fig.right);
      const edge = Math.round(fig.side === 'right' ? vw - fig.right : fig.left);
      if (Math.abs(off) > 60) push('44c', 'REFLEX', `hero visual centre is ${off}px from the text block centre`, 'Align the visual beside the text');
      const inkGap = Math.round(fig.side === 'right' ? fig.left - textBox.right : textBox.left - fig.right);
      if (inkGap > 240 && gap <= 120) push('44c', 'REFLEX', `hero text ends ${inkGap}px short of its visual`, 'Widen the text column or bring the visual in: the text and the visual stand 48 to 120px apart (layout.md § 6)');
      if (gap > 120 || (edge < 8 && gap > 48 && heroPosture !== 'stage')) push('44c', 'REFLEX', `hero visual sits ${gap}px from the text and ${edge}px from the viewport edge`, 'Bring the visual to within 48 to 120px of the text; never pin it to the corner');
    }

    if (heroFoot && hero && isFinite(heroFoot.cBottom)) {
      const hb = abs(hero);
      const after = secs.find((x) => x !== hero && !hero.contains(x) && abs(x).top >= hb.bottom - 4);
      const nextTop = after ? content(after).top : Infinity;
      const band = Math.round(Math.min(vh, nextTop) - heroFoot.cBottom);
      if (heroFoot.cBottom < vh && band > 160) push(79, 'REFLEX', `${band}px of nothing between the hero's last content (y ${Math.round(heroFoot.cBottom)}) and ${nextTop < vh ? 'the next section' : 'the fold'}`, 'Centre the content in the screen and grow the visual or the head (layout.md § 6); never fill it with copy');
    }

    if (!heroOnly) {
      const below = secs.filter((x) => x !== hero && !(hero && (hero.contains(x) || x.contains(hero))) && x.tagName !== 'FOOTER' && !x.closest('footer, nav') && (!hero || abs(x).top >= abs(hero).bottom - 4));
      const leavesOf = (root) => {
        const out = [];
        const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        for (let t = w.nextNode(); t; t = w.nextNode()) { if (!t.textContent.trim()) continue; const p = t.parentElement; if (!p || !vis(p) || p.closest('script, style, noscript')) continue; const rg = document.createRange(); rg.selectNodeContents(t); for (const q of rg.getClientRects()) if (q.width > 1 && q.height > 1) out.push({ top: q.top + scrollY, bottom: q.bottom + scrollY, left: q.left, right: q.right }); }
        for (const e of root.querySelectorAll('*')) {
          if (!vis(e) || (e.closest('svg') && e.tagName.toLowerCase() !== 'svg')) continue;
          const cs = getComputedStyle(e);
          const painted = /^(IMG|SVG|CANVAS|VIDEO|PICTURE|IFRAME|INPUT|TEXTAREA|SELECT|TABLE)$/i.test(e.tagName) || e.hasAttribute('data-slot') || cs.backgroundImage !== 'none' || cs.backgroundColor !== 'rgba(0, 0, 0, 0)' || (parseFloat(cs.borderTopWidth) || 0) + (parseFloat(cs.borderBottomWidth) || 0) + (parseFloat(cs.borderLeftWidth) || 0) + (parseFloat(cs.borderRightWidth) || 0) >= 2;
          if (!painted) continue;
          const b = e.getBoundingClientRect(); if (b.width * b.height < 64 || (b.width > vw * 0.97 && !/^(IMG|PICTURE|VIDEO|CANVAS|SVG)$/i.test(e.tagName) && !e.hasAttribute('data-slot'))) continue;
          out.push({ top: b.top + scrollY, bottom: b.bottom + scrollY, left: b.left, right: b.right });
        }
        return out;
      };
      // content a rail scrolls past the screen's edge does not widen the page's measure
      const span = (ls) => ls.filter((b) => b.right > 0 && b.left < vw).reduce((a, b) => ({ left: Math.min(a.left, Math.max(0, b.left)), right: Math.max(a.right, Math.min(vw, b.right)) }), { left: Infinity, right: -Infinity });
      const all = span([...(hero ? [hero] : []), ...below].flatMap(leavesOf));
      const W = all.right - all.left;
      const h1fs = h1 ? parseFloat(getComputedStyle(h1).fontSize) : 0;
      const heads = below.flatMap((x) => [...x.querySelectorAll('h2')]).filter((h) => vis(h) && !h.closest('nav, footer'));
      if (heads.length) {
        const sizes = heads.map((h) => parseFloat(getComputedStyle(h).fontSize)).sort((a, b) => a - b);
        const med = sizes[Math.floor(sizes.length / 2)];
        if (med < 40) push(78, 'REFLEX', `section heads render at ${Math.round(med)}px${h1fs ? ` under a ${Math.round(h1fs)}px hero head` : ''}`, 'h2 at --text-section (about 52px at 1440), item titles at --text-title (layout.md § 2)');
      }
      const thin = [];
      let bands = 0;
      if (W > 400) for (const sec of below) {
        const ls = leavesOf(sec);
        if (!ls.length) continue;
        const u = span(ls);
        const wPct = (Math.min(u.right, all.right) - Math.max(u.left, all.left)) / W;
        const words = (sec.innerText || '').split(/\s+/).filter((x) => /[A-Za-z0-9]/.test(x)).length;
        let mass = false, statement = false;
        const secBg = getComputedStyle(sec).backgroundColor;
        for (const e of sec.querySelectorAll('img, svg, canvas, video, picture, figure, iframe, [data-slot]')) { if (!vis(e) || (e.tagName.toLowerCase() === 'svg' && e.closest('[data-slot], figure') && e.closest('[data-slot], figure') !== e)) continue; if (e.getBoundingClientRect().height >= 300) { mass = true; break; } }
        if (!mass) for (const e of sec.querySelectorAll('div, article, aside, ul, ol, dl, table, form, a')) {
          if (!vis(e)) continue;
          const cs = getComputedStyle(e); const r = e.getBoundingClientRect();
          const filled = (cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== secBg) || cs.backgroundImage !== 'none' || (parseFloat(cs.borderTopWidth) || 0) + (parseFloat(cs.borderBottomWidth) || 0) + (parseFloat(cs.borderLeftWidth) || 0) + (parseFloat(cs.borderRightWidth) || 0) >= 2;
          if (filled && r.height >= 240 && r.width >= W * 0.35 && r.width < vw * 0.97) { mass = true; break; }
        }
        if (!mass) for (const t of sec.querySelectorAll('table, ul, ol, dl, div, [class]')) {
          if (!vis(t)) continue;
          if (t.tagName === 'TABLE') { const r = t.getBoundingClientRect(); if (t.querySelectorAll('tr').length >= 4 && r.width >= W * 0.6) { mass = true; break; } continue; }
          const kids = [...t.children].filter((k) => vis(k) && k.getBoundingClientRect().height > 20);
          if (kids.length < 3) continue;
          const rs = kids.map((k) => k.getBoundingClientRect());
          const across = rs.every((r) => Math.abs(r.top - rs[0].top) < 12) && new Set(rs.map((r) => Math.round(r.left))).size === rs.length;
          const spread = Math.max(...rs.map((r) => r.right)) - Math.min(...rs.map((r) => r.left));
          const tall = Math.max(...rs.map((r) => r.bottom)) - Math.min(...rs.map((r) => r.top));
          if ((across && spread >= W * 0.7) || (!across && spread >= W * 0.4 && tall >= 120)) { mass = true; break; }
        }
        if (!mass && [...sec.querySelectorAll('input:not([type=hidden]), select, textarea')].filter(vis).length >= 2) mass = true;
        for (const e of sec.querySelectorAll('h2, h3, p, blockquote, h2 span, p span, div, output, [contenteditable]')) { if (!vis(e) || (/^(DIV|OUTPUT)$/.test(e.tagName) && ![...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()))) continue; const cs = getComputedStyle(e); const fs = parseFloat(cs.fontSize); const lh = parseFloat(cs.lineHeight) || fs * 1.15; const r = e.getBoundingClientRect(); const n = (e.innerText || '').split(/\s+/).filter(Boolean).length; if ((fs >= 40 && n <= 40 && r.height >= lh * 1.8 && r.width >= W * 0.5) || fs >= 72) { statement = true; break; } }
        if (statement) mass = true;
        const painted = getComputedStyle(sec).backgroundColor !== 'rgba(0, 0, 0, 0)' || getComputedStyle(sec).backgroundImage !== 'none';
        if (!mass && painted && words <= 40 && sec.querySelector('a, button, form') && !bands) { bands++; continue; }
        if ((wPct < 0.72 && !statement) || !mass) thin.push(`${(sec.querySelector('h2, h3') || {}).innerText ? `"${sec.querySelector('h2, h3').innerText.trim().slice(0, 28)}"` : sec.tagName.toLowerCase() + (sec.className && typeof sec.className === 'string' ? '.' + sec.className.trim().split(/\s+/)[0] : '')} (${Math.round(wPct * 100)}% wide${mass ? '' : ', no mass'})`);
      }
      if (thin.length) push(77, 'REFLEX', `${thin.length} thin section${thin.length > 1 ? 's' : ''}: ${thin.slice(0, 3).join('; ')}`, 'Widen the body to ten of twelve columns and give it mass: a visual 300px tall or more, a set of three across, rows, or a statement (layout.md § 4 and § 5)');
    }
  } else {

    if (textBox && textBox.left < 120) push('44d', 'FAIL', `hero text starts ${Math.round(textBox.left)}px from the edge at 1920`, 'Cap the container at 1360 to 1520px and centre it');
    if (heroEnd != null && heroEnd > vh + 8) push('44d', 'FAIL', `hero runs past the 1920x1080 screen (hero ends at ${Math.round(heroEnd)}px)`, 'Cap vw-sized visuals and display sizes');
    const inkWidth = (e) => { const range = document.createRange(); range.selectNodeContents(e); return range.getBoundingClientRect().width; };
    const wide = [...document.querySelectorAll('p, h1, h2, h3, li')].filter((e) => vis(e) && !e.querySelector('p, h1, h2, h3, h4, div, figure, ul, ol, table, section') && (e.innerText || '').trim().length > 40 && inkWidth(e) > 1600);
    if (wide.length) push('44d', 'FAIL', `${wide.length} text block${wide.length > 1 ? 's run' : ' runs'} wider than 1600px at 1920 (first: ${wide[0].tagName.toLowerCase()} "${(wide[0].innerText || '').trim().slice(0, 28)}")`, 'Cap the container; hold the measure');
  }
  return out;
}
