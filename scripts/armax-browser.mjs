import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir,writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const entry=new URL(process.env.GAME_URL||'http://127.0.0.1:4187/');
const out=resolve(process.env.ARMAX_QA_DIR||'docs/armax/lot22/qa');await mkdir(out,{recursive:true});
const report={at:new Date().toISOString(),entry:entry.href,scope:'Local Chromium, actual DOM controls and Three.js. No hardware/Windows/network/full-animation/fidelity certification.',checks:[],errors:[],screenshots:[],passed:false};
let browser,server,page;
const check=name=>{report.checks.push(name);console.log(`PASS ${name}`);};
const screenshot=async name=>{const path=`${out}/${name}.png`;await page.screenshot({path,fullPage:false});report.screenshots.push(path);};
const button=name=>page.locator(`[data-armax="${name}"]`).first();
const storage=()=>page.evaluate(()=>JSON.stringify(Object.entries(localStorage).sort()));
const ready=async()=>{await page.waitForSelector('.armax-arena canvas');await page.waitForSelector('.armax-loading[hidden]');if(await button('resume').isVisible())await button('resume').click();};
try{
  if(process.env.ARMAX_SELF_HOST==='1'){
    const {createServer}=await import('vite');server=await createServer({server:{host:'127.0.0.1',port:Number(entry.port)||4187,strictPort:true}});await server.listen();
  }
  browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||'/usr/bin/chromium',args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});report.browser=browser.version();
  const context=await browser.newContext({viewport:{width:1440,height:1000}});page=await context.newPage();page.setDefaultTimeout(30000);page.on('pageerror',error=>report.errors.push(error.message));
  await page.goto(entry.href);await page.locator('[data-do="armax"]').waitFor();const before=await storage();
  await page.locator('[data-do="armax"]').click();await page.locator('.armax-lobby').waitFor();assert.equal(await page.locator('[name="player"] option').count(),10);assert.equal(await page.locator('[name="stage"] option').count(),20);
  await screenshot('armax-selection-desktop');check('Title opens the Nacre selector with ten fighters and twenty stages');
  await page.selectOption('[name="mode"]','training');await page.locator('.armax-launch').click();await ready();assert.equal(await page.locator('[data-armax-attack="super"]').isDisabled(),true);
  await page.keyboard.down('ArrowRight');await page.waitForTimeout(1550);await page.keyboard.up('ArrowRight');await page.keyboard.press('j');await page.waitForTimeout(380);
  assert.ok(Number((await page.locator('[data-shield-value="1"]').textContent()).match(/\d+/)[0])<280);assert.match(await page.locator('[data-meter-value="0"]').textContent(),/^8 \/ 300$/);
  await screenshot('armax-duel-desktop');check('Actual movement and attack reduce opponent protection and grant the correct meter');
  await page.keyboard.press('Escape');await button('resume').waitFor();const hud=await page.locator('.armax-hud').textContent();await page.waitForTimeout(700);assert.equal(await page.locator('.armax-hud').textContent(),hud);await button('resume').click();
  await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await button('resume').waitFor();assert.match(await page.locator('.armax-match-overlay').textContent(),/Pause/);await button('resume').click();check('Pause and a simulated blur event freeze simulation until explicit resume');
  await button('selection').click();await page.selectOption('[name="mode"]','cpu');await page.locator('.armax-launch').click();await ready();await page.waitForTimeout(6500);
  const hp=Number((await page.locator('[data-hp="0"]').textContent()).match(/\d+/)[0]),shield=Number((await page.locator('[data-shield-value="0"]').textContent()).match(/\d+/)[0]);assert.ok(hp<1000||shield<220);check('CPU approaches and inflicts actual damage');
  await button('selection').click();await page.setViewportSize({width:390,height:844});await screenshot('armax-selection-mobile');assert.equal(await page.locator('.armax-screen').evaluate(el=>el.scrollWidth<=el.clientWidth+1),true);
  await page.selectOption('[name="mode"]','training');await page.selectOption('[name="stage"]','nacre_stage_02');await page.locator('.armax-launch').click();await ready();
  await page.locator('[data-armax-hold="right"]').dispatchEvent('pointerdown',{pointerId:1});await page.waitForTimeout(1550);await page.locator('[data-armax-hold="right"]').dispatchEvent('pointerup',{pointerId:1});await page.locator('[data-armax-attack="M"]').click();await page.waitForTimeout(450);
  assert.ok(Number((await page.locator('[data-shield-value="1"]').textContent()).match(/\d+/)[0])<280);assert.equal(await page.locator('.armax-screen').evaluate(el=>el.scrollWidth<=el.clientWidth+1),true);await screenshot('armax-duel-mobile');check('Second stage and on-screen pointer controls work at 390×844 without horizontal overflow');
  await button('exit').click();await page.locator('.title-screen').waitFor();assert.equal(await storage(),before);check('Exit restores the title and preserves every local storage value exactly');assert.equal(report.errors.length,0,report.errors.join('\n'));report.passed=true;
}catch(error){report.failure={name:error.name,message:error.message};throw error;}finally{await writeFile(`${out}/armax-browser-report.json`,`${JSON.stringify(report,null,2)}\n`);await browser?.close();await server?.close();}
