// Horizon tracking starts from the published Frontier delivery. Scope is filled
// only after the feature owners agree the actual records and their evidence.
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
export const BASE_COMMIT = '2ab3f7c10d3bdd9ca04b7a962df9447aee2b3e75';
export const GLOBAL_PROOF = 'docs/qa/horizon-report.json';
export const sha = bytes => createHash('sha256').update(bytes).digest('hex');
export const FIELD_COLUMNS = Object.freeze({status:'C',assetStatus:'D',description:'H',assetPath:'L',gameKey:'M',notes:'Q'});
export const NPCS = Object.freeze([
  ['NPC-fai-dan','fai-dan','feros'],['NPC-arcelia-silva-martinez','arcelia','feros'],
  ['NPC-macha-doyle','macha','feros'],['NPC-davin-reynolds','davin','feros'],
  ['NPC-executor-pallin','pallin','citadel'],['NPC-harkin','harkin','citadel'],
  ['NPC-barla-von','barla-von','citadel'],['NPC-dr-chloe-michel','michel','citadel'],
]);
export const ENEMIES = Object.freeze([
  ['drone-lance-roquettes','rocket-drone'],['sapeur-geth','sapper'],['armature-geth','armature'],
  ['colosse-geth','colossus'],['maitre-de-guerre-krogan','battlemaster'],
]);
export const FAUNA_IDS = Object.freeze(['ENM-varren','SPR-varren-ennemi','LOR-varrens','SIDE-feros-varrens']);
export const WORLDS = Object.freeze(['WRL-feros','WRL-ilos']);
export const NOTE_ONLY_IDS = Object.freeze(['SIDE-feros-cellules-energetiques']);
export const FLEET = Object.freeze([['SPR-VEH-normandy-sr-1','normandy-sr1'],['SPR-VEH-sovereign','sovereign']]);
export const IDS = Object.freeze([...NPCS.map(([id])=>id),...ENEMIES.map(([slug])=>`ENM-${slug}`),
  ...ENEMIES.map(([slug])=>`SPR-${slug}-ennemi`),...FAUNA_IDS,...NOTE_ONLY_IDS,...WORLDS,'SYS-transitions-de-camera',...FLEET.map(([id])=>id)]);
export const NEW_IDS = Object.freeze(['SPR-VEH-destiny-ascension','SPR-VEH-transport-geth','SPR-faune-gasbag-eden-prime']);

