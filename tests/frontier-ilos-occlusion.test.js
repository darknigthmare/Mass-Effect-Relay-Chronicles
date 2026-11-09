import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { WorldView } from '../src/world.js';
import { WORLD_ZONES } from '../src/world-data.js';
import { enemiesFor } from '../src/game-data.js';
import { newGame } from '../src/state.js';

test('the two retained Ilos spans expose the native first-enemy body sightline in combat without changing field geometry or collisions',()=>{
 const world=Object.create(WorldView.prototype);
 Object.assign(world,{stage:new THREE.Group(),materialCache:new Map(),animations:[],combatOccluders:[],colliders:[],zone:WORLD_ZONES.ilos,zoneId:'ilos',levelLayout:null,mode:'explore',keys:new Set(),actors:[],ambientActors:[],battleActors:new Map(),poiViews:[],cleared:new Set(),rand:()=>.5,_sign(){},_texturedMaterial(color){return this._material(color);}});
 world._ilos();const colliders=structuredClone(world.colliders),spans=[...world.combatOccluders];
 assert.equal(spans.length,2);assert.ok(spans.every(span=>span.userData.keep&&span.userData.combatOccluder));
 assert.deepEqual(spans.map(span=>span.position.toArray()),[[0,13,-9],[0,13,8]]);
 assert.ok(spans.every(span=>span.geometry.parameters.width===30&&span.geometry.parameters.height===1.3&&span.geometry.parameters.depth===3));
 world._mergeStatic();assert.ok(spans.every(span=>span.parent===world.stage));
 assert.equal(enemiesFor('ilos',0,newGame())[0].sprite,'stalker');
 // Native first-enemy staging uses x=arena.x+4, z=arena.z-2.9. This ray
 // samples its body envelope, not every alpha pixel of every possible pose.
 const point=new THREE.Vector3(world.zone.arena.x+4,1.2,world.zone.arena.z-2.9),direction=new THREE.Vector3(23,29,27).normalize();
 const ray=new THREE.Raycaster(point.clone().addScaledVector(direction,100),direction.clone().negate());
 const obstructions=()=>{world.stage.updateMatrixWorld(true);const meshes=[];world.stage.traverse(object=>{if(object.isMesh&&object.visible)meshes.push(object);});return ray.intersectObjects(meshes,false).filter(hit=>hit.distance<99.99);};
 assert.ok(obstructions().some(hit=>spans.includes(hit.object)),'The retained exploration bridge crosses the native first-enemy ray.');
 for(let cycle=0;cycle<2;cycle++){world.setMode('combat');assert.ok(spans.every(span=>!span.visible));assert.deepEqual(obstructions(),[]);world.setMode('explore');assert.ok(spans.every(span=>span.visible));}
 assert.deepEqual(world.colliders,colliders);
});
