import test from 'node:test';
import assert from 'node:assert/strict';
import { EXPANSION2_CHARACTERS } from '../src/expansion2-characters.js';
import { EXPANSION_CHARACTERS } from '../src/expansion-characters.js';
import { EXPANSION_ARMOR } from '../src/expansion-armor.js';
import { EXPANSION_WEAPONS } from '../src/expansion-weapons.js';
import { EXPANSION_FLEET } from '../src/expansion-fleet.js';
import { EXPANSION_ENEMIES } from '../src/expansion-enemies.js';
import { UNIVERSE_WORKS, getUniverseRecord, getUniverseWork } from '../src/universe-data.js';
import { canAccessContent } from '../src/continuity.js';
import { CHRONICLE_SCENARIOS, UNIVERSE_ACTORS, getUniverseActor, canUseUniverseActor } from '../src/universe-actors.js';
import { createBattle, getActions, performAction, tickBattle } from '../src/combat.js';

const get = id => EXPANSION2_CHARACTERS.find(profile => profile.recordId === id);
const previous = [...EXPANSION_CHARACTERS, ...EXPANSION_ARMOR, ...EXPANSION_WEAPONS, ...EXPANSION_FLEET, ...EXPANSION_ENEMIES];
const expected = {
  MEA: ['MEA-CHR-MP-HUMAN-KINETICIST', 'MEA-CHR-MP-ASARI-DUELIST', 'MEA-CHR-MP-TURIAN-HAVOC',
    'MEA-CHR-MP-KROGAN-ENGINEER', 'MEA-CHR-MP-SALARIAN-ARCHITECT', 'MEA-CHR-MP-ANGARA-AVENGER',
    'MEA-CHR-MP-BATARIAN-VANGUARD', 'MEA-NPC-LEXI', 'MEA-NPC-KALLO', 'MEA-NPC-SUVI', 'MEA-NPC-GIL'],
  ME3: ['ME3-NPC-JACOB', 'ME3-NPC-KAI', 'ME3-NPC-PETROVSKY', 'ME3-NPC-CORTEZ', 'ME3-NPC-MICHEL', 'ME3-NPC-ADAMS', 'ME3-NPC-ALLERS'],
  ASC: ['ASC-CHR-PEL', 'ASC-CHR-GILLIAN', 'ASC-CHR-PAUL'],
  INI: ['INI-CHR-VLASSIA', 'INI-CHR-SAME'],
  ME2: ['ME2-NPC-KELLY', 'ME2-NPC-CHAKWAS', 'ME2-NPC-KEN', 'ME2-NPC-GABBY', 'ME2-NPC-VEETOR', 'ME2-NPC-OKEER', 'ME2-NPC-DAVID'],
  RED: ['RED-ACT-TIM'], REV: ['REV-CHR-KAHLEE', 'REV-CHR-GRISSOM', 'REV-CHR-EDAN'],
  RET: ['RET-CHR-LISELLE'], NEX: ['NEX-CHR-CALIX', 'NEX-CHR-IRIDA'],
  ANN: ['ANN-CHR-YORRIK', 'ANN-CHR-BORBALA', 'ANN-CHR-IRIT'],
};
const contexts = UNIVERSE_WORKS.flatMap(work => work.periods.map(period => ({ mediaId: work.id, periodId: period.id })));

test('forty established documentary references across ten published works are disjoint from all first-lot two hundred identities', () => {
  assert.equal(previous.length, 200);
  assert.equal(EXPANSION2_CHARACTERS.length, 40);
  const ids = EXPANSION2_CHARACTERS.map(profile => profile.recordId);
  assert.equal(new Set(ids).size, 40);
  assert.deepEqual([...ids].sort(), Object.values(expected).flat().sort());
  assert.equal(Object.keys(expected).length, 10);
  const oldIds = new Set(previous.map(profile => profile.recordId));
  for (const profile of EXPANSION2_CHARACTERS) {
    assert.equal(oldIds.has(profile.recordId), false);
    const record = getUniverseRecord(profile.recordId), work = getUniverseWork(record.mediaId);
    assert.equal(record.fact, true); assert.ok(['characters', 'npcs'].includes(record.category));
    assert.equal(record.playable, false); assert.equal(getUniverseActor(record.id).playable, false);
    assert.ok(work && !work.locked && !['ME4', 'CUT'].includes(work.id));
  }
});

