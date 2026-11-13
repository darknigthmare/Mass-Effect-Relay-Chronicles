// Condensed dialogue rewrites for Relay Chronicles. These prototypes do not
// reproduce every original scene, persuasion check or later consequence.
// The fixed 50 XP completion reward is adaptation balancing, not a canonical
// Mass Effect reward. No therapy probability or medical outcome is invented.
// Conrad's relative world-completion milestones are an adaptation of return
// visits. Starting too late can leave this prototype assignment unfinished.
export const ASSIGNMENT_REWARD_XP = 50;

export const ASSIGNMENT_CONTACTS = {
  'samesh-bhatia': { id: 'samesh-bhatia', label: 'Samesh Bhatia', speaker: 'Samesh Bhatia', x: -5, z: 11.5, assignmentId: 'homecoming' },
  bosker: { id: 'bosker', label: 'Greffier Bosker', speaker: 'Greffier Bosker', x: 5, z: -3, assignmentId: 'homecoming' },
  'petrovsky-family': { id: 'petrovsky-family', label: 'La famille Petrovsky', speaker: 'Rebekah et Michael Petrovsky', x: -5, z: -8.5, assignmentId: 'family' },
  'conrad-verner': { id: 'conrad-verner', label: 'Conrad Verner', speaker: 'Conrad Verner', x: 5, z: 12.5, assignmentId: 'fan' },
};

export const ASSIGNMENTS = {
  homecoming: {
    title: 'Citadelle : Retour à la maison', catalogId: 'SIDE-citadelle-retour-a-la-maison',
    objectives: {
      requested: 'Parler au greffier Bosker au sujet du corps de Nirali Bhatia.',
      'body-authorized': 'Informer Samesh de la restitution du corps de Nirali.',
      'research-supported': 'Expliquer à Samesh pourquoi l’Alliance souhaite poursuivre ses recherches.',
      completed: 'Assignation terminée.',
    },
    summaries: {
      requested: 'Samesh Bhatia souhaite retrouver le corps de son épouse Nirali, tuée sur Eden Prime. L’Alliance le conserve pour des recherches.',
      'body-authorized': 'Bosker a autorisé la restitution du corps. Samesh attend votre compte rendu.',
      'research-supported': 'Vous avez soutenu la poursuite des recherches de l’Alliance. Samesh doit en être informé.',
    },
    outcomes: {
      'return-body': 'Le corps de Nirali est rendu à Samesh.',
      research: 'L’Alliance conserve le corps pour ses recherches ; Samesh a été informé.',
    },
  },
  family: {
    title: 'Citadelle : Affaire familiale', catalogId: 'SIDE-citadelle-affaire-familiale',
    objectives: { discussion: 'Écouter Rebekah et Michael puis répondre à leurs inquiétudes.', completed: 'Assignation terminée.' },
    summaries: { discussion: 'Michael s’inquiète de la santé de l’enfant de son frère disparu. Rebekah hésite à accepter une thérapie génique prénatale.' },
    outcomes: {
      'support-therapy': 'Vous avez soutenu la thérapie proposée, en rappelant que la décision revient à Rebekah avec ses médecins.',
      'respect-refusal': 'Vous avez soutenu le refus de Rebekah et invité Michael à respecter sa décision.',
    },
  },
  fan: {
    title: 'Citadelle : Le Fan', catalogId: 'SIDE-citadelle-le-fan',
    objectives: {
      signed: 'Poursuivre l’enquête ; Conrad pourra vous revoir après une mission principale.',
      photographed: 'Poursuivre l’enquête ; reparler à Conrad après une autre mission principale.',
      completed: 'Assignation terminée.',
    },
    summaries: {
      signed: 'Conrad Verner a obtenu un autographe. Les retrouvailles dépendent de l’avancement de l’enquête, pas de simples allers-retours.',
      photographed: 'Conrad a obtenu une photographie avec Shepard. Une nouvelle discussion attend la suite de l’enquête.',
    },
    outcomes: { 'return-home': 'Vous avez dissuadé Conrad de vous suivre au combat et l’avez encouragé à retrouver sa famille.' },
  },
};

