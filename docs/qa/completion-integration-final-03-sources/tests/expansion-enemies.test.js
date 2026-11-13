import test from 'node:test';
import assert from 'node:assert/strict';
import { EXPANSION_ENEMIES } from '../src/expansion-enemies.js';
import { UNIVERSE_OPPONENTS } from '../src/universe-opponents.js';
import { UNIVERSE_WORKS, getUniverseRecord, getUniverseWork } from '../src/universe-data.js';
import { canAccessContent } from '../src/continuity.js';
import { createBattle, getActions, performAction, tickBattle } from '../src/combat.js';

const expected = {
  ME2: ['BS-TROOPER', 'BS-HEAVY', 'EC-ENGINEER', 'EC-VANGUARD', 'EC-COMMANDO',
    'BP-WARRIOR', 'BP-PYRO', 'GETH-ROCKET', 'GETH-HUNTER', 'GETH-PRIME', 'GETH-COLOSSUS',
    'ABOMINATION', 'SCION', 'COLLECTOR-GUARDIAN', 'VASIR', 'BROKER'],
  ME3: ['CENTURION', 'ENGINEER', 'GUARDIAN', 'NEMESIS', 'PHANTOM', 'ATLAS', 'CANNIBAL',
    'RAVAGER', 'SWARMER', 'HARVESTER', 'RAMPART', 'ADJUTANT'],
  MEA: ['ANOINTED', 'DESTINED', 'WRAITH', 'FIEND', 'INVICTOR', 'ARCHON-SWORD', 'VALIANT',
    'BEHEMOTH', 'RAIDER', 'BERSERKER', 'NULLIFIER', 'ARCHITECT'],
};
const contextFor = mediaId => ({ mediaId, periodId: mediaId.toLowerCase() });
const byId = id => EXPANSION_ENEMIES.find(profile => profile.recordId === id);
const open = EXPANSION_ENEMIES.filter(profile => !profile.blockedReason);
const native = profile => ({ id: profile.recordId, name: getUniverseRecord(profile.recordId).name, ...profile.simulation });

test('forty distinct factual enemies extend rather than duplicate the sixteen existing opponents', () => {
  const ids = Object.entries(expected).flatMap(([mediaId, suffixes]) => suffixes.map(suffix => `${mediaId}-ENM-${suffix}`));
  assert.equal(EXPANSION_ENEMIES.length, 40);
  assert.equal(new Set(EXPANSION_ENEMIES.map(profile => profile.recordId)).size, 40);
  assert.deepEqual(EXPANSION_ENEMIES.map(profile => profile.recordId), ids);
  const previous = new Set(UNIVERSE_OPPONENTS.map(profile => profile.id));
  assert.ok(EXPANSION_ENEMIES.every(profile => !previous.has(profile.recordId)));
  for (const profile of EXPANSION_ENEMIES) {
    const record = getUniverseRecord(profile.recordId), work = getUniverseWork(record.mediaId);
    assert.equal(record.fact, true); assert.equal(record.nature, 'Établi'); assert.equal(record.category, 'enemies');
    assert.equal(canAccessContent(profile.recordId, contextFor(record.mediaId)).ok, true);
    assert.ok(record.sourceIds.length > 0);
    assert.ok(record.sourceIds.every(id => work.sources.some(source => source.id === id)));
    assert.ok(profile.notes.includes(record.description));
    for (const id of record.sourceIds) assert.ok(profile.notes.some(note => note.includes(id)));
    if (record.conditions) assert.ok(profile.notes.includes(`Conditions documentaires conservées : ${record.conditions}`));
  }
});

