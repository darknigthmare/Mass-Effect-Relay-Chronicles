// Authoring metadata only: five existing SPR records, without game-state changes.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';

export const BASE_COMMIT = '05d1f030dab0925d57d4ba8c5bdb9ccde8db1ad0';
export const SUBJECTS = Object.freeze({
  geth: { id: 'SPR-soldat-geth-ennemi', name: 'Soldat geth' },
  'geth-sniper': { id: 'SPR-sniper-geth-ennemi', name: 'Sniper geth' },
  'geth-destroyer': { id: 'SPR-destructeur-geth-ennemi', name: 'Destructeur geth' },
  husk: { id: 'SPR-husk-ennemi', name: 'Husk' },
  joker: { id: 'SPR-NPC-joker-assis', name: 'Joker assis' },
});
export const FIELD_COLUMNS = Object.freeze({ status: 'C', assetStatus: 'D', description: 'H', acceptance: 'I', assetPath: 'L', gameKey: 'M', notes: 'Q' });
export const sha = bytes => createHash('sha256').update(bytes).digest('hex');
export async function readSubject(root, key) {
  assert.ok(Object.hasOwn(SUBJECTS, key), `Unrecognized authoring subject: ${key}`);
  const joker = key === 'joker';
  const configPath = `public/assets/${joker ? 'joker-seated.json' : `enemy-${key}-animation.json`}`;
  const configBytes = await fs.readFile(path.join(root, configPath)), config = JSON.parse(configBytes);
  assert.equal(config.version, 1); assert.equal(config.characterId, key);
  assert.equal(config.mediaId, 'ME1'); assert.equal(config.periodId, 'me1'); assert.equal(config.status, 'Prototype');
  const data = joker ? config : config.combat, expectedFile = joker ? 'joker-seated.png' : `enemy-${key}-combat.png`;
  assert.equal(data.file, expectedFile); assert.equal(path.basename(data.file), data.file);
  assert.equal(data.width, 1536); assert.equal(data.height, 1024);
  if (!joker) assert.equal(data.direction, 'three-quarter');
  const poses = joker ? ['idle', 'pilot'] : ['aim', 'power', 'hit', 'down'];
  assert.deepEqual(Object.keys(data.frames).sort(), [...poses].sort());
  const assetPath = `public/assets/${expectedFile}`, imageBytes = await fs.readFile(path.join(root, assetPath));
  assert.deepEqual([...imageBytes.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.equal(imageBytes[24], 8); assert.equal(imageBytes[25], 6);
  assert.equal(imageBytes.readUInt32BE(16), data.width); assert.equal(imageBytes.readUInt32BE(20), data.height);
  const regions = poses.map(pose => {
    const frame = data.frames[pose], [x, y, w, h] = frame.rect || [], [px, py] = frame.pivot || [];
    assert.ok([x, y, w, h].every(Number.isInteger) && x >= 0 && y >= 0 && w > 0 && h > 0 && x + w <= data.width && y + h <= data.height);
    assert.ok([px, py].every(Number.isFinite) && px >= 0 && py >= 0 && px <= w && py <= h);
    assert.ok(typeof frame.id === 'string' && frame.id.length && Number.isFinite(frame.heightScale) && frame.heightScale > 0);
    return { ...frame, pose };
  });
  assert.equal(new Set(regions.map(frame => frame.id)).size, poses.length);
  return { key, ...SUBJECTS[key], joker, configPath, assetPath, config, data, regions,
    hashes: { [configPath]: sha(configBytes), [assetPath]: sha(imageBytes) } };
}
export function replacements(subject) {
  const { joker, key, name, assetPath } = subject;
  return { status: 'Prototype', assetStatus: 'Prototype',
    description: joker ? 'Deux dessins fixes de Joker ME1 assis au poste de pilotage : repos et geste de pilotage. La pose de repos remplace le mannequin debout dans le cockpit du Normandy.'
      : `${name} ME1 dispose de quatre poses clés fixes : visée, action, impact et hors combat.`,
    acceptance: joker ? 'Contrôler la pose assise au cockpit, le siège, les cadrages et la reprise. Le dessin pilot est distinct ; son existence seule ne valide pas une animation ou son affichage en jeu.'
      : 'Contrôler aim/power/hit/down en combat : cadrages, pieds ancrés, proportions, priorité du KO et identité ME1. Cycles, transitions et directions supplémentaires restent à produire.',
    assetPath, gameKey: joker ? 'NPC_KEYS.joker' : key,
    notes: joker ? 'Prototype dérivé du PNJ existant. Deux poses dessinées, sans cycle complet ; l’état idle est utilisé au cockpit, le dessin pilot ne vaut pas un second état jouable validé. Portraits et autres PNJ historiques conservés. Uniforme et ressemblance complète non certifiés 1:1. QA : docs/qa/me1-enemy-poses-report.json.'
      : 'Prototype dérivé de la silhouette de enemy-atlas.png, limité à ME1 et aux ennemis correspondants. Quatre poses fixes ; aucune attaque, statistique, arme équipée ou nouvelle identité accordée par les dessins. Géométrie originale, cycles et armes exactes restent incomplets. Fidélité 1:1 non validée. QA : docs/qa/me1-enemy-poses-report.json.',
  };
}
export function additions(subject) {
  return { implementationPaths: [subject.assetPath, subject.configPath, 'src/world.js', subject.joker ? 'src/joker-seated-data.js' : 'src/enemy-animation-data.js'],
    evidence: [`docs/research/me1-enemy-poses-${subject.key}.md`, `docs/qa/me1-enemy-poses-${subject.key}-art.json`,
      'docs/qa/me1-enemy-poses-world-report.json', 'docs/qa/me1-enemy-poses-report.json'] };
}
