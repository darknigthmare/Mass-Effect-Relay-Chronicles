import { chromium } from '/workspace/Mass-Effect-Relay-Chronicles/node_modules/playwright/index.mjs';
import { mkdtemp, mkdir } from 'node:fs/promises';
const profile = await mkdtemp('/tmp/companion-download-repro-');
const downloads = await mkdtemp('/tmp/companion-download-persistent-target-');
const cache = await mkdtemp('/tmp/companion-browser-cache-'), config = await mkdtemp('/tmp/companion-browser-config-');
const html = `<button id="save">Export</button><script>document.querySelector('#save').onclick=()=>{const blob=new Blob(['{"value":1}'],{type:'application/json'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='test.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}</script>`;
for(let n=1;n<=2;n++){
 let context;
 try{
  context=await chromium.launchPersistentContext(profile,{headless:true,acceptDownloads:true,downloadsPath:downloads,env:{...process.env,XDG_CACHE_HOME:cache,XDG_CONFIG_HOME:config},executablePath:'/usr/bin/chromium',args:['--no-sandbox','--no-zygote','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const page=context.pages()[0]||await context.newPage();
  context.browser().on('disconnected',()=>console.log('DISCONNECTED',n));
  page.on('crash',()=>console.log('PAGE_CRASH',n));page.on('close',()=>console.log('PAGE_CLOSE',n));
  await page.setContent(html);console.log('LAUNCH',n,'pages',context.pages().length);
  const event=page.waitForEvent('download');await page.click('#save');const download=await event;
  await download.saveAs(`/tmp/companion-download-repro-${n}.json`);console.log('DOWNLOADED',n);
  await context.close();context=null;console.log('CLOSED',n);
 }catch(e){console.log('FAIL',n,e.stack);if(context)await context.close().catch(()=>{});process.exitCode=1;break;}
}
