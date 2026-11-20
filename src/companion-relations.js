import { STORY_CONVERSATIONS } from './story-data.js';
import { getResolveVirmireAwayCrew } from './resolve-virmire.js';

const ACTIONS = {
  '': [{ id: 'friendship', label: 'Consigner mon amitié', next: 'friendship' }],
  friendship: [
    { id: 'romantic-interest', label: 'Consigner mon intérêt romantique', next: 'romantic-interest' },
    { id: 'clear', label: 'Effacer ma note', next: '' },
  ],
  'romantic-interest': [{ id: 'withdraw', label: 'Retirer mon intérêt romantique', next: 'friendship' }],
};

const LABELS = { friendship: 'Amitié', 'romantic-interest': 'Intérêt romantique de Shepard' };
const has = (array, value) => Array.isArray(array) && array.includes(value);
const campaign = state => state && (!state.context || state.context.mediaId === 'ME1' && state.context.periodId === 'me1');

export function getCompanionExchanges(state, id) {
  if (typeof id !== 'string' || !Object.hasOwn(STORY_CONVERSATIONS, id) || STORY_CONVERSATIONS[id].companion !== id) return [];
  return STORY_CONVERSATIONS[id].topics
    .filter(topic => has(state?.story?.heard, `${id}:${topic.id}`))
    .map(topic => ({ id: topic.id, label: topic.label }));
}

function hasHistory(state, id) {
  return campaign(state) && has(state.recruited, id) && getCompanionExchanges(state, id).length > 0;
}

function canEdit(state, id) {
  return hasHistory(state, id) && state.zone === 'normandy' && !state.ending
    && !has(state.lost, id) && !getResolveVirmireAwayCrew(state).includes(id);
}

/** Keep notes for companions previously met, even when they can no longer be reached. */
export function normalizeCompanionRelations(raw, state) {
  if (raw === undefined) return {};
  if (!raw || typeof raw !== 'object' || ![Object.prototype, null].includes(Object.getPrototypeOf(raw))) return null;
  const result = {};
  for (const key of Reflect.ownKeys(raw)) {
    const field = Object.getOwnPropertyDescriptor(raw, key);
    if (typeof key !== 'string' || !field.enumerable || !Object.hasOwn(field, 'value') || typeof field.value !== 'string'
      || !Object.hasOwn(LABELS, field.value) || !hasHistory(state, key)) return null;
    result[key] = field.value;
  }
  return result;
}

export function getCompanionNote(state, id, { editable = false } = {}) {
  const stored = campaign(state) && typeof id === 'string' && Object.hasOwn(state.companionRelations || {}, id) ? state.companionRelations[id] : '';
  const stage = typeof stored === 'string' && Object.hasOwn(LABELS, stored) ? stored : '';
  const actions = editable && canEdit(state, id) ? ACTIONS[stage] : [];
  return {
    stage,
    label: stage ? LABELS[stage] : null,
    actions: actions.map(({ id: actionId, label }) => ({ id: actionId, label })),
  };
}

export function changeCompanionNote(state, id, actionId) {
  const notes = normalizeCompanionRelations(state?.companionRelations, state);
  if (!notes || !canEdit(state, id)) return { ok: false, reason: 'Cette note se modifie à bord, après un échange avec un équipier disponible.' };
  const selected = ACTIONS[notes[id] || ''].find(action => action.id === actionId);
  if (!selected) return { ok: false, reason: 'Ce choix n’est pas disponible à cette étape.' };
  if (selected.next) notes[id] = selected.next;
  else delete notes[id];
  state.companionRelations = notes;
  return { ok: true, stage: selected.next };
}
