import { listOperations } from './operations.js';

const fallbackEscape = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const STATUS = { active: 'En cours', available: 'À découvrir', locked: 'À débloquer', completed: 'Terminée', unavailable: 'Indisponible' };
const ORDER = { active: 0, available: 1, completed: 2, locked: 3, unavailable: 4 };

export function renderOperationsJournal(state, ui = {}, { esc = fallbackEscape } = {}) {
  const operations = listOperations(state), requested = ui.operationFilter || 'all';
  const filter = ['all', 'active', 'completed'].includes(requested) ? requested : 'all';
  const shown = operations.filter(operation => filter === 'all' || operation.status === filter).sort((a, b) => ORDER[a.status] - ORDER[b.status]);
  const complete = operations.filter(operation => operation.status === 'completed').length;
  const active = operations.filter(operation => operation.status === 'active').length;
  return `<section class="operations-journal" aria-label="Opérations annexes">
    <header class="operations-heading"><div><div class="eyebrow">CITADELLE · FÉROS</div><h3>Opérations de terrain</h3><p>${complete} / ${operations.length} terminées · ${active} en cours</p></div>
      <div class="operations-filters" role="group" aria-label="Filtrer les opérations">${[['all', 'Toutes'], ['active', 'En cours'], ['completed', 'Terminées']].map(([id, label]) => `<button data-do="operation-filter" data-id="${id}" aria-pressed="${filter === id}" class="${filter === id ? 'active' : ''}">${label}</button>`).join('')}</div>
    </header>
    <p class="operations-intro">Les objectifs apparaissent dans le monde quand leurs conditions sont réunies. Un suivi indique le prochain contact ou la condition encore à remplir.</p>
    <div class="operations-list">${shown.length ? shown.map(operation => {
      const actionable = ['active', 'available'].includes(operation.status), tracked = state.trackedOperation === operation.id;
      const rewards = Object.entries(operation.reward).filter(([, amount]) => amount).map(([key, amount]) => `${amount} ${({ xp: 'XP', credits: 'crédits', medigel: 'médi-gel', paragon: 'Conciliation', renegade: 'Pragmatisme' })[key] || key}`).join(' · ');
      return `<article class="operation-card ${operation.status}${tracked ? ' tracked' : ''}" data-operation-id="${esc(operation.id)}">
        <div class="operation-card-top"><span class="operation-zone">${operation.zone === 'citadel' ? 'Citadelle' : 'Féros'}</span><span class="operation-status">${STATUS[operation.status]}</span></div>
        <h4>${esc(operation.name.replace(/^(Citadelle|Féros) : /, ''))}</h4><p class="operation-description">${esc(operation.description)}</p>
        <div class="operation-progress"><progress max="${operation.totalSteps}" value="${operation.stage}" aria-label="Étapes accomplies"></progress><span>${operation.stage} / ${operation.totalSteps}</span></div>
        ${operation.blockedReason ? `<p class="operation-blocked">${esc(operation.blockedReason)}</p>` : operation.currentStep ? `<p class="operation-next"><strong>${operation.pendingBattle ? 'Combat à reprendre' : 'Prochain objectif'}</strong><span>${esc(operation.currentStep.label)}</span></p>` : ''}
        ${operation.outcome ? `<p class="operation-outcome">${esc(operation.outcome)}</p>` : ''}
        <p class="operation-reward"><span>${operation.status === 'completed' ? 'Récompense attribuée' : 'Récompense à la conclusion'}</span>${esc(rewards)}</p>
        ${actionable ? `<button class="operation-track${tracked ? ' active' : ''}" data-do="track-operation" data-id="${esc(operation.id)}" aria-pressed="${tracked}">${tracked ? 'Arrêter le suivi' : 'Suivre l’objectif'}</button>` : ''}
        ${operation.choices.length ? `<details class="operation-history"><summary>Décisions enregistrées (${operation.choices.length})</summary><ol>${operation.choices.map(choice => `<li><strong>${esc(choice.speaker)}</strong><span>${esc(choice.label)}</span></li>`).join('')}</ol></details>` : ''}
        <details class="operation-adaptation"><summary>À propos de cette adaptation</summary><p>${esc(operation.adaptationNote)}</p></details>
      </article>`;
    }).join('') : '<p class="operations-empty">Aucune opération ne correspond à ce filtre.</p>'}</div>
  </section>`;
}
