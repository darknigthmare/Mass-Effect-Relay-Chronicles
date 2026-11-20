// Targeted WebGL checks in an isolated WorldView against a local Vite server.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';

const url = new URL(process.env.GAME_URL || 'http://127.0.0.1:4173/');
const output = process.env.P0_CAMERA_OUTPUT || 'test-results/p0-camera';
await mkdir(output, { recursive: true });
const report = { passed: false, at: new Date().toISOString(), url: url.href,
  scope: 'Isolated native WorldView, real Chromium WebGL, existing stage geometry and deterministic sprite-occlusion fixture.',
  routes: [], captures: [], errors: [] };
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || undefined,
  headless: true, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('requestfailed', request => report.errors.push(`${request.url()}: ${request.failure()?.errorText}`));
  const harness = new URL('__p0-camera-test__', url);
  const cameraModule = new URL('src/world-camera.js', url);
  const moduleSource = await (await fetch(cameraModule)).text();
  const threeImport = moduleSource.match(/from "([^"]*three\.js[^"]*)"/)?.[1];
  assert.ok(threeImport, 'Use a running Vite development server.');
  await page.route(harness.href, route => route.fulfill({ contentType: 'text/html', body: `<!doctype html>
    <html lang="fr"><meta charset="utf-8"><style>body{margin:0}#terrain{position:relative;width:100vw;height:100vh}</style>
    <div id="terrain"></div><script type="module">
      import * as THREE from ${JSON.stringify(new URL(threeImport, url).href)};
      import { WorldView } from ${JSON.stringify(new URL('src/world.js', url).href)};
      import { showCoveredActor } from ${JSON.stringify(cameraModule.href)};
      import { WORLD_ZONE_IDS } from ${JSON.stringify(new URL('src/world-data.js', url).href)};
      const world = new WorldView(document.querySelector('#terrain'));
      // The standalone page bypasses Vite's app HTML bootstrap and its defines.
      const atlas = await fetch(${JSON.stringify(new URL('assets/horizon-enemies.json', url).href)}).then(response => response.json());
      world.registerHorizonEnemyAtlas(atlas);
      window.frameTest = { THREE, showCoveredActor, WORLD_ZONE_IDS, world };
    </script></html>` }));
  await page.goto(harness.href);
  await page.waitForFunction(() => {
    const atlases = window.frameTest?.world?.atlases;
    return atlases?.enemy && atlases?.crew && atlases?.['horizon-enemies'];
  });
  const zones = await page.evaluate(() => window.frameTest.WORLD_ZONE_IDS);
  for (const zone of zones) {
    const result = await page.evaluate(id => {
      const { world, THREE } = window.frameTest;
      const maxBounds = actors => {
        let width = 0, low = 1, high = -1;
        for (const { group, body } of actors) {
          if (!group.visible) continue;
          body.updateWorldMatrix(true, false);
          const position = body.geometry.attributes.position;
          for (let index = 0; index < position.count; index++) {
            const point = new THREE.Vector3().fromBufferAttribute(position, index).applyMatrix4(body.matrixWorld).project(world.camera);
            width = Math.max(width, Math.abs(point.x)); low = Math.min(low, point.y); high = Math.max(high, point.y);
          }
        }
        return { width, low, high };
      };
      world.setZone(id, { party: ['shepard', 'kaidan', 'wrex'] });
      world.setMode('explore');
      const bounds = world.getBounds();
      const edge = Math.min(bounds.maxX - bounds.minX, bounds.maxZ - bounds.minZ) * .1;
      const points = [...(world.levelLayout?.rooms.map(room => room.center) || []),
        ...world.getPOIs(), ...[
          [bounds.minX + edge, bounds.minZ + edge], [bounds.minX + edge, bounds.maxZ - edge],
          [bounds.maxX - edge, bounds.minZ + edge], [bounds.maxX - edge, bounds.maxZ - edge],
        ].map(([x, z]) => ({ x, z }))];
      const accepted = [];
      for (const requested of points) {
        world.setPosition(requested);
        const actual = world.getPosition();
        if (Math.hypot(actual.x - requested.x, actual.z - requested.z) > 2.5) continue;
        world.update(0, { render: false });
        accepted.push({ position: actual, ...maxBounds(world.actors) });
      }
      const contacts = [
        { id: 'shepard', sprite: 'shepard', team: 'party', hp: 100, shield: 0 },
        { id: 'wrex', sprite: 'wrex', team: 'party', hp: 100, shield: 40 },
        { id: 'colossus-0', sprite: 'colossus', team: 'enemy', hp: 320, shield: 0 },
        { id: 'hostile-contact', sprite: 'geth', team: 'enemy', hp: 150, shield: 0, statuses: { lift: 1 } },
      ];
      const arenas = world.levelLayout ? Object.values(world.levelLayout.arenas) : [world.getCombatArena()];
      const battles = [];
      for (const arena of arenas) {
        world.setBattle(null); world.setMode('explore'); world.setPosition(arena);
        world.setBattle({ actors: contacts });
        world.setMode('combat');
        for (let step = 0; step < 12; step++) world.update(1 / 30, { render: false });
        if (world.battleActors.get('colossus-0').animationFrame !== 'colossus-body') {
          throw new Error('The large-body pose must load before measuring the frame.');
        }
        battles.push({ arena, ...maxBounds(world.battleActors.values()) });
      }
      world.update(0);
      return { id, accepted, battles, renderer: world.renderer.getContext().constructor.name, assetErrors: world.assetErrors };
    }, zone);
    assert.ok(result.accepted.length > 0);
    assert.equal(result.renderer, 'WebGL2RenderingContext');
    assert.deepEqual(result.assetErrors, []);
    for (const point of [...result.accepted, ...result.battles]) {
      assert.ok(point.width <= .881 && point.low >= -.761 && point.high <= .841, `${zone}: ${JSON.stringify(point)}`);
    }
    report.routes.push(result);
    if (zone === 'virmire') {
      const path = join(output, 'battle-portrait.png');
      await page.screenshot({ path });
      report.captures.push(path);
    }
  }

  await page.setViewportSize({ width: 1160, height: 720 });
  await page.waitForFunction(() => window.frameTest.world.width === 1160 && window.frameTest.world.height === 720);
  const landscape = await page.evaluate(() => {
    const { world } = window.frameTest;
    world.setBattle(null); world.setMode('explore');
    world.setPosition({ x: 0, z: -18 });
    world.update(0);
    return { width: world.width, height: world.height, span: world.camera.top - world.camera.bottom };
  });
  assert.deepEqual(landscape, { width: 1160, height: 720, span: 29 });
  const fieldPath = join(output, 'field-landscape.png');
  await page.screenshot({ path: fieldPath });
  report.captures.push(fieldPath);
  report.landscape = landscape;

  report.occlusion = await page.evaluate(() => {
    const { THREE, showCoveredActor } = window.frameTest;
    const renderer = new THREE.WebGLRenderer();
    const target = new THREE.WebGLRenderTarget(64, 64);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x151515);
    const camera = new THREE.OrthographicCamera(-2, 2, 2, -2, .01, 30);
    camera.position.z = 8;
    const wall = new THREE.Mesh(new THREE.BoxGeometry(.8, 2.7, .25), new THREE.MeshBasicMaterial({ color: 0x192333 }));
    wall.position.z = 2;
    const texture = new THREE.DataTexture(new Uint8Array([220, 220, 220, 255]), 1, 1);
    texture.needsUpdate = true;
    const body = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2), new THREE.MeshBasicMaterial({
      map: texture, transparent: true, alphaTest: .2, depthWrite: true,
    }));
    const group = new THREE.Group();
    group.add(body);
    scene.add(group, wall);
    const pixels = () => {
      renderer.setRenderTarget(target); renderer.render(scene, camera);
      return [32, 45, 60].map(x => {
        const rgba = new Uint8Array(4); renderer.readRenderTargetPixels(target, x, 32, 1, 1, rgba);
        return [...rgba];
      });
    };
    const disabled = pixels();
    showCoveredActor({ body, group }, true);
    const enabled = pixels();
    target.dispose(); texture.dispose();
    scene.traverse(object => { object.geometry?.dispose(); object.material?.dispose(); });
    renderer.dispose();
    return { disabled, enabled };
  });
  assert.notDeepEqual(report.occlusion.enabled[0], report.occlusion.disabled[0], 'The wall-covered sample becomes readable.');
  assert.deepEqual(report.occlusion.enabled.slice(1), report.occlusion.disabled.slice(1),
    'The unobstructed sprite and the surrounding scene retain identical pixels.');
  assert.deepEqual(report.errors, []);
  report.passed = true;
} catch (error) {
  report.failure = error.stack;
  process.exitCode = 1;
} finally {
  await browser.close();
  await writeFile(join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ passed: report.passed, zones: report.routes.length,
    fieldSamples: report.routes.reduce((sum, zone) => sum + zone.accepted.length, 0),
    battleSamples: report.routes.reduce((sum, zone) => sum + zone.battles.length, 0), failure: report.failure }));
}
