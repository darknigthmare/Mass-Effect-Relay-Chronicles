import test from 'node:test';
import assert from 'node:assert/strict';
import { UNIVERSE_WORKS, getUniverseRecord, getUniverseWork } from '../src/universe-data.js';
import { normalizeContext, canAccessContent } from '../src/continuity.js';
import { ACTIONS, createBattle, getActions, tickBattle } from '../src/combat.js';
import { UNIVERSE_OPPONENTS, getUniverseOpponent, universeOpponentFor } from '../src/universe-opponents.js';

const expected = {
  ME2: ['LOKI', 'FENRIS', 'YMIR', 'COLLECTOR-DRONE', 'HARBINGER', 'PRAETORIAN'],
  ME3: ['ASSAULT', 'HUSK', 'MARAUDER', 'BRUTE', 'BANSHEE', 'KAI'],
  MEA: ['CHOSEN', 'ASCENDANT', 'CARDINAL', 'DESTROYER'],
};
const contextFor = mediaId => ({ mediaId, periodId: mediaId.toLowerCase() });

test('the curated bestiary contains exactly sixteen established work-scoped enemy records', () => {
  assert.deepEqual(UNIVERSE_OPPONENTS.map(profile => profile.id), Object.entries(expected)
    .flatMap(([mediaId, suffixes]) => suffixes.map(suffix => `${mediaId}-ENM-${suffix}`)));
  for (const profile of UNIVERSE_OPPONENTS) {
    const record = getUniverseRecord(profile.id), work = getUniverseWork(profile.mediaId);
    assert.equal(record.fact, true); assert.equal(record.nature, 'Établi');
    assert.equal(record.category, 'enemies');
    assert.equal(profile.catalogId, record.id);
    assert.equal(profile.name, record.name);
    assert.equal(profile.description, record.description);
    assert.equal(profile.conditions, record.conditions);
    assert.deepEqual(profile.availability, record.availability);
    assert.deepEqual(profile.sourceEntryIds, [record.id]);
    assert.deepEqual(profile.sourceIds, record.sourceIds);
    for (const sourceId of profile.sourceIds) assert.ok(work.sources.some(source => source.id === sourceId));
    assert.equal(canAccessContent(profile.id, profile.context).ok, true);
    assert.equal(profile.provenance.catalogPath, record.provenance.catalogPath);
    assert.match(profile.provenance.verification, /secondary/);
    assert.ok(Object.isFrozen(profile)); assert.ok(Object.isFrozen(profile.tuning));
    assert.ok(Object.isFrozen(profile.provenance.sources));
  }
});

test('all registered foreign works, prologues and multiplayer segments fail closed', () => {
  const contexts = UNIVERSE_WORKS.flatMap(work => work.periods.map(period => ({ mediaId: work.mediaId, periodId: period.id })));
  for (const profile of UNIVERSE_OPPONENTS) {
    for (const context of contexts) {
      const expectedAccess = context.mediaId === profile.mediaId && context.periodId === profile.context.periodId;
      assert.equal(!!getUniverseOpponent(profile.id, context), expectedAccess, `${profile.id}/${context.mediaId}/${context.periodId}`);
      assert.equal(!!universeOpponentFor(profile.id, context), expectedAccess);
    }
    assert.ok(getUniverseOpponent(profile.id, normalizeContext(profile.context)));
    for (const bad of [
      { ...profile.context, year: 2186 },
      { ...profile.context, galaxy: profile.context.galaxy === 'andromeda' ? 'milky-way' : 'andromeda' },
      { ...profile.context, sceneId: 'forged' },
      { mediaId: 'ME4', periodId: 'me4' },
    ]) assert.equal(getUniverseOpponent(profile.id, bad), null);
  }
});