const partial = 'Prototype partiel ; apparence et comportement originaux 1:1 restent à vérifier.';
export function replacements(entry) {
  const id=entry.id, promoted=entry.status==='Défini'?{status:'Prototype'}:{};
  const asset=entry.assetStatus!=='Prototype'?{assetStatus:'Prototype'}:{};
  const npc=NPCS.find(([key])=>key===id);
  if(npc){
    const[,key,zone]=npc;
    const limit=key==='macha'?'Informations et raccord au contact d’eau ; le dialogue intégral et ses variantes restent à réaliser.'
      :key==='davin'?'Informations et contact de la nouvelle opération varrens ; récompense unique liée à cette opération condensée.'
      :key==='fai-dan'?'Présence limitée à la colonie avant le Thorien ; les variantes complètes du destin de Fai Dan restent ouvertes.'
      :key==='harkin'?'Échange d’information ; enquête originale sur Garrus et embranchements complets non reconstitués.'
      :key==='michel'?'Échange d’information à la clinique ; aucun nouveau service marchand ou résolution de chantage.'
      :key==='pallin'?'Information sur le SSC ; protocole et uniforme originaux à comparer aux références.'
      :key==='barla-von'?'Information au Présidium ; aucune quête ou récompense créée par la conversation.'
      :'Deux sujets réécrits ; réactions complètes aux issues de la colonie non reconstituées.';
    return {...promoted,...asset,assetPath:'public/assets/horizon-npcs.png',gameKey:`horizon-npc:${key}`,
      notes:`ME1, ${zone==='feros'?'Zhu’s Hope avant la fin du Thorien':'Citadelle après Eden Prime'}. ${limit} ${partial}`};
  }
  const enemy=ENEMIES.find(([slug])=>id===`ENM-${slug}`||id===`SPR-${slug}-ennemi`);
  if(enemy){
    const[,key]=enemy;
    const limit=key==='rocket-drone'?'Tir ATB générique ; projectile explosif annoncé et évitable non réalisé.'
      :key==='sapper'?'Sabotage adapté aux commandes ATB existantes ; kit et valeurs originaux incomplets.'
      :key==='armature'?'Corps quadrupède et tir ATB ; locomotion originale, charge et arc de tir géométrique non réalisés.'
      :key==='colossus'?'Grand corps quadrupède ; combat ATB à pied, sans canon original ou combat de Mako.'
      :'Identité du maître de guerre à Thérum ; budget et ordres du krogan remplacé conservés, aucune phase supplémentaire.';
    return {...promoted,...asset,assetPath:'public/assets/horizon-enemies.png',gameKey:`enemy:${key}`,
      notes:`ME1, formations de campagne limitées. Un corps fixe distinct par type, sans planche de quatre poses. ${limit} ${partial}`};
  }
  if(FAUNA_IDS.includes(id))return {...promoted,...asset,
    assetPath:id==='SIDE-feros-varrens'?'src/operation-data.js':'public/assets/horizon-fauna.png',
    gameKey:id==='SIDE-feros-varrens'?'operation:feros-varrens':'fauna:varren-me1',
    notes:id==='SIDE-feros-varrens'?'ME1, Féros : opération condensée de Davin avec deux varrens et un alpha distinct, compteur de trois et retour au contact. Récompense unique et reprise sauvegardée. Le guide ne confirme pas cet effectif exact ; déroulement et dialogues originaux restent partiels.'
      :'ME1, Féros : corps fixes séparés du varren et de son alpha dans une rencontre adaptée de trois animaux. Morsure organique ATB sans arme humaine ; course, locomotion de meute, valeurs et apparence originales restent à reconstituer.'};
  if(id==='SIDE-feros-cellules-energetiques')return {notes:'Déplacements et dialogues condensés ; récupération sur l’épave et retour à May jouables. Intérieurs et variantes de ME1 restent à reconstituer. La quête de viande de Davin possède désormais une opération distincte, avec meute, alpha et compteur adaptés ; sa victoire ne valide pas les cellules. Preuve historique conservée : tests/operations.test.js.'};
  if(WORLDS.includes(id))return {notes:`ME1 : carte ${id==='WRL-feros'?'de Féros':'d’Ilos'} agrandie en cinq secteurs et trois chemins, avec les sept repères principaux et trois arènes conservés. Contacts annexes replacés sans réécriture des étapes antérieures. Géographie, proportions, verticalité et intérieurs originaux restent partiels.`};
  if(id==='SYS-transitions-de-camera')return {
    description:'Caméra orthographique suivant les plans étendus d’Eden Prime, Thérum, Novéria, Virmire, Féros et Ilos, avec cadrages locaux de combat.',
    notes:'Six parcours étendus partagent les données de sol, navigation, carte/radar et limites de caméra. Les anciens points de sauvegarde sont repris sur un sol libre. Les cadrages, proportions et géographies originaux 1:1 ne sont pas certifiés.'};
  const fleet=FLEET.find(([key])=>key===id);
  if(fleet)return {assetPath:'public/assets/horizon-fleet-me1.png',gameKey:`fleet:${fleet[1]}`,
    notes:`ME1 : nouvelle illustration extérieure fixe ${fleet[1]==='sovereign'?'de Sovereign, identification conditionnée aux révélations':'du Normandy SR-1, distinct du SR-2'}. Projection locale de reconnaissance avec socle et dossier contextuel ; aucune coque physique miniaturisée ni conduite. ${fleet[1]==='sovereign'?'La silhouette distante historique de Sovereign reste distincte. ':''}Détails, proportions et vol originaux restent à vérifier.`};
  throw Error(`Unscoped Horizon record: ${id}`);
}

