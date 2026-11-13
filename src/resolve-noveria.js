// French ME1 adaptation. Port Hanshan's alternatives follow Prima's Noveria
// walkthrough; the terminal retrieval omits Synthetic Insights' original fights.
// Reading never rewards the player. Chapter completion remains a state transaction.
const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
const has = (array, key) => Array.isArray(array) && array.includes(key);
const no = reason => ({ ok: false, reason });
const FIELDS = ['version', 'legacy', 'anoleisAsked', 'lorikContract', 'evidence', 'gianna', 'lorikTestimony', 'opold', 'pass', 'anoleis'];
const exact = (value, keys) => value !== null && typeof value === 'object' && !Array.isArray(value)
  && [Object.prototype, null].includes(Object.getPrototypeOf(value)) && Reflect.ownKeys(value).length === keys.length
  && keys.every(key => { const d = Object.getOwnPropertyDescriptor(value, key); return d?.enumerable && own(d, 'value'); });
const scoped = state => state && (!own(state, 'mediaId') || state.mediaId === 'ME1')
  && (!own(state, 'periodId') || state.periodId === 'me1')
  && (!own(state, 'context') || state.context?.mediaId === 'ME1' && state.context?.periodId === 'me1');
const permitted = state => scoped(state) && has(state.completed, 'citadel') && state.flags?.spectre === true;
const pastPort = state => has(state?.cleared, 'noveria:encounter-1') || has(state?.completed, 'noveria');
const PASS = [null, 'lorik', 'anoleis-evidence', 'gianna', 'opold', 'anoleis-corpse'];
const EVIDENCE = ['none', 'held', 'lorik', 'anoleis', 'gianna'];
const GIANNA = ['reception', 'investigating', 'arrested-anoleis', 'dead'];
const TESTIMONY = [null, 'charmed', 'intimidated', 'declined'];
const OPOLD = ['none', 'accepted', 'held', 'reported'];
const ANOLEIS = ['office', 'arrested', 'dead'];
const POIS = Object.freeze({
  parasini: { label: 'Gianna · enquête interne', portrait: 'parasini', x: -12, z: 62 },
  anoleis: { label: 'Anoleis · laissez-passer', portrait: 'anoleis', x: 13, z: 59 },
  lorik: { label: 'Lorik · preuves et témoignage', portrait: 'lorik', x: -10, z: 51 },
  evidence: { label: 'Synthetic Insights · terminal de Lorik', x: 4, z: 49 },
  opold: { label: 'Opold · proposition de contrebande', x: 17, z: 67 },
  package: { label: 'Quai du Normandy · paquet d’Opold', x: -3, z: 69 },
  corpse: { label: 'Anoleis · récupérer le laissez-passer', x: 13, z: 59 },
  mira: { label: 'MIRA · assistance du Pic 15', x: 6, z: -8 },
  queen: { label: 'Reine rachni · communication', x: -2, z: -85 },
});
const keyFor = id => typeof id === 'string' && id.startsWith('resolve:noveria:') ? id.slice(16) : null;
const idFor = key => `resolve:noveria:${key}`;
const choice = (id, label, extra = {}) => ({ id, label, ...extra });
const leave = () => choice('leave', 'Revenir sur le terrain.', { effect: 'close' });
const back = () => choice('back', 'J’ai une autre question.', { nextStep: 'intro' });

export function createResolveNoveriaState() {
  return { version: 1, legacy: false, anoleisAsked: false, lorikContract: false, evidence: 'none',
    gianna: 'reception', lorikTestimony: null, opold: 'none', pass: null, anoleis: 'office' };
}

/** Only an absent field migrates. Old progress has no invented pass source,
 * witness, investigation outcome or NPC death. Explicit malformed input fails. */
