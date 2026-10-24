// P3a-fix-2 genomspelning (Doodles granskning 21 okt, punkt 1–5 = ang, sjon, skogen, grottan, smasaker). Kör: node rundor/P3a-fix-2/genomspelning.mjs --dist dist-pages --ut genomspelning [--bara ang,skogen]
// Doodles granskning: 375x812, pekskärm, webdriver=false, skärmtangentbordet, ingen __troll, riktig uppspelning.
import fs from "node:fs"; import path from "node:path"; import http from "node:http";
import { createRequire } from "node:module";
const require = createRequire(path.resolve("package.json"));
const { chromium } = require("playwright");
const arg=(n,d)=>{const i=process.argv.indexOf(`--${n}`);return i>=0?process.argv[i+1]:d;};
const UT = path.resolve(arg("ut","genomspelning")); const ROOT = path.resolve(arg("dist","dist-pages")); fs.mkdirSync(UT,{recursive:true});
const mime={".html":"text/html",".js":"text/javascript",".css":"text/css",".json":"application/json",".glb":"model/gltf-binary",".png":"image/png",".webp":"image/webp",".svg":"image/svg+xml",".mp3":"audio/mpeg",".ttf":"font/ttf",".jpg":"image/jpeg",".woff2":"font/woff2",".wasm":"application/wasm"};
const sv=http.createServer((q,r)=>{let f=path.join(ROOT,decodeURIComponent(new URL(q.url,"http://x").pathname));if(!f.startsWith(ROOT)){r.writeHead(403);r.end();return}
 if(!fs.existsSync(f)||fs.statSync(f).isDirectory())f=path.join(ROOT,"index.html");r.setHeader("Content-Type",mime[path.extname(f)]??"application/octet-stream");r.end(fs.readFileSync(f));});
