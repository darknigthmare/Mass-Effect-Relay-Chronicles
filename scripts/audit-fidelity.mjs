import { mkdir, readFile, readdir, realpath, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CONTENT_STATUSES = ['Défini', 'Prototype', 'Intégré', 'Validé'];
const count = (counts, key) => { counts[key] = (counts[key] || 0) + 1; };
const blankCounts = () => Object.fromEntries(CONTENT_STATUSES.map(status => [status, 0]));
const inside = (root, target) => {
  const relative = path.relative(root, target);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
};
const text = value => typeof value === 'string' ? value : '';

/** Check a declared path without treating a directory or an external symlink as an asset. */
export async function inspectProjectPath(root, declaredPath) {
  const result = { path: text(declaredPath), exists: false, isFile: false, withinRoot: false, kind: 'undeclared' };
  if (!result.path.trim()) return result;
  const resolvedRoot = await realpath(root);
  const target = path.resolve(resolvedRoot, result.path);
  if (!inside(resolvedRoot, target)) return { ...result, kind: 'outside-project' };
  result.withinRoot = true;
  try {
    const actual = await realpath(target);
    if (!inside(resolvedRoot, actual)) return { ...result, withinRoot: false, kind: 'outside-project' };
    const metadata = await stat(actual);
    return { ...result, exists: true, isFile: metadata.isFile(), kind: metadata.isFile() ? 'file' : metadata.isDirectory() ? 'directory' : 'other' };
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') return { ...result, kind: 'missing' };
    return { ...result, kind: 'unreadable', error: error.code || error.name };
  }
}

function sourceReferences(entry, sources) {
  const ids = [...new Set([entry.sourceId, ...(Array.isArray(entry.sourceIds) ? entry.sourceIds : [])].filter(id => typeof id === 'string' && id))];
  const references = ids.map(id => {
    const source = sources.find(item => item.id === id);
    return { id, title: text(source?.title), url: text(source?.url), declared: Boolean(source) };
  });
  if (text(entry.sourceUrl) && !references.some(reference => reference.url === entry.sourceUrl)) {
    references.push({ id: '', title: '', url: entry.sourceUrl, declared: false });
  }
  return references;
}

/** Audit declarations and local evidence. This does not validate the canon or change a status. */
export async function auditCatalog(catalog, { root, catalogId = 'main', catalogPath = '', knownIds } = {}) {
  if (!root) throw new Error('A project root is required.');
  if (!Array.isArray(catalog?.entries)) throw new Error(`Catalogue ${catalogId}: entries must be an array.`);
  const entries = catalog.entries;
  const availableIds = knownIds || new Set(entries.map(entry => entry.id));
  const sources = Array.isArray(catalog.sources) ? catalog.sources : [];
  const statuses = blankCounts(), categories = Object.create(null), canonLevels = Object.create(null);
  const duplicateIds = [], invalidIds = [], missingDependencies = [], invalidDependencies = [];
  const seen = new Set(), backlog = [], validatedDeclarations = [];
  let technicalFileCount = 0, plannedFileCount = 0, plannedDirectoryCount = 0, missingTechnicalFileCount = 0;
  for (const [index, entry] of entries.entries()) {
    if (typeof entry.id !== 'string' || !entry.id) invalidIds.push(index);
    else if (seen.has(entry.id)) duplicateIds.push(entry.id);
    seen.add(entry.id);
    const status = text(entry.status) || 'Non renseigné';
    const category = text(entry.category) || 'Non renseignée';
    const level = text(entry.canonLevel) || text(entry.nature) || 'Non renseigné';
    count(statuses, status);
    count(canonLevels, level);
    categories[category] ||= { total: 0, statuses: blankCounts() };
    categories[category].total++;
    count(categories[category].statuses, status);
    const dependencies = Array.isArray(entry.dependencies) ? entry.dependencies : [];
    if (entry.dependencies !== undefined && !Array.isArray(entry.dependencies)) invalidDependencies.push(entry.id);
    const unknownDependencies = dependencies.filter(id => typeof id !== 'string' || !availableIds.has(id));
    for (const dependency of unknownDependencies) missingDependencies.push({ id: entry.id, dependency });
    const [asset, planned] = await Promise.all([
      inspectProjectPath(root, entry.assetPath), inspectProjectPath(root, entry.plannedPath),
    ]);
    if (asset.isFile) technicalFileCount++;
    else missingTechnicalFileCount++;
    if (planned.isFile) plannedFileCount++;
    if (planned.kind === 'directory') plannedDirectoryCount++;
    const references = sourceReferences(entry, sources);
    const record = {
      id: text(entry.id), name: text(entry.name), category, episode: text(entry.episode) || text(catalog.id),
      status, assetStatus: text(entry.assetStatus), priority: text(entry.priority), canonLevel: level,
      acceptance: text(entry.acceptance), reference: text(entry.reference), sources: references,
      dependencies, unknownDependencies,
      technicalEvidence: { asset, planned, gameKey: text(entry.gameKey) },
      canonicalEvidence: {
        factDeclaredEstablished: ['Confirmé', 'Établi'].includes(level),
        hasSourceReference: references.some(reference => reference.url),
        fidelityAssessment: 'not-assessed',
      },
    };
    if (status === 'Validé') validatedDeclarations.push(record);
    else backlog.push(record);
  }
  return {
    id: catalogId, path: catalogPath, title: text(catalog.title) || text(catalog.meta?.title) || catalogId,
    total: entries.length, statuses, categories, canonLevels,
    evidence: { technicalFileCount, missingTechnicalFileCount, plannedFileCount, plannedDirectoryCount, fidelityNotAssessed: entries.length },
    integrity: { duplicateIds, invalidIds, missingDependencies, invalidDependencies },
    backlog, validatedDeclarations,
  };
}

/** Main catalogue by default; includeUniverse additionally audits the extension catalogues. */
export async function auditProject({ root, includeUniverse = false } = {}) {
  const resolvedRoot = await realpath(root);
  const catalogueFiles = ['docs/content-catalog.json'];
  if (includeUniverse) {
    const directory = 'docs/universe/catalogs';
    const names = await readdir(path.join(resolvedRoot, directory), { withFileTypes: true });
    for (const item of names.filter(item => item.isFile() && item.name.endsWith('.json')).sort((a, b) => a.name.localeCompare(b.name))) {
      catalogueFiles.push(`${directory}/${item.name}`);
    }
  }
  const loaded = await Promise.all(catalogueFiles.map(async file => ({ file, data: JSON.parse(await readFile(path.join(resolvedRoot, file), 'utf8')) })));
  const knownIds = new Set(loaded.flatMap(({ data }) => Array.isArray(data.entries) ? data.entries.map(entry => entry.id) : []));
  const catalogs = [];
  for (const { file, data } of loaded) {
    catalogs.push(await auditCatalog(data, { root: resolvedRoot, catalogId: file === catalogueFiles[0] ? 'main' : data.id || path.basename(file, '.json'), catalogPath: file, knownIds }));
  }
  const statuses = blankCounts();
  for (const catalog of catalogs) for (const [status, amount] of Object.entries(catalog.statuses)) statuses[status] = (statuses[status] || 0) + amount;
  const allIds = new Map(), crossCatalogDuplicateIds = [];
  for (const { file, data } of loaded) for (const entry of data.entries) {
    if (allIds.has(entry.id) && allIds.get(entry.id) !== file) crossCatalogDuplicateIds.push({ id: entry.id, catalogs: [allIds.get(entry.id), file] });
    else allIds.set(entry.id, file);
  }
  return {
    schemaVersion: 1, generatedAt: new Date().toISOString(), root: resolvedRoot,
    scope: includeUniverse ? 'main-and-universe' : 'main',
    interpretation: {
      statuses: 'Declared content progress only; no status is automatically promoted.',
      technicalEvidence: 'An existing local file is evidence of presence, not proof of integration, behavior or fidelity. A planned directory is not a produced asset.',
      canonicalEvidence: 'A confirmed fact, established nature or source URL does not validate the representation against an edition of the original work. Fidelity remains not assessed by this audit.',
    },
    summary: {
      catalogs: catalogs.length, entries: catalogs.reduce((total, catalog) => total + catalog.total, 0), statuses,
      backlog: catalogs.reduce((total, catalog) => total + catalog.backlog.length, 0),
      missingDependencies: catalogs.reduce((total, catalog) => total + catalog.integrity.missingDependencies.length, 0),
      crossCatalogDuplicateIds,
    },
    catalogs,
  };
}

export async function writeReport(report, output) {
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
}

async function main(argumentsList) {
  let root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), output, includeUniverse = false;
  for (let index = 0; index < argumentsList.length; index++) {
    const argument = argumentsList[index];
    if (argument === '--include-universe') includeUniverse = true;
    else if (argument === '--root' || argument === '--output') {
      const value = argumentsList[++index];
      if (!value || value.startsWith('--')) throw new Error(`${argument} requires a path.`);
      if (argument === '--root') root = path.resolve(value);
      else output = value;
    } else if (argument === '--help') {
      console.log('node scripts/audit-fidelity.mjs [--root PROJECT] [--include-universe] [--output FILE]\nDefault output: test-results/fidelity-report.json. Catalogues and statuses are never modified.');
      return;
    } else throw new Error(`Unknown argument: ${argument}`);
  }
  const report = await auditProject({ root, includeUniverse });
  const outputPath = path.resolve(root, output || 'test-results/fidelity-report.json');
  const inputs = report.catalogs.map(catalog => path.resolve(root, catalog.path));
  if (inputs.includes(outputPath)) throw new Error('The report output must not overwrite a catalogue.');
  await writeReport(report, outputPath);
  console.log(JSON.stringify({ ...report.summary, output: outputPath, fidelity: 'not-assessed' }, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main(process.argv.slice(2)).catch(error => { console.error(error.message); process.exitCode = 1; });
}
