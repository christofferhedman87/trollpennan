import { test } from "node:test";
import assert from "node:assert/strict";
import { delaLaddning } from "./texturKo.ts";
test("två scener laddar samma nyckel en gång", async () => {
 const game={};const loaded=new Set<string>();let calls=0;
 const load=async(keys:string[])=>{calls++;await new Promise(r=>setTimeout(r,5));keys.forEach(k=>loaded.add(k));};
 await Promise.all([delaLaddning(game,["skugga"],k=>loaded.has(k),load),delaLaddning(game,["skugga"],k=>loaded.has(k),load)]);
 assert.equal(calls,1);
});
test("dubbletter i batch tas bort",async()=>{let got:string[]=[];await delaLaddning({},["a","a",""],()=>false,async k=>{got=k;});assert.deepEqual(got,["a"]);});
test("befintliga texturer laddas inte",async()=>{let called=false;await delaLaddning({},["a"],()=>true,async()=>{called=true;});assert.equal(called,false);});
test("olika spel delar inte kö",async()=>{let n=0;await Promise.all([delaLaddning({},["a"],()=>false,async()=>{n++;}),delaLaddning({},["a"],()=>false,async()=>{n++;})]);assert.equal(n,2);});
test("laddningsfel blockerar inte nästa jobb",async()=>{const game={};await assert.rejects(delaLaddning(game,["a"],()=>false,async()=>{throw Error("fail");}));let called=false;await delaLaddning(game,["b"],()=>false,async()=>{called=true;});assert.equal(called,true);});
test("saknad fil kan prövas igen",async()=>{const game={};let n=0;await delaLaddning(game,["a"],()=>false,async()=>{n++;});await delaLaddning(game,["a"],()=>false,async()=>{n++;});assert.equal(n,2);});