test('seven APEX archetypes are explicitly distinct from thirty-three named character or entity occurrences', () => {
  const archetypes = EXPANSION2_CHARACTERS.filter(profile => profile.identityKind === 'multiplayer-archetype');
  const named = EXPANSION2_CHARACTERS.filter(profile => profile.identityKind === 'named-character-occurrence');
  assert.equal(archetypes.length, 7); assert.equal(named.length, 33);
  assert.equal(new Set(named.map(profile => getUniverseRecord(profile.recordId).name)).size, 33);
  for (const profile of archetypes) {
    assert.match(profile.notes.join(' '), /pas une personne nommée/);
    assert.match(profile.limitations.join(' '), /APEX uniquement/);
    assert.match(profile.limitations.join(' '), /pouvoirs, talents.*ne sont pas reproduits/);
  }
  assert.ok(named.includes(get('INI-CHR-SAME')), 'A named AI occurrence does not become a physical person or actor');
  assert.equal(get('INI-CHR-SAME').simulation, null);
});

test('all context scopes and supporting facts remain restricted to their published work and precise segment', () => {
  for (const profile of EXPANSION2_CHARACTERS) {
    assert.deepEqual(profile.contextScopes, getUniverseRecord(profile.recordId).availability);
    for (const context of contexts) {
      const inScope = profile.contextScopes.some(scope => scope.mediaId === context.mediaId && scope.periodIds.includes(context.periodId));
      assert.equal(canAccessContent(profile.recordId, context).ok, inScope, `${profile.recordId}/${context.mediaId}/${context.periodId}`);
      if (inScope) for (const sourceId of profile.sourceEntryIds) assert.equal(canAccessContent(sourceId, context).ok, true, sourceId);
    }
  }
  for (const profile of EXPANSION2_CHARACTERS.filter(entry => entry.identityKind === 'multiplayer-archetype')) {
    assert.deepEqual(profile.contextScopes, [{ mediaId: 'MEA', periodIds: ['mea-apex'] }]);
    assert.equal(canAccessContent(profile.recordId, { mediaId: 'MEA', periodId: 'mea-apex' }).ok, true);
    for (const context of [
      { mediaId: 'MEA', periodId: 'mea' }, { mediaId: 'MEA', periodId: 'mea-prologue' },
      { mediaId: 'ME3', periodId: 'me3-multiplayer' }, { mediaId: 'ME1', periodId: 'me1' },
    ]) assert.equal(canAccessContent(profile.recordId, context).ok, false);
  }
});

test('descriptions, conditions and original source definitions are copied without new primary kit certification', () => {
  for (const profile of EXPANSION2_CHARACTERS) {
    const record = getUniverseRecord(profile.recordId), work = getUniverseWork(record.mediaId);
    const anchors = profile.sourceEntryIds.map(getUniverseRecord);
    assert.equal(profile.mode, 'actor'); assert.ok(profile.role.length > 4);
    assert.equal(profile.notes[0], record.description);
    if (record.conditions) assert.ok(profile.notes.includes(record.conditions));
    assert.equal(profile.sourceEntryIds[0], profile.recordId);
    assert.deepEqual(profile.sourceIds, [...new Set(anchors.flatMap(item => item.sourceIds))]);
    assert.ok(profile.sourceIds.length);
    assert.ok(anchors.every(item => item.fact && item.mediaId === record.mediaId));
    assert.deepEqual(profile.provenance.sources, profile.sourceIds.map(id => work.sources.find(source => source.id === id)));
    assert.ok(profile.provenance.sources.every(Boolean));
    assert.equal(profile.provenance.catalogPath, record.provenance.catalogPath);
    assert.equal(profile.provenance.reference, record.reference);
    assert.match(profile.provenance.verification, /aucun nouveau contrôle primaire/);
    assert.match(profile.notes.join(' '), /aucun recrutement, rencontre originale ou résultat narratif/);
  }
  const kai = get('ME3-NPC-KAI');
  assert.deepEqual(kai.sourceEntryIds, ['ME3-NPC-KAI', 'ME3-ENM-KAI']);
  assert.match(kai.notes.join(' '), /Complément documentaire ME3-ENM-KAI : Boss récurrent de Cerberus/);
  assert.deepEqual(kai.provenance.supportingRecords.map(record => record.recordId), ['ME3-ENM-KAI']);
});

