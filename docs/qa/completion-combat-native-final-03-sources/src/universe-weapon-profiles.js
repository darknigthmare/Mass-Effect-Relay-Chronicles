// Small, dependency-free mechanics table shared by combat and Chronicles.
// These are bounded ATB profiles, not extracted original weapon statistics.
// Catalogue sources identify the weapon; timing, area and resource budgets
// below are prototype choices and have not been verified in the original game.
const freeze = value => {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
};

const common = {
  statsBasis: 'ATB adaptation',
  sourceBasis: 'catalogue-secondary-reference',
  primarySourceVerified: false,
  tuningNote: 'Délais, zone, dégâts, chaleur et réserves sont adaptés à l’ATB ; aucune fidélité numérique, physique ou visuelle 1:1 certifiée.',
};
const clips = (capacity, reserve) => ({ weaponSystem: 'thermal-clip', magazineCapacity: capacity, ammo: capacity, reserveAmmo: reserve });
const explosive = (id, weaponType, capacity, delay, sourceIds) => ({
  ...common, id, catalogId: id, weaponType, ...clips(capacity, capacity * 4),
  mode: 'delayed-area', delay, splashRatio: .4, sourceIds,
  mechanicNote: `Explosion après ${delay} s ATB ; cible principale et dégâts réduits sur le groupe adverse.`,
  limitations: ['Zone adaptée au groupe ATB ; trajectoire, rebonds, collision avec le décor et dégâts alliés ne sont pas reproduits.',
    'Les détails du mécanisme original restent à vérifier ; l’identification vient du catalogue secondaire.'],
});

// Identity/edition statements below are catalogue facts. Proposed firing modes
// come from the adaptation specifications, not a newly verified original kit.
// The profile grants no availability: the scenario whitelist owns that decision.
const adapted = (id, weaponType, sourceIds, identityFact, availabilityNote = 'Atelier solo de cette œuvre ; aucune acquisition narrative accordée.') => ({
  ...common, id, catalogId: id, weaponType, sourceIds, identityFact, availabilityNote,
  mechanicEvidence: 'Spécification de prototype : le mécanisme exécuté et ses paramètres ATB ne certifient pas le comportement original.',
});
const beam = (id, weaponType, sourceIds, identityFact, availabilityNote) => ({
  ...adapted(id, weaponType, sourceIds, identityFact, availabilityNote), weaponSystem: 'heat',
  mode: 'heat-beam', duration: 2, tickInterval: .5, heatPerSecond: 28,
  mechanicNote: 'Rayon de prototype canalisé pendant 2 s ATB ; quatre impulsions et chaleur, interruption ou surchauffe sans clip thermique.',
  limitations: ['Le cycle thermique et la canalisation sont une proposition ATB, sans vérification primaire du modèle.',
    'Portée, suivi du viseur, géométrie et éventuelle montée en puissance d’origine ne sont pas reproduits.'],
});
const thermalBurst = (id, weaponType, burstCount, sourceIds, identityFact, availabilityNote) => ({
  ...adapted(id, weaponType, sourceIds, identityFact, availabilityNote), weaponSystem: 'heat',
  mode: 'heat-burst', burstCount, heatCost: 24,
  mechanicNote: `${burstCount} impacts énergétiques dans l’ordre ATB ; chaleur et refroidissement, sans réserve de clips. Ce nombre d’impacts est un budget de prototype.`,
  limitations: ['Les impacts ATB ne certifient ni le nombre de projectiles, ni la cadence ou le cycle thermique d’origine.',
    'Dispersion, cône, portée, collisions et gestion des munitions modifiées d’origine ne sont pas simulés.'],
});
const charged = (id, weaponType, capacity, sourceIds, identityFact, options = {}) => ({
  ...adapted(id, weaponType, sourceIds, identityFact), ...clips(capacity, capacity * 4),
  mode: options.area ? 'charged-area' : 'charged-shot', chargeDuration: 1, chargeDamageMultiplier: 1.5,
  impactCount: options.impactCount || 1, ...(options.area ? { delay: .4, splashRatio: .4 } : {}),
  ...(options.ignoresCover ? { ignoresCover: true } : {}),
  mechanicNote: options.area
    ? 'Charge fixe de 1 s ATB, puis lancement consommant le clip et explosion après 0,4 s de vol ; aucun impact avant ces phases.'
    : 'Charge fixe et interruptible de 1 s ATB avant l’impact ; le clip est consommé au tir. Annuler ne restitue ni le tour ni la concentration dépensée.',
  limitations: ['Charge automatique complète de prototype : maintien manuel, tir court, niveaux partiels et progression d’origine non reproduits.',
    'Temps, facteur de dégâts, nombre de pointes, capacité et réserve sont des réglages ATB sans certification primaire.',
    'Trajectoires, rebonds, portée et collision du projectile avec le décor ne sont pas simulés.'],
  ...options,
});

