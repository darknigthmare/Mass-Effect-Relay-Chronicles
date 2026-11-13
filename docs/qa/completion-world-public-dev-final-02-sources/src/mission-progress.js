// ME1 mission interactions for the retained ATB adaptation. Only this optional
// sub-state is changed here; chapter rewards remain owned by completeZone.
const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
const freeze = value => { if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); } return value; };
const STATUSES = new Set(['idle', 'active', 'failed', 'complete', 'legacy-complete']);
const MAX_ATTEMPTS = 1_000_000;
const no = reason => ({ ok: false, reason });
const done = status => status === 'complete' || status === 'legacy-complete';

export const MISSION_PROGRESS_VERSION = 1;
export const MISSION_DEFINITIONS = freeze({
  'eden-prime': {
    id: 'eden-prime', title: 'Eden Prime · Charges du spatioport', catalogId: 'QST-desamorcage-du-spatioport',
    speaker: 'Canal du commando', duration: 300, channelSeconds: 6,
    start: { x: 18, z: -40 }, prerequisites: ['eden-prime:encounter-1', 'eden-prime:encounter-2'],
    encounterGate: ['eden-prime:boss'],
    introduction: 'Quatre charges menacent le spatioport. Repérez chacune sur le terrain et désamorcez-la avant de rejoindre la balise.',
    rules: 'Le compte à rebours dure cinq minutes de terrain. Une charge demande six secondes immobile ; bouger annule la tentative. Menus, combats, chargements et perte du focus suspendent cette adaptation ATB.',
    failure: 'Le délai est écoulé. Cette tentative ne permet plus d’approcher la balise. Reprenez le point de contrôle pour recommencer les quatre désamorçages.',
    completion: 'Les quatre charges sont neutralisées. Le commando peut sécuriser la dernière défense, puis rejoindre la balise.',
    checkpointNote: 'La reprise réarme les quatre charges et remet le délai à cinq minutes ; les combats et ressources déjà enregistrés restent inchangés.',
    steps: [
      { id: 'charge-1', label: 'Charge du quai', x: 18, z: -40, text: 'Le détonateur du quai est actif. Le commando couvre Shepard pendant la neutralisation.' },
      { id: 'charge-2', label: 'Charge de la passerelle', x: 29, z: -49, text: 'Une seconde charge est fixée près de la passerelle du fret.' },
      { id: 'charge-3', label: 'Charge du fret', x: 10, z: -59, text: 'Le signal du troisième détonateur vient du niveau inférieur du fret.' },
      { id: 'charge-4', label: 'Charge de la plateforme', x: 15, z: -69, text: 'La dernière charge menace l’accès à la plateforme de la balise.' },
    ],
    reference: 'Prima officiel, page PDF 15 / guide 71 : quatre charges, six secondes par désamorçage et un délai de quelques minutes. Le total de 300 secondes, les positions et la pause en combat sont adaptés.',
  },
  noveria: {
    id: 'noveria', title: 'Novéria · Restauration de MIRA', catalogId: 'QST-remise-en-marche-mira',
    speaker: 'MIRA · diagnostic local', duration: null, channelSeconds: 0,
    start: { x: 6, z: -8 }, prerequisites: ['noveria:encounter-1'],
    encounterGate: ['noveria:encounter-2', 'noveria:boss'],
    introduction: 'Les installations du Pic 15 ne répondent plus. Réactivez les trois stations techniques avant de poursuivre vers les laboratoires.',
    rules: 'Les trois stations peuvent être traitées dans l’ordre de votre choix. Chaque réparation est enregistrée immédiatement. Aucun chronomètre ni coût de crédits n’est ajouté.',
    failure: '', completion: 'Les trois stations répondent. MIRA peut rétablir les communications et l’accès à la suite du complexe.',
    checkpointNote: '',
    steps: [
      { id: 'memory', label: 'MIRA · initialisation du noyau', x: 6, z: -8, text: 'Le terminal propose de réinitialiser les routines locales de MIRA. La séquence complète du noyau reste condensée dans cette remise en service.' },
      { id: 'power', label: 'MIRA · alimentation', x: -3, z: -18, text: 'Le réseau du complexe est isolé. Rétablissez la liaison du poste d’alimentation.' },
      { id: 'uplink', label: 'MIRA · liaison des communications', x: 18, z: -21, text: 'La liaison de communication ne répond plus. Relancez le relais pour raccorder les installations.' },
    ],
    reference: 'Objectif ME1 suivi par QST-remise-en-marche-mira. Trois stations, leurs emplacements et la validation immédiate sont une condensation ; le puzzle du noyau, le réacteur et les parcours originaux ne sont pas reproduits intégralement.',
  },
  ilos: {
    id: 'ilos', title: 'Ilos · Fenêtre du Conduit', catalogId: 'QST-course-au-conduit',
    speaker: 'Vigil', duration: 60, channelSeconds: 0,
    start: { x: -5, z: -84 }, prerequisites: ['ilos:encounter-1', 'ilos:encounter-2', 'ilos:boss'],
    encounterGate: [],
    introduction: 'Vigil peut ouvrir une fenêtre d’accès au Conduit. Écoutez son avertissement, puis rejoignez le passage tant qu’il reste actif.',
    rules: 'L’activation de Vigil ouvre une fenêtre de soixante secondes de terrain. Menus, combats, chargements et perte du focus suspendent le délai. La course actuelle se fait à pied sur la carte condensée.',
    failure: 'La fenêtre s’est refermée avant le passage. Revenez au point de contrôle de Vigil pour demander une nouvelle activation.',
    completion: 'Le passage a été atteint à temps. Le choix de poursuivre vers la Citadelle reste explicite.',
    checkpointNote: 'La reprise ramène à Vigil et attend votre nouvelle activation ; elle ne retire aucun combat ni ressource acquis.',
    steps: [
      { id: 'vigil', label: 'Vigil · activer le passage', x: -5, z: -84, text: 'Le Conduit mène à la Citadelle. Une fois le passage stabilisé, vous devrez le rejoindre sans attendre.' },
      { id: 'conduit', label: 'Conduit · franchir le passage', x: -4, z: -97, text: 'Le passage est encore actif. Confirmez l’arrivée du commando avant la fermeture de la fenêtre.' },
    ],
    reference: 'Objectif ME1 suivi par QST-course-au-conduit. La fenêtre de 60 secondes et la course à pied sont adaptées ; la durée et la course originale au Mako ne sont pas certifiées ni reproduites.',
  },
});

