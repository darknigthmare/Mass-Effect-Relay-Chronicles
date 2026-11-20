import { normalizeContext } from './continuity.js';
import { getUniverseRecord, getUniverseWork } from './universe-data.js';
import { resolveComicAnchor } from './comic-briefings.js';
import { comicArcFields } from './comic-field-arcs.js';
import { comicIssueFields } from './comic-field-issues.js';

const keyPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const stateKeys = ['route', 'position', 'cleared', 'extra', 'closed'];
const nonempty = value => typeof value === 'string' && value.trim().length > 0;
const coordinate = value => Number.isInteger(value) && value >= 10 && value <= 90;
const distinct = values => new Set(values).size === values.length;
const contextKey = context => context && `${context.mediaId}/${context.periodId}`;
const fail = reason => ({ ok: false, reason });

function compileField(definition) {
  const context = normalizeContext({ mediaId: definition.mediaId, periodId: definition.periodId });
  const work = getUniverseWork(definition.mediaId), objective = getUniverseRecord(definition.objectiveId);
  const period = work?.periods.find(entry => entry.id === definition.periodId);
  if (!context || !period || objective?.mediaId !== work.id || objective.category !== 'main_quests'
    || !keyPattern.test(definition.id) || ![definition.title, definition.objective, definition.result?.title,
      definition.result?.text, definition.optional?.label, definition.optional?.text].every(nonempty)
    || definition.team?.length !== 2 || !definition.team.every(nonempty)
    || definition.nodes?.length < 4 || definition.nodes?.length > 12 || definition.routes?.length !== 2) return null;
  const nodeIds = definition.nodes.map(node => node.id);
  if (!distinct(nodeIds) || !definition.nodes.every(node => keyPattern.test(node.id) && coordinate(node.x)
    && coordinate(node.y) && [node.label, node.detail, node.action].every(nonempty))) return null;
  if (!distinct(definition.nodes.map(node => `${node.x}/${node.y}`))) return null;
  const [first, second] = definition.routes;
  if (first.id === second.id || !definition.routes.every(route => keyPattern.test(route.id)
    && nonempty(route.label) && nonempty(route.detail) && route.path?.length >= 3 && route.path.length <= 6
    && distinct(route.path) && route.path.every(id => nodeIds.includes(id))
    && route.path.includes(definition.optional.nodeId))) return null;
  if (first.path[0] !== second.path[0] || first.path.at(-1) !== second.path.at(-1)
    || first.path.join('/') === second.path.join('/')) return null;
  const anchors = definition.anchorIds.map(id => resolveComicAnchor(id, work, period, context));
  if (!anchors.length || anchors.some(anchor => !anchor)) return null;
  return { ...definition, context, anchors };
}

const fields = new Map();
for (const definition of [...comicArcFields, ...comicIssueFields]) {
  const field = compileField(definition);
  if (field && !fields.has(field.id)) fields.set(field.id, field);
}

function fieldFor(context, id) {
  const field = fields.get(id);
  return field && contextKey(context) === contextKey(field.context) ? field : null;
}

function validState(field, state) {
  if (!state || typeof state !== 'object' || ![Object.prototype, null].includes(Object.getPrototypeOf(state))
    || Reflect.ownKeys(state).length !== stateKeys.length) return false;
  const properties = Object.getOwnPropertyDescriptors(state);
  if (!stateKeys.every(key => properties[key]?.enumerable && Object.hasOwn(properties[key], 'value'))) return false;
  const { route, position, cleared, extra, closed } = state;
  const path = field.routes.find(option => option.id === route)?.path;
  return !!path && Number.isInteger(position) && Number.isInteger(cleared)
    && position >= 0 && position < path.length && cleared >= position && cleared <= path.length
    && typeof extra === 'boolean' && typeof closed === 'boolean'
    && (!extra || path.indexOf(field.optional.nodeId) <= cleared)
    && (!closed || (position === path.length - 1 && cleared === path.length));
}

export function validateComicFieldProgress(context, progress) {
  return Object.entries(progress).every(([id, state]) => {
    const field = fieldFor(context, id);
    return field && validState(field, state);
  });
}

export function listComicFields(rawContext) {
  const context = normalizeContext(rawContext);
  if (!context) return [];
  return [...fields.values()].filter(field => fieldFor(context, field.id))
    .map(({ id, title, objective }) => ({ id, title, objective }));
}

export function getComicField(rawContext, id, state) {
  const field = fieldFor(normalizeContext(rawContext), id);
  if (!field || (state !== undefined && !validState(field, state))) return null;
  const route = field.routes.find(option => option.id === state?.route);
  const inExit = route && state.position === route.path.length - 1;
  const phase = !state ? 'plan' : state.closed ? 'resolved'
    : inExit && state.cleared === route.path.length ? 'summary' : 'field';
  const view = { ...field, phase, state, route, currentNodeId: route?.path[state.position] };
  if (phase !== 'summary' && phase !== 'resolved') delete view.result;
  return structuredClone(view);
}

export function actOnComicField(context, id, state, action, value) {
  const field = getComicField(context, id, state);
  if (!field) return fail('Cette intervention appartient à un autre chapitre.');
  const { phase, route, currentNodeId } = field;
  if (action === 'route' && phase === 'plan' && field.routes.some(option => option.id === value))
    return { ok: true, state: { route: value, position: 0, cleared: 0, extra: false, closed: false } };
  if (action === 'restart' && phase === 'resolved') return { ok: true, state: undefined };
  if (action === 'finish' && phase === 'summary' && ['archive', 'skip'].includes(value))
    return { ok: true, state: { ...state, closed: true } };
  if (phase !== 'field' && phase !== 'summary') return fail('Choisissez une approche avant d’intervenir.');
  if (action === 'move') {
    const next = route.path.indexOf(value);
    if (next >= 0 && Math.abs(next - state.position) === 1 && next <= state.cleared)
      return { ok: true, state: { ...state, position: next } };
    return fail('Ce passage exige une liaison accessible et un contrôle effectué.');
  }
  if (action === 'work' && state.position === state.cleared && value === currentNodeId)
    return { ok: true, state: { ...state, cleared: state.cleared + 1 } };
  if (action === 'optional' && !state.extra && currentNodeId === field.optional.nodeId)
    return { ok: true, state: { ...state, extra: true } };
  return fail('Cette action est indisponible depuis votre position.');
}
