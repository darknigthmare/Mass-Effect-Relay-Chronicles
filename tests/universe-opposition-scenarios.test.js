import test from 'node:test';
import assert from 'node:assert/strict';
import { ACTIONS, getActions, performAction, tickBattle } from '../src/combat.js';
import { canAccessContent } from '../src/continuity.js';
import { getUniverseRecord, getUniverseWork } from '../src/universe-data.js';
import { OPPOSITION_SCENARIOS } from '../src/universe-opposition-scenarios.js';
import { createEditionEquipmentScenarios } from '../src/universe-equipment-scenarios.js';
import { getUniverseEquipment, canEquipUniverseItem, equipChronicleItem } from '../src/universe-equipment.js';
import { CHRONICLE_SCENARIOS, HISTORICAL_CHRONICLE_SCENARIOS, EDITION_EQUIPMENT_SCENARIOS,
  canUseUniverseActor, getUniverseActor, getUniverseScenario } from '../src/universe-actors.js';
import { createChronicle, setChronicleParty, startChronicleBattle, finishChronicleBattle } from '../src/chronicles.js';

const historicalRosters = {
  'me2-freedoms-progress': ['ME2-CHR-SHEPARD', 'ME2-CHR-MIRANDA', 'ME2-CHR-JACOB'],
  'me3-earth-prologue': ['ME3-CHR-SHEPARD', 'ME3-CHR-ANDERSON'],
  'mea-habitat7': ['MEA-CHR-RYDER', 'MEA-CHR-ALEC'],
  'inf-security': ['INF-CHR-RANDALL'], 'gal-jacob': ['GAL-CHR-JACOB'],
  'pl-collectors': ['PL-CHR-VEGA'], 'red-liara-feron': ['RED-ACT-LIARA', 'RED-ACT-FERON'],
  'me2-equipment-workshop': ['ME2-CHR-SHEPARD', 'ME2-CHR-MIRANDA', 'ME2-CHR-JACOB', 'ME2-CHR-MORDIN',
    'ME2-CHR-GARRUS', 'ME2-CHR-GRUNT', 'ME2-CHR-JACK', 'ME2-CHR-TALI', 'ME2-CHR-THANE', 'ME2-CHR-SAMARA', 'ME2-CHR-LEGION', 'ME2-CHR-MORINTH'],
  'me3-equipment-workshop': ['ME3-CHR-SHEPARD', 'ME3-CHR-LIARA', 'ME3-CHR-JAMES', 'ME3-CHR-GARRUS',
    'ME3-CHR-EDI', 'ME3-CHR-TALI', 'ME3-CHR-ASHLEY', 'ME3-CHR-KAIDAN'],
  'mea-equipment-workshop': ['MEA-CHR-RYDER', 'MEA-CHR-CORA', 'MEA-CHR-LIAM', 'MEA-CHR-VETRA', 'MEA-CHR-JAAL', 'MEA-CHR-DRACK', 'MEA-CHR-PEEBEE'],
  'me2-dlc-specialists': ['ME2-CHR-SHEPARD', 'ME2-CHR-KASUMI', 'ME2-CHR-ZAEED'],
  'me2-shadow-broker': ['ME2-CHR-SHEPARD', 'ME2-CHR-LIARA'],
  'me3-from-ashes': ['ME3-CHR-SHEPARD', 'ME3-CHR-JAVIK'],
  'me3-omega': ['ME3-CHR-SHEPARD', 'ME3-CHR-ARIA', 'ME3-CHR-NYREEN'],
  'me3-citadel-wrex': ['ME3-CHR-SHEPARD', 'ME3-CHR-WREX'], 'inf-incarceration': ['INF-CHR-TURIAN'],
};

test('the sixteen historical scenario rosters remain exact, and no narrative identity gains combat rights', () => {
  assert.deepEqual(HISTORICAL_CHRONICLE_SCENARIOS.map(scene => scene.id), Object.keys(historicalRosters));
  for (const scene of HISTORICAL_CHRONICLE_SCENARIOS) assert.deepEqual(scene.actorIds, historicalRosters[scene.id]);
  assert.deepEqual(CHRONICLE_SCENARIOS.slice(0, 16), HISTORICAL_CHRONICLE_SCENARIOS);
  assert.equal(new Set(CHRONICLE_SCENARIOS.flatMap(scene => scene.actorIds)).size, 42);
  for (const id of ['ME2-NPC-KELLY', 'GAL-CHR-MIRANDA']) {
    const profile = getUniverseActor(id); assert.ok(profile); assert.equal(profile.playable, false);
    assert.ok(CHRONICLE_SCENARIOS.every(scene => !scene.actorIds.includes(id)));
  }
});

