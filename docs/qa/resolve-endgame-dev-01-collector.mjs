// The identical public path is used in DEV and production. Fixtures explicitly
// prepare earlier encounters and positions; no private state or clock is read.
import assert from 'node:assert/strict';
import { runPublicProof } from './resolve-browser-proof.mjs';
import { newGame, recruit, winEncounter, completeZone, zoneEncounters } from '../src/state.js';
import { advanceMission } from '../src/mission-progress.js';
import { WORLD_ZONES } from '../src/world-data.js';
import { endgameReport } from '../src/resolve-endgame.js';

function finish(state, zone, choice) {
  state.zone = zone; state.position = null;
  if (zone === 'citadel') assert.equal(recruit(state, 'tali'), true);
  else for (const id of zoneEncounters(zone)) assert.equal(winEncounter(state, id), true, id);
  assert.equal(completeZone(state, zone, choice), true, zone);
}
function atObjective(state, zone) {
  const poi = WORLD_ZONES[zone].pois.find(item => item.id === `${zone}:objective`);
  assert.ok(poi); state.zone = zone; state.position = { x: poi.x, z: poi.z + .5 }; return state;
}
function ilosFixture() {
  const state = newGame({ name: 'QA Resolve fin ME1', difficulty: 'story' }); state.flags.briefed = true;
  for (const [zone, choice] of [['eden-prime'], ['citadel'], ['therum'], ['feros', 'save'], ['noveria', 'release'], ['virmire', 'save-kaidan']]) finish(state, zone, choice);
  state.zone = 'ilos'; for (const id of zoneEncounters('ilos')) assert.equal(winEncounter(state, id), true);
  return atObjective(state, 'ilos');
}
function finaleFixture(received) {
  const state = structuredClone(received); state.zone = 'ilos'; state.position = null;
  const record = state.missionProgress.records.ilos;
  if (record.status === 'idle') assert.equal(advanceMission(state, 'ilos', 'start').ok, true);
  if (!state.missionProgress.records.ilos.steps.includes('vigil')) assert.equal(advanceMission(state, 'mission:ilos:vigil', 'activate').ok, true);
  if (!state.missionProgress.records.ilos.steps.includes('conduit')) assert.equal(advanceMission(state, 'mission:ilos:conduit', 'enter').ok, true);
  assert.equal(completeZone(state, 'ilos'), true);
  state.zone = 'citadel-finale'; for (const id of zoneEncounters(state.zone)) assert.equal(winEncounter(state, id), true);
  return atObjective(state, 'citadel-finale');
}

await runPublicProof({ family: 'endgame', collector: import.meta.url, run: async api => {
  const { page, click, ready, capture, check, fixture, imported, exported } = api;
  const reply = id => click(`.dialogue[data-conversation-id="resolve-vigil"] [data-reply-id="${id}"]`);
  const openCodex = async () => { await ready(); await page.keyboard.press('Escape'); await click('[data-do="codex"]'); await page.locator('#codex-search').fill('Vigil'); };
  const closeCodex = async () => { await click('[data-do="close"]'); await ready(); };
  await imported(await fixture(ilosFixture(), 'ilos-before-vigil', {
    kind: 'Declared native preparation of earlier chapters and cleared Ilos, with position at its existing objective.',
    APIs: ['newGame', 'briefed=true', 'recruit(tali)', 'winEncounter', 'completeZone', 'WORLD_ZONES objective position'],
    precedingCampaignPlayed: false,
  }));
  await openCodex();
  assert.equal(await page.locator('#codex-results').getByText('Vigil · le Conduit et les commandes', { exact: true }).count(), 0);
  check('Vigil’s new knowledge is absent before the actual exchange', true);
  await closeCodex(); await page.keyboard.press('KeyE');
  await page.locator('.dialogue[data-conversation-id="resolve-vigil"]').waitFor();
  await reply('history'); await capture('vigil-prothean-history', '.dialogue[data-conversation-id="resolve-vigil"]'); await reply('keepers'); await reply('questions'); await reply('data'); await reply('receive');
  const mission = page.locator('.dialogue[data-mission-id="ilos"]');
  if (await mission.count()) await click('.dialogue[data-mission-id="ilos"] [data-mission-choice="leave"]');
  await ready();
  const receipt = await exported('vigil-received');
  assert.equal(receipt.state.resolveEndgame.vigilExchange, true);
  await openCodex();
  await page.locator('#codex-results').getByText('Vigil · le Conduit et les commandes', { exact: true }).waitFor();
  await page.locator('#codex-results').getByText('Vigil · le cycle des Moissonneurs', { exact: true }).waitFor();
  await click('[data-do="codex-entry"][data-id="vigil-conduit"]');
  await capture('vigil-unlocked-codex', '#codex-results'); await closeCodex();
  check('Explicit receipt persists and opens the two sourced Vigil dossiers', true, { export: receipt.path });

  const prepared = finaleFixture(receipt.state);
  for (const [order, representative, fleetLabel, label] of [
    ['save-council', 'anderson', 'Secourir le Conseil.', 'saved-council-anderson'],
    ['focus-sovereign', 'udina', 'Concentrer la flotte sur Sovereign.', 'destroyed-council-udina'],
  ]) {
    await imported(await fixture(structuredClone(prepared), `finale-${label}`, {
      kind: 'Declared native completion of the Conduit and three finale encounters after the real exported Vigil receipt.',
      APIs: ['actual public Vigil export', 'advanceMission(start/activate/enter)', 'completeZone(ilos)', 'winEncounter ×3', 'WORLD_ZONES objective position'],
      conduitRacePlayed: false, finaleBattlesPlayed: false,
    }));
    await page.keyboard.press('KeyE'); await click(`.dialogue button:text-is("${fleetLabel}")`);
    await click(`.dialogue [data-reply-id="${representative}"]`);
    await page.locator('[data-do="return-normandy"]').waitFor();
    await capture(label, '[data-resolve-epilogue]');
    const result = await exported(label, 'campaign');
    assert.equal(result.record.endgameReport.fleetOrder, order);
    assert.equal(result.record.endgameReport.humanRepresentative, representative);
    assert.equal(result.record.endgameReport.councilFate, order === 'save-council' ? 'saved' : 'destroyed');
    assert.equal(result.record.endgameReport.futurePresence, 'undetermined');
    check(`Public fleet order and ${representative} nomination agree with the actual campaign export`, true, { export: result.path });
    await click('[data-do="return-normandy"]'); await ready();
  }
  await page.reload({ waitUntil: 'domcontentloaded' }); await click('[data-do="continue"]'); await ready();
  const resumed = await exported('udina-ending-after-reload');
  assert.deepEqual(endgameReport(resumed.state), { vigilExchange: true, fleetOrder: 'focus-sovereign', councilFate: 'destroyed', humanRepresentative: 'udina', futurePresence: 'undetermined' });
  check('An actual page reload keeps the human nomination separate from the fleet order', true, { export: resumed.path });
} });
