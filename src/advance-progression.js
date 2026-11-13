import { CHAPTERS, CLASSES } from './game-data.js';
import { COMMANDER_APPEARANCES, ORIGINS, PSYCHOLOGICAL_PROFILES } from './commander.js';

const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
const ROUTES = ['therum', 'feros', 'noveria'];
export const CAMPAIGN_MILESTONE_IDS = Object.freeze([
  'QST-profil-de-shepard', 'QST-briefing-normandy', 'QST-deploiement-eden-prime',
  'QST-perte-de-jenkins', 'QST-rencontre-d-ashley', 'QST-vision-de-la-balise',
  'QST-intronisation-spectre', 'QST-commandement-du-normandy',
]);

export function createCampaignProgress() {
  return { version: 1, beaconReturned: false, commandDestination: null, trackedMilestone: null };
}

const completed = (state, zone) => state?.completed?.includes(zone) === true;
const visited = (state, zone) => state?.story?.visitedZones?.includes(zone) === true
  || state?.zone === zone || completed(state, zone)
  || state?.cleared?.some(id => id.startsWith(`${zone}:`)) === true;

/** Only missing legacy data is inferred. Explicit receipts must remain coherent
 * with the authoritative campaign and never grant a mission or reward. */
export function normalizeCampaignProgress(raw, state) {
  try {
    if (raw === undefined) return {
      ...createCampaignProgress(),
      beaconReturned: completed(state, 'eden-prime') && state.zone !== 'eden-prime',
      commandDestination: completed(state, 'citadel')
        ? (state.story?.visitedZones || []).find(zone => ROUTES.includes(zone)) || ROUTES.find(zone => visited(state, zone)) || null
        : null,
    };
    if (!raw || typeof raw !== 'object' || ![Object.prototype, null].includes(Object.getPrototypeOf(raw))) return null;
    const keys = Reflect.ownKeys(raw);
    if (keys.length !== 4 || !keys.every(key => typeof key === 'string'
      && ['version', 'beaconReturned', 'commandDestination', 'trackedMilestone'].includes(key)
      && own(Object.getOwnPropertyDescriptor(raw, key), 'value')
      && Object.getOwnPropertyDescriptor(raw, key).enumerable)) return null;
    if (raw.version !== 1 || typeof raw.beaconReturned !== 'boolean'
      || raw.beaconReturned && !completed(state, 'eden-prime')
      || raw.commandDestination !== null && (!ROUTES.includes(raw.commandDestination)
        || !completed(state, 'citadel') || !visited(state, raw.commandDestination))
      || raw.trackedMilestone !== null && !CAMPAIGN_MILESTONE_IDS.includes(raw.trackedMilestone)) return null;
    return { version: 1, beaconReturned: raw.beaconReturned,
      commandDestination: raw.commandDestination, trackedMilestone: raw.trackedMilestone };
  } catch { return null; }
}

/** The journal reads live facts, rather than maintaining a second quest flag
 * table. Receipts describe actual extraction and a chosen investigation only. */
