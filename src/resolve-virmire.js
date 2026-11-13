// ME1 Virmire, condensed French adaptation. The existing sprites, 3D terrain
// and ATB encounters remain authoritative; this module owns narrative facts.
const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
const has = (values, value) => Array.isArray(values) && values.includes(value);
const no = reason => ({ ok: false, reason });
const exact = (value, keys) => value !== null && typeof value === 'object' && !Array.isArray(value)
  && [Object.prototype, null].includes(Object.getPrototypeOf(value)) && Reflect.ownKeys(value).length === keys.length
  && keys.every(key => { const d = Object.getOwnPropertyDescriptor(value, key); return d?.enumerable && own(d, 'value'); });
const scoped = state => state && (!own(state, 'mediaId') || state.mediaId === 'ME1')
  && (!own(state, 'periodId') || state.periodId === 'me1')
  && (!own(state, 'context') || state.context?.mediaId === 'ME1' && state.context?.periodId === 'me1');
const available = state => scoped(state) && has(state.completed, 'citadel') && state.flags?.spectre === true
  && ['therum', 'feros', 'noveria'].filter(zone => has(state.completed, zone)).length >= 2;
const cleared = (state, suffix) => has(state?.cleared, `virmire:${suffix}`);
const FIELDS = ['version', 'legacy', 'briefed', 'stgVolunteer', 'support', 'alarms', 'rana', 'beacon', 'sovereign', 'bombArmed', 'rescue'];
const SUPPORT = ['communications', 'satellite', 'flyers'];
const RESCUES = [null, 'save-ashley', 'save-kaidan'];
const started = p => p.briefed || p.stgVolunteer !== null || SUPPORT.some(key => p.support[key]) || p.alarms !== null
  || p.rana !== null || p.beacon || p.sovereign || p.bombArmed || p.rescue !== null;
const freeze = value => { if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); } return value; };
export const RESOLVE_VIRMIRE_POIS = freeze({
  briefing: { label: 'Kirrahe · plan d’infiltration', x: 23, z: 33 },
  communications: { label: 'STG · tour de communications', x: -6, z: 0 },
  satellite: { label: 'STG · liaison satellite', x: 8, z: -15 },
  flyers: { label: 'STG · drones de ravitaillement', x: 19, z: -24 },
  alarms: { label: 'STG · console des alarmes', x: 24, z: -32 },
  rana: { label: 'Rana Thanoptis · laboratoire', x: 30, z: -45 },
  beacon: { label: 'Laboratoire de Saren · balise', x: 21, z: -50 },
  sovereign: { label: 'Sovereign · transmission', x: 18, z: -53 },
  bomb: { label: 'Site de la bombe · message du commando', x: -14, z: -72 },
  rescue: { label: 'Canal d’urgence · choix d’extraction', x: -8, z: -69 },
});

export function createResolveVirmireState() {
  return { version: 1, legacy: false, briefed: false, stgVolunteer: null,
    support: { communications: false, satellite: false, flyers: false }, alarms: null,
    rana: null, beacon: false, sovereign: false, bombArmed: false, rescue: null };
}

