import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalogPath = path.join(root, 'docs/content-catalog.json');
const catalog = JSON.parse(await fs.readFile(catalogPath, 'utf8'));
const preserved = catalog.entries.filter(entry => !entry.id.startsWith('CUST-'));
const original = JSON.stringify(preserved);
const sources = [
  { id: 'ME1-CUSTOMIZATION-MANUAL', title: 'Mass Effect — manuel Xbox 360 officiel', url: 'https://eaassets-a.akamaihd.net/eahelp/manuals/mass-effect-manuals_Microsoft%20XBOX360_en_US.pdf', scope: 'Pages imprimées 5–7 et 18–19. Création de Shepard, armures complètes et améliorations spécialisées.' },
  { id: 'ME3-CUSTOMIZATION-MANUAL', title: 'Mass Effect 3 — manuel PC officiel', url: 'https://eaassets-a.akamaihd.net/eahelp/manuals/mass-effect-3-manuals_PC.pdf', scope: 'Pages 12–13. Pièces d’armure, deux mods par arme, charge et recharge. Référence des différences entre opus.' },
  { id: 'MEA-CUSTOMIZATION-MANUAL', title: 'Mass Effect Andromeda — manuel PC officiel', url: 'https://eaassets-a.akamaihd.net/eahelp/manuals/mass-effect-andromeda-pc-en.pdf', scope: 'Pages 6 et 15–18. Créateur, recherche, développement, augmentations et équipement. Référence future.' },
  { id: 'MEA-PATCH108', title: 'BioWare — Mass Effect Andromeda Patch 1.08', url: 'https://blog.bioware.com/2017/06/06/mass-effect-andromeda-patch-1-08-notes/', scope: 'Modification d’apparence à bord du Tempest. Ne décrit pas une fonctionnalité native de ME1.' },
];
for (const source of sources) if (!catalog.sources.some(old => old.id === source.id)) catalog.sources.push(source);
const sourceById = new Map(catalog.sources.map(source => [source.id, source]));

const ui = 'src/customization-ui.js';
const model = 'src/customization.js';
const unit = 'tests/customization.test.js';
const browser = 'scripts/customization-browser.mjs';
const notes = 'docs/CUSTOMIZATION.md';
const rows = [];
function add(category, key, name, description, acceptance, file, options = {}) {
  const sourceId = options.sourceId || 'PROJECT';
  const future = options.future === true;
  rows.push({
    id: `CUST-${key}`, category, name, episode: 'ME1', scope: 'Production ME1',
    canonLevel: 'Adaptation', status: future ? 'Défini' : 'Prototype',
    assetStatus: future ? 'À produire' : 'Prototype',
    reference: options.reference || 'Atelier de Relay Chronicles. Interface et réglages propres au fan game ; contrôle de fidélité distinct.',
    sourceId, sourceUrl: sourceById.get(sourceId)?.url || '',
    description, acceptance, dependencies: options.dependencies || ['CUST-UI-workshop'],
    priority: options.priority || (future ? 'P1' : 'P0'),
    plannedPath: file, assetPath: future ? '' : file,
    gameKey: options.gameKey || `customization:${key}`,
    notes: options.notes || (future ? 'Reste à produire et à vérifier. Aucun statut terminé ou fidèle 1:1.' : 'Implémentation de prototype. Les valeurs de combat restent celles de l’adaptation ATB.'),
    deliveryVersion: '0.3.0', implementationPaths: future ? [] : [file],
    evidence: [notes], recordType: category === 'qa' ? 'acceptance-scenario' : 'customization-feature',
  });
}

add('systems', 'UI-workshop', 'Atelier de personnalisation de Shepard',
  'Écran réunissant trois onglets : Personnage, Armure et Armes. Présentation du personnage, options et dotation partagent un brouillon.',
  'Ouvrir les trois onglets, modifier des options, puis appliquer ou annuler sans quitter la campagne ni perdre la progression.', ui,
  { dependencies: ['SYS-creation-de-shepard', 'SYS-inventaire', 'SYS-sauvegarde-locale'] });
