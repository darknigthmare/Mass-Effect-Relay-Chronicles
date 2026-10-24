import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { CONTENT_STATUSES, checkedProjectFile, checkDeclaredProofs, sha256 } from './universe-workbook-tools.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const own = (object, key) => Object.hasOwn(object, key);
function keys(object, allowed, label) {
  if (!object || typeof object !== 'object' || Array.isArray(object) || Object.getPrototypeOf(object) !== Object.prototype || Reflect.ownKeys(object).some(key => typeof key !== 'string' || !allowed.includes(key) || !own(Object.getOwnPropertyDescriptor(object, key), 'value'))) throw new Error(`Unexpected fields in ${label}.`);
}

function plainData(value, seen = new Set(), depth = 0) {
  if (value === null || ['string', 'boolean'].includes(typeof value) || (typeof value === 'number' && Number.isFinite(value))) return;
  if (!value || typeof value !== 'object' || depth > 32 || seen.has(value)) throw new Error('Plan must be finite, acyclic JSON data.');
  const array = Array.isArray(value);
  if (Object.getPrototypeOf(value) !== (array ? Array.prototype : Object.prototype)) throw new Error('Plan must not contain custom prototypes.');
  seen.add(value);
  const properties = Reflect.ownKeys(value).filter(key => !(array && key === 'length'));
  if (array && properties.length !== value.length) throw new Error('Plan arrays must be dense.');
  for (const key of properties) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (typeof key !== 'string' || !descriptor.enumerable || !own(descriptor, 'value') || (array && !/^(0|[1-9]\d*)$/.test(key))) throw new Error('Plan must not contain symbols, accessors or hidden properties.');
    plainData(descriptor.value, seen, depth + 1);
  }
  seen.delete(value);
}

export async function loadProductionCatalogs(root = projectRoot) {
  const files = ['docs/content-catalog.json', ...(await fs.readdir(path.join(root, 'docs/universe/catalogs'))).filter(name => name.endsWith('.json')).sort().map(name => `docs/universe/catalogs/${name}`)];
  const catalogs = [];
  const seenWorks = new Set(), seenIds = new Set();
  for (const declared of files) {
    const file = await checkedProjectFile(root, declared);
    const book = JSON.parse(file.bytes.toString('utf8'));
    const id = declared === 'docs/content-catalog.json' ? 'ME1' : book.id;
    if (!id || seenWorks.has(id) || !Array.isArray(book.entries)) throw new Error(`Invalid/duplicate catalogue ${id}.`);
    seenWorks.add(id);
    for (const entry of book.entries) {
      if (typeof entry.id !== 'string' || !entry.id || seenIds.has(entry.id)) throw new Error(`Invalid/duplicate catalogue ID ${entry.id}.`);
      seenIds.add(entry.id);
    }
    catalogs.push({ ...file, id, book });
  }
  return catalogs;
}

export function inventoryBacklog(catalogs, { catalogIds, categories, status = 'Défini' } = {}) {
  const known = new Set(catalogs.map(catalog => catalog.id));
  if (catalogIds?.some(id => !known.has(id))) throw new Error('Unknown catalogue in inventory.');
  if (!CONTENT_STATUSES.includes(status)) throw new Error('Unknown status in inventory.');
  const knownCategories = new Set(catalogs.flatMap(catalog => catalog.book.entries.map(entry => entry.category)));
  if (categories?.some(category => !knownCategories.has(category))) throw new Error('Unknown category in inventory.');
  const entries = [];
  const statusCounts = {};
  for (const catalog of catalogs) {
    for (const entry of catalog.book.entries) {
      statusCounts[entry.status] = (statusCounts[entry.status] || 0) + 1;
      const factual = entry.nature === 'Établi' || (catalog.id === 'ME1' && entry.canonLevel === 'Confirmé');
      if (!factual || entry.status !== status || (catalogIds && !catalogIds.includes(catalog.id)) || (categories && !categories.includes(entry.category))) continue;
      const sourceIds = [...new Set([entry.sourceId, ...(entry.sourceIds || [])].filter(Boolean))];
      entries.push({ catalogId: catalog.id, id: entry.id, category: entry.category, name: entry.name,
        status: entry.status, nature: entry.nature || entry.canonLevel,
        description: entry.description, conditions: entry.conditions || '', reference: entry.reference || '',
        sourceIds, sourceUrl: entry.sourceUrl || '',
        sources: sourceIds.map(id => catalog.book.sources.find(source => source.id === id)).filter(Boolean),
        catalogPath: catalog.path,
      });
    }
  }
  return { readOnly: true, catalogCount: catalogs.length, recordCount: catalogs.reduce((sum, catalog) => sum + catalog.book.entries.length, 0), statusCounts,
    selectedCount: entries.length, scope: 'Factual catalogue declarations only; conditions and source uncertainty remain unchanged. This inventory does not grant gameplay access.', entries };
}

