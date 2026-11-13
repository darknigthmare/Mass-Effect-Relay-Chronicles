/**
 * Documentary contexts, not a claim that a catalogue has become a campaign.
 * Dates come only from the local catalogue's cited statements. A null date is
 * intentional: publication dates, names such as 2175 Aeia, and fan chronology
 * must not silently become dates of events. Context IDs never unlock a range.
 */
const freeze = value => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
};

const period = (id, label, sourceIds, reference, extra = {}) => ({
  id, label, yearStart: null, yearEnd: null, sourceIds, reference,
  uncertainty: 'Le contexte est celui du récit cité ; aucune année ni présence par scène supplémentaire n’est déduite.',
  ...extra,
});
const work = (id, title, kind, galaxy, periods, extra = {}) => ({
  id, mediaId: id, title, kind, galaxy, timeline: galaxy === 'andromeda' ? 'andromeda' : 'trilogy',
  locked: false, reason: '', periods, ...extra,
});

export const MEDIA_PERIODS = freeze([
  work('ME1', 'Mass Effect', 'game', 'milky-way', [
    period('me1', 'Campagne de Mass Effect', ['ME1-MANUAL'], 'Catalogue ME1 ; périmètre de la campagne de référence'),
  ]),
  work('ME2', 'Mass Effect 2', 'game', 'milky-way', [
    period('me2', 'Mass Effect 2 — campagne et extensions', ['ME2-SRC-EA-LE'], 'Catalogue ME2 ; campagne solo'),
    period('me2-opening', 'Ouverture — attaque du Normandy SR-1', ['ME2-SRC-EA-LE'], 'ME2-MQ-SAVE-JOKER'),
  ]),
  work('ME3', 'Mass Effect 3', 'game', 'milky-way', [
    period('me3', 'Mass Effect 3 — campagne et extensions', ['ME3-SRC-EA-LE'], 'Catalogue ME3 ; campagne solo'),
    period('me3-prologue', 'Prologue terrestre', ['ME3-SRC-EA-LE'], 'ME3-MQ-EARTH-PROLOGUE ; ME3-CHR-ANDERSON'),
    period('me3-multiplayer', 'Multijoueur de Mass Effect 3 original', ['ME3-SRC-EA-LE'], 'Périmètre du catalogue ME3', {
      uncertainty: 'Module distinct du solo ; absent de Legendary Edition. Ne fournit aucun équipier de campagne.',
    }),
  ]),
  work('MEA', 'Mass Effect Andromeda', 'game', 'andromeda', [
    period('mea', 'Andromeda — campagne dans Heleus', ['MEA-SRC-EA-GAME'], 'Catalogue MEA ; campagne solo'),
    period('mea-prologue', 'Réveil de l’Hyperion et Habitat 7', ['MEA-SRC-EA-GAME'], 'MEA-MQ-HYPERION ; MEA-MQ-PLANETSIDE'),
    period('mea-apex', 'APEX et multijoueur', ['MEA-SRC-EA-GAME'], 'Périmètre du catalogue MEA', {
      uncertainty: 'Module distinct ; ses classes ne deviennent pas des équipiers du Tempest.',
    }),
  ]),
  work('INF', 'Mass Effect: Infiltrator', 'mobile-game', 'milky-way', [
    period('inf', 'Évasion de Randall — récit Infiltrator', ['INF-OFFICIAL'], 'Campagne de Randall ; catalogue INF'),
  ]),
  work('GAL', 'Mass Effect: Galaxy', 'mobile-game', 'milky-way', [
    period('gal', 'Enquête de Jacob — position chronologique contestée', ['GAL-BIO', 'GAL-STORY', 'GAL-JATH'], 'GAL-CNT-DATE', {
      uncertainty: 'BioWare indique entre ME1 et ME2 ; les repères secondaires divergent. Aucune année précise n’est retenue.',
    }),
  ]),
  work('REV', 'Mass Effect: Revelation', 'novel', 'milky-way', [
    period('rev', 'Affaire Sidon — 2165 selon la référence secondaire', ['REV-SRC-SKARR'], 'REV-CON-01', {
      yearStart: 2165, yearEnd: 2165,
      uncertainty: 'Datation attribuée à la source secondaire du catalogue ; âges, tenues et texte du roman restent à contrôler.',
    }),
  ]),
  work('ASC', 'Mass Effect: Ascension', 'novel', 'milky-way', [
    period('asc', 'Projet Ascension — récit du roman', ['ASC-SRC-PUB'], 'Synopsis et périmètre du catalogue ASC'),
  ]),
  work('RET', 'Mass Effect: Retribution', 'novel', 'milky-way', [
    period('ret', 'Après Mass Effect 2 — affaire Grayson', ['RET-SRC-WIKI'], 'RET-CON-01', {
      uncertainty: 'Position relative issue de la notice secondaire ; aucune année ou édition corrigée n’est inventée.',
    }),
  ]),
  work('DEC', 'Mass Effect: Deception', 'novel', 'milky-way', [
    period('dec', 'Récit Deception — incohérences éditoriales conservées', ['DEC-SRC-PUB', 'DEC-SRC-WIKI'], 'DEC-CON-02 ; DEC-CON-03 ; DEC-CON-07', {
      uncertainty: 'Âges et raccords contradictoires ; une révision annoncée ne prouve pas une édition corrigée publiée.',
    }),
  ]),
  work('NEX', 'Mass Effect Andromeda: Nexus Uprising', 'novel', 'andromeda', [
    period('nex', 'Crise du Nexus avant l’arrivée des autres arches', ['NEX-SRC-WIKI'], 'NEX-CON-01'),
  ]),
  work('INI', 'Mass Effect Andromeda: Initiation', 'novel', 'milky-way', [
    period('ini', 'Cora et SAM-E avant le départ de l’Initiative', ['INI-SRC-PUB'], 'INI-CON-01 ; périmètre du roman'),
  ]),
  work('ANN', 'Mass Effect Andromeda: Annihilation', 'novel', 'unknown', [
    period('ann', 'Voyage de l’arche Keelah Si’yah — avant l’arrivée', ['ANN-SRC-PUB'], 'ANN-CON-03 ; ANN-REF-DARKSPACE', {
      uncertainty: 'Transit intergalactique ; ni la date de publication ni l’existence du roman ne placent ses scènes dans Heleus.',
    }),
  ], { timeline: 'andromeda' }),
  work('RED', 'Mass Effect: Redemption', 'comic', 'milky-way', [
    period('red', 'Recherche menée par Liara avant le réveil de Shepard', ['RED-S-BOOK'], 'Périmètre du catalogue RED ; RED-CNT-PLACE'),
  ]),
  work('EVO', 'Mass Effect: Evolution', 'comic', 'milky-way', [
    period('evo-contact', 'Première Guerre de Contact — numéro 1', ['EVO-S-AUTHOR1'], 'EVO-SC-RESIST-REF ; EVO-REF-WAR'),
    period('evo-aftermath', 'Après la fin des hostilités — numéros 2 à 4', ['EVO-S-AUTHOR1'], 'EVO-SC-AFTERWAR-REF ; EVO-REF-WAR', {
      uncertainty: 'La guerre se termine entre les numéros 1 et 2. Les actes suivants ne sont pas une prolongation des hostilités officielles.',
    }),
  ]),
  work('INV', 'Mass Effect: Invasion', 'comic', 'milky-way', [
    period('inv', 'Crise d’Omega — récit Invasion', ['INV-S-BOOK'], 'Périmètre du catalogue INV'),
  ]),
  work('HOM', 'Mass Effect: Homeworlds', 'anthology', 'milky-way', [
    period('hom-1-youth', '#1 — jeunesse de James Vega', ['HOM-S-ISSUE1'], 'HOM-SC-VEGA-YOUTH-REF'),
    period('hom-1-present', '#1 — James sur la Citadelle pendant ME3', ['HOM-S-ISSUE1'], 'HOM-SC-VEGA-PRESENT-REF ; HOM-CNT-PLACE'),
    period('hom-2-tali', '#2 — Tali avant sa rencontre avec Shepard', ['HOM-S-ISSUE2'], 'HOM-SC-TALI-TRACE-REF ; HOM-SC-TALI-CITADEL-REF'),
    period('hom-3-past', '#3 — souvenirs et formation de Garrus', ['HOM-S-ISSUE3'], 'HOM-SC-GARRUS-PAST-REF'),
    period('hom-3-omega', '#3 — Garrus pendant la période Archangel', ['HOM-S-ISSUE3'], 'HOM-SC-GARRUS-OMEGA-REF'),
    period('hom-4-liara', '#4 — recherches de Liara avant ME3', ['HOM-S-DH4', 'HOM-S-ISSUE4'], 'HOM-SC-LIARA-ARCHIVE-REF ; HOM-SC-LIARA-KAHJE-REF'),
  ]),
  work('FOU', 'Mass Effect: Foundation', 'anthology', 'milky-way', [
    ...[
      ['Passé sur Themis', 'FOU-S-ISSUE1'], ['Dossier Wrex', 'FOU-S-CHARS'],
      ['Point de vue d’Ashley sur Eden Prime', 'FOU-S-STORY'], ['Formation de Kaidan à Gagarin', 'FOU-S-ISSUE4'],
      ['Recherche du corps de Shepard', 'FOU-S-ISSUE5'], ['Piège batarian', 'FOU-S-ISSUE6'],
      ['Opération visant Jack', 'FOU-S-ISSUE7'], ['Rencontre avec Thane', 'FOU-S-ISSUE8'],
      ['Opération de Mordin', 'FOU-S-ISSUE9'], ['Dossier Kasumi', 'FOU-S-ISSUE10'],
      ['Opération de Zaeed', 'FOU-S-ISSUE11'], ['Passé familial de Thane', 'FOU-S-ISSUE12'],
      ['Rasa et le clone depuis Lazarus', 'FOU-S-ISSUE13'],
    ].map(([label, source], index) => period(`fou-${index + 1}`, `#${index + 1} — ${label}`, [source], `FOU-SC-${String(index + 1).padStart(2, '0')}-REF`, {
      uncertainty: 'Segment narratif du numéro cité, sans année globale. Les souvenirs et le cadre narratif ne rendent pas tous les acteurs simultanément présents.',
    })),
  ]),
  work('INC', 'Mass Effect: Incursion', 'comic', 'milky-way', [
    period('inc', 'Raid sur Omega — récit Incursion', ['INC-S-PAIR', 'INC-S-WIKI'], 'INC-REF-TIMING', {
      uncertainty: 'Le placement précis avant ME2 vient d’une source secondaire à contrôler ; aucune année n’est fixée.',
    }),
  ]),
  work('INQ', 'Mass Effect: Inquisition', 'comic', 'milky-way', [
    period('inq', 'Enquête de Bailey — après ME2 selon la notice secondaire', ['INQ-S-PAIR', 'INQ-S-WIKI'], 'INQ-CNT-PLACE'),
  ]),
  work('CON', 'Mass Effect: Conviction', 'comic', 'milky-way', [
    period('con', 'Vega et son affectation auprès de Shepard', ['CON-S-WIKI'], 'CON-REF-SCOPE ; CON-SC-DUTY-REF', {
      uncertainty: 'Chronologie et détails issus du repérage secondaire ; pas de date précise ni de nouvelle campagne attestée.',
    }),
  ]),
  work('BLA', 'Mass Effect: Blasto: Eternity is Forever', 'in-universe-fiction', 'unknown', [], {
    locked: true, timeline: 'fiction', reason: 'Fiction à l’intérieur de l’univers : ses événements ne constituent pas une campagne historique.',
  }),
  work('HWB', 'Mass Effect: He Who Laughs Best', 'comic', 'milky-way', [
    period('hwb', 'Essai du Normandy SR-1 et affectation de Joker', ['HWB-S-WIKI', 'HWB-S-OMNI2'], 'HWB-REF-PILOT ; HWB-SC-FLIGHT-REF'),
  ]),
  work('LIB', 'Mass Effect Library Edition', 'collection', 'unknown', [], {
    locked: true, timeline: 'editorial', reason: 'Compilation éditoriale : les périodes appartiennent aux récits rassemblés ; aucune époque supplémentaire.',
  }),
  work('DIS', 'Mass Effect: Discovery', 'comic', 'milky-way', [
    period('dis', 'Infiltration de l’Initiative avant le voyage', ['DIS-S-BOOK'], 'DIS-CNT-PLACE ; périmètre de Discovery', {
      uncertainty: 'Préquelle en Voie lactée ; ne constitue pas une mission de Ryder dans Heleus.',
    }),
  ], { timeline: 'andromeda' }),
  work('PL', 'Mass Effect: Paragon Lost', 'film', 'milky-way', [
    period('pl-2183', 'Ouverture — attaque initiale de Fehl Prime', ['PL-SRC-WIKI'], 'PL-CON-02', {
      uncertainty: 'La notice secondaire indique 2183 ; le cartouche temporel du film reste à vérifier. Année numérique non certifiée.',
    }),
    period('pl-collectors', 'Deux ans plus tard — crise des Récolteurs', ['PL-SRC-WIKI'], 'PL-CON-02', {
      uncertainty: 'Repère relatif de la source secondaire, à contrôler dans le film. Liara intervient à distance, pas physiquement sur Fehl Prime.',
    }),
  ]),
  work('ME4', 'Mass Effect suivant — dossier prospectif', 'speculation', 'unknown', [], {
    locked: true, timeline: 'unassigned',
    reason: 'Projet documentaire et créations d’adaptation ; scénario et période de campagne officiels non établis.',
    verificationNote: 'L’allégation d’annulation en octobre 2026 figurant dans le catalogue n’a pas été validée. Elle n’est pas retenue comme fait ; les données originales restent des documents à vérifier.',
  }),
  work('CUT', 'Mass Effect : contenus coupés et concepts abandonnés', 'cut-content', 'unknown', [], {
    locked: true, timeline: 'unassigned', reason: 'Archives de contenus coupés, concepts et allégations : aucune insertion automatique dans la continuité publiée.',
  }),
]);

