#!/usr/bin/env node
// Jämför gamla djurtabeller i koden (ur git, --bas <commit>, standard = origin/main, som måste ha de gamla tabellerna) med det nya
// dataläget (src/spel/entiteter.ts) för alla 14 kroppar × förmågor. Skriven av Arkitekten. Mäter inget i spelet.
//   node --experimental-strip-types rundor/R3A-entiteter/r3a-jamfor.mjs --bas origin/main
// Utskrift: "fall N, avvikelser 0" och exit 0, annars varje avvikelse och exit 1.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const bas = process.argv.includes("--bas") ? process.argv[process.argv.indexOf("--bas") + 1] : "origin/main";
const git = (fil) => execFileSync("git", ["show", `${bas}:${fil}`], { cwd: rot, encoding: "utf8" });

function block(src, start) {
  // text från första "{" (eller "(") efter `start` till matchande slutparentes
  const i = src.indexOf(start);
  if (i < 0) throw new Error(`hittar inte ${start}`);
  let j = src.indexOf("{", i);
  let d = 0;
  for (let k = j; k < src.length; k++) {
    if (src[k] === "{") d++;
    else if (src[k] === "}" && --d === 0) return src.slice(j, k + 1);
  }
  throw new Error(`obalanserat ${start}`);
}
const objekt = (src, start) => new Function(`return (${block(src, start)});`)();
const funktion = (src, start, ...parametrar) => {
  const kropp = block(src, start);
  return new Function(...parametrar, kropp.slice(1, -1));
};
const rad = (src, re) => {
  const m = src.match(re);
  if (!m) throw new Error(`hittar inte ${re}`);
  return m[0];
};

const gltf = git("src/spel/gltfDjur.tsx");
const angen = git("src/spel/angen3d.tsx");
const liv = git("src/spel/liv.ts");
const FIL = objekt(gltf, "const FIL: Record<string, string> = {");
const MAL_HOJD = objekt(gltf, "const MAL_HOJD: Record<string, number> = {");
const PALETT = objekt(gltf, "const PALETT: Record<string, Palett> = {");
const ART = objekt(angen, "const ART: Record<string, string> = {");
const gammalFlygare = funktion(angen, "function flygare(spec: Sparad)", "spec");
const gammalSimmare = funktion(angen, "function simmare(spec: Sparad)", "spec");
const gammalVikt = new Function("d", `return ${rad(angen, /\(d: Sparad\) => \(d\.kropp === "drake" \? 3 : d\.kropp === "häst" \? 2 : 1\)/).replace("(d: Sparad) => ", "")};`);
const gammalKanHoppa = new Function("spec", `return ${rad(angen, /spec\.kropp === "kanin" \|\| spec\.kropp === "fågel" \|\| spec\.kropp === "ekorre" \|\| spec\.kropp === "groda"/)};`);
const gammalHopp = new Function("spec", `return ${rad(angen, /spec\.kropp === "fågel" \? 0\.32 : 0\.55/)};`);
const gammalFargAv = new Function("spec", block(gltf, "function fargAv(spec: Sparad)").slice(1, -1));
const gammalKroppar = new Function(`return ${rad(liv, /export const KROPPAR = (\[[^\]]*\])/).replace("export const KROPPAR = ", "")};`)();
const gammalArt = (spec) => ART[spec.kropp] ?? "#CE93D8";

const ny = await import(path.join(rot, "src/spel/entiteter.ts"));

// Material: gamla grenarna i fargaKlon (drake/groda/palett), ur git-versionen, för varje materialnamn i GLB-filerna.
function glbMaterial(fil) {
  const b = fs.readFileSync(path.join(rot, "public", fil));
  const l = b.readUInt32LE(12);
  return JSON.parse(b.subarray(20, 20 + l).toString("utf8")).materials?.map((m) => m.name ?? "") ?? [];
}
const gammalMaterial = (kropp, namn, glans, pal) => {
  // ordagrant ur gamla fargaKlon: (roll, glans)
  let roll = null;
  if (kropp === "drake") roll = namn === "Dragon_Main" ? "farg" : namn === "Dragon_Secondary" ? "ljus" : null;
  else if (kropp === "groda") roll = namn === "4CAF50" ? "farg" : null;
  const g = Boolean(glans && (namn === "Dragon_Main" || namn === "4CAF50" || pal));
  return `${roll}|${g}`;
};
const nyMaterial = (kropp, namn, glans) => {
  const ent = ny.entitet(kropp);
  const roll = ent?.material ? ent.material[namn] : undefined;
  const g = Boolean(glans && (roll === "farg" || (!ent?.material && ent?.palett)));
  return `${roll ?? null}|${g}`;
};

let fall = 0;
const avvik = [];
const lika = (namn, a, b) => {
  fall++;
  if (JSON.stringify(a) !== JSON.stringify(b)) avvik.push(`${namn}: gammal ${JSON.stringify(a)} ≠ ny ${JSON.stringify(b)}`);
};

lika("KROPPAR (ordning)", gammalKroppar, ny.djurIds());
const kroppar = [...gammalKroppar, "okänt-djur"];
for (const k of kroppar) {
  lika(`${k} modellUrl`, FIL[k] ?? null, ny.modellUrl(k));
  lika(`${k} malhojd`, MAL_HOJD[k] ?? 1, ny.malhojd(k));
  lika(`${k} palett`, PALETT[k] ?? null, ny.entitet(k)?.palett ?? null);
  lika(`${k} art`, gammalArt({ kropp: k }), ny.artFarg(k));
  lika(`${k} vikt`, gammalVikt({ kropp: k }), ny.vikt(k));
  lika(`${k} kanHoppa`, gammalKanHoppa({ kropp: k }), ny.hoppHojd(k) !== null);
  if (gammalKanHoppa({ kropp: k })) lika(`${k} hopphöjd`, gammalHopp({ kropp: k }), ny.hoppHojd(k));
  lika(`${k} standardfärg`, gammalFargAv({ kropp: k, farg: undefined }), ny.entitet(k)?.standardfarg ?? null);
  lika(`${k} nattvaken`, k === "uggla", ny.nattvaken(k));
  lika(`${k} svävar`, k === "drake", ny.svavar(k));
  for (const formagor of [[], ["vingar"], ["fenor"], ["vingar", "fenor"], ["flammor"]]) {
    const spec = { kropp: k, formagor };
    lika(`${k} [${formagor}] flyger`, Boolean(gammalFlygare(spec)), ny.flyger(k, formagor));
    lika(`${k} [${formagor}] simmar`, Boolean(gammalSimmare(spec)), ny.simmar(k, formagor));
  }
}
for (const [k, e] of Object.entries(ny.ENTITETER)) {
  if (!e.modell) continue;
  const fil = ny.TILLGANGAR[e.modell].fil;
  for (const namn of glbMaterial(fil)) {
    for (const glans of [false, true]) {
      lika(`${k} material ${namn} glans=${glans}`, gammalMaterial(k, namn, glans, PALETT[k]), nyMaterial(k, namn, glans));
    }
  }
}
for (const a of avvik) console.log("AVVIKER", a);
console.log(`fall ${fall}, avvikelser ${avvik.length}`);
process.exit(avvik.length ? 1 : 0);
