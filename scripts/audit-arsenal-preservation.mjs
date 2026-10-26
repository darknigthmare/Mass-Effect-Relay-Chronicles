// Read-only baseline comparison; only this audit report is written.
// Provisional: node scripts/audit-arsenal-preservation.mjs
// Final after the reviewed 50 universe + 2 main promotions: add --final.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { isDeepStrictEqual } from 'node:util';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const args = process.argv.slice(2), final = args.includes('--final');
if (args.some(arg => arg !== '--final')) throw new Error('Only --final is supported.');
const baseCommit = '1310a84ff132e80f5b00e14b19e4930cbe9d27d5';
const gitRead = (...args) => execFileSync('git', args, { cwd: root, maxBuffer: 64 * 1024 * 1024 });
const baseline = filename => gitRead('show', `${baseCommit}:${filename}`);
const current = filename => readFile(path.join(root, filename));
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const canonical = value => JSON.stringify(value, (_, child) => child && typeof child === 'object' && !Array.isArray(child)
  ? Object.fromEntries(Object.keys(child).sort().map(key => [key, child[key]])) : child);
const hashData = value => sha256(canonical(value));
const omit = (value, fields) => Object.fromEntries(Object.entries(value).filter(([key]) => !fields.includes(key)));
const changes = (before, after) => [...new Set([...Object.keys(before), ...Object.keys(after)])].filter(key => !isDeepStrictEqual(before[key], after[key])).sort();
const failures = [], check = (value, message) => { if (!value) failures.push(message); return value; };
const productionFields = ['status', 'implementation', 'implementationPaths', 'evidence', 'notes'];
const newMainIds = ['REF-VEH-M35-MAKO-ME1', 'REF-SHP-NORMANDY-SR1-ME1'];
const reviewedIds = new Set(`
ME2-ENM-LOKI ME2-ENM-FENRIS ME2-ENM-YMIR ME2-ENM-COLLECTOR-DRONE ME2-ENM-HARBINGER ME2-ENM-PRAETORIAN
ME3-ENM-ASSAULT ME3-ENM-HUSK ME3-ENM-MARAUDER ME3-ENM-BRUTE ME3-ENM-BANSHEE ME3-ENM-KAI
MEA-ENM-CHOSEN MEA-ENM-ASCENDANT MEA-ENM-CARDINAL MEA-ENM-DESTROYER
ME3-WPN-PARTICLE ME3-WPN-LANCER ME3-WPN-ARC ME3-WPN-GRAAL ME3-WPN-JAVELIN MEA-WPN-EQUALIZER MEA-WPN-SCATTERSHOT MEA-WPN-VENOM
ME2-EQP-KESTREL ME2-EQP-CERBERUS ME2-EQP-COLLECTOR ME2-EQP-TERMINUS ME2-EQP-BLOOD-DRAGON ME2-EQP-INFERNO
ME3-EQP-AJAX ME3-EQP-INFERNO ME3-EQP-BLOOD-DRAGON ME3-EQP-COLLECTOR ME3-EQP-TERMINUS ME3-EQP-CERBERUS
MEA-EQP-REMNANT MEA-EQP-SCAVENGER MEA-EQP-DEEP-SPACE ME3-EQP-ULTRALIGHT
ME2-SPR-CHR-MORDIN ME2-SPR-CHR-TALI ME2-SPR-CHR-LEGION ME2-SPR-CHR-SAMARA ME2-SPR-ENM-LOKI ME2-SPR-ENM-YMIR ME2-SPR-ENM-PRAETORIAN
ME3-SPR-ENM-KAI ME3-SPR-ENM-BRUTE ME3-SPR-ENM-BANSHEE
REF-VEH-M35-MAKO-ME1 REF-SHP-NORMANDY-SR1-ME1`.trim().split(/\s+/));
check(reviewedIds.size === 52, 'The embedded reviewed promotion whitelist must contain 52 distinct IDs.');
const report = {
  version: 1, generatedAt: new Date().toISOString(), baseCommit, finalized: final,
  status: final ? 'final-preservation-audit' : 'pending-52-promotions', passed: false,
  preservationChecksPassed: false, expectedPromotions: { universe: 50, principalNewReferences: 2, total: 52 },
  reproduction: { script: 'scripts/audit-arsenal-preservation.mjs', arguments: args,
    scriptSha256: sha256(await readFile(fileURLToPath(import.meta.url))), baselineAccess: 'Git object reads/archive only; no checkout, index, commit or remote mutation.' },
  scope: 'Historical factual fields, sources, assets, identities and scenario rosters are compared separately from explicit production changes and additions. This does not certify generated art, geometry, original mechanics or 1:1 fidelity.',
};
try {
  const filename = 'docs/universe/qa/arsenal-progress-plan.json', bytes = await current(filename), plan = JSON.parse(bytes);
  const declaredIds = [...new Set(plan.changes.map(row => row.id))].sort();
  check(isDeepStrictEqual(declaredIds, [...reviewedIds].sort()), 'Repository progress plan differs from the embedded 52 reviewed IDs.');
  report.reviewedWhitelist = { kind: 'repository-progress-plan', path: filename, sha256: sha256(bytes), entries: declaredIds.length };
} catch (error) { if (error.code !== 'ENOENT') throw error; report.reviewedWhitelist = { embeddedIdsAvailable: true, repositoryPlanAvailable: false }; }
{
  const filename = 'docs/qa/arsenal-baseline-exceptions.json', bytes = await current(filename), exceptions = JSON.parse(bytes);
  check(exceptions.originalBaseline?.commit === baseCommit && exceptions.originalBaseline.records === 6656
    && exceptions.originalBaseline.sources === 449, 'Declared exception baseline does not match the historical commit/counts.');
  check(exceptions.afterAuthorizedRootChanges?.records === 6658 && exceptions.afterAuthorizedRootChanges.sources === 450
    && exceptions.rootAppendedSource?.id === 'ME1-MANUAL-X360-EN'
    && isDeepStrictEqual(exceptions.rootAddedEntries.map(row => row.id).sort(), [...newMainIds].sort()), 'Declared main exceptions exceed the reviewed one-source/two-reference scope.');
  report.authorizedBaselineExceptions = { path: filename, sha256: sha256(bytes),
    originalRecords: exceptions.originalBaseline.records, currentRecords: exceptions.afterAuthorizedRootChanges.records,
    originalSources: exceptions.originalBaseline.sources, currentSources: exceptions.afterAuthorizedRootChanges.sources,
    snapshotPathScope: 'Paths to former /tmp snapshots in this document are historical evidence only; none is read or required by the audit.' };
}

