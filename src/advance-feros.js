// ME1 Feros: persistent, individually targeted field decisions. French text,
// seamless geography and civilian actions are an adaptation, not original ATB.
const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const has = (array, key) => Array.isArray(array) && array.includes(key);
const no = reason => ({ ok: false, reason });
const freeze = value => { if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); } return value; };
const exact = (value, keys) => value !== null && typeof value === 'object' && !Array.isArray(value)
  && [Object.prototype, null].includes(Object.getPrototypeOf(value)) && Reflect.ownKeys(value).length === keys.length
  && keys.every(key => { const d = Object.getOwnPropertyDescriptor(value, key); return d?.enumerable && own(d, 'value'); });
const scoped = state => state && (!own(state, 'mediaId') || state.mediaId === 'ME1')
  && (!own(state, 'periodId') || state.periodId === 'me1')
  && (!own(state, 'context') || state.context?.mediaId === 'ME1' && state.context?.periodId === 'me1');
const permitted = state => scoped(state) && has(state.completed, 'citadel') && state.flags?.spectre === true;
const cleared = (state, suffix) => has(state.cleared, `feros:${suffix}`);
const FIELDS = ['version', 'legacy', 'defense', 'lizbeth', 'investigation', 'valves', 'shipReleased', 'jeong', 'gasIssued', 'colonists', 'freighterOpened', 'cipher', 'shiala'];
const METHODS = [null, 'gas', 'melee', 'lethal'];
const JEONG = [null, 'persuaded', 'intimidated', 'killed'];
const SHIALA = [null, 'spared', 'killed'];
// Named civilian bodies already supplied by Horizon; unnamed colonists use a
// generic civilian key. Fai Dan is deliberately absent from this saveable set.
export const FEROS_COLONIST_TARGETS = freeze([
  { id: 'garage-1', name: 'Colon du garage 1', x: -35, z: 58 },
  { id: 'garage-2', name: 'Colon du garage 2', x: -27, z: 58 },
  { id: 'garage-3', name: 'Colon du garage 3', x: -19, z: 58 },
  { id: 'garage-4', name: 'Colon du garage 4', x: -11, z: 58 },
  { id: 'access-1', name: 'Colon de l’accès 1', x: -39, z: 64 },
  { id: 'access-2', name: 'Colon de l’accès 2', x: -34, z: 70 },
  { id: 'colony-1', name: 'Colon de la place 1', x: -43, z: 72 },
  { id: 'colony-2', name: 'Colon de la place 2', x: -36, z: 76 },
  { id: 'colony-3', name: 'Colon de la place 3', x: -28, z: 77 },
  { id: 'colony-4', name: 'Colon de la place 4', x: -20, z: 76 },
  { id: 'colony-5', name: 'Colon de la place 5', x: -12, z: 70 },
  { id: 'colony-6', name: 'Colon de la place 6', x: -8, z: 64 },
  { id: 'arcelia', name: 'Arcelia Silva Martinez', characterKey: 'arcelia', x: -15, z: 65 },
  { id: 'macha', name: 'Macha Doyle', characterKey: 'macha', x: -31, z: 52 },
  { id: 'davin', name: 'Davin Reynolds', characterKey: 'davin', x: -13, z: 52 },
  { id: 'colony-7', name: 'Colon de la place 7', x: -24, z: 67 },
]);
const TARGET_IDS = FEROS_COLONIST_TARGETS.map(target => target.id);
export const FEROS_PRESSURE_VALVES = freeze([5, 7, 17, 11, 13]);
const STATIC_POIS = freeze({
  defense: { label: 'Fai Dan · défense de Zhu’s Hope', x: -26, z: 64 },
  lizbeth: { label: 'Lizbeth · témoin d’ExoGeni', x: 8, z: -40 },
  investigation: { label: 'ExoGeni · interface de recherche', x: 23, z: -48 },
  pressure: { label: 'ExoGeni · commande de la griffe', x: 30, z: -54 },
  jeong: { label: 'Ethan Jeong · ordre de purge', x: -20, z: -10 },
  juliana: { label: 'Juliana · gaz anti-Thorien', x: -25, z: -13 },
  freighter: { label: 'Zhu’s Hope · commandes du cargo', x: -24, z: 72 },
  shiala: { label: 'Shiala · le Cipher', x: 0, z: -91 },
});

