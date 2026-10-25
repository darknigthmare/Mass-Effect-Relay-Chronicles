// Independent tactical chronicles. No function reads or writes the ME1 save key.
import { createChronicleSession, normalizeChronicleSession, normalizeContext, canAccessContent } from './continuity.js';
import { CHRONICLE_SCENARIOS, getUniverseActor, canUseUniverseActor, universeActorFor, listUniverseBuilds, getUniverseBuild } from './universe-actors.js';
import { listUniverseEquipment, getUniverseEquipment, canEquipUniverseItem, normalizeChronicleLoadouts, equipChronicleItem, getChronicleEquipmentEffects } from './universe-equipment.js';
import { listChronicleStories, getChronicleStory, readChronicleStoryStep } from './chronicle-story.js';
import { UNIVERSE_AMMO_PROFILES, validateAmmoMode } from './universe-ammo.js';
import { isVictoryParticipant, SUMMON_LIMITS } from './combat-summons.js';
import { createBattle } from './combat.js';

export const CHRONICLE_FORMAT = 'relay-chronicles.chronicle';
const MAX_FILE_BYTES = 2_000_000;
const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const copy = value => JSON.parse(JSON.stringify(value));
const fail = reason => ({ ok: false, reason });
const sameContext = (left, right) => !!left && !!right && ['mediaId', 'periodId', 'galaxy'].every(key => left[key] === right[key]);
const scenarios = () => Array.isArray(CHRONICLE_SCENARIOS) ? CHRONICLE_SCENARIOS : Object.values(CHRONICLE_SCENARIOS);
const scenarioFor = id => typeof id === 'string' ? scenarios().find(scenario => scenario.id === id) || null : null;
const scenarioContext = scenario => normalizeContext(scenario?.context);
const actorCheck = (context, id, scenarioId) => {
  const check = canUseUniverseActor(context, id, scenarioId);
  return check === true || check?.ok === true;
};
const battleSnapshots = new WeakMap();
const fingerprint = session => JSON.stringify([session.context, session.scenarioId, session.party, session.loadouts, session.builds, session.ammoModes]);

function preparedAmmoCheck(session, actorId, modeId) {
  if (modeId !== null && !canAccessContent(modeId, session.context).ok) return fail('Ce mode n’appartient pas à cette période.');
  return validateAmmoMode(composeChronicleActor(session, actorId), modeId);
}

// Only transitions from an already valid session may withdraw an obsolete mode.
// Imports use the strict validator below and never silently repair forged kits.
function reconcileAmmoModes(session) {
  return Object.fromEntries(session.party.map(actorId => {
    const modeId = session.ammoModes[actorId] ?? null;
    return [actorId, preparedAmmoCheck(session, actorId, modeId).ok ? modeId : null];
  }));
}

export function listChronicleScenarios(rawContext) {
  const context = normalizeContext(rawContext);
  return context ? scenarios().filter(scenario => sameContext(scenarioContext(scenario), context)).map(copy) : [];
}

/** Composite validation: a valid base envelope cannot invent actors or gear. */
export function normalizeChronicle(raw) {
  try {
    const session = normalizeChronicleSession(raw);
    if (!session) return null;
    for (const [storyId, index] of Object.entries(session.readingProgress)) {
      const story = getChronicleStory(storyId, session.context), page = story?.steps[index];
      if (!page || ![story.progressRecordId, ...page.recordIds].every(id => session.discovered.includes(id))) return null;
    }
    const allowed = listChronicleScenarios(session.context);
    if (!session.cleared.every(id => allowed.some(scenario => scenario.id === id))) return null;
    if (session.scenarioId === null) return session.party.length === 0 && Object.keys(session.loadouts).length === 0 ? session : null;
    const scenario = allowed.find(candidate => candidate.id === session.scenarioId);
    if (!scenario || session.party.length < 1 || session.party.length > 3
      || !session.party.every(id => scenario.actorIds.includes(id) && actorCheck(session.context, id, scenario.id))
      || (scenario.exclusiveActorGroups || []).some(group => session.party.filter(id => group.includes(id)).length > 1)) return null;
    const loadouts = normalizeChronicleLoadouts(session.loadouts, session.context, session.party, scenario.id);
    if (!loadouts) return null;
    for (const actorId of session.party) {
      const build = getUniverseBuild(actorId, session.context, session.builds[actorId], scenario.id);
      if (!build || loadouts[actorId].weapon && !build.allowedWeapons.includes(getUniverseEquipment(loadouts[actorId].weapon)?.weaponType)) return null;
    }
    const normalized = { ...session, loadouts };
    if (!session.party.every(actorId => preparedAmmoCheck(normalized, actorId, session.ammoModes[actorId]).ok)) return null;
    return normalized;
  } catch { return null; }
}

