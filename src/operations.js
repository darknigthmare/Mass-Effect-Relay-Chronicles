import { OPERATIONS, OPERATION_ENCOUNTERS } from './operation-data.js';
import { ENEMIES } from './game-data.js';

export { OPERATIONS, OPERATION_ENCOUNTERS } from './operation-data.js';
const OWN = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const DEFINITIONS = new Map(OPERATIONS.map(operation => [operation.id, operation]));
const MONEY_LIMIT = 1_000_000_000;
const fail = reason => ({ ok: false, reason });
const plain = value => value !== null && typeof value === 'object' && !Array.isArray(value)
  && [Object.prototype, null].includes(Object.getPrototypeOf(value));
const exactKeys = (value, keys) => plain(value) && Reflect.ownKeys(value).length === keys.length && keys.every(key => OWN(value, key));
const validNumber = value => Number.isSafeInteger(value) && value >= 0 && value <= MONEY_LIMIT;
const has = (value, item) => Array.isArray(value) && value.includes(item);
const emptyRecord = () => ({ stage: 0, choices: {}, victories: [], pendingBattle: null });

export function createOperationState() { return { version: 1, records: {} }; }

function safeTree(value, seen = new WeakSet(), depth = 0) {
  if (depth > 7) return false;
  if (value === null || typeof value === 'boolean') return true;
  if (typeof value === 'number') return Number.isSafeInteger(value) && value >= 0 && value <= MONEY_LIMIT;
  if (typeof value === 'string') return value.length <= 100;
  if (!value || typeof value !== 'object' || (!plain(value) && !Array.isArray(value)) || seen.has(value)) return false;
  const keys = Reflect.ownKeys(value);
  if (keys.length > 50) return false;
  if (Array.isArray(value) && (value.length > 10 || Object.keys(value).length !== value.length
    || !Object.keys(value).every((key, index) => key === String(index)))) return false;
  seen.add(value);
  for (const key of keys) {
    if (typeof key !== 'string' || ['__proto__', 'constructor', 'prototype'].includes(key)) return false;
    if (Array.isArray(value) && key === 'length') continue;
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!OWN(descriptor, 'value') || !safeTree(descriptor.value, seen, depth + 1)) return false;
  }
  seen.delete(value); return true;
}

function historicalGate(state, operation, record) {
  if (!state) return true;
  if (!has(state.completed, 'eden-prime')) return false;
  if (operation.zone === 'feros' && (!has(state.completed, 'citadel') || state.flags?.spectre !== true || !has(state.cleared, 'feros:encounter-1'))) return false;
  if ((operation.requires === 'tali' || operation.id === 'citadel-reporters-request' && record.stage >= 2) && !has(state.recruited, 'tali')) return false;
  return true;
}

/** Absent legacy data migrates; explicit malformed or inconsistent progress fails. */
export function normalizeOperations(raw, state = null) {
  try {
    if (raw === undefined) return createOperationState();
    if (!safeTree(raw) || !exactKeys(raw, ['version', 'records']) || raw.version !== 1 || !plain(raw.records)) return null;
    const records = {};
    for (const [id, record] of Object.entries(raw.records)) {
      const operation = DEFINITIONS.get(id);
      if (!operation || !exactKeys(record, ['stage', 'choices', 'victories', 'pendingBattle'])
        || !Number.isInteger(record.stage) || record.stage < 1 || record.stage > operation.steps.length
        || !plain(record.choices) || !Array.isArray(record.victories) || new Set(record.victories).size !== record.victories.length
        || !historicalGate(state, operation, record)) return null;
      const expectedChoices = [], expectedVictories = [];
      for (let index = 0; index < record.stage; index++) {
        const step = operation.steps[index], selected = step.choices.find(choice => choice.id === record.choices[step.id]);
        if (!selected) return null;
        expectedChoices.push(step.id);
        if (selected.combat) expectedVictories.push(step.id);
      }
      if (record.pendingBattle !== null) {
        const current = operation.steps[record.stage];
        if (!current || current.id !== record.pendingBattle || !current.choices.some(choice => choice.id === record.choices[current.id] && choice.combat)) return null;
        expectedChoices.push(current.id);
      }
      if (Object.keys(record.choices).length !== expectedChoices.length || !expectedChoices.every(key => OWN(record.choices, key))
        || record.victories.length !== expectedVictories.length || !record.victories.every((id, index) => id === expectedVictories[index])) return null;
      records[id] = { stage: record.stage, choices: { ...record.choices }, victories: [...record.victories], pendingBattle: record.pendingBattle };
    }
    for (const [id] of Object.entries(records)) {
      const prerequisite = DEFINITIONS.get(id).prerequisite;
      if (prerequisite && (records[prerequisite.operationId]?.stage || 0) < prerequisite.stage) return null;
    }
    return { version: 1, records };
  } catch { return null; }
}

