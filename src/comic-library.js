import { getUniverseRecord, getUniverseWork } from './universe-data.js';
import { productionSourceURL } from './continuation-catalogue.js';
import { createLibraryPreferences, normalizeLibraryPreferences, updateLibraryPreferences,
  encodeLibraryPreferences, decodeLibraryPreferences, loadLibraryPreferences, saveLibraryPreferences } from './comic-library-preferences.js';
export { COMIC_LIBRARY_PREFERENCES_KEY } from './comic-library-preferences.js';

const libraryId = 'LIB';
const library = getUniverseWork(libraryId);
const volumes = [
  { number: 1, works: [['RED', 4], ['EVO', 4], ['INV', 4], ['HOM', 4], ['INC'], ['INQ'], ['CON']],
    bonusIds: ['LIB-BONUS-VOL1BONUS'] },
  { number: 2, works: [['FOU', 13], ['HWB', 0, 'Récit FCBD 2013'], ['BLA', 0, 'Récit autonome']],
    announcementId: 'LIB-REF-VOL2', isbn: '9781616556365',
    bonusIds: ['LIB-BONUS-ANNOTATIONS', 'LIB-BONUS-COVERS', 'LIB-BONUS-SKETCHES'] },
];
const editionReferences = [
  { id: 'omnibus-1', recordId: 'LIB-EDITION-OMNI1', works: ['RED', 'EVO', 'INV', 'HOM'] },
  { id: 'omnibus-2', recordId: 'LIB-EDITION-OMNI2', works: ['FOU', 'HWB', 'BLA'] },
  { id: 'complete-comics', recordId: 'LIB-EDITION-COMPLETE', works: ['DIS'] },
];
const ownerTitle = work => work.title.replace(/^Mass Effect(?:\s*[:–—]\s*|\s+)/u, '');
const escapeDefault = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]));

// Two print appearances reuse the same unit ID. The owner continues to define
// every playable chapter, even if an issue corresponds to several windows.
function unitPeriods(work, issue) {
  if (work.locked) return [];
  const periods = work.periods;
  if (work.id === 'EVO') return periods.filter(period => period.id === (issue === 1 ? 'evo-contact' : 'evo-aftermath'));
  if (['FOU', 'HOM'].includes(work.id)) {
    const prefix = `${work.id.toLowerCase()}-${issue}`;
    return periods.filter(period => period.id === prefix || period.id.startsWith(prefix + '-'));
  }
  return periods;
}
function documentaryRecord(id, work = library) {
  const record = id && getUniverseRecord(id);
  if (!record || record.catalogWorkId !== work.id) return null;
  return {
    id: record.id, name: record.name, nature: record.nature, reference: record.reference,
    description: record.description, sources: work.sources.filter(source => record.sourceIds.includes(source.id))
      .map(({ id, title, url, kind, scope, note }) => ({ id, title, url: productionSourceURL(url), kind, scope, note })),
  };
}
function ownerIndex(workId, issueCount = 0, singleLabel = 'Récit court') {
  const work = getUniverseWork(workId), locator = documentaryRecord(`LIB-STORY-${workId}`);
  if (!work) return null;
  const issues = issueCount ? Array.from({ length: issueCount }, (_, index) => index + 1) : [null];
  return {
    id: work.id, title: ownerTitle(work), locator, documentaryOnly: work.locked === true, count: work.count,
    description: documentaryRecord(`${workId}-REF-SCOPE`, work)?.description || '',
    range: issueCount ? `#1–${issueCount}` : singleLabel,
    units: issues.map(issue => ({
      id: `${work.id}:${issue ?? 'single'}`, issue, label: issue === null ? singleLabel : `#${issue}`,
      // There is no verified page in the matching hardcover. Publisher
      // catalogue locators belong to the notice, never to the narrative unit.
      page: null,
      periods: unitPeriods(work, issue).map(({ id, label, uncertainty, yearStart, yearEnd }) => ({
        id, label, uncertainty, yearStart, yearEnd,
      })),
    })),
  };
}

