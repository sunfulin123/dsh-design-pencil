import assert from 'node:assert/strict';
import test from 'node:test';
import { measureGlyphInkInRgba } from './glyph-ink-measurement.mjs';

/** White canvas with one dark block standing in for glyph ink. */
function imageWithInk(width, height, ink) {
  const rgba = new Uint8Array(width * height * 4).fill(255);
  for (let y = ink.y; y < ink.y + ink.height; y += 1) {
    for (let x = ink.x; x < ink.x + ink.width; x += 1) {
      const index = (y * width + x) * 4;
      rgba[index] = 17;
      rgba[index + 1] = 17;
      rgba[index + 2] = 17;
    }
  }
  return { width, height, rgba };
}

const PARENT = { x: 0, y: 0, width: 120, height: 80 };
// First line of a two-line title: correctly placed in the upper half of its parent.
const TITLE_LINE = { x: 20, y: 12, width: 80, height: 20 };
const image = imageWithInk(120, 80, { x: 24, y: 16, width: 60, height: 12 });

test('a single label is measured against its parent and the result is not an instruction', () => {
  const measured = measureGlyphInkInRgba(image, TITLE_LINE, 1, PARENT, TITLE_LINE);
  assert.equal(measured.reliable, true);
  assert.equal(measured.ink.inkCenterOffsetInParentPx, -18);
  assert.match(measured.ink.diagnosis, /18px above the vertical centre of parent container/);
  assert.match(measured.ink.diagnosis, /This is a measurement/);
  assert.doesNotMatch(measured.ink.diagnosis, /shift text/i);
});

test('a line stacked with siblings is measured against its own box, not the parent centre', () => {
  const measured = measureGlyphInkInRgba(image, TITLE_LINE, 1, PARENT, TITLE_LINE, true);
  assert.equal(measured.ink.stackedInParent, true);
  assert.equal(measured.ink.inkCenterOffsetInParentPx, -18, 'the raw measurement is still reported');
  assert.match(measured.ink.diagnosis, /centred in its own text box/);
  assert.doesNotMatch(measured.ink.diagnosis, /parent container/);
});

test('a text box with no ink is unreliable, never reported as centred', () => {
  const blank = { width: 120, height: 80, rgba: new Uint8Array(120 * 80 * 4).fill(255) };
  const measured = measureGlyphInkInRgba(blank, TITLE_LINE, 1, PARENT, TITLE_LINE);
  assert.equal(measured.reliable, false);
  assert.match(measured.unreliableReason, /no visible glyph ink/);
});
