// HTML import through a real browser render (import_html / import_html_url).
// Pure helpers always run; tests that drive headless Chrome need
// DSH_E2E_CHROME=1 and must actually execute to count as acceptance.
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile, mkdir, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { EngineSession } from './engine-session.mjs';
import { discoverChromiumBinary } from './html-browser-capture.mjs';
import { loadedFaces, registerPageFonts } from './html-fonts.mjs';
import { parseRenderMode, parseViewports } from './html-import-tool.mjs';
import { augmentSnapshot } from './html-snapshot-augment.mjs';
import { decodePng } from './png-diff.mjs';

const chrome = process.env.DSH_E2E_CHROME === '1' && discoverChromiumBinary();
const CHROME_SKIP = chrome ? false : 'set DSH_E2E_CHROME=1 with Chrome installed';

async function tempDir(context) {
  const dir = await mkdtemp(join(tmpdir(), 'dsh-html-import-'));
  context.after(() => rm(dir, { recursive: true, force: true }));
  return dir;
}

function layoutOf(session) {
  const result = session.callTool('snapshot_layout', { maxDepth: 100 });
  assert.equal(result.isError, false);
  const nodes = [];
  const walk = (list) => {
    for (const node of list ?? []) {
      nodes.push(node);
      walk(node.children);
    }
  };
  walk(result.structuredContent.layout);
  return nodes;
}

function documentNodes(session) {
  const nodes = [];
  const walk = (list) => {
    for (const node of list ?? []) {
      nodes.push(node);
      walk(node.children);
    }
  };
  const doc = session.snapshot().document;
  walk(doc.children);
  for (const page of doc.pages ?? []) walk(page.children);
  return nodes;
}

function textOf(node) {
  return Array.isArray(node.content)
    ? node.content.map((part) => part.text ?? '').join('')
    : String(node.content ?? '');
}

test('parseViewports accepts arrays, objects and comma lists and clamps sizes', () => {
  assert.deepEqual(parseViewports({}), [{ width: 1440, height: 900 }]);
  assert.deepEqual(parseViewports({ viewportWidth: '1024', viewportHeight: '700' }), [
    { width: 1024, height: 700 },
  ]);
  assert.deepEqual(
    parseViewports({ viewports: '1440, 390' }).map((v) => v.width),
    [1440, 390],
  );
  assert.deepEqual(parseViewports({ viewports: [{ width: 100, height: 50 }] }), [
    { width: 320, height: 320 },
  ]);
  assert.throws(() => parseViewports({ viewports: [1, 2, 3, 4, 5] }), /at most 4/);
  assert.throws(() => parseViewports({ viewports: ['wide'] }), /positive widths/);
  assert.equal(parseRenderMode(undefined), 'auto');
  assert.throws(() => parseRenderMode('pdf'), /renderMode/);
});

test('augmentSnapshot attaches control state and media pixels by tag and rect', () => {
  const snapshot = {
    root: {
      kind: 'element',
      tag: 'body',
      rect: { x: 0, y: 0, w: 800, h: 600 },
      children: [
        { kind: 'element', tag: 'input', rect: { x: 10, y: 10, w: 120, h: 20 }, children: [] },
        {
          kind: 'image',
          tag: 'canvas',
          rect: { x: 10, y: 50, w: 200, h: 100 },
          src: 'data:gray',
          tainted: true,
        },
        { kind: 'element', tag: 'input', rect: { x: 400, y: 10, w: 120, h: 20 }, children: [] },
      ],
    },
  };
  const applied = augmentSnapshot(snapshot, {
    controls: [
      {
        tag: 'input',
        rect: { x: 10.4, y: 10, w: 120, h: 20 },
        control: { type: 'range', value: 30 },
      },
    ],
    mediaPixels: [
      { tag: 'canvas', rect: { x: 10, y: 50, w: 200, h: 100 }, src: 'data:image/png;base64,AA' },
    ],
  });
  assert.deepEqual(applied, { controls: 1, media: 1 });
  const [range, canvas, other] = snapshot.root.children;
  assert.deepEqual(range.control, { type: 'range', value: 30 });
  assert.equal(other.control, undefined);
  assert.equal(canvas.src, 'data:image/png;base64,AA');
  assert.equal(canvas.tainted, false);
});

