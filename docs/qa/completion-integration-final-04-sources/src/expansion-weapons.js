// Standalone, bounded Simulation dossiers. These are not campaign equipment,
// acquisition permissions, new squad kits or forty new original mechanics.
// Known special weapons reuse their exact native profile. Unknown mechanics,
// local heavy weapons and unconfigured edition models remain non-executable.
import { getUniverseWeaponProfile } from './universe-weapon-profiles.js';

const freeze = value => {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
};

// One abstract test carrier budget, deliberately shared across all models.
// These values describe neither Shepard/Ryder nor original weapon statistics.
const carrier = { hp: 300, shield: 40, attack: 24, defense: 3, speed: 1 };
const ATB_NOTE = 'Simulation indépendante sur porteur et cible abstraits ; budgets ATB, aucune fidélité numérique, visuelle ou mécanique 1:1 certifiée.';
const NO_TRANSFER = 'Aucun objet, crédit, recherche, compétence, déblocage, stock ou permission de porteur/scène transféré à la campagne ou aux Chroniques.';
const SOLO_NOTE = 'Dossier de cette œuvre et de ce segment uniquement ; aucun rang, mode multijoueur ou homonyme d’une autre œuvre n’est déduit.';
const definitions = [
  {
    "recordId": "ME3-WPN-FALCON",
    "mediaId": "ME3",
    "periodId": "me3",
    "name": "M-37 Falcon",
    "identityFact": "Lance-grenades classé fusil.",
    "conditions": "",
    "sourceIds": [
      "ME3-SRC-EQUIP"
    ],
    "mechanic": "native"
  },
  {
    "recordId": "ME3-WPN-SCORPION",
    "mediaId": "ME3",
    "periodId": "me3",
    "name": "Scorpion",
    "identityFact": "Pistolet à projectile explosif.",
    "conditions": "",
    "sourceIds": [
      "ME3-SRC-EQUIP"
    ],
    "mechanic": "native"
  },
  {
    "recordId": "MEA-WPN-SCORPION",
    "mediaId": "MEA",
    "periodId": "mea",
    "name": "Scorpion",
    "identityFact": "Pistolet explosif.",
    "conditions": "Solo ; les valeurs, versions de rang et adaptations multijoueurs sont des données séparées.",
    "sourceIds": [
      "MEA-SRC-WEAPONS"
    ],
    "mechanic": "native"
  },
  {
    "recordId": "MEA-WPN-PAW",
    "mediaId": "MEA",
    "periodId": "mea",
    "name": "P.A.W.",
    "identityFact": "Arme à rayon.",
    "conditions": "Solo ; les valeurs, versions de rang et adaptations multijoueurs sont des données séparées.",
    "sourceIds": [
      "MEA-SRC-WEAPONS"
    ],
    "mechanic": "native"
  },
  {
    "recordId": "MEA-WPN-REEGAR",
    "mediaId": "MEA",
    "periodId": "mea",
    "name": "Reegar Carbine",
    "identityFact": "Fusil électrique.",
    "conditions": "Solo ; les valeurs, versions de rang et adaptations multijoueurs sont des données séparées.",
    "sourceIds": [
      "MEA-SRC-WEAPONS"
    ],
    "mechanic": "native"
  },
  {
    "recordId": "MEA-WPN-SWEEPER",
    "mediaId": "MEA",
    "periodId": "mea",
    "name": "Sweeper",
    "identityFact": "Fusil reliquat.",
    "conditions": "Solo ; les valeurs, versions de rang et adaptations multijoueurs sont des données séparées.",
    "sourceIds": [
      "MEA-SRC-SWEEPER"
    ],
    "mechanic": "native"
  },
  {
    "recordId": "ME3-WPN-PARTICLE",
    "mediaId": "ME3",
    "periodId": "me3",
    "name": "Particle Rifle",
    "identityFact": "Arme prothéenne de From Ashes.",
    "conditions": "DLC / Legendary.",
    "sourceIds": [
      "ME3-SRC-PARTICLE"
    ],
    "mechanic": "native"
  },
  {
    "recordId": "ME3-WPN-LANCER",
    "mediaId": "ME3",
    "periodId": "me3",
    "name": "M-7 Lancer",
    "identityFact": "Arme du DLC Citadel.",
    "conditions": "DLC Citadel.",
    "sourceIds": [
      "ME3-SRC-SUPPRESSOR"
    ],
    "mechanic": "native"
  },
  {
    "recordId": "ME3-WPN-ARC",
    "mediaId": "ME3",
    "periodId": "me3",
    "name": "Arc Pistol",
    "identityFact": "Pistolet énergétique.",
    "conditions": "",
    "sourceIds": [
      "ME3-SRC-EQUIP"
    ],
    "mechanic": "native"
  },
  {
    "recordId": "ME3-WPN-GRAAL",
    "mediaId": "ME3",
    "periodId": "me3",
    "name": "Graal Spike Thrower",
    "identityFact": "Arme à pointes.",
    "conditions": "",
    "sourceIds": [
      "ME3-SRC-EQUIP"
    ],
    "mechanic": "native"
  },
  {
    "recordId": "ME3-WPN-JAVELIN",
    "mediaId": "ME3",
    "periodId": "me3",
    "name": "Javelin",
    "identityFact": "Fusil geth de précision.",
    "conditions": "",
    "sourceIds": [
      "ME3-SRC-EQUIP"
    ],
    "mechanic": "native"
  },
  {
    "recordId": "MEA-WPN-EQUALIZER",
    "mediaId": "MEA",
    "periodId": "mea",
    "name": "Equalizer",
    "identityFact": "Pistolet reliquat.",
    "conditions": "Solo ; les valeurs, versions de rang et adaptations multijoueurs sont des données séparées.",
    "sourceIds": [
      "MEA-SRC-WEAPONS"
    ],
    "mechanic": "native"
  },
  {
    "recordId": "MEA-WPN-SCATTERSHOT",
    "mediaId": "MEA",
    "periodId": "mea",
    "name": "Scattershot",
    "identityFact": "Fusil reliquat.",
    "conditions": "Solo ; les valeurs, versions de rang et adaptations multijoueurs sont des données séparées.",
    "sourceIds": [
      "MEA-SRC-WEAPONS"
    ],
    "mechanic": "native"
  },
  {
    "recordId": "MEA-WPN-VENOM",
    "mediaId": "MEA",
    "periodId": "mea",
    "name": "Venom",
    "identityFact": "Fusil à projectiles explosifs.",
    "conditions": "Solo ; les valeurs, versions de rang et adaptations multijoueurs sont des données séparées.",
    "sourceIds": [
      "MEA-SRC-WEAPONS"
    ],
    "mechanic": "native"
  },
  {
    "recordId": "MEA-WPN-OMNIBLADE",
    "mediaId": "MEA",
    "periodId": "mea",
    "name": "Omni-Blade",
    "identityFact": "Arme de mêlée.",
    "conditions": "Solo ; les valeurs, versions de rang et adaptations multijoueurs sont des données séparées.",
    "sourceIds": [
      "MEA-SRC-MELEE"
    ],
    "mechanic": "contact",
    "missing": "Fente, portée au sol, cellule de retour, mouvement et animation de lame non reproduits."
  },
  {
    "recordId": "MEA-WPN-ASARI-SWORD",
    "mediaId": "MEA",
    "periodId": "mea",
    "name": "Asari Sword",
    "identityFact": "Arme de mêlée.",
    "conditions": "Solo ; les valeurs, versions de rang et adaptations multijoueurs sont des données séparées.",
    "sourceIds": [
      "MEA-SRC-MELEE"
    ],
    "mechanic": "contact",
    "missing": "Approche biotique, déplacement, invulnérabilité éventuelle, collisions et animation de lame non reproduits ; aucun pouvoir biotique accordé."
  },
  {
    "recordId": "MEA-WPN-KROGAN-HAMMER",
    "mediaId": "MEA",
    "periodId": "mea",
    "name": "Krogan Hammer",
    "identityFact": "Arme de mêlée.",
    "conditions": "Solo ; les valeurs, versions de rang et adaptations multijoueurs sont des données séparées.",
    "sourceIds": [
      "MEA-SRC-MELEE"
    ],
    "mechanic": "contact",
    "missing": "Préparation lourde, choc au sol, zone et animation du marteau non reproduits ; une seule cible abstraite est frappée."
  },
  {
    "recordId": "MEA-WPN-FIRAAN",
    "mediaId": "MEA",
    "periodId": "mea",
    "name": "Angaran Firaan",
    "identityFact": "Arme de mêlée angara.",
    "conditions": "Solo ; les valeurs, versions de rang et adaptations multijoueurs sont des données séparées.",
    "sourceIds": [
      "MEA-SRC-MELEE"
    ],
    "mechanic": "contact",
    "missing": "Combo, direction des coups, reprise et animation de la lame angara non reproduits."
  },
  {
    "recordId": "MEA-WPN-CARFALON",
    "mediaId": "MEA",
    "periodId": "mea",
    "name": "Kett Carfalon",
    "identityFact": "Arme de mêlée kett.",
    "conditions": "Solo ; les valeurs, versions de rang et adaptations multijoueurs sont des données séparées.",
    "sourceIds": [
      "MEA-SRC-MELEE"
    ],
    "mechanic": "contact",
    "missing": "Propriétés de soin, forme du contact, mouvement et animation non reproduits ; aucun soin accordé."
  },
  {
    "recordId": "MEA-WPN-VAKARSH",
    "mediaId": "MEA",
    "periodId": "mea",
    "name": "Kett Vakarsh",
    "identityFact": "Arme de mêlée kett.",
    "conditions": "Solo ; les valeurs, versions de rang et adaptations multijoueurs sont des données séparées.",
    "sourceIds": [
      "MEA-SRC-MELEE"
    ],
    "mechanic": "contact",
    "missing": "Vitesse, forme du contact, mouvement et animation propres à cette lame kett non reproduits."
  },
  {
    "recordId": "MEA-WPN-CRYO-GAUNTLET",
    "mediaId": "MEA",
    "periodId": "mea",
    "name": "Remnant Cryo-Gauntlet",
    "identityFact": "Arme de mêlée reliquate.",
    "conditions": "Solo ; les valeurs, versions de rang et adaptations multijoueurs sont des données séparées.",
    "sourceIds": [
      "MEA-SRC-MELEE"
    ],
    "mechanic": "contact",
    "missing": "Effet cryogénique, ralentissement, résistances et animation du gantelet non reproduits ; aucun gel ni pouvoir accordé."
  },
  {
    "recordId": "MEA-WPN-BIOTIC-AMP",
    "mediaId": "MEA",
    "periodId": "mea",
    "name": "Biotic Amplifier",
    "identityFact": "Arme de mêlée biotique.",
    "conditions": "Solo ; les valeurs, versions de rang et adaptations multijoueurs sont des données séparées.",
    "sourceIds": [
      "MEA-SRC-MELEE"
    ],
    "mechanic": "contact",
    "missing": "Impulsion biotique, dépense propre, interactions et animation non reproduites ; aucun pouvoir biotique accordé."
  },
  {
    "recordId": "ME2-WPN-GETH-SHOTGUN",
    "mediaId": "ME2",
    "periodId": "me2",
    "name": "Geth Plasma Shotgun",
    "identityFact": "Fusil plasma geth.",
    "conditions": "",
    "sourceIds": [
      "ME2-SRC-GETH-SG"
    ],
    "mechanic": "blocked",
    "reason": "Le tir chargé propre à ce modèle ME2 reste à établir. Le profil Graal de ME3 ne constitue pas une preuve ni un remplacement."
  },
  {
    "recordId": "ME2-WPN-GRENADE",
    "mediaId": "ME2",
    "periodId": "me2",
    "name": "M-100 Grenade Launcher",
    "identityFact": "Arme lourde de ME2.",
    "conditions": "",
    "sourceIds": [
      "ME2-SRC-HEAVY"
    ],
    "mechanic": "blocked",
    "reason": "Arme lourde ME2 : réserve de cellules, trajectoire et explosion propres au modèle non reconstituées ; aucun clip conventionnel de secours."
  },
  {
    "recordId": "ME2-WPN-MISSILE",
    "mediaId": "ME2",
    "periodId": "me2",
    "name": "ML-77 Missile Launcher",
    "identityFact": "Arme lourde de recherche.",
    "conditions": "",
    "sourceIds": [
      "ME2-SRC-HEAVY"
    ],
    "mechanic": "blocked",
    "reason": "Arme lourde de recherche ME2 : acquisition, cellules et guidage ne sont pas reconstitués."
  },
  {
    "recordId": "ME2-WPN-AVALANCHE",
    "mediaId": "ME2",
    "periodId": "me2",
    "name": "M-622 Avalanche",
    "identityFact": "Arme lourde cryogénique.",
    "conditions": "",
    "sourceIds": [
      "ME2-SRC-HEAVY"
    ],
    "mechanic": "blocked",
    "reason": "Arme lourde cryogénique ME2 : cellules, rayon ou projectile, gel et portée ne sont pas reconstitués."
  },
  {
    "recordId": "ME2-WPN-CAIN",
    "mediaId": "ME2",
    "periodId": "me2",
    "name": "M-920 Cain",
    "identityFact": "Arme lourde à charge.",
    "conditions": "",
    "sourceIds": [
      "ME2-SRC-CAIN"
    ],
    "mechanic": "blocked",
    "reason": "Arme lourde à charge ME2 : réserve, seuil de charge et explosion propres au Cain ne sont pas reconstitués."
  },
  {
    "recordId": "ME2-WPN-PARTICLE",
    "mediaId": "ME2",
    "periodId": "me2",
    "name": "Collector Particle Beam",
    "identityFact": "Arme lourde de faisceau.",
    "conditions": "",
    "sourceIds": [
      "ME2-SRC-HEAVY"
    ],
    "mechanic": "blocked",
    "reason": "Arme lourde à faisceau ME2 : cellules et faisceau propres au Collector Particle Beam non reconstitués. Le Particle Rifle de ME3 ne donne aucune permission."
  },
  {
    "recordId": "ME2-WPN-FIRESTORM",
    "mediaId": "ME2",
    "periodId": "me2",
    "name": "M-451 Firestorm",
    "identityFact": "Arme lourde incendiaire.",
    "conditions": "Mission de Zaeed / disponibilité à confirmer par édition.",
    "sourceIds": [
      "ME2-SRC-HEAVY"
    ],
    "mechanic": "blocked",
    "reason": "Mission de Zaeed et édition non établies pour cet essai ; réserve lourde et jet incendiaire non reconstitués."
  },
  {
    "recordId": "ME2-WPN-ARC",
    "mediaId": "ME2",
    "periodId": "me2",
    "name": "Arc Projector",
    "identityFact": "Arme lourde Cerberus.",
    "conditions": "",
    "sourceIds": [
      "ME2-SRC-HEAVY",
      "ME2-SRC-EA-DLC"
    ],
    "mechanic": "blocked",
    "reason": "Arme lourde Cerberus ME2 : contenu additionnel, cellules et décharges propres à Arc Projector non reconstitués. Le pistolet Arc de ME3 est distinct."
  },
  {
    "recordId": "ME3-WPN-CHAKRAM",
    "mediaId": "ME3",
    "periodId": "me3",
    "name": "Chakram Launcher",
    "identityFact": "Arme additionnelle de ME3.",
    "conditions": "Disponibilité selon édition et pack.",
    "sourceIds": [
      "ME3-SRC-CHAKRAM"
    ],
    "mechanic": "blocked",
    "reason": "Pack, édition et mécanisme de projectile propres à Chakram Launcher non établis ; aucun accès déduit de Legendary."
  },
  {
    "recordId": "ME3-WPN-ADAS",
    "mediaId": "ME3",
    "periodId": "me3",
    "name": "Adas Anti-Synthetic Rifle",
    "identityFact": "Fusil de l’arsenal étendu.",
    "conditions": "Pack / édition à vérifier.",
    "sourceIds": [
      "ME3-SRC-EQUIP"
    ],
    "mechanic": "blocked",
    "reason": "Pack, édition et projectile électrique propres à Adas non établis ; aucun profil de fusil à clips substitué."
  },
  {
    "recordId": "ME3-WPN-ACOLYTE",
    "mediaId": "ME3",
    "periodId": "me3",
    "name": "Acolyte",
    "identityFact": "Arme de l’arsenal étendu.",
    "conditions": "Pack / édition à vérifier.",
    "sourceIds": [
      "ME3-SRC-EQUIP"
    ],
    "mechanic": "blocked",
    "reason": "Pack, édition et projectile chargé propres à Acolyte non établis ; aucun profil Arc substitué."
  },
  {
    "recordId": "ME3-WPN-REEGAR",
    "mediaId": "ME3",
    "periodId": "me3",
    "name": "Reegar Carbine",
    "identityFact": "Arme électrique de courte portée.",
    "conditions": "Pack / édition à vérifier.",
    "sourceIds": [
      "ME3-SRC-EQUIP"
    ],
    "mechanic": "blocked",
    "reason": "Pack et édition ME3 non établis ; le profil Reegar MEA ne peut pas être transposé par homonymie."
  },
  {
    "recordId": "ME3-WPN-VENOM",
    "mediaId": "ME3",
    "periodId": "me3",
    "name": "Venom",
    "identityFact": "Arme de l’arsenal étendu.",
    "conditions": "Solo selon pack ; aussi Reckoning multi.",
    "sourceIds": [
      "ME3-SRC-EQUIP",
      "ME3-SRC-BW-CITADEL"
    ],
    "mechanic": "blocked",
    "reason": "Disponibilité solo selon pack et variante multijoueur distincte ; le profil Venom MEA ne donne aucune permission ME3."
  },
  {
    "recordId": "ME3-WPN-HYDRA",
    "mediaId": "ME3",
    "periodId": "me3",
    "name": "M-560 Hydra — local",
    "identityFact": "Lanceur lourd local.",
    "conditions": "Rencontre du site de bombe.",
    "sourceIds": [
      "ME3-SRC-HYDRA"
    ],
    "mechanic": "blocked",
    "reason": "Arme lourde locale du site de bombe : scène, ramassage, réserve et lanceur Hydra non reconstitués."
  },
  {
    "recordId": "ME3-WPN-BLACKSTAR",
    "mediaId": "ME3",
    "periodId": "me3",
    "name": "Reaper Blackstar — local",
    "identityFact": "Arme lourde trouvée en mission.",
    "conditions": "Ramassage en mission compatible.",
    "sourceIds": [
      "ME3-SRC-BLACKSTAR"
    ],
    "mechanic": "blocked",
    "reason": "Arme lourde ramassée en mission : emplacement, réserve et effet Blackstar non reconstitués ; aucun inventaire permanent accordé."
  },
  {
    "recordId": "MEA-WPN-LANAT",
    "mediaId": "MEA",
    "periodId": "mea",
    "name": "Lanat",
    "identityFact": "Fusil angara de précision.",
    "conditions": "Solo ; les valeurs, versions de rang et adaptations multijoueurs sont des données séparées.",
    "sourceIds": [
      "MEA-SRC-WEAPONS"
    ],
    "mechanic": "blocked",
    "reason": "Mécanisme de charge et de projectile propre au Lanat non établi ; son nom et sa famille ne justifient pas un profil de sniper à clips."
  },
  {
    "recordId": "MEA-WPN-PIONEER",
    "mediaId": "MEA",
    "periodId": "mea",
    "name": "Pathfinder Pioneer",
    "identityFact": "Arme du pack Pathfinder Elite.",
    "conditions": "Pack Pathfinder Elite / édition compatible ; vérifier la voie d’acquisition.",
    "sourceIds": [
      "MEA-SRC-WEAPONS"
    ],
    "mechanic": "blocked",
    "reason": "Pack Pathfinder Elite, édition, acquisition et fonctionnement propre à Pioneer non établis ; aucun accès déduit de Deluxe."
  },
  {
    "recordId": "MEA-WPN-DEEP-IMPACT",
    "mediaId": "MEA",
    "periodId": "mea",
    "name": "Pathfinder Deep Impact",
    "identityFact": "Arme du pack Pathfinder Elite.",
    "conditions": "Pack Pathfinder Elite / édition compatible ; vérifier la voie d’acquisition.",
    "sourceIds": [
      "MEA-SRC-WEAPONS"
    ],
    "mechanic": "blocked",
    "reason": "Pack Pathfinder Elite, édition, acquisition et fonctionnement propre à Deep Impact non établis ; aucun accès déduit de Deluxe."
  }
];

