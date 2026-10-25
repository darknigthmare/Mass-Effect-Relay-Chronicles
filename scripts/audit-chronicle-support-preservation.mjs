// Reproduce the support/ammunition/portrait preservation audit without a browser.
// Provisional: node scripts/audit-chronicle-support-preservation.mjs
// Final, after the explicit promotions: same command --final --expected-promotions=17
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { isDeepStrictEqual } from 'node:util';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const args = process.argv.slice(2), final = args.includes('--final');
if (args.some(arg => arg !== '--final' && !/^--expected-promotions=\d+$/.test(arg))) throw new Error('Unknown audit option.');
const expectedPromotions = Number(args.find(arg => arg.startsWith('--expected-promotions='))?.split('=')[1] ?? (final ? 17 : 0));
if (final && expectedPromotions !== 17) throw new Error('The reviewed final lot requires exactly 17 promotions.');
const git = (...values) => execFileSync('git', values, { cwd: root, maxBuffer: 64 * 1024 * 1024 });
const baseCommit = git('rev-parse', '748b965').toString().trim();
const fromGit = filename => git('show', `${baseCommit}:${filename}`);
const currentBytes = filename => readFile(path.join(root, filename));
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const canonical = value => JSON.stringify(value, (_, child) => child && typeof child === 'object' && !Array.isArray(child)
  ? Object.fromEntries(Object.keys(child).sort().map(key => [key, child[key]])) : child);
const hashData = value => sha256(canonical(value));
const changedFields = (before, after) => [...new Set([...Object.keys(before), ...Object.keys(after)])]
  .filter(key => !isDeepStrictEqual(before[key], after[key])).sort();
const omit = (value, keys) => Object.fromEntries(Object.entries(value).filter(([key]) => !keys.includes(key)));
const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); return condition; };
const report = {
  version: 1, generatedAt: new Date().toISOString(), baseCommit, finalized: final,
  status: final ? 'final-preservation-audit' : 'pending-promotion-finalization',
  passed: false, preservationChecksPassed: false,
  reproduction: { script: 'scripts/audit-chronicle-support-preservation.mjs', arguments: args,
    scriptSha256: sha256(await readFile(fileURLToPath(import.meta.url))) },
  plannedNewPrototypeRows: 17, expectedNewPrototypeRows: expectedPromotions,
  scope: 'Compare all historical catalogue identities, protected entry fields, source records, prior assets and roster/scenario identities. Production annotations and declared adaptation metadata are accounted for separately. This is not a gameplay, artwork or 1:1 fidelity certification.',
};

const principalPath = 'docs/content-catalog.json';
const principalBeforeBytes = fromGit(principalPath), principalAfterBytes = await currentBytes(principalPath);
const principalBefore = JSON.parse(principalBeforeBytes), principalAfter = JSON.parse(principalAfterBytes);
const mainExceptions = {
  'SYS-chroniques-contextuelles': ['notes'],
  'SYS-preparations-chroniques': ['acceptance', 'notes'],
};
const principalUpdates = [];
check(principalBefore.entries.length === 1330 && principalAfter.entries.length === 1330, 'The principal catalogue must retain all 1330 entries.');
check(isDeepStrictEqual(principalBefore.entries.map(row => row.id), principalAfter.entries.map(row => row.id)), 'Principal identities/order changed.');
for (let index = 0; index < principalBefore.entries.length; index++) {
  const before = principalBefore.entries[index], after = principalAfter.entries[index];
  if (!after) continue;
  const fields = changedFields(before, after);
  if (!fields.length) continue;
  check(fields.every(field => mainExceptions[before.id]?.includes(field)), `Unexpected principal edit: ${before.id} (${fields.join(', ')}).`);
  principalUpdates.push({ id: before.id, fields });
}
const mainTopFields = changedFields(omit(principalBefore, ['entries']), omit(principalAfter, ['entries']));
check(mainTopFields.every(key => key === 'meta'), 'Principal categories or source definitions changed.');
const advanced = principalBefore.entries.filter(entry => ['Validé', 'Intégré'].includes(entry.status));
const future = principalBefore.entries.filter(entry => ['ME2', 'ME3'].includes(entry.episode));
report.principal = {
  path: principalPath, beforeSha256: sha256(principalBeforeBytes), afterSha256: sha256(principalAfterBytes),
  rows: principalAfter.entries.length, unchangedRows: principalAfter.entries.length - principalUpdates.length,
  adaptationUpdates: principalUpdates, metadataChanged: !isDeepStrictEqual(principalBefore.meta, principalAfter.meta),
  metadataChangedFields: changedFields(principalBefore.meta, principalAfter.meta),
  oldSources: principalBefore.sources.length, sourceRecordsPreserved: check(isDeepStrictEqual(principalBefore.sources, principalAfter.sources), 'Principal sources changed.'),
  historicalAdvancedRows: advanced.length, historicalAdvancedRowsPreserved: check(advanced.every(entry => isDeepStrictEqual(entry, principalAfter.entries.find(row => row.id === entry.id))), 'Previously validated/integrated principal entries changed.'),
  futureRows: future.length, futureRowsPreserved: check(future.every(entry => isDeepStrictEqual(entry, principalAfter.entries.find(row => row.id === entry.id))), 'Future ME2/ME3 rows in the principal workbook changed.'),
};

