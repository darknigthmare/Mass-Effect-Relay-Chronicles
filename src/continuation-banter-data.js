// Original concise French adaptations for the ME1 campaign, not quotations.
// Pair IDs and line IDs are stable save/localization keys. No romance or reward.
const pair = (id, speakers, texts, extra = {}) => ({
  id: `banter:${id}`, catalogId: 'DIA-banter-en-exploration', speakers,
  lines: speakers.map((speakerId, index) => ({ id: `${id}:${index + 1}`, speakerId, text: texts[index] })), ...extra,
});

export const EXPLORATION_BANTERS = [
  pair('eden-patrol', ['kaidan', 'jenkins'], [
    'Restez attentif, Jenkins. Le silence de la colonie ne me rassure pas.',
    'Compris, lieutenant. Je surveille notre flanc.',
  ], { zone: 'eden-prime', beforeJenkinsLoss: true }),
  pair('eden-survivors', ['ashley', 'kaidan'], [
    'Je connais cette colonie. On ne peut pas abandonner ceux qui sont encore là.',
    'On progresse ensemble. Gardons les accès dégagés pour les survivants.',
  ], { zone: 'eden-prime' }),
  pair('citadel-maintenance', ['tali', 'garrus'], [
    'Toute cette station repose sur des systèmes que ses habitants connaissent à peine.',
    'Et le SSC doit quand même assurer la sécurité quand ces systèmes tombent en panne.',
  ], { zone: 'citadel' }),
  pair('therum-ruins', ['liara', 'tali'], [
    'Les structures prothéennes résistent encore. Leur état mérite une étude méthodique.',
    'D’abord vérifier que le matériel tient. Ensuite, je vous aide à relever les données.',
  ], { zone: 'therum', requiresCompleted: ['therum'] }),
  pair('feros-colony', ['ashley', 'garrus'], [
    'Une colonie ne tient pas longtemps si chaque accès devient une ligne de front.',
    'Sécurisons les passages. Les habitants ont besoin de pouvoir circuler.',
  ], { zone: 'feros' }),
  pair('noveria-security', ['garrus', 'wrex'], [
    'Sur Novéria, chaque entreprise semble avoir sa propre définition de la sécurité.',
    'Tant qu’on sait qui nous vise, les règlements peuvent attendre.',
  ], { zone: 'noveria' }),
  pair('virmire-approach', ['kaidan', 'tali'], [
    'Le terrain limite nos angles de tir. Restons à portée du commando.',
    'Je garde mes capteurs actifs. Pas question de se laisser isoler ici.',
  ], { zone: 'virmire' }),
  pair('ilos-ruins', ['liara', 'garrus'], [
    'Ces ruines pourraient éclairer tant de questions. Nous devons pourtant continuer.',
    'Je surveille les accès. Relevez ce que vous pouvez sans perdre Shepard de vue.',
  ], { zone: 'ilos' }),
  pair('finale-advance', ['ashley', 'wrex'], [
    'Nous sommes encore debout. On garde la formation jusqu’au bout.',
    'Voilà un ordre qui me convient. Avançons.',
  ], { zone: 'citadel-finale' }),
  pair('kaidan-ashley', ['kaidan', 'ashley'], [
    'Vous vérifiez toujours les sorties en entrant quelque part, Williams ?',
    'Les sorties, les hauteurs et les angles morts. Les habitudes de la garnison.',
  ]),
  pair('kaidan-garrus', ['kaidan', 'garrus'], [
    'Votre formation au SSC doit aider à lire le terrain.',
    'Surtout à repérer les endroits où une situation peut déraper.',
  ]),
  pair('kaidan-tali', ['kaidan', 'tali'], [
    'Vous surveillez autant les machines que les alentours.',
    'Sur un vaisseau de la Flotte, un bruit inhabituel mérite toujours qu’on l’écoute.',
  ]),
  pair('kaidan-wrex', ['kaidan', 'wrex'], [
    'Vous avez souvent travaillé dans un commando comme celui-ci ?',
    'Assez pour savoir qu’une équipe qui se couvre vaut mieux que trois héros isolés.',
  ]),
  pair('kaidan-liara', ['kaidan', 'liara'], [
    'L’exploration sur le terrain vous change de vos recherches ?',
    'Mes recherches exigeaient déjà de la prudence. Votre commando y ajoute une autre forme de risque.',
  ]),
  pair('ashley-garrus', ['ashley', 'garrus'], [
    'Vous avez le réflexe de surveiller les hauteurs, Vakarian.',
    'Et vous celui de couvrir les approches. Nous devrions nous entendre sur le terrain.',
  ]),
  pair('ashley-tali', ['ashley', 'tali'], [
    'Votre combinaison tient le coup avec tous ces déplacements ?',
    'Je l’entretiens avec soin. Dans la Flotte, apprendre cela fait partie de la vie quotidienne.',
  ]),
  pair('ashley-wrex', ['ashley', 'wrex'], [
    'Vous marchez toujours aussi tranquillement en terrain inconnu ?',
    'Je regarde où je vais. M’agiter ne rendrait pas mon armure plus solide.',
  ]),
  pair('ashley-liara', ['ashley', 'liara'], [
    'Vous comptez vraiment étudier chaque ruine que nous croisons ?',
    'J’aimerais. Pour l’instant, je me contente de noter celles qui mériteraient un retour.',
  ]),
  pair('garrus-tali', ['garrus', 'tali'], [
    'Vous trouvez toujours quelque chose à examiner dans un terminal.',
    'Les systèmes laissent des traces. Encore faut-il prendre le temps de les comprendre.',
  ]),
  pair('garrus-wrex', ['garrus', 'wrex'], [
    'Vous préférez toujours les approches directes ?',
    'Je préfère celles qui nous ramènent tous. Parfois, faire un détour suffit.',
  ]),
  pair('garrus-liara', ['garrus', 'liara'], [
    'Comment distinguez-vous une découverte d’une simple pierre ancienne ?',
    'Par son contexte. Déplacer un objet sans l’observer peut faire disparaître la réponse.',
  ]),
  pair('tali-wrex', ['tali', 'wrex'], [
    'Vous transportez presque autant de matériel que moi.',
    'Le vôtre répare les machines. Le mien aide à nous garder en vie.',
  ]),
  pair('tali-liara', ['tali', 'liara'], [
    'Vous étudiez les vestiges. Moi, je voudrais savoir comment leurs machines fonctionnaient.',
    'Ces questions se complètent. Une pièce technique peut expliquer bien des usages.',
  ]),
  pair('wrex-liara', ['wrex', 'liara'], [
    'Vous n’avez pas choisi le terrain le plus calme pour vos recherches.',
    'Les vestiges ne choisissent pas leur emplacement. J’apprécie d’avoir une escorte aujourd’hui.',
  ]),
].map(entry => Object.freeze({ ...entry, speakers: Object.freeze(entry.speakers), lines: Object.freeze(entry.lines.map(Object.freeze)) }));

