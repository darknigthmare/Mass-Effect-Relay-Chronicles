// Freeze explicit owner proposals; never infer a promotion from code or files.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { ROOT, IMMUTABLE_FIELDS, MUTABLE_FIELDS, STATUSES, readJson, relative, sha, fresh, preservation } from './completion-tracking-common.mjs';
const args = process.argv.slice(2), proposals = [], options = {};
for (let index = 0; index < args.length; index += 2) {
  const [key, value] = [args[index], args[index + 1]]; assert.ok(value);
  if (key === '--proposal') proposals.push(value);
  else { assert.ok(['--baseline', '--output', '--archive-dir', '--select-file', '--feature-paths-file', '--allow-advanced-ids'].includes(key)); options[key.slice(2)] = value; }
}
assert.ok(proposals.length && options.output && options['archive-dir'] && options['feature-paths-file']);
await fresh(path.resolve(ROOT, options.output)); await fresh(path.resolve(ROOT, options['archive-dir']));
const baseline = await readJson(options.baseline || 'docs/qa/completion-tracking-baseline-02.json'); assert.equal(baseline.data.passed, true);
await preservation(baseline.data);
const raw = await fs.readFile(path.join(baseline.data.snapshotDir, 'docs/content-catalog.json')); assert.equal(sha(raw), baseline.data.publicInputHashes['docs/content-catalog.json']);
const catalogue = JSON.parse(raw), originals = new Map(catalogue.entries.map(entry => [entry.id, entry]));
const selected = options['select-file'] ? new Set((await readJson(options['select-file'])).data) : null;
const sourceList = await readJson(options['feature-paths-file']); assert.ok(Array.isArray(sourceList.data) && sourceList.data.length > 0);
for (const filename of sourceList.data) { assert.ok(relative(filename).startsWith('src/')); assert.notEqual(filename, 'src/universe-data.js'); }
const advanced = (options['allow-advanced-ids'] || '').split(',').filter(Boolean);
for (const id of advanced) assert.equal(originals.get(id)?.status, 'Intégré', id);
const replacements = {}, additions = {}, reviews = {}, sources = [], byId = {}, warnings = [];
await fs.mkdir(path.resolve(ROOT, options['archive-dir']), { recursive: true });
for (const filename of proposals) {
  const proposal = await readJson(filename), list = proposal.data.records || proposal.data.proposals; assert.ok(Array.isArray(list), proposal.path);
  const declaredBase=proposal.data.baseCommit || proposal.data.baselineCommit;
  if (declaredBase) {
    assert.match(declaredBase,/^[0-9a-f]{7,40}$/);
    const resolved=execFileSync('git',['rev-parse','--verify',`${declaredBase}^{commit}`],{cwd:ROOT,encoding:'utf8'}).trim();
    assert.equal(resolved,baseline.data.baseCommit,`Proposal belongs to a different commit: ${proposal.path}`);
  }
  const snapshot = `${options['archive-dir']}/${path.basename(filename)}`; await fresh(path.resolve(ROOT, snapshot)); await fs.writeFile(path.resolve(ROOT, snapshot), proposal.raw);
  sources.push({ path: relative(snapshot), source: proposal.path, sha256: proposal.sha256 });
  for (const item of list) {
    const id = item.id; if (selected && !selected.has(id)) continue;
    const before = originals.get(id); assert.ok(before, `This candidate pipeline writes only existing principal IDs: ${id}`);
    assert.notEqual(before.status, 'Validé', `Historical Validé record remains unchanged: ${id}`);
    const fields = { ...(item.proposedFields || item.proposed || item.fields || {}) };
    const review = item.acceptanceReview || fields.acceptanceReview; delete fields.acceptanceReview;
    const notesAppend = fields.notesAppend ?? item.notesAppend; delete fields.notesAppend;
    if (notesAppend) fields.notes = before.notes ? `${before.notes}\n${notesAppend}` : notesAppend;
    if (typeof fields.notes === 'string' && before.notes && !fields.notes.startsWith(before.notes)) {
      fields.notes = `${before.notes}\n${fields.notes}`;
      warnings.push(`Preserved historical notes before the owner's new note: ${id}`);
    }
    for (const field of IMMUTABLE_FIELDS) if (Object.hasOwn(fields, field)) { assert.deepEqual(fields[field], before[field], `${id}.${field}`); delete fields[field]; }
    if (Object.hasOwn(fields, 'assetStatus')) { assert.equal(fields.assetStatus, before.assetStatus, `No asset status change: ${id}`); delete fields.assetStatus; }
    const paths = item.implementationPaths || fields.implementationPaths || []; delete fields.implementationPaths;
    const evidence = [...new Set([...(item.evidence || fields.evidence || []), ...(review?.evidence || [])])]; delete fields.evidence;
    additions[id] ||= { implementationPaths: [], evidence: [] };
    for (const [field, values] of [['implementationPaths', paths], ['evidence', evidence]]) {
      assert.ok(Array.isArray(values), `${id}.${field}`);
      for (const value of values) { assert.equal(typeof value, 'string'); assert.ok(!value.startsWith('/')); await fs.access(path.join(ROOT, relative(value))); if (!additions[id][field].includes(value)) additions[id][field].push(value); }
    }
    replacements[id] ||= {}; byId[id] ||= []; byId[id].push(relative(snapshot));
    for (const [field, value] of Object.entries(fields)) {
      assert.ok(MUTABLE_FIELDS.includes(field), `${id}: unrecognized mutable field ${field}`);
      if (field === 'notes') assert.ok(value.startsWith(before.notes || ''), `Append historical notes: ${id}`);
      if (Object.hasOwn(replacements[id], field)) assert.deepEqual(replacements[id][field], value, `Conflicting owner field: ${id}.${field}`);
      replacements[id][field] = value;
    }
    if (review) { assert.equal(review.exactCriterion, before.acceptance, `Exact acceptance required: ${id}`); if (reviews[id]) assert.deepEqual(reviews[id], review); reviews[id] = review; }
  }
}
const changedIds = [], allowedFieldsById = {}, promoteIfProved = [];
for (const [id, patch] of Object.entries(replacements)) {
  const before = originals.get(id), fields = [];
  for (const [field, value] of Object.entries(patch)) if (JSON.stringify(before[field]) !== JSON.stringify(value)) fields.push(field); else delete patch[field];
  for (const field of ['implementationPaths', 'evidence']) {
    const existing = before[field] || []; additions[id][field] = additions[id][field].filter(value => !existing.includes(value));
    if (additions[id][field].length) fields.push(field); else delete additions[id][field];
  }
  if (!fields.length) { delete replacements[id]; delete additions[id]; warnings.push(`No change: ${id}`); continue; }
  if (before.status === 'Intégré') { assert.ok(advanced.includes(id), `Explicit --allow-advanced-ids required: ${id}`); assert.equal(patch.status, 'Validé'); }
  if (fields.includes('status')) {
    assert.ok(STATUSES.indexOf(patch.status) > STATUSES.indexOf(before.status), id);
    const review = reviews[id]; assert.ok(review, `Acceptance review missing: ${id}`); assert.ok(['functional', 'documentary', 'artistic'].includes(review.kind));
    assert.ok(Array.isArray(review.coveredClauses) && Array.isArray(review.limitations) && Array.isArray(review.evidence));
    if (patch.status === 'Validé') { assert.equal(review.complete, true, `Incomplete criterion: ${id}`); assert.ok(review.coveredClauses.length && review.evidence.length); }
    for (const proof of review.evidence) await fs.access(path.join(ROOT, relative(proof)));
    promoteIfProved.push(id);
  }
  changedIds.push(id); allowedFieldsById[id] = fields;
}
if (selected) assert.deepEqual([...selected].sort(), [...changedIds].sort(), 'Every selected ID must be present and actually change.');
assert.ok(changedIds.length > 0);
for (const id of promoteIfProved) if (replacements[id].status === 'Validé') {
  for (const dependency of originals.get(id).dependencies) {
    const target = replacements[dependency]?.status || originals.get(dependency)?.status;
    assert.equal(target, 'Validé', `${id}: dependency must be explicitly validated first/in this same scope: ${dependency}`);
  }
}
const scope = { baseCommit: baseline.data.baseCommit, proposalPlanOnly: true, generatedAt: new Date().toISOString(),
  releaseVerification:{localFilesOnly:true,productionPending:true,commitPushAllowed:false,rule:'Complete means exact criterion clauses demonstrated by fresh native/DEV/opened review. All required post-synchronization production families separately block commit/push; failures require correction/rollback before delivery.'},
  baselineProof: { path: baseline.path, sha256: baseline.sha256 }, changedIds, newIds: [], immutableExistingFields: IMMUTABLE_FIELDS,
  allowedFieldsById, promoteIfProved, allowedAdvancedPromotions: advanced, featureSourcePaths: sourceList.data,
  replacements, additions, acceptanceReviews: reviews, proposalSources: sources, proposalsById: byId, warnings,
  limits: ['Explicit scoped proposals only; this plan itself is not an execution or an acceptance decision.', 'Every target Validé has an exact complete criterion review; all declared dependencies must also be explicitly Validé. Functional validation does not certify original-game likeness.', 'No asset status, source, criterion, priority, period, dependency, historical proof or public input is modified by this planner.'] };
await fs.writeFile(path.resolve(ROOT, options.output), JSON.stringify(scope, null, 2) + '\n');
console.log(JSON.stringify({ passed: true, planOnly: true, changedIds: changedIds.length, explicitStatusTargets: promoteIfProved.length, output: options.output, warnings }));
