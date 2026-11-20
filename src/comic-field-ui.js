import { getComicField, listComicFields } from './comic-field.js';

const aspect = 1.65;

function fieldLinks(field) {
  const links = new Map();
  for (const route of field.routes) {
    for (let index = 1; index < route.path.length; index++) {
      const from = route.path[index - 1], to = route.path[index];
      const key = [from, to].sort().join('/');
      const selected = field.route?.id === route.id || links.get(key)?.selected;
      links.set(key, { from, to, selected });
    }
  }
  return [...links.values()];
}

function fieldMap(field, esc) {
  const nodes = new Map(field.nodes.map(node => [node.id, node]));
  const active = field.phase === 'field' || field.phase === 'summary';
  const path = field.route?.path || [];
  const position = field.state?.position ?? -1;
  const lines = fieldLinks(field).map(({ from, to, selected }) => {
    const start = nodes.get(from), end = nodes.get(to), dx = end.x - start.x, dy = (end.y - start.y) / aspect;
    const width = Math.hypot(dx, dy), angle = Math.atan2(dy, dx);
    return `<span aria-hidden="true" class="comic-field-line ${selected ? 'selected' : ''}"
      style="--x:${start.x}%;--y:${start.y}%;--length:${width}%;--angle:${angle}rad"></span>`;
  }).join('');
  const markers = field.nodes.map((node, index) => {
    const step = path.indexOf(node.id), current = step >= 0 && step === position, visited = step >= 0 && step < field.state.cleared;
    const reachable = active && step >= 0 && Math.abs(step - position) === 1 && step <= field.state.cleared;
    return `<button type="button" class="comic-field-marker ${visited ? 'visited' : ''}"
      style="--x:${node.x}%;--y:${node.y}%" data-comic-node="${esc(node.id)}" data-do="comic-field-move" data-id="${esc(node.id)}"
      aria-label="${esc(`Secteur ${index + 1} · ${node.label}`)}" ${current ? 'aria-current="location"' : ''}
      title="${esc(node.label)}" ${reachable ? '' : 'disabled'}>${index + 1}</button>`;
  }).join('');
  return `<div class="comic-field-map" role="group" aria-label="Carte des liaisons">${lines}${markers}</div>
    <ol class="comic-field-legend">${field.nodes.map(node => `<li>${esc(node.label)}</li>`).join('')}</ol>`;
}

function fieldDetails(field, esc) {
  if (field.phase === 'plan') return `<div class="comic-methods">
    ${field.routes.map(route => `<button class="secondary" data-do="comic-field-route" data-id="${esc(route.id)}">
      <strong>${esc(route.label)}</strong><small>${esc(route.detail)}</small></button>`).join('')}</div>`;
  if (field.phase === 'resolved') return `<div class="comic-summary" data-field-result><h5>${esc(field.result.title)}</h5>
    <p>${esc(field.result.text)}</p><button class="secondary" data-do="comic-field-restart">Rejouer l’intervention</button></div>`;
  const node = field.nodes.find(entry => entry.id === field.currentNodeId);
  const done = field.state.position < field.state.cleared;
  return `<div class="comic-field-location" data-field-position="${esc(node.id)}">
    <h5>${esc(node.label)}</h5><p>${esc(node.detail)}</p>
    <p role="status">${field.state.cleared} / ${field.route.path.length} contrôles effectués</p>
    ${done ? '' : `<button class="primary" data-do="comic-field-work" data-id="${esc(node.id)}">${esc(node.action)}</button>`}
    ${field.state.extra ? `<p data-field-extra>${esc(field.optional.text)}</p>`
      : field.optional.nodeId === node.id ? `<button class="secondary" data-do="comic-field-optional">${esc(field.optional.label)} · facultatif</button>` : ''}
  </div>
  ${field.phase === 'summary' ? `<div class="comic-summary">
    <details><summary>Lire le bilan</summary><h5>${esc(field.result.title)}</h5><p>${esc(field.result.text)}</p></details>
    <div class="button-row"><button class="primary" data-do="comic-field-finish" data-id="archive">Classer l’intervention</button>
    <button class="secondary" data-do="comic-field-finish" data-id="skip">Passer le bilan et classer</button></div>
  </div>` : ''}`;
}

export function renderComicFieldWorkspace(context, id, progress, { esc, journal }) {
  const field = id && getComicField(context, id, progress?.[id]);
  if (field) return `<article class="comic-briefing comic-field" data-comic-field="${esc(field.id)}" data-field-phase="${field.phase}" tabindex="-1">
    <div class="comic-header"><div><span class="comic-origin">Intervention · Adaptation</span><h4>${esc(field.title)}</h4><p>${esc(field.objective)}</p></div>
      <button class="secondary" data-do="comic-field-back">Liste des interventions</button></div>
    <div data-field-team>Équipe de l’exercice · ${esc(field.team.join(' et '))}</div>
    ${field.route ? `<p data-field-route="${esc(field.route.id)}">${esc(field.route.label)}</p>` : ''}
    ${fieldMap(field, esc)}
    ${fieldDetails(field, esc)}
    ${journal(field.anchors, true, esc, 'Intervention originale pour Relay Chronicles. Son bilan reste dans cette chronique.')}
    <div class="button-row"><button class="secondary" data-do="chronicle-export">Exporter la chronique</button></div>
  </article>`;
  const fields = listComicFields(context);
  if (!fields.length) return '';
  return `<section class="comic-field-list" data-comic-field-list><h4>Interventions de terrain</h4>
    <ul class="comic-list">${fields.map(entry => `<li><button class="secondary" data-do="comic-field-open" data-id="${esc(entry.id)}">
      <strong>${esc(entry.title)}</strong><small>${esc(entry.objective)}</small>
      ${progress?.[entry.id] ? `<span>${progress[entry.id].closed ? 'Classée' : 'En cours'}</span>` : ''}
    </button></li>`).join('')}</ul></section>`;
}
