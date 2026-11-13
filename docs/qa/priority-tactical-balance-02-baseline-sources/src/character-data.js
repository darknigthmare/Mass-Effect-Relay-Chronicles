// Equipment eligibility for the retained ME1 rules. Shepard class/armour rules
// are documented in the official PC French manual, pp. 10–11 and 20–24.
// Mastery is distinct from carrying a weapon. This ATB adaptation keeps its
// existing starting combat values; it does not invent a canonical aim penalty.
// Companion profiles describe equipment roles, not a complete talent tree.
export const EQUIPMENT_WEAPON_TYPES = Object.freeze(['pistol', 'assault', 'shotgun', 'sniper']);

const freezeProfile = profile => Object.freeze({ ...profile,
  armorWeights: Object.freeze([...profile.armorWeights]),
  trainableArmorWeights: Object.freeze([...profile.trainableArmorWeights]),
  weaponTraining: Object.freeze([...profile.weaponTraining]),
});

export const CLASS_EQUIPMENT = Object.freeze({
  soldier: freezeProfile({ classId: 'soldier', className: 'Soldat', armorWeights: ['light', 'medium'], trainableArmorWeights: ['heavy'], weaponTraining: [...EQUIPMENT_WEAPON_TYPES], biotic: false, tech: false, defaultWeaponType: 'assault', description: 'Spécialiste militaire, formé aux quatre familles d’armes. Les armures lourdes demandent une formation supplémentaire.' }),
  engineer: freezeProfile({ classId: 'engineer', className: 'Ingénieur', armorWeights: ['light'], trainableArmorWeights: [], weaponTraining: ['pistol'], biotic: false, tech: true, defaultWeaponType: 'pistol', description: 'Spécialiste technologique : systèmes, boucliers et armes adverses. Utilise les armures légères et les OmniTechs.' }),
  adept: freezeProfile({ classId: 'adept', className: 'Adepte', armorWeights: ['light'], trainableArmorWeights: [], weaponTraining: ['pistol'], biotic: true, tech: false, defaultWeaponType: 'pistol', description: 'Spécialiste biotique, équipé d’une armure légère. Un amplificateur renforce ses capacités existantes.' }),
  infiltrator: freezeProfile({ classId: 'infiltrator', className: 'Franc-tireur', armorWeights: ['light'], trainableArmorWeights: ['medium'], weaponTraining: ['pistol', 'sniper'], biotic: false, tech: true, defaultWeaponType: 'sniper', description: 'Combine précision et technologie. Peut apprendre le port de l’armure intermédiaire.' }),
  vanguard: freezeProfile({ classId: 'vanguard', className: 'Porte-étendard', armorWeights: ['light'], trainableArmorWeights: ['medium'], weaponTraining: ['pistol', 'shotgun'], biotic: true, tech: false, defaultWeaponType: 'shotgun', description: 'Combine combat rapproché et biotique. Peut apprendre le port de l’armure intermédiaire.' }),
  sentinel: freezeProfile({ classId: 'sentinel', className: 'Sentinelle', armorWeights: ['light'], trainableArmorWeights: [], weaponTraining: [], biotic: true, tech: true, defaultWeaponType: 'pistol', description: 'Combine biotique et technologie avec une armure légère. La maîtrise des armes dépend de ses talents, pas de leur simple port.' }),
});

