import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { GEAR_CATALOG, WEAPON_LABELS, ARMOR_LABELS, SLOT_LABELS, INVENTORY_CAPACITY, ITEM_CAPACITY } from '../src/loadout.js';
import { OPERATIONS, OPERATION_ENCOUNTERS } from '../src/operation-data.js';

// A reproducible content enrichment, not a spreadsheet authoring engine.
// Existing IDs and the latest 27daea0 delivery are retained. Run the workbook
// builder separately with the Codex primary runtime after this script.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalogPath = path.join(root, 'docs/content-catalog.json');
const catalog = JSON.parse(await fs.readFile(catalogPath, 'utf8'));
const baselineIndex = process.argv.indexOf('--baseline');
const baseline = JSON.parse(baselineIndex >= 0
  ? await fs.readFile(process.argv[baselineIndex + 1], 'utf8')
  : execFileSync('git', ['show', '27daea0b577650589cef46e896eae79fc9ff4f37:docs/content-catalog.json'], { cwd: root, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 }));
const animation = JSON.parse(await fs.readFile(path.join(root, 'public/assets/shepard-female-animation.json'), 'utf8'));
const byId = new Map(catalog.entries.map(entry => [entry.id, entry]));
const version = '0.2.0';
const operationIds = {
  'citadel-consort': 'SIDE-citadelle-la-consort',
  'citadel-xeltan': 'SIDE-citadelle-plainte-de-xeltan',
  'citadel-reporters-request': 'SIDE-citadelle-demande-d-emily-wong',
  'citadel-keepers': 'SIDE-citadelle-les-veilleurs',
  'citadel-signal-tracking': 'SIDE-citadelle-signal-suspect',
  'citadel-presidium-prophet': 'SIDE-citadelle-predicateur-du-presidium',
  'citadel-doctor-michel': 'SIDE-citadelle-docteur-michel',
  'feros-water': 'SIDE-feros-retablissement-de-l-eau',
  'feros-power': 'SIDE-feros-cellules-energetiques',
  'feros-geth-tunnels': 'SIDE-feros-geth-dans-les-tunnels',
  'feros-data-recovery': 'SIDE-feros-recuperation-des-donnees',
};
const sourceByUrl = new Map(catalog.sources.filter(source => source.url).map(source => [source.url, source.id]));
function source(id, title, url, scope) {
  if (sourceByUrl.has(url)) return sourceByUrl.get(url);
  catalog.sources.push({ id, title, url, scope });
  sourceByUrl.set(url, id);
  return id;
}
function entry(values) {
  const sourceRecord = catalog.sources.find(source => source.id === values.sourceId);
  return {
    id: values.id, category: values.category, name: values.name, episode: 'ME1', scope: 'Production ME1',
    canonLevel: 'Adaptation', status: 'Prototype', assetStatus: 'À produire',
    reference: 'Objectifs et noms ME1 référencés ; chiffres, découpage et interface propres à cette adaptation ATB.',
    sourceId: values.sourceId || 'PROJECT', sourceUrl: sourceRecord?.url ?? null,
    description: '', acceptance: '', dependencies: [], priority: 'P1', plannedPath: values.assetPath,
    assetPath: null, gameKey: null, notes: '', deliveryVersion: version, ...values,
  };
}
function put(record) {
  if (byId.has(record.id)) Object.assign(byId.get(record.id), record);
  else { catalog.entries.push(record); byId.set(record.id, record); }
}
function enrich(id, values) {
  if (!byId.has(id)) throw new Error(`Missing existing record ${id}`);
  const before = byId.get(id);
  if (['Intégré', 'Validé'].includes(before.status)) throw new Error(`Protected status on ${id}`);
  Object.assign(before, { deliveryVersion: version, ...values });
}
const units = { xp: 'XP', credits: 'crédits', paragon: 'Conciliation', renegade: 'Pragmatisme', medigel: 'médi-gel' };
const rewardText = value => Object.entries(value || {}).map(([key, amount]) => `${amount} ${units[key] || key}`).join(', ') || 'aucune';
const gate = operation => [
  operation.zone === 'citadel' ? 'Après Eden Prime.' : 'Après le statut Spectre et le premier combat de Féros.',
  operation.requires === 'tali' ? 'Tali recrutée.' : '',
  operation.prerequisite ? `Après ${operation.prerequisite.operationId}, étape ${operation.prerequisite.stage}.` : '',
  operation.deadline === 'thorian' ? 'Rapport à terminer avant le Thorien.' : '',
  operation.deadline === 'data-before-thorian' ? 'Copie des données avant le Thorien ; remise ultérieure possible.' : '',
  'Fermeture au passage du Conduit.',
].filter(Boolean).join(' ');

