import * as THREE from 'three';
import { createSimulationClock } from './simulation-clock.js';
import { ARMAX_FIGHTERS, ARMAX_STAGES, ARMAX_COMMANDS } from './armax-data.js';
import { ARMAX_BOSSES, ARMAX_ENEMIES, ARMAX_EFFECTS } from './armax-expansion-data.js';
import { createArmaxCampaign, armaxCampaignEncounter, beginArmaxCampaignBattle, commitArmaxCampaignResult, armaxCampaignEnding, loadArmaxCampaign, saveArmaxCampaign } from './armax-campaign.js';
import { createArmaxMatch, stepArmaxMatch, armaxCPUInput, pauseArmaxMatch, nextArmaxRound, requestArmaxFinisher, skipArmaxFinisher } from './armax-engine.js';
import './armax-ui.css';

const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const inputMap={ArrowLeft:'left',KeyA:'left',KeyQ:'left',ArrowRight:'right',KeyD:'right',ArrowDown:'down',KeyS:'down',ShiftLeft:'guard',ShiftRight:'guard'};
const jumpKeys=['ArrowUp','KeyW','KeyZ','Space'];
const percent=(value,max)=>Math.max(0,Math.min(100,value/Math.max(1,max)*100));

function createView(container,profiles,textures,effects={}){
  const scene=new THREE.Scene();scene.background=new THREE.Color('#07121a');
  const camera=new THREE.OrthographicCamera(-8,8,9,0,.1,50);camera.position.z=15;
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.domElement.setAttribute('aria-label','Arène de duel latéral');container.append(renderer.domElement);
  const resources=[...textures,...Object.values(effects).map(effect=>effect.texture)],ratio=textures[2].image.width/textures[2].image.height;
  const geometry=new THREE.PlaneGeometry(Math.max(16,9*ratio),Math.max(9,16/ratio)),material=new THREE.MeshBasicMaterial({map:textures[2],depthWrite:false});resources.push(geometry,material);
  const backdrop=new THREE.Mesh(geometry,material);backdrop.position.set(0,4.5,-2);scene.add(backdrop);
  // Shared XY planes preserve signed scale while keeping fighter origins at their feet.
  const fighterGeometry=new THREE.PlaneGeometry(1,1),effectGeometry=new THREE.PlaneGeometry(1,1);
  fighterGeometry.translate(0,.5,0);resources.push(fighterGeometry,effectGeometry);
  const silhouettes=profiles.map((profile,index)=>{
    const texture=textures[index],w=texture.image.width,h=texture.image.height,b=profile.visualBounds||[0,0,w,h];
    const left=Math.max(0,b[0]-8),top=Math.max(0,b[1]-8),right=Math.min(w,b[2]+8),bottom=Math.min(h,b[3]+8);
    texture.repeat.set((right-left)/w,(bottom-top)/h);texture.offset.set(left/w,1-bottom/h);
    const mat=new THREE.MeshBasicMaterial({map:texture,alphaTest:32/255,transparent:true,depthWrite:false});
    const sprite=new THREE.Mesh(fighterGeometry,mat);sprite.renderOrder=2+index;scene.add(sprite);resources.push(mat);
    const shadowGeo=new THREE.CircleGeometry(.5,32),shadowMat=new THREE.MeshBasicMaterial({color:'#020609',transparent:true,opacity:.35,depthWrite:false});
    const shadow=new THREE.Mesh(shadowGeo,shadowMat);shadow.scale.y=.18;scene.add(shadow);resources.push(shadowGeo,shadowMat);
    return {sprite,shadow,aspect:(right-left)/(bottom-top)};
  });
  // Native effect images are optional. Missing images retain the explicit
  // prototype tokens; these visuals never determine collisions or damage.
  const shotGeometry=new THREE.CircleGeometry(.1,12);resources.push(shotGeometry);const shotViews=new Map();
  const warningGeometry=new THREE.CircleGeometry(1,40);resources.push(warningGeometry);
  const warnings=profiles.map(()=>{const material=new THREE.MeshBasicMaterial({color:'#ffc66d',transparent:true,opacity:.4,depthWrite:false});const marker=new THREE.Mesh(warningGeometry,material);marker.visible=false;scene.add(marker);resources.push(material);return marker;});
  function resize(){const r=container.getBoundingClientRect();renderer.setSize(Math.max(1,r.width),Math.max(1,r.height));}
  const observer=new ResizeObserver(resize);observer.observe(container);resize();
  return {renderer,paint(state){
    state.players.forEach((p,index)=>{const {sprite,shadow,aspect}=silhouettes[index];sprite.position.set(p.x,1.8+p.y,.2+index*.05);sprite.scale.set(p.profile.height*aspect*p.facing,p.profile.height,1);sprite.material.color.set(p.effectFrames?(p.lastHit==='block'?'#93d9ff':'#ffd7bd'):'#ffffff');shadow.position.set(p.x,1.785,0);shadow.material.opacity=Math.max(.12,.35-p.y*.08);});
    state.players.forEach((p,index)=>{const marker=warnings[index],action=p.action;marker.visible=!!action?.area&&action.frame<=action.startup;if(marker.visible){marker.position.set(action.targetX,1.82,.6);marker.scale.set(action.areaRadius,.11,1);}});
    const live=new Set(state.projectiles.map(shot=>shot.id));for(const[id,mesh]of shotViews)if(!live.has(id)){scene.remove(mesh);mesh.material.dispose();shotViews.delete(id);}
    for(const shot of state.projectiles){
      let mesh=shotViews.get(shot.id);const effect=effects[shot.trap?'trap':profiles[shot.owner].species.toLowerCase().includes('asari')?'biotic':'kinetic'];
      if(!mesh){mesh=effect?new THREE.Mesh(effectGeometry,new THREE.MeshBasicMaterial({map:effect.texture,alphaTest:32/255,transparent:true,depthWrite:false})):new THREE.Mesh(shotGeometry,new THREE.MeshBasicMaterial({color:profiles[shot.owner].color,transparent:true,opacity:.9,depthWrite:false}));scene.add(mesh);shotViews.set(shot.id,mesh);}
      mesh.position.set(shot.x,1.8+shot.y,.5);
      if(effect){const width=shot.area?shot.radius*2:shot.trap ? .75 : 1.05;mesh.scale.set(width*(shot.vx<0?-1:1)*effect.facingSign,width/effect.aspect,1);}else mesh.scale.set(shot.area?shot.radius*10:shot.trap?2.4:2.5,shot.trap ? .65 : .6,1);
      mesh.material.opacity=shot.armed ? .4 : .95;
    }
    renderer.render(scene,camera);
  },dispose(){observer.disconnect();renderer.setAnimationLoop(null);for(const mesh of shotViews.values())mesh.material.dispose();for(const resource of resources)resource.dispose();renderer.dispose();renderer.domElement.remove();}};
}