export const CHARACTER_EQUIPMENT = Object.freeze({
  shepard: Object.freeze({ id: 'shepard', name: 'Shepard', biologicalSpecies: 'human', armorSpecies: 'human', description: 'Commandant de l’Alliance. La classe choisie détermine ses formations et ses équipements spécialisés.' }),
  ashley: freezeProfile({ id: 'ashley', name: 'Ashley Williams', classId: 'soldier', className: 'Soldate', biologicalSpecies: 'human', armorSpecies: 'human', armorWeights: ['light', 'medium'], trainableArmorWeights: ['heavy'], weaponTraining: [...EQUIPMENT_WEAPON_TYPES], biotic: false, tech: false, defaultWeaponType: 'assault', description: 'Soldate de l’Alliance spécialisée dans l’armement et les protections militaires.' }),
  kaidan: freezeProfile({ id: 'kaidan', name: 'Kaidan Alenko', classId: 'sentinel', className: 'Sentinelle', biologicalSpecies: 'human', armorSpecies: 'human', armorWeights: ['light'], trainableArmorWeights: [], weaponTraining: [], biotic: true, tech: true, defaultWeaponType: 'pistol', description: 'Officier humain biotique équipé d’implants L2, avec des compétences technologiques et de soutien.' }),
  jenkins: freezeProfile({ id: 'jenkins', name: 'Richard Jenkins', classId: 'marine', className: 'Marine de l’Alliance', biologicalSpecies: 'human', armorSpecies: 'human', armorWeights: ['light', 'medium'], trainableArmorWeights: ['heavy'], weaponTraining: [...EQUIPMENT_WEAPON_TYPES], biotic: false, tech: false, defaultWeaponType: 'assault', description: 'Marine de l’Alliance affecté à la première descente sur Eden Prime. Son équipement militaire conserve les permissions de cette adaptation, sans prétendre reproduire un arbre de talents documenté.' }),
  garrus: freezeProfile({ id: 'garrus', name: 'Garrus Vakarian', classId: 'turian-agent', className: 'Agent turien', biologicalSpecies: 'turian', armorSpecies: 'turian', armorWeights: ['light'], trainableArmorWeights: ['medium'], weaponTraining: ['assault', 'sniper'], biotic: false, tech: true, defaultWeaponType: 'sniper', description: 'Ancien enquêteur du SSC, spécialiste du tir et de la technologie. Porte une armure adaptée à l’anatomie turienne.' }),
  tali: freezeProfile({ id: 'tali', name: 'Tali’Zorah nar Rayya', classId: 'quarian-machinist', className: 'Ingénieure quarienne', biologicalSpecies: 'quarian', armorSpecies: 'quarian', armorWeights: ['light'], trainableArmorWeights: [], weaponTraining: ['pistol', 'shotgun'], biotic: false, tech: true, defaultWeaponType: 'shotgun', description: 'Spécialiste quarienne des systèmes et des synthétiques. Sa combinaison environnementale reste indispensable.' }),
  wrex: freezeProfile({ id: 'wrex', name: 'Urdnot Wrex', classId: 'krogan-battlemaster', className: 'Combattant biotique krogan', biologicalSpecies: 'krogan', armorSpecies: 'krogan', armorWeights: ['medium'], trainableArmorWeights: ['heavy'], weaponTraining: ['assault', 'shotgun'], biotic: true, tech: false, defaultWeaponType: 'shotgun', description: 'Mercenaire krogan et combattant biotique. Sa protection exige une coupe krogan, distincte des armures humaines.' }),
  liara: freezeProfile({ id: 'liara', name: 'Liara T’Soni', classId: 'asari-scientist', className: 'Scientifique asari', biologicalSpecies: 'asari', armorSpecies: 'human', armorWeights: ['light'], trainableArmorWeights: [], weaponTraining: [], biotic: true, tech: false, canUseOmniTool: true, defaultWeaponType: 'pistol', description: 'Archéologue asari spécialisée dans les Prothéens et la biotique. Utilise la coupe humaine d’armure légère et peut équiper un omni-outil sans recevoir de nouveaux pouvoirs technologiques.' }),
});

const OWN = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

/** Returns an independent UI/inventory profile; unknown actors/classes fail. */
export function getEquipmentProfile(actorId, classId = 'soldier') {
  if (typeof actorId !== 'string' || typeof classId !== 'string' || !OWN(CHARACTER_EQUIPMENT, actorId) || !OWN(CLASS_EQUIPMENT, classId)) return null;
  const identity = CHARACTER_EQUIPMENT[actorId];
  const profile = actorId === 'shepard' ? { ...CLASS_EQUIPMENT[classId], ...identity } : identity;
  return { ...profile, species: profile.armorSpecies,
    canUseOmniTool: profile.canUseOmniTool ?? profile.tech,
    armorWeights: [...profile.armorWeights], trainableArmorWeights: [...profile.trainableArmorWeights],
    weaponTraining: [...profile.weaponTraining], allowedWeapons: [...EQUIPMENT_WEAPON_TYPES],
  };
}
