// Read-only comparison with the frozen pre-immersion commit. Only this new report is written.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, readdir, readlink, writeFile } from 'node:fs/promises';
import { isDeepStrictEqual } from 'node:util';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const baselineCommit = '533efaa2ca88c34be21eb53aa30fafcfedd79707';
const reportPath = 'docs/qa/eden-immersion-native-report.json';
if (process.argv.length !== 2) throw new Error('This read-only audit accepts no arguments.');
// Reviewed tracked-file scope, deliberately independent of the current git diff.
const mutableFiles = [
  'README.md', 'docs/ASSETS.md', 'docs/FIDELITY.md', 'docs/IMPLEMENTATION_STATUS.md',
  'docs/Mass_Effect_Relay_Chronicles_Production.xlsx', 'docs/content-catalog.json',
  'public/assets/manifest.json', 'src/enemy-animation-data.js', 'src/local-map.css',
  'src/local-map.js', 'src/main.js', 'src/universe-data.js', 'src/world-data.js',
  'src/world.js', 'tests/me1-enemy-poses.test.js', 'vite.config.js',
].sort();
const targetIds = [
  'WRL-eden-prime', 'SCN-eden-prime-agriculture', 'SCN-eden-prime-fumee',
  'SCN-eden-prime-quais', 'SPR-guerrier-krogan-ennemi', 'SPR-rachni-soldat-ennemi',
  'SYS-carte-locale', 'SYS-transitions-de-camera',
].sort();
const promotedIds = targetIds.filter(id => /^(SCN|SPR)-/.test(id));
const coverageKeys = [
  'animationLimit', 'atlases', 'chronicles', 'combatKeyPoseCount',
  'companionCombatPoseCount', 'coverageLimit', 'enemyCombatPoseCount',
  'maleCombatPoseCount', 'nativePNGCount', 'seatedDrawingCount',
  'terrainTextureCount', 'visualLimit',
].sort();
const addedPNG = ['eden-ground-dirt.png', 'eden-ground-grass.png',
  'enemy-krogan-combat.png', 'enemy-rachni-combat.png'].map(file => `public/assets/${file}`).sort();
const git = (...args) => execFileSync('git', args, { cwd: root, maxBuffer: 64 * 1024 * 1024 });
const oldBytes = filename => git('show', `${baselineCommit}:${filename}`);
const bytes = filename => readFile(path.join(root, filename));
const sha256 = value => createHash('sha256').update(value).digest('hex');
const blobHash = value => createHash('sha1').update(`blob ${value.length}\0`).update(value).digest('hex');
const omit = (value, keys) => Object.fromEntries(Object.entries(value).filter(([key]) => !keys.includes(key)));
const changedKeys = (a, b) => [...new Set([...Object.keys(a), ...Object.keys(b)])]
  .filter(key => !isDeepStrictEqual(a[key], b[key])).sort();
const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); return Boolean(condition); };
const report = {
  version: 1, generatedAt: new Date().toISOString(), passed: false, baselineCommit,
  scope: 'Independent native-byte and structured-data audit of the Eden immersion lot. No checkout, source, old report, index, build, game save, commit or remote mutation. Only this new JSON report is written.',
  reproduction: { script: 'scripts/audit-eden-immersion.mjs', command: 'node scripts/audit-eden-immersion.mjs',
    scriptSha256: sha256(await readFile(fileURLToPath(import.meta.url))) },
  sourceHashes: {},
};

