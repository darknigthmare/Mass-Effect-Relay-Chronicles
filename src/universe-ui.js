import { getUniversePortrait } from './universe-portraits.js';
import { getUniverseVisual } from './universe-visuals.js';
import { getUniverseAmmoProfile } from './universe-ammo.js';
import { isSummon } from './combat-summons.js';
const escapeDefault = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const GROUPS = [['all', 'Tout'], ['actors', 'Personnages'], ['equipment', 'Équipement'], ['powers', 'Pouvoirs'], ['story', 'Récits et lieux']];
const GALAXIES = { 'milky-way': 'Voie lactée', andromeda: 'Andromède', unknown: 'Lieu non fixé' };
const KINDS = { game: 'Jeu', 'mobile-game': 'Jeu mobile', novel: 'Roman', comic: 'Comic', anthology: 'Anthologie', collection: 'Collection', 'in-universe-fiction': 'Fiction dans l’univers', speculative: 'Référence', 'cut-content': 'Contenu coupé', film: 'Film' };
const percent = (value, max) => Math.max(0, Math.min(100, value / Math.max(1, max) * 100));
const initials = name => String(name || '?').split(/\s+/).map(part => part[0]).slice(0, 2).join('').toUpperCase();
const sameContext = (a, b) => !!a && !!b && a.mediaId === b.mediaId && a.periodId === b.periodId && a.galaxy === b.galaxy;
const safeURL = value => { try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) ? url.href : null; } catch { return null; } };

function contextRecord(record, context) {
  return !!context && record.availability?.some(scope => scope.mediaId === context.mediaId && scope.periodIds?.includes(context.periodId));
}
function sourceLinks(record, work, esc) {
  const ids = record.sourceIds || record.provenance?.sourceIds || [];
  return ids.map(id => {
    const source = work.sources?.find(item => item.id === id), url = safeURL(source?.url || record.sourceUrl);
    return url ? `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(source?.title || id)}</a>` : `<span>${esc(source?.title || id)}</span>`;
  }).join(' · ') || (safeURL(record.sourceUrl) ? `<a href="${esc(safeURL(record.sourceUrl))}" target="_blank" rel="noopener noreferrer">Consulter la source</a>` : 'Source à préciser');
}
function recordDetail(record, work, esc, view) {
  if (!record) return '<p class="universe-empty">Choisissez une fiche pour consulter ses références.</p>';
  return `<article class="universe-record-detail" data-universe-record="${esc(record.id)}"><div class="universe-badges"><span class="pill">Référence</span><span class="pill">${esc(record.nature || record.canonLevel || 'À vérifier')}</span></div><h3>${esc(record.name)}</h3>${referenceVisual(record, view, esc)}<p class="universe-record-description">${esc(record.description)}</p>${record.conditions ? `<p class="universe-record-condition">${esc(record.conditions)}</p>` : ''}<dl class="universe-provenance"><div><dt>Œuvre</dt><dd>${esc(work.title)}</dd></div><div><dt>Repère</dt><dd>${esc(record.reference || record.provenance?.reference || 'Repère à préciser')}</dd></div><div><dt>Sources</dt><dd>${sourceLinks(record, work, esc)}</dd></div>${record.notes ? `<div><dt>Précisions</dt><dd>${esc(record.notes)}</dd></div>` : ''}<div><dt>Statut de la fiche</dt><dd>${esc(record.status || 'Référence')}</dd></div></dl></article>`;
}
export function renderUniverseReferenceResults(view, ui, options = {}) {
  const esc = options.esc || escapeDefault, work = view.works.find(item => item.id === ui.mediaId);
  const records = (view.records || []).filter(record => contextRecord(record, view.context));
  const selected = records.find(record => record.id === ui.recordId) || records[0], limit = ui.visibleCount || 30;
  if (!view.context || !work) return `<p class="universe-empty">${work?.reason ? esc(work.reason) : 'Choisissez une œuvre et un chapitre pour ouvrir ses références.'}</p>`;
  return `<p class="universe-reference-count" role="status">${records.length} fiche${records.length > 1 ? 's' : ''} de référence</p><div class="universe-reference-layout"><nav class="universe-record-list" aria-label="Fiches du chapitre">${records.slice(0, limit).map(record => `<button class="universe-record ${selected?.id === record.id ? 'active' : ''}" data-do="universe-record" data-id="${esc(record.id)}" data-record-id="${esc(record.id)}" aria-pressed="${selected?.id === record.id}"><strong>${esc(record.name)}</strong><span>${esc(record.category)} · Référence</span></button>`).join('') || '<p class="universe-empty">Aucune fiche ne correspond à cette recherche.</p>'}${records.length > limit ? '<button class="secondary universe-more" data-do="universe-more">Afficher davantage</button>' : ''}</nav>${recordDetail(selected, work, esc, view)}</div>`;
}
export function renderUniverseReferences(view, ui, options = {}) {
  const esc = options.esc || escapeDefault;
  if (!view.context) return renderUniverseReferenceResults(view, ui, { esc });
  return `<div class="universe-reference-tools"><label class="field" for="universe-search"><span>Rechercher dans ce chapitre</span><input id="universe-search" type="search" maxlength="300" value="${esc(ui.query || '')}" placeholder="Personnage, objet ou lieu" autocomplete="off"></label><nav class="universe-groups" aria-label="Types de références">${GROUPS.map(([id, label]) => `<button class="tab ${ui.group === id ? 'active' : ''}" data-do="universe-group" data-id="${id}" aria-pressed="${ui.group === id}">${label}</button>`).join('')}</nav></div><div id="universe-results">${renderUniverseReferenceResults(view, ui, { esc })}</div>`;
}

