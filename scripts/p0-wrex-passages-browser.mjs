import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';

const url = new URL(process.env.GAME_URL || 'http://127.0.0.1:4219/');
const output = process.env.P0_WREX_OUTPUT || 'test-results/p0-wrex-passages';
await mkdir(output, { recursive: true });
const report = { passed: false, at: new Date().toISOString(), errors: [], zones: [], captures: [] };
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || undefined,
  headless: true, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('requestfailed', request => report.errors.push(`${request.url()}: ${request.failure()?.errorText}`));
  page.on('console', message => { if (message.type() === 'error') report.errors.push(message.text()); });
  const threeImport = (await (await fetch(new URL('src/world.js', url))).text()).match(/from "([^"]*three\.js[^"]*)"/)?.[1];
  assert.ok(threeImport, 'Use a Vite development server.');
  const harness = new URL('__p0-wrex-passages__', url);
  await page.route(harness.href, route => route.fulfill({ contentType: 'text/html', body: `<!doctype html>
    <html lang="fr"><meta charset="utf-8"><link rel="icon" href="data:,"><style>body{margin:0}#terrain{position:relative;width:100vw;height:100vh}</style>
    <div id="terrain"></div><script type="module">
      import * as THREE from ${JSON.stringify(new URL(threeImport, url).href)};
      import { WorldView } from '/src/world.js';
      import { WORLD_ZONE_IDS } from '/src/world-data.js';
      const world = new WorldView(document.querySelector('#terrain'));
      window.wrexTest = { THREE, world, zones: WORLD_ZONE_IDS };
    </script></html>` }));
  await page.goto(harness.href);
  await page.waitForFunction(() => window.wrexTest?.world.atlases.crew);
  report.frame = await page.evaluate(() => {
    const { world } = window.wrexTest;
    const atlas = world.atlases.crew.image;
    const map = world._spriteTexture('wrex');
    const context = map.image.getContext('2d', { willReadFrequently: true });
    const corrected = context.getImageData(0, 0, 384, 512).data;
    const canvas = document.createElement('canvas'); canvas.width = 384; canvas.height = 512;
    const sample = canvas.getContext('2d', { willReadFrequently: true });
    sample.drawImage(atlas, 768, 512, 384, 512, 0, 0, 384, 512);
    const nominal = sample.getImageData(0, 0, 384, 512).data;
    const visible = data => {
      let first = 512, last = 0, count = 0;
      for (let index = 0; index < 384 * 512; index++) if (data[index * 4 + 3] >= 51) {
        const row = Math.floor(index / 384); first = Math.min(first, row); last = Math.max(last, row); count++;
      }
      return { first, last, count };
    };
    return { nominal: visible(nominal), corrected: visible(corrected) };
  });
  assert.equal(report.frame.nominal.first, 0);
  assert.equal(report.frame.corrected.first, 2);
  assert.equal(report.frame.corrected.last, 509);
  assert.equal(report.frame.corrected.count, 105823);

  const zones = await page.evaluate(() => window.wrexTest.zones);
  for (const id of zones) report.zones.push(await page.evaluate(zone => {
    const { THREE, world } = window.wrexTest;
    const distance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
    world.setZone(zone, { party: ['shepard', 'kaidan', 'wrex'] }); world.setMode('explore');
    const paths = world.levelLayout?.paths.map(route => ({ id: route.id, points: route.points.map(([x, z]) => ({ x, z })) }))
      ?? [{ id: 'poi', points: [world.getPosition(), ...world.getPOIs()] }];
    const actor = world.actors.find(actor => actor.id === 'wrex');
    const checks = paths.map(path => {
      world.setPosition(path.points[0]); world.update(0, { render: false });
      const result = { id: path.id, segments: path.points.length - 1, checkedFrames: 0, blockedSegments: [], invalidCenters: 0, sweptCollisions: 0,
        maxBodyX: 0, maxBodyY: 0, minBodyY: 1, maxStep: 0, maxDistanceFromLeader: 0 };
      for (const [index, point] of path.points.slice(1).entries()) {
        const destination = world._resolveLevelPosition(point) || point;
        world.targetPath = world._pathTo(destination);
        for (let tick = 0; tick < 480 && world.targetPath?.length; tick++) {
          const before = actor.group.position.clone();
          world.update(.05, { render: false });
          const position = actor.group.position;
          result.checkedFrames++;
          const stride = distance(position, before);
          result.maxStep = Math.max(result.maxStep, stride);
          result.maxDistanceFromLeader = Math.max(result.maxDistanceFromLeader, distance(position, world.player));
          if (!world._walkable(position.x, position.z)) result.invalidCenters++;
          const samples = Math.ceil(stride / .04);
          for (let s = 1; s < samples; s++) {
            const probe = before.clone().lerp(position, s / samples);
            if (!world._walkable(probe.x, probe.z)) { result.sweptCollisions++; break; }
          }
          const pose = actor.body.geometry.attributes.position;
          for (let i = 0; i < pose.count; i++) {
            const p = new THREE.Vector3().fromBufferAttribute(pose, i).applyMatrix4(actor.body.matrixWorld).project(world.camera);
            result.maxBodyX = Math.max(result.maxBodyX, Math.abs(p.x));
            result.maxBodyY = Math.max(result.maxBodyY, p.y); result.minBodyY = Math.min(result.minBodyY, p.y);
          }
        }
        if (distance(world.player, destination) > 1.3) result.blockedSegments.push({ index, destination, at: world.getPosition() });
      }
      return result;
    });
    return { id: zone, checks, errors: world.assetErrors };
  }, id));

  await page.evaluate(() => {
    const { world } = window.wrexTest;
    world.setZone('normandy', { party: ['shepard', 'wrex'] });
    world.setStoryContext({ recruited: ['shepard', 'wrex'], completed: ['eden-prime', 'citadel'] });
    world.setPosition({ x: -3.7, z: -14.5 }); world.update(0);
  });
  const capture = async label => {
    const path = join(output, `${label}.png`), png = await page.screenshot({ path });
    report.captures.push({ label, path, sha256: createHash('sha256').update(png).digest('hex') });
  };
  await capture('normandy');
  await page.setViewportSize({ width: 864, height: 540 });
  await page.waitForFunction(() => window.wrexTest.world.width === 864);
  await page.evaluate(() => {
    const { THREE, world } = window.wrexTest;
    const actor = world.actors.find(actor => actor.id === 'wrex');
    const scene = new THREE.Scene(), camera = new THREE.OrthographicCamera(-3.8, 3.8, 2.375, -2.375, .1, 20);
    camera.position.z = 8; scene.background = new THREE.Color(0x202c39);
    const nominal = world.atlases.crew.clone(); nominal.repeat.set(.25, .5); nominal.offset.set(.5, 0);
    for (const [x, texture] of [[-1.9, nominal], [1.9, actor.body.material.map]]) {
      const body = new THREE.Mesh(actor.body.geometry, actor.body.material.clone());
      body.material.onBeforeCompile = actor.body.material.onBeforeCompile;
      body.material.onBeforeRender = actor.body.material.onBeforeRender;
      body.material.map = texture;
      body.position.x = x; scene.add(body);
    }
    world.labels.style.display = 'none';
    world.renderer.render(scene, camera);
  });
  await capture('framing-detail');
  assert.deepEqual(report.errors, []);
  report.observations = report.zones.flatMap(zone => zone.checks.filter(check => check.blockedSegments.length || check.invalidCenters || check.sweptCollisions
    || check.maxDistanceFromLeader > 8 || check.maxBodyX >= 1 || check.maxBodyY >= 1 || check.minBodyY <= -1).map(check => ({ zone: zone.id, ...check })));
  assert.deepEqual(report.observations, []);
  report.passed = true;
} catch (error) {
  report.failure = error.stack;
  process.exitCode = 1;
} finally {
  await browser.close();
  await writeFile(join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ passed: report.passed, zones: report.zones.length, frame: report.frame, observations: report.observations?.length, failure: report.failure?.slice(0, 500) }));
}
