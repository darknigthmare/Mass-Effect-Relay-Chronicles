// ME1 Citadel investigation, condensed French adaptation of Prima chapter 1.
// Three real ATB encounters retain adapted numbers and placeholder bodies.
// No original dialogue transcript, original arenas or new body art is claimed.
const own = (v, k) => Object.prototype.hasOwnProperty.call(v, k);
const no = reason => ({ ok: false, reason });
const includes = (v, id) => Array.isArray(v) && v.includes(id);
const me1 = state => !!state && (!own(state, 'mediaId') || state.mediaId === 'ME1')
  && (!own(state, 'periodId') || state.periodId === 'me1')
  && (!own(state, 'context') || state.context?.mediaId === 'ME1' && state.context?.periodId === 'me1');
const plain = v => !!v && typeof v === 'object' && [Object.prototype, null].includes(Object.getPrototypeOf(v));
const citadel = state => me1(state) && state.zone === 'citadel' && includes(state.completed, 'eden-prime');
const beforeEden = state => me1(state) && state.zone === 'normandy' && !includes(state.story?.visitedZones, 'eden-prime')
  && !includes(state.completed, 'eden-prime') && !includes(state.cleared, 'eden-prime:encounter-1');

export function createResolveCitadelState() {
  return { version: 1, legacy: false, hearing: false, harkin: false, barla: false,
    clinic: false, michel: false, battles: { clinic: false, fist: false, ambush: false }, fist: null, fistWrex: null, rescue: false, proof: false,
    nihlus: 0, jokerReported: false };
}
export function isResolveCitadelUntouched(state) {
  const p = state?.resolveCitadel;
  return !p || !p.legacy && !p.hearing && !p.harkin && !p.barla && !p.clinic && !p.michel
    && p.fist === null && p.fistWrex === null && !p.rescue && !p.proof
    && !Object.values(p.battles || {}).some(Boolean);
}
/** Missing historical data never invents the contacts, Fist's fate or rescue. */
export function normalizeResolveCitadelState(raw, state) {
  try {
    const initial = createResolveCitadelState();
    if (raw === undefined) return { ...initial, legacy: includes(state?.recruited, 'tali') || includes(state?.completed, 'citadel') };
    if (!plain(raw) || Reflect.ownKeys(raw).length !== Object.keys(initial).length
      || !Object.keys(initial).every(key => own(raw, key))
      || Reflect.ownKeys(raw).some(key => typeof key !== 'string' || !own(initial, key)
        || !Object.getOwnPropertyDescriptor(raw, key).enumerable || !own(Object.getOwnPropertyDescriptor(raw, key), 'value'))) return null;
    if (raw.version !== 1 || !['legacy', 'hearing', 'harkin', 'barla', 'clinic', 'michel', 'rescue', 'proof', 'jokerReported'].every(key => typeof raw[key] === 'boolean')
      || ![null, 'spared', 'shepard', 'wrex'].includes(raw.fist) || ![null, true, false].includes(raw.fistWrex)
      || !Number.isInteger(raw.nihlus) || raw.nihlus < 0 || raw.nihlus > 2) return null;
    if (!me1(state)) return null;
    if (!plain(raw.battles) || Reflect.ownKeys(raw.battles).length !== 3
      || !['clinic', 'fist', 'ambush'].every(key => {
        const field = Object.getOwnPropertyDescriptor(raw.battles,key);
        return field?.enumerable && own(field,'value') && typeof field.value === 'boolean';
      })) return null;
    const p = { ...raw, battles: { ...raw.battles } }, active = !isResolveCitadelUntouched({ resolveCitadel: p });
    if (active && !includes(state.completed, 'eden-prime')) return null;
    if (p.legacy && (p.hearing || p.harkin || p.barla || p.clinic || p.michel || p.fist !== null || p.fistWrex !== null || p.rescue || p.proof || Object.values(p.battles).some(Boolean))) return null;
    if ((p.harkin || p.barla || p.clinic || p.michel || p.fist || p.rescue || p.proof || Object.values(p.battles).some(Boolean)) && !p.hearing) return null;
    if (p.clinic !== p.battles.clinic || p.michel && !p.clinic
      || p.battles.fist && !(p.michel || includes(state.recruited, 'wrex'))
      || p.fist !== null && !p.battles.fist || p.battles.ambush && p.fist === null
      || p.rescue !== p.battles.ambush) return null;
    if (p.battles.fist !== (typeof p.fistWrex === 'boolean') || p.fist === 'wrex' && p.fistWrex !== true
      || p.fist !== null && p.fist !== 'wrex' && p.fistWrex !== false) return null;
    if (p.fistWrex === true && !includes(state.recruited, 'wrex')) return null;
    if (p.rescue && p.fist === null || p.proof && (!p.rescue || !includes(state.recruited, 'tali'))) return null;
    if (p.hearing && !p.legacy && includes(state.recruited, 'tali') && !p.proof) return null;
    if (p.jokerReported && !includes(state.completed, 'eden-prime')) return null;
    if (p.nihlus === 2 && state.flags?.briefed !== true) return null;
    return p;
  } catch { return null; }
}

