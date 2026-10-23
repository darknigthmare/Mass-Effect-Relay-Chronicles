import { CREW, CHAPTERS, CLASSES, ENCOUNTERS, EQUIPMENT } from './game-data.js';
import { COMMANDER_APPEARANCES, ORIGINS, PSYCHOLOGICAL_PROFILES } from './commander.js';
import { createStoryState, migrateStoryState } from './story.js';

export const SAVE_KEY = 'relay-chronicles.save.v1';
const SAVE_VERSION = 1;
const MODES = new Set(['wait', 'active']);
const DIFFICULTIES = new Set(['story', 'easy', 'normal', 'hard']);
const OWN = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const validOption = (options, key) => typeof key === 'string' && OWN(options, key);
const CHOICES = {
  feros: ['save', 'force'],
  noveria: ['release', 'destroy'],
  virmire: ['save-kaidan', 'save-ashley'],
  'citadel-finale': ['save-council', 'focus-sovereign'],
};
const DEFAULT_SETTINGS = { sound: true, volume: 0.35, reducedMotion: false, largeText: false };
const UPGRADE_STATS = { attack: 3, defense: 2, shield: 15 };
const FORBIDDEN_KEYS = new Set(['__proto__', 'prototype', 'constructor']);
const clone = value => JSON.parse(JSON.stringify(value));

export function newGame({ name = 'Shepard', classId = 'soldier', difficulty = 'normal', mode = 'wait', appearance = 'male', origin = 'spacer', psychologicalProfile = 'sole-survivor' } = {}) {
  return {
    version: SAVE_VERSION,
    name: typeof name === 'string' ? name.trim().slice(0, 24) || 'Shepard' : 'Shepard',
    appearance: validOption(COMMANDER_APPEARANCES, appearance) ? appearance : 'male',
    origin: validOption(ORIGINS, origin) ? origin : 'spacer',
    psychologicalProfile: validOption(PSYCHOLOGICAL_PROFILES, psychologicalProfile) ? psychologicalProfile : 'sole-survivor',
    classId: OWN(CLASSES, classId) ? classId : 'soldier',
    difficulty: DIFFICULTIES.has(difficulty) ? difficulty : 'normal',
    mode: MODES.has(mode) ? mode : 'wait',
    zone: 'normandy', party: ['shepard', 'kaidan', 'jenkins'], recruited: ['kaidan', 'jenkins'],
    lost: [], completed: [], cleared: [], collected: [], flags: {}, choices: {},
    story: createStoryState(),
    logs: [{ title: 'Départ', text: 'Le Normandy fait route vers Eden Prime.' }],
    xp: 0, credits: 250, medigel: 4, upgrades: {}, paragon: 0, renegade: 0,
    playedSeconds: 0, position: null, ending: false, settings: { ...DEFAULT_SETTINGS },
  };
}

export function unlockedZones(state) {
  const zones = ['normandy'];
  if (state.flags.briefed !== true) return zones;
  zones.push('eden-prime');
  if (!state.completed.includes('eden-prime')) return zones;
  zones.push('citadel');
  if (!state.completed.includes('citadel') || state.flags.spectre !== true) return zones;
  zones.push('therum', 'feros', 'noveria');
  if (['therum', 'feros', 'noveria'].filter(zone => state.completed.includes(zone)).length >= 2) zones.push('virmire');
  if (['therum', 'feros', 'noveria', 'virmire'].every(zone => state.completed.includes(zone))) zones.push('ilos');
  if (state.completed.includes('ilos') && zones.includes('ilos')) zones.push('citadel-finale');
  return zones;
}

export function zoneEncounters(zone) {
  return OWN(ENCOUNTERS, zone) ? [`${zone}:encounter-1`, `${zone}:encounter-2`, `${zone}:boss`] : [];
}

export function encounterIndex(id) {
  if (typeof id !== 'string') return -1;
  const zone = id.split(':')[0];
  return zoneEncounters(zone).indexOf(id);
}

