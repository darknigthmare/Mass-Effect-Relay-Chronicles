// Fixed spacecraft drawings. A hull image grants neither a crew profile nor
// flight, weapons, a rebuilt interior, a common scale or original-game fidelity.
import { getMediaPeriod } from './continuity-data.js';

const freeze = value => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze); Object.freeze(value);
  }
  return value;
};
const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
const plain = value => !!value && typeof value === 'object' && !Array.isArray(value)
  && [Object.prototype, null].includes(Object.getPrototypeOf(value));

export const HORIZON_FLEET = freeze([
  { id: 'normandy-sr1', catalogId: 'SPR-VEH-normandy-sr-1', name: 'Normandy SR-1', mediaId: 'ME1', periodIds: ['me1'], familyId: 'me1',
    recordIds: ['SPR-VEH-normandy-sr-1', 'SCN-normandy-coque-sr-1', 'WRL-normandy-sr-1'], gate: null,
    caption: 'Frégate furtive du premier Mass Effect ; dessin extérieur fixe, sans nouvel intérieur ni pilotage.',
    description: 'Le Normandy SR-1 est la frégate furtive de l’Alliance utilisée par Shepard dans Mass Effect. Son développement associe des technologies humaines et turiennes.',
    worldPlacements: [{ zoneId: 'citadel' }, { zoneId: 'eden-prime' }, { zoneId: 'therum' }, { zoneId: 'noveria' }, { zoneId: 'virmire' }, { zoneId: 'ilos' }] },
  { id: 'sovereign', catalogId: 'SPR-VEH-sovereign', name: 'Sovereign', mediaId: 'ME1', periodIds: ['me1'], familyId: 'me1',
    recordIds: ['SPR-VEH-sovereign'], gate: 'after-virmire',
    caption: 'Sovereign ME1 ; silhouette monumentale de prototype, sans simulation de bataille spatiale.',
    description: 'Le vaisseau lié à Saren est identifié comme un Moissonneur au cours de l’enquête. Son rôle et sa nature se révèlent à Shepard sur Virmire.',
    worldPlacements: [{ zoneId: 'citadel-finale' }] },
  { id: 'destiny-ascension', catalogId: 'SPR-VEH-destiny-ascension', name: 'Destiny Ascension', mediaId: 'ME1', periodIds: ['me1'], familyId: 'me1',
    recordIds: ['SPR-VEH-destiny-ascension'], gate: 'after-citadel',
    caption: 'Vaisseau amiral asari de la flotte de la Citadelle ; vue fixe, échelle et géométrie originales non certifiées.',
    description: 'Le Destiny Ascension est le vaisseau amiral asari de la flotte de la Citadelle. Cette unité participe à la protection de la station et du Conseil.',
    worldPlacements: [{ zoneId: 'citadel' }] },
  { id: 'geth-dropship', catalogId: 'SPR-VEH-transport-geth', name: 'Transport geth', mediaId: 'ME1', periodIds: ['me1'], familyId: 'me1',
    recordIds: ['SPR-VEH-transport-geth'], gate: 'after-briefing',
    caption: 'Transport geth ME1 ; interprétation fixe de coque, sans débarquement dynamique ni attaque de vaisseau.',
    description: 'Les geth utilisent des transports pour déployer leurs forces. Ces vaisseaux font partie des moyens logistiques de leurs opérations dans la Voie lactée.',
    worldPlacements: [{ zoneId: 'eden-prime' }, { zoneId: 'therum' }] },
  { id: 'normandy-sr2-cerberus', catalogId: 'ME2-normandy-sr-2-cerberus', name: 'Normandy SR-2 · Cerberus', mediaId: 'ME2', periodIds: ['me2'], familyId: 'later',
    recordIds: ['ME2-normandy-sr-2-cerberus', 'ME2-ZON-NORMANDY-CIC'], gate: null,
    caption: 'Vaisseau associé à ce lieu · livrée Cerberus de ME2 ; vue extérieure, sans intérieur reconstruit.',
    description: 'Le Normandy SR-2 de Mass Effect 2 remplace le SR-1. Sa livrée Cerberus appartient à cette période ; il n’est pas présent dans l’ouverture centrée sur le SR-1.', worldPlacements: [] },
  { id: 'normandy-sr2-alliance', catalogId: 'ME3-normandy-sr-2-alliance', name: 'Normandy SR-2 · Alliance', mediaId: 'ME3', periodIds: ['me3'], familyId: 'later',
    recordIds: ['ME3-normandy-sr-2-alliance', 'ME3-ZON-NORM-CIC'], gate: null,
    caption: 'Vaisseau associé à ce lieu · livrée Alliance de ME3 ; dessin extérieur distinct, sans intérieur reconstruit.',
    description: 'Dans Mass Effect 3, le Normandy SR-2 sert l’Alliance. Sa livrée et son contexte sont distincts de ceux de Cerberus dans l’épisode précédent.', worldPlacements: [] },
  { id: 'tempest', catalogId: 'MEA-SCN-TEMPEST', name: 'Tempest', mediaId: 'MEA', periodIds: ['mea'], familyId: 'later',
    recordIds: ['MEA-SCN-TEMPEST', 'MEA-ZON-TEMPEST-BRIDGE'], gate: null,
    caption: 'Vaisseau associé à ce lieu · exploration d’Andromeda ; image extérieure, kit 3D et campagne non reconstruits.',
    description: 'Le Tempest est le vaisseau d’exploration du Pionnier dans Heleus. Cette silhouette est réservée à la campagne d’Andromeda, après le prologue de l’Hyperion.', worldPlacements: [] },
  { id: 'hyperion', catalogId: 'MEA-SCN-HYPERION', name: 'Hyperion', mediaId: 'MEA', periodIds: ['mea', 'mea-prologue'], familyId: 'later',
    recordIds: ['MEA-SCN-HYPERION', 'MEA-WRL-HYPERION', 'MEA-MQ-HYPERION'], gate: null,
    caption: 'Vaisseau associé à ce lieu · arche humaine d’Andromeda ; dessin fixe sans échelle commune avec les frégates.',
    description: 'L’Hyperion transporte les colons humains de l’Initiative Andromède. Le réveil de Ryder à bord appartient au prologue ; la coque n’implique pas une simulation de cryostase.', worldPlacements: [] },
].map(entry => ({ ...entry, status: 'Prototype', partial: true, primaryVisualVerified: false,
  file: `horizon-fleet-${entry.familyId}.png`, frame: entry.id })));