export function createChronicle(rawContext, scenarioId) {
  const base = createChronicleSession(rawContext);
  if (!base) return null;
  const available = listChronicleScenarios(base.context);
  const scenario = scenarioId === undefined ? available[0] : available.find(candidate => candidate.id === scenarioId);
  if (scenarioId !== undefined && !scenario) return null;
  if (!scenario) return base;
  base.scenarioId = scenario.id;
  base.party = [...scenario.defaultParty];
  base.ammoModes = Object.fromEntries(base.party.map(actorId => [actorId, null]));
  base.loadouts = normalizeChronicleLoadouts(undefined, base.context, base.party, scenario.id);
  return normalizeChronicle(base);
}

export function selectChronicleScenario(raw, scenarioId) {
  const session = normalizeChronicle(raw);
  if (!session) return fail('Chronique invalide.');
  const replacement = createChronicle(session.context, scenarioId);
  if (!replacement) return fail('Cet essai n’appartient pas à cette période.');
  replacement.ammoModes = reconcileAmmoModes({ ...replacement, ammoModes: session.ammoModes });
  return { ok: true, session: { ...replacement, discovered: session.discovered, notes: session.notes,
    readingProgress: session.readingProgress, cleared: session.cleared } };
}

export function setChronicleParty(raw, actorIds) {
  const session = normalizeChronicle(raw);
  const selectionInput = session && { ...session, party: actorIds, loadouts: {}, builds: {} };
  // Let the base validator inspect hostile arrays before enumerating any IDs.
  if (selectionInput) delete selectionInput.ammoModes;
  const selection = selectionInput && normalizeChronicleSession(selectionInput);
  if (!selection || selection.party.length < 1) return fail('Choisissez de un à trois combattants disponibles.');
  const loadouts = Object.fromEntries(selection.party.filter(id => own(session.loadouts, id)).map(id => [id, session.loadouts[id]]));
  const builds = Object.fromEntries(selection.party.map(id => [id, session.builds[id] ?? 'default']));
  const ammoModes = Object.fromEntries(selection.party.map(id => [id, session.ammoModes[id] ?? null]));
  const updated = normalizeChronicle({ ...session, party: selection.party, loadouts, builds, ammoModes });
  return updated ? { ok: true, session: updated } : fail('Un personnage est indisponible dans cet essai.');
}

export function equipChronicle(raw, actorId, itemId, slot) {
  const session = normalizeChronicle(raw);
  if (!session) return fail('Chronique invalide.');
  const result = equipChronicleItem(session, actorId, itemId, slot);
  if (!result.ok) return result;
  const candidate = { ...session, loadouts: result.loadouts };
  const updated = normalizeChronicle({ ...candidate, ammoModes: reconcileAmmoModes(candidate) });
  return updated ? { ok: true, session: updated, returnedMods: result.returnedMods ?? [],
    clearedAmmoMode: session.ammoModes[actorId] !== updated.ammoModes[actorId] ? session.ammoModes[actorId] : null }
    : fail('Équipement incompatible avec cette chronique.');
}

export function getChronicleRoster(raw) {
  const session = normalizeChronicle(raw), scenario = scenarioFor(session?.scenarioId);
  return scenario ? scenario.actorIds.filter(id => actorCheck(session.context, id, scenario.id)).map(id => {
    const actor = getUniverseActor(id);
    const native = universeActorFor(id, session.context, session.builds[id] ?? 'default', scenario.id);
    return { ...copy(actor), ...(native?.missingPowers ? { missingPowers: [...native.missingPowers] } : {}), selected: session.party.includes(id) };
  }) : [];
}

