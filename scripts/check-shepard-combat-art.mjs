import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { inflateSync } from 'node:zlib';

const root = new URL('../', import.meta.url), assetRoot = new URL('public/assets/', root);
const readJSON = async path => JSON.parse(await readFile(new URL(path, root), 'utf8'));
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

// Read-only PNG decoder for the authored non-interlaced 8-bit RGBA atlases.
// The original PNG is never rewritten; this inspection needs no image package.
function readRGBA(bytes) {
  assert.deepEqual([...bytes.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  let width, height, position = 8, ended = false; const idat = [];
  while (position + 12 <= bytes.length) {
    const length = bytes.readUInt32BE(position), type = bytes.toString('ascii', position + 4, position + 8);
    assert.ok(position + 12 + length <= bytes.length, 'PNG chunk is bounded');
    const data = bytes.subarray(position + 8, position + 8 + length);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0); height = data.readUInt32BE(4);
      assert.equal(data[8], 8); assert.equal(data[9], 6); assert.equal(data[10], 0); assert.equal(data[11], 0); assert.equal(data[12], 0);
      assert.ok(width > 0 && height > 0 && width * height <= 4096 * 4096);
    } else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') { ended = true; break; }
    position += 12 + length;
  }
  assert.ok(ended && width && height && idat.length);
  const stride = width * 4, raw = inflateSync(Buffer.concat(idat), { maxOutputLength: (stride + 1) * height });
  assert.equal(raw.length, (stride + 1) * height);
  const pixels = Buffer.alloc(width * height * 4);
  const paeth = (a, b, c) => { const p = a + b - c, da = Math.abs(p - a), db = Math.abs(p - b), dc = Math.abs(p - c); return da <= db && da <= dc ? a : db <= dc ? b : c; };
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)]; assert.ok(filter <= 4);
    for (let x = 0; x < stride; x++) {
      const at = y * stride + x, a = x >= 4 ? pixels[at - 4] : 0, b = y ? pixels[at - stride] : 0, c = y && x >= 4 ? pixels[at - stride - 4] : 0;
      const predictor = [0, a, b, Math.floor((a + b) / 2), paeth(a, b, c)][filter];
      pixels[at] = (raw[y * (stride + 1) + x + 1] + predictor) & 255;
    }
  }
  return { width, height, pixels };
}