function dossier(definition) {
  const { mechanic, missing, reason, ...identity } = definition;
  const editionProfile = ['ME3-WPN-PARTICLE', 'ME3-WPN-LANCER'].includes(identity.recordId) ? 'legendary' : null;
  const shared = { ...identity, mode: 'weapon', constraints: { editionProfile },
    sourceBasis: 'catalogue-secondary-reference', primarySourceVerified: false,
    statsBasis: 'ATB adaptation', notes: [ATB_NOTE, NO_TRANSFER, SOLO_NOTE] };
  if (mechanic === 'blocked') return {
    ...shared, role: 'Inspection documentaire — fonctionnement ou contexte non établi',
    behaviorKind: 'inspection-only', simulation: null, blockedReason: reason,
    limitations: [reason, 'Cette fiche ne crée aucun combat et ne remplace pas le mécanisme manquant par un tir conventionnel.'],
  };
  if (mechanic === 'contact') return {
    ...shared, role: 'Épreuve ATB de contact — mécanisme de famille partiel',
    behaviorKind: 'melee-family-prototype', blockedReason: null,
    simulation: { ...carrier, primaryAction: 'strike', weaponType: 'melee', weaponSystem: 'melee', powers: [] },
    limitations: [missing,
      'Un seul ordre de contact ATB natif sur une cible abstraite ; aucune distance, collision, zone, combo, animation ou valeur propre au modèle ne sont certifiés.',
      'Les huit modèles partagent cette même primitive de contact : ils ne constituent pas huit mécanismes originaux distincts.'],
  };
  const profile = getUniverseWeaponProfile(identity.recordId);
  // Fail closed if a future edit removes or changes the exact native identity.
  if (!profile || profile.catalogId !== identity.recordId) return {
    ...shared, role: 'Inspection documentaire — profil natif indisponible', behaviorKind: 'inspection-only', simulation: null,
    blockedReason: 'Le profil exact de cette référence est absent ; aucune arme de secours ne peut le remplacer.',
    limitations: ['Le profil mécanique exact doit être rétabli avant toute simulation.'],
  };
  const simulation = { ...carrier, weaponType: profile.weaponType, weaponSystem: profile.weaponSystem,
    weaponProfileId: profile.id, powers: [], ...(profile.weaponSystem === 'thermal-clip'
      ? { magazineCapacity: profile.magazineCapacity, ammo: profile.ammo, reserveAmmo: profile.reserveAmmo } : {}) };
  return {
    ...shared, role: `Épreuve ATB — profil natif ${profile.mode}`, behaviorKind: 'existing-weapon-profile', simulation, blockedReason: null,
    notes: [...shared.notes, profile.mechanicNote, ...(editionProfile ? [profile.availabilityNote] : [])],
    limitations: [...profile.limitations,
      'Le comportement est réutilisé à l’identique depuis un profil existant ; cette nouvelle fiche Simulation ne constitue pas une nouvelle mécanique originale.',
      ...(identity.recordId === 'ME3-WPN-LANCER'
        ? ['La bibliographie héritée cite ME3-SRC-SUPPRESSOR, page secondaire intitulée pour un autre modèle ; aucune validation primaire du Lancer n’est revendiquée.'] : [])],
  };
}

export const EXPANSION_WEAPONS = freeze(definitions.map(dossier));
const byId = new Map(EXPANSION_WEAPONS.map(record => [record.recordId, record]));
/** Identity lookup only. Context/edition eligibility must still be checked by the caller. */
export function getExpansionWeapon(recordId) {
  return typeof recordId === 'string' ? byId.get(recordId) || null : null;
}
