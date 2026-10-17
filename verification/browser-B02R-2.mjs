import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve('dist-pages');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.glb':'model/gltf-binary','.png':'image/png','.svg':'image/svg+xml','.mp3':'audio/mpeg','.woff2':'font/woff2','.ttf':'font/ttf'};
const server=http.createServer((req,res)=>{let file=path.join(root,decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!file.startsWith(root)){res.writeHead(403);res.end();return;}if(!fs.existsSync(file)||fs.statSync(file).isDirectory())file=path.join(root,'index.html');res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));});
await new Promise(r=>server.listen(4173,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1208/chrome-linux64/chrome',headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const results=[],errors=[],expectedModelErrors=[],consoleErrors=[];
async function check(name,fn){try{results.push({name,pass:await fn()});}catch(e){results.push({name,pass:false,error:String(e)});}fs.writeFileSync('verification/browser-B02R-2.json',JSON.stringify({results,errors,expectedModelErrors,consoleErrors},null,2));console.log(name,results.at(-1).pass);}
try{
 const c=await browser.newContext({viewport:{width:375,height:812}});await c.addInitScript(()=>localStorage.setItem('trollpennan-v2',JSON.stringify({version:2,introSedd:true})));
 const p=await c.newPage();p.setDefaultTimeout(8000);p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:4173',{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>!!window.__troll);
 await p.getByTestId('meny').click();await p.getByTestId('ut-pa-aventyr').click();await check('adventure menu opens map through UI',async()=>await p.getByTestId('karta').count()===1);
 await check('forest initially reachable; cave gated',async()=>!(await p.getByTestId('plats-skogen').isDisabled())&&await p.getByTestId('plats-grottan').isDisabled());
 await p.getByTestId('plats-sjon').click();await check('lake opens through map UI',async()=>await p.getByTestId('hem-knapp').count()===1&&await p.getByTestId('karta').count()===0);
 await p.waitForTimeout(1200);await p.screenshot({path:'verification/lake-B02R-2.png',animations:'disabled',timeout:5000}).catch(()=>{});
 await p.getByTestId('hem-knapp').click();await check('return from lake through UI',async()=>await p.getByTestId('hem-knapp').count()===0);
 await p.getByTestId('meny').click();await p.getByTestId('ut-pa-aventyr').click();await p.getByTestId('plats-skogen').click();await p.waitForTimeout(300);await check('forest without flying companion gives guidance',async()=>await p.getByTestId('bok-skarm').count()===1 && await p.getByTestId('karta').count()===0);
 await c.close();
 const c2=await browser.newContext({viewport:{width:375,height:812}});
 await c2.addInitScript(()=>{if(!sessionStorage.getItem('test-seeded')) { localStorage.setItem('trollpennan-v2',JSON.stringify({version:2,introSedd:true}));sessionStorage.setItem('test-seeded','yes'); } window.__fallbacks=[];window.addEventListener('trollpennan:model-fallback',e=>window.__fallbacks.push(e.detail));});
 await c2.route('**/models/drake.glb',route=>route.fulfill({status:404,contentType:'text/plain',body:'Model intentionally missing in test'}));
 const q=await c2.newPage();q.setDefaultTimeout(8000);q.on('pageerror',e=>{if(e.message.includes('drake.glb'))expectedModelErrors.push(e.message);else errors.push(e.message);});q.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text());});
 await q.goto('http://127.0.0.1:4173',{waitUntil:'domcontentloaded'});await q.waitForFunction(()=>!!window.__troll);await q.evaluate(()=>window.__troll.vakna('rosa drake med krona'));
 await q.waitForFunction(()=>window.__fallbacks.some(x=>x.kropp==='drake'),null,{timeout:15000});
 await check('missing dragon model triggers real fallback',async()=>q.evaluate(()=>window.__fallbacks.some(x=>x.kropp==='drake')));
 await check('missing model does not replace app with error screen',async()=>!(await q.getByText('Ängen kunde inte öppnas.',{exact:false}).count())&&await q.getByTestId('angen-3d').count()===1);
 await q.evaluate(()=>window.__troll.vakna('blå katt'));await check('can create second animal after model failure',async()=> (await q.evaluate(()=>window.__troll.state())).ang.some(x=>x.kropp==='katt'));
 await q.screenshot({path:'verification/fallback-B02R-2.png',animations:'disabled',timeout:5000}).catch(()=>{});
 await q.reload({waitUntil:'domcontentloaded'});await q.waitForFunction(()=>!!window.__troll);await check('missing-model animal survives reload',async()=> (await q.evaluate(()=>window.__troll.state())).ang.some(x=>x.kropp==='drake'&&x.tillbehor.some(t=>t.id==='krona')));
 await c2.close();console.log(JSON.stringify({results,errors,expectedModelErrors,consoleErrors},null,2));
}finally{await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
