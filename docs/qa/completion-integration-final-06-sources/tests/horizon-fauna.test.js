import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { HORIZON_FAUNA, HORIZON_FAUNA_IDS, HORIZON_FAUNA_ENEMIES, normalizeHorizonFaunaAtlas,
  getHorizonFaunaFrame, getHorizonFaunaCombatVisual, horizonFaunaVisible, listHorizonFauna,
  getHorizonFaunaReferenceVisual } from '../src/horizon-fauna.js';
import { OPERATIONS, OPERATION_ENCOUNTERS, listOperations, normalizeOperations, advanceOperation,
  getOperationEncounter, finishOperationBattle, operationEffects } from '../src/operations.js';
import { newGame, winEncounter, completeZone, recruit, zoneEncounters, encodeSave, decodeSave } from '../src/state.js';
import { ENEMIES, actorFor } from '../src/game-data.js';
import { createBattle, tickBattle, getActions, performAction } from '../src/combat.js';

const atlas = JSON.parse(readFileSync(new URL('../public/assets/horizon-fauna.json', import.meta.url)));
const scope = (mediaId = 'ME1', periodId = 'me1') => ({ mediaId, periodId });
const current = state => listOperations(state).find(entry => entry.id === 'feros-varrens');
function preparedFeros() {
  const state = newGame({ difficulty: 'story' }); state.flags.briefed = true;
  state.zone = 'eden-prime';
  for (const id of zoneEncounters('eden-prime')) assert.equal(winEncounter(state, id), true);
  assert.equal(completeZone(state, 'eden-prime'), true); state.zone = 'citadel';
  assert.equal(recruit(state, 'tali'), true); assert.equal(completeZone(state, 'citadel'), true);
  state.zone = 'feros'; assert.equal(winEncounter(state, 'feros:encounter-1'), true);
  return state;
}
function roundtrip(state) { const restored = decodeSave(encodeSave(state)); assert.ok(restored); assert.deepEqual(restored.operations, state.operations); return restored; }

test('eight fauna drawings have explicit work/period roles; no decorative pet creates an actor', () => {
  assert.equal(HORIZON_FAUNA_IDS.length, 8); assert.equal(new Set(HORIZON_FAUNA_IDS).size, 8);
  assert.deepEqual(HORIZON_FAUNA.filter(entry => entry.role === 'combat').map(entry => entry.id), ['varren-me1', 'alpha-varren-me1']);
  assert.deepEqual(HORIZON_FAUNA.filter(entry => entry.role === 'ambient').map(entry => entry.id), ['gasbag-me1']);
  assert.ok(HORIZON_FAUNA.every(entry => entry.partial === true && entry.status === 'Prototype'));
  assert.equal(HORIZON_FAUNA.some(entry => /hamster|KEI|tempest/i.test(entry.name)), false);
  for (const [key, profile] of Object.entries(HORIZON_FAUNA_ENEMIES)) {
    assert.equal(ENEMIES[key], profile); assert.equal(profile.synthetic, false); assert.equal(profile.shield, 0);
    assert.deepEqual(profile.powers, []); assert.equal(profile.primaryAction, 'strike');
  }
});

test('native atlas geometry is copied, complete, non-overlapping and fails closed on a foreign identity', () => {
  const valid = normalizeHorizonFaunaAtlas(atlas); assert.ok(valid); assert.ok(Object.isFrozen(valid.frames));
  const frame = getHorizonFaunaFrame('varren-me1', valid); assert.ok(frame.file && frame.width && frame.height);
  assert.notEqual(frame.rect, atlas.frames['varren-me1'].rect);
  for (const change of [copy => { copy.file = '../wrong.png'; }, copy => { copy.frames['varren-me1'].periodId = 'me2'; },
    copy => { copy.frames['varren-me1'].rect = [-1, 0, 100, 100]; },
    copy => { copy.frames['alpha-varren-me1'].rect = [...copy.frames['varren-me1'].rect]; },
    copy => { delete copy.frames['gasbag-me1']; }]) {
    const copy = structuredClone(atlas); change(copy); assert.equal(normalizeHorizonFaunaAtlas(copy), null);
  }
  assert.equal(getHorizonFaunaFrame('__proto__', atlas), null);
});

