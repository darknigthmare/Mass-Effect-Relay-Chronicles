import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const baseURL = process.env.GAME_URL || 'http://127.0.0.1:4173';
const out = new URL('../test-results/', import.meta.url);
await mkdir(out, { recursive: true });
const report = {
  passed: false, at: new Date().toISOString(), stage: 'launch', checks: [], encounters: [],
  mode: 'Real conversations, recruitment and campaign callbacks; accelerated combat time without progression or statistic overrides',
  errors: [], failedRequests: [],
};
let browser, page;
const action = (name, id) => page.locator(`[data-do="${name}"]${id ? `[data-id="${id}"]` : ''}`);
const conversation = id => page.locator(`[data-conversation-id="${id}"]`);

async function idle(zone) {
  await page.waitForFunction(expected => {
    const qa = window.__RELAY_TEST__;
    return qa?.getState() && !qa.getUI().busy && (!expected || qa.getState().zone === expected);
  }, zone || null, { polling: 100, timeout: 60000 });
}

async function stateSnapshot() {
  return page.evaluate(() => structuredClone(window.__RELAY_TEST__.getState()));
}

async function worldSnapshot() {
  return page.evaluate(() => {
    const world = window.__RELAY_TEST__.getWorld();
    return {
      zone: window.__RELAY_TEST__.getState().zone,
      authoredPOICount: world.getPOIs().length,
      interactive: world.getInteractivePOIs().map(poi => poi.id),
      markers: world.poiViews.map(view => view.poi.id),
      actors: [...world.actors, ...world.ambientActors].map(actor => ({ id: actor.id, key: actor.key })),
    };
  });
}

async function codexIds() {
  return page.evaluate(async () => {
    const { getCodexEntries } = await import('/src/story.js');
    return getCodexEntries(window.__RELAY_TEST__.getState()).map(entry => entry.id);
  });
}

async function interact(id) {
  await page.evaluate(selected => window.__RELAY_TEST__.interact(selected), id);
}

async function clickChoice(index = 0) {
  await page.locator(`[data-do="dialogue-choice"][data-index="${index}"]`).click();
  await idle();
}

async function closeConversation(id) {
  if (await conversation(id).locator('[data-conversation-back]').count()) {
    await conversation(id).locator('[data-conversation-back]').click();
  }
  await conversation(id).locator('[data-conversation-end]').click();
  await page.waitForFunction(() => window.__RELAY_TEST__.getUI().screen === null, null, { polling: 100 });
}

async function openFromCrew(id) {
  await action('squad').first().click();
  await action('conversation', id).click();
  await conversation(id).waitFor({ state: 'visible' });
}

async function readTopic(id, topicId) {
  await conversation(id).locator(`[data-topic-id="${topicId}"]`).click();
  assert.equal(await conversation(id).getAttribute('data-current-topic'), topicId);
  assert.ok((await conversation(id).locator('.dialogue-text').innerText()).trim(), 'The selected topic has readable content');
  const state = await stateSnapshot();
  assert.ok(state.story.heard.includes(`${id}:${topicId}`), `The heard topic ${id}:${topicId} is recorded`);
}

async function deploy(zone) {
  await idle('normandy');
  await interact('normandy:galaxy');
  await action('planet', zone).click();
  await action('travel', zone).click();
  await idle(zone);
}

async function finishZone(zone) {
  await interact(`${zone}:objective`);
  await clickChoice();
  await clickChoice();
  await idle('normandy');
  assert.ok((await stateSnapshot()).completed.includes(zone), `The ${zone} objective really completed`);
}

async function validateSave() {
  await page.evaluate(async () => {
    const { encodeSave, decodeSave } = await import('/src/state.js');
    const original = window.__RELAY_TEST__.getState();
    const decoded = decodeSave(encodeSave(original));
    if (!decoded) throw new Error('Story progression no longer survives save validation.');
    if (JSON.stringify(decoded.story) !== JSON.stringify(original.story)) throw new Error('The story record changed during save roundtrip.');
  });
}

