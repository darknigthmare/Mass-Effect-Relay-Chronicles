import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { EXPANSION3_ARMOR, getExpansion3Armor } from '../src/expansion3-armor.js';
import { EXPANSION_ALL_ENTRIES } from '../src/expansion.js';
import { getUniverseRecord, UNIVERSE_RECORDS } from '../src/universe-data.js';
import { createBattle, getActions, performAction, tickBattle } from '../src/combat.js';
import { MEDICAL_ACTION_IDS, planMedicalBenchAction } from '../src/combat-medical.js';
import { canRunMedicalBench, runMedicalBench } from '../src/expansion-medical-bench.js';

const cases = [
  { mediaId: 'ME2', periodId: 'me2', profile: 'medical-me2', actionId: 'unityMedigel', id: 'ME2-POW-UNITY' },
  { mediaId: 'ME3', periodId: 'me3', profile: 'medical-me3', actionId: 'firstAid', id: 'ME3-POW-FIRST-AID' },
];
function fixture(spec, changes = {}) {
  const base = { hp: 100, maxHp: 100, shield: 0, maxShield: 40, attack: 1, defense: 1, speed: .1, powers: [], mediaId: spec.mediaId };
  return createBattle({ party: [
    { ...base, id: 'medic', name: 'Medic', atb: 100, powers: [spec.actionId], speed: 1 },
    { ...base, id: 'ko-a', hp: 0, statuses: { burning: 2 }, cryoStacks: 3 },
    { ...base, id: 'ko-b', hp: 0, maxHp: 160 },
    { ...base, id: 'conscious', hp: 50 },
  ], enemies: [{ ...base, id: 'enemy', hp: 1000, maxHp: 1000 }],
  medicalBench: spec.profile, medigel: 1, mode: 'active', ...changes });
}
const actor = (battle, id = 'medic') => battle.actors.find(candidate => candidate.id === id);
const order = (battle, spec, targetId) => performAction(battle, { actorId: 'medic', actionId: spec.actionId, ...(targetId ? { targetId } : {}) });
const actionPresent = (battle, id, actionId) => getActions(battle, id).some(action => action.id === actionId);
const summonFields = spec => ({ id: 'summon:medic:combatDrone:1', summonProfileId: `${spec.mediaId}-POW-DRONE`,
  ownerId: 'medic', summonSerial: 1, actionId: 'combatDrone', mediaId: spec.mediaId,
  autonomous: true, countsForVictory: false, synthetic: true, summonedAt: 0, expiresAt: 18 });

test('medical studies are two new power identities, with no fabricated remaining armour stock', () => {
  assert.deepEqual(EXPANSION3_ARMOR.map(entry => entry.recordId), cases.map(spec => spec.id));
  const studied = new Set(EXPANSION_ALL_ENTRIES.map(entry => entry.id));
  const remaining = UNIVERSE_RECORDS.filter(record => record.fact && record.category === 'equipment' && !studied.has(record.id));
  assert.deepEqual(remaining.map(record => record.id), ['PL-REF-MAKO']);
  assert.deepEqual(remaining[0].availability, []);
  for (const entry of EXPANSION3_ARMOR) {
    const record = getUniverseRecord(entry.recordId), parent = getUniverseRecord(entry.bench.parentRecordId);
    assert.equal(record.category, 'powers'); assert.equal(record.fact, true);
    assert.equal(parent.category, 'equipment'); assert.equal(parent.mediaId, record.mediaId);
    assert.equal(entry.mode, 'armor'); assert.equal(entry.behaviorKind, 'equipment-bench');
    assert.deepEqual(entry.contextScopes, record.availability);
    assert.deepEqual(entry.sourceIds, record.sourceIds); assert.deepEqual(entry.provenance, record.provenance);
    assert.equal(entry.primaryEvidence.sha256.length, 64);
    assert.match(entry.limitations.join(' '), /Aucune nouvelle armure/);
    assert.match(entry.limitations.join(' '), /30 %/);
    assert.equal(Object.hasOwn(entry, 'bonuses'), false);
    assert.equal(Object.isFrozen(entry.bench), true);
  }
  assert.equal(getExpansion3Armor('ME3-EQP-MEDIGEL'), null);
});

test('medical bench identity and exact solo context reject forged parents, actions and scopes', () => {
  for (const spec of cases) {
    const entry = getExpansion3Armor(spec.id), context = { mediaId: spec.mediaId, periodId: spec.periodId };
    assert.equal(canRunMedicalBench(entry, context).ok, true);
    assert.equal(canRunMedicalBench({ ...entry, id: 'ME3-EQP-MEDIGEL' }, context).ok, false);
    assert.equal(canRunMedicalBench({ ...entry, bench: { ...entry.bench, actionId: 'unity' } }, context).ok, false);
    assert.equal(canRunMedicalBench({ ...entry, bench: { ...entry.bench, healthRatio: 1 } }, context).ok, false);
    assert.equal(canRunMedicalBench({ ...entry, bench: { ...entry.bench, parentRecordId: 'EQP-medigel' } }, context).ok, false);
    assert.equal(canRunMedicalBench(entry, { mediaId: 'ME1', periodId: 'me1' }).ok, false);
    assert.equal(canRunMedicalBench(entry, { mediaId: 'ME3', periodId: 'me3-multiplayer' }).ok, false);
    assert.throws(() => runMedicalBench(entry, { mediaId: 'MEA', periodId: 'mea' }), /réservé/);
  }
});

