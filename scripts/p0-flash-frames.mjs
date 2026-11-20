// Controlled rendering steps from one real native combat order, with no RAF
// racing the screenshot. The production public click is checked separately.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';

const url = new URL(process.env.GAME_URL || 'http://127.0.0.1:4173/');
const output = process.env.P0_FLASH_OUTPUT || 'test-results/p0-flash-frames';
await mkdir(output, { recursive: true });
const report = { passed: false, at: new Date().toISOString(), checks: [], captures: [], errors: [],
  scope: 'Controlled Chromium software WebGL rendering of a native action and its outcome in isolation.' };
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || undefined,
  headless: true, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
try {
  const page = await browser.newPage({ viewport: { width: 1160, height: 720 } });
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('requestfailed', request => report.errors.push(`${request.url()}: ${request.failure()?.errorText}`));
  const harness = new URL('__p0-shot-frames__', url);
  await page.route(harness.href, route => route.fulfill({
    contentType: 'text/html',
    body: `<!doctype html><html lang="fr"><meta charset="utf-8">
      <style>body{margin:0}#terrain{position:relative;width:100vw;height:100vh}</style>
      <div id="terrain"></div><script type="module">
        import { WorldView } from "/src/world.js";
        import { createBattle, performAction, tickBattle } from "/src/combat.js";
        import { getLevelLayout } from "/src/level-layout-data.js";
        const world = new WorldView(document.querySelector('#terrain'));
        const zone = 'eden-prime';
        world.setZone(zone); world.setMode('explore'); world.setPosition(getLevelLayout(zone).pois['encounter-1']);
        const battle = createBattle({ party: [{ id: 'shepard', sprite: 'shepard', hp: 100, shield: 30, attack: 26, speed: 1.1, weaponType: 'pistol' }],
          enemies: [{ id: 'geth-1', sprite: 'geth', hp: 200, shield: 25, defense: 6, speed: .3 }], seed: 148, mode: 'wait' });
        for (let i = 0; i < 120 && battle.actors[0].atb < 100; i++) tickBattle(battle, .05);
        world.setBattle(battle); world.setMode('combat');
        world.visualAccessibility = { particles: true, ambientPulse: false, hitTint: false, spriteShake: false };
        world.renderer.shadowMap.enabled = false;
        for (let i = 0; i < 45; i++) world.update(.05, { render: false });
        world.update(0);
        window.shotFrames = { world, battle, boot: () => performAction(battle, { actorId: 'shepard', targetId: 'geth-1', actionId: 'shoot' }) };
      </script></html>`,
  }));
  await page.goto(harness.href);
  await page.waitForFunction(() => window.shotFrames?.world.atlases.crew && window.shotFrames.world.atlases.enemy);
  const snapshot = async label => {
    const state = await page.evaluate(() => {
      const { world } = window.shotFrames;
      world.update(0);
      return world.effects.map(({ kind, time, object }) => {
        const projected = object.position.clone().project(world.camera);
        return { kind, time, center: object.position.toArray(), pixel: [(projected.x + 1) * innerWidth / 2, (1 - projected.y) * innerHeight / 2],
          color: object.material.color.getHex(), shotAt: object.userData.shotAt };
      });
    });
    const path = join(output, `${label}.png`);
    const bytes = await page.screenshot({ path });
    report.captures.push({ label, path, sha256: createHash('sha256').update(bytes).digest('hex'), effects: state });
    return state;
  };
  assert.deepEqual(await snapshot('01-before'), []);
  const order = await page.evaluate(() => {
    const context = window.shotFrames;
    context.order = context.boot();
    const start = context.order.events.find(event => event.type === 'action');
    const damage = context.order.events.find(event => event.type === 'damage');
    context.world.playEvent(start);
    return { ok: context.order.ok, start, damage };
  });
  assert.equal(order.ok, true);
  assert.equal(order.start.at, order.damage.at);
  const shotOnly = await snapshot('02-flash-origin');
  assert.deepEqual(shotOnly.map(effect => effect.kind), ['muzzle-flash', 'weapon-trace']);
  await page.evaluate(() => {
    const { world, order, battle } = window.shotFrames;
    world.playEvent(order.events.find(event => event.type === 'damage'));
    world.setBattle(battle);
  });
  const impact = await snapshot('03-impact-target');
  assert.deepEqual(impact.map(effect => effect.kind), ['muzzle-flash', 'weapon-trace', 'impact']);
  assert.equal(impact[2].shotAt, order.damage.at);
  assert.notDeepEqual(impact[0].center, impact[2].center);
  await page.evaluate(() => {
    const { world } = window.shotFrames;
    world.update(.05, { render: false });
    world.update(.05, { render: false });
  });
  await snapshot('04-after-100ms');
  assert.ok(!report.captures.at(-1).effects.some(effect => effect.kind === 'muzzle-flash'));
  assert.ok(report.captures.at(-1).effects.some(effect => effect.kind === 'impact'));
  await page.evaluate(() => {
    const { world, order } = window.shotFrames;
    world.visualAccessibility = { particles: false, ambientPulse: false, hitTint: false, spriteShake: false };
    for (const event of order.events) world.playEvent(event);
  });
  assert.deepEqual(await snapshot('05-reduced'), []);
  assert.deepEqual(report.errors, []);
  report.checks.push({ action: order.start, damage: order.damage, tool: 'Actual native WebGL, explicit action-only and outcome draw steps on the same native event timestamp.' });
  report.passed = true;
} catch (error) {
  report.failure = error.stack;
  process.exitCode = 1;
} finally {
  await browser.close();
  await writeFile(join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ passed: report.passed, captures: report.captures.length, failure: report.failure }));
}
