import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { chromium } from 'playwright';
const root = new URL('../', import.meta.url), sha = value => createHash('sha256').update(value).digest('hex');
const png = await readFile(new URL('public/assets/horizon-fauna.png', root));
const atlas = JSON.parse(await readFile(new URL('public/assets/horizon-fauna.json', root)));
const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1576, height: 1100 }, deviceScaleFactor: 1 });
const report = { passed: false, pngSHA256: sha(png), scope: 'Chromium renders native PNG bytes on CSS checkerboard and at 180px body height. No source pixels are edited.', captures: [], errors: [] };
page.on('pageerror', error => report.errors.push(error.message));
try {
  const src = `data:image/png;base64,${png.toString('base64')}`;
  await page.setContent(`<html><body style="margin:0;background:#1b2430;color:white;font:14px sans-serif"><p style="margin:20px">Native RGBA at 1:1 — eight fixed prototype fauna bodies; exact original anatomy remains unverified.</p><img src="${src}" style="margin:0 20px;background:repeating-conic-gradient(#d9e1e6 0% 25%,#aab7c3 0% 50%) 50%/32px 32px;display:block"/></body></html>`);
  await page.locator('img').evaluate(image => image.decode());
  for (const label of ['native', 'size']) {
    if (label === 'size') {
      await page.setViewportSize({ width: 1280, height: 520 });
      await page.setContent(`<html><body style="margin:0;padding:16px;background:#071321;color:#dbe8ed;font:12px sans-serif;display:grid;grid-template-columns:repeat(4,1fr);gap:14px">${Object.entries(atlas.frames).map(([id, frame]) => `<figure style="margin:0;padding:12px;background:#142735"><figcaption>${id} · fixed body</figcaption><svg style="display:block;width:100%;height:180px" viewBox="${frame.rect.join(' ')}"><defs><clipPath id="crop-${id}" clipPathUnits="userSpaceOnUse"><rect x="${frame.rect[0]}" y="${frame.rect[1]}" width="${frame.rect[2]}" height="${frame.rect[3]}"/></clipPath></defs><image href="${src}" width="${atlas.width}" height="${atlas.height}" clip-path="url(#crop-${id})"/></svg></figure>`).join('')}</body></html>`);
      await page.waitForTimeout(100);
    }
    const path = `docs/screenshots/horizon-fauna-${label}.png`, bytes = await page.screenshot({ path: fileURLToPath(new URL(path, root)) });
    report.captures.push({ path, sha256: sha(bytes), bytes: bytes.length, actuallyOpened: false });
  }
  assert.deepEqual(report.errors, []); report.passed = true;
} finally { await browser.close(); await writeFile(new URL('docs/qa/horizon-fauna-native-preview.json', root), JSON.stringify(report, null, 2) + '\n'); }
console.log(JSON.stringify({ passed: report.passed, captures: report.captures.length }));
