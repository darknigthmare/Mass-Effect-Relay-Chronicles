/** World staging is original fan-game geometry; story and canonical milestones live in content.js. */
const poi = (zone, suffix, label, type, x, z, extra = {}) => ({
  id: `${zone}:${suffix}`, label, type, x, z, ...extra,
});

function expedition(id, label, subtitle, theme, entries, overrides = {}) {
  const coordinates = [[0, 12], [-9, 5], [5, 6], [-7, -5], [5, -10], [0, -17], [-4, 18]];
  const suffixes = ['arrival', 'cache', 'encounter-1', 'encounter-2', 'boss', 'objective', 'exit'];
  const types = ['dialogue', 'terminal', 'encounter', 'encounter', 'encounter', 'objective', 'exit'];
  return {
    id, label, subtitle, theme,
    bounds: { minX: -20, maxX: 20, minZ: -21, maxZ: 21 },
    spawn: { x: 0, z: 17 }, arena: { x: 0, z: 0 },
    pois: entries.map((name, i) => poi(id, suffixes[i], name, types[i], ...coordinates[i], i === 6 ? { target: 'normandy' } : {})),
    ...overrides,
  };
}

export const WORLD_ZONES = {
  normandy: {
    id: 'normandy', label: 'Normandy SR-1', subtitle: 'CENTRE D’INFORMATION ET DE COMBAT', theme: 'normandy',
    bounds: { minX: -7.5, maxX: 7.5, minZ: -17, maxZ: 16 },
    spawn: { x: 0, z: 11 }, arena: { x: 0, z: 2 },
    pois: [
      poi('normandy', 'briefing', 'Briefing de mission', 'dialogue', -4.5, -3),
      poi('normandy', 'galaxy', 'Carte de la galaxie', 'terminal', 3.5, -7),
      poi('normandy', 'crew', 'Équipage', 'dialogue', 4.8, 5),
      poi('normandy', 'equipment', 'Armurerie', 'terminal', -4.8, 6),
      poi('normandy', 'medbay', 'Infirmerie', 'terminal', 4.8, 12),
      poi('normandy', 'archive', 'Archives de l’Alliance', 'terminal', -4.8, 12),
      poi('normandy', 'exit', 'Déploiement', 'exit', 0, 15),
    ],
  },
  'eden-prime': expedition('eden-prime', 'Eden Prime', 'UTOPIA · FRONTIÈRE DE L’ALLIANCE', 'eden', [
    'Premier contact', 'Module de ravitaillement', 'Patrouille geth', 'Colons transformés', 'Défense de la balise', 'Balise prothéenne', 'Zone d’extraction',
  ]),
  citadel: expedition('citadel', 'La Citadelle', 'PRÉSIDIUM · ESPACE CONCILIEN', 'citadel', [
    'Capitaine Anderson', 'Marchand du Présidium', 'Garrus Vakarian', 'Tali — preuves', 'Urdnot Wrex', 'Audience du Conseil', 'Baie d’amarrage',
  ]),
  therum: expedition('therum', 'Thérum', 'KNOSSOS · EXPÉDITION ARCHÉOLOGIQUE', 'therum', [
    'Signal de détresse', 'Équipement de fouille', 'Avant-poste geth', 'Éclaireurs geths', 'Protection du site', 'Liara T’Soni', 'Navette d’extraction',
  ]),
  feros: expedition('feros', 'Féros', 'ATTICAN BETA · ESPÉRANCE DE ZHU', 'feros', [
    'La colonie', 'Archives ExoGeni', 'Barrage geth', 'Créatures du Thorien', 'Le Thorien', 'Le sort de la colonie', 'Retour au Normandy',
  ], { arena: { x: 0, z: -4 } }),
  noveria: expedition('noveria', 'Novéria', 'NÉBULEUSE DU CHEVAL · PORT HANSHAN', 'noveria', [
    'Contrôle de sécurité', 'Terminal de recherche', 'Sécurité corrompue', 'Invasion rachni', 'Bénézia', 'La reine rachni', 'Navette de liaison',
  ]),
  virmire: expedition('virmire', 'Virmire', 'HOC · SENTRY OMÉGA', 'virmire', [
    'Camp galarien', 'Rapport d’infiltration', 'Défense côtière', 'Installation geth', 'Confrontation avec Saren', 'L’assaut de Virmire', 'Point d’extraction',
  ]),
  ilos: expedition('ilos', 'Ilos', 'REFUGE · PANGAEA', 'ilos', [
    'Les ruines silencieuses', 'Archives anciennes', 'Gardiens geths', 'Passage verrouillé', 'Dernière défense geth', 'Vigil', 'Canal de transmission',
  ]),
  'citadel-finale': expedition('citadel-finale', 'La Citadelle', 'TOUR DU CONSEIL · ASSAUT FINAL', 'finale', [
    'Retour à la Citadelle', 'Canal de l’Alliance', 'Tour envahie', 'Ascension de la tour', 'Saren', 'Le destin du Conseil', 'Fin de l’opération',
  ]),
};

for (const suffix of ['encounter-1', 'encounter-2', 'boss']) {
  WORLD_ZONES.citadel.pois.find(p => p.id === `citadel:${suffix}`).type = 'dialogue';
}

export const WORLD_ZONE_IDS = Object.keys(WORLD_ZONES);
