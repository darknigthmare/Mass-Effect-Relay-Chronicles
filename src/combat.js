/**
 * Deterministic ATB combat simulation. All numbers are adaptation/balance values.
 * No DOM, renderer, clock or platform state is read by this module.
 *
 * speed is a multiplier: 1 fills an ATB gauge in five simulated seconds.
 * Cooldowns and timed statuses use simulated seconds. In wait mode a ready,
 * actionable party member freezes the entire simulation until an order is given.
 */
import { getUniverseWeaponProfile } from './universe-weapon-profiles.js';
import { SUMMON_PROFILES, getSummonProfile, isSummon, isVictoryParticipant, planSummon, planSummonTick } from './combat-summons.js';
import { UNIVERSE_AMMO_PROFILES, getAmmoActionProfile, validateAmmoMode, canActivateAmmoProfile, activateAmmoProfile, getAmmoHitModifiers, getAmmoPostHit } from './universe-ammo.js';

const SUMMON_ACTIONS = new Set(SUMMON_PROFILES.map(profile => profile.actionId));
const AMMO_ACTIONS = new Set(UNIVERSE_AMMO_PROFILES.map(profile => profile.actionId));
const ammoActionDefinitions = Object.fromEntries(UNIVERSE_AMMO_PROFILES.map(profile => [profile.actionId,
  { label: profile.name, description: 'Active ce seul mode appris sur l’arme conventionnelle à clips. Consomme un ordre ATB, sans recharger ni ajouter de munition.', target: 'self' }]));

export const ACTIONS = Object.freeze({
  shoot: { label: 'Tir contrôlé', description: 'Un tir précis. Génère 24 points de chaleur.', target: 'enemy', heatCost: 24 },
  burst: { label: 'Rafale', description: 'Plus de dégâts, mais 48 points de chaleur.', target: 'enemy', heatCost: 48 },
  reload: { label: 'Recharger', description: 'Remplit le chargeur depuis la réserve. Consomme une action ATB.', target: 'self' },
  cancelChannel: { label: 'Interrompre le tir', description: 'Arrête la canalisation sans rembourser les ressources déjà dépensées. Aucun coût ATB supplémentaire.', target: 'self' },
  strike: { label: 'Assaut organique', description: 'Une attaque rapprochée qui contourne la couverture. Ne génère aucune chaleur d’arme.', target: 'enemy' },
  acid: { label: 'Projection acide', description: 'Une attaque organique suivie de corrosion. Ne mobilise aucun pouvoir biotique.', target: 'enemy' },
  cover: { label: 'Couverture', description: 'Réduit les tirs jusqu’à la prochaine action, accélère la recharge des boucliers et laisse refroidir l’arme.', target: 'self' },
  reposition: { label: 'Contournement', description: 'Le prochain tir ignore la couverture adverse pendant huit secondes.', target: 'self' },
  medigel: { label: 'Médi-gel', description: 'Soigne un allié conscient. Consomme une dose partagée.', target: 'ally' },
  overload: { label: 'Surcharge', description: 'Attaque les boucliers ; peut aussi endommager les synthétiques.', target: 'enemy', cooldown: 8 },
  sabotage: { label: 'Sabotage', description: 'Neutralise les armes adverses pendant six secondes.', target: 'enemy', cooldown: 10 },
  lift: { label: 'Lévitation', description: 'Soulève et neutralise la cible pendant quatre secondes.', target: 'enemy', cooldown: 10 },
  throw: { label: 'Projection', description: 'Projette la cible. Plus efficace contre une cible soulevée.', target: 'enemy', cooldown: 7 },
  warp: { label: 'Déchirure', description: 'Inflige des dégâts et affaiblit l’armure pendant six secondes.', target: 'enemy', cooldown: 11 },
  singularity: { label: 'Singularité', description: 'Désorganise et soulève les adversaires proches pendant trois secondes.', target: 'enemies', cooldown: 16 },
  barrier: { label: 'Barrière', description: 'Restaure une partie des boucliers et ajoute une protection temporaire.', target: 'self', cooldown: 13 },
  stasis: { label: 'Stase', description: 'Immobilise six secondes. La cible est aussi protégée de tous les dégâts.', target: 'enemy', cooldown: 16 },
  hack: { label: 'Piratage d’IA', description: 'Un synthétique attaque temporairement son propre camp.', target: 'enemy', cooldown: 15, syntheticOnly: true },
  pull: { label: 'Attraction', description: 'Suspend une cible sans bouclier pendant trois secondes. Aucun dégât direct.', target: 'enemy', cooldown: 8 },
  incinerate: { label: 'Incinération', description: 'Inflige un impact thermique puis une brûlure de cinq secondes. Ne consomme aucune munition.', target: 'enemy', cooldown: 8 },
  cryoBlast: { label: 'Explosion cryogénique', description: 'Gèle quatre secondes une cible sans bouclier. Le gel rend les tirs plus efficaces.', target: 'enemy', cooldown: 9 },
  concussiveShot: { label: 'Tir percutant', description: 'Impact physique et bref déséquilibre sur cible exposée ; brise le gel. Utilise une recharge de pouvoir, sans munition.', target: 'enemy', cooldown: 7 },
  energyDrain: { label: 'Drain d’énergie', description: 'Draine les boucliers ou les synthétiques et convertit la moitié des dégâts réels en bouclier personnel.', target: 'enemy', cooldown: 10 },
  fortification: { label: 'Fortification', description: 'Protection militaire temporaire de dix secondes ; ne confère aucun pouvoir biotique.', target: 'self', cooldown: 14 },
  reave: { label: 'Ravage', description: 'Inflige une atteinte biotique puis des dégâts pendant cinq secondes. Les variantes ME2 et ME3 ont des protections distinctes.', target: 'enemy', cooldown: 12 },
  shockwave: { label: 'Onde de choc', description: 'Onde sur le groupe adverse dans cette adaptation ATB. Les cibles exposées sont brièvement déséquilibrées.', target: 'enemies', cooldown: 13 },
  slam: { label: 'Écrasement', description: 'Soulève brièvement une cible sans bouclier, puis l’écrase après un court délai.', target: 'enemy', cooldown: 10 },
  dominate: { label: 'Domination', description: 'Un organique sans bouclier attaque son propre camp pendant huit secondes. Les cibles immunisées résistent.', target: 'enemy', cooldown: 15, organicOnly: true },
  fragGrenade: { label: 'Grenade à fragmentation', description: 'Dégâts explosifs sur le groupe adverse ATB. Consomme un échantillon de grenade, sans recharge temporelle.', target: 'enemy', grenadeCost: 1 },
  stickyGrenade: { label: 'Grenade adhésive', description: 'Fixe une charge qui explose après 1,2 seconde ATB. Consomme un échantillon de grenade, sans recharge temporelle.', target: 'enemy', grenadeCost: 1 },
  shieldBoost: { label: 'Renfort de boucliers', description: 'Restaure les boucliers des alliés conscients et accélère leur recharge pendant cinq secondes ATB.', target: 'allies', cooldown: 14 },
  combatDrone: { label: 'Drone de combat', description: 'Déploie un drone ciblable et temporaire qui harcèle un adversaire. Paramètres et plafonds adaptés à l’ATB.', target: 'enemy', cooldown: 10 },
  sentryTurret: { label: 'Tourelle de garde', description: 'Déploie une tourelle ciblable et temporaire à tir autonome. Ne devient pas un équipier sélectionnable.', target: 'self', cooldown: 12 },
  defenseDrone: { label: 'Drone de défense', description: 'Déploie une garde ATB réactive aux coups réellement reçus par le propriétaire ; aucune proximité physique d’origine n’est simulée.', target: 'self', cooldown: 12 },
  ...ammoActionDefinitions,
  ammoOff: { label: 'Désactiver les munitions', description: 'Retire le mode actif sans restituer ni ajouter de munition. Consomme un ordre ATB.', target: 'self' },
  unity: { label: 'Unité', description: 'Talent Spectre : remet les équipiers hors combat en état de combattre.', target: 'allies', cooldown: 24 },
  signature: { label: 'Technique d’élite', description: 'Une exécution précise avec l’arsenal du personnage. Nécessite 100 de concentration.', target: 'enemy', heatCost: 42 },
});

