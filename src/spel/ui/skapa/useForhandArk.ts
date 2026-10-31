// Nya Skapa 6.10: arket säger till scenen var dess kant går (kameran) och vad som skulle trollas fram (hologrammet).
// Tolkningen körs högst var 180:e ms. På ängen som förut; på utflykterna (block 4b) med platsens egen lista och regler.
import { useEffect, type RefObject } from "react";
import uiJson from "../../../../data/skapa-ui.json" with { type: "json" };
import { oppnaTomter, useDal } from "../../dal/utbyggnad.ts";
import { useMinne } from "../../minne.ts";
import { platsMed, START_PLATS } from "../../platser.ts";
import { forhand } from "../../skapa/forhand.ts";
import { dalStyr } from "../../dal/dalStyr.ts";
import { DALEN } from "../../dal/tomter.ts";
import { forhandFor, forhandForPlats } from "../../skapa/forhandTolk.ts";

const MS = (uiJson as unknown as { tider_ms: Record<string, number> }).tider_ms.holo_omritning ?? 180;

export function useForhandArk(arkRef: RefObject<HTMLElement | null>, text: string, aktiv: boolean, plats: string = START_PLATS) {
  // `plats` i beroendena: byts plats medan boken är öppen töms ringen, hologrammet och bildförskjutningen och byggs om.
  useEffect(() => {
    if (!aktiv) return;
    forhand.oppna(true);
    let id = 0;
    const mat = () => {
      const r = arkRef.current?.getBoundingClientRect();
      if (r) forhand.sattArkKant(r.top, r.left);
      id = window.requestAnimationFrame(mat);
    };
    mat();
    return () => {
      window.cancelAnimationFrame(id);
      forhand.oppna(false);
    };
  }, [aktiv, arkRef, plats]);
  useEffect(() => {
    if (!aktiv) return;
    const t = window.setTimeout(() => {
      const s = useMinne.getState();
      if (s.plats !== plats) return;
      if (plats !== START_PLATS) {
        const pd = platsMed(plats);
        if (!pd) return;
        const p = forhandForPlats(text, pd, s.platsSkapelser[plats] ?? [], s.sovande);
        forhand.visa(p.spec, p.nyckel, p.ring, { plats: p.plats, y: p.y, krymp: p.krymp, placering: p.placering });
        return;
      }
      const f = forhandFor(text, s.ang, s.garden, oppnaTomter(useDal.getState().utbyggnader));
      const forra = forhand.lage().ring;
      forhand.visa(f.spec, f.nyckel, f.ring, { krymp: f.krymp, placering: f.placering });
      // Ett bygge hamnar på en tomt som kanske inte syns: kameran glider dit (samma som efter Trolla).
      if ((f.spec?.typ === "bygg" || f.nyckel.startsWith("t:")) && f.ring && (forra?.x !== f.ring.x || forra?.z !== f.ring.z)) dalStyr.fokusera(f.ring.x, f.ring.z, f.ring.z < -1 ? DALEN.kamera.vy_bak : DALEN.kamera.vy_fram);
    }, MS);
    return () => window.clearTimeout(t);
  }, [text, aktiv, plats]);
}
