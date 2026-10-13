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
const imageSource = await readFile(new URL('../src/op_ck_image_cache.js', import.meta.url), 'utf8');
const imageCaches = await import(`data:text/javascript;base64,${Buffer.from(imageSource).toString('base64')}`);

test('real CanvasKit paints blurred layers and shadows without contaminating later fills', async () => {
  const surface = CK.MakeSurface(128, 128);
  assert.ok(surface);
  const canvas = surface.getCanvas();
  const original = Object.fromEntries(
    ['window', 'document', 'CanvasKitInit'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]),
  );
  try {
    globalThis.window = { CanvasKitInit: true };
    globalThis.document = {
      getElementById: () => ({ width: 128, height: 128 }),
      createElement: () => ({ getContext: () => null }),
    };
    globalThis.CanvasKitInit = async () => Object.assign(Object.create(CK), {
      MakeWebGLCanvasSurface: () => surface,
    });
    bridge.setImageCacheFactory(() => ({}));
    const renderer = await bridge.opCkInit('test');
    const pixel = (x, y) => Array.from(canvas.readPixels(x, y, {
      width: 1, height: 1, colorType: CK.ColorType.RGBA_8888,
      alphaType: CK.AlphaType.Unpremul, colorSpace: CK.ColorSpace.SRGB,
    }));
    const frame = draw => {
      renderer.beginFrame();
      renderer.clear(1, 1, 1, 1);
      draw();
      renderer.endFrame();
      assert.equal(canvas.getSaveCount(), 1);
    };
    frame(() => renderer.fillRoundRect(40, 40, 40, 40, 4, 0, 0, 0, 1));
    const sharp = pixel(35, 60)[0];
    frame(() => renderer.fillDropShadow(40, 40, 40, 40, 4, 16, 0, 0, 0, 1));
    assert.ok(pixel(35, 60)[0] < sharp, 'shadow blur reaches beyond the sharp silhouette');
    assert.ok(pixel(35, 60)[0] > 0, 'shadow edge has a Gaussian transition');
    frame(() => {
      renderer.pushBlurLayer(8);
      renderer.fillRect(40, 40, 40, 40, 0, 0, 0, 1);
      renderer.restore();
      renderer.fillRect(96, 40, 16, 40, 1, 0, 0, 1);
    });
    assert.ok(pixel(35, 60)[0] < sharp, 'layer blur reaches outside the original rectangle');
    assert.deepEqual(pixel(100, 60), [255, 0, 0, 255]);
    assert.deepEqual(pixel(116, 60), [255, 255, 255, 255]);
    for (const sigma of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      frame(() => {
        renderer.pushBlurLayer(sigma);
        renderer.fillRect(40, 40, 40, 40, 0, 0, 0, 1);
        renderer.restore();
      });
      assert.equal(pixel(35, 60)[0], sharp);
    }
  } finally {
    for (const [key, descriptor] of Object.entries(original)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
    surface.delete();
  }
});

test('CanvasKit bridge renders an export surface without browser globals', () => {
  assert.equal(typeof globalThis.window, 'undefined');
  assert.equal(typeof globalThis.document, 'undefined');
  const surface = CK.MakeSurface(48, 32);
  bridge.setImageCacheFactory(imageCaches.createWebImageCaches);
  try {
    const renderer = bridge.opCkCreateBridge(CK, surface, { width: 48, height: 32 });
    renderer.beginFrame();
    renderer.clear(0, 0, 0, 0);
    renderer.fillRect(0, 0, 48, 32, 1, 0, 0, 1);
    renderer.endFrame();
    const image = surface.makeImageSnapshot();
    try {
      const bytes = image.encodeToBytes(CK.ImageFormat.PNG);
      assert.deepEqual(Array.from(bytes.subarray(0, 8)), [137, 80, 78, 71, 13, 10, 26, 10]);
    } finally {
      image.delete();
      renderer.dispose();
      renderer.dispose();
    }
  } finally {
    surface.delete();
  }
});