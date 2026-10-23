import { CODEX, CHAPTERS, CLASSES } from './game-data.js';
import { STORY_CONVERSATIONS, STORY_CODEX } from './story-data.js';

const OWN = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const ZONES = new Set(['normandy', ...Object.keys(CHAPTERS)]);
const BASE_CODEX = new Set(['relay', 'heat', 'normandy', 'atb']);
const ALL_CODEX = [...CODEX, ...STORY_CODEX];
const CODEX_IDS = new Set(ALL_CODEX.map(entry => entry.id));
const TOPICS = new Map(Object.entries(STORY_CONVERSATIONS).flatMap(([conversationId, conversation]) => conversation.topics.map(topic => [`${conversationId}:${topic.id}`, { conversationId, conversation, topic }])));
const BIOTIC_POWERS = new Set(['throw', 'lift', 'warp', 'singularity', 'barrier', 'stasis']);
const completed = (state, zone) => Array.isArray(state?.completed) && state.completed.includes(zone);
const recruited = (state, id) => Array.isArray(state?.recruited) && state.recruited.includes(id);
const hasHeard = (story, key) => story.heard.includes(key);
const topicCopy = topic => ({ id: topic.id, label: topic.label, text: topic.text, ...(topic.choices ? { choices: topic.choices.map(choice => ({ ...choice })) } : {}) });
const no = reason => ({ ok: false, reason });

export function createStoryState() {
  return { heard: [], choices: {}, codex: [], visitedZones: ['normandy'] };
}

function legacyVisits(state) {
  const result = new Set(['normandy']);
  for (const zone of [state?.zone, ...(state?.completed || []), ...(state?.cleared || []).map(id => typeof id === 'string' ? id.split(':')[0] : null)]) {
    if (ZONES.has(zone)) result.add(zone);
  }
  return [...result];
}

function zoneAvailable(state, zone) {
  if (zone === 'normandy') return true;
  if (zone === 'eden-prime') return state?.flags?.briefed === true || completed(state, 'eden-prime');
  if (zone === 'citadel') return completed(state, 'eden-prime');
  if (['therum', 'feros', 'noveria'].includes(zone)) return completed(state, 'citadel');
  if (zone === 'virmire') return ['therum', 'feros', 'noveria'].filter(id => completed(state, id)).length >= 2;
  if (zone === 'ilos') return ['therum', 'feros', 'noveria', 'virmire'].every(id => completed(state, id));
  return zone === 'citadel-finale' && completed(state, 'ilos');
}

function gatePossible(state, story, gate, historical = false) {
  if (!gate) return true;
  if (gate === 'before-eden') return historical || (!story.visitedZones.includes('eden-prime')
    && !legacyVisits(state).includes('eden-prime') && state?.flags?.jenkinsLost !== true);
  if (gate === 'garrus-advice') return OWN(story.choices, 'garrus:procedure');
  const stages = { 'after-eden': 'eden-prime', 'after-therum': 'therum', 'after-feros': 'feros', 'after-ilos': 'ilos' };
  return OWN(stages, gate) && completed(state, stages[gate]);
}

function topicPossible(state, story, conversation, topic, historical = false) {
  if (conversation.companion && !recruited(state, conversation.companion)) return false;
  return gatePossible(state, story, conversation.gate, historical) && gatePossible(state, story, topic.gate, historical);
}

function automaticCodex(state) {
  const ids = new Set(BASE_CODEX);
  const powers = OWN(CLASSES, state?.classId) ? CLASSES[state.classId].powers : [];
  if (powers.some(power => BIOTIC_POWERS.has(power))) ids.add('biotic');
  if (powers.includes('stasis')) ids.add('stasis');
  if (state?.flags?.spectre === true) ids.add('spectre');
  if (completed(state, 'eden-prime') || (state?.cleared || []).some(id => id.startsWith('eden-prime:'))) ids.add('geth');
  if (recruited(state, 'tali')) ids.add('quarian');
  if (recruited(state, 'garrus')) ids.add('turian');
  if (recruited(state, 'wrex')) ids.add('krogan');
  // The existing Asari entry explicitly mentions Liara. Keep it hidden until
  // her actual rescue/recruitment, even when another Asari has been encountered.
  if (recruited(state, 'liara') && completed(state, 'therum')) {
    ids.add('asari'); ids.add('biotic'); ids.add('stasis');
  }
  if (completed(state, 'eden-prime')) ids.add('protheans');
  if (completed(state, 'feros')) ids.add('cipher');
  if (completed(state, 'virmire')) ids.add('sovereign');
  if (completed(state, 'ilos')) ids.add('vigil');
  return ids;
}

function discoverableCodex(state, story) {
  const ids = automaticCodex(state);
  for (const key of story.heard) for (const id of TOPICS.get(key)?.topic.codex || []) ids.add(id);
  return ids;
}