test('registerPageFonts prefers page TTF files, falls back to Google and explains WOFF-only faces', async (context) => {
  const dir = await tempDir(context);
  await mkdir(join(dir, 'fonts'));
  await writeFile(join(dir, 'fonts', 'brand.ttf'), Buffer.from('0001000000000000', 'hex'));
  const captures = [
    {
      fonts: [
        { family: 'Brand Sans', weight: '700', style: 'normal' },
        { family: 'Inter', weight: '400', style: 'normal' },
        { family: 'Web Only', weight: '400', style: 'italic' },
        { family: 'serif', weight: '400', style: 'normal' },
      ],
      fontSources: [
        {
          family: 'Brand Sans',
          weight: '700',
          style: 'normal',
          urls: ['http://127.0.0.1:9/fonts/brand.ttf'],
        },
        {
          family: 'Web Only',
          weight: '400',
          style: 'italic',
          urls: ['https://cdn.example/web.woff2'],
        },
      ],
    },
  ];
  assert.equal(loadedFaces(captures).length, 3, 'generic families are not fetched');
  const added = [];
  const fetcher = {
    addFace: async (face, bytes) => {
      added.push([face, bytes.length]);
      return { ...face, available: true };
    },
    ensure: async (fonts) =>
      fonts.map((face) =>
        face.family === 'Inter'
          ? { ...face, available: true }
          : { ...face, available: false, error: 'not on Google Fonts' },
      ),
  };
  const result = await registerPageFonts(captures, { fetcher, baseDir: dir });
  assert.deepEqual(
    added.map(([face, size]) => [face.family, face.weight, size]),
    [['Brand Sans', 700, 8]],
  );
  assert.deepEqual(
    result.faces.map((face) => [face.family, face.source, face.available]),
    [
      ['Brand Sans', 'page', true],
      ['Inter', 'google', true],
      ['Web Only', 'google', false],
    ],
  );
  assert.match(
    result.warnings.join('\n'),
    /Web Only 400: not on Google Fonts; the page serves it only as WOFF\/WOFF2/,
  );
});

test('page fonts outside the HTML directory are never read', async (context) => {
  const dir = await tempDir(context);
  const outside = await tempDir(context);
  await writeFile(join(outside, 'secret.ttf'), Buffer.from('0001000000000000', 'hex'));
  await symlink(join(outside, 'secret.ttf'), join(dir, 'link.ttf'));
  const fetcher = {
    addFace: async () => assert.fail('must not read outside baseDir'),
    ensure: async (fonts) => fonts.map((face) => ({ ...face, available: true })),
  };
  const result = await registerPageFonts(
    [
      {
        fonts: [{ family: 'Escape', weight: '400', style: 'normal' }],
        fontSources: [
          {
            family: 'Escape',
            weight: '400',
            style: 'normal',
            urls: ['http://127.0.0.1:9/link.ttf'],
          },
        ],
      },
    ],
    { fetcher, baseDir: dir },
  );
  assert.equal(result.faces[0].source, 'google');
  assert.match(result.warnings.join('\n'), /Page font Escape 400 could not be loaded/);
});

test('without a browser import_html falls back to the static importer and says so', async (context) => {
  const dir = await tempDir(context);
  const htmlPath = join(dir, 'plain.html');
  await writeFile(
    htmlPath,
    '<!doctype html><html><body><div style="width:200px;height:80px;background:#22c55e">Hi</div></body></html>',
  );
  const previous = process.env.OPENPENCIL_DISABLE_HEADLESS_BROWSER;
  process.env.OPENPENCIL_DISABLE_HEADLESS_BROWSER = '1';
  context.after(() => {
    if (previous === undefined) delete process.env.OPENPENCIL_DISABLE_HEADLESS_BROWSER;
    else process.env.OPENPENCIL_DISABLE_HEADLESS_BROWSER = previous;
  });
  const session = new EngineSession({ version: '0.8.5', children: [] });
  context.after(() => session.close());
  const auto = await session.callToolAsync('import_html', { htmlPath });
  assert.equal(auto.isError, false, auto.content?.[0]?.text);
  assert.equal(auto.structuredContent.renderMode, 'static-css');
  assert.match(auto.structuredContent.warnings, /Browser render unavailable/);
  const strict = await session.callToolAsync('import_html', { htmlPath, renderMode: 'browser' });
  assert.equal(strict.isError, true);
  assert.match(strict.content[0].text, /Browser render failed/);
  const bad = await session.callToolAsync('import_html', { htmlPath, viewports: ['x'] });
  assert.equal(bad.isError, true);
});

test(
  'browser import keeps flex layout and script-built content',
  { skip: CHROME_SKIP },
  async (context) => {
    const dir = await tempDir(context);
    const htmlPath = join(dir, 'store.html');
    await writeFile(
      htmlPath,
      `<!doctype html><html><head><title>Flex Store</title><style>
    body{margin:0;font-family:sans-serif}
    header{display:flex;justify-content:space-between;align-items:center;height:64px;padding:0 24px;background:#111;color:#fff}
    nav{display:flex;gap:24px}
    .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;padding:24px}
    .card{background:#eee;padding:16px;border-radius:8px}
  </style></head><body>
    <header><a>Brand</a><nav><span>Shop</span><span>Compare</span><span>Support</span></nav><button>Bag</button></header>
    <main class="grid" id="grid"></main>
    <script>document.getElementById('grid').innerHTML=[1,2,3,4,5,6].map(i=>'<div class="card">Generated item '+i+'</div>').join('')</script>
  </body></html>`,
    );
    const session = new EngineSession({ version: '0.8.5', children: [] });
    context.after(() => session.close());
    const result = await session.callToolAsync('import_html', { htmlPath, viewportWidth: 1000 });
    assert.equal(result.isError, false, result.content?.[0]?.text);
    assert.equal(result.structuredContent.renderMode, 'browser-snapshot');
    assert.equal(result.structuredContent.boards.length, 1);
    assert.equal(result.structuredContent.boards[0].width, 1000);
    const texts = documentNodes(session)
      .filter((node) => node.type === 'text')
      .map(textOf);
    for (const word of ['Brand', 'Shop', 'Compare', 'Support', 'Bag', 'Generated item 6']) {
      assert.ok(
        texts.some((text) => text.includes(word)),
        `${word} imported`,
      );
    }
    const layout = layoutOf(session);
    const textBox = (word) =>
      layout.find(
        (node) =>
          node.type === 'text' &&
          textOf(documentNodes(session).find((n) => n.id === node.id) ?? {}).includes(word),
      );
    const xs = ['Brand', 'Shop', 'Compare', 'Support', 'Bag'].map((word) => textBox(word)?.x);
    assert.ok(xs.every(Number.isFinite), 'header texts have layout boxes');
    for (let i = 1; i < xs.length; i++)
      assert.ok(xs[i] > xs[i - 1] + 20, `header items are laid out left to right: ${xs}`);
    assert.ok(textBox('Bag').x > 900, 'justify-content pushes the last item to the right edge');
    const cards = [1, 2, 3, 4].map((i) => textBox(`Generated item ${i}`));
    assert.ok(cards[1].x > cards[0].x && cards[3].y > cards[0].y, 'grid flows three per row');
  },
);

