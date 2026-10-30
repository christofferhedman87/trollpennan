// Nya Skapa: föräldrainställningen "Säg bokstaven vid varje tangent" och bokstavsljudet.
// Sparas i en egen nyckel, så att barnets sparfil (minne.ts) inte behöver byta format.
import { create } from "zustand";
import { useMinne } from "../minne.ts";

const NYCKEL = "trollpennan-skapa-v1";
type Inst = { bokstavsljud: boolean };

function las(): Inst {
  try {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(NYCKEL) : null;
    const p = raw ? (JSON.parse(raw) as Partial<Inst>) : {};
    return { bokstavsljud: p.bokstavsljud !== false };
  } catch {
    return { bokstavsljud: true };
  }
}

export const useSkapaInst = create<Inst & { sattBokstavsljud: (pa: boolean) => void }>((set) => ({
  ...las(),
  sattBokstavsljud: (pa) => {
    set({ bokstavsljud: pa });
    try {
      window.localStorage.setItem(NYCKEL, JSON.stringify({ bokstavsljud: pa }));
    } catch {
      /* inställningen gäller ändå tills sidan laddas om */
    }
  },
}));

let rost: SpeechSynthesisVoice | null | undefined;

/** Varje tangent säger sin bokstav. Tills röstfilerna för bokstavsljuden finns (docs/en-varld/nya-repliker.md)
 *  läser webbläsarens talsyntes bokstaven. */
export function sagBokstav(b: string): void {
  if (!useSkapaInst.getState().bokstavsljud || !useMinne.getState().rostPa) return;
  try {
    if (typeof speechSynthesis === "undefined") return;
    if (rost === undefined) rost = speechSynthesis.getVoices().find((v) => v.lang?.toLowerCase().startsWith("sv")) ?? null;
    const u = new SpeechSynthesisUtterance(b.toLocaleLowerCase("sv"));
    u.lang = "sv-SE";
    u.rate = 1.05;
    u.pitch = 1.1;
    if (rost) u.voice = rost;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  } catch {
    /* uppläsningen är en bonus */
  }
}
