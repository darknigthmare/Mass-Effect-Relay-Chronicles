import test from 'node:test';
import assert from 'node:assert/strict';
import { EXPANSION3_CHARACTERS } from '../src/expansion3-characters.js';
import { EXPANSION_ENTRIES, EXPANSION2_ENTRIES } from '../src/expansion.js';
import { UNIVERSE_WORKS, getUniverseRecord, getUniverseWork } from '../src/universe-data.js';
import { canAccessContent } from '../src/continuity.js';
import { CHRONICLE_SCENARIOS, UNIVERSE_ACTORS, getUniverseActor, canUseUniverseActor } from '../src/universe-actors.js';
import { createBattle, getActions, performAction, tickBattle } from '../src/combat.js';

const get = id => EXPANSION3_CHARACTERS.find(profile => profile.recordId === id);
const earlier = [...EXPANSION_ENTRIES, ...EXPANSION2_ENTRIES];
const contexts = UNIVERSE_WORKS.flatMap(work => work.periods.map(period => ({ mediaId: work.id, periodId: period.id })));
const executableIds = ['ME3-NPC-BROOKS', 'RET-CHR-ANDERSON', 'INV-ACT-DEFENDERS'];

test('forty new actor occurrences exclude both previous study batches and every historically selectable actor', () => {
  assert.equal(earlier.length, 376);
  assert.equal(EXPANSION3_CHARACTERS.length, 40);
  assert.equal(new Set(EXPANSION3_CHARACTERS.map(profile => profile.recordId)).size, 40);
  const used = new Set(earlier.map(profile => profile.id));
  const playable = new Set(UNIVERSE_ACTORS.filter(actor => actor.playable).map(actor => actor.id));
  const works = new Set();
  for (const profile of EXPANSION3_CHARACTERS) {
    const record = getUniverseRecord(profile.recordId), work = getUniverseWork(record.mediaId);
    assert.equal(used.has(profile.recordId), false, profile.recordId);
    assert.equal(playable.has(profile.recordId), false, profile.recordId);
    assert.equal(record.fact, true); assert.equal(record.playable, false);
    assert.ok(['characters', 'npcs'].includes(record.category));
    assert.ok(work && !work.locked && !['CUT', 'ME4'].includes(work.id));
    works.add(record.mediaId);
  }
  assert.equal(works.size, 13);
});

test('source descriptions, original conditions and same-work supporting evidence stay attached to exact IDs', () => {
  for (const profile of EXPANSION3_CHARACTERS) {
    const record = getUniverseRecord(profile.recordId), work = getUniverseWork(record.mediaId);
    const anchors = profile.sourceEntryIds.map(getUniverseRecord);
    assert.equal(profile.mode, 'actor'); assert.equal(profile.notes[0], record.description);
    if (record.conditions) assert.ok(profile.notes.includes(record.conditions));
    assert.equal(anchors[0].id, profile.recordId);
    assert.ok(anchors.every(item => item.fact && item.mediaId === record.mediaId));
    assert.deepEqual(profile.sourceIds, [...new Set(anchors.flatMap(item => item.sourceIds))]);
    assert.ok(profile.sourceIds.length);
    assert.deepEqual(profile.provenance.sources, profile.sourceIds.map(id => work.sources.find(source => source.id === id)));
    assert.equal(profile.provenance.catalogPath, record.provenance.catalogPath);
    assert.equal(profile.provenance.reference, record.reference);
    assert.match(profile.provenance.verification, /aucun nouveau contrôle primaire/);
    assert.match(profile.notes.join(' '), /aucun recrutement, état importé, rencontre originale ou résultat narratif/);
  }
  assert.deepEqual(get('ME3-NPC-BROOKS').sourceEntryIds, ['ME3-NPC-BROOKS', 'ME3-ENM-BROOKS']);
  assert.deepEqual(get('RET-CHR-ANDERSON').sourceEntryIds, ['RET-CHR-ANDERSON', 'RET-REF-SHOTGUN']);
  assert.match(get('RET-CHR-ANDERSON').notes.join(' '), /sans établir son modèle ou son système de ressources/);
});