function actorVisual(actor, view, esc) {
  const visual = actorVisualEntry(actor, view);
  if (!visual) return `<span class="universe-initials" aria-hidden="true">${esc(initials(actor.name))}</span>`;
  if (visual.portrait) return atlasImage(visual.entry, actor.name, esc, 'chronicle-portrait', 'data-chronicle-portrait', actor.catalogId || actor.id);
  return `<span class="universe-visual-thumbnail">${atlasImage(visual.entry, actor.name, esc, 'universe-illustration', 'data-universe-visual', actor.catalogId || actor.id)}<span class="universe-visual-caption">Illustration de prototype</span></span>`;
}
function atlasImage(visual, name, esc, className, dataAttribute, recordId) {
  if (!visual || !Array.isArray(visual.sourceRect) || visual.sourceRect.length !== 4) return '';
  const [x, y, width, height] = visual.sourceRect;
  if (![x, y, width, height, visual.atlasWidth, visual.atlasHeight].every(Number.isFinite)
    || x < 0 || y < 0 || width <= 0 || height <= 0 || x + width > visual.atlasWidth || y + height > visual.atlasHeight
    || !/^\.\/assets\/[A-Za-z0-9._-]+\.png$/.test(visual.src)) return '';
  // Clip inside the cell even when the outer SVG letterboxes a wide subject.
  const box = visual.sourceRect.join(' ');
  return `<svg class="${className}" viewBox="${box}" overflow="hidden" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${esc(name)} · ${className === 'chronicle-portrait' ? 'portrait' : 'illustration'} de prototype" ${dataAttribute}="${esc(recordId)}"><svg x="${x}" y="${y}" width="${width}" height="${height}" viewBox="${box}" overflow="hidden" preserveAspectRatio="xMidYMid meet"><image href="${esc(visual.src)}" width="${visual.atlasWidth}" height="${visual.atlasHeight}"/></svg></svg>`;
}
function visualEntry(recordId, context, options) {
  return getUniverseVisual(recordId, context, options);
}
function actorVisualEntry(actor, view) {
  const recordId = actor.catalogId || actor.id, scenarioId = view.session?.scenarioId;
  const portrait = getUniversePortrait(recordId, view.context, scenarioId);
  if (portrait) return { portrait: true, entry: portrait };
  const entry = visualEntry(recordId, view.context, { usage: actor.team ? 'combat' : 'party', scenarioId });
  return entry ? { portrait: false, entry } : null;
}
function referenceVisual(record, view, esc, className = 'universe-reference-visual') {
  const portrait = getUniversePortrait(record.id, view.context), entry = portrait || visualEntry(record.id, view.context, { usage: 'reference' });
  if (!entry) return '';
  const image = atlasImage(entry, record.name, esc, portrait ? 'chronicle-portrait' : 'universe-illustration',
    portrait ? 'data-chronicle-portrait' : 'data-universe-visual', record.id);
  return image ? `<figure class="${className}">${image}<figcaption>Illustration de prototype · image fixe, modèle original non certifié.${entry.caption ? ` ${esc(entry.caption)}` : ''}</figcaption></figure>` : '';
}
function partialOpponent(actor, esc, live = false) {
  if (!Array.isArray(actor.missingMechanics) || !actor.missingMechanics.length) return '';
  const list = `<ul>${actor.missingMechanics.map(text => `<li>${esc(text)}</li>`).join('')}</ul>`;
  const attributes = `class="chronicle-opponent-limits" data-chronicle-opponent-limits="${esc(actor.catalogId || actor.id)}"`;
  // Combat cards refresh with the simulation. A static list stays readable
  // instead of repeatedly closing an expanded details element on each frame.
  return live ? `<div ${attributes}><p>Profil partiel · limites du combat</p>${list}</div>`
    : `<details ${attributes}><summary>Profil partiel · limites du combat</summary>${list}</details>`;
}
function oppositionBrief(scenario, esc) {
  if (!Array.isArray(scenario?.opponentLimitations) || !scenario.opponentLimitations.length) return '';
  return `<section class="universe-opponent-brief" aria-label="Profils partiels des adversaires">${scenario.opponentLimitations.map(enemy => `<article><strong>${esc(enemy.name)}</strong>${partialOpponent(enemy, esc)}</article>`).join('')}</section>`;
}
function ammoSelect(view, session, actor, esc) {
  const modes = view.ammoModesByActor?.[actor.id] || [];
  if (!modes.some(mode => mode.compatible || mode.selected)) return '';
  const selected = session.ammoModes?.[actor.id] || '';
  return `<label class="field universe-ammo-field" for="chronicle-ammo-${esc(actor.id)}"><span>Mode de munitions</span><select id="chronicle-ammo-${esc(actor.id)}" data-chronicle-ammo-mode data-actor-id="${esc(actor.id)}"><option value="">Aucun mode</option>${modes.map(mode => `<option value="${esc(mode.id)}" ${mode.id === selected ? 'selected' : ''} ${!mode.compatible ? 'disabled' : ''}>${esc(mode.name)}${mode.reason ? ` — ${esc(mode.reason)}` : ''}</option>`).join('')}</select></label><p class="universe-gear-note">Un seul mode actif. S’applique aux tirs de l’arme conventionnelle ; les pouvoirs et soutiens gardent leurs propres effets.</p>`;
}
function periodNotes(work, period, esc) {
  if (!period) return '';
  const year = period.yearStart == null ? 'Date non fixée' : `${period.yearStart}${period.yearEnd != null && period.yearEnd !== period.yearStart ? `–${period.yearEnd}` : ''}`;
  return `<details class="universe-period-notes"><summary>${esc(year)} · repères et sources</summary><p>${esc(period.reference || '')}</p>${period.uncertainty ? `<p>${esc(period.uncertainty)}</p>` : ''}<p>${sourceLinks({ sourceIds: period.sourceIds }, work, esc)}</p></details>`;
}
function gearSelect(view, session, actor, slot, esc) {
  const modSlot = ['weaponMod', 'weaponMod2'].includes(slot), itemSlot = modSlot ? 'weaponMod' : slot;
  const items = (view.gearByActorSlot?.[actor.id]?.[slot] || view.gearByActor?.[actor.id] || []).filter(item => item.slot === itemSlot), current = session.loadouts?.[actor.id]?.[slot] || '';
  const item = items.find(entry => entry.id === current), weaponStats = slot === 'weapon' ? view.actors?.[actor.id] : null;
  const compatible = entry => modSlot && Array.isArray(entry.compatibleSlots) ? entry.compatibleSlots.includes(slot) : entry.compatible !== false;
  const equippedMods = session.loadouts?.[actor.id];
  return `<label class="field universe-gear-field" for="chronicle-${esc(actor.id)}-${slot}"><span>${({ weapon: 'Arme d’essai', armor: 'Armure d’essai', weaponMod: 'Module d’arme · port 1', weaponMod2: 'Module d’arme · port 2' })[slot]}</span><select id="chronicle-${esc(actor.id)}-${slot}" data-chronicle-gear data-actor-id="${esc(actor.id)}" data-slot="${slot}"><option value="">${modSlot ? 'Aucun module' : 'Dotation de l’essai'}</option>${items.map(entry => `<option value="${esc(entry.id)}" ${current === entry.id ? 'selected' : ''} ${!compatible(entry) ? 'disabled' : ''}>${esc(entry.name)}${!compatible(entry) ? ` — ${esc(entry.slotReasons?.[slot] || entry.reason || 'Incompatible avec ce port')}` : ''}</option>`).join('')}</select></label>${item ? `<p class="universe-gear-note">${esc(item.description || '')}${item.weaponSystem === 'thermal-clip' ? ` · Chargeur ATB ${esc(weaponStats?.magazineCapacity ?? item.magazineCapacity)}, réserve ATB ${esc(weaponStats?.reserveAmmo ?? item.reserveAmmo)}${weaponStats?.weaponDamageMultiplier && weaponStats.weaponDamageMultiplier !== 1 ? ` · Dégâts des tirs ATB ${Math.round(weaponStats.weaponDamageMultiplier * 100)} %` : ''}` : ''}${item.weaponSystem === 'heat' ? ' · Chaleur : refroidissement sans recharge de clips' : ''}${item.weaponProfileId ? ` · ${esc(item.firingModelNote || '')}` : ''}${item.prototypeDetail ? ` · ${esc(item.prototypeDetail)}` : ''}${item.id === 'ME3-EQP-ULTRALIGHT' ? ' · Recharges de pouvoirs ×0,9 ATB · SMG ME3 conventionnelle uniquement. Aucun poids original reproduit.' : ''}</p>${referenceVisual(item, view, esc, 'universe-gear-visual')}` : ''}${slot === 'weapon' && (equippedMods?.weaponMod || equippedMods?.weaponMod2) ? '<p class="universe-gear-note universe-change-warning">Changer d’arme retire les modules de ses deux ports.</p>' : ''}`;
}
function actorLoadout(view, session, actor, esc) {
  const stats = view.actors?.[actor.id], builds = view.buildsByActor?.[actor.id] || [], selectedBuild = session.builds?.[actor.id] || 'default';
  const selected = builds.find(build => build.id === selectedBuild), powers = stats?.powers || selected?.powers || actor.powers || [];
  const missing = stats?.missingPowers || selected?.missingPowers || actor.missingPowers || [];
  const showMods = (view.gearByActor?.[actor.id] || []).some(item => item.slot === 'weaponMod') || session.loadouts?.[actor.id]?.weaponMod || session.loadouts?.[actor.id]?.weaponMod2;
  const powerLabel = id => view.actionLabels?.[id]?.label || view.actionLabels?.[id] || id;
  return `<article class="universe-party-loadout" data-chronicle-actor="${esc(actor.id)}"><h3>${esc(actor.name)}</h3>${actorVisualEntry(actor, view) ? `<div class="chronicle-portrait-detail">${actorVisual(actor, view, esc)}</div>` : ''}${stats ? `<p class="universe-character-stats">Santé ${stats.maxHp} · Boucliers ${stats.maxShield} · Puissance ${stats.attack} · Défense ${stats.defense}</p>` : ''}${builds.length ? `<label class="field universe-build-field" for="chronicle-build-${esc(actor.id)}"><span>Profil de combat</span><select id="chronicle-build-${esc(actor.id)}" data-chronicle-build data-actor-id="${esc(actor.id)}" ${builds.length === 1 ? 'disabled' : ''}>${builds.map(build => `<option value="${esc(build.id)}" ${build.id === selectedBuild ? 'selected' : ''}>${esc(build.name || build.label || build.id)}</option>`).join('')}</select></label>${selected?.description ? `<p class="universe-gear-note">${esc(selected.description)}</p>` : ''}${builds.length > 1 ? '<p class="universe-gear-note universe-change-warning">Changer de profil retire les équipements devenus incompatibles.</p>' : ''}` : ''}<p class="universe-powers" data-chronicle-powers>${powers.length ? `Capacités de l’essai : ${powers.map(id => esc(powerLabel(id))).join(' · ')}` : 'Aucune capacité supplémentaire dans ce profil.'}</p>${stats?.grenadeCapacity > 0 ? `<p class="universe-gear-note" data-chronicle-grenade-capacity>Réserve d’essai : ${stats.grenadeCapacity} charges de grenade par escarmouche. Aucun réapprovisionnement pendant le combat.</p>` : ''}${missing.length ? `<p class="universe-gear-note">Profil partiel · capacités non reproduites : ${esc(missing.join(', '))}</p>` : ''}${gearSelect(view, session, actor, 'weapon', esc)}${gearSelect(view, session, actor, 'armor', esc)}${ammoSelect(view, session, actor, esc)}${showMods ? `<div class="universe-module-ports">${gearSelect(view, session, actor, 'weaponMod', esc)}${gearSelect(view, session, actor, 'weaponMod2', esc)}</div>` : ''}</article>`;
}
function preparation(view, ui, esc) {
  const session = sameContext(view.session?.context, view.context) ? view.session : null;
  const scenarios = view.scenarios || [], selectedId = session?.scenarioId || ui.scenarioId || scenarios[0]?.id || '';
  const scenario = scenarios.find(item => item.id === selectedId);
  const narrative = scenario?.description || scenario?.summary || '';
  const description = Array.isArray(scenario?.opponentLimitations) ? narrative.split(' Limites de cet essai :')[0] : narrative;
  if (!scenarios.length) return '<div class="universe-preparing"><span class="pill">Chronique en préparation</span><p>Les références de ce chapitre sont consultables dans le registre.</p></div>';
  return `<div class="universe-scenario"><label class="field" for="chronicle-scenario"><span>Essai tactique</span><select id="chronicle-scenario">${scenarios.map(item => `<option value="${esc(item.id)}" ${item.id === selectedId ? 'selected' : ''}>${esc(item.title || item.name || item.id)}</option>`).join('')}</select></label>${description ? `<p class="brief-copy">${esc(description)}</p>` : ''}${oppositionBrief(scenario, esc)}<p class="universe-session-note">${scenario?.kind === 'equipment-workshop' ? 'Atelier d’équipement · préparation libre · acquisition d’origine non simulée' : scenario?.kind === 'specialist-workshop' ? 'Banc de personnages · conditions de l’extension préparées pour cet essai' : 'Essai tactique indépendant · valeurs de combat ATB'}</p><div class="button-row"><button class="primary" data-do="chronicle-start" ${view.context ? '' : 'disabled'}>${session ? 'Recommencer la préparation' : 'Préparer cette chronique'}</button><button class="secondary" data-do="chronicle-load">Reprendre la chronique enregistrée</button></div></div>${session ? `<section class="universe-party"><h3 class="section-label">Choisir le groupe</h3><div class="universe-roster">${(view.roster || []).map(actor => `<button class="universe-party-choice ${session.party.includes(actor.id) ? 'selected' : ''}" data-do="chronicle-party" data-id="${esc(actor.id)}" aria-pressed="${session.party.includes(actor.id)}">${actorVisual(actor, view, esc)}<strong>${esc(actor.name)}</strong><small>${esc(actor.role || actor.className || '')}</small></button>`).join('')}</div><p class="small">${session.party.length}/3 membres sélectionnés</p></section><section class="universe-party-loadouts">${session.party.map(id => {
    const actor = (view.roster || []).find(item => item.id === id);
    if (!actor) return '';
    return actorLoadout(view, session, actor, esc);
  }).join('')}</section><div class="universe-launch"><button class="primary" data-do="chronicle-battle" ${session.party.length ? '' : 'disabled'}>Commencer l’escarmouche</button><div class="button-row"><button class="secondary" data-do="chronicle-save">Enregistrer la chronique</button><button class="secondary" data-do="chronicle-export">Exporter la chronique</button></div></div>` : ''}`;
}
export function renderChronicleReading(view, ui, options = {}) {
  const esc = options.esc || escapeDefault, readings = (view.readings || []).filter(reading => sameContext(reading.context, view.context));
  if (view.battle && !view.battle.winner) return '<p class="universe-empty">La lecture reprend après le retour à la préparation.</p>';
  if (!view.context || !readings.length) return '<div class="universe-preparing"><span class="pill">Lecture en préparation</span><p>Les références disponibles pour ce chapitre se trouvent dans le registre.</p></div>';
  const reading = sameContext(view.session?.context, view.context) && view.reading && sameContext(view.reading.story?.context, view.context) && readings.some(item => item.id === view.reading.story.id) ? view.reading : null;
  const storyId = reading?.story.id || readings.find(item => item.id === ui.readingId)?.id || readings[0].id;
  return `<section class="universe-reading"><label class="field" for="chronicle-reading"><span>Parcours documentaire</span><select id="chronicle-reading">${readings.map(story => `<option value="${esc(story.id)}" ${story.id === storyId ? 'selected' : ''}>${esc(story.title)} · ${story.stepCount} étapes</option>`).join('')}</select></label><p class="universe-session-note">Lecture guidée · faits sourcés du récit</p>${reading ? `<article class="universe-reading-page" data-chronicle-reading="${esc(storyId)}" data-reading-index="${reading.index}"><div class="section-label">Étape ${reading.index + 1} / ${reading.total}</div><h3>${esc(reading.step.title)}</h3><p class="universe-reading-text">${esc(reading.step.text)}</p><dl class="universe-provenance"><div><dt>Repère</dt><dd>${esc(reading.step.reference)}</dd></div><div><dt>Sources</dt><dd>${reading.step.sources.map(source => { const url = safeURL(source.url); return url ? `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer" data-reading-source="${esc(source.id)}">${esc(source.title)}</a>` : `<span data-reading-source="${esc(source.id)}">${esc(source.title)}</span>`; }).join(' · ')}</dd></div></dl><nav class="universe-reading-pages" aria-label="Étapes du parcours"><button class="secondary" data-do="chronicle-page" data-index="${reading.previousIndex ?? 0}" ${reading.previousIndex === null ? 'disabled' : ''}>Étape précédente</button><span role="status">${reading.completed ? 'Dernière étape du parcours' : `${reading.index + 1} / ${reading.total}`}</span><button class="primary" data-do="chronicle-page" data-index="${reading.nextIndex ?? reading.index}" ${reading.nextIndex === null ? 'disabled' : ''}>Étape suivante</button></nav></article><div class="button-row"><button class="secondary" data-do="chronicle-save">Enregistrer la chronique</button><button class="secondary" data-do="chronicle-export">Exporter la chronique</button></div>` : '<button class="primary" data-do="chronicle-reading-open">Commencer la lecture</button>'}</section>`;
}
function unitCard(actor, view, esc) {
  return `<article class="chronicle-unit ${actor.team === 'party' ? 'party' : 'enemy'} ${actor.hp <= 0 ? 'defeated' : ''}" data-chronicle-unit="${esc(actor.id)}"><div class="chronicle-unit-title">${isSummon(actor) ? '<span class="chronicle-summon-symbol" aria-hidden="true">◉</span>' : actorVisual(actor, view, esc)}<div><strong>${esc(actor.name)}</strong><span data-chronicle-hp-label>${Math.ceil(actor.hp)} / ${actor.maxHp}</span></div></div><div class="bar"><span class="shield-fill" data-chronicle-stat="shield" style="width:${percent(actor.shield, actor.maxShield)}%"></span></div><div class="bar"><span class="hp-fill" data-chronicle-stat="hp" style="width:${percent(actor.hp, actor.maxHp)}%"></span></div>${actor.team === 'enemy' ? partialOpponent(actor, esc, true) : ''}${isSummon(actor) ? `<p class="small" data-chronicle-support-owner="${esc(actor.ownerId)}">Soutien autonome · <span data-chronicle-support-time>${Math.max(0, Math.ceil(actor.expiresAt - view.battle.elapsed))} s</span></p>` : actor.team === 'party' ? `<div class="bar"><span class="atb-fill" data-chronicle-stat="atb" style="width:${percent(actor.atb, 100)}%"></span></div><button class="tab ${view.selectedActorId === actor.id ? 'active' : ''}" data-do="chronicle-actor" data-id="${esc(actor.id)}" ${actor.hp <= 0 ? 'disabled' : ''}>Choisir</button>` : ''}</article>`;
}
export function renderChronicleBattle(view, ui, options = {}) {
  const esc = options.esc || escapeDefault, battle = view.battle;
  if (!battle || !sameContext(view.session?.context, view.context)) return '';
  const actor = battle.actors.find(item => item.id === view.selectedActorId), action = (view.actions || []).find(item => item.id === view.selectedActionId);
  const targets = battle.actors.filter(item => (action?.target === 'ally' || action?.target === 'allies') ? item.team === 'party' && !isSummon(item) : item.team === 'enemy');
  return `<section class="chronicle-combat" aria-label="Escarmouche ATB"><div class="chronicle-combat-head"><h3 id="chronicle-battle-status">${battle.winner ? battle.winner === 'party' ? 'Victoire' : 'Défaite' : view.paused ? 'Escarmouche en pause' : battle.waiting ? 'En attente d’ordres' : 'Escarmouche en cours'}</h3><div class="button-row">${battle.winner ? '' : `<button class="secondary" data-do="chronicle-pause">${view.paused ? 'Reprendre' : 'Pause'}</button>`}<button class="secondary" data-do="chronicle-preparation">Retour à la préparation</button></div></div>${battle.projectiles?.length ? `<p class="small" data-chronicle-projectiles>${battle.projectiles.length} projectile(s) en route · résolution après le vol</p>` : ''}<div class="chronicle-combat-units"><div class="chronicle-party-units">${battle.actors.filter(item => item.team === 'party' && !isSummon(item)).map(item => unitCard(item, view, esc)).join('')}</div><div class="chronicle-enemy-units">${battle.actors.filter(item => item.team === 'enemy').map(item => unitCard(item, view, esc)).join('')}</div></div>${battle.actors.some(item => item.team === 'party' && isSummon(item)) ? `<section class="chronicle-supports" aria-label="Soutiens autonomes">${battle.actors.filter(item => item.team === 'party' && isSummon(item)).map(item => unitCard(item, view, esc)).join('')}</section>` : ''}${battle.winner ? '<p class="brief-copy">Escarmouche terminée.</p>' : `<div class="chronicle-command"><h4>${esc(actor?.name || '')}</h4><p class="small">${actor?.weaponSystem === 'thermal-clip' ? `<span data-chronicle-ammo>${actor.ammo}/${actor.magazineCapacity} au chargeur · réserve ${actor.reserveAmmo}</span>` : `${Math.round(actor?.heat || 0)} % de chaleur`}${actor?.grenadeCapacity > 0 ? ` · <span data-chronicle-grenades>${actor.grenadeCharges}/${actor.grenadeCapacity} charges de grenade</span>` : ''}${actor?.channel ? `<span data-chronicle-channel> · Canalisation en cours (${Math.max(0, actor.channel.remaining).toFixed(1)} s) · Annuler pour interrompre</span>` : ''}${actor?.allowedAmmoProfileIds?.length ? `<span data-chronicle-ammo-mode-active> · Mode : ${esc(getUniverseAmmoProfile(actor.ammoModeId)?.name || 'aucun')}</span>` : ''} · ${battle.medigel} médi-gels</p><div class="chronicle-actions">${(view.actions || []).map(item => `<button class="action-button ${view.selectedActionId === item.id ? 'selected' : ''}" data-do="chronicle-action" data-id="${esc(item.id)}" ${!item.available || view.paused ? 'disabled' : ''}>${esc(item.label)}${item.reason || item.cooldownRemaining > 0 ? `<small>${esc(item.reason || `${Math.ceil(item.cooldownRemaining)} s`)}</small>` : ''}</button>`).join('')}</div><p class="chronicle-action-description">${esc(action?.reason || action?.description || 'Attendez une jauge ATB complète.')}</p><div class="chronicle-targets" aria-label="Cibles">${targets.map(item => `<button class="target" data-do="chronicle-target" data-id="${esc(item.id)}" ${item.hp <= 0 || !action?.available || view.paused ? 'disabled' : ''}>${esc(item.name)}</button>`).join('')}</div></div>`}<div class="chronicle-log" aria-live="polite">${battle.log.slice(-3).map(line => `<p>${esc(line)}</p>`).join('')}</div></section>`;
}
/** Pure rendering; main.js owns isolated chronicle sessions and combat. */
export function renderUniverseScreen(view, ui, options = {}) {
  const esc = options.esc || escapeDefault, works = view.works || [], work = works.find(item => item.id === ui.mediaId), period = work?.periods.find(item => item.id === ui.periodId);
  const busy = !!view.battle && !view.battle.winner;
  const references = !['session', 'reading'].includes(ui.tab), reading = ui.tab === 'reading';
  return `<div class="universe-workspace"><div class="universe-context-form"><label class="field" for="chronicle-media"><span>Œuvre</span><select id="chronicle-media" ${busy ? 'disabled' : ''}><option value="">Choisir une œuvre</option>${works.map(item => `<option value="${esc(item.id)}" ${item.id === ui.mediaId ? 'selected' : ''}>${esc(item.title)}${item.locked ? ' · Référence' : ''}</option>`).join('')}</select></label><label class="field" for="chronicle-period"><span>Chapitre ou période</span><select id="chronicle-period" ${!work?.periods.length || busy ? 'disabled' : ''}><option value="">Choisir un chapitre</option>${(work?.periods || []).map(item => `<option value="${esc(item.id)}" ${item.id === ui.periodId ? 'selected' : ''}>${esc(item.label)}</option>`).join('')}</select></label></div>${work ? `<div class="universe-context-title"><span class="eyebrow">${esc(KINDS[work.kind] || work.medium || 'Référence')} · ${esc(GALAXIES[work.galaxy] || 'Lieu non fixé')}</span><h3>${esc(work.title)}</h3>${period ? `<p>${esc(period.label)}</p>` : ''}${work.locked ? `<p class="universe-lock" role="status">${esc(work.reason)}</p>` : ''}${periodNotes(work, period, esc)}</div>` : '<p class="brief-copy universe-intro">Choisissez une œuvre et son chapitre pour consulter les références ou préparer un essai tactique disponible.</p>'}${view.feedback ? `<p class="universe-feedback ${view.feedback.error ? 'error' : ''}" role="${view.feedback.error ? 'alert' : 'status'}">${esc(view.feedback.text)}</p>` : ''}<nav class="tabs universe-tabs" aria-label="Sections des chroniques"><button class="tab ${references ? 'active' : ''}" data-do="universe-tab" data-id="references" aria-pressed="${references}">Registre</button><button class="tab ${!references && !reading ? 'active' : ''}" data-do="universe-tab" data-id="session" aria-pressed="${!references && !reading}">Essai tactique</button><button class="tab ${reading ? 'active' : ''}" data-do="universe-tab" data-id="reading" aria-pressed="${reading}" ${busy ? 'disabled' : ''}>Lecture</button><button class="secondary universe-import" data-do="chronicle-import" ${busy ? 'disabled' : ''}>Importer une chronique</button></nav><div id="universe-content">${references ? renderUniverseReferences(view, ui, { esc }) : reading ? renderChronicleReading(view, ui, { esc }) : view.battle ? `<div id="chronicle-battle-content">${renderChronicleBattle(view, ui, { esc })}</div>` : preparation(view, ui, esc)}</div></div>`;
}
