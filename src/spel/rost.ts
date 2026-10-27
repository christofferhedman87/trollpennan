// TTS: förgenererade MP3 via manifestet (hel text eller mall). Dynamisk text och reserv är tyst. Aldrig engelsk röst.
import { useMinne } from "./minne.ts";
import { DYNAMISK, RESERV, normalisera, rostFor, rostPlan, type RostDel } from "./rostManifest.ts";

function rostPa(): boolean {
  const s = useMinne.getState();
  return (s.rostPa ?? true) && s.ljudPa;
}

type Logg = {
  text: string;
  fil: string | null;
  satt: "fil" | "mall" | "reserv" | "tyst" | "saknas" | "struken" | "avbruten";
  delar?: number;
  dynamisk?: boolean;
  klass?: string;
  kalla?: string;
  fodd?: number;
};
/** TTS-3: kön. forst = bannerns röst går före och tonar ut pågående uppläsning (TONA_MS). Avbruten text läses inte om. */
const ko: { text: string; forst: boolean }[] = [];
const engang = new Set<string>();
let nu: HTMLAudioElement | null = null;
let upptagen = false;
let lyssnar = false;
let omgang = 0;
let nuText: string | null = null;
let nuForst = false;
/** element som tonas ut efter ett avbrott – ett tryck (tystna) eller ljudet av stoppar dem direkt */
const tonar = new Set<HTMLAudioElement>();
/** TTS-3-fix: uttoningen när en banner avbryter en guiderad eller pratbubbla (ms). */
export const TONA_MS = 150;

function logg(l: Logg) {
  const w = window as unknown as { __rost?: Logg[] };
  (w.__rost ??= []).push(l);
}

function svenskRost(): SpeechSynthesisVoice | null {
  if (typeof speechSynthesis === "undefined") return null;
  return speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().replace("_", "-").startsWith("sv")) ?? null;
}

function telefon(text: string, sv: SpeechSynthesisVoice, klar: () => void) {
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "sv-SE";
  try {
    u.voice = sv;
  } catch {
    // lang räcker om rösten inte går att sätta
  }
  u.onend = klar;
  u.onerror = klar;
  speechSynthesis.speak(u);
}

function spelaDelar(text: string, delar: RostDel[], _sv: SpeechSynthesisVoice | null) {
  const min = omgang;
  let i = 0;
  const steg = () => {
    if (min !== omgang) return;
    const d = delar[i++];
    if (!d) {
      klocka.klar(text);
      return nasta();
    }
    if ("f" in d) {
      try {
        const a = new Audio(d.f);
        nu = a;
        a.addEventListener("ended", steg);
        a.addEventListener("error", steg);
        a.play().then(
          () => klocka.spelar(text), // play-löftet uppfylls när uppspelningen faktiskt startar
          () => steg(),
        );
      } catch {
        steg();
      }
    } else steg(); // dynamisk del och DYNAMISK "tyst": ingen telefon, nästa del
  };
  steg();
}