test(
  'browser import captures WebGL canvas pixels instead of a placeholder',
  { skip: CHROME_SKIP },
  async (context) => {
    const dir = await tempDir(context);
    const htmlPath = join(dir, 'gl.html');
    await writeFile(
      htmlPath,
      `<!doctype html><html><body style="margin:0;background:#fff">
    <canvas id="c" width="200" height="100" style="display:block;width:200px;height:100px"></canvas>
    <script>const gl=document.getElementById('c').getContext('webgl');gl.clearColor(0,0.5,1,1);gl.clear(gl.COLOR_BUFFER_BIT);</script>
  </body></html>`,
    );
    const session = new EngineSession({ version: '0.8.5', children: [] });
    context.after(() => session.close());
    const result = await session.callToolAsync('import_html', {
      htmlPath,
      viewportWidth: 400,
      viewportHeight: 320,
    });
    assert.equal(result.isError, false, result.content?.[0]?.text);
    const image = documentNodes(session).find((node) => node.type === 'image');
    assert.ok(image, 'canvas imported as an image');
    assert.match(image.src, /^data:image\/png;base64,/);
    const png = decodePng(Buffer.from(image.src.split(',')[1], 'base64'));
    const i = (Math.floor(png.height / 2) * png.width + Math.floor(png.width / 2)) * 4;
    const [r, g, b] = png.pixels.subarray(i, i + 3);
    assert.ok(
      r < 30 && Math.abs(g - 128) < 30 && b > 225,
      `canvas center is the cleared colour, got ${r},${g},${b}`,
    );
  },
);

test(
  'browser import renders one board per viewport with its media queries',
  { skip: CHROME_SKIP },
  async (context) => {
    const dir = await tempDir(context);
    const htmlPath = join(dir, 'responsive.html');
    await writeFile(
      htmlPath,
      `<!doctype html><html><head><title>Responsive</title><style>
    body{margin:0;font-family:sans-serif}.row{display:flex;gap:20px;padding:20px}
    .item{flex:1;height:60px;background:#ddd}
    @media (max-width:600px){.row{flex-direction:column}}
  </style></head><body><div class="row"><div class="item">One</div><div class="item">Two</div></div></body></html>`,
    );
    const session = new EngineSession({ version: '0.8.5', children: [] });
    context.after(() => session.close());
    const result = await session.callToolAsync('import_html', {
      htmlPath,
      viewports: [1200, 390],
      x: '100',
      y: '50',
    });
    assert.equal(result.isError, false, result.content?.[0]?.text);
    const boards = result.structuredContent.boards;
    assert.deepEqual(
      boards.map((board) => board.width),
      [1200, 390],
    );
    const layout = layoutOf(session);
    const [desktop, mobile] = boards.map((board) =>
      layout.find((node) => node.id === board.rootId),
    );
    assert.equal(desktop.x, 100);
    assert.equal(desktop.y, 50);
    assert.equal(mobile.x, 100 + 1200 + 200, 'boards sit side by side with a gap');
    assert.match(desktop.name, /1200px/);
    const within = (board, word) => {
      const docs = documentNodes(session);
      return layout.find(
        (node) =>
          node.type === 'text' &&
          node.x >= board.x &&
          node.x < board.x + board.width &&
          textOf(docs.find((n) => n.id === node.id) ?? {}).includes(word),
      );
    };
    assert.ok(
      within(desktop, 'Two').x > within(desktop, 'One').x + 100,
      'desktop row is horizontal',
    );
    const [one, two] = [within(mobile, 'One'), within(mobile, 'Two')];
    assert.ok(
      two.y >= one.y + 30 && Math.abs(two.x - one.x) < 1,
      'mobile media query stacks the row',
    );
    assert.equal(mobile.width, 390);
  },
);
