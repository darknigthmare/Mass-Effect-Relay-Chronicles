// Display preferences belong to this device, independently of campaign saves.
// They never change actors, resources, timers, dialogue decisions or game rules.
export const DISPLAY_PREFERENCES_KEY = 'relay-chronicles.display.v1';
export const DEFAULT_DISPLAY_PREFERENCES = Object.freeze({ version: 1, quality: 'balanced', brightness: 1, effectIntensity: 1, highContrast: false });
export const DISPLAY_QUALITIES = Object.freeze({ economy: 'Économie', balanced: 'Équilibrée', high: 'Élevée' });
const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
const esc = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));

/** Only plain data is accepted, including when called directly in native tests. */
export function normalizeDisplayPreferences(raw) {
  if (raw === undefined) return { ...DEFAULT_DISPLAY_PREFERENCES };
  if (typeof raw === 'string') {
    if (raw.length > 3000) return null;
    try { raw = JSON.parse(raw); } catch { return null; }
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw) || ![Object.prototype, null].includes(Object.getPrototypeOf(raw))) return null;
  const keys = Reflect.ownKeys(raw), expected = Object.keys(DEFAULT_DISPLAY_PREFERENCES), descriptors = Object.getOwnPropertyDescriptors(raw);
  if (keys.length !== expected.length || keys.some(key => typeof key !== 'string' || !expected.includes(key)
    || !descriptors[key]?.enumerable || !own(descriptors[key], 'value'))) return null;
  if (raw.version !== 1 || !own(DISPLAY_QUALITIES, raw.quality) || typeof raw.highContrast !== 'boolean'
    || typeof raw.brightness !== 'number' || !Number.isFinite(raw.brightness) || raw.brightness < .65 || raw.brightness > 1.45
    || typeof raw.effectIntensity !== 'number' || !Number.isFinite(raw.effectIntensity) || raw.effectIntensity < 0 || raw.effectIntensity > 1) return null;
  return { version: 1, quality: raw.quality, brightness: raw.brightness, effectIntensity: raw.effectIntensity, highContrast: raw.highContrast };
}

export function getDisplayRenderProfile(preferences, devicePixelRatio = 1, baseExposure = 1.15) {
  const settings = normalizeDisplayPreferences(preferences); if (!settings) return null;
  const dpr = typeof devicePixelRatio === 'number' && Number.isFinite(devicePixelRatio) ? clamp(devicePixelRatio, .5, 4) : 1;
  const factor = settings.quality === 'economy' ? .75 : settings.quality === 'high' ? 1.25 : 1;
  const cap = settings.quality === 'economy' ? 1 : settings.quality === 'high' ? 2 : 1.75;
  return { pixelRatio: Math.min(dpr * factor, cap), exposure: (Number.isFinite(baseExposure) && baseExposure > 0 ? baseExposure : 1.15) * settings.brightness,
    shadows: settings.quality !== 'economy' };
}

export function getVisualAccessibilityPolicy(preferences, reducedMotion = false) {
  const settings = normalizeDisplayPreferences(preferences); if (!settings) return null;
  const reduced = reducedMotion === true;
  return { effectIntensity: settings.effectIntensity, reducedMotion: reduced,
    particles: !reduced && settings.effectIntensity > 0, hitTint: !reduced && settings.effectIntensity > .35,
    spriteShake: !reduced && settings.effectIntensity > .35, ambientPulse: !reduced && settings.effectIntensity > .35,
    textCues: true };
}

const previewParagraph = 'Commandante Éléonore, le relais a reçu le compte rendu de Jean-Baptiste : « l’équipe d’exploration rejoint la passerelle extérieure ». Les noms, apostrophes, accents — à, é, è, ê, ç, œ — et les mots longs restent lisibles. Vous pouvez lire ce texte à votre rythme, faire défiler la fenêtre puis rejoindre chaque réponse sans perdre votre réglage. Ce passage est un exemple d’affichage ; il ne prend aucune décision dans votre campagne.';
export const READABILITY_PREVIEW = Object.freeze({ speaker: 'Aperçu des sous-titres',
  text: Array.from({ length: 12 }, (_, index) => `${index + 1}. ${previewParagraph}`).join('\n\n'),
  choices: Object.freeze(['Revenir aux options.', 'Conserver les réglages actuels.', 'Le texte avec Éléonore et Jean-Baptiste est lisible.',
    'La navigation et les réponses restent accessibles.', 'Revenir après la lecture complète.', 'Dernière réponse : revenir aux options sans modifier la campagne.']) });

