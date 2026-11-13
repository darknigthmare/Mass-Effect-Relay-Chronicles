// Read-only consequences of the ME1 campaign that was actually recorded.
// These summaries introduce neither affection scores nor unplayed future events.
import { CREW, CHAPTERS } from './game-data.js';
import { ORIGINS, PSYCHOLOGICAL_PROFILES } from './commander.js';
import { STORY_CONVERSATIONS } from './story-data.js';

const has = (values, value) => Array.isArray(values) && values.includes(value);
const done = (state, zone) => has(state?.completed, zone);
const name = id => CREW[id]?.name || id;
const VIRMIRE_CHOICES = { 'save-kaidan': ['kaidan', 'ashley'], 'save-ashley': ['ashley', 'kaidan'] };

/** Completion order, rather than visits or unlocked destinations, defines lateness. */
export function getRecruitmentContext(state, id = 'liara') {
  if (id !== 'liara' || !has(state?.recruited, id) || !done(state, 'therum')) return null;
  const order = state.completed, rescueIndex = order.indexOf('therum');
  const earlier = order.slice(0, rescueIndex).filter(zone => ['feros', 'noveria', 'virmire'].includes(zone));
  return { id, late: earlier.length > 0, earlierDestinations: earlier.map(zone => ({ id: zone, name: CHAPTERS[zone].name })),
    text: earlier.length
      ? `Vous avez déjà mené votre enquête sur ${earlier.map(zone => CHAPTERS[zone].name).join(', ')} avant de me trouver sur Thérum. Je dois prendre connaissance de vos rapports ; mes recherches ne remplacent pas ce que vous avez découvert sur le terrain.`
      : 'Vous êtes venus me chercher sur Thérum au début de votre enquête. Je peux maintenant mettre mes recherches à votre disposition pour les prochaines pistes.' };
}

export function getVirmireConsequence(state) {
  if (!done(state, 'virmire')) return null;
  const pair = VIRMIRE_CHOICES[state?.choices?.virmire];
  if (!pair || !has(state.recruited, pair[0]) || !has(state.lost, pair[1])) return null;
  return { survivor: pair[0], lost: pair[1], survivorName: name(pair[0]), lostName: name(pair[1]),
    text: `${name(pair[0])} a été extrait du site. ${name(pair[1])} a péri sur Virmire. Cette perte est définitive ; les soins et la réanimation de combat ne permettent pas de rappeler un membre mort dans le récit.` };
}

/** Relations describe recorded exchanges, without manufacturing romantic stages. */
export function getCompanionRelations(state) {
  if (!state) return [];
  return Object.values(CREW).filter(actor => actor.id !== 'shepard' && has(state.recruited, actor.id)).map(actor => {
    const topics = STORY_CONVERSATIONS[actor.id]?.topics || [];
    const exchanges = topics.filter(topic => has(state.story?.heard, `${actor.id}:${topic.id}`)).map(topic => ({ id: topic.id, label: topic.label }));
    const lost = has(state.lost, actor.id);
    const advice = actor.id === 'garrus' && ['procedure', 'results'].includes(state.story?.choices?.['garrus:procedure'])
      ? state.story.choices['garrus:procedure'] : null;
    return { id: actor.id, name: actor.name, available: !lost, selected: !lost && has(state.party, actor.id),
      status: lost ? 'lost' : advice ? 'advice-recorded' : exchanges.length ? 'exchanged' : 'recruited',
      label: lost ? 'Décès dans le récit' : advice ? 'Conseil mémorisé' : exchanges.length ? 'Échanges établis' : 'A rejoint le commando',
      exchanges, advice };
  });
}