const IDS = Object.keys(MISSION_DEFINITIONS);
const emptyRecord = () => ({ status: 'idle', steps: [], remaining: null, attempts: 0, channel: null });
export function createMissionProgress() {
  return { version: MISSION_PROGRESS_VERSION, records: Object.fromEntries(IDS.map(id => [id, emptyRecord()])) };
}

function plain(value) { return value !== null && typeof value === 'object' && [Object.prototype, null].includes(Object.getPrototypeOf(value)); }
function exact(value, names) {
  if (!plain(value)) return false;
  const keys = Reflect.ownKeys(value);
  return keys.length === names.length && keys.every(key => typeof key === 'string' && names.includes(key)
    && Object.getOwnPropertyDescriptor(value, key)?.enumerable === true
    && own(Object.getOwnPropertyDescriptor(value, key), 'value'));
}
function strings(value, allowed) {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype || value.length > allowed.length
    || Reflect.ownKeys(value).length !== value.length + 1) return false;
  const found = new Set();
  for (let index = 0; index < value.length; index++) {
    const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
    if (!descriptor?.enumerable || !own(descriptor, 'value') || typeof descriptor.value !== 'string'
      || !allowed.includes(descriptor.value) || found.has(descriptor.value)) return false;
    found.add(descriptor.value);
  }
  return true;
}
const position = value => exact(value, ['x', 'z']) && Number.isFinite(value.x) && Number.isFinite(value.z)
  && Math.abs(value.x) <= 10_000 && Math.abs(value.z) <= 10_000;
const campaignContext = state => !own(state || {}, 'context') || state.context?.mediaId === 'ME1' && state.context?.periodId === 'me1';
function available(state, id) {
  if (!state || !campaignContext(state) || !Array.isArray(state.completed)) return false;
  if (id === 'eden-prime') return state.flags?.briefed === true;
  if (id === 'noveria') return state.completed.includes('citadel') && state.flags?.spectre === true;
  return ['therum', 'feros', 'noveria', 'virmire'].every(zone => state.completed.includes(zone));
}
function ready(state, id) {
  return available(state, id) && state.zone === id && !state.completed.includes(id)
    && MISSION_DEFINITIONS[id].prerequisites.every(encounter => state.cleared?.includes(encounter));
}

/** Only an absent field migrates. Existing completed chapters receive an honest
 * legacy marker, never four invented disarmings or three invented repairs. */
