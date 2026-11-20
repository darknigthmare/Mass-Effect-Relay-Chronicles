import { comicFictionReferences, getComicBriefing, listComicBriefings } from './comic-briefings.js';
import { getComicLibraryTarget, renderComicLibrary } from './comic-library.js';
import { getUniverseRecord, getUniverseWork } from './universe-data.js';

export { getComicLibraryTarget };
const comicWorks = new Set(['RED', 'EVO', 'INV', 'HOM', 'FOU', 'INC', 'INQ', 'CON', 'BLA', 'HWB', 'LIB', 'DIS']);
const relatedWorks = {
  RED: ['ME2'], EVO: ['ME1'], INV: ['ME3'], HOM: ['ME1', 'ME2', 'ME3'], FOU: ['ME1', 'ME2', 'ME3'],
  INC: ['RED', 'ME2'], INQ: ['ME2'], CON: ['ME2', 'PL'], BLA: ['ME1'], HWB: ['ME1'], DIS: ['MEA'],
};

function sourceLink(source, esc) {
  return `<a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer" data-comic-source="${esc(source.id)}">${esc(source.title)}</a>`;
}

function journal(anchors, adaptation, esc) {
  return `<section class="comic-journal" data-comic-journal aria-label="Provenance du dossier">
    ${anchors.map(anchor => `<article data-comic-origin="${esc(anchor.category)}" data-comic-anchor="${esc(anchor.id)}">
      <span class="comic-origin">${esc(anchor.category)}</span><h5>${esc(anchor.title)}</h5>
      <p>${esc(anchor.description)}</p>
      ${anchor.reference ? `<p data-comic-reference>${esc(anchor.reference)}</p>` : ''}
      <div class="comic-sources">${anchor.sources.map(source => sourceLink(source, esc)).join('')}</div>
    </article>`).join('')}
    ${adaptation ? '<article data-comic-origin="Adaptation"><span class="comic-origin">Adaptation</span><p>Exercice d’archives original pour Relay Chronicles. Son classement reste dans cette chronique.</p></article>' : ''}
  </section>`;
}

function timeline(work, selected, esc) {
  const place = getUniverseRecord(`${work.id}-CNT-PLACE`);
  return `<details class="comic-timeline" data-comic-timeline ${selected ? '' : 'open'}><summary>Repères et liens entre œuvres</summary>
    ${place ? `<p>${esc(place.description)}</p>` : ''}
    ${work.periods.length ? `<ol>${work.periods.map(period => `<li ${period.id === selected ? 'aria-current="step"' : ''}>
      <button class="secondary" data-do="comic-period" data-id="${esc(period.id)}">${esc(period.label)}</button>
      <p>${esc(period.uncertainty)}</p>
      <div class="comic-sources">${period.sourceIds.map(id => work.sources.find(source => source.id === id))
        .filter(source => source && /^https?:\/\//.test(source.url)).map(source => sourceLink(source, esc)).join('')}</div>
    </li>`).join('')}</ol>` : ''}
    ${relatedWorks[work.id]?.length ? `<div class="button-row">${relatedWorks[work.id].map(id => {
      const linked = getUniverseWork(id);
      return `<button class="secondary" data-do="comic-related" data-id="${esc(id)}">${esc(linked.title)}</button>`;
    }).join('')}</div>` : ''}
  </details>`;
}

