import * as THREE from 'three';
import { ITEMS } from './loadout.js';

// Original holstered silhouettes. Each family has a different profile and
// length. They represent the game's handling categories at exploration scale.
const silhouettes = {
  pistol: { length: .49, outline: 'M13 8H46L52 13V23H30L26 42H15L19 23H9V15Z', accent: '#76cedb' },
  assault: { length: .86, outline: 'M5 15H24L30 8H54L59 13H72V22H57L53 26H44L41 39H33L35 25H26L17 33H7Z', accent: '#d0ae82' },
  shotgun: { length: .91, outline: 'M5 11H28L34 6H65V10H76V24H64V28H39L34 38H24L26 26H6Z', accent: '#dba982' },
  sniper: { length: 1.04, outline: 'M5 16H27L31 11H38V5H55V11H61L66 16H78V21H65L59 26H44L41 36H31L33 25H25L18 32H6Z', accent: '#9fc4ed' },
};

const carryPoses = {
  front: { side: 1, hip: .16, tilt: .26 },
  back: { side: -1, hip: .17, tilt: -.33 },
  right: { side: -1, hip: .13, tilt: -.24 },
  left: { side: 1, hip: .13, tilt: .24 },
};

export function getCarriedWeapon(weaponItemId) {
  const item = typeof weaponItemId === 'string' && Object.hasOwn(ITEMS, weaponItemId) ? ITEMS[weaponItemId] : null;
  if (item?.kind !== 'weapon') return null;
  const silhouette = silhouettes[item.weaponType];
  return { ...silhouette, id: item.id, family: item.weaponType, level: item.level, length: silhouette.length * (1 + (item.level - 1) * .015) };
}

function makeTexture({ outline, accent, id, level }) {
  const canvas = document.createElement('canvas');
  canvas.width = 160;
  canvas.height = 96;
  const ctx = canvas.getContext('2d');
  ctx.scale(2, 2);
  const shape = new Path2D(outline);
  const metal = ctx.createLinearGradient(0, 4, 0, 36);
  metal.addColorStop(0, '#acbbc4');
  metal.addColorStop(.24, '#536c7b');
  metal.addColorStop(1, '#17232d');
  ctx.fillStyle = metal;
  ctx.strokeStyle = '#131c24';
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.stroke(shape);
  ctx.fill(shape);
  ctx.save();
  ctx.clip(shape);
  ctx.fillStyle = '#20303a';
  ctx.fillRect(9, 20, 62, 5);
  ctx.fillStyle = accent;
  ctx.fillRect(23, 14, 21, 3);
  if (level > 1) {
    const vents = [1, 2, 4, 6, 7].indexOf(level);
    for (let vent = 0; vent < vents; vent++) ctx.fillRect(26 + vent * 4, 9, 2, 3);
  }
  ctx.restore();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.name = `carried-weapon:${id}`;
  return texture;
}

/** Attach a separate sprite plane to the present walking frame, never the
 * combat artwork. The parent owns disposal of the geometry, material and map. */
export function updateCarriedWeapon(actor, weapon, direction, walkingFrame) {
  const existing = actor.carriedWeapon;
  if (!weapon || !walkingFrame) {
    if (existing) existing.visible = false;
    return;
  }
  let layer = existing;
  if (!layer) {
    const material = new THREE.MeshBasicMaterial({
      transparent: true, alphaTest: .2, toneMapped: false, depthWrite: true,
    });
    material.userData.ownedMap = true;
    layer = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
    layer.name = 'carried-weapon';
    actor.body.add(layer);
    actor.carriedWeapon = layer;
  }
  if (layer.userData.itemId !== weapon.id) {
    layer.material.map?.dispose();
    layer.material.map = makeTexture(weapon);
    layer.material.needsUpdate = true;
    layer.userData.itemId = weapon.id;
    layer.userData.family = weapon.family;
  }
  const { side, hip, tilt } = carryPoses[direction] || carryPoses.front;
  const { width, height } = actor.body.geometry.parameters;
  const parentScale = actor.body.scale;
  // The barrel points down, so the dominant scale factors are swapped relative
  // to the upright walking frame.
  const length = weapon.length, thickness = length * .6;
  layer.position.set(side * width * hip, -height * .07, .028);
  layer.rotation.z = -Math.PI / 2 + tilt;
  layer.scale.set(length / parentScale.y, thickness / parentScale.x, 1);
  layer.visible = true;
}
