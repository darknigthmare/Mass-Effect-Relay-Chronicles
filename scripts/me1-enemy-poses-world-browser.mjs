import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { ENEMY_ANIMATION_IDS as IDS, normalizeEnemyAnimation } from '../src/enemy-animation-data.js';
import { normalizeJokerSeated } from '../src/joker-seated-data.js';

const baseURL = process.env.GAME_URL || 'http://127.0.0.1:4193';
const phase = process.env.ME1_ENEMY_POSES_PHASE || 'all';
assert.ok(['all', 'completion'].includes(phase));
const root = new URL('../', import.meta.url), prefix = 'me1-enemy-poses-world';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
for (const dir of ['test-results/', 'docs/qa/', 'docs/screenshots/']) await mkdir(new URL(dir, root), { recursive: true });
const configs = Object.fromEntries(await Promise.all(IDS.map(async key => [key,
  normalizeEnemyAnimation(key, JSON.parse(await readFile(new URL(`public/assets/enemy-${key}-animation.json`, root))))])));
const jokerConfig = normalizeJokerSeated(JSON.parse(await readFile(new URL('public/assets/joker-seated.json', root))));
assert.ok(jokerConfig && Object.values(configs).every(Boolean));
const paths = ['src/world.js', 'src/enemy-animation-data.js', 'src/joker-seated-data.js', 'src/companion-animation-data.js',
  'src/game-data.js', 'src/combat.js', 'src/state.js', 'src/customization-render.js', 'src/customization.js', 'vite.config.js',
  'scripts/me1-enemy-poses-world-browser.mjs', 'public/assets/enemy-atlas.png', 'public/assets/npc-atlas.png',
  'public/assets/joker-seated.png', 'public/assets/joker-seated.json',
  ...IDS.flatMap(key => [`public/assets/enemy-${key}-animation.json`, `public/assets/enemy-${key}-combat.png`])];
const sourceHashes = Object.fromEntries(await Promise.all(paths.map(async path => [path, hash(await readFile(new URL(path, root)))])));
const report = { schemaVersion: 1, passed: false, at: new Date().toISOString(), url: baseURL,
  phase,
  sourceHead: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: fileURLToPath(root), encoding: 'utf8' }).trim(), sourceHashes,
  scope: 'Detached development fixture on the actual WorldView. Sixteen held enemy key-pose states, four real native enemy action/KO sequences, exact metadata/UV/pivot checks, Normandy pilot idle, a separately requested pilot drawing, and three retained Shepard/companion render regressions. Native IDs and actors come from the existing ME1 definitions. The application stays at its title and its save/storage bytes are compared unchanged. This is not the public campaign journey, an animation cycle, a new enemy kit or original-game fidelity certification.',
  buildKind: 'vite-development-isolated-renderer', viewport: { width: 1280, height: 800, deviceScaleFactor: 1 },
  node: process.version, cases: [], nativeEvents: [], joker: [], regressions: [], scopeClosures: [],
  captureArtifacts: [], servedAssets: [], errors: [], failedRequests: [], assetErrors: [] };
