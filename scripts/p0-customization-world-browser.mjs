import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { newGame, encodeSave } from '../src/state.js';

const root = new URL('../', import.meta.url);
const out = new URL('test-results/p0-customization-world/', root);
const url = new URL(process.env.GAME_URL || 'http://127.0.0.1:4267/');
url.searchParams.set('qa', '1');
await mkdir(out, { recursive: true });
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const sources = ['src/world.js', 'src/customization-render.js', 'scripts/p0-customization-world-browser.mjs',
  'public/assets/shepard-walk-atlas.png', 'public/assets/shepard-female-walk-atlas.png',
  ...['male', 'female'].flatMap(appearance => [`public/assets/shepard-${appearance}-animation.json`, `public/assets/shepard-${appearance}-combat-atlas.png`])];
const hashes = async () => Object.fromEntries(await Promise.all(sources.map(async file => [file, sha(await readFile(new URL(file, root)))])));
const report = {
  at: new Date().toISOString(), passed: false,
  baseCommit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  sourceHashes: await hashes(), appearances: [], errors: [], captures: [],
  scope: 'Isolated development renderer fixture in Chromium. Scene motion is stepped deterministically. An isolated battle feeds aim, power, hit and down events to WorldView. This checks texture pixels, pivots and motion continuity, separate from public combat or campaign progression.',
};
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || '/usr/bin/chromium', headless: true,
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.setDefaultTimeout(45_000);
  page.on('pageerror', error => report.errors.push(error.message));
  await page.goto(url.href, { waitUntil: 'domcontentloaded' });
  const fixture = newGame({ name: 'QA palette du terrain' });
  fixture.settings.sound = false;
  fixture.settings.reducedMotion = true;
  const chooser = page.waitForEvent('filechooser');
  await page.locator('[data-do="import"]').click();
  await (await chooser).setFiles({ name: 'qa-palette-renderer.json', mimeType: 'application/json', buffer: Buffer.from(encodeSave(fixture)) });
  await page.waitForFunction(() => {
    const world = window.__RELAY_TEST__?.getWorld();
    return world.zoneId === 'normandy' && !window.__RELAY_TEST__.getUI().busy
      && ['walk', 'motion-femshep', 'combat-shepard', 'combat-femshep'].every(key => world.atlases[key]);
  });
  for (const appearance of ['male', 'female']) {
    const result = await page.evaluate(async appearance => {
      const { initialCustomization } = await import('/src/customization.js');
      const { createBattle } = await import('/src/combat.js');
      const qa = window.__RELAY_TEST__, world = qa.getWorld();
      const options = initialCustomization(appearance);
      Object.assign(options.armor, { primary: 'teal', secondary: 'silver', accent: 'purple', pattern: 'stripe', helmet: 'combat' });
      world.setCommanderAppearance(appearance);
      world.setCommanderCustomization(options);
      world.setMode('explore');
      const step = () => world.update(.05, { render: false });
      const fieldActor = () => world.actors.find(actor => actor.id === 'shepard');
      const stepAndFrame = () => { step(); return frame(fieldActor()); };
      function frame(actor) {
        const map = actor.body.material.map, source = map.userData.relayCustomizationSource;
        return {
          id: actor.animationFrame, direction: actor.walkDirection, tinted: Boolean(source && map.isCanvasTexture),
          uv: source?.offset.toArray(), actorHeight: actor.height,
        };
      }
      function copyFrame(actor) {
        const { image } = actor.body.material.map;
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        canvas.getContext('2d').drawImage(image, 0, 0);
        return { image: canvas };
      }
      function pixels(actor, metadata, reference) {
        const map = actor.body.material.map;
        const canvas = map.image;
        const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
        const prior = reference?.image.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
        let teal = 0, visor = 0, changedHead = 0, changedOutside = 0, alphaChanged = 0;
        for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {
          const i = (y * canvas.width + x) * 4;
          if (prior && data[i + 3] !== prior[i + 3]) alphaChanged++;
          if (data[i + 3] < 100) continue;
          const r = data[i], g = data[i + 1], b = data[i + 2];
          if (g > r * 1.3 && b > r * 1.3) teal++;
          if (r >= 90 && r <= 98 && g >= 210 && b >= 222) visor++;
          if (prior && (r !== prior[i] || g !== prior[i + 1] || b !== prior[i + 2])) {
            const [left, top, width, height] = metadata.headRegion;
            if (x / canvas.width >= left && x / canvas.width < left + width && y / canvas.height >= top && y / canvas.height < top + height) changedHead++;
            else changedOutside++;
          }
        }
        return { teal, visor, changedHead, changedOutside, alphaChanged };
      }
      const walking = [];
      const fieldHelmetAndPattern = [];
      const fieldHead = { headRegion: [0, 0, 1, .25] };
      const visibleHelmet = { ...options, armor: { ...options.armor, helmet: 'visible' } };
      const classicPattern = { ...options, armor: { ...options.armor, pattern: 'classic' } };
      for (const sprint of [false, true]) for (const [direction, key] of [['front', 'KeyS'], ['back', 'KeyW'], ['right', 'KeyD'], ['left', 'KeyA']]) {
        world.setPosition({ x: 0, z: 7 });
        const start = world.getPosition();
        world.keys.add(key);
        if (sprint) world.keys.add('ShiftLeft');
        const samples = Array.from({ length: 14 }, () => {
          const observed = stepAndFrame();
          return { ...observed, teal: pixels(fieldActor()).teal };
        });
        world.keys.clear(); const end = world.getPosition();
        const idle = { ...stepAndFrame(), ...pixels(fieldActor()) };
        walking.push({
          direction, sprint, moved: Math.hypot(end.x - start.x, end.z - start.z), idle,
          samples: samples.length, tinted: samples.every(frame => frame.tinted && frame.direction === direction),
          frames: new Set(samples.map(frame => JSON.stringify(frame.uv))).size,
          minTeal: Math.min(...samples.map(frame => frame.teal)),
        });
        if (!sprint) {
          const field = fieldActor(), original = copyFrame(field);
          world.setCommanderCustomization(visibleHelmet);
          const helmet = pixels(field, fieldHead, original);
          world.setCommanderCustomization(classicPattern);
          const pattern = pixels(field, fieldHead, original);
          world.setCommanderCustomization(options);
          fieldHelmetAndPattern.push({ direction, helmet, pattern });
        }
      }
      const fieldBefore = pixels(fieldActor());
      const companionsBefore = world.actors.filter(actor => actor.id !== 'shepard').map(actor => ({ id: actor.id, uuid: actor.body.material.map.uuid }));
      const battle = createBattle({
        party: [{ id: 'shepard', hp: 250, shield: 50 }, { id: 'kaidan', hp: 220, shield: 50 }],
        enemies: [{ id: 'fixture-target', sprite: 'geth', hp: 200 }],
      });
      world.setBattle(battle);
      world.setMode('combat');
      const battleActor = () => world.battleActors.get('shepard');
      const combat = [];
      for (const pose of ['aim', 'power', 'hit', 'down']) {
        const bare = structuredClone(options);
        bare.armor.helmet = 'hidden';
        world.setCommanderCustomization(bare);
        if (pose === 'down') {
          battle.actors[0].hp = 0;
          world.setBattle(battle);
        } else if (pose === 'hit') world.playEvent({ type: 'damage', targetId: 'shepard' });
        else world.playEvent({ type: 'action', actorId: 'shepard', targetId: 'fixture-target', actionId: pose === 'aim' ? 'shoot' : 'warp' });
        step();
        const actor = battleActor(), bareFrame = copyFrame(actor);
        const metadata = world.characterAnimations[actor.key].combat.frames[pose];
        world.setCommanderCustomization(options);
        step();
        const [, , width, height] = metadata.rect;
        const size = actor.body.geometry.parameters;
        const anchor = actor.body.position.clone().set((metadata.pivot[0] / width - .5) * size.width, (.5 - metadata.pivot[1] / height) * size.height, 0);
        const ground = actor.group.position.clone().set(0, .05, 0);
        actor.body.localToWorld(anchor);
        actor.group.localToWorld(ground);
        const full = { ...frame(actor), ...pixels(actor, metadata, bareFrame) };
        const stripe = copyFrame(actor);
        world.setCommanderCustomization(classicPattern);
        const pattern = pixels(actor, metadata, stripe);
        world.setCommanderCustomization(options);
        combat.push({
          ...full, pose, expected: metadata.id, headAxis: metadata.headAxis, pattern,
          anchorError: anchor.distanceTo(ground), heightScale: size.height * actor.body.scale.y / actor.height, expectedHeightScale: metadata.heightScale,
        });
      }
      const combatCompanionUntinted = !world.battleActors.get('kaidan').body.material.map.userData.relayCustomizationSource;
      world.setBattle(null); world.setMode('explore'); step();
      const companionPreserved = companionsBefore.every(({ id, uuid }) => world.actors.find(actor => actor.id === id).body.material.map.uuid === uuid);
      world.update(0);
      return { appearance, walking, fieldHelmetAndPattern, combat, fieldBefore, fieldReturn: pixels(fieldActor()), combatCompanionUntinted, companionPreserved, diagnostics: world.assetErrors };
    }, appearance);
    for (const route of result.walking) {
      assert.ok(route.moved > 1, JSON.stringify({ appearance, route }));
      assert.ok(route.tinted && route.minTeal > 0);
      assert.equal(route.idle.tinted, true);
      assert.ok(route.idle.teal > 0);
      assert.equal(route.idle.visor, 0);
      assert.equal(route.idle.direction, route.direction);
      assert.equal(route.frames, 4);
    }
    for (const { direction, helmet, pattern } of result.fieldHelmetAndPattern) {
      assert.ok(helmet.changedHead > 0 && helmet.changedOutside === 0 && helmet.alphaChanged === 0, JSON.stringify({ appearance, direction, helmet }));
      assert.equal(helmet.visor === 0, direction === 'back', JSON.stringify({ appearance, direction, helmet }));
      assert.ok(pattern.changedOutside > 0 && pattern.alphaChanged === 0, JSON.stringify({ appearance, direction, pattern }));
    }
    for (const pose of result.combat) {
      assert.ok(pose.tinted && pose.id === pose.expected);
      assert.ok(pose.anchorError < 1e-8);
      assert.ok(Math.abs(pose.heightScale - pose.expectedHeightScale) < 1e-8);
      assert.ok(pose.teal > 0 && pose.visor > 0 && pose.changedHead > 0);
      assert.equal(pose.changedOutside, 0);
      assert.equal(pose.alphaChanged, 0);
      assert.ok(pose.pattern.changedOutside > 0 && pose.pattern.alphaChanged === 0, JSON.stringify({ appearance, pose }));
      if (pose.pose === 'down') assert.equal(pose.headAxis, 'x');
    }
    assert.ok(result.combatCompanionUntinted && result.companionPreserved);
    assert.deepEqual(result.fieldReturn, result.fieldBefore);
    report.appearances.push(result);
    const clip = await page.evaluate(() => {
      const world = window.__RELAY_TEST__.getWorld();
      const actor = world.actors.find(actor => actor.id === 'shepard');
      const center = actor.body.getWorldPosition(actor.group.position.clone()).project(world.camera);
      return {
        x: Math.min(innerWidth - 160, Math.max(0, Math.round((center.x + 1) * innerWidth / 2 - 80))),
        y: Math.min(innerHeight - 180, Math.max(0, Math.round((1 - center.y) * innerHeight / 2 - 90))),
        width: 160, height: 180,
      };
    });
    const file = `palette-${appearance}-retour-terrain.png`;
    const bytes = await page.screenshot({ path: new URL(file, out).pathname, clip, animations: 'disabled' });
    report.captures.push({ path: file, sha256: sha(bytes) });
  }
  assert.deepEqual(report.errors, []);
  assert.deepEqual(await hashes(), report.sourceHashes);
  report.passed = true;
} catch (error) {
  report.failure = String(error.stack || error);
  throw error;
} finally {
  await browser.close();
  await writeFile(new URL('report.json', out), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ passed: report.passed, appearances: report.appearances.length, report: new URL('report.json', out).pathname }));
}
