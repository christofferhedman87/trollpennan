// TTS-1/TTS-2: uppslag i det förgenererade röstljudet. Spelet bundlar bara data/rost-klient.json (skrivs av
// scripts/rost-generera.mjs: nyckel → [fil, ms], mallar, intro, reserv) – inte texterna, talarna eller data/rost.json.
// Rent och utan DOM, så att det går att testa i node. Uppspelningen finns i rost.ts.
import klientJson from "../../data/rost-klient.json" with { type: "json" };

export type RostRad = { f: string; fil: string; ms: number };
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
  return r ? { f: `/ljud/rost/${r[0]}.mp3`, fil: `/ljud/rost/${r[0]}.mp3`, ms: r[1] } : null;
}

/** NFC och ett mellanslag som generatorn, plus ledande emoji/listsymboler bort (`+` behålls) och ihopslagna dubbelpunkter. */
export function normalisera(t: string): string {
  return t
    .normalize("NFC")
    .replace(/^(?:[\s\p{Emoji_Presentation}\p{Extended_Pictographic}★☆•▸▶]|\uFE0F|\u200D)+/gu, "")
    .replace(/\s+/g, " ")
    .replace(/([.!?])\.+(?=\s|$)/g, "$1")
    .trim();
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

/** Första bokstaven efter meningsstart tillbaka till gemen, så "Ett hus" träffar "ett hus". */
function sankMeningsStart(s: string): string {
  return s.replace(/^([A-ZÅÄÖ])/, (m) => m.toLowerCase());
}

/** Befintlig djurneutral röst när kanin-fryser läses med ett annat djur. Inga nya mp3. */
function kaninFryserNeutral(n: string): string {
  if (/^Det verkar som att din (?!kanin\b).+ fryser\. Se om du kan skriva fram något som värmer\.$/i.test(n)) {
    return "Brr, ditt djur huttrar! Kan du hjälpa det så att det slutar frysa?";
  }
  if (/^Ahh, så skönt! Nu är (?!kaninen\b).+ varm igen\. Tack för hjälpen!$/i.test(n)) {
    return "Så skönt, nu slutar tänderna spela trumma!";
  }
  return n;
}

function rostForNormaliserad(text: string): RostRad | null {
  const n = kaninFryserNeutral(normalisera(text));
  const hel = rad(nyckel(n));
  if (hel) return hel;
  if (n.includes("Doktor Bengtsson")) {
    const alt = rad(nyckel(n.replaceAll("Doktor Bengtsson", "Bengtsson"))); if (alt) return alt;
  }
  const lag = sankMeningsStart(n);
  if (lag !== n) {
    const lagRad = rad(nyckel(lag));
    if (lagRad) return lagRad;
  }
  // "en kanin med mössa." ligger med punkt så att mallen inte äter hela värdet.
  if (!/[.!?]$/.test(n)) {
    const medPunkt = rad(nyckel(`${n}.`)) ?? (lag !== n ? rad(nyckel(`${lag}.`)) : null);
    if (medPunkt) return medPunkt;
  }
  return null;
}

/** Filen för en text som visas. Exakt träff, annars delen efter första ": " (t.ex. "Nytt uppdrag från Doktor Bengtsson: …"). */
export function rostFor(text: string): RostRad | null {
  const hel = rostForNormaliserad(text);
  if (hel) return hel;
  const i = text.indexOf(": ");
  return i > 0 ? rostForNormaliserad(text.slice(i + 2)) : null;
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
/** Hela värdet som fil, eller uppdelat i kända bitar. Längre prefix först, men backa om resten inte går. */
function ordSekvens(text: string): { f: string; ms: number }[] | null {
  const ord = text.split(" ");
  const sok = (i: number): { f: string; ms: number }[] | null => {
    if (i >= ord.length) return [];
    for (let j = ord.length; j > i; j--) {
      if (i === 0 && j === ord.length) continue;
      const r = rad(nyckel(ord.slice(i, j).join(" ")));
      if (!r) continue;
      const rest = sok(j);
      if (rest) return [r, ...rest];
    }
    return null;
  };
  const ut = sok(0);
  return ut && ut.length > 1 ? ut : null;
}

/** Dela på " och " / " med " när hela värdet inte är en fil ("Ett rött hus" + "blir det."). */
function delaLed(text: string): { f: string; ms: number }[] | null {
  const bitar = text.split(/ och | med /);
  if (bitar.length < 2) return null;
  const ut: { f: string; ms: number }[] = [];
  for (const bit of bitar) {
    const hel = rad(nyckel(bit));
    if (hel) {
      ut.push(hel);
      continue;
    }
    const sek = ordSekvens(bit);
    if (!sek) return null;
    ut.push(...sek);
  }
  return ut.length > 1 ? ut : null;
}

/** Ett värde i en mall som filer: hela värdet, eller helt uppdelat i kända värden ("en kanin" + "med mössa"), annars null. */
function vardeDelar(varde: string): { f: string; ms: number }[] | null {
  const hel = rad(nyckel(varde));
  if (hel) return [hel];
  const sek = ordSekvens(varde);
  if (sek) return sek;
  const n = normalisera(varde);
  const lag = sankMeningsStart(n);
  if (lag !== n) {
    const r = rad(nyckel(lag));
    if (r) return [r];
    const lagSek = ordSekvens(lag) ?? delaLed(lag);
    if (lagSek) return lagSek;
  }
  return delaLed(n);
}
function ettPlan(text: string): RostPlan | null {
  const hel = rostForNormaliserad(text);
  if (hel) return { delar: [hel], ms: hel.ms, dynamisk: false };
  const t = kaninFryserNeutral(normalisera(text));
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
  const fria = vardeDelar(t);
  if (fria && fria.length > 0) {
    return { delar: fria, ms: fria.reduce((s, d) => s + d.ms, 0), dynamisk: false };
  }
  return null;
}

/** Stavelseledtråden visas med understreck. Rösten ska läsa den fasta meningen, inte råa streck. */
function lasbarLedtrad(text: string): string | null {
  if (!/_|1 delar/u.test(text)) return null;
  const alt = text
    .replace(/:\s*[^.!?]*_+[^.!?]*[.!?]?/gu, ".")
    .replace(/\b1 delar\b/gu, "1 del")
    .replace(/([.!?])\.+(?=\s|$)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
  return alt === text ? null : alt;
}

function planera(text: string): RostPlan | null {
  const hel = ettPlan(text);
  const i = text.indexOf(": ");
  let plan = hel ?? (i > 0 ? ettPlan(text.slice(i + 2)) : null);
  if (!plan) {
    const bitar = normalisera(text).split(/(?<=[.!?])\s+/).filter(Boolean);
    if (bitar.length >= 2) {
      const planer = bitar.map((b) => ettPlan(b));
      if (planer.every((p) => p !== null)) {
        const klara = planer as RostPlan[];
        plan = {
          delar: klara.flatMap((p) => p.delar),
          ms: klara.reduce((s, p) => s + p.ms, 0),
          dynamisk: klara.some((p) => p.dynamisk),
        };
      }
    }
  }
  if (!plan) return null;
  Object.assign(plan.delar, { length: plan.delar.length, 0: plan.delar[0] });
  return Object.assign(plan, { length: plan.delar.length, 0: plan.delar[0] });
}

/** TTS-2: hur en text som visas läses: en fil, en mall (fasta delar + värden/barnets ord), eller null (ingen fil). Delen efter första ": " prövas också. */
export function rostPlan(text: string): RostPlan | null {
  const direkt = planera(text);
  if (direkt) return direkt;
  const alt = lasbarLedtrad(text);
  return alt ? planera(alt) : null;
}
