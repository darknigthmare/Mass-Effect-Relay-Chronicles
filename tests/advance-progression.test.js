import test from 'node:test';
import assert from 'node:assert/strict';
import {
  newGame, encodeSave, decodeSave, confirmCampaignBriefing, canTravelCampaign, travelCampaign,
  trackCampaignMilestone, winEncounter, completeZone, recruit, setSquad, zoneEncounters,
} from '../src/state.js';
import { getCampaignMilestones, getTrackedCampaignObjective, renderCampaignMilestones,
  normalizeCampaignProgress, CAMPAIGN_MILESTONE_IDS } from '../src/advance-progression.js';
import { actorFor } from '../src/game-data.js';
import { createBattle, performAction } from '../src/combat.js';

const copy = value => JSON.parse(JSON.stringify(value));
const roundtrip = state => {
  const restored = decodeSave(encodeSave(state));
  assert.ok(restored);
  assert.deepEqual(restored, state);
  return restored;
};
const milestone = (state, id) => getCampaignMilestones(state).find(entry => entry.id === id);
function eden() {
  const state = newGame();
  assert.equal(confirmCampaignBriefing(state).ok, true);
  assert.equal(travelCampaign(state, 'eden-prime').ok, true);
  for (const id of zoneEncounters('eden-prime')) assert.equal(winEncounter(state, id), true);
  assert.equal(completeZone(state, 'eden-prime'), true);
  return state;
}
function spectre() {
  const state = eden();
  assert.equal(travelCampaign(state, 'normandy').ok, true);
  assert.equal(travelCampaign(state, 'citadel').ok, true);
  assert.equal(recruit(state, 'tali'), true);
  assert.equal(completeZone(state, 'citadel'), true);
  assert.equal(travelCampaign(state, 'normandy').ok, true);
  return state;
}

test('the complete dossier is persisted before the briefing and the journal shows its actual values', () => {
  const state = newGame({ name: 'Ari', appearance: 'female', origin: 'colonist', psychologicalProfile: 'war-hero', classId: 'adept' });
  const restored = roundtrip(state);
  const profile = milestone(restored, 'QST-profil-de-shepard');
  assert.equal(profile.status, 'complete');
  for (const label of ['Ari', 'Féminine', 'Colon', 'Héros de guerre', 'Adepte']) assert.match(profile.summary, new RegExp(label));
  assert.equal(milestone(restored, 'QST-briefing-normandy').status, 'active');
  assert.equal(milestone(restored, 'QST-deploiement-eden-prime').status, 'locked');
});

test('briefing and departure are gated, reward-free and idempotent under double validation', () => {
  const state = newGame();
  const initial = copy(state);
  assert.equal(travelCampaign(state, 'eden-prime').ok, false);
  assert.deepEqual(state, initial);
  assert.equal(confirmCampaignBriefing(state).changed, true);
  const briefed = copy(state);
  assert.deepEqual(confirmCampaignBriefing(state), { ok: true, changed: false });
  assert.deepEqual(state, briefed);
  assert.equal(travelCampaign(state, 'eden-prime').firstVisit, true);
  assert.deepEqual(state.party, ['shepard', 'kaidan', 'jenkins']);
  assert.equal(state.xp, initial.xp);
  assert.equal(state.credits, initial.credits);
  state.position = { x: 4, z: 5 };
  const deployed = copy(state);
  assert.deepEqual(travelCampaign(state, 'eden-prime'), { ok: true, changed: false, firstVisit: false });
  assert.deepEqual(state, deployed);
  assert.equal(confirmCampaignBriefing(state).ok, false);
  roundtrip(state);
});

