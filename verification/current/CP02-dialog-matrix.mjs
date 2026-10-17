import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRunStore } from './run-store.mjs';
const run=createRunStore('verification/runs/CP02');
const root=path.resolve('dist-pages');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.glb':'model/gltf-binary','.png':'image/png','.svg':'image/svg+xml','.mp3':'audio/mpeg','.woff2':'font/woff2','.ttf':'font/ttf'};
const server=http.createServer((req,res)=>{let file=path.join(root,decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!file.startsWith(root)){res.writeHead(403);res.end();return;}if(!fs.existsSync(file)||fs.statSync(file).isDirectory())file=path.join(root,'index.html');res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));});
await new Promise(r=>server.listen(4173,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1208/chrome-linux64/chrome',headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});

const results=[],errors=[];
async function check(name,fn){let pass=false,error;try{pass=await fn();}catch(e){error=String(e);}results.push({name,pass,error});run.save('assertion',{name,pass,error});console.log(name,pass);}
try{
 for(const viewport of [{width:320,height:640},{width:375,height:812},{width:812,height:375}]){
  const label=`${viewport.width}x${viewport.height}`;
  const c=await browser.newContext({viewport,hasTouch:true,isMobile:true});
  await c.addInitScript(()=>localStorage.setItem('trollpennan-v2',JSON.stringify({version:2,introSedd:true})));
  const p=await c.newPage();p.setDefaultTimeout(12000);p.on('pageerror',e=>{errors.push(e.message);run.save('pageerror',{message:e.message});});
  await p.goto('http://127.0.0.1:4173',{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>!!window.__troll);await p.waitForTimeout(700);
  await p.getByTestId('pennans-bok').tap();await p.getByTestId('bok-skarm').waitFor();await p.evaluate(()=>window.__troll.foralder(true));await p.getByTestId('foralder').waitFor();
  await p.getByTestId('borja-om').tap();await p.getByTestId('borja-fraga').waitFor();await p.waitForTimeout(150);
  await check(label+' reset focus',()=>p.evaluate(()=>!!document.activeElement.closest('[data-testid="borja-fraga"]')));
  await check(label+' reset underlying inert',()=>p.getByTestId('borja-om').evaluate(e=>!!e.closest('[inert]')));
  await check(label+' reset controls reachable',()=>p.getByTestId('borja-fraga').locator('button').evaluateAll(es=>es.every(e=>{const r=e.getBoundingClientRect();const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return r.width>0&&r.height>0&&r.x>=0&&r.right<=innerWidth&&r.y>=0&&r.bottom<=innerHeight&&!!hit&&e.contains(hit);}))); 
  await p.getByTestId('borja-nej').focus();await p.keyboard.press('Tab');await check(label+' reset Tab trap',()=>p.evaluate(()=>!!document.activeElement.closest('[data-testid="borja-fraga"]')));
  await p.getByTestId('borja-ja').focus();await p.keyboard.press('Shift+Tab');await check(label+' reset ShiftTab trap',()=>p.evaluate(()=>!!document.activeElement.closest('[data-testid="borja-fraga"]')));
  await p.keyboard.press('Escape');await p.waitForTimeout(150);await check(label+' reset Escape layer',async()=>await p.getByTestId('borja-fraga').count()===0&&await p.getByTestId('foralder').count()===1&&await p.getByTestId('bok-skarm').count()===1);
  await check(label+' reset focus return',()=>p.evaluate(()=>document.activeElement.dataset.testid==='borja-om'));
  await p.getByTestId('borja-om').tap();await p.getByTestId('borja-nej').tap();await check(label+' reset touch cancel',async()=>await p.getByTestId('borja-fraga').count()===0);
  await check(label+' no horizontal overflow',()=>p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  const dl=p.waitForEvent('download');await p.getByTestId('spara-kopia').tap();const d=await dl;const buf=fs.readFileSync(await d.path());
  await p.getByTestId('kopia-fil').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:buf});await p.getByTestId('backup-fraga').waitFor();await p.waitForTimeout(100);
  await check(label+' import focus',()=>p.evaluate(()=>!!document.activeElement.closest('[data-testid="backup-fraga"]')));
  await check(label+' import underlying inert',()=>p.getByTestId('spara-kopia').evaluate(e=>!!e.closest('[inert]')));
  await p.getByTestId('backup-fraga').locator('[data-dialog-close]').focus();await p.keyboard.press('Tab');await check(label+' import Tab trap',()=>p.evaluate(()=>!!document.activeElement.closest('[data-testid="backup-fraga"]')));
  await p.getByTestId('backup-ja').focus();await p.keyboard.press('Shift+Tab');await check(label+' import ShiftTab trap',()=>p.evaluate(()=>!!document.activeElement.closest('[data-testid="backup-fraga"]')));
  await p.keyboard.press('Escape');await p.waitForTimeout(150);await check(label+' import Escape layer',async()=>await p.getByTestId('backup-fraga').count()===0&&await p.getByTestId('foralder').count()===1&&await p.getByTestId('bok-skarm').count()===1);
  await p.getByTestId('kopia-fil').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:buf});await p.getByTestId('backup-fraga').locator('[data-dialog-close]').tap();await check(label+' import touch cancel',async()=>await p.getByTestId('backup-fraga').count()===0);
  await p.keyboard.press('Escape');await p.waitForTimeout(150);await p.evaluate(()=>{window.__troll.stjarnor(100);window.__troll.ordbok(true);});await p.getByTestId('ordbok-sida').waitFor();
  const buy=p.getByTestId('ordbok-sida').locator('article button').first();await buy.focus();await p.keyboard.press('Enter');await p.getByTestId('kop-fraga').waitFor();await p.waitForTimeout(100);
  await check(label+' purchase focus',()=>p.evaluate(()=>!!document.activeElement.closest('[data-testid="kop-fraga"]')));
  await check(label+' purchase underlying inert',()=>buy.evaluate(e=>!!e.closest('[inert]')));
  await p.getByTestId('kop-fraga').locator('[data-dialog-close]').focus();await p.keyboard.press('Tab');await check(label+' purchase Tab trap',()=>p.evaluate(()=>!!document.activeElement.closest('[data-testid="kop-fraga"]')));
  await p.getByTestId('kop-ja').focus();await p.keyboard.press('Shift+Tab');await check(label+' purchase ShiftTab trap',()=>p.evaluate(()=>!!document.activeElement.closest('[data-testid="kop-fraga"]')));
  await p.keyboard.press('Escape');await p.waitForTimeout(150);await check(label+' purchase Escape layer',async()=>await p.getByTestId('kop-fraga').count()===0&&await p.getByTestId('ordbok-sida').count()===1&&await p.getByTestId('bok-skarm').count()===1);
  await check(label+' purchase focus return',()=>buy.evaluate(e=>e===document.activeElement));
  await buy.tap();await p.getByTestId('kop-fraga').locator('[data-dialog-close]').tap();await check(label+' purchase touch cancel',async()=>await p.getByTestId('kop-fraga').count()===0);
  await p.screenshot({path:path.join(run.dir,`CP02-dialog-${label}.png`),animations:'disabled'});await c.close();
 }
}finally{await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));run.save('final',{results,errors});}
if(!results.length||results.some(x=>x.pass!==true)||errors.length)process.exitCode=1;
