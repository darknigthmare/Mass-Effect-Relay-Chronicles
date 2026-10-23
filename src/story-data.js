// Concise rewrites for this adaptation, not official quotations. Catalogue
// references identify the intended subjects; they do not certify 1:1 fidelity.
export const STORY_CONVERSATIONS = {
  nihlus: {
    speaker: 'Nihlus Kryik', portrait: 'nihlus', gate: 'before-eden',
    topics: [
      { id: 'mission', label: 'Votre présence à bord', text: 'Le Conseil m’a chargé de vous observer pendant cette mission. Une opération sur le terrain en dit davantage sur un officier qu’un dossier. Notre objectif reste la récupération de la balise sur Eden Prime.', catalogId: 'DIA-nihlus-observation' },
      { id: 'spectres', label: 'Le rôle des Spectres', text: 'Les Spectres agissent au nom du Conseil et disposent d’une grande autonomie. Cette liberté ne dispense pas de juger les conséquences de ses actes. Le Conseil attend de ses agents qu’ils sachent prendre des décisions difficiles.', codex: ['spectre'], catalogId: 'DIA-nihlus-observation' },
    ],
  },
  joker: {
    speaker: 'Joker', portrait: 'joker',
    topics: [
      { id: 'eden-prime-report', label: 'Le retour d’Eden Prime', text: 'Ce devait être une mission de récupération. Nous revenons avec une colonie attaquée, Jenkins perdu et une balise détruite. Le Normandy est prêt à repartir dès que vous en donnerez l’ordre.', gate: 'after-eden', once: true, catalogId: 'DIA-joker-retour-du-prologue' },
      { id: 'pilotage', label: 'Le Normandy', text: 'Le Normandy SR-1 a été conçu pour des missions où la discrétion compte. Mon travail, c’est de vous amener sur place et de ramener le commando. Pour la destination, je vous laisse la carte galactique.', codex: ['normandy'] },
    ],
  },
  chakwas: {
    speaker: 'Dr Chakwas', portrait: 'chakwas',
    topics: [
      { id: 'vision', label: 'La vision de la balise', text: 'Vous avez perdu connaissance après le contact avec la balise. Les examens médicaux ne suffisent pas à expliquer les images que vous décrivez. Nous devons distinguer votre état physique du sens de cette expérience.', gate: 'after-eden', codex: ['protheans'], catalogId: 'DIA-chakwas-etat-de-shepard' },
      { id: 'medigel', label: 'Les soins du commando', text: 'Le médi-gel permet de stabiliser et de soigner rapidement les blessures sur le terrain. Gardez une réserve pour les urgences et préparez votre équipement avant le déploiement.' },
    ],
  },
  kaidan: {
    speaker: 'Kaidan Alenko', portrait: 'kaidan', companion: 'kaidan',
    topics: [
      { id: 'implants', label: 'Vos implants biotiques L2', text: 'Mes implants sont des L2, une ancienne génération d’implants biotiques humains. Ils m’aident à contrôler mes capacités, mais ils ont des effets secondaires, dont des migraines. Ce n’est pas un équipement interchangeable avec n’importe quelle génération plus récente.', codex: ['biotic'], catalogId: 'DIA-kaidan-implants' },
    ],
  },
  ashley: {
    speaker: 'Ashley Williams', portrait: 'ashley', companion: 'ashley',
    topics: [
      { id: 'service', label: 'Votre unité sur Eden Prime', text: 'Mon unité a été frappée pendant l’attaque de la colonie. J’ai survécu, et je dois continuer à servir malgré la perte de mes camarades. Rejoindre votre commando ne les remplace pas.', catalogId: 'DIA-ashley-apres-recrutement' },
      { id: 'famille', label: 'Votre famille et l’Alliance', text: 'Le service dans l’Alliance tient une grande place dans ma famille. Mes sœurs comptent beaucoup pour moi. Derrière l’uniforme, il y a aussi les proches que nous voulons retrouver et protéger.', catalogId: 'DIA-ashley-famille' },
    ],
  },
  garrus: {
    speaker: 'Garrus Vakarian', portrait: 'garrus', companion: 'garrus',
    topics: [
      { id: 'procedure', label: 'Les limites des procédures du SSC', text: 'Au SSC, j’ai vu des enquêtes s’enliser et des suspects profiter des règles. Sur le terrain, il faut agir, mais jusqu’où peut-on aller pour obtenir un résultat ?', codex: ['turian'], catalogId: 'DIA-garrus-procedures', choices: [
        { id: 'procedure', label: 'Les procédures protègent aussi les innocents.', response: 'Vous me demandez de garder ces protections à l’esprit, même lorsqu’elles ralentissent une enquête. Je retiens votre conseil.' },
        { id: 'results', label: 'Les résultats comptent, même quand les règles ralentissent.', response: 'Vous me conseillez de privilégier les résultats face aux limites de la procédure. Je retiens votre position.' },
      ] },
      { id: 'followup', label: 'Le conseil sur les procédures', gate: 'garrus-advice', text: '', catalogId: 'CHC-attitude-de-garrus' },
    ],
  },
  tali: {
    speaker: 'Tali’Zorah nar Rayya', portrait: 'tali', companion: 'tali',
    topics: [
      { id: 'pilgrimage', label: 'Votre pèlerinage', text: 'Les jeunes Quariens quittent la Flotte pour leur pèlerinage. Nous devons découvrir la galaxie et rapporter quelque chose d’utile à la communauté qui nous accueillera. Ce voyage marque le passage à la vie adulte.', codex: ['quarian'], catalogId: 'DIA-tali-vie-de-la-flotte' },
      { id: 'flotilla', label: 'La vie dans la Flotte', text: 'La Flotte nomade est notre foyer. Nous vivons sur des vaisseaux et devons entretenir ce que nous possédons. Nos combinaisons environnementales nous protègent ; les retirer hors d’un environnement contrôlé n’est pas un geste anodin.', codex: ['quarian'], catalogId: 'DIA-tali-vie-de-la-flotte' },
      { id: 'geth', label: 'Les Quariens et les geth', text: 'Les geth ont été créés par les Quariens. Leur révolte nous a chassés de notre monde d’origine. Nous vivons depuis dans la Flotte nomade.', codex: ['quarian', 'geth'], catalogId: 'DIA-tali-vie-de-la-flotte' },
    ],
  },
  wrex: {
    speaker: 'Urdnot Wrex', portrait: 'wrex', companion: 'wrex',
    topics: [
      { id: 'genophage', label: 'Le génophage et les Krogans', text: 'Le génophage a réduit les naissances viables chez les Krogans. Il pèse sur notre peuple depuis des générations. Nos divisions et notre violence font aussi partie du problème. Je suis mercenaire, mais ce qui arrive aux Krogans me concerne.', codex: ['krogan'], catalogId: 'DIA-wrex-genophage' },
    ],
  },
  liara: {
    speaker: 'Liara T’Soni', portrait: 'liara', companion: 'liara', gate: 'after-therum',
    topics: [
      { id: 'archaeology', label: 'Vos recherches prothéennes', text: 'J’étudie les vestiges prothéens depuis des décennies. Les ruines et les objets survivants restent fragmentaires ; ils ne donnent pas accès à toutes les pensées de leurs créateurs. Votre expérience de la balise peut nous aider à comprendre ces traces.', codex: ['asari', 'protheans'], catalogId: 'DIA-liara-archeologie' },
      { id: 'cipher', label: 'Comprendre le Cipher', text: 'Le Cipher transmet une compréhension de la perception prothéenne. Il aide à interpréter ce que la balise a communiqué, plutôt qu’à traduire simplement des mots. Cette compréhension vient des événements de Féros.', gate: 'after-feros', codex: ['cipher'], catalogId: 'DIA-liara-archeologie' },
      { id: 'vigil', label: 'Les révélations de Vigil', text: 'Sur Ilos, Vigil nous a transmis le témoignage des derniers Prothéens. Son explication éclaire leur disparition et le rôle du Conduit. Ce que nous avons appris dépasse les hypothèses que je pouvais formuler à partir des seules ruines.', gate: 'after-ilos', codex: ['vigil'], catalogId: 'DIA-vigil-histoire' },
    ],
  },
};

export const STORY_CODEX = [
  { id: 'protheans', name: 'Prothéens et balises', category: 'Histoire', text: 'Les vestiges prothéens comprennent des ruines et des balises capables de transmettre des informations. La balise d’Eden Prime a communiqué à Shepard des visions difficiles à interpréter.' },
  { id: 'cipher', name: 'Le Cipher', category: 'Histoire', text: 'La compréhension acquise à Féros aide Shepard à interpréter les informations prothéennes de la balise. Le Cipher concerne une manière de percevoir et de comprendre, au-delà d’une simple traduction.' },
  { id: 'sovereign', name: 'Sovereign', category: 'Menaces', text: 'La confrontation sur Virmire révèle que Sovereign est un Moissonneur, une intelligence qui dépasse le rôle d’un simple vaisseau au service de Saren.' },
  { id: 'vigil', name: 'Vigil et Ilos', category: 'Histoire', text: 'Vigil est une intelligence virtuelle prothéenne rencontrée sur Ilos. Son témoignage éclaire la disparition de cette civilisation et le rôle du Conduit dans l’accès à la Citadelle.' },
];
