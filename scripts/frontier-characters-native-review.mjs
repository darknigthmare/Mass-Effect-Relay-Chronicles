// Read-only browser rendering of the exact native RGBA file. No raster editing.
import { chromium } from 'playwright';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const root = new URL('../', import.meta.url);
const output = new URL('docs/qa/frontier-characters-native.png', root);
const source = await readFile(new URL('public/assets/frontier-npcs.png', root));
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
try {
  const page = await browser.newPage({ viewport: { width: 1576, height: 1100 }, deviceScaleFactor: 1 });
  await page.setContent(`<style>body{margin:20px;background:#1d2530;color:white;font:14px sans-serif}p{height:20px;margin:0 0 12px}.native{width:1536px;height:1024px;background:repeating-conic-gradient(#abb0b5 0 25%,#eceff1 0 50%) 0 0/24px 24px}img{display:block;width:1536px;height:1024px}</style><p>Native RGBA at 1:1 pixels — seven ME1 idle bodies; Jenkins uses legacy crew atlas. Faces/costumes unverified.</p><div class="native"><img src="data:image/png;base64,${source.toString('base64')}" alt="Seven native NPC body sprites"></div>`);
  await page.waitForFunction(() => document.images[0]?.complete && document.images[0].naturalWidth === 1536);
  assert.equal(await page.locator('img').evaluate(img => img.naturalHeight), 1024);
  await page.screenshot({ path: output.pathname });
  const reportPath = new URL('docs/qa/frontier-characters-art.json', root);
  const report = JSON.parse(await readFile(reportPath));
  report.nativeBrowserCapture = output.pathname.split('/').slice(-3).join('/');
  report.nativeBrowserCaptureSha256 = createHash('sha256').update(await readFile(output)).digest('hex');
  report.nativeSourceSha256AfterBrowser = createHash('sha256').update(await readFile(new URL('public/assets/frontier-npcs.png', root))).digest('hex');
  assert.equal(report.sha256, report.nativeSourceSha256AfterBrowser);
  report.nativeBrowserRendered = true;
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ capture: report.nativeBrowserCapture, nativeSourceUnchanged: true }));
} finally { await browser.close(); }
