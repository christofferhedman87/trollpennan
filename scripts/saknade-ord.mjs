#!/usr/bin/env node
// Saknade ord (R3B): en vuxen exporterar listan ur spelet (För vuxna → Ord utan modell → Spara fil), och den här
// rutinen slår ihop exporterna i data/saknade-ord.json och gör beställningsfilen till Modellspanaren.
// Inget skickas automatiskt någonstans; allt här körs för hand och läser bara filer.
//
//   node scripts/saknade-ord.mjs lagg  <saknade-ord.json …>   slå ihop exporter i data/saknade-ord.json
//   node scripts/saknade-ord.mjs bestall [--ut BESTALLNING.md] [--datum 2026-10-18] [--min 1]   skriv beställningsfilen
//   node scripts/saknade-ord.mjs status                        kort översikt
//   node scripts/saknade-ord.mjs bort <ord …>                  ta bort ord (t.ex. ett namn ett barn skrivit)
//   node scripts/saknade-ord.mjs bestalld <ord …> | ignorera <ord …>   sätt status (täckt blir ett ord av sig självt när det får en djurrad i data/entiteter.json)
//
// Integritet: filen innehåller bara ord, grundord, kategori, antal och datum. Aldrig meningar, djur eller något om barnet.
// Ett barn kan ha skrivit ett namn: titta igenom listan innan den delas (kommandot `bort` tar bort rader).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FIL = path.join(rot, "data", "saknade-ord.json");
const STATUS = ["ny", "bestalld", "ignorerad"];
const KATEGORI_TYP = {
  okant: "okänt (avgör efter ordet)",
  djur: "djur",
  mat: "mat",
  foremal: "föremål",
  vaxt: "växt",
  byggnad: "byggnad",
  person: "person/figur",
  kansla: "känsla (kräver en bild som visar den, t.ex. figur eller symbol)",
  natur: "natur/landskap",
  handling: "handling (kräver ett föremål som hör till, t.ex. boll, cykel)",
  egenskap: "egenskap (bara om ordet är ett föremål; annars hanteras det av färg/storlek)",
};

export const arOrd = (x) =>
  !!x &&
  typeof x.ord === "string" &&
  /^[a-zåäö]{2,24}$/.test(x.ord) &&
  (x.grund === null || x.grund === undefined || (typeof x.grund === "string" && /^[a-zåäö]{2,24}$/.test(x.grund))) &&
  typeof x.kategori === "string" &&
  /^[a-z]{2,16}$/.test(x.kategori) &&
  Number.isFinite(x.antal) &&
  x.antal >= 1 &&
  /^\d{4}-\d{2}-\d{2}$/.test(x.forst) &&
  /^\d{4}-\d{2}-\d{2}$/.test(x.sist);

/** Slår ihop rader: antal summeras, förstadatum är det tidigaste, sista det senaste, status behålls. */
export function sammanfoga(...listor) {
  const per = new Map();
  for (const l of listor) {
    for (const s of l) {
      const f = per.get(s.ord);
      if (!f) per.set(s.ord, { ord: s.ord, grund: s.grund ?? null, kategori: s.kategori, antal: s.antal, forst: s.forst, sist: s.sist, status: s.status ?? "ny" });
      else {
        f.antal += s.antal;
        f.forst = s.forst < f.forst ? s.forst : f.forst;
        f.sist = s.sist > f.sist ? s.sist : f.sist;
        f.grund = f.grund ?? s.grund ?? null;
        if (f.kategori === "okant" && s.kategori !== "okant") f.kategori = s.kategori;
        if (s.status && s.status !== "ny") f.status = s.status;
      }
    }
  }
  return [...per.values()].sort((a, b) => b.antal - a.antal || a.ord.localeCompare(b.ord, "sv"));
}

/** Läser en export från spelet ({version, exporterad, ord:[…]}). Returnerar {ok, avvisade}. */
export function lasExport(text, spärrade = new Set()) {
  const j = JSON.parse(text);
  const rader = Array.isArray(j) ? j : Array.isArray(j.ord) ? j.ord : [];
  const ok = [];
  const avvisade = [];
  for (const r of rader) {
    if (!arOrd(r)) avvisade.push({ ord: String(r?.ord ?? "?"), skal: "fel format" });
    else if (spärrade.has(r.ord)) avvisade.push({ ord: r.ord, skal: "spärrat ord" });
    else ok.push({ ord: r.ord, grund: r.grund ?? null, kategori: r.kategori, antal: Math.floor(r.antal), forst: r.forst, sist: r.sist });
  }
  return { ok, avvisade };
}