export function normalizeMissionProgress(raw, state) {
  try {
    if (raw === undefined) {
      const progress = createMissionProgress();
      for (const id of IDS) if (state?.completed?.includes(id)) progress.records[id].status = 'legacy-complete';
      return progress;
    }
    if (!exact(raw, ['version', 'records']) || raw.version !== MISSION_PROGRESS_VERSION || !exact(raw.records, IDS)) return null;
    const result = createMissionProgress();
    for (const id of IDS) {
      const definition = MISSION_DEFINITIONS[id], record = raw.records[id], stepIds = definition.steps.map(step => step.id);
      if (!exact(record, ['status', 'steps', 'remaining', 'attempts', 'channel']) || !STATUSES.has(record.status)
        || !strings(record.steps, stepIds) || !Number.isSafeInteger(record.attempts) || record.attempts < 0 || record.attempts > MAX_ATTEMPTS) return null;
      const idle = record.status === 'idle', legacy = record.status === 'legacy-complete', complete = record.status === 'complete';
      if (idle || legacy) {
        if (record.steps.length || record.remaining !== null || record.attempts !== 0 || record.channel !== null
          || legacy && !state?.completed?.includes(id)) return null;
      } else {
        if (!available(state, id) || !definition.prerequisites.every(encounter => state.cleared?.includes(encounter)) || record.attempts < 1
          || state?.completed?.includes(id) && !complete) return null;
        if (definition.duration !== null && !complete && state?.zone !== id) return null;
        if (complete !== (record.steps.length === stepIds.length)) return null;
        if (id === 'noveria') { if (record.remaining !== null || record.status === 'failed') return null; }
        else if (id === 'ilos' && !record.steps.includes('vigil')) {
          if (record.remaining !== null || record.status !== 'active' || record.steps.length) return null;
        } else if (!Number.isFinite(record.remaining) || record.remaining < 0 || record.remaining > definition.duration
          || (record.status === 'failed') !== (record.remaining === 0)) return null;
        if (id === 'ilos' && record.steps.includes('conduit') && !record.steps.includes('vigil')) return null;
      }
      if (record.channel !== null) {
        if (id !== 'eden-prime' || record.status !== 'active' || !exact(record.channel, ['stepId', 'remaining', 'position'])
          || !stepIds.includes(record.channel.stepId) || record.steps.includes(record.channel.stepId)
          || !Number.isFinite(record.channel.remaining) || record.channel.remaining <= 0 || record.channel.remaining > definition.channelSeconds
          || !position(record.channel.position)) return null;
      }
      result.records[id] = { status: record.status, steps: [...record.steps], remaining: record.remaining, attempts: record.attempts,
        channel: record.channel ? { stepId: record.channel.stepId, remaining: record.channel.remaining, position: { ...record.channel.position } } : null };
    }
    return result;
  } catch { return null; }
}

function progressFor(state) { return normalizeMissionProgress(state?.missionProgress, state); }
const idFor = value => typeof value === 'string' ? (IDS.includes(value) ? value : value.startsWith('mission:') && value.split(':').length === 3 ? value.split(':')[1] : null) : null;
const stepFor = value => typeof value === 'string' && value.startsWith('mission:') ? value.split(':')[2] || null : null;
const poiId = (id, stepId) => `mission:${id}:${stepId}`;

export function getMissionProgress(state, id = state?.zone) {
  if (!own(MISSION_DEFINITIONS, id)) return null;
  const progress = progressFor(state); if (!progress) return null;
  const definition = MISSION_DEFINITIONS[id], record = progress.records[id];
  return { id, catalogId: definition.catalogId, title: definition.title, status: record.status, attempts: record.attempts,
    remaining: record.remaining, channel: record.channel, complete: done(record.status), started: record.status !== 'idle',
    canStart: ready(state, id), rules: definition.rules, checkpointNote: definition.checkpointNote,
    steps: definition.steps.map(step => ({ ...step, done: record.steps.includes(step.id) })),
    summary: record.status === 'legacy-complete' ? 'Chapitre déjà terminé dans une sauvegarde antérieure ; détail de cette étape non enregistré.'
      : record.status === 'failed' ? definition.failure : record.status === 'complete' ? definition.completion
        : record.channel ? `Désamorçage en cours · ${Math.ceil(record.channel.remaining)} s` : `${record.steps.length}/${definition.steps.length} étapes accomplies.` };
}

export function getMissionPOIs(state) {
  const id = state?.zone, view = getMissionProgress(state, id);
  if (!view || !available(state, id) || state.completed.includes(id) || !['active', 'failed'].includes(view.status)) return [];
  const definition = MISSION_DEFINITIONS[id];
  const steps = view.status === 'failed' ? [{ id: 'retry', label: 'Reprendre le point de contrôle', ...definition.start }]
    : definition.steps.filter(step => !view.steps.find(item => item.id === step.id).done
      && (id !== 'ilos' || step.id === (view.steps[0].done ? 'conduit' : 'vigil')));
  return steps.map(step => ({ id: poiId(id, step.id), zone: id, label: step.label, type: 'mission', missionId: id, stepId: step.id,
    x: step.x, z: step.z, cleared: false }));
}

