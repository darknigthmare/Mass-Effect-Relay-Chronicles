// Independent study trials. Catalogue evidence identifies a reference; the
// numerical experiment never grants campaign actors, equipment or story flags.
import { normalizeContext, canAccessContent } from './continuity.js';
import { getUniverseRecord, getUniverseWork } from './universe-data.js';
import { createBattle, getActions, performAction, tickBattle } from './combat.js';
import { getUniverseWeaponProfile } from './universe-weapon-profiles.js';
import { EXPANSION_CHARACTERS } from './expansion-characters.js';
import { EXPANSION_ARMOR } from './expansion-armor.js';
import { EXPANSION_WEAPONS } from './expansion-weapons.js';
import { EXPANSION_FLEET } from './expansion-fleet.js';
import { EXPANSION_ENEMIES } from './expansion-enemies.js';

const freeze = value => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze); Object.freeze(value);
  }
  return value;
};
export const EXPANSION_GROUPS = freeze([
  { id: 'actor', label: 'Personnages et PNJ', entries: EXPANSION_CHARACTERS },
  { id: 'armor', label: 'Armures et modules', entries: EXPANSION_ARMOR },
  { id: 'weapon', label: 'Armes', entries: EXPANSION_WEAPONS },
  { id: 'fleet', label: 'Vaisseaux et véhicules', entries: EXPANSION_FLEET },
  { id: 'enemy', label: 'Ennemis et boss', entries: EXPANSION_ENEMIES },
]);
const sourceValid = record => {
  const work = getUniverseWork(record?.mediaId);
  return !!work && record.fact && record.sourceIds.length > 0
    && record.sourceIds.every(id => work.sources.some(source => source.id === id));
};
const entries = EXPANSION_GROUPS.flatMap(group => group.entries.map(entry => {
  const record = getUniverseRecord(entry.recordId);
  if (!record || entry.mode !== group.id) throw new Error(`Invalid study identity: ${entry.recordId}`);
  return freeze({ ...entry, id: entry.recordId, record,
    sourceIds: [...record.sourceIds], availability: record.availability,
    statsBasis: 'ATB adaptation', partial: true,
    identitySourceVerified: sourceValid(record),
    limitations: [...entry.limitations], notes: [...entry.notes],
  });
}));
if (new Set(entries.map(entry => entry.id)).size !== entries.length) throw new Error('Duplicate study identity');
export const EXPANSION_ENTRIES = freeze(entries);
const byId = new Map(entries.map(entry => [entry.id, entry]));

export function getExpansionEntry(id, rawContext) {
  const context = normalizeContext(rawContext), entry = typeof id === 'string' && byId.get(id);
  return entry && context && canAccessContent(id, context).ok ? entry : null;
}

/** Inspection is contextual too, including profiles whose mechanics stay closed. */
export function listExpansionEntries(rawContext, mode = 'all') {
  const context = normalizeContext(rawContext);
  if (!context || mode !== 'all' && !EXPANSION_GROUPS.some(group => group.id === mode)) return [];
  return entries.filter(entry => (mode === 'all' || entry.mode === mode)
    && canAccessContent(entry.id, context).ok);
}

// Only primitive experiment controls are accepted. Callers cannot supply stats,
// source evidence, unlocked packs or campaign state in place of a curated card.
function normalizeOptions(raw = {}) {
  try {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)
      || ![Object.prototype, null].includes(Object.getPrototypeOf(raw))) return null;
    const values = {};
    for (const key of Reflect.ownKeys(raw)) {
      if (!['seed', 'difficulty', 'edition'].includes(key)) return null;
      const descriptor = Object.getOwnPropertyDescriptor(raw, key);
      if (!descriptor.enumerable || !Object.hasOwn(descriptor, 'value')) return null;
      values[key] = descriptor.value;
    }
    const { seed = 1, difficulty = 'normal', edition = 'standard' } = values;
    if (!Number.isInteger(seed) || seed < 1 || seed > 999999
      || !['story', 'normal', 'hard'].includes(difficulty)
      || !['standard', 'legendary', 'deluxe'].includes(edition)) return null;
    return { seed, difficulty, edition };
  } catch { return null; }
}