for (const operation of OPERATIONS) {
  const id = operationIds[operation.id];
  const sourceId = source(`ME1-OP-${operation.id.toUpperCase()}`, operation.name, operation.sourceUrls[0], 'Source communautaire descriptive consultée pour les objectifs. Dialogues, coordonnées et récompenses ATB adaptés.');
  const values = entry({
    id, category: 'side_quests', name: operation.name, sourceId, assetStatus: 'Prototype',
    description: `${operation.description} ${operation.steps.length} étapes guidées. Récompense finale unique : ${rewardText(operation.reward)}.`,
    acceptance: `Parcourir les ${operation.steps.length} étapes sans saut ni double récompense. ${gate(operation)} Le journal, les interactions et la sauvegarde doivent afficher la même progression. Comparer les variantes manquantes au jeu avant validation finale.`,
    dependencies: operation.prerequisite ? [operationIds[operation.prerequisite.operationId]] : [],
    assetPath: 'src/operation-data.js', gameKey: `OPERATIONS.${operation.id}`,
    notes: `${operation.adaptationNote} Preuve : tests/operations.test.js.`,
    implementationPaths: ['src/operation-data.js', 'src/operations.js', 'src/main.js'],
    evidence: ['tests/operations.test.js', 'docs/research/operations-sources.md'], recordType: 'operation',
  });
  if (byId.has(id)) enrich(id, values); else put(values);
  for (const [index, step] of operation.steps.entries()) {
    const alternatives = step.choices.map(choice => `${choice.id} : ${choice.label}${choice.cost ? ` (${choice.cost} crédits)` : ''}${choice.requires ? ` [${rewardText(choice.requires)} requis]` : ''}${choice.combat ? ` [combat ${choice.combat}]` : ''}`).join(' / ');
    put(entry({
      id: `OPSTEP-${operation.id}-${step.id}`, category: 'side_quests', name: `${operation.name} — ${index + 1}. ${step.speaker}`, sourceId,
      description: `Étape ${index + 1}/${operation.steps.length}, ${step.zone}. ${step.text}`,
      acceptance: `Afficher seulement à l’étape ${index + 1}. Refuser les réponses verrouillées, sauvegarder le choix et ne progresser qu’une fois.${step.requires === 'tali' ? ' La copie attend le recrutement de Tali.' : ''}${step.choices.some(choice => choice.combat) ? ' La branche de combat exige une victoire ATB réelle ; rechargement et défaite restent rejouables.' : ''}`,
      dependencies: [id, ...(index ? [`OPSTEP-${operation.id}-${operation.steps[index - 1].id}`] : [])],
      assetPath: 'src/operation-data.js', gameKey: `${operation.id}.${step.id}`,
      notes: `Réponses : ${alternatives}. Position proposée x=${step.x}, z=${step.z} ; déplacée à proximité par le moteur si obstacle. Dialogues réécrits.`,
      implementationPaths: ['src/operation-data.js', 'src/operations.js', 'src/world.js'], evidence: ['tests/operations.test.js'],
      recordType: 'operation-step', operationId: operation.id, stepId: step.id,
    }));
  }
}
for (const [id, encounter] of Object.entries(OPERATION_ENCOUNTERS)) {
  const operation = OPERATIONS.find(operation => operation.steps.some(step => step.choices.some(choice => choice.combat === id)));
  const step = operation.steps.find(step => step.choices.some(choice => choice.combat === id));
  put(entry({
    id: `OPENCOUNTER-${id}`, category: 'enemies', name: `${encounter.name} — rencontre annexe`, sourceId: sourceByUrl.get(operation.sourceUrls[0]),
    description: `Rencontre ATB de ${operation.name}. Composition : ${encounter.enemies.join(', ')}. Les statistiques utilisent les archétypes existants du moteur.`,
    acceptance: 'Armer la rencontre depuis le dialogue ; refuser le gain avant la victoire du groupe. Défaite et rechargement permettent une nouvelle tentative. La récompense de mission ne doit pas être versée à chaque reprise de combat.',
    dependencies: [`OPSTEP-${operation.id}-${step.id}`], assetPath: 'src/operation-data.js', gameKey: `OPERATION_ENCOUNTERS.${id}`,
    notes: 'Rencontre adaptée, sans nouvelle espèce ni nouveau boss. Réutilise les poses ennemies du prototype ; statistiques et déroulement originaux non reproduits.',
    implementationPaths: ['src/main.js', 'src/operations.js', 'src/combat.js'], evidence: ['tests/operations.test.js'], recordType: 'operation-encounter',
  }));
}

