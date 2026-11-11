/** HTML browser diagnostics; adapted from the original Synapse HTML skill. */
import { focusRing, inventory, observe, pixelsAroundRing } from './sloplint-render-inventory.mjs';
import { lineBreaks, observeSpace } from './sloplint-render-layout.mjs';
import { observeOcclusion, observeQuality } from './sloplint-render-quality.mjs';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const WIDTHS = [320, 375, 414, 768, 1024, 1280, 1440, 1920];

export const CHROMES = ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium', '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/snap/bin/chromium', 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'];

export const isUrl = (t) => /^https?:\/\//.test(t);

export const slugOf = (t) => isUrl(t) ? t.replace(/^https?:\/\//, '').replace(/[^\w.-]+/g, '-').replace(/-+$/, '') : basename(t, '.html');

export const SHOTS = [];

export let SHOT_DIR = 'shots';

export const frames = (page) => page.evaluate(async () => { if (document.fonts && document.fonts.status !== 'loaded') await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 3000))]); await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); }).catch(() => {});

export const settleImages = (page) => page.evaluate(async () => { for (const i of document.querySelectorAll('img[loading="lazy"]')) i.loading = 'eager'; for (let y = 0; y < document.documentElement.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); } window.scrollTo(0, 0); const waiting = [...document.images].filter((i) => !i.complete); await Promise.race([Promise.all(waiting.map((i) => new Promise((r) => { i.addEventListener('load', r, { once: true }); i.addEventListener('error', r, { once: true }); }))), new Promise((r) => setTimeout(r, 15000))]); await Promise.all([...document.images].map((i) => (i.complete && i.naturalWidth && i.decode ? i.decode().catch(() => {}) : null))); }).catch(() => {});

