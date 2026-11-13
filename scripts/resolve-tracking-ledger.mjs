// Reconstruct preserved exact inventories without duplicating their records.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { ROOT, sha } from './completion-tracking-common.mjs';

export async function loadOpenLedger(filename, ancestors = new Set()) {
  const absolute = path.resolve(ROOT, filename);
  assert.ok(absolute.startsWith(ROOT + path.sep), 'Ledger must remain inside the repository.');
  assert.ok(!ancestors.has(absolute), `Cyclic ledger reference: ${filename}`);
  const bytes = await fs.readFile(absolute), raw = JSON.parse(bytes);
  assert.equal(raw.passed, true, filename);
  assert.equal(raw.inventoryOnly, true, filename);
  const reference = { path: path.relative(ROOT, absolute), sha256: sha(bytes) };
  let records, chain;
  if (Array.isArray(raw.records)) {
    records = raw.records;
    chain = [{ ...reference, format: 'records-array', records: records.length }];
  } else {
    assert.equal(raw.ledger?.format, 'verified-reference-plus-delta', filename);
    assert.ok(raw.ledger.reference?.path && raw.ledger.reference.sha256, filename);
    const previous = await loadOpenLedger(raw.ledger.reference.path, new Set([...ancestors, absolute]));
    assert.equal(previous.sha256, raw.ledger.reference.sha256, `${filename}: referenced bytes changed`);
    assert.equal(previous.records.length, raw.ledger.reference.records, `${filename}: referenced inventory count`);
    const byId = new Map(previous.records.map(record => [record.id, record]));
    assert.equal(byId.size, previous.records.length, filename);
    const removed = raw.ledger.removedRecords, changed = raw.ledger.changedRecords;
    assert.ok(Array.isArray(removed) && Array.isArray(changed), filename);
    assert.equal(new Set(removed).size, removed.length, filename);
    assert.equal(new Set(changed.map(record => record.id)).size, changed.length, filename);
    for (const id of removed) assert.equal(byId.delete(id), true, `${filename}: removed record must exist: ${id}`);
    for (const record of changed) {
      assert.ok(record && typeof record.id === 'string', filename);
      assert.ok(!removed.includes(record.id), `${filename}: removed record cannot also change`);
      byId.set(record.id, record);
    }
    records = [...byId.values()];
    assert.equal(records.length, raw.openRecords, `${filename}: reconstructed open count`);
    assert.equal(records.length - changed.length, raw.ledger.unchangedRecords, `${filename}: unchanged count`);
    chain = [{ ...reference, format: raw.ledger.format, records: records.length,
      removedRecords: removed.length, changedRecords: changed.length }, ...previous.chain];
  }
  assert.equal(new Set(records.map(record => record.id)).size, records.length, filename);
  if (raw.openRecords != null) assert.equal(records.length, raw.openRecords, filename);
  if (raw.openByPriority) for (const priority of ['P0', 'P1', 'P2']) {
    assert.equal(records.filter(record => record.priority === priority).length, raw.openByPriority[priority], `${filename}: ${priority}`);
  }
  return { ...reference, raw, records, chain };
}
