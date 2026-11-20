import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

export const EDITORIAL_WORKS = Object.freeze(['ANN', 'ASC', 'DEC', 'INI', 'NEX', 'PL', 'RET', 'REV']);
const criterion = 'Sources accessibles ou limites tracées ; aucun long extrait, dialogue reproduit ou résumé continu substitutif.';
const longFields = ['description', 'adaptation', 'gameplay', 'visual', 'animation', 'audio', 'implementation', 'conditions', 'acceptance', 'notes', 'reference'];
const own = (value, key) => Object.hasOwn(value, key);
const words = text => text.match(/[\p{L}\p{N}]+(?:[-’'][\p{L}\p{N}]+)*/gu)?.length || 0;
const route = fileURLToPath(import.meta.url);
const projectRoot = path.join(path.dirname(route), '..');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const curl = promisify(execFile);

/** Check the catalogue's own editorial rules without comparing to unavailable books or images. */
export function inspectEditorialCatalogue(catalog) {
  if (!Array.isArray(catalog.entries) || !Array.isArray(catalog.sources)) throw new Error('Catalogue ou liste de sources illisible.');

  const findings = [];
  const sourceIds = new Set();
  const unattributed = Object.create(null);
  let longestField = { words: 0 };
  function inspectText(value, where) {
    if (typeof value !== 'string') return;
    const amount = words(value);
    if (amount > longestField.words) longestField = { ...where, words: amount };
    if (amount > 80) findings.push({ ...where, reason: 'Texte long à relire' });
    const spokenLines = value.split(/\r?\n/).filter(line => /^\s*(?:[—–-]\s+|[\p{Lu}][\p{L}\p{M} .’'-]{0,26}\s*:\s+)\S/u.test(line));
    if (spokenLines.length > 1) findings.push({ ...where, reason: 'Présentation en répliques à relire' });
    if ([...value.matchAll(/«([^»]*)»|"([^"\n]*)"/gu)].some(quote => words(quote[1] ?? quote[2]) > 20)) {
      findings.push({ ...where, reason: 'Citation longue à relire' });
    }
  }

  for (const source of catalog.sources) {
    const { id } = source;
    if (!id || sourceIds.has(id)) findings.push({ id, reason: 'Identifiant de source absent ou dupliqué' });
    sourceIds.add(id);
    if (!source.scope?.trim() || !source.note?.trim()) findings.push({ id, reason: 'Périmètre ou limite de consultation absent' });
    for (const field of ['scope', 'note']) inspectText(source[field], { id, field });
  }
  if (!catalog.canonNote?.trim() || !catalog.coverage?.some(item => item.remaining?.trim())) {
    findings.push({ id: catalog.id, reason: 'Limites éditoriales du catalogue absentes' });
  }
  for (const field of ['scope', 'summary', 'canonNote']) inspectText(catalog[field], { id: catalog.id, field });
  for (const area of catalog.coverage || []) {
    for (const field of ['covered', 'remaining']) inspectText(area[field], { id: catalog.id, area: area.area, field });
  }
  for (const entry of catalog.entries) {
    const { id, nature } = entry;
    if (!Array.isArray(entry.sourceIds) || entry.sourceIds.some(sourceId => !sourceIds.has(sourceId))) {
      findings.push({ id, reason: 'Provenance indiquée absente du registre' });
    }
    if (!entry.sourceIds?.length) {
      unattributed[nature] = (unattributed[nature] ?? 0) + 1;
      if (nature === 'Établi') findings.push({ id, reason: 'Fait établi sans référence liée' });
    }
    if (nature !== 'Extrapolation' && /(?:\bATB\b|\bDPS\b|\d+\s*(?:PV|points)\b)/iu.test(entry.gameplay || '')) {
      findings.push({ id, reason: 'Mesure de jeu hors du statut Extrapolation' });
    }
    for (const field of longFields) if (own(entry, field)) inspectText(entry[field], { id, field });
  }
  return { entries: catalog.entries.length, longestField, unattributed, findings };
}

export async function observeEditorialSource(source, allowedHosts) {
  let url;
  try { url = new URL(source.url); } catch { return { outcome: 'invalid-url', limit: 'Adresse non interprétable.' }; }
  if (url.protocol !== 'https:' || url.username || url.password || url.port) {
    return { outcome: 'invalid-url', limit: 'Adresse HTTPS publique attendue.' };
  }
  if (!allowedHosts.has(url.hostname)) {
    return { outcome: 'not-probed', limit: 'Hôte hors du périmètre réseau de cette exécution.' };
  }

  try {
    const { stdout } = await curl('curl', ['--disable', '--head', '--silent', '--max-time', '8', '--output',
      '/dev/null', '--write-out', '%{http_code}', '--', url.href], { maxBuffer: 1024 });
    const status = Number(stdout);
    if (status >= 200 && status < 300) {
      return { outcome: 'http-ok', status, limit: 'Réponse HTTP à HEAD. L’édition complète et les détails cités restent à vérifier dans la publication.' };
    }
    return { outcome: 'http-limited', status, limit: 'Absence d’accès direct par HEAD. La réponse ne confirme pas le contenu référencé.' };
  } catch (error) {
    return { outcome: 'request-limited', exitCode: typeof error.code === 'number' ? error.code : String(error.code || 'unknown'),
      limit: 'Requête HEAD sans résultat exploitable pendant cette exécution.' };
  }
}

async function audit({ root, allowedHosts }) {
  const cache = new Map();
  const works = [];
  for (const id of EDITORIAL_WORKS) {
    const filename = `docs/universe/catalogs/${id}.json`;
    const raw = await readFile(path.join(root, filename));
    const catalogue = JSON.parse(raw);
    const entry = catalogue.entries.find(item => item.id === `${id}-QA-SOURCES`);
    if (catalogue.id !== id || entry?.priority !== 'P0' || entry?.acceptance !== criterion) {
      throw new Error(`${id}: le critère P0 attendu est absent ou a changé.`);
    }
    const inspection = inspectEditorialCatalogue(catalogue);
    const references = [];
    for (const source of catalogue.sources) {
      if (!cache.has(source.url)) cache.set(source.url, await observeEditorialSource(source, allowedHosts));
      const observed = cache.get(source.url);
      if (observed.outcome === 'invalid-url') inspection.findings.push({ id: source.id, reason: observed.limit });
      references.push({ id: source.id, url: source.url, declaredLimit: source.note, ...observed });
    }
    works.push({ id, criterionId: entry.id, exactCriterion: entry.acceptance, file: filename,
      sha256: sha256(raw), ...inspection, references });
  }
  return {
    passed: works.every(work => work.findings.length === 0),
    generatedAt: new Date().toISOString(),
    checks: ['Champs éditoriaux, références et nature des fiches', 'Réponses HEAD des hôtes autorisés et limites explicites partout ailleurs'],
    sourceSha256: sha256(await readFile(route)),
    probedHosts: [...allowedHosts],
    works,
    scope: 'Audit des fiches éditoriales et métadonnées du registre. Le repérage de champs longs et de répliques est conservateur. Aucune comparaison textuelle exhaustive avec les éditions originales n’est déduite des réponses HEAD.',
  };
}

async function main(args) {
  const options = { root: projectRoot, allowedHosts: new Set() };
  let output;
  for (let index = 0; index < args.length; index += 2) {
    const [option, value] = args.slice(index, index + 2);
    if (!value || value.startsWith('--')) throw new Error(`Valeur requise pour ${option}.`);
    if (option === '--root') options.root = path.resolve(value);
    else if (option === '--output') output = value;
    else if (option === '--probe-host') options.allowedHosts.add(value);
    else throw new Error(`Option inconnue : ${option}.`);
  }
  const report = await audit(options);
  if (output) await writeFile(output, `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });
  console.log(JSON.stringify({ passed: report.passed, works: report.works.length,
    entries: report.works.reduce((total, work) => total + work.entries, 0),
    references: report.works.reduce((total, work) => total + work.references.length, 0),
    findings: report.works.flatMap(work => work.findings.map(finding => ({ work: work.id, ...finding }))), output }));
  if (!report.passed) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === route) {
  await main(process.argv.slice(2)).catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
