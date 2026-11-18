// Page-side helpers for the browser HTML capture. Each function runs inside
// the captured page through `Runtime.evaluate`, so it must stay
// self-contained: no closures over module scope, only its argument.

/** Retain constructor sources that the FontFace API does not expose after creation. */
export function trackDynamicFontSources() {
  const sources = new WeakMap();
  const key = Symbol.for('openpencil.htmlImport.fontSources');
  Object.defineProperty(window, key, { value: face => sources.get(face) });
  window.FontFace = new Proxy(window.FontFace, {
    construct(target, args, newTarget) {
      const face = Reflect.construct(target, args, newTarget);
      const source = args[1];
      if (typeof source === 'string' && source.length <= 16 * 1024) {
        const urls = [...source.matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^\s)]+))\s*\)/gi)]
          .slice(0, 16)
          .flatMap(([, doubleQuoted, singleQuoted, unquoted]) => {
            try {
              const url = new URL(doubleQuoted ?? singleQuoted ?? unquoted, document.baseURI);
              return url.protocol === 'http:' || url.protocol === 'https:' ? [url.href] : [];
            } catch {
              return [];
            }
          });
        if (urls.length) sources.set(face, urls);
      }
      return face;
    },
  });
}

/** Settle a freshly loaded page: fonts, an optional ready expression, lazy media. */
export async function settlePage({ readyExpression, waitMs, maxWaitMs, preserveScroll = false }) {
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
    !preserveScroll && y < bottom() && steps < 40 && Date.now() < deadline;
    y += step, steps += 1
  ) {
    window.scrollTo(0, y);
    await sleep(60);
  }
  if (!preserveScroll) window.scrollTo(0, 0);
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
export function describePage({ maxMedia, pixelMedia = false, markMedia = false }, view = window, iconGlyph) {
  const { document, CSSRule } = view;
  const round = (value) => Math.round(value * 100) / 100;
  const pageRect = (element) => {
    const rect = element.getBoundingClientRect();
    return {
      x: round(rect.left + view.scrollX),
      y: round(rect.top + view.scrollY),
      w: round(rect.width),
      h: round(rect.height),
    };
  };
  const visible = (element) => {
    const rect = element.getBoundingClientRect();
    const style = view.getComputedStyle(element);
    return (
      rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none'
    );
  };
  const number = (value, fallback) => (Number.isFinite(Number(value)) ? Number(value) : fallback);
  const controls = [];
  for (const element of document.querySelectorAll('input, progress, meter, select')) {
    if (!visible(element)) continue;
    const style = view.getComputedStyle(element);
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
    if (markMedia) element.setAttribute('data-op-media-capture', String(media.length - 1));
  }
  const fonts = [];
  const sources = [];
  const dynamicSources = view[Symbol.for('openpencil.htmlImport.fontSources')];
  if (document.fonts) {
    for (const face of document.fonts) {
      if (face.status !== 'loaded' && face.status !== 'error') continue;
      const descriptor = {
        family: face.family.replace(/^['"]|['"]$/g, ''),
        weight: face.weight,
        style: face.style,
      };
      fonts.push(descriptor);
      const urls = dynamicSources?.(face);
      if (urls) sources.push({ ...descriptor, urls });
    }
  }
  const fontStylesheets = [];
  const seenSheets = new Set();
  const visitSheet = (sheet) => {
    if (!sheet || seenSheets.has(sheet) || seenSheets.size >= 32) return;
    seenSheets.add(sheet);
    let rules;
    try {
      rules = sheet.cssRules;
    } catch {
      if (sheet.href) fontStylesheets.push(sheet.href);
      return;
    }
    const visitRules = (entries) => {
      for (const rule of entries ?? []) {
        if (rule.type === CSSRule.IMPORT_RULE) {
          visitSheet(rule.styleSheet);
          continue;
        }
        if (rule.type !== CSSRule.FONT_FACE_RULE) {
          if (rule.cssRules) visitRules(rule.cssRules);
          continue;
        }
        const family = rule.style
          .getPropertyValue("font-family")
          .replace(/^['"]|['"]$/g, "")
          .trim();
        const src = rule.style.getPropertyValue("src");
        const urls = [...src.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)].flatMap(([, value]) => {
          try {
            return [new URL(value, sheet.href || document.baseURI).href];
          } catch {
            return [];
          }
        });
        sources.push({
          family,
          weight: rule.style.getPropertyValue("font-weight") || "400",
          style: rule.style.getPropertyValue("font-style") || "normal",
          urls,
        });
      }
    };
    visitRules(rules);
  };
  for (const sheet of [...document.styleSheets, ...document.adoptedStyleSheets]) visitSheet(sheet);
  const compositorVisible = element => {
    const rect = element.getBoundingClientRect();
    let x = rect.left + rect.width / 2;
    let y = rect.top + rect.height / 2;
    let target = element;
    for (let doc = document; doc; ) {
      const hit = doc.elementFromPoint(x, y);
      if (!hit || (!target.contains(hit) && !hit.contains(target))) return false;
      const frame = doc.defaultView.frameElement;
      if (!frame) return true;
      const bounds = frame.getBoundingClientRect();
      x += bounds.left + frame.clientLeft;
      y += bounds.top + frame.clientTop;
      target = frame;
      doc = frame.ownerDocument;
    }
    return false;
  };
  const snapshotRect = (element, rect) => {
    for (let ancestor = element; ancestor; ancestor = ancestor.parentElement) {
      if (view.getComputedStyle(ancestor).position === 'fixed')
        return { ...rect, x: rect.x - view.scrollX, y: rect.y - view.scrollY };
    }
    return rect;
  };
  const remoteImages = [];
  if (pixelMedia) {
    for (const image of document.images) {
      const src = image.currentSrc || image.src;
      if (!/^https?:\/\//.test(src) || !image.complete || !image.naturalWidth ||
          !visible(image)) continue;
      const rect = pageRect(image);
      remoteImages.push({ src, rect, nodeRect: snapshotRect(image, rect), painted: compositorVisible(image) });
    }
  }
  const masks = [];
  let maskCount = 0;
  for (const element of pixelMedia ? document.body?.querySelectorAll('*') ?? [] : []) {
    if (element.ownerSVGElement) continue;
    const style = view.getComputedStyle(element);
    if (!style.maskImage.includes('url(') &&
        !(element.localName === 'svg' && element.querySelector('mask') && element.querySelector('[mask]'))) continue;
    if (!visible(element)) continue;
    maskCount++;
    if (masks.length >= 64 || !compositorVisible(element)) continue;
    const rect = pageRect(element);
    const nodeRect = snapshotRect(element, rect);
    masks.push({
      tag: element.localName, rect, nodeRect,
      id: element.id.length <= 64 ? element.id.trim() : '',
      className: (element.getAttribute('class') || '').trim().slice(0, 200),
    });
  }
  const icons = [];
  if (iconGlyph) {
    const loadedFamilies = new Set([...document.fonts].filter(face => face.status === 'loaded')
      .map(face => face.family.replace(/^['"]|['"]$/g, '').toLowerCase()));
    for (const element of document.querySelectorAll('i,span,[data-icon],[class*="icon" i]')) {
      if (icons.length === 64) break;
      if (element.childElementCount || !visible(element)) continue;
      const text = element.textContent.trim();
      const style = view.getComputedStyle(element);
      const family = style.fontFamily.split(',')[0].trim().replace(/^['"]|['"]$/g, '');
      if (!iconGlyph(family, text)) continue;
      const weight = style.fontWeight;
      const fontStyle = style.fontStyle;
      const loaded = loadedFamilies.has(family.toLowerCase()) && compositorVisible(element);
      const rect = pageRect(element);
      const ligature = /^[a-z0-9_][a-z0-9_-]+$/i.test(text);
      icons.push({ family, weight, style: fontStyle, text, loaded, ligature, rect, nodeRect: snapshotRect(element, rect) });
    }
  }
  return { controls, media, fonts, fontSources: sources, fontStylesheets, icons, masks, maskCount, remoteImages,
    viewport: { x: view.scrollX, y: view.scrollY, w: view.innerWidth, h: view.innerHeight },
  };
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
