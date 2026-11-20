import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { EDITORIAL_WORKS } from './p0-editorial-audit.mjs';

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const auditPath = 'docs/qa/p0-editorial-audit-report.json';
const browserPath = 'docs/qa/p0-editorial-browser-report.json';
const auditBytes = await readFile(auditPath);
const browserBytes = await readFile(browserPath);
const audit = JSON.parse(auditBytes);
const browser = JSON.parse(browserBytes);
assert.equal(audit.passed, true);
assert.equal(browser.passed, true);
assert.deepEqual(audit.works.map(work => work.id), EDITORIAL_WORKS);
assert.deepEqual(browser.errors, []);
assert.equal(sha256(await readFile('scripts/p0-editorial-audit.mjs')), audit.sourceSha256);
assert.equal(sha256(await readFile('scripts/p0-editorial-browser.mjs')), browser.collectorSha256);
for (const [filename, expected] of Object.entries(browser.sourceSha256)) assert.equal(sha256(await readFile(filename)), expected);
for (const image of browser.captures) assert.equal(sha256(await readFile(image.path)), image.sha256);

const checks = [];
for (const work of audit.works) {
  const source = await readFile(work.file);
  assert.equal(sha256(source), work.sha256);
  const catalogue = JSON.parse(source);
  const record = catalogue.entries.find(entry => entry.id === work.criterionId);
  assert.equal(record.priority, 'P0');
  assert.equal(record.description, 'Contrôle éditorial du catalogue de production.');
  assert.equal(record.acceptance, work.exactCriterion);
  assert.deepEqual(work.findings, []);
  assert.equal(work.entries, catalogue.entries.length);
  assert.deepEqual(work.references.map(ref => ref.id), catalogue.sources.map(ref => ref.id));
  assert.ok(work.references.every(ref => ref.declaredLimit && ref.limit));

  const dialogueRows = catalogue.entries.filter(entry => entry.category === 'dialogues');
  for (const row of dialogueRows) assert.equal(row.nature, 'Extrapolation');
  const observed = browser.checks.find(check => check.criterionId === record.id);
  assert.equal(observed.individualReferenceAbsent, true);
  assert.equal(observed.workLimitsVisible, true);
  assert.equal(observed.workReferencesAccessibleByKeyboard, true);
  assert.equal(observed.workSourceCount, catalogue.sources.length);
  checks.push({ id: record.id, passed: true, exactDescription: record.description, exactCriterion: record.acceptance,
    entriesReviewed: work.entries, dialogueRows: dialogueRows.length, sourceRecords: work.references.length,
    longestMetadataFieldWords: work.longestField.words });
}
const report = {
  passed: true,
  at: new Date().toISOString(),
  inputs: [{ path: auditPath, sha256: sha256(auditBytes) }, { path: browserPath, sha256: sha256(browserBytes) }],
  checks,
  scope: 'Métadonnées éditoriales, attribution des textes courts et visibilité des limites dans le catalogue de production. Les éditions intégrales restent hors de la vérification et les limitations HTTP sont tracées pour chaque adresse.',
};
const output = process.argv[2] || 'docs/qa/p0-editorial-criteria.json';
await writeFile(output, `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify({ passed: true, checks: checks.length, output }));
