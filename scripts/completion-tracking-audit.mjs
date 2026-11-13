// Exact criteria ledger. It inventories possible work and never closes a row.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2), options = {};
for (let index = 0; index < args.length; index += 2) {
  assert.ok(args[index + 1]); assert.ok(['--baseline', '--output-prefix', '--input-mode'].includes(args[index])); options[args[index].slice(2)] = args[index + 1];
}
const baselinePath = options.baseline || 'docs/qa/completion-tracking-baseline-02.json';
const baselineRaw = await fs.readFile(path.resolve(root, baselinePath)), baseline = JSON.parse(baselineRaw);
assert.equal(baseline.passed, true); const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const prefix = options['output-prefix'] || 'docs/qa/completion-tracking';
const inputMode = options['input-mode'] || 'baseline'; assert.ok(['baseline', 'current'].includes(inputMode));
const output = `${prefix}-audit.json`, ledgerPath = `${prefix}-open-ledger.json`;
for (const filename of [output, ledgerPath]) { try { await fs.access(path.resolve(root, filename)); throw Error(`Preserve existing audit: ${filename}`); } catch (error) { if (error.code !== 'ENOENT') throw error; } }
const all = [], records = [], sourceHashes = {};
for (const catalogue of baseline.catalogues) {
  const raw = await fs.readFile(path.join(inputMode === 'baseline' ? baseline.snapshotDir : root, catalogue.catalogPath));
  if (inputMode === 'baseline') assert.equal(hash(raw), baseline.publicInputHashes[catalogue.catalogPath]); sourceHashes[catalogue.catalogPath] = hash(raw);
  const data = JSON.parse(raw), categories = new Map((data.categories || []).map(category => [category.id, category])), offsets = new Map();
  for (const [index, entry] of data.entries.entries()) {
    all.push(entry); const offset = offsets.get(entry.category) || 0; offsets.set(entry.category, offset + 1);
    if (entry.status === 'Validé') continue;
    const row = catalogue.id === 'ME1' ? offset + 7 : null;
    records.push({ id: entry.id, catalogId: catalogue.id, cataloguePath: catalogue.catalogPath, workbookPath: catalogue.workbookPath,
      jsonPointer: `/entries/${index}`, workbookLocation: { sheet: categories.get(entry.category)?.sheetName || null, row },
      category: entry.category, priority: entry.priority, status: entry.status, assetStatus: entry.assetStatus,
      name: entry.name, episode: entry.episode, scope: entry.scope, canonLevel: entry.canonLevel,
      description: entry.description, acceptance: entry.acceptance, dependencies: entry.dependencies || [],
      reference: entry.reference, sourceId: entry.sourceId || null, sourceIds: entry.sourceIds || null, sourceUrl: entry.sourceUrl,
      notes: entry.notes, implementationPaths: entry.implementationPaths || [], declaredEvidence: entry.evidence || [],
      assessment: 'Not assessed by this inventory; a proposed closure must cover the unchanged exact criterion, description, context and dependency effects with fresh executed evidence.',
    });
  }
}
const ledger = { passed: true, inventoryOnly: true, generatedAt: new Date().toISOString(), baseCommit: baseline.baseCommit,
  inputMode, baseline: { path: baselinePath, sha256: hash(baselineRaw) }, sourceHashes, records,
  rule: 'Includes all non-Validé P0/P1/P2 records; an existing file, URL or historical result is not a current validation. No artistic or canonical fidelity is inferred from functional tests.' };
const ledgerRaw = JSON.stringify(ledger, null, 2) + '\n'; await fs.writeFile(path.resolve(root, ledgerPath), ledgerRaw);
const tally = priority => Object.fromEntries(['Défini', 'Prototype', 'Intégré', 'Validé'].map(status => [status, all.filter(entry => entry.priority === priority && entry.status === status).length]));
const report = { passed: true, inventoryOnly: true, generatedAt: ledger.generatedAt, baseCommit: baseline.baseCommit,
  inputMode, baseline: ledger.baseline, records: all.length, catalogues: baseline.catalogues.length, openRecords: records.length,
  openByPriority: Object.fromEntries(['P0', 'P1', 'P2'].map(priority => [priority, records.filter(entry => entry.priority === priority).length])),
  byPriorityAndStatus: Object.fromEntries(['P0', 'P1', 'P2'].map(priority => [priority, tally(priority)])),
  declaredFunctionalMainCandidates: records.filter(entry => entry.catalogId === 'ME1' && ['systems', 'qa'].includes(entry.category)).map(entry => entry.id),
  sourceHashes, ledger: { path: ledgerPath, sha256: hash(ledgerRaw), records: records.length },
  limits: [ledger.rule, 'The candidate list identifies systems and QA for human review; it never asserts their criteria are satisfied. Supplemental workbooks require their own native row mapping before writing.'] };
await fs.writeFile(path.resolve(root, output), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: true, records: all.length, openRecords: records.length, openByPriority: report.openByPriority, ledger: ledgerPath, output }));