export function getMissionInteraction(state, interactionId) {
  const id = idFor(interactionId);
  if (!id || !own(MISSION_DEFINITIONS, id)) return no('Étape de mission inconnue.');
  const definition = MISSION_DEFINITIONS[id], progress = progressFor(state);
  if (!progress) return no('Progression de mission invalide.');
  if (!ready(state, id)) return no(state?.completed?.includes(id) ? 'Cette mission est déjà accomplie.' : 'Rejoignez et sécurisez le secteur requis avant cette étape.');
  const record = progress.records[id], requested = stepFor(interactionId);
  if (record.status === 'idle') return { ok: true, missionId: id, title: definition.title, speaker: definition.speaker,
    text: `${definition.introduction} ${definition.rules}`, choices: [{ id: 'start', label: 'Commencer cette étape.' }, { id: 'leave', label: 'Revenir au terrain.' }] };
  if (record.status === 'failed') return { ok: true, missionId: id, title: definition.title, speaker: 'Point de contrôle',
    text: `${definition.failure} ${definition.checkpointNote}`, choices: [{ id: 'retry', label: 'Reprendre le point de contrôle.' }, { id: 'leave', label: 'Rester sur le terrain.' }] };
  if (done(record.status)) return no('Cette étape est déjà accomplie.');
  const step = definition.steps.find(item => item.id === requested);
  if (!step) return { ok: true, missionId: id, title: definition.title, speaker: definition.speaker,
    text: `${getMissionProgress(state, id).summary} ${definition.rules}`, choices: [{ id: 'leave', label: 'Reprendre la progression.' }] };
  if (record.steps.includes(step.id)) return no('Ce dispositif est déjà traité.');
  if (id === 'ilos' && step.id === 'conduit' && !record.steps.includes('vigil')) return no('Demandez d’abord à Vigil d’activer le passage.');
  if (record.channel && record.channel.stepId !== step.id) return no('Terminez ou annulez le désamorçage en cours.');
  const choice = record.channel ? { id: 'cancel', label: 'Annuler le désamorçage.' }
    : id === 'eden-prime' ? { id: 'disarm', label: 'Désamorcer la charge · 6 secondes immobile.' }
      : id === 'noveria' ? { id: 'repair', label: 'Remettre la station en service.' }
        : step.id === 'vigil' ? { id: 'activate', label: 'Activer la fenêtre du Conduit.' } : { id: 'enter', label: 'Atteindre le passage.' };
  return { ok: true, missionId: id, stepId: step.id, title: step.label, speaker: definition.speaker,
    text: record.channel ? 'La neutralisation est en cours. Restez immobile sur le terrain ou annulez la tentative.' : step.text,
    choices: [choice, { id: 'leave', label: 'Revenir au terrain.' }] };
}

/** The parent supplies the actual displayed POI interaction, including any
 * collision-safe relocation. This domain layer validates zone and current step;
 * spatial proximity is owned by the normal WorldView interaction boundary. */
export function advanceMission(state, interactionId, choice) {
  const interaction = getMissionInteraction(state, interactionId);
  if (!interaction.ok) return interaction;
  if (!interaction.choices.some(candidate => candidate.id === choice)) return no('Action indisponible pour cette étape.');
  if (choice === 'leave') return { ok: true, changed: false, missionId: interaction.missionId, kind: 'leave' };
  const id = interaction.missionId, definition = MISSION_DEFINITIONS[id], progress = progressFor(state), record = progress.records[id];
  let kind, checkpoint;
  if (choice === 'start' || choice === 'retry') {
    if (record.attempts >= MAX_ATTEMPTS) return no('Le nombre maximal de tentatives est atteint.');
    record.status = 'active'; record.steps = []; record.remaining = id === 'eden-prime' ? definition.duration : null;
    record.channel = null; record.attempts++; kind = choice === 'retry' ? 'retry' : 'started';
    if (choice === 'retry') checkpoint = { ...definition.start };
  } else if (choice === 'cancel') { record.channel = null; kind = 'channel-cancelled'; }
  else if (choice === 'disarm') {
    const origin = Number.isFinite(state.position?.x) && Number.isFinite(state.position?.z) && Math.abs(state.position.x) <= 10_000 && Math.abs(state.position.z) <= 10_000
      ? state.position : definition.steps.find(step => step.id === interaction.stepId);
    record.channel = { stepId: interaction.stepId, remaining: definition.channelSeconds, position: { x: origin.x, z: origin.z } }; kind = 'channel-started';
  } else {
    record.steps.push(interaction.stepId);
    if (choice === 'activate') record.remaining = definition.duration;
    if (record.steps.length === definition.steps.length) record.status = 'complete';
    kind = record.status === 'complete' ? 'complete' : choice === 'repair' ? 'repaired' : 'activated';
  }
  state.missionProgress = progress;
  return { ok: true, changed: true, missionId: id, stepId: interaction.stepId || null, kind, ...(checkpoint ? { checkpoint } : {}) };
}