export const COMMON28 = freeze(MEDIA_PERIODS.map(item => item.id));
const mediaById = new Map(MEDIA_PERIODS.map(item => [item.id, item]));

/** Unknown IDs return null; a missing period never selects the first one. */
export function getMediaPeriod(mediaId, periodId) {
  if (typeof mediaId !== 'string') return null;
  const media = mediaById.get(mediaId) || null;
  if (periodId === undefined) return media;
  return typeof periodId === 'string' ? media?.periods.find(item => item.id === periodId) || null : null;
}

const homScenes = [
  ['VEGA-YOUTH', 'hom-1-youth'], ['VEGA-PRESENT', 'hom-1-present'],
  ['TALI-TRACE', 'hom-2-tali'], ['TALI-CITADEL', 'hom-2-tali'],
  ['GARRUS-PAST', 'hom-3-past'], ['GARRUS-OMEGA', 'hom-3-omega'],
  ['LIARA-ARCHIVE', 'hom-4-liara'], ['LIARA-KAHJE', 'hom-4-liara'],
];
const homActors = {
  // HOM-REF-ISSUE4 is established by the publisher's notice. A book-level
  // identity for the other protagonists does not establish their age or scene.
  LIARA: ['hom-4-liara'],
};
// Only the search in FOU-SC-05-REF is established at scene level. Other
// character/issue associations come from locator rows marked À vérifier.
const foundationActors = {
  MIRANDA: [5], JACOB: [5],
};

