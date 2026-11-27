// Deterministic local-only 60 Hz duel; no campaign, Chronicle or storage import.
export const ARMAX_RULES=Object.freeze({hz:60,roundsToWin:2,seconds:99,buffer:5,maxMeter:300,superCost:100,rechargeDelay:300,rechargePerFrame:1,throwTech:10,wakeupThrowImmunity:8,comboScaling:[1,.8,.65,.5,.35,.25],comboGainCap:30,finisherWindow:120});
const BOUNDS=6.5,BODY=.32,GRAVITY=.0105;
const clamp=(n,low,high)=>Math.max(low,Math.min(high,n));
const finite=(value,fallback)=>Number.isFinite(value)?value:fallback;
const NO_INPUT=Object.freeze({});
function fighter(profile,side){
  if(!profile||typeof profile.id!=='string'||!Number.isFinite(profile.life)||profile.life<=0||!Number.isFinite(profile.shield)||profile.shield<0)throw new TypeError('Profil Armax invalide');
  return {profile:structuredClone(profile),hp:profile.life,shield:profile.shield,meter:0,x:side?2.25:-2.25,y:0,vy:0,facing:side?-1:1,shieldDelay:0,hitstun:0,blockstun:0,throwImmune:0,action:null,buffer:null,combo:null,specialCharges:profile.specialKind==='shield'?2:null,guarding:null,lastMove:'Prêt',effectFrames:0,lastHit:''};
}
export function createArmaxMatch({fighters,mode='cpu'}={}){
  if(!Array.isArray(fighters)||fighters.length!==2)throw new TypeError('Deux combattants requis');
  if(!['cpu','training'].includes(mode))throw new TypeError('Mode Armax invalide');
  return {ruleSetId:'RC-ARMAX-0.1',mode,players:fighters.map(fighter),phase:'playing',paused:false,frame:0,ticks:0,roundFrames:5940,round:1,wins:[0,0],hitstop:0,projectiles:[],throwPending:null,nextAction:1,result:null,roundResult:null,finisherFrames:0,finisherWindow:0,lastEvent:'Manche 1 · Combat',eventId:0};
}
function event(state,message){state.lastEvent=message;state.eventId++;}
function clearActions(state){for(const p of state.players){p.buffer=null;p.action=null;p.guarding=null;}state.projectiles=[];state.throwPending=null;}
export function pauseArmaxMatch(state,paused=true){state.paused=!!paused;for(const p of state.players){p.buffer=null;p.guarding=null;}}
export function nextArmaxRound(state){
  if(state.phase!=='round-over')return false;
  state.players=state.players.map((p,side)=>fighter(p.profile,side));state.round++;state.roundFrames=5940;state.hitstop=0;state.roundResult=null;state.phase='playing';clearActions(state);event(state,`Manche ${state.round} · Combat`);return true;
}
export function requestArmaxFinisher(state){
  if(state.phase!=='match-over'||state.result?.reason!=='KO_final'||!Number.isInteger(state.result.winner)||state.finisherWindow<=0||state.finisherFrames>0||state.paused)return false;
  state.finisherWindow=0;state.finisherFrames=72;event(state,'Neutralisation décisive · présentation sobre');return true;
}
export function skipArmaxFinisher(state){state.finisherFrames=0;}
function moveFor(p,kind,input){
  const airborne=p.y>.05,low=!airborne&&input.down;
  const common={cost:0,hitstop:10,hitstun:30,blockstun:18,level:airborne?'air':low?'low':'mid',ranged:false};
  if(kind==='L')return {...common,kind,name:low?'Frappe basse légère':'Frappe légère',damage:55,startup:5,active:3,recovery:12,range:1.22,hitstop:6,hitstun:22,blockstun:11};
  if(kind==='M')return {...common,kind,name:low?'Frappe basse moyenne':'Frappe moyenne',damage:90,startup:9,active:4,recovery:18,range:1.48,hitstop:8,hitstun:29,blockstun:15};
  if(kind==='H')return {...common,kind,name:low?'Balayage':'Frappe lourde',damage:130,startup:15,active:5,recovery:25,range:1.78,hitstun:36,blockstun:20};
  if(kind==='throw'&&!airborne)return {...common,kind,name:'Saisie',damage:100,startup:5,active:2,recovery:34,range:.7,level:'throw',hitstun:30};
  if(kind==='S'){
    const special=p.profile.specialKind;if(airborne&&['trap','shield','charge'].includes(special))return null;
    return {...common,kind,name:p.profile.specialName,damage:special==='trap'?105:special==='charge'?125:110,startup:special==='shield'?38:special==='trap'?17:12,active:special==='charge'?12:4,recovery:special==='shield'?40:26,range:special==='melee'?1.85:1.3,ranged:special==='projectile',trap:special==='trap',charge:special==='charge',shieldRestore:special==='shield',level:special==='trap'?'low':airborne?'air':'mid',hitstun:34};
  }
  if(kind==='super')return {...common,kind,name:'Engagement décisif',cost:100,damage:235,startup:18,active:6,recovery:38,range:2.4,ranged:p.profile.specialKind==='projectile',hitstun:40};
  return null;
}
function canCancel(action,next){return !!action?.hit&&(action.kind==='L'&&next==='M'||['M','H'].includes(action.kind)&&next==='S'||action.kind==='S'&&next==='super');}
function startAction(state,index,kind,input){
  const p=state.players[index];if(p.hitstun||p.blockstun||state.throwPending||p.action&&!canCancel(p.action,kind))return false;
  const move=moveFor(p,kind,{...input,down:p.buffer?.down??input.down});if(!move||p.meter<move.cost)return false;
  if(move.shieldRestore&&(!p.specialCharges||p.shield>=p.profile.shield))return false;
  p.meter-=move.cost;p.shieldDelay=300;if(move.shieldRestore)p.specialCharges--;
  p.action={...move,id:state.nextAction++,frame:0,facing:p.buffer?.facing??p.facing,contacted:false,emitted:false,hit:false};p.facing=p.action.facing;p.guarding=null;p.lastMove=move.name;p.buffer=null;return true;
}
function blocked(target,move){
  if(target.y>.05||target.hitstun||target.action||!target.guarding||move.level==='throw')return false;
  return target.guarding==='low'?['mid','low'].includes(move.level):['mid','air','overhead'].includes(move.level);
}
function applyDamage(p,amount,nonlethal=false){const shieldDamage=Math.min(p.shield,amount);p.shield-=shieldDamage;const healthDamage=Math.min(Math.max(0,p.hp-(nonlethal?1:0)),Math.max(0,amount-shieldDamage));p.hp-=healthDamage;return shieldDamage+healthDamage;}
function meterGain(p,combo,index,amount){const gain=Math.max(0,Math.min(amount,30-combo.gains[index]));p.meter=Math.min(300,p.meter+gain);combo.gains[index]+=gain;}
function contact(state,hit){
  const p=state.players[hit.owner],target=state.players[1-hit.owner],move=hit.move;p.shieldDelay=target.shieldDelay=300;
  if(hit.isBlocked){
    const chip=['S','super'].includes(move.kind)?Math.floor(move.damage*.05):0;const damage=applyDamage(target,chip,true);
    const combo=target.combo||={owner:hit.owner,moves:[],count:0,damage:0,gains:[0,0]};
    if(move.kind!=='super')meterGain(p,combo,hit.owner,3);if(damage&&move.kind!=='super')meterGain(target,combo,1-hit.owner,5);
    target.blockstun=move.blockstun;target.effectFrames=12;target.lastHit='block';state.hitstop=Math.max(state.hitstop,5);event(state,`${target.profile.name} · garde ${target.guarding==='low'?'basse':'haute'}`);return;
  }
  if(!target.combo||!target.hitstun||target.combo.owner!==hit.owner)target.combo={owner:hit.owner,moves:[],count:0,damage:0,gains:[0,0]};
  const combo=target.combo;if(combo.count>=6||combo.moves.includes(move.kind))return;
  const dealt=applyDamage(target,Math.floor(move.damage*ARMAX_RULES.comboScaling[combo.count]));combo.moves.push(move.kind);combo.count++;combo.damage+=dealt;
  target.hitstun=move.hitstun;target.blockstun=0;target.action=null;target.buffer=null;target.guarding=null;target.effectFrames=14;target.lastHit='hit';
  if(p.action?.id===move.id)p.action.hit=true;
  if(move.kind!=='super')meterGain(p,combo,hit.owner,move.kind==='S'?4:8);if(dealt&&move.kind!=='super')meterGain(target,combo,1-hit.owner,5);
  target.x=clamp(target.x+move.facing*.16,-BOUNDS,BOUNDS);state.hitstop=Math.max(state.hitstop,move.hitstop);
  event(state,`${p.profile.name} · ${move.name} · ${combo.count>1?`${combo.count} coups / `:''}${combo.damage} dégâts`);
}
function resolveRound(state){
  const[a,b]=state.players;if(a.hp>0&&b.hp>0&&state.roundFrames>0)return;
  let winner=null,reason='égalité';
  if(a.hp===0&&b.hp===0)reason='double_KO';
  else if(a.hp===0||b.hp===0){winner=a.hp>0?0:1;reason='KO';}
  else{const life=a.hp*b.profile.life-b.hp*a.profile.life;const shield=(a.profile.shield?a.shield/a.profile.shield:0)-(b.profile.shield?b.shield/b.profile.shield:0);winner=life?life>0?0:1:shield?shield>0?0:1:null;reason=winner===null?'égalité':'temps_ecoule';}
  if(winner!==null)state.wins[winner]++;state.roundResult=Object.freeze({winner,reason,round:state.round});clearActions(state);
  if(winner!==null&&state.wins[winner]>=2){state.phase='match-over';state.result=Object.freeze({winner,reason:reason==='KO'?'KO_final':reason,wins:[...state.wins]});state.finisherWindow=reason==='KO'?120:0;event(state,`${state.players[winner].profile.name} remporte le duel`);}
  else{state.phase='round-over';event(state,winner===null?'Égalité · aucun point, manche supplémentaire':`${state.players[winner].profile.name} remporte la manche`);}
}
function separateBodies(state){const[a,b]=state.players;if(Math.abs(a.y-b.y)>1.3||Math.abs(a.x-b.x)>=BODY*2)return;const sign=a.x<=b.x?1:-1,overlap=BODY*2-Math.abs(a.x-b.x);a.x=clamp(a.x-sign*overlap/2,-BOUNDS,BOUNDS);b.x=clamp(b.x+sign*overlap/2,-BOUNDS,BOUNDS);}
function throwTick(state,inputs){
  const pending=state.throwPending;if(!pending)return false;const attacker=state.players[pending.owner],defender=state.players[1-pending.owner];
  if(inputs[1-pending.owner]?.attack==='throw'){state.throwPending=null;attacker.action=defender.action=null;attacker.hitstun=defender.hitstun=12;attacker.x=clamp(attacker.x-attacker.facing*.35,-BOUNDS,BOUNDS);defender.x=clamp(defender.x-defender.facing*.35,-BOUNDS,BOUNDS);defender.throwImmune=20;event(state,'Déprojection');}
  else if(--pending.remaining<=0){state.throwPending=null;contact(state,{owner:pending.owner,move:pending.move,isBlocked:false});defender.throwImmune=8+pending.move.hitstun;}return true;
}
export function stepArmaxMatch(state,inputs=[NO_INPUT,NO_INPUT]){
  if(state.paused)return state;state.ticks++;
  if(state.phase==='match-over'){state.finisherWindow=Math.max(0,state.finisherWindow-1);state.finisherFrames=Math.max(0,state.finisherFrames-1);return state;}
  if(state.phase!=='playing')return state;
  for(let i=0;i<2;i++){const input=inputs[i]||NO_INPUT,p=state.players[i];if(['L','M','H','S','super','throw'].includes(input.attack))p.buffer={kind:input.attack,remaining:5,down:!!input.down,facing:p.facing};}
  if(state.hitstop>0){state.hitstop--;return state;}state.frame++;state.roundFrames=Math.max(0,state.roundFrames-1);
  if(throwTick(state,inputs)){resolveRound(state);return state;}
  const contacts=[];
  for(let i=0;i<2;i++){
    const p=state.players[i],target=state.players[1-i],input=inputs[i]||NO_INPUT;
    p.effectFrames=Math.max(0,p.effectFrames-1);p.hitstun=Math.max(0,p.hitstun-1);p.blockstun=Math.max(0,p.blockstun-1);p.throwImmune=Math.max(0,p.throwImmune-1);
    if(!p.hitstun&&!p.blockstun)p.combo=null;p.shieldDelay=Math.max(0,p.shieldDelay-1);if(!p.shieldDelay)p.shield=Math.min(p.profile.shield,p.shield+1);
    if(!p.action)p.facing=target.x>=p.x?1:-1;
    if(p.buffer){startAction(state,i,p.buffer.kind,input);if(p.buffer&&--p.buffer.remaining<=0)p.buffer=null;}
    const locked=p.hitstun||p.blockstun||!!p.action,direction=input.guard?-p.facing:Number(!!input.right)-Number(!!input.left);
    p.guarding=!p.action&&!p.hitstun&&p.y===0&&direction===-p.facing?input.down?'low':'high':null;
    if(!locked){if(!input.down&&!input.guard)p.x=clamp(p.x+direction*finite(p.profile.speed,2.5)/60,-BOUNDS,BOUNDS);if(input.jump&&p.y===0){p.vy=.155;p.guarding=null;}}
    if(p.y>0||p.vy>0){p.y=Math.max(0,p.y+p.vy);p.vy-=GRAVITY;if(p.y===0)p.vy=0;}
    const action=p.action;if(!action)continue;action.frame++;
    if(action.frame>action.startup&&action.frame<=action.startup+action.active){
      if(action.charge)p.x=clamp(p.x+action.facing*.14,-BOUNDS,BOUNDS);
      if((action.ranged||action.trap)&&!action.emitted){
        if(action.trap)state.projectiles=state.projectiles.filter(item=>item.owner!==i||!item.trap);
        state.projectiles.push({id:action.id,owner:i,x:clamp(p.x+action.facing*.75,-BOUNDS,BOUNDS),y:action.trap?.12:p.y+.9,vx:action.trap?0:action.facing*.17,life:action.trap?240:100,armed:action.trap?18:0,trap:!!action.trap,move:{...action}});action.emitted=true;
      }else if(action.shieldRestore&&!action.emitted){p.shield=Math.min(p.profile.shield,p.shield+120);action.emitted=true;event(state,`${p.profile.name} · réserve de bouclier +120 maximum · ${p.specialCharges} charge restante`);}
      else if(!action.ranged&&!action.trap&&!action.shieldRestore&&!action.contacted){
        const dx=(target.x-p.x)*action.facing;
        if(dx>=-.15&&dx<=action.range&&Math.abs(target.y-p.y)<1.2){
          if(action.kind==='throw'){
            if(!target.throwImmune&&target.y===0&&!target.hitstun&&!target.blockstun){action.contacted=true;if(inputs[1-i]?.attack==='throw'){target.hitstun=p.hitstun=12;p.action=target.action=null;event(state,'Déprojection');}else state.throwPending={owner:i,move:{...action},remaining:10};}
          }else{action.contacted=true;contacts.push({owner:i,move:{...action},isBlocked:blocked(target,action)});}
        }
      }
    }
    if(action.frame>=action.startup+action.active+action.recovery)p.action=null;
  }
  separateBodies(state);
  for(const shot of state.projectiles){const target=state.players[1-shot.owner];shot.life--;shot.x+=shot.vx;shot.armed=Math.max(0,shot.armed-1);const hits=!shot.armed&&Math.abs(target.x-shot.x)<.48&&(shot.trap?target.y<.5:Math.abs(target.y+.9-shot.y)<.8);if(hits){shot.life=0;contacts.push({owner:shot.owner,move:shot.move,isBlocked:blocked(target,shot.move)});}if(Math.abs(shot.x)>BOUNDS+1)shot.life=0;}
  // Snapshot contacts before damage resolution so equally active hits can trade.
  for(const hit of contacts)contact(state,hit);if(state.throwPending&&state.players[state.throwPending.owner].hitstun)state.throwPending=null;
  state.projectiles=state.projectiles.filter(shot=>shot.life>0);resolveRound(state);return state;
}
export function armaxCPUInput(state){
  if(state.phase!=='playing'||state.paused||state.hitstop||state.throwPending)return {};
  const p=state.players[1],target=state.players[0],distance=Math.abs(target.x-p.x);if(p.hitstun||p.blockstun||p.action)return {};
  const phase=state.frame%180;if(target.action&&distance<2.5&&phase<75)return {guard:true,down:target.action.level==='low'};
  if(distance>1.2){if(distance>3&&phase===0)return {attack:'S'};return {left:target.x<p.x,right:target.x>p.x};}
  if(state.frame%22===0)return {attack:p.meter>=100?'super':['L','M','H','S'][Math.floor(state.frame/22)%4]};return {};
}
