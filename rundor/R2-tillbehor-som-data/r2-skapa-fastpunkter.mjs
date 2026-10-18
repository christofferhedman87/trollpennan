// Skapar data/fastpunkter.json ur MÄTT utgångsläge (gammal-ankare.json = old ankareFor/procAnkare körda på de nio GLB-filerna)
// plus de siffror som står som konstanter i src/spel/tillbehorFaste.ts (drake/häst-offset, bredd-regler, skalfaktorer per djur).
// Inga siffror gissas: bråkdelarna räknas som (ankare - bbox.min) / (bbox.max - bbox.min) och avrundas till 4 decimaler.
// Kanin, katt, hund och fisk: gamla koden satte ansiktet vid min.z, men GLB-filerna vetter mot +z (uppmätt). Därför speglas z (1 - f).
import fs from "node:fs";
import path from "node:path";
const hit = path.dirname(new URL(import.meta.url).pathname);
const gammal = JSON.parse(fs.readFileSync(path.join(hit, "mat/gammal-ankare.json"), "utf8"));
const kontroll = process.argv.includes("--kontroll");
const MAL = path.join(hit, "../../data/fastpunkter.json");
const UT = kontroll ? "/tmp/r2-fastpunkter-kontroll.json" : (process.argv[2] ?? MAL);
const SPEGLA = new Set(["kanin", "katt", "hund", "fisk"]);
const r4 = (x) => Math.round(x * 1e4) / 1e4;
const NAMN = ["huvudTopp", "ansikte", "ogonL", "ogonR", "mun", "hals", "rygg"];
const kroppar = {};
const MESH_ORDNING = ["standard", "gris", "dinosaurie", "bäver", "ekorre", "haj", "kanin", "katt", "hund", "fågel", "uggla", "fisk", "groda", "drake", "häst"];
for (const k of MESH_ORDNING) {
  const m = gammal.mesh[k];
  const r = { mesh: { bredd: m.bredd, hojd: m.hojd } };
  for (const n of NAMN) r.mesh[n] = m[n].map(r4);
  kroppar[k] = r;
}
for (const [k, v] of Object.entries(gammal.modell)) {
  const mn = v.bbox.min, mx = v.bbox.max, a = v.a;
  if (k === "drake" || k === "häst") continue;
  const ank = {};
  for (const n of NAMN) {
    if (n === "ogonR") continue;
    const f = [0, 1, 2].map((i) => r4((a[n][i] - mn[i]) / (mx[i] - mn[i])));
    if (SPEGLA.has(k)) f[2] = r4(1 - f[2]);
    ank[n] = f;
  }
  // mun och ansikte: gamla koden hade fågel/uggla-munnen vid min.z (bakre ändan). Framsidan är alltid +z.
  ank.mun = [0.5, 0.5, 1];
  // Kycklingens hjässa: max.y + 0,02 (konstant i gamla koden), inte en bråkdel.
  if (k === "fågel" || k === "uggla") ank.rygg = [0.5, 0.55, 0.3];
  if (k === "fågel" || k === "uggla") ank.huvudTopp = { f: [0.5, 1, ank.huvudTopp[2]], d: [0, 0.02, 0] };
  delete ank.ogonR;
  ank.ogonL = [0.34, ank.ansikte[1], ank.ansikte[2]];
  ank.ogonR = [0.66, ank.ansikte[1], ank.ansikte[2]];
  kroppar[k].modell = { nod: "body", ref: "bbox", matt: { bredd: { hojd: k === "fågel" || k === "uggla" ? 0.55 : 0.9 } }, ankare: ank };
}
kroppar["groda"].modell.nod = "body";
kroppar["drake"].modell = {
  nod: "rot", ref: "ben", ben: "Head", matt: { bredd: { hojd: 0.95, tak: 0.85 } },
  ankare: { huvudTopp: { d: [0, 0.42, 0.1] }, ansikte: { d: [0, 0.16, 0.28] }, ogonL: { d: [-0.12, 0.16, 0.28] }, ogonR: { d: [0.12, 0.16, 0.28] }, mun: { d: [0, 0.02, 0.42] }, hals: { d: [0, -0.06, 0.1] }, rygg: { d: [0, -0.12, -0.5] } },
};
kroppar["häst"].modell = {
  nod: "rot", ref: "ben", ben: "Head", matt: { bredd: { hojd: 0.95, tak: 0.55 } },
  ankare: { huvudTopp: { d: [0, 0.48, 0.02] }, ansikte: { d: [0, 0.22, 0.22] }, ogonL: { d: [-0.08, 0.22, 0.22] }, ogonR: { d: [0.08, 0.22, 0.22] }, mun: { d: [0, 0.08, 0.34] }, hals: { d: [0, -0.06, 0.1] }, rygg: { d: [0, -0.02, -0.4] } },
};
// Skalfaktorer och platsgrenar per djur: ordagrant ur skalaFor / pannaPlats / mantelPlats / platsFor i tillbehorFaste.ts.
const HORN_FISK = { ankare: "huvudTopp", upp: { hojd: 0.1, min: 0.04 }, fram: { bredd: 0.22, min: 0.05 } };
const HORN_LYFT = (y, steg, min) => ({ ankare: "ansikte", mot: { ankare: "huvudTopp", y }, fram: { bredd: steg, min } });
const MANTEL_RYGG = { ankare: "hals", mot: { ankare: "rygg", t: 0.4 } };
const HORN_PANNA = { ankare: "huvudTopp", mot: { ankare: "ansikte", t: 0.4 } };
const MANTEL_LAGRE = { ankare: "hals", mot: { ankare: "huvudTopp", t: 0.1 }, fram: { bredd: 0.14, min: 0.04, tecken: -1 } };
const OV = {
  ekorre: { krona: { faktor: 1.12 }, horn: { faktor: Math.round(1.12 * 0.78 * 1e4) / 1e4 } },
  drake: { krona: { faktor: 1.12 }, ryggsäck: { faktor: 0.9 }, mantel: { faktor: 1.2, plats: MANTEL_RYGG }, horn: { faktor: Math.round(1.12 * 0.78 * 1e4) / 1e4, plats: HORN_LYFT(0.38, 0.28, 0.1) } },
  häst: { mantel: { plats: MANTEL_RYGG } },
  groda: { rosett: { faktor: 1.4 }, ryggsäck: { faktor: 1.25 }, mantel: { faktor: 1.45 }, horn: { faktor: 1.52 } },
  fisk: { rosett: { faktor: 1.4 }, ryggsäck: { faktor: 1.25 }, mantel: { faktor: 1.45 }, horn: { faktor: 1.52, plats: HORN_FISK } },
  haj: { horn: { faktor: 1.52, plats: HORN_FISK } },
  fågel: { ryggsäck: { faktor: 1.25 }, horn: { faktor: 1.52, plats: HORN_PANNA } },
  uggla: { ryggsäck: { faktor: 1.25 }, horn: { faktor: 1.52, plats: HORN_PANNA } },
  kanin: { horn: { plats: HORN_PANNA }, mantel: { faktor: 0.85, plats: MANTEL_LAGRE } },
  hund: { horn: { plats: HORN_PANNA } },
  katt: { horn: { plats: HORN_PANNA }, mantel: { faktor: 0.85, plats: MANTEL_LAGRE }, rosett: { plats: { ankare: "ansikte", ut: { bredd: 0.24, abs: -0.03, min: 0.04 }, upp: { hojd: 0.05, min: 0.02 } } } },
};
for (const [k, o] of Object.entries(OV)) kroppar[k].overstyr = o;
const fil = {
  version: 1,
  kalla: "Härledd ur src/spel/tillbehorFaste.ts (ankareFor, PROC_ANKARE, skalaFor, platsFor) av rundor/R2-tillbehor-som-data/r2-skapa-fastpunkter.mjs. Se RITNING.md avsnitt 3.",
  enheter: "mesh = absoluta vektorer i djurets meshrum (generiska former och effekter). modell.ref=bbox: [fx,fy,fz] = bråkdel av nodens Box3 (x 0,5 = mitten), valfri d = tillägg i enheter. modell.ref=ben: d = offset från benets världsposition. Alla z-värden har djurets framsida mot +z.",
  kroppar,
};
const text = JSON.stringify(fil, null, 1).replace(/\[\s+(-?[\d.eE+-]+(?:,\s+-?[\d.eE+-]+)*)\s+\]/g, (m, inre) => "[" + inre.replace(/\s+/g, " ") + "]");
fs.writeFileSync(UT, text + "\n");
console.log("skrev", UT, Object.keys(kroppar).length, "kroppar");
if (kontroll) {
  const lika = fs.readFileSync(UT, "utf8") === fs.readFileSync(MAL, "utf8");
  console.log(lika ? "KONTROLL OK: data/fastpunkter.json är exakt vad skriptet ger" : "KONTROLL RÖD: data/fastpunkter.json avviker från skriptet (handändrad?)");
  process.exitCode = lika ? 0 : 1;
}