/** Only absent old data migrates. No absent objective is inferred as played. */
export function normalizeResolveVirmireState(raw, state = null) {
  try {
    if (raw === undefined) {
      const p = createResolveVirmireState();
      p.legacy = has(state?.completed, 'virmire') || ['encounter-1', 'encounter-2', 'boss'].some(key => cleared(state, key));
      return p;
    }
    if (!exact(raw, FIELDS) || raw.version !== 1 || !exact(raw.support, SUPPORT)
      || !['legacy', 'briefed', 'beacon', 'sovereign', 'bombArmed'].every(key => typeof raw[key] === 'boolean')
      || !SUPPORT.every(key => typeof raw.support[key] === 'boolean')
      || ![null, 'ashley', 'kaidan'].includes(raw.stgVolunteer) || ![null, 'disabled', 'diverted'].includes(raw.alarms)
      || ![null, 'released', 'killed'].includes(raw.rana) || !RESCUES.includes(raw.rescue)) return null;
    const begun = started(raw);
    if (raw.legacy) {
      if (begun || state && !has(state.completed, 'virmire') && !['encounter-1', 'encounter-2', 'boss'].some(key => cleared(state, key))) return null;
    } else {
      if (raw.briefed !== (raw.stgVolunteer !== null) || (SUPPORT.some(key => raw.support[key]) || raw.alarms !== null || raw.rana !== null) && !raw.briefed
        || raw.beacon && raw.rana === null || raw.sovereign && !raw.beacon || raw.bombArmed && !raw.sovereign
        || raw.rescue !== null && !raw.bombArmed) return null;
      if (state && (begun && !available(state) || begun && !has(state.completed, 'virmire') && state.zone !== 'virmire'
        || (SUPPORT.some(key => raw.support[key]) || raw.alarms !== null) && !cleared(state, 'encounter-1')
        || raw.rana !== null && !cleared(state, 'encounter-2') || has(state.completed, 'virmire') && (raw.rescue === null || state.choices?.virmire !== raw.rescue))) return null;
    }
    return { ...raw, support: { ...raw.support } };
  } catch { return null; }
}
const progressFor = state => normalizeResolveVirmireState(state?.resolveVirmire, state);
export function isResolveVirmireUntouched(state) { const p = progressFor(state); return !!p && !p.legacy && !started(p); }
/** Assigned human crewmates remain recruited and alive until extraction, but
 * cannot fight beside Shepard while their separate field role is active. */
export function getResolveVirmireAwayCrew(state) {
  const p = progressFor(state);
  if (!p || p.legacy || !p.briefed || has(state?.completed, 'virmire')) return [];
  return p.bombArmed ? [p.stgVolunteer, defender(p)] : [p.stgVolunteer];
}

/** Preserve present companions, then fill only from recruited living crew.
 * A reduced squad is valid when no third available crewmate exists. */
export function reconcileResolveVirmireParty(state) {
  if (!progressFor(state) || !Array.isArray(state?.party) || !Array.isArray(state?.recruited) || !Array.isArray(state?.lost)) return null;
  const away = getResolveVirmireAwayCrew(state), playable = ['ashley', 'kaidan', 'garrus', 'tali', 'wrex', 'liara'];
  const available = id => playable.includes(id) && state.recruited.includes(id) && !state.lost.includes(id) && !away.includes(id);
  const companions = [...new Set([...state.party.slice(1), ...state.recruited].filter(available))].slice(0, 2);
  return ['shepard', ...companions];
}

export function resolveVirmireTravelGate(state, targetZone) {
  if (getResolveVirmireAwayCrew(state).length && targetZone !== 'virmire')
    return no('Ashley et Kaidan ont reçu leurs rôles sur Virmire. Achevez l’opération avant de quitter le site.');
  return { ok: true };
}
const poiId = key => `resolve:virmire:${key}`;
const keyFor = id => typeof id === 'string' && id.startsWith('resolve:virmire:') ? id.slice('resolve:virmire:'.length) : null;
const choice = (id, label, extra = {}) => ({ id, label, ...extra });
const model = (id, speaker, text, choices, catalogIds) => ({ ok: true, id, speaker, text, choices, catalogIds,
  portrait: speaker === 'Capitaine Kirrahe' ? 'kirrahe' : null });
const name = id => id === 'ashley' ? 'Ashley' : 'Kaidan';
const defender = p => p.stgVolunteer === 'ashley' ? 'kaidan' : 'ashley';

