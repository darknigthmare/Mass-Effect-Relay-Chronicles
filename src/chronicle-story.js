// Short documentary readings, not alternate outcomes or reconstructed chapters.
// Every page is anchored to established catalogue facts in one exact segment.
// This module has no storage, campaign state, combat, reward or inventory access.
import { normalizeContext, canAccessContent } from './continuity.js';
import { getMediaPeriod } from './continuity-data.js';
import { getUniverseRecord, getUniverseWork } from './universe-data.js';

const copy = value => JSON.parse(JSON.stringify(value));
const sameContext = (left, right) => !!left && !!right && ['mediaId', 'periodId', 'galaxy'].every(key => left[key] === right[key]);
const fail = reason => ({ ok: false, reason });
const unique = values => [...new Set(values)];
const page = (id, title, recordIds, text) => ({ id, title, recordIds, text });
const reading = (id, mediaId, periodId, title, description, steps) => ({ id, mediaId, periodId, title, description, steps });

// Page order is a guided reading of these facts. It does not add an event,
// dialogue, date, chapter number, player decision or causal link to the source.
const DEFINITIONS = [
  reading('rev-sidon', 'REV', 'rev', 'Revelation — le dossier Sidon', 'L’enquête d’Anderson et quelques repères du roman.', [
    page('sidon', 'Le poste détruit', ['REV-REF-SIDON', 'REV-CHR-ANDERSON'], 'Le poste scientifique détruit se trouve sur Sidon. David Anderson, officier de l’Alliance, est chargé de l’enquête.'),
    page('kahlee', 'Une scientifique recherchée', ['REV-CHR-KAHLEE'], 'Kahlee Sanders est recherchée après la destruction du poste de recherche.'),
    page('camala', 'Camala et les mercenaires', ['REV-REF-CAMALA', 'REV-REF-SUNS'], 'Dah’tan Manufacturing se trouve sur Camala. Dans l’affaire Sidon, Had’dah engage des mercenaires des Soleils Bleus.'),
    page('elysium', 'Le refuge', ['REV-REF-ELYSIUM'], 'Grissom et Kahlee trouvent refuge sur Elysium.'),
    page('recherche', 'Les enjeux de l’enquête', ['REV-REF-ALLIANCE', 'REV-REF-AI'], 'L’enquête concerne un poste militaire humain secret. La recherche en intelligence artificielle fait partie des enjeux du roman.'),
  ]),
  reading('asc-projet', 'ASC', 'asc', 'Ascension — protéger Gillian', 'Le projet de l’Académie Grissom et les personnes qui protègent Gillian.', [
    page('academie', 'Le projet Ascension', ['ASC-REF-ACADEMY', 'ASC-CHR-GILLIAN'], 'Le projet Ascension est installé à l’Académie Grissom. Gillian Grayson y est une enfant biotique de douze ans.'),
    page('protection', 'Kahlee et Hendel', ['ASC-CHR-KAHLEE', 'ASC-CHR-HENDEL'], 'Kahlee Sanders, scientifique du projet, cherche à protéger Gillian. Hendel Mitra est un ancien soldat biotique et le chef de la sécurité du projet.'),
    page('cerberus', 'Les expériences clandestines', ['ASC-REF-CERBERUS'], 'Cerberus détourne le projet Ascension au moyen d’expériences clandestines.'),
    page('flotte', 'L’aide des Quariens', ['ASC-CHR-LEMM', 'ASC-REF-FLEET'], 'Le jeune Quarien Lemm aide Kahlee, Gillian et Hendel à fuir. La Flotte nomade accueille le groupe.'),
    page('idenna', 'Le voyage de l’Idenna', ['ASC-CON-07'], 'À la fin du roman, Gillian, Hendel et Lemm sont associés au voyage de l’Idenna. Kahlee revient au projet Ascension.'),
  ]),
  reading('ret-grayson', 'RET', 'ret', 'Retribution — la disparition de Grayson', 'La capture de Grayson, l’expérience de Cerberus et les recherches de Kahlee.', [
    page('omega', 'La capture sur Omega', ['RET-REF-OMEGA'], 'Paul Grayson vit sur Omega, où Cerberus le capture.'),
    page('experience', 'L’expérience', ['RET-CHR-GRAYSON', 'RET-REF-CERBERUS', 'RET-REF-REAPERS'], 'Grayson, ancien agent de Cerberus, est choisi pour une expérience menée par l’organisation avec une technologie des Moissonneurs.'),
    page('recherche', 'Kahlee fait appel à Anderson', ['RET-CHR-KAHLEE', 'RET-CHR-ANDERSON'], 'Après avoir appris la disparition de Grayson, Kahlee sollicite Anderson. Il l’aide à rechercher le centre de détention de Cerberus.'),
    page('intervention', 'L’intervention turienne', ['RET-REF-TURIANS'], 'Une force turienne attaque le centre où Grayson est détenu.'),
    page('academie', 'La crise atteint l’académie', ['RET-REF-ACADEMY'], 'La crise liée à Grayson atteint l’Académie Grissom.'),
  ]),
  reading('nex-crise', 'NEX', 'nex', 'Nexus Uprising — une station en crise', 'Le Nexus à son arrivée, avant les autres arches de l’Initiative.', [
    page('initiative', 'Le projet de colonisation', ['NEX-REF-INITIATIVE', 'NEX-REF-NEXUS'], 'L’Initiative Andromède est un projet collectif de colonisation. Sa station centrale, le Nexus, est gravement endommagée avant l’arrivée des autres arches.'),
    page('fleau', 'L’arrivée dans Héléus', ['NEX-REF-HELEUS', 'NEX-REF-SCOURGE'], 'Le Nexus atteint l’amas Héléus. À son arrivée, le Fléau lui inflige des dégâts.'),
    page('securite', 'Sloane Kelly', ['NEX-CHR-SLOANE'], 'Sloane Kelly dirige la sécurité et doit rétablir l’ordre après la crise du Nexus.'),
    page('station', 'Les responsables du Nexus', ['NEX-CHR-KESH', 'NEX-CHR-KANDROS'], 'Nakmor Kesh est surintendante du Nexus et membre du clan Nakmor. Tiran Kandros, Turien engagé dans l’Initiative, est également présent dans le roman.'),
    page('nakmor', 'Le clan Nakmor', ['NEX-REF-NAKMOR'], 'Le clan krogan Nakmor intervient dans la crise du Nexus.'),
  ]),
  reading('ini-cora', 'INI', 'ini', 'Initiation — le dossier de Cora', 'La recherche d’une technologie volée, avant le départ de l’Initiative.', [
    page('mission', 'Cora rejoint l’Initiative', ['INI-CHR-CORA'], 'Cora Harper rejoint l’Initiative comme seconde d’Alec Ryder. Elle est chargée de récupérer une technologie volée.'),
    page('theia', 'La station Theia', ['INI-REF-THEIA'], 'Dans la Voie lactée, Cora visite Theia, une base de l’Initiative.'),
    page('pistes', 'Home Away et Illium', ['INI-REF-HOMEAWAY', 'INI-REF-ILLIUM'], 'La recherche du code volé passe par l’infiltration de la station Home Away. Le dossier conduit également à Illium.'),
    page('quiet-eddy', 'Une installation clandestine', ['INI-REF-QUIET', 'INI-REF-AUGMENTS'], 'Quiet Eddy est un petit monde abritant une installation clandestine. Medea y contrôle des êtres augmentés.'),
    page('zahra', 'Zahra Said', ['INI-CHR-ZAHRA'], 'Zahra Said est une militaire survivante qui participe à la protection du groupe.'),
  ]),
  reading('ann-transit', 'ANN', 'ann', 'Annihilation — pendant le voyage', 'L’arche Keelah Si’yah et la crise qui survient avant son arrivée.', [
    page('arche', 'Une arche en transit', ['ANN-REF-ARK', 'ANN-REF-DARKSPACE'], 'La Keelah Si’yah transporte plusieurs espèces vers Andromède. La crise du roman survient pendant le trajet, avant l’arrivée à destination.'),
    page('cryostase', 'L’alerte en cryostase', ['ANN-REF-DRELL'], 'Des décès de Drells en cryostase révèlent la crise à bord de l’arche.'),
    page('blue-7', 'L’équipe de maintenance', ['ANN-CHR-SENNA', 'ANN-CHR-IRIT'], 'Le Quarien Senna’Nir est responsable de l’équipe de maintenance Blue-7. Irit Non, membre volus de l’équipe, participe au diagnostic des systèmes.'),
    page('specialistes', 'Les spécialistes de Blue-7', ['ANN-CHR-ANAX', 'ANN-CHR-YORRIK', 'ANN-CHR-YSSES'], 'Anax Therion est un analyste drell de Blue-7. Yorrik s’occupe de l’enjeu médical ; Ysses, apothicaire hanar, travaille avec lui.'),
    page('fortinbras', 'La menace pathogène', ['ANN-REF-FORTINBRAS'], 'La menace pathogène du roman porte le nom de maladie de Fortinbras.'),
  ]),
  reading('red-recherche', 'RED', 'red', 'Redemption — la recherche de Liara', 'Liara et Feron dans les repères attestés de la série.', [
    page('duo', 'Liara et Feron', ['RED-REF-FERON'], 'Liara s’allie au drell Feron pour récupérer le corps de Shepard auprès du Courtier de l’ombre.'),
    page('omega', 'La piste d’Omega', ['RED-WRL-OMEGA'], 'La recherche menée par Liara traverse Omega.'),
    page('poursuite', 'Vers la base du Courtier', ['RED-WRL-SPACE', 'RED-SC-PURSUIT-REF'], 'Le troisième numéro quitte Omega pour une poursuite spatiale. Le duo se dirige vers une base du Courtier de l’ombre.'),
    page('acces', 'Les accès de la base', ['RED-SC-ACCESS-REF'], 'Dans ses notes sur le troisième numéro, le scénariste relie les accès compartimentés de la base aux possibilités d’action de Feron.'),
    page('feron', 'Les révélations du dernier numéro', ['RED-SC-RECOVER-REF'], 'Le dernier numéro révèle le jeu multiple de Feron.'),
  ]),
  reading('inv-omega', 'INV', 'inv', 'Invasion — la défense d’Omega', 'La défense de la station et le départ d’Aria dans le récit publié.', [
    page('defense', 'Omega menacée', ['INV-REF-SCOPE', 'INV-ACT-ARIA'], 'Aria T’Loak gouverne Omega et défend la station face à une menace liée à Cerberus.'),
    page('gangs', 'La coopération des gangs', ['INV-REF-GANGS'], 'Dans les notes du dernier numéro, le scénariste souligne la coopération des gangs, visible dans leurs tactiques et leurs armes.'),
    page('depart', 'Le départ d’Aria', ['INV-SC-EXILE-REF', 'INV-REF-FINAL'], 'Le dernier numéro se conclut par le départ d’Aria. Le scénariste confirme aussi les doutes de Petrovsky à ce stade du récit.'),
  ]),
  reading('evo-apres-guerre', 'EVO', 'evo-aftermath', 'Evolution — après les hostilités', 'Les numéros 2 à 4, après la fin de la Première Guerre de Contact.', [
    page('apres-guerre', 'La fin des hostilités', ['EVO-SC-AFTERWAR-REF'], 'Le deuxième numéro d’Evolution se situe après la fin des hostilités de la Première Guerre de Contact.'),
    page('illium', 'La piste d’Illium', ['EVO-SC-ILLIUM-REF'], 'Le deuxième numéro introduit Illium et Saren dans cet arc.'),
    page('palaven', 'Le projet de Desolas', ['EVO-SC-PALAVEN-REF'], 'Dans le troisième numéro, Desolas utilise les traditions de Palaven pour son projet.'),
    page('artefact', 'Le contrôle par l’artefact', ['EVO-SC-BREAK-REF'], 'Dans les notes du dernier numéro, l’auteur décrit l’artefact comme un moyen de contrôler les êtres transformés et comme la cause de la chute de Desolas.'),
  ]),
];

