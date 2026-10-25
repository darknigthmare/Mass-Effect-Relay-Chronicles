import test from 'node:test';
import assert from 'node:assert/strict';
import { MEDIA_PERIODS } from '../src/continuity-data.js';
import { getUniverseRecord } from '../src/universe-data.js';
import { CAMPAIGN_CONTEXT, normalizeContext, getCurrentContext, isCampaignContext, canAccessContent, listAvailable,
  createChronicleSession, normalizeChronicleSession, discoverContent, setChronicleNote } from '../src/continuity.js';

const me1 = { mediaId: 'ME1', periodId: 'me1' };
const me2 = { mediaId: 'ME2', periodId: 'me2' };
const me3 = { mediaId: 'ME3', periodId: 'me3' };
const snapshot = value => JSON.stringify(value);
const clone = value => structuredClone(value);
function deniedWithoutMutation(session, operation) {
  const before = snapshot(session); assert.equal(operation().ok, false); assert.equal(snapshot(session), before);
}

test('registered contexts use exact work and segment, without deriving eligibility from a year', () => {
  for (const media of MEDIA_PERIODS) {
    for (const period of media.periods) {
      const context = normalizeContext({ mediaId: media.id, periodId: period.id });
      if (media.locked) assert.equal(context, null);
      else assert.deepEqual(context, { mediaId: media.id, periodId: period.id, galaxy: media.galaxy });
    }
  }
  assert.deepEqual(normalizeContext({ mediaId: 'ANN', periodId: 'ann' }), { mediaId: 'ANN', periodId: 'ann', galaxy: 'unknown' });
  assert.equal(normalizeContext({ mediaId: 'ANN', periodId: 'ann', galaxy: 'andromeda' }), null);
  for (const context of [null, {}, [], { ...me1, year: 2183 }, { ...me1, phase: 'late' }, { ...me1, sceneId: 'anything' },
    { ...me1, galaxy: 'andromeda' }, { mediaId: 'ME3', periodId: 'me1' }, { mediaId: 'unknown', periodId: 'me1' },
    { mediaId: 'HOM', periodId: 'hom' }, { mediaId: 'FOU', periodId: 'fou' }]) assert.equal(normalizeContext(context), null);
  for (const mediaId of ['LIB', 'ME4', 'CUT', 'BLA']) assert.equal(normalizeContext({ mediaId, periodId: mediaId.toLowerCase() }), null);
});

test('ME1 campaign context is fixed and independent from forged caller epochs', () => {
  const first = getCurrentContext({ context: me3, mediaId: 'MEA', year: 2819 });
  assert.deepEqual(first, CAMPAIGN_CONTEXT); first.mediaId = 'ME3';
  assert.deepEqual(getCurrentContext(), CAMPAIGN_CONTEXT);
  assert.equal(isCampaignContext(me1), true); assert.equal(isCampaignContext(me2), false);
  assert.equal(isCampaignContext({ ...me1, year: 2183 }), false);
});

test('same-year or same-character assumptions never unlock another work’s records', () => {
  assert.ok(getUniverseRecord('ME2-CHR-JACK'));
  assert.equal(canAccessContent('ME2-CHR-JACK', me2).ok, true);
  assert.equal(canAccessContent('ME2-CHR-JACK', me1).ok, false);
  assert.equal(canAccessContent('ME2-CHR-JACK', me3).ok, false);
  assert.equal(canAccessContent('ME3-WPN-GRAAL', me3).ok, true);
  assert.equal(canAccessContent('ME3-WPN-GRAAL', me1).ok, false);
  assert.equal(canAccessContent('MEA-WRL-EOS', { mediaId: 'MEA', periodId: 'mea' }).ok, true);
  assert.equal(canAccessContent('MEA-WRL-EOS', me3).ok, false);
  assert.equal(canAccessContent('not-a-record', me2).ok, false);
});

test('anthologies require sourced scene membership and leave uncertain cast windows closed', () => {
  const liara = { mediaId: 'HOM', periodId: 'hom-4-liara' }, omega = { mediaId: 'HOM', periodId: 'hom-3-omega' };
  assert.equal(canAccessContent('HOM-ACT-LIARA', liara).ok, true);
  assert.equal(canAccessContent('HOM-ACT-LIARA', omega).ok, false);
  assert.equal(canAccessContent('HOM-ACT-TALI', { mediaId: 'HOM', periodId: 'hom-2-tali' }).ok, false);
  assert.equal(canAccessContent('HOM-ACT-GARRUS', omega).ok, false);
  assert.equal(canAccessContent('FOU-ACT-MIRANDA', { mediaId: 'FOU', periodId: 'fou-5' }).ok, true);
  assert.equal(canAccessContent('FOU-ACT-JACOB', { mediaId: 'FOU', periodId: 'fou-5' }).ok, true);
  assert.equal(canAccessContent('FOU-ACT-MIRANDA', { mediaId: 'FOU', periodId: 'fou-6' }).ok, false);
  assert.equal(canAccessContent('FOU-ACT-JACK', { mediaId: 'FOU', periodId: 'fou-7' }).ok, false);
});