test('only documented boss roles are tagged; an Archon network or multiplayer enemy is not silently activated', () => {
  assert.deepEqual(UNIVERSE_OPPONENTS.filter(profile => profile.boss).map(profile => profile.id), [
    'ME2-ENM-PRAETORIAN', 'ME3-ENM-KAI', 'MEA-ENM-CARDINAL',
  ]);
  const harbinger = getUniverseOpponent('ME2-ENM-HARBINGER', contextFor('ME2'));
  assert.equal(harbinger.role, 'possessed-host'); assert.equal(harbinger.boss, false);
  assert.match(harbinger.missingMechanics.join(' '), /possession/);
  for (const [id, context] of [
    ['MEA-ENM-ARCHON-FINAL', contextFor('MEA')],
    ['ME2-ENM-HUMAN-REAPER', contextFor('ME2')],
    ['ME3-ENM-DRAGOON', { mediaId: 'ME3', periodId: 'me3-multiplayer' }],
    ['ME3-ENM-COLLECTOR-TROOPER', contextFor('ME3')],
    ['MEA-ENM-SCIENTIST', contextFor('MEA')],
  ]) assert.equal(universeOpponentFor(id, context), null, id);
});

test('incomplete original mechanics are explicit and no named power is invented from a role', () => {
  for (const profile of UNIVERSE_OPPONENTS) {
    assert.deepEqual(profile.powers, []); assert.deepEqual(profile.powerProvenance, []);
    assert.ok(profile.missingMechanics.length > 0);
    assert.ok(profile.silhouetteFacts.length > 0);
    assert.equal(profile.statsBasis, 'ATB adaptation');
    assert.equal(profile.visualMode, 'prototype-symbol');
    assert.equal(profile.portrait, null); assert.equal(profile.sprite, null);
    for (const key of ['reward', 'xp', 'credits', 'recruited', 'lost', 'phaseTable']) assert.equal(Object.hasOwn(profile, key), false);
  }
  for (const [id, term] of [
    ['ME2-ENM-PRAETORIAN', /Vol.*barrières/],
    ['ME3-ENM-KAI', /Thessia.*QG/],
    ['ME3-ENM-BANSHEE', /biotiques.*non attribués/],
    ['MEA-ENM-ASCENDANT', /Orbe.*non simulés/],
    ['MEA-ENM-CARDINAL', /A Trail of Hope II/],
  ]) {
    const profile = UNIVERSE_OPPONENTS.find(item => item.id === id);
    assert.match(profile.missingMechanics.join(' '), term);
  }
});

test('native builders return independent bounded ATB definitions and preserve their source identity', () => {
  for (const profile of UNIVERSE_OPPONENTS) {
    const before = JSON.stringify(profile), context = contextFor(profile.mediaId);
    const first = universeOpponentFor(profile.id, context, { instanceId: 'native-test:first' });
    const second = universeOpponentFor(profile.id, context, { instanceId: 'native-test:second' });
    assert.equal(first.id, 'native-test:first'); assert.equal(second.id, 'native-test:second');
    assert.equal(first.catalogId, profile.id); assert.equal(first.mediaId, profile.mediaId);
    assert.equal(first.name, profile.name);
    assert.equal(first.synthetic, profile.synthetic);
    assert.equal(first.boss, profile.boss);
    assert.deepEqual(first.sourceIds, profile.sourceIds);
    for (const key of ['hp', 'maxHp', 'shield', 'maxShield', 'attack', 'defense', 'speed']) assert.equal(first[key], profile.tuning[key]);
    assert.ok(first.hp >= 100 && first.hp <= 500);
    assert.ok(first.shield >= 0 && first.shield <= 100);
    assert.ok(first.attack >= 12 && first.attack <= 22);
    assert.ok(first.speed >= .5 && first.speed <= 1.15);
    first.hp = 1; first.powers.push('warp'); first.sourceIds.length = 0; first.missingMechanics.length = 0;
    assert.deepEqual(second.powers, []);
    assert.ok(second.sourceIds.length > 0); assert.ok(second.missingMechanics.length > 0);
    assert.equal(JSON.stringify(profile), before);
    assert.notEqual(universeOpponentFor(profile.id, context).hp, 1);
  }
});

