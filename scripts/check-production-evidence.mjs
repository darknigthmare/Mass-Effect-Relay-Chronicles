import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, realpath, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { inspectProjectPath } from './audit-fidelity.mjs';

const statuses = ['Défini', 'Prototype', 'Intégré', 'Validé'];
const implementationStatuses = new Set(['Intégré', 'Validé']);
const historicalEvidence = {
  'SYS-creation-de-shepard': {
    assetPath: 'src/main.js',
    path: 'docs/qa/dossier-and-saves-report.json',
    section: 'commander',
    sha256: '0d43c70021f713e336f2dc2f33f467482bd28a9ed5196376028b637e5b563d69',
  },
  'SYS-sauvegarde-manuelle': {
    assetPath: 'src/save-slots.js',
    path: 'docs/qa/dossier-and-saves-report.json',
    section: 'manualSaves',
    sha256: '0d43c70021f713e336f2dc2f33f467482bd28a9ed5196376028b637e5b563d69',
  },
  'SYS-codex': {
    assetPath: 'src/story.js',
    path: 'docs/qa/story-and-recruitment-report.json',
    section: 'storyBrowser',
    sha256: '8014a02d8b913a42276d20a2e71cc1aec3302adf7d7591f60e5b2d0ca7aba1d1',
  },
};

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const sourceFile = fileURLToPath(import.meta.url);
const isAuditReport = filename => /^docs\/qa\/.+\.json$/.test(filename);

function isRelativeProjectPath(value) {
  return typeof value === 'string' && value.length > 0 && value === value.trim()
    && !path.posix.isAbsolute(value) && !path.win32.isAbsolute(value)
    && !/[:\\\x00-\x1f]/.test(value) && value.split('/').every(part => part && part !== '.' && part !== '..');
}

function hasPositiveExecution(report) {
  if (report?.passed !== true || report.selfcheckOnly === true) return false;
  return (Array.isArray(report.checks) && report.checks.length > 0)
    || (Number.isInteger(report.tests) && report.tests > 0)
    || report.unit?.tests > 0 || report.verification?.nativeTests > 0
    || report.output?.exitCode === 0 || (Array.isArray(report.commands) && report.commands.length > 0)
    || report.counterProbe?.passed === true;
}

async function readCatalogues(root) {
  const directory = 'docs/universe/catalogs';
  const supplemental = (await readdir(path.join(root, directory), { withFileTypes: true }))
    .filter(entry => entry.isFile() && entry.name.endsWith('.json'))
    .map(entry => `${directory}/${entry.name}`).sort();
  return Promise.all(['docs/content-catalog.json', ...supplemental].map(async filename => {
    const bytes = await readFile(path.join(root, filename));
    const { entries } = JSON.parse(bytes);
    if (!Array.isArray(entries)) throw new Error(`${filename}: entries doit être une liste.`);
    return { filename, entries, sha256: sha256(bytes) };
  }));
}