test('content access resolves canonical provenance and never trusts a supplied availability override', () => {
  const forged = { id: 'ME2-CHR-JACK', availability: [{ mediaId: 'ME1', periodIds: ['me1'] }] };
  assert.equal(canAccessContent(forged, me1).ok, false);
  assert.equal(canAccessContent({ id: 'not-a-record', availability: [{ mediaId: 'ME1', periodIds: ['me1'] }] }, me1).ok, false);
  let accessed = false;
  const accessor = {}; Object.defineProperty(accessor, 'id', { get() { accessed = true; return 'ME2-CHR-JACK'; } });
  assert.equal(canAccessContent(accessor, me2).ok, false); assert.equal(accessed, false);
  assert.equal(canAccessContent('constructor', me1).ok, false);
});

test('available lists filter by provenance, category and accent-insensitive French search', () => {
  const all = listAvailable(me2), actors = listAvailable(me2, { group: 'actors' });
  assert.ok(all.some(record => record.id === 'ME2-CHR-JACK'));
  assert.ok(actors.some(record => record.id === 'ME2-CHR-JACK'));
  assert.ok(all.every(record => canAccessContent(record, me2).ok));
  assert.ok(all.every(record => record.playable === false));
  assert.ok(listAvailable(me2, { query: 'jack' }).some(record => record.id === 'ME2-CHR-JACK'));
  assert.equal(listAvailable(me2, { group: 'constructor' }).length, 0);
  assert.equal(listAvailable(me2, { query: 'x'.repeat(301) }).length, 0);
  assert.equal(listAvailable({ mediaId: 'ME4', periodId: 'me4' }).length, 0);
  assert.equal(listAvailable(me1).some(record => record.id === 'ME3-WPN-GRAAL'), false);
});

test('new chronicle sessions are independent and contain no campaign inventory or economy', () => {
  const a = createChronicleSession(me2), b = createChronicleSession(me2);
  assert.deepEqual(a, { version: 1, context: normalizeContext(me2), scenarioId: null, discovered: [], notes: {}, party: [], loadouts: {}, builds: {}, readingProgress: {}, ammoModes: {}, cleared: [] });
  assert.equal(createChronicleSession({ mediaId: 'ME4', periodId: 'me4' }), null);
  a.party.push('prototype-actor'); a.loadouts['prototype-actor'] = { weapon: null, armor: null };
  a.cleared.push('prototype-scenario');
  assert.deepEqual(b.party, []); assert.deepEqual(b.loadouts, {}); assert.deepEqual(b.cleared, []);
  assert.equal(Object.hasOwn(a, 'inventory'), false); assert.equal(Object.hasOwn(a, 'credits'), false);
});

test('base session normalization copies selections while leaving gameplay authorization to the composite validator', () => {
  const raw = createChronicleSession(me2);
  raw.scenarioId = 'ME2-MQ-FREEDOM'; raw.party = ['ME2-CHR-JACK'];
  raw.ammoModes = { 'ME2-CHR-JACK': null };
  raw.loadouts = { 'ME2-CHR-JACK': { weapon: 'ME2-WPN-EXAMPLE', armor: null } };
  raw.cleared = ['ME2-MQ-FREEDOM'];
  assert.equal(discoverContent(raw, 'ME2-CHR-JACK').ok, true);
  assert.equal(setChronicleNote(raw, 'ME2-CHR-JACK', '  Note personnelle.  ').ok, true);
  const result = normalizeChronicleSession(raw);
  assert.deepEqual(result, { ...raw, builds: { 'ME2-CHR-JACK': 'default' }, loadouts: { 'ME2-CHR-JACK': { ...raw.loadouts['ME2-CHR-JACK'], weaponMod: null, weaponMod2: null } } }); assert.equal(result.notes['ME2-CHR-JACK'], 'Note personnelle.');
  result.loadouts['ME2-CHR-JACK'].weapon = null; result.context.periodId = 'different'; result.discovered.length = 0;
  assert.equal(raw.loadouts['ME2-CHR-JACK'].weapon, 'ME2-WPN-EXAMPLE'); assert.equal(raw.context.periodId, 'me2');
  assert.deepEqual(raw.discovered, ['ME2-CHR-JACK']);
});

