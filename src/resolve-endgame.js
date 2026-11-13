// Condensed ME1 finale: the fleet order and the human nomination are separate
// facts. Missing historical facts stay unknown; no future presence is inferred.
const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
const has = (values, id) => Array.isArray(values) && values.includes(id);
const exact = (value, keys) => value && typeof value === 'object' && !Array.isArray(value)
  && [Object.prototype, null].includes(Object.getPrototypeOf(value)) && Reflect.ownKeys(value).length === keys.length
  && keys.every(key => { const field = Object.getOwnPropertyDescriptor(value, key); return field?.enumerable && own(field, 'value'); });
const scoped = state => !!state && (!own(state, 'context') || state.context?.mediaId === 'ME1' && state.context?.periodId === 'me1')
  && (!own(state, 'mediaId') || state.mediaId === 'ME1') && (!own(state, 'periodId') || state.periodId === 'me1');
const fields = ['version', 'vigilExchange', 'humanRepresentative'];
const no = reason => ({ ok: false, reason });
const ilosAvailable = state => scoped(state) && ['therum', 'feros', 'noveria', 'virmire'].every(id => has(state.completed, id));
const vigilAvailable = state => ilosAvailable(state) && state.zone === 'ilos'
  && !has(state.completed, 'ilos') && has(state.cleared, 'ilos:boss');

export function createResolveEndgameState() {
  return { version: 1, vigilExchange: false, humanRepresentative: null };
}

export const RESOLVE_VIGIL_CODEX = [
  { id: 'vigil-reaper-cycle', name: 'Vigil · le cycle des Moissonneurs', category: 'Histoire',
    text: 'Vigil a expliqué au commando le piège de la Citadelle, la destruction de la civilisation prothéenne et le sort des chercheurs en stase sur Ilos. Les derniers survivants ont modifié la réponse des Veilleurs au signal des Moissonneurs.' },
  { id: 'vigil-conduit', name: 'Vigil · le Conduit et les commandes', category: 'Technologie',
    text: 'Le Conduit est le relais prothéen qui relie Ilos à la Citadelle. Vigil a remis à Shepard un fichier permettant de reprendre temporairement les commandes de la station pour empêcher Sovereign d’ouvrir le relais vers l’espace obscur.' },
];

/** Only an absent old field migrates. Present malformed data is rejected. */
export function normalizeResolveEndgame(raw, state = null) {
  try {
    if (raw === undefined) return createResolveEndgameState();
    if (!exact(raw, fields) || raw.version !== 1 || typeof raw.vigilExchange !== 'boolean'
      || ![null, 'anderson', 'udina'].includes(raw.humanRepresentative)) return null;
    if (state && (raw.vigilExchange && (!ilosAvailable(state) || !has(state.cleared, 'ilos:boss'))
      || raw.humanRepresentative !== null && (!scoped(state) || state.ending !== true
        || !has(state.completed, 'citadel-finale')))) return null;
    return { ...raw };
  } catch { return null; }
}

const progressFor = state => normalizeResolveEndgame(state?.resolveEndgame, state);
const c = (id, label, nextStep) => ({ id, label, nextStep });
const questionBack = c('questions', 'Une autre question.', 'questions');
const VIGIL = {
  intro: { text: 'Je suis Vigil, une intelligence virtuelle prothéenne. J’ai dressé cette barrière pour pouvoir vous parler. Votre commando ne présente pas la marque de l’endoctrinement observée chez celui qui vous précède. Vous devez comprendre le piège avant de poursuivre Saren.',
    choices: [c('history', 'Que s’est-il passé lors du dernier cycle ?', 'history'), c('questions', 'Parlez-moi de la Citadelle et du Conduit.', 'questions')] },
  history: { text: 'Les Moissonneurs ont frappé la Citadelle en premier, coupant le gouvernement et les réseaux des Prothéens. Ilos était un site secret. Ses habitants ont tenté de survivre en stase ; j’ai dû couper des capsules pour conserver assez d’énergie aux derniers chercheurs. Lorsque les Moissonneurs sont repartis, il ne restait plus de civilisation à sauver.',
    choices: [c('keepers', 'Que pouvaient encore faire ces chercheurs ?', 'keepers'), questionBack] },
  keepers: { text: 'Les survivants ont emprunté le Conduit vers la Citadelle. Ils ont modifié la réponse des Veilleurs au signal des Moissonneurs. Le signal de Sovereign n’a donc pas ouvert la station. C’est pourquoi il lui faut Saren : quelqu’un capable de passer les défenses et de lui rendre les commandes.', choices: [questionBack] },
  questions: { text: 'La Citadelle est un relais vers l’espace obscur, laissé pour concentrer les civilisations dans un piège. Le Conduit est un autre relais, construit sur Ilos par les Prothéens : il conduit à la Citadelle. Saren veut l’utiliser pour remettre la station à Sovereign.',
    choices: [c('history', 'Le sort des Prothéens ?', 'history'), c('keepers', 'Pourquoi Sovereign a-t-il besoin de Saren ?', 'keepers'), c('data', 'Comment pouvons-nous l’arrêter ?', 'data')] },
  data: { text: 'Emportez ce fichier. Au centre de contrôle de la Citadelle, il vous donnera une possibilité de reprendre temporairement les commandes à Sovereign. Je vais abaisser la barrière. Vous pourrez alors reprendre la route du Conduit.',
    choices: [{ id: 'receive', label: 'Recevoir les données et enregistrer les révélations.', effect: 'record-vigil', nextStep: null }, questionBack] },
};