export function createAdvanceFerosState() {
  return { version: 1, legacy: false, defense: false, lizbeth: false, investigation: false,
    valves: 0, shipReleased: false, jeong: null, gasIssued: false,
    colonists: Object.fromEntries(TARGET_IDS.map(id => [id, null])), freighterOpened: false, cipher: false, shiala: null };
}

/** Missing old state migrates honestly. Explicit malformed state never resets. */
export function normalizeAdvanceFerosState(raw, state = null) {
  try {
    if (raw === undefined) {
      const result = createAdvanceFerosState();
      result.legacy = has(state?.completed, 'feros') || cleared(state || {}, 'boss');
      return result;
    }
    if (!exact(raw, FIELDS) || raw.version !== 1
      || !['legacy', 'defense', 'lizbeth', 'investigation', 'shipReleased', 'gasIssued', 'freighterOpened', 'cipher'].every(key => typeof raw[key] === 'boolean')
      || !Number.isInteger(raw.valves) || raw.valves < 0 || raw.valves > 31
      || !JEONG.includes(raw.jeong) || !SHIALA.includes(raw.shiala) || !exact(raw.colonists, TARGET_IDS)
      || !TARGET_IDS.every(id => METHODS.includes(raw.colonists[id]))) return null;
    const resolved = TARGET_IDS.filter(id => raw.colonists[id] !== null).length;
    const started = raw.defense || raw.lizbeth || raw.investigation || raw.valves || raw.shipReleased
      || raw.jeong !== null || raw.gasIssued || resolved || raw.freighterOpened || raw.cipher || raw.shiala !== null;
    if (raw.legacy) {
      if (started || state && !has(state.completed, 'feros') && !cleared(state, 'boss')) return null;
    } else {
      if (raw.lizbeth && !raw.defense || raw.investigation && !raw.lizbeth || raw.valves && !raw.investigation
        || raw.shipReleased && (!raw.investigation || ferosPressure(raw) < 31 || ferosPressure(raw) > 34)
        || raw.jeong !== null && !raw.shipReleased || raw.gasIssued && raw.jeong === null
        || resolved && !raw.gasIssued || raw.freighterOpened && resolved !== 16
        || raw.cipher && !raw.freighterOpened || raw.shiala !== null && !raw.cipher) return null;
      if (state && (started && !permitted(state) || raw.defense && !cleared(state, 'encounter-1')
        || raw.investigation && !cleared(state, 'encounter-2') || raw.cipher && !cleared(state, 'boss')
        || raw.jeong === 'persuaded' && (!Number.isFinite(state.paragon) || state.paragon < 20)
        || raw.jeong === 'intimidated' && (!Number.isFinite(state.renegade) || state.renegade < 20)
        || has(state.completed, 'feros') && (!raw.cipher || raw.shiala === null
          || state.choices?.feros !== (TARGET_IDS.some(id => ['gas', 'melee'].includes(raw.colonists[id])) ? 'save' : 'force')))) return null;
    }
    return { ...raw, colonists: Object.fromEntries(TARGET_IDS.map(id => [id, raw.colonists[id]])) };
  } catch { return null; }
}

export function ferosPressure(progress) {
  return FEROS_PRESSURE_VALVES.reduce((total, pressure, index) => total + (progress.valves & 1 << index ? pressure : 0), 0);
}
const progressFor = state => normalizeAdvanceFerosState(state?.advanceFeros, state);
/** Existing low-level campaign fixtures may finish an untouched chapter. Their
 * completion is retained as legacy, never promoted into sixteen target acts. */
export function isAdvanceFerosUntouched(state) {
  const p = progressFor(state);
  return !!p && !p.legacy && !p.defense;
}
const poiId = key => `advance:feros:${key}`;
const targetFor = id => FEROS_COLONIST_TARGETS.find(target => poiId(`colonist-${target.id}`) === id);
const keyFor = id => typeof id === 'string' && id.startsWith('advance:feros:') ? id.slice('advance:feros:'.length) : null;
const model = (id, speaker, text, choices, catalogIds) => ({ ok: true, id, speaker, text, choices, catalogIds });
const choice = (id, label, extra = {}) => ({ id, label, ...extra });