export function normalizeResolveNoveriaState(raw, state = null) {
  try {
    if (raw === undefined) return { ...createResolveNoveriaState(), legacy: pastPort(state) };
    if (!exact(raw, FIELDS) || raw.version !== 1
      || !['legacy', 'anoleisAsked', 'lorikContract'].every(key => typeof raw[key] === 'boolean')
      || !EVIDENCE.includes(raw.evidence) || !GIANNA.includes(raw.gianna)
      || !TESTIMONY.includes(raw.lorikTestimony) || !OPOLD.includes(raw.opold)
      || !PASS.includes(raw.pass) || !ANOLEIS.includes(raw.anoleis)) return null;
    const started = raw.anoleisAsked || raw.lorikContract || raw.evidence !== 'none' || raw.gianna !== 'reception'
      || raw.lorikTestimony !== null || raw.opold !== 'none' || raw.pass !== null || raw.anoleis !== 'office';
    if (raw.legacy) {
      if (started || state && !pastPort(state)) return null;
    } else {
      if (raw.lorikContract && !raw.anoleisAsked || raw.evidence !== 'none' && !raw.lorikContract
        || raw.gianna !== 'reception' && raw.evidence === 'none'
        || raw.lorikTestimony !== null && (raw.gianna === 'reception' || raw.evidence === 'none')
        || raw.gianna === 'arrested-anoleis' && (!['charmed', 'intimidated'].includes(raw.lorikTestimony)
          || raw.evidence !== 'gianna' || raw.anoleis !== 'arrested')
        || raw.anoleis === 'arrested' && raw.gianna !== 'arrested-anoleis'
        || (raw.gianna === 'dead') !== (raw.anoleis === 'dead')
        || raw.evidence === 'gianna' && raw.gianna !== 'arrested-anoleis'
        || raw.evidence === 'anoleis' && raw.anoleis !== 'office'
        || raw.gianna === 'dead' && raw.evidence !== 'held'
        || raw.pass === 'lorik' && raw.evidence !== 'lorik'
        || raw.pass === 'anoleis-evidence' && raw.evidence !== 'anoleis'
        || raw.pass === 'gianna' && raw.gianna !== 'arrested-anoleis'
        || raw.pass === 'opold' && raw.opold !== 'reported'
        || raw.pass === 'anoleis-corpse' && raw.anoleis !== 'dead'
        || raw.opold === 'reported' && ['gianna', 'anoleis-corpse'].includes(raw.pass)
        || ['lorik', 'anoleis', 'gianna'].includes(raw.evidence) && raw.pass === null
        || raw.opold === 'reported' && raw.pass === null) return null;
      if (state && (started && !permitted(state) || pastPort(state) && raw.pass === null
        || raw.lorikTestimony === 'charmed' && (!Number.isFinite(state.paragon) || state.paragon < 20)
        || raw.lorikTestimony === 'intimidated' && (!Number.isFinite(state.renegade) || state.renegade < 20))) return null;
    }
    return Object.fromEntries(FIELDS.map(key => [key, raw[key]]));
  } catch { return null; }
}
const progressFor = state => normalizeResolveNoveriaState(state?.resolveNoveria, state);
/** Compatibility for the existing low-level campaign API. Main's live encounter
 * gate still requires an actual pass before the first garage combat. */
export function isResolveNoveriaUntouched(state) {
  const p = progressFor(state), empty = createResolveNoveriaState();
  return !!p && FIELDS.every(key => p[key] === empty[key]);
}
const model = (id, step, speaker, text, choices, catalogIds, portrait) => ({ ok: true, id, step, speaker,
  text, choices: [...choices, leave()], catalogIds, ...(portrait ? { portrait } : {}) });

