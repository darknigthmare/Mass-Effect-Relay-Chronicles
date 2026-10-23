import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const baseURL = process.env.GAME_URL || 'http://127.0.0.1:4173';
const out = new URL('../test-results/', import.meta.url), docs = new URL('../docs/qa/', import.meta.url);
await Promise.all([mkdir(out, { recursive: true }), mkdir(docs, { recursive: true })]);
const report = {
  version: '0.2.0', at: new Date().toISOString(), passed: false,
  scope: 'Renderer fixture only: a separate battle created through createBattle and WorldView.setBattle. Pose timers are held for screenshots; fixture health is set to zero for the down pose. This is not a campaign victory or combat-balance test.',
  poses: [], errors: [], failedRequests: [],
};
const browser = await chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {}),
  args: ['--no-sandbox', '--no-zygote', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
page.setDefaultTimeout(60000);
page.on('pageerror', error => report.errors.push(error.message));
page.on('requestfailed', request => report.failedRequests.push(`${request.url()}: ${request.failure()?.errorText}`));
page.on('response', response => { if (response.status() >= 400) report.failedRequests.push(`${response.status()} ${response.url()}`); });
try {
  await page.goto(`${baseURL}/?qa`, { waitUntil: 'networkidle' });
  await page.evaluate(() => window.__RELAY_TEST__.begin({ name: 'Pose fixture', appearance: 'female' }));
  await page.getByRole('button', { name: 'Je rejoins le briefing.' }).click();
  await page.waitForFunction(() => {
    const qa = window.__RELAY_TEST__;
    return !qa.getUI().busy && qa.getWorld().atlases['combat-femshep'];
  });
  const initial = await page.evaluate(async () => {
    const { createBattle } = await import('/src/combat.js');
    const { actorFor, ENEMIES } = await import('/src/game-data.js');
    const qa = window.__RELAY_TEST__, state = qa.getState(), world = qa.getWorld();
    const battle = createBattle({ party: state.party.map(id => actorFor(id, state)), enemies: [{ ...ENEMIES.geth, id: 'pose-geth' }], difficulty: 'normal', mode: 'wait', seed: 2183, medigel: state.medigel });
    world.setBattle(battle); world.setMode('combat'); world.update(0);
    window.__FEMSHEP_POSE_FIXTURE__ = battle;
    return { inventory: state.inventory, cleared: state.cleared, lost: state.lost, completed: state.completed };
  });
  for (const pose of ['aim', 'power', 'hit', 'down']) {
    const metrics = await page.evaluate(name => {
      const world = window.__RELAY_TEST__.getWorld(), fixture = window.__FEMSHEP_POSE_FIXTURE__;
      const shepard = fixture.actors.find(actor => actor.id === 'shepard');
      shepard.hp = name === 'down' ? 0 : shepard.maxHp; shepard.cover = false;
      world.setBattle(fixture);
      if (name === 'hit') world.playEvent({ type: 'damage', targetId: 'shepard' });
      else if (name !== 'down') world.playEvent({ type: 'action', actorId: 'shepard', actionId: name === 'power' ? 'warp' : 'shoot', targetId: 'pose-geth' });
      const actor = world.battleActors.get('shepard');
      // Keep only this renderer fixture's transient pose visible for capture.
      actor.combatPoseTime = 600;
      world.update(0);
      const texture = actor.body.material.map, frame = world.characterAnimations.femshep.combat.frames[name];
      return {
        pose: name, frameId: actor.animationFrame, key: actor.key, texture: texture.image.src,
        repeat: texture.repeat.toArray(), offset: texture.offset.toArray(), rect: frame.rect,
        atlas: { width: texture.image.width, height: texture.image.height },
        heightScale: actor.body.geometry.parameters.height * actor.body.scale.y / actor.height,
        expectedHeightScale: frame.heightScale, rotationZ: actor.body.rotation.z,
        drawCalls: world.renderer.info.render.calls, triangles: world.renderer.info.render.triangles,
      };
    }, pose);
    assert.equal(metrics.key, 'femshep'); assert.equal(metrics.frameId, `femshep-combat-${pose}`);
    assert.match(metrics.texture, /shepard-female-combat-atlas\.png$/);
    const [x, y, w, h] = metrics.rect;
    const expectedRepeat = [w / metrics.atlas.width, h / metrics.atlas.height];
    const expectedOffset = [x / metrics.atlas.width, 1 - (y + h) / metrics.atlas.height];
    for (let i = 0; i < 2; i++) { assert.ok(Math.abs(metrics.repeat[i] - expectedRepeat[i]) < 1e-9); assert.ok(Math.abs(metrics.offset[i] - expectedOffset[i]) < 1e-9); }
    assert.ok(Math.abs(metrics.heightScale - metrics.expectedHeightScale) < 1e-9);
    assert.ok(Math.abs(metrics.heightScale - ({ aim: 1, power: 1, hit: .8, down: .245 })[pose]) < 1e-9);
    assert.equal(metrics.rotationZ, 0); assert.ok(metrics.drawCalls > 0); assert.ok(metrics.triangles > 0);
    await page.screenshot({ path: fileURLToPath(new URL(`femshep-fixture-${pose}.png`, out)) });
    report.poses.push(metrics); console.log(JSON.stringify({ pose, pass: true, heightScale: metrics.heightScale }));
  }
  const final = await page.evaluate(() => {
    const qa = window.__RELAY_TEST__, state = qa.getState(), world = qa.getWorld();
    world.setBattle(null); world.setMode('explore'); delete window.__FEMSHEP_POSE_FIXTURE__;
    return { inventory: state.inventory, cleared: state.cleared, lost: state.lost, completed: state.completed };
  });
  assert.deepEqual(final, initial, 'Renderer fixtures preserve actual campaign progression and equipment');
  report.assetErrors = await page.evaluate(() => window.__RELAY_TEST__.getWorld().assetErrors || []);
  assert.deepEqual(report.assetErrors, []); assert.deepEqual(report.errors, []); assert.deepEqual(report.failedRequests, []);
  report.passed = true; await writeFile(new URL('femshep-poses-report.json', docs), `${JSON.stringify(report, null, 2)}\n`);
} catch (error) {
  report.failure = error.stack || String(error); throw error;
} finally {
  await browser.close(); await writeFile(new URL('femshep-poses-report.json', out), `${JSON.stringify(report, null, 2)}\n`);
}
