// ME1 information conversations. These are French adaptations, not quotations.
// Narrative presence is independent of historical heard-topic save validation.
const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
const freeze = value => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze); Object.freeze(value);
  }
  return value;
};
const body = id => ({ atlas:'horizon-npcs', file:'horizon-npcs.png', metadata:'horizon-npcs.json', frame:id });
const npc = (id, catalogId, name, zone, sectorAnchor, operationId = null) => ({
  id, catalogId, name, zone, sectorAnchor, conversationId:id, characterKey:id,
  gate:zone === 'feros' ? 'feros-before-boss' : 'after-eden',
  ...(operationId ? { operationId } : {}), visual:body(id),
});
export const HORIZON_NPCS = freeze([
  npc('fai-dan','NPC-fai-dan','Fai Dan','feros','colony','feros-geth-tunnels'),
  npc('arcelia','NPC-arcelia-silva-martinez','Arcelia Silva Martinez','feros','colony'),
  npc('macha','NPC-macha-doyle','Macha Doyle','feros','colony','feros-water'),
  npc('davin','NPC-davin-reynolds','Davin Reynolds','feros','colony','feros-varrens'),
  npc('pallin','NPC-executor-pallin','Exécuteur Pallin','citadel','csec'),
  npc('harkin','NPC-harkin','Harkin','citadel','bar'),
  npc('barla-von','NPC-barla-von','Barla Von','citadel','presidium'),
  npc('michel','NPC-dr-chloe-michel','Dr Chloé Michel','citadel','clinic','citadel-doctor-michel'),
]);
const BY_ID = Object.fromEntries(HORIZON_NPCS.map(entry => [entry.id, entry]));
const BODY_IDS = HORIZON_NPCS.map(entry => entry.id);
export function getHorizonNPC(id) {
  return typeof id === 'string' && own(BY_ID,id) ? BY_ID[id] : null;
}
const includes = (value, key) => Array.isArray(value) && value.includes(key);
/** Missing legacy media fields mean the existing ME1 campaign; explicit foreign scope closes access. */
export function horizonNPCVisible(context, npcOrId) {
  const entry = getHorizonNPC(typeof npcOrId === 'string' ? npcOrId : npcOrId?.id);
  if (!context || !entry || context.zone !== undefined && context.zone !== entry.zone
    || context.mediaId !== undefined && context.mediaId !== 'ME1'
    || context.periodId !== undefined && context.periodId !== 'me1'
    || context.context?.mediaId !== undefined && context.context.mediaId !== 'ME1'
    || context.context?.periodId !== undefined && context.context.periodId !== 'me1') return false;
  if (entry.zone === 'feros') return includes(context.completed,'citadel')
    && context.flags?.spectre === true && !includes(context.cleared,'feros:boss')
    && !includes(context.completed,'feros');
  return includes(context.completed,'eden-prime');
}
const conversation = (id, topics) => {
  const entry = BY_ID[id];
  return { speaker:entry.name, portrait:id, zone:entry.zone,
    // Do not use the temporary presence gate here: heard history remains legal
    // after Fai Dan's death or a later colony outcome.
    gate:entry.zone === 'feros' ? 'after-citadel' : 'after-eden',
    topics:topics.map(topic => ({ ...topic, catalogId:entry.catalogId })) };
};
export const HORIZON_STORY_CONVERSATIONS = freeze({
  'fai-dan': conversation('fai-dan',[
    { id:'colony', label:'L’organisation de Zhu’s Hope', text:'Je représente les habitants de Zhu’s Hope. Nous avons installé notre colonie dans des ruines bien plus anciennes que nous. Entre les besoins quotidiens et les attaques geth, nous devons concentrer nos efforts sur ce qui permet aux habitants de tenir.' },
    { id:'defences', label:'La sécurité de la colonie', text:'Nos abris ne constituent pas une forteresse. Les tunnels et les accès voisins font partie des endroits à surveiller. Pour une colonie isolée, protéger l’eau, les réserves et les communications compte autant que défendre la place centrale.' },
  ]),
  arcelia: conversation('arcelia',[
    { id:'settlement', label:'Vivre dans les ruines', text:'Les structures autour de nous n’ont pas été conçues pour une colonie humaine. Nous réutilisons ce qui peut l’être, nous entretenons nos installations et nous apprenons à vivre avec les limites de ces lieux. Zhu’s Hope est le foyer que nous essayons de construire ici.' },
    { id:'people', label:'Les habitants de Zhu’s Hope', text:'Nous ne sommes pas une garnison. Derrière les installations, il y a des personnes qui travaillent, partagent les ressources et comptent les unes sur les autres. Quand le danger arrive, ce sont ces vies qu’il faut garder à l’esprit.' },
  ]),
  macha: conversation('macha',[
    { id:'water', label:'L’alimentation en eau', text:'Je m’occupe de l’alimentation en eau de la colonie. Les conduites inférieures, les vannes et les réserves doivent fonctionner ensemble. Même une installation encore solide ne sert à rien si l’eau ne peut pas atteindre les habitants.' },
    { id:'pressure', label:'La surveillance des conduites', text:'Je peux surveiller le débit et la pression depuis les installations de la colonie. Une intervention sur une conduite doit tenir compte du reste du réseau. L’entretien ne s’arrête pas lorsque l’eau revient : il faut aussi éviter la panne suivante.' },
  ]),
  davin: conversation('davin',[
    { id:'supplies', label:'Le ravitaillement', text:'Je m’occupe du ravitaillement. Sur une colonie comme Zhu’s Hope, les réserves et l’accès à la nourriture demandent une attention constante. Nous ne pouvons pas compter sur une livraison immédiate dès qu’un problème survient.' },
    { id:'varrens', label:'Les varrens près de la colonie', text:'Les varrens sont des prédateurs. Dans les tunnels sous la colonie, ils peuvent menacer les habitants et l’accès aux réserves. Pour le ravitaillement, il faut pouvoir compter sur des passages sûrs et ne pas approcher ces bêtes sans précaution.' },
  ]),
  pallin: conversation('pallin',[
    { id:'csec', label:'Le Service de sécurité de la Citadelle', text:'Le SSC assure la sécurité de la station. Il réunit des agents de plusieurs espèces et doit intervenir dans une cité où se croisent habitants, visiteurs et représentants diplomatiques. Nos décisions doivent s’inscrire dans un cadre légal.' },
    { id:'jurisdiction', label:'Le SSC et les Spectres', text:'Les Spectres relèvent directement du Conseil. Cette autorité particulière ne rend pas le travail du SSC moins nécessaire : nous devons protéger la population, suivre nos enquêtes et répondre de nos actes selon les règles de la station.' },
  ]),
  harkin: conversation('harkin',[
    { id:'former-officer', label:'Votre ancien poste au SSC', text:'J’ai travaillé pour le SSC. J’en connais les bureaux, les habitudes et les gens qui passent leurs journées à courir après les rapports. Ici, à Chora’s Den, les conversations suivent d’autres règles que dans un poste de sécurité.' },
    { id:'garrus', label:'La piste de Garrus', text:'Garrus menait sa propre enquête sur Saren. La clinique des Secteurs fait partie des endroits liés à cette piste. Si vous cherchez à comprendre ses démarches, ce côté de la station mérite votre attention.' },
  ]),
  'barla-von': conversation('barla-von',[
    { id:'finance', label:'Votre activité au Présidium', text:'Je suis conseiller financier. Le Présidium accueille des intérêts commerciaux et diplomatiques considérables ; comprendre une transaction demande souvent d’en connaître le contexte. Mes clients comptent sur la précision et la discrétion de mon travail.' },
    { id:'trade', label:'Les Volus et le commerce', text:'Les Volus ont une longue expérience des échanges et des structures financières. Une économie qui réunit plusieurs espèces exige des accords, des règles et des intermédiaires capables de les comprendre. Sur la Citadelle, ces relations se rencontrent chaque jour.' },
  ]),
  michel: conversation('michel',[
    { id:'clinic', label:'La clinique des Secteurs', text:'Je dirige cette clinique. Les habitants des Secteurs et les personnes qui traversent le quartier ont besoin de soins, quelles que soient les difficultés autour de nous. Garder du matériel et du personnel disponibles fait partie de mon travail quotidien.' },
    { id:'care', label:'Le matériel médical', text:'Le médi-gel est utile pour stabiliser et traiter les blessures, mais les soins ne se limitent pas à une réserve de produit. Il faut aussi examiner les patients, préparer le matériel et s’assurer que les fournitures restent disponibles pour ceux qui en ont besoin.' },
  ]),
});

