import test from 'node:test';
import assert from 'node:assert/strict';
import { ACTIONS, createBattle } from '../src/combat.js';
import { getUniverseRecord } from '../src/universe-data.js';
import { canAccessContent } from '../src/continuity.js';
import { createChronicle, setChronicleParty, startChronicleBattle } from '../src/chronicles.js';
import { UNIVERSE_ACTORS, CHRONICLE_SCENARIOS, SCENARIOS, getUniverseActor, getUniverseActorProfile, canUseUniverseActor, universeActorFor, getUniverseScenario } from '../src/universe-actors.js';

test('documentary identities remain distinct across works and never gain combat statistics by default', () => {
  assert.ok(UNIVERSE_ACTORS.length > 100);
  assert.equal(new Set(UNIVERSE_ACTORS.map(actor => actor.id)).size, UNIVERSE_ACTORS.length);
  for (const actor of UNIVERSE_ACTORS) {
    assert.ok(getUniverseRecord(actor.id));
    assert.equal(actor.sprite, null); assert.equal(actor.portrait, null);
    if (!actor.playable) {
      assert.deepEqual(actor.powers, []); assert.deepEqual(actor.allowedWeapons, []);
      assert.equal(actor.statsBasis, null);
    }
  }
  assert.notEqual(getUniverseActor('ME2-CHR-JACOB'), getUniverseActor('GAL-CHR-JACOB'));
  assert.notEqual(getUniverseActor('ME3-CHR-LIARA'), getUniverseActor('RED-ACT-LIARA'));
  assert.equal(getUniverseActor('GAL-CHR-MIRANDA').playable, false, 'Remote narrative support is not a field squad member');
});

test('every tactical scenario has real source identifiers and a valid bounded explicit roster', () => {
  assert.equal(SCENARIOS, CHRONICLE_SCENARIOS);
  assert.equal(CHRONICLE_SCENARIOS.length, 10);
  for (const scenario of CHRONICLE_SCENARIOS) {
    assert.match(scenario.description, /Essai tactique/);
    assert.ok(scenario.sourceEntryIds.length > 0);
    for (const id of scenario.sourceEntryIds) assert.ok(getUniverseRecord(id), id);
    for (const enemy of scenario.enemies) {
      if (enemy.catalogId === null) {
        assert.equal(enemy.abstract, true);
        assert.ok(['equipment-workshop', 'tactical-simulation'].includes(scenario.kind));
      } else assert.equal(canAccessContent(enemy.catalogId, scenario.context).ok, true, enemy.catalogId);
    }
    assert.ok(scenario.defaultParty.length >= 1 && scenario.defaultParty.length <= 3);
    assert.equal(getUniverseScenario(scenario.context, scenario.id), scenario);
    for (const id of scenario.actorIds) {
      assert.equal(canUseUniverseActor(scenario.context, id, scenario.id).ok, true, `${scenario.id}/${id}`);
      const actor = universeActorFor(id, scenario.context);
      assert.ok(actor && actor.hp >= 100 && actor.hp <= 400);
      assert.ok(actor.attack > 0 && actor.attack <= 40);
      assert.ok(actor.powers.every(power => ACTIONS[power]));
      assert.equal(actor.visualMode, 'prototype-symbol');
      assert.equal(actor.sprite, null);
      const battle = createBattle({ party: [actor], enemies: scenario.enemies });
      assert.equal(new Set(battle.actors.map(unit => unit.id)).size, battle.actors.length);
    }
  }
});

test('equipment workshops whitelist same-work models without inventing mission possession or armour ownership', () => {
  const workshops = CHRONICLE_SCENARIOS.filter(scene => scene.kind === 'equipment-workshop');
  assert.equal(workshops.length, 3);
  assert.equal(workshops.reduce((sum, scene) => sum + scene.allowedEquipmentIds.length, 0), 68);
  for (const scene of workshops) {
    assert.ok(scene.allowedEquipmentIds.every(id => id.startsWith(`${scene.context.mediaId}-`)));
    assert.ok(scene.allowedEquipmentIds.every(id => getUniverseRecord(id)));
    assert.match(scene.description, /banc de production indépendant/);
    assert.ok(scene.enemies.every(enemy => enemy.catalogId === null && enemy.abstract === true));
  }
  for (const scene of CHRONICLE_SCENARIOS.filter(scene => scene.kind !== 'equipment-workshop')) assert.deepEqual(scene.allowedEquipmentIds, []);
});

test('workshops expose the main companion rosters while preserving exclusive and temporary roles', () => {
  const me2 = CHRONICLE_SCENARIOS.find(scene => scene.id === 'me2-equipment-workshop');
  const me3 = CHRONICLE_SCENARIOS.find(scene => scene.id === 'me3-equipment-workshop');
  const mea = CHRONICLE_SCENARIOS.find(scene => scene.id === 'mea-equipment-workshop');
  assert.equal(me2.actorIds.length, 12); assert.equal(me3.actorIds.length, 8); assert.equal(mea.actorIds.length, 7);
  assert.deepEqual(me2.exclusiveActorGroups, [['ME2-CHR-SAMARA', 'ME2-CHR-MORINTH']]);
  assert.deepEqual(me3.exclusiveActorGroups, [['ME3-CHR-ASHLEY', 'ME3-CHR-KAIDAN']]);
  for (const id of ['ME2-CHR-LIARA', 'ME2-CHR-KENSON', 'ME2-CHR-KASUMI', 'ME2-CHR-ZAEED']) assert.equal(me2.actorIds.includes(id), false);
  for (const id of ['ME3-CHR-ANDERSON', 'ME3-CHR-ARIA', 'ME3-CHR-NYREEN', 'ME3-CHR-WREX']) assert.equal(me3.actorIds.includes(id), false);
  assert.equal(mea.actorIds.includes('MEA-CHR-ALEC'), false);
  assert.equal(new Set(CHRONICLE_SCENARIOS.flatMap(scene => scene.actorIds)).size, 34);
  for (const scene of [me2, me3, mea]) {
    assert.equal(scene.defaultParty.length, 3);
    for (const group of scene.exclusiveActorGroups) assert.ok(group.every(id => scene.actorIds.includes(id)));
    assert.match(scene.description, /Cet atelier ne recrute personne dans une campagne/);
  }
});

