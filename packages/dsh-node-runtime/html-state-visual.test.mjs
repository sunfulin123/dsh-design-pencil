import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { encodeRgbaPng } from './png-encode.mjs';
import { compareCapturedBoard, verifyHtmlBoards } from './html-state-visual.mjs';

const png = encodeRgbaPng(2, 2, Buffer.alloc(16, 255));
const source = {
  fullBoard: true,
  scale: 1,
  base64: png.toString('base64'),
  sha256: createHash('sha256').update(png).digest('hex'),
};
test('a visual pass requires full captured source and actual CanvasKit pixels', () => {
  const board = { rootId: 'board', sourceScreenshot: source, structure: { status: 'verified' } };
  assert.equal(compareCapturedBoard(board, png, { renderer: 'approximate' }).status, 'unverified');
  assert.equal(
    compareCapturedBoard({ ...board, sourceScreenshot: { ...source, fullBoard: false } }, png, {
      renderer: 'canvaskit-headless',
    }).status,
    'unverified',
  );
  assert.equal(
    compareCapturedBoard(board, png, { renderer: 'canvaskit-headless' }).status,
    'verified',
  );
});
test('different pixels, incomplete structure and source checksum mismatch never pass', () => {
  const board = { rootId: 'board', sourceScreenshot: source, structure: { status: 'verified' } };
  const black = Buffer.alloc(16);
  for (let i = 3; i < 16; i += 4) black[i] = 255;
  assert.equal(
    compareCapturedBoard(board, encodeRgbaPng(2, 2, black), { renderer: 'canvaskit-headless' })
      .status,
    'differences',
  );
  assert.equal(
    compareCapturedBoard({ ...board, structure: { status: 'unverified' } }, png, {
      renderer: 'canvaskit-headless',
    }).status,
    'unverified',
  );
  assert.equal(
    compareCapturedBoard({ ...board, sourceScreenshot: { ...source, sha256: 'wrong' } }, png, {
      renderer: 'canvaskit-headless',
    }).status,
    'unverified',
  );
});

test('a missing small graphic fails even when the whole-board mismatch is below five percent', () => {
  const pixels = Buffer.alloc(20 * 20 * 4, 255);
  for (let y = 4; y < 8; y++)
    for (let x = 3; x < 7; x++) {
      const offset = (y * 20 + x) * 4;
      pixels[offset] = pixels[offset + 1] = pixels[offset + 2] = (x + y) % 2 ? 0 : 255;
    }
  const sourcePng = encodeRgbaPng(20, 20, pixels);
  const board = {
    structure: { status: 'verified' },
    sourceScreenshot: {
      ...source,
      base64: sourcePng.toString('base64'),
      sha256: createHash('sha256').update(sourcePng).digest('hex'),
    },
    evidence: { chartCandidates: [{ rect: { x: 3, y: 4, width: 4, height: 4 } }] },
  };
  const result = compareCapturedBoard(board, encodeRgbaPng(20, 20, Buffer.alloc(1600, 255)), {
    renderer: 'canvaskit-headless',
  });
  assert.ok(result.comparison.ratio < 0.05);
  assert.equal(result.status, 'differences');
  assert.ok(result.graphics[0].ratio > 0.05);
});

test('blank or clipped source graphics remain unverified even with matching converted pixels', () => {
  const board = {
    sourceScreenshot: source,
    structure: { status: 'verified' },
    evidence: { chartCandidates: [{ rect: { x: 0, y: 0, width: 2, height: 2 } }] },
  };
  assert.equal(
    compareCapturedBoard(board, png, { renderer: 'canvaskit-headless' }).status,
    'unverified',
  );
  board.evidence.chartCandidates[0].rect.x = 1;
  assert.match(
    compareCapturedBoard(board, png, { renderer: 'canvaskit-headless' }).reason,
    /clipped/,
  );
});

test(
  'a captured board is checked against the real CanvasKit renderer',
  {
    skip: process.env.DSH_E2E_CHROME !== '1',
    timeout: 60_000,
  },
  async (t) => {
    const { HtmlImportSession } = await import('./html-state-import.mjs');
    const session = new HtmlImportSession({
      html: '<!doctype html><html><head><style>body{margin:0;background:white;font-family:sans-serif}.box{width:500px;height:100px;background:#e7eef8;padding:24px}</style></head><body><div class="box">Original HTML content</div></body></html>',
      verifyVisual: true,
      viewportWidth: 800,
      viewportHeight: 600,
    });
    t.after(() => session.close());
    await session.analyze({ signal: t.signal });
    const result = await session.capture({ signal: t.signal });
    assert.equal(result.verification.visualComplete, true);
    assert.equal(result.boards[0].visual.renderer, 'canvaskit-headless');
    assert.equal(result.boards[0].visual.status, 'verified');
    assert.equal(result.boards[0].visual.sourceSha256, result.boards[0].sourceScreenshot.sha256);
  },
);

test('incomplete source evidence remains unverified without starting a renderer', async () => {
  const result = await verifyHtmlBoards({ document: {}, boards: [{ rootId: 'none' }] });
  assert.equal(result[0].visual.status, 'unverified');
  assert.match(result[0].visual.reason, /Full source pixels/);
});