function gate(state, operation, record, operations) {
  if (record.stage === operation.steps.length) return { status: 'completed', reason: null };
  if (state?.ending || has(state?.completed, 'ilos')) return { status: 'unavailable', reason: 'Le passage du Conduit a fermé cette opération.' };
  if (operation.deadline === 'thorian' && has(state?.cleared, 'feros:boss')) return { status: 'unavailable', reason: 'Fai Dan n’est plus disponible après la confrontation avec le Thorien.' };
  if (operation.deadline === 'data-before-thorian' && record.stage < 3 && has(state?.cleared, 'feros:boss')) return { status: 'unavailable', reason: 'Les données de Gavin devaient être copiées avant la confrontation avec le Thorien.' };
  if (['feros-water', 'feros-power'].includes(operation.id) && state?.choices?.feros === 'force') return { status: 'unavailable', reason: 'Le sort de la colonie ne permet plus de remettre cette opération à son contact.' };
  if (!has(state?.completed, 'eden-prime')) return { status: 'locked', reason: 'Terminez la mission d’Eden Prime.' };
  if (operation.zone === 'feros' && (!has(state?.completed, 'citadel') || state?.flags?.spectre !== true)) return { status: 'locked', reason: 'Obtenez le statut de Spectre pour rejoindre Féros.' };
  if (operation.zone === 'feros' && !has(state?.cleared, 'feros:encounter-1')) return { status: 'locked', reason: 'Sécurisez le premier barrage geth de Féros.' };
  const prerequisite = operation.prerequisite;
  if (prerequisite && (operations.records[prerequisite.operationId]?.stage || 0) < prerequisite.stage) return { status: 'locked', reason: 'Obtenez les aveux de Septimus pendant La Favorite.' };
  if ((operation.requires === 'tali' || operation.steps[record.stage]?.requires === 'tali') && !has(state?.recruited, 'tali')) return { status: record.stage ? 'active' : 'locked', reason: 'Retrouvez Tali et récupérez ses preuves à la Citadelle.' };
  return { status: record.stage ? 'active' : 'available', reason: null };
}

function recordOutcome(operation, record) {
  const outcomes = operation.steps.slice(0, record.stage).map(step => step.choices.find(choice => choice.id === record.choices[step.id])?.outcome).filter(Boolean);
  return outcomes.join(' ');
}

function totalReward(operation, record) {
  const result = { ...operation.reward };
  for (const step of operation.steps) {
    const chosen = step.choices.find(choice => choice.id === record.choices[step.id]);
    for (const [key, value] of Object.entries(chosen?.reward || {})) result[key] = (result[key] || 0) + value;
  }
  return result;
}