const bonusLabels = { hp: 'santé', shield: 'bouclier', attack: 'puissance', defense: 'défense', speed: 'vitesse', weaponHeatMultiplier: 'multiplicateur de chaleur', weaponCoolingBonus: 'refroidissement par seconde', syntheticDamageBonus: 'bonus contre synthétiques', organicDamageBonus: 'bonus contre organiques', shieldBypass: 'part contournant le bouclier', controlResistance: 'résistance aux contrôles' };
const bonusText = bonuses => Object.entries(bonuses).map(([key, amount]) => `${bonusLabels[key] || key}=${amount}`).join(', ') || 'aucun bonus supplémentaire';
for (const item of GEAR_CATALOG) {
  const category = item.kind === 'weapon' ? 'weapons' : 'equipment';
  const sourceId = source(`ME1-GEAR-${item.sourceUrl.split('/').pop().replaceAll(/[^a-z0-9]/gi, '-').toUpperCase()}`, `ME1 — ${item.sourceUrl.split('/').pop().replaceAll('_', ' ')}`, item.sourceUrl, 'Source communautaire sur noms, fabricants et familles. Valeurs de combat et économie du prototype, sans équivalence statistique 1:1.');
  put(entry({
    id: `GEAR-${item.id}`, category, name: item.name, sourceId,
    description: `${SLOT_LABELS[item.slot]}${item.weaponType ? `, ${WEAPON_LABELS[item.weaponType]}` : ''}${item.armorWeight ? `, ${ARMOR_LABELS[item.armorWeight]} (${item.armorSpecies})` : ''}. ${item.manufacturer}. Niveau ${item.level}${item.spectre ? ' et accréditation Spectre' : ''}. Achat ${item.cost} crédits, vente ${item.sell}, stock initial ${item.stock}. Effets ATB : ${bonusText(item.bonuses)}.`,
    acceptance: `Achat, vente et attribution atomiques à l’emplacement ${SLOT_LABELS[item.slot]}. Vérifier niveau, stock, possession${item.armorSpecies ? ', morphologie et poids autorisé' : ''}. Appliquer une fois les bonus affichés, préserver après sauvegarde et restituer au retrait.${item.weaponType ? ' Puissance de l’arme réduite de moitié sans entraînement.' : ''}`,
    dependencies: ['SYS-inventaire', 'SYS-commerce'], assetPath: 'src/loadout.js', gameKey: `ITEMS.${item.id}`,
    notes: `${item.detail} ${item.canonicalStatus} Aucun sprite ou modèle distinct pour cette référence.`,
    implementationPaths: ['src/loadout.js', 'src/loadout-ui.js', 'src/game-data.js', 'src/combat.js'],
    evidence: ['tests/loadout.test.js', 'tests/equipment-combat.test.js', 'docs/research/loadout-sources.md'], recordType: 'equipment-item',
  }));
  // Keep broad model/family objectives separate from the playable ranked item.
  const model = item.id.split('-')[0];
  const familyId = item.kind === 'weapon' ? `WPN-${model}` : item.kind === 'armor' ? `EQP-armure-${model}` : null;
  if (familyId && byId.has(familyId)) {
    const family = byId.get(familyId);
    const references = GEAR_CATALOG.filter(other => other.kind === item.kind && other.id.startsWith(`${model}-`)).map(other => `GEAR-${other.id}`);
    enrich(familyId, { notes: `Objectif de famille conservé. Références jouables documentées séparément : ${references.join(', ')}. Les modèles, rangs complets, silhouettes et statistiques canoniques restent à produire ou vérifier.`, implementationPaths: ['src/loadout.js'], evidence: ['docs/research/loadout-sources.md'] });
  }
}