const mainPath = 'docs/content-catalog.json';
const oldMainBytes = baseline(mainPath), newMainBytes = await current(mainPath);
const oldMain = JSON.parse(oldMainBytes), newMain = JSON.parse(newMainBytes);
const beforeMainIds = new Set(oldMain.entries.map(row => row.id)), afterMain = new Map(newMain.entries.map(row => [row.id, row]));
const oldMainChanges = [], mainExceptions = new Set(['SYS-chroniques-contextuelles', 'SYS-preparations-chroniques']);
check(oldMain.entries.length === 1330 && newMain.entries.length === 1332 && afterMain.size === 1332, 'Expected 1330 historical main rows and 1332 current main rows.');
check(isDeepStrictEqual(oldMain.entries.map(row => row.id), newMain.entries.filter(row => beforeMainIds.has(row.id)).map(row => row.id)), 'Historical main identity/order changed.');
for (const before of oldMain.entries) {
  const after = afterMain.get(before.id);
  if (!check(Boolean(after), `Historical main entry removed: ${before.id}.`)) continue;
  const fields = changes(before, after);
  if (fields.length) {
    check(mainExceptions.has(before.id) && fields.every(field => field === 'notes'), `Unexpected historical main changes: ${before.id} (${fields.join(', ')}).`);
    oldMainChanges.push({ id: before.id, fields });
  }
}
check(isDeepStrictEqual(omit(oldMain, ['entries', 'sources', 'meta']), omit(newMain, ['entries', 'sources', 'meta'])), 'Main categories or protected top-level fields changed.');
const addedMain = newMain.entries.filter(row => !beforeMainIds.has(row.id));
check(isDeepStrictEqual(addedMain.map(row => row.id).sort(), [...newMainIds].sort()), 'Unexpected new main reference IDs.');
const sourceId = 'ME1-MANUAL-X360-EN';
const officialUrl = 'https://eaassets-a.akamaihd.net/eahelp/manuals/mass-effect-manuals_Microsoft%20XBOX360_en_US.pdf';
const documentSha256 = 'f09cbe3dae03b652299d63f6b4c9340b8d0a9bf4df8b92b83e9bd9545dbceb44';
const oldSourceIds = new Set(oldMain.sources.map(source => source.id));
const appendedMainSources = newMain.sources.filter(source => !oldSourceIds.has(source.id));
const oldMainSourcesPreserved = check(isDeepStrictEqual(oldMain.sources, newMain.sources.filter(source => oldSourceIds.has(source.id))), 'Historical main source records/order changed.');
check(appendedMainSources.length === 1 && appendedMainSources[0].id === sourceId
  && appendedMainSources[0].url === officialUrl && appendedMainSources[0].scope.includes(documentSha256), 'The only new main source must identify the exact official ME1 Xbox360 URL and document SHA256.');
