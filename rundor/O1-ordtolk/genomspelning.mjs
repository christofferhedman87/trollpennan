// O1 snabb genomspelning (Arkitekten 2026-10-24). Testskript, ingen spelkod. Bygger på rundor/P3a-fix-2/genomspelning.mjs (Doodles sätt: 375x812, pekskärm, skärmtangentbordet, ingen __troll).
// Kör: npm run build:pages && node rundor/O1-ordtolk/genomspelning.mjs --dist dist-pages --runda O1a --ut genomspelning-o1a
//      (O1b: --runda O1b --ut genomspelning-o1b). Slutkod 0 = alla fraser som provfraser-o1.json säger, 1 = minst ett fel.
// Mäter det barnet ser: senaste skapelsen i sparningen (kropp, tillbehor, monster, formagor) och antal ägg = reserv.length (ReservAgg i src/spel/ordagg.tsx ritar en äggfigur per post), plus bannertexterna och en skärmbild per fras.
import fs from "node:fs"; import path from "node:path"; import http from "node:http";
import { createRequire } from "node:module";
const require = createRequire(path.resolve("package.json"));
const { chromium } = require("playwright");
const arg=(n,d)=>{const i=process.argv.indexOf(`--${n}`);return i>=0?process.argv[i+1]:d;};
const RUNDA=arg("runda","O1a"); const UT=path.resolve(arg("ut",`genomspelning-${RUNDA.toLowerCase()}`)); const ROOT=path.resolve(arg("dist","dist-pages")); fs.mkdirSync(UT,{recursive:true});
const PROV=JSON.parse(fs.readFileSync(new URL("./provfraser-o1.json",import.meta.url),"utf8"));
const FRASER={O1a:["kapybara","en capybara","spara","enkatt"],O1b:["noshörning blandat med enhörning","hälften katt hälften fisk","en hund blandad med en zebra"]}[RUNDA];
if(!FRASER) throw new Error("--runda O1a eller O1b");
const mime={".html":"text/html",".js":"text/javascript",".css":"text/css",".json":"application/json",".glb":"model/gltf-binary",".png":"image/png",".webp":"image/webp",".svg":"image/svg+xml",".mp3":"audio/mpeg",".ttf":"font/ttf",".jpg":"image/jpeg",".woff2":"font/woff2",".wasm":"application/wasm"};
const sv=http.createServer((q,r)=>{let f=path.join(ROOT,decodeURIComponent(new URL(q.url,"http://x").pathname));if(!f.startsWith(ROOT)){r.writeHead(403);r.end();return}
 if(!fs.existsSync(f)||fs.statSync(f).isDirectory())f=path.join(ROOT,"index.html");r.setHeader("Content-Type",mime[path.extname(f)]??"application/octet-stream");r.end(fs.readFileSync(f));});