export function objectiveReady(state, zone = state.zone) {
  if (!OWN(CHAPTERS, zone) || !unlockedZones(state).includes(zone) || state.completed.includes(zone)) return false;
  // Tali supplies the evidence against Saren. Garrus and Wrex can be recruited
  // independently; accepting their help is not a condition for the audience.
  if (zone === 'citadel') return state.recruited.includes('tali') && !state.lost.includes('tali');
  const encounters = zoneEncounters(zone);
  return encounters.length > 0 && encounters.every(id => state.cleared.includes(id));
}

export function canStartEncounter(state, id) {
  const index = encounterIndex(id);
  if (index < 0) return { ok: false, reason: 'Rencontre inconnue.' };
  const zone = id.split(':')[0];
  if (state.cleared.includes(id)) return { ok: false, reason: 'Ce secteur est sécurisé.' };
  if (!unlockedZones(state).includes(zone)) return { ok: false, reason: 'Destination indisponible.' };
  if (state.zone !== zone) return { ok: false, reason: 'Rejoignez cette destination avant le combat.' };
  if (state.completed.includes(zone)) return { ok: false, reason: 'Cette mission est déjà accomplie.' };
  if (index > 0 && !zoneEncounters(zone).slice(0, index).every(previous => state.cleared.includes(previous))) {
    return { ok: false, reason: 'Sécurisez d’abord le secteur précédent.' };
  }
  return { ok: true };
}

export function addLog(state, title, text) {
  state.logs.unshift({ title: String(title).slice(0, 200), text: String(text).slice(0, 4000) });
  state.logs = state.logs.slice(0, 100);
}

export function recruit(state, id) {
  if (!OWN(CREW, id) || id === 'shepard' || state.lost.includes(id) || state.recruited.includes(id)) return false;
  const allowed = id === 'ashley'
    ? state.zone === 'eden-prime' && state.cleared.includes('eden-prime:encounter-1')
    : id === 'liara'
      ? state.zone === 'therum' && state.completed.includes('therum')
      // Completing the audience does not prevent a later recruitment visit.
      : ['garrus', 'tali', 'wrex'].includes(id) && state.zone === 'citadel' && unlockedZones(state).includes('citadel');
  if (!allowed) return false;
  state.recruited.push(id);
  addLog(state, 'Nouvel équipier', `${CREW[id].name} rejoint votre commando.`);
  return true;
}

export function availableCrew(state) {
  return state.recruited.filter(id => OWN(CREW, id) && !state.lost.includes(id) && !['shepard', 'jenkins'].includes(id));
}

export function setSquad(state, ids) {
  if (state.zone !== 'normandy' || !Array.isArray(ids) || ids.length !== 2 || new Set(ids).size !== 2) return false;
  if (!ids.every(id => id !== 'shepard' && OWN(CREW, id) && state.recruited.includes(id) && !state.lost.includes(id))) return false;
  state.party = ['shepard', ...ids];
  return true;
}

export function winEncounter(state, id) {
  if (!canStartEncounter(state, id).ok) return false;
  state.cleared.push(id);
  state.xp += 65;
  state.credits += 85;
  if (id === 'eden-prime:encounter-1') {
    state.flags.jenkinsLost = true;
    if (!state.lost.includes('jenkins')) state.lost.push('jenkins');
    recruit(state, 'ashley');
    state.party = ['shepard', 'kaidan', 'ashley'];
    addLog(state, 'Eden Prime', 'Jenkins a été tué pendant la descente. Ashley Williams rejoint le commando après l’attaque de sa garnison.');
  }
  return true;
}

export function completeZone(state, zone, choice = null) {
  if (state.zone !== zone || !objectiveReady(state, zone)) return false;
  if (OWN(CHOICES, zone) ? !CHOICES[zone].includes(choice) : choice !== null && choice !== undefined) return false;
  state.completed.push(zone);
  state.xp += CHAPTERS[zone].reward;
  state.credits += 180;
  state.medigel = Math.min(9, state.medigel + 2);
  if (OWN(CHOICES, zone)) state.choices[zone] = choice;
  if (zone === 'citadel') state.flags.spectre = true;
  if (zone === 'therum') recruit(state, 'liara');
  if (zone === 'feros') state[choice === 'save' ? 'paragon' : 'renegade'] += 20;
  if (zone === 'noveria') state[choice === 'release' ? 'paragon' : 'renegade'] += 20;
  if (zone === 'virmire') {
    const lost = choice === 'save-kaidan' ? 'ashley' : 'kaidan';
    if (!state.lost.includes(lost)) state.lost.push(lost);
    state.party = state.party.filter(id => id !== lost);
    for (const id of availableCrew(state)) if (state.party.length < 3 && !state.party.includes(id)) state.party.push(id);
  }
  if (zone === 'citadel-finale') {
    state.ending = true;
    state[choice === 'save-council' ? 'paragon' : 'renegade'] += 20;
  }
  addLog(state, CHAPTERS[zone].name, `Objectif accompli${choice ? ` · décision : ${choice}` : ''}.`);
  return true;
}