const sourceProofBytes = await current('docs/qa/arsenal-visual-reference-report.json'), sourceProof = JSON.parse(sourceProofBytes);
const document = sourceProof.newDownloads.find(item => item.id === 'me1-manual-x360-en');
check(document?.httpStatus === 200 && document.pdfSignature === true && document.sha256 === documentSha256
  && document.resolvedUrl === officialUrl, 'New primary source registration lacks its successful official document evidence.');
const principalPromotions = [];
for (const row of addedMain) {
  check(row.episode === 'ME1' && row.category === 'props' && row.canonLevel === 'Confirmé'
    && row.sourceId === sourceId && row.sourceUrl === officialUrl, `New named-view reference has an unexpected factual scope: ${row.id}.`);
  check(['Défini', 'Prototype'].includes(row.status), `Unapproved stage for new main reference ${row.id}.`);
  if (row.status === 'Prototype') principalPromotions.push(row.id);
}
const future = oldMain.entries.filter(row => ['ME2', 'ME3'].includes(row.episode));
const advanced = oldMain.entries.filter(row => ['Validé', 'Intégré'].includes(row.status));
report.principal = { path: mainPath, historicalRows: oldMain.entries.length, currentRows: newMain.entries.length,
  oldRowsStrictlyUnchanged: oldMain.entries.length - oldMainChanges.length, authorizedOldAdaptationUpdates: oldMainChanges,
  metadataChangedFields: changes(oldMain.meta, newMain.meta), beforeSha256: sha256(oldMainBytes), afterSha256: sha256(newMainBytes),
  historicalSources: oldMain.sources.length, currentSources: newMain.sources.length, historicalSourcesPreserved: oldMainSourcesPreserved,
  appendedSources: appendedMainSources, newNamedViewReferences: addedMain.map(row => ({ id: row.id, status: row.status, canonLevel: row.canonLevel, sourceId: row.sourceId })),
  newPrototypeReferences: principalPromotions,
  futureRows: future.length, futureRowsPreserved: check(future.length === 57 && future.every(row => isDeepStrictEqual(row, afterMain.get(row.id))), 'The 57 historical future entries changed.'),
  advancedRows: advanced.length, advancedRowsPreserved: check(advanced.length === 6 && advanced.every(row => isDeepStrictEqual(row, afterMain.get(row.id))), 'The six previously validated/integrated entries changed.'),
  primaryReferenceEvidence: { path: 'docs/qa/arsenal-visual-reference-report.json', sha256: sha256(sourceProofBytes), officialUrl, documentSha256,
    factualScope: 'Source identity and the named Mako/Normandy ME1 views only.', generatedArtworkCertified: false },
};

