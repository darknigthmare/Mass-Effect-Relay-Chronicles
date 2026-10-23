import { initialCustomization, normalizeCustomization, getCustomizationPalette } from './customization.js';

// One pixel treatment shared by the fitting-room preview and the world sprites.
// It keeps the authored geometry, shading and animation. The colour regions are
// heuristic until dedicated masks are authored; face shape, iris shape and hair
// silhouette are preview-design choices, not deformations of these flat atlases.
const rgb = hex => [1, 3, 5].map(index => Number.parseInt(hex.slice(index, index + 2), 16));
const clamp = value => Math.max(0, Math.min(255, Math.round(value)));
const brightness = color => color[0] * .299 + color[1] * .587 + color[2] * .114;

export function hasVisualCustomization(customization, appearance = 'male', inCombat = false) {
  const current = normalizeCustomization(customization, appearance) || initialCustomization(appearance);
  const base = initialCustomization(appearance);
  return ['primary', 'secondary', 'accent', 'pattern', 'finish'].some(key => current.armor[key] !== base.armor[key])
    || current.face.skinTone !== base.face.skinTone || current.face.hairColor !== base.face.hairColor
    || current.armor.helmet === 'visible' || current.armor.helmet === 'combat' && inCombat;
}

/** Mutates and returns an ImageData-like object; no DOM or WebGL is required. */
export function tintCustomizationPixels(imageData, customization, { appearance = 'male', direction = 'front', inCombat = false } = {}) {
  const current = normalizeCustomization(customization, appearance) || initialCustomization(appearance);
  if (!hasVisualCustomization(current, appearance, inCombat)) return imageData;
  const { data, width, height } = imageData;
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || !data || data.length !== width * height * 4) return imageData;
  const base = initialCustomization(appearance), palette = Object.fromEntries(Object.entries(getCustomizationPalette(current)).map(([key, value]) => [key, rgb(value)]));
  const helmet = current.armor.helmet === 'visible' || current.armor.helmet === 'combat' && inCombat;
  const skinChanged = current.face.skinTone !== base.face.skinTone, hairChanged = current.face.hairColor !== base.face.hairColor;
  const paint = (index, color, value, reference, strength = 1) => {
    const shade = Math.max(.25, Math.min(1.55, value / reference));
    for (let channel = 0; channel < 3; channel++) data[index + channel] = clamp(data[index + channel] * (1 - strength) + color[channel] * shade * strength);
  };
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const index = (y * width + x) * 4;
    if (data[index + 3] < 24) continue;
    const color = [data[index], data[index + 1], data[index + 2]], [r, g, b] = color, value = brightness(color);
    const v = y / height, u = x / width;
    const skin = v < .25 && r > 92 && g > 56 && b > 35 && r > g * 1.09 && g > b * 1.08;
    const hair = v < .18 && !skin && r > 27 && r > g * 1.08 && r >= b && value < 130;
    if ((skin || hair) && helmet) {
      // The existing head silhouette becomes a closed helmet. A luminous visor
      // is visible on front/side views; the back view stays an opaque shell.
      const visor = direction !== 'back' && skin && v > .075 && v < .125;
      paint(index, visor ? [91, 208, 219] : palette.primary, visor ? 150 : value, visor ? 145 : skin ? 150 : 78);
      continue;
    }
    if (skin) { if (skinChanged) paint(index, palette.skin, value, 180); continue; }
    if (hair) { if (hairChanged) paint(index, palette.hair, value, appearance === 'female' ? 56 : 45); continue; }
    if (v <= .19 || v >= .95 || value < 15 || value > 241) continue;
    const redPlate = r > g * 1.3 && r > b * 1.25 && r - g > 23;
    const neutralPlate = Math.max(r, g, b) - Math.min(r, g, b) < 45;
    if (!redPlate && !neutralPlate) continue;
    let channel = redPlate ? 'accent' : value > 135 ? 'secondary' : 'primary';
    const pattern = current.armor.pattern;
    if (pattern === 'solid' && redPlate) channel = 'primary';
    if (pattern === 'stripe' && Math.abs(u - .52) < .045) channel = 'accent';
    if (pattern === 'split' && u > .53) channel = 'secondary';
    if (current.armor[channel] !== base.armor[channel] || pattern !== base.armor.pattern) {
      // Retain the neutral micro-shading and seams from the high-resolution art.
      const reference = channel === 'secondary' ? 165 : channel === 'accent' ? 98 : 77;
      paint(index, palette[channel], value, reference, .82);
    }
    if (current.armor.finish !== 'standard') {
      const factor = current.armor.finish === 'matte' ? .88 : 1.08 + Math.max(0, value - 105) / 900;
      for (let c = 0; c < 3; c++) data[index + c] = clamp(data[index + c] * factor);
    }
  }
  return imageData;
}

/** Return a new canvas; source pixels and the original atlas are never edited. */
export function renderCustomizationSprite(sourceCanvas, customization, options = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = sourceCanvas.width; canvas.height = sourceCanvas.height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  context.drawImage(sourceCanvas, 0, 0);
  if (hasVisualCustomization(customization, options.appearance, options.inCombat)) {
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
    context.putImageData(tintCustomizationPixels(pixels, customization, options), 0, 0);
  }
  return canvas;
}
