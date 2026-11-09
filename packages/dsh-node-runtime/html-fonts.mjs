import { readFile, realpath } from 'node:fs/promises';
import { isAbsolute, relative, resolve } from 'node:path';
import { validateExternalUrl } from './html-sources.mjs';

const MAX_FONT_BYTES = 20 * 1024 * 1024;
const MAX_FACES = 24;
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

function faceKey(face) {
  return `${face.family.toLowerCase()}|${face.weight}|${face.italic}`;
}

/** Distinct loaded faces across every captured viewport. */
export function loadedFaces(captures) {
  const faces = new Map();
  for (const capture of captures) {
    for (const font of capture.fonts ?? []) {
      const family = String(font.family ?? '').trim();
      if (!family || family.length > 200 || GENERIC.test(family)) continue;
      const face = { family, weight: weightOf(font.weight), italic: font.style !== 'normal' };
      faces.set(faceKey(face), face);
    }
  }
  return [...faces.values()].slice(0, MAX_FACES);
}

function sfntUrl(sources, face) {
  const match = sources.find(
    (source) =>
      source.family.toLowerCase() === face.family.toLowerCase() &&
      weightOf(source.weight) === face.weight &&
      (source.style !== 'normal') === face.italic,
  );
  if (!match) return { url: null, webOnly: false };
  const url = match.urls.find((candidate) => /\.(?:ttf|otf)(?:[?#]|$)/i.test(candidate));
  return { url: url ?? null, webOnly: !url && match.urls.length > 0 };
}

async function readLocalFont(url, baseDir) {
  if (!baseDir) return null;
  const root = await realpath(baseDir);
  const decoded = decodeURIComponent(new URL(url).pathname).replace(/^\/+/, '');
  const candidate = await realpath(resolve(root, decoded));
  const rel = relative(root, candidate);
  if (!rel || rel.startsWith('..') || isAbsolute(rel)) return null;
  return readFile(candidate);
}

async function fontBytes(url, baseDir) {
  const parsed = new URL(url);
  const bytes =
    parsed.hostname === '127.0.0.1'
      ? await readLocalFont(url, baseDir)
      : Buffer.from(
          await (
            await fetch(validateExternalUrl(url), { signal: AbortSignal.timeout(30_000) })
          ).arrayBuffer(),
        );
  if (!bytes || bytes.length > MAX_FONT_BYTES) throw new Error('font file missing or too large');
  return bytes;
}

/**
 * Make the fonts a captured page used available to the canvas renderer:
 * the page's own TTF/OTF `@font-face` files first, then Google Fonts.
 */
export async function registerPageFonts(captures, { fetcher, baseDir }) {
  const sources = captures.flatMap((capture) => capture.fontSources ?? []);
  const faces = loadedFaces(captures);
  const warnings = [];
  const results = [];
  const remote = [];
  for (const face of faces) {
    const { url, webOnly } = sfntUrl(sources, face);
    if (url && typeof fetcher.addFace === 'function') {
      try {
        // oxlint-disable-next-line no-await-in-loop -- faces register one at a time into one cache
        const outcome = await fetcher.addFace(face, await fontBytes(url, baseDir));
        results.push({ ...outcome, source: 'page' });
        continue;
      } catch (error) {
        warnings.push(
          `Page font ${face.family} ${face.weight} could not be loaded: ${error.message}`,
        );
      }
    }
    remote.push({ face, webOnly });
  }
  let outcomes = [];
  try {
    outcomes = remote.length ? await fetcher.ensure(remote.map((item) => item.face)) : [];
  } catch (error) {
    warnings.push(
      `Font download failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  outcomes.forEach((outcome, index) => {
    results.push({ ...outcome, source: 'google' });
    if (outcome.available) return;
    const hint = remote[index]?.webOnly
      ? '; the page serves it only as WOFF/WOFF2, which the canvas renderer cannot load — provide a TTF/OTF'
      : '';
    warnings.push(`Missing font ${outcome.family} ${outcome.weight}: ${outcome.error}${hint}`);
  });
  for (const outcome of results) if (outcome.warning) warnings.push(outcome.warning);
  return {
    faces: results.map(({ family, weight, italic, available, source }) => ({
      family,
      weight,
      italic,
      available,
      source,
    })),
    warnings,
  };
}
