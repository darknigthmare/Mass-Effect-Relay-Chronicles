import { RESOLVE_ORIGIN_ASSIGNMENTS as DEFINITIONS, RESOLVE_ORIGIN_CONTACTS as CONTACTS, RESOLVE_ORIGIN_DIALOGUE as DIALOGUE } from './resolve-origins-data.js';

const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
const plain = value => !!value && typeof value === 'object' && !Array.isArray(value)
  && [Object.prototype, null].includes(Object.getPrototypeOf(value));
const exact = (value, keys) => plain(value) && Reflect.ownKeys(value).length === keys.length && keys.every(key => own(value, key));
const fail = reason => ({ ok: false, reason });
const has = (values, item) => Array.isArray(values) && values.includes(item);
const me1 = state => !!state && (!own(state, 'context') || state.context?.mediaId === 'ME1' && state.context?.periodId === 'me1')
  && (!own(state, 'mediaId') || state.mediaId === 'ME1') && (!own(state, 'periodId') || state.periodId === 'me1');
const historicalGate = state => me1(state) && state.flags?.spectre === true && has(state.completed, 'eden-prime')
  && has(state.completed, 'citadel') && ['therum', 'feros', 'noveria'].some(zone => has(state.completed, zone));
const open = state => historicalGate(state) && state.ending !== true && !has(state.completed, 'ilos');
const validMoney = value => Number.isSafeInteger(value) && value >= 0 && value <= 1_000_000_000;

export function createResolveOrigins() { return { version: 1, records: {} }; }

function safeTree(value, depth = 0, seen = new WeakSet()) {
  if (value === null || typeof value === 'boolean') return true;
  if (typeof value === 'number') return Number.isSafeInteger(value) && value >= 0 && value <= 1;
  if (typeof value === 'string') return value.length <= 80;
  if (depth > 4 || !plain(value) || seen.has(value) || Reflect.ownKeys(value).length > 5) return false;
  seen.add(value);
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key !== 'string' || ['__proto__', 'prototype', 'constructor'].includes(key)) return false;
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor.enumerable || !own(descriptor, 'value') || !safeTree(descriptor.value, depth + 1, seen)) return false;
  }
  seen.delete(value); return true;
}

function validRecord(id, record, state) {
  const definition = DEFINITIONS[id];
  if (!definition || !historicalGate(state) || definition.origin !== state.origin
    || !exact(record, id === 'old-unhappy-far-off-things' ? ['stage', 'outcome', 'initialAid'] : ['stage', 'outcome'])
    || !own(definition.objectives, record.stage)) return false;
  if (id === 'old-unhappy-far-off-things' && !['cash', 'refused'].includes(record.initialAid)) return false;
  const resolved = record.stage === 'completed' || id === 'i-remember-me' && record.stage === 'report';
  return resolved ? typeof record.outcome === 'string' && own(definition.outcomes, record.outcome) : record.outcome === null;
}

/** Only missing legacy progress initializes. Explicit malformed data fails. */
export function normalizeResolveOrigins(raw, state) {
  try {
    if (raw === undefined) return createResolveOrigins();
    if (!me1(state) || !safeTree(raw) || !exact(raw, ['version', 'records']) || raw.version !== 1 || !plain(raw.records)) return null;
    const result = createResolveOrigins();
    for (const id of Reflect.ownKeys(raw.records)) {
      if (typeof id !== 'string' || !own(DEFINITIONS, id) || !validRecord(id, raw.records[id], state)) return null;
      result.records[id] = { ...raw.records[id] };
    }
    return result;
  } catch { return null; }
}

function visible(state, contact, progress) {
  if (!open(state) || state.zone !== contact.zone || DEFINITIONS[contact.assignmentId].origin !== state.origin) return false;
  const record = progress.records[contact.assignmentId], stage = record?.stage;
  if (contact.id === 'origin-hannah-call') return stage === 'call-home';
  if (contact.id === 'origin-turian-guard') return !!record;
  if (contact.id === 'origin-finch') return stage !== 'completed';
  if (contact.id === 'origin-talitha') return !!record && !['report', 'completed'].includes(stage);
  return true;
}

/** Detached physical contacts. Bodies reuse existing Prototype atlas drawings. */
export function getResolveOriginContacts(state) {
  const progress = normalizeResolveOrigins(state?.resolveOrigins, state);
  if (!progress) return [];
  return Object.values(CONTACTS).filter(contact => visible(state, contact, progress)).map(contact => {
    const copy = { ...contact, ...(contact.actorPosition ? { actorPosition: { ...contact.actorPosition } } : {}) };
    const stage = progress.records[contact.assignmentId]?.stage;
    if (contact.id === 'origin-finch' && ['confrontation', 'payment'].includes(stage))
      Object.assign(copy, { x: .8, z: 2.8, actorPosition: { x: 1.1, z: 1.2 } });
    return copy;
  });
}