test('twelve bounded combat test budgets grant no named power, original class kit, resource or weapon model', () => {
  const combatants = EXPANSION2_CHARACTERS.filter(profile => profile.simulation);
  assert.equal(combatants.length, 12);
  for (const profile of combatants) {
    const stats = profile.simulation;
    assert.equal(profile.blockedReason, null); assert.equal(profile.statsBasis, 'ATB adaptation');
    assert.ok(stats.hp >= 180 && stats.hp <= 300); assert.ok(stats.shield >= 0 && stats.shield <= 120);
    assert.ok(stats.attack >= 18 && stats.attack <= 28); assert.ok(stats.defense >= 3 && stats.defense <= 9);
    assert.ok(stats.speed >= .85 && stats.speed <= 1.1);
    assert.equal(stats.synthetic, false); assert.equal(stats.primaryAction, 'shoot');
    assert.ok(Object.values(stats).every(value => typeof value !== 'number' || Number.isFinite(value)));
    assert.deepEqual(profile.powers, []);
    assert.match(profile.limitations.join(' '), /réglages de test ATB, sans équivalence certifiée/);
    assert.match(profile.limitations.join(' '), /aucun pouvoir ni modèle d’équipement nommé/);
    for (const key of ['weapon', 'weaponName', 'weaponProfileId', 'ammo', 'grenadeCharges', 'recruited', 'xp', 'credits', 'missionId']) {
      assert.equal(Object.hasOwn(profile, key), false); assert.equal(Object.hasOwn(stats, key), false);
    }
  }
});

test('twenty-eight inspected civilian, medical, technical, child and distant-entity roles have no dormant attacks', () => {
  const inspections = EXPANSION2_CHARACTERS.filter(profile => profile.simulation === null);
  assert.equal(inspections.length, 28);
  for (const profile of inspections) {
    assert.match(profile.blockedReason, /^Inspection seulement :/);
    assert.equal(profile.statsBasis, null); assert.deepEqual(profile.powers, []);
    assert.match(profile.limitations.join(' '), /aucune statistique, attaque ou escarmouche/);
    for (const key of ['attack', 'hp', 'primaryAction', 'synthetic', 'weaponProfileId', 'weaponName']) assert.equal(Object.hasOwn(profile, key), false);
  }
  assert.match(get('ASC-CHR-GILLIAN').blockedReason, /douze ans.*aucune version adulte/);
  assert.match(get('ME2-NPC-DAVID').blockedReason, /ni.*autorisation de transformer la personne en ennemi/);
  assert.match(get('INI-CHR-SAME').blockedReason, /ni corps ni entité combattante autonome/);
  assert.match(get('ME3-NPC-ADAMS').blockedReason, /pas automatiquement la classe/);
  assert.match(get('ANN-CHR-BORBALA').blockedReason, /ne prouve pas un armement/);
  assert.match(get('ASC-CHR-PAUL').blockedReason, /Cerberus n’est pas un kit/);
});

test('Petrovsky requires a prepared Legendary Omega context and Jacob never receives imported survival or an Armax kit', () => {
  const editions = EXPANSION2_CHARACTERS.filter(profile => profile.constraints.editionProfile !== null);
  assert.deepEqual(editions.map(profile => profile.recordId), ['ME3-NPC-PETROVSKY']);
  assert.equal(editions[0].constraints.editionProfile, 'legendary');
  assert.match(editions[0].notes.join(' '), /État préparé.*Omega présent/);
  assert.match(editions[0].notes.join(' '), /aucune conclusion du DLC/);
  assert.match(get('ME3-NPC-JACOB').notes.join(' '), /aucune survie de campagne n’est déduit/);
  assert.match(get('ME3-NPC-JACOB').limitations.join(' '), /aucun recrutement permanent ni kit Armax transféré/);
  for (const profile of EXPANSION2_CHARACTERS) assert.deepEqual(profile.powers, []);
});

