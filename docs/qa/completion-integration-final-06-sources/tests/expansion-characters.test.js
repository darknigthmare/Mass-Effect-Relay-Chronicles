import test from 'node:test';
import assert from 'node:assert/strict';
import { EXPANSION_CHARACTERS } from '../src/expansion-characters.js';
import { UNIVERSE_WORKS, getUniverseRecord, getUniverseWork } from '../src/universe-data.js';
import { canAccessContent } from '../src/continuity.js';
import { CHRONICLE_SCENARIOS, UNIVERSE_ACTORS, getUniverseActor, canUseUniverseActor } from '../src/universe-actors.js';
import { createBattle, getActions, performAction, tickBattle } from '../src/combat.js';

const get = id => EXPANSION_CHARACTERS.find(profile => profile.recordId === id);
const selected = {
  ME2: ['ME2-NPC-RENEGAR', 'ME2-NPC-JEDORE', 'ME2-NPC-VASIR', 'ME2-CHR-KENSON', 'ME2-NPC-JOKER', 'ME2-NPC-EDI'],
  ME3: ['ME3-CHR-ARENA-GRUNT', 'ME3-CHR-ARENA-JACK', 'ME3-CHR-ARENA-JACOB', 'ME3-CHR-ARENA-KASUMI',
    'ME3-CHR-ARENA-MIRANDA', 'ME3-CHR-ARENA-SAMARA', 'ME3-CHR-ARENA-ZAEED', 'ME3-NPC-TARQUIN', 'ME3-NPC-TRAYNOR'],
  MEA: ['MEA-NPC-KANDROS', 'MEA-NPC-EVFRA'],
  REV: ['REV-CHR-ANDERSON', 'REV-CHR-SAREN', 'REV-CHR-SKARR', 'REV-CHR-JILL'],
  ASC: ['ASC-CHR-HENDEL'], RET: ['RET-CHR-KAILENG', 'RET-CHR-SANAK'],
  INI: ['INI-CHR-YGARA', 'INI-CHR-ZAHRA', 'INI-CHR-CORA'],
  INV: ['INV-ACT-ARIA'], INC: ['INC-ACT-ARIA'], PL: ['PL-CHR-ARCHUK'],
  GAL: ['GAL-CHR-MIRANDA'], INF: ['INF-NPC-INALI'],
  NEX: ['NEX-CHR-SLOANE', 'NEX-CHR-KESH'], ANN: ['ANN-CHR-ANAX', 'ANN-CHR-SENNA'],
  HOM: ['HOM-ACT-LIARA'], FOU: ['FOU-ACT-MIRANDA'], INQ: ['INQ-ACT-BAILEY'], DIS: ['DIS-ACT-TIRAN'],
};
const inspections = [
  'ME2-CHR-KENSON', 'ME2-NPC-JOKER', 'ME2-NPC-EDI', 'ME3-NPC-TRAYNOR', 'GAL-CHR-MIRANDA',
  'INF-NPC-INALI', 'NEX-CHR-SLOANE', 'NEX-CHR-KESH', 'INI-CHR-CORA', 'ANN-CHR-ANAX',
  'ANN-CHR-SENNA', 'HOM-ACT-LIARA', 'FOU-ACT-MIRANDA', 'INQ-ACT-BAILEY', 'DIS-ACT-TIRAN',
];
const contexts = UNIVERSE_WORKS.flatMap(work => work.periods.map(period => ({ mediaId: work.id, periodId: period.id })));

test('exactly forty previously documentary occurrences span eighteen published works', () => {
  assert.equal(EXPANSION_CHARACTERS.length, 40);
  assert.equal(new Set(EXPANSION_CHARACTERS.map(profile => profile.recordId)).size, 40);
  assert.deepEqual(EXPANSION_CHARACTERS.map(profile => profile.recordId).sort(), Object.values(selected).flat().sort());
  assert.equal(Object.keys(selected).length, 18);
  for (const [mediaId, ids] of Object.entries(selected)) {
    const work = getUniverseWork(mediaId);
    assert.ok(work && !work.locked);
    assert.ok(!['ME4', 'CUT'].includes(mediaId));
    for (const id of ids) {
      const record = getUniverseRecord(id);
      assert.equal(record.mediaId, mediaId); assert.equal(record.fact, true);
      assert.ok(['characters', 'npcs'].includes(record.category));
      assert.equal(record.playable, false);
      assert.equal(getUniverseActor(id).playable, false);
    }
  }
});