add('systems', 'UI-entry', 'Accès à l’atelier depuis les menus',
  'Entrées visibles depuis les menus de Shepard et de l’équipement. Retour à l’écran d’origine après fermeture.',
  'Atteindre l’atelier sans console ni commande de développement. Le bouton Retour rétablit le menu attendu.', 'src/main.js');
add('systems', 'UI-character', 'Onglet Personnage',
  'Choix de l’apparence, des préréglages du visage, du teint, des cheveux et des yeux, avec aperçu immédiat.',
  'Chaque option modifie le brouillon et son aperçu. Le personnage actif reste inchangé avant validation.', ui,
  { sourceId: 'EA-GAMEPLAY', notes: 'Présentation 2D propre au projet. L’ensemble des curseurs morphologiques du créateur officiel reste à réaliser.' });
add('systems', 'UI-armor', 'Onglet Armure',
  'Choix d’une armure complète possédée et d’un module d’armure. Les options visuelles sont regroupées sous l’atelier de Relay Chronicles.',
  'Afficher la pièce équipée, les autres armures disponibles, leurs restrictions et les différences de statistiques.', ui,
  { sourceId: 'ME1-CUSTOMIZATION-MANUAL' });
add('systems', 'UI-weapons', 'Onglet Armes',
  'Choix de l’arme, de son module et de ses munitions spéciales à partir de l’inventaire partagé.',
  'La sélection respecte les emplacements existants et permet le retour à la dotation précédente avant validation.', ui,
  { sourceId: 'ME1-CUSTOMIZATION-MANUAL' });
add('systems', 'FACE-preset', 'Préréglages du visage',
  'Préréglages visuels adaptés au portrait 2D de Shepard. Les identifiants sont persistants et distincts du sexe d’apparence.',
  'Changer le préréglage puis revenir au précédent restitue le même aperçu. Une valeur inconnue est rejetée au chargement.', model,
  { sourceId: 'EA-GAMEPLAY', notes: 'Préréglages originaux de l’adaptation ; aucun code visage officiel ni morphing 3D natif.' });
add('systems', 'FACE-skin', 'Palette de teints',
  'Choix du teint dans une palette bornée. La palette sert à l’aperçu 2D et à la sauvegarde de l’atelier.',
  'Les teintes restent distinctes et lisibles sous l’éclairage de l’atelier. La valeur choisie survit à un chargement.', model,
  { sourceId: 'EA-GAMEPLAY' });
add('systems', 'FACE-hair', 'Coiffure et couleur des cheveux',
  'Sélection d’une coiffure et d’une couleur indépendantes, représentées dans le portrait de personnalisation.',
  'Changer la couleur conserve la coiffure et inversement. Les valeurs invalides ne sont pas importées dans la partie.', model,
  { sourceId: 'EA-GAMEPLAY', notes: 'Les coiffures du portrait ne constituent pas des atlas animés redessinés pour chaque variante.' });
add('systems', 'FACE-eyes', 'Couleur des yeux',
  'Palette des yeux visible sur le portrait agrandi, enregistrée dans la configuration du commandant.',
  'La sélection reste vérifiable dans le portrait et dans la sauvegarde exportée sans modifier les statistiques de combat.', model,
  { sourceId: 'EA-GAMEPLAY' });
add('systems', 'SYS-identity', 'Conservation du dossier de Shepard',
  'La retouche de l’apparence préserve l’origine, le profil psychologique, la classe et les décisions de campagne déjà enregistrées.',
  'Comparer le dossier, les quêtes, les crédits, l’XP et les drapeaux narratifs avant et après application d’une retouche.', model);
add('systems', 'SYS-draft', 'Brouillon de personnalisation isolé',
  'Les changements sont rassemblés dans une copie de travail avant leur validation. Parcourir des options ne consomme aucun objet.',
  'Modifier chaque catégorie puis vérifier que l’état de campagne et son inventaire restent identiques à leur état initial.', model);
add('systems', 'SYS-atomic', 'Application atomique du personnage et du matériel',
  'Le bouton Appliquer vérifie l’apparence et tous les emplacements de la dotation avant de remplacer l’état actif.',
  'Si une seule sélection échoue, aucune apparence ni pièce d’équipement n’est modifiée. Une application valide ne duplique aucun objet.', model);