const artSource = source('EA-LE-FEMSHEP', 'EA — apparence féminine de Shepard dans Legendary Edition', 'https://news.ea.com/press-releases/press-releases-details/2021/Relive-the-Award-Winning-Space-Opera-in-Mass-Effect-Legendary-Edition-on-May-14/', 'Source primaire du 2 février 2021, consultée le 23 octobre 2026. Confirme la disponibilité du modèle féminin par défaut dans les trois épisodes ; ne valide pas les PNG du projet.');
const directions = { front: 'avant trois-quarts', back: 'arrière trois-quarts', right: 'profil droit', left: 'profil gauche' };
for (const frame of animation.frames) put(entry({
  id: `FRAME-${frame.id}`, category: 'animations', name: `Shepard femme — marche ${directions[frame.direction]} ${frame.index + 1}/4`, sourceId: artSource, assetStatus: 'Prototype',
  description: `Frame native ${animation.width}×${animation.height}, rectangle [${frame.rect.join(', ')}], pivot [${frame.pivot.join(', ')}]. Cycle ${animation.fps} images/seconde, orientation ${frame.direction}.`,
  acceptance: 'Afficher la totalité du corps, exclure les cellules voisines et ancrer les pieds au sol. Vérifier changement de direction, arrêt, course et retour après combat. Nettoyer les raccords et comparer visage/armure aux références avant validation artistique.',
  dependencies: ['CHR-shepard', 'ANI-marche-humaine'], assetPath: `public/assets/${animation.file}`, gameKey: frame.id,
  notes: 'Pose générée, transparence native conservée. Les contacts 0 et 2 restent similaires selon l’orientation. Quatre directions ; huit directions et cycle final non produits.',
  implementationPaths: ['public/assets/shepard-female-animation.json', 'src/world.js'], evidence: ['docs/research/shepard-female-art.md'], recordType: 'animation-frame',
}));
for (const [pose, frame] of Object.entries(animation.combat.frames)) put(entry({
  id: `FRAME-${frame.id}`, category: 'animations', name: `Shepard femme — combat ${pose}`, sourceId: artSource, assetStatus: 'Prototype',
  description: `Pose clé ${pose}. Rectangle [${frame.rect.join(', ')}], pivot [${frame.pivot.join(', ')}], hauteur relative ${frame.heightScale}. Image native ${animation.combat.width}×${animation.combat.height}.`,
  acceptance: `Déclencher la pose ${pose} dans le moteur sans étirement, cellule voisine ou rupture d’ancrage.${pose === 'down' ? ' Conserver son dessin couché et ne pas ajouter de rotation procédurale.' : ''} Vérifier retour à la pose normale et références artistiques.`,
  dependencies: ['CHR-shepard', 'SPR-shepard-combat'], assetPath: `public/assets/${animation.combat.file}`, gameKey: frame.id,
  notes: 'Pose clé unique, sans séquence de transition dessinée. Arme et effet génériques ; ils ne changent pas selon chaque objet équipé ou pouvoir. Fidélité 1:1 non validée.',
  implementationPaths: ['public/assets/shepard-female-animation.json', 'src/world.js'], evidence: ['docs/research/shepard-female-art.md'], recordType: 'animation-frame',
}));