async function battle(id) {
  report.stage = `combat:${id}`;
  await page.evaluate(selected => window.__RELAY_TEST__.startBattle(selected), id);
  // This is the same deterministic action policy as campaign-browser.mjs.
  // Only simulated time advances faster; all actions, costs and victories use the game rules.
  const result = await page.evaluate(async () => {
    const { getActions, performAction, tickBattle, summarizeBattle } = await import('/src/combat.js');
    const qa = window.__RELAY_TEST__, battle = qa.getBattle();
    if (!battle) throw new Error('The legitimate encounter did not start.');
    let iterations = 0;
    while (!battle.winner && iterations++ < 6000) {
      for (const actor of battle.actors.filter(actor => actor.team === 'party' && actor.hp > 0)) {
        const available = getActions(battle, actor.id).filter(action => action.available);
        if (!available.length) continue;
        const party = battle.actors.filter(member => member.team === 'party');
        const enemies = battle.actors.filter(enemy => enemy.team === 'enemy' && enemy.hp > 0);
        const target = enemies.find(enemy => !enemy.statuses.stasis) || enemies[0];
        if (!target) break;
        const low = party.filter(member => member.hp > 0).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
        const priorities = [];
        if (party.some(member => member.hp <= 0)) priorities.push(['unity', actor.id]);
        if (low.hp / low.maxHp < .42) priorities.push(['medigel', low.id]);
        if (target.shield > 0) priorities.push(['overload', target.id]);
        if (target.statuses.lift > 0 || target.statuses.singularity > 0) priorities.push(['throw', target.id]);
        priorities.push(['signature', target.id], ['warp', target.id], ['burst', target.id], ['shoot', target.id], ['throw', target.id], ['overload', target.id], ['barrier', actor.id], ['cover', actor.id]);
        for (const [actionId, targetId] of priorities) {
          if (!available.some(action => action.id === actionId)) continue;
          if (performAction(battle, { actorId: actor.id, actionId, targetId }).ok) break;
        }
      }
      tickBattle(battle, .5);
    }
    qa.step(.001);
    return { ...summarizeBattle(battle), iterations };
  });
  assert.equal(result.winner, 'party', `Legitimate victory at ${id}`);
  assert.ok(result.actionCount > 0, 'Victory required actual actions');
  await action('claim-victory').click();
  if (id === 'eden-prime:encounter-1') await clickChoice();
  assert.ok((await stateSnapshot()).cleared.includes(id), 'Claiming the victory records the encounter');
  await validateSave();
  report.encounters.push({ id, winner: result.winner, actions: result.actionCount });
  console.log(JSON.stringify(report.encounters.at(-1)));
}

async function screenshot(name) {
  await page.screenshot({ path: fileURLToPath(new URL(`story-${name}.png`, out)), timeout: 60000 });
}