test('source descriptions, conditions and full source provenance are preserved without kit certification', () => {
  for (const profile of EXPANSION_CHARACTERS) {
    const record = getUniverseRecord(profile.recordId), work = getUniverseWork(record.mediaId);
    assert.equal(profile.mode, 'actor'); assert.ok(profile.role.length > 4);
    assert.equal(profile.notes[0], record.description);
    if (record.conditions) assert.ok(profile.notes.includes(record.conditions));
    assert.deepEqual(profile.sourceEntryIds, [record.id]);
    assert.deepEqual(profile.sourceIds, record.sourceIds);
    assert.ok(profile.sourceIds.length > 0);
    assert.deepEqual(profile.provenance.sources, record.sourceIds.map(id => work.sources.find(source => source.id === id)));
    assert.equal(profile.provenance.catalogPath, record.provenance.catalogPath);
    assert.equal(profile.provenance.reference, record.reference);
    assert.match(profile.provenance.verification, /aucun nouveau contrôle primaire/);
    assert.match(profile.notes.join(' '), /aucun recrutement ni rencontre originale/);
  }
});

test('scope metadata remains exact across every registered work and segment, including anthology numbers', () => {
  for (const profile of EXPANSION_CHARACTERS) {
    const record = getUniverseRecord(profile.recordId);
    assert.deepEqual(profile.contextScopes, record.availability);
    for (const context of contexts) {
      const inScope = profile.contextScopes.some(scope => scope.mediaId === context.mediaId && scope.periodIds.includes(context.periodId));
      assert.equal(canAccessContent(profile.recordId, context).ok, inScope,
        `${profile.recordId}/${context.mediaId}/${context.periodId}`);
    }
  }
  assert.deepEqual(get('HOM-ACT-LIARA').contextScopes, [{ mediaId: 'HOM', periodIds: ['hom-4-liara'] }]);
  assert.deepEqual(get('FOU-ACT-MIRANDA').contextScopes, [{ mediaId: 'FOU', periodIds: ['fou-5'] }]);
  assert.deepEqual(get('PL-CHR-ARCHUK').contextScopes, [{ mediaId: 'PL', periodIds: ['pl-2183'] }]);
  for (const [id, context] of [
    ['PL-CHR-ARCHUK', { mediaId: 'PL', periodId: 'pl-collectors' }],
    ['FOU-ACT-MIRANDA', { mediaId: 'FOU', periodId: 'fou-6' }],
    ['HOM-ACT-LIARA', { mediaId: 'HOM', periodId: 'hom-4-garrus' }],
    ['INI-CHR-YGARA', { mediaId: 'MEA', periodId: 'mea' }],
    ['REV-CHR-ANDERSON', { mediaId: 'ME3', periodId: 'me3-prologue' }],
  ]) assert.equal(canAccessContent(id, context).ok, false);
});

test('fifteen inspection-only roles have no dormant attack, statistics, body or borrowed kit', () => {
  assert.deepEqual(EXPANSION_CHARACTERS.filter(profile => profile.simulation === null).map(profile => profile.recordId), inspections);
  for (const id of inspections) {
    const profile = get(id);
    assert.equal(profile.simulation, null);
    assert.equal(profile.statsBasis, null);
    assert.match(profile.blockedReason, /^Inspection seulement :/);
    assert.match(profile.limitations.join(' '), /aucune statistique, attaque ou escarmouche/);
    assert.deepEqual(profile.powers, []);
    for (const key of ['hp', 'attack', 'primaryAction', 'synthetic', 'weaponName', 'weaponProfileId', 'loadout']) assert.equal(Object.hasOwn(profile, key), false);
  }
  assert.match(get('ME2-NPC-EDI').blockedReason, /aucun corps.*ME3/);
  assert.match(get('GAL-CHR-MIRANDA').blockedReason, /pas le kit jouable.*ME2/);
  assert.match(get('INI-CHR-CORA').blockedReason, /aucun kit de MEA/);
  assert.match(get('ANN-CHR-ANAX').blockedReason, /biotiques ne prouvent pas un armement/);
});

test('twenty-five generic combat definitions are bounded, explicitly adapted and free of named powers or equipment', () => {
  const combatants = EXPANSION_CHARACTERS.filter(profile => profile.simulation !== null);
  assert.equal(combatants.length, 25);
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
    for (const key of ['weapon', 'weaponName', 'weaponType', 'weaponProfileId', 'recruited', 'xp', 'credits', 'missionId']) {
      assert.equal(Object.hasOwn(profile, key), false);
      assert.equal(Object.hasOwn(stats, key), false);
    }
  }
});

test('Armax and Shadow Broker variants retain explicit prepared-edition prerequisites and survival limits', () => {
  const editionEntries = EXPANSION_CHARACTERS.filter(profile => profile.constraints.editionProfile);
  assert.equal(editionEntries.length, 8);
  for (const profile of editionEntries) {
    assert.equal(profile.constraints.editionProfile, 'legendary');
    assert.match(profile.notes.join(' '), /État préparé/);
    if (profile.recordId.includes('-ARENA-')) {
      assert.match(profile.notes.join(' '), /Citadel\/Armax.*vivant/);
      assert.match(profile.limitations.join(' '), /Armax uniquement.*aucun équipier permanent/);
      assert.match(profile.notes.join(' '), /aucun état de campagne n’est importé/);
    }
  }
  for (const profile of EXPANSION_CHARACTERS.filter(entry => !editionEntries.includes(entry))) assert.deepEqual(profile.constraints, { editionProfile: null });
});

