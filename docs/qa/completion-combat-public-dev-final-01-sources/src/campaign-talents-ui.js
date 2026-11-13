import { CHARACTER_EQUIPMENT, getEquipmentProfile } from './character-data.js';
import { CAMPAIGN_TALENT_ACTIONS, getTalentBudget, getTalentOptions } from './campaign-talents.js';
const esc = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));

/** Body only; the caller owns the regular menu shell, focus and back button. */
export function renderCampaignTalents(state, actorId = 'shepard') {
  const actors = ['shepard', ...(state?.recruited || [])].filter(id => id !== 'jenkins'
    && Object.hasOwn(CHARACTER_EQUIPMENT, id) && !state?.lost?.includes(id));
  const selected = actors.includes(actorId) ? actorId : 'shepard';
  const options = getTalentOptions(state, selected), points = getTalentBudget(state, selected), profile = getEquipmentProfile(selected, state.classId);
  if (!Number.isFinite(points.available)) return '<p role="alert">Le budget de talents est invalide. Aucune formation ne peut être appliquée.</p>';
  return `<nav class="tabs" aria-label="Talents du commando">${actors.map(id => `<button class="tab ${selected === id ? 'active' : ''}" data-do="talent-actor" data-id="${esc(id)}" aria-pressed="${selected === id}">${esc(id === 'shepard' ? state.name : CHARACTER_EQUIPMENT[id].name)}</button>`).join('')}</nav>
    <p class="small">${esc(profile?.className || '')} · ${points.available} point${points.available > 1 ? 's' : ''} disponible${points.available > 1 ? 's' : ''} sur ${points.total} · ${points.armorPoints} pour les armures, ${points.talentPoints} pour les talents.</p>
    <p class="small">Un point par niveau gagné, partagé avec les formations d’armure. Les achats au Normandy sont définitifs dans cette version. Rangs et valeurs adaptés à l’ATB ; arbres originaux incomplets.</p>
    ${options.length ? `<div class="talent-grid">${options.map(talent => `<article class="talent-card" data-talent-id="${esc(talent.id)}"><div class="section-label">Rang ${talent.rank} / ${talent.maxRank}</div><h3>${esc(talent.label)}</h3><p>${esc(talent.description)}</p>${talent.actionId ? `<p class="small">${talent.unlockedAction ? '✓ ' : ''}${esc(CAMPAIGN_TALENT_ACTIONS[talent.actionId].label)} · ${talent.unlockedAction ? 'capacité disponible en combat' : `déverrouillage au rang ${talent.actionRank}`}</p>` : ''}<button class="secondary" data-do="talent-buy" data-actor="${esc(selected)}" data-id="${esc(talent.id)}" ${talent.canTrain ? '' : 'disabled'} aria-label="${esc(`Apprendre ${talent.label}, rang ${talent.nextRank}, un point`)}">${talent.rank === talent.maxRank ? 'Rang maximum' : `Apprendre le rang ${talent.nextRank} · 1 point`}</button>${talent.reason ? `<p class="small">${esc(talent.reason)}</p>` : ''}</article>`).join('')}</div>` : '<p>Aucun talent supplémentaire n’est proposé à cet équipier.</p>'}`;
}