test('legacy Chronicle versions migrate two equipment slots and absent optional progress without changing notes', () => {
  const old = createChronicleSession(me2);
  delete old.builds; delete old.readingProgress; delete old.ammoModes;
  old.party = ['ME2-CHR-JACK']; old.loadouts = { 'ME2-CHR-JACK': { weapon: null, armor: null } };
  old.discovered = ['ME2-CHR-JACK']; old.notes = { 'ME2-CHR-JACK': 'Une note personnelle à conserver.' };
  const before = snapshot(old), current = normalizeChronicleSession(old);
  assert.deepEqual(current.loadouts['ME2-CHR-JACK'], { weapon: null, armor: null, weaponMod: null, weaponMod2: null });
  assert.deepEqual(current.builds, { 'ME2-CHR-JACK': 'default' });
  assert.deepEqual(current.ammoModes, { 'ME2-CHR-JACK': null });
  assert.deepEqual(current.readingProgress, {}); assert.deepEqual(current.notes, old.notes);
  assert.equal(snapshot(old), before); assert.equal(current.version, 1);
  for (const mutation of [raw => { raw.builds = { stranger: 'soldier' }; }, raw => { raw.readingProgress = { story: -1 }; },
    raw => { raw.readingProgress = { story: 0.5 }; }, raw => { raw.readingProgress = null; },
    raw => { raw.loadouts['ME2-CHR-JACK'].weaponMod = null; }, raw => { raw.extra = {}; }]) {
    const invalid = clone(old); mutation(invalid); assert.equal(normalizeChronicleSession(invalid), null);
  }
});

test('base session rejects unknown schema, stale discoveries and malformed selections', () => {
  const base = createChronicleSession(me2), changes = [
    raw => { raw.version = 2; }, raw => { raw.extra = true; }, raw => { delete raw.scenarioId; },
    raw => { raw.scenarioId = 'x'.repeat(161); }, raw => { raw.context.year = 2185; },
    raw => { raw.discovered = ['not-a-record']; }, raw => { raw.discovered = ['ME3-WPN-GRAAL']; },
    raw => { raw.discovered = ['ME2-CHR-JACK', 'ME2-CHR-JACK']; },
    raw => { raw.notes = { 'ME2-CHR-JACK': 'Never discovered.' }; },
    raw => { raw.party = ['a', 'b', 'c', 'd']; }, raw => { raw.party = ['a', 'a']; },
    raw => { raw.loadouts = { a: { weapon: null, armor: null } }; },
    raw => { raw.party = ['a']; raw.loadouts = { a: { weapon: null } }; },
    raw => { raw.party = ['a']; raw.loadouts = { a: { weapon: null, armor: null, extra: null } }; },
    raw => { raw.party = ['a']; raw.loadouts = { a: { weapon: 3, armor: null } }; },
    raw => { raw.cleared = ['scenario', 'scenario']; }, raw => { raw.cleared = ['constructor']; },
  ];
  for (const change of changes) { const raw = clone(base); change(raw); assert.equal(normalizeChronicleSession(raw), null); }
});

test('validators reject getters, prototypes, hidden properties, cycles and sparse arrays without executing code', () => {
  let accessed = false;
  const context = { ...me2 }; Object.defineProperty(context, 'galaxy', { enumerable: true, get() { accessed = true; return 'milky-way'; } });
  assert.equal(normalizeContext(context), null); assert.equal(accessed, false);
  assert.equal(normalizeContext(Object.create(me2)), null);
  assert.equal(normalizeContext(JSON.parse('{"mediaId":"ME2","periodId":"me2","__proto__":{}}')), null);
  const cyclic = createChronicleSession(me2); cyclic.notes.loop = cyclic;
  assert.equal(normalizeChronicleSession(cyclic), null);
  const accessor = createChronicleSession(me2); Object.defineProperty(accessor.notes, 'trap', { enumerable: true, get() { accessed = true; return ''; } });
  assert.equal(normalizeChronicleSession(accessor), null); assert.equal(accessed, false);
  const hidden = createChronicleSession(me2); Object.defineProperty(hidden, 'extra', { value: true });
  assert.equal(normalizeChronicleSession(hidden), null);
  const sparse = createChronicleSession(me2); sparse.discovered.length = 1; sparse.discovered.extra = 'ME2-CHR-JACK';
  assert.equal(normalizeChronicleSession(sparse), null);
  const symbolic = createChronicleSession(me2); symbolic.party[Symbol('extra')] = 'a';
  assert.equal(normalizeChronicleSession(symbolic), null);
});

test('discoveries and personal notes are unique and atomic, and cannot cross source contexts', () => {
  const session = createChronicleSession(me2);
  assert.equal(discoverContent(session, 'ME2-CHR-JACK').ok, true);
  assert.equal(discoverContent(session, 'ME2-CHR-JACK').ok, true);
  assert.deepEqual(session.discovered, ['ME2-CHR-JACK']);
  assert.equal(setChronicleNote(session, 'ME2-CHR-JACK', 'Une note.').ok, true);
  assert.equal(session.notes['ME2-CHR-JACK'], 'Une note.');
  deniedWithoutMutation(session, () => discoverContent(session, 'ME3-WPN-GRAAL'));
  deniedWithoutMutation(session, () => setChronicleNote(session, 'ME3-WPN-GRAAL', 'Future weapon.'));
  deniedWithoutMutation(session, () => setChronicleNote(session, 'ME2-CHR-JACK', 'x'.repeat(2001)));
  assert.equal(setChronicleNote(session, 'ME2-CHR-JACK', '   ').ok, true);
  assert.deepEqual(session.notes, {}); assert.deepEqual(session.discovered, ['ME2-CHR-JACK']);
});