add('systems', 'SYS-cancel', 'Annuler les retouches',
  'Annuler abandonne les modifications du brouillon et retrouve l’apparence et l’équipement effectivement sauvegardés.',
  'Modifier visage, armure et arme puis annuler. Comparer l’état complet à l’état précédant l’ouverture de l’atelier.', ui);
add('systems', 'SYS-reset', 'Réinitialiser le brouillon',
  'Rétablir la configuration courante dans l’atelier afin de recommencer une comparaison sans réinitialiser la campagne.',
  'Après plusieurs changements, le brouillon réinitialisé correspond au personnage actif et n’affecte ni quête ni inventaire.', ui);
add('systems', 'UI-comparison', 'Comparaison des statistiques de dotation',
  'L’atelier présente les valeurs équipées et les valeurs projetées du brouillon : santé, bouclier, puissance, défense et effets des modules.',
  'Les différences affichées correspondent aux règles d’équipement existantes, y compris chaleur, refroidissement et bonus spécialisés.', ui);
add('systems', 'SYS-persistence', 'Persistance de la personnalisation',
  'L’apparence et la dotation validées sont incluses dans la sauvegarde automatique, les sauvegardes manuelles et les exports JSON.',
  'Après validation, recharger chaque type de sauvegarde et retrouver exactement la configuration sélectionnée.', 'src/state.js');
add('systems', 'SYS-migration', 'Migration des sauvegardes sans personnalisation',
  'Une sauvegarde antérieure dépourvue du nouveau champ reçoit une configuration par défaut compatible avec son apparence.',
  'Importer une sauvegarde 0.2.0 sans le champ puis sauvegarder à nouveau, en conservant progression, inventaire et identité.', 'src/state.js');
add('systems', 'SYS-validation', 'Validation des données de personnalisation',
  'Le chargement contrôle la forme des données, leurs clés et les valeurs des palettes, préréglages et options de l’atelier.',
  'Refuser une version inconnue, un identifiant interdit ou une structure malformée. Ne pas exécuter de getter fourni par une entrée externe.', model);
add('systems', 'UI-responsive', 'Atelier sur ordinateur et mobile',
  'L’aperçu et les options s’adaptent à la largeur disponible. Les libellés, statistiques et actions restent accessibles au défilement.',
  'Parcourir les trois onglets à largeur de bureau et de téléphone sans débordement horizontal ni bouton masqué.', 'src/customization-ui.css');
add('systems', 'UI-keyboard', 'Navigation clavier de l’atelier',
  'Contrôles natifs nommés, focus visible et fermeture cohérente avec le reste des menus.',
  'Sélectionner des options et valider ou annuler au clavier. Échap n’applique aucune modification du brouillon.', ui);

add('equipment', 'ARMOR-full-suit', 'Armure complète ME1 dans l’atelier',
  'Une seule armure complète remplit l’emplacement armure. Les catégories légère, intermédiaire et lourde restent celles du catalogue existant.',
  'Ne pas fabriquer de combinaison torse/bras/jambes ME2 dans la dotation ME1. L’objet sélectionné est un identifiant existant de l’inventaire.', ui,
  { sourceId: 'ME1-CUSTOMIZATION-MANUAL', dependencies: ['CUST-UI-armor', 'SYS-inventaire'] });
add('equipment', 'ARMOR-compatibility', 'Restrictions d’armure et disponibilité',
  'La sélection reprend les restrictions d’espèce, d’entraînement et de disponibilité de la dotation existante.',
  'Une armure incompatible ou réservée par un autre équipier ne peut pas être validée. La raison est compréhensible dans l’écran.', model,
  { sourceId: 'ME1-CUSTOMIZATION-MANUAL', dependencies: ['CUST-ARMOR-full-suit'] });