await new Promise(ok=>sv.listen(0,"127.0.0.1",ok)); const URL0=`http://127.0.0.1:${sv.address().port}/`;
const br=await chromium.launch({headless:true,args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--disable-blink-features=AutomationControlled","--autoplay-policy=no-user-gesture-required"]});
const ctx=await br.newContext({viewport:{width:375,height:812},deviceScaleFactor:1,isMobile:true,hasTouch:true,locale:"sv-SE"});
await ctx.addInitScript(()=>{Object.defineProperty(navigator,"webdriver",{get:()=>false}); window.__bann=[];
  const sett=new Set(); setInterval(()=>{for(const e of document.querySelectorAll("[data-testid=puff],.banner,[role=status]")){const t=(e.textContent||"").trim(); if(t&&!sett.has(t)){sett.add(t);window.__bann.push(t)}}},100);});
await ctx.addInitScript((s)=>{ if(!sessionStorage.getItem("f")){localStorage.setItem("trollpennan-v2",JSON.stringify(s));sessionStorage.setItem("f","1");} },{version:2,introSedd:true,dragit:true,ang:[],garden:[],stjarnor:12,oppnadePlatser:[],seddaIntro:[],platsSkapelser:{}});
const P=await ctx.newPage(); const sidfel=[]; P.on("pageerror",e=>sidfel.push(String(e.message).slice(0,200))); P.setDefaultTimeout(20000);
await P.goto(URL0,{waitUntil:"domcontentloaded"}); await P.waitForTimeout(7000);
const fo=P.locator("[data-testid=titel-fortsatt],[data-testid=titel-borja]").first(); if(await fo.isVisible().catch(()=>false)){await fo.tap();await P.waitForTimeout(3000);}
const tap=async(l,v=150)=>{await l.waitFor({state:"visible",timeout:15000}); await l.tap({timeout:5000}).catch(()=>l.tap({force:true})); await P.waitForTimeout(v)};
async function skriv(fras){
  if(!await P.locator("[data-testid=tangentbord]").isVisible().catch(()=>false)) await tap(P.locator("[data-testid=pennans-bok]"),1200);
  for(const c of fras){ if(c===" ") await tap(P.locator("[data-testid=mellanslag]"),80); else await tap(P.locator("[data-testid=tangentbord] button.tangent",{hasText:new RegExp("^"+c+"$","i")}).first(),80); }
  await tap(P.locator("[data-testid=vakna]"),5500);
  if(await P.locator("[data-testid=stang-bok]").isVisible().catch(()=>false)) await tap(P.locator("[data-testid=stang-bok]"),2500);
}
const res=[]; let fel=0; let i=0;
for(const fras of FRASER){ i++;
  const f=PROV[RUNDA].find(x=>x.fras===fras); const fore=await P.evaluate(()=>(JSON.parse(localStorage.getItem("trollpennan-v2")??"{}").ang??[]).length);
  try{ await skriv(fras);}catch(e){res.push({fras,fel:String(e).slice(0,200)}); fel++; continue;}
  const m=await P.evaluate(()=>{const a=JSON.parse(localStorage.getItem("trollpennan-v2")??"{}").ang??[]; const d=a[a.length-1]??null; return {n:a.length,d:d&&{kropp:d.kropp,tillbehor:(d.tillbehor??[]).map(t=>t.id),monster:d.monster,formagor:d.formagor??[],agg:(d.reserv??[]).map(r=>r.ord),formel:d.formel},bann:window.__bann.slice(-4)}});
  const brist=[]; const d=m.d;
  if(m.n<=fore||!d) brist.push("ingen ny skapelse på ängen");
  else {
    if(f.kropp&&d.kropp!==f.kropp) brist.push(`kropp ${d.kropp}, väntat ${f.kropp}`);
    if(f.inte_kropp&&d.kropp===f.inte_kropp) brist.push(`kropp ${d.kropp} (förbjuden)`);
    if(f.agg!=null&&d.agg.length!==f.agg) brist.push(`${d.agg.length} ägg (${d.agg.join(",")}), väntat ${f.agg}`);
    for(const t of f.tillbehor??[]) if(!d.tillbehor.includes(t)) brist.push(`saknar tillbehör ${t}`);
    if(f.monster&&d.monster!==f.monster) brist.push(`mönster ${d.monster}, väntat ${f.monster}`);
    for(const k of f.formagor??[]) if(!d.formagor.includes(k)) brist.push(`saknar förmåga ${k}`);
    if(f.ingen_replik&&m.bann.some(b=>b.startsWith(f.ingen_replik))) brist.push(`falsk replik: ${f.ingen_replik}…`);
  }
  await P.screenshot({path:`${UT}/${String(i).padStart(2,"0")}-${fras.replace(/\s+/g,"-")}.png`});
  if(brist.length) fel++; res.push({fras,ok:!brist.length,brist,sedd:d,bann:m.bann});
  console.log(brist.length?"FEL":"OK ",fras,brist.join("; "));
}
fs.writeFileSync(`${UT}/resultat.json`,JSON.stringify({runda:RUNDA,res,sidfel},null,1));
console.log("sidfel",JSON.stringify(sidfel)); await br.close(); sv.close(); process.exit(fel||sidfel.length?1:0);