const BASE_ACTIONS = ['shoot', 'burst', 'cover', 'reposition'];
const PRIMARY_ACTIONS = new Set(['shoot', 'burst', 'reload', 'strike', 'acid', 'cover', 'reposition']);
const WEAPON_ACTIONS = new Set(['shoot', 'burst', 'signature']);
const BIOTIC_ACTIONS = new Set(['throw', 'lift', 'warp', 'singularity', 'barrier', 'stasis', 'pull', 'reave', 'shockwave', 'slam', 'dominate']);
const TECH_ACTIONS = new Set(['overload', 'sabotage', 'hack', 'incinerate', 'cryoBlast', 'energyDrain']);
const DISABLING_STATUSES = ['stasis', 'lift', 'singularity', 'stagger', 'pull', 'frozen', 'slam'];
const DIFFICULTY = {
  story: { enemyDamage: 0.65, enemySpeed: 0.8, focusChance: 0.2 },
  easy: { enemyDamage: 0.8, enemySpeed: 0.9, focusChance: 0.4 },
  normal: { enemyDamage: 1.85, enemySpeed: 1.2, focusChance: 0.8 },
  hard: { enemyDamage: 2.25, enemySpeed: 1.35, focusChance: 0.9 },
};
const EPSILON = 1e-8;
// Exposed recovery is deliberately slow; spending an ATB action on cover is
// the practical way to rebuild shields while the rest of the squad acts.
const SHIELD_RECHARGE = { exposedDelay: 7, exposedRate: 1, coverDelay: 2, coverRate: 8 };

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const finite = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const living = actor => actor.hp > EPSILON;
const synthetic = actor => actor.synthetic === true || actor.type === 'synthetic';
const armed = actor => !['strike', 'acid'].includes(actor.primaryAction);
const disabled = actor => DISABLING_STATUSES.some(key => actor.statuses[key] > EPSILON);
const ready = actor => !isSummon(actor) && living(actor) && !disabled(actor) && !actor.channel && actor.atb >= 100 - EPSILON;
const usesClips = actor => actor.weaponSystem === 'thermal-clip';
const protectedTarget = actor => actor.shield > EPSILON || (actor.statuses.fortification > EPSILON && actor.fortificationShield > EPSILON);
// Magazine sizes and shots spent per ATB order are adaptation values. ME1 heat
// actors never enter this branch and retain their original unlimited ammunition.
const ammoCost = actionId => actionId === 'burst' ? 3 : actionId === 'signature' ? 2 : 1;
const weaponProfile = actor => getUniverseWeaponProfile(actor.weaponProfileId);
const weaponAmmoCost = (actor, actionId) => weaponProfile(actor)?.mode === 'clip-channel' ? weaponProfile(actor).ammoPerTick : ammoCost(actionId);
const effectDuration = (actor, actionId, seconds) => clamp(seconds * powerMultiplier(actor, actionId), .25, 20);

// Tools strengthen trained abilities. They do not change weapon damage or grant
// a power, and an amplifier never strengthens technology (or the reverse).
function powerMultiplier(actor, actionId) {
  if (BIOTIC_ACTIONS.has(actionId)) return actor?.bioticMultiplier ?? 1;
  if (TECH_ACTIONS.has(actionId)) return actor?.techMultiplier ?? 1;
  return 1;
}

function powerDescription(actor, actionId) {
  const multiplier = powerMultiplier(actor, actionId);
  const duration = seconds => Number((seconds * multiplier).toFixed(2)).toLocaleString('fr-FR');
  if (multiplier !== 1) {
    if (actionId === 'sabotage') return `Neutralise les armes adverses pendant ${duration(6)} secondes.`;
    if (actionId === 'lift') return `Soulève et neutralise la cible pendant ${duration(4)} secondes.`;
    if (actionId === 'warp') return `Inflige des dégâts et affaiblit l’armure pendant ${duration(6)} secondes.`;
    if (actionId === 'singularity') return `Désorganise et soulève les adversaires proches pendant ${duration(3)} secondes.`;
    if (actionId === 'stasis') return `Immobilise ${duration(6)} secondes. La cible est aussi protégée de tous les dégâts.`;
    const futureDuration = seconds => Number(effectDuration(actor, actionId, seconds).toFixed(2)).toLocaleString('fr-FR');
    if (actionId === 'pull') return `Suspend une cible sans bouclier pendant ${futureDuration(3)} secondes. Aucun dégât direct.`;
    if (actionId === 'cryoBlast') return `Gèle une cible sans bouclier pendant ${futureDuration(4)} secondes. Le gel renforce les tirs.`;
    if (actionId === 'incinerate') return `Impact thermique puis brûlure pendant ${futureDuration(5)} secondes. Aucune munition consommée.`;
    if (actionId === 'dominate') return `Un organique sans bouclier attaque son propre camp pendant ${futureDuration(8)} secondes.`;
  }
  if (actionId === 'fortification') return actor.mediaId === 'ME2'
    ? 'Modèle ATB ME2 : réserve de bouclier temporaire pendant dix secondes, sans restaurer le bouclier normal.'
    : 'Modèle ATB défensif : réduit les dégâts de 25 % pendant dix secondes, sans restaurer de bouclier.';
  if (actionId === 'reave') return `Ravage : dégâts biotiques pendant ${Number(effectDuration(actor, actionId, 5).toFixed(2)).toLocaleString('fr-FR')} secondes. ${actor.mediaId === 'ME2'
    ? 'Le drain de santé organique soigne partiellement le lanceur.'
    : actor.mediaId === 'ME3' ? 'Le lanceur reçoit une réduction de dégâts de 15 % pendant l’effet.' : 'Aucun bénéfice défensif de version non renseignée.'}`;
  return ACTIONS[actionId].description;
}