export function getChronicleGear(raw, actorId, slot) {
  const session = normalizeChronicle(raw);
  if (!session || !session.party.includes(actorId)
    || slot !== undefined && !['weapon', 'armor', 'weaponMod', 'weaponMod2'].includes(slot)) return [];
  const build = getUniverseBuild(actorId, session.context, session.builds[actorId], session.scenarioId);
  return listUniverseEquipment(session.context, { actorId, scenarioId: session.scenarioId, loadout: session.loadouts[actorId] }).map(item => {
    if (item.kind === 'weapon' && item.runtimeSupported && !build.allowedWeapons.includes(item.weaponType)) {
      const reason = 'Cette famille d’arme ne fait pas partie de cette préparation de classe.';
      return { ...item, compatible: false, compatibleSlots: [], playable: false,
        slotReasons: { ...item.slotReasons, weapon: reason }, reason };
    }
    if (slot === undefined) return item;
    const check = canEquipUniverseItem(session.context, actorId, item.id, slot, session.scenarioId, session.loadouts[actorId]);
    return { ...item, compatible: check.ok, playable: check.ok, reason: check.reason };
  });
}

export function getChronicleBuilds(raw, actorId) {
  const session = normalizeChronicle(raw);
  return session && session.party.includes(actorId) ? listUniverseBuilds(actorId, session.context, session.scenarioId) : [];
}

/** Contextual profiles stay visible with the actual kit/weapon refusal reason. */
export function getChronicleAmmoModes(raw, actorId) {
  const session = normalizeChronicle(raw);
  if (!session || !session.party.includes(actorId)) return [];
  return UNIVERSE_AMMO_PROFILES.filter(profile => profile.mediaId === session.context.mediaId
    && canAccessContent(profile.id, session.context).ok).map(profile => {
    const check = preparedAmmoCheck(session, actorId, profile.id);
    return { ...copy(profile), compatible: check.ok, reason: check.reason ?? null,
      selected: session.ammoModes[actorId] === profile.id };
  });
}

/** Preparation choices are independent from later live combat activations. */
export function setChronicleAmmoMode(raw, actorId, modeId) {
  const session = normalizeChronicle(raw);
  if (!session || !session.party.includes(actorId)) return fail('Combattant indisponible dans cette chronique.');
  const check = preparedAmmoCheck(session, actorId, modeId);
  if (!check.ok) return check;
  const updated = normalizeChronicle({ ...session, ammoModes: { ...session.ammoModes, [actorId]: check.ammoModeId } });
  return updated ? { ok: true, session: updated } : fail('Mode de munitions incompatible avec cette chronique.');
}

/** Class preparation may withdraw an incompatible weapon; it never creates stock. */
export function setChronicleBuild(raw, actorId, buildId) {
  const session = normalizeChronicle(raw);
  if (!session || !session.party.includes(actorId)) return fail('Combattant indisponible dans cette chronique.');
  const build = getUniverseBuild(actorId, session.context, buildId, session.scenarioId);
  if (!build) return fail('Préparation inconnue ou étrangère à cette œuvre.');
  const loadouts = copy(session.loadouts), loadout = loadouts[actorId], clearedEquipment = [];
  if (loadout.weapon && !build.allowedWeapons.includes(getUniverseEquipment(loadout.weapon)?.weaponType)) {
    for (const slot of ['weapon', 'weaponMod', 'weaponMod2']) {
      if (loadout[slot]) clearedEquipment.push(loadout[slot]);
      loadout[slot] = null;
    }
  }
  const candidate = { ...session, loadouts, builds: { ...session.builds, [actorId]: build.id } };
  const updated = normalizeChronicle({ ...candidate, ammoModes: reconcileAmmoModes(candidate) });
  return updated ? { ok: true, session: updated, clearedEquipment,
    clearedAmmoMode: session.ammoModes[actorId] !== updated.ammoModes[actorId] ? session.ammoModes[actorId] : null }
    : fail('Cette préparation est incompatible avec le groupe.');
}

export const listChronicleReadings = rawContext => listChronicleStories(rawContext);

export function getChronicleReading(raw, storyId) {
  const session = normalizeChronicle(raw);
  if (!session || typeof storyId !== 'string') return null;
  const result = readChronicleStoryStep(session.context, storyId, session.readingProgress[storyId] ?? 0, session.discovered);
  return result.ok ? result : null;
}

/** Reading records facts visited, without replacing personal notes or story choices. */
export function readChroniclePage(raw, storyId, index) {
  const session = normalizeChronicle(raw);
  if (!session || typeof storyId !== 'string') return fail('Chronique ou parcours invalide.');
  const reading = readChronicleStoryStep(session.context, storyId,
    index === undefined ? session.readingProgress[storyId] ?? 0 : index, session.discovered);
  if (!reading.ok) return reading;
  const updated = normalizeChronicle({ ...session, discovered: reading.discovered,
    readingProgress: { ...session.readingProgress, [storyId]: reading.index } });
  return updated ? { ok: true, session: updated, reading } : fail('Progression documentaire invalide.');
}