test('the first encounter removes Jenkins permanently and adds Ashley once at its own gate', () => {
  const state = newGame();
  confirmCampaignBriefing(state); travelCampaign(state, 'eden-prime');
  assert.equal(recruit(state, 'ashley'), false);
  assert.equal(winEncounter(state, 'eden-prime:encounter-1'), true);
  assert.deepEqual(state.party, ['shepard', 'kaidan', 'ashley']);
  assert.deepEqual(state.lost, ['jenkins']);
  const after = copy(state);
  assert.equal(winEncounter(state, 'eden-prime:encounter-1'), false);
  assert.equal(recruit(state, 'ashley'), false);
  assert.deepEqual(state, after);
  const restored = roundtrip(state);
  assert.equal(milestone(restored, 'QST-perte-de-jenkins').status, 'complete');
  assert.equal(milestone(restored, 'QST-rencontre-d-ashley').status, 'complete');
  travelCampaign(restored, 'normandy');
  assert.equal(setSquad(restored, ['kaidan', 'jenkins']), false);
  assert.deepEqual(restored.lost, ['jenkins']);
});

test('healing and Unity operate on combat KO actors and cannot restore the narrative dead', () => {
  const state = spectre();
  const battle = createBattle({ party: state.party.map(id => actorFor(id, state)),
    enemies: [{ id: 'geth', name: 'Geth', hp: 100 }], medigel: state.medigel });
  const shepard = battle.actors.find(actor => actor.id === 'shepard');
  const kaidan = battle.actors.find(actor => actor.id === 'kaidan');
  shepard.atb = 100; kaidan.hp = 0;
  const result = performAction(battle, { actorId: 'shepard', actionId: 'unity', targetId: 'shepard' });
  assert.equal(result.ok, true);
  assert.ok(kaidan.hp > 0);
  shepard.atb = 100;
  kaidan.hp = Math.min(kaidan.hp, kaidan.maxHp / 2);
  const healed = performAction(battle, { actorId: 'shepard', actionId: 'medigel', targetId: 'kaidan' });
  assert.equal(healed.ok, true);
  assert.equal(battle.medigel, state.medigel - 1);
  assert.equal(battle.actors.some(actor => actor.id === 'jenkins'), false);
  assert.deepEqual(state.lost, ['jenkins']);
  roundtrip(state);
});

test('the beacon is unique and its journal waits for an actual extraction receipt', () => {
  const state = eden();
  assert.equal(state.campaignProgress.beaconReturned, false);
  assert.equal(milestone(state, 'QST-vision-de-la-balise').status, 'active');
  assert.match(milestone(state, 'QST-vision-de-la-balise').objective, /retourner au Normandy/);
  const before = copy(state);
  assert.equal(completeZone(state, 'eden-prime'), false);
  assert.deepEqual(state, before);
  assert.equal(travelCampaign(state, 'normandy').ok, true);
  assert.equal(state.campaignProgress.beaconReturned, true);
  const extracted = copy(state);
  travelCampaign(state, 'normandy');
  assert.deepEqual(state, extracted);
  const restored = roundtrip(state);
  assert.equal(milestone(restored, 'QST-vision-de-la-balise').status, 'complete');
  travelCampaign(restored, 'eden-prime'); travelCampaign(restored, 'normandy');
  assert.equal(restored.logs.filter(log => log.title === 'Vision de la balise').length, 1);
});

test('Spectre systems remain gated by the actual Council completion and each first route is free', () => {
  const before = eden();
  assert.equal(canTravelCampaign(before, 'therum').ok, false);
  assert.equal(milestone(before, 'QST-intronisation-spectre').status, 'active');
  for (const route of ['therum', 'feros', 'noveria']) {
    const state = spectre();
    assert.equal(milestone(state, 'QST-intronisation-spectre').status, 'complete');
    for (const candidate of ['therum', 'feros', 'noveria']) assert.equal(canTravelCampaign(state, candidate).ok, true);
    assert.equal(state.campaignProgress.commandDestination, null);
    assert.equal(travelCampaign(state, route).ok, true);
    assert.equal(state.campaignProgress.commandDestination, route);
    assert.equal(milestone(state, 'QST-commandement-du-normandy').status, 'complete');
    roundtrip(state);
    travelCampaign(state, 'normandy');
    const second = route === 'feros' ? 'noveria' : 'feros';
    travelCampaign(state, second);
    assert.equal(state.campaignProgress.commandDestination, route);
    assert.equal(state.logs.filter(log => log.title === 'Commandement du Normandy').length, 1);
  }
});