test('session APIs enforce companion alternatives and can start each added workshop combatant', () => {
  for (const scene of CHRONICLE_SCENARIOS.filter(item => item.kind === 'equipment-workshop')) {
    const session = createChronicle(scene.context, scene.id);
    assert.ok(session);
    for (const actorId of scene.actorIds) {
      const selected = setChronicleParty(session, [actorId]);
      assert.equal(selected.ok, true, actorId);
      assert.equal(startChronicleBattle(selected.session).ok, true, actorId);
    }
    for (const group of scene.exclusiveActorGroups) {
      const before = JSON.stringify(session);
      assert.equal(setChronicleParty(session, [scene.actorIds[0], ...group]).ok, false);
      assert.equal(JSON.stringify(session), before);
      for (const actorId of group) assert.equal(setChronicleParty(session, [scene.actorIds[0], actorId]).ok, true);
    }
  }
});

test('uncertain comic opponents stay closed and are never renamed into canonical encounters', () => {
  const scene = CHRONICLE_SCENARIOS.find(item => item.id === 'red-liara-feron');
  assert.equal(scene.kind, 'tactical-simulation');
  assert.ok(scene.enemies.every(enemy => enemy.catalogId === null && enemy.abstract === true));
  assert.ok(scene.enemies.every(enemy => enemy.name.startsWith('Mannequin')));
  assert.match(scene.description, /aucun événement du récit n’est rejoué/);
  assert.equal(scene.sourceEntryIds.includes('RED-EN-SUNS'), false);
});

test('work, galaxy, prologue and scenario restrictions cannot become recruitment shortcuts', () => {
  assert.equal(canUseUniverseActor({ mediaId: 'ME1', periodId: 'me1' }, 'ME2-CHR-JACK').ok, false);
  assert.equal(canUseUniverseActor({ mediaId: 'ME2', periodId: 'me2' }, 'ME2-CHR-JACK', 'me2-freedoms-progress').ok, false);
  assert.equal(canUseUniverseActor({ mediaId: 'ME3', periodId: 'me3' }, 'ME3-CHR-ANDERSON').ok, false);
  assert.equal(canUseUniverseActor({ mediaId: 'MEA', periodId: 'mea' }, 'MEA-CHR-ALEC').ok, false);
  assert.equal(canUseUniverseActor({ mediaId: 'MEA', periodId: 'mea-prologue', galaxy: 'milky-way' }, 'MEA-CHR-RYDER').ok, false);
  assert.equal(canUseUniverseActor({ mediaId: 'PL', periodId: 'pl-2183' }, 'PL-CHR-VEGA', 'pl-collectors').ok, false);
  assert.equal(canUseUniverseActor({ mediaId: 'GAL', periodId: 'gal' }, 'GAL-CHR-MIRANDA', 'gal-jacob').ok, false);
  assert.equal(universeActorFor('ME2-CHR-JACK', { mediaId: 'ME1', periodId: 'me1' }), null);
});

test('native combat profiles use only existing documented power subsets and expose missing mechanics', () => {
  assert.deepEqual(getUniverseActor('ME2-CHR-MIRANDA').powers, ['warp', 'overload']);
  assert.deepEqual(getUniverseActor('GAL-CHR-JACOB').powers, ['stasis', 'overload']);
  assert.deepEqual(getUniverseActor('ME2-CHR-JACOB').powers, []);
  assert.deepEqual(getUniverseActor('ME2-CHR-GRUNT').powers, [], 'Fortification is not a biotic Barrier');
  assert.deepEqual(getUniverseActor('MEA-CHR-CORA').powers, [], 'Charge/Nova/Shield Boost are not silently replaced by ME1 abilities');
  assert.equal(getUniverseActor('MEA-CHR-CORA').biotic, true);
  assert.ok(getUniverseActor('MEA-CHR-CORA').missingPowers.includes('Charge'));
  assert.equal(universeActorFor('ME3-CHR-SHEPARD', { mediaId: 'ME3', periodId: 'me3-prologue' }).weaponSystem, 'thermal-clip');
  assert.equal(universeActorFor('GAL-CHR-JACOB', { mediaId: 'GAL', periodId: 'gal' }).weaponSystem, 'heat');
});

test('actor builders return independent snapshots without allocating items or mutating source profiles', () => {
  const context = { mediaId: 'ME2', periodId: 'me2' }, profile = getUniverseActorProfile('ME2-CHR-MIRANDA', context);
  assert.ok(Object.isFrozen(profile)); assert.ok(Object.isFrozen(profile.powers));
  const first = universeActorFor(profile.id, context); first.powers.length = 0; first.hp = 1;
  const second = universeActorFor(profile.id, context);
  assert.deepEqual(second.powers, ['warp', 'overload']); assert.equal(second.hp, 220);
  for (const id of ['unknown', '__proto__', 'constructor', null, 7]) assert.equal(getUniverseActor(id), null);
});