test('forty documentary identities remain forbidden to all historical recruitment and scenario APIs', () => {
  assert.equal(CHRONICLE_SCENARIOS.length, 25);
  assert.equal(new Set(CHRONICLE_SCENARIOS.flatMap(scene => scene.actorIds)).size, 42);
  assert.equal(UNIVERSE_ACTORS.filter(actor => actor.playable).length, 42);
  for (const profile of EXPANSION2_CHARACTERS) {
    assert.equal(getUniverseActor(profile.recordId).playable, false);
    for (const scope of profile.contextScopes) for (const periodId of scope.periodIds) {
      assert.equal(canUseUniverseActor({ mediaId: scope.mediaId, periodId }, profile.recordId).ok, false);
    }
    assert.equal(CHRONICLE_SCENARIOS.some(scene => scene.actorIds.includes(profile.recordId)), false);
  }
  assert.equal(get('ME3-NPC-JACOB').recordId === 'ME3-CHR-ARENA-JACOB', false);
  assert.equal(get('ME3-NPC-KAI').recordId === 'RET-CHR-KAILENG', false);
});

test('all twelve combat definitions issue real damaging orders against an abstract target without mutating their sources', () => {
  for (const profile of EXPANSION2_CHARACTERS.filter(entry => entry.simulation)) {
    const before = JSON.stringify(profile), record = getUniverseRecord(profile.recordId);
    const battle = createBattle({ mode: 'wait', rng: () => .1,
      party: [{ ...profile.simulation, id: profile.recordId, name: record.name, powers: [] }],
      enemies: [{ id: 'abstract:target', name: 'Cible abstraite de test', abstract: true, hp: 3000, shield: 0,
        defense: 0, attack: 1, speed: .1, powers: [] }],
    });
    const native = battle.actors[0], target = battle.actors[1];
    for (let step = 0; step < 80 && native.atb < 100; step++) tickBattle(battle, .25);
    assert.ok(getActions(battle, native.id).some(action => action.id === 'shoot' && action.available), profile.recordId);
    const order = performAction(battle, { actorId: native.id, actionId: 'shoot', targetId: target.id });
    assert.equal(order.ok, true, profile.recordId);
    assert.ok(target.hp < target.maxHp); assert.equal(native.atb, 0);
    assert.ok(order.events.some(event => event.type === 'damage' && event.healthDamage > 0));
    assert.deepEqual(native.powers, []);
    native.hp = 1;
    assert.equal(JSON.stringify(profile), before); assert.notEqual(profile.simulation.hp, native.hp);
  }
});

test('the complete export including supporting evidence is deeply immutable and cannot mutate source records', () => {
  const frozenTree = value => {
    if (!value || typeof value !== 'object') return;
    assert.ok(Object.isFrozen(value)); Object.values(value).forEach(frozenTree);
  };
  frozenTree(EXPANSION2_CHARACTERS);
  const combatant = get('MEA-CHR-MP-HUMAN-KINETICIST'), record = getUniverseRecord(combatant.recordId);
  assert.notEqual(combatant.contextScopes, record.availability);
  assert.notEqual(combatant.sourceIds, record.sourceIds);
  assert.throws(() => { combatant.simulation.hp = 99999; }, TypeError);
  assert.throws(() => { combatant.contextScopes[0].periodIds.push('mea'); }, TypeError);
  assert.throws(() => { combatant.provenance.sources[0].scope = 'forged'; }, TypeError);
  assert.throws(() => { get('ASC-CHR-GILLIAN').simulation = { attack: 99999 }; }, TypeError);
  assert.throws(() => { get('ME3-NPC-KAI').sourceEntryIds.pop(); }, TypeError);
});