test('all published work and segment boundaries match the catalogue, including three strictly prologue MEA contacts', () => {
  for (const profile of EXPANSION3_CHARACTERS) {
    assert.deepEqual(profile.contextScopes, getUniverseRecord(profile.recordId).availability);
    for (const context of contexts) {
      const valid = profile.contextScopes.some(scope => scope.mediaId === context.mediaId && scope.periodIds.includes(context.periodId));
      assert.equal(canAccessContent(profile.recordId, context).ok, valid, `${profile.recordId}/${context.mediaId}/${context.periodId}`);
      if (valid) for (const id of profile.sourceEntryIds) assert.equal(canAccessContent(id, context).ok, true);
    }
  }
  for (const id of ['MEA-NPC-FISHER', 'MEA-NPC-GREER', 'MEA-NPC-KIRKLAND']) {
    assert.deepEqual(get(id).contextScopes, [{ mediaId: 'MEA', periodIds: ['mea-prologue'] }]);
    assert.equal(canAccessContent(id, { mediaId: 'MEA', periodId: 'mea' }).ok, false);
    assert.equal(canAccessContent(id, { mediaId: 'MEA', periodId: 'mea-apex' }).ok, false);
  }
  assert.deepEqual(get('FOU-ACT-JACOB').contextScopes, [{ mediaId: 'FOU', periodIds: ['fou-5'] }]);
});

test('recordings, remote contacts, AI and the collective retain separate identities without becoming forty named physical people', () => {
  assert.equal(get('ME2-NPC-KEIJI').identityKind, 'recorded-occurrence');
  assert.equal(get('PL-CHR-LIARA').identityKind, 'distant-contact-occurrence');
  assert.equal(get('RED-ACT-BROKER').identityKind, 'distant-representation-occurrence');
  for (const id of ['MEA-NPC-SAM', 'INI-CHR-MEDEA']) {
    assert.equal(get(id).identityKind, 'ai-occurrence'); assert.equal(get(id).simulation, null);
  }
  assert.equal(get('MEA-NPC-TWIN').identityKind, 'conditional-character-occurrence');
  assert.equal(get('ME3-NPC-LEGION').identityKind, 'conditional-entity-occurrence');
  const group = get('INV-ACT-DEFENDERS');
  assert.equal(group.identityKind, 'collective-occurrence');
  assert.match(group.notes.join(' '), /collectif abstrait, pas un nouveau personnage nommé/);
  assert.match(group.limitations.join(' '), /Aucun membre, effectif, arme, identité individuelle/);
  for (const id of ['ME2-NPC-KEIJI', 'PL-CHR-LIARA', 'RED-ACT-BROKER', 'NEX-CHR-GARSON']) assert.equal(get(id).simulation, null);
});

test('thirty-seven closed roles contain no dormant attacks, original model or named powers', () => {
  const closed = EXPANSION3_CHARACTERS.filter(profile => !profile.simulation);
  assert.equal(closed.length, 37);
  for (const profile of closed) {
    assert.equal(profile.simulation, null); assert.equal(profile.statsBasis, null);
    assert.match(profile.blockedReason, /^Inspection seulement :/);
    assert.match(profile.limitations.join(' '), /aucune statistique, attaque ou escarmouche/);
    assert.deepEqual(profile.powers, []);
    for (const key of ['hp', 'attack', 'synthetic', 'primaryAction', 'weaponProfileId', 'weaponName', 'recruited']) assert.equal(Object.hasOwn(profile, key), false);
  }
  assert.match(get('ASC-CHR-NICK').blockedReason, /âge.*aucun kit adulte/);
  assert.match(get('RET-CHR-GRAYSON').blockedReason, /ni personnage guéri, ni ennemi générique/);
  assert.match(get('MEA-NPC-RAEKA').blockedReason, /choix de secours.*ne sont pas résolus/);
  assert.match(get('ME3-NPC-THANE').blockedReason, /pas ici un kit d’assassin importé/);
  assert.match(get('RED-ACT-BROKER').blockedReason, /ne révèle ni identité anticipée ni boss/);
});

test('prepared DLC profiles remain explicit, and conditional identities grant no imported survival or narrative outcome', () => {
  const editions = EXPANSION3_CHARACTERS.filter(profile => profile.constraints.editionProfile !== null);
  assert.deepEqual(editions.map(profile => profile.recordId), ['ME2-NPC-HOCK', 'ME2-NPC-KEIJI', 'ME3-NPC-BROOKS']);
  assert.ok(editions.every(profile => profile.constraints.editionProfile === 'legendary'));
  assert.match(get('ME3-NPC-BROOKS').limitations.join(' '), /Citadel présent.*aucun uniforme.*reddition/);
  assert.match(get('ME3-NPC-MIRANDA').notes.join(' '), /Poursuit Oriana si elle a survécu/);
  assert.match(get('ME3-NPC-LEGION').notes.join(' '), /Survie et activation de ME2/);
  assert.match(get('INV-ACT-DEFENDERS').limitations.join(' '), /L’occupation d’Omega reste l’issue/);
  for (const profile of EXPANSION3_CHARACTERS) for (const key of ['alive', 'recruited', 'xp', 'credits', 'reward', 'flags', 'inventory']) assert.equal(Object.hasOwn(profile, key), false);
});

