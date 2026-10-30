// P2-2: titelskärmens läge och "börja om" med ångra inom sessionen. Ren logik + en liten zustand-butik, ingen React-vy.
import { create } from "zustand";

type Lagring = Pick<Storage, "getItem" | "setItem" | "removeItem" | "key" | "length">;

/** Nyckeln i sessionStorage där den gamla världen ligger efter "Börja om" (finns kvar tills fliken stängs). */
export const ANGRA_NYCKEL = "trollpennan-angra";
/** Prov (Playwright, navigator.webdriver) ser titelskärmen bara om de ber om den, så att äldre prov går som förut. */
export const PROV_NYCKEL = "p2-titel-prov";

export function visaTitelVidStart(webdriver: boolean, session: Pick<Storage, "getItem"> | null): boolean {
  if (!webdriver) return true;
  try {
    return session?.getItem(PROV_NYCKEL) === "1";
  } catch {
    return false;
  }
}

export const useStart = create<{ titelOppen: boolean; stang: () => void; angRedo: boolean; redo: () => void }>((set) => ({
  titelOppen: typeof window !== "undefined" && visaTitelVidStart(navigator.webdriver === true, window.sessionStorage),
  stang: () => set({ titelOppen: false }),
  /** 3D-ängen har ritat sin första bild (eller 3D gick inte att starta). Försidan väntar på den. */
  angRedo: false,
  redo: () => set({ angRedo: true }),
}));

/** Alla spelets nycklar i localStorage (samma urval som menyns "Börja om"). */
export function spelNycklar(lokal: Lagring): string[] {
  const ut: string[] = [];
  for (let i = 0; i < lokal.length; i++) {
    const k = lokal.key(i);
    if (k?.startsWith("trollpennan")) ut.push(k);
  }
  return ut;
}

/** Sparar den gamla världen i sessionStorage och tömmer den lokala. Returnerar true om kopian gick att spara. */
export function borjaOmMedKopia(lokal: Lagring, session: Lagring | null): boolean {
  const nycklar = spelNycklar(lokal);
  let kopia = false;
  if (session) {
    try {
      const data: Record<string, string> = {};
      for (const k of nycklar) data[k] = lokal.getItem(k) ?? "";
      session.setItem(ANGRA_NYCKEL, JSON.stringify({ tid: Date.now(), data }));
      kopia = true;
    } catch {
      kopia = false;
    }
  }
  for (const k of nycklar) lokal.removeItem(k);
  return kopia;
}

export function harKopia(session: Pick<Storage, "getItem"> | null): boolean {
  try {
    return !!session?.getItem(ANGRA_NYCKEL);
  } catch {
    return false;
  }
}

/** Lägger tillbaka den gamla världen (ersätter det som finns nu) och tar bort kopian. */
export function angraBorjaOm(lokal: Lagring, session: Lagring): boolean {
  try {
    const raw = session.getItem(ANGRA_NYCKEL);
    if (!raw) return false;
    const { data } = JSON.parse(raw) as { data: Record<string, string> };
    for (const k of spelNycklar(lokal)) lokal.removeItem(k);
    for (const [k, v] of Object.entries(data)) if (k.startsWith("trollpennan")) lokal.setItem(k, v);
    session.removeItem(ANGRA_NYCKEL);
    return true;
  } catch {
    return false;
  }
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
