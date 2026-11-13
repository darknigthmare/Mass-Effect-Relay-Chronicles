import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { WorldView } from '../src/world.js';
import { BOSS_ANIMATION_IDS as IDS, BOSS_COMBAT_POSES as POSES, normalizeBossAnimation } from '../src/boss-animation-data.js';
import { newGame } from '../src/state.js';
import { actorFor, ENEMIES, ENCOUNTERS, enemiesFor } from '../src/game-data.js';
import { createBattle, performAction } from '../src/combat.js';
import { initialCustomization } from '../src/customization.js';

const raw = key => JSON.parse(readFileSync(new URL(`../public/assets/boss-${key}-animation.json`, import.meta.url)));
const texture = (width = 400, height = 200) => new THREE.Texture({ width, height });
const close = (actual, expected) => assert.ok(Math.abs(actual-expected) < 1e-8, `${actual} != ${expected}`);
function fixture() {
  const world = Object.create(WorldView.prototype);
  Object.assign(world, { commanderAppearance: 'male', commanderCustomization: initialCustomization(),
    actors: [], ambientActors: [], battleActors: new Map(), characterAnimations: {},
    scene: new THREE.Scene(), characters: new THREE.Group(), particles: new THREE.Group(),
    spriteCache: new Map(), customizationTextures: new Map(), textureCache: new Map(), materialCache: new Map(),
    assetErrors: [], atlases: { crew: texture(), enemy: texture(), npc: texture(), boss: texture(1024,1536) },
    camera: new THREE.OrthographicCamera(-20,20,15,-15,.1,500), cameraOffset: new THREE.Vector3(23,29,27),
    cameraTarget: new THREE.Vector3(), player: { x:0,z:0 }, zone: { arena:{ x:0,z:0 } }, mode:'combat',
    time:0, keys:new Set(), trail:[], effects:[], animations:[], poiViews:[], combatOccluders:[],
    cleared:new Set(), operationPois:[], renderer:{ render() {} }, getNearby() { return null; }, _walkable() { return true; } });
  for (const key of IDS) {
    const config = normalizeBossAnimation(key, raw(key)); world.characterAnimations[key] = config;
    world.atlases[`combat-${key}`] = texture(config.combat.width, config.combat.height);
  }
  world.scene.add(world.characters, world.particles); return world;
}
function nativeBattle(world, key) {
  const state = newGame({ classId:'soldier' });
  const battle = createBattle({ party:['shepard','ashley'].map(id => ({ ...actorFor(id,state), atb:100 })),
    enemies:[{ ...ENEMIES[key], id:`${key}-0`, atb:100 }], mode:'wait', seed:2183 });
  world.setBattle(battle);
  return { state,battle,native:battle.actors.find(actor => actor.team==='enemy'),view:world.battleActors.get(`${key}-0`) };
}
function frameMatches(world, actor, pose) {
  const frame = world.characterAnimations[actor.key].combat.frames[pose], atlas = world.atlases[`combat-${actor.key}`];
  const [x,y,w,h] = frame.rect, map = actor.body.material.map;
  assert.equal(actor.animationFrame, frame.id); assert.equal(map.image, atlas.image); assert.notEqual(map,atlas);
  close(map.repeat.x,w/atlas.image.width); close(map.repeat.y,h/atlas.image.height);
  close(map.offset.x,x/atlas.image.width); close(map.offset.y,1-(y+h)/atlas.image.height);
  const displayHeight=actor.height*frame.heightScale, displayWidth=displayHeight*w/h;
  close(actor.body.geometry.parameters.height*actor.body.scale.y,displayHeight);
  close(actor.body.geometry.parameters.width*actor.body.scale.x,displayWidth);
  close(actor.body.position.y+(.5-frame.pivot[1]/h)*displayHeight,.05);
  assert.equal(actor.body.rotation.z,0);
}

