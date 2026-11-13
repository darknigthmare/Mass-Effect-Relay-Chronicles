import * as THREE from 'three';
import { isLevelGround, nearestLevelGround } from './level-layout-data.js';

function surface(world,polygon,material,y=0) {
  const shape=new THREE.Shape();polygon.forEach(([x,z],i)=>i?shape.lineTo(x,-z):shape.moveTo(x,-z));shape.closePath();
  const geometry=new THREE.ShapeGeometry(shape);geometry.rotateX(-Math.PI/2);
  const p=geometry.attributes.position,uv=geometry.attributes.uv;for(let i=0;i<p.count;i++)uv.setXY(i,p.getX(i)/5,p.getZ(i)/5);
  return world._mesh(geometry,material,0,y,0);
}
function group(world,name,x,z,build) {
  const before=new Set(world.stage.children),node=new THREE.Group();build();node.name=name;node.userData.keep=true;node.userData.levelScenery={x,z};
  for(const child of [...world.stage.children])if(!before.has(child))node.add(child);
  world.stage.add(node);world.combatOccluders.push(node);return node;
}
const pointSegment=(x,z,a,b)=>{const dx=b[0]-a[0],dz=b[1]-a[1],d=dx*dx+dz*dz,t=d?Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/d)):0;return Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz);};
function reserved(layout,x,z,radius=1) {
  return layout.reservations.some(a=>a.kind==='arena'?Math.abs(x-a.x)<a.halfWidth+radius+1&&Math.abs(z-a.z)<a.halfDepth+radius+1:Math.hypot(x-a.x,z-a.z)<a.radius+radius+1)
    ||layout.paths.some(path=>path.points.slice(1).some((b,i)=>pointSegment(x,z,path.points[i],b)<path.width/2+radius+1));
}
function relief(world,layout) {
  const step=4,b=layout.bounds,minX=b.minX-45,minZ=b.minZ-45,cols=Math.ceil((b.maxX-b.minX+90)/step),rows=Math.ceil((b.maxZ-b.minZ+90)/step),vertices=[],indices=[];
  for(let r=0;r<=rows;r++)for(let c=0;c<=cols;c++){
    const x=minX+c*step,z=minZ+r*step,near=isLevelGround(layout,x,z,0)?{x,z}:nearestLevelGround(layout,{x,z},0),distance=near?Math.hypot(x-near.x,z-near.z):50;
    const height=layout.id==='feros'?-(.2+Math.min(27,distance*.7)):(distance<3?-.2:Math.min(15,(distance-3)*.6)*(1+.18*Math.sin(x*.13+z*.11)));
    vertices.push(x,height,z);
  }
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const a=r*(cols+1)+c,n=a+cols+1;indices.push(a,n,a+1,a+1,n,n+1);}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setIndex(indices);geometry.computeVertexNormals();
  world._mesh(geometry,world._material(layout.ridgeColor,.98,.03)).name=`${layout.id}-authored-relief`;
}
function building(world,layout,id,label,x,z,width,depth,height,color) {
  group(world,`${layout.id}-${id}`,x,z,()=>{
    world._building(x,z,width,depth,height,color,0x5e9891);
    world._sign(label,x,Math.min(5,height-1),z+depth/2+.3,Math.min(width,11));
  });
}
function colony(world,layout) {
  const concrete=world._material(0x6b7d77,.95,.08),metal=world._material(0x4b6763,.7,.4);
  // The camera approaches from positive X/Z. Keep its foreground open around
  // the four colonists; the tall block reads behind their contact square.
  for(const[x,z,w,d,h,label]of [[-53,69,10,21,13,'ZHU’S HOPE · HABITATIONS'],[7,70,8,20,8,'ESPÉRANCE DE ZHU'],[-23,41,20,10,12,'COLONIE DE FÉROS']])
    building(world,layout,`colony-${x}`,label,x,z,w,d,h,0x7a8981);
  for(const[x,z]of [[-58,48],[1,50]])group(world,`feros-colony-support-${x}`,x,z,()=>{
    world._box(5,26,6,concrete,x,-12,z);world._box(7,.8,8,metal,x,1,z);world._rectCollider(x,z,5,6);
  });
  for(const[x,z]of [[-39,57],[-9,76]]){
    const tarp=world._mesh(new THREE.BoxGeometry(6,.16,4),world._material(0x929d85,.94),x,3,z);tarp.rotation.z=.06;
    for(const dx of [-2.6,2.6])world._pipe([x+dx,0,z],[x+dx,3,z],.09,metal);
  }
  world._sign('PASSAGE VERS LES TUNNELS',-8,2.5,49,7);
}
function tunnels(world,layout) {
  const concrete=world._material(0x64766c,.98),pipe=world._material(0x668d83,.65,.3),red=world._material(0x997659,.7,.25);
  for(const[x,z,w,d,h,label]of [[-26,29,8,33,7,'CONDUITES INFÉRIEURES'],[52,29,8,33,7,'TUNNELS · DISTRIBUTION']])building(world,layout,`tunnels-${x}`,label,x,z,w,d,h,0x5c7167);
  for(const x of [-18,44])group(world,`feros-tunnel-pipes-${x}`,x,29,()=>{
    world._pipe([x,2,10],[x,2,47],.6,pipe);world._pipe([x,4,10],[x,4,47],.35,pipe);
    for(const z of [12,28,44]){world._box(1.4,6,1.3,concrete,x,3,z);world._rectCollider(x,z,1.4,1.3);}
  });
  // Roof cut away: two short structural frames and their visible distribution
  // pipes distinguish this level from the open skyway without covering sprites.
  for(const z of [17,36])group(world,`feros-open-tunnel-frame-${z}`,12,z,()=>{
    for(const x of [-3,27]){
      world._box(1.1,4.2,1.3,concrete,x,2.1,z);world._rectCollider(x,z,1.1,1.3);
      world._box(3.2,.45,1.3,concrete,x+(x<12?1.2:-1.2),4.2,z);
      world._pipe([x,.8,z-3],[x,.8,z+3],.28,pipe);
    }
  });
  for(const x of [-10,35])for(const z of [13,43])group(world,`feros-tunnel-lowwall-${x}-${z}`,x,z,()=>{
    world._box(7,.9,.8,concrete,x,.45,z);world._rectCollider(x,z,7,.8);
    world._pipe([x-3,.85,z],[x+3,.85,z],.13,pipe);
  });
  for(const key of ['valve-south','valve-central','valve-north']){
    const p=layout.operationAnchors['feros-water'][key];
    world._pipe([p.x+2,0,p.z],[p.x+2,2,p.z],.3,pipe);
    const handle=world._mesh(new THREE.TorusGeometry(.55,.09,8,16),red,p.x+2,1.5,p.z);handle.rotation.y=Math.PI/5;
  }
  const wreck=layout.operationAnchors['feros-power'].wreck;
  group(world,'feros-power-cell-wreck',wreck.x+3,wreck.z,()=>{
    const body=world._box(4.7,1.4,2.5,world._material(0x6c6458,.95,.2),wreck.x+3,.8,wreck.z);body.rotation.z=.2;
    for(const dx of [-1.5,1.5])for(const dz of [-1.4,1.4])world._mesh(new THREE.SphereGeometry(.55,10,8),world._material(0x303c37),wreck.x+3+dx,.5,wreck.z+dz);
    world._smoke(wreck.x+3,wreck.z,.35,false);
  });
}
function skyway(world,layout) {
  const stone=world._material(0x89968c,.97,.08),rail=world._material(0x55706a,.7,.35);
  for(const[x,z]of [[-41,-10],[2,-10]])group(world,`feros-skyway-pylon-${x}`,x,z,()=>{
    world._box(6,34,9,stone,x,-14,z);world._box(7,.8,10,stone,x,3,z);world._rectCollider(x,z,6,9);
  });
  group(world,'feros-skyway-fracture',-47,-35,()=>{
    for(let i=0;i<4;i++){const block=world._box(8-i,2,5,stone,-47+i*2,-3-i*4,-35-i*2);block.rotation.z=i*.17;}
  });
  const polygon=layout.rooms.find(r=>r.id==='skyway').polygon;
  for(let edge=0;edge<polygon.length;edge++){
    const a=polygon[edge],b=polygon[(edge+1)%polygon.length],length=Math.hypot(b[0]-a[0],b[1]-a[1]),angle=Math.atan2(b[1]-a[1],b[0]-a[0]);
    for(let t=2;t<length-1;t+=4){
      const x=a[0]+(b[0]-a[0])*t/length,z=a[1]+(b[1]-a[1])*t/length;if(reserved(layout,x,z,1))continue;
      group(world,`feros-skyway-rail-${edge}-${t}`,x,z,()=>{
        world._box(3.6,.55,.65,stone,x,.28,z).rotation.y=-angle;
        world._box(3.6,.12,.12,rail,x,1.25,z).rotation.y=-angle;
        for(const side of [-1,1]){const px=x+Math.cos(angle)*side*1.5,pz=z+Math.sin(angle)*side*1.5;world._box(.12,1.2,.12,rail,px,.65,pz);}
        world._circleCollider(x,z,.8);
        world._box(1.1,20,1.1,stone,x,-10,z);
      });
    }
  }
  world._sign('EXOGENI · ACCÈS PAR LA VOIE AÉRIENNE',-8,3,-25,9);
}
function exogeni(world,layout) {
  building(world,layout,'exogeni-west','EXOGENI · RECHERCHE',-23,-46,11,30,14,0x7a8e88);
  building(world,layout,'exogeni-east','EXOGENI · LABORATOIRES',51,-47,11,32,18,0x768a84);
  const frame=world._material(0x678079,.75,.35),light=world._material(0x82cec8,.4,.2,0x315d5d);
  for(const x of [-10,43])group(world,`feros-exogeni-pillar-${x}`,x,-57,()=>{world._box(2,9,2,frame,x,4.5,-57);world._box(.2,5,.1,light,x,4.5,-55.9);world._rectCollider(x,-57,2,2);});
  const p=layout.operationAnchors['feros-data-recovery'].terminal;world._propSprite(1,p.x+1.5,p.z,1.6);
}
function rootChamber(world,layout) {
  const root=world._material(0x5b6944,.98),stone=world._material(0x4d6258,.95);
  for(const[x,z]of [[-40,-85],[39,-85]])group(world,`feros-thorian-sidewall-${x}`,x,z,()=>{
    world._box(7,12,30,stone,x,5,z);world._rectCollider(x,z,7,30);
    for(let i=0;i<7;i++)world._pipe([x-Math.sign(x)*4,0,z-12+i*4],[x-Math.sign(x)*7,8+Math.sin(i)*2,z-10+i*4],.4+.1*(i%3),root);
  });
  group(world,'feros-thorian-root-vault',0,-105,()=>{
    for(let i=0;i<9;i++)world._pipe([-23+i*5,0,-104],[-16+i*3.5,10+Math.sin(i)*2,-106],.5,root);
    world._mesh(new THREE.IcosahedronGeometry(8,2),root,0,5,-112);
  });
  // Roofless tactical staging makes the organic chamber visible. No ceiling is
  // placed over the sprites; the complete original multi-floor lair remains open.
  const glow=new THREE.PointLight(0xa4c57d,7,32);glow.position.set(0,7,-89);world.stage.add(glow);
  world._sign('RACINES DU THORIEN',-18,2.8,-70,7);
}
function ancientPillar(world,layout,name,x,z,height=9) {
  const stone=world._material(0x687d69,.98,.06),dark=world._material(0x3e5848,.93);
  group(world,name,x,z,()=>{
    world._box(3.2,.7,4.2,stone,x,.35,z);world._box(2,height,2.8,stone,x,height/2+.7,z);
    const head=world._mesh(new THREE.DodecahedronGeometry(1.4,0),dark,x,height+1.1,z);head.scale.set(.75,1.2,.9);
    world._pipe([x-.7,height*.7,z],[x-2,1,z+.3],.35,stone);world._pipe([x+.7,height*.7,z],[x+2,1,z+.3],.35,stone);world._rectCollider(x,z,3.2,4.2);
  });
}
function ilos(world,layout) {
  for(const room of layout.rooms)for(const side of [-1,1])ancientPillar(world,layout,`ilos-${room.id}-pillar-${side}`,room.center.x+side*23,room.center.z,room.id==='conduit'?13:9);
  building(world,layout,'archive-west','ARCHIVES PROTHÉENNES',-30,-29,10,10,13,0x637d6d);
  building(world,layout,'archive-east','GALERIE DES ANCIENS',13,-12,9,24,16,0x637768);
  const tank=world._material(0x718c7b,.7,.3),glass=world._material(0x6b9b83,.35,.3,0x284534);
  for(const side of [-1,1])for(let i=0;i<4;i++){
    const x=layout.rooms[3].center.x+side*22,z=-34-i*8;
    group(world,`ilos-cryogenic-${side}-${i}`,x,z,()=>{world._cylinder(1.5,5.5,tank,x,2.75,z,1.5,12);world._cylinder(1.24,3.7,glass,x,2.8,z,1.24,12);world._rectCollider(x,z,3,3);});
  }
  const p=layout.vigil,dark=world._material(0x394f42,.9,.1);
  world._cylinder(2,.6,dark,p.x,.3,p.z);const globe=world._mesh(new THREE.IcosahedronGeometry(1.35,2),new THREE.MeshBasicMaterial({color:0xb7d9a0,transparent:true,opacity:.32,wireframe:true}),p.x,2.3,p.z);
  globe.userData.keep=true;world.animations.push({kind:'globe',object:globe});
  const c=layout.conduit,stone=world._material(0x61796a,.95,.08),blue=world._material(0x80bfb5,.35,.3,0x365d52);
  group(world,'ilos-conduit-surround',c.x,c.z,()=>{
    for(const side of [-1,1]){world._box(4,11,4,stone,c.x+side*9,5.5,c.z);world._box(.2,7,.1,blue,c.x+side*9,5.5,c.z+2.1);world._rectCollider(c.x+side*9,c.z,4,4);}
    const span=world._box(22,2,4,stone,c.x,11,c.z);span.userData.keep=true;world.combatOccluders.push(span);
    world._mesh(new THREE.TorusGeometry(5,.25,10,32),blue,c.x,5.2,c.z-.5);
  });
  world._sign('VIGIL · ARCHIVES DU CYCLE PRÉCÉDENT',-20,2.5,-73,10);
  world._vehicleSprite('mako',layout.staticMako.x,layout.staticMako.z,3.4);
}
export function buildHorizonScene(world,layout) {
  relief(world,layout);
  const ground=world._texturedMaterial(layout.surfaceColor,'stone',8),road=world._texturedMaterial(layout.routeColor,'concrete',7);
  const colors=layout.id==='feros'?[0x939d90,0x697b7b,0xa7aaa0,0x8b9c9b,0x656e48]:[0x667a63,0x788b69,0x89917e,0x687e75,0x7e8d72];
  for(const[roomIndex,room]of layout.rooms.entries()){
    surface(world,room.polygon,world._texturedMaterial(colors[roomIndex],'stone',8),-.012);
    // Shallow seams and inset pavement remain walkable. They reveal the scale
    // and material of each place at the normal tactical camera distance.
    const seam=world._material(layout.id==='feros'?0x4f6663:0x4c6250,.95);
    for(const dz of [-12,-6,0,6,12])world._box(30,.012,.11,seam,room.center.x,.006,room.center.z+dz);
  }
  for(const path of layout.paths){world._road(path.points,path.width,ground,-.04);world._road(path.points,path.kind==='return'?3.8:6,road,.005);for(const[x,z]of path.points)world._mesh(new THREE.CircleGeometry(path.width/2,18),ground,x,-.011,z).rotation.x=-Math.PI/2;}
  if(layout.id==='feros'){colony(world,layout);tunnels(world,layout);skyway(world,layout);exogeni(world,layout);rootChamber(world,layout);}else ilos(world,layout);
  for(const room of layout.rooms)world._sign(room.label.toUpperCase(),room.center.x-12,2.4,room.center.z+11,7);
  const stone=world._material(layout.ridgeColor,.98);
  for(let i=0;i<220;i++){
    const x=layout.bounds.minX+5+world.rand()*(layout.bounds.maxX-layout.bounds.minX-10),z=layout.bounds.minZ+5+world.rand()*(layout.bounds.maxZ-layout.bounds.minZ-10),radius=.6+world.rand()*1.1;
    if(!isLevelGround(layout,x,z,radius+1)||reserved(layout,x,z,radius))continue;
    if(layout.id==='ilos'&&i%4===0&&!layout.rooms.some(room=>Math.hypot(x-room.center.x,z-room.center.z)<17)){
      group(world,`ilos-alien-tree-${i}`,x,z,()=>world._tree(x,z,.75+world.rand()*.3,'alien'));continue;
    }
    const mesh=world._mesh(new THREE.IcosahedronGeometry(radius,0),stone,x,radius*.65,z);mesh.scale.y=.7+world.rand();world.colliders.push({kind:'circle',x,z,radius:radius*.8});
  }
  let groundSamples=0;for(let z=layout.bounds.minZ+.5;z<layout.bounds.maxZ;z++)for(let x=layout.bounds.minX+.5;x<layout.bounds.maxX;x++)if(isLevelGround(layout,x,z,0))groundSamples++;
  world.horizonSceneMetrics={zoneId:layout.id,sectors:layout.rooms.length,paths:layout.paths.length,groundMaskAreaApprox:groundSamples,envelopeArea:(layout.bounds.maxX-layout.bounds.minX)*(layout.bounds.maxZ-layout.bounds.minZ),units:'scene units; one-unit mask samples before scenery collisions',colliders:world.colliders.length};
}
