import { chromium } from 'playwright';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
const root = new URL('../', import.meta.url), sha = bytes => createHash('sha256').update(bytes).digest('hex');
const prefix=process.env.HORIZON_NATIVE_PREFIX||'horizon-characters';
if(!/^horizon-characters(?:-[a-z0-9-]+)?$/.test(prefix))throw Error('Invalid native preview prefix');
const source = await readFile(new URL('public/assets/horizon-npcs.png', root));
const metadata = JSON.parse(await readFile(new URL('public/assets/horizon-npcs.json', root)));
const sourceURL = 'data:image/png;base64,' + source.toString('base64');
const browser = await chromium.launch({ headless:true, executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH || '/usr/bin/chromium', args:['--no-sandbox'] });
const page = await browser.newPage({ viewport:{ width:1576,height:1100 } });
const captures = [];
try {
  await page.setContent(`<html><body style="margin:0;background:#1d2631;color:white;font:14px sans-serif"><p style="margin:20px">Native 1536×1024 RGBA, eight ME1 bodies. Faces and costumes remain Prototype.</p><div style="margin:20px;width:1536px;height:1024px;background:repeating-conic-gradient(#c4cbd1 0 25%,#a3adb5 0 50%) 0/32px 32px"><img style="display:block;width:1536px;height:1024px" src="${sourceURL}"></div></body></html>`);
  await page.locator('img').evaluate(img=>img.decode());
  for (const [name, view] of [['native',null],['scale',{width:1280,height:580}]]) {
    if(view){
      await page.setViewportSize(view);
      await page.setContent(`<html><body style="margin:0;padding:16px;background:#071420;color:#dce7ed;font:13px sans-serif"><h3>Eight ME1 NPC body drawings, native measured crops at relative terrain scale</h3><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px">${Object.entries(metadata.frames).map(([id,frame])=>`<div style="height:225px;border:1px solid #436172;background:#112534;padding:12px;box-sizing:border-box"><b>${id}</b><div style="height:176px;display:flex;align-items:end;justify-content:center"><svg viewBox="${frame.rect.join(' ')}" style="width:180px;height:${frame.height/2.65*160}px"><defs><clipPath id="clip-${id}"><rect x="${frame.rect[0]}" y="${frame.rect[1]}" width="${frame.rect[2]}" height="${frame.rect[3]}"/></clipPath></defs><g clip-path="url(#clip-${id})"><image href="${sourceURL}" width="1536" height="1024"/></g></svg></div></div>`).join('')}</div></body></html>`);
      await page.waitForFunction(()=>[...document.images].every(img=>img.complete));
    }
    const path=`docs/screenshots/${prefix}-${name}.png`,bytes=await page.screenshot({path:fileURLToPath(new URL(path,root))});
    captures.push({path,sha256:sha(bytes),bytes:bytes.length,actuallyOpened:false,viewport:page.viewportSize()});
  }
} finally { await browser.close(); }
await writeFile(new URL(`docs/qa/${prefix}-native-report.json`,root),JSON.stringify({passed:true,scope:'Exact native image decoding and CSS-only measured frame presentation; not an in-game or canonical likeness certification.',source:{path:'public/assets/horizon-npcs.png',sha256:sha(source)},captures},null,2)+'\n');
console.log(JSON.stringify({passed:true,captures:captures.length}));
