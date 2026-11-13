// Convert reviewed owner proposals and an explicit promotion list into a scoped
// candidate plan. This prepares no public data and runs no gameplay gate.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BASE_COMMIT, GLOBAL_PROOF, IMMUTABLE_FIELDS, PRIORITY_FEATURE_SOURCES, CORRECTION_IDS, sha } from './priority-workbook-data.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2), inputs = [], promotions = new Set();
let output, archiveDirectory;
for (let index = 0; index < args.length; index += 2) {
  assert.ok(args[index + 1]);
  if (args[index] === '--proposal') inputs.push(args[index + 1]);
  else if (args[index] === '--promote-ids') for (const id of args[index + 1].split(',')) { assert.ok(id); promotions.add(id); }
  else if (args[index] === '--archive-proposals-dir') archiveDirectory = args[index + 1];
  else { assert.equal(args[index], '--output'); output = args[index + 1]; }
}
assert.ok(inputs.length >= 5 && output, 'Provide each feature proposal, the root proposal, explicit promotion IDs and an output.');
try { await fs.access(output); throw Error('Preserve the existing scope; choose a new output while revising proposals.'); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
const catalogue = JSON.parse(await fs.readFile(path.join(root, 'docs/content-catalog.json')));
const baseline = JSON.parse(await fs.readFile(path.join(root, 'docs/qa/priority-workbook-baseline.json')));
assert.equal(sha(await fs.readFile(path.join(root, 'docs/content-catalog.json'))), baseline.sourceHashes['docs/content-catalog.json']);
const records = new Map(catalogue.entries.map(entry => [entry.id, entry]));
const replacements = {}, additions = {}, proposalSources = [], proposalsById = {}, retainedAssetStatuses = [];
const mutable = ['description', 'notes', 'assetPath', 'gameKey', 'deliveryVersion'];
const append = (id, field, values) => { additions[id] ||= {}; additions[id][field] = [...new Set([...(additions[id][field] || []), ...values])]; };
const assign = (id, field, value, input) => {
  replacements[id] ||= {};
  if (Object.hasOwn(replacements[id], field)) assert.deepEqual(replacements[id][field], value, `Resolve overlapping owner fields explicitly: ${id}.${field} (${input})`);
  replacements[id][field] = value;
};
for (const input of inputs) {
  const raw = await fs.readFile(path.resolve(root, input)), proposal = JSON.parse(raw);
  if (proposal.baselineCommit) assert.equal(proposal.baselineCommit, BASE_COMMIT);
  assert.ok(Array.isArray(proposal.records));
  let recordPath = path.relative(root, path.resolve(root, input));
  if (archiveDirectory) {
    const directory = path.resolve(root, archiveDirectory); assert.ok(directory.startsWith(root + path.sep));
    await fs.mkdir(directory, { recursive: true });
    const snapshot = path.join(directory, path.basename(input));
    try { await fs.access(snapshot); throw Error(`Preserve the existing proposal snapshot: ${snapshot}`); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    await fs.writeFile(snapshot, raw); recordPath = path.relative(root, snapshot);
  }
  proposalSources.push({ path: recordPath, source: path.relative(root, path.resolve(root, input)), sha256: sha(raw), records: proposal.records.map(record => record.id) });
  for (const item of proposal.records) {
    const before = records.get(item.id); assert.ok(before, item.id); assert.ok(!['Intégré', 'Validé'].includes(before.status), item.id);
    const fields = item.proposed || item.proposedFields || item;
    proposalsById[item.id] ||= []; proposalsById[item.id].push(input);
    if (fields.status !== undefined && fields.status !== before.status) {
      assert.equal(fields.status, 'Prototype'); assert.ok(promotions.has(item.id), `Owner status proposal requires explicit promotion selection: ${item.id}`);
    }
    if (fields.assetStatus !== undefined && fields.assetStatus !== before.assetStatus) retainedAssetStatuses.push({ id: item.id,
      proposed: fields.assetStatus, retained: before.assetStatus, reason: 'Functional prototype only; existing asset status is preserved by the final tracking policy.' });
    for (const field of mutable) if (Object.hasOwn(fields, field)) assign(item.id, field, fields[field], input);
    if (fields.notesAppend) {
      const oldNote = replacements[item.id]?.notes ?? before.notes ?? '';
      replacements[item.id] ||= {}; replacements[item.id].notes = `${oldNote} ${fields.notesAppend}`.trim();
    }
    for (const field of ['implementationPaths', 'evidence']) append(item.id, field, item[field] || fields[field] || []);
    append(item.id, 'evidence', [GLOBAL_PROOF, 'docs/qa/priority-workbook-visual-report.json']);
  }
  for (const [id, notes] of Object.entries(proposal.encounterNotes || {})) { assert.ok(CORRECTION_IDS.includes(id)); assign(id, 'notes', notes, input); }
}
for (const id of promotions) {
  assert.ok(Object.hasOwn(proposalsById, id), `No owner proposal for explicit promotion: ${id}`);
  assert.equal(records.get(id)?.status, 'Défini', `Only a declared incomplete record can become Prototype: ${id}`);
  assign(id, 'status', 'Prototype', 'explicit promotion list');
}
const ids = [...new Set([...CORRECTION_IDS, ...Object.keys(replacements), ...Object.keys(additions)])];
for (const id of ids) assert.ok(records.has(id));
const allowedFieldsById = {};
for (const id of ids) {
  allowedFieldsById[id] = [...new Set([...Object.keys(replacements[id] || {}), ...Object.keys(additions[id] || {}),
    ...(CORRECTION_IDS.includes(id) ? [id === 'SYS-preparations-chroniques' ? 'notes' : 'description'] : [])])];
  assert.ok(allowedFieldsById[id].every(field => !IMMUTABLE_FIELDS.includes(field)));
}
const scope = { baseCommit: BASE_COMMIT, proposalPlanOnly: true, changedIds: ids, newIds: [], allowedFieldsById,
  immutableExistingFields: IMMUTABLE_FIELDS, promoteIfProved: [...promotions], featureSourcePaths: PRIORITY_FEATURE_SOURCES,
  replacements, additions, proposalSources, proposalsById, retainedAssetStatuses,
  limits: ['Explicit owner proposals and promotion IDs are necessary but not sufficient for publication.',
    'The writer still requires current native, development and actually opened visual gates. Existing acceptance texts and all asset statuses remain unchanged.',
    'Content transitions are partial Défini → Prototype only. No automatic Intégré or Validé transition is declared.'] };
await fs.writeFile(path.resolve(root, output), JSON.stringify(scope, null, 2) + '\n');
console.log(JSON.stringify({ passed: true, proposalOnly: true, records: ids.length, explicitConditionalPromotions: promotions.size, output }));
