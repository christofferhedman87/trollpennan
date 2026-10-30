// Nya Skapa: text → ordbrickor i barnets ordning. Varje bricka får frågan den svarar på (färg och form i remsan),
// guld om barnet skrev ordet själv, och böjningshjälp om ett skrivet ord har fel form ("ett stor hus").
import { arFrasStart, arSmaord, formFrasVid, slaUpp, type Fraga, type Genus, type Kalla, type Sammanhang, type Slot, type Uppslag } from "./lexikon.ts";
import type { MOrd, OrdKalla } from "./mening.ts";

export type BrickKlass = Fraga | "smaord" | "agg" | "fraga" | "vantar";

export type Bricka = {
  /** Det som står i remsan (flera ord för "sprutar eld"). */
  t: string;
  /** Första ordets plats i listan med färdiga ord, och antal ord. */
  i: number;
  n: number;
  klass: BrickKlass;
  kalla: OrdKalla;
  id?: string;
  /** Var ordet finns: ord.json, byggord, del, material eller egenskap. */
  lex?: Kalla;
  slot?: Slot;
  genus?: Genus;
  bas?: boolean;
  bojning?: { en: string; ett: string };
  guld: boolean;
  /** Rätt form när barnet skrivit fel form ("stort" i "ett stor hus"). */
  boj?: string;
};

const ARTIKLAR = new Set(["en", "ett"]);
const ANTAL = new Set(["två", "tre", "fyra", "fem", "sex", "sju", "åtta", "nio", "tio", "många"]);

export type BrickOpts = {
  /** Ordet som Pennan undrar över ("Menade du …?"). */
  fragaToken?: string | null;
  /** Ord som inte finns i lexikonet men som tolken ändå förstår (sammansättningar). Ger frågan för ordet, eller null. */
  sammansatt?: (w: string) => Fraga | null;
};

export function meningsbrickor(ord: readonly MOrd[], opts: BrickOpts = {}): Bricka[] {
  const forst = las(ord, opts, "djur");
  // Handlar meningen om ett bygge läser vi om den: "som flyger" och "flygande" är då byggets egenskaper.
  return meningTyp(forst) === "bygg" ? las(ord, opts, "bygg") : forst;
}

function las(ord: readonly MOrd[], opts: BrickOpts, typ: "djur" | "bygg"): Bricka[] {
  const tokens = ord.map((o) => o.t.toLocaleLowerCase("sv"));
  const ut: Bricka[] = [];
  let ctx: Sammanhang = "fri";
  let efterNamn = false;
  for (let i = 0; i < tokens.length; ) {
    const w = tokens[i]!;
    const kalla = ord[i]!.k;
    const smaord = (n = 1): void => {
      ut.push({ t: ord.slice(i, i + n).map((o) => o.t).join(" "), i, n, klass: "smaord", kalla, guld: false });
      i += n;
    };
    if (efterNamn) {
      efterNamn = false;
      smaord();
      continue;
    }
    if (w === "heter" || w === "kallas") {
      efterNamn = true;
      smaord();
      continue;
    }
    const form = formFrasVid(tokens, i);
    if (form) {
      ctx = "form";
      for (let n = 0; n < form; n++) smaord();
      continue;
    }
    if (w === "med") { ctx = "med"; smaord(); continue; }
    if (w === "av") { ctx = "av"; smaord(); continue; }
    if (w === "som" || w === "kan") { ctx = "som"; smaord(); continue; }
    if (w === "och" || ARTIKLAR.has(w) || ANTAL.has(w)) { smaord(); continue; }
    const u: Uppslag | null = slaUpp(tokens, i, ctx, typ);
    if (u) {
      const n = Math.max(1, u.n);
      const allaSkrivna = ord.slice(i, i + n).every((o) => o.k === "skriv");
      ut.push({
        t: ord.slice(i, i + n).map((o) => o.t).join(" "),
        i,
        n,
        klass: u.fraga,
        kalla,
        id: u.id,
        lex: u.kalla,
        slot: u.slot,
        ...(u.genus ? { genus: u.genus } : {}),
        ...(u.bas != null ? { bas: u.bas } : {}),
        ...(u.bojning ? { bojning: u.bojning } : {}),
        guld: allaSkrivna,
      });
      i += n;
      continue;
    }
    if (arSmaord(w)) { smaord(); continue; }
    if (opts.fragaToken && w === opts.fragaToken.toLocaleLowerCase("sv")) {
      ut.push({ t: ord[i]!.t, i, n: 1, klass: "fraga", kalla, guld: false });
      i++;
      continue;
    }
    if (i === tokens.length - 1 && arFrasStart(w)) {
      // "sprutar" väntar på "eld": ordet är inte klart än.
      ut.push({ t: ord[i]!.t, i, n: 1, klass: "vantar", kalla, guld: false });
      i++;
      continue;
    }
    const s = opts.sammansatt?.(w) ?? null;
    ut.push({ t: ord[i]!.t, i, n: 1, klass: s ?? "agg", kalla, guld: !!s && kalla === "skriv", ...(s === "vad" ? { slot: "vad" as const } : {}) });
    i++;
  }
  markeraBojning(ut, tokens);
  return ut;
}

