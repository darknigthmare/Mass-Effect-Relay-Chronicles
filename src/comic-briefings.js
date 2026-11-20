import { canAccessContent, normalizeContext } from './continuity.js';
import { getUniverseRecord, getUniverseWork } from './universe-data.js';
import { comicArcBriefings } from './comic-arc-briefings.js';
import { comicIssueBriefings } from './comic-issue-briefings.js';
import { comicShortBriefings } from './comic-short-briefings.js';

const definitions = [...comicArcBriefings, ...comicIssueBriefings, ...comicShortBriefings];
const methods = ['trace', 'review'];
const own = (object, key) => Object.hasOwn(object, key);
const copy = value => structuredClone(value);
const fail = reason => ({ ok: false, reason });
const plain = value => !!value && typeof value === 'object'
  && [Object.prototype, null].includes(Object.getPrototypeOf(value));
const text = value => typeof value === 'string' && value.trim() !== '';

function sourcesFor(work, ids) {
  return ids.map(id => work.sources.find(source => source.id === id))
    .filter(source => source && /^https?:\/\//.test(source.url));
}

export function resolveComicAnchor(id, work, period, context) {
  const record = getUniverseRecord(id);
  if (record && record.mediaId === work.id) {
    const sources = sourcesFor(work, record.sourceIds);
    const inPeriod = period?.reference.match(/\b[A-Z][A-Z0-9]*(?:-[A-Z0-9]+)+\b/g)?.includes(id);
    if (!sources.length) return null;
    const anchor = { id, title: record.name, description: record.description, reference: record.reference, sources };
    if (work.id === 'BLA' && record.fact && record.lockReason === 'in-universe-fiction')
      return { ...anchor, category: 'Fiction interne' };
    if (record.nature === 'Établi' && canAccessContent(id, context).ok)
      return { ...anchor, category: 'Fait établi' };
    if (record.nature === 'À vérifier' && inPeriod)
      return { ...anchor, category: 'À vérifier' };
    return null;
  }
  const source = period?.sourceIds.includes(id) && sourcesFor(work, [id])[0];
  return source ? { id, category: 'Source du repère', title: source.title, description: period.uncertainty,
    reference: period.label, sources: [source] } : null;
}

function compileBriefing(definition) {
  const work = getUniverseWork(definition.mediaId);
  const editorial = work?.id === 'BLA' && work.kind === 'in-universe-fiction' && definition.periodId === null;
  const context = normalizeContext({ mediaId: definition.mediaId, periodId: definition.periodId });
  const period = work?.periods.find(item => item.id === definition.periodId);
  const anchors = work && definition.anchorIds.map(id => resolveComicAnchor(id, work, period, context));
  if ((!editorial && !context) || !anchors?.length || anchors.some(anchor => !anchor)
    || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(definition.id)
    || ![definition.title, definition.objective, definition.resolution, definition.review?.prompt,
      definition.optional?.label, definition.optional?.text].every(text)
    || (definition.receipt !== undefined && !text(definition.receipt))
    || definition.trace?.length !== 3 || definition.trace.some(card => !text(card.label) || !text(card.text))
    || definition.review?.choices?.length !== 3 || !definition.review.choices.every(text)
    || !Number.isInteger(definition.review.answer) || !(definition.review.answer in definition.review.choices))
    return null;
  return { ...definition, context, editorial, anchors };
}

const briefings = new Map();
for (const definition of definitions) {
  const briefing = compileBriefing(definition);
  if (briefing && !briefings.has(briefing.id)) briefings.set(briefing.id, briefing);
}

const byContext = new Map();
const contextKey = context => context && `${context.mediaId}:${context.periodId}`;
for (const briefing of briefings.values()) {
  const key = contextKey(briefing.context);
  if (!byContext.has(key)) byContext.set(key, []);
  byContext.get(key).push(briefing);
}

export function listComicBriefings(rawContext) {
  const key = contextKey(normalizeContext(rawContext));
  return key ? (byContext.get(key) || []).map(({ id, title, objective }) => ({ id, title, objective })) : [];
}

function scopedBriefing(context, id) {
  const entry = briefings.get(id);
  return context && entry?.context && contextKey(entry.context) === contextKey(context) ? entry : null;
}

export function comicFictionReferences() {
  return copy((byContext.get(null) || []).map(({ id, title, anchors }) => ({ id, title, anchors })));
}

const requiredSteps = method => method === 'trace' ? 3 : 1;
function validState(state) {
  return plain(state) && Object.keys(state).length === 4
    && ['method', 'step', 'extra', 'closed'].every(key => own(state, key))
    && methods.includes(state.method) && Number.isInteger(state.step)
    && state.step >= 0 && state.step <= requiredSteps(state.method)
    && typeof state.extra === 'boolean' && typeof state.closed === 'boolean'
    && (!state.closed || state.step === requiredSteps(state.method));
}

export function validateComicProgress(context, progress) {
  return plain(progress) && Object.keys(progress).length <= (byContext.get(contextKey(context)) || []).length
    && Object.entries(progress).every(([id, state]) => scopedBriefing(context, id) && validState(state));
}

export function getComicBriefing(rawContext, id, state) {
  const briefing = scopedBriefing(normalizeContext(rawContext), id);
  if (!briefing || (state !== undefined && !validState(state))) return null;
  const phase = !state ? 'select' : state.closed ? 'resolved'
    : state.step === requiredSteps(state.method) ? 'summary' : state.method;
  const view = copy(briefing);
  if (phase !== 'resolved') delete view.receipt;
  return { ...view, phase, state: state && { ...state } };
}

export function actOnComicBriefing(context, id, state, action, value) {
  const briefing = getComicBriefing(context, id, state);
  if (!briefing) return fail('Ce dossier ne correspond pas au chapitre sélectionné.');
  const { phase } = briefing;
  if (action === 'method' && phase === 'select' && methods.includes(value))
    return { ok: true, state: { method: value, step: 0, extra: false, closed: false } };
  if (action === 'restart' && phase === 'resolved') return { ok: true, state: undefined };
  if (action === 'optional' && state && !state.closed)
    return { ok: true, state: { ...state, extra: true } };
  if (action === 'finish' && phase === 'summary') return { ok: true, state: { ...state, closed: true } };
  if (action === 'pick' && (phase === 'trace' || phase === 'review')) {
    if (value !== (phase === 'trace' ? state.step : briefing.review.answer))
      return fail(phase === 'trace' ? 'Ce repère vient à une autre étape. Vérifiez l’ordre du dossier.' : 'Ce classement ne correspond pas aux pièces du dossier.');
    return { ok: true, state: { ...state, step: state.step + 1 } };
  }
  return fail('Cette action est indisponible pour le dossier.');
}