function briefingAction(briefing, esc) {
  const { phase, state, trace, review } = briefing;
  if (phase === 'select') return `<div class="comic-methods">
    <button class="secondary" data-do="comic-briefing-method" data-id="trace"><strong>Ordonner les pièces</strong><small>Replacer les trois repères du dossier.</small></button>
    <button class="secondary" data-do="comic-briefing-method" data-id="review"><strong>Vérifier le classement</strong><small>Choisir la fiche de synthèse exacte.</small></button>
  </div>`;
  if (phase === 'trace') return `<p role="status">${state.step} / 3 pièces classées</p><ol class="comic-trace">
    ${[2, 0, 1].map(index => `<li><button class="secondary" data-do="comic-briefing-pick" data-id="${index}" ${index < state.step ? 'disabled' : ''}>
      <strong>${esc(trace[index].label)}</strong><small>${esc(trace[index].text)}${index < state.step ? ' · Classé' : ''}</small>
    </button></li>`).join('')}</ol>`;
  if (phase === 'review') return `<details class="comic-pieces" open><summary>Pièces à examiner</summary>
    <ul>${trace.map(card => `<li><strong>${esc(card.label)}</strong><p>${esc(card.text)}</p></li>`).join('')}</ul></details>
    <p>${esc(review.prompt)}</p><ul class="comic-trace">
    ${review.choices.map((choice, index) => `<li><button class="secondary" data-do="comic-briefing-pick" data-id="${index}">${esc(choice)}</button></li>`).join('')}</ul>`;
  if (phase === 'summary') return `<div class="comic-summary">
    <p role="status">Vérification terminée. Le dossier peut être classé.</p>
    <details><summary>Lire le bilan</summary><p>${esc(briefing.resolution)}</p></details>
    <div class="button-row"><button class="primary" data-do="comic-briefing-finish" data-id="archive">Classer le dossier</button>
    <button class="secondary" data-do="comic-briefing-finish" data-id="skip">Passer le bilan et classer</button></div>
  </div>`;
  return `<div class="comic-summary"><p data-comic-resolution>${esc(briefing.resolution)}</p>
    ${briefing.receipt ? `<details data-comic-receipt><summary>Annexe du dossier</summary><p>${esc(briefing.receipt)}</p></details>` : ''}
    <button class="secondary" data-do="comic-briefing-restart">Rejouer le dossier</button></div>`;
}

function renderBriefing(briefing, esc) {
  const { id, title, objective, phase, state, optional, anchors } = briefing;
  return `<article class="comic-briefing" data-comic-briefing="${esc(id)}" data-comic-phase="${phase}" tabindex="-1">
    <div class="comic-header"><div><span class="comic-origin">Exercice d’archives · Adaptation</span><h4>${esc(title)}</h4><p>${esc(objective)}</p></div>
      <button class="secondary" data-do="comic-briefing-back">Liste des dossiers</button></div>
    ${briefingAction(briefing, esc)}
    ${state && !state.closed && !state.extra ? `<button class="secondary comic-extra" data-do="comic-briefing-optional">${esc(optional.label)} <small>Facultatif</small></button>` : ''}
    ${state?.extra ? `<p class="comic-extra" data-comic-extra>${esc(optional.text)}</p>` : ''}
    ${journal(anchors, true, esc)}
    <div class="button-row"><button class="secondary" data-do="chronicle-export">Exporter la chronique</button></div>
  </article>`;
}

export function renderComicReading(view, ui, esc) {
  if (ui.mediaId === '') return '<div class="comic-reading"><button class="secondary" data-do="comic-library-back">Ouvrir le sommaire des BD</button></div>';
  if (!comicWorks.has(ui.mediaId)) return '';
  if (ui.mediaId === 'LIB') return renderComicLibrary({ esc });
  const work = getUniverseWork(ui.mediaId);
  const context = view.context?.mediaId === work.id ? view.context : null;
  const ownsSession = !!context && view.session?.context?.mediaId === context.mediaId
    && view.session.context.periodId === context.periodId && view.session.context.galaxy === context.galaxy;
  const progress = ownsSession ? view.session.comicProgress : null;
  const briefing = ownsSession && getComicBriefing(context, ui.comicId, progress?.[ui.comicId]);
  const entries = ownsSession ? listComicBriefings(context) : [];
  return `<section class="comic-reading" data-comic-archive data-media-id="${esc(work.id)}" data-period-id="${esc(context?.periodId)}">
    <div class="comic-header"><h3>${work.id === 'BLA' ? 'Fiction dans l’univers' : 'Dossiers BD'}</h3>
      <button class="secondary" data-do="comic-library-back">Library Edition</button></div>
    ${work.id === 'BLA' ? comicFictionReferences().map(entry => journal(entry.anchors, false, esc)).join('') : ''}
    ${briefing ? renderBriefing(briefing, esc) : entries.length ? `<ul class="comic-list" data-comic-briefing-list>
      ${entries.map(entry => `<li><button class="secondary" data-do="comic-briefing-open" data-id="${esc(entry.id)}">
        <strong>${esc(entry.title)}</strong><small>${esc(entry.objective)}</small>
        ${progress?.[entry.id] ? `<span>${progress[entry.id].closed ? 'Classé' : 'En cours'}</span>` : ''}
      </button></li>`).join('')}</ul>` : ''}
    ${timeline(work, context?.periodId, esc)}
  </section>`;
}
