import * as THREE from 'three';
import { createSimulationClock } from './simulation-clock.js';
import { ARMAX_FIGHTERS, ARMAX_STAGES, ARMAX_COMMANDS } from './armax-data.js';
import { createArmaxMatch, stepArmaxMatch, armaxCPUInput, pauseArmaxMatch, nextArmaxRound, requestArmaxFinisher, skipArmaxFinisher } from './armax-engine.js';
import './armax-ui.css';

const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const inputMap={ArrowLeft:'left',KeyA:'left',KeyQ:'left',ArrowRight:'right',KeyD:'right',ArrowDown:'down',KeyS:'down',ShiftLeft:'guard',ShiftRight:'guard'};
const jumpKeys=['ArrowUp','KeyW','KeyZ','Space'];
const percent=(value,max)=>Math.max(0,Math.min(100,value/Math.max(1,max)*100));

function createView(container,profiles,textures){
  const scene=new THREE.Scene();scene.background=new THREE.Color('#07121a');
  const camera=new THREE.OrthographicCamera(-8,8,9,0,.1,50);camera.position.z=15;
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.domElement.setAttribute('aria-label','Arène de duel latéral');container.append(renderer.domElement);
  const resources=[...textures],ratio=textures[2].image.width/textures[2].image.height;
  const geometry=new THREE.PlaneGeometry(Math.max(16,9*ratio),Math.max(9,16/ratio)),material=new THREE.MeshBasicMaterial({map:textures[2],depthWrite:false});resources.push(geometry,material);
  const backdrop=new THREE.Mesh(geometry,material);backdrop.position.set(0,4.5,-2);scene.add(backdrop);
  const silhouettes=profiles.map((profile,index)=>{
    const texture=textures[index],w=texture.image.width,h=texture.image.height,b=profile.visualBounds||[0,0,w,h];
    const left=Math.max(0,b[0]-8),top=Math.max(0,b[1]-8),right=Math.min(w,b[2]+8),bottom=Math.min(h,b[3]+8);
    texture.repeat.set((right-left)/w,(bottom-top)/h);texture.offset.set(left/w,1-bottom/h);
    const mat=new THREE.SpriteMaterial({map:texture,alphaTest:32/255,transparent:true,depthWrite:false});
    const sprite=new THREE.Sprite(mat);sprite.center.set(.5,0);sprite.renderOrder=2+index;scene.add(sprite);resources.push(mat);
    const shadowGeo=new THREE.CircleGeometry(.5,32),shadowMat=new THREE.MeshBasicMaterial({color:'#020609',transparent:true,opacity:.35,depthWrite:false});
    const shadow=new THREE.Mesh(shadowGeo,shadowMat);shadow.scale.y=.18;scene.add(shadow);resources.push(shadowGeo,shadowMat);
    return {sprite,shadow,aspect:(right-left)/(bottom-top)};
  });
  // Temporary procedural effect tokens; finished bitmap VFX remain in production.
  const shotGeometry=new THREE.CircleGeometry(.1,12);resources.push(shotGeometry);const shotViews=new Map();
  function resize(){const r=container.getBoundingClientRect();renderer.setSize(Math.max(1,r.width),Math.max(1,r.height));}
  const observer=new ResizeObserver(resize);observer.observe(container);resize();
  return {renderer,paint(state){
    state.players.forEach((p,index)=>{const {sprite,shadow,aspect}=silhouettes[index];sprite.position.set(p.x,1.03+p.y,.2+index*.05);sprite.scale.set(p.profile.height*aspect*p.facing,p.profile.height,1);sprite.material.color.set(p.effectFrames?(p.lastHit==='block'?'#93d9ff':'#ffd7bd'):'#ffffff');shadow.position.set(p.x,1.015,0);shadow.material.opacity=Math.max(.12,.35-p.y*.08);});
    const live=new Set(state.projectiles.map(shot=>shot.id));for(const[id,mesh]of shotViews)if(!live.has(id)){scene.remove(mesh);mesh.material.dispose();shotViews.delete(id);}
    for(const shot of state.projectiles){let mesh=shotViews.get(shot.id);if(!mesh){mesh=new THREE.Mesh(shotGeometry,new THREE.MeshBasicMaterial({color:profiles[shot.owner].color,transparent:true,opacity:.9,depthWrite:false}));scene.add(mesh);shotViews.set(shot.id,mesh);}mesh.position.set(shot.x,1.03+shot.y,.5);mesh.scale.set(shot.trap?2.4:2.5,shot.trap?.65:.6,1);mesh.material.opacity=shot.armed?.4:.95;}
    renderer.render(scene,camera);
  },dispose(){observer.disconnect();renderer.setAnimationLoop(null);for(const mesh of shotViews.values())mesh.material.dispose();for(const resource of resources)resource.dispose();renderer.dispose();renderer.domElement.remove();}};
}