/** Ord som redan har en modell: djuren i entiteter.json (nyckel och ord-fält). Hus, föremål och natur räknas inte: de blir ändå ägg tills en runda ritar dem. */
export function taktaOrd(entiteterJson) {
  const s = new Set();
  const e = entiteterJson?.entiteter ?? {};
  for (const [id, rad] of Object.entries(e)) {
    if (rad?.typ !== "djur") continue;
    s.add(id);
    for (const o of [].concat(rad?.ord ?? [])) s.add(String(o));
  }
  return s;
}

export function spärradeOrd(blocklistJson) {
  const s = new Set();
  for (const o of blocklistJson?.ord ?? []) s.add(String(o).toLowerCase());
  return s;
}

const kort = (n) => (n >= 1000 ? `${(n / 1000).toFixed(1).replace(".", ",")} k` : String(n));

/** Beställningsfilen: en tabell per prioritet, sorterad på antal. Vad som redan är täckt eller ignorerat tas bort. */
export function bestallning(lista, { datum, takta = new Set(), min = 1 } = {}) {
  // Böjda former räknas ihop under grundordet (pizzor + pizza → pizza), så att Modellspanaren ser ett ord i stället för flera.
  const grupper = new Map();
  for (const s of lista) {
    const nyckel = s.grund ?? s.ord;
    const g = grupper.get(nyckel) ?? { ord: nyckel, former: [], grund: s.grund, kategori: s.kategori, antal: 0, forst: s.forst, sist: s.sist, status: "ny", ignorerad: true, takta: false };
    g.former.push(s.ord);
    g.antal += s.antal;
    g.forst = s.forst < g.forst ? s.forst : g.forst;
    g.sist = s.sist > g.sist ? s.sist : g.sist;
    if (g.kategori === "okant" && s.kategori !== "okant") g.kategori = s.kategori;
    if (s.status === "bestalld") g.status = "bestalld";
    if (s.status !== "ignorerad") g.ignorerad = false;
    if (takta.has(s.ord) || takta.has(nyckel)) g.takta = true;
    grupper.set(nyckel, g);
  }
  const alla = [...grupper.values()].sort((a, b) => b.antal - a.antal || a.ord.localeCompare(b.ord, "sv"));
  const aktiva = alla.filter((g) => !g.ignorerad && !g.takta && g.antal >= min);
  const tackta = alla.filter((g) => g.takta);
  const rad = (s, i) =>
    `| ${i + 1} | **${s.ord}** | ${s.former.filter((f) => f !== s.ord).join(", ") || "–"} | ${KATEGORI_TYP[s.kategori] ?? s.kategori} | ${kort(s.antal)} | ${s.forst} | ${s.sist} | ${s.status === "bestalld" ? "beställd" : "ny"} |`;
  const ut = [];
  ut.push("# Beställning till Modellspanaren – ord som saknar modell");
  ut.push("");
  ut.push(`Genererad ${datum} av \`node scripts/saknade-ord.mjs bestall\` ur \`data/saknade-ord.json\`. Orden kommer från vuxna som exporterat sin lista ur spelet för hand; inget skickas automatiskt.`);
  ut.push("");
  ut.push("När ett ord saknar modell visas ett ägg med ordet på. Varje rad nedan är ett ord som barn har skrivit och fått ett ägg på. Hitta en modell så blir ägget ett riktigt djur eller föremål i nästa uppdatering.");
  ut.push("");
  ut.push("## Regler (samma som för batch 1)");
  ut.push("- Bara **CC0-1.0**. Inget med CC-BY eller annan kredit-licens. Skriv källa, licens-URL och författare i manifestet som förut.");
  ut.push("- GLB, självbärande (inga externa texturer), stil nära Quaternius/Kenney/KayKit (rund, tydlig, få trianglar). Högst 6 000 trianglar. Avvikande stil går bra men märk den.");
  ut.push("- **Bredd före varianter:** en modell per ord räcker. Hellre ett nytt ord än en ny stil på ett som finns.");
  ut.push("- Ange tydlig framsida (ja/nej/osäker) och föreslaget svenskt ord/kategori i manifestet (samma kolumner som `manifest-utkast.tsv`).");
  ut.push("- Ord som ser ut som ett namn eller är olämpliga: hoppa över och skriv det under *Hoppade över*.");
  ut.push("");
  ut.push(`## Ord att hitta modell till (${aktiva.length})`);
  ut.push("");
  if (!aktiva.length) {
    ut.push("*Inga ord ännu.* Listan fylls när vuxna exporterar ur spelet (För vuxna → Ord utan modell → Spara fil) och `lagg` körs.");
  } else {
    ut.push("| # | ord (grundord) | böjda former sedda | typ (gissad) | gånger sett | först | senast | status |");
    ut.push("|---|---|---|---|---|---|---|---|");
    aktiva.forEach((s, i) => ut.push(rad(s, i)));
  }
  ut.push("");
  ut.push("*Typ* är spelets gissning ur ordet (kategori i `data/reserv.json`); den kan vara fel. Böjda former räknas ihop under grundordet när spelet kunde avgöra det.");
  if (tackta.length) {
    ut.push("");
    ut.push(`## Redan täckta (${tackta.length}, behöver inget)`);
    ut.push("");
    ut.push(tackta.map((s) => s.ord).join(", "));
  }
  ut.push("");
  ut.push("## Hoppade över");
  ut.push("");
  ut.push("*(Modellspanaren fyller i: ord, skäl.)*");
  ut.push("");
  return ut.join("\n");
}