/** Compose trusted selections without recursively validating the session. */
function composeChronicleActor(session, actorId) {
  const base = universeActorFor(actorId, session.context, session.builds[actorId], session.scenarioId);
  if (!base) return null;
  const effects = getChronicleEquipmentEffects(session, actorId);
  const hp = base.hp + effects.hp, shield = base.shield + effects.shield;
  const actor = { ...copy(base), hp, maxHp: hp, shield, maxShield: shield,
    attack: base.attack + effects.attack, defense: base.defense + effects.defense,
    weaponHeatMultiplier: (base.weaponHeatMultiplier ?? 1) * effects.weaponHeatMultiplier,
    weaponDamageMultiplier: (base.weaponDamageMultiplier ?? 1) * (effects.weaponDamageMultiplier ?? 1),
    weaponCoolingBonus: (base.weaponCoolingBonus ?? 0) + effects.weaponCoolingBonus,
    controlResistance: Math.min(.6, (base.controlResistance ?? 0) + effects.controlResistance),
    bioticMultiplier: (base.bioticMultiplier ?? 1) * effects.bioticMultiplier,
    techMultiplier: (base.techMultiplier ?? 1) * effects.techMultiplier,
  };
  for (const key of ['weaponType', 'weaponName', 'weaponSystem', 'weaponProfileId', 'magazineCapacity', 'ammo', 'reserveAmmo']) {
    if (effects[key] !== undefined) actor[key] = effects[key];
  }
  // A Remnant heat profile cannot inherit the protagonist's abstract clip stock.
  if (actor.weaponSystem === 'heat' && actor.weaponProfileId) {
    for (const key of ['magazineCapacity', 'ammo', 'reserveAmmo']) delete actor[key];
  }
  return actor;
}

/** Apply loadout bonuses once and pass only validated preparation permissions. */
export function buildChronicleActor(raw, actorId) {
  const session = normalizeChronicle(raw);
  if (!session || !session.party.includes(actorId)) return null;
  const actor = composeChronicleActor(session, actorId);
  return actor ? { ...actor, ammoModeId: session.ammoModes[actorId] } : null;
}

export function startChronicleBattle(raw) {
  const session = normalizeChronicle(raw), scenario = scenarioFor(session?.scenarioId);
  if (!session || !scenario) return fail('Aucun essai tactique disponible pour cette période.');
  try {
    if (!Array.isArray(scenario.enemies) || scenario.enemies.length < 1 || scenario.enemies.some(enemy => enemy.catalogId
      ? !canAccessContent(enemy.catalogId, session.context).ok
      : enemy.abstract !== true || !['equipment-workshop', 'tactical-simulation', 'specialist-workshop'].includes(scenario.kind)))
      return fail('Les adversaires de cet essai ne sont pas attestés dans cette période.');
    const party = session.party.map(id => buildChronicleActor(session, id));
    if (party.some(actor => !actor)) return fail('Commando incompatible avec cette période.');
    const enemies = scenario.enemies.map((enemy, index) => ({ ...copy(enemy), id: `chronicle-enemy-${index}` }));
    const battle = createBattle({ party, enemies, mode: 'wait', difficulty: 'normal', seed: 2183 + session.cleared.length, medigel: 3 });
    battleSnapshots.set(battle, fingerprint(session));
    return { ok: true, battle };
  } catch { return fail('Impossible de démarrer cet essai tactique.'); }
}

