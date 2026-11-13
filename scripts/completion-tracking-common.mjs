import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
export const IMMUTABLE_FIELDS = ['id', 'category', 'name', 'episode', 'scope', 'canonLevel', 'reference', 'sourceId', 'sourceUrl', 'acceptance', 'dependencies', 'priority', 'plannedPath'];
export const WORKBOOK_FIELDS = ['id', 'name', 'status', 'assetStatus', 'priority', 'episode', 'canonLevel', 'description', 'acceptance', 'dependencies', 'plannedPath', 'assetPath', 'gameKey', 'reference', 'sourceUrl', 'scope', 'notes'];
export const MUTABLE_FIELDS = ['status', 'description', 'assetPath', 'gameKey', 'notes', 'implementationPaths', 'evidence'];
export const PUBLIC_TARGETS = ['docs/content-catalog.json', 'docs/Mass_Effect_Relay_Chronicles_Production.xlsx'];
export const STATUSES = ['Défini', 'Prototype', 'Intégré', 'Validé'];
export const relative = filename => {
  const resolved = path.resolve(ROOT, filename); assert.ok(resolved.startsWith(ROOT + path.sep), `Outside repository: ${filename}`); return path.relative(ROOT, resolved);
};
export async function readJson(filename) {
  const name = relative(filename), raw = await fs.readFile(path.join(ROOT, name)); return { path: name, raw, sha256: sha(raw), data: JSON.parse(raw) };
}
export async function fresh(filename) {
  try { await fs.access(filename); throw Error(`Preserve existing output: ${filename}`); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
}
export async function currentSources(hashes, label) {
  assert.ok(hashes && !Array.isArray(hashes) && typeof hashes === 'object', `Source map required: ${label}`);
  for (const [filename, expected] of Object.entries(hashes)) {
    assert.match(expected, /^[0-9a-f]{64}$/); assert.equal(sha(await fs.readFile(path.join(ROOT, relative(filename)))), expected, `Stale ${label}: ${filename}`);
  }
}
export async function featureHashes(paths) {
  assert.ok(Array.isArray(paths) && paths.length > 0); const hashes = {};
  for (const filename of paths) { const name = relative(filename); assert.ok(name.startsWith('src/')); assert.notEqual(name, 'src/universe-data.js', 'Generated registry is verified after public synchronization'); hashes[name] = sha(await fs.readFile(path.join(ROOT, name))); }
  return hashes;
}
export async function preservation(baseline, publicCopiesMayDiffer = false) {
  let checked = 0;
  for (const [filename, expected] of Object.entries({ ...baseline.publicInputHashes, ...baseline.historicalHashes })) {
    if (publicCopiesMayDiffer && PUBLIC_TARGETS.includes(filename)) continue;
    assert.equal(sha(await fs.readFile(path.join(ROOT, relative(filename)))), expected, `Preserved input changed: ${filename}`); checked++;
  }
  return checked;
}
export function locations(catalogue) {
  const result = {};
  for (const [index, category] of catalogue.categories.entries()) {
    for (const [offset, entry] of catalogue.entries.filter(entry => entry.category === category.id).entries()) result[entry.id] = { sheetName: category.sheetName, row: offset + 7, dashboardRow: index + 10 };
  }
  return result;
}
export const counts = entries => Object.fromEntries(STATUSES.map(status => [status, entries.filter(entry => entry.status === status).length]));
