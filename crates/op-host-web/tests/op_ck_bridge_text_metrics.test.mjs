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
const roboto = new Uint8Array(
  await readFile(new URL('../../op-host-native/assets/Roboto-Regular.ttf', import.meta.url)),
);

// Figma lays text out with unhinted, fractional advances. Reference widths
// come from a font with linear metrics and no hinting.
function figmaWidth(text, size) {
  const tf = CK.Typeface.MakeFreeTypeFaceFromData(roboto.slice().buffer);
  const font = new CK.Font(tf, size);
  font.setLinearMetrics(true);
  font.setSubpixel(true);
  font.setHinting(CK.FontHinting.None);
  const width = font.getGlyphWidths(font.getGlyphIDs(text)).reduce((a, b) => a + b, 0);
  font.delete();
  tf.delete();
  return width;
}

function withRenderer(run) {
  const surface = CK.MakeSurface(64, 64);
  assert.ok(surface);
  const renderer = bridge.opCkCreateBridge(CK, surface, { width: 64, height: 64 });
  try {
    run(renderer);
  } finally {
    renderer.dispose?.();
  }
}

test('named-family text measures with fractional Figma advances, not pixel-rounded ones', () => {
  withRenderer(renderer => {
    assert.equal(renderer.registerFontFace('Roboto', 400, false, roboto), true);
    for (const [text, size] of [['Contact info', 14], ['agent', 12], ['00:00', 14], ['Fullscreen', 14]]) {
      const measured = renderer.measureTextFamilyStyled(text, 'Roboto', size, 400, false);
      const expected = figmaWidth(text, size);
      assert.ok(
        Math.abs(measured - expected) < 0.01,
        `${text}@${size}: measured ${measured}, Figma-equivalent ${expected}`,
      );
    }
  });
});

test('unregistered-family text also measures without per-glyph pixel rounding', () => {
  withRenderer(renderer => {
    assert.equal(renderer.registerSystemFont('Fallback Sans', roboto), true);
    const text = 'Café crème';
    const whole = renderer.measureTextStyled(text, 14, 400, false);
    const expected = figmaWidth(text, 14);
    assert.ok(Math.abs(whole - expected) < 0.01, `measured ${whole}, Figma-equivalent ${expected}`);
    // Hinted advances are whole pixels per glyph; linear ones are not.
    assert.notEqual(whole, Math.round(whole), `advance ${whole} must not be pixel-rounded`);
  });
});
