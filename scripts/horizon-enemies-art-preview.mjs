// Presentation of immutable native bytes. CSS/SVG cropping is not an edited asset.
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { HORIZON_ENEMIES, HORIZON_ENEMY_HEIGHTS, normalizeHorizonEnemyAtlas } from '../src/horizon-enemies.js';
const root = new URL('../', import.meta.url), sha = bytes => createHash('sha256').update(bytes).digest('hex');
const png = await readFile(new URL('public/assets/horizon-enemies.png', root));
const atlas = normalizeHorizonEnemyAtlas(JSON.parse(await readFile(new URL('public/assets/horizon-enemies.json', root))));
assert.ok(atlas);
const url = `data:image/png;base64,${png.toString('base64')}`, captures = [];
const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
try {
  const page = await browser.newPage({ viewport: { width: 1536, height: 1024 }, deviceScaleFactor: 1 });
  for (const background of ['light', 'dark']) {
    const colors = background === 'light' ? ['#dbe1e6', '#f7f9fa'] : ['#13202b', '#223443'];
    await page.setContent(`<body style="margin:0;width:1536px;height:1024px;background:repeating-conic-gradient(${colors[0]} 0% 25%,${colors[1]} 0% 50%) 0 0/32px 32px"><img src="${url}" width="1536" height="1024" style="display:block"></body>`);
    await page.locator('img').evaluate(image => image.decode());
    const path = `docs/screenshots/horizon-enemies-art-native-${background}.png`, bytes = await page.screenshot({ path: fileURLToPath(new URL(path, root)) });
    captures.push({ path, sha256: sha(bytes), background, nativePixelScale: 1 });
  }
  await page.setViewportSize({ width: 1280, height: 800 });
  const cards = Object.entries(atlas.frames).map(([key, frame]) => `<article><h2>${HORIZON_ENEMIES[key].name}</h2><div class="body"><svg style="height:${120 * HORIZON_ENEMY_HEIGHTS[key] / 2.85}px;max-width:350px" viewBox="${frame.rect.join(' ')}" preserveAspectRatio="xMidYMid meet"><image href="${url}" width="${atlas.width}" height="${atlas.height}"/></svg></div><p>${key} · corps fixe de prototype</p></article>`).join('');
  await page.setContent(`<html><style>*{box-sizing:border-box}body{margin:0;padding:20px;background:#08121c;color:#dae8ed;font-family:Arial;display:grid;grid-template-columns:repeat(3,1fr);gap:16px}article{height:364px;padding:16px;background:#112735;border:1px solid #496777}h2{font-size:16px;height:22px;margin:0}.body{height:280px;display:flex;align-items:flex-end;justify-content:center;padding-bottom:10px}svg{display:block}p{font-size:12px;color:#9eb6c5;margin:8px 0 0}</style><body>${cards}<article><h2>ME1 / me1 uniquement</h2><p>5 dessins fixes. Les dimensions de rendu sont adaptées au prototype, pas des mètres canoniques.</p><p>Les projectiles, mouvements, résistances, kits et visages complets restent à vérifier.</p></article></body></html>`);
  await page.waitForFunction(() => [...document.images].every(image => image.complete));
  const path = 'docs/screenshots/horizon-enemies-art-gameplay-size.png', bytes = await page.screenshot({ path: fileURLToPath(new URL(path, root)) });
  captures.push({ path, sha256: sha(bytes), indicativeHumanoidHeight: 120, qualification: 'CSS/SVG presentation only; actual in-game camera is checked separately.' });
} finally { await browser.close(); }
await writeFile(new URL('docs/qa/horizon-enemies-art-preview.json', root), JSON.stringify({ passed: true, at: new Date().toISOString(), sha256: sha(png), captures,
  sourceHashes: { 'public/assets/horizon-enemies.png': sha(png), 'public/assets/horizon-enemies.json': sha(await readFile(new URL('public/assets/horizon-enemies.json', root))),
    'scripts/horizon-enemies-art-preview.mjs': sha(await readFile(new URL('scripts/horizon-enemies-art-preview.mjs', root))) },
  scope: 'Native browser decode on light/dark checkerboards and five SVG crops at indicative gameplay sizes. No assets were retouched or resampled.' }, null, 2) + '\n');
console.log(JSON.stringify({ passed: true, captures: captures.length }));
