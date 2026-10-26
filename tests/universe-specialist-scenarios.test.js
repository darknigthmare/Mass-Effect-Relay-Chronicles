import test from 'node:test';
import assert from 'node:assert/strict';
import { createBattle, ACTIONS } from '../src/combat.js';
import { getMediaPeriod } from '../src/continuity-data.js';
import { canAccessContent } from '../src/continuity.js';
import { getUniverseRecord, getUniverseWork } from '../src/universe-data.js';
import { SPECIALIST_SCENARIOS } from '../src/universe-specialist-scenarios.js';
import { CHRONICLE_SCENARIOS, HISTORICAL_CHRONICLE_SCENARIOS, canUseUniverseActor, universeActorFor, getUniverseActor } from '../src/universe-actors.js';
import { createChronicle, setChronicleParty, encodeChronicle, decodeChronicle } from '../src/chronicles.js';
import { newGame } from '../src/state.js';

const expected = {
  'me2-dlc-specialists': { mediaId: 'ME2', periodId: 'me2', party: ['ME2-CHR-SHEPARD', 'ME2-CHR-KASUMI', 'ME2-CHR-ZAEED'] },
  'me2-shadow-broker': { mediaId: 'ME2', periodId: 'me2', party: ['ME2-CHR-SHEPARD', 'ME2-CHR-LIARA'] },
  'me3-from-ashes': { mediaId: 'ME3', periodId: 'me3', party: ['ME3-CHR-SHEPARD', 'ME3-CHR-JAVIK'] },
  'me3-omega': { mediaId: 'ME3', periodId: 'me3', party: ['ME3-CHR-SHEPARD', 'ME3-CHR-ARIA', 'ME3-CHR-NYREEN'] },
  'me3-citadel-wrex': { mediaId: 'ME3', periodId: 'me3', party: ['ME3-CHR-SHEPARD', 'ME3-CHR-WREX'] },
  'inf-incarceration': { mediaId: 'INF', periodId: 'inf', party: ['INF-CHR-TURIAN'] },
};
const originalRosters = {
  'me2-freedoms-progress': ['ME2-CHR-SHEPARD', 'ME2-CHR-MIRANDA', 'ME2-CHR-JACOB'],
  'me3-earth-prologue': ['ME3-CHR-SHEPARD', 'ME3-CHR-ANDERSON'],
  'mea-habitat7': ['MEA-CHR-RYDER', 'MEA-CHR-ALEC'],
  'inf-security': ['INF-CHR-RANDALL'],
  'gal-jacob': ['GAL-CHR-JACOB'],
  'pl-collectors': ['PL-CHR-VEGA'],
  'red-liara-feron': ['RED-ACT-LIARA', 'RED-ACT-FERON'],
  'me2-equipment-workshop': ['ME2-CHR-SHEPARD', 'ME2-CHR-MIRANDA', 'ME2-CHR-JACOB', 'ME2-CHR-MORDIN', 'ME2-CHR-GARRUS', 'ME2-CHR-GRUNT', 'ME2-CHR-JACK', 'ME2-CHR-TALI', 'ME2-CHR-THANE', 'ME2-CHR-SAMARA', 'ME2-CHR-LEGION', 'ME2-CHR-MORINTH'],
  'me3-equipment-workshop': ['ME3-CHR-SHEPARD', 'ME3-CHR-LIARA', 'ME3-CHR-JAMES', 'ME3-CHR-GARRUS', 'ME3-CHR-EDI', 'ME3-CHR-TALI', 'ME3-CHR-ASHLEY', 'ME3-CHR-KAIDAN'],
  'mea-equipment-workshop': ['MEA-CHR-RYDER', 'MEA-CHR-CORA', 'MEA-CHR-LIAM', 'MEA-CHR-VETRA', 'MEA-CHR-JAAL', 'MEA-CHR-DRACK', 'MEA-CHR-PEEBEE'],
};

