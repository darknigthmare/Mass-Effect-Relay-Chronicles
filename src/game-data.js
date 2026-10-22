// Canonical names and settings; dialogue, encounter tuning and condensed layouts are adaptations.
export const VERSION = '0.1.0';
export const CLASSES = {
  soldier: { name: 'Soldat', tagline: 'Puissance de feu · endurance', powers: [], attack: 30, defense: 10, hp: 250, shield: 140 },
  engineer: { name: 'Ingénieur', tagline: 'Sabotage · contrôle des systèmes', powers: ['overload', 'sabotage', 'hack'], attack: 22, defense: 6, hp: 210, shield: 140 },
  adept: { name: 'Adepte', tagline: 'Biotique · maîtrise de l’espace', powers: ['throw', 'lift', 'warp', 'singularity', 'stasis'], attack: 20, defense: 5, hp: 210, shield: 120 },
  infiltrator: { name: 'Franc-tireur', tagline: 'Précision · technologie', powers: ['overload', 'sabotage'], attack: 32, defense: 7, hp: 220, shield: 130 },
  vanguard: { name: 'Porte-étendard', tagline: 'Assaut · puissance biotique', powers: ['throw', 'warp', 'barrier'], attack: 28, defense: 8, hp: 235, shield: 125 },
  sentinel: { name: 'Sentinelle', tagline: 'Biotique · soutien technique', powers: ['overload', 'throw', 'lift', 'barrier', 'stasis'], attack: 21, defense: 8, hp: 220, shield: 155 },
};
export const CREW = {
  shepard: { id: 'shepard', name: 'Shepard', species: 'Humain', role: 'Commandement', sprite: 'shepard', index: 0, color: '#ec675f', description: 'Officier de l’Alliance. Vos décisions définissent votre commandement.' },
  ashley: { id: 'ashley', name: 'Ashley Williams', species: 'Humaine', role: 'Soldate', sprite: 'ashley', index: 1, color: '#e8a0a3', hp: 240, shield: 120, attack: 31, defense: 10, speed: 1.02, powers: [], description: 'Une puissance de feu constante et une grande résistance.' },
  kaidan: { id: 'kaidan', name: 'Kaidan Alenko', species: 'Humain', role: 'Biotique / technologie', sprite: 'kaidan', index: 2, color: '#9eb8f0', hp: 215, shield: 140, attack: 22, defense: 7, speed: 1.05, powers: ['overload', 'throw', 'lift', 'barrier'], description: 'Contrôle des menaces et soutien du commando.' },
  jenkins: { id: 'jenkins', name: 'Richard Jenkins', species: 'Humain', role: 'Marine', sprite: 'jenkins', index: 3, color: '#a9bbc9', hp: 180, shield: 90, attack: 24, defense: 6, speed: 1, powers: [], description: 'Marine affecté à la première descente sur Eden Prime.' },
  garrus: { id: 'garrus', name: 'Garrus Vakarian', species: 'Turien', role: 'Précision / technologie', sprite: 'garrus', index: 4, color: '#8dbddd', hp: 220, shield: 130, attack: 34, defense: 8, speed: .96, powers: ['overload', 'sabotage'], description: 'Tir de précision et neutralisation des équipements adverses.' },
  tali: { id: 'tali', name: 'Tali’Zorah nar Rayya', species: 'Quarienne', role: 'Ingénieure', sprite: 'tali', index: 5, color: '#bd8bdc', hp: 205, shield: 165, attack: 23, defense: 6, speed: 1.08, powers: ['overload', 'sabotage', 'hack'], description: 'Piratage des synthétiques et protection technologique.' },
  wrex: { id: 'wrex', name: 'Urdnot Wrex', species: 'Krogan', role: 'Combattant biotique', sprite: 'wrex', index: 6, color: '#c78c78', hp: 340, shield: 100, attack: 33, defense: 13, speed: .82, powers: ['throw', 'warp', 'barrier'], description: 'Une présence imposante, soutenue par la biotique.' },
  liara: { id: 'liara', name: 'Liara T’Soni', species: 'Asari', role: 'Archéologue / biotique', sprite: 'liara', index: 7, color: '#89d3ed', hp: 205, shield: 130, attack: 20, defense: 5, speed: 1.1, powers: ['throw', 'lift', 'warp', 'singularity', 'barrier', 'stasis'], description: 'Contrôle de groupes et connaissance des Prothéens.' },
};
export const CHAPTERS = {
  'eden-prime': { name: 'Eden Prime', subtitle: 'Un signal dans les cendres', cluster: 'Utopie · Exode', number: '01', palette: '#e6a47b', reward: 200, description: 'Une colonie de l’Alliance est attaquée. Rejoignez le site de fouilles et sécurisez la balise.', objective: 'Sécuriser les approches, puis rejoindre la balise prothéenne.', briefing: 'La mission de récupération a basculé. Une présence geth est confirmée au sol. Cherchez les survivants et avancez vers le site de fouilles.', encounterNames: ['Patrouille geth', 'Les quais de la colonie', 'Défense de la balise'], objectiveName: 'Balise prothéenne' },
  citadel: { name: 'Citadelle', subtitle: 'Une voix devant le Conseil', cluster: 'Serpent · Nébuleuse du Serpent', number: '02', palette: '#83d2cd', reward: 150, description: 'Rassemblez les preuves contre Saren, rencontrez vos futurs équipiers et faites entendre votre rapport.', objective: 'Rencontrer Garrus, Tali et Wrex. Présenter les preuves au Conseil.', briefing: 'Le Conseil attend des preuves. Anderson vous conseille de suivre les pistes ouvertes dans les secteurs de la station.', encounterNames: [], objectiveName: 'Audience du Conseil' },
  therum: { name: 'Therum', subtitle: 'Sous la roche en fusion', cluster: 'Knossos · Artémis Tau', number: '03', palette: '#f3a25d', reward: 240, description: 'Retrouvez Liara T’Soni dans les ruines prothéennes avant les forces geth.', objective: 'Franchir les installations et libérer Liara.', briefing: 'Les fouilles sont isolées par les geth. Une source d’énergie maintient le système de confinement de la structure.', encounterNames: ['Avant-poste minier', 'Accès aux ruines', 'Protection du site'], objectiveName: 'Confinement prothéen' },
  feros: { name: 'Feros', subtitle: 'Les racines du silence', cluster: 'Thésée · Bêta Attique', number: '04', palette: '#c7c995', reward: 260, description: 'Zhu’s Hope tient encore. Découvrez ce qui relie l’attaque geth aux profondeurs de la colonie.', objective: 'Protéger la colonie, atteindre ExoGeni et neutraliser le Thorien.', briefing: 'Les colons répondent de manière inhabituelle. La survie de Zhu’s Hope dépend de votre compréhension de cette influence.', encounterNames: ['La route d’ExoGeni', 'Les profondeurs', 'Le Thorien'], objectiveName: 'Sort de la colonie' },
  noveria: { name: 'Noveria', subtitle: 'Sous la glace', cluster: 'Pax · Nébuleuse de la Tête de Cheval', number: '05', palette: '#a5c9ed', reward: 260, description: 'Une piste mène à Pic 15. Les laboratoires ont cessé de répondre.', objective: 'Accéder aux laboratoires, affronter Bénézia et décider du sort de la reine rachni.', briefing: 'Port Hanshan abrite des intérêts rivaux. Les documents disponibles orientent votre enquête vers les recherches menées à Pic 15.', encounterNames: ['Accès de sécurité', 'Laboratoires contaminés', 'Matriarche Bénézia'], objectiveName: 'Chambre de la reine rachni' },
  virmire: { name: 'Virmire', subtitle: 'Le prix du commandement', cluster: 'Hoc · Sentry Oméga', number: '06', palette: '#75c6b3', reward: 300, description: 'Une équipe galarienne a localisé une installation liée à Saren. Préparez une opération décisive.', objective: 'Traverser la base, confronter Saren et mener l’extraction.', briefing: 'La base est défendue. Votre commando devra coordonner son avancée avec l’équipe galarienne et accepter des décisions irréversibles.', encounterNames: ['La plage', 'Installation de recherche', 'Saren Arterius'], objectiveName: 'Extraction d’urgence' },
  ilos: { name: 'Ilos', subtitle: 'La mémoire du cycle', cluster: 'Refuge · Pangaea', number: '07', palette: '#a2bb91', reward: 300, description: 'Les ruines d’Ilos renferment la clé du passage emprunté par Saren.', objective: 'Réactiver l’accès, écouter Vigil et atteindre le Conduit.', briefing: 'Des architectures prothéennes émergent de la végétation. Les systèmes encore actifs semblent attendre une réponse depuis des millénaires.', encounterNames: ['Les jardins oubliés', 'Les galeries', 'Défense du Conduit'], objectiveName: 'Vigil et le Conduit' },
  'citadel-finale': { name: 'Citadelle assiégée', subtitle: 'Le dernier relais', cluster: 'Citadelle · secteur verrouillé', number: '08', palette: '#ec8581', reward: 400, description: 'L’assaut a commencé. Rejoignez la tour, arrêtez Saren et prenez la dernière décision de commandement.', objective: 'Atteindre la tour, arrêter Saren et coordonner la flotte.', briefing: 'Les communications de la station sont fragmentées. La route vers la tour du Conseil reste votre seul axe de progression.', encounterNames: ['Quais en flammes', 'Défense de la tour', 'Saren — confrontation finale'], objectiveName: 'Coordination de la flotte' },
};
export const ENEMIES = {
  geth: { name: 'Soldat geth', sprite: 'geth', hp: 95, shield: 35, attack: 15, defense: 3, speed: .74, powers: [], synthetic: true },
  sniper: { name: 'Tireur geth', sprite: 'geth-sniper', hp: 85, shield: 40, attack: 24, defense: 2, speed: .57, powers: ['sabotage'], synthetic: true },
  destroyer: { name: 'Destructeur geth', sprite: 'geth-destroyer', hp: 170, shield: 65, attack: 23, defense: 7, speed: .58, powers: ['overload'], synthetic: true },
  husk: { name: 'Zombie', sprite: 'husk', hp: 90, shield: 0, attack: 18, defense: 2, speed: 1.02, powers: [], primaryAction: 'strike', synthetic: false },
  krogan: { name: 'Mercenaire krogan', sprite: 'krogan', hp: 210, shield: 45, attack: 25, defense: 9, speed: .66, powers: ['barrier'], synthetic: false },
  rachni: { name: 'Soldat rachni', sprite: 'rachni', hp: 135, shield: 0, attack: 21, defense: 5, speed: .86, powers: [], primaryAction: 'acid', synthetic: false },
  creeper: { name: 'Rampant du Thorien', sprite: 'creeper', hp: 125, shield: 0, attack: 19, defense: 3, speed: .83, powers: [], primaryAction: 'strike', synthetic: false },
  asari: { name: 'Commando asari', sprite: 'asari', hp: 150, shield: 60, attack: 21, defense: 5, speed: .82, powers: ['throw', 'barrier'], synthetic: false },
  thorian: { name: 'Thorien — nœud central', sprite: 'thorian', hp: 420, shield: 0, attack: 27, defense: 8, speed: .55, powers: [], primaryAction: 'acid', hackImmune: true, boss: true, synthetic: false },
  benezia: { name: 'Matriarche Bénézia', sprite: 'benezia', hp: 340, shield: 170, attack: 26, defense: 7, speed: .8, powers: ['throw', 'stasis', 'barrier'], boss: true, synthetic: false },
  saren: { name: 'Saren Arterius', sprite: 'saren', hp: 380, shield: 170, attack: 30, defense: 10, speed: .85, powers: ['overload', 'throw', 'barrier'], boss: true, synthetic: false },
  'saren-final': { name: 'Saren — enveloppe synthétique', sprite: 'saren-final', hp: 560, shield: 180, attack: 31, defense: 10, speed: .91, powers: ['overload', 'sabotage'], hackImmune: true, boss: true, synthetic: true },
};
export const ENCOUNTERS = {
  'eden-prime': [['geth', 'geth'], ['husk', 'husk', 'geth'], ['destroyer', 'sniper']],
  therum: [['geth', 'sniper'], ['geth', 'destroyer'], ['krogan', 'geth', 'sniper']],
  feros: [['geth', 'geth', 'sniper'], ['creeper', 'creeper', 'asari'], ['thorian', 'creeper']],
  noveria: [['geth', 'destroyer'], ['rachni', 'rachni', 'rachni'], ['benezia', 'asari']],
  virmire: [['geth', 'sniper', 'krogan'], ['destroyer', 'krogan'], ['saren', 'geth']],
  ilos: [['geth', 'destroyer'], ['destroyer', 'sniper'], ['destroyer', 'destroyer', 'sniper']],
  'citadel-finale': [['geth', 'sniper', 'destroyer'], ['destroyer', 'asari'], ['saren-final']],
};
export const CODEX = [
  { id: 'relay', name: 'Relais cosmodésiques', category: 'Technologie', text: 'Les relais structurent les grands déplacements galactiques. La carte du Normandy permet de choisir une destination accessible selon l’avancement de votre enquête.' },
  { id: 'spectre', name: 'Spectres', category: 'Institutions', text: 'Les agents spéciaux du Conseil disposent d’une grande autonomie. Cette liberté de décision engage directement leur responsabilité.' },
  { id: 'biotic', name: 'Biotique', category: 'Technologie', text: 'Les champs de masse permettent notamment de projeter, soulever ou protéger. Seuls les personnages disposant des aptitudes correspondantes utilisent ces pouvoirs.' },
  { id: 'heat', name: 'Gestion thermique', category: 'Combat', text: 'Le tir fait chauffer les armes. Une surchauffe suspend leur utilisation. Les pouvoirs, la défense ou le déplacement permettent de laisser refroidir l’arme.' },
  { id: 'geth', name: 'Geth', category: 'Espèces', text: 'Les geth sont des intelligences synthétiques. Leurs unités ont des fonctions différentes. Un spécialiste du piratage peut perturber certaines plateformes.' },
  { id: 'quarian', name: 'Quariens', category: 'Espèces', text: 'Les Quariens vivent au sein de la Flotte nomade. Leur combinaison environnementale est essentielle à leur protection.' },
  { id: 'asari', name: 'Asari', category: 'Espèces', text: 'Les Asari occupent une place majeure dans la communauté galactique. Liara apporte au commando ses connaissances archéologiques et ses aptitudes biotiques.' },
  { id: 'krogan', name: 'Krogans', category: 'Espèces', text: 'Les Krogans ont une physiologie robuste et une histoire marquée par des conflits galactiques. Wrex représente bien davantage qu’une force de combat.' },
  { id: 'turian', name: 'Turiens', category: 'Espèces', text: 'La société turienne accorde une place importante au service collectif. Garrus combine un entraînement armé et des connaissances techniques.' },
  { id: 'normandy', name: 'Normandy SR-1', category: 'Vaisseaux', text: 'Le centre de vos opérations. Préparez l’équipe, consultez la carte galactique et échangez avec vos compagnons entre deux missions.' },
  { id: 'stasis', name: 'Stase', category: 'Combat', text: 'La Stase de cette adaptation de ME1 immobilise la cible et la protège temporairement contre les dégâts. Utilisez-la pour isoler une menace.' },
  { id: 'atb', name: 'Jauges actives', category: 'Combat', text: 'À 100 %, un personnage peut agir. En mode Attente, le temps s’arrête lorsqu’un membre du groupe est prêt. Couvert, recharges et chaleur sont affichés.' },
];
export const EQUIPMENT = [
  { id: 'rifle', name: 'Fusil d’assaut', cost: 180, stat: 'attack', value: 3, detail: 'Calibration du tir : +3 puissance de feu.' },
  { id: 'armor', name: 'Renfort d’armure', cost: 160, stat: 'defense', value: 2, detail: 'Protection supplémentaire : +2 défense.' },
  { id: 'shield', name: 'Régulateur de bouclier', cost: 140, stat: 'shield', value: 15, detail: 'Capacité du bouclier : +15.' },
  { id: 'medigel', name: 'Recharge de médi-gel', cost: 50, stat: 'medigel', value: 1, detail: 'Une dose pour la prochaine mission, maximum 9.' },
];
export function actorFor(id, state) {
  const c = CREW[id] || CREW.kaidan;
  const cls = id === 'shepard' ? CLASSES[state.classId] || CLASSES.soldier : c;
  const level = Math.floor(state.xp / 300) + 1;
  const upgrades = state.upgrades[id] || {};
  const hp = (cls.hp || 230) + (level - 1) * 14;
  const shield = (cls.shield || 120) + (level - 1) * 8 + (upgrades.shield || 0);
  return { ...c, name: id === 'shepard' ? state.name : c.name, hp, maxHp: hp, shield, maxShield: shield, attack: (cls.attack || 24) + level - 1 + (upgrades.attack || 0), defense: (cls.defense || 6) + (upgrades.defense || 0), speed: cls.speed || 1, powers: [...(cls.powers || []), ...(id === 'shepard' && state.flags.spectre ? ['unity'] : [])], level };
}
export function enemiesFor(zone, index, state) {
  const ids = ENCOUNTERS[zone]?.[index] || ['geth'];
  const scale = 1 + Math.max(0, state.completed.filter(x => !['citadel','eden-prime'].includes(x)).length - 1) * .065;
  return ids.map((key, i) => {
    const a = ENEMIES[key];
    return { ...a, id: `${key}-${i}`, hp: Math.round(a.hp * scale), maxHp: Math.round(a.hp * scale), maxShield: a.shield, powers: [...a.powers] };
  });
}