const pick = (id, label, extra = {}) => ({ id, label, ...extra });
const leave = pick('leave', 'Retour sur le terrain.', { close: true });
const model = (id, speaker, portrait, text, choices, catalogIds) => ({ ok: true, id, speaker, portrait, text, choices, catalogIds });
export function getResolveCitadelInteraction(state, id) {
  const p = normalizeResolveCitadelState(state?.resolveCitadel, state);
  if (!p) return no('Progression de l’enquête invalide.');
  if (id === 'nihlus') {
    if (!beforeEden(state)) return no('Nihlus n’est plus à bord après le débarquement.');
    const revealed = state.flags?.briefed === true;
    return model(id, 'Nihlus Kryik', 'nihlus', p.nihlus === 0
      ? 'Vous êtes arrivé avant le capitaine. Que savez-vous d’Eden Prime ? Le Conseil s’intéresse à cette colonie ; Anderson précisera notre mission.'
      : revealed ? 'La balise concerne tout le Conseil. Je dois aussi évaluer vos décisions sur le terrain : une candidature humaine aux Spectres est envisagée. Ce n’est pas une nomination.'
        : 'Le capitaine vous expliquera pourquoi cette mission dépasse un simple essai du Normandy. Parlons-en avec lui avant de discuter de mon évaluation.', [
      pick('colony', 'Eden Prime doit être protégée.'),
      ...(revealed && p.nihlus >= 1 ? [pick('evaluation', 'Que signifie cette évaluation ?')] : []), leave,
    ], ['DIA-nihlus-observation']);
  }
  if (id === 'joker') {
    if (!me1(state) || state.zone !== 'normandy' || !includes(state.completed, 'eden-prime') || p.jokerReported
      || includes(state.story?.heard, 'joker:eden-prime-report')) return no('Le rapport de retour n’est pas disponible.');
    return model(id, 'Joker', 'joker', 'Le Normandy est prêt à accoster à la Citadelle. Le capitaine a prévenu l’ambassadeur : le Conseil doit entendre le rapport sur Eden Prime, Nihlus et la balise. Vos autres questions peuvent attendre ce rapport.', [
      pick('report', 'Rapport compris. Préparons l’accostage.'), leave,
    ], ['DIA-joker-retour-du-prologue']);
  }
  if (!citadel(state)) return no('Rejoignez la Citadelle après Eden Prime.');
  if (p.legacy) return no('Cette ancienne partie conserve son enquête antérieure ; le sort de Fist n’a pas été enregistré.');
  if (id === 'hearing') return model(id, 'Capitaine Anderson', 'anderson', p.hearing
    ? 'Le Conseil a demandé des preuves. Harkin peut indiquer où chercher Garrus ; Barla Von connaît les intérêts du Courtier de l’Ombre. La clinique est également accessible directement.'
    : 'Le Conseil entend le rapport sur Eden Prime mais ne juge pas les soupçons suffisants pour condamner Saren. Shepard ne reçoit aucune promotion. L’enquête doit désormais établir un lien vérifiable avec les geth.', [pick('report', 'Consigner la demande de preuves.'), leave], ['QST-rapport-a-la-citadelle']);
  if (!p.hearing) return no('Présentez d’abord le rapport sur Eden Prime au Conseil.');
  if (id === 'harkin') return model(id, 'Harkin', 'harkin', 'Garrus cherchait des renseignements sur Saren. Il allait voir le docteur de la clinique des Secteurs supérieurs. Vous pouvez le rejoindre là-bas ; vous n’avez pas besoin d’engager Wrex pour suivre cette piste.', [pick('lead', 'Consigner la piste de la clinique.'), leave], ['NPC-harkin', 'QST-piste-garrus']);
  if (id === 'barla-von') return model(id, 'Barla Von', 'barla-von', 'Saren a contrarié le Courtier de l’Ombre. Un mercenaire krogan, Wrex, a été engagé contre Fist, qui dirige Chora’s Den. Vous trouverez Wrex près du SSC. Cette information ne vous oblige pas à le recruter.', [pick('lead', 'Consigner le contact Wrex au SSC.'), leave], ['NPC-barla-von', 'QST-piste-du-courtier']);
  if (id === 'clinic') return model(id, 'Dr Chloé Michel', 'michel', p.clinic
    ? 'La clinique est accessible. Garrus peut vous proposer son aide. Mon service médical et mon affaire de chantage restent deux sujets distincts de votre enquête sur Saren.'
    : 'Un homme de Fist menace le docteur Michel. Garrus intervient et libère le médecin ; les complices ouvrent le feu. Sécurisez la clinique, puis interrogez Michel.', [p.clinic ? pick('secure', 'Reprendre le témoignage.') : pick('battle', 'Combattre les hommes de Fist.', { encounterId: 'resolve-citadel:clinic-battle' }), leave], ['QST-piste-garrus', 'NPC-dr-chloe-michel']);
  if (id === 'michel') {
    if (!p.clinic) return no('Rejoignez d’abord la scène de la clinique.');
    return model(id, 'Dr Chloé Michel', 'michel', 'J’ai soigné une Quarienne blessée. Elle cherchait le Courtier de l’Ombre et je l’ai orientée vers Fist. Il a envoyé ses hommes pour me réduire au silence. Son bureau à Chora’s Den est la prochaine piste ; mes fournitures et mon affaire de chantage restent séparées.', [pick('testimony', 'Consigner le témoignage sur Fist.'), leave], ['QST-piste-garrus', 'NPC-dr-chloe-michel']);
  }
  if (id === 'fist') {
    if (!(p.michel || includes(state.recruited, 'wrex'))) return no('Obtenez le témoignage de Michel ou l’aide de Wrex avant de confronter Fist.');
    if (p.fist !== null) return model(id, 'Dossier Fist', null, p.fist === 'spared'
      ? 'Fist a été épargné. Son aveu situe la Quarienne dans la ruelle des Secteurs supérieurs. Revenir ici ne change pas cette décision.'
      : `Fist est mort, abattu par ${p.fist === 'wrex' ? 'Wrex' : 'Shepard'}. Il avait déjà révélé le rendez-vous de la ruelle. Sa mort ne supprime pas cet indice.`, [leave], ['CHC-sort-de-fist', 'NPC-fist']);
    if (!p.battles.fist) return model(id, 'Bureau de Fist', null, 'Fist s’abrite derrière son bureau entre deux tourelles. Neutralisez ses défenses pour obtenir des réponses.', [pick('battle', 'Affronter Fist et ses défenses.', { encounterId: 'resolve-citadel:fist-battle' }), leave], ['QST-piste-du-courtier', 'CHC-sort-de-fist']);
    const wrex = p.fistWrex === true;
    return model(id, 'Fist', null, 'Après la victoire du commando, Fist avoue avoir piégé la Quarienne : elle attend les hommes de Saren dans une ruelle des Secteurs supérieurs. '
      + (wrex ? 'Wrex est présent dans le groupe déployé. Son contrat lui impose d’abattre Fist après cet aveu ; Shepard ne peut pas l’épargner.' : 'Wrex ne fait pas partie du groupe déployé. Shepard peut laisser Fist partir ou l’abattre.'), wrex
      ? [pick('wrex', 'Wrex exécute son contrat après l’aveu.'), leave]
      : [pick('spare', 'Laisser Fist partir.'), pick('kill', 'Abattre Fist après l’aveu.'), leave], ['CHC-sort-de-fist', 'NPC-fist', 'QST-piste-du-courtier']);
  }
  if (id === 'tali-rescue') {
    if (p.fist === null) return no('Fist doit d’abord révéler le piège de la ruelle.');
    return model(id, 'Ruelle des Secteurs supérieurs', 'tali', p.rescue
      ? 'Tali est à l’abri. Elle peut vous expliquer les données qu’elle a extraites d’un geth.'
      : 'La Quarienne identifie le piège et se dégage avec une grenade. Intervenez contre les assassins de Saren.', [p.rescue ? pick('rescue', 'Écouter Tali à l’abri.') : pick('battle', 'Intervenir contre les assassins.', { encounterId: 'resolve-citadel:ambush-battle' }), leave], ['QST-sauvetage-de-tali']);
  }
  if (id === 'tali-proof') {
    if (!p.rescue) return no('Mettez d’abord Tali à l’abri.');
    return model(id, 'Tali’Zorah nar Rayya', 'tali', 'J’ai isolé un geth et retiré son noyau avant la destruction de ses données. Un enregistrement subsiste : Saren y évoque Eden Prime, la balise et le Conduit. Une autre voix parle du retour des Moissonneurs. Leurs identités et leur nature ne sont pas encore toutes établies ; la complicité de Saren est la preuve à remettre au Conseil.', [
      ...(p.proof ? [] : [pick('receive', 'Recevoir l’enregistrement et accueillir Tali.')]), leave,
    ], ['QST-sauvetage-de-tali']);
  }
  return no('Interaction d’enquête inconnue.');
}