export async function checkProductionEvidence(projectRoot) {
  const root = await realpath(projectRoot);
  const catalogues = await readCatalogues(root);
  const knownIds = new Set(catalogues.flatMap(({ entries }) => entries.map(entry => entry.id)));
  const counts = Object.fromEntries(statuses.map(status => [status, 0]));
  const findings = [];
  const historicalReferences = [];
  const positiveReports = new Map();
  const files = new Map();
  const reports = new Map();

  function inspectFile(filename) {
    if (!isRelativeProjectPath(filename)) return Promise.resolve('invalid-project-path');
    if (!files.has(filename)) files.set(filename, (async () => {
      const inspection = await inspectProjectPath(root, filename);
      if (!inspection.isFile) return inspection.kind;
      return (await stat(path.join(root, filename))).size ? 'file' : 'empty-file';
    })());
    return files.get(filename);
  }

  function readReport(filename) {
    if (!reports.has(filename)) reports.set(filename, (async () => {
      const bytes = await readFile(path.join(root, filename));
      try {
        return { data: JSON.parse(bytes), sha256: sha256(bytes) };
      } catch (error) {
        if (!(error instanceof SyntaxError)) throw error;
        return null;
      }
    })());
    return reports.get(filename);
  }

  for (const { filename, entries } of catalogues) {
    for (const entry of entries) {
      const { id, status } = entry;
      const issue = (field, reason, value) => findings.push({ catalogue: filename, id, status, field, reason, value });
      if (!Object.hasOwn(counts, status)) {
        issue('status', 'unknown-status', status);
        continue;
      }
      counts[status]++;
      if (!implementationStatuses.has(status)) continue;

      const checkPaths = async (field, paths) => {
        if (!Array.isArray(paths)) {
          issue(field, 'expected-path-list', paths);
          return [];
        }
        const present = [];
        for (const candidate of new Set(paths)) {
          const kind = await inspectFile(candidate);
          if (kind === 'file') present.push(candidate);
          else issue(field, kind, candidate);
        }
        return present;
      };

      const assets = entry.assetPath == null || entry.assetPath === '' ? [] : [entry.assetPath];
      const implementations = [
        ...await checkPaths('assetPath', assets),
        ...await checkPaths('implementationPaths', entry.implementationPaths === undefined ? [] : entry.implementationPaths),
      ];
      if (!implementations.some(candidate => !candidate.startsWith('docs/qa/'))) {
        issue('implementationPaths', 'missing-implementation-file');
      }
      const dependencies = entry.dependencies === undefined ? [] : entry.dependencies;
      if (!Array.isArray(dependencies)) issue('dependencies', 'expected-dependency-list', dependencies);
      else for (const dependency of dependencies) {
        if (typeof dependency !== 'string' || !knownIds.has(dependency)) issue('dependencies', 'unknown-dependency', dependency);
      }

      const evidence = await checkPaths('evidence', entry.evidence === undefined ? [] : entry.evidence);
      if (status !== 'Validé') continue;

      let hasProof = false;
      for (const candidate of evidence.filter(isAuditReport)) {
        const report = await readReport(candidate);
        if (!report) issue('evidence', 'invalid-json-report', candidate);
        else if (hasPositiveExecution(report.data)) {
          hasProof = true;
          positiveReports.set(candidate, report.sha256);
        }
      }
      // Three old rows cite a named report in notes rather than in evidence[].
      const legacy = filename === 'docs/content-catalog.json' && Object.hasOwn(historicalEvidence, id)
        ? historicalEvidence[id] : null;
      if (!hasProof && entry.evidence === undefined && legacy && entry.assetPath === legacy.assetPath
          && typeof entry.notes === 'string' && entry.notes.includes(legacy.path)
          && await inspectFile(legacy.path) === 'file') {
        const report = await readReport(legacy.path);
        if (report?.sha256 === legacy.sha256 && report.data?.[legacy.section]?.passed === true) {
          hasProof = true;
          positiveReports.set(legacy.path, report.sha256);
          historicalReferences.push({ id, path: legacy.path, section: legacy.section, sha256: legacy.sha256 });
        }
      }
      if (!hasProof) issue('evidence', 'missing-positive-execution-report');
    }
  }

  return {
    passed: findings.length === 0,
    generatedAt: new Date().toISOString(),
    criterionId: 'QA-statut-de-production',
    exactCriterion: 'Chaque statut possède une preuve locale réelle.',
    checks: [
      'Comparer les statuts du catalogue avec les fichiers d’implémentation et les dépendances locales.',
      'Contrôler les fichiers de preuve déclarés et les rapports d’exécution positifs des fiches Validé.',
    ],
    catalogues: catalogues.length,
    catalogueSha256: Object.fromEntries(catalogues.map(({ filename, sha256 }) => [filename, sha256])),
    statuses: counts,
    rowsWithRequiredImplementation: counts.Intégré + counts.Validé,
    inspectedPaths: files.size,
    positiveReportPaths: positiveReports.size,
    positiveReportSha256: Object.fromEntries(positiveReports),
    toolSha256: {
      'scripts/check-production-evidence.mjs': sha256(await readFile(sourceFile)),
      'scripts/audit-fidelity.mjs': sha256(await readFile(new URL('./audit-fidelity.mjs', import.meta.url))),
    },
    historicalReferences,
    findings,
    scope: 'Cohérence des statuts et de leurs justificatifs locaux au moment de l’audit. L’évaluation du gameplay, de la fidélité artistique et l’exécution des rapports référencés relèvent de contrôles distincts.',
  };
}

async function main(args) {
  let root = path.resolve(path.dirname(sourceFile), '..'), output;
  for (let i = 0; i < args.length; i++) {
    const argument = args[i];
    if (argument === '--help') {
      console.log('node scripts/check-production-evidence.mjs [--root PROJET] [--output NOUVEAU_RAPPORT]');
      return;
    }
    if (argument !== '--root' && argument !== '--output') throw new Error(`Option inconnue : ${argument}`);
    const value = args[++i];
    if (!value || value.startsWith('--')) throw new Error(`Un chemin est requis pour ${argument}.`);
    if (argument === '--root') root = path.resolve(value);
    else output = value;
  }
  const report = await checkProductionEvidence(root);
  if (output) {
    const target = path.resolve(root, output);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });
  }
  console.log(JSON.stringify(report, null, 2));
  if (!report.passed) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === sourceFile) {
  await main(process.argv.slice(2)).catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
