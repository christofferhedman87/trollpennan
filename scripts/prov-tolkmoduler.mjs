#!/usr/bin/env node
// Beteendebevarande moduldelning: skriv ett före-utfall och jämför efter med samma fraser.
// node --experimental-strip-types scripts/prov-tolkmoduler.mjs REPO UTFALL.json [FORE.json]
// Körinstruktioner med fasta commits finns i docs/codex/plan.md, C1a.
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
const rot=process.argv[2],ut=process.argv[3];
if(!rot||!ut)throw new Error('Ange absolut reposökväg och utfallsfil, sedan valfri före-fil.');
const {tolka}=await import(pathToFileURL(rot+'/src/tolk/tolka.ts'));
const {tolkaMedReserv}=await import(pathToFileURL(rot+'/src/tolk/reserv.ts'));
const fraser=new Set();
function samla(v,nyckel=''){
 if(typeof v==='string'&&['fras','mening','input','raw','exempel','hjalp','fria_ideer','ja','nej'].includes(nyckel))fraser.add(v);
 else if(Array.isArray(v))v.forEach(x=>samla(x,nyckel));
 else if(v&&typeof v==='object')Object.entries(v).forEach(([k,x])=>samla(x,k));
}
for(const fil of ['test-fraser.json','test-fraser-bygg-form.json','bengtsson.json','onskningar.json','onskningar-bygg.json','skapa-ui.json'])samla(JSON.parse(fs.readFileSync(rot+'/data/'+fil)));
for(const o of JSON.parse(fs.readFileSync(rot+'/data/ord.json')).ord)for(const f of o.former.slice(0,3))fraser.add(o.klass==='djur'?`en ${f}`:o.klass==='tillbehor'?`en kanin med ${f}`:`en ${f} kanin`);
const val=process.argv[4]?JSON.parse(fs.readFileSync(process.argv[4])).map(r=>r[0]):[...fraser].sort();
const resultat=val.map(f=>[f,tolka(f,{kalla:'kort'}),tolkaMedReserv(f,{kalla:'kort',noteraBlandning:false})]);
fs.writeFileSync(ut,JSON.stringify(resultat));console.log('Tolkade',resultat.length,'fraser');