export const UNIVERSE_WEAPON_PROFILES = freeze([
  explosive('ME3-WPN-FALCON', 'assault', 6, .8, ['ME3-SRC-EQUIP']),
  explosive('ME3-WPN-SCORPION', 'pistol', 4, 1.2, ['ME3-SRC-EQUIP']),
  explosive('MEA-WPN-SCORPION', 'pistol', 4, 1.2, ['MEA-SRC-WEAPONS']),
  {
    ...common, id: 'MEA-WPN-PAW', catalogId: 'MEA-WPN-PAW', weaponType: 'assault', weaponSystem: 'heat',
    mode: 'heat-beam', duration: 2, tickInterval: .5, heatPerSecond: 28, sourceIds: ['MEA-SRC-WEAPONS'],
    mechanicNote: 'Rayon canalisé pendant 2 s ATB ; dégâts et chaleur par impulsion, arrêt à la surchauffe ou à l’interruption.',
    limitations: ['Canalisation ATB sans simulation du suivi du viseur, des obstacles ou de la portée d’origine.',
      'La fiche atteste une arme à rayon ; gestion thermique et paramètres de ce prototype restent sans vérification primaire.'],
  },
  {
    ...common, id: 'MEA-WPN-REEGAR', catalogId: 'MEA-WPN-REEGAR', weaponType: 'shotgun', ...clips(8, 32),
    mode: 'clip-channel', duration: 2, tickInterval: .5, ammoPerTick: 1, sourceIds: ['MEA-SRC-WEAPONS'],
    mechanicNote: 'Jet électrique canalisé pendant 2 s ATB ; une munition par impulsion, arrêt si le chargeur est vide.',
    limitations: ['Jet sur une cible ATB ; cône, portée et collision avec les obstacles ne sont pas reproduits.',
      'La fiche atteste une arme électrique ; cadence et dépense par impulsion sont des réglages ATB non certifiés.'],
  },
  {
    ...common, id: 'MEA-WPN-SWEEPER', catalogId: 'MEA-WPN-SWEEPER', weaponType: 'assault', weaponSystem: 'heat',
    mode: 'heat-burst', burstCount: 3, heatCost: 24, sourceIds: ['MEA-SRC-SWEEPER'],
    mechanicNote: 'Salve énergétique en trois impacts ATB ; jauge de chaleur et refroidissement, sans clip thermique.',
    limitations: ['Répartition des impacts et cycle thermique adaptés à l’ATB ; dispersion et cadence originales non reproduites.',
      'Le modèle reliquat possède une source individuelle secondaire ; aucune table originale de valeurs n’est certifiée.'],
  },
  beam('ME3-WPN-PARTICLE', 'assault', ['ME3-SRC-PARTICLE'], 'Arme prothéenne de From Ashes.',
    'From Ashes présent : atelier Legendary explicitement préparé ; aucune attribution à une mission ou acquisition inventée.'),
  thermalBurst('ME3-WPN-LANCER', 'assault', 3, ['ME3-SRC-SUPPRESSOR'], 'Arme du DLC Citadel.',
    'Citadel présent : atelier Legendary explicitement préparé ; cette fiche ne donne aucun accès dans l’atelier standard.'),
  charged('ME3-WPN-ARC', 'pistol', 6, ['ME3-SRC-EQUIP'], 'Pistolet énergétique.'),
  charged('ME3-WPN-GRAAL', 'shotgun', 4, ['ME3-SRC-EQUIP'], 'Arme à pointes.', { impactCount: 3 }),
  charged('ME3-WPN-JAVELIN', 'sniper', 2, ['ME3-SRC-EQUIP', 'ME3-SRC-MANUAL-PC'], 'Fusil geth de précision.', {
    ignoresCover: true,
    primaryReference: {
      url: 'https://eaassets-a.akamaihd.net/eahelp/manuals/mass-effect-3-manuals_PC.pdf',
      sha256: '07ee7dc469e5c6beb85d2050b333647aa29ee9900d83695cfbe28be51726da01',
      reference: 'Manuel officiel ME3 PC anglais, page imprimée 26, Weapon Tips / Cover Piercing.',
      scope: 'Le passage nomme Javelin parmi les armes traversant les ennemis et le couvert léger. Il ne certifie pas la charge, sa durée ou des paramètres de cette adaptation.',
    },
    coverNote: 'Le couvert binaire ATB représente ici seulement un couvert léger ; aucun tir à travers la géométrie ou plusieurs ennemis n’est simulé.',
  }),
  beam('MEA-WPN-EQUALIZER', 'pistol', ['MEA-SRC-WEAPONS'], 'Pistolet reliquat.'),
  thermalBurst('MEA-WPN-SCATTERSHOT', 'shotgun', 5, ['MEA-SRC-WEAPONS'], 'Fusil reliquat.'),
  charged('MEA-WPN-VENOM', 'shotgun', 4, ['MEA-SRC-WEAPONS'], 'Fusil à projectiles explosifs.', { area: true }),
]);

const byId = new Map(UNIVERSE_WEAPON_PROFILES.map(profile => [profile.id, profile]));
/** Unknown/absent IDs have no special behavior; caller-provided objects are never trusted. */
export function getUniverseWeaponProfile(id) {
  return typeof id === 'string' ? byId.get(id) || null : null;
}
