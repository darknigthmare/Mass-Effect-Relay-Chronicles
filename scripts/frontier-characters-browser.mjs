import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const baseURL = process.env.GAME_URL || 'http://127.0.0.1:4173';
const out = new URL('../docs/qa/', import.meta.url);
const report = { passed: false, at: new Date().toISOString(), baseline: 'ff8a1cf7fd343d2bb8df6b01d5f18f3f5e7723cd',
  mode: 'Development UI/real story callbacks and three real Eden encounters; only battle time accelerated; camera staging uses setPosition, no statistics/progression overrides.',
  stage: 'launch', conversations: [], encounters: [], captures: [], errors: [], failedRequests: [] };
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || '/usr/bin/chromium',
  headless: true, args: ['--no-sandbox', '--no-zygote', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
page.setDefaultTimeout(30000);
page.on('pageerror', error => report.errors.push(error.message));
page.on('requestfailed', request => report.failedRequests.push(`${request.url()} ${request.failure()?.errorText}`));
page.on('response', response => { if (response.status() >= 400) report.failedRequests.push(`${response.status()} ${response.url()}`); });
const idle = zone => page.waitForFunction(expected => window.__RELAY_TEST__?.getState() && !window.__RELAY_TEST__.getUI().busy && window.__RELAY_TEST__.getState().zone === expected, zone);
const interact = id => page.evaluate(id => window.__RELAY_TEST__.interact(id), id);
const choice = async (index = 0) => { await page.locator(`[data-do="dialogue-choice"][data-index="${index}"]`).click(); };
async function capture(name) {
  const path = new URL(`frontier-characters-${name}.png`, out); await page.screenshot({ path: path.pathname });
  report.captures.push({ path: `docs/qa/${path.pathname.split('/').at(-1)}`, sha256: createHash('sha256').update(await readFile(path)).digest('hex'), actuallyOpened: false });
}
async function snapshot() { return page.evaluate(() => structuredClone(window.__RELAY_TEST__.getState())); }
async function saveValid() {
  assert.equal(await page.evaluate(async () => {
    const { decodeSave, encodeSave } = await import('/src/state.js');
    const state = window.__RELAY_TEST__.getState(); const copy = decodeSave(encodeSave(state));
    return !!copy && JSON.stringify(copy.story) === JSON.stringify(state.story);
  }), true);
}
async function speak(id, zone, screenshot = false) {
  report.stage = `conversation:${id}`;
  const before = await snapshot();
  const staging = await page.evaluate(({ id, zone }) => {
    const qa = window.__RELAY_TEST__, world = qa.getWorld(), poi = world.getConversationPOIs().find(poi => poi.conversationId === id);
    if (!poi || qa.getState().zone !== zone) throw new Error(`Missing ${id} conversation POI`);
    world.setPosition({ x: poi.x, z: poi.z });
    const actors = [...world.actors, ...world.ambientActors].filter(actor => actor.key === id);
    if (actors.length !== 1) throw new Error(`Expected exactly one ${id} body, got ${actors.length}`);
    return { poi: poi.id, actorId: actors[0].id, actorVisible: actors[0].group.visible, spriteKey: actors[0].key, materialAlphaTest: actors[0].body.material.alphaTest };
  }, { id, zone });
  assert.ok(staging.actorVisible); assert.ok(staging.materialAlphaTest >= 32 / 255);
  await interact(staging.poi);
  const dialog = page.locator(`[data-conversation-id="${id}"]`); await dialog.waitFor();
  if (id !== 'jenkins') assert.equal(await dialog.locator('.frontier-portrait svg image').count(), 1);
  const topics = await dialog.locator('[data-topic-id]').evaluateAll(buttons => buttons.map(button => button.dataset.topicId));
  assert.equal(topics.length, 2);
  for (const topic of topics) {
    await dialog.locator(`[data-topic-id="${topic}"]`).click();
    assert.ok((await dialog.locator('.dialogue-text').innerText()).trim());
    assert.ok((await snapshot()).story.heard.includes(`${id}:${topic}`));
    if (screenshot && topic === topics[0]) await capture(id);
    await dialog.locator('[data-conversation-back]').click();
  }
  await dialog.locator('[data-conversation-end]').click();
  const after = await snapshot(); delete before.story; delete after.story;
  // Only the autosaved camera position changes while staging the view.
  delete before.position; delete after.position; assert.deepEqual(after, before);
  await saveValid(); report.conversations.push({ id, zone, topics, ...staging, saveRoundtrip: true, resourcesUnchanged: true });
}
async function battle(id) {
  report.stage = id; await page.evaluate(id => window.__RELAY_TEST__.startBattle(id), id);
  const result = await page.evaluate(async () => {
    const { getActions, performAction, tickBattle, summarizeBattle } = await import('/src/combat.js');
    const qa = window.__RELAY_TEST__, battle = qa.getBattle(); if (!battle) throw new Error('No actual battle');
    let iterations = 0;
    while (!battle.winner && iterations++ < 6000) {
      for (const actor of battle.actors.filter(actor => actor.team === 'party' && actor.hp > 0)) {
        const available = getActions(battle, actor.id).filter(action => action.available);
        const enemies = battle.actors.filter(enemy => enemy.team === 'enemy' && enemy.hp > 0);
        const target = enemies.find(enemy => !enemy.statuses.stasis) || enemies[0]; if (!target) break;
        const party = battle.actors.filter(member => member.team === 'party');
        const low = party.filter(member => member.hp > 0).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
        const actions = [];
        if (party.some(member => member.hp <= 0)) actions.push(['unity', actor.id]);
        if (low.hp / low.maxHp < .42) actions.push(['medigel', low.id]);
        if (target.shield > 0) actions.push(['overload', target.id]);
        if (target.statuses.lift || target.statuses.singularity) actions.push(['throw', target.id]);
        actions.push(['signature', target.id], ['warp', target.id], ['burst', target.id], ['shoot', target.id], ['throw', target.id], ['barrier', actor.id]);
        for (const [actionId, targetId] of actions) if (available.some(action => action.id === actionId) && performAction(battle, { actorId: actor.id, actionId, targetId }).ok) break;
      }
      tickBattle(battle, .5);
    }
    qa.step(.001); return { ...summarizeBattle(battle), iterations };
  });
  assert.equal(result.winner, 'party'); assert.ok(result.actionCount > 0);
  await page.locator('[data-do="claim-victory"]').click();
  if (id === 'eden-prime:encounter-1') await choice();
  assert.ok((await snapshot()).cleared.includes(id)); await saveValid();
  report.encounters.push({ id, winner: result.winner, actionCount: result.actionCount });
}
try {
  await page.goto(`${baseURL}/?qa=1`, { waitUntil: 'networkidle' });
  await page.evaluate(() => window.__RELAY_TEST__.begin({ difficulty: 'story' }));
  await page.getByRole('button', { name: 'Je rejoins le briefing.' }).click(); await idle('normandy');
  for (const id of ['adams', 'pressly', 'requisitions-officer', 'jenkins']) await speak(id, 'normandy', true);
  await interact('normandy:briefing'); await choice(); await page.evaluate(() => window.__RELAY_TEST__.travel('eden-prime')); await idle('eden-prime');
  for (const suffix of ['encounter-1', 'encounter-2', 'boss']) await battle(`eden-prime:${suffix}`);
  await interact('eden-prime:objective'); await choice(); await choice(); await idle('normandy');
  assert.equal((await snapshot()).flags.jenkinsLost, true);
  assert.equal(await page.evaluate(() => window.__RELAY_TEST__.getWorld().getConversationPOIs().some(poi => poi.conversationId === 'jenkins')), false);
  await page.evaluate(() => window.__RELAY_TEST__.travel('citadel')); await idle('citadel');
  await interact('citadel:encounter-2'); await choice(); await interact('citadel:objective'); await choice(); await choice(); await idle('normandy');
  await page.evaluate(() => window.__RELAY_TEST__.travel('noveria')); await idle('noveria');
  for (const id of ['parasini', 'anoleis', 'lorik', 'lilihierax']) await speak(id, 'noveria', true);
  await page.evaluate(() => window.__RELAY_TEST__.getWorld().setPosition({ x: -10, z: 59 }));
  await capture('noveria-port');
  report.stage = 'complete'; assert.deepEqual(report.errors, []); assert.deepEqual(report.failedRequests, []); report.passed = true;
} catch (error) { report.error = error.stack; await capture('failure'); process.exitCode = 1; }
finally { await writeFile(new URL('frontier-characters-browser.json', out), `${JSON.stringify(report, null, 2)}\n`); await browser.close(); }
console.log(JSON.stringify(report));