test('same-name occurrences never share playable rights, age, body or kit across works', () => {
  assert.notEqual(get('INV-ACT-ARIA'), get('INC-ACT-ARIA'));
  for (const [id, context] of [
    ['INV-ACT-ARIA', { mediaId: 'INC', periodId: 'inc' }],
    ['INC-ACT-ARIA', { mediaId: 'INV', periodId: 'inv' }],
    ['ME3-CHR-ARENA-MIRANDA', { mediaId: 'ME2', periodId: 'me2' }],
    ['FOU-ACT-MIRANDA', { mediaId: 'GAL', periodId: 'gal' }],
    ['ME2-NPC-EDI', { mediaId: 'ME3', periodId: 'me3' }],
  ]) assert.equal(canAccessContent(id, context).ok, false);
  assert.equal(get('GAL-CHR-MIRANDA').simulation, null);
  assert.equal(get('FOU-ACT-MIRANDA').simulation, null);
  assert.ok(get('ME3-CHR-ARENA-MIRANDA').simulation);
});

test('independent definitions do not add any historical recruitment or scenario permission', () => {
  assert.equal(CHRONICLE_SCENARIOS.length, 25);
  assert.equal(new Set(CHRONICLE_SCENARIOS.flatMap(scenario => scenario.actorIds)).size, 42);
  assert.equal(UNIVERSE_ACTORS.filter(actor => actor.playable).length, 42);
  for (const profile of EXPANSION_CHARACTERS) {
    assert.equal(getUniverseActor(profile.recordId).playable, false);
    for (const scope of profile.contextScopes) for (const periodId of scope.periodIds) {
      assert.equal(canUseUniverseActor({ mediaId: scope.mediaId, periodId }, profile.recordId).ok, false);
    }
    assert.equal(CHRONICLE_SCENARIOS.some(scenario => scenario.actorIds.includes(profile.recordId)), false);
  }
});

test('all generic combatants can issue a real damaging ATB order without mutating their documentary definitions', () => {
  for (const profile of EXPANSION_CHARACTERS.filter(entry => entry.simulation)) {
    const record = getUniverseRecord(profile.recordId), before = JSON.stringify(profile);
    const battle = createBattle({ mode: 'wait', rng: () => .1,
      party: [{ id: profile.recordId, name: record.name, ...profile.simulation, powers: [] }],
      enemies: [{ id: 'abstract:target', name: 'Cible abstraite de test', abstract: true, hp: 3000,
        shield: 0, defense: 0, attack: 1, speed: .1, powers: [] }],
    });
    const native = battle.actors[0], target = battle.actors[1];
    for (let step = 0; step < 80 && native.atb < 100; step++) tickBattle(battle, .25);
    assert.ok(getActions(battle, native.id).some(action => action.id === 'shoot' && action.available), profile.recordId);
    assert.deepEqual(native.powers, []);
    const order = performAction(battle, { actorId: native.id, actionId: 'shoot', targetId: target.id });
    assert.equal(order.ok, true, profile.recordId);
    assert.ok(target.hp < target.maxHp); assert.equal(native.atb, 0);
    assert.ok(order.events.some(event => event.type === 'damage' && event.healthDamage > 0));
    native.hp = 1;
    assert.equal(JSON.stringify(profile), before);
    assert.notEqual(profile.simulation.hp, native.hp);
  }
});

test('every exported profile and all nested provenance, scopes and statistics are immutable', () => {
  function frozenTree(value) {
    if (!value || typeof value !== 'object') return;
    assert.ok(Object.isFrozen(value));
    for (const child of Object.values(value)) frozenTree(child);
  }
  frozenTree(EXPANSION_CHARACTERS);
  const profile = EXPANSION_CHARACTERS[0], source = getUniverseRecord(profile.recordId);
  assert.notEqual(profile.contextScopes, source.availability);
  assert.notEqual(profile.sourceIds, source.sourceIds);
  assert.throws(() => { profile.simulation.hp = 99999; }, TypeError);
  assert.throws(() => { profile.contextScopes[0].periodIds.push('me3'); }, TypeError);
  assert.throws(() => { profile.provenance.sources[0].scope = 'forged'; }, TypeError);
  assert.throws(() => { get('ME2-NPC-JOKER').simulation = { attack: 9999 }; }, TypeError);
});
