// Second standalone Simulation selection. These are forty new dossiers, not
// forty new mechanics, acquisitions or canonically reconstructed weapon kits.
// Conventional resource budgets come from each exact existing equipment ID.
import { getUniverseEquipment } from './universe-equipment.js';

const freeze = value => {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
};
const CARRIER = { hp: 300, shield: 40, attack: 24, defense: 3, speed: 1 };
const RESOURCE_FIELDS = ['weaponType', 'weaponSystem', 'magazineCapacity', 'ammo', 'reserveAmmo'];
const ATB_NOTE = 'Porteur et cible abstraits : valeurs et réserves de famille ATB ; aucune fidélité numérique, visuelle ou mécanique 1:1 certifiée.';
const ISOLATION = 'Aucun objet, crédit, compétence, rang, acquisition, formation, droit de porteur ou de scène transféré à la campagne ou aux Chroniques.';
const FIRING_LIMIT = 'Le tir natif de famille ne reproduit ni cadence, précision, dispersion, recul, portée, zoom, pénétration, sons, animations ou géométrie propres au modèle.';
const selected = [
  ['ME2-WPN-PREDATOR', 'Pistolet ME2 : seule la gestion des clips du profil existant est reprise.'],
  ['ME2-WPN-CARNIFEX', 'L’obtention auprès de Mordin n’est ni jouée ni accordée par cet essai.'],
  ['ME2-WPN-SHURIKEN', 'Le tir de famille ATB ne reconstitue pas la séquence de rafale du modèle.'],
  ['ME2-WPN-TEMPEST', 'L’acquisition à Haestrom n’est ni jouée ni accordée par cet essai.'],
  ['ME2-WPN-AVENGER', 'Fusil d’assaut ME2 : aucun rang, amélioration ou kit de porteur n’est déduit.'],
  ['ME2-WPN-VINDICATOR', 'La fiche nomme un fusil à rafales ; le nombre et le rythme des projectiles originaux ne sont pas reproduits.'],
  ['ME2-WPN-KATANA', 'Aucun cône de plombs, chute des dégâts ou capacité originale n’est reconstruit.'],
  ['ME2-WPN-SCIMITAR', 'La cadence et la dispersion propres au Scimitar ne sont pas reconstituées.'],
  ['ME2-WPN-MANTIS', 'Le zoom, la balistique et la capacité propre au Mantis ne sont pas reconstitués.'],
  ['ME2-WPN-VIPER', 'Le rythme des tirs de précision et la capacité propre au Viper ne sont pas reconstitués.'],

  ['ME3-WPN-AVENGER', 'Le modèle ME3 reste distinct du même nom dans ME2 ou Andromeda.'],
  ['ME3-WPN-MATTOCK', 'Le tir semi-automatique réel et ses intervalles ne sont pas reconstitués par l’ordre ATB.'],
  ['ME3-WPN-PHAESTON', 'La provenance turienne n’accorde ni talent racial ni équipement à un personnage nommé.'],
  ['ME3-WPN-SABER', 'La qualification de fusil lourd n’ajoute aucune réserve de cellules ou permission d’arme lourde locale.'],
  ['ME3-WPN-GETH-RIFLE', 'La provenance geth n’accorde ni effet synthétique, ni montée en cadence, ni pouvoir.'],
  ['ME3-WPN-PREDATOR', 'Pistolet ME3 : aucun rang, amélioration ou droit de porteur n’est déduit.'],
  ['ME3-WPN-PHALANX', 'Ce profil ME3 n’ouvre pas la variante de contenu additionnel ME2.'],
  ['ME3-WPN-CARNIFEX', 'La capacité et les dégâts du prototype ne sont pas les valeurs originales du Carnifex.'],
  ['ME3-WPN-PALADIN', 'La capacité et les dégâts du prototype ne sont pas les valeurs originales du Paladin.'],
  ['ME3-WPN-KATANA', 'Le tir ATB ne reproduit pas le cône de plombs ni les distances originales du Katana.'],
  ['ME3-WPN-SCIMITAR', 'Le tir ATB ne reproduit pas la cadence ni la dispersion propres au Scimitar.'],
  ['ME3-WPN-EVISCERATOR', 'Ce profil ME3 n’ouvre pas la variante de contenu additionnel ME2.'],
  ['ME3-WPN-DISCIPLE', 'La provenance asari ne donne aucun pouvoir biotique au porteur abstrait.'],
  ['ME3-WPN-MANTIS', 'Le zoom, la balistique et la capacité propre au Mantis ne sont pas reconstitués.'],
  ['ME3-WPN-BLACK-WIDOW', 'La pénétration du couvert, le zoom et la capacité propres au modèle ne sont pas reproduits.'],
  ['ME3-WPN-SHURIKEN', 'Le tir de famille ATB ne reconstitue pas la séquence de rafale du modèle.'],

  ['MEA-WPN-AVENGER', 'Solo MEA : aucune version de rang ou variante multijoueur déduite.'],
  ['MEA-WPN-MATTOCK', 'Le tir semi-automatique réel n’est pas reconstitué par l’ordre ATB.'],
  ['MEA-WPN-VALKYRIE', 'La séquence de rafale et les propriétés originales du modèle ne sont pas reconstituées.'],
  ['MEA-WPN-PREDATOR', 'Le modèle MEA reste distinct des Predator ME2 et ME3.'],
  ['MEA-WPN-CARNIFEX', 'La capacité et les dégâts du prototype ne sont pas les valeurs originales du Carnifex.'],
  ['MEA-WPN-PHALANX', 'Ce profil MEA n’ouvre pas la variante de contenu additionnel ME2.'],
  ['MEA-WPN-EAGLE', 'La cadence automatique réelle et les améliorations de fabrication ne sont pas reproduites.'],
  ['MEA-WPN-CHARGER', 'La cadence automatique réelle et les améliorations de fabrication ne sont pas reproduites.'],
  ['MEA-WPN-KATANA', 'Aucun cône de plombs, chute des dégâts ou capacité originale n’est reconstruit.'],
  ['MEA-WPN-DISCIPLE', 'La provenance asari ne donne aucun pouvoir biotique au porteur abstrait.'],
  ['MEA-WPN-PIRANHA', 'La cadence et la dispersion propres au Piranha ne sont pas reconstituées.'],
  ['MEA-WPN-MANTIS', 'Le zoom, la balistique et la capacité propre au Mantis ne sont pas reconstitués.'],
  ['MEA-WPN-VIPER', 'Le rythme des tirs de précision et la capacité propre au Viper ne sont pas reconstitués.'],
  ['MEA-WPN-VANQUISHER', 'Aucun rang, recette de fabrication ou bonus propre au Vanquisher n’est accordé.'],
];