/** The same detached model powers world markers and choice validation. */
export function getAdvanceFerosInteraction(state, id) {
  const p = progressFor(state), key = keyFor(id), target = targetFor(id);
  if (!p || p.legacy || !permitted(state) || state.zone !== 'feros' || has(state.completed, 'feros')) return no('Cette étape de Féros n’est pas disponible.');
  if (key === 'defense' && cleared(state, 'encounter-1') && !p.defense) return model(id, 'Fai Dan',
    'Les geth ont été repoussés sur la route. Zhu’s Hope a besoin de vous : vérifiez nos installations et gagnez ExoGeni pour comprendre cette attaque.',
    [choice('coordinate', 'Organiser la défense et poursuivre vers ExoGeni.')], ['QST-defense-de-zhu-s-hope']);
  if (key === 'lizbeth' && p.defense && !p.lizbeth) return model(id, 'Lizbeth Baynham',
    'Je travaille à ExoGeni. Les geth s’intéressent au Thorien, une forme de vie ancienne que nos chercheurs étudient. Prenez ma carte : elle vous donnera accès à l’interface du laboratoire. Le vaisseau geth alimente le champ de force.',
    [choice('listen', 'Recueillir le témoignage et la carte d’accès.')], ['DIA-exogeni-temoignage', 'QST-enquete-exogeni']);
  if (key === 'investigation' && p.lizbeth && cleared(state, 'encounter-2') && !p.investigation) return model(id, 'Interface ExoGeni',
    'Identification de Lizbeth acceptée. Le Thorien est une plante consciente sous Zhu’s Hope. Ses spores permettent d’influencer les organismes contaminés ; la population de la colonie est exposée. La griffe du vaisseau bloque la porte de la baie.',
    [choice('research', 'Enregistrer les recherches sur les spores et la colonie.')], ['QST-enquete-exogeni']);
  if (key === 'pressure' && p.investigation && !p.shipReleased) return model(id, 'Commande de la baie ExoGeni',
    `Pression de fermeture : ${ferosPressure(p)} PSI. L’avertissement signale un claquement dangereux entre 31 et 34 PSI. Réglez les vannes, puis actionnez la porte pour sectionner la griffe.`,
    [...FEROS_PRESSURE_VALVES.map((pressure, index) => choice(`valve-${index}`, `${p.valves & 1 << index ? 'Fermer' : 'Ouvrir'} la vanne ${index + 1} · ${pressure} PSI`)),
      choice('release', 'Actionner la porte de la baie.', { disabled: ferosPressure(p) < 31 || ferosPressure(p) > 34,
        reason: ferosPressure(p) < 31 || ferosPressure(p) > 34 ? 'La pression doit être comprise entre 31 et 34 PSI.' : '' })], ['QST-degagement-du-vaisseau-geth']);
  if (key === 'jeong' && p.shipReleased && p.jeong === null) return model(id, 'Ethan Jeong',
    'Le siège d’ExoGeni ordonne de purger la colonie pour contenir la situation. Je ne peux pas laisser ces colons compromettre l’entreprise. Si vous vous interposez, je sortirai mon arme.',
    [choice('persuade', 'La colonie vivante peut encore servir ExoGeni.', { tone: 'paragon', disabled: state.paragon < 20,
      reason: '20 points conciliants requis.' }),
    choice('intimidate', 'Vous allez aider les colons, ou répondre de vos actes.', { tone: 'renegade', disabled: state.renegade < 20,
      reason: '20 points pragmatiques requis.' }),
    choice('confront', 'Refuser la purge et riposter quand Jeong dégaine.')], ['CHC-affaire-jeong']);
  if (key === 'juliana' && p.jeong !== null && !p.gasIssued) return model(id, 'Juliana Baynham',
    'Les colons sont sous influence. Ce gaz anti-Thorien permet de les neutraliser sans les tuer. Visez chaque personne : les rampants sont des créatures du Thorien et ne doivent pas être comptés parmi les habitants. Les coups de mêlée peuvent aussi assommer un colon.',
    [choice('prepare', 'Préparer le gaz et les interventions non létales.')], ['QST-retour-des-colons', 'CHC-colons-de-feros']);
  if (target && p.gasIssued && !p.freighterOpened && p.colonists[target.id] === null) return model(id, target.name,
    `${target.name} bloque le passage sous l’influence du Thorien. Choisissez une intervention sur cette personne.`,
    [choice('gas', 'Neutraliser cette cible au gaz anti-Thorien.', { tone: 'paragon' }),
    choice('melee', 'Assommer cette cible au corps à corps.', { tone: 'paragon' }),
    choice('lethal', 'Abattre cette cible.', { tone: 'renegade' })], ['QST-retour-des-colons', 'CHC-colons-de-feros']);
  if (key === 'freighter' && p.gasIssued && !p.freighterOpened) {
    const count = ferosColonyReport(state);
    return model(id, 'Commandes du cargo', `${count.resolved}/16 habitants neutralisés ; ${count.spared} épargnés, ${count.killed} tués. Le cargo masque l’accès au repaire. Toutes les cibles doivent être traitées avant de déplacer le cargo.`,
      [choice('open', 'Déplacer le cargo et ouvrir le repaire.', { disabled: count.pending > 0, reason: count.pending ? `${count.pending} cible(s) encore sous influence.` : '' })], ['QST-retour-des-colons']);
  }
  if (key === 'shiala' && cleared(state, 'boss') && p.freighterOpened && !p.cipher) return model(id, 'Shiala',
    'J’étais au service de Bénézia. Saren m’a livrée au Thorien pour communiquer avec lui. Après avoir obtenu ses connaissances, il a ordonné aux geth de le détruire. Je peux vous transmettre le Cipher : une compréhension de la perception prothéenne, pour saisir le sens de la vision de la balise.',
    [choice('receive', 'Accepter la transmission du Cipher.')], ['DIA-shiala-et-le-cypher', 'QST-affrontement-du-thorian']);
  if (key === 'shiala' && p.cipher && p.shiala === null) return model(id, 'Shiala',
    'Le Cipher est maintenant en vous. Le Thorien n’exerce plus son emprise. Je voudrais aider les survivants de Zhu’s Hope ; vous devez décider si vous me laissez vivre.',
    [choice('spare', 'Laisser Shiala vivre et aider la colonie.', { tone: 'paragon' }),
    choice('kill', 'Exécuter Shiala.', { tone: 'renegade' })], ['CHC-sort-de-shiala']);
  return no('Cette interaction est déjà résolue ou ses conditions ne sont pas remplies.');
}

