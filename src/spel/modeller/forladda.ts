import { useGLTF } from "@react-three/drei";

const ko: string[] = [];
const sedda = new Set<string>();
const lyssnare = new Set<() => void>();
let startade = 0;
let forstaBildrutaKlar = false;
let aktivt = 0;
let timerId: ReturnType<typeof setTimeout> | null = null;
const MAX_SAMTIDIGA = 2;

/** Köar unika GLB-adresser. Anropar inte useGLTF.preload vid modulimport. */
export function forladdaNarLedig(urlLista: Iterable<string>): void {
  for (const url of urlLista) {
    if (!url || sedda.has(url)) continue;
    sedda.add(url);
    ko.push(url);
  }
  if (forstaBildrutaKlar) schemalagg();
}

function schemalagg(): void {
  if (!forstaBildrutaKlar || ko.length === 0 || aktivt >= MAX_SAMTIDIGA) return;
  if (typeof window !== "undefined" && "requestIdleCallback" in window) {
    window.requestIdleCallback(steg, { timeout: 600 });
  } else {
    setTimeout(steg, 120);
  }
}

function steg(): void {
  while (aktivt < MAX_SAMTIDIGA && ko.length > 0) {
    const url = ko.shift();
    if (!url) break;
    aktivt += 1;
    startade += 1;
    try {
      useGLTF.preload(url);
    } catch {
      /* tyst reserv */
    }
    setTimeout(() => {
      aktivt = Math.max(0, aktivt - 1);
      schemalagg();
    }, 120);
  }
}

/** Väntar 1600 ms efter första bildrutan så att fönstret DOMContentLoaded + 1500 ms är fritt. */
export function startaBakgrundsForladdning(): void {
  if (forstaBildrutaKlar || timerId !== null) return;
  timerId = setTimeout(() => {
    timerId = null;
    forstaBildrutaKlar = true;
    for (const fn of lyssnare) fn();
    schemalagg();
  }, 1600);
}

export function onBakgrundsForladdningKlar(cb: () => void): () => void {
  if (forstaBildrutaKlar) {
    cb();
    return () => undefined;
  }
  lyssnare.add(cb);
  return () => {
    lyssnare.delete(cb);
  };
}

export function forladdningsStatus(): { koade: number; startade: number; forstaBildrutaKlar: boolean } {
  return { koade: sedda.size, startade, forstaBildrutaKlar };
}