function compile([recordId, modelLimit]) {
  const item = getUniverseEquipment(recordId);
  const conventional = item?.id === recordId && item.fact === true && item.category === 'weapons'
    && item.kind === 'weapon' && item.runtimeSupported === true && item.weaponSystem === 'thermal-clip'
    && !item.weaponProfileId && item.requiredCapabilities.length === 1 && item.requiredCapabilities[0] === 'thermal-clip'
    && ['pistol', 'smg', 'assault', 'shotgun', 'sniper'].includes(item.weaponType)
    && Number.isInteger(item.magazineCapacity) && item.magazineCapacity > 0
    && item.ammo === item.magazineCapacity && Number.isInteger(item.reserveAmmo) && item.reserveAmmo >= 0
    && (!item.requiresEdition || ['legendary', 'deluxe'].includes(item.requiredEditionProfile));
  const reason = conventional ? null : item?.lockReason
    || 'Le profil exact conventionnel n’est pas établi ; aucun système de clips de secours ne peut être déduit du nom.';
  return {
    recordId, mode: 'weapon', role: conventional ? 'Épreuve ATB — arme conventionnelle à clips' : 'Inspection — profil conventionnel indisponible',
    behaviorKind: conventional ? 'existing-conventional-equipment' : 'inspection-only',
    mediaId: item?.mediaId || recordId.split('-')[0],
    periodId: item?.mediaId?.toLowerCase() || null,
    name: item?.name || recordId, identityFact: item?.description || '', conditions: item?.conditions || '',
    sourceIds: [...item?.sourceIds || []], sourceBasis: 'existing-equipment-profile-and-catalogue',
    primarySourceVerified: false, statsBasis: 'ATB adaptation',
    simulation: conventional ? { ...CARRIER, equipmentProfileId: recordId,
      ...Object.fromEntries(RESOURCE_FIELDS.map(key => [key, item[key]])), powers: [] } : null,
    constraints: { editionProfile: item?.requiredEditionProfile || null }, blockedReason: reason,
    notes: [ATB_NOTE, ISOLATION,
      'Profil de ressource exact repris par identifiant depuis getUniverseEquipment ; sa capacité et sa réserve restent des réglages ATB existants, pas une table officielle.',
      'La présence d’une fiche n’accorde aucune arme de même nom dans une autre œuvre, une édition ou un mode multijoueur.'],
    limitations: [modelLimit, FIRING_LIMIT,
      'Ce dossier réutilise une primitive de tir et un budget déjà présents ; il ne constitue pas une nouvelle mécanique originale.',
      'Les restrictions de classe, recherche et acquisition restent hors de cet essai sur porteur abstrait et ne sont jamais levées dans le jeu.'],
  };
}

export const EXPANSION2_WEAPONS = freeze(selected.map(compile));
const byId = new Map(EXPANSION2_WEAPONS.map(record => [record.recordId, record]));
/** Lookup is not context, edition, acquisition or campaign permission. */
export function getExpansion2Weapon(recordId) {
  return typeof recordId === 'string' ? byId.get(recordId) || null : null;
}