function segmentIds(mediaId, entry) {
  const id = entry.id || '';
  if (mediaId === 'HOM') {
    if (id === 'HOM-REF-ISSUE4') return ['hom-4-liara'];
    const scene = homScenes.find(([key]) => id.startsWith(`HOM-SC-${key}-`));
    if (scene) return [scene[1]];
    return homActors[id.replace(/^HOM-ACT-/, '')] || [];
  }
  if (mediaId === 'FOU') {
    const scene = /^FOU-SC-(\d{2})-/.exec(id);
    if (scene) return [`fou-${Number(scene[1])}`];
    const actor = foundationActors[id.replace(/^FOU-ACT-/, '')];
    return actor ? actor.map(number => `fou-${number}`) : [];
  }
  if (mediaId === 'PL') {
    // The catalogue explicitly leaves individual deaths and scene membership
    // to be checked (PL-CON-08). Do not spread the whole cast over both phases.
    if (['PL-CHR-ARCHUK', 'PL-REF-BLOOD'].includes(id)) return ['pl-2183'];
    if (['PL-CHR-VEGA', 'PL-REF-COLLECTOR', 'PL-REF-BROODSHIP', 'PL-CHR-LIARA'].includes(id)) return ['pl-collectors'];
    return [];
  }
  if (mediaId === 'EVO') {
    if (id.startsWith('EVO-SC-RESIST-')) return ['evo-contact'];
    if (['AFTERWAR', 'ILLIUM', 'PALAVEN', 'BREAK'].some(scene => id.startsWith(`EVO-SC-${scene}-`))) return ['evo-aftermath'];
    return []; // Generic character/artefact cards have no precise scene proof.
  }
  if (mediaId === 'ME3') {
    if (id === 'ME3-CHR-SHEPARD') return ['me3', 'me3-prologue'];
    if (/^ME3-(?:CHR|ZON|SYS)-MP-/.test(id) || id === 'ME3-ENM-DRAGOON') return ['me3-multiplayer'];
    if (['ME3-CHR-ANDERSON', 'ME3-MQ-EARTH-PROLOGUE'].includes(id)) return ['me3-prologue'];
    return ['me3'];
  }
  if (mediaId === 'MEA') {
    if (id === 'MEA-CHR-RYDER') return ['mea', 'mea-prologue'];
    if (/^MEA-(?:CHR|ZON|SYS)-MP-/.test(id)) return ['mea-apex'];
    if (['MEA-CHR-ALEC', 'MEA-NPC-FISHER', 'MEA-NPC-GREER', 'MEA-NPC-KIRKLAND', 'MEA-MQ-HYPERION', 'MEA-MQ-PLANETSIDE', 'MEA-WRL-HABITAT7'].includes(id) || id.startsWith('MEA-ZON-HYP-')) return ['mea-prologue'];
    return ['mea'];
  }
  if (mediaId === 'ME2' && id === 'ME2-MQ-SAVE-JOKER') return ['me2-opening'];
  return [mediaId.toLowerCase()];
}