test('three bounded generic actor exercises perform native damaging orders without assigning an original kit', () => {
  assert.deepEqual(EXPANSION3_CHARACTERS.filter(profile => profile.simulation).map(profile => profile.recordId), executableIds);
  for (const id of executableIds) {
    const profile = get(id), before = JSON.stringify(profile);
    assert.equal(profile.statsBasis, 'ATB adaptation'); assert.equal(profile.blockedReason, null);
    assert.deepEqual(profile.powers, []); assert.equal(profile.simulation.synthetic, false);
    assert.equal(profile.simulation.primaryAction, 'shoot');
    assert.match(profile.limitations.join(' '), /chaleur génériques.*réglages de test ATB/);
    assert.match(profile.limitations.join(' '), /Aucun pouvoir, modèle d’équipement, kit original/);
    const battle = createBattle({ mode: 'wait', rng: () => .1,
      party: [{ ...profile.simulation, id, name: 'Porteur de test', powers: [] }],
      enemies: [{ id: 'test:target', name: 'Cible abstraite', hp: 3000, shield: 0, defense: 0, attack: 1, speed: .1, powers: [] }], medigel: 0 });
    const actor = battle.actors[0], target = battle.actors[1];
    for (let step = 0; step < 80 && actor.atb < 100; step++) tickBattle(battle, .25);
    assert.ok(getActions(battle, id).some(action => action.id === 'shoot' && action.available));
    const order = performAction(battle, { actorId: id, actionId: 'shoot', targetId: target.id });
    assert.equal(order.ok, true); assert.ok(target.hp < target.maxHp); assert.equal(actor.atb, 0);
    assert.ok(order.events.some(event => event.type === 'damage' && event.healthDamage > 0));
    assert.deepEqual(actor.powers, []); actor.hp = 1;
    assert.equal(JSON.stringify(profile), before); assert.notEqual(actor.hp, profile.simulation.hp);
  }
});

test('new dossiers remain forbidden to every historical scenario and actor preparation API', () => {
  assert.equal(CHRONICLE_SCENARIOS.length, 25);
  assert.equal(new Set(CHRONICLE_SCENARIOS.flatMap(scene => scene.actorIds)).size, 42);
  for (const profile of EXPANSION3_CHARACTERS) {
    assert.equal(getUniverseActor(profile.recordId).playable, false);
    assert.equal(CHRONICLE_SCENARIOS.some(scene => scene.actorIds.includes(profile.recordId)), false);
    for (const scope of profile.contextScopes) for (const periodId of scope.periodIds) assert.equal(canUseUniverseActor({ mediaId: scope.mediaId, periodId }, profile.recordId).ok, false);
  }
});

test('nested profiles and evidence are immutable and do not alias mutable source arrays', () => {
  const check = value => {
    if (!value || typeof value !== 'object') return;
    assert.ok(Object.isFrozen(value)); Object.values(value).forEach(check);
  };
  check(EXPANSION3_CHARACTERS);
  for (const profile of EXPANSION3_CHARACTERS) {
    const record = getUniverseRecord(profile.recordId);
    assert.notEqual(profile.contextScopes, record.availability);
    assert.notEqual(profile.sourceIds, record.sourceIds);
  }
  assert.throws(() => { get('RET-CHR-ANDERSON').simulation.attack = 999999; }, TypeError);
  assert.throws(() => { get('ME3-NPC-BROOKS').constraints.editionProfile = null; }, TypeError);
  assert.throws(() => { get('MEA-NPC-FISHER').contextScopes[0].periodIds.push('mea'); }, TypeError);
  assert.throws(() => { get('ASC-CHR-NICK').simulation = { hp: 1, attack: 999 }; }, TypeError);
  assert.throws(() => { get('RET-CHR-ANDERSON').provenance.sources[0].scope = 'forged'; }, TypeError);
});