/** Detached public dialogue model, shared by world markers and transactions. */
export function getResolveVirmireInteraction(state, id) {
  const p = progressFor(state), key = keyFor(id);
  if (!p || p.legacy || !available(state) || state.zone !== 'virmire' || has(state.completed, 'virmire')) return no('Cette étape de Virmire n’est pas disponible.');
  if (key === 'briefing' && !p.briefed && !cleared(state, 'encounter-2')) return model(id, 'Capitaine Kirrahe',
    'Saren produit ici une armée de krogans. Le noyau de notre vaisseau servira de bombe, mais le Normandy doit le déposer au cœur de la base. Mes équipes feront diversion pendant votre infiltration ; nous devons neutraliser la défense antiaérienne. Ashley ou Kaidan doit diriger une équipe du STG. Sur votre route, brouillez les communications, détruisez la liaison satellite et neutralisez les drones de la plateforme de ravitaillement. Ces soutiens sont facultatifs et seront suivis séparément.',
    [choice('send-ashley', 'Affecter Ashley à l’équipe du STG.'), choice('send-kaidan', 'Affecter Kaidan à l’équipe du STG.')],
    ['DIA-kirrahe-briefing', 'CHC-affectation-virmire', 'CHC-soutien-a-kirrahe']);
  if (SUPPORT.includes(key) && p.briefed && cleared(state, 'encounter-1') && !cleared(state, 'encounter-2') && !p.support[key]) {
    const texts = { communications: ['Tour de communications geth', 'La console de triangulation dessert les communications geth. La perturber réduit la coordination adverse pendant la diversion du STG.', 'disrupt', 'Perturber les communications.'],
      satellite: ['Liaison satellite geth', 'L’antenne de liaison est exposée au-dessus de la tour. Détruisez-la pour priver les défenseurs de ce relais.', 'destroy', 'Détruire la liaison satellite.'],
      flyers: ['Plateforme de ravitaillement geth', 'Des drones geth se ravitaillent sur cette plateforme. Les réservoirs de carburant offrent une cible pour les neutraliser et soutenir le STG.', 'destroy', 'Détruire les réservoirs et neutraliser les drones.'] };
    const [speaker, text, selected, label] = texts[key]; return model(id, speaker, text, [choice(selected, label)], ['CHC-soutien-a-kirrahe']);
  }
  if (key === 'alarms' && p.briefed && cleared(state, 'encounter-1') && !cleared(state, 'encounter-2') && p.alarms === null) return model(id, 'Console de sécurité geth',
    'La console peut désactiver les alarmes afin d’aider les équipes galariennes, ou déclencher une alerte de leur côté pour détourner les défenseurs de votre route.',
    [choice('disable', 'Désactiver les alarmes pour aider le STG.'), choice('divert', 'Déclencher l’alerte du côté du STG.')], ['CHC-soutien-a-kirrahe', 'NPC-kirrahe']);
  if (key === 'rana' && p.briefed && cleared(state, 'encounter-2') && p.rana === null) return model(id, 'Rana Thanoptis',
    'J’étudiais les effets de l’endoctrinement pour Saren. L’influence vient de son vaisseau, Sovereign ; même Saren pourrait y être exposé. J’ai ouvert l’ascenseur de son laboratoire privé. Laissez-moi quitter cette base.',
    [choice('release', 'Laisser Rana quitter le laboratoire.'), choice('kill', 'Exécuter Rana.')], ['NPC-rana-thanoptis', 'CHC-sort-de-rana']);
  if (key === 'beacon' && p.rana !== null && !p.beacon) return model(id, 'Balise prothéenne du laboratoire',
    'Une seconde balise se trouve dans le laboratoire privé de Saren. Son activation transmet une autre vision fragmentée à Shepard. L’origine et le but de la menace restent encore à comprendre.',
    [choice('activate', 'Activer la balise du laboratoire.')], ['QST-revelation-de-sovereign']);
  if (key === 'sovereign' && p.beacon && !p.sovereign) return model(id, 'Sovereign · projection de communication',
    'La transmission révèle que Sovereign est lui-même un Moissonneur. Il décrit un cycle de destruction des civilisations organiques et affirme que les Moissonneurs ont construit la Citadelle et les relais pour orienter leur développement. Saren sert cette intelligence. Shepard refuse de céder ; la communication est coupée. Les explications de Vigil et le fonctionnement du Conduit restent inconnus.',
    [choice('confront', 'Interroger Sovereign et refuser de se soumettre.')], ['DIA-sovereign-transmission', 'QST-revelation-de-sovereign']);
  if (key === 'bomb' && p.sovereign && !p.bombArmed) return model(id, 'Canal du commando · site de la bombe',
    `Le Normandy a déposé la bombe après la neutralisation des défenses antiaériennes. ${name(p.stgVolunteer)} est avec le STG à la tour antiaérienne ; ${name(defender(p))} reste pour armer la bombe. Un transport geth déploie des renforts. ${name(defender(p))} arme la charge avant d’être débordé. Il reste une seule extraction possible.`,
    [choice('acknowledge', 'Recevoir l’alerte et préparer le choix d’extraction.')], ['CHC-affectation-virmire', 'QST-choix-de-virmire']);
  if (key === 'rescue' && p.bombArmed && p.rescue === null) return model(id, 'Joker · canal d’urgence',
    `${name(p.stgVolunteer)} tient la tour antiaérienne avec le STG. ${name(defender(p))} défend la bombe armée. Vous pouvez rejoindre une seule position avant l’explosion ; la personne laissée derrière ne reviendra pas. Le choix est définitif. Saren vous attend avant le départ.`,
    ['ashley', 'kaidan'].map(id => choice(`save-${id}`, `Rejoindre ${name(id)} · ${p.stgVolunteer === id ? 'tour antiaérienne' : 'site de la bombe'}.`)),
    ['CHC-affectation-virmire', 'QST-choix-de-virmire']);
  return no('Cette interaction est déjà résolue ou ses conditions ne sont pas remplies.');
}

