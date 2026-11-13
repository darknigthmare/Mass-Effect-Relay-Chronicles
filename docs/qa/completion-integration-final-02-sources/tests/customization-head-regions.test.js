import test from 'node:test';
import assert from 'node:assert/strict';
import { initialCustomization } from '../src/customization.js';
import { tintCustomizationPixels } from '../src/customization-render.js';

const image = () => ({ width: 20, height: 10, data: new Uint8ClampedArray(800) });
const put = (pixels, x, y, rgba) => pixels.data.set(rgba, (y * pixels.width + x) * 4);
const at = (pixels, x, y) => [...pixels.data.slice((y * pixels.width + x) * 4, (y * pixels.width + x) * 4 + 4)];
const skin = [190, 140, 108, 255], hair = [92, 37, 25, 255];
const region = [.05, .3, .5, .6];

// Pixel fixtures encode the intended visual result independently of the real
// atlas. Browser captures separately verify the measured production head bounds.
test('a head in the middle-left of a horizontal frame receives skin and hair colours without colouring another warm pixel', () => {
  const pixels = image(); put(pixels, 5, 6, skin); put(pixels, 2, 5, hair); put(pixels, 16, 0, skin);
  put(pixels, 5, 5, [190, 140, 108, 12]);
  const original = pixels.data.slice(), customization = initialCustomization();
  customization.face.skinTone = 'deep'; customization.face.hairColor = 'white';
  const before = structuredClone(customization);
  tintCustomizationPixels(pixels, customization, { headRegion: region, headAxis: 'x' });
  assert.notDeepEqual(at(pixels, 5, 6), skin); assert.notDeepEqual(at(pixels, 2, 5), hair);
  assert.deepEqual(at(pixels, 16, 0), skin); assert.deepEqual(at(pixels, 5, 5), [190, 140, 108, 12]);
  for (let i = 3; i < original.length; i += 4) assert.equal(pixels.data[i], original[i]);
  assert.deepEqual(customization, before);
});

test('a combat helmet uses the head axis for its visor and remains hidden outside combat', () => {
  const original = image(); put(original, 5, 7, skin); put(original, 8, 5, skin); put(original, 16, 0, skin);
  const horizontal = structuredClone(original), vertical = structuredClone(original), outside = structuredClone(original), back = structuredClone(original);
  const customization = initialCustomization(); customization.armor.helmet = 'combat';
  tintCustomizationPixels(horizontal, customization, { inCombat: true, headRegion: region, headAxis: 'x' });
  tintCustomizationPixels(vertical, customization, { inCombat: true, headRegion: region, headAxis: 'y' });
  tintCustomizationPixels(back, customization, { inCombat: true, direction: 'back', headRegion: region, headAxis: 'x' });
  tintCustomizationPixels(outside, customization, { inCombat: false, headRegion: region, headAxis: 'x' });
  assert.ok(at(horizontal, 5, 7)[1] > at(horizontal, 5, 7)[0] * 1.5, 'horizontal head eye line becomes a cyan visor');
  assert.notDeepEqual(at(horizontal, 5, 7), at(vertical, 5, 7));
  assert.notDeepEqual(at(horizontal, 5, 7), at(back, 5, 7));
  assert.deepEqual(at(horizontal, 16, 0), skin); assert.deepEqual(outside, original);
});

test('bounded head metadata lets horizontal armour recolour near either edge without painting neutral head pixels', () => {
  const pixels = image(), plate = [100, 105, 110, 255];
  put(pixels, 17, 0, plate); put(pixels, 17, 9, plate); put(pixels, 4, 6, plate);
  const customization = initialCustomization(); customization.armor.primary = 'teal';
  tintCustomizationPixels(pixels, customization, { headRegion: region, headAxis: 'x' });
  assert.notDeepEqual(at(pixels, 17, 0), plate); assert.notDeepEqual(at(pixels, 17, 9), plate);
  assert.deepEqual(at(pixels, 4, 6), plate);
});

test('absent and invalid head bounds keep the historical walk/static pixel behaviour', () => {
  const original = image(); put(original, 8, 1, skin); put(original, 12, 0, hair); put(original, 10, 6, skin);
  const customization = initialCustomization(); customization.face.skinTone = 'deep'; customization.face.hairColor = 'white';
  const expected = structuredClone(original); tintCustomizationPixels(expected, customization);
  for (const headRegion of [null, [], [0, 0, 0, 1], [-.1, 0, .5, .5], [0, 0, 2, .5], [0, 0, NaN, .5], [0, 0, .5, Infinity], 'invalid']) {
    const candidate = structuredClone(original);
    tintCustomizationPixels(candidate, customization, { headRegion, headAxis: 'x' });
    assert.deepEqual(candidate, expected);
  }
  const defaults = structuredClone(original);
  tintCustomizationPixels(defaults, initialCustomization(), { headRegion: region, headAxis: 'x' });
  assert.deepEqual(defaults, original, 'default appearance preserves source pixels');
});