const paths = (await readdir(path.join(root, 'docs/universe/catalogs'))).filter(name => name.endsWith('.json')).sort().map(name => `docs/universe/catalogs/${name}`);
const oldPaths = gitRead('ls-tree', '-r', '--name-only', '-z', baseCommit, '--', 'docs/universe/catalogs').toString().split('\0').filter(name => name.endsWith('.json')).sort();
check(isDeepStrictEqual(paths, oldPaths), 'Universe catalogue set changed.');
const universeChanges = [], universePromotions = [], catalogues = [], currentCatalogueEntries = new Map();
let oldRows = 0, currentRows = 0, oldSources = 0, currentSources = 0, unchangedRows = 0;
for (const filename of paths) {
  const oldBytes = baseline(filename), newBytes = await current(filename), before = JSON.parse(oldBytes), after = JSON.parse(newBytes);
  for (const row of after.entries) currentCatalogueEntries.set(row.id, row);
  oldRows += before.entries.length; currentRows += after.entries.length; oldSources += before.sources.length; currentSources += after.sources.length;
  check(isDeepStrictEqual(before.entries.map(row => row.id), after.entries.map(row => row.id)), `Universe identity/order changed in ${before.id}.`);
  check(isDeepStrictEqual(before.sources, after.sources), `Universe sources changed in ${before.id}.`);
  check(isDeepStrictEqual(omit(before, ['entries', 'summary', 'coverage']), omit(after, ['entries', 'summary', 'coverage'])), `Protected top-level universe metadata changed in ${before.id}.`);
  const afterById = new Map(after.entries.map(row => [row.id, row]));
  for (const row of before.entries) {
    const updated = afterById.get(row.id);
    if (!updated) continue;
    const fields = changes(row, updated);
    if (!fields.length) { unchangedRows++; continue; }
    check(reviewedIds.has(row.id) && fields.every(field => productionFields.includes(field)), `Unreviewed/protected universe change: ${row.id} (${fields.join(', ')}).`);
    if (fields.includes('status')) {
      check(row.status === 'Défini' && updated.status === 'Prototype', `Unexpected status transition: ${row.id}.`);
      if (row.status === 'Défini' && updated.status === 'Prototype') universePromotions.push(row.id);
    }
    universeChanges.push({ mediaId: before.id, id: row.id, fields });
  }
  catalogues.push({ id: before.id, path: filename, rows: after.entries.length,
    beforeSha256: sha256(oldBytes), afterSha256: sha256(newBytes), topLevelChangedFields: changes(omit(before, ['entries']), omit(after, ['entries'])) });
}
check(oldRows === 5326 && currentRows === 5326, 'Universe must retain 5326 factual and adaptation records.');
report.universe = { catalogueCount: paths.length, historicalRows: oldRows, currentRows, strictlyUnchangedRows: unchangedRows,
  historicalSources: oldSources, currentSources, sourcesPreserved: !failures.some(message => message.startsWith('Universe sources')),
  productionChanges: universeChanges, newPrototypeRows: universePromotions.length, promotedIds: universePromotions.sort(), catalogues };
report.totals = { historicalRecords: oldMain.entries.length + oldRows, currentRecords: newMain.entries.length + currentRows,
  historicalSources: oldMain.sources.length + oldSources, currentSources: newMain.sources.length + currentSources,
  currentPromotions: universePromotions.length + principalPromotions.length };
check(report.totals.historicalRecords === 6656 && report.totals.currentRecords === 6658, 'Total records must be 6656 historical and 6658 current.');
check(report.totals.historicalSources === 449 && report.totals.currentSources === 450, 'Total source records must be 449 historical and 450 current.');
const expectedUniverseIds = [...reviewedIds].filter(id => !newMainIds.includes(id)).sort();
report.promotionLotComplete = isDeepStrictEqual(universePromotions.sort(), expectedUniverseIds)
  && isDeepStrictEqual(principalPromotions.sort(), [...newMainIds].sort());
if (final) check(report.promotionLotComplete, 'Final audit requires all 50 exact universe promotions and both new main reference promotions.');