test('dossier illustrations require the exact record, work and period; no later fauna leaks into ME1', () => {
  for (const entry of HORIZON_FAUNA.filter(entry => entry.recordIds.length)) {
    const id = entry.recordIds[0]; assert.ok(getHorizonFaunaReferenceVisual(id, scope(entry.mediaId, entry.periodId), atlas));
    assert.equal(getHorizonFaunaReferenceVisual(id, scope('ME4', 'me4'), atlas), null);
    assert.equal(getHorizonFaunaReferenceVisual(id, { mediaId: entry.mediaId }, atlas), null);
    assert.equal(getHorizonFaunaReferenceVisual(id, scope(entry.mediaId, 'wrong'), atlas), null);
    if (entry.mediaId !== 'ME1') assert.equal(getHorizonFaunaReferenceVisual(id, scope(), atlas), null);
  }
  let invoked = false;
  const getter = { periodId: 'me1', get mediaId() { invoked = true; return 'ME1'; } };
  assert.equal(getHorizonFaunaReferenceVisual('ENM-varren', getter, atlas), null); assert.equal(invoked, false);
  assert.equal(getHorizonFaunaReferenceVisual('unknown', scope(), atlas), null);
});

test('ME1 knowledge follows visits and the Davin briefing, and a thresher dossier never grants a world spawn', () => {
  const state = newGame(), before = structuredClone(state); assert.deepEqual(listHorizonFauna(scope(), state), []); assert.deepEqual(state, before);
  state.story.visitedZones.push('eden-prime'); assert.deepEqual(listHorizonFauna(scope(), state).map(entry => entry.id), ['gasbag-me1']);
  state.completed.push('citadel'); state.flags.spectre = true;
  assert.ok(listHorizonFauna(scope(), state).some(entry => entry.id === 'thresher-me1'));
  assert.equal(horizonFaunaVisible('thresher-me1', { ...scope(), zone: 'therum' }), false);
  state.story.visitedZones.push('feros'); assert.ok(listHorizonFauna(scope(), state).some(entry => entry.id === 'varren-me1'));
  assert.equal(listHorizonFauna(scope(), state).some(entry => entry.id === 'alpha-varren-me1'), false);
  state.operations.records['feros-varrens'] = { stage: 1 };
  assert.ok(listHorizonFauna(scope(), state).some(entry => entry.id === 'alpha-varren-me1'));
  assert.equal(horizonFaunaVisible('gasbag-me1', { ...scope(), zone: 'eden-prime' }), true);
  assert.equal(horizonFaunaVisible('gasbag-me1', { ...scope('ME2', 'me2'), zone: 'eden-prime' }), false);
  assert.equal(horizonFaunaVisible('gasbag-me1', { ...scope(), zone: 'eden-prime', campaignState: { mediaId: 'ME2' } }), false);
  assert.equal(horizonFaunaVisible('gasbag-me1', { ...scope(), zone: 'eden-prime', context: { periodId: 'me3' } }), false);
  assert.equal(horizonFaunaVisible('varren-me1', { ...scope(), zone: 'feros', campaignState: state }), true);
  state.cleared.push('feros:boss'); assert.equal(horizonFaunaVisible('varren-me1', { ...scope(), zone: 'feros', campaignState: state }), false);
});

test('only the native optional pack IDs grant body crops, with both actor and state scopes guarded', () => {
  const actor = { id: 'feros-varrens-pack-0', key: 'varren', enemy: true,
    state: { id: 'feros-varrens-pack-0', sprite: 'varren', team: 'enemy' } };
  assert.equal(getHorizonFaunaCombatVisual(actor, atlas)?.id, 'varren-me1');
  const alpha = { id: 'feros-varrens-pack-2', key: 'alpha-varren', enemy: true,
    state: { id: 'feros-varrens-pack-2', sprite: 'alpha-varren', team: 'enemy' } };
  assert.equal(getHorizonFaunaCombatVisual(alpha, atlas)?.id, 'alpha-varren-me1');
  for (const changed of [{ ...actor, mediaId: 'ME2' }, { ...actor, enemy: false }, { ...actor, id: 'varren-0' },
    { ...actor, state: { ...actor.state, team: 'party' } }, { ...actor, state: { ...actor.state, periodId: 'me2' } },
    { ...alpha, id: 'feros-varrens-pack-1' }]) assert.equal(getHorizonFaunaCombatVisual(changed, atlas), null);
});