export function mountArmax(root,{onExit,baseUrl=import.meta.env.BASE_URL}={}){
  const scope=new AbortController(),clock=createSimulationClock(),heldKeys=new Set(),heldPointers=new Map();
  let mode='lobby',disposed=false,generation=0,state=null,view=null,attack=null,jump=false,hudStamp='',notice='';
  const selection={player:ARMAX_FIGHTERS[0].id,opponent:ARMAX_FIGHTERS[1].id,stage:ARMAX_STAGES[0].id,mode:'cpu',dummy:'idle'};
  const byId=id=>ARMAX_FIGHTERS.find(item=>item.id===id);
  const options=(items,selected)=>items.map(item=>`<option value="${item.id}"${item.id===selected?' selected':''}>${esc(item.name)}</option>`).join('');
  function clearInput(){heldKeys.clear();heldPointers.clear();attack=null;jump=false;}
  function focus(selector){root.querySelector(selector)?.focus();}
  function lobby(){
    generation++;view?.dispose();view=null;state=null;mode='lobby';clearInput();
    root.innerHTML=`<section class="armax-screen armax-lobby" role="dialog" aria-label="Armax Relay Clash"><header class="armax-header"><div><p class="armax-eyebrow">ARMAX RELAY CLASH · DOSSIER NACRE</p><h1>Les Dettes de Nacre</h1><p>Duel local dans les systèmes Terminus · 2185</p></div><button class="secondary" data-armax="exit">Retour</button></header><div class="armax-lobby-body"><article class="armax-intro"><span class="armax-kicker">ESSAI DE COMBAT</span><h2>Choisissez votre affrontement.</h2><p>Deux manches gagnantes. Faites céder la protection, surveillez votre jauge et trouvez l’ouverture.</p><p class="armax-prototype">Prototype jouable : poses fixes, un spécial par personnage et effets simplifiés. Les campagnes et kits complets de l’extension restent en production.</p><div class="armax-roster-count"><strong>10</strong><span>personnages originaux</span><strong>2</strong><span>arènes de prototype</span></div></article><form class="armax-setup"><label>Votre combattant<select name="player">${options(ARMAX_FIGHTERS,selection.player)}</select></label><p class="armax-profile" data-profile="player"></p><label>Adversaire<select name="opponent">${options(ARMAX_FIGHTERS,selection.opponent)}</select></label><p class="armax-profile" data-profile="opponent"></p><label>Arène<select name="stage">${options(ARMAX_STAGES,selection.stage)}</select></label><div class="armax-field-row"><label>Mode<select name="mode"><option value="cpu"${selection.mode==='cpu'?' selected':''}>Duel contre l’IA</option><option value="training"${selection.mode==='training'?' selected':''}>Entraînement</option></select></label><label>Cible d’entraînement<select name="dummy"><option value="idle"${selection.dummy==='idle'?' selected':''}>Immobile</option><option value="guard"${selection.dummy==='guard'?' selected':''}>Garde haute</option><option value="low"${selection.dummy==='low'?' selected':''}>Garde basse</option></select></label></div><button class="primary armax-launch" type="submit">Lancer le duel <span>→</span></button><p class="armax-message" role="status">${esc(notice)}</p></form></div><footer class="armax-help"><strong>Commandes</strong><span>Flèches / ZQSD : déplacement · Haut : saut · Bas : accroupi · Arrière ou Maj : garde</span><span>J : léger · K : moyen · L : lourd · U : spécial · I : super (100) · O : prise / déprojection · Échap : pause</span></footer></section>`;
    updateProfile();focus('select[name="player"]');
  }
  function updateProfile(){for(const field of ['player','opponent']){const p=byId(selection[field]);root.querySelector(`[data-profile="${field}"]`).textContent=`${p.species} · ${p.role} · ${p.specialName}`;}const dummy=root.querySelector('[name="dummy"]');if(dummy)dummy.disabled=selection.mode!=='training';}
  function matchMarkup(){
    return `<section class="armax-screen armax-match" role="dialog" aria-label="Duel Armax"><header class="armax-header"><div><p class="armax-eyebrow">ARMAX RELAY CLASH · NACRE</p><h1>${esc(ARMAX_STAGES.find(item=>item.id===selection.stage).name)}</h1></div><nav><button class="secondary" data-armax="pause">Pause</button><button class="secondary" data-armax="selection">Sélection</button><button class="secondary" data-armax="exit">Retour</button></nav></header><div class="armax-hud">${[0,1].map(i=>`<div class="armax-health armax-p${i}" data-player="${i}"><div class="armax-name"><strong>${esc(state.players[i].profile.name)}</strong><span data-wins="${i}">○ ○</span></div><div class="armax-bar armax-life"><i data-life="${i}"></i></div><div class="armax-values"><span data-hp="${i}"></span><span data-shield-value="${i}"></span></div><div class="armax-bar armax-shield"><i data-shield="${i}"></i></div><div class="armax-meter"><span>JAUGE</span><div class="armax-bar"><i data-meter="${i}"></i></div><b data-meter-value="${i}"></b></div></div>`).join('')}<div class="armax-clock"><strong data-clock>99</strong><span data-round>Manche 1</span></div></div><div class="armax-arena-wrap"><div class="armax-arena"></div><div class="armax-match-overlay" hidden></div><p class="armax-loading" role="status">Chargement de l’arène et des deux personnages…</p></div><p class="armax-live" role="status" aria-live="polite"></p><div class="armax-touch"><div class="armax-dpad"><button data-armax-hold="left" aria-label="Se déplacer à gauche">←</button><button data-armax-hold="right" aria-label="Se déplacer à droite">→</button><button data-armax-hold="down" aria-label="S’accroupir">↓</button><button data-armax="jump" aria-label="Sauter">↑</button><button data-armax-hold="guard">Garde</button></div><div class="armax-attacks"><button data-armax-attack="L">Léger <kbd>J</kbd></button><button data-armax-attack="M">Moyen <kbd>K</kbd></button><button data-armax-attack="H">Lourd <kbd>L</kbd></button><button data-armax-attack="S">Spécial <kbd>U</kbd></button><button data-armax-attack="super">Super <kbd>I</kbd></button><button data-armax-attack="throw">Prise <kbd>O</kbd></button></div></div><footer class="armax-help"><span>Haut / bas / arrière : saut, accroupi, garde · Échap : pause · J → K → U → I sur touche</span><span>Essai local · poses fixes · paramètres provisoires · aucune progression de campagne modifiée</span></footer></section>`;
  }
  async function start(){
    if(mode==='loading')return;const profiles=[byId(selection.player),byId(selection.opponent)],stage=ARMAX_STAGES.find(item=>item.id===selection.stage),ticket=++generation;
    view?.dispose();view=null;clearInput();state=createArmaxMatch({fighters:profiles,mode:selection.mode});mode='loading';hudStamp='';root.innerHTML=matchMarkup();paintHUD(true);
    const loader=new THREE.TextureLoader(),loaded=await Promise.allSettled([...profiles.map(p=>p.sprite),stage.image].map(path=>loader.loadAsync(`${baseUrl}${path}`))),textures=loaded.filter(item=>item.status==='fulfilled').map(item=>item.value);
    if(ticket!==generation||disposed){textures.forEach(texture=>texture.dispose());return;}
    if(loaded.some(item=>item.status==='rejected')){textures.forEach(texture=>texture.dispose());notice='Un visuel de ce duel est indisponible. Choisissez une autre combinaison ou réessayez.';lobby();return;}
    textures.forEach(texture=>{texture.colorSpace=THREE.SRGBColorSpace;texture.minFilter=THREE.LinearFilter;texture.magFilter=THREE.LinearFilter;});
    try{view=createView(root.querySelector('.armax-arena'),profiles,textures);}catch{textures.forEach(texture=>texture.dispose());notice='Le rendu de l’arène ne peut pas démarrer. Réessayez après avoir activé l’accélération graphique.';lobby();return;}
    mode='match';root.querySelector('.armax-loading').hidden=true;clock.reset(performance.now());focus('[data-armax="pause"]');view.renderer.setAnimationLoop(frame);paintHUD(true);if(document.hidden||!document.hasFocus())pause(true);
  }
  function playerInput(){const held=new Set([...heldKeys].map(key=>inputMap[key]).filter(Boolean));for(const value of heldPointers.values())held.add(value);const result={left:held.has('left'),right:held.has('right'),down:held.has('down'),guard:held.has('guard'),jump,attack};jump=false;attack=null;return result;}
  function frame(now){
    if(disposed||mode!=='match')return;const batch=clock.advance(now,{suspended:state.paused||document.hidden});if(batch.interrupted)pause(true);
    for(let i=0;i<batch.steps;i++){const opponent=state.mode==='cpu'?armaxCPUInput(state):selection.dummy==='idle'?{}:{guard:true,down:selection.dummy==='low'};stepArmaxMatch(state,[playerInput(),opponent]);}
    view.paint(state);paintHUD();
  }
  function paintHUD(force=false){
    if(!state)return;const signature=JSON.stringify([state.players.map(p=>[p.hp,p.shield,p.meter,p.specialCharges]),state.wins,Math.ceil(state.roundFrames/60),state.phase,state.paused,state.eventId,state.finisherFrames>0,state.finisherWindow>0]);if(!force&&signature===hudStamp)return;hudStamp=signature;
    state.players.forEach((p,i)=>{root.querySelector(`[data-life="${i}"]`).style.width=`${percent(p.hp,p.profile.life)}%`;root.querySelector(`[data-hp="${i}"]`).textContent=`${p.hp} / ${p.profile.life} PV`;root.querySelector(`[data-shield="${i}"]`).style.width=`${percent(p.shield,p.profile.shield)}%`;root.querySelector(`[data-shield-value="${i}"]`).textContent=`${p.shield} protection${p.specialCharges!==null?` · ${p.specialCharges}/2 réserves`:''}`;root.querySelector(`[data-meter="${i}"]`).style.width=`${percent(p.meter,300)}%`;root.querySelector(`[data-meter-value="${i}"]`).textContent=`${p.meter} / 300`;root.querySelector(`[data-wins="${i}"]`).textContent=`${state.wins[i]>0?'●':'○'} ${state.wins[i]>1?'●':'○'}`;});
    root.querySelector('[data-clock]').textContent=Math.ceil(state.roundFrames/60);root.querySelector('[data-round]').textContent=`Manche ${state.round}`;root.querySelector('.armax-live').textContent=state.lastEvent;
    root.querySelector('[data-armax-attack="super"]').disabled=mode!=='match'||state.paused||state.phase!=='playing'||state.players[0].meter<100;
    const panel=root.querySelector('.armax-match-overlay'),key=`${state.paused}|${state.phase}|${state.finisherFrames>0}|${state.finisherWindow>0}`;if(panel.dataset.state===key&&!force)return;panel.dataset.state=key;
    if(state.paused){panel.hidden=false;panel.innerHTML='<div><p class="armax-eyebrow">SIMULATION SUSPENDUE</p><h2>Pause</h2><button class="primary" data-armax="resume">Reprendre le duel</button><button class="secondary" data-armax="restart">Recommencer</button><button class="secondary" data-armax="selection">Changer de combattants</button></div>';focus('[data-armax="resume"]');}
    else if(state.phase==='round-over'){panel.hidden=false;panel.innerHTML=`<div><h2>${esc(state.lastEvent)}</h2><button class="primary" data-armax="next">Manche suivante</button></div>`;focus('[data-armax="next"]');}
    else if(state.phase==='match-over'){panel.hidden=false;panel.innerHTML=`<div><p class="armax-eyebrow">DUEL TERMINÉ</p><h2>${esc(state.players[state.result.winner].profile.name)}</h2><p>${state.wins.join(' — ')} · ${state.result.reason==='KO_final'?'KO final':'Temps écoulé'}</p>${state.finisherFrames?'<p>Neutralisation décisive · l’adversaire est mis hors combat.</p><button class="secondary" data-armax="skip">Passer la présentation</button>':state.finisherWindow>0?'<button class="secondary" data-armax="finish">Neutralisation décisive <kbd>F</kbd></button>':''}<button class="primary" data-armax="restart">Rejouer</button><button class="secondary" data-armax="selection">Sélection</button></div>`;focus('[data-armax="restart"]');}
    else{panel.hidden=true;panel.innerHTML='';}
  }
  function pause(value=true){if(!state||mode!=='match')return;pauseArmaxMatch(state,value);clearInput();clock.reset(performance.now());paintHUD(true);}
  function exit(){dispose();onExit?.();}
  root.addEventListener('submit',e=>{if(e.target.matches('.armax-setup')){e.preventDefault();start();}},{signal:scope.signal});
  root.addEventListener('change',e=>{if(e.target.name&&e.target.name in selection){selection[e.target.name]=e.target.value;updateProfile();}},{signal:scope.signal});
  root.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b||b.disabled)return;const actionName=b.dataset.armax;
    if(b.dataset.armaxAttack&&e.detail===0&&state&&!state.paused)attack=b.dataset.armaxAttack;
    if(actionName==='exit')exit();else if(actionName==='selection')lobby();else if(actionName==='pause')pause(!state?.paused);else if(actionName==='resume')pause(false);else if(actionName==='restart')start();
    else if(actionName==='next'){nextArmaxRound(state);clearInput();clock.reset(performance.now());paintHUD(true);focus('[data-armax="pause"]');}
    else if(actionName==='finish'){requestArmaxFinisher(state);paintHUD(true);}else if(actionName==='skip'){skipArmaxFinisher(state);paintHUD(true);}else if(actionName==='jump'&&state&&!state.paused)jump=true;
  },{signal:scope.signal});
  root.addEventListener('pointerdown',e=>{const b=e.target.closest('[data-armax-hold], [data-armax-attack]');if(!b||b.disabled||mode!=='match'||state.paused||state.phase!=='playing')return;e.preventDefault();if(e.isTrusted)b.setPointerCapture?.(e.pointerId);if(b.dataset.armaxHold)heldPointers.set(e.pointerId,b.dataset.armaxHold);else attack=b.dataset.armaxAttack;},{signal:scope.signal});
  for(const name of ['pointerup','pointercancel','lostpointercapture'])root.addEventListener(name,e=>heldPointers.delete(e.pointerId),{signal:scope.signal});
  document.addEventListener('keydown',e=>{
    if(e.code==='Tab'){const elements=[...root.querySelectorAll('button:not(:disabled),select:not(:disabled)')].filter(el=>el.getClientRects().length),first=elements[0],last=elements.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}return;}
    if(/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;
    if(e.code==='Escape'){e.preventDefault();e.stopImmediatePropagation();if(mode==='match')pause(!state.paused);else exit();return;}
    if(mode!=='match'||state.paused)return;
    if(e.code in inputMap||jumpKeys.includes(e.code)||e.code in ARMAX_COMMANDS||e.code==='KeyF'){
      e.preventDefault();e.stopImmediatePropagation();heldKeys.add(e.code);
      if(!e.repeat&&jumpKeys.includes(e.code))jump=true;
      if(!e.repeat&&e.code in ARMAX_COMMANDS)attack=heldKeys.has('KeyJ')&&heldKeys.has('KeyK')?'throw':ARMAX_COMMANDS[e.code];
      if(!e.repeat&&(e.code==='KeyF'||heldKeys.has('KeyJ')&&heldKeys.has('KeyK')&&heldKeys.has('KeyL')))requestArmaxFinisher(state);
    }
  },{capture:true,signal:scope.signal});
  document.addEventListener('keyup',e=>heldKeys.delete(e.code),{signal:scope.signal});window.addEventListener('blur',()=>{clearInput();pause(true);},{signal:scope.signal});document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInput();pause(true);}},{signal:scope.signal});
  function dispose(){if(disposed)return;disposed=true;generation++;scope.abort();clearInput();view?.dispose();view=null;root.innerHTML='';}
  lobby();return {dispose,pause,snapshot:()=>state?structuredClone(state):null};
}