export const ASSIGNMENT_DIALOGUE = {
  sameshOffer: { text: 'Mon épouse Nirali a été tuée sur Eden Prime. L’Alliance conserve son corps et je n’arrive pas à obtenir sa restitution. Je voudrais pouvoir lui dire adieu. Pouvez-vous parler au greffier Bosker ?', choices: [
    { id: 'accept-help', label: 'Je vais parler à Bosker.', stage: 'requested', response: 'Merci, Shepard. Bosker pourra peut-être vous donner une réponse. Tout ce que je veux, c’est ramener Nirali auprès de sa famille.' },
  ] },
  sameshWaiting: { text: 'Bosker détient toujours le dossier de Nirali. Je voudrais comprendre ce qui empêche son retour auprès de sa famille.', choices: [] },
  boskerDecision: { text: 'L’Alliance étudie les blessures subies sur Eden Prime pour mieux comprendre les armes geth et protéger ses soldats. Nirali Bhatia fait partie de ces recherches. Sa famille demande cependant la restitution de son corps.', choices: [
    { id: 'return-body', label: 'Demander la restitution du corps à sa famille.', stage: 'body-authorized', outcome: 'return-body', response: 'Je vais autoriser la restitution du corps de Nirali. Prévenez Samesh ; je ferai le nécessaire pour que sa famille puisse la récupérer.' },
    { id: 'support-research', label: 'Soutenir la poursuite des recherches de l’Alliance.', stage: 'research-supported', outcome: 'research', response: 'Ces recherches pourraient nous aider à protéger d’autres soldats. Nous allons les poursuivre. Samesh mérite néanmoins une explication ; pourriez-vous lui parler ?' },
  ] },
  boskerAuthorized: { text: 'La restitution du corps de Nirali a été autorisée. Informez Samesh de cette décision.', choices: [] },
  boskerResearch: { text: 'L’Alliance poursuit ses recherches. La famille doit être informée de la décision que vous avez soutenue.', choices: [] },
  sameshBody: { text: 'Bosker vous a reçu ? Est-ce que Nirali pourra enfin revenir auprès de sa famille ?', choices: [
    { id: 'inform-family', label: 'Le corps de Nirali vous sera rendu.', stage: 'completed', response: 'Merci, Shepard. Nous allons enfin pouvoir lui dire adieu. Je n’oublierai pas ce que vous avez fait pour Nirali et pour nous.' },
  ] },
  sameshResearch: { text: 'Qu’a décidé Bosker ? Je voudrais que l’on me parle de Nirali comme d’une personne, pas seulement d’un dossier.', choices: [
    { id: 'inform-family', label: 'Expliquer la poursuite des recherches de l’Alliance.', stage: 'completed', response: 'Si ces recherches peuvent épargner cette douleur à d’autres familles… Je voulais ramener Nirali chez nous. Qu’au moins on se souvienne de ce qu’elle a donné.' },
  ] },
  sameshBodyClosed: { text: 'Nous allons pouvoir dire adieu à Nirali. Merci d’avoir obtenu son retour auprès de sa famille, Shepard.', choices: [] },
  sameshResearchClosed: { text: 'Nirali est toujours entre les mains de l’Alliance. J’espère que ces recherches permettront au moins d’épargner d’autres vies.', choices: [] },
  familyOffer: { text: 'Michael : Mon frère Jacob est mort d’une maladie héréditaire. Je m’inquiète pour son enfant ; les médecins ont proposé une thérapie génique.\n\nRebekah : Jacob était mon mari. Maintenant, je porte notre enfant, et j’ai peur que ce traitement lui fasse du mal.', choices: [
    { id: 'discuss-concerns', label: 'Écouter leurs inquiétudes.', stage: 'discussion', response: 'Michael : J’ai perdu mon frère. Je ne veux pas que son enfant souffre de la même maladie.\n\nRebekah : Et si le traitement lui faisait du mal alors qu’il n’en avait pas besoin ? Michael, c’est déjà assez difficile sans que nous nous disputions.' },
  ] },
  familyDecision: { text: 'Michael : La thérapie pourrait protéger l’enfant contre la maladie de Jacob. Les médecins ne la proposeraient pas sans raison.\n\nRebekah : Je les ai écoutés, Michael. Je connais aussi les risques du traitement. J’aime cet enfant et je ne veux pas lui faire prendre un risque inutile.', choices: [
    { id: 'support-therapy', label: 'Soutenir la thérapie, en laissant Rebekah décider.', stage: 'completed', outcome: 'support-therapy', response: 'Rebekah : Je vais reparler du traitement avec les médecins. Je veux donner à notre enfant toutes ses chances.\n\nMichael : Merci, Rebekah. Je ne voulais pas te blesser. Cet enfant, c’est aussi ce qu’il nous reste de Jacob.' },
    { id: 'respect-refusal', label: 'Demander à Michael de respecter son refus.', stage: 'completed', outcome: 'respect-refusal', response: 'Rebekah : Merci de m’avoir écoutée. Pour le moment, je ne veux pas de ce traitement.\n\nMichael : C’est ton enfant, Rebekah. Je m’inquiète, mais je vais respecter ta décision.' },
  ] },
  familyTherapyClosed: { text: 'Rebekah : Je vais poursuivre cette discussion avec les médecins. Merci de nous avoir écoutés.\n\nMichael : Je veux surtout que Rebekah et l’enfant aillent bien.', choices: [] },
  familyRefusalClosed: { text: 'Rebekah : Ma décision n’a pas changé. Merci d’avoir demandé à Michael de m’écouter.\n\nMichael : Je reste inquiet, mais je ne veux pas que nous nous déchirions pour cela.', choices: [] },
  fanAutograph: { text: 'Vous êtes Shepard ? Je suis Conrad Verner. J’admire ce que vous faites. Est-ce que vous accepteriez de me donner un autographe ?', choices: [
    { id: 'sign-autograph', label: 'Lui donner un autographe.', stage: 'signed', response: 'Un autographe de Shepard ! Merci beaucoup. Je vais vous laisser travailler ; je sais que vous avez des choses importantes à faire.' },
  ] },
  fanWaiting: { text: 'Merci d’avoir pris un moment pour moi. Vous avez une enquête à mener ; je ne vais pas vous retenir à chaque passage.', choices: [] },
  fanPhoto: { text: 'Quel plaisir de vous revoir ! Après l’autographe, est-ce que nous pourrions faire une photo ensemble ?', choices: [
    { id: 'take-photo', label: 'Accepter une photographie.', stage: 'photographed', response: 'Merci ! Une photo avec Shepard… Je vais la montrer à ma femme. Je ne vous retiens pas davantage.' },
  ] },
  fanResolution: { text: 'J’ai beaucoup réfléchi depuis notre dernière rencontre. Je pourrais vous accompagner, vous aider sur le terrain. Je sais que je n’ai pas votre expérience, mais je pourrais apprendre à vos côtés, non ?', choices: [
    { id: 'discourage-risk', label: 'Le dissuader de vous suivre et l’encourager à rentrer.', stage: 'completed', outcome: 'return-home', response: 'Vous avez raison. Ma femme m’attend, et je ne suis pas prêt pour ce que vous affrontez. Je vais rentrer. Merci d’avoir pris le temps de me parler, Shepard.' },
  ] },
};