export function getComicLibraryIndex() {
  const annotated = volumes.map(volume => ({
    number: volume.number, format: 'Édition reliée', isbn: volume.isbn || null,
    announcement: documentaryRecord(volume.announcementId),
    works: volume.works.map(spec => ownerIndex(...spec)).filter(work => work?.locator),
    bonuses: volume.bonusIds.map(id => documentaryRecord(id)).filter(Boolean).map(record => ({ ...record, page: null })),
  }));
  const uniqueWorks = annotated.flatMap(volume => volume.works);
  const relatedEditions = editionReferences.map(edition => ({
    id: edition.id, publication: documentaryRecord(edition.recordId),
    works: edition.works.map(getUniverseWork).filter(Boolean).map(work => {
      const unitIds = uniqueWorks.find(row => row.id === work.id)?.units.map(unit => unit.id) || [];
      return { id: work.id, title: ownerTitle(work), linkId: unitIds.length ? `${edition.id}/${work.id}` : work.id, unitIds };
    }),
  })).filter(row => row.publication);
  return {
    volumes: annotated, relatedEditions, workCount: new Set(uniqueWorks.map(work => work.id)).size,
    unitCount: new Set(uniqueWorks.flatMap(work => work.units.map(unit => unit.id))).size,
  };
}

export function getComicLibraryTarget(id) {
  if (typeof id !== 'string') return null;
  const index = getComicLibraryIndex();
  const reference = index.relatedEditions.flatMap(edition => edition.works).find(work => work.linkId === id);
  const mediaId = reference?.id || id.split(':')[0];
  const primary = index.volumes.flatMap(volume => volume.works).find(work => work.id === mediaId);
  if (!primary && !reference) return null;
  const work = getUniverseWork(mediaId);
  if (reference || id === mediaId) return { mediaId, periodId: work.periods.length === 1 ? work.periods[0].id : '' };
  const unit = primary?.units.find(unit => unit.id === id);
  return unit ? { mediaId, periodId: unit.periods.length === 1 ? unit.periods[0].id : '' } : null;
}

export const createComicLibraryPreferences = () => createLibraryPreferences();
export const normalizeComicLibraryPreferences = raw => normalizeLibraryPreferences(raw, getComicLibraryIndex());
export const updateComicLibraryPreferences = (raw, command) => updateLibraryPreferences(raw, command, getComicLibraryIndex());
export const encodeComicLibraryPreferences = raw => encodeLibraryPreferences(raw, getComicLibraryIndex());
export const decodeComicLibraryPreferences = raw => decodeLibraryPreferences(raw, getComicLibraryIndex());
export const loadComicLibraryPreferences = storage => loadLibraryPreferences(storage, getComicLibraryIndex());
export const saveComicLibraryPreferences = (storage, raw) => saveLibraryPreferences(storage, raw, getComicLibraryIndex());

const consultationLabels = { unseen: 'À consulter', 'in-progress': 'En cours', consulted: 'Consulté' };
function consultationControls(id, label, preferences, readOnly, esc) {
  const marked = preferences.bookmarks.includes(id), status = preferences.consultation[id] || 'unseen';
  return `<div class="comic-library-personal">
    <button class="secondary comic-library-bookmark" data-do="comic-library-bookmark" data-id="${esc(id)}"
      aria-pressed="${marked}" aria-label="${esc(`${marked ? 'Retirer le marque-page' : 'Marquer'} · ${label}`)}" ${readOnly ? 'disabled' : ''}>${marked ? '★ Marque-page' : '☆ Marquer'}</button>
    <label><span>Consultation personnelle · ${esc(label)}</span><select data-library-consultation data-id="${esc(id)}" ${readOnly ? 'disabled' : ''}>
      ${Object.entries(consultationLabels).map(([value, text]) => `<option value="${value}" ${status === value ? 'selected' : ''}>${text}</option>`).join('')}
    </select></label>
  </div>`;
}
const openSection = (id, preferences, esc) => `data-library-section="${esc(id)}"${preferences.expanded.includes(id) ? ' open' : ''}`;
function workOrder(works, preferences) {
  if (preferences.sort === 'volume') return works;
  const title = (left, right) => left.title.localeCompare(right.title, 'fr') || left.id.localeCompare(right.id);
  const marked = work => preferences.bookmarks.includes(work.id) || work.units.some(unit => preferences.bookmarks.includes(unit.id));
  const rank = work => ({ unseen: 0, 'in-progress': 1, consulted: 2 })[preferences.consultation[work.id] || 'unseen'];
  return [...works].sort((left, right) => preferences.sort === 'bookmarks' ? Number(marked(right)) - Number(marked(left)) || title(left, right)
    : preferences.sort === 'consultation' ? rank(left) - rank(right) || title(left, right) : title(left, right));
}
function resumeLabel(index, id) {
  for (const work of index.volumes.flatMap(volume => volume.works)) {
    if (work.id === id) return work.title;
    const unit = work.units.find(unit => unit.id === id);
    if (unit) return `${work.title} · ${unit.label}`;
  }
  return index.relatedEditions.flatMap(edition => edition.works).find(work => work.id === id)?.title || '';
}

