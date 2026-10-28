// Independent comparisons, never equipment definitions or inventory unlocks.
// Documentary identity, facts, context and sources come from the canonical
// registry by recordId. No source/model/rank is fabricated by this module.
const freeze = value => {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
};

// Absolute statistics of an abstract test carrier, NOT bonuses to add to a
// named character. Speed is the ATB rate (1 = reference), not movement units.
export const EXPANSION_ARMOR_REFERENCE = freeze({ hp: 120, shield: 30, attack: 16, defense: 4, speed: 1 });
const CASES = freeze({
  reference: { stats: EXPANSION_ARMOR_REFERENCE, detail: 'Témoin neutre : aucune supériorité de ce matériel n’est déduite de son nom.' },
  protection: { stats: { hp: 120, shield: 30, attack: 16, defense: 8, speed: .9 }, detail: 'Hypothèse de protection ATB : défense 8, cadence 0,9 ; compromis expérimental, pas une propriété du modèle original.' },
  buffer: { stats: { hp: 120, shield: 50, attack: 16, defense: 4, speed: 1 }, detail: 'Hypothèse de réserve de protection ATB : bouclier 50 ; aucune vitesse de régénération originale n’est simulée.' },
  endurance: { stats: { hp: 145, shield: 25, attack: 16, defense: 4, speed: .95 }, detail: 'Hypothèse d’endurance ATB : santé 145, bouclier 25, cadence 0,95 ; ces valeurs ne proviennent pas de l’œuvre.' },
  mobility: { stats: { hp: 110, shield: 25, attack: 16, defense: 4, speed: 1.1 }, detail: 'Hypothèse de cadence ATB : santé 110, bouclier 25, cadence 1,1 ; aucun bonus de déplacement ou de reconnaissance original certifié.' },
});
const NUMERICAL_LIMIT = 'Statistiques absolues d’un porteur abstrait, adaptées à l’ATB ; aucun chiffre, bonus, classement ou avantage canonique 1:1 certifié.';
const LOADOUT_LIMIT = 'Comparaison isolée uniquement : aucun achat, objet, porteur, slot, droit d’équipement ni transfert dans les anciens inventaires.';
const VISUAL_LIMIT = 'Aucune tenue portée, pièce graphique, animation ou apparence originale supplémentaire créée par cette fiche.';
const PART_LIMIT = 'La pièce reste distincte d’un ensemble complet ; aucun nouveau slot ni cumul avec les armures existantes.';
const FAMILY_LIMIT = 'Famille documentaire seulement : aucune pièce précise, composition complète, rang ou statistique de fabricant déduits.';
const UNKNOWN_ME2_EDITION = 'Édition et distribution de cette pièce ME2 non établies par les preuves locales ; aucune disponibilité standard ou Legendary supposée.';

function comparison(recordId, role, caseId, notes, limitations, editionProfile = null, blockedReason = null) {
  return {
    recordId, mode: 'armor', role,
    simulation: { ...CASES[caseId].stats },
    constraints: { editionProfile, blockedReason },
    blockedReason,
    notes: [
      ...notes,
      CASES[caseId].detail,
      'Le registre documentaire conserve les faits, conditions, sources et segments ; ce profil ne les remplace pas.',
    ],
    limitations: [NUMERICAL_LIMIT, LOADOUT_LIMIT, VISUAL_LIMIT, ...limitations],
  };
}

