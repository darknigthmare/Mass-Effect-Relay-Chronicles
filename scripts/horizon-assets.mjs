// Read-only asset inventory. A drawing count never grants gameplay access.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {sha} from './horizon-workbook-data.mjs';
export const ASSETS=Object.freeze([
  {key:'npcs',png:'horizon-npcs.png',config:'horizon-npcs.json',art:'horizon-characters-art.json',subjects:8,contexts:[{mediaId:'ME1',periodIds:['me1']}],
    usage:'Huit corps fixes de PNJ ME1 à Féros et à la Citadelle. Conversations françaises réécrites et présence conditionnelle ; quêtes, tenues et visages originaux incomplets.'},
  {key:'enemies',png:'horizon-enemies.png',config:'horizon-enemies.json',art:'horizon-enemies-art.json',subjects:5,contexts:[{mediaId:'ME1',periodIds:['me1']}],
    usage:'Cinq corps fixes de profils ennemis ME1, dans six formations adaptées. Projectiles, arcs de tir, locomotion et phases originales restent partiels ; aucune nouvelle famille de quatre poses.'},
  {key:'fleet-me1',png:'horizon-fleet-me1.png',config:'horizon-fleet-me1.json',art:'horizon-fleet-me1-art.json',subjects:4,contexts:[{mediaId:'ME1',periodIds:['me1']}],
    usage:'Quatre illustrations extérieures ME1 : Normandy SR-1, Sovereign, Destiny Ascension et transport geth. Projections locales de reconnaissance avec socle et dossiers conditionnels ; aucun vaisseau physique miniaturisé, pilotage ou combat spatial.'},
  {key:'fleet-later',png:'horizon-fleet-later.png',config:'horizon-fleet-later.json',art:'horizon-fleet-later-art.json',subjects:4,
    contexts:[{mediaId:'ME2',periodIds:['me2']},{mediaId:'ME3',periodIds:['me3']},{mediaId:'MEA',periodIds:['mea','mea-prologue']}],
    usage:'Quatre illustrations de coques dans leurs dossiers éligibles : Normandy SR-2 Cerberus ME2, Alliance ME3, Tempest et Hyperion Andromeda. Statuts des grands chantiers et accès narratifs inchangés.'},
  {key:'fauna',png:'horizon-fauna.png',config:'horizon-fauna.json',art:'horizon-fauna-art.json',subjects:8,
    contexts:[{mediaId:'ME1',periodIds:['me1']},{mediaId:'ME2',periodIds:['me2']},{mediaId:'MEA',periodIds:['mea']}],
    usage:'Huit corps de faune fixes. Varren, alpha et créature passive d’Eden Prime apparaissent en ME1 ; cinq autres corps restent des références de leur période. Pas de nouvel animal adopté ou de combat de Dévoreur livré.'},
]);
export const FEATURE_SOURCES=Object.freeze([
  'src/horizon-characters.js','src/horizon-enemies.js','src/horizon-fleet.js','src/horizon-fauna.js','src/horizon-layout-data.js','src/horizon-scene.js',
  'src/horizon-ui.js','src/horizon-ui.css','src/horizon-archive-ui.js','src/horizon-reference-visuals.js','src/horizon-fleet-reference.js',
  'src/story-data.js','src/story.js','src/game-data.js','src/frontier-enemies.js','src/operation-data.js','src/operations.js','src/world-data.js','src/level-layout-data.js',
  'src/world.js','src/main.js','src/universe-ui.js','vite.config.js',
]);
export async function readAssets(root){
  const families=[],sourceHashes={};
  for(const definition of ASSETS){
    const pngPath=`public/assets/${definition.png}`,configPath=`public/assets/${definition.config}`,artPath=`docs/qa/${definition.art}`;
    const raw=await fs.readFile(path.join(root,pngPath)),configRaw=await fs.readFile(path.join(root,configPath)),artRaw=await fs.readFile(path.join(root,artPath));
    assert.equal(raw.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.equal(raw[25],6,`${pngPath}: expected native RGBA`);
    const width=raw.readUInt32BE(16),height=raw.readUInt32BE(20),config=JSON.parse(configRaw),art=JSON.parse(artRaw);
    assert.equal(config.file,definition.png);assert.equal(config.width,width);assert.equal(config.height,height);assert.equal(Object.keys(config.frames).length,definition.subjects);
    assert.equal(art.passed,true,artPath);assert.equal(art.sha256,sha(raw),artPath);assert.equal(art.nativeCopyVerified,true,artPath);
    assert.equal(art.pixelEditingApplied,false,artPath);assert.equal(art.actuallyOpened,true,artPath);
    families.push({...definition,pngPath,configPath,artPath,width,height,sha256:sha(raw),config});
    for(const[filename,bytes]of[[pngPath,raw],[configPath,configRaw],[artPath,artRaw]])sourceHashes[filename]=sha(bytes);
  }
  const localModules=(await fs.readdir(path.join(root,'src'))).filter(name=>/^horizon-.*\.(js|css)$/.test(name)).map(name=>`src/${name}`);
  for(const filename of new Set([...FEATURE_SOURCES,...localModules]))sourceHashes[filename]=sha(await fs.readFile(path.join(root,filename)));
  return {families,sourceHashes};
}