const assetPaths = gitRead('ls-tree', '-r', '--name-only', '-z', baseCommit, '--', 'public/assets').toString().split('\0').filter(Boolean);
const assets = [];
for (const filename of assetPaths) {
  const before = baseline(filename), after = await current(filename);
  check(before.equals(after), `Historical asset bytes changed: ${filename}.`);
  assets.push({ path: filename, bytes: after.length, beforeSha256: sha256(before), afterSha256: sha256(after), unchanged: before.equals(after) });
}
const newAssetPaths = (await readdir(path.join(root, 'public/assets'))).map(name => `public/assets/${name}`).filter(filename => !assetPaths.includes(filename)).sort();
const expectedAssets = ['arsenal-equipment.png', 'arsenal-fleet.png', 'arsenal-opponents.png', 'arsenal-people.png', 'arsenal-visuals.json'].map(name => `public/assets/${name}`).sort();
check(assetPaths.length === 14 && isDeepStrictEqual(newAssetPaths, expectedAssets), 'Expected 14 historical assets and exactly four PNGs plus one new manifest.');
const addedAssets = [];
for (const filename of newAssetPaths) { const bytes = await current(filename); addedAssets.push({ path: filename, bytes: bytes.length, sha256: sha256(bytes) }); }
const visualManifest = JSON.parse(await current('public/assets/arsenal-visuals.json'));
check(visualManifest.globalFidelityCertified === false && visualManifest.status === 'Prototype', 'Generated artwork must remain explicitly uncertified and partial.');
for (const atlas of visualManifest.atlases) check(addedAssets.some(asset => asset.path === atlas.path && asset.sha256 === atlas.sha256), `New atlas manifest hash mismatch: ${atlas.id}.`);
report.assets = { historicalCount: assets.length, historicalPreserved: assets.every(asset => asset.unchanged), historical: assets,
  additions: addedAssets, generatedArtworkCertified: false, note: 'Hash preservation and factual subject identification do not certify generated likeness, geometry, animation or eight-direction sprites.' };