/** Pure transaction: validate first, return a detached candidate, never rewards.
 * The caller commits candidate.progress and autosaves on this safe boundary. */
export function transitionAdvanceFeros(state, id, choiceId) {
  const current = getAdvanceFerosInteraction(state, id);
  if (!current.ok) return current;
  const selected = current.choices.find(entry => entry.id === choiceId);
  if (!selected || selected.disabled) return no(selected?.reason || 'Cette réponse n’est pas disponible.');
  const key = keyFor(id), target = targetFor(id), anchor = target || STATIC_POIS[key];
  if (!Number.isFinite(state.position?.x) || !Number.isFinite(state.position?.z)
    || Math.hypot(state.position.x - anchor.x, state.position.z - anchor.z) > 7) return no('Approchez cette cible avant d’intervenir.');
  const p = progressFor(state);
  let response = '';
  if (key === 'defense') { p.defense = true; response = 'Fai Dan coordonne la défense. Les demandes des habitants restent à accomplir séparément.'; }
  else if (key === 'lizbeth') { p.lizbeth = true; response = 'Le témoignage de Lizbeth et sa carte sont enregistrés. Consultez l’interface après avoir sécurisé ExoGeni.'; }
  else if (key === 'investigation') { p.investigation = true; response = 'Les recherches relient les spores du Thorien à l’influence subie par les habitants de Zhu’s Hope.'; }
  else if (key === 'pressure' && choiceId.startsWith('valve-')) { p.valves ^= 1 << Number(choiceId.slice(6)); response = `Pression réglée : ${ferosPressure(p)} PSI.`; }
  else if (key === 'pressure') { p.shipReleased = true; response = 'La porte sectionne la griffe. Le vaisseau chute et le champ de force tombe : la voie de retour est libérée.'; }
  else if (key === 'jeong') { p.jeong = { persuade: 'persuaded', intimidate: 'intimidated', confront: 'killed' }[choiceId]; response = p.jeong === 'killed' ? 'Jeong dégaine. Shepard riposte et Jeong est tué ; son ordre de purge ne sera pas exécuté.' : 'Jeong renonce à la purge. ExoGeni devra soutenir les survivants.'; }
  else if (key === 'juliana') { p.gasIssued = true; response = 'L’intervention non létale est préparée. Aucun habitant n’a encore été sauvé : chaque cible reste à traiter sur le terrain.'; }
  else if (target) { p.colonists[target.id] = choiceId; response = choiceId === 'lethal' ? `${target.name} est tué.` : `${target.name} est neutralisé sans être tué (${choiceId === 'gas' ? 'gaz anti-Thorien' : 'mêlée'}).`; }
  else if (key === 'freighter') { p.freighterOpened = true; response = 'Le cargo libère l’accès au repaire. Fai Dan lutte contre l’influence du Thorien, puis se tue. Il ne fait pas partie des seize cibles pouvant être épargnées.'; }
  else if (key === 'shiala' && choiceId === 'receive') { p.cipher = true; response = 'Shiala transmet le Cipher. Shepard peut désormais mieux comprendre la vision prothéenne de la balise.'; }
  else if (key === 'shiala') { p.shiala = choiceId === 'spare' ? 'spared' : 'killed'; response = p.shiala === 'spared' ? 'Shiala est épargnée et reste pour aider les survivants.' : 'Shiala est exécutée. La connaissance du Cipher déjà transmise reste acquise.'; }
  const progress = normalizeAdvanceFerosState(p, state);
  return progress ? { ok: true, progress, response, repeat: key === 'pressure' && !p.shipReleased || key === 'shiala' && p.shiala === null,
    catalogIds: [...current.catalogIds] } : no('La transition créerait une progression incohérente.');
}

