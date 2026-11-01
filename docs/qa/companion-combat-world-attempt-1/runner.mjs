import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { COMPANION_ANIMATION_IDS as IDS, normalizeCompanionAnimation } from '../src/companion-animation-data.js';

const baseURL = process.env.GAME_URL || 'http://127.0.0.1:4193';
const root = new URL('../', import.meta.url), prefix = 'companion-combat-world';
for (const path of ['test-results/', 'docs/qa/', 'docs/screenshots/']) await mkdir(new URL(path, root), { recursive: true });
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const configs = Object.fromEntries(await Promise.all(IDS.map(async key => [key,
  normalizeCompanionAnimation(key, JSON.parse(await readFile(new URL(`public/assets/companion-${key}-animation.json`, root))))])));
const paths = ['src/world.js', 'src/companion-animation-data.js', 'src/game-data.js', 'src/combat.js', 'src/state.js',
  'src/customization-render.js', 'src/customization.js', 'vite.config.js', 'scripts/companion-combat-world-browser.mjs',
  'public/assets/crew-atlas.png', ...IDS.flatMap(key => [`public/assets/companion-${key}-animation.json`, `public/assets/companion-${key}-combat.png`])];
const sourceHashes = Object.fromEntries(await Promise.all(paths.map(async path => [path, hash(await readFile(new URL(path, root)))])));
const report = { schemaVersion: 1, passed: false, at: new Date().toISOString(), url: baseURL,
  sourceHead: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: fileURLToPath(root), encoding: 'utf8' }).trim(),
  scope: 'Isolated development render fixture using the actual WorldView, native actorFor/createBattle and detached newGame data. Three Shepard/companion pairs, twenty-four key-pose cases, actual native KO/Unity events, UV/pivot/scope checks and exploration return. The app stays at its title; no campaign is started, recruited, progressed or saved. This is separate from the public production gameplay/save journey. No original animation cycles, exact equipment or integral artistic fidelity certified.',
  buildKind: 'vite-development-isolated-renderer', sourceHashes, cases: [], nativeEvents: [], priorities: [],
  exploration: [], scopeClosures: [], captureArtifacts: [], servedAssets: [], errors: [], failedRequests: [], assetErrors: [],
  viewport: { width: 1280, height: 800, deviceScaleFactor: 1 }, node: process.version };