test('all data including nested arrays is immutable and contains only bounded adapted simulation fields', () => {
  assert.ok(Object.isFrozen(EXPANSION_ENEMIES));
  for (const profile of EXPANSION_ENEMIES) {
    assert.deepEqual(Object.keys(profile).sort(), ['recordId', 'mode', 'role', 'simulation', 'notes', 'limitations', 'constraints', 'blockedReason'].sort());
    assert.equal(profile.mode, 'enemy'); assert.equal(typeof profile.role, 'string');
    for (const value of [profile, profile.simulation, profile.simulation.powers, profile.notes, profile.limitations, profile.constraints]) assert.ok(Object.isFrozen(value));
    assert.deepEqual(Object.keys(profile.simulation).sort(), ['hp', 'shield', 'attack', 'defense', 'speed', 'synthetic', 'primaryAction', 'boss', 'powers'].sort());
    const stats = profile.simulation;
    for (const key of ['hp', 'shield', 'attack', 'defense', 'speed']) assert.ok(Number.isFinite(stats[key]));
    assert.ok(stats.hp >= 80 && stats.hp <= 520); assert.ok(stats.shield >= 0 && stats.shield <= 65);
    assert.ok(stats.attack >= 11 && stats.attack <= 24); assert.ok(stats.defense >= 1 && stats.defense <= 10);
    assert.ok(stats.speed >= .5 && stats.speed <= 1.5);
    assert.ok(['shoot', 'strike'].includes(stats.primaryAction));
    assert.equal(typeof stats.synthetic, 'boolean'); assert.equal(typeof stats.boss, 'boolean');
    assert.deepEqual(stats.powers, []); assert.deepEqual(profile.constraints, { editionProfile: null });
    assert.throws(() => { stats.hp = 9999; }, TypeError);
    assert.throws(() => { profile.notes.push('forged'); }, TypeError);
    assert.throws(() => { stats.powers.push('warp'); }, TypeError);
    assert.ok(profile.notes.every(note => typeof note === 'string' && note.length > 0));
    assert.ok(profile.limitations.every(note => typeof note === 'string' && note.length > 0));
    assert.match(profile.notes.join(' '), /adaptés/);
    assert.match(profile.limitations.join(' '), /Aucun pouvoir nommé/);
    for (const key of ['reward', 'xp', 'credits', 'recruited', 'lost', 'outcome', 'phaseTable']) {
      assert.equal(Object.hasOwn(profile, key), false); assert.equal(Object.hasOwn(stats, key), false);
    }
  }
});

test('four DLC identities stay inspectable but closed rather than treating the main period as DLC access', () => {
  const blocked = EXPANSION_ENEMIES.filter(profile => profile.blockedReason);
  assert.deepEqual(blocked.map(profile => profile.recordId), ['ME2-ENM-VASIR', 'ME2-ENM-BROKER', 'ME3-ENM-RAMPART', 'ME3-ENM-ADJUTANT']);
  assert.equal(open.length, 36);
  for (const profile of blocked) {
    assert.match(profile.blockedReason, /Accès au DLC.*non attesté/);
    assert.match(profile.notes.join(' '), /Occurrence limitée au DLC/);
    assert.equal(profile.constraints.editionProfile, null);
  }
  for (const profile of open) assert.equal(profile.blockedReason, null);
  for (const id of ['ME3-ENM-DRAGOON', 'ME3-ENM-COLLECTOR-TROOPER', 'MEA-ENM-SCIENTIST',
    'MEA-ENM-KAERKYN', 'MEA-ENM-TAURG', 'MEA-ENM-ARCHON-FINAL', 'ME2-ENM-HUMAN-REAPER',
    'EVO-EN-META', 'INV-EN-CERBERUS', 'ME3-ENM-TURRET', 'MEA-ENM-REM-TURRET']) {
    assert.equal(byId(id), undefined, id);
  }
});

test('the published main-work occurrence is never broadened to other titles, prologues or multiplayer', () => {
  const contexts = UNIVERSE_WORKS.flatMap(work => work.periods.map(period => ({ mediaId: work.mediaId, periodId: period.id })));
  for (const profile of EXPANSION_ENEMIES) {
    const record = getUniverseRecord(profile.recordId);
    assert.deepEqual(record.availability, [{ mediaId: record.mediaId, periodIds: [record.mediaId.toLowerCase()] }]);
    for (const context of contexts) {
      const allowed = context.mediaId === record.mediaId && context.periodId === record.mediaId.toLowerCase();
      assert.equal(canAccessContent(profile.recordId, context).ok, allowed, `${profile.recordId}/${context.mediaId}/${context.periodId}`);
    }
  }
});