/** Pure transition; the state transaction validates/recruits/logs atomically. */
export function transitionResolveCitadel(state, id, choiceId) {
  const view = getResolveCitadelInteraction(state, id);
  if (!view.ok) return view;
  const selected = view.choices.find(choice => choice.id === choiceId);
  if (!selected) return no('Cette réponse n’est plus disponible.');
  const p = normalizeResolveCitadelState(state.resolveCitadel, state);
  if (selected.close) return { ok: true, close: true, changed: false, progress: p };
  if (selected.encounterId) return { ok: true, changed: false, encounterId: selected.encounterId, progress: p };
  const next = { ...p, battles: { ...p.battles } }; let effect = null;
  if (id === 'nihlus') next.nihlus = choiceId === 'evaluation' ? 2 : Math.max(1, p.nihlus);
  if (id === 'joker') next.jokerReported = true;
  if (id === 'hearing') next.hearing = true;
  if (id === 'harkin') next.harkin = true;
  if (id === 'barla-von') next.barla = true;
  if (id === 'clinic') next.clinic = true;
  if (id === 'michel') next.michel = true;
  if (id === 'fist') next.fist = choiceId === 'wrex' ? 'wrex' : choiceId === 'kill' ? 'shepard' : 'spared';
  if (id === 'tali-rescue') next.rescue = true;
  if (id === 'tali-proof') { next.proof = true; effect = 'recruit-tali'; }
  return { ok: true, changed: JSON.stringify(p) !== JSON.stringify(next), progress: next, effect,
    log: { title: id === 'tali-proof' ? 'Preuve de Tali' : view.speaker, text: view.text },
    nextId: ({ clinic: 'michel', 'tali-rescue': 'tali-proof' })[id] || null };
}

