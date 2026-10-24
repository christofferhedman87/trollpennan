// TTS-1/TTS-2: uppläsning av texter som visas. Förgenererade filer via manifestet (laddas först när de spelas): en hel text,
// eller en mall där de fasta delarna och kända värden ("en kanin", tal, namn) är filer. Barnets egna ord (dynamisk text)
// läses med telefonens svenska röst om den finns, annars läses den meningen inte. Fasta texter utan fil: 'reserv' i
// data/rost.json ('tyst' = ingen telefonröst, de genereras i stället). Aldrig en engelsk röst. Ingen kod per replik.
import { useMinne } from "./minne.ts";
import { DYNAMISK, RESERV, normalisera, rostPlan, type RostDel } from "./rostManifest.ts";

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
/** TTS-3: kön. forst = bannerns röst – den går före allt annat i kön, och en guiderad/pratbubbla/önskan som redan läses
 *  avbryts (tonas ut på TONA_MS) så att bannerns röst börjar direkt. Den avbrutna läses inte om (texten står kvar). */
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

function spelaDelar(text: string, delar: RostDel[], sv: SpeechSynthesisVoice | null) {
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
      const a = new Audio(d.f);
      nu = a;
      a.addEventListener("ended", steg);
      a.addEventListener("error", steg);
      a.play().then(
        () => klocka.spelar(text), // play-löftet uppfylls när uppspelningen faktiskt startar
        () => steg(),
      );
    } else if (sv) {
      klocka.spelar(text);
      telefon(d.dynamisk, sv, steg);
    } else steg();
  };
  steg();
}

function nasta() {
  upptagen = false;
  nu = null;
  nuText = null;
  nuForst = false;
  const rad = ko.shift();
  if (rad === undefined) return;
  const text = rad.text;
  if (!useMinne.getState().ljudPa) {
    ko.length = 0;
    return;
  }
  upptagen = true;
  nuText = text;
  nuForst = rad.forst;
  const plan = rostPlan(text);
  if (plan) {
    const sv = plan.dynamisk && DYNAMISK === "webblasare" ? svenskRost() : null;
    if (plan.dynamisk && !sv) {
      logg({ text, fil: null, satt: "tyst", dynamisk: true });
      klocka.klar(text);
      return nasta();
    }
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

/** Läs upp en text som visas. enGang = nyckel som bara läses en gång per spelomgång (t.ex. uppdragets id). Högst fyra i kö.
 *  forst (TTS-3) = bannerns röst: läggs före pratbubblor/önskan i kön och avbryter en guiderad/pratbubbla som läses (TTS-3-fix).
 *  Blir kön för lång tas den äldsta som inte är forst bort. */
export function sag(text: string, enGang?: string, forst = false) {
  if (typeof window === "undefined" || !text.trim()) return;
  if (!lyssnar) {
    lyssnar = true;
    useMinne.subscribe((s, f) => {
      if (f.ljudPa && !s.ljudPa) {
        stoppa();
        klocka.utanRost(); // ljudet av: bannern står den vanliga tiden
      }
    });
  }
  if (!useMinne.getState().ljudPa) return;
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

/** TTS-2: bannerns tid – max(bas, lästid, replikens längd ur manifestet + 1,5 s när ljudet är på), så att barnet hinner
 *  läsa medan rösten läser och bannern aldrig försvinner mitt i repliken. */
export function bannerTid(text: string, bas: number): number {
  const las = Math.max(bas, lasbarTid(text));
  if (typeof window === "undefined" || !useMinne.getState().ljudPa) return las;
  const ms = lasTid(text);
  return ms > 0 ? Math.max(las, ms + 1500) : las;
}

/** TTS-3: hur länge en banner väntar på att dess röst ska börja innan den vanliga tiden gäller (ms, räknat från visningen). */
export const ROST_START_MS = 6000;
/** TTS-3: efter rösten står bannern minst så här länge till (ms). */
export const EFTER_ROST_MS = 1500;

/** TTS-3: bannerns klocka. Bara en banner syns åt gången, så det finns högst en klocka. Utan röst (ljud av, ingen fil och
 *  tyst reserv, kön tappade repliken) gäller den vanliga tiden: bannerTid() från visningen. Med röst börjar tiden när rösten
 *  faktiskt spelar (play/playing) och bannern stängs tidigast vid max(start + lästid, slut + 1,5 s). Startar rösten inte
 *  inom ROST_START_MS gäller den vanliga tiden. Ett tryck (tystna) släpper klockan – bannern stängs då av trycket. */
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
  return k.ms > 0 && useMinne.getState().ljudPa ? Math.max(k.las, k.ms + EFTER_ROST_MS) : k.las;
}

/** TTS-3: startar bannerns klocka och anropar stang() när bannern ska gå. Returnerar ett timer-id (för clearTimeout i
 *  anroparen, som förut); klockan själv släpps av nästa banner eller av ett tryck (tystna). */
export function bannerKlocka(text: string, bas: number, stang: () => void): number {
  klocka.slapp();
  const t = normalisera(text);
  const k: Klocka = { text: t, las: Math.max(bas, lasbarTid(t)), ms: lasTid(t), t0: performance.now(), start: null, timer: 0, stang };
  if (typeof window === "undefined" || !useMinne.getState().ljudPa || k.ms === 0) {
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
  const plan = rostPlan(text);
  if (plan) {
    const sv = plan.dynamisk && DYNAMISK === "webblasare" ? svenskRost() : null;
    if (plan.dynamisk && !sv) {
      logg({ ...bas, fil: null, satt: "tyst", dynamisk: true });
      klocka.spelar(t);
      vanta = setTimeout(fardig, 1800);
      return { avbryt };
    }
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

function spelaUppDelar(delar: RostDel[], sv: SpeechSynthesisVoice | null, min: number, t: string, fardig: () => void) {
  let i = 0;
  const steg = () => {
    if (min !== uppOmg) return;
    const d = delar[i++];
    if (!d) {
      fardig();
      return;
    }
    if ("f" in d) {
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
    } else if (sv) {
      klocka.spelar(t);
      telefon(d.dynamisk, sv, steg);
    } else steg();
  };
  steg();
}