function validatedStats(entry) {
  const stats = entry.simulation;
  if (!stats || typeof stats !== 'object'
    || !['hp', 'shield', 'attack', 'defense', 'speed'].every(key => Number.isFinite(stats[key]))
    || stats.hp < 1 || stats.hp > 10000 || stats.shield < 0 || stats.shield > 10000
    || stats.attack < 0 || stats.attack > 500 || stats.defense < 0 || stats.defense > 100
    || stats.speed < .1 || stats.speed > (entry.mode === 'fleet' ? 10 : 2)) return null;
  const result = Object.fromEntries(['hp', 'shield', 'attack', 'defense', 'speed'].map(key => [key, stats[key]]));
  result.maxHp = result.hp; result.maxShield = result.shield;
  result.synthetic = stats.synthetic === true;
  result.primaryAction = stats.primaryAction === 'strike' ? 'strike' : 'shoot';
  result.powers = [];
  if (entry.mode === 'weapon') {
    const profile = getUniverseWeaponProfile(stats.weaponProfileId);
    if (stats.weaponProfileId && (!profile || profile.id !== entry.id)) return null;
    if (profile) Object.assign(result, { weaponProfileId: profile.id, weaponType: profile.weaponType,
      weaponSystem: profile.weaponSystem, ...(profile.weaponSystem === 'thermal-clip' ? {
        magazineCapacity: profile.magazineCapacity, ammo: profile.ammo, reserveAmmo: profile.reserveAmmo,
      } : {}) });
    else if (stats.primaryAction === 'strike' && stats.weaponSystem === 'melee') {
      result.primaryAction = 'strike'; result.weaponType = 'melee';
    } else return null;
  }
  return result;
}

export function canRunExpansionEntry(id, rawContext, rawOptions) {
  const context = normalizeContext(rawContext), entry = getExpansionEntry(id, context), options = normalizeOptions(rawOptions);
  if (!entry || !options) return { ok: false, reason: 'Fiche, période ou paramètres indisponibles.' };
  if (!entry.identitySourceVerified) return { ok: false, reason: 'Les sources de cette identité restent à vérifier.' };
  const reason = entry.blockedReason || entry.constraints?.blockedReason;
  if (reason) return { ok: false, reason };
  const edition = entry.constraints?.editionProfile;
  if (edition && edition !== options.edition) return { ok: false,
    reason: `Choisissez le profil ${edition === 'legendary' ? 'Legendary Edition' : 'Deluxe'} pour cet essai indépendant.` };
  if (options.edition === 'legendary' && !['ME2', 'ME3'].includes(context.mediaId)
    || options.edition === 'deluxe' && context.mediaId !== 'MEA') return { ok: false, reason: 'Ce profil d’édition ne correspond pas à cette œuvre.' };
  if (!validatedStats(entry)) return { ok: false, reason: 'Le mécanisme de cette fiche reste en consultation uniquement.' };
  return { ok: true, reason: null };
}