test('a native optional Varren battle, report and save round trips pay once and keep historical formats', () => {
  let state = preparedFeros(); assert.equal(current(state).status, 'available');
  assert.equal(OPERATIONS.find(entry => entry.id === 'feros-varrens').steps.length, 3);
  assert.deepEqual(OPERATION_ENCOUNTERS['feros-varrens-pack'].enemies, ['varren', 'varren', 'alpha-varren']);
  const initial = { xp: state.xp, credits: state.credits, paragon: state.paragon };
  assert.equal(advanceOperation(state, 'feros-varrens', 'request', 'accept').ok, true); state = roundtrip(state);
  assert.equal(advanceOperation(state, 'feros-varrens', 'report', 'report').ok, false);
  assert.equal(advanceOperation(state, 'feros-varrens', 'pack', 'fight').ok, true); state = roundtrip(state);
  const encounter = getOperationEncounter(state, 'feros-varrens', 'pack'); assert.ok(encounter);
  const battle = createBattle({ party: state.party.map(id => actorFor(id, state)), enemies: encounter.enemies, mode: 'wait', difficulty: 'story', seed: 2183 });
  let orders = 0;
  for (let tick = 0; tick < 6000 && !battle.winner; tick++) {
    tickBattle(battle, .1);
    for (const actor of battle.actors.filter(actor => actor.team === 'party' && actor.hp > 0)) {
      const actions = getActions(battle, actor.id), target = battle.actors.find(actor => actor.team === 'enemy' && actor.hp > 0);
      if (!target || battle.winner) break;
      const action = ['burst', 'shoot', 'cover'].map(id => actions.find(action => action.id === id && action.available)).find(Boolean);
      if (action) { assert.equal(performAction(battle, { actorId: actor.id, actionId: action.id, targetId: action.id === 'cover' ? actor.id : target.id }).ok, true); orders++; }
    }
  }
  assert.equal(battle.winner, 'party'); assert.ok(orders > 0);
  assert.equal(finishOperationBattle(state, 'feros-varrens', 'pack', battle.winner === 'party').ok, true); state = roundtrip(state);
  assert.deepEqual({ xp: state.xp, credits: state.credits, paragon: state.paragon }, initial);
  assert.equal(advanceOperation(state, 'feros-varrens', 'report', 'report').completed, true); state = roundtrip(state);
  assert.deepEqual({ xp: state.xp, credits: state.credits, paragon: state.paragon }, { xp: initial.xp + 70, credits: initial.credits + 80, paragon: initial.paragon + 4 });
  assert.equal(operationEffects(state).colonySupport, 1);
  const after = structuredClone(state); assert.equal(advanceOperation(state, 'feros-varrens', 'report', 'report').ok, false); assert.deepEqual(state, after);
  assert.deepEqual(normalizeOperations(undefined), { version: 1, records: {} });
});

test('unfinished meat work closes at the Thorian and fabricated new records cannot overwrite old state', () => {
  const state = preparedFeros(); assert.equal(advanceOperation(state, 'feros-varrens', 'request', 'accept').ok, true);
  assert.equal(winEncounter(state, 'feros:encounter-2'), true); assert.equal(winEncounter(state, 'feros:boss'), true);
  assert.equal(current(state).status, 'unavailable');
  const before = structuredClone(state); assert.equal(advanceOperation(state, 'feros-varrens', 'pack', 'fight').ok, false); assert.deepEqual(state, before);
  const forged = preparedFeros(); forged.operations.records['feros-varrens'] = { stage: 2, choices: { request: 'accept', pack: 'fight' }, victories: [], pendingBattle: null };
  assert.equal(decodeSave(encodeSave(forged)), null);
});