export function additions(id) {
  const common=['docs/qa/horizon-workbook-visual-report.json',GLOBAL_PROOF];
  if(NOTE_ONLY_IDS.includes(id))return {};
  if(NPCS.some(([key])=>key===id))return {implementationPaths:['src/horizon-characters.js','src/story-data.js','src/story.js','src/world.js'],
    evidence:['tests/horizon-characters.test.js','docs/research/horizon-characters.md','docs/qa/horizon-characters-art.json',...common]};
  if(ENEMIES.some(([slug])=>id===`ENM-${slug}`||id===`SPR-${slug}-ennemi`))return {
    implementationPaths:['src/horizon-enemies.js','src/game-data.js','src/world.js','public/assets/horizon-enemies.json'],
    evidence:['tests/horizon-enemies.test.js','docs/research/horizon-enemies.md','docs/qa/horizon-enemies-art.json',...common]};
  if(FAUNA_IDS.includes(id))return {implementationPaths:['src/horizon-fauna.js','src/operation-data.js','src/operations.js','src/world.js'],
    evidence:['tests/horizon-fauna.test.js','docs/research/horizon-fauna.md','docs/qa/horizon-fauna-art.json',...common]};
  if(WORLDS.includes(id)||id==='SYS-transitions-de-camera')return {implementationPaths:['src/horizon-layout-data.js','src/horizon-scene.js','src/level-layout-data.js','src/world-data.js','src/world.js'],
    evidence:['tests/horizon-levels.test.js',...common]};
  if(FLEET.some(([key])=>key===id))return {implementationPaths:['src/horizon-fleet.js','src/world.js','src/main.js'],
    evidence:['tests/horizon-fleet.test.js','docs/research/horizon-fleet.md',...common]};
  throw Error(`Unscoped Horizon metadata: ${id}`);
}

export function newRecords(catalogue) {
  const source=id=>catalogue.sources.find(item=>item.id===id);
  const entry=(id,name,key,assetPath,description,acceptance,reference,dependencies,sourceId)=>({
    id,category:'sprites',name,episode:'ME1',scope:'Prototype visuel ME1',canonLevel:'Référence à vérifier',
    status:'Prototype',assetStatus:'Prototype',reference,sourceId,sourceUrl:source(sourceId).url,description,acceptance,dependencies,priority:'P1',
    plannedPath:`assets/sprites/horizon/${key.replaceAll(':','-')}.png`,assetPath,gameKey:key,
    notes:assetPath.endsWith('horizon-fauna.png')?'Dessin généré natif et présence passive contextualisée à Eden Prime. Appellation, morphologie complète et cycle original restent à vérifier ; aucune fidélité 1:1 validée.':'Dessin généré natif, présenté en projection de reconnaissance et dossier contextuel. Coque physique, échelle astronomique, directions et cycles originaux restent à vérifier ; aucune fidélité 1:1 validée.',
    deliveryVersion:'0.3.0-horizon',implementationPaths:['src/world.js',assetPath.endsWith('horizon-fauna.png')?'src/horizon-fauna.js':'src/horizon-fleet.js'],
    evidence:[GLOBAL_PROOF,'docs/qa/horizon-workbook-visual-report.json',assetPath.endsWith('horizon-fauna.png')?'docs/research/horizon-fauna.md':'docs/research/horizon-fleet.md']});
  return [
    entry(NEW_IDS[0],'Destiny Ascension — silhouette extérieure','fleet:destiny-ascension','public/assets/horizon-fleet-me1.png',
      'Illustration extérieure fixe du vaisseau asari associé à la Citadelle, avec contexte ME1 explicite.',
      'Silhouette, appendices, proportions et marquages recoupés sur références ME1 ; cadrage propre à échelle en jeu, aucun pilotage déduit du dessin.',
      'Identité et période ME1 à recouper ; la page générale Legendary Edition ne certifie pas les détails de coque de cette illustration.', ['WRL-citadelle'],'EA-TRILOGY'),
    entry(NEW_IDS[1],'Transport geth — silhouette extérieure','fleet:geth-dropship','public/assets/horizon-fleet-me1.png',
      'Illustration fixe d’un transport geth de ME1, distinct des armatures et des appareils des épisodes ultérieurs.',
      'Modèle, appendices et proportions du transport ME1 recoupés ; placement et cadrage contrôlés, sans acquisition d’un véhicule jouable.',
      'Existence et modèle ME1 à recouper ; le guide de prologue constitue une référence générale, pas un relevé complet de la coque.', ['WRL-eden-prime'],'PRIMA-PROLOGUE'),
    entry(NEW_IDS[2],'Gasbag d’Eden Prime — corps de faune','fauna:gasbag-me1','public/assets/horizon-fauna.png',
      'Corps fixe d’une créature passive d’Eden Prime, avec présentation en sustentation adaptée au renderer.',
      'Morphologie et couleur recoupées dans la scène ME1 ; présence limitée à Eden Prime, absence d’hostilité et de récompense de combat, transparence et échelle contrôlées.',
      'Prima officiel : PDF page9/guide page65, objectif2 et créature docile visible au nord du débarquement. Le nom Gasbag n’est pas écrit à cette page ; morphologie complète et appellation restent à recouper.', ['WRL-eden-prime'],'PRIMA-PROLOGUE'),
  ];
}

