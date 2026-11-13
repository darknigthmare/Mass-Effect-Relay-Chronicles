// Third study selection. Exact catalogue occurrences are distinct from both
// earlier lots; a catalogue name never supplies missing mechanics or edition
// permission. Only the eighteen remaining supported conventional profiles run.
import { getUniverseRecord, getUniverseWork } from './universe-data.js';
import { getUniverseEquipment } from './universe-equipment.js';

const freeze = value => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze); Object.freeze(value);
  }
  return value;
};
const CARRIER = { hp: 300, shield: 40, attack: 24, defense: 3, speed: 1 };
const RESOURCE_FIELDS = ['weaponType', 'weaponSystem', 'magazineCapacity', 'ammo', 'reserveAmmo'];
const ATB_NOTE = 'Porteur et cible abstraits : valeurs et réserves de famille ATB ; aucune fidélité numérique, visuelle ou mécanique 1:1 certifiée.';
const ISOLATION = 'Aucun objet, crédit, compétence, rang, acquisition, formation, droit de porteur ou de scène transféré à la campagne ou aux Chroniques.';
const FIRING_LIMIT = 'Le tir natif de famille ne reproduit ni cadence, précision, dispersion, recul, portée, zoom, pénétration, sons, animations ou géométrie propres au modèle.';

const supported = [
  ['ME3-WPN-VINDICATOR', 'La rafale originale et le nombre de projectiles ne sont pas reconstitués par un ordre de tir ATB.'],
  ['ME3-WPN-REVENANT', 'Le gabarit ME3 ne déverrouille pas le Revenant ME2, dont les restrictions de spécialisation restent fermées.'],
  ['ME3-WPN-TALON', 'La dispersion du pistolet ne reçoit ni cône de plombs ni dégâts par projectile inventés.'],
  ['ME3-WPN-CLAYMORE', 'Ce profil ME3 ne lève aucune restriction de porteur, recherche ou spécialisation du Claymore ME2.'],
  ['ME3-WPN-VIPER', 'Le zoom, les intervalles semi-automatiques et la capacité originale du modèle restent non reconstitués.'],
  ['ME3-WPN-WIDOW', 'La pénétration, le zoom et la capacité originale de la Widow ne sont pas reproduits ; aucun droit de recherche ME2 n’est accordé.'],
  ['ME3-WPN-RAPTOR', 'La séquence semi-automatique originale n’est pas certifiée par la cadence des ordres ATB.'],
  ['ME3-WPN-TEMPEST', 'La cadence automatique et le comportement original du modèle ne sont pas reconstitués.'],
  ['ME3-WPN-LOCUST', 'Le profil ME3 n’accorde ni mission Kasumi ni arme de la version ME2.'],
  ['ME3-WPN-HORNET', 'La séquence de rafale originale n’est pas reproduite par le tir générique de famille.'],
  ['MEA-WPN-CYCLONE', 'La montée en cadence, les rangs et les améliorations de fabrication ne sont pas reconstitués.'],
  ['MEA-WPN-REVENANT', 'Le profil solo MEA n’accorde aucune variante ME2, ME3 ou multijoueur.'],
  ['MEA-WPN-HORNET', 'La classification pistolet provient du profil MEA exact ; aucune classification de mitraillette ME3 n’est importée.'],
  ['MEA-WPN-SIDEWINDER', 'Le mécanisme de revolver, les animations et les valeurs originales ne sont pas reproduits.'],
  ['MEA-WPN-TALON', 'La dispersion propre au pistolet et les améliorations de fabrication restent non reconstituées.'],
  ['MEA-WPN-RUZAD', 'Aucune formation krogan, dispersion, recette ou statistique originale n’est déduite du nom.'],
  ['MEA-WPN-BLACK-WIDOW', 'La pénétration, le zoom et la capacité originale ne sont pas reproduits ; aucun rang ni recette n’est accordé.'],
  ['MEA-WPN-INDRA', 'Le tir automatique de précision original ne reçoit pas sa cadence, son zoom ou ses valeurs d’origine.'],
];

