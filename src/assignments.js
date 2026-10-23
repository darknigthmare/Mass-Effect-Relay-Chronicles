import { ASSIGNMENTS, ASSIGNMENT_CONTACTS, ASSIGNMENT_DIALOGUE, ASSIGNMENT_REWARD_XP } from './assignment-data.js';

const OWN = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const WORLDS = ['therum', 'feros', 'noveria'];
const failure = reason => ({ ok: false, reason });
const progress = state => WORLDS.filter(zone => Array.isArray(state?.completed) && state.completed.includes(zone)).length;
const spectre = state => state?.flags?.spectre === true && Array.isArray(state.completed) && state.completed.includes('citadel');

export function createAssignmentState() { return { records: {} }; }

function safeTree(value, seen = new WeakSet(), depth = 0) {
  if (value === null || typeof value === 'boolean') return true;
  if (typeof value === 'number') return Number.isSafeInteger(value) && value >= 0 && value <= WORLDS.length;
  if (typeof value === 'string') return value.length <= 80;
  if (depth > 4 || !value || typeof value !== 'object' || Array.isArray(value) || seen.has(value)
    || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) return false;
  seen.add(value);
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key !== 'string' || ['__proto__', 'prototype', 'constructor'].includes(key)) return false;
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!OWN(descriptor, 'value') || !safeTree(descriptor.value, seen, depth + 1)) return false;
  }
  seen.delete(value);
  return true;
}

function validRecord(id, record, state) {
  const fields = id === 'fan' ? ['stage', 'outcome', 'rewarded', 'autographAt', 'photoAt'] : ['stage', 'outcome', 'rewarded'];
  if (!record || typeof record !== 'object' || Reflect.ownKeys(record).length !== fields.length
    || !fields.every(key => OWN(record, key)) || typeof record.rewarded !== 'boolean') return false;
  const complete = record.stage === 'completed';
  if (record.rewarded !== complete || !spectre(state)) return false;
  if (id === 'homecoming') {
    if (record.stage === 'requested') return record.outcome === null;
    if (record.stage === 'body-authorized') return record.outcome === 'return-body';
    if (record.stage === 'research-supported') return record.outcome === 'research';
    return complete && ['return-body', 'research'].includes(record.outcome);
  }
  if (id === 'family') return progress(state) >= 1 && (record.stage === 'discussion' && record.outcome === null
    || complete && ['support-therapy', 'respect-refusal'].includes(record.outcome));
  const worlds = progress(state);
  if (id !== 'fan' || !Number.isSafeInteger(record.autographAt) || record.autographAt < 0 || record.autographAt > worlds) return false;
  if (record.stage === 'signed') return record.outcome === null && record.photoAt === null;
  if (!Number.isSafeInteger(record.photoAt) || record.photoAt <= record.autographAt || record.photoAt > worlds) return false;
  return record.stage === 'photographed' && record.outcome === null
    || complete && worlds > record.photoAt && record.outcome === 'return-home';
}

/** Only absent version-1 data is initialized. Explicit invalid records fail. */
export function migrateAssignmentState(raw, state) {
  try {
    if (raw === undefined) return createAssignmentState();
    if (!safeTree(raw) || !raw || typeof raw !== 'object' || Reflect.ownKeys(raw).length !== 1 || !OWN(raw, 'records')
      || !raw.records || typeof raw.records !== 'object' || Array.isArray(raw.records)) return null;
    const records = {};
    for (const id of Reflect.ownKeys(raw.records)) {
      const record = raw.records[id];
      if (!OWN(ASSIGNMENTS, id) || !validRecord(id, record, state)) return null;
      records[id] = { stage: record.stage, outcome: record.outcome, rewarded: record.rewarded };
      if (id === 'fan') Object.assign(records[id], { autographAt: record.autographAt, photoAt: record.photoAt });
    }
    return { records };
  } catch { return null; }
}

function availableContact(state, id, assignments) {
  if (!state || state.zone !== 'citadel' || !spectre(state) || typeof id !== 'string' || !OWN(ASSIGNMENT_CONTACTS, id)) return false;
  if (id === 'bosker') return !!assignments.records.homecoming && assignments.records.homecoming.stage !== 'completed';
  if (id === 'petrovsky-family') return progress(state) >= 1;
  return id !== 'conrad-verner' || assignments.records.fan?.stage !== 'completed';
}

export function getAssignmentContacts(state) {
  const assignments = migrateAssignmentState(state?.assignments, state);
  if (!assignments) return [];
  return Object.values(ASSIGNMENT_CONTACTS).filter(contact => availableContact(state, contact.id, assignments)).map(contact => ({ ...contact }));
}