await new Promise(ok=>sv.listen(0,"127.0.0.1",ok)); const URL0=`http://127.0.0.1:${sv.address().port}/`;
const br = await chromium.launch({ headless: true, args: ["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--disable-blink-features=AutomationControlled","--autoplay-policy=no-user-gesture-required"] });
const PL=["skogen","sjon","grottan"]; const res={}; const sidfel=[];
async function sida(extra){
  const ctx=await br.newContext({viewport:{width:375,height:812},deviceScaleFactor:1,isMobile:true,hasTouch:true,locale:"sv-SE"});
  await ctx.addInitScript(()=>{Object.defineProperty(navigator,"webdriver",{get:()=>false}); window.__tredSyn={}; window.__bann=[]; window.__ljud=[];
    const play0=HTMLMediaElement.prototype.play; HTMLMediaElement.prototype.play=function(){window.__ljud.push(new URL(this.src,location.href).pathname);return play0.call(this)};
    const sett=new Set(); setInterval(()=>{for(const e of document.querySelectorAll("[data-testid=puff],.banner,[role=status]")){const t=(e.textContent||"").trim(); if(t&&!sett.has(t)){sett.add(t);window.__bann.push(t)}}},100);
    window.__rafN=0; const f=()=>{window.__rafN++;requestAnimationFrame(f)}; requestAnimationFrame(f);});
  await ctx.addInitScript((s)=>{ if(!sessionStorage.getItem("f")){localStorage.setItem("trollpennan-v2",JSON.stringify(s));sessionStorage.setItem("f","1");} },
    {version:2,introSedd:true,dragit:true,ang:[],garden:[],stjarnor:12,oppnadePlatser:PL,seddaIntro:[...PL,"garden","gard"],platsSkapelser:{},...extra});
  const p=await ctx.newPage(); p.on("pageerror",e=>sidfel.push(String(e.message).slice(0,200))); p.setDefaultTimeout(20000);
  await p.goto(URL0,{waitUntil:"domcontentloaded"}); await p.waitForTimeout(7000);
  const fo=p.locator("[data-testid=titel-fortsatt],[data-testid=titel-borja]").first(); if(await fo.isVisible().catch(()=>false)){await fo.tap();await p.waitForTimeout(3000);}
  return {ctx,p};
}
const tap=async(l,v=150)=>{await l.waitFor({state:"visible",timeout:15000}); await l.tap({timeout:5000}).catch(()=>l.tap({force:true})); await p_wait(v)}; let P; const p_wait=(ms)=>P.waitForTimeout(ms);
async function skriv(fras){
  if(!await P.locator("[data-testid=tangentbord]").isVisible().catch(()=>false)) await tap(P.locator("[data-testid=pennans-bok]"),1200);
  for(const c of fras){ if(c===" ") await tap(P.locator("[data-testid=mellanslag]"),80); else await tap(P.locator("[data-testid=tangentbord] button.tangent",{hasText:new RegExp("^"+c+"$","i")}).first(),80); }
  await tap(P.locator("[data-testid=vakna]"),5500);
  if(await P.locator("[data-testid=stang-bok]").isVisible().catch(()=>false)) await tap(P.locator("[data-testid=stang-bok]"),2500);
}
function tackt(b,fram){ if(b.w<=0||b.h<=0) return 0; let n=0,t=0; for(let y=b.y+1;y<b.y+b.h;y+=3)for(let x=b.x+1;x<b.x+b.w;x+=3){n++; if(x<0||x>375||y<0||y>812||fram.some(r=>x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h))t++;} return n?t/n:0; }
async function matt(plats){
  return P.evaluate((plats)=>{const st=JSON.parse(localStorage.getItem("trollpennan-v2")??"{}"); const lista=plats==="ang"?(st.ang??[]):(st.platsSkapelser?.[plats]??[]);
    return {lista:lista.map(d=>({uid:d.uid,kropp:d.kropp,skapad:d.skapad})),sovande:(st.sovande??[]).map(d=>d.kropp),syn:window.__tredSyn,pos:window.__tredPos??{},bann:window.__bann,ljud:window.__ljud.slice(-6),troll:typeof window.__troll,wd:navigator.webdriver,
      dom:[...document.querySelectorAll("[data-testid=npc-figur],[data-testid=till-angen],[data-testid=meny],[data-testid=pennans-bok],[data-testid=guide],[data-testid=grind]")].map(e=>{const r=e.getBoundingClientRect();return {t:e.dataset.testid,x:r.x,y:r.y,w:r.width,h:r.height}})}},plats);
}
async function fps(){ const a=await P.evaluate(()=>window.__rafN); await P.waitForTimeout(5000); const b=await P.evaluate(()=>window.__rafN); return Math.round((b-a)/5*10)/10; }
function analys(m){
  const saker=m.lista.filter(d=>m.syn[d.uid]&&m.pos[d.uid]&&!m.pos[d.uid].stall).map(d=>({k:d.kropp,z:m.pos[d.uid].z,y:m.pos[d.uid].y,sim:m.pos[d.uid].sim,flyg:m.pos[d.uid].flyg,r:m.syn[d.uid],skapad:d.skapad}));
  return saker.map(a=>({k:a.k,z:a.z,y:a.y,sim:!!a.sim,flyg:!!a.flyg,px:[Math.round(a.r.w),Math.round(a.r.h)],skymd:Math.round(tackt(a.r,saker.filter(b=>b!==a&&b.z>a.z+0.05).map(b=>b.r))*100)}));
}
const KOR={
 ang:["en katt","en häst","en elefant","ett slott","ett sjukhus","en ko","en kanin","ett växthus","en giraff","en hund"],
 sjon:["en anka","en säl","en bläckfisk","en narval","en katt","en hund","en häst","en ko","en giraff"],
 skogen:["en kanin","en katt","en hund","en häst","en elefant","en giraff","en ko","en anka","ett slott","en puck","en kaffekopp"],
 grottan:["en katt","en elefant","en hund","en kanin","en giraff","en häst","en ko","en säl"],
 smasaker:["en kaffekopp","en puck","en katt"],
};
const vilka=arg("bara","")?arg("bara").split(","):Object.keys(KOR);
for(const plats of vilka){
  const pl=plats==="smasaker"?"ang":plats;
  const {ctx,p}=await sida(pl==="ang"?{}:{plats:pl}); P=p;
  await p.screenshot({path:`${UT}/${plats}-00-tom.png`});
  res[plats]={steg:[]};
  let i=0;
  for(const fras of KOR[plats]){ i++; try{ await skriv(fras);}catch(e){res[plats].steg.push({fras,fel:String(e).slice(0,200)}); continue;}
    const m=await matt(pl); res[plats].steg.push({fras,antal:m.lista.length,sovande:m.sovande,nyBann:m.bann.slice(-2)});
    if(i===4||i===8||i===KOR[plats].length) await p.screenshot({path:`${UT}/${plats}-${String(i).padStart(2,"0")}.png`});
    if(i===8) res[plats].fps8=await fps();
  }
  await p.waitForTimeout(4000);
  const m=await matt(pl); res[plats].slut={sovande:m.sovande,lista:m.lista.map(d=>d.kropp),analys:analys(m),dom:m.dom,bann:m.bann,ljud:m.ljud,troll:m.troll,wd:m.wd,pos:m.pos,syn:m.syn,uid:m.lista};
  // still men levande: två positioner 3 s isär
  const a=await p.evaluate(()=>JSON.parse(JSON.stringify(window.__tredSyn))); await p.waitForTimeout(3000); const b=await p.evaluate(()=>JSON.parse(JSON.stringify(window.__tredSyn)));
  res[plats].rorelse=Object.keys(a).map(k=>b[k]?Math.round(Math.hypot(a[k].x-b[k].x,a[k].y-b[k].y)):null);
  if(!res[plats].fps8) res[plats].fps8=await fps();
  await p.screenshot({path:`${UT}/${plats}-slut.png`});
  if(pl==="ang"){ await p.reload({waitUntil:"domcontentloaded"}); await p.waitForTimeout(9000); await p.screenshot({path:`${UT}/${plats}-titel.png`}); res[plats].titel=await p.evaluate(()=>{const c=document.querySelector("canvas.titel-bild");return c?{utsnitt:c.dataset.utsnitt??null}:null}); }
  await ctx.close();
  fs.writeFileSync(`${UT}/spela-${plats}.json`,JSON.stringify(res[plats],null,1));
  console.log(plats,"klar",JSON.stringify({fps:res[plats].fps8,sov:res[plats].slut.sovande,n:res[plats].slut.lista.length}));
}
console.log("sidfel",JSON.stringify(sidfel)); await br.close(); sv.close();