export function resolveCitadelReport(state) {
  const p = normalizeResolveCitadelState(state?.resolveCitadel, state);
  if (!p) return null;
  return { ...p, known: !p.legacy, fistStatus: p.legacy ? 'Non enregistré dans cette ancienne partie.' : p.fist === null ? 'Non rencontré.'
    : p.fist === 'spared' ? 'Épargné par Shepard.' : p.fist === 'wrex' ? 'Abattu par Wrex présent dans le groupe.' : 'Abattu par Shepard sans Wrex dans le groupe.',
  evidence: p.proof ? 'Enregistrement du noyau geth remis par Tali : implication de Saren dans l’attaque d’Eden Prime.' : p.legacy && includes(state.recruited, 'tali') ? 'Preuves de Tali acquises dans la progression antérieure.' : 'Aucune preuve enregistrée.',
  limitation: 'Trois combats ATB adaptés ; corps de prototype, arènes condensées et absence de course chronométrée. Ni les silhouettes finales ni les combats originaux complets ne sont certifiés.' };
}

const ENCOUNTERS = {
  'resolve-citadel:clinic-battle': { key: 'clinic', label: 'Hommes de Fist — clinique', nextId: 'michel',
    enemies: [
      { name: 'Homme de Fist', sprite: 'resolve-thug', hp: 100, shield: 25, attack: 15, defense: 3, speed: .72, powers: [] },
      { name: 'Complice de Fist', sprite: 'resolve-thug', hp: 100, shield: 25, attack: 15, defense: 3, speed: .72, powers: [] },
    ] },
  'resolve-citadel:fist-battle': { key: 'fist', label: 'Fist et les tourelles de son bureau', nextId: 'fist',
    enemies: [
      { name: 'Fist', sprite: 'resolve-fist', hp: 180, shield: 70, attack: 20, defense: 4, speed: .7, powers: ['immunity'] },
      { name: 'Tourelle du bureau', sprite: 'turret', hp: 110, shield: 30, attack: 17, defense: 4, speed: .55, powers: [], synthetic: true, physicsImmune: true },
      { name: 'Tourelle du bureau', sprite: 'turret', hp: 110, shield: 30, attack: 17, defense: 4, speed: .55, powers: [], synthetic: true, physicsImmune: true },
    ] },
  'resolve-citadel:ambush-battle': { key: 'ambush', label: 'Assassins de Saren — secours à Tali', nextId: 'tali-proof',
    enemies: [
      { name: 'Assassin turien', sprite: 'resolve-turian-assassin', hp: 135, shield: 45, attack: 18, defense: 4, speed: .76, powers: ['overload'] },
      { name: 'Assassin galarien', sprite: 'resolve-salarian-assassin', hp: 105, shield: 30, attack: 15, defense: 3, speed: .8, powers: ['overload', 'sabotage'] },
    ] },
};

