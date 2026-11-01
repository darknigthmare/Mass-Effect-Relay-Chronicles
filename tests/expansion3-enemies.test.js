import test from 'node:test';
import assert from 'node:assert/strict';
import { EXPANSION3_ENEMIES } from '../src/expansion3-enemies.js';
import { EXPANSION_CHARACTERS } from '../src/expansion-characters.js';
import { EXPANSION_ARMOR } from '../src/expansion-armor.js';
import { EXPANSION_WEAPONS } from '../src/expansion-weapons.js';
import { EXPANSION_FLEET } from '../src/expansion-fleet.js';
import { EXPANSION_ENEMIES } from '../src/expansion-enemies.js';
import { EXPANSION2_CHARACTERS } from '../src/expansion2-characters.js';
import { EXPANSION2_ARMOR } from '../src/expansion2-armor.js';
import { EXPANSION2_WEAPONS } from '../src/expansion2-weapons.js';
import { EXPANSION2_FLEET } from '../src/expansion2-fleet.js';
import { EXPANSION2_ENEMIES } from '../src/expansion2-enemies.js';
import { UNIVERSE_OPPONENTS } from '../src/universe-opponents.js';
import { UNIVERSE_RECORDS, UNIVERSE_WORKS, getUniverseRecord, getUniverseWork } from '../src/universe-data.js';
import { canAccessContent } from '../src/continuity.js';
import { createBattle, getActions, performAction, tickBattle } from '../src/combat.js';

const byId = id => EXPANSION3_ENEMIES.find(profile => profile.recordId === id);
const open = EXPANSION3_ENEMIES.filter(profile => profile.simulation);
const native = profile => ({ id: profile.recordId, name: getUniverseRecord(profile.recordId).name, ...profile.simulation });
const contextOf = profile => {
  const scope = getUniverseRecord(profile.recordId).availability[0];
  return { mediaId: scope.mediaId, periodId: scope.periodIds[0] };
};
const firstTwo = () => new Set([
  ...EXPANSION_CHARACTERS, ...EXPANSION_ARMOR, ...EXPANSION_WEAPONS, ...EXPANSION_FLEET, ...EXPANSION_ENEMIES,
  ...EXPANSION2_CHARACTERS, ...EXPANSION2_ARMOR, ...EXPANSION2_WEAPONS, ...EXPANSION2_FLEET, ...EXPANSION2_ENEMIES,
].map(profile => profile.recordId));

test('forty dossiers exhaust the remaining contextual factual enemies without recycling previous studies or opponents', () => {
  const previous = new Set([...firstTwo(), ...UNIVERSE_OPPONENTS.map(profile => profile.id)]);
  assert.equal(EXPANSION3_ENEMIES.length, 40);
  assert.equal(new Set(EXPANSION3_ENEMIES.map(profile => profile.recordId)).size, 40);
  const remaining = UNIVERSE_RECORDS.filter(record => record.fact && record.category === 'enemies'
    && !previous.has(record.id) && record.availability.some(scope => scope.periodIds
      .some(periodId => canAccessContent(record.id, { mediaId: scope.mediaId, periodId }).ok)));
  assert.deepEqual(EXPANSION3_ENEMIES.map(profile => profile.recordId).sort(), remaining.map(record => record.id).sort());
  const counts = {};
  for (const profile of EXPANSION3_ENEMIES) {
    assert.equal(previous.has(profile.recordId), false);
    const record = getUniverseRecord(profile.recordId), work = getUniverseWork(record.mediaId);
    counts[record.mediaId] = (counts[record.mediaId] ?? 0) + 1;
    assert.equal(record.fact, true); assert.equal(record.nature, 'Établi'); assert.equal(record.category, 'enemies');
    assert.ok(record.sourceIds.length > 0); assert.ok(record.sourceIds.every(id => work.sources.some(source => source.id === id)));
    assert.ok(profile.notes.includes(record.description));
    for (const id of record.sourceIds) assert.ok(profile.notes.some(note => note.includes(id)));
    if (record.conditions) assert.ok(profile.notes.includes(`Conditions documentaires conservées : ${record.conditions}`));
  }
  assert.deepEqual(counts, { ME2: 7, ME3: 12, MEA: 13, INF: 4, GAL: 2, INV: 1, INC: 1 });
  for (const id of ['EVO-EN-META', 'EVO-EN-BENMETA']) {
    assert.equal(byId(id), undefined); assert.equal(getUniverseRecord(id).lockReason, 'ambiguous-segment');
  }
});