const manifest = await readJSON('public/assets/manifest.json');
const report = { date: new Date().toISOString(), check: 'shepard-combat-art', alphaThreshold: 24, assets: [], checks: [], limitations: [
  'Structural/pixel inspection only. Browser captures verify runtime framing separately; no artistic 1:1 fidelity is certified.',
  'Four fixed three-quarter key poses per appearance, not complete animation cycles or weapon-model variants.',
  'Female crop geometry is historical and unchanged. Existing edge-alpha observations are recorded, not silently treated as newly repaired.',
  'Head regions bound heuristic tinting; they are not dedicated artistic masks. Low-opacity pixels remain in generated sources.',
] };
for (const appearance of ['male', 'female']) {
  const path = `public/assets/shepard-${appearance}-animation.json`, configBytes = await readFile(new URL(path, root)), config = JSON.parse(configBytes);
  const combat = config.combat, bytes = await readFile(new URL(combat.file, assetRoot)), png = readRGBA(bytes);
  assert.equal(png.width, combat.width); assert.equal(png.height, combat.height);
  const registered = manifest.assets.find(asset => asset.file === combat.file);
  assert.ok(registered); assert.equal(registered.sha256, sha256(bytes));
  assert.deepEqual(Object.keys(combat.frames).sort(), ['aim', 'down', 'hit', 'power']);
  const histogram = Array(256).fill(0);
  for (let index = 3; index < png.pixels.length; index += 4) histogram[png.pixels[index]]++;
  assert.ok(histogram[0] > png.width * png.height / 2, 'Most atlas space is fully transparent');
  const asset = { appearance, file: combat.file, bytes: bytes.length, sha256: sha256(bytes), metadataSHA256: sha256(configBytes), width: png.width, height: png.height, format: 'RGBA 8-bit', alpha: { transparent: histogram[0], belowTintThreshold: histogram.slice(1, 24).reduce((a, b) => a + b, 0), visible: histogram.slice(24).reduce((a, b) => a + b, 0), maximum: histogram.findLastIndex(n => n > 0) }, frames: [] };
  const rects = [];
  for (const [pose, frame] of Object.entries(combat.frames)) {
    const [x, y, w, h] = frame.rect, [px, py] = frame.pivot, [hx, hy, hw, hh] = frame.headRegion;
    assert.ok(frame.rect.every(Number.isInteger) && x >= 0 && y >= 0 && w > 0 && h > 0 && x + w <= png.width && y + h <= png.height);
    assert.ok(Number.isFinite(px) && Number.isFinite(py) && px >= 0 && px <= w && py >= 0 && py <= h);
    assert.ok(Number.isFinite(frame.heightScale) && frame.heightScale > 0 && frame.heightScale <= 1);
    assert.ok(frame.headRegion.every(Number.isFinite) && hx >= 0 && hy >= 0 && hw > 0 && hh > 0 && hx + hw <= 1.000001 && hy + hh <= 1.000001);
    assert.equal(frame.headAxis, pose === 'down' ? 'x' : 'y');
    assert.deepEqual(registered.regions.find(region => region.id === frame.id), { ...frame, pose });
    // Transparent padding may overlap; no visible pixel may belong to two poses.
    let sharedPaddingPixels = 0;
    for (const [ox, oy, ow, oh] of rects) {
      for (let yy = Math.max(y, oy); yy < Math.min(y + h, oy + oh); yy++) for (let xx = Math.max(x, ox); xx < Math.min(x + w, ox + ow); xx++) {
        assert.ok(png.pixels[(yy * png.width + xx) * 4 + 3] < 24, 'Visible silhouettes never overlap between crops');
        sharedPaddingPixels++;
      }
    }
    rects.push(frame.rect);
    let edgeMaximum = 0, edgeVisiblePixels = 0, headVisiblePixels = 0, visiblePixels = 0, minX = w, minY = h, maxX = -1, maxY = -1;
    for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) {
      const alpha = png.pixels[((y + yy) * png.width + x + xx) * 4 + 3];
      if (xx === 0 || yy === 0 || xx === w - 1 || yy === h - 1) { edgeMaximum = Math.max(edgeMaximum, alpha); if (alpha >= 24) edgeVisiblePixels++; }
      if (alpha >= 24) {
        visiblePixels++; minX = Math.min(minX, xx); minY = Math.min(minY, yy); maxX = Math.max(maxX, xx); maxY = Math.max(maxY, yy);
        if (xx / w >= hx && xx / w < hx + hw && yy / h >= hy && yy / h < hy + hh) headVisiblePixels++;
      }
    }
    assert.ok(visiblePixels > 1000 && headVisiblePixels > 100, 'Each pose and its head contain real visible pixels');
    if (appearance === 'male') assert.equal(edgeVisiblePixels, 0, 'New masculine frames have transparent clearance at the tint threshold');
    if (pose === 'down') { assert.ok(frame.heightScale <= .3); assert.ok(frame.heightScale * w / h > .9 && frame.heightScale * w / h < 1.35); }
    asset.frames.push({ id: frame.id, pose, rect: frame.rect, pivot: frame.pivot, heightScale: frame.heightScale, headRegion: frame.headRegion, headAxis: frame.headAxis, visiblePixels, headVisiblePixels, sharedPaddingPixels, visibleBoundsWithinFrame: [minX, minY, maxX - minX + 1, maxY - minY + 1], edgeMaximum, edgeVisiblePixels });
  }
  report.assets.push(asset);
  report.checks.push({ name: `${appearance}: hashes, RGBA, metadata, separate visible silhouettes, pivots, head bounds and KO scale`, status: 'passed' });
}
report.checks.push({ name: 'New male crops preserve a transparent border on all four poses at alpha >= 24', status: 'passed' });
report.status = 'passed';
const output = new URL(process.env.SHEPARD_ART_REPORT || 'docs/qa/shepard-combat-art-report.json', root);
await writeFile(output, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ status: report.status, checks: report.checks.length, assets: report.assets.length, maleSHA256: report.assets[0].sha256, output: output.pathname }));
