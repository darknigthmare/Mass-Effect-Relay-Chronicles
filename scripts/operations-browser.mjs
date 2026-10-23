import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

const baseURL = process.env.GAME_URL || 'http://127.0.0.1:4173';
const out = new URL('../test-results/', import.meta.url);
await mkdir(out, { recursive: true });
const report = {
  passed: false, version: '0.2.0', at: new Date().toISOString(), checks: [], steps: [], encounters: [], errors: [], failedRequests: [],
  scope: 'Eleven additional operations, preserving the three existing Citadel assignments; normal difficulty, female Soldier, real ATB battles.',
  navigation: 'Every operation marker is checked for collision and a reachable path, then the test sets the player at that point and presses E. It does not walk all 43 paths in real time.',
  combat: 'Accelerated simulation through actual combat actions and tickBattle. No stat, HP, damage, reward or quest-progression overrides.',
};
const browser = await chromium.launch({ headless: true,
  ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {}),
  args: ['--no-sandbox', '--no-zygote', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
page.setDefaultTimeout(60000);
page.on('pageerror', error => report.errors.push(error.message));
page.on('response', response => { if (response.status() >= 400) report.failedRequests.push({ url: response.url(), status: response.status() }); });
const action = (name, id) => page.locator(`[data-do="${name}"]${id ? `[data-id="${id}"]` : ''}`).first();
const capture = name => page.screenshot({ path: new URL(`v02-${name}.png`, out).pathname });
const snapshot = () => page.evaluate(() => structuredClone(window.__RELAY_TEST__.getState()));
async function idle() { await page.waitForFunction(() => window.__RELAY_TEST__?.getState() && !window.__RELAY_TEST__.getUI().busy, null, { polling: 100 }); }
async function choose(index = 0) { await page.locator(`[data-do="dialogue-choice"][data-index="${index}"]`).click(); await idle(); }
async function interact(id) { await page.evaluate(id => window.__RELAY_TEST__.interact(id), id); }
async function travel(zone) { await page.evaluate(zone => window.__RELAY_TEST__.travel(zone), zone); await idle(); assert.equal((await snapshot()).zone, zone); }
async function validateSave() {
  return page.evaluate(async () => {
    const { encodeSave, decodeSave } = await import('/src/state.js');
    const current = window.__RELAY_TEST__.getState(), decoded = decodeSave(encodeSave(current));
    if (!decoded) throw new Error('Current state failed save validation.');
    if (JSON.stringify(decoded.operations) !== JSON.stringify(current.operations)) throw new Error('Operation history changed during save validation.');
    return true;
  });
}
async function operationState(id) {
  return page.evaluate(async id => {
    const { listOperations } = await import('/src/operations.js');
    return listOperations(window.__RELAY_TEST__.getState()).find(entry => entry.id === id);
  }, id);
}
async function resolveBattle(id) {
  const result = await page.evaluate(async () => {
    const { getActions, performAction, tickBattle, summarizeBattle } = await import('/src/combat.js');
    const qa = window.__RELAY_TEST__, battle = qa.getBattle();
    if (!battle) throw new Error('No battle was started.');
    let iterations = 0;
    while (!battle.winner && iterations++ < 6000) {
      for (const actor of battle.actors.filter(actor => actor.team === 'party' && actor.hp > 0)) {
        const actions = getActions(battle, actor.id).filter(action => action.available);
        if (!actions.length) continue;
        const party = battle.actors.filter(actor => actor.team === 'party'), enemies = battle.actors.filter(actor => actor.team === 'enemy' && actor.hp > 0);
        const target = enemies.find(enemy => !enemy.statuses.stasis) || enemies[0];
        if (!target) break;
        const low = party.filter(actor => actor.hp > 0).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0], priorities = [];
        if (party.some(actor => actor.hp <= 0)) priorities.push(['unity', actor.id]);
        if (low.hp / low.maxHp < .42) priorities.push(['medigel', low.id]);
        if (target.shield > 0) priorities.push(['overload', target.id]);
        if (target.statuses.lift > 0 || target.statuses.singularity > 0) priorities.push(['throw', target.id]);
        priorities.push(['signature', target.id], ['warp', target.id], ['burst', target.id], ['shoot', target.id], ['throw', target.id], ['overload', target.id], ['barrier', actor.id], ['cover', actor.id]);
        for (const [actionId, targetId] of priorities) {
          if (!actions.some(action => action.id === actionId)) continue;
          if (performAction(battle, { actorId: actor.id, actionId, targetId }).ok) break;
        }
      }
      tickBattle(battle, .5);
    }
    qa.step(.001);
    return { ...summarizeBattle(battle), iterations };
  });
  assert.equal(result.winner, 'party', `Actual victory: ${id}`);
  report.encounters.push({ id, winner: result.winner, actions: result.actionCount, elapsed: result.elapsed });
  await action('claim-victory').click();
  if (id === 'eden-prime:encounter-1') await choose();
  await validateSave();
  console.log(JSON.stringify({ victory: id, actions: result.actionCount }));
}
async function mainBattle(id) { await page.evaluate(id => window.__RELAY_TEST__.startBattle(id), id); await resolveBattle(id); }
async function finishMain(zone) { await interact(`${zone}:objective`); await choose(); await choose(); await idle(); await validateSave(); }

let pendingReloadChecked = false;
async function operationStep(id, preferred = null) {
  const entry = await operationState(id), step = entry.currentStep;
  assert.ok(step, `${id}: current step exists`);
  const point = await page.evaluate(({ id, stepId }) => {
    const world = window.__RELAY_TEST__.getWorld(), poi = world.getInteractivePOIs().find(poi => poi.operationId === id && poi.stepId === stepId);
    if (!poi) throw new Error(`Missing operation marker: ${id}/${stepId}`);
    const path = world._pathTo(poi);
    if (!world._walkable(poi.x, poi.z) || !path?.length) throw new Error(`Unreachable marker: ${poi.id}`);
    world.setPosition(poi);
    const nearby = world.getNearby();
    if (nearby?.id !== poi.id) throw new Error(`E would interact with ${nearby?.id} instead of ${poi.id}`);
    return { id: poi.id, x: poi.x, z: poi.z, pathNodes: path.length };
  }, { id, stepId: step.id });
  await page.keyboard.press('KeyE');
  const dialogue = page.locator(`.dialogue[data-operation-id="${id}"][data-step-id="${step.id}"]`);
  await dialogue.waitFor({ state: 'visible' });
  const choices = dialogue.locator('[data-operation-choice]:not([disabled])');
  const choiceId = preferred || await choices.first().getAttribute('data-operation-choice');
  await dialogue.locator(`[data-operation-choice="${choiceId}"]`).click(); await idle();
  report.steps.push({ operationId: id, stepId: step.id, choice: choiceId, marker: point });
  const combat = await page.evaluate(() => !!window.__RELAY_TEST__.getBattle());
  if (combat) {
    assert.equal(await page.evaluate(() => window.__RELAY_TEST__.claim()), false, 'Cannot claim an unfinished fight.');
    if (!pendingReloadChecked) {
      const pending = await snapshot(); assert.equal(pending.operations.records[id].pendingBattle, step.id);
      await page.reload({ waitUntil: 'networkidle' }); await action('continue').click(); await idle();
      const restored = await snapshot(); assert.deepEqual(restored.operations, pending.operations);
      assert.equal(await page.evaluate(() => window.__RELAY_TEST__.getBattle()), null);
      await page.evaluate(id => {
        const world = window.__RELAY_TEST__.getWorld(), poi = world.getInteractivePOIs().find(poi => poi.operationId === id);
        world.setPosition(poi);
      }, id);
      await page.keyboard.press('KeyE'); await page.locator('[data-operation-choice="resume"]').click();
      assert.equal(await page.evaluate(() => !!window.__RELAY_TEST__.getBattle()), true);
      pendingReloadChecked = true; report.checks.push('Armed combat survives autosave/reload and requires an actual resumed victory.');
    }
    if (id === 'citadel-doctor-michel') await capture('femshep-combat');
    await resolveBattle(point.id);
  }
  await validateSave();
}
async function completeOperation(id, choices = {}) {
  let guard = 0;
  while ((await operationState(id)).status !== 'completed' && guard++ < 10) {
    const entry = await operationState(id); await operationStep(id, choices[entry.currentStep.id]);
  }
  assert.equal((await operationState(id)).status, 'completed', id);
  console.log(JSON.stringify({ completed: id }));
}

try {
  await page.goto(`${baseURL}/?qa`, { waitUntil: 'networkidle' });
  await action('new').click(); await page.locator('#commander-name').fill('Jane'); await page.locator('#new-appearance').selectOption('female');
  await capture('creation'); await action('begin').click(); await idle(); await choose();
  assert.equal((await snapshot()).appearance, 'female');
  await interact('normandy:briefing'); await choose(); await travel('eden-prime');
  for (const suffix of ['encounter-1', 'encounter-2', 'boss']) await mainBattle(`eden-prime:${suffix}`);
  await finishMain('eden-prime'); await travel('citadel');

  // This accepted objective intentionally remains blocked until Tali is recruited.
  await operationStep('citadel-reporters-request');
  const blocked = await operationState('citadel-reporters-request'); assert.match(blocked.blockedReason, /Tali/);
  assert.match(await page.locator('.mission-chip').innerText(), /Tali/);
  await action('journal').click(); await action('journal-tab', 'assignments').click();
  await capture('journal'); await action('track-operation', 'citadel-reporters-request').click();
  assert.equal((await snapshot()).trackedOperation, null);
  assert.equal(await page.evaluate(() => window.__RELAY_TEST__.getUI().tracked), null);
  await action('track-operation', 'citadel-reporters-request').click(); await action('close').click();
  assert.equal((await snapshot()).trackedOperation, 'citadel-reporters-request');
  report.checks.push('Emily’s blocked objective shows the Tali prerequisite in the journal and HUD; stopping tracking clears the marker.');

  for (const suffix of ['encounter-1', 'encounter-2', 'boss']) { await interact(`citadel:${suffix}`); await choose(); }
  for (const id of ['citadel-consort', 'citadel-xeltan', 'citadel-reporters-request', 'citadel-keepers', 'citadel-signal-tracking', 'citadel-presidium-prophet', 'citadel-doctor-michel']) {
    await completeOperation(id, { hanar: 'permit', blackmailer: 'fight' });
  }
  await finishMain('citadel');
  await action('squad').click(); for (const id of ['kaidan', 'ashley', 'garrus', 'wrex']) await action('crew-select', id).click(); await action('crew-confirm').click();
  assert.deepEqual((await snapshot()).party, ['shepard', 'garrus', 'wrex']);
  const discount = await page.evaluate(async () => {
    const { upgradePrice } = await import('/src/state.js'); return upgradePrice(window.__RELAY_TEST__.getState(), 'medigel');
  });
  assert.equal(discount, 40); report.checks.push('Michel conclusion activates the 40-credit medi-gel price.');
  await capture('normandy-femshep');

  await travel('feros'); await mainBattle('feros:encounter-1');
  await operationStep('feros-water');
  await action('map').click(); await capture('local-map'); await action('close').click();
  for (const id of ['feros-water', 'feros-power', 'feros-geth-tunnels', 'feros-data-recovery']) await completeOperation(id);

  const final = await snapshot();
  assert.equal(Object.keys(final.operations.records).length, 11); assert.equal(report.steps.length, 43);
  assert.equal(report.encounters.filter(encounter => encounter.id.startsWith('operation:')).length, 4);
  assert.equal(report.encounters.length, 8);
  const effects = await page.evaluate(async () => { const { operationEffects } = await import('/src/operations.js'); return operationEffects(window.__RELAY_TEST__.getState()); });
  assert.deepEqual(effects, { medicalDiscount: .2, colonySupport: 3, researchRecovered: true });
  await action('journal').click(); await action('journal-tab', 'assignments').click(); await action('operation-filter', 'completed').click();
  await capture('operations-completed'); assert.equal(await page.locator('.operation-card.completed').count(), 11);
  await page.setViewportSize({ width: 390, height: 844 }); await capture('mobile-journal');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
  assert.equal(overflow, false); report.checks.push('Journal renders all eleven completed operations at 1440px and has no page overflow at 390px.');
  await action('close').click();
  await page.reload({ waitUntil: 'networkidle' }); await action('continue').click(); await idle();
  assert.deepEqual((await snapshot()).operations, final.operations);
  report.checks.push('All 43 operation steps and their chosen outcomes survive the final autosave reload.');
  report.outcomes = final.operations; report.effects = effects;
  report.assetErrors = await page.evaluate(() => window.__RELAY_TEST__.getWorld().assetErrors || []);
  assert.deepEqual(report.assetErrors, []); assert.deepEqual(report.errors, []); assert.deepEqual(report.failedRequests, []);
  report.passed = true;
} catch (error) {
  report.failure = error.stack;
  report.diagnostic = await page.evaluate(() => ({ zone: window.__RELAY_TEST__?.getState()?.zone, screen: window.__RELAY_TEST__?.getUI()?.screen, snapshot: window.__RELAY_TEST__?.snapshot() })).catch(() => null);
  await capture('operations-failure').catch(() => {});
  throw error;
} finally {
  await writeFile(new URL('operations-report.json', out), JSON.stringify(report, null, 2));
  await browser.close();
  console.log(JSON.stringify({ passed: report.passed, steps: report.steps.length, encounters: report.encounters.length, errors: report.errors, failedRequests: report.failedRequests }));
}
