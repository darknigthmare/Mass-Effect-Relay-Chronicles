// The official ME1 manual describes OmniTechs and biotic amplifiers, not these
// generic models. Names, prices, stock and multipliers below are ATB adaptations.
const SOURCE_URL = 'https://eaassets-a.akamaihd.net/eahelp/manuals/mass-effect-manuals_PC_fr.pdf';
const canonicalStatus = 'Famille d’équipement décrite dans le manuel ME1 ; modèle générique, prix et effets adaptés au système ATB, sans rang ni fabricant d’origine certifié.';

const tool = (id, name, slot, cost, multiplier, detail) => Object.freeze({
  id, name, kind: slot, slot, manufacturer: 'Modèle générique', level: 1,
  cost, sell: Math.floor(cost * .4), stock: 3,
  bonuses: Object.freeze({ [slot === 'omniTool' ? 'techMultiplier' : 'bioticMultiplier']: multiplier }),
  detail, sourceUrl: SOURCE_URL, canonicalStatus,
});

export const TOOL_CATALOG = Object.freeze([
  tool('omni-tool-standard', 'OmniTech standard', 'omniTool', 80, 1,
    'Outil générique de base, sans bonus supplémentaire. N’accorde aucun pouvoir technologique.'),
  tool('biotic-amp-standard', 'Amplificateur biotique standard', 'bioticAmp', 80, 1,
    'Amplificateur générique de base, sans bonus supplémentaire. N’accorde aucun pouvoir biotique.'),
  tool('omni-tool-upgraded', 'OmniTech amélioré', 'omniTool', 240, 1.15,
    'Renforce de 15 % uniquement les capacités technologiques déjà disponibles. Effet adapté au système ATB ; n’accorde aucun pouvoir supplémentaire.'),
  tool('biotic-amp-upgraded', 'Amplificateur biotique amélioré', 'bioticAmp', 240, 1.15,
    'Renforce de 15 % uniquement les capacités biotiques déjà disponibles. Effet adapté au système ATB ; n’accorde aucun pouvoir supplémentaire.'),
]);

export const TOOL_IDS = Object.freeze(TOOL_CATALOG.map(item => item.id));
const toolsById = new Map(TOOL_CATALOG.map(item => [item.id, item]));
export const getTool = id => typeof id === 'string' ? toolsById.get(id) || null : null;
