// Inventory declared open P0/P1 criteria. This never promotes a record or claims
// that a file, a test name or an existing image satisfies its acceptance text.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { BASE_COMMIT, sha } from './priority-workbook-data.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const prefix = process.env.PRIORITY_AUDIT_PREFIX || 'priority-baseline';
assert.match(prefix, /^priority-[a-z0-9-]+$/);
const baselineMode = !process.argv.includes('--current');
const paths = { ledger: `docs/qa/${prefix}-open-ledger.json`, report: `docs/qa/${prefix}-audit.json` };
for (const filename of Object.values(paths)) {
  try { await fs.access(path.join(root, filename)); throw Error(`Preserve the existing audit: ${filename}`); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
}
const read = async filename => baselineMode
  ? execFileSync('git', ['show', `${BASE_COMMIT}:${filename}`], { cwd: root, maxBuffer: 50 * 1024 * 1024 })
  : fs.readFile(path.join(root, filename));
const manifest = JSON.parse(await read('docs/universe/manifest.json'));
const inputs = [{ id: 'ME1', catalogPath: 'docs/content-catalog.json', filename: 'Mass_Effect_Relay_Chronicles_Production.xlsx' }, ...manifest.workbooks];
assert.equal(inputs.length, 28);
const statuses = ['Défini', 'Prototype', 'Intégré', 'Validé'];
const priorities = ['P0', 'P1', 'P2'];
const count = entries => Object.fromEntries(priorities.map(priority => [priority,
  Object.fromEntries(statuses.map(status => [status, entries.filter(entry => entry.priority === priority && entry.status === status).length]))]));
const groups = {
  systems: 'foundations', qa: 'foundations',
  main_quests: 'campaign', choices: 'campaign', continuity: 'campaign',
  characters: 'combat', enemies: 'combat', powers: 'combat', ally_moves: 'combat', enemy_moves: 'combat',
  worlds: 'exploration', zones: 'exploration', links: 'exploration', scenery: 'exploration', props: 'exploration',
  npcs: 'conversations', dialogues: 'conversations', side_quests: 'conversations',
  weapons: 'equipment', equipment: 'equipment',
  sprites: 'assets', animations: 'assets', cinematics: 'assets', vfx: 'assets', audio: 'assets',
  lore: 'canon',
};
const ledger = [], catalogues = [], sourceHashes = {}, all = [], advanced = [];
for (const input of inputs) {
  const raw = await read(input.catalogPath), catalogue = JSON.parse(raw);
  sourceHashes[input.catalogPath] = sha(raw);
  const entries = catalogue.entries;
  assert.ok(Array.isArray(entries));
  const categories = new Map((catalogue.categories || []).map(category => [category.id, category]));
  const offsets = new Map();
  for (const [index, entry] of entries.entries()) {
    assert.ok(typeof entry.id === 'string' && entry.id);
    assert.ok(priorities.includes(entry.priority), `${entry.id}: unrecognized priority`);
    assert.ok(statuses.includes(entry.status), `${entry.id}: unrecognized status`);
    assert.equal(typeof entry.acceptance, 'string');
    const offset = offsets.get(entry.category) || 0; offsets.set(entry.category, offset + 1);
    all.push(entry);
    if (entry.priority === 'P2') continue;
    if (entry.status === 'Validé') { advanced.push({ id: entry.id, catalogId: input.id, status: entry.status, acceptance: entry.acceptance }); continue; }
    ledger.push({
      id: entry.id, catalogId: input.id, catalogPath: input.catalogPath, jsonPointer: `/entries/${index}`,
      mainWorkbookLocation: input.id === 'ME1' ? { path: `docs/${input.filename}`, sheet: categories.get(entry.category)?.sheetName, row: offset + 7 } : null,
      category: entry.category, workstream: groups[entry.category] || 'canon', name: entry.name,
      priority: entry.priority, status: entry.status, assetStatus: entry.assetStatus || null,
      media: entry.episode || input.id, nature: entry.nature || entry.canonLevel || null,
      acceptance: entry.acceptance, description: entry.description || '', conditions: entry.conditions || '',
      dependencies: entry.dependencies || [], notes: entry.notes || '',
      sourceIds: entry.sourceIds || (entry.sourceId ? [entry.sourceId] : []),
      sourceUrl: entry.sourceUrl || null, reference: entry.reference || '',
      declaredAssetPath: entry.assetPath || null, declaredImplementationPaths: entry.implementationPaths || [],
      declaredEvidence: entry.evidence || [],
      acceptanceAssessment: 'not-assessed; requires current scoped implementation and executed evidence',
      remainingCriterion: entry.acceptance,
    });
  }
  catalogues.push({ id: input.id, path: input.catalogPath, sha256: sha(raw), records: entries.length, byPriorityAndStatus: count(entries),
    openP0P1: entries.filter(entry => ['P0', 'P1'].includes(entry.priority) && entry.status !== 'Validé').length });
}
assert.equal(all.length, 6711);
assert.equal(new Set(all.map(entry => entry.id)).size, all.length);
const tally = count(all), totalOpen = ledger.length;
if (baselineMode) {
  assert.equal(totalOpen, 6588); assert.deepEqual(tally.P0, { Défini: 642, Prototype: 142, Intégré: 0, Validé: 3 });
  assert.deepEqual(tally.P1, { Défini: 5253, Prototype: 548, Intégré: 3, Validé: 0 });
}
const ledgerDocument = { schemaVersion: 1, generatedAt: new Date().toISOString(), baselineCommit: BASE_COMMIT,
  inputMode: baselineMode ? 'exact immutable Git baseline' : 'current public catalogues',
  sourceHashes, records: ledger,
  scope: 'Every P0/P1 record whose declared content status is not Validé. All acceptance texts and declared dependencies are copied verbatim; no acceptance or artistic review is performed by this inventory.',
  limits: ['Intégré is included until its declared validation is complete. Prototype may contain substantial playable behavior but remains partial.',
    'Priority ranks come from each source catalogue; P0/P1 across later games, books and cut-content dossiers do not all request playable missions.',
    'A source URL, local asset path or named test is a declaration, not evidence of current execution or original-game fidelity.',
    'Independent Simulation study workbooks have separate schemas and are outside these 28 production catalogues.'] };
const ledgerBytes = JSON.stringify(ledgerDocument, null, 2) + '\n';
await fs.writeFile(path.join(root, paths.ledger), ledgerBytes);
const report = { passed: true, generatedAt: ledgerDocument.generatedAt, baselineCommit: BASE_COMMIT,
  inventoryOnly: true, inputMode: ledgerDocument.inputMode, sourceHashes,
  records: all.length, catalogues: catalogues.length, openP0P1: totalOpen,
  openP0: ledger.filter(entry => entry.priority === 'P0').length, openP1: ledger.filter(entry => entry.priority === 'P1').length,
  unvalidatedDefinedOrPrototype: ledger.filter(entry => ['Défini', 'Prototype'].includes(entry.status)).length,
  integratedAwaitingValidation: ledger.filter(entry => entry.status === 'Intégré').length,
  alreadyValidated: advanced, excludedP2: all.filter(entry => entry.priority === 'P2').length,
  byPriorityAndStatus: tally, perCatalogue: catalogues,
  byWorkstream: Object.fromEntries([...new Set(Object.values(groups))].map(group => [group, ledger.filter(entry => entry.workstream === group).length])),
  ledger: { path: paths.ledger, sha256: sha(ledgerBytes), entries: ledger.length },
  sourceTool: { path: 'scripts/priority-audit.mjs', sha256: sha(await fs.readFile(new URL(import.meta.url))) },
  scope: ledgerDocument.scope, limitations: ledgerDocument.limits };
await fs.writeFile(path.join(root, paths.report), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: true, inventoryOnly: true, records: all.length, open: totalOpen, P0: report.openP0, P1: report.openP1, ledger: paths.ledger }));
