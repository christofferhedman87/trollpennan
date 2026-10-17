import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve('dist-pages');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.glb':'model/gltf-binary','.png':'image/png','.svg':'image/svg+xml','.mp3':'audio/mpeg','.woff2':'font/woff2','.ttf':'font/ttf'};
const server=http.createServer((req,res)=>{let file=path.join(root,decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!file.startsWith(root)){res.writeHead(403);res.end();return;}if(!fs.existsSync(file)||fs.statSync(file).isDirectory())file=path.join(root,'index.html');res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));});
await new Promise(r=>server.listen(4173,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1208/chrome-linux64/chrome',headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const results=[],errors=[];
async function check(name, fn){try{const pass=await fn();results.push({name,pass});}catch(e){results.push({name,pass:false,error:String(e)});}fs.writeFileSync('verification/browser-extended-B01R.json',JSON.stringify({results,errors},null,2));console.log(name,results.at(-1).pass);}
async function open(init){const c=await browser.newContext({viewport:{width:375,height:812},reducedMotion:'reduce'});if(init)await c.addInitScript(init);const p=await c.newPage();p.setDefaultTimeout(7000);p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:4173',{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>!!window.__troll);return {c,p};}
try{
 let {c,p}=await open(()=>localStorage.setItem('trollpennan-v1',JSON.stringify({version:1,stjarnor:12,introSedd:true})));
 await check('incomplete v1 save migrates',async()=> (await p.evaluate(()=>window.__troll.state())).stjarnor===12);
 await p.evaluate(()=>window.__troll.vakna('rosa drake med krona'));await p.waitForTimeout(300);const save=await p.evaluate(()=>localStorage.getItem('trollpennan-v2'));
 await p.evaluate(()=>window.__troll.aterstall());await p.evaluate(()=>window.__troll.foralder(true));
 await p.getByTestId('kopia-fil').setInputFiles({name:'save.json',mimeType:'application/json',buffer:Buffer.from(save)});await p.getByTestId('backup-ja').click();
 await check('valid save import through file UI',async()=> (await p.evaluate(()=>window.__troll.state())).ang.some(a=>a.kropp==='drake'));
 await p.getByTestId('kopia-fil').setInputFiles({name:'broken.json',mimeType:'application/json',buffer:Buffer.from('{bad')});
 await check('corrupt import preserves current scene',async()=> (await p.evaluate(()=>window.__troll.state())).ang.some(a=>a.kropp==='drake'));
 await p.evaluate(()=>window.__troll.foralder(false));await p.evaluate(()=>window.__troll.skriv('BLÅ HÄST'));await p.evaluate(()=>document.activeElement.blur());await p.keyboard.press('Enter');
 await check('keyboard Enter creates Swedish horse',async()=> (await p.evaluate(()=>window.__troll.state())).ang.some(a=>a.kropp==='häst'));
 await p.setViewportSize({width:320,height:640});
 await check('320px no horizontal document overflow',async()=>p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await check('reduced motion preference active',async()=>p.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches));
 await c.close();
 ({c,p}=await open(()=>{Object.defineProperty(window,'localStorage',{get(){throw new DOMException('blocked','SecurityError')}});}));
 await p.evaluate(()=>window.__troll.vakna('rosa drake'));await check('blocked storage allows creation',async()=> (await p.evaluate(()=>window.__troll.state())).ang.some(a=>a.kropp==='drake'));await check('blocked storage shows warning',async()=>await p.locator('.lagrings-info').count()===1);await c.close();
 ({c,p}=await open(()=>{Storage.prototype.setItem=function(){throw new DOMException('full','QuotaExceededError');};}));
 await p.evaluate(()=>window.__troll.vakna('rosa drake'));await check('full storage allows creation',async()=> (await p.evaluate(()=>window.__troll.state())).ang.some(a=>a.kropp==='drake'));await check('full storage shows warning',async()=>await p.locator('.lagrings-info').count()===1);await c.close();
 console.log(JSON.stringify({results,errors},null,2));
}finally{await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