const compact = actor => ({ id: actor.id, name: actor.name, team: actor.team,
  hp: actor.hp, maxHp: actor.maxHp, shield: actor.shield, maxShield: actor.maxShield,
  ...(actor.primaryAction === 'strike' ? {} : actor.weaponSystem === 'thermal-clip'
    ? { ammo: actor.ammo, reserveAmmo: actor.reserveAmmo, magazineCapacity: actor.magazineCapacity }
    : { heat: actor.heat }),
});
const TOOL = freeze({ hp: 220, shield: 60, attack: 24, defense: 6, speed: 1, powers: [] });
function duel(subject, mode, options) {
  const enemyMode = mode === 'enemy';
  const battle = createBattle({ party: [enemyMode ? { ...TOOL, id: 'study:control', name: 'Porteur de test abstrait' } : subject],
    enemies: [enemyMode ? subject : { hp: 190, shield: 35, attack: 14, defense: 5, speed: .8, powers: [],
      id: 'study:target', name: 'Cible d’exercice abstraite' }], medigel: 0,
    difficulty: options.difficulty, mode: 'wait', seed: options.seed });
  const initial = battle.actors.map(compact), snapshots = [{ at: 0, actors: initial }];
  let iterations = 0, nextSample = 5;
  while (!battle.winner && battle.elapsed < 90 && iterations++ < 6000) {
    const party = battle.actors.find(actor => actor.team === 'party');
    const target = battle.actors.find(actor => actor.team === 'enemy' && actor.hp > 0);
    const actions = getActions(battle, party.id).filter(action => action.available);
    const action = [party.primaryAction === 'strike' ? 'strike' : 'shoot', 'reload', 'cover']
      .map(id => actions.find(item => item.id === id)).find(Boolean);
    if (action) performAction(battle, { actorId: party.id, actionId: action.id,
      targetId: action.target === 'self' ? party.id : target?.id });
    tickBattle(battle, .1);
    if (battle.elapsed >= nextSample) {
      snapshots.push({ at: Math.round(battle.elapsed * 10) / 10, actors: battle.actors.map(compact) });
      nextSample += 5;
    }
  }
  return { kind: 'atb', outcome: battle.winner || 'timeout',
    elapsed: Math.round(battle.elapsed * 10) / 10, orders: battle.actionCount,
    initial, actors: battle.actors.map(compact), snapshots,
    log: battle.log.slice(-10), timedOut: !battle.winner };
}

// Ships and civilian transports never enter an infantry duel. These three
// generic logistical stages are a new game exercise, not original fuel,
// combat, travel distances, flight physics or interior reproduction.
function logistics(stats, options) {
  let randomState = options.seed >>> 0;
  const random = () => { randomState = (Math.imul(1664525, randomState) + 1013904223) >>> 0; return randomState / 4294967296; };
  const factor = { story: .75, normal: 1, hard: 1.4 }[options.difficulty];
  let integrity = stats.hp, reserve = stats.shield + 12;
  const initial = { integrity, reserve }, stages = [];
  for (const name of ['Préparation', 'Transit abstrait', 'Arrivée']) {
    const demand = Math.ceil((18 + random() * 8) * factor / stats.speed);
    const spent = Math.min(reserve, demand), deficit = demand - spent;
    reserve -= spent;
    const damage = Math.max(0, Math.ceil((2 + random() * 3) * factor - stats.defense * .5)) + deficit;
    integrity = Math.max(0, integrity - damage);
    stages.push({ name, demand, spent, damage, integrity, reserve });
    if (!integrity) break;
  }
  return { kind: 'logistics', outcome: integrity > 0 && stages.length === 3 ? 'completed' : 'interrupted',
    initial, integrity, reserve, stages,
    note: 'Budgets d’exercice originaux : ils ne représentent ni carburant, ni résistance, ni performances réelles du véhicule.' };
}

/** Bounded, seeded, side-effect-free; no storage API or campaign reward. */
export function runExpansionTrial(id, rawContext, rawOptions) {
  const access = canRunExpansionEntry(id, rawContext, rawOptions);
  if (!access.ok) return access;
  const entry = getExpansionEntry(id, rawContext), options = normalizeOptions(rawOptions), stats = validatedStats(entry);
  const result = entry.mode === 'fleet' ? logistics(stats, options)
    : duel({ ...stats, id: `study:${entry.id}`, catalogId: entry.id, name: entry.record.name,
      mediaId: entry.record.mediaId }, entry.mode, options);
  let control = null;
  if (entry.mode === 'armor') control = duel({ ...TOOL, hp: 120, maxHp: 120, shield: 30, maxShield: 30,
    attack: 16, defense: 4, speed: 1, id: 'study:baseline', name: 'Porteur témoin sans pièce source' }, 'armor', options);
  return { ok: true, recordId: entry.id, context: normalizeContext(rawContext), options,
    statsBasis: 'ATB adaptation', partial: true, result, control };
}
