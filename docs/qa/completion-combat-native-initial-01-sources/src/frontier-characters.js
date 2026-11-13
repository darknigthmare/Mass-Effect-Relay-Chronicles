// ME1-only information conversations. French adaptation, not canonical quotations.
// A new body does not certify a likeness or implement the character's whole quest.
const OWN = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
const freeze = value => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze); Object.freeze(value);
  }
  return value;
};
const body = id => ({ atlas: 'frontier-npcs', file: 'frontier-npcs.png', metadata: 'frontier-npcs.json', frame: id });

export const FRONTIER_NPCS = freeze([
  { id: 'adams', catalogId: 'NPC-greg-adams', name: 'Greg Adams', zone: 'normandy', conversationId: 'adams', characterKey: 'adams', sectorAnchor: 'engineering', position: [-3.4, -8.9], actorPosition: [-4.7, -9.3], gate: null, visual: body('adams') },
  { id: 'pressly', catalogId: 'NPC-charles-pressly', name: 'Charles Pressly', zone: 'normandy', conversationId: 'pressly', characterKey: 'pressly', sectorAnchor: 'navigation', position: [-1.8, -11], actorPosition: [-3, -11], gate: null, visual: body('pressly') },
  { id: 'requisitions-officer', catalogId: 'NPC-officier-des-requisitions', name: 'Officier des réquisitions', zone: 'normandy', conversationId: 'requisitions-officer', characterKey: 'requisitions-officer', sectorAnchor: 'cargo', position: [3.8, 2.8], actorPosition: [5, 2.8], gate: null, visual: body('requisitions-officer') },
  { id: 'jenkins', catalogId: 'NPC-richard-l-jenkins', name: 'Richard L. Jenkins', zone: 'normandy', conversationId: 'jenkins', characterKey: 'jenkins', sectorAnchor: 'crew', position: [3.6, 14], actorPosition: [4.8, 14], gate: 'before-eden', visual: { legacySprite: 'jenkins' } },
  { id: 'parasini', catalogId: 'NPC-gianna-parasini', name: 'Gianna Parasini', zone: 'noveria', conversationId: 'parasini', characterKey: 'parasini', sectorAnchor: 'port', gate: 'after-citadel', visual: body('parasini') },
  { id: 'anoleis', catalogId: 'NPC-administrator-anoleis', name: 'Administrateur Anoleis', zone: 'noveria', conversationId: 'anoleis', characterKey: 'anoleis', sectorAnchor: 'port', gate: 'after-citadel', visual: body('anoleis') },
  { id: 'lorik', catalogId: 'NPC-lorik-qui-in', name: 'Lorik Qui’in', zone: 'noveria', conversationId: 'lorik', characterKey: 'lorik', sectorAnchor: 'port', gate: 'after-citadel', visual: body('lorik') },
  { id: 'lilihierax', catalogId: 'NPC-lilihierax', name: 'Lilihierax', zone: 'noveria', conversationId: 'lilihierax', characterKey: 'lilihierax', sectorAnchor: 'garage', gate: 'after-citadel', visual: body('lilihierax') },
]);
const NPC_BY_ID = Object.fromEntries(FRONTIER_NPCS.map(npc => [npc.id, npc]));
const BODY_IDS = FRONTIER_NPCS.filter(npc => npc.visual.atlas).map(npc => npc.id);

export function getFrontierNPC(id) {
  return typeof id === 'string' && OWN(NPC_BY_ID, id) ? NPC_BY_ID[id] : null;
}

/** A world context may omit zone; callers resolve the NPC's zone before placement. */
export function frontierNPCVisible(context, npcOrId) {
  const npc = getFrontierNPC(typeof npcOrId === 'string' ? npcOrId : npcOrId?.id);
  if (!context || !npc || (context.zone !== undefined && context.zone !== npc.zone)
    || (context.mediaId !== undefined && context.mediaId !== 'ME1')
    || (context.periodId !== undefined && context.periodId !== 'me1')
    || (context.context?.mediaId !== undefined && context.context.mediaId !== 'ME1')
    || (context.context?.periodId !== undefined && context.context.periodId !== 'me1')) return false;
  if (npc.id === 'jenkins') {
    const visited = context.visitedZones || context.story?.visitedZones || [];
    return context.flags?.jenkinsLost !== true && !(context.lost || []).includes('jenkins')
      && !visited.includes('eden-prime') && !(context.completed || []).includes('eden-prime')
      && !(context.cleared || []).some(id => typeof id === 'string' && id.startsWith('eden-prime:'));
  }
  return npc.gate !== 'after-citadel' || (context.completed || []).includes('citadel');
}