test('profiles are deeply immutable and separate bounded ATB budgets from closed null simulations', () => {
  assert.ok(Object.isFrozen(EXPANSION3_ENEMIES));
  for (const profile of EXPANSION3_ENEMIES) {
    assert.equal(profile.mode, 'enemy'); assert.equal(typeof profile.role, 'string');
    for (const value of [profile, profile.notes, profile.limitations, profile.constraints]) assert.ok(Object.isFrozen(value));
    assert.throws(() => { profile.notes.push('forged'); }, TypeError);
    assert.ok(profile.limitations.length >= 3);
    assert.ok(profile.notes.every(note => typeof note === 'string' && note.length > 0));
    assert.ok(profile.limitations.every(note => typeof note === 'string' && note.length > 0));
    if (profile.blockedReason) { assert.equal(profile.simulation, null); continue; }
    const stats = profile.simulation;
    assert.ok(Object.isFrozen(stats)); assert.ok(Object.isFrozen(stats.powers));
    assert.ok(stats.hp >= 100 && stats.hp <= 250); assert.ok(stats.shield >= 0 && stats.shield <= 50);
    assert.ok(stats.attack >= 10 && stats.attack <= 20); assert.ok(stats.defense >= 0 && stats.defense <= 8);
    assert.ok(stats.speed >= .5 && stats.speed <= 1.5);
    assert.ok(['shoot', 'strike'].includes(stats.primaryAction)); assert.deepEqual(stats.powers, []);
    assert.equal(typeof stats.synthetic, 'boolean'); assert.equal(stats.boss, false);
    assert.throws(() => { stats.hp = 9999; }, TypeError);
    assert.throws(() => { stats.powers.push('warp'); }, TypeError);
    assert.match(profile.notes.join(' '), /réglages ATB adaptés/);
    assert.match(profile.notes.join(' '), /aucun pouvoir nommé ni armement original attribué/);
  }
});

test('five attested ME2 DLC units require the explicitly prepared Legendary profile', () => {
  const editionProfiles = EXPANSION3_ENEMIES.filter(profile => profile.constraints.editionProfile);
  assert.deepEqual(editionProfiles.map(profile => profile.recordId), [
    'ME2-ENM-BROKER-AGENT', 'ME2-ENM-BROKER-VANGUARD', 'ME2-ENM-PROJECT-GUARD',
    'ME2-ENM-PROJECT-PYRO', 'ME2-ENM-PRISON-GUARD',
  ]);
  for (const profile of editionProfiles) {
    assert.equal(profile.constraints.editionProfile, 'legendary'); assert.ok(profile.simulation);
    assert.equal(getUniverseRecord(profile.recordId).mediaId, 'ME2');
    assert.match(profile.notes.join(' '), /DLC inclus dans Legendary Edition/);
    assert.match(profile.notes.join(' '), /aucune acquisition de contenu ni autorisation de rencontre/);
  }
  assert.match(byId('ME2-ENM-BROKER-VANGUARD').limitations.join(' '), /aucun pouvoir nommé/);
  assert.match(byId('ME2-ENM-PROJECT-PYRO').limitations.join(' '), /ni lance-flammes.*brûlure/);
  assert.match(byId('ME2-ENM-PRISON-GUARD').limitations.join(' '), /aucune identité ou arme.*Purgatory/);
});

test('twenty-five unsupported encounters remain closed without invented hostility, boss phases or campaign Collectors', () => {
  assert.equal(open.length, 15);
  const closed = EXPANSION3_ENEMIES.filter(profile => profile.blockedReason);
  assert.equal(closed.length, 25);
  for (const profile of closed) {
    assert.equal(profile.simulation, null); assert.ok(profile.blockedReason.length > 25);
    assert.match(profile.notes.join(' '), /aucune statistique de combat, action ou récompense/);
  }
  for (const id of ['ME3-ENM-COLLECTOR-TROOPER', 'ME3-ENM-COLLECTOR-CAPTAIN',
    'ME3-ENM-ABOMINATION', 'ME3-ENM-SCION', 'ME3-ENM-PRAETORIAN']) {
    assert.match(byId(id).blockedReason, /Retaliation.*Armax.*segment publié est me3/);
    assert.deepEqual(getUniverseRecord(id).availability, [{ mediaId: 'ME3', periodIds: ['me3'] }]);
  }
  for (const id of ['ME3-ENM-CAT6-MERC', 'ME3-ENM-CAT6-SPECIALIST', 'ME3-ENM-DISRUPTION', 'ME3-ENM-BROOKS']) {
    assert.match(byId(id).blockedReason, /DLC Citadel/);
  }
  assert.match(byId('ME2-ENM-HUMAN-REAPER').blockedReason, /confrontation finale/);
  assert.match(byId('ME2-ENM-OVERLORD').blockedReason, /VI.*transfert/);
  assert.match(byId('MEA-ENM-OBSERVER').blockedReason, /allégeance/);
  assert.match(byId('INV-EN-CERBERUS').blockedReason, /forces collectives.*soldat inventé/);
  assert.match(byId('GAL-ENM-JATH').blockedReason, /ambassadeur.*combattant/);
  for (const id of ['MEA-ENM-ADHI-WILD', 'MEA-ENM-ANCIENT-EIROCH', 'MEA-ENM-KAERKYN',
    'MEA-ENM-SPITBUG', 'MEA-ENM-TAURG', 'MEA-ENM-CHALLYRION']) assert.match(byId(id).blockedReason, /individuellement hostile/);
  for (const id of ['INF-ENM-OGRE', 'INF-ENM-ORCUS']) assert.match(byId(id).blockedReason, /contenu bonus.*aucune activation.*principale/);
});

