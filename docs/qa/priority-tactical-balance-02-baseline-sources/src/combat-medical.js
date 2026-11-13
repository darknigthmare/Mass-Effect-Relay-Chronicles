// Opt-in medical commands for isolated ME2/ME3 study benches. No campaign or
// existing Chronicle battle enables these profiles. Numbers are ATB fixtures.
import { isSummon } from './combat-summons.js';

export const MEDICAL_BENCH_PROFILES = Object.freeze({
  'medical-me2': Object.freeze({ mediaId: 'ME2', actionId: 'unityMedigel', cost: 1, healthRatio: .3 }),
  'medical-me3': Object.freeze({ mediaId: 'ME3', actionId: 'firstAid', cost: 1, healthRatio: .3 }),
});
export const MEDICAL_ACTION_IDS = Object.freeze(['unityMedigel', 'firstAid']);
export function getMedicalBenchProfile(id) {
  return typeof id === 'string' && Object.hasOwn(MEDICAL_BENCH_PROFILES, id) ? MEDICAL_BENCH_PROFILES[id] : null;
}
export function medicalActionIds(battle, actor) {
  const profile = getMedicalBenchProfile(battle?.medicalBench);
  return profile && actor?.team === 'party' && !isSummon(actor) && actor.mediaId === profile.mediaId
    && Array.isArray(actor.powers) && actor.powers.includes(profile.actionId) ? [profile.actionId] : [];
}
/** A plan never mutates a battle, actor, resource, log or random generator. */
export function planMedicalBenchAction(battle, actor, actionId) {
  const profile = getMedicalBenchProfile(battle?.medicalBench);
  if (!profile || !medicalActionIds(battle, actor).includes(actionId)) return { ok: false, reason: 'Secours médical non autorisé dans ce banc et cette œuvre.' };
  if (!Number.isInteger(battle.medigel) || battle.medigel < profile.cost) return { ok: false, reason: 'Plus de médi-gel pour relever les équipiers.' };
  const targets = battle.actors.filter(target => target.team === actor.team && target.id !== actor.id && target.mediaId === profile.mediaId
    && !isSummon(target) && target.hp === 0 && target.narrativeDead !== true && target.revivable !== false);
  if (!targets.length) return { ok: false, reason: 'Aucun équipier KO de combat relevable.' };
  return { ok: true, profile, targets };
}
