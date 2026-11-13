import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
export const BASE_COMMIT = '259d51267a64404048c1e18a1e549f5a356b63c6';
export const GLOBAL_PROOF = 'docs/qa/priority-report.json';
export const sha = bytes => createHash('sha256').update(bytes).digest('hex');

export const IMMUTABLE_FIELDS = Object.freeze(['id', 'category', 'name', 'episode', 'scope', 'canonLevel',
  'reference', 'sourceId', 'sourceUrl', 'acceptance', 'dependencies', 'priority', 'plannedPath']);
export const WORKBOOK_FIELDS = Object.freeze(['id', 'name', 'status', 'assetStatus', 'priority', 'episode', 'canonLevel',
  'description', 'acceptance', 'dependencies', 'plannedPath', 'assetPath', 'gameKey', 'reference', 'sourceUrl', 'scope', 'notes']);
export const PRIORITY_FEATURE_SOURCES = Object.freeze([
  'src/simulation-clock.js', 'src/tactical-positions.js', 'src/tactical-ui.js', 'src/priority-ui.css',
  'src/campaign-talents.js', 'src/campaign-talents-ui.js', 'src/campaign-talents.css',
  'src/gamepad-controls.js', 'src/gamepad-controls.css', 'src/mission-progress.js', 'src/mission-progress-ui.js', 'src/boss-phases.js',
  'src/combat.js', 'src/game-data.js', 'src/loadout.js', 'src/loadout-ui.js', 'src/customization-ui.js',
  'src/main.js', 'src/state.js', 'src/world.js',
  'src/world-data.js', 'src/level-layout-data.js', 'src/horizon-layout-data.js', 'src/frontier-layout-data.js',
  'src/operation-data.js', 'src/universe-equipment.js',
]);
export const CORRECTION_IDS = Object.freeze([
  ...['eden-prime', 'therum', 'feros', 'noveria', 'virmire', 'ilos', 'citadel-finale'].flatMap(zone => [1, 2, 3].map(index => `ENC-${zone}-${index}`)),
  'SYS-journal-de-mission', 'SYS-preparations-chroniques',
]);

// Call only after the gameplay owners freeze their data and gates. This repairs
// descriptive drift without changing acceptance criteria or content status.
export async function describeCurrentFormations(catalogue) {
  const [{ ENCOUNTERS, CHAPTERS, ENEMIES }, { OPERATIONS }, { UNIVERSE_EQUIPMENT }, { createBossPhasePlan }] = await Promise.all([
    import('../src/game-data.js'), import('../src/operation-data.js'), import('../src/universe-equipment.js'), import('../src/boss-phases.js'),
  ]);
  const replacements = {}, formations = [];
  for (const [zone, entries] of Object.entries(ENCOUNTERS)) for (const [index, profiles] of entries.entries()) {
    const id = `ENC-${zone}-${index + 1}`;
    if (!catalogue.entries.some(entry => entry.id === id)) throw Error(`Missing stable encounter record: ${id}`);
    let description = `Rencontre ATB ${index + 1} du chapitre ${CHAPTERS[zone].name}. Composition courante des profils : ${profiles.join(', ')}.`;
    const actors = profiles.map((key, serial) => ({ ...ENEMIES[key], id: `${key}-${serial}`, team: 'enemy', maxHp: ENEMIES[key].hp, maxShield: ENEMIES[key].shield }));
    const plan = createBossPhasePlan(actors, { enabled: true });
    const phasePlan = plan ? { profileId: plan.state.profileId, phaseCount: plan.state.phaseCount,
      reinforcementSlots: plan.state.reinforcementIds.length, neuralNodeSlots: plan.state.nodeIds.length } : null;
    if (phasePlan) {
      description = `Rencontre ATB ${index + 1} du chapitre ${CHAPTERS[zone].name}. Profils de base : ${profiles.join(', ')}. `
        + (phasePlan.profileId === 'benezia' ? `En campagne, séquençage adapté : ${phasePlan.reinforcementSlots} vagues asari, puis Bénézia vulnérable.`
          : `En campagne, budgets répartis en ${phasePlan.neuralNodeSlots} objectifs neuraux et ${phasePlan.reinforcementSlots} renforts successifs, selon un séquençage ATB adapté.`);
    }
    replacements[id] = { description };
    formations.push({ id, zone, index, profiles: [...profiles], phasePlan });
  }
  if (formations.length !== 21) throw Error('This fixed-record scope must retain the twenty-one campaign encounters.');
  if (formations.filter(formation => formation.phasePlan).map(formation => formation.id).sort().join('|') !== 'ENC-feros-3|ENC-noveria-3') {
    throw Error('The two implemented boss plans must be represented explicitly before synchronizing their encounter descriptions.');
  }
  replacements['SYS-journal-de-mission'] = {
    description: `Missions, Assignations et Rapports. Trois assignations historiques et ${OPERATIONS.length} opérations supplémentaires, avec progression, blocages, choix, récompenses et suivi.`,
  };
  const supportedEquipment = UNIVERSE_EQUIPMENT.filter(entry => entry.runtimeSupported).length;
  const old = catalogue.entries.find(entry => entry.id === 'SYS-preparations-chroniques');
  if (!old?.notes.includes('100 équipements')) throw Error('The exact old equipment note must be reviewed before replacing its count.');
  replacements[old.id] = { notes: old.notes.replace('100 équipements', `${supportedEquipment} équipements`) };
  return { replacements, formations, operationCount: OPERATIONS.length, supportedEquipment };
}

export async function readFeatureSources(root, filenames) {
  const result = {};
  for (const filename of [...new Set(filenames)]) {
    const resolved = path.resolve(root, filename);
    if (!resolved.startsWith(path.resolve(root) + path.sep)) throw Error(`Outside source path: ${filename}`);
    result[filename] = sha(await fs.readFile(resolved));
  }
  return result;
}
