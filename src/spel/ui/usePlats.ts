// B1.4: resa mellan platser – ton ut/in, intro-bubbla, grind och skrivet platsnamn.
import { useCallback, useEffect, useRef, useState } from "react";
import { mattUr, platsMed, PLATSER, START_PLATS, upplast } from "../platser.ts";
import { useMinne } from "../minne.ts";
import { FEL_RESA, forstaUpplasta, nyPlatsVantar, platsFranText } from "../resa.ts";

type Hjalp = { visaFel: () => void };

const TON_MS = 400;

export function usePlats({ visaFel }: Hjalp) {
  const plats = useMinne((s) => s.plats);
  const oppnade = useMinne((s) => s.oppnadePlatser);
  const angN = useMinne((s) => s.ang.length);
  const [ton, setTon] = useState(false);
  const [intro, setIntro] = useState<{ text: string; min: string } | null>(null);
  const timer = useRef<number | null>(null);
  const introTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
      if (introTimer.current) window.clearTimeout(introTimer.current);
    },
    [],
  );

  const matt = useCallback(() => mattUr(useMinne.getState()), []);

  const upplasta = PLATSER.filter((p) => upplast(p.id, matt())).map((p) => p.id);
  // angN: skylten ska ritas om när barnet skapar djur
  void angN;

  const resTill = useCallback(
    (id: string): boolean => {
      const d = useMinne.getState();
      if (d.plats === id) return true;
      if (!d.bytPlats(id)) {
        visaFel();
        return false;
      }
      setTon(true);
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setTon(false), TON_MS);
      const introData = platsMed(id)?.intro as { text?: string; min?: string; visa_en_gang?: boolean } | undefined;
      if (introData?.text && (!introData.visa_en_gang || !d.seddaIntro.includes(id))) {
        d.markeraIntro(id);
        setIntro({ text: introData.text, min: introData.min ?? "karta" });
        if (introTimer.current) window.clearTimeout(introTimer.current);
        introTimer.current = window.setTimeout(() => setIntro(null), 4200);
      }
      return true;
    },
    [visaFel],
  );

  const tryckGrind = useCallback((): boolean => {
    const id = forstaUpplasta(matt());
    if (!id) return false;
    return resTill(id);
  }, [matt, resTill]);

  const forsokSkriv = useCallback(
    (raw: string): boolean => {
      const id = platsFranText(raw);
      if (!id) return false;
      resTill(id);
      return true;
    },
    [resTill],
  );

  return {
    plats,
    namn: platsMed(plats)?.namn ?? "Ängen",
    upplasta,
    resTill,
    tryckGrind,
    forsokSkriv,
    ton,
    intro,
    skylt: nyPlatsVantar(matt(), oppnade) && plats === START_PLATS,
    felText: FEL_RESA,
    hem: () => resTill(START_PLATS),
  };
}