// All twenty-two closed references deliberately retain their existing lock.
// This brings spin-off and novel occurrences into inspection without borrowing
// a similarly named gun or converting a narrative object into a combat item.
const consultations = [
  ['ME2-WPN-PHALANX', 'Le contenu additionnel ME2 n’a pas de droit d’édition configuré pour cet essai ; aucun accès Legendary implicite.'],
  ['ME2-WPN-LOCUST', 'La mission Kasumi et son accès ne sont pas reproduits ; le Locust ME3 ne remplace pas cette occurrence.'],
  ['ME2-WPN-REVENANT', 'Les restrictions de porteur et de spécialisation ME2 restent à reconstituer ; le profil ME3 ne les contourne pas.'],
  ['ME2-WPN-MATTOCK', 'Le contenu additionnel ME2 et son acquisition restent à configurer ; aucune conversion du Mattock ME3 ou MEA.'],
  ['ME2-WPN-GETH-RIFLE', 'La condition d’obtention à Haestrom selon édition et difficulté reste à vérifier ; aucune autorisation de porteur n’est accordée.'],
  ['ME2-WPN-COLLECTOR-RIFLE', 'La disponibilité du contenu de cette occurrence reste non configurée ; l’association aux Collecteurs ne constitue pas un droit d’équipement.'],
  ['ME2-WPN-CLAYMORE', 'Les règles de classe et de recherche pour Shepard ou Grunt restent obligatoires ; aucun droit de porteur n’est fabriqué.'],
  ['ME2-WPN-EVISCERATOR', 'Le contenu additionnel ME2 reste non configuré ; aucune permission n’est empruntée au modèle ME3.'],
  ['ME2-WPN-WIDOW', 'Les choix, porteurs et recherches appropriés de ME2 restent à reconstituer ; la Widow ME3 ne les remplace pas.'],
  ['ME2-WPN-INCISOR', 'Le contenu additionnel et la disponibilité ME2 restent non configurés ; aucun profil d’Infiltrator n’est substitué.'],
  ['ME2-WPN-BLACKSTORM', 'La réserve de cellules, le ciblage et l’effet propre de l’arme lourde restent absents ; aucun chargeur conventionnel de secours.'],
  ['INF-WPN-MATTOCK', 'Mattock Auto d’Infiltrator : le nom ne permet ni recharge ME2 ni système thermique ME1 ; la mécanique propre reste fermée.'],
  ['INF-WPN-EVISCERATOR', 'La mécanique propre à Infiltrator reste non reconstituée ; aucun système d’un Eviscerator ME2 ou ME3 n’est importé.'],
  ['INF-WPN-INCISOR', 'La mécanique propre à Infiltrator reste non reconstituée ; aucune rafale ou réserve d’un autre opus n’est attribuée.'],
  ['INF-WPN-PARTICLE', 'Le rayon d’Infiltrator reste non reconstitué ; aucune réserve à clips ou chauffe d’un homonyme n’est attribuée.'],
  ['GAL-WPN-AVENGER', 'L’Avenger de Jacob dans Galaxy ne reçoit ni gestion thermique ME1 ni clips ME2 sur la seule base du nom.'],
  ['GAL-WPN-GRENADE', 'La fiche décrit un projectile du système de pouvoirs, sans modèle d’arme équipable ni quantité de grenades attestée.'],
  ['REV-REF-CANNON', 'Le canon de Skarr reste un objet narratif : aucun modèle lourd, munition, dégât ou résultat contre l’Iwo Jima n’est inventé.'],
  ['ASC-REF-STUN', 'L’étourdisseur de Jiro ne devient ni Surcharge ni un pistolet nommé ; aucune attaque ou conséquence du récit n’est reproduite.'],
  ['RET-REF-SHOTGUN', 'Le fusil à pompe d’Anderson n’est pas identifié à un modèle précis ; aucun Katana, clip, dégât ou résultat contre Grayson n’est déduit.'],
  ['INI-REF-RIFLES', 'Les modèles précis restent à vérifier : aucun fusil nommé, stock ou kit de combat n’est attribué aux survivants.'],
  ['ANN-REF-LOCKER', 'L’armoire de sécurité n’atteste pas de modèles précis ; aucun inventaire, calibre ou permission d’emploi n’est créé.'],
];