const BY_ID = Object.fromEntries(HORIZON_FLEET.map(entry => [entry.id, entry]));
export const HORIZON_FLEET_FAMILIES = Object.freeze(['me1', 'later']);
export function getHorizonFleet(id) { return typeof id === 'string' && own(BY_ID, id) ? BY_ID[id] : null; }

function contextFor(entry, context) {
  try {
    if (!plain(context) || Reflect.ownKeys(context).some(key => !['mediaId', 'periodId', 'galaxy'].includes(key))
      || context.mediaId !== entry.mediaId || !entry.periodIds.includes(context.periodId)) return false;
    const media = getMediaPeriod(context.mediaId);
    return !!media && media.locked !== true && media.periods.some(period => period.id === context.periodId)
      && (context.galaxy === undefined || context.galaxy === media.galaxy);
  } catch { return false; }
}
function campaignInScope(state) {
  return !!state && (state.mediaId === undefined || state.mediaId === 'ME1')
    && (state.periodId === undefined || state.periodId === 'me1')
    && (state.galaxy === undefined || state.galaxy === 'milky-way')
    && (state.context?.mediaId === undefined || state.context.mediaId === 'ME1')
    && (state.context?.periodId === undefined || state.context.periodId === 'me1')
    && (state.context?.galaxy === undefined || state.context.galaxy === 'milky-way');
}
function gateOpen(entry, state) {
  if (!entry.gate) return true;
  if (!campaignInScope(state)) return false;
  const completed = Array.isArray(state.completed) ? state.completed : [];
  if (entry.gate === 'after-virmire') return completed.includes('virmire');
  if (entry.gate === 'after-citadel') return completed.includes('citadel');
  return entry.gate === 'after-briefing' && state.flags?.briefed === true;
}