export const EXPANSION_ARMOR = freeze([
  comparison('ME2-EQP-N7', 'ensemble modulaire', 'reference', [
    'Référence ME2 de l’armure N7 personnalisable ; le témoin ne sélectionne aucune pièce.',
    'Campagne solo de ME2 uniquement ; aucun état du Shepard de campagne n’est importé.',
  ], ['Modularité, achat des pièces et bonus originaux non reconstitués.']),
  comparison('ME2-EQP-KESTREL', 'ensemble modulaire', 'protection', [
    'Ensemble Kestrel documenté dans ME2 ; cas de protection agrégée indépendant.',
    'Profil Legendary explicitement préparé, sans reconstitution du pack ou de l’acquisition originale.',
  ], ['Aucun bonus de set caché, aucune combinaison de pièces ni rang déduits.'], 'legendary'),
  comparison('ME2-EQP-CERBERUS', 'ensemble complet', 'protection', [
    'Ensemble d’assaut Cerberus additionnel de ME2 ; comparaison distincte de la N7 modulaire.',
    'Profil Legendary conservé ; appartenance à Cerberus et droits des personnages non modifiés.',
  ], ['Aucun pouvoir, trait de faction ou bonus d’attaque accordé.'], 'legendary'),
  comparison('ME2-EQP-COLLECTOR', 'ensemble complet', 'protection', [
    'Ensemble des Collecteurs documenté dans ME2 ; comparaison agrégée sous profil Legendary.',
    'L’identité de cette tenue ne transforme pas la biologie du porteur abstrait.',
  ], ['Aucune physiologie de Collecteur ni protection organique originale déduite.'], 'legendary'),
  comparison('ME2-EQP-TERMINUS', 'ensemble complet', 'protection', [
    'Ensemble Terminus documenté dans ME2 ; profil Legendary uniquement.',
    'Le compromis défense/cadence appartient au cas ATB, pas à une table originale de l’armure.',
  ], ['Acquisition promotionnelle ou DLC et valeurs originales non reconstituées.'], 'legendary'),
  comparison('ME2-EQP-BLOOD-DRAGON', 'ensemble promotionnel', 'protection', [
    'Tenue promotionnelle Blood Dragon documentée pour ME2 ; profil Legendary conservé.',
    'La provenance promotionnelle ne devient ni récompense narrative ni acquisition simulée.',
  ], ['Aucun lien de promotion ou équipement d’un autre univers n’est ajouté au récit.'], 'legendary'),
  comparison('ME2-EQP-INFERNO', 'ensemble complet', 'protection', [
    'Ensemble Inferno additionnel de ME2 ; comparaison limitée au profil Legendary.',
    'Le nom ne justifie aucun effet incendiaire ou avantage aux pouvoirs dans ce duel.',
  ], ['Dégâts de feu, puissance des pouvoirs et bonus originaux non reproduits.'], 'legendary'),
  comparison('ME2-EQP-RECON', 'coiffe', 'mobility', [
    'La fiche Recon Hood atteste sa présence au départ en Legendary.',
    'La cadence du porteur abstrait est une hypothèse de comparaison, pas un bonus de la coiffe.',
  ], [PART_LIMIT, 'Aucun bonus original de reconnaissance, de visée ou de dialogue simulé.'], 'legendary'),
  comparison('ME2-EQP-SENTRY', 'visière', 'buffer', [
    'Sentry Interface est documentée comme visière de personnalisation ME2.',
    'La comparaison préparée reste bloquée tant que sa disponibilité d’édition n’est pas établie.',
  ], [PART_LIMIT, 'Aucune régénération, protection ou interface de visée originale certifiée.'], null, UNKNOWN_ME2_EDITION),
  comparison('ME2-EQP-ARCHON', 'visière', 'reference', [
    'Archon Visor est documentée comme visière de personnalisation ME2.',
    'Le témoin reste neutre et bloqué : aucun effet de recharge des pouvoirs n’est déduit du nom.',
  ], [PART_LIMIT, 'Aucune réduction de recharge, puissance biotique ou technologique accordée.'], null, UNKNOWN_ME2_EDITION),
  comparison('ME2-EQP-CAPACITOR', 'casque', 'buffer', [
    'Capacitor Helmet est documenté comme casque de personnalisation ME2.',
    'La réserve expérimentale de protection ne prétend pas reproduire ses condensateurs ; édition non établie.',
  ], [PART_LIMIT, 'Aucun changement du délai ou de la vitesse de régénération d’origine.'], null, UNKNOWN_ME2_EDITION),
  comparison('ME2-EQP-LIFE-SUPPORT', 'pièce modulaire', 'endurance', [
    'Life Support Webbing est une pièce d’armure documentée dans ME2.',
    'Le cas d’endurance est une hypothèse ATB ; la disponibilité d’édition reste à établir.',
  ], [PART_LIMIT, 'Aucune guérison, réanimation, assistance médicale ou valeur originale de santé reproduite.'], null, UNKNOWN_ME2_EDITION),
  comparison('ME2-EQP-ORDNANCE', 'pièce modulaire', 'reference', [
    'Ordnance Packs est une pièce documentaire liée aux réserves lourdes de ME2.',
    'Le témoin neutre ne remplace pas les cellules lourdes par des clips ; disponibilité d’édition non établie.',
  ], [PART_LIMIT, 'Aucune cellule, capacité de munition, recharge ou arme lourde ajoutée.'], null, UNKNOWN_ME2_EDITION),

  comparison('ME3-EQP-N7', 'ensemble modulaire', 'reference', [
    'N7 personnalisable est la référence modulaire documentaire de Shepard dans ME3.',
    'Le duel utilise un porteur abstrait sans personnalisation ni progression de Shepard.',
  ], ['Aucun assemblage de pièces, casque ou bonus original de set reproduit.']),
  comparison('ME3-EQP-AJAX', 'ensemble complet', 'protection', [
    'Cerberus Ajax Armor est documentée pour ME3 avec acquisition différente en Legendary.',
    'Profil Legendary explicitement requis ; aucun parcours d’acquisition n’est reconstitué.',
  ], ['Cette référence est distincte de Cerberus Assault Armor ; aucun trait de faction conféré.'], 'legendary'),
  comparison('ME3-EQP-INFERNO', 'ensemble complet', 'protection', [
    'Inferno Armor est un ensemble additionnel ME3 soumis à une condition de pack ou d’édition.',
    'Profil de comparaison Legendary conservé ; aucun accès standard implicite.',
  ], ['Aucun pouvoir incendiaire, bonus de puissance ou effet original déduit.'], 'legendary'),
  comparison('ME3-EQP-BLOOD-DRAGON', 'ensemble complet', 'protection', [
    'Blood Dragon Armor est documentée dans ME3 avec condition de pack ou d’édition.',
    'Profil Legendary uniquement ; aucune récompense ou tenue animée originale reconstituée.',
  ], ['La provenance promotionnelle ne devient pas une scène canonique de récompense.'], 'legendary'),
  comparison('ME3-EQP-COLLECTOR', 'ensemble complet', 'protection', [
    'Collector Armor est un ensemble additionnel ME3 soumis au profil Legendary de comparaison.',
    'La désignation de la tenue ne modifie ni espèce ni biologie du porteur abstrait.',
  ], ['Aucune immunité, capacité de Collecteur ou valeur originale reconstituée.'], 'legendary'),
  comparison('ME3-EQP-TERMINUS', 'ensemble complet', 'protection', [
    'Terminus Assault Armor est documentée dans ME3 sous condition de pack ou d’édition.',
    'Profil Legendary requis ; la cadence réduite est uniquement le compromis expérimental ATB.',
  ], ['Aucun malus de déplacement original ou rang d’armure certifié.'], 'legendary'),
  comparison('ME3-EQP-CERBERUS', 'ensemble complet', 'protection', [
    'Cerberus Assault Armor est un ensemble ME3 distinct de l’Ajax.',
    'Profil Legendary conservé ; ni combinaison de pièces ni équipement d’un compagnon autorisés.',
  ], ['Aucun changement de faction, droit de porteur ou pouvoir associé à Cerberus.'], 'legendary'),
  comparison('ME3-EQP-ROSENKOV', 'famille modulaire', 'reference', [
    'Le registre atteste des pièces Rosenkov Materials dans ME3.',
    'Le témoin neutre évite d’inventer une composition complète ou un bonus du fabricant.',
  ], [FAMILY_LIMIT, PART_LIMIT]),
  comparison('ME3-EQP-SERRICE', 'famille modulaire', 'reference', [
    'Le registre atteste la famille de pièces Serrice Council dans ME3.',
    'Le témoin reste neutre ; aucune affinité biotique ou statistique de recharge n’est déduite.',
  ], [FAMILY_LIMIT, PART_LIMIT]),
  comparison('ME3-EQP-HANNES', 'famille modulaire', 'reference', [
    'La fiche ME3-EQP-HANNES désigne les pièces Hahne-Kedar ; cet identifiant est conservé tel quel.',
    'Une famille documentaire n’est pas transformée en modèle nommé ou en ensemble complet.',
  ], [FAMILY_LIMIT, PART_LIMIT, 'Aucun bonus de dégâts d’arme original ajouté.']),
  comparison('ME3-EQP-KASSA', 'famille modulaire', 'reference', [
    'Le registre atteste la famille de pièces Kassa Fabrication dans ME3.',
    'Le témoin neutre n’attribue aucune protection supérieure au fabricant.',
  ], [FAMILY_LIMIT, PART_LIMIT]),
  comparison('ME3-EQP-ARIAKE', 'famille modulaire', 'reference', [
    'Le registre atteste la famille de pièces Ariake Technologies dans ME3.',
    'La comparaison neutre n’accorde aucun bonus de mêlée ou d’arme associé au nom.',
  ], [FAMILY_LIMIT, PART_LIMIT]),
  comparison('ME3-EQP-SENTRY', 'casque', 'buffer', [
    'Sentry Interface est documentée comme casque de l’arsenal ME3.',
    'Le bouclier expérimental est un cas ATB indépendant, pas une statistique de cette pièce.',
  ], [PART_LIMIT, 'Aucun zoom, ciblage, affichage de visière ou taux de régénération original simulé.']),
  comparison('ME3-EQP-DEATH-MASK', 'casque', 'protection', [
    'Death Mask est documenté comme casque de l’arsenal ME3.',
    'Le cas de protection reste distinct des dialogues, du charisme et des capacités du porteur source.',
  ], [PART_LIMIT, 'Aucun effet de dialogue, intimidation ou statistiques originales déduit.']),

  comparison('MEA-EQP-INITIATIVE', 'famille d’armure', 'reference', [
    'Initiative Armor est une famille d’armure humaine documentée dans MEA.',
    'Référence neutre de comparaison ; aucun équipement de Ryder ni technologie originale importés.',
  ], ['Pièces, recherche, fabrication et statistiques de modèle non reconstituées.']),
  comparison('MEA-EQP-PATHFINDER', 'ensemble en pièces', 'protection', [
    'Pathfinder Armor est documentée en quatre pièces dans MEA.',
    'Ces quatre pièces ne deviennent pas quatre variantes de simulation ou de nouveaux slots.',
  ], ['Composition, matériaux, fabrication et bonus originaux des quatre pièces non simulés.']),
  comparison('MEA-EQP-N7', 'ensemble d’armure', 'protection', [
    'N7 Armor est documentée dans MEA ; elle reste distincte des références N7 de ME2 et ME3.',
    'Le nom partagé ne transfère aucun porteur, période ou statistique entre œuvres.',
  ], ['Aucun entraînement N7, pouvoir ou profil de Shepard accordé à un personnage de MEA.']),
  comparison('MEA-EQP-HYPERGUARDIAN', 'famille d’armure', 'protection', [
    'Hyperguardian Armor est documentée comme famille d’armure dans MEA.',
    'Le profil de protection est une hypothèse agrégée, pas un effet ou rang d’origine.',
  ], ['Aucune recette, pièce précise ou résistance particulière déduite.']),
  comparison('MEA-EQP-MAVERICK', 'famille d’armure', 'protection', [
    'Maverick Armor est documentée comme famille d’armure dans MEA.',
    'La comparaison de protection n’accorde aucun bonus de visée ou de tête original.',
  ], ['Précision, tirs à la tête, pièces et statistiques originales non reproduits.']),
  comparison('MEA-EQP-ANGARAN', 'famille d’armure', 'protection', [
    'Angaran Armor est une référence d’armure de technologie Heleus dans MEA.',
    'La technologie citée ne prouve aucune compatibilité anatomique ni propriété du porteur abstrait.',
  ], ['Aucune compatibilité d’espèce, fabrication ou régénération originale attribuée.']),
  comparison('MEA-EQP-KETT', 'famille d’armure', 'protection', [
    'Kett Armor est documentée comme famille de technologie kett dans MEA.',
    'Le porteur abstrait n’est pas un personnage exalté ni un combattant kett reconstitué.',
  ], ['Aucune exaltation, transformation biologique ou capacité ennemie conférée.']),
  comparison('MEA-EQP-REMNANT', 'famille d’armure', 'protection', [
    'Remnant Armor est la référence d’armure reliquate du registre MEA.',
    'Le cas agrégé ne remplace pas sa technologie par une pièce générique compatible partout.',
  ], ['Aucune régénération, interface reliquate, augmentation ou fusion originale déduite.']),
  comparison('MEA-EQP-HELEUS', 'famille d’armure', 'protection', [
    'Heleus Armor est documentée comme famille d’armure MEA.',
    'La comparaison reste dans MEA et ne prétend ni découverte de mission ni acquisition.',
  ], ['Aucun modèle de pièce, rang, recette ou effet de technologie Heleus inventé.']),
  comparison('MEA-EQP-SCAVENGER', 'ensemble d’édition', 'protection', [
    'Scavenger Armor est documentée comme armure de l’édition Deluxe de MEA.',
    'Profil Deluxe explicitement requis ; aucun accès standard ni ressource de récupération accordés.',
  ], ['Aucun rendement de récupération, recette, rang ou acquisition d’origine reproduit.'], 'deluxe'),
  comparison('MEA-EQP-DEEP-SPACE', 'ensemble d’édition', 'protection', [
    'Deep Space Explorer Armor est documentée comme armure de l’édition Deluxe de MEA.',
    'Profil Deluxe explicitement requis ; la simulation ne donne pas de protection environnementale originale.',
  ], ['Aucun accès à une zone, résistance au vide ou bonus d’exploration ajouté.'], 'deluxe'),

  comparison('INF-EQ-BODY', 'armure corporelle', 'protection', [
    'Le registre Infiltrator distingue l’armure de corps et le casque.',
    'Le cas de protection ne crée ni ensemble nommé ni équipement de Randall ; cette fiche demeure dans INF.',
  ], ['Source d’équipement indexée seulement ; aucun modèle, rang, casque ou valeur d’Infiltrator reconstitué.']),
  comparison('ASC-REF-SUIT', 'combinaison environnementale', 'reference', [
    'La fiche d’Ascension décrit l’intégrité du masque de Hilo compromise dans l’embuscade.',
    'Inspection narrative avec témoin neutre : aucune armure de combat ni statistique de la combinaison n’est attestée par cette fiche.',
    'Préserver Gillian comme personne et enfant et les événements menant à l’Idenna ; le duel abstrait ne change pas le récit.',
  ], ['Aucun kit jouable de Hilo, protection sous vide, réparation de masque, traitement ou issue narrative alternative simulés.',
    'Source secondaire Golo : publication originale et localisation précise encore nécessaires pour vérifier les détails.']),
]);

const BY_ID = new Map(EXPANSION_ARMOR.map(entry => [entry.recordId, entry]));
export function getExpansionArmor(recordId) {
  return typeof recordId === 'string' ? BY_ID.get(recordId) || null : null;
}
