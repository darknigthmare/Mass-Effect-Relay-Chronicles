import { getLevelLayout } from './level-layout-data.js';
import { getMissionPOIs } from './mission-progress.js';

export const EDEN_SUPPORT = 'eden-prime:support';
export const EDEN_CLUE = 'eden-prime:dig-report';
const EDEN = 'eden-prime';
const FIRST = 'eden-prime:encounter-1';
const PATROL = 'eden-prime:encounter-2';
const DEFENSE = 'eden-prime:boss';
const OBJECTIVE = 'eden-prime:objective';
const has = (list, id) => Array.isArray(list) && list.includes(id);
const guided = state => !!state?.campaignProgress?.prologue;
const layout = getLevelLayout(EDEN);

export function briefingContactPending(state) {
  return guided(state) && state.zone === 'normandy' && !has(state.story?.visitedZones, EDEN)
    && !(state.resolveCitadel?.nihlus >= 1);
}

export function ashleySupportPending(state) {
  return guided(state) && state.zone === EDEN && has(state.cleared, FIRST) && !has(state.recruited, 'ashley');
}

export function edenDigReportAvailable(state) {
  return guided(state) && state.zone === EDEN && has(state.recruited, 'ashley') && !state.campaignProgress.prologue.digClue;
}

export function edenFieldPOIs(state) {
  const point = (id, label, position) => ({ id, zone: EDEN, label, ...position, type: 'dialogue' });
  if (ashleySupportPending(state)) return [point(EDEN_SUPPORT, 'Soutien à la survivante', layout.pois['encounter-1'])];
  if (edenDigReportAvailable(state)) {
    const { x, z } = layout.landmarks.find(landmark => landmark.id === 'dig-site');
    return [point(EDEN_CLUE, 'Relevé du site de fouille', { x, z })];
  }
  return [];
}

export function edenBeaconTrail(state) {
  if (has(state.completed, EDEN)) return { done: true, text: 'La piste a mené à la balise.', target: null };
  const legacy = !guided(state);
  if (!legacy && !state.campaignProgress.prologue.digClue)
    return { done: false, text: 'Relever les indices du site de fouille.', target: EDEN_CLUE };
  if (!has(state.cleared, PATROL))
    return { done: false, text: 'Les relevés indiquent le spatioport. Sécuriser le secteur pour poursuivre la piste.', target: PATROL };
  if (!has(state.cleared, DEFENSE)) {
    const activeStep = state.zone === EDEN ? getMissionPOIs(state)[0] : null;
    return { done: false, text: 'Dégager le passage du spatioport et sécuriser les défenses près de la balise.', target: activeStep?.id || DEFENSE };
  }
  return { done: false, text: 'La voie est libre. Rejoindre la balise.', target: OBJECTIVE };
}
