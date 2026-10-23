import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame, encodeSave, decodeSave } from '../src/state.js';
import { CHRONICLE_SCENARIOS } from '../src/universe-actors.js';
import { UNIVERSE_EQUIPMENT } from '../src/universe-equipment.js';
import { createChronicle, normalizeChronicle, listChronicleScenarios, selectChronicleScenario, setChronicleParty, equipChronicle, getChronicleRoster, getChronicleGear, buildChronicleActor, startChronicleBattle, finishChronicleBattle, encodeChronicle, decodeChronicle, chronicleStorageKey, saveChronicle, loadChronicle } from '../src/chronicles.js';
import { getActions, performAction, tickBattle } from '../src/combat.js';
const clone = value => structuredClone(value);
const context = mediaId => ({ mediaId, periodId: mediaId.toLowerCase() });
const workshop = mediaId => createChronicle(context(mediaId), `${mediaId.toLowerCase()}-equipment-workshop`);
const storage = () => { const values = new Map(); return { values, getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) }; };
function simulate(battle) {
  for (let frame = 0; frame < 12000 && !battle.winner; frame++) {
    for (const actor of battle.actors.filter(actor => actor.team === 'party' && actor.hp > 0)) {
      const actions = getActions(battle, actor.id).filter(action => action.available);
      const action = ['reload', 'signature', 'burst', 'shoot', 'overload', 'throw', 'warp', 'cover', 'reposition'].map(id => actions.find(action => action.id === id)).find(Boolean);
      if (!action) continue;
      const target = action.target === 'self' ? actor : battle.actors.find(enemy => enemy.team === 'enemy' && enemy.hp > 0 && !enemy.statuses.stasis);
      if (target) performAction(battle, { actorId: actor.id, actionId: action.id, targetId: target.id });
    }
    tickBattle(battle, .1);
  }
  assert.ok(battle.winner, 'A real simulation reaches an outcome');
}

test('every bounded scenario starts only its own canonical context and neutral session', () => {
  assert.equal(CHRONICLE_SCENARIOS.length, 10);
  for (const scenario of CHRONICLE_SCENARIOS) {
    const session = createChronicle(scenario.context, scenario.id);
    assert.ok(session, scenario.id);
    assert.ok(normalizeChronicle(session));
    assert.equal(session.scenarioId, scenario.id);
    assert.equal(startChronicleBattle(session).ok, true, scenario.id);
    assert.equal(getChronicleRoster(session).length, scenario.actorIds.length);
    assert.ok(session.party.every(id => buildChronicleActor(session, id)?.id === id));
    assert.equal(listChronicleScenarios(scenario.context).some(candidate => candidate.id === scenario.id), true);
    const stranger = CHRONICLE_SCENARIOS.find(candidate => candidate.context.mediaId !== scenario.context.mediaId);
    assert.equal(selectChronicleScenario(session, stranger.id).ok, false);
    assert.equal(createChronicle(stranger.context, scenario.id), null);
  }
});

test('documentary works have no fabricated party, battle or speculative chronology', () => {
  const session = createChronicle(context('REV'));
  assert.ok(session); assert.equal(session.scenarioId, null); assert.deepEqual(session.party, []);
  assert.equal(startChronicleBattle(session).ok, false);
  for (const mediaId of ['LIB', 'BLA', 'ME4', 'CUT']) assert.equal(createChronicle(context(mediaId)), null);
  assert.equal(createChronicle({ ...context('ME2'), year: 2186 }), null);
  assert.equal(createChronicle({ ...context('MEA'), galaxy: 'milky-way' }), null);
});

test('foreign actors, loadouts, results and incompatible histories cannot enter a chronicle', () => {
  const session = workshop('ME2'), before = clone(session);
  const foreign = workshop('MEA');
  assert.equal(setChronicleParty(session, foreign.party).ok, false);
  assert.equal(normalizeChronicle({ ...session, party: foreign.party }), null);
  assert.equal(normalizeChronicle({ ...session, cleared: [foreign.scenarioId] }), null);
  assert.equal(equipChronicle(session, foreign.party[0], 'MEA-WPN-AVENGER').ok, false);
  assert.equal(finishChronicleBattle(session, { winner: 'party', actors: [] }).ok, false);
  assert.deepEqual(session, before);
});

