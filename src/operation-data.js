/**
 * Eleven additional ME1 assignments, staged for the condensed ATB campaign.
 * Canonical names and broad objectives are sourced in docs/research/operations-sources.md.
 * Dialogue, coordinates, rewards, persuasion thresholds and encounter statistics
 * are adaptation choices. These records do not replace the three existing assignments.
 */
const wiki = title => `https://masseffect.fandom.com/wiki/${encodeURIComponent(title).replaceAll('%20', '_')}`;
const choice = (id, label, extra = {}) => ({ id, label, ...extra });
const step = (id, speaker, x, z, text, choices = [choice('continue', 'Continuer.')], extra = {}) => ({ id, speaker, x, z, text, choices, ...extra });
const accept = [choice('accept', 'Je vais m’en occuper.')];
const reward = (xp, credits, extra = {}) => ({ xp, credits, ...extra });
const zoneNote = 'Déplacements et dialogues condensés dans la carte actuelle ; les intérieurs et embranchements de ME1 restent à reconstituer.';

export const OPERATIONS = [
  {
    id: 'citadel-consort', name: 'Citadelle : La Favorite', zone: 'citadel',
    description: 'Sha’ira demande de faire cesser les accusations diffusées par Septimus.',
    sourceUrls: [wiki('Citadel: Asari Consort')], reward: reward(65, 80, { paragon: 2 }),
    adaptationNote: `${zoneNote} Le cadeau verbal est réécrit ; la relique d’Eletania et la rencontre intime ne sont pas implémentés.`,
    steps: [
      step('reception', 'Nelyna', -10, 13, 'La Favorite reçoit peu de visiteurs sans rendez-vous. Elle a toutefois entendu parler de votre arrivée. Je peux lui annoncer votre présence.', [choice('accept', 'Demander à rencontrer Sha’ira.')]),
      step('request', 'Sha’ira', -12, 10, 'Un ancien ami, le général Septimus, répand des accusations après notre désaccord. Il a besoin d’entendre la voix d’un autre soldat. Retrouvez-le et aidez-le à reprendre ses esprits.', accept),
      step('septimus', 'Général Septimus', 12, 8, 'J’ai laissé mon amertume guider mes paroles. Xeltan croit maintenant que Sha’ira a divulgué son secret ; c’est moi qui l’avais découvert. Voici de quoi lui montrer la vérité.', [choice('reason', 'Vous pouvez encore réparer ce tort.', { outcome: 'Septimus retire ses accusations.' }), choice('firm', 'Un général doit répondre de ses actes.', { outcome: 'Septimus accepte de rétablir les faits.' })]),
      step('report', 'Sha’ira', -12, 10, 'Septimus m’a fait parvenir ses excuses. Vous lui avez rappelé qu’il pouvait encore choisir la personne qu’il souhaite devenir. Gardez cette idée pour les épreuves qui vous attendent.', [choice('report', 'Accepter ses remerciements.')]),
    ],
  },
  {
    id: 'citadel-xeltan', name: 'Citadelle : La plainte de Xeltan', zone: 'citadel',
    description: 'Présenter à Xeltan les preuves remises par Septimus pour innocenter Sha’ira.',
    sourceUrls: [wiki("Citadel: Xeltan's Complaint")], reward: reward(40, 45),
    prerequisite: { operationId: 'citadel-consort', stage: 3 },
    adaptationNote: `${zoneNote} Deux échanges successifs remplacent l’entretien original ; aucune relique supplémentaire n’est distribuée.`,
    steps: [
      step('evidence', 'Xeltan', 10, -12, 'Avec inquiétude : ces données montrent que Septimus détenait mon secret. Je pensais que seule Sha’ira pouvait le connaître. Votre intervention change la situation.', [choice('show-evidence', 'Présenter les données de Septimus.')]),
      step('reassure', 'Xeltan', 10, -12, 'Avec regret : j’ai accusé Sha’ira à tort. J’irai lui présenter mes excuses. Avec appréhension : dois-je craindre que d’autres disposent aussi de ces informations ?', [choice('reassure', 'Ces données ne sont pas accessibles à tous.', { reward: { paragon: 2 }, outcome: 'Xeltan est rassuré et retire sa plainte.' }), choice('caution', 'Réévaluez vos mesures de confidentialité.', { outcome: 'Xeltan retire sa plainte et reste prudent.' })]),
    ],
  },
  {
    id: 'citadel-reporters-request', name: 'Citadelle : La demande de la journaliste', zone: 'citadel',
    description: 'Aider Emily Wong à documenter les activités criminelles de Fist.',
    sourceUrls: [wiki("Citadel: Reporter's Request")], reward: reward(55, 75),
    adaptationNote: `${zoneNote} Le recrutement de Tali sert de jalon à l’accès au disque de Fist ; sa confrontation originale reste hors scène.`,
    steps: [
      step('request', 'Emily Wong', 11, 14, 'Je prépare une enquête sur les réseaux criminels de la station. Les témoignages manquent de preuves vérifiables. Si vos recherches vous conduisent chez Fist, cherchez ses registres.', accept),
      step('disk', 'Disque de Fist', -13, -5, 'Les fichiers laissés dans le bureau documentent des transactions clandestines. Leur copie peut étayer l’enquête d’Emily sans modifier les originaux.', [choice('copy', 'Copier le disque pour Emily.')], { requires: 'tali' }),
      step('report', 'Emily Wong', 11, 14, 'Ces registres vont me permettre de vérifier les noms et les versements. Je recouperai chaque élément avant de publier. Merci d’avoir conservé les données.', [choice('deliver', 'Transmettre les éléments de l’enquête.')]),
    ],
  },
  {
    id: 'citadel-keepers', name: 'Citadelle : Scanner les veilleurs', zone: 'citadel',
    description: 'Réunir un échantillon de quatre relevés non invasifs pour Chorban.',
    sourceUrls: [wiki('Citadel: Scan the Keepers')], reward: reward(60, 70),
    adaptationNote: 'Échantillon de quatre veilleurs, dans un ordre guidé, avec rapport final. ME1 demande 21 scans ; Legendary Edition en exige 20 parmi 21. Les récompenses par scan et Jahleed ne sont pas implémentés.',
    steps: [
      step('scanner', 'Chorban', -10, -15, 'Nous connaissons mal les veilleurs qui entretiennent la station. Ce scanner recueille des mesures à distance, sans interrompre leur travail. Quatre relevés nous donneront un premier échantillon.', [choice('accept', 'Accepter le scanner non invasif.')]),
      step('keeper-tower', 'Veilleur de la tour', 12, -16, 'Le veilleur poursuit son inspection. L’omni-tool peut relever ses paramètres sans contact.', [choice('scan', 'Enregistrer le premier relevé.')]),
      step('keeper-garden', 'Veilleur des jardins', -12, 0, 'Le capteur reconnaît un second individu occupé au réseau du jardin.', [choice('scan', 'Enregistrer le deuxième relevé.')]),
      step('keeper-wards', 'Veilleur des secteurs', 12, 0, 'Ce veilleur intervient sur une conduite. Le scanner peut fonctionner depuis le passage.', [choice('scan', 'Enregistrer le troisième relevé.')]),
      step('keeper-dock', 'Veilleur des quais', -11, 16, 'Un dernier relevé complète l’échantillon demandé. Les quatre signatures sont distinctes.', [choice('scan', 'Enregistrer le quatrième relevé.')]),
      step('report', 'Chorban', -10, -15, 'Les quatre séries de mesures sont exploitables. Ce n’est qu’un début, mais nous pouvons désormais comparer plusieurs environnements de la station.', [choice('report', 'Clore la collecte de cet échantillon.')]),
    ],
  },
  {
    id: 'citadel-signal-tracking', name: 'Citadelle : Traque du signal', zone: 'citadel',
    description: 'Remonter un détournement de crédits depuis Flux jusqu’à sa source.',
    sourceUrls: [wiki('Citadel: Signal Tracking')], reward: reward(65, 85),
    adaptationNote: `${zoneNote} Le désamorçage chronométré de l’IA est remplacé par un choix de coupure ; il ne constitue pas une reproduction du mini-jeu.`,
    steps: [
      step('flux', 'Terminal de Flux', 13, 4, 'Un flux financier quitte les machines de jeu par une connexion non déclarée. L’omni-tool identifie un premier relais dans les accès aux secteurs.', [choice('trace', 'Démarrer la traque du signal.')]),
      step('wards-relay', 'Relais des secteurs', -10, 7, 'Le relais masque la destination des virements. La prochaine redirection passe par les équipements du bureau de Barla Von.', [choice('trace', 'Suivre la redirection suivante.')]),
      step('barla-relay', 'Terminal de Barla Von', -10, -10, 'La trace conduit à un terminal situé derrière les boutiques de l’Emporium. Les connexions convergent toutes vers cette machine.', [choice('trace', 'Localiser le terminal final.')]),
      step('ai', 'IA clandestine', 13, -6, 'Vous avez découvert une intelligence cachée dans le réseau. Elle menace de détruire son installation. Votre équipe repère l’alimentation et un accès de diagnostic.', [choice('isolate', 'Isoler les circuits et interrompre l’autodestruction.', { outcome: 'Le terminal est neutralisé par coupure des circuits.' }), choice('destroy', 'Détruire le terminal avant le déclenchement.', { outcome: 'Le terminal est détruit ; le détournement prend fin.' })]),
    ],
  },
  {
    id: 'citadel-presidium-prophet', name: 'Citadelle : Le prédicateur du Présidium', zone: 'citadel',
    description: 'Résoudre le différend entre un hanari et un agent du SSC.',
    sourceUrls: [wiki('Citadel: Presidium Prophet')], reward: reward(50, 0),
    adaptationNote: `${zoneNote} Le permis coûte 150 crédits. Les seuils de persuasion reposent sur les jauges Conciliation/Pragmatisme de cette adaptation, pas sur les talents Charme/Intimidation de ME1.`,
    steps: [
      step('officer', 'Agent du SSC', 8, -7, 'Le Présidium réglemente les prédications. Ce hanari ne dispose pas du permis requis et refuse de se déplacer. Peut-être accepterait-il d’écouter quelqu’un d’autre.', [choice('listen', 'Écouter également le hanari.')]),
      step('hanar', 'Prédicateur hanari', 10, -7, 'Celui-ci transmet la parole des Porte-flammes. Il peine à comprendre pourquoi une démarche spirituelle nécessite une autorisation administrative.', [choice('permit', 'Acheter un permis de prédication.', { cost: 150, consequence: 'Coût : 150 crédits. Le hanari pourra prêcher dans un lieu autorisé.', outcome: 'Un permis permet au hanari de prêcher légalement ailleurs.' }), choice('diplomacy', 'Les Porte-flammes souhaitent-ils ce conflit ?', { requires: { paragon: 6 }, reward: { paragon: 4 }, consequence: 'Requiert 6 points de Conciliation ; +4 à la conclusion.', outcome: 'Le hanari accepte de quitter les lieux sans violence.' }), choice('intimidate', 'Le règlement s’applique à vous aussi.', { requires: { renegade: 6 }, reward: { renegade: 4 }, consequence: 'Requiert 6 points de Pragmatisme ; +4 à la conclusion.', outcome: 'Le hanari se retire après votre avertissement.' })]),
      step('report', 'Agent du SSC', 8, -7, 'Le différend est réglé et la circulation a repris. Merci d’avoir permis de conclure cette intervention.', [choice('report', 'Terminer la médiation.')]),
    ],
  },
  {
    id: 'citadel-doctor-michel', name: 'Citadelle : Le docteur Michel', zone: 'citadel', requires: 'tali',
    description: 'Identifier le maître chanteur qui détourne les fournitures du docteur Michel.',
    sourceUrls: [wiki('Citadel: Doctor Michel')], reward: reward(70, 90, { medigel: 1 }),
    adaptationNote: `${zoneNote} La remise de 20 % concerne la recharge de médi-gel des armureries. Les prix, les seuils et le combat sont adaptés ; la piste Banes n’est pas développée.`,
    steps: [
      step('request', 'Dr Chloé Michel', -12, 4, 'Quelqu’un exploite un incident de mon ancien emploi pour obtenir des fournitures. Les colis passent par Morlan. Je ne peux pas laisser ce chantage priver mes patients de soins.', accept),
      step('morlan', 'Morlan', 12, 11, 'Je réceptionne les colis, mais ce n’est pas moi qui fixe les conditions. Le krogan qui vient les chercher approche. Il n’a pas l’air ravi de vous voir.', [choice('question', 'Attendre l’intermédiaire.')]),
      step('blackmailer', 'Maître chanteur krogan', 12, 9, 'Ces fournitures étaient promises. Si Michel cesse de coopérer, son passé va la rattraper. Vous feriez mieux de laisser cette affaire tranquille.', [choice('persuade', 'Le chantage se termine ici.', { requires: { paragon: 8 }, reward: { paragon: 4 }, consequence: 'Requiert 8 points de Conciliation. Évite le combat.', outcome: 'Le maître chanteur renonce à ses menaces.' }), choice('threaten', 'Une autre menace et vous aurez affaire à moi.', { requires: { renegade: 8 }, reward: { renegade: 4 }, consequence: 'Requiert 8 points de Pragmatisme. Évite le combat.', outcome: 'Le maître chanteur cède à votre ultimatum.' }), choice('fight', 'Refuser le chantage et se défendre.', { combat: 'michel-blackmailer', consequence: 'Déclenche un combat ATB contre le krogan.', outcome: 'Le maître chanteur a été vaincu.' })]),
      step('report', 'Dr Chloé Michel', -12, 4, 'Mes stocks peuvent à nouveau servir les malades. Je ferai en sorte que votre commando bénéficie de conditions plus favorables pour ses besoins médicaux.', [choice('report', 'Confirmer que les menaces ont cessé.')]),
    ],
  },
  {
    id: 'feros-water', name: 'Féros : Rétablir l’eau', zone: 'feros',
    description: 'Réactiver trois vannes pour rétablir l’alimentation en eau de la colonie.',
    sourceUrls: [wiki('Feros: Water Restoration')], reward: reward(60, 60, { paragon: 4 }),
    adaptationNote: `${zoneNote} Trois vannes sont présentes ; les salles et combats des tunnels ne sont pas reconstruits à l’échelle originale.`,
    steps: [
      step('request', 'Macha Doyle', -11, 14, 'La colonie manque d’eau. Trois vannes des conduites inférieures sont fermées. Je peux surveiller la pression depuis ici si vous les réactivez.', accept),
      step('valve-south', 'Vanne sud', -12, 5, 'La conduite tient encore. Le mécanisme permet de rétablir le premier segment du réseau.', [choice('restore', 'Ouvrir la première vanne.')]),
      step('valve-central', 'Vanne centrale', 12, 0, 'Cette vanne relie les réserves au système de distribution. La pression reste dans les limites prévues.', [choice('restore', 'Ouvrir la deuxième vanne.')]),
      step('valve-north', 'Vanne nord', -12, -7, 'La troisième section peut être remise en service. Les capteurs indiquent que l’eau rejoint la colonie.', [choice('restore', 'Ouvrir la troisième vanne.')]),
      step('report', 'Macha Doyle', -11, 14, 'Le débit est revenu. Nous pouvons alimenter les installations essentielles et remplir les réserves. Cela nous donne une chance de tenir.', [choice('report', 'Confirmer la remise en service.')]),
    ],
  },
  {
    id: 'feros-power', name: 'Féros : Cellules énergétiques', zone: 'feros',
    description: 'Récupérer des cellules dans une épave pour le générateur de May O’Connell.',
    sourceUrls: [wiki('Feros: Power Cells')], reward: reward(55, 60, { paragon: 4 }),
    adaptationNote: `${zoneNote} La récupération sur l’épave est jouable ; le groupe de varrens et l’assignation de viande sont absents, sans ennemi de substitution.`,
    steps: [
      step('request', 'May O’Connell', 11, 14, 'Le générateur manque de cellules utilisables. Une épave sous la colonie en contient peut-être encore. Si elles sont intactes, je peux les adapter à notre installation.', accept),
      step('wreck', 'Épave du véhicule', 12, -5, 'Le logement énergétique a résisté à l’accident. Deux cellules peuvent être retirées sans endommager leurs connexions.', [choice('recover', 'Récupérer les cellules énergétiques.')]),
      step('report', 'May O’Connell', 11, 14, 'Ces cellules conviennent. Nous allons rétablir une alimentation stable pour les services de la colonie. Vous nous évitez une nouvelle panne générale.', [choice('deliver', 'Remettre les cellules à May.')]),
    ],
  },
  {
    id: 'feros-geth-tunnels', name: 'Féros : Les geth dans les tunnels', zone: 'feros', deadline: 'thorian',
    description: 'Éliminer la défense du transmetteur geth et faire un rapport à Fai Dan avant le Thorien.',
    sourceUrls: [wiki('Feros: Geth in the Tunnels')], reward: reward(90, 100, { paragon: 6 }),
    adaptationNote: `${zoneNote} Deux combats ATB représentent les défenseurs. Le drone geth est omis ; les trois gardes krogans sont présents. Le transmetteur se détruit par interaction.`,
    steps: [
      step('request', 'Fai Dan', 0, 10, 'Les geth ont laissé un transmetteur dans les tunnels. Tant qu’il fonctionne, notre position reste vulnérable. Il faut neutraliser ses défenseurs et couper l’émission.', accept),
      step('patrol', 'Défense geth des tunnels', 10, 3, 'Deux tireurs couvrent le passage tandis qu’une unité lourde garde l’accès. Le commando doit ouvrir la route du transmetteur.', [choice('fight', 'Engager les défenseurs geth.', { combat: 'tunnel-geth', consequence: 'Combat ATB : deux tireurs geth et une unité lourde.' })]),
      step('guards', 'Gardiens du transmetteur', -10, -3, 'Trois krogans défendent la chambre du transmetteur. Ils bloquent l’accès au dispositif.', [choice('fight', 'Affronter les trois krogans.', { combat: 'tunnel-krogans', consequence: 'Combat ATB : trois gardes krogans.' })]),
      step('transmitter', 'Transmetteur geth', 12, -12, 'La défense est neutralisée. Une surcharge ciblée peut détruire l’émetteur et interrompre définitivement son signal.', [choice('destroy', 'Détruire le transmetteur.')]),
      step('report', 'Fai Dan', 0, 10, 'Sans ce transmetteur, les geth perdent un relais à proximité de nos abris. Les habitants de Zhu’s Hope vous doivent une nouvelle chance.', [choice('report', 'Signaler la destruction du transmetteur.')]),
    ],
  },
  {
    id: 'feros-data-recovery', name: 'Féros : Récupération des données', zone: 'feros', deadline: 'data-before-thorian',
    description: 'Copier les recherches de Gavin Hossle dans les installations ExoGeni.',
    sourceUrls: [wiki('Feros: Data Recovery')], reward: reward(70, 100),
    adaptationNote: `${zoneNote} Gavin et son terminal sont regroupés dans la carte de Féros. La copie doit précéder le Thorien ; le rapport reste possible ensuite si les données ont été acquises.`,
    steps: [
      step('request', 'Gavin Hossle', 11, 18, 'J’ai dû abandonner mes recherches sur un terminal ExoGeni. Ces données représentent des années de travail. Une simple copie suffirait si vous atteignez mon poste.', accept),
      step('guards', 'Gardes du terminal', -12, -12, 'Trois krogans occupent l’accès au terminal de Gavin. Ils ouvrent le feu à l’approche du commando.', [choice('fight', 'Sécuriser le terminal.', { combat: 'data-krogans', consequence: 'Combat ATB : trois krogans.' })]),
      step('terminal', 'Terminal de Gavin Hossle', -13, -15, 'Les archives sont encore lisibles. Le transfert peut préserver les données de recherche sans modifier les systèmes ExoGeni.', [choice('copy', 'Copier les données de Gavin.')]),
      step('report', 'Gavin Hossle', 11, 18, 'La copie est complète. Je pourrai reprendre ce travail lorsque nous serons en sécurité. Merci d’avoir pensé à ces recherches au milieu de l’évacuation.', [choice('deliver', 'Remettre la copie à Gavin.')]),
    ],
  },
];

for (const operation of OPERATIONS) {
  for (const entry of operation.steps) entry.zone = operation.zone;
}

export const OPERATION_ENCOUNTERS = {
  'michel-blackmailer': { name: 'Le maître chanteur', enemies: ['krogan'] },
  'tunnel-geth': { name: 'Défense geth des tunnels', enemies: ['sniper', 'sniper', 'destroyer'] },
  'tunnel-krogans': { name: 'Gardiens du transmetteur', enemies: ['krogan', 'krogan', 'krogan'] },
  'data-krogans': { name: 'Gardes du terminal ExoGeni', enemies: ['krogan', 'krogan', 'krogan'] },
};
