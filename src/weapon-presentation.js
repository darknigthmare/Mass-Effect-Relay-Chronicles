import * as THREE from 'three';
import { ITEMS } from './loadout.js';

// Original procedural silhouettes for the four handling families.
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

// Atlas coordinates on the armed poses. The masks end at the trigger and
// support gloves, keeping the hands and their shading intact.
const combatMounts = {
  'shepard-combat-aim': {
    rect: [222, 9, 430, 527], grip: [477, 142],
    mask: 'M378 97 L442 95 L456 86 L492 83 L545 75 L581 78 L592 91 L650 93 L652 123 L638 137 L564 140 L554 127 L537 124 L523 128 L510 138 L487 131 L474 129 L454 134 L435 133 L411 138 L381 134 Z',
  },
  'femshep-combat-aim': {
    rect: [214, 19, 436, 549], grip: [470, 156],
    mask: 'M362 112 L430 105 L450 105 L467 94 L477 88 L532 88 L538 101 L633 102 L649 112 L649 139 L633 140 L626 152 L558 152 L552 139 L538 132 L525 138 L511 146 L490 145 L476 144 L454 146 L408 145 L367 152 Z',
  },
  'ashley-combat-aim': {
    rect: [188, 6, 446, 565], grip: [420, 144],
    mask: 'M313 97 L400 94 L412 77 L519 76 L526 88 L603 91 L630 95 L631 113 L613 115 L610 132 L535 137 L528 124 L504 115 L488 123 L477 143 L448 144 L438 130 L421 122 L397 126 L317 130 Z',
  },
  'ashley-combat-power': {
    rect: [910, 4, 431, 593], grip: [958, 290], angle: -1.82,
    mask: 'M970 227 L996 227 L1004 248 L985 310 L977 349 L962 395 L944 438 L936 460 L912 459 L913 438 L926 398 L931 359 L941 327 L948 310 L960 302 L963 282 L952 274 Z',
  },
  'ashley-combat-hit': {
    rect: [183, 573, 470, 432], grip: [267, 817], angle: -.72,
    mask: 'M249 765 L263 749 L279 755 L300 784 L329 806 L350 843 L368 889 L349 898 L333 874 L316 873 L293 843 L278 822 L271 805 L252 795 Z',
  },
  'ashley-combat-down': {
    rect: [786, 779, 689, 189], grip: [885, 930], angle: -.13,
    mask: 'M886 893 L914 888 L968 899 L992 907 L993 924 L1027 925 L1077 939 L1078 958 L1055 965 L1027 960 L998 965 L962 952 L916 944 L898 931 L910 920 L879 915 Z',
  },
  'kaidan-combat-aim': {
    rect: [191, 11, 421, 559], grip: [488, 145],
    mask: 'M453 113 L461 96 L500 89 L555 89 L566 98 L564 116 L555 139 L517 140 L507 130 L492 124 L469 126 L455 122 Z',
  },
  'kaidan-combat-power': {
    rect: [936, 11, 496, 583], grip: [986, 319], angle: -1.9,
    mask: 'M964 304 L982 307 L995 325 L989 347 L978 377 L966 407 L956 416 L940 410 L942 391 L950 363 L954 336 Z',
  },
  'kaidan-combat-hit': {
    rect: [168, 570, 490, 437], grip: [263, 826], angle: -.85,
    mask: 'M255 781 L270 773 L285 783 L299 810 L324 843 L324 872 L302 877 L290 858 L278 840 L276 818 L254 806 Z',
  },
  'kaidan-combat-down': {
    rect: [773, 778, 700, 187], grip: [890, 932], angle: -.18,
    mask: 'M903 896 L928 895 L968 906 L1000 920 L1036 930 L1035 952 L1020 962 L998 953 L971 950 L927 942 L916 931 L900 922 Z',
  },
  'garrus-combat-aim': {
    rect: [209, 8, 451, 534], grip: [413, 184], angle: -.09,
    mask: 'M333 137 L412 131 L461 126 L509 129 L555 135 L557 148 L588 152 L654 161 L652 182 L596 186 L574 178 L552 188 L521 188 L514 173 L490 166 L474 174 L457 177 L437 167 L400 165 L350 173 L333 167 Z',
  },
  'tali-combat-aim': {
    rect: [177, 2, 479, 559], grip: [480, 164],
    mask: 'M422 130 L452 116 L471 103 L495 100 L537 98 L556 104 L624 102 L650 111 L650 136 L639 151 L551 158 L544 138 L529 129 L511 136 L503 150 L486 151 L460 144 L431 148 Z',
  },
  'liara-combat-aim': {
    rect: [202, 3, 335, 532], grip: [469, 111], angle: .04,
    mask: 'M445 77 L454 66 L497 62 L526 62 L531 71 L532 90 L502 96 L490 108 L479 101 L458 94 L445 92 Z',
  },
  'wrex-combat-aim': {
    rect: [175, 0, 477, 515], grip: [454, 225], angle: -.04,
    mask: 'M370 170 L408 165 L443 158 L500 153 L560 158 L618 162 L648 170 L647 205 L634 225 L589 229 L582 215 L565 200 L532 198 L522 211 L494 218 L481 209 L447 203 L393 198 L369 187 Z',
  },
  'jenkins-combat-aim': {
    rect: [183, 7, 341, 534], grip: [380, 134],
    mask: 'M299 99 L357 94 L372 91 L377 78 L457 77 L464 89 L513 93 L518 108 L512 128 L470 134 L463 120 L447 112 L432 117 L424 130 L405 133 L393 122 L368 118 L316 128 L299 121 Z',
  },
  'jenkins-combat-power': {
    rect: [946, 7, 355, 536], grip: [985, 310], angle: -1.78,
    mask: 'M1001 243 L1027 245 L1032 278 L1019 312 L1008 367 L990 400 L973 443 L950 440 L955 408 L964 371 L972 348 L983 327 L992 305 L995 279 Z',
  },
  'jenkins-combat-hit': {
    rect: [163, 554, 419, 457], grip: [306, 719], angle: -.27,
    mask: 'M233 666 L279 663 L321 665 L372 673 L406 696 L431 701 L430 716 L417 724 L385 725 L373 710 L348 705 L329 708 L295 701 L266 693 L235 699 Z',
  },
  'jenkins-combat-down': {
    rect: [763, 785, 662, 193], grip: [845, 933], angle: -.16,
    mask: 'M850 901 L880 898 L917 905 L944 914 L944 929 L984 927 L1034 938 L1034 958 L1021 969 L980 970 L927 954 L888 951 L863 940 L873 925 L850 918 Z',
  },
};