export function listOperations(state) {
  const operations = normalizeOperations(state?.operations, state);
  if (!operations) return [];
  return OPERATIONS.map(operation => {
    const record = operations.records[operation.id] || emptyRecord(), availability = gate(state, operation, record, operations), step = operation.steps[record.stage];
    return {
      id: operation.id, name: operation.name, zone: operation.zone, description: operation.description,
      status: availability.status, blockedReason: availability.reason, stage: record.stage, totalSteps: operation.steps.length,
      currentStep: step ? { id: step.id, label: step.speaker, zone: step.zone, x: step.x, z: step.z, text: step.text } : null,
      pendingBattle: record.pendingBattle, reward: totalReward(operation, record), outcome: recordOutcome(operation, record),
      choices: operation.steps.filter(step => OWN(record.choices, step.id)).map(step => ({ stepId: step.id, speaker: step.speaker, label: step.choices.find(choice => choice.id === record.choices[step.id]).label })),
      sourceUrls: [...operation.sourceUrls], adaptationNote: operation.adaptationNote,
    };
  });
}

/** Only the current, actionable objective is exposed in a zone. */
export function operationPOIs(state, zone = state?.zone) {
  return listOperations(state).filter(operation => ['available', 'active'].includes(operation.status) && !operation.blockedReason && operation.currentStep?.zone === zone)
    .map(operation => ({ id: `operation:${operation.id}:${operation.currentStep.id}`, type: 'operation', operationId: operation.id, stepId: operation.currentStep.id,
      zone, label: operation.currentStep.label, x: operation.currentStep.x, z: operation.currentStep.z, operationName: operation.name }));
}

function context(state, id, stepId) {
  const operation = typeof id === 'string' ? DEFINITIONS.get(id) : null, operations = normalizeOperations(state?.operations, state);
  if (!operation || !operations) return fail('Opération inconnue ou progression invalide.');
  const record = operations.records[id] || emptyRecord(), availability = gate(state, operation, record, operations), step = operation.steps[record.stage];
  if (availability.reason) return fail(availability.reason);
  if (!step || step.id !== stepId) return fail('Cette étape n’est pas disponible.');
  if (state.zone !== step.zone) return fail(`Rejoignez ${step.zone === 'citadel' ? 'la Citadelle' : 'Féros'} pour poursuivre cette opération.`);
  return { ok: true, operation, operations, record, step };
}

function choiceBlock(state, choice) {
  if (choice.cost && (!validNumber(state.credits) || state.credits < choice.cost)) return 'Crédits insuffisants.';
  if (choice.requires?.paragon && (!validNumber(state.paragon) || state.paragon < choice.requires.paragon)) return `${choice.requires.paragon} points de Conciliation requis.`;
  if (choice.requires?.renegade && (!validNumber(state.renegade) || state.renegade < choice.requires.renegade)) return `${choice.requires.renegade} points de Pragmatisme requis.`;
  return null;
}

export function getOperationInteraction(state, id, stepId) {
  const ctx = context(state, id, stepId);
  if (!ctx.ok) return ctx;
  const { operation, record, step } = ctx;
  const choices = record.pendingBattle ? [{ id: 'resume', label: 'Reprendre le combat.', combat: true, disabled: false, reason: null, consequence: 'Le combat n’a pas encore été remporté.' }]
    : step.choices.map(choice => ({ id: choice.id, label: choice.label, consequence: choice.consequence || null, combat: !!choice.combat, disabled: !!choiceBlock(state, choice), reason: choiceBlock(state, choice) }));
  return { ok: true, id, stepId, name: operation.name, speaker: step.speaker, text: step.text,
    choices: [...choices, { id: 'cancel', label: 'Revenir plus tard.', disabled: false, combat: false, reason: null }], pendingBattle: !!record.pendingBattle };
}

/** Returns a ready-to-use createBattle enemies array only after a combat choice is armed. */
export function getOperationEncounter(state, id, stepId) {
  const ctx = context(state, id, stepId);
  if (!ctx.ok || ctx.record.pendingBattle !== stepId) return null;
  const choice = ctx.step.choices.find(choice => choice.id === ctx.record.choices[stepId]), encounter = OPERATION_ENCOUNTERS[choice?.combat];
  if (!encounter) return null;
  return { id: `operation:${id}:${stepId}`, operationId: id, stepId, name: encounter.name,
    enemies: encounter.enemies.map((key, index) => {
      const enemy = ENEMIES[key];
      return { ...enemy, id: `${choice.combat}-${index}`, hp: enemy.hp, maxHp: enemy.hp, maxShield: enemy.shield, powers: [...enemy.powers] };
    }) };
}

