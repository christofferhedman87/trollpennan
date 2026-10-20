// TTS-1: uppläsning av texter som visas. Förgenererad fil via manifestet när den finns (laddas först när den spelas),
// annars reserven i data/rost.json: webbläsarens svenska röst, aldrig en engelsk; utan svensk röst blir det tyst.
// Generellt: anroparen skickar texten, ingen kod per replik.
import { useEffect } from "react";
import { useMinne } from "./minne.ts";
import { RESERV, normalisera, rostFor } from "./rostManifest.ts";

type Logg = { text: string; fil: string | null; satt: "fil" | "reserv" | "tyst" };
const ko: string[] = [];
const engang = new Set<string>();
let nu: HTMLAudioElement | null = null;
let upptagen = false;
let lyssnar = false;

function logg(l: Logg) {
  const w = window as unknown as { __rost?: Logg[] };
  (w.__rost ??= []).push(l);
}

function svenskRost(): SpeechSynthesisVoice | null {
  if (typeof speechSynthesis === "undefined") return null;
  return speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().replace("_", "-").startsWith("sv")) ?? null;
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
  const rad = rostFor(text);
  if (rad) {
    const a = new Audio(rad.f);
    nu = a;
    a.addEventListener("ended", nasta);
    a.addEventListener("error", nasta);
    logg({ text, fil: rad.f, satt: "fil" });
    a.play().catch(() => nasta());
    return;
  }
  const sv = RESERV === "webblasare" ? svenskRost() : null;
  if (sv) {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "sv-SE";
    try {
      u.voice = sv;
    } catch {
      // lang räcker om rösten inte går att sätta
    }
    u.onend = nasta;
    u.onerror = nasta;
    logg({ text, fil: null, satt: "reserv" });
    speechSynthesis.speak(u);
    return;
  }
  logg({ text, fil: null, satt: "tyst" });
  nasta();
}

/** Stoppar allt som läses och tömmer kön. */
export function tystna() {
  ko.length = 0;
  nu?.pause();
  nu = null;
  upptagen = false;
  if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
}

/** Läs upp en text som visas. enGang = nyckel som bara läses en gång per spelomgång (t.ex. uppdragets id). Högst tre i kö. */
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
  while (ko.length > 3) ko.shift();
  if (!upptagen) nasta();
}

/** Hur länge en text tar att läsa (ms) när det finns en fil, annars 0. */
export function lasTid(text: string): number {
  return rostFor(text)?.ms ?? 0;
}

/** Läser upp bannrar av slaget "ovr" (Bengtssons repliker, nya och klara uppdrag) när de visas, en gång per banner. */
export function useRostBannrar(banners: { id: number; text: string; slag: string }[]) {
  useEffect(() => {
    for (const b of banners) if (b.slag === "ovr") sag(b.text, `banner:${b.id}`);
  }, [banners]);
}
