import { CHAPTERS } from './game-data.js';
import { unlockedZones } from './state.js';
import { getMissionTravelGate } from './mission-progress.js';

const investigations = ['therum', 'feros', 'noveria'];
const finalInvestigations = [...investigations, 'virmire'];
const known = zone => zone === 'normandy' || Object.hasOwn(CHAPTERS, zone);
const label = zone => CHAPTERS[zone]?.name || 'Normandy SR-1';
const locked = missing => ({ ok: false, reason: missing.join(' '), missing, status: 'locked' });

/** Explain the existing ME1 campaign gates without granting coordinates or changing progression. */
export function getDestinationAccess(state, zone, { unlocked } = {}) {
  if (!known(zone)) return locked(['Destination inconnue.']);
  if (!state || !state.flags || !Array.isArray(state.completed)) return locked(['Progression indisponible.']);
  const completed = id => state.completed.includes(id);
  const available = Array.isArray(unlocked) ? unlocked : unlockedZones(state);
  const missing = [];
  if (!available.includes(zone)) {
    if (zone !== 'normandy' && state.flags.briefed !== true)
      missing.push('Rejoignez le briefing de mission à bord du Normandy.');
    if (!['normandy', 'eden-prime'].includes(zone) && !completed('eden-prime'))
      missing.push('Terminez la mission d’Eden Prime.');
    if (!['normandy', 'eden-prime', 'citadel'].includes(zone)) {
      if (!completed('citadel')) missing.push('Présentez les preuves de Tali au Conseil à la Citadelle.');
      if (state.flags.spectre !== true) missing.push('Obtenez votre nomination comme Spectre auprès du Conseil.');
    }
    if (zone === 'virmire') {
      const count = investigations.filter(completed).length;
      if (count < 2) missing.push(`Terminez deux enquêtes parmi Thérum, Féros et Novéria (${count}/2 accomplies).`);
    }
    if (['ilos', 'citadel-finale'].includes(zone)) {
      const remaining = finalInvestigations.filter(id => !completed(id));
      if (remaining.length) missing.push(`Terminez les missions suivantes : ${remaining.map(label).join(', ')}.`);
    }
    if (zone === 'citadel-finale' && !completed('ilos')) missing.push('Terminez Ilos et empruntez le Conduit.');
    return locked(missing.length ? missing : ['Les coordonnées de cette destination sont indisponibles.']);
  }
  const departure = getMissionTravelGate(state, zone);
  if (!departure.ok) return locked([departure.reason]);
  return {
    ok: true,
    reason: completed(zone) ? 'Mission accomplie · revisite disponible.' : 'Destination accessible.',
    missing: [],
    status: completed(zone) ? 'completed' : 'available',
  };
}
