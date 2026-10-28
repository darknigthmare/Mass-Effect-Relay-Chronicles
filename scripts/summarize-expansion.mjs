import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const root = new URL('../', import.meta.url);
const bytes = path => readFile(new URL(path, root));
const sha = value => createHash('sha256').update(value).digest('hex');
const digest = async path => sha(await bytes(path));
const read = async name => JSON.parse(await bytes(`docs/qa/${name}.json`));
const proofs = {};
async function proof(name, predicate = report => report.passed === true) {
  const path = `docs/qa/${name}.json`, content = await bytes(path), report = JSON.parse(content);
  assert.ok(predicate(report), `Proof is not positive: ${path}`);
  proofs[name] = { path, bytes: content.length, sha256: sha(content) };
  return report;
}
async function verifySources(sourceHashes, overrides = {}) {
  for (const [path, expected] of Object.entries(sourceHashes)) {
    assert.equal(await digest(overrides[path] || path), expected, `Source mismatch: ${path}`);
  }
}
const native = await proof('expansion-native-report');
const unit = await proof('expansion-unit-report');
const build = await proof('expansion-build-report');
const review = await proof('expansion-source-review', report => report.sourceChecksPassed === true);
const finalUI = await proof('expansion-final-visual-report');
const visual = await proof('expansion-ui-visual-review');
const customization = await proof('expansion-customization-final-report');
const customizationIntegrity = await proof('expansion-customization-final-integrity');
const workbook = await proof('expansion-workbook-report');
const workbookVisual = await proof('expansion-workbook-visual-report');
const historicalDev = await proof('expansion-browser-report');
const historicalProduction = await proof('expansion-production-report');
const history = await read('expansion-browser-runner-history');
assert.equal(await digest(history.devReport.path), history.devReport.sha256);
assert.equal(await digest(history.snapshotPath), history.historicalRunnerSHA256);
assert.equal(await digest(history.currentRunner.path), history.currentRunner.sha256);
const archivedStyle = 'docs/qa/expansion-before-visual-fix-universe-ui.css';
for (const report of [native, unit, build]) await verifySources(report.sourceHashes);
await verifySources(Object.fromEntries(finalUI.sources.map(source => [source.path, source.sha256])));
await verifySources(Object.fromEntries(historicalDev.sources.map(source => [source.path, source.sha256])), {
  'src/universe-ui.css': archivedStyle, [history.originalPath]: history.snapshotPath,
});
await verifySources(Object.fromEntries(historicalProduction.sources.map(source => [source.path, source.sha256])), {
  'src/universe-ui.css': archivedStyle,
});
await verifySources(customizationIntegrity.sourceHashes, { 'src/universe-ui.css': archivedStyle });
for (const capture of [...historicalDev.captureArtifacts, ...historicalProduction.captureArtifacts, ...finalUI.captureArtifacts]) {
  assert.equal(await digest(capture.path), capture.sha256, `Capture mismatch: ${capture.path}`);
}
for (const [path, expected] of Object.entries(native.preserved)) assert.equal(await digest(path), expected);
for (const artifact of build.artifacts) assert.equal(await digest(artifact.path), artifact.sha256);
assert.equal(native.cards.length, 200); assert.equal(native.runnable, 145); assert.equal(native.consultationOnly, 55);
assert.equal(native.nativeTrials, 145); assert.equal(native.replayedTrials, 145);
assert.equal(native.registry.recordCount, 6708); assert.equal(native.registry.sourceCount, 454);
assert.equal(review.overlayCount, 200); assert.equal(review.overlayCountIsNotNewFacts, true);
assert.equal(unit.tests, 610); assert.equal(unit.failedTests, 0); assert.equal(unit.skippedTests, 0);
assert.equal(workbook.rows, 200); assert.equal(workbook.cellsCompared, 4200);
assert.equal(workbook.draft, false);
assert.equal(workbook.newCanonicalFacts, 0); assert.equal(workbook.historicalFilesUnchanged, true);
const workbookPath = 'docs/Expansion_Simulations_200.xlsx';
assert.equal(await digest(workbookPath), workbook.xlsxSha256);
assert.equal(workbookVisual.xlsxSha256, workbook.xlsxSha256);
assert.equal(workbookVisual.panelsActuallyOpened, 25);
for (const image of workbookVisual.images) {
  assert.equal(image.actuallyOpened, true);
  assert.equal(await digest(image.path), image.sha256);
}
for (const evidence of workbookVisual.proofs) assert.equal(await digest(evidence.path), evidence.sha256);
const report = {
  passed: true, generatedAt: new Date().toISOString(), baseline: '6182756578e50f44d668b3c0a2ac1561a8e0275e',
  scope: 'Five parallel batches of forty existing contextual references, presented in a new isolated study tab. 145 executable partial exercises and 55 consultation-only cards. No new canonical facts, complete missions, original-model mechanics, generated artwork or integral 1:1 certification.',
  groups: native.groups,
  registry: { records: 6708, sources: 454, mainRecords: 1382, additionalRecords: 5326,
    unchangedHistoricalStatuses: { Prototype: 629, 'Défini': 6073, 'Intégré': 3, 'Validé': 3 } },
  additions: { contextualStudyCards: 200, executablePartialTrials: 145, consultationOnly: 55,
    newEnemyIdentitiesInStudy: 40, executableEnemyStudies: 36,
    actorOccurrences: 40, distinctNamedPeopleInActorBatch: 36,
    existingArmorSetsInBatch: 25, previouslyClosedArmorReferencesInBatch: 15,
    reusedSpecialWeaponProfiles: 14, addedGenericMeleeStudies: 8,
    executableLogisticalStudies: 27, newCanonicalFacts: 0, newImages: 0,
    previouslyDefinedRecordsWithNewPartialStudy: native.previouslyDefinedWithNewStudy,
    historicalCatalogStatusPromotions: 0 },
  validation: { nodeTests: 610, nativeTrials: 145, exactReplays: 145,
    productionFunctionalChecksBeforeStyleCorrection: historicalProduction.checks.length,
    productionFunctionalTrialsBeforeStyleCorrection: historicalProduction.trials.length,
    finalStyleAndPublicUIChecks: finalUI.checks.length, finalDesktopAndMobileViews: finalUI.views.length,
    finalUICaptures: finalUI.captureArtifacts.length, customizationChecks: customization.checks.length,
    compiledModules: build.modules, compiledJavaScriptBundles: build.compiledJavaScriptBundles,
    compiledPNG: build.pngFiles, protectedHistoricalFiles: Object.keys(native.preserved).length,
    workbookComparedCells: workbook.cellsCompared, independentlyReviewedUI: visual.reviewCounts,
    workbookVisualEvidence: { passed: workbookVisual.passed, panelsActuallyOpened: 25, reportPath: 'docs/qa/expansion-workbook-visual-report.json' } },
  workbook: { path: workbookPath, sha256: workbook.xlsxSha256, rows: 200, sheets: 5,
    simulationProductionStatuses: { Prototype: 145, 'Défini': 55 },
    originalCatalogStatusesSeparate: true },
  historicalProofScope: { archivedStylesheet: archivedStyle,
    runnerHistory: 'docs/qa/expansion-browser-runner-history.json',
    explanation: 'The full functional browser and customization runs precede the final CSS-only correction. Their exact stylesheet and development runner are preserved. All eleven other application JS/data files remain exact; final native, Node, build and targeted public UI/style evidence uses the current stylesheet.' },
  limitations: ['ATB values and logistical budgets are adaptation parameters, not extracted original statistics.',
    'Civilian roles, unverified weapon mechanisms, unresolved vehicles and unprepared DLC remain closed.',
    'No recruitment, inventory, save, reward, loyalty, survival or narrative decision is transferred.',
    'Ship and vehicle studies do not provide flight, driving, source geometry or original combat.',
    'Animations, sounds, original equipment effects, boss phases and integral 1:1 art remain incomplete.'],
  proofs,
};
await writeFile(new URL('docs/qa/expansion-report.json', root), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: true, proofs: Object.keys(proofs).length, cards: 200, executable: 145, consultationOnly: 55,
  nodeTests: unit.tests, workbookCells: workbook.cellsCompared, protectedFiles: Object.keys(native.preserved).length }));