/** Read-only graph. Only the explicit final receipt records the exchange. */
export function getVigilExchange(state, step = 'intro') {
  const progress = progressFor(state), node = own(VIGIL, step) ? VIGIL[step] : null;
  if (!progress || !node || !vigilAvailable(state)) return null;
  return { speaker: 'Vigil', portrait: null, catalogIds: ['DIA-vigil-histoire', 'QST-revelation-de-vigil'],
    ...node, choices: node.choices.map(choice => ({ ...choice })) };
}

export function commitVigilExchange(state) {
  const progress = progressFor(state);
  if (!progress || !vigilAvailable(state)) return no('Rejoignez Vigil sur Ilos après avoir sécurisé les archives.');
  if (progress.vigilExchange) return { ok: true, changed: false };
  state.resolveEndgame = { ...progress, vigilExchange: true };
  return { ok: true, changed: true };
}

/** The ending chapter remains complete while the distinct nomination is pending. */
export function chooseHumanRepresentative(state, id) {
  const progress = progressFor(state);
  if (!progress || !scoped(state) || state.ending !== true || !has(state.completed, 'citadel-finale')
    || !['anderson', 'udina'].includes(id)) return no('Cette nomination n’est pas disponible.');
  if (progress.humanRepresentative !== null) return progress.humanRepresentative === id
    ? { ok: true, changed: false } : no('Le représentant humain a déjà été désigné.');
  state.resolveEndgame = { ...progress, humanRepresentative: id };
  return { ok: true, changed: true };
}

export function endgameReport(state) {
  const progress = progressFor(state);
  if (!progress || !scoped(state)) return null;
  const fleetOrder = has(state.completed, 'citadel-finale') && ['save-council', 'focus-sovereign'].includes(state.choices?.['citadel-finale'])
    ? state.choices['citadel-finale'] : null;
  return { vigilExchange: progress.vigilExchange, fleetOrder,
    councilFate: fleetOrder === 'save-council' ? 'saved' : fleetOrder === 'focus-sovereign' ? 'destroyed' : null,
    humanRepresentative: progress.humanRepresentative, futurePresence: 'undetermined' };
}

export function getPoliticalEpilogue(state) {
  const report = endgameReport(state);
  if (!report?.fleetOrder) return null;
  const representativeName = report.humanRepresentative === 'anderson' ? 'David Anderson'
    : report.humanRepresentative === 'udina' ? 'Donnel Udina' : null;
  return { ...report, representativeName,
    councilText: report.councilFate === 'saved'
      ? 'La flotte de l’Alliance a secouru l’Ascension. Les membres du Conseil ont survécu à la bataille et reconnaissent le rôle de l’humanité dans la victoire.'
      : 'La flotte de l’Alliance a concentré ses forces sur Sovereign. L’Ascension a été détruite et les membres du Conseil ont péri. La reconstruction politique commence après cette perte.',
    representativeText: representativeName
      ? `Shepard a recommandé ${representativeName} pour le siège humain. Cette nomination est conservée séparément du sort du Conseil.`
      : 'La recommandation de Shepard pour le siège humain n’est pas renseignée dans ce bilan.',
    limit: 'Le bilan décrit la fin ME1. Il ne détermine aucune présence, fonction ou scène future dans une campagne ME2 ou ME3.' };
}
