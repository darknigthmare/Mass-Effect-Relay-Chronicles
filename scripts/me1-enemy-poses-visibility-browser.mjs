import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { ENEMY_ANIMATION_IDS as IDS } from '../src/enemy-animation-data.js';

const root = new URL('../', import.meta.url), baseURL = process.env.GAME_URL || 'http://127.0.0.1:4195';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const paths = ['src/world.js', 'src/enemy-animation-data.js', 'src/joker-seated-data.js', 'src/companion-animation-data.js',
  'src/game-data.js', 'src/combat.js', 'src/state.js', 'vite.config.js', 'scripts/me1-enemy-poses-visibility-browser.mjs',
  ...IDS.flatMap(key => [`public/assets/enemy-${key}-animation.json`, `public/assets/enemy-${key}-combat.png`])];
const sourceHashes = Object.fromEntries(await Promise.all(paths.map(async path => [path, hash(await readFile(new URL(path, root)))])));
const report = { passed: false, at: new Date().toISOString(), url: baseURL, sourceHashes,
  scope: 'Targeted visual supplement only. Four held key poses per existing enemy are shown on the same WorldView and source PNGs in an open Eden landscape, with a declared detached arena offset to z8. This avoids Normandy fixture foreground architecture that occluded the lower-right actor. No native action, save/reload, scope or retained-squad sequence is replayed or claimed by this supplement. The earlier sixteen UV/pivot cases remain separate actual observations.',
  buildKind: 'vite-development-isolated-visible-poses', viewport: { width: 1280, height: 800 },
  fixtureArena: { zoneId: 'eden-prime', x: 0, z: 8 }, observations: [], captureArtifacts: [], errors: [], failedRequests: [] };