try {
  browser = await chromium.launch({
    headless: true,
    ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {}),
    args: ['--no-sandbox', '--no-zygote', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  page = await context.newPage();
  page.setDefaultTimeout(60000);
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('requestfailed', request => report.failedRequests.push(`${request.url()}: ${request.failure()?.errorText}`));
  page.on('response', response => { if (response.status() >= 400) report.failedRequests.push(`${response.status()} ${response.url()}`); });

  report.stage = 'creation';
  await page.goto(`${baseURL}/?qa`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /Nouvelle campagne/ }).click();
  await page.locator('#commander-name').fill('Alex Shepard');
  await page.locator('#new-appearance').selectOption('female');
  await page.locator('#new-origin').selectOption('colonist');
  await page.locator('#new-profile').selectOption('war-hero');
  await page.locator('#new-difficulty').selectOption('normal');
  await page.getByRole('button', { name: /Commencer l’aventure/ }).click();
  await page.getByRole('button', { name: 'Je rejoins le briefing.' }).click();
  await idle('normandy');
  assert.ok(!(await codexIds()).includes('spectre'), 'Spectre dossier is not known before the conversation');
  assert.ok(!(await codexIds()).includes('asari'), 'Asari dossier is not disclosed before Therum');

  report.stage = 'nihlus-before-eden-prime';
  assert.ok((await worldSnapshot()).interactive.includes('normandy:talk-nihlus'));
  await interact('normandy:talk-nihlus');
  await readTopic('nihlus', 'spectres');
  assert.ok((await codexIds()).includes('spectre'), 'The Spectre topic unlocks its codex entry');
  await screenshot('nihlus-spectres');
  await closeConversation('nihlus');

  report.stage = 'kaidan-implants';
  await openFromCrew('kaidan');
  await readTopic('kaidan', 'implants');
  assert.ok((await codexIds()).includes('biotic'), 'Kaidan unlocks the biotic dossier');
  await closeConversation('kaidan');
  report.checks.push('Nihlus is present before departure; reading Spectres and Kaidan L2 topics records heard subjects and unlocks codex dossiers');

  report.stage = 'eden-prime';
  await interact('normandy:briefing');
  await clickChoice();
  await action('travel', 'eden-prime').click();
  await idle('eden-prime');
  assert.ok((await stateSnapshot()).story.visitedZones.includes('eden-prime'), 'The first landing is recorded before any encounter or mission completion');
  for (const suffix of ['encounter-1', 'encounter-2', 'boss']) await battle(`eden-prime:${suffix}`);
  await finishZone('eden-prime');
  assert.deepEqual((await stateSnapshot()).party, ['shepard', 'kaidan', 'ashley']);
  report.checks.push('Three real Eden Prime encounters, Ashley recruitment and the beacon objective complete without progression overrides');

  report.stage = 'optional-recruitment';
  await deploy('citadel');
  for (const suffix of ['encounter-1', 'boss']) {
    await interact(`citadel:${suffix}`);
    await clickChoice(1);
  }
  let state = await stateSnapshot();
  assert.ok(!state.recruited.includes('garrus') && !state.recruited.includes('wrex'), 'Deferring both optional companions does not recruit them');
  await interact('citadel:encounter-2');
  await clickChoice();
  state = await stateSnapshot();
  assert.ok(state.recruited.includes('tali'), 'The evidence carrier is actually recruited');
  await finishZone('citadel');
  state = await stateSnapshot();
  assert.equal(state.flags.spectre, true, 'Tali evidence permits the Council audience without Garrus or Wrex');
  assert.deepEqual(state.party, ['shepard', 'kaidan', 'ashley']);
  assert.ok(!state.recruited.includes('garrus') && !state.recruited.includes('wrex'));
  const withoutOptionalCrew = await worldSnapshot();
  for (const id of ['garrus', 'wrex', 'nihlus', 'liara']) {
    assert.ok(!withoutOptionalCrew.interactive.includes(`normandy:talk-${id}`), `${id} has no unavailable conversation marker`);
    assert.ok(!withoutOptionalCrew.actors.some(actor => actor.key === id), `${id} is not rendered aboard before recruitment or after departure`);
  }
  await action('squad').first().click();
  for (const id of ['garrus', 'wrex', 'liara']) assert.equal(await action('conversation', id).count(), 0);
  await action('close').click();
  await screenshot('normandy-without-optional-crew');
  report.checks.push('Garrus and Wrex can be deferred; Tali evidence alone completes the Council audience; unrecruited companions and departed Nihlus have no Normandy actors or conversation markers');

  report.stage = 'post-prologue-conversations';
  await interact('normandy:talk-joker');
  await readTopic('joker', 'eden-prime-report');
  await closeConversation('joker');
  await interact('normandy:talk-chakwas');
  await readTopic('chakwas', 'vision');
  await closeConversation('chakwas');
  report.checks.push('Joker and Chakwas expose post-prologue subjects after the beacon mission');

  report.stage = 'late-recruitment';
  await deploy('citadel');
  for (const suffix of ['encounter-1', 'boss']) {
    await interact(`citadel:${suffix}`);
    await clickChoice();
  }
  state = await stateSnapshot();
  assert.ok(state.recruited.includes('garrus') && state.recruited.includes('wrex'), 'Both optional companions remain recruitable after the Council');
  await interact('citadel:exit');
  await clickChoice();
  await idle('normandy');
  const recruitedCrew = await worldSnapshot();
  for (const id of ['garrus', 'wrex']) {
    assert.ok(recruitedCrew.interactive.includes(`normandy:talk-${id}`));
    assert.ok(recruitedCrew.actors.some(actor => actor.key === id));
  }
  report.checks.push('Late recruitment after becoming a Spectre unlocks the appropriate Normandy actors and conversations');

  report.stage = 'garrus-persistent-opinion';
  await openFromCrew('garrus');
  assert.equal(await conversation('garrus').locator('[data-topic-id="followup"]').count(), 0, 'The follow-up is locked before the opinion choice');
  await readTopic('garrus', 'procedure');
  await conversation('garrus').locator('[data-reply-id="procedure"]').click();
  assert.equal((await stateSnapshot()).story.choices['garrus:procedure'], 'procedure');
  assert.equal(await conversation('garrus').getAttribute('data-selected-reply'), 'procedure');
  assert.ok((await conversation('garrus').locator('.dialogue-note').innerText()).trim());
  await conversation('garrus').locator('[data-conversation-back]').click();
  assert.equal(await conversation('garrus').locator('[data-topic-id="followup"]').count(), 1, 'The chosen opinion unlocks the follow-up subject');
  await readTopic('garrus', 'followup');
  await screenshot('garrus-followup');
  await closeConversation('garrus');
  await validateSave();
  const savedStory = (await stateSnapshot()).story;
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /Reprendre/ }).click();
  await idle('normandy');
  assert.deepEqual((await stateSnapshot()).story, savedStory, 'Heard topics, visited zones, codex and replies survive a real browser reload');
  await openFromCrew('garrus');
  await readTopic('garrus', 'procedure');
  assert.equal(await conversation('garrus').getAttribute('data-selected-reply'), 'procedure');
  assert.equal(await conversation('garrus').locator('[data-reply-id]').count(), 0, 'A recorded opinion is not offered for replacement');
  assert.ok((await conversation('garrus').locator('.dialogue-note').innerText()).includes('Votre réponse'));
  await closeConversation('garrus');
  report.checks.push('Garrus remembers the procedure opinion, unlocks its follow-up and preserves the choice and story record across autosave/reload');

  report.stage = 'recruited-companion-rendering';
  await action('squad').first().click();
  for (const id of ['kaidan', 'ashley', 'garrus', 'wrex']) await action('crew-select', id).click();
  await action('crew-confirm').click();
  assert.deepEqual((await stateSnapshot()).party, ['shepard', 'garrus', 'wrex'], 'Real squad selection replaces Kaidan and Ashley with Garrus and Wrex');
  await deploy('citadel');
  const citadelCrew = await worldSnapshot();
  assert.equal(citadelCrew.authoredPOICount, 7, 'Recruitment filtering preserves the seven authored Citadel points');
  for (const id of ['garrus', 'wrex']) {
    assert.equal(citadelCrew.actors.filter(actor => actor.key === id).length, 1, `${id} has only the active squad actor on the Citadel`);
  }
  assert.equal(citadelCrew.actors.filter(actor => actor.key === 'tali').length, 0, 'Recruited Tali is not left at her former Citadel recruitment location');
  for (const id of ['citadel:encounter-1', 'citadel:encounter-2', 'citadel:boss']) {
    assert.ok(!citadelCrew.interactive.includes(id), `The completed recruitment ${id} is no longer interactive`);
    assert.ok(!citadelCrew.markers.includes(id), `The completed recruitment ${id} has no obsolete marker`);
  }
  await screenshot('citadel-recruited-companions');
  await interact('citadel:exit');
  await clickChoice();
  await idle('normandy');
  const normandyCrew = await worldSnapshot();
  assert.equal(normandyCrew.authoredPOICount, 7, 'Normandy keeps its seven authored service points');
  for (const id of ['kaidan', 'ashley', 'garrus', 'tali', 'wrex']) {
    assert.equal(normandyCrew.actors.filter(actor => actor.key === id).length, 1, `${id} has exactly one actor aboard the Normandy after the round trip`);
  }
  assert.deepEqual((await stateSnapshot()).party, ['shepard', 'garrus', 'wrex']);
  await validateSave();
  report.checks.push('Selecting Garrus and Wrex creates one actor per companion on the Citadel and Normandy; recruited companions leave no duplicate Citadel actors or obsolete recruitment markers');

  report.stage = 'codex-search';
  await interact('normandy:archive');
  const codexEntry = id => action('codex-entry', id);
  assert.equal(await codexEntry('spectre').count(), 1);
  assert.equal(await codexEntry('biotic').count(), 1);
  assert.equal(await codexEntry('asari').count(), 0, 'The UI does not expose the Asari dossier before Therum');
  await page.locator('#codex-search').fill('COSMODESIQUES');
  assert.equal(await codexEntry('relay').count(), 1, 'Case- and accent-insensitive search finds Relais cosmodésiques');
  await codexEntry('relay').click();
  assert.match(await page.locator('.codex-article h3').innerText(), /relais/i);
  await screenshot('codex-accent-search');
  await page.locator('#codex-search').fill('aucune-archive-ne-porte-ce-nom');
  assert.equal(await action('codex-entry').count(), 0);
  assert.equal(await page.locator('.codex-article').count(), 0, 'An empty search does not leave a previous article visible');
  assert.ok((await page.locator('.codex-empty').innerText()).trim());
  await page.locator('#codex-search').fill('');
  assert.equal(await codexEntry('asari').count(), 0);
  await action('close').click();
  await validateSave();
  report.checks.push('Progressive codex exposes learned dossiers, hides unencountered Asari, supports accent-insensitive search and clears stale articles on empty results');

  assert.equal(report.encounters.length, 3);
  assert.deepEqual(report.errors, [], 'No uncaught browser errors');
  assert.deepEqual(report.failedRequests, [], 'No failed requests or HTTP errors');
  report.stage = 'complete';
  report.passed = true;
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  report.failure = error.stack || String(error);
  if (page) {
    report.diagnostic = await Promise.race([
      page.evaluate(() => ({
        zone: window.__RELAY_TEST__?.getState()?.zone,
        busy: window.__RELAY_TEST__?.getUI()?.busy,
        screen: window.__RELAY_TEST__?.getUI()?.screen,
        story: window.__RELAY_TEST__?.getState()?.story,
        visibility: document.visibilityState,
      })).catch(() => null),
      new Promise(resolve => setTimeout(() => resolve({ unavailable: true }), 5000)),
    ]);
    await screenshot('failure').catch(() => {});
  }
  throw error;
} finally {
  await browser?.close();
  await writeFile(new URL('story-report.json', out), `${JSON.stringify(report, null, 2)}\n`);
}
