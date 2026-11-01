import {chromium} from '/workspace/Mass-Effect-Relay-Chronicles/node_modules/playwright/index.mjs';
import{readFile,writeFile}from'node:fs/promises';
const root='/workspace/Mass-Effect-Relay-Chronicles';
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium',args:['--no-sandbox','--no-zygote','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1440,height:1000}});page.setDefaultTimeout(45000);
const report={passed:false,scope:'Read-only public DOM ATB/focus diagnostic after import of the previously exported valid pre-combat fixture. No battle state, time, resources or poses are forced.',samples:[],errors:[]};
page.on('pageerror',e=>report.errors.push(e.message));
try{
 await page.goto('http://127.0.0.1:4194/?qa',{waitUntil:'networkidle'});
 const [chooser]=await Promise.all([page.waitForEvent('filechooser'),page.locator('[data-do=import]').click()]);
 await chooser.setFiles(root+'/docs/qa/companion-combat-production-garrus-wrex-precombat-save.json');
 await page.locator('#hud .explore-party').waitFor();await page.locator('#transition.active').waitFor({state:'hidden'});
 await page.locator('#hud .interaction[data-do=interact]').click();await page.locator('#battle-ui .battle-shell').waitFor();
 const begun=Date.now();
 const sample=async()=>{const s=await page.evaluate(()=>({visibility:document.visibilityState,focus:document.hasFocus(),activeElement:document.activeElement?.outerHTML.slice(0,250),menu:document.querySelector('#overlay')?.textContent.trim().slice(0,200),badge:document.querySelector('.combat-badge')?.textContent,actor:document.querySelector('.battle-status h3')?.textContent,gauges:[...document.querySelectorAll('.battle-member')].map(n=>({id:n.dataset.id,ready:n.classList.contains('ready'),atb:n.querySelector('[data-stat=atb]')?.style.width,hp:n.querySelector('[data-stat=hp-label]')?.textContent})),enabledActions:[...document.querySelectorAll('[data-do=battle-action]:not(:disabled)')].map(n=>n.dataset.id)}));s.wallSeconds=(Date.now()-begun)/1000;report.samples.push(s);console.log(JSON.stringify(s));};
 await sample();for(let n=0;n<3;n++){await page.waitForTimeout(5000);await sample();}
 await page.waitForFunction(()=>!!document.querySelector('.battle-member.ready'),null,{timeout:45000});await sample();report.passed=true;
}catch(e){report.failure=e.stack;console.log(report.failure);}finally{await browser.close();await writeFile(root+'/docs/qa/companion-combat-production-atb-diagnostic.json',JSON.stringify(report,null,2)+'\n');}