test('tracking is a persistent useful objective with a contextual POI and no completed stale marker', () => {
  const state = newGame();
  assert.equal(trackCampaignMilestone(state, 'QST-briefing-normandy').ok, true);
  assert.equal(getTrackedCampaignObjective(state).targetPoiId, 'normandy:briefing');
  const restored = roundtrip(state);
  assert.equal(getTrackedCampaignObjective(restored).id, 'QST-briefing-normandy');
  assert.equal(trackCampaignMilestone(restored, 'QST-commandement-du-normandy').ok, false);
  confirmCampaignBriefing(restored);
  assert.equal(getTrackedCampaignObjective(restored), null);
  trackCampaignMilestone(restored, 'QST-deploiement-eden-prime');
  assert.match(getTrackedCampaignObjective(restored).text, /Kaidan et Jenkins/);
  travelCampaign(restored, 'eden-prime');
  assert.equal(getTrackedCampaignObjective(restored), null);
  trackCampaignMilestone(restored, 'QST-perte-de-jenkins');
  assert.equal(getTrackedCampaignObjective(restored).targetPoiId, 'eden-prime:encounter-1');
  travelCampaign(restored, 'normandy');
  assert.equal(getTrackedCampaignObjective(restored).targetPoiId, null);
  assert.equal(getTrackedCampaignObjective(restored).targetZone, 'eden-prime');
  assert.equal(trackCampaignMilestone(restored, null).ok, true);
  assert.equal(getTrackedCampaignObjective(restored), null);
});

test('a tracked operation is released when selecting a campaign objective', () => {
  const state = newGame();
  assert.equal(trackCampaignMilestone(state, 'QST-briefing-normandy').ok, true);
  assert.equal(state.trackedOperation, null);
  const after = copy(state);
  assert.deepEqual(trackCampaignMilestone(state, 'QST-briefing-normandy'), { ok: true, changed: false });
  assert.deepEqual(state, after);
});

test('legacy receipts migrate from demonstrable visits, while explicit new data is never repaired', () => {
  const state = spectre(); travelCampaign(state, 'noveria');
  delete state.campaignProgress;
  const restored = decodeSave(encodeSave(state));
  assert.ok(restored);
  assert.equal(restored.campaignProgress.beaconReturned, true);
  assert.equal(restored.campaignProgress.commandDestination, 'noveria');
  assert.equal(restored.campaignProgress.trackedMilestone, null);
  for (const invalid of [null, false, [], {}, { version: 2 }, undefined]) {
    const malformed = copy(restored); malformed.campaignProgress = invalid;
    assert.equal(decodeSave({ format: 'relay-chronicles', version: 1, state: malformed }), null);
  }
});

test('forged future receipts and getters are refused before they can authorize any transition', () => {
  const state = newGame();
  for (const patch of [{ beaconReturned: true }, { commandDestination: 'therum' },
    { commandDestination: 'constructor' }, { trackedMilestone: 'QST-invented' }, { extra: true }]) {
    const malformed = copy(state); Object.assign(malformed.campaignProgress, patch);
    const before = copy(malformed);
    assert.equal(decodeSave({ format: 'relay-chronicles', version: 1, state: malformed }), null);
    assert.equal(confirmCampaignBriefing(malformed).ok, false);
    assert.equal(travelCampaign(malformed, 'eden-prime').ok, false);
    assert.deepEqual(malformed, before);
  }
  let reads = 0;
  const progress = { version: 1, beaconReturned: false, commandDestination: null,
    get trackedMilestone() { reads++; return null; } };
  assert.equal(normalizeCampaignProgress(progress, state), null);
  assert.equal(reads, 0);
});