let browser, page;
async function capture(name) {
  const path = `docs/screenshots/me1-enemy-poses-visible-${name}.png`;
  await page.screenshot({ path: fileURLToPath(new URL(path, root)) }); const bytes = await readFile(new URL(path, root));
  report.captureArtifacts.push({ path, bytes: bytes.length, sha256: hash(bytes) }); return path;
}
try {
  browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || '/usr/bin/chromium',
    args: ['--no-sandbox', '--no-zygote', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  report.chromium = browser.version(); page = await browser.newPage({ viewport: report.viewport }); page.setDefaultTimeout(45000);
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('requestfailed', request => report.failedRequests.push(`${request.url()}: ${request.failure()?.errorText}`));
  page.on('response', response => { if (response.status() >= 400) report.failedRequests.push(`${response.status()} ${response.url()}`); });
  await page.goto(`${baseURL}/?qa`, { waitUntil: 'networkidle' }); await page.waitForFunction(() => !!window.__RELAY_TEST__?.getWorld());
  report.actualZone = await page.evaluate(async () => {
    const { WorldView } = await import('/src/world.js'); window.__RELAY_TEST__.getWorld().dispose();
    const container = document.createElement('div'); Object.assign(container.style, { position: 'fixed', inset: 0, zIndex: '100000', background: '#07111d' }); document.body.appendChild(container);
    const world = new WorldView(container); world.setZone('eden-prime');
    world.zone = { ...world.zone, arena: { x: 0, z: 8 } };
    const f = window.__ME1_VISIBLE_FIXTURE__ = { world, container, frame: 0, lastTime: performance.now() };
    const loop = time => { world.update(Math.min(.05, Math.max(0, (time - f.lastTime) / 1000))); f.lastTime = time; f.frame = requestAnimationFrame(loop); };
    f.frame = requestAnimationFrame(loop); return { id: world.zoneId, theme: world.zone.theme };
  });
  assert.deepEqual(report.actualZone, { id: 'eden-prime', theme: 'eden' });
  await page.waitForFunction(ids => ids.every(key => !!window.__ME1_VISIBLE_FIXTURE__.world.atlases[`combat-${key}`]), IDS);
  for (const pair of [['geth', 'husk'], ['geth-sniper', 'geth-destroyer']]) {
    await page.evaluate(async pair => {
      const [{ actorFor, ENEMIES }, { newGame }, { createBattle }] = await Promise.all([import('/src/game-data.js'), import('/src/state.js'), import('/src/combat.js')]);
      const f = window.__ME1_VISIBLE_FIXTURE__, keys = { geth: 'geth', husk: 'husk', 'geth-sniper': 'sniper', 'geth-destroyer': 'destroyer' };
      f.world.setBattle(null); f.battle = createBattle({ party: ['shepard', 'garrus', 'wrex'].map(id => actorFor(id, newGame())),
        enemies: pair.map((key, index) => ({ ...ENEMIES[keys[key]], id: `${keys[key]}-${index}` })), mode: 'wait', seed: 2183 });
      f.world.setBattle(f.battle); f.world.setMode('combat'); f.world.update(0);
    }, pair);
    await page.waitForFunction(() => { const w = window.__ME1_VISIBLE_FIXTURE__.world; return Math.abs(w.cameraTarget.z - 3.84) < .02 && Math.abs(w.cameraTarget.y - .3) < .02; });
    for (const pose of ['aim', 'power', 'hit', 'down']) {
      await page.evaluate(pose => {
        const f = window.__ME1_VISIBLE_FIXTURE__, w = f.world;
        for (const entry of f.battle.actors.filter(actor => actor.team === 'enemy')) entry.hp = pose === 'down' ? 0 : entry.maxHp;
        w.setBattle(f.battle);
        for (const entry of f.battle.actors.filter(actor => actor.team === 'enemy')) {
          const actor = w.battleActors.get(entry.id); actor.combatPoseTime = 0;
          if (pose === 'hit') w.playEvent({ type: 'damage', targetId: entry.id });
          else if (pose !== 'down') w.playEvent({ type: 'action', actorId: entry.id, actionId: pose === 'aim' ? 'shoot' : 'cover' });
          if (pose !== 'down') actor.combatPoseTime = 600;
        }
        w.update(0);
      }, pose);
      await page.waitForFunction(() => { const w = window.__ME1_VISIBLE_FIXTURE__.world; return w.effects.length === 0
        && [...w.battleActors.values()].every(actor => actor.poseTime <= 0 && (actor.shieldFlash || 0) <= 0); });
      const observations = await page.evaluate(pose => {
        const f = window.__ME1_VISIBLE_FIXTURE__, w = f.world;
        return f.battle.actors.filter(actor => actor.team === 'enemy').map(entry => {
          const actor = w.battleActors.get(entry.id);
          return { key: entry.sprite, actorId: entry.id, pose, frameId: actor.animationFrame,
            texture: actor.body.material.map.image.src, atlas: `combat-${entry.sprite}`, arena: { ...w.zone.arena } };
        });
      }, pose);
      assert.ok(observations.every(entry => entry.frameId === `${entry.key}-combat-${pose}`));
      const screenshot = await capture(`${pair.join('-')}-${pose}`); report.observations.push(...observations.map(entry => ({ ...entry, screenshot })));
      console.log(JSON.stringify({ pair, pose, observations: report.observations.length }));
    }
  }
  const final = await page.evaluate(() => {
    const f = window.__ME1_VISIBLE_FIXTURE__, errors = [...f.world.assetErrors]; cancelAnimationFrame(f.frame); f.world.dispose(); f.container.remove(); delete window.__ME1_VISIBLE_FIXTURE__;
    return { errors, actualAppState: window.__RELAY_TEST__.getState(), storedKeys: Object.keys(localStorage) };
  });
  assert.deepEqual(final.errors, []); assert.equal(final.actualAppState, null); assert.deepEqual(final.storedKeys, []);
  assert.equal(report.observations.length, 16); assert.equal(report.captureArtifacts.length, 8);
  assert.deepEqual(report.errors, []); assert.deepEqual(report.failedRequests, []);
  for (const [path, expected] of Object.entries(sourceHashes)) assert.equal(hash(await readFile(new URL(path, root))), expected, path);
  report.passed = true;
} catch (error) {
  report.failure = error.stack || String(error); if (page) await capture('failure').catch(() => {}); process.exitCode = 1; console.error(error);
} finally {
  await browser?.close(); await writeFile(new URL('docs/qa/me1-enemy-poses-world-visibility-report.json', root), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ passed: report.passed, observations: report.observations.length, captures: report.captureArtifacts.length }));
}
