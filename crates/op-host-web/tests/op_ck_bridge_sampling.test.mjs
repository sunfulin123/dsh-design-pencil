import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const require = createRequire(import.meta.url);
const init = require('../assets/canvaskit/canvaskit.js');
const CK = await init({
  wasmBinary: await readFile(new URL('../assets/canvaskit/canvaskit.wasm', import.meta.url)),
  locateFile: name => fileURLToPath(new URL(`../assets/canvaskit/${name}`, import.meta.url)),
});
const source = await readFile(new URL('../src/op_ck_bridge.js', import.meta.url), 'utf8');
const bridge = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
bridge.setImageCacheFactory(() => ({}));

test('pixel sampling reads the actual composite with unpremultiplied RGBA8 and no stale frame', () => {
  const surface = CK.MakeSurface(32, 32);
  assert.ok(surface);
  const renderer = bridge.opCkCreateBridge(CK, surface, { width: 32, height: 32 });
  try {
    renderer.beginFrame();
    renderer.clear(0, 0, 1, 1);
    renderer.fillRect(4, 4, 16, 16, 1, 0, 0, 0.5);
    renderer.endFrame();
    const mixed = Array.from(renderer.samplePixel(8, 8));
    assert.ok(Math.abs(mixed[0] - 128) <= 1, mixed);
    assert.equal(mixed[1], 0);
    assert.ok(Math.abs(mixed[2] - 127) <= 1, mixed);
    assert.equal(mixed[3], 255);
    assert.deepEqual(Array.from(renderer.samplePixel(0, 0)), [0, 0, 255, 255]);

    renderer.beginFrame();
    renderer.clear(0, 0, 0, 0);
    renderer.fillRect(4, 4, 16, 16, 1, 0, 0, 0.5);
    renderer.endFrame();
    assert.deepEqual(Array.from(renderer.samplePixel(8, 8)), [255, 0, 0, 128]);
    assert.deepEqual(Array.from(renderer.samplePixel(0, 0)), [0, 0, 0, 0]);
    assert.equal(surface.getCanvas().getSaveCount(), 1);
  } finally {
    renderer.dispose();
    surface.delete();
  }
});

test('sampling rejects nonphysical pixels and out-of-surface coordinates explicitly', () => {
  const surface = CK.MakeSurface(4, 4);
  assert.ok(surface);
  const renderer = bridge.opCkCreateBridge(CK, surface, { width: 4, height: 4 });
  try {
    for (const [x, y] of [[-1, 0], [4, 0], [0, 4], [0.5, 0], [NaN, 0]]) {
      assert.throws(() => renderer.samplePixel(x, y), /pixel.*outside|integer/i);
    }
  } finally {
    renderer.dispose();
    surface.delete();
  }
});

test('snapshot resources are released on unreadable pixels and GPU read failures', () => {
  const surface = CK.MakeSurface(4, 4);
  assert.ok(surface);
  let deleted = 0;
  let failRead = false;
  const snapshot = {
    width: () => 4,
    height: () => 4,
    readPixels() {
      if (failRead) throw new Error('GPU read failed');
      return null;
    },
    delete: () => deleted++,
  };
  const renderer = bridge.opCkCreateBridge(CK, {
    getCanvas: () => surface.getCanvas(),
    flush: () => surface.flush(),
    makeImageSnapshot: () => snapshot,
  }, { width: 4, height: 4 });
  try {
    assert.throws(() => renderer.samplePixel(0, 0), /could not read/);
    assert.equal(deleted, 1);
    failRead = true;
    assert.throws(() => renderer.samplePixel(0, 0), /GPU read failed/);
    assert.equal(deleted, 2);
  } finally {
    renderer.dispose();
    surface.delete();
  }
});