try {
  const tree = git('ls-tree', '-r', '-z', baselineCommit).toString('utf8').split('\0').filter(Boolean)
    .map(record => {
      const match = /^(\d+) (\S+) ([a-f0-9]+)\t([\s\S]+)$/.exec(record);
      if (!match) throw new Error('Unrecognized ls-tree record.');
      return { mode: match[1], kind: match[2], baselineBlob: match[3], path: match[4] };
    });
  check(tree.every(item => item.kind === 'blob'), 'Baseline contains a non-blob leaf requiring explicit audit support.');
  const baselinePaths = new Set(tree.map(item => item.path));
  check(mutableFiles.length === 16 && mutableFiles.every(filename => baselinePaths.has(filename)), 'The explicit sixteen-file mutation scope does not match baseline files.');
  const actualChanged = git('diff', '--name-only', '-z', baselineCommit).toString('utf8').split('\0').filter(Boolean).sort();
  check(isDeepStrictEqual(actualChanged, mutableFiles), 'Tracked changes differ from the reviewed sixteen-file mutation scope.');
  const mutableSet = new Set(mutableFiles), protectedBlobs = [];
  for (const item of tree.filter(item => !mutableSet.has(item.path))) {
    try {
      const raw = item.mode === '120000' ? Buffer.from(await readlink(path.join(root, item.path))) : await bytes(item.path);
      const currentBlob = blobHash(raw), preserved = currentBlob === item.baselineBlob;
      check(preserved, `Protected baseline blob changed: ${item.path}`);
      protectedBlobs.push({ path: item.path, baselineBlob: item.baselineBlob, currentBlob,
        sha256: sha256(raw), bytes: raw.length, passed: preserved });
    } catch (error) { check(false, `Cannot read protected baseline blob ${item.path}: ${error.message}`); }
  }
  report.protectedBlobs = protectedBlobs;
  const protectedByPath = new Map(protectedBlobs.map(item => [item.path, item]));
  const gameplayModules = tree.filter(item => /^src\/(?:state|combat(?:-[^/]+)?|game-data|story(?:-data)?|loadout(?:-ui)?|universe-equipment(?:-scenarios)?|chronicles|chronicle-story)\.js$/.test(item.path))
    .map(item => ({ path: item.path, baselineBlob: item.baselineBlob, sha256: protectedByPath.get(item.path)?.sha256,
      passed: protectedByPath.get(item.path)?.passed === true }));
  check(gameplayModules.length >= 12 && gameplayModules.every(item => item.passed), 'A save, combat, game, story or equipment module is not byte-preserved.');
  report.preserved = { baselineFiles: tree.length, explicitMutableFiles: mutableFiles,
    actualChangedTrackedFiles: actualChanged, protectedFiles: tree.length - mutableFiles.length,
    protectedUnchanged: protectedBlobs.filter(item => item.passed).length,
    protectedBaselineReports: protectedBlobs.filter(item => /^docs\/(?:qa|universe\/qa)\//.test(item.path)).length,
    gameplayModules };

  const catalogPath = 'docs/content-catalog.json';
  const before = JSON.parse(oldBytes(catalogPath)), after = JSON.parse(await bytes(catalogPath));
  check(before.entries.length === 1382 && after.entries.length === 1382, 'Main catalogue must retain 1382 entries.');
  check(isDeepStrictEqual(before.entries.map(item => item.id), after.entries.map(item => item.id)), 'Catalogue identity or order changed.');
  check(new Set(after.entries.map(item => item.id)).size === 1382, 'Catalogue IDs are not unique.');
  check(isDeepStrictEqual(omit(before, ['entries', 'meta']), omit(after, ['entries', 'meta'])), 'Catalogue sources, categories or other protected top-level content changed.');
  const currentEntries = new Map(after.entries.map(item => [item.id, item]));
  const changedEntries = before.entries.filter(item => !isDeepStrictEqual(item, currentEntries.get(item.id)));
  check(isDeepStrictEqual(changedEntries.map(item => item.id).sort(), targetIds), 'Changes are not limited to the eight reviewed main-catalogue IDs.');
  const productionFields = ['status', 'assetStatus', 'description', 'acceptance', 'assetPath', 'gameKey', 'notes', 'implementationPaths', 'evidence'];
  const entryChanges = changedEntries.map(item => {
    const current = currentEntries.get(item.id), fields = changedKeys(item, current);
    check(fields.every(field => productionFields.includes(field)), `Canonical or identity fields changed on ${item.id}.`);
    return { id: item.id, fields };
  });
  const promotions = field => before.entries.filter(item => item[field] !== currentEntries.get(item.id)?.[field])
    .map(item => ({ id: item.id, from: item[field], to: currentEntries.get(item.id)?.[field] }));
  const statusPromotions = promotions('status'), assetStatusPromotions = promotions('assetStatus');
  for (const [label, items, previousStatus] of [['content', statusPromotions, 'Défini'], ['asset', assetStatusPromotions, 'À produire']]) {
    check(items.length === 5 && isDeepStrictEqual(items.map(item => item.id).sort(), promotedIds)
      && items.every(item => item.from === previousStatus && item.to === 'Prototype'), `Unexpected ${label} status transition.`);
  }
  const highPromotions = [...statusPromotions, ...assetStatusPromotions].filter(item => ['Intégré', 'Validé'].includes(item.to));
  check(highPromotions.length === 0, 'Integrated or Validated promotion is outside this lot.');
  check(isDeepStrictEqual(omit(before.meta, ['prototypeCoverage']), omit(after.meta, ['prototypeCoverage'])), 'Metadata outside prototypeCoverage changed.');
  const actualCoverageKeys = changedKeys(before.meta.prototypeCoverage, after.meta.prototypeCoverage);
  check(isDeepStrictEqual(actualCoverageKeys, coverageKeys), 'prototypeCoverage changes exceed the twelve reviewed keys.');
  const coveragePath = 'docs/qa/eden-immersion-coverage-sync.json', coverage = JSON.parse(await bytes(coveragePath));
  check(coverage.passed && coverage.baselineCommit === baselineCommit && isDeepStrictEqual(coverage.changedKeys, coverageKeys), 'Coverage synchronization proof does not match the frozen scope.');
  check(coverage.catalogueBeforeSha256 === sha256(oldBytes(catalogPath)) && coverage.catalogueAfterSha256 === sha256(await bytes(catalogPath)), 'Coverage synchronization proof does not bind the actual catalogue bytes.');
  for (const patch of coverage.patch) {
    const key = patch.path.replace(/^meta\.prototypeCoverage\./, '');
    check(coverageKeys.includes(key) && isDeepStrictEqual(patch.before, before.meta.prototypeCoverage[key] ?? null)
      && isDeepStrictEqual(patch.after, after.meta.prototypeCoverage[key]), `Coverage proof patch mismatch: ${key}`);
  }
  check(coverage.patch.length === 12, 'Coverage proof must record twelve explicit patches.');
  report.catalog = { entries: after.entries.length, targetIds, changedIds: entryChanges.map(item => item.id).sort(),
    unchangedEntries: before.entries.length - changedEntries.length, entryChanges, statusPromotions,
    assetStatusPromotions, integratedOrValidatedPromotions: highPromotions.length,
    prototypeCoverageChangedKeys: actualCoverageKeys, otherMetadataPreserved: true, sourcesAndCategoriesPreserved: true };

  const oldPNG = tree.filter(item => /^public\/assets\/.*\.png$/.test(item.path)).map(item => item.path).sort();
  const currentPNG = (await readdir(path.join(root, 'public/assets'))).filter(file => file.endsWith('.png')).map(file => `public/assets/${file}`).sort();
  check(oldPNG.length === 27 && currentPNG.length === 31, 'Expected 27 retained and 31 current public PNGs.');
  check(oldPNG.every(filename => protectedByPath.get(filename)?.passed), 'An old public PNG is missing or changed.');
  check(isDeepStrictEqual(currentPNG.filter(filename => !oldPNG.includes(filename)), addedPNG), 'Unexpected new public PNG scope.');
  const headers = [];
  for (const filename of currentPNG) {
    const raw = await bytes(filename), valid = raw.length >= 33 && raw.subarray(0, 8).toString('hex') === '89504e470d0a1a0a'
      && raw.readUInt32BE(8) === 13 && raw.subarray(12, 16).toString() === 'IHDR';
    check(valid, `Invalid PNG signature or native IHDR: ${filename}`);
    const width = valid ? raw.readUInt32BE(16) : null, height = valid ? raw.readUInt32BE(20) : null;
    const mode = valid ? ({ 0: 'L', 2: 'RGB', 3: 'P', 4: 'LA', 6: 'RGBA' })[raw[25]] : null;
    check(width > 0 && height > 0 && mode && raw[24] === 8, `Unexpected PNG native dimensions/mode/depth: ${filename}`);
    headers.push({ path: filename, width, height, mode, bitDepth: raw[24], sha256: sha256(raw), bytes: raw.length });
  }
  const headerByPath = new Map(headers.map(item => [item.path, item]));
  const manifestPath = 'public/assets/manifest.json', oldManifest = JSON.parse(oldBytes(manifestPath)), manifest = JSON.parse(await bytes(manifestPath));
  const assetByFile = new Map(manifest.assets.map(item => [item.file, item]));
  check(oldManifest.assets.length === 22 && manifest.assets.length === 26 && assetByFile.size === 26, 'Expected 22 retained and 26 current core manifest assets.');
  check(oldManifest.assets.every(item => isDeepStrictEqual(item, assetByFile.get(item.file))), 'A historical core manifest declaration changed.');
  for (const item of manifest.assets) {
    const header = headerByPath.get(`public/assets/${item.file}`);
    check(header && item.sha256 === header.sha256 && item.width === header.width && item.height === header.height && item.mode === header.mode,
      `Manifest does not match native PNG bytes/header: ${item.file}`);
    for (const region of (item.regions ?? []).filter(region => region.rect)) {
      const [x, y, width, height] = region.rect;
      check([x, y, width, height].every(Number.isInteger) && x >= 0 && y >= 0 && width > 0 && height > 0
        && x + width <= item.width && y + height <= item.height, `Manifest region out of PNG bounds: ${item.file}`);
    }
  }
  const regionCount = regex => manifest.assets.filter(item => regex.test(item.file)).reduce((sum, item) => sum + item.regions.length, 0);
  const nativeCounts = { combatKeyPoses: regionCount(/combat.*\.png$/), enemyCombatKeyPoses: regionCount(/^enemy-.*-combat\.png$/),
    seatedKeyPoses: regionCount(/^joker-seated\.png$/), terrainTextureCount: manifest.assets.filter(item => /^eden-ground-.*\.png$/.test(item.file)).length };
  check(isDeepStrictEqual(nativeCounts, { combatKeyPoses: 56, enemyCombatKeyPoses: 24, seatedKeyPoses: 2, terrainTextureCount: 2 }), 'Actual manifest regions do not yield 56 combat / 24 enemy / 2 seated / 2 terrain.');
  for (const [key, value] of Object.entries(nativeCounts)) check(manifest[key] === value, `Manifest aggregate mismatch: ${key}`);
  const nativePairs = [];
  for (const character of ['krogan', 'rachni']) {
    const configPath = `public/assets/enemy-${character}-animation.json`, config = JSON.parse(await bytes(configPath));
    const declaration = assetByFile.get(`enemy-${character}-combat.png`), frames = config.combat.frames;
    check(config.version === 1 && config.characterId === character && config.mediaId === 'ME1' && config.periodId === 'me1'
      && config.status === 'Prototype' && config.combat.file === declaration.file, `New enemy identity/media/config mismatch: ${character}`);
    check(isDeepStrictEqual(Object.keys(frames).sort(), ['aim', 'down', 'hit', 'power']), `New enemy requires four fixed poses: ${character}`);
    check(isDeepStrictEqual(Object.values(frames), declaration.regions), `Manifest/config native rectangles or pivots differ: ${character}`);
    for (const frame of Object.values(frames)) check(frame.pivot.length === 2 && frame.pivot.every(Number.isFinite)
      && frame.pivot[0] >= 0 && frame.pivot[0] <= frame.rect[2] && frame.pivot[1] >= 0 && frame.pivot[1] <= frame.rect[3]
      && Number.isFinite(frame.heightScale) && frame.heightScale > 0, `Invalid native pivot or scale: ${character}`);
    nativePairs.push({ character, configPath, pngPath: `public/assets/${declaration.file}`,
      configSha256: sha256(await bytes(configPath)), pngSha256: declaration.sha256, poses: Object.keys(frames), passed: true });
  }
  report.art = { nativePNGCount: currentPNG.length, coreAssets: manifest.assets.length,
    oldPNGUnchanged: oldPNG.length, oldCoreManifestAssetsUnchanged: oldManifest.assets.length,
    newPNG: addedPNG, ...nativeCounts, nativePairs, headers,
    preservedUndrawnReservations: oldManifest.assets.flatMap(item => (item.regions ?? []).filter(region => !region.rect)
      .map(region => ({ file: item.file, ...region }))),
    limitation: 'Native PNG signatures, IHDR, byte hashes and declared rectangles are checked; this audit does not itself render pixels or certify likeness.' };
  Object.assign(report.preserved, { baselinePNG: oldPNG.length, currentPNG: currentPNG.length, oldCoreManifestAssets: oldManifest.assets.length });

  // The old world-data module has no relative imports; load its exact object directly from Git bytes.
  const oldWorld = await import(`data:text/javascript;base64,${oldBytes('src/world-data.js').toString('base64')}`);
  const { WORLD_ZONES } = await import(pathToFileURL(path.join(root, 'src/world-data.js')));
  const { EDEN_LAYOUT, isLevelGround } = await import(pathToFileURL(path.join(root, 'src/level-layout-data.js')));
  const zoneIds = Object.keys(oldWorld.WORLD_ZONES);
  check(zoneIds.length === 9 && isDeepStrictEqual(zoneIds, Object.keys(WORLD_ZONES)), 'World zone IDs/order changed.');
  const otherZones = zoneIds.filter(id => id !== 'eden-prime');
  check(otherZones.length === 8 && otherZones.every(id => isDeepStrictEqual(oldWorld.WORLD_ZONES[id], WORLD_ZONES[id])), 'A world zone outside Eden Prime changed.');
  const oldEden = oldWorld.WORLD_ZONES['eden-prime'], eden = WORLD_ZONES['eden-prime'];
  const poiIds = oldEden.pois.map(poi => poi.id);
  check(poiIds.length === 7 && isDeepStrictEqual(poiIds, eden.pois.map(poi => poi.id)), 'Eden must retain all seven POI identities/order.');
  check(oldEden.pois.every((poi, index) => isDeepStrictEqual(omit(poi, ['x', 'z']), omit(eden.pois[index], ['x', 'z']))), 'An Eden POI label, type, target or progression field changed.');
  check(eden.pois.every(poi => isLevelGround(EDEN_LAYOUT, poi.x, poi.z)), 'An Eden objective is outside native ground.');
  check(EDEN_LAYOUT.rooms.length === 5 && EDEN_LAYOUT.landmarks.length === 9, 'Expected five production sectors and nine production landmarks.');
  const width = eden.bounds.maxX - eden.bounds.minX, depth = eden.bounds.maxZ - eden.bounds.minZ;
  check(width === 110 && depth === 150, 'Eden envelope is not 110 by 150.');
  report.geometry = { zones: zoneIds.length, unchangedOtherZones: otherZones, edenPOIIds: poiIds,
    edenPOISemanticsPreserved: true, rooms: EDEN_LAYOUT.rooms.length, landmarks: EDEN_LAYOUT.landmarks.length,
    paths: EDEN_LAYOUT.paths.length, arenas: Object.keys(EDEN_LAYOUT.arenas).length,
    bounds: eden.bounds, width, depth, envelopeArea: width * depth,
    groundArea: { measuredHere: false, definition: 'Union of five room polygons and three rounded path strips; envelope area is not the walkable surface area. Scenery adds independent collision exclusions.' },
    limitation: 'The authored route condenses documented stages. This audit does not certify original geography or nine complete canonical sublevels.' };

  const { UNIVERSE_EQUIPMENT } = await import(pathToFileURL(path.join(root, 'src/universe-equipment.js')));
  const supported = UNIVERSE_EQUIPMENT.filter(item => item.runtimeSupported), weapons = supported.filter(item => item.kind === 'weapon');
  check(UNIVERSE_EQUIPMENT.length === 224 && supported.length === 107 && weapons.length === 79, 'Inherited equipment must remain 224 documentary / 107 supported / 79 supported weapons.');
  check(protectedByPath.get('src/universe-equipment.js')?.passed && protectedByPath.get('src/universe-equipment-scenarios.js')?.passed, 'Equipment implementation changed.');
  report.inheritedEquipment = { total: UNIVERSE_EQUIPMENT.length, supported: supported.length, weapons: weapons.length,
    unchangedModule: true, newEquipmentInThisLot: 0,
    qualification: 'Current runtime counts are checked; equipment implementation bytes are identical to baseline. This lot synchronizes stale coverage metadata, without adding equipment.' };

  const nativePublicPath = 'docs/qa/eden-immersion-workbook-public-preservation.json';
  const nativePublic = JSON.parse(await bytes(nativePublicPath));
  const visualPath = 'docs/qa/eden-immersion-workbook-visual-report.json', visual = JSON.parse(await bytes(visualPath));
  const workbookPath = 'docs/Mass_Effect_Relay_Chronicles_Production.xlsx', workbookHash = sha256(await bytes(workbookPath));
  check(nativePublic.ok === true && nativePublic.errors.length === 0 && nativePublic.sha256 === workbookHash, 'Final public Open XML proof does not bind the delivered workbook.');
  check(visual.passed === true && visual.baselineCommit === baselineCommit && visual.deliveries[workbookPath] === workbookHash,
    'Final workbook visual proof does not bind the delivered workbook.');
  check(nativePublic.catalogueEntries === 1382 && nativePublic.unchangedEntries === 1374
    && isDeepStrictEqual([...nativePublic.changedIds].sort(), targetIds), 'Final workbook proof has a different catalogue scope.');
  check(nativePublic.statusPromotions === 5 && nativePublic.assetStatusPromotions === 5 && visual.integratedOrValidatedPromotions === 0,
    'Final workbook proof has unexpected status promotions.');
  check(isDeepStrictEqual(nativePublic.nativeChecks, visual.nativeChecks), 'Workbook native and visual proofs disagree about preserved structures.');
  for (const [filename, digest] of Object.entries(visual.deliveries)) check(sha256(await bytes(filename)) === digest, `Final workbook delivery hash mismatch: ${filename}`);
  for (const [filename, digest] of Object.entries(visual.artifactDigests)) check(sha256(await bytes(filename)) === digest, `Final workbook evidence hash mismatch: ${filename}`);
  check(visual.actualVisualReview.actuallyOpenedImages === 35 && visual.actualVisualReview.rowPanels === 32
    && visual.actualVisualReview.dashboardPanels === 3, 'Final visual review lacks the declared 35 panels.');
  const expectedStructures = { sheets: 28, tables: 26, formulas: 274, dataValidations: 130, conditionalRules: 130, catalogueCells: 23494, xmlParts: 87 };
  for (const [key, value] of Object.entries(expectedStructures)) check(nativePublic.nativeChecks[key] === value, `Unexpected final workbook structure count: ${key}`);
  report.workbook = { nativePublicProof: { path: nativePublicPath, sha256: sha256(await bytes(nativePublicPath)), passed: nativePublic.ok },
    visualProof: { path: visualPath, sha256: sha256(await bytes(visualPath)), passed: visual.passed },
    deliveries: visual.deliveries, nativeChecks: nativePublic.nativeChecks,
    changedWorkbookCells: nativePublic.changedWorkbookCells, actualVisualReview: visual.actualVisualReview,
    limits: visual.limits,
    qualification: 'This audit independently binds final repository files to the completed Open XML and 35-panel visual proofs. It does not rerun Microsoft Excel or claim to have reopened those images.' };

  const relevantInputs = [...new Set([...mutableFiles, 'src/level-layout-data.js', 'src/eden-scene.js', 'src/world-navigation.js',
    'src/level-map-render.js', coveragePath, nativePublicPath, visualPath,
    'docs/qa/eden-immersion-sprites-report.json', 'docs/qa/eden-immersion-world-report.json',
    ...addedPNG, ...nativePairs.map(item => item.configPath), 'scripts/audit-eden-immersion.mjs'])].sort();
  for (const filename of relevantInputs) {
    report.sourceHashes[filename] = sha256(await bytes(filename));
  }
  report.limitations = [
    'A read-only native/data comparison, not an additional browser run or a claim of a played campaign. Dedicated navigation, sprite and production browser evidence remain separate.',
    'Generated images are prototypes. Eight additional enemy drawings are fixed poses for existing ME1 families; anatomy, exact equipment, complete animation and original likeness remain unvalidated 1:1.',
    'Eden is an authored spatial adaptation with five sectors and nine production landmarks. Its 110 by 150 envelope does not measure walkable area or certify original geography.',
    'Workbook evidence covers 35 inspected panels plus Open XML structures. Microsoft Excel was not run; the exporter adds 130 unused differential style definitions while preserving 130 effective conditional rules.',
    'The 107 supported equipment items and 79 weapons are inherited. No new equipment, canonical fact, encounter behavior or Integrated/Validated status is attributed to this lot.',
  ];
  const initialAttemptPath = 'docs/qa/eden-immersion-native-initial-failed-report.json';
  const initialAttempt = await bytes(initialAttemptPath);
  report.auditHistory = { initialAttempt: { path: initialAttemptPath, sha256: sha256(initialAttempt), passed: false,
    reason: 'The initial auditor incorrectly expected asset statuses to use the content label Défini and tried to destructure two historical undrawn vehicle reservations. Only the new auditor was corrected; its failed result is retained byte-for-byte.' } };
} catch (error) {
  failures.push(`Fatal native audit error: ${error.stack || error.message}`);
}

report.failures = failures;
report.passed = failures.length === 0;
await writeFile(path.join(root, reportPath), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ passed: report.passed, report: reportPath, sha256: sha256(await bytes(reportPath)),
  protectedUnchanged: report.preserved?.protectedUnchanged, catalogEntries: report.catalog?.entries,
  failures }, null, 2));
if (!report.passed) process.exitCode = 1;
