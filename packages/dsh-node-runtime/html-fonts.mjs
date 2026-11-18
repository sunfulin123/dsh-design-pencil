import { open, realpath } from 'node:fs/promises';
import { isAbsolute, relative, resolve } from 'node:path';
import { isIconFontGlyph } from './html-font-defaults.mjs';
import { fetchFontResource, linkedFontSources } from './html-font-stylesheets.mjs';

const MAX_FONT_BYTES = 20 * 1024 * 1024;
const MAX_FACES = 24;
const MAX_SOURCE_ALTERNATIVES = 4;
const SOURCE_DOWNLOAD_BUDGET_MS = 25_000;
const UNSUPPORTED_SOURCE = /\.(?:woff2?|svg|eot)(?:[?#]|$)/i;
const GENERIC = /^(serif|sans-serif|monospace|cursive|fantasy|system-ui|ui-[a-z-]+|emoji|math)$/i;

function weightOf(raw) {
  const first = Number(
    String(raw ?? '400')
      .trim()
      .split(/\s+/)[0],
  );
  if (Number.isFinite(first)) return Math.min(1000, Math.max(1, Math.round(first)));
  return String(raw).trim().toLowerCase() === 'bold' ? 700 : 400;
}

const italicOf = (style = 'normal') => style !== 'normal';

function faceKey(face) {
  return `${face.family.toLowerCase()}|${face.weight}|${face.italic}`;
}

/** Distinct loaded faces and observed icon variants across captured viewports. */
export function loadedFaces(captures) {
  const faces = new Map();
  const iconFamilies = new Set();
  function add(font, icon) {
    const family = String(font.family ?? '').trim();
    if (!family || family.length > 200 || GENERIC.test(family)) return;
    const face = { family, weight: weightOf(font.weight), italic: italicOf(font.style) };
    if (icon) {
      face.icon = true;
      iconFamilies.add(family.toLowerCase());
    }
    faces.set(faceKey(face), face);
  }
  for (const capture of captures) {
    for (const icon of capture.iconFonts ?? []) add(icon, true);
  }
  for (const capture of captures) {
    for (const font of capture.fonts ?? []) {
      if (iconFamilies.has(font.family?.toLowerCase())) continue;
      add(font, isIconFontGlyph(font.family));
    }
  }
  return [...faces.values()].slice(0, MAX_FACES);
}

function sourceAlternatives(sources, face) {
  const matches = sources.filter((source) => {
    if (
      source.family.toLowerCase() !== face.family.toLowerCase() ||
      italicOf(source.style) !== face.italic
    )
      return false;
    const weights = String(source.weight ?? '400')
      .trim()
      .split(/\s+/);
    return face.weight >= weightOf(weights[0]) && face.weight <= weightOf(weights.at(-1));
  });
  const declared = [...new Set(matches.flatMap((source) => source.urls))];
  const candidates = declared.filter((url) => !UNSUPPORTED_SOURCE.test(url));
  const sfnt = /\.(?:ttf|otf)(?:[?#]|$)/i;
  return {
    urls: [
      ...candidates.filter((url) => sfnt.test(url)),
      ...candidates.filter((url) => !sfnt.test(url)),
    ].slice(0, MAX_SOURCE_ALTERNATIVES),
    webOnly: candidates.length === 0 && declared.length > 0,
  };
}

async function readLocalFont(url, baseDir) {
  if (!baseDir) return null;
  const root = await realpath(baseDir);
  const decoded = decodeURIComponent(new URL(url).pathname).replace(/^\/+/, '');
  const candidate = await realpath(resolve(root, decoded));
  const rel = relative(root, candidate);
  if (!rel || rel.startsWith('..') || isAbsolute(rel)) return null;
  const file = await open(candidate);
  try {
    const info = await file.stat();
    if (!info.isFile() || info.size > MAX_FONT_BYTES) return null;
    return await file.readFile();
  } finally {
    await file.close();
  }
}

async function fontBytes(url, baseDir, fetchImpl, signal) {
  const parsed = new URL(url);
  const bytes =
    parsed.hostname === '127.0.0.1'
      ? await readLocalFont(url, baseDir)
      : (await fetchFontResource(url, MAX_FONT_BYTES, fetchImpl, undefined, signal)).bytes;
  if (!bytes || bytes.length > MAX_FONT_BYTES) throw new Error('font file missing or too large');
  return bytes;
}

/** Register source faces before consulting text font providers. Icon families use original sources. */
export async function registerPageFonts(
  captures,
  { fetcher, baseDir, fetchImpl = globalThis.fetch, signal },
) {
  const faces = loadedFaces(captures);
  if (!faces.length) return { faces: [], warnings: [] };
  const sourceBudget = AbortSignal.timeout(SOURCE_DOWNLOAD_BUDGET_MS);
  const fetchSource = (url, options) =>
    fetchImpl(url, {
      ...options,
      signal: AbortSignal.any([sourceBudget, options.signal]),
    });
  const linked = await linkedFontSources(captures, fetchSource, signal);
  const sources = [...captures.flatMap((capture) => capture.fontSources ?? []), ...linked.sources];
  const warnings = [...linked.warnings];
  const results = [];
  const remote = [];
  const failedUrls = new Map();
  let downloaded;
  for (const face of faces) {
    const { urls, webOnly } = sourceAlternatives(sources, face);
    let imported;
    let sourceWarning;
    for (const url of urls) {
      signal?.throwIfAborted();
      if (sourceBudget.aborted || typeof fetcher.addFace !== 'function') break;
      try {
        if (failedUrls.has(url)) throw failedUrls.get(url);
        if (downloaded?.url !== url) {
          try {
            // oxlint-disable-next-line no-await-in-loop -- try each source in preference order
            downloaded = { url, bytes: await fontBytes(url, baseDir, fetchSource, signal) };
          } catch (error) {
            failedUrls.set(url, error);
            throw error;
          }
        }
        // oxlint-disable-next-line no-await-in-loop -- faces share one registration cache
        const outcome = await fetcher.addFace(face, downloaded.bytes);
        if (outcome.available) {
          imported = { ...outcome, icon: face.icon, source: 'page' };
          break;
        }
        sourceWarning = `was rejected: ${outcome.error}`;
      } catch (error) {
        signal?.throwIfAborted();
        sourceWarning = `could not be loaded: ${error.message}`;
      }
    }
    if (imported) {
      results.push(imported);
      continue;
    }
    if (sourceWarning) warnings.push(`Page font ${face.family} ${face.weight} ${sourceWarning}`);
    if (face.icon) {
      results.push({ ...face, source: 'page', available: false });
      const reason = webOnly
        ? 'source only supplies WOFF/WOFF2 or another browser font format'
        : 'no usable original TTF/OTF was available';
      warnings.push(`Missing icon font ${face.family} ${face.weight}: ${reason}`);
    } else {
      remote.push({ face, webOnly });
    }
  }
  if (sourceBudget.aborted) warnings.push('Source font downloads reached the 25-second budget');
  let outcomes = [];
  try {
    outcomes = remote.length
      ? await fetcher.ensure(
          remote.map((item) => item.face),
          { signal },
        )
      : [];
  } catch (error) {
    signal?.throwIfAborted();
    warnings.push(
      `Font download failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  outcomes.forEach((outcome, index) => {
    results.push({ ...outcome, source: 'google' });
    if (outcome.available) return;
    const hint = remote[index]?.webOnly
      ? '; the page serves it only as WOFF/WOFF2 or another browser format, which the canvas renderer cannot load. Supply a TTF/OTF.'
      : '';
    warnings.push(`Missing font ${outcome.family} ${outcome.weight}: ${outcome.error}${hint}`);
  });
  for (const outcome of results) if (outcome.warning) warnings.push(outcome.warning);
  return {
    faces: results.map(({ family, weight, italic, available, source, icon }) => ({
      family,
      weight,
      italic,
      available,
      source,
      ...(icon ? { icon } : {}),
    })),
    warnings,
  };
}

const iconRectMatches = (a, b) =>
  a && b && ['x', 'y', 'w', 'h'].every((key) => Math.abs(a[key] - b[key]) <= 1.5);

/** Preserve captured ligatures and unavailable glyphs without flattening their parent controls. */
export function applyUnresolvedIconFallbacks(snapshot, capture, registered) {
  const pixels = capture.iconPixels ?? [];
  const known = new Map(registered.map((face) => [faceKey(face), face]));
  const active = pixels.filter(
    (icon) =>
      icon.ligature || known.get(
        faceKey({
          family: icon.family,
          weight: weightOf(icon.weight),
          italic: italicOf(icon.style),
        }),
      )?.available === false,
  );
  const unavailable = new Set(
    [...known.values()].filter((face) => face.icon && !face.available).map(faceKey),
  );
  const expectedLigatures = new Map();
  for (const icon of capture.iconFonts ?? []) {
    if (!icon.ligature) continue;
    const key = faceKey({ family: icon.family, weight: weightOf(icon.weight), italic: italicOf(icon.style) });
    if (!expectedLigatures.has(key)) expectedLigatures.set(key, new Set());
    expectedLigatures.get(key).add(icon.text);
  }
  if (!active.length && !unavailable.size && !expectedLigatures.size) return [];

  const matches = new Map(active.map((icon) => [icon, []]));
  const observed = new Map();
  function visit(node, parent) {
    if (node.kind === 'text') {
      const styles =
        node.segments?.length === 1 ? (node.segments[0].styles ?? node.styles) : node.styles;
      const family = styles?.['font-family']
        ?.split(',')[0]
        .trim()
        .replace(/^['"]|['"]$/g, '');
      const weight = weightOf(styles?.['font-weight']);
      const italic = italicOf(styles?.['font-style']);
      const text = node.text?.trim();
      if (family && text) {
        const key = faceKey({ family, weight, italic });
        if (unavailable.has(key) || expectedLigatures.get(key)?.has(text)) observed.set(node, family);
      }
      for (const icon of active) {
        if (family?.toLowerCase() !== icon.family.toLowerCase() || node.text?.trim() !== icon.text)
          continue;
        if (weight !== weightOf(icon.weight) || italic !== italicOf(icon.style)) continue;
        if (
          iconRectMatches(node.rect, icon.rect) ||
          (parent?.children.length === 1 && iconRectMatches(parent.rect, icon.rect))
        )
          matches.get(icon).push(node);
      }
    }
    for (const child of node.children ?? []) visit(child, node);
  }
  if (snapshot.root) visit(snapshot.root);

  const applied = new Map();
  const missed = new Set();
  for (const [icon, nodes] of matches) {
    const [node] = nodes;
    if (nodes.length !== 1 || node.kind !== 'text') {
      missed.add(icon.family);
      continue;
    }
    Object.assign(node, { kind: 'image', tag: 'img', rect: icon.rect, src: icon.src, styles: {} });
    delete node.text;
    delete node.lines;
    delete node.segments;
    observed.delete(node);
    applied.set(icon.family, (applied.get(icon.family) ?? 0) + 1);
  }
  return [
    ...Array.from(
      applied,
      ([family, count]) => `Used captured pixels for ${count} ${family} icon glyph(s)`,
    ),
    ...Array.from(
      missed,
      (family) => `Could not locate some captured ${family} glyphs in the snapshot`,
    ),
    ...Array.from(
      new Set(observed.values()),
      (family) => `Unresolved icon glyphs from ${family} remain without captured pixels`,
    ),
  ];
}