function completeStep(state, ctx, selected, victory = false) {
  const { operation, operations, step } = ctx;
  const record = { ...ctx.record, choices: { ...ctx.record.choices, [step.id]: selected.id }, victories: [...ctx.record.victories], pendingBattle: null, stage: ctx.record.stage + 1 };
  if (victory) record.victories.push(step.id);
  const completed = record.stage === operation.steps.length, rewards = completed ? totalReward(operation, record) : {};
  const changes = {};
  for (const key of ['xp', 'credits', 'paragon', 'renegade', 'medigel']) {
    if (!validNumber(state[key]) || key === 'medigel' && state[key] > 9) return fail('Les réserves ou récompenses de cette opération sont invalides.');
    const value = state[key] + (rewards[key] || 0) - (key === 'credits' ? selected.cost || 0 : 0);
    if (!validNumber(value)) return fail('Les réserves ou récompenses dépassent la limite autorisée.');
    changes[key] = key === 'medigel' ? Math.min(9, value) : value;
  }
  operations.records[operation.id] = record;
  state.operations = operations;
  Object.assign(state, changes);
  return { ok: true, completed, rewards: completed ? rewards : null, message: completed ? `${operation.name} — opération accomplie.` : 'Objectif mis à jour.', outcome: recordOutcome(operation, record) };
}

export function advanceOperation(state, id, stepId, choiceId) {
  const ctx = context(state, id, stepId);
  if (!ctx.ok) return ctx;
  if (choiceId === 'cancel') return { ok: true, cancelled: true };
  if (ctx.record.pendingBattle) {
    if (choiceId !== 'resume') return fail('Terminez ou reprenez le combat déjà engagé.');
    return { ok: true, battle: getOperationEncounter(state, id, stepId) };
  }
  const selected = typeof choiceId === 'string' && ctx.step.choices.find(choice => choice.id === choiceId);
  if (!selected) return fail('Cette réponse n’est pas disponible.');
  const blocked = choiceBlock(state, selected);
  if (blocked) return fail(blocked);
  if (selected.combat) {
    ctx.operations.records[id] = { ...ctx.record, choices: { ...ctx.record.choices, [stepId]: choiceId }, victories: [...ctx.record.victories], pendingBattle: stepId };
    state.operations = ctx.operations;
    return { ok: true, battle: getOperationEncounter(state, id, stepId) };
  }
  return completeStep(state, ctx, selected);
}

/** The caller must pass true only for an actual party victory in the armed encounter. */
export function finishOperationBattle(state, id, stepId, won) {
  if (typeof won !== 'boolean') return fail('Résultat de combat invalide.');
  const ctx = context(state, id, stepId);
  if (!ctx.ok || ctx.record.pendingBattle !== stepId) return ctx.ok ? fail('Aucun combat de cette opération n’est engagé.') : ctx;
  if (!won) return { ok: true, won: false, retryable: true };
  const selected = ctx.step.choices.find(choice => choice.id === ctx.record.choices[stepId] && choice.combat);
  if (!selected) return fail('Combat inconnu.');
  return { ...completeStep(state, ctx, selected, true), won: true };
}

export function operationEffects(state) {
  const operations = normalizeOperations(state?.operations, state);
  const done = id => !!operations && operations.records[id]?.stage === DEFINITIONS.get(id).steps.length;
  return { medicalDiscount: done('citadel-doctor-michel') ? .2 : 0,
    colonySupport: ['feros-water', 'feros-power', 'feros-geth-tunnels'].filter(done).length,
    researchRecovered: done('feros-data-recovery') };
}