export function getCampaignMilestones(state) {
  if (!state || state.context && (state.context.mediaId !== 'ME1' || state.context.periodId !== 'me1')) return [];
  const progress = normalizeCampaignProgress(state.campaignProgress, state);
  if (!progress) return [];
  const briefed = state.flags?.briefed === true;
  const landed = visited(state, 'eden-prime');
  const jenkinsLost = state.flags?.jenkinsLost === true && state.lost?.includes('jenkins');
  const ashley = jenkinsLost && state.recruited?.includes('ashley');
  const beacon = completed(state, 'eden-prime');
  const spectre = state.flags?.spectre === true && completed(state, 'citadel');
  const dossier = own(COMMANDER_APPEARANCES, state.appearance) && own(ORIGINS, state.origin)
    && own(PSYCHOLOGICAL_PROFILES, state.psychologicalProfile) && own(CLASSES, state.classId);
  const entry = (id, title, done, active, objective, summary, targetZone, targetPoiId) => ({
    id, title, status: done ? 'complete' : active ? 'active' : 'locked',
    objective, summary: done ? summary : objective, targetZone, targetPoiId,
    tracked: progress.trackedMilestone === id && !done && active,
  });
  return [
    entry(CAMPAIGN_MILESTONE_IDS[0], 'Profil de Shepard', dossier, true,
      'Confirmer le dossier avant le départ.', dossier ? `${state.name} · ${COMMANDER_APPEARANCES[state.appearance].name} · ${ORIGINS[state.origin].name} · ${PSYCHOLOGICAL_PROFILES[state.psychologicalProfile].name} · ${CLASSES[state.classId].name}` : '', 'normandy', null),
    entry(CAMPAIGN_MILESTONE_IDS[1], 'Briefing du Normandy', briefed, !briefed,
      'Rejoindre Anderson et confirmer la préparation du déploiement.',
      'Le briefing est confirmé. Le déploiement vers Eden Prime est autorisé.', 'normandy', 'normandy:briefing'),
    entry(CAMPAIGN_MILESTONE_IDS[2], 'Déploiement vers Eden Prime', landed, briefed,
      'Choisir Eden Prime sur la carte galactique. Kaidan et Jenkins accompagnent Shepard.',
      'Le commando a débarqué sur Eden Prime.', 'normandy', 'normandy:galaxy'),
    entry(CAMPAIGN_MILESTONE_IDS[3], 'Perte de Jenkins', jenkinsLost, landed,
      'Sécuriser le premier contact d’Eden Prime.',
      'Jenkins est mort pendant la descente. Ce décès scénaristique ne peut pas être soigné.', 'eden-prime', 'eden-prime:encounter-1'),
    entry(CAMPAIGN_MILESTONE_IDS[4], 'Arrivée d’Ashley', ashley, landed,
      'Atteindre la survivante de l’Alliance après le premier contact.',
      state.lost?.includes('ashley') ? 'Ashley a rejoint le commando sur Eden Prime. Elle a ensuite été perdue sur Virmire.' : 'Ashley a rejoint le commando après le premier contact.', 'eden-prime', 'eden-prime:encounter-1'),
    entry(CAMPAIGN_MILESTONE_IDS[5], 'Vision de la balise', progress.beaconReturned, ashley,
      beacon ? 'La vision a eu lieu. Rejoindre l’extraction et retourner au Normandy.' : 'Sécuriser le spatioport puis rejoindre la balise.',
      'Le contact avec la balise et le retour au Normandy sont enregistrés.', 'eden-prime', beacon ? 'eden-prime:exit' : 'eden-prime:objective'),
    entry(CAMPAIGN_MILESTONE_IDS[6], 'Nomination comme Spectre', spectre, beacon,
      state.recruited?.includes('tali') ? 'Présenter les preuves au Conseil puis terminer la passation avec Anderson.' : 'Rejoindre Tali à la Citadelle et recueillir ses preuves.',
      'Le Conseil a nommé Shepard Spectre ; les enquêtes de Thérum, Féros et Novéria sont accessibles.', 'citadel', state.recruited?.includes('tali') ? 'citadel:objective' : 'citadel:encounter-2'),
    entry(CAMPAIGN_MILESTONE_IDS[7], 'Commandement du Normandy', progress.commandDestination !== null, spectre,
      'À bord du Normandy, choisir librement Thérum, Féros ou Novéria sur la carte galactique.',
      progress.commandDestination ? `Première piste choisie : ${CHAPTERS[progress.commandDestination].name}. Les autres enquêtes restent accessibles.` : '', 'normandy', 'normandy:galaxy'),
  ];
}

export function getTrackedCampaignObjective(state) {
  const entry = getCampaignMilestones(state).find(item => item.tracked);
  if (!entry) return null;
  return { id: entry.id, text: `${entry.title} · ${entry.objective}`,
    targetZone: entry.targetZone, targetPoiId: entry.targetZone === state.zone ? entry.targetPoiId : null };
}

export function renderCampaignMilestones(state, { esc } = {}) {
  const escape = esc || (value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character])));
  const milestones = getCampaignMilestones(state);
  if (!milestones.length) return '';
  return `<section class="campaign-milestones" aria-label="Étapes de campagne"><div class="section-label">Étapes de campagne</div><p class="small">Suivez une étape pour afficher son objectif et son repère dans la zone concernée.</p>${milestones.map(entry => `<article class="journal-entry" data-campaign-milestone="${entry.id}" data-campaign-status="${entry.status}"><div class="assignment-heading"><h3>${entry.status === 'complete' ? '✓ ' : ''}${escape(entry.title)}</h3><span class="pill">${entry.status === 'complete' ? 'Terminée' : entry.status === 'active' ? 'En cours' : 'À venir'}</span></div><p>${escape(entry.summary)}</p>${entry.status === 'active' ? `<button class="secondary" data-do="track-campaign" data-id="${entry.tracked ? '' : entry.id}">${entry.tracked ? 'Arrêter le suivi' : 'Suivre cette étape'}</button>` : ''}</article>`).join('')}</section>`;
}
