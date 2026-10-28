import test from 'node:test';
import assert from 'node:assert/strict';
import { EXPANSION2_ENEMIES } from '../src/expansion2-enemies.js';
import { EXPANSION_CHARACTERS } from '../src/expansion-characters.js';
import { EXPANSION_ARMOR } from '../src/expansion-armor.js';
import { EXPANSION_WEAPONS } from '../src/expansion-weapons.js';
import { EXPANSION_FLEET } from '../src/expansion-fleet.js';
import { EXPANSION_ENEMIES } from '../src/expansion-enemies.js';
import { UNIVERSE_OPPONENTS } from '../src/universe-opponents.js';
import { UNIVERSE_WORKS, getUniverseRecord, getUniverseWork } from '../src/universe-data.js';
import { canAccessContent } from '../src/continuity.js';
import { createBattle, getActions, performAction, tickBattle } from '../src/combat.js';

const expected = {
  ME2: ['BS-CENTURION', 'BS-LEGION', 'EC-TROOPER', 'EC-HEAVY', 'BP-TROOPER', 'BP-BOOM',
    'GETH-TROOPER', 'GETH-DESTROYER', 'GETH-DRONE', 'HUSK', 'COLLECTOR-ASSASSIN', 'OCULUS', 'VARRREN', 'THRESHER'],
  ME3: ['GETH-TROOPER', 'GETH-ROCKET', 'GETH-HUNTER', 'GETH-PYRO', 'GETH-PRIME',
    'CAT6-HEAVY', 'CLONE', 'DRAGOON', 'REAPER-RANNOCH'],
  MEA: ['AGENT', 'ANARCHIST', 'HYDRA', 'PARIAH', 'SABOTEUR', 'SHARPSHOOTER',
    'ASSEMBLER', 'BREACHER', 'CREEPER', 'PROGENITOR', 'ARCHON-FINAL', 'SCIENTIST'],
  INF: ['TROOPER', 'X1', 'INALI'], GAL: ['CLINT', 'ROBOT'],
};
const byId = id => EXPANSION2_ENEMIES.find(profile => profile.recordId === id);
const open = EXPANSION2_ENEMIES.filter(profile => !profile.blockedReason);
const native = profile => ({ id: profile.recordId, name: getUniverseRecord(profile.recordId).name, ...profile.simulation });

test('forty unique factual enemy identities are absent from all two hundred first-lot records and the sixteen historical opponents', () => {
  const first = [...EXPANSION_CHARACTERS, ...EXPANSION_ARMOR, ...EXPANSION_WEAPONS, ...EXPANSION_FLEET, ...EXPANSION_ENEMIES];
  assert.equal(first.length, 200);
  const previous = new Set([...first.map(profile => profile.recordId), ...UNIVERSE_OPPONENTS.map(profile => profile.id)]);
  assert.equal(EXPANSION2_ENEMIES.length, 40);
  assert.equal(new Set(EXPANSION2_ENEMIES.map(profile => profile.recordId)).size, 40);
  assert.deepEqual(EXPANSION2_ENEMIES.map(profile => profile.recordId), Object.entries(expected)
    .flatMap(([mediaId, suffixes]) => suffixes.map(suffix => `${mediaId}-ENM-${suffix}`)));
  assert.ok(EXPANSION2_ENEMIES.every(profile => !previous.has(profile.recordId)));
  for (const profile of EXPANSION2_ENEMIES) {
    const record = getUniverseRecord(profile.recordId), work = getUniverseWork(record.mediaId);
    assert.equal(record.fact, true); assert.equal(record.nature, 'Établi'); assert.equal(record.category, 'enemies');
    assert.ok(record.availability.length > 0); assert.ok(record.sourceIds.length > 0);
    assert.ok(record.sourceIds.every(id => work.sources.some(source => source.id === id)));
    assert.ok(profile.notes.includes(record.description));
    for (const id of record.sourceIds) assert.ok(profile.notes.some(note => note.includes(id)));
    if (record.conditions) assert.ok(profile.notes.includes(`Conditions documentaires conservées : ${record.conditions}`));
  }
});

