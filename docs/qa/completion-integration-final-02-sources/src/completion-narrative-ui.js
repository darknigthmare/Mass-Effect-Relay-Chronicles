import { getNarrativeSummary, getCompanionRelations } from './completion-narrative.js';
const esc = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);

export function renderNarrativeSummary(state) {
  const summary = getNarrativeSummary(state);
  if (!summary) return '';
  return `<section data-narrative-summary aria-label="Décisions et conséquences"><div class="section-label">Décisions et conséquences</div><p data-narrative-reputation>Conciliation <strong>${summary.reputation.paragon}</strong> · Pragmatisme <strong>${summary.reputation.renegade}</strong></p><p class="small">Les options de persuasion affichent leur prérequis au moment du choix.</p>${summary.consequences.length ? summary.consequences.map(item => `<article class="journal-entry" data-narrative-consequence="${esc(item.id)}"><h3>${esc(item.name)}</h3><p>${esc(item.text)}</p>${item.limit ? `<p class="small">${esc(item.limit)}</p>` : ''}</article>`).join('') : '<p class="small">Aucune décision de mission encore enregistrée.</p>'}${summary.recruitment?.late ? `<article class="journal-entry" data-recruitment-context="liara"><h3>Liara · arrivée dans l’enquête</h3><p>${esc(summary.recruitment.text)}</p></article>` : ''}</section>`;
}

export function renderCompanionRelations(state) {
  const companions = getCompanionRelations(state);
  if (!companions.length) return '';
  return `<section data-companion-relations aria-label="Liens du commando"><div class="section-label">Liens du commando</div>${companions.map(companion => `<article class="journal-entry" data-companion-relation="${esc(companion.id)}" data-relation-status="${esc(companion.status)}"><h3>${esc(companion.name)} · ${esc(companion.label)}</h3><p>${companion.available ? companion.selected ? 'Dans le groupe sélectionné.' : 'Disponible pour le prochain déploiement.' : 'Indisponible définitivement. Les échanges déjà enregistrés restent dans le dossier.'}</p>${companion.exchanges.length ? `<p class="small">Sujets abordés : ${companion.exchanges.map(topic => esc(topic.label)).join(' · ')}</p>` : ''}</article>`).join('')}</section>`;
}