const temporary = await mkdtemp(path.join(tmpdir(), 'relay-arsenal-preservation-'));
try {
  execFileSync('tar', ['-x', '-C', temporary], { input: gitRead('archive', baseCommit, 'src', 'package.json'), maxBuffer: 64 * 1024 * 1024 });
  const before = await import(pathToFileURL(path.join(temporary, 'src/universe-actors.js')).href);
  const after = await import(pathToFileURL(path.join(root, 'src/universe-actors.js')).href);
  const identityFields = ['id', 'catalogId', 'catalogWorkId', 'mediaId', 'category', 'name', 'nature', 'canonLevel', 'description', 'conditions',
    'availability', 'periodIds', 'role', 'allowedWeapons', 'weaponTraining', 'biologicalSpecies', 'armorSpecies', 'biotic', 'tech', 'classPolicy', 'canUseOmniTool', 'sceneRestriction'];
  const identity = actors => actors.map(actor => Object.fromEntries(identityFields.filter(key => Object.hasOwn(actor, key)).map(key => [key, actor[key]])));
  const beforeIdentity = identity(before.UNIVERSE_ACTORS), afterIdentity = identity(after.UNIVERSE_ACTORS);
  check(isDeepStrictEqual(beforeIdentity, afterIdentity), 'Historical character identities or permissions changed.');
  const oldRoster = [...new Set(before.SCENARIOS.flatMap(item => item.actorIds))].sort(), newRoster = [...new Set(after.SCENARIOS.flatMap(item => item.actorIds))].sort();
  check(oldRoster.length === 42 && isDeepStrictEqual(oldRoster, newRoster), 'Selectable roster changed from the historical 42 identities.');
  const baseWorkshops = ['me2-equipment-workshop', 'me3-equipment-workshop', 'mea-equipment-workshop'];
  const extensions = [], preservedScenarios = [];
  for (const oldScene of before.SCENARIOS) {
    const scene = after.SCENARIOS.find(item => item.id === oldScene.id);
    if (!check(Boolean(scene), `Historical scenario removed: ${oldScene.id}.`)) continue;
    const isBaseWorkshop = baseWorkshops.includes(oldScene.id);
    const derivedFields = isBaseWorkshop ? ['allowedEquipmentIds', 'sourceEntryIds', 'sourceIds'] : [];
    check(isDeepStrictEqual(omit(oldScene, derivedFields), omit(scene, derivedFields)), `Historical scenario fields, rosters or enemies changed: ${oldScene.id}.`);
    if (isBaseWorkshop) {
      const oldIds = new Set(oldScene.allowedEquipmentIds);
      check(isDeepStrictEqual(oldScene.allowedEquipmentIds, scene.allowedEquipmentIds.filter(id => oldIds.has(id))), `Historical equipment whitelist lost/reordered IDs: ${oldScene.id}.`);
      const added = scene.allowedEquipmentIds.filter(id => !oldIds.has(id));
      check(added.every(id => reviewedIds.has(id) && /-(?:WPN|EQP)-/.test(id)), `Base workshop received an unreviewed gear ID: ${oldScene.id}.`);
      check(!added.some(id => ['ME3-WPN-PARTICLE', 'ME3-WPN-LANCER'].includes(id) || /^(?:ME2|ME3)-EQP-(?:KESTREL|CERBERUS|COLLECTOR|TERMINUS|BLOOD-DRAGON|INFERNO|AJAX)$|^MEA-EQP-(?:SCAVENGER|DEEP-SPACE)$/.test(id)), `Edition equipment leaked into a base workshop: ${oldScene.id}.`);
      const derivedSourceIds = [...new Set(scene.allowedEquipmentIds.flatMap(id => currentCatalogueEntries.get(id)?.sourceIds || []))];
      check(isDeepStrictEqual(scene.sourceEntryIds, scene.allowedEquipmentIds), `Base workshop source entries are not exactly its equipment whitelist: ${scene.id}.`);
      check(isDeepStrictEqual(scene.sourceIds, derivedSourceIds), `Base workshop source IDs are not derived from its canonical gear records: ${scene.id}.`);
      check(isDeepStrictEqual(oldScene.sourceEntryIds, scene.sourceEntryIds.filter(id => oldScene.sourceEntryIds.includes(id)))
        && isDeepStrictEqual(oldScene.sourceIds, scene.sourceIds.filter(id => oldScene.sourceIds.includes(id))), `Historical workshop provenance was removed or reordered: ${scene.id}.`);
      extensions.push({ scenarioId: scene.id, beforeCount: oldScene.allowedEquipmentIds.length, afterCount: scene.allowedEquipmentIds.length, addedIds: added,
        derivedSourceEntryIdsAdded: scene.sourceEntryIds.filter(id => !oldScene.sourceEntryIds.includes(id)),
        derivedSourceIdsAdded: scene.sourceIds.filter(id => !oldScene.sourceIds.includes(id)),
        provenanceRule: 'Only exact derivation from the expanded canonical equipment whitelist is permitted; historical provenance is preserved.' });
    }
    preservedScenarios.push(oldScene.id);
  }
  const oldSceneIds = new Set(before.SCENARIOS.map(item => item.id)), additions = after.SCENARIOS.filter(item => !oldSceneIds.has(item.id));
  check(before.SCENARIOS.length === 16 && after.SCENARIOS.length === 25 && additions.length === 9
    && additions.filter(item => item.kind === 'opposition-workshop').length === 6
    && additions.filter(item => item.kind === 'equipment-workshop' && ['legendary', 'deluxe'].includes(item.editionEquipmentProfile)).length === 3,
  'Expected exactly six opposition benches and three edition workshops added to the 16 historical scenarios.');
  report.runtime = { documentaryIdentityRecords: afterIdentity.length, beforeIdentitiesSha256: hashData(beforeIdentity), afterIdentitiesSha256: hashData(afterIdentity),
    identityProjectionFields: identityFields, selectableActors: newRoster.length, rosterPreserved: isDeepStrictEqual(oldRoster, newRoster),
    historicalScenarios: preservedScenarios, currentScenarioCount: after.SCENARIOS.length, baseWorkshopWhitelistExtensions: extensions,
    scenarioAdditions: additions.map(item => ({ id: item.id, context: item.context, kind: item.kind, editionEquipmentProfile: item.editionEquipmentProfile || null,
      actorIds: item.actorIds, enemyCatalogIds: item.enemies.map(enemy => enemy.catalogId || null) })),
    scope: 'All historical scenario fields/enemies/rosters are compared; only the three base gear whitelists and their exactly derived provenance lists may grow. Kits and new artwork are intentionally outside the character identity projection.' };
} finally { await rm(temporary, { recursive: true, force: true }); }

report.preservationChecksPassed = failures.length === 0;
report.passed = final && report.promotionLotComplete && report.preservationChecksPassed;
report.failures = failures;
const reportPath = 'docs/qa/arsenal-preservation-report.json';
await writeFile(path.join(root, reportPath), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ reportPath, finalized: final, passed: report.passed, preservationChecksPassed: report.preservationChecksPassed,
  principalHistoricalRows: report.principal.historicalRows, principalCurrentRows: report.principal.currentRows,
  universeRows: currentRows, totalRecords: report.totals.currentRecords, totalSources: report.totals.currentSources,
  universePromotions: universePromotions.length, mainPromotions: principalPromotions.length, oldAssets: assets.length, failures }));
if (failures.length) process.exitCode = 1;