export function contrast(a, b) {
  const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const Y = (c) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
  const x = Y(a), y = Y(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

// Keep the original element and each property's priority across asynchronous screenshots.

export async function hideStyles(el, props) {
  const saved = await el.evaluate((node, entries) => {
    const previous = { hadStyle: node.hasAttribute('style'), props: entries.map(([k]) => [k, node.style.getPropertyValue(k), node.style.getPropertyPriority(k)]) };
    for (const [k, v] of entries) node.style.setProperty(k, v, 'important');
    return previous;
  }, props);
  return () => el.evaluate((node, previous) => {
    for (const [k, value, priority] of previous.props) {
      if (value) node.style.setProperty(k, value, priority);
      else node.style.removeProperty(k);
    }
    if (!previous.hadStyle && !node.style.length) {
      // Synchronize the CSSOM's lazy attribute before removing its empty shell.
      node.getAttribute('style');
      node.removeAttribute('style');
    }
  }, saved).catch(() => {});
}

export async function pixelBehind(page, probe) {
  // Change the stroke width alone so a pre-existing stroke color is never overwritten.
  const HIDE = [['color', 'transparent'], ['text-shadow', 'none'], ['-webkit-text-stroke-width', '0'], ['text-decoration-color', 'transparent']];
  let el, restore;
  try {
    el = await page.$(`[data-hm-probe="${probe}"]`);
    if (!el) return null;
    restore = await hideStyles(el, HIDE);
    const rect = await el.evaluate((node) => {
      node.scrollIntoView({ block: 'center', behavior: 'instant' });
      const r = node.getBoundingClientRect();
      const x = Math.max(0, r.left), y = Math.max(0, r.top);
      return { x: x + scrollX, y: y + scrollY, width: Math.min(r.right, innerWidth) - x, height: Math.min(r.bottom, innerHeight) - y };
    });
    if (!rect || rect.width < 2 || rect.height < 2) return null;
    await frames(page);
    const data = await page.screenshot({ clip: rect, encoding: 'base64' });
    return await page.evaluate(async (b64) => {
      const img = new Image();
      img.src = 'data:image/png;base64,' + b64;
      await img.decode();
      const c = document.createElement('canvas');
      c.width = img.width; c.height = img.height;
      const x = c.getContext('2d');
      x.drawImage(img, 0, 0);
      const d = x.getImageData(0, 0, c.width, c.height).data;
      const ch = [[], [], []];
      for (let i = 0; i < d.length; i += 4) { ch[0].push(d[i]); ch[1].push(d[i + 1]); ch[2].push(d[i + 2]); }
      return ch.map((a) => a.sort((p, q) => p - q)[a.length >> 1] / 255);
    }, data);
  } catch { return null; }
  finally {
    if (restore) await restore();
    if (el) await el.dispose().catch(() => {});
    await page.evaluate(() => window.scrollTo(0, 0)).catch(() => {});
  }
}

export async function shoot(page, file, tag, fullPage) {
  try {
    const dir = join(process.env.SYNAPSE_DESIGN_TASK_DIR || join(process.cwd(), '.synapse', 'html-design'), 'review', SHOT_DIR);
    mkdirSync(dir, { recursive: true });
    const ignore = join(dirname(dir), '.gitignore');
    if (!existsSync(ignore)) writeFileSync(ignore, 'shots/\nbefore/\nbefore.json\nbefore.txt\ncompare.html\n');
    const out = join(dir, `${slugOf(file)}-${tag}.png`);
    await page.screenshot({ path: out, fullPage });
    SHOTS.push(out);
  } catch {}
}

export async function renderCheck(htmlFiles, metaIn) {
  const failed = [];
  const meta = { genre: null, postureByFile: {}, heroPostureByFile: {}, photoShapeByFile: {}, jobByFile: {}, stage: 'page', scope: 'page', before: false, ...metaIn };
  const heroOnly = meta.stage === 'hero';
  SHOT_DIR = meta.before ? 'before' : 'shots';
  const inventories = {};
  let puppeteer = null;
  const { createRequire } = await import('node:module');
  const tryRoots = async (roots) => {
    for (const root of roots) {
      for (const name of ['puppeteer-core', 'puppeteer']) {
        try {
          const req = createRequire(join(root, 'noop.js'));
          const resolved = req.resolve(name);
          puppeteer = (await import(pathToFileURL(resolved).href)).default;
          if (puppeteer) return;
        } catch {}
      }
    }
  };
  const local = [process.cwd(), dirname(fileURLToPath(import.meta.url))];
  if (process.env.HALLMARK_PUPPETEER) local.unshift(process.env.HALLMARK_PUPPETEER);
  await tryRoots(local);
  if (!puppeteer) {
    try {
      const { execSync } = await import('node:child_process');
      const g = execSync('npm root -g', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
      if (g) await tryRoots([dirname(g)]);
    } catch {}
  }
  if (!puppeteer) {
    const none = []; none.failed = failed; none.notRun = 'no puppeteer-core found locally, globally or via HALLMARK_PUPPETEER';
    return none;
  }
  let chrome = [process.env.CHROME_PATH, ...CHROMES].find((p) => p && existsSync(p)) || null;
  if (!chrome && typeof puppeteer.executablePath === 'function') {
    try { const bundled = puppeteer.executablePath(); if (bundled && existsSync(bundled)) chrome = bundled; } catch {}
  }
  if (!chrome) {
    const none = []; none.failed = failed; none.notRun = 'no Chrome or Chromium found; set CHROME_PATH';
    return none;
  }
  const findings = [];
  const browser = await puppeteer.launch({ executablePath: chrome, headless: true });
  try {
    for (const file of htmlFiles) {
      const page = await browser.newPage();
      try {
        const scriptErrors = [];
        page.on('pageerror', (e) => scriptErrors.push(String((e && e.message) || e).split('\n')[0]));
        const lost = new Set();
        const lostName = (u) => { try { const x = new URL(u); return x.protocol === 'file:' ? x.pathname.split('/').pop() : x.host; } catch { return String(u).slice(0, 40); } };
        page.on('requestfailed', (r) => { if (['stylesheet', 'font'].includes(r.resourceType())) lost.add(lostName(r.url())); });
        page.on('response', (r) => { try { if (r.status() >= 400 && ['stylesheet', 'font'].includes(r.request().resourceType())) lost.add(lostName(r.url())); } catch {} });
        await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]).catch(() => {});
        const nav = await page.goto(isUrl(file) ? file : pathToFileURL(file).href, { waitUntil: isUrl(file) ? 'networkidle0' : 'load', timeout: 30000 }).then((r) => ({ r }), (e) => ({ e }));
        if (nav.e && !/timeout/i.test(nav.e.message)) throw nav.e;
        if (nav.r && isUrl(file) && !nav.r.ok() && nav.r.status() !== 304) throw new Error(`HTTP ${nav.r.status()} from ${file}`);
        await page.evaluate(async () => {
          document.documentElement.classList.add('hallmark-shot');
          for (const el of [document.documentElement, document.body]) if (el) el.style.setProperty('scroll-behavior', 'auto', 'important');
          const quiet = document.createElement('style');
          quiet.textContent = 'nextjs-portal, astro-dev-toolbar { display: none !important; }';
          document.head.appendChild(quiet);
          if (document.fonts) await document.fonts.ready;
        }).catch(() => {});
        if (isUrl(file)) {
          const stamp = await page.evaluate(async () => { let t = [...document.querySelectorAll('style')].map((x) => x.textContent.slice(0, 4000)).join('\n'); for (const l of document.querySelectorAll('link[rel~="stylesheet"]')) { try { t += '\n' + (await (await fetch(l.href)).text()).slice(0, 4000); } catch {} } return t; }).catch(() => '');
          meta.postureByFile[file] = (/posture:\s*(restrained|committed|full-palette|drenched)/i.exec(stamp)?.[1] || 'restrained').toLowerCase();
          const field = (/hero:\s*([^·*\n]+)/i.exec(stamp) || [])[1] || '';
          let route = ''; try { route = new URL(file).pathname.replace(/\/$/, '') || '/'; } catch {}
          const own = new RegExp(`(settled|banner|poster|ledge|corridor|stage|counter|index)\\s*\\(${route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`, 'i').exec(field);
          meta.photoShapeByFile[file] = /shape:\s*(photographic|portfolio)/i.test(stamp);
          meta.jobByFile[file] = ((/\bjob:\s*([a-z][a-z /-]*)/i.exec(stamp) || [])[1] || '').trim().toLowerCase();
          meta.heroPostureByFile[file] = /theme:\s*custom\b/i.test(stamp) ? 'custom' : ((own || /(settled|banner|poster|ledge|corridor|stage|counter|index)\b/i.exec(field) || [])[1] || '').toLowerCase();
        }
        const pageMeta = { genre: meta.genre, posture: meta.postureByFile[file] || 'restrained' };
        const prefix = heroOnly ? 'hero-' : '';
        for (const width of heroOnly ? [375, 1280] : WIDTHS) {
          await page.setViewport({ width, height: width === 375 && heroOnly ? 812 : 800 });
          await page.evaluate(() => window.scrollTo(0, 0)).catch(() => {});
          await frames(page);
          if (width === 1280) await shoot(page, file, `${prefix}1280x800`, false);
          if (width === 375 && !heroOnly) { await settleImages(page); await frames(page); }
          if (width === 375) await shoot(page, file, heroOnly ? 'hero-375x812' : '375', !heroOnly);
          if (!heroOnly && (width === 375 || width === 1280)) for (const f of await page.evaluate(lineBreaks).catch(() => [])) findings.push({ ...f, file, line: 1 });
          const res = await page.evaluate(observe, width === 1280, pageMeta);
          const measured = new Map();
          for (const f of res) {
            if (f.probe == null) continue;
            if (!measured.has(f.probe)) measured.set(f.probe, await pixelBehind(page, f.probe));
            const bg = measured.get(f.probe);
            if (!bg) continue;
            const real = contrast(f.fg, bg);
            if (real >= f.threshold - 0.05) f.drop = true;
            else f.evidence = f.evidence.replace(/computed contrast [\d.]+:1/, `contrast ${real.toFixed(2)}:1 against the pixels behind`).replace(/\([\d.]+:1\)$/, `(${real.toFixed(2)}:1)`);
          }
          for (const f of res) if (!f.drop) { const { probe: _probe, fg: _fg, threshold: _threshold, drop: _drop, ...rest } = f; findings.push({ ...rest, file, line: 1, evidence: `[${width}px] ${f.evidence}` }); }
        }
        for (const [w, h] of [[1440, 900], [1920, 1080]]) {
          await page.setViewport({ width: w, height: h });
          await page.evaluate(() => window.scrollTo(0, 0)).catch(() => {});
          await frames(page);
          await shoot(page, file, `${prefix}${w}x${h}`, false);
          if (!heroOnly && w === 1440) {
            await settleImages(page);
            await shoot(page, file, '1440-full', true);
          }
          await frames(page);
          const res = await page.evaluate(observeSpace, w === 1440, heroOnly, meta.heroPostureByFile[file] || '', !!meta.photoShapeByFile[file], meta.jobByFile[file] || '');
          for (const f of res) findings.push({ ...f, file, line: 1, evidence: `[${w}px] ${f.evidence}` });
        }
        if (!heroOnly) {
          await page.setViewport({ width: 1440, height: 900 });
          await frames(page);
          inventories[file] = await page.evaluate(inventory, (meta.selectors && meta.selectors[file]) || []).catch(() => null);
          const quality = await page.evaluate(observeQuality, meta.scope).catch(() => []);
          const hidden = await page.evaluate(observeOcclusion).catch(() => []);
          for (const f of [...quality, ...hidden]) findings.push({ ...f, file, line: 1, evidence: `[1440px] ${f.evidence}` });
          await page.evaluate(() => { window.scrollTo(0, 0); if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); });
          const rings = new Set();
          const bare = [];
          for (let i = 0; i < 16; i++) {
            await page.keyboard.press('Tab');
            await frames(page);
            const ring = await page.evaluate(focusRing);
            if (!ring || rings.has(ring.key)) continue;
            rings.add(ring.key);
            if (ring.bare) { if (bare.length < 4) bare.push(ring.key); continue; }
            if (ring.ratio != null && ring.ratio < 2.95) { const bg = await pixelsAroundRing(page, ring); if (bg) ring.ratio = contrast(ring.ring, bg); }
            if (ring.ratio != null && ring.ratio < 2.95) findings.push({ gate: '26a', grade: 'FAIL', file, line: 1, evidence: `[1440px] focus ring ${ring.ratio.toFixed(2)}:1 against what is behind it on ${ring.key}`, fix: 'A ring at 3:1 or better against the surface it is drawn over: --color-focus, or a ring colour per band' });
          }
          if (bare.length) findings.push({ gate: '26a', grade: 'FAIL', file, line: 1, evidence: `[1440px] nothing shows keyboard focus on ${bare.join(', ')}`, fix: 'Give every control a :focus-visible ring; never remove an outline without putting one back' });
        }
        if (!heroOnly) {
          await page.setViewport({ width: 1440, height: 900 });
          await frames(page);
          await page.evaluate(() => {
            window.__hmSeen = [...document.querySelectorAll('p, li, h1, h2, h3, h4, dd, td, blockquote, figcaption')].filter((el) => {
              const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
              return cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 1 && r.height > 1 && !el.closest('nav, header, dialog, [hidden], [aria-hidden="true"]');
            });
          }).catch(() => {});
          await page.setViewport({ width: 375, height: 800 });
          await frames(page);
          const cut = await page.evaluate(() => {
            const flat = (t) => (t || '').replace(/\s+/g, ' ').trim();
            const shown = flat(document.body.innerText);
            const gone = (window.__hmSeen || []).filter((el) => {
              const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
              if (!(cs.display === 'none' || cs.visibility === 'hidden' || r.width < 1 || r.height < 1)) return false;
              const t = flat(el.textContent);
              return t.length > 12 && !shown.includes(t);
            });
            const off = [...document.querySelectorAll('table')].flatMap((t) => (t.rows[0] ? [...t.rows[0].cells] : [])).filter((el) => { const r = el.getBoundingClientRect(); return r.width > 1 && r.height > 1 && r.left >= window.innerWidth - 2; });
            return { words: gone.reduce((n, el) => n + flat(el.textContent).split(' ').length, 0), first: gone[0] ? flat(gone[0].textContent).slice(0, 36) : '', off: off.length, col: off[0] ? flat(off[0].textContent).slice(0, 24) : '' };
          }).catch(() => ({ words: 0, off: 0 }));
          if (cut.words >= 40) findings.push({ gate: 'F25', grade: 'WARN', file, line: 1, evidence: `[375px] ${cut.words} words shown at 1440 are hidden on a phone (first: "${cut.first}")`, fix: 'If it matters, make it work on a phone; if it does not, cut it everywhere' });
          if (cut.off >= 2) findings.push({ gate: 'F25', grade: 'WARN', file, line: 1, evidence: `[375px] a table opens with ${cut.off} columns off-screen (from "${cut.col}")`, fix: 'Keep the column that names the row and the one that acts on it in view: restack each row, or pin the first column' });
        }
        if (scriptErrors.length) findings.push({ gate: 'render', grade: 'FAIL', file, line: 1, evidence: `a script threw on load: ${scriptErrors[0].slice(0, 90)}`, fix: 'Fix the script; a page that throws ships half-working' });
        if (lost.size) findings.push({ gate: 'render', grade: 'WARN', file, line: 1, evidence: `the shots show a fallback: fonts or stylesheets did not load (${[...lost].slice(0, 2).join(', ')})`, fix: 'Recapture when the host answers or the path is right; never review or sign off a fallback face' });
      } catch (e) {
        console.error(`render tier: failed on ${file}: ${e.message}`);
        failed.push({ file, message: e.message });
      } finally {
        await page.close().catch(() => {});
      }
    }
  } finally {
    await browser.close().catch(() => {});
  }
  if (SHOTS.length) console.error(heroOnly ? `render tier: ${SHOTS.length} hero screenshots in ${dirname(SHOTS[0])} (1280x800, 1440x900, 1920x1080 and 375x812 first screens)` : `render tier: ${SHOTS.length} screenshots in ${dirname(SHOTS[0])} (1280x800, 1440x900, 1920x1080 folds; 1440 and 375 full pages)`);

  const seen = new Set();
  const kept = findings.filter((f) => {
    const k = f.file + '|' + f.gate + '|' + f.evidence.replace(/^\[\d+px\] /, '');
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  kept.failed = failed;
  kept.inventories = inventories;
  return kept;
}

export function writeCompare(targets, note) {
  const groups = new Map();
  for (const t of targets) {
    const dir = join(process.env.SYNAPSE_DESIGN_TASK_DIR || join(process.cwd(), '.synapse', 'html-design'), 'review');
    if (!groups.has(dir)) groups.set(dir, []);
    groups.get(dir).push(slugOf(t));
  }
  const esc = (x) => String(x).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const made = [];
  for (const [dir, slugs] of groups) {
    const has = (side, slug, tag) => existsSync(join(dir, side, `${slug}-${tag}.png`));
    const pages = slugs.filter((x) => has('before', x, '1440x900') && has('shots', x, '1440x900'));
    if (!pages.length) continue;
    const pair = (slug, tag, label, cls) => (has('before', slug, tag) && has('shots', slug, tag) ? `<div class="pair ${cls}"><figure><img src="before/${esc(slug)}-${tag}.png" alt="${esc(slug)} before, ${label}"><figcaption>Before, ${label}</figcaption></figure><figure><img src="shots/${esc(slug)}-${tag}.png" alt="${esc(slug)} after, ${label}"><figcaption>After, ${label}</figcaption></figure></div>` : '');
    const body = pages.map((x) => `<section><h2>${esc(x)}</h2>${pair(x, '1440x900', 'first screen at 1440', '')}${pair(x, '1440-full', 'whole page at 1440', '')}${pair(x, '375', 'whole page on a phone', 'phone')}</section>`).join('\n');
    const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Before and after</title>
<meta name="description" content="The redesign's screenshots, before and after, side by side.">
<style>
:root { color-scheme: light; --paper: oklch(97% 0.004 250); --ink: oklch(22% 0.01 250); --muted: oklch(45% 0.01 250); --rule: oklch(86% 0.006 250); }
html, body { overflow-x: clip; }
body { margin: 0; padding: 48px 32px 96px; background: var(--paper); color: var(--ink); font: 16px/1.5 ui-sans-serif, system-ui, sans-serif; }
h1 { margin: 0 0 8px; font-size: 28px; line-height: 1.15; letter-spacing: -0.01em; }
p { margin: 0; color: var(--muted); max-width: 72ch; }
section { margin-top: 72px; }
h2 { margin: 0 0 16px; font-size: 18px; font-weight: 600; }
.pair { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 24px; align-items: start; margin-bottom: 32px; }
.pair.phone { max-width: 760px; }
figure { margin: 0; }
img { display: block; width: 100%; height: auto; outline: 1px solid var(--rule); outline-offset: -1px; background: oklch(100% 0 0); }
figcaption { margin-top: 8px; font-size: 14px; color: var(--muted); }
@media (max-width: 720px) { body { padding: 32px 16px 64px; } .pair { grid-template-columns: minmax(0, 1fr); } }
</style>
</head>
<body>
<h1>Before and after</h1>
<p>${esc(note || 'Each pair shows the page as it stood and as it stands now, at the same size.')}</p>
${body}
</body>
</html>
`;
    writeFileSync(join(dir, 'compare.html'), html);
    made.push(join(dir, 'compare.html'));
  }
  return made;
}