export async function synchronizeCoverage(root,catalogue,manifest) {
  const before=structuredClone(catalogue.meta.prototypeCoverage),after=structuredClone(before);
  const previous=new Map(before.atlases.map(item=>[item.path,item]));
  const pngs=(await fs.readdir(path.join(root,'public/assets'))).filter(name=>name.endsWith('.png')).sort().map(name=>`public/assets/${name}`);
  after.atlases=pngs.map(name=>previous.get(name)||{path:name,scope:manifest.assets.find(item=>`public/assets/${item.file}`===name)?.usage});
  if(after.atlases.some(item=>!item.scope))throw Error('Missing scoped PNG usage.');
  const operationData=await import(pathToFileURL(path.join(root,'src/operation-data.js')).href);
  const storyData=await import(pathToFileURL(path.join(root,'src/story-data.js')).href);
  after.conversationPointCount=Object.keys(storyData.STORY_CONVERSATIONS).length;
  after.conversationTopicCount=Object.values(storyData.STORY_CONVERSATIONS).reduce((sum,entry)=>sum+entry.topics.length,0);
  after.operationCount=operationData.OPERATIONS.length;
  after.operationStepCount=operationData.OPERATIONS.reduce((sum,entry)=>sum+entry.steps.length,0);
  after.operationEncounterCount=Object.keys(operationData.OPERATION_ENCOUNTERS).length;
  after.assignmentCount=before.historicalAssignmentCount+after.operationCount;
  after.nativePNGCount=pngs.length;
  after.horizonNPCBodyCount=8;after.horizonEnemyBodyCount=5;after.horizonFleetDrawingCount=8;after.horizonFaunaDrawingCount=8;
  after.horizonWorldFaunaBodyCount=3;after.horizonDocumentaryFaunaBodyCount=5;
  after.assignmentLimit='Trois assignations historiques et douze opérations supplémentaires, dont la mission varrens condensée de Davin à Féros. Rencontres, compteurs et récompenses uniques adaptés au prototype ; variantes, dialogues et effectifs originaux complets restent à vérifier.';
  after.visualLimit='84 poses de combat fixes conservées. Horizon ajoute 29 dessins fixes : huit PNJ, cinq types ennemis, huit coques et huit corps de faune. Les deux varrens et le Gasbag sont présents en ME1 ; cinq autres corps sont documentaires contextuels. Apparences, costumes, proportions et cycles originaux non certifiés 1:1.';
  after.animationLimit='32 images de marche, 84 poses de combat fixes, quatre vues Mako et deux dessins Joker conservés. Les 29 dessins Horizon sont des corps et illustrations fixes, avec présentation procédurale limitée ; aucun nouveau cycle complet ni kit de vol livré.';
  after.coverageLimit='Neuf zones condensées conservées. Eden Prime, Thérum, Novéria, Virmire, Féros et Ilos possèdent des plans étendus à cinq secteurs ; ils ne terminent pas les 100 sous-zones et 91 liaisons canoniques. Intérieurs, verticalité, proportions et campagnes des autres médias restent à reconstituer.';
  after.vehicleLimit='Mako transitoire pilotable sur Thérum seulement, sans armes ni physique originale complète. Huit nouvelles coques sont illustrées avec portes ME1/ME2/ME3/Andromeda ; les vues ME1 autorisées sont des projections locales de reconnaissance avec socle, et les autres restent documentaires. Aucun nouveau pilotage spatial ou conduite de coque.';
  const changes=[...new Set([...Object.keys(before),...Object.keys(after)])].filter(key=>JSON.stringify(before[key])!==JSON.stringify(after[key])).map(key=>({path:`meta.prototypeCoverage.${key}`,before:before[key]??null,after:after[key]}));
  catalogue.meta.prototypeCoverage=after;return {before,after,changes};
}
