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
]);

const byId = new Map(UNIVERSE_WEAPON_PROFILES.map(profile => [profile.id, profile]));
/** Unknown/absent IDs have no special behavior; caller-provided objects are never trusted. */
export function getUniverseWeaponProfile(id) {
  return typeof id === 'string' ? byId.get(id) || null : null;
}