function pointerValue(value, pointer) {
  if (typeof pointer !== 'string' || !pointer.startsWith('/')) throw new Error('A JSON resultPointer such as /passed is required.');
  for (const part of pointer.slice(1).split('/')) {
    if (/~(?![01])/.test(part)) throw new Error('Invalid JSON pointer escape.');
    const key = part.replaceAll('~1', '/').replaceAll('~0', '~');
    if (['__proto__', 'prototype', 'constructor'].includes(key) || !value || typeof value !== 'object' || !own(value, key)) throw new Error('Validation result pointer is missing or unsafe.');
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !own(descriptor, 'value')) throw new Error('Validation result must not execute accessors.');
    value = descriptor.value;
  }
  return value;
}

export async function checkValidationReport(validation, root) {
  keys(validation, ['reportPath', 'sha256', 'resultPointer'], 'validation');
  if (typeof validation.sha256 !== 'string' || !/^[0-9a-f]{64}$/.test(validation.sha256)) throw new Error('A lowercase SHA-256 of the validation report is required.');
  const report = await checkedProjectFile(root, validation.reportPath);
  if (report.sha256 !== validation.sha256) throw new Error('Validation report SHA-256 differs from the explicit plan.');
  if (pointerValue(JSON.parse(report.bytes.toString('utf8')), validation.resultPointer) !== true) throw new Error('Validation report must contain an explicit positive boolean.');
  return { reportPath: report.path, sha256: report.sha256, resultPointer: validation.resultPointer };
}

/** Only a reviewed whitelist can advance Défini -> Prototype. Advanced statuses
 * deliberately remain outside this tool: a passing test is not acceptance. */
export async function prepareProgressPlan(plan, root = projectRoot) {
  plainData(plan);
  keys(plan, ['version', 'reason', 'changes'], 'plan');
  if (plan.version !== 1 || typeof plan.reason !== 'string' || !plan.reason.trim() || !Array.isArray(plan.changes) || !plan.changes.length) throw new Error('Expected a version-1 plan with a reason and explicit changes.');
  const catalogs = await loadProductionCatalogs(root), byId = new Map(catalogs.map(catalog => [catalog.id, catalog]));
  const seen = new Set(), changes = [], updates = new Map();
  for (const change of plan.changes) {
    keys(change, ['catalogId', 'id', 'fromStatus', 'toStatus', 'implementationPaths', 'evidence', 'validation'], 'change');
    if (typeof change.id !== 'string' || !change.id || seen.has(change.id)) throw new Error('Every changed ID must be explicit and unique.');
    seen.add(change.id);
    const catalog = byId.get(change.catalogId);
    const entry = catalog?.book.entries.find(entry => entry.id === change.id);
    if (!entry) throw new Error(`Unknown catalogue/ID pair ${change.catalogId}/${change.id}.`);
    if (change.fromStatus !== entry.status || change.fromStatus !== 'Défini' || change.toStatus !== 'Prototype') throw new Error(`Only explicit Défini -> Prototype advancement is supported: ${change.id}.`);
    if (entry.implementationPath) throw new Error(`Normalize the existing singular implementationPath separately before using this tool: ${change.id}.`);
    const proposed = { ...entry, status: change.toStatus, implementationPaths: change.implementationPaths, evidence: change.evidence };
    const proofs = await checkDeclaredProofs(proposed, root);
    const validation = await checkValidationReport(change.validation, root);
    if (!change.evidence.includes(validation.reportPath)) throw new Error(`The validation report must be included explicitly in evidence: ${change.id}.`);
    if (!updates.has(catalog.id)) updates.set(catalog.id, { catalog, book: JSON.parse(catalog.bytes.toString('utf8')) });
    const updated = updates.get(catalog.id).book.entries.find(entry => entry.id === change.id);
    // These three fields are the entire edit surface. No canon/source field is
    // copied from the plan, inferred from a path, or rewritten by this tool.
    updated.status = proposed.status;
    updated.implementationPaths = [...proposed.implementationPaths];
    updated.evidence = [...proposed.evidence];
    changes.push({ catalogId: catalog.id, id: entry.id, fromStatus: entry.status, toStatus: proposed.status, proofs, validation });
  }
  return { root, catalogs, updates, summary: { dryRun: true, reason: plan.reason, changedRecords: changes.length, changedCatalogs: updates.size, protectedFieldsUnchanged: true, changes } };
}