const lasJson = (f, d) => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : d);
const skriv = (f, o) => fs.writeFileSync(f, JSON.stringify(o, null, 1) + "\n");
const nytt = () => ({
  version: 1,
  _om: "Ord som blev ägg i spelet (saknar modell). Fylls för hand med `node scripts/saknade-ord.mjs lagg <export>`; inget lämnar spelet automatiskt. Bara ord, grundord, kategori, antal och datum; aldrig meningar eller något om barnet.",
  ord: [],
});

function main(argv) {
  const [kmd, ...rest] = argv;
  const data = lasJson(FIL, nytt());
  const flagga = (n, d) => {
    const i = rest.indexOf(`--${n}`);
    return i >= 0 ? rest[i + 1] : d;
  };
  const utanFlaggor = rest.filter((a, i) => !a.startsWith("--") && !(i > 0 && rest[i - 1].startsWith("--")));
  const spärr = spärradeOrd(lasJson(path.join(rot, "data", "blocklist.json"), {}));
  const takta = taktaOrd(lasJson(path.join(rot, "data", "entiteter.json"), {}));
  if (kmd === "lagg") {
    if (!utanFlaggor.length) throw new Error("ange en eller flera exportfiler");
    const nya = [];
    const avvisade = [];
    for (const f of utanFlaggor) {
      const r = lasExport(fs.readFileSync(f, "utf8"), spärr);
      nya.push(r.ok);
      avvisade.push(...r.avvisade);
    }
    const f = sammanfoga(data.ord, ...nya);
    skriv(FIL, { ...data, ord: f });
    console.log(`lade ihop ${utanFlaggor.length} fil(er): ${f.length} ord totalt, ${avvisade.length} avvisade${avvisade.length ? " (" + avvisade.map((a) => `${a.ord}: ${a.skal}`).join(", ") + ")" : ""}`);
    console.log("Titta igenom listan innan den delas: ett barn kan ha skrivit ett namn. Ta bort rader med `bort <ord>`.");
  } else if (kmd === "bestall") {
    const datum = flagga("datum", new Date().toISOString().slice(0, 10));
    const ut = path.resolve(flagga("ut", path.join(rot, "BESTALLNING.md")));
    fs.writeFileSync(ut, bestallning(data.ord, { datum, takta, min: Number(flagga("min", "1")) }));
    console.log("skrev", ut);
  } else if (kmd === "status") {
    const ny = data.ord.filter((s) => s.status !== "ignorerad" && !takta.has(s.ord));
    console.log(JSON.stringify({ ord: data.ord.length, att_hitta_modell_till: ny.length, tackta: data.ord.filter((s) => takta.has(s.ord)).length, ignorerade: data.ord.filter((s) => s.status === "ignorerad").length, topp: ny.slice(0, 10).map((s) => `${s.ord} ×${s.antal}`) }, null, 1));
  } else if (kmd === "bort") {
    const ut = new Set(utanFlaggor);
    skriv(FIL, { ...data, ord: data.ord.filter((s) => !ut.has(s.ord)) });
    console.log("tog bort", [...ut].join(", "));
  } else if (["bestalld", "ignorera"].includes(kmd)) {
    const sätt = kmd === "bestalld" ? "bestalld" : "ignorerad";
    const v = new Set(utanFlaggor);
    skriv(FIL, { ...data, ord: data.ord.map((s) => (v.has(s.ord) ? { ...s, status: sätt } : s)) });
    console.log(`satte ${sätt}:`, [...v].join(", "));
  } else {
    console.log("Användning: lagg <export…> | bestall [--ut fil] [--datum d] [--min n] | status | bort <ord…> | bestalld <ord…> | ignorera <ord…>");
    process.exitCode = kmd ? 1 : 0;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main(process.argv.slice(2));
export { STATUS, KATEGORI_TYP };
