import { getMissionProgress } from './mission-progress.js';
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
export function missionTimeLabel(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '';
  const whole = Math.ceil(seconds); return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}
export function missionHUDText(state) {
  const view = getMissionProgress(state);
  if (!view || !['active', 'failed'].includes(view.status)) return '';
  return `${view.title} · ${view.status === 'failed' ? 'Échec · point de contrôle disponible'
    : view.channel ? `Désamorçage ${Math.ceil(view.channel.remaining)} s · ${missionTimeLabel(view.remaining)}`
      : `${view.steps.filter(step => step.done).length}/${view.steps.length}${view.remaining === null ? '' : ` · ${missionTimeLabel(view.remaining)}`}`}`;
}
export function renderMissionProgress(state, id = state?.zone) {
  const view = getMissionProgress(state, id);
  if (!view || view.status === 'idle') return '';
  return `<article class="journal-entry mission-progress" data-mission-progress="${esc(id)}" data-mission-progress-status="${esc(view.status)}"><h3>${esc(view.title)}</h3><p>${esc(view.summary)}</p>${view.remaining === null ? '' : `<p role="timer" aria-label="Temps de mission restant">Temps restant : <strong>${esc(missionTimeLabel(view.remaining))}</strong></p>`}<ol>${view.steps.map(step => `<li>${step.done ? '✓ ' : ''}${esc(step.label)}</li>`).join('')}</ol><p class="small">${esc(view.rules)}</p>${view.status === 'failed' ? `<p>${esc(view.checkpointNote)}</p>` : ''}</article>`;
}