export async function applyProgressPlan(prepared) {
  // Recheck every snapshot and report before the first write. A stale plan
  // never partially applies because a later ID or report failed preflight.
  for (const catalog of prepared.catalogs) {
    const current = await checkedProjectFile(prepared.root, catalog.path);
    if (current.sha256 !== catalog.sha256) throw new Error(`Catalogue changed after preflight: ${catalog.id}.`);
  }
  for (const change of prepared.summary.changes) {
    await checkValidationReport(change.validation, prepared.root);
    for (const proof of [...change.proofs.implementationPaths, ...change.proofs.evidence]) {
      if ((await checkedProjectFile(prepared.root, proof.path)).sha256 !== proof.sha256) throw new Error(`Proof changed after preflight: ${proof.path}.`);
    }
  }
  const pending = [], replaced = [];
  try {
    for (const { catalog, book } of prepared.updates.values()) {
      const temporary = path.join(path.dirname(catalog.absolutePath), `.${path.basename(catalog.absolutePath)}.progress-${randomUUID()}`);
      await fs.writeFile(temporary, JSON.stringify(book, null, 2) + '\n', { flag: 'wx' });
      pending.push({ temporary, catalog });
    }
    for (const item of pending) {
      await fs.rename(item.temporary, item.catalog.absolutePath);
      replaced.push(item.catalog);
    }
  } catch (error) {
    for (const catalog of replaced) await fs.writeFile(catalog.absolutePath, catalog.bytes);
    throw error;
  } finally {
    for (const item of pending) await fs.rm(item.temporary, { force: true });
  }
  return { ...prepared.summary, dryRun: false, applied: true, catalogSha256: Object.fromEntries(await Promise.all([...prepared.updates.values()].map(async ({ catalog }) => [catalog.id, sha256(await fs.readFile(catalog.absolutePath))]))) };
}

async function main() {
  const args = process.argv.slice(2), options = { inventory: false, apply: false };
  const list = value => {
    if (!value || value.startsWith('--')) throw new Error('Missing option value.');
    const items = value.split(',');
    if (items.some(item => !item || item.trim() !== item) || new Set(items).size !== items.length) throw new Error('Empty/duplicate option selection.');
    return items;
  };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--inventory') options.inventory = true;
    else if (args[i] === '--apply') options.apply = true;
    else if (args[i] === '--plan') { if (options.plan || !args[i + 1] || args[i + 1].startsWith('--')) throw new Error('Expected one --plan file.'); options.plan = args[++i]; }
    else if (args[i] === '--catalogs') options.catalogIds = list(args[++i]);
    else if (args[i] === '--categories') options.categories = list(args[++i]);
    else if (args[i] === '--status') { const values = list(args[++i]); if (values.length !== 1) throw new Error('Choose one inventory status.'); options.status = values[0]; }
    else if (args[i] === '--help') {
      console.log('node scripts/catalog-progress.mjs --inventory [--catalogs ME2,ME3] [--categories powers,equipment] [--status Défini]\nnode scripts/catalog-progress.mjs --plan PLAN.json [--apply]\nPlans are dry-run by default and support Défini -> Prototype only. Each explicit ID needs implementationPaths, evidence including its validation report, and validation {reportPath,sha256,resultPointer}. Original nature, description and source IDs are preserved.');
      return;
    } else throw new Error(`Unknown option ${args[i]}.`);
  }
  if (options.inventory && !options.plan && !options.apply) {
    console.log(JSON.stringify(inventoryBacklog(await loadProductionCatalogs(), options), null, 2));
    return;
  }
  if (!options.plan || options.inventory || options.catalogIds || options.categories || options.status) throw new Error('Choose --inventory or an explicit --plan; --apply requires --plan.');
  const metadata = await fs.lstat(options.plan);
  if (!metadata.isFile() || metadata.isSymbolicLink()) throw new Error('Plan must be a regular JSON file.');
  const prepared = await prepareProgressPlan(JSON.parse(await fs.readFile(options.plan, 'utf8')));
  console.log(JSON.stringify(options.apply ? await applyProgressPlan(prepared) : prepared.summary, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
