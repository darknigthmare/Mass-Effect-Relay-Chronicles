import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { SCENARIOS } from '../src/universe-actors.js';
import { UNIVERSE_EQUIPMENT, getUniverseEquipment, canEquipUniverseItem, listUniverseEquipment } from '../src/universe-equipment.js';
import { createChronicle, equipChronicle, buildChronicleActor, startChronicleBattle } from '../src/chronicles.js';
import { createBattle, getActions, performAction, tickBattle } from '../src/combat.js';
import { EXPANSION_ALL_ENTRIES, runExpansionTrial } from '../src/expansion.js';

const root = new URL('../', import.meta.url), file = path => readFile(new URL(path, root));
const hash = data => createHash('sha256').update(data).digest('hex'), hashValue = value => hash(JSON.stringify(value));
const baselinePath = 'docs/qa/legendary-weapon-access-baseline.json', baseline = JSON.parse(await file(baselinePath));
const baselineCommit = '105d03727dc51c6121ed1bd2811b0146d047cbb2';
const ids = ['PHALANX', 'LOCUST', 'MATTOCK', 'EVISCERATOR', 'INCISOR'].map(suffix => `ME2-WPN-${suffix}`);
const actorId = 'ME2-CHR-SHEPARD', scene = SCENARIOS.find(scenario => scenario.id === 'me2-legendary-equipment-workshop');
const report = { passed: false, generatedAt: new Date().toISOString(), baselineCommit,
  scope: 'Five existing conventional ME2 weapon profiles become usable only in their prepared Legendary equipment workshop. Collective EA DLC evidence supplements inherited individual catalogue facts. No new dossier, original model mechanics, class right, economy or canonical acquisition is created.',
  sourceHashes: {}, preservedModules: {}, equipmentBefore: {}, equipmentAfter: {}, changedProfiles: [],
  newNativePreparations: [], previousTrialReplays: [], previousClosureChecks: [], defaultScenarioReplays: [],
  allowedHistoricalRefusalTextChanges: [], errors: [],
  limits: [
    'EA evidence is collective; individual model pages were unavailable. Original statistics and acquisition paths are not newly primary-source verified.',
    'Magazine capacities, reserves, damage and generic firing behavior are pre-existing ATB budgets.',
    'The Collector rifle stays closed pending its missing model-specific edition link; ME2 Revenant, Claymore and Widow retain specialization restrictions.',
    'The five historical Simulation dossiers remain closed. Their inherited reason now names the configured Legendary workshop; this is recorded separately from unchanged executable outcomes.',
    'Twenty-five old default-party battles are replayed exactly, including their existing loss against the ME3 Reaper opposition. This is not a claim of twenty-five victories.',
    'Browser interaction, production assets and visual fidelity have separate proofs. No original weapon art, audio, animation or integral 1:1 fidelity is certified here.',
  ],
};
const tally = entries => ({ profiles: entries.length, supported: entries.filter(entry => entry.runtimeSupported).length,
  weapons: entries.filter(entry => entry.runtimeSupported && entry.kind === 'weapon').length,
  armor: entries.filter(entry => entry.runtimeSupported && entry.kind === 'armor').length,
  weaponMods: entries.filter(entry => entry.runtimeSupported && entry.kind === 'weaponMod').length });
const omit = (value, keys) => Object.fromEntries(Object.entries(value).filter(([key]) => !keys.includes(key)));
function playDefault(scenario) {
  const session = createChronicle(scenario.context, scenario.id), started = startChronicleBattle(session);
  assert.equal(started.ok, true, scenario.id); const battle = started.battle, initialBattleSha256 = hashValue(battle);
  for (let i = 0; !battle.winner && battle.elapsed < 180 && i < 4000; i++) {
    for (const actor of battle.actors.filter(actor => actor.team === 'party' && actor.hp > 0)) {
      const actions = getActions(battle, actor.id).filter(action => action.available);
      const action = [actor.primaryAction === 'strike' ? 'strike' : 'shoot', 'reload', 'cover'].map(id => actions.find(action => action.id === id)).find(Boolean);
      if (!action) continue;
      const target = battle.actors.find(actor => actor.team === 'enemy' && actor.hp > 0);
      assert.equal(performAction(battle, { actorId: actor.id, actionId: action.id,
        targetId: action.target === 'self' ? actor.id : target?.id }).ok, true);
    }
    tickBattle(battle, .1);
  }
  return { id: scenario.id, initialBattleSha256, completedBattleSha256: hashValue(battle),
    winner: battle.winner, elapsed: battle.elapsed, orders: battle.actionCount };
}
const snapshot = (battle, id = actorId) => {
  const actor = battle.actors.find(actor => actor.id === id);
  return { ammo: actor.ammo, reserveAmmo: actor.reserveAmmo, magazineCapacity: actor.magazineCapacity,
    heat: actor.heat, atb: actor.atb, powers: [...actor.powers] };
};
function ready(battle) {
  for (let i = 0; i < 300 && battle.actors[0].atb < 100; i++) tickBattle(battle, .1);
  assert.equal(battle.actors[0].atb, 100);
}

