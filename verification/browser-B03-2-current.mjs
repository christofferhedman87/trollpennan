import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve('dist-pages');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.glb':'model/gltf-binary','.png':'image/png','.svg':'image/svg+xml','.mp3':'audio/mpeg','.woff2':'font/woff2','.ttf':'font/ttf'};
const server=http.createServer((req,res)=>{let file=path.join(root,decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!file.startsWith(root)){res.writeHead(403);res.end();return;}if(!fs.existsSync(file)||fs.statSync(file).isDirectory())file=path.join(root,'index.html');res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));});
await new Promise(r=>server.listen(4173,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1208/chrome-linux64/chrome',headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const results=[],errors=[],textureWarnings=[];let shadowRequests=0;
async function check(name,fn){try{results.push({name,pass:await fn()});}catch(e){results.push({name,pass:false,error:String(e)});}fs.writeFileSync('verification/browser-B03-2-current.json',JSON.stringify({results,errors,textureWarnings,shadowRequests},null,2));console.log(name,results.at(-1).pass);}
try{
 const c=await browser.newContext({viewport:{width:375,height:812}});await c.addInitScript(()=>{if(!sessionStorage.getItem('seed')){localStorage.setItem('trollpennan-v2',JSON.stringify({version:2,introSedd:true}));sessionStorage.setItem('seed','1');}});
 const p=await c.newPage();p.setDefaultTimeout(10000);p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.text().includes('Texture key already in use'))textureWarnings.push(m.text());});p.on('request',r=>{if(r.url().includes('tom_skugga.png'))shadowRequests++;});
 await p.goto('http://127.0.0.1:4173',{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>!!window.__troll);
 await p.evaluate(()=>window.__troll.vakna('blå fågel'));await p.waitForTimeout(3000);await p.getByTestId('meny').click();await p.getByTestId('ut-pa-aventyr').click();await p.getByTestId('plats-skogen').click();
 await check('forest asks for flying companion',async()=>await p.getByTestId('valj-djur').count()===1);
 await check('companion dialog receives focus',async()=>p.evaluate(()=>document.activeElement.closest('[data-testid="valj-djur"]')!==null));
 await p.locator('[data-testid="valj-djur"] button[data-testid^="valj-"]').first().click();
 await check('companion selection enters forest',async()=>await p.getByTestId('hem-knapp').count()===1&&await p.getByTestId('valj-djur').count()===0);
 await p.waitForTimeout(700);await p.getByTestId('hem-knapp').click();
 await p.getByTestId('meny').click();await p.getByTestId('ut-pa-aventyr').click();
 await check('forest unlock enables cave route',async()=>!(await p.getByTestId('plats-grottan').isDisabled()));
 await p.getByTestId('plats-garden').click();
 for(let i=0;i<4;i++){await p.getByTestId('meny').click();await p.getByTestId('ut-pa-aventyr').click();await p.getByTestId('plats-sjon').click();await p.waitForTimeout(250);await p.getByTestId('hem-knapp').click();}
 await check('repeated lake/garden transitions remain usable',async()=>await p.getByTestId('meny').isVisible());
 await check('no duplicate texture warnings across transitions',async()=>textureWarnings.length===0);
 await p.reload({waitUntil:'domcontentloaded'});await p.waitForFunction(()=>!!window.__troll);await p.getByTestId('meny').click();await p.getByTestId('ut-pa-aventyr').click();
 await check('forest progression persists after reload',async()=>!(await p.getByTestId('plats-grottan').isDisabled()));
 await check('no uncaught page errors',async()=>errors.length===0);
 console.log(JSON.stringify({results,errors,textureWarnings,shadowRequests},null,2));await c.close();
}finally{await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