/** dt is mission simulation time, not wall-clock time. The caller suspends this
 * clock for menus, combat, loading and focus loss; the explicit paused flag is
 * additionally enforced here. No timestamp or timeout runs in the background. */
export function tickMission(state, dt, { paused = false, position: currentPosition } = {}) {
  if (paused || !Number.isFinite(dt) || dt <= 0 || !state || !campaignContext(state)) return [];
  const progress = progressFor(state); if (!progress) return [];
  const events = []; let changed = false;
  for (const id of IDS) {
    const record = progress.records[id], definition = MISSION_DEFINITIONS[id];
    if (state.zone !== id || state.completed.includes(id) || record.status !== 'active') continue;
    const step = Math.min(dt, 86_400);
    if (record.remaining !== null) {
      record.remaining = Math.max(0, record.remaining - step); changed = true;
      if (record.remaining <= 1e-9) { record.remaining = 0; record.status = 'failed'; record.channel = null;
        events.push({ type: 'failed', missionId: id, message: definition.failure }); continue; }
    }
    if (record.channel) {
      const actual = currentPosition || state.position;
      if (actual && Number.isFinite(actual.x) && Number.isFinite(actual.z)
        && Math.hypot(actual.x - record.channel.position.x, actual.z - record.channel.position.z) > 1.25) {
        const stepId = record.channel.stepId; record.channel = null; changed = true;
        events.push({ type: 'channel-cancelled', missionId: id, stepId, message: 'Déplacement : la tentative de désamorçage est annulée.' }); continue;
      }
      record.channel.remaining = Math.max(0, record.channel.remaining - step); changed = true;
      if (record.channel.remaining <= 1e-9) {
        const stepId = record.channel.stepId; record.channel = null; record.steps.push(stepId);
        if (record.steps.length === definition.steps.length) record.status = 'complete';
        events.push({ type: record.status === 'complete' ? 'complete' : 'step-complete', missionId: id, stepId,
          message: record.status === 'complete' ? definition.completion : `${definition.steps.find(item => item.id === stepId).label} neutralisée.` });
      }
    }
  }
  if (changed) state.missionProgress = progress;
  return events;
}

/** Backwards-compatible primitive boundary: an untouched record does not add
 * invented prerequisites to historical native completeZone callbacks. The
 * player-facing path starts every supported mission at its encounter/objective
 * gate, then active and failed records must be resolved before chapter rewards. */
export function canCompleteMission(state, id = state?.zone) {
  if (!own(MISSION_DEFINITIONS, id)) return true;
  const progress = progressFor(state); if (!progress) return false;
  return !['active', 'failed'].includes(progress.records[id].status);
}

export function getMissionEncounterGate(state, encounterId) {
  if (typeof encounterId !== 'string') return null;
  const id = encounterId.split(':')[0], definition = own(MISSION_DEFINITIONS, id) ? MISSION_DEFINITIONS[id] : null;
  if (!definition?.encounterGate.includes(encounterId) || state?.zone !== id || state.completed?.includes(id)
    || !definition.prerequisites.every(encounter => state.cleared?.includes(encounter))) return null;
  const view = getMissionProgress(state, id);
  return view && !view.complete ? { missionId: id, status: view.status, title: definition.title,
    reason: view.status === 'idle' ? definition.introduction : view.summary,
    interaction: getMissionInteraction(state, id) } : null;
}

export function getMissionTravelGate(state, targetZone) {
  const view = getMissionProgress(state);
  return targetZone !== state?.zone && view && MISSION_DEFINITIONS[view.id].duration !== null
    && ['active', 'failed'].includes(view.status)
    ? { ok: false, missionId: view.id, reason: 'Terminez cette étape ou reprenez son point de contrôle avant de quitter la zone.' } : { ok: true };
}