test('six opposition benches expose sixteen exact sourced enemy identities only in their main work period', () => {
  assert.equal(OPPOSITION_SCENARIOS.length, 6); assert.equal(EDITION_EQUIPMENT_SCENARIOS.length, 3);
  assert.equal(CHRONICLE_SCENARIOS.length, 25);
  assert.equal(new Set(CHRONICLE_SCENARIOS.map(scene => scene.id)).size, 25);
  assert.equal(new Set(OPPOSITION_SCENARIOS.flatMap(scene => scene.enemies.map(enemy => enemy.catalogId))).size, 16);
  for (const scene of OPPOSITION_SCENARIOS) {
    assert.ok(Object.isFrozen(scene)); assert.ok(Object.isFrozen(scene.enemies));
    assert.equal(scene.context.periodId, scene.context.mediaId.toLowerCase());
    assert.equal(scene.kind, 'opposition-workshop'); assert.deepEqual(scene.allowedEquipmentIds, []);
    assert.deepEqual(scene.enemies.map(enemy => enemy.catalogId), scene.opponentIds);
    assert.deepEqual(scene.opponentLimitations.map(enemy => enemy.catalogId), scene.opponentIds);
    assert.ok(scene.opponentLimitations.every(enemy => enemy.missingMechanics.every(text => scene.description.includes(text))));
    assert.match(scene.description, /sans attribution de cette équipe à une rencontre précise/);
    assert.match(scene.description, /ATB/); assert.match(scene.description, /aucun pouvoir de loyauté supplémentaire/);
    const work = getUniverseWork(scene.context.mediaId);
    for (const id of scene.sourceEntryIds) {
      const record = getUniverseRecord(id); assert.equal(record.fact, true, id);
      assert.equal(canAccessContent(id, scene.context).ok, true, id);
      assert.ok(record.sourceIds.every(sourceId => scene.sourceIds.includes(sourceId)), id);
    }
    assert.ok(scene.sourceIds.every(id => work.sources.some(source => source.id === id)));
    for (const enemy of scene.enemies) {
      assert.equal(enemy.abstract, undefined); assert.equal(enemy.statsBasis, 'ATB adaptation');
      assert.equal(enemy.sprite, null); assert.equal(enemy.portrait, null);
      assert.ok(enemy.hp >= 100 && enemy.hp <= 500); assert.deepEqual(enemy.powers, []);
    }
    assert.equal(getUniverseScenario({ mediaId: scene.context.mediaId, periodId: `${scene.context.mediaId.toLowerCase()}-prologue` }, scene.id), null);
    assert.equal(getUniverseScenario({ mediaId: 'ME1', periodId: 'me1' }, scene.id), null);
  }
});

test('new benches preserve temporary roles, cross-work boundaries and exclusive companion alternatives', () => {
  for (const scene of [...OPPOSITION_SCENARIOS, ...EDITION_EQUIPMENT_SCENARIOS]) {
    const session = createChronicle(scene.context, scene.id); assert.ok(session, scene.id);
    assert.deepEqual(session.party, scene.defaultParty);
    assert.equal(startChronicleBattle(session).ok, true, scene.id);
    for (const id of ['ME3-CHR-ANDERSON', 'MEA-CHR-ALEC', 'ME2-CHR-LIARA', 'ME2-CHR-KASUMI',
      'ME3-CHR-JAVIK', 'ME3-CHR-ARIA', 'ME3-CHR-NYREEN', 'ME3-CHR-WREX', 'INF-CHR-TURIAN', 'RED-ACT-FERON']) {
      assert.equal(canUseUniverseActor(scene.context, id, scene.id).ok, false, `${scene.id}/${id}`);
    }
    for (const group of scene.exclusiveActorGroups) {
      const before = JSON.stringify(session);
      assert.equal(setChronicleParty(session, [scene.actorIds[0], ...group]).ok, false);
      assert.equal(JSON.stringify(session), before);
      for (const id of group) assert.equal(setChronicleParty(session, [scene.actorIds[0], id]).ok, true);
    }
    const foreign = scene.context.mediaId === 'ME2' ? 'ME3-CHR-GARRUS' : 'ME2-CHR-GARRUS';
    assert.equal(setChronicleParty(session, [foreign]).ok, false);
  }
});