/** Detached ATB actor definitions; no campaign mutation on preview/start. */
export function getResolveCitadelEncounter(state, id) {
  const p = normalizeResolveCitadelState(state?.resolveCitadel, state);
  if (!p || !citadel(state) || state.completed.includes('citadel') || p.legacy || !p.hearing
    || typeof id !== 'string' || !own(ENCOUNTERS, id)) return no('Ce combat d’enquête est indisponible.');
  const def = ENCOUNTERS[id];
  if (p.battles[def.key]) return no('Cette rencontre est déjà sécurisée.');
  if (def.key === 'fist' && !(p.michel || includes(state.recruited, 'wrex'))) return no('Recueillez le témoignage de Michel ou l’aide de Wrex.');
  if (def.key === 'ambush' && p.fist === null) return no('Fist doit d’abord révéler le piège.');
  return { ok: true, id, key: def.key, label: def.label, nextId: def.nextId, resolveCitadelEncounter: true,
    enemies: def.enemies.map((enemy, index) => ({ synthetic: false, ...enemy, id: `${def.key}-${index}`, maxHp: enemy.hp, maxShield: enemy.shield, powers: [...enemy.powers] })) };
}

/** Pure receipt after victory; state.js validates the complete transaction. */
export function resolveCitadelEncounterVictory(state, id) {
  const encounter = getResolveCitadelEncounter(state, id);
  if (!encounter.ok) return encounter;
  const p = normalizeResolveCitadelState(state.resolveCitadel, state);
  p.battles[encounter.key] = true;
  if (encounter.key === 'clinic') p.clinic = true;
  if (encounter.key === 'fist') p.fistWrex = includes(state.party, 'wrex') && !includes(state.lost, 'wrex');
  if (encounter.key === 'ambush') p.rescue = true;
  return { ok: true, progress: p, nextId: encounter.nextId, xp: 65, credits: 85,
    log: { title: encounter.label, text: 'Le commando a sécurisé cette étape de l’enquête.' } };
}

/** Extra interaction markers reuse the existing condensed Citadel geometry. */
export function listResolveCitadelPOIs(state) {
  if (!citadel(state) || state.completed.includes('citadel')) return [];
  const p = normalizeResolveCitadelState(state.resolveCitadel, state);
  if (!p || p.legacy) return [];
  return [
    { id: 'resolve-citadel:hearing', x: 0, z: -13, label: 'Rapport au Conseil', resolveCitadel: 'hearing' },
    ...(p.hearing ? [{ id: 'resolve-citadel:clinic', x: -9, z: -2, label: 'Clinique — enquête Garrus', resolveCitadel: 'clinic' },
      { id: 'resolve-citadel:fist', x: 8, z: 8, label: 'Fist', resolveCitadel: 'fist' }] : []),
    ...(p.fist !== null ? [{ id: 'resolve-citadel:tali-rescue', x: -8, z: 8, label: 'Ruelle — secours à Tali', resolveCitadel: p.rescue ? 'tali-proof' : 'tali-rescue' }] : []),
  ].map(poi => ({ ...poi, type: 'conversation', radius: 2.4, color: '#d8bf8c' }));
}