/** Substantivet som ett adjektiv eller en artikel på plats b hör till: nästa Vad (eller form), om bara
 *  adjektiv står emellan. */
export function huvudord(brickor: readonly Bricka[], b: number): Bricka | null {
  for (let j = b + 1; j < brickor.length; j++) {
    const x = brickor[j]!;
    if (x.slot === "vad" || x.slot === "form") return x;
    if (x.klass === "hurdan" && x.slot !== "material") continue;
    if (x.klass === "smaord" && /^(jätte|super|pytte|mini)$/.test(x.t.toLocaleLowerCase("sv"))) continue;
    return null;
  }
  return null;
}

/** 7.2: ord som barnet skrivit böjs aldrig tyst. Fel form ger en bubbla med rätt form. */
function markeraBojning(brickor: Bricka[], tokens: string[]): void {
  for (let b = 0; b < brickor.length; b++) {
    const x = brickor[b]!;
    if (x.kalla !== "skriv") continue;
    const w = x.t.toLocaleLowerCase("sv");
    const artikel = x.klass === "smaord" && ARTIKLAR.has(w);
    if (!artikel && !(x.klass === "hurdan" && x.bojning)) continue;
    const h = huvudord(brickor, b);
    if (!h?.genus || h.bas === false) continue;
    // "två stora hus": plural, ingen kontroll.
    if (tokens.slice(0, x.i).some((t) => ANTAL.has(t))) continue;
    if (artikel) {
      if (w !== h.genus) x.boj = h.genus;
      continue;
    }
    const ratt = x.bojning![h.genus];
    if (w !== ratt && (w === x.bojning!.en || w === x.bojning!.ett)) x.boj = ratt;
  }
}

/** Pennan är redo när meningen har ett Vad och inget ord väntar på svar. */
export function harVad(brickor: readonly Bricka[]): boolean {
  return brickor.some((b) => b.slot === "vad" || (b.klass === "vad" && b.slot !== "form"));
}

export function oppenFraga(brickor: readonly Bricka[]): boolean {
  return brickor.some((b) => b.klass === "fraga");
}

/** Meningens genus (efter första Vad), för att visa adjektivkort i rätt form ("rött" om det står "ett hus"). */
export function meningGenus(brickor: readonly Bricka[]): Genus {
  return brickor.find((b) => b.slot === "vad")?.genus ?? "en";
}

/** Typen avgör vilka hylldelar Ordhjälpen visar: djur eller bygge. */
export function meningTyp(brickor: readonly Bricka[]): "djur" | "bygg" {
  return brickor.find((b) => b.slot === "vad")?.lex === "bygg" ? "bygg" : "djur";
}
