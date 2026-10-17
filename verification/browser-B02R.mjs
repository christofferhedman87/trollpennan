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
async function check(name,fn){try{results.push({name,pass:await fn()});}catch(e){results.push({name,pass:false,error:String(e)});}fs.writeFileSync('verification/browser-B02R.json',JSON.stringify({results,errors},null,2));console.log(name,results.at(-1).pass);}
try{
 const c=await browser.newContext({viewport:{width:375,height:812}});
 await c.addInitScript(()=>localStorage.setItem('trollpennan-v2',JSON.stringify({version:2,introSedd:true})));
 const p=await c.newPage();p.setDefaultTimeout(8000);p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://127.0.0.1:4173',{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>!!window.__troll);
 const opener=p.getByTestId('pennans-bok');await opener.focus();await p.keyboard.press('Enter');
 await check('Enter opens book without creating',async()=>await p.getByTestId('bok-skarm').count()===1 && (await p.evaluate(()=>window.__troll.state())).ang.length===0);
 await check('focus moves inside book',async()=>p.evaluate(()=>!!document.activeElement.closest('[role="dialog"]')));
 await p.evaluate(()=>{const d=document.querySelector('[role="dialog"]');const a=[...d.querySelectorAll('button,summary')].filter(e=>e.getClientRects().length);a.at(-1).focus();});
 await p.keyboard.press('Tab');await check('Tab stays inside book',async()=>p.evaluate(()=>!!document.activeElement.closest('[role="dialog"]')));
 await p.keyboard.press('Escape');await check('Escape closes book',async()=>await p.getByTestId('bok-skarm').count()===0);
 await check('focus returns to opener',async()=>p.evaluate(()=>document.activeElement.dataset.testid==='pennans-bok'));
 await opener.focus();await p.keyboard.press('Space');await check('Space opens book natively',async()=>await p.getByTestId('bok-skarm').count()===1);
 await p.getByText('Prova en idé',{exact:true}).click();const idea=p.getByRole('button',{name:'rosa drake med krona',exact:true});await idea.focus();await p.keyboard.press('Enter');
 await check('Enter selects idea, does not create yet',async()=>{const s=await p.evaluate(()=>window.__troll.state());return s.text==='rosa drake med krona'&&s.ang.length===0;});
 await p.getByTestId('vakna').focus();await p.keyboard.press('Enter');await check('Enter on Vakna creates once',async()=> (await p.evaluate(()=>window.__troll.state())).ang.filter(a=>a.kropp==='drake').length===1);
 await p.screenshot({path:'verification/mobile-B02R.png',animations:'disabled',timeout:5000}).catch(()=>{});
 await c.close();
 const c2=await browser.newContext({viewport:{width:375,height:812}});await c2.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw new DOMException('blocked','SecurityError');}});});const q=await c2.newPage();q.on('pageerror',e=>errors.push(e.message));await q.goto('http://127.0.0.1:4173',{waitUntil:'domcontentloaded'});await q.waitForFunction(()=>!!window.__troll);
 await check('storage warning initially collapsed',async()=>q.evaluate(()=>!document.querySelector('.lagrings-info details').open));
 await q.locator('.lagrings-info summary').click();await check('storage help expands',async()=>q.evaluate(()=>document.querySelector('.lagrings-info details').open));
 await q.locator('.lagrings-info summary').click();await check('collapsed warning under 100px',async()=>q.locator('.lagrings-info').evaluate(e=>e.getBoundingClientRect().height<100));
 await c2.close();console.log(JSON.stringify({results,errors},null,2));
}finally{await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