for (const spec of cases) {
  test(`${spec.mediaId} medical command requires bench, exact media, trained power and party role`, () => {
    const unconfigured = fixture(spec, { medicalBench: undefined }), before = JSON.stringify(unconfigured);
    assert.equal(actionPresent(unconfigured, 'medic', spec.actionId), false);
    assert.equal(order(unconfigured, spec).ok, false);
    assert.equal(JSON.stringify(unconfigured), before);
    for (const bench of ['medical-me1', 'toString', 'constructor', spec.profile === 'medical-me2' ? 'medical-me3' : 'medical-me2']) {
      assert.equal(actionPresent(fixture(spec, { medicalBench: bench }), 'medic', spec.actionId), false);
    }
    const battle = fixture(spec);
    assert.equal(actionPresent(battle, 'medic', spec.actionId), true);
    assert.equal(actionPresent(battle, 'conscious', spec.actionId), false);
    actor(battle).powers = [];
    assert.equal(actionPresent(battle, 'medic', spec.actionId), false);
    actor(battle).powers = [spec.actionId]; actor(battle).mediaId = 'ME1';
    assert.equal(actionPresent(battle, 'medic', spec.actionId), false);
    actor(battle).mediaId = spec.mediaId; actor(battle).team = 'enemy';
    assert.equal(actionPresent(battle, 'medic', spec.actionId), false);
    actor(battle).team = 'party'; Object.assign(actor(battle), summonFields(spec));
    assert.equal(actionPresent(battle, 'summon:medic:combatDrone:1', spec.actionId), false);
  });

  test(`${spec.mediaId} one native order spends ATB and one shared dose for its two prepared KO patients`, () => {
    const battle = fixture(spec), before = JSON.stringify(battle), plan = planMedicalBenchAction(battle, actor(battle), spec.actionId);
    assert.equal(plan.ok, true); assert.equal(JSON.stringify(battle), before);
    assert.deepEqual(plan.targets.map(target => target.id), ['ko-a', 'ko-b']);
    const action = order(battle, spec);
    assert.equal(action.ok, true); assert.equal(battle.medigel, 0); assert.equal(actor(battle).atb, 0);
    assert.equal(actor(battle, 'ko-a').hp, 30); assert.equal(actor(battle, 'ko-b').hp, 48);
    for (const id of ['ko-a', 'ko-b']) {
      assert.equal(actor(battle, id).shield, 0); assert.equal(actor(battle, id).atb, 0);
      assert.deepEqual(actor(battle, id).statuses, {}); assert.equal(actor(battle, id).cryoStacks, 0);
    }
    assert.equal(actor(battle, 'conscious').hp, 50);
    assert.deepEqual(action.events.filter(event => event.type === 'revive').map(event => event.targetId), ['ko-a', 'ko-b']);
    assert.equal(action.events.filter(event => event.type === 'medicalResource').length, 1);
    assert.equal(action.events.find(event => event.type === 'medicalResource').remaining, 0);
    assert.equal(battle.actionCount, 1);
  });

  test(`${spec.mediaId} no dose and no eligible patient both reject without spending or randomness`, () => {
    let randomCalls = 0;
    for (const mode of ['empty', 'conscious']) {
      const battle = fixture(spec, { rng: () => { randomCalls++; return .5; }, ...(mode === 'empty' ? { medigel: 0 } : {}) });
      if (mode === 'conscious') for (const target of battle.actors.filter(target => target.team === 'party')) target.hp = target.maxHp;
      const before = JSON.stringify(battle), action = order(battle, spec);
      assert.equal(action.ok, false); assert.match(action.reason, mode === 'empty' ? /Plus de médi-gel/ : /Aucun équipier KO/);
      assert.equal(JSON.stringify(battle), before); assert.equal(randomCalls, 0);
      const metadata = getActions(battle, 'medic').find(action => action.id === spec.actionId);
      assert.equal(metadata.available, false); assert.equal(metadata.reason, action.reason);
    }
  });

  test(`${spec.mediaId} excludes narrative deaths, disabled recovery, summons, enemies and foreign-media targets`, () => {
    const battle = fixture(spec);
    actor(battle, 'ko-a').narrativeDead = true; actor(battle, 'ko-b').revivable = false;
    const extra = [
      { ...actor(battle, 'ko-a'), id: 'foreign', narrativeDead: false, mediaId: 'ME1' },
      { ...actor(battle, 'ko-a'), ...summonFields(spec), narrativeDead: false },
      { ...actor(battle, 'ko-a'), id: 'enemy-ko', narrativeDead: false, team: 'enemy' },
    ];
    battle.actors.push(...extra);
    const before = JSON.stringify(battle);
    assert.equal(order(battle, spec).ok, false);
    assert.equal(JSON.stringify(battle), before);
    actor(battle, 'ko-a').narrativeDead = false;
    assert.equal(order(battle, spec).ok, true);
    assert.equal(actor(battle, 'ko-a').hp, 30);
    for (const id of ['ko-b', 'foreign', 'enemy-ko']) assert.equal(actor(battle, id).hp, 0, id);
    // The engine retires the KO temporary support after the accepted action.
    const support = actor(battle, 'summon:medic:combatDrone:1');
    assert.ok(!support || support.hp === 0);
    assert.equal(actionPresent(battle, 'summon:medic:combatDrone:1', spec.actionId), false);
  });

  test(`${spec.mediaId} an invalid explicit target rejects before spending a valid shared stock`, () => {
    for (const targetId of ['missing', 'enemy', 'medic', 'conscious']) {
      const battle = fixture(spec), before = JSON.stringify(battle);
      assert.equal(order(battle, spec, targetId).ok, false, targetId);
      assert.equal(JSON.stringify(battle), before, targetId);
    }
  });

  test(`${spec.mediaId} time never replenishes a used dose and the old conscious-only action cannot substitute`, () => {
    const battle = fixture(spec);
    assert.equal(performAction(battle, { actorId: 'medic', actionId: 'medigel', targetId: 'ko-a' }).ok, false);
    assert.equal(battle.medigel, 1);
    assert.equal(order(battle, spec).ok, true);
    actor(battle, 'ko-a').hp = 0;
    tickBattle(battle, 10);
    assert.equal(battle.medigel, 0); assert.equal(actor(battle).atb, 100);
    const before = JSON.stringify(battle), result = order(battle, spec);
    assert.equal(result.ok, false); assert.match(result.reason, /Plus de médi-gel/);
    assert.equal(JSON.stringify(battle), before);
  });
}