test('basic organic contact is a generic ATB primitive, never a borrowed named kit', () => {
  for (const suffix of ['HUSK', 'BRUTE']) {
    const native = universeOpponentFor(`ME3-ENM-${suffix}`, contextFor('ME3'));
    assert.equal(native.primaryAction, 'strike'); assert.deepEqual(native.powers, []);
    const battle = createBattle({ mode: 'active', party: [{ id: 'p', hp: 300, shield: 0, powers: [] }], enemies: [native] });
    const enemy = battle.actors.find(actor => actor.team === 'enemy');
    const ids = getActions(battle, enemy.id).map(action => action.id);
    assert.ok(ids.includes('strike')); assert.ok(!ids.includes('shoot')); assert.ok(!ids.includes('burst'));
  }
});

test('every native opponent actually acts and damages a target through the unchanged combat engine', () => {
  for (const profile of UNIVERSE_OPPONENTS) {
    const native = universeOpponentFor(profile.id, profile.context);
    const before = JSON.stringify(native);
    const battle = createBattle({ mode: 'active', seed: 41,
      party: [{ id: 'test-party', name: 'Cible ATB de test', hp: 2000, shield: 0, defense: 0, powers: [] }],
      enemies: [native] });
    for (let step = 0; step < 80; step++) tickBattle(battle, .25);
    const target = battle.actors.find(actor => actor.id === 'test-party');
    const enemy = battle.actors.find(actor => actor.team === 'enemy');
    assert.ok(target.hp < 2000, profile.id);
    assert.ok(battle.events.some(event => event.type === 'action' && event.actorId === enemy.id), profile.id);
    assert.ok(getActions(battle, enemy.id).every(action => ACTIONS[action.id]));
    assert.equal(JSON.stringify(native), before, 'Combat normalization never mutates a builder snapshot');
  }
});

test('unknown or prototype-like IDs, getters, inherited input and cyclic contexts do not become profiles', () => {
  for (const id of [null, undefined, 1, {}, 'constructor', '__proto__', 'toString', 'ME2-ENM-LOKI ', 'me2-enm-loki']) {
    assert.equal(getUniverseOpponent(id, contextFor('ME2')), null);
  }
  let reads = 0;
  const getter = { periodId: 'me2' };
  Object.defineProperty(getter, 'mediaId', { enumerable: true, get() { reads++; throw new Error('unsafe'); } });
  const cycle = contextFor('ME2'); cycle.cycle = cycle;
  const hidden = contextFor('ME2'); Object.defineProperty(hidden, 'year', { value: 2185 });
  const { proxy, revoke } = Proxy.revocable({}, {}); revoke();
  for (const context of [getter, cycle, hidden, Object.create(contextFor('ME2')), proxy]) {
    assert.equal(getUniverseOpponent('ME2-ENM-LOKI', context), null);
    assert.equal(universeOpponentFor('ME2-ENM-LOKI', context), null);
  }
  assert.equal(reads, 0);
});

test('instance options cannot inject statistics, IDs via prototypes, accessors or cycles', () => {
  const id = 'ME2-ENM-LOKI', context = contextFor('ME2');
  let reads = 0;
  const getter = {};
  Object.defineProperty(getter, 'instanceId', { enumerable: true, get() { reads++; return 'forged'; } });
  const hidden = {}; Object.defineProperty(hidden, 'instanceId', { value: 'forged' });
  const cycle = {}; cycle.instanceId = cycle;
  const { proxy, revoke } = Proxy.revocable({}, {}); revoke();
  for (const options of [null, false, [], { attack: 9999 }, { instanceId: 'a', hp: 1 },
    { instanceId: '__proto__' }, { instanceId: 'constructor' }, { instanceId: '' },
    { instanceId: 'x'.repeat(161) }, getter, hidden, cycle, Object.create({ instanceId: 'inherited' }), proxy]) {
    assert.equal(universeOpponentFor(id, context, options), null);
  }
  const plain = Object.create(null); plain.instanceId = 'native:test-1';
  assert.equal(universeOpponentFor(id, context, plain).id, 'native:test-1');
  assert.equal(reads, 0);
});
