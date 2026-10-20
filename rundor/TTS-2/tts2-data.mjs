// TTS-2: små, idempotenta textändringar i Spel.tsx och AngLager.tsx, rost2.test.ts i test:product och LICENSES.md (i stället för patch, så att de fungerar både före
// och efter B6.3 som skriver om bannerkoden). Spel.tsx får INGA nya rader: importen byts på samma rad och bannerns tid
// lindas in i bannerTid(). AngLager.tsx får en import och en rad (bubblor + önskan läses upp).
// TTS-2-fix: ett tryck på bannern (B6.3) stänger den direkt, tystar rösten och tar bort samma text ur kön – fortfarande 0 nya rader i Spel.tsx.
import { execFileSync } from "node:child_process";
import fs from "node:fs";

const fel = (m) => {
  console.error(`FEL: ${m}`);
  process.exit(1);
};
function andra(fil, fn) {
  const fore = fs.readFileSync(fil, "utf8");
  const efter = fn(fore);
  if (efter !== fore) {
    fs.writeFileSync(fil, efter);
    console.log(`${fil}: ändrad`);
  } else console.log(`${fil}: redan klar`);
}

andra("src/spel/Spel.tsx", (s) => {
  if (s.includes("bannerTid(")) return s;
  const imp = 'import { useRostBannrar } from "./rost.ts";';
  if (!s.includes(imp)) fel("Spel.tsx saknar TTS-1:s import av useRostBannrar – kör TTS-1 först");
  s = s.replace(imp, 'import { bannerTid, tystna, useRostBannrar } from "./rost.ts";');
  const i = s.indexOf("function visaNastaBanner()");
  if (i < 0) fel("visaNastaBanner saknas i Spel.tsx");
  const slut = s.indexOf("\n  }\n", i);
  let kropp = s.slice(i, slut);
  if (kropp.includes("next.ms ?? 2400")) kropp = kropp.replace("next.ms ?? 2400", "bannerTid(next.text, next.ms ?? 2400)");
  else if ((kropp.match(/\}, 2400\);/g) ?? []).length === 1) kropp = kropp.replace("}, 2400);", "}, bannerTid(next.text, 2400));");
  else fel("hittar inte bannerns tid (2400) i visaNastaBanner");
  s = s.slice(0, i) + kropp + s.slice(slut);
  // Tryck (B6.3 H): bannern står nu så länge rösten, men ett tryck stänger den alltid direkt, tystar rösten och tar bort
  // samma text ur kön (annars visas en likadan uppmaning igen 200 ms senare). Timern anropar stangBanner() utan text.
  const stang = "  function stangBanner() {\n    if (bannerTimer.current) window.clearTimeout(bannerTimer.current);\n";
  if (!s.includes(stang)) fel("stangBanner (B6.3) saknas i Spel.tsx – kör B6.3 först");
  return s.replace(stang, "  function stangBanner(tryckt?: string) {\n    if (bannerTimer.current) window.clearTimeout(bannerTimer.current); if (tryckt !== undefined) { tystna(); bannerKo.current = bannerKo.current.filter((b) => b.text !== tryckt); } // TTS-2: tryck = stäng direkt + tysta\n");
});

andra("src/spel/ui/AngLager.tsx", (s) => {
  if (s.includes("useRostBubblor(")) return s;
  const rad = "  const harBubblor = bubblor.length > 0;\n";
  if (!s.includes(rad)) fel("AngLager.tsx: raden harBubblor saknas");
  const forsta = s.indexOf("\n") + 1;
  s = s.slice(0, forsta) + 'import { useRostBubblor } from "../rost.ts";\n' + s.slice(forsta);
  const typ = "  stangBanner: () => void;\n";
  const klick = "onClick: stangBanner }";
  if (!s.includes(typ) || !s.includes(klick)) fel("AngLager.tsx: stangBanner (B6.3) saknas – kör B6.3 först");
  s = s.replace(typ, "  stangBanner: (tryckt?: string) => void;\n").replace(klick, "onClick: () => stangBanner(b.text) }");
  return s.replace(rad, rad + "  useRostBubblor(bubblor, onskan && onskaSyns && !onskaOpp && !harBubblor ? onskan.text : null); // TTS-2: pratbubblor och önskan läses upp\n");
});

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
if (!pkg.scripts["test:product"].includes("src/spel/rost2.test.ts")) {
  pkg.scripts["test:product"] += " src/spel/rost2.test.ts";
  fs.writeFileSync("package.json", JSON.stringify(pkg, null, 2) + "\n");
  console.log("package.json: rost2.test.ts tillagd i test:product");
}
// LICENSES.md: avsnittet Röster och tal skrivs om ur data/rost.json (nu med syntaxvirusets röst)
execFileSync(process.execPath, ["scripts/modell-inlagg.mjs", "licenser"], { stdio: "inherit" });
if (!fs.readFileSync("LICENSES.md", "utf8").includes("## Röster och tal")) fel("LICENSES.md saknar Röster och tal");