add('equipment', 'ARMOR-module', 'Module d’armure dans le brouillon',
  'Choisir ou retirer le module d’armure existant, sans ajouter d’emplacement non pris en charge par le moteur.',
  'La comparaison du bouclier, de la défense ou des résistances suit le module choisi. Retirer le module ne détruit pas l’objet.', ui,
  { sourceId: 'ME1-CUSTOMIZATION-MANUAL', dependencies: ['CUST-UI-armor'] });
add('equipment', 'ARMOR-colors', 'Couleurs de l’armure de Relay Chronicles',
  'Couleurs principales, secondaires et d’accent de l’atelier visuel, séparées des propriétés de l’objet équipé.',
  'Changer une couleur conserve les statistiques et les objets. Afficher qu’il s’agit d’une option de l’adaptation.', model,
  { sourceId: 'ME2-MANUAL', notes: 'Personnalisation cosmétique inspirée des opus ultérieurs. Ce n’est pas une fonction native revendiquée de ME1.' });
add('equipment', 'ARMOR-pattern-finish', 'Motif et finition de l’armure',
  'Options visuelles de motif et de finition dans le personnage présenté par l’atelier.',
  'Le motif et la finition sont visibles dans l’aperçu, persistent après validation et ne modifient pas les bonus.', model,
  { sourceId: 'ME3-CUSTOMIZATION-MANUAL', notes: 'Extension de Relay Chronicles ; les règles d’armures spéciales de ME3 ne sont pas importées dans ME1.' });
add('equipment', 'ARMOR-helmet', 'Visibilité du casque dans l’atelier',
  'Préférence de présentation du casque pour l’aperçu du personnage.',
  'Activer et masquer le casque laisse l’armure et sa défense inchangées. Décrire la portée réelle de la représentation en jeu.', model,
  { notes: 'Option visuelle. Le remplacement fidèle du casque sur toutes les images animées demande des assets dédiés.' });

add('weapons', 'WEAPON-owned', 'Arme équipée et armes disponibles',
  'Sélection d’un modèle d’arme possédé, avec sa famille et ses limites d’entraînement dans l’adaptation.',
  'Choisir parmi les armes disponibles sans en créer ni en acheter implicitement. Le modèle équipé reste affiché.', ui,
  { sourceId: 'ME1-CUSTOMIZATION-MANUAL', dependencies: ['CUST-UI-weapons'] });
add('weapons', 'WEAPON-upgrade', 'Module d’arme séparé des munitions',
  'L’emplacement de module d’arme utilise le catalogue de modules existant et ses effets sur la puissance ou la chaleur.',
  'Un module d’armure ou de munitions ne peut pas entrer dans ce champ. La comparaison reflète l’effet du module.', ui,
  { sourceId: 'ME1-CUSTOMIZATION-MANUAL', dependencies: ['CUST-UI-weapons'] });
add('weapons', 'WEAPON-ammo', 'Munitions spéciales dans le brouillon',
  'L’amélioration de munitions est sélectionnée indépendamment du module d’arme.',
  'Équiper puis retirer des munitions spéciales ne remplace pas le module d’arme et conserve la quantité possédée.', ui,
  { sourceId: 'ME1-CUSTOMIZATION-MANUAL', dependencies: ['CUST-UI-weapons'] });
add('weapons', 'WEAPON-effects', 'Effets réels de la nouvelle dotation',
  'Après application, l’équipement de l’atelier alimente le calcul d’acteur et les règles de combat déjà présentes.',
  'Vérifier puissance, chaleur, refroidissement, dégâts spécialisés et résistance avec les mêmes calculs que l’écran Équipement.', model,
  { dependencies: ['CUST-UI-comparison', 'CUST-SYS-atomic'] });

add('sprites', 'ART-face-preview', 'Portrait 2D personnalisable',
  'Portrait procédural de l’atelier affichant les choix de visage, teint, coiffure et yeux.',
  'L’aperçu permet de distinguer chaque option. Les libellés n’annoncent pas un modèle facial 3D officiel.', ui,
  { sourceId: 'EA-GAMEPLAY', notes: 'Représentation graphique de prototype. Fidélité des visages officiels à contrôler séparément.' });
