import assert from 'node:assert/strict';
import test from 'node:test';
import { clearSpriteAlphaIslands } from '../src/world-sprite-alpha.js';

test('visible specks are isolated by coverage and eight-neighbour connectivity', () => {
  const width = 12, height = 12;
  const pixels = new Uint8ClampedArray(width * height * 4);
  const put = (x, y, alpha) => pixels.set([210, 87, 176, alpha], (y * width + x) * 4);
  const get = (x, y) => [...pixels.slice((y * width + x) * 4, (y * width + x + 1) * 4)];
  for (let x = 0; x < 9; x++) put(x, 2, 240);
  put(9, 3, 51); // diagonally part of the visible body
  put(8, 3, 50); // source edge below cutoff, still used for filtering
  for (let x = 0; x < 8; x++) put(x, 8, 200);
  put(11, 0, 138); // the texture border is not adjacent to the next row's first pixel
  put(0, 1, 203);

  assert.equal(clearSpriteAlphaIslands(pixels, width, height), 2);
  assert.deepEqual(get(3, 8), [210, 87, 176, 0]);
  assert.deepEqual(get(11, 0), [210, 87, 176, 0]);
  assert.deepEqual(get(0, 1), [210, 87, 176, 203]);
  assert.deepEqual(get(9, 3), [210, 87, 176, 51]);
  assert.deepEqual(get(8, 3), [210, 87, 176, 50]);
});