export function buyUpgrade(state, actorId, itemId) {
  if (!['normandy', 'citadel'].includes(state.zone) || !unlockedZones(state).includes(state.zone)) return { ok: false, reason: 'Rejoignez une armurerie.' };
  if (!OWN(CREW, actorId) || state.lost.includes(actorId) || (actorId !== 'shepard' && !state.recruited.includes(actorId))) return { ok: false, reason: 'Équipier indisponible.' };
  const item = EQUIPMENT.find(candidate => candidate.id === itemId);
  if (!item) return { ok: false, reason: 'Équipement inconnu.' };
  if (state.credits < item.cost) return { ok: false, reason: 'Crédits insuffisants.' };
  if (item.stat === 'medigel') {
    if (state.medigel >= 9) return { ok: false, reason: 'Réserve complète.' };
    state.medigel += 1;
  } else {
    const existing = state.upgrades[actorId] || {};
    const count = existing[`${item.stat}Count`] || 0;
    if (count >= 5) return { ok: false, reason: 'Amélioration maximale atteinte.' };
    state.upgrades[actorId] = {
      ...existing,
      [item.stat]: (existing[item.stat] || 0) + item.value,
      [`${item.stat}Count`]: count + 1,
    };
  }
  state.credits -= item.cost;
  return { ok: true };
}

export function encodeSave(state) {
  return JSON.stringify({ format: 'relay-chronicles', version: SAVE_VERSION, savedAt: new Date().toISOString(), state: clone(state) });
}

const plain = value => value !== null && typeof value === 'object'
  && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);

// Validate before spreading or copying: imported JSON must never become a
// prototype-bearing dictionary. Also rejects cycles/accessors for object input.
function safeTree(value, seen = new WeakSet(), depth = 0) {
  if (depth > 12) return false;
  if (value === null || typeof value === 'boolean') return true;
  if (typeof value === 'string') return value.length <= 50000;
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value !== 'object' || (!Array.isArray(value) && !plain(value)) || seen.has(value)) return false;
  seen.add(value);
  if (Array.isArray(value) && (value.length > 500 || Object.keys(value).length !== value.length
    || !Object.keys(value).every((key, index) => key === String(index)))) return false;
  const descriptors = Object.getOwnPropertyDescriptors(value);
  if (Object.keys(descriptors).length > 600) return false;
  for (const [key, descriptor] of Object.entries(descriptors)) {
    if (FORBIDDEN_KEYS.has(key) || !OWN(descriptor, 'value')) return false;
    if (Array.isArray(value) && key === 'length') continue;
    if (!safeTree(descriptor.value, seen, depth + 1)) return false;
  }
  seen.delete(value);
  return true;
}

function uniqueStrings(value, allowed, maxLength = 100) {
  return Array.isArray(value) && value.length <= maxLength && new Set(value).size === value.length
    && value.every(item => typeof item === 'string' && allowed(item));
}