const implemented = (id, description, acceptance, assetPath, gameKey, notes, evidence = []) => enrich(id, { status: 'Prototype', assetStatus: 'Prototype', description, acceptance, assetPath, gameKey, notes, implementationPaths: [assetPath], evidence });
implemented('SYS-inventaire', `Inventaire partagé de ${INVENTORY_CAPACITY} objets, au plus ${ITEM_CAPACITY} exemplaires par référence. 48 articles et cinq emplacements par personnage.`, 'Refuser surallocation, achat impossible et équipement incompatible avant toute mutation. Retrait, vente et import doivent préserver les quantités ; récupérer le matériel d’un allié disparu.', 'src/loadout.js', 'normalizeInventory', 'Les objets équipés restent dans le total. Comparaison avant achat. Icônes et modèles propres à chaque objet restent à produire.', ['tests/loadout.test.js', 'tests/save-v02.test.js']);
implemented('SYS-commerce', 'Armurerie commune au Normandy et à la Citadelle, achat et vente avec stocks persistants. Calibrations permanentes de la version précédente conservées.', 'Crédits, inventaire et stock changent ensemble, une fois. Refuser toute vente d’un exemplaire équipé et tout achat sans crédits ou capacité. Appliquer la remise Michel uniquement aux recharges de médi-gel.', 'src/loadout-ui.js', 'renderLoadoutScreen', 'Prix, niveaux et stocks adaptés. Pas de licences ni de réapprovisionnement aléatoire.', ['tests/loadout.test.js', 'tests/save-v02.test.js']);
implemented('SYS-chaleur-des-armes', 'Chaleur des tirs et refroidissement modulés par l’arme et son module. Les munitions phasiques ont un coût thermique supplémentaire.', 'Bornes et surchauffe respectées. Les coûts affichés correspondent aux tirs réellement exécutés ; les pouvoirs et les effets de sabotage ne doivent pas recevoir le multiplicateur de chaleur de l’arme.', 'src/combat.js', 'weaponHeatMultiplier/weaponCoolingBonus', 'Équilibrage ATB, sans reconstitution des tables statistiques ME1.', ['tests/equipment-combat.test.js']);
enrich('SYS-journal-de-mission', { description: 'Missions, Assignations et Rapports. Trois assignations historiques et onze opérations supplémentaires, avec progression, blocages, choix, récompenses et suivi.', notes: 'Les systèmes assignments et operations restent distincts dans la sauvegarde. Les quêtes terminées quittent les objectifs actifs. Les embranchements complets de ME1 restent à produire.', implementationPaths: ['src/main.js', 'src/operations-ui.js', 'src/operations.js'], evidence: ['tests/assignments.test.js', 'tests/operations.test.js'] });
enrich('SYS-carte-locale', { description: 'Plan avec repères numérotés, filtres et suivi des objectifs de campagne et d’opération.', acceptance: 'Objectifs identifiables, filtrage cohérent et mise à jour après étape. Les emplacements doivent rester atteignables sans retirer les collisions ; le suivi obsolète doit disparaître.', assetPath: 'src/local-map.js', implementationPaths: ['src/local-map.js', 'src/local-map.css', 'src/world.js'], notes: 'Carte de l’adaptation condensée. Les coordonnées des nouveaux contacts peuvent être déplacées à proximité pour conserver un chemin praticable.' });
enrich('CHR-shepard', { notes: 'Dossier masculin/féminin, origines et profil conservés. Deux cycles de marche de 16 images chacun, quatre directions. Shepard femme possède quatre poses de combat. Créateur facial, réactions complètes aux antécédents, huit directions et fidélité artistique finale restent à produire.', implementationPaths: ['src/commander.js', 'src/state.js', 'src/world.js', 'public/assets/shepard-female-animation.json'], evidence: ['tests/commander.test.js', 'tests/commander-world.test.js', 'docs/research/shepard-female-art.md'] });
enrich('ANI-marche-humaine', { notes: 'Shepard masculin et féminin : 16 images par apparence, quatre directions. Les deux cycles sont actifs dans le prototype. Les contacts féminins 0 et 2 restent similaires dans certaines orientations. Huit directions, raccords définitifs et marche des autres humains restent à produire.', implementationPaths: ['src/world.js', 'public/assets/shepard-walk-atlas.png', 'public/assets/shepard-female-walk-atlas.png', 'public/assets/shepard-female-animation.json'], evidence: ['docs/research/shepard-female-art.md'] });
enrich('SPR-shepard-terrain', { notes: 'Deux cycles de marche : 16 images / quatre directions pour chaque apparence. Rectangles et pivots spécifiques pour Shepard femme. Poses de repli existantes ; huit directions et fidélité 1:1 non validées.', implementationPaths: ['src/world.js', 'public/assets/shepard-female-animation.json'], evidence: ['docs/research/shepard-female-art.md'] });
enrich('SPR-shepard-combat', { notes: 'Shepard masculin conserve la pose de l’atlas commando. Shepard femme utilise quatre poses aim/power/hit/down ; hauteur couchée 0,245 sans rotation supplémentaire. Les séquences de transition et variantes par arme restent à produire.', implementationPaths: ['src/world.js', 'public/assets/shepard-female-combat-atlas.png', 'public/assets/shepard-female-animation.json'], evidence: ['docs/research/shepard-female-art.md'] });
enrich('SPR-shepard-portrait', { notes: 'Portraits liés à l’apparence sélectionnée ; la variante féminine utilise une découpe de sa nouvelle planche de marche. Les expressions et variantes de costume restent à produire.', implementationPaths: ['src/main.js', 'src/loadout-ui.js', 'public/assets/shepard-female-walk-atlas.png'], evidence: ['docs/research/shepard-female-art.md'] });
enrich('NPC-emily-wong', { status: 'Prototype', description: 'Journaliste contactée dans la demande de preuves sur Fist.', assetPath: 'src/operation-data.js', gameKey: 'citadel-reporters-request', notes: 'Dialogue réécrit, portrait du prototype quand utilisé ; pas de personnage 3D ou sprite de terrain dédié. Le disque attend le recrutement de Tali.', implementationPaths: ['src/operation-data.js', 'src/operations.js'], evidence: ['tests/operations.test.js'] });