/** D7: utrop som redan har 1 MP3 behålls. Annars en sammanhållen ersättning. Ingen telefonröst. */
const SAMMAN: [RegExp, string][] = [
  [/^(?:Guldord!\s+Du skrev .+ alldeles själv!|Guldord!\s+.+\s+[–-]\s+och du stavade helt rätt!|Wow,\s+.+!\s+Ett guldord till boken!)$/iu, "Wow, du har skrivit ett guldord! Du får en stjärna!"],
  [/^(?:Nytt ord i boken:\s*.+!|Du hittade .+!)$/iu, "Titta! Du hittade ett helt nytt ord till boken!"],
  [/^(?:Hej!\s+Här kommer .+|Se!\s+.+\s+vaknar\.|Titta,\s+.+\s+är här!)$/iu, "Titta, det du skrev vaknar till liv!"],
  [/^(?:Nu står .+ på gården!|Tadaa!\s+Här är .+!|Klart!\s+.+\s+står på gården\.|Wow,\s+.+!\s+Snyggt bygge!)$/iu, "Tadaa! Snyggt bygge, nu står det på gården!"],
  [/^\+\d+\s+stjärnor!$/iu, "Hurra! Du fick nya stjärnor!"],
  [/^Nu heter (?:djuret|du) .+!$/u, "Vilket fint namn! Det passar helt perfekt!"],
  [/^Wiii! .+ bar dig över floden!$/u, "Wiii! Du flög hela vägen över floden!"],
  [/^(?:Här får du|Varsågod) .+!$/u, "Varsågod! Vilken fin gåva!"],
  [/^.+ följer med dig!$/u, "Nu följer din vän med dig på äventyr!"],
  [/^.+ går hem till gården\.$/u, "Din vän går hem till gården och vilar."],
  [/ (?:flyttar in i|tycker om sitt nya hem!)/u, "Titta! Djuret flyttar in i sitt nya hem!"],
  [/ vill hellre bo någon annanstans\./u, "Djuret vill hellre bo någon annanstans. Prova ett annat hem!"],
  [/^Plask! .+ simmade med dig ända ut till ön!$/u, "Plask! Ni simmade ända ut till ön!"],
  [/^Dunk! .+ rullade bort stenen!$/u, "Dunk! Stenen rullade bort så vägen blev fri!"],
  [/ lyser upp hela grottan\./u, "Hela grottan lyser upp. Oj, vad det glittrar!"],
  [/^Det här ordet har jag aldrig sett!/u, "Det här ordet har jag aldrig sett! Det blev ett mystiskt ägg!"],
  [/^.+ följer efter dig!$/u, "Nu följer din vän med dig på äventyret!"],
  [/^.+ blev jätteglad och skuttar runt!$/u, "Titta så glad den blev! Den skuttar runt av lycka!"],
  [/^.+ spinner och gnider sig mot dig!$/u, "Åh, den spinner och tycker så mycket om dig!"],
  [/^Nästan! .+ vill ha .+ — du gav .+\.$/u, "Nästan rätt! Titta noga på vad djuret önskar sig."],
  [/^.+ står på sidan .+\. Köp sidan för .+ ⭐ i boken!$/u, "Det ordet finns på en låst sida i boken. Samla stjärnor för att låsa upp den!"],
];
export function sammanhallenRostText(text: string): string {
  const t = text.trim();
  if (rostFor(t) || rostFor(normalisera(t))) return t;
  for (const [re, till] of SAMMAN) if (re.test(t)) return till;
  return text;
}

function nasta() {
  upptagen = false; nu = null; nuText = null; nuForst = false;
  const rad = ko.shift();
  if (rad === undefined) return;
  const text = rad.text;
  if (!rostPa()) {
    ko.length = 0;
    return;
  }
  upptagen = true;
  nuText = text;
  nuForst = rad.forst;
  const plan = rostPlan(sammanhallenRostText(text));
  if (plan) {
    const sv = plan.dynamisk && DYNAMISK === "webblasare" ? svenskRost() : null;
    const forsta = plan.delar.find((d): d is { f: string; ms: number } => "f" in d);
    logg({ text, fil: forsta?.f ?? null, satt: plan.delar.length > 1 ? "mall" : "fil", delar: plan.delar.length, dynamisk: plan.dynamisk });
    spelaDelar(text, plan.delar, sv);
    return;
  }
  const sv = RESERV === "webblasare" ? svenskRost() : null;
  if (sv) {
    logg({ text, fil: null, satt: "reserv" });
    klocka.spelar(text);
    telefon(text, sv, () => (klocka.klar(text), nasta()));
    return;
  }
  logg({ text, fil: null, satt: "saknas" });
  klocka.klar(text);
  nasta();
}

function tonaUt(a: HTMLAudioElement) {
  tonar.add(a);
  const v0 = a.volume;
  const t0 = performance.now();
  const steg = () => {
    if (!tonar.has(a)) return;
    const k = (performance.now() - t0) / TONA_MS;
    if (k >= 1 || a.paused) {
      tonar.delete(a);
      a.pause();
      return;
    }
    try {
      a.volume = v0 * (1 - k); // iOS: volume är skrivskyddad – då pausas den efter TONA_MS
    } catch {
      // ignoreras
    }
    window.setTimeout(steg, 25);
  };
  steg();
}

/** TTS-3-fix: en banner kom medan en guiderad/pratbubbla/önskan läses – den tonas ut och bannerns röst börjar direkt. */
function avbryt() {
  omgang++; // spelaDelar för den avbrutna fortsätter inte (ingen nästa del, ingen omstart)
  const a = nu;
  nu = null;
  if (a) tonaUt(a);
  if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
  nasta();
}

