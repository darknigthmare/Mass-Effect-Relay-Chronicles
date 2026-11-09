// Read-only browser presentation of native PNG bytes; creates QA screenshots,
// never a replacement sprite asset or a transformed/cropped PNG.
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { FRONTIER_ENEMIES, normalizeFrontierEnemyAtlas } from '../src/frontier-enemies.js';

const root = new URL('../', import.meta.url), hash = raw => createHash('sha256').update(raw).digest('hex');
const png = await readFile(new URL('public/assets/frontier-enemies.png', root));
const config = normalizeFrontierEnemyAtlas(JSON.parse(await readFile(new URL('public/assets/frontier-enemies.json', root))));
assert.ok(config); const source = `data:image/png;base64,${png.toString('base64')}`;
const report = { passed: false, generatedAt: new Date().toISOString(),
  scope: 'Native eight-body PNG browser presentation and CSS-only gameplay-size inspection. No original-game likeness or movement certification.',
  source: { path: 'public/assets/frontier-enemies.png', sha256: hash(png) },
  screenshots: [], errors: [], actuallyOpened: false };
await mkdir(new URL('docs/screenshots/', root), { recursive: true });
let browser;
try {
  browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
  report.chromium = browser.version(); const page = await browser.newPage({ viewport: { width: 1536, height: 1024 } });
  page.on('pageerror', error => report.errors.push(error.message));
  async function capture(name) {
    const path = `docs/screenshots/frontier-enemies-art-${name}.png`;
    await page.screenshot({ path: fileURLToPath(new URL(path, root)), fullPage: true });
    const bytes = await readFile(new URL(path, root)); report.screenshots.push({ path, sha256: hash(bytes), bytes: bytes.length });
  }
  for (const [name, color] of [['native-light', '#e7ebee'], ['native-dark', '#071321']]) {
    await page.setContent(`<style>html,body{margin:0;width:1536px;height:1024px;background:${color}}img{display:block;width:1536px;height:1024px}</style><img src="${source}" alt="Eight native enemy bodies">`);
    await page.locator('img').evaluate(image => image.decode());
    assert.deepEqual(await page.locator('img').evaluate(image => [image.naturalWidth, image.naturalHeight]), [config.width, config.height]);
    await capture(name);
  }
  await page.setViewportSize({ width: 1280, height: 680 });
  const cards = Object.values(config.frames).map(frame => {
    const [x, y, w, h] = frame.rect, displayHeight = 130 * frame.heightScale, scale = displayHeight / h;
    return `<article><h2>${FRONTIER_ENEMIES[frame.key].name}</h2><div class="well"><div style="position:relative;width:${w * scale}px;height:${h * scale}px"><div style="position:absolute;top:0;left:0;width:${w}px;height:${h}px;overflow:hidden;transform:scale(${scale});transform-origin:top left"><img src="${source}" style="position:absolute;left:${-x}px;top:${-y}px;width:${config.width}px;height:${config.height}px"></div></div></div><small>${frame.key} · une pose de corps</small></article>`;
  }).join('');
  await page.setContent(`<style>html,body{margin:0;background:#071321;color:#d5e6f5;font:14px Arial}main{padding:24px;display:grid;grid-template-columns:repeat(4,1fr);gap:18px}article{background:#102332;border:1px solid #38586c;padding:12px}h2{font-size:15px;margin:0;height:36px}.well{height:190px;display:flex;align-items:flex-end;justify-content:center;padding-bottom:12px}small{display:block;padding-top:14px;color:#a0b9cc}</style><main>${cards}</main>`);
  await page.locator('img').evaluateAll(images => Promise.all(images.map(image => image.decode())));
  await capture('gameplay-size'); assert.deepEqual(report.errors, []); report.passed = true;
} catch (error) {
  report.failure = error.stack || String(error); process.exitCode = 1;
} finally {
  await browser?.close(); await writeFile(new URL('docs/qa/frontier-enemies-art-preview.json', root), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ passed: report.passed, screenshots: report.screenshots.length, failure: report.failure }));
}