/** Detached choices are recomputed from current evidence, people and repairs. */
export function getResolveNoveriaInteraction(state, id, step = 'intro') {
  const key = keyFor(id), p = progressFor(state);
  if (!p || !permitted(state) || state.zone !== 'noveria' || has(state.completed, 'noveria')
    || !own(POIS, key) || typeof step !== 'string') return no('Cette étape de Novéria n’est pas disponible.');
  const port = !p.legacy;
  const show = (speaker, text, choices, ids) => model(id, step, speaker, text, choices, ids, POIS[key].portrait);
  if (key === 'anoleis' && port && p.anoleis === 'office' && step === 'intro') {
    const choices = [];
    if (!p.anoleisAsked) choices.push(choice('request', 'Demander l’accès au Pic 15.'));
    if (p.opold === 'held') choices.push(choice('report-package', 'Dénoncer le paquet d’Opold contre un laissez-passer.'));
    if (p.evidence === 'held') choices.push(choice('give-evidence', 'Lui remettre les preuves de Lorik contre un laissez-passer.'));
    if (p.gianna === 'investigating' && p.evidence === 'held') choices.push(choice('expose-gianna', 'Révéler que Gianna enquête sur lui.', { tone: 'renegade',
      consequence: 'Anoleis convoquera Gianna. Leur affrontement sera mortel pour tous les deux.' }));
    return show('Administrateur Anoleis', p.anoleisAsked
      ? 'Vous connaissez les règles. L’accès au garage exige un laissez-passer. Si vous avez une affaire à me soumettre, faites-le.'
      : 'Bénézia est venue au port avant de gagner le Pic 15. Le complexe est sous Code Oméga : une intrusion a entraîné sa fermeture. Votre statut ne vous donne pas un laissez-passer pour le garage.',
    choices, ['DIA-anoleis-laissez-passer', 'CHC-corruption-noveria', 'QST-acces-a-peak-15']);
  }
  if (key === 'lorik' && port && p.anoleisAsked && step === 'intro') {
    if (!p.lorikContract) return show('Lorik Qui’in',
      'Anoleis a fermé les bureaux de Synthetic Insights. Mon ordinateur contient les preuves de ses détournements de loyers. Récupérez-les avant ses hommes et je vous donnerai mon laissez-passer pour le garage.',
      [choice('accept', 'Accepter de récupérer les preuves.'), choice('defer', 'Je vais examiner les autres possibilités.', { effect: 'close' })], ['QST-acces-a-peak-15', 'CHC-corruption-noveria']);
    if (p.evidence === 'none') return show('Lorik Qui’in', 'Les preuves sont dans mon terminal. Revenez quand vous les aurez récupérées.', [], ['QST-acces-a-peak-15']);
    if (p.evidence === 'held') {
      const choices = [choice('give-evidence', 'Remettre les preuves à Lorik et obtenir son laissez-passer.')];
      if (p.gianna === 'investigating' && !['charmed', 'intimidated'].includes(p.lorikTestimony)) choices.push(
        choice('charm', 'Votre témoignage peut mettre fin à cette corruption.', { tone: 'paragon', disabled: !Number.isFinite(state.paragon) || state.paragon < 20,
          reason: 'Adaptation : 20 points conciliants. Les rangs de Charme de ME1 ne sont pas représentés.' }),
        choice('intimidate', 'Vous allez témoigner contre Anoleis.', { tone: 'renegade', disabled: !Number.isFinite(state.renegade) || state.renegade < 20,
          reason: 'Adaptation : 20 points pragmatiques. Les rangs d’Intimidation de ME1 ne sont pas représentés.' }),
        ...(p.lorikTestimony === 'declined' ? [] : [choice('decline-testimony', 'Ne pas impliquer Lorik dans l’enquête de Gianna.')]),
      );
      return show('Lorik Qui’in', ['charmed', 'intimidated'].includes(p.lorikTestimony)
        ? 'Je témoignerai contre Anoleis devant le conseil d’administration. Prévenez Gianna. Vous pouvez encore choisir de me remettre les preuves pour clore notre marché.'
        : 'Vous avez mes preuves. Notre marché tient toujours. Témoigner contre Anoleis serait une autre affaire : je risque ma carrière.', choices, ['CHC-temoignage-de-lorik', 'CHC-corruption-noveria', 'QST-acces-a-peak-15']);
    }
  }
  if (key === 'evidence' && port && p.lorikContract && p.evidence === 'none' && step === 'intro') return show('Terminal de Lorik Qui’in',
    'Les archives de Synthetic Insights contiennent les détournements de loyers d’Anoleis. La copie doit être rapportée à Lorik ; elle peut aussi intéresser l’administration du port.',
    [choice('retrieve', 'Copier les preuves de corruption.')], ['QST-acces-a-peak-15', 'CHC-corruption-noveria']);
  if (key === 'parasini' && port && !['dead', 'arrested-anoleis'].includes(p.gianna) && step === 'intro') {
    if (p.evidence === 'held' && p.gianna === 'reception') return show('Gianna Parasini',
      'Avant de remettre ces preuves à Lorik, parlons en privé. Je travaille pour les Affaires internes de Novéria. J’enquête depuis six mois sur Anoleis. Ses dossiers ne suffisent pas : il me faut le témoignage de Lorik.',
      [choice('investigate', 'Accepter d’aider l’enquête de Gianna.'), choice('defer', 'Je vais d’abord réfléchir.', { effect: 'close' })], ['DIA-gianna-enquete', 'CHC-temoignage-de-lorik']);
    if (p.gianna === 'investigating' && p.evidence === 'held') return show('Gianna Parasini',
      'Je dois pouvoir présenter les preuves avec un témoin prêt à confirmer les détournements. Lorik a-t-il accepté de témoigner ?',
      [choice('report-testimony', 'Confier les preuves et confirmer le témoignage de Lorik.', {
        disabled: !['charmed', 'intimidated'].includes(p.lorikTestimony),
        reason: !['charmed', 'intimidated'].includes(p.lorikTestimony) ? 'Lorik doit d’abord accepter de témoigner.' : '',
      })], ['DIA-gianna-enquete', 'CHC-temoignage-de-lorik', 'CHC-corruption-noveria']);
    return show('Gianna Parasini', 'Bienvenue à Port Hanshan. Adressez votre demande d’accès à l’administrateur Anoleis. Si votre demande est refusée, Lorik Qui’in, à l’hôtel, cherche de l’aide.', [], ['DIA-anoleis-laissez-passer']);
  }
  if (key === 'opold' && port && p.anoleis === 'office' && p.opold === 'none' && step === 'intro') return show('Opold',
    'Cet humble marchand attend un paquet au quai du Normandy. Votre statut de Spectre vous permet de le faire passer par les douanes. Acceptez-vous de l’apporter ?',
    [choice('accept', 'Accepter de récupérer le paquet.'), choice('refuse', 'Refuser pour le moment.', { effect: 'close' })], ['QST-acces-a-peak-15']);
  if (key === 'package' && port && p.opold === 'accepted' && step === 'intro') return show('Quai du Normandy',
    'Le paquet promis par Opold est arrivé près du sas. Vous pouvez le prendre et signaler cette contrebande à Anoleis pour négocier un laissez-passer.',
    [choice('take', 'Prendre le paquet sans l’ouvrir.')], ['QST-acces-a-peak-15']);
  if (key === 'corpse' && port && p.anoleis === 'dead' && p.pass === null && step === 'intro') return show('Bureau d’Anoleis',
    'Anoleis a convoqué Gianna après votre dénonciation. Ils se sont entretués. Le laissez-passer de l’administrateur est resté sur son corps.',
    [choice('take-pass', 'Récupérer le laissez-passer sur Anoleis.')], ['CHC-corruption-noveria', 'QST-acces-a-peak-15']);
  if (key === 'mira' && has(state.cleared, 'noveria:encounter-1')) {
    const record = state.missionProgress?.records?.noveria;
    if (!record || !has(record.steps, 'memory')) return no('Réactivez le noyau de MIRA avant de demander son assistance.');
    const power = has(record.steps, 'power'), uplink = has(record.steps, 'uplink');
    if (step === 'intro') return show('MIRA',
      'Noyau réactivé. Votre identification de Spectre donne accès aux systèmes techniques. Les données de recherche confidentielles restent réservées aux cadres de Binary Helix. Le tramway exige le rétablissement du réacteur et de la liaison du toit.',
      [choice('reactor', power ? 'Vérifier le réacteur réparé.' : 'Localiser la réparation du réacteur.', { nextStep: 'reactor' }),
        choice('uplink', uplink ? 'Vérifier la liaison rétablie.' : 'Localiser la liaison du toit.', { nextStep: 'uplink' }),
        choice('tram', 'Confirmer la disponibilité du tramway.', { nextStep: 'tram', disabled: !power || !uplink,
          reason: !power || !uplink ? 'Le réacteur et la liaison doivent être réparés.' : '' }),
        choice('research', 'Consulter les recherches de Binary Helix.', { nextStep: 'research' })], ['DIA-mira-assistance']);
    const texts = {
      reactor: power ? 'Alimentation rétablie. La connexion du réacteur est enregistrée.' : 'Reconnectez les conduites de carburant du réacteur. Le poste d’alimentation de cette installation permet de rétablir cette fonction.',
      uplink: uplink ? 'Liaison rétablie. Les communications techniques répondent.' : 'La liaison du toit est déconnectée. Remettez le relais de communication en service.',
      tram: 'Alimentation et liaison répondent. La route vers les laboratoires est disponible.',
      research: 'Accès refusé aux secrets de recherche de Binary Helix. Votre autorisation technique de Spectre ne remplace pas celle de ses cadres.',
    };
    if (own(texts, step) && (step !== 'tram' || power && uplink)) return show('MIRA', texts[step], [back()], ['DIA-mira-assistance']);
  }
  if (key === 'queen' && ['encounter-1', 'encounter-2', 'boss'].every(suffix => has(state.cleared, `noveria:${suffix}`))) {
    if (step === 'intro') return show('La reine rachni · par une asari mourante',
      'La reine communique par le corps d’une des commandos asari tombées près de sa cellule. Elle demande que vous mettiez fin aux souffrances de ses enfants, arrachés à elle et devenus fous. Elle vous demande aussi de la laisser vivre.',
      [choice('children', 'Pourquoi vos enfants nous attaquent-ils ?', { nextStep: 'children' }),
        choice('future', 'Que ferez-vous si je vous libère ?', { nextStep: 'future' }),
        choice('decision', 'Décider du sort de la reine.', { nextStep: 'decision' })], ['DIA-reine-rachni']);
    if (step === 'children') return show('La reine rachni', 'Mes enfants ont grandi sans mon chant. Ceux de ce complexe ne peuvent plus être sauvés. Je vous demande d’abréger leur souffrance.', [back()], ['DIA-reine-rachni']);
    if (step === 'future') return show('La reine rachni', 'Je chercherai un monde où élever mes enfants en paix. Je n’ai pas participé aux guerres rachni. Je ne demande pas vengeance contre les Krogans.', [back()], ['DIA-reine-rachni']);
    if (step === 'decision') return show('La reine rachni', 'La libérer lui permet de quitter sa captivité et de perpétuer son espèce. La détruire condamne cette reine. Sa demande ne garantit pas l’avenir : la décision vous appartient.',
      [choice('release', 'Libérer la reine et lui laisser une chance.', { tone: 'paragon', effect: 'complete-release' }),
        choice('destroy', 'Détruire la reine.', { tone: 'renegade', effect: 'complete-destroy' }), back()], ['DIA-reine-rachni', 'QST-decision-rachni']);
  }
  return no('Cette interaction est résolue ou ses conditions ne sont pas remplies.');
}