test('edition benches copy the base roster without mutating it and disclose prepared content ownership', () => {
  const before = JSON.stringify(HISTORICAL_CHRONICLE_SCENARIOS);
  const first = createEditionEquipmentScenarios(HISTORICAL_CHRONICLE_SCENARIOS);
  assert.deepEqual(first, EDITION_EQUIPMENT_SCENARIOS);
  assert.deepEqual(createEditionEquipmentScenarios(null), []);
  assert.deepEqual(createEditionEquipmentScenarios([]), []);
  for (const scene of first) {
    const base = HISTORICAL_CHRONICLE_SCENARIOS.find(item => item.id === `${scene.context.mediaId.toLowerCase()}-equipment-workshop`);
    assert.deepEqual(scene.actorIds, base.actorIds); assert.deepEqual(scene.defaultParty, base.defaultParty);
    assert.deepEqual(scene.exclusiveActorGroups, base.exclusiveActorGroups);
    assert.ok(base.allowedEquipmentIds.every(id => scene.allowedEquipmentIds.includes(id)));
    assert.ok(scene.additionalEquipmentIds.every(id => !base.allowedEquipmentIds.includes(id)));
    assert.equal(scene.editionEquipmentProfile, scene.context.mediaId === 'MEA' ? 'deluxe' : 'legendary');
    assert.ok(scene.preparedConditions.length >= 3); assert.match(scene.description, /supposés présents/);
    assert.match(scene.description, /sans reproduire leur acquisition/);
    assert.ok(scene.enemies.every(enemy => enemy.abstract && enemy.catalogId === null));
    assert.equal(startChronicleBattle(createChronicle(scene.context, scene.id)).ok, true);
  }
  assert.equal(JSON.stringify(HISTORICAL_CHRONICLE_SCENARIOS), before);
});

test('edition equipment can be prepared only in its declared bench, with protagonist-only armor', () => {
  for (const scene of EDITION_EQUIPMENT_SCENARIOS) {
    const actorId = scene.defaultParty[0], baseId = `${scene.context.mediaId.toLowerCase()}-equipment-workshop`;
    const session = createChronicle(scene.context, scene.id), before = JSON.stringify(session);
    for (const id of scene.additionalEquipmentIds) {
      const item = getUniverseEquipment(id); assert.ok(item?.runtimeSupported, id);
      assert.equal(canEquipUniverseItem(scene.context, actorId, id, item.slot, scene.id).ok, true, id);
      assert.equal(canEquipUniverseItem(scene.context, actorId, id, item.slot, baseId).ok, false, id);
      const result = equipChronicleItem(session, actorId, id, item.slot); assert.equal(result.ok, true, `${id}: ${result.reason}`);
      assert.equal(result.loadouts[actorId][item.slot], id);
      const started = startChronicleBattle({ ...session, loadouts: result.loadouts }); assert.equal(started.ok, true, id);
      assert.equal(JSON.stringify(session), before);
      if (item.kind === 'armor') assert.equal(canEquipUniverseItem(scene.context, scene.actorIds[1], id, 'armor', scene.id).ok, false, id);
      for (const bench of OPPOSITION_SCENARIOS.filter(bench => bench.context.mediaId === scene.context.mediaId)) {
        assert.equal(canEquipUniverseItem(bench.context, actorId, id, item.slot, bench.id).ok, false, `${bench.id}/${id}`);
      }
    }
  }
});

test('new weapon permissions retain source edition and unsupported pack boundaries', () => {
  const me3 = { mediaId: 'ME3', periodId: 'me3' }, mea = { mediaId: 'MEA', periodId: 'mea' };
  for (const id of ['ME3-WPN-ARC', 'ME3-WPN-GRAAL', 'ME3-WPN-JAVELIN']) {
    assert.equal(canEquipUniverseItem(me3, 'ME3-CHR-SHEPARD', id, 'weapon', 'me3-equipment-workshop').ok, true, id);
  }
  for (const id of ['MEA-WPN-EQUALIZER', 'MEA-WPN-SCATTERSHOT', 'MEA-WPN-VENOM']) {
    assert.equal(canEquipUniverseItem(mea, 'MEA-CHR-RYDER', id, 'weapon', 'mea-equipment-workshop').ok, true, id);
  }
  for (const id of ['ME3-WPN-PARTICLE', 'ME3-WPN-LANCER']) {
    assert.equal(canEquipUniverseItem(me3, 'ME3-CHR-SHEPARD', id, 'weapon', 'me3-equipment-workshop').ok, false, id);
    assert.equal(canEquipUniverseItem(me3, 'ME3-CHR-SHEPARD', id, 'weapon', 'me3-legendary-equipment-workshop').ok, true, id);
  }
  for (const id of ['ME3-WPN-REEGAR', 'ME3-WPN-CHAKRAM', 'ME3-WPN-VENOM']) {
    for (const scenarioId of ['me3-equipment-workshop', 'me3-legendary-equipment-workshop']) {
      assert.equal(canEquipUniverseItem(me3, 'ME3-CHR-SHEPARD', id, 'weapon', scenarioId).ok, false, id);
    }
  }
  assert.equal(canEquipUniverseItem(mea, 'MEA-CHR-RYDER', 'MEA-EQP-REMNANT', 'armor', 'mea-equipment-workshop').ok, true);
  assert.equal(canEquipUniverseItem(mea, 'MEA-CHR-RYDER', 'MEA-EQP-REMNANT', 'armor', 'mea-deluxe-equipment-workshop').ok, true);
  assert.equal(canEquipUniverseItem(mea, 'MEA-CHR-VETRA', 'MEA-EQP-REMNANT', 'armor', 'mea-equipment-workshop').ok, false);
});

