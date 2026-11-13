// Reuse and independently check the existing exact ledger; store only its delta.
// A new lot must not duplicate another multi-megabyte inventory of unchanged rows.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { ROOT, fresh, sha, counts } from './completion-tracking-common.mjs';
const options = {}, args = process.argv.slice(2);
for (let index = 0; index < args.length; index += 2) {
  assert.ok(['--baseline', '--output', '--input-mode', '--reference-ledger'].includes(args[index]));
  assert.ok(args[index + 1]); options[args[index].slice(2)] = args[index + 1];
}
assert.ok(options.baseline && options.output && options['reference-ledger']);
const output = path.resolve(ROOT, options.output); await fresh(output);
const baselineRaw = await fs.readFile(path.resolve(ROOT, options.baseline)), baseline = JSON.parse(baselineRaw);
assert.equal(baseline.passed, true);
const inputMode = options['input-mode'] || 'baseline'; assert.ok(['baseline', 'current'].includes(inputMode));
const referenceRaw = await fs.readFile(path.resolve(ROOT, options['reference-ledger'])), reference = JSON.parse(referenceRaw);
assert.equal(reference.passed, true); assert.equal(reference.inventoryOnly, true);
const originals = new Map(reference.records.map(item => [item.id, item]));
assert.equal(originals.size, reference.records.length);
const all = [], records = [], sourceHashes = {};
const readGit = filename => execFileSync('git', ['show', `${baseline.baseCommit}:${filename}`], { cwd: ROOT, maxBuffer: 128 * 1024 * 1024 });
for (const catalogue of baseline.catalogues) {
  const raw = inputMode === 'baseline' ? readGit(catalogue.catalogPath) : await fs.readFile(path.join(ROOT, catalogue.catalogPath));
  if (inputMode === 'baseline') assert.equal(sha(raw), baseline.publicInputHashes[catalogue.catalogPath]);
  sourceHashes[catalogue.catalogPath] = sha(raw);
  const data = JSON.parse(raw), categories = new Map((data.categories || []).map(category => [category.id, category])), offsets = new Map();
  for (const [index, entry] of data.entries.entries()) {
    all.push(entry); const offset = offsets.get(entry.category) || 0; offsets.set(entry.category, offset + 1);
    if (entry.status === 'Validé') continue;
    records.push(JSON.parse(JSON.stringify({ id: entry.id, catalogId: catalogue.id, cataloguePath: catalogue.catalogPath, workbookPath: catalogue.workbookPath,
      jsonPointer: `/entries/${index}`, workbookLocation: { sheet: categories.get(entry.category)?.sheetName || null, row: catalogue.id === 'ME1' ? offset + 7 : null },
      category: entry.category, priority: entry.priority, status: entry.status, assetStatus: entry.assetStatus,
      name: entry.name, episode: entry.episode, scope: entry.scope, canonLevel: entry.canonLevel,
      description: entry.description, acceptance: entry.acceptance, dependencies: entry.dependencies || [],
      reference: entry.reference, sourceId: entry.sourceId || null, sourceIds: entry.sourceIds || null, sourceUrl: entry.sourceUrl,
      notes: entry.notes, implementationPaths: entry.implementationPaths || [], declaredEvidence: entry.evidence || [],
      assessment: 'Not assessed by this inventory; a proposed closure must cover the unchanged exact criterion, description, context and dependency effects with fresh executed evidence.',
    })));
  }
}
const currentIds = new Set(records.map(item => item.id));
const removedRecords = reference.records.filter(item => !currentIds.has(item.id)).map(item => item.id);
const changedRecords = records.filter(item => JSON.stringify(originals.get(item.id)) !== JSON.stringify(item));
const unchangedRecords = records.length - changedRecords.length;
if (inputMode === 'baseline') {
  // The cited prior ledger is valid for this exact base only after comparison of every field.
  assert.deepEqual(removedRecords, []); assert.deepEqual(changedRecords, []);
}
const report = { passed: true, inventoryOnly: true, generatedAt: new Date().toISOString(), baseCommit: baseline.baseCommit,
  inputMode, baseline: { path: options.baseline, sha256: sha(baselineRaw) }, records: all.length,
  catalogues: baseline.catalogues.length, statuses: counts(all), openRecords: records.length,
  openByPriority: Object.fromEntries(['P0', 'P1', 'P2'].map(priority => [priority, records.filter(item => item.priority === priority).length])),
  sourceHashes, ledger: { format: 'verified-reference-plus-delta', reference: { path: options['reference-ledger'], sha256: sha(referenceRaw), records: reference.records.length },
    exactFieldsRecomputed: true, unchangedRecords, removedRecords, changedRecords,
    reconstruction: 'Load reference.records by id, delete removedRecords, replace/add changedRecords, and retain catalogue/entry order from the current source catalogues.' },
  declaredFunctionalMainCandidates: records.filter(item => item.catalogId === 'ME1' && ['systems', 'qa'].includes(item.category)).map(item => item.id),
  limitations: ['Read-only inventory; no execution, acceptance, artistic fidelity or closure is inferred.', 'Every complete criterion and description clause still needs fresh evidence. Supplemental workbook rows remain unmapped.'] };
await fs.mkdir(path.dirname(output), { recursive: true }); await fs.writeFile(output, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: true, records: all.length, openRecords: records.length, openByPriority: report.openByPriority,
  unchangedRecords, changedRecords: changedRecords.length, removedRecords: removedRecords.length, output: options.output }));