test('legacy ME1 Unity stays free and legacy medigel continues to heal only a conscious ally', () => {
  const spec = cases[0], battle = fixture(spec, { medicalBench: undefined, medigel: 0 });
  actor(battle).mediaId = 'ME1'; actor(battle).powers = ['unity'];
  assert.equal(performAction(battle, { actorId: 'medic', actionId: 'unity' }).ok, true);
  assert.equal(battle.medigel, 0); assert.equal(actor(battle, 'ko-a').hp, 30);
  assert.equal(actor(battle, 'ko-a').shield, 10); assert.equal(actor(battle).cooldowns.unity, 24);
  for (const actionId of MEDICAL_ACTION_IDS) assert.equal(actionPresent(battle, 'medic', actionId), false);
  const healing = fixture(spec, { medicalBench: undefined });
  assert.equal(performAction(healing, { actorId: 'medic', actionId: 'medigel', targetId: 'conscious' }).ok, true);
  assert.ok(actor(healing, 'conscious').hp > 50); assert.equal(healing.medigel, 0);
  assert.equal(actor(healing, 'ko-a').hp, 0);
});

test('two public medical experiments replay exactly and expose measured resources and actual native rejections', () => {
  for (const spec of cases) {
    const entry = getExpansion3Armor(spec.id), context = { mediaId: spec.mediaId, periodId: spec.periodId };
    const immutable = JSON.stringify(entry), options = { seed: 17, difficulty: 'normal' };
    const result = runMedicalBench(entry, context, options);
    assert.deepEqual(result, runMedicalBench(entry, context, options));
    assert.equal(JSON.stringify(entry), immutable);
    assert.equal(result.kind, 'equipment-bench'); assert.equal(result.medical, true);
    assert.equal(result.nativeOrders, 1); assert.equal(result.revived.length, 2);
    assert.equal(result.before.doses, 1); assert.equal(result.after.doses, 0);
    assert.equal(result.before.medicAtb, 100); assert.equal(result.after.medicAtb, 0);
    assert.equal(result.exhaustionReadyAtb, 100); assert.equal(result.exhaustedPatientHp, 0);
    assert.equal(result.rejectedExhaustedOrder, true); assert.equal(result.rejectedExcludedTarget, true);
    assert.equal(result.rejectedNoPatient, true); assert.equal(result.after.excludedHp, 0);
    assert.equal(result.rows.length, 7);
    assert.ok(result.rows.every(row => ['label', 'before', 'control', 'sample', 'unit'].every(key => Object.hasOwn(row, key))));
    assert.ok(result.log.some(line => line.includes('dose de médi-gel consommée')));
  }
});

test('published medical reference report identifies the downloaded primary pages without claiming original numeric certification', () => {
  const report = JSON.parse(fs.readFileSync(new URL('../docs/qa/expansion3-medical-reference-report.json', import.meta.url)));
  assert.equal(report.passed, true); assert.equal(report.references.length, 2);
  for (const source of report.references) {
    assert.equal(source.httpStatus, 200); assert.equal(source.signature, '%PDF-');
    assert.equal(source.primaryPageActuallyOpened, true);
    assert.ok(source.bytes > 1000000); assert.equal(source.sha256.length, 64);
    assert.equal(source.numericValuesCertified, false);
  }
});