const BY_ID = new Map(EXPLORATION_BANTERS.map(entry => [entry.id, entry]));
const FIELD_ZONES = new Set(['eden-prime', 'citadel', 'therum', 'feros', 'noveria', 'virmire', 'ilos', 'citadel-finale']);

export const isExplorationBanterKey = id => BY_ID.has(id);

function campaignContext(state) {
  return state && (!Object.prototype.hasOwnProperty.call(state, 'context')
    || state.context?.mediaId === 'ME1' && state.context?.periodId === 'me1'
      && (!Object.prototype.hasOwnProperty.call(state.context, 'galaxy') || state.context.galaxy === 'milky-way'));
}

// Historical lines survive squad changes and narrative deaths; they cannot
// claim a speaker who was never recruited or a destination never visited.
export function explorationBanterHistoryPossible(state, story, id) {
  const entry = BY_ID.get(id);
  return Boolean(campaignContext(state) && entry
    && entry.speakers.every(speaker => state.recruited?.includes(speaker))
    && (entry.zone ? story.visitedZones.includes(entry.zone) : story.visitedZones.some(zone => FIELD_ZONES.has(zone)))
    && (entry.requiresCompleted || []).every(zone => state.completed?.includes(zone))
    && (!entry.speakers.includes('liara') || state.completed?.includes('therum')));
}

export function explorationBanterPossible(state, story, entry) {
  return Boolean(campaignContext(state) && FIELD_ZONES.has(state.zone) && !state.ending
    && (!entry.zone || entry.zone === state.zone)
    && explorationBanterHistoryPossible(state, story, entry.id)
    && state.party?.length === 3 && state.party[0] === 'shepard'
    && entry.speakers.every(speaker => state.party.slice(1).includes(speaker) && !state.lost?.includes(speaker))
    && (!entry.beforeJenkinsLoss || !state.flags?.jenkinsLost));
}
