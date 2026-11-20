import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';

const url = new URL(process.env.GAME_URL || 'http://127.0.0.1:4219/');
const output = process.env.P0_SCALE_OUTPUT || 'test-results/p0-sprite-scale';
const report = { passed: false, at: new Date().toISOString(), captures: [], errors: [] };
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || '/usr/bin/chromium',
  headless: true, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
try {
  const page = await browser.newPage({ viewport: { width: 1160, height: 800 } });
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('requestfailed', request => report.errors.push(`${request.url()}: ${request.failure()?.errorText}`));
  const threeImport = (await (await fetch(new URL('src/world.js', url))).text()).match(/from "([^"]*three\.js[^"]*)"/)?.[1];
  assert.ok(threeImport, 'Use a Vite development server.');
  const harness = new URL('__p0-sprite-scale__', url);
  await page.route(harness.href, route => route.fulfill({ contentType: 'text/html', body: `<!doctype html>
    <html lang="fr"><meta charset="utf-8"><link rel="icon" href="data:,"><style>body{margin:0}#terrain{position:relative;width:100vw;height:100vh}</style>
    <div id="terrain"></div><script type="module">
      import * as THREE from ${JSON.stringify(new URL(threeImport, url).href)};
      import { WorldView } from '/src/world.js';
      import { withSpriteAlpha } from '/src/world-sprite-alpha.js';
      import { ENEMIES, actorFor } from '/src/game-data.js';
      import { getLevelLayout } from '/src/level-layout-data.js';
      import { createBattle } from '/src/combat.js';
      import { newGame } from '/src/state.js';
      const world = new WorldView(document.querySelector('#terrain'));
      const families = [['shepard','shepard-male'],['garrus','companion-garrus'],['wrex','companion-wrex'],['geth-destroyer','enemy-geth-destroyer']];
      await Promise.all(families.map(async ([key,file]) => world.registerCharacterAnimation(key, await fetch('/assets/'+file+'-animation.json').then(response => response.json()))));
      window.scaleTest = { THREE, world, withSpriteAlpha, ENEMIES, actorFor, getLevelLayout, createBattle, newGame, families };
    </script></html>` }));
  await page.goto(harness.href);
  await page.waitForFunction(() => window.scaleTest?.world.atlases.crew
    && window.scaleTest.families.every(([key]) => window.scaleTest.world.atlases['combat-' + key]));
  const capture = async label => {
    const path = join(output, label + '.png');
    const bytes = await page.screenshot({ path });
    report.captures.push({ label, path, sha256: createHash('sha256').update(bytes).digest('hex') });
  };
  report.measurements = await page.evaluate(() => {
    const { THREE, world, ENEMIES, actorFor, getLevelLayout, createBattle, newGame } = window.scaleTest;
    const alphaBounds = map => {
      const { width: atlasW, height: atlasH } = map.image;
      const width = Math.round(map.repeat.x * atlasW), height = Math.round(map.repeat.y * atlasH);
      const x = Math.round(map.offset.x * atlasW), y = Math.round((1 - map.offset.y - map.repeat.y) * atlasH);
      const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      context.drawImage(map.image, x, y, width, height, 0, 0, width, height);
      const pixels = context.getImageData(0, 0, width, height).data;
      let xmin = width, xmax = 0, ymin = height, ymax = 0, count = 0;
      for (let i = 0; i < width * height; i++) if (pixels[i * 4 + 3] >= 51) {
        const x = i % width, y = Math.floor(i / width);
        xmin = Math.min(xmin, x); xmax = Math.max(xmax, x);
        ymin = Math.min(ymin, y); ymax = Math.max(ymax, y); count++;
      }
      return { width, height, xmin, xmax, ymin, ymax, count };
    };
    const measure = actor => {
      const bounds = alphaBounds(actor.body.material.map);
      const quadHeight = actor.body.geometry.parameters.height * actor.body.scale.y;
      const quadWidth = actor.body.geometry.parameters.width * actor.body.scale.x;
      return { key: actor.key, pose: actor.animationFrame, nominalHeight: actor.height, bounds,
        visibleHeight: (bounds.ymax - bounds.ymin + 1) / bounds.height * quadHeight,
        visibleWidth: (bounds.xmax - bounds.xmin + 1) / bounds.width * quadWidth,
        visibleFootAboveFloor: actor.body.position.y + (.5 - (bounds.ymax + 1) / bounds.height) * quadHeight };
    };
    const crates = [], originalCrate = world._crate;
    world._crate = function (x, z, ...params) {
      const next = this.stage.children.length;
      originalCrate.call(this, x, z, ...params);
      const box = new THREE.Box3().setFromObject(this.stage.children[next]);
      crates.push({ x, z, width: box.max.x - box.min.x, height: box.max.y - box.min.y });
    };
    const members = ['shepard', 'garrus', 'wrex'];
    world.setZone('noveria', { party: members });
    world.setMode('explore'); world.update(0, { render: false });
    const exploration = world.actors.map(measure);
    const nominal = world.atlases.crew.clone(); nominal.repeat.set(.25, .5); nominal.offset.set(0, 0);
    const originalGarrusCrop = alphaBounds(nominal); nominal.dispose();
    const arena = getLevelLayout('noveria').arenas['noveria:encounter-1'];
    world.setPosition(arena);
    const state = newGame();
    world.setBattle(createBattle({ party: members.map(id => actorFor(id, state)),
      enemies: [{ ...ENEMIES.destroyer, id: 'destroyer-0' }], seed: 519, mode: 'wait' }));
    world.setMode('combat'); world.update(0);
    const combat = [...world.battleActors.values()].map(measure);
    const arenaCrates = crates.sort((a,b) => Math.hypot(a.x - arena.x, a.z - arena.z) - Math.hypot(b.x - arena.x, b.z - arena.z)).slice(0, 3);
    return { exploration, combat, originalGarrusCrop, arena, arenaCrates, assetErrors: world.assetErrors };
  });
  const { exploration, originalGarrusCrop, combat, arenaCrates, assetErrors } = report.measurements;
  const garrus = exploration.find(actor => actor.key === 'garrus');
  assert.equal(originalGarrusCrop.ymin, 0);
  assert.equal(garrus.bounds.ymin, 2);
  assert.ok(garrus.bounds.count > originalGarrusCrop.count);
  assert.equal(combat.length, 4);
  assert.ok(combat.every(actor => typeof actor.pose === 'string' && actor.visibleHeight > 0));
  assert.ok(arenaCrates.length > 0 && arenaCrates.every(prop => prop.height > 0));
  assert.deepEqual(assetErrors, []);
  await capture('noveria');
  await page.evaluate(() => {
    const { THREE, world, withSpriteAlpha } = window.scaleTest;
    const actor = world.actors.find(actor => actor.id === 'garrus');
    const scene = new THREE.Scene(), camera = new THREE.OrthographicCamera(-3.8, 3.8, 2.6, -2.6, .1, 20);
    camera.position.z = 8; scene.background = new THREE.Color(0x202c39);
    const original = world.atlases.crew.clone(); original.repeat.set(.25, .5); original.offset.set(0, 0);
    for (const [x, texture] of [[-1.9, original], [1.9, actor.body.material.map]]) {
      const body = new THREE.Mesh(actor.body.geometry, withSpriteAlpha(actor.body.material.clone()));
      body.material.map = texture;
      body.position.x = x; scene.add(body);
    }
    world.labels.style.display = 'none';
    world.renderer.render(scene, camera);
  });
  await capture('garrus-crop');
  assert.deepEqual(report.errors, []);
  report.passed = true;
} catch (error) {
  report.failure = error.stack;
  process.exitCode = 1;
} finally {
  await browser.close();
  await writeFile(join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ passed: report.passed, failure: report.failure }));
}