function validateProgression(state) {
  const stages = { flags: { briefed: state.flags.briefed === true }, completed: [] };
  for (const zone of state.completed) {
    if (!unlockedZones(stages).includes(zone)) return false;
    stages.completed.push(zone);
    if (zone === 'citadel') stages.flags.spectre = true;
  }
  if ((state.flags.spectre === true) !== state.completed.includes('citadel')) return false;
  const unlocked = unlockedZones(state);
  if (!unlocked.includes(state.zone)) return false;
  const priorClears = new Set();
  for (const id of state.cleared) {
    const zone = id.split(':')[0];
    const index = encounterIndex(id);
    if (index < 0 || !unlocked.includes(zone) || !zoneEncounters(zone).slice(0, index).every(previous => priorClears.has(previous))) return false;
    priorClears.add(id);
  }
  if (!state.completed.every(zone => zone === 'citadel' || zoneEncounters(zone).every(id => priorClears.has(id)))) return false;
  for (const [zone, choice] of Object.entries(state.choices)) {
    if (!OWN(CHOICES, zone) || !state.completed.includes(zone) || !CHOICES[zone].includes(choice)) return false;
  }
  if (Object.keys(CHOICES).some(zone => state.completed.includes(zone) && !OWN(state.choices, zone))) return false;
  if (state.ending !== state.completed.includes('citadel-finale')) return false;
  const jenkinsLost = state.cleared.includes('eden-prime:encounter-1');
  if ((state.flags.jenkinsLost === true) !== jenkinsLost || state.recruited.includes('ashley') !== jenkinsLost) return false;
  if (!state.recruited.includes('kaidan') || !state.recruited.includes('jenkins')) return false;
  if (state.recruited.includes('liara') !== state.completed.includes('therum')) return false;
  const citadelCrew = ['garrus', 'tali', 'wrex'];
  if (!unlocked.includes('citadel') && citadelCrew.some(id => state.recruited.includes(id))) return false;
  if (state.completed.includes('citadel') && !state.recruited.includes('tali')) return false;
  const expectedLost = jenkinsLost ? ['jenkins'] : [];
  if (state.completed.includes('virmire')) expectedLost.push(state.choices.virmire === 'save-kaidan' ? 'ashley' : 'kaidan');
  if (state.lost.length !== expectedLost.length || !expectedLost.every(id => state.lost.includes(id))) return false;
  if (state.collected.some(id => id !== 'normandy:medbay-restock' && !unlocked.includes(id.split(':')[0]))) return false;
  return true;
}

