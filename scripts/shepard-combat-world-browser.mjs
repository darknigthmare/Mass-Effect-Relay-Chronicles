import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const baseURL = process.env.GAME_URL || 'http://127.0.0.1:4190';
const root = new URL('../', import.meta.url), out = new URL('../test-results/', import.meta.url);
const prefix = 'shepard-combat-world';
await mkdir(out, { recursive: true });
const configs = Object.fromEntries(await Promise.all(['male', 'female'].map(async appearance => [appearance, JSON.parse(await readFile(new URL(`public/assets/shepard-${appearance}-animation.json`, root), 'utf8'))])));
const hash = data => createHash('sha256').update(data).digest('hex');
const sourcePaths = ['src/world.js', 'src/customization-render.js', 'vite.config.js', 'scripts/shepard-combat-world-browser.mjs', ...['male', 'female'].flatMap(appearance => [`public/assets/shepard-${appearance}-animation.json`, `public/assets/shepard-${appearance}-combat-atlas.png`])];
const sourceHashes = Object.fromEntries(await Promise.all(sourcePaths.map(async path => [path, hash(await readFile(new URL(path, root)))])));
const report = {
  schemaVersion: 1, at: new Date().toISOString(), passed: false,
  scope: 'Scène de rendu isolée sur le vrai WorldView en développement. Combat créé par createBattle, événements transmis au renderer, poses maintenues pour les captures et PV de la fixture mis à zéro pour le KO. Apparence et couleurs modifiées sur le renderer seul. Aucun parcours complet, victoire, équilibrage, contrôle de sauvegarde, build de production ou certification de fidélité artistique.',
  sourceHead: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: fileURLToPath(root), encoding: 'utf8' }).trim(),
  sourceHashes, url: baseURL, buildKind: 'vite-development', viewport: { width: 1280, height: 800, deviceScaleFactor: 1 },
  node: process.version, playwright: JSON.parse(await readFile(new URL('node_modules/playwright/package.json', root), 'utf8')).version,
  cases: [], servedAssets: [], errors: [], failedRequests: [],
};
const browser = await chromium.launch({ headless: true,
  executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || '/tmp/chromium',
  args: ['--no-sandbox', '--no-zygote', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
report.chromium = browser.version();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
page.setDefaultTimeout(60000);
page.on('pageerror', error => report.errors.push(error.message));
page.on('requestfailed', request => report.failedRequests.push(`${request.url()}: ${request.failure()?.errorText}`));
page.on('response', response => { if (response.status() >= 400) report.failedRequests.push(`${response.status()} ${response.url()}`); });
const close = (actual, expected, label) => assert.ok(Math.abs(actual - expected) < 1e-8, `${label}: ${actual} != ${expected}`);
try {
  await page.goto(`${baseURL}/?qa`, { waitUntil: 'networkidle' });
  await page.evaluate(() => window.__RELAY_TEST__.begin({ name: 'Fixture poses Shepard', appearance: 'male' }));
  await page.getByRole('button', { name: 'Je rejoins le briefing.' }).click();
  await page.waitForFunction(() => {
    const qa = window.__RELAY_TEST__, world = qa.getWorld();
    return !qa.getUI().busy && world.atlases['combat-shepard'] && world.atlases['combat-femshep'];
  });
  const bundledConfigs = await page.evaluate(() => {
    const configs = window.__RELAY_TEST__.getWorld().characterAnimations;
    return { male: configs.shepard, female: configs.femshep };
  });
  assert.deepEqual(bundledConfigs, configs, 'bundled metadata must match the definitive local JSON files');
  for (const appearance of ['male', 'female']) {
    const path = `public/assets/${configs[appearance].combat.file}`;
    const response = await page.request.get(`${baseURL}/assets/${configs[appearance].combat.file}`);
    const actualHash = hash(await response.body());
    assert.equal(response.status(), 200); assert.equal(actualHash, sourceHashes[path]);
    report.servedAssets.push({ path, status: response.status(), sha256: actualHash });
  }
  const initial = await page.evaluate(async () => {
    const { createBattle } = await import('/src/combat.js');
    const { actorFor, ENEMIES } = await import('/src/game-data.js');
    const qa = window.__RELAY_TEST__, state = qa.getState(), world = qa.getWorld();
    const battle = createBattle({ party: state.party.map(id => actorFor(id, state)), enemies: [{ ...ENEMIES.geth, id: 'pose-geth' }], difficulty: 'normal', mode: 'wait', seed: 2183, medigel: state.medigel });
    window.__SHEPARD_COMBAT_WORLD_FIXTURE__ = { battle, colors: {} };
    world.setBattle(battle); world.setMode('combat'); world.update(0);
    return { appearance: state.appearance, customization: state.customization, inventory: state.inventory, credits: state.credits, xp: state.xp, medigel: state.medigel, party: state.party, cleared: state.cleared, lost: state.lost, completed: state.completed };
  });
  await page.waitForFunction(() => {
    const world = window.__RELAY_TEST__.getWorld(), arena = world.zone.arena;
    return Math.abs(world.cameraTarget.x - Math.max(-9, Math.min(9, arena.x * .48))) < .01
      && Math.abs(world.cameraTarget.z - Math.max(-10, Math.min(10, arena.z * .48))) < .01
      && Math.abs(world.cameraTarget.y - .3) < .01;
  });
  const cases = ['male', 'female'].flatMap(appearance => [
    ...['aim', 'power', 'hit', 'down'].map(pose => ({ appearance, pose, variant: 'default' })),
    { appearance, pose: 'down', variant: 'colors' }, { appearance, pose: 'down', variant: 'helmet' },
  ]);
  for (const item of cases) {
    await page.evaluate(async ({ appearance, pose, variant }) => {
      const { initialCustomization } = await import('/src/customization.js');
      const world = window.__RELAY_TEST__.getWorld(), fixture = window.__SHEPARD_COMBAT_WORLD_FIXTURE__;
      world.setCommanderAppearance(appearance);
      const custom = initialCustomization(appearance);
      if (variant !== 'default') { custom.armor.primary = 'teal'; custom.face.skinTone = 'deep'; custom.face.hairColor = 'white'; }
      if (variant === 'helmet') custom.armor.helmet = 'combat';
      world.setCommanderCustomization(custom);
      const commander = fixture.battle.actors.find(actor => actor.id === 'shepard');
      commander.hp = pose === 'down' ? 0 : commander.maxHp; commander.cover = false;
      world.setBattle(fixture.battle);
      const actor = world.battleActors.get('shepard');
      actor.combatPoseTime = 0;
      if (pose === 'hit') world.playEvent({ type: 'damage', targetId: 'shepard' });
      else if (pose !== 'down') world.playEvent({ type: 'action', actorId: 'shepard', actionId: pose === 'power' ? 'warp' : 'shoot', targetId: 'pose-geth' });
      if (pose !== 'down') actor.combatPoseTime = 600;
      world.update(0);
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    }, item);
    const metrics = await page.evaluate(({ appearance, pose, variant }) => {
      const world = window.__RELAY_TEST__.getWorld(), fixture = window.__SHEPARD_COMBAT_WORLD_FIXTURE__;
      const actor = world.battleActors.get('shepard'), map = actor.body.material.map, source = map.userData.relayCustomizationSource || map;
      const frame = world.characterAnimations[actor.key].combat.frames[pose], [x, y, width, height] = frame.rect;
      const sourceCanvas = document.createElement('canvas'); sourceCanvas.width = width; sourceCanvas.height = height;
      const context = sourceCanvas.getContext('2d', { willReadFrequently: true }); context.drawImage(source.image, x, y, width, height, 0, 0, width, height);
      const original = context.getImageData(0, 0, width, height).data;
      const displayed = map.isCanvasTexture ? map.image.getContext('2d').getImageData(0, 0, width, height).data : original;
      const counts = { alphaChanged: 0, changedInHead: 0, changedOutsideHead: 0, helmetChangedInHead: 0, helmetChangedOutsideHead: 0, visorPixels: 0, visorAxisMin: 1, visorAxisMax: 0 };
      const [hx, hy, hw, hh] = frame.headRegion, colors = fixture.colors[appearance];
      for (let row = 0; row < height; row++) for (let col = 0; col < width; col++) {
        const i = (row * width + col) * 4, u = col / width, v = row / height;
        if (original[i + 3] !== displayed[i + 3]) counts.alphaChanged++;
        const inHead = u >= hx && u < hx + hw && v >= hy && v < hy + hh;
        const changed = original[i] !== displayed[i] || original[i + 1] !== displayed[i + 1] || original[i + 2] !== displayed[i + 2];
        if (changed) counts[inHead ? 'changedInHead' : 'changedOutsideHead']++;
        if (variant === 'helmet' && colors) {
          const helmetChanged = colors[i] !== displayed[i] || colors[i + 1] !== displayed[i + 1] || colors[i + 2] !== displayed[i + 2];
          if (helmetChanged) counts[inHead ? 'helmetChangedInHead' : 'helmetChangedOutsideHead']++;
          // Match the authored visor cyan, allowing one 8-bit step from canvas alpha rounding; a teal shell is not the visor.
          if (helmetChanged && inHead && Math.abs(displayed[i] - 94) <= 1 && Math.abs(displayed[i + 1] - 215) <= 1 && Math.abs(displayed[i + 2] - 227) <= 1) {
            const axis = frame.headAxis === 'x' ? (u - hx) / hw : (v - hy) / hh;
            counts.visorPixels++; counts.visorAxisMin = Math.min(counts.visorAxisMin, axis); counts.visorAxisMax = Math.max(counts.visorAxisMax, axis);
          }
        }
      }
      if (variant === 'colors') fixture.colors[appearance] = new Uint8ClampedArray(displayed);
      actor.body.updateWorldMatrix(true, false);
      const parameters = actor.body.geometry.parameters;
      const pivot = actor.body.position.clone().set((frame.pivot[0] / width - .5) * parameters.width, (.5 - frame.pivot[1] / height) * parameters.height, 0);
      actor.body.localToWorld(pivot);
      const expectedAnchor = actor.group.position.clone().set(0, .05, 0); actor.group.localToWorld(expectedAnchor);
      const bounds = actor.body.position.clone(), projected = [];
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
        bounds.set(sx * parameters.width / 2, sy * parameters.height / 2, 0);
        actor.body.localToWorld(bounds); bounds.project(world.camera);
        projected.push([(bounds.x * .5 + .5) * innerWidth, (-bounds.y * .5 + .5) * innerHeight]);
      }
      return { appearance, pose, variant, key: actor.key, frameId: actor.animationFrame, texture: source.image.src,
        rect: frame.rect, pivot: frame.pivot, repeat: source.repeat.toArray(), offset: source.offset.toArray(),
        atlas: { width: source.image.width, height: source.image.height },
        heightScale: parameters.height * actor.body.scale.y / actor.height,
        displayWidth: parameters.width * actor.body.scale.x, displayHeight: parameters.height * actor.body.scale.y,
        rotationZ: actor.body.rotation.z, groundAnchorError: pivot.distanceTo(expectedAnchor), headRegion: frame.headRegion, headAxis: frame.headAxis,
        metadataMatchesFrame: source.userData.relayAnimationFrame?.id === frame.id,
        tintCanvas: !!map.isCanvasTexture, textureRepeat: map.repeat.toArray(), textureOffset: map.offset.toArray(),
        projectedBounds: { left: Math.min(...projected.map(p => p[0])), top: Math.min(...projected.map(p => p[1])), right: Math.max(...projected.map(p => p[0])), bottom: Math.max(...projected.map(p => p[1])) },
        pixels: counts, nativeTexturePNG: variant === 'helmet' && map.isCanvasTexture ? map.image.toDataURL('image/png') : null,
        drawCalls: world.renderer.info.render.calls, triangles: world.renderer.info.render.triangles };
    }, item);
    const nativeTexturePNG = metrics.nativeTexturePNG; delete metrics.nativeTexturePNG;
    if (nativeTexturePNG) {
      metrics.nativeTexture = `${prefix}-${item.appearance}-down-helmet-texture.png`;
      await writeFile(new URL(metrics.nativeTexture, out), Buffer.from(nativeTexturePNG.split(',')[1], 'base64'));
    }
    report.currentCase = metrics;
    const expected = configs[item.appearance].combat.frames[item.pose], config = configs[item.appearance].combat;
    assert.equal(metrics.key, item.appearance === 'male' ? 'shepard' : 'femshep'); assert.equal(metrics.frameId, expected.id);
    assert.equal(new URL(metrics.texture).pathname, `/assets/${config.file}`);
    assert.deepEqual(metrics.rect, expected.rect); assert.deepEqual(metrics.pivot, expected.pivot);
    assert.deepEqual(metrics.headRegion, expected.headRegion); assert.equal(metrics.headAxis, expected.headAxis);
    assert.equal(metrics.metadataMatchesFrame, true); assert.deepEqual(metrics.atlas, { width: config.width, height: config.height });
    const [x, y, w, h] = expected.rect;
    close(metrics.repeat[0], w / config.width, 'UV width'); close(metrics.repeat[1], h / config.height, 'UV height');
    close(metrics.offset[0], x / config.width, 'UV x'); close(metrics.offset[1], 1 - (y + h) / config.height, 'UV y');
    close(metrics.heightScale, expected.heightScale, 'relative height'); close(metrics.groundAnchorError, 0, 'ground anchor');
    assert.equal(metrics.rotationZ, 0); assert.ok(metrics.drawCalls > 0 && metrics.triangles > 0);
    assert.ok(metrics.projectedBounds.left >= 0 && metrics.projectedBounds.right <= 1280 && metrics.projectedBounds.top >= 0 && metrics.projectedBounds.bottom <= 800, 'complete sprite plane remains in the actual viewport');
    assert.equal(metrics.pixels.alphaChanged, 0);
    if (item.variant !== 'default') {
      assert.equal(metrics.tintCanvas, true); assert.deepEqual(metrics.textureRepeat, [1, 1]); assert.deepEqual(metrics.textureOffset, [0, 0]);
      assert.ok(metrics.pixels.changedInHead > 0 && metrics.pixels.changedOutsideHead > 0, 'both head colours and armour colours reach the actual KO texture');
    }
    if (item.variant === 'helmet') {
      assert.equal(metrics.headAxis, 'x'); assert.ok(metrics.pixels.helmetChangedInHead > 0); assert.equal(metrics.pixels.helmetChangedOutsideHead, 0);
      assert.ok(metrics.pixels.visorPixels > 0, 'the visible cyan fringe remains inside the declared head region; artistic eye alignment is a separate review');
    }
    const label = `${item.appearance}-${item.pose}${item.variant === 'default' ? '' : `-${item.variant}`}`;
    const screenshot = `${prefix}-${label}.png`;
    await page.screenshot({ path: fileURLToPath(new URL(screenshot, out)) });
    report.cases.push({ ...metrics, screenshot, passed: true });
    console.log(JSON.stringify({ case: label, passed: true, heightScale: metrics.heightScale, groundAnchorError: metrics.groundAnchorError }));
  }
  const final = await page.evaluate(() => {
    const qa = window.__RELAY_TEST__, state = qa.getState(), world = qa.getWorld();
    world.setBattle(null); world.setCommanderAppearance(state.appearance); world.setCommanderCustomization(state.customization); world.setMode('explore'); world.update(0);
    delete window.__SHEPARD_COMBAT_WORLD_FIXTURE__;
    return { appearance: state.appearance, customization: state.customization, inventory: state.inventory, credits: state.credits, xp: state.xp, medigel: state.medigel, party: state.party, cleared: state.cleared, lost: state.lost, completed: state.completed };
  });
  assert.deepEqual(final, initial, 'isolated render fixtures preserve the actual campaign identity, equipment, resources and progression');
  report.campaignPreserved = true;
  report.assetErrors = await page.evaluate(() => window.__RELAY_TEST__.getWorld().assetErrors || []);
  assert.deepEqual(report.assetErrors, []); assert.deepEqual(report.errors, []); assert.deepEqual(report.failedRequests, []);
  report.helmetLimit = 'Le casque est une recoloration heuristique de la silhouette et des cheveux existants. La frange cyan est bornée à la tête et l’alpha est conservé ; son alignement artistique sur les yeux, notamment avec les cheveux longs, n’est pas certifié. Les textures natives sont des sorties réelles du renderer, distinctes de l’échelle terrain des captures.';
  delete report.currentCase;
  report.passed = true;
} catch (error) {
  report.failure = error.stack || String(error);
  await page.screenshot({ path: fileURLToPath(new URL(`${prefix}-failure.png`, out)) }).catch(() => {});
  throw error;
} finally {
  await browser.close();
  await writeFile(new URL(`${prefix}-report.json`, out), `${JSON.stringify(report, null, 2)}\n`);
}
