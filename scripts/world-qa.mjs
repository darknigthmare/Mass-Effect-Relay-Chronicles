/**
 * World / navigation integration QA against the real WebGL renderer.
 * Start a Vite development server first, for example:
 *   npm run dev -- --host 127.0.0.1 --port 4173
 * Then: node scripts/world-qa.mjs
 * GAME_URL and PLAYWRIGHT_EXECUTABLE_PATH are optional environment overrides.
 * This checks route calculations, not 63 complete manual mission walkthroughs.
 */
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const baseURL = new URL(`${(process.env.GAME_URL || 'http://127.0.0.1:4173').replace(/\/$/, '')}/`);
const out = new URL('../test-results/', import.meta.url);
await mkdir(out, { recursive: true });
const report = { passed: false, at: new Date().toISOString(), baseURL: baseURL.href, scope: 'Real WebGL rendering, 63 authored navigation routes, keyboard input, modal freeze, interactions and battle presentation', zones: [], checks: [], errors: [], failedRequests: [] };
let browser, page;

try {
  browser = await chromium.launch({
    headless: true,
    ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {}),
    args: ['--no-sandbox', '--no-zygote', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('requestfailed', request => report.failedRequests.push(`${request.url()}: ${request.failure()?.errorText}`));

  const harnessURL = new URL('__world-qa__', baseURL);
  const worldURL = new URL('src/world.js', baseURL), dataURL = new URL('src/world-data.js', baseURL);
  await page.route(harnessURL.href, route => route.fulfill({
    contentType: 'text/html',
    body: `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>World integration QA</title></head><body style="margin:0;background:#07121e"><div id="world" style="position:relative;width:100vw;height:100vh"></div><script type="module">
      import { WorldView } from ${JSON.stringify(worldURL.href)};
      import { WORLD_ZONE_IDS } from ${JSON.stringify(dataURL.href)};
      window.__WORLD_QA__ = { zoneIds: WORLD_ZONE_IDS, interactions: [], encounters: [] };
      const qa = window.__WORLD_QA__;
      qa.world = new WorldView(document.querySelector('#world'), { onInteract: p => qa.interactions.push(p.id), onEncounter: p => qa.encounters.push(p.id) });
      qa.world.setMode('explore');
      let previous = performance.now();
      function frame(now) { qa.world.update((now - previous) / 1000); previous = now; requestAnimationFrame(frame); }
      requestAnimationFrame(frame);
    </script></body></html>`,
  }));
  await page.goto(harnessURL.href);
  try { await page.waitForFunction(() => window.__WORLD_QA__?.world?.renderer, null, { timeout: 20000 }); }
  catch { throw new Error('World module did not load. GAME_URL must point to a running Vite development server (src/world.js is needed), not the production preview.'); }
  await page.waitForFunction(() => ['crew', 'enemy', 'props', 'boss', 'npc', 'vehicles', 'walk'].every(key => window.__WORLD_QA__.world.atlases[key]), null, { timeout: 30000 });
  report.checks.push('Seven required sprite atlases loaded');

  const zoneIds = await page.evaluate(() => window.__WORLD_QA__.zoneIds);
  for (let index = 0; index < zoneIds.length; index++) {
    const zoneId = zoneIds[index];
    const result = await page.evaluate(id => {
      const world = window.__WORLD_QA__.world;
      world.setZone(id); world.setMode('explore'); world.update(0);
      const position = world.getPosition();
      return {
        id,
        spawnWalkable: world._walkable(position.x, position.z),
        routes: world.getPOIs().map(poi => {
          const path = world._pathTo(poi);
          return { id: poi.id, goalWalkable: world._walkable(poi.x, poi.z), reachable: Boolean(path), waypoints: path?.length || 0, allWaypointsWalkable: Boolean(path?.every(point => world._walkable(point.x, point.z))) };
        }),
        renderer: { calls: world.renderer.info.render.calls, triangles: world.renderer.info.render.triangles },
      };
    }, zoneId);
    report.zones.push(result);
    assert.equal(result.spawnWalkable, true, `${zoneId}: spawn must be navigable`);
    assert.equal(result.routes.length, 7, `${zoneId}: seven authored points of interest`);
    assert.equal(new Set(result.routes.map(route => route.id)).size, 7, `${zoneId}: point IDs must be unique`);
    for (const route of result.routes) {
      assert.equal(route.goalWalkable, true, `${route.id}: goal must be outside scenery collision`);
      assert.equal(route.reachable, true, `${route.id}: a route must exist`);
      assert.equal(route.allWaypointsWalkable, true, `${route.id}: route must remain navigable`);
    }
    await page.screenshot({ path: fileURLToPath(new URL(`world-${String(index + 1).padStart(2, '0')}-${zoneId}.png`, out)) });
  }
  report.routeCount = report.zones.reduce((sum, zone) => sum + zone.routes.length, 0);
  report.checks.push(`${report.routeCount} navigation routes across ${zoneIds.length} rendered zones`);

  await page.evaluate(() => { const w = window.__WORLD_QA__.world; w.setZone('normandy'); w.setMode('explore'); });
  const before = await page.evaluate(() => window.__WORLD_QA__.world.getPosition());
  await page.keyboard.down('ArrowUp');
  await page.waitForFunction(start => { const p = window.__WORLD_QA__.world.getPosition(); return Math.hypot(p.x - start.x, p.z - start.z) > .5; }, before, { timeout: 15000 });
  report.walk = await page.evaluate(() => {
    const world = window.__WORLD_QA__.world, actor = world.actors.find(actor => actor.key === 'shepard');
    return { directions: world.walkConfig.directions, active: actor.body.material.map === world.spriteCache.get('walk:shepard'), atlas: [world.atlases.walk.image.width, world.atlases.walk.image.height], aspectAdjusted: actor.body.scale.x > 1 };
  });
  assert.equal(report.walk.active, true, 'Keyboard movement must display the reviewed walking sheet');
  assert.equal(report.walk.aspectAdjusted, true, 'Walking cells preserve their own aspect ratio');
  await page.keyboard.up('ArrowUp');
  const moved = await page.evaluate(() => window.__WORLD_QA__.world.getPosition());
  assert.ok(Math.hypot(moved.x - before.x, moved.z - before.z) > .5, 'Real keyboard input must move the party');
  await page.evaluate(() => window.__WORLD_QA__.world.setMode('menu'));
  await page.keyboard.down('ArrowUp'); await page.waitForTimeout(300); await page.keyboard.up('ArrowUp');
  assert.deepEqual(await page.evaluate(() => window.__WORLD_QA__.world.getPosition()), moved, 'Modal mode must freeze movement');
  report.checks.push('Keyboard movement', 'Four-direction Shepard walking sheet', 'Walking aspect ratio', 'Movement frozen in menus');

  const interaction = await page.evaluate(() => {
    const qa = window.__WORLD_QA__, world = qa.world;
    world.setMode('explore'); world.setPosition({ x: -4.5, z: -3 }); world.interact();
    world.setZone('eden-prime'); world.setPosition({ x: 5, z: 6 }); world.interact();
    world.setCleared(['eden-prime:encounter-1']);
    return { dialogue: qa.interactions.at(-1), encounter: qa.encounters.at(-1), nearby: world.getNearby()?.id || null, clearedMarkerVisible: world.poiViews.find(view => view.poi.id === 'eden-prime:encounter-1').group.visible };
  });
  assert.equal(interaction.dialogue, 'normandy:briefing');
  assert.equal(interaction.encounter, 'eden-prime:encounter-1');
  assert.notEqual(interaction.nearby, 'eden-prime:encounter-1');
  assert.equal(interaction.clearedMarkerVisible, false);
  report.checks.push('Dialogue callback', 'Encounter callback', 'Cleared encounter removed without moving the party');

  const combat = await page.evaluate(() => {
    const world = window.__WORLD_QA__.world;
    world.setZone('feros', { party: ['shepard', 'liara', 'wrex'] });
    world.setBattle({ actors: [
      { id: 'shepard', sprite: 'shepard', team: 'party', hp: 100, shield: 40 },
      { id: 'liara', sprite: 'liara', team: 'party', hp: 100, shield: 40 },
      { id: 'wrex', sprite: 'wrex', team: 'party', hp: 100, shield: 40 },
      { id: 'thorian', sprite: 'thorian', team: 'enemy', hp: 400, shield: 0 },
      { id: 'geth-1', sprite: 'geth', team: 'enemy', hp: 100, shield: 20, statuses: { lift: 3 } },
      { id: 'husk-1', sprite: 'husk', team: 'enemy', hp: 0, shield: 0 },
    ] });
    world.setMode('combat');
    world.playEvent({ type: 'action', actorId: 'liara', targetId: 'geth-1', actionId: 'lift' });
    world.playEvent({ type: 'heal', actorId: 'shepard', targetId: 'shepard', actionId: 'medigel' });
    world.update(1 / 60);
    return { actors: world.battleActors.size, lifted: world.battleActors.get('geth-1').group.position.y > 0, defeated: !world.battleActors.get('husk-1').alive, bossAtlas: world.battleActors.get('thorian').body.material.map === world.spriteCache.get('boss:thorian') };
  });
  assert.equal(combat.actors, 6); assert.equal(combat.lifted, true); assert.equal(combat.defeated, true); assert.equal(combat.bossAtlas, true);
  await page.screenshot({ path: fileURLToPath(new URL('world-10-battle.png', out)) });
  report.combat = combat; report.checks.push('Combat sprite roster', 'Boss atlas', 'Biotic levitation', 'Defeated character', 'Self-targeted healing effect');
  assert.deepEqual(report.errors, [], 'No uncaught browser errors');
  assert.deepEqual(report.failedRequests, [], 'No failed asset requests');
  report.passed = true;
} catch (error) {
  report.failure = { message: error.message, stack: error.stack };
  if (page) await page.screenshot({ path: fileURLToPath(new URL('world-failure.png', out)) }).catch(() => {});
  process.exitCode = 1;
} finally {
  await writeFile(new URL('world-report.json', out), `${JSON.stringify(report, null, 2)}\n`);
  if (browser) await browser.close();
}
console.log(JSON.stringify({ passed: report.passed, routeCount: report.routeCount, checks: report.checks, errors: report.errors, failure: report.failure?.message, report: fileURLToPath(new URL('world-report.json', out)) }, null, 2));