export function mountArmax(root,{onExit,baseUrl=import.meta.env.BASE_URL}={}){
  const scope=new AbortController(),clock=createSimulationClock(),heldKeys=new Set(),heldPointers=new Map();
  let mode='lobby',disposed=false,generation=0,state=null,view=null,attack=null,jump=false,hudStamp='',notice='',activeCampaign=null,campaignToken=null,sessionEncounter=null;
  let storage=null;try{storage=window.localStorage;}catch{/* Private mode can deny storage; combat remains available. */}
  const selection={player:ARMAX_FIGHTERS[0].id,opponent:ARMAX_FIGHTERS[1].id,stage:ARMAX_STAGES[0].id,mode:'cpu',dummy:'idle'};
  const byId=id=>ARMAX_FIGHTERS.find(item=>item.id===id);
  const options=(items,selected)=>items.map(item=>`<option value="${item.id}"${item.id===selected?' selected':''}${item.assetAvailable===false?' disabled':''}>${esc(item.name)}${item.assetAvailable===false?' · visuel en production':''}</option>`).join('');
  const opponentList=()=>selection.mode==='boss'?ARMAX_BOSSES:selection.mode==='enemy'?ARMAX_ENEMIES:ARMAX_FIGHTERS;
  const selectedOpponent=()=>opponentList().find(item=>item.id===selection.opponent)||opponentList().find(item=>item.assetAvailable!==false)||opponentList()[0];
  function checkpoint(){if(activeCampaign&&!saveArmaxCampaign(storage,activeCampaign))notice='La progression reste en mémoire : le stockage local est indisponible.';}
  function clearInput(){heldKeys.clear();heldPointers.clear();attack=null;jump=false;}
  function focus(selector){root.querySelector(selector)?.focus();}
  function lobby(){
    generation++;view?.dispose();view=null;state=null;mode='lobby';activeCampaign=null;campaignToken=null;sessionEncounter=null;clearInput();
    const saved=loadArmaxCampaign(storage),opponents=opponentList();selection.opponent=selectedOpponent().id;
    const modeOptions=[['cpu','Duel contre l’IA'],['training','Entraînement'],['boss','Défi de boss'],['enemy','Avant-poste'],['campaign','Route personnelle · 8 combats']].map(([id,label])=>`<option value="${id}"${selection.mode===id?' selected':''}>${label}</option>`).join('');
    root.innerHTML=`<section class="armax-screen armax-lobby" role="dialog" aria-modal="true" aria-label="Armax Relay Clash">
      <header class="armax-header"><div><p class="armax-eyebrow">ARMAX RELAY CLASH · DOSSIER NACRE</p><h1>Les Dettes de Nacre</h1><p>Duel local dans les systèmes Terminus · 2185</p></div><button class="secondary" data-armax="exit">Retour</button></header>
      <div class="armax-lobby-body"><article class="armax-intro"><span class="armax-kicker">CHOISIR SA TRAVERSÉE</span><h2>Le quai garde toutes les dettes.</h2><p>Faites céder la protection, surveillez votre jauge et trouvez l’ouverture. Les défis annoncent leurs actions ; les routes personnelles traversent huit affrontements.</p>
      <p class="armax-prototype">Duel, entraînement, défis et parcours personnels : choisissez votre approche de la crise de Nacre.</p>
      <div class="armax-roster-count"><strong>10</strong><span>personnages originaux</span><strong>${ARMAX_STAGES.length}</strong><span>arènes de prototype</span></div>
      ${saved?`<button class="secondary" data-armax="campaign-resume">${saved.status==='completed'?'Revoir la conclusion':'Reprendre la route'} · ${esc(byId(saved.fighterId).name)} · ${saved.index}/8</button>`:''}</article>
      <form class="armax-setup"><label>Votre combattant<select name="player">${options(ARMAX_FIGHTERS,selection.player)}</select></label><p class="armax-profile" data-profile="player"></p>
      <label>Mode<select name="mode">${modeOptions}</select></label>
      <label>${selection.mode==='boss'?'Boss':selection.mode==='enemy'?'Avant-poste':'Adversaire'}<select name="opponent"${selection.mode==='campaign'?' disabled':''}>${options(opponents,selection.opponent)}</select></label><p class="armax-profile" data-profile="opponent"></p>
      <label>Arène<select name="stage"${['campaign','boss','enemy'].includes(selection.mode)?' disabled':''}>${options(ARMAX_STAGES,selection.stage)}</select></label>
      <label>Cible d’entraînement<select name="dummy"><option value="idle"${selection.dummy==='idle'?' selected':''}>Immobile</option><option value="guard"${selection.dummy==='guard'?' selected':''}>Garde haute</option><option value="low"${selection.dummy==='low'?' selected':''}>Garde basse</option></select></label>
      <button class="primary armax-launch" type="submit">${selection.mode==='campaign'?'Commencer cette route':'Lancer le duel'} <span>→</span></button><p class="armax-message" role="status">${esc(notice)}</p></form></div>
      <footer class="armax-help"><strong>Commandes</strong><span>Flèches / ZQSD : déplacement · Haut : saut · Bas : accroupi · Arrière ou Maj : garde</span><span>J : léger · K : moyen · L : lourd · U : spécial · I : super (100) · O : prise / déprojection · Échap : pause</span></footer></section>`;
    updateProfile();focus('select[name="player"]');
  }
  function updateProfile(){
    const player=byId(selection.player),opponent=selectedOpponent();
    root.querySelector('[data-profile="player"]').textContent=`${player.species} · ${player.role} · ${player.specialName}`;
    root.querySelector('[data-profile="opponent"]').textContent=selection.mode==='campaign'?'Une route alternative de huit duels. Point de contrôle séparé après chaque victoire.':`${opponent.species} · ${opponent.role} · ${opponent.specialName}`;
    if(['boss','enemy'].includes(selection.mode)){selection.stage=opponent.stageId;root.querySelector('[name="stage"]').value=selection.stage;}
    const dummy=root.querySelector('[name="dummy"]');if(dummy)dummy.disabled=selection.mode!=='training';
  }
  function showCampaignScene(){
    if(!activeCampaign)return;
    generation++;view?.dispose();view=null;state=null;mode='story';clearInput();
    const fighter=byId(activeCampaign.fighterId),ending=armaxCampaignEnding(activeCampaign),encounter=armaxCampaignEncounter(activeCampaign),stage=ARMAX_STAGES.find(item=>item.id===(encounter?.stageId||'nacre_stage_20'));
    const paragraphs=ending?[ending]:encounter.paragraphs;
    root.innerHTML=`<section class="armax-screen armax-story" role="dialog" aria-modal="true" aria-label="Route personnelle de Nacre"><header class="armax-header"><div><p class="armax-eyebrow">ROUTE PERSONNELLE · ${activeCampaign.index}/8 COMBATS ACHEVÉS</p><h1>${esc(fighter.name)}</h1></div><nav><button class="secondary" data-armax="selection">Sélection</button><button class="secondary" data-armax="exit">Retour</button></nav></header>
      <div class="armax-story-layout"><article><p class="armax-kicker">${ending?'CONCLUSION LOCALE':`ÉTAPE ${activeCampaign.index+1} · ${esc(stage.name)}`}</p><h2>${ending?'Ce qui reste à transmettre':esc(encounter.title)}</h2>${paragraphs.map(text=>`<p>${esc(text)}</p>`).join('')}
      ${ending?'<p class="armax-prototype">Huit duels achevés. Cette branche concerne l’incident de Nacre ; elle ne modifie aucune décision de la campagne principale.</p><button class="primary" data-armax="selection">Revenir à la sélection</button>':`<p class="armax-prototype">${esc(encounter.scope)} ${encounter.opponent.encounter?'Une manche de 99 secondes ; attaques annoncées et récupération vulnérable.':'Deux manches gagnantes ; duel non létal.'}</p><button class="primary" data-armax="campaign-fight"${encounter.opponent.assetAvailable===false?' disabled':''}>Engager le combat ${activeCampaign.index+1}/8</button>${encounter.opponent.assetAvailable===false?'<p class="armax-message">Le visuel propre de cet adversaire reste en production. Le point de contrôle est conservé.</p>':''}`}
      ${notice?`<p class="armax-message">${esc(notice)}</p>`:''}</article><figure><img src="${esc(baseUrl+stage.image)}" alt="${esc(stage.name)}"><figcaption>${esc(stage.name)} · décor de la route</figcaption></figure></div></section>`;
    focus(ending?'[data-armax="selection"]':'[data-armax="campaign-fight"]');
  }
  function matchMarkup(){
    return `<section class="armax-screen armax-match" role="dialog" aria-modal="true" aria-label="Duel Armax"><header class="armax-header"><div><p class="armax-eyebrow">ARMAX RELAY CLASH · NACRE</p><h1>${esc(ARMAX_STAGES.find(item=>item.id===selection.stage).name)}</h1></div><nav><button class="secondary" data-armax="pause">Pause</button><button class="secondary" data-armax="selection">Sélection</button><button class="secondary" data-armax="exit">Retour</button></nav></header><div class="armax-hud">${[0,1].map(i=>`<div class="armax-health armax-p${i}" data-player="${i}"><div class="armax-name"><strong>${esc(state.players[i].profile.name)}</strong><span data-wins="${i}">○ ○</span></div><div class="armax-bar armax-life"><i data-life="${i}"></i></div><div class="armax-values"><span data-hp="${i}"></span><span data-shield-value="${i}"></span></div><div class="armax-bar armax-shield"><i data-shield="${i}"></i></div><div class="armax-meter"><span>JAUGE</span><div class="armax-bar"><i data-meter="${i}"></i></div><b data-meter-value="${i}"></b></div></div>`).join('')}<div class="armax-clock"><strong data-clock>99</strong><span data-round>Manche 1</span></div></div><div class="armax-arena-wrap"><div class="armax-arena"></div><div class="armax-match-overlay" hidden></div><p class="armax-loading" role="status">Chargement de l’arène et des deux personnages…</p></div><p class="armax-live" role="status" aria-live="polite"></p><p class="armax-encounter" data-encounter-status></p><div class="armax-touch"><div class="armax-dpad"><button data-armax-hold="left" aria-label="Se déplacer à gauche">←</button><button data-armax-hold="right" aria-label="Se déplacer à droite">→</button><button data-armax-hold="down" aria-label="S’accroupir">↓</button><button data-armax="jump" aria-label="Sauter">↑</button><button data-armax-hold="guard">Garde</button></div><div class="armax-attacks"><button data-armax-attack="L">Léger <kbd>J</kbd></button><button data-armax-attack="M">Moyen <kbd>K</kbd></button><button data-armax-attack="H">Lourd <kbd>L</kbd></button><button data-armax-attack="S">Spécial <kbd>U</kbd></button><button data-armax-attack="super">Super <kbd>I</kbd></button><button data-armax-attack="throw">Prise <kbd>O</kbd></button></div></div><footer class="armax-help"><span>Haut / bas / arrière : saut, accroupi, garde · Échap : pause · J → K → U → I sur touche</span><span>Essai local · poses fixes · paramètres provisoires · campagne principale et Chroniques préservées</span></footer></section>`;
  }
  async function start(){
    if(mode==='loading')return;
    let opponent=selectedOpponent();
    if(activeCampaign){
      sessionEncounter=armaxCampaignEncounter(activeCampaign);if(!sessionEncounter)return showCampaignScene();
      opponent=sessionEncounter.opponent;selection.player=activeCampaign.fighterId;selection.stage=sessionEncounter.stageId;
      if(opponent.assetAvailable===false){notice='Le visuel de cet adversaire reste en production.';showCampaignScene();return;}
      if(activeCampaign.status==='in-battle')activeCampaign.status='ready';
      campaignToken=beginArmaxCampaignBattle(activeCampaign);if(!campaignToken)return;checkpoint();
    }else if(['boss','enemy'].includes(selection.mode))selection.stage=opponent.stageId;
    if(opponent.assetAvailable===false){notice='Le visuel propre de cet adversaire reste en production.';lobby();return;}
    const profiles=[byId(selection.player),opponent],stage=ARMAX_STAGES.find(item=>item.id===selection.stage),ticket=++generation;
    view?.dispose();view=null;clearInput();state=createArmaxMatch({fighters:profiles,mode:selection.mode==='training'?'training':'cpu'});mode='loading';hudStamp='';root.innerHTML=matchMarkup();paintHUD(true);
    const loader=new THREE.TextureLoader(),effectDefs=ARMAX_EFFECTS.filter(effect=>effect.assetAvailable),paths=[...profiles.map(p=>p.sprite),stage.image,...effectDefs.map(effect=>effect.sprite)];
    const loaded=await Promise.allSettled(paths.map(path=>loader.loadAsync(`${baseUrl}${path}`))),allTextures=loaded.filter(item=>item.status==='fulfilled').map(item=>item.value),textures=loaded.slice(0,3).filter(item=>item.status==='fulfilled').map(item=>item.value);
    if(ticket!==generation||disposed){allTextures.forEach(texture=>texture.dispose());return;}
    if(loaded.slice(0,3).some(item=>item.status==='rejected')){allTextures.forEach(texture=>texture.dispose());notice='Un visuel de ce duel est indisponible. Le point de contrôle éventuel est conservé.';if(activeCampaign){activeCampaign.status='ready';checkpoint();showCampaignScene();}else lobby();return;}
    allTextures.forEach(texture=>{texture.colorSpace=THREE.SRGBColorSpace;texture.minFilter=THREE.LinearFilter;texture.magFilter=THREE.LinearFilter;});
    const effects={};effectDefs.forEach((definition,index)=>{const result=loaded[3+index];if(result.status!=='fulfilled')return;const texture=result.value,w=texture.image.width,h=texture.image.height,b=definition.visualBounds||[0,0,w,h];const left=Math.max(0,b[0]-8),top=Math.max(0,b[1]-8),right=Math.min(w,b[2]+8),bottom=Math.min(h,b[3]+8);texture.repeat.set((right-left)/w,(bottom-top)/h);texture.offset.set(left/w,1-bottom/h);effects[definition.kind]={texture,aspect:(right-left)/(bottom-top),facingSign:definition.facingSign||1};});
    try{view=createView(root.querySelector('.armax-arena'),profiles,textures,effects);}catch{allTextures.forEach(texture=>texture.dispose());notice='Le rendu de l’arène ne peut pas démarrer. Réessayez après avoir activé l’accélération graphique.';lobby();return;}
    mode='match';root.querySelector('.armax-loading').hidden=true;clock.reset(performance.now());focus('[data-armax="pause"]');view.renderer.setAnimationLoop(frame);paintHUD(true);if(document.hidden||!document.hasFocus())pause(true);
  }
  function playerInput(){const held=new Set([...heldKeys].map(key=>inputMap[key]).filter(Boolean));for(const value of heldPointers.values())held.add(value);const result={left:held.has('left'),right:held.has('right'),down:held.has('down'),guard:held.has('guard'),jump,attack};jump=false;attack=null;return result;}
  function frame(now){
    if(disposed||mode!=='match')return;const batch=clock.advance(now,{suspended:state.paused||document.hidden});if(batch.interrupted)pause(true);
    for(let i=0;i<batch.steps;i++){const opponent=state.mode==='cpu'?armaxCPUInput(state):selection.dummy==='idle'?{}:{guard:true,down:selection.dummy==='low'};stepArmaxMatch(state,[playerInput(),opponent]);}
    view.paint(state);paintHUD();
  }
  function paintHUD(force=false){
    if(!state)return;
    if(activeCampaign&&state.result&&commitArmaxCampaignResult(activeCampaign,campaignToken,state.result))checkpoint();
    const signature=JSON.stringify([state.players.map(p=>[p.hp,p.shield,p.meter,p.specialCharges,p.encounterState?.phase,p.action?.name,p.action? p.action.frame<=p.action.startup?'warning':p.action.frame<=p.action.startup+p.action.active?'active':'recovery':'idle']),state.wins,Math.ceil(state.roundFrames/60),state.phase,state.paused,state.eventId,state.finisherFrames>0,state.finisherWindow>0]);if(!force&&signature===hudStamp)return;hudStamp=signature;
    state.players.forEach((p,i)=>{root.querySelector(`[data-life="${i}"]`).style.width=`${percent(p.hp,p.profile.life)}%`;root.querySelector(`[data-hp="${i}"]`).textContent=`${p.hp} / ${p.profile.life} PV`;root.querySelector(`[data-shield="${i}"]`).style.width=`${percent(p.shield,p.profile.shield)}%`;root.querySelector(`[data-shield-value="${i}"]`).textContent=`${p.shield} protection${p.specialCharges!==null?` · ${p.specialCharges}/2 réserves`:''}`;root.querySelector(`[data-meter="${i}"]`).style.width=`${percent(p.meter,300)}%`;root.querySelector(`[data-meter-value="${i}"]`).textContent=`${p.meter} / 300`;root.querySelector(`[data-wins="${i}"]`).textContent=Array.from({length:state.roundsToWin},(_,n)=>state.wins[i]>n?'●':'○').join(' ');});
    root.querySelector('[data-clock]').textContent=Math.ceil(state.roundFrames/60);root.querySelector('[data-round]').textContent=`Manche ${state.round}`;root.querySelector('.armax-live').textContent=state.lastEvent;
    const opponent=state.players[1],routine=opponent.encounterState,encounterStatus=root.querySelector('[data-encounter-status]');
    if(routine){const phase=opponent.profile.encounter.phases[routine.phase],action=opponent.action,actionState=action?(action.frame<=action.startup?'ANNONCE':action.frame<=action.startup+action.active?'ACTION':'RÉCUPÉRATION'):'EN ATTENTE';encounterStatus.hidden=false;encounterStatus.textContent=`Phase ${routine.phase+1}/${opponent.profile.encounter.phases.length} · ${phase.name} · ${actionState} · ${phase.counterplay}`;}else{encounterStatus.hidden=true;encounterStatus.textContent='';}
    root.querySelector('[data-armax-attack="super"]').disabled=mode!=='match'||state.paused||state.phase!=='playing'||state.players[0].meter<100;
    const panel=root.querySelector('.armax-match-overlay'),key=`${state.paused}|${state.phase}|${state.finisherFrames>0}|${state.finisherWindow>0}`;if(panel.dataset.state===key&&!force)return;panel.dataset.state=key;
    if(state.paused){panel.hidden=false;panel.innerHTML='<div><p class="armax-eyebrow">SIMULATION SUSPENDUE</p><h2>Pause</h2><button class="primary" data-armax="resume">Reprendre le duel</button><button class="secondary" data-armax="restart">Recommencer</button><button class="secondary" data-armax="selection">Changer de combattants</button></div>';focus('[data-armax="resume"]');}
    else if(state.phase==='round-over'){panel.hidden=false;panel.innerHTML=`<div><h2>${esc(state.lastEvent)}</h2><button class="primary" data-armax="next">Manche suivante</button></div>`;focus('[data-armax="next"]');}
    else if(state.phase==='match-over'){panel.hidden=false;panel.innerHTML=`<div><p class="armax-eyebrow">DUEL TERMINÉ</p><h2>${esc(state.players[state.result.winner].profile.name)}</h2><p>${state.wins.join(' — ')} · ${state.result.reason==='KO_final'?'KO final':'Temps écoulé'}</p>${activeCampaign?`<p>${esc(state.result.winner===0?sessionEncounter.victory:'Défaite. Le même point de contrôle reste disponible.')}</p>`:''}${state.finisherFrames?'<p>Neutralisation décisive · l’adversaire est mis hors combat.</p><button class="secondary" data-armax="skip">Passer la présentation</button>':state.finisherWindow>0?'<button class="secondary" data-armax="finish">Neutralisation décisive <kbd>F</kbd></button>':''}${activeCampaign?`<button class="primary" data-armax="${state.result.winner===0?'campaign-next':'campaign-retry'}">${state.result.winner===0?activeCampaign.status==='completed'?'Voir la conclusion':'Étape suivante':'Réessayer cette étape'}</button>`:'<button class="primary" data-armax="restart">Rejouer</button>'}<button class="secondary" data-armax="selection">Sélection</button></div>`;focus(activeCampaign?`[data-armax="${state.result.winner===0?'campaign-next':'campaign-retry'}"]`:'[data-armax="restart"]');}
    else{panel.hidden=true;panel.innerHTML='';}
  }
  function pause(value=true){if(!state||mode!=='match')return;pauseArmaxMatch(state,value);clearInput();clock.reset(performance.now());paintHUD(true);}
  function exit(){dispose();onExit?.();}
  root.addEventListener('submit',e=>{if(e.target.matches('.armax-setup')){e.preventDefault();if(selection.mode==='campaign'){activeCampaign=createArmaxCampaign(selection.player);checkpoint();showCampaignScene();}else start();}},{signal:scope.signal});
  root.addEventListener('change',e=>{if(e.target.name&&e.target.name in selection){selection[e.target.name]=e.target.value;if(e.target.name==='mode'){lobby();focus('[name="mode"]');}else updateProfile();}},{signal:scope.signal});
  root.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b||b.disabled)return;const actionName=b.dataset.armax;
    if(b.dataset.armaxAttack&&e.detail===0&&state&&!state.paused)attack=b.dataset.armaxAttack;
    if(actionName==='exit')exit();else if(actionName==='selection')lobby();else if(actionName==='pause')pause(!state?.paused);else if(actionName==='resume')pause(false);else if(actionName==='restart')start();
    else if(actionName==='campaign-resume'){activeCampaign=loadArmaxCampaign(storage);if(activeCampaign){selection.mode='campaign';showCampaignScene();}}
    else if(actionName==='campaign-fight'||actionName==='campaign-retry')start();else if(actionName==='campaign-next')showCampaignScene();
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
