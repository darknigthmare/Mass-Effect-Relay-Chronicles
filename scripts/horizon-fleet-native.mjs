// Render immutable source bytes with CSS only; no image-pixel editing.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { normalizeHorizonFleetAtlas, HORIZON_FLEET } from '../src/horizon-fleet.js';
const root = new URL('../', import.meta.url), sha = bytes => createHash('sha256').update(bytes).digest('hex');
const report = { passed: false, at: new Date().toISOString(),
  scope: 'Native1:1 RGBA presentation and CSS-only reference-scale frame previews, not the playable scene or original-game geometry verification.',
  sourceHashes: {}, screenshots: [], errors: [], failedRequests: [] };
let browser;
try {
  browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
  report.chromium = browser.version(); const page = await browser.newPage();
  page.on('pageerror', error => report.errors.push(error.message)); page.on('requestfailed', request => report.failedRequests.push(request.url()));
  for (const family of ['me1', 'later']) {
    const asset = `public/assets/horizon-fleet-${family}.png`, metadata = `public/assets/horizon-fleet-${family}.json`;
    const png = await readFile(new URL(asset, root)), raw = await readFile(new URL(metadata, root));
    const atlas = normalizeHorizonFleetAtlas(family, JSON.parse(raw)); assert.ok(atlas); assert.equal(sha(png), atlas.sha256);
    report.sourceHashes[asset] = sha(png); report.sourceHashes[metadata] = sha(raw);
    const data = `data:image/png;base64,${png.toString('base64')}`;
    await page.setViewportSize({ width: atlas.width + 40, height: atlas.height + 84 });
    await page.setContent(`<style>body{margin:0;background:#15212c;color:#e3eef4;font:16px sans-serif}p{margin:20px}.checker{margin:20px;width:${atlas.width}px;height:${atlas.height}px;background:repeating-conic-gradient(#cad2d9 0% 25%,#8d9ca8 0% 50%) 0/24px 24px}img{width:100%;height:100%}</style><p>Native1:1 RGBA · ${family} · fixed prototype hulls; no common scale or 1:1 certification.</p><div class="checker"><img src="${data}"></div>`);
    await page.locator('img').evaluate(image => image.decode());
    await screenshot(`${family}-native`, page);
    await page.setViewportSize({ width: 1320, height: 320 });
    const cards = HORIZON_FLEET.filter(entry => entry.familyId === family).map(entry => {
      const frame = atlas.frames[entry.id];
      return `<article><h3>${entry.name}</h3><svg viewBox="${frame.rect.join(' ')}" preserveAspectRatio="xMidYMid meet" width="280" height="180"><image href="${data}" width="${atlas.width}" height="${atlas.height}"/></svg><p>One fixed ship drawing · Prototype</p></article>`;
    }).join('');
    await page.setContent(`<style>body{margin:0;background:#071723;color:#dfebf4;font:14px sans-serif;display:flex;gap:18px;padding:20px}article{width:292px;border:1px solid #405b6c;background:#102837;text-align:center}h3{font-size:15px;margin:15px 8px}p{font-size:11px;color:#aac2d2;margin:12px}</style>${cards}`);
    await page.locator('svg image').evaluateAll(async nodes => { for (const node of nodes) { const image = new Image(); image.src = node.getAttribute('href'); await image.decode(); } });
    await screenshot(`${family}-reference-scale`, page);
  }
  for (const filename of ['src/horizon-fleet.js', 'src/horizon-fleet-reference.js', 'scripts/horizon-fleet-native.mjs']) report.sourceHashes[filename] = sha(await readFile(new URL(filename, root)));
  assert.deepEqual(report.errors, []); assert.deepEqual(report.failedRequests, []); report.passed = true;
} catch (error) { report.failure = error.stack || String(error); process.exitCode = 1; }
finally { await browser?.close(); await writeFile(new URL('docs/qa/horizon-fleet-native-report.json', root), JSON.stringify(report, null, 2) + '\n'); console.log(JSON.stringify({ passed: report.passed, screenshots: report.screenshots.length, failure: report.failure })); }
async function screenshot(label, page) {
  const path = `docs/screenshots/horizon-fleet-${label}.png`, bytes = await page.screenshot({ path: fileURLToPath(new URL(path, root)) });
  report.screenshots.push({ path, label, sha256: sha(bytes), bytes: bytes.length, viewport: page.viewportSize() });
}
