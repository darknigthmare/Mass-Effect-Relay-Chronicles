import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { SCENARIOS } from '../src/universe-actors.js';
import { UNIVERSE_EQUIPMENT, getUniverseEquipment, canEquipUniverseItem } from '../src/universe-equipment.js';
import { createChronicle, equipChronicle, buildChronicleActor, startChronicleBattle, encodeChronicle, decodeChronicle } from '../src/chronicles.js';
import { createBattle, getActions, performAction, tickBattle } from '../src/combat.js';
import { EXPANSION_ALL_ENTRIES, runExpansionTrial } from '../src/expansion.js';

const root = new URL('../', import.meta.url), file = path => readFile(new URL(path, root));
const hash = data => createHash('sha256').update(data).digest('hex'), hashValue = value => hash(JSON.stringify(value));
const baselinePath = 'docs/qa/me3-legendary-weapons-baseline.json', baseline = JSON.parse(await file(baselinePath));
const baselineCommit = '05d1f030dab0925d57d4ba8c5bdb9ccde8db1ad0';
const ids = ['ME3-WPN-SUPPRESSOR', 'ME3-WPN-RAIDER'], actorId = 'ME3-CHR-SHEPARD';
const scene = SCENARIOS.find(s => s.id === 'me3-legendary-equipment-workshop');
const report = { passed: false, generatedAt: new Date().toISOString(), baselineCommit,
  scope: 'Two existing conventional ME3 profiles, individually associated in the inherited catalogue with Citadel or Leviathan, become prepared choices only in the exact ME3 Legendary workshop. No new canonical identity, ability, bonus, economy, mission acquisition or original numerical fidelity is supplied.',
  sourceHashes: {}, equipmentBefore: {}, equipmentAfter: {}, changedProfiles: [], changedScenarios: [], preservedModules: {},
  newNativePreparations: [], previousTrialReplays: [], previousClosures: [], defaultScenarioReplays: [], errors: [],
  limitations: ['EA inclusion/integration evidence is collective; model/extension links are inherited explicit catalogue facts, not newly downloaded individual articles.',
    'The seven generic extended-arsenal candidates remain closed because their individual model/content association is insufficiently documented here.',
    'Capacities, reserve budgets, damage and generic firing primitives remain pre-existing ATB adaptations. Headshots, spread, recoil, exact model cadence, geometry, sound and animation are not reproduced.',
    'Twenty-five historical default battles include their existing loss against the ME3 Reaper opposition; exact preservation is not a claim of twenty-five victories.',
    'This native proof does not establish public UI behavior, original weapon artwork, real-device performance or integral1:1 fidelity. Browser and production build have separate reports.'],
};
const tally = items => ({ profiles: items.length, supported: items.filter(i => i.runtimeSupported).length,
  weapons: items.filter(i => i.runtimeSupported && i.kind === 'weapon').length,
  armor: items.filter(i => i.runtimeSupported && i.kind === 'armor').length,
  weaponMods: items.filter(i => i.runtimeSupported && i.kind === 'weaponMod').length });
