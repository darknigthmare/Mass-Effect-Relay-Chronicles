// The remaining catalogue stock contains equipment references, not forty new
// armours. A bench selects an existing native mechanism; it is never a generic
// armour duel, an inventory unlock or a replacement for a missing mechanism.
import { getUniverseRecord, getUniverseWork } from './universe-data.js';

const freeze = value => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
};

const FIXTURE = freeze({ hp: 120, shield: 30, attack: 16, defense: 4, speed: 1 });
const COMMON_LIMITS = [
  'Référence du registre existant : aucune nouvelle armure, pièce nommée, gamme ou variante originale inventée.',
  'Les nombres et commandes du banc sont des adaptations ATB sur des fixtures abstraites ; aucune fidélité mécanique, numérique ou visuelle 1:1 certifiée.',
  'Aucun objet, crédit, compétence, slot, recette, droit de porteur, récompense ou progression transféré dans les anciens inventaires ou campagnes.',
  'Aucun nouveau visuel, modèle, costume, animation ou équipement porté produit par cette fiche.',
];
const definitions = [
  {
    recordId: 'EQP-omni-outil', role: 'banc d’outil technologique',
    bench: { kind: 'tool', parentRecordId: 'PWR-surcharge', equipmentId: 'omni-tool-upgraded', actionId: 'overload' },
    notes: ['Comparer Surcharge déjà maîtrisée sur une fixture technologique avec et sans l’outil générique amélioré existant.',
      'Le multiplicateur technologique 1,15 est celui du prototype ; il ne renforce ni les tirs ni la biotique.'],
    limitations: ['Le manuel ME1 p.24 établit le rôle général de l’outil, aucun fabricant, rang, prix ou coefficient original.',
      'Le pouvoir est préappris par la fixture ; l’omni-outil n’accorde aucune compétence.'],
  },
  {
    recordId: 'EQP-amplificateur-biotique', role: 'banc d’amplificateur biotique',
    bench: { kind: 'tool', parentRecordId: 'PWR-projection', equipmentId: 'biotic-amp-upgraded', actionId: 'throw' },
    notes: ['Comparer Projection déjà maîtrisée sur une fixture biotique avec et sans l’amplificateur générique amélioré existant.',
      'Le multiplicateur biotique 1,15 est celui du prototype ; aucun avantage technologique ou de tir.'],
    limitations: ['Le manuel ME1 p.24 atteste l’équipement biotique, pas les caractéristiques d’un modèle nommé.',
      'L’amplificateur ne crée aucune aptitude biotique ; la fixture est déjà formée.'],
  },
  {
    recordId: 'ME2-EQP-MEDIGEL', role: 'ressource de secours',
    blockedReason: 'Réanimation ME2 avec dépense de médi-gel non raccordée à ce banc ; le talent Unity ME1 ne peut pas lui être substitué.',
    notes: ['Le catalogue distingue une ressource de secours permettant de relever les équipiers.',
      'Unity natif est actuellement un talent Spectre sans dépense de dose ; medigel natif soigne un allié conscient.'],
    limitations: ['Aucune réanimation gratuite, quantité, effet médical, recharge ou règle ME1 importée dans ME2.'],
  },
  {
    recordId: 'ME2-EQP-THERMAL', role: 'banc de clips thermiques',
    bench: { kind: 'thermal-clips', parentRecordId: 'ME2-WPN-AVENGER', actionId: 'reload' },
    notes: ['Banc de recharge d’une arme ME2 conventionnelle explicitement choisie : Avenger.',
      'Chargeur et réserve finie sont séparés ; une recharge transfère des unités disponibles et ne crée pas de munitions.'],
    limitations: ['Le manuel ME2 français confirme le principe des dissipateurs amovibles, pas les capacités ATB choisies.',
      'Les armes lourdes, armes à chaleur propre et règles de ramassage de chaque scène sont exclues.'],
  },
  {
    recordId: 'ME2-EQP-CELLS', role: 'cellules d’armes lourdes',
    blockedReason: 'Aucun modèle lourd, coût de cellule ou comportement propre vérifié pour ce banc ; aucune conversion en clips conventionnels.',
    notes: ['L’existence d’une réserve lourde ne fournit pas un système de tir complet ni une quantité originale.'],
    limitations: ['Cellules d’armes lourdes ME2 distinctes des clips thermiques et des cellules de pouvoirs MEA.'],
  },
  {
    recordId: 'ME3-EQP-WEAPON-MODS', role: 'famille générale de modifications',
    blockedReason: 'Cette fiche générale ne désigne aucun module précis ni compatibilité ; elle ne crée pas un quatrième module universel.',
    notes: ['Les bancs séparés Barrel, Magazine et Ultralight conservent leurs propres identifiants et restrictions.'],
    limitations: ['Aucun fabricant, rang, port supplémentaire ou parent d’arme déduit de cette entrée générale.'],
  },
  {
    recordId: 'ME3-EQP-BARREL', role: 'banc de dégâts d’arme',
    bench: { kind: 'weapon-mod', parentRecordId: 'ME3-WPN-AVENGER', equipmentId: 'ME3-EQP-BARREL', actionId: 'shoot' },
    notes: ['Comparer un tir d’Avenger ME3 conventionnel à clips, avec et sans la famille Barrel existante.',
      'weaponDamageMultiplier 1,12 appartient au prototype et doit être appliqué une seule fois au tir.'],
    limitations: ['Aucun bonus d’attaque global, technologique ou biotique ; aucun profil d’arme spéciale ou d’une autre œuvre.',
      'Famille seulement : modèle, fabricant, rang et bonus numérique original non certifiés.'],
  },
  {
    recordId: 'ME3-EQP-SCOPE', role: 'famille de lunettes',
    blockedReason: 'Visée, zoom, précision et perception dans la fumée ne sont pas implémentés par ce banc ; aucun bonus de dégâts ou de défense ne les remplace.',
    notes: ['La présence d’une famille de lunettes ne prouve ni un modèle particulier ni une compatibilité universelle.'],
    limitations: ['Aucun effet de couvert, de ciblage, de portée ou de visée originale certifié.'],
  },
  {
    recordId: 'ME3-EQP-MAGAZINE', role: 'banc de capacité de chargeur',
    bench: { kind: 'weapon-mod', parentRecordId: 'ME3-WPN-AVENGER', equipmentId: 'ME3-EQP-MAGAZINE', actionId: 'reload' },
    notes: ['Comparer les réserves finies de l’Avenger ME3 avec et sans le module Magazine existant.',
      'Dans le réglage ATB existant : capacité 18→23, réserve initiale 72→67 ; les 90 unités totales sont conservées.'],
    limitations: ['Pas de remplissage gratuit, de réserve infinie ou de changement du système thermique.',
      'Prototype limité au parent conventionnel à clips ; aucun rang ou chiffre original certifié.'],
  },
  {
    recordId: 'ME3-EQP-ULTRALIGHT', role: 'banc de recharge des pouvoirs',
    bench: { kind: 'weapon-mod', parentRecordId: 'ME3-WPN-SHURIKEN', equipmentId: 'ME3-EQP-ULTRALIGHT', actionId: 'overload' },
    notes: ['Parent explicite : mitraillette Shuriken ME3 conventionnelle à clips ; la fixture technologique connaît déjà Surcharge.',
      'powerCooldownMultiplier 0,9 est le réglage existant : délai ATB 8→7,2 secondes, sans renforcer les dégâts.'],
    limitations: ['Aucun calcul du poids original ni effet sur une action sans recharge ; le module n’accorde pas Surcharge.',
      'Aucun fusil d’assaut, modèle spécial, autre œuvre ou compatibilité universelle déduit.'],
  },
  {
    recordId: 'ME3-EQP-MEDIGEL', role: 'ressource de secours',
    blockedReason: 'Le banc ne reconstitue pas encore les cibles relevables et la consommation de médi-gel ME3 ; aucun Unity ME1 de remplacement.',
    notes: ['La fiche atteste une ressource de secours ; elle ne fournit pas une table complète de traitement et de consommation.'],
    limitations: ['Aucune valeur de soin, dose, réanimation ou recharge originale supposée.'],
  },
  {
    recordId: 'ME3-EQP-GRENADE-STOCK', role: 'banc de réserve de grenades',
    bench: { kind: 'grenade-stock', parentRecordId: 'ME3-POW-FRAG', actionId: 'fragGrenade' },
    notes: ['Banc de la commande ATB existante de fragmentation : réserve de grenades distincte du chargeur d’arme.',
      'Les charges d’essai sont finies ; une réserve vide interdit un nouvel ordre et le temps ne la remplit pas.'],
    limitations: ['Quantité, dégâts, cadence et zone ATB ne sont pas des valeurs originales certifiées.',
      'Le banc ne reconstitue ni ramassage de mission, classe originale ni toutes les familles de grenades.'],
  },
  {
    recordId: 'ME3-EQP-THERMAL', role: 'banc de clips thermiques',
    bench: { kind: 'thermal-clips', parentRecordId: 'ME3-WPN-AVENGER', actionId: 'reload' },
    notes: ['Banc de recharge de l’Avenger ME3 conventionnel ; chargeur et réserve finie restent distincts.',
      'La recharge native déplace les unités disponibles ; une arme à chaleur propre n’entre pas dans ce banc.'],
    limitations: ['Pas de partage de munitions interœuvre ni de quantité originale certifiée.',
      'Répartition des ramassages, acquisitions et règles des armes spéciales non reproduites.'],
  },
  {
    recordId: 'MEA-EQP-AUGMENT', role: 'augmentations de fabrication',
    blockedReason: 'Aucune augmentation nommée, recette ou effet vérifié ; la fabrication n’est pas remplacée par un module équipé après coup.',
    notes: ['Les augmentations sont intégrées lors de la fabrication ; cette étape reste distincte des ports de modules.'],
    limitations: ['Aucune augmentation générique inventée, recette, matériau, rang ou combinaison accordés.'],
  },
  {
    recordId: 'MEA-EQP-FUSION', role: 'famille de modules de fusion',
    blockedReason: 'La famille ne donne aucun modèle de fusion ni compromis chiffré ; aucun module de défense générique ne lui est substitué.',
    notes: ['Les modules de fusion sont distincts des modules d’arme et des augmentations de fabrication.'],
    limitations: ['Aucun modèle précis, avantage, contrepartie ou compatibilité d’armure originale déduit.'],
  },
  {
    recordId: 'MEA-EQP-WEAPON-MODS', role: 'famille de modules d’arme',
    blockedReason: 'Entrée générale sans module nommé ni parent compatible établi ; aucun receiver, canon ou chargeur MEA inventé par analogie avec ME3.',
    notes: ['L’existence de modifications équipables ne suffit pas à créer des modèles précis ou des statistiques.'],
    limitations: ['Aucun nouveau port, fabricant, rang, compatibilité universelle ou module ME3 transféré dans MEA.'],
  },
  {
    recordId: 'MEA-EQP-WEIGHT', role: 'masse du loadout',
    blockedReason: 'Table des masses et relation complète avec les recharges non reconstituées ; aucune formule originale ou bonus de défense déduit.',
    notes: ['La fiche atteste que l’équipement affecte le profil de jeu, sans fournir une formule complète de poids.'],
    limitations: ['Aucun Ultralight ME3 transféré, masse de modèle ou courbe de récupération originale simulés.'],
  },
  ...[
    ['MEA-EQP-AMMO-FIRE', 'consommable de munitions incendiaires'],
    ['MEA-EQP-AMMO-CRYO', 'consommable de munitions cryogéniques'],
    ['MEA-EQP-AMMO-DISRUPT', 'consommable de munitions disruptives'],
  ].map(([recordId, role]) => ({
    recordId, role,
    blockedReason: 'Durée, nombre de tirs ou de clips et consommation de ce consommable MEA non établis ; aucun mode-pouvoir persistant de ME2/ME3 importé.',
    notes: ['Le manuel MEA décrit un onglet de consommables mais ne spécifie pas la règle de ce type de munition.'],
    limitations: ['Aucun feu, gel, multiplicateur, réserve ou règle de Power Cells déduit de son seul nom.'],
  })),
  {
    recordId: 'MEA-EQP-SHIELD-CAP', role: 'consommable de protection',
    blockedReason: 'Déclenchement, réserve, durée et effet propre du Shield Capacitor non établis ; aucune Barrière ou régénération de substitution.',
    notes: ['La fiche atteste un consommable de protection, sans fournir son protocole complet d’utilisation.'],
    limitations: ['Aucune restauration, capacité de bouclier, immunité ou durée originale inventée.'],
  },
  {
    recordId: 'MEA-EQP-POWER-CELLS', role: 'banc de cellules de pouvoirs',
    bench: { kind: 'power-cells', parentRecordId: 'MEA-POW-FRAG', actionId: 'fragGrenade' },
    notes: ['Manuel MEA anglais p.19 : les pouvoirs numérotés utilisent des cellules finies, ravitaillées aux caches, sans recharge temporelle.',
      'Frag Grenade sert de fixture ATB existante pour observer une réserve de charges ; la preuve primaire générale ne certifie pas son attribution à un pouvoir nommé.',
      'Preuve locale : docs/qa/chronicle-specialist-reference-report.json ; même règle générale dans docs/qa/chronicle-support-reference-report.json.'],
    limitations: ['Le manuel ne donne ici ni quantité originale, ni règle chiffrée de ramassage, ni économie d’actions ATB.',
      'Cellules de pouvoirs, clips d’arme et consommables de munitions restent séparés ; attendre ne rend aucune charge.'],
  },
  {
    recordId: 'INF-EQ-INTEL', role: 'ressource de parcours',
    blockedReason: 'Les données de Cerberus sont une ressource du parcours, sans mécanique de combat ou de protection établie pour ce banc.',
    notes: ['Cette occurrence reste dans Infiltrator ; elle n’ajoute ni renseignement de campagne ni armure.'],
    limitations: ['Aucun score, conversion, amélioration, objectif, renseignement ou lien de campagne originale accordé.'],
  },
  {
    recordId: 'GAL-EQ-SHIELD', role: 'protection rechargeable',
    blockedReason: 'Délais, vitesse et déclenchement de recharge de Galaxy non relevés ; la recharge native ME1 ne constitue pas une preuve de cette règle.',
    notes: ['Le registre atteste des boucliers rechargeables dans Galaxy, sans table chiffrée du mécanisme.'],
    limitations: ['Aucun délai, capacité, couvert ou système d’équipement d’une autre œuvre importé.'],
  },
  {
    recordId: 'GAL-EQ-MED', role: 'ramassage de soin',
    blockedReason: 'Valeur, conditions et déclenchement du ramassage de soin Galaxy non établis ; aucun médi-gel d’une autre œuvre substitué.',
    notes: ['La fiche atteste des ramassages dans les arènes ; elle ne désigne pas un équipement de protection porté.'],
    limitations: ['Aucun soin, stock, réanimation ou règle de mission originale déduit.'],
  },
  {
    recordId: 'RET-REF-IMPLANTS', role: 'implants narratifs',
    blockedReason: 'Implants expérimentaux liés au parcours de Grayson ; aucune mécanique précise de kit ou de protection reconstituée.',
    notes: ['Le caractère modifié de cette technologie n’accorde ni contrôle libre ni capacités de Moissonneur au joueur.'],
    limitations: ['Aucune guérison de Grayson, issue alternative, transformation ou compétence originale attribuée.'],
  },
  {
    recordId: 'NEX-REF-CRYO', role: 'équipement de cryostase',
    blockedReason: 'Référence narrative au réveil de Morda, sans protocole cryogénique ou mécanisme de combat documenté pour ce banc.',
    notes: ['La capsule ne devient ni protection portée ni pouvoir de gel utilisable en combat.'],
    limitations: ['Aucun réveil anticipé, suppression de la révolte ou exil alternatif accordé.'],
  },
  {
    recordId: 'INI-REF-IMPLANT', role: 'implant narratif',
    blockedReason: 'Lien de Cora avec SAM-E dans Initiation ; aucune table de perceptions, aptitude ou implantation jouable reconstituée.',
    notes: ['Cette occurrence reste dans la Voie lactée avant le départ des arches ; aucun kit MEA n’est importé.'],
    limitations: ['SAM-E ne devient pas un compagnon durable ; aucune capacité, rang ou lien narratif alternatif accordé.'],
  },
  {
    recordId: 'ANN-REF-CRYO', role: 'équipement de cryostase',
    blockedReason: 'Cryostase de transport documentée dans Annihilation ; aucune procédure médicale ou aptitude de combat établie.',
    notes: ['Les capsules de voyage ne deviennent ni armure ni commande cryogénique offensive.'],
    limitations: ['Aucun traitement, sauvetage par Ryder, changement du mystère ou prolongement officiel de MEA inventé.'],
  },
  {
    recordId: 'ANN-REF-MICROSCOPE', role: 'matériel d’analyse',
    blockedReason: 'Matériel recherché par Anax pour l’enquête ; aucun protocole d’analyse ou effet de combat vérifié pour ce banc.',
    notes: ['Cette référence reste un instrument documentaire ; le nom ne justifie aucun pouvoir technologique.'],
    limitations: ['Aucune procédure médicale réelle, guérison, décision finale ou résultat d’analyse canonique produit.'],
  },
];

