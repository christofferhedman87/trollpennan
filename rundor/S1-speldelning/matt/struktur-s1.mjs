#!/usr/bin/env node
// S1 strukturvakt och ordagrant-bevis (Arkitekten 2026-10-24). Läser bara.
//   node rundor/S1-speldelning/matt/struktur-s1.mjs --bas <commit> --steg a   efter S1a
//   node rundor/S1-speldelning/matt/struktur-s1.mjs --bas <commit> --steg b   efter S1b (slutläget)
// --bas = commiten S1a utgick från (main efter R1). Skriptet läser Spel.tsx där med git show.
// Kontroller (alla gröna = exit 0):
//  1. radtak: Spel.tsx ≤ (rader på basen − 690) (a, 1 152 om basen har 1 842) / ≤ 400 (b); varje fil i src/spel/styr/ ≤ 400; varje fil i src/spel/ui/ ≤ 800.
//  2. ordagrant: varje sats i Spel() vid --bas (useState, useRef, useMinne-val, funktion, effekt, ref-tilldelning)
//     finns ordagrant (indrag borttaget per rad) i Spel.tsx, src/spel/styr/** eller src/spel/ui/SpelVy.tsx.
//     En relativ dynamisk import får gå ett steg upp (import("./starta.ts") → import("../starta.ts")).
//     Undantag: JSX-satsen `return (` (bevisas av dom-tur och skarm-s1) och __troll-effekten, där bara
//     objektet `const api = {...}` måste finnas ordagrant. Övriga undantag måste stå i
//     rundor/S1-speldelning/undantag.json ({"namn": "skäl"}) och skrivs ut; de granskas för hand.
//  3. flyttat: funktionerna i FLYTT_A (a) / alla funktioner och effekter (b) finns inte längre i Spel.tsx.
//  4. inget prov ändrat: `git diff --name-only <bas> -- '*.test.*' scripts/check-spel-struktur.mjs` är tom.
//  5. ingen fil i src/spel/styr/ eller src/spel/ui/ importerar Spel.tsx.
//  6. (b) Spel.tsx: ingen useState, högst en useEffect (__troll), krokarna anropas i ORDNING.
import fs from "node:fs"; import path from "node:path"; import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
const ts = createRequire(path.resolve("package.json"))("typescript");
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : d; };
const STEG = arg("steg", "b"); const BAS = arg("bas");
if (!BAS || !["a", "b"].includes(STEG)) { console.error("ange --bas <commit> och --steg a|b"); process.exit(2); }
const FLYTT_A = ["visaBanner", "stangBanner", "slackBanner", "visaBubbla", "visaMossa", "bjud", "visaVarld", "lamnaAv", "synkaAv",
  "kanskeForstaGard", "oppnaBygglage", "oppnaUppdrag", "oppnaSkapa", "oppnaKarta", "lasMeny", "visaPlatsRen", "valjVarld",
  "belonaFlode", "gaIn", "tryckPlats", "tryckOn", "oppnaSkicka", "bytFolje", "kollaSidor", "belona", "uppfyll",
  "stangOnska", "oppnaOnska", "stangBok", "rensaSkriv", "hanteraBygg", "hanteraDjur", "utfor"];
const ORDNING = ["useSpelTillstand", "useBannrar", "useVarld", "useAventyr", "useOnska", "useBelona", "useSkapa",
  "useGard", "useHandelser", "useKlocka", "useSkriv", "skapaTrollApi", "useAvBro", "useVyData"];
const rot = process.cwd(); const fel = []; const info = [];
const las = (f) => fs.readFileSync(path.join(rot, f), "utf8");
const rader = (s) => s.split("\n").length - (s.endsWith("\n") ? 1 : 0);
const filer = (d) => { const a = path.join(rot, d); if (!fs.existsSync(a)) return []; const ut = [];
  for (const e of fs.readdirSync(a, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) ut.push(...filer(p)); else if (/\.(ts|tsx)$/.test(e.name) && !/\.test\./.test(e.name)) ut.push(p); } return ut.sort(); };
