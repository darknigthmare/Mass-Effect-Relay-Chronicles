// Curated, independently replayable medical experiments. Values are fixed here,
// not taken from caller-supplied actor stats or a missing original gameplay kit.
import { ACTIONS, createBattle, getActions, performAction, tickBattle } from './combat.js';
import { canAccessContent } from './continuity.js';

const specs = Object.freeze({
  'ME2-POW-UNITY': Object.freeze({ kind: 'medical', parentRecordId: 'ME2-EQP-MEDIGEL', actionId: 'unityMedigel', medicalBench: 'medical-me2', mediaId: 'ME2', periodId: 'me2' }),
  'ME3-POW-FIRST-AID': Object.freeze({ kind: 'medical', parentRecordId: 'ME3-EQP-MEDIGEL', actionId: 'firstAid', medicalBench: 'medical-me3', mediaId: 'ME3', periodId: 'me3' }),
});
const fail = reason => ({ ok: false, reason });
export function canRunMedicalBench(entry, context) {
  const id = entry?.id ?? entry?.recordId, spec = typeof id === 'string' && Object.hasOwn(specs, id) && specs[id];
  const bench = entry?.bench;
  if (!spec || entry.recordId !== id || entry.mode !== 'armor' || !bench
    || Object.keys(bench).length !== 3 || ['kind', 'parentRecordId', 'actionId'].some(key => bench[key] !== spec[key]))
    return fail('Banc médical ou référence exacte non attestés.');
  if (context?.mediaId !== spec.mediaId || context?.periodId !== spec.periodId
    || !canAccessContent(id, context).ok || !canAccessContent(spec.parentRecordId, context).ok)
    return fail('Ce secours est réservé au segment solo documenté de son œuvre.');
  return { ok: true, reason: null };
}

const snapshot = battle => ({ doses: battle.medigel,
  conscious: battle.actors.filter(actor => actor.team === 'party' && actor.hp > 0).length,
  medicAtb: battle.actors[0].atb,
  patients: battle.actors.filter(actor => actor.id.startsWith('medical:patient')).map(actor => ({ id: actor.id,
    hp: actor.hp, maxHp: actor.maxHp, shield: actor.shield, atb: actor.atb })),
  woundedHp: battle.actors.find(actor => actor.id === 'medical:wounded').hp,
  excludedHp: battle.actors.find(actor => actor.id === 'medical:excluded').hp,
});
function fixture(spec, options) {
  const ally = { hp: 120, maxHp: 120, shield: 0, maxShield: 30, attack: 1, defense: 4, speed: .1, powers: [], mediaId: spec.mediaId };
  return createBattle({ party: [
    { ...ally, id: 'medical:medic', name: 'Secouriste abstrait', hp: 200, maxHp: 200, atb: 100, speed: 1, powers: [spec.actionId] },
    { ...ally, id: 'medical:patient-a', name: 'Équipier abstrait A · KO', hp: 0 },
    { ...ally, id: 'medical:patient-b', name: 'Équipier abstrait B · KO', hp: 0, maxHp: 180 },
    { ...ally, id: 'medical:wounded', name: 'Témoin conscient blessé', hp: 70 },
    { ...ally, id: 'medical:excluded', name: 'Témoin explicitement exclu', hp: 0, narrativeDead: true, revivable: false },
  ], enemies: [{ ...ally, id: 'medical:target', name: 'Cible abstraite inactive pendant la mesure', hp: 2000, maxHp: 2000 }],
  medicalBench: spec.medicalBench, medigel: 1, mode: 'active', seed: options.seed, difficulty: options.difficulty });
}
const command = (battle, spec, targetId) => performAction(battle, { actorId: 'medical:medic', actionId: spec.actionId, ...(targetId ? { targetId } : {}) });
function waitUntilReady(battle) {
  for (let i = 0; i < 100 && battle.actors[0].atb < 99.999 && !battle.winner; i++) tickBattle(battle, .1);
  if (battle.actors[0].atb < 99.999 || battle.winner) throw new Error('Medical benchmark actor did not become ready');
}