test('six specialist benches reuse registered contexts and expose the exact prepared rosters', () => {
  assert.equal(SPECIALIST_SCENARIOS.length, 6);
  assert.deepEqual(SPECIALIST_SCENARIOS.map(scene => scene.id), Object.keys(expected));
  for (const scene of SPECIALIST_SCENARIOS) {
    const definition = expected[scene.id];
    assert.equal(scene.kind, 'specialist-workshop');
    assert.equal(scene.context.mediaId, definition.mediaId); assert.equal(scene.context.periodId, definition.periodId);
    assert.ok(getMediaPeriod(scene.context.mediaId, scene.context.periodId));
    assert.deepEqual(scene.actorIds, definition.party); assert.deepEqual(scene.defaultParty, definition.party);
    assert.ok(scene.defaultParty.length >= 1 && scene.defaultParty.length <= 3);
    assert.deepEqual(scene.allowedEquipmentIds, []);
    assert.ok(scene.preparedConditions.length >= 2); assert.match(scene.description, /état préparé|État préparé/);
    assert.match(scene.description, /mannequins originaux/); assert.match(scene.description, /dotations abstraites/);
    assert.match(scene.description, /Aucune mission source n’est rejouée/);
    assert.match(scene.description, /n’accorde ni recrutement, ni loyauté, ni survie, ni récompense/);
    assert.equal(Object.isFrozen(scene), true); assert.equal(Object.isFrozen(scene.preparedConditions), true);
  }
});

test('every bench source is established, in the same work and exact segment, and retains its source IDs', () => {
  for (const scene of SPECIALIST_SCENARIOS) {
    const work = getUniverseWork(scene.context.mediaId);
    for (const id of scene.sourceEntryIds) {
      const record = getUniverseRecord(id);
      assert.ok(record, id); assert.equal(record.fact, true); assert.equal(record.nature, 'Établi');
      assert.equal(canAccessContent(id, scene.context).ok, true, id);
      assert.equal(record.mediaId, scene.context.mediaId);
      for (const sourceId of record.sourceIds) {
        assert.ok(scene.sourceIds.includes(sourceId)); assert.ok(work.sources.some(source => source.id === sourceId));
      }
    }
    for (const id of scene.actorIds) assert.ok(scene.sourceEntryIds.includes(id));
  }
});

test('prepared edition, loyalty and survival conditions are visible without creating a campaign result', () => {
  const byId = id => SPECIALIST_SCENARIOS.find(scene => scene.id === id);
  assert.match(byId('me2-dlc-specialists').description, /post-loyauté/);
  assert.match(byId('me2-dlc-specialists').preparedConditions.join(' '), /Stolen Memory.*The Price of Revenge/);
  assert.match(byId('me2-shadow-broker').description, /rôle d’équipière.*temporaire/);
  assert.match(byId('me3-from-ashes').description, /Javik déjà recruté/);
  assert.match(byId('me3-omega').description, /avant la perte de Nyreen/);
  assert.match(byId('me3-citadel-wrex').description, /Wrex vivant/);
  assert.match(byId('inf-incarceration').preparedConditions.join(' '), /Prisonnier turien seul.*Randall/);
  for (const scene of SPECIALIST_SCENARIOS) for (const key of ['reward', 'credits', 'xp', 'recruited', 'lost', 'choices']) assert.equal(Object.hasOwn(scene, key), false);
});

test('eight newly reachable identities remain excluded from every older scenario and other specialist benches', () => {
  assert.equal(HISTORICAL_CHRONICLE_SCENARIOS.length, 16);
  assert.deepEqual(CHRONICLE_SCENARIOS.slice(0, 16), HISTORICAL_CHRONICLE_SCENARIOS);
  assert.equal(new Set(CHRONICLE_SCENARIOS.flatMap(scene => scene.actorIds)).size, 42);
  assert.deepEqual(CHRONICLE_SCENARIOS.slice(0, 10).map(scene => scene.id), Object.keys(originalRosters));
  for (const [id, actorIds] of Object.entries(originalRosters)) {
    const scene = CHRONICLE_SCENARIOS.find(item => item.id === id);
    assert.deepEqual(scene.actorIds, actorIds);
  }
  const specialists = [...new Set(SPECIALIST_SCENARIOS.flatMap(scene => scene.actorIds))].filter(id => !id.endsWith('-SHEPARD'));
  assert.equal(specialists.length, 8);
  for (const actorId of specialists) {
    assert.equal(getUniverseActor(actorId).playable, true);
    const onlyScene = SPECIALIST_SCENARIOS.find(scene => scene.actorIds.includes(actorId));
    assert.equal(canUseUniverseActor(onlyScene.context, actorId, onlyScene.id).ok, true);
    for (const other of CHRONICLE_SCENARIOS.filter(scene => scene.id !== onlyScene.id)) {
      assert.equal(canUseUniverseActor(other.context, actorId, other.id).ok, false, `${actorId}/${other.id}`);
    }
    assert.equal(canUseUniverseActor({ mediaId: 'ME1', periodId: 'me1' }, actorId, onlyScene.id).ok, false);
  }
});