try {
  assert.equal(baseline.baselineCommit, baselineCommit); assert.equal(SCENARIOS.length, 25);
  const sourcePaths = ['src/universe-equipment.js', 'src/universe-equipment-scenarios.js', 'src/universe-actors.js',
    'src/chronicles.js', 'src/combat.js', 'src/expansion.js', 'src/expansion3-weapons.js', 'src/universe-data.js',
    'tests/legendary-weapon-access.test.js', 'tests/expansion3-weapons.test.js', 'scripts/audit-legendary-weapon-access.mjs',
    baselinePath, 'docs/qa/legendary-weapon-access-reference-report.json', 'docs/research/legendary-weapon-access-sources.md'];
  for (const path of sourcePaths) report.sourceHashes[path] = hash(await file(path));
  const reference = JSON.parse(await file('docs/qa/legendary-weapon-access-reference-report.json'));
  assert.equal(reference.passed, true); assert.equal(reference.primaryDownloads.length, 3);
  assert.ok(reference.primaryDownloads.every(download => download.status === 200 && download.quoteFound));
  report.referenceProof = { path: 'docs/qa/legendary-weapon-access-reference-report.json',
    qualification: 'New collective EA inclusion/integration proof; individual names and DLC links remain inherited catalogue facts. Failed model-page requests are explicitly excluded as evidence.' };

  const targetedFiles = ['tests/legendary-weapon-access.test.js', 'tests/expansion3-weapons.test.js',
    'tests/universe-equipment.test.js', 'tests/universe-armor-editions.test.js'];
  const tests = spawnSync(process.execPath, ['--test', '--test-reporter=tap', ...targetedFiles], {
    cwd: root, encoding: 'utf8', maxBuffer: 4 * 1024 * 1024,
  });
  const count = label => Number(tests.stdout.match(new RegExp(`^# ${label} (\\d+)$`, 'm'))?.[1] ?? -1);
  const testReport = { passed: tests.status === 0, generatedAt: new Date().toISOString(), baselineCommit,
    command: `node --test --test-reporter=tap ${targetedFiles.join(' ')}`, exitCode: tests.status,
    total: count('tests'), passedTests: count('pass'), failed: count('fail'), skipped: count('skipped'),
    stdout: tests.stdout, stderr: tests.stderr,
    sourceHashes: Object.fromEntries(await Promise.all(targetedFiles.map(async path => [path, hash(await file(path))]))) };
  await writeFile(new URL('docs/qa/legendary-weapon-access-tests.json', root), JSON.stringify(testReport, null, 2) + '\n');
  assert.equal(tests.status, 0, tests.stdout + tests.stderr); assert.equal(testReport.total, 43);
  assert.equal(testReport.failed, 0); assert.equal(testReport.skipped, 0);
  report.tests = { path: 'docs/qa/legendary-weapon-access-tests.json', total: testReport.total,
    passed: testReport.passedTests, failed: testReport.failed, ownNewTests: 8 };

  report.equipmentBefore = tally(baseline.equipment); report.equipmentAfter = tally(UNIVERSE_EQUIPMENT);
  assert.deepEqual(report.equipmentBefore, { profiles: 224, supported: 100, weapons: 72, armor: 25, weaponMods: 3 });
  assert.deepEqual(report.equipmentAfter, { profiles: 224, supported: 105, weapons: 77, armor: 25, weaponMods: 3 });
  for (const before of baseline.equipment) {
    const after = getUniverseEquipment(before.id);
    if (!ids.includes(before.id)) { assert.deepEqual(after, before, before.id); continue; }
    const allowed = ['runtimeSupported', 'requiredEditionProfile', 'lockReason'];
    assert.deepEqual(omit(after, allowed), omit(before, allowed), before.id);
    assert.equal(after.runtimeSupported, true); assert.equal(after.requiredEditionProfile, 'legendary');
    report.changedProfiles.push({ id: before.id, changedFields: allowed,
      before: Object.fromEntries(allowed.map(key => [key, before[key]])), after: Object.fromEntries(allowed.map(key => [key, after[key]])) });
  }
  assert.equal(report.changedProfiles.length, 5);
  for (const before of baseline.scenarios) {
    const after = SCENARIOS.find(scenario => scenario.id === before.id);
    if (after.id !== scene.id) assert.deepEqual(after, before, before.id);
    else {
      assert.deepEqual(omit(after, ['allowedEquipmentIds', 'additionalEquipmentIds', 'sourceEntryIds', 'sourceIds']),
        omit(before, ['allowedEquipmentIds', 'additionalEquipmentIds', 'sourceEntryIds', 'sourceIds']));
      assert.deepEqual(after.allowedEquipmentIds, [...before.allowedEquipmentIds, ...ids]);
      assert.deepEqual(after.additionalEquipmentIds, [...before.additionalEquipmentIds, ...ids]);
      assert.deepEqual(after.sourceEntryIds, [...before.sourceEntryIds, ...ids]);
      assert.deepEqual(after.sourceIds.slice(0, before.sourceIds.length), before.sourceIds);
    }
  }
  for (const scenario of SCENARIOS) {
    const outcome = playDefault(scenario), before = baseline.defaultBattles.find(battle => battle.id === scenario.id);
    assert.deepEqual(outcome, before, scenario.id); report.defaultScenarioReplays.push({ ...outcome, exact: true });
  }
  report.defaultBattleOutcomes = { exact: 25, partyWins: report.defaultScenarioReplays.filter(trial => trial.winner === 'party').length,
    enemyWins: report.defaultScenarioReplays.filter(trial => trial.winner === 'enemy').length };

  for (const id of ids) {
    const original = createChronicle(scene.context, scene.id), beforeSession = JSON.stringify(original);
    const prepared = equipChronicle(original, actorId, id, 'weapon'); assert.equal(prepared.ok, true);
    assert.equal(JSON.stringify(original), beforeSession);
    const actor = buildChronicleActor(prepared.session, actorId), item = getUniverseEquipment(id);
    const started = startChronicleBattle(prepared.session); assert.equal(started.ok, true);
    const realActor = started.battle.actors.find(unit => unit.id === actorId), realTarget = started.battle.actors.find(unit => unit.team === 'enemy');
    realActor.atb = 100; const beforeTarget = { hp: realTarget.hp, shield: realTarget.shield };
    assert.equal(performAction(started.battle, { actorId, actionId: 'shoot', targetId: realTarget.id }).ok, true);
    assert.equal(realActor.ammo, item.ammo - 1); assert.ok(realTarget.hp < beforeTarget.hp || realTarget.shield < beforeTarget.shield);
    const battle = createBattle({ party: [{ ...actor, atb: 100 }],
      enemies: [{ id: 'target', name: 'Cible abstraite', hp: 5000, shield: 0, attack: 1, defense: 0, speed: .1, powers: [] }],
      seed: 17, rng: () => .5, mode: 'active', medigel: 0 });
    const initial = snapshot(battle);
    assert.equal(performAction(battle, { actorId, actionId: 'shoot', targetId: 'target' }).ok, true);
    const afterShot = snapshot(battle); ready(battle);
    assert.equal(performAction(battle, { actorId, actionId: 'reload', targetId: actorId }).ok, true);
    const afterReload = snapshot(battle);
    assert.equal(afterReload.ammo, initial.ammo); assert.equal(afterReload.reserveAmmo, initial.reserveAmmo - 1);
    assert.equal(afterReload.heat, 0);
    const listed = listUniverseEquipment(scene.context, { actorId, scenarioId: scene.id }).find(item => item.id === id);
    assert.equal(listed.compatible, true); assert.equal(listed.reason, null); assert.equal(listed.slotReasons.weapon, null);
    for (const other of SCENARIOS.filter(scenario => scenario.id !== scene.id))
      assert.equal(canEquipUniverseItem(other.context, other.defaultParty[0], id, 'weapon', other.id).ok, false);
    report.newNativePreparations.push({ id, context: scene.context, scenarioId: scene.id, actorId,
      sourceIds: item.sourceIds, originalStatus: item.status, weaponType: item.weaponType,
      exactResourceProfile: { magazineCapacity: item.magazineCapacity, ammo: item.ammo, reserveAmmo: item.reserveAmmo },
      initial, afterShot, afterReload, realChronicleShot: true, otherScenarioClosures: 24,
      uiCompatibility: { compatible: listed.compatible, reason: listed.reason, weaponSlotReason: listed.slotReasons.weapon },
      caveat: 'Prepared ATB profile and generic firing primitive, no original numerical or acquisition certification.' });
  }

  const registryBefore = JSON.stringify(EXPANSION_ALL_ENTRIES);
  for (const path of ['docs/qa/expansion-native-report.json', 'docs/qa/expansion2-native-report.json', 'docs/qa/expansion3-native-report.json']) {
    const previous = JSON.parse(await file(path)); assert.equal(previous.passed, true);
    for (const card of previous.cards) {
      const trial = runExpansionTrial(card.id, card.testedContext, card.testedOptions);
      assert.equal(trial.ok, card.executable, card.id);
      if (trial.ok) {
        assert.deepEqual(trial.result, card.result, card.id); assert.deepEqual(trial.control, card.control, card.id);
        report.previousTrialReplays.push({ id: card.id, sourceReport: path, exact: true,
          resultSha256: hashValue([trial.result, trial.control]) });
      } else {
        const changed = trial.reason !== card.blockedReason;
        if (changed) {
          assert.ok(ids.includes(card.id), card.id);
          report.allowedHistoricalRefusalTextChanges.push({ id: card.id, before: card.blockedReason, after: trial.reason,
            scope: 'Study remains closed; the inherited equipment reason now names its configured Legendary workshop.' });
        }
        report.previousClosureChecks.push({ id: card.id, sourceReport: path, stillClosed: true, reasonChanged: changed });
      }
    }
  }
  assert.equal(report.previousTrialReplays.length, 280); assert.equal(report.previousClosureChecks.length, 218);
  assert.equal(report.allowedHistoricalRefusalTextChanges.length, 5);
  assert.equal(JSON.stringify(EXPANSION_ALL_ENTRIES), registryBefore);
  const protectedPaths = ['src/combat.js', 'src/chronicles.js', 'src/universe-actors.js', 'src/universe-weapon-profiles.js',
    ...['expansion', 'expansion2', 'expansion3'].flatMap(prefix => ['characters', 'armor', 'weapons', 'fleet', 'enemies'].map(name => `src/${prefix}-${name}.js`))];
  for (const path of protectedPaths) {
    const historical = execFileSync('git', ['show', `${baselineCommit}:${path}`], { cwd: root, maxBuffer: 16 * 1024 * 1024 });
    const current = await file(path); assert.equal(hash(current), hash(historical), path); report.preservedModules[path] = hash(current);
  }
  report.passed = true;
} catch (error) { report.errors.push(error.stack || String(error)); }
await writeFile(new URL('docs/qa/legendary-weapon-access-native-report.json', root), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: report.passed, newPreparations: report.newNativePreparations.length,
  equipmentBefore: report.equipmentBefore, equipmentAfter: report.equipmentAfter,
  targetedTests: report.tests, previousExactOutcomes: report.previousTrialReplays.length,
  previousClosures: report.previousClosureChecks.length, qualifiedRefusalTextChanges: report.allowedHistoricalRefusalTextChanges.length,
  defaultBattles: report.defaultBattleOutcomes, preservedModules: Object.keys(report.preservedModules).length,
  errors: report.errors }, null, 2));
if (!report.passed) process.exitCode = 1;