const crewMounts = {
  ashley: {
    rect: [384, 0, 384, 512], grip: [537, 177], angle: -.51,
    mask: 'M508 127 L529 132 L570 148 L603 163 L632 187 L641 213 L631 229 L612 218 L604 206 L586 196 L572 181 L553 175 L541 165 L509 160 L498 147 Z',
  },
  kaidan: {
    rect: [768, 0, 384, 512], grip: [919, 193], angle: -.55,
    mask: 'M891 127 L914 138 L936 156 L971 177 L991 195 L1007 223 L1017 240 L1005 251 L989 243 L969 222 L945 214 L933 188 L916 175 L893 159 L882 143 Z',
  },
  jenkins: {
    rect: [1152, 0, 384, 512], grip: [1329, 189], angle: -.43,
    mask: 'M1282 131 L1306 137 L1341 157 L1365 158 L1390 172 L1418 186 L1446 221 L1437 242 L1417 239 L1396 224 L1378 216 L1362 201 L1348 187 L1327 174 L1299 165 L1279 150 Z',
  },
  garrus: {
    rect: [0, 512, 384, 512], grip: [203, 697], angle: -.55,
    mask: 'M172 636 L192 635 L220 652 L249 667 L271 692 L293 725 L326 752 L374 797 L373 813 L357 813 L332 787 L305 765 L281 744 L266 735 L250 711 L229 691 L206 681 L175 662 L166 652 Z',
  },
  tali: {
    rect: [384, 512, 384, 512], grip: [549, 684], angle: -.49,
    mask: 'M515 634 L544 640 L574 650 L604 666 L617 680 L647 706 L646 723 L630 731 L605 713 L587 699 L572 691 L554 674 L532 670 L511 652 Z',
  },
  wrex: {
    rect: [768, 512, 384, 512], grip: [950, 745], angle: -.47,
    mask: 'M902 687 L925 687 L960 699 L994 710 L1033 727 L1065 749 L1090 771 L1132 790 L1134 820 L1117 831 L1093 828 L1068 817 L1045 803 L1034 783 L1010 765 L980 752 L961 735 L929 730 L904 715 Z',
  },
  liara: {
    rect: [1152, 512, 384, 512], grip: [1422, 626], angle: .05,
    mask: 'M1410 595 L1420 587 L1462 585 L1469 592 L1469 608 L1458 617 L1437 614 L1430 621 L1416 618 L1407 610 Z',
  },
};
const aimGrips = {
  pistol: { grip: [.29, .64], muzzle: [.65, .33] },
  assault: { grip: [.44, .64], muzzle: [.9, .36] },
  shotgun: { grip: [.36, .64], muzzle: [.95, .35] },
  sniper: { grip: [.42, .64], muzzle: [.975, .37] },
};