const omit = (object, keys) => Object.fromEntries(Object.entries(object).filter(([key]) => !keys.includes(key)));
function playDefault(scenario) {
  const started = startChronicleBattle(createChronicle(scenario.context, scenario.id)); assert.equal(started.ok, true);
  const battle = started.battle, initialBattleSha256 = hashValue(battle);
  for (let i = 0; !battle.winner && battle.elapsed < 180 && i < 4000; i++) {
    for (const actor of battle.actors.filter(a => a.team === 'party' && a.hp > 0)) {
      const actions = getActions(battle, actor.id).filter(a => a.available);
      const action = [actor.primaryAction === 'strike' ? 'strike' : 'shoot', 'reload', 'cover'].map(id => actions.find(a => a.id === id)).find(Boolean);
      if (!action) continue;
      const target = battle.actors.find(a => a.team === 'enemy' && a.hp > 0);
      assert.equal(performAction(battle, { actorId: actor.id, actionId: action.id, targetId: action.target === 'self' ? actor.id : target?.id }).ok, true);
    }
    tickBattle(battle, .1);
  }
  return { id: scenario.id, initialBattleSha256, completedBattleSha256: hashValue(battle), winner: battle.winner, elapsed: battle.elapsed, orders: battle.actionCount };
}
const snapshot = battle => {
  const actor = battle.actors.find(a => a.id === actorId);
  return { ammo: actor.ammo, magazineCapacity: actor.magazineCapacity, reserveAmmo: actor.reserveAmmo, heat: actor.heat, atb: actor.atb, powers: [...actor.powers] };
};
try {
  assert.equal(baseline.baselineCommit, baselineCommit);
  const paths = ['src/universe-equipment.js', 'src/universe-equipment-scenarios.js', 'src/universe-actors.js',
    'src/universe-data.js', 'src/chronicles.js', 'src/combat.js', 'src/expansion.js',
    'tests/me3-legendary-weapons.test.js', 'tests/legendary-weapon-access.test.js',
    'scripts/me3-legendary-weapons-native.mjs', baselinePath,
    'docs/qa/me3-legendary-weapons-reference-report.json', 'docs/research/me3-legendary-weapons-sources.md'];
  for (const path of paths) report.sourceHashes[path] = hash(await file(path));
  const referencePath = 'docs/qa/me3-legendary-weapons-reference-report.json', reference = JSON.parse(await file(referencePath));
  assert.equal(reference.passed, true); assert.equal(reference.primaryDownloads.length, 2);
  assert.ok(reference.primaryDownloads.every(d => d.status === 200 && d.quoteFound));
  assert.deepEqual(reference.identityEvidence.map(e => e.recordId), ids); assert.equal(reference.leftClosed.length, 7);
  for (const [path, expected] of Object.entries(reference.sourceSnapshots)) assert.equal(hash(await file(path)), expected, path);
  report.referenceProof = { path: referencePath, sha256: hash(await file(referencePath)),
    primaryScope: 'Collective EA inclusion/integration only; explicit individual model/extension links are inherited catalogue evidence.' };

  const testPaths = ['tests/me3-legendary-weapons.test.js', 'tests/legendary-weapon-access.test.js',
    'tests/universe-equipment.test.js', 'tests/universe-armor-editions.test.js'];
  const tests = spawnSync(process.execPath, ['--test', '--test-reporter=tap', ...testPaths], { cwd: root, encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });
  const count = label => Number(tests.stdout.match(new RegExp(`^# ${label} (\\d+)$`, 'm'))?.[1] ?? -1);
  const result = { passed: tests.status === 0, generatedAt: new Date().toISOString(), command: `node --test --test-reporter=tap ${testPaths.join(' ')}`,
    exitCode: tests.status, total: count('tests'), passedTests: count('pass'), failed: count('fail'), skipped: count('skipped'),
    stdout: tests.stdout, stderr: tests.stderr, sourceHashes: Object.fromEntries(await Promise.all(testPaths.map(async path => [path, hash(await file(path))]))) };
  const testReportPath = 'docs/qa/me3-legendary-weapons-tests.json';
  await writeFile(new URL(testReportPath, root), JSON.stringify(result, null, 2) + '\n');
  assert.equal(result.passed, true, tests.stdout + tests.stderr); assert.equal(result.total, 43); assert.equal(result.failed, 0); assert.equal(result.skipped, 0);
  report.tests = { path: testReportPath, sha256: hash(await file(testReportPath)), total: result.total, ownNewTests: 8 };

  report.equipmentBefore = tally(baseline.equipment); report.equipmentAfter = tally(UNIVERSE_EQUIPMENT);
  assert.deepEqual(report.equipmentBefore, { profiles: 224, supported: 105, weapons: 77, armor: 25, weaponMods: 3 });
  assert.deepEqual(report.equipmentAfter, { profiles: 224, supported: 107, weapons: 79, armor: 25, weaponMods: 3 });
  for (const old of baseline.equipment) {
    const current = getUniverseEquipment(old.id);
    if (!ids.includes(old.id)) { assert.deepEqual(current, old, old.id); continue; }
    const fields = ['runtimeSupported', 'requiredEditionProfile', 'lockReason'];
    assert.deepEqual(omit(current, fields), omit(old, fields));
    assert.equal(current.runtimeSupported, true); assert.equal(current.requiredEditionProfile, 'legendary');
    report.changedProfiles.push({ id: old.id, changedFields: fields,
      before: Object.fromEntries(fields.map(key => [key, old[key]])), after: Object.fromEntries(fields.map(key => [key, current[key]])) });
  }
  assert.equal(report.changedProfiles.length, 2);
  for (const old of baseline.scenarios) {
    const current = SCENARIOS.find(s => s.id === old.id);
    if (old.id !== scene.id) { assert.deepEqual(current, old, old.id); continue; }
    const fields = ['allowedEquipmentIds', 'additionalEquipmentIds', 'sourceEntryIds', 'sourceIds', 'description', 'preparedConditions'];
    assert.deepEqual(omit(current, fields), omit(old, fields));
    for (const field of ['allowedEquipmentIds', 'additionalEquipmentIds', 'sourceEntryIds']) assert.deepEqual(current[field], [...old[field], ...ids]);
    assert.equal(current.description, old.description.replace('From Ashes, Citadel', 'From Ashes, Leviathan, Citadel'));
    report.changedScenarios.push({ id: old.id, changedFields: fields, appendedEquipmentIds: ids, addedPreparedContentCondition: 'Leviathan' });
  }
  assert.equal(report.changedScenarios.length, 1);
  for (const scenario of SCENARIOS) {
    const replay = playDefault(scenario), old = baseline.defaultBattles.find(b => b.id === scenario.id);
    assert.deepEqual(replay, old, scenario.id); report.defaultScenarioReplays.push({ ...replay, exact: true });
  }

  for (const id of ids) {
    const original = createChronicle(scene.context, scene.id), beforeSession = structuredClone(original);
    const prepared = equipChronicle(original, actorId, id, 'weapon'); assert.equal(prepared.ok, true); assert.deepEqual(original, beforeSession);
    assert.deepEqual(decodeChronicle(encodeChronicle(prepared.session)), prepared.session);
    const item = getUniverseEquipment(id), actor = buildChronicleActor(prepared.session, actorId);
    const started = startChronicleBattle(prepared.session); assert.equal(started.ok, true);
    const active = started.battle.actors.find(a => a.id === actorId), target = started.battle.actors.find(a => a.team === 'enemy');
    active.atb = 100; assert.equal(performAction(started.battle, { actorId, actionId: 'shoot', targetId: target.id }).ok, true);
    assert.equal(active.ammo, item.ammo - 1); assert.equal(active.reserveAmmo, item.reserveAmmo);
    const battle = createBattle({ party: [{ ...actor, atb: 100 }],
      enemies: [{ id: 'target', hp: 5000, attack: 1, defense: 0, speed: .1, powers: [] }], rng: () => .5, seed: 17, mode: 'active', medigel: 0 });
    const initial = snapshot(battle);
    assert.equal(performAction(battle, { actorId, actionId: 'shoot', targetId: 'target' }).ok, true);
    const afterShot = snapshot(battle); for (let i = 0; i < 300 && battle.actors[0].atb < 100; i++) tickBattle(battle, .1);
    assert.equal(performAction(battle, { actorId, actionId: 'reload', targetId: actorId }).ok, true);
    const afterReload = snapshot(battle);
    assert.equal(afterReload.ammo, initial.ammo); assert.equal(afterReload.reserveAmmo, initial.reserveAmmo - 1); assert.equal(afterReload.heat, 0);
    for (const other of SCENARIOS.filter(s => s.id !== scene.id)) assert.equal(canEquipUniverseItem(other.context, other.defaultParty[0], id, 'weapon', other.id).ok, false);
    report.newNativePreparations.push({ id, context: scene.context, scenarioId: scene.id, actorId, sourceIds: item.sourceIds,
      originalStatus: item.status, weaponType: item.weaponType,
      exactResourceProfile: { magazineCapacity: item.magazineCapacity, ammo: item.ammo, reserveAmmo: item.reserveAmmo },
      initial, afterShot, afterReload, realChronicleShot: true, serializationRoundTrip: true, foreignScenarioRefusals: 24 });
  }

  const registryBefore = JSON.stringify(EXPANSION_ALL_ENTRIES);
  for (const old of baseline.trials) {
    const current = runExpansionTrial(old.id, old.context, old.options); assert.equal(current.ok, old.ok, old.id);
    if (current.ok) {
      const resultSha256 = hashValue([current.result, current.control]); assert.equal(resultSha256, old.resultSha256, old.id);
      report.previousTrialReplays.push({ id: old.id, sourceReport: old.sourceReport, exact: true, resultSha256 });
    } else {
      assert.equal(current.reason, old.reason, old.id);
      report.previousClosures.push({ id: old.id, sourceReport: old.sourceReport, stillClosed: true, reasonUnchanged: true });
    }
  }
  assert.equal(JSON.stringify(EXPANSION_ALL_ENTRIES), registryBefore);
  assert.equal(report.previousTrialReplays.length, 280); assert.equal(report.previousClosures.length, 218);
  const protectedPaths = ['src/combat.js', 'src/chronicles.js', 'src/universe-actors.js', 'src/universe-weapon-profiles.js',
    ...['expansion', 'expansion2', 'expansion3'].flatMap(prefix => ['characters', 'armor', 'weapons', 'fleet', 'enemies'].map(name => `src/${prefix}-${name}.js`))];
  for (const path of protectedPaths) {
    const historical = execFileSync('git', ['show', `${baselineCommit}:${path}`], { cwd: root, maxBuffer: 16 * 1024 * 1024 });
    const current = await file(path); assert.equal(hash(current), hash(historical), path); report.preservedModules[path] = hash(current);
  }
  report.passed = true;
} catch (error) { report.errors.push(error.stack || String(error)); }
const output = 'docs/qa/me3-legendary-weapons-native-report.json';
await writeFile(new URL(output, root), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: report.passed, newPreparations: report.newNativePreparations.length, equipment: report.equipmentAfter,
  tests: report.tests, oldResultsExact: report.previousTrialReplays.length, oldClosuresExact: report.previousClosures.length,
  defaultBattles: report.defaultScenarioReplays.length, errors: report.errors }));
if (!report.passed) process.exitCode = 1;
