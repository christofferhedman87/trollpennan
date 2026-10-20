// TTS-1/TTS-2: uppslag i det förgenererade röstljudet. Spelet bundlar bara data/rost-klient.json (skrivs av
// scripts/rost-generera.mjs: nyckel → [fil, ms], mallar, intro, reserv) – inte texterna, talarna eller data/rost.json.
// Rent och utan DOM, så att det går att testa i node. Uppspelningen finns i rost.ts.
import klientJson from "../../data/rost-klient.json" with { type: "json" };

export type RostRad = { f: string; ms: number };
export type RostIntro = { f: string; ms: number; fran: number[]; langd: number };
type Klient = { reserv: string; dynamisk: string; intro: RostIntro | null; mallar: string[]; rader: Record<string, [string, number]> };

const K = klientJson as unknown as Klient;
/** Fasta texter utan fil: 'tyst' (TTS-2, de genereras i stället) eller 'webblasare' (telefonens svenska röst). */
export const RESERV: "webblasare" | "tyst" = K.reserv === "tyst" ? "tyst" : "webblasare";
/** Barnets egna ord i en mall: 'webblasare' = telefonens svenska röst för just det ordet, annars läses meningen inte. */
export const DYNAMISK: "webblasare" | "tyst" = K.dynamisk === "tyst" ? "tyst" : "webblasare";
/** Antal texter med fil (för prov och tester). */
export const ANTAL_RADER = Object.keys(K.rader).length;

function rad(k: string): RostRad | null {
  const r = K.rader[k];
  return r ? { f: `/ljud/rost/${r[0]}.mp3`, ms: r[1] } : null;
}

/** Samma som scripts/rost-generera.mjs: NFC, ett mellanslag, trimmad. */
export function normalisera(t: string): string {
  return t.normalize("NFC").replace(/\s+/g, " ").trim();
}

/** FNV-1a 32 bit över UTF-16, 8 hex-tecken (samma som generatorn). */
export function nyckel(t: string): string {
  const s = normalisera(t);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

/** Filen för en text som visas. Exakt träff, annars delen efter första ": " (t.ex. "Nytt uppdrag från Doktor Bengtsson: …"). */
export function rostFor(text: string): RostRad | null {
  const hel = rad(nyckel(text));
  if (hel) return hel;
  const i = text.indexOf(": ");
  return i > 0 ? rad(nyckel(text.slice(i + 2))) : null;
}

/** Introts röstfil med scenernas starttider, eller null (då gäller data/intro.json och saga.mp3). */
export function rostIntro(antalScener: number): RostIntro | null {
  const I = K.intro;
  return I && I.fran.length === antalScener ? I : null;
}

/** TTS-2: en del att spela – en fil, eller barnets eget ord (dynamisk text, telefonens röst). */
export type RostDel = { f: string; ms: number } | { dynamisk: string };
export type RostPlan = { delar: RostDel[]; ms: number; dynamisk: boolean };

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** Mallens fasta del som den läses (samma som generatorns mallDel): ledande skiljetecken bort, bara skiljetecken = ingenting. */
export function mallDel(t: string): string {
  const s = normalisera(t.replace(/^[\s\p{P}\p{S}]+/u, ""));
  return /\p{L}/u.test(s) ? s : "";
}
type Mall = { re: RegExp; delar: string[] };
let MALLAR: Mall[] | null = null;
function mallar(): Mall[] {
  if (MALLAR) return MALLAR;
  MALLAR = K.mallar.map((m) => {
    const delar = m.split(/(\{\w+\})/);
    const re = new RegExp(`^${delar.map((d) => (/^\{\w+\}$/.test(d) ? "(.+?)" : esc(d))).join("")}$`, "u");
    return { re, delar };
  });
  return MALLAR;
}
/** Ett värde i en mall som filer: hela värdet, eller helt uppdelat i kända värden ("en kanin" + "med mössa"), annars null. */
function vardeDelar(varde: string): { f: string; ms: number }[] | null {
  const hel = rad(nyckel(varde));
  if (hel) return [hel];
  const ord = varde.split(" ");
  const ut: { f: string; ms: number }[] = [];
  for (let i = 0; i < ord.length; ) {
    let j = ord.length;
    for (; j > i; j--) {
      const r = rad(nyckel(ord.slice(i, j).join(" ")));
      if (r && !(i === 0 && j === ord.length)) {
        ut.push(r);
        break;
      }
    }
    if (j === i) return null;
    i = j;
  }
  return ut.length > 1 ? ut : null;
}
function ettPlan(text: string): RostPlan | null {
  const hel = rad(nyckel(text));
  if (hel) return { delar: [hel], ms: hel.ms, dynamisk: false };
  const t = normalisera(text);
  for (const mall of mallar()) {
    const m = mall.re.exec(t);
    if (!m) continue;
    const delar: RostDel[] = [];
    let ms = 0;
    let dynamisk = false;
    let n = 1;
    for (const d of mall.delar) {
      if (/^\{\w+\}$/.test(d)) {
        const varde = normalisera(m[n++] ?? "");
        const v = vardeDelar(varde);
        if (v) {
          delar.push(...v);
          ms += v.reduce((s, d) => s + d.ms, 0);
        } else if (varde) {
          delar.push({ dynamisk: varde });
          ms += 80 * varde.length;
          dynamisk = true;
        }
        continue;
      }
      const fast = mallDel(d);
      if (!fast) continue;
      const r = rad(nyckel(fast));
      if (!r) return null;
      delar.push({ f: r.f, ms: r.ms });
      ms += r.ms;
    }
    return { delar, ms, dynamisk };
  }
  return null;
}

/** TTS-2: hur en text som visas läses: en fil, en mall (fasta delar + värden/barnets ord), eller null (ingen fil). Delen efter första ": " prövas också. */
export function rostPlan(text: string): RostPlan | null {
  const hel = ettPlan(text);
  if (hel) return hel;
  const i = text.indexOf(": ");
  return i > 0 ? ettPlan(text.slice(i + 2)) : null;
}
