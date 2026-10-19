import fs from "node:fs";
import { tolkaMedReserv } from "../../../src/tolk/reserv.ts";
import { kravUppfyllt } from "../../../src/spel/uppdragsmotor.ts";
const tf = JSON.parse(fs.readFileSync("rundor/BLOCK-platser/data-utkast/testfraser-platser.json","utf8")).fraser;
const up = new Map(JSON.parse(fs.readFileSync("rundor/BLOCK-platser/data-utkast/bengtsson-platser.json","utf8")).uppdrag.map((u:any)=>[u.id,u]));
const c: Record<string,number> = {}; const avvik: string[] = [];
for (const t of tf) { const r = tolkaMedReserv(t.text); const k = `${t.utfall}->${r.typ}`; c[k]=(c[k]??0)+1;
  const u:any = t.uppdrag && up.get(t.uppdrag); if (u && typeof t.lost==="boolean") { const ok = kravUppfyllt(u.krav, t.text); if (ok!==t.lost) avvik.push(`${t.id} "${t.text}" lost=${t.lost} motor=${ok}`); } }
console.log(JSON.stringify(c), "\nuppdragsavvikelser", avvik.length, "\n"+avvik.slice(0,25).join("\n"));