const cataloguePaths = (await readdir(path.join(root, 'docs/universe/catalogs'))).filter(name => name.endsWith('.json')).sort()
  .map(name => `docs/universe/catalogs/${name}`);
const baselinePaths = git('ls-tree', '-r', '--name-only', '-z', baseCommit, '--', 'docs/universe/catalogs').toString().split('\0').filter(name => name.endsWith('.json')).sort();
check(isDeepStrictEqual(cataloguePaths, baselinePaths), 'The universe catalogue file set changed.');
const productionFields = ['status', 'implementation', 'implementationPaths', 'implementationPath', 'evidence', 'notes'];
const catalogueDetails = [], updates = [], promotedIds = [], sourceAdditions = [], modifiedOldSources = [], removedOldSources = [];
let universeRows = 0, unchangedUniverseRows = 0, oldSourceCount = 0;
for (const filename of cataloguePaths) {
  const beforeBytes = fromGit(filename), afterBytes = await currentBytes(filename);
  const before = JSON.parse(beforeBytes), after = JSON.parse(afterBytes);
  universeRows += after.entries.length; oldSourceCount += before.sources.length;
  check(isDeepStrictEqual(before.entries.map(row => row.id), after.entries.map(row => row.id)), `Universe identities/order changed in ${before.id}.`);
  check(isDeepStrictEqual(omit(before, ['entries', 'sources', 'summary', 'coverage']), omit(after, ['entries', 'sources', 'summary', 'coverage'])), `Protected catalogue metadata changed in ${before.id}.`);
  const oldSources = new Map(before.sources.map(source => [source.id, source])), newSources = new Map(after.sources.map(source => [source.id, source]));
  check(oldSources.size === before.sources.length && newSources.size === after.sources.length, `Duplicate source IDs in ${before.id}.`);
  for (const [id, source] of oldSources) {
    if (!newSources.has(id)) removedOldSources.push({ mediaId: before.id, id });
    else if (!isDeepStrictEqual(source, newSources.get(id))) modifiedOldSources.push({ mediaId: before.id, id });
  }
  for (const source of after.sources) if (!oldSources.has(source.id)) sourceAdditions.push({ mediaId: before.id, ...source });
  check(isDeepStrictEqual(before.sources, after.sources.filter(source => oldSources.has(source.id))), `Historical source ordering changed in ${before.id}.`);
  for (let index = 0; index < before.entries.length; index++) {
    const oldRow = before.entries[index], newRow = after.entries[index];
    if (!newRow) continue;
    const fields = changedFields(oldRow, newRow);
    if (!fields.length) { unchangedUniverseRows++; continue; }
    check(fields.every(field => productionFields.includes(field)), `Protected entry field changed: ${oldRow.id} (${fields.join(', ')}).`);
    if (fields.includes('status')) {
      check(oldRow.status === 'Défini' && newRow.status === 'Prototype', `Unapproved status transition: ${oldRow.id}.`);
      if (oldRow.status === 'Défini' && newRow.status === 'Prototype') promotedIds.push(oldRow.id);
    }
    updates.push({ mediaId: before.id, id: oldRow.id, fields, fromStatus: oldRow.status, toStatus: newRow.status });
  }
  catalogueDetails.push({ id: before.id, path: filename, rows: after.entries.length,
    beforeSha256: sha256(beforeBytes), afterSha256: sha256(afterBytes),
    sourceRecordsBefore: before.sources.length, sourceRecordsAfter: after.sources.length,
    topLevelChangedFields: changedFields(omit(before, ['entries']), omit(after, ['entries'])) });
}
check(universeRows === 5326, 'The universe must retain all 5326 entries.');
check(modifiedOldSources.length === 0 && removedOldSources.length === 0, 'A historical universe source was modified or removed.');
check(sourceAdditions.length === 1 && sourceAdditions[0].mediaId === 'ME3' && sourceAdditions[0].id === 'ME3-SRC-MANUAL-PC', 'Expected exactly the new ME3 PC manual source.');
check(promotedIds.length === expectedPromotions, `Observed ${promotedIds.length} promotions; expected ${expectedPromotions} in this audit phase.`);
report.universe = { catalogueCount: catalogueDetails.length, rows: universeRows, unchangedRows: unchangedUniverseRows,
  protectedEntryFieldsPreserved: !failures.some(message => /Protected entry|identities\/order/.test(message)),
  changedProductionEntries: updates, newPrototypeRows: promotedIds.length, promotedIds: promotedIds.sort(),
  historicalSources: { count: oldSourceCount, preserved: modifiedOldSources.length === 0 && removedOldSources.length === 0,
    modified: modifiedOldSources, removed: removedOldSources },
  newSources: sourceAdditions, allSourceArraysIdentical: sourceAdditions.length === 0 && modifiedOldSources.length === 0 && removedOldSources.length === 0,
  catalogues: catalogueDetails };

