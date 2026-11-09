// Page-side helpers for the browser HTML capture. Each function runs inside
// the captured page through `Runtime.evaluate`, so it must stay
// self-contained: no closures over module scope, only its argument.

/** Settle a freshly loaded page: fonts, an optional ready expression, lazy media. */
export async function settlePage({ readyExpression, waitMs, maxWaitMs }) {
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const frames = () =>
    new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  const deadline = Date.now() + maxWaitMs;
  const warnings = [];
  try {
    if (document.fonts?.ready) await Promise.race([document.fonts.ready, sleep(2500)]);
  } catch {}
  if (readyExpression) {
    let ready = false;
    while (Date.now() < deadline) {
      try {
        // oxlint-disable-next-line no-eval -- caller-supplied readiness probe for its own page
        if (await (0, eval)(readyExpression)) {
          ready = true;
          break;
        }
      } catch {}
      await sleep(100);
    }
    if (!ready) warnings.push('readyExpression did not become true before the capture timeout');
  }
  for (const image of document.querySelectorAll('img[loading="lazy"]')) image.loading = 'eager';
  const step = Math.max(200, window.innerHeight || 800);
  const bottom = () =>
    Math.max(document.body?.scrollHeight ?? 0, document.documentElement.scrollHeight);
  for (
    let y = 0, steps = 0;
    y < bottom() && steps < 40 && Date.now() < deadline;
    y += step, steps += 1
  ) {
    window.scrollTo(0, y);
    await sleep(60);
  }
  window.scrollTo(0, 0);
  const pending = [...document.images].filter((image) => !image.complete);
  if (pending.length) {
    await Promise.race([
      Promise.all(
        pending.map(
          (image) =>
            new Promise((resolve) => {
              image.addEventListener('load', resolve, { once: true });
              image.addEventListener('error', resolve, { once: true });
            }),
        ),
      ),
      sleep(Math.max(0, Math.min(4000, deadline - Date.now()))),
    ]);
  }
  if (waitMs > 0) await sleep(Math.min(waitMs, Math.max(0, deadline - Date.now())));
  await frames();
  return { height: bottom(), warnings };
}

/**
 * Describe what the DOM snapshot cannot carry by itself: native form
 * controls (their state and accent colour), media boxes whose pixels must
 * be captured from the compositor, and the font faces the page loaded.
 */
export function describePage({ maxMedia }) {
  const round = (value) => Math.round(value * 100) / 100;
  const pageRect = (element) => {
    const rect = element.getBoundingClientRect();
    return {
      x: round(rect.left + window.scrollX),
      y: round(rect.top + window.scrollY),
      w: round(rect.width),
      h: round(rect.height),
    };
  };
  const visible = (element) => {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return (
      rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none'
    );
  };
  const number = (value, fallback) => (Number.isFinite(Number(value)) ? Number(value) : fallback);
  const controls = [];
  for (const element of document.querySelectorAll('input, progress, meter, select')) {
    if (!visible(element)) continue;
    const style = getComputedStyle(element);
    const tag = element.tagName.toLowerCase();
    const type = tag === 'input' ? (element.type || 'text').toLowerCase() : tag;
    if (!['range', 'checkbox', 'radio', 'progress', 'meter', 'select'].includes(type)) continue;
    const control = {
      type,
      appearance: style.getPropertyValue('appearance') || 'auto',
      accentColor: style.getPropertyValue('accent-color') || 'auto',
      color: style.color,
      disabled: Boolean(element.disabled),
    };
    if (type === 'range' || type === 'meter') {
      control.min = number(element.min, 0);
      control.max = number(element.max, type === 'meter' ? 1 : 100);
      control.value = number(element.value, control.min);
    } else if (type === 'progress') {
      control.min = 0;
      control.max = number(element.max, 1);
      control.value = element.position < 0 ? null : number(element.value, 0);
    } else if (type === 'checkbox' || type === 'radio') {
      control.checked = Boolean(element.checked);
    }
    controls.push({ tag, rect: pageRect(element), control });
  }
  const media = [];
  for (const element of document.querySelectorAll('canvas, video')) {
    if (media.length >= maxMedia) break;
    if (!visible(element)) continue;
    media.push({
      tag: element.tagName.toLowerCase(),
      rect: pageRect(element),
      index: media.length,
    });
    element.setAttribute('data-op-media-capture', String(media.length - 1));
  }
  const fonts = [];
  if (document.fonts) {
    for (const face of document.fonts) {
      if (face.status !== 'loaded') continue;
      fonts.push({
        family: face.family.replace(/^['"]|['"]$/g, ''),
        weight: face.weight,
        style: face.style,
      });
    }
  }
  const sources = [];
  for (const sheet of document.styleSheets) {
    let rules;
    try {
      rules = sheet.cssRules;
    } catch {
      continue;
    }
    for (const rule of rules ?? []) {
      if (rule.type !== CSSRule.FONT_FACE_RULE) continue;
      const family = rule.style
        .getPropertyValue('font-family')
        .replace(/^['"]|['"]$/g, '')
        .trim();
      const src = rule.style.getPropertyValue('src');
      const urls = [...src.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)].map((match) => {
        try {
          return new URL(match[1], sheet.href || document.baseURI).href;
        } catch {
          return null;
        }
      });
      sources.push({
        family,
        weight: rule.style.getPropertyValue('font-weight') || '400',
        style: rule.style.getPropertyValue('font-style') || 'normal',
        urls: urls.filter(Boolean),
      });
    }
  }
  return { controls, media, fonts, fontSources: sources };
}

/** Show only one captured media element so its screenshot has no overlays. */
export function isolateMedia({ index }) {
  let style = document.getElementById('__op_media_isolate__');
  if (index === null) {
    style?.remove();
    for (const element of document.querySelectorAll('[data-op-media-capture]')) {
      element.removeAttribute('data-op-media-capture');
    }
    return true;
  }
  if (!style) {
    style = document.createElement('style');
    style.id = '__op_media_isolate__';
    document.head.appendChild(style);
  }
  style.textContent =
    `*{visibility:hidden!important;transition:none!important}` +
    `[data-op-media-capture="${index}"]{visibility:visible!important}`;
  return true;
}

export function pageCall(fn, argument) {
  return `(${fn.toString()})(${JSON.stringify(argument ?? {})})`;
}
