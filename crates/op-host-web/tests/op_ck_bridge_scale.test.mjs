import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const bridgeUrl = new URL('../src/op_ck_bridge.js', import.meta.url);
const bridgeSource = await readFile(bridgeUrl, 'utf8');
const bridge = await import(
  `data:text/javascript;base64,${Buffer.from(bridgeSource).toString('base64')}`
);
const { opCkQuantizeTextRasterScale } = bridge;
const bucketRatio = 2 ** 0.25;
const nearlyEqual = (actual, expected) =>
  Math.abs(actual - expected) <= Number.EPSILON * 4 * Math.max(1, Math.abs(expected));

test('axis-aligned text rasters start on device pixels without changing their scale', () => {
  for (const scale of [1, 1.25, 2, 3]) {
    const matrix = [scale, 0, 3.2, 0, scale, 5.1, 0, 0, 1];
    const origin = bridge.opCkSnapTextRasterOrigin(10.23, 20.37, matrix);
    assert.ok(nearlyEqual(origin[0] * scale + matrix[2], Math.round(10.23 * scale + matrix[2])));
    assert.ok(nearlyEqual(origin[1] * scale + matrix[5], Math.round(20.37 * scale + matrix[5])));
    assert.ok(Math.abs(origin[0] - 10.23) <= 0.5 / scale + 1e-12);
    assert.ok(Math.abs(origin[1] - 20.37) <= 0.5 / scale + 1e-12);
  }
});

test('rotated, skewed and invalid text transforms retain authored placement', () => {
  for (const matrix of [[0, -2, 0, 2, 0, 0, 0, 0, 1], [2, 0.2, 0, 0, 2, 0, 0, 0, 1], [NaN, 0, 0, 0, 2, 0, 0, 0, 1]]) {
    assert.deepEqual(bridge.opCkSnapTextRasterOrigin(10.23, 20.37, matrix), [10.23, 20.37]);
  }
});

test('text raster scale falls back safely for invalid inputs', () => {
  for (const value of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, -1, 0, 1]) {
    assert.equal(opCkQuantizeTextRasterScale(value), 1);
  }
});

test('text raster scale reuses adjacent zoom buckets and advances across thresholds', () => {
  assert.equal(opCkQuantizeTextRasterScale(1.01), bucketRatio);
  assert.equal(opCkQuantizeTextRasterScale(1.18), bucketRatio);
  assert.equal(opCkQuantizeTextRasterScale(1.2), Math.SQRT2);
});

test('text raster buckets never undersample or exceed one quarter octave', () => {
  for (const scale of [1.000001, 1.01, 1.18, 1.2, 1.414214, 1.99, 2.01, 7.9]) {
    const quantized = opCkQuantizeTextRasterScale(scale);
    assert.ok(quantized >= scale, `${quantized} must not undersample ${scale}`);
    assert.ok(
      quantized / scale <= bucketRatio * (1 + 1e-12),
      `${quantized} must stay within one bucket of ${scale}`,
    );
  }
});

test('exact bucket boundaries stay exact while values above advance', () => {
  for (let step = 0; step <= 16; step += 1) {
    const boundary = 2 ** (step / 4);
    assert.ok(nearlyEqual(opCkQuantizeTextRasterScale(boundary), boundary));
    if (step > 0) {
      assert.ok(nearlyEqual(opCkQuantizeTextRasterScale(boundary * (1 - 1e-8)), boundary));
    }
    assert.ok(
      nearlyEqual(
        opCkQuantizeTextRasterScale(boundary * (1 + 1e-8)),
        boundary * bucketRatio,
      ),
    );
  }
});
