import { NoColorSpace, ShaderChunk } from 'three';

const ALPHA_CUTOFF = 51;
const ISLAND_SIZE = 8;

// Clear only entire tiny components of the visible alpha mask. Edges of the
// connected silhouette, including its partial coverage, keep their source data.
export function clearSpriteAlphaIslands(data, width, height) {
  const count = width * height;
  const visited = new Uint8Array(count);
  const component = new Uint32Array(count);
  let removed = 0;
  for (let pixel = 0; pixel < count; pixel++) {
    if (visited[pixel] || data[pixel * 4 + 3] < ALPHA_CUTOFF) continue;
    visited[pixel] = 1;
    component[0] = pixel;
    let size = 1;
    for (let index = 0; index < size; index++) {
      const current = component[index];
      const x = current % width, y = Math.floor(current / width);
      for (let nextY = Math.max(0, y - 1); nextY <= Math.min(height - 1, y + 1); nextY++) {
        for (let nextX = Math.max(0, x - 1); nextX <= Math.min(width - 1, x + 1); nextX++) {
          const neighbor = nextY * width + nextX;
          if (visited[neighbor] || data[neighbor * 4 + 3] < ALPHA_CUTOFF) continue;
          visited[neighbor] = 1;
          component[size++] = neighbor;
        }
      }
    }
    if (size > ISLAND_SIZE) continue;
    for (let index = 0; index < size; index++) data[component[index] * 4 + 3] = 0;
    removed++;
  }
  return removed;
}

export function prepareSpriteTexture(texture, cleanIslands = false) {
  texture.colorSpace = NoColorSpace;
  texture.premultiplyAlpha = true;
  if (!cleanIslands || typeof document === 'undefined' || !texture.image) return texture;
  const { width, height } = texture.image;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return texture;
  try {
    context.drawImage(texture.image, 0, 0);
    const pixels = context.getImageData(0, 0, width, height);
    if (!clearSpriteAlphaIslands(pixels.data, width, height)) return texture;
    context.putImageData(pixels, 0, 0);
    texture.image = canvas;
  } catch {
    // Retain an otherwise drawable source if the browser restricts readback.
  }
  return texture;
}

const filteredMap = ShaderChunk.map_fragment.replace('diffuseColor *= sampledDiffuseColor;', `
  // The uploaded RGB is weighted by coverage before texture filtering. Recover its separate color before blending.
  if ( relaySpritePremultiplied ) {
    sampledDiffuseColor.rgb /= max( sampledDiffuseColor.a, 1.0 / 255.0 );
    sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
  }
  diffuseColor *= sampledDiffuseColor;
`);

export function withSpriteAlpha(material) {
  const premultiplied = { value: false };
  material.onBeforeRender = () => {
    const map = material.map;
    premultiplied.value = map?.premultiplyAlpha === true && map.colorSpace === NoColorSpace;
  };
  material.onBeforeCompile = shader => {
    shader.uniforms.relaySpritePremultiplied = premultiplied;
    shader.fragmentShader = `uniform bool relaySpritePremultiplied;\n${shader.fragmentShader}`
      .replace('#include <map_fragment>', filteredMap);
  };
  return material;
}