/** Epoch eligibility only. Textual conditions and actual implementation remain
 * separate requirements; this function never grants an asset, actor or item. */
export function getEntryContinuity(catalogWorkId, entry = {}) {
  const mediaId = catalogWorkId === 'ME1' && ['ME2', 'ME3'].includes(entry.episode) ? entry.episode : catalogWorkId;
  const media = getMediaPeriod(mediaId);
  const nature = entry.nature || ({ Confirmé: 'Établi', 'Référence à vérifier': 'À vérifier', Adaptation: 'Extrapolation' }[entry.canonLevel]) || 'À vérifier';
  const fact = nature === 'Établi';
  let lockReason = !media ? 'unknown-media' : media.locked ? media.kind : !fact ? 'unverified-or-adaptation' : '';
  if (!lockReason && !(entry.sourceIds?.length || entry.sourceId || entry.sourceUrl)) lockReason = 'missing-provenance';
  const periodIds = lockReason ? [] : segmentIds(mediaId, entry).filter(id => getMediaPeriod(mediaId, id));
  if (!lockReason && periodIds.length === 0) lockReason = 'ambiguous-segment';
  return freeze({
    mediaId, nature, fact, playable: false, lockReason,
    availability: periodIds.length ? [{ mediaId, periodIds }] : [],
    continuityReferences: periodIds.map(id => getMediaPeriod(mediaId, id).reference),
  });
}

/** Fail closed on malformed/unknown context and on another work's same year. */
export function evaluateContinuity(record, context) {
  if (!record || !context || typeof context.mediaId !== 'string' || typeof context.periodId !== 'string') return false;
  const media = getMediaPeriod(context.mediaId);
  if (!media || media.locked || !getMediaPeriod(context.mediaId, context.periodId)) return false;
  if (context.galaxy !== undefined && context.galaxy !== media.galaxy) return false;
  if (!record.fact || record.lockReason || !Array.isArray(record.availability)) return false;
  return record.availability.some(item => item && item.mediaId === context.mediaId && Array.isArray(item.periodIds) && item.periodIds.includes(context.periodId));
}