/** Returns a newly reconstructed state, or null for malformed/inconsistent saves. */
export function decodeSave(raw) {
  try {
    if (typeof raw === 'string' && raw.length > 2_000_000) return null;
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!safeTree(data) || !plain(data) || data.format !== 'relay-chronicles' || data.version !== SAVE_VERSION || !plain(data.state)) return null;
    const input = data.state;
    if (input.version !== SAVE_VERSION || typeof input.name !== 'string' || !input.name.trim() || input.name.length > 24) return null;
    // Version 1 saves created before the dossier was selectable have no such
    // fields. Only absent fields receive defaults; explicit invalid data fails.
    const appearance = OWN(input, 'appearance') ? input.appearance : 'male';
    const origin = OWN(input, 'origin') ? input.origin : 'spacer';
    const psychologicalProfile = OWN(input, 'psychologicalProfile') ? input.psychologicalProfile : 'sole-survivor';
    if (!validOption(COMMANDER_APPEARANCES, appearance) || !validOption(ORIGINS, origin)
      || !validOption(PSYCHOLOGICAL_PROFILES, psychologicalProfile)) return null;
    if (!OWN(CLASSES, input.classId) || !DIFFICULTIES.has(input.difficulty) || !MODES.has(input.mode)) return null;
    if (input.zone !== 'normandy' && !OWN(CHAPTERS, input.zone)) return null;
    if (!uniqueStrings(input.party, id => OWN(CREW, id), 3) || input.party.length === 0 || input.party[0] !== 'shepard') return null;
    if (!uniqueStrings(input.recruited, id => OWN(CREW, id) && id !== 'shepard', 7)) return null;
    if (!uniqueStrings(input.lost, id => input.recruited.includes(id), 7)) return null;
    if (!input.party.slice(1).every(id => input.recruited.includes(id) && !input.lost.includes(id))) return null;
    if (!uniqueStrings(input.completed, zone => OWN(CHAPTERS, zone), 8)) return null;
    if (!uniqueStrings(input.cleared, id => encounterIndex(id) >= 0, 21)) return null;
    if (!uniqueStrings(input.collected, id => id === 'normandy:medbay-restock'
      || Object.keys(ENCOUNTERS).some(zone => id === `${zone}:cache`), 8)) return null;
    if (!plain(input.flags) || Object.entries(input.flags).some(([key, value]) => !['briefed', 'spectre', 'jenkinsLost'].includes(key) || typeof value !== 'boolean')) return null;
    if (!plain(input.choices) || !plain(input.upgrades) || !plain(input.settings) || typeof input.ending !== 'boolean') return null;
    for (const key of ['xp', 'credits', 'paragon', 'renegade', 'medigel']) {
      if (!Number.isSafeInteger(input[key]) || input[key] < 0 || input[key] > 1_000_000_000) return null;
    }
    if (input.medigel > 9 || !Number.isFinite(input.playedSeconds) || input.playedSeconds < 0 || input.playedSeconds > 1_000_000_000) return null;
    if (!Array.isArray(input.logs) || input.logs.length > 100 || !input.logs.every(log => plain(log)
      && Object.keys(log).every(key => ['title', 'text'].includes(key))
      && typeof log.title === 'string' && log.title.length <= 200 && typeof log.text === 'string' && log.text.length <= 4000)) return null;
    const settings = { ...DEFAULT_SETTINGS };
    for (const [key, value] of Object.entries(input.settings)) {
      if (!OWN(DEFAULT_SETTINGS, key)) return null;
      if (key === 'volume' ? typeof value !== 'number' || value < 0 || value > 1 : typeof value !== 'boolean') return null;
      settings[key] = value;
    }
    const upgrades = {};
    for (const [id, record] of Object.entries(input.upgrades)) {
      if (!OWN(CREW, id) || (id !== 'shepard' && !input.recruited.includes(id)) || !plain(record)) return null;
      if (Object.keys(record).some(key => !Object.keys(UPGRADE_STATS).some(stat => key === stat || key === `${stat}Count`))) return null;
      upgrades[id] = {};
      for (const [stat, perLevel] of Object.entries(UPGRADE_STATS)) {
        const count = OWN(record, `${stat}Count`) ? record[`${stat}Count`] : 0;
        const amount = OWN(record, stat) ? record[stat] : 0;
        if (!Number.isInteger(count) || count < 0 || count > 5 || !Number.isFinite(amount) || amount !== count * perLevel) return null;
        if (OWN(record, stat)) upgrades[id][stat] = amount;
        if (OWN(record, `${stat}Count`)) upgrades[id][`${stat}Count`] = count;
      }
    }
    let position = null;
    if (input.position !== null) {
      const p = input.position;
      if (!plain(p) || Object.keys(p).some(key => !['x', 'z', 'zone'].includes(key))
        || !Number.isFinite(p.x) || !Number.isFinite(p.z) || Math.abs(p.x) > 10000 || Math.abs(p.z) > 10000
        || (OWN(p, 'zone') && p.zone !== input.zone)) return null;
      position = { x: p.x, z: p.z };
    }
    const state = {
      version: SAVE_VERSION, name: input.name.trim(), classId: input.classId, difficulty: input.difficulty, mode: input.mode,
      appearance, origin, psychologicalProfile,
      zone: input.zone, party: [...input.party], recruited: [...input.recruited], lost: [...input.lost],
      completed: [...input.completed], cleared: [...input.cleared], collected: [...input.collected],
      flags: { ...input.flags }, choices: { ...input.choices }, logs: input.logs.map(log => ({ title: log.title, text: log.text })),
      xp: input.xp, credits: input.credits, medigel: input.medigel, upgrades,
      paragon: input.paragon, renegade: input.renegade, playedSeconds: input.playedSeconds,
      position, ending: input.ending, settings,
    };
    if (!validateProgression(state)) return null;
    state.story = migrateStoryState(OWN(input, 'story') ? input.story : undefined, state);
    return state.story ? state : null;
  } catch {
    return null;
  }
}

export function saveTo(storage, state) {
  try {
    const encoded = encodeSave(state);
    if (!decodeSave(encoded)) return false;
    storage.setItem(SAVE_KEY, encoded);
    return true;
  } catch { return false; }
}

export function loadFrom(storage) {
  try { return decodeSave(storage.getItem(SAVE_KEY)); }
  catch { return null; }
}