test('all nested data is frozen, with bounded adaptation budgets or an explicitly closed null simulation', () => {
  assert.ok(Object.isFrozen(EXPANSION2_ENEMIES));
  for (const profile of EXPANSION2_ENEMIES) {
    assert.deepEqual(Object.keys(profile).sort(), ['recordId', 'mode', 'role', 'simulation', 'notes', 'limitations', 'blockedReason', 'constraints'].sort());
    assert.equal(profile.mode, 'enemy'); assert.equal(typeof profile.role, 'string');
    for (const value of [profile, profile.notes, profile.limitations, profile.constraints]) assert.ok(Object.isFrozen(value));
    assert.deepEqual(profile.constraints, { editionProfile: null });
    assert.throws(() => { profile.notes.push('forged'); }, TypeError);
    assert.ok(profile.limitations.length >= 3);
    assert.ok(profile.notes.every(note => typeof note === 'string' && note.length > 0));
    assert.ok(profile.limitations.every(note => typeof note === 'string' && note.length > 0));
    if (profile.blockedReason) { assert.equal(profile.simulation, null); continue; }
    const stats = profile.simulation;
    assert.ok(Object.isFrozen(stats)); assert.ok(Object.isFrozen(stats.powers));
    assert.deepEqual(Object.keys(stats).sort(), ['hp', 'shield', 'attack', 'defense', 'speed', 'synthetic', 'primaryAction', 'powers', 'boss'].sort());
    for (const key of ['hp', 'shield', 'attack', 'defense', 'speed']) assert.ok(Number.isFinite(stats[key]));
    assert.ok(stats.hp >= 100 && stats.hp <= 480); assert.ok(stats.shield >= 0 && stats.shield <= 65);
    assert.ok(stats.attack >= 12 && stats.attack <= 23); assert.ok(stats.defense >= 2 && stats.defense <= 9);
    assert.ok(stats.speed >= .5 && stats.speed <= 1.5);
    assert.ok(['shoot', 'strike'].includes(stats.primaryAction)); assert.deepEqual(stats.powers, []);
    assert.equal(typeof stats.synthetic, 'boolean'); assert.equal(typeof stats.boss, 'boolean');
    assert.throws(() => { stats.hp = 9999; }, TypeError);
    assert.throws(() => { stats.powers.push('warp'); }, TypeError);
    assert.match(profile.notes.join(' '), /réglages ATB adaptés/);
    assert.match(profile.notes.join(' '), /aucun pouvoir nommé ni armement original attribué/);
  }
});

test('six restrictions fail closed without substituting a class, DLC entitlement, network boss or individual hostility', () => {
  assert.equal(open.length, 34);
  assert.deepEqual(EXPANSION2_ENEMIES.filter(profile => profile.blockedReason).map(profile => profile.recordId), [
    'ME3-ENM-CAT6-HEAVY', 'ME3-ENM-CLONE', 'ME3-ENM-DRAGOON', 'ME3-ENM-REAPER-RANNOCH',
    'MEA-ENM-ARCHON-FINAL', 'MEA-ENM-SCIENTIST',
  ]);
  for (const [id, reason] of [
    ['ME3-ENM-CAT6-HEAVY', /DLC Citadel/], ['ME3-ENM-CLONE', /classe du joueur/],
    ['ME3-ENM-DRAGOON', /multijoueur Retaliation/], ['ME3-ENM-REAPER-RANNOCH', /aucun boss à PV/],
    ['MEA-ENM-ARCHON-FINAL', /Réseau de Méridiane.*aucun boss à PV/], ['MEA-ENM-SCIENTIST', /non confirmée/],
  ]) { assert.equal(byId(id).simulation, null); assert.match(byId(id).blockedReason, reason); }
  assert.match(byId('ME3-ENM-CLONE').limitations.join(' '), /aucune classe, arme ou capacité de Shepard/);
  assert.match(byId('MEA-ENM-SCIENTIST').notes.join(' '), /Identité de rencontre à confirmer avant combat automatique/);
  assert.ok(EXPANSION2_ENEMIES.every(profile => !profile.recordId.includes('TURRET')));
  for (const profile of EXPANSION2_ENEMIES) for (const key of ['xp', 'credits', 'reward', 'recruited', 'lost', 'outcome', 'phaseTable']) {
    assert.equal(Object.hasOwn(profile, key), false);
    if (profile.simulation) assert.equal(Object.hasOwn(profile.simulation, key), false);
  }
});

test('registry boundaries are preserved across every title, prologue and multiplayer segment', () => {
  const contexts = UNIVERSE_WORKS.flatMap(work => work.periods.map(period => ({ mediaId: work.mediaId, periodId: period.id })));
  for (const profile of EXPANSION2_ENEMIES) {
    const record = getUniverseRecord(profile.recordId);
    for (const context of contexts) {
      const allowed = record.availability.some(scope => scope.mediaId === context.mediaId && scope.periodIds.includes(context.periodId));
      assert.equal(canAccessContent(profile.recordId, context).ok, allowed, `${profile.recordId}/${context.mediaId}/${context.periodId}`);
    }
  }
  const dragoon = getUniverseRecord('ME3-ENM-DRAGOON');
  assert.deepEqual(dragoon.availability, [{ mediaId: 'ME3', periodIds: ['me3-multiplayer'] }]);
  assert.equal(canAccessContent(dragoon.id, { mediaId: 'ME3', periodId: 'me3' }).ok, false);
  assert.equal(canAccessContent(dragoon.id, { mediaId: 'ME3', periodId: 'me3-multiplayer' }).ok, true);
  assert.equal(byId(dragoon.id).simulation, null, 'Documentary multiplayer access does not establish a playable kit or edition');
});

