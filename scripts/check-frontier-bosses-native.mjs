import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { chromium } from 'playwright';
import { BOSS_ANIMATION_IDS, BOSS_COMBAT_POSES, normalizeBossAnimation } from '../src/boss-animation-data.js';

// Browser rendering of the unchanged native files. Detached artwork QA only;
// game renderer, actor scope and encounter readability need separate checks.
const root = new URL('../', import.meta.url);
const selected = process.argv.slice(2).length ? process.argv.slice(2) : BOSS_ANIMATION_IDS;
assert.ok(selected.every(key => BOSS_ANIMATION_IDS.includes(key)));
const hash = data => createHash('sha256').update(data).digest('hex');
const families = {};
for (const key of selected) {
  const input = JSON.parse(await readFile(new URL(`public/assets/boss-${key}-animation.json`, root), 'utf8'));
  const config = normalizeBossAnimation(key, input); assert.ok(config);
  families[key] = { config, data: await readFile(new URL(`public/assets/${config.combat.file}`, root)) };
}
const server = createServer((request, response) => {
  const url = new URL(request.url, 'http://localhost'), key = url.searchParams.get('key');
  const family = families[key];
  if (!family) { response.writeHead(404); response.end(); return; }
  const { combat } = family.config;
  if (url.pathname === '/image.png') {
    response.writeHead(200, { 'Content-Type': 'image/png' }); response.end(family.data); return;
  }
  const css = 'html,body{margin:0}body{background:repeating-conic-gradient(#dae0e5 0% 25%,#bac4cc 0% 50%) 0 0/32px 32px;font:16px sans-serif;color:#102035}img{display:block}';
  let html;
  if (url.pathname === '/scale') {
    const scale = 180 / combat.frames.aim.rect[3];
    html = `<style>${css}.row{display:flex}.card{width:380px;height:260px;position:relative;border-right:1px solid #8295a5}.pose{position:absolute;left:50%;bottom:20px;transform:translateX(-50%)}b{display:block;text-align:center;margin:12px}</style><div class="row">` + BOSS_COMBAT_POSES.map(pose => {
      const [x,y,w,h] = combat.frames[pose].rect;
      return `<div class="card"><b>${key} / ${pose}</b><div class="pose" style="width:${w*scale}px;height:${h*scale}px;background-image:url('/image.png?key=${key}');background-size:${combat.width*scale}px ${combat.height*scale}px;background-position:${-x*scale}px ${-y*scale}px"></div></div>`;
    }).join('') + '</div>';
  } else html = `<style>${css}</style><img src="/image.png?key=${key}" width="${combat.width}" height="${combat.height}" alt="${key}: four native fixed poses">`;
  response.writeHead(200, { 'Content-Type': 'text/html' }); response.end(html);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
let browser;
try {
  browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || '/usr/bin/chromium',
    headless: true, args: ['--no-sandbox', '--no-zygote'] });
  const page = await browser.newPage({ viewport: { width: 1536, height: 1024 }, deviceScaleFactor: 1 });
  const errors = [], failedRequests = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('requestfailed', request => failedRequests.push({ url: request.url(), error: request.failure()?.errorText }));
  const base = `http://127.0.0.1:${server.address().port}`;
  for (const key of selected) {
    const family = families[key], { combat } = family.config;
    await page.setViewportSize({ width: combat.width, height: combat.height });
    await page.goto(`${base}/native?key=${key}`, { waitUntil: 'networkidle' });
    const decoded = await page.locator('img').evaluate(async image => {
      await image.decode(); return { complete: image.complete, width: image.naturalWidth, height: image.naturalHeight };
    });
    assert.deepEqual(decoded, { complete: true, width: combat.width, height: combat.height });
    const response = await page.request.get(`${base}/image.png?key=${key}`);
    assert.equal(hash(await response.body()), hash(family.data));
    const nativePath = `docs/screenshots/frontier-boss-${key}-native.png`;
    const nativeCapture = await page.screenshot({ path: new URL(nativePath, root).pathname });
    await page.setViewportSize({ width: 1536, height: 280 });
    await page.goto(`${base}/scale?key=${key}`, { waitUntil: 'networkidle' });
    const scalePath = `docs/screenshots/frontier-boss-${key}-scale.png`;
    const scaleCapture = await page.screenshot({ path: new URL(scalePath, root).pathname });
    assert.deepEqual(errors, []); assert.deepEqual(failedRequests, []);
    const reportPath = new URL(`docs/qa/frontier-boss-${key}-art.json`, root);
    const report = JSON.parse(await readFile(reportPath, 'utf8'));
    assert.equal(report.sha256, hash(family.data));
    report.nativeBrowserReview = { passed: true, at: new Date().toISOString(), chromium: browser.version(),
      scope: 'Native image decode at 1:1 and CSS crop preview with 180px aim height. No pixel editing, no game-renderer or original-game likeness certification.',
      decoded, servedSHA256: hash(family.data), errors: [...errors], failedRequests: [...failedRequests],
      captures: [{ path: nativePath, sha256: hash(nativeCapture), actuallyOpened: false },
                 { path: scalePath, sha256: hash(scaleCapture), actuallyOpened: false }] };
    await writeFile(reportPath, JSON.stringify(report, null, 2)+'\n');
    console.log(JSON.stringify({ key, decoded, captures: [nativePath, scalePath] }));
  }
} finally {
  if (browser) await browser.close(); await new Promise(resolve => server.close(resolve));
}