/** Validate first. Caller commits progress, logs once, then saves the checkpoint. */
export function transitionResolveVirmire(state, id, choiceId) {
  const current = getResolveVirmireInteraction(state, id);
  if (!current.ok) return current;
  const selected = current.choices.find(entry => entry.id === choiceId);
  if (!selected || selected.disabled) return no(selected?.reason || 'Cette réponse n’est pas disponible.');
  const key = keyFor(id), anchor = RESOLVE_VIRMIRE_POIS[key];
  if (!anchor || !Number.isFinite(state.position?.x) || !Number.isFinite(state.position?.z)
    || Math.hypot(state.position.x - anchor.x, state.position.z - anchor.z) > 7) return no('Approchez ce point avant d’intervenir.');
  const p = progressFor(state); let response;
  if (key === 'briefing') { p.briefed = true; p.stgVolunteer = choiceId === 'send-ashley' ? 'ashley' : 'kaidan'; response = `${name(p.stgVolunteer)} dirige l’équipe du STG. Les trois objectifs de soutien restent à accomplir séparément. L’autre équipier sera responsable de la bombe quand elle sera déposée.`; }
  else if (SUPPORT.includes(key)) { p.support[key] = true; response = { communications: 'Communications geth perturbées.', satellite: 'Liaison satellite détruite.', flyers: 'Drones de ravitaillement neutralisés.' }[key] + ' Ce soutien au STG est enregistré séparément.'; }
  else if (key === 'alarms') { p.alarms = choiceId === 'disable' ? 'disabled' : 'diverted'; response = p.alarms === 'disabled' ? 'Alarmes désactivées pour faciliter la progression du STG.' : 'L’alerte attire les défenseurs vers le STG.'; }
  else if (key === 'rana') { p.rana = choiceId === 'release' ? 'released' : 'killed'; response = p.rana === 'released' ? 'Rana est autorisée à quitter la base. L’accès au laboratoire reste ouvert.' : 'Rana est exécutée. L’accès au laboratoire reste ouvert.'; }
  else if (key === 'beacon') { p.beacon = true; response = 'La seconde vision est enregistrée. Une projection se manifeste à l’étage : rejoignez le point de transmission.'; }
  else if (key === 'sovereign') { p.sovereign = true; response = 'Sovereign est identifié comme un Moissonneur. Le dossier du Codex est maintenant disponible ; le Conduit reste inexpliqué.'; }
  else if (key === 'bomb') { p.bombArmed = true; response = `${name(defender(p))} confirme que la bombe est armée. Choisissez la position d’extraction sur le canal d’urgence.`; }
  else if (key === 'rescue') { p.rescue = choiceId; const survivor = choiceId.slice(5); response = `Ordre confirmé : rejoindre ${name(survivor)} ${p.stgVolunteer === survivor ? 'à la tour antiaérienne' : 'au site de la bombe'}. ${name(survivor === 'ashley' ? 'kaidan' : 'ashley')} restera sur Virmire. Arrêtez Saren avant l’extraction.`; }
  const progress = normalizeResolveVirmireState(p, state);
  return progress ? { ok: true, progress, response, log: { title: `Virmire · ${current.speaker}`, text: response },
    catalogIds: [...current.catalogIds] } : no('La transition créerait une progression incohérente.');
}