export function listAdvanceFerosPOIs(state) {
  const points = Object.entries(STATIC_POIS).map(([key, poi]) => ({ id: poiId(key), ...poi }));
  points.push(...FEROS_COLONIST_TARGETS.map(target => ({ id: poiId(`colonist-${target.id}`), label: target.name, x: target.x, z: target.z, targetId: target.id })));
  return points.filter(poi => getAdvanceFerosInteraction(state, poi.id).ok)
    .map(poi => ({ ...poi, zone: 'feros', type: 'dialogue', advanceFeros: true, cleared: false }));
}

export function advanceFerosEncounterGate(state, encounterId) {
  if (!['feros:encounter-2', 'feros:boss'].includes(encounterId)) return { ok: true };
  const p = progressFor(state);
  if (!p) return no('Progression de Féros invalide.');
  if (p.legacy) return { ok: true };
  if (encounterId === 'feros:encounter-2' && !p.lizbeth) return no('Recueillez le témoignage de Lizbeth à ExoGeni.');
  if (encounterId === 'feros:boss' && !p.freighterOpened) return no('Libérez la voie de retour, traitez les seize colons et ouvrez le cargo avant le repaire.');
  return { ok: true };
}

export function advanceFerosCompletionGate(state) {
  const p = progressFor(state);
  if (!p) return no('Progression de Féros invalide.');
  return p.legacy || p.cipher && p.shiala !== null ? { ok: true } : no('Recevez le Cipher de Shiala et décidez de son sort.');
}

export function ferosColonyReport(state) {
  const p = progressFor(state);
  if (!p || p.legacy) return { known: false, total: 16, resolved: 0, pending: 16, spared: null, killed: null,
    gas: null, melee: null, jeong: null, shiala: null, cipher: has(state?.completed, 'feros'), survivors: [], legacyChoice: state?.choices?.feros || null };
  const entries = FEROS_COLONIST_TARGETS.map(target => ({ id: target.id, name: target.name, method: p.colonists[target.id] }));
  const gas = entries.filter(entry => entry.method === 'gas').length, melee = entries.filter(entry => entry.method === 'melee').length;
  const killed = entries.filter(entry => entry.method === 'lethal').length, resolved = gas + melee + killed;
  return { known: true, total: 16, resolved, pending: 16 - resolved, spared: gas + melee, killed, gas, melee,
    jeong: p.jeong, shiala: p.shiala, cipher: p.cipher, survivors: entries.filter(entry => ['gas', 'melee'].includes(entry.method)),
    // This is a compatibility summary, not ME1's full colony-viability score.
    completionChoice: gas + melee > 0 ? 'save' : 'force', legacyChoice: null };
}

export function advanceFerosCivilianAlive(state, id) {
  const p = progressFor(state);
  if (!p || p.legacy) return null;
  if (id === 'shiala') return p.shiala === null ? null : p.shiala === 'spared';
  if (id === 'fai-dan') return !p.freighterOpened;
  if (!TARGET_IDS.includes(id)) return null;
  return p.colonists[id] !== 'lethal';
}