/** Revalidate both the current choices and physical proximity; return only a
 * detached candidate. No credits, XP, inventory or morality are mutated here. */
export function transitionResolveNoveria(state, id, choiceId, step = 'intro') {
  const current = getResolveNoveriaInteraction(state, id, step);
  if (!current.ok) return current;
  const selected = current.choices.find(entry => entry.id === choiceId);
  if (!selected || selected.disabled) return no(selected?.reason || 'Cette réponse n’est pas disponible.');
  const key = keyFor(id), anchor = POIS[key];
  if (!Number.isFinite(state.position?.x) || !Number.isFinite(state.position?.z)
    || Math.hypot(state.position.x - anchor.x, state.position.z - anchor.z) > 7) return no('Approchez cet interlocuteur avant de répondre.');
  if (selected.nextStep || selected.effect) return { ok: true, changed: false,
    ...(selected.nextStep ? { nextStep: selected.nextStep } : {}), ...(selected.effect ? { effect: selected.effect } : {}) };
  const p = progressFor(state);
  let response;
  if (key === 'anoleis' && choiceId === 'request') { p.anoleisAsked = true; response = 'Anoleis refuse l’accès. Gianna vous recommande Lorik Qui’in ; la proposition d’Opold reste une autre possibilité.'; }
  else if (key === 'lorik' && choiceId === 'accept') { p.lorikContract = true; response = 'Lorik vous donne accès à son terminal de Synthetic Insights. Récupérez sa copie des preuves.'; }
  else if (key === 'evidence') { p.evidence = 'held'; response = 'Les preuves de détournements sont copiées. Gianna souhaite vous parler avant que vous les remettiez à Lorik.'; }
  else if (key === 'parasini' && choiceId === 'investigate') { p.gianna = 'investigating'; response = 'Gianna révèle sa mission aux Affaires internes. Les preuves sont conservées ; Lorik doit encore accepter de témoigner.'; }
  else if (key === 'lorik' && choiceId === 'give-evidence') { p.evidence = 'lorik'; p.pass ??= 'lorik'; response = 'Lorik reprend ses preuves et honore son marché : vous obtenez son laissez-passer. L’enquête de Gianna n’a pas abouti à une arrestation.'; }
  else if (key === 'lorik' && ['charm', 'intimidate'].includes(choiceId)) { p.lorikTestimony = choiceId === 'charm' ? 'charmed' : 'intimidated'; response = 'Lorik accepte de témoigner. Rapportez sa décision à Gianna avec les preuves pour obtenir l’arrestation d’Anoleis.'; }
  else if (key === 'lorik' && choiceId === 'decline-testimony') { p.lorikTestimony = 'declined'; response = 'Vous n’insistez pas pour obtenir son témoignage. Son marché direct et les autres voies disponibles restent ouverts.'; }
  else if (key === 'parasini') { p.evidence = 'gianna'; p.gianna = 'arrested-anoleis'; p.anoleis = 'arrested'; p.pass ??= 'gianna'; response = 'Gianna reçoit les preuves et la confirmation du témoignage. Elle arrête Anoleis et vous remet un laissez-passer pour le garage.'; }
  else if (key === 'opold') { p.opold = 'accepted'; response = 'Opold fait livrer le paquet au quai du Normandy. Revenez le chercher près du sas.'; }
  else if (key === 'package') { p.opold = 'held'; response = 'Vous prenez le paquet. Vous pouvez le présenter à Anoleis pour dénoncer cette contrebande.'; }
  else if (key === 'anoleis' && choiceId === 'report-package') { p.opold = 'reported'; p.pass ??= 'opold'; response = 'Anoleis saisit le paquet et vous remet un laissez-passer. Les preuves de Lorik encore détenues peuvent toujours servir à l’enquête de Gianna.'; }
  else if (key === 'anoleis' && choiceId === 'give-evidence') { p.evidence = 'anoleis'; p.pass ??= 'anoleis-evidence'; response = 'Anoleis récupère les preuves contre lui et vous remet un laissez-passer. Sans ces preuves, Gianna ne peut pas conclure son enquête.'; }
  else if (key === 'anoleis' && choiceId === 'expose-gianna') { p.gianna = 'dead'; p.anoleis = 'dead'; response = 'Anoleis convoque Gianna dans son bureau. Ils s’entretuent. Si vous n’avez pas de laissez-passer, récupérez celui resté sur Anoleis.'; }
  else if (key === 'corpse') { p.pass = 'anoleis-corpse'; response = 'Le laissez-passer d’Anoleis vous donne accès au garage. Sa mort et celle de Gianna restent enregistrées.'; }
  else return no('Cette réponse n’a pas de transition.');
  const progress = normalizeResolveNoveriaState(p, state);
  return progress ? { ok: true, changed: true, progress, response,
    repeat: getResolveNoveriaInteraction({ ...state, resolveNoveria: progress }, id).ok, catalogIds: [...current.catalogIds] }
    : no('La transition créerait une progression incohérente.');
}