test('the shared travel authority prevents an active timed mission from being abandoned', () => {
  const state = eden();
  state.missionProgress.records['eden-prime'] = { status: 'active', steps: [], remaining: 300, attempts: 1, channel: null };
  // A completed chapter may not retain an active mission record: reject the
  // whole inconsistent snapshot before reading the destination gate.
  const before = copy(state);
  assert.equal(canTravelCampaign(state, 'normandy').ok, false);
  assert.equal(travelCampaign(state, 'normandy').ok, false);
  assert.deepEqual(state, before);
  state.completed = [];
  const active = copy(state);
  assert.equal(canTravelCampaign(state, 'normandy').ok, false);
  assert.equal(travelCampaign(state, 'normandy').ok, false);
  assert.deepEqual(state, active);
});

test('journal text is escaped and milestone state never spills into a foreign work or period', () => {
  const state = newGame({ name: '<b>Ari</b>' });
  const html = renderCampaignMilestones(state);
  assert.match(html, /&lt;b&gt;Ari&lt;\/b&gt;/);
  assert.equal(html.includes('<b>Ari</b>'), false);
  for (const id of CAMPAIGN_MILESTONE_IDS) assert.ok(html.includes(`data-campaign-milestone="${id}"`));
  const foreign = { ...state, context: { mediaId: 'ME2', periodId: 'me2' } };
  assert.deepEqual(getCampaignMilestones(foreign), []);
  assert.equal(renderCampaignMilestones(foreign), '');
  assert.equal(getTrackedCampaignObjective(foreign), null);
  assert.equal(travelCampaign(foreign, 'normandy').ok, false);
});

test('the historical Feros completion boundary records unknown civilian outcomes without inventing modern progress', () => {
  const state = spectre(); travelCampaign(state, 'feros');
  for (const id of zoneEncounters('feros')) assert.equal(winEncounter(state, id), true);
  assert.equal(completeZone(state, 'feros', 'save'), true);
  assert.equal(state.advanceFeros.legacy, true);
  assert.equal(state.advanceFeros.cipher, false);
  assert.ok(Object.values(state.advanceFeros.colonists).every(value => value === null));
  roundtrip(state);
  const malformed = copy(state); malformed.advanceFeros = null;
  assert.equal(decodeSave({ format: 'relay-chronicles', version: 1, state: malformed }), null);
});

test('starting the modern Feros path prevents the compatibility boundary from bypassing its remaining conditions', () => {
  const state = spectre(); travelCampaign(state, 'feros');
  assert.equal(winEncounter(state, 'feros:encounter-1'), true);
  state.advanceFeros.defense = true;
  for (const id of zoneEncounters('feros').slice(1)) assert.equal(winEncounter(state, id), true);
  const before = copy(state);
  assert.equal(completeZone(state, 'feros', 'save'), false);
  assert.deepEqual(state, before);
  assert.equal(state.advanceFeros.legacy, false);
  roundtrip(state);
});

test('modern Feros completion refuses an outcome contradicting the sixteen recorded civilians before any reward or mutation', () => {
  for (const spared of [false, true]) {
    const state = spectre(); travelCampaign(state, 'feros');
    for (const id of zoneEncounters('feros')) assert.equal(winEncounter(state, id), true);
    // A valid declared native snapshot isolates the chapter transaction from
    // the separately tested field interactions and their spatial controls.
    state.advanceFeros = { ...state.advanceFeros, defense: true, lizbeth: true, investigation: true,
      valves: 26, shipReleased: true, jeong: 'killed', gasIssued: true,
      colonists: Object.fromEntries(Object.keys(state.advanceFeros.colonists).map((id, index) => [id, spared && index === 0 ? 'gas' : 'lethal'])),
      freighterOpened: true, cipher: true, shiala: 'spared' };
    roundtrip(state);
    const before = copy(state), correct = spared ? 'save' : 'force', incorrect = spared ? 'force' : 'save';
    assert.equal(completeZone(state, 'feros', incorrect), false);
    assert.deepEqual(state, before);
    assert.equal(completeZone(state, 'feros', correct), true);
    roundtrip(state);
    const forged = copy(state); forged.choices.feros = incorrect;
    assert.equal(decodeSave({ format: 'relay-chronicles', version: 1, state: forged }), null);
    const completed = copy(state);
    assert.equal(completeZone(state, 'feros', correct), false);
    assert.deepEqual(state, completed);
  }
});
