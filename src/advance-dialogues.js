// Concise French adaptations of the catalogue's ME1 recruitment subjects.
// These graphs stage the existing condensed Citadel; they do not reconstruct
// the clinic assault, C-Sec office or original dialogue word for word.
const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
const no = reason => ({ ok: false, reason });
const choice = (id, label, nextStep, effect) => ({ id, label, ...(nextStep ? { nextStep } : {}), ...(effect ? { effect } : {}) });
const close = () => choice('leave', 'Revenir sur le terrain.', null, 'close');
const back = () => choice('back', 'Parlons de votre proposition.', 'intro');
const line = (text, choices) => ({ text, choices });
const FLOWS = {
  garrus: {
    catalogId: 'DIA-garrus-clinique', speaker: 'Garrus Vakarian', portrait: 'garrus',
    nodes: {
      intro: line('J’enquêtais sur Saren au SSC. Les procédures ont arrêté mes recherches, mais je reste convaincu qu’il faut poursuivre cette piste. Si votre mission vous conduit jusqu’à lui, je veux vous accompagner.', [
        choice('investigation', 'Pourquoi avoir quitté cette enquête ?', 'investigation'),
        choice('methods', 'Comment comptez-vous nous aider ?', 'methods'),
        choice('accept', 'Bienvenue dans le commando.', 'joined', 'recruit-garrus'),
        choice('refuse', 'Je préfère poursuivre sans vous.', 'refused'),
        choice('defer', 'Nous en reparlerons plus tard.', 'deferred'), close(),
      ]),
      investigation: line('Le SSC exige des preuves avant de poursuivre un Spectre. Vous cherchez ces preuves, et je veux contribuer à l’enquête. Je vous propose mon aide ; la décision vous appartient.', [back(), close()]),
      methods: line('Je peux apporter mon expérience du SSC, mon entraînement au tir et mes compétences techniques. Vous gardez le commandement et le choix de l’équipe déployée.', [back(), close()]),
      refused: line('C’est votre décision. Si vous changez d’avis, vous pourrez revenir me parler ici.', [choice('reconsider', 'Reprenons votre proposition.', 'intro'), close()]),
      deferred: line('Prenez le temps de décider. Mon aide reste disponible si vous souhaitez poursuivre ensemble.', [choice('reconsider', 'Reprenons votre proposition.', 'intro'), close()]),
      joined: line('Je vous retrouverai à bord du Normandy. Nous préparerons la suite de l’enquête.', [close()]),
    },
  },
  wrex: {
    catalogId: 'DIA-wrex-contrat', speaker: 'Urdnot Wrex', portrait: 'wrex',
    nodes: {
      intro: line('Urdnot Wrex. Je suis mercenaire. Saren se retrouve au centre de trop d’affaires, et votre enquête peut servir nos intérêts à tous les deux. Je vous propose mes services.', [
        choice('mercenary', 'Vous êtes mercenaire ?', 'mercenary'),
        choice('interest', 'Quel intérêt avez-vous dans cette enquête ?', 'interest'),
        choice('accept', 'Bienvenue dans le commando.', 'joined', 'recruit-wrex'),
        choice('refuse', 'Je ne veux pas de vos services.', 'refused'),
        choice('defer', 'Je prendrai ma décision plus tard.', 'deferred'), close(),
      ]),
      mercenary: line('Je suis payé pour un travail et je le mène à son terme. Je sais me battre. Si vous me prenez dans votre équipe, il faudra compter avec mes propres raisons d’être là.', [back(), close()]),
      interest: line('Nous cherchons des réponses autour de Saren. Vous avez une mission, j’ai mes intérêts. Cela peut suffire pour travailler ensemble.', [back(), close()]),
      refused: line('Alors continuez sans moi. Si vous revenez sur votre décision, vous savez où me trouver.', [choice('reconsider', 'Reprenons votre proposition.', 'intro'), close()]),
      deferred: line('Très bien. Revenez quand vous aurez décidé.', [choice('reconsider', 'Reprenons votre proposition.', 'intro'), close()]),
      joined: line('Je vous rejoindrai sur le Normandy. Choisissez votre équipe avant de repartir.', [close()]),
    },
  },
};

export const ADVANCE_RECRUITMENT_IDS = Object.freeze(Object.keys(FLOWS));

function available(state, id) {
  return !!state && state.zone === 'citadel' && state.flags?.briefed === true && Array.isArray(state.completed)
    && state.completed.includes('eden-prime') && Array.isArray(state.recruited)
    && Array.isArray(state.lost) && !state.lost.includes(id)
    && (!state.context || (state.context.mediaId === 'ME1' && state.context.periodId === 'me1'));
}

/** Read-only, detached model. Recruitment remains the existing state transaction. */
export function getAdvanceRecruitment(state, id, step = 'intro') {
  if (typeof id !== 'string' || !own(FLOWS, id) || typeof step !== 'string'
    || !own(FLOWS[id].nodes, step) || !available(state, id)) return no('Ce recrutement n’est pas disponible.');
  const joined = state.recruited.includes(id);
  if (joined) step = 'joined';
  else if (step === 'joined') return no('Cet équipier doit d’abord accepter de vous rejoindre.');
  const flow = FLOWS[id], node = flow.nodes[step];
  return { ok: true, id, step, catalogId: flow.catalogId, speaker: flow.speaker,
    portrait: flow.portrait, text: node.text,
    choices: node.choices.map(({ id, label }) => ({ id, label })) };
}

/** Revalidate stale callbacks against the present location, death and recruitment. */
export function advanceRecruitment(state, id, step, choiceId) {
  const model = getAdvanceRecruitment(state, id, step);
  if (!model.ok) return model;
  const selected = FLOWS[id].nodes[model.step].choices.find(choice => choice.id === choiceId);
  if (!selected) return no('Cette réponse n’est pas disponible.');
  return { ok: true, ...(selected.nextStep ? { nextStep: selected.nextStep } : {}),
    ...(selected.effect ? { effect: selected.effect } : {}) };
}