function makeRandom(seed) {
  let state = (finite(seed, 1) >>> 0) || 1;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function random(battle) {
  return clamp(finite(battle._rng(), 0.5), 0, 1 - Number.EPSILON);
}

function emit(battle, event) {
  const entry = { id: battle.events.length, at: battle.elapsed, ...event };
  battle.events.push(entry);
  if (event.message) {
    battle.log.push(event.message);
    if (battle.log.length > 100) battle.log.shift();
  }
  return entry;
}

function summonPlan(battle, actor, actionId, targetId) {
  const serial = battle.nextSummonSerial ?? Math.max(0, ...battle.actors.filter(isSummon).map(candidate => candidate.summonSerial)) + 1;
  return planSummon({ actors: battle.actors, ownerId: actor.id, actionId, targetId, elapsed: battle.elapsed,
    serial, eventCursor: battle.events.at(-1)?.id ?? -1 });
}

function retireSummons(battle, entries) {
  if (!entries.length) return;
  const ids = new Set(entries.map(entry => entry.actorId));
  for (const actor of battle.actors.filter(candidate => isSummon(candidate) && ids.has(candidate.id))) {
    const entry = entries.find(candidate => candidate.actorId === actor.id);
    stopChannel(battle, actor, 'soutien retiré');
    const retired = { id: actor.id, ownerId: actor.ownerId, actionId: actor.actionId, reason: entry.reason, at: battle.elapsed };
    battle.summonHistory ||= [];
    battle.summonHistory.push(retired);
    battle.summonHistory = battle.summonHistory.slice(-24);
    emit(battle, { type: 'summonRetire', actorId: actor.id, ownerId: actor.ownerId, actionId: actor.actionId,
      reason: entry.reason, message: `${actor.name} est retiré du combat.` });
  }
  battle.actors = battle.actors.filter(actor => !isSummon(actor) || !ids.has(actor.id));
}

function cleanupSummons(battle) {
  if (!battle.actors.some(isSummon)) return;
  const plan = planSummonTick({ actors: battle.actors, elapsed: battle.elapsed });
  if (plan.ok) retireSummons(battle, plan.retirements);
}

function advanceSummons(battle) {
  if (!battle.actors.some(isSummon)) return;
  const plan = planSummonTick({ actors: battle.actors, elapsed: battle.elapsed, recentEvents: battle.events });
  if (!plan.ok) return;
  for (const patch of plan.patches) {
    const actor = battle.actors.find(candidate => candidate.id === patch.actorId);
    if (actor) { actor.nextAttackAt = patch.nextAttackAt; actor.eventCursor = patch.eventCursor; }
  }
  for (const attack of plan.attacks) {
    const actor = battle.actors.find(candidate => candidate.id === attack.actorId);
    const target = battle.actors.find(candidate => candidate.id === attack.targetId);
    const owner = actor && battle.actors.find(candidate => candidate.id === actor.ownerId);
    if (!actor || !isSummon(actor) || !living(actor) || !owner || !living(owner) || disabled(actor) || actor.statuses.sabotage > EPSILON
      || !target || !living(target) || target.statuses.stasis > EPSILON || !opponents(battle, actor).some(candidate => candidate.id === target.id)) continue;
    battle.actionCount++;
    emit(battle, { type: 'action', actorId: actor.id, ownerId: actor.ownerId, actionId: 'summonPulse', powerActionId: actor.actionId,
      targetId: target.id, message: `${actor.name} intervient.` });
    const damage = applyDamage(battle, actor, target, attack.rawDamage, { actionId: 'summonPulse', ignoreCover: attack.ignoreCover });
    if (damage > EPSILON) {
      if (attack.breakCover) target.cover = false;
      if (attack.staggerDuration > 0 && !protectedTarget(target)) applyControl(battle, actor, target, 'stagger', attack.staggerDuration);
    }
  }
  retireSummons(battle, plan.retirements);
  cleanupSummons(battle);
}

function normalizeActor(input, team, index) {
  const maxHp = Math.max(1, finite(input.maxHp, finite(input.hp, 100)));
  const maxShield = Math.max(0, finite(input.maxShield, finite(input.shield, 40)));
  const clipWeapon = input.weaponSystem === 'thermal-clip';
  const profile = getUniverseWeaponProfile(input.weaponProfileId);
  const thermalClip = profile ? profile.weaponSystem === 'thermal-clip' : clipWeapon;
  const magazineCapacity = Math.floor(clamp(finite(input.magazineCapacity, profile?.magazineCapacity ?? 8), 1, 200));
  const grenadeCapacity = Math.floor(clamp(finite(input.grenadeCapacity, 0), 0, 12));
  const powers = [...new Set(Array.isArray(input.powers) ? input.powers : [])].filter(id => ACTIONS[id]);
  const actor = {
    ...input,
    id: String(input.id ?? `${team}-${index}`),
    name: String(input.name ?? (team === 'party' ? 'Commando' : 'Adversaire')),
    team,
    hp: clamp(finite(input.hp, maxHp), 0, maxHp),
    maxHp,
    shield: clamp(finite(input.shield, maxShield), 0, maxShield),
    maxShield,
    attack: Math.max(1, finite(input.attack, team === 'party' ? 22 : 17)),
    defense: Math.max(0, finite(input.defense, 3)),
    speed: clamp(finite(input.speed, 1), 0.1, 5),
    powers,
    allowedAmmoProfileIds: UNIVERSE_AMMO_PROFILES.filter(profile => profile.mediaId === input.mediaId && powers.includes(profile.actionId)).map(profile => profile.id),
    ammoModeId: null,
    atb: clamp(finite(input.atb, 0), 0, 100),
    heat: thermalClip ? 0 : clamp(finite(input.heat, 0), 0, 100),
    focus: clamp(finite(input.focus, 0), 0, 100),
    overheated: !thermalClip && (Boolean(input.overheated) || input.heat >= 100),
    ...(profile ? { weaponProfileId: profile.id, weaponType: profile.weaponType, weaponSystem: profile.weaponSystem } : {}),
    ...(thermalClip ? { weaponSystem: 'thermal-clip', magazineCapacity,
      ammo: Math.floor(clamp(finite(input.ammo, magazineCapacity), 0, magazineCapacity)),
      reserveAmmo: Math.floor(clamp(finite(input.reserveAmmo, profile?.reserveAmmo ?? 0), 0, 10000)) } : {}),
    grenadeCapacity, grenadeCharges: Math.floor(clamp(finite(input.grenadeCharges, 0), 0, grenadeCapacity)),
    channel: null,
    cover: Boolean(input.cover),
    cooldowns: { ...input.cooldowns },
    statuses: { ...input.statuses },
    controlResistance: clamp(finite(input.controlResistance, 0), 0, 1),
    weaponHeatMultiplier: clamp(finite(input.weaponHeatMultiplier, 1), .25, 3),
    weaponCoolingBonus: clamp(finite(input.weaponCoolingBonus, 0), 0, 20),
    organicDamageBonus: clamp(finite(input.organicDamageBonus, 0), 0, 1),
    syntheticDamageBonus: clamp(finite(input.syntheticDamageBonus, 0), 0, 1),
    shieldBypass: clamp(finite(input.shieldBypass, 0), 0, .75),
    bioticMultiplier: clamp(finite(input.bioticMultiplier, 1), .05, 10),
    techMultiplier: clamp(finite(input.techMultiplier, 1), .05, 10),
    weaponDamageMultiplier: clamp(finite(input.weaponDamageMultiplier, 1), .1, 3),
    primaryAction: ['strike', 'acid'].includes(input.primaryAction) ? input.primaryAction : 'shoot',
    lastDamagedAt: -Infinity,
    _warpSource: null,
    _acidSource: null,
    _burnSource: null,
    _burnActionId: 'incinerate',
    _burnDamagePerSecond: 5,
    _burnTechAmplified: true,
    _reaveSource: null,
    _slamSource: null,
    _slamDamage: 0,
    fortificationShield: 0,
    cryoStacks: 0,
  };
  if (profile?.weaponSystem === 'heat') {
    delete actor.ammo; delete actor.reserveAmmo; delete actor.magazineCapacity;
  }
  const ammoMode = validateAmmoMode(actor, input.ammoModeId ?? null);
  actor.ammoModeId = ammoMode.ok ? ammoMode.ammoModeId : null;
  return actor;
}

/** Creates a fresh battle without changing the supplied actor definitions. */
export function createBattle({ party, enemies, difficulty = 'normal', mode = 'wait', seed = 1, rng, medigel = 3 } = {}) {
  if (!Array.isArray(party) || !party.length || !Array.isArray(enemies) || !enemies.length) {
    throw new TypeError('Un combat nécessite au moins un allié et un adversaire.');
  }
  const actors = [
    ...party.map((actor, index) => normalizeActor(actor, 'party', index)),
    ...enemies.map((actor, index) => normalizeActor(actor, 'enemy', index)),
  ];
  if (new Set(actors.map(actor => actor.id)).size !== actors.length) {
    throw new TypeError('Chaque combattant doit avoir un identifiant unique.');
  }
  const battle = {
    actors,
    difficulty: DIFFICULTY[difficulty] ? difficulty : 'normal',
    mode: mode === 'active' ? 'active' : 'wait',
    seed,
    medigel: Math.max(0, Math.floor(finite(medigel, 3))),
    log: [],
    events: [],
    winner: null,
    elapsed: 0,
    waiting: false,
    actionCount: 0,
    _rng: typeof rng === 'function' ? rng : makeRandom(seed),
  };
  emit(battle, { type: 'start', message: 'Contact hostile. Le commando attend vos ordres.' });
  updateWinner(battle);
  battle.waiting = waitingForDecision(battle);
  return battle;
}

function updateWinner(battle) {
  if (battle.winner) return battle.winner;
  cleanupSummons(battle);
  const partyAlive = battle.actors.some(actor => actor.team === 'party' && isVictoryParticipant(actor) && living(actor));
  const enemyAlive = battle.actors.some(actor => actor.team === 'enemy' && isVictoryParticipant(actor) && living(actor));
  if (!partyAlive || !enemyAlive) {
    // A launched explosive survives its shooter. Resolve dangerous flights
    // before declaring the outcome; ordinary ME1 encounters have no queue.
    if (dangerousProjectiles(battle)) return null;
    for (const actor of battle.actors) stopChannel(battle, actor, 'combat terminé');
    battle.winner = partyAlive ? 'party' : 'enemy';
    battle.waiting = false;
    emit(battle, {
      type: 'victory', winner: battle.winner,
      message: battle.winner === 'party' ? 'Zone sécurisée. Victoire du commando.' : 'Le commando est hors combat.',
    });
  }
  return battle.winner;
}

function dangerousProjectiles(battle) {
  return battle.projectiles?.some(projectile => battle.actors.some(actor => living(actor) && actor.team === projectile.targetTeam)) || false;
}

function waitingForDecision(battle) {
  const settling = dangerousProjectiles(battle) && ['party', 'enemy'].some(team => !battle.actors.some(actor => actor.team === team && isVictoryParticipant(actor) && living(actor)));
  return battle.mode === 'wait' && !settling && battle.actors.some(actor => actor.team === 'party' && ready(actor));
}

function opponents(battle, actor) {
  const hacked = actor.statuses.hacked > EPSILON || actor.statuses.dominated > EPSILON;
  return battle.actors.filter(target => target.id !== actor.id && living(target)
    && (hacked ? target.team === actor.team : target.team !== actor.team));
}

function friends(battle, actor) {
  return battle.actors.filter(target => target.team === actor.team && !isSummon(target));
}

function actionIds(actor) {
  if (isSummon(actor)) return [];
  const organic = actor.primaryAction === 'strike' || actor.primaryAction === 'acid';
  const ids = organic ? [actor.primaryAction, 'cover', 'reposition'] : [...BASE_ACTIONS];
  if (!organic && usesClips(actor)) ids.push('reload');
  if (actor.channel) ids.push('cancelChannel');
  if (actor.team === 'party') ids.push('medigel');
  ids.push(...actor.powers.filter(id => !BASE_ACTIONS.includes(id) && !['medigel', 'signature', 'reload', 'cancelChannel', 'ammoOff'].includes(id)
    && (!AMMO_ACTIONS.has(id) || getAmmoActionProfile(actor.mediaId, id))));
  if (actor.ammoModeId) ids.push('ammoOff');
  if (actor.team === 'party' && !organic) ids.push('signature');
  return [...new Set(ids)];
}

const EXPOSED_CONTROL_ACTIONS = new Set(['pull', 'cryoBlast', 'slam', 'dominate']);
const RESTRICTED_ACTIONS = new Set([...EXPOSED_CONTROL_ACTIONS, 'energyDrain']);
function futureTargetReason(target, actionId) {
  if (EXPOSED_CONTROL_ACTIONS.has(actionId)) {
    if (protectedTarget(target)) return 'Retirez les boucliers avant ce contrôle.';
    if (target.statuses.stasis > EPSILON) return 'La stase protège cette cible contre le contrôle.';
    if (target.controlImmune || target.controlResistance >= 1) return 'Cette cible est immunisée au contrôle.';
  }
  if (actionId === 'cryoBlast' && target.freezeImmune) return 'Cette cible est immunisée au gel.';
  if (actionId === 'dominate' && (synthetic(target) || target.dominateImmune)) return 'Domination exige un organique non immunisé.';
  if (actionId === 'energyDrain' && !synthetic(target) && !protectedTarget(target)) return 'Drain d’énergie exige des boucliers ou un synthétique.';
  return null;
}

function unavailableReason(battle, actor, actionId) {
  const action = ACTIONS[actionId];
  if (battle.winner) return 'Le combat est terminé.';
  if (!living(actor)) return 'Ce personnage est hors combat.';
  if (disabled(actor)) return actor.statuses.stasis > 0 ? 'Ce personnage est en stase.' : 'Ce personnage est immobilisé.';
  if (actionId === 'cancelChannel') return actor.channel ? null : 'Aucune canalisation en cours.';
  if (actor.channel) return 'Canalisation en cours.';
  if (actor.atb < 100 - EPSILON) return 'La jauge ATB doit être pleine.';
  if (actor.cooldowns[actionId] > EPSILON) return `Recharge : ${Math.ceil(actor.cooldowns[actionId])} s.`;
  if (AMMO_ACTIONS.has(actionId) || actionId === 'ammoOff') {
    const profile = getAmmoActionProfile(actor.mediaId, actionId);
    const check = canActivateAmmoProfile(actor, actionId === 'ammoOff' ? null : profile?.id);
    if (!check.ok) return check.reason;
  }
  if (SUMMON_ACTIONS.has(actionId)) {
    const profile = getSummonProfile(actor.mediaId, actionId);
    if (!profile) return 'Ce soutien ne correspond pas à cette œuvre.';
    const targetId = profile.target === 'self' ? actor.id : opponents(battle, actor).find(target => !(target.statuses.stasis > EPSILON))?.id;
    const plan = summonPlan(battle, actor, actionId, targetId);
    if (!plan.ok) return plan.reason;
  }
  if (WEAPON_ACTIONS.has(actionId)) {
    if (actor.statuses.sabotage > EPSILON) return 'L’arme est neutralisée par Sabotage.';
    if (usesClips(actor) && actor.ammo < weaponAmmoCost(actor, actionId)) return 'Chargeur insuffisant : recharger ou utiliser un pouvoir.';
    if (!usesClips(actor) && actor.overheated) return 'Arme en surchauffe : attendre le refroidissement.';
  }
  if (actionId === 'reload' && (!usesClips(actor) || actor.ammo >= actor.magazineCapacity)) return 'Le chargeur est déjà plein.';
  if (actionId === 'reload' && actor.reserveAmmo < 1) return 'Aucune munition en réserve.';
  if (actionId === 'signature' && actor.focus < 100 - EPSILON) return 'Concentration insuffisante (100 requis).';
  if (action.grenadeCost && actor.grenadeCharges < action.grenadeCost) return 'Aucun échantillon de grenade disponible.';
  if (actionId === 'medigel') {
    if (battle.medigel < 1) return 'Plus de médi-gel.';
    if (!friends(battle, actor).some(target => living(target) && target.hp < target.maxHp - EPSILON)) return 'Aucun allié conscient à soigner.';
  }
  if (actionId === 'unity' && !friends(battle, actor).some(target => !living(target))) return 'Aucun équipier hors combat.';
  if (actionId === 'sabotage' && !opponents(battle, actor).some(armed)) return 'Aucune arme adverse à saboter.';
  if (action.syntheticOnly && !opponents(battle, actor).some(target => synthetic(target) && !target.hackImmune)) return 'Aucune cible synthétique piratable.';
  if (RESTRICTED_ACTIONS.has(actionId) && !opponents(battle, actor).some(target => !futureTargetReason(target, actionId))) return 'Aucune cible compatible avec ce pouvoir.';
  if ((action.target === 'enemy' || action.target === 'enemies') && !opponents(battle, actor).length) return 'Aucune cible valide.';
  return null;
}

/** UI-ready action metadata. Untrained powers are omitted, unavailable actions carry a reason. */
export function getActions(battle, actorId) {
  const actor = battle.actors.find(candidate => candidate.id === actorId);
  if (!actor) return [];
  return actionIds(actor).map(id => {
    const reason = unavailableReason(battle, actor, id);
    const profile = WEAPON_ACTIONS.has(id) ? weaponProfile(actor) : null;
    const clipShot = WEAPON_ACTIONS.has(id) && usesClips(actor);
    const heatCost = WEAPON_ACTIONS.has(id) && !clipShot ? ACTIONS[id].heatCost * actor.weaponHeatMultiplier : undefined;
    let description = clipShot ? `${ACTIONS[id].label} : consomme ${weaponAmmoCost(actor, id)} munition(s) du chargeur. Rechargement par remplacement du clip thermique.` : heatCost === undefined ? powerDescription(actor, id)
      : ACTIONS[id].description.replace(/(?:24|48|42) points de chaleur/, `${Math.round(heatCost * 10) / 10} points de chaleur`);
    if (profile) description = `${profile.mechanicNote} ${profile.mode === 'clip-channel' ? `${profile.ammoPerTick} munition par impulsion, au maximum ${Math.ceil(profile.duration / profile.tickInterval)} impulsions.` : ''}`;
    return { id, ...ACTIONS[id], ...(clipShot ? { heatCost: 0, ammoCost: weaponAmmoCost(actor, id) } : heatCost === undefined ? {} : { heatCost }),
      ...(profile?.mode === 'heat-beam' ? { heatCost: profile.heatPerSecond * profile.duration * actor.weaponHeatMultiplier, channelDuration: profile.duration } : {}),
      ...(profile?.mode === 'clip-channel' ? { channelDuration: profile.duration } : {}),
      description, available: !reason, reason, cooldownRemaining: actor.cooldowns[id] || 0 };
  });
}

function applyDamage(battle, source, target, rawAmount, { ignoreCover = false, ignoreArmor = false, shieldOnly = false, silent = false, actionId = null } = {}) {
  if (!living(target) || rawAmount <= 0) return 0;
  if (target.statuses.stasis > EPSILON) {
    if (!silent) emit(battle, { type: 'blocked', actorId: source?.id, targetId: target.id, actionId, amount: 0, message: `${target.name} est protégé par la stase.` });
    return 0;
  }
  const ammoModifiers = getAmmoHitModifiers(source, target, actionId);
  const activeAmmo = ammoModifiers.profileId !== null;
  let amount = rawAmount * (source?.team === 'enemy' ? DIFFICULTY[battle.difficulty].enemyDamage : 1);
  if (target.cover && !ignoreCover) amount *= activeAmmo ? 1 - .5 * ammoModifiers.coverMultiplier : .5;
  if (target.statuses.barrier > EPSILON) amount *= 0.7;
  if (target.statuses.fortification > EPSILON && target.mediaId !== 'ME2') amount *= .75;
  if (target.statuses.reaveGuard > EPSILON) amount *= .85;
  if (target.statuses.frozen > EPSILON && WEAPON_ACTIONS.has(actionId)) amount *= 1.15;
  // Ammunition bypass splits one hit between shield and health; damage is
  // never duplicated and armor is applied once to the health portion.
  const bypass = WEAPON_ACTIONS.has(actionId) && !shieldOnly ? source?.shieldBypass || 0 : 0;
  const shieldMultiplier = activeAmmo ? ammoModifiers.shieldMultiplier : 1;
  const temporaryShieldDamage = target.statuses.fortification > EPSILON
    ? Math.min(target.fortificationShield, amount * (1 - bypass) * shieldMultiplier) : 0;
  target.fortificationShield -= temporaryShieldDamage;
  const shieldDamage = activeAmmo
    ? Math.min(target.shield, Math.max(0, amount * (1 - bypass) - temporaryShieldDamage / shieldMultiplier) * shieldMultiplier)
    : Math.min(target.shield, Math.max(0, amount * (1 - bypass) - temporaryShieldDamage));
  target.shield = Math.max(0, target.shield - shieldDamage);
  const armor = ignoreArmor ? 0 : target.defense * (target.statuses.warp > EPSILON ? 0.5 : 1) * (activeAmmo ? ammoModifiers.defenseMultiplier : 1);
  const remaining = activeAmmo ? Math.max(0, amount - shieldDamage / shieldMultiplier - temporaryShieldDamage / shieldMultiplier)
    : Math.max(0, amount - shieldDamage - temporaryShieldDamage);
  // A small simulation slice must not turn a fractional damage-over-time tick
  // into a whole hit point. The one-point armor floor applies only to hits >= 1.
  const healthDamage = shieldOnly || remaining <= 0 ? 0 : Math.min(target.hp,
    Math.max(Math.min(1, remaining), remaining - armor) * (activeAmmo ? ammoModifiers.healthMultiplier : 1));
  target.hp = Math.max(0, target.hp - healthDamage);
  const total = shieldDamage + temporaryShieldDamage + healthDamage;
  if (total > EPSILON) {
    target.lastDamagedAt = battle.elapsed;
    target.focus = clamp(target.focus + total * 0.12, 0, 100);
    if (source && source.id !== target.id) source.focus = clamp(source.focus + total * 0.35, 0, 100);
    if (!silent) emit(battle, {
      type: 'damage', actorId: source?.id, targetId: target.id, actionId,
      amount: total, shieldDamage: shieldDamage + temporaryShieldDamage, healthDamage,
      ...(temporaryShieldDamage > 0 ? { temporaryShieldDamage } : {}),
      ...(activeAmmo ? { ammoProfileId: ammoModifiers.profileId } : {}),
      message: `${target.name} subit ${Math.round(total)} dégâts${shieldDamage + temporaryShieldDamage > 0 ? ` (${Math.round(shieldDamage + temporaryShieldDamage)} sur les boucliers)` : ''}.`,
    });
  }
  if (!living(target)) {
    stopChannel(battle, target, 'hors combat');
    target.hp = 0;
    target.atb = 0;
    target.cover = false;
    target.statuses = {};
    target.cryoStacks = 0;
    emit(battle, { type: 'defeat', actorId: source?.id, targetId: target.id, message: `${target.name} est hors combat.` });
  }
  if (source && healthDamage > EPSILON && living(target)) {
    const effect = getAmmoPostHit(source, target, actionId, { healthDamage, shieldDamage: shieldDamage + temporaryShieldDamage });
    if (effect) applyAmmoPostHit(battle, source, target, effect);
  }
  return total;
}

function applyAmmoPostHit(battle, source, target, effect) {
  if (effect.kind === 'burn') {
    if (target.burnImmune) return;
    const previousSource = battle.actors.find(actor => actor.id === target._burnSource);
    const previousRate = target._burnDamagePerSecond * (target._burnTechAmplified ? powerMultiplier(previousSource, 'incinerate') : 1);
    if (target.statuses.burning > EPSILON && previousRate > effect.damagePerSecond) return;
    target.statuses.burning = effect.duration;
    target._burnSource = source.id; target._burnActionId = 'ammoIncendiary';
    target._burnDamagePerSecond = effect.damagePerSecond; target._burnTechAmplified = false;
    delete target.statuses.frozen;
    emit(battle, { type: 'status', actorId: source.id, targetId: target.id, status: 'burning', duration: effect.duration, ammoModeId: source.ammoModeId });
  } else if (effect.kind === 'cryo') {
    target.cryoStacks = clamp((target.cryoStacks || 0) + effect.stacks, 0, effect.threshold);
    emit(battle, { type: 'cryoBuildup', actorId: source.id, targetId: target.id, stacks: target.cryoStacks, threshold: effect.threshold });
    if (target.cryoStacks >= effect.threshold) {
      target.cryoStacks = 0;
      applyControl(battle, source, target, 'frozen', effect.freezeDuration);
    }
  }
}

function applyControl(battle, source, target, status, duration) {
  if (!living(target) || target.statuses.stasis > EPSILON) return false;
  const actual = target.controlImmune ? 0 : duration * (1 - target.controlResistance);
  if (actual < 0.1) {
    emit(battle, { type: 'resist', actorId: source.id, targetId: target.id, status, message: `${target.name} résiste au contrôle.` });
    return false;
  }
  target.statuses[status] = Math.max(target.statuses[status] || 0, actual);
  if (DISABLING_STATUSES.includes(status) || status === 'sabotage') stopChannel(battle, target, 'contrôle');
  if (status !== 'hacked' && status !== 'sabotage') target.cover = false;
  emit(battle, { type: 'status', actorId: source.id, targetId: target.id, status, duration: actual });
  return true;
}

function timedEffect(battle, source, target, status, duration) {
  if (!living(target) || target.statuses.stasis > EPSILON) return false;
  target.statuses[status] = Math.max(target.statuses[status] || 0, duration);
  emit(battle, { type: 'status', actorId: source.id, targetId: target.id, status, duration });
  return true;
}

function restoreShield(battle, source, amount, actionId, actorId = source.id) {
  const restored = Math.max(0, Math.min(source.maxShield - source.shield, amount));
  if (restored <= EPSILON || !living(source)) return 0;
  source.shield += restored;
  emit(battle, { type: 'shield', actorId, targetId: source.id, amount: restored, actionId });
  return restored;
}

function reaveHealing(battle, source, target, healthDamage) {
  if (!source || source.mediaId !== 'ME2' || !living(source) || synthetic(target)) return;
  const amount = Math.max(0, Math.min(source.maxHp - source.hp, healthDamage * .5));
  if (amount <= EPSILON) return;
  source.hp += amount;
  emit(battle, { type: 'heal', actorId: source.id, targetId: source.id, amount, actionId: 'reave' });
}

function stopChannel(battle, actor, reason) {
  if (!actor.channel) return;
  const channel = actor.channel;
  actor.channel = null;
  emit(battle, { type: 'channelEnd', actorId: actor.id, targetId: channel.targetId, actionId: channel.actionId,
    weaponProfileId: channel.weaponProfileId, reason });
}

function queueProjectile(battle, actor, target, actionId, baseDamage, delay, splashRatio, profileId = null, weaponAttack = false) {
  battle.projectiles ||= [];
  battle.projectiles.push({ actorId: actor.id, targetId: target.id, targetTeam: target.team, actionId,
    weaponProfileId: profileId, remaining: delay, baseDamage, splashRatio, weaponAttack });
  emit(battle, { type: 'projectile', actorId: actor.id, targetId: target.id, actionId, weaponProfileId: profileId, remaining: delay });
}

function areaImpact(battle, actor, targetId, targetTeam, actionId, baseDamage, splashRatio, weaponAttack = false, profileId = null) {
  emit(battle, { type: 'explosion', actorId: actor.id, targetId, actionId, weaponProfileId: profileId });
  for (const target of battle.actors.filter(candidate => candidate.id !== actor.id && candidate.team === targetTeam && living(candidate))) {
    const ammunition = weaponAttack ? 1 + (synthetic(target) ? actor.syntheticDamageBonus : actor.organicDamageBonus) : 1;
    applyDamage(battle, actor, target, baseDamage * (target.id === targetId ? 1 : splashRatio) * ammunition,
      { actionId, ignoreCover: true });
  }
}

function tickProjectiles(battle, dt) {
  if (!battle.projectiles?.length) return;
  const pending = [];
  for (const projectile of battle.projectiles) {
    projectile.remaining = Math.max(0, projectile.remaining - dt);
    if (projectile.remaining > EPSILON) pending.push(projectile);
    else {
      const actor = battle.actors.find(candidate => candidate.id === projectile.actorId);
      if (actor) areaImpact(battle, actor, projectile.targetId, projectile.targetTeam, projectile.actionId,
        projectile.baseDamage, projectile.splashRatio, projectile.weaponAttack, projectile.weaponProfileId);
    }
  }
  battle.projectiles = pending;
}

function tickChannel(battle, actor, dt) {
  const channel = actor.channel;
  if (!channel) return 0;
  const target = battle.actors.find(candidate => candidate.id === channel.targetId);
  const profile = getUniverseWeaponProfile(channel.weaponProfileId);
  if (!living(actor) || disabled(actor) || actor.statuses.sabotage > EPSILON || !target || !living(target) || !profile) {
    stopChannel(battle, actor, 'interruption'); return 0;
  }
  const activeTime = Math.min(dt, channel.remaining);
  channel.remaining = Math.max(0, channel.remaining - activeTime);
  channel.untilNextPulse -= activeTime;
  while (channel.untilNextPulse <= EPSILON && channel.remainingTicks > 0 && actor.channel) {
    if (profile.mode === 'clip-channel' && actor.ammo < profile.ammoPerTick) { stopChannel(battle, actor, 'chargeur vide'); break; }
    const ammunition = 1 + (synthetic(target) ? actor.syntheticDamageBonus : actor.organicDamageBonus);
    applyDamage(battle, actor, target, channel.baseDamage / channel.totalTicks * ammunition,
      { actionId: channel.actionId, ignoreCover: channel.ignoreCover });
    if (profile.mode === 'clip-channel') actor.ammo -= profile.ammoPerTick;
    else addHeat(battle, actor, profile.heatPerSecond * profile.tickInterval * actor.weaponHeatMultiplier);
    channel.remainingTicks--;
    channel.untilNextPulse += profile.tickInterval;
    emit(battle, { type: 'channelPulse', actorId: actor.id, targetId: target.id, actionId: channel.actionId,
      weaponProfileId: profile.id, remainingTicks: channel.remainingTicks, ...(usesClips(actor) ? { ammo: actor.ammo } : { heat: actor.heat }) });
    if (!living(target) || actor.overheated || (usesClips(actor) && actor.ammo < profile.ammoPerTick && channel.remainingTicks > 0)) {
      stopChannel(battle, actor, actor.overheated ? 'surchauffe' : !living(target) ? 'cible hors combat' : 'chargeur vide');
    }
  }
  if (actor.channel && (channel.remaining <= EPSILON || channel.remainingTicks <= 0)) stopChannel(battle, actor, 'terminé');
  return activeTime;
}

function addHeat(battle, actor, amount) {
  actor.heat = clamp(actor.heat + amount, 0, 100);
  if (actor.heat >= 100 - EPSILON) {
    actor.overheated = true;
    emit(battle, { type: 'overheat', actorId: actor.id, message: `L’arme de ${actor.name} surchauffe.` });
  }
}

function resolveTargets(battle, actor, actionId, targetId) {
  const definition = ACTIONS[actionId];
  const target = targetId == null ? null : battle.actors.find(candidate => candidate.id === targetId);
  if (definition.target === 'self') {
    if (targetId != null && targetId !== actor.id) return { error: 'Cette action vise son utilisateur.' };
    return { targets: [actor] };
  }
  if (definition.target === 'allies') return { targets: friends(battle, actor) };
  if (definition.target === 'ally') {
    const ally = target ?? (targetId == null ? actor : null);
    if (!ally || isSummon(ally) || ally.team !== actor.team || !living(ally)) return { error: 'Choisissez un allié conscient.' };
    if (ally.hp >= ally.maxHp - EPSILON) return { error: 'Cet allié est déjà en pleine santé.' };
    return { targets: [ally] };
  }
  const candidates = opponents(battle, actor);
  if (definition.target === 'enemies') {
    if (targetId != null && !candidates.some(candidate => candidate.id === targetId)) return { error: 'Cible adverse invalide.' };
    return { targets: candidates };
  }
  if (!target || !candidates.some(candidate => candidate.id === target.id)) return { error: 'Choisissez un adversaire vivant.' };
  if (definition.syntheticOnly && !synthetic(target)) return { error: 'Piratage d’IA exige une cible synthétique.' };
  if (definition.syntheticOnly && target.hackImmune) return { error: 'Les systèmes de cette cible résistent au piratage.' };
  if (actionId === 'sabotage' && !armed(target)) return { error: 'Cette créature n’utilise aucune arme à saboter.' };
  const restriction = futureTargetReason(target, actionId);
  if (restriction) return { error: restriction };
  return { targets: [target] };
}

/** Validates first; a rejected order never spends ATB, inventory, heat or randomness. */
export function performAction(battle, { actorId, actionId, targetId } = {}) {
  const actor = battle.actors.find(candidate => candidate.id === actorId);
  if (!actor || !ACTIONS[actionId] || !actionIds(actor).includes(actionId)) return { ok: false, reason: 'Action inconnue ou non maîtrisée.', events: [] };
  const reason = unavailableReason(battle, actor, actionId);
  if (reason) return { ok: false, reason, events: [] };
  const resolution = resolveTargets(battle, actor, actionId, targetId);
  if (resolution.error) return { ok: false, reason: resolution.error, events: [] };
  const targets = resolution.targets;
  const target = targets[0];
  const deployment = SUMMON_ACTIONS.has(actionId) ? summonPlan(battle, actor, actionId, target?.id) : null;
  if (deployment && !deployment.ok) return { ok: false, reason: deployment.reason, events: [] };
  const ammoSelection = AMMO_ACTIONS.has(actionId) || actionId === 'ammoOff'
    ? activateAmmoProfile(actor, actionId === 'ammoOff' ? null : getAmmoActionProfile(actor.mediaId, actionId)?.id) : null;
  if (ammoSelection && !ammoSelection.ok) return { ok: false, reason: ammoSelection.reason, events: [] };
  const startIndex = battle.events.length;
  const definition = ACTIONS[actionId];
  if (actionId !== 'cancelChannel') actor.atb = 0;
  if (actionId !== 'cover') actor.cover = false;
  if (definition.cooldown) actor.cooldowns[actionId] = definition.cooldown;
  battle.actionCount += 1;
  emit(battle, { type: 'action', actorId, actionId, targetId: target?.id, targetIds: targets.map(candidate => candidate.id), message: `${actor.name} : ${definition.label}.` });

  if (WEAPON_ACTIONS.has(actionId)) {
    const multiplier = actionId === 'burst' ? 1.65 : actionId === 'signature' ? 2.4 : 1;
    const profile = weaponProfile(actor);
    if (profile) {
      const baseDamage = actor.attack * actor.weaponDamageMultiplier * multiplier * (0.94 + random(battle) * .12);
      if (['heat-beam', 'clip-channel'].includes(profile.mode)) {
        const totalTicks = Math.ceil(profile.duration / profile.tickInterval);
        actor.channel = { actorId, targetId: target.id, actionId, weaponProfileId: profile.id,
          remaining: profile.duration, remainingTicks: totalTicks, totalTicks, untilNextPulse: profile.tickInterval,
          baseDamage: baseDamage * profile.duration, ignoreCover: actor.statuses.flanking > EPSILON || actionId === 'signature' };
        emit(battle, { type: 'channelStart', actorId, targetId: target.id, actionId, weaponProfileId: profile.id, duration: profile.duration });
      } else if (profile.mode === 'delayed-area') {
        queueProjectile(battle, actor, target, actionId, baseDamage, profile.delay, profile.splashRatio, profile.id, true);
        actor.ammo -= ammoCost(actionId);
        emit(battle, { type: 'ammo', actorId, ammo: actor.ammo, reserveAmmo: actor.reserveAmmo });
      } else if (profile.mode === 'heat-burst') {
        for (let hit = 0; hit < profile.burstCount && living(target); hit++) {
          const ammunition = 1 + (synthetic(target) ? actor.syntheticDamageBonus : actor.organicDamageBonus);
          applyDamage(battle, actor, target, baseDamage / profile.burstCount * ammunition,
            { actionId, ignoreCover: actor.statuses.flanking > EPSILON || actionId === 'signature' });
        }
        addHeat(battle, actor, profile.heatCost * definition.heatCost / ACTIONS.shoot.heatCost * actor.weaponHeatMultiplier);
        emit(battle, { type: 'weaponBurst', actorId, targetId: target.id, actionId, weaponProfileId: profile.id, count: profile.burstCount });
      }
    } else {
      const speciesBonus = synthetic(target) ? actor.syntheticDamageBonus : actor.organicDamageBonus;
      const damage = actor.attack * actor.weaponDamageMultiplier * multiplier * (1 + speciesBonus) * (0.94 + random(battle) * 0.12);
      applyDamage(battle, actor, target, damage, { actionId, ignoreCover: actor.statuses.flanking > EPSILON || actionId === 'signature' });
      if (usesClips(actor)) {
        actor.ammo -= ammoCost(actionId);
        emit(battle, { type: 'ammo', actorId, ammo: actor.ammo, reserveAmmo: actor.reserveAmmo });
      } else addHeat(battle, actor, definition.heatCost * actor.weaponHeatMultiplier);
    }
    delete actor.statuses.flanking;
    if (actionId === 'signature') actor.focus = 0;
  } else if (deployment) {
    retireSummons(battle, deployment.retireIds.map(actorId => ({ actorId, reason: 'replaced' })));
    const summoned = normalizeActor(deployment.actor, actor.team, battle.actors.length);
    battle.actors.push(summoned);
    battle.nextSummonSerial = deployment.nextSerial;
    emit(battle, { type: 'summon', actorId: actor.id, ownerId: actor.id, targetId: summoned.id, actionId,
      summonId: summoned.id, expiresAt: summoned.expiresAt, message: `${actor.name} déploie ${summoned.name}.` });
  } else if (ammoSelection) {
    actor.ammoModeId = ammoSelection.ammoModeId;
    emit(battle, { type: 'ammoMode', actorId, actionId, ammoModeId: actor.ammoModeId, replacedProfileId: ammoSelection.replacedProfileId,
      message: actor.ammoModeId ? `${actor.name} change de mode de munitions.` : `${actor.name} désactive son mode de munitions.` });
  } else if (actionId === 'cancelChannel') {
    stopChannel(battle, actor, 'annulation volontaire');
  } else if (actionId === 'reload') {
    const amount = Math.min(actor.magazineCapacity - actor.ammo, actor.reserveAmmo);
    actor.ammo += amount;
    actor.reserveAmmo -= amount;
    emit(battle, { type: 'reload', actorId, amount, ammo: actor.ammo, reserveAmmo: actor.reserveAmmo, message: `${actor.name} recharge son arme.` });
  } else if (actionId === 'strike') {
    applyDamage(battle, actor, target, actor.attack * (0.94 + random(battle) * 0.12), { actionId, ignoreCover: true });
  } else if (actionId === 'acid') {
    applyDamage(battle, actor, target, 6 + actor.attack * 0.65, { actionId });
    if (living(target) && !(target.statuses.stasis > EPSILON)) {
      target.statuses.corrosion = 5;
      target._acidSource = actor.id;
      emit(battle, { type: 'status', actorId, targetId: target.id, status: 'corrosion', duration: 5 });
    }
  } else if (actionId === 'cover') {
    actor.cover = true;
    actor.focus = clamp(actor.focus + 6, 0, 100);
  } else if (actionId === 'reposition') {
    actor.statuses.flanking = 8;
    actor.focus = clamp(actor.focus + 5, 0, 100);
  } else if (actionId === 'medigel') {
    const amount = Math.min(target.maxHp - target.hp, 38 + target.maxHp * 0.22);
    target.hp += amount;
    battle.medigel -= 1;
    actor.focus = clamp(actor.focus + 10, 0, 100);
    emit(battle, { type: 'heal', actorId, targetId: target.id, amount, message: `${target.name} récupère ${Math.round(amount)} points de santé.` });
  } else if (actionId === 'unity') {
    for (const ally of targets.filter(candidate => !living(candidate))) {
      ally.hp = ally.maxHp * 0.3;
      ally.shield = ally.maxShield * 0.25;
      ally.atb = 0;
      ally.statuses = {};
      ally.lastDamagedAt = battle.elapsed;
      emit(battle, { type: 'revive', actorId, targetId: ally.id, amount: ally.hp, message: `${ally.name} reprend le combat.` });
    }
  } else if (actionId === 'overload') {
    applyDamage(battle, actor, target, (34 + actor.attack * 0.8) * powerMultiplier(actor, actionId), { actionId, ignoreCover: true, ignoreArmor: true, shieldOnly: !synthetic(target) });
  } else if (actionId === 'sabotage') {
    if (applyControl(battle, actor, target, 'sabotage', 6 * powerMultiplier(actor, actionId)) && !usesClips(target)) addHeat(battle, target, 35 * powerMultiplier(actor, actionId));
  } else if (actionId === 'lift') {
    applyControl(battle, actor, target, 'lift', 4 * powerMultiplier(actor, actionId));
  } else if (actionId === 'throw') {
    const airborne = target.statuses.lift > EPSILON || target.statuses.singularity > EPSILON || target.statuses.pull > EPSILON || target.statuses.slam > EPSILON;
    applyDamage(battle, actor, target, (14 + actor.attack * 0.8) * (airborne ? 1.4 : 1) * powerMultiplier(actor, actionId), { actionId, ignoreCover: true });
    if (applyControl(battle, actor, target, 'stagger', 1.2 * powerMultiplier(actor, actionId))) {
      delete target.statuses.lift;
      delete target.statuses.singularity;
      delete target.statuses.pull;
      delete target.statuses.slam;
      target._slamDamage = 0;
    }
  } else if (actionId === 'warp') {
    applyDamage(battle, actor, target, (12 + actor.attack * 0.7) * powerMultiplier(actor, actionId), { actionId, ignoreCover: true });
    if (living(target) && !(target.statuses.stasis > EPSILON)) {
      target.statuses.warp = 6 * powerMultiplier(actor, actionId);
      target._warpSource = actor.id;
      emit(battle, { type: 'status', actorId, targetId: target.id, status: 'warp', duration: target.statuses.warp });
    }
  } else if (actionId === 'singularity') {
    for (const enemy of targets) applyControl(battle, actor, enemy, 'singularity', 3 * powerMultiplier(actor, actionId));
  } else if (actionId === 'barrier') {
    const amount = Math.min(actor.maxShield - actor.shield, (26 + actor.maxShield * 0.55) * powerMultiplier(actor, actionId));
    actor.shield += amount;
    actor.statuses.barrier = 8 * powerMultiplier(actor, actionId);
    emit(battle, { type: 'shield', actorId, targetId: actorId, amount });
  } else if (actionId === 'stasis') {
    applyControl(battle, actor, target, 'stasis', 6 * powerMultiplier(actor, actionId));
  } else if (actionId === 'hack') {
    applyControl(battle, actor, target, 'hacked', 8 * powerMultiplier(actor, actionId));
  } else if (actionId === 'pull') {
    applyControl(battle, actor, target, 'pull', effectDuration(actor, actionId, 3));
  } else if (actionId === 'incinerate') {
    const hit = applyDamage(battle, actor, target, (18 + actor.attack * .6) * powerMultiplier(actor, actionId), { actionId, ignoreCover: true, ignoreArmor: true });
    if (hit > EPSILON && !target.burnImmune && timedEffect(battle, actor, target, 'burning', effectDuration(actor, actionId, 5))) {
      target._burnSource = actor.id;
      target._burnActionId = actionId; target._burnDamagePerSecond = 5; target._burnTechAmplified = true;
      delete target.statuses.frozen;
    }
  } else if (actionId === 'cryoBlast') {
    applyControl(battle, actor, target, 'frozen', effectDuration(actor, actionId, 4));
  } else if (actionId === 'concussiveShot') {
    const frozen = target.statuses.frozen > EPSILON;
    const hit = applyDamage(battle, actor, target, (24 + actor.attack * .6) * (frozen ? 1.5 : 1), { actionId, ignoreCover: true });
    if (hit > EPSILON) {
      delete target.statuses.frozen;
      if (!protectedTarget(target)) applyControl(battle, actor, target, 'stagger', 1.1);
    }
  } else if (actionId === 'energyDrain') {
    const damage = applyDamage(battle, actor, target, (24 + actor.attack * .75) * powerMultiplier(actor, actionId), { actionId, ignoreCover: true, ignoreArmor: true, shieldOnly: !synthetic(target) });
    restoreShield(battle, actor, damage * .5, actionId);
  } else if (actionId === 'fortification') {
    actor.statuses.fortification = 10;
    actor.fortificationShield = actor.mediaId === 'ME2' ? clamp(30 + actor.maxShield * .35, 30, 250) : 0;
    emit(battle, { type: 'status', actorId, targetId: actorId, status: 'fortification', duration: 10, temporaryShield: actor.fortificationShield,
      message: actor.mediaId === 'ME2' ? `${actor.name} renforce sa protection temporaire.` : `${actor.name} réduit temporairement les dégâts reçus.` });
  } else if (actionId === 'reave') {
    const previousHp = target.hp;
    const damage = applyDamage(battle, actor, target, (10 + actor.attack * .35) * powerMultiplier(actor, actionId), { actionId, ignoreCover: true, ignoreArmor: true });
    reaveHealing(battle, actor, target, previousHp - target.hp);
    if (damage > EPSILON) {
      const duration = effectDuration(actor, actionId, 5);
      if (timedEffect(battle, actor, target, 'reave', duration)) target._reaveSource = actor.id;
      if (actor.mediaId === 'ME3') timedEffect(battle, actor, actor, 'reaveGuard', duration);
    }
  } else if (actionId === 'shockwave') {
    for (const enemy of targets) {
      const damage = applyDamage(battle, actor, enemy, (18 + actor.attack * .45) * powerMultiplier(actor, actionId), { actionId, ignoreCover: true });
      if (damage > EPSILON && !protectedTarget(enemy)) applyControl(battle, actor, enemy, 'stagger', effectDuration(actor, actionId, 1.3));
    }
  } else if (actionId === 'slam') {
    if (applyControl(battle, actor, target, 'slam', effectDuration(actor, actionId, .8))) {
      delete target.statuses.pull;
      target._slamSource = actor.id;
      target._slamDamage = (30 + actor.attack * .65) * powerMultiplier(actor, actionId);
    }
  } else if (actionId === 'dominate') {
    applyControl(battle, actor, target, 'dominated', effectDuration(actor, actionId, 8));
  } else if (actionId === 'fragGrenade' || actionId === 'stickyGrenade') {
    actor.grenadeCharges--;
    const damage = actionId === 'fragGrenade' ? 24 + actor.attack * .6 : 30 + actor.attack * .7;
    if (actionId === 'fragGrenade') areaImpact(battle, actor, target.id, target.team, actionId, damage, .5);
    else queueProjectile(battle, actor, target, actionId, damage, 1.2, .4);
    emit(battle, { type: 'grenade', actorId, targetId: target.id, actionId, grenadeCharges: actor.grenadeCharges });
  } else if (actionId === 'shieldBoost') {
    for (const ally of targets.filter(candidate => living(candidate) && candidate.maxShield > 0)) {
      restoreShield(battle, ally, 20 + ally.maxShield * .25, actionId, actor.id);
      ally.statuses.shieldBoost = 5;
      emit(battle, { type: 'status', actorId, targetId: ally.id, status: 'shieldBoost', duration: 5 });
    }
  }
  updateWinner(battle);
  battle.waiting = !battle.winner && waitingForDecision(battle);
  return { ok: true, reason: null, events: battle.events.slice(startIndex) };
}

function tickActor(battle, actor, dt) {
  if (!living(actor)) { stopChannel(battle, actor, 'hors combat'); return; }
  const stasisTime = Math.max(0, actor.statuses.stasis || 0);
  const warpTime = Math.max(0, actor.statuses.warp || 0);
  const acidTime = Math.max(0, actor.statuses.corrosion || 0);
  if (warpTime > EPSILON && stasisTime <= EPSILON) {
    const source = battle.actors.find(candidate => candidate.id === actor._warpSource);
    applyDamage(battle, source, actor, 4 * Math.min(dt, warpTime) * powerMultiplier(source, 'warp'), { actionId: 'warp', ignoreCover: true, ignoreArmor: true, silent: true });
  }
  if (living(actor) && acidTime > EPSILON && stasisTime <= EPSILON) {
    const source = battle.actors.find(candidate => candidate.id === actor._acidSource);
    applyDamage(battle, source, actor, 3 * Math.min(dt, acidTime), { actionId: 'acid', ignoreCover: true, ignoreArmor: true, silent: true });
  }
  for (const [status, sourceKey, actionId, rate] of [['burning', '_burnSource', actor._burnActionId, actor._burnDamagePerSecond], ['reave', '_reaveSource', 'reave', 6]]) {
    const duration = Math.max(0, actor.statuses[status] || 0);
    if (living(actor) && duration > EPSILON && stasisTime <= EPSILON) {
      const source = battle.actors.find(candidate => candidate.id === actor[sourceKey]);
      const previousHp = actor.hp;
      const amplifier = status === 'burning' && !actor._burnTechAmplified ? 1 : powerMultiplier(source, actionId);
      applyDamage(battle, source, actor, rate * Math.min(dt, duration) * amplifier, { actionId, ignoreCover: true, ignoreArmor: true, silent: true });
      if (actionId === 'reave') reaveHealing(battle, source, actor, previousHp - actor.hp);
    }
  }
  if (living(actor) && actor.statuses.slam > EPSILON && actor.statuses.slam <= dt + EPSILON && actor._slamDamage > 0) {
    const source = battle.actors.find(candidate => candidate.id === actor._slamSource);
    const damage = actor._slamDamage;
    actor._slamDamage = 0;
    applyDamage(battle, source, actor, damage, { actionId: 'slam', ignoreCover: true });
  }
  if (!living(actor)) return;
  const channelTime = tickChannel(battle, actor, dt);
  for (const key of Object.keys(actor.cooldowns)) {
    actor.cooldowns[key] = Math.max(0, finite(actor.cooldowns[key], 0) - dt);
    if (actor.cooldowns[key] <= EPSILON) delete actor.cooldowns[key];
  }
  for (const key of Object.keys(actor.statuses)) {
    actor.statuses[key] = Math.max(0, finite(actor.statuses[key], 0) - dt);
    if (actor.statuses[key] <= EPSILON) delete actor.statuses[key];
  }
  if (!(actor.statuses.fortification > EPSILON)) actor.fortificationShield = 0;
  actor.heat = Math.max(0, actor.heat - (dt - channelTime) * (9 + actor.weaponCoolingBonus));
  if (actor.overheated && actor.heat <= 35 + EPSILON) {
    actor.overheated = false;
    emit(battle, { type: 'cooled', actorId: actor.id, message: `L’arme de ${actor.name} est de nouveau opérationnelle.` });
  }
  const boosted = actor.statuses.shieldBoost > EPSILON;
  const shieldDelay = boosted ? 1 : actor.cover ? SHIELD_RECHARGE.coverDelay : SHIELD_RECHARGE.exposedDelay;
  const shieldRate = (actor.cover ? SHIELD_RECHARGE.coverRate : SHIELD_RECHARGE.exposedRate) + (boosted ? 6 : 0);
  if (battle.elapsed - actor.lastDamagedAt >= shieldDelay && actor.shield < actor.maxShield) {
    actor.shield = Math.min(actor.maxShield, actor.shield + dt * shieldRate);
  }
  if (!disabled(actor)) {
    const modifier = actor.team === 'enemy' ? DIFFICULTY[battle.difficulty].enemySpeed : 1;
    actor.atb = Math.min(100, actor.atb + dt * 20 * actor.speed * modifier);
  }
}

/** Enemy orders are deterministic for a given seed and decision sequence. */
export function autoEnemyActions(battle) {
  if (battle.winner) return battle;
  if (waitingForDecision(battle)) return battle;
  for (const actor of battle.actors.filter(candidate => candidate.team === 'enemy' && !isSummon(candidate))) {
    if (!ready(actor) || battle.winner) continue;
    const targets = opponents(battle, actor).filter(target => !(target.statuses.stasis > EPSILON));
    const actions = getActions(battle, actor.id).filter(action => action.available);
    const can = id => actions.some(action => action.id === id);
    // Sustained fire can breach one shield instead of distributing harmless
    // chip damage across the squad. Taking cover makes an actor less attractive.
    const roll = random(battle);
    const focusChance = DIFFICULTY[battle.difficulty].focusChance;
    const exposure = target => (target.hp + target.shield) / (target.maxHp + target.maxShield)
      + (target.cover ? 0.45 : 0) + (target.statuses.barrier > EPSILON ? 0.2 : 0);
    const target = roll < focusChance
      ? [...targets].sort((left, right) => exposure(left) - exposure(right))[0]
      : targets[Math.floor((roll - focusChance) / (1 - focusChance) * targets.length)];
    if (!target) {
      if (can('cover')) performAction(battle, { actorId: actor.id, actionId: 'cover' });
      continue;
    }
    let actionId = null;
    let targetId = target.id;
    if (can('barrier') && actor.shield < actor.maxShield * 0.4) {
      actionId = 'barrier';
      targetId = actor.id;
    } else if (can('fortification') && !(actor.statuses.fortification > EPSILON)) {
      actionId = 'fortification';
      targetId = actor.id;
    } else if (usesClips(actor) && actor.ammo < 1 && can('reload')) {
      actionId = 'reload';
      targetId = actor.id;
    } else if (random(battle) < 0.6) {
      const powers = actions.filter(action => !PRIMARY_ACTIONS.has(action.id) && !['signature', 'medigel', 'unity', 'barrier', 'fortification', 'cancelChannel', 'shieldBoost'].includes(action.id)
        && (!action.syntheticOnly || (synthetic(target) && !target.hackImmune))
        && (action.id !== 'sabotage' || armed(target))
        && (action.id !== 'overload' || target.shield > 0 || synthetic(target))
        && !futureTargetReason(target, action.id)
        && !(target.statuses.stasis > EPSILON));
      if (powers.length) actionId = powers[Math.floor(random(battle) * powers.length)].id;
    }
    if (!actionId) {
      if (can('strike') || can('acid')) actionId = actor.primaryAction;
      else if (can('burst') && actor.heat < 35 && random(battle) < 0.22) actionId = 'burst';
      else if (can('shoot')) actionId = 'shoot';
      else {
        actionId = 'cover';
        targetId = actor.id;
      }
    }
    performAction(battle, { actorId: actor.id, actionId, targetId });
  }
  return battle;
}

/** Advances simulated time; paused/waiting combat also freezes cooldowns, heat and statuses. */
export function tickBattle(battle, dt, { paused = false } = {}) {
  if (paused || battle.winner || !Number.isFinite(dt) || dt <= 0) return battle;
  let remaining = dt;
  while (remaining > EPSILON && !battle.winner) {
    battle.waiting = waitingForDecision(battle);
    if (battle.waiting) break;
    const step = Math.min(0.05, remaining);
    battle.elapsed += step;
    for (const actor of battle.actors) tickActor(battle, actor, step);
    tickProjectiles(battle, step);
    advanceSummons(battle);
    updateWinner(battle);
    if (battle.winner) break;
    // A player decision wins simultaneous readiness in wait mode; active mode has no such pause.
    battle.waiting = waitingForDecision(battle);
    if (!battle.waiting) autoEnemyActions(battle);
    advanceSummons(battle);
    updateWinner(battle);
    remaining -= step;
  }
  return battle;
}

/** Serializable result for UI, progression and save-state summaries. */
export function summarizeBattle(battle) {
  return {
    winner: battle.winner,
    elapsed: battle.elapsed,
    actionCount: battle.actionCount,
    medigel: battle.medigel,
    defeatedEnemies: battle.actors.filter(actor => actor.team === 'enemy' && isVictoryParticipant(actor) && !living(actor)).length,
    party: battle.actors.filter(actor => actor.team === 'party' && isVictoryParticipant(actor)).map(({ id, name, hp, maxHp, shield, maxShield }) => ({ id, name, hp, maxHp, shield, maxShield, alive: hp > 0 })),
    enemies: battle.actors.filter(actor => actor.team === 'enemy' && isVictoryParticipant(actor)).map(({ id, name, hp, maxHp, shield, maxShield }) => ({ id, name, hp, maxHp, shield, maxShield, alive: hp > 0 })),
  };
}