export function getNarrativeConsequences(state) {
  if (!state) return [];
  const result = [];
  if (has(state.lost, 'jenkins')) result.push({ id: 'jenkins', name: 'Eden Prime · Jenkins', text: 'Richard Jenkins a été tué lors du premier contact. Il ne fait plus partie des équipiers disponibles.', permanent: true });
  if (done(state, 'feros') && ['save', 'force'].includes(state.choices?.feros)) result.push({ id: 'feros', name: 'Féros · sort de la colonie',
    text: state.choices.feros === 'save' ? 'Votre rapport privilégie la protection des colons et les secours à Zhu’s Hope.' : 'Votre rapport privilégie la neutralisation de la menace, au prix de pertes dans la colonie.',
    limit: 'Le rapport de cette campagne condensée ne fournit pas de décompte individuel des colons épargnés.' });
  if (done(state, 'noveria') && ['release', 'destroy'].includes(state.choices?.noveria)) result.push({ id: 'noveria', name: 'Novéria · reine rachni',
    text: state.choices.noveria === 'release' ? 'Vous avez libéré la reine rachni de Pic 15.' : 'Vous avez ordonné la destruction de la reine rachni à Pic 15.' });
  const virmire = getVirmireConsequence(state);
  if (virmire) result.push({ id: 'virmire', name: 'Virmire · extraction', text: virmire.text, permanent: true });
  const advice = state.story?.choices?.['garrus:procedure'];
  if (has(state.recruited, 'garrus') && has(state.story?.heard, 'garrus:procedure') && ['procedure', 'results'].includes(advice)) result.push({ id: 'garrus-advice', name: 'Garrus · conseil donné', text: advice === 'procedure'
    ? 'Vous avez conseillé de respecter les procédures pour protéger les innocents. Garrus s’en souvient dans la conversation suivante.'
    : 'Vous avez conseillé de privilégier les résultats face aux limites des procédures. Garrus s’en souvient dans la conversation suivante.' });
  if (done(state, 'citadel-finale') && ['save-council', 'focus-sovereign'].includes(state.choices?.['citadel-finale'])) result.push({ id: 'council', name: 'Citadelle · ordre à la flotte',
    text: state.choices['citadel-finale'] === 'save-council' ? 'Vous avez ordonné de secourir le vaisseau du Conseil pendant l’assaut.' : 'Vous avez ordonné de concentrer la flotte sur Sovereign pendant l’assaut.',
    limit: 'La composition politique d’après-guerre et le représentant humain ne sont pas décidés par ce seul ordre.' });
  return result;
}

export function getNarrativeSummary(state) {
  if (!state) return null;
  return { reputation: { paragon: Number.isFinite(state.paragon) ? state.paragon : 0, renegade: Number.isFinite(state.renegade) ? state.renegade : 0 },
    origin: ORIGINS[state.origin] ? { id: state.origin, ...ORIGINS[state.origin] } : null,
    psychologicalProfile: PSYCHOLOGICAL_PROFILES[state.psychologicalProfile] ? { id: state.psychologicalProfile, ...PSYCHOLOGICAL_PROFILES[state.psychologicalProfile] } : null,
    completedOrder: (state.completed || []).filter(zone => CHAPTERS[zone]).map(zone => ({ id: zone, name: CHAPTERS[zone].name })),
    recruitment: getRecruitmentContext(state), consequences: getNarrativeConsequences(state), companions: getCompanionRelations(state) };
}

export function narrativeTopicText(state, conversationId, topicId, fallback) {
  if (conversationId === 'liara' && topicId === 'archaeology') {
    const context = getRecruitmentContext(state);
    return context ? `${context.text}\n\n${fallback}` : fallback;
  }
  const virmire = getVirmireConsequence(state);
  if (topicId === 'virmire-return' && virmire && conversationId === virmire.survivor) return `Nous sommes revenus de Virmire, mais ${virmire.lostName} n’est plus là. Vous avez choisi mon extraction. Je continuerai à servir dans ce commando, sans oublier la personne que nous avons perdue.`;
  if (conversationId === 'chakwas' && topicId === 'virmire-loss' && virmire) return `${virmire.lostName} ne reviendra pas à bord. Les soins que nous apportons aux blessés et les réanimations sur le terrain ne peuvent pas annuler ce décès. ${virmire.survivorName} reste parmi nous ; nous devons aussi prendre soin de ceux qui continuent la mission.`;
  if (conversationId === 'chakwas' && topicId === 'commander-history') {
    const origin = ORIGINS[state?.origin], profile = PSYCHOLOGICAL_PROFILES[state?.psychologicalProfile];
    return origin && profile ? `Votre dossier porte la mention « ${origin.name} ». ${origin.description}\n\nPour vos états de service : « ${profile.name} ». ${profile.description} Ces événements font partie de votre histoire ; ils ne dispensent pas de suivre votre état aujourd’hui.` : fallback;
  }
  return fallback;
}