/** Campaign dossier eligibility. Documentary catalogue access is separate. */
export function getHorizonFleetEntry(id, context, campaignState) {
  try {
    const entry = getHorizonFleet(id);
    return entry && contextFor(entry, context) && (entry.mediaId !== 'ME1' || campaignInScope(campaignState))
      && gateOpen(entry, campaignState) ? entry : null;
  } catch { return null; }
}
export function listHorizonFleet(context, campaignState) {
  return HORIZON_FLEET.filter(entry => getHorizonFleetEntry(entry.id, context, campaignState));
}

/** Only explicitly authored ME1 distant props; a reference never grants this. */
export function canShowHorizonFleet(id, context, campaignState, zoneId) {
  try {
    const entry = getHorizonFleetEntry(id, context, campaignState);
    if (['sovereign', 'destiny-ascension'].includes(id) && Array.isArray(campaignState?.completed)
      && campaignState.completed.includes('citadel-finale')) return false;
    return !!entry && entry.mediaId === 'ME1' && campaignInScope(campaignState)
      && entry.worldPlacements.some(placement => placement.zoneId === zoneId);
  } catch { return false; }
}

/** Native geometry only: copy known frames, reject foreign families and overlap. */
export function normalizeHorizonFleetAtlas(familyId, input) {
  try {
    const entries = HORIZON_FLEET.filter(entry => entry.familyId === familyId);
    if (!HORIZON_FLEET_FAMILIES.includes(familyId) || !plain(input) || input.version !== 1
      || input.familyId !== familyId || input.kind !== 'fleet' || input.file !== `horizon-fleet-${familyId}.png`
      || input.alphaCutoff !== 8 || !plain(input.frames) || Object.keys(input.frames).length !== entries.length
      || ![input.width, input.height].every(value => Number.isInteger(value) && value > 0 && value <= 8192)
      || typeof input.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(input.sha256)) return null;
    const frames = {};
    for (const entry of entries) {
      const frame = input.frames[entry.id];
      if (!plain(frame) || frame.id !== entry.id || !Array.isArray(frame.rect) || frame.rect.length !== 4
        || !frame.rect.every(Number.isInteger) || !Array.isArray(frame.pivot) || frame.pivot.length !== 2
        || !frame.pivot.every(Number.isFinite) || !Number.isFinite(frame.heightScale)
        || frame.heightScale < .1 || frame.heightScale > 2) return null;
      const [x, y, w, h] = frame.rect;
      if (x < 0 || y < 0 || w <= 32 || h <= 32 || x + w > input.width || y + h > input.height
        || frame.pivot[0] < 0 || frame.pivot[0] > w || frame.pivot[1] < 0 || frame.pivot[1] > h) return null;
      for (const other of Object.values(frames)) {
        const [xx, yy, ww, hh] = other.rect;
        if (x < xx + ww && xx < x + w && y < yy + hh && yy < y + h) return null;
      }
      frames[entry.id] = { id: entry.id, rect: [...frame.rect], pivot: [...frame.pivot], heightScale: frame.heightScale };
    }
    return freeze({ version: 1, familyId, kind: 'fleet', file: input.file, width: input.width, height: input.height,
      alphaCutoff: 8, sha256: input.sha256, status: 'Prototype', partial: true, primaryVisualVerified: false, frames });
  } catch { return null; }
}
export function getHorizonFleetFrame(id, atlases) {
  try {
    const entry = getHorizonFleet(id), atlas = entry && (atlases?.[entry.familyId] || atlases);
    const normalized = entry && normalizeHorizonFleetAtlas(entry.familyId, atlas), frame = normalized?.frames[id];
    return frame ? freeze({ ...frame, familyId: entry.familyId, file: normalized.file,
      width: normalized.width, height: normalized.height, sha256: normalized.sha256 }) : null;
  } catch { return null; }
}

/** Reused by the lazy documentary adapter after canonical access has passed. */
export function horizonFleetContextMatches(id, context) {
  const entry = getHorizonFleet(id); return !!entry && contextFor(entry, context);
}