add('sprites', 'ART-armor-preview', 'Silhouette d’armure dans l’atelier',
  'Silhouette inspectable du commandant, indiquant les couleurs, le motif et le casque choisis.',
  'Le corps reste lisible avec le casque affiché ou masqué et les couleurs de la palette. Les options ne recouvrent pas les commandes.', ui);
add('sprites', 'ART-weapon-preview', 'Aperçu de la famille d’arme',
  'Représentation d’inspection et fiche du modèle sélectionné dans l’onglet Armes.',
  'La famille présentée correspond à l’objet choisi. Ne pas présenter une silhouette générique comme la géométrie exacte d’un modèle ME1.', ui,
  { notes: 'La représentation des familles reste une adaptation. Les modèles détaillés propres à chaque fabricant restent à produire.' });
add('sprites', 'ART-world-palette', 'Couleur personnalisée du sprite en jeu',
  'Transmettre les couleurs prises en charge par le rendu de Shepard à l’exploration et au combat.',
  'Vérifier les limites du masque ou de la recoloration sur toutes les directions et poses. Aucun changement d’apparence d’un autre équipier.', 'src/world.js',
  { notes: 'La recoloration d’un atlas ne remplace pas les silhouettes d’armures ou coiffures par des assets dédiés.' });
add('sprites', 'ART-faithful-variants', 'Variantes artistiques exactes par armure et arme',
  'Produire des sprites, portraits et détails correspondant à chaque armure, arme, casque et coiffure réellement équipés.',
  'Comparer les volumes, panneaux, marquages et teintes au modèle de l’opus retenu dans toutes les vues et poses avant validation.', 'public/assets/customization/',
  { future: true, sourceId: 'EA-COSPLAY', notes: 'Backlog artistique. Les aperçus procéduraux et teintes d’atlas ne valident pas ces variantes 1:1.' });

add('animations', 'ANI-walk-colors', 'Personnalisation et cycle de marche',
  'Conserver la configuration visuelle prise en charge lors du changement de direction, de l’arrêt et de la course de Shepard.',
  'Parcourir les quatre directions pour les deux apparences sans retour à la palette par défaut entre les frames.', 'src/world.js');
add('animations', 'ANI-combat-colors', 'Personnalisation et poses de combat',
  'Maintenir les options visuelles prises en charge pendant les poses de visée, pouvoir, impact et hors combat.',
  'Vérifier la persistance de la palette et des ancrages lors du passage exploration/combat puis du retour sur la carte.', 'src/world.js');
add('animations', 'ANI-equipment-transitions', 'Transitions animées propres à l’équipement',
  'Prévoir des poses de sélection, manipulation, mise en joue et rangement pour chaque famille d’arme et catégorie d’armure.',
  'Les mains suivent les prises de l’arme, les volumes de l’armure restent cohérents et les accessoires n’intersectent pas le corps.', 'public/assets/customization/animations/',
  { future: true, notes: 'Backlog. Aucun nouveau cycle dessiné par équipement n’est livré par l’atelier 0.3.0.' });

