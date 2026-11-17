/** Recover font sources from linked stylesheets that CSSOM hides across origins. */
import { validateExternalUrl } from './html-sources.mjs';

const MAX_CSS_BYTES = 1024 * 1024;

/** Bounded, validated downloads; redirects cannot escape the external-URL policy. */
export async function fetchFontResource(rawUrl, maxBytes, fetchImpl = globalThis.fetch, headers) {
  let url = validateExternalUrl(rawUrl);
  const signal = AbortSignal.timeout(15_000);
  for (let redirects = 0; redirects < 5; redirects++) {
    // oxlint-disable-next-line no-await-in-loop -- each redirect depends on the preceding response
    const response = await fetchImpl(url.href, { redirect: 'manual', signal, headers });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      await response.body?.cancel();
      url = validateExternalUrl(new URL(response.headers.get('location'), url).href);
      continue;
    }
    if (!response.ok) {
      await response.body?.cancel();
      throw new Error(`Font resource HTTP ${response.status}`);
    }
    if (Number(response.headers.get('content-length')) > maxBytes) {
      await response.body?.cancel();
      throw new Error('Font resource exceeds size limit');
    }
    const chunks = [];
    let size = 0;
    const reader = response.body?.getReader();
    if (!reader) throw new Error('Empty font resource');
    try {
      while (true) {
        // oxlint-disable-next-line no-await-in-loop -- bound bytes while streaming a single response
        const { value, done } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > maxBytes) throw new Error('Font resource exceeds size limit');
        chunks.push(value);
      }
    } finally {
      await reader.cancel();
      reader.releaseLock();
    }
    return { bytes: Buffer.concat(chunks), url: url.href };
  }
  throw new Error('Too many font resource redirects');
}

export function stylesheetFontSources(css, baseUrl) {
  const sources = [];
  for (const [, body] of css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .matchAll(/@font-face\s*\{([^}]+)\}/gi)) {
    const property = (name) =>
      new RegExp(`(?:^|;)\\s*${name}\\s*:\\s*([^;]+)`, 'i').exec(body)?.[1]?.trim();
    const family = property('font-family')?.replace(/^['"]|['"]$/g, '');
    if (!family) continue;
    const urls = [...(property('src') ?? '').matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)].flatMap(
      ([, value]) => {
        try {
          return [validateExternalUrl(new URL(value, baseUrl).href).href];
        } catch {
          return [];
        }
      },
    );
    sources.push({
      family,
      weight: property('font-weight') ?? '400',
      style: property('font-style') ?? 'normal',
      urls,
    });
  }
  return sources;
}

function stylesheetImports(css, baseUrl) {
  const pattern = /@import\s+(?:url\(\s*(?:"([^"]+)"|'([^']+)'|([^\s)]+))\s*\)|"([^"]+)"|'([^']+)')/gi;
  return [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(pattern)]
    .map(match => new URL(match.slice(1).find(Boolean), baseUrl).href);
}

/** Bounded stylesheet graph, including @import; no provider or extension assumptions. */
export async function linkedFontSources(captures, fetchImpl) {
  let queue = [...new Set(captures.flatMap((capture) => capture.fontStylesheets ?? []))];
  const seen = new Set();
  const sources = [];
  const warnings = [];
  while (queue.length && seen.size < 8) {
    const pending = queue.filter((url) => !seen.has(url));
    const urls = pending.slice(0, 8 - seen.size);
    if (!urls.length) break;
    urls.forEach((url) => seen.add(url));
    // oxlint-disable-next-line no-await-in-loop -- imported sheets are discovered from each preceding level
    const results = await Promise.all(
      urls.map(async (url) => {
        try {
          const response = await fetchFontResource(url, MAX_CSS_BYTES, fetchImpl, {
            'User-Agent': 'Mozilla/5.0',
          });
          const css = response.bytes.toString('utf8');
          const imports = stylesheetImports(css, response.url);
          return { sources: stylesheetFontSources(css, response.url), imports };
        } catch (error) {
          warnings.push(`Linked font stylesheet could not be loaded: ${error.message}`);
          return { sources: [], imports: [] };
        }
      }),
    );
    sources.push(...results.flatMap((result) => result.sources));
    queue = [...pending.slice(urls.length), ...results.flatMap((result) => result.imports)];
  }
  if (queue.some((url) => !seen.has(url)))
    warnings.push('Linked font stylesheet discovery reached its 8-sheet limit');
  return { sources, warnings };
}