export const FRONTIER_STORY_CONVERSATIONS = freeze({
  adams: { speaker: 'Greg Adams', portrait: 'adams', topics: [
    { id: 'engineering', label: 'La salle des machines', text: 'Je dirige l’équipe technique du Normandy. Nous surveillons la propulsion et les systèmes du vaisseau pour que le commando puisse compter sur eux. La discrétion du SR-1 repose sur une conception particulière, mais aussi sur son entretien.', catalogId: 'NPC-greg-adams' },
    { id: 'stealth', label: 'La discrétion du SR-1', text: 'Le système furtif retient temporairement la chaleur produite à bord au lieu de la rejeter immédiatement. Cela réduit notre signature thermique, mais la capacité de stockage n’est pas illimitée. Le Normandy doit ensuite évacuer cette chaleur.', codex: ['normandy'], catalogId: 'NPC-greg-adams' },
  ] },
  pressly: { speaker: 'Charles Pressly', portrait: 'pressly', topics: [
    { id: 'navigation', label: 'Votre poste à bord', text: 'Je suis le navigateur du Normandy. Le pilote manœuvre le vaisseau ; la navigation prépare et suit les routes. Notre travail reste celui d’un équipage de l’Alliance, même sur un bâtiment issu d’une coopération avec les Turiens.', catalogId: 'NPC-charles-pressly' },
    { id: 'cooperation', label: 'Un vaisseau de coopération', text: 'Le Normandy réunit des technologies humaines et turiennes. Cette coopération demande de travailler avec des méthodes différentes. À mon poste, je dois surtout m’assurer que nous suivions la route prévue et les ordres du commandement.', catalogId: 'NPC-charles-pressly' },
  ] },
  'requisitions-officer': { speaker: 'Officier des réquisitions', portrait: 'requisitions-officer', topics: [
    { id: 'equipment', label: 'Préparer le commando', text: 'Je m’occupe des réquisitions du Normandy. Avant le départ, vérifiez les armes, les armures et les modifications de chaque membre du commando. Le service d’équipement de la soute permet de préparer votre matériel.', catalogId: 'NPC-officier-des-requisitions' },
    { id: 'compatibility', label: 'Armes et modifications', text: 'Les catégories d’armes, les armures et leurs modifications ont des compatibilités précises. Examinez les emplacements et la formation de l’équipier avant de lui attribuer du matériel. Un équipement disponible n’est pas forcément adapté à tous.', catalogId: 'NPC-officier-des-requisitions' },
  ] },
  jenkins: { speaker: 'Richard L. Jenkins', portrait: 'jenkins', gate: 'before-eden', topics: [
    { id: 'deployment', label: 'Le prochain déploiement', text: 'Je suis prêt pour le déploiement, commandant. Servir sur le Normandy est une occasion que je ne veux pas manquer. Sur le terrain, je resterai avec le groupe et suivrai vos ordres.', catalogId: 'NPC-richard-l-jenkins' },
    { id: 'eden-prime', label: 'La colonie d’Eden Prime', text: 'Eden Prime est une colonie humaine importante. La mission nous y conduit pour récupérer une découverte prothéenne. Je suis impatient de voir le terrain, mais je sais que la priorité reste notre objectif.', catalogId: 'NPC-richard-l-jenkins' },
  ] },
  parasini: { speaker: 'Gianna Parasini', portrait: 'parasini', zone: 'noveria', gate: 'after-citadel', topics: [
    { id: 'reception', label: 'L’accueil de Port Hanshan', text: 'Bienvenue à Port Hanshan. Je suis l’assistante de l’administrateur Anoleis. L’administration du port traite les demandes des visiteurs et les autorisations liées à leur déplacement.', catalogId: 'NPC-gianna-parasini' },
    { id: 'companies', label: 'Les activités de Noveria', text: 'Noveria accueille des entreprises qui tiennent à la confidentialité de leurs recherches. Les installations sont privées et les visiteurs doivent respecter les règles d’accès du port. Adressez votre demande à l’administration.', catalogId: 'NPC-gianna-parasini' },
  ] },
  anoleis: { speaker: 'Administrateur Anoleis', portrait: 'anoleis', zone: 'noveria', gate: 'after-citadel', topics: [
    { id: 'administration', label: 'L’administration du port', text: 'J’administre Port Hanshan. Ce port dessert les sociétés installées sur Noveria ; il n’est pas une voie d’accès libre à leurs laboratoires. Les formalités et les autorisations font partie de mes responsabilités.', catalogId: 'NPC-administrator-anoleis' },
    { id: 'access', label: 'Les installations privées', text: 'Les intérêts des entreprises de Noveria sont protégés ici. Une arrivée au port n’accorde pas le droit de circuler dans toutes leurs installations. Toute demande d’accès doit suivre les procédures appropriées.', catalogId: 'NPC-administrator-anoleis' },
  ] },
  lorik: { speaker: 'Lorik Qui’in', portrait: 'lorik', zone: 'noveria', gate: 'after-citadel', topics: [
    { id: 'synthetic-insights', label: 'Synthetic Insights', text: 'Je suis Lorik Qui’in, de Synthetic Insights. Les entreprises de Noveria apprécient la liberté de conduire leurs recherches loin des regards. Cette indépendance ne supprime ni les rivalités ni les difficultés administratives.', catalogId: 'NPC-lorik-qui-in' },
    { id: 'port', label: 'Les affaires à Port Hanshan', text: 'Le port concentre beaucoup d’intérêts : sociétés, personnel, sécurité et administration. Il faut comprendre à qui l’on s’adresse et ce que chacun peut réellement autoriser. Une conversation ne remplace pas une autorisation de circuler.', catalogId: 'NPC-lorik-qui-in' },
  ] },
  lilihierax: { speaker: 'Lilihierax', portrait: 'lilihierax', zone: 'noveria', gate: 'after-citadel', topics: [
    { id: 'garage', label: 'Le garage du port', text: 'Je m’occupe du garage de Port Hanshan. Les véhicules qui quittent le port doivent affronter le froid et les routes de montagne. Avant de prendre la route, mieux vaut s’assurer que la machine et ses systèmes tiennent le coup.', catalogId: 'NPC-lilihierax' },
    { id: 'weather', label: 'Rouler sur Noveria', text: 'La météo est un danger sérieux sur Noveria. La neige et la glace limitent la visibilité et rendent les trajets difficiles. Un véhicule adapté protège l’équipage, mais il ne fait pas disparaître les risques du terrain.', catalogId: 'NPC-lilihierax' },
  ] },
});