function safeTree(value, seen = new WeakSet(), depth = 0) {
  if (depth > 6) return false;
  if (typeof value === 'string') return value.length <= 128;
  if (value === null || typeof value !== 'object' || seen.has(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  if (Array.isArray(value) ? prototype !== Array.prototype : ![Object.prototype, null].includes(prototype)) return false;
  if (Reflect.ownKeys(value).some(key => typeof key !== 'string')) return false;
  seen.add(value);
  const descriptors = Object.getOwnPropertyDescriptors(value);
  if (Object.keys(descriptors).length > 128) return false;
  if (Array.isArray(value) && (value.length > 64 || Object.keys(value).length !== value.length
    || !Object.keys(value).every((key, index) => key === String(index)))) return false;
  for (const [key, descriptor] of Object.entries(descriptors)) {
    if (['__proto__', 'prototype', 'constructor'].includes(key) || !OWN(descriptor, 'value')) return false;
    if (Array.isArray(value) && key === 'length') continue;
    if (!safeTree(descriptor.value, seen, depth + 1)) return false;
  }
  seen.delete(value);
  return true;
}

function uniqueStrings(value, allowed) {
  return Array.isArray(value) && new Set(value).size === value.length && value.every(id => typeof id === 'string' && allowed(id));
}

/** Absent legacy story data is inferred; explicitly invalid data is rejected. */
export function migrateStoryState(raw, state) {
  try {
    if (raw === undefined) return { ...createStoryState(), visitedZones: legacyVisits(state) };
    if (!safeTree(raw) || Array.isArray(raw) || Object.keys(raw).length !== 4
      || !['heard', 'choices', 'codex', 'visitedZones'].every(key => OWN(raw, key))) return null;
    if (!uniqueStrings(raw.heard, key => TOPICS.has(key))
      || !uniqueStrings(raw.codex, id => CODEX_IDS.has(id))
      || !uniqueStrings(raw.visitedZones, zone => ZONES.has(zone) && zoneAvailable(state, zone))
      || !raw.visitedZones.includes('normandy') || !raw.choices || Array.isArray(raw.choices)) return null;
    const story = { heard: [...raw.heard], choices: { ...raw.choices }, codex: [...raw.codex], visitedZones: [...raw.visitedZones] };
    for (const [key, replyId] of Object.entries(story.choices)) {
      const entry = TOPICS.get(key);
      if (!entry || !story.heard.includes(key) || !entry.topic.choices?.some(choice => choice.id === replyId)) return null;
    }
    for (const key of story.heard) {
      const { conversation, topic } = TOPICS.get(key);
      if (!topicPossible(state, story, conversation, topic, true)) return null;
    }
    const possible = discoverableCodex(state, story);
    if (story.codex.some(id => !possible.has(id))) return null;
    return story;
  } catch { return null; }
}

export function recordVisit(state, zone) {
  if (!state || !ZONES.has(zone) || state.zone !== zone || !zoneAvailable(state, zone)) return false;
  const story = migrateStoryState(state.story, state);
  if (!story) return false;
  if (!story.visitedZones.includes(zone)) story.visitedZones.push(zone);
  state.story = story;
  return true;
}

export function getConversation(state, id) {
  if (!state || state.zone !== 'normandy' || typeof id !== 'string' || !OWN(STORY_CONVERSATIONS, id)) return null;
  const story = migrateStoryState(state.story, state);
  if (!story) return null;
  const conversation = STORY_CONVERSATIONS[id];
  if (conversation.companion && (state.lost || []).includes(conversation.companion)) return null;
  let topics = conversation.topics.filter(topic => topicPossible(state, story, conversation, topic)
    && !(topic.once && hasHeard(story, `${id}:${topic.id}`)));
  if (id === 'joker' && topics.some(topic => topic.id === 'eden-prime-report')) topics = topics.filter(topic => topic.id === 'eden-prime-report');
  if (!topics.length) return null;
  return { id, speaker: conversation.speaker, portrait: conversation.portrait, topics: topics.map(topic => {
    const result = topicCopy(topic);
    if (id === 'garrus' && topic.id === 'followup') result.text = story.choices['garrus:procedure'] === 'procedure'
      ? 'Vous m’avez conseillé de respecter les procédures pour protéger les innocents. C’est le conseil que je garde en tête.'
      : 'Vous m’avez conseillé de privilégier les résultats lorsque les procédures bloquent une enquête. C’est la position que vous m’avez donnée.';
    return result;
  }) };
}

export function readTopic(state, conversationId, topicId) {
  const conversation = getConversation(state, conversationId);
  const topic = conversation?.topics.find(entry => entry.id === topicId);
  if (!topic) return no('Ce sujet n’est pas disponible.');
  const story = migrateStoryState(state.story, state);
  const key = `${conversationId}:${topicId}`;
  if (!story.heard.includes(key)) story.heard.push(key);
  for (const id of TOPICS.get(key).topic.codex || []) if (!story.codex.includes(id)) story.codex.push(id);
  state.story = story;
  return { ok: true, topic };
}

export function chooseReply(state, conversationId, topicId, replyId) {
  const conversation = getConversation(state, conversationId);
  const topic = conversation?.topics.find(entry => entry.id === topicId);
  const reply = topic?.choices?.find(entry => entry.id === replyId);
  const key = `${conversationId}:${topicId}`;
  if (!reply) return no('Cette réponse n’est pas disponible.');
  const story = migrateStoryState(state.story, state);
  if (!story.heard.includes(key)) return no('Consultez ce sujet avant de répondre.');
  if (OWN(story.choices, key) && story.choices[key] !== replyId) return no('Le conseil donné a déjà été enregistré.');
  story.choices[key] = replyId;
  state.story = story;
  return { ok: true, response: reply.response };
}

const searchable = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr-FR');
export function getCodexEntries(state, query = '') {
  if (!state) return [];
  const story = migrateStoryState(state.story, state);
  if (!story) return [];
  const visible = discoverableCodex(state, story);
  const needle = searchable(typeof query === 'string' ? query.trim() : '');
  return ALL_CODEX.filter(entry => visible.has(entry.id) && searchable(`${entry.name} ${entry.category} ${entry.text}`).includes(needle))
    .map(entry => ({ ...entry }));
}
