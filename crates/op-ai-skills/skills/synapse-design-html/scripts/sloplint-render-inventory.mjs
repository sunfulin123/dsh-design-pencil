/** HTML browser diagnostics; adapted from the original Synapse HTML skill. */
import { frames, hideStyles } from './sloplint-render.mjs';

export function inventory(selectors) {
  const base = location.pathname.slice(0, location.pathname.lastIndexOf('/') + 1);
  const key = (raw) => {
    try {
      const u = new URL(raw, location.href);
      if (!/^(https?|file):$/.test(u.protocol)) return raw.trim();
      if (u.origin !== location.origin) return u.href;
      if (u.pathname === location.pathname && u.search === location.search && u.hash) return u.hash;
      return (location.protocol === 'file:' && u.pathname.startsWith(base) ? u.pathname.slice(base.length) : u.pathname) + u.search + u.hash;
    } catch { return raw.trim(); }
  };
  const uniq = (a) => [...new Set(a.filter(Boolean))];
  const text = (el) => (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
  const quiet = (el) => !!el.closest('script, style, noscript, template');
  const links = uniq([...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')).filter((h) => h && h.trim() && h.trim() !== '#').map(key));
  const fieldsIn = (root) => {
    const n = {};
    return uniq([...root.querySelectorAll('input, select, textarea, button[name]')].filter((f) => f.getAttribute('name') || !(f.tagName === 'INPUT' && /^(submit|button|reset|image|hidden)$/i.test(f.getAttribute('type') || ''))).map((f) => {
      const hook = f.getAttribute('data-testid') || f.getAttribute('data-test') || f.getAttribute('data-cy');
      if (f.getAttribute('name')) return f.getAttribute('name');
      if (f.id && !/^(:|radix-|headlessui-|react-aria)/.test(f.id)) return `#${f.id}`;
      if (hook) return `[${hook}]`;
      const t = f.tagName === 'INPUT' ? (f.getAttribute('type') || 'text').toLowerCase() : f.tagName.toLowerCase();
      n[t] = (n[t] || 0) + 1;
      return `unnamed ${t} ${n[t]}`;
    }));
  };
  const fields = fieldsIn(document);
  const actions = uniq([...document.querySelectorAll('form[action]')].map((f) => `${(f.getAttribute('method') || 'get').toLowerCase()} ${key(f.getAttribute('action'))}`));
  const forms = [...document.querySelectorAll('form')].map((f, i) => ({
    key: f.id ? `#${f.id}` : f.getAttribute('action') ? `${(f.getAttribute('method') || 'get').toLowerCase()} ${key(f.getAttribute('action'))}` : `form ${i + 1}`,
    attrs: [`method=${(f.getAttribute('method') || 'get').toLowerCase()}`, f.getAttribute('action') ? `action=${key(f.getAttribute('action'))}` : '', f.hasAttribute('novalidate') ? 'novalidate' : ''].filter(Boolean),
    fields: fieldsIn(f),
    hidden: uniq([...f.querySelectorAll('input[type="hidden"][name]')].map((c) => `${c.getAttribute('name')}=${c.getAttribute('value') || ''}`)),
    submits: f.querySelectorAll('button:not([type]), button[type="submit"], input[type="submit"], input[type="image"]').length,
    controls: uniq([...f.querySelectorAll('button, input, select, textarea')].map((c) => `${c.tagName.toLowerCase()}${c.getAttribute('type') ? `[type=${c.getAttribute('type')}]` : ''}${c.getAttribute('name') ? `[name=${c.getAttribute('name')}]` : ''}`)),
  }));
  const hooked = (selectors || []).filter((x) => { try { return !!document.querySelector(x); } catch { return false; } });
  const headings = uniq([...document.querySelectorAll('h1, h2, h3, h4')].filter((h) => !quiet(h)).map((h) => text(h).toLowerCase().replace(/[\p{Extended_Pictographic}\uFE0F\u200d]/gu, '').replace(/\s+/g, ' ').trim()).filter((t) => t.length > 1));
  const body = text(document.body);
  const figures = uniq((body.match(/[$€£¥]\s?\d[\d,.]*\+?[kKmM]?|\b\d[\d,.]*\s?%|\b\d[\d,.]*[kKmM]?\+(?=\s|$)|\b\d{1,3}(?:,\d{3})+\b|\b\d{1,2}[:.]\d{2}\s?(?:am|pm)?\b|\b(?:19|20)\d{2}\b|\b\d+(?:\.\d+)?\s(?:hours?|minutes?|mins?|days?|weeks?|months?|years?|seconds?|ms|km|kg|g|ml|mm|cm|gb|mb|tb|x)\b|\+?\d[\d\s().-]{7,}\d/gi) || []).map((t) => t.replace(/\s+/g, '').toLowerCase()));
  const images = uniq([...document.querySelectorAll('img[src]')].map((i) => (i.getAttribute('src') || '').split('?')[0].split('/').pop()));
  const controls = document.querySelectorAll('button, [role="button"], input[type="submit"], input[type="button"], select, textarea, input:not([type="hidden"])').length;
  return { links, fields, actions, forms, hooked, headings, figures, images, controls, words: body ? body.split(' ').length : 0 };
}

export function focusRing() {
  let el = document.activeElement;
  if (!el || el === document.body || el === document.documentElement) return null;
  const box = el.getBoundingClientRect();
  if (box.width < 4 || box.height < 4) el = (el.labels && el.labels[0]) || el.closest('label') || el.parentElement;
  if (!el) return null;
  el.style.setProperty('transition', 'none', 'important');
  const cs = getComputedStyle(el);
  const key = el.tagName.toLowerCase() + (el.classList[0] ? '.' + el.classList[0] : '') + ((el.textContent || '').trim() ? ` "${el.textContent.trim().slice(0, 18)}"` : '');
  if (cs.outlineStyle === 'none' || !(parseFloat(cs.outlineWidth) > 0)) {
    const active = document.activeElement;
    const chain = []; for (let n = el, i = 0; n && n !== document.body && i < 5; n = n.parentElement, i++) chain.push(n);
    const look = () => chain.flatMap((n) => [null, '::before', '::after'].map((ps) => { const c = getComputedStyle(n, ps); return [c.outlineStyle, c.outlineWidth, c.boxShadow, c.borderTopColor, c.borderBottomColor, c.borderLeftColor, c.borderBottomWidth, c.backgroundColor, c.backgroundImage, c.color, c.textDecorationLine, c.opacity].join('|'); })).join('~');
    const focused = look();
    active.blur();
    const rest = look();
    active.focus({ preventScroll: true });
    return { key, ratio: null, bare: focused === rest };
  }
  const cv = document.createElement('canvas'); cv.width = cv.height = 1;
  const cx = cv.getContext('2d', { willReadFrequently: true });
  const rgb = (str) => { cx.clearRect(0, 0, 1, 1); cx.fillStyle = 'rgba(0, 0, 0, 0)'; cx.fillStyle = str; cx.fillRect(0, 0, 1, 1); const d = cx.getImageData(0, 0, 1, 1).data; return [d[0] / 255, d[1] / 255, d[2] / 255, d[3] / 255]; };
  const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const Y = (c) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
  let node = parseFloat(cs.outlineOffset) < 0 ? el : el.parentElement;
  let bg = null;
  for (; node && node !== document.documentElement; node = node.parentElement) { const c = rgb(getComputedStyle(node).backgroundColor); if (c[3] >= 0.9) { bg = c; break; } }
  if (!bg) { const b = rgb(getComputedStyle(document.body).backgroundColor); bg = b[3] > 0 ? b : [1, 1, 1, 1]; }
  const ring = rgb(cs.outlineColor);
  if (ring[3] < 0.5) return { key, ratio: null };
  const a = Y(ring), b = Y(bg);
  const r = el.getBoundingClientRect();
  const pad = Math.max(0, parseFloat(cs.outlineOffset)) + parseFloat(cs.outlineWidth) + 3;
  return { key, ring: ring.slice(0, 3), ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05), rect: { x: r.left, y: r.top, w: r.width, h: r.height }, pad };
}

export async function pixelsAroundRing(page, ring) {
  let handle, restore;
  try {
    handle = await page.evaluateHandle(() => {
      let el = document.activeElement;
      if (el) { const b = el.getBoundingClientRect(); if (b.width < 4 || b.height < 4) el = el.closest('label') || el.parentElement; }
      return el;
    });
    const el = handle.asElement();
    if (!el) return null;
    restore = await hideStyles(el, [['outline-style', 'none'], ['box-shadow', 'none']]);
    await frames(page);
    const vw = await page.evaluate(() => [innerWidth, innerHeight, scrollX, scrollY]);
    const x = Math.max(0, ring.rect.x - ring.pad), y = Math.max(0, ring.rect.y - ring.pad);
    const clip = { x: x + vw[2], y: y + vw[3], width: Math.min(vw[0], ring.rect.x + ring.rect.w + ring.pad) - x, height: Math.min(vw[1], ring.rect.y + ring.rect.h + ring.pad) - y };
    if (clip.width < 4 || clip.height < 4) return null;
    const data = await page.screenshot({ clip, encoding: 'base64' });
    return await page.evaluate(async (b64, inner) => {
      const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
      const x = c.getContext('2d'); x.drawImage(img, 0, 0);
      const d = x.getImageData(0, 0, c.width, c.height).data;
      const ch = [[], [], []];
      for (let py = 0; py < c.height; py++) for (let px = 0; px < c.width; px++) {
        if (px >= inner.l && px < inner.r && py >= inner.t && py < inner.b) continue;
        const i = (py * c.width + px) * 4; ch[0].push(d[i]); ch[1].push(d[i + 1]); ch[2].push(d[i + 2]);
      }
      if (!ch[0].length) return null;
      return ch.map((a) => a.sort((p, q) => p - q)[a.length >> 1] / 255);
    }, data, { l: ring.rect.x - x, t: ring.rect.y - y, r: ring.rect.x - x + ring.rect.w, b: ring.rect.y - y + ring.rect.h });
  } catch { return null; }
  finally {
    if (restore) await restore();
    if (handle) await handle.dispose().catch(() => {});
  }
}

export function observe(checkFold, meta) {
  meta = meta || { genre: null, posture: 'restrained' };
  const out = [];
  const push = (gate, grade, evidence, fix, extra) => out.push({ gate: String(gate), grade, evidence, fix, ...extra });
  const describe = (el) => {
    const cls = (el.className && typeof el.className === 'string') ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '';
    return el.tagName.toLowerCase() + cls;
  };
  const visible = (el) => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width > 1 && r.height > 1;
  };

  if (document.documentElement.scrollWidth > window.innerWidth + 1) {
    push(34, 'FAIL', `horizontal scroll: scrollWidth ${document.documentElement.scrollWidth} > viewport ${window.innerWidth}`,
      'overflow-x: clip on html and body; find the overflowing block');
  }

  if (window.innerWidth === 375) {
    const clipped = (el) => { for (let q = el.parentElement; q && q !== document.body && q !== document.documentElement; q = q.parentElement) { const cs = getComputedStyle(q); if (/hidden|clip|auto|scroll/.test(`${cs.overflowX} ${cs.overflow}`)) return true; } return false; };
    const spill = [...document.querySelectorAll('body *')].find((el) => { if (!visible(el) || getComputedStyle(el).position === 'fixed' || el.closest('svg') || clipped(el)) return false; const r = el.getBoundingClientRect(); return r.right > window.innerWidth + 2 || r.left < -2; });
    if (spill && document.documentElement.scrollWidth <= window.innerWidth + 1) { const r = spill.getBoundingClientRect(); push(34, 'FAIL', `${describe(spill)} runs ${Math.round(Math.max(r.right - window.innerWidth, -r.left))}px past the 375 screen, hidden only by the page's clip`, 'Stack it under 60rem: drop the desktop column gap, widths and offsets on the phone'); }
    for (const sl of document.querySelectorAll('[data-slot]')) { const cs = getComputedStyle(sl); if (cs.display === 'none' || !sl.getClientRects().length || sl.closest('[hidden]')) continue; const r = sl.getBoundingClientRect(); if (r.width < 40 || r.height < 40) { push('F18', 'WARN', `slot "${sl.getAttribute('data-slot')}" renders at ${Math.round(r.width)} x ${Math.round(r.height)}px on a phone`, 'The slot collapsed: give it width: 100% and an aspect-ratio in the stacked layout'); break; } }
    const flush = [...document.querySelectorAll('p, li, h1, h2, h3, blockquote, dd')].find((el) => {
      if (!visible(el) || el.closest('nav, pre, table, [data-slot]')) return false;
      const own = [...el.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim().length >= 20);
      if (own.reduce((n, t) => n + t.textContent.trim().length, 0) < 40) return false;
      let left = Infinity, right = -Infinity;
      for (const t of own) { const range = document.createRange(); range.selectNodeContents(t); for (const r of range.getClientRects()) { if (r.width < 2) continue; left = Math.min(left, r.left); right = Math.max(right, r.right); } }
      return right - left > 120 && right <= window.innerWidth + 1 && (left < 8 || right > window.innerWidth - 8);
    });
    if (flush) push(72, 'REFLEX', `text runs to the edge of the screen (${describe(flush)})`, 'Give the page a gutter: 16px or more at each side on a phone');
  }

  for (const el of document.querySelectorAll('a, button, [role="button"], [role="tab"]')) {
    if (!visible(el)) continue;
    const text = (el.textContent || '').trim();
    if (!text) continue;
    const isButton = el.tagName === 'BUTTON' || el.getAttribute('role') === 'button' || /btn|button|cta/i.test(typeof el.className === 'string' ? el.className : '');
    const block = el.closest('p, li, dd, td, blockquote, figcaption');
    if (!isButton && block && (block.innerText || '').trim().length > text.length + 12) continue;
    if ([...el.querySelectorAll('*')].some((d) => !d.closest('svg') && /^(block|flex|grid|list-item|table)$/.test(getComputedStyle(d).display))) continue;
    const cs = getComputedStyle(el);
    const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.4;
    const tops = [];
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const host = n.parentElement;
      if (!n.textContent.trim() || !host || host.closest('svg')) continue;
      const hr = host.getBoundingClientRect();
      if (hr.width <= 2 || hr.height <= 2) continue;
      const range = document.createRange();
      range.selectNodeContents(n);
      for (const r of range.getClientRects()) if (r.width > 0 && r.height > 0) tops.push(r.top);
    }
    tops.sort((a, b) => a - b);
    let lines = tops.length ? 1 : 0;
    for (let i = 1; i < tops.length; i++) if (tops[i] - tops[i - 1] > lh * 0.6) lines++;
    if (lines > 1) {
      const primary = isButton || (!!el.closest('nav') && !el.closest('footer') && !el.closest('nav[aria-label*="bread" i]'));
      push(primary ? '49a' : '49b', primary ? 'FAIL' : 'REFLEX', `${primary ? 'control' : 'link'} "${text.slice(0, 32)}" wraps to ${lines} lines (${describe(el)})`,
        'Shorten the label or set nowrap');
    }
  }

  if (checkFold) {
    const h1 = document.querySelector('h1');
    if (h1 && visible(h1)) {
      const hr = h1.getBoundingClientRect();
      const scope = h1.closest('section, header, main, div') || document.body;
      let cta = null;
      for (const c of scope.querySelectorAll('a, button')) {
        if (visible(c) && (c.textContent || '').trim()) { cta = c; break; }
      }
      const fold = 800;
      if (hr.bottom > fold || hr.top < 0) {
        push('44b', 'FAIL', `h1 crosses the 1280x800 fold (bottom ${Math.round(hr.bottom)}px)`,
          'Right-size the display clamp to the fold');
      } else if (cta) {
        const cr = cta.getBoundingClientRect();
        if (cr.bottom > fold) {
          push('44b', 'FAIL', `primary CTA below the 1280x800 fold (bottom ${Math.round(cr.bottom)}px)`,
            'Trim hero padding so the CTA fits the fold');
        }
      }
    }
  }

  if (checkFold) {
    const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
    const cvs = document.createElement('canvas'); cvs.width = cvs.height = 1;
    const ctx2 = cvs.getContext('2d', { willReadFrequently: true });
    const toRgb = (str) => { ctx2.clearRect(0, 0, 1, 1); ctx2.fillStyle = 'rgba(0, 0, 0, 0)'; ctx2.fillStyle = str; ctx2.fillRect(0, 0, 1, 1); const d = ctx2.getImageData(0, 0, 1, 1).data; return { r: d[0] / 255, g: d[1] / 255, b: d[2] / 255, a: d[3] / 255 }; };
    const parse = (s) => {
      if (!s || s === 'transparent') return null;
      const m = /^rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)$/.exec(s.trim());
      if (m) return { r: +m[1] / 255, g: +m[2] / 255, b: +m[3] / 255, a: m[4] == null ? 1 : +m[4] };
      const alpha = /\/\s*([\d.]+%?)\s*\)$/.exec(s);
      const c = toRgb(s);
      if (alpha) c.a = alpha[1].endsWith('%') ? parseFloat(alpha[1]) / 100 : parseFloat(alpha[1]);
      return c;
    };
    const lum = (c) => 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
    const ratio = (a, b) => {
      const la = lum(a), lb = lum(b);
      return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
    };
    const bgOf = (el) => {
      let node = el;
      while (node && node !== document.documentElement) {
        const c = parse(getComputedStyle(node).backgroundColor);
        if (c && c.a >= 0.9) return c;
        node = node.parentElement;
      }
      const root = parse(getComputedStyle(document.body).backgroundColor);
      return root && root.a > 0 ? root : { r: 1, g: 1, b: 1, a: 1 };
    };
    const over = (top, base) => ({ r: top.r * top.a + base.r * (1 - top.a), g: top.g * top.a + base.g * (1 - top.a), b: top.b * top.a + base.b * (1 - top.a), a: 1 });
    const gradStops = (el, base) => {
      const out = [];
      for (let node = el; node && node !== document.documentElement; node = node.parentElement) {
        const cs2 = getComputedStyle(node);
        if (/gradient/.test(cs2.backgroundImage)) {
          const layers = []; let depth = 0, cur = '';
          for (const ch of cs2.backgroundImage) { if (ch === '(') depth++; if (ch === ')') depth--; if (ch === ',' && depth === 0) { layers.push(cur); cur = ''; } else cur += ch; }
          layers.push(cur);
          const sizes = cs2.backgroundSize.split(',');
          for (const [li, layer] of layers.entries()) {
            const bh = /\s([\d.]+)px\s*$/.exec((sizes[li] || sizes[0] || '').trim()); if (bh && parseFloat(bh[1]) <= 6) continue;
            if (!/^\s*(linear|radial|conic)-gradient/.test(layer) || /[\s,(]\d(?:\.\d+)?px\b/.test(layer)) continue;
            for (const m of layer.matchAll(/(?:oklch|oklab|lab|lch|rgba?|hsla?|color)\([^()]*\)|#[0-9a-fA-F]{3,8}\b/g)) out.push(over(toRgb(m[0]), base));
          }
        }
        const c = parse(cs2.backgroundColor);
        if (c && c.a >= 0.9) break;
      }
      return out;
    };
    let reported = 0;
    const seenSel = new Set();
    for (const el of document.querySelectorAll('body *')) {
      if (reported >= 10) break;
      if (!visible(el) || el.closest('svg')) continue;
      const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 2);
      if (!hasText) continue;
      const cs = getComputedStyle(el);
      const fg = parse(cs.color);
      if (!fg || fg.a < 0.9) continue;
      const bg = bgOf(el);
      const size = parseFloat(cs.fontSize);
      const weight = parseInt(cs.fontWeight, 10) || 400;
      const large = size >= 24 || (size >= 18 && weight >= 700);
      const threshold = large ? 3.0 : 4.5;
      const key = describe(el);
      const where = `${key} "${(el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 24)}"`;
      const stops = gradStops(el, bg);
      if (stops.length && !seenSel.has(key)) {
        const rs = stops.map((c) => ratio(fg, c));
        const worst = Math.min(...rs), best = Math.max(...rs);
        if (best < threshold - 0.05) { seenSel.add(key); reported++; push(40, 'FAIL', `contrast ${best.toFixed(2)}:1 at best over the gradient behind ${where}`, 'Raise the contrast to threshold, or give the text its own ground'); }
        else if (worst < threshold - 0.05) { seenSel.add(key); reported++; push(40, 'WARN', `contrast drops to ${worst.toFixed(2)}:1 over the gradient behind ${where}`, 'Check the text where the gradient is darkest or lightest; give the label its own ground'); }
        continue;
      }
      const r = ratio(fg, bg);
      if (r < threshold - 0.05 && !seenSel.has(key)) {
        seenSel.add(key);
        reported++;
        el.setAttribute('data-hm-probe', String(reported));
        const probe = { probe: reported, fg: [fg.r, fg.g, fg.b], threshold };
        push(40, 'FAIL', `computed contrast ${r.toFixed(2)}:1 < ${threshold}:1 on ${where}`,
          'Raise the contrast to threshold', probe);
        const btnish = el.closest('a, button, [class*="btn"], [class*="cta"]');
        if (btnish && r < 1.6) {
          push(41, 'FAIL', `button text ~ button fill on ${key} (${r.toFixed(2)}:1)`,
            'Use accent-ink or paper for the label', probe);
        }
      }
    }
  }

  if (checkFold && meta.posture === 'restrained') {
    const cs0 = getComputedStyle(document.documentElement);

    const cv3 = document.createElement('canvas'); cv3.width = cv3.height = 1;
    const cx3 = cv3.getContext('2d', { willReadFrequently: true });
    const toRgb = (str) => {
      str = (str || '').trim();
      if (!str || str === 'transparent') return null;
      cx3.clearRect(0, 0, 1, 1); cx3.fillStyle = 'rgba(1, 2, 3, 0.5)'; cx3.fillStyle = str;
      if (cx3.fillStyle === 'rgba(1, 2, 3, 0.5)') return null;
      cx3.fillRect(0, 0, 1, 1);
      const d = cx3.getImageData(0, 0, 1, 1).data;
      return [d[0], d[1], d[2], d[3] / 255];
    };
    const targets = ['--color-accent', '--color-accent-2']
      .map((t) => toRgb(cs0.getPropertyValue(t).trim())).filter(Boolean);
    if (targets.length) {
      const near = (str) => {
        const p = toRgb(str);
        if (!p || p[3] < 0.5) return false;
        return targets.some((t) => Math.abs(t[0] - p[0]) + Math.abs(t[1] - p[1]) + Math.abs(t[2] - p[2]) <= 30);
      };
      const CW = 16, COLS = Math.ceil(innerWidth / CW), ROWS = Math.ceil(800 / CW);
      const grid = new Uint8Array(COLS * ROWS);
      let walked = 0;
      for (const el of document.querySelectorAll('body, body *')) {
        if (++walked > 4000) break;
        if (el !== document.body && !visible(el)) continue;
        const cs = getComputedStyle(el);
        const isBg = near(cs.backgroundColor);
        const isTxt = near(cs.color) && parseFloat(cs.fontSize) >= 32 &&
          [...el.childNodes].some((nd) => nd.nodeType === 3 && nd.textContent.trim());
        if (!isBg && !isTxt) continue;
        const r = el.getBoundingClientRect();
        const x0 = Math.max(0, Math.floor(r.left / CW));
        const x1 = Math.min(COLS - 1, Math.floor((Math.min(r.right, innerWidth) - 1) / CW));
        const y0 = Math.max(0, Math.floor(r.top / CW));
        const y1 = Math.min(ROWS - 1, Math.floor((Math.min(r.bottom, 800) - 1) / CW));
        const turned = cs.transform !== 'none' && !cs.transform.startsWith('matrix(1, 0, 0, 1, ');
        for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
          if (turned) { const hit = document.elementFromPoint(x * CW + CW / 2, y * CW + CW / 2); if (!hit || !(hit === el || el.contains(hit))) continue; }
          grid[y * COLS + x] = 1;
        }
      }
      let filled = 0;
      for (const c of grid) filled += c;
      const pct = (100 * filled) / (COLS * ROWS);
      const warnAt = meta.genre === 'atmospheric' ? 20 : 5;
      const failAt = meta.genre === 'atmospheric' ? 30 : 8;
      if (pct > failAt) {
        push(23, 'FAIL', `accent paints ~${pct.toFixed(1)}% of the 1280x800 viewport (> ${failAt}%)`,
          'Retreat the accent to <= 5%; large colour belongs to paper/field tokens or a declared posture');
      } else if (pct > warnAt) {
        push(23, 'WARN', `accent paints ~${pct.toFixed(1)}% of the 1280x800 viewport`,
          'Confirm this is a declared posture surface, else retreat to <= 5%');
      }
    }
  }

  if (checkFold) {
    const sticky = [];
    for (const el of document.querySelectorAll('body *')) {
      const cs = getComputedStyle(el);
      if (cs.position === 'sticky' && parseFloat(cs.top) === 0) sticky.push(el);
    }
    if (sticky.length >= 2) {
      push(56, 'FAIL', `two sticky top:0 elements: ${sticky.slice(0, 2).map(describe).join(' + ')}`,
        'Offset the second sticky by banner height');
    }
  }

  return out;
}

// F26: a paragraph whose last line is one short word (a straggler), or a head of two or three lines whose last line is a stub
