import { objectiveReady, unlockedZones } from './state.js';

// Concise French adaptations of the campaign beats in docs/DESIGN.md. These
// graphs do not claim to transcribe ME1. Reading a line never grants a reward.
// Main retains the existing briefing, recruitment and completeZone mutations.
const choice = (id, label, nextStep, extra = {}) => ({ id, label, nextStep, ...extra });
const leave = () => choice('leave', 'Revenir sur le terrain.', null, { effect: 'close' });
const back = (nextStep = 'questions') => choice('back', 'J’ai une autre question.', nextStep);
const line = (speaker, portrait, text, choices, catalogId) => ({ speaker, portrait, text, choices, catalogId });
const BRIEFING = 'DIA-anderson-avant-eden-prime';
const AUDIENCE = 'DIA-premiere-audience';
const PROOF = 'DIA-tali-preuve';
const INVESTITURE = 'DIA-intronisation';
const TRANSMISSION = 'DIA-anderson-transmission';

const FLOWS = {
  briefing: {
    intro: line('Capitaine Anderson', 'anderson', 'La découverte d’une balise prothéenne sur Eden Prime donne à notre mission une importance particulière. Le Normandy est un bâtiment expérimental de l’Alliance et de la Hiérarchie turienne. Nous allons sécuriser la balise.', [
      choice('steady', 'Vous pouvez compter sur nous.', 'steady', { tone: 'paragon' }),
      choice('practical', 'Quels sont nos ordres ?', 'practical'),
      choice('direct', 'Alors ne perdons pas de temps.', 'direct', { tone: 'renegade' }),
      choice('questions', 'J’ai quelques questions.', 'questions'), leave(),
    ], BRIEFING),
    steady: line('Capitaine Anderson', 'anderson', 'Je le sais. Gardez votre équipe soudée et concentrez-vous sur la mission.', [choice('questions', 'Précisons la mission.', 'questions')], BRIEFING),
    practical: line('Capitaine Anderson', 'anderson', 'Kaidan et Jenkins vous accompagnent au sol. Localisez la balise et préparez sa récupération.', [choice('questions', 'Précisons la mission.', 'questions')], BRIEFING),
    direct: line('Capitaine Anderson', 'anderson', 'La rapidité ne remplace pas la préparation. Vous aurez besoin d’une équipe prête à réagir.', [choice('questions', 'Précisons la mission.', 'questions')], BRIEFING),
    questions: line('Capitaine Anderson', 'anderson', 'Que voulez-vous savoir avant la descente ?', [
      choice('normandy', 'Pourquoi tester le Normandy ici ?', 'normandy'),
      choice('beacon', 'Que savons-nous de la balise ?', 'beacon'),
      choice('nihlus', 'Pourquoi Nihlus nous accompagne-t-il ?', 'nihlus'),
      choice('ready', 'Mission comprise. Préparons la descente.', 'ready'), leave(),
    ], BRIEFING),
    normandy: line('Capitaine Anderson', 'anderson', 'Son système de furtivité permet d’approcher discrètement. Cette mission doit aussi mettre à l’épreuve la coopération humaine et turienne qui a rendu sa construction possible.', [back()], BRIEFING),
    beacon: line('Capitaine Anderson', 'anderson', 'Les colons ont mis au jour une balise prothéenne. Une telle découverte intéresse le Conseil. Notre priorité est de la récupérer en sécurité.', [back()], BRIEFING),
    nihlus: line('Capitaine Anderson', 'anderson', 'Nihlus est un Spectre du Conseil. Il participe à cette mission et observe vos capacités. Vous pouvez également lui parler avant la descente.', [back()], BRIEFING),
    ready: line('Capitaine Anderson', 'anderson', 'Vérifiez votre équipement. Kaidan et Jenkins seront avec vous. La carte galactique vous permettra de préparer le déploiement vers Eden Prime.', [
      choice('deploy', 'Ouvrir la carte galactique.', null, { effect: 'brief' }),
      choice('questions', 'Une dernière question.', 'questions'), leave(),
    ], BRIEFING),
  },
  'first-audience': {
    intro: line('Ambassadeur Udina', 'udina', 'L’attaque d’Eden Prime doit être portée devant le Conseil. Shepard, exposez les faits sans laisser nos accusations se perdre dans la politique.', [choice('continue', 'Présenter le rapport.', 'anderson'), leave()], AUDIENCE),
    anderson: line('Capitaine Anderson', 'anderson', 'Eden Prime a été attaquée par les geth. Nihlus a été tué. Nous demandons que les accusations concernant Saren soient examinées.', [choice('continue', 'Écouter le Conseil.', 'council')], AUDIENCE),
    council: line('Conseillère asari', null, 'La gravité de l’attaque ne suffit pas à établir la responsabilité de Saren. Le Conseil exige des éléments vérifiables.', [
      choice('cooperate', 'Nous trouverons des preuves.', 'cooperate', { tone: 'paragon' }),
      choice('challenge', 'Notre rapport mérite votre attention.', 'challenge', { tone: 'renegade' }),
      choice('questions', 'Qu’attendez-vous de notre enquête ?', 'questions'),
    ], AUDIENCE),
    cooperate: line('Conseiller turien', null, 'Rapportez des preuves. Une accusation contre un Spectre ne peut reposer uniquement sur vos soupçons.', [choice('continue', 'Rejoindre Udina.', 'udina')], AUDIENCE),
    challenge: line('Conseiller turien', null, 'Votre rapport a été entendu. Il ne nous permet pas de condamner Saren. Apportez des éléments qui établissent son implication.', [choice('continue', 'Rejoindre Udina.', 'udina')], AUDIENCE),
    questions: line('Conseillère asari', null, 'Un témoignage ou des données permettant de relier Saren à l’attaque. Poursuivez votre enquête à la Citadelle.', [choice('continue', 'Nous poursuivrons l’enquête.', 'udina')], AUDIENCE),
    udina: line('Ambassadeur Udina', 'udina', 'Nous allons devoir obtenir ce que le Conseil réclame. Cherchez des témoins et suivez les pistes disponibles à la Citadelle.', [choice('finish', 'Poursuivre l’enquête.', null, { effect: 'close' })], AUDIENCE),
  },
  'tali-proof': {
    intro: line('Tali’Zorah nar Rayya', 'tali', 'Je m’appelle Tali’Zorah. Je suis en pèlerinage, loin de la Flotte. J’ai des informations qui pourraient vous aider contre Saren.', [
      choice('origin', 'D’où viennent ces informations ?', 'origin'),
      choice('pilgrimage', 'Votre pèlerinage ?', 'pilgrimage'),
      choice('receive', 'Confiez-nous les données. Rejoignez notre commando.', 'proof', { effect: 'recruit-tali' }), leave(),
    ], PROOF),
    origin: line('Tali’Zorah nar Rayya', 'tali', 'J’ai récupéré des données dans la mémoire d’un geth. Je peux vous les remettre pour que vous les présentiez au Conseil.', [choice('back', 'Parlons de la suite.', 'intro')], PROOF),
    pilgrimage: line('Tali’Zorah nar Rayya', 'tali', 'Les jeunes Quariens quittent la Flotte pour rapporter quelque chose d’utile à leur communauté. Mes compétences techniques peuvent vous servir.', [choice('back', 'Parlons de la suite.', 'intro')], PROOF),
    proof: line('Tali’Zorah nar Rayya', 'tali', 'Voici l’enregistrement extrait du geth. Il relie Saren à l’attaque d’Eden Prime et fait entendre une autre voix, celle de Bénézia. Ces données peuvent être présentées au Conseil.', [
      choice('geth', 'Comment avez-vous pu extraire cela ?', 'geth'),
      choice('finish', 'Nous allons présenter ces preuves au Conseil.', null, { effect: 'close' }),
    ], PROOF),
    geth: line('Tali’Zorah nar Rayya', 'tali', 'Je connais les systèmes geth et j’ai pu préserver cet enregistrement. Je vous accompagnerai pour expliquer ce que j’ai récupéré.', [choice('back', 'Revenir aux preuves.', 'proof')], PROOF),
  },
  investiture: {
    intro: line('Ambassadeur Udina', 'udina', 'Tali nous a remis un enregistrement extrait d’un geth. Ces données mettent Saren en cause dans l’attaque d’Eden Prime. Le Conseil doit les entendre.', [choice('continue', 'Présenter les preuves de Tali.', 'verdict'), leave()], INVESTITURE),
    verdict: line('Conseillère asari', null, 'Ces preuves établissent la trahison de Saren. Il est déchu de son statut de Spectre. Shepard, le Conseil vous nomme Spectre pour le poursuivre.', [
      choice('honor', 'Je ferai honneur à cette confiance.', 'honor', { tone: 'paragon' }),
      choice('duty', 'J’accepte cette mission.', 'duty'),
      choice('resolve', 'J’arrêterai Saren.', 'resolve', { tone: 'renegade' }),
      choice('questions', 'Que signifie cette nomination ?', 'questions'),
    ], INVESTITURE),
    honor: line('Conseillère asari', null, 'Votre responsabilité est désormais à la mesure de votre autorité. Poursuivez Saren et mettez fin à sa menace.', [choice('continue', 'Retrouver Anderson.', 'handoff')], INVESTITURE),
    duty: line('Conseiller turien', null, 'Les Spectres disposent d’une grande autonomie au service du Conseil. Il vous revient maintenant de mener cette enquête.', [choice('continue', 'Retrouver Anderson.', 'handoff')], INVESTITURE),
    resolve: line('Conseiller turien', null, 'Nous attendons des résultats. Le statut de Spectre vous donne les moyens de poursuivre cette mission.', [choice('continue', 'Retrouver Anderson.', 'handoff')], INVESTITURE),
    questions: line('Conseillère asari', null, 'Les Spectres agissent au nom du Conseil avec une grande autonomie. Cette responsabilité ne change pas notre décision concernant Saren. Acceptez-vous cette mission ?', [
      choice('honor', 'Je ferai honneur à cette confiance.', 'honor', { tone: 'paragon' }),
      choice('duty', 'J’accepte cette mission.', 'duty'),
      choice('resolve', 'J’arrêterai Saren.', 'resolve', { tone: 'renegade' }),
    ], INVESTITURE),
    handoff: line('Capitaine Anderson', 'anderson', 'Le Normandy vous est confié. Vous aurez besoin d’un vaisseau et de son équipage pour poursuivre Saren. Je vous passe le commandement.', [
      choice('orders', 'Quelles pistes avons-nous ?', 'orders'),
      choice('thanks', 'Merci, capitaine. Je prendrai soin du Normandy.', 'thanks', { tone: 'paragon' }),
      choice('ready', 'Je suis prêt à prendre le commandement.', 'ready'),
    ], TRANSMISSION),
    orders: line('Capitaine Anderson', 'anderson', 'Vous pouvez enquêter sur Féros et Novéria ou rechercher Liara T’Soni dans le secteur de Thérum. Consultez la carte galactique à bord et choisissez votre première piste.', [choice('back', 'Revenir à la passation.', 'handoff')], TRANSMISSION),
    thanks: line('Capitaine Anderson', 'anderson', 'L’équipage est prêt. À vous de le conduire et de décider quelle piste suivre.', [choice('continue', 'Prendre le commandement.', 'ready')], TRANSMISSION),
    ready: line('Capitaine Anderson', 'anderson', 'Le Normandy est à vous, Shepard. Rejoignez votre équipage et poursuivez l’enquête.', [choice('finish', 'Passation terminée. Rejoindre le Normandy.', null, { effect: 'complete-citadel' })], TRANSMISSION),
  },
};

