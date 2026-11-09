// Final eight-contact review from explicitly prepared native save fixtures.
// This does not rerun or claim a campaign playthrough; the separate real-callback
// run is frontier-characters-browser.json. Imports use the public save input.
import { chromium } from 'playwright';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { newGame, zoneEncounters, winEncounter, completeZone, recruit, encodeSave, decodeSave } from '../src/state.js';
import { recordVisit } from '../src/story.js';
const out = new URL('../docs/qa/', import.meta.url), root = new URL('../', import.meta.url);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const report = { passed: false, at: new Date().toISOString(), phase: 'final-development-after-level-freeze',
  mode: 'Two explicit native save fixtures from newGame/state callbacks, loaded through public save-import input. Eight real keyboard-E POI conversations; no encounters replayed. QA setPosition only stages contact/camera; walking routes are separate level QA.',
  fixtures: [], sourceHashes: {}, conversations: [], captures: [], errors: [], failedRequests: [] };
const fresh = newGame({ difficulty: 'story' });
const council = newGame({ difficulty: 'story' }); council.flags.briefed = true;
function visit(state, zone) { state.zone = zone; state.position = null; assert.equal(recordVisit(state, zone), true); }
visit(council, 'eden-prime'); for (const id of zoneEncounters('eden-prime')) assert.equal(winEncounter(council, id), true);
assert.equal(completeZone(council, 'eden-prime'), true); visit(council, 'citadel'); assert.equal(recruit(council, 'tali'), true);
assert.equal(completeZone(council, 'citadel'), true); visit(council, 'noveria');
const fixtures = { normandy: fresh, noveria: council };
for (const [zone, state] of Object.entries(fixtures)) {
  const bytes = encodeSave(state); assert.ok(decodeSave(bytes));
  const file = `frontier-characters-verified-fixture-${zone}.json`; await writeFile(new URL(file, out), `${bytes}\n`);
  report.fixtures.push({ zone, path: `docs/qa/${file}`, sha256: hash(Buffer.from(`${bytes}\n`)), nativeDecodePassed: true,
    description: zone === 'normandy' ? 'newGame before first deployment; Jenkins present' : 'Native callback fixture after Eden/Council, Jenkins permanently lost; Noveria visit recorded' });
}
for (const path of ['src/frontier-characters.js', 'src/story.js', 'src/story-data.js', 'src/world.js', 'src/world-data.js', 'src/main.js', 'src/frontier-ui.js', 'src/frontier-ui.css', 'src/frontier-layout-data.js', 'src/frontier-scene.js', 'public/assets/frontier-npcs.json', 'public/assets/frontier-npcs.png', 'vite.config.js']) report.sourceHashes[path] = hash(await readFile(new URL(path, root)));
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true,
  args: ['--no-sandbox', '--no-zygote', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
page.setDefaultTimeout(30000); page.on('pageerror', error => report.errors.push(error.message));
page.on('requestfailed', request => report.failedRequests.push(`${request.url()} ${request.failure()?.errorText}`));
page.on('response', response => { if (response.status() >= 400) report.failedRequests.push(`${response.status()} ${response.url()}`); });
try {
  await page.goto('http://127.0.0.1:4173/?qa=1', { waitUntil: 'networkidle' });
  for (const zone of ['normandy', 'noveria']) {
    console.log(`fixture:${zone}`);
    await page.locator('#save-import').setInputFiles(new URL(`frontier-characters-verified-fixture-${zone}.json`, out).pathname);
    await page.waitForFunction(zone => window.__RELAY_TEST__?.getState()?.zone === zone && !window.__RELAY_TEST__.getUI().busy, zone, {timeout:30000});
    await page.waitForFunction(() => window.__RELAY_TEST__.getWorld().atlases['frontier-npcs']?.image?.width === 1536, null, {timeout:30000});
    if (zone === 'normandy') {
      await page.keyboard.press('c');
      for (const id of ['adams', 'pressly', 'requisitions-officer', 'jenkins']) assert.equal(await page.locator(`[data-do="conversation"][data-id="${id}"]`).count(), 1);
      await page.keyboard.press('Escape');
    } else {
      assert.equal(await page.evaluate(() => window.__RELAY_TEST__.getWorld().getConversationPOIs().some(poi => poi.conversationId === 'jenkins')), false);
    }
    for (const id of zone === 'normandy' ? ['adams', 'pressly', 'requisitions-officer', 'jenkins'] : ['parasini', 'anoleis', 'lorik', 'lilihierax']) {
      report.stage = id;
      console.log(`contact:${id}`);
      const geometry = await page.evaluate(id => {
        const qa = window.__RELAY_TEST__, world = qa.getWorld(), poi = world.getConversationPOIs().find(poi => poi.conversationId === id);
        if (!poi || !world._walkable(poi.x, poi.z)) throw new Error(`Invalid contact approach: ${id}`);
        const free = { x: poi.actorPosition.x + (poi.actorPosition.x < 0 ? 2.3 : -2.3), z: poi.actorPosition.z };
        if (!world._walkable(free.x, free.z)) throw new Error(`Free 2.3-unit approach is blocked: ${id}`);
        if (world.setPosition(free) === false) throw new Error(`Cannot stage: ${id}`);
        const actors = [...world.actors, ...world.ambientActors].filter(actor => actor.key === id);
        if (actors.length !== 1) throw new Error(`Duplicate/missing body: ${id}`);
        return { authoredApproach: { x: poi.x, z: poi.z }, stagedApproach: free, actorDistance: 2.3,
          actorId: actors[0].id, bodySource: actors[0].body.material.map?.image?.src,
          frame: actors[0].animationFrame, materialAlphaTest: actors[0].body.material.alphaTest, nearby: world.getNearby()?.id };
      }, id);
      assert.equal(geometry.nearby, `${zone}:talk-${id}`);
      if (id !== 'jenkins') { assert.ok(geometry.bodySource.endsWith('/assets/frontier-npcs.png')); assert.equal(geometry.frame, id); }
      await page.waitForFunction(id => document.querySelector('[data-do="interact"]')?.textContent.includes(id), id === 'requisitions-officer' ? 'réquisitions' : id === 'anoleis' ? 'Anoleis' : id === 'lorik' ? 'Lorik' : id === 'parasini' ? 'Parasini' : id === 'lilihierax' ? 'Lilihierax' : id === 'pressly' ? 'Pressly' : id === 'jenkins' ? 'Jenkins' : 'Adams', {timeout:30000});
      await page.keyboard.press('e');
      const dialog = page.locator(`[data-conversation-id="${id}"]`); await dialog.waitFor();
      const topics = await dialog.locator('[data-topic-id]').evaluateAll(buttons => buttons.map(button => button.dataset.topicId)); assert.equal(topics.length, 2);
      for (const [index, topic] of topics.entries()) {
        await dialog.locator(`[data-topic-id="${topic}"]`).click(); assert.ok((await dialog.locator('.dialogue-text').innerText()).trim());
        if (index === 0 && (id === 'adams' || id === 'parasini')) {
          const capture = `frontier-characters-verified-${id}.png`; await page.screenshot({ path: new URL(capture, out).pathname });
          report.captures.push({ path: `docs/qa/${capture}`, sha256: hash(await readFile(new URL(capture, out))), actuallyOpened: false });
        }
        await dialog.locator('[data-conversation-back]').click();
      }
      await dialog.locator('[data-conversation-end]').click();
      const persisted = await page.evaluate(async () => {
        const { decodeSave, encodeSave } = await import('/src/state.js'); const state = window.__RELAY_TEST__.getState();
        return !!decodeSave(encodeSave(state));
      }); assert.equal(persisted, true);
      report.conversations.push({ id, zone, topics, ...geometry, keyboardE: true, saveRoundtrip: true });
    }
  }
  assert.deepEqual(report.errors, []); assert.deepEqual(report.failedRequests, []); report.passed = true; report.stage = 'complete';
} catch (error) { report.error = error.stack; process.exitCode = 1; }
finally {
  report.functionalPassed = report.passed;
  const changed = []; report.sourceHashesAfterRun = {};
  for (const [path, digest] of Object.entries(report.sourceHashes)) {
    const after = hash(await readFile(new URL(path, root))); report.sourceHashesAfterRun[path] = after;
    if (after !== digest) changed.push(path);
  }
  report.changedSourcesDuringRun = changed; if (changed.length) { report.passed = false; process.exitCode = 1; }
  await writeFile(new URL('frontier-characters-final.json', out), `${JSON.stringify(report, null, 2)}\n`); await browser.close();
}
console.log(JSON.stringify(report));