function dialogueFor(contactId, progress) {
  const assignmentId = CONTACTS[contactId].assignmentId, record = progress.records[assignmentId], stage = record?.stage;
  if (stage === 'completed') return { text: DEFINITIONS[assignmentId].outcomes[record.outcome], choices: [] };
  if (contactId === 'origin-finch') return !record ? DIALOGUE.finchOffer : stage === 'guard' ? DIALOGUE.finchWaiting : DIALOGUE[stage];
  if (contactId === 'origin-turian-guard') return stage === 'guard' ? DIALOGUE.guard : { text: 'Finch vous a rejoint. Curt Weisman reste détenu pour sa tentative d’empoisonnement des fournitures médicales.', choices: [] };
  if (contactId === 'origin-hannah-call') return DIALOGUE.hannah;
  if (contactId === 'origin-zabaleta') return !record ? DIALOGUE.zabaletaOffer : stage === 'call-home' ? DIALOGUE.zabaletaWaiting : DIALOGUE.zabaletaReturn;
  if (contactId === 'origin-girard') return !record ? DIALOGUE.girardOffer : stage === 'report' ? DIALOGUE.girardReport : DIALOGUE.girardWaiting;
  return DIALOGUE[{ talk: 'talithaTalk', heard: 'talithaHeard', near: 'talithaNear', agitated: 'talithaAgitated', trusted: 'talithaTrusted' }[stage]];
}

export function getResolveOriginConversation(state, contactId) {
  const progress = normalizeResolveOrigins(state?.resolveOrigins, state);
  if (!progress || typeof contactId !== 'string' || !own(CONTACTS, contactId) || !visible(state, CONTACTS[contactId], progress)) return null;
  const contact = CONTACTS[contactId], dialogue = dialogueFor(contactId, progress);
  if (!dialogue) return null;
  return {
    id: contactId, assignmentId: contact.assignmentId, catalogId: DEFINITIONS[contact.assignmentId].catalogId,
    speaker: dialogue.speaker || contact.speaker, text: dialogue.text,
    choices: [...dialogue.choices.map(({ id, label, cost }) => ({ id, label,
      ...(cost ? { cost, disabled: !validMoney(state.credits) || state.credits < cost,
        reason: !validMoney(state.credits) || state.credits < cost ? `${cost} crédits nécessaires.` : null } : {}) })),
    { id: 'leave', label: 'Reprendre la mission.' }],
  };
}

/** Revalidate the current stage and location, then commit costs and progress together. */
export function chooseResolveOriginReply(state, contactId, choiceId) {
  const model = getResolveOriginConversation(state, contactId);
  if (!model) return fail('Cette conversation d’origine n’est pas disponible.');
  if (choiceId === 'leave') return { ok: true, response: 'La conversation est interrompue.' };
  const progress = normalizeResolveOrigins(state.resolveOrigins, state), dialogue = dialogueFor(contactId, progress);
  const selected = typeof choiceId === 'string' && dialogue.choices.find(choice => choice.id === choiceId);
  if (!selected) return fail('Cette réponse n’est plus disponible à cette étape.');
  const cost = selected.cost || 0;
  if (!validMoney(state.credits) || state.credits < cost) return fail(`${cost} crédits nécessaires. La progression est conservée.`);
  const previous = progress.records[model.assignmentId];
  const record = { stage: selected.stage, outcome: selected.outcome ?? previous?.outcome ?? null };
  if (model.assignmentId === 'old-unhappy-far-off-things') record.initialAid = selected.initialAid ?? previous?.initialAid;
  if (!validRecord(model.assignmentId, record, state)) return fail('La progression de cette assignation est invalide.');
  progress.records[model.assignmentId] = record;
  state.resolveOrigins = progress; state.credits -= cost;
  return { ok: true, response: selected.response, completed: record.stage === 'completed', ...(cost ? { cost } : {}) };
}

/** Journal entries expose only the assignment actually started by this Shepard. */
export function listResolveOrigins(state) {
  const progress = normalizeResolveOrigins(state?.resolveOrigins, state);
  if (!progress) return [];
  return Object.entries(progress.records).map(([id, record]) => {
    const definition = DEFINITIONS[id], completed = record.stage === 'completed';
    return { id, catalogId: definition.catalogId, title: definition.title, name: definition.title,
      status: completed ? 'completed' : open(state) ? 'active' : 'unavailable',
      objective: completed ? definition.objectives.completed : open(state) ? definition.objectives[record.stage] : 'Le départ vers Ilos a fermé cette assignation.',
      summary: completed ? definition.outcomes[record.outcome] : definition.objectives[record.stage],
      ...(completed ? { outcome: definition.outcomes[record.outcome] } : {}) };
  });
}

/** Optional continuity report: no report is manufactured for an untouched save. */
export function getResolveOriginsSummary(state) {
  const progress = normalizeResolveOrigins(state?.resolveOrigins, state);
  if (!progress || !Object.keys(progress.records).length) return null;
  return { version: 1, origin: state.origin, records: Object.fromEntries(Object.entries(progress.records).map(([id, record]) => [id, { ...record }])) };
}