export const CAMPAIGN_DIALOGUE_IDS = Object.freeze(Object.keys(FLOWS));
const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const no = reason => ({ ok: false, reason });

function available(state, id) {
  if (!state || !Array.isArray(state.completed) || !Array.isArray(state.recruited)
    || !Array.isArray(state.lost) || !state.flags || !Array.isArray(state.cleared)) return false;
  if (state.context && (state.context.mediaId !== 'ME1' || state.context.periodId !== 'me1')) return false;
  if (id === 'briefing') return state.zone === 'normandy' && !state.completed.includes('eden-prime')
    && !state.cleared.some(value => value.startsWith('eden-prime:'))
    && !state.story?.visitedZones?.includes('eden-prime');
  if (state.zone !== 'citadel' || !unlockedZones(state).includes('citadel')) return false;
  if (id === 'first-audience') return !state.completed.includes('citadel') && !state.recruited.includes('tali');
  if (id === 'tali-proof') return !state.lost.includes('tali');
  return id === 'investiture' && objectiveReady(state, 'citadel');
}

/** Detached display model. No new save fields or dialogue reward budget. */
export function getCampaignDialogue(state, id, step = 'intro') {
  if (typeof id !== 'string' || !own(FLOWS, id) || typeof step !== 'string'
    || !own(FLOWS[id], step) || !available(state, id)) return no('Ce dialogue n’est pas disponible à cette étape.');
  if (id === 'tali-proof') {
    const hasProof = state.recruited.includes('tali');
    if (!hasProof && ['proof', 'geth'].includes(step)) return no('Tali doit d’abord vous confier ses données.');
    if (hasProof && ['intro', 'origin', 'pilgrimage'].includes(step)) step = 'proof';
  }
  const node = FLOWS[id][step];
  return { ok: true, id, step, catalogId: node.catalogId, speaker: node.speaker,
    portrait: node.portrait, text: node.text,
    choices: node.choices.map(({ id: choiceId, label, tone }) => ({ id: choiceId, label, ...(tone ? { tone } : {}) })) };
}

/** Revalidate a displayed choice against the current campaign before acting. */
export function advanceCampaignDialogue(state, id, step, choiceId) {
  const model = getCampaignDialogue(state, id, step);
  if (!model.ok) return model;
  const selected = FLOWS[id][model.step].choices.find(entry => entry.id === choiceId);
  if (!selected) return no('Cette réponse n’est pas disponible.');
  return { ok: true, ...(selected.nextStep ? { nextStep: selected.nextStep } : {}),
    ...(selected.effect ? { effect: selected.effect } : {}) };
}