test('abstract target definitions build real independent battles without named canonical enemies', () => {
  const campaign = newGame(), before = JSON.stringify(campaign);
  for (const scene of SPECIALIST_SCENARIOS) {
    assert.equal(scene.enemies.length, 2);
    assert.equal(new Set(scene.enemies.map(target => target.id)).size, 2);
    for (const target of scene.enemies) {
      assert.equal(target.abstract, true); assert.equal(target.catalogId, null);
      assert.equal(target.visualMode, 'prototype-symbol'); assert.equal(target.sprite, null); assert.equal(target.portrait, null);
      assert.match(target.name, /^Mannequin/); assert.deepEqual(target.powers, []);
    }
    const party = scene.defaultParty.map(id => universeActorFor(id, scene.context, 'default', scene.id));
    assert.ok(party.every(Boolean)); assert.ok(party.every(actor => actor.powers.every(power => ACTIONS[power])));
    const battle = createBattle({ party, enemies: scene.enemies });
    assert.equal(battle.winner, null); assert.deepEqual(battle.actors.filter(actor => actor.team === 'party').map(actor => actor.id), scene.defaultParty);
  }
  assert.equal(JSON.stringify(campaign), before);
});

test('specialist sessions roundtrip and reject crossed identities while preserving campaign and generic sessions', () => {
  const campaign = newGame(), before = JSON.stringify(campaign);
  for (const scene of SPECIALIST_SCENARIOS) {
    const session = createChronicle(scene.context, scene.id);
    assert.ok(session); assert.deepEqual(session.party, scene.defaultParty);
    assert.deepEqual(session.cleared, []); assert.deepEqual(decodeChronicle(encodeChronicle(session)), session);
    const foreign = scene.context.mediaId === 'INF' ? 'INF-CHR-RANDALL' : scene.context.mediaId === 'ME2' ? 'ME2-CHR-MIRANDA' : 'ME3-CHR-GARRUS';
    const snapshot = JSON.stringify(session);
    assert.equal(setChronicleParty(session, [foreign]).ok, false);
    assert.equal(JSON.stringify(session), snapshot);
    for (const loadout of Object.values(session.loadouts)) assert.ok(Object.values(loadout).every(value => value === null));
  }
  assert.equal(JSON.stringify(campaign), before);
});

test('the six historical specialist weapons remain scoped to base and explicitly prepared edition workshops', () => {
  const expectedWeapons = {
    'ME3-WPN-FALCON': 'me3-equipment-workshop', 'ME3-WPN-SCORPION': 'me3-equipment-workshop',
    'MEA-WPN-SCORPION': 'mea-equipment-workshop', 'MEA-WPN-PAW': 'mea-equipment-workshop',
    'MEA-WPN-REEGAR': 'mea-equipment-workshop', 'MEA-WPN-SWEEPER': 'mea-equipment-workshop',
  };
  for (const [itemId, onlyScene] of Object.entries(expectedWeapons)) {
    const editionScene = itemId.startsWith('ME3-') ? 'me3-legendary-equipment-workshop' : 'mea-deluxe-equipment-workshop';
    for (const scene of CHRONICLE_SCENARIOS) assert.equal(scene.allowedEquipmentIds.includes(itemId), [onlyScene, editionScene].includes(scene.id), `${itemId}/${scene.id}`);
  }
  const workshops = HISTORICAL_CHRONICLE_SCENARIOS.filter(scene => scene.kind === 'equipment-workshop');
  assert.deepEqual(workshops.map(scene => [scene.context.mediaId, scene.allowedEquipmentIds.length]), [['ME2', 11], ['ME3', 35], ['MEA', 38]]);
});