function compile(definition) {
  const record = getUniverseRecord(definition.recordId);
  const work = record && getUniverseWork(record.catalogWorkId);
  if (!record?.fact || record.category !== 'equipment' || !record.availability.length
    || !record.sourceIds.length || record.sourceIds.some(id => !work?.sources.some(source => source.id === id))) {
    throw new Error(`Missing factual equipment provenance: ${definition.recordId}`);
  }
  const blockedReason = definition.blockedReason ?? null;
  return {
    recordId: record.id, mode: 'armor', role: definition.role,
    identityFact: record.description, conditions: record.conditions,
    contextScopes: record.availability.map(scope => ({ mediaId: scope.mediaId, periodIds: [...scope.periodIds] })),
    sourceIds: [...record.sourceIds], provenance: record.provenance,
    simulation: blockedReason ? null : { ...FIXTURE },
    bench: definition.bench ? { ...definition.bench } : null,
    behaviorKind: blockedReason ? 'inspection-only' : 'equipment-bench',
    constraints: { editionProfile: null, blockedReason }, blockedReason,
    statsBasis: blockedReason ? null : 'ATB adaptation',
    notes: [record.description, ...(record.conditions ? [record.conditions] : []), ...definition.notes],
    limitations: [...COMMON_LIMITS, ...definition.limitations],
  };
}

export const EXPANSION2_ARMOR = freeze(definitions.map(compile));
const BY_ID = new Map(EXPANSION2_ARMOR.map(entry => [entry.recordId, entry]));
export function getExpansion2Armor(recordId) {
  return typeof recordId === 'string' ? BY_ID.get(recordId) || null : null;
}