function sourcesFor(record, esc) {
  if (!record?.sources.length) return '';
  return `<ul class="comic-library-sources">${record.sources.map(source => `<li data-comic-source="${esc(source.id)}">
    ${source.url ? `<a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.title)}</a>` : esc(source.title)}
    <span>${esc(source.scope)}</span>${source.note ? `<small>${esc(source.note)}</small>` : ''}
  </li>`).join('')}</ul>`;
}
function recordCard(record, esc) {
  if (!record) return '';
  return `<article data-comic-document="${esc(record.id)}"><h5>${esc(record.name)}</h5>
    <p>${esc(record.description)}</p>
    <p class="small">${esc(record.reference)} · ${esc(record.nature)}</p>${sourcesFor(record, esc)}
  </article>`;
}
const linkToWork = (id, label, esc) => `<button class="secondary comic-library-link" data-do="comic-library-open"
  data-id="${esc(id)}">${esc(label)}</button>`;
function periodCard(period, esc) {
  const year = Number.isInteger(period.yearStart)
    ? (period.yearEnd !== null && period.yearEnd !== period.yearStart ? `${period.yearStart}–${period.yearEnd}` : String(period.yearStart))
    : 'Date non fixée';
  return `<li data-comic-period="${esc(period.id)}"><strong>${esc(period.label)}</strong> · ${esc(year)}
    ${period.uncertainty ? `<small>${esc(period.uncertainty)}</small>` : ''}</li>`;
}
function workCard(work, esc, preferences, readOnly) {
  const openLabel = work.documentaryOnly ? 'Ouvrir la référence' : 'Ouvrir le dossier';
  return `<article class="comic-library-work" data-comic-work="${esc(work.id)}">
    <div class="comic-library-work-head">
      <div><h5>${esc(work.title)}</h5><p>${esc(work.range)}</p></div>
      ${linkToWork(work.id, `${openLabel} · ${work.title}`, esc)}
    </div>
    ${consultationControls(work.id, work.title, preferences, readOnly, esc)}
    <p class="small comic-library-work-nature">${esc(work.locator.nature)} · Inclusion dans l’édition reliée</p>
    ${work.description ? `<p class="small">${esc(work.description)}</p>` : ''}
    <details class="comic-library-units" ${openSection(`units:${work.id}`, preferences, esc)}>
      <summary>${esc(work.title)} · Unités et repères</summary>
      <p class="small">Pagination de l’exemplaire à relever.</p>
      <ol>${work.units.map(unit => `<li data-comic-unit="${esc(unit.id)}">
        ${linkToWork(unit.id, `${work.title} · ${unit.label}`, esc)}
        ${consultationControls(unit.id, `${work.title} · ${unit.label}`, preferences, readOnly, esc)}
        ${unit.periods.length ? `<ol class="comic-library-periods" aria-label="Repères de continuité">${unit.periods.map(period => periodCard(period, esc)).join('')}</ol>`
          : '<p class="small">Fiction interne · référence éditoriale.</p>'}
      </li>`).join('')}</ol>
      ${sourcesFor(work.locator, esc)}
    </details>
  </article>`;
}

