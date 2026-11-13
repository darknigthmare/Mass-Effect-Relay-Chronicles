import * as THREE from 'three';
import { isLevelGround, nearestLevelGround } from './level-layout-data.js';

function surface(world, polygon, material, y = -.012) {
  const shape = new THREE.Shape(); polygon.forEach(([x,z],i) => i ? shape.lineTo(x,-z) : shape.moveTo(x,-z)); shape.closePath();
  const geometry = new THREE.ShapeGeometry(shape); geometry.rotateX(-Math.PI/2);
  const p = geometry.attributes.position, uv = geometry.attributes.uv;
  for (let i=0;i<p.count;i++) uv.setXY(i,p.getX(i)/5,p.getZ(i)/5);
  return world._mesh(geometry,material,0,y,0);
}
const distanceSegment = (x,z,a,b) => { const dx=b[0]-a[0],dz=b[1]-a[1],n=dx*dx+dz*dz,t=n?Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/n)):0; return Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz); };
function reserved(layout,x,z,radius) {
  return layout.reservations.some(a => a.kind==='arena' ? Math.abs(x-a.x)<a.halfWidth+radius+1 && Math.abs(z-a.z)<a.halfDepth+radius+1 : Math.hypot(x-a.x,z-a.z)<a.radius+radius+1)
    || layout.paths.some(p=>p.points.slice(1).some((b,i)=>distanceSegment(x,z,p.points[i],b)<p.width/2+radius+1));
}
function relief(world,layout) {
  const b=layout.bounds,step=4,minX=b.minX-44,minZ=b.minZ-44,columns=Math.ceil((b.maxX-b.minX+88)/step),rows=Math.ceil((b.maxZ-b.minZ+88)/step);
  const vertices=[],indices=[],uvs=[];
  for(let row=0;row<=rows;row++)for(let column=0;column<=columns;column++) {
    const x=minX+column*step,z=minZ+row*step,near=isLevelGround(layout,x,z,0)?{x,z}:nearestLevelGround(layout,{x,z},0),distance=near?Math.hypot(x-near.x,z-near.z):50;
    let height=distance<4?-.12:Math.min(17,(distance-4)*.85)*(1+.14*Math.sin(x*.11+z*.09));
    // The western Virmire shore opens onto water; volcanic Thérum has molten
    // channels between the basalt plateaux. Neither borrows Eden's grass.
    if(layout.id==='virmire'&&x<-28)height=distance<4?-.12:-1.4;
    if(layout.id==='therum'&&distance>5&&distance<15)height=-1.3;
    vertices.push(x,height,z);uvs.push(x/8,z/8);
  }
  for(let row=0;row<rows;row++)for(let column=0;column<columns;column++){const a=row*(columns+1)+column,c=a+columns+1;indices.push(a,c,a+1,a+1,c,c+1);}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);geometry.computeVertexNormals();
  const mesh=world._mesh(geometry,world._texturedMaterial(layout.ridgeColor,'stone',7));mesh.name=`${layout.id}-distant-relief`;
  if(layout.id!=='noveria'){
    const color=layout.id==='therum'?0xe96223:0x3b91a2,material=world._material(color,.5,.15,layout.id==='therum'?0x9d300c:0x102f37);
    const plane=world._mesh(new THREE.PlaneGeometry(300,340),material,0,-1.1,-10);plane.rotation.x=-Math.PI/2;plane.name=layout.id==='therum'?'therum-lava-channels':'virmire-open-sea';plane.castShadow=false;
  }
}
function group(world,id,x,z,build) {
  const before=new Set(world.stage.children);build();const node=new THREE.Group();node.name=id;node.userData.keep=true;node.userData.levelScenery={x,z};world.stage.add(node);
  for(const child of [...world.stage.children])if(child!==node&&!before.has(child))node.add(child);
  world.combatOccluders.push(node);return node;
}
// Candidate footprints are tested against the route width, rather than a large
// circle that would incorrectly discard every building near a narrow clearing.
function footprintFree(layout,x,z,width,depth) {
  const distance=(px,pz)=>Math.hypot(Math.max(0,Math.abs(px-x)-width/2),Math.max(0,Math.abs(pz-z)-depth/2));
  for(const area of layout.reservations){
    if(area.kind==='arena'){if(Math.abs(x-area.x)<width/2+area.halfWidth+1&&Math.abs(z-area.z)<depth/2+area.halfDepth+1)return false;}
    else if(distance(area.x,area.z)<area.radius+.8)return false;
  }
  for(const route of layout.paths)for(let i=1;i<route.points.length;i++){
    const a=route.points[i-1],b=route.points[i],steps=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1]));
    for(let n=0;n<=steps;n++)if(distance(a[0]+(b[0]-a[0])*n/steps,a[1]+(b[1]-a[1])*n/steps)<route.width/2+.5)return false;
  }
  return true;
}
function authoredArchitecture(world,layout) {
  const plans=layout.id==='therum' ? [
    ['landing-relay','RELAIS MINIER',-44,66,7,9,4],
    ['refinery-office','RAFFINERIE · CONTRÔLE',5,34,10,12,7],
    ['refinery-smelter','RAFFINERIE · EXTRACTION',10,18,7,8,6],
    ['lava-outpost','POSTE MINIER',47,-9,8,13,6],
  ] : layout.id==='noveria' ? [
    ['port-reception','PORT HANSHAN · ACCUEIL',-26,64,9,15,8],
    ['port-offices','BUREAUX · ADMINISTRATION',26,64,9,15,9],
    ['port-concourse','HALL DES CORPORATIONS',0,84,29,9,10],
    ['garage-service','GARAGE · MAINTENANCE',-46,27,9,18,6],
    ['garage-depot','DÉPÔT DE PORT HANSHAN',0,31,8,14,6],
    ['peak15-west','PIC 15 · RECHERCHE',0,-43,8,18,8],
    ['peak15-east','PIC 15 · CONFINEMENT',47,-43,8,18,8],
    ['chamber-west','LABORATOIRE RACHNI',-29,-81,8,18,8],
    ['chamber-east','CONFINEMENT',24,-81,8,18,8],
  ] : [
    ['facility-west','INSTALLATION · REPRODUCTION',2,-43,8,18,7],
    ['facility-east','INSTALLATION · SÉCURITÉ',49,-43,8,18,8],
    ['extraction-west','TOUR DE DÉFENSE',-36,-80,8,18,9],
    ['extraction-east','PLATEFORME D’EXTRACTION',21,-80,8,18,7],
  ];
  const placed=[];
  for(const[id,label,x,z,width,depth,height]of plans){
    if(!footprintFree(layout,x,z,width,depth))continue;
    group(world,`${layout.id}-${id}`,x,z,()=>{
      const color=layout.id==='noveria'?0x8198a7:layout.id==='therum'?0x8c8071:0x7c9692;
      world._box(width+1.5,.6,depth+1.5,world._material(0x505c62),x,-.05,z);
      world._building(x,z,width,depth,height,color,layout.id==='noveria'?0x7fc8e1:0x67a8b2);
      if(layout.id==='noveria')world._box(width+.3,.3,depth+.3,world._material(0xc8d9df),x,height+.25,z);
      world._sign(label,x,Math.min(height-1,4.5),z+depth/2+.25,Math.min(width,9));
      if(id==='garage-service'){
        world._box(.15,3.4,6,world._material(0x263d4c),x+width/2+.12,1.7,z);
        for(let k=0;k<6;k++)world._box(.2,.08,5.8,world._material(0x7babb9),x+width/2+.22,.4+k*.5,z);
      }
    });placed.push(id);
  }
  if(layout.id==='therum'){
    const steel=world._material(0x9b9b8c,.55,.55);
    for(const[x,z]of [[11,36],[17,30],[17,20]])if(footprintFree(layout,x,z,4.5,4.5))group(world,`therum-refinery-tank-${x}-${z}`,x,z,()=>{
      world._cylinder(2.2,6.5,steel,x,3.25,z,2.2,16);world._ring(2.3,.12,0x4c5d63,x,5.7,z);world.colliders.push({kind:'circle',x,z,radius:2.2});
      world._pipe([x,5,z],[x+2,5,z+3],.23,steel);
    });
    const stone=world._material(0x6e7c7b,.9,.15),blue=world._material(0x7cbac2,.35,.35,0x365a66);
    for(const[x,z]of [[-1,-43],[50,-43],[-24,-81],[27,-81]])if(footprintFree(layout,x,z,3.5,4))group(world,`therum-prothean-tower-${x}-${z}`,x,z,()=>{
      world._box(3.5,9,4,stone,x,4.5,z);world._box(.25,6,.1,blue,x,4.5,z+2.1);world._box(5,.5,5,stone,x,9,z);world._rectCollider(x,z,3.5,4);
    });
  }
  world.frontierArchitecture=placed;
}
function industrial(world,layout,room,index) {
  const snow=layout.id==='noveria',wall=snow?0x839eae:layout.id==='therum'?0x817b73:0x7b9290;
  for(const side of [-1,1]) {
    const x=room.center.x+side*16,z=room.center.z-3;
    if(reserved(layout,x,z,5))continue;
    group(world,`${layout.id}-${room.id}-building-${side}`,x,z,()=>{
      world._building(x,z,7,10,index===4?6:4.8,wall,snow?0x87c9e7:0x6aa6a1);
      if(snow)world._box(7.5,.35,10.5,world._material(0xd7e5e8),x,5.02,z);
      world._sign(room.label.toUpperCase(),x,3.4,z+5.2,5.7);
    });
  }
}
function ruins(world,layout,room) {
  const stone=world._material(0x797c73,.95,.05),light=world._material(0x72c5ce,.4,.25,0x31565c);
  for(const side of [-1,1])for(const offset of [-8,8]){
    const x=room.center.x+side*16,z=room.center.z+offset;if(reserved(layout,x,z,2))continue;
    group(world,`${layout.id}-${room.id}-pillar-${side}-${offset}`,x,z,()=>{world._box(2.5,6.5,2.5,stone,x,3.25,z);world._box(.18,4.8,.08,light,x,3,z+1.3);world._rectCollider(x,z,2.5,2.5);});
  }
}
function palm(world,x,z,height) {
  const trunk=world._material(0x806e51),leaf=world._material(0x3f7451,.95);
  world._cylinder(.32,height,trunk,x,height/2,z,.2,7);world.colliders.push({kind:'circle',x,z,radius:.4});
  for(let i=0;i<6;i++) {const a=i*Math.PI/3,node=world._mesh(new THREE.ConeGeometry(1,5,3),leaf,x+Math.cos(a)*1.6,height-.2,z+Math.sin(a)*1.6);node.rotation.z=Math.PI/2;node.rotation.y=-a;}
}
/** Distinct authored ME1 staging for the three retained seven-point missions. */
export function buildFrontierScene(world,layout) {
  relief(world,layout);
  const ground=world._texturedMaterial(layout.surfaceColor,layout.id==='noveria'?'stone':layout.id==='virmire'?'concrete':'stone',8),road=world._texturedMaterial(layout.routeColor,'concrete',7);
  for(const room of layout.rooms)surface(world,room.polygon,ground);
  for(const path of layout.paths){world._road(path.points,path.width,ground,-.04);world._road(path.points,path.kind==='return'?3.4:5.8,road,.005);for(const[x,z]of path.points)world._mesh(new THREE.CircleGeometry(path.width/2,18),ground,x,-.011,z).rotation.x=-Math.PI/2;}
  authoredArchitecture(world,layout);
  for(const[index,room]of layout.rooms.entries()){
    if(room.kind==='ruins')ruins(world,layout,room);
    world._sign(room.label.toUpperCase(),room.center.x-10,2.2,room.center.z+11,6.2);
  }
  const rock=world._material(layout.ridgeColor,.98,.02);
  for(let i=0;i<170;i++) {
    const x=layout.bounds.minX+5+world.rand()*(layout.bounds.maxX-layout.bounds.minX-10),z=layout.bounds.minZ+5+world.rand()*(layout.bounds.maxZ-layout.bounds.minZ-10),radius=.6+world.rand()*1.2;
    if(!isLevelGround(layout,x,z,radius+1)||reserved(layout,x,z,radius))continue;
    if(layout.id==='virmire'&&i%3===0){
      if(layout.rooms.some(room=>Math.hypot(x-room.center.x,z-room.center.z)<14)||layout.reservations.some(p=>Math.hypot(x-p.x,z-p.z)<13))continue;group(world,`virmire-palm-${i}`,x,z,()=>palm(world,x,z,4+world.rand()*2));continue;}
    const h=.7+world.rand()*2.2,mesh=world._mesh(new THREE.IcosahedronGeometry(radius,0),rock,x,h*.38,z);mesh.scale.y=h/radius;mesh.rotation.y=world.rand()*6.28;world.colliders.push({kind:'circle',x,z,radius:radius*.8});
  }
  if(layout.id==='therum'){

    for(const[x,z]of [[-39,58],[37,-13],[-16,-82]])if(!reserved(layout,x,z,2))world._smoke(x,z,.8,true);
    world._sign('SITE PROTHÉEN · SIGNAL DE DÉTRESSE',-10,3,-88,8);
  } else if(layout.id==='noveria') {
    world._sign('PORT HANSHAN · CONTRÔLE CORPORATISTE',0,5,74,10);
    const material=world._material(0x7796a4,.5,.5),glass=world._material(0x4ca2b6,.3,.5,0x184552);
    for(const x of [-15,11]){world._cylinder(1.8,5.8,material,x,2.9,-88,1.8,16);world._cylinder(1.45,3.8,glass,x,2.8,-88,1.45,16);world.colliders.push({kind:'circle',x,z:-88,radius:1.8});}
  } else {
    const c=layout.rooms[1].center,canvas=world._material(0x788678,.95);
    for(const side of [-1,1]){const x=c.x+side*15,z=c.z+7;if(reserved(layout,x,z,3))continue;group(world,`virmire-stg-shelter-${side}`,x,z,()=>{world._box(5,.2,6,canvas,x,3,z);world._pipe([x-2.3,0,z],[x-2.3,3,z],.08,canvas);world._pipe([x+2.3,0,z],[x+2.3,3,z],.08,canvas);});}
    world._sign('GSI · CAMP DU CAPITAINE KIRRAHE',19,3,39,8);
  }
  // Measured from the real mask; bounds include ridges, void and sea.
  let groundSamples=0;for(let z=layout.bounds.minZ+.5;z<layout.bounds.maxZ;z++)for(let x=layout.bounds.minX+.5;x<layout.bounds.maxX;x++)if(isLevelGround(layout,x,z,0))groundSamples++;
  world.frontierSceneMetrics={zoneId:layout.id,rooms:layout.rooms.length,paths:layout.paths.length,groundAreaApprox:groundSamples,envelopeArea:(layout.bounds.maxX-layout.bounds.minX)*(layout.bounds.maxZ-layout.bounds.minZ),units:'scene units; one-unit mask sampling',colliders:world.colliders.length,architecture:[...world.frontierArchitecture]};
}
