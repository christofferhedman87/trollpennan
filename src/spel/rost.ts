// TTS-1/TTS-2: uppläsning av texter som visas. Förgenererade filer via manifestet (laddas först när de spelas): en hel text,
// eller en mall där de fasta delarna och kända värden ("en kanin", tal, namn) är filer. Barnets egna ord (dynamisk text)
// läses med telefonens svenska röst om den finns, annars läses den meningen inte. Fasta texter utan fil: 'reserv' i
// data/rost.json ('tyst' = ingen telefonröst, de genereras i stället). Aldrig en engelsk röst. Ingen kod per replik.
import { useEffect } from "react";
import { useMinne } from "./minne.ts";
import { DYNAMISK, RESERV, normalisera, rostPlan, type RostDel } from "./rostManifest.ts";

type Logg = { text: string; fil: string | null; satt: "fil" | "mall" | "reserv" | "tyst" | "saknas"; delar?: number; dynamisk?: boolean };
const ko: string[] = [];
const engang = new Set<string>();
let nu: HTMLAudioElement | null = null;
let upptagen = false;
let lyssnar = false;
let omgang = 0;

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

function spelaDelar(delar: RostDel[], sv: SpeechSynthesisVoice | null) {
  const min = omgang;
  let i = 0;
  const steg = () => {
    if (min !== omgang) return;
    const d = delar[i++];
    if (!d) return nasta();
    if ("f" in d) {
      const a = new Audio(d.f);
      nu = a;
      a.addEventListener("ended", steg);
      a.addEventListener("error", steg);
      a.play().catch(() => steg());
    } else if (sv) telefon(d.dynamisk, sv, steg);
    else steg();
  };
  steg();
}

function nasta() {
  upptagen = false;
  nu = null;
  const text = ko.shift();
  if (text === undefined) return;
  if (!useMinne.getState().ljudPa) {
    ko.length = 0;
    return;
  }
  upptagen = true;
  const plan = rostPlan(text);
  if (plan) {
    const sv = plan.dynamisk && DYNAMISK === "webblasare" ? svenskRost() : null;
    if (plan.dynamisk && !sv) {
      logg({ text, fil: null, satt: "tyst", dynamisk: true });
      return nasta();
    }
    const forsta = plan.delar.find((d): d is { f: string; ms: number } => "f" in d);
    logg({ text, fil: forsta?.f ?? null, satt: plan.delar.length > 1 ? "mall" : "fil", delar: plan.delar.length, dynamisk: plan.dynamisk });
    spelaDelar(plan.delar, sv);
    return;
  }
  const sv = RESERV === "webblasare" ? svenskRost() : null;
  if (sv) {
    logg({ text, fil: null, satt: "reserv" });
    telefon(text, sv, nasta);
    return;
  }
  logg({ text, fil: null, satt: "saknas" });
  nasta();
}

/** Stoppar allt som läses och tömmer kön. */
export function tystna() {
  ko.length = 0;
  omgang++;
  nu?.pause();
  nu = null;
  upptagen = false;
  if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
}

/** Läs upp en text som visas. enGang = nyckel som bara läses en gång per spelomgång (t.ex. uppdragets id). Högst fyra i kö. */
export function sag(text: string, enGang?: string) {
  if (typeof window === "undefined" || !text.trim()) return;
  if (!lyssnar) {
    lyssnar = true;
    useMinne.subscribe((s, f) => {
      if (f.ljudPa && !s.ljudPa) tystna();
    });
  }
  if (!useMinne.getState().ljudPa) return;
  if (enGang) {
    if (engang.has(enGang)) return;
    engang.add(enGang);
  }
  ko.push(normalisera(text));
  while (ko.length > 4) ko.shift();
  if (!upptagen) nasta();
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

/** Läser upp bannrar (alla slag) när de visas, en gång per banner. */
export function useRostBannrar(banners: { id: number; text: string }[]) {
  useEffect(() => {
    for (const b of banners) sag(b.text, `banner:${b.id}`);
  }, [banners]);
}

/** TTS-2: djurens pratbubblor och önskan som syns, en gång per bubbla/önskan. */
export function useRostBubblor(bubblor: { id: number; text: string }[], onskan: string | null) {
  useEffect(() => {
    for (const b of bubblor) sag(b.text, `bubbla:${b.id}`);
  }, [bubblor]);
  useEffect(() => {
    if (onskan) sag(onskan, `onskan:${onskan}`);
  }, [onskan]);
}