export function renderComicLibrary({ esc = escapeDefault, preferences: rawPreferences, readOnly = false } = {}) {
  const index = getComicLibraryIndex();
  const preferences = normalizeLibraryPreferences(rawPreferences, index) || createLibraryPreferences();
  const works = index.volumes.flatMap(volume => volume.works), units = works.flatMap(work => work.units);
  const consultedWorks = works.filter(work => preferences.consultation[work.id] === 'consulted').length;
  const consultedUnits = units.filter(unit => preferences.consultation[unit.id] === 'consulted').length;
  return `<section class="comic-library" data-comic-library aria-label="Sommaire Library Edition">
    <p class="comic-library-count" data-library-work-count="${index.workCount}" data-library-unit-count="${index.unitCount}">
      ${index.workCount} récits référencés · ${index.unitCount} unités
    </p>
    <p class="brief-copy">Chaque renvoi ouvre le dossier du récit et ses propres périodes.</p>
    <div class="comic-library-preferences"><label for="comic-library-sort">Tri des récits dans chaque volume<select id="comic-library-sort" ${readOnly ? 'disabled' : ''}>
      ${[['volume','Ordre du sommaire'],['title','Titre'],['consultation','État de consultation'],['bookmarks','Marque-pages d’abord']].map(([value,label]) => `<option value="${value}" ${preferences.sort === value ? 'selected' : ''}>${label}</option>`).join('')}
    </select></label><p class="small" data-library-bookmark-count="${preferences.bookmarks.length}" data-library-consulted-work-count="${consultedWorks}" data-library-consulted-unit-count="${consultedUnits}">
      ${preferences.bookmarks.length} marque-page${preferences.bookmarks.length > 1 ? 's' : ''} · ${consultedWorks}/${index.workCount} dossiers de récits consultés · ${consultedUnits}/${index.unitCount} unités consultées.</p>
      ${preferences.lastTarget ? `<button class="secondary" data-do="comic-library-resume" data-id="${esc(preferences.lastTarget)}">Reprendre la consultation · ${esc(resumeLabel(index, preferences.lastTarget))}</button>` : ''}
    </div>
    <p class="small comic-library-personal-note">Repères personnels de consultation des dossiers : ils n’attestent pas la lecture intégrale du comic ou la vérification d’un exemplaire. Aucun chapitre, objet ou récompense n’est validé par ces repères.</p>
    ${readOnly ? '<p class="comic-library-readonly" role="status" data-library-readonly>Préférences en lecture seule : stockage indisponible ou données illisibles. Les dossiers restent accessibles.</p>' : ''}
    ${index.volumes.map(volume => `<section class="comic-library-volume" data-comic-volume="${volume.number}" aria-labelledby="comic-library-volume-${volume.number}">
      <h4 id="comic-library-volume-${volume.number}">Volume ${volume.number}</h4>
      <p class="small">${esc(volume.format)}${volume.isbn ? ` · ISBN ${esc(volume.isbn)}` : ''}</p>
      ${volume.announcement ? `<details ${openSection(`notice:${volume.number}`, preferences, esc)}><summary>Notice du volume ${volume.number}</summary>${recordCard(volume.announcement, esc)}</details>` : ''}
      <div class="comic-library-works">${workOrder(volume.works, preferences).map(work => workCard(work, esc, preferences, readOnly)).join('')}</div>
      <details class="comic-library-bonuses" ${openSection(`bonuses:${volume.number}`, preferences, esc)}><summary>Bonus éditoriaux · volume ${volume.number}</summary>
        <p class="small">Pagination de l’exemplaire à relever.</p>
        ${volume.bonuses.map(record => recordCard(record, esc)).join('')}
      </details>
    </section>`).join('')}
    <section class="comic-library-related" aria-labelledby="comic-library-related">
      <h4 id="comic-library-related">Éditions liées</h4>
      ${index.relatedEditions.map(edition => `<details data-comic-edition="${edition.id}" ${openSection(`edition:${edition.id}`, preferences, esc)}><summary>${esc(edition.publication.name)}</summary>
        <p>${esc(edition.publication.description)}</p>
        <ul>${edition.works.map(work => `<li data-comic-related-work="${esc(work.id)}">
          ${linkToWork(work.linkId, work.title, esc)}
        </li>`).join('')}</ul>
        ${sourcesFor(edition.publication, esc)}
      </details>`).join('')}
    </section>
  </section>`;
}
