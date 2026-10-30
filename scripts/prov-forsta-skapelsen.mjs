// Syntetiskt startprov: titel, skärmtangenter, skapelse, lokal sparning och omladdning i tre vyer.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';
const adress=process.argv[2]??'http://127.0.0.1:4173/';
const bildmapp=process.env.QA_SCREENSHOTS;
if(bildmapp)await mkdir(bildmapp,{recursive:true});
const bild=async(page,name)=>{if(bildmapp)await page.screenshot({path:`${bildmapp}/${name}.png`});};
const browser=await chromium.launch({executablePath:process.env.CHROMIUM||undefined,args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
try {
 for(const [name,viewport] of [['mobil',{width:375,height:812}],['liggande',{width:812,height:375}],['dator',{width:1280,height:800}]]) {
  const ctx=await browser.newContext({viewport,deviceScaleFactor:1});
  const page=await ctx.newPage(); page.setDefaultTimeout(60000);
  const errors=[],external=[],consoleErrors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text().slice(0,180));});
  page.on('request',r=>{if(!r.url().startsWith(new URL(adress).origin+'/')&&!r.url().startsWith('data:')&&!r.url().startsWith('blob:'))external.push(r.url());});
  await page.addInitScript(()=>sessionStorage.setItem('p2-titel-prov','1'));
  console.log(name,'start');
  await page.goto(adress);
  await page.getByTestId('titel-borja').waitFor({state:'visible',timeout:120000});
  await bild(page,`${name}-titel`);
  await page.getByTestId('titel-borja').click();
  await page.getByTestId('intro-hoppa').click();
  await page.getByTestId('tangentbord').waitFor({state:'visible',timeout:120000});
  await page.waitForFunction(()=>!document.querySelector('[data-testid="intro"]'));
  await bild(page,`${name}-skriv`);
  const keyboard=page.getByTestId('tangentbord');
  const before=await page.evaluate(()=>window.__troll.state().ang.length);
  for(const t of 'en grön kanin'){
   console.log(name,'key',JSON.stringify(t));
   if(t===' ')await page.getByTestId('mellanslag').click();
   else await keyboard.getByRole('button',{name:t,exact:true}).click();
  }
  await page.getByRole('button',{name:'Trolla fram det du skrivit',exact:true}).click();
  await page.waitForFunction(()=>window.__troll?.state().ang.some(d=>d.formel.includes('grön kanin')),null,{timeout:60000});
  const made=await page.evaluate(()=>window.__troll.state().ang.map(d=>({kropp:d.kropp,formel:d.formel})));
  await page.waitForTimeout(1500);
  await bild(page,`${name}-skapelse`);
  const layout=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,width:innerWidth,render:window.__tred??null}));
  assert.ok(made.length>before);
  assert.ok(made.some(d=>d.formel.includes('grön kanin')));
  console.log(name,'created',JSON.stringify(made));
  await page.reload();
  await page.getByTestId('titel-fortsatt').waitFor({state:'visible',timeout:120000});
  await page.getByTestId('titel-fortsatt').click();
  await page.waitForFunction(()=>window.__troll?.state().ang.some(d=>d.kropp==='kanin'));
  assert.equal(errors.length,0,errors.join('; '));
  assert.equal(external.length,0,external.join('; '));
  assert.equal(layout.scrollWidth,layout.width);
  console.log(JSON.stringify({name,made,persisted:true,layout,errors,consoleErrors,external}));
  await ctx.close();
 }
} finally {await browser.close();}