test('the lightweight module stays in ME3 equipment benches and requires an actual conventional SMG', () => {
  const context = { mediaId: 'ME3', periodId: 'me3' }, actorId = 'ME3-CHR-SHEPARD', id = 'ME3-EQP-ULTRALIGHT';
  const row = { weapon: 'ME3-WPN-SHURIKEN', armor: null, weaponMod: null, weaponMod2: null };
  for (const sceneId of ['me3-equipment-workshop', 'me3-legendary-equipment-workshop']) {
    assert.equal(canEquipUniverseItem(context, actorId, id, 'weaponMod', sceneId, row).ok, true);
    assert.equal(canEquipUniverseItem(context, actorId, id, 'weaponMod', sceneId, { ...row, weapon: null }).ok, false);
    assert.equal(canEquipUniverseItem(context, actorId, id, 'weaponMod', sceneId, { ...row, weapon: 'ME3-WPN-AVENGER' }).ok, false);
  }
  for (const scene of OPPOSITION_SCENARIOS.filter(scene => scene.context.mediaId === 'ME3')) {
    assert.equal(canEquipUniverseItem(context, actorId, id, 'weaponMod', scene.id, row).ok, false);
  }
});

function resolveTrial(scene) {
  const session = createChronicle(scene.context, scene.id), started = startChronicleBattle(session);
  assert.equal(started.ok, true, scene.id);
  const battle = started.battle;
  let accepted = 0;
  const priority = ['unity', 'medigel', 'combatDrone', 'overload', 'energyDrain', 'incinerate', 'reave',
    'concussiveShot', 'warp', 'singularity', 'shockwave', 'burst', 'shoot', 'reload', 'cover'];
  for (let step = 0; step < 2000 && !battle.winner; step++) {
    for (const actor of battle.actors.filter(unit => unit.team === 'party' && !unit.autonomous)) {
      const available = getActions(battle, actor.id).filter(action => action.available);
      for (const actionId of priority) {
        if (!available.some(action => action.id === actionId)) continue;
        const definition = ACTIONS[actionId];
        const targets = ['self', 'allies'].includes(definition.target) ? [actor]
          : battle.actors.filter(unit => unit.team === (definition.target === 'ally' ? 'party' : 'enemy') && unit.hp > 0)
            .sort((left, right) => definition.target === 'ally' ? left.hp / left.maxHp - right.hp / right.maxHp : left.hp - right.hp);
        let success = false;
        for (const target of targets) {
          if (performAction(battle, { actorId: actor.id, actionId, targetId: target.id }).ok) { accepted++; success = true; break; }
        }
        if (success) break;
      }
    }
    tickBattle(battle, .25);
  }
  assert.equal(battle.winner, 'party', `${scene.id}: ${JSON.stringify(battle.actors.map(unit => [unit.id, unit.hp, unit.shield]))}`);
  assert.ok(accepted > 3);
  assert.ok(battle.events.some(event => event.type === 'damage'));
  assert.ok(battle.actors.filter(unit => unit.team === 'enemy' && !unit.autonomous).every(unit => unit.hp === 0));
  const result = finishChronicleBattle(session, battle); assert.equal(result.ok, true); assert.equal(result.won, true);
  assert.deepEqual(result.session.cleared, [scene.id]);
  assert.deepEqual(session.cleared, [], 'The prepared input remains unchanged, and no campaign state is awarded');
}

for (const scene of OPPOSITION_SCENARIOS) test(`native orders can finish ${scene.id} without modifying health, progression or victory flags`, () => resolveTrial(scene));
