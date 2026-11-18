import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { FontFetcher } from './font-fetcher.mjs';
import { applyUnresolvedIconFallbacks, registerPageFonts } from './html-fonts.mjs';
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

test('dynamic source font alternatives are deduplicated and used at the captured icon weight', async () => {
  const requests = [];
  const font = { family: 'Product Glyphs', weight: '100 900', style: 'normal' };
  const urls = [
    'https://cdn.example/product.woff2',
    'https://cdn.example/broken.ttf',
    'https://cdn.example/broken.ttf',
    'https://cdn.example/product.ttf',
  ];
  const capture = {
    fonts: [font],
    iconFonts: [{ ...font, weight: '600' }],
    fontSources: [{ ...font, urls }],
  };
  const result = await registerPageFonts([capture, capture], {
    fetcher: {
      addFace: async (face, bytes) => ({ ...face, available: bytes.equals(sfnt) }),
      ensure: async () => assert.fail('icon fonts should use their original source'),
    },
    fetchImpl: async (url) => {
      requests.push(url);
      return url.endsWith('/broken.ttf') ? new Response('', { status: 404 }) : new Response(sfnt);
    },
  });
  assert.deepEqual(requests, ['https://cdn.example/broken.ttf', 'https://cdn.example/product.ttf']);
  assert.deepEqual(result.faces, [
    {
      family: 'Product Glyphs',
      weight: 600,
      italic: false,
      available: true,
      source: 'page',
      icon: true,
    },
  ]);
  assert.deepEqual(result.warnings, []);
});

test('unsupported or failed original icon resources are reported without provider guesses', async () => {
  const font = { family: 'Material-Icons-TD-3-6-0', weight: '400', style: 'normal' };
  const result = await registerPageFonts(
    [
      {
        fonts: [font],
        fontSources: [
          { ...font, urls: ['https://cdn.example/icons.woff2', 'https://cdn.example/icons.svg'] },
        ],
      },
    ],
    {
      fetcher: {
        addFace: async () => assert.fail('skip unsupported icon formats'),
        ensure: async () => assert.fail('a guessed provider cannot replace source glyphs'),
      },
      fetchImpl: async () => assert.fail('skip unsupported icon formats'),
    },
  );
  assert.deepEqual(result.faces, [
    {
      family: font.family,
      weight: 400,
      italic: false,
      available: false,
      source: 'page',
      icon: true,
    },
  ]);
  assert.match(result.warnings.join('\n'), /Missing icon font Material-Icons-TD-3-6-0.*WOFF/);
});

test('pixel fallbacks replace only the exact unresolved glyph inside its editable wrapper', () => {
  const family = 'Material Icons';
  const iconRect = { x: 8, y: 12, w: 24, h: 24 };
  const nextRect = { ...iconRect, x: 40 };
  const text = (family, rect) => ({
    kind: 'text',
    rect,
    text: 'edit',
    styles: { 'font-family': `"${family}"`, 'font-weight': '500' },
    lines: 1,
  });
  const wrapper = {
    kind: 'element',
    tag: 'span',
    rect: iconRect,
    attrs: { 'aria-label': 'Edit record' },
    children: [text(family, { ...iconRect, y: 14, h: 20 })],
  };
  const otherFont = text('Inter', iconRect);
  const unrelated = text(family, nextRect);
  const snapshot = { root: { kind: 'element', children: [wrapper, otherFont, unrelated] } };
  const src = 'data:image/png;base64,cGl4ZWxz';
  const capture = {
    iconPixels: [{ family, weight: '500', style: 'normal', rect: iconRect, text: 'edit', src }],
  };
  const face = { family, weight: 500, italic: false, icon: true };
  assert.deepEqual(
    applyUnresolvedIconFallbacks(snapshot, capture, [{ ...face, available: true }]),
    [],
  );
  assert.equal(wrapper.children[0].kind, 'text');
  assert.match(
    applyUnresolvedIconFallbacks(snapshot, capture, [{ ...face, available: false }]).join('\n'),
    /Used captured pixels for 1 Material Icons icon glyph/,
  );
  assert.deepEqual(wrapper.children[0], {
    kind: 'image',
    tag: 'img',
    rect: iconRect,
    src,
    styles: {},
  });
  assert.deepEqual(wrapper.attrs, { 'aria-label': 'Edit record' });
  assert.equal(otherFont.kind, 'text');
  assert.equal(unrelated.kind, 'text');
});