const checks = [
  ['draft-pure', 'QA — aperçu sans mutation', 'Modifier toutes les catégories du brouillon et comparer l’état de campagne avant validation.', 'L’état actif et les quantités restent strictement inchangés.', unit, 'CUST-SYS-draft'],
  ['cancel', 'QA — annulation complète', 'Modifier l’apparence, l’armure, l’arme et les modules puis annuler depuis l’atelier.', 'La configuration antérieure reste affichée après fermeture et réouverture.', browser, 'CUST-SYS-cancel'],
  ['apply', 'QA — validation d’une configuration', 'Valider une configuration cohérente et relire l’acteur équipé.', 'Toutes les modifications sont appliquées ensemble sans altérer crédits, quêtes ni XP.', unit, 'CUST-SYS-atomic'],
  ['failure', 'QA — échec atomique', 'Ajouter une sélection incompatible ou devenue indisponible au brouillon.', 'L’opération échoue sans modifier apparence, dotation ou inventaire.', unit, 'CUST-SYS-atomic'],
  ['legacy', 'QA — sauvegarde antérieure', 'Charger une sauvegarde 0.2.0 dépourvue du champ de personnalisation.', 'Les valeurs par défaut sont ajoutées et les données historiques restent intactes.', unit, 'CUST-SYS-migration'],
  ['malformed', 'QA — données de personnalisation invalides', 'Tester clés inconnues, palettes invalides, valeurs hors type et objets avec accesseurs.', 'Chaque entrée non valide est refusée sans exécution de getter ni mutation partielle.', unit, 'CUST-SYS-validation'],
  ['roundtrip', 'QA — sauvegarder et retrouver le personnage', 'Enregistrer, exporter, recharger et importer une configuration personnalisée.', 'L’apparence et les cinq emplacements de dotation retrouvés sont identiques aux choix validés.', browser, 'CUST-SYS-persistence'],
  ['ownership', 'QA — propriété des objets', 'Essayer un objet absent, incompatible ou déjà attribué à un autre équipier.', 'Aucun objet ne se duplique et aucune attribution de l’autre équipier ne disparaît.', unit, 'CUST-ARMOR-compatibility'],
  ['stats', 'QA — comparaison et calcul du combat', 'Comparer la projection du brouillon au calcul d’acteur après application.', 'Les différences numériques correspondent à la dotation et aux effets des modules.', unit, 'CUST-WEAPON-effects'],
  ['layouts', 'QA — lisibilité ordinateur et téléphone', 'Parcourir les trois onglets avec de longs noms et plusieurs tailles de fenêtre.', 'Aucun défilement horizontal involontaire, contrôle tronqué ou action inaccessible.', browser, 'CUST-UI-responsive'],
  ['keyboard', 'QA — navigation clavier et fermeture', 'Changer les contrôles au clavier, parcourir les onglets puis fermer sans appliquer.', 'Le focus reste visible et Échap ne valide pas le brouillon.', browser, 'CUST-UI-keyboard'],
  ['art-review', 'QA — fidélité artistique de la personnalisation', 'Comparer chaque silhouette, détail d’armure, arme et coiffure aux références de son opus.', 'Documenter les différences et conserver le statut à produire jusqu’au contrôle des vues et animations.', 'docs/research/customization-art-review.md', 'CUST-ART-faithful-variants'],
];
for (const [key, name, description, acceptance, file, dependency] of checks) {
  add('qa', `QA-${key}`, name, description, acceptance, file,
    { dependencies: [dependency], future: key === 'art-review', notes: key === 'art-review' ? 'Revue artistique non réalisée. Aucune certification de fidélité 1:1.' : 'Scénario à vérifier avec les rapports de la version 0.3.0. La présence du test ne suffit pas à déclarer la fonctionnalité terminée.' });
}

catalog.entries = [...preserved, ...rows];
catalog.meta.version = '0.3.0';
catalog.meta.updatedAt = '2026-10-23';
catalog.meta.customization = {
  version: '0.3.0', tabs: ['Personnage', 'Armure', 'Armes'], records: rows.length,
  equipmentModel: 'Armure complète ME1 et cinq emplacements déjà présents. Les options de couleur, motif et finition sont une extension cosmétique de Relay Chronicles.',
  visualLimit: 'Aperçus 2D et recoloration de prototype. Morphing facial 3D, variantes artistiques exactes par équipement et animations dédiées restent à produire.',
};
assert.equal(JSON.stringify(catalog.entries.filter(entry => !entry.id.startsWith('CUST-'))), original, 'Existing catalogue records must remain unchanged.');
assert.equal(new Set(catalog.entries.map(entry => entry.id)).size, catalog.entries.length, 'Duplicate catalogue IDs.');
const ids = new Set(catalog.entries.map(entry => entry.id));
for (const row of rows) for (const dependency of row.dependencies) assert.ok(ids.has(dependency), `Unknown dependency: ${row.id} -> ${dependency}`);
await fs.writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
console.log(JSON.stringify({ previous: preserved.length, added: rows.length, total: catalog.entries.length, counts: Object.fromEntries(catalog.categories.map(category => [category.id, rows.filter(row => row.category === category.id).length]).filter(([,count]) => count)) }, null, 2));