const plain = value => !!value && typeof value === 'object' && !Array.isArray(value)
  && [Object.prototype,null].includes(Object.getPrototypeOf(value));
/** Copy only the measured geometry of the eight explicitly registered ME1 bodies. */
export function normalizeHorizonNPCAtlas(input) {
  try {
    if (!plain(input) || input.version !== 1 || input.mediaId !== 'ME1' || input.periodId !== 'me1'
      || input.file !== 'horizon-npcs.png' || input.alphaCutoff !== 32
      || ![input.width,input.height].every(value => Number.isInteger(value) && value > 0 && value <= 8192)
      || !plain(input.frames) || Object.keys(input.frames).length !== BODY_IDS.length) return null;
    const frames = {};
    for (const id of BODY_IDS) {
      const frame = input.frames[id];
      if (!plain(frame) || frame.id !== id || !Array.isArray(frame.rect) || frame.rect.length !== 4
        || !frame.rect.every(Number.isInteger) || !Array.isArray(frame.pivot) || frame.pivot.length !== 2
        || !frame.pivot.every(Number.isFinite) || !Number.isFinite(frame.height) || frame.height < .5 || frame.height > 5) return null;
      const [x,y,width,height] = frame.rect;
      if (x < 0 || y < 0 || width <= 16 || height <= 16 || x+width > input.width || y+height > input.height
        || frame.pivot[0] < 0 || frame.pivot[0] > width || frame.pivot[1] < 0 || frame.pivot[1] > height) return null;
      frames[id] = { id, rect:[...frame.rect], pivot:[...frame.pivot], height:frame.height };
    }
    const boxes = Object.values(frames).map(frame => frame.rect);
    for(let a=0;a<boxes.length;a++)for(let b=a+1;b<boxes.length;b++){
      const[x,y,w,h]=boxes[a],[xx,yy,ww,hh]=boxes[b];
      if(x<xx+ww&&xx<x+w&&y<yy+hh&&yy<y+h)return null;
    }
    return freeze({version:1,mediaId:'ME1',periodId:'me1',status:'Prototype',file:'horizon-npcs.png',width:input.width,height:input.height,alphaCutoff:32,frames});
  } catch { return null; }
}
export function getHorizonNPCFrame(key,atlas) {
  if(typeof key!=='string'||!BODY_IDS.includes(key))return null;
  return normalizeHorizonNPCAtlas(atlas)?.frames[key]||null;
}