function stoppa() {
  ko.length = 0;
  omgang++;
  for (const a of tonar) a.pause();
  tonar.clear();
  nu?.pause();
  nu = null;
  nuText = null;
  nuForst = false;
  upptagen = false;
  if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
}

/** Stoppar allt som läses och tömmer kön – barnet tryckte bort bannern, så dess klocka släpps också. */
export function tystna() {
  klocka.slapp();
  stoppa();
}

/** Läs upp text som visas. enGang läses en gång per omgång. Högst fyra i kö. forst = bannern avbryter pågående uppläsning. */
export function sag(text: string, enGang?: string, forst = false) {
  if (typeof window === "undefined" || !text.trim()) return;
  if (!lyssnar) {
    lyssnar = true;
    useMinne.subscribe((s, f) => {
      const fore = (f.rostPa ?? true) && f.ljudPa;
      const nuPa = (s.rostPa ?? true) && s.ljudPa;
      if (fore && !nuPa) {
        stoppa();
        ko.length = 0;
        klocka.utanRost(); // ljudet av: bannern står den vanliga tiden
      }
    });
  }
  if (!rostPa()) return;
  if (enGang) {
    if (engang.has(enGang)) return;
    engang.add(enGang);
  }
  const rad = { text: normalisera(text), forst };
  if (forst) {
    const i = ko.findIndex((x) => !x.forst);
    if (i < 0) ko.push(rad);
    else ko.splice(i, 0, rad);
  } else ko.push(rad);
  while (ko.length > 4) {
    const i = ko.findIndex((x) => !x.forst);
    ko.splice(i < 0 ? 0 : i, 1);
  }
  if (!upptagen) nasta();
  else if (forst && !nuForst) avbryt();
}

/** Hur länge en text tar att läsa (ms) när den har fil eller mall, annars 0. */
export function lasTid(text: string): number {
  return rostPlan(text)?.ms ?? 0;
}

/** TTS-2: hur länge ett barn behöver för att läsa texten själv (ms): 1,2 s + 60 ms per tecken, högst 12 s. */
export function lasbarTid(text: string): number {
  return Math.min(12_000, 1200 + 60 * normalisera(text).length);
}

/** TTS-2: bannerns tid – max(bas, lästid, replikens längd + 1,5 s när ljudet är på). */
export function bannerTid(text: string, bas: number): number {
  const las = Math.max(bas, lasbarTid(text));
  if (typeof window === "undefined" || !rostPa()) return las;
  const ms = lasTid(text);
  return ms > 0 ? Math.max(las, ms + 1500) : las;
}

/** TTS-3: hur länge en banner väntar på att dess röst ska börja innan den vanliga tiden gäller (ms, räknat från visningen). */
export const ROST_START_MS = 6000;
/** TTS-3: efter rösten står bannern minst så här länge till (ms). */
export const EFTER_ROST_MS = 1500;

/** TTS-3: bannerns klocka. Utan röst gäller bannerTid från visningen. Med röst börjar tiden vid play och stängs tidigast vid max(start + lästid, slut + 1,5 s). */
type Klocka = { text: string; las: number; ms: number; t0: number; start: number | null; timer: number; stang: () => void };
let aktiv: Klocka | null = null;
const klocka = {
  satt(k: Klocka, ms: number) {
    window.clearTimeout(k.timer);
    k.timer = window.setTimeout(() => {
      if (aktiv === k) aktiv = null;
      k.stang();
    }, Math.max(0, ms));
  },
  spelar(text: string) {
    const k = aktiv;
    if (!k || k.text !== text) return;
    k.start ??= performance.now();
    // vaktpost om 'ended' aldrig kommer: replikens längd + marginal
    klocka.satt(k, Math.max(k.las, k.ms + EFTER_ROST_MS) + 4000);
  },
  klar(text: string) {
    const k = aktiv;
    if (!k || k.text !== text) return;
    const nu = performance.now();
    if (k.start === null) return klocka.satt(k, k.t0 + bannerTidMs(k) - nu); // spelades aldrig: vanliga tiden
    klocka.satt(k, Math.max(k.start + k.las, nu + EFTER_ROST_MS) - nu);
  },
  utanRost() {
    const k = aktiv;
    if (k) klocka.satt(k, Math.max(k.t0 + k.las, performance.now()) - performance.now());
  },
  slapp() {
    if (aktiv) window.clearTimeout(aktiv.timer);
    aktiv = null;
  },
};
function bannerTidMs(k: Klocka) {
  return k.ms > 0 && rostPa() ? Math.max(k.las, k.ms + EFTER_ROST_MS) : k.las;
}

