import { UNIVERSE_WORKS, UNIVERSE_RECORDS, UNIVERSE_SUMMARY } from './universe-data.js';

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const statuses = ['Défini', 'Prototype', 'Intégré', 'Validé'];
const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export function productionSourceURL(value) {
  try { const url = new URL(value); return url.protocol === 'https:' ? url.href : ''; } catch { return ''; }
}
export function getProductionCatalogueView(filters = {}) {
  const workId = UNIVERSE_WORKS.some(work => work.id === filters.workId) ? filters.workId : 'all';
  const status = statuses.includes(filters.status) ? filters.status : '';
  const query = typeof filters.query === 'string' ? filters.query.slice(0, 300) : '';
  const needle = normalize(query.trim());
  const records = UNIVERSE_RECORDS.filter(record => (workId === 'all' || record.catalogWorkId === workId)
    && (!status || record.status === status) && (!needle || normalize([record.id, record.name, record.description, record.category].join(' ')).includes(needle)));
  const pages = Math.max(1, Math.ceil(records.length / 12));
  const page = Math.min(pages - 1, Math.max(0, Number.isSafeInteger(filters.page) ? filters.page : 0));
  const visible = records.slice(page * 12, page * 12 + 12);
  const selected = visible.find(record => record.id === filters.recordId) || visible[0] || null;
  return { workId, status, query, page, pages, records, visible, selected,
    counts: Object.fromEntries(statuses.map(status => [status, UNIVERSE_RECORDS.filter(record => record.status === status).length])),
    total: UNIVERSE_SUMMARY.recordCount, sourceCount: UNIVERSE_SUMMARY.sourceCount };
}
const workOptions = (selected, all = true) => `${all ? '<option value="all">Toutes les œuvres</option>' : ''}${UNIVERSE_WORKS.map(work => `<option value="${esc(work.id)}" ${work.id === selected ? 'selected' : ''}>${esc(work.title)}</option>`).join('')}`;
function sourceCards(work, ids) {
  const sources = ids ? work.sources.filter(source => ids.includes(source.id)) : work.sources;
  return sources.map(source => {
    const url = productionSourceURL(source.url);
    return `<article class="production-source"><h4>${esc(source.title || source.id)}</h4><p class="small">${esc(source.scope || 'Périmètre à vérifier dans la référence.')}</p>${url ? `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">Consulter la référence</a>` : '<span class="small">Lien de référence non disponible.</span>'}</article>`;
  }).join('') || '<p class="small">Aucune référence liée à cette fiche.</p>';
}
export function renderProductionResults(filters = {}) {
  const view = getProductionCatalogueView(filters), record = view.selected;
  const work = record && UNIVERSE_WORKS.find(work => work.id === record.catalogWorkId);
  return `<p role="status" data-production-count>${view.records.length} fiche${view.records.length === 1 ? '' : 's'} · page ${view.page + 1} / ${view.pages}</p><div class="production-layout"><nav class="production-records" aria-label="Fiches de production">${view.visible.map(item => `<button class="secondary ${item.id === record?.id ? 'active' : ''}" data-do="production-record" data-id="${esc(item.id)}" aria-pressed="${item.id === record?.id}"><strong>${esc(item.name)}</strong><span>${esc(item.id)} · ${esc(item.status)}</span></button>`).join('') || '<p>Aucune fiche ne correspond aux filtres.</p>'}<div class="button-row"><button class="secondary" data-do="production-page" data-id="${view.page - 1}" ${!view.page ? 'disabled' : ''}>Précédent</button><button class="secondary" data-do="production-page" data-id="${view.page + 1}" ${view.page + 1 >= view.pages ? 'disabled' : ''}>Suivant</button></div></nav>${record ? `<article class="production-detail" data-production-record="${esc(record.id)}"><span class="pill">Fiche de production · ${esc(record.status)}</span><h3>${esc(record.name)}</h3><p>${esc(record.description)}</p><dl><dt>Catalogue</dt><dd>${esc(work.title)}</dd><dt>Œuvre de référence</dt><dd>${esc(record.mediaId)}</dd><dt>Périmètre</dt><dd>${esc(work.scope || work.canonNote || 'Référence documentaire')}</dd><dt>Repère</dt><dd>${esc(record.reference)}</dd></dl><p class="small">Ce statut décrit le livrable suivi. Il ne rend pas cette fiche jouable et ne débloque aucun contenu dans votre campagne.</p>${record.conditions ? `<p>${esc(record.conditions)}</p>` : ''}${record.notes ? `<details><summary>Historique et limites</summary><p>${esc(record.notes)}</p></details>` : ''}<h4>Références de la fiche</h4>${sourceCards(work, record.sourceIds)}</article>` : ''}</div>`;
}
export function renderProductionCatalogue(filters = {}) {
  const view = getProductionCatalogueView(filters);
  return `<section data-production-catalogue><p class="brief-copy">Le plan de production réunit ${view.total} fiches et ${view.sourceCount} références de sources. Une fiche décrite, une adaptation jouable et une représentation fidèle sont des livrables distincts.</p><div class="production-counts">${statuses.map(status => `<span><strong>${view.counts[status]}</strong>${status}</span>`).join('')}</div><p class="small">Défini : travail prévu. Prototype : réalisation partielle. Intégré : raccordement vérifié. Validé : critère de la fiche contrôlé, sans certification de l’ensemble du jeu original.</p><div class="production-filters"><label class="field" for="production-work">Catalogue<select id="production-work" data-production-filter="workId">${workOptions(view.workId)}</select></label><label class="field" for="production-status">Statut<select id="production-status" data-production-filter="status"><option value="">Tous les statuts</option>${statuses.map(status => `<option ${view.status === status ? 'selected' : ''}>${status}</option>`).join('')}</select></label><label class="field" for="production-search">Rechercher<input id="production-search" type="search" maxlength="300" value="${esc(view.query)}" placeholder="Nom, identifiant ou description"></label></div><div id="production-results">${renderProductionResults(filters)}</div></section>`;
}
export function renderProductionCredits(workId = 'ME1') {
  const work = UNIVERSE_WORKS.find(work => work.id === workId) || UNIVERSE_WORKS[0];
  return `<section data-production-credits><p class="brief-copy">Conception et réalisation pour Darknigthmare. Univers, personnages et noms Mass Effect : Electronic Arts et BioWare. Adaptation de fan indépendante et non officielle.</p><div class="production-scope"><article><h3>Campagne ME1</h3><p>Cartes condensées, dialogues français réécrits et règles ATB adaptées. Le codex et les connaissances suivent les événements de cette campagne.</p></article><article><h3>Chroniques</h3><p>Lectures documentaires, préparations et exercices limités à leur œuvre et leur période. Les campagnes originales complètes ne sont pas reconstituées.</p></article><article><h3>Simulation</h3><p>Études et bancs indépendants. Leurs profils, règles et résultats expérimentaux ne sont pas des acquisitions ni des victoires de votre campagne.</p></article></div><p>Code : JavaScript, Three.js, Vite et Electron. Images et atlas : créations assistées par IA, validation artistique en cours. Son : synthèse originale Web Audio.</p><h3>Sources et périmètre des références</h3><p class="small">Une source indique ce qui a été documenté ; sa présence ne certifie ni la fidélité d’un modèle ni l’achèvement de sa mission.</p><label class="field" for="production-source-work">Œuvre<select id="production-source-work" data-production-filter="workId">${workOptions(work.id, false)}</select></label><p data-production-source-count>${work.sources.length} références · ${esc(work.title)}</p><div class="production-sources">${sourceCards(work)}</div></section>`;
}
