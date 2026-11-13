// Preserve all parameterized Advance/Completion plan checks and exact texts.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { ROOT, sha } from './completion-tracking-common.mjs';
const args = process.argv.slice(2);
assert.equal(args.filter(value => value === '--proposal').length, 5, 'Five real owner proposals are required.');
const value = key => { const index = args.indexOf(key); assert.ok(index >= 0 && args[index + 1], key); return args[index + 1]; };
const baseline = JSON.parse(await fs.readFile(path.resolve(ROOT, value('--baseline'))));
const bytes = await fs.readFile(path.join(baseline.snapshotDir, 'docs/content-catalog.json'));
assert.equal(sha(bytes), baseline.publicInputHashes['docs/content-catalog.json']);
const byId = new Map(JSON.parse(bytes).entries.map(record => [record.id, record]));
const selected = new Set(JSON.parse(await fs.readFile(path.resolve(ROOT, value('--select-file')))));
for (let index = 0; index < args.length; index += 2) if (args[index] === '--proposal') {
  const proposal = JSON.parse(await fs.readFile(path.resolve(ROOT, args[index + 1])));
  for (const record of proposal.records || proposal.proposals || []) if (selected.has(record.id)) {
    const original = byId.get(record.id); assert.ok(original, record.id);
    const fields = record.proposedFields || record.proposed || record.fields || {};
    if (Object.hasOwn(fields, 'description')) assert.equal(fields.description, original.description, `${record.id}: descriptions remain unchanged`);
    if (Object.hasOwn(fields, 'acceptance')) assert.equal(fields.acceptance, original.acceptance, `${record.id}: criteria remain unchanged`);
    if (fields.status === 'Validé') {
      const review = record.acceptanceReview || fields.acceptanceReview;
      assert.equal(review?.exactCriterion, original.acceptance, record.id);
      assert.equal(review?.complete, true, record.id);
      assert.equal(review?.exactDescription, original.description, record.id);
      assert.equal(review?.descriptionComplete, true, record.id);
    }
  }
}
execFileSync(process.execPath, ['scripts/advance-tracking-plan.mjs', ...args], { cwd: ROOT, env: process.env, stdio: 'inherit' });
