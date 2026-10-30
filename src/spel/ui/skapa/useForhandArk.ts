// Nya Skapa 6.10: arket säger till scenen var dess kant går (kameran) och vad som skulle trollas fram (hologrammet).
// Tolkningen körs högst var 180:e ms, och bara på ängen.
import { useEffect, type RefObject } from "react";
import uiJson from "../../../../data/skapa-ui.json" with { type: "json" };
import { oppnaTomter, useDal } from "../../dal/utbyggnad.ts";
import { useMinne } from "../../minne.ts";
import { START_PLATS } from "../../platser.ts";
import { forhand } from "../../skapa/forhand.ts";
import { dalStyr } from "../../dal/dalStyr.ts";
import { DALEN } from "../../dal/tomter.ts";
import { forhandFor } from "../../skapa/forhandTolk.ts";

const MS = (uiJson as unknown as { tider_ms: Record<string, number> }).tider_ms.holo_omritning ?? 180;

export function useForhandArk(arkRef: RefObject<HTMLElement | null>, text: string, paAngen: boolean) {
  useEffect(() => {
    if (!paAngen) return;
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
  }, [paAngen, arkRef]);
  useEffect(() => {
    if (!paAngen) return;
    const t = window.setTimeout(() => {
      const s = useMinne.getState();
      if (s.plats !== START_PLATS) return;
      const f = forhandFor(text, s.ang, s.garden, oppnaTomter(useDal.getState().utbyggnader));
      const forra = forhand.lage().ring;
      forhand.visa(f.spec, f.nyckel, f.ring);
      // Ett bygge hamnar på en tomt som kanske inte syns: kameran glider dit (samma som efter Trolla).
      if (f.spec?.typ === "bygg" && f.ring && (forra?.x !== f.ring.x || forra?.z !== f.ring.z)) dalStyr.fokusera(f.ring.x, f.ring.z, f.ring.z < -1 ? DALEN.kamera.vy_bak : DALEN.kamera.vy_fram);
    }, MS);
    return () => window.clearTimeout(t);
  }, [text, paAngen]);
}