test('workshop equipment applies once and never becomes a prologue acquisition', () => {
  for (const mediaId of ['ME2', 'ME3', 'MEA']) {
    let session = workshop(mediaId); const actorId = session.party[0];
    const item = getChronicleGear(session, actorId).find(item => item.compatible && item.slot === 'weapon');
    assert.ok(item); const before = clone(session), base = buildChronicleActor(session, actorId);
    const equipped = equipChronicle(session, actorId, item.id); assert.equal(equipped.ok, true); session = equipped.session;
    assert.deepEqual(before, createChronicle(context(mediaId), session.scenarioId));
    const actor = buildChronicleActor(session, actorId);
    assert.equal(actor.attack, base.attack + (UNIVERSE_EQUIPMENT.find(candidate => candidate.id === item.id).bonuses?.attack || 0));
    assert.deepEqual(buildChronicleActor(decodeChronicle(encodeChronicle(session)), actorId), actor);
    const prologue = CHRONICLE_SCENARIOS.find(candidate => candidate.context.mediaId === mediaId && candidate.kind !== 'equipment-workshop');
    const prologueSession = createChronicle(prologue.context, prologue.id);
    assert.equal(equipChronicle(prologueSession, prologueSession.party[0], item.id).ok, false);
  }
});

test('chronicle envelopes and storage remain isolated from campaign and other media', () => {
  const store = storage(), campaign = newGame(), campaignJSON = encodeSave(campaign);
  store.setItem('relay-chronicles.save.v1', campaignJSON);
  for (const mediaId of ['ME2', 'ME3', 'MEA']) {
    const session = workshop(mediaId); assert.equal(saveChronicle(store, session).ok, true);
    assert.deepEqual(loadChronicle(store, session.context).session, session);
    assert.equal(decodeSave(encodeChronicle(session)), null);
  }
  assert.equal(decodeChronicle(campaignJSON), null);
  assert.equal(store.getItem('relay-chronicles.save.v1'), campaignJSON);
  assert.equal(new Set(['ME2', 'ME3', 'MEA'].map(id => chronicleStorageKey(context(id)))).size, 3);
  const key = chronicleStorageKey(context('ME2')); store.setItem(key, '{broken');
  assert.equal(loadChronicle(store, context('ME2')).ok, false); assert.equal(store.getItem(key), '{broken');
  const failed = { setItem() { throw new Error('quota'); } };
  assert.equal(saveChronicle(failed, workshop('ME2')).ok, false);
});

test('a context-switching Proxy cannot overwrite another media save', () => {
  const store = storage(), session = workshop('ME2'), other = workshop('ME3');
  assert.equal(saveChronicle(store, other).ok, true); const otherKey = chronicleStorageKey(other.context), original = store.getItem(otherKey);
  let reads = 0;
  const hostile = new Proxy(session, { get(target, key, receiver) { if (key === 'context') return ++reads === 1 ? target.context : other.context; return Reflect.get(target, key, receiver); } });
  assert.equal(saveChronicle(store, hostile).ok, true);
  assert.equal(store.getItem(otherKey), original); assert.equal(reads, 1);
  assert.equal(loadChronicle(store, session.context).session.context.mediaId, 'ME2');
});

test('getter-bearing party, result and envelope inputs never run their accessors', () => {
  const session = workshop('ME2'), ids = [session.party[0]]; let calls = 0;
  Object.defineProperty(ids, '0', { enumerable: true, get() { calls++; throw new Error('getter'); } });
  assert.equal(setChronicleParty(session, ids).ok, false);
  const started = startChronicleBattle(session); assert.equal(started.ok, true);
  Object.defineProperty(started.battle, 'winner', { get() { calls++; throw new Error('getter'); } });
  assert.equal(finishChronicleBattle(session, started.battle).ok, false);
  const packet = { version: 1, session };
  Object.defineProperty(packet, 'format', { enumerable: true, get() { calls++; throw new Error('getter'); } });
  assert.equal(decodeChronicle(packet), null); assert.equal(calls, 0);
});

test('real tactical outcomes are scoped, persisted once and award no campaign rewards', () => {
  const session = workshop('ME2'), campaign = newGame(), beforeCampaign = clone(campaign);
  const started = startChronicleBattle(session); assert.equal(started.ok, true); simulate(started.battle);
  const other = workshop('ME3'); assert.equal(finishChronicleBattle(other, started.battle).ok, false);
  const result = finishChronicleBattle(session, started.battle); assert.equal(result.ok, true);
  assert.deepEqual(result.session.cleared, result.won ? [session.scenarioId] : []);
  assert.equal(finishChronicleBattle(session, started.battle).ok, false);
  assert.deepEqual(decodeChronicle(encodeChronicle(result.session)), result.session);
  assert.deepEqual(campaign, beforeCampaign); assert.equal(own(result.session, 'credits'), false);
});

test('alternative squad histories cannot coexist in one workshop party', () => {
  for (const scenario of CHRONICLE_SCENARIOS.filter(candidate => candidate.exclusiveActorGroups?.length)) {
    const session = createChronicle(scenario.context, scenario.id);
    for (const group of scenario.exclusiveActorGroups) {
      const chosen = [scenario.defaultParty[0], ...group];
      assert.equal(setChronicleParty(session, chosen).ok, false);
      assert.ok(setChronicleParty(session, [scenario.defaultParty[0], group[0]]).ok);
      assert.ok(setChronicleParty(session, [scenario.defaultParty[0], group[1]]).ok);
    }
  }
});
const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