test('generic roles grant no source powers, and the synthetic Creeper keeps contact without an organic classification', () => {
  assert.deepEqual(open.filter(profile => profile.simulation.boss).map(profile => profile.recordId), ['MEA-ENM-PROGENITOR', 'INF-ENM-INALI']);
  for (const [id, term] of [
    ['ME2-ENM-BS-LEGION', /distinct de Legion/], ['ME2-ENM-BP-BOOM', /ne suffit pas à attribuer une explosion/],
    ['ME2-ENM-GETH-DRONE', /Vol/], ['ME2-ENM-THRESHER', /rite.*phase/],
    ['ME3-ENM-GETH-HUNTER', /Camouflage/], ['ME3-ENM-GETH-PYRO', /ni jet incendiaire ni brûlure/],
    ['MEA-ENM-PARIAH', /aucun pouvoir nommé/], ['MEA-ENM-SABOTEUR', /Aucun pouvoir Sabotage/],
    ['MEA-ENM-PROGENITOR', /The Remnant Tiller.*phase/], ['INF-ENM-INALI', /distincte de l’interlocutrice/],
  ]) assert.match(byId(id).limitations.join(' '), term, id);
  const creeper = byId('MEA-ENM-CREEPER');
  assert.equal(creeper.simulation.synthetic, true); assert.equal(creeper.simulation.primaryAction, 'strike');
  assert.match(creeper.notes.join(' '), /reste synthétique.*libellé historique/);
  const battle = createBattle({ mode: 'active', party: [{ id: 'test', hp: 500, powers: [] }], enemies: [native(creeper)] });
  const enemy = battle.actors.find(actor => actor.team === 'enemy');
  assert.equal(enemy.synthetic, true); assert.deepEqual(enemy.powers, []);
  const ids = getActions(battle, enemy.id).map(action => action.id);
  assert.ok(ids.includes('strike')); assert.ok(!ids.includes('shoot')); assert.ok(!ids.includes('burst'));
});

test('all thirty-four open native samples really act and damage an abstract target without modifying source data', () => {
  for (const profile of open) {
    const source = native(profile), before = JSON.stringify(source);
    const battle = createBattle({ mode: 'active', seed: 41,
      party: [{ id: 'test-target', name: 'Cible ATB abstraite', hp: 2500, shield: 0, defense: 0, powers: [] }], enemies: [source] });
    for (let step = 0; step < 100; step++) tickBattle(battle, .25);
    const target = battle.actors.find(actor => actor.id === 'test-target'), enemy = battle.actors.find(actor => actor.team === 'enemy');
    assert.ok(target.hp < 2500, profile.recordId);
    assert.ok(battle.events.some(event => event.type === 'action' && event.actorId === enemy.id), profile.recordId);
    assert.deepEqual(enemy.powers, []);
    assert.equal(JSON.stringify(source), before);
  }
});

test('all thirty-four open samples can be defeated through real shoot orders from an abstract test team', () => {
  for (const profile of open) {
    const battle = createBattle({ mode: 'active', seed: 13,
      party: ['alpha', 'beta', 'gamma'].map(id => ({ id, name: `Équipier abstrait ${id}`, hp: 260, shield: 45, attack: 20, defense: 5, speed: 1, powers: [] })),
      enemies: [native(profile)] });
    let orders = 0;
    for (let step = 0; step < 1500 && !battle.winner; step++) {
      tickBattle(battle, .1);
      const target = battle.actors.find(actor => actor.team === 'enemy' && actor.hp > 0); if (!target) continue;
      for (const actor of battle.actors.filter(actor => actor.team === 'party' && actor.hp > 0 && actor.atb >= 100)) {
        if (performAction(battle, { actorId: actor.id, actionId: 'shoot', targetId: target.id }).ok) orders++;
      }
    }
    assert.equal(battle.winner, 'party', profile.recordId); assert.ok(orders > 0, profile.recordId);
    assert.ok(battle.events.some(event => event.type === 'action' && event.actorId === profile.recordId), profile.recordId);
  }
});