/** TTS-3: startar bannerns klocka och anropar stang() när bannern ska gå. */
export function bannerKlocka(text: string, bas: number, stang: () => void): number {
  klocka.slapp();
  const t = normalisera(text);
  const k: Klocka = { text: t, las: Math.max(bas, lasbarTid(t)), ms: lasTid(t), t0: performance.now(), start: null, timer: 0, stang };
  if (typeof window === "undefined" || !rostPa() || k.ms === 0) {
    k.timer = window.setTimeout(stang, k.las);
    return k.timer;
  }
  aktiv = k;
  if (nuText === t) k.start = k.t0; // rösten läser redan samma text
  const vanlig = () => {
    // vanliga tiden har gått utan att rösten börjat: ligger repliken kvar i kön väntar bannern till ROST_START_MS
    const kvar = k.t0 + ROST_START_MS - performance.now();
    if (aktiv === k && k.start === null && kvar > 0 && ko.some((x) => x.text === t)) {
      k.timer = window.setTimeout(vanlig, kvar);
      return;
    }
    if (aktiv === k) aktiv = null;
    stang();
  };
  k.timer = window.setTimeout(vanlig, bannerTidMs(k));
  if (k.start !== null) klocka.spelar(t);
  return k.timer;
}

/** R1: spelare åt rostKo. Egen generation, rör inte sag-kön eller bannerns klocka. Loggar hörda rader synkront. */
type UppMeta = { klass: string; kalla: string; fodd: number };
let uppOmg = 0;
let uppLjud: HTMLAudioElement | null = null;

export function spelaUpp(text: string, meta: UppMeta, klar: () => void): { avbryt: () => void } {
  const min = ++uppOmg;
  const t = normalisera(text);
  let vanta: ReturnType<typeof setTimeout> | null = null;
  const fardig = () => {
    if (min !== uppOmg) return;
    uppLjud = null;
    vanta = null;
    klocka.klar(t);
    klar();
  };
  const avbryt = () => {
    if (min !== uppOmg) return;
    uppOmg++;
    if (vanta !== null) clearTimeout(vanta);
    vanta = null;
    const a = uppLjud;
    uppLjud = null;
    if (a) tonaUt(a);
    if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
  };
  const bas = { text, klass: meta.klass, kalla: meta.kalla, fodd: meta.fodd };
  const plan = rostPlan(sammanhallenRostText(text));
  if (plan) {
    const sv = plan.dynamisk && DYNAMISK === "webblasare" ? svenskRost() : null;
    const forsta = plan.delar.find((d): d is { f: string; ms: number } => "f" in d);
    logg({ ...bas, fil: forsta?.f ?? null, satt: plan.delar.length > 1 ? "mall" : "fil", delar: plan.delar.length, dynamisk: plan.dynamisk });
    spelaUppDelar(plan.delar, sv, min, t, fardig);
    return { avbryt };
  }
  const sv = RESERV === "webblasare" ? svenskRost() : null;
  if (sv) {
    logg({ ...bas, fil: null, satt: "reserv" });
    klocka.spelar(t);
    telefon(text, sv, () => {
      if (min === uppOmg) fardig();
    });
    return { avbryt };
  }
  logg({ ...bas, fil: null, satt: "saknas" });
  queueMicrotask(fardig);
  return { avbryt };
}

function spelaUppDelar(delar: RostDel[], _sv: SpeechSynthesisVoice | null, min: number, t: string, fardig: () => void) {
  let i = 0;
  const steg = () => {
    if (min !== uppOmg) return;
    const d = delar[i++];
    if (!d) {
      fardig();
      return;
    }
    if ("f" in d) {
      try {
        const a = new Audio(d.f);
        uppLjud = a;
        const vidare = () => {
          if (min === uppOmg) steg();
        };
        a.addEventListener("ended", vidare);
        a.addEventListener("error", vidare);
        a.play().then(
          () => klocka.spelar(t),
          () => steg(),
        );
      } catch {
        steg();
      }
    } else steg(); // dynamisk del och DYNAMISK "tyst": ingen telefon, nästa del
  };
  steg();
}
