import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const root = new URL('../', import.meta.url), bytes = path => readFile(new URL(path, root));
const hash = data => createHash('sha256').update(data).digest('hex');
const digest = async path => hash(await bytes(path));
const proofs = {};
async function proof(name, predicate = report => report.passed === true) {
  const path = `docs/qa/${name}.json`, raw = await bytes(path), report = JSON.parse(raw);
  assert.ok(predicate(report), `Proof is not positive: ${path}`);
  proofs[name] = { path, bytes: raw.length, sha256: hash(raw) }; return report;
}
async function sources(values) {
  const entries = Array.isArray(values) ? values.map(item => [item.path, item.sha256]) : Object.entries(values);
  for (const [path, expected] of entries) assert.equal(await digest(path), expected, `Source mismatch: ${path}`);
}
const native = await proof('expansion2-native-report'), unit = await proof('expansion2-unit-report');
const build = await proof('expansion2-build-report');
const sourceReview = await proof('expansion2-source-review', report => report.sourceChecksPassed === true);
const browser = await proof('expansion2-browser-report'), production = await proof('expansion2-production-report');
const visual = await proof('expansion2-ui-visual-review');
const workbook = await proof('expansion2-workbook-report'), workbookVisual = await proof('expansion2-workbook-visual-report');
for (const report of [native, unit, build]) await sources(report.sourceHashes);
for (const report of [browser, production]) {
  await sources(report.sources);
  for (const capture of report.captureArtifacts) assert.equal(await digest(capture.path), capture.sha256);
}
for (const [path, expected] of Object.entries(native.preserved)) assert.equal(await digest(path), expected);
for (const artifact of build.artifacts) assert.equal(await digest(artifact.path), artifact.sha256);
assert.equal(native.cards.length, 176); assert.equal(native.nativeTrials, 97); assert.equal(native.replayedTrials, 97);
assert.equal(native.consultationOnly, 79); assert.equal(native.previouslyDefinedWithNewStudy, 52);
assert.equal(native.previousTrialReplays.length, 145); assert.ok(native.previousTrialReplays.every(result => result.exact));
assert.equal(sourceReview.overlayCount, 176); assert.equal(sourceReview.lot1Overlap, 0);
assert.equal(unit.tests, 665); assert.equal(unit.failedTests, 0); assert.equal(unit.skippedTests, 0);
assert.equal(workbook.rows, 176); assert.equal(workbook.cellsCompared, 3696); assert.equal(workbook.draft, false);
assert.equal(workbook.newCanonicalFacts, 0); assert.equal(workbook.historicalFilesUnchanged, true);
assert.equal(workbookVisual.workbook.sha256, workbook.xlsxSha256);
assert.equal(workbookVisual.panelsActuallyOpened, 25); assert.equal(workbookVisual.images.length, 25);
const workbookPath = 'docs/Expansion2_Simulations.xlsx'; assert.equal(await digest(workbookPath), workbook.xlsxSha256);
for (const image of workbookVisual.images) {
  assert.equal(image.actuallyOpened, true); assert.equal(await digest(image.path), image.sha256);
}
for (const evidence of workbookVisual.currentProofs) assert.equal(await digest(evidence.path), evidence.sha256);
for (const [path, expected] of Object.entries(workbookVisual.artifactDigests)) assert.equal(await digest(path), expected);
const report = {
  passed: true, generatedAt: new Date().toISOString(), baseline: native.baseline,
  scope: 'A second disjoint study selection uses actual available source stock: 176 contextual dossiers, 97 executable partial exercises and 79 consultations. First-lot profiles, production files and 145 native outcomes remain unchanged. This is not 200 new facts, forty new armors, forty pilotable hulls or integral 1:1 reconstruction.',
  groups: native.groups,
  additions: { references: 176, executable: 97, consultationOnly: 79, actorOccurrences: 40,
    namedActorOccurrences: 33, apexArchetypes: 7, equipmentReferences: 30, actualEquipmentBenches: 9,
    namedArmorSetsAdded: 0, conventionalWeaponDossiers: 40, newOriginalWeaponMechanicsCertified: 0,
    fleetDossiers: 26, logisticalStudies: 2, newTransportIdentitiesInSelection: 1,
    enemyDossiers: 40, executableEnemySamples: 34, newCanonicalFacts: 0, newImages: 0,
    previouslyDefinedWithNewPartialStudy: 52, historicalStatusPromotions: 0 },
  cumulative: { studyReferences: 376, executablePartialExercises: 242, consultations: 134,
    originalRegistryRecords: 6708, originalRegistrySources: 454,
    unchangedHistoricalStatuses: { Prototype: 629, 'Défini': 6073, 'Intégré': 3, 'Validé': 3 } },
  validation: { nodeTests: 665, nativeNewTrials: 97, exactNewReplays: 97, exactPriorOutcomeComparisons: 145,
    protectedHistoricalFiles: Object.keys(native.preserved).length,
    developmentChecks: browser.checks.length, developmentTrials: browser.trials.length,
    productionChecks: production.checks.length, productionTrials: production.trials.length,
    productionServedJavaScript: production.servedBundles.length,
    productionServedPNG: production.servedPNGs.length, productionCaptures: production.captureArtifacts.length,
    finalVisualReview: { path: 'docs/qa/expansion2-ui-visual-review.json', passed: visual.passed },
    compiledModules: build.modules, compiledJavaScript: build.compiledJavaScriptBundles, compiledPNG: build.pngFiles,
    workbookComparedCells: workbook.cellsCompared, workbookVisual: 'docs/qa/expansion2-workbook-visual-report.json' },
  workbook: { path: workbookPath, sha256: workbook.xlsxSha256, rows: 176, sheets: 5,
    simulationStatuses: { Prototype: 97, 'Défini': 79 }, originalCatalogStatusesSeparate: true },
  limitations: ['All statistical and resource fixtures are ATB adaptations, not extracted original numerical tables.',
    'Civilian, unresolved equipment, special boss phases and unprepared packs remain closed.',
    'APEX archetypes stay in mea-apex; Hyperion occurrence stays in mea-prologue; Legendary does not supply original ME3 multiplayer.',
    'No source character receives the abstract test carrier powers, gear, inventory, recruitment or rewards.',
    'The generic native strike retains its legacy Assaut organique log label for the synthetic Creeper; metadata and mechanics remain synthetic with this partial-label limitation disclosed in the profile.',
    'Original models, source-specific animations, sounds, weapon effects, ship navigation and boss phases remain incomplete.'],
  proofs,
};
await writeFile(new URL('docs/qa/expansion2-report.json', root), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: true, proofs: Object.keys(proofs).length, cards: 176, executable: 97,
  cumulativeCards: 376, nodeTests: unit.tests, workbookCells: workbook.cellsCompared,
  previousOutcomesIdentical: native.previousTrialReplays.length, protectedFiles: Object.keys(native.preserved).length }));
