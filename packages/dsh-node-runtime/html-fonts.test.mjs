import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { FontFetcher } from './font-fetcher.mjs';
import { registerPageFonts } from './html-fonts.mjs';
import { fetchFontResource, stylesheetFontSources } from './html-font-stylesheets.mjs';
import { withHtmlFontDefaults } from './html-font-defaults.mjs';

const sfnt = await readFile(
  new URL('../../crates/op-host-desktop/assets/fonts/InstrumentSerif-Regular.ttf', import.meta.url),
);

test('linked Google stylesheet fonts are downloaded and registered without asking for a replacement', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'linked-fonts-'));
  t.after(() => rm(directory, { force: true, recursive: true }));
  const requests = [];
  const fetchImpl = async (url, options) => {
    requests.push(url);
    if (url.includes('googleapis.com')) {
      assert.equal(options.headers['User-Agent'], 'Mozilla/5.0');
      const family = url.includes('icon?') ? 'Material Icons' : 'Roboto';
      return new Response(
        `@font-face{font-family:'${family}';font-style:normal;font-weight:400;src:url(https://fonts.gstatic.com/${family.replaceAll(' ', '')}.ttf) format('truetype')}`,
      );
    }
    return new Response(sfnt);
  };
  const fetcher = new FontFetcher(directory, { fetchImpl });
  const result = await registerPageFonts(
    [
      {
        fonts: ['Roboto', 'Material Icons'].map((family) => ({
          family,
          weight: '400',
          style: 'normal',
        })),
        fontStylesheets: [
          'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap',
          'https://fonts.googleapis.com/icon?family=Material+Icons',
        ],
      },
    ],
    { fetcher, fetchImpl },
  );
  assert.equal(result.faces.length, 2);
  assert.ok(result.faces.every((face) => face.available && face.source === 'page'));
  assert.deepEqual(result.warnings, []);
  assert.equal(requests.length, 4);
  const reopened = new FontFetcher(directory);
  assert.equal(reopened.manifest().faces.length, 2);
  for (const face of reopened.manifest().faces)
    assert.deepEqual(await reopened.bytes(face.id), sfnt);
});

test('stylesheet parsing preserves weights, italic and relative asset URLs', () => {
  const sources = stylesheetFontSources(
    `/* comment */ @font-face{font-family:'Brand Serif';font-weight:700;font-style:italic;src:url(../font.ttf)}`,
    'https://cdn.example/css/fonts.css',
  );
  assert.deepEqual(sources, [
    {
      family: 'Brand Serif',
      weight: '700',
      style: 'italic',
      urls: ['https://cdn.example/font.ttf'],
    },
  ]);
});

test('font resources reject HTTP errors, oversized streams and private redirects', async () => {
  await assert.rejects(
    fetchFontResource('https://cdn.example/a', 8, async () => new Response('no', { status: 403 })),
    /HTTP 403/,
  );
  await assert.rejects(
    fetchFontResource('https://cdn.example/a', 8, async () => new Response('123456789')),
    /size limit/,
  );
  await assert.rejects(
    fetchFontResource(
      'https://cdn.example/a',
      8,
      async () =>
        new Response(null, { status: 302, headers: { location: 'http://127.0.0.1/secret' } }),
    ),
    /restricted/,
  );
});

test('unavailable linked fonts remain explicit warnings instead of a successful registration', async () => {
  const fetcher = {
    ensure: async (faces) =>
      faces.map((face) => ({ ...face, available: false, error: 'not found' })),
  };
  const result = await registerPageFonts(
    [
      {
        fonts: [{ family: 'Private Font', weight: 400, style: 'normal' }],
        fontStylesheets: ['https://cdn.example/font.css'],
      },
    ],
    { fetcher, fetchImpl: async () => new Response('', { status: 404 }) },
  );
  assert.equal(result.faces[0].available, false);
  assert.match(result.warnings.join('\n'), /HTTP 404/);
  assert.match(result.warnings.join('\n'), /Missing font Private Font/);
});

test('ordinary text gets an automatic fallback while source names and icon glyphs are retained', () => {
  const document = {
    children: [
      {
        type: 'text',
        fontFamily: 'Private Brand',
        content: 'Hello',
        children: [{ fontFamily: 'Other', text: 'World' }],
      },
      { type: 'text', fontFamily: 'Material Icons', content: 'unfold_more' },
      { type: 'text', fontFamily: 'Custom Face', content: '\uE001' },
      { type: 'text', fontFamily: 'Georgia, serif', content: 'Original fallback' },
    ],
  };
  withHtmlFontDefaults(document);
  assert.equal(document.children[0].fontFamily, 'Private Brand, Inter, sans-serif');
  assert.equal(document.children[0].children[0].fontFamily, 'Other, Inter, sans-serif');
  assert.equal(document.children[1].fontFamily, 'Material Icons');
  assert.equal(document.children[2].fontFamily, 'Custom Face');
  assert.equal(document.children[3].fontFamily, 'Georgia, serif');
  withHtmlFontDefaults(document);
  assert.equal(document.children[0].fontFamily, 'Private Brand, Inter, sans-serif');
});

test('font discovery follows standard CSS imports without provider or filename heuristics', async () => {
  const fetched = [];
  const result = await registerPageFonts(
    [
      {
        fonts: [{ family: 'Brand Serif', weight: '700', style: 'italic' }],
        fontStylesheets: ['https://assets.example/theme'],
      },
    ],
    {
      fetcher: {
        addFace: async (face, bytes) => ({ ...face, available: bytes.equals(sfnt) }),
        ensure: async () => assert.fail('use the source font, not a provider lookup'),
      },
      fetchImpl: async (url) => {
        fetched.push(url);
        if (url.endsWith('/theme')) return new Response('@import url(./fonts?version=1) screen;');
        if (url.includes('/fonts?'))
          return new Response(
            '@font-face{font-family:"Brand Serif";font-style:italic;font-weight:700;src:url(./asset?face=body)}',
          );
        return new Response(sfnt);
      },
    },
  );
  assert.equal(result.faces[0].source, 'page');
  assert.deepEqual(fetched, [
    'https://assets.example/theme',
    'https://assets.example/fonts?version=1',
    'https://assets.example/asset?face=body',
  ]);
});