const norm = (s) => s.split("\n").map((l) => l.trim()).filter(Boolean).join("\n");
const basText = execFileSync("git", ["show", `${BAS}:src/spel/Spel.tsx`], { encoding: "utf8", maxBuffer: 1 << 26 });
const MAX_SPEL = STEG === "a" ? rader(basText) - 690 : 400; // S1a flyttar ≈ 850 rader och lägger tillbaka ≈ 160 rader krokanrop
// 1
const spelNu = las("src/spel/Spel.tsx");
if (rader(spelNu) > MAX_SPEL) fel.push(`Spel.tsx har ${rader(spelNu)} rader, taket är ${MAX_SPEL}`);
const styr = filer("src/spel/styr"), ui = filer("src/spel/ui");
for (const f of styr) if (rader(las(f)) > 400) fel.push(`${f} har ${rader(las(f))} rader (tak 400 i styr/)`);
for (const f of ui) if (rader(las(f)) > 800) fel.push(`${f} har ${rader(las(f))} rader (tak 800 i ui/)`);
// 2
const sf = ts.createSourceFile("bas.tsx", basText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const spel = sf.statements.find((s) => ts.isFunctionDeclaration(s) && s.name?.text === "Spel");
const korpus = norm([spelNu, ...styr.map(las), ...(fs.existsSync(path.join(rot, "src/spel/ui/SpelVy.tsx")) ? [las("src/spel/ui/SpelVy.tsx")] : [])].join("\n"));
const undantag = fs.existsSync(path.join(rot, "rundor/S1-speldelning/undantag.json")) ? JSON.parse(las("rundor/S1-speldelning/undantag.json")) : {};
const namnAv = (s) => ts.isFunctionDeclaration(s) ? s.name.text
  : ts.isVariableStatement(s) ? s.declarationList.declarations.map((d) => d.name.getText()).join(",")
  : `${s.getText().split("\n")[0].slice(0, 60)} (r.${sf.getLineAndCharacterOfPosition(s.getStart()).line + 1})`;
let ok = 0; const funk = [], effekter = [];
for (const s of spel.body.statements) {
  const text = s.getText(), namn = namnAv(s);
  if (ts.isReturnStatement(s)) { info.push("return (JSX): undantag, bevisas av dom-tur och skarm-s1"); continue; }
  if (ts.isFunctionDeclaration(s)) funk.push(namn);
  if (/^use(Layout)?Effect\(/.test(text)) effekter.push(text);
  if (/window\.__troll\s*=\s*api/.test(text)) {
    const api = text.slice(text.indexOf("const api = {"), text.indexOf("\n    };", text.indexOf("const api = {")) + 7);
    if (korpus.includes(norm(api))) ok++; else fel.push("__troll: objektet `const api = {...}` finns inte ordagrant");
    if (!/if \(import\.meta\.env\.DEV \|\| navigator\.webdriver === true\) window\.__troll = api/.test(spelNu)) fel.push("raden `window.__troll = api` måste stå kvar i Spel.tsx (tts3.test.ts läser den)");
    continue;
  }
  // enda tillåtna ändringen i en kropp: en relativ dynamisk import ett steg upp (styr/ ligger en nivå under src/spel/)
  if (korpus.includes(norm(text)) || korpus.includes(norm(text.replaceAll('import("./', 'import("../')))) ok++;
  else if (undantag[namn]) info.push(`undantag ${namn}: ${undantag[namn]}`);
  else fel.push(`inte ordagrant: ${namn}`);
}
// 3
const spelSf = ts.createSourceFile("nu.tsx", spelNu, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const iSpel = new Set(); (function b(n) { if (ts.isFunctionDeclaration(n) && n.name) iSpel.add(n.name.text); ts.forEachChild(n, b); })(spelSf);
const skaBort = STEG === "a" ? FLYTT_A : funk;
for (const f of skaBort) if (iSpel.has(f) && f !== "Spel") fel.push(`${f} ligger kvar i Spel.tsx`);
// 4
const andrade = execFileSync("git", ["diff", "--name-only", BAS, "--", "*.test.ts", "*.test.mjs", "*.test.tsx", "scripts/check-spel-struktur.mjs"], { encoding: "utf8" }).trim();
if (andrade) fel.push(`prov ändrade (får inte ändras): ${andrade.split("\n").join(", ")}`);
// 5
for (const f of [...styr, ...ui]) if (/from\s+["'](\.\.\/Spel|\.\/Spel|\.\.\/\.\.\/spel\/Spel|@\/spel\/Spel)(\.tsx)?["']/.test(las(f))) fel.push(`${f} importerar Spel.tsx`);
// 6
if (STEG === "b") {
  if (/\buseState\b/.test(spelNu)) fel.push("Spel.tsx har useState (ska bara vara komposition)");
  const eff = (spelNu.match(/\buse(Layout)?Effect\(/g) ?? []).length; if (eff > 1) fel.push(`Spel.tsx har ${eff} effekter (högst 1: __troll)`);
  let senast = -1;
  for (const k of ORDNING) { const i = spelNu.search(new RegExp(`\\b${k}\\(`)); if (i < 0) fel.push(`Spel.tsx anropar inte ${k}`); else if (i < senast) fel.push(`${k} anropas i fel ordning`); else senast = i; }
}
console.log(`steg ${STEG}: Spel.tsx ${rader(spelNu)} rader (tak ${MAX_SPEL}); styr/ ${styr.length} filer; ordagrant ${ok} satser; bas ${BAS}`);
for (const r of info) console.log("  " + r);
if (fel.length) { console.error("\nstruktur-s1 RÖD:\n- " + fel.join("\n- ")); process.exit(1); }
console.log("struktur-s1 GRÖN");