catalog.meta.version = version;
catalog.meta.updatedAt = '2026-10-23';
Object.assign(catalog.meta.prototypeCoverage, {
  assignmentCount: 14, historicalAssignmentCount: 3, operationCount: OPERATIONS.length,
  operationStepCount: OPERATIONS.reduce((sum, operation) => sum + operation.steps.length, 0),
  operationEncounterCount: Object.keys(OPERATION_ENCOUNTERS).length,
  equipmentItemCount: GEAR_CATALOG.length, weaponItemCount: 20, armorItemCount: 16, moduleItemCount: 12,
  walkFrameCount: 32, femaleCombatPoseCount: 4,
  assignmentLimit: 'Trois assignations historiques et onze opérations supplémentaires. Quatre scans de veilleurs, dialogues réécrits, cartes condensées, quatre combats possibles. Les variantes complètes, les intérieurs et les autres missions secondaires/DLC restent à produire.',
  animationLimit: '32 frames de marche pour les deux apparences de Shepard, quatre directions chacune ; quatre poses de combat féminines. Raccords, huit directions, variantes par arme et mouvements des compagnons restent à produire.',
  visualLimit: 'Deux cycles de marche de Shepard et quatre poses de combat féminines. Les autres atlas restent des poses de prototype. Costumes, visages et mouvements complets non validés 1:1.',
});
for (const atlas of [{path:`public/assets/${animation.file}`,scope:'Shepard femme : 16 frames de marche / quatre directions ; cycle à nettoyer'}, {path:`public/assets/${animation.combat.file}`,scope:'Shepard femme : quatre poses clés aim, power, hit et down ; aucune transition dessinée'}]) {
  const previous = catalog.meta.prototypeCoverage.atlases.find(item => item.path === atlas.path);
  if (previous) Object.assign(previous, atlas); else catalog.meta.prototypeCoverage.atlases.push(atlas);
}
catalog.meta.v02Sources = {};
for (const file of ['src/loadout.js', 'src/operation-data.js', 'public/assets/shepard-female-animation.json']) catalog.meta.v02Sources[file] = createHash('sha256').update(await fs.readFile(path.join(root, file))).digest('hex');

const allIds = new Set(catalog.entries.map(entry => entry.id));
if (allIds.size !== catalog.entries.length) throw new Error('Duplicate catalog ID');
for (const previous of baseline.entries) {
  const current = byId.get(previous.id);
  if (!current) throw new Error(`Lost original record ${previous.id}`);
  if ((previous.episode !== 'ME1' || ['Intégré', 'Validé'].includes(previous.status)) && JSON.stringify(previous) !== JSON.stringify(current)) throw new Error(`Protected record changed: ${previous.id}`);
}
for (const record of catalog.entries) {
  for (const dependency of record.dependencies) if (!allIds.has(dependency)) throw new Error(`Missing dependency ${record.id}: ${dependency}`);
  if (!catalog.sources.some(source => source.id === record.sourceId)) throw new Error(`Missing source ${record.id}`);
  for (const file of [record.assetPath, ...(record.implementationPaths || []), ...(record.evidence || [])].filter(Boolean)) await fs.access(path.join(root, file));
}
await fs.writeFile(catalogPath, JSON.stringify(catalog, null, 2) + '\n');
const counts = key => catalog.entries.reduce((out, record) => ({ ...out, [record[key]]: (out[record[key]] || 0) + 1 }), {});
const changed = baseline.entries.filter(previous => JSON.stringify(previous) !== JSON.stringify(byId.get(previous.id))).length;
console.log(JSON.stringify({ baseline: baseline.entries.length, records: catalog.entries.length, added: catalog.entries.length - baseline.entries.length, enriched: changed, preservedFuture: baseline.entries.filter(entry => entry.episode !== 'ME1').length, status: counts('status'), canon: counts('canonLevel'), sources: catalog.sources.length }, null, 2));