test('all forty documentary identities remain in their precise work and segment across the full registry', () => {
  const contexts = UNIVERSE_WORKS.flatMap(work => work.periods.map(period => ({ mediaId: work.id, periodId: period.id })));
  for (const profile of EXPANSION3_ENEMIES) {
    const record = getUniverseRecord(profile.recordId), context = contextOf(profile);
    assert.equal(canAccessContent(profile.recordId, context).ok, true);
    for (const candidate of contexts) {
      const allowed = record.availability.some(scope => scope.mediaId === candidate.mediaId && scope.periodIds.includes(candidate.periodId));
      assert.equal(canAccessContent(profile.recordId, candidate).ok, allowed, `${profile.recordId}/${candidate.mediaId}/${candidate.periodId}`);
    }
  }
  assert.match(byId('INC-EN-COLLECTOR').limitations.join(' '), /sort des captifs.*restent fixés/);
  assert.match(byId('INV-EN-CERBERUS').limitations.join(' '), /occupation d’Omega.*départ d’Aria/);
});

test('five fixed defenses remain synthetic shoot fixtures and contact samples stay organic without granting skills', () => {
  const turrets = ['ME3-ENM-TURRET', 'ME3-ENM-GETH-TURRET', 'MEA-ENM-KETT-TURRET',
    'MEA-ENM-OUTLAW-TURRET', 'MEA-ENM-REM-TURRET'];
  for (const id of turrets) {
    const profile = byId(id);
    assert.equal(profile.simulation.synthetic, true); assert.equal(profile.simulation.primaryAction, 'shoot');
    assert.match(profile.limitations.join(' '), /Défense fixe.*aucun déplacement/);
    assert.match(profile.limitations.join(' '), /vitesse règle seulement la cadence/);
  }
  for (const id of ['MEA-ENM-ADHI-TRAINED', 'INF-ENM-SUBJECT']) {
    const profile = byId(id);
    assert.equal(profile.simulation.synthetic, false); assert.equal(profile.simulation.primaryAction, 'strike');
    const battle = createBattle({ mode: 'active', party: [{ id: 'test', hp: 500, powers: [] }], enemies: [native(profile)] });
    const enemy = battle.actors.find(actor => actor.team === 'enemy');
    assert.equal(enemy.synthetic, false); assert.deepEqual(enemy.powers, []);
    const ids = getActions(battle, enemy.id).map(action => action.id);
    assert.ok(ids.includes('strike')); assert.ok(!ids.includes('shoot')); assert.ok(!ids.includes('burst'));
  }
  assert.match(byId('MEA-ENM-ADHI-WILD').limitations.join(' '), /distinct de l’Adhi dressé/);
});

test('all fifteen open samples really act and damage an abstract target while preserving their immutable definitions', () => {
  for (const profile of open) {
    const source = native(profile), before = JSON.stringify(source);
    const battle = createBattle({ mode: 'active', seed: 41,
      party: [{ id: 'test-target', name: 'Cible ATB abstraite', hp: 2500, shield: 0, defense: 0, powers: [] }], enemies: [source] });
    for (let step = 0; step < 100; step++) tickBattle(battle, .25);
    const target = battle.actors.find(actor => actor.id === 'test-target'), enemy = battle.actors.find(actor => actor.team === 'enemy');
    assert.ok(target.hp < 2500, profile.recordId);
    assert.ok(battle.events.some(event => event.type === 'action' && event.actorId === enemy.id), profile.recordId);
    assert.deepEqual(enemy.powers, []); assert.equal(JSON.stringify(source), before);
  }
});

test('all fifteen open samples can be defeated by real shoot orders and exactly replayed with the same seed', () => {
  const simulate = profile => {
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
    return { winner: battle.winner, events: battle.events, actors: battle.actors, elapsed: battle.elapsed, orders };
  };
  for (const profile of open) assert.deepEqual(simulate(profile), simulate(profile), profile.recordId);
});

test('the third selection grants no named powers, rewards, recruitment or original weapon kit', () => {
  for (const profile of EXPANSION3_ENEMIES) {
    for (const key of ['xp', 'credits', 'reward', 'recruited', 'lost', 'outcome', 'phaseTable', 'weaponProfileId', 'equipmentProfileId']) {
      assert.equal(Object.hasOwn(profile, key), false);
      if (profile.simulation) assert.equal(Object.hasOwn(profile.simulation, key), false);
    }
    if (profile.simulation) assert.deepEqual(profile.simulation.powers, []);
    assert.match(profile.notes.join(' '), /aucun nouveau contrôle primaire/);
    assert.match(profile.limitations.join(' '), /Modèle visuel, animations, son et kit original non reconstitués/);
  }
});