/** Tactical results never award campaign progress, credits, or canonical choices. */
export function finishChronicleBattle(raw, battle) {
 try {
  const session = normalizeChronicle(raw);
  if (!session || !battle || battleSnapshots.get(battle) !== fingerprint(session)) return fail('Résultat d’essai invalide ou étranger à cette chronique.');
  const winner = Object.getOwnPropertyDescriptor(battle, 'winner');
  const actorsField = Object.getOwnPropertyDescriptor(battle, 'actors');
  if (!winner || !own(winner, 'value') || !['party', 'enemy'].includes(winner.value)
    || !actorsField || !own(actorsField, 'value') || !Array.isArray(actorsField.value)
    || actorsField.value.length > SUMMON_LIMITS.maximumActors) return fail('Résultat d’essai invalide.');
  const scenario = scenarioFor(session.scenarioId);
  const expected = new Map([...session.party.map(id => [id, 'party']),
    ...scenario.enemies.map((enemy, index) => [`chronicle-enemy-${index}`, 'enemy'])]);
  const actors = [], seen = new Set();
  for (let index = 0; index < actorsField.value.length; index++) {
    const field = Object.getOwnPropertyDescriptor(actorsField.value, String(index));
    if (!field || !own(field, 'value') || !field.value || typeof field.value !== 'object') return fail('Combattant invalide.');
    const id = Object.getOwnPropertyDescriptor(field.value, 'id');
    const team = Object.getOwnPropertyDescriptor(field.value, 'team'), hp = Object.getOwnPropertyDescriptor(field.value, 'hp');
    if (!id || !own(id, 'value') || typeof id.value !== 'string' || seen.has(id.value)
      || !team || !hp || !own(team, 'value') || !own(hp, 'value') || !['party', 'enemy'].includes(team.value)
      || !Number.isFinite(hp.value) || hp.value < 0) return fail('Combattant invalide.');
    seen.add(id.value);
    if (!isVictoryParticipant(field.value)) {
      if (expected.has(id.value)) return fail('Combattant natif invalide.');
      continue;
    }
    if (expected.get(id.value) !== team.value) return fail('Combattant étranger à cet essai.');
    actors.push({ team: team.value, hp: hp.value });
  }
  const won = winner.value === 'party';
  if (actors.length !== expected.size
    || !actors.some(actor => actor.team === 'enemy') || !actors.some(actor => actor.team === 'party')
    || won && (actors.some(actor => actor.team === 'enemy' && actor.hp > 0)
      || !actors.some(actor => actor.team === 'party' && actor.hp > 0))
    || !won && actors.some(actor => actor.team === 'party' && actor.hp > 0)) return fail('L’essai n’est pas terminé.');
  battleSnapshots.delete(battle);
  if (won && !session.cleared.includes(session.scenarioId)) session.cleared.push(session.scenarioId);
  return { ok: true, session, won };
 } catch { return fail('Résultat d’essai invalide.'); }
}

function serializeChronicle(session) {
  const encoded = JSON.stringify({ format: CHRONICLE_FORMAT, version: 1, session });
  return encoded.length <= MAX_FILE_BYTES ? encoded : null;
}
export function encodeChronicle(raw) {
  const session = normalizeChronicle(raw);
  return session ? serializeChronicle(session) : null;
}
export function decodeChronicle(value) {
  try {
    if (typeof value === 'string' && value.length > MAX_FILE_BYTES) return null;
    const packet = typeof value === 'string' ? JSON.parse(value) : value;
    if (!packet || typeof packet !== 'object' || Array.isArray(packet)
      || ![Object.prototype, null].includes(Object.getPrototypeOf(packet))) return null;
    const keys = Reflect.ownKeys(packet);
    if (keys.length !== 3 || !['format', 'version', 'session'].every(key => keys.includes(key))) return null;
    const fields = Object.fromEntries(keys.map(key => {
      const descriptor = Object.getOwnPropertyDescriptor(packet, key);
      if (!descriptor.enumerable || !own(descriptor, 'value')) throw new Error('Accessor');
      return [key, descriptor.value];
    }));
    return fields.format === CHRONICLE_FORMAT && fields.version === 1 ? normalizeChronicle(fields.session) : null;
  } catch { return null; }
}

export function chronicleStorageKey(rawContext) {
  const context = normalizeContext(rawContext);
  return context ? `relay-chronicles.chronicle.${context.mediaId}.${context.periodId}.v1` : null;
}
export function saveChronicle(storage, raw) {
  try {
    const session = normalizeChronicle(raw);
    const encoded = session && serializeChronicle(session);
    if (!encoded) return fail('Chronique invalide ; sauvegarde précédente conservée.');
    storage.setItem(chronicleStorageKey(session.context), encoded);
    return { ok: true };
  } catch { return fail('Impossible d’enregistrer la chronique ; vérifiez le stockage disponible.'); }
}
export function loadChronicle(storage, rawContext) {
  const context = normalizeContext(rawContext), key = chronicleStorageKey(context);
  if (!key) return fail('Période indisponible.');
  try {
    const encoded = storage.getItem(key);
    if (encoded === null) return { ok: true, session: createChronicle(context), fresh: true };
    const session = decodeChronicle(encoded);
    return session && sameContext(session.context, context) ? { ok: true, session, fresh: false }
      : fail('La chronique enregistrée est invalide. Son contenu a été conservé.');
  } catch { return fail('Impossible de lire le stockage des chroniques.'); }
}
