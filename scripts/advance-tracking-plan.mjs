// Review the unchanged full description as well as the acceptance sentence before
// handing immutable proposal archival to the preserved parameterized planner.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { ROOT, sha } from './completion-tracking-common.mjs';
const args = process.argv.slice(2), proposals = [], options = {};
for (let index = 0; index < args.length; index += 2) {
  assert.ok(args[index + 1]);
  if (args[index] === '--proposal') proposals.push(args[index + 1]);
  else options[args[index].slice(2)] = args[index + 1];
}
assert.ok(options.baseline && options['select-file'] && proposals.length);
const read = async filename => JSON.parse(await fs.readFile(path.resolve(ROOT, filename)));
const baseline = await read(options.baseline);
const raw = await fs.readFile(path.join(baseline.snapshotDir, 'docs/content-catalog.json'));
assert.equal(sha(raw), baseline.publicInputHashes['docs/content-catalog.json']);
const byId = new Map(JSON.parse(raw).entries.map(entry => [entry.id, entry]));
const selected = new Set(await read(options['select-file']));
for (const filename of proposals) {
  const proposal = await read(filename), records = proposal.records || proposal.proposals;
  assert.equal(proposal.baseCommit || proposal.baselineCommit, baseline.baseCommit, `${filename}: exact current lot base required`);
  assert.ok(Array.isArray(records), filename);
  for (const item of records) {
    if (!selected.has(item.id)) continue;
    const original = byId.get(item.id); assert.ok(original, item.id);
    const fields = item.proposedFields || item.proposed || item.fields || {};
    const review = item.acceptanceReview || fields.acceptanceReview;
    if (fields.status === 'Validé') {
      assert.ok(review, item.id);
      assert.equal(review.exactDescription, original.description, `${item.id}: unchanged original description must be reviewed`);
      assert.equal(review.descriptionComplete, true, `${item.id}: partial description remains open`);
      assert.ok(Array.isArray(review.coveredDescriptionClauses) && review.coveredDescriptionClauses.length > 0,
        `${item.id}: explicit description coverage is required`);
    }
  }
}
execFileSync(process.execPath, ['scripts/completion-tracking-plan.mjs', ...args], { cwd: ROOT, env: process.env, stdio: 'inherit' });