export function listResolveVirmirePOIs(state) {
  return Object.entries(RESOLVE_VIRMIRE_POIS).map(([key, point]) => ({ id: poiId(key), ...point }))
    .filter(point => getResolveVirmireInteraction(state, point.id).ok)
    .map(point => ({ ...point, zone: 'virmire', type: 'dialogue', resolveVirmire: true, cleared: false }));
}

export function resolveVirmireEncounterGate(state, encounterId) {
  if (!['virmire:encounter-1', 'virmire:encounter-2', 'virmire:boss'].includes(encounterId)) return { ok: true };
  const p = progressFor(state);
  if (!p) return no('Progression de Virmire invalide.');
  if (p.legacy) return { ok: true };
  if (!p.briefed) return no('Recevez le plan de Kirrahe et affectez Ashley ou Kaidan au STG.');
  if (encounterId === 'virmire:boss' && p.rescue === null) return no('Rencontrez Rana, activez la balise, répondez à Sovereign puis fixez l’extraction avant Saren.');
  return { ok: true };
}

export function resolveVirmireCompletionGate(state, choiceId = null) {
  const p = progressFor(state);
  if (!p) return no('Progression de Virmire invalide.');
  if (p.legacy) return { ok: true };
  if (p.rescue === null) return no('L’ordre d’extraction doit être confirmé avant le départ.');
  if (choiceId !== null && choiceId !== p.rescue) return no('Le choix d’extraction confirmé est irréversible.');
  return { ok: true };
}

/** Export only facts recorded by this chapter. Survival attribution remains
 * unknown: the consulted Prima guide contradicts the commonly cited flyer rule.
 * No possible outcome in ME2/ME3 is inferred from Rana's departure. */
export function virmireReport(state) {
  const p = progressFor(state);
  if (!p || !scoped(state)) return { known: false };
  const rescue = p.legacy ? state?.choices?.virmire || null : p.rescue;
  const survivor = typeof rescue === 'string' ? rescue.slice(5) : null;
  return { known: !p.legacy, briefed: p.legacy ? null : p.briefed,
    stgVolunteer: p.legacy ? null : p.stgVolunteer, bombDefender: p.legacy || p.stgVolunteer === null ? null : defender(p),
    support: p.legacy ? null : { ...p.support }, alarms: p.legacy ? null : p.alarms,
    kirraheSurvived: null, rana: p.legacy ? null : p.rana,
    beacon: p.legacy ? null : p.beacon, sovereign: p.legacy ? has(state.completed, 'virmire') : p.sovereign,
    bombArmed: p.legacy ? null : p.bombArmed, rescue, survivor,
    lost: survivor === null ? null : survivor === 'ashley' ? 'kaidan' : 'ashley',
    extractionSite: p.legacy || survivor === null ? null : survivor === p.stgVolunteer ? 'aa-tower' : 'bomb' };
}
