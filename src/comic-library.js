import { getUniverseRecord, getUniverseWork } from './universe-data.js';
import { productionSourceURL } from './continuation-catalogue.js';

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
function workCard(work, esc) {
  const openLabel = work.documentaryOnly ? 'Ouvrir la référence' : 'Ouvrir le dossier';
  return `<article class="comic-library-work" data-comic-work="${esc(work.id)}">
    <div class="comic-library-work-head">
      <div><h5>${esc(work.title)}</h5><p>${esc(work.range)}</p></div>
      ${linkToWork(work.id, `${openLabel} · ${work.title}`, esc)}
    </div>
    <p class="small comic-library-work-nature">${esc(work.locator.nature)} · Inclusion dans l’édition reliée</p>
    ${work.description ? `<p class="small">${esc(work.description)}</p>` : ''}
    <details class="comic-library-units">
      <summary>${esc(work.title)} · Unités et repères</summary>
      <p class="small">Pagination de l’exemplaire à relever.</p>
      <ol>${work.units.map(unit => `<li data-comic-unit="${esc(unit.id)}">
        ${linkToWork(unit.id, `${work.title} · ${unit.label}`, esc)}
        ${unit.periods.length ? `<ol class="comic-library-periods" aria-label="Repères de continuité">${unit.periods.map(period => periodCard(period, esc)).join('')}</ol>`
          : '<p class="small">Fiction interne · référence éditoriale.</p>'}
      </li>`).join('')}</ol>
      ${sourcesFor(work.locator, esc)}
    </details>
  </article>`;
}

export function renderComicLibrary({ esc = escapeDefault } = {}) {
  const index = getComicLibraryIndex();
  return `<section class="comic-library" data-comic-library aria-label="Sommaire Library Edition">
    <p class="comic-library-count" data-library-work-count="${index.workCount}" data-library-unit-count="${index.unitCount}">
      ${index.workCount} récits référencés · ${index.unitCount} unités
    </p>
    <p class="brief-copy">Chaque renvoi ouvre le dossier du récit et ses propres périodes.</p>
    ${index.volumes.map(volume => `<section class="comic-library-volume" data-comic-volume="${volume.number}" aria-labelledby="comic-library-volume-${volume.number}">
      <h4 id="comic-library-volume-${volume.number}">Volume ${volume.number}</h4>
      <p class="small">${esc(volume.format)}${volume.isbn ? ` · ISBN ${esc(volume.isbn)}` : ''}</p>
      ${volume.announcement ? `<details><summary>Notice du volume ${volume.number}</summary>${recordCard(volume.announcement, esc)}</details>` : ''}
      <div class="comic-library-works">${volume.works.map(work => workCard(work, esc)).join('')}</div>
      <details class="comic-library-bonuses"><summary>Bonus éditoriaux · volume ${volume.number}</summary>
        <p class="small">Pagination de l’exemplaire à relever.</p>
        ${volume.bonuses.map(record => recordCard(record, esc)).join('')}
      </details>
    </section>`).join('')}
    <section class="comic-library-related" aria-labelledby="comic-library-related">
      <h4 id="comic-library-related">Éditions liées</h4>
      ${index.relatedEditions.map(edition => `<details data-comic-edition="${edition.id}"><summary>${esc(edition.publication.name)}</summary>
        <p>${esc(edition.publication.description)}</p>
        <ul>${edition.works.map(work => `<li data-comic-related-work="${esc(work.id)}">
          ${linkToWork(work.linkId, work.title, esc)}
        </li>`).join('')}</ul>
        ${sourcesFor(edition.publication, esc)}
      </details>`).join('')}
    </section>
  </section>`;
}