const assetPaths = git('ls-tree', '-r', '--name-only', '-z', baseCommit, '--', 'public/assets').toString().split('\0').filter(Boolean);
const historicalAssets = [];
for (const filename of assetPaths) {
  const before = fromGit(filename), after = await currentBytes(filename);
  historicalAssets.push({ path: filename, bytes: after.length, beforeSha256: sha256(before), afterSha256: sha256(after), unchanged: before.equals(after) });
  check(before.equals(after), `Historical asset changed: ${filename}.`);
}
async function filesBelow(directory) {
  const result = [];
  for (const entry of await readdir(path.join(root, directory), { withFileTypes: true })) {
    const filename = `${directory}/${entry.name}`;
    if (entry.isDirectory()) result.push(...await filesBelow(filename));
    else if (entry.isFile()) result.push(filename);
  }
  return result;
}
const newAssetPaths = (await filesBelow('public/assets')).filter(filename => !assetPaths.includes(filename)).sort();
const addedAssets = [];
for (const filename of newAssetPaths) { const bytes = await currentBytes(filename); addedAssets.push({ path: filename, bytes: bytes.length, sha256: sha256(bytes) }); }
report.assets = { historicalCount: historicalAssets.length, historicalAssetsPreserved: historicalAssets.every(asset => asset.unchanged),
  historical: historicalAssets, additions: addedAssets, note: 'New portrait files are additions, not evidence that the complete asset directory is unchanged.' };

// Import the original dependency tree in a temporary directory. This compares
// executable rosters/scenes, not a brittle text extraction of their definitions.
const temporary = await mkdtemp(path.join(tmpdir(), 'relay-support-preservation-'));
try {
  execFileSync('tar', ['-x', '-C', temporary], { input: git('archive', baseCommit, 'src', 'package.json'), maxBuffer: 64 * 1024 * 1024 });
  const oldRuntime = await import(pathToFileURL(path.join(temporary, 'src/universe-actors.js')).href);
  const newRuntime = await import(pathToFileURL(path.join(root, 'src/universe-actors.js')).href);
  const identityFields = ['id', 'catalogId', 'catalogWorkId', 'mediaId', 'category', 'name', 'nature', 'canonLevel',
    'description', 'conditions', 'availability', 'periodIds', 'role', 'allowedWeapons', 'weaponTraining',
    'biologicalSpecies', 'armorSpecies', 'biotic', 'tech', 'classPolicy', 'canUseOmniTool', 'sceneRestriction'];
  const identities = actors => actors.map(actor => Object.fromEntries(identityFields.filter(key => Object.hasOwn(actor, key)).map(key => [key, actor[key]])));
  const oldIdentities = identities(oldRuntime.UNIVERSE_ACTORS), newIdentities = identities(newRuntime.UNIVERSE_ACTORS);
  const oldRosterIds = [...new Set(oldRuntime.SCENARIOS.flatMap(scenario => scenario.actorIds))].sort();
  const newRosterIds = [...new Set(newRuntime.SCENARIOS.flatMap(scenario => scenario.actorIds))].sort();
  const rosterPreserved = check(isDeepStrictEqual(oldIdentities, newIdentities), 'Runtime character identity or roster permissions changed.');
  const scenariosPreserved = check(isDeepStrictEqual(oldRuntime.SCENARIOS, newRuntime.SCENARIOS), 'Existing runtime scenarios, roster, contexts, conditions or equipment whitelists changed.');
  report.runtime = { documentaryActorProfiles: newIdentities.length, selectableRosterActors: newRosterIds.length,
    selectableRosterIds: newRosterIds, selectableRosterPreserved: check(isDeepStrictEqual(oldRosterIds, newRosterIds), 'Selectable scenario roster changed.'),
    actorIdentityFields: identityFields, actorIdentitiesPreserved: rosterPreserved,
    beforeIdentitiesSha256: hashData(oldIdentities), afterIdentitiesSha256: hashData(newIdentities),
    scenarios: newRuntime.SCENARIOS.length, completeScenariosPreserved: scenariosPreserved,
    beforeScenariosSha256: hashData(oldRuntime.SCENARIOS), afterScenariosSha256: hashData(newRuntime.SCENARIOS),
    note: 'Power kits, ammunition permissions and portraits are the intended runtime extension and are excluded from the identity projection.' };
} finally { await rm(temporary, { recursive: true, force: true }); }

report.preservationChecksPassed = failures.length === 0;
report.passed = final && report.preservationChecksPassed;
report.failures = failures;
const reportPath = 'docs/qa/chronicle-support-preservation-report.json';
await writeFile(path.join(root, reportPath), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ reportPath, finalized: final, passed: report.passed, preservationChecksPassed: report.preservationChecksPassed,
  principalRows: report.principal.rows, universeRows, promotions: promotedIds.length,
  oldAssets: historicalAssets.length, sourceAdditions: sourceAdditions.map(source => source.id), failures }));
if (failures.length) process.exitCode = 1;