test('documented roles do not silently grant powers, boss phases, camouflage or encounter outcomes', () => {
  assert.deepEqual(EXPANSION_ENEMIES.filter(profile => profile.simulation.boss).map(profile => profile.recordId), [
    'ME2-ENM-GETH-COLOSSUS', 'ME2-ENM-VASIR', 'ME2-ENM-BROKER', 'MEA-ENM-INVICTOR',
  ]);
  for (const [id, term] of [
    ['ME2-ENM-EC-VANGUARD', /rôle biotique/], ['ME2-ENM-BP-PYRO', /ni jet de flamme ni brûlure/],
    ['ME2-ENM-GETH-HUNTER', /Camouflage/], ['ME2-ENM-GETH-COLOSSUS', /Haestrom/],
    ['ME3-ENM-ENGINEER', /aucune tourelle/], ['ME3-ENM-GUARDIAN', /bouclier porté/],
    ['ME3-ENM-HARVESTER', /Vol/], ['MEA-ENM-WRAITH', /Camouflage/],
    ['MEA-ENM-INVICTOR', /Defeating the Kett/], ['MEA-ENM-VALIANT', /aucun résultat de loyauté/],
    ['MEA-ENM-ARCHITECT', /Eos, Voeld, Kadara et Elaaden.*sous-cibles, phases/],
  ]) assert.match(byId(id).limitations.join(' '), term, id);
  assert.equal(byId('ME3-ENM-ATLAS').simulation.synthetic, false, 'A piloted machine does not grant an autonomous synthetic classification');
  for (const profile of EXPANSION_ENEMIES) {
    if (profile.simulation.synthetic) assert.match(profile.recordId, /GETH|RAMPART|NULLIFIER|ARCHITECT/);
    if (profile.simulation.primaryAction === 'strike') assert.match(profile.notes.join(' '), /contact générique/);
  }
});

test('all thirty-six open samples actually act and damage a test target using the native combat engine', () => {
  for (const profile of open) {
    const source = native(profile), before = JSON.stringify(source);
    const battle = createBattle({ mode: 'active', seed: 41, party: [
      { id: 'test-target', name: 'Cible de test abstraite', hp: 2500, shield: 0, defense: 0, powers: [] },
    ], enemies: [source] });
    for (let step = 0; step < 100; step++) tickBattle(battle, .25);
    const target = battle.actors.find(actor => actor.id === 'test-target');
    const enemy = battle.actors.find(actor => actor.team === 'enemy');
    assert.ok(target.hp < 2500, profile.recordId);
    assert.ok(battle.events.some(event => event.type === 'action' && event.actorId === enemy.id), profile.recordId);
    assert.deepEqual(enemy.powers, []);
    const actionIds = getActions(battle, enemy.id).map(action => action.id);
    assert.equal(actionIds.includes('strike'), profile.simulation.primaryAction === 'strike');
    assert.equal(actionIds.includes('shoot'), profile.simulation.primaryAction === 'shoot');
    assert.equal(JSON.stringify(source), before, 'Combat cannot mutate the frozen sample or native input');
  }
});

test('all thirty-six open samples can be defeated by real orders from an abstract three-member test team', () => {
  for (const profile of open) {
    const battle = createBattle({ mode: 'active', seed: 13, party: ['alpha', 'beta', 'gamma'].map(id => ({
      id, name: `Équipier de test ${id}`, hp: 260, shield: 45, attack: 20, defense: 5, speed: 1, powers: [],
    })), enemies: [native(profile)] });
    let orders = 0;
    for (let step = 0; step < 1500 && !battle.winner; step++) {
      tickBattle(battle, .1);
      const target = battle.actors.find(actor => actor.team === 'enemy' && actor.hp > 0);
      if (!target) continue;
      for (const actor of battle.actors.filter(actor => actor.team === 'party' && actor.hp > 0 && actor.atb >= 100)) {
        const result = performAction(battle, { actorId: actor.id, actionId: 'shoot', targetId: target.id });
        if (result.ok) orders++;
      }
    }
    assert.equal(battle.winner, 'party', profile.recordId);
    assert.ok(orders > 0, profile.recordId);
    assert.ok(battle.events.some(event => event.type === 'action' && event.actorId === profile.recordId));
  }
});
