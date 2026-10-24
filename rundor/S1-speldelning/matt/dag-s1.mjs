#!/usr/bin/env node
// S1: grupperna i ritningen (BESTALLNING-S1a.md) som DAG. Läser Spel.tsx (eller --fil) och skriver varje sats som
// använder ett namn från en grupp som anropas senare ("framåt") och varje sats som inte har någon grupp.
// Exit 0 = grupperna går att anropa i ordning utan att någon funktionskropp ändras. Kör på basen (main efter R1) i PLAN-steget.
//   node rundor/S1-speldelning/matt/dag-s1.mjs [--fil src/spel/Spel.tsx]
import fs from "node:fs"; import path from "node:path"; import { createRequire } from "node:module";
const ts = createRequire(path.resolve("package.json"))("typescript");
const fi = process.argv.indexOf("--fil"); const FIL = fi > 0 ? process.argv[fi + 1] : "src/spel/Spel.tsx";
const src=fs.readFileSync(FIL,"utf8"); const sf=ts.createSourceFile("x.tsx",src,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const ln=p=>sf.getLineAndCharacterOfPosition(p).line+1;
const spel=sf.statements.find(s=>ts.isFunctionDeclaration(s)&&s.name?.text==="Spel");
const G=[["tillstand",[]],["bannrar","visaNastaBanner stangBanner slackBanner visaBanner visaBubbla visaMossa bjud @useStallBanner"],["varld","lasMeny visaVarld lamnaAv synkaAv oppnaKarta kanskeForstaGard oppnaBygglage oppnaUppdrag oppnaSkapa visaPlatsRen valjVarld"],
["aventyr","belonaFlode gaIn tryckPlats tryckOn oppnaSkicka bytFolje bengtsson platsUi"],["onska","pagarId stangBok oppnaOnska stangOnska @549"],["belona","kollaSidor belona uppfyll"],["skapa","rensaSkriv hanteraBygg hanteraDjur utfor utforRef @utforRef.current"],
["gard","forsokKop bekraftaKop flyttaInDjur borjaOm sparaKopia lasFil lasInKopia"],["handelser","@1210 @1282 @1327"],["klocka","@1356"],["skriv","byggFras vaknaNu skrivTecken sudda valjKort oppnaSkrivMig valjForslag nejForslag fyllExempel vackIde @1383 @1386 @1388"],["Spel","@1428"],["avbro","@1628 @1660"],["vydata","@1667 stallKanin"]];
const grp=new Map(); G.forEach(([g,l],i)=>{ if(typeof l==="string") l.split(" ").forEach(n=>grp.set(n,i)); });
// Satser som R1 lade till: Build skriver dem i rundor/S1-speldelning/grupper-extra.json, {"namn eller @rad": "grupp"}, och motiverar i PLAN.md
const EXTRA = "rundor/S1-speldelning/grupper-extra.json";
if (fs.existsSync(EXTRA)) for (const [n, g] of Object.entries(JSON.parse(fs.readFileSync(EXTRA, "utf8")))) { const i = G.findIndex(([x]) => x === g); if (i < 0) { console.error(`okänd grupp ${g} i ${EXTRA}`); process.exit(2); } grp.set(n, i); }
const def=new Map(); const stmts=[];
for(const s of spel.body.statements){ const L=ln(s.getStart()); let names=[];
 if(ts.isFunctionDeclaration(s)) names=[s.name.text];
 else if(ts.isVariableStatement(s)) for(const d of s.declarationList.declarations){ if(ts.isIdentifier(d.name)) names.push(d.name.text); else d.name.elements.forEach(e=>e.name&&names.push(e.name.getText())); }
 const nyck = s.getText().match(/^([A-Za-z]+(?:\.current)?)/)?.[1];
 let g = names.map(n=>grp.get(n)).find(x=>x!=null) ?? grp.get("@"+L) ?? grp.get("@"+nyck);
 if(g==null){ if(ts.isReturnStatement(s)) g=13; else if(L<222) g=0; else if(L>=1691) g=13; else { console.log("OGRUPPERAD", L, s.getText().slice(0,60)); g=-1; } }
 names.forEach(n=>def.set(n,g)); stmts.push([s,g,L,names]); }
let fel=0;
for(const [s,g,L,names] of stmts){ const egna=new Set(); (function d(n){ if((ts.isVariableDeclaration(n)||ts.isParameter(n)||ts.isBindingElement(n))&&ts.isIdentifier(n.name)) egna.add(n.name.text); if(ts.isFunctionDeclaration(n)&&n!==s&&n.name) egna.add(n.name.text); ts.forEachChild(n,d); })(s);
 const anv=new Set(); (function b(n){ if(ts.isIdentifier(n)&&def.has(n.text)&&!egna.has(n.text)&&!(ts.isPropertyAssignment(n.parent)&&n.parent.name===n)) anv.add(n.text); ts.forEachChild(n,b); })(s);
 for(const a of anv){ if(names.includes(a)) continue; const dg=def.get(a); if(dg>g){ console.log(`framåt: ${names[0]??"@"+L} (${G[g]?.[0]}) använder ${a} (${G[dg][0]})`); fel++; } } }
const ogr = stmts.filter(([, g]) => g === -1).length;
console.log(`dag-s1: ${stmts.length} satser, ${fel} framåt, ${ogr} utan grupp`); process.exit(fel || ogr ? 1 : 0);