function compileStory(definition) {
  const context = normalizeContext({ mediaId: definition.mediaId, periodId: definition.periodId });
  const work = getUniverseWork(definition.mediaId), period = getMediaPeriod(definition.mediaId, definition.periodId);
  if (!context || !work || !period || definition.steps.length < 3 || definition.steps.length > 6) return null;
  const steps = [];
  for (const step of definition.steps) {
    const records = step.recordIds.map(getUniverseRecord);
    if (!records.length || records.some(record => !record || record.nature !== 'Établi' || !record.fact || !canAccessContent(record.id, context).ok)) return null;
    const sourceIds = unique(records.flatMap(record => record.sourceIds || []));
    const sources = sourceIds.map(id => work.sources.find(source => source.id === id));
    if (!sources.length || sources.some(source => !source || !/^https?:\/\//.test(source.url || ''))) return null;
    steps.push({ ...step, sourceIds, sources: sources.map(source => ({ id: source.id, title: source.title, url: source.url, kind: source.kind })),
      reference: unique(records.map(record => record.reference || record.provenance?.reference).filter(Boolean)).join(' · ') });
  }
  return { id: definition.id, kind: 'documentary', title: definition.title, description: definition.description, context,
    progressRecordId: steps[0].recordIds[0], reference: period.reference, uncertainty: period.uncertainty,
    chronology: 'Repères documentaires ; aucun découpage intégral ni choix alternatif du récit.', steps };
}
// A changed or withdrawn source closes its reading instead of silently dropping
// a page or substituting a similarly named fact from another work.
const STORIES = DEFINITIONS.map(compileStory).filter(Boolean);
const byId = new Map(STORIES.map(story => [story.id, story]));

export function listChronicleStories(rawContext) {
  const context = normalizeContext(rawContext);
  return context ? STORIES.filter(story => sameContext(story.context, context)).map(story => ({
    id: story.id, title: story.title, description: story.description, kind: story.kind, context: copy(story.context),
    progressRecordId: story.progressRecordId, stepCount: story.steps.length,
  })) : [];
}

/** The optional context is an exact gate, never a date-range or work fallback. */
export function getChronicleStory(id, rawContext) {
  const story = typeof id === 'string' ? byId.get(id) : null;
  if (!story || rawContext !== undefined && !sameContext(story.context, normalizeContext(rawContext))) return null;
  return copy(story);
}

function discoveryList(raw, context) {
  try {
    if (!Array.isArray(raw) || Object.getPrototypeOf(raw) !== Array.prototype || raw.length > 2000
      || Reflect.ownKeys(raw).length !== raw.length + 1) return null;
    const ids = [];
    for (let index = 0; index < raw.length; index += 1) {
      const descriptor = Object.getOwnPropertyDescriptor(raw, String(index));
      if (!descriptor?.enumerable || !Object.hasOwn(descriptor, 'value') || typeof descriptor.value !== 'string'
        || descriptor.value.length > 160) return null;
      if (canAccessContent(descriptor.value, context).ok) ids.push(descriptor.value);
    }
    return unique(ids);
  } catch { return null; }
}

/** Reading visits facts only. Returned discoveries are copies, without rewards. */
export function readChronicleStoryStep(rawContext, id, index = 0, discovered = []) {
  const context = normalizeContext(rawContext), story = getChronicleStory(id, context);
  if (!context || !story) return fail('Ce parcours n’appartient pas à cette œuvre et à ce segment.');
  if (!Number.isSafeInteger(index) || index < 0 || index >= story.steps.length) return fail('Étape documentaire indisponible.');
  const previous = discoveryList(discovered, context);
  if (!previous) return fail('Liste de découvertes invalide ou trop longue.');
  const step = story.steps[index], discoveries = unique([...previous, story.progressRecordId, ...step.recordIds]);
  if (discoveries.length > 2000) return fail('Limite de découvertes atteinte.');
  return { ok: true, story: { id: story.id, title: story.title, context: copy(story.context), progressRecordId: story.progressRecordId }, step,
    index, total: story.steps.length, previousIndex: index > 0 ? index - 1 : null,
    nextIndex: index + 1 < story.steps.length ? index + 1 : null,
    discovered: discoveries, completed: index === story.steps.length - 1 };
}