export function getCarriedWeapon(weaponItemId) {
  const item = typeof weaponItemId === 'string' && Object.hasOwn(ITEMS, weaponItemId) ? ITEMS[weaponItemId] : null;
  if (item?.kind !== 'weapon') return null;
  const silhouette = silhouettes[item.weaponType];
  return { ...silhouette, id: item.id, family: item.weaponType, level: item.level, length: silhouette.length * (1 + (item.level - 1) * .015) };
}

export function getActorWeaponVisual({ weaponItemId, weaponType }) {
  if (weaponItemId !== null || !Object.hasOwn(silhouettes, weaponType)) return getCarriedWeapon(weaponItemId);
  return { ...silhouettes[weaponType], id: null, family: weaponType, level: 1 };
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
  texture.name = `carried-weapon:${id ?? 'base'}`;
  return texture;
}

// The parent owns disposal of the geometry, material and attached map.
function weaponLayer(actor, weapon) {
  let layer = actor.carriedWeapon;
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
  if (layer.userData.itemId !== weapon.id || layer.userData.family !== weapon.family) {
    layer.material.map?.dispose();
    layer.material.map = makeTexture(weapon);
    layer.material.needsUpdate = true;
    layer.userData.itemId = weapon.id;
    layer.userData.family = weapon.family;
  }
  layer.material.opacity = actor.body.material.opacity;
  layer.material.color.copy(actor.body.material.color);
  layer.visible = true;
  return layer;
}

export function updateCarriedWeapon(actor, weapon, direction, walkingFrame) {
  if (!weapon || !walkingFrame) {
    if (actor.carriedWeapon) actor.carriedWeapon.visible = false;
    return;
  }
  const layer = weaponLayer(actor, weapon);
  const { side, hip, tilt } = carryPoses[direction] || carryPoses.front;
  const { width, height } = actor.body.geometry.parameters;
  const parentScale = actor.body.scale;
  // The barrel points down, so the dominant scale factors are swapped relative
  // to the upright walking frame.
  const length = weapon.length, thickness = length * .6;
  layer.position.set(side * width * hip, -height * .07, .028);
  layer.rotation.z = -Math.PI / 2 + tilt;
  layer.scale.set(length / parentScale.y, thickness / parentScale.x, 1);
}

export function getCombatWeaponMount(frame) {
  const mount = frame && Object.hasOwn(combatMounts, frame.id) && combatMounts[frame.id];
  return mount && mount.rect.every((value, index) => value === frame.rect?.[index]) ? mount : null;
}

export function getCrewWeaponMount(key, crop) {
  if (!Object.hasOwn(crewMounts, key)) return null;
  const mount = crewMounts[key];
  return crop ? { ...mount, rect: [crop.x, crop.y, ...mount.rect.slice(2)] } : mount;
}

export function maskBakedWeapon(atlas, frame, mount, alreadyCropped = false) {
  const [x, y, width, height] = mount.rect;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  context.drawImage(atlas.image, alreadyCropped ? 0 : x, alreadyCropped ? 0 : y, width, height, 0, 0, width, height);
  context.translate(-x, -y);
  context.globalCompositeOperation = 'destination-out';
  context.fill(new Path2D(mount.mask));
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.userData.relayAnimationFrame = frame;
  texture.userData.weaponMount = mount;
  return texture;
}

export function updateHeldWeapon(actor, weapon, mount, aimed = false, lengthScale = 1) {
  if (!mount || !weapon) {
    if (actor.carriedWeapon) actor.carriedWeapon.visible = false;
    return;
  }
  const layer = weaponLayer(actor, weapon);
  const [x, y, width, height] = mount.rect;
  const geometry = actor.body.geometry.parameters;
  const model = aimGrips[weapon.family];
  const displayScale = actor.body.scale.y * geometry.height / actor.height * 530 / height;
  const length = weapon.length * 1.8 * displayScale * lengthScale;
  const scaleX = length / actor.body.scale.x;
  const scaleY = length * .39 / actor.body.scale.y;
  const angle = mount.angle || 0;
  const gripX = (.5 - model.grip[0]) * scaleX, gripY = (model.grip[1] - .5) * scaleY;
  // The mount and tool use the same plane as the posed sprite. Cover and
  // camera transforms act on both through their shared parent.
  layer.position.set(
    ((mount.grip[0] - x) / width - .5) * geometry.width + gripX * Math.cos(angle) - gripY * Math.sin(angle),
    (.5 - (mount.grip[1] - y) / height) * geometry.height + gripX * Math.sin(angle) + gripY * Math.cos(angle),
    .028,
  );
  layer.rotation.z = angle;
  layer.scale.set(scaleX, scaleY, 1);
  layer.userData.muzzle = aimed ? model.muzzle : null;
}