export function listResolveNoveriaPOIs(state) {
  return Object.entries(POIS).filter(([key]) => getResolveNoveriaInteraction(state, idFor(key)).ok)
    .map(([key, poi]) => ({ ...poi, id: idFor(key), zone: 'noveria', type: 'dialogue', resolveNoveria: true, cleared: false }));
}

export function resolveNoveriaEncounterGate(state, encounterId) {
  if (encounterId !== 'noveria:encounter-1') return { ok: true };
  const p = progressFor(state);
  return p && (p.legacy || p.pass !== null) ? { ok: true }
    : no(p ? 'Obtenez un laissez-passer à Port Hanshan avant de pénétrer dans le garage.' : 'Progression de Novéria invalide.');
}
export function resolveNoveriaCompletionGate(state) {
  const p = progressFor(state);
  return p && (p.legacy || p.pass !== null) ? { ok: true } : no('L’accès au Pic 15 doit être résolu avant le bilan.');
}
export function resolveNoveriaContactAvailable(state, id) {
  if (!scoped(state)) return false;
  const p = progressFor(state);
  if (!p) return false;
  if (p.legacy) return true;
  if (id === 'anoleis') return p.anoleis === 'office';
  if (['parasini', 'gianna'].includes(id)) return !['dead', 'arrested-anoleis'].includes(p.gianna);
  return true;
}
export function noveriaResolutionReport(state) {
  const p = progressFor(state), known = !!p && !p.legacy;
  return { known, pass: known ? p.pass : null, evidence: known ? p.evidence : null,
    lorikTestimony: known ? p.lorikTestimony : null, gianna: known ? p.gianna : null,
    anoleis: known ? p.anoleis : null, opold: known ? p.opold : null, queen: state?.choices?.noveria || null };
}