/** Returns the same equipment-bench result shape as the existing resource UI. */
export function runMedicalBench(entry, context, options = {}) {
  const access = canRunMedicalBench(entry, context);
  if (!access.ok) throw new Error(access.reason);
  const id = entry.id ?? entry.recordId, spec = specs[id], battle = fixture(spec, options), before = snapshot(battle);
  const first = command(battle, spec);
  if (!first.ok) throw new Error('Native medical command was rejected');
  const after = snapshot(battle);
  // Refusal with a real ready ATB gauge and KO targets proves that the stock,
  // rather than readiness or absence of a patient, prevents repeated use.
  battle.actors.find(actor => actor.id === 'medical:patient-a').hp = 0;
  waitUntilReady(battle);
  const exhaustedBefore = snapshot(battle), rejected = command(battle, spec), exhaustedAfter = snapshot(battle);
  if (rejected.ok || exhaustedBefore.doses !== 0 || exhaustedBefore.medicAtb !== 100
    || JSON.stringify(exhaustedBefore) !== JSON.stringify(exhaustedAfter))
    throw new Error('Exhausted medical command did not reject without mutation');
  // A different fixture proves that having stock alone never spends a dose
  // against a conscious or narrative-excluded target.
  const targetControl = fixture(spec, options), targetBefore = snapshot(targetControl);
  const invalidTarget = command(targetControl, spec, 'medical:excluded');
  if (invalidTarget.ok || JSON.stringify(targetBefore) !== JSON.stringify(snapshot(targetControl)))
    throw new Error('Excluded patient was not rejected without mutation');
  const noPatientControl = fixture(spec, options);
  for (const actor of noPatientControl.actors.filter(actor => actor.id.startsWith('medical:patient'))) actor.hp = actor.maxHp;
  const noPatientBefore = snapshot(noPatientControl), noPatient = command(noPatientControl, spec);
  if (noPatient.ok || JSON.stringify(noPatientBefore) !== JSON.stringify(snapshot(noPatientControl)))
    throw new Error('No-patient command did not reject without mutation');
  return { kind: 'equipment-bench', medical: true, outcome: 'observed', benchKind: 'medical', actionId: spec.actionId,
    actionLabel: ACTIONS[spec.actionId].label,
    before, after, control: targetBefore,
    rows: [
      { label: 'Doses partagées', before: before.doses, control: targetBefore.doses, sample: after.doses, unit: 'Un ordre de secours consomme une dose du banc' },
      { label: 'Équipiers KO relevés', before: 0, control: 0, sample: after.patients.filter(actor => actor.hp > 0).length, unit: 'Cible de groupe de cette adaptation ATB' },
      { label: 'Santé de l’équipier A', before: before.patients[0].hp, control: targetBefore.patients[0].hp, sample: after.patients[0].hp, unit: '30 % du budget de santé ATB' },
      { label: 'Santé de l’équipier B', before: before.patients[1].hp, control: targetBefore.patients[1].hp, sample: after.patients[1].hp, unit: '30 % du budget de santé ATB' },
      { label: 'Santé du témoin conscient', before: before.woundedHp, control: targetBefore.woundedHp, sample: after.woundedHp, unit: 'Soin conscient hors de ce banc' },
      { label: 'Témoin explicitement exclu', before: before.excludedHp, control: targetBefore.excludedHp, sample: after.excludedHp, unit: 'Aucune réanimation narrative' },
      { label: 'ATB du secouriste', before: before.medicAtb, control: targetBefore.medicAtb, sample: after.medicAtb, unit: 'Vrai ordre natif ; ATB consommée' },
    ],
    nativeOrders: first.events.filter(event => event.type === 'action').length,
    revived: first.events.filter(event => event.type === 'revive').map(event => event.targetId),
    resourceEvents: first.events.filter(event => event.type === 'medicalResource'),
    rejectedExhaustedOrder: !rejected.ok, exhaustionReason: rejected.reason,
    exhaustionReadyAtb: exhaustedBefore.medicAtb, exhaustedPatientHp: exhaustedBefore.patients[0].hp,
    rejectedExcludedTarget: !invalidTarget.ok, excludedReason: invalidTarget.reason,
    rejectedNoPatient: !noPatient.ok, noPatientReason: noPatient.reason,
    actionsAvailable: getActions(battle, 'medical:medic').filter(action => action.id === spec.actionId).map(action => ({ id: action.id, available: action.available, reason: action.reason })),
    log: [...battle.log],
    note: 'Commande native contextuelle sur des équipiers de test, comparée à un ordre refusé sur une cible exclue. Le principe du secours avec médi-gel est documenté ; une dose de groupe, 30 % de santé et les jauges ATB sont des choix de démonstration. Aucun inventaire ni décès de campagne modifié.',
  };
}
