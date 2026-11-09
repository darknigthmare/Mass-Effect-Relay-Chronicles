// Metadata inventory only: no rendering, image processing or gameplay claims.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {BOSSES,sha} from './frontier-workbook-data.mjs';
import {normalizeFrontierNPCAtlas} from '../src/frontier-characters.js';
import {normalizeFrontierEnemyAtlas} from '../src/frontier-enemies.js';
import {normalizeBossAnimation} from '../src/boss-animation-data.js';
import {normalizeMakoDirections} from '../src/frontier-vehicles.js';
export const ASSETS = Object.freeze([
  {key:'npcs',png:'frontier-npcs.png',config:'frontier-npcs.json',art:'frontier-characters-art.json',staticSubjects:7,
    usage:'ME1 : sept corps PNJ fixes pour trois membres du Normandy et quatre interlocuteurs de Port Hanshan ; Jenkins réutilise son corps historique. Dialogues réécrits et fonctionnalités partielles, sans certification des visages ou tenues 1:1.'},
  {key:'enemies',png:'frontier-enemies.png',config:'frontier-enemies.json',art:'frontier-enemies-art.json',staticSubjects:8,
    usage:'ME1 : huit corps ennemis fixes, présentés dans les rencontres ATB de campagne. Aucun cycle de quatre poses, vol, grimpe, roquette ou explosion originale livré par cette planche.'},
  ...BOSSES.map(([,key])=>({key,png:`boss-${key}-combat.png`,config:`boss-${key}-animation.json`,art:`frontier-boss-${key}-art.json`,combatPoses:4,
    usage:`ME1 : quatre poses fixes du boss ${key} existant ; visée, action, impact et hors combat. Aucune nouvelle phase, statistique ou mécanique complète ; fidélité originale 1:1 non certifiée.`})),
  {key:'mako',png:'vehicle-mako-directions.png',config:'vehicle-mako-directions.json',art:'frontier-mako-art.json',directionalDrawings:4,
    usage:'ME1 : quatre vues fixes du Mako pour monter, conduire et descendre sur Thérum seulement. État transitoire, sans arme, saut, physique originale ni cycle de roues ; fidélité 1:1 non certifiée.'},
]);
export async function readAssets(root) {
  const families=[],sourceHashes={};
  for(const definition of ASSETS){
    const pngPath=`public/assets/${definition.png}`,configPath=`public/assets/${definition.config}`,artPath=`docs/qa/${definition.art}`;
    const raw=await fs.readFile(path.join(root,pngPath)),configRaw=await fs.readFile(path.join(root,configPath)),artRaw=await fs.readFile(path.join(root,artPath));
    assert.equal(raw.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.equal(raw[25],6,`${pngPath} needs native RGBA`);
    const width=raw.readUInt32BE(16),height=raw.readUInt32BE(20),config=JSON.parse(configRaw),art=JSON.parse(artRaw);
    const normalized=definition.key==='npcs'?normalizeFrontierNPCAtlas(config):definition.key==='enemies'?normalizeFrontierEnemyAtlas(config)
      :definition.key==='mako'?normalizeMakoDirections(config):normalizeBossAnimation(definition.key,config);
    assert.ok(normalized,`Native metadata rejected: ${configPath}`);
    const geometry=normalized.combat||normalized;assert.equal(geometry.width,width);assert.equal(geometry.height,height);
    assert.equal(Object.keys(geometry.frames).length,definition.staticSubjects||definition.combatPoses||definition.directionalDrawings);
    assert.equal(art.passed,true,artPath);assert.equal(art.sha256,sha(raw),`${artPath} must bind its PNG`);
    assert.equal(art.actuallyOpened,true,artPath);assert.equal(art.nativeCopyVerified,true,artPath);assert.equal(art.pixelEditingApplied,false,artPath);
    const regions=Object.entries(geometry.frames).map(([key,frame])=>({key,rect:[...frame.rect],status:'Prototype'}));
    families.push({...definition,pngPath,configPath,artPath,width,height,sha256:sha(raw),config,normalized,regions});
    for(const [filename,bytes]of[[pngPath,raw],[configPath,configRaw],[artPath,artRaw]])sourceHashes[filename]=sha(bytes);
  }
  for(const filename of ['src/frontier-characters.js','src/frontier-enemies.js','src/boss-animation-data.js','src/frontier-vehicles.js',
    'src/frontier-layout-data.js','src/frontier-scene.js','src/frontier-ui.js','src/frontier-ui.css','src/story-data.js','src/story.js','src/game-data.js','src/world-data.js','src/level-layout-data.js','src/world.js','src/main.js','vite.config.js'])
    sourceHashes[filename]=sha(await fs.readFile(path.join(root,filename)));
  return{families,sourceHashes};
}