const close = (actual, expected, label) => assert.ok(Math.abs(actual - expected) < 1e-7, `${label}: ${actual} != ${expected}`);
let browser, page;
async function capture(name) {
  const path = `docs/screenshots/${prefix}-${name}.png`;
  await page.screenshot({ path: fileURLToPath(new URL(path, root)) });
  const bytes = await readFile(new URL(path, root)); report.captureArtifacts.push({ path, bytes: bytes.length, sha256: hash(bytes) });
  return path;
}
function checkMetric(m, config, frame) {
  const [x, y, width, height] = frame.rect;
  assert.equal(m.frameId, frame.id); assert.equal(new URL(m.texture).pathname, `/assets/${config.file}`);
  assert.deepEqual(m.rect, frame.rect); assert.deepEqual(m.pivot, frame.pivot);
  close(m.repeat[0], width / config.width, 'UV width'); close(m.repeat[1], height / config.height, 'UV height');
  close(m.offset[0], x / config.width, 'UV x'); close(m.offset[1], 1 - (y + height) / config.height, 'UV y');
  close(m.relativeHeight, frame.heightScale, 'height'); close(m.groundAnchorError, 0, 'pivot');
  assert.equal(m.rotationZ, 0); assert.equal(m.sourceMapDistinct, true); assert.deepEqual(m.sourceRepeat, [1, 1]);
  assert.deepEqual(m.sourceOffset, [0, 0]); assert.equal(m.saveUnchanged, true);
  assert.ok(m.drawCalls > 0 && m.triangles > 0);
  assert.ok(m.projectedBounds.left >= 0 && m.projectedBounds.right <= 1280 && m.projectedBounds.top >= 0 && m.projectedBounds.bottom <= 800);
}
try {
  browser = await chromium.launch({ headless: true,
    ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {}),
    args: ['--no-sandbox', '--no-zygote', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  report.chromium = browser.version(); page = await browser.newPage({ viewport: report.viewport, deviceScaleFactor: 1 });
  page.setDefaultTimeout(45000); page.on('pageerror', error => report.errors.push(error.message));
  page.on('requestfailed', request => report.failedRequests.push(`${request.url()}: ${request.failure()?.errorText}`));
  page.on('response', response => { if (response.status() >= 400) report.failedRequests.push(`${response.status()} ${response.url()}`); });
  await page.goto(`${baseURL}/?qa`, { waitUntil: 'networkidle' }); await page.waitForFunction(() => !!window.__RELAY_TEST__?.getWorld());
  report.appBefore = await page.evaluate(() => ({ state: window.__RELAY_TEST__.getState(), storage: Object.fromEntries(Object.keys(localStorage).sort().map(key => [key, localStorage.getItem(key)])) }));
  assert.equal(report.appBefore.state, null);
  report.fallbackBeforeLoad = await page.evaluate(async () => {
    const [{ WorldView }, { createBattle }, { actorFor, ENEMIES }, { newGame }] = await Promise.all([
      import('/src/world.js'), import('/src/combat.js'), import('/src/game-data.js'), import('/src/state.js')]);
    window.__RELAY_TEST__.getWorld().dispose();
    const container = document.createElement('div'); container.id = 'me1-enemy-render-fixture';
    Object.assign(container.style, { position: 'fixed', inset: '0', zIndex: '100000', background: '#07111d' }); document.body.appendChild(container);
    const world = new WorldView(container), state = newGame({ name: 'Fixture détachée' });
    const battle = createBattle({ party: [actorFor('shepard', state)], enemies: [{ ...ENEMIES.geth, id: 'geth-0' }], mode: 'wait', seed: 2183 });
    world.setBattle(battle); world.setMode('combat'); world.update(0);
    const actor = world.battleActors.get('geth-0');
    const f = window.__ME1_ENEMY_RENDER_FIXTURE__ = { world, container, state, battle, beforeState: JSON.stringify(state), frame: 0, lastTime: performance.now() };
    f.metrics = (actor, atlasName, frame) => {
      const map = actor.body.material.map, p = actor.body.geometry.parameters, Vector3 = world.camera.position.constructor;
      actor.body.updateWorldMatrix(true, false);
      const pivot = actor.body.localToWorld(new Vector3((frame.pivot[0] / frame.rect[2] - .5) * p.width, (.5 - frame.pivot[1] / frame.rect[3]) * p.height, 0));
      const anchor = actor.group.localToWorld(new Vector3(0, .05, 0)), projected = [];
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
        const point = actor.body.localToWorld(new Vector3(sx * p.width / 2, sy * p.height / 2, 0)); point.project(world.camera);
        projected.push([(point.x * .5 + .5) * innerWidth, (-point.y * .5 + .5) * innerHeight]);
      }
      return { id: actor.id, key: actor.key, frameId: actor.animationFrame, texture: map.image.src, textureUUID: map.uuid,
        rect: frame.rect, pivot: frame.pivot, repeat: map.repeat.toArray(), offset: map.offset.toArray(), rotationZ: actor.body.rotation.z,
        relativeHeight: p.height * actor.body.scale.y / actor.height, groundAnchorError: pivot.distanceTo(anchor),
        sourceMapDistinct: map !== world.atlases[atlasName], sourceRepeat: world.atlases[atlasName].repeat.toArray(),
        sourceOffset: world.atlases[atlasName].offset.toArray(), saveUnchanged: JSON.stringify(f.state) === f.beforeState,
        drawCalls: world.renderer.info.render.calls, triangles: world.renderer.info.render.triangles,
        projectedBounds: { left: Math.min(...projected.map(p => p[0])), top: Math.min(...projected.map(p => p[1])), right: Math.max(...projected.map(p => p[0])), bottom: Math.max(...projected.map(p => p[1])) } };
    };
    const loop = time => { world.update(Math.min(.05, Math.max(0, (time - f.lastTime) / 1000))); f.lastTime = time; f.frame = requestAnimationFrame(loop); };
    f.frame = requestAnimationFrame(loop);
    return { frame: actor.animationFrame ?? null, visible: !!actor.body.material.map, opacity: actor.body.material.opacity };
  });
  assert.deepEqual(report.fallbackBeforeLoad, { frame: null, visible: true, opacity: 1 });
  await page.waitForFunction(ids => { const w = window.__ME1_ENEMY_RENDER_FIXTURE__.world; return ids.every(key => !!w.atlases[`combat-${key}`]) && !!w.atlases['seated-joker']
    && !!w.atlases['combat-shepard'] && !!w.atlases['combat-femshep']; }, IDS);
  assert.deepEqual(await page.evaluate(ids => Object.fromEntries(ids.map(key => [key, window.__ME1_ENEMY_RENDER_FIXTURE__.world.characterAnimations[key]])), IDS), configs);
  assert.deepEqual(await page.evaluate(() => window.__ME1_ENEMY_RENDER_FIXTURE__.world.jokerSeatedConfig), jokerConfig);
  for (const path of [...IDS.map(key => `public/assets/${configs[key].combat.file}`), 'public/assets/joker-seated.png']) {
    const response = await page.request.get(`${baseURL}/assets/${path.split('/').at(-1)}`), sha256 = hash(await response.body());
    assert.equal(response.status(), 200); assert.equal(sha256, sourceHashes[path]); report.servedAssets.push({ path, status: 200, sha256 });
  }
  if (phase === 'all') for (const pair of [['geth', 'husk'], ['geth-sniper', 'geth-destroyer']]) {
    await page.evaluate(async pair => {
      const [{ actorFor, ENEMIES }, { createBattle }] = await Promise.all([import('/src/game-data.js'), import('/src/combat.js')]);
      const f = window.__ME1_ENEMY_RENDER_FIXTURE__, keys = { geth: 'geth', husk: 'husk', 'geth-sniper': 'sniper', 'geth-destroyer': 'destroyer' };
      f.world.setBattle(null); f.battle = createBattle({ party: ['shepard', 'garrus', 'wrex'].map(id => actorFor(id, f.state)),
        enemies: pair.map((key, index) => ({ ...ENEMIES[keys[key]], id: `${keys[key]}-${index}` })), seed: 2183, mode: 'wait' });
      f.world.setBattle(f.battle); f.world.setMode('combat'); f.world.update(0);
    }, pair);
    await page.waitForFunction(() => { const w = window.__ME1_ENEMY_RENDER_FIXTURE__.world; return Math.abs(w.cameraTarget.y - .3) < .01; });
    for (const pose of ['aim', 'power', 'hit', 'down']) {
      await page.evaluate(pose => {
        const f = window.__ME1_ENEMY_RENDER_FIXTURE__, w = f.world;
        for (const native of f.battle.actors.filter(actor => actor.team === 'enemy')) native.hp = pose === 'down' ? 0 : native.maxHp;
        w.setBattle(f.battle); f.beforeRenderBattle = JSON.stringify(f.battle);
        for (const native of f.battle.actors.filter(actor => actor.team === 'enemy')) {
          const actor = w.battleActors.get(native.id); actor.combatPoseTime = 0;
          if (pose === 'hit') w.playEvent({ type: 'damage', targetId: native.id });
          else if (pose !== 'down') w.playEvent({ type: 'action', actorId: native.id, actionId: pose === 'aim' ? 'shoot' : 'cover' });
          if (pose !== 'down') actor.combatPoseTime = 600;
        }
        w.update(0);
      }, pose);
      await page.waitForFunction(() => { const w = window.__ME1_ENEMY_RENDER_FIXTURE__.world; return w.effects.length === 0
        && [...w.battleActors.values()].every(actor => actor.poseTime <= 0 && (actor.shieldFlash || 0) <= 0); });
      const metrics = await page.evaluate(pose => {
        const f = window.__ME1_ENEMY_RENDER_FIXTURE__, w = f.world;
        return f.battle.actors.filter(actor => actor.team === 'enemy').map(native => ({ ...f.metrics(w.battleActors.get(native.id), `combat-${native.sprite}`, w.characterAnimations[native.sprite].combat.frames[pose]),
          pose, battleUnchanged: JSON.stringify(f.battle) === f.beforeRenderBattle }));
      }, pose);
      for (const metric of metrics) { checkMetric(metric, configs[metric.key].combat, configs[metric.key].combat.frames[pose]); assert.equal(metric.battleUnchanged, true); }
      assert.notEqual(metrics[0].textureUUID, metrics[1].textureUUID);
      const screenshot = await capture(`${pair.join('-')}-${pose}`); report.cases.push(...metrics.map(metric => ({ ...metric, screenshot, passed: true })));
      console.log(JSON.stringify({ pair, pose, cases: report.cases.length }));
    }
  }
  report.nativeEvents = await page.evaluate(async ids => {
    const [{ actorFor, ENEMIES }, { createBattle, performAction }] = await Promise.all([import('/src/game-data.js'), import('/src/combat.js')]);
    const f = window.__ME1_ENEMY_RENDER_FIXTURE__, keys = { geth: 'geth', husk: 'husk', 'geth-sniper': 'sniper', 'geth-destroyer': 'destroyer' }, results = [];
    for (const key of ids) {
      const battle = createBattle({ party: ['shepard', 'ashley'].map(id => ({ ...actorFor(id, f.state), atb: 100 })),
        enemies: [{ ...ENEMIES[keys[key]], id: `${keys[key]}-0`, atb: 100 }], mode: 'wait', seed: 2183 });
      const native = battle.actors.find(actor => actor.team === 'enemy'), powers = JSON.stringify(native.powers), w = f.world;
      w.setBattle(battle); const actionId = native.primaryAction === 'strike' ? 'strike' : native.powers[0] || 'shoot';
      const action = performAction(battle, { actorId: native.id, actionId, targetId: 'shepard' });
      w.setBattle(battle); for (const event of action.events) w.playEvent(event); w.update(0);
      const actionFrame = w.battleActors.get(native.id).animationFrame;
      // Sabotage legitimately disables Shepard's gun. A separate ready ally
      // performs this detached KO witness without clearing any native status.
      const shooter = battle.actors.find(actor => actor.id === 'ashley'); shooter.attack = 5000; native.hp = 1; native.shield = 0;
      const damage = performAction(battle, { actorId: shooter.id, actionId: 'shoot', targetId: native.id }), beforeRender = JSON.stringify(battle);
      w.setBattle(battle); for (const event of damage.events) w.playEvent(event);
      w.playEvent({ type: 'action', actorId: native.id, actionId: 'shoot' }); w.update(0);
      results.push({ key, actorId: native.id, actionId, actionOK: action.ok, actionFrame, damageOK: damage.ok, damageActorId: shooter.id,
        downFrame: w.battleActors.get(native.id).animationFrame, hpAfterDamage: native.hp, powersUnchanged: JSON.stringify(native.powers) === powers,
        rendererPreservesNativeBattle: JSON.stringify(battle) === beforeRender });
    }
    return results;
  }, IDS);
  for (const entry of report.nativeEvents) {
    assert.equal(entry.actionOK, true); assert.equal(entry.damageOK, true); assert.equal(entry.hpAfterDamage, 0);
    assert.equal(entry.actionFrame, `${entry.key}-combat-${entry.actionId === 'shoot' ? 'aim' : 'power'}`);
    assert.equal(entry.downFrame, `${entry.key}-combat-down`); assert.equal(entry.powersUnchanged, true); assert.equal(entry.rendererPreservesNativeBattle, true);
  }
  report.scopeClosures = await page.evaluate(async () => {
    const [{ actorFor, ENEMIES }, { createBattle }] = await Promise.all([import('/src/game-data.js'), import('/src/combat.js')]);
    const f = window.__ME1_ENEMY_RENDER_FIXTURE__, rows = [];
    for (const patch of [{ mediaId: 'ME3' }, { periodId: 'me2' }, { context: { mediaId: 'MEA' } }, { id: 'ME2-ENM-GETH' }, { sprite: 'husk' }, { team: 'party' }]) {
      f.world.setBattle(null); const battle = createBattle({ party: [actorFor('shepard', f.state)], enemies: [{ ...ENEMIES.geth, id: 'geth-0', ...patch }] });
      // Explicitly invalid side after native construction, for a negative render fixture.
      if (patch.team) battle.actors[1].team = patch.team;
      f.world.setBattle(battle); f.world.update(0); const actor = f.world.battleActors.get(battle.actors[1].id);
      const source = actor.body.material.map.image.src;
      rows.push({ patch, frame: actor.animationFrame ?? null, sourceIsEnemy: source?.endsWith('/assets/enemy-atlas.png') === true,
        sourceIsBase: source?.endsWith(`/assets/${patch.team === 'party' ? 'crew' : 'enemy'}-atlas.png`) === true });
    }
    return rows;
  });
  assert.ok(report.scopeClosures.every(row => row.frame === null && row.sourceIsBase));
  for (const [index, pair] of [['garrus', 'wrex'], ['liara', 'tali'], ['ashley', 'kaidan']].entries()) {
    const metrics = await page.evaluate(async ({ index, pair }) => {
      const [{ actorFor, ENEMIES }, { createBattle }, { initialCustomization }] = await Promise.all([import('/src/game-data.js'), import('/src/combat.js'), import('/src/customization.js')]);
      const f = window.__ME1_ENEMY_RENDER_FIXTURE__, w = f.world, appearance = index === 1 ? 'female' : 'male';
      w.setBattle(null); w.setCommanderAppearance(appearance); const custom = initialCustomization(appearance); custom.armor.primary = 'teal'; w.setCommanderCustomization(custom);
      f.battle = createBattle({ party: ['shepard', ...pair].map(id => actorFor(id, f.state)), enemies: [{ ...ENEMIES.geth, id: 'geth-0' }], mode: 'wait', seed: 2183 });
      w.setBattle(f.battle); w.update(0);
      return ['shepard', ...pair].map(id => { const actor = w.battleActors.get(id); return { id, key: actor.key, appearance, frame: actor.animationFrame,
        texture: actor.body.material.map.userData.relayCustomizationSource?.image?.src || actor.body.material.map.image?.src,
        customizedShepard: id !== 'shepard' || !!actor.body.material.map.userData.relayCustomizationSource }; });
    }, { index, pair });
    assert.ok(metrics.every(metric => metric.frame === `${metric.key}-combat-aim`));
    assert.equal(metrics[0].customizedShepard, true); const screenshot = await capture(`regression-${pair.join('-')}`);
    report.regressions.push({ pair, metrics, screenshot, passed: true });
  }
  await page.evaluate(() => { const w = window.__ME1_ENEMY_RENDER_FIXTURE__.world; w.setBattle(null); w.setZone('normandy'); w.setPosition({ x: 0, z: -12.5 }); w.setMode('explore'); w.update(0); });
  await page.waitForFunction(() => { const w = window.__ME1_ENEMY_RENDER_FIXTURE__.world; return Math.abs(w.cameraTarget.z + 6) < .04; });
  for (const pose of ['idle', 'pilot']) {
    const metric = await page.evaluate(pose => {
      const f = window.__ME1_ENEMY_RENDER_FIXTURE__, w = f.world, actor = w.ambientActors.find(actor => actor.id === 'npc:joker');
      if (pose === 'pilot') { cancelAnimationFrame(f.frame); w._applyAnimationFrame(actor, 'seated-joker', w.jokerSeatedConfig.frames.pilot); w.renderer.render(w.scene, w.camera); }
      return { ...f.metrics(actor, 'seated-joker', w.jokerSeatedConfig.frames[pose]), pose, stationRole: actor.stationRole,
        actualIdleIntegration: pose === 'idle', heldDrawingOnly: pose === 'pilot' };
    }, pose);
    checkMetric(metric, jokerConfig, jokerConfig.frames[pose]); assert.equal(metric.stationRole, 'normandy-pilot');
    const screenshot = await capture(`joker-${pose}`); report.joker.push({ ...metric, screenshot, passed: true });
  }
  report.assetErrors = await page.evaluate(() => window.__ME1_ENEMY_RENDER_FIXTURE__.world.assetErrors);
  const final = await page.evaluate(() => { const f = window.__ME1_ENEMY_RENDER_FIXTURE__; cancelAnimationFrame(f.frame); f.world.dispose(); f.container.remove(); delete window.__ME1_ENEMY_RENDER_FIXTURE__;
    return { state: window.__RELAY_TEST__.getState(), storage: Object.fromEntries(Object.keys(localStorage).sort().map(key => [key, localStorage.getItem(key)])) }; });
  assert.deepEqual(final, report.appBefore); report.applicationPreserved = true;
  assert.equal(report.cases.length, phase === 'all' ? 16 : 0); assert.equal(report.nativeEvents.length, 4); assert.equal(report.joker.length, 2);
  assert.equal(report.regressions.length, 3); assert.equal(report.captureArtifacts.length, phase === 'all' ? 13 : 5);
  assert.deepEqual(report.assetErrors, []); assert.deepEqual(report.errors, []); assert.deepEqual(report.failedRequests, []);
  for (const [path, expected] of Object.entries(sourceHashes)) assert.equal(hash(await readFile(new URL(path, root))), expected, `${path}: changed during fixture`);
  report.passed = true;
} catch (error) {
  report.failure = error.stack || String(error); if (page) await capture('failure').catch(() => {}); process.exitCode = 1; console.error(error);
} finally {
  await browser?.close(); const content = JSON.stringify(report, null, 2) + '\n';
  const suffix = phase === 'completion' ? '-completion' : '';
  for (const path of [`test-results/${prefix}${suffix}-report.json`, `docs/qa/${prefix}${suffix}-report.json`]) await writeFile(new URL(path, root), content);
  console.log(JSON.stringify({ passed: report.passed, cases: report.cases.length, captures: report.captureArtifacts.length, reportSHA256: hash(content) }));
}