test('multiple linked sheets import a shared style once and invalid imports do not hide valid font faces', async () => {
  const requested = [];
  const font = { family: 'Standard Icons', weight: '400', style: 'normal' };
  const result = await registerPageFonts(
    [
      {
        fonts: [font],
        fontStylesheets: ['https://cdn.example/one.css', 'https://cdn.example/two.css'],
      },
    ],
    {
      fetcher: {
        addFace: async (face, bytes) => ({ ...face, available: bytes.equals(sfnt) }),
      },
      fetchImpl: async (url) => {
        requested.push(url);
        if (/\/(?:one|two)\.css$/.test(url)) return new Response('@import "./shared.css";');
        if (url.endsWith('/shared.css')) {
          return new Response(
            '@import "https://["; @font-face{font-family:"Standard Icons";src:url(./source.ttf)}',
          );
        }
        return new Response(sfnt);
      },
    },
  );
  assert.equal(requested.filter((url) => url.endsWith('/shared.css')).length, 1);
  assert.equal(result.faces[0].available, true);
});

test(
  'rendered iframe icons survive unavailable font registration without replacing the surrounding controls',
  {
    skip: process.env.DSH_E2E_CHROME !== '1',
  },
  async (t) => {
    const { captureCurrentPage, renderPage, withBrowser } =
      await import('./html-browser-capture.mjs');
    const directory = await mkdtemp(join(tmpdir(), 'frame-icons-'));
    t.after(() => rm(directory, { force: true, recursive: true }));
    await writeFile(join(directory, 'icons.ttf'), sfnt);
    await writeFile(
      join(directory, 'content.html'),
      `
    <button aria-label="Save changes"><span>A</span></button>
    <script>
      const sheet = document.createElement('style');
      sheet.textContent = "@font-face {font-family:'Fixture Icons';src:url('/icons.ttf')}"
        + "span {display:inline-flex;font-family:'Fixture Icons';width:24px;height:24px;align-items:center;justify-content:center}";
      document.head.append(sheet);
    </script>`,
    );
    const htmlBytes = Buffer.from('<iframe src="/content.html" title="Application"></iframe>');
    const viewport = { width: 640, height: 480 };
    const available = await withBrowser(
      { htmlBytes, baseDir: directory, viewport },
      async (page, network, url) => {
        await renderPage(page, network, url, viewport, {
          timeoutMs: 10000,
          preserveViewport: true,
        });
        const capture = await captureCurrentPage(page, viewport, viewport.height, [], {
          includeFrames: true,
          pixelMedia: true,
        });
        assert.ok(capture.fontSources.some((source) => source.family === 'Fixture Icons'));
        assert.ok(capture.iconPixels.some((icon) => icon.family === 'Fixture Icons'));
        const fonts = await registerPageFonts([capture], {
          baseDir: directory,
          fetcher: {
            addFace: async (face, bytes) => {
              assert.deepEqual(bytes, sfnt);
              return { ...face, available: false, error: 'renderer rejected the fixture font' };
            },
            ensure: async () => assert.fail('unavailable source icons should use rendered pixels'),
          },
        });
        const snapshot = JSON.parse(capture.snapshot);
        const warnings = applyUnresolvedIconFallbacks(snapshot, capture, fonts.faces);
        assert.match(warnings.join('\n'), /Used captured pixels for 1 Fixture Icons icon glyph/);
        const nodes = [
          ...(function* walk(node) {
            yield node;
            for (const child of node.children ?? []) yield* walk(child);
          })(snapshot.root),
        ];
        assert.ok(
          nodes.some(
            (node) => node.tag === 'button' && node.attrs?.['aria-label'] === 'Save changes',
          ),
        );
        assert.ok(
          nodes.some(
            (node) => node.kind === 'image' && node.src.startsWith('data:image/png;base64,'),
          ),
        );
        assert.ok(!nodes.some((node) => node.kind === 'text' && node.text === 'A'));
        return true;
      },
    );
    assert.equal(available, true);
  },
);

test('unavailable icon text without a usable crop stays visible as a coverage gap', () => {
  const text = {
    kind: 'text',
    text: 'settings',
    styles: { 'font-family': 'Original Icon Font', 'font-weight': '400' },
  };
  const warnings = applyUnresolvedIconFallbacks({ root: { children: [text] } }, {}, [
    { family: 'Original Icon Font', weight: 400, italic: false, icon: true, available: false },
  ]);
  assert.deepEqual(warnings, [
    'Unresolved icon glyphs from Original Icon Font remain without captured pixels',
  ]);
  assert.equal(text.text, 'settings');
});