const plain = value => !!value && typeof value === 'object' && !Array.isArray(value)
  && [Object.prototype, null].includes(Object.getPrototypeOf(value));

/** Geometry only. Unknown or mismatched body frames fail closed. */
export function normalizeFrontierNPCAtlas(input) {
  try {
    if (!plain(input) || input.version !== 1 || input.mediaId !== 'ME1' || input.periodId !== 'me1'
      || input.file !== 'frontier-npcs.png' || input.alphaCutoff !== 32
      || ![input.width, input.height].every(value => Number.isInteger(value) && value > 0 && value <= 8192)
      || !plain(input.frames) || Object.keys(input.frames).length !== BODY_IDS.length) return null;
    const frames = {};
    for (const id of BODY_IDS) {
      const frame = input.frames[id];
      if (!plain(frame) || frame.id !== id || !Array.isArray(frame.rect) || frame.rect.length !== 4
        || !frame.rect.every(Number.isInteger) || !Array.isArray(frame.pivot) || frame.pivot.length !== 2
        || !frame.pivot.every(Number.isFinite) || !Number.isFinite(frame.height) || frame.height < .5 || frame.height > 5) return null;
      const [x, y, width, height] = frame.rect;
      if (x < 0 || y < 0 || width <= 16 || height <= 16 || x + width > input.width || y + height > input.height
        || frame.pivot[0] < 0 || frame.pivot[0] > width || frame.pivot[1] < 0 || frame.pivot[1] > height) return null;
      frames[id] = { id, rect: [...frame.rect], pivot: [...frame.pivot], height: frame.height };
    }
    const boxes = Object.values(frames).map(frame => frame.rect);
    for (let a = 0; a < boxes.length; a++) for (let b = a + 1; b < boxes.length; b++) {
      const [x, y, w, h] = boxes[a], [xx, yy, ww, hh] = boxes[b];
      if (x < xx + ww && xx < x + w && y < yy + hh && yy < y + h) return null;
    }
    return freeze({ version: 1, mediaId: 'ME1', periodId: 'me1', status: 'Prototype', file: 'frontier-npcs.png',
      width: input.width, height: input.height, alphaCutoff: 32, frames });
  } catch { return null; }
}

export function getFrontierNPCFrame(key, atlas) {
  if (typeof key !== 'string' || !BODY_IDS.includes(key)) return null;
  const config = normalizeFrontierNPCAtlas(atlas);
  return config?.frames[key] || null;
}
