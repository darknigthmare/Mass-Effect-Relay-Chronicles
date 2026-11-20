// Actual Three.js WebGL and the body's own material and loaded animation frames.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { BOSS_ANIMATION_IDS } from '../src/boss-animation-data.js';
import { COMPANION_ANIMATION_IDS } from '../src/companion-animation-data.js';
import { ENEMY_ANIMATION_IDS } from '../src/enemy-animation-data.js';

const url = new URL(process.env.GAME_URL || 'http://127.0.0.1:4219/');
const output = process.env.P0_ALPHA_OUTPUT || 'test-results/p0-sprite-alpha';
await mkdir(output, { recursive: true });
const report = { passed: false, at: new Date().toISOString(), errors: [], captures: [] };
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || undefined,
  headless: true, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
try {
  const page = await browser.newPage({ viewport: { width: 1160, height: 840 } });
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('requestfailed', request => report.errors.push(`${request.url()}: ${request.failure()?.errorText}`));
  page.on('console', message => { if (message.type() === 'error') report.errors.push(message.text()); });
  const threeImport = (await (await fetch(new URL('src/world.js', url))).text()).match(/from "([^"]*three\.js[^"]*)"/)?.[1];
  assert.ok(threeImport, 'Use a Vite development server.');
  const path = new URL('__p0-sprite-alpha__', url);
  await page.route(path.href, route => route.fulfill({ contentType: 'text/html', body: `<!doctype html>
    <html lang="fr"><meta charset="utf-8"><link rel="icon" href="data:,"><style>body{margin:0}#terrain{position:relative;width:100vw;height:100vh}</style>
    <div id="terrain"></div><script type="module">
      import * as THREE from ${JSON.stringify(new URL(threeImport, url).href)};
      import { WorldView } from '/src/world.js';
      import { createBattle } from '/src/combat.js';
      import { actorFor, ENEMIES } from '/src/game-data.js';
      import { newGame } from '/src/state.js';
      import { clearSpriteAlphaIslands, prepareSpriteTexture, withSpriteAlpha } from '/src/world-sprite-alpha.js';
      const world = new WorldView(document.querySelector('#terrain'));
      const asset = file => fetch('/assets/' + file).then(response => response.json());
      const characters = ${JSON.stringify([
        ['shepard', 'shepard-male-animation.json'], ['femshep', 'shepard-female-animation.json'],
        ...Object.entries({ companion: COMPANION_ANIMATION_IDS, enemy: ENEMY_ANIMATION_IDS, boss: BOSS_ANIMATION_IDS })
          .flatMap(([family, ids]) => ids.map(id => [id, `${family}-${id}-animation.json`])),
      ])};
      const staticAtlases = [
        ['registerJokerSeated', 'joker-seated'], ['registerFrontierEnemyAtlas', 'frontier-enemies'],
        ['registerFrontierNPCAtlas', 'frontier-npcs'], ['registerHorizonNPCAtlas', 'horizon-npcs'],
        ['registerHorizonEnemyAtlas', 'horizon-enemies'], ['registerHorizonFaunaAtlas', 'horizon-fauna'],
      ];
      await Promise.all([
        ...characters.map(async ([id, file]) => world.registerCharacterAnimation(id, await asset(file))),
        ...staticAtlases.map(async ([method, name]) => world[method](await asset(name + '.json'))),
      ]);
      window.alphaTest = { THREE, world, createBattle, actorFor, ENEMIES, newGame, clearSpriteAlphaIslands, prepareSpriteTexture, withSpriteAlpha };
    </script></html>` }));
  await page.goto(path.href);
  await page.waitForFunction(() => window.alphaTest?.world._atlasRequests.size === 0);

  const checks = await page.evaluate(async () => {
    const { THREE, world, clearSpriteAlphaIslands } = window.alphaTest;
    const skipped = new Set(['props', 'vehicles', 'mako-directions', 'horizon-fleet-me1']);
    const affected = new Set(['combat-femshep', 'combat-thorian', 'combat-creeper']);
    const pixels = image => {
      const canvas = document.createElement('canvas');
      canvas.width = image.width; canvas.height = image.height;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      context.drawImage(image, 0, 0);
      return context.getImageData(0, 0, canvas.width, canvas.height).data;
    };
    const result = [];
    for (const [name, source] of Object.entries(world.atlases)) {
      if (skipped.has(name)) continue;
      const file = world._atlasUrls.get(name).split('/').at(-1);
      const { width, height } = source.image;
      const effective = pixels(source.image);
      const residual = clearSpriteAlphaIslands(effective, width, height);
      const entry = { name, file, width, height, residual, premultiplied: source.premultiplyAlpha && source.colorSpace === THREE.NoColorSpace };
      if (affected.has(name)) {
        const original = new Image(); original.src = world._atlasUrls.get(name); await original.decode();
        const sanitized = pixels(original);
        entry.raw = clearSpriteAlphaIslands(sanitized, width, height);
        entry.diffAlpha = 0;
        for (let index = 3; index < sanitized.length; index += 4) if (effective[index] !== sanitized[index]) entry.diffAlpha++;
      }
      result.push(entry);
    }
    return { atlas: result, assetErrors: world.assetErrors };
  });
  assert.deepEqual(checks.assetErrors, []);
  assert.equal(checks.atlas.length, 33);
  assert.ok(checks.atlas.every(entry => entry.premultiplied && entry.residual === 0));
  for (const [name, count] of [['combat-femshep', 5], ['combat-thorian', 9], ['combat-creeper', 1]]) {
    const entry = checks.atlas.find(item => item.name === name);
    assert.equal(entry.raw, count);
    assert.equal(entry.diffAlpha, 0);
  }
  report.atlases = checks.atlas;

  report.compositing = await page.evaluate(() => {
    const { THREE, prepareSpriteTexture, withSpriteAlpha, world } = window.alphaTest;
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 2;
    const context = canvas.getContext('2d'); context.fillStyle = '#f09644'; context.fillRect(0, 0, 1, 2);
    const target = new THREE.WebGLRenderTarget(65, 65);
    const scene = new THREE.Scene(), camera = new THREE.OrthographicCamera(-1, 1, 1, -1, .1, 5);
    camera.position.z = 2;
    const straight = new THREE.CanvasTexture(canvas); straight.colorSpace = THREE.SRGBColorSpace;
    const prepared = prepareSpriteTexture(new THREE.CanvasTexture(canvas));
    const material = withSpriteAlpha(new THREE.MeshBasicMaterial({ map: straight, transparent: true, toneMapped: false, alphaTest: .2 }));
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material); scene.add(quad);
    const pixel = x => {
      const sample = new Uint8Array(4);
      world.renderer.readRenderTargetPixels(target, x, 32, 1, 1, sample);
      return [...sample.slice(0, 3)];
    };
    world.renderer.setRenderTarget(target);
    const checks = [0x182432, 0xeef5ff].map(background => {
      scene.background = new THREE.Color(background);
      material.map = straight; world.renderer.render(scene, camera);
      const solid = pixel(1), plain = pixel(63), straightEdge = pixel(32);
      material.map = prepared; world.renderer.render(scene, camera);
      return { background, solid, plain, straightEdge, filteredEdge: pixel(32), filteredSolid: pixel(1),
        expectedEdge: solid.map((value, index) => Math.round((value + plain[index]) / 2)) };
    });
    world.renderer.setRenderTarget(null);
    target.dispose(); straight.dispose(); prepared.dispose(); material.dispose(); quad.geometry.dispose();
    return checks;
  });
  for (const check of report.compositing) {
    assert.ok(check.filteredEdge.every((v, i) => Math.abs(v - check.expectedEdge[i]) <= 3), JSON.stringify(check));
    assert.ok(check.filteredSolid.every((v, i) => Math.abs(v - check.solid[i]) <= 2), JSON.stringify(check));
    assert.ok(check.straightEdge.some((v, i) => Math.abs(v - check.expectedEdge[i]) >= 10), JSON.stringify(check));
  }

  report.frames = await page.evaluate(() => {
    const { THREE, world, createBattle, newGame, actorFor, ENEMIES } = window.alphaTest;
    const state = newGame();
    world.setCommanderAppearance('female');
    world.setZone('feros', { party: ['shepard', 'wrex'] });
    world.setBattle(createBattle({ party: ['shepard', 'wrex'].map(id => actorFor(id, state)),
      enemies: ['creeper', 'thorian'].map(id => ({ ...ENEMIES[id], id: id + '-0' })), seed: 841, mode: 'wait' }));
    world.setMode('combat'); world.update(0, { render: false });
    const scene = new THREE.Scene(), camera = new THREE.OrthographicCamera(-6.9, 6.9, 5, -5, .1, 20);
    camera.position.z = 8;
    const frames = [];
    for (const [row, id] of ['shepard', 'wrex', 'creeper-0', 'thorian-0'].entries()) {
      for (const [column, pose] of ['aim', 'power', 'hit', 'down'].entries()) {
        const actor = world.battleActors.get(id), frame = world.characterAnimations[actor.key].combat.frames[pose];
        if (!world._applyAnimationFrame(actor, 'combat-' + actor.key, frame)) throw Error(id + ' ' + pose);
        const material = window.alphaTest.withSpriteAlpha(new THREE.MeshBasicMaterial({
          map: actor.body.material.map.clone(), transparent: true, alphaTest: actor.body.material.alphaTest, toneMapped: false,
        }));
        const aspect = frame.rect[2] / frame.rect[3];
        const height = Math.min(pose === 'down' ? .85 : 2.05, 2.9 / aspect);
        const body = new THREE.Mesh(new THREE.PlaneGeometry(height * aspect, height), material);
        body.position.set((column - 1.5) * 3.35, (1.5 - row) * 2.47, 0);
        scene.add(body); frames.push({ id, pose, frame: actor.animationFrame });
      }
    }
    world.labels.style.display = 'none';
    window.alphaTest.draw = background => { scene.background = new THREE.Color(background); world.renderer.render(scene, camera); };
    return frames;
  });
  assert.equal(new Set(report.frames.map(frame => frame.frame)).size, 16);
  for (const [label, background] of [['dark', 0x182432], ['light', 0xeef5ff]]) {
    await page.evaluate(color => window.alphaTest.draw(color), background);
    const path = join(output, `${label}.png`), png = await page.screenshot({ path });
    report.captures.push({ path, label, sha256: createHash('sha256').update(png).digest('hex') });
  }
  assert.deepEqual(report.errors, []);
  report.passed = true;
} catch (error) {
  report.failure = error.stack;
  process.exitCode = 1;
} finally {
  await browser.close();
  await writeFile(join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ passed: report.passed, atlases: report.atlases?.length, frames: report.frames?.length, errors: report.errors, failure: report.failure }));
}