function dialogueFor(state, id, assignments) {
  const home = assignments.records.homecoming;
  if (id === 'samesh-bhatia') {
    if (!home) return ASSIGNMENT_DIALOGUE.sameshOffer;
    if (home.stage === 'requested') return ASSIGNMENT_DIALOGUE.sameshWaiting;
    if (home.stage === 'body-authorized') return ASSIGNMENT_DIALOGUE.sameshBody;
    if (home.stage === 'research-supported') return ASSIGNMENT_DIALOGUE.sameshResearch;
    return home.outcome === 'return-body' ? ASSIGNMENT_DIALOGUE.sameshBodyClosed : ASSIGNMENT_DIALOGUE.sameshResearchClosed;
  }
  if (id === 'bosker') return home.stage === 'requested' ? ASSIGNMENT_DIALOGUE.boskerDecision
    : home.stage === 'body-authorized' ? ASSIGNMENT_DIALOGUE.boskerAuthorized : ASSIGNMENT_DIALOGUE.boskerResearch;
  if (id === 'petrovsky-family') {
    const family = assignments.records.family;
    return !family ? ASSIGNMENT_DIALOGUE.familyOffer : family.stage === 'discussion' ? ASSIGNMENT_DIALOGUE.familyDecision
      : family.outcome === 'support-therapy' ? ASSIGNMENT_DIALOGUE.familyTherapyClosed : ASSIGNMENT_DIALOGUE.familyRefusalClosed;
  }
  const fan = assignments.records.fan;
  if (!fan) return ASSIGNMENT_DIALOGUE.fanAutograph;
  if (fan.stage === 'signed') return progress(state) > fan.autographAt ? ASSIGNMENT_DIALOGUE.fanPhoto : ASSIGNMENT_DIALOGUE.fanWaiting;
  return progress(state) > fan.photoAt ? ASSIGNMENT_DIALOGUE.fanResolution : ASSIGNMENT_DIALOGUE.fanWaiting;
}

export function getAssignmentConversation(state, contactId) {
  const assignments = migrateAssignmentState(state?.assignments, state);
  if (!assignments || !availableContact(state, contactId, assignments)) return null;
  const contact = ASSIGNMENT_CONTACTS[contactId], dialogue = dialogueFor(state, contactId, assignments);
  return {
    id: contactId, speaker: contact.speaker, text: dialogue.text,
    choices: [...dialogue.choices.map(({ id, label }) => ({ id, label })), { id: 'leave', label: 'Reprendre la visite.' }],
  };
}

export function chooseAssignmentReply(state, contactId, choiceId) {
  const assignments = migrateAssignmentState(state?.assignments, state);
  if (!assignments || !availableContact(state, contactId, assignments)) return failure('Cette conversation n’est pas disponible.');
  if (choiceId === 'leave') return { ok: true, response: 'À bientôt, Shepard.' };
  const dialogue = dialogueFor(state, contactId, assignments);
  const choice = typeof choiceId === 'string' && dialogue.choices.find(entry => entry.id === choiceId);
  if (!choice) return failure('Cette réponse n’est pas disponible à ce stade de l’assignation.');
  const assignmentId = ASSIGNMENT_CONTACTS[contactId].assignmentId;
  const previous = assignments.records[assignmentId];
  const completed = choice.stage === 'completed';
  const record = { stage: choice.stage, outcome: choice.outcome ?? previous?.outcome ?? null, rewarded: completed };
  if (assignmentId === 'fan') Object.assign(record, {
    autographAt: previous?.autographAt ?? progress(state),
    photoAt: choice.stage === 'photographed' ? progress(state) : previous?.photoAt ?? null,
  });
  if (!validRecord(assignmentId, record, state)) return failure('La progression de cette assignation est invalide.');
  const reward = completed && !previous?.rewarded ? ASSIGNMENT_REWARD_XP : 0;
  if (!Number.isSafeInteger(state.xp) || state.xp < 0 || state.xp + reward > 1_000_000_000) return failure('L’expérience ne peut pas être mise à jour.');
  assignments.records[assignmentId] = record;
  state.assignments = assignments;
  state.xp += reward;
  return { ok: true, response: choice.response, ...(reward ? { reward: { xp: reward } } : {}) };
}

export function getAssignments(state) {
  const assignments = migrateAssignmentState(state?.assignments, state);
  if (!assignments) return [];
  return Object.entries(ASSIGNMENTS).filter(([id]) => OWN(assignments.records, id)).map(([id, definition]) => {
    const record = assignments.records[id], complete = record.stage === 'completed';
    let objective = definition.objectives[record.stage];
    if (id === 'fan' && !complete) {
      const milestone = record.stage === 'signed' ? record.autographAt : record.photoAt;
      objective = progress(state) > milestone ? 'Reparler à Conrad Verner à la Citadelle.'
        : progress(state) === WORLDS.length
          ? 'Thérum, Féros et Novéria sont terminées. Aucune nouvelle rencontre avec Conrad ne peut être débloquée dans cette chronique.'
          : 'Terminer une nouvelle mission à Thérum, Féros ou Novéria avant de reparler à Conrad.';
    }
    return {
      id, title: definition.title, status: complete ? 'completed' : 'active', objective,
      summary: complete ? definition.outcomes[record.outcome] : definition.summaries[record.stage],
      ...(record.outcome ? { outcome: definition.outcomes[record.outcome] } : {}),
    };
  });
}
