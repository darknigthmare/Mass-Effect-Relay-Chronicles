import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { chromium } from 'playwright';

// Actual browser decoding of the unedited native PNG on a neutral checkerboard.
// This is a detached artwork preview, not an in-game integration or fidelity test.
const root = new URL('../', import.meta.url);
const path = process.argv[2]; assert.ok(path);
const data = await readFile(path), hash = bytes => createHash('sha256').update(bytes).digest('hex');
const html = '<!doctype html><meta charset="utf-8"><style>html,body{margin:0}body{background:repeating-conic-gradient(#dae0e5 0% 25%,#bac4cc 0% 50%) 0 0/32px 32px}img{display:block;width:1536px;height:1024px}</style><img src="/image.png" alt="Four native asari pose drawings">';
const server = createServer((request, response) => {
  response.writeHead(200, { 'Content-Type': request.url === '/image.png' ? 'image/png' : 'text/html' });
  response.end(request.url === '/image.png' ? data : html);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
let browser;
const report = { passed: false, at: new Date().toISOString(), scope: 'Detached native PNG browser decoding at 1536x1024 over a CSS checkerboard; no asset pixels changed. No in-game or original-game fidelity claim.',
  nativeSource: path, nativeSHA256: hash(data), errors: [], failedRequests: [] };
try {
  browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || '/usr/bin/chromium', headless: true,
    args: ['--no-sandbox', '--no-zygote'] });
  report.chromium = browser.version();
  const page = await browser.newPage({ viewport: { width: 1536, height: 1024 }, deviceScaleFactor: 1 });
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('requestfailed', request => report.failedRequests.push({ url: request.url(), error: request.failure()?.errorText }));
  const url = `http://127.0.0.1:${server.address().port}`;
  await page.goto(url, { waitUntil: 'networkidle' });
  const response = await page.request.get(`${url}/image.png`); assert.equal(hash(await response.body()), hash(data));
  report.decoded = await page.locator('img').evaluate(async image => {
    await image.decode(); return { complete: image.complete, width: image.naturalWidth, height: image.naturalHeight };
  });
  assert.deepEqual(report.decoded, { complete: true, width: 1536, height: 1024 });
  const screenshotPath = 'docs/screenshots/me1-prologue-enemies-asari-native.png';
  const shot = await page.screenshot({ path: new URL(screenshotPath, root).pathname });
  report.capture = { path: screenshotPath, bytes: shot.length, sha256: hash(shot), actuallyOpened: false };
  assert.deepEqual(report.errors, []); assert.deepEqual(report.failedRequests, []); report.passed = true;
} finally {
  if (browser) await browser.close(); await new Promise(resolve => server.close(resolve));
  await writeFile(new URL('docs/qa/me1-prologue-enemies-asari-native-preview.json', root), JSON.stringify(report, null, 2) + '\n');
}
console.log(JSON.stringify({ passed: report.passed, decoded: report.decoded, capture: report.capture }));