function compile([recordId, modelLimit], executable) {
  const record = getUniverseRecord(recordId), item = getUniverseEquipment(recordId);
  const work = record && getUniverseWork(record.mediaId);
  if (!record?.fact || record.category !== 'weapons' || !record.availability.length || !work || work.locked
    || !record.sourceIds.length || record.sourceIds.some(id => !work.sources.some(source => source.id === id))) {
    throw new Error(`Invalid third-batch weapon identity: ${recordId}`);
  }
  const conventional = item?.id === recordId && item.fact === true && item.kind === 'weapon'
    && item.runtimeSupported === true && item.weaponSystem === 'thermal-clip' && !item.weaponProfileId
    && item.requiredCapabilities.length === 1 && item.requiredCapabilities[0] === 'thermal-clip'
    && ['pistol', 'smg', 'assault', 'shotgun', 'sniper'].includes(item.weaponType)
    && Number.isInteger(item.magazineCapacity) && item.magazineCapacity > 0
    && item.ammo === item.magazineCapacity && Number.isInteger(item.reserveAmmo) && item.reserveAmmo >= 0
    && !item.requiresEdition;
  if (executable && !conventional) throw new Error(`Unsupported third-batch conventional profile: ${recordId}`);
  return {
    recordId, mode: 'weapon',
    role: executable ? 'Épreuve ATB — arme conventionnelle à clips' : 'Inspection — mécanique ou accès non reconstitué',
    behaviorKind: executable ? 'existing-conventional-equipment' : 'inspection-only',
    mediaId: record.mediaId, periodId: record.availability[0].periodIds[0],
    name: record.name, identityFact: record.description, conditions: record.conditions,
    sourceIds: [...record.sourceIds], sourceEntryIds: [record.id],
    sourceBasis: 'existing-equipment-profile-and-catalogue', primarySourceVerified: false,
    statsBasis: executable ? 'ATB adaptation' : null,
    simulation: executable ? { ...CARRIER, equipmentProfileId: recordId,
      ...Object.fromEntries(RESOURCE_FIELDS.map(key => [key, item[key]])), powers: [] } : null,
    constraints: { editionProfile: null },
    blockedReason: executable ? null : `${item?.lockReason || 'Mécanique du modèle non reconstituée.'} ${modelLimit}`,
    notes: [record.description, ...(record.conditions ? [record.conditions] : []), ISOLATION,
      executable ? ATB_NOTE : 'Consultation uniquement : aucune statistique de combat, réserve, attaque ou équivalence de modèle n’est attribuée.',
      'Occurrence limitée à son œuvre et ses segments attestés ; aucun droit de scène, d’édition ou de porteur n’est déduit de sa présence.'],
    limitations: [modelLimit,
      ...(executable ? [FIRING_LIMIT, 'Cet essai réutilise une primitive et un budget existants ; il ne constitue pas une nouvelle mécanique originale.']
        : ['Les paramètres et comportements manquants gardent l’exercice fermé, y compris si une édition est choisie manuellement.']),
      'Aucun nouveau sprite, son, animation ou modèle original n’est fourni par ce dossier.'],
    contextScopes: record.availability.map(scope => ({ mediaId: scope.mediaId, periodIds: [...scope.periodIds] })),
    provenance: {
      catalogPath: record.provenance.catalogPath, reference: record.reference,
      verification: 'Faits brefs des sources existantes ; aucun nouveau contrôle primaire des statistiques ou de la mécanique originale.',
      sources: record.sourceIds.map(id => ({ ...work.sources.find(source => source.id === id) })),
    },
  };
}

export const EXPANSION3_WEAPONS = freeze([
  ...supported.map(definition => compile(definition, true)),
  ...consultations.map(definition => compile(definition, false)),
]);
const byId = new Map(EXPANSION3_WEAPONS.map(entry => [entry.recordId, entry]));
/** Identity lookup grants neither access nor campaign inventory. */
export const getExpansion3Weapon = recordId => typeof recordId === 'string' ? byId.get(recordId) || null : null;