const close = (actual, expected, label) => assert.ok(Math.abs(actual - expected) < 1e-7, `${label}: ${actual} != ${expected}`);
let browser, page;
async function capture(name) {
  const path = `docs/screenshots/${prefix}-${name}.png`;
  await page.screenshot({ path: fileURLToPath(new URL(path, root)) });
  const bytes = await readFile(new URL(path, root)); report.captureArtifacts.push({ path, bytes: bytes.length, sha256: hash(bytes) });
  return path;
}
try {
  browser = await chromium.launch({ headless: true,
    ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {}),
    args: ['--no-sandbox', '--no-zygote', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  report.chromium = browser.version();
  page = await browser.newPage({ viewport: report.viewport, deviceScaleFactor: 1 }); page.setDefaultTimeout(45000);
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('requestfailed', request => report.failedRequests.push(`${request.url()}: ${request.failure()?.errorText}`));
  page.on('response', response => { if (response.status() >= 400) report.failedRequests.push(`${response.status()} ${response.url()}`); });
  await page.goto(`${baseURL}/?qa`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => !!window.__RELAY_TEST__?.getWorld());
  report.appBefore = await page.evaluate(() => ({ state: window.__RELAY_TEST__.getState(), storage: Object.fromEntries(Object.keys(localStorage).sort().map(key => [key, localStorage.getItem(key)])) }));
  assert.equal(report.appBefore.state, null, 'The isolated fixture never begins the actual app campaign');
  report.fallbackBeforeLoad = await page.evaluate(async () => {
    const [{ WorldView }, { createBattle }, { actorFor }, { newGame }] = await Promise.all([
      import('/src/world.js'), import('/src/combat.js'), import('/src/game-data.js'), import('/src/state.js')]);
    window.__RELAY_TEST__.getWorld().dispose();
    const container = document.createElement('div'); container.id = 'companion-render-fixture';
    Object.assign(container.style, { position: 'fixed', inset: '0', zIndex: '100000', background: '#07111d' }); document.body.appendChild(container);
    const world = new WorldView(container), state = newGame({ name: 'Fixture détachée', appearance: 'male' });
    const battle = createBattle({ party: [actorFor('shepard', state), actorFor('garrus', state), actorFor('wrex', state)],
      enemies: [{ id: 'fixture-target', sprite: 'geth', hp: 1000, maxHp: 1000 }], seed: 2183, mode: 'wait' });
    world.setBattle(battle); world.setMode('combat'); world.update(0);
    const actor = world.battleActors.get('garrus'), fallback = { frame: actor.animationFrame ?? null, visible: !!actor.body.material.map, opacity: actor.body.material.opacity };
    const fixture = window.__COMPANION_RENDER_FIXTURE__ = { world, container, state, battle, beforeState: JSON.stringify(state), frame: 0, lastTime: performance.now() };
    const loop = time => { world.update(Math.min(.05, Math.max(0, (time - fixture.lastTime) / 1000))); fixture.lastTime = time; fixture.frame = requestAnimationFrame(loop); };
    fixture.frame = requestAnimationFrame(loop); return fallback;
  });
  assert.equal(report.fallbackBeforeLoad.frame, null); assert.equal(report.fallbackBeforeLoad.visible, true); assert.equal(report.fallbackBeforeLoad.opacity, 1);
  await page.waitForFunction(ids => { const w = window.__COMPANION_RENDER_FIXTURE__.world; return ids.every(key => !!w.atlases[`combat-${key}`]) && !!w.atlases['combat-shepard'] && !!w.atlases['combat-femshep']; }, IDS);
  const bundled = await page.evaluate(ids => Object.fromEntries(ids.map(key => [key, window.__COMPANION_RENDER_FIXTURE__.world.characterAnimations[key]])), IDS);
  assert.deepEqual(bundled, configs, 'Compiled metadata must equal the final measured local metadata');
  for (const key of IDS) {
    const path = `public/assets/${configs[key].combat.file}`, response = await page.request.get(`${baseURL}/assets/${configs[key].combat.file}`);
    const sha256 = hash(await response.body()); assert.equal(response.status(), 200); assert.equal(sha256, sourceHashes[path]);
    report.servedAssets.push({ path, status: 200, sha256 });
  }
  for (const [pairIndex, pair] of [['garrus', 'wrex'], ['liara', 'tali'], ['ashley', 'kaidan']].entries()) {
    await page.evaluate(async ({ pair, pairIndex }) => {
      const [{ actorFor, ENEMIES }, { createBattle }, { newGame }, { initialCustomization }] = await Promise.all([
        import('/src/game-data.js'), import('/src/combat.js'), import('/src/state.js'), import('/src/customization.js')]);
      const f = window.__COMPANION_RENDER_FIXTURE__, appearance = pairIndex === 1 ? 'female' : 'male';
      f.state = newGame({ name: 'Fixture détachée', appearance }); f.beforeState = JSON.stringify(f.state); f.pair = pair;
      f.battle = createBattle({ party: ['shepard', ...pair].map(id => actorFor(id, f.state)),
        enemies: [{ ...ENEMIES.geth, id: 'fixture-target', hp: 1500, maxHp: 1500 }], mode: 'wait', seed: 2183 });
      f.world.setBattle(null); f.world.setCommanderAppearance(appearance);
      const custom = initialCustomization(appearance); custom.armor.primary = 'teal'; f.world.setCommanderCustomization(custom);
      f.world.setParty(['shepard', ...pair]); f.world.setBattle(f.battle); f.world.setMode('combat'); f.world.update(0);
      f.shepardMap = f.world.battleActors.get('shepard').body.material.map.uuid;
    }, { pair, pairIndex });
    await page.waitForFunction(() => { const w = window.__COMPANION_RENDER_FIXTURE__.world, a = w.zone.arena; return Math.abs(w.cameraTarget.x - Math.max(-9, Math.min(9, a.x * .48))) < .01 && Math.abs(w.cameraTarget.z - Math.max(-10, Math.min(10, a.z * .48))) < .01 && Math.abs(w.cameraTarget.y - .3) < .01; });
    for (const pose of ['aim', 'power', 'hit', 'down']) {
      await page.evaluate(({ pair, pose }) => {
        const f = window.__COMPANION_RENDER_FIXTURE__, w = f.world;
        for (const key of pair) { const native = f.battle.actors.find(a => a.id === key); native.hp = pose === 'down' ? 0 : native.maxHp; native.cover = false; }
        w.setBattle(f.battle); f.beforeRenderBattle = JSON.stringify(f.battle);
        for (const key of pair) {
          const actor = w.battleActors.get(key); actor.combatPoseTime = 0;
          if (pose === 'hit') w.playEvent({ type: 'damage', targetId: key });
          else if (pose !== 'down') w.playEvent({ type: 'action', actorId: key, actionId: pose === 'aim' ? 'shoot' : 'cover' });
          if (pose !== 'down') actor.combatPoseTime = 600;
        }
        w.update(0);
      }, { pair, pose });
      const metrics = await page.evaluate(async ({ pair, pose }) => {
        const f = window.__COMPANION_RENDER_FIXTURE__, w = f.world, Vector3 = w.camera.position.constructor;
        return pair.map(key => {
          const actor = w.battleActors.get(key), map = actor.body.material.map, frame = w.characterAnimations[key].combat.frames[pose], [x, y, width, height] = frame.rect;
          const p = actor.body.geometry.parameters; actor.body.updateWorldMatrix(true, false);
          const pivot = new Vector3((frame.pivot[0] / width - .5) * p.width, (.5 - frame.pivot[1] / height) * p.height, 0); actor.body.localToWorld(pivot);
          const anchor = actor.group.localToWorld(new Vector3(0, .05, 0)), projected = [];
          for (const sx of [-1, 1]) for (const sy of [-1, 1]) { const point = actor.body.localToWorld(new Vector3(sx * p.width / 2, sy * p.height / 2, 0)); point.project(w.camera); projected.push([(point.x * .5 + .5) * innerWidth, (-point.y * .5 + .5) * innerHeight]); }
          return { key, pose, frameId: actor.animationFrame, texture: map.image.src, textureUUID: map.uuid,
            rect: frame.rect, pivot: frame.pivot, repeat: map.repeat.toArray(), offset: map.offset.toArray(),
            atlas: { width: map.image.width, height: map.image.height }, relativeHeight: p.height * actor.body.scale.y / actor.height,
            groundAnchorError: pivot.distanceTo(anchor), rotationZ: actor.body.rotation.z, metadataMatches: map.userData.relayAnimationFrame?.id === frame.id,
            sourceAtlasUntouched: w.atlases[`combat-${key}`].repeat.x === 1 && w.atlases[`combat-${key}`].repeat.y === 1,
            sourceOffset: w.atlases[`combat-${key}`].offset.toArray(), sourceMapDistinct: map !== w.atlases[`combat-${key}`],
            projectedBounds: { left: Math.min(...projected.map(p => p[0])), top: Math.min(...projected.map(p => p[1])), right: Math.max(...projected.map(p => p[0])), bottom: Math.max(...projected.map(p => p[1])) },
            battleUnchanged: JSON.stringify(f.battle) === f.beforeRenderBattle, saveUnchanged: JSON.stringify(f.state) === f.beforeState,
            drawCalls: w.renderer.info.render.calls, triangles: w.renderer.info.render.triangles,
            shepardMapUnchanged: w.battleActors.get('shepard').body.material.map.uuid === f.shepardMap };
        });
      }, { pair, pose });
      for (const m of metrics) {
        const c = configs[m.key].combat, expected = c.frames[pose], [x, y, width, height] = expected.rect;
        assert.equal(m.frameId, expected.id); assert.equal(new URL(m.texture).pathname, `/assets/${c.file}`);
        assert.deepEqual(m.rect, expected.rect); assert.deepEqual(m.pivot, expected.pivot); assert.deepEqual(m.atlas, { width: c.width, height: c.height });
        close(m.repeat[0], width / c.width, 'UV width'); close(m.repeat[1], height / c.height, 'UV height'); close(m.offset[0], x / c.width, 'UV x'); close(m.offset[1], 1 - (y + height) / c.height, 'UV y');
        close(m.relativeHeight, expected.heightScale, 'relative height'); close(m.groundAnchorError, 0, 'ground anchor');
        assert.equal(m.rotationZ, 0); assert.equal(m.metadataMatches, true); assert.equal(m.sourceMapDistinct, true); assert.equal(m.sourceAtlasUntouched, true); assert.deepEqual(m.sourceOffset, [0, 0]);
        assert.equal(m.battleUnchanged, true); assert.equal(m.saveUnchanged, true); assert.equal(m.shepardMapUnchanged, true);
        assert.ok(m.drawCalls > 0 && m.triangles > 0); assert.ok(m.projectedBounds.left >= 0 && m.projectedBounds.right <= 1280 && m.projectedBounds.top >= 0 && m.projectedBounds.bottom <= 800);
      }
      assert.notEqual(metrics[0].textureUUID, metrics[1].textureUUID);
      const path = await capture(`${pair.join('-')}-${pose}`); report.cases.push(...metrics.map(item => ({ ...item, screenshot: path, passed: true })));
      console.log(JSON.stringify({ pair, pose, cases: report.cases.length, passed: true }));
    }
    const native = await page.evaluate(async pair => {
      const [{ actorFor, ENEMIES }, { createBattle, performAction }] = await Promise.all([import('/src/game-data.js'), import('/src/combat.js')]);
      const f = window.__COMPANION_RENDER_FIXTURE__, results = [];
      for (const key of pair) {
        const state = structuredClone(f.state); state.flags.spectre = true;
        const battle = createBattle({ party: ['shepard', ...pair].map(id => ({ ...actorFor(id, state), atb: 100, ...(id === key ? { hp: 1, shield: 0 } : {}) })),
          enemies: [{ ...ENEMIES.geth, id: 'native-fixture-target', attack: 500, atb: 100 }], seed: 41, mode: 'wait' });
        f.world.setBattle(battle);
        const damage = performAction(battle, { actorId: 'native-fixture-target', actionId: 'shoot', targetId: key });
        f.world.setBattle(battle); for (const event of damage.events) f.world.playEvent(event); f.world.update(0);
        const koFrame = f.world.battleActors.get(key).animationFrame;
        const revived = performAction(battle, { actorId: 'shepard', actionId: 'unity' }), afterAction = JSON.stringify(battle);
        f.world.setBattle(battle); for (const event of revived.events) f.world.playEvent(event); f.world.update(0);
        results.push({ key, damageOK: damage.ok, damageEvents: damage.events.map(e => e.type), koFrame, reviveOK: revived.ok,
          revivalEvent: revived.events.some(e => e.type === 'revive' && e.targetId === key), aliveFrame: f.world.battleActors.get(key).animationFrame,
          battleUnchangedByRender: afterAction === JSON.stringify(battle), powersUnchanged: JSON.stringify(battle.actors.find(a => a.id === key).powers) === JSON.stringify(actorFor(key, state).powers) });
      }
      return results;
    }, pair);
    for (const result of native) { assert.equal(result.damageOK, true); assert.equal(result.koFrame, `${result.key}-combat-down`); assert.equal(result.reviveOK, true); assert.equal(result.revivalEvent, true); assert.equal(result.aliveFrame, `${result.key}-combat-aim`); assert.equal(result.battleUnchangedByRender, true); assert.equal(result.powersUnchanged, true); }
    report.nativeEvents.push(...native);
    const priority = await page.evaluate(pair => {
      const f = window.__COMPANION_RENDER_FIXTURE__, w = f.world; w.setBattle(f.battle);
      const result = [];
      for (const key of pair) {
        const actor = f.battle.actors.find(a => a.id === key); actor.hp = actor.maxHp; w.setBattle(f.battle);
        w.playEvent({ type: 'damage', targetId: key }); w.playEvent({ type: 'action', actorId: key, actionId: 'shoot' }); w.update(0);
        const impactFrame = w.battleActors.get(key).animationFrame;
        actor.hp = 0; w.setBattle(f.battle); w.playEvent({ type: 'action', actorId: key, actionId: 'cover' }); w.update(0);
        result.push({ key, impactFrame, downFrame: w.battleActors.get(key).animationFrame }); actor.hp = actor.maxHp;
      }
      w.setBattle(f.battle); w.update(0); return result;
    }, pair);
    for (const result of priority) { assert.equal(result.impactFrame, `${result.key}-combat-hit`); assert.equal(result.downFrame, `${result.key}-combat-down`); }
    report.priorities.push(...priority);
    const exploration = await page.evaluate(pair => {
      const f = window.__COMPANION_RENDER_FIXTURE__, w = f.world; w.setBattle(null); w.setMode('explore'); w.update(0);
      return pair.map(key => { const a = w.actors.find(a => a.id === key); return { key, frame: a.animationFrame ?? null, texture: a.body.material.map.image.src, battleActors: w.battleActors.size, saveUnchanged: JSON.stringify(f.state) === f.beforeState }; });
    }, pair);
    for (const result of exploration) { assert.equal(result.frame, null); assert.equal(new URL(result.texture).pathname, '/assets/crew-atlas.png'); assert.equal(result.battleActors, 0); assert.equal(result.saveUnchanged, true); }
    report.exploration.push(...exploration); await capture(`${pair.join('-')}-exploration`);
  }
  report.scopeClosures = await page.evaluate(async () => {
    const [{ createBattle }, { actorFor }] = await Promise.all([import('/src/combat.js'), import('/src/game-data.js')]);
    const f = window.__COMPANION_RENDER_FIXTURE__, states = [
      { id: 'ME3-CHR-GARRUS', sprite: 'garrus', mediaId: 'ME3' }, { id: 'garrus', sprite: 'garrus', mediaId: 'ME3' },
      { id: 'tali', sprite: 'tali', periodId: 'me2' }, { id: 'liara', sprite: 'tali', mediaId: 'ME1' },
    ];
    return states.map(fields => {
      const battle = createBattle({ party: [{ ...actorFor('garrus', f.state), ...fields }], enemies: [{ id: 'scope-target', sprite: 'geth', hp: 1000 }], mode: 'wait', seed: 17 });
      f.world.setBattle(battle); f.world.setMode('combat'); f.world.update(0); const actor = f.world.battleActors.get(fields.id);
      return { ...fields, frame: actor.animationFrame ?? null, sourceIsCrew: actor.body.material.map.image.src?.endsWith('/assets/crew-atlas.png') === true };
    });
  });
  assert.ok(report.scopeClosures.every(item => item.frame === null && item.sourceIsCrew));
  report.assetErrors = await page.evaluate(() => window.__COMPANION_RENDER_FIXTURE__.world.assetErrors);
  const final = await page.evaluate(() => {
    const f = window.__COMPANION_RENDER_FIXTURE__; cancelAnimationFrame(f.frame); f.world.dispose(); f.container.remove(); delete window.__COMPANION_RENDER_FIXTURE__;
    return { state: window.__RELAY_TEST__.getState(), storage: Object.fromEntries(Object.keys(localStorage).sort().map(key => [key, localStorage.getItem(key)])) };
  });
  assert.deepEqual(final, report.appBefore); report.applicationPreserved = true;
  assert.equal(report.cases.length, 24); assert.equal(report.nativeEvents.length, 6); assert.equal(report.captureArtifacts.length, 15);
  assert.deepEqual(report.assetErrors, []); assert.deepEqual(report.errors, []); assert.deepEqual(report.failedRequests, []);
  for (const [path, expected] of Object.entries(sourceHashes)) assert.equal(hash(await readFile(new URL(path, root))), expected, `${path}: frozen during the full fixture`);
  report.passed = true;
} catch (error) {
  report.failure = error.stack || String(error); if (page) await capture('failure').catch(() => {}); process.exitCode = 1; console.error(error);
} finally {
  await browser?.close(); const content = JSON.stringify(report, null, 2) + '\n';
  for (const path of [`test-results/${prefix}-report.json`, `docs/qa/${prefix}-report.json`]) await writeFile(new URL(path, root), content);
  console.log(JSON.stringify({ passed: report.passed, cases: report.cases.length, captures: report.captureArtifacts.length, reportSHA256: hash(content) }));
}