/** Parent owns the world and the settings screen. append renderSettings() there,
 * call applyCampaignSettings(state.settings), and use the normal dialogue API
 * for onReadabilityPreview. No private QA global is installed. */
export function createCompletionAccessibility({ world = null, document: doc = globalThis.document, window: win = globalThis.window,
  storage, devicePixelRatio = () => win?.devicePixelRatio || 1, onReadabilityPreview } = {}) {
  let disposed = false, reducedMotion = false, largeText = false, storageIssue = null;
  let preferences = { ...DEFAULT_DISPLAY_PREFERENCES };
  const baseExposure = Number.isFinite(world?.renderer?.toneMappingExposure) ? world.renderer.toneMappingExposure : 1.15;
  if (storage === undefined) try { storage = globalThis.localStorage; } catch { storage = null; storageIssue = 'Les préférences d’affichage ne sont pas disponibles sur cet appareil.'; }
  try {
    const raw = storage?.getItem?.(DISPLAY_PREFERENCES_KEY);
    if (raw !== null && raw !== undefined) {
      const normalized = normalizeDisplayPreferences(raw);
      if (normalized) preferences = normalized; else storageIssue = 'Les anciens réglages d’affichage sont illisibles. Les valeurs par défaut sont utilisées.';
    }
  } catch { storageIssue = 'Les préférences d’affichage ne peuvent pas être lues sur cet appareil.'; }
  function apply() {
    if (disposed) return;
    const render = getDisplayRenderProfile(preferences, typeof devicePixelRatio === 'function' ? devicePixelRatio() : devicePixelRatio, baseExposure);
    const policy = getVisualAccessibilityPolicy(preferences, reducedMotion);
    doc?.body?.classList?.add('completion-accessibility');
    doc?.body?.classList?.toggle('completion-high-contrast', preferences.highContrast);
    doc?.body?.classList?.toggle('completion-reduced-effects', reducedMotion || preferences.effectIntensity === 0);
    doc?.body?.classList?.toggle('reduced-motion', reducedMotion);
    doc?.body?.classList?.toggle('large-text', largeText);
    doc?.body?.style?.setProperty('--completion-effect-intensity', String(reducedMotion ? 0 : preferences.effectIntensity));
    if (doc?.body?.dataset) {
      doc.body.dataset.displayQuality = preferences.quality; doc.body.dataset.displayBrightness = String(preferences.brightness);
      doc.body.dataset.effectIntensity = String(preferences.effectIntensity); doc.body.dataset.reducedEffects = String(reducedMotion);
    }
    if (world) {
      world.visualAccessibility = policy;
      const renderer = world.renderer;
      if (renderer) {
        const currentRatio = renderer.getPixelRatio?.(); if (currentRatio !== render.pixelRatio) { renderer.setPixelRatio?.(render.pixelRatio); world.resize?.(); }
        renderer.toneMappingExposure = render.exposure;
        if (renderer.shadowMap) { const changed = renderer.shadowMap.enabled !== render.shadows; renderer.shadowMap.enabled = render.shadows; if (changed) renderer.shadowMap.needsUpdate = true; }
      }
    }
    for (const [key, value] of Object.entries({ brightness: `${Math.round(preferences.brightness * 100)} %`, effectIntensity: `${Math.round(preferences.effectIntensity * 100)} %`, quality: DISPLAY_QUALITIES[preferences.quality] })) {
      const output = doc?.querySelector?.(`[data-display-value="${key}"]`); if (output) output.textContent = value;
    }
  }
  function setPreference(key, value) {
    if (disposed || !['quality', 'brightness', 'effectIntensity', 'highContrast'].includes(key)) return { ok: false, reason: 'Réglage inconnu.' };
    const next = normalizeDisplayPreferences({ ...preferences, [key]: value });
    if (!next) return { ok: false, reason: 'Valeur de réglage invalide.' };
    if (JSON.stringify(next) === JSON.stringify(preferences)) return { ok: true, changed: false, preferences: { ...preferences } };
    preferences = next; apply(); let saved = typeof storage?.setItem === 'function';
    try { if (saved) { storage.setItem(DISPLAY_PREFERENCES_KEY, JSON.stringify(preferences)); storageIssue = null; }
      else storageIssue = 'Le réglage est appliqué pour cette session uniquement.'; }
    catch { saved = false; storageIssue = 'Le réglage est appliqué, mais ne peut pas être conservé sur cet appareil.'; }
    const status = doc?.querySelector?.('[data-display-status]'); if (status) status.textContent = storageIssue || 'Réglage appliqué immédiatement.';
    return { ok: true, changed: true, saved, preferences: { ...preferences } };
  }
  function renderSettings() {
    return `<section class="completion-display-settings" aria-labelledby="completion-display-title"><h3 id="completion-display-title">Confort visuel</h3><p class="small">Réglages propres à cet appareil, appliqués immédiatement.</p>
      <div class="setting-row"><label for="completion-quality">Qualité du rendu<small>Définition du rendu et ombres. La vitesse dépend de l’appareil.</small></label><select id="completion-quality" data-completion-display="quality">${Object.entries(DISPLAY_QUALITIES).map(([id, label]) => `<option value="${id}" ${preferences.quality === id ? 'selected' : ''}>${label}</option>`).join('')}</select></div>
      <div class="setting-row"><label for="completion-brightness">Luminosité du décor<small data-display-value="brightness">${Math.round(preferences.brightness * 100)} %</small></label><input id="completion-brightness" type="range" min=".65" max="1.45" step=".05" value="${preferences.brightness}" data-completion-display="brightness"></div>
      <div class="setting-row"><label for="completion-effects">Intensité des effets<small data-display-value="effectIntensity">${Math.round(preferences.effectIntensity * 100)} %</small></label><input id="completion-effects" type="range" min="0" max="1" step=".1" value="${preferences.effectIntensity}" data-completion-display="effectIntensity"></div>
      <div class="setting-row"><label for="completion-contrast">Contraste renforcé<small>Textes, cadres et contrôles plus marqués.</small></label><input id="completion-contrast" type="checkbox" ${preferences.highContrast ? 'checked' : ''} data-completion-display="highContrast"></div>
      <p class="small">Les messages, dégâts et états restent affichés quand les effets sont réduits ou coupés.</p><p class="completion-display-status" data-display-status role="status">${esc(storageIssue || '')}</p>
      <button class="secondary" data-completion-preview ${typeof onReadabilityPreview === 'function' ? '' : 'disabled'}>Tester la lisibilité des sous-titres</button></section>`;
  }
  function input(event) {
    const target = event.target, key = target?.dataset?.completionDisplay;
    if (!key) return;
    const value = key === 'highContrast' ? target.checked : ['brightness', 'effectIntensity'].includes(key) ? Number(target.value) : target.value;
    setPreference(key, value);
  }
  function click(event) { if (event.target?.closest?.('[data-completion-preview]')) onReadabilityPreview?.(READABILITY_PREVIEW); }
  function storageChanged(event) {
    if (event.key !== DISPLAY_PREFERENCES_KEY || event.storageArea && event.storageArea !== storage) return;
    const next = normalizeDisplayPreferences(event.newValue === null ? undefined : event.newValue); if (next) { preferences = next; apply(); }
  }
  doc?.addEventListener?.('input', input); doc?.addEventListener?.('change', input); doc?.addEventListener?.('click', click);
  win?.addEventListener?.('storage', storageChanged); apply();
  return {
    renderSettings, setPreference, getPreferences: () => ({ ...preferences }),
    applyCampaignSettings(settings = {}) { reducedMotion = settings.reducedMotion === true; largeText = settings.largeText === true; apply(); },
    getPolicy: () => getVisualAccessibilityPolicy(preferences, reducedMotion),
    dispose() { if (disposed) return; disposed = true; doc?.removeEventListener?.('input', input); doc?.removeEventListener?.('change', input); doc?.removeEventListener?.('click', click); win?.removeEventListener?.('storage', storageChanged); },
  };
}