test('boss registrations load each exact combat family once and strip forged exploration metadata', t => {
  const world=fixture(), loads=[]; world.characterAnimations={};
  t.mock.method(world,'_loadAtlas',(name,url)=>loads.push({name,url}));
  for(const key of IDS) {
    const input=raw(key); input.file='boss-atlas.png'; input.frames=[{id:'forged-walk'}];
    assert.equal(world.registerCharacterAnimation(key,input),true);
    assert.equal(world.registerCharacterAnimation(key,input),true);
    assert.equal(world.characterAnimations[key].frames,undefined);
    assert.equal(world._animateCharacter({key},true,1,0),false);
  }
  assert.deepEqual(loads,IDS.map(key=>({name:`combat-${key}`,url:`./assets/boss-${key}-combat.png`})));
  assert.equal(world.registerCharacterAnimation('saren',raw('saren-final')),false);
  assert.equal(world.registerCharacterAnimation('ME3-BOSS-SAREN',raw('saren')),false);
});

test('all four families belong to real campaign encounters and keep their native actor IDs', () => {
  const state=newGame(), observed=new Set();
  for(const [zone,encounters] of Object.entries(ENCOUNTERS)) for(let index=0;index<encounters.length;index++)
    for(const native of enemiesFor(zone,index,state)) if(IDS.includes(native.sprite)) {
      const world=fixture(), actor={key:native.sprite,id:native.id,enemy:true,state:{...native,team:'enemy'}};
      assert.ok(world._combatAnimationConfig(actor),`${zone}:${native.id}`); observed.add(native.sprite);
    }
  assert.deepEqual([...observed].sort(),[...IDS].sort());
});

test('actual boss actions, hit priority and KO select all four poses without editing a save or adding powers', () => {
  for(const key of IDS) {
    const world=fixture(), {state,battle,native,view}=nativeBattle(world,key), beforeSave=structuredClone(state);
    const powers=[...native.powers]; world.update(0); frameMatches(world,view,'aim');
    const actionId=native.powers[0]||native.primaryAction||'shoot';
    const action=performAction(battle,{actorId:native.id,actionId,targetId:'shepard'}); assert.equal(action.ok,true);
    world.setBattle(battle); const afterAction={...structuredClone({...battle,_rng:null}),_rng:battle._rng};
    for(const event of action.events) world.playEvent(event); world.update(0);
    frameMatches(world,view,actionId==='shoot'?'aim':'power'); assert.deepEqual(battle,afterAction);
    world.playEvent({type:'damage',targetId:native.id});
    world.playEvent({type:'action',actorId:native.id,actionId:'shoot'}); world.update(0); frameMatches(world,view,'hit');
    // Explicit scratch-battle inputs exercise a real KO; canonical boss stats stay in ENEMIES.
    battle.actors.find(actor=>actor.id==='ashley').attack=5000; native.hp=1; native.shield=0;
    const damage=performAction(battle,{actorId:'ashley',actionId:'shoot',targetId:native.id}); assert.equal(damage.ok,true);
    assert.equal(native.hp,0); world.setBattle(battle);
    for(const event of damage.events) world.playEvent(event);
    world.playEvent({type:'action',actorId:native.id,actionId}); world.update(0); frameMatches(world,view,'down');
    assert.deepEqual(native.powers,powers); assert.deepEqual(state,beforeSave);
  }
});

test('wrong dimensions, foreign boss atlas, cross-period and party transitions cannot apply or retain boss crops', () => {
  for(const key of IDS) {
    const world=fixture(), {battle,native,view}=nativeBattle(world,key);
    world.update(0); frameMatches(world,view,'aim');
    const config=world.characterAnimations[key].combat, atlas=world.atlases[`combat-${key}`];
    atlas.image={width:config.width+1,height:config.height};
    assert.equal(world._applyAnimationFrame(view,`combat-${key}`,config.frames.aim),false);
    atlas.image={width:config.width,height:config.height};
    const other=IDS.find(id=>id!==key);
    assert.equal(world._applyAnimationFrame(view,`combat-${other}`,world.characterAnimations[other].combat.frames.aim),false);
    assert.equal(world._applyAnimationFrame(view,`combat-${key}`,{...config.frames.aim,rect:[-1,0,20,20]}),false);
    for(const patch of [{mediaId:'ME3'},{periodId:'me2'},{context:{mediaId:'MEA'}},{team:'party'}]) {
      const wrong={...native,...patch}; assert.equal(world._combatAnimationConfig(view,wrong),null);
    }
    native.mediaId='ME3'; world.setBattle(battle); world.update(0);
    assert.equal(view.animationFrame,null); assert.equal(view.body.material.map.image,world.atlases.boss.image);
    native.mediaId='ME1'; world.setBattle(battle); world.update(0); frameMatches(world,view,'aim');
  }
});
