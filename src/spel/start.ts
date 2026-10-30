// P2-2: titelskärmens läge och "börja om" med ångra inom sessionen. Ren logik + en liten zustand-butik, ingen React-vy.
import { create } from "zustand";
import { aktivaNycklar, aterstallArkiv, borjaOmArkiverat, listaArkiv } from "./arkiv.ts";

type Lagring = Pick<Storage, "getItem" | "setItem" | "removeItem" | "key" | "length">;

/** Så länge introt tonar ut över ängen när det är slut (samma tid som .intro.tonar-ut i intro.css). */
export const INTRO_UTTONING_MS = 700;

/** Nyckeln i sessionStorage där den gamla världen ligger efter "Börja om" (finns kvar tills fliken stängs). */
export const ANGRA_NYCKEL = "trollpennan-angra";
/** Prov (Playwright, navigator.webdriver) ser titelskärmen bara om de ber om den, så att äldre prov går som förut. */
export const PROV_NYCKEL = "p2-titel-prov";

/** Även själva webbläsargettern kan nekas, före det första anropet till getItem. */
export function sessionLagring(hamta: () => Storage = () => window.sessionStorage): Storage | null {
  try { return hamta(); } catch { return null; }
}

export function visaTitelVidStart(webdriver: boolean, session: Pick<Storage, "getItem"> | null): boolean {
  // Utan åtkomst till provflaggan väljer vi den riktiga starten, inte ett dolt testflöde.
  if (!webdriver || !session) return true;
  try {
    return session?.getItem(PROV_NYCKEL) === "1";
  } catch {
    return true;
  }
}

export const useStart = create<{ titelOppen: boolean; stang: () => void; angRedo: boolean; redo: () => void }>((set) => ({
  titelOppen: typeof window !== "undefined" && visaTitelVidStart(navigator.webdriver === true, sessionLagring()),
  stang: () => set({ titelOppen: false }),
  /** 3D-ängen har ritat sin första bild (eller 3D gick inte att starta). Försidan väntar på den. */
  angRedo: false,
  redo: () => set({ angRedo: true }),
}));

/** Aktiva spelnycklar; beständiga arkiv får aldrig följa med i rensningen. */
export const spelNycklar = aktivaNycklar;
/** Sessionsargumentet finns kvar för gamla anrop; kopian sparas nu alltid beständigt. */
export function borjaOmMedKopia(lokal: Lagring, _session?: Lagring | null): boolean {
  return borjaOmArkiverat(lokal);
}
export function harKopia(lokal: Lagring | null): boolean {
  return !!lokal && listaArkiv(lokal).length > 0;
}

/** Kompatibelt anropsnamn; väljer nu det senaste beständiga arkivet utan att konsumera det. */
export function angraBorjaOm(lokal: Lagring, _session?: Lagring): boolean {
  const kopia = listaArkiv(lokal)[0];
  return !!kopia && aterstallArkiv(lokal, kopia.nyckel);
}

/** Ladda om utan att spelet hinner spara tillbaka den gamla världen (samma skydd som menyns "Börja om"). */
export function laddaOmRent(lokal: Lagring, behall?: Record<string, string>) {
  const vakt = () => {
    for (const k of spelNycklar(lokal)) if (!behall || !(k in behall)) lokal.removeItem(k);
    if (behall) for (const [k, v] of Object.entries(behall)) lokal.setItem(k, v);
  };
  window.addEventListener("pagehide", vakt);
  window.location.reload();
}
